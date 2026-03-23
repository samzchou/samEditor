/**
 * =================================================
 * @vuedoc
 * @exports tinymce/plugins/bzton/plugins
 * @module
 * @desc 标准同编辑器插件合集
 * @author sam 2021-08-16
 * =================================================
 */
(function() {
    'use strict';
    var global = tinymce.util.Tools.resolve('tinymce.PluginManager');

    var addButton = (editor) => {
        editor.ui.registry.addMenuButton('tagBtn', {
            icon: 'comment-add',
            tooltip: '添加批注/标签',
            fetch: callback => {
                var items = [{
                        type: 'menuitem',
                        text: '添加批注',
                        tooltip: '选中文字添加批注',
                        onAction: () => {
                            doAct('addAnnotation');
                        }
                    },
                    {
                        type: 'menuitem',
                        text: '清除批注',
                        onAction: () => {
                            doAct('clearAnnotation');
                        }
                    },
                    {
                        type: 'menuitem',
                        text: '添加标签',
                        tooltip: '选中文字或在段落上添加标签',
                        onAction: () => {
                            doAct('addTag');
                        }
                    },
                    {
                        type: 'menuitem',
                        text: '清除标签',
                        onAction: () => {
                            doAct('clearTag');
                        }
                    }
                ];
                callback(items);
            }
        });
    }


    function Plugin() {
        global.add('tagBtn', function(editor) {
           addButton(editor);
        });
    }

    Plugin();

}());
