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
