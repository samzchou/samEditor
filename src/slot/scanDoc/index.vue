<template>
    <div class="scan-doc-container">
        <template v-for="(item, idx) in scanSteps">
            <fieldset :key="idx" v-if="finishedScan(item.label) || scanning===item.label">
                <legend>
                    <span> {{item.desc}}{{finishedScan(item.label) ? '[结果]' : ''}}</span>
                </legend>
                <div class="scan-contont">
                    <div class="scan-icon" v-if="scanning===item.label && !finishedScan(item.label)">
                        <scaner :text="scanText" />
                    </div>
                    <div class="result">
                        <span style="color: #45d73b;" v-if="!item.lists.length">
                            <i class="el-icon-loading" /> {{scanMsg}}
                        </span>
                        <ul v-else>
                            <li v-for="(result, index) in item.lists" :key="index" :title="result.msg">
                                <span>{{index+1}}. {{result.msg}}</span>
                                <span>
                                    <el-button type="text" icon="iconfont icon-Check" @click="ignore(result)">忽略</el-button>
                                    <el-button type="text" icon="iconfont icon-bianji" @click="valiadteUpdate(result)">立即修改</el-button>
                                </span>
                            </li>
                            <p>
                                <el-button type="text" icon="el-icon-more">更多内容...</el-button>
                                <el-button type="text" icon="el-icon-download">导出报告</el-button>
                            </p>
                        </ul>
                    </div>
                </div>
            </fieldset>
        </template>
    </div>
</template>

<script>
    import scaner from "../scaner/index.vue";
    import $bus from "@/utils/bus";
    // 全局方法
    import $samGlobal from '@/utils/global';
    export default {
        name: 'scan-doc',
        components: {
            scaner
        },
        props: {
            data: Object
        },
        watch: {
            data: {
                handler(obj) {
                    this.clearScan();
                    // console.log('this.scanSteps=>', this.scanSteps)
                },
                deep: true,
                immediate: true
            }
        },
        data() {
            return {
                scanText: '0%',
                scanMsg: '正在扫描中，请等待扫描结果...',
                timeHandler: null,
                scanning: '',
                scanSteps: [],
                msgList: [],
                checked: []
            }
        },
        methods: {
            ignore(item) {
                this.$message.success('已忽略！')
            },
            valiadteUpdate(item) {
                $bus.$emit('valiadteUpdate', item);
            },
            clearScan() {
                this.scanning = 'format';
                this.checked = [];
                this.msgList = [];
                this.scanSteps = [
                    {
                        label: 'format',
                        desc: '格式扫描',
                        lists: []
                    },
                    {
                        label: 'dms',
                        desc: '数据扫描',
                        lists: []
                    },
                    {
                        label: 'data',
                        desc: '技术扫描',
                        lists: []
                    },
                ];
            },
            finishedScan(label="") {
                if (this.checked.length) {
                    let index = _.findIndex(this.checked, { label:label });
                    return !!~index;
                }
                return false;
            },
            startScan(step=0) {
                if(step < 3) {
                    this.scanning = this.scanSteps[step]['label'];
                    if (step === 1) {
                        this.scanDms();
                    } else if (step === 2) {
                        this.scanData();
                    }
                }
            },
            scanData() {
                this.msgList = [];
                var exam = [
                    { msg:'标准名称中不应包含“标准”字样!', id:""},
                    { msg:'前言中“为进一步明确润申公司各岗位工作责任与权限，工作内容与要求，以及检查与考核办法，确保安全、经济、健康、有序经营，根据公司实际情况，经董事会批准，制订本标准。”该信息应进入引言!', id:""},
                    { msg:'删除前言中“本标准自发布之日起实施。”字样!', id:""},
                    { msg:'删除前言中“本标准由润申公司负责解释。”字样！', id:""},
                    { msg:'删除前言中“本标准所代替标准的历次版本发布情况：---无”字样！', id:""},
                    { msg:'术语和定义中缺少“本文件没有需要界定和术语和定义。”字样！', id:""},
                ]
                setTimeout(() => {
                    exam.forEach(item => {
                        this.msgList.push(item.msg);
                    });
                    this.putMsg(exam, 2);
                }, 1500)
            },
            scanDms() {
                this.msgList = [];
                var exam = [
                    { msg:'在标准的前言中起草单位信息和封面发布单位信息不一致!', id:""},
                    { msg:'在标准的前言中归口单位信息和封面发布单位信息不一致！', id:""},
                    { msg:'”本标准第4章同一层次上的各条，有无标题应一致！', id:""},
                ]
                setTimeout(() => {
                    exam.forEach(item => {
                        this.msgList.push(item.msg);
                    });
                    this.putMsg(exam, 1);
                }, 1500)
            },
            putMsg(result, step=0) {
                const showMsg = index => {
                    if (index >= this.msgList.length - 1) {
                        this.checked.push(this.scanSteps[step]);
                        this.scanSteps[step]['lists'] = result;
                        this.startScan(step+1);
                    } else {
                        setTimeout(() => {
                            this.scanMsg = this.msgList[index];
                            var nextIndex = index + 1;
                            this.scanText = Math.round(nextIndex / this.msgList.length) * 100 + '%';
                            showMsg(nextIndex);
                        }, $samGlobal.randomNumber(100, 300));
                    }
                }
                showMsg(0);
            },
            endScan() {
                if (this.timeHandler) {
                    clearInterval(this.timeHandler);
                    this.timeHandler = null;
                }
            }
        },
        mounted() {
            this.startScan(0);
            $bus.$on('scanning', data => {
                if (data.title) {
                    this.msgList.push(data.title);
                } else if (data.result){
                    this.putMsg(data.result, 0)
                }
            })
        },
        beforeDestroy() {
            this.clearScan();
            this.endScan();
        }
    }
</script>

<style lang="scss" scoped>
    .scan-doc-container{
        padding:10px 15px;
        fieldset {
            margin-bottom: 15px;
            legend{
                font-weight: bold;
            }
            .scan-contont{
                display: flex;
                .scan-icon{
                    width: 75px;
                    height: 100px;
                    margin-right: 10px;
                }
                .result{
                    flex:1;
                    >ul {
                        padding: 0 10px;
                        margin:0;
                        >li{
                            border-bottom: 1px solid #DDD;
                            line-height: 25px;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            >span {
                                overflow: hidden;
                                white-space: nowrap;
                                text-overflow: ellipsis;
                                &:first-child{
                                    flex:1;
                                    max-width: 480px;
                                    overflow: hidden;
                                    white-space: nowrap;
                                    text-overflow: ellipsis;
                                }
                                &:last-child{
                                    flex: 0 0 140px;
                                    text-align: right;
                                }
                            }
                            &:last-child{
                                border:0;
                            }
                        }
                    }
                }
            }
        }

    }
</style>
