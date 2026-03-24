

tinymce.PluginManager.add('pageLayout', function(editor, url) {
    const pluginName = 'pageSetting';

    const errorCode = {
        'width': 'The page width value cannot be empty, it must be an integer!',
        'height': 'The page height value cannot be empty, it must be an integer!',
        'top': 'The value above the page margin cannot be empty, it must be an integer!' ,
        'bottom': 'The value below the page margin cannot be empty, it must be an integer!',
        'left': 'The value on the left side of the page margin cannot be empty, it must be an integer!',
        'right': 'The value on the right side of the page margin cannot be empty, it must be an integer!'
    };
    const sizeMap = {
        "A6": { "width":"105", "height":"148" },
        "A5": { "width":"148", "height":"210" },
        "A4": { "width":"210", "height":"297" },
        "A3": { "width":"297", "height":"420" },
        "A2": { "width":"420", "height":"594" },
    }
	
	const getConfig = (key) => {
		let myConfig = sessionStorage.getItem('pageConfig');
		if (myConfig) {
			myConfig = JSON.parse(myConfig)?.[key];
		}
		return myConfig || {}
	}

    const fromPageData = function() {
		const config = getConfig('pageContainer');

        const node = editor.selection.getNode();
        const block = editor.dom.getParent(node, '.info-block');
		if (!block) return {};
        const pageContainer = editor.dom.getParent(node, '.page-container');

		const fontFamily = window.getComputedStyle(block).fontFamily || '';
		const fontSize = window.getComputedStyle(block).fontSize || '';
		
		const pageHeight = block.style.height ? block.style.height.replace(/mm/g, '') : '297';
		
		let pageHeader = false;
		const pageHeaderNode = block.querySelector('.page-header');
		if (pageHeaderNode) {
			pageHeader = true;
		}
		let pageFooter = false;
		const pageFooterNode = block.querySelector('.page-footer');
		if (pageFooterNode) {
			pageFooter = true;
		}
		
        return {
            "size": block.dataset.pagesize||'A4',
            "direction": block.offsetWidth <  block.offsetHeight ? 'portrait' : 'landscape',
            "width": block.style.width ? block.style.width.replace(/mm/g, '') : '210',
            "height": pageHeight === 'auto' ? '297' : pageHeight,
            "top": block.style.paddingTop ? block.style.paddingTop.replace(/mm/g, '') : '25',
            "right": block.style.paddingRight ? block.style.paddingRight.replace(/mm/g, '') : '25',
            "bottom": block.style.paddingBottom ? block.style.paddingBottom.replace(/mm/g, '') : '20',
            "left": block.style.paddingLeft ? block.style.paddingLeft.replace(/mm/g, '') : '20',
			"fontSize": config.fontSize || '',
			"fontFamily": config.fontFamily || '',
			"paragraphPadding": config.paragraphPadding || '',
			"paragraphIndent": config.paragraphIndent || '',
			"lineHeight": config.lineHeight || '1.5',
			"convertFactor": config.convertFactor || '',
			"letterSpacing": config.letterSpacing || '0',
			"chapterType": config.chapterType || '',
			"docType": config.docType || '',
			"pageHeader": pageHeader,
			"pageFooter": pageFooter,
        }

    };
	
	const defaultFontFormats = 'Arial=arial;Arial Black=arial black;Impact=impact;Times New Roman=Times New Roman;Webdings=webdings;Wingdings=wingdings;宋体simSun=simSun;黑体simHei=simHei;楷体kaiti=kaiti;微软雅黑Microsoft YaHei=Microsoft YaHei;';
	
	const defaultFontSize = [{
		text: '初号 42pt',
		value: '42pt'
	},{
		text: '小初号 36pt',
		value: '36pt'
	},{
		text: '一号 26pt',
		value: '26pt'
	},{
		text: '小一号 24pt',
		value: '24pt'
	},{
		text: '二号 22pt',
		value: '22pt'
	},{
		text: '小二号 18pt',
		value: '18pt'
	},{
		text: '三号 16pt',
		value: '16pt'
	},{
		text: '小三号 15pt',
		value: '15pt'
	},{
		text: '四号 14pt',
		value: '14pt'
	},{
		text: '小四号 12pt',
		value: '12pt'
	},{
		text: '五号 10.5pt',
		value: '10.5pt'
	},{
		text: '小五号 9pt',
		value: '9pt'
	},{
		text: '六号 7.5pt',
		value: '7.5pt'
	}]
	
	const defaultMargins = [{
		text: '半个字符',
		value: '0.5'
	},{
		text: '1个字符',
		value: '1'
	},{
		text: '2个字符',
		value: '2'
	},{
		text: '3个字符',
		value: '3'
	},{
		text: '4个字符',
		value: '4'
	},{
		text: '5个字符',
		value: '5'
	},{
		text: '6个字符',
		value: '6'
	}]
	
	const getFormats = () => {
		const font_formats = editor?.settings?.font_formats ? editor.settings.font_formats.split(';') : defaultFontFormats.split(';');
		const fontFamily = [];
		font_formats.forEach(item => {
			const strs = item.split('=');
			if (strs[0] && strs[1]) {
				fontFamily.push({
					text: strs[0],
					value: strs[1]
				})
			}
		});
		const emptyFontFamily = fontFamily.find(item => item.value==='');
		if (!emptyFontFamily)
			fontFamily.unshift({text:'系统默认', value:'' });
		
		const fontSize = editor?.settings?.fontSize || defaultFontSize;
		const emptyFontSize = fontSize.find(item => item.value==='');
		if (!emptyFontSize)
			fontSize.unshift({text:'系统默认', value:'' });
		
		return {
			fontSize,
			fontFamily,
			margins: editor?.settings?.margins || defaultMargins
		}
	}
	
	const getBorderStyle = () => {
		const list = [
		  'None',
		  'Solid',
		  'Dotted',
		  'Dashed',
		];
		return list.map(s => {
			return {
				text: s,
				value: s.toLowerCase()
			}
		})
	}
	const getBorderWidth = () => {
		const list = [];
		for (let i=0; i<=10; i++) {
			list.push({
				text: `${i}px`,
				value: String(i)
			})
		}
		return list;
	}
	
	const setPageBg = function() {
		
	}

    const pageSetting = function(tabName='') {
		const { fontSize, fontFamily, margins } = getFormats();
        const currDialog = editor.windowManager.open({
            title: 'page settings',
			//size: 'medium',
            body: {
                type: 'tabpanel',
                tabs: [
                    {
                        name: 'size',
                        title: 'page size',
                        items: [
                            {
                                type: "grid",
                                columns: 2,
                                items: [
                                    {
                                        name: 'size',
                                        type: 'listbox',
                                        label: 'Paper type',
                                        items: [
                                            { text: 'Choose...', value: '' },
                                            { text: 'A6 Paper', value: 'A6' },
                                            { text: 'A5 Paper', value: 'A5' },
                                            { text: 'A4 Paper', value: 'A4' },
                                            { text: 'A3 Paper', value: 'A3' },
                                            { text: 'A2 Paper', value: 'A2' }
                                        ]
                                    },
                                    {
                                        name: 'direction',
                                        type: 'listbox',
                                        label: 'direction',
                                        items: [
                                            { text: 'Choose...', value: '' },
                                            { text: 'landscape', value: 'landscape' },
                                            { text: 'portrait', value: 'portrait' }
                                        ]
                                    }
                                ]
                            },
                            {
                                type: "grid",
                                columns: 2,
                                items: [
                                    { name: 'width', type: 'input', label: 'Page width(mm)' },
                                    { name: 'height', type: 'input', label: 'Page height(mm)' }
                                ]
                            }
                        ]
                    },
                    {
                        name: 'padding',
                        title: 'Page margin',
                        items: [
                            {
                                type: 'grid',
                                columns: 2,
                                items: [
                                    {
                                        name: 'top', type: 'input', label: 'Top(mm)'
                                    },
                                    {
                                        name: 'bottom', type: 'input', label: 'Bottom(mm)'
                                    }
                                ]
                            },
                            {
                                type: 'grid',
                                columns: 2,
                                items: [
                                    {
                                        name: 'left', type: 'input', label: 'Left(mm)'
                                    },
                                    {
                                        name: 'right', type: 'input', label: 'Right(mm)'
                                    }
                                ]
                            }
                        ]
                    },
					{
						name: 'watermask',
						title: '页面水印',
						items: [
							{
                                type: 'grid',
                                columns: 3,
                                items: [
									{
										name: 'maskType',
										type: 'listbox',
										label: '水印类型',
										items: [{text:"文字水印",value:"text"},{text:"图片水印",value:"image"}],
									},
                                    {
										name: 'textMask',
										type: 'input',
										label: '文字水印',
										placeholder: '请输入文字内容'
									},
									{
										name: 'imageMask',
										type: 'urlinput',
										filetype: 'image',
										label: '图片水印',
										picker_text: '请输入URL地址'
									},
                                ]
                            },
							{
								type: 'grid',
                                columns: 3,
                                items: [
									{
										name: 'repeatMask',
										type: 'listbox',
										label: '平铺方式',
										items: [{text:"无",value:""},{text:"连续",value:"1"}],
									},
									{
										name: 'rotateMask',
										type: 'input',
										inputMode: 'numeric',
										label: '旋转角度',
										placeholder: "-90°至90°",
									},
									{
										name: 'transparentMask',
										type: 'input',
										inputMode: 'numeric',
										label: '透明度',
										placeholder: "0至100",
									},
								]
							}
							
							
						]
					}
					/*
					{
						name: 'headerFooter',
						title: '页眉页脚',
						items: [
							{
								name: 'pageHeader',
								type: 'checkbox',
								label: '显示页眉',
							},
							{
								name: 'pageFooter',
								type: 'checkbox',
								label: '显示页脚',
							},
						]
					}
					*/
                ]
            },
            buttons: [
                {
                    type: 'cancel',
                    name: 'cancel',
                    text: 'Cancel'
                },
                {
                    type: 'submit',
                    name: 'save',
                    text: 'Current Page',
                    primary: true
                },
                {
                    type: 'custom',
                    name: 'custom',
                    text: 'All Pages'
                }
            ],
            initialData: fromPageData(),
            onTabChange: function (api, details) {
                api.showTab(details.newTabName);
            },
            onChange: function(api, details) {
                const data = api.getData();
                const sizeData = sizeMap[data.size];
                if (details.name === 'size') {
                    data.width = sizeData.width;
                    data.height = sizeData.height;
                    data.direction = 'portrait';
                    api.setData(data);
                } else if (details.name === 'direction') {
                    data.width = data.direction === 'landscape' ? sizeData.height : sizeData.width;
                    data.height = data.direction === 'landscape' ? sizeData.width : sizeData.height;
                } else if (details.name === 'font') {
					debugger
				}
                api.setData(data);
            },
            onAction: function(api, details) {
                if (details.name === 'custom') {
                    const data = api.getData();
                    const error = checkError(data);
                    if(error) {
                        editor.windowManager.alert(error);
                        return;
                    }
                    data.all = true;
                    data.type = 2;
                    editor.execCommand('pageLayout', data);
                    api.close();
                }
            },
            
            onSubmit: function (api, details) {
                const data = api.getData();
                const error = checkError(data);
                if(error) {
                    editor.windowManager.alert(error);
                    return;
                }

                data.type = 2;
                editor.execCommand('pageLayout', data);
                api.close();
            },
        })
		if (tabName) {
			currDialog.showTab(tabName);
		}
		
    };
	
	const fromConfig = (type) => {
		const config = getConfig(type);
        return config;
	}
	
    const checkError = function(data) {
        let error;
        for(let key in errorCode) {
            let value = data[key];
			if (!value) {
				switch (key) {
					case 'width':
						value = 210;
						break;
					case 'height':
						value = 'auto';
						break;
				}
				
			}
			data[key] = value.trim();
        }
        return undefined;
    };

    const toggleCommentState = function (flag) {
        return function (api) {
            // const editorCfg = editor.settings.doc_config || {};
			let flag = true;
			const pageContainer = editor.getBody().querySelector('.page-container');
			if (pageContainer) {
				flag = false;
			}
            return api.setDisabled(flag);
        }
    }
	const headerFooterItems = [
		{
			type: 'menuitem',
			text: 'page header',
			act: 'header',
			onAction: () => {
                setHeaderFooter('header');
            },
		},
		{
			type: 'menuitem',
			text: 'page footer',
			act: 'footer',
			onAction: () => {
                setHeaderFooter('footer');
            },
		}
	]

    const itemList = [
        {
            type: 'nestedmenuitem',
            text: 'vertical layout',//纵向布局
            getSubmenuItems: function () {
                return [
                    {
                        type: 'menuitem',
                        text: 'applied to the current page',
                        onAction: function () {
                            editor.execCommand('pageLayout', { type:0, all:false });
                        }
                    },
                    {
                        type: 'menuitem',
                        text: 'applied to all page',
                        onAction: function () {
                            editor.execCommand('pageLayout', { type:0, all:true });
                        }
                    }
                ];
            }
        },
        {
            type: 'nestedmenuitem',
            text: 'horizontal layout',//横向布局
            getSubmenuItems: function () {
                return [
                    {
                        type: 'menuitem',
                        text: 'applied to the current page', // 应用于当前页
                        onAction: function () {
                            editor.execCommand('pageLayout', { type:1, all:false });
                        }
                    },
                    {
                        type: 'menuitem',
                        text: 'applied to all page',//应用于所有页
                        onAction: function () {
                            editor.execCommand('pageLayout', { type:1, all:true });
                        }
                    }
                ];
            }
        },
        {
            type: 'menuitem',
            text: 'page settings',
            onAction: () => {
                pageSetting();
            },
            onSetup: toggleCommentState(true)
        },
    ];
	
	editor.addCommand('pageSetting', (type)=> {
		pageSetting(type);
	})

    editor.ui.registry.addMenuButton('pageLayout', {
        icon: 'page-setting',
        text: 'page layout',
        tooltip: pluginName,
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
	
	
	const headerFooterData = function(type) {
		return getConfig(type);
    };
	const setHeaderFooter = (type) => {
		const { fontSize, fontFamily } = getFormats();
		editor.windowManager.open({
            title: type === 'header' ? 'page header' : 'page footer',
            body: {
                type: 'panel',
                items: [
					{
						type: 'grid', // component type
						columns: 3, 
						items: [
							{
								type: 'listbox',
								name: 'cols',
								label: '栏位',
								items: [
									{ value: '1', text: '一栏' },
									{ value: '2', text: '二栏' },
									{ value: '3', text: '三栏' },
								]
							},
							{
								type: 'listbox',
								name: 'border',
								label: '边框线',
								items: [
									{ value: '', text: '无' },
									{ value: '1', text: '有' },
								]
							},
							{
								type: 'input',
								name: 'position',
								label: type === 'header' ? '上边距(px)' : '下边距(px)',
							}
						]
					},
					{
						type: 'grid', // component type
						columns: 4,
						items: [
							{
								type: 'listbox',
								name: 'fontFamily',
								label: '字体',
								items: fontFamily
							},
							{
								type: 'listbox',
								name: 'fontSize',
								label: '字号',
								items: fontSize
							},
							{
								type: 'listbox',
								name: 'fixed',
								label: '固定模式',
								items: [
									{ value: '', text: 'No' },
									{ value: '1', text: 'Yes' },
								]
							},
							{
								type: 'listbox',
								name: 'oddEven',
								label: '奇偶数页不同',
								items: [
									{ value: '', text: 'No' },
									{ value: '1', text: 'Yes' },
								]
							},
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
                    type: 'custom',
                    name: 'clearButton',
                    text: type === 'header' ? 'Clear page header' : 'Clear page footer',
					buttonType: 'secondary',
                },
                {
                    type: 'submit',
                    name: 'submitButton',
                    text: 'Ok',
                    primary: true
                }
            ],
            initialData: headerFooterData(type),
            onSubmit: function (api, details) {
                const data = api.getData();
				data.type = type;
				editor.execCommand('togglepageHeaderFooter', data);
				api.close();
            },
			onAction: function(api, details) {
				editor.execCommand('togglepageHeaderFooter', { type });
				api.close();
			}
        })
	}

    const splitPage = function() {
        const currNode = editor.selection.getNode();
        editor.execCommand('pageSplit', currNode);
    }
	
	const getState = editor => {
        const currNode = editor.selection.getNode();
        const parentBlock = editor.dom.getParent(currNode, '.info-block');

        let flag = !parentBlock ? true : (editor.dom.hasClass(parentBlock, 'fixed') || parentBlock.dataset.enlock !== undefined || !parentBlock.isContentEditable);
        // 本身是条目的，且为被锁定正在编辑的
        const olEle = editor.dom.getParent(currNode, '.ol-list') || editor.dom.getParent(currNode, '.appendix-list');
        if (olEle) {
            flag = editor.dom.hasClass(olEle, 'disabled');
        }
        return flag;
    };
	
	// 切换按钮状态
    const toggleButtonState = editor => {
        return (api) => {
            const nodeChangeHandler = (e) => {
                const disabled = getState(editor);
                api.setDisabled(disabled);
            };
            editor.on('NodeChange', nodeChangeHandler);
            return () => {
                return editor.off('NodeChange', nodeChangeHandler);
            };
        }
    }

    editor.ui.registry.addButton('pageSplit', {
        text: 'split pages',
        tooltip: 'split pages',
        onAction: () => {
            splitPage();
        },
		onSetup: toggleButtonState(editor)
    });

    return {
        getMetadata: function() {
            return {
                name: pluginName
            };
        }
    };
})
