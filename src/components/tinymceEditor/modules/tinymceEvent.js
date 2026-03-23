/**
 * =================================================
 * @module
 * @desc 编辑器鼠标及键盘事件模块
 * @author 👋 sam.shen 2021-12-29
 */
import $global from "@/utils/global";
import pageUtil from "../utils/pageUtil";
import domUtil from "../utils/domUtil";
import tableUtil from "../utils/tableUtil";
// import { numberChar } from "../configs/editorOptions";
import levelUtil from "../utils/levelUtil";
import outlineUtil from "../utils/outlineUtil";

export default {
    editor: null,
    vm: {},
    compositionend: false,
    removeNode: null,
    focusNode: null,
    docError: [],
    // processingUtil: false,
    /**
     * @description 更新编辑器组件实例
     */
    updateVm(vm) {
        this.vm = vm;
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
     *  @description 初始化模块
     * @param {Object} editor
     * @param {Object} vm
     */
    init(editor = null, vm = null) {
        this.vm = vm;
        this.changeNode = null;
        console.log('启动编辑器事件机制...', this.vm.editorSetting);

        /* const cfg = $global.getTinymceConfig();
        console.log('cfg=>',cfg) */
        /**
         * 监听正在输入文字
         */
        editor.on('compositionstart', event => {
            this.compositionend = false;
            window.isInputing = true;
            editor.compositionStart = event.type === 'compositionstart';
        });
        editor.on('compositionend', event => {
            editor.compositionEnd = event.type === 'compositionend';
            window.isInputing = false;
            editor.nodeChanged();
        });
        editor.on('compositionupdate', event => {
            this.compositionend = true;
        });

        let mouseDown = false;
        editor.on('mousedown', function() {
            mouseDown = true;
        });
        editor.on('mouseup', function() {
            mouseDown = false;
        });


        editor.on('NodeChange', event => {
            // console.log('NodeChange', mouseDown, window.isInputing, this.compositionend);
            // debugger

            if (!editor.getBody() || this.vm.editorSetting.setTemplate || this.vm.editorSetting.parseTable || this.vm.loading || this.vm.breakingPage || this.vm.disabledChange || mouseDown || window.isInputing) {
                return false;
            }
            // 避免重复处理
            /*if (this.processingUtil) {
                return false;
            }*/

            // console.log('NodeChange', editor.compositionEnd, this.compositionend);
            // console.log('NodeChange', event, event.name);
            var pageContainer = editor.getBody().querySelector('.page-container');
            // 内容被全部删除
            if (!pageContainer && event.selectionChange && this.vm.loaded) {
                pageContainer = editor.dom.create('div', { class: 'page-container' }, '<div class="info-block"><p>请输入内容......</p></div>');
                pageContainer.dataset.id = this.vm.pageData.docId || $global.guid();
                pageContainer.dataset.outlineid = this.vm.pageData.outlineid || $global.guid();
                if (!this.vm.editorSetting.isStandard) {
                    $global.addClass(pageContainer, 'empty');
                }
                if (this.vm.pageData.stdTitle) {
                    pageContainer.dataset.title = this.vm.pageData.stdTitle;
                }
                editor.getBody().appendChild(pageContainer);
                editor.focus(true);
                return false;
            }

            if (!pageContainer || this.vm.editorSetting.readonly || this.vm.editorSetting.reader) {
                return false;
            }
            // 启用或禁用按钮
            pageUtil.enabledButtons(event.element);

            if (event.element) {
                if (event.element.nodeName === 'P') {
                    if ($global.hasClass(event.element.parentNode, 'header-title')) { // 处理页面标题
                        this.setHeaderTitle(event.element);
                        event.element.style.textIndent = null;
                    } else if (event.element.dataset.mceCaret) {
                        return false;
                    }
                } else if (event.element.nodeName === 'LI') {
                    event.element.style.textIndent = null;
                    event.element.removeAttribute('data-mce-style');
                }
            }

            if (event.initial) {
                this.checkHtmlContent(editor);
                return false;
            }
            if (event.selectionChange) {
                return false;
            }
            // this.processingUtil = true;
            this.changeNode = event.element;
            var pageNo, coverPage = pageContainer.querySelector('.info-block.cover');
            // 处理标准文档封面
            if (coverPage && this.vm.editorSetting.isStandard && !this.vm.editorSetting.parseStruct && !coverPage.dataset.render) {
                /*----------------------处理封面元素为空 开始 addBy sam.shen 2023-12-04-------------------*/
                // ICS和CCS
                let icsNumberELe = coverPage.querySelector('.icsNumber');
                if (icsNumberELe && icsNumberELe.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '') {
                    icsNumberELe.textContent = '';
                }
                let ccsNumberELe = coverPage.querySelector('.ccsNumber');
                if (ccsNumberELe && ccsNumberELe.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '') {
                    ccsNumberELe.textContent = '';
                }

                // 封面抬头
                // if ([1100,7].includes())
                let stdTitleELe = coverPage.querySelector('.stdTitle');
                if (stdTitleELe && stdTitleELe.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '' && !stdTitleELe.querySelector('img')) {
                    stdTitleELe.textContent = '';
                }

                // 封面标准代号内容
                let stdSignEle = coverPage.querySelector('.stdSign');
                if (stdSignEle && stdSignEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '') {
                    stdSignEle.textContent = '';
                }
                let stdNoEle = coverPage.querySelector('.stdNo');
                if (stdNoEle && stdNoEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '') {
                    stdNoEle.textContent = '';
                }
                // 替代编号
                let origStdNoEle = coverPage.querySelector('.origStdNo');
                if (origStdNoEle && origStdNoEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '') {
                    origStdNoEle.textContent = '';
                }

                // 标准名称
                let stdNameEle = coverPage.querySelector('.stdName');
                if (stdNameEle && stdNameEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '') {
                    stdNameEle.innerHTML  = '';
                }
                // 标准英文名称
                let stdNameEnEle = coverPage.querySelector('.stdNameEn');
                if (stdNameEnEle && stdNameEnEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '') {
                    stdNameEnEle.innerHTML = '';
                }
                // 与国标一致性成都标识
                let consistentSignEle = coverPage.querySelector('.consistentSign');
                if (consistentSignEle && consistentSignEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '') {
                    consistentSignEle.textContent = '';
                }
                // 文档稿次
                let stdEditionEle = coverPage.querySelector('.stdEdition');
                if (stdEditionEle && stdEditionEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '') {
                    stdEditionEle.textContent = '';
                }
                // 发布时间
                let stdPublishDateEle = coverPage.querySelector('.stdPublishDate');
                if (stdPublishDateEle && stdPublishDateEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '') {
                    stdPublishDateEle.textContent = '';
                }
                // 实施时间
                let stdPerformDateEle = coverPage.querySelector('.stdPerformDate');
                if (stdPerformDateEle && stdPerformDateEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '') {
                    stdPerformDateEle.textContent = '';
                }
                // 发布单位
                let releaseDepartmentEle = coverPage.querySelector('.releaseDepartment');
                if (releaseDepartmentEle && releaseDepartmentEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '' && !releaseDepartmentEle.querySelector('img')) {
                    releaseDepartmentEle.textContent = '';
                    let utilNode = releaseDepartmentEle.parentNode;
                    let nextUtilNode = utilNode.nextElementSibling;
                    if (nextUtilNode && nextUtilNode.nodeName === 'BR') {
                        nextUtilNode.remove();
                    }
                }

                /*----------------------处理封面元素为空 结束-------------------*/

                if ($global.hasClass(event.element, 'stdSign') && $global.hasClass(event.element.parentNode, 'std-sign')) {
                    var stdSignText = event.element.dataset.code || event.element.textContent.replace(/\s/g, '');
                    this.vm.pageData.stdSign = stdSignText;
                    // 修改标准编号
                    var stdNoNode = coverPage.querySelector('.numbers .tt');
                    if (stdNoNode) {
                        let sText = stdNoNode.firstChild.textContent;
                        stdNoNode.firstChild.textContent = (sText.match(/\T/i) !== null ? 'T/' : '') + stdSignText;
                        this.setPageNo(pageContainer, stdNoNode.innerText);
                    }
                    // 修改代替编号
                    var origStdNoNode = coverPage.querySelector('.numbers .origStdNo');
                    if (origStdNoNode) {
                        let oText = origStdNoNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '');
                        if (oText) {
                            var arrLis = [];
                            oText.split("、").forEach(str => {
                                let matchNum = str.match(/[0-9]/i);
                                if (matchNum !== null) {
                                    let noStr = str.slice(matchNum.index, str.length);
                                    str = stdSignText + ' ' + noStr;
                                    arrLis.push(str);
                                }
                                /*var strArr = str.split(" ");
                                strArr[0] = stdSignText;
                                str = strArr.join(" ");
                                arrLis.push(str);*/
                            })
                            origStdNoNode.textContent = arrLis.join("、");
                        }
                    }
                }

                // 封面标准编号内容改变
                if (event.element.nodeName === 'SPAN' && $global.hasClass(event.element.parentNode, 'tt')) {
                    let stdSpanNodes = event.element.parentNode.childNodes;
                    let nos = [];
                    stdSpanNodes.forEach(ele => {
                        nos.push(ele.textContent);
                    })
                    pageNo = nos.join("");
                    this.setPageNo(pageContainer, pageNo);
                }

                // 封面抬头名称
                if (event.element.nodeName === 'H1' && $global.hasClass(event.element, 'title')) {
                    domUtil.changeCoverTitle(editor, event.element);
                }
                if (event.element.nodeName === 'SPAN' && $global.hasClass(event.element, 'stdTitle')) {
                    domUtil.changeCoverTitle(editor, event.element.parentNode);
                    // 关联到发布单位
                    let deptEle = coverPage.querySelector('.main-util').firstChild.firstChild;
                    if (deptEle && vm.pageData.stdKind === 1500) {
                        deptEle.textContent = event.element.textContent;
                    }
                }

                // 封面一致性程度标识
                if ($global.hasClass(event.element, 'consistentSign')) {
                    domUtil.dealConsistentSign(pageContainer, event.element);
                }

                // 封面稿次内容变动(送审稿|征求意见稿， 须加上专利说明)
                var patentFileEle = coverPage.querySelector('span.patentFile');
                if (stdEditionEle && patentFileEle) {
                    let stdEditionText = stdEditionEle.textContent;
                    if (stdEditionText.match(/(送审|征求意见)/i)) {
                        $global.removeClass(patentFileEle.parentNode, 'hide');
                    } else {
                        $global.addClass(patentFileEle.parentNode, 'hide');
                    }
                }

                // 封面文档名称
                if ($global.hasClass(event.element, 'stdName')) {
                    let stdName = event.element.innerText;
                    pageContainer.dataset.title = stdName;
                    var bindStdNameNode = Array.from(pageContainer.querySelectorAll('[data-bind="stdName"]'));
                    if (bindStdNameNode.length) {
                        bindStdNameNode.forEach(ele => {
                            if ($global.hasClass(ele.parentNode, 'header-title')) {
                                ele.innerHTML = stdName.replace(/\n/g, '<br/>');
                                ele.contentEditable = "false";
                            } else {
                                ele.textContent = stdName.replace(/\n/g, ' ');
                            }
                        })
                    }
                }
                // 封面发布日期与实施日期
                if (event.element.nodeName === 'DIV' && ($global.hasClass(event.element, 'footer-publish') || $global.hasClass(event.element, 'footer-put'))) {
                    domUtil.changeCoverDate(editor);
                }
                coverPage.dataset.render = "true";
            }

            // 图片默认居中,非表格内图片
            if (event.element.nodeName === 'IMG') {
                if (event.element.parentNode.nodeName === 'P' && !editor.dom.getParent(event.element,'td') && !$global.hasClass(event.element.parentNode, 'imgs') && event.element.parentNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '') {
                    $global.addClass(event.element.parentNode, 'imgs')
                }
            }
            // 图标题为空时，文字居中
            if ($global.hasClass(event.element, 'img-title')) {
                if (event.element.textContent.replace(/\s/g) === '') {
                    $global.addClass(event.element, 'empty');
                } else {
                    $global.removeClass(event.element, 'empty');
                }
            }

            // 处理层级项空内容
            levelUtil.formatterEmptyNode(editor);

            // 表标题改变
            if (/^(CAPTION)$/.test(event.element.nodeName) && event.element.parentNode.nodeName === 'TABLE' && !this.vm.editorSetting.parseStruct) {
                tableUtil.chageTableCaption(editor, event.element.parentNode);
                // this.processingUtil = false;
                return false;
            }

            // 表格内容同步处理
            if ((/^(TH|TD)$/.test(event.element.nodeName) || event.element.nodeName === 'P') && !this.vm.editorSetting.parseStruct) {
                let table = editor.dom.getParent(event.element, 'table');
                if (table) {
                    table.removeAttribute('height');
                    tableUtil.resetTdAlign(table);
                    if (!$global.hasClass(pageContainer, 'expand') && !this.vm.editorSetting.readonly && !this.vm.editorSetting.reader) {
                        tableUtil.chageTableContent(editor, event.element);
                    }
                }
            }
            pageUtil.vm = this.vm;
            domUtil.vm = this.vm;
            tableUtil.vm = this.vm;
            levelUtil.vm = this.vm;
            // 清除空白页
            // pageUtil.clearEmptyPage(pageContainer);
            // 一般文档重新定义大纲
            if (this.vm.editorSetting.normal) {
                outlineUtil.getOutlineByNormal(editor);
            }

            // 重置层级项顶边距
            levelUtil.resetPadding($global.getParentBySelector(event.element, 'info-block'));

            let changeLevelLens = false;
            const activeBlock = pageContainer.querySelector('div.info-block.active'); // :not(.pageHide)
            if (activeBlock) {
                const levelLens = activeBlock.dataset.levelLens || '0';
                const liNodes = activeBlock.querySelectorAll('.ol-list');
                changeLevelLens = levelLens != liNodes.length;
                activeBlock.dataset.levelLens = liNodes.length;
            }
            
            setTimeout(() => {
                this.resetChangeNode(editor, pageContainer, changeLevelLens);
            }, 500)
        });

        /**
         * 层级项是否为第一个元素
         */
        const hasfirstLevel = (nodes = [], startoffset = 0) => {
            var listNodes = [], isBlock = false, isTitle = false;
            nodes.forEach(node => {
                if ($global.hasClass(node, 'ol-list') || $global.hasClass(node, 'appendix-list')) {
                    listNodes.push(node);
                }
                // 是否为页面
                if ($global.hasClass(node, 'info-block')) {
                    isBlock = true;
                }
                // 是否为页面标题
                if ($global.hasClass(node, 'header-title') || $global.hasClass(node.parentNode, 'header-title')) {
                    isTitle = true;
                }

            })
            if (listNodes[0]) {
                let prevNode = listNodes[0].previousElementSibling;
                if (startoffset && listNodes[0].dataset.index.split(".").length === 1 && (!prevNode || !prevNode.dataset.index) && !this.vm.editorSetting.normal) {
                    editor.windowManager.alert('所选元素的第一个章标题不能删除，请重新框选元素！');
                    return true;
                }
            }
            if (isBlock) {
                editor.windowManager.alert('所选元素包含页面，不能删除，请重新框选元素！');
                return true;
            }
            if (isTitle && !this.vm.editorSetting.parseStruct) {
                editor.windowManager.alert('所选元素包含页面标题，不能删除，请重新框选元素！');
                return true;
            }
            return false;
        }
        /**
         * 判断元素是否可被删除
         */
        const checkReserve = (currNode) => {
            if (!['#text', 'BR'].includes(currNode.nodeName)) {
                let textContent = currNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
                let prevNode = currNode.previousElementSibling;
                // 是否为页面标题
                if (!prevNode && textContent === '' && !this.vm.editorSetting.parseStruct && ($global.hasClass(currNode, 'header-title') || $global.hasClass(currNode.parentNode, 'header-title'))) {
                    editor.windowManager.alert('页面标题元素不能删除！');
                    return true;
                }
            }
            return false;
        }

        // 快捷键
        editor.shortcuts.add('Meta + E', '', () => {
            var currNode = editor.selection.getNode();
            var parentNode = currNode.parentNode;
            if ($global.hasClass(parentNode, 'ol-list') || $global.hasClass(parentNode, 'appendix-list')) {
                editor.execCommand('chapter', currNode, { type: "8" });
            }
        });
        editor.shortcuts.add('Meta + G', '', () => {
            return false;
        })

        // 键盘按下事件
        // if (this.vm.editorSetting.isStandard) {
        editor.on('keydown', event => {
            // editor = this.getActiveEditor();
            if ((event.isDefaultPrevented() && (event.key !== 'a' && (event.ctrlKey || event.metaKey))) || event.key === 'Meta' || this.vm.editorSetting.reader) { // Meta:windows按键
                return false;
            }
            // console.log('event.key', event.key)
            var stopFlag = false;
            var currNode = editor.selection.getNode();
            var selectedBlocks = editor.selection.getSelectedBlocks();
            // this.removeNode = null;
            this.focusNode = currNode;

            var rng = editor.selection.getRng();
            var parentNode = currNode.parentNode;
            var prevNode = currNode.previousElementSibling;
            var nextNode = currNode.nextElementSibling;
            var text = currNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
            var cls = currNode.getAttribute('class');
            var pageBlock = editor.dom.getParent(currNode, '.info-block');
            var parentClass = parentNode.getAttribute('class');

            // 是否为协同分配章节的
            var assignOutline = this.vm.editorSetting.author ? this.vm.editorSetting.author.assignOutline : false;

            // 如当前页面为禁止编辑则终止
            if ((pageBlock && $global.hasClass(pageBlock, 'disabled')) || (currNode.nodeName === 'P' && currNode.dataset && currNode.dataset.mceBogus)) {
                return false;
            }
            // 当前章标题为禁止编写
            if (cls && cls.match(/(ol-list|appendix-list)/gi) !== null && rng.startContainer.nodeName === '#text' && rng.startContainer.previousElementSibling && editor.dom.nodeIndex(rng.startContainer.previousElementSibling) === 0 && rng
                .startContainer.previousElementSibling.contentEditable === 'false') {
                return false;
            }
            // Enter回车事件
            if (event.key === 'Enter') {
                if (event.ctrlKey || event.metaKey || event.shiftKey) {
                    stopFlag = domUtil.insertParagraph(editor, currNode, event.shiftKey, true);
                } else {
                    if (cls && cls.match(/(ol-list|appendix-list)/g) !== null) {
                        if (!isNaN(currNode.dataset.index) && currNode.dataset.appendixNo && nextNode && nextNode.dataset.appendixNo) { // 航司模板的附录章节
                            console.log('附录主标题后已有条款不可再增加！');
                            return false;
                        } else {
                            if (text === '') {
                                stopFlag = domUtil.toggleLevel(editor, currNode, true);
                            } else {
                                if (this.vm.editorSetting.normal) {

                                }
                            }
                        }
                    } else if (cls && cls.match(/bullet/g) !== null) {
                        if (text === '') {
                            stopFlag = domUtil.removeBullet(editor, currNode);
                        }
                    } else if (cls && cls.match(/(example|examplex|example-x|zhu|zhux|zhu-x)/g) !== null) {
                        if (text === '') {
                            currNode.removeAttribute('class');
                            currNode.removeAttribute('data-type');
                            currNode.removeAttribute('data-number');
                            stopFlag = true;
                        }
                    } else if (currNode.nodeName === 'P' && ($global.hasClass(parentNode, 'footnote') || $global.hasClass(currNode, 'tfooter'))) {
                        stopFlag = true;
                    } else if ($global.hasClass(currNode, 'info-block')) {
                        domUtil.insertParagraph(editor);
                        stopFlag = true;
                    } else if ($global.hasClass(parentNode, 'math-desc')) {
                        domUtil.insertParagraph(editor, currNode, false, true);
                        stopFlag = true;
                    }
                }
            } else if (event.key === 'd' && (event.ctrlKey || event.metaKey)) {
                if ($global.hasClass(currNode, 'ol-list') || $global.hasClass(currNode, 'appendix-list')) {
                    if (currNode.dataset.bookmark) {
                        currNode.removeAttribute('data-bookmark');
                    } else {
                        currNode.setAttribute('data-bookmark', currNode.dataset.outlineid);
                    }
                    stopFlag = true;
                } else if ($global.hasClass(currNode, 'text-box')) { // 快捷合并下一个元素
                    const pageBlock = editor.dom.getParent(currNode, '.info-block');
                    const nextNode = currNode.nextElementSibling;
                    if (nextNode && !['image','table'].includes(nextNode.dataset.type)) {
                        let boxText = currNode.innerText;
                        let nextText = nextNode.innerText;
                        if (/^[A-Zz-z]/.test(nextText)) {
                            nextText = ' ' + nextText;
                        }
                        boxText += nextText;
                        
                        const currLeft = Number(currNode.dataset.left);
                        const nextLeft = Number(nextNode.dataset.left);
                        const subLeft = currLeft - nextLeft;

                        if (subLeft > 0 && (subLeft / 13) >= 2 && (subLeft / 13) <= 3) { // 一个段落行内的
                            let em = (subLeft / 13).toFixed(1);
                            currNode.style.textIndent = em + 'em';
                        }
                        let position = currNode.dataset.position.split('||');
                        position[1] = nextNode.dataset.position;
                        currNode.dataset.position = position.join('||');
                        currNode.innerText = boxText;
                        currNode.style.maxWidth = (Number(pageBlock.dataset.maxLeft) - currLeft) + 'px';
                        nextNode.remove();
                        stopFlag = true;
                    }
                }
            } else if (event.key === 'Delete' && (event.ctrlKey || event.metaKey)) {
                const textBox = editor.dom.getParent(currNode, '.text-box');
                if ($global.hasClass(textBox, 'text-box')) {
                    textBox.remove();
                    stopFlag = true;
                }

            } else if (event.key === 'a' && (event.ctrlKey || event.metaKey)) {
                editor.selection.collapse();
                if (this.vm.editorSetting.parseTable) {
                    this.vm.$emit('change', { act: 'halfWidth', evt:event });
                } else {
                    editor.windowManager.alert('已禁止全选！');
                }
                stopFlag = true;

            } else if (event.key === 'ArrowUp') { // 键盘方向键上移
                let olEle = editor.dom.getParent(currNode, '.ol-list,.appendix-list');
                if (prevNode && !rng.endContainer.previousElementSibling) {
                    stopFlag = prevNode && prevNode.contentEditable === 'false';
                } else {
                    stopFlag = !['#text', 'SPAN', 'EM', 'STRONG'].includes(currNode.nodeName) && !currNode.dataset.outlineid && olEle && olEle.previousElementSibling && olEle.previousElementSibling.contentEditable === 'false';
                }
            } else if (event.key === 'ArrowDown') { // 键盘方向下移
                let olEle = editor.dom.getParent(currNode, '.ol-list,.appendix-list');
                stopFlag = !nextNode && !['#text', 'SPAN', 'EM', 'STRONG'].includes(currNode.nodeName) && !currNode.dataset.outlineid && olEle && olEle.nextElementSibling && olEle.nextElementSibling.contentEditable === 'false';
            } else if (event.key === 'ArrowLeft') { // 方向键左移
                stopFlag = prevNode && prevNode.contentEditable === 'false' && rng.startOffset === 0;
            } else if (event.key === 'ArrowRight') { // 方向键右移
                text = ['#text', 'SPAN', 'EM', 'STRONG'].includes(rng.endContainer.nodeName) ? rng.endContainer.textContent : currNode.textContent;
                let olEle = editor.dom.getParent(currNode, '.ol-list,.appendix-list');
                if (!nextNode && !rng.endContainer.nextElementSibling) {
                    stopFlag = olEle && olEle.nextElementSibling && olEle.nextElementSibling.contentEditable === 'false' && rng.endOffset === text.length;
                }
            } else if (event.key === 'Delete') {
                // debugger
                if (selectedBlocks.length > 1) { // 检查被选中元素多个时不能删除
                    stopFlag = hasfirstLevel(selectedBlocks, rng.startOffset === 0);
                } else { // 保留的元素不能删除
                    stopFlag = checkReserve(currNode);
                }
                if (!stopFlag) {
                    let textLens = currNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').length;
                    if ($global.hasClass(currNode, 'tag other') || (parentClass && parentClass.match(/\ics/g))) {
                        if (rng.startOffset === rng.endOffset && rng.endOffset === textLens) {
                            stopFlag = true;
                        }
                    } else if (cls && cls.match(/(ol-list|appendix-list)/gi) !== null) {
                        let liIndex = domUtil.getLevelIndex(parentNode, currNode);
                        // 第一个章标题或条目不能处理
                        if (liIndex === 0 && rng.startOffset === rng.endOffset && rng.endOffset === currNode.firstChild.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').length) {
                            stopFlag = !$global.hasClass(currNode, 'hide-list');
                        } else {
                            if (rng.startOffset === rng.endOffset && rng.endOffset === textLens) {
                                if (!nextNode) {
                                    stopFlag = true;
                                } else {
                                    stopFlag = nextNode.contentEditable === 'false';
                                }

                            } else if (currNode.firstChild && currNode.firstChild.nodeName === '#text' && currNode.firstChild.nextElementSibling && currNode.firstChild.nextElementSibling.nodeName === 'P' && currNode.firstChild
                                .nextElementSibling.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '') {
                                currNode.firstChild.nextElementSibling.remove();
                                stopFlag = true;
                            }
                        }
                    } else if (currNode.nodeName === 'IMG' && $global.hasClass(currNode, 'math-img') && (parentNode.nodeName === 'P' || parentNode.nodeName === 'FIGURE')) {
                        parentNode.remove();
                        stopFlag = true;
                    }/* else if ($global.hasClass(currNode, 'table-title')) {
                        stopFlag = true;
                    } else if (rng.startOffset === rng.endOffset && !currNode.nextElementSibling) {
                        stopFlag = true;
                    }*/
                }

            } else if (event.key === 'Backspace') {
                if (selectedBlocks.length > 1) { // 检查章节条款选中元素不能删除
                    stopFlag = hasfirstLevel(selectedBlocks, rng.startOffset === 0);
                } else if (cls && cls.match(/(ol-list|appendix-list)/gi) !== null && rng.startOffset === 0 && editor.dom.nodeIndex(currNode) === 0 && !this.vm.editorSetting.parseStruct) {
                    if (this.vm.editorSetting.isStandard) {
                        stopFlag = true;
                    }
                } else if (($global.hasClass(currNode, 'enlock') || currNode.dataset.owner) && rng.startOffset === 0) { // 被分配的章节条目不能删除
                    editor.windowManager.alert('已被分配的章节条目不能删除');
                    stopFlag = true;
                } else if ((!prevNode || !$global.hasClass(prevNode, 'enlock')) && rng.startOffset === 0 && rng.startContainer.nodeName !== '#text' && $global.hasClass(rng.startContainer, 'enlock')) { // 被分配的章节，且为第一个
                    stopFlag = true;
                } else if (prevNode && prevNode.nodeName === 'TABLE' && currNode.nodeName === 'P' && currNode.innerText.trim() == '' ){ // 解决表格后面的段落删除不掉的问题
                    currNode.remove();
                } else { // 保留的元素不能删除
                    if (prevNode && $global.hasClass(prevNode, 'enlock')) {
                        this.focusNode = prevNode;
                    }
                    if (this.vm.editorSetting.isStandard) {
                        stopFlag = checkReserve(currNode);
                    }
                }
                if (!stopFlag) {
                    // 章标题不能删除
                    if (cls && cls.match(/(ol-list|appendix-list)/gi) !== null && !this.vm.editorSetting.parseStruct) {
                        // 需要减少的层级
                        let changeLevel = currNode.dataset.index.split(".").length - 2;
                        let liIndex = domUtil.getLevelIndex(parentNode, currNode);
                        if (rng.startOffset === 0 && rng.endOffset === 0 && rng.endOffset === currNode.firstChild.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').length) {
                            if (liIndex === 0) {
                                if ($global.hasClass(currNode, 'appendix-list')) {
                                    var newParagraph = editor.dom.create('p', { style: 'text-indent:2em;' }, '&#8203');
                                    // 附录条目后是否有其他条目
                                    if (nextNode && $global.hasClass(nextNode, 'appendix-list')) {
                                        nextNode.dataset.source = currNode.dataset.source;
                                        nextNode.dataset.index = currNode.dataset.index;
                                    }
                                    editor.dom.insertAfter(newParagraph, currNode);
                                    currNode.remove();
                                    editor.undoManager.add();
                                }
                            } else {
                                // 如果是被分配了章节则直接做删除处理，否则章节条目减少层级
                                if (!assignOutline) {
                                    editor.undoManager.transact(() => {
                                        domUtil.setIndent(editor, currNode, true);
                                        return false;
                                    });
                                } else {
                                    editor.undoManager.transact(() => {
                                        domUtil.toggleLevel(editor, currNode, true, false, 0); // 0 changeLevel <= 1 ? 0 : changeLevel
                                        return false;
                                    });
                                }
                                stopFlag = true;
                            }
                            stopFlag = !$global.hasClass(currNode, 'hide-list');
                        } else if (rng.startOffset === 0 && rng.endOffset === 0) {
                            if (!assignOutline) {
                                editor.undoManager.transact(() => {
                                    domUtil.setIndent(editor, currNode, true);
                                });
                            } else {
                                editor.undoManager.transact(() => {
                                    domUtil.toggleLevel(editor, currNode, true, false, changeLevel <= 1 ? 0 : changeLevel);
                                });
                            }
                            stopFlag = true;
                        } else if (rng.startOffset === rng.endOffset && text === '' && this.vm.editorSetting.normal) {
                            domUtil.setIndent(editor, currNode, true);
                            // domUtil.toggleLevel(editor, currNode, true, false, changeLevel <= 1 ? 0 : changeLevel);
                            stopFlag = true;
                        } else {
                            var rngParentNode = rng.startContainer.parentNode;
                            if (rngParentNode.firstChild.nodeName === 'SPAN' && rngParentNode.firstChild.contentEditable === 'false') {
                                stopFlag = true;
                            }
                        }
                    } else if (cls && cls.match(/bullet/g)) {
                        if (rng.startOffset === 0) {
                            var nodeText = currNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '');
                            var newParagraph = editor.dom.create('p', { style: 'text-indent:2em;' }, nodeText || '&#8203');
                            editor.dom.insertAfter(newParagraph, currNode);
                            currNode.remove();
                            domUtil.moveSelectionToElement(editor, newParagraph, true);
                            stopFlag = true;
                        }
                    } else if (cls && cls.match(/(tag|img-title|table-title)/g) && !$global.hasClass(currNode, 'other')) {
                        if (rng.startOffset === 0 && !this.vm.editorSetting.parseTable) {
                            editor.dom.removeAllAttribs(currNode);
                            if (cls.match(/zhux|zhu-x|examplex|example-x/i)) {
                                domUtil.refreshTagByNumber(editor, currNode);
                            } else if (cls.match(/tfooter|tfooter-x/i)) {
                                domUtil.refreshFooterNumber(editor, currNode);
                            } else if (cls.match(/img-title/i)) {
                                domUtil.resetImageByNumber(editor);
                            } else if (cls.match(/table-title/i)) {
                                tableUtil.resetTableTitleByNumber(editor);
                                currNode.remove();
                            }
                            stopFlag = true;
                        }
                    } else if (currNode.nodeName === 'IMG' && $global.hasClass(currNode, 'math-img')) {
                        parentNode.remove();
                        editor.undoManager.add();
                    } else if (($global.hasClass(parentNode, 'ol-list') || $global.hasClass(parentNode, 'appendix-list')) && prevNode && prevNode.nodeName === 'SPAN' && prevNode.contentEditable === 'false') {
                        if (currNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '') === '') {
                            currNode.remove();
                            stopFlag = true;
                        } else {
                            stopFlag = rng.startOffset === 0;
                        }
                    } else if (currNode.nodeName === 'P' && ($global.hasClass(parentNode, 'ol-list') || $global.hasClass(parentNode, 'appendix-list'))) {
                        // 判断是否为第一个实体元素
                        /* if (prevNode && prevNode.nodeName === '#text' && prevNode === parentNode.firstChild && rng.startOffset === 0) {
                            prevNode.textContent += currNode.textContent;
                            currNode.remove();
                            stopFlag = true;
                        } */
                    }
                    // this.removeNode = currNode;
                    // console.log('removeNode ', this.removeNode)
                }

                // Tab 缩进
            } else if (event.key === 'Tab') {
                // debugger
                if (event.shiftKey) {
                    domUtil.setIndent(editor, currNode, true, true);
                } else {
                    if (currNode.nodeName === 'P' && currNode.className.match(/\zhu|\zhux|example|\examplex|\tfooter/ig === null)) {
                        if ((editor.settings.toolbar1 && editor.settings.toolbar1.match(/\indent2em/ig) !== null) || (editor.settings.toolbar2 && editor.settings.toolbar2.match(/\indent2em/ig) !== null)) {
                            let indentValue = 2;
                            let textIndent = editor.dom.getStyle(currNode, 'text-indent');
                            if (textIndent) {
                                indentValue = parseInt(textIndent) + 2;
                            }
                            editor.dom.setStyle(currNode, 'text-indent', `${indentValue}em`);
                        }
                    } else if (currNode.nodeName === 'LI') {
                        let liLevel = currNode.dataset.level ? parseInt(currNode.dataset.level) : 0;
                        if (liLevel<7) {
                            currNode.dataset.level = liLevel + 1;
                        }
                    } else {
                        domUtil.setIndent(editor, currNode, false, true);
                    }
                }
                stopFlag = true;
                // 保存正文内容
            } else if (event.key.toLowerCase() === 's' && (event.ctrlKey || event.metaKey)) {
                this.vm.changeEvent({ act: 'save' });
                stopFlag = true;
            }
            // 阻止事件
            if (stopFlag) {
                this.stopPropagation(event);
                return false;
            }
        });

        // 键盘弹起事件
        editor.on('keyup', event => {
            if (this.vm.editorSetting.reader) {
                return false;
            }
            // editor = this.getActiveEditor();
            var stopFlag = false;
            var currNode = editor.selection.getNode();
            var parentNode = currNode.parentNode;
            var nextNode = currNode.nextElementSibling;
            var cls = currNode.getAttribute('class');
            var parentClass = parentNode.getAttribute('class');
            var rng = editor.selection.getRng();

            /* console.log('keyup', event.key)
            debugger */
            if (event.key === 'Process') {
                // console.log('Process', event.key)
                if (this.compositionend) {
                    editor.nodeChanged();
                }
                // Enter 回车
            } else if (event.key === 'Enter') {
                if (event.ctrlKey || event.metaKey) {
                    if (parentClass && parentClass.match(/math-desc/g)) { // 公式变量
                        editor.dom.insertAfter(currNode, parentNode);
                        editor.focus(true);
                        stopFlag = true;
                    }
                } else if (event.shiftKey) {
                    /* if (parentClass && parentClass.match(/(ol-list|appendix-list)/g)) {
                        let newOl = domUtil.appendLevel(editor, currNode, true);
                        domUtil.moveSelectionToElement(editor, newOl);
                    } */
                } else {
                    if (cls && cls.match(/(ol-list|appendix-list)/g)) {
                        if (!isNaN(currNode.dataset.index) && currNode.dataset.appendixNo && nextNode && nextNode.dataset.appendixNo) {
                            return false;
                        } else {
                            editor.undoManager.transact(() => {
                                domUtil.setNewLevel(editor, currNode);
                                return false;
                            });
                        }
                        stopFlag = true;
                    } else if (cls && cls.match(/bullet/g)) {
                        editor.undoManager.transact(() => {
                            domUtil.setNewBullet(editor, currNode);
                        })
                    } else if (parentClass && parentClass.match(/bullet/g)) {
                        if (!/^(P|DIV)$/.test(currNode.nodeName) || !/^(P|DIV)$/.test(this.focusNode.nodeName)) {
                            if (parentNode.firstChild && /^(P|DIV)$/.test(parentNode.firstChild.nodeName)) {
                                let textNde = editor.dom.create('br', {}, '');
                                $global.prependChild(textNde, parentNode);
                            }
                            editor.undoManager.transact(() => {
                                domUtil.setNewBullet(editor, parentNode);
                            })
                        } else if (currNode.nodeName === 'P' && $global.hasClass(currNode, 'tag')) {
                            domUtil.refreshTagByNumber(editor, currNode)
                        }
                    } else if (cls && cls.match(/tfooter/g)) {
                        // domUtil.resetTablefooter(parentNode);
                        domUtil.refreshFooterNumber(editor, currNode);
                        /* } else if (cls && cls.match(/pfooter/g)) {
                            domUtil.resetPfooterIndex(parentNode); */
                    } else if (currNode.nodeName === 'SPAN' && $global.hasClass(currNode, 'tag')) {
                        parentNode.removeAttribute('style');
                        parentNode.removeAttribute('data-mce-style');
                    } else if (currNode.nodeName === 'P') {
                        if (!$global.hasClass(currNode, 'tag') && !$global.hasClass(currNode, 'imgfooter')) {
                            // 去除属性
                            if (this.vm.editorSetting.isStandard) {
                                editor.execCommand('RemoveFormat', false);
                            }
                            if (parentClass && parentClass === 'math-desc' && !nextNode) { // 如果是在公式变量中的且为最后一个元素则直接置入之后
                                $global.insertAfter(currNode, parentNode);
                                domUtil.moveSelectionToElement(editor, currNode);
                                stopFlag = true;
                            }
                        } else {
                            // 注|注X|示例|示例X .replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '') === ''
                            if (cls.match(/\zhu|\zhux|\zhu-x|\example|\examplex|\example-x/ig)) {
                                if (currNode.textContent === '') {
                                    currNode.innerHTML = '&#8203';
                                }
                                currNode.removeAttribute('data-start');
                                currNode.removeAttribute('data-restart');
                                domUtil.moveSelectionToElement(editor, currNode);
                                // 重置序号
                                domUtil.refreshTagByNumber(currNode, editor);
                            }
                        }
                        // 更新下层级项编号
                        domUtil.afterEnterByLevel(editor, currNode);
                    } else if (/^(SPAN|EM)$/.test(currNode.nodeName) && parentNode.nodeName === 'P' && currNode.textContent.replace(/\s/g, '') === '') {
                        parentNode.innerHTML = '<br/>';
                    } else if ($global.hasClass(currNode, 'info-block') && !$global.hasClass(currNode, 'fixed') && !$global.hasClass(currNode, 'disabled')) {
                        editor.execCommand('mceInsertContent', false, '<p style="text-indent: 2em;"></p>');
                    }
                    // editor.undoManager.add();
                }
                // 回退
            } else if (event.key === 'Backspace' || event.key === 'Delete') {
                // debugger
                if (cls && cls.match(/(ol-list|appendix-list)/gi) !== null) {
                    if (rng.startOffset === 0 && rng.endOffset == 0 && editor.dom.nodeIndex(currNode) === 0 && currNode.textContent.replace(/\s/g, '') === '') {
                        if (!currNode.firstChild || currNode.firstChild !== '#text') {
                            currNode.innerHTML = '&#8203' + currNode.innerHTML;
                        }
                        return false;
                    }
                    domUtil.afterRemoveNodes(editor, true, currNode, rng.startOffset === rng.endOffset);
                } else if ($global.hasClass(currNode, 'tag other')) {
                    // 不能清掉已被标签过的元素
                    let textLens = currNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').length;
                    if (rng.startOffset === rng.endOffset && rng.startContainer === rng.endContainer && textLens === 0) {
                        currNode.textContent = "";
                    }
                } else if ($global.hasClass(parentNode, 'text-box')) { // 删除文本框
                    let textBoxChilds = Array.from(parentNode.childNodes);
                    let isDelete = true;
                    for (let i = 0; i < textBoxChilds.length; i++) {
                        let textChild = textBoxChilds[i];
                        if (!['EM', '#text'].includes(textChild.nodeName)) {
                            if (textChild.querySelector('img') || textChild.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') !== '') {
                                isDelete = false;
                                break;
                            }
                        }
                    }
                    if (isDelete) {
                        editor.windowManager.confirm("确定删除该文本框？", (flag) => {
                            if (flag) {
                                parentNode.remove();
                            }
                        })
                    }
                } else if (currNode.nodeName === 'P' && currNode.dataset.tag && currNode.dataset.tag==='clause') {
                    if (currNode.textContent === '') {
                        currNode.removeAttribute('data-tag');
                        currNode.removeAttribute('data-content');
                    }

                } else if (currNode.nodeName === 'P' && currNode.dataset.mceCaret && currNode.dataset.mceBogus) { // 光标元素对象
                    if (this.focusNode) {
                        domUtil.moveSelectionToElement(editor, this.focusNode);
                    }
                    editor.focus(true);
                    stopFlag = true;

                } else {
                    if (cls && cls.match(/(ol-list|appendix-list)/g) !== null) {
                        domUtil.afterRemoveLevel(editor, currNode);
                    } else if (cls && cls.match(/bullet/g) !== null) {
                        domUtil.afterRemoveBullet(editor, currNode);
                    }
                }
                // 提取下层页面元素
                pageUtil.resetPageBreak(editor.dom.getParent(currNode, '.info-block'));
                // TAB切换
            } else if (event.key === 'Tab') {
                // domUtil.setIndent(editor, currNode, event.shiftKey);
            }
            // console.log('keyup', event)
            this.focusNode = null;
            if (stopFlag) {
                this.stopPropagation(event);
                return false;
            }
        });
        // }
    },

    // changeLevelLens 是否变动了章节条款数
    resetChangeNode(editor, pageContainer, updateOutline=false) {
        editor = editor || this.getActiveEditor();
        pageContainer = pageContainer || editor.getBody().querySelector('.page-container');

        // 封面发布单位（如果字符太长则改变字体大小）
        if (this.vm.editorSetting.isStandard) {
            domUtil.resetDepartment(editor);
        }

        // 处理目录页
        if (!this.vm.editorSetting.setTemplate && !this.vm.editorSetting.parseStruct) {
            // 处理自动分页
            if (!this.vm.editorSetting.page || !this.vm.editorSetting.page.expand) {
                pageUtil.setPageBreak(event);
            }
            // 处理目录页
            let cataData = $global.getStroage('myCatalogue', true) || this.vm.editorSetting.catalogues;
            pageUtil.autoSetCatalogue(cataData);
        }

        if (!this.vm.editorSetting.parseStruct && !this.vm.editorSetting.parseTable && updateOutline) {
            // 重置层级项编号规则,修改性能
            domUtil.resetLevelByChange(editor);
        }

        // 重置空段落
        pageUtil.resetEmptyParagraph(pageContainer, true);
        // 重置表格单元格高度
        // tableUtil.resetTableHeight(editor);
        // 重置列项序号,修改性能
        pageUtil.resetBulletNumbers(pageContainer, true);
        // 重置脚注序号
        domUtil.resetFooterNoteIndex(editor);
        // 重置注X|示例X序号,修改性能
        domUtil.resetTagByNumber();
        // 重置图编号
        domUtil.resetImageByNumber(editor);
        // 重置公式编号
        domUtil.resetMathNumIndex(editor);

        if (!this.vm.editorSetting.parseStruct && !this.vm.editorSetting.parseTable) {
            // 重置表格编号和单元格对齐方式, 非解析表格模式,修改性能
            tableUtil.resetTableTitleByNumber(editor);
            // 清理多余或空白的SPAN元素,修改性能
            domUtil.clearSpan(editor);
        }
        // 代码区重置可编写
        domUtil.resetPreCodes(editor);
        // 所有标签重置
        // domUtil.resetTagOthers(editor);
        // 正文内容更新后处理
        this.vm.changeContent(updateOutline);

        // this.processingUtil = false;
    },

    /**
     * @description 更新页面页眉
     * @param {Element}  pageContainer
     * @param {String}  pageNo
     */
    setPageNo(pageContainer = null, pageNo = '') {
        var blocks = pageContainer.querySelectorAll('.info-block[data-no]');
        blocks.forEach(blcok => {
            blcok.dataset.no = pageNo;
        })
    },
    /**
     * @description 阻止事件冒泡
     * @param {Object} event
     */
    stopPropagation(event) {
        event.stopPropagation();
        event.preventDefault();
        return false;
    },

    /**
     * @description 初始化空白页面时检查页面基础元素内容
     * @param {Object} editor
     */
    checkHtmlContent(editor = null) {
        editor = this.getActiveEditor();
        var pageContainer = editor.getBody().querySelector('.page-container');
        if (!pageContainer) {
            var htmlContent = `<div class="page-container" data-id="${$global.guid()}">
                <div class="info-block struct" data-outline="1" data-id="73771cba-f7e1-4261-806e-66269e2bdf39" data-pagesize="A4" data-pagenum="1">
                    <p>请输入内容...</p>
                </div>
            </div>`;
            editor.execCommand('mceInsertContent', false, htmlContent);
        }
    },
    /**
     * @description 页面标题强制加上空格
     * @param {Element} pNode
     */
    setHeaderTitle(pNode = null) {
        // 处理页面的标题,只有2个字符的且不包含英文或字母
        /* let txt = pNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '');
        if (txt.length === 2 && /^[\u4E00-\u9FA5]+$/.test(txt) && pNode.textContent.split(/\s/).length !== 4) {
            pNode.innerHTML = txt.split("").join('&nbsp;&nbsp;');
        } else {
            if (this.vm.editorSetting.titleSpace) {
                pNode.innerHTML = txt.split("").join('&nbsp;');
            }
        } */
    }

}
