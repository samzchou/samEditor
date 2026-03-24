tinymce.PluginManager.add('fontName', function(editor, url) {
    var pluginName = 'Fonts';
	var global$1 = tinymce.util.Tools.resolve('tinymce.util.Tools');
	var listItems = [];

	editor.on('init', function() {
        editor.formatter.register({
            fontName: {
                selector: 'span,p,h1,h2,h3,h4,h5,h6,td,th,ul,ol,li,table,div',
                styles: { 'font-family': '%value' }
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
				// editor.formatter.remove('fontName', { value: 'simHei' });
			}
		})
    };

	var isWithinList = function(value) {
		var blocks = editor.selection.getSelectedBlocks();
		var lhv = 0;
		global$1.each(blocks, (block) => {
			if(lhv === 0){
				lhv = editor.dom.getStyle(block,'font-family') ? editor.dom.getStyle(block,'font-family') : 0;
			}
		});
		return lhv === value ? true : false;
    };

	var toggleFontName = function(api, key) {
		var currNode = editor.selection.getNode(); // editor.selection.getSel().anchorNode;//
		var fontFamily = currNode ? window.getComputedStyle(currNode).fontFamily : 'simSun';
		return fontFamily.toLowerCase() === key.toLowerCase();
	};


	var nameItems = function() {
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
	var setActiveText = function() {
		if (editor && editor.selection) {
			var liEles = Array.from(editor.selection.getSelectedBlocks());
			if (liEles[0].style.fontFamily) {
				return "nnn"
			}
		}
		return 'Fonts';
	}

	// 设置按钮状态
    var toggleState = editor => {
        let disabled = false;
        let currNode = editor.selection.getNode();
        let parentBlock = editor.dom.getParent(currNode, 'body');
        disabled = !parentBlock;
        
        return disabled;
    }

    editor.ui.registry.addMenuButton('fontName', {
        text: setActiveText(),
        tooltip: pluginName,
        fetch: callback => {
            callback(nameItems());
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
            };
        }
    };
})
