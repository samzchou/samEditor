tinymce.PluginManager.add('pageLayout', function(editor, url) {
    var pluginName = '页面';

    var setLayout = function(type=0) {
        let title = type === 0 ? '纵向布局' : '横向布局';
        editor.windowManager.open({
            title: '页面设置：' + title,
            size: 'normal',
            width: 200,
            height:150,
            body: {
                type: 'panel',
                items: [
                    {
                        type: 'checkbox',
                        name: 'all',
                        label: '应用全部页面'
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
                    text: 'ok',
                    name: 'submitButton',
                    primary: true
                },
            ],
            initialData: {
                all: false,
            },
            onSubmit: (api, details) => {
                var apiData = api.getData();
                apiData.type = type;
                editor.execCommand('pageLayout', apiData);
                api.close();
            }
        })
    };
    var errorCode = {
        'width': '页面宽度数值不能为空，必须为整数！',
        'height': '页面高度数值不能为空，必须为整数！',
        'top': '页边距上方数值不能为空，必须为整数！' ,
        'bottom': '页边距下方数值不能为空，必须为整数！',
        'left': '页边距左侧数值不能为空，必须为整数！',
        'right': '页边距右侧数值不能为空，必须为整数！'
    };

    var fromImageData = function() {
        var node = editor.selection.getNode();
        var block = editor.dom.getParent(node, '.info-block');
        return {
            width: block.style.width.replace(/mm/g, ''),
            height: block.style.height.replace(/mm/g, ''),
            top: block.style.paddingTop.replace(/mm/g, ''),
            right: block.style.paddingRight.replace(/mm/g, ''),
            bottom: block.style.paddingBottom.replace(/mm/g, ''),
            left: block.style.paddingLeft.replace(/mm/g, ''),
        }
    };

    var setSize = function() {
        editor.windowManager.open({
            title: '页面尺寸设置',
            body: {
                type: 'tabpanel',
                tabs: [
                    {
                        name: 'size',
                        title: '页面大小',
                        items: [
                            {
                                type: "grid",
                                columns: 2,
                                items: [
                                    { name: 'width', type: 'input', label: '页面宽度(mm)' },
                                    { name: 'height', type: 'input', label: '页面高度(mm)' }
                                ]
                            },
                            {
                                name: 'isAll',
                                type: 'checkbox',
                                label: '应用于全部页面'
                            }
                        ]
                    },
                    {
                        name: 'padding',
                        title: '页面边距',
                        items: [
                            {
                                type: 'grid',
                                columns: 2,
                                items: [
                                    {
                                        name: 'top', type: 'input', label: '上方(mm)'
                                    },
                                    {
                                        name: 'bottom', type: 'input', label: '下方(mm)'
                                    }
                                ]
                            },
                            {
                                type: 'grid',
                                columns: 2,
                                items: [
                                    {
                                        name: 'left', type: 'input', label: '左侧(mm)'
                                    },
                                    {
                                        name: 'right', type: 'input', label: '右侧(mm)'
                                    }
                                ]
                            },
                            {
                                name: 'isAll',
                                type: 'checkbox',
                                label: '应用于全部页面'
                            }
                        ]
                    }
                ],
            },
            buttons: [
                {
                    type: 'cancel',
                    name: 'cancel',
                    text: 'Cancel'
                },
                {
                    type: 'submit',
                    name: 'save',
                    text: 'Save',
                    primary: true
                }
            ],
            initialData: fromImageData(),
            onTabChange: function (api, details) {
                api.showTab(details.newTabName);
            },
            onSubmit: function (api, details) {
                var data = api.getData();
                let error;
                for(let key in errorCode) {
                    let value = data[key];
                    if(!/^\d+$/.test(value)) {
                        error = errorCode[key];
                        break;
                    } else {
                        data[key] = parseInt(value);
                    }
                }
                if(error) {
                    editor.windowManager.alert(error);
                    return;
                }

                data.type = 2;
                editor.execCommand('pageLayout', data);
                api.close();
            },
        })
    };

    var doAct = function(type=0) {
        if(type !== 2) {
            setLayout(type);
        } else {
            setSize(type);
        }
    };
    var itemList = [
        {
            type: 'menuitem',
            text: '纵向布局',
            onAction: () => {
                doAct();
            }
        },
        {
            type: 'menuitem',
            text: '横向布局',
            onAction: () => {
                doAct(1);
            }
        },
        {
            type: 'menuitem',
            text: '页面尺寸',
            onAction: () => {
                doAct(2);
            }
        }
    ];

    editor.ui.registry.addMenuButton('pageLayout', {
        icon: 'new-document',
        text: '页面',
        tooltip: pluginName,
        fetch: callback => {
            callback(itemList);
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
