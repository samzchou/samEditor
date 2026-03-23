<template>
    <standardReader :data="editorSetting" :pdfUrl="pdfUrl" />
</template>

<script>
    import standardReader from '@/components/reader/index.vue';
    import { editorOptions } from '@/views/testDoc/editorConfig';
    export default {
        name: 'stdReader',
        components: {
            standardReader
        },
        data() {
            return {
                editorSetting: Object.assign(editorOptions, {
                    author: {},
                    disabledOutline: true,                           // 屏蔽大纲的编辑
                    // readonly: true,                              // 只读模式，注意：如果开启则不显示大纲
                    reader: true,                                    // 阅读模式，同步会开启大纲
                    menuBar: false,                                  // 关闭菜单
                    toolbar1: '',                                    // 关闭工具栏1
                    toolbar2: '',                                    // 关闭工具栏2
                    openSidebar: true,                               // 展开左侧栏
                    quickbars_selection_toolbar: false,              // 光比快捷工具条
                    showOutline: true,                               // 显示大纲
                    zoomIn: true,
                    page: {
                        expand: false,
                        id: 'c8d7552b-7856-435b-8448-44e09c637bb3', //
                    },
                    draftTimes: 0,
                    htmlContent: '',
                    tooltips: [{ label: '标签', act: 'tag' }, { label: '批注', act: 'comment' }]
                }),
                pdfUrl: ''
            }
        },
        created() {
            // 从url参数 或 cache 定义结构化文档的ID
            var stdId = this.$route.query.id || localStorage.getItem('stdId');
            if (stdId) {
                this.$set(this.editorSetting.page, 'id', stdId);
            }
        }
    }
</script>

<style lang="scss" scoped>
    .std-reader-container{
        height: 100%;

        >header{
            height: 35px;
        }
        >main{
            height: calc(100% - 35px);
        }
    }
</style>
