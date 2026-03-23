<template>
    <div class="editor-container">
        <sam-editor ref="samEditor" :data="editorSetting" @change="changeEvent" />
    </div>
</template>

<script>
    import { listOutline } from '@/api/outline';
    import samEditor from "@/components/samEditor/samEditor.vue";
    import { optionSettings, letters } from '@/config';
    // 全局方法
    import $samGlobal from '@/utils/global';
    export default {
        name: 'view-doc',
        components: {
            samEditor
        },
        props: {
            id: String
        },
        watch: {
            id: {
                handler(docId) {
                    if (docId) {
                        this.$set(this.editorSetting.page, 'id', docId);
                        this.getOutlineList(docId);
                    }
                },
                immediate: true
            },
        },
        data() {
            return {
                editorSetting: {
                    ...optionSettings,
                    socketURL: undefined,
                    mergeDoc: true,
                    readonly: true,
                    menuBar: false,
                    toolbar1: '',
                    draftTimes: 0,
                },
                outlineList: [],
                outlineData: [],
                editorInstance: null,
            }
        },
        methods: {
            changeEvent(data={}) {
                if(!['onScroll','mouseover'].includes(data.act)) {
                    console.log('about revice change=>', data);
                }
                switch (data.act) {
                    case 'initialized':
                        break;
                    case 'loaded':
                        this.editorInstance = this.$refs.samEditor;
                        break;
                    case 'mouseupEvent':
                        let target = data.event.target;
                        if ($samGlobal.hasClass(target, 'fld-char') || $samGlobal.hasClass(target.parentNode, 'fld-char')) {
                            let outlineId = $samGlobal.hasClass(target, 'fld-char') ? target.dataset.mk : target.parentNode.dataset.mk;
                            console.log('outlineId==>', outlineId)
                            let outlineItem = _.find(this.outlineList, { outlineId });
                            if (outlineItem) {
                                this.selectedItem({ data: outlineItem });
                            }
                        }
                        break;
                    case 'destroy':
                        this.$emit('change', 'destroy');
                        break;
                }
            },
            /**
             * @description 列出大纲数据
             * @param {String} docId 文档ID
             */
            async getOutlineList(docId) {
                this.outlineData = [];
                var condition = {
                    docId,
                    orderByColumn: 'level_num',
                    isAsc: 'asc'
                }
                var res = await listOutline(condition);
                if (res.code === 200 && res.rows) {
                    if (res.rows.length) {
                        let outlineDatas = res.rows.map(item => {
                            let data = _.omit(item, ['commitId', 'createTime', 'createUser', 'delFlag', 'deleteTime', 'deleteUser', 'pageNum', 'params', 'remark', 'searchValue', 'searchValueArray', 'updateTime',
                                'updateUser', 'pageSize', 'orderByColumn', 'isAsc'
                            ]);
                            // 附录项及附录条款
                            if ([8, 9].includes(item.outlineType)) {
                                data.appendix = true;
                                data.letter = letters[parseInt(item.outlineCatalog) - 1];
                                data.docattr = item.outlineType === 8 ? 'specs' : 'means';
                            }
                            return data;
                        });
                        outlineDatas = outlineDatas.filter(o => o.isVisible);
                        outlineDatas = _.orderBy(outlineDatas, ['outlineType', 'orderNum'], ['asc', 'asc']);
                        this.outlineList = outlineDatas; //.filter(item => { return item.isVisible === 1; });
                        this.outlineData = $samGlobal.handleTree(outlineDatas, 'outlineId', 'parentId', 'children', '0');

                        this.reloadDoc();
                    }
                }
            },
            /**
             * @description 加载文档
             */
            async reloadDoc() {
                if (this.editorInstance) {
                    this.editorInstance.interFaceAction({ act: 'loadDocData', docId: this.id })
                }
            },
            /**
             * @description 选中了大纲节点快速定位到页面位置
             * @param {Object} item
             */
            selectedItem(item = {}) {
                item.data.act = "foucsId";
                this.editorInstance.interFaceAction(item.data)
            },
        }
    }
</script>

<style lang="scss" scoped>
    .editor-container{
        width: 100%;
        height: 100%;
    }
</style>
