<template>
    <div class="std-editor-container">
        <main>
            <!-- 编辑器编辑模式 -->
            <sam-editor v-if="docId && !dialogVisible" ref="samEditor" :data="editorSetting" @change="changeEvent" />
        </main>
        <footer>
            <el-select size="mini" v-model="autoMerge" placeholder="合并文档" style="margin-right: 10px;">
                <el-option label="手动合并文档" :value="false" />
                <el-option label="自动合并文档" :value="true" />
            </el-select>
            <el-button size="mini" type="primary" @click="dialogVisible=true" :disabled="editorInstance===null">预览</el-button>
        </footer>

        <!-- 编辑器阅读模式,嵌套在弹窗组件中 -->
        <el-dialog title="文档预览" :visible.sync="dialogVisible" fullscreen append-to-body destroy-on-close>
            <viewDoc v-if="dialogVisible" :docId="docId" :autoMerge="autoMerge" @close="dialogVisible=false" />
        </el-dialog>
    </div>
</template>

<script>
    // 引入编辑器库组件（如在项目中须再引入CSS）
    import samEditor from "@/components/samEditor/samEditor.vue";
    import { editorOptions } from './editorConfig';

    import viewDoc from './viewDoc';
    export default {
        name: 'rich-editor',
        components: {
            samEditor,
            viewDoc
        },
        data() {
            return {
                editorInstance: null,
                appendSetting: false,
                docId: undefined,
                loadedOther: false,
                // 编辑器配置
                editorSetting: _.cloneDeep(editorOptions),
                dialogVisible: false,
                autoMerge: false, // 自动合并文档
            }
        },
        methods: {
            /**
             * @description 接收编辑器上报事件
             * @param {Object} data
             */
            changeEvent(data) {
                switch (data.act) {
                    case 'loaded': // 文档加载完成
                        console.log('主编辑器 loaded')
                        this.editorInstance = this.$refs.samEditor;
                        break;
                    case 'destroy':
                        console.log('主编辑器实例已销毁')
                        break;
                }
            },
        },
        created() {
            var docData = this.$storage.session.get('tinymceDocData'),
                docId;
            if (this.$route.query && this.$route.query.id) {
                docId = this.$route.query.id;
            } else if (docData) {
                docId = docData.docId;
            }

            if (this.$route.query.userName && this.$route.query.userId) {
                this.editorSetting.author = Object.assign({}, this.editorSetting.author, {
                    userId: this.$route.query.userId,
                    userName: this.$route.query.userName
                })
            }

            if (docId) {
                this.docId = docId;
                this.editorSetting.page.id = docId;
            }
        },
    }
</script>

<style lang="scss" scoped>
    .std-editor-container {
        height: 100%;
        width: 100%;
        position: relative;

        main {
            height: calc(100% - 45px);
        }

        footer {
            height: 45px;
            padding: 10px;
            text-align: center;
        }

    }

    ::v-deep .el-dialog {
        overflow: hidden;

        .el-dialog__body {
            height: calc(100% - 45px);
        }
    }
</style>
