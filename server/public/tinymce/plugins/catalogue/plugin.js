tinymce.PluginManager.add('catalogue', function(editor, url) {
    const pluginName = 'toc';
	
	const getConfig = (key) => {
		let myConfig = sessionStorage.getItem('pageConfig');
		if (myConfig) {
			myConfig = JSON.parse(myConfig)?.[key];
		}
		return myConfig || {}
	}
    const fromPageData = function() {
		const config = getConfig('toc') || {};
		config.tocType = checkTocType();
		return config;
    };
	
	const checkSetTemp = () => {
		const docConfig = editor.settings?.doc_config || {};
		return docConfig.setTemp;
	}
	
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
	
	const getFormats = (editor) => {
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
			fontFamily.unshift({text:'Default', value:'' });
		
		const fontSize = editor?.settings?.fontSize || defaultFontSize;
		const emptyFontSize = fontSize.find(item => item.value==='');
		if (!emptyFontSize)
			fontSize.unshift({text:'Default', value:'' });
		
		return {
			fontSize: editor.settings.fontSize,
			fontFamily,
			margins: editor?.settings?.margins || defaultMargins,
		}
	}
	
	const checkTocType = () => {
		const pageContainer = editor.getBody().querySelector('.page-container');
		let tocPage = pageContainer.querySelector(`div.toc`);
		if (tocPage) {
			return tocPage.dataset.type;
		}
		return "";
	}

    const doAction = function() {
		// 获取章节的配置
		/*
		const chapterConfig = getConfig('docChapters');
		if (!chapterConfig || !Array.isArray(chapterConfig)) {
			editor.windowManager.alert('请先配置文档章节！');
			return
		}
		*/

		const chapterItems = chapterConfig.map(item => {
			return {
				type: 'checkbox',
				name: 'type' + item.type,
				label: item.text
			}
		})
		
		const { fontSize, fontFamily, margins } = getFormats(editor);
		
		let isSetTemp = checkSetTemp();
		let ruleConfig = [];
		if (isSetTemp) {
			ruleConfig = [
				{
					type: 'label',
					label: '目录项设置',
					items: [
						{
							type: "grid",
							columns: 4,
							items: [
								{
									type: 'input',
									name: 'marginTop',
									label: '目录域段前间距(em,px,pt)'
								},
								{
									type: 'input',
									name: 'marginBottom',
									label: '目录域段后间距(em,px,pt)'
								},
								{
									type: 'listbox',
									name: 'fontFamily',
									label: '目录域字体',
									items: fontFamily
								},
								{
									type: 'listbox',
									name: 'fontSize',
									label: '目录域字号',
									items: fontSize
								},
							]
							
						},
						{
							type: "grid",
							columns: 4,
							items: [
								{
									type: 'listbox',
									name: 'numberFont',
									label: '目录域页码字体',
									items: fontFamily
								},
								{
									type: 'listbox',
									name: 'numberSize',
									label: '目录域页码字号',
									items: fontSize
								},
								
								{
									type: 'listbox',
									name: 'pageNum',
									label: '目录页-页脚页码类型',
									items: [{
										text:'不需要页码',
										value: ''
									},{
										text:'阿拉伯数字编号(1,2,3)',
										value: 'number'
									},{
										text:'罗马数字编号(I,II,III)',
										value: 'roman'
									}]
								},
								{
									type: 'input',
									name: 'pageNumStr',
									label: '固定目录页码',
									placeholder: '如：0-1-1'
								},
							]
						}
					]
				}
			];
		}
		
        editor.windowManager.open({
            title: 'toc items',
			size: 'medium',
            body: {
                type: 'panel',
				items: [
					{
						type: 'label',
						label: '文档目录页',
						items: [
							{
								type: "listbox",
								name: "tocType",
								items: [
									{
										value: 'normal',
										text: '通用目录类型',
									},
									{
										value: 'table',
										text: '表格目录类型',
									},
									{
										value: '',
										text: '不需要目录页',
									},
								]
							}
						]
					},
					{
						type: 'label',
						label: 'default toc content',
						items: [
							{
								type: "grid",
                                columns: 6,
								group: true,
								items: chapterItems
							}
						]
					},
					{
						type: 'label',
						label: '中文章节条',
						items: [
							{
								type: "grid",
                                columns: 3,
								items:[
									{
										type: 'checkbox',
										name: 'chapter-list',
										label: '章标题'
									},
									{
										type: 'checkbox',
										name: 'section-list',
										label: '节标题'
									},
									{
										type: 'checkbox',
										name: 'article-list',
										label: '条标题'
									}
								]
							}
						]
					},
					{
						type: 'label',
						label: '可选的目录内容',
						items: [
							{
								type: "grid",
                                columns: 4,
								items: [
									{
										type: 'checkbox',
										name: 'appendix',
										label: '附录主标题'
									},
									{
										type: 'checkbox',
										name: 'level1',
										label: '一级条标题:1'
									},
									{
										type: 'checkbox',
										name: 'level2',
										label: '二级条标题:1.1'
									},
									{
										type: 'checkbox',
										name: 'level3',
										label: '三级条标题:1.1.1'
									},
									{
										type: 'checkbox',
										name: 'level4',
										label: '四级条标题:1.1.1.1'
									},
									{
										type: 'checkbox',
										name: 'level5',
										label: '五级条标题:1.1.1.1.1'
									},
								]
							},
							
							{
								type: "grid",
                                columns: 4,
								items: [
									{
										type: 'checkbox',
										name: 'imgTitle',
										label: '图标题'
									},
									{
										type: 'checkbox',
										name: 'tableTitle',
										label: '表标题'
									}
								]
							},
						]
					},
					
                ].concat(ruleConfig)
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
            initialData: fromPageData(),
            onSubmit: function (api, details) {
                const data = api.getData();
				// console.log('onSubmit',data);
				editor.execCommand('toggleCatalogue', data);
				api.close();
            },
        })
    };

    const checkUseCatalogue = editor => {
    	const docConfig = editor.settings.doc_config || {};
    	if (docConfig?.notCatalogue) {
    		return true;
    	}
    	return false;
    }


    editor.ui.registry.addButton('catalogue', {
        text: pluginName,
		icon: 'toc',
        tooltip: pluginName,
        onAction: () => {
			doAction();
		},
		onSetup: (api) => {
			var nodeChangeHandler = (e) => {
                let disabled = checkUseCatalogue(editor);
                api.setDisabled(disabled);
            };
            editor.on('NodeChange', nodeChangeHandler);
            return () => {
                return editor.off('NodeChange', nodeChangeHandler);
            };
        }
    });

    editor.ui.registry.addMenuItem('catalogue', {
        text: pluginName,
        tooltip: pluginName,
        onAction: function () {
            doAction();
        },
        onSetup: (api) => {
			var nodeChangeHandler = (e) => {
                let disabled = checkUseCatalogue(editor);
                api.setDisabled(disabled);
            };
            editor.on('NodeChange', nodeChangeHandler);
            return () => {
                return editor.off('NodeChange', nodeChangeHandler);
            };
        }
    });
	
	editor.addCommand('tocSetting', ()=> {
		doAction();
	})
	


    return {
        getMetadata: function() {
            return {
                name: pluginName
            };
        }
    };
})
