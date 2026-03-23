<template>
    <div class="stdnumber-container">
        <el-form ref="docForm" size="mini" :model="docForm" :rules="docRules" label-position="top">
            <el-form-item label="标准编号(如GB/T 11.1—2022)" prop="stdNo">
                <div class="fl fc">
                    <el-select v-if="data.pageData && data.pageData.stdKind === 1100" v-model="docForm.stdSign" placeholder="标准代码" style="flex:0 0 170px">
                        <el-option label="GB/T" value="GB/T" />
                        <el-option label="GB" value="GB" />
                    </el-select>
                    <el-input v-else v-model="docForm.stdSign" placeholder="标准代码" :disabled="[1500].includes(data.pageData.stdKind)" clearable style="flex:0 0 170px">
                        <el-select v-if="[1200,6].includes(data.pageData.stdKind)" v-model="mandatory" slot="append" placeholder="请选择" style="width: 70px;padding:0 5px;">
                            <el-option label="强" value=""></el-option>
                            <el-option label="推" value="/T"></el-option>
                        </el-select>
                    </el-input>
                    <el-input v-model="docForm.order" placeholder="顺序号" clearable style="flex:1;margin-left:10px" />
                    <span>—</span>
                    <el-date-picker v-model="docForm.year" type="year" value-format="yyyy" placeholder="年代号" style="flex:0 0 110px" />
                </div>
            </el-form-item>
            <template v-for="(item, idx) in origStdList">
                <el-form-item :key="idx">
                    <div slot="label">
                        <span>代替编号{{idx+1}}</span>
                        <span class="btn el-icon-delete" @click="removeOrigItem(idx)">移除</span>
                    </div>
                    <div class="fl fc">
                        <el-input v-model="item.stdSign" placeholder="标准代码" style="flex:0 0 170px" />
                        <el-input v-model="item.origOrder" placeholder="顺序号" clearable style="flex:1;margin-left:10px" />
                        <span>—</span>
                        <el-date-picker v-model="item.origYear" type="year" value-format="yyyy" placeholder="年代号" style="flex:0 0 110px" />
                    </div>
                </el-form-item>
            </template>
            <p style="text-align: right;">
                <el-button size="mini" type="text" icon="el-icon-plus" @click="addOrigItem">增加代替编号</el-button>
            </p>
        </el-form>
        <p class="error">{{error}}</p>
    </div>
</template>

<script>
    export default {
        name: 'std-number',
        props: {
            data:Object
        },
        watch: {
            data: {
                handler(obj) {
                    console.log('handler obj==>', obj);
                    if (!_.isEmpty(obj)) {
                        this.setDat();
                    }
                },
                immediate: true
            },
            docForm: {
                handler(data) {
                    this.checkStdNo(true);
                },
                deep: true,
                immediate: true
            },
            origStdList: {
                handler(data) {
                    this.checkOrigStdList(true);
                },
                deep: true,
                immediate: true
            },
            'mandatory': {
                handler(val) {
                    console.log(val);
                    if(this.docForm.stdSign && ![1500,1400].includes(this.data.pageData.stdKind)) {
                        var stdSign = this.docForm.stdSign.replace(/[\/T]/g,'') + val;
                        this.docForm.stdSign = stdSign;
                    }
                },
                immediate: true
            }
        },
        data() {
            // 校验标准编号
            var validatorStdNo = (rule, value, callback) => {
                var split = value.split('—');
                if (split.length < 2) {
                    return callback(new Error('编号不规范，应为：代码 顺序号—年代号！'));
                } else if (isNaN(split[1]) || isNaN(Date.parse(split[1]))) {
                    return callback(new Error('标准编号中缺少年代号！'));
                } else {
                    callback();
                }
            };
            var currYear = this.formatDateTime('yyyy', new Date());
            return {
                loading: true,
                targetElement: null,
                mandatory: '/T',
                docForm: {
                    stdNo:"",
                    stdSign: "",
                    order: "",
                    year: currYear
                },
                docRules: {
                    stdNo: [{ required:true, message:'请录入完整标准编号', trigger:'blur' }, { validator:validatorStdNo, trigger:'blur' }],
                },
                origStdList: [],
                error: ""
            }
        },
        methods: {
            checkStdNo(flag=false) {
                this.error = "";
                // var reg = /[\u4E00-\u9FA5\uF900-\uFA2D]|[\u3002|\uff1f|\uff01|\uff0c|\u3001|\uff1b|\uff1a|\u201c|\u201d|\u2018|\u2019|\uff08|\uff09|\u300a|\u300b|\u3008|\u3009|\u3010|\u3011|\u300e|\u300f|\u300c|\u300d|\ufe43|\ufe44|\u3014|\u3015|\u2026|\u2014|\uff5e|\ufe4f|\uffe5]/;
                var reg = /[\u4E00-\u9FA5]/;
                if (!this.docForm.stdSign || reg.test(this.docForm.stdSign)) {
                    this.error = "标准代码必须填写并不能包含任何中文！";
                    return false;
                }
                if (!this.docForm.order || reg.test(this.docForm.order)) { // || /[A-Za-z]/.test(this.docForm.order)
                    this.error = "标准编号顺序号必须填写并不能包含任何中文字符！";
                    return false;
                }
                if (!this.docForm.year) {
                    this.error = "标准编号年代号必须填写！";
                    return false;
                }

                if (this.docForm.order && this.docForm.year) {
                    this.docForm.stdNo = `${this.docForm.order}—${this.docForm.year}`;
                }
                if (flag) {
                    this.checkOrigStdList(false);
                }
                this.$emit('change', this.docForm);
            },
            // 代替编号
            checkOrigStdList(flag=false) {
                var arr = [];
                for(let i=0; i<this.origStdList.length; i++) {
                    var item = this.origStdList[i];
                    // item.stdSign = this.docForm.stdSign;
                    if (item.origOrder && item.origYear) {
                        arr.push(`${item.stdSign} ${item.origOrder}—${item.origYear}`);
                    } else {
                        this.error = "代替标准编号不符合规则！";
                        break;
                        return "";
                    }
                }
                this.docForm.origStdNo = arr.join("、");
                if (flag) {
                    this.checkStdNo(false);
                }
                this.$emit('change', this.docForm);
            },
            /**
             * @description 分析数据
             */
            setDat() {
                let stdReg;
                if (this.data.pageData.stdSign) {
                    this.docForm.stdSign = this.data.pageData.stdSign || "";
                }
                if (this.data.pageData.stdNo) {  
                    let stdNoStr = this.data.pageData.stdNo;
                    let stdNoSplit = stdNoStr.split("—");
                    if (stdNoSplit.length && stdNoSplit.length === 2) {
                        this.docForm.order = stdNoSplit[0] || "";
                        this.docForm.year = stdNoSplit[1] || "";
                    }
                }
                if (this.data.pageData.stdKind === 1400) {
                    this.mandatory = "";
                }

                this.origStdList = [];
                if (this.data.pageData.origStdNo) {
                    stdReg = new RegExp(this.data.pageData.stdSign, 'g');
                    this.data.pageData.origStdNo.split("、").forEach(str => {
                        let reg = new RegExp(str, 'g');
                        let origStdNoSplit = this.data.pageData.origStdNo.replace(stdReg,'').split('—');
                        if (origStdNoSplit.length && origStdNoSplit.length === 2) {
                            this.origStdList.push({
                                stdSign: this.data.pageData.stdSign,
                                origOrder: origStdNoSplit[0].replace(stdReg,'').replace(/\s/g,'') || "",
                                origYear: origStdNoSplit[1] || ""
                            })
                        }
                    });
                }
            },
            addOrigItem() {
                this.origStdList.push({
                    stdSign: '',
					ss: '',
                    origOrder: "",
                    origYear: ""
                })
            },
            removeOrigItem(index) {
                this.origStdList.splice(index, 1);
            },

            formatDateTime(fmt="yyyy-MM-dd hh:mm:ss", time) {
                if (arguments.length === 0 || !time) {
                    return null;
                }
                var date;
                if (typeof time === 'object') {
                    date = time;
                } else {
                    if ((typeof time === 'string') && (/^[0-9]+$/.test(time))) {
                        time = parseInt(time);
                    } else if (typeof time === 'string') {
                        time = time.replace(new RegExp(/-/gm), '/');
                    }
                    if ((typeof time === 'number') && (time.toString().length === 10)) {
                        time = time * 1000;
                    }
                    date = new Date(time);
                }
                var o = {
                    "M+" : date.getMonth()+1,                       // 月份
                    "d+" : date.getDate(),                          // 日
                    "h+" : date.getHours(),                         // 小时
                    "m+" : date.getMinutes(),                       // 分
                    "s+" : date.getSeconds(),                       // 秒
                    "q+" : Math.floor((date.getMonth() + 3) / 3),   // 季度
                    "S"  : date.getMilliseconds()                   // 毫秒
                };
                if(/(y+)/.test(fmt)) {
                    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
                }
                for(var k in o) {
                    if (new RegExp("("+ k +")").test(fmt)) {
                        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
                    }
                }
                return fmt;
            },
            getValue() {
                return this.docForm.stdNo;
            }
        }
    }
</script>

<style lang="scss" scoped>
    .stdnumber-container{
        height: 100%;
        padding: 15px;
        font-size: 12px;
        ::v-deep .el-form{
            .el-form-item__label{
                .btn{
                    margin-left: 20px;
                    cursor: pointer;
                    color: blue;
                }
            }
        }
        .error{
            color: red;
        }
    }
</style>
