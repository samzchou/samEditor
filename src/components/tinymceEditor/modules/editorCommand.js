/**
 * =================================================
 * @module
 * @desc 编辑器指令模块
 * @author sam 2021-12-28
 * =================================================
 */
// import $bus from "@/utils/bus";
import $global from "@/utils/global";
// import { pageLayout } from "../configs/editorOptions";
import domUtil from "../utils/domUtil";
import tableUtil from "../utils/tableUtil";
import pageUtil from "../utils/pageUtil";
import levelUtil from "../utils/levelUtil";
// 文字转拼音
import chinesePY from "@/utils/chinesePY";
// 文档校验
import validateDocument from "../utils/validateDocument";
// 列项处理
import bulletUtil from "../utils/bulletUtil";

export default {
    editor: null,
    vm: null,
    pasteNode: null,
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
     * @description 初始化模块
     * @param {Object} editor
     * @param {Object} vm
     */
    init(editor, vm) {
        this.vm = vm;
        pageUtil.init(editor, vm);

        // 插入复制的条目元素
        editor.addCommand('insertNode', (item, currNode) => {
            editor = this.getActiveEditor();
            var block = editor.dom.getParent(currNode, '.info-block');
            var copedNodes = window.tinyMCE.copyed;
            if (copedNodes && copedNodes.length) {
                var liNode = editor.dom.getParent(currNode, '[data-index]');
                if (liNode.dataset.index.split('.').length === 1 && item.act === 'before') {
                    editor.windowManager.alert('不可在章标题之前插入条目！');
                    return;
                }
                var prevNode = liNode;
                var firstNode = copedNodes[0];
                var isCover = liNode.dataset.index === firstNode.dataset.index;
                if (isCover) {
                    editor.windowManager.confirm("复制的条题将覆盖当前的条题，确定继续？", (flag) => {
                        if (flag) {
                            // 第一个节点覆盖
                            liNode.innerHTML = firstNode.innerHTML;
                            for (let i = 1; i < copedNodes.length; i++) {
                                let node = copedNodes[i].cloneNode(true);
                                let sameNode = block.querySelector(`[data-index="${node.dataset.index}"]`);
                                if (sameNode) {
                                    sameNode.innerHTML = node.innerHTML;
                                    prevNode = sameNode;
                                } else {
                                    editor.dom.insertAfter(node, prevNode);
                                    prevNode = node;
                                }
                            }
                        }
                    })
                } else {
                    for (let i = 0; i < copedNodes.length; i++) {
                        let node = copedNodes[i].cloneNode(true);
                        if (i === 0) {
                            if (item.act === 'before') {
                                block.insertBefore(node, prevNode);
                            } else {
                                editor.dom.insertAfter(node, prevNode);
                            }
                        } else {
                            editor.dom.insertAfter(node, prevNode);
                        }
                        prevNode = node;
                    }
                }
                levelUtil.sortLevel(editor);
                // 结束后清除
                delete window.tinyMCE.copyed;

            } else {
                return this.vm.alertMsg('copyEntry', '请先复制条目元素！');
            }
        });

        // var isInputing = false;
        editor.on('compositionstart', event => {
            isInputing = true;
        });
        editor.on('compositionend', event => {
            setTimeout(() => {
                isInputing = false;
            }, 500);
        });

        editor.addCommand('codeChange', () => {
            this.vm.setImgSize();
            /*setTimeout(() => {
                debugger
                vm.arrangeHtml();
            }, 2000)*/
        });

        editor.addCommand('clearMaths', () => {
            this.vm.latexCode = '';
        });

        // 扩展插件的事件监听
        editor.addCommand('bztonCmd', (ui, value) => {
            editor = this.getActiveEditor();
            console.log('bztonCmd', ui, value);
            // console.log('vm.editorSetting', vm.editorSetting.author.commitId)
            var currNode = editor.selection.getNode();
            switch (value) {
                // 解锁页面
                case 'unlock':
                    pageUtil.unlockPage();
                    break;
                    // 文档分页
                case 'breakPage':
                    pageUtil.autoPageBreak(false).then(res => {
                        this.vm.$emit('change', { act: 'breakPage', result:res });
                    });
                    break;
                    // 复制节点
                case 'copyEntry':
                    var liNode = editor.dom.getParent(currNode, '[data-index]');
                    if (liNode) {
                        // 同时复制子条目
                        var copyNodes = domUtil.copyLevelNodes(editor, liNode);
                        // console.log('copyNodes=>', copyNodes)
                        window.tinyMCE.copyed = copyNodes;
                    } else {
                        return this.vm.alertMsg('copyEntry', '非条目元素，不能复制！请将光标置于条目中。');
                    }
                    break;
                    // 插入特殊字符
                case 'showCharmap':
                    editor.execCommand('mceShowCharmap');
                    break;
                    // 比较内容
                case 'compare':
                    var block = editor.dom.getParent(currNode, '.info-block');
                    var pos = editor.dom.getPos(block);
                    this.vm.changeEvent({ 'act': 'compare', top: pos.y, page: block });
                    break;
                case 'insertNode':
                    break;
                    // 新增封面页
                case 'addCover':
                    if (this.vm.editorSetting.author.commitId) {
                        return this.vm.alertMsg('commitId');
                    }
                    pageUtil.addCoverPage();
                    break;
                case 'chapterWord':
                    if (this.vm.editorSetting.author.commitId) {
                        return this.vm.alertMsg('commitId');
                    }
                    pageUtil.addChapterPage();
                    break;
                    // 新增前言\引言\参考蚊香\索引页
                case 'prefaceWord':
                case 'introWord':
                case 'referenceWord':
                case 'indexWord':
                    if (this.vm.editorSetting.author.commitId) {
                        return this.vm.alertMsg('commitId');
                    }
                    this.vm.addOtherPage(value);
                    break;
                case 'addendixWord':
                    if (this.vm.editorSetting.author.commitId) {
                        return this.vm.alertMsg('commitId');
                    }
                    this.vm.addAppendixPage();
                    break;
                case 'insertParagraph':
                    domUtil.insertParagraph(editor, currNode);
                    break;
                case 'validatDms':
                    this.vm.changeEvent({ act: 'validatDms' });
                    setTimeout(() => {
                        validateDocument.validateElement(editor, vm);
                    }, 200);
                    break;
                    // 知识图谱
                case 'readDoc':
                case 'knowledgeGraph':
                    this.vm.changeEvent({ act: value });
                    break;
                    // 删除Node节点
                case "cut":
                    let docCfg = editor.settings.doc_config;
                    if (docCfg.setTemplate || docCfg.parseStruct) {
                        if ($global.hasClass(currNode, 'tag other')) {
                            currNode.parentNode.remove();
                        } else {
                            currNode.remove();
                        }
                        editor.undoManager.add();
                        return;
                    }
                    currNode = editor.dom.getParent(currNode, '.text-box');
                    if (currNode) {
                        currNode.remove();
                        editor.undoManager.add();
                    }
                    break;
                case 'version':
                case 'help':
                    var url = tinymce.baseURL + `/${value}`;
                    editor.windowManager.openUrl({
                        title: value === 'version' ? '版本说明' : '使用帮助',
                        size: 'large',
                        width: value === 'version' ? 450 : 700,
                        height: value === 'version' ? 250 : 500,
                        url,
                        buttons: [{
                            type: 'cancel',
                            text: 'Close'
                        }]
                    });
                    break;
                    // 关闭编辑器
                case 'close':
                    this.vm.changeEvent({ act: 'closeEditor' });
                    break;
                    // 标题块（须插入到页面头部最先处位置）
                case 'titleBlock':
                    let flag = true;
                    if (currNode && flag) {
                        var infoBlock = editor.dom.getParent(currNode, '.info-block');
                        var titleNode = infoBlock.querySelector('.header-title');
                        // 如果已存在标题则插入到最后
                        if (titleNode) {
                            editor.dom.add(titleNode, 'p', { class: 'sub-title', contenteditable: 'true' }, '副标题名称');
                        } else {
                            var uuid = $global.guid();
                            var parentId = infoBlock.dataset.outlineid;
                            var titleEle = editor.dom.create('div', { 'class': 'header-title chapter', 'data-id': uuid, 'data-parentid': parentId, 'data-contentid': $global.guid() }, '<p>标题名称</p>');
                            $global.prependChild(titleEle, infoBlock);
                        }
                    }
                    break;
                case 'toggleImageTitle':
                    var tableNode = editor.dom.getParent(currNode, 'table');
                    if (tableNode) {
                        editor.windowManager.alert('表格内不能定义图标题！');
                        return;
                    }
                    domUtil.appendImageTitle(editor, currNode, { act: 'number' });
                    break;
                case 'toggleTableTitle':
                    var tableNode = editor.dom.getParent(currNode, 'table');
                    if (tableNode) {
                        tableUtil.toggleTitle(editor, tableNode);
                    }
                    break;
                case 'insertCheckList':
                    editor.execCommand('mceInsertContent', false, `<input type="checkbox" />&#8203`);
                    break;
                case 'quickOutComment': // 批注
                case 'quickOutReview': // 审阅
                case 'quickOutFeedback': // 反馈
                case 'addTag': // 添加标签
                    this.vm.changeEvent({ 'act': value });
                    break;
                case 'removeTag': // 移除标签
                    this.vm.changeEvent({ 'act': value, tagId:ui });
                    break;
                case 'clearFormat':
                    editor.windowManager.confirm('将清除文档中所有定义的标签或其他样式，确定继续？', flag => {
                        if (flag) {
                            domUtil.clearAllFormat();
                        }
                    });
                    break;
            }
        });

        // 拆分表格
        editor.addCommand('separateTable', (currNode, type) => {
            // debugger
            switch(type) {
                case 0:// 合并下一个表格
                    const tableNode = editor.dom.getParent(currNode, 'table');
                    if (tableNode) {
                        tableUtil.mergeNextTable(tableNode);
                    }
                    break;
                case 1:// 拆分行
                    tableUtil.separateTableByRow(editor, currNode);
                    break;
                case 2:// 拆分列
                    tableUtil.separateTableByCol(editor, currNode);
                    break;
                case 3:// 平均分布列宽
                    tableUtil.averageCols(editor, currNode);
                    break;
            }

        });

        // 重置目次的选项
        editor.addCommand('toggleCatalogue', (obj, value) => {
            $global.setStroage('myCatalogue', obj, true);
            // var catalogues = editor.settings.doc_config.catalogues;
            editor.settings.doc_config.catalogues = obj;
            // console.log('toggleCatalogue', obj, value)
            pageUtil.autoSetCatalogue(obj);
        });

        // 编辑器语言切换
        editor.addCommand('setLanguage', (data, currNode) => {
            this.vm.changeLanguage(data.act);
        });

        // 文档目次显示或关闭
        editor.addCommand('setCatalogue', (data, currNode) => {
            pageUtil.resetCatalogue(data.act === 'show');
        });

        // 分割页面
        editor.addCommand('pageSplit', (currNode) => {
            var element = editor.dom.getParent(currNode, 'table') || editor.dom.getParent(currNode, 'p') || editor.dom.getParent(currNode, 'div');
            if (element) {
                pageUtil.splitPage(element)
            }
        });
        // 文档分页
        editor.addCommand('breakPage', (data, currNode) => {
            // 当前页分页 || 所有页面分页
            // this.vm.loadingTimes = 20 * 60 * 1000;
            this.vm.onLoading('文档分页中，请等候完成！', true, 20 * 60 * 1000);
            pageUtil.autoPageBreak(data.act === 'all').then(res => {
                this.vm.$emit('change', { act: 'breakPage', result:res });
            });
        });

        // 合并文档页面
        editor.addCommand('mergePage', (data, currNode) => {
            if (data.act === 'next') { // 合并下页
                let block = editor.dom.getParent(currNode, '.info-block');
                let merged = pageUtil.mergeNextPage(block);
                console.log('mergePage=>', merged)
            } else { // 合并所有页面
                this.vm.loadingTimes = 300000;
                this.vm.onLoading('合并页面中，请等待完成！', true, 300000);
                pageUtil.mergeAllPages().then(pageContainer => {
					this.vm.$message.success('文档已合并！');
					this.vm.scrollTop({top:0});
                });
            }
        });

        // 全屏模式
        editor.addCommand('mceFullScreen', data => {
            this.vm.changeEvent({ act: 'fullScreen' });
        });

        // 插入页面 ,insertToc,insertBefore,insertAfter
        editor.addCommand('insertPage', (data, currNode) => {
            const block = editor.dom.getParent(currNode, '.info-block');
            const pageContainer = editor.getBody().querySelector('.page-container');
            console.log(data)
            switch(data.act) {
                case 'insertCover': // 插入封面页
                    const coverPage = editor.dom.create('div', { class: 'info-block cover fixed' }, '<p>封面</p>');
                    if (!pageContainer.querySelector('.cover')) {
                        pageContainer.insertBefore(coverPage, pageContainer.firstChild);
                    } else {
                        this.vm.$message.warning('Cover Page already exists');
                    }
                    break;
                case 'insertToc': // 插入目录页
                    const tocPage = editor.dom.create('div', { class: 'info-block catalogue fixed' }, '<div class="header-title" contenteditable="false">目&nbsp;&nbsp;&nbsp;&nbsp;录</div><div class="catalogue-list"></div>');
                    // 判断是否已经存在
                    if (!pageContainer.querySelector('.catalogue')) {
                        const coverPage = pageContainer.querySelector('.cover');
                        if (coverPage) {
                            $global.insertAfter(tocPage, coverPage);
                        } else {
                            pageContainer.insertBefore(tocPage, pageContainer.firstChild);
                        }
                    } else {
                        this.vm.$message.warning('Toc Page already exists');
                    }
                    break;
                // case 'insertBefore':
                case 'insertEmpty':
                    const newBlock = block.cloneNode();
                    newBlock.dataset.prentid = pageContainer.dataset.outlineid;
                    newBlock.dataset.outlineid = $global.guid();
                    newBlock.innerHTML = '<p>请输入内容</p>'
                    /*if (data.act === 'insertBefore') {
                        pageContainer.insertBefore(newBlock, block);
                    } else {
                        $global.insertAfter(newBlock, block);
                    }*/
                    $global.insertAfter(newBlock, block);
                    break;
            }
        });

        // 打开文档
        editor.addCommand('openHtml', (data = {}, stdKind = '0', type = 0) => {
            var file = this.vm.uploadFile;
            var extFileName = $global.getExt(file.name).toLowerCase();
            if (!extFileName.match(/(doc|docx|wps)/i) && data.type === 0) {
                editor.windowManager.confirm("非WORD文档！请选择doc、docx、wps文件，重新选择？", s => {
                    if (s) {
                        editor.execCommand('openWordFile', type);
                    }
                })
                return;
            }
            this.vm.parseDocToHtml(file, data);
        });

        // 测试本地文档的导入
        editor.addCommand('testDoc', () => {
            this.vm.parseDocToHtml('');
        });

        // 新建标准文档
        editor.addCommand('newStandard', type => {
            if (!type) {
                var htmlContent = `<div class="page-container"><div class="info-block"><p>请输入内容...</p></div></div>`;
                editor.resetContent(htmlContent);
            } else {
                this.vm.clearDocToAddNew(type);
            }
        });

        // 章节题条(有题条|无题条)
        editor.addCommand('articleTitle', (data, currNode) => {
            let olEle = editor.dom.getParent(currNode, '.ol-list') || editor.dom.getParent(currNode, '.appendix-list');
            if (!olEle) {
                editor.windowManager.alert('条题只能用于章节的条目上！请参照帮助文档');
                return;
            }
            // 设为有题条
            if (data.act) {
                olEle.dataset.bookmark = olEle.dataset.id || olEle.dataset.outlineid;
                // 设为无题条
            } else {
                olEle.removeAttribute('data-bookmark');
            }
        });
        // 设定条标题
        editor.addCommand('entryTitle', (data, currNode) => {
            console.log('entryTitle', data, currNode);
        });
        // 设定|删除索引项
        editor.addCommand('setIndexTag', data => {
            var textSplit = data.text ? data.text.split("") : [];
            var firstText = textSplit[0] || '';
            var letter = firstText.toUpperCase();
            // 转换为拼音的首字母
            var reg = new RegExp("[\\u4E00-\\u9FFF]+", "g");
            if (firstText && reg.test(firstText)) {
                letter = chinesePY.GetJP(firstText);
            }
            data.nodes.forEach(node => {
                node.removeAttribute('data-mscBogus');
                node.removeAttribute('data-mscIndex');
                node.dataset.tag = JSON.stringify({
                    type: 'index',
                    text: data.text,
                    letter
                });
            });
            pageUtil.autoSetIndexTag();
        });

        // 章标题切换
        editor.addCommand('toggleChapterTitle', (currNode, item) => {
            if (currNode.nodeName === 'P') {
                var olEle = domUtil.appendLevel(editor, currNode);
                if (olEle) {
                    pageUtil.moveSelectionToElement(olEle);
                }
            }
        });
        // 标签设置
        editor.addCommand('references', (item, currNode) => {
            item.pageData = this.vm.pageData;
            this.vm.changeEvent({ 'act': 'showReferences', item, node: currNode });
        });

        // 设置条一|条二... 无条题1|无条题2....
        const setChapterType = (currNode = null, item = {}, isAll = false) => {
            // 是否为可协同分配
            let assignOutline = this.vm.editorSetting.author ? this.vm.editorSetting.author.assignOutline : false;
            editor.undoManager.transact(() => {
                if (item.type === '2') {
                    domUtil.filterLevelByfirst().resetDomIndex(editor, currNode, item);
                } else {
                    if (this.vm.editorSetting.normal && item.indexLens === 1 && currNode.dataset.index) {
                        domUtil.resetLevelNumber(editor, currNode, '1');
                    } else {
                        domUtil.resetChapter(editor, currNode, item, isAll, assignOutline);
                    }
                }
            })
        }
        editor.addCommand('chapter', (currNode = null, item = {}) => {
            var liEles = Array.from(editor.selection.getSelectedBlocks());
            if (liEles.length === 1) {
                setChapterType(currNode, item);
            } else {
                liEles = domUtil.filterLevelByfirst(liEles);
                liEles.forEach((ele, index) => {
                    let textContent = ele.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '');
                    if ($global.hasClass(ele, 'ol-list') || $global.hasClass(ele, 'appendix-list') || (ele.nodeName === 'P' && textContent !== '')) {
                        setChapterType(ele, item, index !== 0);
                    }
                })
            }
        });

        // 新增层级项
        editor.addCommand('toggleLi', (currNode, flag) => {
            var olEle = flag ? domUtil.addLevel(editor, currNode) : domUtil.appendLevel(editor, currNode);
            if (olEle) {
                pageUtil.moveSelectionToElement(olEle);
            }
        });

        // 重新设定层级项的起始编号
        editor.addCommand('resetLevelNumber', (currNode, number) => {
            domUtil.resetLevelNumber(editor, currNode, number);
        });

        // 列项重置 项一、项二.....
        editor.addCommand('list-item', (currNode, item) => {
            domUtil.afterRemoveBullet(editor, currNode);
        });

        // 列项重置
        editor.addCommand('resetBullet', (type = "cricle", node = null, setNumber = false) => {
            // 如果被重新编号的则重置ID
            debugger
            if (node.dataset.restart) {
                node.dataset.id = $global.guid();
            }
            domUtil.resetBullet(editor, node, type, setNumber);
        });

        // 列项层级
        editor.addCommand('list-level', (currNode, level) => {
            var block = editor.dom.getParent(currNode, '.info-block');
            if (block.dataset.outlinetype && block.dataset.outlinetype === '11' && currNode.dataset.type === 'num-index') {
                alert('参考文献数字列项不能定义层级！');
                return false;
            }
            var liEles = Array.from(editor.selection.getSelectedBlocks());
            if (liEles.length === 1) {
                domUtil.resetBulletLevel(editor, currNode, level);
            } else {
                liEles.forEach((ele, index) => {
                    if ($global.hasClass(ele, 'bullet')) {
                        domUtil.resetBulletLevel(editor, ele, level);
                    }
                })
            }
        });

        // 注|注X|示例|示例X
        editor.addCommand('toggleZhu', (itemData, currNode) => {
            let td = editor.dom.getParent(currNode, 'td');
            if (!td) {
                if (itemData.cmd) { // 重置编号
                    domUtil.resetStartNumber(currNode);
                } else {
                    domUtil.toggleZhu(editor, itemData, currNode);
                }
            }
        });

        // 图表注
        editor.addCommand('toggleZhuImgTable', (itemData, currNode) => {
            let td = editor.dom.getParent(currNode, 'td');
            if (td) {
                if ($global.hasClass(currNode, 'zhux') || $global.hasClass(currNode, 'zhu-x')) {
                    if (itemData.act === 'zhu-x') {
                        $global.removeClass(currNode, 'zhux');
                        $global.addClass(currNode, 'zhu-x');
                        currNode.dataset.type = 'zhu-x';
                        currNode.dataset.start = 1;
                        currNode.dataset.number = 1;
                        currNode.dataset.id = $global.guid();
                    } else {
                        $global.removeClass(currNode, 'zhu-x');
                        $global.addClass(currNode, 'zhux');
                        currNode.dataset.type = 'zhux';
                        currNode.removeAttribute('data-start');
                        currNode.removeAttribute('data-number');
                    }
                } else {
                    domUtil.toggleZhu(editor, itemData, currNode);
                }

            }
        });

        // 脚注|条文脚注|表脚注|图脚注
        editor.addCommand('toggleFooter', (itemData, currNode) => {
            var parentNode = currNode.parentNode;
            var error;
            // 判断图脚注是否合法
            if (['imgfooter', 'imgfooter-x'].includes(itemData.act)) {
                let imgNode = parentNode.querySelector('img');
                if (!imgNode || editor.dom.nodeIndex(imgNode) > editor.dom.nodeIndex(currNode)) {
                    error = '请在图片后操作图脚注，或插入新段落后操作！';
                }
            } else if (['tfooter', 'tfooter-x'].includes(itemData.act)) {
                let tableNode = editor.dom.getParent(parentNode, 'table');
                if (!tableNode) {
                    error = '请在表格内操作表脚注！';
                }
            }
            if (error) {
                editor.windowManager.alert(error);
                return false;
            }

            domUtil.toggleFooter(editor, itemData, currNode);
        });

        // 页面布局设置
        editor.addCommand('pageLayout', data => {
            var currNode = editor.selection.getNode();
            var block = editor.dom.getParent(currNode, '.info-block');
            if ($global.hasClass(block, 'cover') || $global.hasClass(block, 'catalogue') || $global.hasClass(block, 'disabled') || $global.hasClass(block, 'fixed')) {
                editor.windowManager.alert('当前页面不可更改布局');
                return;
            }
            switch (data.type) {
                case 0:
                case 1:
                    this.setPageLayout(block, data);
                    break;
                case 2:
                    this.setPageLayout(block, data, true);
                    break;
            }
        });

        // 页面排版
        editor.addCommand('togglePageType', data => {
            var docConfig = editor.settings.doc_config;
            if (docConfig) {
                docConfig.page.layout = data.act;
                editor.settings.doc_config = docConfig;
            }
            pageUtil.updatePageComposition(data);
        });

        // 图标题
        /* editor.addCommand('toggleImageTitle', data => {
            var currNode = editor.selection.getNode();
            domUtil.appendImageTitle(editor, currNode, data);
        }); */
        // 插入公式编号
        editor.addCommand('insertMathNum', (evt, node = null) => {
            // 判断是否在表格内
            var tableNode = editor.dom.getParent(node, 'table');
            if (tableNode) {
                editor.windowManager.alert('表格内不能定义公式编号！');
                return;
            }
            domUtil.toggleMathNum(editor, node);
        });

        // 引用条款标准
        editor.addCommand('importQuote', data => {
            data.node = editor.selection.getNode();
            var currBlock = editor.dom.getParent(data.node, '.info-block');
            if (!currBlock) {
                return false;
            }
            if ($global.hasClass(currBlock, 'cover') || $global.hasClass(currBlock, 'catalogue')) {
                editor.windowManager.alert('当前页面不能操作引用！');
                return false;
            }
            if (data.act === 'collect') { // 处理标准引用汇总
                pageUtil.updateQuoteCollect(data);
            } else {
                this.vm.changeEvent({ 'act': 'importQuote', data });
            }
        });

        // 90度折线图及流程图
        editor.addCommand('insertGraphy', data => {
            this.vm.changeEvent({ act: 'insertGraphy', data });
        })

        // 批注
        editor.addCommand('toggleComment', (str, type) => {
            var currNode = editor.selection.getNode();
            this.vm.changeEvent({ 'act': 'showComment', node: currNode, content: currNode.dataset.content ? JSON.parse(currNode.dataset.content) : null, type });
        });

        // 指标
        editor.addCommand('toggleQuota', (data, type) => {
            if (data) {
                var currNode = editor.selection.getNode();
                var content = JSON.stringify(data);
                var uuid = $global.guid();
                var htmlContent = `<span class="quota" id="${uuid}" title="自定义指标" data-tag="tag">${data.key}${data.operation}${data.value}</span>`;
                editor.execCommand('mceInsertContent', false, htmlContent);
                var tagNode = currNode.querySelector(`span[id="${uuid}"]`);
                tagNode.dataset.content = content;
            } else {
                if (type === 1) {
                    this.vm.changeEvent({ 'act': 'showQuota' });
                } else if (type === 2) {
                    domUtil.removeTags(editor, 'quota');
                }
            }
        });

        // 术语
        editor.addCommand('toggleTerm', (data, type) => {
            if (data) {
                domUtil.addTerm(editor, data);
            } else {
                if (type === 1) {
                    this.vm.changeEvent({ 'act': 'showTerm' });
                } else if (type === 2) {
                    domUtil.removeTerm(editor);
                }
            }
        });

        // 引文
        editor.addCommand('toggleIntroduce', data => {
            editor.execCommand('mceInsertContent', false, `<p style="text-indent: 2em;">${data.appendText}</p>`);
        });

        // 导出文档
        editor.addCommand('exportFile', data => {
            this.vm.changeEvent({ 'act': 'export', data });
        });

        // 保存文档
        editor.addCommand('submitSave', data => {
            this.vm.changeEvent({ act: 'save', data });
        });

        // 翻译
        editor.addCommand('translateZh', data => {
            this.vm.changeEvent({ 'act': 'translateZh', data });
        });
        // 翻译标准名称
        editor.addCommand('translateStdName', data => {
            let stdNameEle = editor.getBody().querySelector('.stdName');
            let text = stdNameEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
            if (text) {
                this.vm.changeEvent({ 'act': 'translateStdName', text });
            }
        });

        // 文本框
        editor.addCommand('textBox', ele => {
            console.log('textBox', ele)
            this.vm.regEventByTextBox(ele);
        })

        editor.on('beforeChange', event => {
            var currNode = editor.selection.getNode();
            console.log('currNode', currNode);
            console.log('beforeChange', event);
        })

        // 监听所有指令事件
        editor.on('ExecCommand TableModified', event => {
            // console.log('ExecCommand', event);
            var currNode = editor.selection.getNode();
            if (event.command) {
                
                switch (event.command) {
                    /*case 'codeChange':
                        break;*/
                    case 'mceInsertContent':
                        if (event.value && event.value.paste && event.value.content) {
                            // 处理容器为列项的
                            let bulletNode = editor.dom.getParent(currNode, '.bullet');
                            if (bulletNode) {
                                bulletUtil.pastePostprocess(bulletNode);
                            }
                            editor.undoManager.add();
                        }
                        if (this.vm.editorSetting.page && !this.vm.editorSetting.page.expand) {
                            setTimeout(() => {
                                pageUtil.autoPageBreak().then(res => {
                                    this.vm.$emit('change', { act: 'breakPage', result:res });
                                });
                            }, 150);
                        }
                        break;
                    case 'mceInsertTable':
                        tableUtil.insertTable(editor, currNode);
                        break;
                    case 'mceTableAlignLeft':
                    case 'mceTableAlignCenter':
                    case 'mceTableAlignRight':
                        tableUtil.setTableAlign(editor, currNode, event.command);
                        break;
                    case 'mceTableProps':
                        tableUtil.tableModified(editor, event);
                        break;
                    case 'mceTableDelete':
                        tableUtil.eraseTable(editor, event.ui);
                        break;
                    case 'mceTableDeleteRow':
                        tableUtil.eraseTableRow(editor, event.ui);
                        // 将下页的内容提取上来
                        pageUtil.resetPageBreak(editor.dom.getParent(currNode, '.info-block'));
                        break;
                    case 'mceTableDeleteCol':
                        setTimeout(() => {
                            tableUtil.eraseTableCol(editor, tinyMCE.tableCell);
                        }, 100);
                        break;
                    case 'mceUpdateImage':
                        setTimeout(() => {
                            this.vm.updateImageData(event.value);
                        }, 200);
                        break;
                    case 'FontSize':
                        console.log(currNode, event.value);
                        break;
                    case 'JustifyLeft':
                    case 'JustifyCenter':
                    case 'JustifyRight':
                        let align = 'center';
                        if (event.command === 'JustifyLeft') {
                            align = 'left';
                        } else if (event.command === 'JustifyRight') {
                            align = 'right';
                        }
                        if ($global.hasClass(currNode, 'ol-list') || $global.hasClass(currNode, 'appendix-list') || $global.hasClass(currNode, 'bullet') || $global.hasClass(currNode, 'zhu') || $global.hasClass(currNode, 'zhux') || $global.hasClass(currNode, 'example') || $global.hasClass(currNode, 'examplex')) {
                            let style = editor.dom.parseStyle(currNode.getAttribute('style'));
                            style['text-align'] && delete style['text-align'];
                            style = editor.dom.serializeStyle(style);
                            currNode.setAttribute('style', style)
                        } else if (currNode.nodeName === 'IMG') {
                            currNode.removeAttribute('style');
                            currNode.removeAttribute('data-mce-style');
                            let parentNode = currNode.parentNode;
                            parentNode.style.textAlign = align;
                        } else if (currNode.nodeName === 'P') {
                            currNode.style.textAlign = align;
                        }
                        break;
                    case 'RemoveFormat':
                        currNode.removeAttribute('class');
                        currNode.removeAttribute('style');
                        let parentNode = currNode.parentNode;
                        let dataAttrs = currNode.dataset;
                        for (let key in dataAttrs) {
                            currNode.removeAttribute(`data-${key}`);
                        }
                        if (currNode.nodeName === 'P' && parentNode.nodeName !== 'TD' && !$global.hasClass(parentNode, 'text-box')) {
                            currNode.style.textIndent = "2em";
                        }
                        break;
                }
            } else if (event.type) {
                switch (event.type) {
                    case 'tablemodified':
                        tableUtil.tableModified(editor, event);
                        break;
                }
            }
        });

        // AI智能编写文档
        editor.addCommand('aiEditor', (type) => {
            this.vm.changeEvent({ act:'aiEditor', command:type});
        })

        // AI人工智能
        editor.addCommand('aiCmd', (act, type) => {
            // 清除已选中的
            const hlNodes = editor.getBody().querySelector('.page-container').querySelectorAll('.re-write');
            hlNodes.forEach(ele => {
                editor.dom.removeClass(ele, 're-write');
            })


            const rng = editor.selection.getRng();
            let selectedText = editor.selection.getContent({ format: 'text' });
            let nodes = editor.selection.getSelectedBlocks() || [];
            let firstNode = nodes[0];
            if (firstNode) {
                // section/paragraph/table/formula
                const tableNode = editor.dom.getParent(firstNode, 'table');
                if (editor.dom.hasClass(firstNode, 'ol-list') || editor.dom.hasClass(firstNode, 'appendix-list')) {
                    type = 'section';
                } else if (tableNode) { //editor.dom.hasClass(firstNode, 'table-title') || editor.dom.hasClass(firstNode, 'table-description') || ['TH','TD'].includes(firstNode.nodeName)
                    type = 'table';
                    nodes[0] = tableNode;
                } else if (editor.dom.hasClass(firstNode, 'math') || editor.dom.hasClass(firstNode, 'math-img')) {
                    type = 'formula';
                    let imgNode = editor.dom.hasClass(firstNode, 'math') ? firstNode.querySelector('img') : firstNode;
                    selectedText = imgNode.dataset.latex;
                } else if (editor.dom.hasClass(firstNode, 'imgs')) {
                    let imgNode = firstNode.querySelector('img');
                    if (editor.dom.hasClass(imgNode, 'math-img')) {
                        type = 'formula';
                        selectedText = imgNode.dataset.latex;
                    }
                } else {
                    type = 'paragraph';
                }
                let outline = this.selectionOutlines(editor, editor.selection.getNode());
                console.log('aiCmd', act, type, nodes, selectedText, outline)
                this.vm.changeEvent({
                    act: 'aiCmd',
                    command: act,
                    type,
                    rng,
                    nodes,
                    selectedText,
                    outline,
                    stdNo: this.vm.pageData && this.vm.pageData?.stdNo ? this.vm.pageData.stdNo : '',
                    stdName: this.vm.pageData && this.vm.pageData?.stdName ? this.vm.pageData.stdName : '',
                })
            }

        });
    },

    selectionOutlines(editor, node) {
        const arr = [];
        const block = editor.dom.getParent(node, '.info-block');
        const setList = ele => {
            let indexStr;
            let level = 1;
            let textNode = ele.firstChild;
            if (textNode && textNode.textContent.replace(/\s/g,'') !== '') {
                indexStr = ele.dataset.index;
                if (indexStr) {
                    level = indexStr.split('.').length;
                    if (ele.dataset.prev) {
                        indexStr = ele.dataset.prev + '.' + indexStr
                    }
                    indexStr += ' ' + textNode.textContent;
                } else if (editor.dom.hasClass(ele, 'header-title') && ele.dataset.number) {
                    indexStr = '附录' + ele.dataset.number + ' ' + ele.textContent.replace(/^\附录/i, '');
                }
            }
            return {
                str: indexStr,
                level
            };
        }
        const getParentOutline = ele => {
            if ($global.hasClass(ele, 'info-block') || $global.hasClass(ele, 'header-title')) {
                return;
            }
            if (ele.dataset.parentid) {
                let parentNode = block.querySelector(`div[data-outlineid="${ele.dataset.parentid}"]`);
                if (parentNode) {
                    let outlineItem = setList(parentNode);
                    if (outlineItem) {
                        arr.push(outlineItem);
                    }
                    getParentOutline(parentNode);
                }
            }
        }
        const getOutlineByNode = ele => {
            if ($global.hasClass(ele, 'info-block')) {
                return;
            }
            if ($global.hasClass(ele, 'ol-list') || $global.hasClass(ele, 'appendix-list')) {
                let outlineItem = setList(ele);
                if (outlineItem) {
                    arr.push(outlineItem);
                }
                getParentOutline(ele);
            } else {
                getOutlineByNode(ele.parentNode);
            }
        }
        getOutlineByNode(node);

        if (!arr.length) {
            let titleEle = block.querySelector('.header-title');
            if (titleEle && titleEle.dataset.bookmark) {
                let titleStr = titleEle.textContent.replace(/\s/g,'');
                if ($global.hasClass(titleEle, 'appendix')) {
                    titleStr = '';
                    let childEles = Array.from(titleEle.childNodes);
                    childEles.forEach((ele, i) => {
                        let str = ele.textContent.replace(/\s/g,'');
                        if (i === 0) {
                            str += ele.dataset.number;
                        }
                        titleStr += str;
                    })
                }
                arr.push({
                    str: titleStr,
                    level: 1
                })
            }
        }

        return arr.reverse();
    },


    /**
     * @description 页面布局|尺寸
     * @param {Element} block
     * @param {Object} data
     * @param {Boolean} setParams 是否设置参数
     */
    setPageLayout(block, data, setParams = false) {
        var editor = this.getActiveEditor();
        var pageNodes = [];
        if (!data.all) {
            pageNodes.push(block);
        } else {
            var pageContainer = editor.dom.getParent(block, '.page-container');
            pageNodes = pageContainer.querySelectorAll('.info-block:not(.disabled):not(.cover):not(.catalogue):not(.fixed)');
        }
        var isExpandPage = this.vm.editorSetting.page ? this.vm.editorSetting.page.expand : false;
        pageNodes.forEach(page => {
            if (setParams) {
                page.style.width = data.width + 'mm';
                page.style.height = isExpandPage ? 'auto' : data.height + 'mm';
                page.style.paddingTop = data.top + 'mm';
                page.style.paddingRight = data.right + 'mm';
                page.style.paddingBottom = data.bottom + 'mm';
                page.style.paddingLeft = data.left + 'mm';
                page.dataset.pagesize = data.size;
            } else {
                // page.dataset.pagesize = data.type === 0 ? 'A4' : 'A3';
                let width = 210, height = 297;
                if (data.type === 1) {
                    width = 297;
                    height = 210;
                    page.dataset.pagesize = 'A3';
                } else {
                    page.removeAttribute('data-pagesize');
                }
                page.style.width = width + 'mm';
                page.style.height = isExpandPage ? 'auto' : height + 'mm';
            }
        });
        // 重置页码
        if (!isExpandPage) {
            pageUtil.resetPageNumber();
        }
    },

}
