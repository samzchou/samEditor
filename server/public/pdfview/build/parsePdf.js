const romaNumber = ['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ','Ⅺ','Ⅻ','XIII','XIV','XV','XVI','XVII','XVII','XIX','XX'];
const threshold = 16;
// 获取文件的后缀名
function getExt(fileName="") {
    if (fileName) {
        return fileName.split('.').pop().toLowerCase();
    }
    return "";
}

// 匹配标准编号
function matchStdNo(str) {
    let matchStd = str.match(/\b[A-Z][A-Z\d\/\s—.-]+(?:—\d{4})?\b/g); // /[A-Z\d\/\-\s]+(?:[A-Za-z\d\/\-\s])*(?:[A-Za-z\d\/-]|\—)+\b/g || /\b[A-Z\d\/\s—-]+(?:\.\d+)?(?:—\d{4})?\b/g
    return matchStd;
}

function guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// 半角转全角 /^(["',.;!?<>()%]){0,}$/.test('<')
function toDBC(str) {
    var result = "";
    for (var i = 0; i < str.length; i++) {
        var code = str.charCodeAt(i);
        // 空格的特殊处理
        if (code === 32) {
            result += String.fromCharCode(12288);
        } else if (code >= 33 && code <= 126) {
            // 其他半角字符
            result += String.fromCharCode(code + 65248);
        } else {
            // 不需要转换的字符
            result += str.charAt(i);
        }
    }
    return result;
}
function halfWidthToFullWidth(str) {
    return str.replace(/[\u0020-\u007e]/g, (s) => {
        return String.fromCharCode(s.charCodeAt(0) + 0xfee0);
    });
}
// 全角转半角
function toCDB(str) {
    var result = "";
    for (var i = 0; i < str.length; i++) {
        var code = str.charCodeAt(i);
        // 全角空格的特殊处理
        if (code === 12288) {
            result += String.fromCharCode(32);
        } else if (code >= 65281 && code <= 65374) {
            // 其他全角字符（除空格外）
            result += String.fromCharCode(code - 65248);
        } else {
            // 不需要转换的字符
            result += str.charAt(i);
        }
    }
    return result;
}

function formatFileSize(fileSize) {
    if (fileSize < 1024) {
        return fileSize + 'B';
    } else if (fileSize < (1024 * 1024)) {
        var temp = fileSize / 1024;
        temp = temp.toFixed(2);
        return temp + 'KB';
    } else if (fileSize < (1024 * 1024 * 1024)) {
        var temp = fileSize / (1024 * 1024);
        temp = temp.toFixed(2);
        return temp + 'MB';
    } else {
        var temp = fileSize / (1024 * 1024 * 1024);
        temp = temp.toFixed(2);
        return temp + 'GB';
    }
}

function extractStdNumber(str) {
    const parseStdNumber = strs => {
        let lis = [];
        let numIndex = _.findIndex(strs, s => /^[1-9]/.test(s) && s.length===1);
        if (!!~numIndex) {
            lis.push(strs.slice(0,numIndex).join("").replace(/\s/g,''))
            lis.push(strs.slice(numIndex, strs.length).join("").replace(/\s/g,''))
        }
        return lis.join(" ");
    }

    var mathNumbers = str.replace(/\s/g,'').match(/[A-Z\s/0-9\./—/-]/ig);
    console.log(mathNumbers)

    let splitArrs = []
    if (mathNumbers !== null) {
        for (let i=0; i<mathNumbers.length; i++) {
            let currText = mathNumbers[i];
            let prvText = mathNumbers[i-1];
            let nextText = mathNumbers[i+1];
            if (/^[A-Z]/.test(currText)) {
                if (prvText && (/^\s/.test(prvText) || !isNaN(prvText))) {
                    splitArrs.push(i);
                }
            }
        }
        let numList = [];
        if (!splitArrs.length) {
            let numStr = parseStdNumber(mathNumbers);
            numList.push(numStr); // mathNumbers.join("").replace(/\s/g,'')
        } else {
            let startIndex = 0;
            console.log('splitArrs===>', splitArrs)
            for (let i=0; i<splitArrs.length; i++) {
                let currIndex = splitArrs[startIndex]
                let nextIndex = splitArrs[i+1] || splitArrs.length;
                let strs = mathNumbers.slice(startIndex, currIndex);
                let numStr = parseStdNumber(strs);
                numList.push(numStr);
                // numList.push(strs.join("").replace(/\s/g,''))
                startIndex = nextIndex;
            }
        }
        console.log('testTag===>', numList);
        return numList;
    }
    return [];
}


class pdf_parser {
    constructor(pdfData) {
        this.pdfData = pdfData;
        this.startPage = 1;
        // this.pdfUrl = pdfUrl;
        this.serverUrl = serverUrl || window.location.origin;
        this.coverData = {};
        this.outlineList = [];
        this.pageDatas = [];
        this.isParesing = false;

        this.applyUtilObj = {nodes:[],textes:[],keep:false};
        this.belongUtilObj = {nodes:[],textes:[],keep:false};
        this.draftUtilObj = {nodes:[],textes:[],keep:false};
        this.draftPersonObj = {nodes:[],textes:[],keep:false};
        this.reviewPersonObj = {nodes:[],textes:[],keep:false};

    }

    init(callBack) {
        onLoading('开始解析文档，请等候完成...');
        this.isParesing = true;
        this.callBack = callBack;
        
        const parsePage = async (pageIndex) => {
            if (pageIndex <= PDFViewerApplication.pagesCount ) {
                PDFViewerApplication.page = pageIndex;
                const precent = Math.floor((pageIndex/PDFViewerApplication.pagesCount)*100) + '%';
                onLoading(`正在处理第 ${pageIndex} 页，共 ${PDFViewerApplication.pagesCount} 页，完成：${precent}`);
                let waited = await sleep(500);
                if (waited) {
                    let page = document.body.querySelector(`.page[data-page-number="${pageIndex}"]>.textLayer`);
                    removeWaterMask(page);
                    let pageData = await this.extractStructData(page);
                    if (pageData) {
                        pageData.pageIndex = pageIndex;
                        this.pageDatas.push(pageData);
                        parsePage(pageIndex + 1);
                    }
                }
            } else {
                // 提取第一页的封面信息
                this.coverData = await this.parseCoverData(this.pageDatas[0]['nodes']);
                // 定义大纲结构
                this.outlineList = await this.getOutlineData(); // 从左侧栏的大纲中获取基本信息
                // 大纲解析起始页
                this.startPage = await this.getOutlineStartPage(this.pageDatas);
                // 解析大纲结构
                let structOutline = this.parseOutlineData(this.startPage);
                structOutline = _.sortBy(structOutline, ['type','pageIndex']);
                // structOutline = _.sortBy(structOutline, ['pageIndex']);
                this.outlineList = this.outlineList.concat(structOutline);
                // 提取文档中的表格数据
                // let tableData = await this.parseTableData();
                // 提取文档中的图片数据
                // let imgData = await this.parseImageData();

                this.isParesing = false;
                onLoading();

                callBack && callBack({
                    pageData: this.pageDatas,
                    outline: this.outlineList,
                    // tableData,
                    coverData: this.coverData,
                })
            }
        }
        parsePage(1);
    }

    async getOutlineStartPage(pageDatas) {
        let index = 0;
        for (let page of pageDatas) {
            let minLeft = page.minLeft;
            let isBreak;
            for (let node of page.nodes) {
                let wrapText = (node.wrapText || node.text).replace(/\s/g,'');
                wrapText = toCDB(wrapText);
                if (node.left - minLeft > 14 * 4 && ['前言','引言'].includes(wrapText)) {
                    isBreak = true;
                    break;
                }
            }
            if (isBreak) {
                return index;
            } else {
                index++;
            }
        }
        return 0;
    }

    // 解析标准文档封面
    async parseCoverData(nodes=[]) {
        // 获取标准类型
        const getStdKind = str => {
            if (str.match(/\国家标准/) !== null) {
                return 1100;
            } else if (str.match(/\行业标准/) !== null) {
                return 1200;
            } else if (str.match(/\地方标准/) !== null) {
                return 6;
            } else if (str.match(/\团体标准/) !== null) {
                return 1500;
            } else if (str.match(/\指导性/) !== null) {
                return 7;
            } else {
                return 1400;
            }
        }
        // 清除标点符号等
        const clearPunctuationMark = str => {
            return str.replace(/[`:_.~!@#$%^&*() \+ =<>?"{}|, \/ ;' \\ [ \] ·~！@#￥%……&*（）—— \+ ={}|《》？：“”【】、；‘’，。、]/g,"");
        }
        var coverData = {};
        var continueZhName = false, continueEnName = false;
        for (let i=0; i<nodes.length; i++) {
            let node = nodes[i];
            let textContent = node.wrapText || node.text;
            let wrapText = toCDB(textContent);
            let upText = wrapText.replace(/\s/g, '');
            if (node.src || !upText) { // 图片
                continue;
            }
            
            if (upText.match(/\ICS/i) !== null && /^[A-Z-0-9-/\s/]+/.test(upText.toUpperCase()) && !coverData.icsNumber && upText.replace(/\ICS/g, '')!=='') { //ICS
                coverData.icsNumber = upText.replace(/\ICS/g, '');
                continue;
            } else if (upText.match(/\CCS/i) !== null && /^[A-Z-0-9-/\s/]+/.test(upText.toUpperCase()) && !coverData.stdNameEn && !coverData.ccsNumber && upText.replace(/\CCS/g, '')!=='') { // CCS
                coverData.ccsNumber = upText.replace(/\CCS/g, '');
                continue;
            } else if (/^\备案号/.test(upText) && !coverData.recordNumber) { // 备案号record_number
                coverData.recordNumber = upText.replace(/\备案号|\：|\:/g,'');
                continue;
            } else if (upText.slice(-2) === '标准' && /^[\u4E00-\u9FA5]+$/.test(upText) && !coverData.stdTitle) { // 标准抬头
                coverData.stdTitle = upText;
                if (upText.match(/\中华|\人民|\共和国/g) !== null && !coverData.stdSign) {
                    coverData.stdSign = 'GB/T';
                }
                continue;
            } else if (matchStdNo(upText) && !coverData.stdNo) { // 标准编号  && upText !== this.stdSign
                let linkMatchs = matchStdNo(upText);
                let strs = linkMatchs[0].match(/^([A-Za-z\/]+)((?:—|–|-|\d)+)$/) || linkMatchs[0].match(/^([A-Za-z\/]+)(\d{5}—\d{4})$/) || linkMatchs[0].match(/([A-Z\/-]+)([A-Z\d-]+)/);
                if (!strs || strs.length < 3 || !/^[A-Z\/\s]*[A-Z\/][A-Z\/\s]*$/.test(strs[1])) {
                    continue;
                }
                let str = strs[1] + ' ' + strs[2];
                if (!/^(?=.*[A-Z])(?=.*\d).+$/.test(str)) {
                    continue
                }
                coverData.fullStdNo = str;
                if (!coverData.stdSign) {
                    coverData.stdSign = strs[1];
                    coverData.stdNo = strs[2];
                }
                continue;
            } else if (upText.match(/^代替/i) && /^[\u4E00-\u9FA5-a-zA-Z-/— 0-9-(\d+(\.\d+)?)]+$/.test(upText) && !coverData.origStdNo) { // 代替编号
                let sText = upText.replace(/代替/g, '').trim();
                var origStdNo = [];
                sText.split(/\s/).forEach(str => {
                    if (str) {
                        origStdNo.push(str);
                    }
                });
                coverData.origStdNo = origStdNo.join(' ');
                continue;
            } else if (/[\u4E00-\u9FA5]/.test(upText) && upText.match(/\发布|\实施/i) === null && !coverData.stdName) { // 标准名称
                coverData.stdName = upText;
            } else if (/[\u4E00-\u9FA5]/.test(upText) && upText.match(/\发布|\实施/i) === null && coverData.stdName && !coverData.stdPublishDate) { // 换行的标准名称
                coverData.stdName += '\n' + upText;
            } else if (!/[\u4E00-\u9FA5]/.test(upText) && !coverData.stdNameEn) { // 英文标准名称
                if (!/^\ICS/.test(upText) && !/^\CCS/.test(upText) && upText !== this.stdSign) {
                    coverData.stdNameEn = wrapText;
                }
            } else if (!/[\u4E00-\u9FA5]/.test(upText) && coverData.stdNameEn) { // 英文标准名称
                if (!/^\ICS/.test(upText) && !/^\CCS/.test(upText)) {
                    coverData.stdNameEn += '\n' + wrapText;
                }
                continue;
            } else if (/^\(ISO/.test(upText) && !/[\u4E00-\u9FA5]/.test(upText) && !coverData.consistentSign) { // 国际程度一致性标识 && upText.slice(-4) === 'MOD)' 
                coverData.consistentSign = wrapText;
                // continue;
            } else if (!/[\u4E00-\u9FA5]/.test(upText) && coverData.consistentSign) {
                coverData.consistentSign += ' ' + wrapText;
                continue;
            } else if (upText.match(/\发布/ig) && upText.match(/\实施/ig) && !coverData.stdPublishDate && !coverData.stdPerformDate) {
                var str = upText.replace(/[^A-Z-\d.]/g, '');
                coverData.stdPublishDate = str.slice(0, str.length / 2);
                coverData.stdPerformDate = str.slice(str.length / 2, str.length);
                continue;
            } else if (upText.match(/\发布/ig) && /^\d{4}-\d{2}-\d{2}/.test(upText) && !coverData.stdPublishDate) {
                coverData.stdPublishDate = upText.replace(/[^A-Z-\d.]/g, '');
                continue;
            } else if (upText.match(/\实施/ig) && /^\d{4}-\d{2}-\d{2}/.test(upText) && !coverData.stdPerformDate) {
                coverData.stdPerformDate = upText.replace(/[^A-Z-\d.]/g, '');
                continue;
            } else if (/\.*?\发布/.test(upText) && /^[\u4E00-\u9FA5/\s/]+$/.test(upText) && !coverData.releaseDepartment) {
                coverData.releaseDepartment = upText.replace('发布','');
            }
            
        }
        
        if (coverData.stdKind && [1100,7].includes(coverData.stdKind)) {
            coverData.releaseDepartment = '国家市场监督管理总局\n国家标准化管理委员会';
        }
        return coverData;
    }

    async parseImageData() {
        onLoading('正在提取文档中的图片，请等候完成...');
        condition = {
            operation: 'getImage',
            filePath: 'pdf/' + this.stdId + '/' + this.stdId + '.pdf',
        }
        var { code, data } = await $.ajax({
            method: 'POST',
            url: this.serverUrl + '/parseDoc',
            data: JSON.stringify(condition),
            dataType: "json",
            contentType: 'application/json;charset=utf-8',
            timeout: 10 * 60 * 60
        })
        // console.log(code, data)
        onLoading();
        return data;
    }

    async parseTableData() {
        onLoading('正在提取文档中的表格，请等候完成...');
        const condition = {
            operation: 'getTable',
            filePath: this.pdfData.url,
        }
        const { code, data } = await $.ajax({
            method: 'POST',
            url: this.serverUrl + '/parseDoc',
            data: JSON.stringify(condition),
            dataType: "json",
            contentType: 'application/json;charset=utf-8',
            timeout: 5 * 60 * 1000
        });
        onLoading();
        if (code === 200 && data) {
            return data;
        } else {
            return [];
        }
    }
    
    compareOutline(currIndex, prevIndex) {
        let splitCurrIndex = currIndex.split('.').map(Number);
        let splitPrevIndex = prevIndex.split('.').map(Number);
        let maxLens = Math.max(splitCurrIndex.length, splitPrevIndex.length);
        if (splitPrevIndex.length < maxLens) {
            for(let i=0; i<maxLens; i++) {
                if (!splitPrevIndex[i]) {
                    splitPrevIndex.push(0);
                }
            }
        }
        let flag = true;
        for (var i = 0; i < maxLens; i++) {
            if (splitCurrIndex[i] === undefined || splitPrevIndex[i] === undefined) {
                // 如果一个数字数组已经比较完了，另一个数字数组还有剩余，则认为剩余的数字数组更小
                flag = false;
                break;
            } else if (splitPrevIndex[i] ===  splitCurrIndex[i] - 1) {
                flag = true;
                break;
            } else if (splitPrevIndex[i] > splitCurrIndex[i]) {
                flag = false;
                break;
            }
        }
        return flag;
    }

    // 解析大纲结构数据
    parseOutlineData(index) {
        const isStruct = (wrapText, prevOutline, isAppdenxTitle=false, appendixPrev) => {
            if (wrapText.match(/[\uff00-\uffff]/g) !== null) { // 全角转半角
                wrapText = toCDB(wrapText);
            }
            wrapText = wrapText.replace(/\s/g,'');

            // if (wrapText.includes("犃．１"))

            try {
                let obj = null;
                if (appendixPrev && /^\附录\s*/.test(wrapText)) {
                    obj = {
                        index: '',
                        isAppendix: true,
                        type: 8,
                        prev: appendixPrev,
                        cls: 'appendix-list',
                        text: '附录' + appendixPrev,
                    }
                } else if (['前言','引言','索引','参考文献'].includes(wrapText)) {
                    obj = {
                        index: '',
                        type: this.getOutlineType(wrapText),
                        cls: 'ol-list',
                        text: wrapText,
                    }
                } else if (wrapText.match(/^(?:附录\s*[A-Z]|(?:\b(?:[A-Z\d]|[A-Z]?\.\d+)+(?:\.\d+)*\b))/g) !== null) {
                    let chapaterMatchs = wrapText.match(/^(?:附录\s*[A-Z]|(?:\b(?:[A-Z\d]|[A-Z]?\.\d+)+(?:\.\d+)*\b))/g);
                    if (chapaterMatchs !== null && chapaterMatchs) {
                        let matchStr = chapaterMatchs[0];
                        if (matchStr.includes('附录')) {
                            obj = {
                                index: '',
                                isAppendix: true,
                                type: 8,
                                cls: 'appendix-list',
                                text: matchStr
                            }
                        } else {
                            let isAppendix = /^[A-Z](\.\d+)/.test(wrapText);
                            let reg = new RegExp(matchStr, 'i');
                            obj = {
                                index: matchStr,
                                type: this.getOutlineType(wrapText, isAppendix),
                                cls: isAppendix ? 'appendix-list' : 'ol-list',
                                text: wrapText.replace(reg, '')
                            }
                            if (isAppendix) {
                                obj.isAppendix = true;
                            }
                        }
                        if (obj && prevOutline && !appendixPrev) {
                            if (prevOutline.prev && obj.index && !obj.prev) {
                                obj = null;
                            } else {
                                if (!this.compareOutline(obj.index, prevOutline.index) || (obj.index === prevOutline.index) || (!isNaN(obj.index) && !isNaN(obj.text))) {
                                    obj = null;
                                }
                            }
                        }
                    }
                }
                // 判断非法章节或条款
                if (obj && obj.index && !/^(?:\d+|[A-Z])(?:\.\d+)*$/.test(obj.index)){
                    obj = null;
                }
                
                return obj;
            } catch (error) {
                console.log(wrapText, error)
                return null;
            }
        }

        const getPrevOutline = (arr, index) => {
            let outlineData = arr[index];
            if (outlineData) {
                if (outlineData.removed || [100,101].includes(outlineData.type)) { // 须过滤掉表、图编号
                    return getPrevOutline(arr, index - 1);
                } else {
                    return outlineData;
                }
            }
        }

        const excludeOutline = (arr, isAppendix) => {
            for (let i = 0; i<arr.length; i++) {
                let j = isAppendix ? 1 : 0;
                let outlineData = arr[i];
                let outlineIndex = parseInt(outlineData.index.split('.')[j]);
                let prevOutlineData = getPrevOutline(arr, i-1);
                if (prevOutlineData && !prevOutlineData.prev) {
                    let prevOutlineIndex = parseInt(prevOutlineData.index.split('.')[j]);
                    if (outlineIndex > prevOutlineIndex + 1 || outlineIndex < prevOutlineIndex) {
                        outlineData.removed = true;
                    }
                }
            }
            return arr.filter(item => !item.removed);
        }
        const outlineList = [];
        var appendixIndex = 0, infoNum = 0;
        for (let i = index; i<this.pageDatas.length; i++) {
            const pageIndex = this.pageDatas[i]['pageIndex'];
            const nodes = this.pageDatas[i]['nodes'];
            const pageMinTop = this.pageDatas[i]['minTop'];
            const pageMinLeft = this.pageDatas[i]['minLeft'];
            const pageMaxBottom = this.pageDatas[i]['maxBottom'];
            const prevOutline = getPrevOutline(outlineList, outlineList.length - 1);//outlineList.length > 1 ? outlineList[outlineList.length-1] : undefined;

            for (let j=0; j<nodes.length; j++) {
                let node = nodes[j];
                try {
                    // 页眉页脚忽略
                    if (Math.abs(node.top - pageMinTop) < 8 || Math.abs(node.top - pageMaxBottom) < 8) {
                        continue;
                    }
                    let textContent = (node.wrapText || node.text).replace(/\s/g,'');
                    /* if (textContent.includes('犃．１')) {
                        debugger
                    } */

                    textContent = toCDB(textContent);
                    let isAppenidxTitle = false, appendixPrev;
                    if (textContent && (Math.abs(node.left-pageMinLeft) < 8 || /^\附录[A-Z]$/.test(textContent) || (/^\附录\s*/.test(textContent) && textContent.length === 3) || ['前言','引言','参考文献','索引'].includes(textContent)) && textContent.match(/(…|·······|...........)[^\1]{0,}\1/g) === null) {
                        

                        // 提取章节或条款
                        if (/^\附录\s*/.test(textContent) && textContent.length === 3) {
                            appendixPrev = String.fromCharCode('A'.charCodeAt(0) + appendixIndex);
                            appendixIndex++;
                            isAppenidxTitle = true;
                        }

                        // 章节条目
                        let structData = isStruct(textContent, outlineList.length > 1 ? outlineList[outlineList.length-1] : undefined, isAppenidxTitle, appendixPrev);
                        if (structData) {
                            // if (structData.index)
                            if (structData.prev) {
                                let nextNode = nodes[j+1];
                                if (nextNode && (nextNode.wrapText||nextNode.text)) {
                                    let nextText = toCDB((nextNode.wrapText||nextNode.text).replace(/\s/g,''));
                                    if (nextText.match(/[资料性|资料性]/i) !== null) {
                                        structData.type = nextText.match(/\资料性/) !== null ? 9 : 8;
                                        nextNode = nodes[j+2];
                                        if (nextNode && nextNode.left-pageMinLeft > 100) {
                                            nextText = toCDB((nextNode.wrapText||nextNode.text).replace(/\s/g,''));
                                            structData.text = nextText
                                        }
                                    }
                                }
                            }
                            if (structData.index) {
                                let indexs = structData.index.split(".");
                                if (indexs.length && indexs.length > 1) {
                                    let lstIndex = indexs[indexs.length-1];
                                    if (lstIndex.length > 1 && isNaN(lstIndex)) {
                                        indexs[indexs.length-1] = lstIndex.slice(0,1);
                                        structData.text += lstIndex.slice(1,lstIndex.length) + structData.text;
                                        structData.index = indexs.join(".");
                                    }
                                }
                            }
                            structData.id = guid();
                            structData.pageIndex = pageIndex;
                            structData.nodeIndex = node.parentIndex || node.index;
                            structData.top = node.top;
                            structData.left = node.left;
                            structData.nodes = node.nodes;
                            structData.infoNum = infoNum;
                            outlineList.push(structData);
                            infoNum++;
                        }
                    } else if (Math.abs(node.left-pageMinLeft) > 100 && /^[\图|\表]\s*/.test(textContent) && textContent.match(/^(\图|\表)[A-Z0-9.]*/g) !== null) { // 提取表 、图序号作为大纲中一部分
                        // debugger
                        let matchStr = textContent.match(/^(\图|\表)[A-Z0-9.]*/g);
                        if (matchStr[0]) {
                            let reg = new RegExp(matchStr[0],'i');
                            let numberStr = textContent.replace(reg, '').split('单位')[0];
                            let enName = /^\图\s*/.test(matchStr[0]) ? 'imageData' : 'tableEntry';
                            let tagItem = _.find(tagList, { enName });
                            // /[\u4E00-\u9FA5]/
                            let index = matchStr[0];
                            if (!/\d+(\.\d+)?$/.test(index)) {
                                index += numberStr;//.replace(/[\u4E00-\u9FA5]/g,'');
                                numberStr = '--';
                            }
                            outlineList.push({
                                id: guid(),
                                pageIndex: pageIndex,
                                nodeIndex: node.parentIndex || node.index,
                                type: enName === 'imageData' ? 100 : 101,
                                index,
                                text: numberStr,
                                infoNum,
                                sourceText: node.wrapText || node.text,
                                top: node.top,
                                left: node.left,
                                nodes: node.nodes,
                                tag: _.pick(tagItem, ['id','parentId','enName','name'])
                            });
                            infoNum++;
                        }
                        
                    }
                } catch (error) {
                    console.log('excludeOutline error:', error);
                }
                
            }
        }
        // debugger
        var olist = excludeOutline(outlineList.filter(item => !item.isAppendix ));
        var appdixList = excludeOutline(outlineList.filter(item => item.isAppendix ), true);
        var result = [].concat(olist).concat(appdixList);
        
        return result;
    }

    /**
     * @description 校验文本是否为标准编号
     * @param {String} text 
     * @returns 
     */
    /*checkIsStdNo(text='') {
        if (this.coverData && this.coverData.stdSign && this.coverData.stdNo) {
            let stdNo = this.coverData.stdSign + this.coverData.stdNo;
            return text.replace(/\s|\-|\_|—/g,'') === stdNo.replace(/\s|\-|\_|—/g,'');
        }
        return false;
    }*/


    // 获取大纲
    async getOutlineData() {
        const outlineViewer = PDFViewerApplication.pdfOutlineViewer.container;
        const childNodes = Array.from(outlineViewer.childNodes)
        var outlineList = [];
        for (let i=0; i<childNodes.length; i++) {
            let node = childNodes[i];
            let aEle = node.querySelector('a');
            if (aEle && aEle.getAttribute('href')) {
                let destRef = JSON.parse(decodeURIComponent(aEle.getAttribute('href')).replace(/\#/g,''));
                let page = PDFViewerApplication.findController._linkService._cachedPageNumber(destRef[0]);
                let textContent = node.textContent.replace(/[^\u4E00-\u9FA5]/g,'');
                let upText = textContent.replace(/\s/g,'');
                if (!upText) {
                    continue;
                }
                if (upText === '封面' || ['目次','目录'].includes(upText)) {
                    outlineList.push({ pageIndex:i, text: upText });
                } else if (/^[\img]/.test(node.textContent)) {
                    outlineList.push({ page, text: textContent, type: this.getOutlineType(textContent, textContent === '附录') });
                }
            }
        }
        return outlineList;
    }

    // 定义章节类型
    getOutlineType(text='', isAppendix=false) {
        if (/^\前言/.test(text)) {
            return 1;
        } else if (/^\引言/.test(text)) {
            return 2;
        } else if (/^[0-9]+(范围)+$/.test(text)) {
            return 3;
        } else if (/^[0-9]+(规范性引用文件)+$/.test(text)) { //术语和定义
            return 4;
        } else if (/^[0-9]+(术语和定义)+$/.test(text)) {
            return 5;
        } else if (/^[0-9]+(名词和术语)+$/.test(text)) {
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
        return 6;
    }

    /*setOutlineStruct(node, minLeft) {
        let wrapText = (node.wrapText || node.text).replace(/\s/g,'');
        let mm = wrapText.match(/[\u4E00-\u9FA5]/i);
        if ((/^[1-9](\.\d+)/.test(wrapText) || /^[A-Z](\.\d+)/.test(wrapText)) && mm && mm.index > 0) {
            // debugger
        }
        return null;
    }*/

    // 提取结构化数据
    async extractStructData(page=null) {
        var nodes = [];
        var width = page.style && page.style.width ? page.style.width : page.offsetWidth + 'px';
        var height = page.style && page.style.height ? page.style.height : page.offsetHeight + 'px';
        var pageData = { width, height, nodes:[] };

        const getNodeData = node => {
            let nodeRect = node.getBoundingClientRect();
            let nodeStyle = window.getComputedStyle(node);
            let obj = {
                top: parseFloat(node.style.top),
                left: parseFloat(node.style.left),
                width: nodeRect.width,
                height: nodeRect.height,
                text: node.textContent,
                fontSize: nodeStyle && nodeStyle.fontSize ? nodeStyle.fontSize : ''
            }
            return obj;
        }

        const getMinTop = nodes => {
            let minTop = 10000;
            nodes.forEach((node, i) => {
                if (node.top < minTop) {
                    minTop = node.top;
                }
            })
            return minTop;
        }
        const getMinLeft = nodes => {
            let minLeft = 10000;
            nodes.forEach((node, i) => {
                if (node.left < minLeft && i>0 && i<nodes.length-1 && node.left > 30) {
                    minLeft = node.left;
                }
            })
            return minLeft;
        }
        const getMaxBottom = nodes => {
            let minBottom = 200;
            nodes.forEach((node, i) => {
                if (node.top > minBottom) {
                    minBottom = node.top;
                }
            })
            return minBottom;
        }

        const getRotation = transform => {
            const match = transform.match(/matrix\(([^\)]+)\)/);
            if (match) {
                // 解析矩阵值
                const matrixValues = match[1].split(',').map(parseFloat);
                // 计算旋转角度（弧度）
                const radians = Math.atan2(matrixValues[1], matrixValues[0]);
                // 将弧度转换为角度
                const degrees = radians * (180 / Math.PI);
              
                return degrees;
            } else {
                return 0;
            }
        }
     
        const childNodes = Array.from(page.querySelectorAll('span[role="presentation"]'));       
        for (let i=0; i<childNodes.length; i++) {
            let node = childNodes[i];
            let style = window.getComputedStyle(node);

            // 分析元素的旋转角度，一旦是旋转了角度则忽略计算
            const transform = window.getComputedStyle(node).getPropertyValue('transform');
            if (transform !== 'none' && getRotation(transform)) {
                console.log(node.textContent);
                continue;
            }
            nodes.push({
                index: i,
                ...getNodeData(node)
            })
        }
        pageData.nodes = this.sortByNodes(nodes);
        pageData.minTop = getMinTop(pageData.nodes);
        pageData.minLeft = getMinLeft(pageData.nodes);
        pageData.maxBottom = getMaxBottom(pageData.nodes);
        return pageData;
    }

    // 将英文标点替换成中文标点符号
    repSign(str) {
        let symbols = {
            "β": "B",
            ",": "，",
            "!": "！",
            "?": "？",
            ";": "；",
            "(": "（",
            ")": "）",
            "圄": "图",
            "<": "&lt;",
            ">": "&gt;",
            // '"': "&quto;",
            // "'": "&#39;",
            // "`": "&#96;",
        };

        let stack = [];
        let res = "";
        let inTag = false;

        for (let i = 0; i < str.length; i++) {
            if (str[i] === "<") {
                inTag = true;
                stack.push("<");
                res += "<";
                continue;
            }
            if (str[i] === ">") {
                inTag = false;
                stack.pop();
                res += ">";
                continue;
            }
            if (!inTag && symbols.hasOwnProperty(str[i])) {
                res += symbols[str[i]];
            } else {
                res += str[i];
            }
        }
        return res;
    }

    isBullet(wrapText) {
        // wrapText = _.trim(wrapText);
        let textStr = wrapText.replace(/\s/g,'');
        if (/^\一一|\———|\--|\一-|\-一/.test(textStr)) {
            return {
                type: 'line',
                start: '',
                style: '',
                text: textStr.replace(/^\-|\一|\——/g,'')
            };
        } else if (/^[a-z]+(\)|）)/.test(textStr)) {
            let startStr = textStr.split(/\)|）/);
            let start = startStr[0].toUpperCase();
            start = start.charCodeAt() - 65;
            let obj = {
                type:'lower',
                start,
                style: 'counter-reset:lower ' + start,
                text: _.trim(textStr.slice(2, textStr.length))
            }
            return obj;
        } else if (/^[0-9]+(\)|）)/.test(textStr)) {
            let startStr = textStr.split(/\)|）/);
            let start = startStr[0];//strArr[0].replace(/\)|\）|\s/g,'');
            start = parseInt(start);
            let obj = {
                type:'num',
                start,
                style: 'counter-reset:num ' + start,
                text: _.trim(textStr.slice(2, textStr.length))
            }
            return obj;
        }
        return null;
    }

    sortByNodes(pageNodes=[]) {
        pageNodes = _.sortBy(pageNodes, ['left']);
        pageNodes.forEach(node => {
            if (!node.merged) {
                let sameNodes = pageNodes.filter(n => { return n !== node && Math.abs(n.top - node.top) <= 10 && n.left > node.left });
                if (sameNodes.length) {
                    node.nodes = node.nodes || [];
                    sameNodes.forEach(sn => {
                        node.nodes.push(sn);
                        sn.merged = true;
                    });
                    let wrapText = [];
                    node.nodes.forEach(sn => {
                        wrapText.push(sn.text);
                    })
                    node.wrapText = node.text + wrapText.join("");
                }
                // 整理文本内容
                node.wrapText = this.repSign(node.wrapText || node.text);
                let bulletData = this.isBullet(node.wrapText);
                if (bulletData && !node.isBullet) {
                    node.isBullet = bulletData;
                }
            }
        });
        pageNodes = _.sortBy(pageNodes, ['top']).filter(node =>{  return !node.merged });
        return pageNodes;
    }
    // 提取标签
    getStdTags(str) {
        const numArr = [];
        var upText = str.replace(/\s/g,'');
        var isCDB = false;
        let tagItem = null;

        let tagStr = str;
        if (str.match(/[\uff00-\uffff]/g) !== null) {
            tagStr = toCDB(str);
            upText = tagStr.replace(/\s/g,'');
            isCDB = true;
        }

        // 匹配外链，主要为标准编号等
        var linkMatchs = matchStdNo(tagStr);
        var linkArr = [], sourceText = [];
        if (linkMatchs !== null && linkMatchs.length) {
            // debugger
            for (let i=0; i<linkMatchs.length; i++) {
                sourceText.push(isCDB ? toDBC(linkMatchs[i]) : linkMatchs[i]);
				let label = linkMatchs[i].replace(/\s+/g,' ');
                // let label = linkMatchs[i].replace(/[A-Z\d\/\-\s]+(?:[A-Za-z\d\/\-\s])*[A-Za-z\d\/-]+\b/g,'$1 $2');
				if (!/\s/.test(label)) {
                    let stdNo = linkMatchs[i].match(/^([A-Z]+\/?[A-Z]*|[A-Z]+)-?([\w-]+)$/) || linkMatchs[i].match(/([A-Z]+\/[A-Z]+)(\d+\.\d+—\d{4})/);;
					if (stdNo && stdNo.length > 2) {
						label = stdNo[1] + " " + stdNo[2];
					}
                }
                // 编号必须包含空格
                /* if (!/\s/.test(label)) {
                    continue;
                } */
                // label = label.replace(/\s+/g,' '); // 去除连续空格
                linkArr.push(label);
            }
        }
        if (linkArr.length) {
            tagItem = _.find(tagList, { enName:'link' });
            numArr.push(Object.assign(_.pick(tagItem||{}, ['id','parentId','name','enName']), { label:linkArr.join(';'), sourceText:sourceText.join(';') }))
        }

        // 匹配内链，主要为文档的条款，图表等
        var anchorArr = [];
        // 见表。。。
        var tableMatchs = upText.match(/见表[A-Z]?\d+(\.\d+)?|见表[A-Z]\.\d+(\.\d+)?|符合表[A-Z]\.\d+(\.\d+)?/g) || upText.match(/按表[A-Z]?\d+(\.\d+)?|按表[A-Z]\.\d+(\.\d+)?|符合表[A-Z]\.\d+(\.\d+)?/g);
        if (tableMatchs !== null) {
            for (let label of tableMatchs) {
                anchorArr.push(label.replace(/\见|\按|\符合/g,''));
            }
        }
        // 见图。。。
        var imgMatchs = upText.match(/见图[A-Z]?\d+(\.\d+)?|见图[A-Z]\.\d+(\.\d+)?|符合图[A-Z]\.\d+(\.\d+)?/g) || upText.match(/按图[A-Z]?\d+(\.\d+)?|按图[A-Z]\.\d+(\.\d+)?|符合图[A-Z]\.\d+(\.\d+)?/g);
        if (imgMatchs !== null) {
            for (let label of imgMatchs) {
                anchorArr.push(str.replace(/\见|\按|\符合/g,''));
            }
        }
        // 见附录。。。
        var appendixMatchs = upText.match(/见附录[A-Z]?(\.\d+(\.\d+)*)?/g);
        if (!appendixMatchs) {
            appendixMatchs = upText.match(/按附录[A-Z]?(\.\d+(\.\d+)*)?/g);
        }
        if (appendixMatchs !== null) {
            // debugger
            for (let label of appendixMatchs) {
                anchorArr.push(label.replace(/\见|\按/g,''));
            }
        }
        // 条款编号等
        var anchorMatchs = upText.match(/\b[A-Za-z\d]+(\.[A-Za-z\d]+)+\b/g);
        if (anchorMatchs && anchorMatchs.length) {
            for (let label of anchorMatchs) {
                // 须判断下是否为条款编号
                let splitStr = label.split('.');
                if (splitStr[0].length === 1 && str.slice(0, label.length) !== label) {
                    // debugger
                    // 判断前一个字符是否为见以满足内链条件
                    let viewIndex = str.indexOf(label);
                    if (!!~viewIndex && viewIndex > 1) {
                        let viewStr = str.slice(viewIndex-1, viewIndex);
                        if (['见'].includes(viewStr)) {
                            anchorArr.push(label);
                        }
                    }
                }
            }
        }
        if (anchorArr.length) {
            // debugger
            tagItem = _.find(tagList, { enName:'anchor' });
            numArr.push(Object.assign(_.pick(tagItem||{}, ['id','parentId','name','enName']), { label:anchorArr.join(';'), sourceText:str }));
        }

        // 图标题
        var imgMatchs = upText.match(/^\图[A-Z0-9](\d+)|^\图[A-Z0-9](\.\d+(\.\d+)*)?/g);
        var imgTagArr = [];
        if (imgMatchs !== null) {
            tagItem = _.find(tagList, { enName:'imageData' });
            for (let label of imgMatchs) {
                imgTagArr.push(label);
            }
            numArr.push(Object.assign(_.pick(tagItem||{}, ['id','parentId','name','enName']), { label:imgTagArr.join(';'), sourceText:str }));
        }
        //  表标题
        var tableMatchs = upText.match(/^\表[A-Z0-9](\d+)|^\表[A-Z0-9](\.\d+(\.\d+)*)?/g);
        var tableTagArr = [];
        if (tableMatchs !== null) {
            tagItem = _.find(tagList, { enName:'tableEntry' });
            for (let label of tableMatchs) {
                tableTagArr.push(label);
            }
            numArr.push(Object.assign(_.pick(tagItem||{}, ['id','parentId','name','enName']), { label:tableTagArr.join(';'), sourceText:str }));
        }
        
        return numArr;
    }

    async setApplyTag(node, upText, currPage, minLeft) {
        // upText = upText.replace(/\s/g,'');
        var wrapText = upText.replace(/\s/g,'');
        if (/由(.+?)提\s*出/g.test(upText) && this.applyUtilObj) { // 提出单位
            let applyUtil = upText.match(/由(.+?)提\s*出/);
            if (applyUtil && applyUtil[1]) {
                this.applyUtilObj.nodes.push(node);
                this.applyUtilObj.textes.push(applyUtil[1]);
                this.applyUtilObj.keep = true;

                this.belongUtilObj.keep = false;
                this.draftUtilObj.keep = false;
                this.draftPersonObj.keep = false;
                this.reviewPersonObj.keep = false;

            }
        } else if (/由(.+?)归\s*口/g.test(upText) && this.belongUtilObj) { // 归口单位 upText.match(/由(.+?)归口/) !== null
            let belongUtil = upText.match(/由(.+?)归\s*口/);
            if (belongUtil && belongUtil[1]) {
                this.belongUtilObj.nodes.push(node);
                this.belongUtilObj.textes.push(belongUtil[1].replace(/\：|\:/g,'')); // 去除括号内的字符 .replace(/\（.*?\）/g, '').replace(/\(.*?\)/g, '')
                this.belongUtilObj.keep = true;

                this.applyUtilObj.keep = false;
                this.draftUtilObj.keep = false;
                this.draftPersonObj.keep = false;
                this.reviewPersonObj.keep = false;
            }
        } else if (/起\s*草\s*单\s*位/g.test(upText) && this.draftUtilObj) { // 起草单位
            let draftUtil = upText.match(/起\s*草\s*单\s*位\s*(.+?)$/);
            if (draftUtil && draftUtil[1]) {
                this.draftUtilObj.nodes.push(node);
                this.draftUtilObj.textes.push(draftUtil[1].replace(/\：|\:/g,''));
                this.draftUtilObj.keep = true;

                this.applyUtilObj.keep = false;
                this.belongUtilObj.keep = false;
                this.draftPersonObj.keep = false;
                this.reviewPersonObj.keep = false;
            }
        } else if (/起\s*草\s*人/g.test(upText) && this.draftPersonObj) { // 起草人 upText.match(/\起草人：(.+?)$|\起草人:(.+?)$/) !== null && this.draftPersonObj
            let draftPerson = upText.match(/起\s*草\s*人\s*(.+?)$/);
            if (draftPerson && draftPerson[1]) {
                this.draftPersonObj.nodes.push(node);
                this.draftPersonObj.textes.push(draftPerson[1].replace(/\：|\:/g,''));
                this.draftPersonObj.keep = true;

                this.applyUtilObj.keep = false;
                this.belongUtilObj.keep = false;
                this.draftUtilObj.keep = false;
                this.reviewPersonObj.keep = false;
            }
        } else if (/审\s*查\s*人/g.test(upText) && this.reviewPersonObj) { // 审查人
            let reviewPerson = wrapText.match(/审\s*查\s*人\s*(.+?)$/);
            if (reviewPerson && reviewPerson[1]) {
                this.reviewPersonObj.nodes.push(node);
                this.reviewPersonObj.textes.push(reviewPerson[1].replace(/\：|\:/g,''));
                this.reviewPersonObj.keep = true;

                this.applyUtilObj.keep = false;
                this.belongUtilObj.keep = false;
                this.draftUtilObj.keep = false;
                this.draftPersonObj.keep = false;
            }
        }

        // 继续提取
        /*if(this.draftUtilObj.keep) {
            debugger
        }*/
        
        if (this.applyUtilObj && this.applyUtilObj.keep && this.applyUtilObj.nodes.length && node !== this.applyUtilObj.nodes[this.applyUtilObj.nodes.length-1]) {
            if (Math.abs(node.left - minLeft) < 8) {
                this.applyUtilObj.nodes.push(node);
                this.applyUtilObj.textes.push(upText);
            } else {
                delete this.applyUtilObj.keep;
            }
            
        } else if (this.belongUtilObj && this.belongUtilObj.keep && this.belongUtilObj.length && node !== this.belongUtilObj.nodes[this.belongUtilObj.length-1]) {
            if (Math.abs(node.left - minLeft) < 8) {
                this.belongUtilObj.nodes.push(node);
                this.belongUtilObj.textes.push(upText);
            } else {
                delete this.belongUtilObj.keep;
            }
        } else if (this.draftUtilObj && this.draftUtilObj.keep && this.draftUtilObj.nodes.length && node !== this.draftUtilObj.nodes[this.draftUtilObj.nodes.length-1]) {
			if (Math.abs(node.left - minLeft) < 8) {
                this.draftUtilObj.nodes.push(node);
                this.draftUtilObj.textes.push(upText);
            } else {
                delete this.draftUtilObj.keep;
            }
        } else if (this.draftPersonObj && this.draftPersonObj.keep && this.draftPersonObj.nodes.length && node !== this.draftPersonObj.nodes[this.draftPersonObj.nodes.length-1]) {
            if (Math.abs(node.left - minLeft) < 8) {
                this.draftPersonObj.nodes.push(node);
                this.draftPersonObj.textes.push(upText);
            } else {
                delete this.draftPersonObj.keep;
            }
        } else if (this.reviewPersonObj && this.reviewPersonObj.keep && this.reviewPersonObj.nodes.length && node !== this.reviewPersonObj.nodes[this.reviewPersonObj.nodes.length-1]) {
            if (Math.abs(node.left - minLeft) < 8) {
                this.reviewPersonObj.nodes.push(node);
                this.reviewPersonObj.textes.push(upText);
            } else {
                delete this.reviewPersonObj.keep;
            }
        }

    }

    // 提取内链外链
    matchLinkTags(textContent, outline = []) {
        var isCDB = false;
        if (textContent.match(/[\uff00-\uffff]/g) !== null) {
            isCDB = true;
        }

        var upText = toCDB(textContent);

        // 匹配外链，主要为标准编号等
        let arr = [], tagItem, outlineItem;
        var linkMatchs = matchStdNo(upText);
        if (linkMatchs && linkMatchs.length) {
            tagItem = _.find(tagList, { enName:'link' });
            // debugger
            for (let i=0; i<linkMatchs.length; i++) {
				let str = linkMatchs[i];
                // debugger
				// 编号必须包含英文大写开头且英文中间不能包含小数点且长度须大于5个字符
				if (!/^[A-Z][A-Z\d\s—\/.-]+(?:—\d{4})?$/.test(linkMatchs[i]) || /[A-Z]\.[A-Z]/.test(str) || str.length < 5 ) {
					continue;
				}
				
				let splitStrs = linkMatchs[i].match(/^([^\d]+)[-/—]?(\d.*)$/);
				// 如果字符中包含"/"则另外处理
				if (str.includes("/")) {
					splitStrs = linkMatchs[i].match(/([A-Z\d]+\/?[A-Z]*)(?:\s+|\/\s*|\s*)([\d.]+[\—\-\–\s]*[\d]+)/);
				}
                console.log('splitStrs==>', splitStrs)
                if (!splitStrs || splitStrs.length < 2) {
                    continue;
                }

				// 按匹配位置找出字符串中的实际字符
				let indexMatch = upText.match(str);
				let sourceText = textContent.slice(indexMatch.index, indexMatch.index + str.length);
                // 置入外链数组
                let label = splitStrs[1] + ' ' + splitStrs[2];
                arr.push(Object.assign(_.pick(tagItem,['parentId','enName','name']), { label, sourceText, bind:str }));
            }
        }

        // 表编号。。。
        var tableMatchs = upText.match(/(?:表\s*[A-Z\d]+(?:\.\d+)*)/g);
        if (tableMatchs !== null) {
            tagItem = _.find(tagList, { enName:'anchor' });
            // debugger
            for (let str of tableMatchs) {
                let reg1 = new RegExp(str, 'i');
                let index_1 = upText.match(reg1);
                let sourceText = textContent.slice(index_1.index,index_1.index + str.length);
                // 绑定文档中的章节、条款、图、表
                outlineItem = _.find(outline, o => { return o.index === str.replace(/\s/g,'') });
                arr.push(Object.assign(_.pick(tagItem,['parentId','enName','name']), { label:str, sourceText, bind:outlineItem ? outlineItem.id : '' }));
            }
        }
        // 图编号。。。
        var imgMatchs = upText.match(/(?:图\s*[A-Z\d]+(?:\.\d+)*)/g);
        if (imgMatchs !== null) {
            tagItem = _.find(tagList, { enName:'anchor' });
            // debugger
            for (let str of imgMatchs) {
                let reg1 = new RegExp(str, 'i');
                let index_1 = upText.match(reg1);
                if (index_1) {
                    let sourceText = textContent.slice(index_1.index,index_1.index+str.length);
                    // 绑定文档中的章节、条款、图、表
                    outlineItem = _.find(outline, o => { return o.index === str.replace(/\s/g,'') });
                    arr.push(Object.assign(_.pick(tagItem,['parentId','enName','name']), { label:str, sourceText, bind:outlineItem ? outlineItem.id : '' }));
                }
            }
        }
        
        // 附录编号。。。
        var appendixMatchs = upText.match(/(?:附录\s*[A-Z\d]+(?:\.\d+)*)/g);
        if (appendixMatchs !== null) {
            tagItem = _.find(tagList, { enName:'anchor' });
            // debugger
            for (let str of appendixMatchs) {
                let reg1 = new RegExp(str, 'i');
                let index_1 = upText.match(reg1);
                if (index_1) {
                    let sourceText = textContent.slice(index_1.index,index_1.index+str.length);
                    // 绑定文档中的章节、条款、图、表
                    outlineItem = _.find(outline, o => { return ('附录'+o.prev+o.index) === str.replace(/\s/g,'') });
                    arr.push(Object.assign(_.pick(tagItem,['parentId','enName','name']), { label:str, sourceText, bind:outlineItem ? outlineItem.id : '' }));
                }
            }
        }
        // 章节条款编号
        var anchorMatchs = upText.match(/\b[A-Za-z\d]+(\.[A-Za-z\d]+)+\b/g);
        if (anchorMatchs && anchorMatchs.length) {
            tagItem = _.find(tagList, { enName:'anchor' });
            // debugger
            for (let str of anchorMatchs) {
                // 须判断下是否为条款编号
                let splitStr = str.split('.');
                if (splitStr[0].length === 1 && upText.slice(0, str.length) !== str) {
                    // 判断前一个字符是否为见以满足内链条件
                    let viewIndex = upText.indexOf(str);
                    if (!!~viewIndex && viewIndex > 1) {
                        // 绑定文档中的章节、条款
                        outlineItem = _.find(outline, { index:str });
                        if (outlineItem) {
                            let reg1 = new RegExp(str, 'i');
                            let index_1 = upText.match(reg1);
                            if (index_1) {
                                let sourceText = textContent.slice(index_1.index,index_1.index+str.length);
                                arr.push(Object.assign(_.pick(tagItem,['parentId','enName','name']), { label:str, sourceText, bind:outlineItem.id }));
                            }
                        }
                    }
                }
            }
        }
        
        return arr;
    }

    // 提取标签
    async extractTag(pdfData={}, setTag=false, byOutline=false) {
        onLoading('正在扫描文档并提取标签数据中...');
        var tags = [];

        const setSelectedTag = async (str, tagItem, currPage, realText) => {
            str = str.replace(/\。/g,'');
            let selections = await findNodeByText({ pageIndex:currPage, text:str }) || {};
            if (!_.isEmpty(selections)) {
                let sels = [];
                for (let res of selections) {
                    res.label = str;
                    res.id = guid();
                    res.tag = Object.assign(_.pick(tagItem||{}, ['id','name','enName']), { label:realText||str, sourceText:str });
                    sels.push(res);
                }

                // selections.label = str;
                // selections.id = guid();
                // selections.tag = Object.assign(_.pick(tagItem||{}, ['id','name','enName']), { label:realText||str, sourceText:str });
                return sels;
            }
            return null;
        }
        /* const applyUtilTag = async (strs, tagItem, currPage) => {
            for (let i=0; i<strs.length; i++) {
                let str = strs[i];
                let tagData = await setSelectedTag(str, tagItem, currPage);
                if (tagData) {
                    tags.push(tagData);
                }
            }
        } */
        const setUtils = async (currPage) => {
            let tagItem, strs;
            const arr = [{
				key:'applyUtilObj',
				map:'proposeOrg'
			},{
				key:'belongUtilObj',
				map:'belongOrg'
			},{
				key:'draftUtilObj',
				map:'draftOrg'
			},{
				key:'draftPersonObj',
				map:'drafter'
			},{
				key:'reviewPersonObj',
				map:'drafter'
			}];
            for (let item of arr) {
                let mapItem = this[item.key];
                if (mapItem && mapItem.textes && mapItem.textes.length) {
                    tagItem = _.find(tagList, { enName:item.map });
                    // 拼接字符
                    let lastStr;
                    for (let i=0; i<mapItem.textes.length; i++) {
                        let nextStrs = mapItem.textes[i+1];
                        let mStr = mapItem.textes[i];
                        let lastSymbol = /\、|\；|;|\。/.test(mStr.slice(-1));
                        let realText;
                        strs = mStr.split(/[、，；;]/);
                        for (let j =0; j<strs.length; j++) {
                            let str = strs[j];
							if (str.replace(/\s/g,'') === '') {
								continue;
							}
                            if (j === 0 && lastStr) {
                                realText = lastStr + str;
                            } else if (j === strs.length-1 && !lastSymbol && nextStrs) {
                                lastStr = str;
                                let nextStr = nextStrs.split(/[、，；;]/);
                                realText = str + nextStr[0];
                            } else {
                                lastStr = undefined;
								realText = undefined;
                            }
                            str = str.replace(/[a-zA-Z0-9\/\(\)]/g,'').replace(/\([^()]*\)/g, '').trim();
                            let tagDatas = await setSelectedTag(str, tagItem, currPage, realText);
                            if (!_.isEmpty(tagDatas)) {
                                for (let tagData of tagDatas) {
                                    tagData.realText = realText||'';
                                    tags.push(tagData);
                                }
                            }
                            /*if (tagData) {
                                tagData.realText = realText||'';
                                tags.push(tagData);
                            }*/
                        }
                    }
                }
            }
        }

        var completedUtil = false;
        const setNodeTag = async (pageData, currPage, isFirst=false) => {
            onLoading(`提取第 ${currPage} 页标签数据，共 ${PDFViewerApplication.pagesCount} 页`);
            // 设置单位等标签
            if (!isFirst && !completedUtil) {
                await setUtils(currPage - 1);
                completedUtil = true;
            }
           
            if (currPage !== PDFViewerApplication.page) {
                PDFViewerApplication.page = currPage;
                await sleep(300);
            }
            const minLeft = pageData.minLeft;
            const nodes = _.sortBy(pageData.nodes, ['top','left']);

            for (let i=0; i<nodes.length; i++) {
                let node = nodes[i];
                if (Math.abs(node.top - pageData.minTop) < 8) {
                    continue;
                }

                let textContent = node.wrapText||node.text;
                let upText = toCDB(textContent);
                // 提取单位等标签
                if (isFirst) {
                    await this.setApplyTag(node, upText, currPage, minLeft);
                }

                let otherTag = this.matchLinkTags(textContent, pdfData.outline||[]);
                if (otherTag && otherTag.length && node.top > 90) {
                    for (let tagData of otherTag) {
						// 计算匹配字符在文档中的实际位置
                        let selections = await findNodeByText({ pageIndex:currPage, text:tagData['sourceText'] }, true) || {};
                        // debugger
                        if (!_.isEmpty(selections)) {
                            for (let res of selections) {
                                res.label = tagData.label;
                                res.id = guid();
                                res.bind = tagData.bind;
                                res.tag = _.omit(tagData, ['bind']);
                                tags.push(res);
                            }

                            /*selections.label = tagData.label;
                            selections.id = guid();
                            selections.bind = tagData.bind;
                            selections.tag = _.omit(tagData, ['bind']);
                            tags.push(selections);*/
                        }
                    }
                }
            }
        }
        this.startPage = await this.getOutlineStartPage(pdfData.pageData);
        for (let i=this.startPage; i<pdfData.pageData.length; i++) {
            let page = pdfData.pageData[i];
            await setNodeTag(page, i+1, i===this.startPage);
        }
        // console.log('tags=========>',tags)
        onLoading();
        return tags;
    }
}




