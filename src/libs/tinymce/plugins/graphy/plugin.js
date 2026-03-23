tinymce.PluginManager.add('graphy', function(editor, url) {
    var pluginName = 'graphy';
    var managerWindow;
    var doAct = function(type=0, create =true) {
        editor =  window.tinyMCE.activeEditor;
        editor.execCommand('insertGraphy', { type });
        /*
		var docConfig = editor.settings.doc_config;
        var pluginURL = docConfig.pluginURL || '';
        var htmlUrl = pluginURL + '/graphy?type=' + type + '&tmp=' + new Date().getTime() + '&id=' + editor.id + '&create=' + create;
        managerWindow = editor.windowManager.openUrl({
            title: type === 0 ? '90度折线图' : '文本图框',
            size: 'large',
            width: 850,
            height: type === 0 ? 600 : 700,
            url: htmlUrl,
            buttons: [
                {
                    type: 'cancel',
                    text: 'Close',
                },
                {
                    type: 'custom',
                    text: 'Save',
                    name: 'submit',
                    primary: true
                },
            ],
            onClose: function(){  // 监听关闭事件重置数据
                editor.execCommand('clearGraphyImgData');
            },
            onAction: function (api, details) {
                switch (details.name) {
                    case 'submit':
                        api.sendMessage({ getGraphy:true, id:editor.id });
                        setTimeout(() => {
                            api.close();
                        }, 500)
                        break;
                    default:
                        break;
                };
            }
        }); */
    };

    var setData = function(data=null) {
        editor =  window.tinyMCE.activeEditor;
        if(managerWindow && data) {
            managerWindow.sendMessage({ setGraphData:data, id:editor.id });
        }
    }

    // 设置按钮状态
    var toggleState = editor => {
        let disabled = false;
        let currNode = editor.selection.getNode();
        let parentBlock = editor.dom.getParent(currNode, '.info-block');
        disabled = !parentBlock ? true : (editor.dom.hasClass(parentBlock, 'fixed') || parentBlock.dataset.enlock !== undefined || !parentBlock.isContentEditable);
        if (disabled) {
            // 元素为层级项，且为被锁定正在编辑的
            let olEle = editor.dom.getParent(currNode, '.ol-list') || editor.dom.getParent(currNode, '.appendix-list');
            if (olEle && !editor.dom.hasClass(olEle, 'disabled')) {
                disabled = false;
            }
        }
        return disabled;
    }

    var itemList = [
        {
            type: 'menuitem',
            text: '90 degree line chart',
            onAction: () => {
                doAct(0);
            }
        },
        {
            type: 'menuitem',
            text: 'Text Frame',
            onAction: () => {
                doAct(1);
            }
        }
    ];

    editor.ui.registry.addMenuButton('graphy', {
        text: 'graphy',
        icon: 'gallery',
        tooltip: pluginName,
        fetch: callback => {
            callback(itemList);
        },
        onSetup: (api) => {
            var nodeChangeHandler = (e) => {
                let disabled = toggleState(editor);
                api.setDisabled(disabled);
            };
            editor.on('NodeChange', nodeChangeHandler);
            return () => {
                return editor.off('NodeChange', nodeChangeHandler);
            };
        }
    });

    // 注册编辑图形事件
    editor.addCommand('openGraph', type => {
        doAct(type, false);
    });

    editor.addCommand('setGraph', data => {
        setData(data);
    });
    // 菜单
    editor.ui.registry.addNestedMenuItem('graphy', {
        icon: 'gallery',
        text: 'graphy',
        getSubmenuItems: function () {
            let disabled = toggleState(editor);
            if (disabled) {
                return [];
            }
            return itemList;
        },
        onSetup: (api) => {
            let disabled = toggleState(editor);
            api.setDisabled(disabled);
        }
    });

    return {
        getMetadata: function() {
            return {
                name: pluginName,
                url: "http://www.bzton.cn",
            };
        }
    };
})
