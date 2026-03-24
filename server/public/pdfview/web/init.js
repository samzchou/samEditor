// const { resolve } = require("path");

/**
 * ====================================================================================
 * PDF 文档模块
 * ====================================================================================
 */
var serverUrl;
var loadedCount = 0;
var limitPage = 0;
var isLoading;      // 是否默认加载loading的pdf文件
var waterMaskText;  // 水印文字
var waterMaskImage; // 水印图片
var waterMaskSize;  // 水印尺寸
const isMobile = isMobileOs();
var closeSideBar = false; // 关闭左侧导航栏
var disablePrint = false;
var sysLoading = false;
var showAllTag = false;
var pdfAdmin = false;
var pdfStdId = '';
var tagData = [];
var tagList = [];
var pdfStructData = null;
var toolBtnContainer = null;
var pdfSelections = null;
var ctrlKey = false;
var rightClickEle = null; // 右键元素
var pdfOutlines = null;
var pdfPageTop = 0;

var fromTag = null;

// 是否为移动端
function isMobileOs() {
    return navigator.userAgent.toLowerCase().indexOf('mobile') > -1;
}
function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
  });
}

// var exportPage = 0;
function loadedPdf() {
    loadedCount++;
    // console.log('loaded', loadedCount);
    if (loadedCount > 0) {
        // 项父窗口发送实例加载完成后发送消息
        setTimeout(() => {
            // 关闭左侧导航栏
            if (closeSideBar) {
                PDFViewerApplication.pdfSidebar.close();
            } else {
                PDFViewerApplication.pdfSidebar.open();
            }

            PDFViewerApplication.page = 1; // 回到第一页
            if (!PDFViewerApplication.download) {
                PDFViewerApplication.url = ''; // 清除内容，以免被他人复制数据
                PDFViewerApplication.baseUrl = '';
            }
            // 禁止打印
            PDFViewerApplication.disablePrint = disablePrint;

            if (PDFViewerApplication.pagesCount > 1) {
                // 获取标签树列表
                // getTagList();
                // 获取大纲数据
                // getPdfOutlines();
                if (pdfStructData && pdfStructData.outline) {
                    resetOutlineView(pdfStructData.outline);
                }
            }

            // 高亮显示文本示例
            /* setTimeout(() => {
                highlightTextByKeyword('本文件', 'source');
            }, 1500) */

            // 清除水印
            // clearWaterMask();
            postMsg({ act: 'loaded', documentInfo: PDFViewerApplication.documentInfo, pagesCount: PDFViewerApplication.pagesCount, outline:PDFViewerApplication.pdfOutlineViewer._outline });
            // const outlineViewer = PDFViewerApplication.pdfOutlineViewer.container;
            // const outlineList = getOutlineData();
            // console.log('outlineList===========>',outlineList)
            // debugger
            
            // 如是嵌套iframe则强制打开左侧栏
            /* if (window.self !== window.top && !isMobile) {
                PDFViewerApplication.pdfSidebar.open();
            } */
        }, 750)
    }
}

// 屏幕截图函数
var startX, startY, endX, endY, isSelecting = false, enableCrop = false;
var selectionEle;

function cropImageByPdfViewer() {
    const { container } = PDFViewerApplication.pdfViewer;
    selectionEle = document.getElementById('selection');
    startX = undefined;
    startY = undefined;
    endX = undefined;
    endY = undefined;
    isSelecting = false;

    /* document.addEventListener('mousedown', async (e) => {
        const viewerPage = getParent(e.target, 'page')
        const canvasWrapper = viewerPage.querySelector('.canvasWrapper')
        console.log('mousedown viewerPage', canvasWrapper, canvasWrapper.offsetLeft, canvasWrapper.offsetTop)
        console.log('mousedown viewerPage', canvasWrapper.getBoundingClientRect())

    })
    return */

    if (hasClass(container, 'crop')) {
        removeClass(container, 'crop');
        selectionEle.style.display = 'none';
        enableCrop = false;
        return false;
    }
    enableCrop = true;
    addClass(container, 'crop');

    if (!container.dataset.hasMousedown) {
        container.dataset.hasMousedown = true;
        
        container.addEventListener('mousedown', (e) => {
            if (enableCrop) {
                e.preventDefault();
                startX = e.clientX;
                startY = e.clientY;
                isSelecting = true;
                selectionEle.style.display = 'block';
                if(typeof container.setCapture !== 'undefined'){
                    container.setCapture();
                }
            }
        });

        container.addEventListener('mousemove', (e) => {
            if (isSelecting && enableCrop) {
                endX = e.clientX;
                endY = e.clientY;
                selectionEle.style.left = Math.min(startX, endX) + 'px';
                selectionEle.style.top = Math.min(startY, endY) + 'px';
                selectionEle.style.width = Math.abs(endX - startX) + 'px';
                selectionEle.style.height = Math.abs(endY - startY) + 'px';
                // console.log('mousemove', startX, startY, endX, endY)
            }
        });

        document.addEventListener('mouseup', async (e) => {
            if (isSelecting) {
                // isSelecting = false;
                // enableCrop = false;
                var width = Math.abs(endX - startX);
                var height = Math.abs(endY - startY);
                // console.log('mouseup', width, height)
                if (width < 7 || height < 7) {
                    alert('所选区域太小，请选择一个有效的区域！');
                    selectionEle.style.display = 'none';
                    return;
                }
                // onLoading('正在生成图片');

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                var dx = Math.min(startX, endX);
                var dy = Math.min(startY, endY);

                selectionEle.style.display = 'none';

                html2canvas(document.body, {
                    x: dx,
                    y: dy,
                    width: width,
                    height: height,
                    allowTaint: true,
                    useCORS: true,
                    backgroundColor: null
                }).then(function(canvas) {
                    canvas.toBlob(async (blob) => {
                        if (blob) {
                            this.setClipboardImg(blob, width, height);
                        } else {
                            alert('截图失败！');
                            onLoading();
                        }
                    }, 'image/png')
                    canvas.remove();
                });
                removeClass(container, 'crop');
                isSelecting = false;
                enableCrop = false;
            }
        })
    }
}

// 解析文档
function parseFileByPdfViewer() {
	PDFViewerApplication.pdfDocument.saveDocument().then(data => {
		const blob = new Blob([data], { type: 'application/pdf' });
		postMsg({ act:'parseFile', data:blob });
	})
}

async function setClipboardImg(blob='', width, height) {
    try {
        // 请求剪贴板写入权限
        const permissionStatus = await navigator.permissions.query({ name: 'clipboard-write' });
        if (permissionStatus.state === 'granted' || permissionStatus.state === 'prompt') {
            const clipboardItem = new ClipboardItem({
                'image/png': blob
            });
            // 将 ClipboardItem 写入剪贴板
            await navigator.clipboard.write([clipboardItem]);
            alert('截图已复制到剪贴板，可以进行粘贴！');
        } 
    } catch (err) {
        console.error('无法复制到剪贴板：', err);
    }
    onLoading();
    postMsg({ act:'cropImage', image: blob, width, height });
}


function createAnnotations() {
    // const annotations = 
}


function getOutlineData() {
    const outlineViewer = PDFViewerApplication.pdfOutlineViewer.container;
    const outlineList = [];
    outlineViewer.childNodes.forEach(node => {
        outlineList.push(node.textContent)
    })
    console.log('outlineList===========>',outlineList)
    postMsg({ act: 'outlineList', outlineList });
    return outlineList;
}


// 左侧大纲，缩略图等加载完成
function globalTreeLoaded(count, button, view) {
    // console.log('globalTreeLoaded===>', count, button, view)
    switch (button.id) {
        case 'viewOutline': // 大纲
            break;
        case 'viewAttachments': // 附件
            break;
    }
}
// 获取页面缩略图
function getThumbnail() {
    // PDFViewerApplication.pdfThumbnailViewer.container
}
// 获取大纲
function getOutline() {
    var arr = [];
    var listNodes = Array.from(PDFViewerApplication.pdfOutlineViewer.container.querySelectorAll('.treeItem'));
    listNodes.forEach(node => {
        if (node.querySelector('a')) {
            let ref = node.querySelector('a').getAttribute('href');
            ref = decodeURIComponent(ref).replace(/\#/i, '');
            let data = { label: node.querySelector('a').innerText };
            JSON.parse(ref).forEach((obj, idx) => {
                if (idx === 0) {
                    data.pageNumber = PDFViewerApplication.pdfLinkService._cachedPageNumber(obj);
                }
                for (k in obj) {
                    data[k] = obj[k];
                }
            });
            arr.push(data);
        }
    })
    // console.log('arr', arr);
    return arr;
}

// 解析PDF数据
function parseData(pdfData={}) {
    PDFViewerApplication.pdfViewer.currentScaleValue = '1';
    var pdfParser = new pdf_parser(pdfData);
    pdfParser.init(data => {
        resetOutlineView(data.outline);
        PDFViewerApplication.page = 1; // 解析完成后回到第一页
        postMsg({ act: 'parseData', data });
        pdfParser = null;
    });
}

// 重构大纲视图
function resetOutlineView(outline=[]) {
    const { outlineView } = PDFViewerApplication.pdfSidebar;
    outlineView.innerHTML = '';
    const outlineContainer = document.createElement('ul');
    outlineView.appendChild(outlineContainer);

    if (outline && outline.length) {
        for (let item of outline) {
            let liNode = document.createElement('li');
            let textContent = item.text || "";

            if (item.prev && !item.index) {
                textContent = '附录' + item.prev + ' ' + textContent;
            }
            let cls = 'level_1';
            if (item.index) {
                textContent = item.index + ' ' + textContent;
                if (![100,101].includes(item.type)) {
                    cls = 'level_' + item.index.split('.').length;
                }
            }
            let spanEle = document.createElement('span');
            spanEle.textContent = textContent;

            liNode.title = '双击可修改';
            liNode.dataset.id = item.id;
            liNode.className = cls;
            liNode.appendChild(spanEle);
            // 点击事件
            liNode.onclick = (evt) => {
                scrollToNode(item);
            }
            // 双击事件
            liNode.ondblclick = (evt) =>{
                let inputEle = liNode.querySelector('input');
                if (!inputEle) {
                    inputEle = document.createElement('input');
                    liNode.appendChild(inputEle);
                    inputEle.onblur = e => {
                        console.log(inputEle.value);
                        let inputValue = inputEle.value;
                        if (inputValue !== spanEle.textContent) {
                            // 判断index
                            let indexSplit = inputValue.split(/\s/);
                            if (item.index) {
                                if (indexSplit.length === 1) {
                                    alert(`请正确输入章节条款“${inputValue}”\n序号标识与文字后须有空格！`);
                                    return;
                                }
                                item.index = indexSplit[0];
                                item.text = indexSplit.slice(1, indexSplit.length).join("");
                                if (![100,101].includes(item.type)) {
                                    liNode.className = 'level_' + item.index.split('.').length;
                                }
                            }
                            spanEle.textContent = inputValue;
                            postMsg({ act: 'updateOutline', item });
                        }
                        
                        inputEle.style.display = 'none';
                        spanEle.style.display = 'block';
                    }
                }
                // console.log(evt.target.offsetTop, evt.target.offsetLeft)
                inputEle.value = spanEle.textContent;
                inputEle.style.display = 'block';
                inputEle.focus();
                spanEle.style.display = 'none';
                
                return false;
            }
            outlineContainer.appendChild(liNode);
        }
    }
    PDFViewerApplication.pdfSidebar.reset();
}

function clearWaterMask(pageIndex=1) {
    const { container } = PDFViewerApplication.pdfViewer;
    const pageContainer = container.querySelector(`.page[data-page-number="${pageIndex}"]>.textLayer`);
    if (pageContainer) {
        waterMaskNodes = pageContainer.querySelectorAll('span.markedContent');
        waterMaskNodes.forEach(node => {
            let textContent = node.textContent.replace(/\s/g,'');
            if (['www.weboos.com'].includes(textContent)) {
                node.style.display = none;
            }
        })
    }
}

function scrollToTop(top) {
    const pdfPageContainer = document.getElementById('viewerContainer'); 
    pdfPageContainer.scrollTo({
        top: top||0,
        behavior: "smooth"
    });
}

async function scrollToPage(pageIndex) {
    const { container } = PDFViewerApplication.pdfViewer;
    const pageContainer = container.querySelector(`.page[data-page-number="${pageIndex}"]>.textLayer`);
    if (pageContainer) {
        pageContainer.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest"
        });
        return pageContainer;
    }
    return null;
}

function clearFoucs() {
    var { container } = PDFViewerApplication.pdfViewer;
    const allFocusEles = Array.from(container.querySelectorAll('.on-focus'));
    allFocusEles.forEach(ele => {
        removeClass(ele, 'on-focus');
    });
}

async function backFromTag() {
    // onLoading('返回原始标签位置');
    var { container } = PDFViewerApplication.pdfViewer;
    if (fromTag) {
        PDFViewerApplication.page = fromTag.pageIndex;

        const backBtnEle = document.querySelector('#back-focus');
        if (backBtnEle) {
            backBtnEle.style.display = 'none';
        }
        clearFoucs();

        // 须等页面加载并渲染完标签后执行
        setTimeout(() => {
            container = container.querySelector(`.page[data-page-number="${fromTag.pageIndex}"]>.textLayer`)
            const tagNode = container.querySelector(`[data-id="${fromTag.id}"]`);
            if (tagNode) {
                tagNode.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                    inline: "nearest"
                });
                
            }
            fromTag = null;
        }, 1500)
    }
    
}

// 定位到元素
function scrollToNode(obj, setTag=false) {
    // onLoading('正在定位');
    const { container } = PDFViewerApplication.pdfViewer;
    const pageIndex = obj.pageIndex;

    const foucsNodes = node => {
        addClass(node, 'on-focus');
        node.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest"
        });
        node.title = '返回原处';
        node.addEventListener('click', (evt) => {
            // console.log(node)
            backFromTag();
            evt.stopPropagation();
            evt.preventDefault();
        }, false);
        if (fromTag) {
            const backBtnEle = document.querySelector('#back-focus');
            if (backBtnEle) {
                backBtnEle.style.display = 'block';
            }
        }
        // onLoading();
    }
    const positionToEle = () => {
        if (obj.nodeIndex !== undefined) {
            const pageContainer = container.querySelector(`.page[data-page-number="${pageIndex}"]>.textLayer`);
            if (!obj.bindId) {
                const spanNodes = Array.from(pageContainer.querySelectorAll('span[role="presentation"]'));
                for (let i=0; i<spanNodes.length; i++) {
                    let node = spanNodes[i];
                    if (i === obj.nodeIndex) {
                        foucsNodes(node);
                        break;
                    }
                }
            } else {
                let node = pageContainer.querySelector(`[data-outlineid="${obj.bindId}"]`) || pageContainer.querySelector(`[data-id="${obj.bindId}"]`);
                if (node) {
                    if (setTag) {
                        node.dataset.id = obj.id;
                    } else {
                        foucsNodes(node);
                    }
                }
            }
        }
    }

    if (PDFViewerApplication.page !== pageIndex) {
        PDFViewerApplication.page = pageIndex;
    }

    clearFoucs();

    setTimeout(() => {
        positionToEle();
    }, 1000)
}

// 章节条款定位标签ID
function setOutlineTag() {
    if (pdfStructData && pdfStructData.outline) {
        try {
            const { container } = PDFViewerApplication.pdfViewer;
            const page = Number(PDFViewerApplication.page);
            const pageContainer = container.querySelector(`.page[data-page-number="${page}"]>.textLayer`);
            if (pageContainer) {
                const spanNodes = Array.from(pageContainer.querySelectorAll('span[role="presentation"]'));
                const outlineList = pdfStructData.outline.filter(obj => { return obj.pageIndex === page });
                for (var item of outlineList) {
                    for (let i=0; i<spanNodes.length; i++) {
                        let node = spanNodes[i];
                        if (i === item.nodeIndex && item.id) {
                            node.dataset.outlineid = item.id;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('setOutlineTag error', error);
        }
    }
}


function getPageContent(pageNumber = 1) {
    const { pdfViewer } = PDFViewerApplication;
    var viewContainer = pdfViewer.container;// document.body.querySelector('#viewer');
    var pageContainer = viewContainer.querySelector(`.page[data-page-number="${pageNumber}"]>.textLayer`);
    var canvas = viewContainer.querySelector(`.page[data-page-number="${pageNumber}"] canvas`); // canvas 画布
    var strArr = [];
    // debugger
    if (pageContainer) {
        // 输出图片 canvas.getContext('2d')
        var imgBase64 = canvas.toDataURL("image/png");
        // console.log(context)
        var isCatalogue = false;
        var childNode = Array.from(pageContainer.childNodes);
        var splitNode = (index, callBack) => {
            var spanStr = [];
            for (let i = index; i < childNode.length; i++) {
                let node = childNode[i];
                let nodeStyle = window.getComputedStyle(node);
                var text = node.textContent;
                if (node.nodeName === 'BR' && node.getAttribute('role') && node.getAttribute('role') === 'presentation') { // 换行
                    strArr.push(_.orderBy(spanStr, ['left']));
                    splitNode(i + 1);
                    break;
                } else if (node.className === 'markedContent') {
                    strArr.push(_.orderBy(spanStr, ['left']));
                    // strArr.push([text]);
                    splitNode(i + 1);
                    break;
                } else if (node.className === 'endOfContent' || !node.nextElementSibling) {
                    strArr.push(_.orderBy(spanStr, ['left']));
                    break;
                } else {
                    spanStr.push({
                        text,
                        top: parseFloat(nodeStyle.top),
                        left: parseFloat(nodeStyle.left),
                    });
                }
            }
            return spanStr;
        }
        splitNode(0);
    }

    return strArr;
}

function blobToBase64(blob_data, callback) {
    let reader = new FileReader();
    reader.onload = (e) => {
        if (callback) {
            callback(e.target.result);
        }
    }
    reader.readAsDataURL(blob_data)
}

function onLoading(str = '') {
    var maskEle = document.getElementById('loading-mask');
    var className = str === '' ? 'hidden' : '';
    var exportEle = maskEle.querySelector('#export-page');
    maskEle.className = className;
    exportEle.innerHTML = str;
}

function bolbToUpload(file = {}) {
    onLoading('正在上传PDF文档中...');
    const url = serverUrl || window.location.origin;
    var formData = new FormData();
    formData.append("file", file);
    formData.append('filename', file.name);

    return new Promise((resolve, reject) => {
        $.ajax({
            method: 'POST',
            url: url + '/file',
            data: formData,
            processData: false,
            contentType: false,
            dataType: "json",
            xhr: () => {
                var xhr = new XMLHttpRequest();
                xhr.upload.addEventListener('progress', (e) => {
                    var progressRate = Math.floor((e.loaded / e.total)) * 100 + '%';
                    onLoading("上传文件中:" + progressRate);
                })
                return xhr;
            },
            success: (res) => {
                let pdfAddr;
                if (res.error_code === 200 && res.data) {
                    pdfAddr = url + '/files/' + res.data[0]['outFile'];
                    // console.log(pdfAddr);
                } else {
                    alert('文件上传失败！');
                }
                resolve(pdfAddr);
                onLoading();
            }
        })
    })
}

function closePage() {
    var thumbnailViewChilds = Array.from(document.querySelectorAll('#thumbnailView >a'));
    removeNode(thumbnailViewChilds);

    var outlineViewChilds = Array.from(document.querySelectorAll('#outlineView >div'));
    removeNode(outlineViewChilds);

    var pageViewChilds = Array.from(document.querySelectorAll('#viewer >div'));
    removeNode(pageViewChilds);

}
function removeNode(nodes) {
    for (var i = 0; i < nodes.length; i++) {
        if (i >= limitPage) {
            nodes[i].remove();
        }
    }
}


// 关闭PDF阅读器
function quitViewer() {
    postMsg({ act: 'quit' });
}

function postMsg(data = {}) {
    if (window.parent) {
        window.parent.postMessage(data, '*');
    }
}

function isMobileOs() {
    return navigator.userAgent.toLowerCase().indexOf('mobile') > -1;
}


function getRangeSelectedNodes(range) {
    var node = range.startContainer;
    var endNode = range.endContainer;

    // Special case for a range that is contained within a single node
    if (node == endNode) {
        let spanNode = getParent(node, 'SPAN');
        if (spanNode && spanNode.getAttribute('role') && spanNode.getAttribute('role') === 'presentation') {
            return [spanNode];
        }
        return [node];
    }

    // Iterate nodes until we hit the end container
    var rangeNodes = [];
    while (node && node != endNode) {
        rangeNodes.push(node = nextNode(node));
    }

    // Add partially selected nodes at the start of the range
    node = range.startContainer;
    while (node && node != range.commonAncestorContainer) {
        rangeNodes.unshift(node);
        node = node.parentElement;
    }

    return rangeNodes.filter(node => {
        return node && node.nodeName === 'SPAN' && !hasClass(node, 'markedContent');
    })

    // return rangeNodes;
}
function nextNode(node) {
    if (node.hasChildNodes()) {
        return node.firstChild;
    } else {
        while (node && !node.nextElementSibling) {
            node = node.parentElement;
        }
        if (!node) {
            return null;
        }
        return node.nextElementSibling;
    }
}

function getSelectedNodes() {
    if (window.getSelection) {
        var sel = window.getSelection();
        if (!sel.isCollapsed) {
            return getRangeSelectedNodes(sel.getRangeAt(0));
        }
    }
    return [];
}

function getPages(node) {
    if (!node || !node.nodeName) {
        return -1;
    } else {
        if (node.nodeName === 'DIV' && node.className === 'page') {
            return Number(node.dataset.pageNumber);
        } else {
            return getPages(node.parentElement);
        }
    }
}

async function getDecryptUrl(url) {
    var PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----MIICXQIBAAKBgQCK3siV2MKl7ADFMajEsbc/ZrSTfo9h37c6+m0cUHOTqGR4V+Ugzc5Wzpcrz6QGu7/umQBJRC3LZ8xRW8+J6Z1lI0+Tr6LT8NfLUeyBTBXkBI1j0BIzmEjsW/a1vDr2ahXn1RFvtnHeKs41lbICkY7mRA2cAyiMWhrteM1d1MR3gQIDAQABAoGACUU8ELzKqbbqij95a8ANYp8hmOMPAVKk8bv8ArLgNFA+fMYpVppGlwbtkpAm/AgWlQADw+BYSkbgneHKJgPBbQB+G8/AmMY/u3KIFS4wJifaIAv2evDlFqtw2zI6bG7bg65YF9AS1l9B+O3IdqMDNBKqQYiItx1A/SfogAXJctECQQDeIzh3k8mkzyMelxrFY5kJ5u+ydse82nOmawxo3kS/WEZh2jadeUdAXvXDhXrQ4O1t8zrG4gY6sAq43KqeouBdAkEAoAobkEY/M/Rtya8tomm3Dg9+Hc9yNphVr8fG3tLpphALuGSP+0Qp9ONyoC4G71MnIPtqBl6JDNzKARY2NUjRdQJBANw/57kIW6KBjrzB7dVRD2h2BavZgemKX6jd8wv3dgqSqBZVmllA6pi0jtEyA7gfjMq7o8eWS77c1YS9pp5ruDECQQCJEp8xHzmbAkvWZpgrd2g2PsbCOZ+VazxY5j9LMlK0zSF8uYUorOVSvky7LTD7Yrks4qmY8vdncOQDskaTtN7RAkBc/3Brhc5eG0/XHqKrATY+H0GD/muzpLSLuDXVjgqhlEYH3FAsW+VP5dQ6AuzW+wkFDbztdvr5MF9Mluyxc3Fe-----END RSA PRIVATE KEY-----`;
    return new Promise((resolve, reject) => {
        $.getScript("../build/jsencrypt.js", function () {
            var decrypt = new JSEncrypt();
            decrypt.setPrivateKey(PRIVATE_KEY);
            if (typeof url === 'object') {
                let str = [];
                url.forEach(txt => {
                    txt = decrypt.decrypt(txt);
                    if (txt.includes('http')) {
                        txt += '/';
                    }
                    str.push(txt);
                })
                url = str.join('/');
            } else {
                url = decrypt.decrypt(url);
            }
            resolve(url);
        })
    })
}

async function loadPdf(event) {
    loadedCount = 0;
    PDFViewerApplication.limitPage = event.data.limit || 0;

    // 执行加载
    var file = event.data?.file;
    if (file) {
        if (typeof file === 'object') {
            file = await getDecryptUrl(file);
        } else {
            if (file.match(/\application/i) === null && file.match(/^\http|https/i) === null) {
                file = await getDecryptUrl(file);
            }
        }
    }
    
    // debugger
    // console.log('disableOpts==>', event.data)

    const disableOpts = event.data?.disable || [];
    // 删除相关操作按钮
    if (disableOpts) {
        // debugger
        var container = document.getElementById('toolbarViewer');
        disableOpts.forEach(str => {
            let ele = container.querySelector(`#${str}`);
            if (ele) {
                ele.remove();
            }
            if (str === 'print') {
                disablePrint = true;
            }
        })
    }
    PDFViewerApplication.download = !disableOpts.includes('download');
    PDFViewerApplication.open(file);

    // 切换到演示模式按钮
    var presentationModeEle = document.getElementById('presentationMode');
    if (presentationModeEle) {
        let cls = presentationModeEle.className;
        cls = cls.replace(/\hidden/g, '');
        presentationModeEle.className = cls;
    }
    // 导出文档按钮
    var dataEle = document.getElementById('btn-data');
    if (dataEle) {
        if (!event.data.export) {
            dataEle.remove();
        } else {
            dataEle.className = '';
            PDFViewerApplication.parsePdf = true;
        }
    }
    
    // 水印
    if (event.data.waterMask) {
        waterMaskText = event.data.waterMask.text;
        waterMaskImage = event.data.waterMask.image;
        if (event.data.waterMask.size) {
            waterMaskSize = event.data.waterMask.size;
        }
        setTimeout(() => {
            addWaterMask();
        }, 2000)
    }
}

/**
 * @description 页面添加水印
 * @returns 
 */
function addWaterMask() {
    if (!waterMaskText && !waterMaskImage) {
        return;
    }
    var pages = document.getElementById('viewerContainer').querySelectorAll('.page');
    pages.forEach(page => {
        var maskEle = page.querySelector('.water-mask');
        if (!maskEle) {
            maskEle = document.createElement('div');
            maskEle.style.width = page.style.width;
            maskEle.style.height = page.style.height;
            maskEle.className = 'water-mask';
            // maskEle.innerHTML = `<p>${waterMaskText}</p>`;
            maskEle.innerHTML = '';
            var childElement = document.createElement('p');
            if (waterMaskText) {
                childElement.innerHTML = waterMaskText;
                if (waterMaskSize) {
                    childElement.style.fontSize = waterMaskSize;
                }
            } else if (waterMaskImage) {
                childElement.innerHTML = `<img src="${waterMaskImage}" />`;
                if (waterMaskSize) {
                    childElement.style.height = waterMaskSize;
                }
            }
            maskEle.appendChild(childElement);
            page.appendChild(maskEle);
        }
    })
}

function showPoper(rect, content) {
    var msgEle = document.body.querySelector('#pop-msg');
    if (!msgEle) {
        msgEle = document.createElement("div");
        msgEle.id = 'pop-msg';
        document.body.appendChild(msgEle)
    }
    msgEle.innerHTML = content;
    msgEle.style.display = 'block';
    
    msgEle.style.left = (rect.left - 20) + 'px';
    msgEle.style.top = (rect.top - msgEle.offsetHeight - 10) + 'px';
}

function hidePoper() {
    var msgEle = document.body.querySelector('#pop-msg');
    if (msgEle) {
        msgEle.style.display = 'none';
    }
}

function clearHighlightRect() {
    const { container } = PDFViewerApplication.pdfViewer;
    const highlightContainers = container.querySelectorAll('div.highlight-container');
    highlightContainers.forEach(ele => {
        ele.remove();
    })
}

// 根据position高亮框选文字
async function highlightRect(data) {
    const { container, currentScale } = PDFViewerApplication.pdfViewer;
    // debugger
    let pageContainer = container.querySelector(`.page[data-page-number="${data.page}"]`); // >.textLayer
    // 滚动到页面
    if (PDFViewerApplication.page != data.page) { // && data.focus
        PDFViewerApplication.page = data.page;
    }

    if (data.clearAll) {
        clearHighlightRect();
    }
    
    if (pageContainer) {
        await sleep(100);

        let highlightContainer = pageContainer.querySelector('div.highlight-container');
        if (!highlightContainer) {
            highlightContainer = document.createElement('div');
            highlightContainer.className = 'highlight-container ' + (data.cls ||'');
            pageContainer.appendChild(highlightContainer);
        }
        if (data.focus) {
            const focusEle = highlightContainer.querySelectorAll('span.in_focus');
            focusEle.forEach(ele => {
                removeClass(ele, 'in_focus');
            })
        }

        // debugger
        if (data.position) {
            let rectGroup = data.position.split('||');
            rectGroup = _.uniq(rectGroup);
            let i = 0;
            let arr = []
            for (const g of rectGroup) {
                const rect = g.split(',').map(s => { return Number(s); });
                arr.push(rect);

                let spanEle = document.querySelector(`span[data-pos="${g}"]`);
                if (!spanEle) {
                    // 定义矩形选框
                    let left = Math.floor(rect[0] * currentScale);
                    let top = Math.floor(rect[1] * currentScale);
                    let width = Math.floor((rect[2] - rect[0]) * currentScale);
                    let height = Math.floor((rect[3] - rect[1]) * currentScale);
                    if (i > 0) {
                        top = Math.floor(arr[i-1][3] * currentScale);
                        width = Math.floor(Math.abs(rect[0] - arr[i-1][2]) * currentScale);
                        height = Math.floor((rect[3] - arr[i-1][3]) * currentScale);
                    }

                    spanEle = document.createElement('span');
                    spanEle.dataset.pos = g;
                    spanEle.style.left = left + 'px';
                    spanEle.style.top = top + 'px';
                    spanEle.style.width = width + 'px';
                    spanEle.style.height = height + 'px';
                    highlightContainer.appendChild(spanEle);
                }

                // 定位到具体元素
                if (data.focus && i === 0) {
                    addClass(spanEle, 'in_focus');
                    spanEle.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                        inline: "nearest"
                    });
                }
                i++;
            }

            if (data.cls && data.cls === 'in-active' && highlightContainer) {
                setTimeout(() => {
                    highlightContainer.remove();
                }, 3500);
            }
        }
    }
    
}
// 根据文字关键字高亮显示
async function highlightTextByKeyword(keyword='', cls='') {
    return new Promise((resolve, reject) => {
        const pagesCount = PDFViewerApplication.pagesCount;
        const maxRetries = 60;
        const eventHandler = (source) => {
            let retries = 0;
            const checkMatches = () => {
                setTimeout(() => {
                    try {
                        if (source.source._pageMatches.length === pagesCount) {
                            PDFViewerApplication.eventBus.off('updatefindcontrolstate', eventHandler);
                            resolve(source);
                        } else if (retries < maxRetries) {
                            retries++;
                            checkMatches();
                        } else {
                            PDFViewerApplication.eventBus.off('updatefindcontrolstate', eventHandler);
                            reject();
                        }
                    } catch (error) {
                        console.error('highlightTextByKeyword catch error', error)
                    }
                }, 300);
            }
            checkMatches();
        }
        // 设置监听器
        PDFViewerApplication.eventBus.on('updatefindcontrolstate', eventHandler);

        // 设置搜索参数
        const eventState = {
            type: 'highlightallchange',
            query: keyword,
            caseSensitive: false,
            entireWord: false,
            findPrevious: false,
            matchDiacritics: false,
            highlightAll: true,
        }
        PDFViewerApplication.eventBus.dispatch('find', eventState);

        setTimeout(() => {
            if (cls) {
                const allLighlightEles = document.querySelectorAll('.highlight');
                allLighlightEles.forEach(ele => {
                    if (hasClass(ele, 'selected')) {
                        ele.classList.remove('selected');
                    }
                    addClass(ele, cls);
                })
            } else {
                document.querySelector(`.highlight.selected`).classList.remove('selected'); // 高亮统一格式
            }
        }, 500)
    })
}

/**
 * @description 高亮显示
 * @returns 
 */
async function highlightText(data={}, flag=false) {
    // 取消所有选中的文本
    window.getSelection().removeAllRanges();

    const regEvent = (node, tag={}) => {
        node.onmouseover = (evt) => {
            evt.stopPropagation();
            evt.preventDefault();
            var rect = evt.target.parentNode.getBoundingClientRect();
            var msg =  evt.target.dataset.label || '';
            if (msg) {
                showPoper({ left:evt.pageX, top:rect.top }, msg)
            }
            
        }
        node.onmouseleave = (evt) => {
            evt.stopPropagation();
            evt.preventDefault();
            hidePoper();
        }
        node.onclick = (evt) => {
            evt.stopPropagation();
            evt.preventDefault();
            var url =  evt.target.dataset.tag || '';
            var link = evt.target.dataset.link || '';
            if (url && link && ['anchor','link'].includes(url)) {
                alert('这里是链接跳转！待完善=>' + link)
            }
        }
    }
    if (PDFViewerApplication.page != data.selected.pageIdx) {
        PDFViewerApplication.page = Number(data.selected.pageIdx);
        await sleep(1000);
    }

    const pageContainer = document.body.querySelector(`[data-page-number="${data.selected.pageIdx}"]>.textLayer`);
    if (pageContainer) {
        const spanNodes = Array.from(pageContainer.querySelectorAll('span[role="presentation"]'));
        const selectionStrArr = _.flattenDepth(data.selected.selectionStrArr,Infinity)
        let index = 0;
        let cls = data.cls || 'temp-selected';
        if (!flag) {
            clearAllSelections('.' + cls);
        }
        
        for (let span of spanNodes) {
            let className = cls;
            let nodeIndex = getNodeIndex(span, pageContainer);
            if (!data.selected.selectArea.includes(nodeIndex)) {
                continue;
            }
            if (nodeIndex > _.last(data.selected.selectArea)) {
                return true;
            }

            let str = selectionStrArr[index];
            if (index === 0) {
                className += ' begin';
                if (!flag) {
                    span.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                        inline: "nearest"
                    });
                }
            }
            let dataTagSet = '', dataLabel = '';
            if (data.selected.tag) {
                dataTagSet = ` data-tag="${data.selected.tag.enName||data.selected.tag.tagName}"`;
                dataLabel = ` data-label="${data.selected.tag.remark||data.selected.tag.label||''}"`;
            }

            span.innerHTML = span.textContent.replace(str, `<em class="${className} ${data.onType||''}"${dataTagSet}${dataLabel}>${str}</em>`)
            regEvent(span.querySelector('em'), data.selected.tag);
            index++;
        }
    }

    return false;
}

// 根据条件选中文字
async function findNodeByText(data={}, isStruct=false, isNext=false) {
    var { findBar, pdfViewer, findController } = PDFViewerApplication;
    var isCurrPage = true;
    if (PDFViewerApplication.page !== data.pageIndex) {
        PDFViewerApplication.page = data.pageIndex;
        isCurrPage = false;
    }
    // 清除已存在的标签
    clearAllSelections('.highlight');
    
    if (!findBar.opened) {
        // findBar.close();
        findBar.open();
    }

    if (!isCurrPage) {
        isCurrPage = await sleep(500);
    }



    if (!isNext) {
        findBar.findField.value = data.text;
        findBar.caseSensitive.checked = true;
        findBar.highlightAll.checked = true;
        findBar.dispatchEvent("entirewordchange", false, data.text);
    } else {
        findBar.dispatchEvent("again", false);
    }

    await sleep(1000);
    
    const nodeParent = node => {
        let parentNode = node.parentElement;
        if (parentNode.nodeName !== 'SPAN') {
            parentNode = node;
        }
        return parentNode;
    }

    if (isCurrPage) {
        const pageContainer = pdfViewer.container.querySelector(`.page[data-page-number="${data.pageIndex}"]>.textLayer`);
        if (pageContainer) {
            const findNode = async (flag) => {
                if (findBar.findMsg.textContent.includes('文档末尾') && flag) {
                    return null;
                }

                var selectedNodes = Array.from(pageContainer.querySelectorAll('span.highlight')); // selected
                
                if (!selectedNodes.length) {
                    return null;
                }
                // console.log('findController==>', findController, findController._state); // findBar.findMsg.textContent.includes('文档末尾')

                selectedNodes = selectedNodes.filter(node => { 
                    let parentNode = nodeParent(node);
                    let pageNode = getParent(parentNode,'page');
                    return !parentNode.dataset.outlineid && !parentNode.dataset.putTag && pageNode.dataset.pageNumber == data.pageIndex;
                });


                if (!selectedNodes.length) {
                    return null;
                }
                // 分组
                var groupNodes = [], startIndex = 0;
                for (let node of selectedNodes) {
                    try {
                        if (hasClass(node,'begin') && !groupNodes[startIndex]) {
                            groupNodes[startIndex] = [node]
                        } else if (hasClass(node,'end')) {
                            groupNodes[startIndex].push(node);
                            startIndex++;
                        } else {
                            groupNodes[startIndex].push(node);
                        }
                    } catch(error) {
                        console.log('groupNodes error', error)
                    }

                }
                console.log(groupNodes);
                // debugger

                /* if (flag) {
                    debugger
                } */
                // var isBreak = false;
                const groupSelects = [];
                for (let group of groupNodes) {
                    try {
                        const selectArea = [], selectionStrArr = [], strPosition = [];
                        for (let node of group) {
                            let parentNode = nodeParent(node);
                            let pageNode = getParent(parentNode,'page');
                            if (pageNode.dataset.pageNumber != data.pageIndex) {
                                return null;
                            }

                            if ((parentNode.dataset.outlineid || parentNode.dataset.putTag)) {
                                // isBreak = true;
                                break;
                            }
                            parentNode.dataset.putTag = "1";
                            let nodeIndex = getNodeIndex(parentNode, pageContainer);

                            let prevEle = node.previousSibling;
                            let pos = 0;
                            if (prevEle && prevEle.nodeName === '#text') {
                                pos = prevEle.textContent.length;
                            }

                            selectionStrArr.push(node.textContent);
                            selectArea.push(nodeIndex);
                            strPosition.push(pos);
                        }
                        /*if (isBreak) {
                            break;
                        }*/
                        groupSelects.push({
                            pages: [data.pageIndex],
                            selectArea,
                            strPosition,
                            selectionStr: data.text,
                            selectionStrArr
                        })
                    } catch (error) {
                        console.log('findNode error', error)
                    }
                    
                }
                console.log(groupSelects)
                // debugger
                return groupSelects;
                /*return {
                    pages: [data.pageIndex],
                    selectArea,
                    strPosition,
                    selectionStr: data.text,
                    selectionStrArr
                }*/
            }
            // findBar.findField.value = "";
            return await findNode();
        }

        findBar.findField.value = "";
        return null;
    }
}

function clearAllSelections(cls, clearAll=false) {
    // 取消所有选中的文本
    if (window.getSelection) {
        window.getSelection().removeAllRanges();
    } else if (document.selection) {
        document.selection.empty();
    }

    cls = cls || '.highlight';
    var selectionNodes = Array.from(document.body.querySelectorAll(cls)); // ,.selection,.temp-selected,.selected
    // debugger
    for (let node of selectionNodes) {
        cls = cls.replace(/\./g,'');
        if (node.dataset && node.dataset.tag && showAllTag && !clearAll) {
            continue;
        }
        if (node.nodeName !== 'SPAN' && (hasClass(node, cls) || hasClass(node, 'appended'))) {
            let prevNode = node.previousElementSibling;
            let nextNode = node.nextElementSibling;
            let parentNode = node.parentNode;
            let finished = false;
            if (prevNode && prevNode.nodeName === '#text') {
                prevNode.textContent = prevNode.textContent + node.textContent;
                finished = true;
            } else if (nextNode && nextNode.nodeName === '#text') {
                nextNode.textContent = node.textContent + nextNode.textContent;
                finished = true;
            } else if (parentNode && (parentNode.nodeName === 'SPAN' || parentNode.nodeName === 'EM')) {
                let textNode = document.createTextNode(node.textContent);
                parentNode.insertBefore(textNode, node);
                removeClass(parentNode, cls);
                finished = true;
            }
            removeClass(node, cls);
            if (finished) {
                node.remove();
            }
        } else {
            removeClass(node, cls);
        }
    }
}

function onLoading(str='', precent='') {
    var maskEle = document.getElementById('loading-mask');
    var className = str === '' ? 'hidden' :'';
    var exportEle = maskEle.querySelector('#export-page');
    var precentEle = maskEle.querySelector('em');
    maskEle.className = className;
    exportEle.innerHTML = str;
    if (precent) {
        precentEle.innerHTML = precent;
    }
    sysLoading = str !== '';
}

var currentPage = 0;
var setTaging = false;

function pdfScrollToPage(pageData) {
    if (currentPage !== PDFViewerApplication.page && !sysLoading) {
        currentPage = PDFViewerApplication.page;
        postMsg({ act: 'scrollPage', page:PDFViewerApplication.page});
    }
}

function hideTagContextmenu() {
    var tagContextmenu = document.body.querySelector('#tag-context-menu');
    if (tagContextmenu) {
        tagContextmenu.style.display = "none";
    }
}

function showTagContextmenu(evt, tagId, callBack) {
    var tagContextmenu = document.body.querySelector('#tag-context-menu');
    if (!tagContextmenu) {
        tagContextmenu = document.createElement('div');
        tagContextmenu.id = 'tag-context-menu';
        tagContextmenu.textContent = `移除标签[${evt.target.dataset.value}]`;
        // debugger
        document.body.appendChild(tagContextmenu);

        tagContextmenu.onclick = e => {
            e.stopPropagation();
            e.preventDefault();
            /*const result = confirm("确定要移除吗？");
            if (result) {
                let dataId = tagContextmenu.dataset.id;
                hideTagContextmenu();
                callBack && callBack(dataId);
            }*/
            let dataId = tagContextmenu.dataset.id;
            hideTagContextmenu();
            callBack && callBack(dataId);
            return true;
        }
    }
    tagContextmenu.dataset.id = tagId;
    tagContextmenu.style.display = "block";
    tagContextmenu.style.left = evt.pageX + 'px';
    tagContextmenu.style.top = evt.pageY + 'px';
}

// 根据标签数据选中文字
async function setSelection(data, page=1, cls='', isAdmin=false) {
    setTaging = true;
    // 定位到页面以渲染内容
    page = page || parseInt(data.pages[0]);
    if (PDFViewerApplication.page !== page) {
        PDFViewerApplication.page = page;
        
    }
    // 清除所有高亮选中的元素样式
    window.getSelection().removeAllRanges();
    // clearAllSelections('.selection');

    await sleep(750);

    // 主体容器
    // const { pdfViewer } = PDFViewerApplication;
    // 父级页面
    // const pageLayer = pdfViewer.container.querySelector(`.page[data-page-number="${page}"]>.textLayer`);
    const pageLayer = document.body.querySelector(`.page[data-page-number="${page}"]>.textLayer`);

    const removeTag = tagId => {
        const emNodes = Array.from(document.body.querySelectorAll(`em[data-id="${tagId}"]`));
        emNodes.forEach(node => {
            let prevNode = node.previousSibling;
            let nextNode = node.nextSibling;
            if (prevNode && prevNode.nodeName === '#text' && prevNode.textContent !== '') {
                prevNode.textContent = prevNode.textContent + node.textContent;
            } else if (nextNode && nextNode.nodeName === '#text' && nextNode.textContent !== '') {
                nextNode.textContent = node.textContent + nextNode.textContent;
            } else {
                node.parentNode.textContent = node.textContent;
            }
            node.remove();
        });
        var tagIndex = _.findIndex(tagData, { id:tagId });
        if (!!~tagIndex) {
            tagData.splice(tagIndex, 1);
            postMsg({ act: 'removeTag', tagData });
        }
        // dtC8QsEnm3F7CNZMW6xtjJJhFsZ4mwhG
    }

    const regEvent = node => {
        if (!node) {
            return;
        }
        node.onmouseover = (evt) => {
            let targetNode = evt.target;
            let rect = targetNode.parentNode.getBoundingClientRect();
            let msg = targetNode.dataset.value || '弹出信息框';
            if (targetNode.dataset.tag === 'link') {
                msg = '外链：' + msg;
            } else if (targetNode.dataset.tag === 'anchor') {
                msg = '内链：' + msg;
            }
            showPoper({ left:evt.pageX, top:rect.top }, msg);
            evt.stopPropagation();
            evt.preventDefault();
        }
        node.onmouseleave = (evt) => {
            hidePoper();
            evt.stopPropagation();
            evt.preventDefault();
        }
        node.onclick = evt => {
            let targetNode = evt.target;
            let tag = targetNode.dataset.tag;
            let tagId = targetNode.dataset.id;
            let bindId = targetNode.dataset.bind;
            let value = targetNode.dataset.value;
            // 如果是内链的
            if (tag === 'anchor' && bindId) {
                let targetItem = _.find(pdfStructData.outline, o => { return o.id === bindId });
                if (targetItem) {
                    targetItem.bindId = bindId;
                    fromTag = { pageIndex:PDFViewerApplication.page, id:tagId, value };
                    scrollToNode(targetItem);
                }
            } else {
                postMsg({ act: 'tagClick', data:{ tag, value, bind:bindId } })
            }
            evt.stopPropagation();
            evt.preventDefault();
        }
        node.oncontextmenu = evt => {
            let targetNode = evt.target;
            showTagContextmenu(evt, targetNode.dataset.id, (id) => {
                removeTag(id);
            })
            evt.stopPropagation();
            evt.preventDefault();
            return false;
        }
    }

    const childNodes = Array.from(pageLayer.querySelectorAll('span[role="presentation"]')); // :scope>span
    

    var selectionStrArr = [];
    data.selectionStrArr.forEach(strArr => {
        if (_.isArray(strArr)) {
            strArr.forEach(str => {
                selectionStrArr.push(str)
            })
        } else {
            selectionStrArr.push(strArr)
        }
    })
    for (let i=0; i<data.selectArea.length; i++) {
        let begin = i === 0 ? ' begin' : '';
        let spanIndex = data.selectArea[i];
        let spanNode = childNodes[spanIndex];
        if (spanNode) {
            let text = selectionStrArr[i];
            if (_.isArray(text)) {
                text = text[0];
            }
            if (text && text.replace(/\s/g,'') !== '') {
                text = text.replace(/[\(|)]/g,'');
            }
            if (!spanNode.querySelector('em')) {
                if (text) {
                    let bind = data.bind ? `data-bind="${data.bind}"` : '';
                    spanNode.innerHTML = spanNode.innerHTML.replace(new RegExp(text, 'i'),`<em class="selection${begin} ${cls}" data-id="${data.id||guid()}" data-tag="${data.tag.enName}" ${bind} data-value="${data.remark||data.tag.label}">${text}</em>`);
                    regEvent(spanNode.querySelector('em'));
                }
            } else {
                // 重叠标签
                let emNodes = Array.from(spanNode.querySelectorAll('em'));
                emNodes.forEach(em => {
                    let value = data.remark || data.tag.label;
                    if (value !== em.dataset.value) {
                        let enText = em.textContent.replace(/\s/g,'');
                        if (enText.includes(text)) {
                            let bind = data.bind ? `data-bind="${data.bind}"` : '';
                            em.innerHTML = em.innerHTML.replace(new RegExp(text, 'i'),`<em class="selection${begin} ${cls}" data-id="${data.id||guid()}" data-tag="${data.tag.enName}" ${bind} data-value="${data.remark||data.tag.label}">${text}</em>`);
                            regEvent(em.querySelector('em'));
                        }
                    }
                })
            }
        }
    }
    setTaging = false;
}

function addClass(ele, cls) {
    if (!hasClass(ele, cls)) {
        ele.className = ele.className == '' ? cls : ele.className + ' ' + cls;
    }
}

function removeClass(ele, cls) {
    if (this.hasClass(ele, cls)) {
        let newClass = ' ' + ele.className.replace(/[\t\r\n]/g, '') + ' ';
        while (newClass.indexOf(' ' + cls + ' ') >= 0) {
            newClass = newClass.replace(' ' + cls + ' ', ' ');
        }
        ele.className = newClass.replace(/^\s+|\s+$/g, '');
    }
}

function hasClass(ele, cls) {
    cls = cls || '';
    if (!ele) {
        return false;
    }
    if (cls.replace(/\s/g, '').length == 0 || !ele.className) return false; //当cls没有参数时，返回false
    return new RegExp(' ' + cls + ' ').test(' ' + ele.className + ' ');
}

function transAlphabet(str) {
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

// 全角半角互转 iCase: 0全到半，1半到全，其他不转化
function chgCase(sStr, iCase = 0) {
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



function getParent(ele, selector) {
    const getpNode = element => {
        if(element) {
            //创建父级节点的类数组
            let pNode = element.parentElement;
            if(pNode && (hasClass(pNode, selector) || pNode.nodeName === selector.toUpperCase())) {
                return pNode;
            } else {
                return getpNode(pNode);
            }
        }
    }
    return getpNode(ele);
}

function getNodeIndex(ele, parentNode) {
    if (ele && parentNode) {
        var childNodes = Array.from(parentNode.querySelectorAll('span[role="presentation"]'));
        for (let i=0; i<childNodes.length; i++) {
            let node = childNodes[i];
            if (ele === node) {
                return i;
            }
        }
    }
    return -1;
}

function getSiblingNodes(currNode, isAll=false, scanTag=false) {
    const checkIsSpanNode = node => {
        return node.nodeName === 'SPAN' && ((node.getAttribute('role') && node.getAttribute('role') === 'presentation') || node.className === 'markedContent');
    }
    const nodes = [];
    if (checkIsSpanNode(currNode)) {
        const pages = [];
        const selectArea = [];
        const selectionStr = [];
        const strPosition = [];
        const selectionStrArr = [];
        const parentNode = currNode.parentNode;

        const pageContainer = getParent(parentNode, 'page');
        var minLeft = pageContainer.dataset.minLeft;
        if (!minLeft) {
            minLeft = setPageMinLeft(pageContainer)
        }
        var firstNodeLeft, firstNodeTop;
        pages.push(Number(pageContainer.dataset.pageNumber));

        // 找出第一个节点
        const findFirstNode = (node) => {
            let prevNode = node.previousElementSibling;
            if (prevNode && checkIsSpanNode(prevNode)) {
                return findFirstNode(prevNode)
            } else {
                return node;
            }
        }
        const getNodes = node => {
            let nextNode = node.nextElementSibling;
            if (nextNode && checkIsSpanNode(nextNode)) {
                nodes.push(nextNode);
                getNodes(nextNode);
            } else if (nextNode && nextNode.nodeName === 'BR' && isAll) { //  && isAll
                nextNode = nextNode.nextElementSibling;
                let left = parseFloat(nextNode.style.left);
                let top = parseFloat(nextNode.style.top);
                if (nextNode && checkIsSpanNode(nextNode) && (firstNodeLeft - left) > 14 && (firstNodeLeft - left) <= 14*2 && (top - firstNodeTop) <= 14*2 ) {
                    nodes.push(nextNode);
                    getNodes(nextNode);
                }
            }
        }

        const startNode = findFirstNode(currNode);
        
        if (startNode) {
            firstNodeLeft = parseFloat(startNode.style.left);
            firstNodeTop = parseFloat(startNode.style.top);
            nodes.push(startNode)
            getNodes(startNode)
        }

        nodes.forEach(ele => {
            if (ele.textContent.replace(/\s/g,'') !== '') {
                addClass(ele, 'temp-selected');
            }
            let nodeIndex = getNodeIndex(ele, parentNode);
            // ele.dataset.nodeIndex = nodeIndex;
            selectArea.push(nodeIndex);
            selectionStr.push(ele.textContent);
            strPosition.push(0);
        })

        selectionStrArr.push(selectionStr);

        const selectionObj = { selectionStr:selectionStr.join(""), pages: _.uniq(pages), strPosition, selectionStrArr, selectArea:_.uniq(selectArea) };
        if (!scanTag) {
            // 显示tooltip工具条
            var rect = startNode.getBoundingClientRect();
            showPdfTools(rect.left, rect.top);
            // 上报事件
            postMsg({ act: 'selection', ...selectionObj }); 
        } else {
            scanTagByNodes(selectionObj);
        }
    }
}

function scanTagByNodes(selectionObj) {
    const pdfParser = new pdf_parser();
    // const tagList = [];
    const spanNodes = Array.from(document.body.querySelectorAll('span.temp-selected'));
    const getSlectArea = (str) => {
        let area = [], appnedStr = '';
        for (let node of spanNodes) {
            let text = node.textContent;
            if (str.includes(text) && text.replace(/\s/g,'') !== '') { //  
                let parentNode = getParent(node, 'textLayer');
                let nodeIndex = getNodeIndex(node, parentNode);
                if (appnedStr !== str.replace(/\s/g,'')) {
                    appnedStr += text;
                    area.push({
                        index:nodeIndex,
                        text
                    });
                }
            }
        }
        return area;
    }
    var selectionStr = selectionObj.selectionStr.split('、');
    var isAdded = false;
    selectionStr.forEach(nodeText => {
        var result = pdfParser.getStdTags(nodeText);
        if (result && result.length) {
            for (tag of result) {
                let selectArea = getSlectArea(tag.sourceText);
                if (selectArea && selectArea.length) {
                    selectionObj.selectArea = [];
                    selectionObj.selectionStrArr = []
                    selectionObj.selectionStr = '';//tag.sourceText;
                    selectArea.forEach(o => {
                        selectionObj.selectArea.push(o.index);
                        selectionObj.selectionStrArr.push(o.text)
                        selectionObj.selectionStr += o.text;
                    })
                    var data = {
                        id: guid(),
                        label: tag['label'] || tag.tag['label'],
                        tag: tag['tag'],
                        ...selectionObj
                    }
                    // 避免标签重复
                    var tagIndex = _.findIndex(tagData, { label:data.label, pages:data.pages });
                    if (!~tagIndex) {
                        tagData.push(data);
                        isAdded = true;
                    }
                }
            }
        }
    })

    // console.log('scanTagByNodes tagList', tagData);
    clearAllSelections('.temp-selected');
    if (tagList.length && isAdded) {
        appendTags(pdfAdmin);
        postMsg({ act: 'appendTag', tagData });
    }
    toolBtnContainer.style.display = 'none';
}

function showPdfTools(x,y) {
    if (toolBtnContainer && showAllTag) {
        setTimeout(() => {
            toolBtnContainer.style.display = 'block';
            toolBtnContainer.style.left = x + 'px';
            toolBtnContainer.style.top = (y-30) + 'px';
        }, 300);
    }
}

async function getTagData(isUpdate=false)  {
    const url = serverUrl || window.location.origin;
    const params = {
        operation: 'listData',
        tn: 'tagStruct',
        data: {
            stdId: pdfStdId
        }
    }
    const { code, data } = await $.ajax({
        method: 'POST',
        url: url + '/mgApi',
        data: JSON.stringify(params),
        dataType: "json",
        contentType: 'application/json;charset=utf-8',
        timeout: 10 * 60 * 60
    });
    if (code === 200 && data) {
        tagData = data.list;
        console.log('tagData==================>',tagData)
        if (isUpdate) {
            appendTags(pdfAdmin);
        }
    }
    return tagData;
}

async function getTagList() {
    const url = serverUrl || window.location.origin;
    const params = {
        operation: 'listData',
        tn: 'tag',
    }
    const { code, data } = await $.ajax({
        method: 'POST',
        url: url + '/mgApi',
        data: JSON.stringify(params),
        dataType: "json",
        contentType: 'application/json;charset=utf-8',
        timeout: 10 * 60 * 60
    })

    if (code === 200 && data) {
        tagList = data.list;
        console.log('tagList====>', tagList)
    }
    return tagList;
}

async function sleep(timeSeconds) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, timeSeconds);
    })
}

/*async function getPdfOutlines(stdId, resetTag=false) {
    var url = serverUrl || window.location.origin;
    const { code, data } = await $.ajax({
        method: 'POST',
        url: url + '/mgApi',
        data: JSON.stringify({ operation:'getData', tn: 'pdfStruct', data:{ stdId } }),
        dataType: "json",
        contentType: 'application/json;charset=utf-8',
        timeout: 10 * 60 * 60 * 1000
    });
    if (code === 200 && data) {
        pdfOutlines = data.content.outline;
        resetOutlineView(pdfOutlines);
        if (resetTag) {
            appendTags(pdfAdmin)
        }
        return pdfOutlines;
    }
    return [];
}*/

function hideTags(clearComment=false) {
    // 清除系统标签
    var cls = `struct-tag`;
    clearAllSelections('.' + cls, true);
    // 清除用户标签
    if (clearComment) {
        clearAllSelections('.temp-selected', true);
    }
}

// 文档添加标签样式
async function appendTags(isAdmin=false, userComments=[], pageIndex) {
    const currPage = pageIndex || PDFViewerApplication.page;
    const cls = `struct-tag`;
    clearAllSelections('.' + cls, true);
    clearAllSelections('.temp-selected', true);
    var tags = tagData.filter(tag => { return tag.pages[0] == currPage }).map(o => {
        o.area = o.selectArea[0];
        o.strLens = o.selectionStr.length;
        return o;
    });
    if (tags.length) {
        tags = _.orderBy(tags, ['strLens','area'], ['desc','asc']);
        for(let i=0; i<tags.length; i++) {
            let tag = tags[i];
            delete tag.outlineId;
            setSelection(tag, currPage, cls, isAdmin); // _.omit(tag, ['outlineId'])
        }
    }
    // 用户批注等
    if (userComments && userComments.length) {
        const quickTools = [
            { label:'批注', act:'1', cls:'on-comment', type:0 },
            { label:'咨询', act:'2', cls:'on-feedback', type:1 },
            { label:'书签', act:'3', cls:'on-bookmark', type:2 },
        ]
        // clearAllSelections('.temp-selected');
        tags = userComments.filter(tag => { return tag.pages[0] == currPage });
        for(let i=0; i<tags.length; i++) {
            let tag = tags[i];
            let toolItem = _.find(quickTools, { type:tag.type });
            highlightText({
                text: tag.selectText || tag.text,
                title: toolItem.label,
                onType: toolItem.cls,
                selected: {
                    type: toolItem.cls,
                    tag: {
                        enName: toolItem.cls,
                        remark: tag.remark || ''
                    },
                    ...tag
                },
            });
        }
    }
    // 加上标签定位后返回操作按钮
    // var backFocusEle = document
}

function positionTag(currPage) {
    currPage = currPage || PDFViewerApplication.page;
    const tagItems = _.filter(tagList, { page:currPage });
    for (let item of tagItems) {
        let itemData = item.content.selection;
        itemData.value = item.value;
        itemData.tag = _.find(tagData, { id:item.tagId });
        setSelection(itemData, currPage);
    }
}

// 关闭弹出的tootip提示框
function closePoperMsg() {
    var msgEle = document.body.querySelector('#pop-msg');
    if (msgEle) {
        msgEle.style.display = 'none';
    }
}

// 页面元素最左边位置
function setPageMinLeft(pageContainer) {
    var minLeft = 10000;
    const spanNodes = Array.from(pageContainer.querySelectorAll('span[role="presentation"]'));
    spanNodes.forEach(span => {
        if (span.style.left && parseFloat(span.style.left) < minLeft) {
            minLeft = parseFloat(span.style.left);
        }
    });
    pageContainer.dataset.minLeft = minLeft;
    return minLeft;
}

function removeWaterMask(container) {
    var waterMaskELes = Array.from(container.querySelectorAll('span.markedContent'));
    waterMaskELes.forEach(ele => {
        let textContent = ele.textContent.replace(/\s/g,'');
        if (['www.weboos.com'].includes(textContent)) {
            // ele.remove();
            ele.style.display = 'none';
        }
    })
}

function findOutlineItem(node) {
    const getOutlineNode = currNode => {
        if (!currNode) {
            return undefined;
        }
        if (currNode.dataset.outlineid) {
            return currNode.dataset.outlineid;
        } else {
            return getOutlineNode(currNode.previousElementSibling);
        }
    }
    if (node && node.dataset.outlineid) {
        return node.dataset.outlineid;
    }

    return getOutlineNode(node.previousElementSibling);
}

function getUrlQuery() {
    var queryString = window.location.search;
    var queryParams = {};
    queryString.substring(1).split("&").forEach((pair) => {
        var keyValue = pair.split("=");
        queryParams[keyValue[0]] = decodeURIComponent(keyValue[1]);
    });
    return queryParams;
}

// 监听消息 */
window.onload = function () {
    // tooltip bar
    toolBtnContainer = document.getElementById('pdf-tools');
    // 主容器
    const pdfPageContainer = document.getElementById('viewerContainer'); 
    // 导出数据按钮
    var dataEle = document.getElementById('btn-data');
    // 右侧下拉菜单栏
    var secondaryToolbar = document.getElementById('secondaryToolbarToggle');
    // 右键菜单
    var contextMenu = document.getElementById('context-menu'); 
    // URL Params
    var queryParams = getUrlQuery();
    // console.log('keyword===>', queryParams.keyword)
    
    if (window.self !== window.top || queryParams.key === 'sam') {
        // PDFViewerApplication.limitPage = event.data.limit || 0;
        // console.log('queryParams==>', queryParams)
        // 限制页数
        if (queryParams.limit && Number(queryParams.limit) > 0) {
            PDFViewerApplication.limitPage = Number(queryParams.limit);
        }
		if (queryParams.closeSidebar) {
			closeSideBar = true;
		}
        // console.log('PDFViewerApplication', PDFViewerApplication.pdfViewer)
        // 接收父窗口消息
        window.addEventListener('message', event => {
            const eventData = event.data;
            if (!eventData) {
                return;
            }
            // console.log('viewer message', eventData);

            // 标签集合定义数据
            if (eventData.tagList) {
                tagList = eventData.tagList;
            }
            if (eventData.serverUrl) {
                serverUrl = eventData.serverUrl;
            }
            if (eventData.isAdmin) {
                pdfAdmin = true;
                addClass(pdfPageContainer, 'admin');
            }
            if (eventData.pdfStruct !== undefined) {
                pdfStructData = eventData.pdfStruct;
            }

            if (eventData.closeSidebar) { // 默认关闭左侧栏
                closeSideBar = true;
				PDFViewerApplication && PDFViewerApplication.pdfSidebar.close();
            }

            if (eventData.hideRightBar) { // 取消右侧工具栏
                const hideRightBar = document.querySelector('#toolbarViewerRight');
                if (hideRightBar) {
                    hideRightBar.remove();
                }
            }
            
            if (eventData.file !== undefined) { // PDF文档路径或文件流
                if (eventData.showTag && eventData.file) { // 显示所有标签
                    showAllTag = true;
                }
                // 渲染PDF tooltip工具
                if (eventData.quickTools && eventData.quickTools.length) {
                    toolBtnContainer.innerHTML = '';
                    for(let tool of event.data.quickTools) {
                        let toolEle = document.createElement('span');
                        toolEle.innerText = tool.label;
                        toolEle.dataset.act = tool.act;
                        toolEle.onclick = function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!_.isEmpty(pdfSelections)) {
                                highlightText({
                                    selected: { 
                                        pageIdx:pdfSelections.pages[0],
                                        ...pdfSelections
                                    }
                                })
                            }
                            postMsg({ act: 'toolBtn', event:tool.act });
                            toolBtnContainer.style.display = 'none';
                        }
                        toolBtnContainer.appendChild(toolEle);
                    }
                    let tagNode = contextMenu.querySelector('li[data-act="scanTag"]');
                    if (tagNode) {
                        if (eventData.export) {
                            tagNode.className = '';
                        } else {
                            tagNode.remove();
                        }
                    }
                    // 右键菜单点击
                    contextMenu.onclick = function(e) {
                        var act = e.target.dataset.act;
                        getSiblingNodes(rightClickEle, act === 'paragraph', act === 'scanTag');
                        closePoperMsg();
                        contextMenu.style.display = 'none';
                        e.preventDefault();
                        e.stopPropagation();
                    }
                } else {
                    if (toolBtnContainer) {
                        toolBtnContainer.remove();
                        toolBtnContainer = null;
                    }
                    if (contextMenu) {
                        contextMenu.remove();
                        contextMenu = null;
                    }
                }
                // 加载PDF文件
                loadPdf(event);
                return;
            } else if (eventData.scrollingTop) {
                scrollToTop(eventData.top)
                return;
            } else if (eventData.clearHighlightRect) {
                clearHighlightRect();
                return;
            } else if (eventData.highlightRect) { // 根据关键字高亮显示
                highlightRect(eventData);
                return;
            } else if (eventData.page) { // 定位页面
                if (PDFViewerApplication.page !== eventData.page) {
                    PDFViewerApplication.page = eventData.page;
                }
            } else if (eventData.updateOutline) {
                pdfStructData.outline = eventData.outline;
                resetOutlineView(eventData.outline);
                // getPdfOutlines(eventData.stdId);
                return;
            } else if (eventData.highlightKeyword) { // 根据关键字高亮显示
                highlightTextByKeyword(eventData.highlightKeyword, eventData.cls);
                return;
            
            } else if (eventData.find) { // 查询文字打开查询框
                PDFViewerApplication.findBar.toggle();
                return;
            } else if (eventData.highlightText) { // 文字高亮显示
                highlightText(event.data);
                return;
            } else if(eventData.findText) { // 查找
                findNodeByText(event.data)
                return;
            } else if (eventData.export) { // 导出数据
                var pdfExport = new pdf_export(event.data.export);
                pdfExport.init(event.data.url||event.data.pdfPath, resp => {
                    if (resp) {
                        postMsg({ act: 'exportData', event:event.data.export, data:resp });
                    }
                    pdfExport = null;
                })
                return;
            } else if (eventData.autoTag && eventData.data) { // 自动扫描标签
                var pdfParser = new pdf_parser(1);
                pdfParser.extractTag(eventData.data, eventData.setTag).then(res => {
                    clearAllSelections();
                    // 重新定位大纲章节的标签
                    if (pdfStructData && pdfStructData.outline) {
                        setOutlineTag();
                    }
                    postMsg({ act: 'updateTags', data:res }); // updatePageOutline
                    pdfParser = null;
                    PDFViewerApplication.page = 1;
                    // 显示标签
                    tagData = res;
                    showAllTag = true;
                    appendTags(pdfAdmin)
                });
                return;
            } else if (eventData.parse) { // 解析数据 pdfStructData
                let outlines = eventData.data?.outlines || [];
                if (outlines.length > 2) {
                    resetOutlineView(outlines);
                } else {
                    parseData(eventData.data);
                }
                return;
            } else  if (eventData.updateTag) { // 解析数据
                // getTagData(true);
                return;
            /*} else if (eventData.outlineList && eventData.stdId) { // 获取大纲
                getPdfOutlines(eventData.stdId, eventData.resetTag);
                return;*/
            } else if (eventData.appendTags && eventData.tags) {
                tagData = eventData.tags;
                showAllTag = eventData.show;
                if (eventData.show) {
                    appendTags(pdfAdmin, eventData.userComments, eventData.pageIndex);
                } else {
                    hideTags(eventData.userComments);
                }
                return;
            } else if (eventData.selectionStr) { // 选中的文字定位
                setSelection(event.data)
            }
        });

        if (isMobile) {
            dataEle && dataEle.remove();
            secondaryToolbar && secondaryToolbar.remove();
        }
        
        document.onkeydown = function(event) {
            ctrlKey = event.ctrlKey || event.metaKey;
        }
        document.onkeyup = function(e) {
            ctrlKey = false;
        }
        // 文本元素双击
        pdfPageContainer.ondblclick = function (evt) {
            if (!ctrlKey) {
                clearAllSelections();
            }
            let node = evt.target;
            if (node.parentNode && node.parentNode.className === 'markedContent') {
                node = node.parentNode;
            }
            // 获取当前相邻的兄弟节点
            getSiblingNodes(node);
            // 关闭弹出的提示框
            closePoperMsg();
            evt.preventDefault();
            evt.stopPropagation();
        }

        // 文本元素单击
        pdfPageContainer.onclick = function (evt) {
            let data = evt.target.dataset;
            if (data.tag && ['anchor','link'].includes(data.tag)) {
                postMsg({ act: 'click', tagId:data.id });
            }
            if (toolBtnContainer) {
                toolBtnContainer.style.display = 'none';
            }

            if (contextMenu) {
                contextMenu.style.display = 'none';
            }
            // 关闭标签右键菜单
            hideTagContextmenu();

            evt.preventDefault();
            evt.stopPropagation();
        }
    } else if (queryParams.file || queryParams.url) {
        // 直接加载URL的路径
        // const queryString = document.location.search.substring(1);
        // const params = (0, PDFViewerApplication._ui_utils.parseQueryString)(queryString);
        var pdfUrl = queryParams.file || queryParams.url;
        isLoading = queryParams.loading;
        dataEle && dataEle.remove();
        PDFViewerApplication.open(pdfUrl);
    } else {
        const newContent = "<html><head><title>404</title></head><body><h1>Not supported for individual browsing!</h1></body></html>";
        const parser = new DOMParser();
        const newDocument = parser.parseFromString(newContent, "text/html");
        // document.replaceChild(newDocument.documentElement, document.documentElement);
        return;
    }
    
    // 注册容器滚动事件
    pdfPageContainer.onscroll = function(e) {
        const currTop = e.target.scrollTop;
        if(toolBtnContainer) {
            toolBtnContainer.style.display = 'none';
        }
        // 去除水印
        removeWaterMask(pdfPageContainer);
        
        // 延迟处理事件
        setTimeout(() => {
            if (Math.abs(pdfPageTop - currTop) > 20) {
                pdfPageTop = e.target.scrollTop;
                postMsg({ act: 'scrollingTop', top:e.target.scrollTop, page:PDFViewerApplication.page }); // e.target.scrollTop
            }
            // 设置大纲的标签ID
            if (pdfStructData && pdfStructData.outline) {
                setOutlineTag();
            }
        }, 350) 
        
    }
    // 返回标签原位
    const backBtnEle = document.querySelector('#back-focus');
    if (backBtnEle) {
        backBtnEle.onclick = (e) => {
            backFromTag();
            e.stopPropagation();
            e.preventDefault();
        }
    }

    // 自定义鼠标右键菜单
    document.oncontextmenu = function(e) {
        // console.log(e.target);
        if (e.target.nodeName === 'SPAN' && e.target.getAttribute('role') && e.target.getAttribute('role') === 'presentation') {
            rightClickEle = e.target;
            if (contextMenu && showAllTag && pdfAdmin) {
                contextMenu.style.display = "block";
                contextMenu.style.left = e.pageX + 'px';
                contextMenu.style.top = e.pageY + 'px';
            }
        }
        return false;
    }
    
    // PDF选取文字
    var x = 0, y = 0, _x = 0, _y = 0;
    const pdfViewerContainer = document.body.querySelector('.pdfViewer');
    if (pdfViewerContainer) {
        pdfViewerContainer.addEventListener('mousedown', function (e) {
            closePoperMsg();
            clearAllSelections('.temp-selected');
            x = e.pageX;
            y = e.pageY;
        }, true);

        pdfViewerContainer.addEventListener('mouseup', function (e) {
            _x = e.pageX;
            _y = e.pageY;
            if (x == _x && y == _y) return;
            // var selectedHtml = [];
            // clearAllSelections('temp-selected');
            var position  = {}, selectArea = [], selectOutline = [];
            // debugger
            // console.log('window.getSelection()', window.getSelection())
            var selectNodes = getSelectedNodes();//window.getSelection().getRangeAt(0).cloneContents();
            // console.log('selectNodes', selectNodes);
            var selection = document.getSelection();
            // var selectionStr = selection.toString();
            var selectionStrArr = [];
            
            // 选中的文字定义位置
            position = {
                start: selection.anchorOffset,
                end: selection.focusOffset
            }
            // debugger
            var pages = [];
            var lineIndex = 0;
            const strPosition = [];
            for (let i = 0; i < selectNodes.length; i++) {
                let childNode = selectNodes[i];
                // 所属页面
                let pageIndex = getPages(childNode);
                if (!~pageIndex) {
                    continue;
                }
                if (!selectionStrArr[lineIndex]) {
                    selectionStrArr[lineIndex] = [];
                }

                let outlineId = findOutlineItem(childNode);
                if (outlineId) {
                    selectOutline.push(outlineId)
                }

                let textContent = childNode.textContent;
                if (i === 0) {
                    if (selectNodes.length === 1) {
                        textContent = textContent.slice(position.start, position.end);
                    } else {
                        textContent = textContent.slice(position.start, textContent.length);
                    }
                }

                if (i === selectNodes.length - 1 && position.end > 0) {
                    textContent = textContent.slice(0, position.end);
                }
                selectionStrArr[lineIndex].push(textContent);

                strPosition.push(childNode.textContent.indexOf(textContent))

                // 换行
                let eq = childNode.offsetHeight + 5;
                let nextSpan = selectNodes[i+1];
                if (nextSpan) {
                    let subTop = Math.abs(childNode.offsetTop - nextSpan.offsetTop);
                    if (subTop > eq) {
                        lineIndex++;
                    }
                }

                // 元素index下标位置
                let parentNode = getParent(childNode, 'textLayer');
                let nodeIndex = getNodeIndex(childNode, parentNode);
                selectArea.push(nodeIndex);

                pages.push(pageIndex);
            }

            // 分解选中的文字
            var selectionStr = []
            selectionStrArr.forEach(arr => {
                selectionStr.push(arr.join(""));
            });
            
            // 显示tooltip工具条
            showPdfTools(x,y);

            // 上报事件
            selectOutline = _.uniq(selectOutline);
            let outlineId = selectOutline[0];
            pdfSelections = { selectionStr:transAlphabet(selectionStr.join("\n")), pages: _.uniq(pages), strPosition, selectionStrArr, selectArea:_.uniq(selectArea), outlineId };
            postMsg({ act: 'selection', ...pdfSelections }); 
            
            e.stopPropagation();
            e.preventDefault();
        }, true)
    }
}