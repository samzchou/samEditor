tinymce.PluginManager.add('comment', function(editor, url) {
    var pluginName = 'comments';
    var fromData = function() {
        var node = editor.selection.getNode();
        return {
            commentContent: node.dataset.comment || ''
        }
    };

    var addComment = function() {
        editor.windowManager.open({
            title: 'add comment',
            body: {
                type: 'panel',
                items: [{
                        type: 'input',
                        name: 'commentContent',
                        label: 'enter comment'
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
                    text: 'Ok',
                    primary: true
                }
            ],
            initialData: fromData(),
            onSubmit: function (api, details) {
                var data = api.getData();
                if(!data.commentContent) {
                    editor.windowManager.alert('批注内容不能为空！');
                } else {
                    editor.execCommand('toggleComment', data.commentContent);
                    api.close();
                }
            },
        })
    };

    var doAct = function(type=0) {
        var selectNode = editor.selection.getNode();
        if(type === 0) {
            var selectText = editor.selection.getContent({format: 'text'});
            if (!selectText && !editor.dom.hasClass(selectNode, 'comment')) {
                editor.windowManager.alert('请选中相关文字内容后再添加批注！');
                return;
            }
            // addComment();
            editor.execCommand('toggleComment', false);
        } else if(type === 1) {
            editor.windowManager.confirm('sure remove comment？', flag => {
                if(flag) {
                    editor.formatter.remove('setTags', { title:selectNode.getAttribute('title'), value: 'comment', id:selectNode.dataset.id,'content':selectNode.dataset.content}, selectNode);
                }
            })
        } else {
            editor.execCommand('toggleComment', false, type);
        }
    };

    var toggleCommentState = function (flag) {
        return function (api) {
            var currNode = editor.selection.getNode();
            return api.setDisabled(!flag ? editor.dom.hasClass(currNode, 'comment') : !editor.dom.hasClass(currNode, 'comment'));
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
            if (olEle) {
                disabled = editor.dom.hasClass(olEle, 'disabled');
            }
        }
        return disabled;
    }

    var itemList = [
        {
            type: 'menuitem',
            text: 'add comment',
            onAction: () => {
                doAct(0);
            },
            // onSetup: toggleCommentState(false)
        },
         {
            type: 'menuitem',
            text: 'remove comment',
            onAction: () => {
                doAct(1);
            },
            onSetup: toggleCommentState(true)
        },
        {
            type: 'menuitem',
            text: 'view comment',
            onAction: () => {
                doAct(2);
            },
            onSetup: toggleCommentState(true)
        }
    ];

    editor.ui.registry.addMenuButton('comment', {
        text: 'comments',
        tooltip: 'comments',
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

    editor.ui.registry.addMenuItem('showComment', {
        icon: 'comment',
        text: 'view comment',
        onAction: () => {
            doAct(2);
        }
    });
    // 上下文菜单
    editor.ui.registry.addContextMenu('quickComment', {
        update: function (element) {
            return editor.dom.hasClass(element, 'comment') ? 'showComment' : '';
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
