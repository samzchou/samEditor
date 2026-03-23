
tinymce.PluginManager.add('separateTable', function(editor, url) {
	var toggleSplitState = function (flag) {
        return function (api) {
            var currNode = editor.selection.getNode();
			var tableNode = editor.dom.getParent(currNode, 'table');
			var tr = editor.dom.getParent(currNode, 'tr');
			var bool = !tableNode ? true : false;
			if (flag && tr) {
				var trIndex = editor.dom.nodeIndex(tr);
				if (trIndex === 0) {
					bool = true;
				} else {
					// 判断是否为表头内
					var thead = editor.dom.getParent(tr, 'thead');
					if (thead) {
						bool = true;
					} else {
						var tds = Array.from(tr.childNodes);
						for (let i=0; i<tds.length; i++) {
							let td = tds[i];
							if (parseInt(td.rowSpan) > 1) {
								bool = true;
								break;
							}
						}
					}
				}
			} else {
				var td = editor.dom.getParent(currNode, 'td');
				if (td && td.dataset && td.dataset.index && td.dataset.index === '0') {
					bool = true;
				}
			}
            return api.setDisabled(bool);
        }
    }

	var itemList = [
        {
            type: 'menuitem',
            text: 'merge next table',
            onAction: () => {
                doAct(0);
            },
            onSetup: toggleSplitState(true)
        },
		{
            type: 'menuitem',
            text: 'average cols',
            onAction: () => {
                doAct(3);
            },
            onSetup: toggleSplitState(true)
        },
        {
            type: 'menuitem',
            text: 'split By Row',
            onAction: () => {
                doAct(1);
            },
            onSetup: toggleSplitState(true)
        },
        /*{
            type: 'menuitem',
            text: 'split By Column',
            onAction: () => {
                doAct(2);
            },
            onSetup: toggleSplitState(false)
        }*/
    ];

    var doAct = function (type) {
		var currNode = editor.selection.getNode();
		editor.execCommand('separateTable', currNode, type);
	}

    editor.ui.registry.addMenuButton('separateTable', {
        name: 'separateTable',
        text: 'adjusting table',
		icon: 'table-row-properties',
        tooltip: 'adjusting table',
        fetch: callback => {
            callback(itemList);
        },
        onSetup: (api) => {
            var nodeChangeHandler = (e) => {
            	let currNode = editor.selection.getNode();
                let tableNode = editor.dom.getParent(currNode, 'table');
                let disabled = tableNode === null;
                api.setDisabled(disabled);
            };
            editor.on('NodeChange', nodeChangeHandler);
            return () => {
                return editor.off('NodeChange', nodeChangeHandler);
            };
        }
    });


    return {
        getMetadata: function () {
            return  {
                name: pluginName,
                url: "https://www.bztom.com/",
            };
        }
    };
});
