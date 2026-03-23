<template>
    <div class="struct-viewer-container">
		<div class="left-wrapper" :style="slotStyle">
			<!-- 大纲 -->
			<div class="outlines">
				<outline ref="outline" :data="outlineList" @change="changeOutline" />
			</div>
			<div class="collapse" @click.stop.prevent="toggleSlot=!toggleSlot">
				<i :class="toggleSlot ? 'el-icon-arrow-left' : 'el-icon-arrow-right'" />
			</div>
		</div>
		<div class="main-wrapper" id="main-wrapper">
			<sam-editor v-if="data" ref="samEditor" :data="editorSetting" v-on="$listeners" @change="changeEvent" />
		</div>
    </div>
</template>

<script>
    // API接口
    import { outlineStructList, contentTemplateStructList } from '@/api/outline';
    // 文档转换HTML模块
    import parseStructHtml from "@/components/tinymceEditor/utils/parseStructFromHtml";
    // 全局方法
    import $global from '@/utils/global';

    // 编辑器配置
    const editorSetting = {
        env: process.env.NODE_ENV, // 编辑器运行的环境
        author: {},
        admin: true,
        zoomIn: true, // 编辑器文档的放大缩小
        // 如果在开发环境下须配置以下接口路径地址
        editorURL: process.env.VUE_APP_EDITOR_URL, // JAVA接口地址 process.env.VUE_APP_EDITOR_URL
        nodeURL: process.env.VUE_APP_REMOTE_API, // nodeServer服务器地址 process.env.VUE_APP_REMOTE_API 'http://192.168.0.239:9001',
        textImgUrl: process.env.VUE_APP_TEXT_IMG_URL, // 文本文档中的图片路径
        reader: true, // 阅读器模式
        struct: true, // 结构化文档
        isStandard: true, // 是否为标准编写
        menuBar: false, // 关闭菜单
        toolbar1: '', // 关闭工具栏1
        toolbar2: '', // 关闭工具栏2
        openSidebar: true, // 展开左侧栏
        quickbars_selection_toolbar: false,
        page: {
            expand: false,          // 注意预览模式下把此功能设为 false
            layout: 'singleSided',  // 页面按单面方式布局
        },
        draftTimes: 0,
        htmlContent: '<div class="page-container reader"><div class="info-block"><p>正在加载文档中...</p></div></div>'
    }

    export default {
        name: 'doc-viewer',
        // 引入组件
        components: {
            outline: () => import('@/components/outline/outline.vue'),
            samEditor: () => import('@/components/samEditor/samEditor.vue'),
        },
        props: {
            data: Object,
        },
        computed: {
			// 右侧栏插槽展开宽度
            slotStyle() {
                return {
                    'width': this.toggleSlot ? this.outlineWidth : '0',
                    'position': this.isMobile ? 'absolute' : 'relative',
                }
            },
            defaultWidth() {
                var containerWidth = document.documentElement.clientWidth;
                return parseInt(containerWidth - 100);
            },
            isMobile() {
                return $global.isMobile();
            },
            zoomTitle() {
                var zoomItem = _.find(this.zoomOptions, { value:this.zoom });
                if (zoomItem) {
                    return zoomItem.label;
                }
                return this.zoom + '%';
            }
        },
        watch: {
            data: {
                handler(data) {
                    this.$nextTick(() => {
                        if (!_.isEmpty(data)) {
							this.editorSetting = Object.assign(this.editorSetting, _.omit(data,['docData']));
							this.docData = _.cloneDeep(data.docData);
							this.sourceOutline = [];
							this.outlineList = [];
							this.checkedItems = [];
							if (this.editorInstance) {
								this.getOutlineList();
							}
                        }
                    })
                },
                immediate: true,
                deep: true
            },

        },
        data() {
            return {
				editorSetting,
				docData: null,
                sourceOutline: [],
				outlineList: [],
				editorInstance: null,
				checkedItems: [],
				toggleSlot: false,
            }
        },
        methods: {
            onLoading(text) {
                if (this.loading && !isLoading) {
                    this.loading.close();
                }
                this.loading = this.$loading({
                    lock: true,
                    text,
                    visible: true,
                    spinner: 'el-icon-loading',
                    background: 'rgba(0, 0, 0, 0.7)'
                });

                setTimeout(() => {
                    this.loading && this.loading.close();
                    this.loading = null;
                }, 120000);
            },
            toggleOutline() {
                this.toggleSlot = !this.toggleSlot;
            },

            changeOutline(data = {}) {
                // console.log('changeOutline', data)
                switch (data.act) {
                    case 'selectItem':
                    case 'selectNode':
                        this.interFaceAction({ act:'foucsId', outlineId: data.data.outlineId });
                        break;
                }
            },

            /**
             * @description 外部接口入口
             * @param {Object} data
             */
            async interFaceAction(data={}) {
                if (this.editorInstance) {
                    return this.editorInstance.interFaceAction(data);
                }
                return null;
            },

            /**
             * @description 编辑器事件上报
             * @param {Object} data
             */
            async changeEvent(data = {}) {
                /*if (!['onScroll', 'mouseoverEvent'].includes(data.act)) {
                    console.log('changeEvent sturct index==>', data)
                }*/
                switch (data.act) {
                    case 'loaded': // 文档加载完成
                        this.editorInstance = this.$refs.samEditor;
                        // 开始处理数据
                        this.getTempList();
                        break;

                    case 'onScroll':
                        // this.setScrollPageIndex(data.top);
                        break;
					case 'quoteClause':
						let target = data.evt.target;
                        let itemIndex = _.findIndex(this.checkedItems, {
                            outlineId: target.dataset.outlineid
                        });

                        if (target.checked) {
                            if (!~itemIndex) {
                                let outlineItem = _.find(this.sourceOutline, {
                                    outlineId: target.dataset.outlineid
                                });
                                let index = target.dataset.index;
                                if (target.dataset.prev) {
                                    index = target.dataset.prev + '.' + index;
                                }
                                if (outlineItem) {
                                    this.checkedItems.push({
                                        docId: this.docData.docId,
                                        stdNo: this.docData.stdNo,
                                        outlineId: target.dataset.outlineid,
                                        outlineTitle: outlineItem.outlineTitle,
                                        outlineType: outlineItem.outlineType,
                                        orderNum: outlineItem.orderNum,
                                        index,
                                        htmlContent: this.getQuoteClauseContent(target.parentNode)
                                    })
                                } else {
                                    this.$message.error('无法匹配到大纲数据！')
                                }
                            }
                        } else {
                            if (!!~itemIndex) {
                                this.checkedItems.splice(itemIndex, 1);
                            }
                        }
                        // 重做排序
                        this.checkedItems = _.orderBy(this.checkedItems, ['outlineType', 'orderNum']);

						console.log('this.checkedItems===>', this.checkedItems)

                        var result = '';
                        // debugger

                        // 组织插入标签的内容
                        var itemResult = this.getValue();
                        if (this.setting && this.setting.quoteClauseByContent) {
                            result = this.parseQuoteSelectedHtml(itemResult);
                        } else {
                            var tagNode = document.createElement('span');
                            tagNode.dataset.tag = 'clause';
                            tagNode.dataset.content = String(itemResult.content);
                            tagNode.setAttribute('contenteditable', 'false');
                            tagNode.textContent = `（见 ${itemResult.values})`;
                            result = tagNode.outerHTML + '&#8203';
                            tagNode.remove();
                        }
						break;
                }
                // this.$emit('change', data);
            },
			getValue() {
                var result = [], strArr = [], stdNo;
                this.checkedItems.forEach(item => {
                    if (!stdNo) {
                        stdNo = item.stdNo;
                    }
                    let obj = _.find(result, { stdNo:item.stdNo });
                    if (!obj) {
                        obj = {
                            docId: item.docId,
                            stdNo: item.stdNo,
                            list: [{
                                outlineId: item.outlineId,
                                index: item.index,
                                title: item.outlineTitle,
                                htmlContent: item.htmlContent
                            }]
                        }
                        result.push(obj);
                    } else {
                        obj.list.push({
                            outlineId: item.outlineId,
                            index: item.index,
                            title: item.outlineTitle,
                            htmlContent: item.htmlContent
                        })
                    }
                });
                result.forEach(item => {
                    let listArr = [];
                    item.list.forEach(data => {
                        listArr.push(data.index);
                    });
                    let content = item.stdNo + ' ' + listArr.join("、");
                    strArr.push(content);
                });

                return {
                    values: strArr.join("；"),
                    stdNo,
                    content: JSON.stringify(result)
                };
            },

			// 获取选中的章节条款内容
            getQuoteClauseContent(node) {
                var htmlContent = node.innerHTML;
                var section = document.createElement('div');
                section.innerHTML = htmlContent;
                var checkedNode = section.querySelector('input[type="checkbox"]');
                if (checkedNode) {
                    let textNode = checkedNode.nextSibling;
                    if (textNode && textNode.nodeName === '#text') {
                        textNode.remove();
                    }
                    checkedNode.remove();
                }

                htmlContent = section.innerHTML;
                section.remove();
                return htmlContent;
            },

            async getStructPages() {
                this.imgGenerating = true;
                this.pageBlocks = await this.editorInstance.interFaceAction({act:'getAllPages'});
                this.pageImages = await this.editorInstance.interFaceAction({act:'transPageToImage'});
                this.imgGenerating = false;
                this.$emit('change', { act:'imgGenerated', pages:this.pageBlocks });
            },

            /**
             * @description 重置编辑器文档内容
             * @param {Boolean} megerDoc 是否合并页面
             */
            async setPageContent(megerDoc=false) {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        this.editorInstance.interFaceAction({
                            act: 'resetContent',
                            htmlContent: this.editorSetting.htmlContent,
                            pageData: this.docData,
                            megerDoc,
                        }).then(rep => {
                            resolve(rep);
                        })
                    }, 1000)
                })
            },

            /**
             * @description 根据文档ID获取大纲数据并组织HTML结构
             * @param {String} docId
             * @param {Boolean} exp 是否继续解析HTML
             */
            async getOutlineList() {
                var res = await outlineStructList({ docId: this.docData.docId }, this.editorSetting.editorURL);
                if (res.code === 200) {
                    var outlineList = res.rows.map(item => {
                        let data = _.omit(item, ['docId', 'ancestors', 'isAsc', 'pageNum',
                            'pageSize', 'remark', 'delFlag', 'orderByColumn', 'infoNum', 'locked',
                            'extendContent', 'updateUser', 'updateTime', 'commitId', 'params',
                            'tagList', 'createTime', 'deleteTime', 'deleteUser', 'searchValueArray',
                            'createUser', 'searchValue'
                        ]);
                        data.content = _.omit(item.content, ['updateUser', 'pageSize',
                            'updateTime', 'remark', 'delFlag', 'orderByColumn', 'params', 'pageNum',
                            'outlineId', 'createTime', 'deleteTime', 'deleteUser',
                            'searchValueArray', 'createUser', 'isAsc', 'searchValue'
                        ]);
                        // 附录项及附录条款
                        if (item.outlineCatalog && item.outlineCatalog.split('.').length > 1 && !item.outlineTitle) {
                            data.isVisible = 0;
                        }
                        if ([8, 9].includes(item.outlineType)) {
                            data.appendix = true;
                            data.letter = $global.numberToLetters(parseInt(item.outlineCatalog) - 1);
                            data.docattr = item.outlineType === 8 ? 'specs' : 'means';
                        }
                        return data;
                    });

                    // 重置大纲排序（按类型、顺序号）
                    outlineList = _.orderBy(outlineList, ['outlineType', 'orderNum', 'outlineCatalog']);
					this.sourceOutline = _.cloneDeep(outlineList);
					console.log('this.sourceOutline===>', this.sourceOutline);
                    var outlineData = $global.handleTree(outlineList, 'outlineId', 'parentId', 'children', '0');
                    this.outlineList = outlineData;
                    // 解析文档
                    this.getDocContent(outlineData);
                } else {
                    this.$message.error('文档无大纲数据！');
                    return null;
                }
            },

            /**
             * @description 解析文档内容
             * @param {Array} outlineData
             */
            async getDocContent(outlineData = []) {
                var pageCls = 'page-container';
                if (!this.data.mergeDoc) {
                    pageCls += ' expand';
                }
                var htmlArr = [
                    `<div class="${pageCls} reader" data-id="${this.docData.docId}" data-no="${this.docData.stdNo}">`
                ];
                var coverTemp = _.find(this.listTemplate, {
                    'tmplType': this.docData.stdKind,
                    'tmplName': 'cover'
                });
                // 定义封面HTML内容
                var coverHtmlData = parseStructHtml.parseCoverHtml(this.docData, coverTemp, this.editorSetting);
                // 解析大纲的HTML内容
                if (coverHtmlData) {
                    let pageNo = coverHtmlData.pageNo;
                    htmlArr.push(coverHtmlData.htmlContent);
                    if (outlineData && outlineData.length) {
                        var outlineHtmlArr = parseStructHtml.parseHtmlByOutline(outlineData, pageNo, this.docData.stdKind, this.listTemplate, this.docData.source);
                        htmlArr = htmlArr.concat(outlineHtmlArr);
                    }
                } else {
                    htmlArr.push(`<div class="info-block"><p>无法读取封面模板内容！</p></div>`);
                }
                htmlArr.push('</div>');


				if (this.editorInstance) {
                    this.interFaceAction({ act:'resetContent', htmlContent:htmlArr.join("") });
                    this.loading = false;
                }
            },

            /**
             * @description 获取文档模板
             * @param {String} docId
             */
            async getTempList(docId='') {
                const { code, rows } = await contentTemplateStructList({}, this.editorSetting.editorURL);
                if (code === 200) {
                    this.listTemplate = rows.map(item => {
                        item = _.omit(item, ['createTime', 'createUser', 'delFlag',
                            'deleteTime', 'deleteUser', 'isAsc', 'orderByColumn', 'pageNum',
                            'pageSize', 'params', 'remark', 'searchValue', 'searchValueArray',
                            'updateTime', 'updateUser'
                        ]);
                        return item;
                    });
                    this.getOutlineList();
                } else {
                    this.$message.error('缺少文档编辑器模板数据！');
                }
            },
        },

		created() {
			// this.getTempList();
		},

        beforeDestroy() {
            if (this.editorInstance) {
                this.editorInstance.interFaceAction({ act: 'destroy' });
            }
        }
    }
</script>

<style lang="scss" scoped>
    .struct-viewer-container {
        height:100%;
		display: flex;
		overflow: hidden;
		position: relative;

        .left-wrapper {
			width: 300px;
			border-right: 1px solid #DDD;
			background-color: #FFF;
			position: static;
			z-index: 100;
			transition: all .25s;
			top:0;
			left:0;
			bottom:0;



			.collapse {
				padding: 3px 0;
				cursor: pointer;
				position: absolute;
				right: -12px;
				top: calc(50% - 10px);
				z-index: 100;
				background-color: #f3f3f3;
				box-shadow: 2px 2px 0 0 rgba(0, 0, 0, .15);
				border-top-right-radius: 3px;
				border-bottom-right-radius: 3px;
				width: 12px;
				text-align: center;
				height: 18px;
				display: flex;

				>i {
					font-size: 10px;
				}
			}
		}

		.main-wrapper {
			flex: 1;
			z-index:100;
		}
    }
</style>
