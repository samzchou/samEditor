<template>
    <div class="doc-editor-cmp">
        <div class="pdf-container">
            <pdfViewer v-if="pdfUrl" ref="sourcePdf" :url="pdfUrl" :nodeURL="nodeUrl" zoomIn="100"  closeSidebar @change="changeEvent" />
        </div>
        <div class="editor-container" v-loading="loading" :element-loading-text="!hasExtract?'正在初始化解析文档中,请稍候...':'正在构建编辑器结构化文档中,请稍候...'">
            <div class="pdf-page-content">
                <sam-editor v-if="editorSetting.htmlContent || editorSetting.page.id" ref="samEditor" :data="editorSetting" @change="changeEvent">
                    <template v-slot:version>
                        <span style="fonst-size:13px;">结构化文档预览</span>
                    </template>
                </sam-editor>
            </div>
        </div>

		<el-dialog
			v-el-drag-dialog
			custom-class="sam-dialog"
			append-to-body
			title="解析图片"
			:visible.sync="dialogParam.visible"
			width="850px"
			:close-on-click-modal="false"
			:destroy-on-close="true"
			:show-close="false">
            <parseImg v-if="dialogParam.visible && dialogParam.data" :data="dialogParam.data" @change="changeEvent" />
        </el-dialog>
    </div>
</template>

<script>
    // 编辑器接口
    import { listContentTemplate } from '@/api/editor.js';
    // 后台Node接口
    import { dbServer, uploadFile } from '@/api/nodeServer.js';
    // 全局函数
    import $global from '@/utils/global.js';
    // PDF组件
    import pdfViewer from '@/components/pdfViewer/pdfViewer.vue';
    // 构造HTML
    import parseStructHtml from '../utils/parseStructHtml.js';
    // 结构化数据
    import parseStrucData from '../utils/parseStrucData.js';
    // 编辑器组件
    import samEditor from '@/components/samEditor/samEditor.vue';
    // 编辑器配置
    import { editorConfig, extendToolbar, fontSize } from '../utils/editor_config.js';
	// 图片识别
	import parseImg from './parseImg.vue';
	// 拖动弹窗
    import elDragDialog from '@/directive/el-drag-dialog';

    export default{
        name: 'doc-editor-cmp',
        inject: ['docSetting'],
		directives: { elDragDialog },
        components: {
            pdfViewer,
            samEditor,
			parseImg
        },
        props: {
            data: {
                type: Object,
                default: () => {
                    return {};
                }
            },
            isSelf: Boolean
        },
        computed: {
            nodeUrl() {
                return this.docSetting.nodeURL;
            },
            pdfUrl() {
				if(this.docData){
					if (this.docData.fileUrl) {
						if (this.docData.fileUrl.startsWith('http')) {
							return this.docData.fileUrl;
						} else {
							return this.docSetting.nodePath + '/files/' + this.docData.fileUrl;
						}
					} else if (this.docData.pdfPath) {
						return this.docData.pdfPath;
					}
				}
                return '';
            },
            waterMask() {
                return this.docSetting.waterMask;
            },
			slotStyle() {
                let obj = {
                    width: this.rightWidth + 'px'
                }
                return obj;
            },
        },
        watch: {
            data: {
                handler(obj) {
					this.docData = null;
                    if (!_.isEmpty(obj)) {
                        this.docData = _.cloneDeep(obj);
                        this.getContentTemplateList();
                    }
                },
                immediate: true,
                deep: true,
            }
        },
        data() {
            return {
                loading: false,
                listTemplate: [],
                outlineList: [],
                docData: null,
                loadedPdf: false,
                // originSetting: _.clone(editorConfig),
                editorSetting: _.merge(_.cloneDeep(editorConfig), {
                    nodeURL: "http://192.168.99.96:9001",
                    editorId:$global.guid(),
                    wordBreak: false,                       		// 是否为word自动分页处理
                    wordApplication: 'Word.Application',    		// 调用office word com
                    htmlContent: '',
					quickbars: 'bold italic underline strikethrough superscript subscript | toggleLevel',
					contextmenu: 'undo redo | table | image | resetNumber | imgTool',
                    mathItems: ["custom", "hand", "edit"], // 自定义 手写'hand',  编号 , "number"
                    // imagetools_toolbar: 'rotateleft rotateright | flipv fliph | crop editimage imageoptions',
                    page: {
                        expand: true,                               // 注意预览模式下及非自动word分页把此功能设为 false
                        empty: false,                               // 是否需要封面后的空白页
                        layout: 'singleSided',                      // 页面按单面方式布局
                    },
                    draftTimes: 0,
                    extendToolbar,
                }),
				currData: null,
				dialogParam: {
					visible: false,
				},
                pageUndoManager: null,                      // Undo Redo管理器
                htmlContent: '',
                currRange: null,
                currPage: 1,
                selectionText: '',
                minLeft: 12,
                eleOption: {
                    fontSize: 13,
                    lineHeight: 1
                },
                tmplType: 1000,
                // isSelf: false,
                hasExtract: false,
            }
        },
        methods: {
            undoRedo(redo=false) {
                if (!redo) {
                    this.pageUndoManager.undo();
                } else {
                    this.pageUndoManager.redo();
                }
            },
			closeDialog() {
				this.dialogParam = {
					visible: false,
				}
			},
            // 重新解析
            async resetParse() {
                // console.log('resetParse===>',this.data)
                const params = {
                    "operation": "query",
                    "queryType": 2,
                    ..._.pick(this.docSetting, ['server','dbName','tableName']),
                    columns: {
                        progressPercentage: 90,
                        dataProcStatus: '',
                        readerProcStatus: ''
                    },
                    condition: {
                        id: this.data.id,
                    }
                }
                console.log('resetParse===>', params)
                const res = await dbServer(params, this.nodeUrl);
                // debugger
                if (res && res.success) {
                    this.$message.success('已开始重新解析文档！');
                    this.$emit('change', { act:'resetParse' });
                }
            },

            // 获取坐标
            getCoordinates(node) {
                var position = undefined, pageNo = undefined;
                if (['BODY','#text'].includes(node.nodeName)) {
                    return null;
                }
                if (!this.hasExtract) {
                    node = $global.getParentBySelector(node, 'text-box');
                }

                if (node && node.nodeName === 'TD') {
                    node = $global.getParentBySelector(node, 'table');
                }

                if (node) {
                    if (!node.dataset.position) {
                        node = node.parentNode;
                    }
                    position = node.dataset.position;
                    pageNo = node.dataset.page;
                }
                return {
                    position,
                    page: pageNo ? Number(pageNo) : '',
                    cls: 'source',
                };
            },

            // 高亮显示
            highlight(item={}, focus=true) {
                this.$refs.sourcePdf.postMessage({
                    highlightRect: true,
                    focus,
                    clearAll: true,
                    ...item,
                    cls: 'in-active',
                })
            },

            // 保存数据
            async extendEvent(event) {
                console.log('extendEvent===>', event, this.currData)
                let node = this.currData?.node;
                let upText = node ? node.textContent.replace(/\s/g,'') : '';
                switch (event) {
                    case 'saveStruct':
                        const htmlContent = await this.editorInstance.interFaceAction({act:'getContent'});
                        this.saveHtml(htmlContent);
                        break;
                    case 'toggleLevel':
                        if (node) {
                            let type = node.dataset.type;
                            type = type === 'section' ? 'text' : 'section';
                            if (type === 'section') { // 判断
                                let isStruct = parseStrucData.isStruct(node.textContent);
                                console.log('extendEvent===> isStruct', isStruct);
                                if (!isStruct) {
                                    type = "text";
                                    this.$message.error('非章节条款格式，请重新调整！');
                                } else {
                                    node.dataset.index = isStruct.index;
                                    node.dataset.outlinetype = isStruct.outlineType;
                                    node.dataset.outlinetitle = isStruct.outlineTitle;
                                    node.dataset.level = isStruct.index.split('.').length;
                                }
                            } else {
                                node.dataset.index = null;
                                node.dataset.outlinetype = null;
                            }
                            node.dataset.type = type;
                        }
                        break;
                    case 'toggleBullet':
                        if (node) {
                            let type = node.dataset.type;
                            type = type === 'bullet' ? 'text' : 'bullet';
                            node.dataset.type = type;
                        }
                        break;
                    case 'toggleTableTitle':
                        if (node) {
                            let type = node.dataset.type;
                            type = type === 'tableTitle' ? 'text' : 'tableTitle';
                            if (type === 'text') {
                                node.removeAttribute('data-number');
                            } else {
                                if (/表([A-Z]?\.?\d+(\.\d+)*)/.test(upText)) {
                                    let titleNum = upText.match(/表([A-Z]?\.?\d+(\.\d+)*)/);
                                    node.dataset.tagTitle = upText.replace(titleNum[0], '');
                                    node.dataset.number = titleNum[1] || 1;
                                } else {
                                    type = 'text';
                                    this.$message.warning('非标准表标题格式！');
                                }
                            }
                            node.dataset.type = type;
                        }
                        break;
                    case 'toggleImgTitle':
                        if (node) {
                            let type = node.dataset.type;
                            type = type === 'imgTitle' ? 'text' : 'imgTitle';
                            if (type === 'text') {
                                node.removeAttribute('data-number');
                                node.removeAttribute('data-title');
                            } else {
                                if (/图([A-Z]?\.?\d+(\.\d+)*)/.test(upText)) {
                                    let titleNum = upText.match(/图([A-Z]?\.?\d+(\.\d+)*)/);
                                    node.dataset.tagTitle = upText.replace(titleNum[0], '');
                                    node.dataset.number = titleNum[1] || 1;
                                } else {
                                    type = 'text';
                                    this.$message.warning('非标准图标题格式！');
                                }

                            }
                            node.dataset.type = type;
                        }
                        break;
                    case 'refreshParse': // 重新解析
                        if (this.isSelf) {
                            delete this.docData.htmlPath;
                            this.getParseContent(true);
                        } else {
                            this.resetParse();
                        }
                        break;
                    /* case 'modifyImage':
                        this.editorInstance.interFaceAction({act:'editImage'});
                        break; */
                    case 'mergeElementAll':
                        this.mergeElement('all');
                        break;
                    case 'mergeElementNext':
                        this.mergeElement('next');
                        break;
                    case 'exportStruct':
                        this.exportData(event);
                        break;
                    case 'exportJson':
                        this.$alert('暂不支持导出JSON数据');
                        break;
                    case 'exportXml':
                        this.$alert('暂不支持导出XML数据');
                        break;
                    case 'alignLeft':
                    case 'alignCenter':
                    case 'alignRight':
                        this.setBoxAlign(event);
                        break;
                    case 'size0':
                    case 'size1':
                    case 'size2':
                    case 'size3':
                    case 'size4':
                    case 'size5':
                    case 'size6':
                    case 'size7':
                    case 'size8':
                    case 'size9':
                    case 'size10':
                        this.setBoxFont('size', event.replace('size',''));
                        break;
                    case 'simSun':
                    case 'simHei':
                    case 'Times':
                        this.setBoxFont('family', event)
                        break;

                }
            },

            setBoxFont(type, val) {
                if (this.currData && this.currData.node) {
                    let node = this.currData.node;
                    if ($global.hasClass(node, 'info-block')) {
                        const boxEles = Array.from(node.querySelectorAll('div.text-box'));
                        boxEles.forEach(ele => {
                            if (type === 'size') {
                                let sizeIndex = Number(val);
                                ele.style.fontSize = fontSize[sizeIndex];
                            } else {
                                if (val === 'Times') {
                                    val = 'Times New Roman';
                                }
                                ele.style.fontFamily = val;
                            }
                        })
                    } else {
                        if (!$global.hasClass(node, 'text-box')) {
                            node = $global.getParentBySelector(node, 'text-box');
                        }
                        if (type === 'size') {
                            let sizeIndex = Number(val);
                            node.style.fontSize = fontSize[sizeIndex];
                        } else {
                            if (val === 'Times') {
                                val = 'Times New Roman';
                            }
                            node.style.fontFamily = val;
                        }
                    }
                }
            },
            setBoxAlign(event) {
                if (this.currData && this.currData.node) {
                    let node = this.currData.node;
                    if (node.dataset.type === 'table') {
                        return;
                    }
                    if (!$global.hasClass(node, 'text-box')) {
                        node = $global.getParentBySelector(node, 'text-box');
                    }

                    const block = $global.getParentBySelector(this.currData.node, 'info-block')
                    const nodeWidth = node.offsetWidth;
                    const blockWidth = block.offsetWidth;
                    const minLeft = Number(block.dataset.minLeft);
                    const maxLeft = block.dataset.maxLeft ? Number(block.dataset.maxLeft) : blockWidth - Number(block.dataset.minLeft);
                    const maxWidth = Math.ceil(maxLeft - minLeft);

                    if (event === 'alignLeft') {
                        node.style.left = minLeft + 'px';
                    } else if (event === 'alignCenter') {
                        const subWidth = (maxWidth - nodeWidth) / 2
                        node.style.left = (minLeft + subWidth) + 'px';
                    } else if (event === 'alignRight') {
                        node.style.left = (Number(block.dataset.maxLeft) - nodeWidth) + 'px';
                    }
                }
            },
            // 导出数据
            async exportData() {
                this.loading = true;
                let htmlContent = await this.editorInstance.interFaceAction({act:'getContent'});
                // console.log(this.docData.docType);
                // debugger
                // const outlineHtml = parseStrucData.parseTextHtml(htmlContent);
                const structData = await parseStrucData.setStructOutline(htmlContent, this.data.md5);
                console.log('structData===>', structData, this.listTemplate);
                // debugger
                const coverTemp = _.find(this.listTemplate, { tmplType:structData.coverData.stdKind });
                const coverData = parseStrucData.parseCoverHtml(structData.coverData, coverTemp, this.docSetting.nodeURL);
                structData.pageNo = coverData.pageNo;
                // console.log('coverHtml===>', coverData.htmlContent);
                // 大纲
                const outlineHtml = parseStrucData.parseOutlineHtml(structData.outlineData, structData.coverData);
                this.hasExtract = true;
                // 重新渲染
                console.log('exportData structData====>', structData, coverData.htmlContent);

                this.$set(this.editorSetting, 'htmlContent', '');
                setTimeout(() => {
                    this.setEditorHtmlContent(coverData.htmlContent + outlineHtml, 0, structData);
                }, 500);

            },

			// 监听上报事件
            changeEvent(obj) {
                // console.log('changeEvent===>', obj)
                let isClick = false;
                if (obj.act) {
                    switch(obj.act) {
                        case 'onScroll': // PDF滚动
                            this.currPage = obj.pageIndex;
                            if (!this.hasExtract) {
                                this.postMessage({
                                    page: obj.pageIndex,
                                })
                            }
                            break;
                        case 'scrollingTop': // 编辑器滚动
                            if (obj.page != this.currPage && !this.hasExtract) {
                                this.scrollToPage(obj.page);
                            }
                            break;
                        case 'loaded': // PDF文档加载完成
                            // console.log('changeEvent===>', obj)
                            if (obj.documentInfo && obj.pagesCount > 1) {
                                this.loadedPdf = true;
                            }
                            this.editorInstance && this.editorInstance.interFaceAction({ act:'closeLoading' });
                            break;
						case 'initialized':
                            this.editorInstance = this.$refs.samEditor;
                            // 文件解析渲染后自动化处理合并
                            setTimeout(() => {
                                if (!this.hasExtract && !this.docData.htmlPath) {
                                    this.mergeElement('all');
                                }

                            }, 500)
							break;
                        case 'outData':
                            console.log('外部输出数据====>', obj);
                            break;
                        case 'extendEvent':
                            this.extendEvent(obj.event);
                            break;
                        case 'close':
                        case 'closeEditor':
                            this.$emit('change', { act:'close' });
                            break;
                        case 'mouseup':
                        case 'click':
                            // console.log('changeEvent mouseup click===>', obj.evt.target)
                            if (!isClick) { // 方式重复处理
                                isClick = true;
                                var data = this.getCoordinates(obj.evt.target);
                                console.log('changeEvent===>', obj.evt.target, data);
                                if (data) {
                                    this.currData = {
                                    	node: obj.evt.target,
                                    	...data
                                    }
                                    if (data.position && data.page && this.loadedPdf) {
                                        this.highlight(data);
                                    }
                                }
                                setTimeout(() => {
                                    isClick = false;
                                }, 300)
                            }
                            break;
                        case 'showImg': // 显示图片
							console.log('changeEvent showImg===>', obj);
							var data = {
								cls: "source",
								page: Number(obj.node.dataset.sourcePage),
								position: obj.node.dataset.coordinates
							};
							this.currData = {
								node: obj.node,
								...data
							}
							if (data.position && data.page && this.loadedPdf) {
                                this.highlight(data);
                            }
							this.dialogParam = {
								visible: true,
								data: {
									node: obj.node,
									image: obj.node.dataset.img,
									fromEditor: true,
								}
							}
							break;
						case 'saved':
                            this.updateData();
                            break;
						case 'cropImage':
							this.dialogParam = {
								visible: true,
								data: obj
							}
							break;
						case 'closeDrawer':
							this.closeDialog();
                            break;
						case 'parseImage': // 解析图片
							// console.log('changeEvent parseImage===>', obj, this.currData)
							if (_.isEmpty(this.currData)) {
								this.$message.error('请将光标定位到编辑器中的相关位置！');
							} else {
								if (this.currData.node) {
									this.currData.node.textContent = obj.data.value;
									$global.addClass(this.currData.node, 'blink-bg');
									this.closeDialog();
									setTimeout(() => {
										$global.removeClass(this.currData.node, 'blink-bg');
									}, 5000)
								}
							}
							break;
						case 'appendImage': // 插入图片
							if (this.currData && this.currData.node) {
								this.editorInstance.interFaceAction({act:'insertContent', htmlContent:`<p class="imgs"><img src="${obj.imgSrc}" width="${obj.width}" /></p>`});
								this.closeDialog();
							} else {
								this.$message.warning('请将光标定位到要插入的位置!');
							}
							break;
                        case 'appendText':
                            debugger
                            const appendData = obj.data;
                            if (this.currData && this.currData.node) {
                                const currNode = $global.getParentBySelector(this.currData.node, 'text-box');
                                if (appendData.type === 'text') {
                                    currNode.textContent = appendData.content;
                                } else {
                                    const tableNode = currNode.querySelector('table');
                                    const div = document.createElement('div');
                                    div.innerHTML = appendData.content;
                                    const table = div.querySelector('table');
                                    table.setAttribute("style","width: 100%; border: 2px solid #333333;");
                                    if (tableNode && tableNode.dataset.fixedHeight) {
                                        table.dataset.fixedHeight = tableNode.dataset.fixedHeight;
                                        table.style.height = tableNode.dataset.fixedHeight + 'px';
                                    }
                                    table.dataset.id = $global.guid();
                                    currNode.innerHTML = div.innerHTML;
                                    div.remove();
                                }
                            	this.closeDialog();
                            } else {
                            	this.$message.warning('请将光标定位到要插入的位置!');
                            }
                            break;
                        case 'appendFormula':
                            const formulaData = obj.data;
                            if (this.currData && this.currData.node) {
                            	const currNode = $global.getParentBySelector(this.currData.node, 'text-box');
                                currNode.innerHTML = `<img data-latex="${formulaData.latex}" src="${formulaData.png}" width="${formulaData.width}" height="${formulaData.height}" />`;
                            	this.closeDialog();
                            } else {
                            	this.$message.warning('请将光标定位到要插入的位置!');
                            }
                            break;
                    }
                }
            },
            // 更新原始数据
            async updateData() {
                const params = {
                    "operation": "query",
                    "queryType": 2,
                    ..._.pick(this.docSetting, ['server','dbName','tableName']),
                    columns: {
                        source: 1
                    },
                    condition: {
                        docId: this.docData.docId,
                    }
                }
                const res = await dbServer(params, this.nodeUrl);
                if (res && res.success) {
                    this.$message.success('已更新原始数据！');
                }
            },
			// 获取编辑器模板数据
            async getContentTemplateList() {
                this.loading = true;
                const res = await listContentTemplate({}, this.docSetting.editorURL);
                if (res.code === 200) {
                    var listTemplate = res.rows.map(item => {
                        item = _.omit(item, ['createTime', 'createUser', 'delFlag', 'deleteTime', 'deleteUser', 'isAsc', 'orderByColumn', 'pageNum', 'pageSize', 'params', 'searchValue', 'searchValueArray', 'updateTime', 'updateUser']);
                        return item;
                    });
                    listTemplate = listTemplate.filter(o => o.tmplName === 'cover' );
                    this.listTemplate = listTemplate;
                    this.getParseContent();
                }
            },

            async setEditorHtmlContent(htmlContent='', sectionPage=0, structData=null) {
                this.$set(this.editorSetting, 'htmlContent', '');
                if (!structData) {
                    let startSection = sectionPage ? ` data-section-start="${sectionPage}"` : '';
                    this.$set(this.editorSetting, 'nodeURL', this.docSetting.nodeURL);
                    this.$set(this.editorSetting, 'editorURL', this.docSetting.editorURL);
                    this.$set(this.editorSetting, 'pluginURL', this.docSetting.pluginURL);
                    this.$set(this.editorSetting, 'editorId', this.data.md5);

                    this.$set(this.editorSetting, 'isStandard', false);
                    this.$set(this.editorSetting, 'navShow', false);
                    this.$set(this.editorSetting, 'normal', true);
                    this.$set(this.editorSetting, 'draftTimes', 0);
                    this.$set(this.editorSetting, 'hideSideBar', true);
                    this.$set(this.editorSetting, 'enabledAllBtn', true);
                    this.$set(this.editorSetting, 'menuBar', '');
                    this.$set(this.editorSetting, 'menu', '');
                    this.$set(this.editorSetting, 'toolbar1', 'undo redo | close-btn docFile exportData | dataCover dataTag | mergeElement | doxAlign indent2em lineheight | setFont setSize forecolor | charmap math image table | freeDom | remove-btn | code searchreplace');
                    this.$set(this.editorSetting, 'toolbar2', '');
                    this.$set(this.editorSetting, 'quickbars', 'bold italic underline strikethrough superscript subscript | charmap | doxAlign | searchreplace');
                    this.$set(this.editorSetting, 'style', 'commons-parse');
                    this.$set(this.editorSetting, 'contextmenu', 'undo redo | doxAlign setSize indent2em | image table | toggleLevel toggleBullet toggleImgTitle toggleTableTitle | remove-btn');
                    this.$set(this.editorSetting, 'htmlContent', `<div class="page-container pdf-parse"${startSection}>${htmlContent}</div>`);
                } else {
                    const { rootId, coverData, pageNo } = structData;
                    // debugger
                    this.editorSetting = _.merge(_.cloneDeep(editorConfig), {
                        nodeURL: this.docSetting.nodeURL,
                        editorURL: this.docSetting.editorURL,
                        pluginURL: this.docSetting.pluginURL,
                        editorId: this.data.md5,
                        style: 'commons',
                        normal: false,
                        wordBreak: true,                               // 是否为word自动分页处理
                        wordApplication: 'Word.Application',            // 调用office word com
                        quickbars: 'bold italic underline strikethrough superscript subscript | toggleLevel',
                        contextmenu: 'undo redo | table | image | resetNumber | imgTool',
                        mathItems: ["custom", "hand", "edit"], // 自定义 手写'hand',  编号 , "number"
                        page: {
                            expand: true,                               // 注意预览模式下及非自动word分页把此功能设为 false
                            empty: false,                               // 是否需要封面后的空白页
                            layout: 'singleSided',                      // 页面按单面方式布局
                        },
                        outData: this.docSetting.outData,
                        notSlot: true,
                        normal: false,
                        draftTimes: 0,
                        htmlContent: `<div class="page-container expand" data-id="${this.data.md5}" data-stdkind="${coverData.stdKind}" data-outlineid="${rootId}" data-title="${coverData.stdName}" data-no="${pageNo}">${htmlContent}</div>`,
                        pageData: coverData,
                    });
                }
                this.loading = false;
            },

            // 获取解析的内容
            async getParseContent(flag=false) {
                this.loading = true;
                this.hasExtract = false;
                this.$set(this.editorSetting, 'htmlContent', '');

                let params, res, htmlContent;
                // 如果已经存在html
                if (this.docData.htmlPath && !flag) {
                    params = {
                        "operation": "getFile",
                        "filePath": this.docData.htmlPath
                    }
                    res = await uploadFile(params, this.docSetting.nodeURL);
                    if (res && res.data) {
                        this.setEditorHtmlContent(res.data);
                        return;
                    }
                }
                // 否则先进行构造
                params = {
                    "operation": "query",
                    "queryType": 0,
                    ..._.pick(this.docSetting, ['server','dbName','tableName']),
                    "tableName": "parsed_pdf_content",  // edt_doc_content
                    "pageNum": 1,
                    "pageSize": 5000,
                    condition: {
                        md5: this.data.md5,
                    }
                }
                res = await dbServer(params, this.nodeUrl);
                if (res && res.data) {
                    let lists = res.data.map(item => {
                        item.top = item.positionY;
                        if (item.content && $global.isJSON(item.content)) {
                            item.content = JSON.parse(item.content);
                            let position = item.content.position.split(',');
                            if (position && _.isArray(position)) {
                                item.left = Number(position[0]);
                            }
                        }
                        return _.omit(item, ['createTime','status']);

                    });
                    lists = _.orderBy(lists, ['page','top']);
                    // console.log('lists==>', lists)
                    const docType = 0;
                    const result = await parseStrucData.normalizeContent(lists, this.docSetting, docType);
                    htmlContent = result.htmlArr.join('');
                    this.setEditorHtmlContent(htmlContent, result.sectionPage);
                }
            },
            // 合并元素
            async mergeElement(eventName='all') {
                let textSize = this.docSetting.textSize || 14; // 字符尺寸
                // 合并下一行
                if (eventName === 'next') {
                    if (this.currData && this.currData.node && !['image','table'].includes(this.currData.node.dataset.type)) {
                        const nextNode = this.currData.node.nextElementSibling;
                        const pageBlock = $global.getParentBySelector(this.currData.node, 'info-block');
                        // console.log(this.currData.node, nextNode);
                        if (nextNode && nextNode.dataset.type === 'text') {
                            let position = this.currData.node.dataset.position.split('||');
                            let nextPostion = nextNode.dataset.position;
                            let boxText = this.currData.node.innerText;
                            let nextText = nextNode.innerText;
                            if (Number(this.currData.node.dataset.left) > 200) {
                                boxText += '\n' + nextText;
                            } else {
                                boxText += nextText;
                            }

                            const currLeft = Number(this.currData.node.dataset.left);
                            const nextLeft = Number(nextNode.dataset.left);
                            const subLeft = currLeft - nextLeft;

                            if (subLeft > 0 && (subLeft / textSize) >= 2) { // 一个段落行内的上下处理
                                let em = (subLeft / textSize).toFixed(1);
                                this.currData.node.style.textIndent = em + 'em';
                            }

                            position[1] = nextPostion;
                            this.currData.node.dataset.position = position.join('||');
                            this.currData.node.innerText = boxText;
                            this.currData.node.style.maxWidth = (Number(pageBlock.dataset.maxLeft) - currLeft) + 'px';
                            nextNode.remove();
                        }
                    }
                    return;
                }

                let htmlContent = await this.editorInstance.interFaceAction({act:'getContent'});
                if (!htmlContent) {
                    return;
                }
                const section = document.createElement('div');
                section.innerHTML = htmlContent;
                const pageContainer = section.querySelector('div.page-container');
                const sectionStart = pageContainer.dataset.sectionStart ? Number(pageContainer.dataset.sectionStart)-1 : 2;
                console.log('sectionStart===>', sectionStart);
                const getNextNode = (boxEle) => {
                    let nextBox = boxEle.nextElementSibling; // previousElementSibling
                    if (!nextBox || nextBox.dataset.type !== 'text') {
                        return null;
                    }
                    if ($global.hasClass(nextBox, 'hide') || nextBox.dataset.invalid) {
                        nextBox = getNextNode(nextBox);
                    }
                    return nextBox;
                }

                const mergeNextNode = async (boxEle, minLeft=100, blockWidth=600) => {
                    let nextBox = getNextNode(boxEle);
                    try {
                        if (nextBox && nextBox.dataset.type !== 'section') {
                            let position = boxEle.dataset.position.split('||');
                            let nextPostion = nextBox.dataset.position;
                            let boxText = boxEle.innerText;
                            let nextText = nextBox.innerText;
                            // console.log(boxText, "-----", nextText);
                            // const currPage = Number(boxEle.dataset.page);
                            const currLeft = Number(boxEle.dataset.left);
                            const nextLeft = Number(nextBox.dataset.left);
                            const subLeft = currLeft - nextLeft;

                            // 最低点Y位置
                            const currTop = Number(_.last(position).split(',')[3]); //Number(boxEle.dataset.top);
                            const nextTop = Number(nextPostion.split(',')[1]); // nextBox.dataset.top
                            const subTop = nextTop - currTop;

                            let lastLeft = Number(_.last(position).split(',')[2]);

                            position[1] = nextPostion;
                            // textSize = Math.ceil(position[3] - position[1]) - 7;

                            if ((currLeft - minLeft) < textSize * 3 &&  subLeft > 0 && (subLeft / textSize) >= 1) { // 一个段落行内的上下处理，当前行空了1到3个字符
                                let em = Math.round((subLeft / textSize).toFixed(1));
                                boxEle.style.textIndent = em + 'em';
                                boxEle.style.left = nextLeft + 'px';
                                if (em === 2) {
                                    boxEle.style.left = minLeft + 'px';
                                    boxEle.style.maxWidth = (blockWidth - minLeft * 2) + 'px';
                                } else if (boxEle.style.maxWidth) {
                                    boxEle.style.maxWidth = (parseFloat(boxEle.style.maxWidth) - subLeft) + 'px';
                                }

                                boxEle.dataset.position = position.join('||');
                                boxText += nextText;
                                boxEle.innerText = boxText;
                                nextBox.remove();
                                return await mergeNextNode(boxEle, minLeft, blockWidth);
                            }
                            // 一个段落行内的上下处理（主要是列项） 当前行currLeft < nextLeft, 后行空了1到3个字符
                            else if ((currLeft - minLeft) > textSize*1.5 && currLeft < nextLeft && Math.abs(subLeft) < textSize * 3 && Math.abs(subLeft) > textSize && subTop > 1 && subTop < textSize / 1.5) {
                                if (boxEle.style.maxWidth) {
                                    boxEle.style.maxWidth = (parseFloat(boxEle.style.maxWidth) - Math.abs(subLeft)) + 'px';
                                }
                                boxEle.dataset.position = position.join('||');
                                boxText += nextText;
                                boxEle.innerText = boxText;
                                nextBox.remove();
                                return await mergeNextNode(boxEle, minLeft, blockWidth);
                            }
                            // 一个段落行内的平行处理
                            else if ((currLeft - minLeft) > textSize * 1.5 && Math.abs(nextLeft - minLeft) > textSize * 2 && (Math.abs(subTop) < 10 && nextLeft > lastLeft && (nextLeft - lastLeft) < 20) || (boxEle.dataset.type === 'section' && Math.abs((currLeft - nextLeft)) < (textSize / 2)) && currLeft < 200) {
                                boxEle.dataset.position = position.join('||');
                                boxText += ' ' + nextText;
                                boxEle.innerText = boxText;
                                nextBox.remove();
                                return await mergeNextNode(boxEle, minLeft, blockWidth);
                            }
                            // 一个段落行内的平行处理
                            else if (Math.abs(nextLeft - minLeft) > textSize && subLeft < 0 && Math.abs(Number(position[0].split(',')[1]) - Number(nextPostion.split(',')[1])) < 6 ) {
                                boxEle.dataset.position = position.join('||');
                                boxText += ' ' + nextText;
                                boxEle.innerText = boxText;
                                nextBox.remove();
                                return await mergeNextNode(boxEle, minLeft, blockWidth);
                            }
                        }
                        return true;
                    } catch (error) {
                        console.error('文字合并错误===>', error);
                        return false;
                    }

                }

                const blocks = Array.from(pageContainer.querySelectorAll('div.info-block'));
                for (let i=0; i<blocks.length; i++) {
                    if (i < sectionStart) { // 仅处理正文内容
                        continue;
                    }
                    const block = blocks[i];
                    const minLeft = Number(block.dataset.minLeft);
                    const textBoxes = Array.from(block.querySelectorAll('div.text-box:not(.hide)'));
                    for (let j=0; j<textBoxes.length; j++) {
                        const boxEle = textBoxes[j];
                        boxEle.removeAttribute('data-mce-style');
                        if (boxEle.dataset.invalid || $global.hasClass(boxEle, 'hide') || ['image','formula'].includes(boxEle.dataset.type)) { //  || boxEle.dataset.type !== 'text'  || !nextBox || nextBox.dataset.type !== 'text'
                            continue;
                        }
                        if (boxEle.dataset.type === 'table') {
                            const tableNode = boxEle.querySelector('table');
                            if (tableNode) {
                                const tds = Array.from(tableNode.querySelectorAll('td'));
                                tds.forEach(td => {
                                    let tdContent = td.textContent;
                                    if (tdContent.replace(/\s/g,'') === '……') {
                                        td.textContent = '';
                                    }
                                })
                            }
                        }
                        await mergeNextNode(boxEle, minLeft, parseFloat(block.style.width));
                    }
                }
                htmlContent = section.innerHTML;
                section.remove();
                await this.editorInstance.interFaceAction({act:'resetContent', htmlContent });
                this.loading = false;

            },
            checkHtml() {
                const pageContainer = document.getElementById('page-container');
                const blocks = Array.from(pageContainer.querySelectorAll('div.info-block'));
                blocks.forEach(block => {
                    const childNodes = Array.from(block.childNodes);
                    childNodes.forEach(ele => {
                        $global.toggleClass(ele, 'checked');
                        ele.innerText = ele.textContent;
                    })
                });
            },
            // 保存HTML
            async saveHtml(htmlContent) {
                const section = document.createElement('div');
                section.innerHTML = htmlContent;
                const nodes = Array.from(section.querySelectorAll('div.text-box'));
                // debugger
                nodes.forEach(node => {
                    node.removeAttribute('data-mce-style');
                });
                htmlContent = section.innerHTML;
                section.remove();

                let condition = {
                    operation: 'saveFile',
                    filePath: `xml/${this.data.id}.html`,
                    data: htmlContent
                }
                let res = await uploadFile(condition, this.docSetting.nodeURL);
                if (res && res.data) {
                    if (!this.docData.htmlPath) {
                        this.$set(this.docData, 'htmlPath', res.data);
                        condition = {
                            "operation": "query",
                            "queryType": 2,
                            "columns": {
                                "htmlPath": res.data
                            },
                            "condition": {
                                "id": this.data.id,
                            },
                            ..._.pick(this.docSetting, ['server','dbName','tableName']),
                        }
                        // console.log('getData====>', params)
                        res = await dbServer(condition, this.nodeUrl);
                        if (!res || !res.data) {
                            return;
                        }
                    }
                    this.$message.success('已保存！');
                }
            },

            controlGuide() {
                const htmlConten = ['<span>水平居中：选中元素，宽度适应页面宽度，并水平居中；</span>'];
                htmlConten.push('<span>字符替换：选中文字替换其他文字内容；</span>');
                htmlConten.push('<span>往下合并：选中元素，将后面的元素内容合并；</span>');
                htmlConten.push('<span>移除元素：选中元素后删除；</span>');
                htmlConten.push('<span>插入元素：选中元素，在其后面插入一个新的元素；</span>');
                htmlConten.push('<span>保存修改：保存当前初步解析并修正后的内容；</span>');
                htmlConten.push('<br/><h3>------快捷键------</h3>');
                htmlConten.push('<span>Ctrl+d：往下合并元素；</span>');
                htmlConten.push('<span>Ctrl+h：字符替换；</span>');

                htmlConten.push('<span>Delete：光标在元素的最后，合并后面元素；</span>');
                htmlConten.push('<span>Backspace：光标在元素的最前，将内容合并到前一个元素；</span>');
                htmlConten.push('<span>Ctrl+方向键：移动元素位置；</span>');
                htmlConten.push('<span>Ctrl+[/]：与前元素或后元素左对齐；</span>');
                htmlConten.push('<span>Alt+方向键：放大或缩小文字大小；</span>');
                htmlConten.push('<span>Alt+-/=：增加或减少元素宽度；</span>');
                htmlConten.push('<span>Shift+Enter：元素内容换行；</span>');

                this.$alert(htmlConten.join("<br/>"), '操作说明', {
                    dangerouslyUseHTMLString: true
                });
            },

            // PDF阅读器滚动后触发
            scrollToPage(page) {
                if (this.editorInstance) {
                    this.editorInstance.interFaceAction({act:'moveTopage', value:page })
                }
            },
            // 文档预览器滚动
            scrollPage() {
                const pageContainer = document.getElementById('page-container');
                const pages = Array.from(pageContainer.querySelectorAll('div.info-block'));
                const pageHeight = pageContainer.offsetHeight;

                pages.forEach((page,index) => {
                    var rect = page.getBoundingClientRect();
                    $global.addClass(page,'pageHide');
                    if (rect.top < pageHeight / 2 && rect.bottom > pageHeight / 2) {
                        // console.log('scrollPage===>', page, index);
                        $global.removeClass(page,'pageHide');
                        this.currPage = index + 1;
                        // 同步到PDF页面
                        this.postMessage({
                            page: index + 1,
                        })
                    }
                })
            },

            postMessage(data) {
                if (this.$refs.sourcePdf) {
                    this.$refs.sourcePdf.postMessage(data)
                }
            },

			// 获取文档题录数据
            async getData(docId) {
                // console.log(this.data)
                const params = {
                    "operation": "query",
                    "queryType": 0,
                    ..._.pick(this.docSetting, ['server','dbName','tableName']),
                    "tableName": "edt_document",
                    "one": true,
                    "condition": {
                        "docId": this.data.md5,
                    }
                }
                // console.log('getData====>', params)
                const res = await dbServer(params, this.nodeUrl);
                if (res && res.data && !_.isEmpty(res.data)) {
                    const docData = _.omit(res.data, ['createTime','createUser','updateTime','updateUser','stdCategory','delFlag']);
                    if (docData.stdPerformDate) {
                        docData.stdPerformDate = $global.formatDateTime("yyyy-MM-dd", new Date(docData.stdPerformDate));
                    }
                    if (docData.stdPublishDate) {
                        docData.stdPublishDate = $global.formatDateTime("yyyy-MM-dd", new Date(docData.stdPublishDate));
                    }

                    this.docData = docData;
					// 更新编辑器的配置
					this.$set(this.editorSetting, 'editorURL', this.docSetting.editorURL);
					this.$set(this.editorSetting, 'nodeURL', this.docSetting.nodeURL);
					this.$set(this.editorSetting, 'pluginURL', this.docSetting.pluginURL);
                    this.$set(this.editorSetting, 'pageData', this.docData);
					// debugger
                    console.log('this.docData ==============>', this.docData);
                    // 已在编辑器中更新保存过则直接让编辑器处理渲染
                    if (this.docData.source) {
                        this.$set(this.editorSetting.page, 'id', this.docData.docId);
                        this.loading = false;
                    } else {
                        this.getOutlineData();
                    }
                } else {
					this.$message.error('无法获取文档题录数据：' + this.data.md5);
					this.loading = false;
				}
            },
            async getOutlineData() {
                const outlineList = [];
                const params = {
                    "operation": "query",
                    "queryType": 0,
                    ..._.pick(this.docSetting, ['server','dbName','tableName']),
                    "tableName": "edt_doc_outline",
                    condition: {
                        docId: this.docData.docId,
                    },
                    orderBy: {
                        column: "order_num",
                        sort: "ASC"
                    },
                    pageNum: 1,
                    pageSize: 3000
                }
                const res = await dbServer(params, this.nodeUrl);

				let error = false;
                if (res && res.data && !_.isEmpty(res.data)) {
                    console.log('res.data===>', res.data)
                    let appendixLetter;
                    for (let item of res.data) {
                        // console.log('getitem===>', item)
                        item.content = await this.getOutlineContent(item);
						if (!item.content) {
							error = true;
							break;
						}
                        if (!item.parentId) {
                            item.parentId = "0";
                        }
                        // 附录项及附录条款
                        if ([8, 9].includes(item.outlineType) && item.outlineCatalog) {
                            // debugger
                            if (/^[A-Z]$/.test(item.outlineCatalog)) {
                                appendixLetter = item.outlineCatalog;
                                item.letter = item.outlineCatalog;
                            } else {
                                item.letter = appendixLetter;
                            }
                            item.appendix = true;
                            // item.letter = item.outlineCatalog;
                            // item.letter = $global.numberToLetters(parseInt(item.outlineCatalog) - 1);
                            item.docattr = item.outlineType === 8 ? 'specs' : 'means';
                        } else {
                            appendixLetter = undefined;
                        }
                        outlineList.push(_.omit(item,['LOC','createTime','createUser','docId','levelNum']));
                    }
					if (!error) {
						this.outlineList = outlineList;
						this.createNewStandard();
					}
                } else {
					this.$message.error('无法获取文档大纲数据：' + this.docData.docId);
					this.loading = false;
				}
            },
            async getOutlineContent(item) {
                const params = {
                    "operation": "query",
                    "queryType": 0,
                    ..._.pick(this.docSetting, ['server','dbName','tableName']),
                    "tableName": "edt_doc_content",
                    one: true,
                    condition: {
                        outlineId: item.outlineId,
                    }
                }
                const res = await dbServer(params, this.nodeUrl);
                if (res && res.data && !_.isEmpty(res.data)) {
                    const contentText = res.data?.contentText;
                    if ($global.isJSON(contentText)) {
                        return JSON.parse(contentText);
                    } else {
                        this.$message.error(`${item.outlineTitle}:数据结构非JSON!`);
						this.loading = false;
                    }
                } else {
					this.$message.error('无法获取文档结构数据：' + item.outlineId);
					this.loading = false;
				}
                return null;
            },
            async createNewStandard() {
                console.log('this.outlineList===>', this.outlineList);
                // debugger
                // 构造封面
                var coverTemp = _.find(this.listTemplate, { 'tmplType': this.docData.stdKind || 1400 });
                var coverHtml = '';
                if (coverTemp) {
                    coverHtml = parseStructHtml.parseCoverHtml(this.docData, coverTemp, this.nodeUrl); // , this.editorSetting
                } else {
					console.error('无法匹配到标准所绑定的模板！');
				}
                const pageNo = this.docData.stdSign + ' ' + this.docData.stdNo;
                const htmlArr = [
                    `<div class="page-container" data-id="${this.docData.docId}" data-stdkind="${this.docData.stdKind}" data-outlineid="${this.outlineList[0]['outlineId']}" data-title="${this.docData.stdName}" data-no="${pageNo}" data-new="true">`
                ];
                // 封面
                htmlArr.push(coverHtml);
                // 大纲页
                var outlineTree = $global.handleTree(this.outlineList, 'outlineId', 'parentId', 'children', '0');
                outlineTree = this.resetTree(outlineTree);

                console.log('outlineTree===>', outlineTree)

                const outlineHtml = parseStructHtml.parseHtmlByOutline(outlineTree[0]['children'], this.docData);
                htmlArr.push(outlineHtml)
                // 关门
                htmlArr.push('</div>');

                this.$set(this.editorSetting, 'htmlContent', htmlArr.join(""));
                // console.log(this.editorSetting.htmlContent)

                this.loading = false;

                this.$notify({
                    title: '提示',
                    message: '文档解析已完成，请认真核对解析后的内容并修正',
                    type: 'success',
                    duration: 7500
                });
            },
            resetTree(outlineTree) {
                // console.log('outlineTree===>', outlineTree)
                const sortByNum = (nodes, letter) => {
                    for( let node of nodes) {
                        if ([8,9].includes(node.outlineType)) {
                            if (node.children && /^[A-Z]$/.test(node.outlineCatalog)) {
                                sortByNum(node.children, node.outlineCatalog)
                            } else {
                                // node.outlineCatalog = letter + '.' + node.outlineCatalog;
                                node.letter = letter;
                            }
                        }
                    }
                }
                sortByNum(outlineTree[0]['children']);
                return outlineTree;
            }
        },
		beforeDestroy() {
            this.docData = null;
			this.editorSetting = null;
        }
    }

</script>

<style lang="scss" scoped>
    .doc-editor-cmp{
        height: 100%;
        display: flex;
        position: relative;
        >div:not(.btns) {
            flex:1;
        }


        .editor-container{
            position: relative;
            .btns{
                position: absolute;
                right: 250px;
                top: 10px;
                z-index: 10;
                color: #4a6a93;
            }
            .control-btns{
                height: 32px;
                padding: 0 15px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                box-shadow: 0 3px 5px 0 rgba(0,0,0,.1);
                z-index: 2;
                position: relative;
                background-color: #e0eaff;
                >div{
                    display: flex;
                    align-items: center;
                    ::v-deep .el-button{
                        padding: 0 3px;
                        font-size: 12px;
                        border-radius: 0;
                    }
                }
            }
            .pdf-page-content{
                background-color: #DDD;
                overflow: auto;
                height: 100%;

                ::v-deep .info-block{
                    background-color: #FFF;
                    margin: 20px auto;
                    position: relative;
                    &.pageHide{
                        >div{
                            visibility: hidden;
                        }
                    }
                    >div{
                        position: absolute;
                        font-family: simSun;
                        font-size: 13px;
                        min-width:50px;
                        max-width: 600px;
                        z-index:1;
                        line-height: 1.5;
                        text-align: justify;
                        word-break: break-all;
                        >* {
                            pointer-events: none;
                        }
                        table{
                            width: 100%;
                            border: 2px solid #333333;
                            margin: 0px auto;
                            max-width: 100%;
                            border-collapse: collapse;
                            th,td{
                                border-style: solid;
                                border-width: 1px;
                                border-color: #333;
                                padding: 0.25mm 0.85mm;
                                line-height: 12.5pt;
                            }
                        }
                        &.empty{
                            z-index:0;
                        }
                        &:hover{
                            background-color: #fcffae;
                            + div:not(.empty){
                                background-color: #edfbdc;
                                &:empty::after{
                                    color: #CCC;
                                }
                            }
                        }
                        &.active{
                            background-color: #fcffae;
                        }
                        &.checked{
                            color: #5372ff;
                            &:nth-child(odd) {
                                color: #39b879;
                            }
                            &:empty::after{
                                content: attr(data-empty);
                                color: red;
                            }
                        }

                        &:empty::after{
                            content: attr(data-empty);
                            color: #efefef;
                            font-family: simSun;;
                        }
                    }
                }
            }
        }
    }
</style>
