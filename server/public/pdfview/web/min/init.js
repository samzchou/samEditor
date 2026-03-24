var loadedCount = 0;
var limitPage = 0;
var isLoading;
const isMobile = isMobileOs();

function isMobileOs() {
    return navigator.userAgent.toLowerCase().indexOf('mobile') > -1;
}
function loadedPdf() {
    loadedCount++;
    console.log('loaded', loadedCount);

    if (loadedCount > 0) {
        // 项父窗口发送实例加载完成后发送消息
        setTimeout(() => {
            PDFViewerApplication.pdfSidebar.close();
            PDFViewerApplication.page = 1;
            if (!PDFViewerApplication.download) {
                PDFViewerApplication.url = '';
            }
            postMsg({ act: 'loaded', documentInfo: PDFViewerApplication.documentInfo, pagesCount: PDFViewerApplication.pagesCount });
            if (window.self !== window.top && !isMobile) {
                PDFViewerApplication.pdfSidebar.open();
            }
        }, 500)
    }
}

function globalTreeLoaded(count, button, view) {
    switch (button.id) {
        case 'viewOutline': // 大纲
            break;
        case 'viewAttachments': // 附件
            break;
    }
}

function getThumbnail() {
    
}

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
    return arr;
}

// 解析PDF数据
function parseData(pageIndex = 1) {
    var { baseUrl } = PDFViewerApplication;
    var defaultPdf = 'bzt.pdf'; // 默认文档

    if (baseUrl.slice(0, 4).toLowerCase() !== 'http' && baseUrl !== 'bzt.pdf') {
        alert(baseUrl + ' ===> PDF路径非http方式请求！');
        return false;
    }
    var pdfParser = new pdf_parser(baseUrl);
    pdfParser.init()
}

function getPageContent(pageNumber = 1) {
    const { pdfViewer } = PDFViewerApplication;
    var viewContainer = pdfViewer.container;
    var pageContainer = viewContainer.querySelector(`.page[data-page-number="${pageNumber}"]>.textLayer`);
    var canvas = viewContainer.querySelector(`.page[data-page-number="${pageNumber}"] canvas`);
    var strArr = [];
    if (pageContainer) {
        var imgBase64 = canvas.toDataURL("image/png");
        var isCatalogue = false;
        var childNode = Array.from(pageContainer.childNodes);
        var splitNode = (index, callBack) => {
            var spanStr = [];
            for (let i = index; i < childNode.length; i++) {
                let node = childNode[i];
                let nodeStyle = window.getComputedStyle(node);
                var text = node.textContent;
                if (node.nodeName === 'BR' && node.role && node.role === 'presentation') {
                    strArr.push(_.orderBy(spanStr, ['left']));
                    splitNode(i + 1);
                    break;
                } else if (node.className === 'markedContent') {
                    strArr.push(_.orderBy(spanStr, ['left']));
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
    let reader = new FileReader()
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
    const url = window.location.origin;
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
                    console.log(pdfAddr);
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

    if (node == endNode) {
        return [node];
    }

    var rangeNodes = [];
    while (node && node != endNode) {
        rangeNodes.push(node = nextNode(node));
    }

    node = range.startContainer;
    while (node && node != range.commonAncestorContainer) {
        rangeNodes.unshift(node);
        node = node.parentNode;
    }

    return rangeNodes;
}
function nextNode(node) {
    if (node.hasChildNodes()) {
        return node.firstChild;
    } else {
        while (node && !node.nextSibling) {
            node = node.parentNode;
        }
        if (!node) {
            return null;
        }
        return node.nextSibling;
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
    if (node.nodeName === 'DIV' && node.className === 'page') {
        return node.dataset.pageNumber;
    } else {
        return getPages(node.parentNode);
    }

}

async function getDecryptUrl(url) {
    var PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----MIICXQIBAAKBgQCK3siV2MKl7ADFMajEsbc/ZrSTfo9h37c6+m0cUHOTqGR4V+Ugzc5Wzpcrz6QGu7/umQBJRC3LZ8xRW8+J6Z1lI0+Tr6LT8NfLUeyBTBXkBI1j0BIzmEjsW/a1vDr2ahXn1RFvtnHeKs41lbICkY7mRA2cAyiMWhrteM1d1MR3gQIDAQABAoGACUU8ELzKqbbqij95a8ANYp8hmOMPAVKk8bv8ArLgNFA+fMYpVppGlwbtkpAm/AgWlQADw+BYSkbgneHKJgPBbQB+G8/AmMY/u3KIFS4wJifaIAv2evDlFqtw2zI6bG7bg65YF9AS1l9B+O3IdqMDNBKqQYiItx1A/SfogAXJctECQQDeIzh3k8mkzyMelxrFY5kJ5u+ydse82nOmawxo3kS/WEZh2jadeUdAXvXDhXrQ4O1t8zrG4gY6sAq43KqeouBdAkEAoAobkEY/M/Rtya8tomm3Dg9+Hc9yNphVr8fG3tLpphALuGSP+0Qp9ONyoC4G71MnIPtqBl6JDNzKARY2NUjRdQJBANw/57kIW6KBjrzB7dVRD2h2BavZgemKX6jd8wv3dgqSqBZVmllA6pi0jtEyA7gfjMq7o8eWS77c1YS9pp5ruDECQQCJEp8xHzmbAkvWZpgrd2g2PsbCOZ+VazxY5j9LMlK0zSF8uYUorOVSvky7LTD7Yrks4qmY8vdncOQDskaTtN7RAkBc/3Brhc5eG0/XHqKrATY+H0GD/muzpLSLuDXVjgqhlEYH3FAsW+VP5dQ6AuzW+wkFDbztdvr5MF9Mluyxc3Fe-----END RSA PRIVATE KEY-----`;
    return new Promise((resolve, reject) => {
        $.getScript("../build/jsencrypt.js", function () {
            var decrypt = new JSEncrypt();
            decrypt.setPrivateKey(PRIVATE_KEY);
            url = decrypt.decrypt(url);
            resolve(url);
        })
    })
}

async function loadPdf(event) {
    loadedCount = 0;
    PDFViewerApplication.limitPage = event.data.limit || 0;
    // 执行加载
    var file = event.data.file;
    if (file.match(/\application/i) === null && file.match(/^\http|https/i) === null) {
        file = await getDecryptUrl(file);
    }
    PDFViewerApplication.open(file);
    const disableOpts = event.data.disable || [];
    PDFViewerApplication.download = !disableOpts.includes('download');
    // 删除按钮
    if (disableOpts) {
        var container = document.getElementById('toolbarViewerRight');
        disableOpts.forEach(str => {
            let ele = container.querySelector(`#${str}`);
            if (ele) {
                ele.remove();
            }
        })
    }
    // 切换到演示模式按钮
    var presentationModeEle = document.getElementById('presentationMode');
    if (presentationModeEle) {
        let cls = presentationModeEle.className;
        cls = cls.replace(/\hidden/g, '');
        presentationModeEle.className = cls;
    }
    // 导出文档按钮
    var dataEle = document.getElementById('btn-data');
    if (!event.data.export) {
        dataEle.remove();
    } else {
        PDFViewerApplication.parsePdf = true;
    }
}


// 监听消息 */
window.onload = function () {
    // return;
    var closeTxtEle = document.getElementById('textClose');
    var dataEle = document.getElementById('btn-data');
    var secondaryToolbar = document.getElementById('secondaryToolbarToggle');
    if (window.self !== window.top) {
        // 接收父窗口消息
        window.addEventListener('message', event => {
            if (event.data && event.data.file) {
                loadPdf(event);

            } else if (event.data && event.data.page) {
                PDFViewerApplication.page = event.data.page;
            }

        });
        // 关闭按钮点击
        closeTxtEle.onclick = function (evt) {
            quitViewer();
            evt.preventDefault();
            evt.stopPropagation();
        }
        // 解析数据
        dataEle.onclick = function (evt) {
            parseData(1);
            evt.preventDefault();
            evt.stopPropagation();
        }

        if (isMobile) {
            closeTxtEle.remove();
            dataEle.remove();
            secondaryToolbar.remove();
        }

    } else {
        // 直接加载URL的路径
        const queryString = document.location.search.substring(1);
        const params = (0, PDFViewerApplication._ui_utils.parseQueryString)(queryString);
        var pdfUrl = params.get("file") ?? params.get("url");

        isLoading = params.get("loading");
        closeTxtEle.remove();
        dataEle.remove();
    }
    // PDF选取文字
    var x = 0, y = 0, _x = 0, _y = 0;
    var pdfViewerContainer = document.querySelector('.pdfViewer');
    if (pdfViewerContainer) {
        pdfViewerContainer.addEventListener('mousedown', function (e) {
            x = e.pageX;
            y = e.pageY;
        }, true);

        pdfViewerContainer.addEventListener('mouseup', function (e) {
            _x = e.pageX;
            _y = e.pageY;
            if (x == _x && y == _y) return;
            var selectedHtml = [];
            console.log('window.getSelection()', window.getSelection())
            var selectNodes = getSelectedNodes();
            var selectionStr = document.getSelection().toString();

            var selectedHtml = [], pages = [];
            for (var i = 0; i < selectNodes.length; i++) {
                var childNode = selectNodes[i];
                if (childNode.nodeName !== 'BR') {
                    selectedHtml.push(childNode.outerHTML);
                    if (childNode.nodeName === 'DIV' && childNode.className === 'page') {
                        pages.push(childNode.dataset.pageNumber);
                    } else {
                        pages.push(getPages(childNode));
                    }
                }
            }
            postMsg({ act: 'selection', selectionStr, selectedHtml: selectedHtml.join("###"), pages: _.uniq(pages) }); // : PDFViewerApplication.page
        }, true)
    }
}