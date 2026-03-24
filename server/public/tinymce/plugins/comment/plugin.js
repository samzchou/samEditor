tinymce.PluginManager.add('comment', function(editor, url) {
    const pluginName = 'comments';
    const fromData = function() {
        const node = editor.selection.getNode();
        return {
            commentContent: node.dataset.comment || ''
        }
    };

    const addComment = function(type) {
        editor.windowManager.open({
            title: !type ? 'add comment' : 'update revision',
            body: {
                type: 'panel',
                items: [{
                        type: 'input',
                        name: 'commentContent',
						placeholder: 'Enter content',
                        //label: 'enter content'
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
            //initialData: fromData(),
            onSubmit: function (api, details) {
                const data = api.getData();
                if(!data.commentContent) {
                    editor.windowManager.alert('内容不能为空！');
                } else {
                    editor.execCommand('toggleComment', data.commentContent, type);
                    api.close();
                }
            },
        })
    };
	
    const doAct = function(type=0) {
        const selectNode = editor.selection.getNode();
        if(type === 0) { // 添加批注
            var selectText = editor.selection.getContent({format: 'text'});
            if (!selectText && !editor.dom.hasClass(selectNode, 'comment')) {
                editor.windowManager.alert('请选中相关文字内容后再添加批注！');
                return;
            }
            addComment(0);
        } else if(type === 1) { // 移除批注
            editor.windowManager.confirm('sure remove commen?', flag => {
                if(flag) {
					editor.execCommand('toggleComment', false, type);
                }
            })
        } else if([2,3].includes(type)) { // 显示隐藏批注修订
			editor.execCommand('toggleComment', false, type);
		} else if ([4,5].includes(type)) {
			const msg = type === 4 ? '确定全部接受修订？' : '确定全部拒绝修订？';
			editor.windowManager.confirm(msg, flag => {
                if(flag) {
					editor.execCommand('toggleComment', false, type);
                }
            })
		}
		
		/*else if(type === 3) { // 修订插入
			addComment(3);
		}else if(type === 4) { // 移除修订
            editor.windowManager.confirm('sure remove revision?', flag => {
                if(flag) {
					editor.execCommand('toggleComment', false, type);
                }
            })
        }
		*/
    };

    const toggleCommentState = function (tagName) {
        return function (api) {
            const currNode = editor.selection.getNode();
            return api.setDisabled(!tagName ? editor.dom.hasClass(currNode, tagName) : !editor.dom.hasClass(currNode, tagName));
        }
    }

    // 设置按钮状态
    const toggleState = editor => {
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
			act: 0,
            onAction: () => {
                doAct(0);
            },
            // onSetup: toggleCommentState(false)
        },
         {
            type: 'menuitem',
            text: 'remove comment',
			act: 1,
            onAction: () => {
                doAct(1);
            },
            onSetup: toggleCommentState('comment')
        },
		{
            type: 'menuitem',
            text: '开启或关闭修订',
			act: 2,
            onAction: () => {
                doAct(2);
            },
        },
        {
            type: 'menuitem',
            text: 'view comment',
			act: 3,
            onAction: () => {
                doAct(3);
            },
            // onSetup: toggleCommentState(true)
        },
		{
            type: 'menuitem',
            text: '全部接受修订',
			act: 4,
            onAction: () => {
                doAct(4);
            },
        },
		{
            type: 'menuitem',
            text: '全部拒绝修订',
			act: 5,
            onAction: () => {
                doAct(5);
            },
        },
		
		/*
		{
            type: 'menuitem',
            text: '修订删除',
            onAction: () => {
                doAct(2);
            },
            // onSetup: toggleCommentState(true)
        },
		{
            type: 'menuitem',
            text: '修订插入',
            onAction: () => {
                doAct(3);
            },
            // onSetup: toggleCommentState('revision')
        },
		{
            type: 'menuitem',
            text: '移除修订',
            onAction: () => {
                doAct(4);
            },
            onSetup: toggleCommentState('revision')
        },
		*/
    ];
	
	const isDebugger = () => {
		let tinymceConfig = sessionStorage.getItem('tinymceConfig');
		if (tinymceConfig) {
			tinymceConfig = JSON.parse(tinymceConfig);
			return tinymceConfig?.debugger;
		}
		return false;
	}

    editor.ui.registry.addMenuButton('comment', {
        text: 'comments',
        tooltip: 'comments',
        fetch: callback => {
			if(!isDebugger()) {
				itemList = itemList.filter(item => item.act !==2 );
			}
            callback(itemList);
        },
        onSetup: (api) => {
            const nodeChangeHandler = (e) => {
                const disabled = toggleState(editor);
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
            doAct(3);
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
