

tinymce.PluginManager.add('insertPage', function(editor, url) {
    const pluginName = 'insertPage';

	const getConfig = (key) => {
		let myConfig = sessionStorage.getItem('pageConfig');
		if (myConfig) {
			myConfig = JSON.parse(myConfig)?.[key];
		}
		return myConfig || {}
	}
	
	const doAction = (name, type) => {
		console.log('doAction==>', name, type);
		editor.execCommand('insertPage', { name, type })
	}
    
	const checkIsExist = (name, type) => {
		const pageContainer = editor.getBody().querySelector('.page-container');
		let pageBlock;
		if (name) {
			pageBlock = pageContainer.querySelector(`div.info-block.${name}`);
		} else if (type) {
			pageBlock = pageContainer.querySelector(`[data-outlinetype="${type}"]`);
		}
		if (pageBlock) {
			return true;
		}
		return false;
	}
	const checkIsToc = (type) => {
		const pageContainer = editor.getBody().querySelector('.page-container');
		let tocPage = pageContainer.querySelector(`div.toc[data-type="${type}"]`);
		if (tocPage) {
			return true;
		}
		return false;
	}
	
	const checkIsBlock = () => {
		const currNode = editor.selection.getNode();
		const pageBlock = editor.dom.getParent(currNode, '.info-block');
		if (pageBlock) {
			return false;
		}
		return true;
	}
	
	const toTree = (data, opts = {idKey:'id', parentKey:'pid'}) => {
        if(opts.transKey){
           data.forEach(item => {
               for(let targetKey in opts.transKey){
                   let sourceKey = opts.transKey[opts.targetKey];
                   item[opts.targetKey] = item[sourceKey];
                   delete item[sourceKey];
               }
           });
        }
        data.forEach(item => {
            delete item.children;
        });
        var map = {};
        data.forEach(item => {
            map[item[opts.idKey]] = item;
        });
        var val = [];
        data.forEach(item => {
            var parent = map[item[opts.parentKey]];
            if (parent) {
                (parent.children || (parent.children = [])).push(item);
            } else {
                val.push(item);
            }
        });
        return val;
    }

    const itemList = [
        {
            type: 'menuitem',
            text: 'cover page',
            act: 'insertCover',
			onSetup: function(api) {
				const bool = checkIsExist('cover');
				api.setDisabled(bool);
			},
			onAction: () => {
                doAction('insertCover');
            },
        },
		{
            type: 'menuitem',
            text: 'back cover page',
            act: 'insertBackCover',
			onSetup: function(api) {
				const bool = checkIsExist('back-cover');
				api.setDisabled(bool);
			},
			onAction: () => {
                doAction('insertBackCover');
            },
        },
		{
            type: 'nestedmenuitem',
            text: 'toc page',
			/*
            act: 'insertToc',
			onSetup: function(api) {
				const bool = checkIsExist('toc');
				api.setDisabled(bool);
			},
			onAction: () => {
                doAction('insertToc');
            },
			*/
			getSubmenuItems: function () {
				return [
					{
                        type: 'menuitem',
                        text: '通用目录类型',
						onSetup: function(api) {
							const bool = checkIsToc('normal');
							api.setDisabled(bool);
						},
                        onAction: function () {
                            doAction('insertToc', 'normal');
                        }
                    },
					{
                        type: 'menuitem',
                        text: '表格目录类型',
						onSetup: function(api) {
							const bool = checkIsToc('table');
							api.setDisabled(bool);
						},
                        onAction: function () {
                            doAction('insertToc', 'table');
                        }
                    },
				]
			}
        },
		
        {
            type: 'nestedmenuitem',
            text: '章节条款页', 
            getSubmenuItems: function () {
                let docChapters = getConfig('docChapters');
				if (docChapters && docChapters.length) {
					const listItem = docChapters.map(item => {
						let data = {
							type: 'menuitem',
							text: item.text,
							onAction: function () {
								doAction('insertChapter', Number(item.type));
							},
							onSetup: function(api) {
								let bool = false;
								if (!item.repeat) {
									bool = checkIsExist('', Number(item.type));
								}
								api.setDisabled(bool);
							},
						}
						
						if (item.children && item.children.length) {
							data.type = 'nestedmenuitem';
							delete data.onAction;
							data.getSubmenuItems = function () {
								return item.children.map(subItem => {
									return {
										type: 'menuitem',
										text: subItem.text,
										onAction: function () {
											doAction('insertChapter', Number(subItem.type));
										},
										onSetup: function(api) {
											let bool = false;
											if (!subItem.repeat) {
												bool = checkIsExist('', Number(subItem.type));
											}
											api.setDisabled(bool);
										},
									}
								})
							};
						}
						return data;
					});
					return listItem
				} else {
					return [
						{
							type: 'menuitem',
							text: '通用章节',
							onAction: function () {
								doAction('insertChapter', 6);
							}
						},
					];
				}
				
				/*
				return [
                    {
                        type: 'menuitem',
                        text: '一般章节',
                        onAction: function () {
                            doAction('insertChapter', 6);
                        }
                    },
                    {
                        type: 'menuitem',
                        text: '前言',
						onSetup: function(api) {
							const bool = checkIsExist('', 1);
							api.setDisabled(bool);
						},
                        onAction: function () {
                            doAction('insertChapter', 1);
                        }
                    },
					{
                        type: 'menuitem',
                        text: '引言',
						onSetup: function(api) {
							const bool = checkIsExist('', 2);
							api.setDisabled(bool);
						},
                        onAction: function () {
                            doAction('insertChapter', 2);
                        }
                    },
					{
                        type: 'menuitem',
                        text: '范围',
						onSetup: function(api) {
							const bool = checkIsExist('', 3);
							api.setDisabled(bool);
						},
                        onAction: function () {
                            doAction('insertChapter', 3);
                        }
                    },
					{
                        type: 'menuitem',
                        text: '规范性引用文件',
						onSetup: function(api) {
							const bool = checkIsExist('', 4);
							api.setDisabled(bool);
						},
                        onAction: function () {
                            doAction('insertChapter', 4);
                        }
                    },
					{
                        type: 'menuitem',
                        text: '术语和定义',
						onSetup: function(api) {
							const bool = checkIsExist('', 5);
							api.setDisabled(bool);
						},
                        onAction: function () {
                            doAction('insertChapter', 5);
                        }
                    },
					{
						type: 'nestedmenuitem',
						text: '附录章节',
						getSubmenuItems: function () {
							return [
								{
									type: 'menuitem',
									text: '一般附录',
									onAction: function () {
										doAction('insertChapter', 10);
									}
								},
								{
									type: 'menuitem',
									text: '规范性',
									onSetup: function(api) {
										const bool = checkIsExist('', 8);
										api.setDisabled(bool);
									},
									onAction: function () {
										doAction('insertChapter', 8);
									}
								},
								{
									type: 'menuitem',
									text: '资料性',
									onSetup: function(api) {
										const bool = checkIsExist('', 9);
										api.setDisabled(bool);
									},
									onAction: function () {
										doAction('insertChapter', 9);
									}
								},
							];
						}
					},
					
					{
						type: 'menuitem',
						text: '参考文献',
						act: 'insertReferences',
						onSetup: function(api) {
							const bool = checkIsExist('', 11);
							api.setDisabled(bool);
						},
						onAction: function () {
							doAction('insertChapter', 11);
						}
					},
					{
						type: 'menuitem',
						text: '索引',
						act: 'insertIndex',
						onSetup: function(api) {
							const bool = checkIsExist('', 12);
							api.setDisabled(bool);
						},
						onAction: function () {
							doAction('insertChapter', 12);
						}
					},
                ];
				*/
            }
        },
        
		
		{
            type: 'menuitem',
            text: '之后插入空白页',
            act: 'insertEmpty',
			onSetup: function(api) {
				const bool = checkIsBlock();
				api.setDisabled(bool);
			},
			onAction: () => {
                doAction('insertEmpty');
            },
        },
    ];


    editor.ui.registry.addMenuButton('insertPage', {
        icon: 'insert-page',
        text: 'insert page',
        tooltip: 'insert page',
        fetch: callback => {
            callback(itemList);
        },
        onSetup: function(api) {
            const nodeChangeHandler = function(e) {
                const currNode = editor.selection.getNode();
                const parentBlock = editor.dom.getParent(currNode, '.info-block');
                const bool = !parentBlock;
                api.setDisabled(bool);
            };
            editor.on('NodeChange', nodeChangeHandler);
            return function() {
                return editor.off('NodeChange', nodeChangeHandler);
            };
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
