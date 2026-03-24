tinymce.PluginManager.add('chapter', function(editor, url) {
    const pluginName = 'chapter';
	
	const doAction = (editor, item) => {
		const editorCfg = editor.settings.doc_config;
        const currNode = editor.selection.getNode();
        let error;
        // 非章节页不能设置章条
        const block = editor.dom.getParent(currNode, '.info-block');
        let outlineType;
        if (!block) {
            error = 'Prohibit operations outside the page!';
        } else {
            outlineType = block.dataset.outlinetype;
            if (['1','2','11','12'].includes(outlineType) && editorCfg && editorCfg.isStandard) {
                error = 'The current page does not allow setting chapter terms!';
            }
        }

        if (error) {
            editor.windowManager.alert(error);
            return false;
        }
        item.type = outlineType;
        editor.execCommand(item.cmd, currNode, item);
	}
	
	const getPage = () => {
		return editor.getBody().querySelector('.page-container');
	}
	
	const getConfig = (key) => {
		let myConfig = sessionStorage.getItem('pageConfig');
		if (myConfig) {
			myConfig = JSON.parse(myConfig)?.[key];
		}
		return myConfig || {}
	}
	
	const checkSetTemp = () => {
		const docConfig = editor.settings?.doc_config || {};
		return docConfig.setTemp;
	}
	
	const fromData = (key, hasAutoBreak=false) => {
		const configs = getConfig(key);
		if (hasAutoBreak) {
			if (!configs?.autoBreak) {
				configs.autoBreak = '';
			// } else {
			// 	configs.autoBreak = '1';
			}
		}
		return configs;
	}
	
	const getFormats = (editor) => {
		const font_formats = editor.settings.font_formats.split(';');
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
		
		const fontSize = editor.settings.fontSize;
		const emptyFontSize = fontSize.find(item => item.value==='');
		if (!emptyFontSize)
			fontSize.unshift({text:'系统默认', value:'' });
		return {
			fontSize,
			fontFamily,
			margins: editor.settings.margins
		}
	}
	
	const editListRule = (editor) => {
		const { fontSize, fontFamily, margins } = getFormats(editor);
		editor.windowManager.open({
            title: '数字编号格式设置',
			size: 'medium',
            body: {
                type: 'panel',
				items: [{
					type: "grid",
					columns: 4,
					items: [
						{
							name: 'numberSuffixText',
							type: 'listbox',
							label: '编号后缀',
							items: [
								{ text: '无', value: '' },
								{ text: '小数点', value: '.' },
								{ text: '冒号', value: ':' },
							]
						},
						{
							name: 'numberSuffix',
							type: 'input',
							label: '自定义后缀',
							
						},
						{
							name: 'numberLevel',
							type: 'input',
							label: '编号最大层级',
						},
						{
							name: 'numberBold',
							type: 'listbox',
							label: '编号粗体',
							items: [{
								text: 'No',
								value: ''
							},{
								text: 'Yes',
								value: '1'
							}]
						},
					]
				},{
					type: "grid",
					columns: 5,
					items: [
						{
							name: 'numberSize',
							type: 'listbox',
							label: '字号',
							items: fontSize
						},
						{
							name: 'numberFont',
							type: 'listbox',
							label: '编号字体',
							items: fontFamily
						},
						{
							name: 'numberTitleFont',
							type: 'listbox',
							label: '标题字体',
							items: fontFamily
						},
						{
							type: 'label',
							label: '主章节默认居中',
							items:[
								{
									name: 'firstCenter',
									type: 'checkbox',
									label: 'Yes',
								},
							]
						},
						{
							name: 'autoBreak',
							type: 'listbox',
							label: '按章节默认分页',
							items:[
								{
									text: '无',
									value: '',
								},
								{
									text: '按主章节第一层',
									value: '1',
								},
								{
									text: '按章节第二层',
									value: '2',
								},
							]
						},
					]
				},{
					type: "grid",
					columns: 4,
					items: [{
						name: 'numberStart',
						type: 'input',
						label: '首编号起始值',
						placeholder: '默认：1'
					},{
						name: 'numberMargin',
						type: 'listbox',
						label: '编号与正文间距',
						items: margins
					},{
						name: 'numberWidth',
						type: 'listbox',
						label: '编号固定宽度',
						items: margins
					},
					{
						name: 'numberTitleBold',
						type: 'listbox',
						label: '标题粗体',
						items: [{
							text: 'No',
							value: ''
						},{
							text: 'Yes',
							value: '1'
						}]
					},
					]
				},{
					type: "grid",
					columns: 4,
					items: [
						{
							name: 'numberLeft',
							type: 'listbox',
							label: '段前缩进',
							items: margins
						},
						{
							name: 'numberTop',
							type: 'input',
							label: '段前间距（em,mm,px,pt）',
							placeholder: '数值后须加上单位'
						},
						{
							name: 'numberBottom',
							type: 'input',
							label: '段后间距（em,mm,px,pt）',
							placeholder: '数值后须加上单位'
						},
						{
							name: 'untitled',
							type: 'listbox',
							label: '同步条题样式',
							items: [{
								text: 'No',
								value: ''
							},{
								text: 'Yes',
								value: '1'
							}]
						},
					]
				}]
                
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
                    text: 'Ok',
                    primary: true
                }
            ],
            initialData: fromData('number', true),
            onChange: function(api, details) {
                const data = api.getData();
				if (details.name === 'numberSuffixText') {
					data.numberSuffix = data.numberSuffixText;
				} else if (details.name === 'numberWidth' && data.numberWidth) {
					data.numberMargin = "";
				} else if (details.name === 'numberMargin' && data.numberMargin) {
					data.numberWidth = "";
				}
				api.setData(data);
            },
            onSubmit: function (api, details) {
				const data = api.getData();
				editor.execCommand('setListRule', data, 'number');
                api.close();
            },
        })
	}
	
	const editAppdixRule = () => {
		const { fontSize, fontFamily, margins } = getFormats(editor);
		editor.windowManager.open({
            title: '附录章节编号格式设置',
			size: 'medium',
            body: {
                type: 'panel',
				items: [{
					type: "grid",
					columns: 4,
					items: [
						{
							name: 'appendixHeadFont',
							type: 'listbox',
							label: '附录主标题字体',
							items: fontFamily
						},
						{
							name: 'appendixHeadSize',
							type: 'listbox',
							label: '附录主标题字号',
							items: fontSize
						},
						{
							name: 'appendixHeadTop',
							type: 'input',
							label: '附录主标题段前间距',
						},
						{
							name: 'appendixHeadBottom',
							type: 'input',
							label: '附录主标题段后间距'
						}
					]
				},{
					type: "grid",
					columns: 4,
					items: [
						{
							name: 'numberPrefix',
							type: 'listbox',
							label: '编号前缀（如A.1）',
							items: [
								{ text: '无', value: '' },
								{ text: '小数点', value: '.' },
								{ text: '冒号', value: ':' },
							]
						},
						{
							name: 'numberSuffixText',
							type: 'listbox',
							label: '编号后缀（如A.1.）',
							items: [
								{ text: '无', value: '' },
								{ text: '小数点', value: '.' },
								{ text: '冒号', value: ':' },
							]
						},
						{
							name: 'numberSuffix',
							type: 'input',
							label: '自定义后缀',
						},
						{
							name: 'appendixLevel',
							type: 'input',
							label: '编号最大层级',
							placeholder: '默认5级'
						},
						
					]
				},{
					type: "grid",
					columns: 5,
					items: [
						{
							name: 'numberBold',
							type: 'listbox',
							label: '编号粗体',
							items: [{
								text: 'No',
								value: ''
							},{
								text: 'Yes',
								value: '1'
							}]
						},
						{
							name: 'numberSize',
							type: 'listbox',
							label: '字号',
							items: fontSize
						},
						{
							name: 'numberFont',
							type: 'listbox',
							label: '编号字体',
							items: fontFamily
						},
						{
							name: 'numberTitleFont',
							type: 'listbox',
							label: '标题字体',
							items: fontFamily
						},
						{
							name: 'titlePrevfix',
							type: 'input',
							label: '标题前缀名',
							placeholder: '如：附录'
						},
					]
				},{
					type: "grid",
					columns: 5,
					items: [{
						name: 'numberStart',
						type: 'input',
						label: '首编号起始值',
						placeholder: '默认：1'
					},{
						name: 'numberMargin',
						type: 'listbox',
						label: '编号与正文间距',
						items: margins
					},{
						name: 'numberWidth',
						type: 'listbox',
						label: '编号固定宽度',
						items: margins
					},
					{
						name: 'numberTitleBold',
						type: 'listbox',
						label: '标题粗体',
						items: [{
							text: 'No',
							value: ''
						},{
							text: 'Yes',
							value: '1'
						}]
					},
					{
						name: 'autoBreak',
						type: 'listbox',
						label: '按章节默认分页',
						items: [
							{
								text: '无',
								value: '',
							},
							{
								text: '按主章节第一层',
								value: '0',
							},
							{
								text: '按章节第二层',
								value: '1',
							},
						]
					},
					]
				},{
					type: "grid",
					columns: 4,
					items: [
						{
							name: 'numberLeft',
							type: 'listbox',
							label: '段前缩进',
							items: margins
						},
						{
							name: 'numberTop',
							type: 'input',
							label: '段前间距（em,mm,px,pt）',
							placeholder: '数值后须加上单位'
						},
						{
							name: 'numberBottom',
							type: 'input',
							label: '段后间距（em,mm,px,pt）',
							placeholder: '数值后须加上单位'
						},
						{
							name: 'untitled',
							type: 'listbox',
							label: '同步条题样式',
							items: [{
								text: 'No',
								value: ''
							},{
								text: 'Yes',
								value: '1'
							}]
						},
					
					]
				}]
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
                    text: 'Ok',
                    primary: true
                }
            ],
            initialData: fromData('appendix'),
            onChange: function(api, details) {
                const data = api.getData();
				if (details.name === 'numberSuffixText') {
					data.numberSuffix = data.numberSuffixText;
				} else if (details.name === 'numberWidth' && data.numberWidth) {
					data.numberMargin = "";
				} else if (details.name === 'numberMargin' && data.numberMargin) {
					data.numberWidth = "";
				}
				api.setData(data);
            },
            onSubmit: function (api, details) {
				const data = api.getData();
				editor.execCommand('setListRule', data, 'appendix');
                api.close();
            },
        })
	}
	
	const editChapterRule = (editor) => {
		const { fontSize, fontFamily, margins } = getFormats(editor);
		
		editor.windowManager.open({
            title: '中文章编号格式设置',
			size: 'medium',
            body: {
                type: 'panel',
				items: [
					{
						type: "grid",
						columns: 4,
						items: [
							{
								name: 'numberPrefix',
								type: 'input',
								label: '编号前缀,如：第*章',
								placeholder: '默认：第'
							},
							{
								name: 'numberSuffix',
								type: 'input',
								label: '编号后缀',
								placeholder: '默认：章'
							},
							{
								name: 'numberFont',
								type: 'listbox',
								label: '编号字体',
								items: fontFamily
							},
							{
								name: 'numberBold',
								type: 'listbox',
								label: '编号粗体',
								items: [{
									text: 'No',
									value: ''
								},{
									text: 'Yes',
									value: '1'
								}]
							},
						]
					},
					{
						type: "grid",
						columns: 4,
						items: [
							{
								name: 'numberMargin',
								type: 'listbox',
								label: '编号与正文间距',
								items: margins
							},
							{
								name: 'numberWidth',
								type: 'listbox',
								label: '编号固定宽度',
								items: margins
							},
							{
								name: 'numberStart',
								type: 'input',
								inputMode: 'numeric',
								label: '首编号起始值',
								placeholder: '默认：1'
							},
							{
								name: 'numberTitleFont',
								type: 'listbox',
								label: '标题字体',
								items: fontFamily
							},
						]
					},
					{
						type: "grid",
						columns: 4,
						items: [
							{
								name: 'numberTitleBold',
								type: 'listbox',
								label: '标题粗体',
								items: [{
									text: 'No',
									value: ''
								},{
									text: 'Yes',
									value: '1'
								}]
							},
							{
								name: 'numberSize',
								type: 'listbox',
								label: '编号及标题字号',
								items: fontSize
							},
							{
								name: 'align',
								type: 'listbox',
								label: 'Horizontal align',
								items: [
									{
										text: 'None',
										value: ''
									},
									{
										text: 'Left',
										value: 'left'
									},
									{
										text: 'Center',
										value: 'center'
									},
									{
										text: 'Right',
										value: 'right'
									}
								]
							},
							{
								name: 'autoBreak',
								type: 'listbox',
								label: '按章默认分页',
								items:[
									{
										text: 'No',
										value: '',
									},
									{
										text: 'Yes',
										value: '1',
									},
								]
							},
						]
					},
					{
						type: "grid",
						columns: 4,
						items: [
							{
								name: 'numberLeft',
								type: 'listbox',
								label: '段前缩进',
								items: margins
							},
							{
								name: 'numberTop',
								type: 'input',
								label: '段前间距（em,mm,px,pt）',
								placeholder: '数值后须加上单位'
							},
							{
								name: 'numberBottom',
								type: 'input',
								label: '段后间距（em,mm,px,pt）',
								placeholder: '数值后须加上单位'
							},
							
						]
					},
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
                    text: 'Ok',
                    primary: true
                }
            ],
            initialData: fromData('chapter'),
			onChange: function(api, details) {
                const data = api.getData();
				if (details.name === 'numberWidth' && data.numberWidth) {
					data.numberMargin = "";
				} else if (details.name === 'numberMargin' && data.numberMargin) {
					data.numberWidth = "";
				}
				api.setData(data);
            },
            onSubmit: function (api, details) {
				const data = api.getData();
				editor.execCommand('setListRule', data, 'chapter');
                api.close();
            },
        })
	}
	
	const editSectionRule = (editor) => {
		const { fontSize, fontFamily, margins } = getFormats(editor);
		editor.windowManager.open({
            title: '节标题编号格式设置',
			size: 'medium',
            body: {
                type: 'panel',
				items: [
					{
						type: "grid",
						columns: 3,
						items: [
							{
								name: 'numberPrefix',
								type: 'input',
								label: '节编号前缀，如：第*节',
								placeholder: '默认：第'
							},
							{
								name: 'numberSuffix',
								type: 'input',
								label: '节编号后缀',
								placeholder: '默认：节'
							},
							{
								name: 'numberFont',
								type: 'listbox',
								label: '节编号字体',
								items: fontFamily
							},
							
						]
					},
					{
						type: "grid",
						columns: 3,
						items: [
							{
								name: 'numberBold',
								type: 'listbox',
								label: '编号粗体',
								items: [{
									text: 'No',
									value: ''
								},{
									text: 'Yes',
									value: '1'
								}]
							},
							{
								name: 'numberMargin',
								type: 'listbox',
								label: '编号与正文间距',
								items: margins
							},
							{
								name: 'numberWidth',
								type: 'listbox',
								label: '编号固定宽度',
								items: margins
							},
						]
					},
					{
						type: "grid",
						columns: 4,
						items: [
							{
								name: 'numberStart',
								type: 'input',
								label: '首编号起始值',
								placeholder: '默认：1'
							},
							{
								name: 'numberTitleFont',
								type: 'listbox',
								label: '标题字体',
								items: fontFamily
							},
							{
								name: 'numberTitleBold',
								type: 'listbox',
								label: '标题粗体',
								items: [{
									text: 'No',
									value: ''
								},{
									text: 'Yes',
									value: '1'
								}]
							},
							{
								name: 'numberSize',
								type: 'listbox',
								label: '编号及标题字号',
								items: fontSize
							}
						]
					},
					{
						type: "grid",
						columns: 3,
						items: [
							{
								name: 'numberLeft',
								type: 'listbox',
								label: '段前缩进',
								items: margins
							},
							{
								name: 'numberTop',
								type: 'input',
								label: '段前间距（em,mm,px,pt）',
								placeholder: '数值后须加上单位'
							},
							{
								name: 'numberBottom',
								type: 'input',
								label: '段后间距（em,mm,px,pt）',
								placeholder: '数值后须加上单位'
							}
						]
					},
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
                    text: 'Ok',
                    primary: true
                }
            ],
            initialData: fromData('section'),
			onChange: function(api, details) {
                const data = api.getData();
				if (details.name === 'numberWidth' && data.numberWidth) {
					data.numberMargin = "";
				} else if (details.name === 'numberMargin' && data.numberMargin) {
					data.sectionWidth = "";
				}
				api.setData(data);
            },
            onSubmit: function (api, details) {
				const data = api.getData();
				editor.execCommand('setListRule', data, 'section');
                api.close();
            },
        })
	}
	
	const editArticleRule = (editor) => {
		const { fontSize, fontFamily, margins } = getFormats(editor);
		editor.windowManager.open({
            title: '条标题编号格式设置',
			size: 'medium',
            body: {
                type: 'panel',
				items: [
					{
						type: "grid",
						columns: 3,
						items: [
							{
								name: 'numberPrefix',
								type: 'input',
								label: '条编号前缀,如：第*条',
								placeholder: '默认：第'
							},
							{
								name: 'numberSuffix',
								type: 'input',
								label: '条编号后缀',
								placeholder: '默认：条'
							},
							{
								name: 'numberFont',
								type: 'listbox',
								label: '条编号字体',
								items: fontFamily
							}
						]
					},
					{
						type: "grid",
						columns: 3,
						items: [
							{
								name: 'numberBold',
								type: 'listbox',
								label: '编号粗体',
								items: [{
									text: 'No',
									value: ''
								},{
									text: 'Yes',
									value: '1'
								}]
							},
							{
								name: 'numberMargin',
								type: 'listbox',
								label: '条编号与正文间距',
								items: margins
							},
							{
								name: 'numberWidth',
								type: 'listbox',
								label: '编号固定宽度',
								items: margins
							},
						]
					},
					{
						type: "grid",
						columns: 4,
						items: [
							{
								name: 'numberStart',
								type: 'input',
								label: '首编号起始值',
								placeholder: '默认：1'
							},
							{
								name: 'numberTitleFont',
								type: 'listbox',
								label: '标题字体',
								items: fontFamily
							},
							{
								name: 'numberTitleBold',
								type: 'listbox',
								label: '标题粗体',
								items: [{
									text: 'No',
									value: ''
								},{
									text: 'Yes',
									value: '1'
								}]
							},
							{
								name: 'numberSize',
								type: 'listbox',
								label: '编号及标题字号',
								items: fontSize
							}
						]
					},
					{
						type: "grid",
						columns: 3,
						items: [
							{
								name: 'numberLeft',
								type: 'listbox',
								label: '段前缩进',
								items: margins
							},
							{
								name: 'numberTop',
								type: 'input',
								label: '段前间距（em,mm,px,pt）',
								placeholder: '数值后须加上单位'
							},
							{
								name: 'numberBottom',
								type: 'input',
								label: '段后间距（em,mm,px,pt）',
								placeholder: '数值后须加上单位'
							}
						]
					},
					
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
                    text: 'Ok',
                    primary: true
                }
            ],
            initialData: fromData('article'), 
			onChange: function(api, details) {
                const data = api.getData();
				if (details.name === 'numberWidth' && data.numberWidth) {
					data.numberMargin = "";
				} else if (details.name === 'numberMargin' && data.articleMargin) {
					data.numberWidth = "";
				}
				api.setData(data);
            },		
            onSubmit: function (api, details) {
				const data = api.getData();
				editor.execCommand('setListRule', data, 'article');
                api.close();
            },
        })
	}
	
    const itemList = [
		{
            type: 'nestedmenuitem',
			icon: 'ol-list',
            text: '数字章节编号',
			key: 'numberChapter',
            getSubmenuItems: function () {
				let isSetTemp = checkSetTemp();
				let ruleConfig = [];
				if (isSetTemp) {
					ruleConfig = [
						{
							type: 'menuitem',
							text: '⚙️自定义编号规则',
							onAction: function () {
								editListRule(editor);
							}
						}
					];
				}
				return [
                    {
                        type: 'menuitem',
                        text: '一级 1 ﹄',
                        onAction: function () {
                            doAction(editor, { indexLens: 1, cls:'ol-list', cmd:'chapter' });
                        }
                    },
                    {
                        type: 'menuitem',
                        text: '二级 1.1 ﹄',
                        onAction: function () {
                            doAction(editor, { indexLens: 2, cls:'ol-list', cmd:'chapter' });
                        }
                    },
					{
                        type: 'menuitem',
                        text: '三级 1.1.1 ﹄',
                        onAction: function () {
                            doAction(editor, { indexLens: 3, cls:'ol-list', cmd:'chapter' });
                        }
                    },
					{
                        type: 'menuitem',
                        text: '四级 1.1.1.1 ﹄',
                        onAction: function () {
                            doAction(editor, { indexLens: 4, cls:'ol-list', cmd:'chapter' });
                        }
                    },
					{
                        type: 'menuitem',
                        text: '五级 1.1.1.1.1 ﹄',
                        onAction: function () {
                            doAction(editor, { indexLens: 5, cls:'ol-list', cmd:'chapter' });
                        }
                    },
					{
                        type: 'menuitem',
                        text: '↺ 切换重新编号',
                        onAction: function () {
                            editor.execCommand('resetListNumber');
                        }
                    }
                ].concat(ruleConfig);
            }
        },
		{
			type: 'nestedmenuitem',
			icon: 'appendix-list',
            text: '附录章节编号',
			key: 'chineseChapter',
            getSubmenuItems: function () {
				let isSetTemp = checkSetTemp();
				let ruleConfig = [];
				if (isSetTemp) {
					ruleConfig = [
						{
							type: 'menuitem',
							text: '⚙️自定义编号规则',
							onAction: function () {
								editAppdixRule(editor);
							}
						}
					];
				}
				
				return [
                    /*{
                        type: 'menuitem',
                        text: '附录章标题 ﹄',
                        onAction: function () {
                            doAction(editor, { indexLens: 0, cls:'appendix-list', cmd:'chapter' });
                        }
                    },
					*/
					{
                        type: 'menuitem',
                        text: '附录A（主标题） ﹄',
                        onAction: function () {
                            doAction(editor, { indexLens: 0, cls:'appendix-list', cmd:'chapter' });
                        }
                    },
					{
                        type: 'menuitem',
                        text: '一级 A.1 ﹄',
                        onAction: function () {
                            doAction(editor, { indexLens: 1, cls:'appendix-list', cmd:'chapter' });
                        }
                    },
                    {
                        type: 'menuitem',
                        text: '二级 A.1.1 ﹄',
                        onAction: function () {
                            doAction(editor, { indexLens: 2, cls:'appendix-list', cmd:'chapter' });
                        }
                    },
					{
                        type: 'menuitem',
                        text: '三级 A.1.1.1 ﹄',
                        onAction: function () {
                            doAction(editor, { indexLens: 3, cls:'appendix-list', cmd:'chapter' });
                        }
                    },
					{
                        type: 'menuitem',
                        text: '四级 A.1.1.1.1 ﹄',
                        onAction: function () {
                            doAction(editor, { indexLens: 4, cls:'appendix-list', cmd:'chapter' });
                        }
                    },
					{
                        type: 'menuitem',
                        text: '五级 A.1.1.1.1.1 ﹄',
                        onAction: function () {
                            doAction(editor, { indexLens: 5, cls:'appendix-list', cmd:'chapter' });
                        }
                    },
					/*
					{
                        type: 'menuitem',
                        text: '⚙️自定义编号规则',
                        onAction: function () {
                            editAppdixRule(editor);
                        }
                    }
					*/
                ].concat(ruleConfig);
			}
		},
		
		{
            type: 'nestedmenuitem',
			icon: 'chapter-list',
            text: '中文章节编号',
			key: 'chineseChapter',
            getSubmenuItems: function () {
				let isSetTemp = checkSetTemp();
				let ruleConfig = [];
				if (isSetTemp) {
					ruleConfig = [
						{
							type: 'menuitem',
							text: '⚙️自定义章编号规则',
							onAction: function () {
								editChapterRule(editor);
							}
						},
						{
							type: 'menuitem',
							text: '⚙️自定义节标题编号',
							onAction: function () {
								editSectionRule(editor);
							}
						},
						{
							type: 'menuitem',
							text: '⚙️自定义条标题编号',
							onAction: function () {
								editArticleRule(editor);
							}
						},
					];
				}
                return [
                    {
                        type: 'menuitem',
                        text: '章标题 ﹄',
                        onAction: function () {
                            doAction(editor, { indexLens: 1, cls:'chapter-list', cmd:'chapter' });
                        }
                    },
                    {
                        type: 'menuitem',
                        text: '节标题 ﹄',
                        onAction: function () {
                            doAction(editor, { indexLens: 1, cls:'section-list', cmd:'chapter' });
                        }
                    },
					{
                        type: 'menuitem',
                        text: '条标题 ﹄',
                        onAction: function () {
                            doAction(editor, { indexLens: 1, cls:'article-list', cmd:'chapter' });
                        }
                    },
					/*
					{
                        type: 'menuitem',
                        text: '⚙️自定义章编号规则',
                        onAction: function () {
                            editChapterRule(editor);
                        }
                    },
					{
                        type: 'menuitem',
                        text: '⚙️自定义节标题编号',
                        onAction: function () {
                            editSectionRule(editor);
                        }
                    },
					{
                        type: 'menuitem',
                        text: '⚙️自定义条标题编号',
                        onAction: function () {
                            editArticleRule(editor);
                        }
                    },
					*/
                ].concat(ruleConfig);
            }
        },
	];
	
	const getItems = (editor, cata=1) => {
        return {
			text: 'caption',
            tooltip: '',
            icon: 'ordered-list',
			fetch: callback => {
				const config = getConfig('pageContainer');
				if (config && config?.chapterType) {
					const filterList = itemList.filter(item => config.chapterType.includes(item.key));
					callback(filterList);
				} else {
					callback(itemList);
				}
				
			},
		}
    };
	
	// 快捷键设置第一层章节
	editor.addShortcut('Meta+1', '', function(e){
		// doAction(editor, { cls:'ol-list', cmd:"chapter", indexLens:1 });
	});
	// 快捷键设置第一层中文章节
	editor.addShortcut('Meta+2', '', function(e){
		// doAction(editor, { cls:'chapter-list', cmd:"chapter", indexLens:1 });
	});

    editor.ui.registry.addMenuButton('collect-chapter', getItems(editor, 1));

    return {
        getMetadata: function() {
            return {
                name: pluginName,
                url: "http://www.bzton.cn",
            };
        }
    };
})
