/**
 * ===================================================================================================================
 * @module
 * @desc 编辑器页面元素处理模块
 * @author sam 2021-09-12
 * ===================================================================================================================
 */

'use strict';
import $global from "@/utils/global"; // 全局通用方法类模块
import { outlineTypes, numberChar } from "../configs/editorOptions";
import tableUtil from './tableUtil';
import levelUtil from './levelUtil';
import bulletUtil from "./bulletUtil";
// import domUtil from "./domUtil";
import outlineUtil from "./outlineUtil";
// import { conforms } from "element-ui/lib/utils/lodash.js"; // lodash


export default {
    loaded: false, // 是否正在加载页面
    editor: null, // 编辑器实例
    vm: {}, // VUE实例
    mergePaing: false, // 正在合并文档
    cateing: false, // 正在处理目次
    hxLevels: {
        "H1":0,
        "H2":1,
        "H3":2,
        "H4":3,
        "H5":4,
        "H6":5,
    },
    /**
     * @description 更新编辑器组件实例
     */
    updateVm(vm) {
        this.vm = vm;
    },
    loadedPage() {
        this.loaded = true;
    },
    /**
     * @description 初始化页面处理模块
     * @param {Object} editor
     * @param {Object} vm
     */
    init(editor=null, vm) {
        this.vm = vm;
        this.catalogueData = {};
    },
    /**
     * @description 获取当前的编辑器实例
     */
    getActiveEditor() {
        var editors = window.tinyMCE.editors && window.tinyMCE.editors.length ? window.tinyMCE.editors : [];
        for (let i = 0; i < editors.length; i++) {
            let editor = editors[i];
            if (editor.id === `tinymce-editor-${this.vm.editorId||''}`) {
                return editor;
            }
        }
        return this.vm.editor || window.tinyMCE.activeEditor;
    },
    /**
     *  @description 汇总引用
     * @param{Object} editor
     * @param{Element} pageContainer
     */
    getAllQuoteStandard(editor = null, pageContainer = null) {
        var htmlContent = [], dataList = [];
        var quoteStandards = Array.from(pageContainer.querySelectorAll('a.quote[data-stdno]'));
        if (!quoteStandards.length) {
            editor.windowManager.alert('当前文档中没有可汇总的引用！');
            return null;
        }
        quoteStandards.forEach(ele => {
            let splitNo = ele.dataset.stdno ? ele.dataset.stdno.split(/\s/i) : ''
            let no = splitNo.length > 1 ? splitNo[1].replace(/[^\d]/g, '') : '';
            no = no ? parseInt(no) : 999999999999;
            let htmlStr = (ele.innerHTML || '') + "&nbsp;" + ele.dataset.title;
            let obj = {
                index: ele.dataset.index ? parseInt(ele.dataset.index, 10) : 10000,
                stdKind: ele.dataset.stdkind,
                stdid: ele.dataset.stdid,
                stdno: ele.dataset.stdno,
                stdname: ele.dataset.stdname || ele.dataset.title,
                text: ele.getAttribute('title'),
                no,
                html: `<span class="tag quote-collection" contenteditable="false">${htmlStr}</span>&#8203`
            }
            dataList.push(obj);
        });
        dataList = _.orderBy(dataList, ['index', 'no']);
		dataList = _.uniqBy(dataList, 'stdid');
        dataList.forEach(item => {
            let node = editor.dom.create('p', { style: 'text-indent: 2em;' }, item.html);
            node.className = 'quote-collection';
            node.dataset.stdkind = item.stdKind;
            node.dataset.stdno = item.stdno;
            node.dataset.stdname = item.stdname;
            node.dataset.title = item.text;
            node.dataset.stdid = item.stdid;
            node.dataset.tag = 'refItem';
            htmlContent.push(node);
        })
        return htmlContent;
    },

    /**
     * @description 插入引用汇总
     * @param{Element} block
     */
    updateQuoteCollect(data = {}) {
        var editor = this.getActiveEditor();
        if (!editor || !editor.getBody()) {
            return;
        }
        var pageContainer = editor.getBody().querySelector('.page-container');
        var htmlNodes = this.getAllQuoteStandard(editor, pageContainer);
        if (htmlNodes) {
            var currNode = data.node || editor.selection.getNode();
            if (currNode) {
                var currBlock = editor.dom.getParent(currNode, '.info-block');
                if (currBlock && currBlock.dataset.outlinetype == '4') {
                    if (currNode.nodeName !== 'P') {
                        editor.windowManager.alert('请在段落中插入引用汇总！');
                        return false;
                    }
                    // 删除原先的汇总元素
                    const quoteCollections = Array.from(currBlock.querySelectorAll('p.quote-collection'));
                    quoteCollections.forEach(ele => {
                        ele.remove();
                    });

                    htmlNodes.forEach(ele => {
                        $global.insertAfter(ele, currNode);
                        if (currNode.textContent.replace(/\s/g, '') === '') {
                            currNode.remove();
                        }
                        currNode = ele;
                    });
                } else {
                    this.vm.$message.error('请在相关引用章节页面中操作引用汇总！');
                    return false;
                }

            } else {
                this.vm.$message.error('未定义光标位置！');
                return false;
            }
        }
    },

    /**
     * @description 设置页面为可无限扩展
     */
    expandPage() {
        var editor = this.getActiveEditor();
        if (!editor || !editor.getBody()) {
            return;
        }
        var pageContainer = editor.getBody().querySelector('.page-container');
        if (!pageContainer) {
            return;
        }
        $global.addClass(pageContainer, 'expand');
    },

    /**
     * @description 缩放页面
     * @param{Number} val
     */
    zoomTransform(val = 1) {
        var editor = this.getActiveEditor();
        if (!editor || !editor.getBody()) {
            return false;
        }
        var browser = window.tinyMCE.Env.browser;
        var body = editor.getBody();
        if (body) {
            if (browser.isChrome()) {
                body.style.zoom = val;
            } else {
                body.style.transform = `scale(${val})`;
            }
        }
        return true;
    },

    /**
     * @description 校验表格的单元格内容是否超出页面的高度
     * @param{Object} editor
     */
    checkTableContent(editor = null) {
        var editor = this.getActiveEditor();
        var pageContainer = editor.getBody().querySelector('.page-container');
        if (!pageContainer) {
            return;
        }
        var errors = [];
        var blockPages = Array.from(pageContainer.querySelectorAll('.info-block:not(.cover):not(.catalogue):not(.disabled)'));
        blockPages.forEach(block => {
            // var blockStyle = window.getComputedStyle(tableTitle);
            var pageHeight = block.offsetHeight > block.offsetWidth ? 900 : 650;
            var tableNodes = Array.from(block.querySelectorAll('table'));
            tableNodes.forEach(table => {
                let parentNode = editor.dom.getParent(table, '.ol-list') || editor.dom.getParent(table, '.append-list');
                let parentTitle = parentNode ? parentNode.firstChild.textContent : '页面' + block.dataset.pagenum;
                let tdHeight = 0;
                // 表标题
                let tableTitle = table.querySelector('.table-title');
                if (tableTitle) {
                    let titleStyle = window.getComputedStyle(tableTitle)
                    tdHeight += tableTitle.offsetHeight + parseFloat(titleStyle.marginTop) + parseFloat(titleStyle.marginBottom);
                    parentTitle += ',表' + tableTitle.dataset.number + " " + tableTitle.textContent;
                }
                // 表描述信息
                let tableDesc = table.querySelector('.table-description');
                if (tableDesc) {
                    tdHeight += tableDesc.offsetHeight;
                }

                // 表头
                let tableHeader = table.querySelector('thead');
                if (tableHeader) {
                    tdHeight += tableHeader.offsetHeight;
                }
                let trs = Array.from(table.querySelectorAll(':scope>tbody>tr'));
                trs.forEach((tr, index) => {
                    let trHeight = tr.offsetHeight + tdHeight;
                    if (!$global.hasClass(tr, 'hide')) {
                        if (trHeight > pageHeight) {
                            errors.push(parentTitle + '中的表格第' + (index + 1) + '行的高度超限，将影响文档的导出！请立即修改');
                        }
                    }
                })
            })
        })

        return errors;
    },
    /**
     * @description 启用或禁用按钮，须在协同并分配模式下
     */
    enabledButtons(currNode) {
        var editor = this.getActiveEditor();
        var editorContainer = document.getElementById(`tinymce-editor-container-${this.vm.editorId}`);
        if (!editorContainer) {
            return false;
        }
        currNode = currNode || editor.selection.getNode();

        const setButton = (disabled) => {
            var toolButtons = Array.from(editorContainer.querySelectorAll('.tox-toolbar-overlord button,.tox-toolbar-overlord div[role="button"],.tox-tbtn__select-label'));
            toolButtons.forEach(btn => {
                if (disabled && !['关闭', 'close', '保存', 'save', '全屏', 'fullscreen','标准通AI','ai bzton', '分页', 'Break Page', '导出','export','文档合并','HTML源码','Source code'].includes(btn.title||btn.textContent)) {
                    btn.setAttribute('disabled', 'disabled');
                    btn.setAttribute('aria-disabled', 'true');
                    if (editor.dom.hasClass(btn, 'tox-split-button')) {
                        btn.style.opacity = 0.5;
                    }
                } else {
                    btn.removeAttribute('disabled');
                    btn.setAttribute('aria-disabled', 'false');
                    btn.style.opacity = null;
                }
                // 不需要目次页面元素的设定则删除该按钮
                if (btn.title === '目次' && this.vm.editorSetting.notCatalogue) {
                    btn.remove();
                }
            })
        }


        var disabled = currNode.nodeName === 'BODY' || (currNode.nodeName === 'P' && currNode.dataset.mceBogus === 'all');

        if (this.vm && ((this.vm.editorSetting.author && this.vm.editorSetting.author.lockedAll && this.vm.editorSetting.author.assignOutline) || disabled)) {
            var parentBlock = editor.dom.getParent(currNode, '.info-block');
            disabled = !parentBlock ? true : (editor.dom.hasClass(parentBlock, 'fixed') || editor.dom.hasClass(parentBlock, 'disabled') || parentBlock.dataset.enlock !== undefined || !parentBlock.isContentEditable);
            if (disabled) {
                // 元素为层级项，且为被锁定正在编辑的
                let olEle = editor.dom.getParent(currNode, '.ol-list') || editor.dom.getParent(currNode, '.appendix-list');
                if (olEle) {
                    disabled = editor.dom.hasClass(olEle, 'disabled');
                }
            }
            setButton(disabled);
        } else {
            setButton(disabled);
        }
    },

    /**
     * @description 锁定页面或章节条目开始进行编辑
     * @param{Object} data 锁定章节条目数据 { outlineId }
     */
    lockedPage(data = null) {
        var editor = this.getActiveEditor();
        var pageContainer = editor.getBody().querySelector('.page-container');
        if (!pageContainer) {
            return false;
        }
        // 当前文档中已被锁定的章节条目数据集
        // var lockedOutline = this.vm.lockedOutline;
        var blockPages = Array.from(pageContainer.querySelectorAll('.info-block:not(.cover):not(.catalogue)'));

        blockPages.forEach(block => {
            block.removeAttribute('contenteditable');
            let blockOutlineId = block.dataset.outlineid;
            // s1.移除锁定的标签元素
            let lockedEle = block.querySelector('.locked');
            if (lockedEle) {
                lockedEle.remove();
            }
            // 先解锁所有章节条目 .enlock
            let allEnLockNodes = Array.from(block.querySelectorAll('[data-outlineid]'));
            allEnLockNodes.forEach(node => {
                $global.removeClass(node, 'enlock');
                node.removeAttribute('contenteditable');
            });
            /**
             * 如果页面匹配(且未被指定了分配到具体章节)到解锁后即可锁定编辑
             * 否则按章节或条目进行处理
             * 1.匹配到章节或条目的，解锁章节或条目，同时解锁页面中的章节或条目
             * 2.其他章节则加锁
             */
            if (data && data.lockedOutlineId && data.lockedOutlineId === blockOutlineId) {
                $global.removeClass(block, 'disabled');
            } else {
                block.setAttribute('contenteditable', 'false');
                // 判断页面中是否匹配须锁定的章节条目, 否则就全部锁定
                let olEle = data && data.lockedOutlineId ? block.querySelector(`[data-outlineid="${data.lockedOutlineId}"]`) : null;
                if (olEle) {
                    $global.removeClass(block, 'disabled');
                    block.removeAttribute('contenteditable');
                    block.dataset.enlock = 'true';
                    this.lockedChapter(block, data);
                } else {
                    $global.addClass(block, 'disabled');
                    lockedEle = editor.dom.create('div', { class: 'locked' }, '已锁定，不可编辑');
                    block.appendChild(lockedEle);
                }
            }
        })
    },
    lockedOutlineId(lockedId = '', unlockedId = '') {
        var editor = this.getActiveEditor();
        var pageContainer = editor.getBody().querySelector('.page-container');
        if (!pageContainer) {
            return false;
        }
        var outlineEle = pageContainer.querySelector(`[data-outlineid="${lockedId}"]`);
        if (outlineEle) {
            var block = editor.dom.getParent(outlineEle, '.info-block');
            var allLiNodes = Array.from(block.querySelectorAll('[data-outlineid]'));

            allLiNodes.forEach(node => {
                let ancestors = outlineUtil.getAncestors(node, block);
                if (ancestors.includes(lockedId)) {
                    $global.addClass(node, 'disabled');
                }
            })
        } else {
            alert('无法定位到章节条目！');
        }
    },

    /**
     * @description 锁定页面中的某个章节或条目编辑
     * @param {Element} block 当前页面
     * @param {Object} data 锁定章节条目数据 { outlineId }
     */
    lockedChapter(block = null, data = null) {
        var allLiNodes = Array.from(block.querySelectorAll('[data-outlineid]'));
        allLiNodes.forEach(node => {
            $global.addClass(node, 'disabled');
            let ancestors = outlineUtil.getAncestors(node, block);
            // let outlineId = node.dataset.outlineid;
            let matchOutline = ancestors.includes(data.lockedOutlineId);
            // 如果章节ID结构匹配到锁定章节条目的ID
            if (matchOutline) {
                if (node.dataset.owner) {
                    $global.addClass(node, 'enlock');
                }
                $global.removeClass(node, 'disabled');
            } else { // 其他的则不能编辑
                node.setAttribute('contenteditable', 'false');
            }
        })
    },


    /**
     * @description 所有页面加锁或解锁
     * @param {Boolean} isLock
     */
    unlockAllPages(isLock = false) {
        var editor = this.getActiveEditor();
        var pageContainer = editor.getBody().querySelector('.page-container');
        if (!pageContainer) {
            return;
        }
        var lockedPages = Array.from(pageContainer.querySelectorAll('.info-block:not(.cover):not(.catalogue)'));
        lockedPages.forEach(block => {
            block.removeAttribute('contenteditable');
            // $global.removeClass(block, 'fixed');
            $global.removeClass(block, 'disabled');
            let lockEle = block.querySelector('.locked');
            if (lockEle) {
                lockEle.remove();
            }
            if (isLock) {
                block.setAttribute('contenteditable', 'false');
                // $global.addClass(block, 'fixed');
                $global.addClass(block, 'disabled');
                lockEle = editor.dom.create('div', { class: 'locked' }, '已锁定，不可编辑');
                block.appendChild(lockEle);
            } else {
                block.removeAttribute('data-enlock');
                let olListNodes = Array.from(block.querySelectorAll('.ol-list,.appendix-list'));
                olListNodes.forEach(ele => {
                    ele.removeAttribute('contenteditable');
                    $global.removeClass(ele, 'enlock');
                    $global.removeClass(ele, 'disabled');
                })
            }
        })
        const coverBlock = pageContainer.querySelector(".info-block.cover");
        const lockCover = isLock ? false : !!this.vm.editorSetting.unlockCover;
        coverBlock.setAttribute("contenteditable", lockCover);
        const editableChilds = Array.from(
            coverBlock.querySelectorAll("[contenteditable]")
        );
        editableChilds.forEach((ele) => {
            ele.removeAttribute("contenteditable");
        });
    },

    /**
     * @description 解锁页面
     * @param {String} outlineId
     */
    unlockPage(outlineId = '') {
        var editor = this.getActiveEditor();
        var pageContainer = editor.getBody().querySelector('.page-container');
        if (!pageContainer) {
            return;
        }
        var lockedPages = [],
            pageTitle = [];
        if (outlineId) {
            lockedPages = Array.from(pageContainer.querySelectorAll(`.info-block[data-outlineid="${outlineId}"]`));
        } else {
            lockedPages = Array.from(pageContainer.querySelectorAll('.info-block:not(.cover):not(.catalogue)'));
        }
        lockedPages.forEach(block => {
            $global.removeClass(block, 'disabled');
            block.removeAttribute('contenteditable');
            let lockedEle = block.querySelector('div.locked');
            if (lockedEle) {
                lockedEle.remove();
            }
            let lockOlNodes = Array.from(block.querySelectorAll('.ol-list,.appendix-list'));
            lockOlNodes.forEach(ele => {
                ele.removeAttribute('contenteditable');
                $global.removeClass(ele, 'disabled');
                $global.removeClass(ele, 'enlock');
            })
            pageTitle.push(block.dataset.title);
        });
        pageTitle = _.uniq(pageTitle);
        return pageTitle;
    },

    /**
     * @description 重置章节内容
     * @param {String} htmlContent
     * @param {String} outlineId
     */
    resetChapterContent(htmlContent = "", outlineId = "") {
        var editor = this.getActiveEditor();
        var pageContainer = editor.getBody().querySelector('.page-container');
        if (!pageContainer) {
            return;
        }
        var chapterBlocks = Array.from(pageContainer.querySelectorAll(`.info-block[data-outlineid="${outlineId}"]`));
        var currBlock;
        chapterBlocks.forEach((block, index) => {
            if (index === 0) {
                currBlock = block;

            } else {
                block.remove();
            }
        });
        if (currBlock) {
            if (['3', '4', '5', '6', '7', '8', '9', '10'].includes(currBlock.dataset.outlinetype)) {
                let titleEle = currBlock.querySelector(".header-title");
                if (titleEle) {
                    htmlContent = titleEle.outerHTML + htmlContent;
                }
                currBlock.innerHTML = htmlContent;
            } else {
                currBlock.outerHTML = htmlContent;
            }
            this.setPageBreak({ element: currBlock }, currBlock);
        }
    },

    /**
     * @description 添加封面
     */
    addCoverPage(overlap = false) {
        var editor = this.getActiveEditor();
        var pageContainer = editor.getBody().querySelector('.page-container');
        if (!pageContainer) {
            return;
        }
        var coverPage = pageContainer.querySelector('.info-block.cover');
        if (coverPage && !overlap) {
            editor.windowManager.confirm('当前文档已经存在封面页！是否覆盖？', flag => {
                if (flag) {
                    this.addCoverPage(true);
                }
            });
            // this.vm.moveTopage(0);
        } else {
            editor.windowManager.open({
                title: '选择封面类型',
                width: 500,
                height: 350,
                body: {
                    type: 'panel',
                    items: [{
                        type: 'selectbox',
                        name: 'coverType',
                        label: '',
                        size: 5,
                        items: [
                            { text: '国家标准', value: '1100' },
                            { text: '行业标准', value: '1200' },
                            { text: '地方标准', value: '6' },
                            { text: '团体标准', value: '1500' },
                            { text: '企业标准', value: '1400' },
                        ]
                    }]
                },
                buttons: [{
                        type: 'cancel',
                        name: 'closeButton',
                        text: 'Cancel'
                    },
                    {
                        type: 'submit',
                        name: 'submitButton',
                        text: 'Ok',
                        primary: true
                    }
                ],
                onSubmit: (api, details) => {
                    var data = api.getData();
                    if (!data.coverType) {
                        editor.windowManager.alert('请选择封面选项！');
                    } else {
                        let res = this.appendCoverPage(data.coverType, overlap);
                        if (res) {
                            api.close();
                        }
                    }
                }
            })
        }
    },
    /**
     * @description 在文档中插入封面
     * @param {String}  coverType 封面类型
     * @param {Boolean} overlap 是否覆盖
     */
    appendCoverPage(coverType = 'gb', overlap = false) {
        return this.vm.getCoverData(coverType, overlap);
    },

    /**
     * @description 文档最后一页添加终结线
     * @param {Object}  editor
     */
    async appendFinishedLine() {
        var editor = this.getActiveEditor();
        if (!editor || !editor.getBody()) {
            return false;
        }
        var pageContainer = editor.getBody().querySelector('.page-container');
        if (!pageContainer) {
            return false;
        }

        const getPageEleHeight = (pageBlock) => {
            let allHeight = 0;
            let childNodes = Array.from(pageBlock.childNodes);
            for (let node of childNodes) {
                allHeight += this.getRealTrHeight(node);//node.offsetHeight;
            }
            return allHeight
        }
        // 先去除已有的终结线
        var finishedEles = pageContainer.querySelectorAll('div.finished');
        if (finishedEles.length) {
            finishedEles.forEach(ele => {
                ele.remove();
            })
        }

        // 判断页面空间是否可以置入终止线
        var lastBlock = pageContainer.lastChild;
        var lastNode = lastBlock.lastChild;
        var blockStyle = window.getComputedStyle(lastBlock);
        var spaceHeight = Math.ceil(parseFloat(blockStyle.height) - parseFloat(blockStyle.paddingTop) - parseFloat(blockStyle.paddingBottom)) - 2;
        var realSpaceHeight = getPageEleHeight(lastBlock) + 32;//editor.dom.getPos(lastNode).y - editor.dom.getPos(lastBlock).y + lastNode.offsetHeight + 32;

        if (this.vm.editorSetting && this.vm.editorSetting.isStandard) {
            var cls = '';
            if (spaceHeight <= realSpaceHeight) {
                cls = ' empty';
            }
            var endLineWeight = this.vm.editorSetting.endLineWeigth || '1.0pt';
            var htmlContent = lastBlock.innerHTML;
            htmlContent += `<div class="finished${cls}" contenteditable="false"><hr class="${cls}" width="33%" style="border-width:${endLineWeight} 0 0 0">​</div>`;
            lastBlock.innerHTML = htmlContent;
        }
    },

    /**
     * @description 添加章节页面
     */
    addChapterPage() {
        var editor = this.getActiveEditor();
        var pageContainer = editor.getBody().querySelector('.page-container');
        if (!pageContainer) {
            return;
        }
        var itemList = [
            { text: '范围', value: '3' },
            { text: '规范性引用文件', value: '4' },
            { text: '术语和定义', value: '5' },
            { text: '其他章节', value: '6' },
        ];
        editor.windowManager.open({
            title: '新建章节',
            width: 500,
            height: 350,
            body: {
                type: 'panel',
                items: [{
                        type: 'selectbox',
                        name: 'type',
                        label: '选择章节类型',
                        size: 4,
                        items: itemList
                    },
                    {
                        type: 'input',
                        label: '章节名称',
                        name: 'title'
                    },
                ]
            },
            buttons: [{
                    type: 'cancel',
                    name: 'closeButton',
                    text: 'Cancel'
                },
                {
                    type: 'submit',
                    name: 'submitButton',
                    text: 'Ok',
                    primary: true
                }
            ],
            onChange: function(api, details) {
                var data = api.getData();
                if (details.name === 'type' && data.type) {
                    var item = _.find(itemList, { value: data.type });
                    api.setData({ title: item.text });
                }
            },
            onSubmit: (api, details) => {
                var data = api.getData();
                if (!data.type || !data.title) {
                    editor.windowManager.alert('请选择章节类型并输入名称！');
                } else {
                    this.vm.addChapterPage(data);
                    api.close();
                }
            }
        })
    },


    /**
     * @description 移除页面
     * @param {Object}  data 节点数据
     * @param {Function} callBack 回调函数
     */
    removePage(data = null, callBack = null) {
        var editor = this.getActiveEditor();
        var pageContainer = editor.getBody().querySelector('.page-container');
        if (!pageContainer.dataset.merge) {
            var blocks = pageContainer.querySelectorAll(`.info-block[data-outlineid="${data.outlineId}"]`);
            blocks.forEach(block => {
                block.remove();
            });
        } else {
            this.vm.$message.error('文档已合并，不可删除章节！');
            // editor.windowManager.alert('文档已合并，不可删除章节！')
        }

        // 重置章节索引号
        this.refreshChapterPage(data.letter === undefined);
        // 重置目次
        this.autoSetCatalogue();
        // 回调
        callBack && callBack();
    },

    /**
     * @description 往上递归取出所有父级的outlineId
     * @param {Element} node
     * @param {Element} pageContainer
     */
    getAncestors(node = null, pageContainer = null) {
        var outlineId = node.dataset.outlineid;
        var parentId = node.dataset.parentid;
        var arr = [outlineId];
        const getParentNode = outlineId => {
            let parentNode = pageContainer.querySelector(`div[data-outlineid="${outlineId}"]`);
            if (parentNode) {
                arr.push(parentNode.dataset.outlineid);
                getParentNode(parentNode.dataset.parentid);
            }
        }
        getParentNode(parentId);
        return arr.reverse();
    },

    /**
     * @description 获取页面的所有标签
     * @param {Element}  editor
     */
    geTagsBypage(editor = null, isCommit = false) {
        var editor = this.getActiveEditor();
        if (!editor.getBody()) {
            return false;
        }
        const pageContainer = editor.getBody().querySelector('.page-container');
        if (!pageContainer) {
            return false;
        }

        var tagList = [];
        if (pageContainer) {
            var docId = pageContainer.dataset.id || $global.guid();
            var blocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.cover):not(.catalogue):not(.disabled)'));
            blocks.forEach(block => {
                var list = [];
                // 自定义标签
                let tagNodes = Array.from(block.querySelectorAll('[data-tag]:not([data-bind])'));
                tagNodes.forEach(tagNode => {
                    let outlineId = '', ancestors = '';
                    let olEle = editor.dom.getParent(tagNode, '.ol-list') || editor.dom.getParent(tagNode, '.appendix-list');
                    if (olEle) {
                        outlineId = olEle.dataset.outlineid;
                        ancestors = this.getAncestors(olEle, pageContainer);
                    } else {
                        outlineId = block.dataset.outlineid;
                        ancestors = this.getAncestors(block, pageContainer);
                    }
                    ancestors.unshift(docId);
                    tagNode.dataset.id = tagNode.dataset.id || $global.guid();
                    let obj = {
                        docId,
                        outlineId,
                        ancestors: ancestors.join(","),
                        tagTreeId: tagNode.dataset.tid || '',
                        tagId: tagNode.dataset.id,
                        tagName: tagNode.getAttribute('title') || tagNode.textContent,
                        tagType: tagNode.dataset.tag || 'template',
                        tagContent: tagNode.dataset.content,
                        stdNo: tagNode.dataset.stdno || '',
                        stdName: tagNode.dataset.stdname || '',
                        textContent: tagNode.outerHTML
                    }
                    // 术语和定义标签
                    if (obj.tagType === 'term') {
                        obj.term = { zhName:tagNode.dataset.zhname||'', enName:tagNode.dataset.enname||'', para:[]};
                        // 带入内容
                        let nextSiblings = $global.getNextAllNodes(tagNode);
                        nextSiblings.forEach(sNode => {
                            let aNode = sNode.querySelector('a');
                            if (aNode) {
                                obj.term.para.push(aNode.textContent);
                            } else {
                                obj.term.para.push(sNode.textContent);
                            }
                        })
                    }

                    list.push(obj);
                });
                // 术语和定义标签
                /* let termNodes = Array.from(block.querySelectorAll('[data-outlinetype="5"'));
                termNodes.forEach(node => {
                    if (node.dataset.index.length > 1) {
                        let termNode = node.querySelector('p.tag')
                        let obj = {
                            outlineId: node.dataset.outlineid,
                            tagType: 'termItem',
                            tagName: 'termItem',

                        }
                    }
                }) */

                let data = {
                    docId,
                    outlineId: block.dataset.outlineid,
                    tagList: list
                }
                tagList.push(data);
            })
        }
        // 过滤相同的outlineId
        var filterArr = [];
        tagList.forEach((item, index) => {
            let filterData = filterArr.find(o => { return o.outlineId === item.outlineId });
            if (filterData) {
                filterData.tagList = filterData.tagList.concat(item.tagList);
            } else {
                filterArr.push(item);
            }
        })
        return filterArr;
    },

    /**
     * @description 获取封面信息
     */
    getPageData() {
        var editor = this.getActiveEditor();
        if (!editor.getBody()) {
            return null;
        }
        var pageContainer = editor.getBody().querySelector(`.page-container`);
        if (!pageContainer) {
            return null;
        }
        if (pageContainer.dataset && pageContainer.dataset.stdkind && this.vm.pageData) {
            this.vm.pageData.stdKind = parseInt(pageContainer.dataset.stdkind) || 0;
        }
        var data = {
            docId: pageContainer.dataset.id || this.vm.pageData?.docId || $global.guid(),
            outlineid: pageContainer.dataset.outlineid || this.vm.pageData.outlineid || $global.guid(),
            stdTitle: pageContainer.dataset.title,
            stdKind: this.vm.pageData?.stdKind || parseInt(pageContainer.dataset.stdkind) || 0
        }
        var coverPage = pageContainer.querySelector('.cover');
        if (coverPage) {
            if (this.vm.editorSetting.isStandard && this.vm.pageData.stdKind !== this.vm.editorSetting.tmplType) {
                // 潍柴保密等级
                let secrecyEle = coverPage.querySelector('.secrecy');
                if (secrecyEle) {
                    data.metaData = secrecyEle.textContent;
                }

                // ICS编号
                const icsNumberEle = coverPage.querySelector('.icsNumber') || coverPage.querySelector('.ics');
                if (icsNumberEle && icsNumberEle.textContent !== icsNumberEle.dataset.name) {
                    data.icsNumber = icsNumberEle.textContent;
                }
                // CCS编号
                const ccsNumberEle = coverPage.querySelector('.ccsNumber') || coverPage.querySelector('.ccs');
                if (ccsNumberEle && ccsNumberEle.textContent !== ccsNumberEle.dataset.name) {
                    data.ccsNumber = ccsNumberEle.textContent;
                }
                // 备案号
                const recordEle = coverPage.querySelector('.recordNumber');
                if (recordEle && recordEle.textContent !== recordEle.dataset.name) {
                    data.recordNumber = recordEle.textContent;
                }

                // 标准文档抬头
                data.stdTitle = '中华人民共和国国家标准';
                const stdTitleEle = coverPage.querySelector('h1.title');
                if (stdTitleEle && data.stdKind !== 1100) {
                    data.stdTitle = stdTitleEle.textContent;
                }

                // 标准编号
                const stdNoEle = coverPage.querySelectorAll('.numbers>.tt>span');
                data.stdNo = "";
                if (stdNoEle.length) {
                    stdNoEle.forEach((s, idx) => {
                        if ($global.hasClass(s, 'stdSign')) {
                            data.stdSign = s.textContent;
                        } else {
                            data.stdNo += s.textContent;
                        }
                    });
                } else {
                    let stdNo = coverPage.querySelectorAll('.numbers>.tt') ? coverPage.querySelectorAll('.numbers>.tt').textContent : '';
                    if (stdNo) {
                        stdNo = stdNo.split(/\s/i);
                        if (stdNo.length > 1) {
                            data.stdSign = stdNo[0].replace(/\s/g, '');
                            data.stdNo = stdNo[1].replace(/\s/g, '');
                        }
                    }
                }

                // 标准替代号
                const origStdNoEle = coverPage.querySelector('.numbers .origStdNo');
                if (origStdNoEle && origStdNoEle.textContent !== origStdNoEle.dataset.name) {
                    data.origStdNo = origStdNoEle.textContent;
                }
                // 标准名称
                const stdNameEle = Array.from(coverPage.querySelectorAll('p.std-name'));
                if (stdNameEle.length) {
                    let stdName = [];
                    stdNameEle.forEach(n => {
                        let str = n.textContent.replace(/\n$/,'');
                        if (str) {
                            stdName.push(str);
                        }
                    });
                    data.stdName = stdName.join("\n");
                }

                // 标准英文名称
                const stdNameEnEles = Array.from(coverPage.querySelectorAll('.en-name'));
                if (stdNameEnEles.length) {
                    let enName = [];
                    stdNameEnEles.forEach(n => {
                        let str = n.textContent;
                        if (str) {
                            enName.push(str);
                        }
                    });
                    data.stdNameEn = enName.join("\n");
                }

                // 一致性标识
                const consistentSignEle = coverPage.querySelector('.sign-name');
                if (consistentSignEle && consistentSignEle.textContent !== consistentSignEle.dataset.name) {
                    data.consistentSign = consistentSignEle.textContent;
                }
                // 标准发布的版本号等
                const stdEditionEle = coverPage.querySelector('.std-edition');
                if (stdEditionEle && stdEditionEle.textContent !== stdEditionEle.dataset.name) {
                    data.stdEdition = stdEditionEle.textContent;
                }

                // 标准发布日期
                const stdPublishDateEle = coverPage.querySelector('.stdPublishDate');
                if (stdPublishDateEle && stdPublishDateEle.textContent !== stdPublishDateEle.dataset.name) {
                    data.stdPublishDate = stdPublishDateEle.textContent;
                    if (!$global.isDate(data.stdPublishDate)) {
                        delete data.stdPublishDate;
                    }
                }
                // 标准实施日期
                const stdPerformDateEle = coverPage.querySelector('.stdPerformDate');
                if (stdPerformDateEle && stdPerformDateEle.textContent !== stdPerformDateEle.dataset.name) {
                    data.stdPerformDate = stdPerformDateEle.textContent;
                    if (!$global.isDate(data.stdPerformDate)) {
                        delete data.stdPerformDate;
                    }
                }
                // 标准发布单位
                var releaseDepartmentEle = coverPage.querySelector('.main-util .releaseDepartment');
                if (releaseDepartmentEle) {
                    data.releaseDepartment = releaseDepartmentEle.innerText;
                }
            } else {
                // 航司模板
                var stdNoEle = coverPage.querySelector('.std-no');
                if (stdNoEle) {
                    data.stdNo = stdNoEle.textContent;
                }
                var releaseDepartmentEle = coverPage.querySelector('.releaseDepartment');
                if (releaseDepartmentEle) {
                    data.releaseDepartment = releaseDepartmentEle.textContent;
                }
                var stdNameEle = coverPage.querySelector('.std-name');
                if (stdNameEle) {
                    data.stdName = stdNameEle.textContent;
                }
                var approverEle = coverPage.querySelector('.approver');
                if (approverEle) {
                    data.updateUser = approverEle.textContent;
                }
                var controlEle = coverPage.querySelector('.control');
                if (controlEle) {
                    data.controlledState = controlEle.textContent;
                }
                var numberEle = coverPage.querySelector('.distribution-number');
                if (numberEle) {
                    data.distributeNumbers = numberEle.textContent;
                }
                var versionEle = coverPage.querySelector('.doc-version');
                if (versionEle) {
                    data.docVersionName = versionEle.textContent;
                }
                var stdPublishDateEle = coverPage.querySelector('.stdPublishDate');
                if (stdPublishDateEle) {
                    data.stdPublishDateEle = stdPublishDateEle.textContent;
                }
            }
        }
        // 获取页面的布局
        var layoutData = this.getPageLayout(pageContainer);
        // 潍柴动力审批表格
        var approvePage = pageContainer.querySelector('.info-block.approve');
        var approveContent = '';
        if (approvePage) {
            approveContent = approvePage.innerHTML;
        }

        data.jsonContent = JSON.stringify({
            pageType: (pageContainer.dataset.type && pageContainer.dataset.type !== 'undefined') ? pageContainer.dataset.type : 'singleSided',
            layoutData,
            approveContent
        });
        return data;
    },

    /**
     * @description 获取页面的布局
     * @param {Element} pageContainer
     */
    getPageLayout(pageContainer = null) {
        // console.log('doc.pageData=>',this.vm.pageData);
        var sourceData = this.vm.pageData?.jsonContent ? JSON.parse(this.vm.pageData.jsonContent) : {};
        var layoutList = sourceData.layoutData || [];
        // 非锁定状态下
        var blocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.fixed)'));
        blocks.forEach(block => {
            let obj = {
                outlineId: block.dataset.outlineid || '',
                parentId: block.dataset.parentid || '',
                outlineType: block.dataset.outlinetype || '',
                pageSize: block.dataset.pagesize || '',
                pageNum: block.dataset.pagenum || '',
                contentId: block.dataset.contentid || '',
                style: block.getAttribute('style') || ''
            }
            let index = _.findIndex(layoutList, { outlineId: obj.outlineId, pageNum: obj.pageNum });
            if (!!~index) {
                layoutList.splice(index, 1, obj);
            } else {
                layoutList.push(obj)
            }
        })
        return layoutList;
    },
    /**
     * @description 重置页面的布局
     * @param {Element} pageContainer
     */
    resetPageLayout(editor = null, pageData = null) {
        var pageContainer = editor.getBody().querySelector('.page-container');
        if (pageContainer) {
            var jsonContent = pageData.jsonContent ? JSON.parse(pageData.jsonContent) : {};
            var layoutList = jsonContent.layoutData || [];
            // 页面排版方式
            pageContainer.dataset.type = jsonContent.pageType || 'singleSided';
            // 遍历处理页面布局
            var blocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.cover):not(.catalogue)'));
            blocks.forEach(block => {
                let outlineId = block.dataset.outlineid || '';
                let pageNum = block.dataset.pagenum || '';
                let layoutData = _.find(layoutList, { outlineId, pageNum });
                if (layoutData && layoutData.style) {
                    block.setAttribute('style', layoutData.style);
                }
            });
        }
        return true;
    },

    /**
     * @description 新建一个文档
     * @param {Element} pageContainer
     */
    createNewDoc(pageContainer = null) {
        var editor = this.getActiveEditor();
        var body = editor.getBody();
        body.innerHTML = '';
        var docId, parentId, htmlContent;
        var outlineId = $global.guid();
        if (!pageContainer) {
            docId = $global.guid();
            parentId = $global.guid();
            htmlContent = `<div class="page-container" data-id="${docId}" data-outlineid="${parentId}" data-title="My Document">
                <div class="info-block" data-id="${outlineId}" data-outlineid="${outlineId}" data-parentid="${parentId}" data-pagesize="A4" data-pagenum="1"><p>请输入内容...</p></div>
            </div>`;
        } else {
            docId = pageContainer.dataset.id;
            parentId = pageContainer.dataset.outlineid || $global.guid();

            editor.dom.add(pageContainer, 'div', { 'class': 'info-block', 'data-id': docId, 'data-outlineid': parentId, 'data-title': 'My Document' }, '', true);
        }
        var blockContent = `<div class="info-block" data-id="${outlineId}" data-outlineid="${outlineId}" data-parentid="${parentId}" data-pagesize="A4" data-pagenum="1"><p>请输入内容...</p></div>`;
        pageContainer.innerHTML = blockContent;

        editor.resetContent(htmlContent);
        return {
            docId,
            parentId,
            outlineId
        };
    },

    /**
     * @description 插入一个新的页面
     * @param {Object} prevNode 上一个页面数据
     * @param {Object} currNode 当前页面数据
     */
    insertPage(prevNode = null, currNode = null) {
        const editor = this.getActiveEditor();
        const pageContainer = editor.getBody().querySelector('.page-container');
        let allPrevPage = [];
        if (prevNode) {
            allPrevPage = Array.from(pageContainer.querySelectorAll(`.info-block[data-outlineid="${prevNode.outlineId}"]`));
        } else {
            allPrevPage = Array.from(pageContainer.querySelectorAll('.info-block.cover, .info-block.catalogue'));
        }
        let prevPage = allPrevPage[allPrevPage.length - 1];

        let cls = 'info-block', olCls = 'ol-list';
        let htmlArr = [], pagenum = '1';
        let templateData;
        // console.log(this.vm.listTemplate, this.vm.pageData);
		// debugger
        let outlineData = _.find(outlineTypes, { type: currNode.outlineType });
        if (outlineData && this.vm.listTemplate) {
            templateData = _.find(this.vm.listTemplate, { tmplName: this.vm.pageData.stdKind !== this.vm.editorSetting.tmplType ? outlineData.value : 'other', tmplType: this.vm.pageData.stdKind });
        }

        if (!templateData && this.vm.listTemplate && this.vm.pageData.stdKind === this.vm.editorSetting.tmplType ) {
            templateData = _.find(this.vm.listTemplate, { tmplName: 'other', tmplType: this.vm.pageData.stdKind });
        }

        let section;
        // 非结构性章节
        if ([1, 2, 11, 12].includes(currNode.outlineType)) {
            pagenum = 'Ⅱ';
            if (templateData) {
                section = document.createElement('div');
                section.innerHTML = templateData.content;
                let sectionTitle = section.querySelector('.header-title');
                if (sectionTitle) {
                    if (this.vm.editorSetting.titleSpace && outlineData.label.length > 2) {
                        sectionTitle.innerHTML = `<p>${outlineData.label.split('').join('&nbsp;')}</p>`;
                    }

                    sectionTitle.dataset.bookmark = currNode.outlineId;
                }
                htmlArr = htmlArr.concat(section.innerHTML);
                section.remove();
            } else {
                let outlineTitle = currNode.outlineTitle;
                if (outlineTitle.length < 3) {
                    let sp = outlineTitle.split("");
                    outlineTitle = sp.join("&nbsp; &nbsp; ");
                }
                htmlArr.push(`<div class="header-title" data-bookmark="${currNode.outlineId}"><p>${outlineTitle}</p></div>`);
                htmlArr.push('<p style="text-indent: 2em;">请输入内容...</p>');
            }

        } else if ([8, 9].includes(currNode.outlineType)) { // 附录章节
            olCls = 'appendix-list';
            // 附录标题
            let docTitle = currNode.docattr === 'means' ? '资料性' : '规范性';
            htmlArr.push(
                `<div class="header-title appendix disabled" contenteditable="false" data-infonum="${currNode.infoNum}" data-outlinetype="${currNode.outlineType}" data-doctitle="${docTitle}" data-outlineid="${currNode.outlineId}" data-parentid="${currNode.parentId}" data-bookmark="${currNode.outlineId}" data-number="${currNode.letter}">`
            );
            htmlArr.push(`<p class="appendix" data-number="${currNode.letter}">附&nbsp;录</p>`);
            htmlArr.push(`<p class="specs">（${docTitle}）</p>`);
            htmlArr.push(`<p contenteditable="true" class="appendix-title">${currNode.outlineTitle}</p>`);
            htmlArr.push('</div>');
            // 附录页内容
            htmlArr.push(`<p style="text-indent: 2em;">请输入内容</p>`);
            cls = 'info-block appendix';
        } else {
            
            let appendixNo = currNode.appendixNo ? ` data-appendix-no="${currNode.appendixNo}"` : '';
            htmlArr.push(
                `<div class="ol-list level0" data-contentid="${$global.guid()}" data-bookmark="${currNode.outlineId}" data-outlineid="${currNode.outlineId}" data-parentid="${currNode.parentId}" data-outlinetype="${currNode.outlineType}" data-index="${currNode.outlineCatalog}"${appendixNo}>${currNode.outlineTitle}</div>`
            )
            // 航司模板加上页眉页脚
            if (this.vm.pageData.stdKind === this.vm.editorSetting.tmplType) {
                section = document.createElement('div');
                section.innerHTML = templateData.content;
                const pageHeader = section.querySelector('div.page-header');
                const pageFooter = section.querySelector('div.page-footer');
                if (pageHeader) {
                    htmlArr.unshift(pageHeader.outerHTML);
                }
                if (pageFooter) {
                    htmlArr.push(pageFooter.outerHTML);
                }
                section.remove();
            }
            cls = 'info-block struct';
        }
        // 创建页面
        var newBlock = editor.dom.create('div', {
            'class': cls,
            'data-outlinetype': currNode.outlineType,
            'data-outlineid': currNode.outlineId,
            'data-parentid': currNode.parentId,
            'data-pagesize': 'A4',
            'data-no': prevPage ? prevPage.dataset.no : '',
            'data-pagenum': pagenum
        }, htmlArr.join(""));

        if (currNode.letter) {
            newBlock.dataset.letter = currNode.letter;
        }

        if (prevPage) {
            editor.dom.insertAfter(newBlock, prevPage);
        } else {
            pageContainer.appendChild(newBlock);
        }

        // 重置章节索引号
        this.refreshChapterPage(currNode.letter === undefined);
    },

    refreshChapterPage(isStruct = true) {
        const editor = this.getActiveEditor();
        const pageContainer = editor.getBody().querySelector('.page-container');
        const outlineIdList = [];
        let letterIndex = 0, structIndex = 1;
        if (this.vm.pageData?.stdKind === this.vm.editorSetting.tmplType) {
            structIndex = 0;
        }
        if (isStruct) {
            var structBlocks = pageContainer.querySelectorAll('.info-block.struct');
            Array.from(structBlocks).forEach(block => {
                let blockData = _.find(outlineIdList, { outlineId: block.dataset.outlineid });
                let firstOl = block.querySelector('.ol-list');
                if (firstOl && !blockData) {
                    firstOl.dataset.index = structIndex;
                    levelUtil.resetChildLevel(editor, firstOl, firstOl.dataset.outlineid);
                    outlineIdList.push({ outlineId: block.dataset.outlineid });
                    structIndex++;
                }
            });
        } else {
            var appendixBlocks = pageContainer.querySelectorAll('.info-block.appendix');
            Array.from(appendixBlocks).forEach(block => {
                let letter = $global.numberToLetters(letterIndex);
                let blockData = _.find(outlineIdList, { outlineId: block.dataset.outlineid });
                if (blockData) {
                    letter = blockData.letter;
                } else {
                    outlineIdList.push({ outlineId: block.dataset.outlineid, letter });
                    letterIndex++;
                }
                block.dataset.letter = letter;
                let headerTitle = block.querySelector('.header-title>.appendix');
                if (headerTitle) {
                    headerTitle.dataset.number = letter;
                }
                let appendixList = block.querySelectorAll('.appendix-list');
                Array.from(appendixList).forEach(li => {
                    li.dataset.prev = letter;
                });
            });
        }

        // 重置页码
        this.resetPageNumber();
    },

    /**
     * @description 更新附录页面的主体数据
     * @param {Object} item
     */
    updateAppendixPage(item = {}) {
        var editor = this.getActiveEditor();
        var pageContainer = editor.getBody().querySelector('.page-container');
        var pageBlock = pageContainer.querySelector(`.info-block[data-outlineid="${item.outlineId}"]`);
        if (pageBlock) {
            var docTitle = item.infoNum === 8 ? '规范性' : '资料性'; // item.outlineType === 8 ? '规范性' : '资料性';
            var cls = item.infoNum === 8 ? 'specs' : 'means';
            // pageBlock.dataset.outlinetype = item.outlineType;
            pageBlock.dataset.doctitle = docTitle;
            var headerTitle = pageBlock.querySelector('.header-title');
            if (headerTitle) {
                headerTitle.dataset.doctitle = docTitle;
                headerTitle.dataset.infonum = item.infoNum;
                var docattrEle = headerTitle.querySelector('.docattr') || headerTitle.querySelector('.specs');
                if (docattrEle) {
                    docattrEle.className = 'docattr ' + cls;
                    docattrEle.innerHTML = `（${docTitle}）`;
                }
            }
        }
    },
    /**
     * @description 更新大纲分配人员
     * @param {Object} data {act, items=[]}
     */
    updateOutlineOwner(data = {}) {
        var editor = this.getActiveEditor();
        var pageContainer = editor.getBody().querySelector('.page-container');
        if (pageContainer) {
            // 先清除已定义的分配
            if (!data.assignOutline) {
                var ownerNodes = Array.from(pageContainer.querySelectorAll('[data-owner]'));
                ownerNodes.forEach(node => {
                    node.removeAttribute('data-owner');
                });
            }

            // 设置章节条目元素为分配
            if (!_.isEmpty(data.items)) {
                data.items.forEach(item => {
                    let targetEles;
                    if ([1, 2, 11, 12].includes(item.outlineType)) { // 前言，引言、索引、参考文献
                        targetEles = Array.from(pageContainer.querySelectorAll(`.info-block[data-outlineid="${item.outlineId}"]`));
                        if (targetEles.length) {
                            this.setElementOwner(targetEles, item.owner);
                        }
                    } else if ([8, 9].includes(item.outlineType)) { // 附录章节标题
                        targetEles = Array.from(pageContainer.querySelectorAll(`.header-title[data-outlineid="${item.outlineId}"]`));
                        if (targetEles.length) {
                            this.setElementOwner(targetEles, item.owner);
                        }
                    } else { // 一般章节条目
                        targetEles = Array.from(pageContainer.querySelectorAll(`.ol-list[data-outlineid="${item.outlineId}"], .appendix-list[data-outlineid="${item.outlineId}"]`)); // || pageContainer.querySelector(`.appendix-list[data-outlineid="${item.outlineId}"]`);
                        if (targetEles.length) {
                            this.setElementOwner(targetEles, item.owner);
                        }
                    }
                });
                return true;
            }
        }
        return false;
    },
    setElementOwner(nodes = [], owner = []) {
        nodes.forEach(node => {
            if (!_.isEmpty(owner)) {
                node.dataset.owner = JSON.stringify(owner);
            } else {
                node.removeAttribute('data-owner');
            }
        })
        return true;
    },

    /**
     * @description 更新大纲名称数据后同步更新页面大章节条目数据
     * @param {Object} item
     */
    updateOutlineTitle(item = {}) {
        var editor = this.getActiveEditor();
        var pageContainer = editor.getBody().querySelector('.page-container');
        if (pageContainer) {
            var targetEle;
            if ([1, 2, 11, 12].includes(item.outlineType)) {
                targetEle = pageContainer.querySelector(`.header-title[data-bookmark="${item.outlineId}"]`);
                if (targetEle) {
                    var strSplit = item.outlineTitle.split("");
                    var htmlContent = item.outlineTitle;
                    if (strSplit.length === 2) {
                        htmlContent = strSplit.join('&nbsp;&nbsp;');
                    } else if (strSplit.length > 2 && strSplit.length < 5) {
                        htmlContent = strSplit.join('&nbsp;');
                    }
                    targetEle.innerHTML = '<p>' + htmlContent + '</p>';
                    return true;
                }
            } else if ([8, 9].includes(item.outlineType)) {
                targetEle = pageContainer.querySelector(`.header-title[data-outlineid="${item.outlineId}"] .appendix-title`);
                if (targetEle) {
                    targetEle.innerText = item.outlineTitle;
                }
            } else {
                targetEle = pageContainer.querySelector(`.ol-list[data-outlineid="${item.outlineId}"]`) || pageContainer.querySelector(`.appendix-list[data-outlineid="${item.outlineId}"]`);
                if (targetEle) {
                    // debugger
                    targetEle = targetEle.firstChild;
                    // 下个节点是否为A标签
                    if (targetEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g,'')=== '') {
                        return true;
                    }
                    if (targetEle.nodeName === '#text') {
                        targetEle.nodeValue = item.outlineTitle;
                    } else {
                        targetEle.innerText = item.outlineTitle;
                    }
                    return true;
                }
            }
        }
        return false;
    },

    /**
     * @description 光标定位在元素的最后位置
     * @param {Element} element
     * @param {Boolean} extraBr 聚焦后光标是否在最前面
     */
    moveSelectionToElement(element = null, extraBr = false) {
        var editor = this.getActiveEditor();
        editor.selection.select(element, true);
        editor.selection.collapse(extraBr);
    },

    /**
     * @description 重置页面页眉
     */
    resetPageHeader(pageNo = '') {
        var editor = this.getActiveEditor();
        if (!editor || !editor.getBody()) {
            return false;
        }
        var blocks = editor.getBody().querySelectorAll('.info-block[data-no]');
        blocks.forEach(block => {
            block.dataset.no = pageNo;
        })
    },

    /**
     * @description 重置页面编号
     */
    async resetPageNumber(flag = false) {
        // 延迟，以便加载页面后再处理程序
        await $global.sleep(2000);

        var editor = this.getActiveEditor();
        if (!editor || !editor.getBody() || this.resetPageNumbering) {
            return false;
        }

		var pageContainer = editor.getBody().querySelector('.page-container');
        if (!pageContainer) {
            console.warn('缺少文档的主体容器');
            return false;
        }
        // 编辑器配置参数
        var cfg = editor.settings.doc_config;

        // var doubleSided = (cfg && cfg.page.layout && cfg.page.layout === 'doubleSided') || (pageContainer.dataset.type && pageContainer.dataset.type === 'doubleSided');
        var doubleSided = cfg && cfg.page && cfg.page.layout && cfg.page.layout === 'doubleSided';
        var pageNodes = editor.getBody().querySelectorAll('.info-block:not(.cover):not(.approve):not(.empty)');
        var structIndex = 0, romaNumIndex = 0;
        Array.from(pageNodes).forEach((block, index) => {
            var pageNum = block.dataset.pagenum;
            var left = false;
            // 结构化章节，数字序号
            if (!['1', '2'].includes(block.dataset.outlinetype) && !$global.hasClass(block, 'catalogue')) {
                left = structIndex % 2 === 1;
                pageNum = structIndex + 1;
                structIndex++;
                // 非结构化章节，罗马数字序号
            } else {
                left = romaNumIndex % 2 === 1;
                pageNum = numberChar.roma[romaNumIndex];
                romaNumIndex++;
            }
            // 双面排版
            if (doubleSided) {
                if (left) {
                    $global.addClass(block, 'left');
                } else {
                    $global.removeClass(block, 'left');
                }
                // 单面排版
            } else {
                $global.removeClass(block, 'left');
            }
            block.dataset.pagenum = pageNum;
        });

        if (!flag) {
            this.autoSetCatalogue();
        }
        return true;
    },

    getAllTagNodes(type = '', hasNode = false) {
        var editor = this.getActiveEditor();
        var body = editor ? editor.getBody() : null;
        if (!body) {
            return [];
        }
        var pageContainer = body.querySelector('.page-container');
        if (!pageContainer) {
            return [];
        }
        var tagNodes = Array.from(pageContainer.querySelectorAll(':scope>div.info-block:not(.cover):not(.fixed):not(.disabled):not(.empty) [data-tag]'));
        var datas = [];
        tagNodes.forEach(node => {
            if (node.dataset && node.dataset.tag && $global.isJSON(node.dataset.tag)) {
                let obj = JSON.parse(node.dataset.tag);
                if (type && obj.type !== type) {
                    obj = null;
                }
                if (obj) {
                    if (hasNode) {
                        obj.node = node;
                    }
                    datas.push(obj);
                }
            }
        });
        return datas;
    },

    /**
     * @description 生成索引项
     */
    autoSetIndexTag() {
        var editor = this.getActiveEditor();
        // 获取所有标签数据
        var tagDatas = this.getAllTagNodes('index', true);
        if (!tagDatas || !tagDatas.length) {
            return null;
        }
        tagDatas = _.orderBy(tagDatas, ['letter'], ['asc']);

        const rootNodeName = node => {
            var chapterName = '';
            var tableNode = editor.dom.getParent(node, 'table');
            if (tableNode) {
                var tableTitle = tableNode.querySelector('table-title');
                if (tableTitle) {
                    chapterName = '表 ' + tableTitle.dataset.number;
                }
            } else {
                var entryNode = editor.dom.getParent(node, '.ol-list') || editor.dom.getParent(node, '.appendix-list');
                if (entryNode && entryNode.dataset) {
                    chapterName = entryNode.dataset.index;
                    if (entryNode.dataset.prev) {
                        chapterName = '附录 ' + entryNode.dataset.prev + '.' + entryNode.dataset.index;
                    }
                }
                /* if (entryNode.dataset.prev) {
                    chapterName = '附录 ' + entryNode.dataset.prev + '.' + entryNode.dataset.index;
                } */
            }
            return chapterName;
        }

        var tagLists = [];
        tagDatas.forEach(data => {
            let rootName = rootNodeName(data.node);
            let indexData = _.find(tagLists, { title: data.letter });
            if (indexData) {

                // 同类归属一起
                let contentData = _.find(indexData.list, { text: data.text, letter: data.letter });
                if (contentData && contentData.rootNames) {
                    contentData.rootNames.push(rootName);
                } else {
                    data.rootNames = [rootName];
                    indexData.list.push(data);
                }
            } else {
                data.rootNames = [rootName];
                indexData = {
                    title: data.letter,
                    list: [data]
                }
                tagLists.push(indexData)
            }
        });
        var pageContainer = editor.getBody().querySelector('.page-container');
        // 索引
        var infoBlocks = Array.from(pageContainer.querySelectorAll('.info-block[data-outlinetype="12"]'));
        var tagBlock;
        infoBlocks.forEach((block, idx) => {
            // $global.addClass(block, 'fixed');
            if (idx === 0) {
                tagBlock = block;
                Array.from(block.childNodes).forEach(n => {
                    if (!$global.hasClass(n, 'header-title')) {
                        n.remove();
                    }
                })
            } else {
                block.remove();
            }
        });
        if (tagBlock) {
            let tagIndexContainer = Array.from(tagBlock.querySelectorAll('.tag-index'));
            tagIndexContainer.forEach(ele => {
                ele.remove();
            });
            tagLists.forEach(tag => {
                let tagNode = editor.dom.create('div', { class: 'tag-index' }, `<p class="title" style="line-height:3; text-align:center; font-weight:bold;">${tag.title}</p>`);
                tag.list.forEach(li => {
                    li.rootNames = _.uniq(li.rootNames);
                    let num = li.rootNames.join('，');
                    let liNode = editor.dom.create('div', { class: 'fld-char' }, `<span class="txt">${li.text}</span><span class="line"></span><span class="content">${num}</span>`);
                    tagNode.appendChild(liNode);
                });
                tagBlock.appendChild(tagNode);
            });
        }

    },

    setCatalogueConfig(editor = null, data = {}) {
        if (editor.settings.doc_config) {
            editor.settings.doc_config.catalogues = data;
        }
    },

    /**
     * @description 重置目次显示与删除
     * @param {Boolean} flag
     */
    resetCatalogue(flag=false) {
        var editor = this.getActiveEditor();
        var body = editor ? editor.getBody() : null;
        if (!body) { // 如果文档正在分析目次或正在合并中则中断
            return false;
        }
        var editorPageContainer = body.querySelector('.page-container');
        if (!editorPageContainer) {
            return false;
        }
        this.vm.$set(this.vm.editorSetting, 'notCatalogue', !flag);
        // this.vm.editorSetting.notCatalogue = !flag;
        if (!flag) {
            var infoBlocks = Array.from(body.querySelectorAll('.info-block.catalogue'));
            infoBlocks.forEach(block => {
                block.remove();
            })
            return true;
        } else {
            return this.autoSetCatalogue();
        }
    },
    // 航司模板目次页面
    async setHsCatalogue(editor, body) {
        const editorPageContainer = body.querySelector('.page-container');
        let cataloguePage = editorPageContainer.querySelector('.catalogue');
        if (!cataloguePage) {
            let headerTitle = `<div class="header-title" contenteditable="false">目录</div>`;
            cataloguePage = editor.dom.create('div', {
                'class': `info-block catalogue fixed`,
            }, `${headerTitle}<div class="catalogue-list"></div>`);

            const coverPage = editorPageContainer.querySelector('.info-block.cover');
            editor.dom.insertAfter(cataloguePage, coverPage);
        }
        let tableNode = cataloguePage.querySelector('table.toc');
        if (!tableNode) {
            tableNode = editor.dom.create('table', {'class':'toc', 'contenteditable':false, 'style':'width:100%;'}, `<colgroup><col style="width:25%"/><col style="width:50%"/><col style="width:25%"/></colgroup><thead><tr><th>章-节</th><th>标题</th><th>页次</th></tr></thead><tbody></tbody>`);
            cataloguePage.appendChild(tableNode);
        }
        const tbody = tableNode.querySelector('tbody');
        // 遍历大纲章节和条款
        const rows = [];
        let pageHeader = cataloguePage.querySelector('div.page-header');
        let pageFooter = cataloguePage.querySelector('div.page-footer');
        if (!pageHeader) {
            const pageTmp = _.find(this.vm.listTemplate, { tmplType:this.vm.pageData.stdKind, tmplName:'other' });
            if (pageTmp) {
                const tmpContainer = document.createElement('div');
                tmpContainer.innerHTML = pageTmp.content;
                pageHeader = tmpContainer.querySelector('div.page-header');
                if (pageHeader) {
                    let stdTitleEle = pageHeader.querySelector('td.std-title');
                    if (stdTitleEle) {
                        stdTitleEle.textContent = this.vm.pageData?.stdName;
                    }
                    let stdNoEle = pageHeader.querySelector('td.std-no');
                    if (stdNoEle) {
                        stdNoEle.textContent = this.vm.pageData?.stdNo;
                    }
                    let stdVersionEle = pageHeader.querySelector('td.std-version');
                    if (stdVersionEle) {
                        stdVersionEle.textContent = this.vm.pageData?.docVersionName;
                    }
                    let revisionsNumberEle = pageHeader.querySelector('td.revisions-number');
                    if (revisionsNumberEle) {
                        revisionsNumberEle.textContent = this.vm.pageData?.revisionsNumber || '';
                    }
                    let revisionsDateEle = pageHeader.querySelector('td.revisions-date');
                    if (revisionsDateEle && this.vm.pageData?.updateEnd) {
                        revisionsDateEle.textContent = this.vm.pageData?.updateEnd ? $global.formatDateTime('yyyy-MM-dd', new Date(this.vm.pageData?.updateEnd)) : '';;
                    }
                }

                cataloguePage.prepend(pageHeader);
                pageFooter = tmpContainer.querySelector('div.page-footer');
                cataloguePage.appendChild(pageFooter);
                tmpContainer.remove();
            }
        }
        // 页眉内容
        const stdNo = pageHeader.querySelector('td.std-no');
        const stdversion = pageHeader.querySelector('td.std-version');
        // const stdNo = pageHeader.querySelector('std-no');
        // 页脚内容
        const pageSection = pageFooter.querySelector('div.page-section');
        const pageNumber = pageFooter.querySelector('div.page-number');
        pageSection.textContent = '目录';
        pageNumber.textContent = '0-1-1';

        // 目录项列表内容
        const listItems = [];
        const infoBlocks = Array.from(editorPageContainer.querySelectorAll('.info-block:not(.cover):not(.catalogue):not(.empty)'));
        // debugger
        let startIndex = '0';
        for (let i = 0; i < infoBlocks.length; i++) {
            const infoblock = infoBlocks[i];
            const pageFooter = infoblock.querySelector('div.page-footer');
            const pageSection = pageFooter.querySelector('div.page-section');
            const pageNumber = pageFooter.querySelector('div.page-number');

            const bks = Array.from(infoblock.querySelectorAll('[data-bookmark]:not(.hide-list):not(.img-title):not(.table-title)'));
            for (let j = 0; j<bks.length; j++) {
                const bk = bks[j];
                const splitIndex = bk.dataset.index.split('.');
                const firstChild = bk.firstChild;
                if (j === 0) {
                    startIndex = bk.dataset.index;
                    pageSection.textContent = `第${startIndex}章`;
                    pageNumber.textContent = startIndex + '-1-1';
                }
                if (splitIndex.length < 3) {
                    let obj = {
                        mk: bk.dataset.bookmark,
                        num: bk.dataset.index,
                        title: firstChild.textContent,
                        pageNum: j > 0 ? splitIndex.join('-') + '-1' : ''
                    }
                    if (bk.dataset.appendixNo && /^[A-Z]$/.test(bk.dataset.index)) {
                        obj.num = '附录' + bk.dataset.index;
                        obj.pageNum = '附录' + obj.pageNum;
                    }
                    listItems.push(obj);
                }
            }
            // 加个空行
            if (i < infoBlocks.length - 1) {
                listItems.push({})
            }
        }
        // console.log('listItems===>', listItems)
        for (let i = 0; i<listItems.length; i++) {
            const item = listItems[i];
            if (!_.isEmpty(item)) {
                rows.push(`<tr data-mk="${item.mk}"><td>${item.num}</td><td>${item.title}</td><td>${item.pageNum}</td></tr>`);
            } else {
                rows.push(`<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>`);
            }
        }
        tbody.innerHTML = rows.join('');
        this.cateing = false;
        return true;
    },

    /**
     * @description 生成目次
     * @param {Object} editor
     */
    async autoSetCatalogue(cataData = null) {
        // 如果设置了不须要目次页面的则中断执行
        if (this.vm.editorSetting.notCatalogue || this.vm.editorSetting.parseTable) {
            return false;
        }
        const editor = this.getActiveEditor();
        const body = editor ? editor.getBody() : null;
        if (!body || this.cateing || !this.loaded || this.mergePaing) { // 如果文档正在分析目次或正在合并中则中断
            return false;
        }
        this.cateing = true;

        // 如果是航司模板则额外处理
        if (this.vm?.pageData && this.vm.pageData?.stdKind === this.vm.editorSetting.tmplType && this.vm.editorSetting.tmplType) {
            return await this.setHsCatalogue(editor, body);
        }

        if (cataData) {
            this.setCatalogueConfig(editor, cataData);
        } else {
            // 定义目次规则
            if (_.isEmpty(this.catalogueData)) {
                this.catalogueData = {};
                if (this.vm.editorSetting.catalogues) { // 直接从配置中定义
                    this.catalogueData = this.vm.editorSetting.catalogues;
                } else { // 从模板设置中定义
                    var catalogueData = _.find(this.vm.listTemplate, { tmplName: 'catalogue' });
                    if (catalogueData && $global.isJSON(catalogueData.content)) {
                        catalogueData = JSON.parse(catalogueData.content);
                        for (let k in catalogueData) {
                            catalogueData[k].forEach(val => {
                                this.catalogueData[val] = true;
                            })
                        }
                    }
                }
                this.setCatalogueConfig(editor, this.catalogueData);
            }
        }

        // 文档的配置
        let cfg = editor.settings.doc_config;

        if (!cfg || cfg.setTemplate || cfg.parseTable) { // setTemplate 模板设置模式
            this.cateing = false;
            return false;
        }

        const editorPageContainer = body.querySelector('.page-container');
        const cataloguePage = editorPageContainer.querySelector('.catalogue');
        // 如果目次页是隐藏的则不处理
        if (cataloguePage && $global.hasClass(cataloguePage, 'pageHide')) {
            this.cateing = false;
			return false;
        }

        if (!editorPageContainer || (!this.vm.editorSetting.isStandard && !editorPageContainer.querySelector('.catalogue'))) {
            this.cateing = false;
            return false;
        }

        if (!cfg.catalogues || cfg.disabledCatalogue) {
            this.cateing = false;
            return false;
        }
        let catalogueRules = cfg.catalogues || {};

        const infoBlocks = Array.from(body.querySelectorAll('.info-block:not(.cover):not(.approve):not(.catalogue):not(.empty)'));
        const lists = [];

        const checkSamNode = (nodes, id) => {
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].dataset.mk === id) {
                    return true;
                }
            }
            return false;
        }

        const setTitle = node => {
            var str = '';
            var childNodes = Array.from(node.childNodes);
            for (let ele of childNodes) {
                if (['P','DIV'].includes(ele.nodeName)) {
                    break;
                }
                if (['SPAN','EM','STRONG','SUB','SUP'].includes(ele.nodeName)) {
                    str += ele.outerHTML;
                } else {
                    str += ele.textContent;
                }
            }
            return str;
        }

        // 遍历页面，按元素定义的bookmark列出所有目录，包含子项
        for (let i = 0; i < infoBlocks.length; i++) {
            let infoblock = infoBlocks[i];
            let bks = Array.from(infoblock.querySelectorAll('[data-bookmark]:not(.hide-list):not(.img-title):not(.table-title)'));

            for (let j = 0; j < bks.length; j++) {
                let node = bks[j];
                let levelCls = 'level0', isSet = true;
                let firstChild = node.firstChild;
                if (firstChild && (firstChild.nodeName === '#text' || firstChild.nodeName === 'SPAN' || $global.hasClass(node, 'header-title'))) {
                    if (infoblock.dataset.outlinetype === '3' && $global.hasClass(node, 'header-title')) {
                        continue;
                    }
                    let stitle = firstChild.nodeValue || firstChild.textContent;
                    let title = stitle.replace(/\s/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
                    let numLens = 1;
                    if ($global.hasClass(firstChild, 'appendix')) {
                        title += ' ' + firstChild.dataset.number;
                        if (node.dataset.doctitle) {
                            title += `（${node.dataset.doctitle}）&nbsp;`;
                        }
                        title += node.lastChild ? node.lastChild.textContent : '';
                    } else {
                        if (j === 0 && title.slice(-2) === '通知') {
                            node.dataset.title = title;
                            title = '通知';
                        }
                    }

                    let titleSpan = `<span>${title}</span>`;
                    // 标题匹配规则
                    if (infoblock.dataset && infoblock.dataset.outlinetype) {
                        switch (infoblock.dataset.outlinetype) {
                            case '1': // 前言
                                isSet = catalogueRules.type1;
                                break;
                            case '2': // 引言
                                isSet = catalogueRules.type2;
                                break;
                            case '3': // 章标题
                                isSet = catalogueRules.type3;
                                break;
                            case '8': // 附录
                                isSet = catalogueRules.type4;
                                break;
                            case '11': // 参考文献
                                isSet = catalogueRules.type5;
                                break;
                            case '12': // 索引
                                isSet = catalogueRules.type6;
                                break;
                        }
                    }

                    // 章节|附录条款
                    let numStr = '';
                    if ($global.hasClass(node, 'ol-list') || $global.hasClass(node, 'appendix-list')) {
                        numStr = node.dataset.index;
                        numLens = numStr.split(".");
                        isSet = numLens.length === 1 && $global.hasClass(node, 'ol-list'); // 默认章标题显示

                        // 一般章节条目
                        if ($global.hasClass(node, 'ol-list')) {
                            // 二级条标题
                            if (catalogueRules.leve11 && numLens.length === 2) {
                                isSet = title !== '';
                                // 三级条标题
                            } else if (catalogueRules.leve12 && numLens.length === 3) {
                                isSet = title !== '';
                            } else if (catalogueRules.leve13 && numLens.length === 4) {
                                isSet = title !== '';
                                // 四级条标题
                            } else if (catalogueRules.leve14 && numLens.length === 5) {
                                isSet = title !== '';
                                // 五级条标题
                            } else if (catalogueRules.leve15 && numLens.length === 6) {
                                isSet = title !== '';
                            }
                            // 附录章节条目
                        } else {
                            if (catalogueRules.appendix1 && numLens.length === 1) {
                                isSet = title !== '';
                            } else if (catalogueRules.appendix2 && numLens.length === 2) {
                                isSet = title !== '';
                            } else if (catalogueRules.appendix3 && numLens.length === 3) {
                                isSet = title !== '';
                            } else if (catalogueRules.appendix4 && numLens.length === 4) {
                                isSet = title !== '';
                            } else if (catalogueRules.appendix5 && numLens.length === 5) {
                                isSet = title !== '';
                            }
                            numStr = node.dataset.prev + '.' + numStr;
                            numLens = numStr.split(".");
                        }
                        if (numStr.match(/[\u4E00-\u9FA5]/ig) !== null) { ///[\u4E00-\u9FA5]/.test(numStr)
                            numStr = '';
                        }
                        levelCls = `level${numLens.length}`;
                        titleSpan = `<span class="level ${levelCls}" data-number="${numStr}">${title}</span>`;
                    }

                    if (isSet) {
                        let romanText = isNaN(infoblock.dataset.pagenum) ? ` rm-${i}` : '';
                        let blockPage = editor.dom.nodeIndex(infoblock) + 1;
                        let parentId = node.dataset.parentid || infoblock.dataset.parentid;
                        let liEle = editor.dom.create('div', { class: 'fld-char ' + levelCls, 'data-mk': node.dataset.bookmark, 'data-mkpid':parentId,'data-pagenum':blockPage }, `${titleSpan}<span class="line"></span><span class="num${romanText}">${infoblock.dataset.pagenum}</span>`);
                        lists.push(liEle);
                    }
                }
            }
        }

        // 遍历页面，获取所有图标题
        if (catalogueRules.imgTitle) {
            for (let i = 0; i < infoBlocks.length; i++) {
                let infoblock = infoBlocks[i];
                let bks = infoblock.querySelectorAll('.img-title[data-number]');
                for (let j = 0; j < bks.length; j++) {
                    let ele = bks[j];
                    let text = `图${ele.dataset.number}&nbsp;${ele.textContent}`;
                    ele.dataset.bookmark = ele.dataset.bookmark || $global.guid();
                    let liEle = editor.dom.create('div', { class: 'fld-char', 'data-mk': ele.dataset.bookmark }, `<span>${text}</span><span class="line"></span><span class="num">${infoblock.dataset.pagenum}</span>`);
                    lists.push(liEle);
                }
            }
        }

        // 遍历页面，获取所有表标题
        if (catalogueRules.tableTitle) {
            for (let i = 0; i < infoBlocks.length; i++) {
                let infoblock = infoBlocks[i];
                let bks = infoblock.querySelectorAll('caption.table-title:not(.txu)');
                for (let j = 0; j < bks.length; j++) {
                    let ele = bks[j];
                    let text = `表${ele.dataset.number}&nbsp;${ele.textContent}`;
                    ele.dataset.bookmark = ele.dataset.bookmark || $global.guid();
                    let liEle = editor.dom.create('div', { class: 'fld-char', 'data-mk': ele.dataset.bookmark }, `<span>${text}</span><span class="line"></span><span class="num">${infoblock.dataset.pagenum}</span>`);
                    lists.push(liEle);
                }
            }
        }

        if (!lists.length) {
            this.cateing = false;
            return false;
        }

        // 删除延续的目次页面,只保留第一个
        let allCatalogue = Array.from(editorPageContainer.querySelectorAll(`.info-block.catalogue`));
        allCatalogue.forEach((ele, index) => {
            if (index > 0) {
                ele.remove();
            }
        });

        let cataContainer = allCatalogue[0] || editorPageContainer.querySelector('.info-block.catalogue');
        if (!cataContainer) {
            let titleStr = '目&nbsp;&nbsp;&nbsp;&nbsp;次';
            if (this.vm.editorSetting.catalogueTitle) {
                titleStr = this.vm.editorSetting.catalogueTitle.split("").join("&nbsp;&nbsp;&nbsp;&nbsp;");
            }
            let headerTitle = `<div class="header-title" contenteditable="false">${titleStr}</div>`;
            cataContainer = editor.dom.create('div', {
                'class': `info-block catalogue fixed`,
                'data-pagetype': editorPageContainer.dataset.pagetype || "",
                'data-no': editorPageContainer.dataset.no || "",
                'data-pagenum': numberChar.roma[0]
            }, `${headerTitle}<div class="catalogue-list"></div>`);
            let coverPage = editorPageContainer.querySelector('.info-block.cover');
            // 如果封面后又其它特殊页面的
            if (editorPageContainer.querySelector('.info-block.approve')) {
                let recordPages = Array.from(editorPageContainer.querySelectorAll('.info-block.approve'));
                coverPage = recordPages[recordPages.length - 1];
            }
            if (coverPage) {
                editor.dom.insertAfter(cataContainer, coverPage);
            } else {
                $global.prependChild(cataContainer, editorPageContainer);
            }
        }

        const breakCataloguePage = async pageBlock => {
            var outSideNode = await this.getOutSideNode(pageBlock);
            if (outSideNode && outSideNode.lastNode) {
                var nextPage = this.appendNextBlock(pageBlock, outSideNode);
                if (nextPage) {
                    breakCataloguePage(nextPage);
                }
            }
        }

        var catalogueListContainer = cataContainer.querySelector('.catalogue-list');
        if (catalogueListContainer) {
            catalogueListContainer.innerHTML = "";
            lists.forEach((ele, idx) => {
                ele.dataset.idx = idx;
                catalogueListContainer.appendChild(ele);
            });
            // 目次分页
            breakCataloguePage(cataContainer);
        }

        // 罗马页码字符重定义
        allCatalogue = Array.from(editorPageContainer.querySelectorAll(`.info-block.catalogue`));
        let romaNumIndex = allCatalogue.length;
        allCatalogue.forEach(catalogueBlock => {
            const numEles = Array.from(catalogueBlock.querySelectorAll(`.num`));
            numEles.forEach(ele => {
                if (isNaN(ele.textContent)) {
                    ele.textContent = numberChar.roma[romaNumIndex];
                    romaNumIndex++;
                }
            })
        });

        // 重置页码
        setTimeout(() => {
            this.resetPageNumber(true);
            this.cateing = false;
        }, 500);

        return true;
    },

    /**
     * @description 更新页面属性
     * @param {Object} pageBlock
     */
    updatePageAttrs(pageBlock = null) {
        var pageNum = pageBlock.dataset.pagenum;
        // 一般数字序号
        if (!isNaN(parseInt(pageNum))) {
            pageNum = parseInt(pageNum) + 1;
            // 罗马数字序号
        } else {
            var index = $global.getIndexByArr(numberChar.roma, pageNum);
            pageNum = numberChar.roma[index + 1];
        }
        pageBlock.dataset.pagenum = pageNum;
    },

    /**
     * @description 页面排版
     * @param {Object} data
     * ------------------------------------------
     * 双面排版规则
     * 页码序号：目次与前言、引言为一组 | 其他章节为一组
     * 页眉、页码位置排列（按先右再左依此排列）：目次为一组 | 前言、引言为一组 | 其他章节为一组
     * 插入空白页： 封面后 | 目次最后奇数页 | 前言、引言最后奇数页
     * ------------------------------------------
     */
    updatePageComposition(data = {}) {
        var editor = this.getActiveEditor();
        if (!editor || !editor.getBody()) {
            return false;
        }
        const clearEmptyPage = () => {
            var emptyBlocks = Array.from(pageContainer.querySelectorAll('.info-block.empty'));
            emptyBlocks.forEach(block => {
                block.remove();
            })
        }

        var pageContainer = editor.getBody().querySelector('.page-container');
        // console.log('updatePageComposition pageContainer===>', pageContainer);
        if (pageContainer) {
            pageContainer.dataset.type = data.act;
            // 潍柴模板的审批表页面
            var wcblocks = Array.from(pageContainer.querySelectorAll('.info-block.approve'));
            wcblocks.forEach((block, index) => {
                $global.removeClass(block, 'left');
                let left = false;
                // 双面排版
                if (data.act === 'doubleSided') {
                    left = index % 2 !== 0;
                    if (left) {
                        $global.addClass(block, 'left');
                    } else {
                        $global.removeClass(block, 'left');
                    }
                    // 单面排版
                } else {
                    $global.removeClass(block, 'left');
                }
            })


            var romaIndex = 0, structIndex = 0, notChapterIndex = 0;
            var blocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.cover):not(.approve):not(.empty)'));
            blocks.forEach(block => {
                $global.removeClass(block, 'left');
                let pageNum = block.dataset.pagenum;
                let left = false;
                // 定义页码
                if (pageNum !== undefined) {
                    if (isNaN(parseInt(pageNum))) { // 非结构化章节：目次与前言、引言
                        pageNum = numberChar.roma[romaIndex];
                        left = romaIndex % 2 === 1; // 奇数页则按靠右规则
                        // 前言、引言须重新定义
                        if (block.dataset.outlinetype) {
                            left = notChapterIndex % 2 === 1;
                            notChapterIndex++;
                        }
                        romaIndex++;
                    } else { // 结构化章节
                        left = structIndex % 2 === 1;
                        pageNum = structIndex + 1;
                        structIndex++;
                    }
                }
                // 双面排版
                if (data.act === 'doubleSided') {
                    if ($global.hasClass(block, 'appendix') && parseInt(block.style.width) > parseInt(block.style.height)) {
                        left = parseInt(block.dataset.pagenum) % 2 === 0;
                    }

                    if (left) {
                        $global.addClass(block, 'left');
                    } else {
                        $global.removeClass(block, 'left');
                    }
                    // 单面排版
                } else {
                    $global.removeClass(block, 'left');
                }
            });

            // 如果是双面排版且须插入空白页的
            var pageSetting = this.vm.editorSetting.page;
            var hasEmptyPage = pageSetting.empty || pageSetting.emptyPage;
            if (data.empty !== undefined) {
                hasEmptyPage = data.empty;
            }
            if (data.act === 'doubleSided') {
                if (hasEmptyPage && (this.vm.editorSetting.readonly || this.vm.editorSetting.reader)) {
                    let insertEmptyPages = [];
                    // 封面页后插入空白页
                    var coverPage = pageContainer.querySelector('.info-block.cover');
                    if (coverPage) {
                        insertEmptyPages.push(coverPage);
                    }
                    // 目次奇数页后插入空白页
                    var cataloguePages = Array.from(pageContainer.querySelectorAll('.info-block.catalogue'));
                    if (cataloguePages.length % 2 === 1) {
                        insertEmptyPages.push(cataloguePages[cataloguePages.length - 1]);
                    }
                    // 前言、引言奇数页后插入空白页
                    var notChapterPages = Array.from(pageContainer.querySelectorAll('.info-block[data-outlinetype="1"],.info-block[data-outlinetype="2"]'));
                    if (notChapterPages.length % 2 === 1) {
                        insertEmptyPages.push(notChapterPages[notChapterPages.length - 1]);
                    }
                    insertEmptyPages.forEach(page => {
                        let nextPage = page.nextElementSibling;
                        if (!nextPage || !$global.hasClass(nextPage, 'empty')) {
                            let emptyPage = page.cloneNode();
                            emptyPage.removeAttribute('data-outlineid');
                            emptyPage.removeAttribute('data-parentid');
                            emptyPage.removeAttribute('data-outlinetype');
                            emptyPage.removeAttribute('data-no');
                            emptyPage.removeAttribute('data-pagenum');
                            emptyPage.removeAttribute('data-owner');
                            emptyPage.setAttribute('contenteditable', 'false');
                            emptyPage.className = 'info-block empty';
                            if ($global.hasClass(page, 'cover') || $global.hasClass(page, 'catalogue')) {
                                $global.addClass(emptyPage, 'exclude');
                                if ($global.hasClass(page, 'catalogue')) {
                                    $global.addClass(emptyPage, 'catalogue');
                                }
                            }
                            editor.dom.insertAfter(emptyPage, page);
                        }
                    })
                } else { // 单面排版则删除所有空白页
                    clearEmptyPage(pageContainer);
                }
            } else {
                clearEmptyPage(pageContainer);
            }
        }
    },

    /**
     * @description 脚注元素合并
     * @param {Element}  currBlock
     * @param {note}  currBlock
     */
    mergeFooterNote(currBlock = null, note = null) {
        var editor = this.getActiveEditor();
        var allHeight = 0;
        var currNote = currBlock.querySelector('.footnote');
        if (!currNote) {
            allHeight += 10;
            currNote = editor.dom.create('div', { 'class': 'footnote', 'data-id': $global.guid(), 'data-contentid': $global.guid(), 'contenteditable': 'false' }, '<hr align="left" />');
            currBlock.appendChild(currNote);
        }
        currNote.appendChild(note);
        allHeight += note.offsetHeight;

        return allHeight;
    },

    /**
     * @description 页面合并处理（内容提取|分页）注： 仅处理章节页面
     */
    async mergeAllPages(data = {}) {
        var editor = this.getActiveEditor();
        // console.log('当前编辑器实例=>', editor)
        if (!editor || !editor.getBody()) {
            console.error('当前编辑器实例未获取到！');
            return false;
        }
        var pageContainer = editor.getBody().querySelector('.page-container');
        if (pageContainer) {
            if (pageContainer.dataset.merge) {
                return true;
            }
            this.mergePaing = true;
            /*if (_.isEmpty(data) && this.vm.editorSetting.mergeDoc) {
                // this.vm.loadingTimes = 600 * 1000;
                this.vm.onLoading('正在处理文档章节的合并，需花费较长时间，请等候完成...', true, 600 * 1000);
            }*/
            this.vm.onLoading('正在处理文档章节的合并，请等候完成...', true, 600 * 1000);
            var res;
            // 处理章节页面
            var blocks = Array.from(pageContainer.querySelectorAll('.info-block.struct'));
            if (blocks && blocks.length) {
                res = await this.mergeHtmlContent(pageContainer, blocks);
            }
            // 处理附录页面
            blocks = Array.from(pageContainer.querySelectorAll('.info-block.appendix'));
            if (res && blocks && blocks.length) {
                for (let block of blocks) {
                    this.clearAtag(block);
                }
            }
            // 合并完成后重置页面页码及相关元素属性
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    this.mergePaing = false;
                    // 定义当前文档已处于合并模式
                    pageContainer.dataset.merge = "true";
                    // 清除整理页
                    this.clearEmptyPage(pageContainer);
                    // 重置隐藏层级项中的列项序号
                    this.resetBulletNumbers(pageContainer, false, true);
                    // 重置列项ID
                    // domUtil.resetBulletId(editor);
                    // 重新定义页面排版方式
                    let layout = this.vm.editorSetting.page && this.vm.editorSetting.page.layout ? this.vm.editorSetting.page.layout : pageContainer.dataset.type;
                    this.updatePageComposition({ act:layout });
                    // 重置页码
                    this.resetPageNumber();
                    // 合并文档后最后一页须加上终结线
                    this.appendFinishedLine();
                    // 重置目次
                    this.autoSetCatalogue();
                    // 列项的序号须重更新
                    // this.vm.loading && this.vm.loading.close();
                    // this.vm.loading = null;
                    // this.vm.loadingTimes = 30000;
                    // this.vm.onLoading();
                    this.vm.closeLoading();
                    resolve(true);
                }, 2000);
            })
        } else {
            console.error('文档总页面未获取到！');
            return false;
        }
    },
    // 重置空段落，加入占位
    resetEmptyParagraph(container) {
        const blocks = Array.from(container.querySelectorAll('.info-block:not(.fixed):not(.disabled):not(.pageHide)'));
        blocks.forEach(block => {
            const nodes = Array.from(container.querySelectorAll('p'));
            nodes.forEach(el => {
                if (el.textContent === '' && el.offsetHeight === 0 && el.childElementCount === 0) {
                    el.innerHTML = '&#8203';
                }
                if (this.vm.pageData?.stdKind === this.vm.editorSetting.tmplType) {
                    el.style.textIndent = null;
                }
            })
        })
    },


    /**
     * @description 重置隐藏层级项中的列项序号
     * @param {Element} container
     */
    resetBulletNumbers(container = null, isChange = false, isMerge = false) {
        const editor = this.getActiveEditor();
        const getBulletById = currNode => {
            let arrNodes = [];
            let sameLevelNodes = Array.from(container.querySelectorAll(`div.bullet[data-id="${currNode.dataset.id}"]`));
            for (let i = 0; i < sameLevelNodes.length; i++) {
                let node = sameLevelNodes[i];
                if (node === currNode) {
                    break;
                } else {
                    arrNodes.push(node)
                }
            }
            return arrNodes;
        }

        const blocks = Array.from(container.querySelectorAll('.info-block:not(.fixed):not(.disabled):not(.pageHide)'));
        blocks.forEach(block => {
            // 隐藏的章节
            var nodes = Array.from(block.querySelectorAll('.ol-list.hide-list,.appendix-list.hide-list'));
            nodes.forEach(node => {
                let parentNode = container.querySelector(`[data-outlineid="${node.dataset.outlineid}"]`);
                if (parentNode) {
                    let sameBullets = [];
                    // 处理英文、数字字母列项
                    let firstBullet = node.firstChild;
                    if (firstBullet && firstBullet.nodeName === 'DIV' && $global.hasClass(firstBullet, 'bullet') && ['num', 'lower', 'num-index', 'tag-index'].includes(firstBullet.dataset.type)) {
                        let parentBullet = bulletUtil.getPrevBlockSameBullet(firstBullet);
                        if (parentBullet && parentBullet.dataset.id === firstBullet.dataset.id) {
                            sameBullets = [parentBullet].concat(bulletUtil.getPrevSameLevelAndType(parentBullet, true)).filter(n => {
                                return n && n.dataset.level === firstBullet.dataset.level && n.dataset.type === firstBullet.dataset.type;
                            });
                            let lens = sameBullets.length;
                            // 如果是隐藏的列项
                            if ($global.hasClass(firstBullet, 'hide-list')) {
                                lens -= 1;
                            }
                            firstBullet.dataset.start = lens;
                            firstBullet.setAttribute('style', `counter-reset:${firstBullet.dataset.type} ${lens}`);
                        }
                    }
                }
            });

            // bulletUtil.resetBulletNumberByParent(editor, block);
            requestAnimationFrame(() => {
                bulletUtil.resetBulletNumberByParent(editor, block);
            })

        })
    },

    /**
     * @description 移除空白页面
     * @param {Element} pageContainer
     */
    clearEmptyPage(pageContainer = null) {
        var blocks = Array.from(pageContainer.querySelectorAll('.info-block.struct,.info-block.appendix'));
        // 节点中是否包含表格、图片
        const hasTableImg = node => {
            var defNode = node.querySelector('table') || node.querySelector('img');
            return defNode !== null;
        }
        blocks.forEach(block => {
            if (!$global.hasClass(block, 'empty')) {
                var nodes = Array.from(block.childNodes);
                if (!nodes.length) { //  || $global.hasClass(block, 'empty')保留空白页
                    block.remove();
                } else {
                    let empty = true;
                    for (let i = 0; i < nodes.length; i++) {
                        // 避免合并页面后出现相同的章节条款
                        if (hasTableImg(nodes[i]) || !$global.hasClass(nodes[i], 'hide-list') || nodes[i].textContent.replace(/\s/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '') !== '') {
                            empty = false;
                            break;
                        }
                    }
                    if (empty) {
                        block.remove();
                    } else {
                        // 清理hide-list空对象
                        let hideListEle = Array.from(block.querySelectorAll('div.hide-list'));
                        hideListEle.forEach(ele => {
                            // let nodeImgs = Array.from(ele.querySelectorAll('img'));
                            let emptyNode = ele.textContent.replace(/\s/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '') === "" && !hasTableImg(ele);// && nodeImgs.length === 0;
                            if (emptyNode) {
                                ele.remove();
                            }
                        });
                        // 处理表格被拆分
                        let tableNode = Array.from(block.querySelectorAll('table'));
                        tableNode.forEach(table => {
                            let nextNode = table.nextElementSibling;
                            if (nextNode && nextNode.nodeName === 'TABLE' && nextNode.dataset.parentid && nextNode.dataset.parentid === table.dataset.id) {
                                let tbody = table.querySelector('tbody');
                                let trs = Array.from(nextNode.querySelectorAll('tbody>tr:not(.hide)'));
                                trs.forEach(tr => {
                                    tbody.appendChild(tr);
                                })
                                nextNode.remove();
                            }
                        })
                    }
                }
            }
        })
    },

    /**
     * @description 获取页面的名称
     */
    getBlockTitle(block = null) {
        if (block && block.dataset.outlineid) {
            const outlineList = this.vm.outlineData && this.vm.outlineData[0] ? this.vm.outlineData[0]['children'] : [];
            let outlineItem = _.find(outlineList, { outlineId: block.dataset.outlineid });
            if (outlineItem) {
                return outlineItem.outlineTitle;
            } else {
                return block.dataset.title || '无页面名称';
            }
        }
        return '无页面名称';
    },
    // sam add
    resetPageSize(currBlock) {
        // sam add
        var pageWidth = 210, pageHeight = 297;
        if (this.vm.editorSetting.page && this.vm.editorSetting.page.size) {
            pageWidth = this.vm.editorSetting.page.size.width || 210;
            pageHeight = this.vm.editorSetting.page.size.height || 297;
        }
        if(!currBlock) return true;
        // 非航司模板的
        if (this.vm.pageData?.stdKind !== this.vm.editorSetting.tmplType) {
            currBlock && currBlock.style && (currBlock.style.paddingBottom = "20mm");
        }
        
        // 页面的高宽
        if(!currBlock.style.width) {
            currBlock.style.width = currBlock.dataset.pagesize && currBlock.dataset.pagesize === 'A3' ? `${pageHeight}mm` : `${pageWidth}mm`;
        }
        if(!currBlock.style.height || currBlock.style.height === 'auto') {
           currBlock.style.height = currBlock.dataset.pagesize && currBlock.dataset.pagesize === 'A3' ? `${pageWidth}mm` : `${pageHeight}mm`;
        }

        levelUtil.resetPadding(currBlock);
        return true;
    },

    /**
     * @description 合并下页
     */
    mergeNextPage(currBlock = null) {
        var editor = this.getActiveEditor();
        var pageContainer = editor.dom.getParent(currBlock, '.page-container');

        // sam add
        this.resetPageSize(currBlock);
        // 重置层级项间距
        // levelUtil.resetPadding(currBlock);

        // 获取页面空间
        var spaceData = $global.calcBLockSpaceHeight(currBlock);
        // 页面有足够的空间，则将下页的内容提取上来
        var spaceHeight = spaceData.blockHeight - spaceData.allHeight;
        var nextBlock = currBlock.nextElementSibling;
        // sam add
        this.resetPageSize(nextBlock);

        currBlock.scrollIntoView({
            block: "start",
            inline: "nearest"
        });

        // 前言、引言、索引、参考文献、附录章节页一旦分页后不再合并
        if (nextBlock && !['1','2','8','9','11','12'].includes(nextBlock.dataset.outlinetype) && spaceHeight >= 22) {
            var isStruct = $global.hasClass(currBlock, 'struct');
            var isAppendix = $global.hasClass(currBlock, 'appendix');

            var blockStyle = window.getComputedStyle(currBlock);
            var nextBlockStyle = window.getComputedStyle(nextBlock);
            var nextBlockAppendix = $global.hasClass(nextBlock, 'appendix');
            var isSamPage = this.checkIsSamPage(currBlock, nextBlock);

            // 判断页面的高宽和章节类型是否一致
            var nextBlockStruct = $global.hasClass(currBlock, 'struct');

            /*isSamPage = parseInt(blockStyle.width) === parseInt(nextBlockStyle.width) && parseInt(blockStyle.height) === parseInt(nextBlockStyle.height);
            // 如果下个页面是附录章节或章节类型不一致的 !isAppendix && nextBlockAppendix && currBlock.dataset.outlinetype !== nextBlock.dataset.outlinetype
            if (isSamPage && ((!isAppendix && nextBlockAppendix) || (isStruct && !nextBlockStruct)) ) {
                isSamPage = false;
            }*/
            _.debounce(() => {
                this.vm.onLoading(`正在合并【${this.getBlockTitle(currBlock)}】和【${this.getBlockTitle(nextBlock)}】页面`);
            })


            // 再次判断页面是否同属性
            // console.info('当前页面[' + this.getBlockTitle(currBlock) + ']类型：' + currBlock.dataset.outlinetype + '；要合并页面[' + this.getBlockTitle(nextBlock) + ']类型：' + nextBlock.dataset.outlinetype);
            // console.info('当前页面的高宽为：' + parseInt(blockStyle.height) + ',' + parseInt(blockStyle.width), '要合并页面的高宽为：' + parseInt(nextBlockStyle.height) + ',' + parseInt(nextBlockStyle.width));

            if (!isSamPage) {
                console.warn('合并的下个页面：' + this.getBlockTitle(nextBlock) + '，页面尺寸或类型与：' + this.getBlockTitle(currBlock) + '不一致！');
                return false;
            }

            if (!['11', '12'].includes(nextBlock.dataset.outlinetype) && isSamPage) {
                if (isStruct === nextBlockStruct || isAppendix === nextBlockAppendix || isSamPage) {
                    // 当前页合并下页，返回是否已经全部合并
                    this.clearAtag(nextBlock);
                    let mergeBlock = this.mergeBlockPage(spaceHeight, currBlock, nextBlock, pageContainer, isAppendix);
                    if (!nextBlock.childNodes.length) {
                        nextBlock.remove();
                        // 重置页面页码
                        this.resetPageNumber();
                    }
                    // 重置脚注
                    this.resetBlockFootNote();
                    // 重置列项序号
                    this.resetBulletNumbers(pageContainer);
                    // 重置层级项间距
                    levelUtil.resetPadding(currBlock, true);
                    // 已经删除了nextBlock
                    if (!nextBlock.parentElement) {
                        return true;
                    }
                    return !mergeBlock;
                }
            }
        }
        return false;
    },
    // 重置合并后的大纲的内容合并
    resetOutlineNodes(editor = null, block = null) {
        var olList = Array.from(block.querySelectorAll('.ol-list,.appendix-list'));
        olList.forEach(ol => {
            let sameOls = Array.from(block.querySelectorAll(`div[data-outlineid="${ol.dataset.outlineid}"][data-index="${ol.dataset.index}"]:not(.info-block)`));
            if (sameOls.length) {
                sameOls.forEach(ele => {
                    if (editor.dom.nodeIndex(ele) > editor.dom.nodeIndex(ol)) {
                        Array.from(ele.childNodes).forEach(node => {
                            ol.appendChild(node);
                        });
                        ele.remove();
                    }
                })
            }
        })
    },

    /**
     * 合并文档后重置条文脚注
     */
    resetBlockFootNote() {
        var editor = this.getActiveEditor();
        if (!editor || !editor.getBody()) {
            return false;
        }
        var pageContainer = editor.getBody().querySelector('.page-container');
        if (pageContainer) {
            var index = 0;
            var blocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.cover):not(.catalogue):not(.disabled)'));
            blocks.forEach((block, i) => {
                var aNotes = Array.from(block.querySelectorAll('span.a-note'));
                var footerNotes = Array.from(block.querySelectorAll('.footnote'));
                footerNotes.forEach(node => {
                    node.remove();
                })

                if (aNotes.length) {
                    var footerNote = editor.dom.create('div', { 'class': 'footnote', 'data-id': $global.guid(), 'data-contentid': $global.guid(), 'contenteditable': 'false' }, '<hr align="left" />');
                    block.appendChild(footerNote);

                    aNotes.forEach(anote => {
                        let num = index + 1;
                        anote.dataset.number = num;
                        let pNote = editor.dom.create('p', { 'data-id': anote.dataset.id, 'data-number': num }, anote.dataset.title || '脚注描述文字');
                        footerNote.appendChild(pNote);
                        index++;
                    });
                }
            })
        }
    },

    getRealTrHeight(tr=null) {
        const editor = this.getActiveEditor();
        var trHeight = tr ? tr.offsetHeight : 30;
        if (tr) {
            var tds = Array.from(tr.querySelectorAll('td'));
            tds.forEach(td => {
                let tdChildNodes = Array.from(td.childNodes);
                let firstTop = 0;
                tdChildNodes.forEach((ele, i) => {
                    let eleHeight = 0;
                    let eleTop = 0;
                    if (ele.nodeName !== 'BR') {
                        if (ele.nodeName === '#text') {
                            let insEle = document.createElement('ins');
                            insEle.textContent = ele.textContent;
                            editor.dom.insertAfter(insEle, ele);
                            ele.remove();
                            eleHeight = insEle.offsetHeight;
                            eleTop = editor.dom.getPos(insEle).y;
                            if (i === 0) {
                                firstTop = eleTop;
                            }
                            ele = document.createTextNode(insEle.textContent);
                            editor.dom.insertAfter(ele, insEle);
                            insEle.remove();

                        } else {
                            eleHeight = ele.offsetHeight;
                            eleTop = editor.dom.getPos(ele).y;
                            if (i === 0) {
                                firstTop = eleTop;
                            }
                        }
                    }
                    // 仅取最后一个
                    if (i === tdChildNodes.length - 1) {
                        eleHeight = eleTop - firstTop + eleHeight;

                        if (eleHeight > trHeight) {
                            trHeight = eleHeight;
                        }
                    }
                });
            })
        }

        return trHeight;
    },

    async clearHideTr(pageContainer = null) {
        const isHasRowspan = tr => {
            let tds = tr.querySelectorAll('td');
            for (let td of tds) {
                if (td.rowSpan > 1) {
                    return td;
                }
            }
            return null;
        }

        const getNextTr = tr => {
            let nextTrs = [];
            const getElementSibling = currTr => {
                // let sideTr = currTr.nextElementSibling;
                let sideTr = currTr.previousElementSibling;
                if (sideTr && $global.hasClass(sideTr, 'hide')) {
                    nextTrs.push(sideTr);
                    getElementSibling(sideTr)
                }
            }
            getElementSibling(tr);
            return nextTrs;
        }

        const findRowspanTd = tr => {
            let sideTr = tr.previousElementSibling;
            if (sideTr) {
                let rowSpanTd = isHasRowspan(sideTr);
                if (rowSpanTd) {
                    return rowSpanTd;
                } else {
                    return findRowspanTd(sideTr)
                }
            } else {
                return null;
            }
        }

        const clearSideHideTr = (tr, flag) => {
            let sideTr = flag ? tr.previousElementSibling : tr.nextElementSibling;
            if (sideTr && $global.hasClass(sideTr, 'hide')) {
                // sideTr.dataset.clear = 'true';
                $global.addClass(sideTr, 'clear')
                clearSideHideTr(sideTr, flag)
            }
        }

        const cleartableContent = (block) => {
            let nextBlock = block.nextElementSibling;
            let tableNodes = Array.from(block.querySelectorAll('table'));
            // let cleared = false;
            if (nextBlock) {
                if (tableNodes.length) {
                    // 处理最后一个表格(主表)
                    let tableNode = tableNodes[tableNodes.length - 1];
                    if (!tableNode.dataset.parentid)  {
                        let currTrs = Array.from(tableNode.querySelectorAll('tbody>tr'));
                        let lastTr = currTrs[currTrs.length-1]
                        if ($global.hasClass(lastTr, 'hide')) {
                            let siblingNodes = getNextTr(lastTr);
                            let rowspanTr = siblingNodes[siblingNodes.length-1].previousElementSibling;
                            let rowspanTd = findRowspanTd(rowspanTr);
                            if (rowspanTd) {
                                rowspanTd.rowSpan = siblingNodes.length + 1;
                            }
                            siblingNodes.forEach(tr => {
                                tr.remove();
                            })
                            lastTr.remove();
                        }
                    }
                    // 处理第一个表格(续表)
                    tableNode = tableNodes[0];
                    if (tableNode.dataset.parentid)  {
                        let currTrs = Array.from(tableNode.querySelectorAll('tbody>tr.hide'));
                        for (let tr of currTrs) {
                            let rowspanTd = isHasRowspan(tr);
                            if (rowspanTd && !$global.hasClass(tr, 'clear')) {
                                // tr.dataset.rows = rowspanTd.rowSpan;
                                clearSideHideTr(tr, true); // 往上
                                clearSideHideTr(tr, false); // 往下
                                rowspanTd.rowSpan = rowspanTd.rowSpan - 1;
                                $global.addClass(tr, 'rows')
                            }
                        }
                        let clearTrs = Array.from(tableNode.querySelectorAll('tbody>tr.clear'));
                        clearTrs.forEach(tr => {
                            tr.remove();
                        })

                        let rowTrs = Array.from(tableNode.querySelectorAll('tbody>tr.rows'));
                        rowTrs.forEach(tr => {
                            let tds = tr.querySelectorAll('td');
                            let nextTr = tr.nextElementSibling;
                            if (nextTr) {
                                tds.forEach(td => {
                                    if (td.rowSpan > 1) {
                                        let tdIndex = parseInt(td.dataset.index) + 1;
                                        let nextTd = nextTr.querySelector(`td[data-index="${tdIndex}"]`);
                                        td.rowSpan = td.rowSpan - 1;
                                        td.innerHTML = '';
                                        nextTr.insertBefore(td, nextTd);
                                    }
                                })
                                tr.remove();
                            }
                        })
                    }
                }
                cleartableContent(nextBlock)
            }
            // return cleared;
        }

        const blocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.fixed)'));
        cleartableContent(blocks[0])
    },

    /**
     * @description 合并HTML内容
     * @param {Element}  pageContainer
     * @param {Array}  blocks 页面集合
     * @param {Boolean}  isAppendix 是否为附录页面
     */
    async mergeHtmlContent(pageContainer = null, blocks = [], isAppendix = false) {
        const editor = this.getActiveEditor();
        // 获取下页的元素
        const getNextBLock = (block) => {
            // 当前页如果内容撑出了则分页
            this.setPageBreak({ element: block }, block);
            let nextBlock = block.nextElementSibling;
            if (nextBlock.textContent.replace(/\s/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '') === '') {
                nextBlock = getNextBLock(nextBlock);
            } else {
                return nextBlock;
            }
        }

        // 处理表格与续表的内容
        const cleartableContent = (block) => {
            let tableNodes = Array.from(block.querySelectorAll('table'));
            tableNodes.forEach(table => {
                let titleNode = table.querySelector('.table-title');
                if (titleNode) {
                    // 上一个节点是否为图标题或章节条款
                    let parentNode = table.parentNode;
                    if (parentNode.dataset && parentNode.dataset.bookmark && !$global.hasClass(parentNode,'hide-list')) {
                        let prevNode = table.previousElementSibling;
                        if (!prevNode || (prevNode && ['SPAN','EM','STRONG','SUB','SUP'].includes(prevNode.node)) ||(prevNode && $global.hasClass(prevNode, 'img-title'))) {
                            $global.addClass(titleNode, 'half');
                        } else {
                            $global.removeClass(titleNode, 'half');
                        }
                    }
                }
            })
            return true;
        }

        // 校验页面
        // const outlineList = this.vm.outlineData[0]['children'];
        // 获取页面的名称
        /* const getBlockInfo = blockEle => {
            let outlineItem = _.find(outlineList, { outlineId: blockEle.dataset.outlineid });
            if (outlineItem) {
                return outlineItem.outlineTitle || '';
            } else {
                return blockEle.dataset.title || '';
            }
        } */

        const checkKeepMerge = (block, spaceHeight) => {
            let flag = false;
            let firstNode = block.firstChild;
            if (firstNode) {
                let firstTop = editor.dom.getPos(firstNode).y;
                $global.removeClass(firstNode, 'top-margin');
                let nodeStyle = window.getComputedStyle(firstNode);
                if ($global.hasClass(firstNode, 'header-title') && parseFloat(nodeStyle.height) > spaceHeight) {
                    return false;
                }
                let BeforeStyle = window.getComputedStyle(firstNode, ':before');
                let marginHeight = Math.ceil(parseFloat(BeforeStyle.marginTop)) + Math.ceil(parseFloat(BeforeStyle.marginBottom))
                let childNodes = Array.from(firstNode.childNodes);
                let maxHeight = 0;
                for (let ele of childNodes) {
                    let eleHeight = 0;
                    if (['#text','SPAN','EM','SUB','SUP','STRONG','A'].includes(ele.nodeName)) {
                        eleHeight = this.getELeRealHeight(ele, nodeStyle, null, block) + marginHeight;
                        if (eleHeight > maxHeight) {
                            maxHeight = eleHeight;
                        }
                        let nextEle = ele.nextSibling;
                        if (!nextEle || ['P','DIV','TABLE'].includes(nextEle.nodeName)) {
                            break;
                        }
                    } else {
                        if (ele.dataset && ele.dataset.appended) {
                            return false;
                        }
                        if (ele.nodeName === 'TABLE') {
                            let titleNode = ele.querySelector('.table-title');
                            let tableDescription = ele.querySelector('.table-description');
                            let tableHeader = ele.querySelector('thead');
                            if (!ele.dataset.parentid) { // 非续表
                                if (titleNode) {
                                    eleHeight += titleNode.offsetHeight;
                                }
                                if (tableDescription) {
                                    eleHeight += tableDescription.offsetHeight;
                                }
                                if (tableHeader) {
                                    eleHeight += tableHeader.offsetHeight;
                                }
                            }
                            let tr = ele.querySelector('tbody>tr:not(.hide)');
                            if (tr) {
                                let tds = Array.from(tr.querySelectorAll('td'));
                                let tdHeight = 0;
                                for (let td of tds) {
                                    if (td.offsetHeight > tdHeight) {
                                        tdHeight = td.offsetHeight;
                                    }
                                }
                                eleHeight += tdHeight + 2; // 加上线宽 this.getELeRealHeight(tr, nodeStyle, null, block);
                            }
                        } else { // 段落或列项
                            if(ele.querySelector('img')) {
                                eleHeight = this.getELeRealHeight(ele, nodeStyle, null, block);
                            } else {
                                let eleStyle = window.getComputedStyle(ele);
                                let paddingHeight = parseFloat(eleStyle.paddingTop) + parseFloat(eleStyle.paddingBottom);
                                let marginHeight = parseFloat(eleStyle.marginTop) + parseFloat(eleStyle.marginBottom);
                                eleHeight = Math.ceil(parseFloat(eleStyle.lineHeight || 20)) + paddingHeight + marginHeight; //
                            }
                        }
                        ele.dataset.appended = true;
                        if (eleHeight > maxHeight) {
                            maxHeight = eleHeight;
                        }
                        break;
                    }
                }
                flag = maxHeight < spaceHeight;
            }
            return flag;
        }

        // 处理当前页与下页的内容合并
        const parseHtml = async (block=null, retry=false) => {
            if (!block) {
                console.log( '异常错误！页面不存在，终止合并！');
                return false;
            }
            this.clearAtag(block);
            var mergeRes = false;
            if (!$global.hasClass(block, 'appendix')) {
                // 开始合并处理, 返回当前页合并结果
                mergeRes = this.mergeNextPage(block);
                // 处理页面中的层级项样式
                levelUtil.resetPadding(block, true);
                // 处理表格与续表的内容，主要清除表格的高度定义以及表标题与图标题的间隔距离
                var cleared = cleartableContent(block);
                // 再次分页处理
                var hasSplitPage = false;
                var outSideNode = await this.getOutSideNode(block, false, true);
                if (outSideNode && outSideNode.lastNode) {
                    hasSplitPage = true;
                    this.appendNextBlock(block, outSideNode);
                }
            } else {
                return true;
            }

            // 延迟处理，待分页完成及页面元素的属性重置
            return new Promise((resolve) => {
                setTimeout(() => {
                    let nextBlock = block.nextElementSibling;
                    if (nextBlock && !$global.hasClass(nextBlock, 'appendix')) {
                        let isSamPage = this.checkIsSamPage(block, nextBlock);
                        let spaceData = $global.calcBLockSpaceHeight(block);
                        let spaceHeight = spaceData.blockHeight - spaceData.allHeight;
                        // 判断是否还有空间继续做合并处理
                        if (isSamPage && spaceHeight >= 22) { // 44
                            hasSplitPage = false;
                            mergeRes = checkKeepMerge(nextBlock, spaceHeight);
                        }
                        if ((mergeRes && !hasSplitPage)) {
                            resolve(parseHtml(block));
                        } else {
                            if (nextBlock.childElementCount === 0) {
                                nextBlock = nextBlock.nextElementSibling;
                            }
                            resolve(parseHtml(nextBlock));
                        }
                    } else {
                        resolve(true);
                    }
                }, 750);
            })
        }
        // 开始合并（从第一个页面及第二个页面计算）0,1
        return await parseHtml(blocks[0]);
    },

    checkIsSamPage(currBlock, nextBlock) {
        if (!nextBlock) {
            return false;
        }
        var isSamPage = true;
        // 当前页面的类型
        var blockStyle = window.getComputedStyle(currBlock);
        var isStruct = $global.hasClass(currBlock, 'struct');
        var isAppendix = $global.hasClass(currBlock, 'appendix');

        // 判断页面的高宽和章节类型是否一致
        var nextBlockStyle = window.getComputedStyle(nextBlock);
        var nextBlockAppendix = $global.hasClass(nextBlock, 'appendix');
        var nextBlockStruct = $global.hasClass(currBlock, 'struct');

        isSamPage = parseInt(blockStyle.width) === parseInt(nextBlockStyle.width) && parseInt(blockStyle.height) === parseInt(nextBlockStyle.height);
        if (isSamPage && ((!isAppendix && nextBlockAppendix) || (isStruct && !nextBlockStruct)) ) {
            isSamPage = false;
        }
        // 如果都为附录页
        if (isSamPage && isAppendix && nextBlockAppendix) {
            isSamPage = currBlock.dataset.letter === nextBlock.dataset.letter;
        }

        return isSamPage;
    },

    clearAtag(block) {
        const aNodes = Array.from(block.querySelectorAll('a'));
        for (let node of aNodes) {
            for (let ele of Array.from(node.childNodes)) {
                $global.insertAfter(ele, node);
            }
            node.remove();
        }
    },

    /**
     * @description 计算节点元素的实际高度
     */
    getNodeReleaseHeight(ele = null, container = null) {
        var cloneEle = ele.cloneNode(true);
        cloneEle.style.position = "absolute";
        cloneEle.style.bottom = "0";
        cloneEle.style.visibility = "hidden";
        container.appendChild(cloneEle);
        var eleHeight = cloneEle.offsetHeight;
        cloneEle.remove();
        return eleHeight;
    },

    /**
     * @description 将下一个页面的部分元素抽取到上一个页面中
     */
    mergeBlockPage(spaceHeight = 0, block = null, nextBlock = null, pageContainer = null, isAppendix = false) {
        const editor = this.getActiveEditor();
        var sameBlock = true;
        // 如果是附录章节则校验下个页面是否为跨页
        if (isAppendix && nextBlock) {
            sameBlock = block.dataset.outlineid === nextBlock.dataset.outlineid;
        }
        // 开始合并
        // debugger
        if (nextBlock && sameBlock) {
            try {
                let eleAllHeight = 0;
                let isBreak = false;
                // 如果下个页面中包含了多个子节点，须还要遍历分析子节点的子元素
                var nextBlockChildNodes = Array.from(nextBlock.childNodes);
                nextBlockChildNodes = $global.filterNodesBySelector(nextBlockChildNodes)['filters'];
                for (let j = 0; j < nextBlockChildNodes.length; j++) {
                    let node = nextBlockChildNodes[j];
                    let nodeStyle = window.getComputedStyle(node);
                    let BeforeStyle = window.getComputedStyle(node, ':before');
                    let parentNodeStyle = window.getComputedStyle(node.parentNode);
                    if (isBreak) {
                        break;
                    }
                    // 如果当前节点为隐藏层级项且无内容则直接删除
                    if ($global.hasClass(node, 'hide-list') && node.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '') === '' && !node.childNodes.length) {
                        node.remove();
                        continue;
                    } else {
                        let cls = node.className;
                        $global.removeClass(node, 'top-margin');
                        // 须补全条款节点
                        if (cls !== null && cls.match(/(ol-list|appendix-list|bullet)/g) !== null && !$global.hasClass(node, 'hide-list')) {
                            let firstChild = node.firstChild;
                            if (!firstChild || !['#text','SPAN','EM','SUB','SUP'].includes(firstChild.nodeName)) {
                                node.innerHTML = '&#8203' + node.innerHTML;
                            }
                        }
                        let olChildNodes = Array.from(node.childNodes);

                        // 获取元素的实际高度 //Math.ceil(node.offsetHeight + Math.ceil(parseFloat(nodeStyle.marginTop)) + Math.ceil(parseFloat(nodeStyle.marginBottom)));
                        let nodeHeight = this.getELeRealHeight(node, nodeStyle, parentNodeStyle, nextBlock);
                        // 如果元素的整体高度未超限
                        if (spaceHeight >= Math.ceil(eleAllHeight + nodeHeight) && !isBreak) {
                            // 元素累加高度
                            // eleAllHeight += nodeHeight;
                            // 是否为隐藏层级项
                            if (cls !== null && cls.match(/(ol-list|appendix-list|bullet)/g) !== null && $global.hasClass(node, 'hide-list')) {
                                // 重新定义Before
                                BeforeStyle = window.getComputedStyle(node, ':before');
                                // 取出源层级项
                                let olListArr = Array.from(pageContainer.querySelectorAll(`[data-outlineid="${node.dataset.outlineid}"]:not(.info-block):not(.header-title)`));
                                let olList;
                                for (let n = 0; n < olListArr.length; n++) {
                                    let el = olListArr[n];
                                    if (el === node && olListArr[n - 1]) {
                                        olList = olListArr[n - 1];
                                        break;
                                    }
                                }
                                if (olList) {
                                    for (let ele of olChildNodes) {
                                        if (ele.nodeName !== 'TABLE') {
                                            let eleHeight = this.getELeRealHeight(ele, nodeStyle, parentNodeStyle, nextBlock);
                                            if (spaceHeight >= eleAllHeight + eleHeight && !isBreak) {
                                                olList.appendChild(ele);
                                                eleAllHeight += eleHeight;
                                            } else {
                                                let newParagraph = this.extractParagraph(ele, spaceHeight - eleAllHeight);
                                                if (newParagraph) {
                                                    eleAllHeight += this.getELeRealHeight(newParagraph, nodeStyle, parentNodeStyle, nextBlock, true);
                                                    // 段落中是否包含脚注标签，如有则须重新计算空间
                                                    let aNotes = Array.from(newParagraph.querySelectorAll('.a-note'));
                                                    eleAllHeight += this.getFootNoteHeight(aNotes, nextBlock);
                                                    if (spaceHeight >= eleAllHeight && !isBreak) {
                                                        olList.appendChild(newParagraph);
                                                    } else {
                                                        isBreak = true;
                                                        break;
                                                    }
                                                }
                                            }
                                        } else {
                                            eleAllHeight += this.getELeRealHeight(ele, nodeStyle, parentNodeStyle, nextBlock);
                                            // 判断是否为续表对象  && pageContainer.querySelector(`[data-id="${ele.dataset.parentid}"]`)
                                            if (ele.dataset.parentid) {
                                                let parentTable = block.querySelector(`[data-id="${ele.dataset.parentid}"]`) || block.querySelector(`[data-parentid="${ele.dataset.parentid}"]`);
                                                if (parentTable) {
                                                    // 续表则减去表标题
                                                    let tableTitle = ele.querySelector('caption.table-title');
                                                    if (tableTitle) {
                                                        eleAllHeight -= this.getELeRealHeight(tableTitle, nodeStyle, parentNodeStyle, nextBlock);
                                                    }
                                                    // 续表则减去表描述
                                                    let tableDesc = ele.querySelector('caption.table-description');
                                                    if (tableDesc) {
                                                        eleAllHeight -= this.getELeRealHeight(tableDesc, nodeStyle, parentNodeStyle, nextBlock);
                                                    }

                                                    // 续表则减去表头高度
                                                    let thead = ele.querySelector('thead');
                                                    if (thead) {
                                                        eleAllHeight -= this.getELeRealHeight(thead, nodeStyle, parentNodeStyle, nextBlock) + 2;
                                                    }

                                                    let trs = Array.from(ele.querySelectorAll('tbody>tr:not(.hide)'));
                                                    let hideIndex = [];
                                                    trs.forEach(tr => {
                                                        let trIndex = editor.dom.nodeIndex(tr);
                                                        hideIndex.push(trIndex);
                                                    });
                                                    Array.from(parentTable.querySelectorAll('tbody>tr')).forEach(tr => {
                                                        let trIndex = editor.dom.nodeIndex(tr);
                                                        if (hideIndex.includes(trIndex)) {
                                                            $global.removeClass(tr,'hide');
                                                        }
                                                    })
                                                    ele.remove();
                                                }
                                            } else {
                                                olList.appendChild(ele);
                                            }
                                        }
                                    };
                                    if (node.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '' || !node.offsetHeight) {
                                        node.remove();
                                    }
                                } else {
                                    $global.removeClass(node, 'hide-list');
                                    block.appendChild(node);
                                }
                            } else { // 非隐藏层级项
                                eleAllHeight += nodeHeight; // 直接加上节点高度
                                $global.removeClass(node, 'hide-list');
                                // 如果是表格且为clone对象的
                                if (node.nodeName === 'TABLE' && node.dataset.parentid) {
                                    // 找出上页中的父级
                                    let parentTable = block.querySelector(`table[data-id="${node.dataset.parentid}"]`);
                                    if (parentTable) {
                                        let parentTbody = parentTable.querySelector('tbody');
                                        Array.from(parentTbody.querySelectorAll('tbody>tr')).forEach(tr => {
                                            $global.removeClass(tr, 'hide');
                                        });
                                        node.remove();
                                    } else {
                                        block.appendChild(node);
                                    }
                                } else {
                                    // 如果是列项的须清理属性，同时将下一个同类项重置属性
                                    if ($global.hasClass(node, 'bullet') && node.dataset.cross !== undefined) {
                                        let bulletStart = String(parseInt(node.dataset.start) - 1);
                                        let bulletType = node.dataset.type;
                                        // let bulletLevel = node.dataset.level;
                                        node.removeAttribute('data-cross');
                                        node.removeAttribute('data-start');
                                        node.removeAttribute('style');
                                        node.removeAttribute('data-mce-style');
                                        let nextNodes = bulletUtil.getNextSameNodes(node);
                                        if (nextNodes.length > 1 && bulletStart !== undefined) {
                                            nextNodes[1].dataset.start = bulletStart;
                                            nextNodes[1].dataset.cross = true;
                                            nextNodes[1].counterReset = `${bulletType} ${bulletStart}`;
                                        }
                                    }
                                    block.appendChild(node);
                                }
                            }
                            isBreak = spaceHeight <= eleAllHeight;
                        } else { // 如果容器的高度已经超限，则计算容器内子元素是否可再提取出来
                            if (isBreak) {
                                break;
                            }
                            // 须元素行距小于限高
                            var nodeLineHeight = parseFloat(nodeStyle.lineHeight);
                            var minHeight = nodeLineHeight;
                            // var beforeHeight = 0;
                            if (!$global.hasClass(node, 'hide-list') && BeforeStyle && (parseFloat(BeforeStyle.marginTop) || parseFloat(BeforeStyle.marginBottom))) {
                                minHeight = parseFloat(BeforeStyle.marginTop) + parseFloat(BeforeStyle.marginBottom) + parseFloat(BeforeStyle.height);
                            }

                            var hasFootNote = false;
                            if (spaceHeight >= minHeight) {
                                var nodeTop = editor.dom.getPos(node).y;
                                var cloneNode = node.cloneNode();
                                var beforeHeight = 0;
                                // 如果是隐藏的层级项元素 $global.hasClass(node, 'hide-list')
                                if ($global.hasClass(node, 'ol-list') || $global.hasClass(node, 'appendix-list')) {
                                    let parentLiNode = block.querySelector(`[data-outlineid="${node.dataset.outlineid}"]:not(.header-title):not(.info-block)`); // :not(.hide-list)
                                    if (!$global.hasClass(node, 'hide-list')) {
                                        $global.removeClass(node, 'top-margin');
                                        if (BeforeStyle && (BeforeStyle.marginTop || BeforeStyle.marginBottom)) {
                                            beforeHeight = Math.ceil(parseFloat(BeforeStyle.marginTop) + parseFloat(BeforeStyle.marginBottom) + parseFloat(BeforeStyle.height));
                                        }
                                    }
                                    // 章节条款标题超限
                                    if (beforeHeight > spaceHeight) {
                                        isBreak = true;
                                        break;
                                        // return false;
                                    }

                                    // 先处理层级项的行内元素,标签元素定位
                                    for (let i = 0; i < olChildNodes.length; i++) {
                                        let ele = olChildNodes[i];
                                        if (!['#text','BR'].includes(ele.nodeName)) {
                                            ele.dataset.top = editor.dom.getPos(ele).y;
                                        }
                                    }

                                    // console.log('分解元素合并的子集章条目', olChildNodes);
                                    for (let i = 0; i < olChildNodes.length; i++) {
                                        if (isBreak) {
                                            break;
                                        }
                                        let ele = olChildNodes[i];

                                        let eleStyle = ['#text', 'BR'].includes(ele.nodeName) ? null : window.getComputedStyle(ele);
                                        // let eleHeight = eleStyle ? ele.offsetHeight || 0 + Math.ceil(parseFloat(eleStyle.marginTop || 0)) + Math.ceil(parseFloat(eleStyle.marginBottom || 0)) : this.getELeRealHeight(ele, eleStyle, nodeStyle, nextBlock);
                                        let eleHeight = eleStyle ? ele.offsetHeight || 0 + parseFloat(eleStyle.marginTop || 0) + parseFloat(eleStyle.marginBottom || 0) : this.getELeRealHeight(ele, eleStyle, nodeStyle, nextBlock);

                                        let eleTop = !['#text','BR'].includes(ele.nodeName) ? parseFloat(ele.dataset.top) : nodeTop;
                                        if (ele.nodeName === 'BR' && !isBreak) {
                                            eleHeight = 14;
                                            if (ele.nextSibling && ele.nextSibling.nodeName !== 'BR') {
                                                if (spaceHeight >= eleAllHeight + eleHeight && !isBreak) {
                                                    cloneNode.appendChild(ele);
                                                    eleAllHeight += eleHeight;
                                                } else {
                                                    isBreak = true;
                                                    break;
                                                }
                                            }

                                        } else if (['#text', 'A', 'SPAN', 'EM', 'STRONG', 'SUB', 'SUP', 'IMG'].includes(ele.nodeName) && !isBreak) {
                                            eleHeight = eleHeight < nodeLineHeight ? nodeLineHeight : eleHeight;
                                            if (node.firstChild === ele && beforeHeight > eleHeight) {
                                                eleHeight = beforeHeight;
                                            }
                                            if (spaceHeight >= eleAllHeight + eleHeight && !isBreak) {
                                                if (eleTop > nodeTop || eleHeight > nodeLineHeight || i === 0) {
                                                    if (eleTop > nodeTop) {
                                                        nodeTop = eleTop;
                                                    }
                                                    if (!ele.nextSibling || ['P','DIV','TABLE'].includes(ele.nextSibling.nodeName)) {
                                                        eleAllHeight += eleHeight;
                                                    }
                                                }
                                                cloneNode.appendChild(ele);
                                            } else {
                                                if (eleTop <= nodeTop && ele.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') !== '' && (spaceHeight - eleAllHeight) >= eleHeight) { //
                                                    let newTextNode = this.extractTextNode(ele, spaceHeight - eleAllHeight);
                                                    if (newTextNode) {
                                                        cloneNode.appendChild(newTextNode);
                                                    }
                                                }
                                                isBreak = true;
                                                break;
                                            }

                                        } else if ((ele.nodeName === 'P' || ele.nodeName === 'FIGURE') && !isBreak) {
                                            if (ele.querySelector('img')) {
                                                if (spaceHeight >= eleAllHeight + eleHeight && !isBreak) {
                                                    cloneNode.appendChild(ele);
                                                    eleAllHeight += eleHeight;
                                                } else {
                                                    isBreak = true;
                                                    break;
                                                }
                                            } else {
                                                // 段落直接Append到克隆层级项中
                                                if (spaceHeight >= eleAllHeight + eleHeight && !isBreak) {
                                                    eleAllHeight += eleHeight;
                                                    cloneNode.appendChild(ele);
                                                } else {
                                                    // 提取段落
                                                    let newParagraph = this.extractParagraph(ele, spaceHeight - eleAllHeight);
                                                    if (newParagraph && newParagraph !== ele) {
                                                        eleAllHeight += newParagraph.offsetHeight || this.getELeRealHeight(newParagraph, nodeStyle, parentNodeStyle, nextBlock, true);
                                                        // 段落中是否包含脚注标签，如有则须重新计算空间
                                                        let aNotes = Array.from(newParagraph.querySelectorAll('.a-note'));
                                                        if (aNotes.length) {
                                                            eleAllHeight += this.getFootNoteHeight(aNotes, nextBlock);
                                                            if (!hasFootNote) {
                                                                eleAllHeight += 15;
                                                                hasFootNote = true;
                                                            }
                                                        }
                                                        if (spaceHeight >= eleAllHeight && !isBreak) {
                                                            cloneNode.appendChild(newParagraph);
                                                            if (ele.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '' || !ele.offsetHeight) {
                                                                ele.remove();
                                                            }
                                                        } else {
                                                            isBreak = true;
                                                            break;
                                                        }
                                                    } else {
                                                        if (newParagraph && newParagraph.nodeName === 'P' && newParagraph.textContent === ele.textContent && !newParagraph.style.textIndent) {
                                                            newParagraph.style.textIndent = '2em';
                                                        }
                                                        isBreak = true;
                                                        break;
                                                    }
                                                }
                                            }
                                        } else if (ele.nodeName === 'DIV' && !isBreak) {
                                            if (spaceHeight >= eleAllHeight + eleHeight && !isBreak) {
                                                if ($global.hasClass(ele, 'bullet') && $global.hasClass(ele, 'hide-list') && editor.dom.nodeIndex(ele) === 0) {
                                                    let lastSameBullet = bulletUtil.getPrevBlockSameBullet(ele);
                                                    if (lastSameBullet) {
                                                        lastSameBullet.innerHTML = lastSameBullet.innerHTML + ele.innerHTML;
                                                        ele.remove();
                                                        spaceHeight -= eleHeight;
                                                    } else {
                                                        cloneNode.appendChild(ele);
                                                        eleAllHeight += eleHeight;
                                                    }
                                                } else {
                                                    cloneNode.appendChild(ele);
                                                    eleAllHeight += eleHeight;
                                                }
                                            } else {
                                                if ($global.hasClass(ele, 'math-desc')) { // 公式变量描述
                                                    let divChildNodes = Array.from(ele.childNodes);
                                                    for (let n=0; n<divChildNodes.length; n++) {
                                                        let divChild = divChildNodes[n];
                                                        let divChildHeight = this.getELeRealHeight(divChild, window.getComputedStyle(divChild), nodeStyle, nextBlock);
                                                        if (spaceHeight >= eleAllHeight + divChildHeight && !isBreak) {
                                                            cloneNode.appendChild(divChild);
                                                            eleAllHeight += divChildHeight;
                                                        } else {
                                                            break;
                                                        }
                                                    }
                                                } else if ($global.hasClass(ele, 'bullet') && spaceHeight < eleHeight) {
                                                    let newBulletPara = this.extractParagraph(ele, spaceHeight - eleAllHeight);
                                                    if (newBulletPara && newBulletPara !== ele) {
                                                        eleAllHeight += newBulletPara.offsetHeight || this.getELeRealHeight(newBulletPara, nodeStyle, parentNodeStyle, nextBlock, true);
                                                        let aNotes = Array.from(newBulletPara.querySelectorAll('.a-note'));
                                                        if (aNotes.length) {
                                                            eleAllHeight += this.getFootNoteHeight(aNotes, nextBlock);
                                                            if (!hasFootNote) {
                                                                eleAllHeight += 15;
                                                                hasFootNote = true;
                                                            }
                                                        }
                                                        if (spaceHeight >= eleAllHeight && !isBreak) {
                                                            cloneNode.appendChild(newBulletPara);
                                                            if (ele.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '' || !ele.offsetHeight) {
                                                                ele.remove();
                                                            } else {
                                                                $global.addClass(ele, 'hide-list');
                                                            }
                                                        } else {
                                                            isBreak = true;
                                                            break;
                                                        }
                                                    } else {
                                                        isBreak = true;
                                                        break;
                                                    }
                                                    // console.log(newBulletPara)
                                                }
                                                isBreak = true;
                                                break;
                                            }
                                        } else if (ele.nodeName === 'TABLE' && !isBreak) {
                                            // 如果是表格且为续表对象的须考虑去掉表头的高度
                                            let tableHeight = this.getELeRealHeight(ele, window.getComputedStyle(ele), nodeStyle, nextBlock);
                                            // 判断当前TABLE是否为续表
                                            let sourceTable = block.querySelector(`table[data-id="${ele.dataset.parentid}"]`) || block.querySelector(`table[data-parentid="${ele.dataset.parentid}"]`);
                                            if (ele.dataset.parentid && sourceTable) {
                                                let firstTr = ele.querySelector('tbody>tr:not(.hide)');
                                                if (firstTr.offsetHeight + 2 > spaceHeight) { // 第一个单元行高度加边框线大于留空 addBy sam.shen 2023-12-28
                                                    isBreak = true;
                                                    break;
                                                    // return false;
                                                }
                                                let mergeResult = tableUtil.mergeTable(sourceTable, spaceHeight);
                                                isBreak = mergeResult.isBreak;
                                                eleAllHeight += mergeResult.eleAllHeight;
                                            } else {
                                                // 非续表情况下，实际空间位置减少边框上下线宽
                                                spaceHeight -= parseFloat(eleStyle.borderWidth || 1) * 2;
                                                ele.removeAttribute('data-parentid');
                                                $global.removeClass(ele, 'xu');
                                                // 如果存在表标题则须加上该元素的实际高度
                                                let tableTitle = ele.querySelector('.table-title');
                                                if (tableTitle) {
                                                    $global.removeClass(tableTitle, 'txu');
                                                    eleAllHeight += this.getELeRealHeight(tableTitle, window.getComputedStyle(tableTitle), nodeStyle, nextBlock);
                                                }
                                                // 如果存在表描述元素须加上该元素的实际高度
                                                let tableDescription = ele.querySelector('.table-description');
                                                if (tableDescription) {
                                                    eleAllHeight += this.getELeRealHeight(tableDescription, window.getComputedStyle(tableDescription), nodeStyle, nextBlock);
                                                }
                                                // 如果存在表头
                                                let tableHead = ele.querySelector('thead');
                                                if (tableHead) {
                                                    eleAllHeight += this.getELeRealHeight(tableHead, window.getComputedStyle(tableHead), nodeStyle, nextBlock); //tableHead.offsetHeight;
                                                }

                                                // 取出表主体第一个TR
                                                let firstTr = ele.querySelector('tbody>tr:not(.hide)');
                                                let firstTrHeight = this.getRealTrHeight(firstTr);

                                                // 如果去掉了tbody内行后，整个表格的高度还小于空间则处理单元行 10:表格底边距
                                                if (spaceHeight >= eleAllHeight + firstTrHeight && !isBreak) {
                                                    let cloneTable = ele.cloneNode(true);
                                                    let cloneTableTbody = cloneTable.querySelector('tbody');
                                                    cloneTableTbody.innerHTML = '';
                                                    // 表格加入到目标对象中
                                                    cloneNode.appendChild(cloneTable);
                                                    isBreak = tableUtil.mergeTableByNew(ele, cloneTable, spaceHeight - eleAllHeight); // 实际可以分割单元行的空间
                                                    if (isBreak) {
                                                        ele.dataset.parentid = ele.dataset.id;
                                                        ele.dataset.id = $global.guid();
                                                        $global.addClass(ele, 'xu');
                                                        if (tableTitle) {
                                                            $global.addClass(tableTitle, 'txu');
                                                        }
                                                    } else {
                                                        eleAllHeight += tableHeight;
                                                        ele.remove();
                                                    }
                                                } else {
                                                    if (parentLiNode && cls && cls.match(/(ol-list|appendix-list|bullet)/g) !== null) {
                                                        $global.addClass(node, 'hide-list');
                                                    }
                                                    eleAllHeight += eleHeight;
                                                    isBreak = true;
                                                    break;
                                                }
                                            }
                                        }
                                    }

                                    if (parentLiNode) {
                                        // clone对象的子集处理；
                                        Array.from(cloneNode.childNodes).forEach(ele => {
                                            parentLiNode.appendChild(ele);
                                        });
                                    } else {
                                        // 非clone对象的子集处理；
                                        if (cloneNode.childNodes.length > 0) {
                                            block.appendChild(cloneNode);
                                            let lastNode = cloneNode.childNodes[cloneNode.childNodes.length - 1];
                                            if ($global.hasClass(lastNode, 'bullet') && ['num', 'lower', 'num-index'].includes(lastNode.dataset.type)) {
                                                let sameBullets = [lastNode].concat(bulletUtil.getPrevSameLevelAndType(node, true));
                                                let nodeFirstBullet = node.firstChild;
                                                if (nodeFirstBullet && $global.hasClass(nodeFirstBullet, 'bullet') && nodeFirstBullet.dataset.type === lastNode.dataset.type && nodeFirstBullet.dataset.level === lastNode.dataset.level) {
                                                    nodeFirstBullet.dataset.start = sameBullets.length;
                                                    nodeFirstBullet.style.counterReset = `${nodeFirstBullet.dataset.type} ${sameBullets.length}`;
                                                }
                                            }
                                        } else {
                                            cloneNode.remove();
                                            isBreak = true;
                                            break;
                                        }
                                    }

                                    // 如果节点的子集都被提取到clone对象中则源节点删除
                                    if (node.dataset && cloneNode.dataset && (node.dataset.outlineid === cloneNode.dataset.outlineid || node.dataset.id === cloneNode.dataset.id)) {
                                        if (node.childElementCount === 0 && node.textContent.replace(/\s/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '') === "") {
                                            node.remove();
                                        } else {
                                            // 判断节点的子集对象实际是否为空
                                            if (cls && cls.match(/(ol-list|appendix-list|bullet)/g) !== null) {
                                                $global.addClass(node, 'hide-list');
                                                /* if (node.dataset.margin) {
                                                    $global.addClass(node, 'top-margin');
                                                } */
                                            }
                                        }
                                    }
                                } else if (node.nodeName === 'TABLE' && !isBreak) {
                                    // 判断当前TABLE是否为续表或者被分页拆分的表
                                    // debugger
                                    if (node.dataset.parentid && block.querySelector(`table[data-id="${node.dataset.parentid}"]`)) {
                                        let sourceTable = block.querySelector(`table[data-id="${node.dataset.parentid}"]`);
                                        let mergeResult = tableUtil.mergeTable(sourceTable, spaceHeight);
                                        isBreak = mergeResult.isBreak;
                                        eleAllHeight += mergeResult.eleAllHeight;
                                    } else { // 当前TABLE为主表的
                                        block.appendChild(node);
                                        isBreak = true;
                                    }
                                } else if (node.nodeName === 'P' && !isBreak) {
                                    // console.log('合并段落处理', node);
                                    if (node.querySelector('img')) {
                                        if (spaceHeight >= eleAllHeight + node.offsetHeight) {
                                            block.appendChild(ele);
                                            eleAllHeight += ele.offsetHeight;
                                        } else {
                                            isBreak = true;
                                            break;
                                        }
                                    } else {
                                        // 分隔段落内容
                                        let newParagraph = this.extractParagraph(node, spaceHeight - eleAllHeight);
                                        if (newParagraph) {
                                            block.appendChild(newParagraph);
                                            eleAllHeight += newParagraph.offsetHeight || this.getNodeReleaseHeight(newParagraph, node.parentNode);
                                        } else {
                                            isBreak = true;
                                            break;
                                        }
                                    }
                                } else {
                                    isBreak = true;
                                    break;
                                }
                            } else {
                                if (node.dataset && node.dataset.margin) {
                                    // $global.addClass(node, 'top-margin');
                                    node.removeAttribute('top-margin');
                                }
                                isBreak = true;
                                break;
                                // return false;
                            }
                        }
                    }
                }
                this.clearEmptyPage(pageContainer);
                return isBreak;
            } catch (error) {
                alert('页面合并处理模块发生异常！');
                console.log('页面合并处理模块发生异常==>',error)
                return false;
            }
        }
    },

    /**
     * @description 获取脚注元素的所有高度
     * @param {Array} aNotes 当前脚注标签节点
     * @param {Element} block 页面
     */
    getFootNoteHeight(aNotes, block) {
        let eleAllHeight = 0;
        aNotes.forEach(aNote => {
            let pNote = block.querySelector(`.footnote>p[data-id="${aNote.dataset.id}"]`);
            if (pNote) {
                eleAllHeight += pNote.offsetHeight;
            }
        });
        return eleAllHeight;
    },


    /**
     * @description 重新合并元素内被拆分的textNode
     * @param {Element} node 当前元素
     */
    resetSplitTextNodes(node=null) {
        var childNodes = Array.from(node.childNodes);
        const lens = childNodes.length;
        // 如果子集已经被拆分了则须合并textNode
        var arrs = [], textStr = '';
        for (let i=0; i<=lens; i++) {
            let ele = childNodes[i];
            /*if (!ele) {
                continue;
            }*/
            if (i > 0) {
                let prevEle = childNodes[i-1];
                if (!ele || prevEle.nodeName !== ele.nodeName) {
                    if (textStr) {
                        arrs.push(textStr);
                    }
                    textStr = '';
                }
            }
            if (ele) {
                if (['#text','INS'].includes(ele.nodeName)) {
                    textStr += ele.textContent;
                } else {
                    arrs.push(ele);
                }
            }
        }
        // console.log(arrs)
        if (arrs.length && arrs.length < lens) {
            node.innerHTML = '';
            arrs.forEach(n => {
                if (typeof n === 'Object') {
                    node.appendChild(n);
                } else {
                    node.append(n);
                }
            })
            childNodes = Array.from(node.childNodes);
        }
        return childNodes;
    },

    extractTextNode(ele = null, spaceHeight = 0, prevStr) {
        var editor = this.getActiveEditor();
        const splitContent = (str='') => {
            var textSplits = str.split("");
            let ins = [];
            for (let i = 0; i < textSplits.length; i++) {
                ins.push(`<ins class="tmp-ele">${textSplits[i]}</ins>`);
            }
            return ins;
        }
		var nodeName = ele.nodeName;
        var eleTxt = ele.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
        if (eleTxt) {
            var ins = splitContent(eleTxt);
            // if (prevStr) {
            //     ins.unshift(`<ins class="tmp-ele">${prevStr}</ins>`)
            // }
			var spanNode = editor.dom.create('span', {}, ins.join(""));
			editor.dom.insertAfter(spanNode, ele);
			ele.remove();

			var eleTop = spanNode.offsetTop;
			var strArr = [], appendStr = [];
			Array.from(spanNode.querySelectorAll('ins')).forEach(inEle => {
				let inTop = inEle.offsetTop;// editor.dom.getPos(inEle).y;
				let inHeight = inEle.offsetHeight + inTop - eleTop;
				if (inHeight <= spaceHeight) {
					strArr.push(inEle.textContent);
					inEle.dataset.rm = true;
				} else {
					appendStr.push(inEle.textContent);
				}
			});
			// 保留的字符
			if (appendStr.length) {
				var sourceELe;
				if (nodeName === '#text') {
					sourceELe = document.createTextNode(appendStr.join(''));
				} else {
					sourceELe =  editor.dom.create(nodeName, {}, appendStr.join(''));
				}
				editor.dom.insertAfter(sourceELe, spanNode);
			}
			spanNode.remove();
			// 分割后的字符
			if (strArr.length) {
                // 去除附加的层级项文字
                // if (prevStr) {
                //     strArr.splice(0,1);
                // }
				var cloneEle;
				if (nodeName === '#text') {
					cloneEle = document.createTextNode(strArr.join(''));
				} else {
					cloneEle =  editor.dom.create(nodeName, {}, strArr.join(''));
				}
				return cloneEle;
			}
        }
		return null;
    },


    /**
     * @description 将节点中的文字重新提取到新的段落中；如果内容中有其他非文本元素则深度处理,仅分析第一层子集
     * @param {Element} node 当前节点
     * @param {Int} spaceHeight 空间限制
     */
    extractParagraph(node = null, spaceHeight = 0) {
        var editor = this.getActiveEditor();
        var block = editor.dom.getParent(node, '.info-block');
        // var nextBlock = block.nextElementSibling;
        var nodeStyle = window.getComputedStyle(node);
        var nodeLine = parseFloat(nodeStyle.lineHeight);
        var nodeTop = editor.dom.getPos(node).y;
        var lineHeight = parseFloat(nodeStyle.lineHeight);

        if (lineHeight > spaceHeight) {
            return null;
        }

        var cloneNode = node.cloneNode();
        const splitContent = (str='', allLens=0) => {
            var textSplits = str.split("");
            let ins = [];
            for (let i = 0; i < textSplits.length; i++) {
                ins.push(`<ins class="tmp-ele">${textSplits[i]}</ins>`);
            }
            if (ins.length) {
                if (allLens === 1) {
                    node.innerHTML = ins.join("");
                } else {
                    let reg = new RegExp(str, 'i');
                    node.innerHTML = node.innerHTML.replace(reg, ins.join(""));
                }
            }
            return ins;
        }

        var childNodes = this.resetSplitTextNodes(node);

        for (let i=0; i<childNodes.length; i++) {
            let ele = childNodes[i];
            if (['#text','A'].includes(ele.nodeName)) {
                let eleTxt = ele.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
                if (eleTxt) {
                    splitContent(eleTxt, childNodes.length);
                }
            }
        }

        childNodes = Array.from(node.childNodes);
        var currTop = 0;
        var indexof = 0, extraEle = []; // 矩阵式二维数组
        var isBreak = false;
        var splitMiddle = false;
        var eleAllHeight = 0;
        for (let i=0; i<childNodes.length; i++) {
            let ele = childNodes[i];
            let eleStyle = !['#text','BR'].includes(ele.nodeName) ? window.getComputedStyle(ele) : null;
            let eleLine = eleStyle ? parseFloat(eleStyle.lineHeight) : nodeLine;
            let eleHeight = ele.offsetHeight; //ele.offsetHeight < lineHeight ? lineHeight : ele.offsetHeight;

            if (!eleHeight) {
                continue;
            }
            if (eleHeight < eleLine) {
                eleHeight = eleLine;
            }
            let eleTop = editor.dom.getPos(ele).y - nodeTop - 3; // 3：上边界距离
            let lh = eleHeight + eleTop;
            if (i === 0) {
                currTop = eleTop;
            }
            if (spaceHeight >= Math.floor(lh)) {
                if (eleTop > currTop) {
                    currTop = eleTop;
                    eleAllHeight += lh;
                    indexof++;
                }
                let arrObj = _.find(extraEle, { indexof });
                if (!arrObj) {
                    arrObj = {
                        top: eleTop,
                        height: lh,
                        indexof,
                        eles: [],
                        aNotes: [],
                    };
                    extraEle.push(arrObj);
                } else {
                    if (lh > arrObj.height) {
                        arrObj.height = lh;
                    }
                }
                if ($global.hasClass(ele, 'a-note')) {
                    arrObj.aNotes.push(ele);
                }
                arrObj.eles.push(ele);
            } else {
                splitMiddle = i > 0;
                isBreak = true;
                break;
            }
        }

        // 清除临时元素
        var hasFootNote = false;
        if (extraEle.length) {
            for (let i=0; i<extraEle.length; i++) {
                let data = extraEle[i];
                // 如果有定义了脚注元素的, 计算实际占位高度是否超限
                if (!_.isEmpty(data.aNotes)) {
                    let footNoteHeight = this.getFootNoteHeight(data.aNotes, block);
                    if (!hasFootNote) {
                        footNoteHeight += 15; // 加上分割线高度
                        hasFootNote = true;
                    }
                    data.height += footNoteHeight;
                }
                if (data.height > spaceHeight) {
                    isBreak = true;
                    break;
                }

                data.eles.forEach(ele => {
                    if ($global.hasClass(ele, 'tmp-ele')) {
                        cloneNode.append(ele.textContent);
                    } else {
                        cloneNode.appendChild(ele.cloneNode(true));
                    }
                    ele.remove();
                })
            }
        }

        // 还原节点元素
        this.resetSplitTextNodes(node);

        if (cloneNode.childNodes.length) {
            this.resetSplitTextNodes(cloneNode);
        }

        if (isBreak && node.nodeName === "P" && splitMiddle) {
            node.style.textIndent = null;
        }

        return cloneNode.innerHTML !== '' ? cloneNode : node;
    },
    /**
     * @description 计算页面的实际宽度
     * @param {Element}  block
     */
    calcBLockSpaceWidth(block = null) {
        var blockStyle = window.getComputedStyle(block);
        return {
            width: Math.floor(block.offsetWidth - Math.ceil(parseFloat(blockStyle.paddingLeft)) - Math.ceil(parseFloat(blockStyle.paddingRight))),
            height: Math.floor(block.offsetHeight - Math.ceil(parseFloat(blockStyle.paddingTop)) - Math.ceil(parseFloat(blockStyle.paddingBottom)))
        }
    },

    /**
     * @description 从当前元素位置分割页面
     * @param {Element} element
     */
    splitPage(element = null) {
        var editor = this.getActiveEditor();
        var parentEle = editor.dom.getParent(element, '.ol-list') || editor.dom.getParent(element, '.appendix-list');
        if (!parentEle) {
            parentEle = element;
        }
        var nextNodes = $global.getNextAllNodes(parentEle);
        var currBlock = editor.dom.getParent(parentEle, '.info-block');

        if (element !== parentEle && parentEle.dataset.index) {
            var samNextNodes = $global.getNextAllNodes(element);
            parentEle = parentEle.cloneNode();
            parentEle.appendChild(element);
            samNextNodes.forEach(ele => {
                parentEle.appendChild(ele);
            })
            $global.addClass(parentEle, 'hide-list');
        }

        // 创建新页面
        var nextBlock = currBlock.cloneNode();
        editor.dom.insertAfter(nextBlock, currBlock);
        //
        nextBlock.appendChild(parentEle);
        nextNodes.forEach(ele => {
            nextBlock.appendChild(ele);
        })

        // 新页面的属性
        if (!$global.hasClass(nextBlock, 'approve')) {
           this.updatePageAttrs(nextBlock);
            // 重置页面编号
            this.resetPageNumber();
        }
        return nextBlock;
    },

    async setHidePages(pageContainer, block) {
        const blocks = Array.from(pageContainer.querySelectorAll('.info-block'));
        for (let pageBlock of blocks) {
            $global.addClass(pageBlock,'pageHide');
            if (pageBlock === block) {
                const prevBlock = pageBlock.previousElementSibling;
                if (prevBlock) {
                    $global.removeClass(prevBlock,'pageHide');
                }
                $global.removeClass(pageBlock,'pageHide');
                pageBlock.scrollIntoView({
                    block: "start",
                    inline: "nearest"
                });
            } else {
                $global.addClass(pageBlock,'pageHide');
            }
        }
        return true;
    },

    /**
     * @description 自动处理分页
     *  @param {Boolean} keepBreak 分页完成后是否继续分页
     */
    async autoPageBreak(keepBreak = true, callBack = null) {
        var editor = this.getActiveEditor();
        if (!editor || !editor.getBody()) {
            return false;
        }
        var hasAlert = false;
        this.vm.breakingPage = true;
        //this.vm.loadingTimes = 60 * 1000;
        this.vm.onLoading('开始分页...', true, 60 * 5 * 1000);

        const pageContainer = editor.getBody().querySelector('.page-container');
        var pageWidth = 210, pageHeight = 297;
        if (this.vm.editorSetting.page && this.vm.editorSetting.page.size) {
            pageWidth = this.vm.editorSetting.page.size.width || 210;
            pageHeight = this.vm.editorSetting.page.size.height || 297;
        }

        const outlineList = outlineUtil.getOutlineBypage(pageContainer, true);

        const breakPage = async block => {
            if (keepBreak) {
                await this.setHidePages(pageContainer, block);
            }
            block.dataset.break = "true";
            // 非航司模板
            if (this.vm.pageData?.stdKind !== this.vm.editorSetting.tmplType) {
                block.style.paddingBottom = "20mm";
            }
            
            // 页面的高宽
            if(!block.style.width) {
                block.style.width = block.dataset.pagesize && block.dataset.pagesize === 'A3' ? `${pageHeight}mm` : `${pageWidth}mm`;
            }
            if(!block.style.height || block.style.height === 'auto') {
               block.style.height = block.dataset.pagesize && block.dataset.pagesize === 'A3' ? `${pageWidth}mm` : `${pageHeight}mm`;
            }
            levelUtil.resetPadding(block);

            let tables = Array.from(block.querySelectorAll('table'))
            // 分页有其他问题先不加修复
            // tables = tables.forEach(table => {
            //     tableUtil.normalizeTableColumns(table)
            // })
            

            // console.log(outlineList, block.dataset.outlineid)
            const blockTitle = this.getBlockTitle(block);
            if (blockTitle) {
                this.vm.onLoading(`正在处理【${blockTitle}】分页`);
                /*_.debounce(() => {
                    this.vm.onLoading(`正在处理【${blockTitle}】分页`);
                })*/
            }
            // debugger
            let outSideNode = await this.getOutSideNode(block, keepBreak);
            // debugger
            if (outSideNode && outSideNode.lastNode) {
                this.appendNextBlock(block, outSideNode);
                await breakPage(block); // 本页再次分页
            }
            let nextBlock = block.nextElementSibling;
            if (nextBlock) {
                if (keepBreak && !hasAlert) {
                    await $global.sleep(150);
                    // 继续分页处理
                    return await breakPage(nextBlock);
                } else {
                    this.vm.closeLoading();
                    return true;
                }
            } else {
                if (!nextBlock) {
                    // 重新定义页面排版方式
                    let layout = this.vm.editorSetting.page && this.vm.editorSetting.page.layout ? this.vm.editorSetting.page.layout : pageContainer.dataset.type;
                    this.updatePageComposition({ act:layout });
                    keepBreak = false;
                    this.vm.closeLoading();
                    this.vm.scrollTop({top:0});
                    this.vm.disabledChange = true;
                    this.vm.breakingPage = false;
                    console.log("分页完成....");
                    return true;
                }
            }
        }

        if (pageContainer) {
            var firstBlock = pageContainer.querySelector('.info-block:not(.cover):not(.catalogue):not(.approve):not(.record)');
            // 仅当前页分页
            if (!keepBreak) {
                firstBlock = editor.dom.getParent(editor.selection.getNode(), '.info-block');
            }
            if (firstBlock && !$global.hasClass(firstBlock, 'cover')) {
                let res = await breakPage(firstBlock);
                this.vm.breakingPage = false;
                this.vm.closeLoading();
                if (callBack) {
                    callBack(res);
                } else {
                    return res;
                }
            } else {
                this.vm.$alert('封面页或目次页不可操作分页！','错误提示', { type:'error'});
                this.vm.closeLoading();
                return false;
            }
        }
        this.vm.closeLoading();
        outlineList = null;
        return true;
    },

    /**
     * @description 页面分页
     * @param {Object} evt 事件对象
     * @param {Element} pageBlock 当前页面
     * @param {Boolean} singlePage 单个页面
     */
    async setPageBreak(evt = null, pageBlock = null, singlePage = false) {
        var editor = this.getActiveEditor();
        if (!evt || !evt.element || !editor) {
            return false;
        }
        if (!pageBlock && evt.element.nodeName !== 'BODY') {
            pageBlock = editor.dom.getParent(evt.element, '.info-block');
        }

        if (!evt.initial && pageBlock) {
            if ($global.hasClass(pageBlock, 'cover')) {
                return false;
            }

            var nextBlock = pageBlock.nextElementSibling;
            var outSideNode = await this.getOutSideNode(pageBlock, singlePage);
            if (outSideNode && outSideNode.lastNode) {
                // 如果下页的内容超限了则继续分页
                nextBlock = this.appendNextBlock(pageBlock, outSideNode, outSideNode.lastNode === evt.element);
            }
            // 如果下页的内容超限了则继续分页
            if (nextBlock) {
                let spaceData = $global.calcBLockSpaceHeight(nextBlock);
                if (spaceData.allHeight > spaceData.blockHeight) {
                    return await this.setPageBreak({ element: nextBlock }, nextBlock, singlePage);
                }
                return nextBlock;
            }

        }
        return false;
    },
    /**
     * @description 当前页有足够空间则合并同类下页内容
     * @param {Element} pageBlock
     */
    resetPageBreak(pageBlock = null) {
        if (!pageBlock || !pageBlock.dataset || !pageBlock.dataset.outlineid) {
            return false;
        }
        var editor = this.getActiveEditor();
        var pageContainer = editor.dom.getParent(pageBlock, '.page-container');
        var pageSpaceHeight = this.getPageSpaceHeight(pageBlock);
        if (pageSpaceHeight && pageSpaceHeight >= 21) {
            var isAppendix = $global.hasClass(pageBlock, 'appendix');
            var nextBlock = pageBlock.nextElementSibling;
            // 同类页面做处理
            if (nextBlock && pageBlock.dataset.outlineid === nextBlock.dataset.outlineid) {
                let merged = this.mergeBlockPage(pageSpaceHeight, pageBlock, nextBlock, pageContainer, isAppendix);
                if (!nextBlock.childElementCount) {
                    nextBlock.remove();
                    // 重置页面页码
                    this.resetPageNumber();
                    return true;
                }
            }
        }
        return false;
    },

    /**
     * @description 获取页面的剩余空间
     * @param {Element}  pageBlock
     */
    getPageSpaceHeight(pageBlock = null) {
        var blockStyle = window.getComputedStyle(pageBlock);
        // 页面的实际空间高度
        var spaceHeight = Math.ceil(parseFloat(blockStyle.height) - parseFloat(blockStyle.paddingTop) - parseFloat(blockStyle.paddingBottom));
        // 减去脚注的高度
        var footnote = pageBlock.querySelector('.footnote');
        if (footnote) {
            spaceHeight -= footnote.offsetHeight;// + 10;
        }
        for (let i = 0; i < pageBlock.childNodes.length; i++) {
            let ele = pageBlock.childNodes[i];
            if (!$global.hasClass(ele, 'footnote') && !/^(#text)$/.test(ele.nodeName) && !ele.dataset.mceCaret) {
                let eleStyle = window.getComputedStyle(ele);
                spaceHeight -= Math.ceil(ele.offsetHeight + parseFloat(eleStyle.marginTop) + parseFloat(eleStyle.marginBottom));
            }
        }
        return spaceHeight;
    },

    /**
     * @description 取出超出页面高度的节点DOM及后续的所有兄弟节点
     * @param {Element}  pageBlock 当前页面
     * @param {Boolean}  singlePage 单页面处理
     */
    async getOutSideNode(pageBlock = null, singlePage = false, isMerge = false) {
        var editor = this.getActiveEditor();
        const blockStyle = window.getComputedStyle(pageBlock);
        let blockHeight = parseFloat(blockStyle.height) - parseFloat(blockStyle.paddingTop) - parseFloat(blockStyle.paddingBottom);

        // 页面的实际空间高度
        var spaceHeight = Math.ceil(parseFloat(blockStyle.height) - parseFloat(blockStyle.paddingBottom)) - 2; //  -2:误差系数值

        /* const outsideTable = tableNode => {
            let breaked = false;
            return breaked;
        } */

        var limitHeight = 0;
        const childNodes = Array.from(pageBlock.childNodes);
        // 如果页面有脚注则再减去脚注的高度
        // 获取超出页面的子元素
        var lastNode = null, hasFootNote = false;
        let blockPaddingTop = 0;
        for (let i = 0; i < childNodes.length; i++) {
            let ele = childNodes[i];
            if (ele && ele.nodeName === 'P' && ele.dataset.mceBogus) {
                continue;
            }
            if (!['#text', 'BR'].includes(ele.nodeName)) {
                let eleStyle = window.getComputedStyle(ele);
                let eleHeight = this.getELeRealHeight(ele, eleStyle, blockStyle, pageBlock);
                let eleTop = editor.dom.getPos(ele).y - editor.dom.getPos(pageBlock).y - parseFloat(eleStyle.marginTop||0);
                if (!blockPaddingTop) {
                    blockPaddingTop = eleTop;
                }
                if (ele.nodeName === 'TABLE') {
                    eleHeight += 2; // 边框线
                    spaceHeight -= 15;//23;
                }
                // 如果页面有脚注则再减去脚注的高度，注意：须不在超限元素内
                let aNotes = Array.from(ele.querySelectorAll('.a-note'));
                if (aNotes.length) {
                    spaceHeight -= this.getFootNoteHeight(aNotes, pageBlock);
                    if (!hasFootNote) {
                        spaceHeight -= 5;
                    }
                    hasFootNote = true;
                }
                // console.log('spaceHeight--------------------------->', blockPaddingTop, eleTop, spaceHeight);
                let isBreak = false;
                if (!$global.hasClass(ele, 'footnote') && !/^(#text)$/.test(ele.nodeName) && !ele.dataset.mceCaret && Math.floor(eleTop + eleHeight) > spaceHeight) {
                    // console.log(eleTop, ele, blockHeight);
                    // debugger
                    // 判断是否为表格内单元格内容超限
                    let allRowHeight = 0;
                    let tableNodes = ele.nodeName === 'TABLE' ? [ele] : Array.from(ele.querySelectorAll('table'));
                    for (let tableNode of tableNodes) {
                        if (isBreak) {
                            break;
                        }
                        // tableUtil.clearRowsHeight(tableNode);
                        let tableHeight = this.getELeRealHeight(tableNode, eleStyle, blockStyle, pageBlock);

                            let rows = Array.from(tableNode.querySelectorAll('tbody>tr:not(.hide)'));//tableNode.rows;
                            for (let row of rows) {
                                let cells = Array.from(row.cells);
                                for (let cell of cells) {
                                    let cellHeight = cell.offsetHeight;//this.getELeRealHeight(cell, eleStyle, blockStyle, pageBlock);
                                    // cell && (cell.style.overflow = "hidden");
                                    // if (Math.floor(blockPaddingTop + cellHeight) > spaceHeight) {
                                    if (Math.floor(blockPaddingTop + tableHeight) > spaceHeight) {
                                        if (Math.ceil(cellHeight) > Math.ceil(blockHeight)) { // 单元格高度超限
                                            // this.splitNodeByTable(row, cell, blockHeight, pageBlock); // 950
                                            isBreak = true;
                                            break;
                                        }
                                    }
                                }
                            }

                    }
                    limitHeight = spaceHeight - eleHeight;
                    lastNode = ele;
                    break;
                }
            }
        }

        if (lastNode) {
            var appendNodes = $global.getNextAllNodes(lastNode);
            var splitNode;
            // 判断当前节点是否已超出界限
            var nodeTop = editor.dom.getPos(lastNode).y - editor.dom.getPos(pageBlock).y;
            var nodeStyle = window.getComputedStyle(lastNode) || {};
            // var nodeHeight = this.getELeRealHeight(lastNode, window.getComputedStyle(lastNode), null, pageBlock);
            if (Math.ceil(nodeTop + parseFloat(nodeStyle.lineHeight||21)) > spaceHeight) {
                splitNode = lastNode;
            } else {
                if (!/^(P|SPAN|EM|#text)$/.test(lastNode.nodeName)) { // 块元素处理
                    splitNode = await this.splitNode(lastNode, spaceHeight, isMerge);
                } else { // 行内元素处理
                    splitNode = this.splitParagraphStr(lastNode, spaceHeight);
                }
            }
            return {
                lastNode: splitNode,
                limitHeight,
                appendNodes
            };
        }
        return null;
    },
    // 表格内单元格内容超出页面高度，须将内容切片
    splitNodeByTable(row, cellNode, blockHeight, pageBlock, tableNode) {
        const cellStyle = window.getComputedStyle(cellNode);
        // const childNodes = Array.from(cellNode.childNodes);
        // let newNode = null;
        let eleAllHeight = 0;
        const limitELes = [];
        const nextRow = row.nextElementSibling;
        // const nextFirstCell = nextRow ? nextRow.firstChild : null;
        const rowHeight = row.offsetHeight;

        const getElementSiblingCell = index => {
            index = Number(index) + 1;
            let nextCell = nextRow.querySelector(`[data-index="${index}"]`);
            if (!nextCell) {
                return getElementSiblingCell(index);
            }
            return nextCell;
        }

        // 新建一个行元素
        const newTr = document.createElement('tr');
        newTr.className = 'split-tr';

        for (let cell of Array.from(row.cells)) {
            cell.removeAttribute('style');
            // const rowSpan = cell.rowSpan;
            let newCell = cell.cloneNode(true);
            // newCell.removeAttribute('style');
            newCell.removeAttribute('rowspan');

            // 开始判断
            let cellWidth = cell.offsetWidth;
            let tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.visibility = 'hidden';
            tempDiv.style.lineHeight = '12.5pt';
            tempDiv.style.width = (cellWidth - 4) + 'px';
            document.body.appendChild(tempDiv);
            const cellText = cell.textContent.replace(/\s/g,'').replace(/[\u200B-\u200D\uFEFF]/g, '');
            const words = cellText.split('');
            let tempContent = '', index = 0;
            for (let k = 0; k < words.length; k++) {
                tempContent += words[k];
                tempDiv.textContent = tempContent;
                if (tempDiv.scrollHeight > rowHeight) {
                    index = k;
                    break;
                }
            }

            if (index) {
                newCell.innerHTML = `<p>${words.slice(0, index).join('')}</p>`;
                cell.innerHTML = `<p>${words.slice(index, words.length).join('')}</p>`;
            } else {
                cell.innerHTML = '&#8203';
            }
//               const rowSpan = cell.rowSpan;
// cell.rowSpan = rowSpan
            /* if (rowSpan > 1) {
                if (rowSpan === 2) {
                    cell.removeAttribute('rowspan');
                    // 处理下个行列元素
                    if (nextRow) {
                        let nextCell = nextRow.querySelector(`[data-index="${cell.dataset.index}"]`);
                        if (!nextCell) {
                            nextCell = document.createElement('td');
                            nextCell.dataset.index = cell.dataset.index;
                            let nextFirstCell = getElementSiblingCell(cell.dataset.index);
                            nextRow.insertBefore(nextCell, nextFirstCell);
                        }
                    }
                } else {
                    cell.rowSpan = rowSpan - 1;
                }
            }
 */
            newTr.appendChild(newCell);
            tempDiv.remove();
        }
        row.parentNode.insertBefore(newTr, row);
        // debugger
        // 处理空行 addBy Sam.shen 2024-11-18
        if (row.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g,'') === '') {
            const nextRow = row.nextElementSibling;
            if (nextRow) {
                const nextCells = Array.from(nextRow.cells);
                const cells = Array.from(row.cells);
                for(let i=0; i<cells.length; i++) {
                    let cell = nextCells[i];
                    if (cell) {
                        cells[i].innerHTML = cell.innerHTML;
                    }
                }
                nextRow.remove();
            } else {
                row.remove();
            }
        }

        /* if (limitELes.length) {
            row.parentNode.insertBefore(newTr, row);
            debugger
        } */

        /* console.log(limitELes)
        debugger */
        /* if (limitELes.length) {
            const newTr = row.cloneNode(true);
            let newCells = Array.from(newTr.childNodes);
            for (let cell of newCells) {
                cell.removeAttribute('rowspan');

                let ele = _.find(limitELes, td => {
                    return td.cell.dataset.index === cell.dataset.index;
                })
                if (ele) {
                    debugger
                    const cellText = ele.cell.textContent.replace(/\s/g,'').replace(/[\u200B-\u200D\uFEFF]/g, '');
                    const words = cellText.split('');
                    const kt = words.slice(0, ele.index);
                    const nt = words.slice(ele.index, words.length);
                    ele.cell.innerHTML = `<p>${kt.join('')}</p>`;
                    cell.innerHTML = `<p>${nt.join('')}</p>`;

                } else {
                    cell.textContent = '';
                }
            }
            newTr.className = 'split-tr';
            row.parentNode.insertBefore(newTr, row);
            // $global.insertAfter(newTr, row);

            debugger
            // row.parentNode.insertBefore(newTr, )
        } */


    },

    resetLastNode(node = null, blockContainer = null) {
        var editor = this.getActiveEditor();
        // 页面中续表须做合并处理
        var tableNodes = Array.from(blockContainer.querySelectorAll('table:not(.xu)'));
        if (tableNodes.length) {
            tableNodes.forEach(table => {
                let realtionTable = Array.from(blockContainer.querySelectorAll(`table[data-parentid="${table.dataset.id}"]`));
                if (realtionTable.length) {
                    let trs = Array.from(table.querySelectorAll('tr'));
                    trs.forEach(tr => {
                        $global.removeClass(tr, 'hide');
                    });

                    realtionTable.forEach(tb => {
                        tb.remove();
                    });
                }
            })
        }

        bulletUtil.resetBulletNumberByBlock(editor, blockContainer ? [blockContainer] : [], node);
        return node;
    },

    /**
     * @description 元素置入到下一个页面中
     * @param {Element} infoBlock 当前页面
     * @param {Object} obj 要置入的元素集合
     */
    appendNextBlock(pageBlock = null, obj = {}, isFocus = false) {
        if (!pageBlock) return null;
        var editor = this.getActiveEditor();
        // 下一个页面
        var nextBlock = pageBlock.nextElementSibling;
        if (nextBlock && pageBlock.dataset.outlineid && nextBlock.dataset.outlineid === pageBlock.dataset.outlineid && nextBlock.offsetWidth === pageBlock.offsetWidth && nextBlock.offsetHeight === pageBlock.offsetHeight) {
            // 如果未定义页面高度且为无限延展的
            if (!nextBlock.style.height && pageBlock.style.height !== '' && this.vm.editorSetting.page.expand) {
                nextBlock.style.height = pageBlock.style.height;
            }

            var firstChild = nextBlock.firstChild;
            if (firstChild && $global.hasClass(firstChild, 'hide-list') && obj.lastNode.dataset.outlineid && obj.lastNode.dataset.outlineid === firstChild.dataset.outlineid) {
                var childNodes = Array.from(firstChild.childNodes);
                for (let i = 0; i < childNodes.length; i++) {
                    obj.lastNode.appendChild(childNodes[i]);
                }
                firstChild.remove();
            }
            $global.prependChild(obj.lastNode, nextBlock);
            this.resetLastNode(obj.lastNode, nextBlock);

        } else {
            nextBlock = pageBlock.cloneNode();
            editor.dom.insertAfter(nextBlock, pageBlock);

            // 直接置入新的页面
            nextBlock.appendChild(obj.lastNode);
            // 重新定义当前块元素
            this.resetLastNode(obj.lastNode, nextBlock);

            if (!$global.hasClass(nextBlock, 'approve')) {
               this.updatePageAttrs(nextBlock);
                // 重置页面编号
                this.resetPageNumber();
            }
        }

        // 再分析附加的元素是否可直接插入在当前元素后
        if (!_.isEmpty(obj.appendNodes)) {
            obj.appendNodes.reverse().forEach(ele => {
                editor.dom.insertAfter(ele, obj.lastNode);
            })
        }
        this.resetBulletNumbers(nextBlock);

        // pageBlock = tableUtil.removeHideTr(pageBlock)

        // 光标定位
         if (isFocus && obj.lastNode) {
            this.moveSelectionToElement(obj.lastNode);
        }
        // console.log('跨页元素', nextBlock);
        return nextBlock;
    },

    /**
     * @description 获取所有页面
     * @param {String} selector 选择器
     */
    getAllBLocks(selector = '') {
        var editor = this.getActiveEditor();
        var pageContainer = editor.getBody().querySelector('.page-container');
        var pageBlocks = pageContainer.querySelectorAll(`:scope>.info-block${selector}`);
        return pageBlocks;
    },

    /**
     * @description 为页面定义类型
     * @param {Element} block
     */
    setPageOutline(block, callBack) {
        var editor = this.getActiveEditor();
        var types = [{ text: 'Select...', value: '' }];
        outlineTypes.forEach(item => {
            if (item.struct) {
                let data = {
                    text: item.label,
                    value: String(item.type)
                }
                types.push(data);
            }
        })
        editor.windowManager.open({
            title: '页面章节设置',
            body: {
                type: 'panel',
                items: [{
                    type: 'grid',
                    columns: 2,
                    items: [{
                            type: 'listbox',
                            name: 'outlineType',
                            label: '请选择（必选）',
                            items: types
                        },
                        {
                            type: 'input',
                            label: '起始编号（必填数值）',
                            name: 'startNumber',
                            inputMode: 'numeric'
                        },
                    ]
                }]
            },
            buttons: [{
                    type: 'cancel',
                    name: 'closeButton',
                    text: 'Cancel'
                },
                {
                    type: 'submit',
                    name: 'submitButton',
                    text: 'Ok',
                    primary: true
                }
            ],
            initialData: {},
            onSubmit: (api, details) => {
                var data = api.getData();
                // console.log(data)
                if (data.outlineType && data.startNumber) {
                    if (!/^[0-9]*[1-9][0-9]*$/.test(data.startNumber)) {
                        editor.windowManager.alert("起始编号必须为正整数");
                        return;
                    }
                    block.dataset.outline = data.startNumber;
                    block.dataset.outlinetype = data.outlineType;
                    callBack && callBack(block);
                    api.close();
                }
            }
        });
    },

    /**
     * @description 将元素转为层级项
     * @param {Element} currNode
     * @param {Element} block
     */
    createLevelElement(currNode, block) {
        var editor = this.getActiveEditor();
        if (!block || !block.dataset.outline) {
            editor.windowManager.confirm('当前文档未定义大纲章节！是否立即定义？', flag => {
                if (flag) {
                    this.setPageOutline(block, newBlock => {
                        this.createLevelElement(currNode, newBlock);
                    });
                }
            });
            return;
        }
        // var parentid = block.dataset.id || block.dataset.outlineid;
        var uuid = $global.guid();

        var olEle = editor.dom.create('div', { class: 'ol-list' }, currNode.textContent);
        olEle.dataset.bookmark = uuid;
        olEle.dataset.index = block.dataset.outline;
        olEle.dataset.contentid = $global.guid();
        editor.dom.insertAfter(olEle, currNode);
        currNode.remove();
        this.moveSelectionToElement(olEle);
    },
    //
    /**
     * @description 获取元素实际高度
     * @param {Element} ele
     * @param {Object} eleStyle 子元素样式
     * @param {Object} parentStyle 父元素样式
     * @param {Element} block 当前页面块
     */
    getELeRealHeight(ele = null, eleStyle = null, parentStyle = null, block = null, isEmpty = false) {
        var editor = this.getActiveEditor();
        let blockStyle = window.getComputedStyle(block);
        let eleHeight = 0;
        if (ele.nodeName !== 'BR') {
            if (['#text', 'SPAN', 'EM', 'SUB', 'SUP'].includes(ele.nodeName) || isEmpty) {
                // 判断父节点是否为层级项
                let prevStr = '';
                let parentNode = ele.parentNode;
                if ($global.hasClass(parentNode, 'ol-list') || $global.hasClass(parentNode, 'appendix-list') && parentNode.firstChild === ele) {
                    prevStr = parentNode.dataset.index + '  ';
                    if ($global.hasClass(parentNode, 'appendix-list')) {
                        prevStr = parentNode.dataset.prev + '.' + parentNode.dataset.index + ' ';
                    }
                }
                let eleDom = document.createElement('div');
                eleDom.style.position = 'absolute';
                eleDom.style.visibility = 'hidden';
                eleDom.style.left = blockStyle.paddingLeft;
                eleDom.style.right = blockStyle.paddingRight;
                if (parentStyle) {
                    eleDom.style.lineHeight = parentStyle.lineHeight;
                }

                if (isEmpty) {
                    eleDom.appendChild(ele);
                } else {
                    eleDom.textContent = prevStr + (ele.nodeValue || ele.textContent);
                }

                block.appendChild(eleDom);
                eleHeight = eleDom.offsetHeight;
                eleDom.remove();
            } else {
                let eleRect = ele.getBoundingClientRect();
                let offsetHeight = eleRect.height;
                let eleIndex = editor.dom.nodeIndex(ele);
                eleStyle = eleStyle || window.getComputedStyle(ele);
                eleHeight = offsetHeight + parseFloat(eleStyle.marginTop || 0) + parseFloat(eleStyle.marginBottom || 0);
                if (eleIndex === 0 && ele.previousElementSibling && $global.hasClass(ele, 'top-margin') && !$global.hasClass(ele, 'hide-list') && ele.dataset.bookmark) {
                    eleHeight += 17;
                }
            }
        }

        return eleHeight;
    },

    /**
     * @description 子元素切割
     * @param {node} Element
     * @param {posTop} Int
     */
    async splitNode(node = null, posTop = 0, isMerge = false) {
        var editor = this.getActiveEditor();
        // var pageContainer = editor.dom.getParent(node, '.page-container');
        // 当前页面
        var block = editor.dom.getParent(node, '.info-block');
        // 清除定义表格的高度
        tableUtil.clearTableHeight(block);

        // 后一页
        var nextBlock = block.nextElementSibling;
        // 子集对象
        var childNodes = node.nodeName === 'TABLE' ? Array.from(node.querySelectorAll('tr:not(.hide),.table-title,.table-description')) : Array.from(node.childNodes);
        // 声明最后的元素
        var lastNode, nextSiblings = [], allHeight = 0;
        // debugger
        if (childNodes && childNodes.length) {
            var nodeStyle = window.getComputedStyle(node);
            var BeforeStyle = window.getComputedStyle(node, ':before');
            var hasFootNote = false;
            for (let i = 0; i < childNodes.length; i++) {
                let ele = childNodes[i];
                let offsetTop = 0, lineHeight = 0, eleHeight = 0;
                if (['#text','SPAN','EM','STRONG','IMG','SUP','SUB'].includes(ele.nodeName)) {
                    if (ele.nodeName === '#text') {
                        // 如果节点为空且为最后一个则直接跳过
                        if (ele.textContent.replace(/[\u200B-\u200D\uFEFF|/\s]/g, '') === '' && i === childNodes.length-1) {
                            continue;
                        }
                        let insEle = editor.dom.create('ins', {}, ele.textContent);
                        editor.dom.insertAfter(insEle, ele);
                        ele.remove();
                        eleHeight = this.getELeRealHeight(insEle, null, nodeStyle, nextBlock || block);
                        offsetTop = editor.dom.getPos(insEle).y - editor.dom.getPos(block).y;
                        allHeight += eleHeight;
                        // 重置原始节点
                        ele = document.createTextNode(insEle.textContent);
                        editor.dom.insertAfter(ele, insEle);
                        insEle.remove();
                    } else {
                        eleHeight = this.getELeRealHeight(ele, null, nodeStyle, nextBlock || block);
                        offsetTop = editor.dom.getPos(ele).y - editor.dom.getPos(block).y;
                        allHeight += eleHeight;
                    }
                    lineHeight = Math.ceil(parseFloat(nodeStyle.lineHeight || 22));

                    if (BeforeStyle && i === 0) {
                        let beforeHeight = parseFloat(BeforeStyle.marginTop) + parseFloat(BeforeStyle.marginBottom) + parseFloat(BeforeStyle.height);
                        if (beforeHeight > eleHeight) {
                            eleHeight = Math.ceil(beforeHeight);
                        }
                    }
                    // 如果是脚注标签则须重新计算空间
                    if (ele.nodeName === 'SPAN' && $global.hasClass('a-note')) {
                        let pNode = block.querySelector(`.footnote>p[data-id="${ele.dataset.id}"]`);
                        if (pNode) {
                            posTop -= pNode.offsetHeight;
                            // eleHeight += pNode.offsetHeight;
                            if (!hasFootNote) {
                                posTop -= 15;
                                hasFootNote = true;
                            }
                        }
                    }

                } else {
                    let style = window.getComputedStyle(ele);
                    offsetTop = editor.dom.getPos(ele).y - editor.dom.getPos(block).y - parseFloat(style.marginTop||0);
                    eleHeight = this.getELeRealHeight(ele, style, nodeStyle, nextBlock || block);
                    if (ele.nodeName === 'TR') {
                        eleHeight += 1;
                        // lineHeight = eleHeight;
                        lineHeight = tableUtil.getMaxHeightByRow(ele);
                    } else {
                        lineHeight = Math.ceil(parseFloat(style.lineHeight || 21));
                    }
                }

                if (lineHeight < eleHeight) {
                    lineHeight = eleHeight;
                }

                if (offsetTop + lineHeight > posTop - 5) { // 5：保留间隔
                    nextSiblings = Array.from($global.getNextAllNodes(ele));
                    if (ele.nodeName === "TABLE") {
                        // 重新设置下表格的单元行属性
                        lastNode = tableUtil.splitTable(ele, posTop - 4, this.vm.editorSetting.mergeDoc); // posTop-4 表格元素则考虑减少容差值
                        if (!lastNode) {
                            return null;
                        }
                    } else if (ele.nodeName === 'CAPTION') { // 若是表标题或表描述
                        return editor.dom.getParent(ele, 'table');
                    } else if (ele.nodeName === 'TR') { // 如果是单元行就直接取出所有后面的兄弟节点
                        if (editor.dom.getParent(ele, 'thead')) { // 或单元行为表头
                            return editor.dom.getParent(ele, 'table');
                        }
                        if (editor.dom.nodeIndex(ele) === 0) {
                            return editor.dom.getParent(ele, 'table');
                        } else {
                            lastNode = tableUtil.splitTableByTr(editor.dom.nodeIndex(ele), node); // i, node
                            return lastNode;
                        }
                    } else if ($global.hasClass(ele, 'bullet')) { // 列项
                        lastNode = this.splitBullet(ele, posTop);
                    } else if ($global.hasClass(ele, 'fld-char')) { // 目次项
                        lastNode = ele;
                    } else if (ele.nodeName === 'P' && ele.childElementCount && ele.childElementCount > 1) {
                        // 如果父级是术语层级项的则不做文本分割
                        if (ele.previousElementSibling === null && ele.parentNode && $global.hasClass(ele.parentNode, 'ol-list') && $global.hasClass(ele.parentNode, 'term')) {
                            lastNode = ele;
                        } else {
                            lastNode = this.splitParagraphChildren(ele, posTop);
                        }
                    } else if (['#text','SPAN','EM','STRONG','IMG','SUP','SUB'].includes(ele.nodeName)) {
                        lastNode = ele;
                    } else {
                        if (ele.textContent.replace(/[\u200B-\u200D\uFEFF|/\s]/g, '') !== '') {
                            lastNode = this.splitParagraphStr(ele, posTop);
                        } else {
                            lastNode = ele;
                        }
                    }
                    break;
                }
            }
        }

        if (lastNode) {
            var cloneNode = node.cloneNode();
            // 如果是章节条目 或 列项等
            if ($global.hasClass(node, 'ol-list') || $global.hasClass(node, 'appendix-list') || ($global.hasClass(node, 'bullet') && node.textContent !== lastNode.textContent)) {
                $global.addClass(cloneNode, 'hide-list');
                // 术语章节条目
                if (($global.hasClass(lastNode, 'term') && lastNode.textContent.replace(/[\u200B-\u200D\uFEFF|/\s]/g, '') !== '') || ($global.hasClass(node, 'bullet') && !['num','num-index','lower'].includes(node.dataset.type))) {
                    $global.removeClass(cloneNode, 'hide-list');
                }
                if (node.dataset && node.dataset.outlineid) {
                    // 层级项是否已经存在clone对象
                    var cloneOl = nextBlock ? nextBlock.querySelector(`div.hide-list[data-outlineid="${node.dataset.outlineid}"]`) : null;
                    if (cloneOl) {
                        cloneNode = cloneOl;
                        // if (lastNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') !== '' || lastNode.nodeName === 'P') {
                        $global.prependChild(lastNode, cloneNode);
                        // }
                        // 判断是否为续表
                        let nextNode = lastNode.nextElementSibling;
                        if (lastNode.nodeName === 'TABLE' && nextNode && nextNode.nodeName === 'TABLE' && lastNode.dataset.parentid && nextNode.dataset.parentid && lastNode.dataset.parentid === nextNode.dataset.parentid) {
                            nextNode.remove();
                        }
                        if (nextSiblings.length) {
                            nextSiblings.reverse().forEach(ele => {
                                editor.dom.insertAfter(ele, lastNode);
                            });
                        }
                        // 插入内容后直接退出
                        // return null;
                    } else {
                        cloneNode.appendChild(lastNode);
                        if (nextSiblings.length) {
                            nextSiblings.forEach(ele => {
                                cloneNode.appendChild(ele);
                            });
                        }
                    }
                    // let nodeOffsetTop = Math.ceil(editor.dom.getPos(node).y - editor.dom.getPos(block).y);
                    // let nodeHeight = this.getELeRealHeight(node, nodeStyle, {}, nextBlock || block);
                    // 当前超限元素无文本内容且无子元素 && !node.childNodes.length
                    const nodeChilds = Array.from(node.childNodes);
                    var emptyChild = true;
                    for (let cnode of nodeChilds) {
                        if (cnode.nodeName !== '#text') {
                            emptyChild = false;
                            break;
                        }
                    }
                    if (node.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '' && emptyChild) { // && (nodeOffsetTop + nodeHeight + 12 > posTop)
                        node.remove();
                        $global.removeClass(cloneNode, 'hide-list');
                    }
                }
            } else if (cloneNode.nodeName === 'TABLE') {
                cloneNode.dataset.id = $global.guid();
                cloneNode.dataset.parentid = node.dataset.id || "";
                $global.addClass(cloneNode, 'xu');
                if (cloneNode.querySelector('.table-title')) {
                    $global.addClass(cloneNode.querySelector('.table-title'), 'txu');
                }
            } else if ($global.hasClass(cloneNode, 'catalogue-list')) {
                cloneNode.appendChild(lastNode);
                if (nextSiblings.length) {
                    nextSiblings.forEach(ele => {
                        cloneNode.appendChild(ele);
                    });
                }
            } else if ($global.hasClass(cloneNode, 'bullet')) {
                cloneNode.appendChild(lastNode);
                if (nextSiblings.length) {
                    nextSiblings.forEach(ele => {
                        cloneNode.appendChild(ele);
                    });
                }
                if (node.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '' && (nodeOffsetTop + nodeHeight > posTop)) {
                    node.remove();
                }
            }
            return cloneNode;
        } else if ($global.hasClass(node.parentElement, 'info-block')) {
            // 直接是页面的子元素
            if ($global.hasClass(node, 'catalogue-list')) {
                // return lastNode;
            } else if ($global.hasClass(node, 'bullet')) {
                let sameBullets = bulletUtil.getPrevSameLevelAndType(node, true);
                if (sameBullets.length) {
                    node.dataset.cross = true;
                    node.dataset.start = sameBullets.length;
                    node.style.counterReset = `${node.dataset.type} ${sameBullets.length}`;
                }
            }
            // return node;
        }

        return lastNode;
    },


    /**
     * @description 拆分列项中的内容
     * @param {Element} node
     * @param {posTop} Int 偏移量
     */
    splitBullet(node = null, posTop = 0) {
        var editor = this.getActiveEditor();
        var block = editor.dom.getParent(node, '.info-block');
        var samBUllets = bulletUtil.getPrevSameLevelAndType(node, true);
        var childNodes = Array.from(node.childNodes);
        var splitNode = node.cloneNode();
        var newParg;
        // 如果子集对象多个
        if (childNodes.length > 1) {
            for (let i = 0; i < childNodes.length; i++) {
                let ele = childNodes[i];
                if (!['#text', 'EM', 'STRONG', 'SPAN'].includes(ele.nodeName)) {
                    let offsetTop = editor.dom.getPos(ele).y - editor.dom.getPos(block).y;
                    let style = window.getComputedStyle(ele);
                    let lineHeight = parseInt(style.lineHeight);
                    if (lineHeight < ele.offsetHeight) {
                        lineHeight = ele.offsetHeight;
                    }
                    if (offsetTop + lineHeight > posTop) {
                        if (ele.nodeName === 'TABLE') {
                            let cloneTable = tableUtil.splitTable(ele, posTop);
                            console.log(cloneTable)
                            splitNode.appendChild(cloneTable);
                        } else {
                            splitNode.appendChild(ele);
                        }
                    }
                }
            }
            if (!splitNode.childNodes.length) {
                newParg = this.splitParagraphStr(node, posTop);
                splitNode.innerHTML = newParg.innerHTML;
                newParg.remove();
            }
            $global.addClass(splitNode, 'hide-list');
        } else {
            var textContent = node.textContent;
            newParg = this.splitParagraphStr(node, posTop);
            splitNode.innerHTML = newParg.innerHTML;
            if (splitNode.textContent !== textContent) {
                $global.addClass(splitNode, 'hide-list');
            }
            newParg.remove();
        }

        if (['num', 'lower', 'num-index', 'tag-index'].includes(splitNode.dataset.type)) {
            let start = splitNode.dataset.start !== undefined ? splitNode.dataset.start : String(samBUllets.length);
            splitNode.dataset.cross = true;
            splitNode.dataset.start = start;
            splitNode.style.counterReset = `${splitNode.dataset.type} ${start}`;
        }
        return splitNode;
    },

    /**
     * @description 段落内元素超限处理
     * @param {node} Element
     * @param {posTop} Int
     */
    splitParagraphChildren(node = null, posTop = 0) {
        var editor = this.getActiveEditor();
        var block = editor.dom.getParent(node, '.info-block');
        var nodeStyle = window.getComputedStyle(node);

        $global.addClass(node, 'inline');

        // var nodeTop = editor.dom.getPos(node).y;
        var nodeClone = node.cloneNode();
        var childs = Array.from(node.childNodes);

        const splitContent = (str) => {
            var textSplits = str.split("");
            let ins = [];
            for (let i = 0; i < textSplits.length; i++) {
                ins.push(`<ins class="tmp-ele">${textSplits[i]}</ins>`);
            }
            if (ins.length) {
                try {
                    // 正则须替换下非法字符
                    if (str.match(/[\)]/gi) !== null) {
                        str = str.replace(/[\)]/g,"#######");
                    }
                    if (str.match(/[\(]/gi) !== null) {
                        str = str.replace(/[\(]/g,"&&&&&&&");
                    }
                    if (str.match(/[\(]/gi) !== null) {
                        str = str.replace(/[\(]/g,"&&&&&&&");
                    }
                    if (str.match(/\[/gi) !== null) {
                        str = str.replace(/\[/g,"-----------");
                    }
                    if (str.match(/\]/gi) !== null) {
                        str = str.replace(/\[/g,"===========");
                    }
                    let reg = new RegExp(str, 'i');
                    node.innerHTML = node.innerHTML.replace(reg, ins.join(""));
                    node.innerHTML = node.innerHTML.replace(/\#######/g, ')');
                    node.innerHTML = node.innerHTML.replace(/\&&&&&&&/g, '(');
                    node.innerHTML = node.innerHTML.replace(/\-----------/g, '[');
                    node.innerHTML = node.innerHTML.replace(/\===========/g, ']');
                } catch (err) {
                    throw err;
                }
            }
            return ins;
        }

        // 文本元素进行转换
        // var aLinkNode = [];
        for (let i=0; i<childs.length; i++) {
            let ele = childs[i];
            if (ele.nodeName === '#text') {
                splitContent(ele.textContent.replace(/[\u200B-\u200D\uFEFF]/g, ''));
            }
        }
        var splitMiddle = true;
        // 重置子集，取出超限的元素
        childs = Array.from(node.childNodes);
        for (let i = 0; i < childs.length; i++) {
            let ele = childs[i];
            let eleStyle = !['#text','BR'].includes(ele.nodeName) ? window.getComputedStyle(ele) : nodeStyle;
            let eleHeight = ele.offsetHeight;
            if (!eleHeight) {
                continue;
            }
            let eleLine = parseFloat(eleStyle.lineHeight);
            if (eleHeight && eleHeight < eleLine) {
                eleHeight = eleLine;
            }

            let offsetTop = editor.dom.getPos(ele).y - editor.dom.getPos(block).y;
            if (offsetTop + eleHeight > posTop) {
                if (i === 0 && splitMiddle) {
                    splitMiddle = false;
                }
                nodeClone.appendChild(ele);
            }
        }

        // 清除原始节点临时元素标签
        childs = Array.from(node.childNodes);
        for (let i = 0; i < childs.length; i++) {
            let ele = childs[i];
            if (ele.nodeName === 'INS' && $global.hasClass(ele, 'tmp-ele')) {
                let textNode = document.createTextNode(ele.textContent);
                editor.dom.insertAfter(textNode, ele);
                ele.remove();
            }
        }
        // 清除CLONE节点临时元素标签
        childs = Array.from(nodeClone.childNodes);
        for (let i = 0; i < childs.length; i++) {
            let ele = childs[i];
            if (ele.nodeName === 'INS' && $global.hasClass(ele, 'tmp-ele')) {
                let textNode = document.createTextNode(ele.textContent);
                editor.dom.insertAfter(textNode, ele);
                ele.remove();
            }
        }
        if (nodeClone.nodeName === 'P' && splitMiddle) {
            nodeClone.removeAttribute('style');
        }
        // 如果都被移除了子元素则删除本身元素
        if (node.textContent.replace(/[\u200B-\u200D\uFEFF]/g,'') === '') {
            node.remove();
        } else {
            $global.removeClass(node, 'inline');
        }
        $global.removeClass(nodeClone, 'inline');
        return nodeClone;
    },

    /**
     * @description 暂存元素
     * @param {Element} container
     * @param {Object} editor
     */
    cacheDomTags(container=null, editor=null) {
        var containerText = container.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
        var childNodes = Array.from(container.childNodes);
        var tags = [];
        if (containerText !== '' && childNodes.length > 1) {
            // 先列出所有标签,并定位起始位置和结束位置
            childNodes.forEach(node => {
                // console.log(node);
                if (!['#text','BR','IMG'].includes(node.nodeName)) {
                    // 取出属性
                    let nodeAttrs = Array.from(editor.dom.getAttribs(node));
                    let attrs = [];
                    nodeAttrs.forEach(attr => {
                        attrs.push(`${attr.name}="${attr.value}"`);
                    })
                    attrs = _.uniq(attrs);
                    // 扫描内容，定位
                    let textContent = node.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
                    let index = containerText.indexOf(textContent);
                    // 子节点
                    let childEles = Array.from(node.childNodes);
                    let childEleHtml = [];
                    childEles.forEach(c => {
                        if (!['#text','BR','IMG'].includes(c.nodeName)) {
                            childEleHtml.push(c.outerHTML);
                        }
                    })
                    if (!!~index) {
                        tags.push({
                            tagName: node.nodeName.toLowerCase(),
                            footNodeId: $global.hasClass(node, 'a-note') ? node.dataset.id : undefined,
                            attrs: attrs.join(" "),
                            startIndex: index,
                            endIndex: index + textContent.length,
                            childEles: childEles.join(""),
                        });
                    }
                }
            });
        }
        return tags;
    },

    /**
     * @description 段落按行切割；分析每个字符的位置
     * @param {node} Element
     * @param {posTop} Int
     */
    splitParagraphStr(node = null, posTop = 0) {
        if (node.nodeName === '#text') {
            return node;
        }
        const editor = this.getActiveEditor();
        const block = editor.dom.getParent(node, '.info-block');
        const nodeStr = node.textContent.trim();

        if (nodeStr !== '') {
            // 这里须要记录DOM中的某些标签，以便在还原内容时再重新打上标签属性
            const tagList = this.cacheDomTags(node, editor);
            const htmlContent = node.innerHTML || '';
            const textStr = nodeStr.replace(/[\u200B-\u200D\uFEFF]/g, ''); // 去除空格和占位符
            const textSpans = textStr.split("");
            const ems = [];
            for (let i = 0; i < textSpans.length; i++) {
                ems.push(`<em>${textSpans[i]}</em>`);
            }
            node.innerHTML = ems.join("");
            const emNodes = node.querySelectorAll('em');

            let splitIndex = undefined;
            for (let i = 0; i < emNodes.length; i++) {
                let em = emNodes[i];
                let offsetTop = editor.dom.getPos(em).y - editor.dom.getPos(block).y;
                let style = window.getComputedStyle(em);
                if (offsetTop + parseInt(style.lineHeight) > posTop) {
                    splitIndex = i;
                    break;
                }
            }
            // debugger
            if (splitIndex !== undefined) {
                // 保留部分内容
                let prevStr = this.matchTagByString(textStr.substring(0, splitIndex), tagList, 0);
                node.innerHTML = prevStr;
                // 跨页内容
                let nextStr = this.matchTagByString(textStr.substring(splitIndex, textSpans.length), tagList, splitIndex);
                return editor.dom.create('p', { class:'split' }, nextStr);
            } else {
                node.innerHTML = htmlContent;
            }
        }

        return node;
    },
    matchTagByString(innerText='', tagList =[], splitIndex=0) {
        var htmlContent = [];
        var endTag;
        if (splitIndex && !_.isEmpty(tagList)) {
            let ftag = _.find(tagList, tag => {
                return tag.startIndex < splitIndex && tag.endIndex > splitIndex;
            });
            if (ftag) {
                htmlContent.push(`<${ftag.tagName} ${ftag.attrs}>`);
            }
        }

        if (!_.isEmpty(tagList)) {
            innerText.split("").forEach((str, index) => {
                index += splitIndex;
                let tagData = _.find(tagList, { startIndex:index });
                if (tagData && tagData.startIndex === index) {
                    endTag = tagData;
                    htmlContent.push(`<${tagData.tagName} ${tagData.attrs}>`);
                }
                // 标签关门
                tagData = _.find(tagList, { endIndex:index });
                if (tagData) {
                    htmlContent.push(`</${tagData.tagName}>`)
                }
                // 字符串PUSH
                htmlContent.push(str);
            });
            if (endTag && endTag.endIndex >= innerText.length && !splitIndex) {
                htmlContent.push(`</${endTag.tagName}>`);
            }
        }

        return !_.isEmpty(htmlContent) ? htmlContent.join("") : innerText;
    },

    /**
     * 拆分文本内容
     * @param {Object} node
     * @param {Object} infoBlock
     */
    splitContent(node, infoBlock) {
        var editor = this.getActiveEditor();
        // step1.将每个字符拆开，形成每个单元元素
        var textStr = node.innerText.trim().replace(/[\u200B-\u200D\uFEFF]/g, ''); // 去除空格和占位符
        var textSpans = textStr.split("");
        // let st = 1;
        let ems = [];
        for (let i = 0; i < textSpans.length; i++) {
            ems.push(`<em>${textSpans[i]}</em>`);
        }
        node.innerHTML = ems.join("");
        // step2.计算实际溢出的第一个元素，并设定下标定位
        let lineHeight = parseFloat(window.getComputedStyle(node).lineHeight);
        let containerHeight = editor.dom.getPos(infoBlock, editor.getBody()).y + infoBlock.offsetHeight - parseInt(window.getComputedStyle(infoBlock).paddingBottom);
        let emNodes = node.querySelectorAll('em');
        let splitIndex = 0;
        for (let i = 0; i < emNodes.length; i++) {
            let em = emNodes[i];
            let pos = editor.dom.getPos(em, editor.getBody()).y + lineHeight; // em.offsetHeight;
            if (pos > containerHeight) {
                splitIndex = i;
                break;
            }
        }
        // 将拆分的字符串输出
        const arrs = { still: [], append: [] };
        for (let i = 0; i < textSpans.length; i++) {
            if (i < splitIndex) {
                arrs.still.push(textSpans[i]);
            } else {
                arrs.append.push(textSpans[i]);
            }
        }
        return arrs;
    },

    /**
     * =====================================================
     * 条款层级项处理
     * =====================================================
     */
    /**
     * @description 条款层级项置入新页面
     * @param {element} currEle
     * @param {element} nextBlock
     */
    appendLevel(currEle = null, nextBlock = null) {
        var editor = this.getActiveEditor();
        let index = currEle.dataset.index;
        let nextOl = nextBlock.querySelector(`[data-index="${index}"]`);
        if (nextOl) {
            $global.prependChild(currEle.firstChild, nextOl);
            editor.dom.removeClass(nextOl, 'hide-list');
            currEle.remove();
        } else {
            $global.prependChild(currEle, nextBlock);
        }
    },

    /**
     * =====================================================
     * 段落节点处理
     * 1.将内容分片，取出保留部分和插入部分
     * 2.节点是否有延续，如无则新建CLONE对象
     * =====================================================
     */
    /**
     * @description 将段落中越限的文字插入到下个页面中
     * @param {element} lastNode
     * @param {element} nextBlock
     */
    appendParagraph(lastNode = null, nextBlock = null) {
        var editor = this.getActiveEditor();
        var nextParagraph = nextBlock.querySelector(`p[data-clone="${lastNode.dataset.id}"]`);

        var textContent = this.splitContent(lastNode, this.infoBlock);
        var olList = editor.dom.getParent(lastNode, '.ol-list');
        var newEle = null,
            newUl = null;
        var parentNode = lastNode.parentNode;
        var stillText = textContent.still.join("");
        var prependText = textContent.append.join("");
        if (nextParagraph) {
            if (stillText !== '') {
                lastNode.innerText = stillText;
            } else {
                let lastNodeStyle = lastNode.getAttribute('style');
                if (lastNodeStyle) {
                    nextParagraph.setAttribute('style', lastNodeStyle);
                }
                lastNode.remove();
            }
            nextParagraph.prepend(prependText);
        } else {
            lastNode.innerText = stillText;
            nextParagraph = editor.dom.create('p', {}, prependText !== '' ? prependText : '<br/>');
            if (stillText !== '' && prependText !== '') {
                var pid = $global.guid();
                lastNode.dataset.id = pid;
                nextParagraph.dataset.clone = pid;
            }
            if (editor.dom.hasClass(parentNode, 'bullet')) {
                var sameBullet = nextBlock.querySelector(`.bullet[data-id="${parentNode.dataset.id}"]`);
                if (sameBullet) {
                    if (editor.dom.hasClass(sameBullet, 'hide-list')) {
                        $global.prependChild(nextParagraph, sameBullet);
                        if (stillText === '') {
                            lastNode.remove();
                        }
                        this.moveSelectionToElement(nextParagraph);
                        return;
                    } else {
                        sameBullet.removeAttribute('data-cross');
                    }
                }
                newUl = parentNode.cloneNode();
                newUl.dataset.cross = true;
                newUl.appendChild(nextParagraph);
                editor.dom.addClass(newUl, 'hide-list');
            }
            if (olList) {
                var sameOl = nextBlock.querySelector(`.ol-list[data-index="${olList.dataset.index}"].hide-list`);
                if (sameOl) {
                    $global.prependChild(newUl ? newUl : nextParagraph, sameOl);
                    return;
                } else {
                    sameOl = olList.cloneNode();
                    editor.dom.addClass(sameOl, 'hide-list');
                    sameOl.appendChild(newUl ? newUl : nextParagraph);
                    newEle = sameOl;
                }
            } else {
                newEle = newUl ? newUl : nextParagraph;
            }
            $global.prependChild(newEle, nextBlock);
        }
    },

    /**
     * @description 将页面最后的段落节点做分页处理
     * @param {element} lastNode
     */
    setParagraphBolck(lastNode = null) {
        var editor = this.getActiveEditor();
        var newParagraph = null, textContent = null, pid = lastNode.dataset.id || $global.guid();
        var nextNodes = $global.getNextAllNodes(lastNode);
        if (lastNode.textContent.trim() !== '') {
            lastNode.dataset.id = pid;
            textContent = this.splitContent(lastNode, this.infoBlock);
            if (textContent.append.length) {
                lastNode.dataset.id = pid;
                lastNode.innerText = textContent.still.join("");
                newParagraph = editor.dom.create('p', { 'data-clone': pid }, textContent.append.join(""));
            } else {
                newParagraph = lastNode;
                newParagraph.innerText = textContent.still.join("");
            }
        } else {
            newParagraph = lastNode;
        }

        const olList = editor.dom.getParent(lastNode, '.ol-list');
        const bulletUl = editor.dom.getParent(lastNode, '.bullet');

        var newOl, newUl;
        var nextBuletNodes = [];
        var nextOlNodes = [];
        if (bulletUl) {
            nextBuletNodes = $global.getNextAllNodes(bulletUl);
            newUl = bulletUl.cloneNode();
            editor.dom.addClass(newUl, 'hide-list');
            newUl.dataset.reset = newUl.dataset.type;
            newUl.dataset.cross = true;
            editor.dom.setStyle(newUl, 'counter-reset', `${newUl.dataset.type} ${newUl.dataset.start}`);
            newUl.appendChild(newParagraph);
            if (!olList) {
                // return newUl;
                return {
                    self: newParagraph,
                    lastNode: newUl,
                    nextNodes,
                    nextBuletNodes
                }
            }
        }
        if (olList) {
            nextOlNodes = $global.getNextAllNodes(olList);
            newOl = olList.cloneNode();
            editor.dom.addClass(newOl, 'hide-list');
            if (newUl) {
                newOl.appendChild(newUl);
            } else {
                newOl.appendChild(newParagraph);
            }
            return {
                self: newParagraph,
                lastNode: newOl,
                nextNodes,
                nextBuletNodes,
                nextOlNodes
            }
        }
        return {
            self: newParagraph,
            lastNode: newParagraph,
            nextNodes
        }
    },

    /**
     * =====================================================
     * 处理表格元素的置入
     * =====================================================
     */
    /**
     * @description 整个表格置入新的页面
     */
    setFullTableBolck(lastNode) {
        var editor = this.getActiveEditor();
        var nextNodes = $global.getNextAllNodes(lastNode);
        var bulletUl = editor.dom.getParent(lastNode, '.bullet');
        var olList = editor.dom.getParent(lastNode, '.ol-list');

        var newBullet, newList;
        var nextBuletNodes = [];
        if (bulletUl) {
            nextBuletNodes = $global.getNextAllNodes(bulletUl);
            newBullet = bulletUl.cloneNode();
            editor.dom.addClass(newBullet, 'hide-list');
            newBullet.dataset.reset = newBullet.dataset.type;
            newBullet.dataset.cross = true;
            editor.dom.setStyle(newBullet, 'counter-reset', `${newBullet.dataset.type} ${newBullet.dataset.start}`);
            newBullet.appendChild(lastNode);
            if (!olList) {
                return {
                    self: lastNode,
                    lastNode: newBullet,
                    nextNodes,
                    nextBuletNodes
                }
            }
        }

        if (olList) {
            var nextOlNodes = $global.getNextAllNodes(olList);
            newList = olList.cloneNode();
            editor.dom.addClass(newList, 'hide-list');
            if (newBullet) {
                newList.appendChild(newBullet);
            } else {
                newList.appendChild(lastNode);
            }
            return {
                self: lastNode,
                lastNode: newList,
                nextBuletNodes,
                nextOlNodes
            };
        }
        return {
            self: lastNode,
            lastNode: lastNode,
            nextNodes
        };
    },

    /**
     * @description 创建新表格（有续表）置入新的页面
     * @param {element} lastNode
     */
    setTableBolck(lastNode) {
        var editor = this.getActiveEditor();
        if (lastNode.nodeName !== 'TR') {
            lastNode = editorr.dom.getParent(lastNode, 'TR');
        }
        var bulletUl = editor.dom.getParent(lastNode, '.bullet');
        var olList = editor.dom.getParent(lastNode, '.ol-list');
        // var newElement = null;
        // var titleId; // 表标题ID
        var stable = teditor.dom.getParent(lastNode, 'table');
        var nextNodes = $global.getNextAllNodes(stable.parentNode);

        const tableId = stable.dataset.id || $global.guid();
        stable.dataset.id = tableId;
        // 设定分割的标签，以区分续表的TR
        lastNode.dataset.trans = 1;

        const ntable = stable.cloneNode(true);
        ntable.dataset.clone = tableId;
        ntable.removeAttribute('data-id');

        // 处理原始的表格
        const stableHideTrs = stable.querySelectorAll(':scope>tbody>tr');
        var isRmove = false;
        stableHideTrs.forEach(tr => {
            if (tr.dataset && tr.dataset.trans) {
                isRmove = true;
            }
            if (isRmove) {
                tr.remove();
            }
        });
        // 处理新的表格
        const ntableHideTrs = ntable.querySelectorAll(':scope>tbody>tr');
        isRmove = false;
        ntableHideTrs.forEach(tr => {
            if (tr.dataset && tr.dataset.trans) {
                tr.removeAttribute('data-trans');
                isRmove = true;
            }
            if (!isRmove) {
                tr.remove();
            }
        });
        // 处理表标题
        const tableTitle = ntable.querySelector('.table-title');
        if (tableTitle) {
            editor.dom.addClass(tableTitle, 'txu');
        }
        // 表格外层容器
        var parentContainer = stable.parentNode;

        var tableContainer = parentContainer.cloneNode();
        tableContainer.dataset.clone = parentContainer.dataset.id;
        tableContainer.appendChild(ntable);

        var nextAllNodes = $global.getNextAllNodes(parentContainer);

        // 是否嵌套在层级项或列项中
        var newBullet, newList;
        var nextBuletNodes = [];
        if (bulletUl) {
            nextBuletNodes = $global.getNextAllNodes(bulletUl);
            newBullet = bulletUl.cloneNode();
            editor.dom.addClass(newBullet, 'hide-list');
            newBullet.dataset.reset = newBullet.dataset.type;
            newBullet.dataset.cross = true;
            editor.dom.setStyle(newBullet, 'counter-reset', `${newBullet.dataset.type} ${newBullet.dataset.start}`);
            newBullet.appendChild(tableContainer);

            if (nextAllNodes && nextAllNodes.length) {
                nextAllNodes.forEach(ele => {
                    newBullet.appendChild(ele);
                })
            }

            if (!olList) {
                return {
                    self: tableContainer,
                    lastNode: newBullet,
                    nextNodes,
                    nextBuletNodes
                }
            }
        }

        if (olList) {
            var nextOlNodes = $global.getNextAllNodes(olList);
            newList = olList.cloneNode();
            editor.dom.addClass(newList, 'hide-list');
            if (newBullet) {
                newList.appendChild(newBullet);
            } else {
                newList.appendChild(tableContainer);
                if (nextAllNodes && nextAllNodes.length) {
                    nextAllNodes.forEach(ele => {
                        newList.appendChild(ele);
                    })
                }
            }

            return {
                self: tableContainer,
                lastNode: newList,
                nextBuletNodes,
                nextOlNodes
            };
        }
        return {
            self: tableContainer,
            lastNode: tableContainer,
            nextNodes
        };
    },

    /**
     * @description 将TD元素插入表格内
     * @param {element} td
     * @param {element} infoBlock
     */
    appendTable(td = null, nextBlock = null) {
        var editor = this.getActiveEditor();
        var tr = td.parentNode;
        var tbody = editor.dom.getParent(td, 'tbody');
        var table = editorr.dom.getParent(td, 'table');
        var cloneTable = nextBlock.querySelector(`table[data-clone="${table.dataset.id}"]`);
        var cloneTbody;
        // 如果有则直接插入TR
        if (cloneTable) {
            cloneTbody = cloneTable.querySelector('tbody');
            // 所有下级的TR节点,再插入CLONE的表格内
            var trs = $global.getNextAllNodes(tr);
            trs.push(tr);
            trs.forEach(ele => {
                cloneTbody.insertBefore(ele, cloneTbody.firstChild);
            })
            editor.dom.removeClass(cloneTable, 'hide-list');
            // 如果源表Tbody内没有了元素，则删除源表
            if (!tbody.childNodes.length) {
                table.parentNode.remove();
                cloneTable.dataset.id = cloneTable.dataset.clone;
                cloneTable.removeAttribute('data-clone');
                // 处理表标题
                var caption = cloneTable.querySelector('caption.txu');
                if (caption) {
                    editor.dom.removeClass(caption, 'txu');
                }
            }
        } else {
            // 包含在层级项或列项中
            var newTableContainer = this.setTableBolck(tr);
            $global.prependChild(newTableContainer.lastNode, nextBlock);
        }
    },

    /**
     * =====================================================
     * 处理层级项元素的置入
     * =====================================================
     */
    /**
     * @description 层级元素置入新的页面
     * @param {element} currLi
     */
    setListBolck(olLi = null) {
        var nextNodes = $global.getNextAllNodes(olLi);
        return {
            self: olLi,
            lastNode: olLi,
            nextNodes
        };
    },

    /**
     * =====================================================
     * 处理列项元素的置入
     * =====================================================
     */
    /**
     * @description 列项元素置入新的页面
     * @param {element} currLi
     */
    setBulletBolck(currLi = null) {

    },

    /**
     * @description 列项元素置入下一个页面
     * @param {element} currLi
     * @param {element} nextBlock
     */
    appendBullet(currLi = null, nextBlock = null) {
        var editor = this.getActiveEditor();
        // 下一个页面是否存在相同列项
        var sameNode = nextBlock.querySelector(`.bullet[data-id="${currLi.dataset.id}"]`); // .hide-list
        if (sameNode) {
            // 相同列项如为隐藏式
            if (editor.dom.hasClass(sameNode, 'hide-list')) {
                sameNode.dataset.start = currLi.dataset.start;
                sameNode.dataset.id = currLi.dataset.id;
                sameNode.dataset.type = currLi.dataset.type;
                editor.dom.setStyle(sameNode, 'counter-reset', `${currLi.dataset.type} ${currLi.dataset.start}`);
                sameNode.prepend(currLi.innerText);
                editor.dom.removeClass(sameNode, 'hide-list');
                currLi.remove();
            } else {
                sameNode.removeAttribute('data-cross');
                currLi.dataset.cross = true;
                $global.prependChild(currLi, sameNode.parentNode);
            }
            // 如没有相同列项则直接置入下一页
        } else {
            // 是否包含在层级项中
            var olList = editor.dom.getParent(currLi, '.ol-list');
            if (olList) {
                var sameOl = nextBlock.querySelector(`.ol-list[data-index="${olList.dataset.index}"]`);
                if (sameOl) {
                    $global.prependChild(currLi, sameOl);
                } else {
                    currLi.dataset.cross = true;
                    var cloneOl = olList.cloneNode();
                    editor.dom.addClass(cloneOl, 'hide-list');
                    cloneOl.appendChild(currLi);
                    $global.prependChild(cloneOl, nextBlock);
                }
            }
        }
    },

    /**
     * =====================================================
     * 处理图片元素的置入
     * =====================================================
     */
    /**
     * @description 图片置入新页面
     * @param {element} lastNode
     */
    setImgBolck(lastNode) {
        var editor = this.getActiveEditor();
        if (editor.dom.hasClass(lastNode.parentNode, 'image') && lastNode.parentNode.nodeName === 'FIGURE') {
            lastNode = lastNode.parentNode;
        }
        // 获取当前节点后所有的兄弟节点
        var nextNodes = $global.getNextAllNodes(lastNode);

        var newElement = lastNode;
        // 是否包含在列项中
        var ulList = lastNode.parentNode;
        // 是否嵌套在层级项中
        var olList = editor.dom.getParent(lastNode, '.ol-list');
        var newUl, newOl;
        var nextBuletNodes = [],
            nextOlNodes = [];
        if (ulList && editor.dom.hasClass(ulList, 'bullet')) {
            nextBuletNodes = $global.getNextAllNodes(ulList);
            newUl = ulList.cloneNode();
            newUl.appendChild(lastNode);
            newUl.dataset.cross = true;
            editor.dom.addClass(newUl, 'hide-list');
            newElement = newUl;
        }
        if (olList) {
            nextOlNodes = $global.getNextAllNodes(olList);
            newOl = olList.cloneNode();
            if (newUl) {
                newOl.appendChild(newUl);
            } else {
                newOl.appendChild(lastNode);
            }
            editor.dom.addClass(newOl, 'hide-list');
            newElement = newOl;
        }
        return {
            self: newElement,
            lastNode: newElement,
            nextNodes,
            nextBuletNodes,
            nextOlNodes
        }
        // return newElement;
    },

    /**
     * @description 图片置入下一个页面
     * @param {element} lastNode
     */
    appendImg(lastNode, nextBlock) {
        var editor = this.getActiveEditor();
        if (editor.dom.hasClass(lastNode.parentNode, 'image') && lastNode.parentNode.nodeName === 'FIGURE') {
            lastNode = lastNode.parentNode;
        }
        // 是否嵌套在列项中
        var bulletOl = editor.dom.getParent(lastNode, '.bullet');
        // 是否嵌套在层级项中，则插入到下一页中的CLONE层级项中
        var olList = editor.dom.getParent(lastNode, '.ol-list');

        if (bulletOl) {
            var nextBullet = nextBlock.querySelector(`.bullet[data-id="${bulletOl.dataset.id}"]`);
            if (nextBullet) {
                $global.prependChild(lastNode, nextBullet);
            } else {
                nextBullet = bulletOl.cloneNode();
                editor.dom.addClass(nextBullet, 'hide-list');
                nextBullet.appendChild(lastNode);
                $global.prependChild(nextBullet, nextBlock);
            }
        } else if (olList) {
            var nextOlList = nextBlock.querySelector(`.ol-list[data-index="${olList.dataset.index}"]`);
            if (nextOlList) {
                $global.prependChild(lastNode, nextOlList);
            } else {
                nextOlList = olList.cloneNode();
                editor.dom.addClass(nextOlList, 'hide-list');
                nextOlList.appendChild(lastNode);
                $global.prependChild(nextOlList, nextBlock);
            }
        } else {
            $global.prependChild(lastNode, nextBlock);
        }
    },

}
