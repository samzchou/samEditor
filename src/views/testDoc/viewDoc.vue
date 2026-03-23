<template>
    <div class="view-doc-container">
        <!-- 工具栏 -->
        <header>
            <el-button size="mini" @click.stop.prevent="actEvent('search')" style="margin-right:10px;">查找</el-button>
            <!-- <el-button size="mini" @click.stop.prevent="actEvent('import')" style="margin-right:10px;">导入内容</el-button> -->
            <!-- <input id="upload-file" type="file" accept=".html,.txt" v-show="false" @change="handleBeforeUpload" /> -->

            <el-button size="mini" @click.stop.prevent="actEvent('outline')" style="margin-right:10px;">获取大纲</el-button>
            <el-select size="mini" v-model="editorSetting.notCatalogue" style="width: 120px;margin-right: 10px;" placeholder="是否显示目次页" @change="changeShowCatalogue">
            	<el-option label="显示目次页" :value="false" />
            	<el-option label="关闭目次页" :value="true" />
            </el-select>
            <el-button size="mini" :disabled="editorSetting.notCatalogue" @click.stop.prevent="setCatalogue" style="margin-right: 10px;">目次选项</el-button>

            <el-select size="mini" v-model="editorSetting.wordBreak" style="width: 120px;margin-right: 10px;" placeholder="是否WORD自动处理分页" @change="changePageBreak">
                <el-option label="WORD自动分页" :value="true" />
                <el-option label="系统自动分页" :value="false" />
            </el-select>

            <!-- :disabled="!mergedDoc" -->
			<el-dropdown split-button size="mini" :disabled="editorSetting.wordBreak" @command="handleLayout" style="margin-right: 10px;">
				{{editorSetting.page.layout==='singleSided'?'单面排版':'双面排版'}}
				<el-dropdown-menu slot="dropdown">
					<el-dropdown-item command="singleSided">单面排版</el-dropdown-item>
					<el-dropdown-item command="doubleSided">双面排版</el-dropdown-item>
				</el-dropdown-menu>
			</el-dropdown>

            <el-button size="mini" :disabled="editorSetting.wordBreak" @click.stop.prevent="actEvent('breakPage')" style="margin-right: 10px;">分页</el-button>

            <!-- :disabled="editorSetting.page.layout==='singleSided'||!mergedDoc" -->
			<el-select size="mini" v-model="editorSetting.page.empty" :disabled="editorSetting.wordBreak" style="width: 140px;margin-right: 10px;" placeholder="是否需要空白页" @change="changeEmptyPage">
				<el-option label="不需要空白页" :value="false" />
				<el-option label="需要空白页" :value="true" />
			</el-select>

            <!-- :disabled="!mergedDoc" -->
            <el-select size="mini" v-model="editorSetting.page.backCover" :disabled="editorSetting.wordBreak" style="width: 140px;margin-right: 10px;" placeholder="是否需要封底页" @change="changeBackCover">
            	<el-option label="不需要封底页" :value="false" />
            	<el-option label="需要封底页" :value="true" />
            </el-select>

            <el-button v-if="!autoMerge" size="mini" @click.stop.prevent="actEvent('merge')" style="margin-right: 10px;">合并文档</el-button>

            <el-dropdown split-button size="mini" @command="handleExport" style="margin-right: 10px;">
                导出文档
                <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item command="docx">DOCX</el-dropdown-item>
                    <el-dropdown-item command="wps">WPS</el-dropdown-item>
                    <el-dropdown-item command="pdf">PDF</el-dropdown-item>
                    <el-dropdown-item command="xml">XML结构化数据包</el-dropdown-item>
                </el-dropdown-menu>
            </el-dropdown>

            <el-button size="mini" @click.stop.prevent="actEvent('close')">退出关闭</el-button>
        </header>
        <!-- 编辑器主体 -->
        <main v-if="editorSetting">
            <sam-editor ref="samEditor" :name="`tinymceEditor-${eId}`" :data="editorSetting" @change="changeEvent" />
        </main>

        <!-- 目次选项弹窗 -->
        <el-dialog title="提示" :visible.sync="catalogueVisible" width="600px" append-to-body :close-on-click-modal="false">
            <div class="form" style="padding:15px;">
                <el-form size="mini" :model="catalogueForm" label-position="top">
                    <el-form-item label="默认的目次内容" style="border-bottom:1px solid #DDD">
                        <!-- <div>前言、引言、章标题、附录、参考文献、索引</div> -->
                        <el-checkbox-group v-model="catalogueForm.default" style="display:contents;">
                            <el-checkbox v-for="(item, idx) in defaultCatalogues.filter(o=>{return o.type})" :key="idx" :label="item.value" :disabled="true" style="margin: 0;width: 33.3333%;">{{item.label}}</el-checkbox>
                        </el-checkbox-group>
                    </el-form-item>
                    <el-form-item label="可选的目次内容" style="border-bottom:1px solid #DDD">
                        <el-checkbox-group v-model="catalogueForm.checkeds" style="display:contents;">
                            <el-checkbox v-for="(item, idx) in defaultCatalogues.filter(o=>{return !o.type})" :key="idx" :label="item.value" style="margin: 0;width: 33.3333%;">{{item.label}}</el-checkbox>
                        </el-checkbox-group>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="submitCatalogue">确定</el-button>
                        <el-button @click="cancelCatalogue">取消</el-button>
                    </el-form-item>
                </el-form>
            </div>
        </el-dialog>
    </div>
</template>

<script>
    import samEditor from "@/components/samEditor/samEditor.vue";
    import { editorOptions, defaultCatalogues } from './editorConfig';
    import $global from '@/utils/global.js';

	const footerHtml = '<p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><table border="2" data-id="15362304-ce01-434d-91b0-403f72d67eb3" style="width: 300px; float: right; border: 0px;"><colgroup><col width="100.000%" /></colgroup><tbody><tr><td style="text-align:center;border-width: 0px !important;"><p style="font-family: simHei; font-size: 10.5pt;">中国电力工程顾问集团有限公司</p></td></tr><tr><td style="text-align:center;border-width: 0 !important; height: 31px;"><p style="font-family: simHei; font-size: 10.5pt;">企业技术标准</p></td></tr><tr><td style="text-align:center;border-width: 0 !important;"><p style="font-family: simHei; font-size: 10.5pt;"><strong data-stdname="标准名称">（标准名称）</strong></p></td></tr><tr><td style="text-align:center;border-width: 0 !important;"><p style="font-family: simHei; font-size: 10.5pt;"><strong data-stdno="标准编号">（标准编号）</strong></p></td></tr><tr><td style="text-align:center;border-width: 0 !important; height: 75px;"><p style="font-family: simHei; font-size: 14pt;"><strong>版权所有 </strong><strong> </strong><strong>侵权必究</strong></p></td></tr></tbody></table>';



	export default {
        name: 'view-doc',
        components: {
            samEditor
        },
        props: {
			data: {
				type: Object,
				default: () => {
					return {};
				}
			},
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
                eId: $global.guid(),
                loading: null,
                editorSetting: null,
                mergedDoc: false,
                editorInstance: null,
                catalogueVisible: false,
                defaultCatalogues,
                catalogueForm: {
                    checkeds: ['leve11', 'appendix0'],
                    default: ['type1', 'type2', 'type3', 'type4', 'type5', 'type6']
                },
            }
        },
        methods: {
            /**
             * @description 上传组件自动请求
             */
            httpRequest() {
                return false;
            },

            setCatalogue() {
                this.catalogueVisible = true;
            },
            submitCatalogue() {
                var checkeds = [].concat(this.catalogueForm.default).concat(this.catalogueForm.checkeds)
                this.editorInstance.interFaceAction({ act: 'reset_catalogue', data: checkeds });
                this.catalogueVisible = false;
            },
            cancelCatalogue() {
                this.catalogueVisible = false;
            },

            /**
             * @description 初始化编辑器配置
             */
            initData() {
                this.editorSetting = _.merge(editorOptions, this.data, {
                    author: {},
					//nodeURL: '',
                    wordBreak: false,                               // word自动处理分页
                    disabledOutline: true,                           // 屏蔽大纲的编辑
                    // readonly: true,                              // 只读模式，注意：如果开启则不显示大纲
                    reader: true,                                    // 阅读模式，同步会开启大纲
                    menuBar: false,                                  // 关闭菜单
                    toolbar1: '',                                    // 关闭工具栏1
                    toolbar2: '',                                    // 关闭工具栏2
                    openSidebar: true,                               // 展开左侧栏
                    quickbars_selection_toolbar: false,              // 快捷工具条
                    showOutline: true,                               // 显示大纲
                    page: {
                        expand: true,                               // 注意预览模式下把此功能设为 false
                        backCover: false,                           // 是否要加入封底页面
                        id: this.docId,                              // 编辑器直接按文档等ID加载内容
                        layout: 'doubleSided',                      // 页面按单面方式布局 singleSided | doubleSided
						// size: { width:210, height:305 },			// 导出文档页尺寸
                        empty: false,                                // 是否需要空白页
                    },
                    notCatalogue: false,                             // 目次页显示与否
                    draftTimes: 0,
                    htmlContent: '',
                    endLineWeigth: '0.75pt',                        // 定义终结线宽
                    outData: true,                                  // 外部处理数据
                    // customCover: 'nengjian',
                });
                console.log('this.editorSetting==>', this.editorSetting)
            },
			/**
             * @description 显示或关闭目次页 this.showCatalogue: true | false
             */
			changeShowCatalogue() {
				this.editorInstance.interFaceAction({ act:'showcatalogue', show:!this.editorSetting.notCatalogue });
			},

            changePageBreak() {
                // this.editorSetting.page.layout = act;
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
                }, 240000);
            },

            /**
             * @description 编辑器上报事件
             * @param {Object} data
             */
            changeEvent(data) {
                // console.log('changeEvent', data)
                switch (data.act) {
                    case 'loaded':  // 文档加载完成
                        console.log('编辑器 loaded');
                        this.mergedDoc = false;
                        this.editorInstance = this.$refs.samEditor;
                        // 如果需要文档加载完成后立即需要处理页面合并则进行接口调用，或者通过手动合并来调试文档的合并功能
                        if (!this.editorSetting.page.expand) {
                            if (this.autoMerge) {
                                this.onLoading('正在合并文档中，请等候处理完成...');
                                this.editorInstance.interFaceAction({ act:'megerDoc', save:true }); // save:是否合并后输出文档的JSON结构，以便后台可以调用nodeServer的接口输出DOCX文档
                            }
                        } else {
                            // this.editorInstance.interFaceAction({ act:'exePageBreak' });
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
                    case 'extendEvent':
                        alert('extendEvent')
                        // this.extendEvent(data.data);
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
				// console.log(footerHtml)
				// debugger
                this.editorInstance.interFaceAction({ act: 'set_backCover', data: { backCover:this.editorSetting.page.backCover, htmlContent:footerHtml } });
            },
            /**
             * @description 编辑器文档导出, docName 自行定义名称 this.$emit('change', { act: 'export', filepath });
             * @param {String} cmd
             */
            async handleExport(cmd) {
				// this.onLoading('正在导出文档中，请等候处理完成...');
                var res = await this.editorInstance.interFaceAction({ act:'export_doc', data:{ type:cmd, docName:'TEST', outData:true } });
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
                    case 'breakPage':
                        this.editorInstance.interFaceAction({ act:'exePageBreak' }).then(res => {
                            this.$notify({
                                title: `提示消息`,
                                message: `文档执行分页${res?'完成':'失败'}`,
                                type: res? 'success' : 'error'
                            });
                        });
                        break;
                    case 'outline': // 获取大纲结构
                        var outlineData = await this.editorInstance.interFaceAction({ act: 'get_outline' });
                        console.log('outlineData', outlineData);
                        break;
                    case 'merge': // 合并页面文档，save为是否保存合并后的文档结构数据， 返回 Boolean
						// this.onLoading('正在合并文档中，请等候处理完成...');
						this.mergedDoc = await this.editorInstance.interFaceAction({ act: 'megerDoc', save: true });
						// console.log('文档合并结果', this.mergedDoc);
						// this.loading.close();
                        break;
                    case 'import':
                        document.getElementById('upload-file').click();
                        break;
                    case 'search':
                        this.editorInstance.interFaceAction({ act:'execCommand', command:'search' });
                        break;
                }
            },
            /**
             * 上传文档内容
             * @param {Object} file
             */
            async handleBeforeUpload(evt) {
                evt.stopPropagation();
                evt.preventDefault();

                this.mergedDoc = false;

                var file = document.getElementById('upload-file').files[0];
                var reader = new FileReader();
                if (typeof FileReader === "undefined") {
                    this.$message({
                        type: "warning",
                        message: "您的浏览器不支持文件读取。"
                    });
                    return;
                }
                reader.onload = (e) => {
                    let htmlContent = e.target.result;
                    let section = document.createElement('div');
                    section.innerHTML = htmlContent;
                    let pageContainer = section.querySelector('.page-container');
                    if (!pageContainer || !pageContainer.dataset.outlineid) {
                        this.$message({
                            type: "error",
                            message: "文档格式错误，请检查！"
                        });
                    } else {
                        // 重置文档内容后，执行分页
                        this.editorInstance.interFaceAction({ act: 'resetContent', htmlContent, breakPage:true });
                    }
                    section.remove();
                }
                reader.readAsText(file, "utf-8");
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
