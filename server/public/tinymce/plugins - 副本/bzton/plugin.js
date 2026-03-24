/**
 * =================================================
 * @vuedoc
 * @exports tinymce/plugins/bzton/plugins
 * @module
 * @desc 标准同编辑器插件合集
 * @author sam 2021-08-16
 * =================================================
 */

(function() {
    'use strict';
    var global = tinymce.util.Tools.resolve('tinymce.PluginManager');
    var collectionPlugins = [
        {
            name: 'close-btn',
            icon: 'close-btn',
            tooltip: 'Close',
            text: 'Close',
            cmd: 'close'
        },
        {
            name: 'language',
            text: 'Language',
            act: 'setLanguage',
            children: [
                {
                    text: 'Chinese',
                    act: 'zh_CN'
                },
                {
                    text: 'English',
                    act: 'en'
                }
            ]
        },
    ];

    // 贯标移到当前node的最后位置
    var moveSelectionToElement = (editor, element, extraBr) => {
        editor.selection.select(element, true);
        editor.selection.collapse(false);
    };

    // 切换按钮状态
    var toggleButtonState = (editor, item) => {
        return (api) => {
            var nodeChangeHandler = (e) => {
                let disabled = getState(editor) && item.name !== 'close-btn';
                api.setDisabled(disabled);
            };
            editor.on('NodeChange', nodeChangeHandler);
            return () => {
                return editor.off('NodeChange', nodeChangeHandler);
            };
        }
    }

    var doAction = (editor, item) => {
        editor = window.tinyMCE.activeEditor;
        var currNode = editor.selection.getNode();
        if (currNode.nodeName === 'BODY' && item.cmd !== 'close') {
            return;
        }
        var parentNode = currNode.parentNode;
        var newEle;

        if (item.cmd) {
            return editor.execCommand('bztonCmd', false, item.cmd);
        }
    }

    // 一般按钮
    var addButton = (editor, item) => {
        var data = {
            tooltip: item.tooltip,
            text: item.text,
            onAction: () => {
                doAction(editor, item);
            }
        }
        if(item.icon) {
            data.icon = item.icon;
        }
        editor.ui.registry.addButton(item.name, {
            ...data,
            // onSetup: toggleButtonState(editor, item)
        });
        editor.ui.registry.addMenuItem(item.name, {
            ...data,
            // onSetup: toggleState(editor, item)
        });
    }

	
    var getState = (editor, item) => {
        var currNode = editor.selection.getNode();
        if (currNode) {
            if (currNode.nodeName === 'BODY' || currNode.parentNode.nodeName === 'BODY') {
                return true;
            }         
            return false;
        }
        return true;
    };

    var toggleState = (editor, item) => {
        return (api) => {
            var flag = getState(editor, item) && item.name !== 'close-btn';
            return api.setDisabled(flag);
        }
    };

    // 下拉菜单按钮
    var addMenuButton = (editor, item) => {
        let items = [];
        for(let i=0; i<item.children.length; i++) {
            let db = item.children[i];
            items.push({
                type: 'menuitem',
                text: db.text,
                tooltip: db.tooltip,
                onAction: () => {
                    var currNode = editor.selection.getNode();
                    if (currNode.nodeName === 'BODY') {
                        return false;
                    }
                    editor.execCommand(item.act, db, currNode);
                }
            })
        }

        let data = {
			icon: item.icon,
            text: item.text,
            tooltip: item.tooltip,
            fetch: callback => {
                callback(items);
            },
            onSetup: toggleButtonState(editor, item)
        }
        if(item.icon) {
            data.icon = item.icon;
        }

		// 菜单栏主按钮
        editor.ui.registry.addMenuButton(item.name, data);

		// 菜单栏下拉式二级菜单
		editor.ui.registry.addNestedMenuItem(item.name, {
			icon: item.icon,
			text: item.text,
			getSubmenuItems: function () {
				return items;
			}
		});

        const aiMenus = [
            {
                type: 'menuitem',
                text: 'rewrite', // 重写
                onAction: () => {
                    editor.execCommand('aiCmd', 'rewrite');
                }
            },
            {
                type: 'menuitem',
                text: 'expand', // 展开内容
                onAction: () => {
                    editor.execCommand('aiCmd', 'expand');
                },
                /*onSetup: (api) => {
                	api.setDisabled(true);
                }*/
            },
            
        ]

        editor.ui.registry.addNestedMenuItem('quickAi', {
            icon: 'ai',
            text: 'ai Tool',
            getSubmenuItems: function () {
                return aiMenus;
            }
        });

        editor.ui.registry.addMenuButton('aiTool', {
            icon: 'ai',
            text: 'ai Tool',
            fetch: function (callback) {
                callback(aiMenus)
            },
        });

        var aiBt = [
            {
                type: 'menuitem',
                text: 'doc model',
                act: 'docModel',
                onAction: () => {
                    editor.execCommand('aiEditor', 'docModel');
                }
            },
            {
                type: 'menuitem',
                text: 'ai editor',
                act: 'docAi',
                onAction: () => {
                    editor.execCommand('aiEditor', 'docAi');
                }
            },
            
        ];
        if (tinyMCE.settings.aiAssistant) {
            let ls = [];
            tinyMCE.settings.aiAssistant.forEach(o => {
                let it = aiBt.find(t => t.act === o.act)
                if(it) {
                    it.text = o.text;
                    ls.push(it);
                }
            })
            aiBt = ls;
        }

        editor.ui.registry.addMenuButton('aiEditor', {
            icon: 'ai-bzton',
            text: 'ai bzton',
            fetch: function (callback) {
                callback(aiBt)
            },
            /*onAction: function () {
                editor.execCommand('aiEditor', false);
            }*/
        });

    }

    function Plugin() {
        global.add('bzton', function(editor) {
            for(let i=0; i<collectionPlugins.length; i++) {
                var item = collectionPlugins[i];
                if(item.children) {
                    addMenuButton(editor, item);
                } else {
                    addButton(editor, item);
                }
            }
        });
    }

    Plugin();

}());
