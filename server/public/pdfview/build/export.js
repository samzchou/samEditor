


class pdf_export {
    constructor(type, socketId) {
        this.exportType = type;
        this.socketId = socketId;
        this.serverUrl = serverUrl || window.location.origin;
        this.filePath = '';
        this.pdfUrl = PDFViewerApplication.baseUrl;
        // return this.parserData(callBack);
        this.stdKind = 0; // 国家标准:1100 行业标准:1200 地方标准:6, 团体标准:1500 企业标准:1400 指导性技术文件:7
        this.callBack = null;
        this.tableData = [];
        this.coverData  = {};
        this.catalogueData = [];
        this.outlineData = [];
        // this.data = {}
    }

    init(pdfPath='', callBack) {
        PDFViewerApplication.pdfViewer.currentScaleValue = "1";
        this.callBack = callBack;
        this.onLoading('正在扫描整个文档并提取数据，请等待解析完成！');
        // this.resetData();
        $.ajax({
            method: 'POST',
            url: this.serverUrl + '/parseDoc',
            data: JSON.stringify({ operation:'pdfToHtml', filePath:pdfPath }),
            dataType: "json",
            contentType: 'application/json;charset=utf-8',
            timeout: 10 * 60 * 60 * 1000,
            success: (res) => {
                if (res.code === 200 && res.data) {
                    this.parseHtml(res.data)
                } else {
                    alert('PDF文档解析错误！');
                    this.onLoading();
                }
            },
            error: (xhr, status, error) => {
                console.log('request error', xhr, status, error)
                alert('PDF文档解析错误！');
                this.onLoading();
            }
        })
    }

    parseHtml(htmlUrl) {
        const getSpanNodes = (container, rect) => {
			const spanList = [], wrapText = [];
			if (container.nodeName === 'IMG') {
				spanList.push({ nodeName: 'IMG'})
			} else {
				const childNodes = Array.from(container.childNodes);
				for (let i=0; i<childNodes.length; i++) {
					let node = childNodes[i];
                    let nodeRect = node.getBoundingClientRect();
					if (node.textContent !== '') {
                        // node.textContent = node.textContent.replace(/\s/g,'');
						let nodeData = { 
                            nodeName:node.nodeName, 
                            style:node.style ? node.getAttribute('style'): '', 
                            top: nodeRect.top - rect.top,
                            left: nodeRect.left - rect.left,
                            width:nodeRect.width, 
                            height:nodeRect.height, 
                            fontSize: node.style.fontSize,
                            text:node.textContent//.replace(/\<|\＜/s, '&lt;').replace(/\>|\＞/s, '&gt;') 
                        };
						if (['I','B','SUP','SUB'].includes(node.nodeName)) {
							nodeData.style = node.firstChild.getAttribute('style') || '';
							nodeData.text = node.textContent//.replace(/\<|\＜/s, '&lt;').replace(/\>|\＞/s, '&gt;');
                            // nodeData.fontSize = node.style.fontSize;
                            wrapText.push(nodeData.text)
						} else if(['SPAN'].includes(node.nodeName)) {
                            nodeData.style = node.getAttribute('style') || '';
                            nodeData.text = node.textContent//.replace(/\<|\＜/s, '&lt;').replace(/\>|\＞/s, '&gt;');
                            // nodeData.fontSize = node.style.fontSize;
                            wrapText.push(nodeData.text)
						} else {
							console.error('error',node.nodeName)
						}
                        spanList.push(nodeData);
					}
				}

			}
			return {
                spanList,
                wrapText: _.trim(wrapText.join(""))
            };
		}

        const getMinLeft = list => {
            var minLeft = 10000;
            for (let node of list) {
                if (node.left < minLeft && node.left > 0 && !node.src) {
                    minLeft = node.left;
                }
            }
            
            return minLeft;
        }

        /* const mergeNodes = nodes => {
            var newNodes = _.orderBy(nodes, ['top']);
            if (nodes.length) {
                debugger
            }
            return nodes;
        } */

        const mergeText = childs => {
            if (childs) {
                for (let i=0; i<childs.length; i++) {
                    let node = childs[i];
                    let nextNode = childs[i+1];
                    if (nextNode) {
                        if ((/^\.+[1-9]/.test(nextNode.text) || nextNode.text === '/' || nextNode.text === '.')) {
                            node.text += nextNode.text;
                            nextNode.text = '';
                        } else if (node.text.replace(/\s/g,'') !== '' && node.text.slice(-1) === '.' && /^[1-9]/.test(nextNode.text) && !isNaN(nextNode.text)) {
                            node.text += nextNode.text;
                            nextNode.text = '';
                        }
                    }
                }
            }
            return childs;
        }

        const sortByNodes = (pageNodes = []) => {
            pageNodes = _.orderBy(pageNodes, ['left']);
            pageNodes.forEach(node => {
                if (node.children) {
                    let smaNodes = pageNodes.filter(n => { return n !== node && !n.src && (Math.abs(n.top - node.top) <= 8 ) && n.left > node.left && !n.merged });
                    if (smaNodes.length) {
                        smaNodes.forEach(sn => {
                            node.children = node.children.concat(sn.children||[]);
                            sn.merged = true;
                        });
                        let wrapText = [];
                        node.children.forEach(sn => {
                            wrapText.push(sn.text.replace(/\s/g,''))
                        })
                        node.wrapText = wrapText.join("");
                    }
                }
            });
            pageNodes = _.orderBy(pageNodes, ['top']).filter(item =>{  return !item.merged });
            for (let i=0; i<pageNodes.length; i++) {
                let node = pageNodes[i];
                /* let smaNodes = pageNodes.filter(n => { return !node.src && !n.src && n !== node && Math.abs(n.top - node.top) <= 8 });
                if (smaNodes.length) {
                    console.log(smaNodes)
                    debugger
                } */
                node.children = mergeText(node.children);
            }
            return pageNodes;
        }

        $.ajax({
            method: 'POST',
            url: this.serverUrl + '/file',
            data: JSON.stringify({ operation:'getFile', filePath: htmlUrl }),
            dataType: "json",
            contentType: 'application/json;charset=utf-8',
            timeout: 10 * 60 * 60 * 1000,
            success: (res) => {
                if (res.code === 200 && res.data) {
                    var htmlContent = /<body[^>]*>([\s\S]+?)<\/body>/i.exec(res.data)[1];
                    var container = document.body.querySelector('.struct-container');
                    if (!container) {
                        container = document.createElement('div');
                    }
                    
                    container.className = 'struct-container';
                    container.innerHTML = htmlContent;
                    document.body.appendChild(container);

                    const pageNodes = container.querySelectorAll('div[id]');
                    const pageList = [];
                    var isOutline = false;

                    for (let i=0; i<pageNodes.length; i++) {
                        var page = pageNodes[i];
                        var pageRect = page.getBoundingClientRect();
                        var pageData = { width:pageRect.width, height:pageRect.height, nodes:[] };
                        const pNodes = Array.from(page.childNodes);

                        /* if (i === 1) {
                            debugger
                        } */
            
                        var nodexIndex = 0;
                        for (let j=0; j<pNodes.length; j++) {
                            var prevNode = pageData.nodes[nodexIndex-1];
                            var pNode = pNodes[j];
                            // var prevNode = pNodes[j-1];
                            if (pNode.nodeName !== '#text') {
                                let nodeRect = pNode.getBoundingClientRect();
                                let children = getSpanNodes(pNode, nodeRect);
                                nodeRect = { top:nodeRect.top - pageRect.top, left:nodeRect.left - pageRect.left, width:nodeRect.width, height:nodeRect.height };
                                let nodeData = { style:pNode.getAttribute('style') };
                                let pText = pNode.textContent.replace(/\s/g,'');
                                if (pText !== '') {
                                    nodeData = Object.assign(nodeData, { ...nodeRect, wrapText:children.wrapText, children:children.spanList });
                                    if (i === 0 && children.wrapText.replace(/\s/g,'').slice(-2) === '标准' && !pageData.isCover) { // 判断是否为封面页
                                        pageData.isCover = true;
                                    }
                                    pageData.nodes.push(nodeData);
                                } else if (pNode.nodeName === 'IMG') {
                                    pNode.dataset.imgIndex = i + '-' + nodexIndex;
                                    nodeData.top = nodeRect.top;
                                    nodeData.left = nodeRect.left;
                                    nodeData.width = nodeRect.width;
                                    nodeData = Object.assign(nodeData, { src: pNode.src }); //_.pick(pNode.getBoundingClientRect(), ['left','top','width','height'])
                                    pageData.nodes.push(nodeData);
                                    pNode.onload = (evt) => {
                                        // console.log(evt.target);
                                        let imgIndex = evt.target.dataset.imgIndex.split('-');
                                        let imgNode = pageList[parseInt(imgIndex[0])]['nodes'][parseInt(imgIndex[1])];
                                        if (imgNode && imgNode.src) {
                                            pageRect = evt.target.parentElement.getBoundingClientRect();
                                            nodeRect = evt.target.getBoundingClientRect();
                                            imgNode.top = nodeRect.top - pageRect.top;
                                            imgNode.left = nodeRect.left - pageRect.left;
                                            imgNode.width = nodeRect.width;
                                        }
                                    }
                                }
                                nodexIndex++;
                            }
                            //_.orderBy(pageData.nodes, ['top','left']);
                        }
                        
                        // pageData.nodes = sortByNodes(pageData.nodes);
                        var pageWrapNodes = sortByNodes(pageData.nodes);

                        if (!isOutline) {
                            for (let j=0; j<pageWrapNodes.length; j++) {
                                if (!pageWrapNodes[j].wrapText || !pageWrapNodes[j-1] || !pageWrapNodes[j-1].wrapText) { //  
                                    continue;
                                }
                                var currNode = pageWrapNodes[j];
                                var prevNode = pageWrapNodes[j-1];

                                var pNodeText = currNode.wrapText.replace(/\s/g,'');
                                var prevNodeText = prevNode?.wrapText ? prevNode.wrapText.replace(/\s/g,'') : '';

                                if (j === 1 && ['前言','引言'].includes(pNodeText) && !isOutline) {
                                    isOutline = true;
                                    pageData.isOutline = true;
                                    break;
                                } else if (['目次','目录'].includes(pNodeText) || (prevNodeText.match(/\………|\········/) !== null && pNodeText.match(/\………|\········/) !== null )) { // && !pageData.isToc
                                    pageData.isToc = true;
                                    break;
                                }
                            }
                        } else {
                            pageData.isOutline = true;
                        }
                        // let pageWidth = getMaxWidth(pageData.nodes);
                        pageData.minLeft = getMinLeft(pageData.nodes);
                        pageList.push(pageData)
                    }

                    console.log(pageList);

                    setTimeout(() => {
                        pageList.forEach(pageData => {
                            pageData.nodes = sortByNodes(pageData.nodes);
                        })
                        this.callBack && this.callBack(pageList);
                    }, 5500)
                        
                } else {
                    alert('PDF文档解析错误！');
                }
                this.onLoading();
            },
            error: (xhr, status, error) => {
                console.log('request error', xhr, status, error)
                alert('PDF文档解析错误！');
                this.onLoading();
            }
        })
    }

    async loadedImage(node) {
        return new Promise((resolve, reject) => {
            let nodeData = {};
            node.onload = (evt) => {
                let nodeRect = evt.target.getBoundingClientRect();
                nodeData.top = nodeRect.top;
                nodeData.left = nodeRect.left;
                nodeData.width = nodeRect.width;
                nodeData = Object.assign(nodeData, { src: evt.target.src }); //_.pick(pNode.getBoundingClientRect(), ['left','top','width','height'])
                resolve(nodeData)
            }
        })
    }

    formatSeconds(value) {
        var theTime = parseInt(value); // 秒
        var theTime1 = 0; // 分
        var theTime2 = 0; // 小时
        if (theTime > 60) {
            theTime1 = parseInt(theTime / 60);
            theTime = parseInt(theTime % 60);
            if (theTime1 > 60) {
                theTime2 = parseInt(theTime1 / 60);
                theTime1 = parseInt(theTime1 % 60);
            }
        }
        var result = "" + parseInt(theTime);
        if (result < 10) {
            result = '0' + result;
        }
        if (theTime1 > 0) {
            result = "" + parseInt(theTime1) + ":" + result;
            if (theTime1 < 10) {
                result = '0' + result;
            }
        } else {
            result = '00:' + result;
        }
        if (theTime2 > 0) {
            result = "" + parseInt(theTime2) + ":" + result;
            if (theTime2 < 10) {
                result = '0' + result;
            }
        } else {
            result = '00:' + result;
        }
        return result;
    }
    // 解析文档内容
    /* async parseXmlData(callBack) {
        const condition = {
            "filePath":"pdf/DL_T1067-2020_H/DL_T1067-2020.xml",
            "type":"getFile"
        }
        const { code, data } = await $.ajax({
            method: 'POST',
            url: this.serverUrl + '/file',
            data: JSON.stringify(condition),
            dataType: "json",
            contentType: 'application/json;charset=utf-8',
            timeout: 10 * 60 * 60
        })

        console.log('parseXmlData===>', code, data)
        // debugger
        callBack && callBack(data)
    } */

    resetData() {
        var pageList = [];
        // console.log('startTime', new Date().getTime())
        const { pagesCount } = PDFViewerApplication;
        const minutes = this.formatSeconds(pagesCount * 1.25); // Math.round((pagesCount * 3600));
        const getPageData = pageNumber => {
            this.onLoading('共' + pagesCount + '页，预计耗时' + minutes + '；当前正在处理第' + pageNumber + '页')
            // 解析完成后发送数据
            // debugger
            if (pageNumber > pagesCount) {
                // console.log('pageList', pageList);
                // 保存数据
                /* const condition = {
                    type: 'saveFile',
                    filePath: 'pdf/' + this.filePath,
                    fileName: 'pages.json',
                    data: JSON.stringify(pageList)
                } */
                // debugger
                /* $.ajax({
                    method: 'POST',
                    url: this.serverUrl + '/file',
                    data: JSON.stringify(condition),
                    dataType: "json",
                    contentType: 'application/json;charset=utf-8',
                    timeout: 10 * 60 * 60,
                    success: (res) => {
                        console.log('saveData', res)
                        if (res.code === 200) {
                            this.callBack && this.callBack({
                                fileName: res.data,
                                pageList
                            })
                        } else {
                            alert('文档输出错误！');
                        }
                        this.onLoading();
                    },
                    error: (xhr, status, error) => {
                        console.log('request error', xhr, status, error)
                        alert('文档输出错误！');
                        this.onLoading();
                    }
                }) */

                /* this.callBack && this.callBack({
                    pageList
                    // coverData: this.coverData,
                    // catalogueData: this.catalogueData,
                    // outlineData: this.outlineData
                })
                this.onLoading(); */
                // console.log('endTime', new Date().getTime())
                this.callBack && this.callBack(pageList)
                this.onLoading();
                return false;
            }
            PDFViewerApplication.page = pageNumber;
            setTimeout(() => {
                let res = this.getPageContent(pageNumber);
                if (res) {
                    pageList.push(res);
                    getPageData(pageNumber + 1);
                }
            }, 1000);
        }
        // 从第一页开始解析
        getPageData(1);
    }

    // 德文字母转换  öäüß
    transAlphabet(str) {
        if (str.includes('ß')) {
            str = str.replace(/\ß/g,'B');
        }
        if (str.includes('ö')) {
            str = str.replace(/\ö/g,'o');
        }
        if (str.includes('ä')) {
            str = str.replace(/\ä/g,'a');
        }
        if (str.includes('ü')) {
            str = str.replace(/\ü/g,'u');
        }
        // 然后全角转半角
        return this.chgCase(str);
    }

    toNodeObj(node, sort=0, nodeIndex=0, childIndex=0) {
        let nodeStyle = window.getComputedStyle(node);
        let text = this.transAlphabet(node.textContent);

        /* if (text === '刚昌') {
            debugger
        } */

        let rect = node.getBoundingClientRect();

        // let wholeText = text.replace(/\s/g,'');
        // if (wholeText)
        // let rect = node.getBoundingClientRect()
        // console.log('rect==========================>',node,rect)
        // 判断是否为目录列
        // let isTocItem = text.includes('........................');
        
        return {
            nodeIndex,
            childIndex,
            text,
            sort,
            // top: rect.top - pageRect.top,
            // left: rect.left - pageRect.left,
            top: parseFloat(nodeStyle.top),
            left: parseFloat(nodeStyle.left),
            // relTop: node.offsetTop,
            // relLeft: node.offsetLeft,
            width: rect.width,//node.offsetWidth,
            height: rect.height,//node.offsetHeight,
            fontSize: nodeStyle.fontSize,
            fontFamily: nodeStyle.fontFamily,
            // isTocItem,
        }
    }

    // 解析页面内容
    getPageContent(pageNumber = 1) {
        const { pdfViewer } = PDFViewerApplication;
        const viewContainer = pdfViewer.container;
        const pageContainer = viewContainer.querySelector(`.page[data-page-number="${pageNumber}"]>.textLayer`);
        
        // var isCover = false, isToc = false; // 是否为封面 或 目次
        var strArr = [], pageData = { isCover:false, isToc:false }, pageImg;
        if (pageContainer) {
            pageData = {
                width: pageContainer.offsetWidth,
                height: pageContainer.offsetHeight,
                num: pageNumber
            }
            if (pageContainer.textContent) {
                // debugger
                const canvas = viewContainer.querySelector(`.page[data-page-number="${pageNumber}"] canvas`); // canvas 画布
                pageImg = canvas.toDataURL("image/png");
                // debugger
                // 获取每行的节点组成节点组
                var childNode = Array.from(pageContainer.childNodes);
                const splitArr = arr => {
                    let gIndex = 0;
                    for (let i=0; i<arr.length; i++) {
                        let item = arr[i];
                        if (i > 0) {
                            let prevItem =  arr[i-1];
                            if (item.top - prevItem.top - prevItem.height > 2)  {
                                gIndex++;
                            }
                        }
                        item.gIndex = gIndex;
                    }
                    arr = _.groupBy(arr, 'gIndex');
                    // debugger
                    let newArr = [];
                    for (let key in arr) {
                        let list = arr[key];
                        let maxTop = _.maxBy(list, 'top')['top'];
                        let minTop = _.minBy(list, 'top')['top'];
                        let minLeft = _.minBy(list, 'left')['left'];
                        let maxLeft = _.maxBy(list, 'left')['left'];
                        let maxHeight = _.maxBy(list, 'height')['height'];
                        let minHeight = _.minBy(list, 'height')['height'];
                        list = _.sortBy(list, ['sort','left','top']);
                        let obj = {
                            minLeft,
                            maxLeft,
                            minTop,
                            maxTop, //spanStr[0]['top'],
                            minHeight,
                            maxHeight,
                            nodes:list
                        }
                        newArr.push(obj)
                    }
                    return newArr;
                }
        
                const splitNode = index => {
                    var spanStr = [], sort = 0;
                    for (let i = index; i < childNode.length; i++) {
                        let node = childNode[i];
                        let role = node.getAttribute('role') || '';
                        if ((node.nodeName === 'BR' && role === 'presentation') || ['endOfContent'].includes(node.className) || !node.nextElementSibling) { // 换行
                            spanStr = _.sortBy(spanStr, ['sort','left','top']);
                            // 继续分组
                            spanStr = splitArr(spanStr);
                            strArr = strArr.concat(spanStr)
                            splitNode(i + 1);
                            break;
                        } else if (node.className === 'markedContent') { // 标记内容
                            node.dataset.index = i;
                            let childNodes = Array.from(node.querySelectorAll('span[role="presentation"]'));
                            childNodes.forEach((cNode, j)=> {
                                cNode.dataset.index = j;
                                spanStr.push(this.toNodeObj(cNode, sort, i, j));
                                sort++;
                            })
                        } else {
                            node.dataset.index = i;
                            spanStr.push(this.toNodeObj(node, sort, i));
                            sort++;
                        }
                    }
                    return spanStr;
                }
                splitNode(0);
            }
        }

        const extractStr = (nodeItem, isToc=false) => {
            var strList = [];
            // debugger
            // var precision = 6; // 偏差精度阙值
            var left = _.minBy(nodeItem.nodes, 'left')['left'], top =_.minBy(nodeItem.nodes, 'top')['top'], height = _.maxBy(nodeItem.nodes, 'height')['height'], width = 0;
            
            for (let i=0; i<nodeItem.nodes.length; i++) {
                let item = nodeItem.nodes[i];
                // let prevItem = nodeItem.nodes[i-1]
                if (isToc) {
                    item.text = item.text.replace(/[\.|\…]/g,''); 
                }
                width += item.width;
                // 判断上标下标
                /* if (top - item.top > precision && prevItem && (item.left-prevItem.left < precision)) {
                    debugger
                    item.text = '<sup>' + item.text + '</sup>';
                }
                if (item.top - top > precision && prevItem && (item.left-prevItem.left < precision)) {
                    debugger
                    item.text = '<sub>' + item.text + '</sub>';
                } */
                item.text = item.text;//.replace(/\<|\＜/g, '&lt;').replace(/\>|\＞/g, '&gt;')
                if (item.text !== '' || /\s/.test(item.text)) {
                    strList.push(item.text)
                }
                
                /* let nextItem = nodeItem.nodes[i+1];
                if (nextItem && nextItem.text.replace(/\s/g,'') === '' && nextItem.width < precision) {
                    strList.push(item.text);
                    continue;
                } */
            }

            return {
                left,
                width,
                height,
                str: strList.join("|*|")
            }
        }

        // 定义须合并的节点组
        const mergeNodes = nodeArr => {
            var minLeft = _.minBy(nodeArr, 'minLeft')['minLeft'];
            var precision = 6; // 偏差精度阙值
            // console.log(nodeArr)
            var newStr = [], arrIndex = 0;
            // debugger
            for (let i=0; i<nodeArr.length; i++) {
                if (!newStr[arrIndex]) {
                    newStr[arrIndex] = [];
                }
                let currItem = nodeArr[i];
                let mergeStr = extractStr(currItem, pageData.isToc);
                
                let itemStr = mergeStr.str.replace(/\s/g, '');
                // debugger
                if (i === 1 && !pageData.isToc && (['目次','目录'].includes(itemStr.replace(/[|*|]/g,'')) || itemStr.match(/[...]{3}/g) !== null)) {
                    pageData.isToc = true;
                }
                if (!pageData.isCover && itemStr.slice(-2) === '标准') {
                    pageData.isCover = true;
                }
                newStr[arrIndex].push(mergeStr);
                // 判断下个节点组是否为当前行的换行段落
                let nextItem = nodeArr[i+1];
                if (nextItem) {
                    let isContinueParagraph = (currItem.minLeft - nextItem.minLeft) > precision * 2 && Math.abs(nextItem.minLeft - minLeft) < precision && nextItem.minTop - (currItem.minTop+currItem.maxHeight) < precision / 2;
                    if (!isContinueParagraph && currItem.merged) {
                        isContinueParagraph = Math.abs(currItem.minLeft - nextItem.minLeft) < precision;
                    }
                    if (isContinueParagraph) {
                        newStr[arrIndex].push(extractStr(nextItem, pageData.isToc));
                        nextItem.merged = true;
                    } else {
                        arrIndex++;
                    }
                }
            }
            return newStr;
        }
        // debugger
        if (strArr.length) {
            strArr = _.uniq(strArr);
            strArr = _.sortBy(strArr, ['maxTop']);
            strArr = mergeNodes(strArr);
        }
        
        console.log('strArr===========>', strArr)
        return {
            // img: pageImg,
            page: pageData,
            nodes: strArr,
        };
    }


    extractStruct(pageList=[]) {
        console.log('pageList==>', pageList)
        PDFViewerApplication.page = 1;
        this.onLoading('开始提取数据结构...');
        var catalogueData = [], outlineData = [];
        var startIndex = 0;

        const pdfViewer = document.getElementById('viewer')
        pageList.forEach((page, i) => {
            const pageLayer = pdfViewer.querySelector(`[data-page-number="${i+1}"]>.textLayer`);
            /* if (i === 0) {
                this.onLoading('正在提取封面数据结构...');
                this.coverData = this.parseCoverData(page.nodes);
                console.log('coverData', this.coverData);
                startIndex++;
            } else {
                if (this.getCatalogue(page.nodes)) { // 取出目次
                    this.onLoading('正在提取目次数据结构...');
                    let catalogue = this.parseCatalogue(pageList, startIndex);
                    if (catalogue) {
                        catalogueData = catalogue.dataArr;
                        startIndex = catalogue.endIndex;
                        console.log('catalogueData', catalogueData)
                        this.catalogueData = catalogueData;
                    }
                } else { // 分析章节
                    this.outlineData = this.parseChapter(pageList, startIndex);

                }
            } */
        })
    }

    /**
     * @description 解析封面数据
     * @param {Array} nodes 
     * @returns 
     */
    parseCoverData(nodes=[]) {
        var coverData = {};
        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i];
            if (!node.text) {
                continue;
            }
            let textContent = node.text.replace(/[\r\t\n]/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
            let wrapText = textContent.replace(/\s/g, '');
            if (wrapText !== '') {
                let upText = textContent.toUpperCase();
                if (upText.match(/\ICS/i) && /^[a-zA-Z-0-9-/\s/]+/.test(upText) && !coverData.icsNumber) { //ICS
                    coverData.icsNumber = upText.replace(/\ICS/g, '');
                    continue;
                } else if (upText.match(/\CCS/i) && /^[a-zA-Z-0-9-/\s/]+/.test(upText) && !coverData.ccsNumber) { // CCS
                    coverData.ccsNumber = upText.replace(/\CCS/g, '');
                    continue;
                } else if (/^[a-zA-Z-0-9-/\s/]+/.test(upText) && !coverData.recordNumber) { // 备案号record_number
                    coverData.recordNumber = upText;
                    continue;
                } else if (node.logo && !coverData.logo) {
                    coverData.logo = node.logo;
                    continue;
                } else if (wrapText.slice(-2) === '标准' && /^[\u4E00-\u9FA5]+$/.test(wrapText) && !coverData.stdTitle) { // 标准抬头
                    coverData.stdTitle = wrapText;
                    if (wrapText.match(/\中华人民共和国/) !== null) {
                        coverData.stdSign = 'GB/T';
                    }
                    continue;
                } else if (upText.match(/\CORPORATION/i) && /^[\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F-a-zA-Z-0-9-/\s/]+$/.test(textContent) && !coverData.stdEnTitle) { // 英文抬头
                    coverData.stdEnTitle = textContent;
                } else if (upText.indexOf("Q/") === 0 && !/[0-9]/.test(upText) && !coverData.stdSign) { // 标准标志
                
                } else if (/^[A-Z]+(\W)+[A-Z0-9]/.test(upText) && !coverData.stdNo) { // 标准编号
                    let strSplit = upText.match(/[0-9]/);
                    if (strSplit) {
                        coverData.stdNo = upText.slice(strSplit.index, upText.length);
                        coverData.stdSign = _.trim(upText.slice(0, strSplit.index));
                    }
                    continue;
                } else if (textContent.match(/代替/i) && /^[\u4E00-\u9FA5-a-zA-Z-/— 0-9-(\d+(\.\d+)?)]+$/.test(textContent) && !coverData.origStdNo) { // 代替编号
                    coverData.origStdNo = _.trimStart(textContent.replace(/代替/g, ''));
                    continue;
                } else if (/^[a-zA-Z-0-9\u4E00-\u9FA5-0-9]+$/.test(wrapText) && wrapText.match(/\发布|\实施/i) === null && !coverData.stdName) { // 标准名称
                    coverData.stdName = textContent;
                    continue;
                } else if (/^[/第0-9]+(部分)/.test(wrapText) && coverData.stdName && coverData.stdName.match(/\部分/) === null) { // 标准名称第几部分
                    coverData.stdName += '<br/>' + textContent;
                    continue;
                } else if (!/[\u4E00-\u9FA5]/.test(upText) && !coverData.stdNameEn) { // 标准名称英文译名
                    coverData.stdNameEn = textContent;
                    continue;
                } else if (/^[/PART]+[0-9]/.test(upText.replace(/\s/g, '')) && !/[\u4E00-\u9FA5]/.test(upText) && coverData.stdNameEn && coverData.stdNameEn.toUpperCase().match(/\PART/) === null) { // 标准名称英文译名第几部分
                    coverData.stdNameEn += '<br/>' + textContent;
                    continue;
                } else if (upText.replace(/\s/g, '').match(/\ISO\/IEC/ig) !== null && !coverData.consistentSign) {
                    coverData.consistentSign = textContent;
                    continue;
                } else if (['MOD','IDT','NEQ'].includes(upText.slice(-4, -1)) && coverData.consistentSign) {
                    coverData.consistentSign += '<br/>' + textContent;
                    continue;
                } else if (/\（.*?稿\）/.test(textContent) && !coverData.stdEdition) { // 文档稿次
                    coverData.stdEdition = textContent;
                    continue;
                } else if (wrapText.match(/\本稿|\完成|\年|\月|[0-9]/i) !== null && textContent.match(/\发布|\实施/ig) === null && !coverData.updateTime) { // 本稿完成日期
                    let ft = wrapText.split(/\:|\：/i);
                    coverData.updateTime = ft[ft.length - 1];
                    continue;
                } else if (textContent.match(/\发布|\实施/ig) && !coverData.stdPublishDate && !coverData.stdPerformDate) {// 发布实施日期(在一行内的)
                    let str = textContent.replace(/[^A-Z-\d.]/g, '');
                    coverData.stdPublishDate = str.slice(0, str.length / 2);
                    coverData.stdPerformDate = str.slice(str.length / 2, str.length);
                    continue;
                } else if (wrapText.substr(1).substr(-2) === '发布' && !/^[\u4E00-\u9FA5/\s/]+$/.test(wrapText) && !coverData.stdPublishDate) { // 发布日期
                    coverData.stdPublishDate = wrapText.replace(/[^A-Z-\d.]/g, '');
                    continue;
                } else if (wrapText.substr(1).substr(-2) === '实施' && !/^[\u4E00-\u9FA5/\s/]+$/.test(wrapText) && !coverData.stdPerformDate) { // 实施日期
                    coverData.stdPerformDate = wrapText.replace(/[^A-Z-\d.]/g, '');
                    continue;
                } else if (!/\.*?\发布/.test(wrapText) && /^[\u4E00-\u9FA5/\s/]+$/.test(wrapText) && !coverData.releaseDepartment) {
                    coverData.releaseDepartment = wrapText;
                } else if (!/\.*?\发布/.test(wrapText) && /^[\u4E00-\u9FA5/\s/]+$/.test(wrapText) && coverData.releaseDepartment) {
                    coverData.releaseDepartment += '<br/>' + wrapText;
                }
            }
        }

        if (/^\GB/.test(coverData.stdSign)) { // 国标类型
            coverData.stdKind = 1100;
        } else if (/^\T\//.test(coverData.stdSign)) { // 团标类型
            coverData.stdKind = 1500;
        } else if (/^\DB/.test(coverData.stdSign)) {  // 地标类型
            coverData.stdKind = 6;
        } else if (/^\Q\//.test(coverData.stdSign)) { // 企标类型
            coverData.stdKind = 1400;
        } else {
            coverData.stdKind = 1200;
        }

        return coverData;
    }

    /**
     * @description 判断文档是否有目次
     * @param {Array} nodes 
     * @returns 
     */
    getCatalogue(nodes=[]) {
        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i];
            if (node.text) {
                let textContent = node.text.replace(/[\r\t\n]/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
                let wrapText = textContent.replace(/\s/g, '');
                if (wrapText.match(/^\目次|\目录/) !== null) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * @description 解析目次数据
     * @param {*} allPage 
     * @param {*} startIndex 
     */
    parseCatalogue(allPage=[], startIndex=0) {
        var dataArr = [];
        var endIndex = this.getEndPages(allPage, startIndex+1);
        // console.log(endIndex)
        for (let i = startIndex; i < endIndex; i++) {
            let nodes = allPage[i]['nodes'];
            for(let j=0; j<nodes.length; j++) {
                let node = nodes[j];
                if (node.text) {
                    let textContent = node.text.replace(/[\r\t\n\…|\..]/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/[\u2160-\u2183]/g, '');
                    let wrapText = textContent.replace(/\s/g, '');
                    if (!/^[\目次|\目录]/.test(wrapText) && !this.checkIsStdNo(textContent) && j > 0) {
                        let data = { 
                            id: guid(), 
                            text: textContent.replace(/[0-9]+$/g,''),
                            type: this.getOutlineType(textContent)
                        };
                        dataArr.push(data);
                    }
                }
            }
        }
        return {
            dataArr,
            endIndex
        };
    }

    /**
     * @description 获取下一个章节的下标
     * @param {Array} allPage 
     * @param {Int} startIndex 
     * @returns 
     */
    getEndPages(allPage=[], startIndex=0) {
        for (let i = startIndex; i < allPage.length; i++) {
            let nodes = allPage[i]['nodes'];
            for(let j=0; j<nodes.length; j++) {
                let node = nodes[j];
                if (node.text) {
                    let textContent = node.text.replace(/[\r\t\n]/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
                    let wrapText = textContent.replace(/\s/g, '');
                    let splitIndex = textContent.match(/[\u4E00-\u9FA5]/i);
                    if (/^[\前言|\引言|\附录|\参考文献|\索引]/.test(wrapText) || (splitIndex && splitIndex.index > 0)) {
                        return i;
                    } 
                }
            }
        }
        return -1;
    }

    /**
     * @description 校验文本是否为标准编号
     * @param {String} text 
     * @returns 
     */
    checkIsStdNo(text='') {
        if (this.coverData.stdSign && this.coverData.stdNo) {
            return !!~text.indexOf(this.coverData.stdSign) && !!~text.indexOf(this.coverData.stdNo)
        }
        return false;
    }

    /**
     * @description 定义章节类型
     * @param {String} text 
     * @returns 
     */
    getOutlineType(text='') {
        if (/^\前言/.test(text)) {
            return 1;
        } else if (/^\引言/.test(text)) {
            return 2;
        } else if (/^[0-9]+(\范围)/.test(text) || /^[0-9]+(\总则)/.test(text)) {
            return 3;
        } else if (/^[0-9]+(\规范性引用文件)/.test(text)) {
            return 4;
        } else if (/^[0-9]+(\术语和定义)/.test(text)) {
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
    }

    // 解析章节
    parseChapter(allPage=[], startIndex=0) {
        // this.onLoading('正在提取章节数据结构...');
        this.onLoading();
        var allOutline = [], orderNum = 1;
        // 校验字符串是否存在表格内？这里还须细化
        const isInTable = (text='', tableData=[]) => {
            for (let i=0; i < tableData.length; i++) {
                let tableRow = tableData[i];
                for (let j=0; j<tableRow.length; j++) {
                    let rowStr = tableRow[j];
                    if (rowStr) {
                        rowStr = rowStr.split(/\n/);
                        for (let n=0; n<rowStr.length; n++) {
                            if (text === rowStr[n].replace(/\s/g, '')) {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        }
        const extractOutline = (pageIndex, nodes) => {
            var tableData = this.tableData[pageIndex];
            var tableIndex = 0, isTable = false;
            var outlineType = 0;
            var outlineList = [], htmlContent = [];
            for (let j = 0; j < nodes.length; j++) {
                let node = nodes[j];
                if (node.text && !this.checkIsStdNo(node.text) && j < nodes.length - 1) { // 页眉页码过滤
                    let textContent = node.text.replace(/[\r\t\n]/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
                    let splitText = _.trimStart(textContent).split(/\s/i);
                    let wrapText = textContent.replace(/\s/g, '');
                    // console.log(textContent, splitText)
                    // 判断是否在表格内的文字
                    let checkInTable = isInTable(wrapText, tableData[tableIndex-1]||[]);
                    if (isTable && tableIndex && checkInTable) {
                        continue;
                    }
                    isTable = false;
                    let outlineData = {}, textObj = { text:textContent, left:node.left };
                    // 章节
                    let type = this.getOutlineType(wrapText);
                    if (type) {
                        outlineType = type;
                        outlineData = {
                            outlineType,
                            outlineId: guid(),
                            outlineTitle: wrapText.replace(/^[0-9]/i,''),
                            outlineCatalog: wrapText.replace(/[^0-9]+$/,''),
                            isVisible: true,
                            orderNum,
                            levelNum: 0,
                            content: {
                                contentId: guid(),
                                content: ''
                            }
                        }
                        textObj.outlineType = outlineData.outlineType;
                        textObj.outlineId = outlineData.outlineId;
                        outlineList.push(outlineData);
                        orderNum++;
                    } else {
                        let bulletType = this.isBulletNode(wrapText);
                        if (bulletType) { // 列项段落 `<div class="bullet" data-type="${bulletType}">${wrapText}</div>`
                            textObj.bulletType = bulletType;
                        } else if (/^[0-9A-Z.]{0,}$/g.test(splitText[0]) ) { // splitText.length>1 && 章条题 /^[A-Z0-9]/.test(splitText[0]) && !/[\u4E00-\u9FA5]/.test(splitText[0]) && /^[A-Z-0-9]+((\.\d+))/.test(splitText[0]) /^[A-Z-0-9]+((\.\d+))/
                            let reg = new RegExp(splitText[0], 'i');
                            outlineData = {
                                outlineType: outlineType || 6,
                                outlineId: guid(),
                                outlineTitle: wrapText.replace(reg, '') || '',
                                outlineCatalog: splitText[0],
                                orderNum,
                                levelNum: splitText[0].split('.').length,
                                content: {
                                    contentId: guid(),
                                    content: ''
                                }
                            };
                            outlineList.push(outlineData);
                            textObj.outlineId = outlineData.outlineId;
                            textObj.outlineType = outlineData.outlineType;
                            orderNum++;
                        } else if (/^\注+(\:|\：)/.test(wrapText)) {
                            textObj.zhu = true;
                        } else if (/^\注[0-9]+(\:|\：)/.test(wrapText)) {
                            textObj.zhux = wrapText.split(/\:|\：/)[0].replace(/注/i,'');
                        } else if (/^\示例+(\:|\：)/.test(wrapText)) {
                            textObj.example = true;
                        } else if (/^\示例[0-9]+(\:|\：)/.test(wrapText)) {
                            textObj.examplex = wrapText.split(/\:|\：/)[0].replace(/示例/i,'');
                        } else if (/^\图[0-9A-Z.]+(\ )/.test(textContent)) { // 图标题
                            textObj.text = wrapText.replace(/^\图[A-Z0-9]+((\.\d+))/i,'');
                            textObj.imgNumber = textContent.split(/\s/)[0].replace(/\图/i,'');
                        } else if (/^\表[0-9A-Z.]/.test(wrapText)) { // 表标题
                            let nextNode = nodes[j+1];
                            let checkSameNumber = false;
                            let tableNumber = wrapText.replace(/^\表/i,'').match(/^[A-Z0-9]+(\.\d+)/ig,'');
                            if (nextNode && /^\表/.test(nextNode.text.replace(/\s/g,''))) {
                                let sameTableName = nextNode.text.replace(/\s/g,'').replace(/^\表/i,'').match(/^[A-Z0-9]+(\.\d+)/ig,'');
                                checkSameNumber = tableNumber && sameTableName && sameTableName[0] === tableNumber[0];
                            }
                            if (!checkSameNumber) {
                                textObj.tableNumber = tableNumber ? tableNumber[0] : '';//textContent.split(/\s/)[0].replace(/\表/i,'').replace(/\(|\（|\续|\)|\）/g,'');
                                textObj.tableXu = textContent.match(/\续/i) !== null;
                                textObj.text = wrapText.replace(/^\表[A-Z0-9]+((\.\d+))/i,'').replace(/\(|\（|\续|\)|\）/g,'');
                                textObj.tableData = tableData[tableIndex];
                                isTable = true;
                                tableIndex++;
                            }
                        }
                    }
                    // 页码过滤
                    /* if (j < nodes.length - 1 && isNaN(wrapText) && !romaNumber.includes(wrapText)) {
                        htmlContent.push(textObj);
                    } */
                    htmlContent.push(textObj);

                } else if (node.img) { // 图片
                    htmlContent.push(node);
                }
            }

            console.log('outlineList', outlineList, htmlContent)
            return {
                outlineList,
                htmlContent
            };
        }

        const parsePages = (pageIndex) => {
            for (let i = pageIndex; i < allPage.length; i++) {
                let nodes = allPage[i]['nodes'];
                let chapaterData = extractOutline(i, nodes);
                allOutline.push({
                    index: i,
                    chapaterData
                })
            }
        }
        parsePages(startIndex);
        // console.log('allOutline=>', allOutline);
        this.onLoading();
        return allOutline;

    }

    /**
     * @description 段落是否为列项
     * @param {String} text 
     * @returns 
     */
    isBulletNode(text='') {
        if (/^\——/.test(text)) {
            return 'line';
        } else if (/^[a-z]+(\)|）)/.test(text)) {
            return 'lower';
        } else if (/^[0-9]+(\)|）)/.test(text)) {
            return 'num';
        }
        return '';
    }

    onLoading(str='') {
        var maskEle = document.getElementById('loading-mask');
        if (maskEle) {
            var className = str === '' ? 'hidden' :'';
            var exportEle = maskEle.querySelector('#export-page');
            if (exportEle) {
                maskEle.className = className;
                exportEle.innerHTML = str;
            }
        }
    }

    // 全角半角互转 iCase: 0全到半，1半到全，其他不转化
    chgCase(sStr, iCase = 0) {
        if (typeof sStr != "string" || sStr.length <= 0 || !(iCase === 0 || iCase == 1)) {
            return sStr;
        }
        var i, oRs = [], iCode;
        if (iCase) {
            /*半->全*/
            for (i = 0; i < sStr.length; i += 1) {
                iCode = sStr.charCodeAt(i);
                if (iCode == 32) {
                    iCode = 12288;
                } else if (iCode < 127) {
                    iCode += 65248;
                }
                oRs.push(String.fromCharCode(iCode));
            }
        } else {
            /*全->半*/
            for (i = 0; i < sStr.length; i += 1) {
                iCode = sStr.charCodeAt(i);
                if (iCode == 12288) {
                    iCode = 32;
                } else if (iCode > 65280 && iCode < 65375) {
                    iCode -= 65248;
                }
                oRs.push(String.fromCharCode(iCode));
            }
        }
        return oRs.join("");
    }
}