/**
 * 在线翻译
 */
tinymce.PluginManager.add('translate', function(editor, url) {
	var docWindow = null;

    var doAct = function(type=0) {
        var  initialData = {
            text: editor.selection.getContent({ format: 'text' })
        }
        editor.windowManager.open({
            title: '在线翻译(自动中文⇋英文)',
            width: 300,
            height:200,
            body: {
                type: 'panel',
                items: [{
                        type: 'input',
                        name: 'text',
                        label: '翻译内容'
                    }
                ]
            },
            initialData: initialData,
            buttons: [
                {
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

            onSubmit: function (api, details) {
                var data = api.getData();
                if(!data.text) {
                    editor.windowManager.alert('请输入翻译内容！');
                } else {
                    editor.execCommand('translateZh', data);
                    api.close();
                }
            },
        })
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

    editor.ui.registry.addButton('translate', {
        icon: 'translate',
        tooltip: '在线英文翻译',
        onAction: function() {
            doAct();
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

    editor.ui.registry.addMenuItem('translate', {
        text: '在线英文翻译',
        onAction: function() {
            doAct();
        },
        onSetup: (api) => {
            let disabled = toggleState(editor);
            api.setDisabled(disabled);
        }
    });

    editor.ui.registry.addMenuItem('translateStdName', {
        icon: 'translate',
        text: '翻译标准名称',
        onAction: () => {
            editor.execCommand('translateStdName');
        },
        onSetup: (api) => {
            let disabled = toggleState(editor);
            api.setDisabled(disabled);
        }
    });

    editor.ui.registry.addContextMenu('translateStdName', {
        update: function(element) {
            return editor.dom.hasClass(element, 'stdNameEn') ? 'translateStdName' : [];
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
