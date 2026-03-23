<template>
    <div class="home-container">
        <el-input v-model="inputText" />
        <el-button size="mini" @click="sendMsg">Send</el-button>
    </div>
</template>


<script>
    import $global from '@/utils/global.js';
    // webSocket
    import socketUtil from '@/utils/socketUtil.js';
    // 事件总线
    import $bus from '@/utils/bus.js';

    export default {
        name: 'home-page',

        data() {
            return {
                socketId: $global.guid(),
                socketInstance: null,
                inputText: '请创建”计划管理“系统',
            }
        },

        methods: {
            sendMsg() {
                this.socketInstance.sendMsg(this.inputText, 'generateSystem');
            },
            /**
             * @description 断开Socket连接
             */
            disconnectSocket() {
                if (this.socketInstance) {
                    this.socketInstance.closeSocket(true);
                    this.socketInstance = null;
                }
            },
            /**
             * @description 创建SOCKET实例 ws://112.87.208.140:8600/api/push/websocket ws://192.168.99.12:8600/api/push/websocket
             */
            connectSocket(data = {}) {
                let socketUrl = this.$attrs?.data ? this.$attrs.data.aiSocket : 'ws://192.168.0.19:8500/api/push/websocket';
                this.socketInstance = new socketUtil(socketUrl, { userId: this.socketId });
                console.log('connectSocket====>', this.socketInstance);
            },

            destroy() {
                this.disconnectSocket();
            }
        },

        created() {
            this.connectSocket();
        },

        mounted() {
            $bus.$on('onMsg', obj => {
                let data = obj.data;
                console.log('socket response====>', data);
                if (data && data.contents && data.clientId === 'user_' + this.socketId) {
                    // console.log('socket response====>', data);

                }
            });
        },

        beforeDestroy() {
            this.destroy();
        }


    }
</script>
