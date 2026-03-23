<template>
    <div class="td-tag-container">
        <div>
            <p style="padding-bottom:15px">单元格标签一般定义在表头的单元格上，标签名为唯一</p>
        </div>
        <template v-if="tdNode !== null">
            <el-form size="mini" :model="dataForm" :rules="rules" ref="ruleForm" label-position="top">
                <el-form-item label="标签名称(key)" prop="key">
                    <el-input v-model="dataForm.key"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" icon="el-icon-check" @click="submitFrom(true)">保存配置</el-button>
                    <el-button icon="el-icon-close" @click="submitFrom(false)">取消关闭</el-button>
                </el-form-item>
            </el-form>
        </template>
    </div>
</template>

<script>
    var checkEn = (rule, value, callback) => {
        console.log('rule', rule)
        let reg = new RegExp("[\\u4E00-\\u9FFF]+","g");
        if (!value) {
            return callback(new Error(rule.field + '不能为空！'));
        } else {
            if (reg.test(value)) {
                return callback(new Error(rule.field + '不能包含中文或特殊符号！'));
            }
        }
        callback();
    }
    export default {
        name: 'table-tag',
        props: {
            data: {
                type: Object,
                default: () => {
                    return {};
                }
            }
        },
        watch: {
            data: {
                handler(data) {
                    this.tdNode = null;
                    if(data) {
                        this.setData();
                    }
                },
                immediate: true,
                deep: true
            }
        },
        data() {
            return {
                tdNode: null,
                dataForm: {
                    key: '',
                },
                rules: {
                    key: [{ validator: checkEn, trigger: 'blur' }],
                }
            }
        },
        methods: {
            setData() {
                console.log('table-tag', this.data)
                this.tdNode = this.getParentBySelector(this.data.currNode, 'td');
                console.log('tdNode', this.tdNode);
                if (!this.tdNode) {
                    this.$alert('请在单元格元素上进行操作！');
                    return;
                }
                this.$set(this.dataForm, 'key', this.tdNode.dataset.key || '');
            },
            getParentBySelector(node, selectorName=undefined) {
                const getpNode = element => {
                    if(element && element.nodeName !== 'BODY') {
                        //创建父级节点的类数组
                        let pNode = element.parentElement;
                        if(pNode && pNode.nodeName === selectorName.toUpperCase()) {
                            return pNode;
                        } else {
                            return getpNode(pNode);
                        }
                    } else {
                        return null;
                    }
                }
                return node.nodeName === 'TD' ? node : getpNode(node);
            },
            submitFrom(flag) {
                if (flag) {
                    this.$refs['ruleForm'].validate((valid) => {
                        if (valid) {
                            this.$emit('change', { act:'addTdTag', data:this.dataForm, tdNode:this.tdNode })
                        }
                    })
                } else {
                    this.$emit('change', { act:'addTdTag' })
                }
            }
        }
    }
</script>

<style lang="scss" scoped>
    .td-tag-container{
        padding: 10px 20px;
    }
</style>
