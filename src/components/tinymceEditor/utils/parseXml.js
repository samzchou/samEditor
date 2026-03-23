/**
 * ===================================================================================================================
 * @module
 * @desc 编辑器内容解析成XML
 * @author sam 2021-10-09
 * 参考： http://officeopenxml.com/WPSectionFooterReference.php
 * ===================================================================================================================
 */
'use strict';
import styleTrans from "./styleTrans";
import tableUtil from './tableUtil';
import $global from "@/utils/global";
// import utilFun from './utilConversion';

const colorMap = {
    magenta: 'ff00ff',
    yellow: 'ffff00',
    green: '008000',
    cyan: '00ffff',
    blue: '0000ff',
    red: 'ff0000',
    darkblue: '00008b',
    darkcyan: '008b8b',
    darkgreen: '006400',
    darkmagenta: '8b008b',
    darkred: '8b0000',
    darkgoldenrod: 'b8860b',
    darkgray: 'a9a9a9',
    lightgray: 'd3d3d3',
    black: '000000'
}

const hxLevel = {
    "H1":0,
    "H2":1,
    "H3":2,
    "H4":3,
    "H5":4,
    "H6":5,
}

export default {
    screenDpi: undefined,
    bodyXml: [], // 正文数据
    headerFooter: [], // 页眉页脚
    mediaList: [], // 图片媒体等
    bulletList: [], // 层级项和列项
    footerNotes: [], // 脚注
    annotationList: [], // 批注
    editor: null,
    editorSetting: null,
    olistArr: [],

    /**
     * @description 获取分辨率
     */
    getDpi() {
        if (!this.screenDpi) {
            let tmpEle = document.body.appendChild(document.createElement('DIV'));
            tmpEle.style.width = '1in';
            tmpEle.style.padding = '0';
            this.screenDpi = tmpEle.offsetWidth;
            tmpEle.remove();
        }
        return this.screenDpi;
    },

    /**
     * @description 像素转英寸再换算成doc文档的计算单位 1英寸相当于2.54厘米
     * @param {int} val
     */
    pxToinch(val) {
        let cm = _.ceil(this.parsePxToCm(val), 6); //parseFloat(this.parsePxToCm(val));
        return this.cmToInch(cm);
    },
    /**
     * @description CM转英寸 1 厘米=0.393700787402 英寸, 再转换为WORD的实际单位
     * @param {int} val
     */
    cmToInch(val) {
        return Math.floor(val * 0.385700787402 * 1440);
    },
    /**
     * @description 像素转CM
     * @param {floatInt} px
     */
    parsePxToCm(px = 0) {
        let targetEleWidth = 1, cm;
        let tmpEle = document.body.appendChild(document.createElement('DIV'));
        tmpEle.setAttribute("style", "display:inline-block;width:1cm;height:1cm;padding:0");
        targetEleWidth = _.ceil(parseFloat(window.getComputedStyle(tmpEle).width), 6);
        cm = px / targetEleWidth;
        tmpEle.remove();
        return Math.floor(cm * 10000) / 10000;
    },
    /**
     * @description 图片转为EMU.度量单位为EMU（全称为 English Metric Unit)，1cm =360000EMUS,所以
     * @param {int} px
     */
    imgPxToEmu(px) {
        let cm = parseFloat(this.parsePxToCm(px));
        return Math.round(cm * 360000);
    },
    /**
     * @description 行高（n倍）转doc文档的计算单位 1 = 240
     * @description 实际上HTML与doc的line-height是有不小的误差，还须进一步调整
     * @param {Object} val
     */
    lineHeighTo(val) {
        val = parseFloat(val);
        return parseInt(val * 240 * 0.6735); // 0.6735 只是估算的值
    },
    /**
     * @description 对齐方式转换
     * @param {Object} val
     */
    transAlignment(val) {
        if (['left', 'center', 'right'].includes(val)) {
            return val;
        } else if (val === 'justify') {
            return 'both';
        }
        return 'left';
    },
    /**
     * @description 节点左侧偏移位置
     * @param {Element} node
     */
    getOffsetLeft(node) {
        if (node.parentNode && ['FIGURE', 'P'].includes(node.parentNode.nodeName)) {
            node = node.parentNode;
        }
        var textBox = $global.getParentBySelector(node, 'text-box');
        var infoBlock = $global.getParentBySelector(node, 'info-block');
        if (infoBlock && !textBox) {
            var blockStyle = window.getComputedStyle(infoBlock);
            return parseInt(node.offsetLeft - parseFloat(blockStyle.paddingLeft));
        }
        return 0;
    },
    /**
     * @description 设置行高
     * @param {Object} style
     */
    getLineHeight(style) {
        var lineHeight = parseFloat(style.lineHeight) / parseFloat(style.fontSize);
        return Math.round(lineHeight * 100) / 100;
    },
    /**
     * @description 多层子元素嵌套的样式
     * @param {Element} node
     */
    setMuData(node) {
        var data = {}
        const setStyle = ele => {
            if (ele.nodeName === 'STRONG') {
                data.isBig = true;
            }
            if (ele.nodeName === 'EM') {
                data.isItalic = true;
            }
            if (ele.style.color) {
                data.color = ele.style.color;
            }
            if (ele.style.backgroundColor) {
                data.bgColor = ele.style.backgroundColor;
            }

            let sc = ele.childNodes;
            if (sc.length) {
                sc.forEach(el => {
                    if (el.nodeName !== '#text') {
                        setStyle(el);
                    }
                })
            }
        }
        setStyle(node);
        return data;
    },
    /**
     * @description 根据元素的样式设定要转换成DOC的样式
     * @param {Element} node
     */
    getStyles(node) {
        if (!node) {
            return {};
        }
        try {
            // 条文元素
            if ($global.hasClass(node, 'article')) {
                node = node.parentNode;
            }
            const style = window.getComputedStyle(node) || {};
            var block = $global.getParentBySelector(node, 'info-block');
            // var blockStyle = window.getComputedStyle(block);
            var lineHeight = node.style?.lineHeight || this.getLineHeight(style) || 1.5;
            /*if (node.innerHTML.includes('本文件规定了XXXXXX的要求')) {
                debugger
            }*/
            var fontSize = Math.floor(parseFloat(style.fontSize) * 1.5);
            var line = this.lineHeighTo(lineHeight);
            if (/\pt$/.test(lineHeight) || (this.editorSetting.tempPath && this.editorSetting.tempPath === 'wcTmp')) {
                line = parseInt(lineHeight) * 20;
            }
            /*
            if (this.editorSetting.tempPath && this.editorSetting.tempPath === 'wcTmp' && lineHeight == 1.5) {
                line = 240 * parseFloat(lineHeight);
            }
            */


            var fontFamily = styleTrans.getFontFamily(style.fontFamily) || '宋体';
            if (fontFamily) { // && fontFamily.includes('microsoft')
                fontFamily = fontFamily.replace(/\"|\'/g,'');
            }
            var align = this.transAlignment(style.textAlign);
            var left = this.pxToinch(this.getOffsetLeft(node));

            // 段落且包含图片 node.nodeName === 'P' &&
            var notSnapGrid = fontSize >= 28 ? true : false;
            if (node.querySelector('img')) {
                let lineOffsetHeight = parseFloat(style?.lineHeight) || 20;
                let imgNodes = Array.from(node.querySelectorAll('img'));
                if ($global.hasClass(node, 'imgs')) {
                    notSnapGrid = true;
                } else {
                    for (let imgNode of imgNodes) {
                        if (imgNode.offsetHeight > lineOffsetHeight) {
                            notSnapGrid = true;
                            break;
                        }
                    }
                }
            }

            // 如果是单元格，且为图标题
            if (node.nodeName === 'TD' && node.querySelector('.title')) {
                align = 'center';
            }

            // 计算图片的左侧偏移量
            if (node.nodeName === 'IMG' && align === 'both') {
                var imgParent = node.parentNode;
                var offLeft = 0;
                if ($global.getParentBySelector(node, 'bullet')) {
                    imgParent = $global.getParentBySelector(node, 'bullet');
                }
                if ($global.getParentBySelector(node, 'ol-list')) {
                    imgParent = $global.getParentBySelector(node, 'ol-list');
                }
                offLeft = node.offsetLeft - imgParent.offsetLeft;
                if (offLeft > 0) {
                    left = this.pxToinch(offLeft);
                }
            }
            var indent;
            if (style.textIndent) {
                indent = this.pxToinch(parseFloat(style.textIndent, 10));
                if (indent > 420) {
                    left = indent - 420;
                }
            }

            var data = {
                line, // 段落行高
                notSnapGrid, // 锁定对齐网格线
                fontFamily, // 字体
                fontSize, // 字体大小
                indent, // 缩进
                align, // 对齐方式
                left, // 左侧距离
            }
            // 段前断后距离
            if (style.marginTop && parseInt(style.marginTop)) {
                data.before = this.pxToinch(parseInt(style.marginTop));
            }
            if (style.marginBottom && parseInt(style.marginBottom)) {
                data.after = this.pxToinch(parseInt(style.marginBottom));
            }

            // 书签
            if (node.dataset && node.dataset.bookmark) {
                if (!$global.hasClass(node, 'hide-list')) {
                    data.bookmark = node.dataset.bookmark;
                }
                // 第一层
                data.firstLevel = $global.hasClass(node, 'level0');
            }
            // 文字色
            var textColor = $global.rgb2hex(style.color);
            if (textColor !== '000000' && !node.dataset.tag && node.nodeName !== 'A') {
                data.color = textColor;
            }
            // 背景色
            if (node.style.backgroundColor && !node.dataset.tag) {
                data.bgColor = node.style.backgroundColor;
            }

            // 加粗
            if (['STRONG','H1','H2','H3','H4','H5','H6'].includes(node.nodeName)) {
                data.isBig = true;
            }

            // 斜体
            if (node.nodeName === 'EM') {
                data.isItalic = true;
            }
            // 多层
            if (/^(STRONG|SPAN)$/.test(node.nodeName)) {
                var mudata = this.setMuData(node);
                data = Object.assign(data, mudata);
            }
            // 上标
            if (node.nodeName === 'SUP') {
                data.isSup = true;
                data.fontSize = 21;
            }
            // 下标
            if (node.nodeName === 'SUB') {
                data.isSub = true;
                data.fontSize = 21;
            }
            // 下划线
            if (node.style.textDecoration === 'underline') {
                data.underline = true;
            }
            // 删除线
            if (node.style.textDecoration === 'line-through') {
                data.lineThrough = true;
            }

            // 层级项或者附录项
            if (!$global.hasClass(node, 'hide-list') && ($global.hasClass(node, 'ol-list') || $global.hasClass(node, 'appendix-list'))) {
                let prevNode = node.previousElementSibling;
                if (this.editorSetting?.wordBreak && (!prevNode || $global.hasClass(prevNode, 'header-title'))) {
                    data.firstOutline = node.dataset.bookmark ? true : false;
                }

                if (!this.olistArr.includes(node.dataset.index)) {
                    data.ollist = true; // 是否层级项
                    data.isAppendix = $global.hasClass(node, 'appendix-list');
                    data.numlvl = node.dataset.index ? node.dataset.index.split('.').length - 1 : undefined; // 层级项序号
                    if (data.bookmark && data.numlvl && data.numlvl > 0) {
                        data.withTitle = true;
                    }
                    let checkNum = { isLevel: true };
                    if (data.isAppendix) {
                        checkNum = { appendix: true, prev: node.dataset.prev };
                    }
                    let numBullet = _.find(this.bulletList, checkNum);
                    data.bulletIndex = numBullet ? numBullet.index : 1;
                }
            }

            // 列项
            if ($global.hasClass(node, 'bullet')) {
                let bulletLevel = parseInt(node.dataset.level, 10);
                if (!$global.hasClass(node, 'hide-list')) { // 非隐藏项定义编号样式
                    // 列项编号标识
                    let numListPid = node.dataset.id || block.dataset.outlineid;
                    let numListId = node.dataset.type;
                    // 从bulletList中查找是否已经存在
                    let bulletData = _.find(this.bulletList, { id: numListId, bulletLevel });
                    if (['num', 'num-index', 'tag-index', 'lower'].includes(numListId)) {
                        bulletData = _.find(this.bulletList, { pid: numListPid, id: numListId, bulletLevel });
                    }
                    let bulletIndex = _.findIndex(this.bulletList, { pid: numListPid, id: numListId, bulletLevel });
                    let bulletStart = node.dataset.start || node.dataset.number || '';
                    if (!bulletData) {
                        bulletIndex = this.bulletList.length + 1;
                        bulletData = { pid: numListPid, id: numListId, cls: numListId, index: bulletIndex, left: bulletLevel * 420, start:parseInt(bulletStart) + 1 };
                        this.bulletList.push(bulletData);
                    }
                    // bulletData.sort = parseInt(node.dataset.start) + 1;
                    // 列项的层级（用于定位）
                    bulletData.bulletLevel = bulletLevel;
                    // 是否包含在有序层级项中c
                    data.bulletData = bulletData;
                } else { // 隐藏项则定义为段落且设置缩进单位
                    data.isHide = true; // 首行缩进
                    data.left = (bulletLevel + 1) * 210; // 文本前缩进
                }
            }
            // 包含在列项中
            if (node.nodeName === 'P' && $global.hasClass(node.parentNode, 'bullet')) {
                data.bulletLevel = parseInt(node.parentNode.dataset.level, 10) + 1;
            }

            // 自定义表标题
            if ($global.hasClass(node, 'custom-table-title')) {
                data.isTableTitle = true;
            }

            // 图标题
            if ($global.hasClass(node, 'img-title')) {
                data.isImgTitle = true;
                data.num = node.dataset.number;
                // 不需要显示在目录中
                data.notOutlineLvl = true;
            }
            // 表格的单元格
            if (node.nodeName === 'TD') {
                data.vAlign = style.verticalAlign === 'middle' ? 'center' : style.verticalAlign;
            }

            if ($global.hasClass(node, 'text-box')) {
                let boxLeft = parseFloat(style.left);// - parseFloat(blockStyle.paddingLeft);
                let boxTop = parseFloat(style.top);// - parseFloat(blockStyle.paddingTop);
                data.left = this.imgPxToEmu(parseInt(style.left, 10));
                data.top = this.imgPxToEmu(parseInt(style.top, 10));
                data.ptLeft = _.ceil(boxLeft * 0.75, 2);
                data.ptTop = _.ceil(boxTop * 0.75, 2);
                data.width = this.imgPxToEmu(parseInt(style.width, 10));
                data.height = this.imgPxToEmu(parseInt(style.height, 10));
                data.ptWidth = _.ceil(parseFloat(style.width, 10)*0.75, 2); //this.imgPxToEmu(parseInt(style.width, 10));
                data.ptHeight = _.ceil(parseFloat(style.height, 10)*0.75, 2); //this.imgPxToEmu(parseInt(style.height, 10));
            }
            // 一般文档则加上特有属性
            if (this.editorSetting.normal) {
                data.normal = true;
            }
            return data;
        } catch (error) {
            console.error('getStyles===>', error, node);
            return {};
        }
    },
    /**
     * @description 设置节点XML
     * @param {Element} node
     */
    setXmlByNode(node = null) {
        // 如果节点为BR或者属于隐藏域的 /^(BR)$/.test(node.nodeName) ||
        try {
            if ($global.hasClass(node, 'hide-list') || $global.hasClass(node.parentNode, 'hide-list')) {
                return null;
            }
            var style = this.getStyles(node.parentNode);
            var text = node.textContent;
            var data = {
                style,
                text
            }
            if (text === '\n') {
                data.tagName = "BR";
            }
            return data;
        } catch(error) {
            console.log('setXmlByNode==>', node, error)
            return null;
        }

    },
    /**
     * @description 表/图标题
     * @param {Element} node
     * @param {Object} style
     */
    parseTitleXml(node = null, style = null) {
		var block = $global.getParentBySelector(node, 'info-block');
        var titleName = '表';
        var number = node.dataset.number;
        var textStr = node.innerText || '';
        if ($global.hasClass(node, 'txu')) {
            textStr += "（续）";
        }
        textStr = titleName + ' ' + number + '  ' + textStr;
        textStr = this.replaceText(textStr);
        // 不需要在目录中显示
        style.notOutlineLvl = true;
        return {
            style,
            isTitle: 'tableTitle',
            text: textStr
        }
    },
    /**
     * @description 表内单元格的具体内容
     * @param {Element} td
     */
    setTdContent(td = null) {
        const table = $global.getParentBySelector(td, 'table');
        const tid = table.dataset.id || $global.guid();
        const nodes = Array.from(td.childNodes);
        var tdStyle = this.getStyles(td);
        tdStyle.line = 240; // 固定行距
        var arr = [];

        // 判断是否段落
        let pNodes = Array.from(td.querySelectorAll('p'));
        if (!pNodes.length) {
            let inlineChildren = [];
            nodes.forEach(node => {
                let type = 'text';
                let inlineItem = this.setTdContentByText(node, tdStyle);
                if (inlineItem) {
                    inlineChildren.push(inlineItem);
                }
            });
            arr.push({ type: 'text', style: tdStyle, children: inlineChildren });
        } else {
            nodes.forEach(node => {
                let style = node.nodeName !== '#text' ? this.getStyles(node) : tdStyle;
                style.line = 240; // 固定行距
                let type = 'text';
                // 如果是段落的节点
                if (node.nodeName === 'P') {
                    if (!/[\image|\imgs|\zhu|\example|\tfooter]/.test(node.className)) {
                        // 段落，非图片|注|注X|示例|示例X|表脚注|表脚注X
                        let tdPragrah = this.setXmlByPragraph(node);
                        let tdChildren = [];
                        if (tdPragrah?.children && tdPragrah.children.length) {
                            tdPragrah.children.forEach(obj => {
                                if (obj.imgHeight) {
                                    tdChildren.push({
                                        type: "image",
                                        imgData: obj
                                    })
                                } else {
                                    tdChildren.push(obj)
                                }
                            });
                        }
                        type = 'image';
                        arr.push({ type, text: '', style, children: tdChildren });
                    } else if (/zhu/.test(node.className)) {
                        // 注|注X
                        let sid = node.dataset.id;
                        let bulletIndex = _.findIndex(this.bulletList, $global.hasClass(node, 'zhu') ? { zhu: true, tid:sid } : { zhux: true, tid:sid });
                        if (!~bulletIndex) {
                            bulletIndex = this.bulletList.length + 1;
                            this.bulletList.push($global.hasClass(node, 'zhu') ? { zhu: true, index: bulletIndex, id: 'zhu', tid:sid } : { zhux: true, index: bulletIndex, id: 'zhux', tid:sid });
                        } else {
                            bulletIndex += 1;
                        }
                        type = 'tag';
                        let text = node.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
                        text = this.replaceText(text);
                        arr.push({ type, bulletIndex, text, style });
                    } else if (/example/.test(node.className)) {
                        // 示例|示例X
                        let sid = node.dataset.id;
                        let bulletIndex = _.findIndex(this.bulletList, $global.hasClass(node, 'example') ? { example: true, tid:sid } : { examplex: true, tid:sid });
                        if (!~bulletIndex) {
                            bulletIndex = this.bulletList.length + 1;
                            this.bulletList.push($global.hasClass(node, 'example') ? { zhu: true, index: bulletIndex, id: 'example', tid:sid } : { examplex: true, index: bulletIndex, id: 'examplex', tid:sid });
                        } else {
                            bulletIndex += 1;
                        }
                        type = 'tag';
                        let text = node.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
                        text = this.replaceText(text);
                        arr.push({ type, bulletIndex, text, style });
                    } else if (/tfooter/.test(node.className)) {
                        // 表脚注内容,编号样式
                        let sid = node.dataset.sid;
                        let bulletIndex = _.findIndex(this.bulletList, { tfooter: true, tid:sid });
                        if (!~bulletIndex) {
                            bulletIndex = this.bulletList.length + 1;
                            this.bulletList.push({ tfooter: true, index: bulletIndex, id: 'letter', tid:sid });
                        } else {
                            bulletIndex += 1;
                        }
                        type = 'tag';
                        let text = node.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
                        text = this.replaceText(text);
                        arr.push({ bulletIndex, text, style });
                    } else if (/[\image|\imgs]/.test(node.className)) {
                        let tdPragrah = this.setXmlByPragraph(node);
                        let tdChildren = [];
                        tdPragrah.children.forEach(obj => {
                            if (obj.imgHeight) {
                                tdChildren.push({
                                    type: "image",
                                    imgData: obj
                                })
                            } else {
                                tdChildren.push(obj)
                            }
                        });
                        type = 'image';
                        arr.push({ type, text: '', style, children: tdChildren });
                    }
                } else if (node.nodeName === 'BR' && !$global.isLastNode(node)) {
                    arr.push({ type:'br' });
                } else {
                    let inlineItem = this.setTdContentByText(node, style);
                    if (inlineItem) {
                        arr.push(inlineItem);
                    }
                }
            });
        }
        return arr;
    },
    replaceText(text = '') {
        try {
            const xmlEntities = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&apos;'
            };
            if (text && typeof text === 'string') {
                // 正则表达式匹配已经转义的实体和需要转义的字符
                text = text.replace(/(&(?:amp|nbsp|lt|gt|quot|apos|#\d+);)|[&<>"']/g, function(match, entity) {
                    if (entity) {
                        // 如果是已经转义的实体，直接返回
                        return entity;
                    }
                    // 否则，进行转义
                    return xmlEntities[match];
                });
            }
        } catch (error) {
            console.log(text, error)
        }
        return text || '';
    },

    setTdContentByText(node = null, style = {}) {
        let type = 'text';
        if ($global.hasClass(node, 'image') || node.nodeName === 'IMG') {
            // 直接为图片
            let imgEle;
            if (node.nodeName === 'IMG') {
                imgEle = node;
            } else {
                imgEle = node.querySelector('img');
            }
            let imgData = this.setXmlByImg(imgEle);
            return { type: 'image', style: {}, imgData };
        } else if (['#text', 'EM'].includes(node.nodeName)) {
            // 直接为文本内容
            return { type, text: this.replaceText(node.nodeValue || node.textContent), style };
        } else if (node.nodeName === 'BR') {
            return { type: 'br' };
        } else if (['SPAN', 'STRONG', 'SUP', 'SUB', 'A'].includes(node.nodeName)) {
            let text = this.replaceText(node.textContent);
            // 如果是表脚注标签的
            if ($global.hasClass(node, 'table-footer-tag')) {
                text = node.dataset.number; // + ")";
                style.vertAlign = "superscript";
                type = 'superscript';
            } else {
                style = this.getStyles(node);
            }
            return { type, text, style };
        }
        return null;
    },

    /**
     * @description 解析表格的数据结构 isApprove : 是否为审批表（TM:潍柴专用）
     * @param {Elements Array} trs
     */
    resetTdByColspan(table = null, tblGrids = [], isApprove = false, isHead = false) {

        tableUtil.setTdIndex(table, false);
        const tableMatrix = tableUtil.matrixTable(table);
        // 输出数据
        var trDatas = [];
        tableMatrix.forEach((rowMatrix, rowIndex) => {
            var trEle = table.rows[rowIndex];
            // var otherHeight = trEle.parentNode.nodeName === 'THEAD' ? 12 : 8;
            if (!$global.hasClass(trEle, 'hide')) {
                // let trStyle = window.getComputedStyle(trEle);
                let trColor = colorMap[trEle.style.backgroundColor] || 'FFFFFF';

                // 定义行高
                let trHeight = 30;
                trHeight = trEle.offsetHeight;
                if (trHeight > 100) {
                    trHeight -= Math.ceil(trHeight/10); // 考虑导出的word在office中的实际高度差
                }

                let tdDatas = {
                    height: isApprove ? 454 : this.pxToinch(trHeight) - 27,
                    // isHeader: trEle.parentNode.nodeName === 'THEAD',
                    tds: []
                };

                // 表头边框样式
                if (trEle.parentNode.nodeName === 'THEAD' || $global.hasClass(trEle, 'zhu') || $global.hasClass(trEle, 'foot')) {
                    tdDatas.border = {
                        width: 12,
                        inside: 4,
                        isHeader: trEle.parentNode.nodeName === 'THEAD'
                    }
                    // 表头最后一行才须加注表宽
                    if (trEle.parentNode.nodeName === 'THEAD' && !this.editorSetting.wordBreak) {
                        let headerRows = trEle.parentNode.rows;
                        if ([].indexOf.call(headerRows, trEle) < headerRows.length - 1) {
                            delete tdDatas.border;
                        }
                    }
                }

                // const prevTrData = rowIndex ? tableMatrix[rowIndex - 1] : null;
                // const tdNodes = Array.from(trEle.querySelectorAll('td'));
                rowMatrix.forEach((colMatrix, colIndex) => {
                    // const tdNode = trEle.querySelector(`td[data-index="${colIndex}"]`);
                    // const prevTdData = prevTrData ? prevTrData[colIndex] : null;
                    if (colMatrix.cell) {
                        const { el } = colMatrix.cell;
                        var { rowSpan, colSpan } = el;

                        let tdData = {};

                        if (colSpan > 1) {
                            tdData.gridSpan = colSpan;
                        }
                        if (rowSpan > 1 && !colMatrix.continue) {
                            tdData.vMerge = 'restart';
                        } else if (colMatrix.continue) {
                            tdData.text = "";
                            tdData.vMerge = 'continue';
                        }

                        if (!colMatrix.hide) {
                            // 解析单元格内元素
                            let wrs = [];
                            if (!colMatrix.continue) {
                                wrs = this.setTdContent(el);
                            }
                            let width = Math.ceil(el.offsetWidth);
                            let bgColor = trColor;
                            if (el.style.backgroundColor) {
                                bgColor = colorMap[el.style.backgroundColor] || trColor;
                            }
                            let style = this.getStyles(el);
                            tdData = Object.assign(tdData, {
                                wrs,
                                width,
                                colWidth: this.pxToinch(width),
                                bgColor,
                                style
                            })
                            tdDatas.tds.push(tdData);
                        }
                    }
                });
                trDatas.push(tdDatas);
            }
        });
        return trDatas;
    },

    /**
     * @description 对齐方式转换
     * @param {String} val
     */
    parseJuestifyContent(val) {
        const mapAlign = { 'normal': 'left', 'left': 'left', 'center': 'center', 'end': 'right' };
        return mapAlign[val];
    },
    getColwidth(tableNode = null, colLens = 0) {
        var trs = Array.from(tableNode.querySelectorAll('tr'));
        var list = [];
        for (let i = 0; i < trs.length; i++) {
            let tds = Array.from(trs[i].querySelectorAll('td'));
            if (tds.length === colLens) {
                tds.forEach(td => {
                    list.push(td.offsetWidth);
                })
                break;
            }
        }
        return list;
    },
    /**
     * @description 解析表格
     * @param {Element} tableNode
     */
    setXmlByTable(tableNode = null, isApprove = false) {
        // 表格父容器
        // const tableContainer = tableNode.parentNode;
        // var containerStyle = window.getComputedStyle(tableContainer);
        var tableStyle = window.getComputedStyle(tableNode);
        // var tableWidth = parseFloat(tableNode.offsetWidth);
        var tableBorderWidth = Math.ceil(parseFloat(tableStyle.borderWidth));
        var style = {
            width: tableNode.style.width,
            align: tableStyle.float || 'center',
            borderWidth: tableBorderWidth * 6,
            borderInside: tableBorderWidth * 2,
        }
        if (style.align === 'none') {
            style.align = 'center';
        }
        // 解析TR
        // var trHeightArr = [];
        var tableAttXml = [];
        var colGroups = [];
        var colLeftArr = [];
        var tblGridXml = [];
        // 列宽
        var cols = tableNode.querySelectorAll('col');
        var colLeft = 0;
        var colWidthArr = this.getColwidth(tableNode, cols.length);
        for (let i = 0; i < cols.length; i++) {
            const col = cols[i];
            let colWidth = col.offsetWidth;
            if (!colWidth) {
                colWidth = colWidthArr[i];
            }
            let width = Math.ceil(this.pxToinch(colWidth));
            colLeftArr.push(colLeft);
            colGroups.push({ width, offsetWidth: colWidth });
            tblGridXml.push(width);
            colLeft += Math.ceil(colWidth);
        }

        // 解析单元行及单元格数据
        var trXml = this.resetTdByColspan(tableNode, tblGridXml, isApprove);

        // 表格标题及附加信息
        const titleNode = tableNode.querySelector('caption.table-title');
        if (titleNode) {
            let titleStyle = this.getStyles(titleNode);
            let titleXml = this.parseTitleXml(titleNode, titleStyle);
            // let bulletIndex = _.findIndex(this.bulletList, { 'tableTitle': true, tid, bulletLevel });
            tableAttXml.push(titleXml);
        }
        // 附加信息
        const descNode = tableNode.querySelector('caption.table-description');
        if (descNode && descNode.firstChild) {
            let descData = this.setXmlByNode(descNode.firstChild);
            if (descData) {
                descData.style.fontSize = this.editorSetting.tempPath && this.editorSetting.tempPath === 'wcTmp' ? 21 : 18;
                descData.isTableDesc = true;
                tableAttXml.push(descData);
            }
        }

        return {
            style,
            tableAttr: tableAttXml,
            tblGrid: tblGridXml,
            trXml
        }
    },
    /**
     * @description 解析单元行及单元格数据
     * @param {Array} arrList
     */
    parseTrXml(arrList = [], align = 'center', trHeightArr) {
        let xmlArr = [];
        arrList.forEach((tr, index) => {
            let trArr = [];
            tr.forEach((td, index) => {
                // let fontFamily = td.fontFamily || '宋体';
                let line = td.lineHeight || 360;
                let align = td.vertAlign || 'baseline';
                // let bgColor = td.bgColor || 'FFFFFF';
                let style = td.style || {};
                style.align = align;
                trArr.push({
                    style,
                    colWidth: td.colWidth,
                    vMerge: td.gridSpan,
                    gridSpan: td.gridSpan,
                    text: this.replaceText(td.text),
                    bgColor: td.bgColor,
                    line,
                    align
                });
            })
            xmlArr.push(trArr);
        });
        return xmlArr;
    },
    /**
     * @description 解析图片XML
     * @param {Element} node
     */
    setXmlByImg(node) {
        if (!node) {
            return {};
        }
        var imgStyle = this.getStyles(node);
        var imgSrc = node.getAttribute('src');
        var error = node.getAttribute('error');
        imgSrc = imgSrc.split('?')[0];
        var fileName = imgSrc.split("/");
        fileName = fileName[fileName.length - 1];

        /* var extName = $global.getExt(extName);
        if (['gif','bmp'].includes(extName.toLowerCase())) {
            return null;
        } */

        var imgIndex = this.mediaList.length;
        this.mediaList.push({ fileName, error, path: node.dataset.origin || node.src, index: imgIndex });

        // 生成XML

        var imgWidth = this.imgPxToEmu(node.offsetWidth||node.width);
        var imgHeight = this.imgPxToEmu(node.offsetHeight||node.height);
        var imgAlign = 'left';
        var imgLine = 240; //imgStyle.line;

        if (!imgWidth || !imgHeight) {
            console.error('图片'+imgSrc+'未定义尺寸！');
        }

        var imgParentNode = node.parentNode;
        // 公式编号
        var mathNum;
        if (imgParentNode && $global.hasClass(imgParentNode, 'math') && imgParentNode.dataset.number) {
            mathNum = imgParentNode.dataset.number;
            imgAlign = "center";
        }

        if (imgParentNode.nodeName === 'P' || imgParentNode.nodeName === 'FIGURE') {
            let parentStyle = this.getStyles(imgParentNode);
            imgAlign = parentStyle.align;
        } else {
            var float = node.style.float;
            if (float) {
                imgAlign = float;
            } else {
                let marginLeft = node.style.marginLeft;
                let marginRight = node.style.marginRight;
                if (marginLeft && marginRight) {
                    imgAlign = 'center';
                }
            }
        }
        // 图片边框
        var imgBorder = null;
        if (node.style.borderWidth && parseInt(node.style.borderWidth)) {
            imgBorder = {
                width: parseInt(node.style.borderWidth) * 12700 / 2,
                color: node.style.borderColor ? $global.rgb2hex(node.style.borderColor) : '888888',
                type: node.style.borderStyle
            }
        }

        // 图片标题
        var imgTitle = node.getAttribute('title') || fileName;
        if (node.parentNode.nodeName === 'FIGURE' && node.nextElementSibling) {
            imgTitle = node.nextElementSibling.innerText;
        }
        if (imgAlign === 'center') {
            imgStyle.left = 0;
        }
        imgStyle.align = imgAlign;
        return {
            mathNum,
            imgIndex,
            imgWidth,
            imgHeight,
            imgAlign,
            imgTitle,
            imgLine,
            imgBorder,
            fileName,
            style: imgStyle
        }
    },

    /**
     * @description 解析标题XML
     * @param {Element} node
     */
    setXmlByTitle(node, titleName = "ctitle") {
        var titleStyle = this.getStyles(node);
        var childNodes = node.querySelectorAll('p');
        var children = [];
        childNodes.forEach(ele => {
            let style = this.getStyles(ele);
            let text = ele.textContent;
            let innerText = ele.innerText.replace(/[\u200B-\u200D\uFEFF]/g, '');
            if (innerText.match(/\n/ig) !== null) { //
                innerText.split('\n').forEach(t => {
                    if (t !== '') {
                        children.push({ text:this.replaceText(t), style });
                    }
                })
            } else {
                if ($global.hasClass(ele, 'appendix')) {
                    text += ' ' + ele.dataset.number;
                }
                children.push({ text:this.replaceText(text), style });
            }
        });
        /* console.log(this.editorSetting);
        debugger */
        return {
            tempPath: this.editorSetting.tempPath,
            isTitle: titleName,
            style: titleStyle,
            children
        }
    },

    // 处理多级层套关系 addBy sam.shen 2-23-12-22
    resetGrandchildNodes(parentNode) {
        const childNodes = [];
        const resetchildNodes = element => {
            const childElements = Array.from(element.childNodes);//element.children;
            for (let childElement of childElements) {
                if (['#text','IMG'].includes(childElement.nodeName)) {
                    childNodes.push(childElement);
                } else if (childElement.nodeName === 'SPAN' && $global.hasClass(childElement, 'a-note')) {
                    childNodes.push(childElement);
                } else {
                    resetchildNodes(childElement);
                }
            }
        }
        resetchildNodes(parentNode);

        if (childNodes.length > 1) {
            let cloneParentNode = parentNode.cloneNode();
            for (let ele of childNodes) {
                let parentElement = ele.parentNode;
                if (parentElement === parentNode) {
                    cloneParentNode.appendChild(ele);
                } else {
                    parentElement = ele.parentNode.cloneNode();
                    parentElement.removeAttribute('data-mce-style');
                    parentElement.appendChild(ele);
                    cloneParentNode.appendChild(parentElement);
                }
            }
            parentNode.innerHTML = cloneParentNode.innerHTML;
            cloneParentNode.remove();
        }
        return parentNode;
    },

    /**
     * @description 解析段落
     * @param {Element} node
     */
    setXmlByPragraph(node = null, childNodes = null) {
        // 如果为公式编号则直接解析图片
        if (node.nodeName === 'FIGURE' && $global.hasClass(node, 'math')) {
            let xmlData = this.setXmlByImg(node.querySelector('img'));
            if (xmlData) {
                xmlData.isImage = true;
            }
            return xmlData;
        }

        var isBullet = false, bulletStart = 0, bulletType = '', isPragraph = true, imgfooter = false;
        var titleStyle = this.getStyles(node);
        if (titleStyle.bulletData) {
            isPragraph = false;
            isBullet = true;
            bulletStart = parseInt(node.dataset.start||node.dataset.number||0) + 1;
            bulletType = node.dataset.type;
        }
        // 索引段落
        if ($global.hasClass(node, 'fld-char')) {
            titleStyle.isDot = true;
        }

        var children = [];
        childNodes = childNodes || Array.from(node.childNodes);

        // 如为段落或列项的则重置子集 addBy sam.shen 2-23-12-22
        if (node.nodeName === 'P' || $global.hasClass(node, 'bullet')) {
            node = this.resetGrandchildNodes(node);
            childNodes = Array.from(node.childNodes);
        }

        if ($global.hasClass(node, 'zhu')) {
            // 注
            let bulletLevel = node.dataset.level ? parseInt(node.dataset.level, 10) : 1;
            let bulletIndex = _.findIndex(this.bulletList, { zhu: true, bulletLevel });
            if (!~bulletIndex) {
                bulletIndex = this.bulletList.length + 1;
                this.bulletList.push({ zhu: true, index: bulletIndex, id: 'zhu', bulletLevel, left: bulletLevel * 420 });
                titleStyle.bulletData = { zhu: true, id: 'zhu', cls: 'zhu', index: bulletIndex, bulletLevel: bulletLevel };
            } else {
                titleStyle.bulletData = this.bulletList[bulletIndex];
                titleStyle.bulletData.bulletLevel = bulletLevel;
            }
            isPragraph = false;
            isBullet = true;
            bulletType = 'zhu';
            delete titleStyle.left;
        } else if ($global.hasClass(node, 'zhux') || $global.hasClass(node, 'zhu-x')) {
            // 注X处理
            let sid = node.dataset.id;
            let bulletLevel = node.dataset.level ? parseInt(node.dataset.level, 10) : 1;
            let bulletIndex = _.findIndex(this.bulletList, { zhux: true, tid:sid, bulletLevel });
            if (!~bulletIndex) {
                bulletIndex = this.bulletList.length + 1;
                this.bulletList.push({ zhux: true, index: bulletIndex, id: 'zhux', tid:sid, bulletLevel, left: bulletLevel * 420, start:node.dataset.restart });
                titleStyle.bulletData = { zhux: true, id: 'zhux', cls: 'zhux', index: bulletIndex, bulletLevel: bulletLevel, start:node.dataset.restart };
            } else {
                titleStyle.bulletData = this.bulletList[bulletIndex];
                titleStyle.bulletData.bulletLevel = bulletLevel;
            }
            isPragraph = false;
            isBullet = true;
            bulletStart = bulletIndex;
            bulletType = 'zhux';
            delete titleStyle.left;
        } else if ($global.hasClass(node, 'example')) {
            // 示例
            let bulletLevel = node.dataset.level ? parseInt(node.dataset.level, 10) : 1;
            let bulletIndex = _.findIndex(this.bulletList, { example: true, bulletLevel });
            if (!~bulletIndex) {
                bulletIndex = this.bulletList.length + 1;
                this.bulletList.push({ example: true, index: bulletIndex, id: 'example', bulletLevel, left: bulletLevel * 420 });
                titleStyle.bulletData = { example: true, id: 'example', cls: 'example', index: bulletIndex, bulletLevel };
            } else {
                titleStyle.bulletData = this.bulletList[bulletIndex];
                titleStyle.bulletData.bulletLevel = bulletLevel;
            }
            isPragraph = false;
            isBullet = true;
            bulletType = 'example';
            delete titleStyle.left;
        } else if ($global.hasClass(node, 'examplex') || $global.hasClass(node, 'example-x')) {
            // 示例X
            let sid = node.dataset.id;
            let bulletLevel = node.dataset.level ? parseInt(node.dataset.level, 10) : 1;
            let bulletIndex = _.findIndex(this.bulletList, { examplex: true, tid:sid, bulletLevel });
            if (!~bulletIndex) {
                bulletIndex = this.bulletList.length + 1;
                this.bulletList.push({ examplex: true, index: bulletIndex, id: 'examplex', tid:sid, bulletLevel, left: bulletLevel * 420, start:node.dataset.restart });
                titleStyle.bulletData = { examplex: true, id: 'examplex', cls: 'examplex', index: bulletIndex, bulletLevel, start:node.dataset.restart };
            } else {
                titleStyle.bulletData = this.bulletList[bulletIndex];
                titleStyle.bulletData.bulletLevel = bulletLevel;
            }
            isPragraph = false;
            isBullet = true;
            bulletStart = bulletIndex;
            bulletType = 'examplex';
            delete titleStyle.left;

        } else if ($global.hasClass(node, 'tfooter') || $global.hasClass(node, 'tfooter-x')) {
            // 表脚注
            titleStyle.indent = 420;
            children.push({
                text: `${node.dataset.number}  `,
                style: {
                    ...titleStyle,
                    isSup: true
                }
            })
        } else if ($global.hasClass(node, 'imgfooter')) {
            // 图脚注
            imgfooter = true;
            delete titleStyle.left;
            isPragraph = false;
            children.push({
                text: `${node.dataset.number}  `,
                style: {
                    ...titleStyle,
                    isSup: true
                }
            })
        } else if (node.className === 'bullet' && node.dataset.tag && node.dataset.tag === 'docVer') { // 前言中特殊破折号
            titleStyle.dashLine = true;
        }


        childNodes.forEach((ele, i) => {
            let isEmpty = false;
            let text = ele.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
            text = this.replaceText(text);
            if($global.hasClass(node, 'hide-list') && i === 0 && text === '' && ele.nodeName !== 'IMG') {
                isEmpty = true;
            }
            if (text !== '\n' && !isEmpty) {
                let eleStyle = ['#text','BR'].includes(ele.nodeName) ? titleStyle : this.getStyles(ele);
                if ($global.hasClass(ele, 'a-note')) {
                    text = '';
                    eleStyle.noteIndex = ele.dataset.number;
                } else if ($global.hasClass(ele, 'table-footer-tag')) {
                    eleStyle.isSup = true;
                    text = ele.dataset.number;
                }
                // 术语的英文名须空一格字符
                if ($global.hasClass(node, 'term') && ele.nodeName === 'SPAN' && i === 1 && !/^\s/.test(text)) {
                    text = ' ' + text;
                }

                if ($global.hasClass(node, 'fld-char') && $global.hasClass(ele, 'line')) {
                    eleStyle.isDot = true;
                }

                let obj = { text, style: eleStyle };

                if (ele.nodeName === 'A') { // A标签
                    obj.link = ele.getAttribute('href');
                } else if (ele.nodeName === 'BR' && !$global.isLastNode(ele)) { // 换行标签
                    obj.tagName = "BR";
                } else if (ele.nodeName === 'IMG') { // 图片
                    obj = this.setXmlByImg(ele);
                } else if (ele.nodeName !== '#text' && ele.querySelector('img')) {
                    obj = this.setXmlByImg(ele.querySelector('img'));
                } else if ($global.hasClass(ele, 'comment')) { // 批注
                    let data = JSON.parse(ele.dataset.content);
                    data.reverse();
                    let annotationData = [];
                    data.forEach(item => {
                        let itemObj = {
                            id: item.id.replace(/\-/g,''),
                            author: item.author || 'anonymous',
                            date: item.date,
                            text: this.replaceText(item.comment || item.text),
                            solve: item.solve || false
                        };
                        itemObj.text = this.replaceText(itemObj.text);
                        annotationData.push(itemObj);
                        if (item.replys && item.replys.length) {
                            item.replys.forEach(r => {
                                let rid = r.id || $global.guid();
                                let rboj = {
                                    pid: item.id.replace(/\-/g,''),
                                    id: rid.replace(/\-/g,''),
                                    author: r.author || 'anonymous',
                                    date: r.date,
                                    text: this.replaceText(r.comment || r.text)
                                };
                                rboj.text = this.replaceText(rboj.text);
                                annotationData.push(rboj)
                            })
                        }
                    });

                    let lastAnnotation = null;
                    let startIndex = 0, endIndex = 0;
                    if (this.annotationList.length) {
                        lastAnnotation = this.annotationList[this.annotationList.length - 1];
                        startIndex = lastAnnotation.endIndex + 1;
                    }
                    endIndex = startIndex + annotationData.length - 1;

                    this.annotationList.push({
                        startIndex,
                        endIndex,
                        data: annotationData
                    });
                    obj.annotation = { startIndex, endIndex };
                }
                children.push(obj);
            }
        });

        if (children.length) {
            // 判断子集是否有补需要对齐网格线的
            for (let child of children) {
                let childStyle = child.style;
                if (childStyle.notSnapGrid) {
                    titleStyle.notSnapGrid = true;
                    break;
                }
            }

            return {
                isPragraph,
                isBullet,
                bulletType,
                bulletStart,
                imgfooter,
                style: titleStyle,
                children
            }
        }
        return null;
    },

    /**
     * @description 终结线
     * @param {Element} node
     */
    setXmlByFinishedLine(node) {
        const hr = node.querySelector('hr');
        var titleStyle = this.getStyles(node);
        var nodeStyle = window.getComputedStyle(node);
        var top = this.imgPxToEmu(hr.offsetTop);
        top += parseFloat(nodeStyle.marginTop);
        titleStyle.top = Math.ceil(top * this.getDpi() / 72);

        return {
            finishedLine: true,
            style: titleStyle,
            weight: this.editorSetting.endLineWeigth,
        }
    },

    /**
     * @description 解析水平线
     * @param {Element} node
     */
    setXmlByHr(node) {
        var style = this.getStyles(node);
        style.top = this.imgPxToEmu(node.offsetTop);
        style.left = this.imgPxToEmu(node.offsetLeft);
        style.width = this.imgPxToEmu(node.offsetWidth);
        return {
            hrLine: true,
            style
        }
    },

    /**
     * @description 术语的条款
     * @param {Element} node
     */
    setXmlByTerm(node) {
        try {
            var style = this.getStyles(node);
            style.align = 'left';
            var firstChild = node.firstChild; //firstElementChild;
            var text = firstChild.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
            return {
                style,
                text
            }
        } catch (error) {
            console.error("setXmlByTerm=>", error);
            return null;
        }
    },

    /**
     * @description 递归解析元素的XML
     * @param {Element} container
     * @param {Boolean} isBullet 是否为列项
     */
    recurrenceNode(container, isBullet = false) {
        var xmlList = [];
        const parseNode = (node, outlineType='') => {
            var xmlStr;

            if (node.nodeName === '#text' && node.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '') {
                return;
            }
            if (node.nodeName === 'TABLE') {
                // console.log('container==>', container)
                xmlStr = this.setXmlByTable(node, $global.hasClass(container, 'approve') || $global.hasClass(container, 'record'));
                xmlList.push(xmlStr);
            } else if (node.nodeName === 'P' && !$global.hasClass(node, 'image')) {
                xmlStr = this.setXmlByPragraph(node);
                if (xmlStr) {
                    xmlList.push(xmlStr);
                }
            } else if (node.nodeName === 'HR' && !$global.hasClass(node, 'empty')) { // 水平线
                xmlStr = this.setXmlByHr(node);
                xmlList.push(xmlStr);
            } else if (node.nodeName === 'IMG') { // 图片
                xmlStr = this.setXmlByImg(node);
                if (xmlStr) {
                    xmlList.push(xmlStr);
                }
            } else if ($global.hasClass(node, 'header-title')) { // 标题名称
                let titleName = 'ctitle'; //node.dataset.bookmark ? 'ctitle' : 'ptitle';
                if ($global.hasClass(node, 'appendix')) {
                    titleName = 'atitle';
                } else if ($global.hasClass(node, 'smaller')) {
                    titleName = 'stitle';
                }
                xmlStr = this.setXmlByTitle(node, titleName);
                xmlList.push(xmlStr);
            } else if ($global.hasClass(node, 'finished') && !$global.hasClass(node, 'empty')) { // 终结线且不超限
                xmlStr = this.setXmlByFinishedLine(node);
                xmlList.push(xmlStr);
            } else if ($global.hasClass(node, 'text-box')) { // 文本框
                xmlStr = this.setXmlByTextBox(node);
                xmlList.push(xmlStr);
            } else if (!$global.hasClass(node, 'footnote') && !$global.hasClass(node, 'locked')) { // 过滤掉脚注容器和不可编辑的提示标签
                // let outlineId = '', parentId = '', catalog = '';
                // 术语和定义的条款
                if ($global.hasClass(node, 'ol-list') && !$global.hasClass(node, 'hide-list')) {
                    if (outlineType === '5') {
                        if (!node.firstChild || !['#text','SPAN','EM'].includes(node.firstChild.nodeName)) {
                            node.innerHTML = '&#8203' + node.innerHTML;
                        }
                    }
                }
                var childNodes = node.childNodes;
                // 过滤行内元素
                var filterChildNodes = this.getContinuityInlineNode(childNodes);
                if (filterChildNodes.inlineList.length) {
                    xmlStr = this.setXmlByPragraph(node, filterChildNodes.inlineList);
                    if (xmlStr) {
                        xmlList.push(xmlStr);
                    }
                    childNodes = filterChildNodes.filters;
                }

                if (childNodes && childNodes.length) {
                    for (let i = 0; i < childNodes.length; i++) {
                        parseNode(childNodes[i], outlineType);
                    }
                } else {
                    if (node.nodeName === '#text' && node.textContent.replace(/ /g, '') !== '\n') {
                        xmlStr = this.setXmlByNode(node);
                        if (xmlStr) {
                            xmlList.push(xmlStr);
                        }
                    }
                }
            }
        }
        parseNode(container, container.dataset.outlinetype);

        if (xmlList.length) {
            let lastXml = xmlList[xmlList.length-1]
            let lastChildren = lastXml?.children || [];
            if (lastChildren.length) {
                let lastNode = lastChildren[lastChildren.length-1];
                if (lastNode.imgWidth) {
                    lastNode.imgWidth = parseInt(lastNode.imgWidth * 0.95);
                    lastNode.imgHeight = parseInt(lastNode.imgHeight * 0.95);
                }
            }
        }

        return xmlList;
    },
    /**
     * @description 解析文本框元素
     */
    setXmlByTextBox(node=null) {
        var titleStyle = this.getStyles(node);
        var childNodes = Array.from(node.childNodes);
        var children = [];
        if (childNodes && childNodes.length) {
            for (let i = 0; i < childNodes.length; i++) {
                let childNode = childNodes[i];
                if (childNode.nodeName === 'P') {
                    children.push(this.setXmlByPragraph(childNode, null));
                } else if (childNode.nodeName === 'TABLE') {
                    children.push(this.setXmlByTable(childNode));
                }
            }
        }
        return {
            style: titleStyle,
            isBox: true,
            children
        }
    },

    /**
     * @description 行内元素
     */
    getContinuityInlineNode(nodes = []) {
        var inlineList = [], filters = [];
        const matchNode = node => {
            for (let i = 0; i < inlineList.length; i++) {
                if (inlineList[i] === node) {
                    return true;
                }
            }
            return false;
        }
        const getInlineNode = index => {
            let node = nodes[index];
            if (node && ['#text', 'SPAN', 'EM', 'STRONG', 'A', 'IMG', 'SUP', 'SUB'].includes(node.nodeName)) {
                inlineList.push(node);
                getInlineNode(index + 1);
            }
        }
        getInlineNode(0);
        // 清理过滤出来的节点
        nodes.forEach(node => {
            if (!matchNode(node)) {
                filters.push(node)
            }
        })
        return {
            inlineList,
            filters
        };
    },

    /**
     * @description 解析正文内容成XML
     * @param {Element} pageBlock
     * @param {int} index
     * @param {Boolean} isLast
     */
    parseBodyToXml(pageBlock = null, index = 0, isLast = false, outXml = false) {
        var xmlList = this.recurrenceNode(pageBlock);
        // 页面布局参数
        // const pageStyle = window.getComputedStyle(pageBlock);
        var pageWidth = pageBlock.dataset.pagesize && pageBlock.dataset.pagesize === 'A3' ? 16838 : 11906;
        var pageHeight = pageBlock.dataset.pagesize && pageBlock.dataset.pagesize === 'A3' ? 11906 : 16838;
        var pageTop = 1417; //- 150;
        var pageBottom = 1134;// - 55;// - 150;
        var pageLeft = $global.hasClass(pageBlock, 'left') ? 1134 : 1417;
        var pageRight = $global.hasClass(pageBlock, 'left') ? 1417 : 1134;
        var pageNumStart = (pageBlock.dataset.pagenum=='Ⅰ'||pageBlock.dataset.pagenum=='1') ? pageBlock.dataset.pagenum : '';
        var pagePram = {
            backCover: $global.hasClass(pageBlock, 'backcover'),
            pageNo: pageBlock.dataset.no,
            pageNumStart,
            pageNumText: pageBlock.dataset.pagenum || '',
            pageIndex: this.headerFooter.length + 1,
            pageWidth,
            pageHeight,
            pageTop,
            pageBottom,
            pageLeft,
            pageRight,
            pageType: pageBlock.dataset.outlinetype,
            appendixLetter: pageBlock.dataset.letter,
        }
        if (!outXml) {
            // 潍柴模板，封面后的审批表页面
            var approve = $global.hasClass(pageBlock, 'approve');
            this.bodyXml.push({ xmlList, pagePram, approve });
        } else {
            return {
               xmlList,
               pagePram
            }
        }
    },

    async resetImage(section) {
        const blockWidth = section.offsetWidth;
        const imgNodes = Array.from(section.querySelectorAll('img'));

        for (let node of imgNodes) {
            if (node.dataset.origin && node.dataset.origin !== node.src) {
                node.src = node.dataset.origin;
            }
            if (node.width || node.height) {
                let imgWidth = node.offsetWidth;
                let imgHeight = node.offsetWidth;
                let lv = imgHeight / imgWidth;
                if (imgWidth > blockWidth) {
                    imgWidth = parseInt(blockWidth * 0.95);
                    imgHeight = parseInt(imgWidth * lv * 0.95);
                }
                node.width = imgWidth;
                node.height = imgHeight;
            }
        }
        return true;
    },

    /**
     * @description 正文输出XML文档
     * @param {Element} body
     */
    async outputXml(body, doubleSided = false, docData = {}, editorSetting={}, editor) {
        var infoBlocks = Array.from(body.querySelectorAll('div.info-block:not(.cover):not(.catalogue)')); // 排除封面、目次及这些页面后的空白页
        /* if (editorSetting.normal) {
            infoBlocks = Array.from(body.querySelectorAll('div.info-block:not(.catalogue)')); // 一般文档仅排除目次页
        } */
        this.bodyXml = []; // 正文主体
        this.headerFooter = []; // 页眉页脚
        this.mediaList = []; // 图片
        this.bulletList = []; // 层级项和列项
        this.footerNotes = []; // 脚注
        this.annotationList = []; // 批注

        this.editorSetting = editorSetting;
        this.olistArr = [];

        const pageBlocks = Array.from(body.querySelectorAll('div.info-block'));
        pageBlocks.forEach(page => {
            $global.removeClass(page, 'pageHide');
        })
        // debugger
        // 处理封面数据
        var coverData = null;
        // debugger
        if (editorSetting.isStandard) { // 标准文档封面
            coverData = this.setCoverData(body, docData.stdKind) || null;
            if (coverData && docData.stdKind == 1100) {
                coverData.isGB = true;
            }
            if (coverData) {
                coverData.docId = docData.docId;
            }
        } else if (editorSetting.normal) { // 自由文档封面
            let coverBlock = body.querySelector('div.info-block.cover');
            // 解析内容
            // debugger
            if (coverBlock) {
                coverData = this.parseBodyToXml(coverBlock, 0, false, true);
                coverData.stdKind = docData.stdKind;
                // this.bodyXml.push(xmlData);
            }
        }

        // 其他扩展信息 用于XML数据包导出
        var stdExpand = this.setStdExpand(body);
        // 术语集合 用于XML数据包导出
        var termList = this.setStdTerm(body);
        // 处理目录结构
        var catalogue = this.setCatalogues(body);
        // 处理层级项和列项的对应样式XML
        const olList = Array.from(body.querySelectorAll('div.ol-list:not(.hide-list)'));
        if (olList && olList.length) {
            let numList = [];
            olList.forEach(li => {
                let len = li.dataset.index.split('.').length;
                // 过滤相同层级项
                let dd = _.find(numList, { len });
                if (!dd) {
                    numList.push({ text: li.dataset.index, len });
                }
            });
            numList = _.sortBy(numList, 'len');
            this.bulletList.push({ isLevel: true, index: 1, numList, normal:this.editorSetting.normal });
        }
        // 处理附录项的对应样式XML
        const checkAppendixBullet = obj => {
            let bulletData = _.find(this.bulletList, { appendix:true, prev:obj.prev });
            if (bulletData) {
                for (let i=0; i<bulletData.numList.length; i++) {
                    let item = bulletData.numList[i];
                    if (item.len === obj.len) {
                        return true;
                    }
                }
            }
            return false;
        }
        const appendixBlocks = Array.from(body.querySelectorAll('div.info-block[data-letter]'));
        appendixBlocks.forEach(block => {
            let prevLetter = block.dataset.letter;
            let bulletData = _.find(this.bulletList, { appendix:true, prev:prevLetter });
            if (!bulletData) {
                bulletData = { appendix: true, prev: prevLetter, index: this.bulletList.length + 1, numList: [], normal:this.editorSetting.normal};
                this.bulletList.push(bulletData);
            }

            let appendixList = Array.from(block.querySelectorAll('div.appendix-list:not(.hide-list)'));
            appendixList.forEach(li => {
                let len = li.dataset.index.split('.').length;
                let dd = checkAppendixBullet({ prev:li.dataset.prev, len });
                if (!dd) {
                    bulletData.numList.push({ text: li.dataset.index, prev: li.dataset.prev, len, normal:this.editorSetting.normal });
                }
            });
        })

        // 处理各个页面的数据结构
        var pageStartIndex = this.headerFooter.length;
        for (let i = 0; i < infoBlocks.length; i++) {
            // 处理正文主体内容
            let block = infoBlocks[i];
            // 解析内容
            this.parseBodyToXml(block, i, i === infoBlocks.length - 1);
            // 处理页眉页脚
            let headerFooter = this.parseHeaderFooter(block, i + pageStartIndex);
            headerFooter.pageType = block.dataset.outlinetype;
            this.headerFooter.push(headerFooter);
            // 处理脚注
            let footerNotes = this.parseFooterNote(block);
            if (footerNotes) {
                this.footerNotes.push(footerNotes);
            }
        }

        const checkIsSameType = (sourcePageParam, targetPageParam) => {
            switch (sourcePageParam.pageType) {
                case '1':
                case '2':
                case '11':
                case '12':
                    return sourcePageParam.pageType === targetPageParam.pageType && sourcePageParam.pageWidth === targetPageParam.pageWidth && sourcePageParam.pageHeight === targetPageParam.pageHeight;
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                    return ['3','4','5','6','7'].includes(targetPageParam.pageType)  && sourcePageParam.pageWidth === targetPageParam.pageWidth && sourcePageParam.pageHeight === targetPageParam.pageHeight;
                case '8':
                case '9':
                    return sourcePageParam.pageType === targetPageParam.pageType && sourcePageParam.appendixLetter === targetPageParam.appendixLetter && sourcePageParam.pageWidth === targetPageParam.pageWidth && sourcePageParam.pageHeight === targetPageParam.pageHeight;
            }
            return false;
        }

        const mergerXMLData = (data, i) => {
            let index = i + 1;
            let nextData = this.bodyXml[index];
            if (nextData && checkIsSameType(data.pagePram, nextData.pagePram)) {
                // 合并数组
                data.xmlList = data.xmlList.concat(nextData.xmlList);
                nextData.pagePram.concat = true;
                mergerXMLData(data, index);
            }
            return data;
        }

        // 参考文献列表
        // var biblio = this.setBibliography(body);
        var bodyXml = [];
        // 如果让word自动分页的则将bodyXml重新定义
        if (this.editorSetting.wordBreak) {
            for (let i=0; i<this.bodyXml.length; i++) {
                let data = this.bodyXml[i];
                if (data.pagePram.concat) {
                    continue;
                }
                // 合并数组
                mergerXMLData(data, i);
                bodyXml.push(data);
            }
            bodyXml.forEach((item, index) => {
                item.pagePram.pageIndex = index + 1;
            })
            // 重新设定页眉页脚数据
            const headerFooter = [];
            let index = 0;
            this.headerFooter.forEach(item => {
                if (item.isToc) {
                    item.index = index;
                    headerFooter.push(item);
                    index++;
                } else {
                    let xmlItem = _.find(bodyXml, row => {
                        return row.pagePram.pageType === item.pageType;
                    })
                    if (xmlItem) {
                        item.index = index;
                        headerFooter.push(item);
                        index++;
                    }
                }
            });
            this.headerFooter = headerFooter;

            // 处理目次内容
            if (catalogue.length) {
                var catalogueItem = catalogue[0];
                for (let i=1; i<catalogue.length; i++) {
                    let item = catalogue[i];
                    catalogueItem.arr = catalogueItem.arr.concat(item.arr)
                }
                catalogue = [catalogueItem];
            }

            // 文档最后终止线
            let lastXml = bodyXml[bodyXml.length-1]['xmlList'];
            let finisheItem = _.find(lastXml, { finishedLine:true });
            if (!finisheItem) {
                lastXml.push({
                    finishedLine: true,
                    style: {
                        "line": 242,
                        "notSnapGrid": false,
                        "fontFamily": "宋体",
                        "fontSize": 21,
                        "indent": 0,
                        "align": "center",
                        "left": 0,
                        "before": 440,
                        "top": 3493816
                    }
                })
            }
        } else {
            bodyXml = this.bodyXml;
        }

        // 编号样式加入条文脚注
        if (this.footerNotes && this.footerNotes.length) {
            this.bulletList.push({
                id: 'footnote',
                index: 1000,
                left: 720
            })
        }

        // console.log('parseXml editorSetting===>', this.editorSetting)
        return {
            body: bodyXml,
            wordBreak: this.editorSetting.wordBreak,
            headerFooter: this.headerFooter,
            mediaList: this.mediaList,
            bulletList: this.bulletList,
            coverData: _.isEmpty(coverData) ? null : coverData,
            catalogue,
            footerNotes: this.footerNotes,
            annotationList: this.annotationList,
            doubleSided,
            stdExpand,
            termList,
        };
    },
    /**
     * @description 获取封面信息
     * @param {Element} body
     */
    setCoverData(body = null, stdKind = 1100) {
        const coverContainer = body.querySelector('.cover');
        if (coverContainer) {
            var data = { stdKind, fontSize: {}, fontFamily: {} }, ridIndex = 2000;
            // 潍柴保密等级
            let secrecyEle = coverContainer.querySelector('.secrecy');
            if (secrecyEle) {
                data.secrecy = secrecyEle.textContent;
            }

            // 取出ICS
            var icsEle = coverContainer.querySelector('.icsNumber');
            if (icsEle && icsEle.textContent !== icsEle.dataset.name && icsEle.textContent !== '') {
                data.icsNumber = 'ICS ' + icsEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
            }
            // 取出CSS
            var cssEle = coverContainer.querySelector('.ccsNumber');
            if (cssEle && cssEle.textContent !== cssEle.dataset.name && cssEle.textContent !== '') {
                data.ccsNumber = 'CCS ' + cssEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
            }
            // 备案号
            var recordNumberEle = coverContainer.querySelector('.recordNumber');
            if (recordNumberEle && recordNumberEle.textContent !== recordNumberEle.dataset.name && recordNumberEle.textContent !== '') {
                data.recordNumber = recordNumberEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
            }

            // 取出标准代码及图标
            var stdSignEle = coverContainer.querySelector('.icon');
            if (stdSignEle && stdSignEle.textContent !== stdSignEle.dataset.name) {
                data.stdSign = stdSignEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
                let iconImg = stdSignEle.querySelector('img');
                if (iconImg) {
                    let width = this.imgPxToEmu(iconImg.offsetWidth);
                    let height = this.imgPxToEmu(iconImg.offsetHeight);
                    if ([1100, 7].includes(stdKind)) {
                        width = 1440180;
                        height = 719455;
                    }
                    data.icon = {
                        url: iconImg.src,
                        width,
                        height,
                        ridIndex
                    };
                    ridIndex++;
                }
            }
            // 取出LOGO
            var logoEle = coverContainer.querySelector('.logo');
            if (logoEle) {
                let style = window.getComputedStyle(logoEle);
                let logoImg = logoEle.querySelector('img');
                if (logoImg) {
                    let boxLeft = parseFloat(style.left);
                    let boxTop = parseFloat(style.top);
                    data.logo = {
                        url: logoImg.src,
                        width: this.imgPxToEmu(parseInt(style.width, 10)),
                        height: this.imgPxToEmu(parseInt(style.height, 10)),
                        ptWidth: _.ceil(parseFloat(style.width, 10)*0.75, 2),
                        ptHeight: _.ceil(parseFloat(style.height, 10)*0.75, 2),
                        ptLeft: _.ceil(boxLeft * 0.75, 2),
                        ptTop: _.ceil(boxTop * 0.75, 2),
                        ridIndex
                    };
                    ridIndex++;
                }
            }

            // 取出Title
            var stdTitleEle = coverContainer.querySelector('h1.title');
            if (stdTitleEle) {
                data.stdTitle = stdTitleEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '');
                let titleImg = stdTitleEle.querySelector('img');
                if (titleImg) {
                    let width = this.imgPxToEmu(titleImg.offsetWidth);
                    let height = this.imgPxToEmu(titleImg.offsetHeight);
                    data.titleImg = {
                        url: titleImg.src,
                        width,
                        height,
                        ridIndex
                    };
                    ridIndex++;
                }
                let stdTitleStyle = this.getStyles(stdTitleEle);
                data.fontSize.stdTitle = stdKind === 1100 ? 28 : stdTitleStyle.fontSize;
                data.fontFamily.stdTitle = stdTitleStyle.fontFamily;
            }
            // 取出标准编号
            var numEle = coverContainer.querySelector('.numbers .tt');
            if (numEle) {
                let stdNo = '';
                Array.from(numEle.childNodes).forEach(el => {
                    if (el.nodeName !== '#text'){
                        if ($global.hasClass(el, 'stdSign')) {
                            stdNo += el.textContent + " ";
                            if (!data.stdSign) {
                                data.stdSign = el.textContent;
                            }
                        } else {
                            stdNo += el.textContent;
                        }
                    }
                });
                data.stdNo = stdNo.replace(/[\u200B-\u200D\uFEFF]/g, '');

            }
            // 取出替代标准号
            var insteadEle = coverContainer.querySelector('.numbers .origStdNo');
            if (insteadEle && insteadEle.textContent !== insteadEle.dataset.name) {
                var insteadText = insteadEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
                if (insteadEle && insteadText !== '' && !insteadText.match(/xx-/gi)) {
                    data.origStdNo = '代替 ' + insteadText;
                }
            }

            // 取出标准名称
            data.stdName = "";
            var nameEle = coverContainer.querySelector('.std-name');
            if (nameEle) {
                var stdNameSplit = nameEle.innerText.split("\n");
                if (stdNameSplit.length) {
                    let stdName = [];
                    stdNameSplit.forEach(str => {
                        str = str.replace(/[\u200B-\u200D\uFEFF]/g, '');
                        if (str) {
                            stdName.push(str);
                        }
                    })
                    data.stdName = stdName.join('\n');
                }
                let stdNameStyle = this.getStyles(nameEle);
                data.fontSize.stdName = stdNameStyle.fontSize;
                data.fontFamily.stdName = stdNameStyle.fontFamily;
            }

            // 取出标准英文名称
            data.stdNameEn = "";
            var ennameEle = coverContainer.querySelector('.stdNameEn');
            if (ennameEle) {
                var stdEnNameSplit = ennameEle.innerText.split("\n");
                if (stdEnNameSplit.length) {
                    let stdEnName = [];
                    stdEnNameSplit.forEach(str => {
                        str = str.replace(/[\u200B-\u200D\uFEFF]/g, '');
                        if (str) {
                            stdEnName.push(str);
                        }
                    });
                    data.stdNameEn = stdEnName.join('\n');
                }
                let stdEnNameStyle = this.getStyles(ennameEle);
                data.fontSize.stdEnName = stdEnNameStyle.fontSize;
                data.fontFamily.stdEnName = stdEnNameStyle.fontFamily;
            }

            // 与国际标准一致性程度标识
            var consistentSignEle = coverContainer.querySelector('.consistentSign');
            if (consistentSignEle && consistentSignEle.textContent !== consistentSignEle.dataset.name) {
                let consistentSign = consistentSignEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
                if (consistentSign.replace(/\s/g,'') !== '') {
                    consistentSign = '(' + consistentSign + ')';
                }
                data.consistentSign = consistentSign;
            }

            // 取出版本
            var stdEditionEle = coverContainer.querySelector('.stdEdition');
            if (stdEditionEle && stdEditionEle.textContent !== stdEditionEle.dataset.name) {
                data.stdEdition = stdEditionEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
            }
            // 取出完成时间
            /* var updateTimeEle = coverContainer.querySelector('.tag-updatetime');
            if (updateTimeEle && updateTimeEle.textContent !== updateTimeEle.dataset.name) {
                data.updateTime = updateTimeEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
            } */
            // 取出专利说明
            var patentFileEle = coverContainer.querySelector('span.patentFile');
            if (patentFileEle && !$global.hasClass(patentFileEle.parentNode, 'hide') && patentFileEle.textContent !== patentFileEle.dataset.name) {
                data.patentFile = patentFileEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
            }

            // 取出发布日期
            var publishEle = coverContainer.querySelector('.stdPublishDate');
            if (publishEle) { // && publishEle.textContent !== publishEle.dataset.name
                data.stdPublishDate = publishEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') + ' 发布';
            }
            // 取出实施日期
            var putEle = coverContainer.querySelector('.stdPerformDate');
            if (putEle) { // && putEle.textContent !== putEle.dataset.name
                data.stdPerformDate = putEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') + ' 实施';
            }
            // 取出发布单位名称
            data.releaseDepartment = "";
            var ucEle = coverContainer.querySelector('.main-util .releaseDepartment');
            if (ucEle) {
                var ucEleStyle = this.getStyles(ucEle);
                data.fontSize.releaseDepartment = ucEleStyle.fontSize;
                data.fontFamily.releaseDepartment = ucEleStyle.fontFamily;
                var ucSplit = ucEle.innerText.split("\n");
                if (ucSplit.length) {
                    let releaseDepartment = [];
                    ucSplit.forEach(str => {
                        str = str.replace(/[\u200B-\u200D\uFEFF]/g, '');
                        if (str) {
                            releaseDepartment.push(str);
                        }
                    })
                    data.releaseDepartment = releaseDepartment.join('\n');
                }
            }
            // 取出发布单位图片
            var ucImg = coverContainer.querySelector('.main-util img');
            if (ucImg) {
                let width = this.imgPxToEmu(ucImg.offsetWidth);
                let height = this.imgPxToEmu(ucImg.offsetHeight);
                data.ucImg = {
                    url: ucImg.src,
                    width,
                    height,
                    ridIndex
                }
                ridIndex++;
            }

            // 取出文本框
            data.boxData = [];
            var textBoxs = Array.from(coverContainer.querySelectorAll('.text-box'));
            if (textBoxs.length) {
                textBoxs.forEach(node => {
                    let nodeData = this.setXmlByTextBox(node);
                    data.boxData.push(nodeData)
                })
            }
            data.customCover = this.editorSetting.customCover;
            data.mergeStd = this.editorSetting.mergeStd;
        }
        return data;
    },
    /**
     * @description 获取其他扩展信息
     * @param {Element} body
     */
    setStdExpand(body = null) {
        var stdExpand = {};
        const prefaceBlock = Array.from(body.querySelectorAll('.info-block.preface'));
        const regSym = /[，；。！？,.;]/g;
        prefaceBlock.forEach((container, index) => {
            let childNodes = Array.from(container.childNodes);
            for (let node of childNodes) {
                let textContent = node.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g,'');
                if (textContent) {
                    let allText = textContent.split(regSym);
                    for (let str of allText) {
                        if (str && /^\本标准|^\本文件/.test(str)) {
                            // 提出单位 proposeDep
                            if (str.match(/提出/ig) !== null && !stdExpand.proposeDep) {
                                stdExpand.proposeDep = str.replace(/[\本标准|\本文件|\由|\提出|\并归口]/g,'');
                            }
                            // 归口单位 belongDep
                            if (str.match(/归口/ig) !== null && str.slice(-2) === '归口' && !stdExpand.belongDep) {
                                stdExpand.belongDep = str.replace(/[\本标准|\本文件|\由|\归口|\提出|\并归口]/g,'');
                            }
                            // 起草单位 draftDep
                            if (str.match(/\起草单位|\起草部门/ig) !== null && !stdExpand.draftDep) {
                                stdExpand.draftDep = str.replace(/[\本标准|\本文件|\主要|\起草单位|\起草部门|\：|\:]/g,'');
                            }
                            // 批准单位 approveDep
                            if (str.match(/\审定通过|\审核通过/ig) !== null && str.slice(-2) === '通过' && !stdExpand.approveDep) {
                                stdExpand.approveDep = str.replace(/[\经|\审定通过|\审核通过]/g,'');
                            }
                            // 主要起草人 draftPerson
                            if (str.match(/\起草人/ig) !== null && !stdExpand.draftPerson) {
                                stdExpand.draftPerson = str.replace(/[\本标准|\本文件|\主要|\起草人|\：|\:]/g,'');
                            }
                        }
                    }
                }
            }
        })
        return stdExpand;
    },
    /**
     * @description 获取术语列表
     * @param {Element} body
     */
    setStdTerm(body = null) {
        var list = [];
        const termList = Array.from(body.querySelectorAll('.ol-list[data-outlinetype="5"]'));
        termList.forEach((termNode, index) => {
            if (index) {
                let childNodes = Array.from(termNode.childNodes);
                let pIndex = 0;
                let obj = { para:[] };
                for (let node of childNodes) {
                    if (node.nodeName === 'P') {
                        if (pIndex === 0) {
                            let cNodes = Array.from(node.childNodes);
                            for (let cNode of cNodes) {
                                let textContent = cNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
                                if (/[\u4e00-\u9fa5]/.test(textContent)) {
                                    obj.zhName = textContent;
                                } else {
                                    obj.enName = textContent;
                                }
                            }
                        } else {
                            let text = node.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
                            let para = {
                                text
                            }
                            if (/^\[来源/.test(text)) {
                                para.link = text.replace(/\[|\]|\:|\：|\来源|\s/g,'')
                            }
                            obj.para.push(para);
                        }
                        pIndex++;
                    }
                }
                list.push(obj)
            }
        });
        return list;
    },

    /**
     * @description 获取参考文献列表
     * @param {Element} body
     */
    setBibliography(body = null) {
        var list = [];
        const blocks = Array.from(body.querySelectorAll('.info-block[data-outlinetype="11"]'));
        blocks.forEach(container => {
            let childNodes = Array.from(container.childNodes);
            for (let node of childNodes) {
                if ($global.hasClass(node, 'bullet') && node.dataset.type === 'num-index') {
                    let start = parseInt(node.dataset.start);
                    // let textContent = `[${start}] ` + node.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
                    let textContent = node.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
                    let link = '', splitStr = textContent.split(/\s/);
                    if (/^[A-Z]/.test(textContent) && splitStr.length > 2) {
                        link = splitStr.slice(0,2).join(' ');
                    }
                    list.push({
                        text: `[${start}] ` + textContent,
                        link
                    })
                }
            }
        });
        return list;
    },

    /**
     * @description 目录列表
     * @param {Element} body
     */
    setCatalogues(body = null) {
        // 重新排列页面的实际位置
        /* var blockList = Array.from(body.querySelectorAll('.info-block'));
        blockList.forEach((block, index) => {
            block.dataset.vpagenum = index + 1;
        }) */

        var listArr = [];
        // 取出目录页所有容器
        var catalogueList = Array.from(body.querySelectorAll('.info-block.catalogue:not(.empty)'));
        catalogueList.forEach((container, index) => {
            // 目次页眉页脚
            this.headerFooter.push(this.parseHeaderFooter(container, index, true));
            // 目次标题
            var cataTitleEle = container.querySelector('.header-title');
            var headerTitle = '';
            if (cataTitleEle) {
                headerTitle = cataTitleEle.innerText;
            }
            // 解析目次数据
            // var pageStyle = window.getComputedStyle(container);
			var pageTop = 1417 - 55;
			var pageBottom = 1134 - 55;
			var pageLeft = $global.hasClass(container, 'left') ? 1134 : 1417;
			var pageRight = $global.hasClass(container, 'left') ? 1417 : 1134;
            let lis = {
                title: headerTitle.replace(/&nbsp;/g, ' '),
                pageIndex: index + 1,
                pageWidth: 11906,//: this.pxToinch(container.offsetWidth),
                pageHeight: 16838,//: this.pxToinch(container.offsetHeight),
                pageTop,//: this.pxToinch(parseFloat(pageStyle.paddingTop)),
                pageBottom,//: this.pxToinch(parseFloat(pageStyle.paddingBottom)),
                pageLeft,//: this.pxToinch(parseFloat(pageStyle.paddingLeft)),
                pageRight,//: this.pxToinch(parseFloat(pageStyle.paddingRight)),
                arr: []
            };

            // 目录结构体
            // 1级1.1:0 100 | 2级1.1.1:420 200 | 3级1.1.1.1:630 300 | 4级1.1.1.1.1:840 400 | 5级1.1.1.1.1.1:1050 500
            var lists = container.querySelectorAll('.fld-char');
            lists.forEach(li => {
                let levelStyle = 10, levelLeft = 0, leftChars = 0;
                let title = li.firstChild.innerText;
                if (li.firstChild.dataset) {
                    let numLens = 0;
                    if (li.firstChild.dataset.number) {
                        title = li.firstChild.dataset.number + ' ' + title;
                        // 截取文字长度
                        // title = title.slice(0,40);
                        levelStyle = li.firstChild.dataset.number.split(".").length * 10;
                        let reg = /[a-zA-Z]+/;
                        let numStr = li.firstChild.dataset.number;
                        // 去除英文字符
                        let result, startLen = 0;
                        while (result = numStr.match(reg)) {
                            leftChars = 100;
                            startLen = 1;
                            numStr = numStr.replace(result[0] + '.', '');
                        }
                        numLens = numStr.split(".").length + startLen;
                    } else {
                        // debugger
                        const hxEle = li.querySelector('.level');
                        if (hxEle) {
                            numLens = parseInt(hxEle.dataset.level);
                        }
                    }

                    switch (numLens) {
                        case 2:
                            leftChars = 100;
                            break;
                        case 3:
                            levelLeft = 420;
                            leftChars = 200;
                            break;
                        case 4:
                            levelLeft = 630;
                            leftChars = 300;
                            break;
                        case 5:
                            levelLeft = 840;
                            leftChars = 400;
                            break;
                        case 6:
                            levelLeft = 1050;
                            leftChars = 500;
                            break;
                        case 7:
                            levelLeft = 1260;
                            leftChars = 600;
                            break;
                    }
                }

                // let linkNode = body.querySelector(`[data-outlineid="${li.dataset.mk}"]`);
                // let block = $global.getParentBySelector(linkNode, 'info-block');
                // if ($global.hasClass(linkNode, 'info-block')) {
                //     block = linkNode;
                // }

                lis.arr.push({
                    title: this.replaceText(title),
                    num: li.lastChild.innerText,
                    page: li.dataset.pagenum || '1',
                    id: li.dataset.mk,
                    parentId: li.dataset.mkpid,
                    levelStyle,
                    levelLeft,
                    leftChars
                })
            });
            listArr.push(lis);
        });
        // 如果是word自动分页的则仅取第一页
        if (this.editorSetting.wordBreak && this.headerFooter.length > 1) {
            this.headerFooter = this.headerFooter.slice(0,1);
        }

        return listArr;
    },

    // 数组合并
    recursiveMerge(arrays) {
        if (arrays.length === 1) {
            return arrays[0];
        } else {
            var first = arrays[0];
            var rest = arrays.slice(1);
            return first.concat(this.recursiveMerge(rest));
        }
    },

    setNumberingXml(arrList = []) {
        let xml = { wnum: [], wabstractNum: [] };
        for (let i = 0; i < arrList.length; i++) {
            let item = arrList[i];
            let numData;
            // 列项
            if (item.cls) {
                numData = styleTrans.setBulletNum(item);
                // 层级项
            } else {
                numData = styleTrans.setLevelNum(item.numList, item.index);
            }
            xml.wnum.push(numData.lvls);
            xml.wabstractNum.push(numData.abstractNum);
        }
        return xml.wnum.join("\n") + xml.wabstractNum.join("\n");
    },
    /**
     * @description 解析页面布局
     * @param {Element} infoBlock
     * @param {int} index
     */
    parseHeaderFooter(infoBlock, index, isToc) {
        var headerText = infoBlock.dataset.no ? infoBlock.dataset.no.split(" ") : '';
        var footerText = infoBlock.dataset.pagenum || '';
        var align = 'right';
        if ($global.hasClass(infoBlock, 'left')) {
            align = 'left';
        }
        // 定义页面最后的终止线导出word后是否在页脚
        var lastNode = infoBlock.lastChild;
        var notFinished = notFinished = $global.hasClass(lastNode, 'finished') && $global.hasClass(lastNode, 'empty')

        return {
            index,
            isToc,
            header: {
                align,
                type: Array.isArray(headerText) && headerText.length > 1 ? headerText[0] : '',
                text: Array.isArray(headerText) && headerText.length > 1 ? this.replaceText(headerText[1]) : this.replaceText(headerText)
            },
            footer: {
                align,
                text: this.replaceText(footerText || ''),
                landscape: infoBlock.dataset.pagesize && infoBlock.dataset.pagesize === 'A3',
                notFinished
            }
        }
    },
    /**
     * 脚注
     * @param {Element} infoBlock
     * @param {int} index
     */
    parseFooterNote(infoBlock, index) {
        var footerNote = infoBlock.querySelector('.footnote');
        if (footerNote) {
            var arr = [];
            footerNote.querySelectorAll('p').forEach(ele => {
                let text = ele.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
                let supNode = ele.querySelector('sup');
                let data = { text };
                if (supNode) {
                    data.index = supNode.dataset.number;
                } else {
                    data.index = ele.dataset.number;
                }
                arr.push(data);
            });
            return arr;
        }
        return null;
    }
}
