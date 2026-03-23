<template>
    <div class="table-tag-container">
        <template v-if="tableNode !== null">
            <el-form size="mini" :model="dataForm" :rules="rules" ref="ruleForm" label-position="top">
                <el-form-item label="标签名称(key)" prop="key">
                    <el-input v-model="dataForm.key"></el-input>
                </el-form-item>
                <el-form-item label="数据接口(api)" prop="api">
                    <el-input v-model="dataForm.api"></el-input>
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
                    this.tableNode = null;
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
                tableNode: null,
                dataForm: {
                    key: '',
                    api: ''
                },
                rules: {
                    key: [{ validator: checkEn, trigger: 'blur' }],
                    api: [{ validator: checkEn, trigger: 'blur' }],
                }
            }
        },
        methods: {
            setData() {
                console.log('table-tag', this.data)
                this.tableNode = this.getParentBySelector(this.data.currNode, 'table');
                console.log('tableNode', this.tableNode);
                if (!this.tableNode) {
                    this.$alert('请在表格元素上进行操作！');
                    return;
                }
                this.$set(this.dataForm, 'key', this.tableNode.dataset.key || '');
                this.$set(this.dataForm, 'api', this.tableNode.dataset.api || '');
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
                return getpNode(node);
            },
            submitFrom(flag) {
                if (flag) {
                    this.$refs['ruleForm'].validate((valid) => {
                        if (valid) {
                            this.$emit('change', { act:'addTableTag', data:this.dataForm, tableNode:this.tableNode  })
                        }
                    })
                } else {
                    this.$emit('change', { act:'addTableTag' })
                }
                
            }
        }
    }
</script>

<style lang="scss" scoped>
    .table-tag-container{
        padding: 10px 20px;
    }
</style>
