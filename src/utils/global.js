/* eslint-disable */
/**
 * @module
 * @desc 全局通用方法封装处理
 * @author sam.shen 2021-06-02
 */
import { v4 } from "uuid";
import $storage from 'good-storage';

export default {
    sleep(ms) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(true);
            }, ms)
        });
    },
    setStroage(name, data, isLocal=false) {
        if (isLocal) {
            $storage.set(name, data);
        } else {
            $storage.session.set(name, data);
        }

    },
    getStroage(name, isLocal=false) {
        if (isLocal) {
            return $storage.get(name);
        } else {
            return $storage.session.get(name);
        }
    },
    clearStroage(name, isLocal=false) {
        if (isLocal) {
            $storage.remove(name);
        } else {
            $storage.session.remove(name);
        }
    },

    getDateStr() {
        var date = new Date();
        return date.getFullYear().toString() + '/' + (date.getMonth() + 1).toString() + '/' + date.getDate().toString();
    },
    isMobile() {
        var userAgentInfo = navigator.userAgent;
        var isPhone = /mobile/i.test(userAgentInfo);
        return isPhone;
    },
    // 判断是否为markdown内容
    isMarkdown(text) {
        // 检查是否包含 Markdown 标题
        const hasHeading = /^(#{1,6}\s.+)/m.test(text);
        // 检查是否包含 Markdown 列表
        const hasList = /^(-|\+|\*|\d+\.)\s/.test(text);
        // 检查是否包含 Markdown 链接或图片
        const hasLinkOrImage = /!\[.*?\]\(.*?\)|\[(.*?)\]\(.*?\)/.test(text);
        // 检查是否包含 Markdown 代码块
        const hasCodeBlock = /```/.test(text);

        return hasHeading || hasList || hasLinkOrImage || hasCodeBlock;
    },

    createCssLink(cssName="", id="editor-css") {
        const link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.id = id;
        link.href = cssName;
        document.head.appendChild(link)
    },
    removeCssLink(id="editor-css") {
        const linkList = document.querySelectorAll(`#${id}`);
        for(let i=0; i<linkList.length; i++) {
            linkList[i].parentNode.removeChild(linkList[i]);
        }
    },

    findStrPosition(str, queryStr) {
        var x = str.indexOf(queryStr);
        for (let i=0; i <queryStr.length; i++) {
            x = str.indexOf(queryStr, x + 1)
        }
        return {
            start: x,
            end: x + queryStr.length
        };
    },
    // 标准编号分割，取出顺序号
    getStdNoSerialNumber(str="") {
        var splitNo = str.split(".");
        str = splitNo[splitNo.length - 1];
        splitNo = str.split("—");
        return splitNo[0];
    },
    // 标准编号分割，取出三部分
    getStdNameSerialName(str="", isEn=false) {
        var arr = [];
        str = str.replace(/\s/g,'');
        if(!isEn) {
            if (str.match(/\第/i) !== null && str.match(/\部分/i)!==null && (str.match(/\：/i)!==null || str.match(/\:/i)!==null)) {
                var startIndex = str.indexOf('第');
                var endIndex = str.indexOf('部分');
                var numStr = str.substring(startIndex, endIndex+3);
                arr.push(numStr);
                var strSplit = str.split(numStr);
                arr.unshift(strSplit[0]);
                arr.push(strSplit[1]);
            }
        } else {
            if (str.match(/(\Part|\part)/i) !== null && (str.match(/\：/i)!==null || str.match(/\:/i)!==null)) {
                var startIndex = str.match(/\Part/i) !== null ? str.indexOf('Part') : str.indexOf('part');
                var endIndex = str.match(/\：/i) !== null ? str.indexOf('：') : str.indexOf(':');
                var numStr = str.substring(startIndex, endIndex+1);
                arr.push(numStr);
                var strSplit = str.split(numStr);
                arr.unshift(strSplit[0]);
                arr.push(strSplit[1]);
            }
        }

        return arr;
    },

    isLastNode(ele) {
        var allChildNodes = ele.parentElement.childNodes;
        for (let i=0; i<allChildNodes.length; i++) {
            let node = allChildNodes[i];
            if (node === ele && i === allChildNodes.length -1) {
                return true;
            }
        }
        return false;
    },

    getElementHeight(ele) {
        var height = ele.offsetHeight;
        // var container = document.createElement('div');
        var cloneEle = ele.cloneNode(true);
        document.body.appendChild(cloneEle);
        height = cloneEle.offsetHeight;
        cloneEle.remove();
        return height;
    },

    // 获取容器中所有的子孙节点, textNode
    getAllChilNodes(conatiner=null) {
        var list = [];
        var getChild = (node) => {
            let childs = node.childNodes;
            if (childs.length) {
                childs.forEach(ele => {
                    getChild(ele);
                })
            } else {
                list.push(node);
            }
        }
        getChild(conatiner);

        return list;
    },
    // 去除HTML标签
    removeHTMLTag(str) {
        str = str.replace(/<\/?[^>]*>/g, '');                                                   // 去除HTML tag
        str = str.replace(/[ | ]*\n/g, '\n');                                                   // 去除行尾空白
        str = str.replace(/\n[\s| | ]*\r/g,'\n');                                               // 去除多余空行
        str = str.replace(/ /ig, '');                                                           // 去掉空格
        const arrEntities = { 'lt': '<', 'gt': '>', 'nbsp': ' ', 'amp': '&', 'quot': '"' };     // 转义符换成普通字符
        str = str.replace(/&(lt|gt|nbsp|amp|quot);/ig, function(all, t) {
            return arrEntities[t] ;
        });
        return str;
    },

    /**
     * @description 比较2个字符串不同
     * @params {String} str1
     * @params {String} str2
     */
    compareStrings(str1='', str2='', separator='$') {
        const hasElement = (arr, ele) => {
            var hasItem1 = false;
            for(var i2=0; i2 < arr.length; i2++){
                var item2 = arr[i2] || "";
                if(!item2){
                    continue;
                }
                if(ele == item2){
                    hasItem1 = true;
                    break;
                }
            }
            return hasItem1;
        }

        const inAnotB = (a, b) => {
            var res = [];
            for(var i1=0; i1 < a.length; i1++){
                var item1 = a[i1] || "";
                if(!item1){
                    continue;
                }
                var hasItem1 = hasElement(b, item1);
                if(!hasItem1){
                    res.push(item1);
                }
            }
            return res;
        }

        const stringBuf = (d1, d2) => {
            var res = d1.slice(0);
            res = res.concat(d2);
            return res.join(separator);
        }

        var list1 = str1.split(",");
        var list2 = str2.split(",");
        //
        var diff1 = inAnotB(list1, list2);
        var diff2 = inAnotB(list2, list1);

        var result = {
            diff1,
            diff2,
            separator,
            toString : stringBuf(diff1, diff2)
        }
        return result;
    },

    /**
     * @description 设置编辑器配置信息
     * @params {Object} cfg 数据
     */
    setTinymceConfig(cfg={}) {
        $storage.session.set('tinymceConfig', cfg);
    },
    // 获取编辑器配置信息
    getTinymceConfig() {
        return $storage.session.get('tinymceConfig') || {};
    },

    //去掉所有的html标记
    delHtmlTag(str='') {
        return str ? str.replace(/<[^>]+>/g,"") : '';
    },

    /**
     * @description 清理无用的字段
     * @params {Object} data 数据对象
     * @params {Array} filter 无用的字段
     */
    clearDataByField(data={}, filter=[]) {
        var obj = {};
        for(let key in data) {
            if(!filter.includes(key)) {
                obj[key] = data[key];
            }
        }
        return obj;
    },
    // 在容器中按位置插入DOM
    insertElementByIndex(container, ele, index=0) {
        var childNodes = container.childNodes;
        var allLens = childNodes.length;
        if(index === allLens) {
            this.insertAfter(ele, childNodes[allLens - 1]);
        } else {
            childNodes.forEach((node, i) => {
                if(i === index) {
                    container.insertBefore(ele, node);
                }
            })
        }
    },

    // 计算页面的空间
    calcBLockSpaceHeight(block=null) {
        var blockStyle = window.getComputedStyle(block);
        var blockHeight = Math.floor(block.offsetHeight - Math.ceil(parseFloat(blockStyle.paddingTop)) - Math.ceil(parseFloat(blockStyle.paddingBottom)));
        var blockWidth = Math.floor(block.offsetWidth - Math.ceil(parseFloat(blockStyle.paddingLeft)) - Math.ceil(parseFloat(blockStyle.paddingRight)));
        var allHeight = 0;

        // 如果有脚注须减去脚注容器的高度
        var footNote = block.querySelector('.footnote');
        if (footNote) {
            blockHeight -= footNote.offsetHeight;
        }

        var childNodes = Array.from(block.childNodes);
        for(let i=0; i<childNodes.length; i++) {
            let node = childNodes[i];
            if (['#text','BR','HR'].includes(node.nodeName)) {
                continue;
            }
            let nodeStyle = window.getComputedStyle(node);
            if(!/^(#text|BR)$/.test(node.nodeName) && !this.hasClass(node, 'footnote')) {
                allHeight += node.offsetHeight + Math.ceil(parseFloat(nodeStyle.marginTop)) + Math.ceil(parseFloat(nodeStyle.marginBottom));
                // 当超出实际的页面高度,须额外增加页面并跳出循环
                if(allHeight > blockHeight) {
                    break;
                }
            }
        }
        return {
            blockHeight,
            allHeight
        }
    },

    /**
     * @description 获取元素定义的属性值
     * @params {Element} ele 元素对象
     * @params {String} selector 样式名称或属性
     * @params {String} key 属性名称
     */
    getElePropertyValue(ele, selector, key) {
        return window.getComputedStyle(ele, selector).getPropertyValue(key);
    },

    /**
     * @description 立项类型
     * @params {String} type 属性名称
     */
    nextBulletType(type) {
		switch(type) {
			case 'circle':
				return 'num';
			case 'num':
				return 'lower';
			case 'lower':
				return 'line';
			case 'line':
				return 'hollow-circle';
			case 'hollow-circle':
				return 'square';
			case 'square':
				return 'hollow-square';
			case 'hollow-square':
				return 'circle';
		}
	},

    /**
     * @description 过滤掉本身节点后的相同节点组
     * @params {Array} nodes 节点组
     * @params {Element} currNode 本身节点
     */
    filterSameNodes(nodes=[], currNode=null) {
        var arr = [];
        nodes.forEach(ele => {
            if (ele !== currNode) {
                arr.push(ele);
            }
        });
        return arr;
    },

    /**
     * @description 获取容器内所有同类元素，并按当前的元素取出索引值index
     */
    getAllSameElementByTagName(container, ele, selector='id') {
        const allNodes = container.querySelectorAll(selector);
        var index = -1;
        for(let i=0; i<allNodes.length; i++) {
            let node = allNodes[i];
            if(node === ele) {
                index = i;
                break;
            }
        }
        return index;
    },
    /**
     * @description 按页码设定编辑器页面的基础样式
     */
    getPageClassStyle(number=1) {
        return {
            direction: number % 2 === 0 ? 'left' : '',
            style: number % 2 === 0 ? 'padding: 25mm 25mm 20mm 20mm;' : 'padding: 25mm 20mm 20mm 25mm;'
        }
    },
	// 改变DOM的标签
	changeDomTag(sourceEle=null, tagEle=null) {
		tagEle.innerHTML = sourceEle.innerHTML;
		return tagEle;
	},

	// 获取容器中第一个元素
	getFirstNodeInContainer(container=null) {
        let ele = null;
        const allElements = container.querySelectorAll(":not(.hide-list)");
        for(let i=0; i<allElements.length; i++) {
            if(!this.hasClass(allElements[i], 'mce-resizehandle') && !/^(UL|BR)$/.test(allElements[i].nodeName)) {
                ele = allElements[i];
                break;
            }
        }
        return ele;
    },

    // 递归获取容器中最后一个元素
    getLastNodeInContainer(container=null) {
        const lastElement = (ele) => {
            if(ele) {
                let lastNode = ele.lastChild;
                let childNodes = lastNode ? this.getValidateChilds(lastNode.childNodes) : [];
                if(childNodes && childNodes.length) {
                    return lastElement(lastNode);
                } else {
                    return lastNode;
                }
            }
        }
        return lastElement(container);
    },

    /**
     * @description 过滤元素集
     */
    filterNodesBySelector(nodes=[], filters=['#text','SPAN','EM','STRONG','A','BR','COLGROUP','']) {
        var data = {
            selections: [],
            filters: []
        };
        nodes.forEach(node => {
            if (!this.hasClass(node, 'footnote')) {
                if(filters.includes(node.nodeName)) {
                    data.selections.push(node);
                } else {
                    data.filters.push(node);
                }
            }
        });
        return data;
    },

    // 递归往上获取所有父节点
    getParentElement(startNode, container, selector=undefined) {
        var parentTagList = [];
        if (!startNode instanceof HTMLElement) return console.error('receive only HTMLElement');

        const getParent = node => {
            if (container !== node && 'BODY' !== node.parentElement.nodeName) {
                parentTagList.push(node.parentElement);
                getParent(node.parentElement)
            }
        }
        getParent(startNode);

        // 匹配元素CLASS
        if(selector) {
            for(let i=0; i<parentTagList.length; i++) {
                let ele = parentTagList[i];
                if(this.hasClass(ele, selector)) {
                    return ele;
                }
            }
            return null;
        }
        return parentTagList;
    },
    /**
     * @description 根据CLass类名递归查找父级对象
     */
    getParentBySelector(node, selectorName=undefined) {
        const getpNode = element => {
            if(element) {
                //创建父级节点的类数组
                let pNode = element.parentElement;
                if(pNode && (this.hasClass(pNode, selectorName) || pNode.nodeName === selectorName.toUpperCase())) {
                    return pNode;
                } else {
                    return getpNode(pNode);
                }
            }
        }
        if (this.hasClass(node, selectorName) || node.nodeName === selectorName.toUpperCase()) {
            return node;
        }

        return getpNode(node);
    },


	// 过滤非法元素
	getValidateChilds(childNodes=[]) {
        let nodes = [];
        for (let i = 0; i < childNodes.length; i++) {
            let ele = childNodes[i];
            if (!['#text', 'BR'].includes(ele.nodeName)) {
                nodes.push(ele);
            }
        }
        return nodes;
    },
	// 获取下个兄弟节点
	getNextNode(node=null) {
        if(node) {
            let nextNode = node.nextElementSibling;
            if(nextNode && !this.hasClass(nextNode, 'footnote')) {
                if(nextNode.nodeType === 3){ // 防止内联元素在ie下出现的空白节点和火狐下的空白节点
                    return nextNode.nextElementSibling;
                }
                return nextNode;
            }
        }
        return null;
	},
	getNextAllBySelector(container, currNode, selector) {
        const nextAll = Array.from(container.querySelectorAll(selector));
        const lists = [];
        let flag = false;
        for(let i=0; i<nextAll.length; i++) {
            let node = nextAll[i];
            if(!flag) {
                flag = node === currNode;
            }
            if(flag) {
                lists.push(node)
            }
        }
        return lists;
    },

	// 获取上个兄弟节点
	getPrevNode(node=null) {
        if(node) {
    		let prevNode = node.previousElementSibling;
    		if(prevNode && prevNode.nodeType === 3){
    			return prevNode.previousElementSibling;
    		}
    		return prevNode;
        }
        return null;
	},
	// 获取节点后的所有兄弟节点
	getNextAllNodes(node=null, selector=undefined, isAll=false) {
		let nextNode = this.getNextNode(node), nodeArray = [];
		while(nextNode != null){
			nodeArray.push(nextNode);
			nextNode = this.getNextNode(nextNode);
		}

		return selector ? this.findNodeBySelector(nodeArray, selector, isAll) : nodeArray;
	},
	// 获取节点前的所有兄弟节点
	getPrevAllNodes(node=null, selector=undefined, level=1) {
		let prevNode = this.getPrevNode(node), nodeArray = [];
		while(prevNode != null){
			nodeArray.push(prevNode);
			prevNode = this.getPrevNode(prevNode);
		}
		return selector ? this.findNodeBySelector(nodeArray, selector) : nodeArray;
	},
    findNodeBySelector(nodes=[], selector='', isAll=false) {
        let listNode = [];
        for(let i=0; i<nodes.length; i++) {
            if (selector.match(/data/i) && nodes[i].hasAttribute(selector)) {
                if (!isAll) {
                    return nodes[i];
                }
            } else {
                if(this.hasClass(nodes[i], selector) || nodes[i].nodeName === selector.toUpperCase()) {
                    if (isAll) {
                        listNode.push(nodes[i])
                    } else {
                        return nodes[i];
                    }
                }
            }
        }

        return isAll ? listNode : null;
    },

	/**
     * 在容器中第一个节点前插入DOM元素
     * @param {Element} ele
     * @param {Element} container
     */
    prependChild(ele=null, container=null) {
        if(container.hasChildNodes()) {
            container.insertBefore(ele, container.firstChild);
        } else {
            container.appendChild(ele);
        }
    },
    /**
     * 在当前DOM后插入DOM元素
     * @param {Element} newelement
     * @param {Element} targetelement
     */
    insertAfter(newelement=null, targetelement=null) {
        var parentelement = targetelement.parentNode;
        if (parentelement.lastChild === targetelement) {
            parentelement.appendChild(newelement);
        } else {
            parentelement.insertBefore(newelement, targetelement.nextSibling);
        }
    },

    getListSymbol(type='cricle', index=0) {
        switch(type) {
            case 'cricle':
                return '●';
            case 'hollow-circle':
                return '○';
            case 'line':
                return '——';
            case 'square':
                return '■';
            case 'hollow-square':
                return '□';
            case 'lower':
                return this.setLowerToString(index, true) + "）";
            case 'num':
                return (index + 1) + "）";
        }
    },
    setLowerToString(index=0, isToLowerCase=false) {
        let str = [];
        for (var i=0 ;i<26 ; i++){
            str.push(String.fromCharCode(i+65));
        }
        return isToLowerCase ? str[index].toLowerCase() : str[index];
    },
    isUpperCase(str) {
        for (let i = 0; i < str.length; i++) {
            const code = str.charCodeAt(i);
            if (code < 65 || code > 90) {
                return false;
            }
        }
        return true;
    },

    rgb2hex(rgb, hasPre=false) {
        if (rgb.charAt(0) == '#'){
            return rgb.replace(/#/g,'');
        }
        const zero_fill_hex = (num, digits) => {
            var s = num.toString(16);
            while (s.length < digits)
                s = "0" + s;
                return s.toUpperCase();
        }
        var ds = rgb.split(/\D+/);
        var decimal = Number(ds[1]) * 65536 + Number(ds[2]) * 256 + Number(ds[3]);
        var prev = hasPre ? '#' : '';
        return prev + zero_fill_hex(decimal, 6);
    },

    /**
     * @description 图片转base64
     */
    async convertImgBase64(imgSrc, width, height) {
        const convert = img => {
            const canvas = document.createElement("canvas");
            canvas.width = width ? width : img.width;
            canvas.height = height ? height : img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataURL = canvas.toDataURL();
            return dataURL;
        }

        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = '';
            image.src = imgSrc;

            image.onload = (evt) => {
                const url = convert(evt.target);
                resolve(url);
            }
        })
    },

    /**
     * base64 转 bolb add By:sam 2021-09-08
     * @param {Object} dataurl
     */
    dataURLtoBlob(dataurl) {
        var arr = dataurl.split(',');
        var _arr = arr[1].substring(0, arr[1].length - 2);
        var mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(_arr),
            n = bstr.length,
            u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], {
            type: mime
        });
    },
    // base64转换为file
    dataURLtoFile(dataurl='', filename = 'file') {
        var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1], bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type:mime });
    },
    dataURLtoHtml(dataurl, filename = 'file.html') {
        var arr = dataurl.split(',')
        var mime = arr[0].match(/:(.*?);/)[1]
        var suffix = mime.split('/')[1]
        var bstr = atob(arr[1])
        var n = bstr.length
        var u8arr = new Uint8Array(n)
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n)
        }
        return new File([u8arr], filename, {
            type: "text/html"
        })
    },

    // blob 图片读取
    async getImageBlob(url) {
        return new Promise((resolve, reject) => {
            var xhr  = new XMLHttpRequest();
            xhr.open("get", url, true);
            xhr.responseType = "blob";
            xhr.onload = function() {
                if (this.status == 200) {
                    resolve(this.response)
                }
            }
            xhr.send();
        })
    },
    /**
     * 将数字取整为10的倍数
     * @param {Number} num 需要取整的值
     * @param {Boolean} ceil 是否向上取整
     * @param {Number} prec 需要用0占位的数量
     */
    formatInt(num, prec = 2, ceil = true) {
        const len = String(num).length;
        if (len <= prec) { return num };
        const mult = Math.pow(10, prec);
        return ceil ?  Math.ceil(num / mult) * mult :  Math.floor(num / mult) * mult;
    },
    // 获取字符串的字节数
    getBytesFromStr(str) {
        var bytesCount = 0;
        for (var i=0; i<str.length; i++) {
            let c = str.charAt(i);
            //匹配双字节
            if (/^[\u0000-\u00ff]$/.test(c)) {
                bytesCount += 1;
            } else {
                bytesCount += 2;
            }
        }
        return bytesCount;
    },

    // 获取匹配的节点
    getMatchNode(htmlContent, nodeName='math') {
        const section = document.createElement('section');
        section.innerHTML = htmlContent;
        let arr = [];
        const getNode = node => {
            let childs = node.childNodes;
            if(childs.length) {
                for(let i=0; i<childs.length; i++) {
                    if(childs[i].nodeName === nodeName) {
                        arr.push(childs[i].outerHTML);
                    }
                    getNode(childs[i]);
                }
            }
        }
        getNode(section);
        section.remove();
        return arr;
    },
    // CM转PT
    cmTopt(num) {
        const util = 568.1818181818181;
        return Math.floor(num * util);
    },
    pxToPt(num) {
        const util = 1.3333333333333333;
        return Math.floor(num / util);
    },
    percentToNumber(str) {
        str = str.replace("%","");
        return Number(str) / 100;
    },

	getNodeIsOlList(node) {
		const checkOl = ele => {
			if(this.hasClass(ele, 'info-block')) {
				return ele.firstElementChild;
			} else {
				return checkOl(ele.parentNode);
			}
		}

		return checkOl(node);
	},

    // 向上递归查找匹配大纲的ID
    getParentNodeByOutline(dom, attrKey="outline_id") {
        const getOutLineId = (ele) => {
            const parentNode = ele.parentNode;
            if(parentNode.getAttribute(attrKey)) {
                return parentNode.getAttribute(attrKey);
            }
        }
        return getOutLineId(dom)
    },
    // 手机号校验
    mobileValidate(numberStr) {
        const reg = /^1[3456789]\d{9}$/;
        return reg.test(numberStr);
    },
    // 下划线转换驼峰
    toHump(name) {
        return name.replace(/\_(\w)/g, (all, letter) => {
            return letter.toUpperCase();
        });
    },
    // 驼峰转下划线
    toLine(name) {
      return name.replace(/([A-Z])/g,"_$1").toLowerCase();
    },
	// 分解SQL语句
	splitSql(sqlStr) {
		let fromMath = 'FROM';
		if(!sqlStr.includes(fromMath)) {
			fromMath = 'from';
		}
		return sqlStr.split(fromMath);
	},

    // 数据对象转换(驼峰<=>下划线)
    objTrans(data, toLine=false) {
        let newData = {};
        Object.keys(data).forEach(key => {
            let value = data[key];
            key = toLine ? this.toLine(key) : this.toHump(key);
            newData[key] = value;
        });
        return newData;
    },
	// 值转换
    valueTrans(data, filter=[]) {
        let newData = {};
        Object.keys(data).forEach(key => {
            let value = data[key];
            if(_.isBoolean(value) || (filter.length && filter.includes(key))) {
                value = Number(value);
            }
            newData[key] = value;
        });
        return newData;
    },
	// 日期值格式转换
	dateTrans(value, type) {
		switch(type) {
			case 'date':
				return this.formatDateTime('yyyy-MM-dd', value);
			case 'timestamp':
				return this.formatDateTime('yyyy-MM-dd hh:mm:ss', value);
			case 'time':
				return this.formatDateTime('hh:mm:ss', value);
		}
	},
    // 格式化时间 "yyyy-MM-dd hh:mm:ss"
    formatDateTime(fmt="yyyy-MM-dd hh:mm:ss", time) {
        if (arguments.length === 0 || !time) {
            return null;
        }
        var date;
        if (typeof time === 'object') {
            date = time;
        } else {
            if ((typeof time === 'string') && (/^[0-9]+$/.test(time))) {
                time = parseInt(time);
            } else if (typeof time === 'string') {
                time = time.replace(new RegExp(/-/gm), '/');
            }
            if ((typeof time === 'number') && (time.toString().length === 10)) {
                time = time * 1000;
            }
            date = new Date(time);
        }
        var o = {
            "M+" : date.getMonth()+1,                       // 月份
            "d+" : date.getDate(),                          // 日
            "h+" : date.getHours(),                         // 小时
            "m+" : date.getMinutes(),                       // 分
            "s+" : date.getSeconds(),                       // 秒
            "q+" : Math.floor((date.getMonth() + 3) / 3),   // 季度
            "S"  : date.getMilliseconds()                   // 毫秒
        };
        if(/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for(var k in o) {
            if (new RegExp("("+ k +")").test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            }
        }
        return fmt;
    },


    // 当前时间前
    dateFromNow(timestamp) {
        // 补全为13位
        var arrTimestamp = (timestamp + '').split('');
        for (var start = 0; start < 13; start++) {
            if (!arrTimestamp[start]) {
                arrTimestamp[start] = '0';
            }
        }
        timestamp = arrTimestamp.join('') * 1;
        var minute = 1000 * 60;
        var hour = minute * 60;
        var day = hour * 24;
        var halfamonth = day * 15;
        var month = day * 30;
        var now = new Date().getTime();
        var diffValue = now - timestamp;

        // 如果本地时间反而小于变量时间
        if (diffValue < 0) {
            return '不久前';
        }
        // 计算差异时间的量级
        var monthC = diffValue / month;
        var weekC = diffValue / (7 * day);
        var dayC = diffValue / day;
        var hourC = diffValue / hour;
        var minC = diffValue / minute;

        // 数值补0方法
        var zero = function (value) {
            if (value < 10) {
                return '0' + value;
            }
            return value;
        };

        // 使用
        if (monthC > 4) {
            // 超过1年，直接显示年月日
            return (function () {
                var date = new Date(timestamp);
                return date.getFullYear() + '年' + zero(date.getMonth() + 1) + '月' + zero(date.getDate()) + '日';
            })();
        } else if (monthC >= 1) {
            return parseInt(monthC) + "月前";
        } else if (weekC >= 1) {
            return parseInt(weekC) + "周前";
        } else if (dayC >= 1) {
            return parseInt(dayC) + "天前";
        } else if (hourC >= 1) {
            return parseInt(hourC) + "小时前";
        } else if (minC >= 1) {
            return parseInt(minC) + "分钟前";
        }
        return '刚刚';
    },


	// 从数组中移除元素
    removeArrByIndex(arr, index) {
        let newArr = [];
        for(let i=0; i<arr.length; i++) {
            if(i !== index) {
                newArr.push(arr[i]);
            }
        }
        return newArr;
    },
    /**
     * @description 从一维数组中获取下标值
    */
	getIndexByArr(arr, value) {
		let index = -1;
		for(let i=0; i<arr.length; i++) {
			if(arr[i] === value) {
				index = i;
				break;
			}
		}
		return index;
	},
	/**
     * @description 获取元素在父级容器中的位置下标
     * @param currEle DOM须标明 data-id
	*/
	getElementIndex(currEle, id) {
		let parentEle = currEle.parentElement;
		let childNodes = parentEle.childNodes;
		let index = -1;
		for(let i=0; i<childNodes.length; i++) {
			if(childNodes[i].dataset.id === id) {
				index = i;
				break;
			}
		}
		return index;
	},
    /**
     * @description HTML代码转义
     * @param {Object} str:html代码字符串
     * @return {s}
     */
    htmlEncodeByRegExp(str) {
        var s = "";
        if(str.length == 0) return "";
        s = str.replace(/&/g,"&amp;");
        s = s.replace(/</g,"&lt;");
        s = s.replace(/>/g,"&gt;");
        s = s.replace(/ /g,"&nbsp;");
        s = s.replace(/\'/g,"&#39;");
        s = s.replace(/\"/g,"&quot;");
        return s;
    },
    /**
     * @description HTML代码反转义
     * @param {Object} str:html代码字符串
     * @return {s}
     */
    htmlDecodeByRegExp(str) {
        var s = "";
        if(str.length == 0) return "";
        s = str.replace(/&amp;/g,"&");
        s = s.replace(/&lt;/g,"<");
        s = s.replace(/&gt;/g,">");
        s = s.replace(/&nbsp;/g," ");
        s = s.replace(/&#39;/g,"\'");
        s = s.replace(/&quot;/g,"\"");
        return s;
    },
    /**
     * @description 像素转毫米
     * @param {Int} value
     */
    pxConversionMm(value) {
        var inch = value / this.conversion_getDPI()[0];
        return inch * 25.4;
    },
    /**
     * @description 毫米转像素
     * @param {Int} value
     */
    mmConversionPx(value) {
        var inch = value/25.4;
        var c_value = inch * this.conversion_getDPI()[0];
        return c_value;
    },

    /**
     * @description 获取屏幕精度DPI
     */
    conversion_getDPI() {
        var arrDPI = new Array;
        if (window.screen.deviceXDPI) {
            arrDPI[0] = window.screen.deviceXDPI;
            arrDPI[1] = window.screen.deviceYDPI;
        } else {
            var tmpNode = document.createElement("DIV");
            tmpNode.style.cssText = "width:1in;height:1in;position:absolute;left:0px;top:0px;z-index:99;visibility:hidden";
            document.body.appendChild(tmpNode);
            arrDPI[0] = parseInt(tmpNode.offsetWidth);
            arrDPI[1] = parseInt(tmpNode.offsetHeight);
            tmpNode.remove();
        }
        return arrDPI;
    },
    /**
     * @description 正则校验英文数字下划线
     * @param {Int} value
     */
    checkValidateName(name) {
        return /^[A-Za-z0-9_]+$/.test(name);
    },

    randomDate(isMonent=false, isTime=false){
        const maxdate = new Date().getTime();
        const mindate = new Date(1970, 0, 1, 8).getTime();
        const randomdate = this.randomNumber(mindate, maxdate);
        if(isMonent) {
            if(isTime) {
                return this.formatDateTime('yyyy-MM-dd hh:mm:ss', new Date(randomdate));
            } else {
                return this.formatDateTime('yyyy-MM-dd', new Date(randomdate));
            }
        }
        return randomdate;
    },

    /**
     * @description 随机数
     * @param {number} min max
     * @return {number}
     */
    randomNumber(min=1, max=100){
        return Math.floor(Math.random() * (max - min + min) + min);
    },
    /**
     * @description 随机字符串
     * @param {number} len 任意整数值
     * @return {String}
     */
    randomString(len) {
    　　len = len || 32;
    　　var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
    　　var maxPos = $chars.length;
    　　var str = '';
    　　for (let i = 0; i < len; i++) {
    　　　　str += $chars.charAt(Math.floor(Math.random() * maxPos));
    　　}
    　　return str;
    },
    /**
     * @description 随机布尔值
     * @return {Boolean}
     */
    randomBool(){
        return Boolean(Math.round(Math.random()));
    },
    /**
     * @description 数字转英文字母
     * @return {Int}
     */
    numberToLetters(num=0) {
        let letters = '';
        while (num >= 0) {
            letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[num % 26] + letters;
            num = Math.floor(num / 26) - 1;
        }
        return letters;
    },
    /**
     * 随机ID
     * @return {Int}
     */
    generateId(){
        return Math.floor(Math.random() * 10000);
    },
    /**
     * 数组去重
     */
    uniqData(arr=[]) {
        const res = new Set(arr);
        return [...res];
    },
    /**
     * @description 根据参数递归获取数据对象
     * @param {Object} key 'id'
     * @param {String} value
     * @param {Array} arr
     */
    getChildData(key, value, arr=[]) {
        let obj = {};
        const getMenuData = listArr => {
            for(let i=0; i<listArr.length; i++) {
                let data = listArr[i];
                if (data[key] && data[key] === value) {
                    obj = data;
                    break;
                } else {
                    if (data.children) {
                        getMenuData(data.children);
                    }
                }
            }
        }
        getMenuData(arr);
        return obj;
    },
    /**
     * @description 判断是否为JSON字符串
     * @param {Object} str
     * @return {Boolean}
     */
    isJSON(str) {
        if (typeof str == 'string') {
            try {
                var obj = JSON.parse(str);
                if (typeof obj == 'object' && obj) {
                    return true;
                } else {
                    return false;
                }
            } catch (e) {
                return false;
            }
        } else {
            return false;
        }
    },
    /**
     * @description 判断字符串是否为日期
     * @param {Object} str
     * @return {Boolean}
     */
    isDate(str) {
        if (str.trim() == "") return false;
        return /^\d{4}-\d{2}-\d{2}$/.test(str);
    },
    /**
     * @description 深度比较两个对象是否相等
     * @param {Object} oldData
     * @param {Object} newData
     * @return {Boolean}
     */
    compare(oldData, newData) {
        // 类型为基本类型时,如果相同,则返回true
        // 类型为对象并且元素个数相同
        if (_.isObject(oldData) && _.isObject(newData) && Object.keys(oldData).length === Object.keys(newData).length) {
            // 遍历所有对象中所有属性,判断元素是否相同
            for (const key in oldData) {
                if (oldData.hasOwnProperty(key)) {
                    if (!this.compare(oldData[key], newData[key])) {
                        // 对象中具有不相同属性 返回false
                        return false;
                    }
                }
            }
        // 类型为数组并且数组长度相同
        } else if (_.isArray(oldData) && _.isArray(newData) && oldData.length === newData.length) {
            for (let i = 0, length = oldData.length; i < length; i++) {
                if (!this.compare(oldData[i], newData[i])) {
                    // 如果数组元素中具有不相同元素,返回false
                    return false;
                }
            }
        } else {
            // 其它类型,均返回false
            return oldData === newData;
        }
        return true;
    },
    /**
     * @description 随机产生字符串
     * @return {String} xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
     */
    guid() {
		return v4();
    },
    /**
     * 自动获取随机码
     * @param {Object} params 范围值
     * @return {String}
     */
    autoCode(params = { f: 36, e: 2 }) {
        return Math.random().toString(params.f).substr(params.e);
    },
    /**
     * @description 判断DOM对象是否有class
     * @param {Object} ele
     * @param {Object} cls
     * @return {Boolean}
     */
    hasClass(ele, cls) {
        cls = cls || '';
        if (!ele) {
            return false;
        }
        if (cls.replace(/\s/g, '').length == 0 || !ele.className) return false; //当cls没有参数时，返回false
        return new RegExp(' ' + cls + ' ').test(' ' + ele.className + ' ');
    },
    /**
     * @description DOM添加class
     * @param {Object} ele
     * @param {Object} cls
     */
    addClass(ele, cls) {
        if (!this.hasClass(ele, cls)) {
            ele.className = ele.className == '' ? cls : ele.className + ' ' + cls;
        }
    },
    /**
     * @description DOM移除class
     * @param {Object} ele
     * @param {Object} cls
     */
    removeClass(ele, cls) {
        if (this.hasClass(ele, cls)) {
            let newClass = ' ' + ele.className.replace(/[\t\r\n]/g, '') + ' ';
            while (newClass.indexOf(' ' + cls + ' ') >= 0) {
                newClass = newClass.replace(' ' + cls + ' ', ' ');
            }
            ele.className = newClass.replace(/^\s+|\s+$/g, '');
        }
    },
    /**
     * @description DOM切换class
     * @param {Object} ele
     * @param {Object} cls
     * @Action
     */
    toggleClass(ele, cls) {
        if (!this.hasClass(ele, cls)) {
            ele.className = ele.className == '' ? cls : ele.className + ' ' + cls;
        } else {
            this.removeClass(ele, cls);
        }
    },
    /**
     * @description 设置所有节点ID
     * @param {Object} ele
     * @param {Object} cls
     * @Action
     */
    setNodeId(data) {
        const setId = (obj, pid) => {
            obj.pid = pid;
            if(!obj.id) {
                obj.id = this.guid();
            }
            if(obj.children && obj.children.length) {
                obj.children = obj.children.map(item => {
                    item = setId(item, obj.id);
                    return item;
                })
            }
            return obj;
        }
        return setId(data, 0);
    },

    getChildNodes(dataList=[], params={ idKey:"id", parentKey:"pid", "children":"children" }) {
        var list = [];
        const getChild = (arr) => {
            arr.forEach(item => {
                list.push(item);
                if (item[params['children']]) {
                   getChild(item[params['children']])
                }
            })
        }
        getChild(dataList);
        return list;
    },

    /**
     * @description 递归查找父级数据
     * @param {Array} dataList 数结构的数组
     * @param {int} nodeId 节点ID
     * @param {Object} params 关键参数
     * @return {Array} 返回从父级到所有子节点的数组
     */
    getParentNode(dataList=[], nodeId='', params={ idKey:"id", parentKey:"pid", "children":"children" }) {
        let arrRes = [];
        if (dataList) {
            if (dataList.length == 0) {
                if (!!nodeId) {
                    arrRes.unshift(dataList);
                }
                return arrRes;
            }
            const rev = (data, nId) => {
                for (let i = 0; i < data.length; i++) {
                    let node = data[i];
                    if (node[params.idKey] == nId) {
                        arrRes.unshift(node);
                        rev(dataList, node[params.parentKey]);
                        break;
                    } else {
                        if (!!node[params.children]) {
                            rev(node[params.children], nId);
                        }
                    }
                }
                return arrRes;
            }
            if(!_.isEmpty(dataList) && nodeId){
                arrRes = rev(dataList, nodeId);
            }
        }

        return arrRes;
    },
    /**
     * @description 格式化文件大小
     * @param {Number} fileSize Bytes
     * @return {Number} + "..."
     */
    formatFileSize(fileSize) {
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
    },
    /**
     * @description 获取文件名后缀
     * @param {String} filename
     * @return {String}
     */
    getExt(filename="", symbol=".") {
        //console.log('filename', filename)
        if (filename && _.isString(filename)) {
            let index = filename.lastIndexOf(symbol);
            return filename.slice(index + 1);//filename.substr(index + 1);
        }

        return "";
    },
	changeNodeId(nodeData) {
		const setId = data => {
			data.id = this.guid();
			if(data.children && data.children.length){
				data.children = data.children.map(node => {
					node = setId(node);
					return node;
				})
			}
			return data;
		}
		return setId(nodeData);
	},
    /**
     * @description 构造树型结构数据
     * @param {*} data 数据源
     * @param {*} id id字段 默认 'id'
     * @param {*} parentId 父节点字段 默认 'parentId'
     * @param {*} children 孩子节点字段 默认 'children'
     * @param {*} rootId 根Id 默认 0
     */
    handleTree(data, id, parentId, children, rootId) {
        id = id || 'id';
        parentId = parentId || 'parentId';
        children = children || 'children';
        rootId = rootId || Math.min.apply(Math, data.map(item => { return item[parentId] })) || 0;
        // 对源数据深度克隆
        const cloneData = JSON.parse(JSON.stringify(data));
        // 循环所有项
        const treeData = cloneData.filter(father => {
            let branchArr = cloneData.filter(child => {
                // 返回每一项的子级数组
                return father[id] === child[parentId];
            });
            branchArr.length > 0 ? father.children = branchArr : '';
            // 返回第一层
            return father[parentId] === rootId;
        });
        return treeData != '' ? treeData : data;
    },
    /**
     * @description 递归数据成tree结构
     * @param {Array} data
     * @param {Object} opts 关键参数
     * @return {Array}
     */
    toTree(data, opts = {idKey:'id', parentKey:'pid'}) {
        if(opts.transKey){
           data.forEach(item => {
               for(let targetKey in opts.transKey){
                   let sourceKey = opts.transKey[opts.targetKey];
                   item[opts.targetKey] = item[sourceKey];
                   delete item[sourceKey];
               }
           });
        }
        data.forEach(item => {
            delete item.children;
        });
        var map = {};
        data.forEach(item => {
            map[item[opts.idKey]] = item;
        });
        var val = [];
        data.forEach(item => {
            var parent = map[item[opts.parentKey]];
            if (parent) {
                (parent.children || (parent.children = [])).push(item);
            } else {
                val.push(item);
            }
        });
        return val;
    },
	// 更新树结构中的某个节点数据
	updateTreeData(nodeData, treeData) {
		const updateData = obj => {
			if(obj.id === nodeData.id) {
				obj = nodeData;
			} else {
				if(obj.children && obj.children.length) {
					obj.children = obj.children.map(item => {
						return updateData(item);
					})
				}
			}
			return obj;
		}
		return updateData(treeData);
	},
    /**
     * @description 遍历树结构取出匹配的对象
     * @param {Int} leafId
     * @param {Array} nodes
     * @param {Object} params 关键参数
     * @return {Object}
     */
    findTreeByLeafId(leafId, nodes = [], params={key:"id"}) {
        for(let i = 0; i < nodes.length; i++) {
            if(leafId == nodes[i][params.key]) {
                return nodes[i];
                break;
            }
            if(nodes[i].children) {
                let findResult = this.findTreeByLeafId(leafId, nodes[i].children, params);
                if(findResult) {
                    return findResult;
                    break;
                }
            }
        }
    },

    findNodesByParentId(nodes, parentId) {
        let result = [];
        nodes.forEach(node => {
            if (node.parentId === parentId) {
                result.push(node);
            }
            if (node.children && node.children.length) {
                result = result.concat(this.findNodesByParentId(node.children, parentId));
            }
        });

        return result;
    },

    /**
     * @description 遍历节点结构取出所有子集对象
     * @param {Array} dataList
     * @param {Object} node
     * @param {Object} params 关键参数
     * @return {Array} 输出一维数组
     */

    findAllChildrenNode(dataList=[], node, params={key:"id", parentKey:'pid', children:"children"}, hasSelf=false) {
        var arr = [];
        if(hasSelf) {
            arr.push(node);
        }
        const getData = (data) => {
            let result = dataList.filter(item => { return item[params.parentKey] === data[params.key]; });
            arr = arr.concat(result);
            if(result && result.length) {
                for(let i=0; i<result.length; i++) {
                    getData(result[i]);
                }
            }
        }
        getData(node);
        return arr;
    },

    /**
     * @description 遍历节点结构取出匹配的对象
     * @param {Int} nodeId
     * @param {Array} nodes
     * @param {Object} params 关键参数
     */
    findNodeByNodeId(nodeId, nodes, params={key:"id",children:"children"}) {
        for(let i = 0; i < nodes.length; i++) {
            if(nodeId == nodes[i][params.key]) {
                return nodes[i];
                break;
            }
            if(nodes[i][params.children]) {
                let findResult = this.findNodeByNodeId(nodeId, nodes[i][params.children], params);
                if(findResult) {
                    return findResult;
                    break;
                }
            }
        }
    },
	// 根据KEY VALUE 获取树节点数据
	findNodeDataByKey(content={}, params={key:"id", value:"1", children:"children"}) {
		const getData = (data) => {
			if(data[params.key] === params.value) {
				return data;
			} else {
				if(data[params.children]) {
					for(let i = 0; i < data[params.children].length; i++) {
						let item = data[params.children][i];
						let findResult = getData(item);
						if(findResult) {
							return findResult;
							break;
						}
					}
				}
			}
		}
		return getData(content);
	},
	/**
     * @description 遍历节点更新数据
     * @param {Int} nodeId
     * @param {Array} nodes
     * @param {Object} params 关键参数
     */
	changeNodeById(nodeData, treeData, params={key:"id",children:"children"}) {
		const changeData = data => {
			const keyId = params.key;
			const children = params.children;
			if(data[keyId] === nodeData[keyId]) {
				data = nodeData;
			} else {
				if(data[children] && data[children].length) {
					data[children] = data[children].map(node => {
						node = changeData(node);
						return node;
					})
				}
			}
			return data;
		}
		return changeData(treeData);
	},
    /**
     * @description 递归
     * @param {Array} data 数组
     * @param {Function} filterFn 函数
     * @param {Object} opts 参数 对象中包括
     * @param {String} childrenKey 子集的key名
     * @return {Array}
     */
    recurrence(data = [], func, opts = {}) {
        var childrenKey = opts.childrenKey || 'children';
        if(!data.length) return;
        data.map(item=> {
            func && func(item);
            if(item[childrenKey] && item[childrenKey].length > 0) {
                this.recurrence(item[childrenKey], func, opts);
            }
        })
        return data;
    },
    /**
     * @description 数组分割成几个部分
     *
     */
    groupArrList(array, subLen) {
        let index = 0;
        let newArray = [];
        while(index < array.length) {
            newArray.push(array.slice(index, index += subLen));
        }
        return newArray;
    },
    /**
     * @description 递归筛选 - 结果是一纬数组
     * @param {Array} list 数组
     * @param {Function} func 函数
     * @param {*} opts 其他参数
     * @return {Array}
     */
    deepFilterToArray(list, opts = {}) {
        const childrenKey = opts.childrenKey || 'children';
        let result = [];
        const __deepFilter = (list, func) => {
			for (let idx = 0; idx < list.length; idx++) {
				let item = list[idx];
                result.push(item);
				if (item[childrenKey] && item[childrenKey].length) {
					__deepFilter(item[childrenKey]);
				}

			}
			return result;
        }
        return __deepFilter(list);
    },
	// 获取树结构的最后元素
	getLastChildNode(data) {
		let result = [];
		const getChild = item => {
			if(item.children && item.children.length ) {
				item.children.forEach(o => {
					getChild(o);
				})
			} else {
				result.push(item);
			}
		}
		getChild(data);
		return result;
	},
    /**
     * @description 小数转为百分比
     * @param {Object} point
     */
    formatPercentage(point) {
        const formated = Number(point*100).toFixed(2);
        return `${formated}%`
    },
    /**
     * @description 获取元素的坐标
     * @param {Object} obj
     */
    getObjXy(obj, win) {
        if(win) {
            document = win.document;
        }
        let xy = obj.getBoundingClientRect();
        let top = xy.top - document.documentElement.clientTop + document.documentElement.scrollTop,
            bottom = xy.bottom,
            left = xy.left - document.documentElement.clientLeft + document.documentElement.scrollLeft,
            right = xy.right,
            width = xy.width || right - left,
            height = xy.height || bottom - top;
        return {
            top: top,
            right: right,
            bottom: bottom,
            left: left,
            width: width,
            height: height
        }
    },

    getOffsetLeft(el){
        return el.offsetParent ? el.offsetLeft + this.getOffsetLeft(el.offsetParent)  : el.offsetLeft
    },

    getOffsetTop(el){
        return el.offsetParent ? el.offsetTop + this.getOffsetTop(el.offsetParent)  : el.offsetTop
    },
    // 毫秒转小时分
    changeHourMinutestr(mss) {
        const days = parseInt(mss / (1000 * 60 * 60 * 24));
        const hours = parseInt((mss % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = parseInt((mss % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = parseInt((mss % (1000 * 60)) / 1000);
        return (days>0?(days + " 天 "):'') + (hours>0?(hours + " 小时 "):'') + (minutes>0 ? (minutes + " 分钟 "):'') + seconds + " 秒 ";
    },
    /**
     * @description 获取滚动条的位置
     * @param {Object} ele
     */
    getScrollPostion(ele){
        var eleLeft = ele.offsetLeft;
        var eleTop = ele.offsetTop;
        var scrollParent = this.getScrollParent(ele);

        const getScrollTopValue = element => {
            return element == document.body ? Math.max(document.documentElement.scrollTop, document.body.scrollTop) : element.scrollTop;
        }
        const getScrollLeftValue = element => {
            return element == document.body ? Math.max(document.documentElement.scrollLeft, document.body.scrollLeft) : element.scrollLeft;
        }

        var scrollTop = getScrollTopValue(scrollParent);
        var scrollLeft = getScrollLeftValue(scrollParent);

        return {
            left: eleLeft - scrollLeft,
            top: eleTop - scrollTop
        }
    },
	formatSeconds(value) {
		let theTime = parseInt(value); // 需要转换的时间秒
		let theTime1 = 0;// 分
		let theTime2 = 0;// 小时
		let theTime3 = 0;// 天
		if(theTime > 60) {
			theTime1 = parseInt(theTime/60);
			theTime = parseInt(theTime%60);
			if(theTime1 > 60) {
				theTime2 = parseInt(theTime1/60);
				theTime1 = parseInt(theTime1%60);
				if(theTime2 > 24){
					//大于24小时
					theTime3 = parseInt(theTime2/24);
					theTime2 = parseInt(theTime2%24);
				}
			}
		}
		let result = '';
		if(theTime > 0){
			result =  parseInt(theTime) + "秒";
		}
		if(theTime1 > 0) {
			result =  parseInt(theTime1) + "分" + result;
		}
		if(theTime2 > 0) {
			result =  parseInt(theTime2) + "小时" + result;
		}
		if(theTime3 > 0) {
			result =  parseInt(theTime3) + "天" + result;
		}
		return result;
	},
    openNewWindow(url) {
        var tmpWin = window.open('', '_blank');
        tmpWin.location = url;
    },

    // 导入文件
    loadFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onerror = e => {
                resolve(false);
            };
            reader.onload = e => {
                resolve(e.target.result);
            };
        })
    },

    // 导出JSON文件
    exportJSON(data, fileName='test.json') {
        this.downloadData(JSON.stringify(data), 'application/json;charset=utf-8;', fileName);
        return data;
    },

    downloadData(data, type, filename) {
        const blob = new Blob([data], { type });
        let link = document.createElement('a');
        if (link.download !== undefined) {
            let url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    },

    /**
     * @description 通用文件下载
     * @param {Object} fileUrl
     * @param {Object} name
     */
    downloadFile(fileUrl, name) {
        return new Promise((resolve, reject) => {
            fetch(fileUrl).then(res => res.blob().then(blob => {
                var a = document.createElement('a');
                var url = window.URL.createObjectURL(blob);
                var fileExt = fileUrl.split("/");
                var filename = name || fileExt[fileExt.length - 1];
                a.href = url;
                a.download = filename;
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
                resolve(true);
            }))
        })
    },


}
