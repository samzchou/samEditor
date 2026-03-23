tinymce.PluginManager.add('exportFile', function(editor, url) {
    var pluginName = 'export';
    var mapItem = {
        'docx': 'export office word',
        'wps': 'export wps word',
        'pdf': 'export pdf',
        'xml': 'export xml',
        'md': 'export markdown',
        'table': 'export table'
    }

    var fromPageData = function() {
        var pageContainer = editor.getBody().querySelector('.page-container');
		var docName = pageContainer.dataset.title||'';
		docName = docName.replace(/\s/g,'').replace(/<br>/g,'');
        // debugger
        return {
            docName
        }
    };

    const toggleCommentState = function (flag) {
        return function (api) {
            var editorCfg = editor.settings.doc_config || {};
            return api.setDisabled(editorCfg.stdKind && editorCfg.stdKind===8);
        }
    }
    // 表单
    const toggleTableState = function (flag) {
        return function (api) {
            var flag = true;
            var currNode = editor.selection.getNode();
            var parentNode = editor.dom.getParent(currNode, 'table');
            if (parentNode) {
                flag = false;
            }
            return api.setDisabled(flag)
        }
    }


    var doAct = function(type) {
        var title = "请输入文档名称"
        if (type === 'table') {
            title = "请输入表单名称！";
        }
        editor.windowManager.open({
            title: '导出' + mapItem[type],
            body: {
                type: 'panel',
                items: [{
                        type: 'input',
                        name: 'docName',
                        label: title
                    }
                ]
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
            initialData: fromPageData(),
            onSubmit: function (api, details) {
                var data = api.getData();
                if(!data.docName) {
                    editor.windowManager.alert(title);
                    return;
                }
                api.close();
                data.type = type;
                data.outData = true;
                editor.execCommand('exportFile', data);
            },
        })
    };


    var itemTypes = [
        {
            type: 'menuitem',
            name: 'docx',
            text: 'export office word',
            onAction: () => {
                doAct('docx');
            }
        },
        {
            type: 'menuitem',
            name: 'wps',
            text: 'export wps word',
            onAction: () => {
                doAct('wps');
            }
        },
        {
            type: 'menuitem',
            name: 'pdf',
            text: 'export pdf',
            onAction: () => {
                doAct('pdf');
            }
        },
        /*{
            type: 'menuitem',
            name: 'json',
            text: '导出JSON文档结构',
            onAction: () => {
                doAct('json');
            }
        },*/
        {
            type: 'menuitem',
            name: 'xml',
            text: 'export xml',
            onAction: () => {
                doAct('xml');
            },
            onSetup: toggleCommentState(true)
        },
        {
            type: 'menuitem',
            name: 'md',
            text: 'export markdown',
            onAction: () => {
                doAct('md');
            },
            onSetup: toggleCommentState(true)
        },
        {
            type: 'menuitem',
            name: 'table',
            text: 'export table',
            onAction: () => {
                doAct('table');
            },
            onSetup: toggleTableState(true)
        }
    ];

    var filterItems = function() {
        var docConfig = editor.settings.doc_config;
        if(docConfig.exportType && Array.isArray(docConfig.exportType)) {
            return itemTypes.filter(item=> {
                return docConfig.exportType.includes(item.name);
            })
        } else {
            return itemTypes;
        }
    }


    editor.ui.registry.addMenuButton('exportFile', {
        icon: 'export',
        text: 'export',
        tooltip: pluginName,
        fetch: callback => {
            callback(filterItems());
        }
    });

    editor.ui.registry.addNestedMenuItem('exportFile', {
        icon: 'export',
        text: 'export',
        getSubmenuItems: function () {
            return filterItems();
        }
    });

    // editor.shortcuts.add('Meta+E', '', doAct('docx'));
    editor.addCommand('outDox', function () {
        doAct('docx')
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
