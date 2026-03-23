<template>
    <div class="struct-lists">
        <div class="search">
            <el-input size="mini" placeholder="关键字检索" v-model="searchKey" clearable @keyup.native.enter="searchList">
                <el-button slot="append" icon="el-icon-search" @click.stop.prevent="searchList" />
            </el-input>
        </div>
        <div class="datas" v-loading="loading" element-loading-text="正在加载文档列表,请稍候...">
            <el-table size="mini" :data="quoteList" :max-height="500" stripe style="width: 100%;">
                <el-table-column prop="stdNo" label="标准编号" width="150" show-overflow-tooltip />
                <el-table-column prop="stdName" label="标准名称" show-overflow-tooltip />
                <el-table-column label="查看详细" width="80">
                    <template slot-scope="scope">
                        <el-button size="small" type="text" icon="el-icon-document" @click.stop.prevent="rowClick(scope.row)">查阅</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="pages">
                <pagination :pageSize="query.pageSize" :currentPage="query.pageNum" :total="total" @change="pageChange" />
            </div>
        </div>
    </div>
</template>

<script>
    // 结构化数据API接口
    import { contentTemplateStructList, docStructList, outlineStructList } from '@/api/outline';
    // 文档转换HTML模块
    import parseStructHtml from "@/components/tinymceEditor/utils/parseStructFromHtml";
    // 引入全局方法
    import $global from '@/utils/global';

    export default {
        name: 'struct-lists',
        components: {
            pagination: () => import('@/components/pagination'),
        },
        props: {
            editorSetting: Object
        },
        data() {
            return {
                loading: false,
                listTemplate: [],
                searchKey: '',
                total: 0,
                query: {
                    pageNum: 1,
                    pageSize: 20
                },
                outlineData: [],
                currStructDoc: {},
                quoteList: [],
                htmlContent: ''
            }
        },
        methods: {
            /**
             * @description 页码组件事件
             * @param {Object}  data
             */
            pageChange(data = {}) {
                this.query.pageNum = data.curPage;
                this.getStructDocList();
            },
            /**
             * @description 文档列表行点击
             * @param {Object}  row
             * @param {Object}  column
             * @param {Object}  event
             */
            rowClick(row) {
                this.currStructDoc = row;
                this.getDocContent();
            },
            /**
             * @description 解析文档内容
             */
            async getDocContent() {
                const { code, rows } = await outlineStructList({ docId: this.currStructDoc.docId }, this.editorSetting.editorURL||process.env.VUE_APP_EDITOR_URL);
                if (code === 200) {
                    var outlineDatas = rows.map(item => {
                        item = _.omit(item, ['docId', 'ancestors', 'isAsc', 'pageNum',
                            'pageSize', 'remark', 'delFlag', 'orderByColumn', 'infoNum', 'locked',
                            'extendContent', 'updateUser', 'updateTime', 'commitId', 'params',
                            'tagList', 'createTime', 'deleteTime', 'deleteUser', 'searchValueArray',
                            'createUser', 'searchValue'
                        ]);
                        item.content = _.omit(item.content, ['updateUser', 'pageSize',
                            'updateTime', 'remark', 'delFlag', 'orderByColumn', 'params', 'pageNum',
                            'outlineId', 'createTime', 'deleteTime', 'deleteUser',
                            'searchValueArray', 'createUser', 'isAsc', 'searchValue'
                        ]);
                        // 附录项及附录条款
                        if (item.outlineCatalog && item.outlineCatalog.split('.').length > 1 && /^[3.]/.test(item.outlineCatalog)) {
                            item.isVisible = 0;
                        }
                        if ([8, 9].includes(item.outlineType)) {
                            item.appendix = true;
                            item.letter = $global.numberToLetters[parseInt(item.outlineCatalog) - 1];
                            item.docattr = item.outlineType === 8 ? 'specs' : 'means';
                        }
                        return item;
                    });
                    outlineDatas = _.orderBy(outlineDatas, ['outlineType', 'orderNum']);
                    this.outlineData = $global.handleTree(outlineDatas, 'outlineId', 'parentId', 'children', '0');
                    console.log('this.outlineData', this.outlineData)

                    var htmlArr = [`<div class="page-container reader" data-id="${this.currStructDoc.docId}" data-outlineid="${this.outlineData[0]['outlineId']}" data-no="${this.currStructDoc.stdNo}">`];
                    var coverTemp = _.find(this.listTemplate, {
                        'tmplType': this.currStructDoc.stdKind,
                        'tmplName': 'cover'
                    });
                    var coverHtmlData = parseStructHtml.parseCoverHtml(this.currStructDoc, coverTemp, this.editorSetting);

                    if (coverHtmlData) {
                        let pageNo = coverHtmlData.pageNo;
                        htmlArr.push(coverHtmlData.htmlContent);
                        if (this.outlineData && this.outlineData.length) {
                            var outlineHtmlArr = parseStructHtml.parseHtmlByOutline(this.outlineData, pageNo, this.currStructDoc.stdKind, this.listTemplate);
                            htmlArr = htmlArr.concat(outlineHtmlArr);
                        }
                    } else {
                        htmlArr.push(`<div class="info-block"><p>无法读取文档内容！</p></div>`);
                    }
                    htmlArr.push('</div>');

                    // 上报事件
                    this.$emit('change', { act:'setContent', htmlContent: htmlArr.join(""), outlineData: this.outlineData})

                }

            },

            searchList() {
                this.query = {
                    pageNum: 1,
                    pageSize: 20
                }
                this.getStructDocList();
            },
            /**
             * @description 获取结构化文档模板
             */
            async getStructTemplates() {
                const { code, rows } = await contentTemplateStructList({}, this.editorSetting.editorURL||process.env.VUE_APP_EDITOR_URL);
                if (code === 200) {
                    this.listTemplate = rows.map(item => {
                        item = _.omit(item, ['createTime', 'createUser', 'delFlag',
                            'deleteTime', 'deleteUser', 'isAsc', 'orderByColumn', 'pageNum',
                            'pageSize', 'params', 'remark', 'searchValue', 'searchValueArray',
                            'updateTime', 'updateUser'
                        ]);
                        return item;
                    });
                }
                console.log('this.listTemplate=>', this.listTemplate);

                this.getStructDocList();
            },

            async getStructDocList() {
                const condition = _.merge({
                    "orderBy": "create_time",
                    "orderType": "desc",
                    "searchValue": this.searchKey,
                }, this.query);

                const { code, rows, total } = await docStructList(condition, this.editorSetting.editorURL || process.env.VUE_APP_EDITOR_URL);
                console.log('getStructDocList', rows)
                if (code === 200) {
                    this.total = total;
                    this.quoteList = rows.map(item => {
                        item = _.pick(item, ['docId','stdName','stdNo','stdKind']);
                        return item;
                    })
                }
            },

            /**
             * @description 获取结构化文档的数据
             */
            async getDocData() {


            },


        },

        created() {
            this.getStructTemplates();
        }
    }
</script>

<style lang="scss" scoped>
    .struct-lists{
        .search{
            padding: 5px;
        }
        .datas{
            .pages{
                padding: 5px 10px;
            }
        }
    }
</style>
