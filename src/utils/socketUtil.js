/**
 * ===================================================================================================================
 * @module
 * @desc WEB SOCKET 模块，用于多人协同作业模式下锁定章节
 * @author sam 2021-10-09
 * ===================================================================================================================
 */
'use strict';
import $global from './global';
import $bus from './bus';

export default class socketUtil {
    constructor(origin = "", params = {}) {
        this.origin = origin;
        this.socketId = 'user_' + params.userId; // 客户端ID
        this.clientName = params.userName || ''; // 用户名登录
        this.lockReconnect = false; // 避免重复连接
        this.releaseClose = false; // 完全关闭连接
        this.initSocket(); // 初始化SOCKET
    }

    /**
     * @description 初始化SOCKET
     */
    initSocket() {
        this.socketHandler = new WebSocket(this.origin); // 实例化socket对象
        // 开始连接
        this.socketHandler.onopen = () => {
            if (this.socketHandler.readyState === 1) {
                let msg = {
                    clientId: this.socketId,
                    type: 'connect',
                    content: ''
                }
                this.socketHandler.send(JSON.stringify(msg));
                console.log('%c%s', 'color:purple;', `=============SOCKET服务器已连接:${this.origin}=============`);
            }
        }
        // 接收消息
        this.socketHandler.onmessage = msg => {
            // console.log('接收到消息', msg.data);
            if (msg && msg.data && $global.isJSON(msg.data)) {
                let message = JSON.parse(msg.data);
                $bus.$emit('onMsg', message);
            }
        };
        //关闭事件
        this.socketHandler.onclose = () => {
            console.log('%c%s', 'color:red;', this.releaseClose ? "socket已关闭, 停止连接..." : "socket已关闭, 开始重新连接...");
            if (!this.releaseClose) {
                this.reconnect();
            }
        };
        // 发生错误
        this.socketHandler.onerror = () => {
            console.log('%c%s', 'color:red;', "socket发生了错误, 开始重新连接...");
            this.reconnect();
        }
    }

    /**
     * @description 重新连接
     */
    reconnect() {
        if (this.lockReconnect || this.releaseClose) return;
        this.lockReconnect = true;
        // 没连接上会一直重连，设置延迟避免请求过多
        setTimeout(() => {
            this.initSocket();
            this.lockReconnect = false;
        }, 2000);
    }

    /**
     * @description 客户端主动关闭socket连接
     * @param {Boolean} flag 是否真实关闭连接
     */
    closeSocket(flag = false) {
        this.releaseClose = flag;
        this.socketHandler.close();
        this.socketHandler = null;
        console.log('%c%s', 'color:red;', "socket客户端已关闭", flag);
    }

    replaceId(id) {
        return id.replace(/\user_/g, '');
    }

    /**
     * @description 发送消息
     * @param{String} message
     */
    aiSendMsg(message="", action="") {
        var msg = {
            clientId: this.socketId,
            clientName: this.clientName || '',
            type: 'send',
    		action,
            content: message
        };

    	console.log('socket aiSendMsg===>', msg)
        msg = JSON.stringify(msg);
        this.socketHandler.send(msg);
    }

    /**
     * @description 发送消息
     * @param{String} message
     */
    sendMsg(message="", action="") {
        var msg = {
            clientId: this.socketId,
            clientName: this.clientName || '',
            type: 'send',
			action,
            content: message
        };

		console.log('socket send message===>', msg)
        msg = JSON.stringify(msg);
        this.socketHandler.send(msg);
    }
}
