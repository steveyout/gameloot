const { Op } = require('sequelize');
const { Notification, NotificationRead, User, PointTransaction } = require('../models');
const { broadcastClientNotification } = require('../services/socket');

// --- ADMIN CONTROLLERS ---

async function getAdminNotifications(req, res) {
  try {
    const notifications = await Notification.findAll({
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'recipient', attributes: ['id', 'username', 'email'] },
        { model: NotificationRead, as: 'reads', attributes: ['id', 'is_read', 'is_claimed'] }
      ]
    });

    const formatted = notifications.map(n => {
      const readsList = n.reads || [];
      const readCount = readsList.filter(r => r.is_read).length;
      const claimedCount = readsList.filter(r => r.is_claimed).length;

      return {
        ...n.toJSON(),
        read_count: readCount,
        claimed_count: claimedCount,
        recipient_username: n.recipient?.username || null
      };
    });

    return res.json({ success: true, notifications: formatted });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications', error: err.message });
  }
}

async function createAdminNotification(req, res) {
  try {
    const {
      title,
      message,
      type = 'announcement',
      bonus_points = 0,
      action_screen = null,
      target_audience = 'all',
      user_id = null
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    let targetUserId = null;
    if (target_audience === 'specific') {
      if (!user_id) {
        return res.status(400).json({ success: false, message: 'Target user ID is required for specific targeting' });
      }
      const targetUser = await User.findByPk(user_id);
      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'Target player not found' });
      }
      targetUserId = targetUser.id;
    }

    const senderAdmin = req.admin?.username || 'Admin';

    const newNotification = await Notification.create({
      title: title.trim(),
      message: message.trim(),
      type,
      bonus_points: Math.max(0, parseInt(bonus_points, 10) || 0),
      action_screen: action_screen || null,
      target_audience,
      user_id: targetUserId,
      sender_admin: senderAdmin
    });

    // Broadcast in real-time to active mobile apps via WebSockets!
    broadcastClientNotification({
      id: newNotification.id,
      title: newNotification.title,
      message: newNotification.message,
      type: newNotification.type,
      bonus_points: newNotification.bonus_points,
      action_screen: newNotification.action_screen,
      sender_admin: newNotification.sender_admin,
      created_at: newNotification.created_at
    }, targetUserId);

    return res.status(201).json({
      success: true,
      message: 'Notification successfully broadcasted to players!',
      notification: newNotification
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to broadcast notification', error: err.message });
  }
}

async function deleteAdminNotification(req, res) {
  try {
    const { id } = req.params;
    const notification = await Notification.findByPk(id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await notification.destroy();
    return res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete notification', error: err.message });
  }
}


// --- CLIENT MOBILE CONTROLLERS ---

async function getClientNotifications(req, res) {
  try {
    const userId = req.user.userId;

    const notifications = await Notification.findAll({
      where: {
        [Op.or]: [
          { user_id: null }, // global broadcast
          { user_id: userId } // direct targeted to this user
        ]
      },
      order: [['created_at', 'DESC']],
      limit: 30
    });

    const notifIds = notifications.map(n => n.id);
    const readRows = await NotificationRead.findAll({
      where: {
        notification_id: notifIds,
        user_id: userId
      }
    });

    const readMap = {};
    readRows.forEach(r => {
      readMap[r.notification_id] = {
        is_read: r.is_read,
        is_claimed: r.is_claimed
      };
    });

    let unreadCount = 0;
    const mapped = notifications.map(n => {
      const readState = readMap[n.id] || { is_read: false, is_claimed: false };
      if (!readState.is_read) unreadCount++;

      return {
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        bonus_points: n.bonus_points,
        action_screen: n.action_screen,
        sender_admin: n.sender_admin,
        created_at: n.created_at,
        is_read: readState.is_read,
        is_claimed: readState.is_claimed
      };
    });

    return res.json({
      success: true,
      notifications: mapped,
      unread_count: unreadCount
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load notifications', error: err.message });
  }
}

async function markNotificationRead(req, res) {
  try {
    const userId = req.user.userId;
    const { notification_id } = req.body;

    if (!notification_id) {
      return res.status(400).json({ success: false, message: 'notification_id required' });
    }

    const [row, created] = await NotificationRead.findOrCreate({
      where: { notification_id, user_id: userId },
      defaults: { is_read: true, is_claimed: false }
    });

    if (!created && !row.is_read) {
      row.is_read = true;
      await row.save();
    }

    return res.json({ success: true, message: 'Marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to mark read', error: err.message });
  }
}

async function markAllNotificationsRead(req, res) {
  try {
    const userId = req.user.userId;

    const notifications = await Notification.findAll({
      where: {
        [Op.or]: [
          { user_id: null },
          { user_id: userId }
        ]
      },
      attributes: ['id']
    });

    for (const n of notifications) {
      await NotificationRead.findOrCreate({
        where: { notification_id: n.id, user_id: userId },
        defaults: { is_read: true, is_claimed: false }
      });
      await NotificationRead.update(
        { is_read: true },
        { where: { notification_id: n.id, user_id: userId } }
      );
    }

    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to mark all read', error: err.message });
  }
}

async function claimNotificationBonus(req, res) {
  try {
    const userId = req.user.userId;
    const { notification_id } = req.body;

    if (!notification_id) {
      return res.status(400).json({ success: false, message: 'notification_id required' });
    }

    const notification = await Notification.findByPk(notification_id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (!notification.bonus_points || notification.bonus_points <= 0) {
      return res.status(400).json({ success: false, message: 'No bonus points attached to this notification' });
    }

    // Check if user already claimed
    const readRow = await NotificationRead.findOne({
      where: { notification_id, user_id: userId }
    });

    if (readRow && readRow.is_claimed) {
      return res.status(400).json({ success: false, message: 'Bonus points have already been claimed' });
    }

    // Credit user points
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const pts = notification.bonus_points;
    user.points_balance += pts;
    user.total_earned += pts;
    await user.save();

    // Create transaction log
    await PointTransaction.create({
      user_id: user.id,
      type: 'bonus_reward',
      amount: pts,
      balance_after: user.points_balance,
      description: `Admin Bonus Drop: ${notification.title}`,
      reference_id: `NOTIF-${notification.id}`
    });

    // Mark as claimed and read
    if (readRow) {
      readRow.is_claimed = true;
      readRow.is_read = true;
      readRow.claimed_at = new Date();
      await readRow.save();
    } else {
      await NotificationRead.create({
        notification_id,
        user_id: userId,
        is_read: true,
        is_claimed: true,
        claimed_at: new Date()
      });
    }

    return res.json({
      success: true,
      message: `Successfully claimed +${pts} PTS bonus!`,
      points_claimed: pts,
      new_balance: user.points_balance
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to claim bonus', error: err.message });
  }
}

module.exports = {
  getAdminNotifications,
  createAdminNotification,
  deleteAdminNotification,
  getClientNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  claimNotificationBonus
};
