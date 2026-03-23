<template>
    <div class="view-doc-container">
        <header>
			<!-- 这里测试CODE的导入
            <el-upload action="#" :show-file-list="false" accept=".txt" :http-request="httpRequest" :before-upload="handleBeforeUpload" style="display: inline;">
                <el-button size="small" type="warning" icon="el-icon-upload2" >置入CODE</el-button>
            </el-upload>
			-->
            <el-button size="mini" @click.stop.prevent="actEvent('outline')">获取大纲</el-button>
            <el-button size="mini" @click.stop.prevent="actEvent('merge')" v-if="!autoMerge">合并文档</el-button>
			<el-dropdown split-button size="mini" @command="handleLayout" :disabled="!mergedDoc" style="margin:0 10px;">
				{{editorSetting.page.layout==='singleSided'?'单面排版':'双面排版'}}
				<el-dropdown-menu slot="dropdown">
					<el-dropdown-item command="singleSided">单面排版</el-dropdown-item>
					<el-dropdown-item command="doubleSided">双面排版</el-dropdown-item>
				</el-dropdown-menu>
			</el-dropdown>
			<el-select size="mini" v-model="editorSetting.page.empty" :disabled="editorSetting.page.layout==='singleSided'||!mergedDoc" style="width: 140px;margin-right: 10px;" placeholder="是否需要空白页" @change="changeEmptyPage">
				<el-option label="不需要空白页" :value="false" />
				<el-option label="需要空白页" :value="true" />
			</el-select>

            <el-select size="mini" v-model="editorSetting.page.backCover" :disabled="!mergedDoc" style="width: 140px;" placeholder="是否需要封底页" @change="changeBackCover">
            	<el-option label="不需要封底页" :value="false" />
            	<el-option label="需要封底页" :value="true" />
            </el-select>

            <el-dropdown split-button size="mini" @command="handleExport" style="margin: 0 10px;">
                导出文档
                <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item command="docx">DOCX</el-dropdown-item>
                    <el-dropdown-item command="wps">WPS</el-dropdown-item>
                    <el-dropdown-item command="pdf">PDF</el-dropdown-item>
                </el-dropdown-menu>
            </el-dropdown>
            <el-button size="mini" @click.stop.prevent="actEvent('close')">退出关闭</el-button>
        </header>
        <main v-if="editorSetting">
            <sam-editor ref="samEditor" :data="editorSetting" @change="changeEvent" />
        </main>
    </div>
</template>

<script>
    import samEditor from "@/components/samEditor/samEditor.vue";
    import { editorOptions } from './editorConfig';
    export default {
        name: 'view-doc',
        components: {
            samEditor
        },
        props: {
            docId: String,
            autoMerge: Boolean,
        },
        watch: {
            docId: {
        		handler(id) {
        			if (id !== undefined) {
        				this.initData();
        			}
        		},
        		immediate: true
        	}
        },
        data() {
            return {
                loading: null,
                editorSetting: null,
                mergedDoc: false,
                editorInstance: null,
            }
        },
        methods: {
            /**
             * @description 上传组件自动请求
             */
            httpRequest() {
                return false;
            },
            /**
             * @description 上传DOCX文件
             * @param {Object} file
             */
            handleBeforeUpload(file=null) {
                console.log('handleBeforeUpload', file)
                var reader = new FileReader();
                reader.onload = (e) => {
                    var readAsText = reader.result;
                    if (readAsText) {
                        this.mergedDoc = false;
                        this.editorInstance.interFaceAction({ act:'resetContent', htmlContent:readAsText });
                    }
                }
                reader.readAsText(file);
            },
            /**
             * @description 初始化编辑器配置
             */
            initData() {
                this.editorSetting = Object.assign(editorOptions, {
                    author: {},
                    disabledOutline:true,                           // 屏蔽大纲的编辑
                    // readonly: true,                              // 只读模式，注意：如果开启则不显示大纲
                    reader:true,                                    // 阅读模式，同步会开启大纲
                    menuBar:false,                                  // 关闭菜单
                    toolbar1:'',                                    // 关闭工具栏1
                    toolbar2:'',                                    // 关闭工具栏2
                    openSidebar:true,                               // 展开左侧栏
                    quickbars_selection_toolbar: false,
                    page: {
                        expand:false,                               // 注意预览模式下把此功能设为 false
                        backCover: false,                           // 是否要加入封底页面
                        id:this.docId,                              // 编辑器直接按文档等ID加载内容
                        empty: false,                               // 是否需要封面后的空白页
                        layout: 'singleSided',                      // 页面按单面方式布局
                    },
                    draftTimes: 0,
                    htmlContent: '',
                    endLineWeigth: '0.75pt', // 定义终结线宽
                });
            },

            onLoading(text, isLoading = false) {
                if (this.loading && !isLoading) {
                    this.loading.close();
                }
                this.loading = this.$loading({
                    lock: true,
                    text,
                    spinner: 'el-icon-loading',
                    background: 'rgba(0, 0, 0, 0.7)'
                });

                setTimeout(() => {
                    this.loading.close();
                }, 60000);
            },
            changeEvent(data) {
                switch (data.act) {
                    case 'loaded':  // 文档加载完成
                        console.log('编辑器 loaded');
                        this.mergedDoc = false;
                        this.editorInstance = this.$refs.samEditor;
                        // 如果需要文档加载完成后立即需要处理页面合并则进行接口调用，或者通过手动合并来调试文档的合并功能
                        if (this.autoMerge) {
                            this.onLoading('正在合并文档中，请等候处理完成...');
                            this.editorInstance.interFaceAction({ act:'megerDoc', save:false }); // save:是否合并后输出文档的JSON结构，以便后台可以调用nodeServer的接口输出DOCX文档
                        }
                        break;
                    case 'megered': // 页面合并完成
                        if(data.result) {
                            this.$message.success('文档已合并！');
                            this.mergedDoc = true;
                        } else {
                            this.$message.error('文档合并错误！');
                        }
                        this.loading && this.loading.close();
                        break;
                    case 'destroy': // 编辑器实例销毁
                        console.log('文档预览编辑器实例已销毁')
                        break;
                }
            },
            /**
             * @description 编辑器页面布局方式
             * @param {String} cmd
             */
			handleLayout(act='') {
				this.editorSetting.page.layout = act;
                // 如果是单面布局方式的，导出WORD不需要封面后的空白页
                this.$set(this.editorSetting.page, 'empty', act === 'singleSided');
                this.editorInstance.interFaceAction({ act: 'set_pagetype', data: { act, empty:this.editorSetting.page.empty } });
			},
            /**
             * @description 插入空白页
             */
            changeEmptyPage() {
                this.editorInstance.interFaceAction({ act: 'set_pagetype', data: { act:this.editorSetting.page.layout, empty:this.editorSetting.page.empty } });
            },
            /**
             * @description 添加或移除封底页
             */
            changeBackCover() {
                this.editorInstance.interFaceAction({ act: 'set_backCover', data: { backCover:this.editorSetting.page.backCover } });
            },
            /**
             * @description 编辑器文档导出, docName 自行定义名称 this.$emit('change', { act: 'export', filepath });
             * @param {String} cmd
             */
            async handleExport(cmd) {
				// this.onLoading('正在导出文档中，请等候处理完成...');
                var res = await this.editorInstance.interFaceAction({act:'export_doc', data:{type:cmd, docName:'TEST'} });
                console.log('文档导出结果', res);
                if(res) {
                    this.$message.success('文档已导出！');
                } else {
                    this.$message.error('文档导出失败！');
                }
                // this.loading && this.loading.close();
            },
            /**
             * @description 编辑器接口调用示例
             * @param {String} act
             */
            async actEvent(act) {
                switch (act) {
                    case 'close': // 关闭
                        this.$emit('close');
                        break;
                    case 'outline': // 获取大纲结构
                        var outlineData = await this.editorInstance.interFaceAction({ act: 'get_outline' });
                        console.log('outlineData', outlineData);
                        break;
                    case 'merge': // 合并页面文档，save为是否保存合并后的文档结构数据， 返回 Boolean
						if (this.mergedDoc) {
                            this.$message.warning('文档已经被合并！');
                        } else {
							this.onLoading('正在合并文档中，请等候处理完成...');
                            this.mergedDoc = await this.editorInstance.interFaceAction({ act: 'megerDoc', save: false });
                            console.log('文档合并结果', this.mergedDoc);
                            this.loading.close();
                        }
                        break;
                }
            },
        },
        beforeDestroy() {
            if (this.editorInstance) {
                this.editorSetting = null;
                this.editorInstance.interFaceAction({ act:'destroy' });
            }
        }
    }
</script>

<style lang="scss" scoped>
    .view-doc-container{
        height: 100%;
        header{
            padding: 5px 0;
            text-align: center;
        }
        main{
            height: calc(100% - 38px);
        }
    }
</style>
