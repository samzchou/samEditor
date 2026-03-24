/**
 * ========================================================================
 * @description 有序层级列项
 * @param {Object} editor
 * @param {Object} url
 * @author sam.shen 2021-08-11
 * ========================================================================
 */

tinymce.PluginManager.add('levels', function(editor, url) {
    'use strict';
    var global$1 = tinymce.util.Tools.resolve('tinymce.util.Tools');
    var pluginName = '层级有序列项';

    var noop = function() {};
    var constant = function(value) {
        return function() {
            return value;
        };
    };
    var never = constant(false);
    var always = constant(true);
    var none = function() {
        return NONE;
    };
    var NONE = function() {
        var eq = function(o) {
            return o.isNone();
        };
        var call = function(thunk) {
            return thunk();
        };
        var id = function(n) {
            return n;
        };
        var me = {
            fold: function(n, _s) {
                return n();
            },
            is: never,
            isSome: never,
            isNone: always,
            getOr: id,
            getOrThunk: call,
            getOrDie: function(msg) {
                throw new Error(msg || 'error: getOrDie called on none.');
            },
            getOrNull: constant(null),
            getOrUndefined: constant(undefined),
            or: id,
            orThunk: call,
            map: none,
            each: noop,
            bind: none,
            exists: never,
            forall: always,
            filter: none,
            equals: eq,
            equals_: eq,
            toArray: function() {
                return [];
            },
            toString: constant('none()')
        };
        return me;
    }();
    var some = function(a) {
        var constant_a = constant(a);
        var self = function() {
            return me;
        };
        var bind = function(f) {
            return f(a);
        };
        var me = {
            fold: function(n, s) {
                return s(a);
            },
            is: function(v) {
                return a === v;
            },
            isSome: always,
            isNone: never,
            getOr: constant_a,
            getOrThunk: constant_a,
            getOrDie: constant_a,
            getOrNull: constant_a,
            getOrUndefined: constant_a,
            or: self,
            orThunk: self,
            map: function(f) {
                return some(f(a));
            },
            each: function(f) {
                f(a);
            },
            bind: bind,
            exists: bind,
            forall: bind,
            filter: function(f) {
                return f(a) ? me : NONE;
            },
            toArray: function() {
                return [a];
            },
            toString: function() {
                return 'some(' + a + ')';
            },
            equals: function(o) {
                return o.is(a);
            },
            equals_: function(o, elementEq) {
                return o.fold(never, function(b) {
                    return elementEq(a, b);
                });
            }
        };
        return me;
    };
    var from = function(value) {
        return value === null || value === undefined ? NONE : some(value);
    };
    var Optional = {
        some: some,
        none: none,
        from: from
    };

    /**
     * 光标置于当前节点
     * @param {Object} element
     * @param {Object} extraBr
     */
    var moveSelectionToElement = function (element, extraBr) {
        editor.selection.select(element, true);
        editor.selection.collapse(false);
    }

    // 按钮事件动作
    /*var doAct = function(styleValue, evt) {
        var currNode = editor.selection.getNode();
        var parentNode = currNode.parentNode;
        if (currNode.nodeName === 'P') {
            editor.execCommand('toggleLi', currNode, editor.dom.hasClass(parentNode, 'info-block'));
        } else {
            editor.windowManager.alert('条目层级项仅作于元素段落！');
        }
    };*/

    var getItmList = function() {
        var list = [{ text: '选择起始编号...', value: '' }];
        for(let i=1; i<=20; i++) {
            let str = String(i);
            list.push({text: str, value: str});
        }
        return list;
    };

    var doAct = function(type=0) {
        var currNode = editor.selection.getNode();
        var parentNode = currNode.parentNode;
        if (!type) {
            if (currNode.nodeName === 'P') {
                editor.execCommand('toggleLi', currNode, editor.dom.hasClass(parentNode, 'info-block'));
            } else {
                if (currNode.dataset.index) {
                    let newEle = editor.dom.create('p', {}, '&#8203');
                    editor.dom.insertAfter(newEle, currNode);
                    editor.execCommand('toggleLi', newEle, editor.dom.hasClass(parentNode, 'info-block'));
                    moveSelectionToElement(newEle);
                } else {
                    editor.windowManager.alert('条目层级项仅作于元素段落！');
                }
            }
        } else {
            editor.windowManager.open({
                title: '重置层级项编号',
                width: 150,
                body: {
                    type: 'panel',
                    items: [{
                            type: 'listbox',
                            name: 'number',
                            label: '选择编号',
                            items: getItmList()
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
                initialData: { },
                onSubmit: function (api, details) {
                    var data = api.getData();
                    if(!data.number) {
                        editor.windowManager.alert("请选择编号！");
                        return;
                    }
                    api.close();
                    editor.execCommand('resetLevelNumber', currNode, data.number);
                },
            })
        } 
    };

    var clearChildAttrs = function() {
        var children = getChildrenNodes();
        if(children && children.length) {
            children.forEach(node => {
                editor.dom.removeAllAttribs(node)
            })
        }
    };

    var getChildrenNodes = function() {
        var nodeElm = editor.dom.getParent(editor.selection.getNode(), 'ol,ul');
        return nodeElm ? nodeElm.childNodes : null;
    };

    var isChildOfBody = function(elm) {
        return editor.$.contains(editor.getBody(), elm);
    };
    var isTableCellNode = function(node) {
        return node && /^(TH|TD)$/.test(node.nodeName);
    };
    var isListNode = function() {
        return function(node) {
            return node && /^(OL|UL|DL|DIV)$/.test(node.nodeName) && isChildOfBody(node);
        };
    };
    var findIndex = function(list, predicate) {
        for (var index = 0; index < list.length; index++) {
            var element = list[index];
            if (predicate(element)) {
                return index;
            }
        }
        return -1;
    };


    var isWithinList = function(e) {
        var tableCellIndex = findIndex(e.parents, isTableCellNode);
        var parents = tableCellIndex !== -1 ? e.parents.slice(0, tableCellIndex) : e.parents;
        var lists = global$1.grep(parents, isListNode);
        return lists.length > 0 && (editor.dom.hasClass(lists[0], 'ol-list') || editor.dom.hasClass(lists[0], 'appendix-list')); // lists[0].nodeName === 'UL';
    };

    editor.ui.registry.addToggleButton('levels', {
        active: false,
        icon: `ordered-list`,
        tooltip: pluginName,
        onAction: function(evt) {
            return doAct(0);
        },
        // onSetup: toggleCommentState(true)
        onSetup: function(api) {
            var nodeChangeHandler = function(e) {
                api.setActive(isWithinList(e));
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


    return {
        getMetadata: function() {
            return {
                name: pluginName,
                url: "http://www.bzton.cn",
            };
        }
    };
})
