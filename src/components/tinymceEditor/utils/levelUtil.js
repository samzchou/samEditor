/**
 * ===================================================================================================================
 * @module
 * @desc 条目层级项处理模块
 * @author sam 2022-01-03
 * ===================================================================================================================
 */

import $global from "@/utils/global";

export default {
    editor: null,
    vm: null,
    excutingLevel: false,
    updateVm(vm) {
        this.vm = vm;
    },
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
    mergeTextNodes(ele) {
        if (ele && ele.nodeName === '#text') {
            while (ele.nextSibling && ele.nextSibling.nodeName === '#text') {
                ele.nodeValue += ele.nextSibling.nodeValue;
                ele.parentNode.removeChild(ele.nextSibling);
            }
        }
    },

    /**
     * @description 重置层级项段前段后
     * @param {Element} container
     */
    resetPadding(container=null, setLine=false) {
        const editor = this.getActiveEditor();
        if (!editor || !editor.getBody()) {
            return;
        }
        container = container || editor.getBody().querySelector('.page-container');
        if (!container) {
            return;
        }

        /*const checkTitleError = node => {
            var str = '';
            var childNodes = Array.from(node.childNodes);
            for (let ele of childNodes) {
                if (['P','DIV'].includes(ele.nodeName)) {
                    break;
                }
                if (['SPAN','EM','STRONG','SUB','SUP'].includes(ele.nodeName)) {
                    str = '包含' + ele.nodeName + '标签';
                }
            }
            return str;
        }*/

        const setStyleLiNode = listNodes => {
            for (let liNode of listNodes) {
                this.mergeTextNodes(liNode);
                let firstChild = liNode.firstChild;
                if ($global.hasClass(liNode, 'hide-list') || !liNode.dataset.bookmark) {
                    continue;
                }


                // debugger
                // 在合并页面时章节条款过高则设置样式
                let error = this.checkError(liNode, editor.dom.getParent(liNode, '.info-block'));
                if (error && liNode.dataset.bookmark) {
                    $global.addClass(liNode, 'line');
                } else {
                    $global.removeClass(liNode, 'line');
                }
                // let nextLi = liNode.nextElementSibling;

                /*if (setLine && !$global.hasClass(liNode, 'line')) {
                    let error = this.checkError(liNode, editor.dom.getParent(liNode, '.info-block'));
                    if (error) {
                        $global.addClass(liNode, 'line');
                    }
                }*/

                // 检查层级项是否符合规范,如第一个节点非文本节点则添加占位元素
                if (!firstChild || !['#text','SPAN','EM','SUB','SUP'].includes(firstChild.nodeName)) {
                    liNode.innerHTML = '&#8203' + liNode.innerHTML;
                }


                // 先清除样式类
                $global.removeClass(liNode, 'top-margin');
                // 无题条则直接忽略
                if (!liNode.dataset.bookmark) {
                    continue;
                }

                let liIndex = editor.dom.nodeIndex(liNode);
                let prevNode = liNode.previousElementSibling;
                if (prevNode && ($global.hasClass(prevNode, 'ol-list') || $global.hasClass(prevNode, 'appendix-list') || $global.hasClass(prevNode, 'header-title'))) {
                    let hasPara = Array.from(prevNode.querySelectorAll('p,div,table'));
                    // 上一个层级项仅只有标题的情况下，当前层级项减少间隔，加入class类名 top-margin !prevNode.childElementCount ||
                    if ($global.hasClass(prevNode, 'header-title')) {
                        $global.addClass(liNode, 'top-margin');
                        continue;
                    }
                    // 上一层级无段落图表格等，且为有条题
                    if (!hasPara.length && prevNode.dataset.bookmark && !$global.hasClass(prevNode, 'line') && liNode.dataset.index.length > 1) {
                        $global.addClass(liNode, 'top-margin');
                    }
                } else if (!prevNode && !$global.hasClass(prevNode, 'hide-list')) {
                    $global.addClass(liNode, 'top-margin');
                }

                // 删除隐藏层级项的空白占位元素
                if ($global.hasClass(liNode, 'hide-list')) {
                    if (['#text','BR'].includes(firstChild.nodeName) && firstChild.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '') {
                        firstChild.remove();
                    }
                }
            }
        }

        if ($global.hasClass(container, 'info-block')) {
            var listNodes = Array.from(container.querySelectorAll('.ol-list[data-index]:not(.disabled),.appendix-list[data-index]:not(.disabled)'));
            setStyleLiNode(listNodes);
        } else {
            var blocks = Array.from(container.querySelectorAll('.info-block:not(.fixed):not(.disabled):not(.pageHide)'));
            for (let block of blocks) {
                var listNodes = Array.from(block.querySelectorAll('.ol-list[data-index]:not(.disabled),.appendix-list[data-index]:not(.disabled)'));
                setStyleLiNode(listNodes);
            }
        }
    },

    /**
     * @description 根据层级获取上一个层级项节点
     * @param {Element} currNode
     * @param {Element} Level 层级
     */
    getPrevNodeByIndexLevel(currNode = null, Level = 1) {
        const getNode = node => {
            var prevNode = node.previousElementSibling;
            if (prevNode) {
                if (prevNode.dataset.index && prevNode.dataset.index.split(".").length === Level) {
                    return prevNode;
                }
                return getNode(prevNode);
            }
            return null;
        }
        return getNode(currNode);
    },
    /**
     * @description 根据层级源获取上一个层级项节点
     * @param {Element} currNode
     * @param {Element} sourceStr 层级源
     * @param {Boolean} isLocked 是否为锁定
     */
    getPrevNodeBySource(currNode = null, sourceStr = '', isLocked = false) {
        const getNode = node => {
            var prevNode = node.previousElementSibling;
            if (prevNode) {
                if (prevNode.dataset.index && (prevNode.dataset.index === sourceStr || (isLocked && prevNode.dataset.owner))) {
                    return prevNode;
                }
                return getNode(prevNode);
            }
            return null;
        }
        return getNode(currNode);
    },

    /**
     * @description 根据节点的source查找父级元素
     * @param {Element}  container
     * @param {String}  sourceStr
     */
    getParentBySource(container = null, sourceStr = '') {
        const getNode = source => {
            var parentNode = container.querySelector(`[data-index="${source}"]`);
            if (!parentNode) {
                var sourceSlit = source.split('.');
                source = sourceSlit.slice(0, sourceSlit.length - 1).join(".");
                if (source) {
                    parentNode = getNode(source);
                }
            }
            return parentNode;
        }
        return getNode(sourceStr);
    },
    /**
     * @description 规范章条目
     * @param {Object}  editor
     */
    formatterEmptyNode(editor = null) {
        if (!editor || !editor.getBody()) {
            return;
        }
        const pageContainer = editor.getBody().querySelector('.page-container');
        if (!pageContainer) {
            return;
        }
		const blocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.fixed):not(.disabled):not(.pageHide)'));
		blocks.forEach(block => {
			const liNodes = Array.from(pageContainer.querySelectorAll('div.ol-list:not(.hide-list),div.appendix-list:not(.hide-list)'));
			liNodes.forEach(liNode => {
				if (liNode.dataset.source && liNode.dataset.source !== '0') {
					$global.removeClass(liNode, 'level0');
				}
				let firstNode = liNode.firstChild;
				if (!firstNode || !['#text','SPAN','EM','SUB','SUP'].includes(firstNode.nodeName)) { //  && firstNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === ''
					liNode.innerHTML = '&#8203' + liNode.innerHTML;
				}
			});
		});
        // 同时再处理层级项的DOM树关系
        this.repairLevel(editor, pageContainer);
    },

    /**
     * @description 节点降低层级序号
     * @param {Element}  currNode
     */
    reduceLevel(node = null) {
        var indexArr = node.dataset.index.split('.');
        if (indexArr.length && indexArr.length > 1) {
            node.dataset.source = indexArr.slice(0, indexArr.length - 2).join(".");
            node.dataset.index = indexArr.slice(0, indexArr.length - 1).join(".");
        }
        return node;
    },

    /**
     * @description 重置所有节点的属性
     * @param {Array}  nodes
     */
    sortNodesAttrs(nodes = []) {
        for (let i = 0; i < nodes.length; i++) {
            let ele = nodes[i];
            let nextNode = nodes[i + 1];
            if (nextNode) {
                let eleIndex = ele.dataset.index.split('.').length;
                let nextIndex = nextNode.dataset.index.split('.').length;
                if (nextIndex > eleIndex) {
                    nextNode.dataset.parentid = ele.dataset.id;
                } else if (nextIndex === eleIndex) {
                    nextNode.dataset.parentid = ele.dataset.parentid;
                }
            }
        }
    },

    /**
     * @description 根据当前节点的source名获取所有相同层级项
     * @param {Object} editor
     * @param {Element}  currNode
     */
    getSameNextNodesBySource(editor = null, currNode = null) {
        if (!currNode) {
            return;
        }
        var pageContainer = editor.getBody().querySelector('.page-container');
        var nodeArray = [];
        var nextNodes = pageContainer.querySelectorAll(`[data-source="${currNode.dataset.source}"][data-outlinetype="${currNode.dataset.outlinetype}"]:not(.hide-list)`);
        if (nextNodes.length) {
            var eleIndex = -1;
            Array.from(nextNodes).forEach((ele, index) => {
                if (ele === currNode) {
                    eleIndex = index;
                }
                if (index > eleIndex && eleIndex > -1) {
                    nodeArray.push(ele);
                }
            })
        }
        return nodeArray;
    },

    clearLevelNode(levelNodes = [], pageContainer = null) {
        const editor = this.getActiveEditor();
        const getParentNode = node => {
            let index = node.dataset.index.split(".");
            if (index.length > 1) {
                index = index.slice(0, index.length - 1);
                return pageContainer.querySelector(`.ol-list[data-index="${index.join('.')}"],.appendix-list[data-index="${index.join('.')}"]`) || editor.dom.getParent(node, '.info-block');
            }
            return null;
        };
        // 重置下级联关系
        const filterLiNodes = (node, index) => {
            let liNodes = [];
            for (let i = index; i < levelNodes.length; i++) {
                let liNode = levelNodes[i];
                if (liNode.dataset.index.split(".").length === node.dataset.index.split(".").length + 1) {
                    liNodes.push(liNode);
                } else if (liNode.dataset.index.split(".").length <= node.dataset.index.split(".").length) {
                    break;
                }
            }
            liNodes.forEach(liNode => {
                liNode.dataset.parentid = node.dataset.outlineid;
                liNode.dataset.source = node.dataset.index;
            })
        }

        let arrList = [];
        levelNodes.forEach((node, index) => {
            if (!$global.hasClass(node, 'disabled')) {
                filterLiNodes(node, index + 1);
                // 去除占位或加入占位
                let firstEle = node.firstChild;
                // 条题如果没有文字则加上占位符号
                if ((!firstEle || !['#text', 'SPAN', 'BR'].includes(firstEle.nodeName)) && !$global.hasClass(node, 'hide-list')) {
                    node.innerHTML = '&#8203' + node.innerHTML;
                }
                // 删除换行符
                let childLens = node.childNodes.length;
                node.childNodes.forEach(child => {
                    if (child.nodeName === 'BR' && childLens > 1) {
                        child.remove();
                    }
                });

                /* if (index && $global.hasClass(node, 'level0')) {
                    $global.removeClass(node, 'level0')
                } */

                let obj = _.find(arrList, { outlineid: node.dataset.outlineid, contentid: node.dataset.contentid });
                if (obj) {
                    obj.outlineid = $global.guid();
                    obj.contentid = $global.guid();
                    let parentNode = getParentNode(node);
                    if (parentNode) {
                        obj.parentid = parentNode.dataset.outlineid;
                        obj.source = parentNode.dataset.index || '0';
                    }
                } else {
                    obj = {
                        outlineid: node.dataset.outlineid,
                        contentid: node.dataset.contentid,
                        parentid: node.dataset.parentid,
                        source: node.dataset.source
                    }
                }
                arrList.push(obj);
                node.dataset.parentid = obj.parentid;
                node.dataset.outlineid = obj.outlineid;
                node.dataset.contentid = obj.contentid;

                node.dataset.source = obj.source || '0';
                if (node.dataset.bookmark) {
                    node.dataset.bookmark = obj.outlineid;
                }
                if (node.dataset.index.split(".").length === 1 && $global.hasClass(node, 'ol-list')) {
                    node.removeAttribute('data-source');
                }

            }
        });
        return levelNodes;
    },

    checkError(node, block) {
        if (node.dataset.bookmark) {
            var BeforeStyle = window.getComputedStyle(node, ':before');
            var str = '';
            var childNodes = Array.from(node.childNodes);
            for (let i=0; i<childNodes.length; i++) {
                let ele = childNodes[i];
                if (['#text','SPAN','STRONG','EM','SUP','SUB', 'IMG'].includes(ele.nodeName)) {
                    str += ele.nodeName === '#text' ? ele.textContent : ele.innerHTML;
                } else if (['P','TABLE','DIV'].includes(ele.nodeName)) {
                    break;
                }
            }
            if (str !== '') {
                let beforeHeight = parseFloat(BeforeStyle.marginTop) + parseFloat(BeforeStyle.marginBottom) + parseFloat(BeforeStyle.height);
                let cloneNode = node.cloneNode();
                cloneNode.innerHTML = str;
                $global.insertAfter(cloneNode, node);
                let divHeight = cloneNode.offsetHeight;
                cloneNode.remove();
                /* let div = document.createElement('div');
                div.className = 'temp-node';
                div.innerHTML = (node.dataset.prev||'') + node.dataset.index + "&nbsp;&nbsp;" + str;
                block.appendChild(div);
                let divHeight = div.offsetHeight;
                div.remove(); */
                if (divHeight > beforeHeight + 2) {
                    return '章条目：' + (node.dataset.prev ? node.dataset.prev + '.' : '') + node.dataset.index + ' 标题内容过长，建议设置为无题条！'
                }
            }
        }
        return '';
    },

    /**
     * @description 所有页面章节条目重置序号
     * @param {Object} editor
     * @param {Boolean} isNew 是否新建层级项
     */
    sortLevel(editor = null, isNew = false, saveCheckError = false) {
        editor = this.getActiveEditor();
        if (!editor || !editor.getBody() || this.vm.editorSetting.parseStruct || this.excutingLevel) { // 
            return false;
        }
        // 开始执行，避免重复处理
        this.excutingLevel = true;

        /*const checkError = (node, block) => {
            if (node.dataset.bookmark) {
                var BeforeStyle = window.getComputedStyle(node, ':before');
                var str = '';
                var childNodes = Array.from(node.childNodes);
                for (let i=0; i<childNodes.length; i++) {
                    let ele = childNodes[i];
                    if (['#text','SPAN','STRONG','EM','SUP','SUB', 'IMG'].includes(ele.nodeName)) {
                        str += ele.nodeName === '#text' ? ele.textContent : ele.innerHTML;
                    }
                    if (['P','TABLE','DIV'].includes(ele.nodeName)) {
                        break;
                    }
                }
                if (str !== '') {
                    let beforeHeight = parseFloat(BeforeStyle.marginTop) + parseFloat(BeforeStyle.marginBottom) + parseFloat(BeforeStyle.height);
                    let div = document.createElement('div');
                    div.className = 'temp-node';
                    div.innerHTML = str;
                    block.appendChild(div);
                    let divHeight = div.offsetHeight;
                    div.remove();
                    if (divHeight > beforeHeight + 2) {
                        return '章条目：' + (node.dataset.prev ? node.dataset.prev + '.' : '') + node.dataset.index + ' 内容高度太大，建议设置为无题条！'
                    }
                }
            }
            return '';
        }*/
        const hasTableImg = node => {
            var defNode = node.querySelector('table') || node.querySelector('img');
            return defNode !== null;
        }

        const pageContainer = editor.getBody().querySelector('.page-container');
        // const activeBlock = pageContainer.querySelector('div.info-block:not(.pageHide)');
        const activeBlock = pageContainer.querySelector('div.info-block.active') || pageContainer.querySelector('div.info-block:not(.pageHide)');
        if (!activeBlock || $global.hasClass(activeBlock, 'fixed')) {
            this.excutingLevel = false;
            return false;
        }

        const isReadonly = $global.hasClass(pageContainer, 'readonly');
        if (pageContainer) {
            var errors = [];
            // var blocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.fixed):not(.disabled)'));
            var blocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.fixed):not(.pageHide)'));
            // 协同模式下被锁定了大纲
            const lockedAllOutline = this.vm.editorSetting.author && this.vm.editorSetting.author.lockedAll && pageContainer.querySelector('.info-block.disabled') !== null;
            if (lockedAllOutline) {
                blocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.fixed):not(.disabled):not(.pageHide)'));
            }
            var olIndex = 1, appendixIndex = 1;
            blocks.forEach(block => {
                var allLevelNodes = Array.from(block.querySelectorAll('.ol-list[data-index],.appendix-list[data-index]'));
                allLevelNodes = this.clearLevelNode(allLevelNodes, pageContainer);
                for (let i = 0; i < allLevelNodes.length; i++) {
                    let node = allLevelNodes[i];
                    // add By sam.shen 2024-12-1
                    if (i === 0) {
                        if ($global.hasClass(node, 'ol-list') || ($global.hasClass(node, 'appendix-list'))) { // 或者航司模板  && this.vm?.pageData && this.vm.pageData?.stdKind === 901
                            olIndex = Number(node.dataset.index);
                        } else {
                            appendixIndex = Number(node.dataset.index);
                        }
                    }
                    // 依次重置编号
                    if (node.dataset.index && node.dataset.index.split('.').length === 1) {
                        if (!node.dataset.bookmark) { // 章标题必须为题条
                            node.dataset.bookmark = node.dataset.outlineid;
                        }
                        if ($global.hasClass(node, 'ol-list')) {
                            // 如果在锁定状态下则按当前章标题定义层级序号
                            if (lockedAllOutline) {
                                olIndex = Number(node.dataset.index);
                            }
							/* if (/^[A-Z]+[0-9]+$/.test(node.dataset.index)) {
								debugger
							} */
							
                            if (node.dataset.index != olIndex && this.vm.pageData?.stdKind !== this.vm.editorSetting.tmplType) {
                                node.dataset.index = olIndex;
                            }
                            if (!$global.hasClass(node, 'hide-list')) {
                                olIndex++;
                            }
                        } else if ($global.hasClass(node, 'appendix-list')) {
                            if (!this.vm?.pageData || this.vm.pageData?.stdKind !== this.vm.editorSetting.tmplType) { // 非航司模板
                                if (lockedAllOutline) {
                                    appendixIndex = Number(node.dataset.index);
                                }

                                if (node.dataset.index != appendixIndex) {
                                    node.dataset.index = appendixIndex;
                                }
                                if (!$global.hasClass(node, 'hide-list')) {
                                    appendixIndex++;
                                }
                            } else {
                                if (node.dataset.index != olIndex) {
                                    node.dataset.index = olIndex;
                                }
                                if (!$global.hasClass(node, 'hide-list')) {
                                    olIndex++;
                                }
                            }
                        }
                    }

                    if (!node.dataset.outlinetype) {
                        node.dataset.outlinetype = 6;
                    }

                    // 层级项是否为空
                    if (node.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '' && !hasTableImg(node)) {
                        node.innerHTML = '&#8203';
                    }
                    // 层级项章标题高度大于样式Before高度
                    let err = this.checkError(node, block);
                    if (err !== '' && !isReadonly) {
                        errors.push(err);
                    }

                    // 判断是否被包裹在段落元素中
                    if (node.parentNode && node.parentNode.nodeName === 'P') {
                        editor.dom.insertAfter(node, node.parentNode);
                        if (node.parentNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '') === '' && !hasTableImg(node.parentNode)) {
                            node.parentNode.remove();
                        }
                    }

                    let nodeIndex = node.dataset.index.split(".");
                    // 强制将页面的第一个错误层级项索引重置为1
                    if (i === 0 && nodeIndex.length > 1 && !$global.hasClass(node, 'hide-list')) {
                        node.dataset.index = '1';
                    }

                    if (nodeIndex.length > 1) {
                        // let parentLevel = pageContainer.querySelector(`[data-outlineid="${node.dataset.parentid}"]:not(.info-block)`);
                        let parentLevel = block.querySelector(`[data-outlineid="${node.dataset.parentid}"]`);
                        // 如果数据错误了，则重新定义结构
                        if (!parentLevel) {
                            let prevNode = allLevelNodes[i - 1];
                            if (prevNode) {
                                if (node.dataset.index.split('.').length === prevNode.dataset.index.split('.').length) {
                                    node.dataset.index = prevNode.dataset.index;
                                    node.dataset.source = prevNode.dataset.source;
                                    node.dataset.parentid = prevNode.dataset.parentid;
                                } else if (node.dataset.index.split('.').length > prevNode.dataset.index.split('.').length) {
                                    node.dataset.source = prevNode.dataset.index;
                                    node.dataset.parentid = prevNode.dataset.outlineid;
                                }
                            }
                        }
                    }
                    // 去除enlock
                    if ($global.hasClass(node, 'enlock') && !node.dataset.owner) {
                        $global.removeClass(node, 'enlock');
                    }
                }
            });

            if (errors.length && saveCheckError) {
                return errors;
            }

            // 章节层级项
            let levelNodes = Array.from(activeBlock.querySelectorAll('.ol-list[data-index]'));
            // debugger
            levelNodes.forEach(node => {
                if (node.dataset.index && node.dataset.index.split('.').length === 1) {
                    // /^[a-zA-Z0-9]+$/.test(ol.dataset.index)
                    if (!node.dataset.appendixNo && activeBlock.dataset.appendixNo && this.vm.pageData?.stdKind === this.vm.editorSetting.tmplType) {
                        node.dataset.appendixNo = activeBlock.dataset.appendixNo;
                    }
                    requestAnimationFrame(() => {
                        this.resetChildLevel(editor, node, node.dataset.id || node.dataset.outlineid);
                    })
                }
            });
            // 附录层级项
            let appendixNodes = Array.from(activeBlock.querySelectorAll('.appendix-list[data-source="0"]'));
            let appendIndexArr = [];
            appendixNodes.forEach(node => {
                let parentBlock = editor.dom.getParent(node, '.info-block');
                let letter = parentBlock.dataset.letter;
                if (letter) {
                    node.dataset.prev = letter;
                }
                let uuid = node.dataset.id || node.dataset.outlineid;
                let filterList = appendIndexArr.filter(o => { return o.letter === node.dataset.prev  });
                if (!$global.hasClass(node, 'hide-list')) {
                    node.dataset.index = filterList.length + 1;
                    appendIndexArr.push({ letter: node.dataset.prev, id: uuid })
                    requestAnimationFrame(() => {
                        this.resetChildLevel(editor, node, uuid);
                    })
                }
                // }
            });
            this.excutingLevel = false;
            return true;
        }
        this.excutingLevel = false;
        return false;
    },

    // 处理层级项之间的间隔空间，解决输出word时页面底部留白较多的问题 addBy sam.shen 2023-11-24
    /* setLevelGutter(editor) {
        editor = editor || this.getActiveEditor();
        if (!editor || !editor.getBody() || this.vm.editorSetting.parseStruct) {
            return false;
        }
        const pageContainer = editor.getBody().querySelector('.page-container');
        if (pageContainer) {
            var blocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.fixed):not(.disabled)'));
            for (let block of blocks) {
                var listNodes = Array.from(block.querySelectorAll('.ol-list[data-index]:not(.disabled),.appendix-list[data-index]:not(.disabled)'));
                for (let liNode of listNodes) {
                    let liIndex = editor.dom.nodeIndex(liNode);
                    let prevNode = liNode.previousElementSibling;
                    if (prevNode && ($global.hasClass(prevNode, 'ol-list') || $global.hasClass(prevNode, 'appendix-list'))) {
                        // 上一个层级项仅只有标题的情况下，当前层级项减少间隔，加入class类名 top-margin
                        if (!prevNode.childElementCount) {
                            $global.addClass(liNode, 'top-margin');
                        }
                    } else if (!prevNode && !$global.hasClass(prevNode, 'hide-list')) {
                        $global.addClass(liNode, 'top-margin');
                    }
                }
            }
        }
    }, */

    /**
     * @description 获取相同层级的同类层级项
     * @param {Array}  nodes
     * @param {Element}  currNode
     */
    findNodeByLevelIndex(nodes = [], currNode = null, sortIndex = 0) {
        let currCls = currNode.getAttribute('class');
        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i];
            let cls = node.getAttribute('class');
            if (currCls === cls && i < sortIndex && node.dataset.id !== currNode.dataset.id && node.dataset.prev === currNode.dataset.prev && node.dataset.index.split('.').length === currNode.dataset.index.split('.').length) {
                return node;
            }
        }
        return null;
    },

    getPrevLevelNode(currNode, sameLevel = false) {
        const getPrevNode = node => {
            if (node) {
                let flag = node.dataset.index !== null;
                if (sameLevel) {
                    flag = node.dataset.index.split('.').length === currNode.dataset.index.split('.').length;
                }
                if (flag) {
                    return node;
                } else {
                    return getPrevNode(node.previousElementSibling);
                }
            }
            return null;
        }
        return getPrevNode(currNode.previousElementSibling);
    },

    /**
     * @description 重置子节点层级序号
     * @param {Object} editor
     * @param {Element} currNode 当前节点
     * @param {String} dataId   节点ID
     * @param {Boolean} isAssignOutline 是否为协同分配
     */
    resetChildLevel(editor = null, currNode = null, dataId = '', isAssignOutline = false) {
        // var allNodes = [];
        const pageContainer = editor.getBody().querySelector('.page-container');
        if (pageContainer) {
            // 同步层级题条或无题条
            const setSameStyle = (node) => {
                const block = editor.dom.getParent(node, '.info-block');
                const parentId = node.dataset.parentid;
                const letter = block.dataset.letter;
                const sameLevelNodes = Array.from(block.querySelectorAll(`[data-parentid="${parentId}"]:not(.hide-list):not(.header-title)`));
                sameLevelNodes.forEach(ele => {
                    if (letter) {
                        ele.dataset.prev = letter;
                    }
                    if (node.dataset.bookmark) {
                        ele.dataset.bookmark = ele.dataset.outlineid;
                    } else {
                        ele.removeAttribute('data-bookmark');
                    }
                })
            }

            // 改变层级序号
            const changeLevel = (node, pid) => {
                let id = node.dataset.outlineid;
                let firstChild = node.firstChild;
                /*if (firstChild && firstChild.textContent && node.textContent.replace(/\s/g,'').replace(/[\u200B-\u200D\uFEFF]/g, '') !== '' && firstChild.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '') {
                    firstChild.remove();
                }*/
                if (id) {
                    // 解决章节标题回车后撤销出现同索引号问题
                    let nextOl = node.nextElementSibling;
                    if (node.dataset.index && nextOl && node.dataset.index === nextOl.dataset.index && node.dataset.outlineid === nextOl.dataset.outlineid) {
                        nextOl.dataset.parentid = id;
                    }
                    let olList = Array.from(pageContainer.querySelectorAll(`[data-parentid="${id}"]:not(.hide-list):not(.header-title)`));
                    
                    let sourceIndex = node.dataset.index;
                    let bk = node.dataset.bookmark;
                    let prev = node.dataset.prev;

                    if (olList.length) {
                        for (let index=0; index<olList.length; index++) {
                            let ol = olList[index];
                            let statrAppendixNum = false;
                            let liIndex = sourceIndex ? sourceIndex + "." + (index + 1) : index + 1;

                            // 航司特定的附录章节条款
                            let prevNode = ol.previousElementSibling;
                            if (prevNode && prevNode === currNode && currNode.dataset.appendixNo && !/^[A-Z]+[0-9]+$/.test(ol.dataset.index)) {
                                liIndex = currNode.dataset.appendixNo || $global.setLowerToString(0);
                                statrAppendixNum = true;
                            } else {
                                statrAppendixNum = false;
                            }
                            if (node.dataset.appendixNo) {
                                ol.dataset.appendixNo = node.dataset.appendixNo;
                                if (!statrAppendixNum) {
                                    liIndex = sourceIndex ? sourceIndex + (index + 1) : index + 1;
                                }
                            }

                            if (sourceIndex) {
                                ol.dataset.source = sourceIndex;
                            }
                            ol.dataset.index = String(liIndex);

                            if (prev) {
                                ol.dataset.prev = prev;
                            }
                        
                            ol.dataset.parentid = pid;
                            if ((!bk && ol.dataset.index.split(".").length > 1) || (/^[A-Z]+[0-9]+$/.test(ol.dataset.index) && this.vm.pageData && this.vm.pageData?.stdKind === this.vm.editorSetting.tmplType)) {
                                ol.removeAttribute('data-bookmark');
                                if (/^[A-Z]+[0-9]+$/.test(ol.dataset.index) && this.vm.pageData && this.vm.pageData?.stdKind === this.vm.editorSetting.tmplType) {
                                    continue;
                                }
                            }
                            let olIndexs = ol.dataset.index.split('.');
                            if (olIndexs.length > 1 && index === 0 && this.vm.pageData && this.vm.pageData?.stdKind !== this.vm.editorSetting.tmplType) {
                                setSameStyle(ol);
                            }
                            // allNodes.push(ol);
                            changeLevel(ol, ol.dataset.outlineid);
                        }
                    } else {
                        return true;
                    }
                }
            }

            changeLevel(currNode, dataId);
        }
    },

    repairLevel(editor = null, pageContainer = null) {
        var blocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.fixed):not(.disabled):not(.pageHide)'));
        blocks.forEach(block => {
            let levelNodes = Array.from(block.querySelectorAll('div.ol-list,div.appendix-list'));
            if (levelNodes.length) {
                levelNodes.forEach(node => {
                    if (node.dataset.index.split(".").length === 1) {
                        if ($global.hasClass(node, 'appendix-list')) {
                            node.dataset.source = '0';
                        }
                        this.repairChildLevels(editor, block, node);
                    }
                })
            }
        })
    },
    repairChildLevels(editor = null, block = null, currNode = null) {
        var sourceIndex = currNode.dataset.index;
        var olLists = this.getChildNodesByIndex(block, currNode);
        if (olLists.length) {
            olLists.forEach(ol => {
                if (currNode.dataset.outlineid !== ol.dataset.parentid) {
                    ol.dataset.parentid = currNode.dataset.outlineid;
                }
                ol.dataset.source = currNode.dataset.index;
                this.repairChildLevels(editor, block, ol);
            })
        }
    },

    getChildNodesByIndex(editor = null, block = null, levelNode = null) {
        var olLists = [];
        const getChilds = (currBlock, currNode) => {
            if (currNode) {
                let cls = $global.hasClass(currNode, 'ol-list') ? '.ol-list' : '.appendix-list';
                let levelNodes = Array.from(currBlock.querySelectorAll(cls));
                for (let i = 0; i < levelNodes.length; i++) {
                    let node = levelNodes[i];
                    let index = node.dataset.index;
                    if (index) {
                        let indexSplit = index.split(".");
                        if (currNode.dataset.index === indexSplit.slice(0, -1).join(".") && editor.dom.nodeIndex(node) > editor.dom.nodeIndex(currNode)) {
                            olLists.push(node);
                        }
                    }
                }
                let nextBlock = currBlock.nextElementSibling;
                if (nextBlock && nextBlock.dataset.outlinetype && nextBlock.dataset.outlinetype === currBlock.dataset.outlinetype && nextBlock.dataset.outlineid === currBlock.dataset.outlineid) {
                    getChilds(nextBlock, currNode);
                }
            }
        }

        getChilds(block, levelNode);
        return olLists;
    }

}
