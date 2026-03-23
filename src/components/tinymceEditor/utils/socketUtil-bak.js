
/**
 * ===================================================================================================================
 * @module
 * @desc WEB SOCKET 模块，用于多人协同作业模式下锁定章节
 * @author sam 2021-10-09
 * ===================================================================================================================
 */
'use strict';
import $global from '@/utils/global';
import $bus from '@/utils/bus';

export default {
    socketHandler: null,
    socketId: "123",
	clientName: "",
    lockReconnect: false, // 避免重复连接
    // 初始化SOCKET
    initSocket(origin="", params={}) {
        this.socketId = 'user_' + params.userId;
        this.clientName = params.userName;
        this.socketHandler = new WebSocket(origin);
        this.socketHandler.onopen = () => {
            if (this.socketHandler.readyState === 1) {
                let msg = {
                    clientId: this.socketId,
                    type: 'LOGIN',
                }
                this.socketHandler.send(JSON.stringify(msg));
                console.log('%c%s', 'color:purple;', `=============SOCKET服务器已连接:${origin}=============`);
            }
        }

        this.socketHandler.onmessage = (msg) => {
            if (msg && msg.data && $global.isJSON(msg.data)) {
                let message = JSON.parse(msg.data);
                if(message.type == "ALL" || message.type == "REQ"){
                    console.info('%c%s', 'color:purple;', "socket message=>", message)
                    $bus.$emit('locked', message.t);
                }
            }
        };
        //关闭事件
        this.socketHandler.onclose = () => {
            console.log('%c%s', 'color:red;',"socket已关闭");
        };
        //发生了错误事件
        this.socketHandler.onerror = () => {
            console.log('%c%s', 'color:red;', "socket发生了错误, 开始重新连接...");
            this.reconnect(origin, params);
        }
    },
    // 重新连接
    reconnect(origin='', params={}) {
        if (this.lockReconnect) return;
        this.lockReconnect = true;
        // 没连接上会一直重连，设置延迟避免请求过多
        setTimeout(() => {
            this.initSocket(origin, params);
            this.lockReconnect = false;
        }, 2000);
    },
    // SOCKET心跳检测
    heartCheck() {

    },

    // 客户端主动关闭socket连接
    closeSocket() {
        this.socketHandler.close();
        this.socketHandler = null;
        console.log('%c%s', 'color:red;', "socket客户端已关闭");
    },
    // 锁住文档章节
    lockDoc(data={}) {
        data.type = 'ALL';
        data.lockDoc = true;
        var msg = JSON.stringify(data);
        this.socketHandler.send(msg);
    },

    /**
     * @description 发送更新章节的消息
     */
    putSaved(oulineData={}) {
        var msg = {
            docId: oulineData.docId,
            clientId: this.socketId,
        	clientName: this.clientName,
            locked: oulineData.outlineId,
            type: 'ALL',
            saved: true
        };
        msg = JSON.stringify(msg);
        this.socketHandler.send(msg);
        console.info('%c%s', 'color:purple;', "发送更新章节=>", msg);
    },

    /**
     * @description 发送解锁、锁定章节消息
     *
     */
    sendMsg(lockedOutline=null, unlockedOutline=null) {
        var msg = {
            docId: lockedOutline.docId,
            clientId: this.socketId,
			clientName: this.clientName,
            type: 'ALL',
            locked: lockedOutline.outlineId,
			lockedTitle: lockedOutline.outlineTitle
        };
        if (unlockedOutline) {
			if (lockedOutline.outlineId === unlockedOutline.locked) {
				delete msg.locked;
			}
            msg.unlocked = unlockedOutline.locked;
			msg.unlockedTitle = unlockedOutline.lockedTitle;
        }
        msg = JSON.stringify(msg);
        console.info('%c%s', 'color:purple;', "发送更新章节=>", msg);
        this.socketHandler.send(msg);
    },
}
