<template>
    <div class="dms-container">
        <el-select v-if="[1200].includes(data.pageData.stdKind)" size="small" v-model="value.key" clearable style="width:100%" @change="changeValue">
    		<el-option v-for="(v,idx) in dataList" :key="idx" :value="v.value" :label="v.label">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span>{{v.label}}</span>
                    <span v-if="data.pageData.stdKind===1500">{{v.value}}</span>
                    <span v-else><img height="16" :src="industryImg(v.value)" /></span>
                </div>
            </el-option>
    	</el-select>
        <el-select v-else-if="[1500].includes(data.pageData.stdKind)" size="small" v-model="value.key" clearable  placeholder="请输入关键词"
            filterable remote
            :remote-method="listOrganization"
            style="width:100%" @change="changeValue">
    		<el-option v-for="(v,idx) in dataList" :key="idx" :value="v.value" :label="v.label">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span>{{v.label}}</span>
                    <span v-if="data.pageData.stdKind===1500">{{v.value}}</span>
                    <span v-else><img height="16" :src="industryImg(v.value)" /></span>
                </div>
            </el-option>
    	</el-select>
        <treeselect v-else size="mini" :options="dataList" v-model="value.key" :normalizer="normalizerDistrict" placeholder="请选择..." @select="selectedDistrict($event)" />
    </div>
</template>

<script>
    import $samGlobal from "@/utils/global";
    import { baseData, getAllIndustryList, getOrganizationList } from '@/api/dms';
    import Treeselect from "@riophae/vue-treeselect";
    import "@riophae/vue-treeselect/dist/vue-treeselect.css";
    export default {
        name: 'std-dms',
        components:{
            Treeselect
        },
        props: {
            data:Object
        },
        watch: {
            data: {
                handler(obj) {
                    this.setData();
                },
                deep: true,
                immediate: true
            }
        },
        data() {
            return {
                loading: true,
                value: {
                    key: undefined
                },
                dataList: [],
                query: {
                    pageNo:0,
                    pageSize: 30,
                    searchKey: ''
                },
                total: 0,
            }
        },
        methods: {
            setData() {
                this.value.key = this.data.value.key || undefined;
                if (this.data.stdKind) {
                    switch(this.data.stdKind) {
                        // 行业
                        case 1200:
                            this.listIndustry();
                            break;
                        // 团体
                        case 1500:
                            this.listOrganization('', this.value.key);
                            break;
                        // 地方
                        case 6:
                            this.listDistrict();
                            break;
                    }
                }
            },
            industryImg(code) {
                return process.env.VUE_APP_FILE_URL + 'images/industry/' + code + '.png';
            },
            normalizerDistrict(node) {
                if (node.children && !node.children.length) {
                    delete node.children;
                }
                return {
                    id: node.region_code,
                    label: `${node.region_name}(${node.region_code})`,
                    children: node.children
                };
            },
            changeValue() {
                var item = _.find(this.dataList, { value:this.value.key });
                // console.log('changeValue=>', item)
                if (item) {
                    var obj = {
                        key: item.value,
                        desc: item.dept || item.label
                    };
                    if (this.data.pageData.stdKind === 1200) {
                        obj.label = item.label;
                    }
                    // console.log('changeValue=>', obj)
                    this.$emit('change', obj);
                } else{
                    if (this.data.pageData.stdKind === 1500){
                       !this?.value?.key && this.listOrganization()
                    }
                }
            },
            selectedDistrict(node) {
                var obj = {
                    key: node.region_code,
                    desc: node.region_name.replace(/\s/g,'') + '市场监督管理局'
                };
                this.$emit('change', obj);
            },
            // 获取行业列表
            async listIndustry() {
                var editorConfig = $samGlobal.getTinymceConfig();
                var res = await getAllIndustryList({}, editorConfig.dmsSupportApi||'');
                if (res.code === 200) {
                    this.dataList = res.data.map(item => {
                        return {
                            label: item.industryName,
                            value: item.industryCode,
                            dept: item.industrySponsor
                        }
                    })
                }
            },
            async listOrganization(query, codeKw ='') {
                this.loading = true;
                var condition = {
                    "pageNo": this.query.pageNo,
                    "pageSize": this.query.pageSize,
                    "nameKw": query || '',
                    "codeKw": codeKw || ''
                }
                if (this.query.searchKey) {
                    condition.nameKw = this.query.searchKey;
                }
                var editorConfig = $samGlobal.getTinymceConfig();
                var res = await getOrganizationList(condition, editorConfig.dmsSupportApi||'');
                if (res.code === 200) {
                    this.total = res.data.total;
                    this.dataList = res.data.list.map(item => {
                        return {
                            label: item.name,
                            value: item.code
                        }
                    });
                    // console.log('dataList=>',this.dataList)
                }
                this.loading = false;
            },
            async listDistrict() {
                var condition = {
                   "request_id":"123",
                   "operation":"GET_DMS_STD_REGION_CODE",
                   "requester":"EDITOR",
                   "only": true
                }
                var editorConfig = $samGlobal.getTinymceConfig();
                var res = await baseData(condition, editorConfig.dmsApi||'');
                if (res.error_code === 200 && res.data) {
                    this.dataList = res.data;
                }
            },
        }
    }
</script>

<style lang="scss" scoped>
    .dms-container{
        padding: 10px;
        ::v-deep .el-select{
            .fls{
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
        }
    }
</style>
