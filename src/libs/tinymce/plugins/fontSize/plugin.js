tinymce.PluginManager.add('fontSize', function(editor, url) {
    var pluginName = 'Font Sizes';

	const fontSizeMap = {
		"初号":'42pt',
        "小初号":'36pt',
        "一号":'28pt',
		"二号":'21pt',
		"小二号":'18pt',
		"三号":'15.75pt',
		"四号":'14pt',
		"小四号":'12pt',
		"五号":'10.5pt',
		"小五号":'9pt',
		"六号":'7.875pt'
	};

    const doAct = function(value) {
		var currNode = editor.selection.getNode();
        value = fontSizeMap[value];
		editor.formatter.toggle('fontsize', { value });
        editor.undoManager.add();
    };

	var isWithinList = function(e) {
        var currNode = editor.selection.getNode();
		// console.log('isWithinList',e.parents)
    };

	var toggleFontSize = function(api, key='') {
		var currNode = editor.selection.getNode();
		var value = fontSizeMap[key];
		value = Math.floor(parseFloat(value) * 100) / 100;
		var fontSize = currNode ? window.getComputedStyle(currNode).fontSize : '14px';
		fontSize = Math.floor((parseFloat(fontSize)*3/4) * 100) / 100;
		return fontSize === value;
	};

    var itemList = [
        {
            type: 'togglemenuitem',
            text: '42PT',
            onAction: () => {
                doAct('初号');
            },
			onSetup: function (api) {
				api.setActive(toggleFontSize(api,'初号'));
			}
        },
        {
            type: 'togglemenuitem',
            text: '36PT',
            onAction: () => {
                doAct('小初号');
            },
        	onSetup: function (api) {
        		api.setActive(toggleFontSize(api,'小初号'));
        	}
        },
        {
            type: 'togglemenuitem',
            text: '26PT',
            onAction: () => {
                doAct('一号');
            },
        	onSetup: function (api) {
        		api.setActive(toggleFontSize(api,'一号'));
        	}
        },
        {
            type: 'togglemenuitem',
            text: '22PT',
            onAction: () => {
                doAct('二号');
            },
			onSetup: function (api) {
				api.setActive(toggleFontSize(api,'二号'));
			}
        },
        {
            type: 'togglemenuitem',
            text: '18PT',
            onAction: () => {
                doAct('小二号');
            },
			onSetup: function (api) {
				api.setActive(toggleFontSize(api,'小二号'));
			}
        },
		{
            type: 'togglemenuitem',
            text: '16PT',
            onAction: () => {
                doAct('三号');
            },
			onSetup: function (api) {
				api.setActive(toggleFontSize(api,'三号'));
			}
        },
        {
            type: 'togglemenuitem',
            text: '14PT',
            onAction: () => {
                doAct('四号');
            },
			onSetup: function (api) {
				api.setActive(toggleFontSize(api,'四号'));
			}
        },
        {
            type: 'togglemenuitem',
            text: '12PT',
            onAction: () => {
                doAct('小四号');
            },
			onSetup: function (api) {
				api.setActive(toggleFontSize(api,'小四号'));
			}
        },
		{
            type: 'togglemenuitem',
            text: '10.5PT',
            onAction: () => {
                doAct('五号');
            },
			onSetup: function (api) {
				api.setActive(toggleFontSize(api,'五号'));
			}
        },
        {
            type: 'togglemenuitem',
            text: '9PT',
            onAction: () => {
                doAct('小五号');
            },
			onSetup: function (api) {
				api.setActive(toggleFontSize(api,'小五号'));
			}
        },
    ];
    // 设置按钮状态
    var toggleState = editor => {
        let disabled = false;
        let currNode = editor.selection.getNode();
        let parentBlock = editor.dom.getParent(currNode, '.info-block');
        disabled = !parentBlock ? true : (editor.dom.hasClass(parentBlock, 'fixed') || parentBlock.dataset.enlock !== undefined || !parentBlock.isContentEditable);
        if (disabled) {
            // 元素为层级项，且为被锁定正在编辑的
            let olEle = editor.dom.getParent(currNode, '.ol-list') || editor.dom.getParent(currNode, '.appendix-list');
            if (olEle && !editor.dom.hasClass(olEle, 'disabled')) {
                disabled = false;
            }
        }
        return disabled;
    }

    editor.ui.registry.addMenuButton('fontSize', {
        text: 'Font Sizes',
        tooltip: pluginName,
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


    return {
        getMetadata: function() {
            return {
                name: pluginName,
                url: "http://www.bzton.cn",
            };
        }
    };
})
