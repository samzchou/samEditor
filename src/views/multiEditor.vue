<template>
    <div class="multi-editor-container">
        <div class="editor-content">
            <sam-editor ref="samEditor" v-if="userId" :data="editorSetting" @change="changeEvent" />
        </div>
        <div class="btns">
            <el-button size="small" plain type="primary" @click="dialogVisible=true">预览文档</el-button>
        </div>

		<el-dialog
            title="预览文档"
            append-to-body
            fullscreen
            destroy-on-close
            custom-class="form-dialog"
            :visible.sync="dialogVisible"
            @closed="closeDialog">
			<view-doc v-if="dialogVisible" ref="viewDoc" :id="docId" @change="changeView" />
		</el-dialog>
    </div>
</template>

<script>
    import { optionSettings } from '@/config';
    import samEditor from "@/components/samEditor/samEditor.vue";
    import viewDoc from './cmp/viewDoc';
    // 全局方法
    import $samGlobal from '@/utils/global';
    export default {
        name: 'multi-editor',
        components: {
            samEditor, viewDoc
        },
        data() {
            const docId = "a50ef3babfca4cba9deab51957a1be86";
            return {
                userId: '',
                docId,
                editorSetting: {
                    ...optionSettings,
                    author: {
                        userId: '',
                        userName: $samGlobal.randomString(6),
                        isAdmin: true,                            		// 是否为管理员（可编辑大纲）
                        lockedAll: true,                             	// 协同模式下默认全不锁定
                    },
					page: {
					    expand: false,									// True:页面不做自动分页，自动向下增高展开，注：仅用于编辑模式下
					    layout: 'doubleSided', 							// 单面排版：singleSided | 双面排版：doubleSided
					    id: docId,                                      // 文档ID
					},
					// 第一行工具栏
                    toolbar1: 'undo redo | close-btn save saveAs | catalogue indexMarker | collect-chapter collect-unchapter | collect-list collect-level | paragraph-btn image | table separateTable | math graphy | fontselect fontSize forecolor backcolor | link | stdQuote formQuote',
                    // 工具栏扩展（编辑器只抛出事件，须在业务端操作）
                    extendToolbar: [
                        {
                    		text: '题录引用',
                          	tooltip: '题录引用',
                          	event: 'stdQuote',
                          	showType: 'dialog',         // 弹窗模式
                          	dialogWidth: '500px',       // 弹窗宽度，不填写默认500px
                        },
                    	{
                          	text: '表单引用',
                          	tooltip: '表单引用',
                          	event: 'formQuote',
                          	showType: 'dialog',         // 弹窗模式
                    		tag: 'bullFormQuote',
                        	tagTreeId: 'BEED3EC5-61A4-E4AE-0490-AD2C82986C58',
                        },
                    ],
                },
                editorInstance: null,
                dialogVisible: false,
            }
        },
        methods: {
            /**
             * @description 关闭弹窗
             */
            async closeDialog() {
                // do something
                this.editorInstance.interFaceAction({ act:'refreshEditor' });
            },
            changeEvent(data={}) {
                if(!['onScroll','mouseover'].includes(data.act)) {
                    console.log('about revice change=>', data);
                }
                switch (data.act) {
                    case 'loaded':
                        this.editorInstance = this.$refs.samEditor;
                        break;
                }
            },
            /**
             * @description 预览组件上报事件
             * @param {String} evt
             */
            changeView(evt) {
                switch (evt) {
                    case 'destroy':
                        // do something
                        break;
                }
            }
        },
        created() {
            if (this.$route.query && this.$route.query.userId) {
                this.userId = this.$route.query.userId;
                this.$set(this.editorSetting.author, 'userId', this.userId);
            }
            // 清除缓存
            this.$storage.session.remove('docFileList');
            this.$storage.session.remove('tinymceDocData');
            this.$storage.session.remove('tinymceConfig');
        },

    };
</script>

<style lang="scss" scoped>
    .multi-editor-container{
        height: 100%;
        .editor-content{
            width: 100%;
            height: calc(100% - 52px);
        }
        .btns{
            padding: 10px;
            text-align: center;
        }
    }
    ::v-deep .form-dialog{
        .el-dialog__body{
            min-height: 650px;
            height: calc(100% - 45px);
        }
    }
</style>
