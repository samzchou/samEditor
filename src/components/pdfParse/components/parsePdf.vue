<template>
    <div class="parse-pdf-cmp">
        <div class="lists">
            <el-table size="mini" :data="lists" style="width: 100%">
                <el-table-column prop="label" label="文档名称" show-overflow-tooltip></el-table-column>
                <el-table-column prop="fileSize" label="文件大小" width="100">
                    <template slot-scope="scope">{{ formatFileSize(scope.row.fileSize) }}</template>
                </el-table-column>
                <el-table-column label="预计耗时" width="130" align="center">
                    <template slot-scope="scope">
                        <span>{{ formatParseTimes(scope.row.fileSize) }}</span>
                    </template>
                </el-table-column>

                <el-table-column width="70" align="center">
                    <template slot-scope="scope">
                        <el-tooltip content="移除需解析的文档" placement="top">
                            <el-button type="text" icon="el-icon-delete" @click.stop.prevent="removeItem(scope.row, scope.$index)" />
                        </el-tooltip>
                    </template>
                </el-table-column>
            </el-table>
        </div>
        <div class="forms">
            <el-form size="small" :model="ruleForm" ref="ruleForm" label-position="top">
                <el-form-item label="选择模板" prop="template">
                    <el-select v-model="ruleForm.docType" placeholder="Choose Template">
                        <el-option label="标准类型文档(符合GB1.1-2020规范)" :value="0"></el-option>
                        <el-option label="普通文档" :value="1"></el-option>
                        <el-option label="学术论文" :value="2"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="是否加急" prop="urgent">
                    <el-radio-group v-model="ruleForm.isUrgent">
                        <el-radio :label="0">不加急</el-radio>
                        <el-radio :label="1">加急</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="备注说明" prop="remarks">
                    <el-input type="textarea" :rows="4" v-model="ruleForm.remarks"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" icon="el-icon-finished" :disabled="!lists.length" @click.stop.prevent="submitParse">提交解析</el-button>
                    <el-button icon="el-icon-close" @click.stop.prevent="$emit('change', {'act':'close'})">取消退出</el-button>
                </el-form-item>
            </el-form>
        </div>

    </div>
</template>

<script>
    import $global from '@/utils/global.js';
    // 后台Node接口
    import { dbServer } from '@/api/nodeServer.js';

    export default {
        name: 'parse-pdf-cmp',
        inject: ['docSetting'],
        props: {
            data: {
                type: Array,
                default: () => {
					return [];
				}
            }
        },
        watch: {
            data: {
                handler(val) {
                    if (!_.isEmpty(val)) {
                        this.lists = _.cloneDeep(val).filter(o => ['pdf','docx'].includes(o.fileType) );
						if (this.docSetting.isUrgent) {
							this.$set(this.ruleForm, 'isUrgent', 1)
						}
                    }
                },
                immediate: true,
                deep: true,
            }
        },
        data() {
            return {
                lists: [],
                ruleForm: {
                    docType: 0,
                    remarks: '',
                    isUrgent: 0
                }
            }
        },
        methods: {
            formatFileSize(val) {
                return $global.formatFileSize(val);
            },
            formatParseTimes(val) {
                val = Math.round(val/1024/600) * 10;
                return '≥ ' + (val || 1) + '分钟';
            },
            removeItem(item, index) {
                this.$confirm('Sure remove?', 'tips', {
                    confirmButtonText: 'Sure',
                    cancelButtonText: 'Cancel',
                    type: 'warning'
                }).then(() => {
                    this.lists.splice(index, 1);
                }).catch(() => { });
            },
            async submitParse() {
                const id = this.lists.map(o => o.id);
                const params = {
                    "operation": "query",
                    "queryType": 2,
                    "columns": {
                        "needProcess":1,
                        ...this.ruleForm
                        /* "isUrgent": this.ruleForm.isUrgent,
                        "docType":
                        "remarks": this.ruleForm.remarks */
                    },
                    "condition": {
                        id
                    },
                    ..._.pick(this.docSetting, ['server','dbName','tableName']),
                }
                console.log('submitParse===>', params);
                const res = await dbServer(params, this.docSetting.nodeURL);
                if (res && res.success) {
                    this.$message.success('已提交处理解析...');
                    this.$emit('change', { act:'submitParse' });
                }
            }
        }
    }
</script>

<style lang="scss" scoped>
    .parse-pdf-cmp{

        display: flex;
        .lists{
            flex: 0 0 500px;
            padding:20px;
        }
        .forms{
            flex:1;
            padding:20px;
            background-color: #f3f9fb;
            ::v-deep .el-form{
                .el-form-item{
                    .el-form-item__label{
                        padding:0;
                    }

                    .el-form-item__content{
                        >*:not(button){
                            width: 100%;
                        }
                    }
                }
            }
        }
    }
</style>
