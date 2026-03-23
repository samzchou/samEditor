
import $global from "@/utils/global";
export default {
    nextBulletType(type) {
        switch(type) {
            case 'circle':
                return 'hollow-circle';
            case 'num':
                return 'line';
            case 'lower':
                return 'num';
            case 'line':
                return 'circle';
            case 'hollow-circle':
                return 'square';
            case 'square':
                return 'hollow-square';
            case 'hollow-square':
                return 'lower';
        }
    },
    /**
     * 改变层级序号
     * @param {Object} nodes
     * @param {Object} level
     */
    changLevel(nodes, level) {
        nodes.forEach(ele => {
            ele.dataset.level = level;
        });
    },
    // 设置列项的属性数据和样式
    setBulletNodeAttr(ele=null, index=0, type='circle', level=0) {
        /* if(index === 0 || ele.dataset.cross || ele.dataset.reset) {  // cross:元素节点是跨页的
            ele.dataset.reset = type;
            tinyMCE.activeEditor.dom.setStyle(ele, 'counter-reset', `${type} ${index}`);
        } else {
            ele.removeAttribute('style');
            ele.removeAttribute('data-mce-style');
            ele.removeAttribute('data-reset');
        } */
        ele.dataset.reset = type;
        tinyMCE.activeEditor.dom.setStyle(ele, 'counter-reset', `${type} ${index}`);

        ele.dataset.level = level;
        ele.dataset.type = type;
        ele.dataset.start = index;
        return ele;
    },
    resortBullet(nodes=[], type='circle', isResetId=false, level) {
        var dataId = !isResetId ? nodes[0].dataset.id : $global.guid();
        level = level || nodes[0].dataset.level;
        // debugger
        let index = 0;
        nodes.forEach((ele, i) => {
            ele.dataset.id = dataId;
            ele = this.setBulletNodeAttr(ele, index, type, level);
            if(!tinyMCE.activeEditor.dom.hasClass(ele, 'hide-list')) {
                index++;
            }
        })
    },
    getAllSameNodesById(id, hasNode=null) {
        var body = tinyMCE.activeEditor.getBody();
        var nodes = body.querySelectorAll(`.bullet[data-id="${id}"]:not(.hide-list)`);
        if(hasNode) {
            for(let i=0; i < nodes.length; i++) {
                let node = nodes[i];
                if(node === hasNode) {
                    return i;
                }
            }
        }
        return nodes;
    },
    getNextAllByLevel(node) {
        const level = parseInt(node.dataset.level);
        var arr = [];
        const getNode = ele => {
            let eleLevel = ele.dataset.level ? parseInt(ele.dataset.level) : undefined;
            if(eleLevel && eleLevel >= level) {
                arr.push(ele);
                getNode(ele.nextElementSibling);
            }
        }
        getNode(node);
        return arr;
    },
    concatLevelNodes(samNodes=[], concats=[]) {
        concats.forEach(ele => {
            let matchNode;
            for(let i=0; i<samNodes.length; i++) {
                if(!ele === samNodes[i]) {
                    matchNode = ele;
                    break;
                }
            }
            if(matchNode) {
                samNodes.push(matchNode)
            }
        });
        return samNodes;
    },

    getAllPrevBullet(node, level='') {
        var nodes = [];
        const getPrev = (ele) => {
            if(ele && ele.dataset.level === String(level) ) {
                nodes.push(ele);
                getPrev(ele.previousElementSibling);
            }
        }
        getPrev(node.previousElementSibling);
        return nodes;
    },
    /**
     * 获取同级的上层节点(包括上个页面的节点)
     */
    getPrevByLevel(node=null, level='0') {
        // 先从本页中查找
        // debugger
        let parentNode = node.parentNode;
        let currBlock = tinyMCE.activeEditor.dom.getParent(node, 'div.info-block');
        let prevNodes = this.getAllPrevBullet(node, level);
        let sameLevelNode, findNodes = [];

        if(!prevNodes.length) {
            let prevBlock = currBlock.previousElementSibling;
            if(prevBlock) {
                if($global.hasClass(parentNode,'ol-list') && $global.hasClass(parentNode,'hide-list')) {
                    let olList = prevBlock.querySelector(`.ol-list[data-index="${parentNode.dataset.index}"]`);
                    if(olList) {
                        prevNodes = olList.querySelectorAll(`.bullet[data-level="${level}"]`);
                    }
                } else {
                    prevNodes = prevBlock.querySelectorAll(`.bullet[data-level="${level}"]`);
                }
            }
        }

        if(prevNodes.length) {
            sameLevelNode = prevNodes[prevNodes.length - 1];
        }
        return sameLevelNode;
    },

    // 获取同级同类型元素
    getSamLevelNodes(node=null, type='circle', level='0', param={getPrev:true, getNext:true}) {
        type = type || node.dataset.type;
        level = level || node.dataset.level;
        let allNodes = [], prevPageNodes = [], nextPageNodes = [];
        // 获取上一个页面的同级同类型元素
        let infoBlock = tinyMCE.activeEditor.dom.getParent(node, 'div.info-block');
        let olList = tinyMCE.activeEditor.dom.getParent(node, 'div.ol-list');
        let samOlList = null;
        if(infoBlock.previousElementSibling) {
            // 是否包含在层级项中
            if(olList && $global.hasClass(olList, 'hide-list')) {
                // 上个页面的最后一个元素
                let prevPageLastELe = $global.getLastNodeInContainer(infoBlock.previousElementSibling);
                // 找出上一个页面的相同层级项
                samOlList = infoBlock.previousElementSibling.querySelector(`div.ol-list[data-index="${olList.dataset.index}"]`);
                if(samOlList) {
                    let prevNodes = samOlList.querySelectorAll(`.bullet[data-level="${level}"][data-type="${type}"]`);
                    if(prevNodes.length && prevPageLastELe === prevNodes[prevNodes.length - 1]) {
                        prevPageNodes = this.getSameNodes(prevNodes[prevNodes.length - 1], level, type, true);
                    }
                }
            }
        }
        // 获取下一个页面的同级同类型元素
        if(infoBlock.nextElementSibling) {
            if(olList) {
                let nextPageFirstELe = $global.getFirstNodeInContainer(infoBlock.nextElementSibling);
                samOlList = infoBlock.nextElementSibling.querySelector(`div.ol-list[data-index="${olList.dataset.index}"]`);
                if(samOlList) {
                    let nextNodes = samOlList.querySelectorAll(`.bullet[data-level="${level}"][data-type="${type}"]`);
                    if(nextNodes.length && nextPageFirstELe === nextNodes[0]) {
                        nextPageNodes = this.getSameNodes(nextNodes[0], String(level), type, false);
                        // allNodes = allNodes.concat(nextPageNodes);
                    }
                }
            }
        }

        // 本区域前面同级同类型元素
        let selfPrevNodes = this.getSameNodes(node.previousElementSibling, String(level), type, true);
        allNodes = allNodes.concat(selfPrevNodes);

        // 加入本身节点
        allNodes.push(node);

        // 本区域后面同级同类型元素
        let selfNextNodes = this.getSameNodes(node.nextElementSibling, String(level), type, false);
        allNodes = allNodes.concat(selfNextNodes);

        // 本区域同级同类型元素排序下
        allNodes = this.sortNodeByIndex(allNodes);

        return  prevPageNodes.concat(allNodes).concat(nextPageNodes);
    },
    getSameNodes(ele, level, type, isPrev=true) {
        let nodes = [];
        const getNodes = node => {
            if(node) {
                let eleLevel = node.dataset ? node.dataset.level : undefined;
                let eleType = node.dataset ? node.dataset.type : undefined;
                if(eleLevel && eleType) {
                    if(eleLevel == level && eleType === type && $global.hasClass(node, 'bullet')) {
                        nodes.push(node);
                    }
                    if(parseInt(eleLevel) >= parseInt(level)) {
                        let continueEle = isPrev ? node.previousElementSibling : node.nextElementSibling;
                        getNodes(continueEle);
                    }
                }
            }
        }
        getNodes(ele);
        return nodes;
    },

    getIndex(nodes, currNode) {
        let index = -1;
        for(let i=0; i<nodes.length; i++) {
            if(nodes[i] === currNode) {
                index = i;
                break;
            }
        }
        return index;
    },
    // 节点数组重新排序
    sortNodeByIndex(nodes) {
        let arr = [];
        nodes.forEach(ele => {
            let index = tinyMCE.activeEditor.dom.nodeIndex(ele);
            arr.push({ele, index});
        })
        arr = _.sortBy(arr, ['index']);
        let lists = [];
        arr.forEach(item => {
            lists.push(item.ele);
        });
        return lists;
    },
    // 同步同级同类型前元素以及后元素
    syncNextBullet(ele=null, type='circle', level=0) {
        let pid = $global.guid();

        ele.dataset.id = pid;
        ele.dataset.type = type;
        ele.dataset.level = level;
        let nodes = this.getAllSameNodesById(pid);
        this.resortBullet(nodes, type);

        // debugger
        let sameLevelNode = this.getSamLevelNodes(ele, type, level);
        console.log(sameLevelNode);
        if(sameLevelNode && sameLevelNode.length) {
            this.resortBullet(sameLevelNode, type);
        }
    },
    /**
     * 同步到上一个节点组
     * @param {Object} currNode
     * @param {Object} level
     */
    syncPrevBullet(currNode, level) {
        let sourceType = currNode.dataset.type;
        let nextNodes = this.getNextAllSameNodes(currNode, false);
        currNode.dataset.level = level;

        let sameLevelNode = this.getPrevByLevel(currNode, level);
        if(sameLevelNode) {
            // 是否在同一个页面中
            let prevBlock = tinyMCE.activeEditor.dom.getParent(sameLevelNode, '.info-block');
            let currBlock = tinyMCE.activeEditor.dom.getParent(currNode, '.info-block');
            if(prevBlock !== currBlock) {
                currNode.dataset.cross = true;
            }
            let pid = sameLevelNode.dataset.id;
            let type = sameLevelNode.dataset.type;
            currNode.dataset.id = pid;
            currNode.dataset.type = type;
            currNode.removeAttribute('style');
            currNode.removeAttribute('data-mce-style');
            currNode.removeAttribute('data-reset');
            let nodes = this.getAllSameNodesById(pid);
            this.resortBullet(nodes, type, false, level);
        }

        // 同步处理下一层节点组，重新定义编号和ID
        if(nextNodes.length) {
            this.resortBullet(nextNodes, sourceType, true);
        }
    },
    /**
     * 取出当前节点后的所有同级同类型节点
     */
    getNextAllSameNodes(node=null, isContain=true) {
        let arr = isContain ? [node] : [];
        let nodes = this.getAllSameNodesById(node.dataset.id);
        let index = this.getIndex(nodes, node);
        for(let i=0; i<nodes.length; i++) {
            if(i > index) {
                arr.push(nodes[i]);
            }
        }
        return arr;
    },
    /**
     * 获取相同层级相同类型的节点项
     */
    filterNodes(nodes=[], level=undefined, type=undefined) {
        var arr = [];
        for(let i=0; i<nodes.length; i++) {
            let node = nodes[i];
            if(level && type && node.dataset.level == level && node.dataset.type == type) {
                arr.push(node);
            } else if (level && node.dataset.level == level) {
                arr.push(node);
            } else if (type && node.dataset.level == type) {
                arr.push(node);
            }
            // 当层级小于当前层级时就跳出
            if(parseInt(node.dataset.level) < parseInt(level)) {
                break;
            }
            continue;
        }
        return arr;
    }
}
