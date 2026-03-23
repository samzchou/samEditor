/**
 * ===================================================================================================================
 * @module
 * @desc 文档大纲处理模块
 * @author sam 2022-01-26
 * ===================================================================================================================
 */

'use strict';
import $global from "@/utils/global"; // 全局通用方法类模块
// import tableUtil from "./tableUtil";
// import bulletUtil from "./bulletUtil";
import { numberChar } from "../configs/editorOptions"; // , outlineTypes, stdKinds

import { structServer } from '@/api/nodeServer.js';

const tempHtml = {
    1: [
        '<p style="text-indent: 2em;">本标准按照的XXXXXX规定起草。</p>',
        '<p style="text-indent: 2em;">本文件由XXXXXX提出并归口。</p>',
        '<p style="text-indent: 2em;">本标准按照XXXXXX给出的规则起草。</p>',
        '<p style="text-indent: 2em;">本标准起草单位：</p>',
        '<p style="text-indent: 2em;">本标准主要起草人：</p>'
    ],
    2: ['<p style="text-indent: 2em;">请输入引言内容。</p>'],
    3: ['<p style="text-indent: 2em;">本标准规定了……。</p>', '<p style="text-indent: 2em;">本标准适用于……。</p>'],
    4: ['<p style="text-indent: 2em;">下列文件中的内容通过文中的规范性引用而构成本文件必不可少的条款……。</p>'],
    5: ['<p style="text-indent: 2em;">下列术语和定义适用于本标准。</p>'],
    11: ['<p style="text-indent: 2em;">请输入参考文献内容……。</p>'],
    12: ['<p style="text-indent: 2em;">请输入索引内容……。</p>'],
    13: ['<p style="text-indent: 2em;">请输入内容……。</p>']
}

// const blockStyle = 'padding: 25mm 25mm 20mm 20mm;width:210mm;height:297mm';

export default {
    editor: null,
    vm: {},
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
     * @descroption 检查大纲数据是否合法 345b297e-9991-4ba9-bad5-a41b62c8ef3f  30c55873-671c-4b9c-9326-a23e4099ea95
     */
    checkOutlineData(dataList = []) {
        var errs = [], hasChecked = [];
        dataList.forEach(item => {
            let sameItem = _.find(hasChecked, obj => {
                return obj.outlineId === item.outlineId || (item.outlineCatalog && obj.outlineCatalog === item.outlineCatalog);
            });
            if (sameItem) {
                // console.log(item, sameItem);
                errs.push(`大纲条目[${item.outlineCatalog} ${item.outlineTitle}]与[${sameItem.outlineCatalog} ${sameItem.outlineTitle}]数据结构有冲突！`);
            } else {
                hasChecked.push(item);
            }
        });
        return errs.join("<br/>");
    },

    /**
     * @descroption 从模板数据中解析大纲结构并生成HTML页面
     * @param {Object} data
     */
    initOutline(data = null) {
        var outlineData = data.outline;
        var pageNo = data.docType + " " + data.docData.stdNo;
        var uuid = data.outlineId || $global.guid();
        var docId = data.docId;
        outlineData.docId = docId;
        outlineData.ancestors = uuid;
        outlineData.outlineId = uuid;
        var htmlArr = [], romaIndex = 0, structIndex = 0;
        outlineData.children = outlineData.children.map((item, i) => {
            item.docId = docId;
            item.outlineId = $global.guid();
            item.ancestors = `${outlineData.outlineId},${item.outlineId}`;
            item.parentId = outlineData.outlineId;
            item.orderNum = i;
            var pageNum = '';
            if ([1, 2].includes(item.outlineType)) {
                pageNum = numberChar.roma[romaIndex];
                romaIndex++;
            } else {
                pageNum = structIndex + 1;
                structIndex++;
            }
            htmlArr.push(this.parseHtml(item, pageNo, pageNum));
            return item;
        });
        return {
            outline: outlineData,
            html: htmlArr
        };
    },

    /**
     * @descroption 大纲节点解析成HTML模板
     * @param {Object} item
     */
    parseHtml(item, pageNo = '0001', pageNum = '1', stdKind = 1100) {
        var styles = ''; //blockStyle;
        var struct = ![1, 2, 11, 13].includes(item.outlineType);
        var cls = struct ? 'info-block struct' : 'info-block';
        if ([8, 9].includes(item.outlineType)) {
            cls = 'info-block appendix';
        }
        var tempContent = tempHtml[item.outlineType] || [];

        var htmlArr = [
            `<div class="${cls}" style="${styles}" data-title="${item.outlineTitle}" data-outlineid="${item.outlineId}" data-parentid="${item.parentId}" data-outlinetype="${item.outlineType}" data-no="${pageNo}" data-pagesize="A4" data-pagenum="${pageNum}">`
        ];
        if (!struct) {
            // 空白文档
            if (item.outlineType !== 13) { // && !hasContent
                htmlArr.push(`<div class="header-title" data-bookmark="${item.outlineId}"><p>${item.outlineTitle}</p></div>`);
            }
            if (tempContent) {
                htmlArr = htmlArr.concat(tempContent);
            }
        } else {
            var itemStyle = 'line-height:2.5;';
            // 附录章节
            if ([8, 9].includes(item.outlineType)) {
                let docTitle = item.infoNum === 8 ? '规范性' : '资料性';
                let appendCls = item.infoNum === 8 ? 'specs' : 'means';
                htmlArr.push(
                    `<div class="header-title appendix disabled" contenteditable="false" data-outlinetype="${item.outlineType}" data-doctitle="${docTitle}" data-outlineid="${item.outlineId}" data-parentid="${item.parentId}" data-bookmark="${item.outlineId}" data-number="${item.letter}">`
                );
                htmlArr.push(`<p class="appendix" data-number="${item.letter}">附&nbsp;录</p>`);
                htmlArr.push(`<p class="docattr ${appendCls}">（${docTitle}）</p>`);
                htmlArr.push(`<p contenteditable="true" class="appendix-title">${item.outlineTitle}</p>`);
                htmlArr.push('</div>');
                if (item.children && item.children.length) {
                    item.children.forEach(obj => {
                        htmlArr.push(
                            `<div class="appendix-list" data-prev="${item.letter}" data-bookmark="${obj.outlineId}" data-outlineid="${obj.outlineId}" data-parentid="${obj.parentId}" data-outlinetype="${obj.outlineType}" data-index="1"  data-source="0" style="${itemStyle}">${obj.outlineTitle}</div>`
                        );
                    });
                }
                // 空白页面
            } else if ([13].includes(item.outlineType)) {
                htmlArr.push(`<p style="text-indent: 2em;">请输入内容...</p>`);
                // 一般章节
            } else {
                if (item.outlineCatalog && item.outlineCatalog === 1) {
                    htmlArr.push(`<div class="header-title chapter" data-id="${$global.guid()}" data-parentid="${item.outlineId}" data-contentid="${$global.guid()}"><p>标题名称</p></div>`);
                }
                htmlArr.push(
                    `<div class="ol-list" data-bookmark="${item.outlineId}" data-outlineid="${item.outlineId}" data-parentid="${item.parentId}" data-outlinetype="${item.outlineType}" data-index="${item.outlineCatalog}" style="${itemStyle}">${item.outlineTitle}${tempContent.join("")}</div>`
                );
            }
        }
        htmlArr.push('</div>');

        return htmlArr.join("");
    },

    // 获取一般文档的大纲
    getOutlineByNormal(editor) {
        const pageContainer = editor.getBody().querySelector('.page-container');
        if (!pageContainer) {
            return false;
        }
        const outlineList = [];
        const pageBlocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.cover):not(.approve):not(.catalogue)'));
        for (let i = 0; i < pageBlocks.length; i++) {
            const infoblock = pageBlocks[i];
            const parentId = infoblock.dataset.parentid;
            const bks = Array.from(infoblock.querySelectorAll('[data-bookmark]:not(.hide-list):not(.img-title):not(.table-title),h1,h2,h3')); // ,h4,h5,h6

            for (let j = 0; j < bks.length; j++) {
                const node = bks[j];
                const parentNode = node.parentNode;
                const firstChild = node.firstChild;
                if (!node.dataset.parentid) {
                    node.dataset.parentid = $global.hasClass(parentNode,'ol-list') ? parentNode.dataset.outlineid : parentId;
                }
                if (!node.dataset.bookmark) {
                    node.dataset.bookmark = $global.guid();
                }
                let title = '';
                if (firstChild && (firstChild.nodeName === '#text' || firstChild.nodeName === 'SPAN')) {
                    title = (firstChild.nodeValue || firstChild.textContent).replace(/\s/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
                }
                let outlineCatalog = '';
                if ($global.hasClass(node, 'ol-list')) {
                    outlineCatalog = node.dataset.index;
                }
                outlineList.push({
                    parentId: node.dataset.parentid || parentId,
                    outlineId: node.dataset.bookmark,
                    outlineTitle: title,
                    outlineCatalog,
                })
            }
        }
        outlineList.unshift({
            parentId: '0',
            outlineId: pageContainer.dataset.outlineid,
            outlineTitle: pageContainer.dataset.title||'我的文档',
            outlineCatalog: ''
        });
        // console.log('getOutlineByNormal outlineList===>', outlineList);
        const outlineData = $global.handleTree(outlineList, 'outlineId', 'parentId', 'children', '0');
        this.vm.resetOutlineData({ data: outlineData });

    },

    /**
     * @descroption 根据页面获取大纲数据
     * @param {Element} pageContainer
     * @param {Boolean} isSave 是否保存数据
     */
    async getOutlineBypage(pageContainer = null, isSave = false) {
        var editor = this.getActiveEditor();
        if (!editor || !editor.getBody()) {
            return [];
        }
        pageContainer = editor.getBody().querySelector('.page-container');
        if (!pageContainer) {
            return [];
        }
        // debugger
        var pageId = pageContainer.dataset.outlineid || $global.guid();
        var pageData = {
            docId: pageContainer.dataset.id,
            outlineId: pageId,
            parentId: '0',
            isVisible: 1,
            outlineTitle: pageContainer.dataset.title || pageContainer.getAttribute('title') || '文档',
            ancestors: pageId
        }
        var cfg = editor.settings.doc_config || {};

        // 章节大纲数组
        var arrList = [];

        /* const result = await structServer({
            operation: 'parseOutline',
            htmlContent: pageContainer.outerHTML,
            pageData,
            isSave,
            activeBlock,
            cfg
        }, this.vm.editorSetting.nodeURL);

        // debugger
        if (!result.success) {
            // this.$messgae.error(result.messgae)
            return [];
        }
        arrList = result.data; */

        const st = +new Date();

        // 获取封面页和大纲页
        // var fixedBlocks = Array.from(pageContainer.querySelectorAll('.info-block.cover, .info-block.approve, .info-block.catalogue'));
        // var fixedPageLens = fixedBlocks.length;
        // 章节页
        var pageBlocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.cover):not(.approve):not(.catalogue)'));

        /* if (!activeBlock) {
            pageBlocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.cover):not(.approve):not(.catalogue)'));
        } else {
            pageBlocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.cover):not(.approve):not(.catalogue):not(.pageHide)'));
        } */

        // 获取附录章节的索引值
        const getAppendixIndexByBlock = block => {
            var appendixBlocks = Array.from(pageContainer.querySelectorAll('.info-block.appendix'));
            for (let i = 0; i < appendixBlocks.length; i++) {
                let appendixBlock = appendixBlocks[i];
                if (block === appendixBlock) {
                    return i;
                }
            }
            return 0;
        }
        // 分片处理每个页面的章节条款
        const processOutlineChunk = (nodes, start, end, block) => {
            const blockParentId = block.dataset.parentid;
            const blockIndex = Number(block.dataset.tmpIndex);
            const blockId = block.dataset.id || block.dataset.outlineid;
            const locked = $global.hasClass(block, 'disabled');
            const chunk = nodes.slice(start, end);
            // debugger
            chunk.forEach((node, j) => {
                let outlineTitle = this.getChapterText(node);
                let outlineCatalog = node.dataset.index || '';
                let ancestors = this.getAncestors(node, pageContainer);
                ancestors.unshift(blockParentId);
                let visible = outlineCatalog.split('.').length < 2 || outlineTitle === '';
                if (cfg.isStandard && !cfg.chapter.includes(block.dataset.outlinetype) && outlineCatalog.length > 1) {
                    visible = false;
                }
                // 无条题的条目
                if (!node.dataset.bookmark) {
                    visible = false;
                } else {
                    visible = true;
                }

                let owner = node.dataset.owner || '';
                if (!isSave && owner) {
                    owner = $global.isJSON(owner) ? JSON.parse(owner) : owner;
                }

                let orderNum = blockIndex * 100 + (j + start);
                if (outlineTitle === '附录' && this.vm.pageData?.stdKind === this.vm.editorSetting.tmplType) {
                    orderNum = blockIndex * 400 + (j + start);
                }
                let listData = {
                    docId: pageData.docId,
                    outlineId: node.dataset.outlineid,
                    parentId: node.dataset.parentid,
                    ancestors: ancestors.join(','),
                    outlineTitle,
                    isVisible: visible ? 1 : 0,
                    outlineCatalog,
                    outlineType: parseInt(node.dataset.outlinetype),
                    orderNum,
                    // extendContent: JSON.stringify(extendContent),
                    owner,
                    enabled: true,
                    enLocked: blockId === node.dataset.outlineid || !locked,
                }
                // 附录
                if (node.dataset.prev) {
                    listData.outlineCatalog = node.dataset.prev + "." + outlineCatalog;
                }
                if (listData.outlineCatalog && listData.outlineCatalog.length > 1) {
                    let chapterNode = _.find(arrList, { outlineId:ancestors[1] });
                    if (chapterNode) {
                        if ([8,9].includes(chapterNode.outlineType) && /^[A-Z]$/.test(chapterNode.outlineCatalog)) {
                            listData.outlineType = 10;
                        } else {
                            listData.outlineType = chapterNode.outlineType;
                        }
                    }
                }
                // 航司特有格式的附录
                if ((/^[A-Z]+[0-9]+$/.test(outlineCatalog) || $global.isUpperCase(outlineCatalog)) && this.vm.pageData && this.vm.pageData?.stdKind === this.vm.editorSetting.tmplType) {
                    listData.extendContent = '附录';
                    listData.orderNum = blockIndex * 400 + (j + start);
                }

                if (isSave || this.vm.editorSetting.admin) {
                    listData.content = this.getHtmlContentByNode(node, listData, pageContainer, false);
                }
                if (locked) {
                    listData.locked = true;
                    delete listData.enabled;
                }
                // 如果编辑器配置有固定不可编辑的章节
                if (cfg && cfg.fixed && cfg.fixed.includes(listData.outlineType)) {
                    delete listData.enabled;
                }
                arrList.push(listData);
            })
            return true;
        }

        const scheduleOutlineUpdate = (nodes, block) => {
            const total = nodes.length;
            let start = 0;
            const chunkSize = 100; // 每段处理的章节数

            return new Promise((resolve) => {
                function  processNextChunk(deadline) {
                    // if (deadline.timeRemaining() > 0 && start < total) {
                    while ((deadline.timeRemaining() > 0 || deadline.didTimeout) && start < total) {
                        const end = Math.min(start + chunkSize, total);
                        requestAnimationFrame(() => {
                            processOutlineChunk(nodes, start, end, block);
                            start = end;
                        })
                    }
                    if (start < total) {
                        requestIdleCallback(processNextChunk);
                    } else {
                        resolve(true); // 处理完成，resolve Promise
                    }
                }
                requestIdleCallback(processNextChunk);
            })
        }


        // 定义附录起始序号
        var appendixCatalog = 0;
        for (let i = 0; i < pageBlocks.length; i++) {
            const block = pageBlocks[i];
            const blockIndex = i + 1;
            block.dataset.tmpIndex = String(blockIndex);
            if (isSave) {
                this.clearDiff(block);
                $global.removeClass(block, 'active');
            }

            var contentType = 'html';
            // 定义页面类型
            var blockWidth = block.style.width;
            // 定义页面布局
            if (blockWidth && parseFloat(blockWidth) > 210) {
                contentType = `width:${blockWidth}`;
            }
            var blockId = block.dataset.id || block.dataset.outlineid;
            var blockParentId = block.dataset.parentid;
            var locked = $global.hasClass(block, 'disabled'); // 锁定页面

            var cloneBlock = block.cloneNode();
            if (cloneBlock.getAttribute('style') && isSave) {
                cloneBlock.style.paddingBottom = "20mm";
            }

            // 页面配置的扩展信息
            var extendContent = {
                style: cloneBlock.getAttribute('style'),
                pagesize: cloneBlock.dataset.pagesize
            }
            cloneBlock.remove();

            // 结构化章节页面标题
            var headerTitle = block.querySelector('.header-title');
            var isAppendix = false;
            var titleData = null;
            var orderNum = blockIndex;
            // 按标题（主要为附录标题）
            if (headerTitle && headerTitle.dataset.outlineid) {
                let appendixLetter = $global.numberToLetters(appendixCatalog);
                if ($global.hasClass(block, 'appendix')) {
                    headerTitle.dataset.number = appendixLetter;
                    let appendixNumberEle = headerTitle.querySelector('p.appendix');
                    if (appendixNumberEle) {
                        appendixNumberEle.dataset.number = appendixLetter;
                    }
                    if (!headerTitle.dataset.infonum) {
                        let specsEle = headerTitle.querySelector('.specs');
                        if (specsEle) {
                            let specsText = specsEle.textContent.replace(/\s/g,'');
                            if (specsText.match(/\规范/i) !== null) {
                                headerTitle.dataset.infonum = '8';
                            } else {
                                headerTitle.dataset.infonum = '9';
                            }
                        }
                    }
                    isAppendix = true;
                    appendixCatalog++;
                }

                let otherHtml = '';
                let outlineTitle = headerTitle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '');
                let titleId = headerTitle.dataset.id || headerTitle.dataset.bookmark;
                // 协同分配
                let owner = headerTitle.dataset.owner || block.dataset.owner || '';
                if (!isSave && owner) {
                    owner = $global.isJSON(owner) ? JSON.parse(owner) : owner;
                }

                let ancestors = block.dataset.parentid + ',' + titleId;
                if ($global.hasClass(headerTitle, 'appendix')) {
                    otherHtml = this.getOtherByAppendix(headerTitle, block, pageContainer);
                }

                titleData = {
                    docId: pageData.docId,
                    outlineId: titleId,
                    parentId: block.dataset.parentid,
                    ancestors,
                    isVisible: 0,
                    levelNum: 0,
                    orderNum,
                    outlineTitle,
                    outlineType: isAppendix ? parseInt(block.dataset.outlinetype) : 999,
                    outlineCatalog: '0',
                    content: {
                        contentId: headerTitle.dataset.contentid || $global.guid(),
                        docId: pageData.docId,
                        outlineId: titleId,
                        contentType,
                        content: headerTitle.outerHTML + otherHtml,
                        contentText: headerTitle.textContent
                    },
                    extendContent: JSON.stringify(extendContent),
                    owner,
                    enabled: true,
                    enLocked: $global.hasClass(headerTitle, 'enlock') || !$global.hasClass(block, 'disabled')
                };
                if (locked) {
                    titleData.locked = true;
                    delete titleData.enabled;
                }
                // 如果编辑器配置有固定不可编辑的章节
                if (cfg && cfg.fixed && cfg.fixed.includes(titleData.outlineType)) {
                    delete titleData.enabled;
                }

                // 如果为附录标题
                if (isAppendix) {
                    let appendixIndex = getAppendixIndexByBlock(block);
                    block.dataset.letter = $global.numberToLetters(appendixIndex);
                    headerTitle.dataset.number = block.dataset.letter;
                    titleData.letter = block.dataset.letter;
                    titleData.isVisible = 1;
                    titleData.outlineCatalog = appendixLetter;
                    titleData.infoNum = parseInt(headerTitle.dataset.infonum||8);
                    // 标题实际内容
                    let appendixTitle = headerTitle.querySelector('.appendix-title');
                    // debugger
                    if (appendixTitle) {
                        titleData.outlineTitle = appendixTitle.textContent.replace(/\s/g, '');
                        // 序号
                        let appendixNumNode = appendixTitle.querySelector('.appendix');
                        if (appendixNumNode) {
                            appendixNumNode.dataset.number = block.dataset.letter;
                        }
                    }
                } else {
                    let olEle = headerTitle.nextElementSibling;
                    if (olEle && $global.hasClass(olEle, 'ol-list')) {
                        titleData.ancestors = block.dataset.parentid + ',' + olEle.dataset.outlineid + ',' + titleId;
                        titleData.parentId = olEle.dataset.outlineid;
                    }
                }

                if (isAppendix) {
                    arrList.push(titleData);
                }
            }

            // 分析章节和附录项的结构化页面
            var outlineNodes = Array.from(block.querySelectorAll('div[data-index]:not(.hide-list)'));
            if (!_.isEmpty(outlineNodes)) {
                cfg.chapter = cfg.chapter || [];
                // 分片处理
                await scheduleOutlineUpdate(outlineNodes, block);

                if (titleData && !isAppendix) {
                    arrList.push(titleData);
                }

            } else { // 非结构化页面
                if (!$global.hasClass(block, 'struct') && !$global.hasClass(block, 'appendix')) {
                    headerTitle = block.querySelector('.header-title');
                    let outlineTitle = block.dataset.title || block.getAttribute('title') || '文档';
                    if (headerTitle) {
                        outlineTitle = headerTitle.textContent.replace(/\s/g, '');
                    }
                    let outlineType = parseInt(block.dataset.outlinetype);
                    let extisData = _.find(arrList, { outlineType });

                    let owner = block.dataset.owner || '';
                    if (!isSave && owner) {
                        owner = $global.isJSON(owner) ? JSON.parse(owner) : owner;
                    }

                    // 防止重复
                    if (!extisData) {
                        let itemData = {
                            docId: pageData.docId,
                            outlineId: blockId,
                            parentId: blockParentId,
                            ancestors: blockParentId + ',' + blockId,
                            outlineTitle,
                            outlineType,
                            isVisible: 1,
                            orderNum: blockIndex,
                            extendContent: JSON.stringify(extendContent),
                            owner,
                            enabled: true,
                            enLocked: !$global.hasClass(block, 'disabled')
                        }
                        if (isSave || this.vm.editorSetting.admin) {
                            itemData.content = this.getHtmlContentByNode(block, itemData, pageContainer, true);
                        }

                        if (locked) {
                            itemData.locked = true;
                            delete itemData.enabled;
                        }
                        // 如果编辑器配置有固定不可编辑的章节
                        if (cfg && cfg.fixed && cfg.fixed.includes(itemData.outlineType)) {
                            delete itemData.enabled;
                        }
                        arrList.push(itemData);
                    }
                }
            }
        };

        arrList = _.orderBy(arrList, ['outlineType', 'orderNum', 'outlineCatalog']);
        console.log('实时构建大纲总耗时:', +new Date() - st, arrList.length + '个章节条款');

        if (!_.isEmpty(arrList)) {
            arrList.unshift(pageData);
        }
        pageBlocks = null;

        if (isSave) {
            return arrList;
        }
        const outlineData = $global.handleTree(arrList, 'outlineId', 'parentId', 'children', '0');
        // console.log('文档的大纲结构数据=>', arrList, outlineData)
        return outlineData;
    },


    /**
     * @description 根据附录章节标题获取所有非章条目的元素HTML
     */
    getOtherByAppendix(currNode = null, block = null, pageContainer = null) {
        var htmlConten = [];
        var childNodes = Array.from(block.childNodes);
        const parseChilds = nodes => {
            for (let i = 0; i < nodes.length; i++) {
                let node = nodes[i];
                if ($global.hasClass(node, 'appendix-list')) {
                    break;
                }
                if (!['BR', '#text'].includes(node.nodeName) && !$global.hasClass(node, 'header-title')) {
                    htmlConten.push(node.outerHTML);
                }
            }
        }
        parseChilds(childNodes);
        var nextSamBlocks = Array.from(pageContainer.querySelectorAll(`div.info-block[data-outlineid="${block.dataset.outlineid}"]`));

        nextSamBlocks.forEach((node, index) => {
            if (index > 0) {
                childNodes = Array.from(node.childNodes);
                parseChilds(childNodes);
            }
        });

        return htmlConten.join("");
    },
    // 移除比较不同的标签
    clearDiff(node = null) {
        var editor = this.getActiveEditor();
        if (node && $global.hasClass('diff')) {
            editor.formatter.remove('removeDiff', { value: 'h' }, node);
            editor.formatter.remove('removeDiff', { value: 'd' }, node);
        }
    },

    /**
     * @description 获取章节标题的实际文本内容
     * @param {Element} node
     */
    getChapterText(node = null) {
        let childNodes = Array.from(node.childNodes);
        let textArr = [];
        for (let i = 0; i < childNodes.length; i++) {
            let ele = childNodes[i];
            if (['BR', 'P', 'DIV', 'IMG', 'TABLE'].includes(ele.nodeName)) {
                break;
            } else {
                textArr.push(ele.textContent.replace(/[\u200B-\u200D\uFEFF]/g, ''));
            }
        }
        return textArr.join("");
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
     * @description 获取章节的具体内容
     * @param {Element} node
     * @param {Object} itemData
     * @param {Element} pageContainer
     * @param {Boolean} isStruct 是否为结构化
     */
    getHtmlContentByNode(node = null, itemData = '', pageContainer = null, isStruct = false) {
        if (!node) {
            return null;
        }
        var contentId = node?.dataset.contentid || $global.guid();
        if (!node.dataset.contentid) {
            node.dataset.contentid = contentId;
        }

        var htmlContent = [];
        var sameNode = [];
        // debugger
        // 取出所有相同页面（后页）
        if (!isStruct) {
            sameNode = Array.from(pageContainer.querySelectorAll(`div[data-outlineid="${itemData.outlineId}"]:not(.info-block)`));
        } else {
            sameNode = Array.from(pageContainer.querySelectorAll(`div[data-outlineid="${itemData.outlineId}"]`));
        }
        sameNode.forEach((ele, index) => {
            ele.dataset.contentid = contentId;
            let eleHTML = ele.outerHTML;
            eleHTML = this.clearTableByHideTr(eleHTML, pageContainer); // ele.outerHTML
            if (eleHTML !== '') {
                htmlContent.push(eleHTML);
            }
        });

        return {
            contentId,
            docId: itemData.docId,
            outlineId: itemData.outlineId,
            contentType: 'html',
            content: htmlContent.join("").replace(/\ pageHide/i,''),
            // contentText: node.textContent
        }
    },

    /**
     * @description 清理表格
     * @param {String} content
     */
    clearTableByHideTr(content = "", pageContainer = null) {
        var section = document.createElement('div');
        section.innerHTML = content;
        var block = section.querySelector('.info-block');
        if (block) {
            block.removeAttribute('data-break');

            var disabledEditConents = Array.from(block.querySelectorAll('[data-outlineid][contenteditable]'));
            disabledEditConents.forEach(ele => {
                ele.removeAttribute('contenteditable');
            })

            var tableNodes = Array.from(block.querySelectorAll('table'));
            tableNodes.forEach(table => {
                let parentNode = table.parentNode;
                if (!$global.hasClass(table, 'xu')) {
                    let trs = table.querySelectorAll('tbody>tr');
                    trs.forEach(tr => {
                        if ($global.hasClass(tr, 'hide')) {
                            tr.remove();
                        }
                    });
                    // 合并续表单元行
                    trs = this.mergeTr(table, pageContainer);
                    if (trs.length) {
                        let tbody = table.querySelector('tbody');
                        trs.forEach(tr => {
                            tbody.appendChild(tr);
                        })
                    }
                } else {
                    table.remove();
                    if (parentNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '' && $global.hasClass(parentNode, 'hide-list')) {
                        parentNode.remove();
                    }
                }
            });
        }

        var htmlContent = section.innerHTML;
        section.remove();
        return htmlContent;
    },
    /**
     * @description 续表内容行合并到主表中
     * @param {Element} mainTable
     * @param {Element} pageContainer
     */
    mergeTr(mainTable = null, pageContainer = null) {
        var trList = [];
        var relationTables = Array.from(pageContainer.querySelectorAll(`table[data-parentid="${mainTable.dataset.id}"]`));
        if (relationTables.length) {
            relationTables.forEach(table => {
                let trs = Array.from(table.querySelectorAll('tbody>tr'));
                trs.forEach((tr, index) => {
                    if (!$global.hasClass(tr, 'hide')) {
                        let cloneTr = tr.cloneNode(true);
                        trList.push(cloneTr);
                    }
                })
            })
        }
        return trList;
    },
}
