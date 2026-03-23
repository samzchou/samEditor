/**
 * =================================================
 * @module
 * @desc 编辑器事件总线模块
 * @author sam 2021-12-28
 * =================================================
 */

import $bus from "@/utils/bus";
export default {
    vm: null,
    init(editor, vm) {
        this.vm = vm;
        this.busOnEvent();
    },

    busOnEvent() {
        // 接收引用上报事件(标准|术语等)
        $bus.$on('putQuote', quoteItem => {

        });
    },

    destroy() {
        $bus.$off(['putQuote','closeEditor','valiadteUpdate','locked']);
    },

}
