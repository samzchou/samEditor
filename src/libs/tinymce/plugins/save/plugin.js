/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 *
 * Version: 5.8.2 (2021-06-23)
 */
(function() {
    'use strict';

    var global = tinymce.util.Tools.resolve('tinymce.PluginManager');

    var global$1 = tinymce.util.Tools.resolve('tinymce.dom.DOMUtils');

    var global$2 = tinymce.util.Tools.resolve('tinymce.util.Tools');

    var enableWhenDirty = function(editor) {
        return editor.getParam('save_enablewhendirty', true);
    };
    var hasOnSaveCallback = function(editor) {
        return !!editor.getParam('save_onsavecallback');
    };
    var hasOnCancelCallback = function(editor) {
        return !!editor.getParam('save_oncancelcallback');
    };

    var displayErrorMessage = function(editor, message) {
        editor.notificationManager.open({
            text: message,
            type: 'error'
        });
    };


    var register = function(editor) {
        // 直接保存
        /*
        // 取消保存
        editor.addCommand('mceCancel', function() {
            cancel(editor);
        });*/
        // 另存为
        editor.addCommand('docSaveAs', function() {
            saveAs(editor, 'docx');
        });
    };

    var saveAs = function(editor, type='docx') {
        editor = window.tinyMCE.activeEditor;
        // 取消保存
        var docConfig = editor.settings.doc_config;
        if (docConfig && docConfig.disabledSave) {
            return false;
        }

        editor.windowManager.open({
            title: '另存为',
            width: 300,
            height:200,
            body: {
                type: 'panel',
                items: [
                    {
                        type: 'listbox',
                        name: 'type',
                        label: '文件类型',
                        items: [
                            {
                                text: 'Word文件(*.docx)',
                                value: 'docx'
                            },
                            {
                                text: 'Word97-2003文件(*.doc)',
                                value: 'doc'
                            },
                            {
                                text: 'Wps文件(*.wps)',
                                value: 'wps'
                            }
                        ]
                    },
                    {
                        type: 'input',
                        name: 'name',
                        label: '文件名称'
                    }
                ]
            },
            initialData: { type },
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
                if(!data.name) {
                    editor.windowManager.alert('请输入文件名称！');
                } else {
                    editor.execCommand('submitSave', data);
                    api.close();
                }
            },
        })

    };

    var stateToggle = function(editor) {
        return function(api) {
            var handler = function() {
                api.setDisabled(enableWhenDirty(editor) && !editor.isDirty());
            };
            editor.on('NodeChange dirty', handler);
            return function() {
                return editor.off('NodeChange dirty', handler);
            };
        };
    };
    var register$1 = function(editor) {
        editor.ui.registry.addButton('save', {
            icon: 'save',
            tooltip: 'Save',
            text: 'Save',
            onAction: function() {
                return editor.execCommand('submitSave');
            },
            // onSetup: stateToggle(editor)
        });

        editor.ui.registry.addMenuItem('save', {
            icon: 'save',
            text: 'Save',
            onAction: function () {
                return editor.execCommand('submitSave');
            },
            // onSetup: stateToggle(editor)
        });

        /*editor.ui.registry.addButton('cancel', {
            icon: 'cancel',
            tooltip: 'Cancel',
            disabled: true,
            onAction: function() {
                return editor.execCommand('mceCancel');
            },
            onSetup: stateToggle(editor)
        });*/

        var itemTypes = [
            {
                type: 'menuitem',
                text: 'new doc',
                onAction: () => {
                    saveAs(editor, 'newDoc');
                }
            },
            {
                type: 'menuitem',
                text: 'template doc',
                onAction: () => {
                    saveAs(editor, 'doc');
                }
            },
            /*{
                type: 'menuitem',
                text: 'Wps文件(*.wps)',
                onAction: () => {
                    saveAs(editor, 'wps');
                }
            }*/
        ];

        editor.ui.registry.addNestedMenuItem('saveAs', {
            icon: 'saveAs',
            text: 'saveAs',
            getSubmenuItems: function () {
                return itemTypes;
            }
        });

        editor.ui.registry.addMenuButton('saveAs', {
            icon: 'saveAs',
            text: 'saveAs',
            fetch: callback => {
                callback(itemTypes);
            },
            /*onSetup: (api) => {
                var nodeChangeHandler = (e) => {
                    let disabled = toggleState(editor);
                    api.setDisabled(disabled);
                };
                editor.on('NodeChange', nodeChangeHandler);
                return () => {
                    return editor.off('NodeChange', nodeChangeHandler);
                };
            }*/
        });

        editor.addShortcut('Meta+S', '', 'submitSave');
        editor.addShortcut('Meta+Shift+S', '', 'docSaveAs');
    };

    function Plugin() {
        global.add('save', function(editor) {
            register$1(editor);
            register(editor);
        });
    }

    Plugin();

}());
