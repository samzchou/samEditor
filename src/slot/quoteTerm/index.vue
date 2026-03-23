<template>
    <div class="quote-term-container">
        <div class="search">
            <el-input size="mini" placeholder="关键字检索" v-model="searchKey" clearable @keyup.native.enter="searchList">
                <el-button slot="append" icon="el-icon-search" @click.stop.prevent="searchList" />
            </el-input>
        </div>
        <div class="datas" v-loading="loading">
            <ul>
                <li v-for="(item,idx) in listData" :key="idx">
                    <p>中文名：{{item.lemEntry}}</p>
                    <p>英文名：{{item.lemEntryen}}</p>
                    <p>解释：<span v-html="item.lemDescription"/></p>
                    <p>标准文档：{{item.stdNo}} [{{item.stdCaption}}]</p>
                    <p class="btns">
                        <el-button size="mini" type="success" plain icon="el-icon-s-comment" @click.stop.prevent="putQuote(item)">引用</el-button>
                    </p>
                </li>
            </ul>
        </div>
        <div class="pages">
            <pagination :pageSize="query.pageSize" :currentPage="query.pageNum" :total="total" @change="pageChange" />
            <!-- <el-pagination small background layout="prev, pager, next" :total="total" @size-change="sizeChange" @current-change="currentChange" /> -->
        </div>
    </div>
</template>

<script>
    import { lemmaList } from '@/api/editor';
    // 分页组件
    import pagination from '@/components/pagination';
    export default {
        name: 'quote-term',
        components: {
            pagination
        },
        props: {
            keyword: String
        },
        watch: {
            keyword(val) {
                this.searchKey = val;
            }
        },
        data() {
            return {
                loading: false,
                total: 0,
                listData: [],
                searchKey: '',
                query: {
                    "pageNum": 1,
                    "pageSize": 20
                },

            }
        },
        methods: {
            putQuote(item) {
                var htmlContent = `<p class="tag term" data-tag="term" data-id="${item.lemUuid}" data-zhname="${item.lemEntry||''}" data-enname="${item.lemEntryen||''}" style="text-indent:2em;" title="术语"><span style="font-family: simHei;">${item.lemEntry}</span><span style="font-family: times new roman;font-weight:bold">&nbsp;&nbsp;${item.lemEntryen}</span></p><p style="text-indent:2em;">${item.lemDescription}</p><p style="text-indent:2em;">[来源：<a class="tag term-quote" title="术语" data-stdid="${item.stdId}" data-stdno="${item.stdNo||''}">${item.stdNo||''}</a>]</p>`;
                this.$emit('change', htmlContent);
                // this.$emit('change', { act:'term', ...item })
            },
            searchList() {
                this.query = {
                   pageNum: 1,
                   pageSize: 20
                }
                this.listLemma();
            },

            /**
             * @description 页码组件事件
             * @param {Object}  data
             */
            pageChange(data = {}) {
                this.query.pageNum = data.curPage;
                this.listLemma();
            },

            listLemma() {
                this.loading = true;
                var condition = {
                    ...this.query
                }
                if(this.searchKey) {
                    condition.lemEntry = this.searchKey;
                }
                lemmaList(condition).then(res => {
                    if(res.code === 200) {
                        this.total = res.total;
                        this.listData = res.rows.map(item => {
                            return {
                                lemEntry: item.lemEntry,
                                lemEntryen: item.lemEntryen,
                                lemDescription: item.lemDescription,
                                lemNo: item.lemNo,
                                lemUuid: item.lemUuid,
                                stdCaption: item.stdCaption,
                                stdId: item.stdNo,
                                stdNo: item.stdId,
                            }
                        })
                    }
                    this.loading = false;
                })
            },
        },
        created() {
            this.listLemma();
        }
    }
</script>

<style lang="scss" scoped>
    .quote-term-container{
        height: 100%;
        .search{
            padding: 5px 10px;
        }
        .datas{
            overflow: auto;
            height: calc(100% - 71px);
            ul{
                list-style-type: none;
                padding:0;
                margin: 0;
                >li{
                    border-bottom: 1px solid #DDD;
                    padding: 5px;
                    margin: 10px;
                    text-align: left;
                    line-height: 1.5;
                    .btns{
                        text-align: right;
                    }
                }
            }
        }
        .pages{
            height: 35px;
            padding: 0 10px;
        }
    }
</style>
