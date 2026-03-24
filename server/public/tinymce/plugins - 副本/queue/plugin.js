/**
 * ========================================================================
 * @description 无序列项
 * @param {Object} editor
 * @param {Object} url
 * @author sam.shen 2021-08-02
 * ========================================================================
 */

tinymce.PluginManager.add('queue', function(editor, url) {
    'use strict';
    var global$1 = tinymce.util.Tools.resolve('tinymce.util.Tools');
    var pluginName = 'Bullet';

    var menuList = [{
            type: 'choiceitem',
            text: '破折号',
            icon: 'list-line',
            value: 'line'
        },
        {
            type: 'choiceitem',
            text: '实心圆点',
            icon: 'list-bull-default',
            value: 'circle'
        },
        {
            type: 'choiceitem',
            text: '空心圆点',
            icon: 'list-hollow-circle',
            value: 'hollow-circle'
        },
        {
            type: 'choiceitem',
            text: '实心方块',
            icon: 'list-bull-square',
            value: 'square'
        },
        {
            type: 'choiceitem',
            text: '空心方块',
            icon: 'list-hollow-square',
            value: 'hollow-square'
        },
        {
            type: 'choiceitem',
            text: '字母',
            icon: 'list-num-lower-alpha',
            value: 'lower'
        },
        {
            type: 'choiceitem',
            text: '数字',
            icon: 'list-num-default',
            value: 'num'
        }
    ];
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

    var moveSelectionToElement = function(element, extraBr=false) {
        editor.selection.select(element, true);
        editor.selection.collapse(extraBr);
    };

    var getNextAllNodes = function(node=null) {
        let nextNode = node.nextElementSibling, nodeArray = [];
        while(nextNode != null){
            nodeArray.push(nextNode);
            nextNode = nextNode.nextElementSibling;
        }
        return nodeArray;
    };

    // 按钮事件动作
    var doAct = function(styleValue, isDeafault=false) {
        // 当前节点
        var currNode = editor.selection.getNode();
        // 父级节点
        var parentNode = currNode.parentNode;
        if(editor.dom.hasClass(parentNode, 'page-container') || (editor.dom.hasClass(currNode, 'ol-list') || editor.dom.hasClass(currNode, 'appendix-list'))) {
            editor.windowManager.alert("当前元素不能定义列项！");
            return false;
        }
        // 新创建列项或者附录项
        if (!editor.dom.hasClass(currNode, 'bullet')) {
            var nextNodes = getNextAllNodes(currNode);
            let newEle = editor.dom.create('div', { class:'bullet' }, currNode.innerHTML);
            
            // 包含在列项中
            if (editor.dom.hasClass(parentNode, 'bullet')) {
                editor.dom.insertAfter(newEle, parentNode);
                if(nextNodes.length) {
                    nextNodes.forEach(el => {
                        newEle.appendChild(el);
                    })
                }
            } else {
                editor.dom.insertAfter(newEle, currNode);
            }
            
            currNode.remove();
            let level = 0;

            // 包含在层级项中
            if(editor.dom.hasClass(parentNode, 'ol-list') || editor.dom.hasClass(parentNode, 'appendix-list')) {
                level = 1;
            } else if(editor.dom.hasClass(parentNode, 'bullet')) {
                level = parseInt(parentNode.dataset.level) + 1;
            }

            newEle.dataset.start = 0;
            newEle.dataset.level = level;
            newEle.dataset.type = styleValue;
            moveSelectionToElement(newEle);

            editor.execCommand('resetBullet', styleValue, newEle);
        // 改变原有的列项样式
        } else {
            if(editor.dom.hasClass(parentNode, 'bullet')) {
                currNode = parentNode;
            }
            editor.execCommand('resetBullet', styleValue, currNode);
        }

    };

    var isChildOfBody = function(elm) {
        return editor.$.contains(editor.getBody(), elm);
    };
    var isTableCellNode = function(node) {
        return node && /^(TH|TD)$/.test(node.nodeName);
    };
    var isListNode = function() {
        return function(node) {
            return node && node.getAttribute('class').match(/bullet/g) && isChildOfBody(node);
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

    var getSelectedClass = function() {
        var cls = '';
        var listElm = editor.dom.getParent(editor.selection.getNode(), '.bullet');
        if(listElm) {
            cls = listElm.dataset ? listElm.dataset.type : '';
        }
        return Optional.from(cls);
    };
    var isWithinList = function(e) {
        var tableCellIndex = findIndex(e.parents, isTableCellNode);
        var parents = tableCellIndex !== -1 ? e.parents.slice(0, tableCellIndex) : e.parents;
        var lists = global$1.grep(parents, isListNode);
        return lists.length > 0 && editor.dom.hasClass(lists[0], 'bullet');
    };


    editor.ui.registry.addSplitButton('queue', {
        icon: `unordered-list`,
        tooltip: pluginName,
        presets: 'listpreview',
        columns: 3,
        fetch: function(callback) {
            callback(menuList);
        },
        onAction: function() {
            return doAct('line', true);
        },
        onItemAction: (api, value) => {
            return doAct(value);
        },
        select: function(value) {
            var listClass = getSelectedClass();
            var fg = listClass.map(function(listCls) {
                return value === listCls;
            }).getOr(false);
            return fg;
        },
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


    /*editor.ui.registry.addMenuItem('removequeue', {
        text: '删除列项',
        tooltip: '删除',
        onAction: () => {
            alert('删除列项');
            // editor.execCommand(item.act, db, currNode);
        }
    });

    editor.ui.registry.addContextMenu('queue', {
        update: function(element) {
            console.log('element====>', element)
            if(editor.dom.hasClass(element, 'bullet')) {
                return 'removequeue';
            }
            return '';
        }
    });*/

    return {
        getMetadata: function() {
            return {
                name: pluginName,
                url: "http://www.bzton.cn",
            };
        }
    };
})
