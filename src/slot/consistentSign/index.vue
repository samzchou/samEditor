<template>
    <div class="consistent-sign-container">
        <el-form size="small" ref="consistentForm" :mode="dataValue" :rules="rules" label-position="top">
            <el-form-item label="与国际标准一致性程度标识内容" prop="value">
                <el-input type="textarea" :rows="3" v-model="dataValue.value" placeholder="请输入内容" clearable style="width:100%" />
            </el-form-item>
            <el-form-item label="等效性" prop="code">
                <el-select v-model="dataValue.code" style="width:100%">
                    <el-option label="等同(IDT)" value="IDT" />
                    <el-option label="修改(MOD)" value="MOD" />
                    <el-option label="非等效(NEQ)" value="NEQ" />
                </el-select>
            </el-form-item>
        </el-form>
    </div>
</template>

<script>
    export default {
        name: 'doc-edition',
        props: {
            data:{
                type: Object,
                default: () => {
                    return {}
                }
            }
        },
        watch: {
            data: {
                handler(obj) {
                    this.setDat();
                },
                deep: true,
                immediate: true
            },
            dataValue: {
                handler(obj) {
                    // ISO/IEC Directives,Part 2,2018,Principles and rules for the structure and drafting of IOS and ITC ocuments
                    this.valueStr = `${obj.value},${obj.code}`;
                    this.$emit('change', this.valueStr);
                },
                deep: true,
                immediate: true
            }
        },
        data() {
            return {
                dataValue: {
                    value: '',
                    code: ''
                },
                rules: {
                    value: [
                        { required: true, message: '请输入标识内容', trigger: 'blur' },
                    ],
                    code: [
                        { required: true, message: '请选择等效性', trigger: 'change' },
                    ]
                },
                valueStr: ''
            }
        },
        methods: {
            setDat() {
                if (!_.isEmpty(this.data)) {
                    if (this.data.value) {
                        let lastIndex = this.data.value.lastIndexOf(",");
                        if (lastIndex) {
                            this.dataValue = {
                                value: this.data.value.slice(0, lastIndex),
                                code: this.data.value.slice(lastIndex+1, this.data.value.length)
                            };
                        }
                    }
                }
            },
            changeValue() {
                this.$emit('change', this.valueStr);
            },
            submitForm(callBack) {
                this.$refs.consistentForm.validate((valid) => {
                    callBack && callBack(valid)
                });
            }
        }
    }
</script>

<style lang="scss" scoped>
    .consistent-sign-container{
        padding: 10px;
    }
</style>
