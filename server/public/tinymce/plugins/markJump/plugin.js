tinymce.PluginManager.add('markJump', function(editor, url) {
    const pluginName = 'markJump';
	
    const getItemList = (treeNodeList) => {
        const submenuItems = [];
        treeNodeList.forEach(node => {
            const hasChildren = node.children && node.children.length > 0;
            // 基础配置：区分是子菜单（nestedmenuitem）还是普通项（menuitem）
            const menuConfig = {
                type: hasChildren ? 'nestedmenuitem' : 'menuitem',
                text: `${node.number || ''} ${node.label || ''}`.trim(),
                value: node.id,
            };

            // 1. 有子节点：递归生成二级子菜单（getSubmenuItems）
            if (menuConfig.type === 'nestedmenuitem') {
                menuConfig.getSubmenuItems = function() {
                    return getItemList(node.children); // 递归返回子菜单项
                };
            } else { // 2. 无子节点：直接生成普通菜单项（menuitem）
                menuConfig.onAction = function() {
                    editor.execCommand('insertMarkJump', {number: node.number, id: node.id});
                };
            }
            submenuItems.push(menuConfig);
        });
        return submenuItems;
    }

    editor.ui.registry.addMenuButton('markJump', {
        text: 'mark jump',
        tooltip: 'mark jump',
        fetch: callback => {
            const treeOutlineList = editor.outlineList || [];
            const nestedMenuItems = getItemList(treeOutlineList);

            callback(nestedMenuItems);

            // console.log('treeOutlineList   =>   ', treeOutlineList);
        },
        onSetup: (api) => {
            const nodeChangeHandler = (e) => {
                // const disabled = toggleState(editor);
                // api.setDisabled(disabled);
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
