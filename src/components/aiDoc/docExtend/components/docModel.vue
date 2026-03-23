<template>
    <div class="doc-model-cmp">
        <div class="content">
            <h3>
                <span>{{ modelLabel }}</span>
            </h3>
            <div class="model-list">
                <component ref="modelDoc" :is="createCmp" v-on="$listeners" />
            </div>
        </div>
        <div class="t-tabs">
            <ul>
                <li v-for="(item, idx) in types" :key="idx" :class="{'active':currType===item.value}" @click.stop.prevent="selectType(item)">
                    <el-tooltip :content="item.label" placement="left">
                        <i class="iconfont" :class="item.icon" />
                    </el-tooltip>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
    import * as createDoc from './create/index.js';
    import $global from '@/utils/global.js';

    export default {
        name: "doc-model",
        computed: {
            // 按标准类型
            modelLabel() {
                let modelType = _.find(this.types, { value:this.currType });
                return modelType ? modelType.label : '';
            },
            createCmp() {
                return createDoc[this.currType];
            }
        },
        data() {
            return {
                currType: 'stdType',
                types: [{
                    label:'按标准类型',
                    icon: 'icon-tasklist',
                    value: 'stdType'
                },{
                    label:'按主题内容',
                    icon: 'icon-dicengjiagou',
                    value: 'stdContent'
                }/*,{
                    label:'按产品分类',
                    icon: 'icon-fenbushi',
                    value: 'stdProduct'
                } ,{
                    label:'操作手册',
                    icon: 'icon-hetong',
                    value: 'stdControl'
                },{
                    label:'标书合同',
                    icon: 'icon-app',
                    value: 'stdContract'
                } */,{
                    label:'AI智能文档',
                    icon: 'icon-AIrengongzhineng',
                    value: 'stdAi'
                }],
                templateList: [],
                currOutline: null,
            }
        },
        methods: {
            // 选择模板类型
            selectType(item = {}) {
                console.log('selectType===>', item);
                if (item.value === 'stdAi') {
                    this.$emit('change', {act:'model',type:'docAi'})
                    return;
                }
                if (this.currType !== item.value) {
                    this.currType = item.value;
                }
            },

            /* async _initData() {
                const res = await listContentTemplate({});
                if (res && res.data) {
                    this.templateList = res.rows.map(item => {
                        item = _.omit(item, ['createTime','createUser','delFlag','deleteTime','deleteUser','isAsc','orderByColumn','pageNum','pageSize','params','searchValue','searchValueArray','updateTime','updateUser'])
                        return item;
                    })
                }
            } */
        },
        created() {
            // this._initData();
        }
    }
</script>

<style lang="scss" scoped>
    .doc-model-cmp{
        height: 100%;
        display: flex;
        .t-tabs{
            flex: 0 0 30px;
            border-left: 1px solid rgba(0,0,0,.08);
            background-color: rgba(0, 0, 0, .02);
            >ul {
                >li {
                    text-align: center;
                    padding: 7px 0;
                    cursor: pointer;
                    i{
                        font-size: 1.65em;
                        color: #9f9f9f;
                    }
                    &:hover{
                        background-color: rgba(0,0,0,.6);
                        >i{
                            color: #FFF;
                        }
                    }
                    &.active{
                        background-color: #a9c4ff;
                        >i{
                            color: #FFF;
                        }
                    }
                }
            }
        }
        .content{
            flex:1;
            >h3{
                font-size: 14px;
                padding: 15px;
                border-bottom: 1px solid rgba(0,0,0,.05);
                >span{
                    position: relative;
                    color: #1a46c7;
                    &:before{
                        position: absolute;
                        content: "";
                        bottom: -16px;
                        left: -5px;
                        right: -5px;
                        height: 2px;
                        background-color: #003aff;
                    }
                }
            }
            .model-list{
                overflow: hidden;
                height: calc(100% - 50px);
            }
        }
    }
</style>
