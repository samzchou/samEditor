<template>
    <div class="quote-term-container">
        <div class="search">
			<span class="tag">
				<treeselect size="mini" :options="tagTree" v-model="tagData.tagTreeId" :normalizer="normalizerTree" placeholder="请选择标签类型..." @select="selectedTree($event)" />
				<el-button size="mini" type="primary" @click.stop.prevent="$emit('change', {act:'addTag'})">新建</el-button>
			</span>

            <el-input size="mini" placeholder="关键字检索" v-model="searchKey" clearable @keyup.native.enter="searchList">
                <el-button slot="append" icon="el-icon-search" @click.stop.prevent="searchList" />
            </el-input>
        </div>
        <div class="datas" v-loading="loading">
            <ul>
                <li v-for="(item,idx) in listData" :key="idx">
                    <p>中文名：{{item.lemEntry}}</p>
                    <p>英文名：{{item.lemEntryen}}</p>
                    <p>解释：{{item.lemDescription}}</p>
                    <p class="btns">
                        <el-button size="small" type="text" icon="el-icon-s-comment" @click.stop.prevent="putTerm(item)">引用</el-button>
                    </p>
                </li>
            </ul>
        </div>
        <div class="pages">
            <el-pagination small background layout="prev, pager, next" :total="total" @size-change="sizeChange" @current-change="currentChange" />
        </div>
    </div>
</template>

<script>
	import Treeselect from "@riophae/vue-treeselect";
	import "@riophae/vue-treeselect/dist/vue-treeselect.css";
    import { lemmaList } from '@/api/editor';
    // 全局方法
    import $samGlobal from '@/utils/global';
    export default {
        name: 'tag-term',
		components:{
			Treeselect
		},
        props: {
			data: {
				type: Object,
				default: () => {
					return {};
				}
			},
			tagTree: {
				type: Array,
				default: () => {
					return [];
				}
			}
        },
        watch: {
            data: {
                handler(obj) {
                    // 定义标签树ID
                    this.tagData.tagTreeId = obj.tagTreeId;
                },
                deep: true,
                immediate: true
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
				tagData: {
					tagTreeId: undefined
				}
            }
        },
        methods: {
			selectedTree(evt) {
				console.log('selectedTree=>', evt);
			},
			/**
			 * @description 序列化标签树
			 * @param {Object} node
			 */
			normalizerTree(node={}) {
				if (node.children && !node.children.length) {
					delete node.children;
				}
				return {
					id: node.tagTreeId,
					label: node.tagType + "(" + node.tagName + ")",
					children: node.children
				};
			},
			/**
			 * @description 置入标签内容
			 * @param {Object} item
			 */
            putTerm(item={}) {
				var tagId = $samGlobal.guid();
                var htmlContent = `
                    <p style="text-indent:2em;"><span class="term" title="术语" data-tag="term" data-tid="${this.tagData.tagTreeId}" data-id="${tagId}" data-content="${item.lemUuid}" style="font-family: simHei;">${item.lemEntry}</span><span style="font-family: times new roman;font-weight:bold">&nbsp;&nbsp;${item.lemEntryen}</span></p>
                    <p style="text-indent:2em;">${item.lemDescription}</p>
                    <p style="text-indent:2em;">[来源：<a class="term-quote tag" data-stdid="${item.stdId}" data-stdno="${item.stdNo||''}">${item.stdNo||''}</a>]</p>
                `;
                this.$emit('change', {act:'addTerm', htmlContent });
            },
            searchList() {
                this.query = {
                   pageNum: 1,
                   pageSize: 20
                }
                this.listLemma();
            },
            sizeChange(size) {
                this.query.pageSize = size;
                this.query.pageNum = 1;
                this.listLemma();
            },
            currentChange(page) {
                this.query.pageNum = page;
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
			display: flex;
			align-items: center;
			.tag{
				flex: 0 0 200px;
				display: flex;
				margin-right: 10px;
			}
			/* .el-input{
				flex: 0 0 25px;
			} */
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
                    padding: 5px 10px;
                    margin: 10px;
                    text-align: left;
                }
            }
        }
        .pages{
            height: 35px;
        }
    }
</style>
