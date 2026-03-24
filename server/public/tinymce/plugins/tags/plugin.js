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
    const global = tinymce.util.Tools.resolve('tinymce.PluginManager');
	
	const getState = (editor) => {
        const selectedContent = editor.selection.getContent();
		if (selectedContent) {
			return false;
		}
		return true;
    };
	
	const fromTagData = (editor, currNode) => {
		return {
			tagName: currNode.dataset.tag,
			dataSource: currNode.dataset.dataSource
		}
	}
	
	const toggleTag = (editor) => {
		const currNode = editor.selection.getNode();
		editor.windowManager.open({
			title: 'add Tag',
			width: 300,
			height:200,
			body: {
				type: 'panel',
				items: [
					{
						type: 'grid',
						columns: 2,
						items: [
							{
								type: 'input',
								name: 'tagName',
								label: 'Enter tag name',
								placeholder: 'Enter tag name...',
							},
							{
								type: 'listbox',
								name: 'dataSource',
								label: 'data source',
								items: [
									{
										text: 'data base',
										value: 'db'
									},
									{
										text: 'Logical calculation',
										value: 'logic'
									}
								]
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
					text: 'Ok',
					primary: true
				}
			],
			initialData: fromTagData(editor, currNode),
			onSubmit: function (api, details) {
				const data = api.getData();
				console.log(data);
				const selectedContent = editor.selection.getContent();
				editor.insertContent(`<span class="tag" data-tag="${data.tagName}" data-source="${data.dataSource}" title="tag:${data.tagName}">${selectedContent}</span>`);
				api.close();
			},
		})
	}
	
    const addButton = (editor) => {
        editor.ui.registry.addMenuButton('tagBtn', {
            icon: 'comment-add',
            tooltip: '添加批注/标签',
            fetch: callback => {
                var items = [{
                        type: 'menuitem',
                        text: '添加批注',
                        tooltip: '选中文字添加批注',
                        onAction: () => {
                            doAct('addAnnotation');
                        }
                    },
                    {
                        type: 'menuitem',
                        text: '清除批注',
                        onAction: () => {
                            doAct('clearAnnotation');
                        }
                    },
                    {
                        type: 'menuitem',
                        text: '添加标签',
                        tooltip: '选中文字或在段落上添加标签',
                        onAction: () => {
                            doAct('addTag');
                        }
                    },
                    {
                        type: 'menuitem',
                        text: '清除标签',
                        onAction: () => {
                            doAct('clearTag');
                        }
                    }
                ];
                callback(items);
            }
        });
		
		editor.ui.registry.addButton('addTag', {
			icon: 'tags',
            tooltip: 'add Tag',
			onSetup: (api) => {
                const nodeChangeHandler = (e) => {
                    let disabled = getState(editor);
                    api.setDisabled(disabled);
                };
                editor.on('NodeChange', nodeChangeHandler);
                return () => {
                    return editor.off('NodeChange', nodeChangeHandler);
                };
            },
			onAction: () => {
                toggleTag(editor);
            }
		});
    }


    function Plugin() {
        global.add('tags', function(editor) {
           addButton(editor);
        });
    }

    Plugin();

}());
