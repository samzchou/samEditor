<template>
    <div class="doc-owner-cmp">
        <div class="content">
            <h3>
                <span>{{ owenerLabel }}</span>
            </h3>
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
    export default {
        name: "doc-owner",
        computed: {
            owenerLabel() {
                return '我的文档';
            }
        },
        data() {
            return {
                types: [{
                    label:'我的文档',
                    icon: 'icon-tasklist',
                    value: 'stdType'
                },{
                    label:'咨询专家',
                    icon: 'icon-dicengjiagou',
                    value: 'stdContent'
                },{
                    label:'标准社区',
                    icon: 'icon-fenbushi',
                    value: 'stdProduct'
                },{
                    label:'按操作手册',
                    icon: 'icon-hetong',
                    value: 'stdControl'
                },{
                    label:'按标书合同',
                    icon: 'icon-app',
                    value: 'stdApp'
                }],
            }
        },
        methods: {
            selectType() {

            }
        }
    }
</script>

<style lang="scss" scoped>
    .doc-owner-cmp{

    }
</style>
