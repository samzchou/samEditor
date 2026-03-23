<template>
    <ul class="comparise-outline-container">
        <li v-for="(item, idx) in data" :key="idx">
            <p @click.stop.prevent="changeEvent(item)" v-html="item.sourceItem.label"></p>
            <div class="comparise">
                <!-- item.comparised.length -->
                <ul v-if="isNotEmpty(item.comparised)">
                    <template v-for="(comparised, index) in item.comparised">
                        <li :key="index" v-if="showIsEmpty(comparised.html)">
                            <p class="similar">
                                <span>第[{{index+1}}]段：</span>
                                <span v-if="comparised.html" title="点击定位" v-html="comparised.html.similar"></span>
                                <!-- <span v-else>无内容</span> -->
                                <el-tooltip v-if="thresholdValue && thresholdValue!=comparised.percent" class="threshold-value" :class="{'low':checkLow(comparised.html.percent)}" :content="checkLow(comparised.html.percent)?`低于比对阙值${thresholdValue}%`:`高于比对阙值${thresholdValue}%`" placement="top-end">
                                    <span :class="checkLow(comparised.html.percent)?'el-icon-download':'el-icon-upload2'">{{thresholdValue}}%</span>
                                </el-tooltip>
                            </p>
                            <p class="node" v-if="comparised.html" title="点击定位" v-html="comparised.html.htmlContent" @click.stop.prevent="eventNode($event, item, comparised)"></p>
                            <!-- <p class="node">无内容...</p> -->
                        </li>
                    </template>
                </ul>
                <!-- 没有可比对的差异内容！ -->
                <p v-else class="empty">{{ emptyText(item.comparised) }}</p>
            </div>
        </li>
    </ul>
</template>

<script>
    export default {
        name: 'comparise-outline',
        props: {
            data:{
                type: Array,
                default: () => {
                    return [];
                }
            },
            thresholdValue: {
                type: Number,
                default: () => {
                    return 0;
                }
            },
            hideEmpty: Boolean
        },
        data() {
            return {

            }
        },
        methods: {
            isNotEmpty(arr=[]) {
                if (this.hideEmpty && arr.length) {
                    for(let item of arr) {
                        if (item.html.percent) {
                            return true;
                        }
                    }
                    return false;
                }
                return true;
            },
            emptyText(arr) {
                let text = '没有可比对的差异内容！'; // 原文档和比对文档没有可比对的具体内容！
                /* const notEmpty = this.isNotEmpty(arr);
                if (!notEmpty) {
                    for(let item of arr) {
                        if (!item.html.isEmpty) {
                            return '比对内容一致，无差异！';
                        }
                    }
                } */
                return text;
            },
            showIsEmpty(obj) {
                if (this.hideEmpty && !obj.percent) {
                    return false;
                }
                return true;
            },

            checkLow(percent) {
                return percent < this.thresholdValue;
            },
            changeEvent(item) {
                this.$emit('change', {act:'outline', item})
            },
            eventNode(evt, item, comparised) {
                this.$emit('change', { act:'node', node:evt.target, item, comparised });
            }
        }
    }
</script>

<style lang="scss" scoped>
    .comparise-outline-container {
        padding: 0;
        list-style-type: none;
        >li{
            padding: 5px 10px;
            margin-bottom: 15px;
            // border-bottom: 1px solid #EEE;
            >p{
                cursor: pointer;
                &:hover{
                    color:#409EFF;
                }
            }
            .label{
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .comparise {
                font-size:12px;
                // padding-left:10px;
                border: 1px solid #DDD;
                // color: #CCC;
                // padding: 1px;
                .empty{
                   padding: 5px;
                    color:#DDD;
                }

                .similar{
                    padding: 5px;
                    line-height: 2;
                    background-color: #EEE;
                    // border-bottom: 1px solid #EEE;
                    .threshold-value{
                        float: right;
                        color: #20b916;
                        margin-top: 5px;
                        &.low{
                            color: #ff8e01;
                        }
                    }
                }
                .node{
                    padding: 5px;
                    color:#777;
                    line-height: 1.65;
                    ::v-deep >del{
                        background-color: #eaf2c2;
                        color: #406619;
                        text-decoration: none;
                        cursor:pointer;
                    }
                    ::v-deep >ins{
                        background-color: #fadad7;
                        color: #b30000;
                        text-decoration: none;
                        cursor:pointer;
                    }
                }
            }
        }
    }
</style>
