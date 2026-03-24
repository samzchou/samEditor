/**
 * 知识库问答
 */

tinymce.PluginManager.add('aiKnowledge', function(editor, url) {
    var pluginName = 'aiKnowledge';

    var useEditor = function(title, url) {
        editor.windowManager.openUrl({
			title,//: '编辑器使用手册',
			size: 'medium',
			url//: 'http://localhost:3300/apiService/coze_workflow.html?id=7536447364295540736',
        });
    };

    var itemNomal = [
        {
            type: 'menuitem',
            text: '编辑器使用手册',
            onAction: () => {
				const url = `http://${window.location.hostname}:3300/tinymce/editor_template.pdf`;
                useEditor('编辑器使用手册', url);
            }
        },
        {
            type: 'menuitem',
            text: '标准知识问答',
            onAction: () => {
				const url = `http://localhost:3300/apiService/coze_workflow.html?id=7536447364295540736`
                useEditor('标准知识问答', url);
            }
        }
    ];

    
    editor.ui.registry.addMenuButton('knowledge', {
        icon: 'new-document',
        text: '知识库',
		fetch: callback => {
			callback(itemNomal);
		},
    });
	
    editor.ui.registry.addMenuButton('aiKnowledge', {
        icon: 'export',
        text: '知识库',
        tooltip: pluginName,
        fetch: callback => {
            callback(itemNomal);
        }
    });
	
    editor.ui.registry.addNestedMenuItem('aiKnowledge', {
        icon: 'export',
        text: '知识库',
        getSubmenuItems: function() {
			return itemNomal;
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
