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
import domUtil from "./domUtil";
import outlineUtil from "./outlineUtil";

export default {
    loaded: false, // 是否正在加载页面
    editor: null, // 编辑器实例
    vm: {}, // VUE实例
    mergePaing: false, // 正在合并文档
    cateing: false, // 正在处理目次
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
    init(editor, vm) {
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
        var htmlContent = [],
            dataList = [];
        var quoteStandards = Array.from(pageContainer.querySelectorAll('a.quote[data-stdno]'));
        if (!quoteStandards.length) {
            editor.windowManager.alert('当前文档中没有可汇总的引用！');
            return null;
        }
        quoteStandards.forEach(ele => {
            let no = ele.dataset.stdno ? ele.dataset.stdno.replace(/[^\d]/g, '') : '';
            no = no ? parseInt(no) : 999999999999;
            let htmlStr = (ele.innerHTML || '') + "&nbsp;" + ele.dataset.title;
            dataList.push({
                index: ele.dataset.index ? parseInt(ele.dataset.index, 10) : 10000,
                stdKind: ele.dataset.stdkind,
                stdid: ele.dataset.stdid,
                stdno: ele.dataset.stdno,
                text: ele.getAttribute('title'),
                no,
                html: `<span class="tag quote-collection" contenteditable="false">${htmlStr}</span>&#8203`
            });
        });
        dataList = _.orderBy(dataList, ['index', 'no']);
        dataList.forEach(item => {
            let node = editor.dom.create('p', { style: 'text-indent: 2em;' }, item.html);
            node.className = 'quote-collection';
            node.dataset.stdkind = item.stdKind;
            node.dataset.stdno = item.stdno;
            node.dataset.title = item.text;
            node.dataset.stdid = item.stdid;
            node.dataset.tag = 'tag';
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
            if (currNode.nodeName !== 'P') {
                editor.windowManager.alert('请在段落中插入引用汇总！');
                return false;
            }
            htmlNodes.forEach(ele => {
                $global.insertAfter(ele, currNode);
                if (currNode.textContent.replace(/\s/g, '') === '') {
                    currNode.remove();
                }
                currNode = ele;
            });
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
        /*var pageContainer = editor.getBody().querySelector('.page-container');
        if (!pageContainer) {
            return false;
        }
        pageContainer.style.transform = `scale(${val})`;*/
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
     * @description 启用或禁用按钮， 须在协同并分配模式下
     */
    enabledButtons() {
        if (this.vm && this.vm.editorSetting.author && this.vm.editorSetting.author.lockedAll && this.vm.editorSetting.author.assignOutline) {
            var editor = this.getActiveEditor();
            var editorContainer = document.getElementById(`tinymce-editor-container-${this.vm.editorId}`);
            var currNode = editor.selection.getNode();
            var parentBlock = editor.dom.getParent(currNode, '.info-block');
            var disabled = !parentBlock ? true : (editor.dom.hasClass(parentBlock, 'fixed') || parentBlock.dataset.enlock !== undefined || !parentBlock.isContentEditable);
            if (disabled) {
                // 元素为层级项，且为被锁定正在编辑的
                let olEle = editor.dom.getParent(currNode, '.ol-list') || editor.dom.getParent(currNode, '.appendix-list');
                if (olEle) {
                    disabled = editor.dom.hasClass(olEle, 'disabled');
                }
            }
            if (editorContainer) {
                var toolButtons = Array.from(editorContainer.querySelectorAll('.tox-toolbar-overlord button,.tox-toolbar-overlord div[role="button"]'));
                // debugger
                toolButtons.forEach(btn => {
                    if (disabled && !['关闭编辑器', '保存', '导出', '全屏'].includes(btn.title)) {
                        btn.setAttribute('disabled', 'disabled');
                        btn.setAttribute('aria-disabled', 'true');
                    } else {
                        btn.removeAttribute('disabled');
                        btn.setAttribute('aria-disabled', 'false');
                    }
                    // 不需要目次页面元素的设定则删除该按钮
                    if (btn.title === '目次' && this.vm.editorSetting.notCatalogue) {
                        btn.remove();
                    }
                })
            }
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
        var lockedOutline = this.vm.lockedOutline;
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
            /* if (data && data.lockedOutlineId && data.lockedOutlineId === blockOutlineId) {
                debugger
            } */
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
            let outlineId = node.dataset.outlineid;
            let matchOutline = ancestors.includes(data.lockedOutlineId);
            /* if (!_.isEmpty(data.assignOutlineId)) {
                matchOutline = data.lockedOutlineId === outlineId; // (data.lockedOutlineId === outlineId || !node.dataset.owner) && matchOutline;
            } */
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
            var bp = this.setPageBreak({ element: currBlock }, currBlock);
            // console.log('resetChapterContent====>', bp)
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
    appendFinishedLine() {
        var editor = this.getActiveEditor();
        if (!editor || !editor.getBody()) {
            return false;
        }
        var pageContainer = editor.getBody().querySelector('.page-container');
        if (!pageContainer) {
            return false;
        }
        // 先去除已有的终结线
        var finishedEles = pageContainer.querySelectorAll('div.finished');
        if (finishedEles.length) {
            finishedEles.forEach(ele => {
                ele.remove();
            })
        }
        var lastBlock = pageContainer.lastChild;
        if (this.vm.editorSetting && this.vm.editorSetting.isStandard) {
            var endLineWeight = this.vm.editorSetting.endLineWeigth || '1.0pt';
            var htmlContent = lastBlock.innerHTML;
            htmlContent += `<div class="finished" contenteditable="false"><hr width="33%" style="border-width:${endLineWeight} 0 0 0">​</div>`;
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
                let tagNodes = Array.from(block.querySelectorAll('[data-tag]:not([data-bind])'));
                tagNodes.forEach(tagNode => {
                    let outlineId = '',
                        ancestors = '';
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
                        textContent: tagNode.outerHTML
                    }
                    list.push(obj);
                });
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
            this.vm.pageData.stdKind = parseInt(pageContainer.dataset.stdkind);
        }
        var data = {
            docId: pageContainer.dataset.id || this.vm.pageData.docId || $global.guid(),
            outlineid: pageContainer.dataset.outlineid || this.vm.pageData.outlineid || $global.guid(),
            stdTitle: pageContainer.dataset.title,
            stdKind: this.vm.pageData.stdKind
        }
        var coverPage = pageContainer.querySelector('.cover');
        if (coverPage) {
            // ICS编号
            var icsNumberEle = coverPage.querySelector('.icsNumber');
            if (icsNumberEle && icsNumberEle.textContent !== icsNumberEle.dataset.name) {
                data.icsNumber = icsNumberEle.textContent;
            }
            // CCS编号
            var ccsNumberEle = coverPage.querySelector('.ccsNumber');
            if (ccsNumberEle && ccsNumberEle.textContent !== ccsNumberEle.dataset.name) {
                data.ccsNumber = ccsNumberEle.textContent;
            }
            // 备案号
            var recordEle = coverPage.querySelector('.recordNumber');
            if (recordEle && recordEle.textContent !== recordEle.dataset.name) {
                data.recordNumber = recordEle.textContent;
            }

            // 标准文档抬头
            data.stdTitle = '中华人民共和国国家标准';
            var stdTitleEle = coverPage.querySelector('h1.title');
            if (stdTitleEle && this.vm.pageData.stdKind !== 1100) {
                data.stdTitle = stdTitleEle.textContent;
            }

            // 标准编号
            var stdNoEle = coverPage.querySelectorAll('.numbers>.tt>span');
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
                let stdNo = coverPage.querySelectorAll('.numbers>.tt').textContent;
                stdNo = stdNo.split(/\s/i);
                if (stdNo.length > 1) {
                    data.stdSign = stdNo[0].replace(/\s/g, '');
                    data.stdNo = stdNo[1].replace(/\s/g, '');
                }
            }

            // 标准替代号
            var origStdNoEle = coverPage.querySelector('.numbers .origStdNo');
            if (origStdNoEle && origStdNoEle.textContent !== origStdNoEle.dataset.name) {
                data.origStdNo = origStdNoEle.textContent;
            }
            // 标准名称
            var stdNameEle = coverPage.querySelector('.std-name');
            if (stdNameEle) {
                data.stdName = stdNameEle.innerText;
            }

            // 标准英文名称
            var stdNameEnEles = coverPage.querySelectorAll('.en-name');
            var stdNameEnStr = "";
            if (stdNameEnEles.length) {
                var enName = [];
                stdNameEnEles.forEach(n => {
                    let str = n.innerText;
                    enName.push(str);
                });
                data.stdNameEn = enName.join("\n");
            }

            // 一致性标识
            var consistentSignEle = coverPage.querySelector('.sign-name');
            if (consistentSignEle && consistentSignEle.textContent !== consistentSignEle.dataset.name) {
                data.consistentSign = consistentSignEle.textContent;
            }
            // 标准发布的版本号等
            var stdEditionEle = coverPage.querySelector('.std-edition');
            if (stdEditionEle && stdEditionEle.textContent !== stdEditionEle.dataset.name) {
                data.stdEdition = stdEditionEle.textContent;
            }

            // 标准发布日期
            var stdPublishDateEle = coverPage.querySelector('.stdPublishDate');
            if (stdPublishDateEle && stdPublishDateEle.textContent !== stdPublishDateEle.dataset.name) {
                data.stdPublishDate = stdPublishDateEle.textContent;
                if (!$global.isDate(data.stdPublishDate)) {
                    delete data.stdPublishDate;
                }
            }
            // 标准实施日期
            var stdPerformDateEle = coverPage.querySelector('.stdPerformDate');
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
        }
        // 获取页面的布局
        var layoutData = this.getPageLayout(pageContainer);

        data.jsonContent = JSON.stringify({
            pageType: (pageContainer.dataset.type && pageContainer.dataset.type !== 'undefined') ? pageContainer.dataset.type : 'singleSided',
            layoutData
        });
        return data;
    },

    /**
     * @description 获取页面的布局
     * @param {Element} pageContainer
     */
    getPageLayout(pageContainer = null) {
        // console.log('doc.pageData=>',this.vm.pageData);
        var sourceData = this.vm.pageData.jsonContent ? JSON.parse(this.vm.pageData.jsonContent) : {};
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
        var editor = this.getActiveEditor();
        var pageContainer = editor.getBody().querySelector('.page-container');
        var allPrevPage = [];
        if (prevNode) {
            allPrevPage = Array.from(pageContainer.querySelectorAll(`.info-block[data-outlineid="${prevNode.outlineId}"]`));
        } else {
            allPrevPage = Array.from(pageContainer.querySelectorAll('.info-block.cover, .info-block.catalogue'));
        }
        var prevPage = allPrevPage[allPrevPage.length - 1];

        var cls = 'info-block', olCls = 'ol-list';
        var htmlArr = [], pagenum = '1';
        var templateData;
        // console.log(this.vm.listTemplate, this.vm.pageData);
        var outlineData = _.find(outlineTypes, { type: currNode.outlineType });
        if (outlineData && this.vm.listTemplate) {
            templateData = _.find(this.vm.listTemplate, { tmplName: outlineData.value, tmplType: this.vm.pageData.stdKind });
        }

        // 非结构性章节
        if ([1, 2, 11, 12].includes(currNode.outlineType)) {
            pagenum = 'Ⅱ';
            if (templateData) {
                let section = document.createElement('div');
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
            // 附录章节
        } else if ([8, 9].includes(currNode.outlineType)) {
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
            htmlArr.push(
                `<div class="ol-list" data-bookmark="${currNode.outlineId}" data-outlineid="${currNode.outlineId}" data-parentid="${currNode.parentId}" data-outlinetype="${currNode.outlineType}" data-index="${currNode.outlineCatalog}" style="line-height:3;">${currNode.outlineTitle}</div>`
            )
            cls = 'info-block struct';
        }
        // 当前编辑器实例
        var editor = this.getActiveEditor();
        // 创建页面
        var newBlock = editor.dom.create('div', {
            'class': cls,
            'data-outlinetype': currNode.outlineType,
            'data-outlineid': currNode.outlineId,
            'data-parentid': currNode.parentId,
            'data-pagesize': 'A4',
            'data-no': prevPage.dataset.no,
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
        var editor = this.getActiveEditor();
        var pageContainer = editor.getBody().querySelector('.page-container');
        var outlineIdList = [];
        var letterIndex = 0,
            structIndex = 1;
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
            // pageBlock.dataset.outlinetype = item.outlineType;
            pageBlock.dataset.doctitle = docTitle;
            var headerTitle = pageBlock.querySelector('.header-title');
            if (headerTitle) {
                headerTitle.dataset.doctitle = docTitle;
                headerTitle.dataset.infonum = String(item.infoNum);
                var specs = headerTitle.querySelector('.specs');
                if (specs) {
                    specs.innerHTML = `（${docTitle}）`;
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
                    targetEle = targetEle.firstChild;
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
    resetPageNumber(flag = false) {
        var editor = this.getActiveEditor();
        if (!editor || !editor.getBody() || this.resetPageNumbering) {
            return false;
        }
        // 编辑器配置参数
        var cfg = editor.settings.doc_config;
        var doubleSided = cfg && cfg.page.layout && cfg.page.layout === 'doubleSided';
        var pageNodes = editor.getBody().querySelectorAll('.info-block[data-pagenum]:not(.cover):not(.empty)');
        var structIndex = 0,
            romaNumIndex = 0;
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
            var chapterName = undefined;
            var tableNode = editor.dom.getParent(node, 'table');
            if (tableNode) {
                var tableTitle = tableNode.querySelector('table-title');
                if (tableTitle) {
                    chapterName = '表 ' + tableTitle.dataset.number;
                }
            } else {
                var entryNode = editor.dom.getParent(node, '.ol-list') || editor.dom.getParent(node, '.appendix-list');
                if (entryNode) {
                    chapterName = entryNode.dataset.index;
                }
                if (entryNode.dataset.prev) {
                    chapterName = '附录 ' + entryNode.dataset.prev + '.' + entryNode.dataset.index;
                }
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

    /**
     * @description 生成目次
     * @param {Object} editor
     */
    async autoSetCatalogue(cataData = null) {
        // 如果设置了不须要目次页面的则中断执行
        if (this.vm.editorSetting.notCatalogue) {
            return false;
        }

        var editor = this.getActiveEditor();
        var body = editor ? editor.getBody() : null;
        if (!body || this.cateing || !this.loaded || this.mergePaing) { // 如果文档正在分析目次或正在合并中则中断
            return false;
        }

        this.cateing = true;
        if (cataData) {
            this.setCatalogueConfig(editor, cataData);
        } else {
            // 定义目次规则
            if (_.isEmpty(this.catalogueData)) {
                this.catalogueData = {};
                var catalogueData = _.find(this.vm.listTemplate, { tmplName: 'catalogue' });
                if (catalogueData && $global.isJSON(catalogueData.content)) {
                    catalogueData = JSON.parse(catalogueData.content);
                    for (let k in catalogueData) {
                        catalogueData[k].forEach(val => {
                            this.catalogueData[val] = true;
                        })
                    }
                }
                this.setCatalogueConfig(editor, this.catalogueData);
            }
        }

        // 文档的配置
        var cfg = editor.settings.doc_config;
        if (!cfg || cfg.setTemplate) { // setTemplate 模板设置模式
            this.cateing = false;
            return false;
        }

        var editorPageContainer = body.querySelector('.page-container');
        if (!editorPageContainer) {
            this.cateing = false;
            return false;
        }

        if (!cfg.catalogues || cfg.disabledCatalogue) {
            this.cateing = false;
            return false;
        }
        var catalogueRules = cfg.catalogues || {};

        var infoBlocks = Array.from(body.querySelectorAll('.info-block:not(.cover):not(.catalogue):not(.empty)'));
        var lists = [];

        const checkSamNode = (nodes, id) => {
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].dataset.mk === id) {
                    return true;
                }
            }
            return false;
        }

        // 遍历页面，按元素定义的bookmark列出所有目录，包含子项
        for (let i = 0; i < infoBlocks.length; i++) {
            let infoblock = infoBlocks[i];
            let bks = Array.from(infoblock.querySelectorAll('[data-bookmark]:not(.hide-list):not(.img-title):not(.table-title)'));
            for (let j = 0; j < bks.length; j++) {
                let node = bks[j];
                let levelCls = 'level0',
                    isSet = true;
                if (node.firstChild && (node.firstChild.nodeName === '#text' || node.firstChild.nodeName === 'SPAN' || $global.hasClass(node, 'header-title'))) {
                    let stitle = node.firstChild.nodeValue || node.firstChild.textContent;
                    let title = stitle.replace(/\s/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
                    let numLens = 1;
                    if ($global.hasClass(node.firstChild, 'appendix')) {
                        title += ' ' + node.firstChild.dataset.number;
                        if (node.dataset.doctitle) {
                            title += `（${node.dataset.doctitle}）&nbsp;`;
                        }
                        title += node.lastChild ? node.lastChild.textContent : '';
                    }
                    // console.log(j, title);
                    if (j === 0 && title.slice(-2) === '通知') {
                        node.dataset.title = title;
                        title = '通知';
                    }

                    let titleSpan = `<span>${title}</span>`;
                    // 标题匹配规则
                    if (infoblock.dataset && infoblock.dataset.outlinetype) {
                        switch (infoblock.dataset.outlinetype) {
                            case '1': // 前言
                                isSet = catalogueRules.type1 !== undefined;
                                break;
                            case '2': // 引言
                                isSet = catalogueRules.type2 !== undefined;
                                break;
                            case '3': // 章标题
                                isSet = catalogueRules.type3 !== undefined;
                                break;
                            case '8': // 附录
                                isSet = catalogueRules.type4 !== undefined;
                                break;
                            case '11': // 参考文献
                                isSet = catalogueRules.type5 !== undefined;
                                break;
                            case '12': // 索引
                                isSet = catalogueRules.type6 !== undefined;
                                break;
                        }
                    }

                    // 章节|附录条款
                    if ($global.hasClass(node, 'ol-list') || $global.hasClass(node, 'appendix-list')) {
                        let numStr = node.dataset.index;
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
                        let liEle = editor.dom.create('div', { class: 'fld-char ' + levelCls, 'data-mk': node.dataset.bookmark }, `${titleSpan}<span class="line"></span><span class="num">${infoblock.dataset.pagenum}</span>`);
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
        var allCatalogue = Array.from(editorPageContainer.querySelectorAll(`.info-block.catalogue`));
        allCatalogue.forEach((ele, index) => {
            if (index > 0) {
                ele.remove();
            }
        });

        var cataContainer = allCatalogue[0] || editorPageContainer.querySelector('.info-block.catalogue');
        if (!cataContainer) {
            let titleStr = '目&nbsp;&nbsp;&nbsp;&nbsp;次';
            if (this.vm.editorSetting.catalogueTitle) {
                titleStr = this.vm.editorSetting.catalogueTitle.split("").join("&nbsp;&nbsp;&nbsp;&nbsp;");
            }
            let headerTitle = `<div class="header-title" contenteditable="false">${titleStr}</div>`;
            cataContainer = editor.dom.create('div', {
                'class': `info-block catalogue fixed`, // disabled
                'data-pagetype': editorPageContainer.dataset.pagetype || "",
                'data-no': editorPageContainer.dataset.no || "",
                'data-pagenum': numberChar.roma[0]
            }, `${headerTitle}<div class="catalogue-list"></div>`);
            let coverPage = editorPageContainer.querySelector('.info-block.cover');
            if (coverPage) {
                editor.dom.insertAfter(cataContainer, coverPage);
            } else {
                $global.prependChild(cataContainer, editorPageContainer);
            }
        }

        var catalogueListContainer = cataContainer.querySelector('.catalogue-list');
        if (catalogueListContainer) {
            catalogueListContainer.innerHTML = "";
            lists.forEach((ele, idx) => {
                ele.dataset.idx = idx;
                catalogueListContainer.appendChild(ele);
            })
            var outSideNode = await this.getOutSideNode(cataContainer);
            if (outSideNode && outSideNode.lastNode) {
                this.appendNextBlock(cataContainer, outSideNode);
            }
        }

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
            var romaIndex = 0, structIndex = 0, notChapterIndex = 0;

            var blocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.cover):not(.empty)'));
            // console.log('updatePageComposition blocks===>', blocks);
            blocks.forEach(block => {
                $global.removeClass(block, 'left');
                let pageNum = block.dataset.pagenum;
                // debugger
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
            this.mergePaing = true;
            if (_.isEmpty(data) && this.vm.editorSetting.mergeDoc) {
                this.vm.loadingTimes = 20000;
                this.vm.onLoading('正在处理文档章节的合并，需花费较长时间，请等候完成...');
            }
            var res;
            // 处理章节页面
            var blocks = Array.from(pageContainer.querySelectorAll('.info-block.struct'));
            // console.log('当前合并的结构章节页面元素=>', blocks);
            if (blocks && blocks.length) {
                res = await this.mergeHtmlContent(pageContainer, blocks);
            }
            // 处理附录页面
            blocks = Array.from(pageContainer.querySelectorAll('.info-block.appendix'));
            // console.log('当前合并的结构附录页面元素=>', blocks);
            if (res && blocks && blocks.length) {
                res = await this.mergeHtmlContent(pageContainer, blocks, true);
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
                    // 重置页码
                    this.resetPageNumber();
                    // 合并文档后最后一页须加上终结线
                    this.appendFinishedLine();
                    // 重置目次
                    this.autoSetCatalogue();
                    // 列项的序号须重更新
                    this.vm.loading && this.vm.loading.close();
                    this.vm.loading = null;
                    this.vm.loadingTimes = 30000;
                    resolve(true);
                }, 5000);
            })
        } else {
            console.error('文档总页面未获取到！')
        }
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

        var blocks = Array.from(container.querySelectorAll('.info-block:not(.fixed):not(.disabled)'));
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
            bulletUtil.resetBulletNumberByParent(editor, block);
        })
    },

    /**
     * @description 移除空白页面
     * @param {Element} pageContainer
     */
    clearEmptyPage(pageContainer = null) {
        var blocks = Array.from(pageContainer.querySelectorAll('.info-block.struct,.info-block.appendix'));
        Array.from(blocks).forEach(block => {
            if (!$global.hasClass(block, 'empty')) {
                var nodes = Array.from(block.childNodes);
                if (!nodes.length) { //  || $global.hasClass(block, 'empty')保留空白页
                    block.remove();
                } else {
                    let empty = true;
                    for (let i = 0; i < nodes.length; i++) {
                        // 避免合并页面后出现相同的章节条款
                        if (!$global.hasClass(nodes[i], 'hide-list') || nodes[i].textContent.replace(/\s/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '') !== '') {
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
                            let nodeImgs = Array.from(ele.querySelectorAll('img'));
                            let emptyNode = ele.textContent.replace(/\s/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '') === "" && nodeImgs.length === 0;
                            if (emptyNode) {
                                ele.remove();
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
        if (block) {
            const outlineList = this.vm.outlineData ? this.vm.outlineData[0]['children'] : [];
            let outlineItem = _.find(outlineList, { outlineId: block.dataset.outlineid });
            if (outlineItem) {
                return outlineItem.outlineTitle;
            } else {
                return block.dataset.title || '无页面名称';
            }
        }
        return '无页面名称';
    },

    /**
     * @description 合并下页
     */
    mergeNextPage(currBlock = null) {
        /* if (!$global.hasClass(currBlock, 'struct') && this.vm.editorSetting.isStandard) {
            console.warn('当前页面[' + this.getBlockTitle(currBlock) + ']为独立性章节，不可操作合并！');
            return false;
        } */
        var editor = this.getActiveEditor();
        var pageContainer = editor.dom.getParent(currBlock, '.page-container');
        var spaceData = $global.calcBLockSpaceHeight(currBlock);
        // 页面又足够的空间，则将下页的内容提取上来
        var spaceHeight = spaceData.blockHeight - spaceData.allHeight;
        var nextBlock = currBlock.nextElementSibling;
        if (nextBlock) {
            // 如果下页中包含了条文脚注则直接中断合并处理
            /* var footNotes = nextBlock.querySelectorAll('.footnote');
            if (footNotes.length) {
                return false;
            } */

            var isStruct = $global.hasClass(currBlock, 'struct');
            var isAppendix = $global.hasClass(currBlock, 'appendix');

            var isSamPage = true;
            var blockStyle = window.getComputedStyle(currBlock);
            var nextBlockStyle = window.getComputedStyle(nextBlock);
            var nextBlockAppendix = $global.hasClass(nextBlock, 'appendix');

            // 判断页面的高宽和章节类型是否一致
            // var currBlockSize = this.calcBLockSpaceWidth(currBlock);
            // var nextBlockSize = this.calcBLockSpaceWidth(nextBlock);
            var nextBlockStruct = $global.hasClass(currBlock, 'struct');

            isSamPage = parseInt(blockStyle.width) === parseInt(nextBlockStyle.width) && parseInt(blockStyle.height) === parseInt(nextBlockStyle.height);
            // isSamPage = currBlockSize.width === nextBlockSize.width && currBlockSize.height === nextBlockSize.height;
            // 如果下个页面是附录章节或章节类型不一致的 !isAppendix && nextBlockAppendix && currBlock.dataset.outlinetype !== nextBlock.dataset.outlinetype
            if (isSamPage && ((!isAppendix && nextBlockAppendix) || (isStruct && !nextBlockStruct)) ) {
                isSamPage = false;
            }
            /* if (isSamPage && !$global.hasClass(currBlock, 'appendix') && $global.hasClass(nextBlock, 'appendix') && currBlock.dataset.outlinetype !== nextBlock.dataset.outlinetype) {
                isSamPage = false;
            } */
            // 再次判断页面是否同属性
            console.info('当前页面[' + this.getBlockTitle(currBlock) + ']类型：' + currBlock.dataset.outlinetype + '；要合并页面[' + this.getBlockTitle(nextBlock) + ']类型：' + nextBlock.dataset.outlinetype);
            console.info('当前页面的高宽为：' + parseInt(blockStyle.height) + ',' + parseInt(blockStyle.width), '要合并页面的高宽为：' + parseInt(nextBlockStyle.height) + ',' + parseInt(nextBlockStyle.width));

            if (!isSamPage) {
                console.warn('合并的下个页面：' + this.getBlockTitle(nextBlock) + '，页面尺寸或类型与：' + this.getBlockTitle(currBlock) + '不一致！');
            }

            if (!['11', '12'].includes(nextBlock.dataset.outlinetype) && isSamPage) {
                // var nextStrct = $global.hasClass(nextBlock, 'struct');
                // var nextAppendix = $global.hasClass(nextBlock, 'appendix');
                if (isStruct === nextBlockStruct || isAppendix === nextBlockAppendix || isSamPage) {
                    let merged = this.mergeBlockPage(spaceHeight, currBlock, nextBlock, pageContainer, isAppendix);
                    if (!nextBlock.childNodes.length) {
                        nextBlock.remove();
                        // 重置页面页码
                        this.resetPageNumber();
                    }
                    // 重置脚注
                    this.resetBlockFootNote();
                    // 重置列项序号
                    this.resetBulletNumbers(pageContainer);
                    // 已经删除了nextBlock
                    if (!nextBlock.parentElement) {
                        return true;
                    }
                } else {
                    return false;
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

    /**
     * @description 合并HTML内容
     * @param {Element}  pageContainer
     * @param {Array}  blocks 页面集合
     * @param {Boolean}  isAppendix 是否为附录页面
     */
    mergeHtmlContent(pageContainer = null, blocks = [], isAppendix = false) {
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
            let spaceData = $global.calcBLockSpaceHeight(block);
            let spaceHeight = spaceData.blockHeight - spaceData.allHeight;

            let tableNodes = Array.from(block.querySelectorAll('table'));
            let nextBlock = block.nextElementSibling;
            let cleared = false;
            if (nextBlock && tableNodes.length) {
                // 仅取最后一个表格做处理
                let tableNode = tableNodes[tableNodes.length - 1];
                let hideIndex = [];
                let currTrs = Array.from(tableNode.querySelectorAll('tbody>tr'));
                currTrs.forEach(tr => {
                    let index = editor.dom.nodeIndex(tr);
                    if ($global.hasClass(tr, 'hide')) {
                        hideIndex.push(index);
                    }
                });
                let cloneTable = nextBlock.querySelector(`table[data-parentid="${tableNode.dataset.id}"]`) || nextBlock.querySelector(`table[data-parentid="${tableNode.dataset.parentid}"]`);
                if (cloneTable && hideIndex.length) {
                    let cloneTrs = Array.from(cloneTable.querySelectorAll('tbody>tr:not(.hide)'));
                    for (let i=0; i<cloneTrs.length; i++) {
                        let tr = cloneTrs[i];
                        let index = editor.dom.nodeIndex(tr);
                        let trHeight = this.getELeRealHeight(tr, window.getComputedStyle(tr), null, block);
                        if (spaceHeight > trHeight) {
                            spaceHeight -= trHeight;
                            $global.addClass(tr, 'hide');
                            $global.removeClass(currTrs[index], 'hide');
                            cleared = true;
                        } else {
                            break;
                        }
                    }
                }
            }
            return cleared;
        }

        // 校验页面
        const outlineList = this.vm.outlineData[0]['children'];
        // 获取页面的名称
        const getBlockInfo = blockEle => {
            let outlineItem = _.find(outlineList, { outlineId: blockEle.dataset.outlineid });
            if (outlineItem) {
                return outlineItem.outlineTitle || '';
            } else {
                return blockEle.dataset.title || '';
            }
        }

        // 处理当前页与下页的内容合并
        const parseHtml = async (block) => {
            if (!block) {
                throw '异常错误！页面不存在，终止合并！';
                return false;
            }
            var mergeRes = false;
            if (!$global.hasClass(block, 'appendix')) {
                // console.log('开始处理' + this.getBlockTitle(block) + '的合并.....');
                // debugger
                mergeRes = this.mergeNextPage(block);

                // 处理表格与续表的内容
                var cleared = cleartableContent(block);
                // 当前页中如存在超限元素对象则再分页
                var outSideNode = await this.getOutSideNode(block, false, true);
                // debugger
                if (outSideNode && outSideNode.lastNode) {
                    // console.log('开始处理' + this.getBlockTitle(block) + '的跨页.....');
                    this.appendNextBlock(block, outSideNode);
                }
            }

            // 延迟处理，待分页完成
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (mergeRes) {
                        resolve(parseHtml(block));
                    } else {
                        var nextBlock = block.nextElementSibling;
                        if (nextBlock) {
                            resolve(parseHtml(nextBlock));
                        } else {
                            resolve(true);
                        }
                    }
                }, 750)
            })
        }
        // 开始合并（从第一个页面及第二个页面计算）0,1
        return parseHtml(blocks[0]);
    },

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
                    let parentNodeStyle = window.getComputedStyle(node.parentNode);
                    if (isBreak) {
                        break;
                        return false;
                    }
                    // 如果当前节点为隐藏层级项且无内容则直接删除
                    if ($global.hasClass(node, 'hide-list') && node.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '') === '' && !node.childNodes.length) {
                        node.remove();
                    } else {
                        // console.log('处理合并元素', node);
                        let olChildNodes = Array.from(node.childNodes);
                        let cls = node.className;
                        // 获取元素的实际高度 //Math.ceil(node.offsetHeight + Math.ceil(parseFloat(nodeStyle.marginTop)) + Math.ceil(parseFloat(nodeStyle.marginBottom)));
                        let nodeHeight = this.getELeRealHeight(node, nodeStyle, parentNodeStyle, nextBlock);
                        // 如果元素的整体高度未超限
                        if (spaceHeight >= eleAllHeight + nodeHeight && !isBreak) {
                            // console.log('直接合并元素', node);
                            // 列出节点中包含的条文脚注
                            var footnotes = node.querySelectorAll('span.a-note');
                            if (footnotes.length) {
                                eleAllHeight += footnotes.length * 28;
                                if (!block.querySelector('.footnote')) {
                                    eleAllHeight += 10;
                                }
                                if (spaceHeight < eleAllHeight + nodeHeight) {
                                    isBreak = true;
                                    break;
                                }
                            }
                            /* var footnoteNode = block.querySelector('.footnote');
                            if (footnoteNode) {
                                eleAllHeight += footnoteNode.offsetHeight + 10;
                                if (spaceHeight < eleAllHeight + nodeHeight) {
                                    isBreak = true;
                                    break;
                                }
                            } */

                            // 元素累加高度
                            eleAllHeight += nodeHeight;
                            // 是否为隐藏层级项
                            if (cls !== null && cls.match(/(ol-list|appendix-list|bullet)/g) !== null && $global.hasClass(node, 'hide-list')) {
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
                                    olChildNodes.forEach(ele => {
                                        if (ele.nodeName !== 'TABLE') {
                                            olList.appendChild(ele);
                                        } else {
                                            // 判断是否为续表对象  && pageContainer.querySelector(`[data-id="${ele.dataset.parentid}"]`)
                                            if (ele.dataset.parentid) {
                                                let parentTable = block.querySelector(`[data-id="${ele.dataset.parentid}"]`) || block.querySelector(`[data-parentid="${ele.dataset.parentid}"]`)
                                                if (parentTable) {
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
                                    });
                                    node.remove();
                                } else {
                                    $global.removeClass(node, 'hide-list');
                                    block.appendChild(node);
                                }
                            } else {
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
                                        let bulletLevel = node.dataset.level;
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
                            // 如果容器的高度已经超限，则计算容器内子元素是否可再提取出来
                        } else {
                            if (isBreak) {
                                break;
                            }
                            // 须元素行距小于限高
                            if (spaceHeight >= parseFloat(nodeStyle.lineHeight)) {
                                var nodeTop = editor.dom.getPos(node).y;
                                var cloneNode = node.cloneNode();
                                // 如果是隐藏的层级项元素 $global.hasClass(node, 'hide-list')
                                if ($global.hasClass(node, 'ol-list') || $global.hasClass(node, 'appendix-list')) {
                                    let parentLiNode = block.querySelector(`[data-outlineid="${node.dataset.outlineid}"]:not(.header-title):not(.info-block)`); // :not(.hide-list)
                                    if (!$global.hasClass(node, 'hide-list')) {
                                        let BeforeStyle = window.getComputedStyle(node, ':before');
                                        let firstChild = node.firstChild;
                                        if (BeforeStyle && (parseFloat(BeforeStyle.marginTop) || parseFloat(BeforeStyle.marginBottom))) {
                                            eleAllHeight += Math.ceil(parseFloat(BeforeStyle.marginTop) + parseFloat(BeforeStyle.marginBottom) + parseFloat(BeforeStyle.height));
                                        }
                                        /* let isLevel0 = ['#text','SPAN'].includes(firstChild.nodeName);
                                        if (BeforeStyle && isLevel0 && firstChild.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '') === '') {
                                            eleAllHeight += parseInt(BeforeStyle.marginTop) + parseInt(BeforeStyle.marginBottom) + parseInt(BeforeStyle.height);
                                        } */
                                    }
                                    // 定义子集元素坐标便于后期处理和计算
                                    /* for (let i = 0; i < olChildNodes.length; i++) {
                                        let ele = olChildNodes[i];
                                        if (!['#text', 'BR'].includes(ele.nodeName)) {
                                            let eleTop = editor.dom.getPos(ele).y;
                                            ele.dataset.top = eleTop;
                                        }
                                    }
 */
                                    // console.log('分解元素合并的子集章条目', olChildNodes);
                                    let testHeight = 0; //92
                                    for (let i = 0; i < olChildNodes.length; i++) {
                                        if (isBreak) {
                                            break;
                                        }
                                        let ele = olChildNodes[i];
                                        let eleStyle = ['#text', 'BR'].includes(ele.nodeName) ? null : window.getComputedStyle(ele);
                                        let eleHeight = eleStyle ? ele.offsetHeight || 0 + Math.ceil(parseFloat(eleStyle.marginTop || 0)) + Math.ceil(parseFloat(eleStyle.marginBottom || 0)) : this.getELeRealHeight(ele, eleStyle, nodeStyle, nextBlock);
                                        /* if (node.childElementCount === 0) {
                                            eleHeight = nodeHeight;
                                        } */
                                        if (ele.nodeName === 'BR' && !isBreak) {
                                            eleHeight = 14;
                                            if (ele.nextElementSibling && ele.nextElementSibling.nodeName !== 'BR') {
                                                if (spaceHeight >= eleAllHeight + eleHeight && !isBreak) {
                                                    cloneNode.appendChild(ele);
                                                    eleAllHeight += eleHeight;
                                                } else {
                                                    isBreak = true;
                                                    break;
                                                }
                                            }
                                        } else if (['#text', 'SPAN', 'EM', 'STRONG', 'IMG', 'SUB', 'SUP'].includes(ele.nodeName) && !isBreak) {
                                            /* let eleTop = !['#text','BR'].includes(ele.nodeName) ? parseFloat(ele.dataset.top) : nodeTop;
                                            console.log(node.offsetHeight)
                                            console.log(nodeTop);
                                            debugger */
                                            if (spaceHeight >= eleAllHeight + eleHeight && !isBreak) {
                                                /* if (eleTop > nodeTop || i === 0) {
                                                    nodeTop = eleTop;
                                                    eleAllHeight += eleHeight;
                                                    testHeight += eleHeight;
                                                } */
                                                cloneNode.appendChild(ele);
                                                eleAllHeight += eleHeight;
                                            } else {
                                                isBreak = true;
                                                break;
                                            }

                                        } else if ((ele.nodeName === 'P' || ele.nodeName === 'FIGURE') && !isBreak) {
                                            if (ele.querySelector('img')) {
                                                if (spaceHeight >= eleAllHeight + eleHeight && !isBreak) {
                                                    cloneNode.appendChild(ele);
                                                    // parentLiNode.appendChild(ele);
                                                    eleAllHeight += eleHeight;
                                                } else {
                                                    isBreak = true;
                                                    break;
                                                }
                                            } else {
                                                // 提取段落
                                                let newParagraph = this.extractParagraph(ele, spaceHeight - eleAllHeight);
                                                if (newParagraph) {
                                                    eleAllHeight += newParagraph.offsetHeight || this.getNodeReleaseHeight(newParagraph, node);
                                                    cloneNode.appendChild(newParagraph);
                                                } else {
                                                    isBreak = true;
                                                    break;
                                                }
                                            }
                                        } else if (ele.nodeName === 'DIV' && !isBreak) {
                                            if (spaceHeight >= eleAllHeight + eleHeight && !isBreak) {
                                                if ($global.hasClass(ele, 'bullet') && $global.hasClass(ele, 'hide-list') && editor.dom.nodeIndex(ele) === 0) {
                                                    let lastSameBullet = bulletUtil.getPrevBlockSameBullet(ele);
                                                    // debugger
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
                                                if ($global.hasClass(ele, 'math-desc')) {
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
                                                }
                                                isBreak = true;
                                                break;
                                            }

                                        } else if (ele.nodeName === 'TABLE' && !isBreak) {
                                            // 表格须额外加上外边距(线框宽度)
                                            spaceHeight -= parseInt(eleStyle.borderWidth || 1) * 3;
                                            // 判断当前TABLE是否为续表
                                            let sourceTable = block.querySelector(`table[data-id="${ele.dataset.parentid}"]`) || block.querySelector(`table[data-parentid="${ele.dataset.parentid}"]`);
                                            if (ele.dataset.parentid && sourceTable) {
                                                let mergeResult = tableUtil.mergeTable(sourceTable, spaceHeight);
                                                isBreak = mergeResult.isBreak;
                                                eleAllHeight += mergeResult.eleAllHeight;
                                            } else {
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
                                                    eleAllHeight += tableHead.offsetHeight;
                                                }

                                                // 取出表主体第一个TR
                                                let firstTr = ele.querySelector('tbody>tr:not(.hide)');
                                                let firstTrHeight = firstTr.offsetHeight + 1;

                                                // 如果去掉了tbody内行后，整个表格的高度还小于空间则处理单元行 10:表格底边距
                                                if (spaceHeight >= eleAllHeight + firstTrHeight && !isBreak) {
                                                    let cloneTable = ele.cloneNode(true);
                                                    let cloneTableTbody = cloneTable.querySelector('tbody');
                                                    cloneTableTbody.innerHTML = '';
                                                    // 表格加入到目标对象中
                                                    cloneNode.appendChild(cloneTable);
                                                    isBreak = tableUtil.mergeTableByNew(ele, cloneTable, spaceHeight - eleAllHeight - firstTrHeight); //mergeTable
                                                    if (isBreak) {
                                                        ele.dataset.parentid = ele.dataset.id;
                                                        ele.dataset.id = $global.guid();
                                                        $global.addClass(ele, 'xu');
                                                        if (tableTitle) {
                                                            $global.addClass(tableTitle, 'txu');
                                                        }
                                                    } else {
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
                                            }
                                        }
                                    }
                                } else if (node.nodeName === 'TABLE' && !isBreak) {
                                    console.log('合并表格处理', node);
                                    // 判断当前TABLE是否为续表
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
                            }
                        }
                    }
                }
                this.clearEmptyPage(pageContainer);
                return isBreak;
            } catch (error) {
                alert('页面合并处理模块发生异常！');
                throw error;
                return false;
            }
        }
    },

    /**
     * @description 将段落中的文字重新提取到新的段落中；如果内容中有
     * @param {Element} node
     * @param {Int} spaceHeight
     */
    extractParagraph(node = null, spaceHeight = 0) {
        var editor = this.getActiveEditor();

        var nodeStyle = window.getComputedStyle(node);
        var lineHeight = parseInt(nodeStyle.lineHeight);
        if (lineHeight > spaceHeight) {
            return null;
        }

        var nodeStr = node.textContent.trim();
        if (nodeStr !== '') {
            // debugger
            var tagList = this.cacheDomTags(node, editor);
            var htmlContent = node.innerHTML || '';

            var textStr = nodeStr.replace(/[\u200B-\u200D\uFEFF]/g, '');
            var textSpans = textStr.split("");
            let ems = [];
            for (let i = 0; i < textSpans.length; i++) {
                ems.push(`<em>${textSpans[i]}</em>`);
            }
            // node.innerHTML = ems.join("");

            var emNodes = Array.from(node.querySelectorAll('em'));
            var arrs = { append: [], still: [] };
            // 定义切割的位置
            var splitOffset = 0, splitIndex = 0;
            for (let i = 0; i < emNodes.length; i++) {
                let em = emNodes[i];
                let lh = em.offsetHeight;
                let exh = em.offsetTop + lh - node.offsetTop;
                if (exh < spaceHeight) {
                    arrs.append.push(em.textContent);
                    if (!splitOffset) {
                        splitOffset = i;
                    }
                } else {
                    if (!splitIndex) {
                        splitIndex = i;
                    }
                    arrs.still.push(em.textContent);
                }
            }
            // debugger
            var cloneNode = node.cloneNode(); // true
            if (splitIndex) { // 如果有截断的
                // 保留的内容
                let stillHtml = this.matchTagByString(nodeStr.substring(0, splitIndex), tagList, 0);
                node.innerHTML = stillHtml;
                // 超出的内容
                let appendHtml = this.matchTagByString(nodeStr.substring(splitIndex, textSpans.length), tagList, splitIndex);
                cloneNode.innerHTML = appendHtml;
                return cloneNode;
            } else {
                return node;
            }
        }
        return node;

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
        this.updatePageAttrs(nextBlock);
        // 重新页面编号
        this.resetPageNumber();

        return nextBlock;
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
        this.vm.breakingPage = true;
        const breakPage = async block => {
            block.dataset.break = "true";
            block.style.paddingBottom = "20mm";
            // 页面的高宽
            if(!block.style.width) {
                block.style.width = block.dataset.pagesize && block.dataset.pagesize === 'A3' ? "297mm" : "210mm";
            }
            if(!block.style.height) {
               block.style.height = block.dataset.pagesize && block.dataset.pagesize === 'A3' ? "210mm" : "297mm";
            }

            // debugger
            var outSideNode = await this.getOutSideNode(block, keepBreak);
            /* console.log('outSideNode==>', outSideNode)
            debugger */
            if (outSideNode && outSideNode.lastNode) {
                this.appendNextBlock(block, outSideNode);
                await breakPage(block); // 本页再次分页
            }
            var nextBlock = block.nextElementSibling;
            if (nextBlock) {
                if (keepBreak) {
                    // 继续分页处理
                    return await breakPage(nextBlock);
                } else {
                    return true;
                }
            } else {
                if (!nextBlock) {
                    console.log("分页完成....");
                    return true;
                }
            }
        }


        var pageContainer = editor.getBody().querySelector('.page-container');
        if (pageContainer) {
            var firstBlock = pageContainer.querySelector('.info-block:not(.cover):not(.catalogue)');
            // 仅当前页分页
            if (!keepBreak) {
                firstBlock = editor.dom.getParent(editor.selection.getNode(), '.info-block');
            }
            if (firstBlock && !$global.hasClass(firstBlock, 'cover')) {
                let res = await breakPage(firstBlock);
                this.vm.breakingPage = false;
                if (callBack) {
                    callBack(res);
                } else {
                    return res;
                }
            } else {
                this.vm.$alert('封面页不可操作分页！','错误提示', { type:'error'});
                return false;
            }
        }
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
            var isStruct = $global.hasClass(pageBlock, 'struct');
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
        /*if (pageBlock.style.paddingBottom) {
            pageBlock.style.paddingBottom = null;
        }*/
        // debugger
        var blockStyle = window.getComputedStyle(pageBlock);
        // 页面的实际空间高度
        var spaceHeight = Math.ceil(parseFloat(blockStyle.height) - parseFloat(blockStyle.paddingBottom));
        var limitHeight = 0;
        // 如果页面有脚注则再减去脚注的高度
        var footnote = pageBlock.querySelector('.footnote');
        if (footnote) {
            spaceHeight -= footnote.offsetHeight + 10;
        }
        // 获取超出页面的子元素
        var lastNode = null;
        for (let i = 0; i < pageBlock.childNodes.length; i++) {
            let ele = pageBlock.childNodes[i];
            if (!['#text', 'BR'].includes(ele.nodeName)) {
                let eleStyle = window.getComputedStyle(ele);
                let eleHeight = this.getELeRealHeight(ele, eleStyle, blockStyle, pageBlock);
                let eleTop = editor.dom.getPos(ele).y - editor.dom.getPos(pageBlock).y;
                if (ele.nodeName === 'TABLE') {
                    eleHeight -= 2;
                }
                if (!$global.hasClass(ele, 'footnote') && !/^(#text)$/.test(ele.nodeName) && !ele.dataset.mceCaret && (eleTop + eleHeight) > spaceHeight + 1) { // 1:误差系数值
                    limitHeight = spaceHeight - eleHeight; //eleTop + eleHeight - spaceHeight; // spaceHeight - eleHeight
                    lastNode = ele;
                    break;
                }
            }
        }

        if (lastNode) {
            var appendNodes = $global.getNextAllNodes(lastNode);
            var splitNode;
            if (!/^(P|SPAN|EM|#text)$/.test(lastNode.nodeName)) { // 块元素处理
                splitNode = await this.splitNode(lastNode, spaceHeight, isMerge);
            } else { // 行内元素处理
                splitNode = this.splitParagraphStr(lastNode, spaceHeight);
            }
            return {
                lastNode: splitNode,
                limitHeight,
                appendNodes
            };
        }
        return null;
    },

    resetLastNode(node = null, blockContainer = null) {
        var editor = this.getActiveEditor();
        // 页面中续表须做合并处理
        var tableNodes = Array.from(blockContainer.querySelectorAll('table:not(.xu)'));
        if (tableNodes.length) {
            tableNodes.forEach(table => {
                let realtionTable = blockContainer.querySelector(`table[data-parentid="${table.dataset.id}"]`);
                if (realtionTable) {
                    let trs = Array.from(table.querySelectorAll('tr'));
                    trs.forEach(tr => {
                        $global.removeClass(tr, 'hide');
                    });
                    realtionTable.remove();
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
        if (nextBlock && nextBlock.dataset.outlineid === pageBlock.dataset.outlineid && nextBlock.offsetWidth === pageBlock.offsetWidth && nextBlock.offsetHeight === pageBlock.offsetHeight) {
            // 如果未定义页面高度且为无限延展的
            if (!nextBlock.style.height && pageBlock.style.height !== '' && this.vm.editorSetting.page.expand) {
                nextBlock.style.height = pageBlock.style.height;
            }

            var firstChild = nextBlock.firstChild;
            if (firstChild && $global.hasClass(firstChild, 'hide-list')) {
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
            var currLastNode = this.resetLastNode(obj.lastNode, nextBlock);
            // 新页面的属性
            this.updatePageAttrs(nextBlock);
            // 重新页面编号
            this.resetPageNumber();
        }

        // 再分析附加的元素是否可直接插入在当前元素后
        if (!_.isEmpty(obj.appendNodes)) {
            obj.appendNodes.reverse().forEach(ele => {
                editor.dom.insertAfter(ele, obj.lastNode);
            })
        }
        this.resetBulletNumbers(nextBlock);
        // 光标定位
        if (isFocus) {
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
        var parentid = block.dataset.id || block.dataset.outlineid;
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
    getELeRealHeight(ele = null, eleStyle, parentStyle, block) {
        let blockStyle = window.getComputedStyle(block);
        let eleHeight = 0;
        if (ele.nodeName !== 'BR') {
            if (['#text', 'SPAN', 'EM'].includes(ele.nodeName)) {
                let eleDom = document.createElement('div');
                eleDom.style.position = 'absolute';
                eleDom.style.visibility = 'hidden';
                eleDom.style.left = blockStyle.paddingLeft;
                eleDom.style.right = blockStyle.paddingRight;
                eleDom.style.lineHeight = parentStyle.lineHeight;
                eleDom.textContent = ele.nodeValue || ele.textContent;
                block.appendChild(eleDom);
                eleHeight = eleDom.offsetHeight;
                eleDom.remove();
            } else {
                let eleRect = ele.getBoundingClientRect();
                let offsetHeight = eleRect.height;
                // let offsetHeight = eleStyle ? parseFloat(eleStyle.height) : ele.offsetHeight;
                //eleHeight = Math.ceil(ele.offsetHeight) + Math.ceil(parseFloat(eleStyle.marginTop||0)) + Math.ceil(parseFloat(eleStyle.marginBottom||0)) + Math.ceil(parseFloat(eleStyle.paddingTop||0)) + Math.ceil(parseFloat(eleStyle.paddingBottom||0));
                // eleHeight = Math.ceil(offsetHeight + parseFloat(eleStyle.marginTop || 0) + parseFloat(eleStyle.marginBottom || 0) + parseFloat(eleStyle.paddingTop || 0) + parseFloat(eleStyle.paddingBottom || 0));
                eleHeight = offsetHeight + parseFloat(eleStyle.marginTop || 0) + parseFloat(eleStyle.marginBottom || 0) + parseFloat(eleStyle.paddingTop || 0) + parseFloat(eleStyle.paddingBottom || 0);
            }
        }
        /*if (!['#text','BR'].includes(ele)) {
            let beforEle = window.getComputedStyle(ele, ":befor");
            if (beforEle) {
                eleHeight -= parseInt(beforEle.paddingBottom)
            }
            let afterEle = window.getComputedStyle(ele, ":after");
            if (afterEle) {
                eleHeight -= parseInt(afterEle.paddingBottom)
            }
        }*/

        return eleHeight;
    },

    /**
     * @description 子元素切割
     * @param {node} Element
     * @param {posTop} Int
     */
    async splitNode(node = null, posTop = 0, isMerge = false) {
        var editor = this.getActiveEditor();
        var pageContainer = editor.dom.getParent(node, '.page-container');
        // 当前页面
        var block = editor.dom.getParent(node, '.info-block');
        tableUtil.clearTableHeight(block);

        // 后一页
        var nextBlock = block.nextElementSibling;
        // 子集对象
        var childNodes = node.nodeName === 'TABLE' ? Array.from(node.querySelectorAll('tbody>tr:not(.hide)')) : Array.from(node.childNodes);
        // childNodes = $global.filterNodesBySelector(childNodes)['filters'];

        // 声明最后的元素
        var lastNode, nextSiblings = [];
        if (childNodes && childNodes.length) {
            // 声明是否跳出循环
            var isBreak = false;
            var nodeStyle = window.getComputedStyle(node);
            var BeforeStyle = window.getComputedStyle(node, ':before');
            var nodeOffsetTop = Math.ceil(editor.dom.getPos(node).y - editor.dom.getPos(block).y);
            for (let i = 0; i < childNodes.length; i++) {
                let ele = childNodes[i];
                let offsetTop = 0, lineHeight = 0, eleHeight = 0;
                if (['#text','SPAN','EM','STRONG','IMG','SUP','SUB'].includes(ele.nodeName) && i === 0) {
                    offsetTop = nodeOffsetTop;
                    eleHeight = this.getELeRealHeight(ele, null, nodeStyle, nextBlock || block);
                    if (BeforeStyle) {
                        eleHeight = Math.ceil(parseFloat(BeforeStyle.marginTop) + parseFloat(BeforeStyle.marginBottom) + parseFloat(BeforeStyle.height)); //  + parseFloat(BeforeStyle.height)
                    }
                } else {
                    if (!['#text'].includes(ele.nodeName)) {
                        offsetTop = Math.ceil(editor.dom.getPos(ele).y - editor.dom.getPos(block).y);
                        let style = window.getComputedStyle(ele);
                        lineHeight = Math.ceil(parseFloat(style.lineHeight || 21));
                        eleHeight = this.getELeRealHeight(ele, style, nodeStyle, nextBlock || block);
                    }
                }
                /* let style = window.getComputedStyle(ele);
                let lineHeight = Math.ceil(parseFloat(style.lineHeight));
                let eleHeight = this.getELeRealHeight(ele, style, nodeStyle, nextBlock || block); */

                if (lineHeight < eleHeight) {
                    lineHeight = eleHeight;
                }
                // debugger
                if (offsetTop + lineHeight > posTop) {
                    nextSiblings = Array.from($global.getNextAllNodes(ele));
                    if (ele.nodeName === "TABLE") {
                        // 重新设置下表格的单元行属性
                        // tableUtil.clearTrHide(ele);
                        lastNode = tableUtil.splitTable(ele, posTop, this.vm.editorSetting.mergeDoc);
                        if (!lastNode) {
                            return null;
                        }
                    } else if (ele.nodeName === 'TR') { // 如果是单元行就直接取出所有后面的兄弟节点
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
                        return node;
                    } else {
                        if (ele.textContent.replace(/[\u200B-\u200D\uFEFF|/\s]/g, '') !== '') { // .replace(/\s/g, '')
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
            // debugger
            var cloneNode = node.cloneNode();
            // 如果是章节条目 或 列项等
            if ($global.hasClass(node, 'ol-list') || $global.hasClass(node, 'appendix-list') || $global.hasClass(node, 'bullet')) {
                $global.addClass(cloneNode, 'hide-list');
                // 术语章节条目
                if ($global.hasClass(lastNode, 'term') && lastNode.textContent.replace(/[\u200B-\u200D\uFEFF|/\s]/g, '') !== '') {
                    $global.removeClass(cloneNode, 'hide-list');
                }
                // 层级项是否已经存在clone对象
                if (node.dataset && node.dataset.outlineid) {
                    var cloneOl = nextBlock ? nextBlock.querySelector(`div.hide-list[data-outlineid="${node.dataset.outlineid}"]`) : null;
                    if (cloneOl) {
                        cloneNode = cloneOl;
                        $global.prependChild(lastNode, cloneNode);
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
                    } else {
                        cloneNode.appendChild(lastNode);
                        if (nextSiblings.length) {
                            nextSiblings.forEach(ele => {
                                cloneNode.appendChild(ele);
                            });
                        }
                        // 当前超限元素无文本内容且无子元素 && !node.childNodes.length
                        let nodeOffsetTop = Math.ceil(editor.dom.getPos(node).y - editor.dom.getPos(block).y);
                        let nodeHeight = this.getELeRealHeight(node, nodeStyle, {}, nextBlock || block);
                        // console.log(nodeOffsetTop + nodeHeight > posTop);
                        if (node.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '' && (nodeOffsetTop + nodeHeight > posTop)) {
                            node.remove();
                            $global.removeClass(cloneNode, 'hide-list');
                        }
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
            }
            return cloneNode;
        } else if ($global.hasClass(node.parentElement, 'info-block')) {
            // 直接是页面的子元素
            if ($global.hasClass(node, 'catalogue-list')) {
                return lastNode;
            } else if ($global.hasClass(node, 'bullet')) {
                let sameBullets = bulletUtil.getPrevSameLevelAndType(node, true);
                if (sameBullets.length) {
                    node.dataset.cross = true;
                    node.dataset.start = sameBullets.length;
                    node.style.counterReset = `${node.dataset.type} ${sameBullets.length}`;
                }
            }
            return node;
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
                        splitNode.appendChild(ele);
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
        var nodeClone = node.cloneNode();
        var childs = Array.from(node.childNodes);
        // 取出超限的元素
        for (let i = 0; i < childs.length; i++) {
            let ele = childs[i];
            let offsetTop;
            if (ele.nodeName !== '#text') {
                offsetTop = editor.dom.getPos(ele).y - editor.dom.getPos(block).y;
                if (ele.nodeName === 'IMG') {
                    offsetTop += 10;
                }
                if (offsetTop + ele.offsetHeight > posTop) {
                    nodeClone.appendChild(ele);
                }
            } else {
                let em = editor.dom.create('em', {}, ele.textContent);
                $global.prependChild(em, node);
                offsetTop = editor.dom.getPos(em).y - editor.dom.getPos(block).y;
                if (offsetTop + em.offsetHeight > posTop) {
                    nodeClone.appendChild(ele);
                }
                em.remove();
            }
        }
        return nodeClone;
    },

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
                        // debugger
                        tags.push({
                            tagName: node.nodeName.toLowerCase(),
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
        var editor = this.getActiveEditor();
        var block = editor.dom.getParent(node, '.info-block');
        var nodeStr = node.textContent.trim();
        // debugger
        if (nodeStr !== '') {
            // 这里须要记录DOM中的某些标签，以便在还原内容时再重新打上标签属性
            var tagList = this.cacheDomTags(node, editor);
            /* if (!['BR','IMG'].includes(node.nodeName)) {
                tagList = this.cacheDomTags(node, editor);
            } */
            // console.log('splitParagraphStr tagList', tagList);

            var htmlContent = node.innerHTML || '';
            // console.log('splitParagraphStr innerHTML', node.innerHTML);

            var textStr = nodeStr.replace(/[\u200B-\u200D\uFEFF]/g, ''); // 去除空格和占位符
            var textSpans = textStr.split("");
            let ems = [];
            for (let i = 0; i < textSpans.length; i++) {
                ems.push(`<em>${textSpans[i]}</em>`);
            }
            node.innerHTML = ems.join("");
            var emNodes = node.querySelectorAll('em');
            var arrs = { append: [], still: [] };

            var splitIndex = 0;
            for (let i = 0; i < emNodes.length; i++) {
                let em = emNodes[i];
                let offsetTop = editor.dom.getPos(em).y - editor.dom.getPos(block).y;
                let style = window.getComputedStyle(em);
                if (offsetTop + parseInt(style.lineHeight) > posTop) {
                    splitIndex = i;
                    break;
                }
            }

            if (splitIndex) {
                // 保留部分内容
                var prevStr = this.matchTagByString(textStr.substring(0, splitIndex), tagList, 0);
                node.innerHTML = prevStr;
                // 跨页内容
                var nextStr = this.matchTagByString(textStr.substring(splitIndex, textSpans.length), tagList, splitIndex)
                return editor.dom.create('p', {}, nextStr);
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

        // debugger
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
        let st = 1;
        let ems = [];
        for (let i = 0; i < textSpans.length; i++) {
            ems.push(`<em>${textSpans[i]}</em>`);
        }
        node.innerHTML = ems.join("");
        // debugger
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
        // debugger
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
        var newElement = null,
            newParagraph = null,
            textContent = null,
            pid = lastNode.dataset.id || $global.guid();
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

        var titleId; // 表标题ID
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
        /* tableContainer.removeAttribute('style');
        tableContainer.removeAttribute('data-mce-style'); */
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
        /*
        var editor = this.getActiveEditor();
        var nextNodes = $global.getNextAllNodes(currLi);
        var sameNodes = pageBullet.getAllSameNodesById(currLi.dataset.id);
        var index = pageBullet.getIndex(sameNodes, currLi);
        var type = currLi.dataset.type;
        currLi.dataset.start = index;
        currLi.dataset.reset = type;
        currLi.dataset.cross = true;
        editor.dom.setStyle(currLi, 'counter-reset', `${type} ${index}`);

        // 是否包含在层级项中
        var olList = editor.dom.getParent(currLi, '.ol-list');
        if(olList) {
            nextNodes = $global.getNextAllNodes(olList);
            var newOl = olList.cloneNode();
            editor.dom.addClass(newOl, 'hide-list');
            newOl.innerHTML = '';
            newOl.appendChild(currLi);
            return {
                self: newOl,
                lastNode: newOl,
                nextNodes
            };
        }
        return {
            self: currLi,
            lastNode: currLi,
            nextNodes
        }; */
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
