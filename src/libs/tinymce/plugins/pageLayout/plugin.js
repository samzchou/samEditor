

tinymce.PluginManager.add('pageLayout', function(editor, url) {
    var pluginName = '页面';

    var errorCode = {
        'width': '页面宽度数值不能为空，必须为整数！',
        'height': '页面高度数值不能为空，必须为整数！',
        'top': '页边距上方数值不能为空，必须为整数！' ,
        'bottom': '页边距下方数值不能为空，必须为整数！',
        'left': '页边距左侧数值不能为空，必须为整数！',
        'right': '页边距右侧数值不能为空，必须为整数！'
    };
    var sizeMap = {
        "A6": { "width":"105", "height":"148" },
        "A5": { "width":"148", "height":"210" },
        "A4": { "width":"210", "height":"297" },
        "A3": { "width":"297", "height":"420" },
        "A2": { "width":"420", "height":"594" },
    }

    var fromPageData = function() {
        var node = editor.selection.getNode();
        var block = editor.dom.getParent(node, '.info-block');
        return {
            "size": block.dataset.pagesize||'A4',
            "direction": block.offsetWidth <  block.offsetHeight ? 'portrait' : 'landscape',
            "width": block.style.width ? block.style.width.replace(/mm/g, '') : '210',
            "height": block.style.height ? block.style.height.replace(/mm/g, '') : '297',
            "top": block.style.paddingTop ? block.style.paddingTop.replace(/mm/g, '') : '25',
            "right": block.style.paddingRight ? block.style.paddingRight.replace(/mm/g, '') : '25',
            "bottom": block.style.paddingBottom ? block.style.paddingBottom.replace(/mm/g, '') : '20',
            "left": block.style.paddingLeft ? block.style.paddingLeft.replace(/mm/g, '') : '20',
            "page-header": block.dataset.no||'',
            //"page-number": block.dataset.pagenum !== ''
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
                        title: '页面尺寸',
                        items: [
                            {
                                type: "grid",
                                columns: 2,
                                items: [
                                    {
                                        name: 'size',
                                        type: 'listbox',
                                        label: '纸张类型',
                                        items: [
                                            { text: '请选择...', value: '' },
                                            { text: 'A6纸', value: 'A6' },
                                            { text: 'A5纸', value: 'A5' },
                                            { text: 'A4纸', value: 'A4' },
                                            { text: 'A3纸', value: 'A3' },
                                            { text: 'A2纸', value: 'A2' }
                                        ]
                                    },
                                    {
                                        name: 'direction',
                                        type: 'listbox',
                                        label: '方向',
                                        items: [
                                            { text: '请选择...', value: '' },
                                            { text: '横向', value: 'landscape' },
                                            { text: '纵向', value: 'portrait' }
                                        ]
                                    }
                                ]
                            },
                            {
                                type: "grid",
                                columns: 2,
                                items: [
                                    { name: 'width', type: 'input', label: '页面宽度(mm)' },
                                    { name: 'height', type: 'input', label: '页面高度(mm)' }
                                ]
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
                            }
                        ]
                    }
                ]
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
                    text: '当前页面',
                    primary: true
                },
                {
                    type: 'custom',
                    name: 'custom',
                    text: '所有页面'
                }
            ],
            initialData: fromPageData(),
            onTabChange: function (api, details) {
                api.showTab(details.newTabName);
            },
            onChange: function(api, details) {
                var data = api.getData();
                var sizeData = sizeMap[data.size];
                if (details.name === 'size') {
                    data.width = sizeData.width;
                    data.height = sizeData.height;
                    data.direction = 'portrait';
                    api.setData(data);
                } else if (details.name === 'direction') {
                    data.width = data.direction === 'landscape' ? sizeData.height : sizeData.width;
                    data.height = data.direction === 'landscape' ? sizeData.width : sizeData.height;
                }
                api.setData(data);
            },
            onAction: function(api, details) {
                if (details.name === 'custom') {
                    var data = api.getData();
                    let error = checkError(data);
                    if(error) {
                        editor.windowManager.alert(error);
                        return;
                    }
                    data.all = true;
                    data.type = 2;
                    editor.execCommand('pageLayout', data);
                    api.close();
                }
            },
            
            onSubmit: function (api, details) {
                var data = api.getData();
                let error = checkError(data);
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

    var checkError = function(data) {
        let error;
        for(let key in errorCode) {
            let value = data[key];
            if(!/^\d+$/.test(value)) {
                error = errorCode[key];
                return error;
                break;
            } else {
                data[key] = parseInt(value);
            }
        }
        return undefined;
    };

    const toggleCommentState = function (flag) {
        return function (api) {
            var editorCfg = editor.settings.doc_config || {};
            return api.setDisabled(editorCfg.isStandard);
        }
    }

    const itemList = [
        {
            type: 'nestedmenuitem',
            text: 'vertical layout',//纵向布局
            getSubmenuItems: function () {
                return [
                    {
                        type: 'menuitem',
                        text: 'applied to the current page',
                        onAction: function () {
                            editor.execCommand('pageLayout', { type:0, all:false });
                        }
                    },
                    {
                        type: 'menuitem',
                        text: 'applied to all page',
                        onAction: function () {
                            editor.execCommand('pageLayout', { type:0, all:true });
                        }
                    }
                ];
            }
        },
        {
            type: 'nestedmenuitem',
            text: 'horizontal layout',//横向布局
            getSubmenuItems: function () {
                return [
                    {
                        type: 'menuitem',
                        text: 'applied to the current page', // 应用于当前页
                        onAction: function () {
                            editor.execCommand('pageLayout', { type:1, all:false });
                        }
                    },
                    {
                        type: 'menuitem',
                        text: 'applied to all page',//应用于所有页
                        onAction: function () {
                            editor.execCommand('pageLayout', { type:1, all:true });
                        }
                    }
                ];
            }
        },
        {
            type: 'menuitem',
            text: 'page settings',
            onAction: () => {
                setSize();
            },
            onSetup: toggleCommentState(true)
        }
    ];


    editor.ui.registry.addMenuButton('pageLayout', {
        icon: 'new-document',
        text: 'page layout',
        tooltip: pluginName,
        fetch: callback => {
            callback(itemList);
        },
        onSetup: function(api) {
            var nodeChangeHandler = function(e) {
                var currNode = editor.selection.getNode();
                var parentBlock = editor.dom.getParent(currNode, '.info-block');
                var bool = !parentBlock;
                api.setDisabled(bool);
            };
            editor.on('NodeChange', nodeChangeHandler);
            return function() {
                return editor.off('NodeChange', nodeChangeHandler);
            };
        }
    });

    var splitPage = function() {
        var currNode = editor.selection.getNode();
        editor.execCommand('pageSplit', currNode);
        
    }
	
	var getState = editor => {
        var currNode = editor.selection.getNode();
        var parentBlock = editor.dom.getParent(currNode, '.info-block');

        var flag = !parentBlock ? true : (editor.dom.hasClass(parentBlock, 'fixed') || parentBlock.dataset.enlock !== undefined || !parentBlock.isContentEditable);
        // 本身是条目的，且为被锁定正在编辑的
        var olEle = editor.dom.getParent(currNode, '.ol-list') || editor.dom.getParent(currNode, '.appendix-list');
        if (olEle) {
            flag = editor.dom.hasClass(olEle, 'disabled'); // || currNode.dataset.index.length === item.indexLens;
        }
        return flag;
    };
	
	// 切换按钮状态
    var toggleButtonState = editor => {
        return (api) => {
            var nodeChangeHandler = (e) => {
                let disabled = getState(editor);
                api.setDisabled(disabled);
            };
            editor.on('NodeChange', nodeChangeHandler);
            return () => {
                return editor.off('NodeChange', nodeChangeHandler);
            };
        }
    }

    editor.ui.registry.addButton('pageSplit', {
        text: 'split pages',
        tooltip: 'split pages',
        onAction: () => {
            splitPage();
        },
		onSetup: toggleButtonState(editor)
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
