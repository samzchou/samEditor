<template>
    <div class="quote-container">
        <div class="lists">
            <div class="search">
                <el-input size="mini" placeholder="关键字检索：请输入标准编号或名称" v-model="searchKey" clearable @keyup.native.enter="searchList">
                    <el-button slot="append" icon="el-icon-search" @click.stop.prevent="searchList" />
                </el-input>
            </div>
            <div class="datas" v-loading="loading">
                <el-table size="mini" :data="quoteList" stripe @row-click="rowClick" @row-contextmenu="rowClick" :max-height="500" style="width: 100%;">
                    <el-table-column prop="stdNo" label="标准编号" width="250" show-overflow-tooltip />
                    <el-table-column prop="label" label="标准名称" show-overflow-tooltip />
                </el-table>
            </div>
        </div>
        <div class="pages">
            <el-pagination small background layout="prev, pager, next" :total="total" @size-change="sizeChange" @current-change="currentChange" />
        </div>

        <div class="quote-win" v-show="showContextmenu" :style="setPostion" v-Clickoutside="handleCloseWin">
            <ul>
                <li @click.stop.prevent="putQuote(0)">{{qText[0]}}</li>
                <li @click.stop.prevent="putQuote(1)">{{qText[1]}}</li>
            </ul>
        </div>
    </div>
</template>

<script>
    import $samGlobal from "@/utils/global";
    import { quoteSearchStandard } from '@/api/editor';
    import Clickoutside from 'element-ui/lib/utils/clickoutside';

    export default {
        name: 'quote-standard',
        directives: {
            Clickoutside
        },
        props: {
            keyword: String,
            apiUrl: {
                type: String,
                default:() => {
                    return process.env.VUE_APP_EDITOR_URL;
                }
            },
            setting: {
                type: Object,
                default:() => {
                    return {};
                }
            }
        },
        computed:{
            setPostion(){
                return {
                    top: this.position.top + "px",
                    left: this.position.left + "px",
                }
            }
        },
        watch: {
            keyword(val) {
                this.searchKey = val;
            }
        },
        data() {
            return {
                tabIndex: '0',
                tabArr: [{label:'题录信息', icon:'el-icon-document-copy'}],
                loading: false,
                searchKey: '',
                maxHeight: 400,
                quoteList: [],
                total: 0,
                query: {
                    pageNo: 1,
                    pageSize: 20
                },
                currItem: null,
                showContextmenu: false,
                position: {
                    top: 0,
                    left: 0
                },
                qText: ['直接引用','不带年代号引用'],
            }
        },
        methods: {
            putQuote(type) {
                var stdKindObj = {"1100":1, "1200":2, "6":3, "1500":4, "1400":4 };
                var uuid = $samGlobal.guid();
                var stdKind = this.currItem.stdKind;
                var index = stdKind ? stdKindObj[String(stdKind)] || 1000 : 1000;
                // 如果是国标强制性
                if (index === 1 && !this.currItem.stdNo.match(/\/T/)) {
                    index = 0;
                }

                var str = `${this.currItem.stdNo}`;
                if(type) {
                    let strSplit = str.match(/\-/i) !== null ? str.split("-") : str.split("—");
                    str = strSplit[0];
                }
                if (this.setting.quoteStdName) {
                    str += ` ${this.currItem.label}`;
                }
                
                var labelStr = `<a contenteditable="false" class="quote tag" data-tag="tag" data-title="${this.currItem.label}" id="${uuid}" title="引用标准" data-index="${index}" data-stdkind="${stdKind}" data-stdid="${this.currItem.stdId}" data-stdno="${this.currItem.stdNo}">${str}&#xFEFF</a>&#8203`;
                this.$emit('change', labelStr);
            },
            rowClick(row, column, event) {
                this.currItem = row;
                let rect = event.target.getBoundingClientRect();
                this.position = {
                    top: rect.top + 20,
                    left: rect.left
                }
                this.showContextmenu = true;
                event.stopPropagation();
                event.preventDefault();
                return false;
            },
            handleCloseWin() {
                this.showContextmenu = false;
            },
            searchList() {
                this.query = {
                   pageNo: 1,
                   pageSize: 20
                }
                this.getQuoteList();
            },
            sizeChange(size) {
                this.query.pageSize = size;
                this.query.pageNo = 1;
                this.getQuoteList();
            },
            currentChange(page) {
                this.query.pageNo = page;
                this.getQuoteList();
            },
            // 获取题录信息列表
            getQuoteList() {
                const editorConfig = $samGlobal.getTinymceConfig();
                if (editorConfig && editorConfig.quoteLabel) {
                    this.qText = editorConfig.quoteLabel;
                }

                this.loading = true;
                const condition = _.merge({
                    "orderBy": "create_time",
                    "orderType": "desc",
                    "phaseCode": "",
                    "searchValue": this.searchKey,
                    "stdKind": 0
                }, this.query);
                quoteSearchStandard(condition, editorConfig.editorURL||process.env.VUE_APP_EDITOR_URL).then(res => {
                    if(res.code === 200) {
                        this.total = res.data.total;
						console.log('res.data.rows===>', res.data.rows)
                        this.quoteList = res.data.rows.map(item => {
                            return {
                                label: item.stdCaption,
                                stdId: item.stdNo,              // stdId与stdNo互换下
                                stdNo: item.stdId,
                                stdKind: item.stdKind,
                                date: item.stdPublishdate
                            }
                        })
                    }
                    this.loading = false;
                })
            }
        },
        created() {
            this.getQuoteList();
        }
    }
</script>

<style lang="scss" scoped>
    .quote-container{
        height: 100%;
        padding-top:5px;
        position: relative;
        .lists{
            height: calc(100% - 36px);
            background-color: #FFF;
            .search{
                padding: 5px 10px;
                border-bottom: 1px solid #EEE;
            }
            .datas{
                overflow: auto;
                height: calc(100% - 40px);
            }
        }
        .pages{
            padding: 5px 0;
        }
        .quote-win{
            position: fixed;
            background-color: #fff;
            z-index: 1000;
            border: 1px solid #ddd;
            min-height: 50px;
            &:before {
                position: absolute;
                left: 15px;
                top: -14px;
                border: 7px solid transparent;
                border-bottom-color: #ddd;
                content: "";
            }

            &:after {
                position: absolute;
                left: 17px;
                top: -10px;
                border: 5px solid transparent;
                border-bottom-color:  #FFF;
                content: "";
            }
            >ul{
                overflow: hidden;
                >li{
                    border-bottom: 1px solid #eee;
                    padding: 10px;
                    color: #409eff;
                    cursor: pointer;
                    font-size: 12px;
                }
            }
        }
    }
</style>
