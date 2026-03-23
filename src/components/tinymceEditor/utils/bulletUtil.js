/**
 * ===================================================================================================================
 * @module
 * @desc 列项处理模块
 * @author sam 2022-01-01
 * ===================================================================================================================
 */

import $global from "@/utils/global";

const typeMap = [
    { 'circle': 'hollow-circle' },
    { 'num': 'line' },
    { 'lower': 'num' },
    { 'line': 'circle' },
    { 'hollow-circle': 'square' },
    { 'square': 'hollow-square' },
    { 'hollow-square': 'index' },
    { 'index': 'lower' },
]

export default {
    editor: null,
    vm: {},
    /**
     * @description 获取当前的编辑器实例
     */
    getActiveEditor() {
        var editors = window.tinyMCE.editors && window.tinyMCE.editors.length ? window.tinyMCE.editors : [];
        for (let i = 0; i < editors.length; i++) {
            let editor = editors[i];
            if (editor.id === `tinymce-editor-${this.vm.editorId||''}`) {
                return editor;
            }
        }
        return this.vm.editor || window.tinyMCE.activeEditor;
    },

    /**
     * @description 获取下一级的列项类型
     * @param {String} type
     */
    nextBulletType(type) {
        switch (type) {
            case 'line':
                return 'circle';
            case 'circle':
                return 'lower';
            case 'lower':
                return 'num';
            case 'num':
                return 'hollow-circle';
            case 'hollow-circle':
                return 'diamond';
            case 'diamond':
                return 'square';
            case 'square':
                return 'hollow-square';
            case 'hollow-square':
                return 'num-index';
            case 'num-index':
                return 'line';
        }
    },

    prevBulletType(type) {
        switch (type) {
            case 'num-index':
                return 'hollow-square';
            case 'hollow-square':
                return 'square';
            case 'square':
                return 'diamond';
            case 'diamond':
                return 'hollow-circle';
            case 'hollow-circle':
                return 'num';
            case 'num':
                return 'lower';
            case 'lower':
                return 'circle';
            case 'circle':
                return 'line';
            case 'line':
                return 'num-index';
        }
    },

    /**
     * @description 处理粘贴进来的P段落
     * @param {Element} bulletNode 列项容器
     */
    pastePostprocess(bulletNode = null) {
        var level = parseInt(bulletNode.dataset.level, 10);
        var valiNodes = Array.from(bulletNode.querySelectorAll(':scope>p,:scope>table'));
        // var lens = valiNodes.length;
        // debugger
        valiNodes.reverse().forEach(ele => {
            if (ele.nodeName === 'P') {
                ele.style.textIndent = (level + 1) * 2 + 'em';
            }
            $global.insertAfter(ele, bulletNode);
        });
        if (bulletNode.childNodes.length === 0) {
            bulletNode.innerHTML = '&#8203';
        }
    },

    /**
     * @description 根据ID获取相同的节点组
     * @param {Object} container 容器
     * @param {String} id
     * @param {Element} currNode 当前节点返回下标值
     */
    getAllSameNodesById(container = null, id = '', currNode = null) {
        var nodes = [];
        if (id) {
            nodes = container.querySelectorAll(`.bullet[data-id="${id}"]:not(.hide-list)`);
            if (currNode) {
                return this.getIndex(nodes, currNode);
            }
        } else {
            if (currNode) {
                nodes = this.getPrevSameLevelAndType(currNode, true);
            }
        }
        return nodes;
    },

    /**
     * @description 当前节点下标值
     * @param {Array} nodes
     * @param {Element} currNode
     */
    getIndex(nodes = [], currNode = null) {
        var index = -1;
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i] === currNode) {
                index = i;
                break;
            }
        }
        return index;
    },

    /**
     * @description 向上找出所有同类列项
     */
    getPrevSameLevelAndType(currNode = null, isAll = false) {
        var arrNodes = [];
        const findNode = node => {
            if (node && $global.hasClass(node, 'bullet')) {
                if (node.dataset.level === currNode.dataset.level && node.dataset.type === currNode.dataset.type) {
                    if (isAll) {
                        arrNodes.push(node);
                        findNode(node.previousElementSibling);
                    } else {
                        return node;
                    }
                } else {
                    if (parseInt(node.dataset.level) > parseInt(currNode.dataset.level)) {
                        if (!isAll) {
                            return findNode(node.previousElementSibling);
                        } else {
                            findNode(node.previousElementSibling);
                        }
                    }
                }
            } else {
                return null;
            }
        }
        if (isAll) {
            findNode(currNode.previousElementSibling);
            return arrNodes;
        }
        return findNode(currNode.previousElementSibling);
    },

    /**
     * @description 获取上一层相同层级的节点
     * @param {Element} currNode 当前节点
     * @param {Int} level 层级
     */
    getPrevSameLevel(currNode = null, level = 0, type = undefined) {
        const findNode = node => {
            if (node && $global.hasClass(node, 'bullet')) {
                if (node.dataset.level === String(level)) {
                    return node;
                } else {
                    return findNode(node.previousElementSibling);
                }
            } else {
                return null;
            }
        }
        return findNode(currNode.previousElementSibling);
    },

    /**
     * @description 改变层级序号
     * @param {Element} currNode
     * @param {String} type
     * @param {Int} level
     */
    changLevelType(currNode = null, type = 'circle', level = 0) {
        var start = 0,
            id = $global.guid();
        // 如果上一个节点层级相同
        var prevNode = currNode.previousElementSibling;
        if (prevNode && prevNode.dataset.level === String(level)) {
            start = parseInt(prevNode.dataset.start) + 1;
            type = prevNode.dataset.type;
            id = prevNode.dataset.id;
        }

        currNode.dataset.id = id;
        currNode.dataset.type = type;
        currNode.dataset.start = start;
        currNode.dataset.level = level;
        currNode.style['counter-reset'] = `${type} ${start}`;
        currNode.removeAttribute('data-mce-style');

        // 获取所有相同层级的节点组
        var nextNodes = this.getSameNodesByParam(currNode, { level, type });
        if (nextNodes.length) {
            nextNodes.forEach((node, i) => {
                let index = start + i + 1;
                this.setBulletAttr(node, { id, start: index, type, level });
            })
        }
    },

    /**
     * @description 根据条件获取相同节点组
     * @param {Element} currNode
     * @param {Object} condition 逻辑条件 {level, type, id, ...}
     * @param {String}  levelOperation 层级运算符
     * @param {Boolean}  isNext 往下|往上
     */
    getSameNodesByParam(currNode, condition = {}, levelOperation = '==', isNext = true) {
        var nodes = [];
        const findNode = node => {
            if (node) {
                if ($global.hasClass(node, 'bullet')) {
                    let nodeLevel = parseInt(node.dataset.level);
                    let flag = true;
                    if (condition.level !== undefined) {
                        flag = flag && eval(nodeLevel + levelOperation + condition.level);
                    }
                    if (condition.type) {
                        flag = flag && node.dataset.type === condition.type;
                    }
                    if (condition.id) {
                        flag = flag && node.dataset.id === condition.id;
                    }
                    if (flag && (node.dataset.start !== undefined || condition.isGet)) {
                        nodes.push(node);
                    }
                    // 继续查找元素
                    if (nodeLevel >= condition.level) {
                        findNode(isNext ? node.nextElementSibling : node.previousElementSibling);
                    }
                } else if (!$global.hasClass(node, 'ol-list') && !$global.hasClass(node, 'appendix-list')) {
                    findNode(isNext ? node.nextElementSibling : node.previousElementSibling);
                }
            }
        }
        findNode(isNext ? currNode.nextElementSibling : currNode.previousElementSibling);

        // 涉及到跨页，继续查找元素
        var pageBlock = $global.getParentBySelector(currNode, 'info-block');
        var siblingBlock = isNext ? pageBlock.nextElementSibling : pageBlock.previousElementSibling;
        if (siblingBlock && pageBlock.dataset.outlineid && siblingBlock.dataset.outlineid && pageBlock.dataset.outlineid === siblingBlock.dataset.outlineid) {
            findNode(isNext ? siblingBlock.firstChild : siblingBlock.lastChild);
        }

        return isNext ? nodes : nodes.reverse();
    },

    getTypeBySameLevel(currNode = null) {
        var newType;
        var prevBullet = currNode.previousElementSibling;
        var nextBullet = currNode.nextElementSibling;

        if (prevBullet && $global.hasClass(prevBullet, 'bullet') && prevBullet.dataset.level === currNode.dataset.level) {
            newType = prevBullet.dataset.type;
        }
        if (!newType && nextBullet && $global.hasClass(nextBullet, 'bullet') && nextBullet.dataset.level === currNode.dataset.level) {
            newType = nextBullet.dataset.type;
        }

        if (newType) {
            currNode.removeAttribute('data-start');
            currNode.removeAttribute('style');
            currNode.removeAttribute('data-mce-style');
        }
        return newType;
    },

    splitSameBullets(editor = null, bulletNodes = [], type = 'num') {
        var allNodeArr = [],
            areaIndex = 0,
            outlineId = $global.guid();
        // 开始计算并分组
        for (let i = 0; i < bulletNodes.length; i++) {
            let node = bulletNodes[i];
            let parentContainer = editor.dom.getParent(node, '[data-outlineid]');
            if (parentContainer) {
                outlineId = parentContainer.dataset.outlineid;
            }

            let level = node.dataset.level; //parseInt(node.dataset.level, 10);
            let arrData = _.find(allNodeArr, { level, areaIndex, outlineId });
            if (!arrData) {
                arrData = { level, areaIndex, outlineId, children: [] };
                allNodeArr.push(arrData);
            }
            arrData.children.push(node);

            let nextNode = bulletNodes[i + 1]; //node.nextElementSibling;
            if (nextNode) { // || !$global.hasClass(nextNode, 'bullet') || nextNode.dataset.level !== level || nextNode.dataset.type !== type  areaIndex++;
                if (nextNode.dataset.level !== level || nextNode.dataset.start !== undefined) {
                    // areaIndex++;
                    nextNode = bulletNodes[i + 2];
                    if (nextNode) {
                        nextNode.dataset.start = i + 2;
                        bulletNodes.splice(i + 2, 1, nextNode);
                    }
                }
            }
        }

        return allNodeArr;
    },

    getNextSameNodes(currNode = null) {
        var level = currNode.dataset.level;
        var bulletId = currNode.dataset.id;
        var nodes = [currNode];
        const getNextBuller = node => {
            let nextNode = node.nextElementSibling;
            if (nextNode && !nextNode.dataset.restart) {
                if ($global.hasClass(nextNode, 'bullet')) {
                    if (nextNode.dataset.type === currNode.dataset.type && nextNode.dataset.level === level) {
                        nextNode.dataset.reset = 1;
                        nodes.push(nextNode);
                    }
                    // 如层级大于当前节点的则继续
                    if (parseInt(nextNode.dataset.level, 10) >= parseInt(level, 10)) {
                        getNextBuller(nextNode);
                    }
                } else {
                    getNextBuller(nextNode);
                }
            }
        }
        getNextBuller(currNode);
        return nodes;
    },

    getPrevBlockSameBullet(currNode = null) {
        const editor = this.getActiveEditor();
        const currBlock = editor.dom.getParent(currNode, '.info-block');
        const prevBlock = currBlock.previousElementSibling;
        if (prevBlock) {
            var samBullets = Array.from(prevBlock.querySelectorAll(`.bullet[data-type="${currNode.dataset.type}"][data-level="${currNode.dataset.level}"]`));
            if (samBullets.length) {
                return samBullets[samBullets.length - 1];
            }
        }
        return null;
    },

    /**
     * @description 按容器重置所有列项编号
     * @param {Object}  editor
     * @param {Element}  container
     */
    resetBulletNumberByParent(editor = null, container = null) {
        // 是否为隐藏项
        const isHideEle = node => {
            return $global.hasClass(node, 'hide-list'); // || $global.hasClass(node.parentNode, 'hide-list');
        }
        const setStartNode = node => {
            let start = node.dataset.start || 0;
            let restart = 0;
            if (isHideEle(node)) {
                let parentBullet = this.getPrevBlockSameBullet(node);
                if (parentBullet) {
                    let allSameNodes = [parentBullet];
                    let sameNodes = this.getPrevSameLevelAndType(parentBullet, true);
                    for (let i = 0; i < sameNodes.length; i++) {
                        allSameNodes.push(sameNodes[i]);
                        if (sameNodes[i].dataset.start) {
                            restart = parseInt(sameNodes[i].dataset.start, 10);
                            break;
                        }
                    }
                    if (allSameNodes.length) {
                        start = $global.hasClass(node, 'hide-list') ? allSameNodes.length - 1 : allSameNodes.length;
                    }
                    node.dataset.id = parentBullet.dataset.id;
                }
            }
            node.dataset.start = parseInt(start, 10) + restart;
            node.style.counterReset = `${node.dataset.type} ${node.dataset.start}`;
        }

        const clearStartNode = (node, prevNode) => {
            if ($global.hasClass(node, 'hide-list')) {
                prevNode.innerHTML = prevNode.innerHTML + node.innerHTML;
                node.remove();
            } else {
                let start = parseInt(prevNode.dataset.start || '0', 10) + 1;
                node.dataset.start = start;
                // node.style.counterReset = `${node.dataset.type} ${start}`;
                node.style.counterReset = null;
                // node.removeAttribute('data-start');
                node.removeAttribute('data-restart');
                node.removeAttribute('data-cross');
            }
        }

        const getBulletId = node => {
            let id = node.dataset.id || $global.guid();
            let sameNodes = Array.from(container.querySelectorAll(`.bullet[data-id="${id}"]`));
            for (let i = 0; i < sameNodes.length; i++) {
                let ele = sameNodes[i];
                if (ele.dataset.type !== node.dataset.type && ele.dataset.level !== node.dataset.level && ele.dataset.id === id && ele !== node) {
                    return $global.guid();
                }
            }
            return id;
        }

        // 按定义属性，筛选单元组
        var bulletNodes = Array.from(container.querySelectorAll('.bullet'));
        var opNodes = [], index = 0;
        bulletNodes.forEach(node => {
            let obj = _.find(opNodes, { index, type: node.dataset.type, level: node.dataset.level });
            if ((!obj && !node.dataset.reset) || node.dataset.restart) {
                let sameNodes = this.getNextSameNodes(node);
                // ID定义
                let id = getBulletId(node);
                opNodes.push({
                    index,
                    id,
                    type: node.dataset.type,
                    level: node.dataset.level,
                    nodes: sameNodes
                });
                index++;
            }
        });
        // 再次整理
        if (opNodes.length) {
            // console.log('opNodes', opNodes);
            opNodes.forEach(item => {
                let isNumber = ['lower', 'num', 'num-index', 'tag-index'].includes(item.type);
                item.nodes.forEach((node, i) => {
                    node.dataset.id = item.id;
                    // 列项节点是否为空, 否则加上空占位符
                    let firstChild = node.firstChild;
                    if (!firstChild || firstChild.nodeName !== '#text') {
                        node.innerHTML = '&#8203' + node.innerHTML;
                    }

                    // 如果是编号的列项则重新做排序
                    if (isNumber) {
                        // 开始排序
                        if (i === 0 || node.dataset.restart) {
                            setStartNode(node);
                        } else {
                            clearStartNode(node, item.nodes[i - 1]);
                        }
                    }
                    node.removeAttribute('data-reset');
                    node.removeAttribute('data-mce-style');
                })
            })
            return true;
        }
        return false;
    },

    /**
     * @description 重置所有列项编号
     * @param {Object}  editor
     * @param {Element}  currNode
     */
    resetBulletNumberByBlock(editor = null, blocks = [], currNode = null) {
        editor = this.getActiveEditor();
        /* const clearNextNode = nextNode => {
			if (nextNode && nextNode.dataset.start) {
				nextNode.removeAttribute('data-start');
				nextNode.removeAttribute('style');
				nextNode.removeAttribute('data-mce-style');
			}
		}
		const resetBullet = (nodes, index, type) => {
            var areaBullerts = this.splitSameBullets(editor, nodes, type);
            if (areaBullerts.length) {
                for (let i=0; i<areaBullerts.length; i++) {
                    let childNodes = areaBullerts[i]['children'];
                    if (childNodes.length) {
                        for (let j=0; j<childNodes.length; j++) {
                            let node = childNodes[j];
                            let prevNode = childNodes[j-1];
                            let start = node.dataset.start || 0;
                            if ((j === 0 || node.dataset.start !== undefined) && (!prevNode || !prevNode.dataset.start)) {
                                node.dataset.start = j;
                                node.setAttribute('style', `counter-reset: ${type} ${j};`);
                            } else {
                                node.removeAttribute('data-start');
                                node.removeAttribute('style');
                                node.removeAttribute('data-mce-style');
                            }
                        }
                    }
                }
            }
		} */

        if (!blocks.length) {
            blocks = editor.getBody().querySelectorAll('.info-block:not(.cover):not(.catalogue):not(.fixed):not(.disabled)');
        }
        // 列出页面中所有的编号类型列项
        blocks.forEach(block => {
            if (block) {
                this.resetBulletNumberByParent(editor, block);
                /*
                // 处理字母项
                let lowerBullets = Array.from(block.querySelectorAll(`.bullet[data-type="lower"]`));
                if (lowerBullets.length) {
                    resetBullet(lowerBullets, 0, 'lower');
                }
                // 处理数字项
                let numBullets = Array.from(block.querySelectorAll(`.bullet[data-type="num"]`));
                if (numBullets.length) {
                    resetBullet(numBullets, 0, 'num');
                }
                // 处理特殊数字项
                let indexBullets = Array.from(block.querySelectorAll(`.bullet[data-type="num-index"]`));
                if (indexBullets.length) {
                    resetBullet(indexBullets, 0, 'index');
                }
                */
            }
        });
    },

    /**
     * @description 获取在同类容器中相同层级类型的所有列项
     * @param {Object}  editor
     * @param {Element}  currNode
     */

    getSameBullets(editor = null, currNode = null) {
        editor = this.getActiveEditor();
        var block = editor.dom.getParent(currNode, '.info-block');
        var type = currNode.dataset.type;
        var level = currNode.dataset.level;
        var sameBullets = [];

        // step1. 取出容器(嵌套在层级项中的)中所有同类列项
        var olContainer = editor.dom.getParent(currNode, '.ol-list') || editor.dom.getParent(currNode, '.appendix-list');
        if (olContainer) {
            // 先处理跨页的层级项
            if ($global.hasClass(olContainer, 'hide-list')) {
                let parentOl = block.previousElementSibling.querySelector(`div[data-outlineid="${olContainer.dataset.outlineid}"]:not('.info-block')`);
                if (parentOl) {
                    sameBullets = Array.from(parentOl.querySelectorAll(`.bullet[data-type="${type}"][data-level="${level}"]`));
                }
            }
            sameBullets = sameBullets.concat(Array.from(olContainer.querySelectorAll(`.bullet[data-type="${type}"][data-level="${level}"]`)));
            // 再取出后一页的所有同类列项
            let childOl = block.nextElementSibling.querySelector(`div[data-outlineid="${olContainer.dataset.outlineid}"]:not('.info-block')`);
            if (childOl) {
                sameBullets = sameBullets.concat(Array.from(childOl.querySelectorAll(`.bullet[data-type="${type}"][data-level="${level}"]`)));
            }
        }
        // step2 过滤掉首项的
    },

    /**
     * @description 重置节点后的兄弟节点编号属性
     * @param {Element}  currNode
     */
    resetBulletNumber(currNode = null) {
        var samBullets = this.getSameNodesByParam(currNode, { level: currNode.dataset.level, type: currNode.dataset.type });
        samBullets.forEach(ele => {
            ele.removeAttribute('style');
            ele.removeAttribute('data-start');
        });
        return currNode;
    },

    /**
     * @description 重置节点组的层级属性
     * @param {Array}  nodes
     * @param {String}  type 样式类型
     * @param {Boolean}  isResetId 重置ID
     * @param {String}  level 层级
     */
    resortBullet(nodes = [], type = 'circle', isResetId = false, level) {
        if (nodes.length) {
            var dataId = !isResetId ? nodes[0].dataset.id : $global.guid();
            type = type || nodes[0].dataset.type;
            level = level || nodes[0].dataset.level;
            let index = 0;
            nodes.forEach((ele, i) => {
                ele = this.setBulletAttr(ele, { id: dataId, start: ele.dataset.start, type, level });
                if (!$global.hasClass(ele, 'hide-list')) {
                    index++;
                }
            })
        }
    },

    /**
     * @description 设置列项的属性数据
     * @param {Element} node
     * @param {Object} params 序号 {id, index=0, type='circle', level=0}
     * @param {String} type 样式
     * @param {Int} level 层级
     */
    setBulletAttr(node = null, params = {}) {
        for (let key in params) {
            if (params[key] !== undefined) {
                node.dataset[key] = params[key];
            }
        }
        if (params['type'] && params['start'] !== undefined) {
            node.style['counter-reset'] = `${params['type']} ${params['start']}`;
        }
        node.removeAttribute('data-mce-style');
        return node;
    },

    /**
     * @description 改变列项层级
     * @param {Array} nodes
     * @param {Int} increase
     * @param {Element} currNode
     */
    changeLevel(nodes = [], increase = -1, currNode = null) {
        nodes.forEach(node => {
            if (node !== currNode) {
                let nodeLevel = parseInt(node.dataset.level) + increase;
                node.dataset.level = nodeLevel;
            }
        })
    },

}
