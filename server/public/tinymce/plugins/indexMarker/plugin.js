/**
 * 打开文档
 */
tinymce.PluginManager.add('indexMarker', function(editor, url) {
    

    const doAct = function(isRemove=0) {
        const currNode = editor.selection.getNode();
        if (isRemove) {
            if (currNode.dataset?.marker === 'index') { // editor.dom.hasClass(currNode, 'match-index')
                editor.execCommand('setIndexTag');
            } else {
                editor.windowManager.alert('当前元素未定义索引项！')
            }
            return;
        }
        // 只能在章节进行标记索引项 block && block.dataset && block.dataset.outlinetype &&
        
		const block = editor.dom.getParent(currNode, '.info-block');
        if (!block || !editor.dom.hasClass(block, 'chapter') || ['1','2','11','12'].includes(block.dataset?.outlinetype)) {
            editor.windowManager.alert('只能在章节页中进行标记索引项！');
            return false;
        }

        selectedText = editor.selection.getContent({ format: 'text' });
		editor.execCommand('setIndexTag', { currNode, label:selectedText });
    };

    const itemTypes = [
        {
            type: 'menuitem',
            text: 'set index marker',
			tooltip: 'index marker tooltip',
            onAction: () => {
                doAct(0);
            },
			onSetup: function(api) {
				const selections = editor.selection.getContent({ format: 'text' });
				const bool = selections.replace(/\s/g,'') === '';
				api.setDisabled(bool);
			},
        },
        {
            type: 'menuitem',
            text: 'remove index marker',
            onAction: () => {
                doAct(1);
            },
			onSetup: function(api) {
				const currNode = editor.selection.getNode();
				const bool = currNode.dataset?.marker !== 'index';
				api.setDisabled(bool);
			},
        }
    ];

    editor.ui.registry.addMenuButton('indexMarker', {
		icon: 'indexMarker',
        text: 'index marker',
        tooltip: 'index marker',
        fetch: callback => {
            callback(itemTypes);
        }
    });

    editor.ui.registry.addNestedMenuItem('indexMarker', {
        icon: 'indexMarker',
        text: 'index marker',
        tooltip: 'index marker',
        getSubmenuItems: function () {
            return itemTypes;
        }
    });

    /* editor.addCommand('openWordFile', (type) => {
        doAct(type);
    }) */

    return {
        getMetadata: function() {
            return {
                name: 'indexMarker',
                url: "http://www.bzton.cn",
            };
        }
    };
})
