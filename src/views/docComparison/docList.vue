<template>
    <div class="quote-container">
        <div class="lists">
            <div class="search">
                <el-input size="mini" placeholder="关键字检索" v-model="searchKey" clearable @keyup.native.enter="searchList">
                    <el-button slot="append" icon="el-icon-search" @click.stop.prevent="searchList" />
                </el-input>
            </div>
            <div class="datas" v-loading="loading" element-loading-text="正在加载标准列表,请稍候...">
                <el-table v-if="!loading" ref="tableClause" size="mini" :data="dataList" stripe style="width: 100%;" :row-class-name="tableRowClassName" @row-click="setCheckedRow" @selection-change="handleSelectionChange">
                    <el-table-column v-if="data.isMultiple" type="selection" align="center" width="50" :selectable="checkedSelect" />
                    <el-table-column type="index" label="序号" align="center" width="70">
                        <template slot-scope="scope">
                            {{ (query.pageNum - 1) * query.pageSize + scope.$index + 1 }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="stdNo" label="标准编号" width="250" show-overflow-tooltip />
                    <el-table-column prop="stdName" label="标准名称" show-overflow-tooltip />

                    <el-table-column v-if="!data.isMultiple" label="选择" align="center" width="100">
                        <template slot-scope="scope">
                            <el-button v-if="checkedSelect(scope.row)" size="mini" type="text" :icon="inSelectRow(scope.row)?'el-icon-check':''" @click.stop.prevent="setCheckedRow(scope.row)">选择</el-button>
                            <el-tooltip v-else content="当前文档已被选取在被比对文档中" placement="left">
                                <span style="color:#CCC;">不可选</span>
                            </el-tooltip>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </div>
        <div class="pages" v-if="total">
            <pagination :pageSize="query.pageSize" :currentPage="query.pageNum" :total="total" @change="pageChange" />
        </div>
    </div>
</template>

<script>
    // API接口 /document/structList ,取结构化文档
    import { docStructList } from '@/api/outline';
    import pagination from './pagination';

    export default {
        name: 'quote-standard',
        components: {
            pagination,
        },
        props: {
            data: {
                type: Object,
                default: () => {
                    return {}
                }
            }
        },
        watch: {
            data: {
                handler(data) {
                    this.checkedItems = [];
                    this.$nextTick(() => {
                        this.getDocList();
                    });
                },
                immediate: true,
                deep: true
            }
        },

        data() {
            return {
                loading: false,
                searchKey: '',
                dataList: [],
                total: 0,
                query: {
                    pageNum: 1,
                    pageSize: 20
                },
                checkedItems: [],
            }
        },
        methods: {
            /**
             * @description 获取已选中的条款
             */
            getValue() {
                return this.checkedItems;
            },
            checkedSelect(row={}) {
                let index = 0;
                if (this.data.isMultiple) { // 选择被比对的文档时则校验比对的文档不能被选取
                    index = _.findIndex(this.data.sourceData, { docId:row.docId });
                    return !~index;
                } else {
                    index = _.findIndex(this.data.targetData, { docId:row.docId });
                    return !~index;
                }
                return true;
            },
            /**
             * @description 已选文档的按钮ICON
             * @param {Object}  row
             */
            inSelectRow(row={}) {
                let itemIndex = _.findIndex(this.checkedItems, { docId:row.docId });
                return !!~itemIndex;
            },
            /**
             * @description 已选文档改变样式
             * @param {Object}  row
             */
            tableRowClassName({row}) {
                let itemIndex = _.findIndex(this.checkedItems, { docId:row.docId });
                if (!!~itemIndex) {
                    return 'checked-row';
                }
                return '';
            },
            /**
             * @description 单选文档
             * @param {Object}  row
             */
            setCheckedRow(row) {
                if (!this.data.isMultiple && this.checkedSelect(row)) {
                    this.checkedItems = [row];
                }
            },
            /**
             * @description 多选文档
             * @param {Array}  rows
             */
            handleSelectionChange(rows) {
                this.checkedItems = _.uniqBy(this.checkedItems.concat(rows), 'docId');
            },

            /**
             * @description 查询文档
             */
            searchList() {
                this.query = {
                    pageNum: 1,
                    pageSize: 20
                }
                this.getDocList();
            },

            /**
             * @description 页码组件事件
             * @param {Object}  data
             */
            pageChange(data = {}) {
                this.query.pageNum = data.curPage;
                this.getDocList();
            },

            /**
             * @description 获取文档列表
             */
            getDocList() {
                this.dataList = [];
                this.loading = true;
                const condition = _.merge({
                    "orderBy": "create_time",
                    "orderType": "desc",
                    "searchValue": this.searchKey,
                }, this.query);

                docStructList(condition, this.data.editorURL).then(res => {
                    if (res.code === 200) {
                        this.total = res.total;
                        this.dataList = res.rows.map(item => {
                            item = _.omit(item, ['pageSize', 'remark', 'delFlag',
                                'orderByColumn', 'thumbnailList', 'updateUser', 'updateTime',
                                'params', 'initOutline', 'pageNum', 'formatId',
                                'docVersionName', 'deleteTime', 'stdUuid', 'deleteUser',
                                'searchValueArray', 'createUser', 'searchValue', 'stdEdition'
                            ]);

                            return item;
                        });
                    }
                    this.loading = false;
                })
            },
            /**
             * @description 清空已设定的数据
             */
            clearData() {
                this.dataList = [];
                this.checkedItems = [];
                this.query = {
                    pageNum: 1,
                    pageSize: 20
                }
            }
        },
        /**
         * 销毁处理
         */
        beforeDestroy() {
            this.clearData();
        }
    }
</script>

<style lang="scss" scoped>
    @import './docList.scss';
</style>
