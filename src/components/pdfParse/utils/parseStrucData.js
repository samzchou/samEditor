// 全局函数
import $global from '@/utils/global.js';
import { uploadFile } from '@/api/nodeServer.js';

const numberChar = {
    roma: ['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ','Ⅺ','Ⅻ','XIII','XIV','XV','XVI','XVII','XVII','XIX','XX'],
    lower: ['a','b','c','d','e','f','g','h','i','j','k','l','m','n']
}

export default {
    nodeURL: '',
    sourceData: [],
    docType: 0,
    minSize: 14,
    pageContent: [],
    pageBaseInfo: [],
    rootId: '',
    coverData: {},
    pageNo: '',
    tocList: [],
    // 提取标准编号
    extractStdNo(str) {
    	const match = str.match(/^(.*?)\s*(\d+[\/\-—]\d+.*)$/) || str.match(/^([A-Z]{2,4}\/?T?)(\s?)/);
    	if (match) {
    		// 提取代号
    		const stdSign = match[1];
    		// 提取代号后的部分
    		const stdNo = match[2] || str.substring(match[0].length);
    		return { stdSign, stdNo };
    	} else {
    		// 如果没有匹配到代号，则认为整个字符串是编号
    		return { stdSign: '', stdNo: str };
    	}
    },

    async getStrucrData(htmlContent='') {
        const section = document.createElement('div');
        section.innerHTML = htmlContent;
        const blocks = Array.from(section.querySelectorAll('div.info-block'));
        const contentList = [];
        for (let i=0; i<blocks.length; i++) {
            const block = blocks[i];
            const prevBlock = block.previousElementSibling;
            $global.removeClass(block, 'pageHide');
            if (prevBlock) {
                $global.addClass(prevBlock, 'pageHide');
            }
            block.scrollIntoView({
                block: "start",
                inline: "nearest"
            });

            const eles = Array.from(block.querySelectorAll(':scope>div'));
            for (let j=0; j<eles.length; j++) {
                const ele = eles[j];
                /* if (!ele.dataset.type) {
                    debugger
                } */
                const type = ele.dataset.type;

                let value = ele.innerText.replace(/\n{2,}/g, '\n');;
                const obj = {
                    type,
                    page: Number(ele.dataset.page),
                    content_id: ele.dataset.contentId,
                    left: parseFloat(ele.style.left),
                    top: parseFloat(ele.style.top),
                    position: ele.dataset.position,
                    image_url: ele.dataset.image,
                };
                if (['formula'].includes(type)) {
                    const imgNode = ele.querySelector('img');
                    value = imgNode.dataset.latex || '';
                } else if (['table'].includes(type)) {
                    value = ele.innerHTML;
                }
                obj.value = value;

                contentList.push(obj)
            }
        }
        return contentList;
    },

    async getImageDimensions(imageUrl) {
        return new Promise((resolve, reject) => {
            var img = new Image();
            img.onload = function() {
                resolve({
                    width: this.width,
                    height: this.height
                });
            };
            img.onerror = function() {
                console.log('Failed to load image', imageUrl);
                resolve({});
                // reject(new Error('Failed to load image'));
            };
            img.src = imageUrl;
        });
    },

    async normalizeContent(list=[], setting={}, docType=0) {
        this.nodeURL = setting.nodeURL;
        this.minSize = setting.textSize || 14;
        this.docType = docType;
        this.rootId = $global.guid();
        this.sourceData = list;
        this.pageContent = Object.values(_.groupBy(list, 'page'));
        this.pageBaseInfo = [];
        // debugger
        // 设置每页的最小坐标及页面宽度
        for (let page of this.pageContent) {
            let minLeft = 1000;
            let maxLeft = 100;
            let minTop = 1000;
            let minTopItem;
            let maxTopItem;
            let maxTop = 0;
            let pageNum;
            let width = 794;
            let height = 1123;
            page = _.orderBy(page, ['left','top']);

            for (let item of page) { //let item of page
                const content = item.content;
                if (content.position && !['image','table'].includes(item.contentType)) {
                    item.position = content.position.split(',').map(n => Number(n));
                    if (item.position[0] < minLeft) {
                        minLeft = item.position[0];
                    }
                    item.left = item.position[0];
                    item.top = item.position[1];
                    if (item.position[2]) {
                        let lastLeft = item.position[2];
                        if (maxLeft < lastLeft) {
                            maxLeft = lastLeft;
                        }
                    }

                }
                if (!item.position && ['image','formula'].includes(item.contentType)) {
                    item.position = content.position.split(',').map(n => Number(n));
                    item.left = item.position[0];
                    item.top = item.position[1];
                }
                if (item.positionY < minTop && item.contentType !== 'layout') {
                    minTop = item.positionY;
                    minTopItem = item;
                }
                if (item.positionY > maxTop) {
                    maxTop = item.positionY;
                    maxTopItem = item;
                }
                if (!pageNum && item.page) {
                    pageNum = item.page;
                }
                if (item.contentType === 'layout') {
                    const layout = item.content.split(',');
                    width = Number(layout[0]);
                    height = Number(layout[1]);
                }
            }
            this.pageBaseInfo.push({
                pageNum,
                width,
                height,
                minLeft,
                maxLeft,
                minTop,
                minTopItem,
                maxTop,
                maxTopItem,
                maxWidth: width - minLeft * 2
            })
        }
        // debugger
        console.log('this.pageContent==>', this.pageContent, this.pageBaseInfo);
        return await this.parseStruct();
    },

    // 设置字体
    setFontSize(position, text, page, maxWidth=623) {
        if (position.length >= 4) {
        	let fontSize = this.minSize;
        	let upText = text.replace(/\s/g,'');
        	if(['目次','目录','前言','引言','索引'].includes(upText) && position[0] > 250) {
        		text = upText.split("").join("  ");
        		fontSize = 18;
        	} else {
                // if (page === 1) {
                let containerWidth = Math.abs(position[2] - position[0]);
                if (containerWidth > maxWidth) {
                    containerWidth = maxWidth;
                }
                if (upText.slice(-2) === '标准' && /^[\u4E00-\u9FA5]+$/.test(upText) && page === 1) {
                    containerWidth = maxWidth;
                }

                const minFontSize = this.minSize;
                const maxFontSize = 58;
                const charCount = text.length;
                fontSize = Math.floor(containerWidth / charCount);
                // 限制字体大小在最小和最大值之间
                fontSize = Math.max(minFontSize, Math.min(fontSize, maxFontSize));
                // }
            }
            return fontSize;
        }
    },
    async getImgUrl(url) {
        const condition = {
            operation: 'getUrl',
            save: true,
            url,
        }
        const res = await uploadFile(condition, this.nodeURL);
        console.log('getImgUrl==>', res)
        return res?.data;
    },

    // 提取结构化数据
    async parseStruct() {
        console.log('this.pageBaseInfo====>', this.pageBaseInfo);
        let sectionPage = 0;
        // let isToc = false;
        let appendixPrev = '';
        const outlineList = [];
        const setBlock = (data) => {
            const block = document.createElement('div');
            block.className = 'info-block';
            block.dataset.page = data.pageNum;
            block.dataset.minLeft = data.minLeft;
            block.dataset.minTop = data.minTop;
            block.dataset.maxTop = data.maxTop;
            block.dataset.maxLeft = data.maxLeft;
            block.setAttribute('style', `width:${data.width}px;height:${data.height}px;`);
            return block;
        }

        const getStdSign = (text) => {
            if (/^\GB/.test(text)) { // 国标类型
                return 1100;
            } else if (/^\T\//.test(text)) { // 团标类型
                return 1500;
            } else if (/^\DB/.test(text)) {  // 地标类型
                return 6;
            } else if (/^\Q\//.test(text)) { // 企标类型
                return 1400;
            } else {
                return 1200;
            }
        }

        const setElement = async (data, baseInfo) => {
            const content = data.content;
            let position = data.position;
            if (!position) {
                position = [0, data.positionY];
            }
            const { minLeft, minTop, maxTop, maxWidth, maxLeft }  = baseInfo;

            const ele = document.createElement('div');
            let eleLeft = position[0];
            let subLeft = Math.abs(position[0] - minLeft);
            data.page = Number(data.page);
            ele.className = 'text-box';
            ele.setAttribute('contenteditable', true);
            ele.setAttribute('style', `left:${eleLeft}px;top:${position[1]}px;max-width:${maxWidth+20}px;`);
            ele.dataset.type = data.contentType;
            ele.dataset.position = position.join(',');
            ele.dataset.image = content.cut_image_url || content.content;
            if (!ele.dataset.image.startsWith('http')) {
                ele.dataset.image = 'http://' + ele.dataset.image;
            }
            ele.dataset.page = data.page;
            ele.dataset.left = data.left;
            ele.dataset.top = data.top;
            ele.dataset.id = data.uuid;

            let upText = content.content.replace(/\s/g,'');
            // 设置字号
            if (['text','section'].includes(data.contentType)) {
                let fontSize = this.setFontSize(position, content.content, data.page, maxWidth);
                // 最后一行发布单位
                if (fontSize >= this.minSize && data.page > 1) { // && subLeft < this.minSize * 6 &&
                    fontSize = this.minSize;
                }
                ele.style.fontSize = fontSize + 'px';
            }

            // 判断是否开始了章节并定位章节的起始页  (['前言','引言','索引','参考文献'].includes(upText) && position[0] > 300)
            if (['目次','目录','前言','引言','索引','参考文献'].includes(upText) && ele.dataset.left > 300) {
                if (['目次','目录','前言','引言','索引'].includes(upText)) {
                    ele.style.fontSize = upText !== '索引' ? '18px' : '14px';
                    upText = upText.split('').join('&nbsp;&nbsp;');
                }
                ele.style.fontFamily = 'simHei';
                ele.innerHTML = upText;
                // 定义章节起始页
                if (!sectionPage) {
                    sectionPage = data.page;
                }
            }
            // 处理封面
            if (data.page === 1) {
                // 封面的标准名称
                if (upText.slice(-2) === '标准' && /^[\u4E00-\u9FA5]+$/.test(upText)) {
                    $global.addClass(ele,'cover');
                    ele.style.left = minLeft + 'px';
                    ele.style.top = (position[1] - 10) + 'px';
                }
                // 标准标志的图标
                if (/^(?=.*[A-Z].*[A-Z])[A-Z0-9]+$/.test(upText)) {
                    let stdKind = getStdSign(upText);
                    if ([1100,1200,6,7].includes(stdKind)) {
                        let stdIcon = upText.split('/')[0];
                        let iconUrl = this.nodeURL + '/files/';
                        if (stdIcon) {
                            let iconHtml = '';
                            let iconHeight = '50px';
                            switch (stdKind) {
                                case 1100:
                                case 7:
                                    iconUrl += 'images/cover_gb.png';
                                    iconHtml = `<img style="width: 40mm; height: 20mm;" src="${iconUrl}" />`;
                                    iconHeight = '20mm';
                                    break;
                                case 1200:
                                    iconUrl += 'images/industry/' + stdIcon + '.png';
                                    iconHtml = `<img src="${iconUrl}" style="height:16mm !important;" />`;
                                    iconHeight = '16mm';
                                    break;
                                case 6:
                                    stdIcon = stdIcon.replace(/DB/g, '').replace(/\/T/g, '');
                                    iconUrl += 'images/cover_db.png';
                                    iconHtml = `<img src="${iconUrl}" style="height:13mm !important;" />${stdIcon}`;
                                    iconHeight = '13mm';
                                    break;
                                case 1500:
                                    stdIcon = stdIcon.replace(/\T\//gi, '');
                                    iconUrl += 'images/cover_tb.png';
                                    iconHtml = `<img src="${iconUrl}" style="height:12mm !important;" />&nbsp;${stdIcon}`;
                                    iconHeight = '12mm';
                                    break;
                            }
                            ele.style.height = iconHeight;
                            ele.innerHTML = iconHtml;
                            ele.dataset.stdSign = true;
                        }
                    }
                }
            }

            if (['text','table'].includes(data.contentType)) {
                if (data.contentType === 'text') {
                    // 页眉页脚为不规则元素
                    if (data.page >= sectionPage) {
                        if (data.top === minTop && !/[\u4E00-\u9FA5]/.test(upText) && (upText.match(/^(.*?)\s*(\d+[\/\-—]\d+.*)$/) || upText.match(/^([A-Z]{2,4}\/?T?)(\s?)/))) {
                            ele.dataset.invalid = true;
                        }
                        if (data.top === maxTop && (['I','II','III','IV','V','I','L'].includes(upText.toUpperCase()) || !isNaN(upText) )) {
                            ele.dataset.invalid = true;
                        }
                    }

                    if (data.page && data.page >= sectionPage && sectionPage) {
                        let titleNum;
                        if ((eleLeft - minLeft) > 70) {
                            if (/图([A-Z]?\.?\d+(\.\d+)*)/.test(upText)) {
                                titleNum = upText.match(/图([A-Z]?\.?\d+(\.\d+)*)/);
                                ele.dataset.type = 'imgTitle';
                                ele.dataset.tagTitle = upText.replace(titleNum[0],'');
                                ele.dataset.number = titleNum[1] || 1;
                                ele.textContent = titleNum[0] + ' ' + ele.dataset.tagTitle;
                                ele.style.fontSize = this.minSize + 'px';
                                return ele;
                            } else if (/表([A-Z]?\.?\d+(\.\d+)*)/.test(upText)) {
                                titleNum = upText.match(/表([A-Z]?\.?\d+(\.\d+)*)/);
                                ele.dataset.type = 'tableTitle';
                                ele.dataset.tagTitle = upText.replace(titleNum[0],'');
                                ele.dataset.number = titleNum[1] || 1;
                                ele.textContent = titleNum[0] + ' ' + ele.dataset.tagTitle;
                                ele.style.fontSize = this.minSize + 'px';
                                return ele;
                            }
                        }

                        if (/^\注+(\:|\：)/.test(upText)) {
                            $global.addClass(ele, 'tag zhu');
                            ele.dataset.tag = 'zhu';
                            ele.dataset.tagTitle = upText.replace(/^\注+(\:|\：)/i,'');
                            ele.style.fontSize = '12px';
                        } else if (/^\注[0-9]+(\:|\：)/.test(upText)) {
                            titleNum = upText.split(/\:|\：/)[0].replace(/注/i,'')
                            $global.addClass(ele, 'tag zhux');
                            ele.dataset.tag = 'zhux';
                            ele.dataset.tagTitle = upText.replace(/^\注+(\:|\：)/i,'');
                            ele.dataset.restart = titleNum;
                            ele.dataset.number = titleNum;
                            ele.style.fontSize = '12px';
                        } else if (/^\示例+(\:|\：)/.test(upText)) {
                            $global.addClass(ele, 'tag example');
                            ele.dataset.tag = 'example';
                            ele.dataset.tagTitle = upText.replace(/^\示例+(\:|\：)/i,'');
                            ele.style.fontSize = '12px';
                            return ele;
                        } else if (/^\示例[0-9]+(\:|\：)/.test(upText)) {
                            titleNum = upText.split(/\:|\：/)[0].replace(/示例/i,'');
                            $global.addClass(ele, 'tag examplex');
                            ele.dataset.tag = 'examplex';
                            ele.dataset.tagTitle = upText.replace(/^\示例[0-9]+(\:|\：)/i,'');
                            ele.dataset.restart = titleNum;
                            ele.dataset.number = titleNum;
                            ele.style.fontSize = '12px';
                        } else if (upText && (/^(\d{1,2}|[a-z])[)）]+.*$/.test(upText) || /^(\——|\--.*$)/.test(upText))) { // 列项 一一
                            $global.addClass(ele, 'bullet');
                            titleNum = upText.match(/^(\d{1,2}|[a-z])[)）]/);
                            if (titleNum !== null && titleNum[0] && titleNum[1]) { // 数字或字母列项
                                if (!isNaN(titleNum[1])) {
                                    ele.dataset.type = 'num';
                                    ele.dataset.start = parseInt(titleNum[1]) - 1;
                                } else {
                                    ele.dataset.type = 'lower';
                                    ele.dataset.start = titleNum[1].toUpperCase().charCodeAt() - 65;
                                }
                                ele.dataset.tagTitle = upText.replace(titleNum[0], '');
                            } else { // 破折号列项
                                ele.dataset.type = 'line';
                                ele.textContent = upText.replace(/^\——|\--/i, '');
                            }
                        } else if (upText && /^\[\d\]/.test(upText)) {
                            titleNum = upText.match(/^\[(\d+)\]/);
                            if (titleNum !== null && titleNum[0] && titleNum[1]) {
                                if (!isNaN(titleNum[1])) {
                                    $global.addClass(ele, 'bullet');
                                    ele.dataset.type = 'num-index';
                                    ele.dataset.start = parseInt(titleNum[1]) - 1;
                                    ele.dataset.tagTitle = upText.replace(titleNum[0], '');
                                }
                            }
                        }

                        let isStruct = this.isStruct(upText);
                        if (sectionPage && data.page > sectionPage && isStruct && ([1,2,11,12,8,9].includes(isStruct.outlineType) || subLeft < this.minSize)) {
                            if (isStruct.outlineType === 8) {
                                appendixPrev = isStruct.index || '';
                            } else if ([11,12].includes(isStruct.outlineType)) {
                                appendixPrev = '';
                            }
                            if (isStruct.outlineTitle === '术语和定义' && isStruct.outlineType !== 5) {
                                isStruct.outlineType = 5;
                            }
                            if (Math.abs(subLeft) < this.minSize) {
                                ele.style.left = minLeft + 'px';
                                ele.style.maxWidth = (baseInfo.width - minLeft * 2)  + 'px';
                            }

                            ele.dataset.type = "section";
                            ele.dataset.level = isStruct.index.split('.').length;
                            ele.dataset.index = isStruct.index || '';
                            ele.dataset.outlinetype = isStruct.outlineType;
                            ele.dataset.outlinetitle = isStruct.outlineTitle;
                            if (appendixPrev) {
                                ele.dataset.prev = appendixPrev;
                            }
                            if (ele.dataset.index) {
                                const reg = new RegExp(ele.dataset.index, 'i');
                                content.content = upText.replace(reg, ele.dataset.index + ' ');
                            }
                            outlineList.push(isStruct);
                        }
                    }
                    if (!ele.dataset.stdSign) {
                        if (!ele.textContent) {
                            ele.innerText = content.content.replace(/\s+/g,' ');
                        }
                    }

                } else if (data.contentType === 'table') {
                    position = content.position.split(',');
                    let tableHeight = Number(position[3] - position[1]) - 5;
                    ele.dataset.image = data.tableUrl;
                    const tableContainer = document.createElement('div');
                    tableContainer.innerHTML = content.content;
                    const tableNode = tableContainer.querySelector('table');
                    const rows = Array.from(tableNode.querySelectorAll('tr'));
                    rows.forEach(row => {
                        row.style.height = Math.floor(tableHeight / rows.length) + 'px';
                    });
                    // debugger
                    tableNode.height = tableHeight;
                    tableNode.style.height = tableHeight + 'px';
                    tableNode.dataset.fixedHeight = tableHeight;
                    document.body.appendChild(tableContainer);
                    const tableHtml = tableContainer.innerHTML;
                    tableContainer.remove();
                    ele.dataset.position = position.join(',');
                    ele.innerHTML = tableHtml;
                }
            } else if (['image','formula'].includes(data.contentType)) {
                let latex = data.contentType === 'formula' ? ` data-latex="${content.content}"` : '';
                let imgSrc;
                if (data.contentType === 'formula') {
                    imgSrc = content.cut_image_url;
                } else {
                    imgSrc = content.content;
                }
                if (!imgSrc.startsWith('http')) {
                    imgSrc = 'http://' + imgSrc;
                }
                // 重新置换图片地址,便于编辑
                const newImage = await this.getImgUrl(imgSrc);
                if (newImage) {
                    imgSrc = this.nodeURL + '/files/' + newImage;
                }
                // debugger
                ele.dataset.image = imgSrc;
                const imgSize = await this.getImageDimensions(imgSrc);
                // ele.style.height = imgSize.height + 'px';
                ele.innerHTML = `<img src="${imgSrc}"${latex}  width="${imgSize.width||'auto'}" height="${imgSize.height||'auto'}" />`
            }
            return ele;
        }

        const htmlArr = [];
        for (let i = 0; i<this.pageBaseInfo.length; i++) {
            const baseInfo = this.pageBaseInfo[i];
            const block = setBlock(baseInfo);
            const pages = this.pageContent[i];
            let itemsArray = [];
            for (let j=0; j<pages.length; j++) {
                const eleItem = pages[j];
                if (eleItem.contentType === 'layout') {
                    continue;
                }
                const element = await setElement(eleItem, baseInfo);
                if (element) {
                    // 中英文分割（主要是术语中英文名称）
                    if (/^[\u4e00-\u9fa5]+[a-zA-Z]+$/.test(element.textContent)) {
                        element.textContent = element.textContent.replace(/([^\x00-\xff])([a-zA-Z0-9])|([a-zA-Z0-9])([^\x00-\xff])/g, '$1$3 $2$4');
                    }
                    itemsArray.push(element);
                }
            }
            // 按位置进行排序
            itemsArray.sort((a, b) => {
                const aLeft = parseInt(a.dataset.left);
                const bLeft = parseInt(b.dataset.left);
                const aTop = parseInt(a.dataset.top);
                const bTop = parseInt(b.dataset.top);
                if (Math.abs(aTop - bTop) < 8) {
                    return aLeft - bLeft;
                } else {
                    return aTop - bTop;
                }
            });
            for (let j=0; j<itemsArray.length; j++) {
                let item = itemsArray[j];
                let prevItem = itemsArray[j-1];
                if (item.dataset.type === 'formula') {
                    // 处理公式编号
                    let nextItem = itemsArray[j+1];
                    if (nextItem) {
                        let nextText = nextItem.textContent.replace(/\(|\)|\（|\）|\s/g,'');
                        if (/^([A-Z]\.)?(\d+\.)*\d+$/.test(nextText)) {
                            item.dataset.number = nextText;
                            nextItem.dataset.invalid = true;
                        }
                    }
                } else if (item.dataset.type === 'section' && item.dataset.index === '1' && !item.dataset.prev && prevItem && prevItem.dataset.type === 'text') {
                    prevItem.style.fontSize = '16pt';
                    prevItem.style.fontFamily = 'simHei';
                }

                block.appendChild(item);
            }
            htmlArr.push(block.outerHTML);
            block.remove();
        }
        return {
            htmlArr,
            sectionPage,
            pageNo: this.pageNo,
        };
    },

    setStructOutline(htmlContent='', docId='') {
        this.rootId = $global.guid();
        const section = document.createElement('div');
        section.innerHTML = htmlContent;
        const pageContainer = section.querySelector('div.page-container');
        const sectionStart = pageContainer.dataset.sectionStart ? Number(pageContainer.dataset.sectionStart) : 2;
        const blocks = Array.from(pageContainer.querySelectorAll('div.info-block'));
        console.log(blocks)

        // let coverData = {};
        const pageContent = [];

        for (let i=0; i<blocks.length; i++) {
            const block = blocks[i];
            const pageInfo = {
                page: Number(block.dataset.page),
                minLeft: Number(block.dataset.minLeft),
                minTop: Number(block.dataset.minTop),
                maxTop: Number(block.dataset.maxTop),
                width: parseFloat(block.style.width),
                height: parseFloat(block.style.height),
                sectionStart,
            };
            // const nodeContent = [];
            const nodes = Array.from(block.querySelectorAll('div.text-box'));
            for (let j=0; j<nodes.length; j++) {
                const node = nodes[j];
                if (node.dataset.invalid) {
                    continue;
                }
                const textContent = node.innerText;
                let obj = {
                    docId,
                    contentId: node.dataset.id || '',
                    page: pageInfo.page || 1,
                    contentType: node.dataset.type || 'text',
                    prev: node.dataset.prev || '',
                    position: node.dataset.position || '',
                    imageUrl: node.dataset.image || '',
                    left: parseFloat(node.style.left),//node.dataset.left ? parseFloat(node.dataset.left) : 0,
                    top:parseFloat(node.style.top),//node.dataset.top ? parseFloat(node.dataset.top) : 0,
                    content: textContent,
                    tagTitle: node.dataset.tagTitle,
                    tagName: node.dataset.tag,
                    tagNum: node.dataset.number,
                    startNumber: node.dataset.start,
                }

                if (obj.contentType === 'section') {
                    obj.outlineId = $global.guid();
                    obj.orderNum = i * 1 + j;
                    obj.outlineType = node.dataset.outlinetype ? Number(node.dataset.outlinetype) : 6;
                    obj.outlineCatalog = node.dataset.index || '';
                    if (obj.outlineCatalog) {
                        if (obj.prev && obj.outlineType !== 8) {
                            obj.outlineCatalog = obj.prev + '.' + obj.outlineCatalog;
                        }
                        let reg = new RegExp(obj.outlineCatalog, 'i');
                        obj.outlineTitle = _.trim(textContent.replace(reg,''));
                        obj.content = obj.outlineTitle;
                    }
                } else if (['image','formula'].includes(obj.contentType)) {
                    let imgNode = node.querySelector('img');
                    obj.imageSrc = imgNode.src;
                    obj.imageWidth = Number(imgNode.width);
                    obj.imageHeight = Number(imgNode.height);
                    if (obj.contentType === 'formula') {
                        obj.content = node.dataset.latex;
                    }
                } else if (obj.contentType === 'table') {
                    obj.content = node.innerHTML;
                }
                pageContent.push(obj);
            }
        }
        console.log('pageContent====>', pageContent)

        // 提取封面数据
        let coverNodes = pageContent.filter(o => o.page === 1);
        coverNodes = _.orderBy(coverNodes, ['top']);
        // debugger
        const coverData = this.extractCover(coverNodes);

        // 提取大纲数据
        const outlineNodes = pageContent.filter(o => o.page > sectionStart);
        console.log('outlineNodes====>', outlineNodes);
        const outlineData = this.extractOutlineByNodes(outlineNodes);

        return {
            rootId: this.rootId,
            coverData,
            outlineData
        }
    },
    extractOutlineByNodes(outlineNodes=[]) {
        const getNextNode = (index, arr =[]) => {
            const nextNode = outlineNodes[index];
            if (nextNode && nextNode.contentType !== 'section') {
                if (nextNode.content === this.coverData.stdName && nextNode.left > 50) {
                    nextNode.isTitle = true;
                }
                arr = arr.concat(nextNode);
                return getNextNode(index + 1, arr);
            } else {
                return arr;
            }
        }
        // step1 预处理
        const outlineData = [];
        for (let i=0; i<outlineNodes.length; i++) {
            const node = outlineNodes[i];
            if (node.contentType === 'section') {
                // debugger
                node.childNodes = getNextNode(i + 1, []);
                // 处理附录章节
                if (node.outlineType === 8 && node.childNodes.length) {
                    let outlineTitle = [];
                    let lastPostion = '';
                    for (let j=0; j<node.childNodes.length; j++) {
                        let childNode = node.childNodes[j];
                        if (j === 0) {
                            if (/\资料|规范/.test(childNode.content)) {
                                node.outlineType = /\规范/.test(childNode.content) ? 9 : 8;
                                continue;
                            }
                        } else {
                            if (j === node.childNodes.length - 1) {
                                lastPostion = childNode.position || '';
                            }
                            outlineTitle.push(childNode.content);
                        }
                    }
                    if (lastPostion) {
                        node.position = node.position + '||' + lastPostion;
                    }
                    node.outlineTitle = outlineTitle.join("");
                    // node.childNodes = [];
                    delete node.childNodes;
                }
                outlineData.push(node);
            }
        }

        for (let i=0; i<outlineData.length; i++) {
            const item = outlineData[i];
            const prevItem = outlineData[i-1];
            if (item.outlineType === 6 && prevItem && item.outlineCatalog.split('.').length > 1) {
                if (prevItem.outlineCatalog.split('.').length === item.outlineCatalog.split('.').length - 1) { // 父子关系
                    item.parentId = prevItem.outlineId;
                } else { // 同级关系
                    item.parentId = prevItem.parentId;
                }
            } else {
                item.parentId = this.rootId;
            }
        }
        return $global.toTree(outlineData, {'idKey':'outlineId','parentKey':'parentId'});
    },
    parseCoverHtml(pageData={}, coverTemp={}, nodeURL) {
        this.nodeURL = nodeURL;
        let pageNo = '';
        const sectionEle = document.createElement('div');
        sectionEle.innerHTML = coverTemp.content;
        // debugger
        sectionEle.removeAttribute('contenteditable');
        sectionEle.style.pointerEvents = 'auto';

        // 处理ICS CCS
        if (!pageData.icsNumber && !pageData.ccsNumber) {
            if (sectionEle.querySelector('.ics-ccs')) {
                sectionEle.querySelector('.ics-ccs').remove();
            }
        } else {
            let icsNumberEle = sectionEle.querySelector('.icsNumber');
            if (icsNumberEle) {
                if (pageData.icsNumber) {
                    icsNumberEle.textContent = pageData.icsNumber;
                }
            }
            let ccsNumberEle = sectionEle.querySelector('.ccsNumber');
            if (ccsNumberEle) {
                if (pageData.ccsNumber) {
                    ccsNumberEle.textContent = pageData.ccsNumber;
                }
            }
        }
        /* let yearMonth = $global.formatDateTime('yyyy', new Date());
        // 标准编号的处理
        let stdNoSplit = ['XX', yearMonth];
        if (pageData && pageData.stdNo) {
            let noSplit = pageData.stdNo.split(/\—|-/);
            if (noSplit.length === 2) {
                stdNoSplit = noSplit;
            }
        } */
        // 标准标志|代码
        let stdSignEle = sectionEle.querySelector('.icon .stdSign');
        if (stdSignEle) {
            if (pageData && [1400,1500,6,8,9].includes(pageData.stdKind) && pageData.stdSign) {
                stdSignEle.textContent = pageData.stdSign || 'XXX';
            }
            stdSignEle.setAttribute('contenteditable', true);
        }

        // 标准代码
        let iconEle = sectionEle.querySelector('.icon');
        if (!pageData.stdSign) {
            pageData.stdSign = pageData.stdKind === 1100 ? 'GB/T' : (pageData.stdKind === 7 ? 'GB/Z' : '');
        }
        // 封面ICON图片自动转换
        if (iconEle && pageData && [1100,1200,6,7].includes(pageData.stdKind) && pageData.stdSign) {
            let stdIcon = pageData.stdCode || pageData.stdSign.split('/')[0];
            var nodeUrl = this.nodeURL;
            var iconUrl = nodeUrl + '/files/';
            if (stdIcon) {
                var iconHtml = '';
                if (pageData.stdKind === 1100 || pageData.stdKind === 7) {
                    iconUrl += 'images/cover_gb.png';
                    iconHtml = `<img style="width: 40mm; height: 20mm;" src="${iconUrl}" />`;
                    // 行业标准
                } else if (pageData.stdKind === 1200) {
                    iconUrl += 'images/industry/' + stdIcon + '.png';
                    iconHtml = `<img src="${iconUrl}" style="height:16mm !important;" />`;
                    // 地方标准
                } else if (pageData.stdKind === 6) {
                    stdIcon = stdIcon.replace(/DB/g, '').replace(/\/T/g, '');
                    iconUrl += 'images/cover_db.png';
                    iconHtml = `<img src="${iconUrl}" style="height:13mm !important;" />${stdIcon}`;
                    // 团体标准
                } else if (pageData.stdKind === 1500) {
                    stdIcon = stdIcon.replace(/\T\//gi, '');
                    iconUrl += 'images/cover_tb.png';
                    iconHtml = `<img src="${iconUrl}" style="height:12mm !important;" />&nbsp;${stdIcon}`;
                }
                iconEle.innerHTML = iconHtml;
            }
        }
        // 标准编号及代替编号
        let numbersEle = sectionEle.querySelectorAll('.numbers>p');
        if (pageData) {
            numbersEle.forEach((n, idx) => {
                if (idx === 0) {
                    var spanNodes = n.querySelectorAll('span');
                    spanNodes.forEach((s) => {
                        if ($global.hasClass(s, 'stdSign')) {
                            s.textContent = pageData.stdSign || 'X/XX';
                        } else {
                            s.textContent = pageData.stdNo ? pageData.stdNo.replace(/GB\/T/g, '') : '';
                        }
                    })
                    n.setAttribute('contenteditable', true);
                } else {
                    if (pageData.origStdNo) {
                        n.firstChild.textContent = pageData.origStdNo;
                        n.setAttribute('contenteditable', true);
                    } else {
                        n.remove();
                    }
                }
            });
            pageNo = pageData.stdSign + ' ' + pageData.stdNo;
            if (pageNo && pageNo.match(/GB\/T/igm) && pageNo.match(/GB\/T/igm).length > 1) {
                pageNo = "GB/T " + pageNo.replace(/[GB/T]/g, '').replace(/\s/, '');
            }
        }
        // 标准抬头
        let stdTitleEle = sectionEle.querySelector('h1.title');
        if (pageData && pageData.stdTitle && stdTitleEle && pageData.stdKind !== 1100 && !['中华人民共和国国家标准','中华人民共和国国家标准化指导性技术文件'].includes(pageData.stdTitle)) {
            stdTitleEle.innerHTML = `<span class="tag other stdTitle" data-tag="stdTitle" data-name="标准名称" data-type="1" contenteditable="true">${pageData.stdTitle}</span>`;
            stdTitleEle.setAttribute('contenteditable', true);
        }
        // 标准名称
        let stdNameEle = sectionEle.querySelector('.stdName');
        if (stdNameEle && pageData && pageData.stdName) {
            let stdNameSplit = pageData.stdName ? pageData.stdName.split('\n') : [];
            let stdNameHtml = [];
            stdNameSplit.forEach(s => {
                if (s) {
                    stdNameHtml.push(s);
                }
            })
            stdNameEle.innerHTML = stdNameHtml.join('<br/>');
            stdNameEle.setAttribute('contenteditable', true);
        }
        // 标准英文名称
        let stdNameEnEle = sectionEle.querySelector('.stdNameEn');
        if (stdNameEnEle) {
            if (pageData.stdNameEn) {
                let stdEnNameSplit = pageData.stdNameEn.split('\n');
                let stdEnNameHtml = [];
                stdEnNameSplit.forEach(s => {
                    if (s) {
                        stdEnNameHtml.push(s);
                    }
                })
                stdNameEnEle.innerHTML = stdEnNameHtml.join('<br/>');
                stdNameEnEle.setAttribute('contenteditable', true);
            } else {
                stdNameEnEle.remove();
            }
        }
        // 与国际标准一致性程度的标识
        let consistentSignEle = sectionEle.querySelector('.consistentSign');
        if (consistentSignEle) {
            if (consistentSignEle.textContent) {
                consistentSignEle.textContent = pageData.consistentSign;
                consistentSignEle.setAttribute('contenteditable', true);
            } else {
                consistentSignEle.remove();
            }
        }

        // 稿次版本
        let stdEditionEle = sectionEle.querySelector('.stdEdition');
        if (stdEditionEle) {
            if (stdEditionEle.textContent) {
                stdEditionEle.textContent = pageData.stdEdition;
                stdEditionEle.setAttribute('contenteditable', true);
            } else {
                stdEditionEle.remove();
            }
        }
        // 稿次更新日期
        let updateTimeEle = sectionEle.querySelector('.updateTime');
        if (updateTimeEle) {
            if (updateTimeEle.textContent) {
                updateTimeEle.textContent = pageData.updateTime;
                updateTimeEle.setAttribute('contenteditable', true);
            } else {
                updateTimeEle.remove();
            }
        }
        // 提交意见反馈
        let patentFileEle = sectionEle.querySelector('.patentFile');
        if (patentFileEle) {
            if (pageData.patentFile) {
                patentFileEle.textContent = pageData.patentFile;
            } else {
                patentFileEle.remove();
            }
        }

        // 发布日期
        let stdPublishDateEle = sectionEle.querySelector('.stdPublishDate');
        if (stdPublishDateEle) {
            stdPublishDateEle.textContent = pageData.stdPublishDate || 'XXXX-XX-XX';
            stdPublishDateEle.setAttribute('contenteditable', true);
        }
        // 实施日期
        let stdPerformDateEle = sectionEle.querySelector('.stdPerformDate');
        if (stdPerformDateEle) {
            stdPerformDateEle.textContent = pageData.stdPerformDate || 'XXXX-XX-XX';
            stdPerformDateEle.setAttribute('contenteditable', true);
        }
        // 发布单位
        // debugger
        if (pageData?.releaseDepartment && (![1100, 7].includes(pageData.stdKind) || !/^\国家市场监督管理总局/.test(pageData.releaseDepartment) || !/\国家标准化管理委员会+$/.test(pageData.releaseDepartment))) {
            let releaseDepartmentEle = sectionEle.querySelector('.main-util .releaseDepartment');
            if (releaseDepartmentEle && pageData.releaseDepartment) {
                let deptNameSplit = pageData.releaseDepartment.split('\n');
                let depHtml = [];
                deptNameSplit.forEach(s => {
                    if (s) {
                        depHtml.push(s);
                    }
                });
                if ([1100, 7].includes(pageData.stdKind)) {
                    releaseDepartmentEle.style.letterSpacing = "0";
                }
                releaseDepartmentEle.innerHTML = depHtml.join('<br/>');
                releaseDepartmentEle.setAttribute('contenteditable', true);
            }
        }

        var htmlContent = `<div class="info-block cover fixed" contenteditable="false">${sectionEle.innerHTML}</div>`;
        sectionEle.remove();
        return {
            pageNo,
            htmlContent
        };
    },

    parseOutlineHtml(outlineList=[], pageData={}) {
        const htmlContent = [];
        const pageNo = pageData.stdSign ? pageData.stdSign + ' ' + pageData.stdNo : pageData.stdNo||'';

        const getChildNodes = (item, arr=[]) => {
            if (item.childNodes && item.childNodes.length) {
                for (let i=0; i<item.childNodes.length; i++) {
                    const node = item.childNodes[i];
                    let ele;
                    let titleNum;
                    let upText = (node && node?.content) ? node.content.replace(/\s/g,'') : '';
                    switch (node?.contentType) {
                        case 'text':
                        case 'tableTitle':
                        case 'imgTitle':
                            ele = document.createElement('p');
                            ele.setAttribute('style','text-indent: 2em');
                            ele.className = node.contentType;
                            ele.textContent = node.content;
                            // 最后一行为标准名称的
                            if (i === item.childNodes.length - 1 && node.content === pageData.stdName) {
                                ele.remove();
                                continue;
                            }
                            // 图标题
                            if (['imgTitle','tableTitle'].includes(node.contentType)) {
                                ele.className = node.contentType === 'imgTitle' ? 'img-title' : 'table-title';
                                ele.dataset.number = node.tagNum || 1;
                                ele.textContent = node.tagTitle || node.content.trim();
                                ele.style.fontSize = this.minSize + 'px';
                            } else if (node.contentType === 'text' && node.tagName) {
                                if (/^\注[0-9]+(\:|\：)/.test(upText)) {
                                    titleNum = upText.split(/\:|\：/)[0].replace(/注/i,'');
                                } else if (/^\示例[0-9]+(\:|\：)/.test(upText)) {
                                    titleNum = upText.split(/\:|\：/)[0].replace(/示例/i,'');
                                }
                                ele.className = `tag ${node.tagName}`;
                                ele.dataset.type = node.tagName;
                                ele.textContent = node.tagTitle;
                                if (node.tagNum) {
                                    ele.dataset.number = titleNum || node.tagNum;
                                }
                            }
                            // if (item.contentType)
                            break;
                        case 'lower':
                        case 'line':
                        case 'num':
                        case 'num-index':
                            titleNum = upText.match(/^([0-9a-zA-Z]+)[\)|\）]/);
                            let startNumber = node.startNumber;
                            // debugger
                            if (node.contentType === 'num') {
                                startNumber = parseInt(titleNum[1]) - 1;
                            } else if (node.contentType === 'num-index') {
                                titleNum = upText.match(/^\[(\d+)\]/);
                                startNumber = parseInt(titleNum[1]) - 1;
                            } else if (node.contentType === 'lower') {
                                startNumber = titleNum[1].toUpperCase().charCodeAt() - 65;
                            }
                            ele = document.createElement('div');
                            ele.className = "bullet";
                            if (['lower','num','num-index'].includes(node.contentType)) {
                                ele.dataset.start = startNumber || node.startNumber || 0;
                                ele.dataset.level = node.contentType === 'num' ? 2 : 1;
                                ele.style.counterReset = `${node.contentType} ${startNumber}`;
                            }
                            ele.dataset.type = node.contentType;
                            ele.textContent = node.tagTitle ? node.tagTitle.replace(/[\)\）]/, '') : ele.textContent.replace(/[\)\）]/, '');
                            break;
                        case 'table':
                            const tableSection = document.createElement('div');
                            tableSection.innerHTML = node.content;
                            ele = tableSection.querySelector('table');
                            ele.style.width = '100%';
                            ele.dataset.id = $global.guid();
                            break;
                        case 'formula':
                        case 'image':
                            // debugger
                            ele = document.createElement('p');
                            ele.className = node.contentType === 'image' ? 'imgs image' : 'imgs';
                            if (node.contentType === 'formula' && node.tagNum) {
                                ele = document.createElement('figure');
                                ele.className = 'image math';
                                ele.dataset.number = node.tagNum;
                            }

                            let imgNode = document.createElement('img');
                            if (node.contentType === 'formula') {
                                imgNode.className = 'math-img';
                            }
                            imgNode.src = node.imageUrl;
                            imgNode.dataset.page = node.page;
                            imgNode.dataset.position = node.position;
                            imgNode.dataset.id = $global.guid();
                            imgNode.width = node.imageWidth;
                            imgNode.height = node.imageHeight;
                            ele.appendChild(imgNode);
                            break;
                    };

                    if (!node.page || !node) {
                        console.log('node.page=======>', node)
                    }
                    if (ele) {
                        ele.dataset.page = node.page;
                        ele.dataset.position = node.position;
                        arr.push(ele);
                    }
                }
            }

            return arr;
        }
        const getChildLevels = (item, arr=[]) => {
            let ele;
            let childNodes;
            if (item.children) {
                // debugger
                for (let node of item.children) {
                    node.outlineType = item.outlineType;
                    ele = document.createElement('div');
                    let cls = 'ol-list'
                    ele.className = cls;
                    ele.dataset.outlineid = node.outlineId;
                    ele.dataset.parentid = node.parentId;
                    ele.dataset.index = node.outlineCatalog;
                    ele.dataset.outlinetype = node.outlineType;
                    ele.dataset.page = node.page;
                    ele.dataset.position = node.position;
                    if (node.prev) {
                        ele.dataset.prev = node.prev;
                    }
                    if (node.outlineCatalog.split('.').length < 3) {
                        ele.dataset.bookmark = node.outlineId;
                    }
                    ele.textContent = node.outlineTitle || node.content;
                    if (node.childNodes && node.childNodes.length) {
                        childNodes = getChildNodes(node);
                        if (childNodes && childNodes.length) {
                            for (let child of childNodes) {
                                ele.appendChild(child);
                            }
                        }
                    }
                    arr = arr.concat(ele);
                    if (node.children && node.children.length) {
                        childNodes = getChildLevels(node);
                        if (childNodes && childNodes.length) {
                            for (let child of childNodes) {
                                arr.push(child)
                            }
                        }
                    }
                }
            }
            return arr;
        }

        var structIndex = 1, romaNumIndex = 1;
        let hasStdTitle = false;
        let headTitle;
        let levelNode;
        let childNodes;
        for (let i=0; i<outlineList.length; i++) {
            const item = outlineList[i];
            const block = document.createElement('div');
            let cls = 'info-block';
            block.dataset.sourcePage = item.page;
            block.dataset.outlineid = item.outlineId;
            block.dataset.parentid = item.parentId;
            block.dataset.outlinetype = item.outlineType;
            block.dataset.no = pageNo;
            if (![1,2].includes(item.outlineType)) {
                if ([8,9].includes(item.outlineType)) {
                    cls += ' appendix';
                } else if (![11,12].includes(item.outlineType)) {
                    cls += ' struct';
                }
                block.dataset.pagenum = structIndex;
                structIndex++;
            } else {
                block.dataset.pagenum = numberChar.roma[romaNumIndex];
                romaNumIndex++;
            }
            if ([1,2,11,12].includes(item.outlineType)) {
                headTitle = document.createElement('div');
                if ([11,12].includes(item.outlineType)) {
                    headTitle.className = 'header-title smaller';
                } else {
                    headTitle.className = 'header-title';
                }
                let headContent = item.outlineTitle || item.content || '';
                if (headContent.length === 2) {
                    headContent = headContent.split('').join('&nbsp;&nbsp;');
                }

                headTitle.dataset.bookmark = item.outlineId;
                headTitle.dataset.page = item.page;
                headTitle.dataset.position = item.position;
                headTitle.innerHTML = `<p>${headContent}</p>`;
                block.appendChild(headTitle);

                childNodes = getChildNodes(item);
                if (childNodes && childNodes.length) {
                    for (let childNode of childNodes) {
                        block.appendChild(childNode);
                    }
                }
                // block.dataset.outlineid = item.outlineId;
            } else {
                if (!hasStdTitle) {
                    headTitle = document.createElement('div');
                    headTitle.className = 'header-title chapter';
                    headTitle.dataset.parentid = item.parentId;
                    headTitle.dataset.page = item.page;
                    headTitle.dataset.position = item.position;
                    headTitle.innerHTML = `<p data-bind="stdName">${pageData.stdName}</p>`;
                    block.appendChild(headTitle);
                    hasStdTitle = true;
                }
                // 章节
                if ([8,9].includes(item.outlineType)) {
                    headTitle = document.createElement('div');
                    headTitle.className = 'header-title appendix';
                    headTitle.setAttribute('contenteditable', false);
                    headTitle.dataset.parentid = item.parentId;
                    headTitle.dataset.outlineid = item.outlineId;
                    headTitle.dataset.bookmark = item.outlineId;
                    headTitle.dataset.number = item.prev;
                    // debugger
                    headTitle.innerHTML = `<p class="appendix" data-number="${item.prev}">附 录</p><p class="${item.outlineType===8?'docattr specs':'docattr means'}">（${item.outlineType===8?'资料性':'规范性'}）</p><p contenteditable="true" class="appendix-title" data-page="${item.page}" data-position="${item.position}">${item.outlineTitle||item.content}</p>`;
                    block.appendChild(headTitle);

                } else {
                    levelNode = document.createElement('div');
                    levelNode.className = 'ol-list';
                    levelNode.dataset.page = item.page;
                    levelNode.dataset.position = item.position;
                    levelNode.dataset.bookmark = item.outlineId;
                    levelNode.dataset.outlinetype = item.outlineType;
                    levelNode.dataset.index = item.outlineCatalog;
                    levelNode.dataset.outlineid = item.outlineId;
                    levelNode.dataset.parentid = item.parentId;
                    levelNode.textContent = item.outlineTitle;
                    // debugger
                    if (item.childNodes) {
                        childNodes = getChildNodes(item);
                        if (childNodes && childNodes.length) {
                            for (let childNode of childNodes) {
                                levelNode.appendChild(childNode);
                            }
                        }
                    }
                    block.appendChild(levelNode);
                }

                if (item.children && item.children.length) {
                    childNodes = getChildLevels(item);
                    if (childNodes && childNodes.length) {
                        for (let childNode of childNodes) {
                            block.appendChild(childNode);
                        }
                    }
                }
            }
            // const childNodes = getChildNodes(item);
            const tableNodes = Array.from(block.querySelectorAll('table'));
            for (let i=0; i<tableNodes.length; i++) {
                const tableNode = tableNodes[i];
                const firstEle = tableNode.querySelector('colgroup') || tableNode.querySelector('thead') || tableNode.querySelector('tbody');
                let peveNode = tableNode.previousElementSibling;
                let nextNode = tableNode.nextElementSibling;
                // 处理表标题
                if (peveNode) {
                    let descTitle = null;
                    let isTitle = false
                    if ($global.hasClass(peveNode, 'table-title')) {
                        isTitle = true;
                    } else {
                        peveNode = peveNode.previousElementSibling;
                        descTitle = peveNode.nextElementSibling;
                        if ($global.hasClass(peveNode, 'table-title')) {
                            isTitle = true;
                        }
                    }
                    if (isTitle) {
                        if (descTitle) {
                            const tableDesc = document.createElement('caption');
                            tableDesc.className = 'table-description';
                            tableDesc.textContent = descTitle.textContent;
                            tableNode.insertBefore(tableDesc, firstEle);
                            descTitle.remove();
                        }

                        const tableTitle = document.createElement('caption');
                        tableTitle.className = 'table-title';
                        tableTitle.dataset.page = peveNode.dataset.page;
                        tableTitle.dataset.position = peveNode.dataset.position;
                        tableTitle.dataset.number = peveNode.dataset.number;
                        tableTitle.textContent = peveNode.textContent;
                        tableNode.insertBefore(tableTitle, firstEle);
                        peveNode.remove();
                    }
                }

                if (nextNode && nextNode.nodeName === 'TABLE') {
                    const colgroup = nextNode.querySelector('colgroup');
                    if (firstEle.childNodes.length === colgroup.childNodes.length) {
                        const tableBody = tableNode.querySelector('tbody');
                        const cloneBody = nextNode.querySelector('tbody');
                        Array.from(cloneBody.querySelectorAll('tr')).forEach(tr => {
                            tableBody.appendChild(tr)
                        });
                        nextNode.remove();
                    }
                }
            }

            block.className = cls;
            htmlContent.push(block.outerHTML);
            block.remove();
        }
        return htmlContent.join("");
    },


    parseStruct_bak() {
        const checkIsToc = (data) => {
            for (let i=0; i<data.length; i++) {
                const item = data[i];
                if (item.content) {
                    const textContent = item.content.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '');
                    if (['目次','目录'].includes(textContent)) {
                        return i;
                    }
                }
            }
            return 0;
        }
        const checkStruct = (data, pageBaseInfo) => {
            for (let i=0; i<data.length; i++) {
                const item = data[i];
                const textContent = item.content.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '');
                if (/^[\前言|\引言]/.test(textContent) && Math.abs(item.position[0] - pageBaseInfo.minLeft) > this.minSize * 5) {
                    return true;
                }
            }
            return false;
        }
        let structIndex = 0;
        for (let i=0; i<this.pageContent.length; i++) {
            const page = this.pageContent[i];
            const pageBaseInfo = this.pageBaseInfo[i];
            // debugger
            if (i === 0) {  // 处理文档第一页
                if(!this.docType) {  // 标准文档
                    this.extractCover(page);
                }
                continue;
            } else if (checkStruct(page, pageBaseInfo)) {
                structIndex = i;
                break;
            }
        }
        this.extractStruct(structIndex);
    },

    extractStruct(index) {
        const outlineList = [];
        let isBreak = false;
        let finishedStruct = false;

        for (let i=index; i<this.pageContent.length; i++) {
            if (isBreak) {
                break;
            }
            const pageBaseInfo = this.pageBaseInfo[i];
            var page = this.pageContent[i];
            // 合并行
            page = page.reduce((acc, current) => {
                const existing = acc.find(item => Math.abs(item.top - current.top) <= 7 && current.contentType === 'text' && current.contentType === item.contentType );
                if (existing) {
                    existing.content += current.content;
                } else {
                    acc.push(current);
                }
                return acc;
            }, []);

            let structData;
            for (let j=0; j<page.length; j++) {
                const item = page[j];
                if (item.isMerge) {
                    continue;
                }
                if (item.contentType === 'text') {
                    const position = item?.position || [];
                    let textContent = item.content.replace(/[\u200B-\u200D\uFEFF]/g, '');
                    let upText = textContent.replace(/\s/g, '');

                    // 提取章节或条款
                    let isAppenidxTitle = false;
                    if (/^\附录[A-Z]$/.test(upText.replace(/\s/g,''))) {
                        isAppenidxTitle = true;
                    }
                    // 页面第一行的编号忽略
                    if ((upText.replace(/\--|\-/g,'') === this.pageNo || upText.match(/^(.*?)\s*(\d+[\/\-—]\d+.*)$/) || upText.match(/^([A-Z]{2,4}\/?T?)(\s?)/)) && pageBaseInfo.minTop == position[1]) {
                        continue;
                    }

                    // 章节
                    if (Math.abs(position[0] - pageBaseInfo.minLeft) <= 10 || (isAppenidxTitle && position[0] > 100) || (['前言','引言','索引','参考文献'].includes(upText) && position[0] > 300)) {
                        structData = this.isStruct(upText, outlineList.length ? outlineList[outlineList.length-1]['index'] : undefined, isAppenidxTitle);
                        if (structData && !finishedStruct) {
                            // debugger
                            structData.uuid = item.uuid;
                            structData.page = item.page;
                            structData.outlineId = $global.guid();
                            structData.startIndex = j;
                            if (!structData.outlineTitle && structData.outlineType === 8) {
                                let nextItem = page[j+1];
                                // debugger
                                if ((nextItem.content.replace(/\s/g,'').includes('资料性') || nextItem.content.replace(/\s/g,'').includes('规范性')) && nextItem.contentType === 'text') {
                                    if (nextItem.content.replace(/\s/g,'').includes('资料性')) {
                                        structData.outlineType = 9;
                                    }
                                    nextItem.appendixTitle = true;
                                    structData.outlineTitle = nextItem.content.replace(/\s/g,'');
                                    nextItem = page[j+2];
                                    if (nextItem.contentType === 'text') {
                                        structData.outlineTitle += '\n' + nextItem.content.replace(/\s/g,'');
                                        nextItem.appendixTitle = true;
                                    }
                                }
                            }
                            // console.log('structData==>', structData);
                            outlineList.push(structData);

                            if (structData.outlineType === 12) {
                                finishedStruct = true;
                            }
                        }
                    }
                }
            }
        }
        // outlineList = this.resetOutlineStruct(outlineList);

        this.getContent(outlineList);

    },

    getContent(outlineList) {
        for (let i=0; i<outlineList.length; i++) {
            const item = outlineList[i];
            // const pageData = this.pageContent[item.page];
            const pageInfo = _.find(this.pageBaseInfo, { pageNum:item.page });
            const nextItem = outlineList[i+1];
            const nextPageInfo = nextItem ? _.find(this.pageBaseInfo, { pageNum:nextItem.page }) : null;

            let minTop = pageInfo.minTop;
            // let maxTop = pageInfo.maxTop;
            if (nextPageInfo) {
                minTop = nextPageInfo.minTop;
            }

            let startIndex = _.findIndex(this.sourceData, {uuid:item.uuid}) + 1;
            let endIndex = nextItem ? _.findIndex(this.sourceData, {uuid:nextItem.uuid}) : this.sourceData.length;

            // let pageData = this.sourceData;
            /* if ([1,2,11,12].includes(item.outlineType)) {
                pageData = this.pageContent[item.page];
                startIndex = item.startIndex + 1;
                endIndex =
            } */
            // debugger

            item.children = [];
            for (let j=startIndex; j<endIndex; j++) {
                const pageItem = this.sourceData[j];
                const content = pageItem.contentType === 'text' ? pageItem.content.replace(/\s/g,'') : '';
                console.log('pageItem', pageItem);
                if ([1,2].includes(item.outlineType) && content && this.coverData.stdName.includes(content)) {
                    // continue;
                    pageItem.isStdTitle = true;
                }
                // 忽略附录标题
                if (pageItem.appendixTitle) {
                    continue;
                }
                // 去掉页眉
                if (Math.abs(pageItem.positionY - minTop) < this.minSize / 2 && content.replace(/\--|\-/g,'') === this.pageNo) {
                    // continue;
                    pageItem.isPageHead = true;
                }
                // 去掉页脚 Math.abs(pageItem.positionY - maxTop) < this.minSize / 2 &&
                if (['I','II','III','IV','V','I'].includes(content.toUpperCase())) {
                    pageItem.isPageFoot = true;
                }
                item.children.push(pageItem);
            }
        }
        // debugger
        console.log('outlineList===>', outlineList)
    },

    isStruct(wrapText, prevIndex, isAppdenxTitle=false){
        let obj = null;
        let textNumber = wrapText.split(/\s/).map(String);
        if (['前言','引言','参考文献','索引'].includes(wrapText.replace(/\s/g,''))) {
            wrapText = wrapText.replace(/\s/g,'');
            obj = {
                index: "",
                outlineType: this.getOutlineType(wrapText),
                outlineTitle: wrapText,
                parentId: this.rootId
            }
        } else if (/^[\附录]+[A-Z]/.test(wrapText.replace(/\s/g,''))) {
            wrapText = wrapText.replace(/\s/g,'');
            obj = {
                index: wrapText.replace(/[\u4E00-\u9FA5-（-）/\s/]/g, ''),
                outlineType: 8,
                outlineTitle: "",
                parentId: this.rootId
            }

        } else if (/^[0-9]+(范围)+$/.test(textNumber[0]) || /^[0-9]+(总则)+$/.test(textNumber[0]) || /^[0-9]+(规范性引用)/.test(textNumber[0]) || /^[0-9]+(技术要求)/.test(textNumber[0])) {
            wrapText = textNumber[0];
            let index = wrapText.replace(/[\u4E00-\u9FA5]/g,'');
            obj = {
                index,
                outlineType: this.getOutlineType(textNumber[0]),
                outlineTitle: wrapText.replace(/[0-9]/g,''),
                parentId: this.rootId,
            }

        } else if ((wrapText.match(/^([A-Z0-9](?:[\.\dA-Z]*))/) || wrapText.match(/^(\d+(\.\d+)*)/)) && !isAppdenxTitle && ![')','）'].includes(wrapText.slice(1))) { //wrapText.match(/^([A-Z0-9]+\.)*[A-Z0-9]+\b/)
            const mb = wrapText.match(/^(\d+(\.\d+)*)/) || wrapText.match(/^([A-Z0-9](?:[\.\dA-Z]*))/); //wrapText.match(/^([0-9]+\.)*[0-9]/) || wrapText.match(/^([A-Z](?:\.\d+)+)(?=[A-Z]|$)/) || wrapText.match(/^([A-Z](?:\.\d+)*(?:\d+)?)(?![.\dA-Z])/);
            // debugger
            const checkIsNumber = mb ? mb[0].split('.').every(part => /^\d+$/.test(part)||/^[A-Z]/.test(part)) : null;
            if (!_.isEmpty(mb) && checkIsNumber) {
                let index = mb[0];
                if (index && /^([A-Z]\.\d+(\.\d+)*|\d+(\.\d+)*)$/.test(index)) {
                    const reg = new RegExp(index,'i')
                    obj = {
                        index,
                        outlineType: this.getOutlineType(wrapText.replace(/\s/g,'')),
                        cls: 'ol-list',
                        outlineTitle: wrapText.replace(reg,'').trim(),
                        isAppdenxTitle,
                        // number: index
                    }
                    // 附录项
                    if (/^[A-Z]\.\d+(\.\d+)*$/.test(index)) {
                        obj.index = index.replace(/^[\A-Z]\./g,'');
                        obj.prev = index.replace(/[^\A-Z]/g,'');
                        obj.cls = 'appendix-list';
                        obj.number = obj.prev + '.' + obj.index;
                    }
                    if (index.length === 1) {
                        obj.primary = true;
                    }
                    // 比较编号是否符合顺序
                    if (prevIndex && !this.compareOutline(obj.index, prevIndex)) {
                        obj = null;
                    }
                }
            }

        }/* else if (/^\附录[A-Z]$/.test(wrapText.replace(/\s/g,'')) && isAppdenxTitle) {
            let prev = wrapText.replace(/[^\A-Z]/g,'');
            obj = {
                index: "",
                isAppendix: true,
                cls: 'ol-list',
                outlineType: 8,
                prev,
                outlineTitle: wrapText
            }
        } */
        if (obj && obj.index && obj.index.length === 1) {
            obj.primary = true;
            obj.parentId = this.rootId;
        }

        return obj;
    },

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
            } else if (splitPrevIndex[i] === splitCurrIndex[i] - 1) {
                flag = true;
                break;
            } else if (splitPrevIndex[i] > splitCurrIndex[i]) {
                flag = false;
                break;
            }
        }
        return flag;
    },

    extractCover(data=[]) {
        // const pageInfo = this.pageBaseInfo[0];
        const coverData = {};
        // let hasStdName = false;
        // let hasStdEnName = false;
        const parseData = (index) => {
            for (let i=index; i<data.length; i++) {
                const item = data[i];
                const content = item.content;
                if(!item) {
                    return;
                }
                // index = i;
                if (item.contentType === 'text') {
                    let textContent = content.replace(/[\u200B-\u200D\uFEFF]/g, '').replace('--','—');
                    let upText = textContent.replace(/\s/g, '');
                    if (i === 0 && upText.toUpperCase().match(/\ICS/i) === null && (/^([A-Z]{2,4}\/?T?)(\s?)/.test(upText) || upText.includes('T/') || /^[A-Z/\s/]+/.test(upText.toUpperCase()))) {
                        parseData(i+1);
                        break;
                    }
                    // debugger
                    if (/^[A-Z-0-9-/\s/]+/.test(upText.toUpperCase()) && !coverData.icsNumber && upText.toUpperCase().replace(/\ICS/g, '') !== '' && !coverData.stdTitle) {
                        coverData.icsNumber = textContent.toUpperCase().replace(/\ICS/g, '').trim();
                        parseData(i+1);
                        break;
                    } else if (/^[A-Z-0-9-/\s/]+/.test(upText.toUpperCase()) && !coverData.ccsNumber && upText.toUpperCase().replace(/\CCS/g, '')!=='' && !coverData.stdTitle) { // upText.toUpperCase().match(/\CCS/i) !== null &&
                        coverData.ccsNumber = textContent.toUpperCase().replace(/\CCS/g, '').trim();
                        parseData(i+1);
                        break;
                    } else if (/^\备案号/.test(upText) && !coverData.recordNumber && !coverData.stdTitle) { // 备案号record_number
                        coverData.recordNumber = upText.replace(/\备案号|\：|\:/g,'');
                        parseData(i+1);
                        break;
                    } else if (upText.slice(-2) === '标准' && /^[\u4E00-\u9FA5]+$/.test(upText) && !coverData.stdTitle) { // 标准抬头
                        coverData.stdTitle = upText;
                        if (upText.match(/\中华人民共和国国家标准/) !== null && !coverData.stdSign) {
                            coverData.stdSign = 'GB/T';
                        }
                        parseData(i+1);
                        break;
                    } else  if (/^[A-Z]+(\/[A-Z]+)*(\s[A-Z]+)*\s?[A-Z0-9]+([.\-][A-Z0-9]+)*([—-]\d{2,4})*/.test(upText) && !coverData.stdNo) { // /^[A-Z]+(\W)+[A-Z0-9]/ /^[A-Z]+(\/[A-Z]+)*(\s[A-Z]+)*\s?[A-Z0-9]+([.\-][A-Z0-9]+)*([—-]\d{2,4})?$/
                        const docNo = textContent.split(/\s/g);
                        if (docNo.length > 1) {
                            coverData.stdSign = docNo.slice(0,1).join('');
                            coverData.stdNo = docNo.slice(1).join('');
                        }
                        parseData(i+1);
                        break;
                    } else if (upText.match(/^代替/i) && /^[\u4E00-\u9FA5-a-zA-Z-/— 0-9-(\d+(\.\d+)?)]+$/.test(upText) && !coverData.origStdNo) { // 代替编号
                        coverData.origStdNo = _.trim(textContent.replace(/代替/g, ''));
                        parseData(i+1);
                        return;
                    } else if (/[\u4E00-\u9FA5]/.test(upText) && upText.match(/\发布|\实施/i) === null && !coverData.stdName) { // 标准名称
                        coverData.stdName = textContent.trim();
                        parseData(i+1);
                        return;
                    } else if (/[\u4E00-\u9FA5]/.test(upText) && upText.match(/\发布|\实施/i) === null && coverData.stdName && !coverData.stdPublishDate && !/\稿/.test(upText)) { // 换行的标准名称
                        coverData.stdName += '\n' + textContent.replace(/\s+/g, '');
                        parseData(i+1);
                        return;
                    } else if (!/[\u4E00-\u9FA5]/.test(upText) && !coverData.stdNameEn) { // 英文标准名称
                        coverData.stdNameEn = textContent.trim();
                        parseData(i+1);
                        return;
                    } else if (!/[\u4E00-\u9FA5]/.test(upText) && coverData.stdNameEn && !['MOD)','IDT)','NEQ)'].includes(upText.slice(-4))) { // 换行的英文标准名称
                        coverData.stdNameEn += '\n' + textContent.trim();
                        parseData(i+1);
                        return;
                    } else if ((/^\(ISO/.test(upText) || ['MOD)','IDT)','NEQ)'].includes(upText.slice(-4))) && !/[\u4E00-\u9FA5]/.test(upText) && !coverData.consistentSign) {
                        coverData.consistentSign = textContent.trim().replace(/\(|\)|\（|\）/g,'');
                        parseData(i+1);
                        return;
                    } else if ((/(?:稿$)|\(稿\)/.test(upText) || /稿(?![^稿]+$)/.test(upText.replace(/\(|\)|\（|\）/g,''))) && !coverData.stdEdition) {
                        coverData.stdEdition = textContent.trim();
                        parseData(i+1);
                        return;
                    } else if (upText.match(/\本稿|\完成|\年|\月|[0-9]/i) !== null && upText.match(/发布/i) === null && upText.match(/实施/i) === null && !coverData.updateTime) {
                        const ft = upText.split(/\:|\：/i);
                        coverData.updateTime = ft[ft.length - 1];
                        parseData(i+1);
                        return;
                    } else if (/[\u4E00-\u9FA5]/.test(upText) && upText.match(/\发布$|\实施$/i) === null && (!/(?:稿$)|\(稿\)/.test(upText) || /稿(?![^稿]+$)/.test(upText.replace(/\(|\)|\（|\）/g,''))) && (coverData.stdName || coverData.stdNameEn) && (!coverData.stdPublishDate || !coverData.stdPerformDate)) {
                        coverData.patentFile = upText;
                        parseData(i+1);
                        return;
                    } else if (upText.match(/发布/i) && upText.match(/实施/i) && !coverData.stdPublishDate && !coverData.stdPerformDate) {
                        const str = textContent.replace(/[^A-Z-\d.]/g, '');
                        coverData.stdPublishDate = str.slice(0, str.length / 2);
                        coverData.stdPerformDate = str.slice(str.length / 2, str.length);
                        parseData(i+1);
                        return;
                    } else if (upText.substr(1).substr(-2) === '发布' && !/^[\u4E00-\u9FA5/\s/]+$/.test(upText) && !coverData.stdPublishDate) {
                        coverData.stdPublishDate = upText.replace(/[^A-Z-\d.]/g, '');
                        parseData(i+1);
                        return;
                    } else if (upText.substr(1).substr(-2) === '实施' && !/^[\u4E00-\u9FA5/\s/]+$/.test(upText) && !coverData.stdPerformDate) {
                        coverData.stdPerformDate = upText.replace(/[^A-Z-\d.]/g, '');
                        parseData(i+1);
                        return;
                    } else if (/\.*?\发布/.test(upText) && /^[\u4E00-\u9FA5/\s/]+$/.test(upText) && !coverData.releaseDepartment && (coverData.stdPublishDate || coverData.stdPerformDate)) { //
                        coverData.releaseDepartment = upText.replace('发布','');
                    } else if (/[\u4E00-\u9FA5]/.test(upText) && !coverData.releaseDepartment) {
                        coverData.releaseDepartment = textContent.trim();
                        parseData(i+1);
                        return;
                    } else if (/[\u4E00-\u9FA5]/.test(upText) && coverData.releaseDepartment) {
                        coverData.releaseDepartment += '\n' + textContent.trim();
                        parseData(i+1);
                        return;
                    }
                }
            }
        }
        // start
        parseData(0);

        if (coverData.stdSign) {
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
        }
        if (coverData.releaseDepartment) {
            coverData.releaseDepartment = coverData.releaseDepartment.replace("发布\n","");
        }
        this.coverData = coverData;
        this.pageNo = (coverData.stdSign + coverData.stdNo).replace(/\s/g,'').replace(/\--|\-/g,'');
        // console.log('coverData===>', coverData);
        return coverData;
    },

    extractToc(index, tocIndex) {
        var tocList = [];
        const nearPost = (top) => {
            for (let toc of tocList) {
                if (Math.abs(toc.top - top) < this.minSize / 2) {
                    return toc;
                }
            }
        }

        let isBreak = false;
        for (let i=index; i<this.pageContent.length; i++) {
            var page = this.pageContent[i];
            const pageBaseInfo = this.pageBaseInfo[i];
            if (isBreak) {
                break;
            }
            /* page = _.sortBy(page, (o) => {
                let position = o.content.position;
                return Number(position[1]) && Number(position[0]);
            }); */
            for (let j=0; j<page.length; j++) {
                // debugger
                const item = page[j];
                const content = item.content;
                if (i === index && j < tocIndex) {
                    continue;
                }

                if (item.contentType === 'text') {
                    let textContent = content.content.replace(/[\u200B-\u200D\uFEFF]/g, '');
                    let upText = textContent.replace(/\s/g, '');
                    // 过滤掉编号
                    if (upText.replace(/\--|\-/g,'') === this.pageNo || upText.match(/^(.*?)\s*(\d+[\/\-—]\d+.*)$/) || upText.match(/^([A-Z]{2,4}\/?T?)(\s?)/)) {
                        continue;
                    }
                    if (/^[\前言|\引言]/.test(upText) && Math.abs(Number(item.content.position[0]) - pageBaseInfo.minLeft) > this.minSize * 5) {
                        isBreak = true;
                        break;
                    }
                    const obj = {
                        i,
                        text: upText.replace(/\p{P}+$/u, ''),
                        top: item.positionY
                    }
                    if(obj.text == 2) {
                        debugger
                    }
                    tocList.push(obj);
                    /* const sameItem = nearPost(item.positionY);
                    if (sameItem) {
                        sameItem.number = upText;
                    } else {
                        tocList.push(obj);
                    } */
                    // console.log(textContent)
                }
            }
        }
        // debugger
        tocList = _.orderBy(tocList, ['top']);
        tocList = tocList.map(item => {
            item.outlineType = this.getOutlineType(item.text);
            /* if (item.text === '前言') {
                item.outlineType = 1;
            } else if (item.text === '引言') {
                item.outlineType = 2;
            } else if (item.text === '参考文献') {
                item.outlineType = 11;
            } else if (item.text === '索引') {
                item.outlineType = 12;
            } else if () {

            } */
            return item;
        })

        console.log('tocList===>', tocList);

    },

    getOutlineType(text='') {
        if (/^\前言/.test(text)) {
            return 1;
        } else if (/^\引言/.test(text)) {
            return 2;
        } else if (/^[0-9]+(范围)+$/.test(text) || /^[0-9]+(总则)+$/.test(text)) {
            return 3;
        } else if (/^[0-9]+(规范性引用文件)+$/.test(text)) { //术语和定义
            return 4;
        } else if (/^[0-9]+(术语和定义)+$/.test(text)) {
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
}
