<template>
    <div class="about">
        <sam-editor v-if="inited" ref="samEditor" :data="editorSetting" @change="changeEvent">
            <template v-if="actEvent.showType==='slot' && rightWidth" v-slot:right>
                <div class="right-wrapper" :style="rightStyle">
                    <header>
                        <span>{{actEvent.text}}</span>
                        <i class="el-icon-close" @click.stop.prevent="rightWidth=0" />
                    </header>
                    <div class="content">
                        <component :is="slotCmp" :data="emitData" :tagTree="tagTreeList" @change="changeSlotData" />
                    </div>
                </div>
            </template>
        </sam-editor>

        <!-- 弹窗组件 -->
		<el-dialog v-if="actEvent.showType==='dialog'" v-el-drag-dialog append-to-body custom-class="form-dialog" :title="dialogData.title" :visible.sync="dialogData.visible" :width="dialogData.width" :close-on-click-modal="false">
			<component :is="dialogCmp" :data="emitData" :tagTree="tagTreeList" @change="changeSlotData" />
		</el-dialog>
    </div>
</template>

<script>
    import samEditor from "@/components/samEditor/samEditor.vue";
    import * as slotComponent from "@/slot/index.js";
    import elDragDialog from '@/directive/el-drag-dialog';
    // import { baseData, getTcList, getAllIndustryList, getOrganizationList } from "@/api/dms";
    import { listTagTree, addTag, tagList, removeTag } from "@/api/tags";
    // 全局方法
    import $global from '@/utils/global';

    export default {
        name: 'about-editor',
        components: {
            samEditor
        },
        directives: { elDragDialog },
        computed: {
            slotCmp() {
                if (this.actEvent.event && slotComponent[this.actEvent.event]) {
                    return slotComponent[this.actEvent.event];
                }
                return null;
            },
			dialogCmp() {
			    if (this.dialogData.cmpName && slotComponent[this.dialogData.cmpName]) {
			        return slotComponent[this.dialogData.cmpName];
			    }
			    return null;
			},
            rightStyle() {
                return {
                    width: `${this.rightWidth}px`,
                    display: this.rightWidth===0 ? 'none' : 'block'
                }
            },
            checkedList() {
                var checked = [];
                this.utilList.forEach(item => {
                    if (this.allCheckeds.includes(item.label)) {
                        checked.push(item.label);
                    }
                });
                return checked;
            }
        },
        data() {
            return {
                activeTab: 'pages',
                pageImgs: [],
                draftList: [],
                searchText: '',
                cmpName: undefined,
                slotTitle: '插槽标题',
                leftWidth: 300,
                rightWidth: 0,
                outlineData: [],
                inited: false,
                editorSetting: {
                    author: {
                        userId: '3837777',
                        userName: '1009',
                        commitId: '',
                        isAdmin: true,                            		// 是否为管理员（可编辑大纲）
                        lockedAll: false,                             	// 协同模式下默认全不锁定
                    },
					private: false,										// 私有
                    // innerSys: false,                                    // 内网系统
                    fullScreen: true,
                    // setTemplate: false,
                    // unlock: true,                                    // 解锁所有页面
                    // disabledSave: true,                              // 禁用保存
                    admin: true,
                    editorURL: process.env.VUE_APP_EDITOR_URL,	        // JAVA接口地址
					nodeURL: process.env.VUE_APP_REMOTE_API,		    // nodeServer服务器地址
                    pluginURL: process.env.VUE_APP_PLUGIN_PATH,         // 外挂插件地址 process.env.VUE_APP_PLUGIN_PATH,
                    fileURL: process.env.VUE_APP_FILE_URL,              // 静态资源文件路径
					parseDocURL: process.env.VUE_APP_DOC_API,			// 文档解析接口地址
                    socketURL: process.env.VUE_APP_SOCKET,              // socket地址
                    isStandard: false,                                   // 是否为标准编写
                    normal: true,
					notCatalogue: true,
                    style: 'commons-normal',                             // 样式
                    mergeDoc: false,                                    // 文档初始化后是否自动合并正文
                    // chapter: ['6','8','9'],                             // 章节标识;用于目次数据的筛选
                    page: {
                        expand: true,
						scale: true,									// 页面缩放
						layout: 'singleSided',							// 单面排版：singleSided | 双面排版：doubleSided
                        id: '',                                         // ddccf935-1bfa-4277-a9d7-537f50bcbce5
                    },
                    logo: require(`@/assets/images/logo.png`),
                    navShow: true,
                    openSidebar: false,                                  // 默认打开侧栏
                    exportStruct: false,                                 // 是否在保存数据时同时导出结构化数据
                    // 菜单内容
                    menu: {
                        file: { title: 'File', items: 'openFile | save saveAs | searchreplace preview print | exportFile | close-btn' },
                        edit: { title: 'Edit', items: 'undo redo | cut copy paste | searchreplace' },
                        insert: { title: 'Insert', items: 'charmap | paragraph-btn image inserttable | math graphy | hr' },
                        pageElement: { title:'pageElement', items:'cover catalogue prefaceWord introWord addendixWord referenceWord | indexWord indexMarker | page-type' },
                        // Tools: { title: 'Tools', items: 'validatDms readDoc knowledgeGraph | translate | test1 test2' },
                        // importFile: { title:'importFile', items: 'importWord importCloud' },
                        help: { title: 'Help', items: 'help concatus | bzt-ver upgrade' }
                    },
                    // 菜单栏
                    menuBar: 'file edit insert pageElement help',
                    // 第一行工具栏 bullist numlist
                    toolbar1: 'undo redo | close-btn save saveAs | insert-page | collect-chapter collect-list collect-level | styleselect paragraph-btn image hr media | table separateTable | math graphy link | alignment indent2em removeformat | fontName fontSize forecolor backcolor',
                    toolbar2: 'example-btn zhu-btn zhu-imgtable footer-btn imgtitle tabletitle | page-type pageLayout exportFile  | searchreplace preview fullscreen | code',
                    // 快捷工具条
                    quickbars: 'bold italic underline strikethrough superscript subscript',
                    // 公式下拉菜单
                    mathItems: ['custom','hand','number'], // 自定义 手写 编号
                    // 上下文菜单
                    contextmenu: 'undo redo | table | image | resetNumber', //  | quickComment | quickTag
                    // 草稿箱轮询间隔
                    draftTimes: 30000,
					bullets: [
						{text:'列项——[一级]', value: 'line', level:1},
						{text:'字母a)b)c)[一级]', value: 'lower', level:1},
						{text:'数字1)2)3)[二级]', value: 'num', level:2},
						{text:'符号●[二级]', value: 'circle', level:2},
					],
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
                                    event:'term',
                                    tagTreeId: '100'
                                }
                            ]
                        },
                    ],
                    htmlContent: `<div class="page-container expand" data-type="singleSided" data-title="一般文档" data-outlineid="34352334-eewe-565656" data-stdkind="999"><div class="info-block" data-outlineid="34352334-9934834-990" data-parentid="34352334-eewe-565656" data-outlinetype="6"><p>请输入文档内容...</p></div></div>`
                },
                dialogData: {
					cmpName: undefined,
                    visible: false,
                    title: '提示',
                    width: '300px',
                    type: 'date',
                    value: ''
                },
                emitData: null,                     // 组件数据
				sourceTagList: [],
				tagTreeList: [],
				actEvent: {},
            }
        },
        methods: {
            /**
             * @description 获取页面数据
             */
            getPageData() {
                if (this.$refs.samEditor) {
                    return this.$refs.samEditor.getPageData();
                }
                return null;
            },

            /**
             * @description 组件数据提交上报
             * @param {Object}  evt
             */
			async changeSlotData(evt=null) {
			    // console.log('changeData', this.actEvent, evt);
			    var htmlContent = evt.htmlContent || ""; //.replace(/[\t\n]/g,'');
				// return;
			    switch(evt.act) {
                    // 关闭弹窗
                    case 'close':
                        this.dialogData.visible = false;
                        break;
                    case 'extendEvent':
                        // console.log('this.emitData=>', this.emitData);
						var textContent = evt.currNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
						// console.log(evt.currNode)
						// 注：章标题或条题不能定义标签，这里的TEXT节点为纯文本
						if (evt.event === 'customeTag' && (this.hasClass(evt.currNode, 'ol-list') || this.hasClass(evt.currNode, 'appendix-list'))) {
							this.$message.warning("章标题或条题不能定义标签!");
						} else {
							// 如果是框选了文字，则从起始位置计算到终止位置的字符
							if (evt.range && evt.range.endOffset > evt.range.startOffset) {
								textContent = textContent.slice(evt.range.startOffset, evt.range.endOffset);
							}
							let uuid = $global.guid();

                            let tagData = {
                            	id: uuid,
                            	tid: evt.tagTreeId,
                            	value: evt.tagType,
                            	title: evt.tagName,
                            	content:evt.tagContent
                            }
                            this.$refs.samEditor.interFaceAction({ act:'toggleCustomeTag', ...tagData });
                            this.$message.success("已设置标签!");

							/* let condition = {
								tagId: uuid,
								tagTreeId: evt.tagTreeId,
								docId: this.editorSetting.page.id,
								tagType: evt.tagType,
								tagName: evt.tagName,
								tagContent: evt.tagContent,
								textContent
							}
							// 获取章节ancestors
							condition.ancestors = await this.$refs.samEditor.interFaceAction({ act:'getAncestorsBycurrNode', node:evt.currNode });
							// console.log('condition', condition)
							addTag(condition).then(res => {
								if (res.code === 200) {
									let tagData = {
										id: uuid,
										tid: evt.tagTreeId,
										value: evt.tagType,
										title: evt.tagName,
										content:evt.tagContent
									}
									this.$refs.samEditor.interFaceAction({ act:'toggleCustomeTag', ...tagData });
									this.$message.success("已设置标签!");
									// 刷新标签列表
									this.getTaDataList();
								} else {
									this.$message.error("设置标签失败!");
								}
								this.dialogData.visible = false;
							}) */
						}
						this.dialogData = {
							visible: false
						};
                        break;
					// 新建标签
					case 'addTag':
						this.dialogData = {
							cmpName: 'tag',
							visible: true,
							title: '编辑标签',
							width: '450px',
						}
						break;
                    // 更新标签数据
                    case 'updateTag':
                        this.getTagTreeList();
                        break;
					// 引用术语 term:true 系统识别插入了术语，并按规范格式新建条题
					case 'addTerm':
                        this.rightWidth = 0;
					    this.$refs.samEditor.interFaceAction({ act:'insertContent', htmlContent, term:true });
					    break;
			    }
			},

            /**
             * @description 接收上报事件
             * @param {Object} data
             */
            changeEvent(data) {
                // console.log('about revice change=>', data);
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
                    case 'click':
                        console.log('about revice click=>', data);
                        break;
                    case 'close':
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
                this.emitData = { ...obj };
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
                        this.$refs.samEditor.interFaceAction({ act:'toggleCustomeTag', remove:true, tagId });
                        this.$message.success("已移除标签!");
						/* let tagItem = _.find(this.sourceTagList, { tagId });
						if (tagItem) {
							removeTag(tagId).then(res => {
								// console.log('removeTag=>', res);
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
						} */
					}
                }
			},
			/**
			 * @description DOM节点包含CLASS类名
			 * @param {Element} ele
			 * @param {String} cls
			 */
            hasClass(ele=null, cls="") {
                cls = cls || '';
                if (cls.replace(/\s/g, '').length == 0 || !ele.className) return false; //当cls没有参数时，返回false
                return new RegExp(' ' + cls + ' ').test(' ' + ele.className + ' ');
            },
			/**
			 * @description 获取标签树
			 * @param {String} docId
			 */
			async getTagTreeList(docId="") {
                var editorConfig = $global.getTinymceConfig();
				var condition = {
				    "pageNum": 1,
				    "pageSize": 1000
				}
				var res = await listTagTree(condition, editorConfig.editorURL||process.env.VUE_APP_EDITOR_URL);
				if (res.code === 200) {
				    var tagTreeList = res.rows.map(item => {
						item = _.omit(item, ['createTime','createUser','delFlag','deleteTime','deleteUser','isAsc','orderByColumn','pageNum','pageSize','params','remark','searchValue','searchValueArray','updateTime','updateUser']);
				        return item;
				    });
					// 转换为树结构
					this.tagTreeList = $global.toTree(tagTreeList, { idKey:'tagTreeId', parentKey:'parentId' });
					// console.log('this.tagTreeList', this.tagTreeList);
					// 获取所有文档的标签
					this.getTaDataList(docId);
				}
			},
			/**
			 * @description 获取所有文档的标签
			 * @param {String} docId
			 */
			async getTaDataList(docId="") {
                var editorConfig = $global.getTinymceConfig();
				docId = docId || this.editorSetting.page.id;
				this.sourceTagList = [];
				var res = await tagList({ docId, delFlag:0 }, editorConfig.editorURL||process.env.VUE_APP_EDITOR_URL);
				if (res.code === 200) {
					this.sourceTagList = res.rows.map(item => {
						item = _.omit(item, ['createTime','createUser','delFlag','deleteTime','deleteUser','isAsc','orderByColumn','pageNum','pageSize','params','remark','searchValue','searchValueArray','updateTime','updateUser']);
						return item;
					});
					// console.log('this.sourceTagList=>', this.sourceTagList)
				}
			}
        },
        created() {
            var docData = $global.getStroage('tinymceDocData'), docId;
            if (docData) {
                docId = docData.docId;
            } else  if(this.$route.query && this.$route.query.id) {
                docId = this.$route.query.id;
            }

            if (docId) {
                this.$set(this.editorSetting.page, 'id', docId);
                this.$set(this.editorSetting, 'htmlContent', '');
            }

            /* if(this.$route.query && this.$route.query.userId) {
                this.editorSetting.author.userId = this.$route.query.userId;
            }

            if(this.$route.query && this.$route.query.commitid) {
                this.editorSetting.author.commitId = this.$route.query.commitid;
            } */

            if (this.$route.query && this.$route.query.author) {
                this.editorSetting.author = this.$route.query.author;
            }
            this.inited = true;
			// this.getTagTreeList(docId);
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
