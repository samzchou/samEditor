<template>
    <div class="doc-compare">
        <docCompare v-if="data.sourceData && data.targetData" :data="data" />
    </div>
</template>

<script>
    // API接口
    import { getDocument } from '@/api/outline.js';
    // 组件
    import docCompare from '@/components/docComparison';
    // 基础配置
    const _appConfig = window.$appConfig[process.env.NODE_ENV];

    export default {
        name: 'test-compare',
        components: {
            docCompare
        },
        data() {
            return {
                data: {
                    editorSetting: {
                        editorURL: _appConfig.VUE_APP_EDITOR_URL, // 编辑器后台接口
                        nodeURL: _appConfig.VUE_APP_NODE_URL, // nodeServer接口
                    },
                    type: 'chapter', // 章节比对
                    sourceData: null, // 原文档题录数据
                    targetData: null, // 比对文档题录数据
                    // compareSubject: 'target', // 按哪个文档的大纲结构进行比对 'source'||'target'
                    executeCompare: true, // 文档加载完成后直接执行比对
                    hideEmptyCompare: true, // 隐藏比对结果差异度为0的列项
                },
            }
        },
        methods: {
            // 加载原文档题录数据和比对文档题录数据
            async getDocData() {
                const fields = ['ccsNumber','consistentSign','docId','icsNumber','origStdNo','recordNumber','releaseDepartment','stdEdition','stdKind','stdName','stdNameEn','stdNo','stdPerformDate','stdPublishDate','stdTitle','stdSign'];
                // 原始文档
                let data;
                let res = await getDocument('daf29c84-08f2-4f2f-ac66-f97a30c30667', _appConfig.VUE_APP_EDITOR_URL);
                if (res && res.data) {
                    data = _.pick(res.data, fields);
                    data.compareText = '原文';
                    this.$set(this.data, 'sourceData', [data]);
                    // 比对文档
                    res = await getDocument('59e7e25c-2617-4417-bd78-6d92d887fa51', _appConfig.VUE_APP_EDITOR_URL);
                    if (res && res.data) {
                        data = _.pick(res.data, fields);
                        data.compareText = '拟改为';
                        this.$set(this.data, 'targetData', [data]);
                    }
                }
            }
        },
        created() {
            this.getDocData();
        }
    }
</script>

<style lang="scss" scoped>
    .doc-compare{
        height: 100%;
    }
</style>
