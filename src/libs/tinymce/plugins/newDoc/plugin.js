/**
 * 新建文档
 */

tinymce.PluginManager.add('newDoc', function(editor, url) {
    var pluginName = '新建文档';
	
    var setStandard = function(value) {
		editor.windowManager.confirm('新建文档后将清空当前正文内容及相关数据，确定新建？', function(flag) {
			if (flag) {
				editor.execCommand('newStandard', value);
			}
		})
    };


    var itemStandard = [
        {
            type: 'menuitem',
            text: '国家标准',
			onAction: () => {
                setStandard(1100);
            }
        },
        {
            type: 'menuitem',
            text: '行业标准',
			onAction: () => {
                setStandard(1200);
            }
            
        },
        {
            type: 'menuitem',
            text: '地方标准',
            onAction: () => {
                setStandard(6);
            }
        },
		{
            type: 'menuitem',
            text: '团体标准',
            onAction: () => {
                setStandard(1500);
            }
        },
		{
            type: 'menuitem',
            text: '企业标准',
            onAction: () => {
                setStandard(1400);
            }
        },
        {
            type: 'menuitem',
            text: '国家标准化指导性文件',
            onAction: () => {
                setStandard(7);
            }
        },
        /*{
            type: 'menuitem',
            text: '空白文档',
            onAction: () => {
                setStandard(0);
            }
        }*/
    ];

    var itemNomal = [
        {
            type: 'menuitem',
            text: '空白文档',
            onAction: () => {
                setNomal(0);
            }
        },
        {
            type: 'menuitem',
            text: '使用模板',
            onAction: () => {
                setNomal(1);
            }
        }
    ];

    var setNomal = function(value) {
        editor.windowManager.confirm('新建文档后将清空当前正文内容及相关数据，确定新建？', function(flag) {
            if (flag) {
                if (value === 0) {
                    var htmlContent = `<div class="page-container"><div class="info-block"><p>请输入内容...</p></div></div>`;
                    editor.resetContent(htmlContent);
                } else {
                    alert('抱歉，暂无可选模板！');
                }
            }
        })
    };

    editor.ui.registry.addNestedMenuItem('newStandard', {
        icon: 'new-document',
        text: '新建标准',
        getSubmenuItems: function () {
            return itemStandard;
        }
    });

    editor.ui.registry.addNestedMenuItem('newFile', {
        icon: 'new-document',
        text: '新建文档',
        getSubmenuItems: function () {
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
