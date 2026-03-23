<template>
    <div class="doc-editor-cmp">
        <div class="pdf-container">
            <pdfViewer v-if="pdfUrl" ref="sourcePdf" :url="pdfUrl" :nodeURL="nodeUrl" zoomIn="100" base64 closeSidebar @change="changeEvent" />
        </div>
        <div class="editor-container" v-loading="loading" element-loading-text="正在构建编辑器文档中,请稍候...">
            <div class="control-btns">
                <div>
                    <span>
                        <label>行距：</label>
                        <el-input-number size="mini" v-model="eleOption.lineHeight" :precision="2" controls-position="right" @change="(val) => {resetStyle('lineHeight',val)}" :min="1" :max="3" style="width: 70px;" />
                    </span>
                    <span>
                        <label>字体大小：</label>
                        <el-input-number size="mini" v-model="eleOption.fontSize" :precision="2" controls-position="right" @change="(val) => {resetStyle('fontSize',val)}" :min="9" :max="80" style="width: 70px;" />
                    </span>

                    <!-- <el-button type="text" :disabled="currRange===null" @click.stop.prevent="alignCenter">替换</el-button> -->
                    <el-dropdown @command="handleReplace" style="margin: 0 5px;">
                        <span class="el-dropdown-link">
                            字符替换<i class="el-icon-arrow-down el-icon--right"></i>
                        </span>
                        <el-dropdown-menu slot="dropdown">
                            <el-dropdown-item command="page">当前页面</el-dropdown-item>
                            <el-dropdown-item command="all">全部页面</el-dropdown-item>
                        </el-dropdown-menu>
                    </el-dropdown>
                    <el-tooltip content="水平居中" placement="top-start">
                        <el-button icon="iconfont icon-liebiaolist36" :disabled="currRange===null" @click.stop.prevent="alignCenter"></el-button>
                    </el-tooltip>
                    <el-tooltip content="往下合并" placement="top-start">
                        <el-button :disabled="currRange===null" icon="iconfont icon-m-xialacaidan" @click.stop.prevent="mergeElement"></el-button>
                    </el-tooltip>
                    <el-tooltip content="移除元素" placement="top-start">
                        <el-button :disabled="currRange===null" icon="iconfont icon-trash" @click.stop.prevent="removeElement"></el-button>
                    </el-tooltip>
                    <el-tooltip content="插入元素" placement="top-start">
                        <el-button :disabled="currRange===null" icon="iconfont icon-m-kapian" @click.stop.prevent="insertElement"></el-button>
                    </el-tooltip>
                    <el-tooltip content="检测元素块" placement="top-start">
                        <el-button icon="iconfont icon-chayan" @click.stop.prevent="checkHtml"></el-button>
                    </el-tooltip>
                    <el-tooltip content="保存修改" placement="top-start">
                        <el-button icon="iconfont icon-cunchu" @click.stop.prevent="saveHtml"></el-button>
                    </el-tooltip>
                    <el-tooltip content="结构化解析" placement="top-start">
                        <el-button icon="iconfont icon-liuzhuan" @click.stop.prevent="transStruct"></el-button>
                    </el-tooltip>
                    <el-tooltip content="操作说明" placement="top-start">
                        <el-button icon="iconfont icon-feedback_fill" @click.stop.prevent="controlGuide"></el-button>
                    </el-tooltip>

                </div>
                <div>
                    <el-button type="text" @click.stop.prevent="getParseContent()">刷新</el-button>
                </div>
            </div>

            <div class="page-container" id="page-container" v-html="htmlContent" @click="clickPage" @keydown="keypressPage" @scroll="scrollPage" @mouseup="mouseupPage" />
            <!-- <sam-editor v-if="editorSetting.htmlContent || editorSetting.page.id" ref="samEditor" :data="editorSetting" @change="changeEvent">
                <template v-slot:version>
                    <div style="margin-top: -5px;">
                        <el-button type="warning" size="mini" icon="el-icon-refresh" @click.stop.prevent="resetParse">重新解析</el-button>
                    </div>
                </template>
            </sam-editor> -->
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
    import { editorConfig } from '../utils/editor_config.js';

	import parseImg from './parseImg.vue';

	// 拖动弹窗
    import elDragDialog from '@/directive/el-drag-dialog';
    // 记录日志
    import undoManager from "@/utils/undoManager";

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
            }
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
                        // Undo Redo管理器
                        this.pageUndoManager = new undoManager({
                            limit: 30,
                            bindHotKeys: true
                        });
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
                editorSetting: Object.assign(editorConfig, {
                    editorId:$global.guid(),
                    wordBreak: false,                       		// 是否为word自动分页处理
                    wordApplication: 'Word.Application',    		// 调用office word com
                    htmlContent: '',
					quickbars: 'bold italic underline strikethrough superscript subscript | aiTool',
					contextmenu: 'undo redo | table | image | resetNumber | imgTool',
                    page: {
                        expand: true,                               // 注意预览模式下及非自动word分页把此功能设为 false
                        empty: false,                               // 是否需要封面后的空白页
                        layout: 'singleSided',                      // 页面按单面方式布局
                    },
                    draftTimes: 0,
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
                }
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
                if (!node.dataset.coordinates) {
                    var parentNode = node.parentNode;
                    var tableNode = $global.getParentBySelector(node,'table');
                    if (tableNode) {
                        parentNode = tableNode;
                    }

                    position = parentNode.dataset.coordinates;
                    pageNo = parentNode.dataset.sourcePage;
                } else {
                    position = node.dataset.coordinates;
                    pageNo = node.dataset.sourcePage;
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
                    ...item
                })
            },

			// 监听上报事件
            changeEvent(obj) {
                // console.log('changeEvent===>', obj)
                if (obj.act) {
                    switch(obj.act) {
                        case 'scrollingTop':
                            if (obj.page != this.currPage) {
                                this.scrollToPage(obj.page);
                            }
                            break;
                        case 'loaded':
                            // console.log('changeEvent===>', obj)
                            if (obj.documentInfo && obj.pagesCount > 1) {
                                this.loadedPdf = true;
                            }
                            break;
						case 'initialized':
							this.editorInstance = this.$refs.samEditor;
							console.log('this.editorInstance===>', this.editorInstance)
							break;
                        case 'close':
                        case 'closeEditor':
                            this.$emit('change', { act:'close' });
                            break;
                        case 'click':
                            var data = this.getCoordinates(obj.evt.target);
                            console.log('changeEvent===>', obj.evt.target, data);
							this.currData = {
								node: obj.evt.target,
								...data
							}
                            if (data.position && data.page && this.loadedPdf) {
                                this.highlight(data);
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
                            // this.$set(this.dialogParam, 'visible', false);
							// this.$set(this.dialogParam, 'data', null);
							this.closeDialog();
                            break;
						case 'parseImage': // 解析图片
							console.log('changeEvent parseImage===>', obj, this.currData)
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
							// console.log('changeDialog parseImage===>', obj, this.currData.node);
							if (this.currData && this.currData.node) {
								this.editorInstance.interFaceAction({act:'insertContent', htmlContent:`<p class="imgs"><img src="${obj.imgSrc}" width="${obj.width}" /></p>`});
								this.closeDialog();
							} else {
								this.$message.warning('请将光标定位到要插入的位置!');
							}
							break;
                        case 'appendText':
                            const appendData = obj.data;
                            if (this.currData && this.currData.node) {
                                let html = '';
                                if (appendData.type === 'text') {
                                    this.editorInstance.interFaceAction({act:'insertContent', htmlContent:`<p style="text-indent: 2em;">${appendData.content}</p>`});
                                } else {
                                    const div = document.createElement('div');
                                    div.innerHTML = appendData.content;
                                    const table = div.querySelector('table');
                                    table.border = "2";
                                    table.setAttribute("style","width: 100%; border: 2px solid #333333;");
                                    table.dataset.id = $global.guid();
                                    this.editorInstance.interFaceAction({act:'insertContent', htmlContent:div.innerHTML});
                                    div.remove();
                                }
                            	this.closeDialog();
                            } else {
                            	this.$message.warning('请将光标定位到要插入的位置!');
                            }
                        case 'appendFormula':
                            const formulaData = obj.data;
                            // debugger
                            if (this.currData && this.currData.node) {
                            	this.editorInstance.interFaceAction({act:'insertContent', htmlContent:`<p class="imgs"><img class="math-img" data-id="${$global.guid()}" data-latex="${formulaData.latex}" src="${formulaData.png}" width="${formulaData.width}" height="${formulaData.height}" contenteditable="true" /></p>`});
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
                // console.log('updateData===>', res)
                if (res && res.success) {
                    this.$message.success('已更新原始数据！');
                }
            },
			// 获取编辑器模板数据
            async getContentTemplateList() {
                this.loading = true;
                // debugger
                const res = await listContentTemplate({}, this.docSetting.editorURL);
                if (res.code === 200) {
                    var listTemplate = res.rows.map(item => {
                        item = _.omit(item, ['createTime', 'createUser', 'delFlag', 'deleteTime', 'deleteUser', 'isAsc', 'orderByColumn', 'pageNum', 'pageSize', 'params', 'searchValue', 'searchValueArray', 'updateTime', 'updateUser']);
                        return item;
                    });
                    listTemplate = listTemplate.filter(o => o.tmplName === 'cover' );
                    this.listTemplate = listTemplate;

                    // debugger
                    if (!this.$route.query.self) {
                        this.getData();
                    } else {
                        this.getParseContent();
                    }
                    // this.getData();
                }
            },
            // 获取解析的内容
            async getParseContent() {
                this.loading = true;
                this.htmlContent = '';
                const condition = {
                    operation: 'getFile',
                    filePath: this.data.htmlPath,//`xml/${this.data.id}.html`,
                }
                let res = await uploadFile(condition, 'http://127.0.0.1:9001', true);
                if (res && res.data) {
                    // this.$message.success('已获取！');
                    // console.log(res.data);
                    this.htmlContent = res.data;
                    this.loading = false;
                    if (this.currPage > 1) {
                        this.scrollToPage(this.currPage);
                    }
                    return;
                }

                const params = {
                    "operation": "query",
                    "queryType": 0,
                    ..._.pick(this.docSetting, ['server','dbName','tableName']),
                    "tableName": "parsed_pdf_content",
                    "condition": {
                        "md5": this.data.md5
                    },
                    orderBy: [{
                        column: 'page',
                        sort: 'ASC'
                    },{
                       column: 'position_y',
                       sort: 'ASC'
                    }],
                    "pageNum":1,
                    "pageSize": 5000
                }
                console.log('getData====>', params);
                // debugger
                res = await dbServer(params, this.nodeUrl);
                if (res && res.data) {
                    const parseContent = [];
                    for (let i=0; i<res.data.length; i++) {
                        const prevItem = res.data[i-1];
                        let item = res.data[i];
                        if (item.contentType !== 'layout' && $global.isJSON(item.content)) {
                            item.content = JSON.parse(item.content);
                            if (prevItem && prevItem.contentType === 'layout' && prevItem.content) {
                                item.layout = prevItem.content.split(',');
                            }
                            item = _.pick(item,['uuid','page','positionY','content','contentType','layout']);
                            parseContent.push(item);
                        }
                    }
                    let htmlContent = await parseStrucData.normalizeContent(parseContent, this.data.docType);
                    this.htmlContent = htmlContent.join("");
                    // console.log('htmlContent===>', htmlContent.join(""));

                    // parseStrucData.regEvent(document.getElementById('page-container'));
                    this.loading = false;
                }
            },

            alignCenter() {
                if (this.currRange) {
                    const block = $global.getParentBySelector(this.currRange, 'info-block');
                    console.log('alignCenter', block)
                    const pageWidth = block.offsetWidth - Number(block.dataset.minLeft) * 2;
                    this.currRange.style.left = block.dataset.minLeft + 'px';
                    this.currRange.style.width = pageWidth + 'px';
                    this.currRange.style.textAlign = 'center';
                    this.currRange.style.textIndent = null;
                }
            },

            handleReplace(cmd) {
                console.log('handleReplace==>', cmd);
                this.$prompt('请输入替换的文字内容', `字符替换：${this.selectionText}`, {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    inputPattern: /\S/,
                    inputErrorMessage: '请输入替换的文字内容',
                    inputPlaceholder: '请输入替换的文字内容',
                    closeOnClickModal: false,

                }).then(({ value }) => {
                    this.replaceTextByEle(value, cmd)
                    // console.log('handleReplace==>', value);
                }).catch(() => { });
            },
            replaceTextByEle(value, type) {
                const reg = new RegExp(this.selectionText, 'g');
                const pageContainer = document.getElementById('page-container');
                const blocks = Array.from(pageContainer.querySelectorAll('div.info-block'));

                const replaceText = (block) => {
                    const childNodes = Array.from(block.childNodes);
                    childNodes.forEach(ele => {
                        let textContent = ele.textContent;
                        ele.innerText = textContent.replace(reg, value);
                    })
                }

                if (type === 'page') {
                    const block = blocks[this.currPage-1];
                    replaceText(block);
                } else {
                    blocks.forEach(block => {
                        replaceText(block);
                    });
                }
            },

            insertElement() {
                if (this.currRange) {
                    const newDiv = document.createElement('div');
                    let left = parseInt(this.currRange.style.left);
                    let top = parseInt(this.currRange.style.top);
                    let height = this.currRange.offsetHeight;
                    let width = this.currRange.offsetWidth;

                    top += height + 10;
                    newDiv.setAttribute('contenteditable', true);
                    newDiv.setAttribute('style', `left:${left}px;top:${top}px;width:${width}px;`);
                    newDiv.dataset.empty = "请输入内容";

                    $global.insertAfter(newDiv, this.currRange);
                    $global.removeClass(this.currRange, 'active');
                    this.currRange = newDiv;
                    $global.addClass(this.currRange, 'active');
                }
            },

            resetStyle(key, val) {
                if (this.currRange) {
                    switch (key) {
                        case 'fontSize':
                            val = val + 'px';
                            break;
                    }
                    this.currRange.style[key] = val;
                }
            },

            removeElement() {
                if (this.currRange) {
                    this.currRange.remove();
                    this.currRange = null;
                }
            },

            mergeElement(evt) {
                if (evt) {
                    const pageContainer = document.getElementById('page-container');
                    const blocks = Array.from(pageContainer.querySelectorAll('div.info-block'));

                    for (let i=0; i<blocks.length; i++) {
                        if (i === 0) {
                            continue;
                        }
                        const block = blocks[i];
                        const prevBlock = block.previousElementSibling;
                        $global.removeClass(block, 'pageHide');
                        if (prevBlock) {
                            $global.addClass(prevBlock, 'pageHide');
                        }
                        block.scrollIntoView({
                            block: "start",
                            inline: "nearest"
                        });
                        // const minLeft = Number(block.dataset.minLeft);
                        const childNodes = Array.from(block.childNodes);
                        for (let j =0; j<childNodes.length; j++) {
                            const ele = childNodes[j];
                            let textContent = ele.textContent;
                            let nextEle = ele.nextElementSibling;
                            if (nextEle && nextEle.dataset.type === ele.dataset.type) {
                                let eleWidth = parseFloat(ele.style.width);
                                let eleLeft = Number(ele.dataset.left);
                                let nextLeft = Number(nextEle.dataset.left);
                                let subLeft = Math.abs(eleLeft - nextLeft);
                                let textIndent =  subLeft / 14;

                                if (eleLeft > nextLeft && eleLeft < 300 && textIndent > 1 && textIndent < 5) { //  && Math.ceil(subLeft / this.minLeft) > 1.5 && (eleLeft-minLeft) > this.minLeft
                                    debugger
                                    eleWidth += subLeft;
                                    // if (eleLeft > nextLeft) {
                                        ele.style.left = nextLeft + 'px';
                                        ele.style.textIndent = textIndent + 'em';
                                    // }
                                    textContent += nextEle.textContent;
                                    ele.textContent = textContent;
                                    console.log(ele, nextEle);
                                    nextEle.remove();
                                }
                            }
                        }
                    }

                    return;
                }

                if (this.currRange) {
                    let nextEle = this.currRange.nextElementSibling;
                    if (nextEle) {
                        let eleContent = this.currRange.textContent;
                        let position = this.currRange.dataset.position.split('||');
                        eleContent += nextEle.textContent;

                        let eleLeft = Number(this.currRange.dataset.left);
                        let nextLeft = Number(nextEle.dataset.left);
                        let subLeft = Math.abs(eleLeft - nextLeft);
                        if (eleLeft > nextLeft) {
                            this.currRange.style.left = nextLeft + 'px';
                            this.currRange.style.textIndent = subLeft + 'px';
                        }
                        position[1] = nextEle.dataset.position;
                        this.currRange.dataset.position = position.join('||');
                        this.currRange.textContent = eleContent;
                        nextEle.remove();
                    }
                }
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
            async saveHtml() {
                const pageContainer = document.getElementById('page-container');
                let condition = {
                    operation: 'saveFile',
                    filePath: `xml/${this.data.id}.html`,
                    data: pageContainer.innerHTML
                }
                let res = await uploadFile(condition, 'http://127.0.0.1:9001');
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
            transStruct() {
                const pageContainer = document.getElementById('page-container');
                const blocks = Array.from(pageContainer.querySelectorAll('div.info-block'));
                const lists = [];
                for (let i=0; i<blocks.length; i++) {
                    const block = blocks[i];
                    const prevBlock = blocks[i-1];
                    $global.removeClass(block, 'pageHide');
                    if (prevBlock) {
                        $global.addClass(prevBlock, 'pageHide');
                    }
                    block.scrollIntoView({
                        block: "start",
                        inline: "nearest"
                    })
                    let items = [];
                    const eles = Array.from(block.childNodes);
                    for (let j=0; j<eles.length; j++) {
                        const ele = eles[j];
                        const top = parseFloat(ele.style.top);
                        const left = parseFloat(ele.style.left);
                        const id = ele.dataset.id;
                        const align = ele.style.textAlign;
                        const page = ele.dataset.page;
                        const position = ele.dataset.position;
                        const image = ele.dataset.image || '';
                        const content = ele.innerText;
                        if (content.replace(/\s/g,'') !== '') {
                            items.push({
                                id,
                                top,
                                left,
                                align,
                                page,
                                position,
                                image,
                                content,
                                contentType: 'text'
                            })
                        }
                    }
                    items = _.orderBy(items, ['top']);
                    lists.push(items)
                }
                console.log('transStruct==>', lists)

                parseStrucData.extractCover(lists[0])
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
            moveElement(direction) {
                if (this.currRange) {
                    const offset = 2;

                    let left = parseInt(this.currRange.style.left);
                    let top = parseInt(this.currRange.style.top);

                    console.log('moveElement==>',left, top)
                    switch (direction) {
                        case 'ArrowUp':
                            top -= offset;
                            break;
                        case 'ArrowDown':
                            top += offset;
                            break;
                        case 'ArrowLeft':
                            left -= offset;
                            break;
                        case 'ArrowRight':
                            left += offset;
                            break;
                    }
                    this.currRange.style.left = left + 'px';
                    this.currRange.style.top = top + 'px';
                }
            },
            resetFontSize(direction) {
                if (this.currRange) {
                    const offset = 1;
                    let fontSize = parseInt(this.currRange.style.fontSize);

                    console.log('resetFontSize==>', fontSize)
                    switch (direction) {
                        case 'ArrowUp':
                        case 'ArrowLeft':
                            fontSize -= offset;
                            break;
                        case 'ArrowDown':
                        case 'ArrowRight':
                            fontSize += offset;
                            break;
                    }
                    this.currRange.style.fontSize = fontSize + 'px';
                }
            },

            aliginElement(key) {
                if (this.currRange) {
                    let oEle = null;
                    switch (key) {
                        case '[':
                            oEle = this.currRange.previousElementSibling;
                            break;
                        case ']':
                            oEle = this.currRange.nextElementSibling;
                            break;
                    }
                    if (oEle) {
                        const left = oEle.style.left;
                        this.currRange.style.left = left;
                    }
                }
            },

            resetWidth(key) {
                if (this.currRange) {
                    const offset = 2;
                    let width = this.currRange.offsetWidth;
                    switch (key) {
                        case '-':
                            width -= offset;
                            break;
                        case '=':
                            width += offset;
                            break;
                    }
                    this.currRange.style.width = width + 'px';
                }
            },
            moveToElement(key) {
                if (this.currRange) {
                    let oEle = null;
                    switch (key) {
                        case 'ArrowUp':
                            oEle = this.currRange.previousElementSibling;
                            break;
                        case 'ArrowDown':
                            oEle = this.currRange.nextElementSibling;
                            break;
                    }
                    if (oEle) {
                        $global.removeClass(this.currRange, 'active');
                        this.currRange = oEle;
                        $global.addClass(this.currRange, 'active');
                        this.setCaretToEnd(this.currRange);
                    }
                }
            },

            clickPage(evt) {
                console.log('clickPage===>', evt.target);
                this.currRange = evt.target;
                this.eleOption = {
                    lineHeight: this.currRange.style.lineHeight ? parseFloat(this.currRange.style.lineHeight) : 1,
                    fontSize: this.currRange.style.fontSize ? parseFloat(this.currRange.style.fontSize) : 13,
                    tagName: this.currRange.dataset.tagName || ''
                }

                const data = evt.target.dataset;

                const pageContainer = document.getElementById('page-container');
                const blocks = Array.from(pageContainer.querySelectorAll('div.info-block'));
                blocks.forEach(block => {
                    const childNodes = Array.from(block.childNodes);
                    childNodes.forEach(ele => {
                        $global.removeClass(ele, 'active');
                    })
                });
                $global.addClass(this.currRange, 'active');

                this.postMessage({
                    highlightRect: true,
                    focus: true,
                    clearAll: true,
                    page: Number(data.page),
                    position: data.position
                })
            },

            setCaretToEnd(element) {
                var range = document.createRange();
                range.selectNodeContents(element);
                range.collapse(false); // 将范围折叠到结束位置（即最后一个字符之后）
                var selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            },

            keypressPage(evt) {
                console.log('keypressPage==>',evt)

                // 合并元素的快捷键
                if (evt.ctrlKey && evt.key === 'd') {
                    evt.preventDefault();
                    this.mergeElement();
                    return false;
                }
                if (evt.ctrlKey && evt.key === 'h') {
                    evt.preventDefault();
                    if (this.selectionText) {
                        this.handleReplace('page');
                    }
                    return false;
                }
                if (evt.ctrlKey && ['[',']'].includes(evt.key)) {
                    evt.preventDefault();
                    this.aliginElement(evt.key);
                    return false;
                }
                if (evt.ctrlKey && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(evt.key)) {
                    evt.preventDefault();
                    this.moveElement(evt.key);
                    return false;
                }
                if (evt.altKey && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(evt.key)) {
                    evt.preventDefault();
                    this.resetFontSize(evt.key);
                    return false;
                }
                if (evt.altKey && ['-','='].includes(evt.key)) {
                    evt.preventDefault();
                    this.resetWidth(evt.key);
                    return false;
                }

                if (evt.key === 'Enter') {
                    setTimeout(() => {
                        console.log(evt.target.innerText)
                        evt.target.innerHTML = evt.target.innerText.replace(/\n/g,'<br/>')
                    }, 300);
                }

                const getCursorAt = (ele) => {
                    const range = window.getSelection().getRangeAt(0);
                    const preCaretRange = range.cloneRange();
                    preCaretRange.selectNodeContents(ele);
                    preCaretRange.setEnd(range.endContainer, range.endOffset);

                    return preCaretRange.toString().length;
                }

                if (['ArrowUp','ArrowDown'].includes(evt.key) && this.currRange) {
                    const cursorStart = getCursorAt(this.currRange);
                    setTimeout(() => {
                        const cursorEnd = getCursorAt(this.currRange)
                        console.log(cursorStart, cursorEnd)
                        if (cursorStart === cursorEnd) {
                            // console.log('moveToElement')
                            this.moveToElement(evt.key);
                        }
                    }, 300);
                }

                const isCursorAtEndOrStart = (ele, isStart=false) => {
                    const range = window.getSelection().getRangeAt(0);
                    const preCaretRange = range.cloneRange();
                    preCaretRange.selectNodeContents(ele);
                    preCaretRange.setEnd(range.endContainer, range.endOffset);

                    var start = preCaretRange.toString().length;

                    var postCaretRange = range.cloneRange();
                    postCaretRange.selectNodeContents(ele);
                    postCaretRange.setStart(range.endContainer, range.endOffset);
                    var end = preCaretRange.toString().length + postCaretRange.toString().length;

                    return isStart ? start === 0 : start === end;
                }


                let position = evt.target.dataset.position.split('||');
                let textContent = evt.target.textContent;

                if (evt.key === 'Delete') {
                    console.log('keypressPage===>', evt.target, this.currRange);
                    // debugger
                    if (isCursorAtEndOrStart(evt.target)) {
                        const nextEle = evt.target.nextElementSibling; // getNextElement(evt.target);//
                        if (nextEle && nextEle.textContent.replace(/\s/g,'') !== '') {
                            position[1] = nextEle.dataset.position;
                            evt.target.dataset.position = position.join('||');
                            evt.target.textContent = textContent + nextEle.textContent;
                            // nextEle.textContent = "";
                            const subLeft = Math.abs(Number(nextEle.dataset.left) - Number(evt.target.dataset.left));
                            if (Number(nextEle.dataset.left) < Number(evt.target.dataset.left)) {
                                evt.target.style.left = nextEle.dataset.left + 'px';
                                evt.target.style.textIndent = subLeft + 'px';
                            }
                            // $global.addClass(nextEle, 'empty');
                            nextEle.remove();
                            this.setCaretToEnd(evt.target);
                        }
                        return false;

                    } else {
                        const contentText = evt.target.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '');
                        console.log('keypressPage contentText===>', contentText);
                    }
                } else if (evt.key === 'Backspace') {
                    if (isCursorAtEndOrStart(evt.target, true) && textContent.replace(/\s/g,'') !== '') {
                        const prevEle = evt.target.previousElementSibling;
                        const prevContext = prevEle.textContent;
                        if (prevEle) {
                            position = prevEle.dataset.position.split('||');
                            position[1] = evt.target.dataset.position;
                            prevEle.dataset.position = position.join('||');
                            if (!/[\u4e00-\u9fa5\u0600-\u06FF]/.test(textContent)) {
                                textContent = ' ' + textContent;
                            }
                            prevEle.textContent = prevContext + textContent;

                            const subLeft = Math.abs(Number(prevEle.dataset.left) - Number(evt.target.dataset.left));
                            if (Number(prevEle.dataset.left) > Number(evt.target.dataset.left)) {
                                prevEle.style.left = evt.target.dataset.left + 'px';
                                prevEle.style.textIndent = subLeft + 'px';
                            }
                            evt.target.remove();
                            this.setCaretToEnd(prevEle);
                        }
                        return false;
                    }
                }
            },
            mouseupPage() {
                this.selectionText = '';
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    this.selectionText = selection.toString();
                    console.log('选中的文本: ', this.selectionText);
                }
            },
            // PDF阅读器滚动后触发
            scrollToPage(page) {
                const pageContainer = document.getElementById('page-container');
                const pageViewer = pageContainer.querySelector(`div.info-block[data-page="${page}"]`);
                // console.log('scrollToPage', pageViewer);
                if (pageViewer) {
                    pageViewer.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                        inline: "nearest"
                    })
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
            .page-container{
                background-color: #DDD;
                overflow: auto;
                height: calc(100% - 32px);

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
                        z-index:1;
                        line-height: 1.5;
                        text-align: justify;
                        word-break: break-all;
                        >* {
                            pointer-events: none;
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
