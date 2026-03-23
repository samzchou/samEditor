/**
 * ===================================================================================================================
 * @module
 * @desc 编辑器外部扩展模块
 * @author sam 2022--8-21
 * ===================================================================================================================
 */
'use strict';
import $global from "@/utils/global";

export default {
    editor: null,
    vm: {},
    /**
     * @description 更新编辑器组件实例
     */
    updateVm(vm) {
        this.vm = vm;
    },
    /**
     * @description 获取当前的编辑器实例
     */
    getActiveEditor() {
        var editors = window.tinyMCE.editors && window.tinyMCE.editors.length ? window.tinyMCE.editors : [];
        for (let i = 0; i < editors.length; i++) {
            let editor = editors[i];
            if (editor.id === `tinymce-editor-${this.vm.editorId||''}`) {
                return editor;
            }
        }
        return this.vm.editor || window.tinyMCE.activeEditor;
    },
    /**
     * @@description 构建动态菜单、工具条
     * @@param {Object}  bia
     */
    initTool(vm = null, editor = null, toolList = []) {
        this.vm = vm;
        for (let i = 0; i < toolList.length; i++) {
            var item = toolList[i];
            if (item.children) {
                this.addMenuButton(editor, item);
            } else {
                this.addButton(editor, item);
            }
        }
    },
    /**
     * @description 触发事件
     * @@param {Object}  editor
     * @@param {Object}  item
     */
    doAction(editor = null, item = {}) {
        editor = this.getActiveEditor();
        // debugger
        // console.log('doAction==>', editor, this.vm.editorId);
        var currNode = editor.selection.getNode();
        if (!this.vm.editorSetting.enabledBtns) {
            if (currNode.nodeName === 'BODY') {
                return false;
            }
            var block = editor.dom.getParent(currNode, '.info-block');
            if (!item.external && !item.enabled && (editor.dom.hasClass(block, 'disabled') || editor.dom.hasClass(block, 'fixed'))) {
                console.log('editor is disabled or fixed');
				this.vm.$message.warning('请在相关页面上使用！');
                return;
            }
        }
        var range = editor.selection.getRng();
        this.vm.$emit('change', { act: 'extendEvent', currNode, range: { startOffset: range.startOffset, endOffset: range.endOffset }, ...item })
    },

    toggleTagState(editor = null, item = {}) {
        return (api) => {
            var currNode = editor.selection.getNode();
            var textContent = currNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '')
            var parentNode = currNode.parentNode;
            // console.log(parentNode)
            var blockNode = editor.dom.getParent(currNode, '.info-block');
            var bool = false;
            if (editor.dom.hasClass(blockNode, 'disabled') || editor.dom.hasClass(blockNode, 'fixed') || editor.dom.hasClass(parentNode, 'page-container')) {
                bool = true;
            } else if (editor.dom.hasClass(currNode, 'ol-list') || editor.dom.hasClass(currNode, 'appendix-list')) {
                bool = true;
            }
            if (/^\保存|\导出/.test(item.text) || ['字符替换'].includes(item.text)) {
                bool = false;
            }

            // 如果配置了启用菜单或按钮
            if (item.event && this.vm.editorSetting.enabledBtns && this.vm.editorSetting.enabledBtns.includes(item.event)) {
                bool = false;
            }
            if (item.enabled) {
                bool = false;
            }

            return api.setDisabled(bool);
        }
    },
    /**
     * @description 注册工具栏按钮
     * @@param {Object}  editor
     * @@param {Object}  item
     */
    addButton(editor = null, item = {}) {
        var data = {
            tooltip: item.tooltip,
            text: item.text,
            onAction: () => {
                this.doAction(editor, item);
            },
            onSetup: this.toggleTagState(editor, item)
        }
        if (item.icon) {
            data.icon = item.icon;
        }
        editor.ui.registry.addButton(item.event, data);
        editor.ui.registry.addMenuItem(item.event, data);
    },
    /**
     * @description 注册菜单栏和下拉式菜单
     * @@param {Object}  editor
     * @@param {Object}  item
     */
    addMenuButton(editor = null, item = {}) {
        let items = [];
        for (let i = 0; i < item.children.length; i++) {
            let db = item.children[i];
            let obj = {
                type: 'menuitem',
                text: db.text,
                tooltip: db.tooltip,
                onAction: () => {
                    this.doAction(editor, db)
                },
                onSetup: this.toggleTagState(editor, item)
            }
            items.push(obj);
        }
        let data = {
            text: item.text,
            tooltip: item.tooltip,
            fetch: callback => {
                callback(items);
            }
        }
        if (item.icon) {
            data.icon = item.icon;
        }
        // 菜单栏主按钮
        editor.ui.registry.addMenuButton(item.event, data);
        // 菜单栏下拉式二级菜单
        editor.ui.registry.addNestedMenuItem(item.event, {
            icon: item.icon,
            text: item.text,
            getSubmenuItems: function() {
                return items;
            }
        });
    }
}
