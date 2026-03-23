/**
 * ===================================================================================================================
 * @module
 * @desc 表格元素处理模块
 * @author sam 2022-01-07
 * ===================================================================================================================
 */
"use strict";
import $global from "@/utils/global";
import { remove } from "good-storage";
// import { mergeWith } from "lodash";
const sysRowHeight = 28;
export default {
    editor: null,
    vm: {},
    reseting: false,
    tableCacheList: [],
    updateVm(vm) {
        this.vm = vm;
    },
    /**
     * @description 获取当前编辑器实例
     */
    getActiveEditor() {
        var editors = window.tinyMCE.editors && window.tinyMCE.editors.length ? window.tinyMCE.editors : [];
        for (let i = 0; i < editors.length; i++) {
            var editor = editors[i];
            if (editors.id === `tinymce-editor-${this.vm.editorId || ""}`) {
                return editors[i];
            }
        }
        return this.vm.editor || window.tinyMCE.activeEditor;
    },
    averageCols(editor, currNode) {
        let tableNode = editor.dom.getParent(currNode, "table");
        try {
            tableNode = this.setTableColGroup(tableNode);
            const colgroup = tableNode.querySelector("colgroup");
            const cols = Array.from(colgroup.childNodes);
            const width = (100 / cols.length).toFixed(2) + "%";
            cols.forEach((col) => {
                col.style.width = width;
            });
        } catch (error) {
            console.log("average col width errror:", error);
        }
    },
    // 表格单元重置colgroup
    setTableColGroup(tableNode) {
        if (!tableNode.querySelector("colgroup")) {
            var cols = [],
                allWidth = 0;
            var colgroup = document.createElement("colgroup");
            var tbody = tableNode.querySelector("tbody");
            if (tbody) {
                var trs = Array.from(tbody.querySelectorAll("tr"));
                for (let tr of trs) {
                    let tds = Array.from(tr.querySelectorAll("td"));
                    for (let i = 0; i < tds.length; i++) {
                        let td = tds[i];
                        if (td.colSpan === 1 && !_.find(cols, { index: i })) {
                            allWidth += td.offsetWidth;
                            cols.push({ index: i, width: td.offsetWidth });
                        }
                    }
                }
            }
            for (let i = 0; i < cols.length; i++) {
                let item = cols[i];
                let colEle = document.createElement("col");
                let pw = parseFloat(((item.width / allWidth) * 100).toFixed(3)) + "%";
                colEle.setAttribute("style", `width:${pw};`);
                colgroup.appendChild(colEle);
            }
            $global.prependChild(colgroup, tableNode);
        }
        return tableNode;
    },
    // 单元格元素合并处理
    mergeElement(currNode) {
        const mergeNextNode = (node) => {
            let nextNode = node.nextSibling;
            if (nextNode) {
                if (nextNode.nodeName === "P") {
                    mergeNextNode(nextNode);
                } else {
                    node.appendChild(nextNode);
                    mergeNextNode(node);
                }
            }
        };
        mergeNextNode(currNode);
    },
    /**
     * @description 表格矩阵
     * @param {Element} table
     * @param {Boolean} isBody 是否为表主体s
     */
    matrixTable(table = null, isBody = false, outData = false) {
        // 表格主体总的行数
        const tbody = table.querySelector("tbody");
        const rows = isBody ? tbody.rows : table.rows;
        const totalRows = rows.length;
        // 单元列总数(按第一行计算)
        let totalCols = 0;
        if (totalRows > 0) {
            for (let i = 0; i < rows[0].cells.length; i++) {
                totalCols += rows[0].cells[i].colSpan;
            }
        }
        this.normalizeTableColumns(table);
        // 汇总所有单元格
        const cells = [];
        Array.from(rows).forEach((row, rowI) => {
            // console.info("row", rowI, "col", Array.from(row.cells).length);
            // console.info(row.cells);
            let colCount = 0;
            Array.from(row.cells).forEach((cell, cellIndex) => {
                // console.log(cell.attributes.includes("colspan"));
                colCount += cell.colSpan || 1;
                // if (cellIndex === Array.from(row.cells).length - 1) {
                //     console.log("cell.colCount", colCount);
                // }
                cells.push({
                    rowRange: {},
                    colRange: {},
                    el: cell,
                });
            });
        });
        // 创建矩阵
        const helperMatrix = [];
        for (let r = 0; r < totalRows; r++) {
            const row = [];
            for (let c = 0; c < totalCols; c++) {
                row.push({ cell: null });
            }
            helperMatrix.push(row);
        }
        // 构造矩阵
        let cursor = 0;
        for (let r = 0; r < totalRows; r++) {
            for (let c = 0; c < totalCols; c++) {
                if (helperMatrix[r] && helperMatrix[r][c] && helperMatrix[r][c].cell) {
                    continue;
                }
                const cell = cells[cursor++];
                if (cell) {
                    const { rowSpan, colSpan } = cell.el;
                    cell.rowRange = { from: r, to: r };
                    cell.colRange = { from: c, to: c };
                    // 定义宽度高度
                    cell.width = cell.el.offsetWidth;
                    cell.height = cell.el.offsetHeight;
                    for (let y = r; y < r + rowSpan; y++) {
                        for (let x = c; x < c + colSpan; x++) {
                            if (helperMatrix[y] && helperMatrix[y][x]) {
                                helperMatrix[y][x].cell = cell;
                            }
                            cell.colRange.to = x;
                            cell.rowRange.to = y;
                        }
                    }
                    // 合并单元列,
                    if (cell.colRange.to > cell.colRange.from) {
                        // 按colspan后面单元格的元素计算
                        for (let j = cell.colRange.from + 1; j <= cell.colRange.to; j++) {
                            if (helperMatrix[r] && helperMatrix[r][j]) {
                                let colMatrix = helperMatrix[r][j];
                                colMatrix.hide = true;
                            }
                        }
                    }
                    // 合并单元行
                    if (cell.rowRange.to > cell.rowRange.from) {
                        // 按rowspan下面单元行的元素计算
                        for (let j = cell.rowRange.from + 1; j <= cell.rowRange.to; j++) {
                            if (helperMatrix[j] && helperMatrix[j][c]) {
                                let rowColMatrix = helperMatrix[j][c];
                                rowColMatrix.continue = true;
                            }
                            if (cell.colRange.to > cell.colRange.from) {
                                for (let n = cell.colRange.from + 1; n <= cell.colRange.to; n++) {
                                    if (helperMatrix[j] && helperMatrix[j][n]) {
                                        let colMatrix = helperMatrix[j][n];
                                        colMatrix.hide = true;
                                    }
                                }
                            }
                        }
                    }
                    // 单元格内容
                    if (outData) {
                        cell.content = cell.el.innerHTML;
                    }
                }
            }
        }
        return helperMatrix;
    },
    /**
     * @description 获取当前编辑器的配置
     * @param {Object} activeEditor
     */
    countOccurrences(arr, value) {
        let count = 0;
        // 遍历每个子数组
        arr.forEach((subArray) => {
            // 对每个子数组进行计数
            subArray.forEach((item) => {
                if (item === value) {
                    count++; // 找到目标值时，计数增加
                }
            });
        });
        return count;
    },
    normalizeTableColumns(table) {
        // console.log("table", typeof table);
        let maxColumns = 0;
        const colgroups = table.getElementsByTagName("colgroup");
        // 使用 colgroup 来确定最大列数
        let removeEmptyColsIndex = [];
        if (colgroups.length > 0) {
            const cols = colgroups[0].getElementsByTagName("col");
            // console.log(typeof cols);
            // 遍历每个 col 元素
            Array.from(cols).forEach((col, index) => {
                const width = window.getComputedStyle(col).width;
                // 如果宽度小于 7px，则删除该 col
                if (parseFloat(width) < 7) {
                    col.remove();
                    removeEmptyColsIndex.push(index);
                }
            });
            // console.log("cols", cols);
            maxColumns = cols.length;
        }
        // console.log(`Maximum columns based on colgroup: ${maxColumns}`);
        const rows = table.rows;
        let rowSpans = [];
        // 调整每一行的列数
        for (let i = 0; i < rows.length; i++) {
            let currentColumns = 0;
            if (rows[i].classList.contains("hide")) {
                continue;
            }
            const cells = rows[i].cells;
            // 处理前面行的 rowspan
            for (let j = 0; j < rowSpans.length; j++) {
                if (rowSpans[j] > 0) {
                    currentColumns++;
                    rowSpans[j]--;
                }
            }
            // 跟随colgroups处理colSpan
            if (removeEmptyColsIndex.length) {
                for (let k = cells.length - 1; k >= 0; k--) {
                    const cell = cells[k];
                    const dataIndex = cell.getAttribute("data-index");
                    const colSpan = cell.colSpan || 1;
                    if (removeEmptyColsIndex.includes(+dataIndex) && colSpan > 1) {
                        // 如果 colSpan 大于 1，则减小1个colSpan
                        cell.colSpan = colSpan - 1;
                    }
                }
            }
            // 计算当前行的实际列数，考虑 colspan
            for (let j = 0; j < cells.length; j++) {
                const colSpan = cells[j].colSpan || 1;
                const rowSpan = cells[j].rowSpan || 1;
                currentColumns += colSpan;
                // 更新 rowSpans 数组
                if (rowSpan > 1) {
                    for (let k = 0; k < colSpan; k++) {
                        rowSpans.push(rowSpan - 1);
                    }
                }
            }
            // console.log(`Row ${i + 1}: Current columns = ${currentColumns}`);
            if (currentColumns > maxColumns) {
                // 如果列数过多，调整 colspan
                let excessColumns = currentColumns - maxColumns;
                for (let j = cells.length - 1; j >= 0 && excessColumns > 0; j--) {
                    const colSpan = cells[j].colSpan || 1;
                    if (colSpan > 1) {
                        const reduction = Math.min(colSpan - 1, excessColumns);
                        cells[j].colSpan = colSpan - reduction;
                        excessColumns -= reduction;
                    }
                }
            }
            // 如果列数仍然不足，添加新单元格
            while (currentColumns < maxColumns) {
                const newCell = rows[i].insertCell();
                newCell.innerHTML = "&nbsp;";
                currentColumns++;
            }
            // 移除已经结束的 rowspan
            rowSpans = rowSpans.filter((span) => span > 0);
        }
        // console.log("Table normalization complete");
    },
    fixedTable(tableNode) {
        // debugger
        let trs = tableNode.querySelectorAll("tr");
        // 计算第一行的列数
        let FirstColCount = 0;
        let rowSpanOccupiedCols = {}; // 存储已被 rowSpan 占用的列，避免重复插入
        // 计算第一行的列数，并标记被 rowSpan 占用的列
        trs[0].querySelectorAll("td").forEach((td, tdIndex) => {
            let colSpan = parseInt(td.colSpan) || 1;
            FirstColCount += colSpan; // 累加当前单元格的列数
            let rowSpan = parseInt(td.rowSpan) || 1;
            if (rowSpan > 1) {
                // 标记 `rowspan` 占用的列
                for (let i = 1; i < rowSpan; i++) {
                    rowSpanOccupiedCols?.[tdIndex] ? rowSpanOccupiedCols[tdIndex].push(0 + i) : (
                        rowSpanOccupiedCols[tdIndex] = [0 + i]); // 标记这个列已被占用
                }
            }
        });
        // console.log("FirstColCount", FirstColCount);
        console.log("rowSpanOccupiedCols", rowSpanOccupiedCols);
        // debugger;
        // 遍历后续行，调整每行的列数
        trs.forEach((tr, trIndex) => {
            // debugger;
            if (trIndex === 0) return;
            let tds = tr.querySelectorAll("td");
            let currentColCount = 0;
            // 记录实际当前列坐标，index需要加上被占用的格子
            let tdIndex = 0;
            // 计算当前行的列数，跳过已被 `rowspan` 占用的列
            tds.forEach((td, virtualTdIndex) => {
                const isOccupied = rowSpanOccupiedCols?.[tdIndex] ? rowSpanOccupiedCols?.[tdIndex]
                    .includes(trIndex) : false;
                if (isOccupied) {
                    tdIndex += 1;
                }
                let colSpan = parseInt(td.colSpan) || 1;
                currentColCount += colSpan; // 每个单元格的 colspan 直接加到列数
                let rowSpan = parseInt(td.rowSpan) || 1;
                console.log(`处理第 ${trIndex} 行, 列 ${tdIndex}, rowSpan: ${rowSpan}`);
                if (rowSpan > 1) {
                    // 0在首行算过了
                    // 如果单元格的 rowSpan 大于 1，标记其跨越的列
                    for (let i = 0; i < rowSpan; i++) {
                        // console.log("index + i", index + i, trIndex);
                        // 先考虑是否被rowspan占用
                        const isOccupied = rowSpanOccupiedCols?.[tdIndex] ? rowSpanOccupiedCols?.[
                            tdIndex
                        ].includes(trIndex) : false;
                        rowSpanOccupiedCols?.[tdIndex] ? rowSpanOccupiedCols[tdIndex].push(trIndex +
                            i) : (rowSpanOccupiedCols[tdIndex] = [trIndex + i]);
                    }
                }
            });
            console.log("rowSpanOccupiedCols", rowSpanOccupiedCols);
            console.log(`当前行总列数: ${currentColCount}`);
            console.log(`第一行列数: ${FirstColCount}`);
            const zhtdCount = this.countOccurrences(Object.values(rowSpanOccupiedCols));
            console.log("zhtdCount", zhtdCount, "当前行数:", trIndex);
            // 处理当前行的列数与第一行的列数不一致的情况
            if (currentColCount < FirstColCount) {
                // 插入缺少的单元格
                let numberOfTd = FirstColCount - currentColCount;
                let insertedTds = 0;
                let currentColIndex = 0;
                console.log(insertedTds, numberOfTd);
                while (insertedTds < numberOfTd) {
                    // 如果没有剩余需要插入的单元格，跳出循环
                    if (insertedTds === numberOfTd) {
                        break;
                    }
                    // // 找到下一个空缺位置
                    // while (
                    //     rowSpanOccupiedCols
                    //         .get(currentColIndex)
                    //         ?.includes(trIndex)
                    // ) {
                    //     currentColIndex++; // 如果该列被占用，跳过它
                    //     insertedTds++; // 跳过被占用的列，也需要递增插入的单元格数量
                    //     console.log("currentColIndex", currentColIndex);
                    //     if (insertedTds === numberOfTd) {
                    //         break;
                    //     }
                    // }
                    // 如果已经插入足够的单元格，则跳出
                    if (insertedTds === numberOfTd) {
                        break;
                    }
                    //  console.log("currentColIndex", currentColIndex);
                    let td = document.createElement("td");
                    td.textContent = "新单元格 " + (insertedTds + 1);
                    tr.appendChild(td);
                    insertedTds++;
                    currentColIndex++; // 更新列索引
                }
            } else if (currentColCount > FirstColCount) {
                // 删除多余的单元格
                let tdsToRemove = currentColCount - FirstColCount;
                for (let i = 0; i < tdsToRemove; i++) {
                    tr.removeChild(tr.lastChild); // 删除最后一个单元格
                }
            }
        });
    },
    /**
     * @description 获取当前编辑器的配置
     * @param {Object} activeEditor
     */
    getEditorSetting(activeEditor = null) {
        activeEditor = activeEditor || this.getActiveEditor();
        return activeEditor.settings.doc_config || {};
    },
    /**
     * @description 重置表格矩阵数据
     * @param {Object} table
     */
    resetTableCacheData(table = null) {
        var martixData = this.matrixTable(table, true);
        var tableTrs = Array.from(table.querySelectorAll("tbody>tr"));
        martixData.forEach((row, rowIndex) => {
            let tr = tableTrs[rowIndex];
            if (tr && !$global.hasClass(tr, "hide")) {
                row.forEach((col, colIndex) => {
                    let td = tr.querySelector(`td[data-index="${colIndex}"]`);
                    if (td) {
                        col.html = td.innerHTML;
                    }
                });
            }
        });
        return martixData;
    },
    /**
     * @description 按行分解表格为2个表
     * @param {Object} editor
     * @param {Element} currNode
     */
    separateTableByRow(editor = null, currNode = null) {
        var trNode = editor.dom.getParent(currNode, "tr");
        var tableNode = editor.dom.getParent(currNode, "table");
        var relationTables = this.getRelationTable(editor, tableNode);
        var tFooters = Array.from(tableNode.querySelectorAll("tr.foot"));
        if (relationTables.length) {
            editor.windowManager.alert("当前表存在跨页续表，不可拆分！");
            return false;
        } else if (tFooters.length > 0) {
            editor.windowManager.alert("当前表存在表脚注，不可拆分！");
            return false;
        } else {
            var martixData = this.matrixTable(tableNode, true);
            const getRowRange = (rowIndex, colIndex, count) => {
                count += 1;
                if (martixData[rowIndex]) {
                    let col = martixData[rowIndex][colIndex];
                    if (col.continue) {
                        return getRowRange(rowIndex + 1, colIndex, count);
                    }
                }
                return count;
            };
            var tbody = tableNode.querySelector("tbody");
            var trIndex = editor.dom.nodeIndex(trNode);
            var cloneTable = tableNode.cloneNode(true);
            var cloneTbody = cloneTable.querySelector("tbody");
            cloneTbody.innerHTML = "";
            var trs = Array.from(tbody.querySelectorAll('tr'));
            // var newArr = _.cloneDeep(martixData);
            martixData.forEach((row, rowIndex) => {
                let tr = trs[rowIndex];
                let tds = Array.from(tr.childNodes);
                row.forEach((col, colIndex) => {
                    let cell = col.cell;
                    if (rowIndex < trIndex) {
                        if (cell.rowRange.from < cell.rowRange.to) {
                            // 当前行列处理
                            let rowSpan = trIndex - cell.rowRange.from;
                            if (rowSpan > 1) {
                                cell.el.rowSpan = rowSpan;
                            } else {
                                cell.el.removeAttribute("rowspan");
                            }
                        }
                        cloneTbody.appendChild(tr);
                    } else if (rowIndex === trIndex && col.continue) {
                        let newTd = editor.dom.create("td");
                        let rowspanCount = getRowRange(trIndex + 1, colIndex, 0);
                        if (rowspanCount > 1) {
                            newTd.rowSpan = rowspanCount;
                        }
                        if (colIndex === 0) {
                            $global.prependChild(newTd, tr);
                            tds.unshift(newTd);
                        } else if (colIndex === row.length - 1) {
                            tr.appendChild(newTd);
                            tds.push(newTd);
                        } else {
                            editor.dom.insertAfter(newTd, tds[colIndex - 1]);
                            tds.splice(colIndex - 1, 0, newTd);
                        }
                    }
                });
            });
            tableNode.style.height = "auto";
            cloneTable.style.height = "auto";
            cloneTable.dataset.id = $global.guid();
            tableNode.parentNode.insertBefore(cloneTable, tableNode);
            this.setTdIndex(tableNode);
            this.setTdIndex(cloneTable);
            this.resetTableTitleByNumber(editor);
            editor.undoManager.add();
        }
    },
    /**
     * @description 清除页面内所有表格高度
     * @param {Element} block
     */
    clearTableHeight(block = null, clearChild) {
        var tableNodes = Array.from(block.querySelectorAll("table"));
        tableNodes.forEach((table) => {
            table.style.height = null;
        });
    },
    clearRowsHeight(table) {
        let rows = Array.from(table.rows);
        rows.forEach((row) => {
            row.style.height = null;
            let cells = Array.from(row.cells);
            cells.forEach((cell) => {
                cell.style.height = null;
            });
        });
    },
    /**
     * @description 清除表格单元行隐藏样式
     * @param {Element} table
     */
    clearTrHide(table = null) {
        var trs = Array.from(table.querySelectorAll("tbody>tr"));
        trs.forEach((tr) => {
            $global.removeClass(tr, "hide");
        });
    },
    /**
     * @description 按列分解表格为2个表
     * @param {Object} editor
     * @param {Element} currNode
     */
    separateTableByCol(editor = null, currNode = null) {
        var tdNode = editor.dom.getParent(currNode, 'td');
        // var trNode = editor.dom.getParent(currNode, 'tr');
        var tableNode = editor.dom.getParent(currNode, 'table');
        var relationTables = this.getRelationTable(editor, tableNode);
        if (relationTables.length) {
            editor.windowManager.alert("当前表存在跨页续表，不可拆分！");
        } else {
            var tbody = tableNode.querySelector("tbody");
            var colGroup = tableNode.querySelector("colgroup");
            // debugger
            var cloneTable = tableNode.cloneNode(true);
            var cloneTbody = cloneTable.querySelector("tbody");
            var cloneColGroup = cloneTable.querySelector("colgroup");
            cloneTbody.innerHTML = "";
            var tdIndex = tdNode.dataset && tdNode.dataset.index ? parseInt(tdNode.dataset.index) : undefined;
            // console.log('tdIndex=>', tdIndex)
            if (tdIndex !== undefined) {
                colGroup.childNodes.forEach((col, i) => {
                    if (i < tdIndex) {
                        col.remove();
                    }
                });
                cloneColGroup.childNodes.forEach((col, i) => {
                    if (i >= tdIndex) {
                        col.remove();
                    }
                });
                var trs = Array.from(tbody.querySelectorAll("tr"));
                trs.forEach((tr) => {
                    let newTr = tr.cloneNode();
                    let tds = Array.from(tr.childNodes);
                    tds.forEach((td, i) => {
                        if (i < tdIndex) {
                            newTr.appendChild(td);
                        } else {}
                    });
                    cloneTbody.appendChild(newTr);
                });
                tableNode.style.height = "auto";
                cloneTable.style.height = "auto";
                tableNode.parentNode.insertBefore(cloneTable, tableNode);
                editor.undoManager.add();
            }
        }
    },
    /**
     * @description 拆分整个表格
     * @param {Element} tableNode
     * @param {Element} cloneTable
     */
    splitWholeTable(tableNode = null, cloneTable = null) {
        debugger
        var tableTrs = tableNode.querySelectorAll("tbody>tr:not(.hide)");
        if (cloneTable) {
            /* tableTrs.forEach(tr => {
                $global.prependChild(tr, cloneTbody);
            }); */
            var cloneTbody = cloneTable.querySelector("tbody");
            tableTrs = Array.from(cloneTbody.querySelectorAll("tbody>tr.hide"));
            tableTrs.forEach((tr) => {
                $global.removeClass(tr, "hide");
                // tr.remove();
            });
            // 原始表格删除，经续表置为主表
            if (!tableNode.dataset.parentid) {
                $global.removeClass(cloneTable, "xu");
                cloneTable.removeAttribute("data-parentid");
                cloneTable.dataset.id = tableNode.dataset.id;
            }
            tableNode.remove();
            var titleEle = cloneTable.querySelector(".table-title");
            if (titleEle) {
                $global.removeClass(titleEle, "txu");
            }
            return null;
        } else {
            return tableNode;
        }
    },
    /**
     * @description 拆分表格单元行
     * @param {Element} tableNode 当前表格元素
     * @param {Int} posTop 偏移位
     * @param {Boolean} isMerge 是否为合并文档模式
     */
    splitTable(tableNode = null, posTop = 0, isMerge = false) {
        var editor = this.getActiveEditor();
        var block = editor.dom.getParent(tableNode, ".info-block");
        // var blockStyle = window.getComputedStyle(block);
        // var blockHeight = parseFloat(blockStyle.height) - parseFloat(blockStyle.paddingTop) - parseFloat(blockStyle.paddingBottom);
        // var leastHeight = 0;
        tableNode.dataset.id = tableNode.dataset.id || $global.guid();
        // 表格数据缓存
        this.resetTableCacheData(tableNode);
        try {
            var cloneTable;
            if (block.nextElementSibling) {
                cloneTable = block.nextElementSibling.querySelector(`table[data-parentid="${tableNode.dataset.id}"]`) ||
                    block.nextElementSibling.querySelector(`table[data-parentid="${tableNode.dataset.parentid}"]`);
            }
            var eleTop = 0,
                isWhole = false;
            // 判断整个Table是否超限
            var tableTitle = tableNode.querySelector(".table-title");
            // 表标题超限
            if (tableTitle) {
                eleTop = editor.dom.getPos(tableTitle).y - editor.dom.getPos(block).y;
                isWhole = eleTop + tableTitle.offsetHeight > posTop;
                if (isWhole) {
                    return this.splitWholeTable(tableNode, cloneTable);
                }
            }
            // 表附加信息超限
            var tableDescription = tableNode.querySelector(".table-description");
            if (!isWhole && tableDescription) {
                eleTop = editor.dom.getPos(tableDescription).y - editor.dom.getPos(block).y;
                isWhole = eleTop + tableDescription.offsetHeight > posTop;
                if (isWhole) {
                    return this.splitWholeTable(tableNode, cloneTable);
                }
            }
            // 表头超限
            var tableHeader = tableNode.querySelector("thead");
            if (!isWhole && tableHeader) {
                eleTop = editor.dom.getPos(tableHeader).y - editor.dom.getPos(block).y;
                let tableHeaderHeight = tableHeader.offsetHeight + 2;
                isWhole = eleTop + tableHeaderHeight > posTop;
                if (isWhole) {
                    return this.splitWholeTable(tableNode, cloneTable);
                }
            }
            // 如果第一个单元行超限
            if (!isWhole) {
                var firstTr = tableNode.querySelector("tr:not(.hide)");
                eleTop = editor.dom.getPos(firstTr).y - editor.dom.getPos(block).y;
                var firstTrHeight = firstTr.offsetHeight; //this.getRealTrHeight(firstTr);
                isWhole = eleTop + firstTrHeight > posTop;
                if (isWhole) {
                    return this.splitWholeTable(tableNode, cloneTable, true);
                }
            }
            // debugger
            // 表内容超限;按TR元素分析，超限行设置为隐藏
            var tableBody = tableNode.querySelector("tbody");
            var tableTrs = Array.from(tableBody.querySelectorAll("tr:not(.hide)"));
            // 声明超限的单元行下标
            var isLimit = -1;
            tableTrs.forEach((tr) => {
                let trTop = editor.dom.getPos(tr).y - editor.dom.getPos(block).y;
                let trIndex = editor.dom.nodeIndex(tr);
                let trHeight = tr.offsetHeight; //this.getRealTrHeight(tr);
                if (!!~isLimit || trTop + trHeight > posTop) {
                    $global.addClass(tr, "hide");
                    if (!~isLimit) {
                        isLimit = trIndex;
                    }
                }
            });
            // 如果存在CLONE表，则定义超限的单元行样式
            if (!isWhole && cloneTable) {
                var cloneTbody = cloneTable.querySelector("tbody");
                cloneTbody.innerHTML = tableBody.innerHTML;
                Array.from(cloneTbody.querySelectorAll("tr")).forEach((tr) => {
                    let trIndex = editor.dom.nodeIndex(tr);
                    if (isLimit && trIndex >= isLimit) {
                        $global.removeClass(tr, "hide");
                    } else {
                        $global.addClass(tr, "hide");
                    }
                });
                return null;
            }
            // CLONE表（续表）
            cloneTable = tableNode.cloneNode(true);
            cloneTable.dataset.id = $global.guid();
            cloneTable.dataset.parentid = tableNode.dataset.parentid || tableNode.dataset.id;
            $global.addClass(cloneTable, "xu");
            tableTitle = cloneTable.querySelector(".table-title");
            if (tableTitle) {
                $global.addClass(tableTitle, "txu");
            }
            // 处理CLONE表的行合并
            var cloneTrs = Array.from(cloneTable.querySelectorAll(":scope>tbody>tr"));
            cloneTrs.forEach((tr, index) => {
                let trIndex = editor.dom.nodeIndex(tr);
                if (trIndex >= isLimit) {
                    $global.removeClass(tr, "hide");
                } else {
                    $global.addClass(tr, "hide");
                }
            });
            return cloneTable;
        } catch (error) {
            console.error("splitTable error:", error);
            return null;
        }
    },
    clearTrHeight(table = null) {
        var trNodes = Array.from(table.querySelectorAll("tr"));
        trNodes.forEach((tr) => {
            let height = tr.style.height;
            if (height && parseInt(height, 10) === 0) {
                // tr.style.height = null;
                tr.style.removeProperty('height');
            }
        });
    },
    /**
     * @description 拆分表格单元行
     * @param {Int} index 下标位
     * @param {Element} table
     */
    splitTableByTr(index = 0, table = null) {
        var editor = this.getActiveEditor();
        // var editorSetting = this.getEditorSetting();
        table.dataset.id = table.dataset.id || $global.guid();
        var parentId = table.dataset.parentid || table.dataset.id;
        var tbody = table.querySelector("tbody");
        var cloneTable, cloneTbody;
        var currBlock = editor.dom.getParent(table, ".info-block");
        var nextBlock = currBlock.nextElementSibling;
        if (nextBlock) {
            // 如果已存在续表对象的
            cloneTable = nextBlock.querySelector(`table[data-parentid="${parentId}"]`);
            if (cloneTable) {
                cloneTbody = cloneTable.querySelector("tbody");
            }
        }
        // 设置当前表格的隐藏行
        var trs = Array.from(tbody.querySelectorAll("tr"));
        trs.forEach((tr, i) => {
            if (i >= index) {
                $global.addClass(tr, "hide");
            }
        });
        if (cloneTable) {
            cloneTable = this.syncTableContent(table, cloneTable);
        } else {
            cloneTable = table.cloneNode(true);
            cloneTbody = cloneTable.querySelector("tbody");
            Array.from(cloneTbody.querySelectorAll("tr")).forEach((tr, i) => {
                if (i >= index) {
                    $global.removeClass(tr, "hide");
                } else {
                    $global.addClass(tr, "hide");
                }
            });
            cloneTable.dataset.id = $global.guid();
            cloneTable.dataset.parentid = parentId;
            $global.addClass(cloneTable, "xu");
            if (cloneTable.querySelector(".table-title")) {
                $global.addClass(cloneTable.querySelector(".table-title"), "txu");
            }
        }
        // 定义单元格索引
        if (cloneTable) {
            this.setTdIndex(cloneTable);
        }
        return cloneTable;
    },
    /**
     * @description 同步表格内容
     * @param{Element} sourceTable 源表格
     * @param{Element} currTable 当前需要处理的表格
     */
    syncTableContent(sourceTable = null, currTable = null, isFirst = false) {
        var editor = this.getActiveEditor();
        var editorSetting = this.getEditorSetting(editor);
        // 原始行，注意，如有隐藏行则继续保留属性
        var isClone = $global.hasClass(currTable, "xu");
        var block = editor.dom.getParent(currTable, ".info-block");
        var pageContainer = editor.dom.getParent(currTable, ".page-container");
        var endHideIndex = 0;
        if (isClone) {
            // 重新定义来源表，须为主表
            sourceTable = pageContainer.querySelector(`table[data-id="${currTable.dataset.parentid}"]`);
            if (block && block.previousElementSibling) {
                let prevCloneTable = block.previousElementSibling.querySelector(
                    `table[data-parentid="${currTable.dataset.parentid}"]`);
                if (prevCloneTable) {
                    let prevTrs = Array.from(prevCloneTable.querySelectorAll("tbody>tr:not(.hide)"));
                    let lastTr = prevTrs[prevTrs.length - 1];
                    endHideIndex = editor.dom.nodeIndex(lastTr);
                    let subLens = currTable.querySelectorAll("tbody>tr").length - sourceTable.querySelectorAll(
                        "tbody>tr").length;
                    if (subLens) {
                        endHideIndex += subLens;
                    }
                }
            }
        }
        var nextSameTable = null;
        if (block && block.nextElementSibling) {
            nextSameTable = block.nextElementSibling.querySelector(`table[data-parentid="${currTable.dataset.id}"]`) ||
                block.nextElementSibling.querySelector(`table[data-parentid="${currTable.dataset.parentid}"]`);
        }
        // debugger
        // 定义当前处理的表格单元行原始属性
        var trAttr = [],
            hideLens = 0;
        // 置入临时数据集,记录隐藏的单元行
        var trs = Array.from(sourceTable.querySelectorAll("tbody>tr"));
        trs.forEach((tr, i) => {
            let obj = {
                index: i,
                hide: $global.hasClass(tr, "hide"),
            };
            trAttr.push(obj);
        });
        // 定义一个缓存的Table,处理原始表格内容
        var cloneTable = editor.dom.create("table", {}, sourceTable.innerHTML);
        var trs = Array.from(cloneTable.querySelectorAll("tbody>tr"));
        var rowIndex = 0,
            trIndex = 0;
        trs.forEach((tr, i) => {
            let row = trAttr[trIndex];
            if (row) {
                if (row.hide) {
                    $global.removeClass(tr, "hide");
                } else {
                    $global.addClass(tr, "hide");
                }
                trIndex++;
            } else {
                $global.addClass(tr, "hide");
            }
            // $global.toggleClass(tr, 'hide');
            if ($global.hasClass(tr, "hide")) {
                hideLens++;
            }
        });
        // 如果表主体单元行为全部隐藏的，则直接删除表
        if (trs.length === hideLens) {
            currTable.remove();
            cloneTable.remove();
            return null;
        } else {
            currTable.innerHTML = cloneTable.innerHTML;
            currTable.setAttribute("style", sourceTable.getAttribute("style"));
            // 如果配置中不需要续表表头的
            if (isClone && editorSetting.notTableHeader) {
                let tableHeadTrs = Array.from(currTable.querySelectorAll("thead>tr"));
                tableHeadTrs.forEach((tr) => {
                    $global.addClass(tr, "hide");
                });
            }
            // 表格的注|脚注 仅显示最后一个表格显示，其他的都隐藏
            let tableZhu = Array.from(currTable.querySelectorAll("tr.zhu,tr.foot"));
            tableZhu.forEach((zhuNode) => {
                if (nextSameTable) {
                    $global.addClass(zhuNode, "hide");
                }
            });
            let tableTitle = currTable.querySelector(".table-title");
            if (currTable.dataset.parentid) {
                $global.addClass(currTable, "xu");
                if (tableTitle) {
                    $global.addClass(tableTitle, "txu");
                }
            } else {
                $global.removeClass(currTable, "xu");
                if (tableTitle) {
                    $global.removeClass(tableTitle, "txu");
                }
            }
            // 如果定义了最后隐藏行的下标值则处理隐藏行
            if (endHideIndex) {
                trs = Array.from(currTable.querySelectorAll("tbody>tr"));
                trs.forEach((tr, i) => {
                    if (i <= endHideIndex) {
                        $global.addClass(tr, "hide");
                    } else {
                        $global.removeClass(tr, "hide");
                    }
                });
            }
            // 表格是否超出页面，超出则处理隐藏行
            this.setHideTrNode(editor, block, currTable);
        }
        cloneTable.remove();
        return currTable;
    },
    /**
     * @description 设置表格的行隐藏
     * @param {Object} editor
     * @param {Element} pageBlock 页面
     * @param {Element} tableNode 当前表格
     */
    async setHideTrNode(editor = null, pageBlock = null, tableNode = null) {
        var blockStyle = window.getComputedStyle(pageBlock);
        // 页面的实际空间高度
        var spaceHeight = Math.ceil(parseFloat(blockStyle.height) - parseFloat(blockStyle.paddingBottom)) - 2;
        // 如果页面有脚注则再减去脚注的高度
        var footnote = pageBlock.querySelector(".footnote");
        if (footnote) {
            spaceHeight -= footnote.offsetHeight + 10;
        }
        // 获取超出页面的子元素
        var lastNode = null;
        for (let i = 0; i < pageBlock.childNodes.length; i++) {
            let ele = pageBlock.childNodes[i];
            if (!["#text", "BR"].includes(ele.nodeName)) {
                let eleStyle = window.getComputedStyle(ele);
                let eleHeight = this.getELeRealHeight(ele, eleStyle, blockStyle, pageBlock);
                if (ele.nodeName === "TABLE") {
                    eleHeight -= 2;
                }
                if (!$global.hasClass(ele, "footnote") && !/^(#text)$/.test(ele.nodeName) && !ele.dataset
                    .mceCaret && ele.offsetTop + eleHeight > spaceHeight) {
                    lastNode = ele;
                    break;
                }
            }
        }
        if (lastNode && lastNode === tableNode) {
            var nodeStyle = window.getComputedStyle(lastNode);
            var childNodes = Array.from(tableNode.querySelectorAll("tbody>tr:not(.hide)"));
            for (let i = 0; i < childNodes.length; i++) {
                let ele = childNodes[i];
                // debugger
                let offsetTop = Math.ceil(editor.dom.getPos(ele).y - editor.dom.getPos(pageBlock).y);
                let style = window.getComputedStyle(ele);
                let lineHeight = parseInt(style.lineHeight);
                let eleHeight = this.getELeRealHeight(ele, style, nodeStyle, pageBlock);
                if (offsetTop + lineHeight > spaceHeight) {
                    $global.addClass(ele, "hide");
                }
            }
        }
        return lastNode;
    },
    /**
     * @description 获取元素实际高度
     * @param {Element} ele
     * @param {Object} eleStyle 子元素样式
     * @param {Object} parentStyle 父元素样式
     * @param {Element} block 当前页面块
     */
    getELeRealHeight(ele = null, eleStyle = {}, parentStyle = {}, block) {
        let blockStyle = window.getComputedStyle(block);
        let eleHeight = 0;
        if (ele.nodeName !== "BR") {
            if (["#text", "SPAN", "EM"].includes(ele.nodeName)) {
                let eleDom = document.createElement("div");
                eleDom.style.position = "absolute";
                eleDom.style.visibility = "hidden";
                eleDom.style.left = blockStyle.paddingLeft;
                eleDom.style.right = blockStyle.paddingRight;
                eleDom.style.lineHeight = parentStyle.lineHeight;
                eleDom.textContent = ele.nodeValue || ele.textContent;
                block.appendChild(eleDom);
                eleHeight = eleDom.offsetHeight;
                eleDom.remove();
            } else {
                eleHeight = Math.ceil(ele.offsetHeight + parseFloat(eleStyle.marginTop || 0) + parseFloat(eleStyle
                    .marginBottom || 0) + parseFloat(eleStyle.paddingTop || 0) + parseFloat(eleStyle
                    .paddingBottom || 0));
            }
        }
        return eleHeight;
    },
    /**
     * @description 重置表主体内容；同步所有关联表
     * @param {Element} currTable
     */
    resetTableStruct(currTable = null) {
        var editor = this.getActiveEditor();
        var editorSetting = this.getEditorSetting();
        var pageContainer = editor.getBody().querySelector(".page-container");
        var block = editor.dom.getParent(currTable, ".info-block");
        var prevBlock = block.previousElementSibling;
        if (!prevBlock || this.reseting) {
            return null;
        }
        // debugger
        if (currTable.style.height && !currTable.dataset.fixedHeight) {
            currTable.style.height = null;
        }
        this.reseting = true;
        this.setTdIndex(currTable);
        this.clearTrHeight(currTable);
        // 同步主表、续表
        var relationTables = this.getRelationTable(editor, currTable);
        if (relationTables.length) {
            relationTables.forEach((table, index) => {
                if (table.style.height) {
                    table.style.height = null;
                }
                this.setTdIndex(table);
                table = this.syncTableContent(currTable, table, index === 0);
            });
            this.resetTableTitleByNumber(editor);
        }
        setTimeout(() => {
            this.reseting = false;
        }, 500);
        // 是否有足够的空间
        var spaceData = $global.calcBLockSpaceHeight(block);
        if (spaceData.blockHeight > spaceData.allHeight) {
            return true;
        }
        return null;
    },
    /**
     * @description 获取单元行的实际高度
     */
    getRealTrHeight(tr = null) {
        const editor = this.getActiveEditor();
        /* var isHide = $global.hasClass(tr, 'hide');
        if (isHide) {
            $global.removeClass(tr, 'hide');
        } */
        var trHeight = tr.offsetHeight;
        var tds = Array.from(tr.querySelectorAll("td"));
        tds.forEach((td) => {
            let tdChildNodes = Array.from(td.childNodes);
            let firstTop = 0;
            tdChildNodes.forEach((ele, i) => {
                let eleHeight = 0;
                let eleTop = 0;
                if (ele.nodeName !== "BR") {
                    if (ele.nodeName === "#text") {
                        let insEle = document.createElement("ins");
                        insEle.textContent = ele.textContent;
                        editor.dom.insertAfter(insEle, ele);
                        ele.remove();
                        eleHeight = insEle.offsetHeight;
                        eleTop = editor.dom.getPos(insEle).y;
                        if (i === 0) {
                            firstTop = eleTop;
                        }
                        ele = document.createTextNode(insEle.textContent);
                        editor.dom.insertAfter(ele, insEle);
                        insEle.remove();
                    } else {
                        eleHeight = ele.offsetHeight;
                        eleTop = editor.dom.getPos(ele).y;
                        if (i === 0) {
                            firstTop = eleTop;
                        }
                    }
                }
                // 仅取最后一个
                if (i === tdChildNodes.length - 1) {
                    eleHeight = eleTop - firstTop + eleHeight;
                    if (eleHeight > trHeight) {
                        trHeight = eleHeight;
                    }
                }
            });
            /* let tdHeight = td.offsetHeight;
            if (tdHeight > trHeight) {
                trHeight = tdHeight;
            } */
        });
        /* if (isHide) {
            $global.addClass(tr, 'hide');
        } */
        return trHeight;
    },
    /**
     * @description 合并新的表格
     */
    mergeTableByNew(currTable = null, targetTable = null, spaceHeight = 0) {
        this.setTdIndex(currTable);
        var tbody = currTable.querySelector("tbody");
        var currTrs = Array.from(tbody.querySelectorAll("tr:not(.hide)"));
        // 分析单元行
        var isBreak = false,
            eleAllHeight = 0;
        for (let trIndex = 0; trIndex < currTrs.length; trIndex++) {
            let tr = currTrs[trIndex];
            let trHeight = this.getRealTrHeight(tr);
            if (spaceHeight > eleAllHeight + trHeight && !isBreak) {
                eleAllHeight += trHeight; //tr.offsetHeight + 2;
                $global.addClass(tr, "hide");
            } else {
                isBreak = true;
                break;
            }
        }
        if (targetTable) {
            var cloneTbody = targetTable.querySelector("tbody");
            cloneTbody.innerHTML = tbody.innerHTML;
            var cloneTrs = Array.from(cloneTbody.querySelectorAll("tr"));
            var isShow = false;
            cloneTrs.forEach((tr) => {
                if (!isShow && !$global.hasClass(tr, "hide")) {
                    isShow = true;
                }
                if (!isShow) {
                    $global.removeClass(tr, "hide");
                } else {
                    $global.addClass(tr, "hide");
                }
            });
        }
        return isBreak;
    },
    mergeNextTable(currTable) {
        let error = "";
        let nextTable = currTable.nextElementSibling;
        if (nextTable && nextTable.nodeName === "TABLE") {
            let currColGroup = currTable.querySelector("colgroup");
            let nextColGroup = nextTable.querySelector("colgroup");
            if (!currColGroup || !nextColGroup) {
                error = "当前表格与下一个表格的结构不符，请检查colgroup！";
            } else {
                let currCols = currColGroup.childNodes;
                let nextCols = nextColGroup.childNodes;
                if (currCols.length !== nextCols.length) {
                    error = "当前表格与下一个表格的结构不符，请检查col列数是否一致！";
                } else {
                    let currBody = currTable.querySelector("tbody");
                    let nextRows = nextTable.rows;
                    for (let row of nextRows) {
                        currBody.appendChild(row);
                    }
                    nextTable.remove();
                    this.vm.message.success("表格已合并！");
                }
            }
        } else {
            error = "下一个元素非表格，无法合并！";
        }
        if (error) {
            this.vm.$message.warning(error);
        }
    },
    /**
     * @description 两个跨页关联表（续表）合并单元行 currTable:续表
     * @param {Element} currTable 当前表
     * @param {Element} targetTable 目标表
     * @param {Int} spaceHeight 空间高度
     */
    mergeTable(currTable = null, spaceHeight = 0) {
        var editor = this.getActiveEditor();
        // var editorSetting = this.getEditorSetting();
        var tbody = currTable.querySelector("tbody");
        // 取出隐藏的单元行, 当前表非隐藏的最后单元行为计数
        var currTrs = Array.from(tbody.querySelectorAll("tr:not(.hide)"));
        var showTr = currTrs[currTrs.length - 1]; // 最后一个非隐藏行
        var lastShowIndex = showTr ? editor.dom.nodeIndex(showTr) : -1;
        currTrs = Array.from(tbody.querySelectorAll("tr.hide"));
        currTrs.forEach((tr) => {
            let trIndex = editor.dom.nodeIndex(tr);
            if (trIndex > lastShowIndex) {
                $global.removeClass(tr, "hide");
            }
        });
        // 分析单元行
        var isBreak = false,
            eleAllHeight = 0;
        var hideIndexs = [];
        for (let trIndex = 0; trIndex < currTrs.length; trIndex++) {
            let tr = currTrs[trIndex];
            let trHeigth = this.getRealTrHeight(tr);
            let nodeIndex = editor.dom.nodeIndex(tr);
            if (nodeIndex > lastShowIndex) {
                $global.removeClass(tr, "hide");
                if (!isBreak) {
                    eleAllHeight += trHeigth;
                }
                if (spaceHeight > eleAllHeight) {
                    hideIndexs.push(nodeIndex);
                } else {
                    $global.addClass(tr, "hide");
                    isBreak = true;
                }
            }
        }
        // 下页的续表
        var nextBlock = editor.dom.getParent(currTable, ".info-block").nextElementSibling;
        if (nextBlock) {
            // var parentid = currTable.dataset.parentid || currTable.dataset.id;
            var cloneTable = nextBlock.querySelector(`table[data-parentid="${currTable.dataset.id}"]`) || nextBlock
                .querySelector(`table[data-parentid="${currTable.dataset.parentid}"]`);
            if (cloneTable) {
                tbody = cloneTable.querySelector("tbody");
                currTrs = Array.from(tbody.querySelectorAll("tr"));
                currTrs.forEach((tr, i) => {
                    if (hideIndexs.includes(i)) {
                        $global.addClass(tr, "hide");
                    }
                });
                // 判断续表中是否已全部合并
                currTrs = Array.from(tbody.querySelectorAll("tr:not(.hide)"));
                if (!currTrs.length) {
                    cloneTable.remove();
                    // 再判断当前页面中是否已为空页面
                    if (nextBlock.textContent.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s/g, "") === "") {
                        nextBlock.remove();
                    }
                }
                // 判断原始表是否都为隐藏单元行
                if (!hideIndexs.length && lastShowIndex < 0) {
                    if (!currTable.dataset.parentid) {
                        // 主表
                        cloneTable.removeAttribute("data-parentid");
                        cloneTable.dataset.id = currTable.dataset.id;
                        $global.removeClass(cloneTable, "xu");
                        var cloneTableTitle = cloneTable.querySelector(".table-title");
                        if (cloneTableTitle) {
                            $global.removeClass(cloneTableTitle, "txu");
                        }
                    }
                    // 删除原始表
                    currTable.remove();
                }
            }
        }
        return {
            isBreak,
            eleAllHeight,
        };
    },
    /**
     * @description 设置表格的单元格索引
     * @param {Element} tableNode
     */
    setTdIndex(tableNode = null, isBody = true) {
        var matrixData = this.matrixTable(tableNode, isBody);
        matrixData.forEach((row, rowI) => {
            row.forEach((col, i) => {
                let { cell, hide } = col;
                if (cell && cell.el && !hide && !col.continue) {
                    cell.el.dataset.index = i;
                }
            });
        });
    },
    /**
     * @description 插入新的表格
     * @param {Object} editor
     * @param {Element} currNode
     */
    insertTable(editor = null, currNode = null) {
        var tableNode = editor.dom.getParent(currNode, "table");
        this.setTdIndex(tableNode);
        tableNode.dataset.id = tableNode.dataset.id || $global.guid();
        var parentNode = tableNode.parentNode;
        // 如果父容器为列项的
        if (parentNode && $global.hasClass(parentNode, "bullet")) {
            $global.insertAfter(tableNode, parentNode);
        }
        // 这里须延时处理表的属性等
        setTimeout(() => {
            if (this.vm.pageData?.stdKind === this.vm.editorSetting.tmplType) { // 航司模板
                tableNode.style.border = "1px solid #333";
                const captionTitle = tableNode.querySelector('caption.table-title');
                if (captionTitle) {
                    captionTitle.remove();
                }
            } else {
                tableNode.style.border = "2px solid #333";
            }
            if (parentNode.nodeName !== "TD") {
                var titleNode = tableNode.querySelector("caption.table-title");
                if (!titleNode && this.vm.pageData?.stdKind !== this.vm.editorSetting.tmplType) {
                    titleNode = editor.dom.create("caption", {
                        class: "table-title",
                        "data-bookmark": $global.guid(),
                    }, "表标题");
                    $global.prependChild(titleNode, tableNode);
                }
                this.resetTableTitleByNumber(editor);
            }
        }, 50);
    },
    /**
     * @description 删除表格
     * @param {Object} editor
     * @param {Element} currNode
     */
    eraseTable(editor = null, id = undefined) {
        editor = this.getActiveEditor();
        var container = editor.getBody().querySelector(".page-container");
        // 续表对象
        var relationTables = container.querySelectorAll(`table[data-parentid="${id}"]`);
        if (relationTables.length) {
            setTimeout(() => {
                relationTables.forEach((table, i) => {
                    if (i === 0) {
                        table.removeAttribute("data-parentid");
                        $global.removeClass(table, "xu");
                        var tableTitle = table.querySelector(".table-title");
                        if (tableTitle) {
                            $global.removeClass(tableTitle, "txu");
                        }
                    }
                });
                this.resetTableTitleByNumber(editor);
            }, 100);
        } else {
            setTimeout(() => {
                this.resetTableTitleByNumber(editor);
            }, 100);
        }
        return false;
    },
    /**
     * @description 删除表格的单元列
     * @param {Object} editor
     * @param {Object} currNode
     */
    eraseTableCol(editor = null, tableCell = null) {
        if (tableCell) {
            var tableNode = tableCell.table;
            this.resetTableStruct(tableNode);
        }
    },
    /**
     * @description 删除表格的单元行；如果有续表的则将续表的单元行提取上来
     * @param {Object} editor
     * @param {Object} tableId 当前处理的表格ID
     */
    eraseTableRow(editor = null, tableId = "") {
        var container = editor.getBody().querySelector(".page-container");
        var sourceTable = container.querySelector(`table[data-id="${tableId}"]`);
        if (sourceTable) {
            this.resetTableStruct(sourceTable);
        }
    },
    /**
     * @description 获取页面的剩余空间
     * @param {Element}  pageBlock
     */
    getPageSpaceHeight(pageBlock = null) {
        var blockStyle = window.getComputedStyle(pageBlock);
        // 页面的实际空间高度
        var spaceHeight = Math.ceil(parseFloat(blockStyle.height) - parseFloat(blockStyle.paddingTop) - parseFloat(blockStyle.paddingBottom));
        // 减去脚注的高度
        var footnote = pageBlock.querySelector(".footnote");
        if (footnote) {
            spaceHeight -= footnote.offsetHeight + 10;
        }
        for (let i = 0; i < pageBlock.childNodes.length; i++) {
            let ele = pageBlock.childNodes[i];
            if (!$global.hasClass(ele, "footnote") && !/^(#text)$/.test(ele.nodeName) && !ele.dataset.mceCaret) {
                let eleStyle = window.getComputedStyle(ele);
                spaceHeight -= Math.ceil(ele.offsetHeight + parseFloat(eleStyle.marginTop) + parseFloat(eleStyle.marginBottom));
            }
        }
        return spaceHeight;
    },
    /**
     * @description 表格或内部元素对齐方式
     * @param {Object} editor
     * @param {Element} currNode
     * @param {String} align
     */
    setTableAlign(editor = null, currNode = null, align = "") {
        if (currNode.nodeName !== "CAPTION") {
            switch (align) {
                case "mceTableAlignLeft":
                    currNode.style.textAlign = null;
                    break;
                case "mceTableAlignCenter":
                    currNode.style.textAlign = "center";
                    break;
                case "mceTableAlignRight":
                    currNode.style.textAlign = "right";
                    break;
            }
        } else {
            var tableNode = editor.dom.getParent(currNode, "table");
            if (tableNode) {
                tableNode.style.removeProperty("margin-left");
                tableNode.style.removeProperty("margin-right");
                switch (align) {
                    case "mceTableAlignLeft":
                        tableNode.style.setProperty("margin-right", "auto");
                        break;
                    case "mceTableAlignCenter":
                        tableNode.style.setProperty("margin-left", "auto");
                        tableNode.style.setProperty("margin-right", "auto");
                        break;
                    case "mceTableAlignRight":
                        tableNode.style.setProperty("margin-left", "auto");
                        break;
                }
                this.chageTableStyle(editor, tableNode);
            }
        }
    },
    /**
     * @description 表格属性改变后
     * @param {Object} editor
     * @param {Object} obj
     */
    tableModified(editor = null, obj = null) {
        editor = this.getActiveEditor();
        // debugger
        var container = editor.getBody().querySelector(".page-container");
        var tableNode = obj.table || container.querySelector(`table[data-id="${obj.ui}"]`);
        // 处理表标题及表头等
        var tableTitle = tableNode.querySelector(".table-title");
        if (tableTitle) {
            if (tableTitle.textContent.replace(/\s/g, "").replace(/[\u200B-\u200D\uFEFF]/g, "") === "") {
                $global.addClass(tableTitle, "empty");
            } else {
                $global.removeClass(tableTitle, "empty");
            }
        }
        var tableHeader = tableNode.querySelector("thead");
        var tableDescription = tableNode.querySelector(".table-description");
        var colgroup = tableNode.querySelector("colgroup");
        if (tableDescription && colgroup) {
            tableNode.insertBefore(tableDescription, colgroup);
        }
        var relationTables = this.getRelationTable(editor, tableNode);
        if (relationTables.length) {
            relationTables.forEach((table) => {
                let theader = table.querySelector("thead");
                let tbody = table.querySelector("tbody");
                if (tableHeader) {
                    if (!theader) {
                        theader = tableHeader.cloneNode(true);
                        table.insertBefore(theader, tbody);
                    }
                } else {
                    if (theader) {
                        theader.remove();
                    }
                }
            });
        }
        // 表的实际宽度, 最大不能超过父容器宽度
        if (tableNode.offsetWidth > tableNode.parentNode.offsetWidth) {
            tableNode.style.width = "100%";
        }
        // 同步关联表
        this.resetTableStruct(tableNode);
    },
    /**
     * @description 同步续表的样式
     * @param {Object} editor
     * @param {Element} tableNode
     * @param {Element} relationTable
     */
    chageTableStyle(editor = null, tableNode = null, relationTables = null) {
        editor = this.getActiveEditor();
        if (!relationTables) {
            relationTables = this.getRelationTable(editor, tableNode);
        }
        if (relationTables.length) {
            relationTables.forEach((table) => {
                table.setAttribute("style", tableNode.getAttribute("style"));
            });
        }
    },
    /**
     * @description 同步续表的表头内容
     * @param {Object} editor
     * @param {Element} tableNode
     */
    chageTableContent(editor = null, currNode = null) {
        editor = this.getActiveEditor();
        if (!editor.compositionStart) {
            var tableNode = editor.dom.getParent(currNode, "table");
            this.resetTableStruct(tableNode);
        }
    },
    /**
     * @description 同步续表的标题或附加信息内容
     * @param {Object} editor
     * @param {Element} tableNode
     */
    chageTableCaption(editor = null, tableNode = null, relationTables = null) {
        this.resetTableStruct(tableNode);
    },
    /**
     * @description 设置或取消表标题
     * @param {Object} editor
     * @param {Element} tableNode
     */
    toggleTitle(editor = null, tableNode = null) {
        editor = this.getActiveEditor();
        var title = tableNode.querySelector(".table-title");
        if (!title) {
            title = editor.dom.create("caption", { class: "table-title", "data-number": "1" }, "表标题");
            $global.prependChild(title, tableNode);
            // this.resetTableTitleByNumber(editor);
        } else {
            let titleText = title.textContent.replace(/[\u200B-\u200D\uFEFF]/g, "");
            if (titleText === "") {
                title.innerText = "表标题";
            } else {
                title.innerText = "";
            }
        }
        this.resetTableTitleByNumber(editor);
    },
    /**
     * @description 判断当前续表是否为最后一个表格
     * @param {Object} editor
     * @param {Element} tableNode
     */
    isLastRelationTable(editor = null, tableNode = null) {
        let sameTables = this.getRelationTable(editor, tableNode, true);
        for (let i = 0; i < sameTables.length; i++) {
            if (i === sameTables.length - 1 && sameTables[i] === tableNode) {
                return true;
            }
        }
        return false;
    },
    /**
     * @description 获取关联的表格
     * @param {Object} editor
     * @param {Element} tableNode
     */
    getRelationTable(editor = null, tableNode = null, joinSelf = false) {
        var container = editor.getBody().querySelector(".page-container");
        var tableNodes = [];
        if (tableNode.dataset.parentid) {
            tableNodes = Array.from(container.querySelectorAll(`table[data-id="${tableNode.dataset.parentid}"]`)) || [];
            var sameTables = container.querySelectorAll(`table[data-parentid="${tableNode.dataset.parentid}"]`);
            sameTables.forEach((table) => {
                if (table.dataset.id !== tableNode.dataset.id || joinSelf) {
                    tableNodes.push(table);
                }
            });
        } else {
            tableNodes = container.querySelectorAll(`table[data-parentid="${tableNode.dataset.id}"]`);
        }
        return Array.from(tableNodes);
    },
    /**
     * @description 重置单元格水平对齐
     * @param {Element} table
     */
    resetTdAlign(table = null) {
        // 单元格对齐方式
        let tds = Array.from(table.querySelectorAll("td"));
        tds.forEach((td) => {
            let textAlign = td.style.textAlign; //window.getComputedStyle(td).textAlign || null;
            let pNodes = Array.from(td.querySelectorAll("p"));
            pNodes.forEach((pNode) => {
                // pNode.style.textAlign = textAlign;
                let cls = pNode.className || "";
                let txt = pNode.textContent; //.replace(/[\u200B-\u200D\uFEFF]/g, '');
                if (cls.match(/\zhux|\zhu-x/gi) !== null && txt === "") {
                    pNode.innerHTML = "&#8203";
                }
            });
        });
    },
    resetTableHeight(editor = null) {
        return true;
        /*if (!editor || !editor.getBody()) {
            return;
        }
        var container = editor.getBody().querySelector('.page-container');
        if (!container) {
            return;
        }
        var tableNodes = Array.from(container.querySelectorAll('.info-block:not(.fixed):not(.disabled) table'));
        tableNodes.forEach(table => {
            const pageBlock = editor.dom.getParent('.info-block');
            this.resetTdHeight(table, pageBlock);
        })*/
    },
    resetTdHeight(table = null, pageBlock = null) {
        let trs = Array.from(table.querySelectorAll("tr"));
        trs.forEach((tr) => {
            if (tr.style.height) {
                tr.style.removeProperty("height");
            }
            let tds = Array.from(tr.querySelectorAll("td"));
            tds.forEach((td) => {
                let rowSpan = td.rowSpan;
                if (td.style.height) {
                    let tdHeight = parseFloat(td.style.height);
                    if (tdHeight <= rowSpan * sysRowHeight) {
                        td.style.removeProperty("height");
                    }
                }
            });
        });
    },
    // 获取TD的实际高度
    getMaxHeightByRow(row) {
        let maxHeight = 0;
        const cells = Array.from(row.cells);
        for (let cell of cells) {
            let cellWidth = cell.offsetWidth;
            let tempDiv = document.createElement("div");
            tempDiv.style.position = "absolute";
            tempDiv.style.visibility = "hidden";
            tempDiv.style.lineHeight = "12.5pt";
            tempDiv.style.width = cellWidth - 4 + "px";
            document.body.appendChild(tempDiv);
            let cellHeight = tempDiv.scrollHeight;
            if (cellHeight > maxHeight) {
                maxHeight = cellHeight;
            }
            tempDiv.remove();
        }
        if (maxHeight) {
            row.style.height = maxHeight + 'px';
        }
        return maxHeight;
    },
    /**
     * @description 重置表标题序号
     * @param {Object} editor
     * @param {Element} relationTable
     */
    resetTableTitleByNumber(editor = null) {
        if (!editor || !editor.getBody()) {
            return;
        }
        var container = editor.getBody().querySelector(".page-container");
        if (!container) {
            return;
        }
        var structIndex = 0;
        var appendixList = [];
        var tableNodes = Array.from(container.querySelectorAll(".info-block:not(.fixed):not(.disabled) table:not(.xu)"));
        tableNodes.forEach((table) => {
            let pageBlock = editor.dom.getParent(table, ".info-block");
            let titleNode = table.querySelector(".table-title");
            let indexNum;
            if ($global.hasClass(pageBlock, "appendix")) {
                let appendixFilter = appendixList.filter((o) => {
                    return o.letter === pageBlock.dataset.letter;
                });
                indexNum = pageBlock.dataset.letter + "." + (appendixFilter.length + 1);
                appendixList.push({
                    letter: pageBlock.dataset.letter,
                    id: $global.guid(),
                });
            } else {
                if (titleNode) {
                    structIndex++;
                }
                indexNum = structIndex;
            }
            // 表标题
            if (titleNode) {
                // 上一个节点是否为图标题
                let parentNode = table.parentNode;
                if (parentNode.dataset && parentNode.dataset.bookmark && !$global.hasClass(parentNode,"hide-list")) {
                    let prevNode = table.previousElementSibling;
                    if (!prevNode || (prevNode && ['SPAN', 'EM', 'STRONG', 'SUB', 'SUP'].includes(prevNode.node)) || (prevNode && $global.hasClass(prevNode, 'img-title'))) {
                        $global.addClass(titleNode, 'half');
                    }
                }
                titleNode.dataset.number = indexNum;
                if (titleNode.textContent.replace(/\s/g, "").replace(/[\u200B-\u200D\uFEFF]/g, "") == "") {
                    $global.addClass(titleNode, "empty");
                } else {
                    $global.removeClass(titleNode, "empty");
                }
            }
            // 续表对象
            let relationTables = this.getRelationTable(editor, table);
            if (relationTables.length) {
                relationTables.forEach((ele) => {
                    let relationTableTitle = ele.querySelector(".table-title");
                    if (relationTableTitle) {
                        relationTableTitle.dataset.number = indexNum;
                        if (relationTableTitle.textContent.replace(/\s/g, "").replace(/[\u200B-\u200D\uFEFF]/g, "") == "") {
                            $global.addClass(relationTableTitle, "empty");
                        } else {
                            $global.removeClass(relationTableTitle, "empty");
                        }
                    }
                });
            }
        })
        tableNodes = null;
    },
};
