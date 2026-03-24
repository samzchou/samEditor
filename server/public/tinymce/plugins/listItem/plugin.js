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
    const global = tinymce.util.Tools.resolve('tinymce.PluginManager');
	
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
            text: '字母项a)b)c)',
            icon: 'listitem-lower',
            tooltip: '字母编号列项a)b)c)',
            value: 'lower',
            level: 1,
            cata: 1,
            cmd: 'list-item'
        },
		{
            name: 'list5',
            text: '字母项(a)(b)(c)',
            icon: 'listitem-lower',
            tooltip: '字母编号列项(a)(b)(c)',
            value: 'full-lower',
            level: 1,
            cata: 1,
            cmd: 'list-item'
        },
		{
            name: 'list5',
            text: '大写字母项A)B)C)',
            icon: 'listitem-lower',
            tooltip: '字母编号列项A)B)C)',
            value: 'uplower',
            level: 1,
            cata: 1,
            cmd: 'list-item'
        },
		{
            name: 'list6',
            text: '大写字母项(A)(B)(C)',
            icon: 'listitem-lower',
            tooltip: '字母编号列项(A)(B)(C)',
            value: 'full-uplower',
            level: 1,
            cata: 1,
            cmd: 'list-item'
        },
        {
            name: 'list7',
            text: '首字母项',
            icon: 'listitem-flower',
            tooltip: '首字母编号列项a)',
            value: 'lower',
            level: 1,
            cata: 1,
            reset: true,
            cmd: 'list-item'
        },
        {
            name: 'list8',
            text: '数字项',
            icon: 'listitem-num',
            tooltip: '数字编号列项1)2)3)',
            value: 'num',
            level: 2,
            cata: 1,
            cmd: 'list-item'
        },
        {
            name: 'list9',
            text: '首数字项',
            icon: 'listitem-fnum',
            tooltip: '首数字编号列项1)',
            value: 'num',
            level: 2,
            cata: 1,
            reset: true,
            cmd: 'list-item'
        },

        {
            name: 'list-1',
            text: '列项——',
            icon: 'listitem-line',
            value: 'line',
            level: 1,
            cmd: 'list-item'
        },
        {
            name: 'list-2',
            text: '列项●',
            icon: 'listitem-circle',
            value: 'circle',
            level: 2,
            cmd: 'list-item'
        },
        {
            name: 'list-3',
            text: '列项◆',
            icon: 'listitem-diamond',
            value: 'diamond',
            level: 3,
            cmd: 'list-item'
        },
        {
            name: 'list-4',
            text: '字母编号列项a)b)c)',
            icon: 'listitem-lower',
            value: 'lower',
            level: 1,
            reset: true,
            cmd: 'list-item'
        },
        {
            name: 'list-5',
            text: '首字母编号列项a)',
            icon: 'listitem-flower',
            value: 'lower',
            level: 1,
            cmd: 'list-item'
        },
        {
            name: 'list-6',
            text: '数字编号列项1)2)3)',
            icon: 'listitem-num',
            value: 'num',
            level: 2,
            cmd: 'list-item'
        },
        {
            name: 'list-7',
            text: '首数字编号列项1)',
            icon: 'listitem-fnum',
            value: 'num',
            level: 2,
            reset: true,
            cmd: 'list-item'
        },
    ];  

    const moveSelectionToElement = function(editor, element) {
        editor.selection.select(element, true);
        editor.selection.collapse(false);
    }
	
	const fromBulletData = (editor) => {
		let myConfig = sessionStorage.getItem('pageConfig') || null;
		if (myConfig) {
			myConfig = JSON.parse(myConfig)?.bullet;
		}
		return myConfig || {}

	}
	
	const getFormats = (editor) => {
		const font_formats = editor.settings.font_formats.split(';');
		const fontFamily = [];
		font_formats.forEach(item => {
			const strs = item.split('=');
			if (strs[0] && strs[1]) {
				fontFamily.push({
					text: strs[0],
					value: strs[1]
				})
			}
		});
		const emptyFontFamily = fontFamily.find(item => item.value==='');
		if (!emptyFontFamily)
			fontFamily.unshift({text:'Default', value:'' });
		
		const fontSize = editor.settings.fontSize;
		const emptyFontSize = fontSize.find(item => item.value==='');
		if (!emptyFontSize)
			fontSize.unshift({text:'Default', value:'' });
		return {
			fontSize,
			fontFamily,
			margins: editor.settings.margins,
			bulletItems: editor.settings.bullets
		}
	}
	
	const checkSetTemp = (editor) => {
		let docConfig = sessionStorage.getItem('tinymceConfig') || null;
		if (docConfig) {
			docConfig = JSON.parse(docConfig);
		}
		return docConfig?.setTemp;
	}
	
	const editListRule = (editor) => {
		const { fontSize, fontFamily, margins, bulletItems } = getFormats(editor);
		
		editor.windowManager.open({
			title: '自定义列项设置',
			body: {
				type: 'panel',
				items: [{
					type: "grid",
					columns: 3,
					items: [
					{
						type: "listbox",
						name: 'numberSize',
						label: '列项字号',
						items: fontSize
					},
					{
						type: "listbox",
						name: 'numberBold',
						label: '列项粗体',
						items: [
							{ text: 'No', value: '0' },
							{ text: 'Yes', value: '1' },
						]
					},
					{
						type: "listbox",
						name: 'numberFont',
						label: '编号符号字体',
						items: fontFamily
					},
					
					]
				},

				{
					type: "grid",
					columns: 3,
					items: [
					{
						type: "listbox",
						name: 'numberTitleFont',
						label: '文本字体',
						items: fontFamily
					},
					{
						type: "listbox",
						name: 'numberMargin',
						label: '编号与正文间距',
						items: margins
					},
					{
						type: "listbox",
						name: 'numberWidth',
						label: '编号固定宽度',
						items: margins
					}
					]
				},
				{
					type: "grid",
					columns: 3,
					items: [
						{
							name: 'numberLeft',
							type: 'listbox',
							label: '段前缩进',
							items: margins
						},
						{
							name: 'numberTop',
							type: 'input',
							label: '段前间距（em,mm,px,pt）',
						},
						{
							name: 'numberBottom',
							type: 'input',
							label: '段后间距（em,mm,px,pt）',
						}
					]
				},
				]
			},
			initialData: fromBulletData(editor),
			buttons: [
                {
                    type: 'cancel',
                    name: 'cancel',
                    text: 'Cancel'
                },
                {
                    type: 'submit',
                    name: 'save',
                    text: 'Ok',
                    primary: true
                }
            ],
			
			onChange: function(api, details) {
                const data = api.getData();
				if (details.name === 'numberWidth' && data.numberWidth) {
					data.numberMargin = "";
				} else if (details.name === 'numberMargin' && data.numberMargin) {
					data.numberWidth = "";
				}
				api.setData(data);
            },
			
			onSubmit: function (api, details) {
                const data = api.getData();
				editor.execCommand('setListRule', data, 'bullet');
                api.close();
            },
		})
	}

    const getNextAllNodes = function(node = null) {
        let nextNode = node.nextElementSibling, nodeArray = [];
        while (nextNode != null) {
            nodeArray.push(nextNode);
            nextNode = nextNode.nextElementSibling;
        }
        return nodeArray;
    };

    const checkHasListItem = (editor, nodes) => {
        for (let i = 0; i<nodes.length; i++) {
            const node = nodes[i];
            if (node.nodeName === 'DIV' && (editor.dom.hasClass(node,'ol-list') || editor.dom.hasClass(node,'appendix-list'))) {
                return true;
            }
        }
        return false;
    }
	
	const clearAttr = node => {
		for (var key in node.dataset) {
			delete node.dataset[key];
		}
		node.removeAttribute('style');
		node.removeAttribute('data-mce-style');
		return node;
	}
	
	const getResetStart = (editor, currNode) => {
		const prevNode = currNode.previousElementSibling;
		if (prevNode) {
			if (editor.dom.hasClass(prevNode, 'ol-list')) {
				return true;
			} else if (editor.dom.hasClass(prevNode, 'bullet')) {
				return false;
			} else {
				return getResetStart(editor, prevNode)
			}
		}
		return true;
	}

    const doAction = (editor, item) => {
        const styleValue = item.value;
        // editor.selection.getSelectedBlocks()
        const selectNodes = editor.selection.getSelectedBlocks();
        let currNode = editor.selection.getNode();
        let parentNode = currNode.parentNode;
        let error;
        let level = item.level;
		// debugger
        // 新创建列项或者附录项
        if (!editor.dom.hasClass(currNode, 'bullet')) {
            if (item.cmd && item.cmd === 'restBulletNum') {
                return false;
            }

            if (currNode.nodeName !== 'P') {
                currNode = editor.dom.getParent(currNode, 'p');
                parentNode = currNode ? currNode.parentNode : null;
            }
            
			let hasResetStart = true;
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
                        if (['num','full-num','lower','num-index'].includes(styleValue)) {
                            if (bulletNode.dataset.start) {
                                bulletNode.style.counterReset = `${styleValue} ${bulletNode.dataset.start}`;
                            }
                        } else {
                            bulletNode.removeAttribute('data-start');
                            bulletNode.removeAttribute('style');
                            bulletNode.removeAttribute('data-mce-style');
                        }
                        editor.execCommand('list-item', bulletNode);
                    } else if (bulletNode.nodeName === 'P') {
                        bulletNode = clearAttr(bulletNode);
						bulletNode.className = "bullet";
                        bulletNode.dataset.level = level;
                        bulletNode.dataset.type = styleValue;
						if (i === 0) {
							hasResetStart = getResetStart(editor, bulletNode);
							if (hasResetStart && ['num','full-num','lower','num-index'].includes(styleValue)) {
								bulletNode.dataset.start = "0";
								bulletNode.style.counterReset = `${styleValue} 0`;
							}
						}
						
                        editor.execCommand('list-item', bulletNode, item);
                    }
                }
            } else {
                const td = currNode ? editor.dom.getParent(currNode, 'td') : null;
                if (!currNode || !parentNode || td) {
                    const msg = !td ? 'Please operate on paragraph elements!' : 'Column items cannot be inserted into the table temporarily!';
                    editor.windowManager.alert(msg);
                    return;
                }

				/*
				const prevNode = currNode.previousElementSibling;
				if (prevNode && ['num','lower','num-index'].includes(styleValue) && (!editor.dom.hasClass(prevNode,'bullet') || prevNode.dataset?.type !== styleValue )) {
					item.reset = true;
				}
				*/
                // const nextNodes = getNextAllNodes(currNode);
				currNode = clearAttr(currNode);
				currNode.className = "bullet";
                //currNode.dataset.start = 0;
                currNode.dataset.level = level;
                currNode.dataset.type = styleValue;
                // 首字母或首数字
				hasResetStart = getResetStart(editor, currNode);
                if (item.reset || hasResetStart) {
                    currNode.dataset.start = "0";
                    currNode.style.counterReset = `${styleValue} 0`;
                }
                // moveSelectionToElement(editor, currNode);
                editor.execCommand('list-item', currNode, item);
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
            // currNode.removeAttribute('data-start');
			delete currNode.dataset.start;
			delete currNode.dataset.restart;
            // currNode.removeAttribute('style');
			currNode.style.counterReset = null;
            currNode.removeAttribute('data-mce-style');

            // 首字母或首数字
            if (item.reset) {
                currNode.dataset.start = "0";
                currNode.style.counterReset = `${styleValue} 0`;
                if (nextNode && nextNode.dataset && nextNode.dataset.type === styleValue && nextNode.dataset.level === level) {
                    // nextNode.removeAttribute('data-start');
                    // nextNode.removeAttribute('style');
					delete nextNode.dataset.start;
					delete nextNode.dataset.restart;
					nextNode.style.counterReset = null;
                    nextNode.removeAttribute('data-mce-style');
                }
            } else {
                // debugger
                if (!curr_start) {
                    if ((prevNode && editor.dom.hasClass(prevNode, 'bullet') && prevNode.dataset.level !== level) || (nextNode && editor.dom.hasClass(nextNode, 'bullet') && nextNode.dataset.level !== level)) {
                        curr_start = 0;
                    }
                }

                if (curr_start !== undefined && ['num','full-num','lower','num-index'].includes(styleValue)) { //&& nextNode && nextNode.dataset && nextNode.dataset.type === curr_type && nextNode.dataset.level === curr_level
                    currNode.dataset.start = "0";
                    currNode.style.counterReset = `${styleValue} 0`;
                }
            }
            editor.execCommand('list-item', currNode, item);
        }
    };
    // 获取按钮状态
    const getState = function(editor, item={}) {
        const currNode = editor.selection.getNode();
        if (currNode.nodeName === 'BODY' || currNode.parentNode.nodeName === 'BODY') {
            return true;
        }

        // debugger
		const selectedBlocks = editor.selection.getSelectedBlocks();
        const parentBlock = editor.dom.getParent(currNode, '.info-block');
        let flag = !parentBlock ? true : (editor.dom.hasClass(parentBlock, 'fixed') || parentBlock.dataset.enlock !== undefined || !parentBlock.isContentEditable);

        // 本身是列项的或为段落的
        if (editor.dom.hasClass(currNode, 'bullet') || (currNode.nodeName === 'P' && !currNode.dataset.mceCaret && !currNode.dataset.mceBogus)) {
            flag = false;
			if (item && item?.cmd === 'restBulletNum' && !['num','full-num','lower','num-index'].includes(currNode.dataset.type)) {
				return true;
			}
        }
		// 多选的元素
		// debugger
		if (flag && selectedBlocks.length > 1) {
			for(let i=0; i<selectedBlocks.length; i++) {
				let selectedNode = selectedBlocks[i];
				if (selectedNode.nodeName === 'TABLE' || editor.dom.hasClass(selectedNode,'ol-list') || editor.dom.hasClass(selectedNode,'appendix-list')) {
					return true;
				} else if (item && item?.cmd === 'restBulletNum' && !['num','full-num','lower','num-index'].includes(selectedNode.dataset.type)) {
					return true;
				}
			}
			return false;
		}
        return flag;
    };
    // 切换按钮状态
    const toggleState = function(editor, item) {
        return (api) => {
            const nodeChangeHandler = (e) => {
				const disabled = getState(editor, item);
                api.setDisabled(disabled);
            };
            editor.on('NodeChange', nodeChangeHandler);
            return () => {
                return editor.off('NodeChange', nodeChangeHandler);
            };
        }
    };

    // 一般按钮
    const addButton = (editor, item) => {
        const data = {
            tooltip: item.tooltip,
            text: item.text,
            onAction: () => {
                doAction(editor, item);
            },
            onSetup: toggleState(editor, item)
        }
        if (item.icon) {
            data.icon = item.icon;
        }
        editor.ui.registry.addButton(item.name, data);
        editor.ui.registry.addMenuItem(item.name, data);
    };

    const getItems = (editor, cata = 1) => {
		
        const collectItems = editor.settings.bullets ? editor.settings.bullets : collectionPlugins.filter(o => { return o.cata === cata; });
        const items = [];
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
		const isSetTemp = checkSetTemp(editor);
		if (isSetTemp) {
			items.push({
				type: 'menuitem',
				text: '⚙️自定义格式',
				onAction: () => {
					editListRule(editor);
				}
			});
		}

        return {
            text: 'Bullet',
            tooltip: 'Bullet',
            icon: 'unordered-list',
            fetch: callback => {
                callback(items);
            },
            onSetup: function(api) {
                const nodeChangeHandler = (e) => {
                    const flag = getState(editor);
                    api.setDisabled(flag);
                };
                editor.on('NodeChange', nodeChangeHandler);
                return () => {
                    return editor.off('NodeChange', nodeChangeHandler);
                };
            }
        }
    };
    const numItems = () => {
        var arr = [{ text: '请选择...', value: '' }];
        for (let i = 1; i <= 20; i++) {
            arr.push({
                text: String(i),
                value: String(i - 1)
            })
        }
        return arr;
    }

    const fromItemData = function(editor) {
        const node = editor.selection.getNode();
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

    
    const restBulletNum = function(editor, isList=false) {
        const listTypes = [{ text: '请选择...', value: '' }];
        if (!isList) {
            const collectItems = editor.settings.bullets ? editor.settings.bullets : collectionPlugins.filter(o => { return o.cata === cata; });
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
                const data = api.getData();
                api.enable('num');
                if (data.clear) {
                    api.disable('num');
                    api.setData({ 'num': '' })
                }
            },
            onSubmit: function(api, details) {
                const data = api.getData();
                const currNode = editor.dom.getParent(editor.selection.getNode(),'p');
                if (!isList) {
                    if (!data.type) {
                        editor.windowManager.alert('请选择编号类型！');
                        return false;
                    }
                    currNode.dataset.type = data.type;
                    if (data.clear) { // 清除起始编号
                        currNode.removeAttribute('data-start');
                        currNode.removeAttribute('data-restart');
                        // currNode.removeAttribute('style');
						currNode.style.counterReset = null;
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
    const addMenuButton = editor => {
        editor.ui.registry.addMenuButton('collect-list', getItems(editor, 1));
    };

    const addContextMenuButton = editor => {
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

    const levelAction = (editor, level) => {
        const currNode = editor.selection.getNode();
        editor.execCommand('list-level', currNode, level);
    }

    const getLevels = editor => {
        const items = [{ type: 'menuitem', text: 'Not Level', onAction: () => { levelAction(editor, 0) } }];
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
                const nodeChangeHandler = e => {
                    let disabled = getState(editor);
                    if (!disabled) {
                        const liEles = Array.from(editor.selection.getSelectedBlocks());
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
    const addcollectLevel = editor => {
        editor.ui.registry.addMenuButton('collect-level', getLevels(editor));
    }

    function Plugin() {
        global.add('listItem', function(editor) {
            for (let i = 0; i < collectionPlugins.length; i++) {
                const item = collectionPlugins[i];
                addButton(editor, item);
            }
            addMenuButton(editor);
            addContextMenuButton(editor);
            addcollectLevel(editor);
        });

    };

    Plugin();

}());
