const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Admin, User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'gameloot_super_secret_jwt_key_2026_cyberloot';

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
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

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
    const { email, name, google_id, avatar, device_id } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Google email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await User.findOne({
      where: google_id ? {
        [Op.or]: [
          { google_id: String(google_id) },
          { email: cleanEmail }
        ]
      } : { email: cleanEmail }
    });

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    if (user) {
      if (user.status === 'banned') {
        return res.status(403).json({ success: false, message: 'Account banned from GameLoot' });
      }
      if (google_id && !user.google_id) user.google_id = String(google_id);
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

      user = await User.create({
        username,
        email: cleanEmail,
        google_id: google_id ? String(google_id) : `google_${Date.now()}`,
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
    return res.status(500).json({ success: false, message: 'Google authentication error', error: err.message });
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

module.exports = {
  adminLogin,
  adminMe,
  userRegister,
  userLogin,
  userGoogleLogin,
  userMe
};
