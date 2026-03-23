<script>
    // mock数据
    // import testDoc from './testDoc.json';
    // 大纲类型
    // import { outlineTypes } from './editorConfig.js';
    // 全局方法
    import $global from '@/utils/global.js';
    // 公式转换
    import { outlineTypes, tranGreeceText } from "./editorConfig.js";
    // Node接口
    import { documentServer, uploadFile } from '@/api/nodeServer.js';

    export default {
        name: 'doc-mixin',
        data() {
            return {
                aiParseDoc: {},
                outlineTypes,
            }
        },
        methods: {
            async tranLatex2Img(latex) {
                try {
                    latex = tranGreeceText(latex);
                    var condition = {
                        type: 'mathjaxToImg',
                        format: 'inline-TeX', // TeX | inline-TeX | block-TeX | MathML | AsciiMath
                        mathStr: latex,
                        svg: true,
                        html: true
                    }
                    var res = await documentServer(condition, this.options.nodeURL);
                    if (res && res.data) {
                        let width = Math.floor(parseFloat(res.data.width) * 8.01);
                        let height = Math.floor(parseFloat(res.data.height) * 8.01);
                        if (width > 400) {
                            width = 400;
                        }
                        let id = $global.guid();
                        const fileData = $global.dataURLtoFile(res.data.png);
                        const formData = new FormData();
                        formData.append("file", fileData);
                        formData.append("filename", (fileData.filename||fileData.name) + '.png');
                        res = await uploadFile(formData, this.options.nodeURL);
                        if (res && res.data) {
                            const imgUrl = this.options.nodeURL + '/files/' + res.data[0]['outFile'];
                            return `<img class="math-img" data-id="${id}" src="${imgUrl}" width="${width}" height="${height}" data-latex="${latex}" />`;
                        } else {
                            console.error('公式图片上传失败');
                            return '';
                        }
                    }
                    return '';
                } catch (error) {
                    console.error('公式解析错误===>', error, latex);
                    return '';
                }
            },
            async handlerDocLoading(contents=[]) {
                try {
                    const groupOutline = [];
                    let error;
                    let arrIndex = 0;
                    for (let i=0; i<contents.length; i++) {
                        const node = contents[i];
                        if (node.type === 'section' && node.level === 1) {
                            let outlineTitle = node.value.replace(/\s/g,'')
                            let outlineIndex = _.findIndex(this.tocList, { outlineTitle });
                            if (!!~outlineIndex) {
                                let outlineItem = _.find(this.tocList, { outlineTitle });
                                groupOutline[arrIndex] = {
                                    ...outlineItem,
                                    children: []
                                }
                                this.$set(this.tocList, outlineIndex, outlineItem);
                                arrIndex++;
                                continue;
                            } else {
                                console.error('数据的第一个元素无法匹配到已有的大纲章节！', node);
                                error = '数据的第一个元素无法匹配到已有的大纲章节！';
                                break;
                            }
                        }
                        groupOutline[arrIndex-1].children.push(node);
                    }

                    if (error) {
                        this.$message.error(error);
                        return;
                    }

                    let tableIndex = 1;
                    let mathNum = 1
                    let parentOutline = {};
                    for (let outlineItem of groupOutline) {
                        if (outlineItem.loaded) {
                            continue;
                        }
                        let children = outlineItem.children;
                        let olCls = [8, 9].includes(outlineItem.outlineType) ? 'appendix-list' : 'ol-list';
                        let numIndex = 1;
                        let subIndex = 1;
                        for (let node of children) {
                            const nodeType = node.type;
                            node.htmlArr = [];
                            let nodeValue = node.value || '';

                            if (nodeType === 'text') {
                                for(let str of nodeValue.split('\n\n')) {
                                    node.htmlArr.push(`<p style="text-indent: 2em;">${str.replaceAll('\n\t*','<br/>')}</p>`);
                                }
                            } else if (nodeType === 'table') {
                                let tableHtml = this.setTableHtml(node, tableIndex);
                                node.htmlArr.push(tableHtml);
                                tableIndex++;
                            } else if (nodeType === 'formula') {
                                for (let k in nodeValue) {
                                    let fval = nodeValue[k];
                                    if (['公式名称','公式来源','公式类型'].includes(k)) {
                                        node.htmlArr.push(`<p style="text-indent: 2em;">${k}:${fval}</p>`);
                                    } else if (k === '公式') {
                                        let mm = await this.tranLatex2Img(fval.replace(/\/\//g, '/'));
                                        if (mm) {
                                            node.htmlArr.push(`<figure class="image math" data-number="${mathNum}">${mm}</figure>`);
                                        } else {
                                            node.htmlArr.push(`<p>${fval}</p>`);
                                        }
                                    } else if (k === '参数解释') {
                                        node.htmlArr.push(`<div class="math-desc" data-id="${$global.guid()}" style="text-indent: 2em;">`);
                                        node.htmlArr.push(`<p>式中：</p>`);
                                        for (let kk in fval) {
                                            node.htmlArr.push(`<p>${kk} ——${fval[kk]}</p>`);
                                        }
                                        node.htmlArr.push('</div>');
                                    }
                                }
                                mathNum++;
                            } else if (nodeType === 'section') {
                                let outlineId = $global.guid();
                                let parentId = outlineItem.outlineId;
                                let outlineType = outlineItem.outlineType;
                                let outlineCatalog = outlineItem.outlineCatalog + '.' + numIndex;
                                if (node.level === 2) {
                                    parentOutline = {
                                        outlineId,
                                        outlineType: outlineItem.outlineType,
                                        outlineCatalog
                                    };
                                    subIndex = 1;
                                } else if (node.level === 3 && !_.isEmpty(parentOutline)) {
                                    parentId = parentOutline.outlineId;
                                    outlineType = parentOutline.outlineType;
                                    outlineCatalog = parentOutline.outlineCatalog + '.' + subIndex;
                                    subIndex++;
                                }
                                let bk = ` data-bookmark="${outlineId}"`;
                                let prev = '';

                                node.outlineId = outlineId;
                                if (outlineItem.outlineType === 5) { // 若为术语的则额外处理
                                    bk = '';
                                    let cn = nodeValue ? _.trim(nodeValue.replace(/[A-Za-z\s]+/g,'')) : '--';
                                    let en = nodeValue ? _.trim(nodeValue.replace(/[\u4e00-\u9fa5]/g,'')) : '--';
                                    nodeValue = `&#8203<p class="tag term" data-tag="term" data-id="${$global.guid()}" data-zhname="${cn}" data-enname="${en}" title="术语" style="text-indent:2em;"><span style="font-family: simHei;">${cn}</span><span style="font-family: times new roman;font-weight:bold">&nbsp;&nbsp;${en}</span></p>`;
                                } else if ([8,9].includes(outlineItem.outlineType)) {
                                    prev = ` data-prev="${outlineItem.outlineCatalog}"`;
                                }
                                let contentId = $global.guid();
                                node.htmlArr.push(`<div class="${olCls}"${bk}${prev} data-outlineid="${outlineId}" data-parentid="${parentId}" data-outlinetype="${outlineType}" data-index="${outlineCatalog}" data-contentid="${contentId}">${nodeValue}</div>`);
                                numIndex++;
                            }
                        }
                        outlineItem.loaded = true;
                        const tocIndex = _.findIndex(this.tocList, { outlineId:outlineItem.outlineId });
                        if (!!~tocIndex) {
                            this.$set(this.tocList, tocIndex, outlineItem);
                        }
                        // debugger
                        this.$emit('change', { act:'appendOutlineItem', outlineItem });
                    }
                } catch (error) {
                    console.log('处理内容错误====>', error, contents)
                }
            },

            setTableHtml(data, index) {
                const tableNode = document.createElement('table');
                tableNode.border = '2';
                tableNode.style = 'width: 100%; border: 2px solid rgb(51, 51, 51);';
                tableNode.dataset.id = $global.guid();
                if (data.caption) {
                    const caption = document.createElement('caption');
                    caption.className = 'table-title';
                    caption.dataset.number = index;
                    caption.textContent = data.caption;
                    tableNode.appendChild(caption);
                }

                const colgroup = document.createElement('colgroup');
                tableNode.appendChild(colgroup);
                const thead = document.createElement('thead');
                tableNode.appendChild(thead);

                const tr = document.createElement('tr');
                thead.appendChild(tr);
                for (let headStr of data.header) {
                    let col = document.createElement('col');
                    col.style.width = (data.header.length / 100).toFixed(2) + '%';
                    colgroup.appendChild(col);
                    let th = document.createElement('th');
                    th.textContent = headStr;
                    tr.appendChild(th);
                }
                const tbody = document.createElement('tbody');
                tableNode.appendChild(tbody);
                for (let val of data.value) {
                    let tr = document.createElement('tr');
                    tbody.appendChild(tr);
                    for(let str of val) {
                        let td = document.createElement('td');
                        td.textContent = str;
                        tr.appendChild(td);
                    }
                }

                const html = tableNode.outerHTML;
                tableNode.remove();
                return html;
            },

            setContentByOutline(list, docData={}) {
                // 构建大纲
                var oliNum = 1, appendixNum = 0;
                let orderNum = 0;
                let outlineList = [];
                for(let item of list) {
                    item = item[0];
                    let outlineId = $global.guid();
                    let outlineTitle = _.trim(item.name);
                    item = {
                        level: item.level,
                        parentId: docData.outlineId,
                        outlineId,
                        outlineTitle
                    }
                    let outlineCatalog = '';
                    let outlineType = 6;
                    if (!['前言','引言','索引','参考文献'].includes(outlineTitle)) {
                        if (/^\附录/.test(outlineTitle)) {
                            outlineType = 8;
                            outlineCatalog = String($global.numberToLetters(appendixNum));
                            appendixNum++;
                        } else {
                            outlineCatalog = String(oliNum);
                            oliNum++;
                        }
                        item.outlineCatalog = outlineCatalog;
                    }
                    let outlineItem = _.find(this.outlineTypes, o => {
                        return outlineTitle.replace(/\s/g,'').includes(o.label);
                    });
                    if (outlineItem) {
                        outlineType = outlineItem.type;
                    }
                    item.outlineType = outlineType;
                    outlineList.push(item);
                    orderNum++;
                }
                return outlineList;
            },


            parseDocOutline(docData=null) {
                docData.contents.forEach((item, index) => {
                    if (item.type === 'section') {
                        item.outlineId = $global.guid();
                        // 额外增加”规范性引用文件“章节
                        if (item.value.includes('术语和定义') && !_.find(docData.contents, { type:'section', level:1, value:'规范性引用文件' })) {
                            docData.contents.splice(index, 0, {
                                type: 'section',
                                level:1,
                                value: '规范性引用文件'
                            })
                            docData.contents.splice(index+1, 0, {
                                "type": "text",
                                "value":"下列文件中的内容通过文中的规范性引用而构成本文件必不可少的条款。其中，注日期的引用文件，仅该日期对应的版本适用于本文件；不注日期的引用文件，其最新版本（包括所有的修改单）适用于本文件。"
                            })
                        }
                    }
                });

                const parseContent = index => {
                    let content = [];
                    for (let i=index; i<docData.contents.length; i++) {
                        let item = docData.contents[i];
                        if (item.level === 1) {
                            break;
                        }
                        content
                    }
                }

                const tocList = docData.contents.filter(item => {
                    return item.type === 'section' && item.level === 1;
                })

                const docId = $global.guid();
                docData.docId = docId;

                let outlineList = [];
                const outlineStr = [];
                const parentId = $global.guid();
                var oliNum = 1, appendixNum = 0;
                let orderNum = 0;

                for (let i=0; i<tocList.length; i++) {
                    let item = tocList[i];
                    let outlineId = $global.guid();
                    item.outlineId = outlineId;
                    let outlineTitle = item.value;
                    let outlineCatalog = '';
                    let outlineType = 6;

                    let obj = {
                        docId,
                        levelNum: item.level,
                        orderNum,
                        parentId,
                        outlineId,
                        outlineTitle,
                        // outlineCatalog,
                        position: [].indexOf.call(docData.contents, item)
                    }

                    if (!['前言','引言','索引','参考文献'].includes(outlineTitle)) {
                        if (/^\附录/.test(outlineTitle)) {
                            outlineType = 8;
                            outlineCatalog = String($global.numberToLetters(appendixNum));
                            // outlineTitle += outlineCatalog + ' ' + '附录名称';
                            outlineTitle = '附录名称';
                            obj.outlineTitle = outlineTitle;
                            outlineStr.push('附录' + outlineCatalog + ' ' + outlineTitle);
                            appendixNum++;
                        } else {
                            outlineCatalog = String(oliNum);
                            outlineStr.push(oliNum + ' ' + outlineTitle);
                            oliNum++;
                        }
                        obj.outlineCatalog = outlineCatalog;
                    } else {
                        outlineStr.push(outlineTitle);
                    }
                    // let outlineItem = _.find(this.outlineTypes, { label:item.value });
                    let outlineItem = _.find(this.outlineTypes, o => {
                        return item.value.replace(/\s/g,'').includes(o.label);
                    });
                    if (outlineItem) {
                        outlineType = outlineItem.type;
                    }
                    obj.outlineType = outlineType;
                    outlineList.push(obj);
                    orderNum++;
                }

                outlineList = _.sortBy(outlineList, ['outlineType','orderNum']);
                outlineList.unshift({outlineId:parentId, outlineTitle:'文档',parentId:'0', docId, orderNum:-1 });

                outlineList = $global.toTree(outlineList, {idKey:'outlineId', parentKey:'parentId'});

                // console.log('outlineList===>', outlineList);
                // 列出大纲的二级条款
                return {
                    docId,
                    outlineId: parentId,
                    outlineList,
                    outlineStr: outlineStr.join('<br/>'),
                    docData
                };
            },

            getHtmlByOutlineItem(currOutline, contents) {
                const getSelectChildNodes = (index, nodes) => {
                    const childNodes = [];
                    for (let i= index; i<nodes.length; i++) {
                        let node = nodes[i];
                        if ($global.hasClass(node, 'struct')) {
                            break;
                        }
                        childNodes.push(node)
                    }
                    return childNodes;
                }

                let htmlContent = '';
                if (currOutline) {
                    // var contents =  this.docData.docData.contents;
                    // 从目录数据中获取下一个章节的数据，以确定下标位置
                    // console.log('this.docData=>>',this.docData);
                    const listArr = [];
                    const parentId = currOutline.outlineId;
                    const outlineType = currOutline.outlineType;
                    const outlineCatalog = currOutline.outlineCatalog;

                    let olIndex = 0;
                    let appendixIndex = 0;
                    for (let i=currOutline.position + 1; i<contents.length; i++) {
                        let node = contents[i];
                        let lineValue = node?.value || '';
                        if (node.type === 'section') {
                            if (node.level === 1) {
                                break;
                            } else {
                                // 前言、引言、索引、参考文献
                                if ([1,2,11,12].includes(outlineType)) {
                                    let strs = lineValue.split('\n\n');
                                    strs.forEach(str => {
                                        listArr.push(`<p style="text-indent: 2em;">${str.replaceAll('\n\t*','<br/>')}</p>`);
                                    })
                                } else {
                                    // 附录章节
                                    let dataPrev = [8,9].includes(currOutline.outlineType) ? outlineCatalog : '';
                                    if (dataPrev) {
                                        dataPrev = `data-prev="${dataPrev}"`;
                                        appendixIndex++;
                                    } else {
                                        olIndex++;
                                    }
                                    let cls = [8,9].includes(currOutline.outlineType) ? 'appendix-list' : 'ol-list';
                                    let index = [8,9].includes(currOutline.outlineType) ? appendixIndex : olIndex;
                                    let oid = $global.guid();
                                    let contentId = $global.guid();
                                    let bk = ` data-bookmark="${oid}"`;
                                    if (currOutline.outlineType === 5) { //
                                        // console.log(lineValue)
                                        let str = [`&#8203<p class="tag term" data-tag="term" data-id="${$global.guid()}" style="text-indent:2em;">`];
                                        let splitSpan = lineValue.split(/\s/);
                                        for(let j=0; j<splitSpan.length; j++) {
                                            let s = splitSpan[j];
                                            if (j===0) {
                                                str.push(`<span style="font-family: simHei;">${s}</span>`);
                                            } else {
                                                str.push(`<span style="font-family: times new roman;font-weight:bold">&nbsp;&nbsp;${s}</span>`);
                                            }
                                        }
                                        str.push('</p>')
                                        lineValue = str.join('');
                                        bk = '';
                                    }
                                    listArr.push(`<div class="${cls} struct"${bk} ${dataPrev} data-outlineid="${oid}" data-parentid="${parentId}" data-outlinetype="${outlineType}" data-index="${index}" data-contentid="${contentId}">${lineValue}</div>`);
                                }
                            }
                        } else {
                            let strs = lineValue.split('\n\n');
                            strs.forEach(str => {
                                listArr.push(`<p style="text-indent: 2em;">${str.replaceAll('\n\t*','<br/>')}</p>`);
                            });
                        }
                    }
                    // console.log('appendOutlineContent listArr=>', listArr);
                    if (listArr.length) {
                        const section = document.createElement('div');
                        section.innerHTML = listArr.join("");
                        const childNodes = Array.from(section.childNodes);
                        for(let i=0; i<childNodes.length; i++) {
                            let node = childNodes[i];
                            if ($global.hasClass(node, 'struct')) {
                                let selfChilds = getSelectChildNodes(i + 1, childNodes);
                                if (selfChilds.length) {
                                    selfChilds.forEach(n => {
                                        node.appendChild(n);
                                    })
                                }
                            }
                        }
                        htmlContent = section.innerHTML;
                        section.remove();
                    }
                }
                return htmlContent;
            },

            parseHtmlByOutline(data, pageNo='xxx-xxx', isAll=false) {
                const childrenNodes = data.outlineList[0]['children'];
                const contents  = data.docData.contents;

                const setChildrenHtml = item => {
                    let htmlArr = [];
                    let index = _.findIndex(contents, {outlineId:item.outlineId });
                    // debugger
                    if (!!~index) {
                        for (let i=index+1; i<contents.length; i++) {
                            let item = contents[i];
                            if (item.type === 'section' && item.level) {
                                if (item.level === 1) {
                                    break;
                                }
                                htmlArr.push(``);
                            } else if (item.type === 'text') {
                                item.value.split('\n\n').forEach(str => {
                                    htmlArr.push(`<p style="text-indent: 2em;">${str.replaceAll('\n\t*','<br/>')}</p>`);
                                });
                            }
                        }
                    }
                    return htmlArr.join('');
                }

                const htmlArr = [];
                let hasTitle = false;
                for (let i = 0; i < childrenNodes.length; i++) {
                    let pageItem = childrenNodes[i];
                    let cls = [8, 9].includes(pageItem.outlineType) ? 'appendix' : 'struct';
                    let dataLetter = [8, 9].includes(pageItem.outlineType) ? ` data-letter="${pageItem.outlineCatalog}"` : '';
                    let olCls = [8, 9].includes(pageItem.outlineType) ? 'appendix-list' : 'ol-list';
                    if ([1, 2].includes(pageItem.outlineType)) {
                        cls = '';
                    }
                    htmlArr.push(`<div class="info-block ${cls}" data-outlinetype="${pageItem.outlineType}" data-outlineid="${pageItem.outlineId}" data-parentid="${pageItem.parentId}"${dataLetter} data-no="${pageNo}">`);
                    if ([1, 2, 11, 12].includes(pageItem.outlineType)) {
                        let titleName = pageItem.outlineTitle.split('').join('&nbsp;&nbsp;');
                        htmlArr.push(`<div class="header-title" data-bookmark="${pageItem.outlineId}" data-bookmark="${pageItem.outlineId}"><p>${titleName}</p></div>`);
                    } else {
                        if (!hasTitle) {
                            htmlArr.push(`<div class="header-title chapter"><p data-bind="stdName">标准名称XXXXX</p></div>`);
                            hasTitle = true;
                        }
                        if ([8, 9].includes(pageItem.outlineType)) {
                            htmlArr.push(`<div class="header-title appendix disabled" contenteditable="false" data-infonum="${pageItem.outlineId}" data-bookmark="${pageItem.outlineId}" data-outlinetype="8" data-outlineid="${pageItem.outlineId}" data-parentid="${pageItem.parentId}" data-number="${pageItem.outlineCatalog}"><p class="appendix" data-number="${pageItem.outlineCatalog}">附录</p><p class="docattr specs">（规范性）</p><p class="appendix-title" contenteditable="true">${pageItem.outlineTitle}</p></div>`);
                        } else {
                            htmlArr.push(`<div class="${olCls}" data-bookmark="${pageItem.outlineId}" data-outlineid="${pageItem.outlineId}" data-parentid="${pageItem.parentId}" data-outlinetype="${pageItem.outlineType}" data-index="${pageItem.outlineCatalog}">${pageItem.outlineTitle}</div>`);
                        }
                    }
                    // 是否同步构建全文
                    if (isAll) {
                        let htmlContent = this.getHtmlByOutlineItem(pageItem, contents);
                        htmlArr.push(htmlContent);
                    } else {
                        htmlArr.push(`<p class="tmp-text" style="text-indent: 2em;">请输入内容</p>`);
                    }
                    htmlArr.push('</div>');
                }
                return htmlArr;
            },

            setDocHtmlContent(childrenNodes=[], contents=[], isAll=false) {
                const htmlArr = [];
                const pageNo = 'XX-XXX-XXX';
                let hasTitle = false;

                for (let i = 0; i < childrenNodes.length; i++) {
                    let pageItem = childrenNodes[i];
                    let cls = [8, 9].includes(pageItem.outlineType) ? 'appendix' : 'struct';
                    let dataLetter = [8, 9].includes(pageItem.outlineType) ? ` data-letter="${pageItem.outlineCatalog}"` : '';
                    let olCls = [8, 9].includes(pageItem.outlineType) ? 'appendix-list' : 'ol-list';
                    if ([1, 2].includes(pageItem.outlineType)) {
                        cls = '';
                    }
                    htmlArr.push(`<div class="info-block disabled ${cls}" data-outlinetype="${pageItem.outlineType}" data-outlineid="${pageItem.outlineId}" data-parentid="${pageItem.parentId}"${dataLetter} data-no="${pageNo}">`);
                    if ([1, 2, 11, 12].includes(pageItem.outlineType)) {
                        let titleName = pageItem.outlineTitle.split('').join('&nbsp;&nbsp;');
                        htmlArr.push(`<div class="header-title" data-bookmark="${pageItem.outlineId}" data-bookmark="${pageItem.outlineId}"><p>${titleName}</p></div>`);
                    } else {
                        if (!hasTitle) {
                            htmlArr.push(`<div class="header-title chapter"><p data-bind="stdName">标准名称XXXXX</p></div>`);
                            hasTitle = true;
                        }
                        let contentId = $global.guid();
                        if ([8, 9].includes(pageItem.outlineType)) {
                            htmlArr.push(`<div class="header-title appendix disabled" contenteditable="false" data-infonum="${pageItem.outlineId}" data-bookmark="${pageItem.outlineId}" data-outlinetype="8" data-outlineid="${pageItem.outlineId}" data-parentid="${pageItem.parentId}" data-number="${pageItem.outlineCatalog}"><p class="appendix" data-number="${pageItem.outlineCatalog}">附录</p><p class="docattr specs">（规范性）</p><p class="appendix-title" contenteditable="true">${pageItem.outlineTitle}</p></div>`);
                        } else {
                            htmlArr.push(`<div class="${olCls}" data-bookmark="${pageItem.outlineId}" data-outlineid="${pageItem.outlineId}" data-parentid="${pageItem.parentId}" data-outlinetype="${pageItem.outlineType}" data-index="${pageItem.outlineCatalog}" data-contentid="${contentId}">${pageItem.outlineTitle}</div>`);
                        }
                    }
                    // 是否同步构建全文
                    if (isAll) {
                        let htmlContent = this.getHtmlByOutlineItem(pageItem, contents);
                        htmlArr.push(htmlContent);
                    } else {
                        htmlArr.push(`<p class="tmp-text" style="text-indent: 2em;">正在分析内容，请等候完成！</p>`);
                    }
                    htmlArr.push('</div>');
                }
                return htmlArr;
            }
        },
    }
</script>
