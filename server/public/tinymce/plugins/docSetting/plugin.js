

tinymce.PluginManager.add('docSetting', function(editor, url) {
    const pluginName = 'docSetting';

	const getConfig = (key) => {
		let myConfig = sessionStorage.getItem('pageConfig');
		if (myConfig) {
			myConfig = JSON.parse(myConfig)?.[key];
		}
		return myConfig || {}
	}

    const docData = function() {
        return getConfig('docSetting')
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
		text: '无',
		value: ''
	},{
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

    const styleSetting = function() {
		const { fontSize, fontFamily, margins } = getFormats();
		console.log('fontSize==>', fontSize)
        const formulaData = getConfig('formula') || {};
		formulaData.custom = true;
		editor.windowManager.open({
            title: 'documentStyle',
            body: {
                type: 'panel',
                items: [
					
					{
						type: 'grid',
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
								name: 'lineHeight', 
								type: 'listbox', 
								label: '段落文本行距',
								items: [
									{text:'1倍行距', value:'1'},
									{text:'1.5倍行距',value:'1.5'},
									{text:'2倍行距',value:'2'},
									{text:'2.5倍行距',value:'2.5'},
									{text:'3倍行距',value:'3'},
									{text:'3.5倍行距',value:'3.5'},
									{text:'4倍行距',value:'4'},
								]
							},
							{
								name: 'paragraphPadding', 
								type: 'listbox', 
								label: '段落左边距',
								items: margins
							},
						]
					},
					{
						type: 'grid',
						columns: 4,
						items: [
							{
								name: 'paragraphIndent', 
								type: 'listbox', 
								label: '首行缩进',
								items: margins
							},
							
							{
								type: 'listbox', 
								name: 'emptyPage',
								label: '导出WORD自动插入空白页',
								items: [
									{
										value: '',
										text: '无空白页'
									},
									{
										value: 'cover',
										text: '封面页后'
									},
									{
										value: 'toc',
										text: '目录页后'
									},
									{
										value: 'odd',
										text: '奇数页后'
									},
								]
							},
							{
								name: 'endLine', 
								type: 'listbox', 
								label: '导出WORD添加终止线',
								items: [
									{
										value: '',
										text: 'No'
									},
									{
										value: '1',
										text: 'Yes'
									},
								]
							},
							/*
							{
								name: 'docType', 
								type: 'listbox', 
								label: '文档类型',
								items: [
									{
										text: '默认一般文档',
										value: ''
									},
									{
										text: '富文本文档',
										value: 'rich'
									},
									{
										text: '论文学术文档',
										value: 'thesis'
									},
									{
										text: '标准格式标准文档',
										value: 'standard'
									},
								]
							},
							{
								name: 'imgAlign', 
								type: 'listbox', 
								label: '图片默认位置',
								items: [
									{
										text: '不设置',
										value: ''
									},
									{
										text: '居左',
										value: 'left'
									},
									{
										text: '居中',
										value: 'center'
									},
									{
										text: '居右',
										value: 'right'
									}
								]
							},
							*/
						]
					},
					/*
					{
						type: 'grid',
						columns: 5,
						items: [
							{
								name: 'convertFactor', 
								type: 'input', 
								label: 'WORD校正系数',
								placeholder: '默认:0.8'
							},
							{
								type: 'listbox', 
								name: 'emptyPage',
								label: '导出自动插入空白页',
								items: [
									{
										value: '',
										text: '无空白页'
									},
									{
										value: 'cover',
										text: '封面页后'
									},
									{
										value: 'toc',
										text: '目录页后'
									},
									{
										value: 'odd',
										text: '奇数页后'
									},
								]
							},
							{
								name: 'endLine', 
								type: 'listbox', 
								label: '导出添加终止线',
								items: [
									{
										value: '',
										text: 'No'
									},
									{
										value: '1',
										text: 'Yes'
									},
								]
							},
							{
								name: 'convertToc', 
								type: 'listbox', 
								label: '导出重置目录域',
								items: [
									{
										value: '',
										text: 'No'
									},
									{
										value: '1',
										text: 'Yes'
									},
								]
							}
						]
					},
					*/
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
            initialData: docData(),
            onSubmit: function (api, details) {
                const data = api.getData();
				
				api.close();
            },
        })
    };
	
	const fromConfig = (type) => {
		const config = getConfig(type);
        return config;
	}
	
	const setTable = () => {
		const { fontSize, fontFamily, margins } = getFormats();
		editor.windowManager.open({
            title: '表格样式',
			size: 'medium',
            body: {
                type: 'panel',
				items: [
					{
						type: "grid",
						columns: 4,
						items: [
							{
								name: 'borderStyle',
								type: 'listbox',
								label: '表格框线样式',
								items: getBorderStyle(),
							},
							{
								name: 'borderColor',
								type: 'colorinput',
								label: '表格框线颜色'
							},
							{
								name: 'borderWidth',
								type: 'listbox',
								label: '表格外框线宽',
								items: getBorderWidth(),
							},
							{
								name: 'tdBorderWidth',
								type: 'listbox',
								label: '单元格边框线宽',
								items: getBorderWidth(),
							},
						]
					},
					
					{
						type: "grid",
						columns: 4,
						items: [
							{
								name: 'fontFamily',
								type: 'listbox',
								label: '表格字体',
								items: fontFamily,
							},
							{
								name: 'fontSize',
								type: 'listbox',
								label: '表格字号',
								items: fontSize,
							},
							{
								name: 'padding',
								type: 'input',
								label: '单元格边距'
							},
							{
								name: 'showTitle',
								type: 'listbox',
								label: '默认显示表标题',
								items: [
									{ text:'No',value:''},
									{ text:'Yes',value:'1'},
								]
							},
						]
					},
					{
						type: "grid",
						columns: 4,
						items: [
							
							{
								name: 'titlePrefix',
								type: 'input',
								label: '表标题前缀名',
								placeholder: '默认：表'
							},
							{
								name: 'start',
								type: 'input',
								label: '表标题起始编号',
								placeholder: '默认：1',
								inputMode: 'numeric'
							},
							{
								name: 'type',
								type: 'listbox',
								label: '表标题编号类别',
								items: [
									{ text:'默认阿拉伯数字递增', value:'number'},
									{ text:'按中文数字递增',value:'chinese'},
									{ text:'按章-顺序号',value:'chapter'},
									{ text:'按中文章-节-顺序号',value:'section'},
								]
							},
							{
								name: 'typePrevfix',
								type: 'input',
								label: '编号顺序前缀',
								placeholder: '',
							},
						]
					},
					{
						type: "grid",
						columns: 4,
						items: [
							{
								name: 'titleFontFamily',
								type: 'listbox',
								label: '表标题字体',
								items: fontFamily,
							},
							{
								name: 'titleFontSize',
								type: 'listbox',
								label: '表标题字号',
								items: fontSize,
							},
							{
								name: 'titleTop',
								type: 'listbox',
								label: '表标题上边距',
								items: margins
							},
							{
								name: 'titleBottom',
								type: 'listbox',
								label: '表标题下边距',
								items: margins
							},
						]
					},
					{
						type: "grid",
						columns: 4,
						items: [
							{
								name: 'titleAlign',
								type: 'listbox',
								label: '表标题水平对齐',
								items: [{
									text:'默认居左',
									value: ''
								},{
									text:'居中',
									value: 'center'
								},{
									text:'居右',
									value: 'right'
								},]
							},
							{
								name: 'headerBorder',
								type: 'listbox',
								label: '表头边框线宽',
								items: getBorderWidth(),
							},
							{
								name: 'footerBorder',
								type: 'listbox',
								label: '表脚注边框线宽',
								items: getBorderWidth(),
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
            initialData: fromConfig('table'),
            onSubmit: function (api, details) {
				const data = api.getData();
				editor.execCommand('setTableAttrs', data, true);
                api.close();
            },
        })
	}
	
	const setTitle = (type) => {
		const { fontSize, fontFamily, margins } = getFormats();
		let tableItems = []
		if (type === 'table-title') {
			tableItems = [
				
			]
		}
		editor.windowManager.open({
            title: type === 'table-title' ? '表格样式及表标题格式设置' :'图标题格式设置',
			size: 'medium',
            body: {
                type: 'panel',
				items: [
					{
						type: "grid",
						columns: 4,
						items: [
							{
								type: 'label',
								label: '插入图片后同时插入标题',
								items: [{
									type: 'checkbox',
									name: 'showTitle',
									label: 'Yes'
								}]
							},
							{
								name: 'type',
								type: 'listbox',
								label: '图标题编号类别',
								items: [
									{ text:'按阿拉伯数字递增', value:'number'},
									{ text:'按中文数字递增',value:'chinese'},
									{ text:'按章-顺序号',value:'chapter'},
									{ text:'按中文章-节-顺序号',value:'section'},
								]
							},
							{
								name: 'typePrevfix',
								type: 'input',
								label: '编号顺序前缀',
								placeholder: '',
							},
							{
								name: 'titlePrefix',
								type: 'input',
								label: `编号前缀,如：${type==='table'?'表':'图'}`,
								placeholder: `默认：${type==='table'?'表':'图'}`
							},
							
						]
					},
					{
						type: "grid",
						columns: 4,
						items: [
							{
								name: 'titleSuffix',
								type: 'listbox',
								label: `编号后缀（如${type==='table'?'表':'图'}.1）`,
								items: [
									{ text: '无', value: '' },
									{ text: '空格占位', value: ' ' },
									{ text: '小数点', value: '.' },
									{ text: '冒号', value: ':' },
								]
							},
							{
								name: 'start',
								type: 'input',
								label: '首编号起始值',
								placeholder: '默认：1'
							},
							{
								name: 'titleMargin',
								type: 'listbox',
								label: '编号与标题间距',
								items: margins
							},
							{
								name: 'titleFontFamily',
								type: 'listbox',
								label: '字体',
								items: fontFamily
							},
							
						]
					},
					{
						type: "grid",
						columns: 4,
						items: [
							{
								name: 'titleFontSize',
								type: 'listbox',
								label: '字号',
								items: fontSize
							},
							{
								name: 'titleBold',
								type: 'listbox',
								label: '粗体',
								items: [{
									text: 'No',
									value: ''
								},{
									text: 'Yes',
									value: '1'
								}]
							},
							{
								name: 'titleTop',
								type: 'input',
								label: '段前间距（em,mm,px,pt）',
								placeholder: '数值后须加上单位'
							},
							{
								name: 'titleBottom',
								type: 'input',
								label: '段后间距（em,mm,px,pt）',
								placeholder: '数值后须加上单位'
							},
							{
								name: 'titleAlign',
								type: 'listbox',
								label: 'H Align',
								items: [{
									text: 'Left',
									value: 'left'
								},{
									text: 'Center',
									value: 'center'
								},{
									text: 'Right',
									value: 'right'
								}]
							},
							{
								name: 'borderStyle',
								type: 'listbox',
								label: '图片框线样式',
								items: getBorderStyle(),
							},
							{
								name: 'borderColor',
								type: 'colorinput',
								label: '图片框线颜色'
							},
							{
								name: 'borderWidth',
								type: 'listbox',
								label: '图片外框线宽',
								items: getBorderWidth(),
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
            initialData: fromConfig(type),
            onSubmit: function (api, details) {
				const data = api.getData();
				editor.execCommand('setTitleRule', data, type);
                api.close();
            },
        })
	};
	
	const headerFooterData = function(type) {
		return getConfig(type);
    };
	
	const getHeaderFooterItems = function(type) {
		const { fontSize, fontFamily } = getFormats();
		const items = [
			{
				type: 'grid', // component type
				columns: 4, 
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
					},
					{
						type: 'listbox',
						name: 'fontFamily',
						label: '字体',
						items: fontFamily
					},
				]
			},
			{
				type: 'grid', // component type
				columns: 4,
				items: [
					{
						type: 'listbox',
						name: 'fontSize',
						label: '字号',
						items: fontSize
					},
					{
						type: 'listbox',
						name: 'oddAlgin',
						label: '奇数页水平对齐',
						items: [
							{ value: 'left', text: '居左' },
							{ value: 'center', text: '居中' },
							{ value: 'right', text: '居右(默认)' },
						]
					},
					{
						type: 'listbox',
						name: 'evenAlgin',
						label: '偶数页水平对齐',
						items: [
							{ value: 'left', text: '居左' },
							{ value: 'center', text: '居中' },
							{ value: 'right', text: '居右(默认)' },
						]
					},
				]
			},
		];
		
		const headerItems = [
			{
				type: 'grid',
				columns: 4, 
				items: [
					{
						type: 'listbox',
						name: 'titleType',
						label: '页眉标题类型',
						items: [
							{ value: '', text: '无' },
							{ value: '1', text: '按文档名称定义标题' },
							{ value: '1', text: '按文档编号定义标题' },
						]
					}
				]
			},
		];
		
		const footerItems = [
			{
				type: 'grid',
				columns: 4,
				items: [
					{
						type: 'listbox',
						name: 'numberType',
						label: '页码类型',
						items: [
							{ value: 'number', text: '阿拉伯数字(1,2,3)' },
							{ value: 'chinese', text: '中文数字(一,二,三)' },
							{ value: 'roman', text: '罗马数字(I,II,III)' },
						]
					},
					{
						type: 'input',
						name: 'numberPrefix',
						label: '页码前缀(如第)',
					},
					{
						type: 'input',
						name: 'numberSuffix',
						label: '页码后缀(如页)',
					},
					{
						type: 'listbox',
						name: 'titleType',
						label: '页码组成方式',
						items: [
							{ value: '', text: '自动顺序号' },
							{ value: '1', text: '按章节顺序号' },
						]
					}
				]
			},
		]
		
		if (type === 'header') {
			return items;
		}
		return items.concat(footerItems);
	};
	
	const setHeaderFooter = (type) => {
		editor.windowManager.open({
            title: type === 'header' ? 'page header' : 'page footer',
            body: {
                type: 'panel',
                items: getHeaderFooterItems(type),
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
	
	const setDraft = () => {
		const draftData = getConfig('draft');
		editor.windowManager.open({
            title: '草稿箱设置',
            body: {
                type: 'panel',
                items: [
					{
						type: 'grid', // component type
						columns: 3, 
						items: [
							{
								type: 'checkbox',
								name: 'enabled',
								label: '启用草稿箱',
							},
							{
								type: 'listbox',
								name: 'counts',
								label: '草稿历史记录数',
								items: [
									{ value: '5', text: '5' },
									{ value: '10', text: '10' },
									{ value: '20', text: '20' },
									{ value: '30', text: '30' },
									{ value: '40', text: '40' },
									{ value: '50', text: '50' },
								]
							},
							{
								type: 'listbox',
								name: 'interval',
								label: '每次记录间隔时间',
								items: [
									{ value: '30', text: '每30秒' },
									{ value: '60', text: '每1分钟' },
									{ value: '120', text: '每2分钟' },
									{ value: '300', text: '每5分钟' },
									{ value: '600', text: '每10分钟' },
								]
							}
						]
					},
					
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
            initialData: draftData,
            onSubmit: function (api, details) {
                const data = api.getData();
				editor.execCommand('setCommonConfig', data, 'draft');
				api.close();
            },
        })
	}
	
	const setFormula = () => {
		const formulaData = getConfig('formula') || {};
		formulaData.custom = true;
		editor.windowManager.open({
            title: '公式设置',
            body: {
                type: 'panel',
                items: [
					{
						type: 'label',
						label: '公式下拉菜单',
						items: [
							{
								type: 'grid',
								columns: 4,
								group: true,
								items: [
									{
										type: 'checkbox',
										name: 'custom',
										disabled: true,
										label: '自定义公式'
									},
									{
										type: 'checkbox',
										name: 'hand',
										label: '手写公式'
									},
									{
										type: 'checkbox',
										name: 'image',
										label: '图片转公式'
									},
									{
										type: 'checkbox',
										name: 'edit',
										label: '输入公式'
									},
									{
										type: 'checkbox',
										name: 'number',
										label: '公式编号'
									},
								]
							}
						]
					},
					{
						type: 'grid',
						columns: 3,
						items: [
							{
								type: 'listbox',
								name: 'align',
								label: '公式水平对齐',
								items: [
									{ value: '', text: '默认居左' },
									{ value: 'center', text: '居中' },
									{ value: 'right', text: '居右' },
								]
							},
							
							{
								type: 'listbox',
								name: 'numberType',
								label: '公式编号类型',
								items: [
									{ value: '', text: '默认阿拉伯数字编号' },
									{ value: 'chinese', text: '中文数字编号' },
								]
							},
							{
								type: 'input',
								name: 'numberStart',
								label: '编号起始值',
								placeholder: '默认从数字1开始',
								inputMode: 'numeric'
							},
						]
					},
					{
						type: 'grid',
						columns: 3,
						items: [
							{
								type: 'label',
								label: '自动编号（仅在段落行中实现）',
								items: [
									{
										type: 'checkbox',
										name: 'autoNumber',
										label: 'Yes'
									},
								],
							},
							{
								type: 'label',
								label: '自动提取公式中的变量名',
								items: [
									{
										type: 'checkbox',
										name: 'autoVariable',
										label: 'Yes'
									},
								],
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
            initialData: formulaData,
            onSubmit: function (api, details) {
                const data = api.getData();
				editor.execCommand('setCommonConfig', data, 'formula');
				api.close();
            },
        })
	}

    const itemList = [
		{
            type: 'menuitem',
            text: '全局格式样式',
            onAction: () => {
                styleSetting();
            },
        },
		{
            type: 'menuitem',
            text: '文档章节设置',
            onAction: () => {
                editor.execCommand('setDocChapter');
            },
        },
		{
            type: 'nestedmenuitem',
            text: 'header footer',
            getSubmenuItems: function () {
                return headerFooterItems;
            },
        },
		{
            type: 'menuitem',
            text: '表格及标题设置',
            onAction: () => {
                setTable();
            },
        },
		{
            type: 'menuitem',
            text: '图片及标题设置',
            onAction: () => {
                setTitle('imageTitle');
            },
        },
		{
            type: 'menuitem',
            text: '公式设置',
            onAction: () => {
                setFormula();
            },
        },
		{
            type: 'menuitem',
            text: '草稿箱设置',
            onAction: () => {
                setDraft();
            },
        },
    ];
	
	editor.ui.registry.addMenuButton('docSetting', {
        icon: 'doc-setting',
        text: 'document setting',
        fetch: callback => {
            callback(itemList);
        }
    });
	
	editor.addCommand('styleSetting', ()=> {
		styleSetting();
	})
	
	
	
    return {
        getMetadata: function() {
            return {
                name: pluginName
            };
        }
    };
})
