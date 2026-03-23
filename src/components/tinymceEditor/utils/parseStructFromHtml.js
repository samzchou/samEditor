/**
 * ===================================================================================================================
 * @module
 * @desc 编辑器HTML内容解析成JSON数据
 * @author sam 2021-11-29
 * ===================================================================================================================
 */
'use strict';
import $global from '@/utils/global.js';
// 配置文件（MOCK DATA）
import { outlineTypes, numberChar } from "../configs/editorOptions";
export default {
    editorSetting: null,
    pageData: null,
    /**
     * @description 解析封面HTML
     * @param {Object}  pageData 文档数据
     * @param {Object}  coverTemp 封面模板数据
     * @param {Object}  editorSetting 编辑器设置数据
     * @returns
     */
    parseCoverHtml(pageData = {}, coverTemp = {}, editorSetting = {}) {
        this.editorSetting = editorSetting;
        this.pageData = pageData;
        var pageNo = '';
        var yearMonth = $global.formatDateTime('yyyy', new Date());
        try {
            const sectionEle = document.createElement('div');
            sectionEle.innerHTML = coverTemp.content;
            
            if (pageData.stdKind === this.editorSetting.tmplType) { // 航司模板
                // debugger
                const stdNoEle = sectionEle.querySelector('.std-no');
                if (stdNoEle) {
                    stdNoEle.textContent = pageData.stdNo || 'XX—XX';
                }
                const releaseDepartmentEle = sectionEle.querySelector('.releaseDepartment');
                if (releaseDepartmentEle) {
                    releaseDepartmentEle.textContent = pageData.releaseDepartment || '单位';
                }
                const stdNameEle = sectionEle.querySelector('.std-name');
                if (stdNameEle) {
                    stdNameEle.textContent = pageData.stdName || '名称';
                }
                // debugger
                const approverEle = sectionEle.querySelector('.approver');
                if (approverEle) {
                    approverEle.textContent = pageData.updateUser || '';
                }
                const controlEle = sectionEle.querySelector('.control');
                if (controlEle) {
                    controlEle.innerHTML = pageData.controlledState ? `<em>受控文件</em>` : '';
                }
                const numberEle = sectionEle.querySelector('.distribution-number');
                if (numberEle) {
                    numberEle.textContent = pageData.distributeNumbers || '';
                }
                const versionEle = sectionEle.querySelector('.doc-version');
                if (versionEle) {
                    versionEle.textContent = pageData.docVersionName || '';
                }
                const stdPublishDateEle = sectionEle.querySelector('.stdPublishDate');
                if (stdPublishDateEle) {
                    stdPublishDateEle.textContent = pageData.stdPublishDate ?  $global.formatDateTime('yyyy-MM-dd', new Date(pageData.stdPublishDate)) : 'XXXX-XX-XX';
                }
            } else {
                // 潍柴保密等级
                let secrecyEle = sectionEle.querySelector('.secrecy');
                if (secrecyEle) {
                    secrecyEle.textContent = pageData.metaData || '密二级▲长期';
                }

                // 处理ICS CCS
                if (!pageData.icsNumber && !pageData.ccsNumber && (editorSetting.private || editorSetting.readonly || editorSetting.reader)) {
                    if (sectionEle.querySelector('.ics-ccs')) {
                        sectionEle.querySelector('.ics-ccs').remove();
                    }
                } else {
                    let icsNumberEle = sectionEle.querySelector('.icsNumber');
                    if (icsNumberEle) {
                        if (pageData.icsNumber) {
                            icsNumberEle.textContent = pageData.icsNumber;
                        } else {
                            editorSetting.private && icsNumberEle.remove();
                        }
                    }
                    let ccsNumberEle = sectionEle.querySelector('.ccsNumber');
                    if (ccsNumberEle) {
                        if (pageData.ccsNumber) {
                            ccsNumberEle.textContent = pageData.ccsNumber;
                        } else {
                            editorSetting.private && ccsNumberEle.remove();
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
                if (stdSignEle) {
                    if (pageData && [1400,1500,6,8,9].includes(pageData.stdKind) && pageData.stdSign) {
                        stdSignEle.textContent = pageData.stdSign || 'XXX';
                    }
                }
                // 标准代码
                let iconEle = sectionEle.querySelector('.icon');
                if (!pageData.stdSign) {
                    pageData.stdSign = pageData.stdKind === 1100 ? 'GB/T' : (pageData.stdKind === 7 ? 'GB/Z' : '');
                }
                // 封面ICON图片自动转换
                if (iconEle && pageData && [1100,1200,6,7].includes(pageData.stdKind) && pageData.stdSign) {
                    let stdIcon = pageData.stdCode || pageData.stdSign.split('/')[0];
                    var nodeUrl = editorSetting.nodeURL || process.env.VUE_APP_REMOTE_API;
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
                        } else {
                            if ((editorSetting.private || editorSetting.readonly || editorSetting.reader) && !pageData.origStdNo) {
                                n.remove();
                            } else {
                                n.firstChild.textContent = pageData.origStdNo || "";
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
                if (pageData && pageData.stdTitle && stdTitleEle && pageData.stdKind !== 1100) {
                    stdTitleEle.innerHTML = `<span class="tag other stdTitle" data-tag="stdTitle" data-name="标准名称" data-type="1" contenteditable="true">${pageData.stdTitle}</span>`;
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
                }
                // 标准英文名称
                let stdNameEnEle = sectionEle.querySelector('.stdNameEn');
                if (stdNameEnEle) {
                    if ((editorSetting.private || editorSetting.readonly || editorSetting.reader) && !pageData.stdNameEn) {
                        stdNameEnEle.remove();
                        stdNameEnEle = null;
                    } else {
                        let stdEnNameSplit = pageData.stdNameEn ? pageData.stdNameEn.split('\n') : [];
                        let stdEnNameHtml = [];
                        stdEnNameSplit.forEach(s => {
                            if (s) {
                                stdEnNameHtml.push(s);
                            }
                        })
                        stdNameEnEle.innerHTML = stdEnNameHtml.join('<br/>');
                    }
                    // 字体设置
                    if (stdNameEnEle) {
                        if (editorSetting.page && editorSetting.page.stdEnNameFont) {
                            stdNameEnEle.parentNode.style.fontFamily = editorSetting.page.stdEnNameFont;
                            stdNameEnEle.parentNode.style.fontWeight = 'normal';
                        }
                        // debugger
                        if (editorSetting.page && editorSetting.page.stdEnNameNormal) {
                            stdNameEnEle.parentNode.style.fontWeight = 'normal';
                        }
                    }
                }
                // 与国际标准一致性程度的标识
                let consistentSignEle = sectionEle.querySelector('.consistentSign');
                if (consistentSignEle) {
                    if ((editorSetting.private || editorSetting.readonly || editorSetting.reader) && !pageData.consistentSign) {
                        consistentSignEle.remove();
                    } else {
                        consistentSignEle.textContent = pageData.consistentSign || '';
                    }
                }

                // 稿次版本
                let stdEditionEle = sectionEle.querySelector('.stdEdition');
                if (stdEditionEle) {
                    if ((editorSetting.private || editorSetting.readonly || editorSetting.reader) && !pageData.stdEdition) {
                                 stdEditionEle.remove();
                    } else {
                        stdEditionEle.textContent = pageData.stdEdition || '';
                    }
                }
                // 稿次更新日期
                let updateTimeEle = sectionEle.querySelector('.updateTime');
                if (updateTimeEle) {
                    if ((editorSetting.private || editorSetting.readonly || editorSetting.reader) && !pageData.stdEdition) {
                        updateTimeEle.remove();
                    } else {
                        updateTimeEle.textContent = $global.formatDateTime('yyyy-MM-dd', pageData.updateTime || pageData.createTime);
                    }
                }
                // 在提交反馈意见时，请将您知道的相关专利连同支持性文件一并附上。
                let patentFileEle = sectionEle.querySelector('.patentFile');
                if (patentFileEle) {
                    if ((editorSetting.private || editorSetting.readonly || editorSetting.reader) && !pageData.patentFile) {
                        patentFileEle.remove();
                    } else {
                        patentFileEle.textContent = pageData.patentFile;
                    }
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
                        let deptNameSplit = pageData.releaseDepartment.split('\n');
                        let depHtml = [];
                        deptNameSplit.forEach(s => {
                            if (s) {
                                depHtml.push(s);
                            }
                        })
                        releaseDepartmentEle.innerHTML = depHtml.join('<br/>');
                    }
                }
                // 锁定封面
                var enabled = editorSetting.author.commitId ? 'false' : 'true';
                if (enabled === 'false') {
                    let allEditNodes = sectionEle.querySelectorAll('[contenteditable="true"]');
                    allEditNodes.forEach(ele => {
                        ele.removeAttribute('contenteditable');
                    })
                }
            }

            
            var htmlContent = `<div class="info-block cover fixed" contenteditable="${enabled}">${sectionEle.innerHTML}</div>`;


            sectionEle.remove();
            return {
                pageNo,
                htmlContent
            };
        } catch (err) {
            console.log('load document template data error', err);
            return null;
        }
    },

    /**
     * @description 根据大纲数据解析文档HTML内容
     * @param {Array}   outlineData 大纲数据
     * @param {String}  pageNo 页面的文档编号
     * @param {Int}  stdKind 文档类型
     * @param {Array}  listTemplate 模板数据
     * @returns
     */
    parseHtmlByOutline(outlineData = [], pageNo = '', stdKind = 1100, listTemplate = [], source) {
        let htmlArr = [], romaIndex = 0, structIndex = 0;
        // 航司特定的页眉页脚
        let pageHeader = null;
        let pageFooter = null;
        if (stdKind === this.editorSetting.tmplType) {
            const pageTmp = _.find(listTemplate,{tmplType:stdKind,tmplName:'other'});
            const tmpContainer = document.createElement('div');
            tmpContainer.innerHTML = pageTmp.content;
            pageHeader = tmpContainer.querySelector('.page-header');
            pageFooter = tmpContainer.querySelector('.page-footer');
        }
        // console.log('listTemplate==>', listTemplate)
        if (outlineData.length && outlineData[0]['children']) {
            let childrenNodes = outlineData[0]['children'];
            let itemStyle = '';
            // 根据模板配置的页面参数设置页面属性
            // debugger
            let tempPageData = _.find(listTemplate, { tmplName: 'page' });
            if (tempPageData && stdKind !== this.editorSetting.tmplType) {
                let pageContent = JSON.parse(tempPageData.content);
                if (pageContent.padding) {
                    let padding = [];
                    for (let k in pageContent.padding) {
                        padding.push(`padding-${k}:${pageContent.padding[k]}mm`);
                    }
                    itemStyle = padding.join(';');
                }
            }
            let hasTitle = false;
            let appendixNumber = 0;
            for (let i = 0; i < childrenNodes.length; i++) {
                let pageItem = childrenNodes[i];
                if (pageItem.outlineType === 99) { // 潍柴模板的审批表页面
                    continue;
                }
                let htmlContent;
                let sectionBlock;

                if (pageItem.content) { // 如果已经存在正文内容的
                    if (!pageItem.content.content || pageItem.content.content === '') {
                        let contenData = this.disposeContentText(pageItem, pageNo, hasTitle);
                        hasTitle = contenData.hasTitle;
                        htmlArr.push(contenData.htmlContent);
                    } else {
                        // 非结构化章节处理,直接将大纲内的内容输出
                        if ([1, 2, 11, 12].includes(pageItem.outlineType)) {
                            sectionBlock = document.createElement('div');
                            sectionBlock.innerHTML = this.mergeHtmlContent(pageItem.content.content); // 多个页处理内容;
                            let infoBlock = sectionBlock.querySelector('.info-block');
                            if (infoBlock) {
                                if (pageItem.owner && infoBlock) {
                                    infoBlock.dataset.owner = typeof pageItem.owner === 'object' ? JSON.stringify(pageItem.owner) : pageItem.owner;
                                }
                                if (!infoBlock.dataset.no) {
                                    infoBlock.dataset.no = pageNo;
                                }
                            }
                            htmlArr.push(sectionBlock.innerHTML);
                            sectionBlock.remove();
                        } else {
                            // 航司特定附录章节
                            let appendixNo;
                            if (pageItem.outlineTitle.replace(/\s/g,'').replace(/[\u200B-\u200D\uFEFF]/g, '') === '附录' && stdKind === this.editorSetting.tmplType) {
                                appendixNo = $global.setLowerToString(appendixNumber);
                                appendixNumber++;
                            }
                            htmlContent = this.setStructList(pageItem, pageNo, pageHeader && pageHeader.cloneNode(true), pageFooter && pageFooter.cloneNode(true), appendixNo);
                            htmlArr.push(htmlContent);
                        }
                    }

                } else { // 否则就从模板数据中取出
                    let pageNum = '';
                    if ([1, 2].includes(pageItem.outlineType)) {
                        pageNum = numberChar.roma[romaIndex];
                        romaIndex++;
                    } else {
                        pageNum = structIndex + 1;
                        structIndex++;
                    }
                    pageItem.pageNum = pageNum;
                    // 从配置的模板数据中获取正文内容， 获取对应的大纲页面 => 'preface' | 'intro' | 'range' | 'normative' | 'term' | 'chapter' | 'literature' | 'index'
                    let templateData = null;
                    if (stdKind === 8) { // 如是编制说明
                        templateData = _.find(listTemplate, { tmplType: stdKind, tmplName: pageItem.extendContent });
                    } else {
                        let outlineTypeData = _.find(outlineTypes, { type: pageItem.outlineType });
                        if (outlineTypeData && outlineTypeData.value) {
                            templateData = _.find(listTemplate, { tmplType: stdKind, tmplName: outlineTypeData.value });
                        }
                    }

                    if (templateData && templateData.content) {
                        sectionBlock = document.createElement('div');
                        let sectionClass = `info-block`; // ${templateData.tmplName}
                        if ([3, 4, 5, 6].includes(pageItem.outlineType) || stdKind === this.editorSetting.tmplType) { //pageItem.outlineType === 6
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
                        $global.removeClass(sectionBlock, 'fixed');
                        $global.removeClass(sectionBlock, 'disabled');

                        if (sectionClass) {
                            sectionBlock.setAttribute('style', itemStyle);
                        }
                        // 处理标题
                        let titleNode = sectionBlock.querySelector('.header-title');
                        if (titleNode && [1, 2, 11, 12].includes(pageItem.outlineType)) {
                            titleNode.dataset.bookmark = pageItem.outlineId;
                            if (this.editorSetting && this.editorSetting?.private) {
                                titleNode.setAttribute('contenteditable', 'false');
                            }
                        }
                        // 处理章节
                        sectionBlock.querySelectorAll('div.ol-list').forEach((li, index) => {
                            li.dataset.bookmark = pageItem.outlineId;
                            li.dataset.outlineid = pageItem.outlineId;
                            li.dataset.parentid = pageItem.parentId;
                            li.dataset.outlinetype = pageItem.outlineType;
                            li.dataset.index = pageItem.outlineCatalog;
                            li.dataset.contentid = $global.guid();
                            if (index === 0) {
                                let firstChild = li.firstChild;
                                if (firstChild.nodeName === '#text') {
                                    firstChild.textContent = pageItem.outlineTitle;
                                }
                            }
                        });

                        // 航司页面通用模板
                        if (pageHeader) {
                            sectionBlock.prepend(pageHeader.cloneNode(true));
                        }
                        if (pageFooter) {
                            sectionBlock.appendChild(pageFooter.cloneNode(true));
                        }
                        
                        htmlContent = sectionBlock.outerHTML;
                        htmlArr.push(htmlContent);

                        sectionBlock.remove();
                    } else {
                        // 如果是附录章节的 add by sam.shen 2024-7-19
                        if ([8,9].includes(pageItem.outlineType)) {
                            htmlArr.push(`<div class="info-block appendix" data-title="${pageItem.outlineTitle}" data-outlineid="${pageItem.outlineId}" data-parentid="${pageItem.parentId}" data-outlinetype="${pageItem.outlineType}" data-no="${pageNo}" data-pagenum="${pageNum}" data-letter="${pageItem.outlineCatalog}">`);
                            htmlArr.push(`<div class="header-title appendix disabled" contenteditable="false" data-outlinetype="${pageItem.outlineType}" data-doctitle="规范性" data-outlineid="${pageItem.outlineId}" data-parentid="${pageItem.parentId}" data-bookmark="${pageItem.outlineId}" data-number="${pageItem.outlineCatalog}"><p class="appendix" data-number="${pageItem.outlineCatalog}">附&nbsp;录</p><p class="specs">（规范性）</p><p contenteditable="true" class="appendix-title">附录名称</p></div>`);
                            htmlArr.push('<p>附录内容</p></div>');
                        } else if (stdKind === this.editorSetting.tmplType && pageItem.outlineType === 6) { // 航司模板
                            htmlArr.push(`<div class="info-block struct" data-outlineid="${pageItem.outlineId}" data-parentid="${pageItem.parentId}" data-outlinetype="${pageItem.outlineType}" data-no="${pageNo}" data-pagenum="${pageNum}">`);
                            // 加上页眉
                            htmlArr.push(pageHeader.outerHTML);
                            // 大纲层级项
                            htmlArr.push(`<div class="ol-list level0" data-contentid="${$global.guid()}" data-bookmark="${pageItem.outlineId}" data-outlineid="${pageItem.outlineId}" data-parentid="${pageItem.parentId}" data-outlinetype="6" data-index="${i}">${pageItem.outlineTitle}</div>`)
                            // 加上页脚
                            htmlArr.push(pageFooter.outerHTML);
                            htmlArr.push('</div>');
                        } else {
                            console.warn('缺少模板数据，大纲数据=>', pageItem);
                            console.info('模板全数据=>', this.listTemplate);
                            console.info('大纲映射页面=>', outlineTypes);
                        }
                    }
                }
            }
        }
        return htmlArr;
    },

    /**
     * @description 如果HTML内容包含了多个页面的，且页面设置为无限延展的，则需要合并内容
     * @param {String} htmlContent
     * @returns
     */
    mergeHtmlContent(htmlContent="") {
        var section = document.createElement('div');
        section.innerHTML = htmlContent;
        var blocks = Array.from(section.querySelectorAll('.info-block'));
        if (blocks.length && blocks.length > 1) {
            // 定义第一个页面，其他的后续页面内容都append到第一个页面内
            var htmlArr = [];
            var firstBlock = blocks[0];
            blocks.forEach((block, i) => {
                // 页面标题
                let headerTitle = block.querySelector('div.header-title');
                if (headerTitle) {
                    headerTitle.removeAttribute('contenteditable');
                }

                if (i > 0) {
                    Array.from(block.childNodes).forEach(ele => {
                        firstBlock.appendChild(ele);
                    });
                }
                htmlArr.push(block.outerHTML);

            });
            if (this.editorSetting && this.editorSetting.page && this.editorSetting.page.expand) {
                htmlContent = firstBlock.outerHTML;
            } else {
                // htmlContent = htmlArr.join("");
            }

        }
        section.remove();

        return htmlContent;
    },

    /**
     * @description 解析章节条目HTML内容
     * @param {Object}  pageItem
     * @param {String} pageNo
     * @returns
     */
    setStructList(pageItem = null, pageNo = '', pageHeader, pageFooter, appendixNo) {
        let cls = 'info-block struct';
        let dataAttr = `data-outlineid="${pageItem.outlineId}" data-parentid="${pageItem.parentId}" data-outlinetype="${pageItem.outlineType}" data-no="${pageNo}"`;
        if (appendixNo) { // 航司附录章节
            dataAttr += ` data-appendix-no=${appendixNo}`;
        }
        if ([8, 9].includes(pageItem.outlineType)) {
            cls = 'info-block appendix';
            dataAttr += ` data-letter="${pageItem.letter||pageItem.outlineCatalog}"`;
        }
        const editorSetting = this.editorSetting || {};
        if (pageItem.locked && !editorSetting.readonly && !editorSetting.reader) {
            cls += ' disabled';
        }
        // 定义页面的布局设置
        let pagesize = "A4", style = ""; // padding: 25mm 25mm 20mm 20mm; width:210mm; height:297mm
        if (pageItem.extendContent) {
            let extendContent = JSON.parse(pageItem.extendContent);
            if (extendContent.pagesize) {
                pagesize = extendContent.pagesize;
            }
            if (extendContent.style) {
                style = extendContent.style;
            }
        }

        pageItem.content.content = this.clearTableNode(pageItem.content.content, pageItem.owner);
        const htmlArr = [`<div class="${cls}" ${dataAttr} data-pagesize="${pagesize}" data-pagenum="1" data-section-number="${pageItem.outlineCatalog}" style="${style}">`];
        // 航司页眉
        if (pageHeader) {
            htmlArr.push(pageHeader.outerHTML);
        }

        // 先提取标题
        if (pageItem.children && pageItem.children.length) {
            let headerData = _.find(pageItem.children, { outlineCatalog: '0', outlineType: 999 });
            if (headerData) {
                htmlArr.push(headerData.content.content);
            }
        }
        // 递归处理章节子节点
        const recuFun = item => {
            if (item.content) {
                item.content.content = this.clearTableNode(item.content.content, item.owner);
                htmlArr.push(item.content.content);
            }

            if (item.children && item.children.length) {
                item.children = _.filter(item.children, c => { return c.outlineType !== 999; }); // 去除标题
                item.children.forEach(child => {
                    recuFun(child);
                });
            }
        }
        recuFun(pageItem);
        
        // 航司页脚
        if (pageFooter) {
            const pageSection = pageFooter.querySelector('div.page-section');
            const pageNumber = pageFooter.querySelector('div.page-number');
            pageSection.textContent = `第${pageItem.outlineCatalog}章 ${pageItem.outlineTitle}`;
            pageNumber.textContent = `页码：${pageItem.outlineCatalog}-1`;
            htmlArr.push(pageFooter.outerHTML);
        }
        htmlArr.push('</div>');
        return htmlArr.join("");
    },

    /**
     * @description 处理续表
     * @param {String}  content HTML内容
     * @returns
     */
    clearTableNode(content = "", owner) {
        var section = document.createElement('div');
        section.innerHTML = content;
        if (owner) {
            section.querySelector('div[data-outlineid]').dataset.owner = typeof owner === 'object' ? JSON.stringify(owner) : owner;
        }
        var tableNodes = Array.from(section.querySelectorAll('table'));
        tableNodes.forEach(table => {
            let parentNode = table.parentNode;
            if (!$global.hasClass(table, 'xu')) {
                let trs = Array.from(table.querySelectorAll('tbody>tr'));
                trs.forEach(tr => {
                    $global.removeClass(tr, 'hide');
                })
            } else {
                table.remove();
                if (parentNode.textContent.replace(/\s/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '') === '' && $global.hasClass(parentNode, 'hide-list')) {
                    parentNode.remove();
                }
            }
        });
        var htmlContent = section.innerHTML;
        section.remove();
        return htmlContent;
    },

    /**
     * @description 处理文本内容
     * @param {Object}  pageItem 章节数据
     * @param {String}  pageNo 文档编号
     * @param {Boolean}  hasTitle 是否为标题
     * @returns
     */
    disposeContentText(pageItem = {}, pageNo = "", hasTitle = false) {
        var headerTitle = pageItem.outlineTitle.replace(/\s/g, '&nbsp;');//pageItem.outlineTitle.split("").join('&nbsp;&nbsp;');
        var cls = '';
        if (![1, 2, 11, 12].includes(pageItem.outlineType)) {
            cls = 'struct';
            if ([8, 9].includes(pageItem.outlineType)) {
                cls = 'appendix';
            }
        }
        var htmlArr = [`<div class="info-block ${cls}" data-title="${pageItem.outlineTitle}" data-outlineid="${pageItem.outlineId}" data-parentid="${pageItem.parentId}" data-outlinetype="${pageItem.outlineType}" data-no="${pageNo}" data-pagenum="Ⅱ">`]
        // 加上标题
        if ([1, 2, 11, 12].includes(pageItem.outlineType) || !hasTitle) {
            if (!hasTitle && ![1, 2, 11, 12].includes(pageItem.outlineType)) {
                hasTitle = true;
                htmlArr.push(`<div class="header-title chapter"><p data-bind="stdName">${this.pageData.stdName}</p></div>`);
            } else {
                let smaller = '';
                if ([11, 12].includes(pageItem.outlineType)) {
                    smaller = ' smaller';
                }
                htmlArr.push(`<div class="header-title${smaller}" data-bookmark="${pageItem.outlineId}"><p>${headerTitle}</p></div>`);
            }
        }
        // 结构性章节
        if (![1, 2, 11, 12].includes(pageItem.outlineType)) {
            if ([8, 9].includes(pageItem.outlineType)) { // 附录章节
                if (!pageItem.infoNum) {
                    pageItem.infoNum = pageItem.outlineType;
                }
                let appendTitle = pageItem.infoNum === 8 ? '规范性' : '资料性'; // pageItem.outlineType === 8 ? '规范性' : '资料性';
                let appendCls =  pageItem.infoNum === 8 ? 'specs' : 'means';
                if (/[\u4E00-\u9FA5]/.test(pageItem.outlineCatalog)) {
                    pageItem.outlineCatalog = pageItem.outlineCatalog.replace(/[^A-Z]/ig, '');
                }
                htmlArr.push(
                    `<div class="header-title appendix disabled" contenteditable="false" data-infonum="${pageItem.outlineId}" data-bookmark="${pageItem.outlineId}" data-outlinetype="${pageItem.infoNum}" data-doctitle="${appendTitle}" data-outlineid="${pageItem.outlineId}" data-parentid="${pageItem.parentId}" data-number="${pageItem.outlineCatalog}"><p class="appendix" data-number="${pageItem.outlineCatalog}">附录</p><p class="docattr ${appendCls}">（${appendTitle}）</p><p class="appendix-title" contenteditable="true">${pageItem.outlineTitle}</p></div>`
                    );
            } else {
                htmlArr.push(
                    `<div class="ol-list" data-bookmark="${pageItem.outlineId}" data-outlineid="${pageItem.outlineId}" data-parentid="${pageItem.parentId}" data-outlinetype="${pageItem.outlineType}" data-contentid="${pageItem.content.contendId}" data-index="${pageItem.outlineCatalog}">${pageItem.outlineTitle}`
                    );
                htmlArr.push(this.setParagraphContent(pageItem.content.contentText, true));
                htmlArr.push('</div>');
            }
            // 如果有子集
            if (pageItem.children && pageItem.children.length) {
                pageItem.children.forEach(item => {
                    htmlArr.push(this.setOutlineContent(item, /^[A-Z]/.test(pageItem.outlineCatalog) ? pageItem.outlineCatalog : ''));
                })
            }
            // 非结构性章节
        } else {
            htmlArr.push(this.setParagraphContent(pageItem.content.contentText))
        }

        htmlArr.push('</div>');
        return {
            htmlContent: htmlArr.join(""),
            hasTitle
        };
    },

    /**
     * @description 处理段落内容
     * @param {String}  contentText 文本内容
     * @param {Boolean}  isChapter 是否为章标题或条目
     * @returns
     */
    setParagraphContent(contentText = "") {
        if (!contentText) {
            return '';
        }
        let paragraphs = contentText.split('\n');
        let htmlArr = [];
        let emptyImg = this.editorSetting?.emptyImg || `${this.editorSetting?.nodeURL}/images/empty.png`;
        var editorConfig = $global.getTinymceConfig();
        var textImgUrl = this.editorSetting?.textImgUrl || process.env.VUE_APP_TEXT_IMG_URL;
        // console.log('setParagraphContent', editorConfig, this.editorSetting.textImgUrl);
        if (editorConfig.textImgUrl) {
            textImgUrl = editorConfig.textImgUrl;
        }
        paragraphs.forEach(str => {
            if (str.replace(/\s/g, '') !== '') {
                // 文本内容需显示图片的,则须转换
                if (str.startsWith("[[File:")) {
					// debugger
                    // let structDocData = $global.getStroage('structDocData');
                    if(this.pageData && this.pageData.stdId){
                        let dir = Math.floor(this.pageData.stdId / 2000);
                        if (this.pageData.stdId % 2000 > 0) {
                            dir++;
                        }
                        let url = textImgUrl + dir + "/" + this.pageData.stdId + "/" + str.substring(7, str.length - 2);
                        htmlArr.push(`<p class="imgs"><img src="${encodeURI(url)}" onerror="this.src='${emptyImg}" /></p>`);
                    } else {    // 旧的结构化数据图片处理方式
                        let imgPath = `${this.pageData.stdId}/${str.substring(7, str.length - 2)}`;
                        htmlArr.push(`<p class="imgs"><img src="${textImgUrl}${imgPath}" onerror="this.src='${emptyImg}" /></p>`);
                    }
                } else {
                    htmlArr.push(`<p style="text-indent: 2em;">${str}</p>`);
                }
            }
        });
        return htmlArr.join("");
    },

    /**
     * @description 处理章节内容
     * @param {Object}  item 章节数据
     * @param {String}  letter 附录标识号
     * @returns
     */
    setOutlineContent(item = {}, letter = '') {
        let htmlArr = [];
        let bk = '',
            cls = 'ol-list',
            prev = '';
        if (item.isVisible) {
            bk = ` data-bookmark="${item.outlineId}"`;
        }
        if (letter) {
            cls = 'appendix-list';
            prev = ` data-prev="${letter}"`;
            item.outlineCatalog = item.outlineCatalog.substring(letter.length + 1);
        }

        htmlArr.push(
            `<div class="${cls}"${bk} data-outlineid="${item.outlineId}" data-parentid="${item.parentId}" data-outlinetype="${item.outlineType}" data-contentid="${item.content.contendId}" data-index="${item.outlineCatalog}"${prev}>${item.outlineTitle}`
            );
        htmlArr.push(this.setParagraphContent(item.content.contentText));
        htmlArr.push('</div>');
        // 如果有子集
        if (item.children && item.children.length) {
            item.children.forEach(child => {
                htmlArr.push(this.setOutlineContent(child, letter));
            })
        }
        return htmlArr.join("");
    },

    /**
     * @description 根据HTML输出JSON数据
     * @param {Array}  htmlList 为每个页面的OUTHTML
     * @returns
     */
    outStructData(infoBlocks = []) {
        var blockDatas = [];
        for (let i = 0; i < infoBlocks.length; i++) {
            let data = this.parseDataByBlock(infoBlocks[i]);
            blockDatas.push(data);
        }
        return blockDatas;
    },
    /**
     * @description DOM解析成JSON数据
     * @param {Element} ele
     */
    parseDataByBlock(ele) {
        var attributes = ele.attributes;
        var attrObj = {};
        if (attributes) {
            for (let key in attributes) {
                let attr = attributes[key];
                if (attr.name && attr.value) {
                    attrObj[attr.name] = attr.value;
                }
            }
        }
        var jsonData = {
            tagName: ele.nodeName,
            text: ele.nodeType === 3 ? ele.nodeValue : '',
            attr: {
                ...attrObj,
                style: ele.nodeType !== 3 ? this.getStyles(ele) : null
            },
            children: []
        }
        if (ele.childNodes && ele.childNodes.length) {
            for (let i = 0; i < ele.childNodes.length; i++) {
                let data = this.parseDataByBlock(ele.childNodes[i]);
                jsonData.children.push(data);
            }
        }
        return jsonData;
    },

    getEditorDom() {
        return tinyMCE.activeEditor.dom;
    },
    /**
     * @description 获取DOM的STYLE样式
     * @param {Element} node
     */
    getStyles(node) {
        const style = window.getComputedStyle(node);
        var selfStyle = {};
        // 解析本身的STYLE
        if (node.getAttribute('style')) {
            let nodeStyle = node.getAttribute('style').split(";");
            nodeStyle.forEach(str => {
                let strSplit = str.split(":");
                if (strSplit[0] && strSplit[1]) {
                    selfStyle[strSplit[0]] = strSplit[1].trim();
                }
            })
        }
        return {
            'line-height': node.style.lineHeight || 1.5,
            'font-size': style.fontSize || '10.5pt',
            'font-family': style.fontFamily || 'simSun',
            'font-style': style.fontStyle || 'normal',
            'color': style.color || '#000',
            'text-align': style.textAlign || 'left',
            ...selfStyle
        };
    }
}
