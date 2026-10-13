let ioInstance = null;

function initSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    // Join admin room if requested
    socket.on('join_admin', () => {
      socket.join('admin_channel');
      socket.emit('joined_admin', { status: 'connected', time: new Date() });
    });

    // Join client user room for personalized and broadcast notifications
    socket.on('join_client', (data) => {
      socket.join('client_broadcast');
      if (data && data.userId) {
        socket.join(`user_${data.userId}`);
      }
      socket.emit('client_connected', { status: 'ready', time: new Date() });
    });

    socket.on('disconnect', () => {
      // Disconnected
    });
  });
}

function broadcastAdmin(event, payload) {
  if (ioInstance) {
    ioInstance.to('admin_channel').emit(event, payload);
    ioInstance.emit(event, payload);
  }
}

function sendNotification({ title, message, type = 'info', meta = {} }) {
  const notification = {
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    title,
    message,
    type, // 'cashout', 'fraud', 'session', 'info', 'success'
    meta,
    created_at: new Date().toISOString()
  };

  broadcastAdmin('new_notification', notification);
  return notification;
}

function broadcastClientNotification(notification, targetUserId = null) {
  if (!ioInstance) return;

  if (targetUserId) {
    ioInstance.to(`user_${targetUserId}`).emit('client_notification', notification);
  } else {
    ioInstance.to('client_broadcast').emit('client_notification', notification);
    ioInstance.emit('client_notification', notification);
  }

  // Also notify admin feed that a broadcast went out
  broadcastAdmin('broadcast_sent', notification);
}

function broadcastAppUpdate(updateData) {
  if (ioInstance) {
    ioInstance.emit('app_force_update', updateData);
  }
}

module.exports = {
  broadcastAppUpdate,
  initSocket,
  broadcastAdmin,
  sendNotification,
  broadcastClientNotification,
  getIO: () => ioInstance
};
