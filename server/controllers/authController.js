const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Admin, User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'gameloot_super_secret_jwt_key_2026_cyberloot';

function getClientIp(req) {
  const rawIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  return String(rawIp).split(',')[0].trim().slice(0, 45);
}

// Admin Login
async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const admin = await Admin.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isValid = await admin.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { adminId: admin.id, username: admin.username, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        avatar: admin.avatar
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Authentication error', error: err.message });
  }
}

// Admin Me
async function adminMe(req, res) {
  try {
    const admin = await Admin.findByPk(req.admin.adminId, {
      attributes: ['id', 'username', 'email', 'role', 'avatar', 'created_at']
    });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    return res.json({ success: true, admin });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving profile', error: err.message });
  }
}

// User Register (Player)
async function userRegister(req, res) {
  try {
    const { username, email, password, device_id } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email and password required' });
    }

    const existing = await User.findOne({
      where: {
        [Op.or]: [
          { email: email.trim().toLowerCase() },
          { username: username.trim() }
        ]
      }
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Username or email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const ip = getClientIp(req);

    const newUser = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password_hash: hash,
      points_balance: 100,
      tickets_balance: 5,
      total_earned: 100,
      status: 'active',
      device_id: device_id || null,
      ip_address: ip
    });

    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        points_balance: 100,
        tickets_balance: 5,
        total_earned: 100
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Registration failed', error: err.message });
  }
}

// User Login (Player)
async function userLogin(req, res) {
  try {
    const { emailOrUsername, username, email, password } = req.body;
    const identifier = (emailOrUsername || username || email || '').trim();
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Email/Username and password required' });
    }

    const isEmail = identifier.includes('@');
    const user = await User.findOne({
      where: isEmail ? { email: identifier.toLowerCase() } : { username: identifier }
    });

    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    if (user.status === 'banned') {
      return res.status(403).json({ success: false, message: 'Account banned from GameLoot' });
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });

    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        points_balance: user.points_balance,
        tickets_balance: user.tickets_balance,
        total_earned: user.total_earned,
        status: user.status
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Login failed', error: err.message });
  }
}

// User Google OAuth Login (Player)
async function userGoogleLogin(req, res) {
  try {
    const { email, name, google_id, googleId, avatar, device_id } = req.body;
    const finalGoogleId = google_id || googleId || null;

    if (!email || !String(email).trim()) {
      return res.status(400).json({ success: false, message: 'Google email is required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    let user = await User.findOne({
      where: finalGoogleId ? {
        [Op.or]: [
          { google_id: String(finalGoogleId) },
          { email: cleanEmail }
        ]
      } : { email: cleanEmail }
    });

    const ip = getClientIp(req);

    if (user) {
      if (user.status === 'banned') {
        return res.status(403).json({ success: false, message: 'Account banned from GameLoot' });
      }
      if (finalGoogleId && !user.google_id) user.google_id = String(finalGoogleId);
      if (avatar && (!user.avatar || user.avatar.includes('dicebear'))) user.avatar = avatar;
      await user.save();
    } else {
      const baseName = (name || cleanEmail.split('@')[0])
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase() || 'player';
      const randSuffix = Math.floor(100 + Math.random() * 900);
      let username = `${baseName}_${randSuffix}`;

      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        username = `${baseName}_${Date.now().toString().slice(-4)}`;
      }

      // Generate a secure random password hash for Google OAuth users to satisfy NOT NULL constraints
      const randomSecret = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const oauthPasswordHash = await bcrypt.hash(randomSecret, 10);

      user = await User.create({
        username,
        email: cleanEmail,
        password_hash: oauthPasswordHash,
        google_id: finalGoogleId ? String(finalGoogleId) : `google_${Date.now()}`,
        avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        points_balance: 100, // Welcome bonus
        tickets_balance: 5,
        total_earned: 100,
        status: 'active',
        device_id: device_id || null,
        ip_address: ip
      });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      message: 'Google login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        points_balance: user.points_balance,
        tickets_balance: user.tickets_balance,
        total_earned: user.total_earned,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Google OAuth Login error:', err);
    return res.status(500).json({ success: false, message: 'Google authentication error: ' + err.message, error: err.message });
  }
}

// User Profile (Player Me)
async function userMe(req, res) {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: ['id', 'username', 'email', 'avatar', 'points_balance', 'tickets_balance', 'total_earned', 'total_withdrawn', 'status', 'created_at']
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile', error: err.message });
  }
}

// Direct Google OAuth 2.0 Flow - Direct to Google, NO Firebase redirect
function googleAuthStart(req, res) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID || '854151275080-m8kjng2jotbflnuir8ooq5ibhmgguaj0.apps.googleusercontent.com';
  const host = req.get('host');
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  // Standard Server-side Authorization Code flow if secret exists
  if (process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CLIENT_SECRET.trim()) {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(googleClientId.trim())}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&access_type=offline` +
      `&prompt=select_account`;

    return res.redirect(googleAuthUrl);
  }

  // OpenID Connect / Implicit Flow if secret is not set (Direct to Google, NO Firebase redirect)
  const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(googleClientId.trim())}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=${encodeURIComponent('token id_token')}` +
    `&scope=${encodeURIComponent('openid email profile')}` +
    `&nonce=${encodeURIComponent(nonce)}` +
    `&prompt=select_account`;

  return res.redirect(googleAuthUrl);
}

// Alias /google/signin to direct Google OAuth flow
function googleSignInPage(req, res) {
  return googleAuthStart(req, res);
}

// Google OAuth 2.0 Callback Handler
async function googleAuthCallback(req, res) {
  const { code, error, error_description } = req.query;

  if (error) {
    const errorMsg = error_description || error || 'Google sign-in was cancelled';
    return res.redirect(`gameloot://auth?error=${encodeURIComponent(errorMsg)}`);
  }

  // If authorization code is present and client secret is configured, exchange server-side
  if (code && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CLIENT_SECRET.trim()) {
    const googleClientId = process.env.GOOGLE_CLIENT_ID || '854151275080-m8kjng2jotbflnuir8ooq5ibhmgguaj0.apps.googleusercontent.com';
    const host = req.get('host');
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: googleClientId,
          client_secret: process.env.GOOGLE_CLIENT_SECRET.trim(),
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        }).toString()
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok || !tokenData.access_token) {
        console.error('Google token exchange error:', tokenData);
        return res.redirect(`gameloot://auth?error=${encodeURIComponent(tokenData.error_description || 'Failed to exchange Google OAuth code')}`);
      }

      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });

      const profile = await profileResponse.json();

      if (!profile || !profile.email) {
        return res.redirect(`gameloot://auth?error=${encodeURIComponent('Could not retrieve Google profile email')}`);
      }

      const cleanEmail = String(profile.email).trim().toLowerCase();
      const googleId = profile.sub || profile.id;
      const name = profile.name || cleanEmail.split('@')[0];
      const avatar = profile.picture;
      const ip = getClientIp(req);

      let user = await User.findOne({
        where: {
          [Op.or]: [
            { google_id: String(googleId) },
            { email: cleanEmail }
          ]
        }
      });

      if (user) {
        if (user.status === 'banned') {
          return res.redirect(`gameloot://auth?error=${encodeURIComponent('Account banned from GameLoot')}`);
        }
        if (!user.google_id) user.google_id = String(googleId);
        if (avatar && (!user.avatar || user.avatar.includes('dicebear'))) user.avatar = avatar;
        await user.save();
      } else {
        const baseName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'player';
        const randSuffix = Math.floor(100 + Math.random() * 900);
        let username = `${baseName}_${randSuffix}`;

        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
          username = `${baseName}_${Date.now().toString().slice(-4)}`;
        }

        const randomSecret = Math.random().toString(36).slice(2) + Date.now().toString(36);
        const oauthPasswordHash = await bcrypt.hash(randomSecret, 10);

        user = await User.create({
          username,
          email: cleanEmail,
          password_hash: oauthPasswordHash,
          google_id: String(googleId),
          avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
          points_balance: 100,
          tickets_balance: 5,
          total_earned: 100,
          status: 'active',
          ip_address: ip
        });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username, email: user.email },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      const safeUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        points_balance: user.points_balance,
        tickets_balance: user.tickets_balance,
        total_earned: user.total_earned,
        status: user.status
      };

      const deepLink = `gameloot://auth?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(safeUser))}`;

      const returnHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Authentication Successful - GameLoot</title>
  <style>
    body { background: #090d16; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; padding: 20px; }
    .card { background: #151722; border: 1px solid #23263b; padding: 32px 24px; border-radius: 20px; max-width: 360px; width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    h2 { font-size: 20px; margin-bottom: 8px; color: #34d399; }
    p { color: #979caf; font-size: 13px; margin-bottom: 24px; }
    .btn { display: block; width: 100%; padding: 14px; background: #517bfd; color: #fff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; box-sizing: border-box; }
  </style>
</head>
<body>
  <div class="card">
    <h2>✓ Sign-In Verified!</h2>
    <p>Welcome back, ${user.username}! Returning to GameLoot...</p>
    <a href="${deepLink}" class="btn">Open GameLoot</a>
  </div>
  <script>
    window.location.href = "${deepLink}";
  </script>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html');
      return res.send(returnHtml);
    } catch (err) {
      console.error('Google callback error:', err);
      return res.redirect(`gameloot://auth?error=${encodeURIComponent(err.message || 'Internal authentication error')}`);
    }
  }

  // If no code, or implicit flow (tokens in hash fragment #id_token=...):
  // Render lightweight client-side receiver page that parses hash, logs in, and deep-links to gameloot://auth
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Verifying Google Sign-In - GameLoot</title>
  <style>
    body {
      background-color: #090d16;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
      text-align: center;
    }
    .card {
      background: #151722;
      border: 1px solid #23263b;
      border-radius: 24px;
      padding: 32px 24px;
      width: 100%;
      max-width: 360px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 3px solid rgba(81, 123, 253, 0.2);
      border-radius: 50%;
      border-top-color: #517bfd;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { font-size: 19px; font-weight: 800; margin-bottom: 8px; color: #fff; }
    p { font-size: 13px; color: #979caf; line-height: 1.5; margin-bottom: 20px; }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      background: #517bfd;
      color: #ffffff;
      font-weight: 700;
      font-size: 14px;
      padding: 13px 20px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      text-decoration: none;
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <div class="card">
    <div id="spinner" class="spinner"></div>
    <h2 id="titleText">Signing In...</h2>
    <p id="statusMsg">Completing authentication and returning to GameLoot...</p>
    <a id="openBtn" href="gameloot://auth" class="btn" style="display: none;">Tap to Open GameLoot</a>
  </div>

  <script>
    function parseParams(str) {
      const params = {};
      const pairs = (str || '').split('&');
      for (let i = 0; i < pairs.length; i++) {
        const parts = pairs[i].split('=');
        if (parts.length === 2) {
          params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1].replace(/\+/g, ' '));
        }
      }
      return params;
    }

    function base64UrlDecode(str) {
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      return JSON.parse(decodeURIComponent(escape(atob(base64))));
    }

    async function processAuth() {
      const hashStr = window.location.hash.substring(1);
      const queryStr = window.location.search.substring(1);

      const params = { ...parseParams(queryStr), ...parseParams(hashStr) };

      if (params.error) {
        document.getElementById('spinner').style.display = 'none';
        document.getElementById('titleText').innerText = 'Authentication Cancelled';
        document.getElementById('statusMsg').innerText = params.error_description || params.error;
        window.location.href = 'gameloot://auth?error=' + encodeURIComponent(params.error_description || params.error);
        return;
      }

      let googleUser = null;

      // Extract user from id_token
      if (params.id_token) {
        try {
          const parts = params.id_token.split('.');
          if (parts.length >= 2) {
            const payload = base64UrlDecode(parts[1]);
            if (payload && payload.email) {
              googleUser = {
                email: payload.email,
                name: payload.name || payload.given_name,
                google_id: payload.sub,
                avatar: payload.picture
              };
            }
          }
        } catch (e) {
          console.warn('ID token decode error:', e);
        }
      }

      // Or fetch from userinfo if access_token exists
      if (!googleUser && params.access_token) {
        try {
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: 'Bearer ' + params.access_token }
          });
          const info = await res.json();
          if (info && info.email) {
            googleUser = {
              email: info.email,
              name: info.name || info.given_name,
              google_id: info.sub || info.id,
              avatar: info.picture
            };
          }
        } catch (e) {
          console.warn('UserInfo fetch error:', e);
        }
      }

      if (googleUser && googleUser.email) {
        try {
          const res = await fetch('/api/auth/user/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(googleUser)
          });
          const data = await res.json();

          if (data.success && data.token) {
            document.getElementById('spinner').style.display = 'none';
            document.getElementById('titleText').innerText = '✓ Welcome, ' + data.user.username + '!';
            document.getElementById('statusMsg').innerText = 'Returning to GameLoot...';

            const deepLink = 'gameloot://auth?token=' + encodeURIComponent(data.token) + '&user=' + encodeURIComponent(JSON.stringify(data.user));
            const openBtn = document.getElementById('openBtn');
            openBtn.href = deepLink;
            openBtn.style.display = 'inline-flex';

            window.location.href = deepLink;
            return;
          } else {
            throw new Error(data.message || 'Server authentication failed');
          }
        } catch (err) {
          document.getElementById('spinner').style.display = 'none';
          document.getElementById('titleText').innerText = 'Sign-In Error';
          document.getElementById('statusMsg').innerText = err.message;
          window.location.href = 'gameloot://auth?error=' + encodeURIComponent(err.message);
          return;
        }
      }

      // No tokens found
      document.getElementById('spinner').style.display = 'none';
      document.getElementById('titleText').innerText = 'Notice';
      document.getElementById('statusMsg').innerText = 'No authentication credentials received.';
      window.location.href = 'gameloot://auth?cancel=true';
    }

    window.addEventListener('load', processAuth);
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
}

module.exports = {
  adminLogin,
  adminMe,
  userRegister,
  userLogin,
  userGoogleLogin,
  userMe,
  googleAuthStart,
  googleAuthCallback,
  googleSignInPage
};
