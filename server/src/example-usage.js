const wsServer = require('./websocket/wsServer');

// 广播消息给所有客户端
function broadcastNotification(message) {
    wsServer.broadcast({
        type: 'notification',
        data: message
    });
}

// 发送消息给特定客户端
function sendPrivateMessage(clientId, message) {
    wsServer.sendTo(clientId, {
        type: 'private',
        data: message
    });
}

// 获取当前连接数
function getOnlineUsers() {
    return wsServer.getConnectionCount();
} 