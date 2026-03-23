<template>
    <div class="copy-content">
        <!-- 复制按钮 -->
        <div class="copy-btn code-data-copy" @click="copyMessage" data-clipboard-action="copy" :data-clipboard-text="code">
            <i class="el-icon-document-copy myicon"></i>
        </div>
        <div v-if="success" class="copy-success-text">copied!</div>
    </div>
</template>

<script>
    import clipboard from "clipboard";

    export default {
        data() {
            return {
                code: null,
                success: false,
            };
        },
        methods: {
            copyMessage(value) {
                this.success = false;
                let cpInstance = new clipboard(".code-data-copy");
                cpInstance.on("success", (e) => {
                    this.success = true;
                    cpInstance.destroy(); // 销毁,避免多次点击重复出现
                });
                cpInstance.on("error", () => {
                    this.$message.error($t('failed'));
                });
            },
        },
    };
</script>

<style lang="scss" scoped>
    .copy-content {
        height: 0px;
    }
    .icon {
        width: 0.8rem;
        height: 0.8rem;
        fill: rgb(231, 32, 32);
    }
    .myicon {
        font-size: 14px;
        color: #c0c4cc;
        &:hover {
            color: #FFF;
        }
    }
    .copy-btn {
        user-select: none;
        opacity: 1;
        position: absolute;
        right: -5px;
        top: -5px;
        cursor: pointer;
        border-radius: 3px;
        transition: 0.3s;
        // background: rgba(255, 255, 255, 0.2);

    }
    .copy-success-text {
        font-family: "微软雅黑";
        color: green;
        position: absolute;
        font-size: 12px;
        top: -8px;
        right: 13px;
        font-weight: 500;
        animation: successCopy 0.6s ease both 1;
    }
</style>
