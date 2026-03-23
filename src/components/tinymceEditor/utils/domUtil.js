/**
 * ===================================================================================================================
 * @module
 * @desc 元素处理模块
 * @author sam 2021-12-29
 * ===================================================================================================================
 */
'use strict';
import $global from "@/utils/global";
import levelUtil from "./levelUtil";
import bulletUtil from "./bulletUtil";
import tableUtil from "./tableUtil";

export default {
    editor: null,
    vm: {},
    updateVm(vm) {
        this.vm = vm;
        bulletUtil.vm = vm;
        bulletUtil.editor = this.vm.editor;
        levelUtil.vm = vm;
        levelUtil.editor = this.vm.editor;
        tableUtil.vm = vm;
        tableUtil.editor = this.vm.editor;
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
     * @description 清除元素的所有标签
     */
    clearAllFormat() {
        const editor = this.getActiveEditor();
        if (!editor || !editor.getBody()) {
            return false;
        }
        const pageContainer = editor.getBody().querySelector('.page-container');
        if (!pageContainer) {
            return false;
        }
        // debugger
        var blocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.fixed):not(.disabled)'));
        for(let block of blocks) {
            let pNodes = Array.from(block.querySelectorAll('p'));
            for(let pEle of pNodes) {
                const imgNodes = Array.from(pEle.querySelectorAll('img'));
                if (imgNodes.length) {
                    for(let ele of imgNodes){
                        if (['#text','IMG'].includes(ele)) {
                            ele.innerText = ele.textContent.replace(/\s/g,'');
                        }
                    }
                } else {
                    pEle.innerText = pEle.textContent.replace(/\s/g,'');
                }
            }
        }
    },

    mergeTextNodes(ele) {
        if (!ele) {
            return;
        }
        let parentNode = ele.parentNode;
        // 先清理非法元素
        let childNodes = Array.from(parentNode.querySelectorAll('italic,subscript,supscript,span'));
        for (let cn of childNodes) {
            if (cn.nodeName === 'SPAN' && (cn.getAttribute('style') || cn.className)) {
                continue;
            }
            let textNode = document.createTextNode(cn.textContent);
            $global.insertAfter(textNode, cn);
            cn.remove();
        }

        if (['#text'].includes(ele.nodeName)) { // ,'ITALIC','SUBSCRIPT','SUPSCRIPT'
            while (ele.nextSibling && (['#text'].includes(ele.nextSibling.nodeName))) { //,'ITALIC','SUBSCRIPT','SUPSCRIPT'
                ele.nodeValue += ele.nextSibling.nodeValue || ele.nextSibling.textContent;
                parentNode.removeChild(ele.nextSibling);
            }
        }
    },

    clearSpan(editor) {
        editor = this.getActiveEditor();
        if (!editor || !editor.getBody()) {
            return false;
        }
        const pageContainer = editor.getBody().querySelector('.page-container');
        if (!pageContainer) {
            return false;
        }
        var blocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.fixed):not(.disabled):not(.pageHide)'));
        blocks.forEach(block => {
            // 清理SPAN标签
            var spanNodes = Array.from(block.querySelectorAll('span'));
            spanNodes.forEach(span => {
                if (!$global.hasClass(span, 'a-note') && !$global.hasClass(span, 'line') && span.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '') === '' && !span.dataset.tag && !span.dataset.bind && !span.querySelector('img')) {
                    span.remove();
                }
            });
            // 清理A标签
            var aNodes = Array.from(block.querySelectorAll('a'));
            aNodes.forEach(aNode => {
                if (aNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '') === '' && !aNode.querySelector('img')) {
                    aNode.remove();
                }
            });
            // 清理空P标签
            var pNodes = Array.from(block.querySelectorAll('p'));
            pNodes.forEach(pNode => {
                if (pNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '' && !pNode.childNodes.length && !pNode.dataset?.bind && !pNode.querySelector('img')) {
                    pNode.remove();
                }
            });
            // 清理上标下标 addBy sam.shen 2024-11-18
            var subNodes = Array.from(block.querySelectorAll('sub'));
            subNodes.forEach(el => {
                if (el.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g,'') === '') {
                    el.remove();
                }
            })

            var supNodes = Array.from(block.querySelectorAll('sup'));
            supNodes.forEach(el => {
                if (el.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g,'') === '') {
                    el.remove();
                }
            })
        })
    },
    // 重置列项中的子集对象
    resetBulletChildNodes(ele) {
        var childNodes = Array.from(ele.childNodes);
        // const nextNode
        const appendNodes = [];
        for (let node of childNodes) {
            if (['DIV','P','TABLE'].includes(node.nodeName)) {
                appendNodes.push(node);
            }
        }
        appendNodes.reverse().forEach(node => {
            $global.insertAfter(node, ele);
        });

        var str = '';
        childNodes = Array.from(ele.childNodes);
        for (let node of childNodes) {
            if (['SPAN'].includes(node.nodeName) && !node.getAttribute('style')) {
                for (let cn of Array.from(node.childNodes)) {
                    if (cn.nodeName === '#text') {
                        str += cn.textContent;
                    } else {
                        str += cn.innerHTML;
                    }
                }
            }
        }
        if (str) {
            ele.innerHTML = str;
        }
    },

    /**
     * @description 重置代码区
     */
    resetPreCodes(editor) {
        editor = this.getActiveEditor();
        if (!editor || !editor.getBody()) {
            return false;
        }
        const pageContainer = editor.getBody().querySelector('.page-container');
        if (!pageContainer) {
            return false;
        }
        const preCodeNodes = Array.from(pageContainer.querySelectorAll('pre'));
        preCodeNodes.forEach(node => {
            node.removeAttribute('contenteditable');
        });

        return true;
    },

    /**
     * @description 获取剪贴板内容
     */
    async getClipboarContent() {
        const clipboardText = await navigator.clipboard.readText();
        // console.log('clipboardText===>', clipboardText)
        // debugger
        var contents = _.trimStart(clipboardText).split('\r\n');
        var arr = [];
        contents.forEach(str => {
            str = _.trimEnd(str.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\t/g, ''));
            // let splitCharacters = str.slice(0, str.indexOf(" "));
            let obj = {
                cls: 'bullet',
                type: '',
                text: str,
                str
            }
            if (str.split(/\s/).length > 1 && /^[A-Z0-9\s.*?\.\d+]/.test(str)) {
                // 条目项
                let reg = new RegExp(str.split(/\s/)[0], 'g');
                obj.cls = 'list';
                obj.type = str.split(/\s/)[0]; //str.slice(0, str.indexOf(" "));
                obj.str = _.trimStart(str.replace(reg, ''));
            } else if (/^[0-9\s.*?\)|\）]/.test(str)) {
                // 数字列项
                obj.type = 'num';
            } else if (/^[A-Za-z\s.*?\)|\）]/.test(str)) {
                // 字母列项
                obj.type = 'lower';
            } else if (/^\/.test(str) || /^\/.test(str)) {
                // 实心圈符号列项这里是章节段落
                obj.type = 'circle';
            } else if (/^\/.test(str)) {
                // 实心方块符号列项
                obj.type = 'square';
            } else if (/^\/.test(str)) {
                // 菱形符号列项
                obj.type = 'diamond';
            } else if (/^\——/.test(str)) {
                // 破折号列项
                obj.type = 'line';
            } else if (/^\注：/.test(str)) {
                // obj.cls = '';
                obj.type = 'zhu';
                obj.str = str.slice(str.indexOf("：") + 1);
            } else if (/^\注+[0-9]+(\：)/.test(str)) {
                // obj.cls = '';
                obj.type = 'zhux';
                obj.str = str.slice(str.indexOf("：") + 1);
            } else if (/^\示例：/.test(str)) {
                // obj.cls = '';
                obj.type = 'sample';
                obj.str = str.slice(str.indexOf("：") + 1);
            } else if (/^\示例+[0-9]+(\：)/.test(str)) {
                // obj.cls = '';
                obj.type = 'samplex';
                obj.str = str.slice(str.indexOf("：") + 1);
            } else {
                obj.cls = '';
            }
            arr.push(obj);
        });
        // 清空剪贴板
        // navigator.clipboard.writeText('');
        // 输出数据
        return arr;

    },
    /**
     * @description 解析元素的内容并转换
     * @param{Element} currNode
     */
    getNodeHtml(currNode) {
        var childNodes = Array.from(currNode.childNodes);
        var htmlContent = [];
        childNodes.forEach((ele, idx) => {
            if (!['UL', 'OL', 'BR'].includes(ele.nodeName) && idx > 0) {
                htmlContent.push('<p style="text-indent:2em">' + ele.textContent + '</p>');
            }
        });
        return htmlContent.join("");
    },

    /**
     * @description 解析粘贴进来的内容
     * @param{Element} currNode
     */
    async paserPasteLists(currNode = null, clearFormat = false) {
        const editor = this.getActiveEditor();
        // const blockPage = editor.dom.getParent(currNode, '.info-block');
        const parentLevelNode = editor.dom.getParent(currNode, '.ol-list,.appendix-list') || editor.dom.getParent(currNode, '.info-block');
        // const clipboardContent = await this.getClipboarContent();
        // console.log('clipboardContent==>', clipboardContent)
        // var listArr = clipboardContent; //clipboardContent.filter(o => { return ['bullet', 'list'].includes(o.cls); });
        // console.log('listArr', listArr);

        // 非通过系统复制粘贴的则不做处理
        /* if (!listArr.length) {
            return false;
        } */
        var liContainer = editor.dom.getParent(currNode, 'ul,ol')

        var olNodes = Array.from(ul.querySelectorAll('.paste-list'));

        /* var ulNode = Array.from(blockPage.querySelectorAll('ul,ol'));
        ulNode.forEach(ul => {
            let olNodes = Array.from(ul.querySelectorAll('.paste-list'));
            // var liContainer = parentLevelNode || blockPage;
            olNodes.forEach(li => {
                if (li.firstChild && !['UL','OL'].includes(li.firstChild.nodeName)) {
                    let text = li.firstChild.textContent || li.firstChild.nodeValue;
                    let newEle = editor.dom.create('p', { style: 'text-indent: 2em;' }, text.replace(/[\u200B-\u200D\uFEFF]/g, ''));
                    liContainer.insertBefore(newEle, ul);
                }
            });
            ul.remove();
        }); */

        editor.undoManager.add();


        // 列项元素绑定类型
        /* const bulletTypes = ['line', 'circle', 'lower', 'num', 'hollow-circle', 'diamond', 'square', 'hollow-square', 'num-index'];
        try {
            var olNodes = [];
            var liContainer = parentLevelNode || blockPage;
            // 当前元素为层级项的
            var ulNode = Array.from(blockPage.querySelectorAll('ul,ol'));
            ulNode.forEach(ul => {
                let olNodes = Array.from(ul.querySelectorAll('.paste-list'));
                olNodes.forEach(li => {
                    let newEle = editor.dom.create('p', { style: 'text-indent: 2em;' }, li.textContent.replace(/[\u200B-\u200D\uFEFF]/g, ''));
                    liContainer.insertBefore(newEle, ul);
                });
                ul.remove();
            });
            // 清除剪贴板数据
            navigator && navigator.clipboard.writeText('');
        } catch (err) {
            console.error('解析粘贴内容出错：', err)
        } */
    },

    getNextParagraphNodes(currNode = null) {
        var nodes = [];
        const getParagraph = node => {
            let nextNode = node.nextElementSibling;
            if (nextNode && nextNode.className.match(/\ol-list|\appendix-list/ig) === null) { // nextNode.className.match(/\ol-list|\appendix-list/ig) === null
                nodes.push(nextNode);
                getParagraph(nextNode);
            }
        }
        getParagraph(currNode);
        return nodes;
    },

    /**
     * @description 获取当前的编辑器实例
     */
    getLevelIndex(pageContainer = "", currNode = null) {
        const listEles = Array.from(pageContainer.querySelectorAll('.ol-list, .appendix-list'));
        for (let i = 0; i < listEles.length; i++) {
            if (currNode === listEles[i]) {
                return i;
            }
        }
        return -1;
    },
    filterLevelByfirst(liEles = []) {
        let arrs = [];
        liEles.forEach(ele => {
            if ($global.hasClass(ele, 'ol-list') || $global.hasClass(ele, 'appendix-list') || (ele.nodeName === 'P' && !ele.className)) {
                let liIndex = this.getLevelIndex(ele.parentNode, ele);
                if (liIndex) {
                    arrs.push(ele);
                }
            }
        });
        return arrs;
    },

    // 处理标准编号
    dealstdSign(pageContainer = null, pageData = {}) {
        const editor = this.getActiveEditor();
        pageContainer = pageContainer || editor.getBody().querySelector('.page-container');
        const coverPage = pageContainer.querySelector('.info-block.cover');

        if ([1200, 1500].includes(pageData.stdKind)) {
            var stdTitleEle = coverPage.querySelector('h1 .stdTitle');
            stdTitleEle.textContent = pageData.stdTitle;
            this.changeCoverTitle(editor, stdTitleEle);
        }

        // 修改编号
        var stdNoSignEle = coverPage.querySelector('.numbers .stdSign');
        if (stdNoSignEle) {
            stdNoSignEle.textContent = pageData.stdSign;
        }
        // 修改发布单位
        var departmentEle = coverPage.querySelector('.main-util [data-tag="releaseDepartment"]');
        if (departmentEle) {
            var deptSplit = pageData.releaseDepartment.split("\n");
            departmentEle.innerHTML = deptSplit.join("<br/>");
        }
    },

    /**
     * @description 封面一致性程度同步前言内容
     * @param {Element} pageContainer
     * @param {Element} node
     */
    async dealConsistentSign(pageContainer = null, node = null) {
        const editor = this.getActiveEditor();
        pageContainer = pageContainer || editor.getBody().querySelector('.page-container');
        const prefacePage = pageContainer.querySelector('.info-block[data-outlinetype="1"]');
        if (!prefacePage) {
            return false;
        }
        const mapValue = { IDT: '等同', MOD: '修改', NEQ: '非等效' };

        var sourceStr = node.dataset.desc || "";
        var consistentSignText = node.textContent.replace(/\，/g, ',');
        var upperStr = consistentSignText.toUpperCase();
        if (consistentSignText.match(/(\ISO|\IEC)/) !== null && consistentSignText.match(/(\IDT|\MOD|\NEQ)/) !== null) {
            var strArr = [];
            var upperStrSplit = upperStr.split(',');
            var strSplit = node.textContent.split(',');
            if (upperStrSplit.length > 2) {
                upperStrSplit.forEach((str, i) => {
                    if (i === 0 && str.match(/(\ISO|\IEC)/) !== null) {
                        let isoStr = str.split(" ");
                        strArr.push(`”${isoStr[0]}“导则`);
                    } else if (i === 1 && str.match(/\PART/) !== null) {
                        str = str.replace(/\PART/g, '').replace(/\s/g, '');
                        if (!isNaN(str)) {
                            strArr.push(`第 ${str} 部分`);
                        }
                    } else if (i === upperStrSplit.length - 1 && str.match(/(\IDT|\MOD|\NEQ)/) !== null) {
                        str = mapValue[str];
                        strArr.push(`一致性程度为${str}`);
                    } else if (!isNaN(str) && /^\d{4}$/.test(str)) {
                        strArr.push(str);
                    } else {
                        str = strSplit[i];
                        if (sourceStr) {
                            strArr.push(`《${sourceStr}》`);
                        } else {
                            strArr.push(`《${str}》`);
                        }
                    }
                });

                var consistentSignEle = prefacePage.querySelector('[data-bind="consistentSign"]');
                if (!consistentSignEle) {
                    var forceFirstEle;
                    var orignStdNoList = prefacePage.querySelectorAll('[data-bind="orignStdNo"]');
                    if (!orignStdNoList.length) {
                        orignStdNoList = prefacePage.querySelectorAll('[data-bind="part"]');
                        if (!orignStdNoList.length) {
                            orignStdNoList = prefacePage.querySelectorAll('[data-bind="stdNo"]')
                        }
                    }
                    if (!orignStdNoList.length) {
                        forceFirstEle = prefacePage.querySelector('p[data-bind="docRule"]');
                    } else {
                        forceFirstEle = orignStdNoList[orignStdNoList.length - 1];
                    }
                    consistentSignEle = editor.dom.create('p', { style: 'text-indent: 2em;', 'data-bind': 'consistentSign' });
                    editor.dom.insertAfter(consistentSignEle, forceFirstEle);
                }
                consistentSignEle.innerHTML = "本文件参考" + strArr.join("，") + "。";
                editor.undoManager.add();
            }
        }
    },

    /**
     * @description 前言中标准代替号等元素处理
     * @param {String} origStdNo
     * @param {Element} pageContainer
     */
    dealPrefacePageVers(pageContainer = null, pageData = {}) {
        var editor = this.getActiveEditor();
        var origStdNo = pageData.origStdNo || ""
        pageContainer = pageContainer || editor.getBody().querySelector('.page-container');
        var prefacePage = pageContainer.querySelectorAll('.info-block[data-outlinetype="1"]');
        if (!prefacePage.length) {
            return false;
        }
        // 处理本文件代替
        prefacePage = prefacePage[prefacePage.length - 1];

        // 处理历次版本发布情况
        var verEle = prefacePage.querySelector('[data-bind="verdesc"]');
        if (!verEle) {
            verEle = editor.dom.create('p', { style: 'text-indent: 2em;', 'data-bind': 'verdesc' });
            verEle.textContent = "本文件及其所代替或废止的文件的历次版本发布情况为：";
            prefacePage.appendChild(verEle);
        }

        var docVerNodes = prefacePage.querySelectorAll('[data-bind="docVer"]');
        if (origStdNo) {
            if (docVerNodes.length && docVerNodes.length === 1) {
                docVerNodes.forEach(el => {
                    el.remove();
                })
            }
            var strSplit = origStdNo.split("、");
            strSplit.forEach((str, i) => {
                if (i === strSplit.length - 1) {
                    str += "。";
                } else {
                    str += "；";
                }
                let liEle = editor.dom.create('div', { class: 'bullet', 'data-bind': 'docVer', 'data-level': '1', 'data-type': 'line' }, pageData.stdSign + " " + str);
                prefacePage.appendChild(liEle);
            });
        } else {
            if (docVerNodes.length) {
                docVerNodes.forEach((el, i) => {
                    if (i === 0) {
                        el.textContent = '无';
                    } else {
                        el.remove();
                    }
                })
            } else {
                let liEle = editor.dom.create('div', { class: 'bullet', 'data-bind': 'docVer', 'data-level': '1', 'data-type': 'line' }, '无');
                editor.dom.insertAfter(liEle, verEle);
            }
        }
        editor.undoManager.add();
        return true;
    },

    /**
     * @description 前言中处理第几部分元素
     * @param {Object} pageData
     * @param {Element} pageContainer
     */
    dealPrefacePagePart(pageContainer = null, pageData = {}, data = {}) {
        var editor = this.getActiveEditor();
        pageContainer = pageContainer || editor.getBody().querySelector('.page-container');
        var prefacePage = pageContainer.querySelector('.info-block[data-outlinetype="1"]');
        if (!prefacePage || pageData.updateTime) {
            return false;
        }
        // 第几部分节点
        var forceStdNameEle = prefacePage.querySelector('[data-bind="stdNo"]');
        // 其他相关几个部分（先删除）
        var partListEles = prefacePage.querySelectorAll('[data-bind="part"]');
        partListEles.forEach(ele => {
            ele.remove();
        });

        if (data.numberStr) {
            // 第一行段落元素
            let forceFirstEle = prefacePage.querySelector('p[data-bind="docRule"]');
            if (!forceFirstEle) {
                forceFirstEle = prefacePage.querySelector('.header-title');
            }
            // 构建文本内容
            let stdNoSplit = pageData.stdNo.split(".");
            let bindStdName = `本文件是${pageData.stdSign} ${stdNoSplit[0]}《${data.stdNameText}》的第${data.numberStr}部分。${pageData.stdSign} ${stdNoSplit[0]}已经发布了以下部分：`;
            if (!forceStdNameEle) {
                forceStdNameEle = editor.dom.create('p', { style: 'text-indent: 2em;', 'data-bind': 'stdNo' }, '');
                if (forceFirstEle) {
                    editor.dom.insertAfter(forceStdNameEle, forceFirstEle);
                } else {
                    $global.prependChild(forceStdNameEle, prefacePage);
                }
            }
            forceStdNameEle.innerHTML = bindStdName;
            // 创建其他相关几个部分
            var numberStr = parseInt(data.numberStr);
            for (let i = 0; i < numberStr; i++) {
                let str = `第${numberStr-i}部分：`;
                if (i === 0) {
                    str += data.stdNameText + "。";
                } else {
                    str += "；";
                }
                let parentEle = editor.dom.create('div', { class: 'bullet', 'data-bind': 'part', 'data-level': '1', 'data-type': 'line' }, str);
                editor.dom.insertAfter(parentEle, forceStdNameEle);
            }
        } else {
            if (forceStdNameEle) {
                forceStdNameEle.remove();
            }
        }

        return true;
    },

    /**
     * @description 前言中处理代替元素
     * @param {Object} pageData
     * @param {Element} pageContainer
     */
    dealPrefacePageorigStdNo(pageContainer, pageData = {}, data = {}) {
        var editor = this.getActiveEditor();
        var prefacePage = pageContainer.querySelector('.info-block[data-outlinetype="1"]');
        if (!prefacePage) {
            return false;
        }
        // 第几部分节点
        var origStdNoEle = prefacePage.querySelector('[data-bind="orignStdNoTitle"]');
        var origStdNoList = prefacePage.querySelectorAll('[data-bind="orignStdNo"]');
        origStdNoList.forEach(ele => {
            ele.remove();
        });

        if (pageData.origStdNo) {
            var origStdNoStr = `本文件代替${pageData.stdSign} ${pageData.origStdNo}《${data.stdNameText}》，与${pageData.stdSign} ${pageData.origStdNo}相比，除结构调整和编辑性改动外，主要技术变化如下：`;
            var forceFirstEle;
            var stdNoParts = prefacePage.querySelectorAll('[data-bind="part"]');
            if (stdNoParts.length) {
                forceFirstEle = stdNoParts[stdNoParts.length - 1];
            } else {
                forceFirstEle = prefacePage.querySelector('[data-bind="docRule"]')
            }
            if (!origStdNoEle) {
                origStdNoEle = editor.dom.create('p', { 'style': 'text-indent: 2em;', 'data-bind': 'orignStdNoTitle' });
                if (forceFirstEle) {
                    editor.dom.insertAfter(origStdNoEle, forceFirstEle);
                } else {
                    $global.prependChild(origStdNoEle, prefacePage);
                }
            }
            origStdNoEle.innerHTML = origStdNoStr;
            // 新增相关说明列表（应从接口获取）
            for (let i = 0; i < 1; i++) {
                let str = '增加了/更改了/删除了...。';
                let parentEle = editor.dom.create('div', { class: 'bullet', 'data-bind': 'orignStdNo', 'data-level': '1', 'data-type': 'lower' });
                parentEle.innerHTML = str;
                editor.dom.insertAfter(parentEle, origStdNoEle);
            }
        } else {
            if (origStdNoEle) {
                origStdNoEle.remove();
            }
        }
        this.dealPrefacePageVers(pageContainer, pageData);
        return true;
    },

    /**
     * @description 解析粘贴的内容
     * @param {String} content
     */
    parsePasteContent(content = "") {
        var editor = this.getActiveEditor();
        if (content) {
            var section = document.createElement('div');
            section.innerHTML = content;
            const clearAttrs = (nodes) => {
                nodes.forEach(ele => {
                    if (!['#text', 'BR', 'A'].includes(ele.nodeName)) {
                        editor.dom.removeAllAttribs(ele);
                        let childs = Array.from(ele.childNodes);
                        if (childs.length) {
                            childs = clearAttrs(childs);
                        }
                    }
                })
                return nodes;
            }
            var childNodes = Array.from(section.childNodes);
            childNodes = clearAttrs(childNodes);
            if (childNodes.length === 1) {
                return section.textContent;
            }
            // 组织内容
            var nodeHtml = [];
            childNodes.forEach(node => {
                if (['OL', 'UL'].includes(node.nodeName)) {
                    let childs = Array.from(node.childNodes);
                    childs.forEach(ele => {
                        if (!['#text', 'BR', 'A'].includes(ele.nodeName)) {
                            nodeHtml.push(`<p style="text-indent: 2em;">${ele.textContent}</p>`);
                        }
                    });
                } else if (node.nodeName === 'TABLE') {
                    var newTable = this.parseTable(node);
                    nodeHtml.push(newTable.outerHTML);
                } else {
                    nodeHtml.push(`<p style="text-indent: 2em;">${node.textContent}</p>`);
                }
            });
            content = nodeHtml.join("");
            section.remove();
        }
        return content;
    },

    // 表格单元重置colgroup
    setTableColGroup(tableNode) {
        if (!tableNode.querySelector('colgroup')) {
            var cols = [], allWidth = 0;
            var colgroup = document.createElement('colgroup');
            var tbody = tableNode.querySelector('tbody');
            if (tbody) {
                var trs = Array.from(tbody.querySelectorAll('tr'));
                for (let tr of trs) {
                    let tds = Array.from(tr.querySelectorAll('td'));
                    for (let i=0; i<tds.length; i++) {
                        let td = tds[i];
                        if (td.colSpan === 1 && !_.find(cols, {index:i})) {
                            allWidth += td.offsetWidth
                            cols.push({index:i, width:td.offsetWidth });
                        }
                    }
                }
            }
            for (let i = 0; i < cols.length; i++) {
                let item = cols[i];
                let colEle = document.createElement('col');
                let pw = parseFloat((item.width / allWidth * 100).toFixed(3)) + '%';
                colEle.setAttribute('style', `width:${pw};`)
                colgroup.appendChild(colEle);
            }
            $global.prependChild(colgroup, tableNode);
        }
        return tableNode;
    },

    parseTable(table = null) {
        var newTable = document.createElement('table');
        newTable.setAttribute('border', '1');
        newTable.style.width = 'width: 100%; border: 2px solid #333;';
        var tableTitle = document.createElement('caption');
        tableTitle.className = 'table-title';
        tableTitle.textContent = "表标题";
        tableTitle.dataset.number = "1";
        newTable.appendChild(tableTitle);

        newTable.dataset.id = $global.guid();
        var colgroup = document.createElement('colgroup');
        newTable.appendChild(colgroup);
        var tbody = document.createElement('tbody');
        newTable.appendChild(tbody);

        var cols = 0;
        var trs = Array.from(table.querySelectorAll('tr'));
        trs.forEach(tr => {
            let tds = Array.from(tr.childNodes);
            if (!cols) {
                cols = tds.length;
            }
            tds.forEach((td, i) => {
                var width = td.width || td.offsetWidth;
                td.innerText = td.textContent;
            });
            tbody.appendChild(tr)
        });
        var pw = parseFloat((1 / cols * 100).toFixed(3)) + '%';
        for (let i = 0; i < cols; i++) {
            var colEle = document.createElement('col');
            colEle.setAttribute('style', `width:${pw};`)
            colgroup.appendChild(colEle);
        }

        return newTable;
    },

    removeAttrs(node = null) {
        var editor = this.getActiveEditor();
        editor.dom.removeAllAttribs(node);
        var childNodes = node.childNodes;
        childNodes
        attrs.forEach()
    },

    /**
     * @description 复制条目
     * @param {Object} editor
     * @param {Element} currNode 当前的条目
     */
    copyLevelNodes(editor = null, currNode = null) {
        if (!editor || !editor.getBody()) {
            return;
        }
        var pageContainer = editor.getBody().querySelector('.page-container');

        var copyNodes = [currNode];
        const getChildNode = node => {
            // copyNodes.push(node);
            let childs = Array.from(pageContainer.querySelectorAll(`[data-source="${node.dataset.index}"]`));
            if (childs.length) {
                for (let i = 0; i < childs.length; i++) {
                    copyNodes.push(childs[i]);
                    getChildNode(childs[i]);
                }
            }
        }

        getChildNode(currNode);
        return copyNodes;
    },

    /**
     * @description 光标定位在元素的最后位置
     * @param {Element} element
     * @param {Boolean} extraBr 聚焦后光标是否在最前面
     */
    moveSelectionToElement(editor, element, extraBr = false) {
        editor = this.getActiveEditor();
        if (element && element.textContent !== '') {
            editor.selection.select(element, true);
            editor.selection.collapse(extraBr);
        }
    },

    /**
     *  @description 清除tag标签节点的聚焦
     *  @param {Object} editor
     */
    clearFocus(editor = null) {
        editor = this.getActiveEditor();
        if (!editor || !editor.getBody()) {
            return;
        }
        var pageContainer = editor.getBody().querySelector('.page-container');
        if (pageContainer) {
            var tagFocus = Array.from(pageContainer.querySelectorAll('[data-tag].focus'));
            tagFocus.forEach(node => {
                let textLens = node.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').length;
                if (textLens === 0 && !node.dataset.code) {
                    node.textContent = "";
                }
                $global.removeClass(node, 'focus');
            });
            var focusNodes = Array.from(pageContainer.querySelectorAll('.on-focus'));
            focusNodes.forEach(node => {
                $global.removeClass(node, 'on-focus');
            })
        }
    },
    /**
     * @description 清除tag标签的文字（聚焦后设定的TAG文字）
     * @param {Object} editor
     */
    resetTagOthers(editor = null) {
        editor = this.getActiveEditor();
        if (!editor || !editor.getBody()) {
            return;
        }
        var pageContainer = editor.getBody().querySelector('.page-container');
        if (pageContainer) {
            var tagNodes = pageContainer.querySelectorAll('[data-tag].other:not(.focus)');
            tagNodes.forEach(node => {
                if (node.dataset && node.textContent === node.dataset.name) {
                    node.textContent = "";
                }
            })
        }
    },

    /**
     * @description 封面发布日期与实施日期校验
     * @param {Object} editor
     * @param {Element} ele
     */
    changeCoverDate(editor = null, ele = null) {
        editor = this.getActiveEditor();
        var pageContainer = editor.getBody().querySelector('.page-container');
        var publishDateEle = pageContainer.querySelector('.info-block.cover .footer-publish');
        var putDateEle = pageContainer.querySelector('.info-block.cover .footer-put');
        if (publishDateEle && putDateEle) { //  && publishDateEle.textContent !== ''  && putDateEle.textContent !== ''
            let flag;
            if ($global.isDate(publishDateEle.textContent) && $global.isDate(putDateEle.textContent)) {
                var publishTime = new Date(publishDateEle.textContent).getTime();
                var putTime = new Date(putDateEle.textContent).getTime();
                if (publishTime > putTime) {
                    editor.windowManager.alert('发布日期不能大于实施日期！');
                }
            }
        }
    },

    resetDepartment(editor = null) {
        editor = this.getActiveEditor();
        if (!editor || !editor.getBody()) {
            return false;
        }
        var pageContainer = editor.getBody().querySelector('.page-container');
        if (pageContainer) {
            var coverPage = pageContainer.querySelector('.cover');
            if (coverPage) {
                var utilComp = coverPage.querySelector('.main-util');
                if (utilComp) {
                    // 如果是国标或技术方案类型的不做处理
                    if ($global.hasClass(utilComp, 'gb')) {
                        return;
                    }
                    var fontSize = '18Pt';
                    var deptEles = utilComp.querySelectorAll(':scope>p');

                    deptEles.forEach(ele => {
                        var txtLens = ele.textContent.replace(/\s/g, '').length;
                        if (txtLens > 20 && txtLens < 24) {
                            fontSize = '16pt';
                        } else if (txtLens >= 24) {
                            fontSize = '14pt';
                        } else {
                            if (ele.style.fontSize) {
                                fontSize = ele.style.fontSize;
                            }
                        }
                        ele.style.fontSize = fontSize;
                    })
                }
            }
        }
    },

    /**
     * @description 封面抬头标题
     * @param {Object} editor
     * @param {Element} ele
     */
    changeCoverTitle(editor = null, ele = null) {
        editor = this.getActiveEditor();
        if (!editor || !editor.getBody()) {
            return false;
        }
        if (!ele) {
            var pageContainer = editor.getBody().querySelector('.page-container');
            if (pageContainer) {
                ele = pageContainer.querySelector('.info-block.cover h1.title');
            }
        }
        if (!ele) {
            return false;
        }

        ele = editor.dom.getParent(ele, 'h1.title');
        if ($global.hasClass(ele, 'gb') || $global.hasClass(ele, 'zd')) {
            return;
        }

        if (ele && ele.firstChild.nodeName !== 'IMG') {
            var stdTitle = ele.textContent.replace(/\s/g, '');
            var size = 25.5, spacing = 7;
            switch (stdTitle.length) {
                case 1:
                case 2:
                case 3:
                case 4:
                    spacing = 45;
                    break;
                case 5:
                    spacing = 31;
                    break;
                case 6:
                    spacing = 23;
                    break;
                case 7:
                    spacing = 18;
                    break;
                case 8:
                    spacing = 14;
                    break;
                case 9:
                    spacing = 11;
                    break;
                case 10:
                    spacing = 8.5;
                    break;
                case 11:
                    spacing = 7;
                    break;
                case 12:
                    spacing = 5.5;
                    break;
                case 13:
                    spacing = 4.2;
                    break;
                case 14:
                    spacing = 3.3;
                    break;
                case 15:
                    spacing = 2.5;
                    break;
                case 16:
                    spacing = 1.6;
                    break;
                case 17:
                    spacing = 1;
                    break;
                case 18:
                    spacing = 0.8;
                    break;
                case 19:
                    spacing = 0;
                    size = 25;
                    break;
                case 20:
                    spacing = 0;
                    size = 24;
                    break;
                case 21:
                    spacing = 0;
                    size = 22.5;
                    break;
                case 22:
                    spacing = 0;
                    size = 21;
                    break;
                case 23:
                    spacing = 0;
                    size = 20;
                    break;
                case 24:
                    spacing = 0;
                    size = 19;
                    break;
                case 25:
                    spacing = 0;
                    size = 18;
                    break;
                case 26:
                    spacing = 0;
                    size = 17;
                    break;
                case 27:
                    spacing = 0;
                    size = 16;
                    break;
                default:
                    spacing = 0;
                    size = 14;
            }
            ele.style.fontSize = `${size}pt`;
        }
    },

    /**
     * @description 移除已定义的标签
     * @param {Object}  editor
     * @param {String}  cls
     */
    removeTags(editor = null, cls = '') {
        editor = this.getActiveEditor();
        var currNode = editor.selection.getNode();
        editor.windowManager.confirm("确定移除?", s => {
            if (s) {
                editor.formatter.remove('setTags', { value: cls, id: currNode.dataset.id, title: currNode.getAttribute('title'), content: currNode.dataset.content }, currNode);
            }
        })
    },

    /**
     * @description 添加术语
     * @param {Object}  editor
     * @param {Object}  data
     */
    addTerm(editor = null, data = {}) {
        editor = this.getActiveEditor();
        var currNode = editor.selection.getNode();
        var parentNode = editor.dom.getParent(currNode, '.ol-list');
        var err;
        if (!parentNode) {
            err = '术语只能用于条目中！';
        }

        if (err) {
            editor.windowManager.alert(err);
            return false;
        }
        var olEle = this.extransTermNode(editor, parentNode, true);

        olEle.innerHTML = '&#8203';
        editor.dom.add(olEle, 'p', { 'class': 'term', 'data-id': $global.guid(), 'data-tag': 'tag', 'title': '自定义术语', 'style': 'text-indent:2em;' },
            `<span style="font-family: simHei;">${data.cnName}</span><span style="margin-left:1em;font-family: times new roman;font-weight:bold">${data.enName}</span>`);
        editor.dom.add(olEle, 'p', { style: 'text-indent:2em;' }, '输入术语的解释...');
        olEle.dataset.content = JSON.stringify(data);
        $global.addClass(olEle, 'term');

        levelUtil.sortLevel(editor);
    },
    /**
     * @description 生成新的术语条目
     * @param {Object} editor
     * @param {Object} parentNode
     */
    extransTermNode(editor = null, parentNode = null, notBookmark=false) {
        editor = this.getActiveEditor();
        var olEle;
        var outlineid = parentNode.dataset.outlineid;
        var uuid = $global.guid();
        if (parentNode.textContent.replace(/\u200B/g, '') === '') {
            olEle = parentNode;
            if ($global.hasClass(olEle, 'hide-list')) {
                $global.removeClass(olEle, 'hide-list');
                $global.removeClass(olEle, 'level0');
                olEle.dataset.outlineid = uuid;
                olEle.dataset.contentid = $global.guid();
                if (olEle.dataset.bookmark && !notBookmark) {
                    olEle.dataset.bookmark = uuid;
                }
                if (olEle.dataset.index.split('.').length === 1) {
                    olEle.dataset.parentid = outlineid;
                }
                if (notBookmark) {
                    olEle.removeAttribute('data-bookmark');
                }
                olEle.removeAttribute('data-owner');
            }
        } else {
            olEle = parentNode.cloneNode();
            olEle.dataset.outlineid = uuid;
            olEle.dataset.contentid = $global.guid();
            $global.removeClass(olEle, 'hide-list');
            if (parentNode.dataset.bookmark) {
                olEle.dataset.bookmark = uuid;
            }
            if (olEle.dataset.index.split('.').length === 1) {
                olEle.dataset.parentid = outlineid;
            }
            if (notBookmark) {
                olEle.removeAttribute('data-bookmark');
            }
            olEle.removeAttribute('data-owner');
            editor.dom.insertAfter(olEle, parentNode);
        }
        return olEle;
    },

    /**
     * @description 当前位置插入术语条目
     * @param {Object}  editor
     * @param {String}  htmlContent
     */
    insertTerm(editor = null, htmlContent = '', notBookmark=false) {
        editor = this.getActiveEditor();
        var currNode = editor.selection.getNode();
        var parentNode = editor.dom.getParent(currNode, '.ol-list');

        if (parentNode) {
            var olEle = this.extransTermNode(editor, parentNode, notBookmark);
            olEle.innerHTML = htmlContent;
            $global.addClass(olEle, 'term');
            levelUtil.sortLevel(editor);
        }
    },

    /**
     * @description 移除术语
     * @param {Object}  editor
     */
    removeTerm(editor = null) {
        editor = this.getActiveEditor();
        var currNode = editor.selection.getNode();
        var olEle = editor.dom.getParent(currNode, '.term');
        editor.windowManager.confirm("确定移除?", s => {
            if (s) {
                olEle.removeAttribute('data-content');
                $global.removeClass(olEle, 'term');
                olEle.innerHTML = "<br/>";
            }
        })
    },

    /**
     * @description 当前节点后插入一个新的段落
     * @param {Object}  editor
     * @param {Element}  currNode 当前节点
     * @param {Boolean}  shiftKey 是否按住了 shift键
     * @param {Boolean}  isKeyboard 是否键盘操作
     */
    insertParagraph(editor = null, currNode = null, shiftKey = false, isKeyboard = false) {
        editor = this.getActiveEditor();
        var rng = editor.selection.getRng();
        // debugger
        if (currNode) {
            // 判断当前的元素如为行内元素则处理
            if (['#text', 'SPAN', 'EM', 'STRONG'].includes(currNode.nodeName)) {
                currNode = editor.dom.getParent(currNode, 'p') || editor.dom.getParent(currNode, 'div');
            }

            if ($global.hasClass(currNode, 'tag other')) {
                var text = currNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '');
                if (text !== "") {
                    editor.execCommand('mceInsertContent', false, `<br/>&#8203`);
                }
                return false;
            } else {
                let style = ` style="text-indent: 2em;"`;
                let parentNode = currNode.parentNode;
                let parentCls = parentNode.getAttribute('class');
                let newParagraph, identValue = 2;
                if ($global.hasClass(currNode, 'bullet')) {
                    // 如果是在列项后插入
                    let bulletLevel = parseInt(currNode.dataset.level || '0', 10);
                    // identValue = (bulletLevel + 1) * 2;
                    newParagraph = editor.dom.create('p', { style: `text-indent: ${identValue}em;` }, '&#8203');
                    editor.dom.insertAfter(newParagraph, currNode);
                    this.moveSelectionToElement(editor, newParagraph);
                    return true;
                } else if ($global.hasClass(parentNode, 'math-desc') && !isKeyboard) {
                    newParagraph = editor.dom.create('p', { style: `text-indent: ${identValue}em;` }, '&#8203');
                    editor.dom.insertAfter(newParagraph, parentNode);
                    this.moveSelectionToElement(editor, newParagraph);
                    return true;
                } else {
                    let txt = rng.commonAncestorContainer.textContent;
                    let t1 = txt.slice(0, rng.endOffset);
                    let t2 = txt.slice(rng.endOffset, txt.length);
                    if (shiftKey) {
                        if (rng.commonAncestorContainer.nodeName === '#text' && ($global.hasClass(currNode, 'ol-list') || $global.hasClass(currNode, 'appendix-list'))) {
                            rng.commonAncestorContainer.textContent = t1;
                            if (this.vm.editorSetting.isStandard) {
                                newParagraph = editor.dom.create('p', { style: `text-indent: ${identValue}em;` }, t2 || '&#8203');
                            } else {
                                newParagraph = editor.dom.create('p', {}, t2 || '&#8203');
                            }

                            if (currNode.nodeName === 'P') {
                                editor.dom.insertAfter(newParagraph, currNode);
                            } else {
                                editor.dom.insertAfter(newParagraph, rng.commonAncestorContainer);
                            }
                            this.moveSelectionToElement(editor, newParagraph, true);
                            editor.undoManager.add();
                            return true;
                        }
                        editor.execCommand('mceInsertContent', false, `<br/>&#8203`);
                        return true;
                    } else {
                        let emptyStr = '';
                        if (($global.hasClass(currNode, 'ol-list') || $global.hasClass(currNode, 'appendix-list')) && currNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '') === '') {
                            emptyStr = '&#8203';
                        }
						if (this.vm.editorSetting.isStandard) {
							newParagraph = editor.dom.create('p', { style: `text-indent: ${identValue}em;` }, t2 || '&#8203');
						} else {
							newParagraph = editor.dom.create('p', {}, t2 || '&#8203');
						}
                        if (this.vm.pageData?.stdKind === this.vm.editorSetting.tmplType) {
                            newParagraph.style.textIndent = null;
                        }
                        if (rng.commonAncestorContainer.nodeName === '#text') {
                            rng.commonAncestorContainer.textContent = t1;

                            if (currNode.nodeName === 'P') {
                                editor.dom.insertAfter(newParagraph, currNode);
                            } else {
                                editor.dom.insertAfter(newParagraph, rng.commonAncestorContainer);
                            }
                            this.moveSelectionToElement(editor, newParagraph, true);
                            editor.undoManager.add();
                            return true;
                        } else if (rng.commonAncestorContainer.nodeName === 'P') {
							editor.dom.insertAfter(newParagraph, rng.commonAncestorContainer);
							this.moveSelectionToElement(editor, newParagraph, true);
                            editor.undoManager.add();
                            return true;
                        }
						newParagraph.remove();
                        if (this.vm.pageData?.stdKind === this.vm.editorSetting.tmplType) {
                            style = '';
                        }
                        editor.execCommand('mceInsertContent', false, `${emptyStr}<p${style}>&#8203</p>`);
                        return true;
                    }
                }
            }
        }
        return false;
    },

    /**
     * @description 在当前条目位置插入新的条目
     * @param {Object} editor
     * @param {Object} currNode 当前节点
     * @param {Object} node 新的节点
     * @param {String} position 之前|之后
     */
    insertLevel(editor = null, currNode = null, node = null, position = 'after') {
        editor = this.getActiveEditor();
        var indexLens = currNode.dataset.index.split('.').length;
        var error;
        // 新节点属性
        node.dataset.outlineid = $global.guid();
        node.dataset.contentid = $global.guid();
        node.dataset.outlinetype = currNode.dataset.outlinetype;

        // 之后插入
        if (position === 'after') {
            editor.dom.insertAfter(node, currNode);
            // 在章节后插入
            if (indexLens === 1) {
                node.dataset.parentid = currNode.dataset.outlineid;
                node.dataset.source = currNode.dataset.index;
            } else {
                node.dataset.parentid = currNode.dataset.parentid;
                node.dataset.source = currNode.dataset.source;
            }
            // 之前插入
        } else {
            // 判断当前节点是否为章标题，如是则不能插入
            if (indexLens === 1) {
                error = '不能在章节元素前插入！';
            } else {
                var block = editor.dom.getParent(currNode, '.info-block');
                node.dataset.parentid = currNode.dataset.parentid;
                node.dataset.source = currNode.dataset.source;
                block.insertBefore(node, currNode);
            }
        }
        levelUtil.sortLevel(editor);
        return error;
    },

    /**
     * @description 将当前元素置为条0.1 条0.2 .....无条1 无条2 .....
     * @param {Object}  editor
     * @param {Element}  currNode 当前节点
     */
    resetDomIndex(editor = null, currNode = null) {
        editor = this.getActiveEditor();
        if (!$global.hasClass(currNode, 'index-list')) {
            var newOl = editor.dom.create('div', { class: 'index-list' }, currNode.innerHTML);
            editor.dom.insertAfter(newOl, currNode)
            currNode.remove();
        }
        this.resetNumberByDomIndex(editor);
    },
    resetNumberByDomIndex(editor = null) {

    },

    /**
     * @description 将当前元素置为条1 条2 .....无条1 无条2 .....
     * @param {Object}  editor
     * @param {Element}  currNode 当前节点
     * @param {Object}  item 点击按钮的选项
     * @param {Boolean}  isAll  是否为全部处理
     * @param {Boolean}  isAssignOutline 是否为可协同分配
     */
    resetChapter(editor = null, currNode = null, item = null, isAll = false, isAssignOutline = false) {
        editor = this.getActiveEditor();
        if ($global.hasClass(currNode, 'ol-list') || $global.hasClass(currNode, 'appendix-list')) {
            const block = editor.dom.getParent(currNode, '.info-block');
            const getPrevLi = (lens, node) => {
                try {
                    if (node.dataset && node.dataset.index && node.dataset.index.split(".").length === lens) {
                        return node;
                    } else {
                        return getPrevLi(lens, node.previousElementSibling);
                    }
                } catch (err) {
                    return null;
                }
            }
            if ($global.hasClass(currNode, 'appendix-list') && !currNode.dataset.prev) {
                currNode.dataset.prev = block.dataset.letter;
                if (currNode.dataset.index.startsWith(".")) {
                    currNode.dataset.index = currNode.dataset.index.replace(/^[.]/g, '');
                }
            }
            // 当前层级
            var currLens = currNode.dataset.index.split(".").length - 1;
            // 需要减少的层级
            var changeLevel = $global.hasClass(currNode, 'ol-list') ? item.indexLens - 1 : item.indexLens - 2;
            // 是否减少
            var shiftKey = (currLens - changeLevel) > 0;

            // 循环处理增加\减少层级
            var lev = Math.abs(currLens - changeLevel);
            if (lev > 0) { //  && !isAssignOutline
                for (let i = 0; i < lev; i++) {
                    this.setIndent(editor, currNode, shiftKey, isAll, changeLevel);
                }
            }
            currNode.removeAttribute('data-mce-style');
            let olIndex = currNode.dataset.index;
            if (olIndex.split(".").length > 1) {
                $global.removeClass(currNode, 'level0');
            } else {
                if (!$global.hasClass(currNode, 'appendix-list')) {
                    $global.addClass(currNode, 'level0');
                }
            }
            // $global.removeClass(currNode, 'top-margin');
            currNode.removeAttribute('style');
            // 去除间隔CLass
            $global.removeClass(currNode, 'top-margin');

            // 无条题
            if (item.cata == 2) {
                currNode.removeAttribute('data-bookmark');
                // return true;
            } else {
                currNode.setAttribute('data-bookmark', currNode.dataset.outlineid);
                // return true;
            }
            // 重置
            // levelUtil.sortLevel(editor);
            return true;
        } else if ($global.hasClass(currNode, 'bullet') || currNode.nodeName === 'DIV' || currNode.nodeName === 'P') {
            var isShiftkey = true;
            var parentOlEle = editor.dom.getParent(currNode, '[data-index]');
            if (parentOlEle && parentOlEle.dataset.index.split(".").length < item.indexLens) {
                isShiftkey = false;
            }

            var newOl = this.appendLevel(editor, currNode, isShiftkey, isAssignOutline, item.indexLens === 1);
            if (newOl) {
                $global.removeClass(newOl, 'enlock');
                // 如果下级兄弟元素有段落的则包含在内
                let nextNodes = $global.getNextAllNodes(newOl, '', true);
                if (nextNodes.length) {
                    for (let i = 0; i < nextNodes.length; i++) {
                        let node = nextNodes[i];
                        if (node.nodeName === 'DIV' && ($global.hasClass(node, 'ol-list') || $global.hasClass(node, 'appendix-list'))) {
                            break;
                        } else {
                            newOl.appendChild(node);
                        }
                    }
                }
                newOl.removeAttribute('data-owner');
                this.moveSelectionToElement(editor, newOl);
                this.resetChapter(editor, newOl, item, false, isAssignOutline);
            }
            return true;
        } else if (currNode.nodeName === 'SPAN') {
            let parentNode = currNode.parentNode;
            if (parentNode.nodeName === 'P' && ($global.hasClass(parentNode.parentNode, 'ol-list') || $global.hasClass(parentNode.parentNode, 'appendix-list'))) {
                var newOl = this.appendLevel(editor, parentNode, true, isAssignOutline);
                if (newOl) {
                    /* if (!newOl.dataset.bookmark) {
                        item.cata = 2;
                    } */
                    this.moveSelectionToElement(editor, newOl);
                    this.resetChapter(editor, newOl, item, false, isAssignOutline);
                }
                return true;
            } else if (!currNode.className && currNode.contentEditable !== 'false' && ($global.hasClass(parentNode, 'ol-list') || $global.hasClass(parentNode, 'appendix-list'))) {
                let textNode = document.createTextNode(currNode.textContent);
                $global.insertAfter(textNode, currNode);
                currNode.remove();
                this.resetChapter(editor, parentNode, item, isAll, isAssignOutline);
                return true;
            }
        }
    },

    /**
     * @description TAB键处理段落缩进及层级项的序号
     * @param {Object}  editor
     * @param {Element}  currNode 当前节点
     * @param {Boolean}  shiftKey shift键
     */
    setIndent(editor = null, currNode = null, shiftKey = false, isAll = false, changeLevel) {
        editor = this.getActiveEditor();
        var cls = currNode.className;
        if (currNode.nodeName === 'P' && !cls) {
            // 段落回退缩进
            let textIndent = editor.dom.getStyle(currNode, 'text-indent') || '0';
            let indentValue = shiftKey ? parseInt(textIndent) - 2 : parseInt(textIndent) + 2;
            if (indentValue < 0) {
                indentValue = 0;
            }
            if (!indentValue) {
                let style = editor.dom.getAttrib(currNode, 'style');
                var reg = new RegExp('text-indent?(.+?)"?[;}]', 'ig');
                style = style.replace(reg, '');
                editor.dom.setAttrib(currNode, 'style', style);
            } else {
                editor.dom.setStyle(currNode, 'text-indent', `${indentValue}em`);
            }

        } else if (cls && cls.match(/(ol-list|appendix-list)/ig) !== null) {
            // 条目层级项序号递增或递减
            if (!changeLevel) {
                changeLevel = currNode.dataset.index.split(".").length;
                changeLevel = shiftKey ? changeLevel - 2 : changeLevel;
            }
            this.toggleLevel(editor, currNode, shiftKey, isAll, changeLevel);
        } else if (cls && cls.match(/bullet/ig) !== null) {
            // 列项递增或递减
            this.toggleBullet(editor, currNode, shiftKey, isAll);
        } else if (cls.match(/(zhu|zhux|example|examplex)/ig) !== null) {
            // 注|注X|示例|示例X
            this.toggleTag(editor, currNode, shiftKey);
        } else if (currNode.nodeName === 'LI') {
            let liLevel = currNode.dataset.level ? parseInt(currNode.dataset.level) : 0;
            if (shiftKey) {
                if (liLevel > 0) {
                    currNode.dataset.level = liLevel - 1;
                }
            } else {
                if (liLevel<7) {
                    currNode.dataset.level = liLevel + 1;
                }
            }
        }
    },

    toggleTag(editor = null, currNode = null, shiftKey = false) {
        editor = this.getActiveEditor();
        let levelNum = currNode.dataset.level ? parseInt(currNode.dataset.level, 10) : 0;
        if (!shiftKey) {
            levelNum++;
        } else {
            levelNum--;
        }
        if (levelNum > 0) {
            if (levelNum < 4) {
                currNode.dataset.level = levelNum;
            } else {
                currNode.dataset.level = 3;
            }
        } else {
            currNode.removeAttribute('data-level');
        }
    },
    /**
     * @description 重新定义列项的ID
     * @param {Object} editor
     */
    resetBulletId(editor = null) {
        editor = this.getActiveEditor();
        if (!editor) {
            return;
        }
        var pageContainer = editor.getBody().querySelector('.page-container');
        if (!pageContainer) {
            return;
        }

        var blocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.fixed):not(.disabled)'));
        blocks.forEach(block => {
            let bullets = Array.from(block.querySelectorAll('.bullet[data-start]'));
            let prevBlock = block.previousElementSibling;
            bullets.forEach(bullet => {
                if (!bullet.dataset.id) {
                    bullet.dataset.id = $global.guid();
                }

                // 当前列项为自然分页的
                let parentNode = bullet.parentNode;
                if (bullet.dataset.cross && prevBlock) {
                    let parentLi;
                    if ($global.hasClass(parentNode, 'hide-list')) {
                        parentLi = prevBlock.querySelector(`div.ol-list[data-outlineid="${parentNode.dataset.outlineid}"],div.appendix-list[data-outlineid="${parentNode.dataset.outlineid}"]`);
                    } else {
                        parentLi = prevBlock;
                    }
                    if (parentLi) {
                        let parentSameBullets = Array.from(parentLi.querySelectorAll(`.bullet[data-type="${bullet.dataset.type}"][data-level="${bullet.dataset.level}"]`));
                        if (parentSameBullets.length) {
                            let lastBullet = parentSameBullets[parentSameBullets.length - 1];
                            bullet.dataset.id = lastBullet.dataset.id;
                        }
                    }
                }

                // 这里的处理有点问题
                let sameBullets = bulletUtil.getSameNodesByParam(bullet, { type: bullet.dataset.type, level: parseInt(bullet.dataset.level), isGet: true });
                if (sameBullets.length > 0) {
                    for (let i = 0; i < sameBullets.length; i++) {
                        let node = sameBullets[i];
                        if (node.dataset.start && node.dataset.cross) { // && i > 0
                            node.removeAttribute('data-start');
                            node.removeAttribute('data-cross');
                            node.removeAttribute('style');
                        }
                        // 清理文档合并后影响的属性
                        if ($global.hasClass(node, 'hide-list')) {
                            $global.removeClass(node, 'hide-list');
                        }
                        node.dataset.id = bullet.dataset.id;
                    }
                }
            });
        })
    },

    /**
     * @description 列项层级切换
     * @param {Object} editor
     * @param {Element} currNode
     * @param {Boolean}  shiftKey shift键
     */
    toggleBullet(editor = null, currNode = null, shiftKey = false) {
        editor = this.getActiveEditor();
        const block = editor.dom.getParent(currNode, '.info-block');
        var newType;
        var level = parseInt(currNode.dataset.level);
        var type = currNode.dataset.type;

        // 获取上下一个同类兄弟列项
        var samLevelNodes = [];
        if (!shiftKey) {
            if (level >= 9) {
                editor.windowManager.alert('层级不能大于9层');
                return false;
            } else {
                currNode.dataset.level = level + 1;
                newType = bulletUtil.getTypeBySameLevel(currNode);
                // 如果还不能定义类型的
                if (!newType) {
                    newType = bulletUtil.nextBulletType(type);
                }
                currNode.dataset.type = newType;
                // 往下查找相同属性的列项
                samLevelNodes = bulletUtil.getSameNodesByParam(currNode, { type: newType, level: level + 1, isGet: true });
                // 如没有则继续往上查找相同属性的列项
                if (!samLevelNodes.length) {
                    samLevelNodes = bulletUtil.getSameNodesByParam(currNode, { type: newType, level: level + 1, isGet: true }, '==', false);
                }

                // 如果是有编号类型的则计算起始编号
                if (!samLevelNodes.length && ['num', 'lower', 'num-index', 'tag-index'].includes(newType)) {
                    currNode.dataset.id = $global.guid(); // 重新定义ID
                    currNode.dataset.start = 0;
                    currNode.style.counterReset = `${newType} 0`;
                } else {
                    if (samLevelNodes.length) {
                        currNode.dataset.id = samLevelNodes[0].dataset.id;
                    }
                    currNode.removeAttribute('style');
                    currNode.removeAttribute('data-restart');
                    currNode.removeAttribute('data-start');
                }
            }
        } else {
            // 仅允许同类项中第一个节点可操作
            if (level - 1 > -1) {
                currNode.dataset.level = level - 1;
                newType = bulletUtil.getTypeBySameLevel(currNode);

                // 如果还不能定义类型的
                if (!newType) {
                    newType = bulletUtil.prevBulletType(type);
                }
                currNode.dataset.type = newType;
            } else {
                return false;
            }
        }
        bulletUtil.resetBulletNumberByParent(editor, currNode.parentNode);
        editor.undoManager.add();
    },


    /**
     * @description 合并到相同类型|层级中
     * @param {Element}  container
     * @param {Array}  nodes
     * @param {String}  type
     * @param {Element}  currNode
     */
    mergeSameBullet(container, nodes = [], currNode = null) {
        var id = nodes[0].dataset.id;
        var type = nodes[0].dataset.type;
        currNode.dataset.id = id;
        nodes = bulletUtil.getAllSameNodesById(container, currNode.dataset.id);
        bulletUtil.resortBullet(nodes, type);
    },

    /**
     * @description 移除列项元素并转为段落
     * @param {Object} editor
     * @param {Element} currNode
     */
    removeBullet(editor = null, currNode = null) {
        editor = this.getActiveEditor();
        var newEle = editor.dom.create('p', { style: 'text-indent: 2em;' }, '&#8203');
        var level = parseInt(currNode.dataset.level) - 1;
        var nodeId = currNode.dataset.id;
        var nodeType = currNode.dataset.type;
        var prevNode = bulletUtil.getPrevSameLevel(currNode, level);
        var nextNodes = bulletUtil.getSameNodesByParam(currNode, { type: nodeType, id: nodeId }, '==');
        if (level < 0 || !prevNode) {
            editor.dom.insertAfter(newEle, currNode);
            currNode.remove();
            if (nextNodes.length) {
                bulletUtil.resortBullet(nextNodes, nodeType);
            }
            this.moveSelectionToElement(editor, newEle, true);
            return newEle;
        } else {
            if (prevNode) {
                let container = editor.getBody().querySelector('.page-container');
                let type = prevNode.dataset.type;
                let level = prevNode.dataset.level;
                if (prevNode.dataset.id) {
                    currNode.dataset.id = prevNode.dataset.id;
                }
                currNode.dataset.type = type;
                currNode.dataset.level = level;

                let nodes = bulletUtil.getAllSameNodesById(container, prevNode.dataset.id, prevNode);
                bulletUtil.resortBullet(nodes, type);

                if (nextNodes.length) {
                    bulletUtil.resortBullet(nextNodes, nodeType);
                }
                return currNode;
            }
        }
    },

    /**
     * @description 创建新的列项
     * @param {Object} editor
     * @param {Element} currNode
     */
    setNewBullet(editor = null, currNode = null) {
        editor = this.getActiveEditor();
        currNode.removeAttribute('data-restart');
        currNode.removeAttribute('data-start');
        currNode.removeAttribute('style');
        currNode.removeAttribute('data-mce-style');
        $global.removeClass(currNode, 'hide-list');
        var pageContainer = editor.getBody().querySelector('.page-container');
        // var samNodes = bulletUtil.getAllSameNodesById(pageContainer, currNode.dataset.id);
        var samNodes = bulletUtil.getPrevSameLevelAndType(currNode, true);
        bulletUtil.resortBullet(samNodes, currNode.dataset.type);

        if (!/^(#text|BR)$/.test(currNode.firstChild.nodeName) || !currNode.firstChild) {
            var textNode = editor.dom.create('br');
            $global.prependChild(textNode, currNode);
        }
        this.moveSelectionToElement(editor, currNode, true);
    },

    /**
     * @description 重置列项样式和属性
     * @param {Object} editor
     * @param {Object} node
     * @param {Object} type
     */
    resetBullet(editor = null, node = null, type = "circle") {
        editor = this.getActiveEditor();
        node.dataset.type = type;
        if (['lower', 'num', 'num-index'].includes(type) && node.dataset.start) {
            node.setAttribute('style', `counter-reset: ${type} ${node.dataset.start}`);
        }

        var samNodes = [];
        if (node.dataset.id) {
            editor.getBody().querySelectorAll(`.bullet[data-id="${node.dataset.id}"]`);
            // 多个列项同步更新类型
            if (samNodes.length > 1) {
                samNodes.forEach((ele, i) => {
                    ele.dataset.type = type;
                })
            }
        } else {
            bulletUtil.resetBulletNumber(node);
        }
    },

    /**
     * @description 获取当前节点层级位置
     * @param {Array} nodes
     * @param {Element} currNode 当前节点
     */
    getNodeIndexByLevel(nodes = [], currNode = null) {
        var index = -1;
        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i];
            if (node === currNode) {
                return i;
                break;
            }
        }
        return index;
    },

    /**
     * @description 切换层级
     * @param {Element} editor
     * @param {Element} currNode 当前节点
     * @param {Boolean} isReduce 是否减低层级
     * @param {Boolean} isAll 是否全部选中的元素做处理
     * @param {Int} changeLevel 定义的层级
     */
    toggleLevel(editor = null, currNode = null, isReduce = false, isAll = false, changeLevel = 0) {
        changeLevel = changeLevel < 0 ? 0 : changeLevel;
        editor = this.getActiveEditor();
        if (!editor || !editor.getBody() || !currNode) {
            return false;
        }
        var container = editor.getBody().querySelector('.page-container');
        if (!container) {
            return false;
        }
        var block = editor.dom.getParent(currNode, '.info-block');
        var prevBlock = block.previousElementSibling;
        var prevLevelNode = currNode.previousElementSibling;
        var cls = $global.hasClass(currNode, 'ol-list') ? 'ol-list' : 'appendix-list';

        var childNodes = [];
        var spIndex = currNode.dataset.index.split(".");
        var isResetLevel = changeLevel > 0 ? true : false;

        // debugger
        if (prevLevelNode && ($global.hasClass(prevLevelNode, 'ol-list') || $global.hasClass(prevLevelNode, 'appendix-list')) && changeLevel > prevLevelNode.dataset.index.split(".").length) {
            changeLevel = prevLevelNode.dataset.index.split(".").length;
        }
        var source = spIndex.slice(0, changeLevel).join(".") || '0';
        // 获取父级节点
        var parentLi = levelUtil.getPrevNodeBySource(currNode, source);
        /* if (!parentLi && changeLevel === 0 && cls === 'appendix-list') {
            parentLi = block;
        } */
        // 若父级节点被锁住编辑的则取被分配的章节条目
        if (parentLi && $global.hasClass(parentLi, 'disabled')) {
            parentLi = levelUtil.getPrevNodeBySource(currNode, source, true);
        }

        // 如果定义不到父级元素的，则按上个层级项或页面取分析
        if (!parentLi) {
            if (!isResetLevel && prevLevelNode && prevLevelNode.dataset.index && prevLevelNode.dataset.index.split('.').length === spIndex.length - 1 && source !== '0') {
                parentLi = levelUtil.getPrevNodeBySource(prevLevelNode, prevLevelNode.dataset.source);;
            } else if (prevBlock && prevBlock.dataset.outlineid === block.dataset.outlineid) {
                let lastLiNodes = Array.from(prevBlock.querySelectorAll(`div.ol-list,div.appendix-list`));
                if (lastLiNodes.length) {
                    parentLi = levelUtil.getPrevNodeBySource(lastLiNodes[lastLiNodes.length - 1], source);
                }
            }
        }

        if (parentLi) {
            currNode.dataset.source = parentLi.dataset.index; // source;
            currNode.dataset.index = parentLi.dataset.index + '.1'; // spIndex.slice(0, changeLevel + 1).join(".");
            currNode.dataset.parentid = parentLi.dataset.outlineid;
            // 移除被分配的人员属性
            currNode.removeAttribute('data-owner');
            // 下一个兄弟层级项
            let nextOl = currNode.nextElementSibling;
            if (nextOl && !$global.hasClass(nextOl, 'disabled') && $global.hasClass(nextOl, cls) && nextOl.dataset.index.split(".").length > currNode.dataset.index.split(".").length) {
                let samOls = $global.getNextAllNodes(currNode, cls, true);
                for (let i = 0; i < samOls.length; i++) {
                    let ol = samOls[i];
                    if (ol.dataset.index.split(".").length !== nextOl.dataset.index.split(".").length) {
                        break;
                    }
                    ol.dataset.parentid = currNode.dataset.outlineid;
                }
            }
            levelUtil.resetChildLevel(editor, parentLi, parentLi.dataset.outlineid);
        } else {
            if (prevLevelNode) {
                if ($global.hasClass(prevLevelNode, 'ol-list') || $global.hasClass(prevLevelNode, 'appendix-list')) {
                    if (isReduce) { // 若减少层级
                        if (spIndex.length === 2  && ($global.hasClass(prevLevelNode, 'appendix-list') || this.vm.editorSetting.normal)) {
                            currNode.dataset.source = source;
                            currNode.dataset.index = spIndex.slice(0, changeLevel + 1).join(".");
                            currNode.dataset.parentid = block.dataset.outlineid;
                        } else {
                            this.clearLevelEle(editor, currNode, prevLevelNode);
                        }

                    } else { // 若增加层级
                        prevLevelNode = levelUtil.getPrevNodeByIndexLevel(currNode, changeLevel);
                        if (!prevLevelNode) {
                            return false;
                        }
                        // 层级最多到5级
                        let maxLevel = $global.hasClass(prevLevelNode, 'ol-list') ? 6 : 5;
                        if(prevLevelNode.dataset.index.split(".").length >= maxLevel){
                            return false;
                        }
                        if (prevLevelNode.dataset.index.split(".").length === changeLevel + 1) {
                            currNode.dataset.source = prevLevelNode.dataset.source;
                            currNode.dataset.parentid = prevLevelNode.dataset.parentid;
                        } else {
                            currNode.dataset.source = prevLevelNode.dataset.index;
                            currNode.dataset.parentid = prevLevelNode.dataset.outlineid;
                        }
                    }
                    levelUtil.resetChildLevel(editor, prevLevelNode, prevLevelNode.dataset.outlineid);
                } else {
                    if (isReduce) {
                        this.clearLevelEle(editor, currNode);
                    }
                }
            } else {
                if (!this.vm.editorSetting.isStandard) {
                    const nextLi = currNode.nextElementSibling;
                    if (nextLi && $global.hasClass(nextLi, 'ol-list') ) {
                        nextLi.dataset.parentid = currNode.dataset.parentid;
                        nextLi.dataset.index = currNode.dataset.index;
                    }
                    this.clearLevelEle(editor, currNode);
                } else{
                    return true;
                }

            }
        }
        levelUtil.sortLevel(editor);
        return true;
    },
    /**
     * @description 清除层级项样式并重定义子集
     * @param {Object} editor
     * @param {Element} currNode
     * @param {Element} prevLevelNode
     */
    clearLevelEle(editor=null, currNode=null, prevLevelNode=null) {
        let firstNode;
        currNode.style.display = "none";
        Array.from(currNode.childNodes).forEach(ele => {
            if (['#text', 'SPAN', 'EM','BR'].includes(ele.nodeName)) {
                let paragraph = editor.dom.create('p', { style: 'text-indent:2em;' }, '');
                if (!this.vm.editorSetting.isStandard) {
                    paragraph = editor.dom.create('p', {}, '');
                }
                paragraph.appendChild(ele);
                let textContent = paragraph.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '');
                if (textContent === '') {
                    paragraph.innerHTML = '&#8203';
                }
                if (!firstNode) {
                    firstNode = paragraph;
                }
                if (prevLevelNode) {
                    prevLevelNode.appendChild(paragraph);
                } else {
                    currNode.parentNode.insertBefore(paragraph, currNode);
                }

            } else {
                if (prevLevelNode) {
                    prevLevelNode.appendChild(ele);
                } else {
                    currNode.parentNode.insertBefore(ele, currNode);
                }
            }
        });
        currNode.remove();
        // 光标定位第一个元素前
        this.moveSelectionToElement(editor, firstNode, true);
    },

    /**
     * @description 重置层级项序号
     */
    resetLevelByChange(editor = null) {
        levelUtil.sortLevel(editor);
    },

    /**
     * @description 设置新的条目层级项
     * @param {Object} editor
     * @param {Element} currNode
     * @param {Boolean} isParent
     */
    setNewLevel(editor = null, currNode = null, isParent = false) {
        editor = this.getActiveEditor();
        var uuid = $global.guid();
        // 如果没有层级项的层级序号或者为附录项
        if (!currNode.dataset.source && !currNode.dataset.appendixNo) {
            if (currNode.dataset.index && currNode.dataset.index.split(".").length === 1) {
                let prevLiNode = currNode.previousElementSibling;
                if (prevLiNode && ($global.hasClass(prevLiNode, 'ol-list') || $global.hasClass(prevLiNode, 'appendix-list'))) {
                    currNode.dataset.outlineid = uuid;
                    if (prevLiNode.dataset.bookmark) {
                        currNode.dataset.bookmark = uuid;
                    }
                    if (!this.vm.editorSetting.normal) {
                        currNode.dataset.source = prevLiNode.dataset.index;
                        currNode.dataset.index = prevLiNode.dataset.index + ".1";
                        currNode.dataset.parentid = prevLiNode.dataset.outlineid || prevLiNode.dataset.id;
                    } else {
                        currNode.dataset.source = '0';
                        currNode.dataset.index = parseInt(prevLiNode.dataset.index) + 1;
                        currNode.dataset.parentid = prevLiNode.dataset.parentid;
                    }

                    currNode.dataset.contentid = $global.guid();
                    currNode.removeAttribute('data-owner');
                    $global.removeClass(currNode, 'enlock');
                    $global.removeClass(currNode, 'level0');
                    // editor.undoManager.add();
                } else {
                    let pNode = editor.dom.create('p', {}, '&#8203');
                    $global.insertAfter(pNode, currNode.firstChild);
                    this.moveSelectionToElement(editor, pNode);
                }
                if (!this.vm.editorSetting.normal) {
                    return true;
                }
            } else {
                if (!this.vm.editorSetting.normal) {
                    currNode.dataset.source = currNode.dataset.index;
                    currNode.dataset.index = currNode.dataset.index + ".1";
                    currNode.dataset.parentid = currNode.dataset.outlineid || currNode.dataset.id;
                } else {
                    currNode.dataset.source = currNode.dataset.source;
                    currNode.dataset.index = currNode.dataset.index;
                }
                currNode.removeAttribute('data-owner');
                $global.removeClass(currNode, 'enlock');
                $global.removeClass(currNode, 'level0');
            }
        } else {
            let sourceIndex = currNode.dataset.index;
            let splitIndex = sourceIndex.split('.');
            let nums = [];
			
            splitIndex.forEach((n, i) => {
                n = parseInt(n);
                if (i === splitIndex.length - 1) {
                    n += 1;
                }
                nums.push(n);
            });
			
            if (sourceIndex !== nums.join('.')) {
                // 如果是被分配的章节条目
                if (currNode.dataset.owner) {
                    currNode.dataset.source = sourceIndex;
                    currNode.dataset.parentid = currNode.dataset.outlineid;
                    currNode.removeAttribute('data-owner');
                    $global.removeClass(currNode, 'enlock');
                } else {
					if ($global.isUpperCase(sourceIndex) && this.vm.pageData && this.vm.pageData?.stdKind === this.vm.editorSetting.tmplType) {
						currNode.dataset.source = sourceIndex;
						currNode.dataset.parentid = currNode.dataset.outlineid;
						currNode.dataset.outlineid = uuid;
						currNode.dataset.contentid = $global.guid();
						currNode.dataset.index = sourceIndex + '1';
					} else {
						sourceIndex = nums.join('.');
						if (!isNaN(sourceIndex) && /^[0-9]$/.test(sourceIndex) && currNode.dataset.appendixNo) { // 航司附录主标题
							currNode.dataset.source = currNode.dataset.index;
							currNode.dataset.index = currNode.dataset.appendixNo;
							currNode.dataset.parentid = currNode.dataset.outlineid;
							currNode.dataset.outlineid = uuid;
							currNode.dataset.contentid = $global.guid();
							currNode.dataset.bookmark = uuid;
							$global.addClass(currNode,'appendix');
						} else {
							if (/^[A-Z]+[0-9]+$/.test(currNode.dataset.index) && currNode.dataset.appendixNo) { // 航司的附录条款
								// currNode.dataset.source = currNode.dataset.source;
								currNode.dataset.outlineid = uuid;
								currNode.dataset.contentid = $global.guid();
								currNode.removeAttribute('data-bookmark');
							} else {
								currNode.dataset.index = sourceIndex;
								currNode.dataset.outlineid = uuid;
								currNode.dataset.contentid = $global.guid();
							}
						}
					}
                }
                // $global.removeClass(currNode, 'top-margin');
                $global.removeClass(currNode, 'level0');
                // levelUtil.resetChildLevel(editor, currNode, uuid);
            }

        }
        // 继承题条
        if (currNode.dataset.bookmark) {
            currNode.dataset.bookmark = uuid;
        }

        currNode.dataset.outlineid = currNode.dataset.outlineid || uuid;
        currNode.dataset.contentid = currNode.dataset.contentid || $global.guid();

        $global.removeClass(currNode, 'struct-main');

        if (!/^(#text|BR)$/.test(currNode.firstChild.nodeName) || !currNode.firstChild) {
            var textNode = editor.dom.create('br');
            $global.prependChild(textNode, currNode);
        }
        levelUtil.sortLevel(editor, true);
    },

    /**
     * @description 移除层级
     * @param {Object} editor
     * @param {Element} currNode 当前节点
     */
    removeLevel(editor = null, currNode = null) {
        editor = this.getActiveEditor();
        const pageContainer = editor.getBody().querySelector('.page-container');
        var dataIndex = currNode.dataset.index;
        var dataId = currNode.dataset.id;
        var parentId = currNode.dataset.parentid;

        var childNode = pageContainer.querySelector(`[data-parentid="${dataId}"]`);
        if (childNode) {
            if (dataIndex.length === 1) {
                let childNextNode = pageContainer.querySelector(`[data-parentid="${childNode.dataset.id}"]`);
                if (childNextNode) {
                    childNextNode.dataset.index = childNode.dataset.index;
                    childNextNode.dataset.parentid = childNode.dataset.parentid;
                    childNextNode.dataset.id = childNode.dataset.id;
                    levelUtil.resetChildLevel(editor, childNextNode, childNextNode.dataset.id);
                }
                childNode.dataset.id = dataId;
            }
            childNode.dataset.index = dataIndex;
            childNode.dataset.parentid = parentId;

            levelUtil.resetChildLevel(editor, childNode, childNode.dataset.id);
        }

        currNode.removeAttribute('class');
        currNode.removeAttribute('data-id');
        currNode.removeAttribute('data-parentid');
        currNode.removeAttribute('data-bookmark');
        currNode.removeAttribute('data-outlinetype');
        currNode.removeAttribute('data-prev');
        currNode.removeAttribute('data-source');
        currNode.removeAttribute('data-index');

        levelUtil.sortLevel(editor);
    },

    /**
     * @description 元素转换为条目层级项
     * @param {Object} editor
     * @param {Element} currNode 当前节点
     */
    addLevel(editor = null, currNode = null) {
        editor = this.getActiveEditor();
        var block = editor.dom.getParent(currNode, '.info-block');
        var uuid = $global.guid();
        // 需转换的元素
        var selectNode = $global.filterNodesBySelector(editor.dom.getParents(currNode), ['DIV']).selections[0];
        if (selectNode.getAttribute('class')) {
            selectNode = $global.filterNodesBySelector(editor.dom.getParents(currNode), ['P']).selections[0];
        }

        // 必须为P段落或者父级为页面子元素
        if (selectNode) {
            var isBlock = $global.hasClass(selectNode.parentNode, 'info-block');
            var newOl = editor.dom.create('div', { 'data-id': uuid, 'data-bookmark': uuid, 'data-outlineid': uuid, }, selectNode.textContent === '' ? '<br/>' : selectNode.innerHTML);
            var cls = 'ol-list';
            if (block.dataset.letter) {
                cls = 'appendix-list';
                newOl.dataset.prev = block.dataset.letter;
            }

            editor.dom.insertAfter(newOl, selectNode);
            $global.addClass(newOl, cls);

            // 找出上一个层级项
            var prevNode = $global.getPrevAllNodes(selectNode, cls);
            selectNode.remove();

            if (prevNode) {
                newOl.dataset.parentid = prevNode.dataset.parentid;
                newOl.dataset.source = prevNode.dataset.source;
            } else {
                var prevBlock = block.previousElementSibling;
                prevNode = prevBlock ? prevBlock.querySelector(`[data-parentid="${block.dataset.outlineid}"]`) : null;
                if (prevBlock && prevBlock.dataset.outline === block.dataset.outline && prevNode) {
                    newOl.dataset.parentid = prevNode.dataset.id || prevNode.dataset.outlineid;
                    newOl.dataset.source = prevNode.dataset.index;
                } else {
                    newOl.dataset.parentid = block.dataset.outlineid;
                    newOl.dataset.index = block.dataset.outline || editor.dom.nodeIndex(block) + 1;
                }
            }

            levelUtil.sortLevel(editor);
            return newOl;
        }
    },
    /**
     * @description 将当前段落置为层级项（段落的父级为层级项）
     * @param {Object} editor
     * @param {Element} currNode 当前节点元素
     * @param {Boolean} shiftKey 是否为缩进层级
     * @param {Boolean} isAssignOutline 是否为协同分配
     */
    appendLevel(editor = null, currNode = null, shiftKey = false, isAssignOutline = false, isChapterTitle = false) {
        editor = this.getActiveEditor();
        var newOl;
        var block = editor.dom.getParent(currNode, '.info-block');
        // 当前的层级项
        var levelNode = editor.dom.getParent(currNode, '[data-index]');

        if (levelNode) {
            var nextNodes = $global.getNextAllNodes(currNode);
            newOl = levelNode.cloneNode();
            newOl.innerHTML = currNode.textContent;
            this.setLevelNodeAttr(editor, newOl, levelNode, shiftKey, isAssignOutline, isChapterTitle);
            currNode.remove();
            // 将当前元素后面的所有兄弟元素置入新的层级项中
            if (nextNodes.length) {
                nextNodes.forEach(ele => {
                    newOl.appendChild(ele)
                });
            }
            // 重新定义层级排序
            levelUtil.resetChildLevel(editor, levelNode, levelNode.dataset.outlineid, isAssignOutline);
        } else {
            var prevNode = $global.getPrevAllNodes(currNode, 'data-index');
            if (prevNode) {
                newOl = prevNode.cloneNode();
                newOl.innerHTML = currNode.innerHTML;
                this.setLevelNodeAttr(editor, newOl, prevNode, shiftKey, isAssignOutline);
                currNode.remove();
            } else {
                let uuid = $global.guid();
                // 如果是附录章节的
                prevNode = block.querySelector('.appendix.header-title');
                if (prevNode) {
                    newOl = editor.dom.create('div', { class: 'appendix-list' }, currNode.textContent);
                    newOl.dataset.prev = block.dataset.letter;
                    newOl.dataset.bookmark = uuid;
                    newOl.dataset.outlineid = uuid;
                    newOl.dataset.parentid = prevNode.dataset.outlineid;
                    newOl.dataset.contentid = $global.guid();
                    newOl.dataset.outlinetype = prevNode.dataset.outlinetype || 10;
                    newOl.dataset.source = 0;
                    newOl.dataset.index = 1;
                    // $global.removeClass(newOl, 'level0');
                    $global.insertAfter(newOl, currNode);
                    currNode.remove();
                } else if (!this.vm.editorSetting.isStandard) {
                    const index = this.getAllPrevOLs(editor, block);
                    newOl = editor.dom.create('div', { class: 'ol-list' }, currNode.textContent);
                    newOl.dataset.bookmark = uuid;
                    newOl.dataset.outlineid = uuid;
                    newOl.dataset.parentid = block.dataset.outlineid || "0";
                    if (this.vm.editorSetting.normal) {
                        newOl.dataset.parentid = block.dataset.parentid || "0";
                    }
                    newOl.dataset.source = 0;
                    newOl.dataset.index = index + 1;
                    newOl.dataset.contentid = $global.guid();
                    $global.insertAfter(newOl, currNode);
                    currNode.remove();
                }
            }
            editor.undoManager.add();
        }

        levelUtil.sortLevel(editor);
        return newOl;
    },
    /**
     * @description 设置层级项属性
     * @param {Object} editor
     * @param {Element} newOl 当前要处理的元素
     * @param {Element} levelNode 当前对应的层级项元素
     * @param {Boolean} shiftKey 是否为缩进层级
     * @param {Boolean} isAssignOutline 是否为协同分配
     */
    setLevelNodeAttr(editor = null, newOl = null, levelNode = null, shiftKey = false, isAssignOutline = false, isChapterTitle = false) {
        editor = this.getActiveEditor();
        var uuid = $global.guid();
        newOl.dataset.outlineid = uuid;
        // 标记为书签，可列如目次中
        if ((levelNode && levelNode.dataset.bookmark) || isChapterTitle) {
            newOl.dataset.bookmark = uuid;
        }
        newOl.dataset.contentid = $global.guid();

        if (!isChapterTitle) {
            var levelNodeIndex = levelNode.dataset.index.split('.');
            if (!shiftKey) { // 层级加大
                newOl.dataset.source = levelNode.dataset.index;
                newOl.dataset.parentid = levelNode.dataset.outlineid;
            } else { // 层级减少, 如果是在协同分配章节的模式下且当前章节条目是为一级分配的
                if ((levelNode.dataset.index && levelNodeIndex.length === 1 && $global.hasClass(levelNode, 'ol-list')) || (isAssignOutline && levelNode.dataset.owner)) {
                    newOl.dataset.source = levelNode.dataset.index;
                    newOl.dataset.parentid = levelNode.dataset.outlineid;
                } else {
                    newOl.dataset.source = levelNode.dataset.source;
                    newOl.dataset.parentid = levelNode.dataset.parentid;
                }
            }
        } else {
            const block = editor.dom.getParent(levelNode, '.info-block');
            const index = this.getAllPrevOLs(editor, block);
            newOl.dataset.index = index + 1;
            newOl.dataset.parentid = block.dataset.outlineid || "0";
            newOl.dataset.source = "0";
        }

        $global.removeClass(newOl, 'hide-list');
        editor.dom.insertAfter(newOl, levelNode);
        return true;
    },

    getAllPrevOLs(editor = null, pageBlock = null) {
        let lens = 0;
        const pageContainer = editor.getBody().querySelector('.page-container');
        const blocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.fixed)'));
        for (let block of blocks) {
            const olListNodes = Array.from(block.querySelectorAll('div.ol-list.level0'));
            lens += olListNodes.length;
            if (block === pageBlock) {
                break;
            }
        }
        return lens;
    },

    /**
     * @description 层级项回车后当前节点在段落上则更新编号
     * @param {Object} editor
     * @param {Element} currNode
     */
    afterEnterByLevel(editor = null, currNode = null) {
        editor = this.getActiveEditor();
        var levelNode = currNode.parentNode;
        var cls = levelNode.getAttribute('class');
        if (cls && cls.match(/(ol-list|appendix-list)/g)) {
            let firstNode = levelNode.firstChild;
            if (firstNode.nodeName === 'P') {
                $global.prependChild(editor.dom.create('br'), levelNode);
            }
            levelUtil.sortLevel(editor);
        }
    },

    /**
     * @description 将当前层级项重新设置起始编号
     * @param {Object} editor
     * @param {Element} currNode
     */
    resetLevelNumber(editor = null, currNode = null, number = '1') {
        editor = this.getActiveEditor();
        var block = editor.dom.getParent(currNode, '.info-block');
        // block.dataset.outline = number;
        currNode.dataset.index = number;
        currNode.removeAttribute('data-source');
        currNode.dataset.parentid = block.dataset.outlineid || block.dataset.id;
        levelUtil.sortLevel(editor);
    },

    /**
     * @description 重置当前页面内所有层级项编号
     * @param {Object} editor
     * @param {Element} block
     */
    resetLevelByBlock(editor = null, block = null) {
        if (block && block.dataset.outlinid) {
            editor = this.getActiveEditor();
            levelUtil.resetChildLevel(editor, block, block.dataset.outlinid);
        }
    },

    /**
     * @description 重置列项层级
     * @param {Object} editor
     * @param {Element} currNode
     * @param {Int} level
     */
    resetBulletLevel(editor = null, currNode = null, level = 0) {
        editor = this.getActiveEditor();
        if ($global.hasClass(currNode, 'bullet')) {
            currNode.dataset.level = String(level);
            bulletUtil.resetBulletNumberByParent(editor, currNode.parentNode);
        }
    },

    /**
     * @description 移除节点
     * @param {Object} editor
     * @param {Boolean} onlySortLevel 仅排序层级项层级
     */
    afterRemoveNodes(editor = null, onlySortLevel = false, removeNode = null, isEnd = false) {
        editor = this.getActiveEditor();
        if (!removeNode) {
            return false;
        }
        // 判断层级项后第一个节点是否为非格式的
        var firstNode = removeNode.firstChild;
        if (firstNode && firstNode.nodeName === '#text' && firstNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '') {
            firstNode = firstNode.nextElementSibling;
        }
        // 处理节点格式
        if (firstNode) {
            if (firstNode.nodeName === 'SPAN' && firstNode.contentEditable !== 'false' && !firstNode.className) {
                let textNode = document.createTextNode(firstNode.textContent);
                $global.insertAfter(textNode, firstNode);
                firstNode.remove();
            } else if (firstNode.nodeName === '#text') {
                let nextNode = firstNode.nextElementSibling;
                if (nextNode && nextNode.nodeName === 'SPAN') {
                    firstNode.textContent = firstNode.textContent + nextNode.textContent;
                    nextNode.remove();
                    if (isEnd) {
                        this.moveSelectionToElement(editor, firstNode);
                    }
                }
            }
        }
        setTimeout(() => {
            levelUtil.sortLevel(editor);
            if (!onlySortLevel) {
                this.afterRemoveBullet(editor);
            }
        }, 500);
    },

    /**
     * @description 移除条目层级项后处理
     * @param {Object} editor
     * @param {Element} currNode
     */
    afterRemoveLevel(editor = null, currNode = null) {
        editor = this.getActiveEditor();
        var pageContainer = editor.getBody().querySelector('.page-container');
        if (pageContainer) {
            var cls = $global.hasClass(currNode, 'appendix') ? 'appendix-list' : 'ol-list';
            var parentNode = pageContainer.querySelector(`.${cls}[data-outlineid="${currNode.dataset.parentid}"]`);;
            var nextNode = $global.getNextAllNodes(currNode, cls);

            editor.undoManager.transact(() => {
                if (!parentNode) {
                    currNode = levelUtil.reduceLevel(currNode);
                    parentNode = levelUtil.getParentBySource(pageContainer, currNode.dataset.source);
                    if (!parentNode) {
                        levelUtil.sortLevel(editor);
                        return false;
                    }
                    currNode.dataset.parentid = parentNode.dataset.id || parentNode.dataset.outlineid;
                }
                if (nextNode) {
                    parentNode = pageContainer.querySelector(`[data-outlineid="${nextNode.dataset.parentid}"]`);
                    if (!parentNode) {
                        nextNode = levelUtil.reduceLevel(nextNode);
                        parentNode = pageContainer.querySelector(`[data-index="${nextNode.dataset.source}"]`);
                        nextNode.dataset.parentid = parentNode.dataset.id || parentNode.dataset.outlineid;

                        let nextChild = pageContainer.querySelector(`[data-source="${nextNode.dataset.index}"]`);
                        if (nextChild) {
                            nextNode.dataset.outlineid = nextChild.dataset.parentid;
                        }
                    }
                    var nextNodes = levelUtil.getSameNextNodesBySource(editor, nextNode);
                    if (nextNodes.length) {
                        nextNodes.unshift(nextNode);
                        levelUtil.sortNodesAttrs(nextNodes);
                    }
                    levelUtil.sortLevel(editor);
                }
            })

        }
    },

    /**
     * @description 列项后处理
     * @param {Object} editor
     * @param {Element} currNode
     */
    afterRemoveBullet(editor = null, currNode = null) {
        editor = this.getActiveEditor();
        let block = editor.dom.getParent(currNode, '.info-block');
        editor.undoManager.transact(() => {
            bulletUtil.resetBulletNumberByBlock(editor, [block]);
        })
    },

    /**
     * @description 注|注X|首注X
     * @param {Object} editor
     * @param {Object} itemData
     * @param {Element} currNode
     */
    toggleZhu(editor = null, itemData = {}, selectNode = null) {
        editor = this.getActiveEditor();
        let cls = itemData.act; // 定义样式
        if (itemData.type) {
            cls += ' ' + itemData.type;
        }
        // debugger
        const setNodeZhu = (currNode) => {
            let td = editor.dom.getParent(currNode, 'td');
            if (td && itemData.type === 'img-table') {
                currNode = td;
            }
            // 如果是段落
            if (currNode.nodeName === 'P') {
                editor.dom.removeAllAttribs(currNode);
                currNode.setAttribute('class', `tag ${cls}`);
                currNode.dataset.type = cls;
                if (currNode.textContent === '') {
                    currNode.innerHTML = '&#8203';
                }
                // 如果是首注的
                if (['example-x', 'zhu-x'].includes(itemData.act)) {
                    currNode.dataset.start = 1;
                    currNode.dataset.number = 1;
                }
            } else if (currNode.nodeName === 'TD') {
                // 表格
                this.addTableZhuExm(editor, editor.selection.getNode(), cls); // currNode
            } else {
                // 直接插入
                editor.execCommand('mceInsertContent', false, `<p class="tag ${cls}" data-type="${cls.split(/\s/)[0]}">&#8203</p>`);
            }
        }
        // debugger
        if (selectNode && selectNode.nodeName === 'P') { // 当前节点非框选的 !editor.dom.hasClass(selectNode,'info-block') &&
            setNodeZhu(selectNode);
        } else {
            // 处理框选的节点
            const nodes = editor.selection.getSelectedBlocks();
            for (let node of nodes) {
                setNodeZhu(node);
            }
        }

        const pageContainer = editor.getBody().querySelector('.page-container');
        const block = editor.dom.getParent(selectNode, '.info-block');
        const blocks = Array.from(pageContainer.querySelectorAll(`.info-block[data-outlineid="${block.dataset.outlineid}"]`));

        this.resetTagByNumber(Array.from(blocks));
    },

    /**
     * @description 表中新增注|注X|示例|示例X
     * @param {Object}  editor
     * @param {Object}  currNode
     * @param {String}  cls
     */
    addTableZhuExm(editor = null, currNode = null, cls = '') {
        editor = this.getActiveEditor();
        var tableNode = editor.dom.getParent(currNode, 'table');
        // 如果有续表的则找出最后一个表
        var cloneTables = editor.getBody().querySelectorAll(`table[data-parentid="${tableNode.dataset.id}"]`);
        if (cloneTables.length) {
            tableNode = cloneTables[cloneTables.length - 1];
        }

        var colgroups = tableNode.querySelectorAll(':scope>colgroup>col');
        var tBody = tableNode.querySelector(':scope>tbody');
        // 取出单元行最后一行元素
        var trs = tBody.querySelectorAll('tr:not(.foot)');
        var lastTr = trs[trs.length - 1];
        const addNewTr = () => {
            let number = cls.match(/(examplex|zhux)/i) !== null ? ' data-number="1"' : '';
            let newTr = editor.dom.create('tr', { 'class': 'zhu' }, `<td><p class="tag ${cls}" data-type="${cls.split(/\s/)[0]}"${number}>&#8203</p></td>`);
            let tdNode = newTr.querySelector('td');
            if (colgroups.length > 1) {
                tdNode.setAttribute('colspan', colgroups.length);
            }
            return newTr;
        }
        var footEle;
        // 如果最后行元素非注单元的则新创建
        if (!$global.hasClass(lastTr, 'zhu')) {
            footEle = addNewTr();
            editor.dom.insertAfter(footEle, lastTr);
            footEle.scrollIntoView({ behavior: "smooth", block: "center" });

        } else {
            footEle = lastTr;
            if (currNode && currNode.nodeName === 'P') {
                if(cls.match(/zhu-x/i) !== null){
                    currNode.dataset.number = 1;
                    currNode.dataset.start = 1;
                }
                currNode.className = `tag ${cls}`;
                currNode.dataset.type = cls;
                footEle = currNode;
            } else {
                // 否则创建段落
                footEle = lastTr;
                let tdEle = footEle.firstChild;

                let number = ['examplex', 'zhux'].includes(cls) ? ' data-number="1"' : '';
                let parEle = editor.dom.create('p', { class: `tag ${cls}`, 'data-type': cls }, '&#8203');
                if (cls.match(/(examplex|zhux)/i) !== null) {
                    parEle.dataset.number = "1";
                }

                tdEle.appendChild(parEle);
                parEle.scrollIntoView({ behavior: "smooth", block: "center" });
            }

        }
        this.moveSelectionToElement(editor, footEle);
    },

    /**
     * @desciption 图注|图注X|首图注X
     * @param {Object} editor
     * @param {Element} currNode
     * @param {String} cls
     */
    toogleImgOthers(editor = null, currNode = null, cls = '') {
        editor = this.getActiveEditor();
        var parentNode = this.setImgFigure(editor, currNode);
    },

    /**
     * @desciption 刷新注|注X|首注X
     * @param {Object} editor
     * @param {Element} currNode
     */

    refreshTagByNumber(editor = null, currNode = null) {
        editor = this.getActiveEditor();
        if ($global.hasClass(currNode, 'zhu-x')) {
            $global.removeClass(currNode, 'zhu-x');
            $global.addClass(currNode, 'zhux');
        }
        if ($global.hasClass(currNode, 'example-x')) {
            $global.removeClass(currNode, 'example-x');
            $global.addClass(currNode, 'examplex');
        }

        var pageContainer = editor.getBody().querySelector('.page-container');
        var block = editor.dom.getParent(currNode, '.info-block');
        if (block) {
            var blocks = Array.from(pageContainer.querySelectorAll(`.info-block[data-outlineid="${block.dataset.outlineid}"]`));
            this.resetTagByNumber(block);
        }
    },
    /**
     * @description 重置编号
     * @param {Element} currNode
     */
    resetStartNumber(currNode=null) {
        const editor = this.getActiveEditor();
        let cls = currNode.className;
        if (cls.match(/\zhux|\zhu-x|\examplex|\example-x/i)) {
            const numItems = () => {
                var arr = [{ text: '请选择...', value: '' }];
                for (let i = 1; i <= 20; i++) {
                    arr.push({
                        text: String(i),
                        value: String(i)
                    })
                }
                return arr;
            }
            const fromItemData = () => {
                return {
                    "num": currNode.dataset.number || ''
                }
            };
            editor.windowManager.open({
                title: '重置编号',
                size: 'small',
                width: 150,
                height: 200,
                body: {
                    type: 'panel',
                    items: [{
                        type: "grid",
                        columns: 2,
                        items: [{
                                type: 'label',
                                label: '清除重置编号',
                                items: [{
                                    name: 'clear',
                                    type: 'checkbox',
                                    label: '清除'
                                }]
                            },
                            {
                                name: 'num',
                                type: 'listbox',
                                label: '定义起始编号',
                                items: numItems()
                            }
                        ]
                    }]
                },
                initialData: fromItemData(),
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
                onChange: (api, details) => {
                    var data = api.getData();
                    api.enable('num');
                    if (data.clear) {
                        api.disable('num');
                    }
                },
                onSubmit: (api, details) => {
                    var data = api.getData();
                    console.log('onSubmit', data)
                    if (data.clear) {
                        currNode.removeAttribute('data-restart');
                    } else {
                        currNode.dataset.id = $global.guid();
                        currNode.dataset.number = data.num;
                        currNode.dataset.restart = data.num;
                    }
                    api.close();
                    this.resetTagByNumber();
                },
            });
        }
    },

    /**
     * @description 重置注X|示例X序号
     * @param {Element} container
     * @param {String} className
     */
    resetTagByNumber(blocks = [], className = '') {
        var editor = this.getActiveEditor();
        if (!editor || !editor.getBody()) {
            return false;
        }
        var examplexNodes = [], zhuxNodes = [];
        if (!blocks || !blocks.length) {
            var pageContainer = editor.getBody().querySelector('.page-container');
            if (pageContainer) {
                blocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.fixed):not(.disabled):not(.pageHide)'));
            }
        }

        const getEleNumber = (ele, eleParentNode) => {
            // let eleParentNode = ele.parentNode;
            let prevBlock = editor.dom.getParent(eleParentNode, '.info-block').previousElementSibling;
            if (prevBlock) {
                let prevOl = prevBlock.querySelector(`[data-outlineid="${eleParentNode.dataset.outlineid}"]`);
                if (prevOl) {
                    let allChildNodes = Array.from(prevOl.childNodes);
                    let lastNode = allChildNodes[allChildNodes.length - 1];
                    if (lastNode.className === ele.className) {
                        return parseInt(lastNode.dataset.number) + 1;
                    }
                }
            }
            return 1;
        }
        if (!blocks && !blocks.length) {
            return false;
        }
        blocks.forEach(block => {
            if (!block.dataset.break) {
                let exNodes = Array.from(block.querySelectorAll('p.examplex, p.example-x'));
                examplexNodes = examplexNodes.concat(exNodes);
                let zNodes = Array.from(block.querySelectorAll('p.zhux,p.zhu-x'));
                zhuxNodes = zhuxNodes.concat(zNodes);
            }

        });
        // 这里须按父容器分类
        var exampleIndex = 1;
        var exampleParentNode = null;
        var examplexUuid, examplexType='examplex', examplexCls = 'tag examplex';
        examplexNodes.forEach((ele, idx) => {
            if (idx === 0 || ele.dataset.number === '1') {
                examplexUuid = ele.dataset.id || $global.guid();
                examplexType = ele.className;
                examplexCls = ele.className;
            }
            if (ele.dataset.restart) {
                examplexUuid = ele.dataset.id;
            }
            ele.dataset.id = examplexUuid;
            // 元素在容器中的位置
            let eleIndex = editor.dom.nodeIndex(ele);
            let eleParentNode = ele.parentNode;
            let prevNode = ele.previousElementSibling;
            // 连续性的排序
            if (eleParentNode === exampleParentNode && prevNode && prevNode.nodeName === ele.nodeName && !ele.dataset.restart && (prevNode.className === ele.className || editor.dom.hasClass(prevNode, 'examplex') || editor.dom.hasClass(prevNode, 'example-x'))) {
                if (editor.dom.hasClass(ele, 'example-x') && ele.dataset.start) {
                    exampleIndex = 1;
                } else {
                    exampleIndex++;
                }
            } else {
                if (eleIndex === 0 && $global.hasClass(eleParentNode, 'hide-list')) {
                    exampleIndex = getEleNumber(ele, eleParentNode);
                } else {
                    if (ele.dataset.restart) {
                        exampleIndex = parseInt(ele.dataset.restart);
                        examplexType = 'examplex';
                        examplexCls = 'tag examplex';
                    } else {
                        exampleIndex = 1;
                    }
                }
            }
            ele.className = examplexCls;
            ele.dataset.type = examplexType;
            ele.dataset.number = exampleIndex;
            exampleParentNode = eleParentNode;

            // 空内容须插入占位符
            let txt = ele.textContent;//.replace(/[\u200B-\u200D\uFEFF]/g, '');
            if (txt === '') {
                ele.innerHTML = '&#8203';
            }
        });

        var zhuIndex = 1;
        var zhuParentNode = null;
        // debugger
        var zhuxUuid, zhuxType='zhux', zhuxCls = 'tag zhux';
        zhuxNodes.forEach((ele, idx) => {
            if (idx === 0 || ele.dataset.number === '1') {
                zhuxUuid = ele.dataset.id || $global.guid();
                zhuxCls = ele.className;
                zhuxType = ele.dataset.type;
            }
            if (ele.dataset.restart) {
                zhuxUuid = ele.dataset.id;
            }
            ele.dataset.id = zhuxUuid;
            // 元素在容器中的位置
            let eleIndex = editor.dom.nodeIndex(ele);
            let eleParentNode = ele.parentNode;
            let prevNode = ele.previousElementSibling;

            // 连续性的排序
            if (eleParentNode === zhuParentNode && prevNode && prevNode.nodeName === ele.nodeName && !ele.dataset.restart && (prevNode.className === ele.className || editor.dom.hasClass(prevNode, 'zhux') || editor.dom.hasClass(prevNode, 'zhu-x'))) {
                if (editor.dom.hasClass(ele, 'zhu-x') && ele.dataset.start) {
                    zhuIndex = 1;
                } else {
                    zhuIndex++;
                }

            } else {
                if (eleIndex === 0 && $global.hasClass(eleParentNode, 'hide-list')) {
                    zhuIndex = getEleNumber(ele, eleParentNode);
                } else {
                    if (ele.dataset.restart) {
                        zhuIndex = parseInt(ele.dataset.restart);
                        zhuxType = 'zhux';
                        zhuxCls = 'tag zhux';
                    } else {
                        zhuIndex = 1;
                        //(syx)重新开始计算编号，避免与导出word不一致
                        ele.dataset.restart = 1;
                        ele.dataset.id = $global.guid();
                    }
                }
            }
            ele.dataset.number = zhuIndex;
            ele.dataset.type = zhuxType;
            ele.className = zhuxCls;
            zhuParentNode = eleParentNode;
            // 空内容须插入占位符
            let txt = ele.textContent;//.replace(/[\u200B-\u200D\uFEFF]/g, '');
            if (txt === '') {
                ele.innerHTML = '&#8203';
            }
        });
    },

    /**
     * @description 添加图标题: * 如果是标准化文档，需参照参数判断是否可以使用图标题
     * @param {Object} editor
     * @param {Element} currNode
     * @param {Object} data 参数：区分一般标题和图X标题
     */
    appendImageTitle(editor = null, currNode = null, data = {}) {
        editor = this.getActiveEditor();
        if (currNode.nodeName === 'IMG') {
            // 查找下个元素是否为图标题
            var nextEle = currNode.parentNode.nextElementSibling;
            if (nextEle && $global.hasClass(nextEle, 'img-title')) {
                // editor.windowManager.alert('已设置了图标题！');
                // return;
                let titleText = nextEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
                if (titleText === '') {
                    nextEle.innerText = '图标题';
                } else {
                    nextEle.innerText = '';
                }
            } else {
                var newNode = editor.dom.create('p', { class: 'img-title', 'data-number': '1' }, '图标题');
                editor.dom.insertAfter(newNode, currNode.parentNode);
                this.moveSelectionToElement(editor, newNode, false);
            }
            this.resetImageByNumber(editor);

        } else if (currNode.nodeName === 'P') {
            if (currNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '') === '') {
                currNode.textContent = "图标题";
            } else {
                let textContent = currNode.textContent.split(/\s/);
                currNode.textContent = textContent.slice(1).join(" ");
            }
            currNode.removeAttribute('style');
            currNode.className = 'img-title';
            // $global.addClass(currNode, 'img-title');
            if (data.act === 'number') {
                currNode.dataset.number = "";
            } else {
                currNode.removeAttribute('data-number');
            }
            this.resetImageByNumber(editor);
        } else {
            editor.windowManager.alert('须在图元素或段落元素上设置图标题！');
        }
    },

    /**
     * @description 为图片设置容器
     * @param {Object} editor
     * @param {Element} currNode
     */
    setImgFigure(editor = null, currNode = null) {
        editor = this.getActiveEditor();
        var parentNode = currNode.parentNode;
        if (parentNode.nodeName !== 'FIGURE') {
            var figureNode = editor.dom.create('figure', {  }); // contenteditable: 'false'
            if (/^(P|SPAN|EM|BR|#text|)$/.test(parentNode.nodeName)) {
                editor.dom.insertAfter(figureNode, parentNode);
            } else {
                parentNode.appendChild(figureNode);
            }
            figureNode.appendChild(currNode);
            parentNode = figureNode;
        }
        return parentNode;
    },

    /**
     * @description 重置图X标题
     * @param {Object} editor
     */
    resetImageByNumber(editor = null) {
        editor = this.getActiveEditor();
        if (!editor || !editor.getBody()) {
            return false;
        }
        var container = editor.getBody().querySelector('.page-container');
        if (!container) {
            return false;
        }
        // 清理空图片容器
        var imgNodes = Array.from(container.querySelectorAll('p.imgs'));
        imgNodes.forEach(node => {
            node.style.textIndent = null;
            node.removeAttribute('data-mce-style');
            if (!node.querySelector('img')) {
                $global.removeClass(node, 'imgs')
            }
        });
        // 清理图标题
        var imgTitleNodes = Array.from(container.querySelectorAll('p.img-title'));
        imgTitleNodes.forEach(node => {
            node.style.textIndent = null;
        });

        if (container) {
            var imgTitles = Array.from(container.querySelectorAll('.img-title[data-number]'));
            var structIndex = 0;
            var appendixList = [];
            imgTitles.forEach((ele, i) => {
                let block = editor.dom.getParent(ele, '.info-block');
                let indexNumber;
                if ($global.hasClass(block, 'appendix')) {
                    let appendixFilter = appendixList.filter(o => { return o.letter === block.dataset.letter; });
                    indexNumber = block.dataset.letter + '.' + (appendixFilter.length + 1);
                    appendixList.push({ letter: block.dataset.letter, id: $global.guid() });
                } else {
                    structIndex++;
                    indexNumber = structIndex;
                }
                ele.dataset.number = indexNumber;
            });
        }
    },

    /**
     * @description 条文脚注|图脚注|表脚注
     * @param {Object} editor
     * @param {Object} itemData
     * @param {Element} currNode 容器
     */
    toggleFooter(editor = null, itemData = {}, currNode = null) {
        editor = this.getActiveEditor();
        if (!$global.hasClass(currNode, '.info-block')) {
            switch (itemData.act) {
                case 'footer': // 条文脚注
                    var tableNode = editor.dom.getParent(currNode, 'table');
                    if (tableNode) {
                        editor.windowManager.alert('条文脚注只能用于条目段中！');
                    } else {
                        var noteData = null;
                        this.addFooter(editor, currNode, noteData);
                    }
                    break;
                case 'tfooter': // 表脚注
                case 'tfooter-x':
                    delete itemData.content;
                    this.addTableFooter(editor, currNode, itemData);
                    break;
                case 'imgfooter': // 图脚注
                case 'imgfooter-x':
                    this.addImgFooter(editor, currNode, itemData);
                    break;
            }
        }
    },

    /**
     * @description 新增条文脚注
     * @param {Object} editor
     * @param {Object} itemData
     * @param {Element} currNode 容器
     */
    addFooter(editor = null, currNode = null, noteData = null) {
        // editor = this.getActiveEditor();
        var block = editor.dom.getParent(currNode, '.info-block');
        /* if (['1', '2', '5', '11', '12'].includes(block.dataset.outlinetype)) {
            editor.windowManager.alert('条文脚注只能用于条目段中,且不能在术语章节中插入！');
            return;
        } */
        editor.windowManager.open({
            title: noteData !== null ? '修改条文脚注' : '添加条文脚注',
            body: {
                type: 'panel',
                items: [{
                    type: 'input',
                    name: 'footerText',
                    label: '请输入条文脚注文字内容'
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
            initialData: {
                footerText: noteData ? noteData.text : ''
            },
            onSubmit: api => {
                var data = api.getData();
                api.close();
                // 修改
                if (noteData) {
                    let anote = block.querySelector(`.a-note[data-id="${noteData.id}"]`);
                    if (anote) {
                        anote.title = data.footerText;
                        anote.dataset.title = data.footerText;
                    }
                    let footnote = block.querySelector(`.footnote>p[data-id="${noteData.id}"]`);
                    if (footnote) {
                        footnote.textContent = data.footerText;
                    }
                    // 新增
                } else {
                    editor.execCommand('mceInsertContent', false, `<span contenteditable="false" class="article a-note" title="${data.footerText}" data-id="${$global.guid()}" data-title="${data.footerText}"></span>`);
                }
                // editor.undoManager.add();
            }
        });
    },

    /**
     * @description 图脚注
     * @param {Object} editor
     * @param {Element} currNode
     * @param {Object} itemData
     */
    addImgFooter(editor = null, currNode = null, itemData = {}) {
        var tableNode = editor.dom.getParent(currNode, 'table');
        if (tableNode) {
            editor.windowManager.alert('不可在表格内插入图脚注！');
            return false;
        }
        var title = '图脚注';

        var cls = itemData.act;
        if (currNode.nodeName === 'P' && !currNode.className && currNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '') === '') {
            currNode.className = cls;
            currNode.title = title;
            // currNode.dataset.id = uuid;
            currNode.dataset.number = 'a';
            currNode.removeAttribute("style");
        } else {
            if (currNode.nodeName === 'DIV') {
                editor.execCommand('mceInsertContent', false, `<p class="${cls}" data-number="a" title="${title}"></p>`);
            } else if ($global.hasClass(currNode, 'imgfooter') || $global.hasClass(currNode, 'imgfooter-x')) {
                currNode.className = cls;
                if (cls === 'imgfooter-x') { // 重置排序
                    this.resetImgFooter(currNode);
                }
            } else {
                let newEle = editor.dom.create('p', { 'class': cls, 'data-number': 'a', title }, '&#8203');
                if (currNode.nodeName === 'IMG') {
                    currNode = currNode.parentNode;
                }
                editor.dom.insertAfter(newEle, currNode);
            }
        }
        editor.undoManager.add();
    },
    /**
     * @description 根据图脚注X重置排序
     * @param {Object} editor
     * @param {Element} currNode
     */
    resetImgFooter(currNode = null) {
        const setNextNode = node => {
            if ($global.hasClass(node, 'imgfooter') && node) {
                node.className = 'imgfooter-x';
                setNextNode(node.nextElementSibling);
            }
        }
        setNextNode(currNode.nextElementSibling);
    },

    /**
     * @description 表脚注
     * @param {Object} editor
     * @param {Element} currNode
     * @param {Object} itemData
     */
    addTableFooter(editor = null, currNode = null, itemData = {}) {
        // editor = this.getActiveEditor();
        var tableNode = editor.dom.getParent(currNode, 'table');
        // 如果是在表格内的
        if (tableNode) {
            editor.windowManager.open({
                title: itemData.content ? '修改表脚注' : '添加表脚注',
                body: {
                    type: 'panel',
                    items: [{
                        type: 'input',
                        name: 'footerText',
                        label: '请输入表脚注内容'
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
                initialData: {
                    footerText: itemData.content || ''
                },
                onSubmit: api => {
                    var data = api.getData();
                    api.close();
                    // 修改
                    if (itemData.content && itemData.id) {
                        let anote = tableNode.querySelector(`.table-footer-tag[data-id="${itemData.id}"]`);
                        if (anote) {
                            anote.dataset.title = data.footerText;
                            if (itemData.act === 'tfooter-x' || anote.dataset.start) {
                                anote.dataset.start = "1";
                            } else {
                                anote.removeAttribute('data-start');
                            }
                        }

                        let footnote = tableNode.querySelector(`.tfooter[data-id="${itemData.id}"]`);
                        if (footnote) {
                            footnote.textContent = data.footerText;
                        }
                        // 重置表结构
                        tableUtil.resetTableStruct(tableNode);
                        // 新增
                    } else {
                        itemData.content = data.footerText;
                        this.setTableFooterContent(editor, currNode, itemData);
                    }
                    editor.undoManager.add();
                }
            });
        } else {
            editor.windowManager.alert('表脚注只能用于表格内容中！');
        }
    },
    /**
     * @description 设置表脚注内容
     * @param {Object} editor
     * @param {Element} currNode
     * @param {Object} itemData
     */
    setTableFooterContent(editor = null, currNode = null, itemData = {}) {
        var tableNode = editor.dom.getParent(currNode, 'table');
        var cls = `tag ${itemData.act||''} table`;
        var tBody = tableNode.querySelector(':scope>tbody');
        var colgroups = tableNode.querySelectorAll(':scope>colgroup>col');
        var uuid = $global.guid();
        // 取出最后行元素
        var footEle = tBody.lastChild;
        var tdNode;
        // 如果最后行元素非脚注的则创建
        if (!$global.hasClass(footEle, 'foot')) {
            let newTr = editor.dom.create('tr', { 'class': 'foot ' + footEle.className }, `<td></td>`);
            tdNode = newTr.querySelector('td');
            if (colgroups.length > 1) {
                tdNode.setAttribute('colspan', colgroups.length);
            }
            editor.dom.add(tdNode, 'p', { class: cls, 'data-id': uuid, 'data-number': 'a' }, itemData.content);
            tBody.appendChild(newTr);
            newTr.scrollIntoView({ behavior: "smooth", block: "center" });
            // 否则新建或转换
        } else {
            // 当前元素所在的是否为脚注容器
            let parentTr = editor.dom.getParent(currNode, 'tr.foot');
            if (currNode.nodeName === 'P' && parentTr) {
                currNode.setAttribute('class', cls);
            } else {
                tdNode = footEle.firstChild;
                let newParagraph = editor.dom.create('p', { 'class': cls, 'data-id': uuid, 'data-number': 'a' }, itemData.content);
                tdNode.appendChild(newParagraph);
                newParagraph.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
        // 插入表脚注标签
        var start = "";
        if (itemData.act === 'tfooter-x') {
            start = `data-start="1"`;
        }
        editor.execCommand('mceInsertContent', false, `<span class="table-footer-tag" data-tag="tableFooter" ${start} data-id="${uuid}" data-title="${itemData.content}" data-number="a" contenteditable="false">&#xFEFF;</span>`);

        // 重置表结构
        tableUtil.resetTableStruct(tableNode);
    },

    /**
     * @description 重置图表脚注序号
     * @param {Object} editor
     * @param {Element} currNode
     */
    refreshFooterNumber(editor = null, currNode = null) {
        editor = this.getActiveEditor();
        var tableNode = editor.dom.getParent(currNode, 'table');
        if (tableNode) {
            this.resetTablefooter(tableNode, currNode);
        } else {
            var pageContainer = editor.getBody().querySelector('.page-container');
            var block = editor.dom.getParent(currNode, '.info-block');
            var blocks = pageContainer.querySelectorAll(`.info-block[data-outlineid="${block.dataset.outlineid}"]`);
            this.resetPfooterIndex(Array.from(blocks));
        }
    },

    /**
     * @description 重置图脚注排序
     * @param {Array}  blocks
     */
    resetPfooterIndex(blocks = []) {
        var numIndex = 0;
        blocks.forEach((block, i) => {
            let tfooterNodes = block.querySelectorAll('p.tfooter:not(.table),p.tfooter-x:not(.table)');
            tfooterNodes.forEach(ele => {
                if ($global.hasClass(ele, 'tfooter-x')) {
                    numIndex = 0;
                }
                ele.dataset.tagIndex = numIndex;
                ele.dataset.number = $global.numberToLetters(numIndex).toLowerCase();
                numIndex++;
            })
        });
    },

    /**
     * @description 重置表脚注的序号
     * @param {Element} container
     */
    resetTablefooter(container = null) {
        var tags = container.querySelectorAll('.tfooter,.tfooter-x');
        var numIndex = 0;
        tags.forEach((ele, i) => {
            if ($global.hasClass(ele, 'tfooter-x')) {
                numIndex = 0;
            }
            ele.dataset.tagIndex = numIndex;
            ele.dataset.number = $global.numberToLetters(numIndex).toLowerCase();
            let aNote = container.querySelector(`span[data-id="${ele.dataset.id}"]`);
            if (aNote) {
                aNote.data.title = ele.textContent;
                aNote.dataset.number = ele.dataset.number;
            }
            numIndex++;
        });
    },

    /**
     * @description 重置脚注
     * @param {Object} editor
     */
    resetFooterNoteIndex(editor = null) {
        editor = this.getActiveEditor();
        if (!editor || !editor.getBody()) {
            return false;
        }
        var pageContainer = editor.getBody().querySelector('.page-container');
        if (pageContainer) {
            var index = 0;
            var blocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.fixed):not(.cover):not(.catalogue)'));
            blocks.forEach((block, i) => {
                // 条文脚注
                let footerNote = block.querySelector('.footnote');
                let aNotes = Array.from(block.querySelectorAll('span.a-note'));

                if (!aNotes.length && footerNote) {
                    footerNote.remove();
                } else {
                    if (aNotes.length) {
                        // 如果不存在脚注容器则创建脚注容器
                        if (!footerNote) {
                            footerNote = editor.dom.create('div', { 'class': 'footnote', 'data-id': $global.guid(), 'data-contentid': $global.guid(), 'contenteditable': 'false' }, '');
                            block.appendChild(footerNote);
                        }
                        footerNote.innerHTML = '<hr align="left" />';
                        aNotes.forEach(anote => {
                            let num = index + 1;
                            anote.dataset.number = num;
                            let pNote = editor.dom.create('p', { 'data-id': anote.dataset.id, 'data-number': num }, anote.dataset.title || '脚注描述文字');
                            footerNote.appendChild(pNote);
                            index++;
                        });

                        Array.from(footerNote.querySelectorAll('p[data-id]')).forEach(pNode => {
                            let aNote = block.querySelector(`span[data-id="${pNode.dataset.id}"]`);
                            if (!aNote) {
                                pNode.remove();
                            }
                        });
                    }
                }
                // 非航司模板
                if (this.vm.pageData?.stdKind !== this.vm.editorSetting.tmplType) {
                    block.style.paddingBottom = "20mm";
                }

                // 如果配置了页面高度可无限延展则须处理页面的下边距
                if (this.vm.editorSetting.page && this.vm.editorSetting.page.expand && footerNote && !block.dataset.break) {
                    block.style.paddingBottom = `calc(20mm + ${footerNote.offsetHeight+10}px)`;
                }
                // return
                let nextBlock = block.nextElementSibling;
                if (!$global.hasClass(block, 'disabled') && !block.dataset.break) {
                    // 表脚注
                    let tableNodes = Array.from(block.querySelectorAll('table'));
                    for (let j=0; j<tableNodes.length; j++) {
                        let table = tableNodes[j];
                        let cloneTable = null;
                        if (nextBlock) {
                            let parentId = table.dataset.parentid || table.dataset.id;
                            cloneTable = nextBlock.querySelector(`table[data-parentid="${parentId}"]`);
                        }

                        // let tbody = table.querySelector('tbody');
                        // 序号
                        let tableFooterNum = 0;
                        // 表格内脚注标签元素
                        let tableFootertags = Array.from(table.querySelectorAll('.table-footer-tag'));
                        // 表格底部脚注容器
                        let tableFooterTr = table.querySelector('tr.foot');
                        if (tableFooterTr && $global.hasClass(tableFooterTr, 'hide')) {
                            continue;
                        }
                        let tableFooterNode = tableFooterTr ? tableFooterTr.firstChild : null;//table.querySelector('tr.foot:not(.hide)>td');
                        if (tableFootertags.length) {
                            if (!tableFooterNode) {
                                tableFooterNode = editor.dom.create('tr', { class: 'foot' }, '<td></td>');
                            }
                            // let footerNodes = Array.from(tableFooterNode.querySelectorAll('.tfooter'));
                            let footerHtml = [];
                            // 重置标签及表脚注
                            let uuid;
                            tableFootertags.forEach((el, idx) => {
                                // let pnote = footerNodes[idx]; //table.querySelector(`p[data-id="${el.dataset.id}"]`);
                                if (idx === 0 || el.dataset.start) {
                                    uuid = $global.guid();
                                    tableFooterNum = 0;
                                }
                                el.dataset.number = $global.numberToLetters(tableFooterNum).toLowerCase();
                                // el.dataset.title = pnote ? pnote.textContent : el.dataset.title;
                                footerHtml.push(`<p class="tag tfooter table" contenteditable="false" data-sid="${uuid}" data-id="${el.dataset.id}" data-number="${el.dataset.number}">${el.dataset.title}</p>`);
                                tableFooterNum++;
                            });
                            // 重置表脚注内容
                            tableFooterNode.innerHTML = footerHtml.join("");
                            // 重置表结构
                            tableUtil.resetTableStruct(table);

                        } else {
                            if (tableFooterNode) {
                                tableFooterNode.parentNode.remove();
                                // 重置表结构
                                tableUtil.resetTableStruct(table);
                            }
                        }
                    }

                    // 处理图脚注
                    let imgFootNodes = Array.from(block.querySelectorAll('.imgfooter,.imgfooter-x'));
                    let imgFootIndex = 1;
                    imgFootNodes.forEach((node, i) => {
                        let prevNode = node.previousElementSibling;
                        if ($global.hasClass(node, 'imgfooter-x') || (prevNode && (prevNode.className !== node.className || prevNode.nodeName !== node.nodeName))) {
                            imgFootIndex = 1;
                        }
                        if (imgFootIndex > 26) {
                            imgFootIndex = 1;
                        }
                        node.title = "图脚注";
                        node.dataset.number = $global.numberToLetters(imgFootIndex-1).toLowerCase();
                        imgFootIndex++;
                    })
                }
            })
        }
    },

    /**
     * @description 公式编号
     * @param {Object} editor
     */
    toggleMathNum(editor = null, currNode = null) {
        editor = this.getActiveEditor();
        if (currNode.nodeName === 'IMG' && $global.hasClass(currNode, 'math-img')) {
            var imgContainer;
            var parentNode = currNode.parentNode;
            if (parentNode.nodeName !== 'FIGURE') {
                imgContainer = editor.dom.create('figure', { class: 'image math' }, ''); // contenteditable: 'false'
                currNode.setAttribute('contenteditable', 'true');
                imgContainer.innerHTML = currNode.outerHTML;

                editor.dom.insertAfter(imgContainer, currNode.parentNode.nodeName === 'P' ? currNode.parentNode : currNode);
                if (currNode.parentNode.nodeName === 'P') {
                    currNode.parentNode.remove();
                } else {
                    currNode.remove();
                }
            } else {
                imgContainer = editor.dom.create('p', { class: 'imgs' }, '');
                imgContainer.appendChild(currNode);
                editor.dom.insertAfter(imgContainer, parentNode);
                parentNode.remove();
            }
            this.resetMathNumIndex(editor);
        } else {
            editor.windowManager.alert('公式编号只能作用于公式元素，请点击选中公式后操作！');
        }
    },
    /**
     * @description 重置公式编号
     * @param {Object} editor
     */
    resetMathNumIndex(editor) {
        editor = this.getActiveEditor();
        if (!editor || !editor.getBody()) {
            return false;
        }
        var pageContainer = editor.getBody().querySelector('.page-container');
        if (pageContainer) {
            // 按章节处理
            var caseBlocks = pageContainer.querySelectorAll('.info-block:not(.cover):not(.catalogue):not(.appendix)');
            var caseIndex = 0;
            caseBlocks.forEach(block => {
                let mathImages = block.querySelectorAll('.image.math');
                mathImages.forEach((ele, idx) => {
                    ele.dataset.number = caseIndex + 1;
                    caseIndex++;
                })
            });

            // 按附录处理
            var appendixBlocks = pageContainer.querySelectorAll('.info-block.appendix');
            var appendMath = [];
            appendixBlocks.forEach(block => {
                let letter = block.dataset.letter || '';
                var mathImages = block.querySelectorAll('.image.math');
                mathImages.forEach((ele, idx) => {
                    let fp = _.filter(appendMath, { letter });
                    let num = fp.length + 1;
                    ele.dataset.number = letter + '.' + num;
                    appendMath.push({ letter, num })
                });
            })
        }
    }
}
