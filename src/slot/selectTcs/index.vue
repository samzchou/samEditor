<template>
    <div class="tcs-container" v-loading="loading">
        <el-transfer
            filterable
            v-model="tcValues"
            :filter-method="filterMethod"
            :data="arrList"
            :props="{key:'value', label:'label'}"
            :titles="['委员会列表', '已选择']"
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
    import { getTcList } from "@/api/dms";
    import $samGlobal from "@/utils/global";
    export default {
        name: 'select-tcs',
        props: {
            data:Object
        },
        data() {
            return {
                loading: true,
                tcValues: [],
                tcLists: [],
                query: {
                    pageNo: 0,
                    pageSize: 30,
                },
                searchKey: ''
            }
        },
        computed: {
            arrList() {
                var arr = _.cloneDeep(this.tcLists);
                if (this.searchKey) {
                    arr = arr.filter(o => { return o.label.includes(this.searchKey) || o.value.includes(this.searchKey) });
                }
                var startIndex = this.query.pageNo * this.query.pageSize;
                var endIndex = startIndex + this.query.pageSize;
                return arr.slice(startIndex, endIndex);
            },
            total() {
                var arr = this.tcLists;
                if (this.searchKey) {
                    arr = arr.filter(o => { return o.label.includes(this.searchKey) || o.value.includes(this.searchKey) })
                }
                return arr.length;
            }
        },
        methods: {
            changeValues() {
                var strArr = [];
                this.tcValues.forEach(val => {
                    let data = _.find(this.tcLists, { value:val });
                    if (data) {
                        strArr.push(`<a data-id="${data.id}" data-code="${val}"  data-name="tcs" title="${data.title}">${data.label}(${data.value})</a>`);
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
                // console.log('setValues=>',this.data.value)
                if (this.data.value) {
                    this.tcValues = this.data.value.map(item => {
                        return item.value;
                    });
                }
            },
            async getTcData() {
                this.loading = true;
                var condition = {
                    pageNo: 0,
                    pageSize: 5000
                };
                var editorConfig = $samGlobal.getTinymceConfig();
                var res = await getTcList(condition, editorConfig.dmsSupportApi||'');
                if (res.code === 200) {
                    res.data.list.forEach(item => {
                        if(item.tcName) {
                            let obj = {
                                label: item.tcName,
                                value: item.tcCode
                            }
                            var index = _.findIndex(this.tcLists, obj);
                            if(!~index) {
                                obj.id = item.dataId;
                                obj.title = `${item.professionalScope||''}`;
                                this.tcLists.push(obj);
                            }
                        }
                    });
                }
                this.loading = false;
                this.setValues();
            }
        },
        created() {
            this.getTcData();
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
