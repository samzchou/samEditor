tinymce.PluginManager.add('fontSize', function(editor, url) {
    const pluginName = 'Font Sizes';

		
    const doAct = function(value) {
		const currNode = editor.selection.getNode();
		const selections = editor.selection.getContent({ format: 'text' })
		if (selections.replace(/\s/g,'') === '') {
			currNode.style.fontSize = value;
		} else {
			editor.formatter.toggle('fontsize', { value });
		}
        editor.undoManager.add();
		editor.execCommand('fontSize');
    };

	const isWithinList = function(e) {
        const currNode = editor.selection.getNode();
    };
	
	const toggleFontSize = function(api, value='') {
		const currNode = editor.selection.getNode();
		value = parseFloat(value);//Math.floor(parseFloat(value) * 100) / 100;
		let fontSize = currNode ? window.getComputedStyle(currNode).fontSize : '14px';
		fontSize = Math.floor((parseFloat(fontSize)*3/4) * 100) / 100;
		return fontSize === value;
	};

    
    // 设置按钮状态
    const toggleState = editor => {
        let disabled = false;
        let currNode = editor.selection.getNode();
        let parentBlock = editor.dom.getParent(currNode, 'body');
        disabled = !parentBlock;
        
        return disabled;
    }
	
	const getItemList = () => {
		const fontSize = editor.settings.fontSize; 
		return fontSize.map(item => {
			return {
				type: 'togglemenuitem',
				text: item.text,
				onAction: () => {
					doAct(item.value);
				},
				onSetup: function (api) {
					api.setActive(toggleFontSize(api, item.value));
				}
			}
		})
	}

    editor.ui.registry.addMenuButton('fontSize', {
        text: 'Font Sizes',
        tooltip: pluginName,
        fetch: callback => {
            callback(getItemList());
        },
		onSetup: (api) => {
			const nodeChangeHandler = (e) => {
                const disabled = toggleState(editor);
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
