tinymce.PluginManager.add('quota', function(editor, url) {
    var pluginName = '指标';
    var fromData = function() {
        var node = editor.selection.getNode();
        return {
            commentContent: node.dataset.comment || ''
        }
    };

    var errorCode = {
        'key': '指标名称不能为空！',
		'operation': '请选择运算符！',
        'value': '指标值不能为空！'
    };

    var addQuota = function() {
        editor.windowManager.open({
            title: '添加指标',
            body: {
                type: 'panel',
                items: [{
                        type: 'grid',
                        columns: 3,
                        items: [
                            {
                                name: 'key', 
								type: 'input', 
								label: '指标名称'
                            },
							{
                                name: 'operation', 
								type: 'listbox', 
								label: '运算符',
								items: [
                                    { text: '请选择...', value: '' },
                                    { text: '小于', value: '<' },
                                    { text: '小于等于', value: '≤' },
                                    { text: '等于', value: '=' },
                                    { text: '大于等于', value: '≥' },
                                    { text: '大于', value: '>' }
                                ]
                            },
                            {
                                name: 'value', 
								type: 'input', 
								label: '指标值'
                            }
                        ]
                    }
                ]
            },
            buttons: [
                {
                    type: 'cancel',
                    name: 'closeButton',
                    text: 'Cancel'
                },
                {
                    type: 'submit',
                    name: 'submitButton',
                    text: 'save',
                    primary: true
                }
            ],
            initialData: fromData(),
            onSubmit: function (api, details) {
                var data = api.getData();
                let error;
                for(let key in errorCode) {
                    let value = data[key];
                    if(!/\S/.test(value)) {
                        error = errorCode[key];
                        break;
                    }
                }
                if(error) {
                    editor.windowManager.alert(error);
                    return;
                }
                editor.execCommand('toggleQuota', data);
                api.close();
            },
        })
    };

    var commandQuota = function(type) {
        editor.execCommand('toggleQuota', false, type);
    };

    var doAct = function(type=0) {
        if(!type) {
            addQuota();
        } else {
            commandQuota(type);
        }
    };
    var itemList = [
        {
            type: 'menuitem',
            text: '自定义指标',
            onAction: () => {
                doAct(0);
            }
        },
        {
            type: 'menuitem',
            text: '指标比对',
            onAction: () => {
                doAct(1);
            }
        }
    ];
    var isQuota = function (elm) {
        return elm.nodeName === 'FIGURE';
    };

    // 设置按钮状态
    var toggleState = editor => {
        let disabled = false;
        let currNode = editor.selection.getNode();
        let parentBlock = editor.dom.getParent(currNode, '.info-block');
        disabled = !parentBlock ? true : (editor.dom.hasClass(parentBlock, 'fixed') || parentBlock.dataset.enlock !== undefined || !parentBlock.isContentEditable);
        if (disabled) {
            // 元素为层级项，且为被锁定正在编辑的
            let olEle = editor.dom.getParent(currNode, '.ol-list') || editor.dom.getParent(currNode, '.appendix-list');
            if (olEle) {
                disabled = editor.dom.hasClass(olEle, 'disabled');
            }
        }
        return disabled;
    }

    editor.ui.registry.addMenuButton('quota', {
        text: '指标',
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


    editor.ui.registry.addMenuItem('removeQuota', {
        icon: 'cut-column',
        text: '移除指标',
        onAction: () => {
            doAct(2);
        }
    });
    // 上下文菜单
    editor.ui.registry.addContextMenu('quickquota', {
        update: function (element) {
            return editor.dom.hasClass(element, 'quota') ? 'removeQuota' : [];
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
