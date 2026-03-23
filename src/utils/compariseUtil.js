/**
 * ===================================================================================================================
 * @module
 * @desc 编辑器文档比对模块
 * @author sam 2023-01-14
 * ===================================================================================================================
 */

// 文档比对核心程序
import { diffChars } from './docDiff';
import $global from './global.js';

/**
 * @description 文本字符比对
 * @param {String} sourceText
 * @param {String} targetText
 */
export function diffTextContent(targetText = '', sourceText = '') {
    return diffChars(targetText, sourceText);
}

/**
 * @description 处理比对结果，输出内容
 * @param {Arrar} diffResult
 * @param {String} sourceText
 */
export function similarComparise(diffResult = [], sourceText = '', compareOutline=false) {
    var charLens = 0;sourceText.length;
    var delLens = 0, addLens = 0, similarLens = 0;
    var fragment = document.createElement('section');
    for (var i = 0; i < diffResult.length; i++) {
        charLens += diffResult[i].count;
        let node;
        let pos;
        let uuid = $global.guid();
        if (diffResult[i].removed) {
            // delLens += diffResult[i].count;
            delLens++;
            node = document.createElement('del');
            pos = diffResult[i].pos - diffResult[i].count;
            node.dataset.pos = pos;
            node.dataset.id = uuid;
            node.dataset.count = diffResult[i].count;
            node.appendChild(document.createTextNode(diffResult[i].value));
        } else if (diffResult[i].added) {
            // addLens += diffResult[i].count;
            addLens++;
            node = document.createElement('ins');
            pos = diffResult[i].pos - diffResult[i].count;
            node.dataset.pos = pos;
            node.dataset.id = uuid;
            node.dataset.count = diffResult[i].count;
            node.appendChild(document.createTextNode(diffResult[i].value));
        } else {
            similarLens += diffResult[i].count;
            node = document.createTextNode(diffResult[i].value);
        }
        fragment.appendChild(node);
    }
    var innerHtml = fragment.innerHTML || '<q>无比对文本结果！</q>'; //
    var isEmpty = fragment.innerHTML === '';
    // 相似度计算
    var percent = charLens ? Math.floor((similarLens / charLens) * 10000 / 100) : 0;
    if (compareOutline) {
        if (!isEmpty && percent) {
            percent = 100 - percent;
        }
        if (!similarLens) {
            percent = 100;
        }
    }
    // var similarInnerHTML = '文本相似度:' + percent + '%；增加:' + String(delLens) + '(绿色)；缺少:' + String(addLens) + '(红色)'; 98fa423a-dfd7-4fb8-815a-57a3d6965ebe 5358db8a-4717-491c-bd13-66800a1b246e
    // var similarInnerHTML = '文本相似度:' + percent + '%';
    var similarInnerHTML = (compareOutline?'文本差异度：':'文本相似度:') + percent + '%';
    fragment.remove();
    return {
        diff: diffResult,
        isEmpty,
        htmlContent: innerHtml,
        similar: similarInnerHTML,
        percent
    }
}

/**
 * @description 比对每一个子集DOM对象, 暂时扫描到第二层
 * @param {Array} sourceOutline
 * @param {Array} targetNodes
 */
export function nodeComparise(targetNodes = [], sourceNodes = []) {
    // 校验是否为空字符对象： 暂时图片|表格|空对象 等不做比较 && cls.match(/\img/gi) === null
    const isEmpty = node => {
        let cls = node.className || '';
        return !['IMG', 'TABLE'].includes(node.nodeName) && node.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '';
    }
    var result = [];
    var allLens = sourceNodes.length ? Math.abs(targetNodes.length - sourceNodes.length) + targetNodes.length : targetNodes.length;
    // debugger
    for (var i = 0; i < allLens; i++) {
        let sourceNode = sourceNodes[i];
        let targetNode = targetNodes[i];
        let sourceText = '',  targetText = '';
        if (!targetNode && sourceNode) {
            sourceText = !isEmpty(sourceNode) ? sourceNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') : '';
        } else if (targetNode && !sourceNode) {
            targetText = !isEmpty(targetNode) ? targetNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') : '';
        } else if (targetNode && !isEmpty(targetNode) && sourceNode && !isEmpty(sourceNode)) {
            // 表格比对
            if (targetNode.nodeName === 'TABLE' && sourceNode.nodeName === 'TABLE') {
                let sourceRows = Array.from(sourceNode.rows);
                let targetRows = Array.from(targetNode.rows);
                // debugger
                for(let j=0; j<targetRows.length; j++) {
                    let sourceRow = sourceRows[j];
                    let targetRow = targetRows[j];
                    let sourceCells = sourceRow ? Array.from(sourceRow.cells) : [];
                    let targetCells = targetRow ? Array.from(targetRow.cells) : [];
                    for (let n=0; n<targetCells.length; n++) {
                        let sourceCell = sourceCells[n];
                        let targetCell = targetCells[n];
                        let sourceCellText = sourceCell ? sourceCell.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') : '';
                        let targetCellText = targetCell ? targetCell.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') : '';

                        if (sourceCellText && targetCellText && sourceCellText !== targetCellText) {
                            $global.addClass(sourceCell, 'diff');
                            $global.addClass(targetCell, 'diff');
                        } else if ((sourceCellText && !targetCellText) || (!sourceCellText && targetCellText)) {
                            sourceCell && $global.addClass(sourceCell, 'diff');
                            targetCell && $global.addClass(targetCell, 'diff');
                        }
                    }
                }
            }
            // 文本内容比对
            sourceText = sourceNode ? sourceNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') : '';
            targetText = targetNode ? targetNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') : '';
            // 如果节点为图片
            if (targetNode && targetNode.nodeName === 'IMG' && sourceNode && sourceNode.nodeName === 'IMG') {
                sourceText = sourceNode.src;
                targetText = targetNode.src;
            }
        }
        // 比对结果，输出数组 [ 相同 | 删除 | 新增 ]
        let comparised = diffTextContent(targetText, sourceText);
        // debugger
        let data = {
            sourceNode,
            targetNode,
            nodecomparised: comparised,
            html: similarComparise(comparised, targetText, true),
        }
        result.push(data);
    }
    return result;
}

export function filterNodes(nodes = []) {
    return nodes.filter(node => {
        return !['BR'].includes(node.nodeName);
    })
}

/**
 * @description 根据大纲章节进行节点DOM内容比对
 * @param {Array} sourceOutline
 * @param {Array} targetOutline
 */
export function outlineComparise(targetOutline = [], sourceOutline = [], sourceAllOutline) {
    var result = [];
    const compariseOutline = (targetItem = {}, sourceItem = {}) => {
        // 取出源节点的所有子对象DOM
        let sourceChildNodes = sourceItem.outlineNode ? filterNodes(Array.from(sourceItem.outlineNode.childNodes)) : [];
        // 取出目标节点的所有子对象DOM
        let targetChildNodes = targetItem.outlineNode ? filterNodes(Array.from(targetItem.outlineNode.childNodes)) : [];
        // 进行节点比对
        let comparisedNode = nodeComparise(targetChildNodes, sourceChildNodes);
        // debugger
        let data = {
            sourceItem: _.omit(sourceItem, ['content']),
            targetItem: _.omit(targetItem, ['content']),
            comparised: comparisedNode,
        };
        return data;
    }

    targetOutline.forEach((item, i) => {
        let sourceItem = sourceOutline[i];
        if (sourceAllOutline) {
            sourceItem = _.find(sourceAllOutline, o => {
                return o.outlineType === item.outlineType && o.outlineCatalog === item.outlineCatalog;
            })
            // sourceItem =
        }
        let res = compariseOutline(item, sourceItem);
        result.push(res);
    });
    return result;
}

/**
 * @description 两个大纲章节条款内容比对
 * @param {Object} sourceItem
 * @param {Object} targetItem
 */
export function compariseChapter(sourceItem = {}, targetItem = {}) {
    // 源章节文字内容
    let sourceText = sourceItem.content && sourceItem.content.contentText ? sourceItem.content.contentText : '';
    // 目标章节文字内容
    let targetText = targetItem.content && targetItem.content.contentText ? targetItem.content.contentText : '';
    // 比对内容
    let comparisedItem = diffTextContent(sourceText||sourceItem.outlineTitle||'', targetText||targetItem.outlineTitle||'');
    // 输出结果
    return {
        sourceItem,
        targetItem,
        comparised: similarComparise(comparisedItem, sourceText||sourceItem.outlineTitle||'')
    };
}

/**
 * @description 递归大纲章节条款内容比对
 * @param {Array} sourceOutline
 * @param {Array} targetOutline
 * @returns 输出一维数组
 */
export function compariseReduceOutline(sourceOutline = [], targetOutline = []) {
    var results = [];
    const setItemList = (sourceList=[], targetList=[]) => {
        var allLens = targetList.length ? Math.abs(sourceList.length - targetList.length) + sourceList.length : sourceList.length;
        for (let i=0; i<allLens; i++) {
            let sourceItem = sourceList[i] || {};
            let targetItem = targetList[i] || {};
            let data = compariseChapter(sourceItem, targetItem);
            data.id = sourceItem.outlineId || targetItem.outlineId;
            if (data.id) {
                results.push(data);
                // debugger
                if ((sourceItem.children && sourceItem.children.length) || (targetItem.children && targetItem.children.length)) {
                    setItemList(sourceItem.children||[], targetItem.children||[])
                }
            }
        }
    }
    setItemList(sourceOutline, targetOutline);
    return results;
}

/**
 * @description 根据大纲章节条款内容比对
 * @param {Array} sourceOutline
 * @param {Array} targetOutline
 */
export function compariseOutlineList(sourceOutline = [], targetOutline = []) {
    var allLens = targetOutline.length ? Math.abs(sourceOutline.length - targetOutline.length) + sourceOutline.length : sourceOutline.length;
    var results = [];
    for (let i=0; i<allLens; i++) {
        let sourceItem = sourceOutline[i] || {};
        let targetItem = targetOutline[i] || {};
        let data = compariseChapter(sourceItem, targetItem);
        data.id = sourceItem.outlineId || targetItem.outlineId;
        if ((sourceItem.children && sourceItem.children.length) || (targetItem.children && targetItem.children.length)) {
            data.children = compariseReduceOutline(sourceItem.children||[], targetItem.children||[]);
        }
        results.push(data)
    }
    return results;
}
