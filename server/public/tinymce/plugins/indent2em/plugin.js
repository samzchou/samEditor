/**
 * indent2em (Enhancement 1.5v) 2021-01-13
 * The tinymce-plugins is used to set the first line indent (Enhancement)
 * 
 * https://github.com/Five-great/tinymce-plugins
 * 
 * Copyright 2020, Five(Li Hailong) The Chengdu, China https://www.fivecc.cn/
 *
 * Licensed under MIT
 */
tinymce.PluginManager.add('indent2em', function(editor, url) {
    const pluginName='首行缩进';
    const global$1 = tinymce.util.Tools.resolve('tinymce.util.Tools');
    const indent2em_val = editor.getParam('indent2em_val', '2em');
    editor.on('init', function() {
        editor.formatter.register({
            indent2em: {
                selector: 'p,h1,h2,h3,h4,h5,h6,div,ul,ol,li,table',
                styles: { 'text-indent': '%value' },
            }
        });
    });
    function _indent2$getValue( key, str ) { 
        const m = str.match( new RegExp(key + ':?(.+?)"?[;}]') );
        return m ? m[ 1 ] : false;
    }
	
	const getConfig = (key) => {
		let myConfig = sessionStorage.getItem('pageConfig');
		if (myConfig) {
			myConfig = JSON.parse(myConfig)?.[key];
		}
		return myConfig || {}
	}
	
    const doAct = function (act) {
		const config = getConfig('docSetting') || {};
		const indentUnit = Number(config?.indentUnit || 2);
		
        editor.undoManager.transact(function(){
            editor.focus();
            const dom = editor.dom;
            const blocks = editor.selection.getSelectedBlocks();
            //let act = '';
			
            global$1.each(blocks, function (block) {
                let kv = "";
                let kl = "";
				/*
                if(block && block.children['0'] && block.children['0'].attributes&&block.children['0'].attributes.style){
                    kv = _indent2$getValue('font-size',block.children['0'].attributes.style.textContent);
                    kl = _indent2$getValue('letter-spacing',block.children['0'].attributes.style.textContent);
                    if(kv) {
						kv = (parseInt(kv)+parseInt((kl?kl:0)))*2+'px';
					} else {
						kv = (parseInt((kl?kl:0))+16)*2+'px'
					};
                }
				*/
				delete block.dataset.mceStyle;
				let value = dom.getStyle(block,'text-indent') ? parseInt(dom.getStyle(block,'text-indent')) : 0;
				if (act === 'add') {
					value += indentUnit;
				} else {
					value -= indentUnit;
				}
				if (value > 0) {
					block.style.textIndent = `${value}em`;
				} else {
					block.style.textIndent = null;
				}
				/*
                if (act == ''){
                    act = dom.getStyle(block,'text-indent') == (indent2em_val!='2em' ? indent2em_val : kv ? kv : '2em') ? 'remove' : 'add';
                }
                if ( act == 'add'){
                    dom.setStyle(block, 'text-indent', indent2em_val!='2em' ? indent2em_val:kv ? kv : '2em');
                } else {
                    let style = dom.getAttrib(block, 'style');
                    const reg = new RegExp('text-indent?(.+?)"?[;}]', 'ig');
                    style = style.replace(reg, '');
                    dom.setAttrib(block, 'style', style);
                }
				*/
            });
        });
    };
	
	// 设置按钮状态
    const getState = (editor, isOut=false) => {
        let disabled = false;
		for (const node of editor.selection.getSelectedBlocks()) {
			if (editor.dom.hasClass(node, 'ol-list') || editor.dom.hasClass(node, 'chapter-list') || editor.dom.hasClass(node, 'section-list') || editor.dom.hasClass(node, 'bullet') || editor.dom.hasClass(node, 'article-list')) {
				disabled = true;
				break;
			}
		}
        return disabled;
    }
	
    const stateSelectorAdapter = (editor, selector) => {
		return (api) => {
			return editor.selection.selectorChangedWithUnbind(selector.join(','), api.setActive).unbind;
		};
    };
	// 切换按钮状态
    const toggleButtonState = (editor, isOut=false) => {
        return (api) => {
            const nodeChangeHandler = (e) => {
                const disabled = getState(editor, isOut);
                api.setDisabled(disabled);
            };
            editor.on('NodeChange', nodeChangeHandler);
            return () => {
                return editor.off('NodeChange', nodeChangeHandler);
            };
        }
    }
	// 增加缩进
    editor.ui.registry.addToggleButton('indent2em', {
		icon: 'indent',
        tooltip: 'Increase indent',
        onAction: function () {
            doAct('add');
        },
		onSetup: toggleButtonState(editor)
		/*
        onSetup: stateSelectorAdapter(editor, [
          '*[style*="text-indent"]',
          '*[data-mce-style*="text-indent"]',
        ])
		*/
    });
    editor.ui.registry.addMenuItem('indent2em', {
        text: 'Increase indent',
        onAction: function() {
            doAct('add');
        },
		onSetup: toggleButtonState(editor)
    });
    // editor.addCommand('indent2em', doAct);
	
	// 减少缩进
    editor.ui.registry.addToggleButton('outdent2em', {
		icon: 'outdent',
        tooltip: 'Decrease indent',
        onAction: function () {
            doAct();
        },
		/*
        onSetup: stateSelectorAdapter(editor, [
          '*[style*="text-indent"]',
          '*[data-mce-style*="text-indent"]',
        ])
		*/
		onSetup: toggleButtonState(editor, true)
    });
    editor.ui.registry.addMenuItem('outdent2em', {
        text: 'Decrease indent',
        onAction: function() {
            doAct();
        },
		onSetup: toggleButtonState(editor, true)
    });
    // editor.addCommand('outdent2em', doAct);
	
	
	const getPaddingState = (editor, isOut=false) => {
        let disabled = false;
		if (isOut) {
			disabled = true;
			for (const node of editor.selection.getSelectedBlocks()) {
				if (isOut && editor.dom.getStyle(node, 'padding-left') !== '') {
					disabled = false;
					break;
				}
			}
		}
        return disabled;
    }
	
	// 切换按钮状态
    const togglePaddingState = (editor, isOut=false) => {
        return (api) => {
            const nodeChangeHandler = (e) => {
                let disabled = getPaddingState(editor, isOut);
                api.setDisabled(disabled);
            };
            editor.on('NodeChange', nodeChangeHandler);
            return () => {
                return editor.off('NodeChange', nodeChangeHandler);
            };
        }
    }
	
	const doPadding = (act) => {
		editor.undoManager.transact(function(){
            editor.focus();
            const dom = editor.dom;
            const blocks = editor.selection.getSelectedBlocks();
            global$1.each(blocks, function (block) {
				delete block.dataset.mceStyle;
				const blockStyle = window.getComputedStyle(block);
				let value = Math.round(parseFloat(blockStyle.paddingLeft)/parseFloat(blockStyle.fontSize)); // dom.getStyle(block,'padding-left') ? parseInt(dom.getStyle(block,'padding-left')) : 0;
				if (act === 'add') {
					value += 1;
				} else {
					value -= 1;
				}
				if (value > 0) {
					block.style.paddingLeft = `${value}em`;
				} else {
					block.style.paddingLeft = null;
				}
            });
        });
	}
	
	editor.ui.registry.addToggleButton('increasePadding', {
		icon: 'increase-padding',
        tooltip: 'Increase padding',
        onAction: function () {
            doPadding('add');
        },
		// onSetup: togglePaddingState(editor, false)
    });
	editor.ui.registry.addToggleButton('decreasePadding', {
		icon: 'decrease-padding',
        tooltip: 'Decrease padding',
        onAction: function () {
            doPadding();
        },
		// onSetup: togglePaddingState(editor, true)
    });
	
    return {
        getMetadata: function () {
            return  {
                name: pluginName,
                url: "https://www.bzton.com",
            };
        }
    };
});
