<template>
    <div class="ics-num-container">
        <div class="main">
            <el-tabs v-model="activeName" type="card">
                <el-tab-pane v-for="(item,idx) in tabsList" :key="idx" :label="item.label" :name="item.value" lazy />
            </el-tabs>
            <div class="lists" v-if="['ics','ccs'].includes(activeName)" v-loading="loading" element-loading-text="加载中...">
                <div class="search-form">
                    <el-input size="mini" placeholder="输入关键字进行过滤" v-model="filterText" clearable />
                </div>
                <div class="datas">
                    <el-scrollbar class="scrollbar ver">
                        <el-tree :data="treeData" :props="defaultProps" @node-click="handleNodeClick" :expand-on-click-node="false" default-expand-all :filter-node-method="filterNode" ref="icstree" />
                    </el-scrollbar>
                </div>
            </div>
            <div v-else class="lists">
                <div class="data-map">
                    <el-scrollbar class="scrollbar ver">
                        <el-tree :data="dataMap" :props="defaultProps" :expand-on-click-node="false" @node-click="handleNodeClick" default-expand-all />
                    </el-scrollbar>
                </div>
            </div>
        </div>
        <div class="right">
            <p>ICS: {{dataValue.ics}}</p>
            <p>CCS: {{dataValue.ccs}}</p>
        </div>
    </div>
</template>

<script>
    import { baseData } from '@/api/dms';
    import $samGlobal from "@/utils/global";
    export default {
        name: 'ics-number',
        props: {
            data: {
                type: Object,
                default:() =>{
                    return {
                        isIcs: true
                    };
                }
            },
            visible:{
                type: Boolean,
                default: false
            }
        },
        computed: {
            treeData() {
                return this.activeName==='ics' ? this.icsList : this.ccsList;
            },
            dataMap() {
                let mapList = this.activeName==='ics-ccs' ? this.icsMap : this.ccsMap;
                return mapList;
            }
        },
        watch: {
            data: {
                handler(obj) {
                    if(!_.isEmpty(obj)) {
                        this.activeName = obj.isIcs ? 'ics' : 'ccs';
                        this.dataValue = obj.value || {};
                    }
                },
                deep: true,
                immediate: true
            },
            filterText(val) {
                this.$refs.icstree.filter(val);
            },
            mapData: {
                handler(data) {
                    if(['ics','ccs'].includes(this.activeName) && !_.isEmpty(data)) {
                        let type = this.activeName === 'ics' ? 2 : 1;
                        let dataMap = {
                            'category_name_chn': data.name,
                            'children':[]
                        }
                        this.getIcsToCcsMap(data.code, type, dataMap);
                    }
                },
                deep: true,
                immediate: true
            },
            visible:{
                handler(val){
                    console.log('visible=>', val);
                    val && this.listIcsData();
                },
                immediate: true
            }
        },
        data() {
            return {
                loading: true,
                activeName: 'ics',
                tabsList: [
                    { label: 'ICS', value:'ics'},
                    { label: 'ICS=>CCS', value:'ics-ccs'},
                    { label: 'CCS', value:'ccs'},
                    { label: 'CCS=>ICS', value:'ccs-ics'},
                ],
                filterText: '',
                defaultProps: {
                    children: 'children',
                    label: 'category_name_chn'
                },
                dataValue: {
                    ics:'',
                    ccs:''
                },
                icsList: [],
                ccsList: [],
                mapData: {},
                icsMap: [],
                ccsMap: []
            };
        },

        methods: {
            handleNodeClick(data, node) {
                if (node.level > 1 && data.oa_category_name!=='暂无下级分类') {
                    var number = data.category_name_chn.split(" ");
                    if(['ics','ccs-ics'].includes(this.activeName)) {
                        this.dataValue.ics = number[0];
                    } else {
                        this.dataValue.ccs = number[0];
                    }

                    if(['ics','ccs'].includes(this.activeName)) {
                        this.mapData = {
                            type: this.activeName === 'ics' ? 'icsMap' : 'ccsMap',
                            code: number[0],
                            name:data.category_name_chn
                        };
                    }
                    this.$emit('change', this.dataValue);
               }
            },
            filterNode(value, data) {
                if (!value) return true;
                return data.category_name_chn.indexOf(value) !== -1;
            },

            async getIcsToCcsMap(code='', type=2, dataMap={}) {
                const conditon = {
                    "request_id":"123",
                    "operation": 'GET_DMS_STD_CATEGORY_MAPPING',
                    "mapping_type": type,                                // 1:CCS->ICS 2:ICS->CCS
                    "src_category_code": code,
                    "requester": 'EDITOR',
                    "page_no":1,
                    "page_size":1000,
                    "only":true
                }
                const editorConfig = $samGlobal.getTinymceConfig();
                const res = await baseData(conditon, editorConfig.dmsApi||'');
                // console.log('getIcsToCcsMap=>', res);
                if (res.error_code === 200) {
                    dataMap.children = res.data.map(item => {
                        return {
                            "target_category_code": item.target_category_code,
                            "category_name_chn": item.target_category_name
                        }
                    });
                    this[this.mapData.type] = [dataMap];
                }
            },

            /**
             * @description 获取ICS|CCS数据
             */
            async listIcsData() {
                this.loading = true;
                let editorConfig = $samGlobal.getTinymceConfig();
                const conditon = {
                    "std_type":1100,
                    "root_category_name": "ICS分类",
                    "root_oa_category_no": 220,
                    "category_method": 3,
                    "operation": "GET_DMS_STD_CATEGORY",
                }
                let res = await baseData(conditon, editorConfig.dmsApi||'');
                if (res.error_code === 200 && res.data) {
                    this.icsList = res.data;
                }
                console.log('icsList=>', res);
                const conditonCcs = {
                    "std_type":1100,
                    "root_category_name": "中标分类",
                    "root_oa_category_no": 1,
                    "category_method": 1,
                    "operation": "GET_DMS_STD_CATEGORY",
                }
                res = await baseData(conditonCcs, editorConfig.dmsApi||'');
                if (res.error_code === 200 && res.data) {
                    this.ccsList = res.data;
                }
                this.loading = false;
            }
        },

        /* created() {
            this.listIcsData();
        } */
    }
</script>

<style lang="scss" scoped>
    .ics-num-container{
        height: 100%;
        display:flex;
        overflow: hidden;
        .main{
            flex:1;
            ::v-deep .el-tabs{
                height: 26px;
                .el-tabs__header{
                    margin: 4px 0 0 0 !important;
                    height: 26px;
                    padding: 0;
                    margin: 0;
                    .el-tabs__item{
                        height: 25px;
                        line-height: 25px;
                    }
                }
                .el-tabs__content{

                }
            }
            .lists{
                height: calc(100% - 30px);
                overflow: hidden;
                .search-form{
                    height: 40px;
                    padding: 0 15px;
                    display: flex;
                    align-items: center;
                }
                .datas{
                    height: calc(100% - 40px);
                    overflow: hidden;
                }
                .data-map{
                    height:100%;
                    overflow: hidden;
                }
            }
        }
        .right{
            flex: 0 0 200px;
            border:1px solid #DDD;
            background-color: #ebebeb;
            padding:10px;
        }

    }
</style>
