tinymce.PluginManager.add('term', function(editor, url) {
    var pluginName = '术语';
    var errorCode = {
        'cnName': '术语中文名称不能为空！',
        'enName': '术语英文文名称不能为空！'
    };

    var addTerm = function() {
        editor.windowManager.open({
            title: '添加术语',
            body: {
                type: 'panel',
                items: [{
                        type: 'grid',
                        columns: 2,
                        items: [
                            {
                                name: 'cnName', type: 'input', label: '术语中文名称'
                            },
                            {
                                name: 'enName', type: 'input', label: '术语英文文名称'
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
            initialData: {},
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
                editor.execCommand('toggleTerm', data);
                api.close();
            },
        })
    };

    var commandTerm = function(type) {
        editor.execCommand('toggleTerm', false, type);
    };

    var doAct = function(type=0) {
        var currNode = editor.selection.getNode();
        var block = editor.dom.getParent(currNode, '.info-block');
        // var cfg = tinymce.config;
        var err;
        if (block.dataset.outlinetype !== '5') {
            err = '术语只能作用在术语章节中！'
        }
        if (err) {
            editor.windowManager.alert(err);
            return;
        }

        if(!type) {
            addTerm();
        } else {
            commandTerm(type);
        }
    };
    var itemList = [
        {
            type: 'menuitem',
            text: '自定义术语',
            onAction: () => {
                doAct(0);
            }
        },
        {
            type: 'menuitem',
            text: '术语引用',
            onAction: () => {
                doAct(1);
            }
        }
    ];

    // 设置按钮状态
    var toggleState = editor => {
        let disabled = false;
        let currNode = editor.selection.getNode();
        let parentBlock = editor.dom.getParent(currNode, '.info-block');
        disabled = !parentBlock ? true : (editor.dom.hasClass(parentBlock, 'fixed') || parentBlock.dataset.enlock !== undefined || !parentBlock.isContentEditable);
        // 术语须在特定术语页面中使用
        if (parentBlock && (!parentBlock.dataset.outlinetype || parentBlock.dataset.outlinetype !== '5')) {
            return true;
        }
        if (disabled) {
            // 元素为层级项，且为被锁定正在编辑的
            let olEle = editor.dom.getParent(currNode, '.ol-list');
            if (olEle) {
                disabled = editor.dom.hasClass(olEle, 'disabled') || olEle.dataset.owner !== undefined; // 层级项不能为被分配的
            }
        }
        return disabled;
    }

    editor.ui.registry.addMenuButton('term', {
        text: pluginName,
        tooltip: '术语(须在术语和定义章节中使用)',
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

    editor.ui.registry.addMenuItem('removeTerm', {
        icon: 'cut-column',
        text: '移除术语',
        onAction: () => {
            doAct(2);
        }
    });
    // 上下文菜单
    editor.ui.registry.addContextMenu('quickTerm', {
        update: function (element) {
            var olEle = editor.dom.getParent(element, '.term')
            return olEle ? 'removeTerm' : [];
        }
    });
	
	// 自定义术语
	editor.addCommand('customTerm', function(ui, value) {
		addTerm();
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
