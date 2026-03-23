<template>
    <section class="test-omparison-container">
        <div class="table-list">
            <div>
                <h3>
                    <span>比对标准文档</span>
                    <el-button size="small" type="text" icon="el-icon-tickets" @click.stop.prevent="SelectDoc(false)">{{ !sourceData.length ?'选择文档(单选)':'重新选择' }}</el-button>
                </h3>
                <el-table size="mini" :data="sourceData" border empty-text="请选择比对标准文档" style="width: 100%">
                    <el-table-column prop="stdNo" label="标准编号" width="250" />
                    <el-table-column prop="stdName" label="标准名称" />
                    <el-table-column label="操作" align="center" width="80">
                        <template slot-scope="scope">
                            <el-button size="mini" type="text" icon="el-icon-document" @click.stop.prevent="viewDoc(scope.row)">浏览</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <div>
                <h3>
                    <span>被比对标准文档<em>（已选中{{targetData.length}}个）</em></span>
                    <el-button size="small" type="text" icon="el-icon-document-copy" @click.stop.prevent="SelectDoc(true)">{{ !targetData.length ?'选择文档(多选)':'重新选择' }}</el-button>
                </h3>
                <el-table size="mini" :data="targetData" border empty-text="请选择被比对标准文档" style="width: 100%">
                    <el-table-column type="index" label="序号" align="center" width="50" />
                    <el-table-column prop="stdNo" label="标准编号" width="250" />
                    <el-table-column prop="stdName" label="标准名称" />
                    <el-table-column label="操作" align="center" width="150">
                        <template slot-scope="scope">
                            <el-button size="mini" type="text" icon="el-icon-document" @click.stop.prevent="viewDoc(scope.row)">浏览</el-button>
                            <el-button size="mini" type="text" icon="el-icon-delete" @click.stop.prevent="removeItem(scope.$index)">移除</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </div>

        <div class="btns">
            <el-select size="small" v-model="ctype" placeholder="请选择比对类型" style="margin:0 10px; width: 150px;">
                <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-select size="small" v-model="thresholdValue" placeholder="请选择比对阙值" style="margin-right: 10px;">
                <el-option v-for="item in thresholdOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-button size="small" type="primary" icon="el-icon-tickets" :disabled="checkDisable" @click.stop.prevent="comparisonDoc">开始比对</el-button>
        </div>

        <!-- 弹窗 -->
        <el-dialog :title="dialogParams.title" custom-class="comparise-dialog" :visible.sync="dialogParams.visible" :fullscreen="dialogParams.fullscreen" :width="dialogParams.width" :close-on-click-modal="false" :destroy-on-close="true"
            append-to-body :before-close="handleClose">
            <component ref="doc-comp" v-if="cmp !== null" :is="cmp" :data="dialogParams" @close="handleClose" />
            <div v-if="!dialogParams.fullscreen" slot="footer" class="dialog-footer">
                <el-button @click="handleClose">取 消</el-button>
                <el-button type="primary" @click="submitSelect">确 定</el-button>
            </div>
        </el-dialog>
    </section>

</template>

<script>
    // 引入文档列表组件
    import docList from './docList';
    // 引入文档比对组件
    import docComparison from '@/components/docComparison';
    // 引入文档编辑器组件
    import structViewer from "@/components/structViewer";

    // 弹窗参数
    const fixedParams = {
        editorURL: process.env.VUE_APP_EDITOR_URL, // 结构化文档的API接口地址
        nodeURL: process.env.VUE_APP_REMOTE_API, // nodeServer接口地址
        textImgUrl: process.env.VUE_APP_TEXT_IMG_URL, // 文本文档中的图片路径
        cmpName: 'quoteClause',
        visible: false,
        title: '选择文档',
        width: '50%',
    }

    const stdReader = {
        'editorURL': 'http://bzton.cn:9088',
        'nodeURL': 'http://192.168.0.239:9001',
        'textImgUrl': 'http://bzton.cn:9006/std/img/',
    }
    const testDoc = [{
        docId: "0FBEB322-9436-459B-B0D3-6727EC79C58F",
        stdName: "工业自动化产品安全要求第6部分:电磁阀的安全要求",
        stdNo: "GB 30439.6-2014",
        stdKind: 1100
    }]

    export default {
        name: 'doc-comparison',
        computed: {
            checkDisable() {
                return !this.sourceData.length || !this.targetData.length;
            },
            cmp() {
                switch (this.dialogParams.cmpName) {
                    case 'docList':
                        return docList;
                    case 'comparsion':
                        return docComparison;
                    case 'view':
                        return structViewer;
                }
                return null;
            }
        },
        data() {
            return {
                ctype: 'info', // 默认比对类型：题录比对
                typeOptions: [{ value: 'info', label: '题录比对' }, { value: 'doc', label: '全文比对' }, { value: 'chapter', label: '章节比对' }],
                sourceData: [...testDoc], // 比对的文档
                targetData: [], // 被比对的文档
                dialogParams: { cmpName: 'docList' }, // 弹窗参数
                thresholdValue: undefined, // 比对阙值
                thresholdOptions: [{ label: '全部', value: 0 }, { label: '10%', value: 10 }, { label: '20%', value: 20 }, { label: '30%', value: 30 }],
                isComparing: false,
            }
        },
        methods: {
            openDialog(param = {}) {
                this.dialogParams = Object.assign(fixedParams, param, param.private ? stdReader : {});
            },
            /**
             * 开始比对
             */
            comparisonDoc() {
                this.isComparing = true;
                var param = {
                    cmpName: 'comparsion',
                    title: '',
                    visible: true,
                    sourceData: this.sourceData,
                    targetData: this.targetData,
                    thresholdValue: this.thresholdValue,
                    type: this.ctype,
                    fullscreen: true,
                    // private: true,
                };
                this.openDialog(param);
            },
            /**
             * @description 关闭弹窗
             */
            handleClose() {
                this.isComparing = false;
                this.dialogParams = Object.assign(fixedParams, { cmpName: '', visible: false, fullscreen: false, isMultiple: false });

            },
            /**
             * @description 弹窗提交选中的文档
             */
            submitSelect() {
                let checkedItems = this.$refs['doc-comp'].getValue();
                if (!checkedItems.length) {
                    this.$message.warning('请选择文档！');
                    return;
                }
                if (this.dialogParams.isMultiple) {
                    this.targetData = checkedItems;
                } else {
                    this.sourceData = checkedItems;
                }
                this.handleClose();
            },
            /**
             * @description 浏览文档
             * @param {Object}  row 文档数据
             */
            viewDoc(row = {}) {
                var param = {
                    cmpName: 'view',
                    title: '',
                    visible: true,
                    fullscreen: true,
                    showHeader: true,
                    docData: row,
                };
                this.openDialog(param);
            },
            /**
             * @description 移除已选中的问昂
             * @param {Int}  rowIndex 索引
             */
            removeItem(rowIndex = 0) {
                this.$confirm('确定移除?', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    this.targetData.splice(rowIndex, 1);
                }).catch(() => {});
            },
            /**
             * @description 选择文档，打开弹窗
             * @param {Boolean}  isMultiple 是否多选
             */
            SelectDoc(isMultiple = false) {
                var param = {
                    cmpName: 'docList',
                    title: isMultiple ? '选择被比对的文档' : '选择需比对的文档',
                    isMultiple,
                    visible: true,
                    fullscreen: false,
                    sourceData: this.sourceData,
                    targetData: this.targetData,
                };
                this.openDialog(param);
            }
        }
    }
</script>

<style lang="scss" scoped>
    .test-omparison-container {
        height: 100%;

        .table-list {
            display: flex;

            >div {
                width: 50%;
                padding: 10px;

                >h3 {
                    line-height: 2.5;
                    text-align: center;
                    background-color: #cbdce5;

                    ::v-deep .el-button {
                        float: right;
                        margin-right: 10px;
                    }
                }
            }
        }

        .btns {
            text-align: center;
            padding: 15px 0;
        }

    }

    ::v-deep .comparise-dialog {
        &.is-fullscreen {
            overflow: hidden;
            display: flex;
            flex-direction: column;

            .el-dialog__header {
                display: none;
            }

            .el-dialog__body {
                height: 100%;
            }
        }
    }
</style>
