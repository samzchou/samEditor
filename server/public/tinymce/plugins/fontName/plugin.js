tinymce.PluginManager.add('fontName', function(editor, url) {
    const pluginName = 'Fonts';
	const global$1 = tinymce.util.Tools.resolve('tinymce.util.Tools');
	const listItems = [];

	editor.on('init', function() {
        editor.formatter.register({
            fontName: {
                selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div',
                styles: { 'font-family': '%value' },
				inherit: true,  // 继承父元素样式
				clear_child_styles: 'font-family'  // 清除子元素字体样式
            }
        });
    });

    const doAct = function(value) {
		editor.undoManager.transact(function(){
			editor.focus();
			if (value) {
				editor.formatter.apply('fontName', { value: value });
			} else {
				var blocks = editor.selection.getSelectedBlocks();
				global$1.each(blocks, (block) => {
					block.style.fontFamily = null;
					block.removeAttribute('data-mce-style');
				})
			}
		})
    };

	const isWithinList = function(value) {
		const blocks = editor.selection.getSelectedBlocks();
		let lhv = 0;
		global$1.each(blocks, (block) => {
			if(lhv === 0){
				lhv = editor.dom.getStyle(block,'font-family') ? editor.dom.getStyle(block,'font-family') : 0;
			}
		});
		return lhv === value ? true : false;
    };

	const toggleFontName = function(api, key) {
		const currNode = editor.selection.getNode();
		if (!currNode || !key) return false;

		const fontFamily = currNode ? window.getComputedStyle(currNode).fontFamily : 'simSun';
		return fontFamily.toLowerCase() === key.toLowerCase();

	};


	const nameItems = function() {
		if (!listItems.length) {
			editor.settings.font_formats.split(";").forEach(str => {
				let splitStr = str.split("=");
				listItems.push({
					type: 'togglemenuitem',
					text: splitStr[0],
					value: splitStr[1],
					active: isWithinList(splitStr[1]),
					onAction: () => {
						doAct(splitStr[1]);
					},
					onSetup: (api) => {
						api.setActive(toggleFontName(api,splitStr[1]));
					}
				});
			});
			listItems.unshift({
				type: 'togglemenuitem',
				text: 'Default',
				value: '',
				active: isWithinList(''),
				onAction: () => {
					doAct('');
				},
				onSetup: (api) => {
					api.setActive(toggleFontName(api,''));
				}
			})
		}
		return listItems;
	}
	const setActiveText = function() {
		console.log('setActiveText===>', 11)
		if (editor && editor.selection) {
			const liEles = Array.from(editor.selection.getSelectedBlocks());
			console.log('liEles===>', liEles)
			for (const node of liEles) {
				const nodeStyle = window.getComputedStyle(node);
				if (nodeStyle.fontFamily) {
					return nodeStyle.fontFamily;
					
				}
			} 

		}
		/*
		if (editor && editor.selection) {
			const liEles = Array.from(editor.selection.getSelectedBlocks());
			if (liEles[0].style.fontFamily) {
				return ""
			}
		}
		*/
		//const items = nameItems();
		//debugger
		//const currItem = items.find(n => n.value === 'simSun');
		//return currItem.text;
		
		return pluginName;
	}

	// 设置按钮状态
    const toggleState = editor => {
        let disabled = false;
        const currNode = editor.selection.getNode();
        const parentBlock = editor.dom.getParent(currNode, 'body');
        disabled = !parentBlock;
        return disabled;
    }
	
	const constant = function(value) {
        return function() {
            return value;
        };
    };
	const getApi = (comp) => {
		return { getComponent: constant(comp) };
	}

    editor.ui.registry.addMenuButton('fontName', {
        text: pluginName,
        tooltip: pluginName,
        fetch: callback => {
            callback(nameItems());
        },
		onSetup: (api) => {

			const nodeChangeHandler = (e) => {
                let disabled = toggleState(editor);
                api.setDisabled(disabled);
            };
            editor.on('NodeChange', nodeChangeHandler);
            return () => {
                return editor.off('NodeChange', nodeChangeHandler);
            };
		},
		getApi: getApi,
    });

    return {
        getMetadata: function() {
            return {
                name: pluginName,
            };
        }
    };
})
