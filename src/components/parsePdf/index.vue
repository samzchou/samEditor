<template>
    <div class="sam-pdf-tools">
        <div class="header">
            <div class="search">
                <!-- <span>查找：</span>
                <el-select size="mini" v-model="stdUuid" filterable remote clearable placeholder="请选择或者关键字查找..." :remote-method="remoteMethod" :loading="loading" @change="changeSelected" style="width: 500px;">
                    <el-option v-for="(item, idx) in stdList" :key="idx" :label="item.label" :value="item.id" />
                    <div class="bottom-pages" style="border-top: 1px solid #DDD;">
                        <el-pagination small @current-change="handleCurrentChange" :current-page="query.pageNo" :page-size="query.pageSize" layout="total, prev, pager, next"  :total="total" />
                    </div>
                </el-select>
                <span style="margin-left: 10px;">标准类型：</span>
                <el-select size="mini" v-model="stdKind" filterable remote clearable placeholder="请选择导出标准类型..." style="width: 150px;">
                    <el-option v-for="(item, idx) in stdKindList" :key="idx" :label="item.label" :value="item.value" />
                </el-select> -->
                <el-select size="mini" v-model="currPage" filterable remote clearable placeholder="请选择页码" style="width: 100px;">
                    <el-option v-for="n in 300" :key="n" :label="`第${n}页`" :value="n" />
                </el-select>
                <el-dropdown size="mini" split-button trigger="click" @command="handleExport" style="margin-left: 10px;">
                    智能生成结构化文档
                    <el-dropdown-menu slot="dropdown">
                        <el-dropdown-item command="xml">导出标准XML文档</el-dropdown-item>
                        <el-dropdown-item divided command="struct">导出标准结构化文档</el-dropdown-item>
                        <el-dropdown-item divided command="local">直接转化</el-dropdown-item>
                    </el-dropdown-menu>
                </el-dropdown>
            </div>
            <div>
                <el-button size="mini" type="primary" @click="showEditor=!showEditor">查看解析后内容</el-button>
                <el-button size="mini" type="primary" @click="showAllTags">查看所有标签</el-button>
            </div>
        </div>

        <div class="main">
            <div class="pdf-wrapper">
                <pdfViewer
                    ref="pdfViewer"
                    :url="pdfUrl"
                    :nodeURL="pdfOptions.nodeUrl"
                    :disable="disabledBtns"
                    :zoomIn="150"
                    @change="changeEvent"/>
            </div>

            <!-- v-show="showEditor" -->
            <div class="editor-wrapper">
                <docEditor :content="htmlContent" />
            </div>

            <!-- <div class="right-wrapper">
                <tagSetting ref="tagSetting" :selection="selection" :id="stdUuid" @change="changeEvent"/>
            </div> -->
        </div>
    </div>

</template>

<script>
    // nodeServer接口
    import { handleFile } from '@/api/nodeServer';
    // DMS接口
    import { searchDmsTopicalPageList, searchDmsTopicDetailByUuid } from '@/api/dms';
    // PDFVIWER
    import pdfViewer from '../pdfViewer';
    // 配置总组件
    // import tagSetting from './tagSetting.vue';
    // 解析模块
    import parseData from './utils/parseData.js';
    // 编辑器模块
    import docEditor from './components/docEditor.vue';
    // 全局方法
    import $global from '@/utils/global';
    // 公共事件
    import $bus from '@/utils/bus';
    // 模拟数据
    // import mockData from './mock.json';

    export default {
        name: 'sam-pdf-tools',
        inject: ['pdfOptions'],
        components: {
            pdfViewer, docEditor
        },
        data() {
            return {
                stdUuid: 'test001', // 933dd8a3-7c80-4c93-b4fd-f83fba6e2121 a4806d33-7860-4673-beb5-d54076fb9cbe
                pdfUrl: 'http://127.0.0.1:9001/files/DL_T1067-2020_H.pdf',
                pdfViewerInstance: null,
                disabledBtns: ['presentationMode', 'print', 'download', 'close', 'textClose'],
                loading: false,
                query: {
                    pageNo:1,
                    pageSize:20,
                },
                total: 0,
                stdList: [],
                stdKindList: [
                    { label:"国家标准", value:1100 },
                    { label:"行业标准", value:1200 },
                    { label:"地方标准", value:6 },
                    { label:"团体标准", value:1500 },
                    { label:"企业标准", value:1400 },
                ],
                stdKind: 1200,
                selection: {},
                htmlContent: '',
                showEditor: false,
                currPage: 1,
            }
        },

        methods: {
            // 执行导出
            async handleExport(act) {
                if (!this.stdKind) {
                    this.$message.warning('请选择导出的文档类型！')
                    return;
                }
                if (act === 'local') {
                    handleFile({
                        "filePath":"pdf/DL_T1067-2020/DL_T1067-2020.xml",
                        "type":"getFile"
                    }).then(({ code, data }) => {
                        // console.log('handleExport===>', data)
                        if (code === 200 && data) {
                            this.$refs.tagSetting.setActiveTab('tagXml');
                            $bus.$emit('setXml', data)
                        }
                    })
                    return;
                }
                // 历史数据
                const pageData = $global.getStroage('parsepdfData', true)
                if (pageData) {
                    this.htmlContent = await parseData.toHtml(pageData.pageList, this.currPage);
                    console.log('this.htmlContent', this.htmlContent)
                    return false;
                }

                this.pdfViewerInstance.postMessage({
                    export: act,
                    stdKind: this.stdKind
                    // socketId: this.socketId,
                })
            },

            showAllTags() {
                this.pdfViewerInstance.postMessage({
                    appendTags: true,
                    stdId: this.stdUuid
                })
            },

            changeEvent(obj) {
                console.log('changeEvent==>', obj)
                switch(obj.act) {
                    case 'loaded':
                        if (!this.pdfViewerInstance) {
                            this.pdfViewerInstance = this.$refs.pdfViewer;
                        }
                        if (obj.data && obj.data.pagesCount && obj.data.pagesCount > 1) {
                            this.pdfViewerInstance.postMessage({
                                outlineList: true,
                            })
                        }
                        break;
                    case 'selection':
                        this.selection = _.omit(obj, ['act']);
                        this.$refs.tagSetting.setActiveTab('setTag');
                        break;
                    case 'outlineList':
                        // debugger
                        this.outlineList = obj.data || [];
                        this.$storage.session.set('pdf-outline', this.outlineList)
                        break;
                    case 'setSelection':
                        this.pdfViewerInstance.postMessage(obj.data)
                        break;
                    case 'export':
                        this.handleExport('xml')
                        break;
                    case 'exportData':
                        console.log('exportData', obj.data)
                        $global.setStroage('parsepdfData', obj.data, true)
                        const { pageList, xmlStr } = obj.data;
                        if (xmlStr) {
                            // this.pdfXml = xmlStr;
                            this.$refs.tagSetting.setActiveTab('tagXml');
                            $bus.$emit('setXml', xmlStr)
                        }
                        break;
                }
            },
        },
    }

</script>

<style lang="scss" scoped>
    .sam-pdf-tools{
        height: 100%;
        .header{
            height: 40px;
            background-color: #6e88b1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 15px;
        }
        .main{
            position: relative;
            height: calc(100% - 40px);
            display: flex;
            .pdf-wrapper, .editor-wrapper{
                flex:1;
                ::v-deep .pdfviewer-container {
                    height:100%;
                }
            }
            .right-wrapper{
                width: 650px;
                transition: all .25s;
                border-left: 1px solid #e3e3e3;
                // background: linear-gradient(0deg, #eef4f9, #ffffff);
                // background-color: #f9f9fa;
            }
            ::v-deep .pdf-to-html{
                height: 100%;
                width: 100%;
                position: absolute;
                background-color: #c3c1c1;
                left: 0;
                top: 0;
                z-index: 100;
                overflow: auto;
            }
        }
    }
</style>
