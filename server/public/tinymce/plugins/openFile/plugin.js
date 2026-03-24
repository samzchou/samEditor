/**
 * 打开文档
 */

const openItems = {
    0:[
        {
            type: 'grid',
            columns: 2,
            items:[
                {
                    name: 'stdKind',
                    type: 'listbox',
                    label: '请选择标准类型',
                    items: [
                        { text: '请选择...', value: "0" },
                        { text: '国家标准', value: "1100" },
                        { text: '行业标准', value: "1200" },
                        { text: '地方标准', value: "6" },
                        { text: '团体标准', value: "1500" },
                        { text: '企业标准', value: "1400" }
                    ]
                },
                {
                    type: 'urlinput',
                    filetype: 'file',
                    name: 'wordUrl',
                    label: '请选择文件(docx文件)',
                    value: '',
                    accept: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' //application/vnd.openxmlformats-officedocument.wordprocessingml.document
                }
            ]
        }
    ],
    2: [
        {
            type: 'panel',
            items:[
                {
                    type: 'urlinput',
                    filetype: 'file',
                    name: 'wordUrl',
                    label: '请选择文件(md文件)',
                    value: '',
                    accept: '.md' //application/vnd.openxmlformats-officedocument.wordprocessingml.document
                }
            ]
        }
    ]
}

tinymce.PluginManager.add('openFile', function(editor, url) {
    var pluginName = '打开文档';
	var docWindow = null;
    var cloudDoc = null;
    var doAct = function(type=0) {
        editor =  window.tinyMCE.activeEditor;
        if (type === 0 || type === 2) {
            const typeItem = openItems[type];
            editor.windowManager.open({
                title: 'open local file',
                width: 300,
                height:200,
                body: {
                    type: 'panel',
                    items: typeItem
                },
                buttons: [
                    {
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

                onSubmit: function (api, details) {
                    var data = api.getData();
                    data.type = type;
                    if(!data.wordUrl) {
                        editor.windowManager.alert('请选择文档！');
                    } else {
                        var extName = getExt(data.wordUrl.value);
                        if (!['docx'].includes(extName.toLowerCase()) && type === 0) {
                            editor.windowManager.alert("请选择word文件！");
                            return false;
                        } else if (!['md'].includes(extName.toLowerCase()) && type === 2) {
                            editor.windowManager.alert("请选择md文件！");
                            return false;
                        } else {
                            editor.execCommand('openHtml', data);
                            api.close();
                        } 
                    }
                },
            })
        } else if (type === 1) {
            cloudDoc = null;
			var docConfig = editor.settings.doc_config;
			var url = docConfig.pluginURL;
			var htmlUrl = url + '/cloudDoc?tmp=' + new Date().getTime();
            if (docConfig.author && docConfig.author.userName) {
                htmlUrl += '&userName=' + docConfig.author.userName;
            };
			docWindow = editor.windowManager.openUrl({
				title: '打开云文档',
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
						text: '导入到编辑器',
						name: 'submit',
						primary: true
					},
				],
				onAction: function (api, details) {
					switch (details.name) {
						case 'submit':
							loadCloudFile(editor, api);
							break;
						default:
							api.close();
					};
				}
			});

        } else {
            editor.execCommand('testDoc');
        }
    };
    var getExt = function(filename="") {
        if (filename) {
            let index = filename.lastIndexOf(".");
            return filename.substr(index + 1);
        }
        return "";
    };

    var loadCloudFile = function(currEditor, api) {
        if (!cloudDoc) {
            currEditor.windowManager.alert("请选中需要加载到编辑器的文档！");
            return false;
        } else {
            currEditor.windowManager.confirm('将覆盖掉当前编辑器中的文档，确定继续？', flag => {
                if (flag) {
                    editor.execCommand('getCloudDoc', cloudDoc);
                    setTimeout(() => {
                        api.close();
                    }, 500)
                }
            });
        }
    };

    var itemTypes = [
        {
            type: 'menuitem',
            text: '导入OFFICE文档',
            onAction: () => {
                doAct(0);
            }
        },
        {
            type: 'menuitem',
            text: '导入Markdown文档',
            onAction: () => {
                doAct(2);
            },
        },
        {
            type: 'menuitem',
            text: '导入云文档',
            onAction: () => {
                doAct(1);
            },
        },
        /*{
            type: 'menuitem',
            text: '测试本地文档',
            onAction: () => {
                doAct(2);
            },
        }*/
    ];

    editor.ui.registry.addNestedMenuItem('openFile', {
        icon: 'browse',
        text: 'open file',
        getSubmenuItems: function () {
            return itemTypes;
        }
    });

    editor.addCommand('openWordFile', (type) => {
        doAct(type);
    });

    editor.ui.registry.addMenuItem('importWord', {
        text: 'import office word',
        onAction: function () {
            doAct(0);
        }
    });
    editor.ui.registry.addMenuItem('importMarkdown', {
        text: '导入Markdown文档',
        onAction: function () {
            doAct(2);
        }
    });
    editor.ui.registry.addMenuItem('importCloud', {
        text: '导入云文档',
        onAction: function () {
            doAct(1);
        }
    });

    editor.addCommand('selectedFile', data => {
        cloudDoc = data;
    })

    return {
        getMetadata: function() {
            return {
                name: pluginName,
                url: "https://www.bzton.com",
            };
        }
    };
})
