<template>
    <div class="quote-norm-container">
        <div class="search">
            <el-input size="mini" placeholder="关键字检索" v-model="searchKey" clearable @keyup.native.enter="searchList">
                <el-button slot="append" icon="el-icon-search" @click.stop.prevent="searchList" />
            </el-input>
        </div>
        <div class="tabs">
            <el-tabs ref="samTabs" v-model="tabName" type="card" @tab-click="updateTab">
                <el-tab-pane label="全部" name="all" />
                <el-tab-pane label="国家标准" name="chinese" />
                <el-tab-pane label="国际标准" name="international" />
            </el-tabs>
        </div>
        <div class="datas" v-loading="loading">
            <el-scrollbar class="scrollbar ver">
                <ul>
                    <li v-for="(item,idx) in listData" :key="idx">
                        <div class="title">
                            <el-checkbox v-model="item.checked">{{item.stdNo}} {{item.stdName}}</el-checkbox>
                            <span>现行</span>
                        </div>
                        <el-table size="mini" :data="item.list" :show-header="false" border  stripe style="width: 100%;">
                            <el-table-column prop="key" width="130" show-overflow-tooltip />
                            <el-table-column prop="value" show-overflow-tooltip />
                        </el-table>
                        <div class="btns">
                            <el-button size="mini" type="primary" @click.stop.prevent="setItem(item)">确定</el-button>
                        </div>
                    </li>
                </ul>
            </el-scrollbar>
        </div>
        <div class="pages">
            <el-pagination small background layout="prev, pager, next" :total="total" @size-change="sizeChange" @current-change="currentChange" />
        </div>
    </div>
</template>

<script>
    // import { lemmaList } from '@/slotApi/editor';
    export default {
        name: 'quote-comparison',
        props: {
            keyword: String
        },
        watch: {
            keyword: {
                handler(val) {
                    this.searchKey = val;
                },
                deep: true,
                immediate: true
            }
        },
        data() {
            return {
                tabName: 'all',
                tabArr: [{label:'全部', act:'all'},{label:'国家标准', act:'gb'},{label:'国际标准', act:'fb'}],
                searchKey: '',
                loading: false,
                listData: [
                    {
                        stdNo:'GB/T 233-2019.10',
                        stdName: '通用硅酸盐水泥',
                        isNorm: true,
                        list: [
                            {key:'28天抗压强度', value:'>= 17.0'},
                            {key:'3天抗压强度', value:'>= 42.5'},
                            {key:'凝结时间', value:'45min<=初凝时间<=600min'}
                        ]
                    },
                    {
                        stdNo:'GB/T 9774-2020',
                        stdName: '水泥包装袋',
                        isNorm: true,
                        list: [
                            {key:'纸袋', value:'适用温度不高于80℃'},
                            {key:'复膜塑编袋、纸塑复合袋', value:'适用温度不高于100℃'},
                            {key:'跌落不破次数', value:'应不小于6次'}
                        ]
                    }
                ],
                total: 0,
                query: {
                    "pageNum": 1,
                    "pageSize": 20
                },
                selectItems: []
            }
        },
        methods: {
            updateTab() {

            },
            setItem(item) {
                this.$emit('change', { act:'comparsion', ...item });
            },
            checkInSelected(item) {
                var index = _.findIndex(this.selectItems, { stdNo:item.stdNo });
                return !!~index;
            },
            searchList() {
                this.query = {
                   pageNum: 1,
                   pageSize: 20
                }
                this.listComparsion();
            },
            sizeChange(size) {
                this.query.pageSize = size;
                this.query.pageNum = 1;
                this.listComparsion();
            },
            currentChange(page) {
                this.query.pageNum = page;
                this.listComparsion();
            },

            listComparsion() {

            }
        },
        created() {
            this.listComparsion();
        }
    }
</script>

<style lang="scss" scoped>
    .quote-norm-container{
        height: 100%;
        .search{
            padding: 5px 10px;
        }
        .tabs{
            height: 26px;
        }
        .datas{
            overflow: hidden;
            height: calc(100% - 110px);
            background-image: linear-gradient(0deg, transparent, #FFF);
            ul{
                >li{
                    border-bottom: 1px solid #DDD;
                    padding: 5px 10px;
                    margin: 10px;
                    .title{
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding-bottom: 5px;
                    }
                    .btns{
                        padding: 5px 0;
                    }
                }
            }
        }
        .pages{
            height: 35px;
        }
    }
</style>
