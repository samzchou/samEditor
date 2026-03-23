/**
 * ===================================================================================================================
 * @module
 * @desc 内容粘贴处理模块
 * @author sam 2022-06-30
 * ===================================================================================================================
 */

import $global from "@/utils/global";
import tableUtil from "./tableUtil";

// markdown转换
// import MarkdownIt from 'markdown-it';

export default {
    editor: null,
    vm: {},
    clipboardContent: [], // 系统剪贴板内容
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
     * @description 清除HTML标签，仅保留字符串
     * @param{String} content 内容字符串
     */
    clearHtmlTag(content='') {
        if (content != null && content != "") {
            var re1 = new RegExp("<.+?>|&.+?;","g");        // 匹配html标签的正则表达式，"g"是搜索匹配多个符合的内容
            content = content.replace(re1,"");              // 执行替换成空字符
            content = content.replace(/\s/g,"");            // 去掉所有的空格（中文空格、英文空格都会被替换）
            content = content.replace(/[\r\n]/g,"");        // 去掉所有的换行符
            return content;
        } else return '';
    },

    /**
     * @description 解析从外部粘贴进来的内容
     * @param{String} content 内容字符串
     * @param{Boolean} fromWord 是否从word中复制的内容
     */
    parseContent(content = "", fromWord = false) {
        var editor = this.getActiveEditor();
        var currNode = editor.selection.getNode();
        if (($global.hasClass(currNode, 'ol-list') || $global.hasClass(currNode, 'ol-list')) && currNode.textContent.replace(/\s/g,'') === '' && /<\/?\w+(\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'"\s>]+))?)*\s*\/?>/.test(content)) {
            debugger
        }
        var section = document.createElement('div');

        section.innerHTML = content.replace(/[\r\n]/g, '');
        var childNodes = Array.from(section.childNodes);

        const getTextContent = node => {
            let text = [];
            Array.from(node.childNodes).forEach(n => {
                if (!['UL', 'OL'].includes(n.nodeName)) {
                    let str = n.textContent || n.nodeValue;
                    if (str) {
                        text.push(str.replace(/[\u200B-\u200D\uFEFF]/g, ''));
                    }
                }
            });
            return text.join("");
        }

        // 剪贴板内容
        childNodes.forEach((ele, index) => {
            if (ele.nodeName === 'TABLE') {
                ele = this.parseTable(ele, editor);
            } else if (['H1','H2','H3','H4','H5'].includes(ele.nodeName) && this.vm.editorSetting.isStandard) {
                let pNode = document.createElement('p');
                pNode.style.textIndent = '2em';
                pNode.innerHTML = ele.textContent;
                editor.dom.insertAfter(pNode, ele);
                ele.remove();
            } else if (['P'].includes(ele.nodeName)) {
                if (currNode !== 'TD' && (!this.vm.pageData || this.vm.pageData?.stdKind !== this.vm.editorSetting.tmplType)) {
                    ele.style.textIndent = '2em';
                }
                ele.removeAttribute('class');
                ele.innerHTML = ele.textContent;
            } else if (['UL', 'OL'].includes(ele.nodeName) && this.vm.editorSetting.isStandard) {
                let liNodes = Array.from(ele.querySelectorAll('li'));
                let appendNodes = [];
                liNodes.forEach(li => {
                    let text = getTextContent(li);
                    let newEle = editor.dom.create('p', { style: 'text-indent: 2em;' }, text);
                    appendNodes.push(newEle);
                });
                appendNodes.reverse().forEach(node => {
                    editor.dom.insertAfter(node, ele);
                });
                ele.remove();
            } else if (ele.nodeName === 'IMG') {
                if ($global.hasClass(currNode, 'text-box')) {
                    currNode.innerHTML = '';
                    currNode.appendChild(ele);
                } else {
                    let pNode = document.createElement('p');
                    pNode.className = 'imgs';
                    pNode.appendChild(ele);
                    editor.dom.insertAfter(pNode, ele);
                }
            }
        })

        var htmlContent = section.innerHTML;
        section.remove();
        return htmlContent;
    },

    /**
     * @description 解析表格
     * @param{Element} tableNode 表格元素
     * @param{Object} editor 编辑器实例
     */
    parseTable(tableNode = null, editor = null) {
        var uuid = $global.guid();
        var matrixTable = tableUtil.matrixTable(tableNode);
        // console.log('matrixTable', matrixTable);
        editor.dom.removeAllAttribs(tableNode);
        if (this.vm.pageData?.stdKind === this.vm.editorSetting.tmplType) {
            editor.dom.setAttribs(tableNode, { 'border': '1', 'style': 'width:100%;1px solid #333;', 'data-id': uuid });
        } else {
            editor.dom.setAttribs(tableNode, { 'border': '2', 'style': 'width:100%;2px solid #333;', 'data-id': uuid });
            // 创建表标题
            var tableTitleNode = tableNode.querySelector('caption.table-title');
            if (!tableTitleNode) {
                tableTitleNode = editor.dom.create('caption', { 'class': 'table-title', 'data-number': '1', 'data-bookmark': $global.guid() }, '表标题');
                $global.prependChild(tableTitleNode, tableNode);
            }
        }
        
        
        var colgroup = tableNode.querySelector('colgroup');
        // var tbody = tableNode.querySelector('tbody');
        var trs = tableNode.querySelectorAll('tr');
        trs.forEach(tr => {
            editor.dom.removeAllAttribs(tr);
            var tds = tr.querySelectorAll('td');
            tds.forEach((td, index) => {
                let rowSpan = parseInt(td.rowSpan);
                let colSpan = parseInt(td.colSpan);
                editor.dom.removeAllAttribs(td);
                if (rowSpan > 1) {
                    td.rowSpan = rowSpan;
                }
                if (colSpan > 1) {
                    td.colSpan = colSpan;
                }
            })
        });
        if (!colgroup) {
            colgroup = editor.dom.create('colgroup');
            editor.dom.insertAfter(colgroup, tableTitleNode);
        }
        let width = (100 / matrixTable[0].length).toFixed(3);
        let colArr = [];
        for (let i = 0; i < matrixTable[0].length; i++) {
            colArr.push(`<col width="${width}%"/>`);
        }
        colgroup.innerHTML = colArr.join("");
        return tableNode;
    },

    parseHtml(content) {
        if (/<[^>]*>/.test(content)) {
            if (confirm(tinyMCE.i18n.translate('The pasted content contains informal labels, keep on?')) === true) {
                const container = document.createElement('div');
                container.innerHTML = content;
                const textArr = [];
                Array.from(container.childNodes).forEach(node => {
                    textArr.push(node.textContent);
                });
                container.remove();
                return textArr.join(' ');
            } else {
                return '';
            }
        } else {
            return content.replace(/\n/g,'<br/>');
        }
    }

}
