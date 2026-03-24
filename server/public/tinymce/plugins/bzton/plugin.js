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
    const collectionPlugins = [
        {
            name: 'close-btn',
            icon: 'close-btn',
            tooltip: 'Close',
            text: 'Close',
            cmd: 'close'
        },
		{
            name: 'auto-size',
            tooltip: 'Auto size',
            text: 'Auto size',
            cmd: 'autoSize',
        },
		{
			name: 'textIndent',
			icon: 'indent',
			tooltip: 'text indent',
			cmd: 'textIndent'
		},
		{
			name: 'textOutdent',
			icon: 'outdent',
			tooltip: 'text outdent',
			cmd: 'textOutdent'
		},
		{
			name: 'paragraph-btn',
			icon: 'paragraph',
			text: 'Insert Paragraph',
			tooltip: 'Insert Paragraph',
			act: 'paragraph'
		},
		{
			name: 'newLine',
			icon: 'new-line',
			text: 'Insert new line',
			tooltip: 'Insert new line',
			onSetup: true,
			act: 'newLine'
		},
		{
			name: 'customRemoveFormat',
			icon: 'remove-formatting',
			tooltip: 'Clear formatting',
			//onSetup: true,
			act: 'customRemoveFormat'
		},
		{
			name: 'list-untitled',
			text: 'switch topic',
			tooltip: 'Switch chapter clauses to either numbered or unnumbered',
			act: 'untitled'
		},
		{
			name: 'tabletitle',
			icon: 'title',
			text: 'table title',
			cmd: 'tableTitle'
		},
		{
			name: 'imgtitle',
			icon: 'title',
			text: 'image title',
			cmd: 'imageTitle'
		},
		{
			name: 'remove-btn',
			icon: 'cut',
			tooltip: 'remove element',
			cmd: 'removeElement',
			children: [
                {
                    text: 'remove dom',
                    act: 'removeDom'
                },
                {
                    text: 'remove page',
                    act: 'removePage'
                }
            ]
		},
		{
            name: 'importDoc',
            text: 'import File',
            act: 'importFile',
            children: [
                {
                    text: 'Local file',
                    act: 'upload'
                },
                {
                    text: 'Document list',
                    act: 'data'
                }
            ]
        },
		{
            name: 'editDom',
            text: 'Edit elements',
			icon: 'visualblocks',
			act: 'setDom',
			children: [
                {
					text: 'add Tag',
					act: 'setTag'
				},
				{
					text: 'Format Style',
					act: 'setStyle'
				},
            ]
        },
		{
			name: 'lockDom',
			icon: 'lock',
			tooltip: 'toggle lock',
			act: 'lock',
			children: [
                {
					text: 'lock Dom',
					act: 'lockDom'
				},
				{
					text: 'lock Page',
					act: 'lockPage'
				},
            ]
		},
		{
			name: 'example-btn',
			text: 'Example Tag',
			icon: 'biaoji',
			tooltip: 'Example Tag',
			act: 'toggleZhu',
			children: [
				{
					text: 'General Example',
					act: 'example'
				},
				{
					text: 'Example Number',
					act: 'examplex',
					cls: 'examplex'
				},
				{
					text: 'Example First Number',
					act: 'example-x',
					cls: 'examplex'
				},
				{
					text: 'set Number',
					act: 'resetx'
				},
				{
					text: '⚙️自定义格式',
					act: 'formatx',
					cls: 'examplex'
				}
			]
		},
		{
			name: 'zhu-btn',
			text: 'Label Tag',
			tooltip: 'Label Tag',
			icon: 'biaozhu',
			act: 'toggleZhu',
			children: [
				{
					text: 'General Label Tag',
					act: 'zhu'
				},
				{
					text: 'Label Number',
					act: 'zhux',
					cls: 'zhux',
				},
				{
					text: 'Label First Number',
					act: 'zhu-x',
					cls: 'zhux',
				},
				{
					text: 'set Number',
					act: 'resetx'
				},
				{
					text: '⚙️自定义格式',
					act: 'formatx',
					cls: 'zhux'
				}
			]
		},
		{
			name: 'zhu-imgtable',
			text: 'table note',
			icon: 'tags',
			act: 'toggleZhuImgTable',
			children: [
				{
					text: 'normal table note',
					act: 'zhu',
					cls: 't-zhu'
				},
				{
					text: 'table note X',
					act: 'zhux',
					cls: 't-zhux'
				},
				{
					text: 'first table note X',
					act: 'zhu-x',
					cls: 't-zhux'
				},
				{
					text: '⚙️自定义格式',
					act: 'formatx',
					cls: 't-zhux'
				}
			]
		},

		{
			name: 'footer-btn',
			text: 'footer note',
			icon: 'note',
			act: 'toggleFooter',
			children: [
				{
					text: 'footnotes to articles', // 条文脚注
					act: 'footer'
				},
				{
					text: 'table footnotes', // 表脚注
					act: 'tfooter'
				},
				{
					text: 'footnotes to the first table', // 首表脚注
					act: 'tfooter-x'
				},
				{
					text: 'footnotes to the image', // 图脚注
					act: 'imgfooter'
				},
				/*{
					text: '首图脚注',
					act: 'imgfooter-x'
				}*/
			]
		},
		{
			name: 'copyPage',
			icon: 'copy-page',
			text: 'copy page',
			cmd: 'copyPage'
		},
		{
			name: 'importSettings',
			icon: 'preferences',
			text: 'import settings',
			cmd: 'importSettings'
		},
        {
            name: 'language',
            text: 'Language',
            act: 'setLanguage',
            children: [
                {
                    text: 'Simplified Chinese',
                    act: 'zh_CN'
                },
                {
                    text: 'English',
                    act: 'en_US'
                }
            ]
        },
    ];

    // 贯标移到当前node的最后位置
    const moveSelectionToElement = (editor, element, extraBr) => {
        editor.selection.select(element, true);
        editor.selection.collapse(false);
    };
	
	const getConfig = (key) => {
		let myConfig = sessionStorage.getItem('pageConfig');
		if (myConfig) {
			myConfig = JSON.parse(myConfig)?.[key];
		}
		return myConfig || {}
	}

    // 切换按钮状态
    const toggleButtonState = (editor, item) => {
        return (api) => {
            const nodeChangeHandler = (e) => {
                let disabled = getState(editor, item) && item.name !== 'close-btn';
                api.setDisabled(disabled);
            };
            editor.on('NodeChange', nodeChangeHandler);
            return () => {
                return editor.off('NodeChange', nodeChangeHandler);
            };
        }
    }
	
	const fromDomData = (editor, currNode) => {
		const textBox = editor.dom.getParent(currNode, '.text-box');
		if (textBox) {
			currNode = textBox;
		}
		// debugger
		const paragraphNode = editor.dom.getParent(currNode, 'p');
		const styles = window.getComputedStyle(currNode);
		const fontSize = styles.fontSize.includes('px') ? (parseInt(styles.fontSize)*3/4) + 'pt' : styles.fontSize;
		
		let marginTop = currNode.style.marginTop || '';
		let marginBottom = currNode.style.marginBottom || '';
		if (['inline','inline-block'].includes(styles.display) && paragraphNode) {
			marginTop = paragraphNode.style.marginTop;
			marginBottom = paragraphNode.style.marginBottom;
		}
		
		const obj = {
			marginTop,
			marginBottom,
			fontFamily: styles.fontFamily || '',
			fontSize: currNode.style.fontSize || '',
			align: currNode.style.textAlign || '',
			bold: currNode.style.fontWeight ? true : false,
			color: currNode.style.color || '',//styles.color,
			backgroundColor: currNode.style.backgroundColor || '',//styles.backgroundColor,
			left: currNode.style.left,
			top: currNode.style.top,
			right: currNode.style.right,
			bottom: currNode.style.bottom,
			width: currNode.style.width,
			fitWidth: currNode.style.width === 'fit-content' || currNode.style.width === 'auto' ? true : false,
			height: currNode.style.height,
			fitHeight: currNode.style.height === 'fit-content' || currNode.style.height === 'auto' ? true : false,
			borderStyle: currNode.style.borderStyle || (styles.borderStyle && styles.borderStyle.split(/\s/)[0]) || 'none',
			borderColor: currNode.style.borderColor || '',
			borderWidth: currNode.style.borderWidth ? String(parseInt(currNode.style.borderWidth)) : (styles.borderWidth ? String(parseInt(styles.borderWidth.split(/\s/)[0])) : ''),
			lineHeight: currNode.style.lineHeight,
			placeholder: currNode.dataset?.placeholder || '',
		}
		/*
		if (textBox) {
			textBox.left = styles.left;
			textBox.top = styles.top;
			textBox.right = styles.right;
			textBox.bottom = styles.bottom;
		}
		*/
		return obj;
	}
	
	const getFormats = (editor, currNode) => {
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
			fontFamily.unshift({text:'Default', value:'' });
		
		const fontSize = editor.settings.fontSize;
		const emptyFontSize = fontSize.find(item => item.value==='');
		if (!emptyFontSize)
			fontSize.unshift({text:'Default', value:'' });

		if (editor.dom.hasClass(currNode.parentNode, 'text-box')) {
			currNode = currNode.parentNode;
		}
		
		return {
			fontSize: editor.settings.fontSize,
			fontFamily,
			margins: editor.settings.margins,
		}
	}
	
	const getBorderStyle = () => {
		const list = [
		  'None',
		  'Solid',
		  'Dotted',
		  'Dashed',
		  'Double',
		  /*
		  'Groove',
		  'Ridge',
		  'Inset',
		  'Outset',
		  */
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
	
	const normalItems = (editor, currNode) => {
		const { fontSize, fontFamily, margins } = getFormats(editor, currNode);
		return [
			{
				type: "grid",
				columns: 4,
				items: [
					{
						name: 'marginTop',
						type: 'input',
						label: '段前（em,mm,px,pt）',
					},
					{
						name: 'marginBottom',
						type: 'input',
						label: '段后（em,mm,px,pt）',
					},
					{
						name: 'fontFamily',
						type: 'listbox',
						label: '字体',
						items: fontFamily
					},
					{
						name: 'fontSize',
						type: 'listbox',
						label: '字号',
						items: fontSize
					},
				]
			},
			{
				type: "grid",
				columns: 4,
				items: [
					{
						type: 'label',
						label: '是否粗体',
						items: [{
							name: 'bold',
							type: 'checkbox',
							label: 'Yes',
						}]
					},
					{
						name: 'color',
						type: 'colorinput',
						label: 'Text color'
					},
					{
						name: 'backgroundColor',
						type: 'colorinput',
						label: 'Background color'
					},
					{
						name: 'lineHeight',
						type: 'input',
						label: '行距(em,px)',
					}
				]
			},

			{
				type: "grid",
				columns: 4,
				items: [
					{
						name: 'borderStyle',
						type: 'listbox',
						label: 'Border style',
						items: getBorderStyle(),
					},
					{
						name: 'borderWidth',
						type: 'listbox',
						label: 'Border width',
						items: getBorderWidth(),
					},
					{
						name: 'borderColor',
						type: 'colorinput',
						label: 'Border color'
					},
					{
						name: 'placeholder',
						type: 'input',
						label: 'placeholder text',
					}
				]
			},
			
		]
	};
	
	const boxItems = (editor, currNode) => {
		const { fontSize, fontFamily } = getFormats(editor, currNode);
		return [{
			type: "grid",
			columns: 3,
			items: [{
				name: 'fontFamily',
				type: 'listbox',
				label: '字体',
				items: fontFamily
			},{
				name: 'fontSize',
				type: 'listbox',
				label: '字号',
				items: fontSize
			},{
				type: 'label',
				label: '是否粗体',
				items: [{
					name: 'bold',
					type: 'checkbox',
					label: 'Yes',
				}]
			}]
		},{
			type: "grid",
			columns: 3,
			items: [{
				name: 'align',
				label: 'H Align',
				type: 'listbox',
				items: [{
					text: 'Left',
					value: ''
				},{
					text: 'Center',
					value: 'center'
				},{
					text: 'Right',
					value: 'right'
				}]
			},
			{
				name: 'color',
				type: 'colorinput',
				label: 'Text color'
			},
			{
				name: 'backgroundColor',
				type: 'colorinput',
				label: 'Background color'
			}]
		},{
			type: "grid",
			columns: 4,
			items: [{
				name: 'width',
				type: 'input',
				label: '宽度（em,mm,px,pt）',
			},{
				type: 'label',
				label: '自适应宽度',
				items: [{
					name: 'fitWidth',
					type: 'checkbox',
					label: 'Yes',
				}]
			},{
				name: 'height',
				type: 'input',
				label: '高度（em,mm,px,pt）',
			},{
				type: 'label',
				label: '自适应高度',
				items: [{
					name: 'fitHeight',
					type: 'checkbox',
					label: 'Yes',
				}]
			},]
		},{
			type: "grid",
			columns: 4,
			items: [
				{
					name: 'left',
					type: 'input',
					label: '左侧',
				},
				{
					name: 'top',
					type: 'input',
					label: '顶部',
				},
				{
					name: 'right',
					type: 'input',
					label: '右侧',
				},
				{
					name: 'bottom',
					type: 'input',
					label: '底部',
				},
				
			]
		},{
			type: "grid",
			columns: 3,
			items: [{
                name: 'borderStyle',
                type: 'listbox',
                label: 'Border style',
                items: [{
                        text: 'Select...',
                        value: ''
                    },
                    {
                        text: 'Solid',
                        value: 'solid'
                    },
                    {
                        text: 'Dotted',
                        value: 'dotted'
                    },
                    {
                        text: 'Dashed',
                        value: 'dashed'
                    },
					{
                        text: 'Double',
                        value: 'double'
                    },
                    {
                        text: 'None',
                        value: 'none'
                    }
                ]
            },{
				name: 'borderColor',
				type: 'colorinput',
				label: 'Border color',
			},{
				name: 'borderWidth',
				type: 'listBox',
				label: 'Border width',
				items: getBorderWidth(),
				placeholder: 'Enter px util'
			}]
		},{
			name: 'placeholder',
			type: 'input',
			label: 'placeholder text',
		}]
	};
	
	const HrItem = (editor, currNode) => {
		// const { fontSize, fontFamily, margins } = getFormats(editor, currNode);
		return [
			{
				type: "grid",
				columns: 3,
				items: [
					{
						name: 'borderStyle',
						type: 'listbox',
						label: 'Border style',
						items: getBorderStyle(),
					},
					{
						name: 'borderWidth',
						type: 'listbox',
						label: 'Border width',
						items: getBorderWidth(),
					},
					{
						name: 'borderColor',
						type: 'colorinput',
						label: 'Border color'
					},
				]
			},
			
		]
	};
	
	const tagData = (editor, currNode) => {
		let obj = {}
		if (currNode && currNode.dataset.tag) {
			obj = {
				tagName: currNode.dataset?.tag || '',
				tagValue: currNode.dataset?.value || '',
			}
		}
		return obj;
	}
	
	// 添加标签
	const addTag = (editor, currNode) => {
		editor.windowManager.open({
            title: '元素格式样式设置',
			size: 'small',
            body: {
                type: 'panel',
				items: [
					{
						type: "grid",
						columns: 2,
						items: [
							{
								type: 'input',
								name: 'tagName',
								label: '标签名'
							},
							{
								type: 'listbox',
								name: 'tagValue',
								label: '动态绑定值',
								items: [{
									text: '否',
									value: '0'
								},{
									text: '是',
									value: '1'
								}]
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
            initialData: tagData(editor, currNode),

            onSubmit: function (api, details) {
				const data = api.getData();
				console.log('data--->', data)
				editor.formatter.apply('tagFormat', { name: data.tagName, value: data.tagValue });
                api.close();
            },
        })
	}
	
	const setDomForamt = (editor, currNode) => {
		let panelItem = normalItems(editor, currNode);
		const textBox = editor.dom.getParent(currNode, '.text-box');
		if (textBox) {
			panelItem = boxItems(editor, currNode);
		} else if (currNode.nodeName === "HR") {
			panelItem = HrItem(editor, currNode);
		}
		
		editor.windowManager.open({
            title: '元素格式样式设置',
			size: 'medium',
            body: {
                type: 'panel',
				items: panelItem
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
            initialData: fromDomData(editor, currNode),
			/*
			onChange: function(api, details) {
                const data = api.getData();
				console.log('onChange===>', data, details)
                if (details.name === 'fitWidth' && data.fitWidth) {
                    data.width = 'fit-content';
                }
				if (details.name === 'fitHeight' && data.fitHeight) {
                    data.height = 'fit-content';
                }
                api.setData(data);
            },
			*/

            onSubmit: function (api, details) {
				const data = api.getData();
				editor.execCommand('setDomForamt', data, currNode);
                api.close();
            },
        })
	}

    const doAction = (editor, item) => {
        editor = window.tinyMCE.activeEditor;
        let currNode = editor.selection.getNode();
        if (currNode.nodeName === 'BODY' && item.cmd !== 'close') {
            return;
        }

		if (item.act === 'paragraph') {
			return insertParagraph(editor, currNode);
		} else if (item.act === 'newLine') {
			return insertNewLine(editor, currNode);
		} else if (item.act === 'untitled') {
			return untitledList(editor, currNode);
		} else if (item.act === 'customRemoveFormat') {
			// debugger
			const styles = window.getComputedStyle(currNode);
			const isInline = styles.display === 'inline' || styles.display === 'inline-block';
			if (isInline) {
				editor.formatter.remove('custom_remove_format', {}, currNode);
			} else {
				editor.execCommand('removeDomForamt', currNode);
			}
		}

        // var parentNode = currNode.parentNode;
        //var newEle;

        if (item.cmd) {
            return editor.execCommand('bztonCmd', false, item.cmd);
        }
    }

    // 一般按钮
    const addButton = (editor, item) => {
        const data = {
            tooltip: item.tooltip,
            text: item.text,
            onAction: () => {
                doAction(editor, item);
            }
        }
        if(item.icon) {
            data.icon = item.icon;
        }
		if (item.onSetup) {
			data.onSetup = toggleButtonState(editor, item);
		}
		
        editor.ui.registry.addButton(item.name, {
            ...data,
            // onSetup: toggleButtonState(editor, item)
        });
        editor.ui.registry.addMenuItem(item.name, {
            ...data,
            // onSetup: toggleState(editor, item)
        });
    }

	
    const getState = (editor, item) => {
        const currNode = editor.selection.getNode();
        if (currNode) {
            if (currNode.nodeName === 'BODY' || currNode.parentNode.nodeName === 'BODY') {
                return true;
            } /*else if (item.name === 'newLine') {
				const paragraphNode = editor.dom.getParent(currNode, 'p');
				if (paragraphNode) {
					if (paragraphNode.contenteditable && paragraphNode.contenteditable === 'true'){
						return true;
					} else if (paragraphNode.dataset.outlineid && !editor.dom.hasClass('header-title')) {
						return true;
					}
				}
			}
            return false;
			*/
        }
        return false;
    };

    const toggleState = (editor, item) => {
        return (api) => {
            const flag = getState(editor, item) && item.name !== 'close-btn';
            return api.setDisabled(flag);
        }
    };
	
	const fromPageData = (editor, currNode, isUpdate) => {
		const data = {
			pageType: '',
			pageName: '',
		}
		if (isUpdate) {
			
		}
	}
	
	const fromTocData = (editor, currNode, isUpdate) => {
		
	}
	
	const insertPage = (editor, currNode, isUpdate=false) => {
		editor.windowManager.open({
			title: 'custom page',
			body: {
				type: 'panel',
				items: [{
					type: "grid",
					columns: 2,
					items: [{
						type: "listbox",
						name: 'pageType',
						label: '页面类型',
						items: [
							{ text: '一般页面', value: '' },
							{ text: '前言页', value: 'preface' },
							{ text: '引言页', value: 'introduction' },
							{ text: '章节内容页', value: 'chapter' },
							{ text: '附录章节页', value: 'appendix' },
							{ text: '参考文献页', value: 'references' },
							{ text: '索引页', value: 'indexes' }
						]
					},{
						type: "input",
						name: 'pageName',
						label: '页面标签',
						placeholder: '请输入页面标签名',
					}]
				}]
			},
			initialData: fromPageData(editor, currNode),
			onChange: function(api, details) {
                const data = api.getData();
                if (details.name === 'pageType') {
                    data.pageName = data.pageType;
                }
                api.setData(data);
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
			onSubmit: function (api, details) {
                const data = api.getData();
				data.isUpdate = isUpdate;
				data.act = "custom";
                editor.execCommand('insertPage', data);
                api.close();
            },
		})
	}
	
	const insertToc = (editor, currNode, isUpdate=false) => {
		editor.windowManager.open({
			title: 'toc page',
			body: {
				type: 'panel',
				items: [{
					type: "grid",
					columns: 2,
					items: [{
						type: "input",
						name: 'tocTitle',
						label: '目录标题',
						placeholder: '请输入目录标题名称',
					},{
						type: "listbox",
						name: 'tocType',
						label: '目录域列表表现方式',
						items: [
							{ text: '系统默认层级列表', value: 'list' },
							{ text: '自定义表格列表', value: 'table' },
						]
					}]
				}]
			},
			initialData: fromTocData(editor, currNode),
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
			onSubmit: function (api, details) {
                const data = api.getData();
				data.isUpdate = isUpdate;
				data.act = "insertToc";
                editor.execCommand('insertPage', data);
                api.close();
            },
		})
	}
	
	// 插入段落
	const insertParagraph = (editor, currNode) => {
		editor.execCommand('insertParagraph');
	}
	
	const insertNewLine = (editor, currNode) => {
		editor.execCommand('InsertLineBreak');
	}
	
	// 条题切换
	const untitledList = (editor, currNode) => {
		if (!currNode) {
			currNode = editor.selection.getNode();
		}
		currNode = editor.dom.getParent(currNode,'.ol-list') || editor.dom.getParent(currNode,'.appendix-list');
		let config = getConfig('number');
		if (editor.dom.hasClass(currNode, 'appendix-list')) {
			config = getConfig('appendix');
		}
		if (currNode) {
			editor.dom.toggleClass(currNode, 'untitled');
			if (config.untitled) {
				editor.execCommand('syncUntitled', currNode);
			}
		}
		//return true;
	}
	
	const resetx = (editor, currNode) => {
		// console.log('resetx==>', currNode)
		currNode = editor.dom.getParent(currNode, 'p');
		if (editor.dom.hasClass(currNode, 'zhux') || editor.dom.hasClass(currNode, 'examplex')) {
			const numItems = () => {
                var arr = [{ text: '请选择...', value: '' }];
                for (let i = 1; i <= 20; i++) {
                    arr.push({
                        text: String(i),
                        value: String(i)
                    })
                }
                return arr;
            }
			const fromItemData = () => {
                return {
                    "num": currNode.dataset.number || ''
                }
            };
			editor.windowManager.open({
                title: '重置编号',
                size: 'small',
                width: 150,
                height: 200,
                body: {
                    type: 'panel',
                    items: [{
                        type: "grid",
                        columns: 2,
                        items: [{
                                type: 'label',
                                label: '清除重置编号',
                                items: [{
                                    name: 'clear',
                                    type: 'checkbox',
                                    label: '清除'
                                }]
                            },
                            {
                                name: 'num',
                                type: 'listbox',
                                label: '定义起始编号',
                                items: numItems()
                            }
                        ]
                    }]
                },
                initialData: fromItemData(),
                buttons: [{
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
                onChange: (api, details) => {
                    const data = api.getData();
                    api.enable('num');
                    if (data.clear) {
                        api.disable('num');
                    }
                },
                onSubmit: (api, details) => {
                    const data = api.getData();
                    if (data.clear) {
						delete currNode.dataset.start;
                    } else {
                        currNode.dataset.number = data.num;
                        currNode.dataset.start = data.num;
                    }
                    api.close();
                    editor.execCommand('resetX', currNode);
                },
            });
		}
		
		return false;
	}
	
	const formatx = (editor, currNode, key) => {
		const { fontSize, fontFamily, margins } = getFormats(editor, currNode);
		const xData = getConfig(key);
		
		let dialogTitle;
		switch (key) {
			case 'zhux':
				dialogTitle = '条纹注格式设置';
				break;
			case 'examplex':
				dialogTitle = '示例格式设置';
				break;
			case 't-zhux':
				dialogTitle = '表注格式设置';
				break;
		}
		
		editor.windowManager.open({
            title: dialogTitle,
			size: 'medium',
            body: {
                type: 'panel',
				items: [{
					type: "grid",
					columns: 3,
					items: [
						{
							name: 'numberSuffixText',
							type: 'listbox',
							label: '编号后缀',
							items: [
								{ text: '无', value: '' },
								{ text: '小数点', value: '.' },
								{ text: '英文冒号', value: ':' },
								{ text: '中文冒号', value: '：' },
							]
						},
						{
							name: 'numberSuffix',
							type: 'input',
							label: '自定义后缀',
							
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
					columns: 3,
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
						/*
						{
							name: 'numberLine',
							type: 'listbox',
							label: '行距',
							items: [
								{text:'系统默认', value:''},
								{text:'1', value:'1'},
								{text:'1.25', value:'1.25'},
								{text:'1.5', value:'1.5'},
								{text:'1.75', value:'1.75'},
								{text:'2', value:'2'},
							]
						}
						*/
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
            initialData: xData,
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
				editor.execCommand('setListRule', data, key);
                api.close();
            },
        })
	}
	
	const checkSetTemp = (editor) => {
		let docConfig = editor.settings?.doc_config || {};
		// debugger
		if (!docConfig && sessionStorage.getItem('tinymceConfig')) {
			docConfig = JSON.parse(sessionStorage.getItem('tinymceConfig'))
		}
		return docConfig?.setTemp;
	}
	
    // 下拉菜单按钮
    const addMenuButton = (editor, item) => {
		const isSetTemp = checkSetTemp(editor);
        let items = [];
        for(let i=0; i<item.children.length; i++) {
            let db = item.children[i];
			if (!isSetTemp && ['formatx'].includes(db.act)) {
				continue;
			}
            items.push({
                type: 'menuitem',
                text: db.text,
                tooltip: db.tooltip,
                onAction: () => {
                    const currNode = editor.selection.getNode();
                    if (currNode.nodeName === 'BODY') {
                        return false;
                    }
					if (db.act === 'customPage') {
						return insertPage(editor, currNode);
					} else if (db.act === 'insertToc') {
						return insertToc(editor, currNode);
					} else if (db.act === 'setStyle') {
						return setDomForamt(editor, currNode);
					} else if (db.act === 'paragraph') {
						return insertParagraph(editor, currNode);
					} else if (db.act === 'newLine') {
						return insertNewLine(editor, currNode);
					} else if (db.act === 'resetx') {
						return resetx(editor, currNode);
					} else if (db.act === 'formatx') {
						return formatx(editor, currNode, db.cls);
					} else if (item.act === 'untitled') {
						return untitledList(editor, currNode);
					} else {
						editor.execCommand(item.act||item.cmd, db, currNode);
					}
                }
            });
        }

        let data = {
			icon: item.icon,
            text: item.text,
            tooltip: item.tooltip,
            fetch: callback => {
                callback(items);
            },
            onSetup: toggleButtonState(editor, item)
        }
        if(item.icon) {
            data.icon = item.icon;
        }

		// 菜单栏主按钮
        editor.ui.registry.addMenuButton(item.name, data);

		// 菜单栏下拉式二级菜单
		editor.ui.registry.addNestedMenuItem(item.name, {
			icon: item.icon,
			text: item.text,
			getSubmenuItems: function () {
				return items;
			}
		});

        const aiMenus = [
            {
                type: 'menuitem',
                text: 'rewrite', // 重写
                onAction: () => {
                    editor.execCommand('aiCmd', 'rewrite');
                }
            },
            {
                type: 'menuitem',
                text: 'expand', // 展开内容
                onAction: () => {
                    editor.execCommand('aiCmd', 'expand');
                },
                /*onSetup: (api) => {
                	api.setDisabled(true);
                }*/
            },
            
        ]

        editor.ui.registry.addNestedMenuItem('quickAi', {
            icon: 'ai',
            text: 'ai Tool',
            getSubmenuItems: function () {
                return aiMenus;
            }
        });

        editor.ui.registry.addMenuButton('aiTool', {
            icon: 'ai',
            text: 'ai Tool',
            fetch: function (callback) {
                callback(aiMenus)
            },
        });

        let aiBt = [
            {
                type: 'menuitem',
                text: 'doc model',
                act: 'docModel',
                onAction: () => {
                    editor.execCommand('aiEditor', 'docModel');
                }
            },
            {
                type: 'menuitem',
                text: 'ai editor',
                act: 'docAi',
                onAction: () => {
                    editor.execCommand('aiEditor', 'docAi');
                }
            },
        ];
        if (tinyMCE.settings.aiAssistant) {
            let ls = [];
            tinyMCE.settings.aiAssistant.forEach(o => {
                let it = aiBt.find(t => t.act === o.act)
                if(it) {
                    it.text = o.text;
                    ls.push(it);
                }
            })
            aiBt = ls;
        }
		
		// 增大减小字号
		editor.addCommand('resetFontSize', (value) => {
			const selectedText = editor.selection.getContent();
			if (selectedText) {
                const currentFormats = editor.queryCommandValue('fontSize');
                let newFontSize;
                if(value === 'increase') {
					switch(currentFormats) {
						case 'small': newFontSize = 'medium'; break;
						case 'medium': newFontSize = 'large'; break;
						case 'large': newFontSize = 'x-large'; break;
						default: newFontSize = 'medium';
					}
				} else {
					switch(currentFormats) {
						case 'x-large': newFontSize = 'large'; break;
						case 'large': newFontSize = 'medium'; break;
						case 'medium': newFontSize = 'small'; break;
						default: newFontSize = 'small';
					}
				}
                editor.formatter.apply('fontsize', { value: newFontSize });
            }
		})
		
		// 设置标签

		setTimeout(() => {
			editor.formatter.register('tagFormat', {
				inline: 'span',
				attributes: {
					'data-tag': '%name',
					'data-value': '%value'
				}
			})
		}, 1000)
		
		
		editor.addCommand('docTag', (value) => {
			const currNode = editor.selection.getNode();
			if (!value) {
				editor.windowManager.confirm('确定要清除标签?', flag => {
					editor.formatter.remove('tagFormat');
				})
			} else {
				addTag(editor, currNode)
			}
		})

        editor.ui.registry.addMenuButton('aiEditor', {
            icon: 'ai-bzton',
            text: 'ai bzton',
            fetch: function (callback) {
                callback(aiBt)
            },
            /*onAction: function () {
                editor.execCommand('aiEditor', false);
            }*/
        });
			
		// 快捷键实现条题切换
		editor.addShortcut('Alt+K', '', function(){
			untitledList(editor);
		});
		
		// 直接退出
		editor.addShortcut('Meta+Q', '', function(){
			editor.execCommand('bztonCmd', false, 'close');
		});
    }

    function Plugin() {
        global.add('bzton', function(editor) {
            for(let i=0; i<collectionPlugins.length; i++) {
                var item = collectionPlugins[i];
                if(item.children) {
                    addMenuButton(editor, item);
                } else {
                    addButton(editor, item);
                }
            }
        });
    }
    Plugin();
}());
