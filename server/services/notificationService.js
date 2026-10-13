const socketService = require('./socket');

module.exports = {
  ...socketService,
  sendNotification: socketService.sendNotification,
  broadcastAdmin: socketService.broadcastAdmin,
  broadcastClientNotification: socketService.broadcastClientNotification,
  broadcastAppUpdate: socketService.broadcastAppUpdate
};
