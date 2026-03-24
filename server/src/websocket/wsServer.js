const WebSocket = require('ws');
const events = require('events');

var clientId;

class WebSocketServer extends events.EventEmitter {
    constructor() {
        super();
        this.wss = null;
        this.clients = new Map(); // 存储所有连接的客户端
    }

    // 初始化 WebSocket 服务器
    initialize(server) {
        this.wss = new WebSocket.Server({ server });

        this.wss.on('connection', (ws, req) => {
            clientId = this.generateClientId()
            this.clients.set(clientId, ws);

            // 设置连接属性
            ws.clientId = clientId;
            ws.isAlive = true;

            // 心跳检测
            ws.on('pong', () => {
                ws.isAlive = true;
            });

            // 处理消息
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.emit('message', {
                        clientId,
                        data,
                        ws
                    });
                } catch (error) {
                    console.error('Invalid message format:', error);
                }
            });

            // 处理关闭连接
            ws.on('close', () => {
                this.clients.delete(clientId);
                this.emit('clientDisconnected', clientId);
            });

            // 触发客户端连接事件
            this.emit('clientConnected', {
                clientId,
                ws,
                req
            });
        });

        // 设置心跳检测间隔
        this.heartbeat();
    }

    // 生成唯一的客户端ID
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }

    getCurrentClientId() { 
        return clientId;
    }


    // 向特定客户端发送消息
    sendTo(clientId, message) {
        const client = this.clients.get(clientId);
        if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    // 广播消息给所有客户端
    broadcast(message, excludeClientId = null) {
        this.clients.forEach((client, clientId) => {
            if (clientId !== excludeClientId && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }

    // 心跳检测
    heartbeat() {
        setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    this.clients.delete(ws.clientId);
                    return ws.terminate();
                }
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000); // 30秒检测一次
    }

    // 获取当前连接数
    getConnectionCount() {
        return this.clients.size;
    }

    // 获取所有客户端ID
    getClientIds() {
        return Array.from(this.clients.keys());
    }
}

// 创建单例实例
const wsServer = new WebSocketServer();
module.exports = wsServer; 