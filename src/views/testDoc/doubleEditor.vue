<template>
    <div class="double-editor-page">
        <div class="">
            <sam-editor ref="samEditor1" name="tinymceEditor-1" :data="editorSetting1" @change="changeEvent($event, 1)" />
        </div>
        <div>
            <sam-editor ref="samEditor2" name="tinymceEditor-2" :data="editorSetting2" @change="changeEvent($event, 2)" />
        </div>
    </div>
</template>

<script>
    import $global from '@/utils/global.js';
    import samEditor from "@/components/samEditor/samEditor.vue";
    import { editorOptions } from './editorConfig';

    export default {
        name: 'double-editor',
        components: {
            samEditor
        },
        computed: {

        },
        data() {
            return {
                loaded: false,
                editorSetting1: {
                    author: {},
                    wordBreak: false,                                       // word自动处理分页
                    disabledOutline: true,                                  // 屏蔽大纲的编辑
                    // readonly: true,                                      // 只读模式，注意：如果开启则不显示大纲
                    reader: true,                                           // 阅读模式，同步会开启大纲
                    menuBar: false,                                         // 关闭菜单
                    toolbar1: '',                                           // 关闭工具栏1
                    toolbar2: '',                                           // 关闭工具栏2
                    openSidebar: false,                                     // 展开左侧栏
                    quickbars_selection_toolbar: false,                     // 快捷工具条
                    showOutline: true,                                      // 显示大纲
                    page: {
                        expand: true,                                       // 注意预览模式下把此功能设为 false
                        id: '41255c5b-80e5-48b2-a398-b4d5e77cb1fe',         // 编辑器直接按文档等ID加载内容
                    },
                    draftTimes: 0,
                    editorId: '41255c5b-80e5-48b2-a398-b4d5e77cb1fe',
                },
                editorSetting2: {
                    author: {},
                    wordBreak: false,                                       // word自动处理分页
                    disabledOutline: true,                                  // 屏蔽大纲的编辑
                    // readonly: true,                                      // 只读模式，注意：如果开启则不显示大纲
                    reader: true,                                           // 阅读模式，同步会开启大纲
                    menuBar: false,                                         // 关闭菜单
                    toolbar1: '',                                           // 关闭工具栏1
                    toolbar2: '',                                           // 关闭工具栏2
                    openSidebar: false,                                     // 展开左侧栏
                    quickbars_selection_toolbar: false,                     // 快捷工具条
                    showOutline: true,                                      // 显示大纲
                    page: {
                        expand: true,                                       // 注意预览模式下把此功能设为 false
                        // id: 'f1d458b5-a804-486c-8414-64906efcca75',      // 编辑器直接按文档等ID加载内容
                    },
                    draftTimes: 0,
                    htmlContent: '<div class="page-container"><div class="info-block"><p>正在加载文档中...</p></div></div>',
                    editorId: 'f1d458b5-a804-486c-8414-64906efcca75',
                },
            }
        },
        methods: {
            async changeEvent(obj, index=1) {
                console.log('changeEvent======>', obj, index);
                switch(obj.act) {
                    case 'loaded':
                        if (index === 1 && !this.loaded) {
                            await this.$refs.samEditor2.interFaceAction({ act:'loadDocData', docId:'f1d458b5-a804-486c-8414-64906efcca75'});
                            this.loaded = true;
                        }
                        break;
                }
            }
        }
    }
</script>

<style lang="scss" scoped>
    .double-editor-page{
        height: 100%;
        display: flex;
        >div{
            flex:1;
            border-right: 1px solid #dddddd;
            &:last-child{
                border: 0;
            }
        }
    }
</style>
