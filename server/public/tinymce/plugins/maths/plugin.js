tinymce.PluginManager.add('maths', function(editor, url) {
    const items = {
        0: 'write formula',
        1: 'custom formula',
        2: 'edit formula',
		3: 'image to formula'
    }
    var pluginName = 'math';
    var mathWindow = null;
    var sourceCode = '';

    var doAct = function(type, data) {
        sourceCode = data;
        editor = window.tinyMCE.activeEditor;
        var currNode = editor.selection.getNode();
        const title = items[type];
		
		// 图片转公式
		if (type === 3) {
			editor.execCommand('imgToFormula');
			return;
		}

        if (type === 2) { // 直接输入公式
            editor.windowManager.open({
                title,
                body: {
                    type: 'panel',
                    items: [
                        {
                            type: 'textarea',
                            name: 'latexCode',
                            label: 'Enter Latex code'
                        }
                    ],
                },
                buttons: [
                    {
                        type: 'cancel',
                        text: 'Close',
                        name: 'close'
                    },
                    {
                        type: 'custom',
                        text: 'Save',
                        name: 'submit',
                        primary: true
                    },
                ],
                onAction: function (api, details) {
                    switch (details.name) {
                        case 'submit':
                            var data = api.getData();
                            editor.execCommand('transLatex', data.latexCode);
                            break;
                        default:
                            editor.execCommand('clearMaths');
                            break;
                    };
                    api.close();
                }
            })
            
        } else {
            var docConfig = editor.settings.doc_config;
            var url = docConfig.nodeURL;
            var htmlUrl = type ? url + '/kityformula/' : url + '/scriptMath/';
            mathWindow = editor.windowManager.openUrl({
                title,
                size: 'large',
                width: 850,
                height: 500,
                url: htmlUrl,
                buttons: [
                    {
                        type: 'cancel',
                        text: 'Close',
                        name: 'close'
                    },
                    {
                        type: 'custom',
                        text: 'Save',
                        name: 'submit',
                        primary: true
                    },
                ],
                onAction: function (api, details) {
                    switch (details.name) {
                        case 'submit':
                            editor.execCommand('transLatex', 'loading');
                            api.sendMessage({ getSource:true, id:editor.id });
                            break;
                        default:
                            api.close();
                    };
                    setCode('');
                }
            });
        }
    };

    var setCode = function(code) {
        let currEditor = window.tinyMCE.activeEditor;
        if(mathWindow && code) {
            mathWindow.sendMessage({ setSource:code, id:currEditor.id });
            if (!code) {
                editor.execCommand('clearMaths');
            }
        }
    }

    editor.ui.registry.addIcon(
        'math-btn',
        '<svg viewBox="0 -80 1024 1024" width="30" height="30">\n' +
        '<path d="M420.7408 462.338025L248.134117 252.761572h175.072145s61.620744-4.716854 83.813553 25.901341c22.196458 30.616978 29.587979 77.712537 29.587979 77.712537h22.195242l-9.854551-143.653617H127.334982v21.193001l216.95946 254.3221L127.334982 730.788792v23.551428h431.468054l27.128599-160.140712-22.191593-4.705907s-7.39517 35.324102-36.985582 68.288561c-29.587979 32.972973-145.475651 28.257335-145.475652 28.257335H225.953471l194.787329-223.701472z m0 0M632.119826 645.544857l-17.559881-12.365016 198.733041-308.087907 17.536771 12.352853L632.119826 645.544857m9.464115-185.813386c-6.350359 0-10.581905-4.420074-10.581905-11.059915v-116.096878c0-6.634976 4.231546-11.058699 10.581905-11.058698 6.347927 0 10.581905 4.423723 10.581905 11.058698v117.201288c0 5.535431-5.290952 9.955505-10.581905 9.955505z m0 0" fill="#333" p-id="1415"></path>\n' +
        '<path d="M580.191864 379.017078h121.719882c6.354008 0 10.585554 4.420074 10.585554 11.053834 0 6.63376-4.231546 11.059915-10.585554 11.059915H580.191864m305.886384 173.591894H764.359581c-6.355225 0-10.581905-4.417641-10.581905-11.056266 0-6.639841 4.231546-11.058699 10.581905-11.058699h121.71745c6.354008 0 10.587987 4.426155 10.587987 11.058699-0.004865 6.638625-4.233978 11.056266-10.58677 11.056266z m-1.058191-58.60186H763.301391c-6.355225 0-10.58677-4.423723-10.58677-11.058698 0-6.627678 4.231546-11.053834 10.58677-11.053834h121.71745c6.356441 0 10.584338 4.426155 10.584338 11.053834 0.001216 6.636192-4.227897 11.058699-10.583122 11.058698z m0 0" fill="#666" p-id="1416"></path>\n' +
        '</svg>'
    );
	
	const getConfig = (key) => {
		let myConfig = sessionStorage.getItem('pageConfig');
		if (myConfig) {
			myConfig = JSON.parse(myConfig)?.[key];
		}
		return myConfig || {}
	}

    const itemList = [
        {
            type: 'menuitem',
            text: 'custom formula',
            cata: 'custom',
            onAction: () => {
                doAct(1);
            }
        },
        {
            type: 'menuitem',
            text: 'write formula',
            cata: 'hand',
            onAction: () => {
                doAct(0);
            }
        },
        {
            type: 'menuitem',
            text: 'edit formula',
            cata: 'edit',
            onAction: () => {
                doAct(2);
            }
        },
		{
            type: 'menuitem',
            text: 'image to formula',
            cata: 'image',
			onSetup: (api) => {
				let disabled = true;
                let currNode = editor.selection.getNode();
                if (currNode.nodeName === 'IMG') {
                    disabled = false;
                }
                api.setDisabled(disabled);
			},
            onAction: () => {
                doAct(3);
            }
        },
        {
            type: 'menuitem',
            text: 'formula number',
			tooltip: 'formula number',
            cata: 'number',
            onAction: () => {
                editor.execCommand('insertMathNum', false, editor.selection.getNode());
            },
			onSetup: (api) => {
                let disabled = true;
                let currNode = editor.selection.getNode();
                if (currNode.nodeName === 'IMG' && editor.dom.hasClass(currNode, 'math-img')) {
                    disabled = false;
                }
                api.setDisabled(disabled);
            }
        },
    ];

    const filterItems = function() {
        const config = getConfig('formula');
        if(config) {
            return itemList.filter(item=> {
                return config[item.cata];
            })
        } else {
            return itemList;
        }
    }

    // 设置按钮状态
    var toggleState = editor => {
        let disabled = false;
        let currNode = editor.selection.getNode();
        let parentBlock = editor.dom.getParent(currNode, 'body');
        disabled = !parentBlock;
        
        return disabled;
    }

    // 下拉工具栏菜单
    editor.ui.registry.addMenuButton('maths', {
        icon: `math-btn`,
        text: 'formula',
        tooltip: 'formula',
        fetch: callback => {
            callback(filterItems());
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

    // 菜单栏
    editor.ui.registry.addNestedMenuItem('maths', {
        icon: 'math-btn',
        text: 'math',
        getSubmenuItems: function () {
            let disabled = toggleState(editor);
            if (disabled) {
                return [];
            }
            return filterItems();
        },
        onSetup: (api) => {
            let disabled = toggleState(editor);
            api.setDisabled(disabled);
        }
    });

    editor.addCommand('openMath', data => {
        doAct(1, data);
    });

    editor.addCommand('setMath', data => {
        if (sourceCode) {
            setCode(data);
        }
    })


    return {
        getMetadata: function() {
            return {
                name: pluginName,
                
            };
        }
    };
})
