<template>
    <div class="about">
        <sam-editor ref="samEditor" :data="editorSetting" @change="changeEvent" />
    </div>
</template>

<script>
    import samEditor from "@/components/samEditor/samEditor.vue";
    import * as slotComponent from "@/slot/index.js";
    import elDragDialog from '@/directive/el-drag-dialog';
    // 全局方法
    import $samGlobal from '@/utils/global';

    export default {
        name: 'about',
        components: {
            samEditor
        },
        directives: { elDragDialog },

        data() {
            return {
                editorSetting: {
                    author: {

                    },
					private: false,										// 私有
                    innerSys: false,                                    // 内网系统
                    fullScreen: true,
                    setTemplate: false,
                    admin: true,
                    editorURL: process.env.VUE_APP_EDITOR_URL,	        // JAVA接口地址
					nodeURL: process.env.VUE_APP_REMOTE_API,		    // nodeServer服务器地址
                    pluginURL: process.env.VUE_APP_PLUGIN_PATH,         // 外挂插件地址 process.env.VUE_APP_PLUGIN_PATH,
                    fileURL: process.env.VUE_APP_FILE_URL,              // 静态资源文件路径
					parseDocURL: process.env.VUE_APP_DOC_API,			// 文档解析接口地址
                    socketURL: process.env.VUE_APP_SOCKET,              // socket地址
                    readonly: false,
                    isStandard: true,                                   // 是否为标准编写
                    mergeDoc: false,                                    // 文档初始化后是否自动合并正文
                    chapter: ['6','8','9'],                             // 章节标识;用于目次数据的筛选
                    page: {
                        id: '',     // ddccf935-1bfa-4277-a9d7-537f50bcbce5
                    },
                    logo: require(`@/assets/images/logo.png`),
                    navShow: true,
                    openSidebar: true,                                  // 默认打开侧栏
                    exportStruct: true,                                 // 是否在保存数据时同时导出结构化数据
                    // 默认目次选项
                    catalogues: {
                        type1: true,
                        type2: true,
                        type3: true,
                        type4: true,
                        type5: true,
                        type6: true,
                        leve11: true
                    },
                    // 菜单内容
                    menu: {
                        file: { title: 'File', items: 'newStandard openFile | save saveAs | searchreplace preview print | exportFile | close-btn' },
                        edit: { title: 'Edit', items: 'undo redo | cut copy paste | searchreplace' },
                        insert: { title: 'Insert', items: 'charmap | paragraph-btn image inserttable | math graphy | hr' },
                        pageElement: { title:'pageElement', items:'cover catalogue prefaceWord introWord addendixWord referenceWord | indexWord indexMarker | page-type' },
                        levelStyle: { title:'levelStyle', items:'chapterTitle | chapter1 chapter2 chapter3 chapter4 chapter5 | notTitle1 notTitle2 notTitle3 notTitle4 notTitle5 | list1 list2 list3 list4 list5 list6 list7' },
                        Tools: { title: 'Tools', items: 'validatDms readDoc knowledgeGraph | translate | test1 test2' },
                        importFile: { title:'importFile', items: 'importWord importCloud' },
                        help: { title: 'Help', items: 'help concatus | bzt-ver upgrade' }
                    },
                    // 菜单栏
                    menuBar: 'file importFile edit insert pageElement levelStyle elementStyle Tools help',
                    // 第一行工具栏
                    // toolbar1: 'undo redo | close-btn save saveAs unlock | cover catalogue prefaceWord introWord chapterWord addendixWord referenceWord indexWord indexMarker | chapterTitle chapter1 chapter2 chapter3 chapter4 chapter5 notTitle1 notTitle2 notTitle3 notTitle4 notTitle5 | list1 list2 list3 list4 list5 list6 list7 | entryTitle notTitle',
                    toolbar1: 'undo redo | close-btn save saveAs | catalogue indexMarker | collect-chapter collect-unchapter | collect-list collect-level | paragraph-btn image | table separateTable | math graphy | test1 quote',
                    // 第二行工具栏
                    toolbar2: 'example-btn zhu-btn zhu-imgtable footer-btn imgtitle tabletitle | quote-btn term quota references | comment | page-type pageLayout exportFile |  alignment | translate searchreplace preview fullscreen | code mergePage breakPage pageSplit',
                    // 快捷工具条
                    quickbars: 'bold italic underline strikethrough superscript subscript',
                    // 公式下拉菜单
                    mathItems: ['custom','hand','number'], // 自定义 手写 编号
                    // 上下文菜单
                    contextmenu: 'undo redo | table | image | resetNumber | quickComment | translateStdName',
                    // 草稿箱轮询间隔
                    draftTimes: 0,
                    extendToolbar: [
                        {
                            text:'测试标签',
                            tooltip:'测试1',
                            event:'test1',
                            children:[
                                {
                                    text:'自定义标签',
                                    tooltip:'自定义标签',
                            		showType: 'dialog',					// 弹窗模式
									dialogWidth: '400px',				// 弹窗宽度，不填写默认500px
                                    event:'customeTag'
                                },
                                {
                                    text:'移除标签',
                                    tooltip:'移除标签',
                                	showType: 'remove',
                                    event:'customeTag'
                                }
                            ]
                        },
                        {
                            text:'外部引用',
                            tooltip:'外部引用',
                            event:'quote',
                            children:[
                                {
                                    text:'术语',
                                    tooltip:'术语',
									showType: 'slot',					// 插槽模式
                                    event:'term'
                                }
                            ]
                        },
                    ],
                    htmlContent: `<div class="page-container"><div class="info-block"></div></div>`
                },

            }
        },
        methods: {
            /**
             * @description 接收上报事件
             * @param {Object} data
             */
            changeEvent(data) {
                /* if( data.act !== 'onScroll') {
                    console.log('about revice change=>', data);
                } */
                this.emitData = { ...data };
                switch(data.act) {
                    case 'loaded':
                        // this.$refs.samEditor.interFaceAction({ act:'resetContent', htmlContent:'<div>sdsd</div>' });
                        break;
                    case 'closeEditor':
                        var userAgent = navigator.userAgent;
                        if (userAgent.indexOf("Firefox") != -1 || userAgent.indexOf("Presto") != -1) {
                            window.location.replace("about:blank");
                        } else {
                            window.opener = null;
                            window.open("", "_self");
                            window.close();
                        }
                        break;
					// 自定义扩展事件
					case 'extendEvent':
						this.extendEvent(data);
						break;
                }
            },
			/**
			 * @description 外部扩展按钮|菜单事件触发
			 * @param {Object} obj
			 */
			extendEvent(obj={}) {
				this.actEvent = obj;
				console.log('extendEvent=>', obj);
				// 如果为插槽方式
				if (obj.showType === 'slot') {
					this.rightWidth = 400;
				// 弹窗方式
				} else if (obj.showType === 'dialog') {
					this.dialogData = {
                        cmpName : obj.event,
                        visible: true,
                        title: obj.text,
                        width: obj.dialogWidth || '500px'
                    }
				// 移除标签
				} else if (obj.showType === 'remove') {
					// DOM节点的标签数据
					if (obj.currNode && obj.currNode.dataset.tag) {
						let tagId = obj.currNode.dataset.id;
						let tagItem = _.find(this.sourceTagList, { tagId });
						if (tagItem) {
							removeTag(tagId).then(res => {
								console.log('removeTag=>', res);
								if (res.code === 200) {
									this.$refs.samEditor.interFaceAction({ act:'toggleCustomeTag', remove:true, tagId });
									this.$message.success("已移除标签!");
									this.getTaDataList();
								} else {
									this.$message.error("移除标签失败!");
								}
							})
						} else {
							this.$message.error("标签库未定义!");
							this.$refs.samEditor.interFaceAction({ act:'toggleCustomeTag', remove:true, tagId });
						}
					}
                }
			},
        },
        created() {

        },

    };
</script>

<style lang="scss" scoped>
    .about{
        height: 100%;
        .right-wrapper{
            width: 0px;
            transition: all .25s;
            // display: none;
            >header{
                display:flex;
                align-items:center;
                justify-content: space-between;
                padding: 10px;
                border-bottom: 1px solid #DDD;
            }
            .content{
                height: calc(100% - 37px);
            }
        }
    }
    ::v-deep .form-dialog{
        .el-dialog__body{
            max-height: 700px;
        }
    }
</style>
