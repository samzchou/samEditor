// 全局函数
import $global from '@/utils/global.js';
import { uploadFile } from '@/api/nodeServer.js';

export default {
    pageData: {
        stdName: '标准名称'
    },
    nodeURL: '',

	// 提取标准编号
	extractStandardParts(str) {
		const match = str.match(/^(.*?)\s*(\d+[\/\-—]\d+.*)$/); // /^([A-Z]{2,4}\/?T?)(\s?)/
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

    parseCoverHtml(pageData = {}, coverTemp = {}, nodeURL) {
        this.pageData = pageData;
        this.nodeURL = nodeURL;
        var pageNo = '';
        // var yearMonth = $global.formatDateTime('yyyy', new Date());
        try {
            var sectionEle = document.createElement('div');
            sectionEle.innerHTML = coverTemp.content;
            // 处理ICS CCS
            if (!pageData.icsNumber && !pageData.ccsNumber) {
                if (sectionEle.querySelector('.ics-ccs')) {
                    sectionEle.querySelector('.ics-ccs').remove();
                }
            } else {
                let icsNumberEle = sectionEle.querySelector('.icsNumber');
                if (icsNumberEle) {
                    icsNumberEle.textContent = pageData.icsNumber.replace(/[\ICS|ics]/g,'').trim().toUpperCase();
                }
                let ccsNumberEle = sectionEle.querySelector('.ccsNumber');
                if (ccsNumberEle) {
                    ccsNumberEle.textContent = pageData.ccsNumber.replace(/[\CCS|ccs]/g,'').trim().toUpperCase();
                }
            }
			// debugger
            // 标准编号的处理 /^([A-Z]{2,4}\/?T?\s?)?(\d{4}-\d{4}—\d{4}|\d{8}—\d{4}|\d{3}-\d{4}|\d{4}-\d{4})$/.test(pageData.stdNo)
			if (!pageData.stdSign) {
                if (pageData.stdNo && pageData.stdNo.match(/\b[A-Z][A-Z\d\/\s—.-]+(?:—\d{4})?\b/g) !== null) {
					let { stdSign, stdNo } = this.extractStandardParts(pageData.stdNo);
					if (stdSign) {
						/*
						if (pageData.stdKind && [6,1500].includes(pageData.stdKind)) {
							stdSign = stdSign.replace("T/","").replace("DB");
						}
						*/
						pageData.stdSign = stdSign;
					}
					pageData.stdNo = stdNo;
				} else {
					pageData.stdSign = pageData.stdKind === 1100 ? 'GB/T' : (pageData.stdKind === 7 ? 'GB/Z' : '');
				}
            }
            // var stdNoSplit = ['XX', yearMonth];
            /* if (pageData && pageData.stdNo) {
                let noSplit = pageData.stdNo.split(/\—|-/);
                if (noSplit.length === 2) {
                    stdNoSplit = noSplit;
                }
            } */
            // 标准标志|代码
            let stdSignEle = sectionEle.querySelector('.icon .stdSign');
            if (stdSignEle) {
                if (pageData && [1400,1500,6,8,9].includes(pageData.stdKind) && pageData.stdSign) {
					let stdSign = pageData.stdSign.replace("T/","").replace("DB");
                    stdSignEle.textContent = stdSign;
                }
            }
            // 标准代码ICON
            let iconEle = sectionEle.querySelector('.icon');

            // 封面ICON图片自动转换
            if (iconEle && [1100,1200,6,7].includes(pageData.stdKind) && pageData.stdSign) {
                let stdIcon = pageData.stdCode || pageData.stdSign.split('/')[0];
                var nodeUrl = this.nodeURL;
                var iconUrl = nodeUrl + '/files/';
                if (stdIcon) {
                    var iconHtml = '';
                    if (pageData.stdKind === 1100 || pageData.stdKind === 7) { // 国际标准 | 指导性文件
                        iconUrl += 'images/cover_gb.png';
                        iconHtml = `<img style="width: 40mm; height: 20mm;" src="${iconUrl}" />`;
                    } else if (pageData.stdKind === 1200) { // 行业标准
                        iconUrl += 'images/industry/' + stdIcon + '.png';
                        iconHtml = `<img src="${iconUrl}" style="height:16mm !important;" />`;
                    } else if (pageData.stdKind === 6) { // 地方标准
                        stdIcon = stdIcon.replace(/DB/g, '').replace(/\/T/g, '');
                        iconUrl += 'images/cover_db.png';
                        iconHtml = `<img src="${iconUrl}" style="height:13mm !important;" />${stdIcon}`;
                    } else if (pageData.stdKind === 1500) { // 团体标准
                        stdIcon = stdIcon.replace(/\T\//gi, '');
                        iconUrl += 'images/cover_tb.png';
                        iconHtml = `<img src="${iconUrl}" style="height:12mm !important;" />&nbsp;${stdIcon}`;
                    }
                    iconEle.innerHTML = iconHtml;
                }
            }
            // 标准编号及代替编号
            const numbersEle = sectionEle.querySelectorAll('.numbers>p');
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
                } else {
                    n.firstChild.textContent = pageData.origStdNo || "";
                }
            });
            pageNo = pageData.stdSign + ' ' + pageData.stdNo;
            if (pageNo && pageNo.match(/GB\/T/igm) && pageNo.match(/GB\/T/igm).length > 1) {
                pageNo = "GB/T " + pageNo.replace(/[GB/T]/g, '').replace(/\s/, '');
            }
            pageData.pageNo = pageNo;

            // 标准抬头
            const stdTitleEle = sectionEle.querySelector('h1.title');
            if (pageData && pageData.stdTitle && stdTitleEle && pageData.stdKind !== 1100) {
                stdTitleEle.innerHTML = `<span class="tag other stdTitle" data-tag="stdTitle" data-name="标准名称" data-type="1" contenteditable="true">${pageData.stdTitle}</span>`;
            }

            // 标准名称
            const stdNameEle = sectionEle.querySelector('.stdName');
            if (stdNameEle && pageData && pageData.stdName) {
                // debugger
				pageData.stdName = pageData.stdName.replace("\\n","\n");
                let stdNameSplit = pageData.stdName.split(/\n/);
                let stdNameHtml = [];
                stdNameSplit.forEach(s => {
                    if (s) {
                        stdNameHtml.push(s);
                    }
                })
                stdNameEle.innerHTML = stdNameHtml.join('<br/>');
            }
            // 标准英文名称
            const stdNameEnEle = sectionEle.querySelector('.stdNameEn');
            if (stdNameEnEle && pageData.stdNameEn) {
				pageData.stdNameEn = pageData.stdNameEn.replace("\\n","\n");
                let stdEnNameSplit = pageData.stdNameEn.split(/\n/);
                let stdEnNameHtml = [];
                stdEnNameSplit.forEach(s => {
                    if (s) {
                        stdEnNameHtml.push(s);
                    }
                })
                stdNameEnEle.innerHTML = stdEnNameHtml.join('<br/>');
            }
            // 与国际标准一致性程度的标识
            let consistentSignEle = sectionEle.querySelector('.consistentSign');
            if (consistentSignEle) {
                consistentSignEle.textContent = pageData.consistentSign || '';
            }

            // 稿次版本
            let stdEditionEle = sectionEle.querySelector('.stdEdition');
            if (stdEditionEle) {
                stdEditionEle.textContent = pageData.stdEdition || '';
            }
            // 在提交反馈意见时，请将您知道的相关专利连同支持性文件一并附上。
            let patentFileEle = sectionEle.querySelector('.patentFile');
            if (patentFileEle) {
                patentFileEle.textContent = pageData.patentFile;
            }

            // 发布日期
            let stdPublishDateEle = sectionEle.querySelector('.stdPublishDate');
            if (stdPublishDateEle) {
                stdPublishDateEle.textContent = pageData.stdPublishDate ? $global.formatDateTime('yyyy-MM-dd', new Date(pageData.stdPublishDate)) : 'XXXX-XX-XX';
            }
            // 实施日期
            let stdPerformDateEle = sectionEle.querySelector('.stdPerformDate');
            if (stdPerformDateEle) {
                stdPerformDateEle.textContent = pageData.stdPerformDate ? $global.formatDateTime('yyyy-MM-dd', new Date(pageData.stdPerformDate)) : 'XXXX-XX-XX';
            }
            // 发布单位
            if (pageData && ![1100, 7].includes(pageData.stdKind)) {
                let releaseDepartmentEle = sectionEle.querySelector('.main-util .releaseDepartment');
                if (releaseDepartmentEle && pageData.releaseDepartment) {
					pageData.releaseDepartment = pageData.releaseDepartment.replace("\\n","\n");
                    let deptNameSplit = pageData.releaseDepartment.split(/\n/);
                    let depHtml = [];
                    deptNameSplit.forEach(s => {
                        if (s) {
                            depHtml.push(s);
                        }
                    })
                    releaseDepartmentEle.innerHTML = depHtml.join('<br/>');
                }
            }
            var htmlContent = `<div class="info-block cover fixed" contenteditable="false">${sectionEle.innerHTML.replace(/\/nodeapi/g, this.nodeURL)}</div>`;
            sectionEle.remove();

			this.pageData = pageData;
            return htmlContent;

        } catch (error) {
            console.log('parseCoverHtml error===>', error)
        }
    },

    parseHtmlByOutline(outlineData = []) {
        console.log('parseHtmlByOutline', outlineData);
        // debugger
        const htmlArr = [];
        var hasTitle = false;
        for (let item of outlineData) {
            var contenData = this.disposeContentText(item, this.pageData.pageNo, hasTitle);
            hasTitle = contenData.hasTitle;
            htmlArr.push(contenData.htmlContent)
        }
        return htmlArr.join("");
    },

    disposeContentText(pageItem = {}, pageNo = "", hasTitle = false) {
        var headerTitle = pageItem.outlineTitle.replace(/\s/g, '&nbsp;');

        var cls = '';
        if (![1, 2, 11, 12].includes(pageItem.outlineType)) {
            cls = 'struct';
            if ([8, 9].includes(pageItem.outlineType)) {
                cls = 'appendix';
            }
        }
        const htmlArr = [`<div class="info-block ${cls}" data-title="${pageItem.outlineTitle}" data-outlineid="${pageItem.outlineId}" data-parentid="${pageItem.parentId}" data-outlinetype="${pageItem.outlineType}" data-no="${pageNo}" data-pagenum="Ⅱ">`];
        // 定位坐标
        let coordinates = '';
        let sourcePage = '';
        if (pageItem.content && pageItem.content.length && pageItem.content[0]['type'] === 'section') {
            coordinates = ` data-coordinates="${pageItem.content[0]['coordinates']}"`;
            sourcePage = ` data-source-page="${pageItem.content[0]['page_no']}"`;
        }

        // 加上标题
        if ([1, 2, 11, 12].includes(pageItem.outlineType) || !hasTitle) {
            if (!hasTitle && ![1, 2, 11, 12].includes(pageItem.outlineType)) {
 				const chapterTitle = [];
				this.pageData.stdName.replace("\\n","\n").split(/\n/).forEach(str => {
					chapterTitle.push(str.replace(/\s/g,''))
				});
                htmlArr.push(`<div class="header-title chapter"><p${coordinates}${sourcePage}>${chapterTitle.join('<br/>')}</p></div>`);
				hasTitle = true;
            } else {
                let smaller = '';
                if ([11, 12].includes(pageItem.outlineType)) {
                    smaller = ' smaller';
                }
                if (headerTitle.length === 2) {
                    headerTitle = headerTitle.split('').join('&nbsp;&nbsp;');
                }
                htmlArr.push(`<div class="header-title${smaller}" data-bookmark="${pageItem.outlineId}"${coordinates}${sourcePage}><p>${headerTitle}</p></div>`);
            }
        }

        // 结构性章节
        if ([8, 9].includes(pageItem.outlineType)) { // 附录章节
            let appendTitle = pageItem.infoNum === 8 ? '规范性' : '资料性';
            let appendCls =  pageItem.infoNum === 8 ? 'specs' : 'means';
            htmlArr.push(`<div class="header-title appendix disabled" contenteditable="false" data-infonum="${pageItem.outlineId}" data-bookmark="${pageItem.outlineId}" data-outlinetype="${pageItem.outlineType}" data-doctitle="${appendTitle}" data-outlineid="${pageItem.outlineId}" data-parentid="${pageItem.parentId}" data-number="${pageItem.outlineCatalog}"${coordinates}${sourcePage}><p class="appendix" data-number="${pageItem.outlineCatalog}">附录</p><p class="${appendCls}">（${appendTitle}）</p><p class="appendix-title" contenteditable="true">${pageItem.outlineTitle}</p></div>`);
        } else if (![1, 2, 11, 12].includes(pageItem.outlineType)) {
            htmlArr.push(`<div class="ol-list" data-bookmark="${pageItem.outlineId}" data-outlineid="${pageItem.outlineId}" data-parentid="${pageItem.parentId}" data-outlinetype="${pageItem.outlineType}" data-index="${pageItem.outlineCatalog}"${coordinates}${sourcePage}>${pageItem.outlineTitle}`);
            // debugger
            htmlArr.push(this.setParagraphContent(pageItem.content, pageItem.outlineType));
            htmlArr.push('</div>');
        } else {
            htmlArr.push(this.setParagraphContent(pageItem.content));
        }

        // 如果有子集
        if (pageItem.children && pageItem.children.length) {
            pageItem.children.forEach(item => {
                htmlArr.push(this.setOutlineContent(item, /^[A-Z]/.test(pageItem.outlineCatalog) ? pageItem.outlineCatalog : '')); //
            })
        }
        htmlArr.push('</div>');

        return {
            htmlContent: htmlArr.join(""),
            hasTitle
        };
    },
	// 章节条款内容
    setOutlineContent(item = {}, letter = '') {
        const htmlArr = [];
        let bk = '', cls = 'ol-list', prev = '';
        if (item.isVisible) {
            bk = ` data-bookmark="${item.outlineId}"`;
        }

        if (item.outlineId === 'fcc65431-ca63-4803-969f-9a202b222c3f') {
            debugger
        }

        if (letter) {
            cls = 'appendix-list';
            prev = ` data-prev="${letter}"`;
        }

        // debugger
        let coordinates = item.coordinates;
        let pageNo = item.page_no;
        if (!coordinates && !pageNo && item.content) {
            const content = _.find(item.content, {type:'section'});
            if (content) {
                coordinates = content.coordinates;
                pageNo = content.page_no;
            }
        }

		let dataImg = "";
		if (item.content && !_.isEmpty(item.content) && item.content[0]['type'] === 'section') {
			if (item.content[0]['image_url']) {
				dataImg = ` data-img="${item.content[0]['image_url']}"`;
			}
		}

        htmlArr.push(`<div class="${cls}"${bk} data-outlineid="${item.outlineId}" data-parentid="${item.parentId}" data-outlinetype="${item.outlineType}" data-index="${item.outlineCatalog}"${prev} data-coordinates="${coordinates}" data-source-page="${pageNo}"${dataImg}>${item.outlineTitle}`);
        htmlArr.push(this.setParagraphContent(item.content, item.outlineType));
        htmlArr.push('</div>');

        // 如果有子集
        if (item.children && item.children.length) {
            item.children.forEach(child => {
                htmlArr.push(this.setOutlineContent(child, letter));
            })
        }
        return htmlArr.join("");
    },

	isChineseInitial(str) {
		const chineseRegex = /^[\u4e00-\u9fff]+/;
		// 提取前几个中文字符
		const chineseInitial = str.match(chineseRegex);
		// 如果有匹配到中文字符
		if (chineseInitial) {
			// 获取匹配到中文字符的长度
			const chineseLength = chineseInitial[0].length;
			// 提取后面的非中文字符
			const remainingChars = str.slice(chineseLength);
			// 匹配剩余字符中是否包含中文字符
			const remainingChineseRegex = /[\u4e00-\u9fff]/;
			// 如果剩余字符中没有中文字符，则满足条件
			if (!remainingChineseRegex.test(remainingChars)) {
				return true;
			}
		}
		// 如果不满足条件，返回 false
		return false;
	},

	// 分割术语和定义的标题名
	splitChineseAndEnglish(str) {
		const chineseRegex = /[\u4e00-\u9fff]+/g;
		// 匹配非中文字符的正则表达式
		// const otherRegex = /[^\\u4e00-\\u9fff]+/g;
		// 提取中文字符
		const chinese = (str.match(chineseRegex) || []).join('');
		// 提取非中文字符
		const english = str.replace(/[\u4e00-\u9fff]/g,'')
		// const otherChars = (str.match(otherRegex) || []).join('');
		return { chinese, english };
	},
	// 按段落内容定义内容
    setParagraphContent(content=[], outlineType) {
        const htmlArr = [];
        for (let i=0; i<content.length; i++) {
            let item = content[i];
            if (item.type === 'section' || !item.type) {
                continue;
            }
            let html = '';
            switch(item.type) {
                case 'text':
                    html = this.parseParagraph(item, outlineType);
                    break;
                case 'table':
                    html = this.parseTable(item, content[i+1]);
                    break;
                case 'image':
                    html = this.parseImage(item);
                    break;
                case 'formula':
                    html = this.parseFormula(item);
                    break;
            }
            htmlArr.push(html);
        }
        return htmlArr.join("");
    },

	// 提取列项编码
	extractListItemParts(str) {
		const match = str.match(/^(?:(\d+|\w+)\)\s*)(.*)/);
		if (match) {
			// 提取列项标识
			const identifier = match[1];
			// 提取列项内容
			const content = match[2];
			return { identifier, content };
		} else {
			// 如果不是列项，则返回空标识和整个字符串
			return { identifier: '', content: str };
		}
	},
	// 按段落行解析
    parseParagraph(item, outlineType) {
		let { value, coordinates, page_no, image_url } = item;
        // const regex = /图([A-Z]?\.?\d+(\.\d+)*)/;
		let upText = value.replace(/\s/g,'');
        // value = value.replace(/\s/g,'');
        // 图标题
        /* if (regex.test(upText)) {
            let imgMatch = upText.match(regex);
            if (imgMatch) {
                imgMatch = imgMatch[1];
                value = upText.replace(regex,'').trim();
                return `<p class="img-title" data-number="${imgMatch}" data-coordinates="${coordinates}" data-source-page="${page_no}">${value}</p>`;
            }
        } */

		// 列项
		if (/^[0-9a-z]+[\)\）]+.*$|^(\——|\--.*$)/.test(upText)) { //  a) 1)
			const { identifier, content } = this.extractListItemParts(upText);
			if (identifier) {
				let start = 0, type = 'num';
				if (!isNaN(identifier)) { // 是数字，直接转换
					start = parseInt(identifier, 10);
				} else {
					start = identifier.toUpperCase().charCodeAt(0) - 64;
					type = 'lower';
				}
				return `<div class="bullet" data-start="${start}" data-level="1" data-type="${type}" data-id="${$global.guid()}" style="counter-reset: lower ${start-1};">${content}​</div>`;
			}
		} else if (/^\一一|\———|\--|\一-|\-一/.test(value)) { // 破折号
			value = value.replace(/^\-|\一|\——/g,'');
			return `<div class="bullet" data-level="1" data-type="line" data-id="${$global.guid()}">${value}​</div>`;
		}

		// 注|注X | 示例 | 示例X
		if (/^\注+(\:|\：)/.test(upText)) {
			value = value.replace(/^\注+(\:|\：)/i,'');
			return `<p class="tag zhu" data-type="zhu">${value}</p>`;
		} else if (/^\注[0-9]+(\:|\：)/.test(upText)) {
			value = value.replace(/^\注[0-9]+(\:|\：)/i,'');
			let zn = upText.split(/\:|\：/)[0].replace(/注/i,'')
			return `<p class="tag zhux" data-type="zhux" data-restart="${zn}" data-number="${zn}">${value}</p>`;
		} else if (/^\示例+(\:|\：)/.test(upText)) {
			value = value.replace(/^\示例+(\:|\：)/i,'');
			return `<p class="tag example" data-type="example">${value}</p>`;
		} else if (/^\示例[0-9]+(\:|\：)/.test(upText)) {
			value = value.replace(/^\示例[0-9]+(\:|\：)/i,'');
			let zn = upText.split(/\:|\：/)[0].replace(/示例/i,'');
			return `<p class="tag examplex" data-type="examplex" data-restart="${zn}" data-number="${zn}">${value}</p>`;
		}

		// 术语的中文和英文
		if (outlineType === 5 && this.isChineseInitial(value)) { // /^[\u4e00-\u9fa5]+[a-zA-Z]+$/.test(upText)
			// debugger
			const splitStr = this.splitChineseAndEnglish(value);
			const did = $global.guid();
			return  `<p class="term" data-tag="tag" data-id="${did}" data-img="${image_url}" style="text-indent: 2em;" title="术语"><span style="font-family: simHei;">${splitStr.chinese}</span><span style="font-family: times new roman; font-weight: bold;">&nbsp;&nbsp;${splitStr.english}</span></p>`;
		}
        return `<p style="text-indent: 2em;" data-coordinates="${coordinates}" data-img="${image_url}" data-source-page="${page_no}">${value}</p>`;
    },
    parseTable(item, rowItem) {
		let { coordinates, page_no, captionTitle, tableDesc, table_image_url, table_contents } = item;
        // debugger
        const tableId = $global.guid();

        const section = document.createElement('div');
        section.innerHTML = table_contents;
        const tableNode = section.querySelector('table');
        tableNode.border = "2";
        tableNode.dataset.id = tableId;
        tableNode.dataset.coordinates = coordinates;
        tableNode.dataset.sourcePage = page_no;
        tableNode.setAttribute('style','width:100%;border:2px solid #333;')

        const htmlContent = section.innerHTML;
        section.remove();
        return htmlContent;

        /* const htmlArr = [`<table border="2" style="width:100%;border:2px solid #333;" data-id="${tableId}" data-coordinates="${coordinates}" data-source-page="${page_no}">`];
        if (item.captionTitle) {
            captionTitle = captionTitle.replace(/\s/g,'');
            const regex = /表([A-Z]?\.?\d+(\.\d+)*)/;
            let titleMatch = captionTitle.match(regex);
            if (titleMatch) {
                titleMatch = titleMatch[1] || '1';
            }
            captionTitle = captionTitle.replace(regex,'').trim();
            htmlArr.push(`<caption class="table-title" data-number="${titleMatch}">${captionTitle}</caption>`);
        }
        if (tableDesc) {
            htmlArr.push(`<caption class="table-description">${tableDesc}</caption>`);
        }

        // 表头
        if (header) {
            let tds = [];
            htmlArr.push('<colgroup>');
            let ww = Math.ceil(100 / header.length);
            for (let col of header) {
                htmlArr.push(`<col style="${ww}%">`);
                tds.push(`<td>${col}</td>`)
            }
            htmlArr.push('</colgroup>');
            htmlArr.push(`<thead><tr>${tds.join('')}</tr></thead>`)
        }
        // 表主体
        htmlArr.push('<tbody>');

        if (rowItem && rowItem.table_rows && _.isArray(rowItem.table_rows)) {
            for (let row of rowItem.table_rows) {
                let trs = ['<tr>'];
                for (let col of row) {
                    let values = Object.values(col);
                    trs.push(`<td>${values[0]}</td>`);
                }
                trs.push('</tr>');
                htmlArr.push(trs.join(""));
            }
        } else {
            console.error('缺少表主题内容', item)
        }
        htmlArr.push('</tbody>');
        // 关门
        htmlArr.push('</table>'); */

        // return htmlArr.join("");
    },

    async getImgUrl(url) {
        const condition = {
            operation: 'getUrl',
            save: true,
            url,
        }
        const res = await uploadFile(condition, this.nodeURL);
        // console.log('getImgUrl==>', res.data)
        return res.data;
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
              reject(new Error('Failed to load image'));
            };
            img.src = imageUrl;
        });
    },

    parseImage(item) {
		let dataImg = "";
        // let imgSize = {width:'auto',height:'auto'};
		if (item.image_url) {
            // imgSize = await this.getImageDimensions(item.image_url) || {};
            /* const imgUrl = await this.getImgUrl(item.image_url) || {};
            if (imgUrl) {
                item.image_url = this.nodeURL + '/files/' + imgUrl;
            } */
			dataImg = ` data-img="${item.image_url}"`
		}
        return `<p class="imgs" data-coordinates="${item.coordinates}"${dataImg} data-source-page="${item.page_no}"><img src="${item.image_url}" crossorigin="anonymous" /></p>`;
    },
    parseFormula(item) {
        let latexStr = item.formula_def.replaceAll("\\\\","\\");
        let dataImg = "";
        // let imgSize = {width:'auto',height:'auto'};
        if (item.image_url) {
            // imgSize = await this.getImageDimensions(item.image_url) || {};
            /* const imgUrl = await this.getImgUrl(item.image_url) || {};

            if (imgUrl) {
                item.image_url = this.nodeURL + '/files/' + imgUrl;
                debugger
            } */
            dataImg = ` data-img="${item.image_url}"`
        }
        return `<p class="imgs" data-coordinates="${item.coordinates}"${dataImg} data-source-page="${item.page_no}"><img class="math-img" src="${item.image_url}" data-id="${$global.guid()}" data-latex="${latexStr}" crossorigin="anonymous" contenteditable="true" /></p>`;
    }
}
