<template>
    <div class="tcs-container" v-loading="loading">
        <el-transfer
            filterable
            v-model="dataValues"
            :filter-method="filterMethod"
            :data="arrList"
            :props="{key:'value', label:'label'}"
            :titles="['单位列表', '已选择']"
            filter-placeholder="检索" @change="changeValues">
            <span slot-scope="{ option }">{{ option.key }} - {{ option.label }}</span>
        </el-transfer>
        <div class="btns">
            <el-input size="mini" v-model="searchKey" prefix-icon="el-icon-search" clearable style="width:250px" placeholder="关键字查询" />
            <el-pagination layout="prev, pager, next" :total="total" @current-change="handleCurrentChange" />
        </div>
    </div>
</template>

<script>
    import { baseData } from "@/api/dms";
    import $samGlobal from "@/utils/global";
    export default {
        name: 'select-tcs',
        props: {
            data:Object
        },
        computed: {
            arrList() {
                var arr = this.utilList;
                if (this.searchKey) {
                    arr = arr.filter(o => { return o.label.includes(this.searchKey) || o.value.includes(this.searchKey) })
                }
                // this.total = arr.length;
                var startIndex = this.query.pageNo * this.query.pageSize;
                var endIndex = startIndex + this.query.pageSize;
                return arr.slice(startIndex, endIndex);
            },
            total() {
                var arr = this.utilList;
                if (this.searchKey) {
                    arr = arr.filter(o => { return o.label.includes(this.searchKey) || o.value.includes(this.searchKey) })
                }
                return arr.length;
            }
        },
        data() {
            return {
                loading: true,
                dataValues: [],
                utilList: [],
                query: {
                    pageNo: 0,
                    pageSize: 30,
                },
                searchKey: ''
            }
        },
        methods: {
            changeValues() {
                var strArr = [];
                this.dataValues.forEach(val => {
                    let data = _.find(this.utilList, { value:val });
                    if (data) {
                        strArr.push(`<a data-id="${data.value}" data-name="draftPerson" data-code="${val}" title="${data.title}">${data.label}</a>`);
                    }
                });
                this.$emit('change', strArr.join("、"));
            },
            filterMethod(query, item) {
                return item.value.indexOf(query) > -1 || item.label.indexOf(query) > -1;
            },
            handleCurrentChange(page=0) {
                this.query.pageNo = page;
            },

            setValues() {
                if (this.data.value) {
                    this.dataValues = this.data.value.map(item => {
                        return item.value;
                    });
                }
            },

            async getUtilData() {
                this.loading = true;
                var condition = {
                    "request_id": "123",
                    "operation": "GET_DMS_STD_SPECIALIST",
                    "page_no": 0,
                    "page_size": 8000,
                    "requester": "TOPICAL",
                    "root_category_name": "中标分类",
                    "root_oa_category_no": 1
                };
                var keyword = this.searchKey.replace(/\s/g,'')
                if (keyword) {
                    condition.name_keyword = keyword;
                }
                var editorConfig = $samGlobal.getTinymceConfig();
                var res = await baseData(condition, editorConfig.dmsApi||'');
                if (res.error_code === 200) {
                    res.data.forEach(item => {
                        if(item.name) {
                            let obj = {
                                label: item.name,
                                value: item.id
                            }
                            var index = _.findIndex(this.utilList, obj);
                            if(!~index) {
                                obj.title = `${item.specialty||''}-${item.position||''}-${item.title||''}`;
                                this.utilList.push(obj);
                            }
                        }
                    });
                }
                this.loading = false;
                this.setValues();
            }
        },
        created() {
            this.getUtilData();
        }
    }
</script>

<style lang="scss" scoped>
    .tcs-container{
        height: 100%;
        padding:10px;
        ::v-deep .el-transfer {
            .el-transfer-panel{
                width: 350px;
                .el-transfer-panel__body{
                    height: 350px;
                    .el-transfer-panel__filter{
                        margin:0;
                        .el-input__inner{
                            border-radius: 0;
                        }
                    }
                    .el-checkbox-group{
                        display: inherit;
                        height: calc(100% - 32px);
                        .el-checkbox__label{
                            padding-left: 20px;
                        }
                    }

                }

            }
            .el-transfer__buttons{
                display: inline-flex;
                padding: 0 10px;
                flex-direction: column;
                button{
                    padding: 8px 15px;
                    margin: 5px 0;
                }
            }

        }
        .btns{
            padding: 10px 0;
            display: flex;
            justify-content: space-between;
            ::v-deep .el-pagination{
                .number{
                    min-width:25px;
                }
            }
        }
    }
</style>
