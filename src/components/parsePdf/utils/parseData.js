import $global from '@/utils/global';
import { coverTemp } from './template';
const romaNumber = ['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ','Ⅺ','Ⅻ','XIII','XIV','XV','XVI','XVII','XVII','XIX','XX'];

export default {
    allPages: [],
    htmlContent: [],
    coverData: {},
    tocList: [],
    precision: 6, // 偏差精度阙值
    toHtml(pages=[], currPage=1) {
        this.allPages = pages;
        this.htmlContent = [];
        // console.log('coverTemp==>',coverTemp)
        // console.log('toXml==>',this.htmlContent, pages)
        var structIndex = 0;
        for (let i=0; i<pages.length; i++) {
            let pageNode = pages[i];
            if (pageNode.page.isCover) {
                this.htmlContent.push(this.parseCover(pageNode));
            } else if (pageNode.page.isToc) {
                this.parseToc(pageNode);
            } else {
                // this.parseStruct(pageNode, structIndex, i);
                // structIndex++;
            }
        }
        // debugger
        this.htmlContent.push(this.parseStruct(pages[12], structIndex, 12));

        console.log('this.htmlContent==>', this.htmlContent)
        return '<div class="page-container">' + this.htmlContent.join("") + '</div>';
    },

    parseCover(page) {
        // debugger
        var coverData = {};
        var section = document.createElement('div');
        section.innerHTML = coverTemp;
        // 置入元素
        const appendElement = (str, className) => {
            let container = Array.from(section.querySelectorAll(`.${className}`));
            container.forEach(ele => {
                ele.innerHTML = str;
            });
        }

        for (let i=0; i<page.nodes.length; i++) {
            let node = page.nodes[i][0];
            let splitStrs = node.str.split('|*|');
            let nodeStr = _.trimStart(splitStrs.join(''));
            let upText = nodeStr.toUpperCase();
            let wrapText = nodeStr.replace(/\s/g, '');
            if (upText.match(/\ICS/i) !== null && /^[a-zA-Z-0-9-/\s/]+/.test(upText.replace(/\s/g,'')) && !coverData.icsNumber) {
                coverData.icsNumber = wrapText.replace(/\ICS/g, '');
                appendElement(coverData.icsNumber, 'icsNumber');
                continue;
            } else if (upText.match(/\CCS/i) !== null && /^[a-zA-Z-0-9-/\s/]+/.test(upText.replace(/\s/g,'')) && !coverData.ccsNumber && coverData.icsNumber) {
                coverData.ccsNumber = wrapText.replace(/\CCS/g, '');
                appendElement(coverData.ccsNumber, 'ccsNumber');
                continue;
            } else if (/^[a-zA-Z-0-9-/\s/]+/.test(upText) && !coverData.recordNumber && !coverData.stdTitle) { // 备案号record_number
                coverData.recordNumber = upText;
                appendElement(coverData.icsNumber, 'recordNumber');
                continue;
            } else if (wrapText.slice(-2) === '标准' && /^[\u4E00-\u9FA5]+$/.test(wrapText) && !coverData.stdTitle) { // 标准抬头
                coverData.stdTitle = wrapText;
                appendElement(coverData.stdTitle, 'stdTitle');
                continue;
            } else if (/^[A-Z]+(\W)+[A-Z0-9]/.test(upText) && !coverData.stdNo) { // 标准编号
                if (splitStrs.length > 1) {
                    let newStr = [];
                    for (let i=0; i<splitStrs.length; i++) {
                        let itemStr = splitStrs[i]
                        itemStr = itemStr.replace(/\s/g, '').replace(/[\一|\-]/g, '');
                        if (itemStr !== '') {
                            newStr.push(itemStr)
                        }
                    }
                    coverData.stdSign = newStr.slice(0,1)[0];
                    appendElement(coverData.stdSign, 'stdSign');
                    coverData.stdNo = newStr.slice(1,newStr.length).join('—');
                    appendElement(coverData.stdNo, 'stdNo');
                } else {
                    coverData.stdNo = nodeStr;
                    appendElement(coverData.stdNo, 'stdNo');
                }
                continue;
            } else if (wrapText.match(/代替/i) && /^[\u4E00-\u9FA5-a-zA-Z-/— 0-9-(\d+(\.\d+)?)]+$/.test(wrapText) && coverData.stdSign && !coverData.origStdNo) { // 代替编号
                coverData.origStdNo = _.trimStart(nodeStr.replace(/代替/g, '').replace(/\-/g,'—'));//_.trimStart(wrapText.replace(/代替/g, '').replace(/\-/g,'—'));
                // coverData.origStdNo = coverData.stdSign + ' ' + origStdNo.replace(new RegExp(coverData.stdSign, 'g'),'')
                appendElement(coverData.origStdNo, 'origStdNo');
                continue;
            } else if (/[\u4E00-\u9FA5\uF900-\uFA2D]{1,}/.test(wrapText) && wrapText.match(/\发布|\实施/i) === null && !coverData.stdName) { // 标准名称
                coverData.stdName = nodeStr;
                appendElement(coverData.stdName, 'stdName');
                continue;
            } else if (/[\u4E00-\u9FA5\uF900-\uFA2D]{1,}/.test(wrapText) && wrapText.match(/\发布|\实施/i) === null && coverData.stdName) { // 标准名称
                coverData.stdName += '<br/>' + nodeStr;
                appendElement(coverData.stdName, 'stdName');
                continue;
            } else if (/^[/第0-9]+(部分)/.test(wrapText) && coverData.stdName && coverData.stdName.match(/\部分/) === null) { // 标准名称第几部分
                coverData.stdName += '<br/>' + nodeStr;
                appendElement(coverData.stdName, 'stdName');
                continue;
            } else if (!/[\u4E00-\u9FA5]/.test(upText) && !coverData.stdNameEn) { // 标准名称英文译名
                coverData.stdNameEn = nodeStr.replace(/ +/g, ' ');
                appendElement(coverData.stdNameEn, 'stdNameEn');
                continue;
            } else if (/^[/PART]+[0-9]/.test(upText.replace(/\s/g, '')) && !/[\u4E00-\u9FA5]/.test(upText) && coverData.stdNameEn && coverData.stdNameEn.toUpperCase().match(/\PART/) === null) { // 标准名称英文译名第几部分
                coverData.stdNameEn += '<br/>' + nodeStr.replace(/ +/g, ' ');;
                appendElement(coverData.stdNameEn, 'stdNameEn');
                continue;
            } else if (upText.replace(/\s/g, '').match(/\ISO\/IEC/ig) !== null && !coverData.consistentSign) { // 一致性程序
                coverData.consistentSign = nodeStr.replace(/ +/g, ' ');;
                appendElement(coverData.consistentSign, 'consistentSign');
                continue;
            } else if (!/[\u4E00-\u9FA5]/.test(upText) && coverData.consistentSign) { // 若还有英文的一致性程序
                coverData.consistentSign += '<br/>' + nodeStr.replace(/ +/g, ' ');;
                appendElement(coverData.consistentSign, 'consistentSign');
                continue;
            } else if (['MOD','IDT','NEQ'].includes(upText.slice(-4, -1)) && coverData.consistentSign) { // 若还有英文的一致性程序
                coverData.consistentSign += '<br/>' + nodeStr.replace(/ +/g, ' ');;
                appendElement(coverData.consistentSign, 'consistentSign');
                continue;
            } else if (nodeStr.match(/\发布|\实施/ig) !== null && /[0-9]/.test(nodeStr) && !coverData.stdPublishDate && !coverData.stdPerformDate) {// 发布实施日期(在一行内的)
                let splitIndex = 0; // splitStrs.indexOf('发布');
                // 找到分割位置
                for (let i=0; i<splitStrs.length; i++) {
                    let iemtStr = splitStrs[i].replace(/[\s|\-|\一]/g, '');
                    if (iemtStr !== '' && i>0) {
                        if (/^[0-9]+/.test(iemtStr)) {
                            splitIndex = i;
                            break;
                        }
                    }
                }
                // 发布时间
                coverData.stdPublishDate = $global.clearPunctuationMark(splitStrs.slice(0, splitIndex).join("").replace(/[\u4E00-\u9FA5\/\s]/g,''));
                appendElement(coverData.stdPublishDate, 'stdPublishDate');
                // 实施时间
                coverData.stdPerformDate = $global.clearPunctuationMark(splitStrs.slice(splitIndex, splitStrs.legnth).join("").replace(/[\u4E00-\u9FA5\/\s]/g,''));
                appendElement(coverData.stdPerformDate, 'stdPerformDate');
                continue;
            } else if (wrapText.substr(1).substr(-2) === '发布' && !/^[\u4E00-\u9FA5/\s/]+$/.test(wrapText) && !coverData.stdPublishDate) { // 发布日期
                coverData.stdPublishDate = $global.clearPunctuationMark(wrapText.replace(/[\u4E00-\u9FA5]/g,''));
                appendElement(coverData.stdPublishDate, 'stdPublishDate');
                continue;
            } else if (wrapText.substr(1).substr(-2) === '实施' && !/^[\u4E00-\u9FA5/\s/]+$/.test(wrapText) && !coverData.stdPerformDate) { // 实施日期
                coverData.stdPerformDate = $global.clearPunctuationMark(wrapText.replace(/[\u4E00-\u9FA5]/g,''));
                appendElement(coverData.stdPerformDate, 'stdPerformDate');
                continue;
            } else if (/\.*?\发布/.test(wrapText) && /^[\u4E00-\u9FA5]/.test(wrapText) && !coverData.releaseDepartment) { // 发布单位，包含发布字符
                coverData.releaseDepartment = $global.clearPunctuationMark(wrapText.replace(/\发布/g,''));
                appendElement(coverData.releaseDepartment, 'releaseDepartment');
                continue;
            } else if (!/\.*?\发布/.test(wrapText) && /^[\u4E00-\u9FA5]/.test(wrapText) && !coverData.releaseDepartment) {
                coverData.releaseDepartment = $global.clearPunctuationMark(wrapText);
                appendElement(coverData.releaseDepartment, 'releaseDepartment');
                continue;
            } else if (!/\.*?\发布/.test(wrapText) && /^[\u4E00-\u9FA5]/.test(wrapText) && coverData.releaseDepartment) {
                coverData.releaseDepartment += '<br/>' + $global.clearPunctuationMark(wrapText);
                appendElement(coverData.releaseDepartment, 'releaseDepartment');
                continue;
            }
        }
        // console.log('coerData====>', coverData)
        var htmlContent = section.innerHTML;
        section.remove();
        this.coverData = coverData;
        return htmlContent;
    },

    checkIsCenter(pageWidth, node) {
        const halfPos = pageWidth / 2;
        if (Math.abs(node.width/2 + node.left - halfPos) < this.precision * 2) {
            return true;
            // return Math.abs(node.left + node.width / 2 - halfPos) <= this.precision;
        }
        return false;
    },

    parseToc(page) {
        const nodes = page.nodes.slice(1, page.nodes.length-1);

        const getTocData = strArr => {
            let obj = {};
            for (let i=0; i<strArr.length; i++) {
                let str = strArr[i].replace(/\s/g,'');
                if (str === '') {
                    continue;
                }
                // debugger
                if(i === 0 && ((/^[0-9]/g.test(str) && !obj.num && i < strArr.length - 1) || str.toLowerCase() === 'l')) {
                    obj.num = str.toLowerCase() === 'l' ? '1' : str;
                } else if (/[\u4E00-\u9FA5/\s/]/.test(str) && !/^[附录]/.test(str) && !/\资料性|\规范性/.test(str)) {
                    obj.title = str;
                } else if (/^[附录]/.test(str)) {
                    obj.appendix = true;
                } else if (i === 0 && (/^[A-Z]+$/.test(str.toUpperCase()) && obj.appendix)) {
                    obj.num = str.toUpperCase();
                } else if (/[\资料性|\规范性]/.test(str) && !obj.specs && !obj.title) {
                    obj.title = str.replace(/[\(|\)]/g,'');
                    obj.appendixType = /[\资料性]/.test(str) ? 'means' : 'specs'
                } else if (i === strArr.length - 1 && (isNaN(str) || str.toLowerCase() === 'l' || romaNumber.includes(str))) {
                    obj.pageNum = str.toLowerCase() === 'l' ? '1' : str;
                }
            }
            return obj;
        }

        for (let i=0; i<nodes.length; i++) {
            let node = nodes[i][0];
            let alignCenter = this.checkIsCenter(page.page.width, node);

            if (alignCenter) {
                continue;
            }
            let splitStrs = node.str.split('|*|');
            /* let nodeStr = _.trimStart(splitStrs.join(''));
            let upText = nodeStr.toUpperCase();
            let wrapText = nodeStr.replace(/\s/g, ''); */

            let tocItem = getTocData(splitStrs);
            tocItem.id = $global.guid();
            this.tocList.push(tocItem)
            /* let tocItem = {
                id: $global.guid,
                text: splitStrs[0]
            } */

        }
        console.log('this.tocList', this.tocList)
        return this.tocList
    },

    getMinLeft(nodes=[]) {
        let minLeft = 10000;
        nodes.forEach(node => {
            let left = _.minBy(node, 'left')['left'];
            if (left < minLeft) {
                minLeft = left;
            }
        })
        return minLeft;
    },

    isKeepSide(currleft=0, minLeft=0) {
        return Math.abs(currleft - minLeft) < this.precision * 2;
    },

    getOutlineType(text='') {
        if (/^\前言/.test(text)) {
            return 1;
        } else if (/^\引言/.test(text)) {
            return 2;
        } else if (/^[0-9]+(\s范围)/.test(text) || /^[0-9]+(\s总则)/.test(text)) {
            return 3;
        } else if (/^[0-9]+(\s规范性引用文件)/.test(text)) { //术语和定义
            return 4;
        } else if (/^[0-9]+(\s术语和定义)/.test(text)) {
            return 5;
        } else if (/^\参考文献/.test(text)) {
            return 11;
        } else if (/^\索引/.test(text)) {
            return 12;
        } else if (/^\附录/.test(text) && /\规范性/.test(text)) {
            return 8;
        } else if (/^\附录/.test(text) && /\资料性/.test(text)) {
            return 9;
        }
        return 0;
    },

    parseStruct(page, structIndex = 0, pageIndex = 0, type = 0) {
        // var section = document.createElement('div');

        const nodes = page.nodes.slice(1, page.nodes.length-1);
        // debugger
        const pageWidth = page.page.width;
        const minLeft = this.getMinLeft(nodes);

        const isStruct = strArr => {
            let index = strArr.indexOf(" ");
            let wrapText = strArr.join('').replace(/\s/i,'');
            if (index > 0) {
                // debugger
                let dataIndex = strArr.slice(0, index).join("");
                let isAppendix = /^[A-Z]/.test(dataIndex.slice(0,1)) && /^[A-Z]+[\.]/.test(dataIndex);
                let isOlistIndex = !isNaN(parseInt(dataIndex));

                if (/^[0-9]+[\.]/.test(dataIndex) || isOlistIndex || isAppendix) { // /^[A-Z-0-9]/.test(dataIndex)
                    let dataStr = strArr.slice(index, strArr.legnth).join("").replace(/\s/i,'');

                    let tocItem = _.find(this.tocList, { title:dataStr });
                    if (tocItem) {
                        isAppendix = tocItem.appendix;
                    }
                    return {
                        index:dataIndex,
                        type: this.getOutlineType(strArr.join("").replace(/\s\s/g,' ')),
                        cls: isAppendix ? 'appendix-list' : 'ol-list',
                        text: dataStr
                    }
                }
            } else if (/^[0-9]+[\.]/.test(wrapText) && !isNaN(parseInt(wrapText.replace(/\./g,'')))) {
                return {
                    index: wrapText,
                    type,
                    cls: 'ol-list',
                    text: ' '
                }
            }
            return null;
        }
        const isBullet = text => {
            if (/^\一一|--|一-|-一/.test(text)) {
                return {
                    type:'line',
                    text: text.slice(2).replace(/^\-/i,'')
                };
            } else if (/^[a-z]+(\)|）)/.test(text)) {
                return {
                    type:'lower',
                    start: text.slice(0,1).toUpperCase().charCodeAt() - 65,
                    text: text.slice(2)
                };
            } else if (/^[0-9]+(\)|）)/.test(text)) {
                return {
                    type:'num',
                    start: parseInt(text.slice(0,1)) - 1,
                    text: text.slice(2)
                };
            }
            return null;
        }
        const isNotes = str => {
            return false;
        }
        // 图标题
        const isImage = (strArr, str) => {
            if (/^\图+[\0-9|\A-Z]/.test(str)) { // 图标题
                // debugger
                let numIndex = _.findIndex(strArr, s => {
                    return/^[A-Z0-9]/.test(s)
                });
                let obj = {};

                obj.text = strArr.slice(numIndex+1, strArr.length).join("").replace(/\s/g,'');//str.replace(/^\图[0-9]/i,'');
                obj.num = strArr.slice(numIndex, numIndex+1).join("");//str.split(/\s/)[0].replace(/\图/i,'');

                return obj;
            }
            return null;
        }
        // 表标题
        const isTable = (strArr, str) => {
            if (/^\表+[\0-9|\A-Z]/.test(str)) {
                let numIndex = _.findIndex(strArr, s => !isNaN(parseInt(s)));
                let obj = {};
                obj.num = strArr.slice(numIndex, numIndex + 1);
                obj.xu = str.match(/\续/i) !== null;
                obj.text = strArr.slice(numIndex + 1, strArr.length).join("").replace(/\s/g,'');
                /* obj.num = str.split(/\s/)[0].replace(/\表/i,'').replace(/\(|\（|\续|\)|\）/g,'');
                obj.xu = str.match(/\续/i) !== null
                obj.text = str.replace(/^\表[0-9]/i,'').replace(/\(|\（|\续|\)|\）/g,''); */
                return obj;
            }
            return null;
        }

        var lastStruct = null;
        const parseSection = (sections, index) => {
            // console.log('minLeft=>', minLeft)
            const htmlArr = [];

            for (let i=0; i<sections.length; i++) {
                let section = sections[i];
                // let opts = JSON.stringify(_.omit(section,['str']));
                let splitStrs = section.str.split('|*|');
                let nodeStr = _.trim(splitStrs.join(''));
                // let upText = nodeStr.toUpperCase();
                let wrapText = nodeStr.replace(/\s/g, '');

                let alignCenter = this.checkIsCenter(pageWidth, section);
                let isKeepSide = this.isKeepSide(section.left, minLeft);

                if (alignCenter && index === 0) { // 章标题
                    htmlArr.push(`<div class="header-title"><p>${nodeStr}</p></div>`);
                    continue;
                }
                // debugger
                let structData = isStruct(splitStrs);
                let bulletData = isBullet(wrapText);
                let notesData = isNotes(wrapText);
                let imageData = isImage(splitStrs, wrapText);
                let tableData = isTable(splitStrs, wrapText);
                if (tableData) {
                    if (!isKeepSide) {
                        alignCenter = true;
                    }
                }

                let continueStruct = false;
                if (structData) {
                    let firstIndexNum = structData.index.split('.')[0];
                    if (lastStruct) {
                        let lastIndexNum = lastStruct.index.split('.')[0];
                        if (isNaN(firstIndexNum) == isNaN(lastIndexNum) && (firstIndexNum === lastIndexNum || (!isNaN(firstIndexNum) && parseInt(firstIndexNum) <= parseInt(lastIndexNum)+1) )) {
                            continueStruct = true;
                        }
                    } else {
                        continueStruct = true;
                    }
                }

                if (structData && continueStruct && Math.abs(section.left - minLeft) < this.precision) {
                    htmlArr.push(`<div class="${structData.cls}" data-outlinetype="${structData.type}" data-index="${structData.index}" data-left="${section.left}">${structData.text}</div>`);
                    lastStruct = structData;
                    continue;
                } else if (bulletData) {
                    // let style = `counter-reset: lower 4`;
                    htmlArr.push(`<div class="bullet" data-level="1" data-type="${bulletData.type}" data-left="${section.left}" data-start="${bulletData.start}">${bulletData.text}</div>`);
                    continue;
                } else if (notesData) {
                } else if (imageData && alignCenter) {
                    htmlArr.push(`<p class="img-title" data-number="${imageData.num}">${imageData.text}</p>`);
                    continue;
                } else if (tableData && alignCenter) {
                    // debugger
                    htmlArr.push(`<div class="table-title" data-num="${tableData.num}" data-xu="${tableData.xu}" data-txt="${tableData.text}" data-left="${section.left}">${nodeStr}</div>`);
                    continue;
                } else if (/^\d+(\.\d+)+(\.\d+)?$/.test(wrapText) && Math.abs(section.left - minLeft) < this.precision) {
                    htmlArr.push(`<div class="ol-list" data-index="${wrapText}" data-left="${section.left}">${wrapText}</div>`);
                    lastStruct = { cls:'ol-list', index:wrapText };
                    continue;
                } else {
                    let style = isKeepSide ? '' : ' style="text-indent: 2em;"';
                    htmlArr.push(`<p${style} data-left="${section.left}">${nodeStr}</p>`);
                    continue;
                }
            }
            return htmlArr.join("");
        }
        /* console.log(this.coverData)
        debugger */
        const stdNo = this.coverData.stdSign + ' ' + this.coverData.stdNo;
        const pageAlign = Math.abs(minLeft - page.nodes[0][0]['left']) <= this.precision ? 'left' : 'right';
        const pageNum = '2';
        const htmlContentArr = [`<div class="info-block ${pageAlign}" data-no="${stdNo}" data-pagenum="${pageNum}">`];
        for (let i=0; i<nodes.length; i++) {
            // let blocks = nodes[i];
            let htmlContent = parseSection(nodes[i], i);
            // debugger
            htmlContentArr.push(htmlContent);
        }
        htmlContentArr.push('</div>')
        // console.log(htmlContentArr)
        // debugger
        // var htmlContent = section.innerHTML;
        // section.remove();
        return this.refineHtml(htmlContentArr.join(""), minLeft);
    },

    refineHtml(htmlContent='', minLeft=0) {
        const section = document.createElement('section');
        section.innerHTML = htmlContent;
        // 获取所有节点
        const pNodes = Array.from(section.querySelector('.info-block').childNodes); //.querySelectorAll('p')

        const getPrevChapter = currNode => {
            if ($global.hasClass(currNode, 'info-block') || !currNode) {
                return null;
            }
            let prevNode = currNode.previousElementSibling;
            if (prevNode && ($global.hasClass(prevNode, 'ol-list') || $global.hasClass(prevNode, 'appendix-list'))) {
                return prevNode;
            } else {
                return getPrevChapter(prevNode);
            }
        }

        var outlineType = '';
        // console.log('pNodes', pNodes)
        pNodes.forEach(node => {
            let prevNode = node.previousElementSibling;
            if (node.nodeName === 'P') {
                let wrapText = _.trim(node.textContent).replace(/\s/g,'');
                if (/^\注+(\:|\：)/.test(wrapText)) {
                    $global.addClass(node, 'zhu');
                    node.dataset.type = "zhu";
                } else if (/^\注[0-9]+(\:|\：)/.test(wrapText)) {
                    $global.addClass(node, 'zhux');
                    node.dataset.type = "zhux";
                } else if (/^\示例+(\:|\：)/.test(wrapText)) {
                    $global.addClass(node, 'example');
                    node.dataset.type = "example";
                } else if (/^\示例[0-9]+(\:|\：)/.test(wrapText)) {
                    $global.addClass(node, 'examplex');
                    node.dataset.type = "examplex";
                }

                if (!node.style.textIndent && prevNode && prevNode.nodeName === 'P') {
                    if (prevNode.style.textIndent === '2em') {
                        prevNode.innerHTML = prevNode.innerHTML + node.innerHTML;
                        node.remove();
                    }
                }
            } else if ($global.hasClass(node, 'ol-list')) {
                if (node.dataset.index && node.dataset.index.length === 1) {
                    outlineType = node.dataset.outlinetype;
                    node.dataset.outlineid = $global.guid();
                } else {
                    node.dataset.type = outlineType;
                    node.dataset.outlineid = $global.guid();
                    let prevChapter = getPrevChapter(node);
                    if (prevChapter) {
                        if (prevChapter.dataset.index.split('.').length == node.dataset.index.split('.').length) {
                            node.dataset.parentid = prevChapter.dataset.parentid;
                        } else {
                            node.dataset.parentid = prevChapter.dataset.outlineid;
                        }
                    }
                }
            } else if ($global.hasClass(node, 'bullet')) {
                let nextNode = node.nextElementSibling;
                if (nextNode) {
                    if (nextNode.nodeName === 'P' && !$global.hasClass(nextNode, 'img-title')) {
                        // debugger
                        if (parseFloat(nextNode.dataset.left) - parseFloat(node.dataset.left) >= this.precision * 4) {
                            node.innerHTML = node.innerHTML + nextNode.innerHTML;
                            nextNode.remove();
                        } else {

                            if ($global.hasClass(nextNode.nextElementSibling, 'bullet')) {
                                // debugger
                                let newBullet = document.createElement('div');
                                newBullet.className = 'bullet';
                                newBullet.dataset.type = node.dataset.type;
                                newBullet.dataset.level = node.dataset.level;
                                newBullet.dataset.start = parseInt(node.dataset.start) + 1;
                                newBullet.innerHTML = nextNode.innerHTML;
                                $global.insertAfter(newBullet, node);
                                nextNode.remove();
                            }
                        }
                    }
                }
                if (!prevNode || !$global.hasClass(prevNode, 'bullet')) {
                    node.style.counterReset = `${node.dataset.type} ${node.dataset.start}`;
                }
            }
        });

        const appendToList = node => {
            var nodes = [];
            const getNextNode = currNode => {
                let nextNode = currNode.nextElementSibling;
                if (nextNode && !$global.hasClass(nextNode, 'ol-list') && !$global.hasClass(nextNode, 'appendix-list')) {
                    nodes.push(nextNode);
                    // node.append(nextNode)
                    getNextNode(nextNode)
                }
            }
            getNextNode(node)
            return nodes;
        }

        // 段落内容置入层级项内
        pNodes.forEach(node => {
            if ($global.hasClass(node, 'ol-list') || $global.hasClass(node, 'appendix-list')) {
                let nextNodes = appendToList(node);
                nextNodes.forEach((ele, index) => {
                    if (ele.nodeName === 'P' && !ele.style.textIndent && !$global.hasClass(ele, 'img-title')) { //index === 0 && Math.abs(parseFloat(node.dataset.left) - parseFloat(ele.dataset.left)) > this.precision * 2
                        // debugger
                        node.innerHTML = node.innerHTML + ele.innerHTML;
                        ele.remove();
                    } else {
                        node.append(ele);
                    }
                })
            }
        })

        var htmlContent = section.innerHTML;
        section.remove();
        return htmlContent;
    }
}
