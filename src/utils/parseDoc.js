/**
 * ===================================================================================================================
 * @module
 * @desc 文档转换成HTML处理模块
 * @author sam 2022-08-21
 * ===================================================================================================================
 */
'use strict';
import $samGlobal from './global';
// import { stdKinds, outlineTypes, letters, numberChar, tranGreeceText } from "../tinymceEditor/configs/editorOptions";

export default {
    methods: {
        parseDocHtml (pageData={}, coverTemp={}) {
            var htmlContent = [];
            // 解析文档内容
            try {
                // ---------解析封面内容开始--------------------
                var yearMonth = $samGlobal.formatDateTime('yyyy', new Date());
                var sectionEle = document.createElement('div');
                sectionEle.innerHTML = coverTemp.content;
                // 处理ICS CCS
                if (!pageData.icsNumber && !pageData.ccsNumber) {
                    if (sectionEle.querySelector('.ics-ccs')) {
                        sectionEle.querySelector('.ics-ccs').remove();
                    }
                } else {
                    let icsNumberEle = sectionEle.querySelector('.icsNumber');
                    if(icsNumberEle) {
                        if (pageData.icsNumber) {
                            icsNumberEle.textContent = pageData.icsNumber;
                        } else {
                            icsNumberEle.remove();
                        }
                    }
                    let ccsNumberEle = sectionEle.querySelector('.ccsNumber');
                    if(ccsNumberEle) {
                        if (pageData.ccsNumber) {
                            ccsNumberEle.textContent = pageData.ccsNumber;
                        } else {
                            ccsNumberEle.remove();
                        }
                    }
                }

                // 标准编号的处理
                var stdNoSplit = ['XX', yearMonth];
                if (pageData && pageData.stdNo) {
                    let noSplit = pageData.stdNo.split(/\—|-/);
                    if (noSplit.length === 2) {
                        stdNoSplit = noSplit;
                    }
                }
                // 标准标志|代码
                let stdSignEle = sectionEle.querySelector('.icon .stdSign');
                if(stdSignEle) {
                    if (pageData && [1400,1500,6].includes(pageData.stdKind) && pageData.stdSign) {
                        stdSignEle.textContent = pageData.stdSign || 'XX/X';
                    }
                }
                // 标准代码
                let iconEle = sectionEle.querySelector('.icon');
                if (!pageData.stdSign) {
                    pageData.stdSign = pageData.stdKind === 1100 ? 'GB/T' : (pageData.stdKind === 7 ? 'GB/Z' : '');
                }
                // 封面ICON图片自动转换
                if(iconEle && pageData && [1100,1200,6,7].includes(pageData.stdKind) && pageData.stdSign) {
                    let stdIcon = pageData.stdCode || pageData.stdSign.split('/')[0];
                    var iconUrl = this.data.nodeURL || process.env.VUE_APP_REMOTE_API;
                    if (stdIcon) {
                        var iconHtml = '';
                        if (pageData.stdKind === 1100 || pageData.stdKind === 7) {
                            iconUrl += '/files/images/cover_gb.png';
                            iconHtml = `<img style="width: 40mm; height: 20mm;" src="${iconUrl}" />`;
                        // 行业标准
                        } else if (pageData.stdKind === 1200) {
                            iconUrl += '/files/images/industry/' + stdIcon + '.png';
                            iconHtml = `<img height="55" src="${iconUrl}" />`;
                        // 地方标准
                        } else if (pageData.stdKind === 6) {
                            stdIcon = stdIcon.replace(/DB/g,'').replace(/\/T/g,'');
                            iconUrl += '/files/images/cover_db.png';
                            iconHtml = `<img height="45" src="${iconUrl}" />&nbsp;${stdIcon}`;
                        // 团体标准
                        } else if (pageData.stdKind === 1500) {
                            stdIcon = stdIcon.replace(/\T\//gi,'');
                            iconUrl += '/files/images/cover_tb.png';
                            iconHtml = `<img height="45" src="${iconUrl}" />&nbsp;${stdIcon}`;
                        }
                        iconEle.innerHTML = iconHtml;
                    }
                }
                // 标准编号及代替编号
                let pageNo = '';
                let numbersEle = sectionEle.querySelectorAll('.numbers>p');
                if (pageData) {
                    numbersEle.forEach((n, idx) => {
                        if(idx === 0) {
                            var spanNodes = n.querySelectorAll('span');
                            spanNodes.forEach((s, index) => {
                                if($samGlobal.hasClass(s,'stdSign')) {
                                    s.textContent = pageData.stdSign || 'X/XX';
                                } else {
                                    s.textContent = stdNoSplit.join("—").replace(/[GB/T]/g,'');
                                }
                            })
                        } else {
                            if (!pageData.origStdNo) {
                                n.remove();
                            } else {
                                n.firstChild.textContent = pageData.origStdNo || "";
                            }
                        }
                    });
                    pageNo = pageData.stdSign + ' ' + pageData.stdNo;
                    pageNo = pageNo.replace(/[GB/T]/g,'');
                }

                // 标准抬头
                let stdTitleEle = sectionEle.querySelector('h1.title');
                if(pageData && pageData.stdTitle && stdTitleEle && pageData.stdKind !== 1100) {
                    stdTitleEle.innerHTML = `<span class="tag other stdTitle" data-tag="stdTitle" data-name="标准名称" data-type="1" contenteditable="true">${pageData.stdTitle}</span>`;
                }

                // 标准名称
                let stdNameEle = sectionEle.querySelector('.stdName');
                if(stdNameEle && pageData && pageData.stdName) {
                    let stdNameSplit = pageData.stdName ? pageData.stdName.split('\n') : [];
                    let stdNameHtml = [];
                    stdNameSplit.forEach(s => {
                        if(s){
                            stdNameHtml.push(s);
                        }
                    })
                    stdNameEle.innerHTML = stdNameHtml.join('<br/>');
                }
                // 标准英文名称
                let stdNameEnEle = sectionEle.querySelector('.stdNameEn');
                if(stdNameEnEle) {
                    if (!pageData.stdNameEn) {
                        stdNameEnEle.remove();
                    } else {
                        let stdEnNameSplit = pageData.stdNameEn ? pageData.stdNameEn.split('\n') : [];
                        let stdEnNameHtml = [];
                        stdEnNameSplit.forEach(s => {
                            if(s){
                                stdEnNameHtml.push(s);
                            }
                        })
                        stdNameEnEle.innerHTML = stdEnNameHtml.join('<br/>');
                    }

                }
                // 与国际标准一致性程度的标识
                let consistentSignEle = sectionEle.querySelector('.consistentSign');
                if(consistentSignEle) {
                    if (!pageData.consistentSign) {
                        consistentSignEle.remove();
                    } else {
                        consistentSignEle.textContent = pageData.consistentSign || '';
                    }
                }

                // 稿次版本
                let stdEditionEle = sectionEle.querySelector('.stdEdition');
                if(stdEditionEle) {
                    if (!pageData.stdEdition) {
                        stdEditionEle.remove();
                    } else {
                        stdEditionEle.textContent = pageData.stdEdition || '';
                    }
                }
                // 稿次更新日期
                let updateTimeEle = sectionEle.querySelector('.updateTime');
                if(updateTimeEle) {
                    if (!pageData.stdEdition) {
                        updateTimeEle.remove();
                    } else {
                        updateTimeEle.textContent = $samGlobal.formatDateTime('yyyy-MM-dd', pageData.updateTime || pageData.createTime);
                    }
                }
                // 在提交反馈意见时，请将您知道的相关专利连同支持性文件一并附上。
                let patentFileEle = sectionEle.querySelector('.patentFile');
                if(patentFileEle) {
                    if (!pageData.patentFile) {
                        patentFileEle.remove();
                    } else {
                        patentFileEle.textContent = pageData.patentFile;
                    }
                }

                // 发布日期
                let stdPublishDateEle = sectionEle.querySelector('.stdPublishDate');
                if(stdPublishDateEle) {
                    stdPublishDateEle.textContent = pageData.stdPublishDate ? $samGlobal.formatDateTime('yyyy-MM-dd', new Date(pageData.stdPublishDate)) : 'XXXX-XX-XX';
                }
                // 实施日期
                let stdPerformDateEle = sectionEle.querySelector('.stdPerformDate');
                if(stdPerformDateEle) {
                    stdPerformDateEle.textContent = pageData.stdPerformDate ? $samGlobal.formatDateTime('yyyy-MM-dd', new Date(pageData.stdPerformDate)) : 'XXXX-XX-XX';
                }
                // 发布单位
                if (pageData && ![1100,7].includes(pageData.stdKind)) {
                    let releaseDepartmentEle = sectionEle.querySelector('.main-util .releaseDepartment');
                    if(releaseDepartmentEle && pageData.releaseDepartment) {
                        let deptNameSplit = pageData.releaseDepartment.split('\n');
                        let depHtml = [];
                        deptNameSplit.forEach(s => {
                            if(s){
                                depHtml.push(s);
                            }
                        })
                        releaseDepartmentEle.innerHTML = depHtml.join('<br/>');
                    }
                }
                // ---------封面内容完成--------------------
                htmlContent.push(`<div class="info-block cover fixed" contenteditable="false">${sectionEle.innerHTML}</div>`);
                sectionEle.remove();

                // ---------解析章节内容开始--------------------
                if (this.outlineData && this.outlineData.length) {
                    let charpterHtml = this.parseHtmlByOutline(this.outlineData, pageNo, pageData.stdKind);
                    console.log(charpterHtml)
                    // debugger
                    htmlContent = htmlContent.concat(charpterHtml);
                }
                return htmlContent;
            } catch(err) {
                console.log('catch error=>', err);
            }
        },

        /**
         * @description 解析章节内容
         * @param {Array}   outlineData
         * @param {String}  pageNo
         * @param {Int}  stdKind
         */
        parseHtmlByOutline(outlineData=[], pageNo='', stdKind=1100) {
            var htmlArr = [], romaIndex = 0, structIndex = 0;
            var chapterTitle;
            if(outlineData.length && outlineData[0]['children']) {
                var childrenNodes = outlineData[0]['children'];
                var itemStyle = '';
                // 根据模板配置的页面参数设置页面属性
                var tempPageData = _.find(this.listTemplate, { tmplName:'page' });
                if (tempPageData) {
                    var pageContent = JSON.parse(tempPageData.content);
                    if (pageContent.padding) {
                        let padding = [];
                        for(let k in pageContent.padding) {
                            let key = `padding-${k}`;
                            padding.push(`padding-${k}:${pageContent.padding[k]}mm`);
                        }
                        itemStyle = padding.join(';')
                    }
                }

                for(let i=0; i<childrenNodes.length; i++) {
                    let pageItem = childrenNodes[i];
                    let htmlContent, isEmptyCOntent = false;
                    // 如果已经存在正文内容的
                    // pageItem.content.content = pageItem.content.content || `<p>${pageItem.content.contentText}</p>`;
                    if (pageItem.content) {
                        if (!pageItem.content.content || pageItem.content.content === '') {
                            isEmptyCOntent = true;
                            pageItem.content.content = `<p>${pageItem.content.contentText||''}</p>`;
                        }
                        // 非结构化章节处理,直接将大纲内的内容输出
                        if ([1,2,11,12].includes(pageItem.outlineType)) {
                            htmlArr.push(pageItem.content.content);
                        } else {
                            htmlContent = this.setStructList(pageItem, pageNo);
                            htmlArr.push(htmlContent);
                        }
                    // 否则就从模板数据中取出
                    } else {
                        var pageNum = '';
                        if ([1,2].includes(pageItem.outlineType)) {
                            pageNum = this.numberChar.roma[romaIndex];
                            romaIndex++;
                        } else {
                            pageNum = structIndex + 1;
                            structIndex++;
                        }
                        // 从配置的模板数据中获取正文内容， 获取对应的大纲页面 => 'preface' | 'intro' | 'range' | 'normative' | 'term' | 'chapter' | 'literature' | 'index'
                        var templateData = null;
                        var outlineTypeData = _.find(outlineTypes, { type:pageItem.outlineType });
                        if (outlineTypeData && outlineTypeData.value) {
                            templateData = _.find(this.listTemplate, { tmplType:stdKind, tmplName:outlineTypeData.value });
                        }

                        if (templateData && templateData.content) {
                            var sectionBlock = document.createElement('div');
                            var sectionClass =  `info-block`; // ${templateData.tmplName}
                            if ([3,4,5,6].includes(pageItem.outlineType)) { //pageItem.outlineType === 6
                                sectionClass += ' struct';
                            } else {
                                sectionClass += ' ' + templateData.tmplName;
                            }
                            sectionBlock.innerHTML = templateData.content;
                            sectionBlock.dataset.title = pageItem.outlineTitle;
                            sectionBlock.dataset.outlineid = pageItem.outlineId;
                            sectionBlock.dataset.parentid = pageItem.parentId;
                            sectionBlock.dataset.outlinetype = pageItem.outlineType;
                            sectionBlock.dataset.no = pageNo;
                            sectionBlock.dataset.pagenum = pageNum;
                            sectionBlock.setAttribute('class', sectionClass);
                            //
                            sectionBlock.removeAttribute('contenteditable');
                            $samGlobal.removeClass(sectionBlock, 'fixed');
                            $samGlobal.removeClass(sectionBlock, 'disabled');

                            if (sectionClass) {
                                sectionBlock.setAttribute('style', itemStyle);
                            }
                            // 处理标题
                            var titleNode = sectionBlock.querySelector('.header-title');
                            if (titleNode && [1,2,11,12].includes(pageItem.outlineType)) {
                                titleNode.dataset.bookmark = pageItem.outlineId;
                                if (this.editorSetting.private) {
                                    titleNode.setAttribute('contenteditable', 'false');
                                }
                            }
                            // 处理章节
                            sectionBlock.querySelectorAll('div.ol-list').forEach(li => {
                                li.dataset.bookmark = pageItem.outlineId;
                                li.dataset.outlineid = pageItem.outlineId;
                                li.dataset.parentid = pageItem.parentId;
                                li.dataset.outlinetype = pageItem.outlineType;
                                li.dataset.index = pageItem.outlineCatalog;
                                li.dataset.contentid = pageItem.content && pageItem.content.contentId ? pageItem.content.contentId : $samGlobal.guid();
                                // li.setAttribute('style', 'line-height:3;');
                            });
                            htmlContent = sectionBlock.outerHTML;
                            htmlArr.push(htmlContent);
                            sectionBlock.remove();
                        } else {
                            console.warn('缺少模板数据，大纲数据=>', pageItem);
                            console.info('模板全数据=>', this.listTemplate);
                            console.info('大纲映射页面=>', outlineTypes);
                        }
                    }
                }
            }
            return htmlArr;
        },

        /**
         * @description 解析章节条目HTML内容
         * @param {Object}  pageItem
         * @param {String} pageNo
         */
        setStructList(pageItem=null, pageNo='') {
            var cls = 'info-block struct';
            var dataAttr = `data-outlineid="${pageItem.outlineId}" data-parentid="${pageItem.parentId}" data-outlinetype="${pageItem.outlineType}" data-no="${pageNo}"`;
            if ([8,9].includes(pageItem.outlineType)) {
                cls = 'info-block appendix';
                dataAttr += ` data-letter="${pageItem.letter||pageItem.outlineCatalog}"`;
            }
            // 定义页面的布局设置
            var pagesize = "A4";
            var style = ""; //padding: 25mm 25mm 20mm 20mm; width:210mm; height:297mm
            if (pageItem.extendContent) {
                let extendContent = JSON.parse(pageItem.extendContent);
                if (extendContent.pagesize) {
                    pagesize = extendContent.pagesize;
                }
                if (extendContent.style) {
                    style = extendContent.style;
                }
            }

            pageItem.content.content = this.clearTableNode(pageItem.content.content);
            var htmlArr = [`<div class="${cls}" ${dataAttr} style="${style}" data-pagesize="${pagesize}" data-pagenum="1">`];
            // 先提取标题
            if (pageItem.children && pageItem.children.length) {
                var headerData = _.find(pageItem.children, { outlineCatalog:'0', outlineType:999 });
                if (headerData) {
                    htmlArr.push(headerData.content.content);
                }
            }
            const recuFun = item => {
                item.content.content = this.clearTableNode(item.content.content);
                htmlArr.push(item.content.content);
                if (item.children && item.children.length) {
                    item.children = _.filter(item.children, c => { return c.outlineType !== 999; });            // 去除标题
                    item.children.forEach(child => {
                        recuFun(child);
                    });
                }
            }
            recuFun(pageItem);
            htmlArr.push('</div>');
            return htmlArr.join("");
        },

        // 处理续表
        clearTableNode(content="") {
            var section = document.createElement('div')
            section.innerHTML = content;
            var tableNodes = section.querySelectorAll('table');
            tableNodes.forEach(table => {
                let parentNode = table.parentNode;
                if (!$samGlobal.hasClass(table, 'xu')) {
                    let trs = table.querySelectorAll('tbody>tr');
                    trs.forEach(tr => {
                        $samGlobal.removeClass(tr, 'hide');
                    })
                } else {
                    table.remove();
                    if (parentNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '' && $samGlobal.hasClass(parentNode, 'hide-list')){
                        parentNode.remove();
                    }
                }
            });
            var htmlContent = section.innerHTML;
            section.remove();
            return htmlContent;
        },
    },


}
