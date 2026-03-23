/**
 * ===================================================================================================================
 * @module
 * @desc 文档转换成HTML处理模块
 * @author sam 2022-08-21
 SELECT
 	sdc_parentno,std_kind,sdc_iscatalog,sdc_chapter,sdc_caption,sdc_page
 FROM
 	std_content
 WHERE
 	std_no=1540019
 ORDER BY sdc_no ASC
 * ===================================================================================================================
 */
'use strict';
import $samGlobal from '@/utils/global';
import { outlineTypes } from '../tinymceEditor/configs/editorOptions'

export default {
    dataList: [],
    coverData: {},
    rootId: '',
    /**
     * @description 开始分析数据
     * @param {Array} data
     * @return {Array} 返回大纲数组
     */
    parseInit(coverData, data=[]) {
        this.coverData = coverData;
        // 根节点ID
        this.rootId = $samGlobal.guid();
        // 数据去重,以免污染结构
        data = this.unique(data);
        console.log('source data', data);
        // 干净的原始数据
        this.dataList = _.cloneDeep(data);
        // step1：先按大纲第一层类型定义关键节点并置入数组
        var outlineStruct = [],
            orderNum = 1,
            structIndex=0,
            appendIndex = 0;
        data.forEach((item, rowIndex) => {
            item['sdc_caption'] = item['sdc_caption'].replace(/\s/g,'');
            let chapter = item['sdc_chapter'] || '';
            // 匹配章节或条目标识的  (/^[A-Z|0-9]+(\.\d)+$/.test(chapter) && !isNaN(chapter) && chapter.length === 1)
            let chapterData = this.isChapter(item, 0);

            if (chapter && chapterData) {
                let outlineId = $samGlobal.guid();
                let outlineCatalog = chapter.replace(/\-/g,'');

                if (chapterData.letter) {  // 附录
                    outlineCatalog = chapterData.letter; // String(appendIndex);
                } else if (![1,2,11,12].includes(chapterData.outlineType)) {
                    structIndex++;
                    outlineCatalog = String(structIndex);
                }
                // let outlineType = this.getOutlineType(item, /^[A-Z|0-9]+(\.\d)+$/.test(chapter));
                let endIndex = data.length;
                // item.startIndex = rowIndex;
                let outlineItem = {
                    ...chapterData,
                    docId: coverData.docId,
                    ancestors: `${this.rootId},${outlineId}`,
                    outlineId,
                    parentId: this.rootId,
                    outlineCatalog,
                    content: {
                        contentId: $samGlobal.guid(item),
                        contentText: item['sdc_caption'],
                        docId: coverData.docId,
                    },
                    isVisible: 1,
                    levelNum: 1,
                    orderNum,
                    startIndex: rowIndex,
                    endIndex: data.length
                }
                // 判断是否已经存在相同的大纲结构
                let chapterIndex = _.findIndex(outlineStruct, { outlineCatalog:outlineItem.outlineCatalog, outlineType:outlineItem.outlineType });
                if (!~chapterIndex) {
                    // 取出大纲数组最后一个，修改数据结束行下标
                    let lastOutline = outlineStruct[outlineStruct.length-1];
                    if (lastOutline) {
                        lastOutline.endIndex = rowIndex;
                    }
                    outlineStruct.push(outlineItem);
                    orderNum++;
                }
            }
        });
        // 再处理子集
        outlineStruct = outlineStruct.map(item => {
            item = this.setStruct(item);
            delete item.startIndex, delete item.endIndex;
            return item;
        });
        console.log('outlineStruct', outlineStruct);

        return {
            ancestors: this.rootId,
            parentId: "0",
            outlineId: this.rootId,
            outlineTitle: this.coverData.stdName,
            outlineType: null,
            content: {
                docId: this.coverData.docId
            },
            children: outlineStruct
        }
    },

    setStruct(item) {
        // 结构性章节
        var isStruct = ![1,2,11,12].includes(item.outlineType);
        let htmlArr = [], children = [], parentId = item.outlineId;
        for(let i=item.startIndex; i<item.endIndex; i++) {
            let paragraph = this.dataList[i];
            paragraph['sdc_chapter'] = paragraph['sdc_chapter'].replace(/\s|\.0/g,'');
            // 非结构性章节
            if (!isStruct) {
                // 非结构性章节须定义标题
                if (i===item.startIndex) {
                    htmlArr.push(`<div class="header-title" data-bookmark="${item.outlineId}"><p>${paragraph['sdc_caption'].split("").join("&nbsp; ")}</p></div>`);
                } else {
                    let str = paragraph['sdc_chapter'] + paragraph['sdc_caption'];
                    htmlArr.push(`<p style="text-indent: 2em;">${str}</p>`);
                }
            // 结构性章节
            } else {
                let str =  paragraph['sdc_caption'];
                // 第一条结构性章节须加上文档的标题
                if (i === item.startIndex) {
                    if (item.outlineCatalog == 1) {
                        htmlArr.push(`<div class="header-title chapter" data-parentid="${item.parentId}" data-contentid="${$samGlobal.guid()}"><p data-bind="stdName">${this.coverData.stdName}</p></div>`);
                    }
                } else {
                    children.push(paragraph);
                }
            }
        }
        if (children.length) {
            item = this.setChildrenStruct(item, children);
        }
        // console.log('setChildrenStruct', item.children)
        return item;
    },

    /**
     * @description 遍历处理块内节点，构建树结构
     * @param {Object} item
     * @param {Array} children
     */
    setChildrenStruct(item={}, children=[]) {
        const setChildren = (node, index=0) => {
            var nodeChapter = node.outlineCatalog;
            var strArr = [];
            node.children = node.children || [];
            var hasChildChapter = false;
            for(let i=index; i<children.length; i++) {
                let child = children[i];
                let chapter = child['sdc_chapter'];
                if (/^[A-Z|0-9]+(\.\d)+$/.test(chapter)) {
                    hasChildChapter = true;
                    let chapterSplit = chapter.split(".");
                    if (nodeChapter && nodeChapter === chapterSplit.slice(0, chapterSplit.length-1).join(".")) {
                        let outlineId = $samGlobal.guid(item);
                        let orderNum = node.orderNum + 100 + i;
                        let outlineItem = {
                            docId: node.docId,
                            ancestors: `${node.ancestors},${outlineId}`,
                            outlineId,
                            parentId: item.outlineId,
                            outlineTitle: child['sdc_caption'],
                            outlineCatalog: chapter,
                            levelNum: node.levelNum + 1,
                            content: {
                                contentId: $samGlobal.guid(item),
                                contentText: child['sdc_caption'],
                                docId: item.docId,
                            },
                            isVisible: 1, //Number(child['sdc_iscatalog']),
                            orderNum,
                        }
                        node.children.push(outlineItem);
                        setChildren(outlineItem, i+1);
                    }
                } else {
                    if (!hasChildChapter) {
                        let strContent = chapter + child['sdc_caption'];
                        if (strContent.match(/\.png|\.jpg/)) {
                            strContent = 'http://127.0.0.1/' + strContent;
                            strContent = strArr.push(`<p class="img" style="text-align: center;"><img src="${strContent}" /></p>`);
                        } else {
                            strArr.push(`<p style="text-indent: 2em;">${strContent}</p>`);
                        }
                    }
                }
            }
            node.content.content = strArr.join("");
            return node;
        }
        return setChildren(item, 0);
    },


    /**
     * @description 定义大纲类型
     */
    isChapter(item={}, level=0) {
        // 满足类型枚举的
        var typeObj = _.find(outlineTypes, o => { return o.label === item['sdc_caption']; });
        if (typeObj) {
            return {
                outlineType: typeObj.type,
                outlineTitle: item['sdc_caption']
            };
        // 匹配为字母、数字、小数点
        } else if (!level && /^[A-Z0-9]+$/.test(item['sdc_chapter']) && item['sdc_iscatalog'] == 1) {
            // 仅按第一层处理  && item['sdc_chapter'].length === 1
            if (item['sdc_chapter'].split(".").length === 1) {
                return {
                    outlineType: /^[\术语]{2}/i.test(item['sdc_caption']) ? 5 : 6,
                    outlineTitle: item['sdc_caption']
                };
            }
        } else if (!level && /^\附录+[A-Z]/.test(item['sdc_chapter'])) {
            return {
                outlineType: 8,
                letter: item['sdc_chapter'].replace(/^\附录/g,''),
                outlineTitle: item['sdc_caption']
            };

        } else if(/^[A-Z|0-9]+(\.\d)+$/.test(item['sdc_chapter'])) {

        }
        return null;
    },

    /**
     * @description 定义大纲类型
     * @param{Object} item 数据对象
     * @param{Boolean} isStruct 是否为结构性章节
     * @return {Int}
     */
    getOutlineType(item={}, isStruct=false) {
        if (isStruct) {

        } else {

        }
        for(let i=0; i<outlineTypes.length; i++) {

        }
        return 1;
    },
    /**
     * @description 数组对象去重，同时排除编制说明
     * @param{Array} arr 数组
     * @return {Array}
     */
    unique(arr=[]) {
        var res = [];
        var filterIndex = 0;
        for(let i=0; i<arr.length; i++) {
            let item = arr[i];
            if (!filterIndex && item['sdc_chapter'] === '-' && ['条文说明','编制说明'].includes(item['sdc_caption'])) {
                filterIndex = i;
            }
            let index = _.findIndex(res, item); // res.indexOf(item)
            (!~index && !filterIndex) && res.push(item);
        }


        return res;
    }

}
