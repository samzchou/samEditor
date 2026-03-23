/* eslint-disable */
/**
 * @module
 * @desc 编辑器页面处理模块
 * @author sam.shen 2021-12-04
 */
'use strict';
import $global from '@/utils/global';
import { numberChar, pagePadding } from './editorOptions';
export default {
    pageContainer: null,
    infoBlocks: [],
    callBack: null,
    resetPages(infoBlocks, pageContainer, callBack) {
        // 替换所有图片的路径
        var imgPath = process.env.VUE_APP_FILE_URL;
        var images = pageContainer.querySelectorAll('img');
        images.forEach(imgNode => {
            let imgSrc = imgNode.getAttribute('src');
            let paths = imgSrc.split("/files/");
            paths[0] = imgPath;
            imgSrc = paths.join('');
            imgNode.setAttribute('src', imgSrc);
            imgNode.setAttribute('crossOrigin', 'Anonymous');
        })

        // DOM数组转换为数据数组
        this.infoBlocks = Array.from(infoBlocks);
        this.pageContainer = pageContainer;
        this.callBack = callBack;
        this.calcBLock(0);
    },

    calcBLock(blockIndex=0) {
        var block = this.infoBlocks[blockIndex];
        if(block) {
            let blockStyle = window.getComputedStyle(block);
            let blockHeight = Math.floor(block.offsetHeight - parseFloat(blockStyle.paddingTop) - parseFloat(blockStyle.paddingBottom));
            let blockWidth = Math.floor(block.offsetWidth - parseFloat(blockStyle.paddingLeft) - parseFloat(blockStyle.paddingRight));
            // 把章节中的标题提到顶部
            let titleNode = block.querySelector('[data-titleid]');
            if(titleNode) {
                $global.prependChild(titleNode, block);
            }

            // 开始计算每个节点（仅子节点）
            let allHeight = 0;
            let childNodes = block.childNodes;
            for(let i=0; i<childNodes.length; i++) {
                let node= childNodes[i];
                if(!/^(#text|BR)$/.test(node.nodeName) && !$global.hasClass(node, 'locked')) {
                    allHeight += node.offsetHeight;
                    // 当超出实际的页面高度,须额外增加页面并跳出循环
                    if(allHeight > blockHeight) {
                        // 空间部分（页面顶部至节点的距离）
                        let spaceHeight = allHeight - node.offsetHeight;
                        this.appendNewBlock(node, block, blockIndex, spaceHeight, blockHeight, blockWidth);
                        return false;
                    }
                }
            }
            let nextIndex = blockIndex + 1;
            this.calcBLock(nextIndex);
        } else {
            this.updateAllPageInfo();
        }
    },
    /**
     * @description 超限元素置入新的页面（或者加入在同属性页面中）
     * @param {Element}  node 当前元素
     * @param {Element}  block 当前页
     * @param {int}  blockIndex 页序
     */
    appendNewBlock(node=null, block=null, blockIndex=0, spaceHeight=0, blockHeight=0, blockWidth=0) {
        // console.log('node=>', node, blockIndex);
        var nextBlock = block.nextElementSibling;
        var newBlock = block.cloneNode();
        var nextNodes = $global.getNextAllNodes(node);
        var nodeChilds = node.childNodes;
        /**
         * 当节点内的子节点仅有一个的时候就直接处理（这里还须进一步处理node下的各个节点元素）
         * step1. 如果是CLONE的节点则直接置入容器
         */
        if($global.hasClass(node, 'hide-list')) {
            newBlock.appendChild(node);
        } else {
            if(nodeChilds.length === 1) {
                newBlock.appendChild(node);
            } else {
                console.log('超限元素多节点分析待补充');
                // debugger
                //
                // 分析各个子节点并拆分
                for(let i=0; i<nodeChilds.length; i++) {

                }
            }
        }

        // 处理下级的兄弟节点
        if(nextNodes) {
            nextNodes.forEach(ele => {
                newBlock.appendChild(ele);
            })
        }
        // 加入新的页面
        $global.insertAfter(newBlock, block);

        // 处理完成后继续下一个页面的处理
        let nextIndex = blockIndex + 1;
        this.infoBlocks.splice(nextIndex, 0, newBlock);
        // 继续计算下一个页面
        this.calcBLock(nextIndex);
    },
    /**
     * @description 更新页面布局|页眉|页脚
     * @param {Element} pageContainer 页面容器
     * @param {String}  pageType    排版方式（单面双面）默认双面
     */
    updateAllPageInfo(pageContainer=null, pageType="double") {
        pageContainer = pageContainer || this.pageContainer;
        var pageList = [];
        var allBlocks = pageContainer.querySelectorAll('.info-block');
        var romaIndex = 0, structIndex = 0;
        allBlocks.forEach(block => {
            let itemData = {};
            let pageNum = block.dataset.pagenum;
            if(pageNum) {
                let padding = pagePadding.right;
                let left = false;
                if(isNaN(parseInt(pageNum))) {
                    pageNum = numberChar.roma[romaIndex];
                    left = romaIndex % 2 === 1;
                    romaIndex++;
                } else {
                    left = structIndex % 2 === 1;
                    pageNum = structIndex + 1;
                    structIndex++;
                }
                if(pageType === "double") {
                    if(left) {
                        padding = pagePadding.left;
                        $global.addClass(block, 'left');
                    } else {
                        $global.removeClass(block, 'left');
                    }
                } else {
                    padding = pagePadding.right;
                    $global.removeClass(block, 'left');
                }

                block.style.padding = padding;
                block.dataset.pagenum = pageNum;
                itemData.pagenum = pageNum;
            }
            if($global.hasClass(block, 'cover') || $global.hasClass(block, 'catalogue')) {
                itemData.systemPage = true;
                itemData.disabled = true;
            } else {
                itemData.itemId = block.dataset.outlineid;
            }

            itemData.htmlContent = block.outerHTML;

            pageList.push(itemData);
        });

        this.callBack && this.callBack(pageList);
    },

    /**
     * @description 重置目次对应的实际页面序号
     * @param {Element} pageContainer
     */
    resetCatalogue(pageContainer) {
        var catalogueBlock = pageContainer.querySelector('.info-block.catalogue');
        if(catalogueBlock) {
            var fldChars = catalogueBlock.querySelectorAll('.fld-char');
            fldChars.forEach(ele => {
                let bm = ele.dataset.mk;
                let spanNum = ele.querySelector('.num');
                let outlineEle = pageContainer.querySelector(`[data-bookmark="${bm}"]`);
                if(outlineEle) {
                    let block = $global.getParentElement(outlineEle, pageContainer, 'info-block');
                    // debugger
                    if(block) {
                        spanNum.innerText = block.dataset.pagenum;
                    }
                }
            })
        }
    }
}
