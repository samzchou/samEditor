/**
 * =================================================
 * @vuedoc
 * @exports tinymce/plugins/bzton/plugins
 * @module
 * @desc 列项
 * @author sam 2021-08-16
 * =================================================
 */

(function() {
    'use strict';
    var global = tinymce.util.Tools.resolve('tinymce.PluginManager');
    const collectionPlugins = [{
            name: 'list1',
            text: 'Bullet Level 1',
            icon: 'listitem-line',
            tooltip: '列项——[一级]',
            value: 'line',
            level: 1,
            cata: 1,
            cmd: 'list-item'
        },
        {
            name: 'list2',
            text: 'Bullet Level 2',
            icon: 'listitem-circle',
            tooltip: '列项●[二级]',
            value: 'circle',
            level: 2,
            cata: 1,
            cmd: 'list-item'
        },
        {
            name: 'list3',
            text: 'Bullet Level 3',
            icon: 'listitem-diamond',
            tooltip: '列项◆[三级]',
            value: 'diamond',
            level: 3,
            cata: 1,
            cmd: 'list-item'
        },
        {
            name: 'list4',
            text: '字母项a)b)c)[一级]',
            icon: 'listitem-lower',
            tooltip: '字母编号列项a)b)c)[一级]',
            value: 'lower',
            level: 1,
            cata: 1,
            cmd: 'list-item'
        },
        {
            name: 'list5',
            text: '首字母项',
            icon: 'listitem-flower',
            tooltip: '首字母编号列项a)[一级]',
            value: 'lower',
            level: 1,
            cata: 1,
            reset: true,
            cmd: 'list-item'
        },
        {
            name: 'list6',
            text: '数字项',
            icon: 'listitem-num',
            tooltip: '数字编号列项1)2)3)[二级]',
            value: 'num',
            level: 2,
            cata: 1,
            cmd: 'list-item'
        },
        {
            name: 'list7',
            text: '首数字项',
            icon: 'listitem-fnum',
            tooltip: '首数字编号列项1)[二级]',
            value: 'num',
            level: 2,
            cata: 1,
            reset: true,
            cmd: 'list-item'
        },

        {
            name: 'list-1',
            text: '列项——[一级]',
            icon: 'listitem-line',
            value: 'line',
            level: 1,
            cmd: 'list-item'
        },
        {
            name: 'list-2',
            text: '列项●[二级]',
            icon: 'listitem-circle',
            value: 'circle',
            level: 2,
            cmd: 'list-item'
        },
        {
            name: 'list-3',
            text: '列项◆[三级]',
            icon: 'listitem-diamond',
            value: 'diamond',
            level: 3,
            cmd: 'list-item'
        },
        {
            name: 'list-4',
            text: '字母编号列项a)b)c)[一级]',
            icon: 'listitem-lower',
            value: 'lower',
            level: 1,
            reset: true,
            cmd: 'list-item'
        },
        {
            name: 'list-5',
            text: '首字母编号列项a)[一级]',
            icon: 'listitem-flower',
            value: 'lower',
            level: 1,
            cmd: 'list-item'
        },
        {
            name: 'list-6',
            text: '数字编号列项1)2)3)[二级]',
            icon: 'listitem-num',
            value: 'num',
            level: 2,
            cmd: 'list-item'
        },
        {
            name: 'list-7',
            text: '首数字编号列项1)[二级]',
            icon: 'listitem-fnum',
            value: 'num',
            level: 2,
            reset: true,
            cmd: 'list-item'
        },
    ];

    

    var moveSelectionToElement = function(editor, element) {
        editor.selection.select(element, true);
        editor.selection.collapse(false);
    }

    var getNextAllNodes = function(node = null) {
        let nextNode = node.nextElementSibling, nodeArray = [];
        while (nextNode != null) {
            nodeArray.push(nextNode);
            nextNode = nextNode.nextElementSibling;
        }
        return nodeArray;
    };

    var checkHasListItem = (editor, nodes) => {
        for (let i = 0; i<nodes.length; i++) {
            let node = nodes[i];
            if (node.nodeName === 'DIV' && (editor.dom.hasClass(node,'ol-list') || editor.dom.hasClass(node,'appendix-list'))) {
                return true;
            }
        }
        return false;
    }

    var doAction = (editor, item) => {
        var styleValue = item.value;
        // editor.selection.getSelectedBlocks()
        var selectNodes = editor.selection.getSelectedBlocks();
        var currNode = editor.selection.getNode();
        var parentNode = currNode.parentNode;
        var error;
        var level = item.level;
        // 新创建列项或者附录项
        if (!editor.dom.hasClass(currNode, 'bullet')) {
            if (item.cmd && item.cmd === 'restBulletNum') {
                return false;
            }

            if (currNode.nodeName !== 'P') {
                currNode = editor.dom.getParent(currNode, 'p');
                parentNode = currNode ? currNode.parentNode : null;
            }
            // debugger
            let newEle;
            // 取出选中的节点，多选
            if (selectNodes.length > 1) {
                let flag = false, type;
                if (checkHasListItem(editor, selectNodes)) {
                    editor.windowManager.alert("所选元素不能包含层级项！");
                    return false;
                }

                for(let i=0; i<selectNodes.length; i++) {
                    let bulletNode = selectNodes[i];
                    if (editor.dom.hasClass(bulletNode, 'bullet')) {
                        flag = true;
                        bulletNode.dataset.type = item.value;
                        if (['num','lower','num-index'].includes(item.value)) {
                            if (bulletNode.dataset.start) {
                                bulletNode.style.counterReset = `${item.value} ${bulletNode.dataset.start}`;
                            }
                        } else {
                            bulletNode.removeAttribute('data-start');
                            bulletNode.removeAttribute('style');
                            bulletNode.removeAttribute('data-mce-style');
                        }
                        editor.execCommand('list-item', bulletNode);
                    } else if (bulletNode.nodeName === 'P') {
                        newEle = editor.dom.create('div', { class: 'bullet' }, bulletNode.innerHTML);
                        // newEle.dataset.start = 0;
                        newEle.dataset.level = level;
                        newEle.dataset.type = styleValue;
                        editor.dom.insertAfter(newEle, bulletNode);
                        bulletNode.remove();
                        editor.execCommand('list-item', newEle, item);
                    }
                }
            } else {
                var td = currNode ? editor.dom.getParent(currNode, 'td') : null;
                if (!currNode || !parentNode || td) {
                    let msg = !td ? '请在段落元素上操作！' : '表格内暂不能插入列项！';
                    editor.windowManager.alert(msg);
                    return;
                }
                var nextNodes = getNextAllNodes(currNode);
                newEle = editor.dom.create('div', { class: 'bullet' }, '&#8203');
                // 当前是层级项
                if (currNode.dataset.index) {
                    editor.dom.insertAfter(newEle, currNode.firstChild);
                } else {
                    // 包含在列项中
                    if (editor.dom.hasClass(parentNode, 'bullet')) {
                        editor.dom.insertAfter(newEle, parentNode);
                        if (nextNodes.length) {
                            nextNodes.forEach(el => {
                                newEle.appendChild(el);
                            })
                        }
                    } else {
                        editor.dom.insertAfter(newEle, currNode);
                    }
                    newEle.innerHTML = currNode.innerHTML;
                    currNode.remove();
                }
                // 相对于PDF文档的定位
                if (currNode.dataset.coordinates) {
                    newEle.dataset.coordinates = currNode.dataset.coordinates;
                    newEle.dataset.sourcePage = currNode.dataset.sourcePage || '';
                }

                newEle.dataset.start = 0;
                newEle.dataset.level = level;
                newEle.dataset.type = styleValue;
                // 首字母或首数字
                if (item.reset) {
                    newEle.dataset.start = "0";
                    newEle.style.counterReset = `${styleValue} 0`;
                }
                moveSelectionToElement(editor, newEle);
                editor.execCommand('list-item', newEle, item);
            }
            // 改变原有的列项样式
        } else {
            if (editor.dom.hasClass(currNode, 'hide-list')) {
                return false;
            }
            if (editor.dom.hasClass(parentNode, 'bullet')) {
                currNode = parentNode;
            }
            // 重置编号
            if (item.cmd && item.cmd === 'restBulletNum' && editor.dom.hasClass(currNode, 'bullet')) {
                return restBulletNum(editor);
            }
            let prevNode = currNode.previousElementSibling;
            let nextNode = currNode.nextElementSibling;
            let curr_start = currNode.dataset.start;                // 起始编号
            let curr_type = currNode.dataset.type;                  // 列项类型
            let curr_level = currNode.dataset.level;                // 列项层级

            currNode.dataset.type = styleValue;
            currNode.dataset.level = curr_level || level;
            currNode.removeAttribute('data-start');
            currNode.removeAttribute('style');
            currNode.removeAttribute('data-mce-style');

            // 首字母或首数字
            if (item.reset) {
                currNode.dataset.start = "0";
                currNode.style.counterReset = `${styleValue} 0`;
                if (nextNode && nextNode.dataset && nextNode.dataset.type === styleValue && nextNode.dataset.level === level) {
                    nextNode.removeAttribute('data-start');
                    nextNode.removeAttribute('style');
                    nextNode.removeAttribute('data-mce-style');
                }
            } else {
                // debugger
                if (!curr_start) {
                    if ((prevNode && editor.dom.hasClass(prevNode, 'bullet') && prevNode.dataset.level !== level) || (nextNode && editor.dom.hasClass(nextNode, 'bullet') && nextNode.dataset.level !== level)) {
                        curr_start = 0;
                    }
                }

                if (curr_start !== undefined ) { //&& nextNode && nextNode.dataset && nextNode.dataset.type === curr_type && nextNode.dataset.level === curr_level
                    currNode.dataset.start = "0";
                    currNode.style.counterReset = `${styleValue} 0`;
                }
            }
            editor.execCommand('list-item', currNode, item);
        }
    };
    // 获取按钮状态
    var getState = function(editor, item) {
        var currNode = editor.selection.getNode();
        if (currNode.nodeName === 'BODY' || currNode.parentNode.nodeName === 'BODY') {
            return true;
        }
        // debugger
		var selectedBlocks = editor.selection.getSelectedBlocks();
        var parentBlock = editor.dom.getParent(currNode, '.info-block');
        var flag = !parentBlock ? true : (editor.dom.hasClass(parentBlock, 'fixed') || parentBlock.dataset.enlock !== undefined || !parentBlock.isContentEditable);

        // 本身是列项的或为段落的
        if (editor.dom.hasClass(currNode, 'bullet') || (currNode.nodeName === 'P' && !currNode.dataset.mceCaret && !currNode.dataset.mceBogus)) {
            flag = false;
        }
		// 多选的元素
		if (flag && selectedBlocks.length > 1) {
			for(let i=0; i<selectedBlocks.length; i++) {
				let selectedNode = selectedBlocks[i];
				if (selectedNode.nodeName === 'TABLE' || editor.dom.hasClass(selectedNode,'ol-list') || editor.dom.hasClass(selectedNode,'appendix-list')) {
					return true;
				}
			}
			return false;
		}
        return flag;
    };
    // 切换按钮状态
    var toggleState = function(editor, item) {
        return (api) => {
            var nodeChangeHandler = (e) => {
                let disabled = getState(editor);
                api.setDisabled(disabled);
            };
            editor.on('NodeChange', nodeChangeHandler);
            return () => {
                return editor.off('NodeChange', nodeChangeHandler);
            };
        }
        
    };

    // 一般按钮
    var addButton = (editor, item) => {
        var data = {
            tooltip: item.tooltip,
            text: item.text,
            onAction: () => {
                doAction(editor, item);
            },
            // toggleState(editor, item)
            onSetup: toggleState(editor, item)
        }
        if (item.icon) {
            data.icon = item.icon;
        }
        editor.ui.registry.addButton(item.name, data);
        editor.ui.registry.addMenuItem(item.name, data);
    };

    var getItems = (editor, cata = 1) => {
        var collectItems = editor.settings.bullets ? editor.settings.bullets : collectionPlugins.filter(o => { return o.cata === cata; });
        var items = [];
        for (let i = 0; i < collectItems.length; i++) {
            let db = collectItems[i];
            items.push({
                type: 'menuitem',
                text: db.text,
                tooltip: db.tooltip || '',
                onAction: () => {
                    doAction(editor, db);
                },
                onSetup: toggleState(editor, db)
            })
        }

        return {
            text: 'Bullet',
            tooltip: 'Bullet',
            icon: 'unordered-list',
            fetch: callback => {
                callback(items);
            },
            onSetup: function(api) {
                var nodeChangeHandler = (e) => {
                    var flag = getState(editor);
                    api.setDisabled(flag);
                };
                editor.on('NodeChange', nodeChangeHandler);
                return () => {
                    return editor.off('NodeChange', nodeChangeHandler);
                };
            }
        }
    };
    var numItems = () => {
        var arr = [{ text: '请选择...', value: '' }];
        for (let i = 1; i <= 20; i++) {
            arr.push({
                text: String(i),
                value: String(i - 1)
            })
        }
        return arr;
    }

    var fromItemData = function(editor) {
        var node = editor.selection.getNode();
        return {
            "num": node.dataset.start || '',
            "type": node.dataset.type || ''
        }
    };

    const getNumItems = function(isList, listTypes) {
        const childItems = numItems();

        const bulletItems = [{
            type: "grid",
            columns: 3,
            items: [{
                    name: 'type',
                    type: 'listbox',
                    label: '编号类型',
                    items: listTypes
                },
                {
                    type: 'label',
                    label: '清除起始编号',
                    items: [{
                        name: 'clear',
                        type: 'checkbox',
                        label: '清除'
                    }]
                },
                {
                    name: 'num',
                    type: 'listbox',
                    label: '定义起始编号',
                    items: childItems
                }
            ]
        }];

        const listItems = [{
            type: "panel",
            items: [
                {
                    name: 'num',
                    type: 'listbox',
                    label: '定义起始编号',
                    items: childItems
                }
            ]
        }]

        return !isList ? bulletItems : listItems;
    }

    
    var restBulletNum = function(editor, isList=false) {
        var listTypes = [{ text: '请选择...', value: '' }];
        if (!isList) {
            var collectItems = editor.settings.bullets ? editor.settings.bullets : collectionPlugins.filter(o => { return o.cata === cata; });
            collectItems.forEach(item => {
                let obj = {
                    text: item.text,
                    value: item.value
                }
                if (!item.cmd) {
                    listTypes.push(obj)
                }
            });
        }
        
        editor.windowManager.open({
            title: '重置编号',
            size: 'small',
            width: 150,
            height: 200,
            body: {
                type: 'panel',
                items: getNumItems(isList, listTypes)
            },
            initialData: fromItemData(editor),
            buttons: [{
                    type: 'cancel',
                    name: 'closeButton',
                    text: 'Cancel'
                },
                {
                    type: 'submit',
                    name: 'submitButton',
                    text: 'Ok',
                    primary: true
                }
            ],
            onChange: function(api, details) {
                var data = api.getData();
                api.enable('num');
                if (data.clear) {
                    api.disable('num');
                    api.setData({ 'num': '' })
                }
            },
            onSubmit: function(api, details) {
                var data = api.getData();
                var currNode = editor.selection.getNode();
                if (!isList) {
                    if (!data.type) {
                        editor.windowManager.alert('请选择编号类型！');
                        return false;
                    }
                    currNode.dataset.type = data.type;
                    if (data.clear) { // 清除起始编号
                        currNode.removeAttribute('data-start');
                        currNode.removeAttribute('data-restart');
                        currNode.removeAttribute('style');
                        currNode.removeAttribute('data-mce-style');
                    } else if (data.num) {
                        if ((currNode.dataset.start && currNode.dataset.start !== data.num) || !currNode.dataset.start) {
                            currNode.dataset.restart = data.num;
                            currNode.dataset.start = data.num;
                            currNode.style.counterReset = `${currNode.dataset.type} ${data.num}`;
                        }
                    }
                    editor.execCommand('resetBullet', currNode.dataset.type, currNode);
                } else {
                    editor.execCommand('resetLevelNumber', currNode, Number(data.num) + 1);
                }
                
                api.close();
            },
        });
    }

    // 下拉组按钮
    var addMenuButton = editor => {
        editor.ui.registry.addMenuButton('collect-list', getItems(editor, 1));
    };
    //
    var addContextMenuButton = editor => {
        editor.ui.registry.addMenuItem('resetNumber', {
            icon: 'character-count',
            text: 'set Number',
            tooltip: "set Number",
            onAction: (element) => {
                const ele = editor.selection.getNode();
                const isList = editor.dom.hasClass(ele, 'ol-list') || editor.dom.hasClass(ele, 'appendix-list');
                restBulletNum(editor, isList);
            }
        });

        editor.ui.registry.addContextMenu('resetNumber', {
            update: function(element) {
                var checkReset = editor.dom.hasClass(element, 'bullet') && element.dataset && ['lower', 'num', 'num-index'].includes(element.dataset.type);
                if (!checkReset && editor.settings.normal) { // 层级项在一般文档中可自由编号
                    checkReset = editor.dom.hasClass(element, 'ol-list') || editor.dom.hasClass(element, 'appendix-list');
                }
                return checkReset ? 'resetNumber' : '';
            }
        });
    };

    var levelAction = (editor, level) => {
        var currNode = editor.selection.getNode();
        editor.execCommand('list-level', currNode, level);
    }

    var getLevels = editor => {
        var items = [{ type: 'menuitem', text: 'Not Level', onAction: () => { levelAction(editor, 0) } }];
        for (let i = 0; i < 5; i++) {
            items.push({
                type: 'menuitem',
                text: 'Level' + (i + 1),
                onAction: () => {
                    levelAction(editor, i + 1);
                }
            })
        }
        return {
            text: 'Bullet Level',
            tooltip: 'Bullet Level',
            fetch: callback => {
                callback(items);
            },
            onSetup: (api) => {
                var nodeChangeHandler = e => {
                    let disabled = getState(editor);
                    if (!disabled) {
                        var liEles = Array.from(editor.selection.getSelectedBlocks());
                        disabled = liEles.length === 0;
                        for (let i = 0; i < liEles.length; i++) {
                            if (!editor.dom.hasClass(liEles[i], 'bullet') || liEles[i].dataset.tag === 'docVer') {
                                disabled = true;
                                break;
                            }
                        }
                    }
                    api.setDisabled(disabled);
                };
                editor.on('NodeChange', nodeChangeHandler);
                return () => {
                    return editor.off('NodeChange', nodeChangeHandler);
                };
            }
        }
    }

    // 列项层级
    var addcollectLevel = editor => {
        editor.ui.registry.addMenuButton('collect-level', getLevels(editor));
    }

    function Plugin() {
        global.add('listItem', function(editor) {
            for (let i = 0; i < collectionPlugins.length; i++) {
                var item = collectionPlugins[i];
                addButton(editor, item);
            }
            addMenuButton(editor);
            addContextMenuButton(editor);
            addcollectLevel(editor);
        });

    };

    Plugin();

}());
