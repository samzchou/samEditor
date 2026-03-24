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
    const collectionPlugins = [
        {
            name: 'chapterTitle',
            text: 'chapter title',
            tooltip:'chapter title',
            cmd: 'toggleChapterTitle'
        },
        {
            name: 'chapter0',
            text: 'caption 0',
            // icon: 'num-0',
            indexLens: 1,
            cata: 1,
            cmd: 'chapter'
        },
        {
            name: 'chapter1',
            text: 'caption 1',
            // icon: 'num-1',
            indexLens: 2,
            cata: 1,
            cmd: 'chapter'
        },
        {
            name: 'chapter2',
            text: 'caption 2',
            // icon:'num-2',
            indexLens: 3,
            cata: 1,
            cmd: 'chapter'
        },
        {
            name: 'chapter3',
            text: 'caption 3',
            // icon:'num-3',
            indexLens: 4,
            cata: 1,
            cmd: 'chapter'
        },
        {
            name: 'chapter4',
            text: 'caption 4',
            // icon:'num-4',
            indexLens: 5,
            cata: 1,
            cmd: 'chapter'
        },
        {
            name: 'chapter5',
            text: 'caption 5',
            // icon:'num-5',
            indexLens: 6,
            cata: 1,
            cmd: 'chapter'
        },
        {
            name: 'notTitle1',
            text: 'not caption 1',
            // icon:'num1',
            type:1,
            indexLens: 2,
            cata: 2,
            cmd: 'chapter'
        },
        {
            name: 'notTitle2',
            text: 'not caption 2',
            // icon:'num2',
            type:1,
            indexLens: 3,
            cata: 2,
            cmd: 'chapter'
        },
        {
            name: 'notTitle3',
            text: 'not caption 3',
            // icon:'num3',
            type:1,
            indexLens: 4,
            cata: 2,
            cmd: 'chapter'
        },
        {
            name: 'notTitle4',
            text: 'not caption 4',
            // icon:'num4',
            type:1,
            indexLens: 5,
            cata: 2,
            cmd: 'chapter'
        },
        {
            name: 'notTitle5',
            text: 'not caption 5',
            // icon:'num5',
            type:1,
            indexLens: 6,
            cata: 2,
            cmd: 'chapter'
        },

    ];

    var moveSelectionToElement = function (editor, element) {
        editor.selection.select(element, true);
        editor.selection.collapse(false);
    }

    var doAction = (editor, item) => {
        var editorCfg = editor.settings.doc_config;
        var currNode = editor.selection.getNode();
        var error;
        // 非章节页不能设置章条
        var block = editor.dom.getParent(currNode, '.info-block');
        var outlineType;
        if (!block) {
            error = '非法页面操作！';
        } else {
            outlineType = block.dataset.outlinetype;
            if (['1','2','11','12'].includes(outlineType) && editorCfg && editorCfg.isStandard) {
                error = '条编号设置须在章节页中操作！';
            }
        }

        if (error) {
            editor.windowManager.alert(error);
            return false;
        }
        item.type = outlineType;
        editor.execCommand(item.cmd, currNode, item);
    };

    var getState = (editor, item) => {
        var currNode = editor.selection.getNode();
        var parentBlock = editor.dom.getParent(currNode, '.info-block');

        var flag = !parentBlock ? true : (editor.dom.hasClass(parentBlock, 'fixed') || parentBlock.dataset.enlock !== undefined || !parentBlock.isContentEditable);
        // 本身是条目的，且为被锁定正在编辑的
        var olEle = editor.dom.getParent(currNode, '.ol-list') || editor.dom.getParent(currNode, '.appendix-list');
        if (olEle) {
            flag = editor.dom.hasClass(olEle, 'disabled'); // || currNode.dataset.index.length === item.indexLens;
        }
        return flag;
    };

    var toggleState = (editor, item) => {
        return (api) => {
            var flag = getState(editor, item);
            return api.setDisabled(flag);
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
            // onSetup: toggleState(editor, item)
            onSetup: (api) => {
                var nodeChangeHandler = (e) => {
                    let disabled = getState(editor);
                    api.setDisabled(disabled);
                };
                editor.on('NodeChange', nodeChangeHandler);
                return () => {
                    return editor.off('NodeChange', nodeChangeHandler);
                };
            }
        }
        if(item.icon) {
            data.icon = item.icon;
        }
        editor.ui.registry.addButton(item.name, data);
        editor.ui.registry.addMenuItem(item.name, data);
    };

    var getItems = (editor, cata=1) => {
        var collectItems = collectionPlugins.filter(o => { return o.cata === cata; });
        // debugger
        if (!editor.settings.normal) {
            collectItems = collectItems.filter(o => { return o.indexLens !== 1; });
        }
        var items = [];

        for(let i=0; i<collectItems.length; i++) {
            let db = collectItems[i];
            items.push({
                type: 'menuitem',
                text: db.text,
                tooltip: db.tooltip || '',
                onAction: () => {
                    doAction(editor, db);
                }
            })
        }

        var obj = {
            text: cata===1 ? 'caption' : 'not caption',
            tooltip: '',
            icon: 'ordered-list',
            fetch: callback => {
                callback(items);
            },
            onSetup: (api) => {
                var nodeChangeHandler = (e) => {
                    let disabled = getState(editor);
                    api.setDisabled(disabled);
                };
                editor.on('NodeChange', nodeChangeHandler);
                return () => {
                    return editor.off('NodeChange', nodeChangeHandler);
                };
            }
        }
        if (cata !== 1) {
            delete obj.icon;
        }

        return obj;
    };


    // 下拉组按钮
    var addMenuButton = (editor) => {
        // 有条题
        editor.ui.registry.addMenuButton('collect-chapter', getItems(editor, 1));
        // 无条题
        editor.ui.registry.addMenuButton('collect-unchapter', getItems(editor, 2));
    }


    function Plugin() {
        global.add('chapter', function(editor) {
            for(let i=0; i<collectionPlugins.length; i++) {
                var item = collectionPlugins[i];
                addButton(editor, item);
            }
            addMenuButton(editor);
        });
    };

    Plugin();

}());
