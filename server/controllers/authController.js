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

// Google Sign-In Hosted OAuth Webpage for Mobile & Web clients
function googleSignInPage(req, res) {
  const firebaseApiKey = process.env.FIREBASE_API_KEY || 'AIzaSyA_GameLoot_2026_LiveKeySecureX9';
  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || 'gameloot-app';
  const googleClientId = process.env.GOOGLE_CLIENT_ID || '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Google Sign-In - GameLoot</title>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
  <script src="https://accounts.google.com/gsi/client" async defer></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #090d16;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      background: #151722;
      border: 1px solid #23263b;
      border-radius: 24px;
      padding: 32px 24px;
      width: 100%;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }
    .logo {
      width: 56px;
      height: 56px;
      margin: 0 auto 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(81, 123, 253, 0.3);
    }
    .logo svg { width: 30px; height: 30px; }
    h1 {
      font-size: 22px;
      font-weight: 800;
      margin-bottom: 6px;
      color: #ffffff;
    }
    p {
      color: #979caf;
      font-size: 13px;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .btn-google {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      background: #ffffff;
      color: #0b0c12;
      font-weight: 700;
      font-size: 14px;
      padding: 14px 20px;
      border-radius: 14px;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }
    .btn-google:hover {
      background: #f1f3f4;
      transform: translateY(-1px);
    }
    .btn-google:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .status-box {
      margin-top: 16px;
      font-size: 12px;
      color: #979caf;
      min-height: 24px;
    }
    .status-box.error { color: #f87171; }
    .status-box.success { color: #34d399; }
    .btn-cancel {
      margin-top: 20px;
      background: transparent;
      border: none;
      color: #686d82;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      padding: 8px;
    }
    .btn-cancel:hover { color: #979caf; }
    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(81, 123, 253, 0.3);
      border-radius: 50%;
      border-top-color: #517bfd;
      animation: spin 0.8s linear infinite;
      vertical-align: middle;
      margin-right: 8px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <svg viewBox="0 0 24 24">
        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
      </svg>
    </div>
    <h1>Sign in with Google</h1>
    <p>Sign in to your authentic Google Account to sync your GameLoot progress & rewards.</p>

    <div id="g_id_onload"
      data-client_id="${googleClientId}"
      data-callback="handleCredentialResponse"
      data-auto_prompt="false">
    </div>
    <div id="g_id_signin" style="display: flex; justify-content: center; margin-bottom: 12px;"></div>

    <button id="googleBtn" class="btn-google" onclick="triggerGoogleSignIn()">
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
      </svg>
      <span>Choose Google Account</span>
    </button>

    <div id="statusBox" class="status-box"></div>

    <button class="btn-cancel" onclick="cancelSignIn()">Cancel</button>
  </div>

  <script>
    const firebaseConfig = {
      apiKey: "${firebaseApiKey}",
      authDomain: "${firebaseProjectId}.firebaseapp.com",
      projectId: "${firebaseProjectId}"
    };

    if (!firebase.apps.length) {
      try { firebase.initializeApp(firebaseConfig); } catch(e) {}
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');

    function setStatus(msg, isError, isSpinning) {
      const box = document.getElementById('statusBox');
      box.className = 'status-box' + (isError ? ' error' : (isSpinning ? '' : ' success'));
      box.innerHTML = (isSpinning ? '<span class="spinner"></span>' : '') + msg;
    }

    async function syncBackend(googleUser) {
      setStatus('Synchronizing with GameLoot...', false, true);
      try {
        const res = await fetch('/api/auth/user/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: googleUser.email,
            name: googleUser.displayName || googleUser.name,
            google_id: googleUser.uid || googleUser.sub,
            avatar: googleUser.photoURL || googleUser.picture
          })
        });

        const data = await res.json();
        if (data.success && data.token) {
          setStatus('Authentication verified! Loading GameLoot...', false, false);
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'GOOGLE_AUTH_SUCCESS',
              token: data.token,
              user: data.user
            }));
          }
        } else {
          setStatus(data.message || 'Server authentication failed', true, false);
        }
      } catch (err) {
        setStatus('Connection error: ' + err.message, true, false);
      }
    }

    // Google Identity Services (GIS) Callback
    function handleCredentialResponse(response) {
      try {
        const payload = JSON.parse(atob(response.credential.split('.')[1]));
        if (payload && payload.email) {
          syncBackend({
            email: payload.email,
            name: payload.name,
            uid: payload.sub,
            photoURL: payload.picture
          });
        }
      } catch (e) {
        setStatus('Credential error: ' + e.message, true, false);
      }
    }

    // Firebase Google Sign In Trigger
    async function triggerGoogleSignIn() {
      const btn = document.getElementById('googleBtn');
      btn.disabled = true;
      setStatus('Opening Google Account Sign-In...', false, true);

      try {
        const result = await firebase.auth().signInWithPopup(provider);
        if (result && result.user && result.user.email) {
          await syncBackend({
            email: result.user.email,
            displayName: result.user.displayName,
            uid: result.user.uid,
            photoURL: result.user.photoURL
          });
        }
      } catch (err) {
        btn.disabled = false;
        if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
          setStatus('Please sign in through the Google prompt window.', false, false);
        } else {
          setStatus('Google Sign-In: ' + (err.message || 'Authentication was cancelled'), true, false);
        }
      }
    }

    function cancelSignIn() {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'GOOGLE_AUTH_CANCEL' }));
      }
    }

    window.addEventListener('load', () => {
      const clientId = "${googleClientId}";
      if (clientId && window.google && window.google.accounts && window.google.accounts.id) {
        try {
          google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse
          });
          google.accounts.id.renderButton(
            document.getElementById('g_id_signin'),
            { theme: 'outline', size: 'large', width: 340 }
          );
        } catch (_) {}
      }
    });
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
  googleSignInPage
};
