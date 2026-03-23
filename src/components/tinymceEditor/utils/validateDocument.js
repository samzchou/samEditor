/**
 * ===================================================================================================================
 * @module
 * @desc 文档校验
 * @author sam 2022-03-12
 * ===================================================================================================================
 */
import $global from "@/utils/global";
import $bus from "@/utils/bus";

export default {
    /**
     * @description 校验文档格式和样式
     * @params {Object} editor tinymce
     * @params {Object} vm 编辑器实例
     */
    validateElement(editor=null, vm=null) {
        editor = window.tinyMCE.activeEditor;
        var pageData = vm.pageData;
        // console.log('pageData=>', pageData);
        var msgList = [];
        var msg = '文件校验完成：暂未发现错误！';
        var pageContainer = editor.getBody().querySelector('.page-container');
        var numIndex = 1;
        // 如果是标准编写须做校验
        if (pageContainer && vm.editorSetting && vm.editorSetting.isStandard) {
            // 扫描封面
            var coverPage = pageContainer.querySelector('.info-block.cover');
            if (coverPage) {
                // ICS校验
                $bus.$emit('scanning', { title:"ICS校验" });
                let icsNode = coverPage.querySelector('.ics');
                if (icsNode) {
                    var icsText = icsNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g,'');
                    if (icsText) {
                        if (/[\u4E00-\u9FA5\uF900-\uFA2D]/.test(icsText) || !/^\d+(\.\d+)*$/.test(icsText)) {
                            icsNode.dataset.id = icsNode.dataset.id || $global.guid();
                            msgList.push({ msg:'ICS编号不符合规则，必须是数字和小数点组合！', id:icsNode.dataset.id });
                        }
                    }
                }
                // CCS校验
                 $bus.$emit('scanning', { title:"CCS校验" });
                let ccsNode = coverPage.querySelector('.ccs');
                if (ccsNode) {
                    var ccsText = ccsNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g,'');
                    if (ccsText) {
                        if (/[\u4E00-\u9FA5\uF900-\uFA2D]/.test(ccsText) || !/^[A-Z]/g.test(ccsText.charAt(0)) || !/^[0-9]*[1-9][0-9]*$/.test(ccsText.substring(1,100))) {
                            ccsNode.dataset.id = ccsNode.dataset.id || $global.guid();
                            msgList.push({ msg:'CCS编号不符合规则，必须是大写英文首字符和数字组合！', id:ccsNode.dataset.id });
                        }
                    }
                }

                // 备案号（行标、地标必须有备案号）
                $bus.$emit('scanning', { title:"备案号校验" });
                var recordNumberText;
                let recordNumberNode = coverPage.querySelector('.recordNumber');
                if ([1200,6].includes(pageData.stdKind)) {
                    if (!recordNumberNode) {
                        let icsParentNode = coverPage.querySelector('.ics-ccs');
                        let recordNode = editor.dom.create('p', { 'title':'备案号' }, '<span class="tag other recordNumber" data-tag="recordNumber" data-name="备案号" contenteditable="true"></span>')
                        recordNumberNode = icsParentNode.appendChild(recordNode);
                    }
                    recordNumberText = recordNumberNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g,'');
                    if (!recordNumberText || !/^[0-9]+(\-)+[0-9]/g.test(recordNumberText)) {
                        recordNumberNode.dataset.id = recordNumberNode.dataset.id || $global.guid();
                        msgList.push({ msg:'备案号不符合规则！', id:recordNumberNode.dataset.id });
                    }
                }
                // 标准代码(非国标和指导性文件)
                $bus.$emit('scanning', { title:"标准代码校验" });
                var stdSignText = "";
                if (![1100,7].includes(pageData.stdKind)) {
                    let stdSignNode = coverPage.querySelector('.stdSign');
                    stdSignNode.dataset.id = stdSignNode.dataset.id || $global.guid();
                    stdSignText = stdSignNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g,'');
                    if (!stdSignText) {
                        msgList.push({ msg:'未填写标准代码！', id:stdSignNode.dataset.id });
                    } else {
                        if (!/^[A-Z-0-9]/g.test(stdSignText)) {
                            msgList.push({ msg:'企业标准代码不符合规则，须包含Q/字符！', id:stdSignNode.dataset.id });
                        }
                    }
                }

                // 标准抬头
                $bus.$emit('scanning', { title:"标准标题校验" });
                let titleNode = coverPage.querySelector('h1.title');
                if (!titleNode) {
                    msgList.push({ msg:'缺少标准标题节点！' });
                } else {
                    var titleText = titleNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g,'');
                    titleNode.dataset.id = titleNode.dataset.id || $global.guid();
                    if (!titleText && ![1100,7].includes(pageData.stdKind)) {
                        msgList.push({ msg:'标准标题未填写！', id:titleNode.dataset.id });
                    }
                }
                // 标准编号及代替号
                $bus.$emit('scanning', { title:"标准编号及代替号校验" });
                var stdNoText, origStdNoText;
                let numberNodes = coverPage.querySelectorAll('.numbers>p');
                if (!numberNodes.length) {
                    msgList.push({ msg:'缺少标准编号节点！' });
                } else {
                    // 编号
                    var stdNoNode = numberNodes[0];
                    if (!stdNoNode) {
                        msgList.push({ msg:'缺少标准编号节点！' });
                    } else {
                        stdNoText = stdNoNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
                        stdNoNode.dataset.id = stdNoNode.dataset.id || $global.guid();
                        let numArr = Array.from(stdNoNode.childNodes).filter(ele => {return ele.nodeName !== '#text';} );
                        for (let i=0; i<numArr.length; i++) {
                            // 代码
                            let txt = numArr[i].textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
                            if (i === 0 && txt !== stdSignText && stdSignText) {
                                msgList.push({ msg:'标准编号中代码错误！', id:stdNoNode.dataset.id });
                                break;
                            // 顺序号  !/^\d+(\.\d+)*$/.test(txt)
                            } else if (i === 1 && /[(\u4E00-\u9FA5)]|(\uff00-\uffff)]/g.test(txt)) {
                                msgList.push({ msg:'标准编号中顺序号错误！', id:stdNoNode.dataset.id });
                                break;
                            } else if (i === 3 && !/^\d{4}$/.test(txt) && !/^[1-9]+[0-9]/.test(txt)) {
                                msgList.push({ msg:'标准编号中年代号错误！', id:stdNoNode.dataset.id });
                                break;
                            }
                        }
                    }
                    // 代替编号
                    var origStdNoNode = numberNodes[1];
                    origStdNoNode.dataset.id = stdNoNode.dataset.id || $global.guid();
                    let origStdNoText = origStdNoNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g,'');
                    if (origStdNoText) {
                        let origStdNoSplit = origStdNoText.split("、");
                        origStdNoSplit.forEach((str, i) => {
                            if (!/^(?=.*[a-zA-Z])(?=.*[—])/.test(str) || /^[\u4E00-\u9FA5\uFE30-\uFFA0]/.test(str)) {
                                msgList.push({ msg:`代替标准编号第${i+1}个不符合规则！`, id:origStdNoNode.dataset.id });
                            }
                        });
                    }
                }

                // 标准名称
                $bus.$emit('scanning', { title:"标准名称元素校验" });
                var stdNameText;
                let stdNameNode = coverPage.querySelector('.stdName');
                if (!stdNameNode) {
                    msgList.push({ msg:'缺少标准名称节点！' });
                } else {
                    // 字体样式
                    $bus.$emit('scanning', { title:"标准名称样式校验" });
                    let stdNameStyle = window.getComputedStyle(stdNameNode);
                    // console.log(stdNameStyle)
                    if (stdNameStyle.fontFamily !== 'simHei' || stdNameStyle.fontSize !== '32px') {
                        msgList.push({ msg:'标准名称中的字体必须为黑体一号字体！', id:stdNameNode.dataset.id });
                    }

                    stdNameText = stdNameNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g,'');
                    stdNameNode.dataset.id = stdNameNode.dataset.id || $global.guid();
                    let stdNameSplit = stdNameText.split('第');
                    stdNameSplit.forEach((str, i) => {
                        if (i === 0) {
                            // 不可包含标准两字(及指导性技术文件)
                            let ck1 = str.slice(str.length-2, str.length); 	// 取最后2个字符
                            let ck2 = str.slice(str.length-10, str.length); 	// 取最后10个字符
                            if (ck1 === '标准' || ck2 === '标准化指导性技术文件') {
                                msgList.push({ msg:'标准名称中最后不能为"标准"或"标准化指导性技术文件"！', id:stdNameNode.dataset.id });
                            }
                        } else if (i===1) {
                            if (!/^[0-9]/g.test(str)) {
                                msgList.push({ msg:'标准名称中的第和部分间缺少数字！', id:stdNameNode.dataset.id });
                            }
                        }
                    });
                }

                // 判断 stdNoText 是否带 . （标识第n部分）
                $bus.$emit('scanning', { title:"标准名称应按编号规则关联校验" });
                if (stdNoText && stdNameText) {
                    if (stdNoText.includes(".") && !/^(?=.*第)(?=.*部分)/g.test(stdNameText)) {
                        msgList.push({ msg:'标准名称应按编号规则须包含“第、部分字符”！', id:stdNameNode.dataset.id });
                    }
                }


                // 一致性程度
                $bus.$emit('scanning', { title:"与国际标准一致性程度的标识校验" });
                var consistentSignText;
                var consistentSignNode = coverPage.querySelector('.content .consistentSign');
                if (consistentSignNode) {
                    consistentSignText = consistentSignNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g,'').toU;
                    if (consistentSignText && !/(\IDT|\MOD|\NEQ)/.test(consistentSignText)) {
                        consistentSignNode.dataset.id = consistentSignNode.dataset.id || $global.guid();
                        msgList.push({ msg:'与国际标准一致性程度的标识错误！', id:consistentSignNode.dataset.id });
                    }
                }

                // 发布时间
                $bus.$emit('scanning', { title:"发布时间校验" });
                var stdPublishDateText;
                let stdPublishDateNode = coverPage.querySelector('.footer-publish');
                if (!stdPublishDateNode) {
                    msgList.push({ msg:'缺少发布时间节点！' });
                } else {
                    stdPublishDateText = stdPublishDateNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g,'');
                    stdPublishDateNode.dataset.id = stdPublishDateNode.dataset.id || $global.guid();
                    if (!stdPublishDateText) {
                        msgList.push({ msg:'发布时间未填写！', id:stdPublishDateNode.dataset.id });
                    } else {
                        if (!/^\d{4}$/.test(stdPublishDateText) && !/^[1-9]+[0-9]/.test(stdPublishDateText)) {
                            msgList.push({ msg:'发布时间格式不符！', id:stdPublishDateNode.dataset.id });
                        }
                    }
                }
                // 实施时间
                $bus.$emit('scanning', { title:"实施时间校验" });
                var stdPerformDateText;
                let stdPerformDateNode = coverPage.querySelector('.footer-put');
                if (!stdPerformDateNode) {
                    msgList.push({ msg:'缺少实施时间节点！' });
                } else {
                    stdPerformDateText = stdPerformDateNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g,'');
                    stdPerformDateNode.dataset.id = stdPerformDateNode.dataset.id || $global.guid();
                    if (!stdPerformDateText) {
                        msgList.push({ msg:'实施时间未填写！', id:stdPerformDateNode.dataset.id });
                    } else {
                        if (!/^\d{4}$/.test(stdPerformDateText) && !/^[1-9]+[0-9]/.test(stdPerformDateText)) {
                            msgList.push({ msg:'实施时间格式不符！', id:stdPerformDateNode.dataset.id });
                        }
                    }
                }
                // 实施时间必须大于发布时间
                $bus.$emit('scanning', { title:"发布时间与实施时间比较校验" });
                if (stdPublishDateText && stdPerformDateText) {
                    if (new Date(stdPublishDateText).getTime() >= new Date(stdPerformDateText).getTime()) {
                        msgList.push({ msg:'发布时间不能大于实施时间！', id:stdPerformDateNode.dataset.id });
                    }
                }
                // 发布单位
                $bus.$emit('scanning', { title:"发布单位校验" });
                let utilNode = coverPage.querySelector('.main-util');
                if (!utilNode) {
                    msgList.push({ msg:'缺少发布单位节点！' });
                } else {
                    let utilText = utilNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g,'');
                    utilNode.dataset.id = utilNode.dataset.id || $global.guid();
                    if (!utilText) {
                        msgList.push({ msg:'发布时间不能大于实施时间！', id:utilNode.dataset.id });
                    }
                }
            }

            // 目次校验
            $bus.$emit('scanning', { title:"目次要素校验" });
            var cataloguePages = Array.from(pageContainer.querySelectorAll('.catalogue'));
            cataloguePages.forEach(page => {
                let catalogueList = Array.from(page.querySelectorAll('.fld-char'));
                catalogueList.forEach((node, index) => {
                    node.dataset.id = node.dataset.id || $global.guid();
                    let childNodes = node.childNodes;
                    childNodes.forEach((ele, i) => {
                        if ((i === 0 || i === 2) && ele.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g,'') === '') {
                            msgList.push({ msg:`目次第${index}行错误！`, id:node.dataset.id });
                        }
                    })
                })
            })

            // 前言要素校验 (前言中如果使用章、条、表格、图片等内容，给出错误提醒)
            var prefacePages = pageContainer.querySelectorAll('.info-block[data-outlinetype="1"]');
            var patentCheck = false, insteadCheck = false, tableCheck = false, imgCheck = false, consistentSignCheck = false;

            if (prefacePages) {
                $bus.$emit('scanning', { title:"前言要素校验" });
                prefacePages.forEach((page, i) => {
                    page.dataset.id = page.dataset.id || $global.guid();
                    let pageText = page.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g,'');
                    let childNodes = Array.from(page.childNodes);
                    childNodes.forEach(node => {
                        node.dataset.id = node.dataset.id || $global.guid();
                        if (node.dataset.index) {
                            msgList.push({ msg:'前言中不能包含章节和条题！', id:node.dataset.id });
                        }
                        if (node.nodeName === 'TABLE') {
                            msgList.push({ msg:'前言中不能包含表格！', id:node.dataset.id });
                        }
                        if (node.nodeName === 'IMG') {
                            msgList.push({ msg:'前言中不能包含图片！', id:node.dataset.id });
                        }
                    })
                    // 在编号出现了部分号的情况下，前言自动展示 （本文件…..的第X部分……以下部分）相关段内容出现
                    if (i === 0 && stdNoText && stdNoText.includes(".") && !/^(?=.*第)(?=.*部分)/g.test(pageText)) {
                        msgList.push({ msg:`标准编号出现了部分号的情况下，前言须注明第几部分！`, id:page.dataset.id });
                    }
                    // 标准修订，代替XXXX标准时，前言自动展示（本文件代替…….主要技术变化如下）
                    if (i === 0 && origStdNoText && pageText.match(/\本文件代替/i) === null) {
                        msgList.push({ msg:`标准修订情况下，前言须注明”本文件代替…….主要技术变化如下“！`, id:page.dataset.id });
                    }
                    // 封面上出现“与国际文件一致性说明”，在前言中自动展示相关段内容，标准编号、名称要与封面上关联，一致性程度有“等效”、“修改”和“非等效”，如果封面上NEQ，自动非等效。
                    if (i === 0 && consistentSignText && pageText.match(/\一致性程度为等效|\一致性程度为修改|\一致性程度为非等效/i) === null) {
                        msgList.push({ msg:`封面上出现“与国际文件一致性说明”，前言须包含一致性程度相关注明！`, id:page.dataset.id });
                    }
                    // 请注意本文件的某些内容可能涉及专利………..”任何版本在前言中都要出现
                    if (i === 0 && pageText.match(/\请注意本文件的某些内容可能涉及专利/i) === null && i===0) {
                        msgList.push({ msg:`前言缺少”本文件的某些内容可能涉及专利“相关注明！`, id:page.dataset.id });
                    }
                    if (pageText.match(/\专利/i !== null)) {
                        patentCheck = true;
                    }
                });
            } else {
                msgList.push({ msg:`缺少前言页面！` });
            }


            // 校验引言 （如果涉及到专利，“本文件的发布机构提请注意…….”段相关内容在引言中出现（DMS校验））
            var forcePages = Array.from(pageContainer.querySelectorAll('.info-block[data-outlinetype="2"]'));
            if (forcePages.length) {
                $bus.$emit('scanning', { title:"引言要素校验" });
                if (forcePages.length > 2) {
                    msgList.push({ msg:`引言最多2页，超过2页则作为附录补充说明！` });
                }
                forcePages.forEach((page, i) => {
                    page.dataset.id = page.dataset.id || $global.guid();
                    let pageText = page.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g,'');
                    // 如果封面有备案号
                    if ((recordNumberText || patentCheck) && pageText.match(/\本文件的发布机构提请注意/) === null && i === 0) {
                        msgList.push({ msg:`涉及到专利，“本文件的发布机构提请注意…….”相关内容须在引言中注明！`, id:page.dataset.id });
                    }
                })
            } else {
                if (recordNumberText || (stdNoText && stdNoText.match(/\./) !== null)) {
                    msgList.push({ msg:`标准编号有部分号（或涉及专利备案号）的，须有引言页！` });
                }
            }
            // 章节校验
            $bus.$emit('scanning', { title:"正文要素校验" });
            var rangePages = pageContainer.querySelectorAll('.info-block[data-outlinetype="3"]');
            if (!rangePages.length) {
                msgList.push({ msg:`标准文档必须有范围页！` });
            }
            var termPages = pageContainer.querySelectorAll('.info-block[data-outlinetype="5"]');
            if (!termPages.length) {
                msgList.push({ msg:`标准文档必须有术语和定义页！` });
            }

            var structPages = Array.from(pageContainer.querySelectorAll('.info-block.struct,.info-block.appendix'));
            structPages.forEach((page, i) => {
                let pageNo = page.dataset.pagenum;
                if (page.dataset.outlinetype === "3") {
                    // 是否有标题
                    if (!page.querySelector('.header-title')) {
                        msgList.push({ msg:`范围页面缺少文档标题！`, id:page.dataset.outlineid });
                    }
                } else if (page.dataset.outlinetype === "4") {
                    // 是否有引用列表
                    let listELe = page.querySelectorAll('.ol-list');
                    if (!listELe.length || listELe.length>1) {
                        msgList.push({ msg:`“规范性引用文件”页面不能包含条题！`, id:page.dataset.outlineid });
                    } else {
                        let olChilds =  Array.from(listELe[0].childNodes);
                        let checkChild = false;
                        Array.from(listELe[0].childNodes).forEach((ele, i) => {
                            let text = ele.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
                            if (i === 0) {
                                if (text.match(/\下列文件中的内容通过文中的规范性引用而构成本文件必不可少的条款/i) === null) {
                                    msgList.push({ msg:`“规范性引用文件”页面的引导语不符合GB/T 1.1-2020标准的要求！`, id:page.dataset.outlineid });
                                }
                            } else {
                                if (/^[A-Z]/g.test(text)) {
                                    checkChild = true;
                                }
                            }
                        });
                        if (!checkChild) {
                            msgList.push({ msg:`“规范性引用文件”页面的缺少具体的引用内容！`, id:page.dataset.outlineid });
                        }
                    }

                }

                // 层级项
                let olList = Array.from(page.querySelectorAll('.ol-list, .appendix-list'));
                olList.forEach(el => {
                    if (!el.dataset.bookmark) {
                        msgList = msgList.concat(this.checkOlList(pageContainer, el.dataset.source));
                    }
                })
                // 列项层级
                let bullets = Array.from(page.querySelectorAll('.bullet'));
                bullets.forEach(el => {
                    let level = parseInt(el.dataset.level);
                    el.dataset.id = el.dataset.id || $global.guid();
                    if (level > 2) {
                        let bulletStr = el.textContent.substring(0,10)
                        msgList.push({ msg:`列项${bulletStr}...层级不能超过2层！`, id:el.dataset.id });
                    }
                })
            })
        }
        $bus.$emit('scanning', { result:msgList });
        return msgList;
    },
    // 检查层级项的无条题
    checkOlList(pageContainer=null, source="") {
        var msgList = [];
        var sameNodes = Array.from(pageContainer.querySelectorAll(`[data-source="${source}"]`));
        if (sameNodes.length) {
            sameNodes.forEach(ele => {
                if (ele.dataset.bookmark) {
                    let levelStr = ele.textContent.substring(0,10)
                    msgList.push({ msg:`条题${ele.dataset.index}：${levelStr}...应设为无条题！`, id:ele.dataset.outlineid });
                    msgList = msgList.concat(this.checkOlList(pageContainer, ele.dataset.index));
                }
            })
        }
        return msgList;
    }
}
