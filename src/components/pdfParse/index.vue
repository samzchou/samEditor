<template>
    <div class="pdf-parse-cmp">

        <div class="search_form">
            <div class="title">{{docSetting.title||'标准文档结构化数据解析'}}</div>
            <div class="controls">
                <el-input size="mini" v-model="seachForm.keyword" prefix-icon="el-icon-search" placeholder="关键字查找" clearable style="width:200px" @keypress.native.enter="submitSearch"/>
                <el-button size="mini" type="primary" icon="el-icon-search" @click.stop.prevent="submitSearch">检索</el-button>
                <el-button size="mini" type="warning" plain icon="el-icon-search" @click.stop.prevent="handlerUploadFile()">上传文档</el-button>
            </div>
        </div>
        <!-- 数据列表 -->
        <div class="lists">
            <div class="tabs">
                <el-tabs v-model="activeName" @tab-click="handleClick">
                    <el-tab-pane label="所有文档" name="all"></el-tab-pane>
                    <el-tab-pane label="待处理文档" name="waiting"></el-tab-pane>
                    <el-tab-pane label="已解析文档" name="finished"></el-tab-pane>
                    <el-tab-pane label="异常日志" name="error"></el-tab-pane>
                </el-tabs>
                <div class="btns">
                    <el-button type="success" size="mini" plain :disabled="!multipleSelection.length" @click.stop.prevent="analyzeFile()">批量解析</el-button>
                    <el-button type="danger" size="mini" plain :disabled="!multipleSelection.length" @click.stop.prevent="batchRemove()">批量删除</el-button>
                </div>
            </div>

            <div class="table-data" id="doc-table-data">
                <el-table size="small" :data="fileList" :max-height="maxHeight" row-key="id" border style="width: 100%" @selection-change="handleSelectionChange">
                    <el-table-column type="selection" :reserve-selection="true" align="center" fixed="left" width="45" />
                    <el-table-column prop="label" label="文档名" show-overflow-tooltip>
                        <template slot-scope="scope">
                            <span class="show-file" @click.stop.prevent="openFile(scope.row)">{{scope.row.label}}</span>
                            <i v-if="scope.row.htmlPath" class="el-icon-magic-stick" style="margin-left: 5px;color: green;" />
                        </template>
                    </el-table-column>
                    <el-table-column prop="md5" label="文档MD5" />
                    <el-table-column prop="fileSize" label="文件大小" sortable width="120">
                        <template slot-scope="scope">{{ scope.row.fileSize ? formatFileSize(scope.row.fileSize) : '' }}</template>
                    </el-table-column>
                    <el-table-column prop="progress" label="文档结构化解析" width="160" align="center">
                        <template slot-scope="scope">
                            <el-button v-if="!scope.row.progressPercentage && !scope.row.needProcess" size="mini" type="success" plain icon="el-icon-attract" @click.stop.prevent="analyzeFile(scope.row)">解析文档</el-button>

                            <span v-else-if="!scope.row.progressPercentage && scope.row.needProcess" style="color:blue">
                                正在处理中...
                            </span>
                            <div class="fl fc" v-else-if="scope.row.progressPercentage && scope.row.progressPercentage < 100 && scope.row.needProcess">
                                <i class="el-icon-loading" style="margin-right: 5px;" />
                                <el-progress v-if="scope.row.progressPercentage <= 100" :percentage="scope.row.progressPercentage" style="flex:1;" />
                            </div>
                            <template v-else-if="scope.row.progressPercentage === 100">
                                <el-link class="el-icon-edit-outline" type="primary" @click.stop.prevent="viewDoc(scope.row)">
                                    解析校对
                                </el-link>
                                <!--
                                <el-link class="el-icon-share" @click.stop.prevent="viewAtlas(scope.row)" style="margin-left: 10px;">
                                    图谱
                                </el-link>
                                -->
                            </template>

                        </template>
                    </el-table-column>
                    <el-table-column prop="pageSize" label="文档页数" sortable width="100" align="center" />
                    <el-table-column prop="errorMessage" label="错误信息" sortable width="150">
                        <template slot-scope="scope">
                            <span style="color: red;">{{scope.row.errorMessage}}</span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="updateAt" label="最后修改" sortable width="150" align="center">
                        <template slot-scope="scope">
                            <span>{{ formatData(scope.row.updateAt) }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="100" fixed="right" align="center">
                        <template slot-scope="scope">
                            <template v-if="!scope.row.needProcess">
                                <el-tooltip content="解析文档" placement="top">
                                    <el-button size="mini" type="success" plain icon="el-icon-attract" @click.stop.prevent="analyzeFile(scope.row)"></el-button>
                                </el-tooltip>
                            </template>
                            <template v-else-if="scope.row.status==='success' && scope.row.progressPercentage === 100">
                                <el-tooltip content="解析校对" placement="top">
                                    <el-button size="mini" type="primary" plain icon="el-icon-document" @click.stop.prevent="viewDoc(scope.row)"></el-button>
                                </el-tooltip>
                            </template>
                            <el-tooltip v-if="!scope.row.progressPercentage || scope.row.progressPercentage===100 || scope.row.errorMessage" content="删除文档" placement="top">
                                <el-button size="mini" type="danger" plain icon="el-icon-delete" @click.stop.prevent="batchRemove([scope.row.id])"></el-button>
                            </el-tooltip>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
            <div class="pages">
                <div>
                    <span class="el-icon-refresh" @click.stop.prevent="queryList()" style="cursor: pointer;">刷新</span>
                </div>
                <el-pagination
                    background
                    small
                    layout="total, prev, pager, next"
                    :total="total"
                    :current-page="query.pageNum"
                    :page-size="query.pageSize"
                    @current-change="handleCurrentChange" />
            </div>
        </div>

        <el-dialog
			v-el-drag-dialog
			custom-class="sam-dialog"
			append-to-body
			:title="dialogParam.title"
			:visible.sync="dialogParam.visible"
			:width="dialogParam.width"
			:fullscreen="dialogParam.fullscreen"
			:close-on-click-modal="false"
			:destroy-on-close="true"
			:show-close="dialogParam.showClose">
            <component v-if="dialogParam.visible" :is="dialogCmp" :data="dialogParam.data" :nodeURL="docSetting.nodeURL" :url="pdfUrl" :isSelf="isSelf" @change="changeDialog" />
        </el-dialog>

    </div>
</template>

<script>
    // 后台Node接口
    import { dbServer } from '@/api/nodeServer.js';
    // 其他辅助组件
    import * as formCmp from './components/index.js';
    // 拖动弹窗
    import elDragDialog from '@/directive/el-drag-dialog';
    // 通用函数
    import $global from '@/utils/global.js';

    export default {
        name: 'pdf-parse-cmp',
        inject: ['docSetting'],
        directives: { elDragDialog },
        props: {
            isSelf: {
                type: Boolean,
                default: true
            }
        },
        computed: {
            dialogCmp() {
                return formCmp[this.dialogParam.cmp];
            },
			imgCmp() {
				return formCmp['parseImg'];
			},
            docCmp() {
                return formCmp['viewDoc'];
            },
            showCmp() {
                switch(this.viewCmp) {
                    case 'viewDoc':
                        return viewDoc;
                    case 'fileView':
                        return fileViewer;
                    case 'analyzePdf':
                        return analyzePdf;
                }
                return null;
            },
            pdfUrl() {
                let url = '';
                if (this.dialogParam.data && this.dialogParam.data.fileUrl) {
                    url = this.dialogParam.data.fileUrl;
                }
                return url;
            }
        },
        data() {
            return {
                // isSelf: false,
                activeName: 'all',
                tabData: [{
                    label: '所有文档'
                },{
                    label: '待处理文档'
                },{
                    label: '已解析文档'
                },{
                    label: '无法处理文档'
                }],
                loading: null,
                seachForm: {
                    keyword: ''
                },
                maxHeight: 500,
                query: {
                    pageNum:1,
                    pageSize:30,
                },
                total: 0,
                fileList: [],
                editItem: null,
                dialogParam: {
                    title: '',
                    visible: false
                },
                multipleSelection: [],
                viewCmp: '',
                userId: 'test00001',
                timeHandler: null,
                resizeObserver: null,
                intervalIds: {},
                showInfo: null,
            }
        },
        methods: {
            changeTab() {

            },
            exitView() {
                this.showInfo = null;
                this.queryList();
            },
            onLoading(text) {
                if (this.loading && !text) {
                    this.loading.close();
                    this.loading = null;
                    return;
                }
                this.loading = this.$loading({
                    lock: true,
                    text,
                    visible: true,
                    spinner: 'el-icon-loading',
                    background: 'rgba(0, 0, 0, 0.7)'
                });

                setTimeout(() => {
                    this.loading && this.loading.close();
                    this.loading = null;
                }, 30000);
            },
            formatFileSize(val) {
                return $global.formatFileSize(val);
            },
            formatData(val) {
                return $global.formatDateTime("yyyy-MM-dd hh:mm:ss", val);
            },
            stopObserveResize() {
                if (this.resizeObserver) {
                    this.resizeObserver.disconnect();
                    this.resizeObserver = null;
                }
            },
            observeResize() {
                const container = document.getElementById('doc-table-data');
                if (container) {
                    this.resizeObserver = new ResizeObserver((entries) => {
                        for (let entry of entries) {
                            this.maxHeight = entry.contentRect.height;
                        }
                    });
                    this.resizeObserver.observe(container);
                }
            },
            changeDialog(obj) {
                if (obj.act) {
                    switch(obj.act) {
                        case 'close':
                            this.closeDialog();
                            break;
                        case 'upload':
                            this.appendFile(obj.data);
                            break;
                        case 'resetParse':
                        case 'submitParse':
                            this.closeDialog();
                            this.queryList();
                            break;
						case 'parseImage':
							console.log('changeDialog parseImage===>', obj)
							break;

                    }
                }
            },
            closeDialog() {
                this.dialogParam = {
                    visible: false,
                    cmp: ''
                }
            },
            async appendFile(list=[]) {
                for (let i=0; i<list.length; i++) {
                    let item = list[i];
                    let ext = $global.getExt(item.originalFilename||item.label).toLowerCase();
                    let obj = {
                        id: item.id || $global.guid(),
                        userId: this.docSetting.userId || this.userId,
                        parentId: "0",
                        label: item.label || item.originalFilename,
                        fileSize: item.fileSize || item.size,
                        fileUrl: item.fileUrl || item.outFile,
                        fileType: ext,
                    }
                    // 保存文件
                    const res = await this.saveFileData(_.omit(obj, ['img']), true);
                    if (res && i === list.length - 1) {
                        this.$message.success('操作完成');
                        this.queryList();
                    }
                }
                this.closeDialog();
            },
            // 保存上传的文件信息
            async saveFileData(item, isAdd = false) {
                item.userId = this.docSetting.userId || this.userId;
                const params = {
                    "operation": "query",
                    "queryType": isAdd ? 1 : 2,
                    columns: _.omit(item, ['img']),
                    ..._.pick(this.docSetting, ['server','dbName','tableName']),
                }
                const res = await dbServer(params, this.docSetting.nodeURL);
                if (res && res.data) {
                    return true;
                }
                return false;
            },
            // 上传文件
            async handlerUploadFile(evt) {
                this.dialogParam = {
                    title: '文件上传',
                    visible: true,
                    width: '950px',
                    showClose: false,
                    cmp: 'uploadFile',
                    data: {
						limit: this.docSetting.limit || 5,
                        accept: this.docSetting.accept || ''
                    }
                }
            },
            analyzeFile(list) {
                list = list || this.multipleSelection;
                if (!_.isArray(list)) {
                    list = [list];
                }
				console.log('list===>', list)
                this.dialogParam = {
                    title: 'PDF文档解析',
                    visible: true,
                    width: '950px',
                    showClose: true,
                    cmp: 'parsePdf',
                    data: list
                }
            },
            async batchRemove(id, release=false) {
                if (!release) {
                    this.$confirm('Confirm to delete?', 'Tips', {
                        confirmButtonText: 'Sure',
                        cancelButtonText: 'Cancel',
                        type: 'warning'
                    }).then(() => {
                        this.batchRemove(id, true)
                    }).catch(() => { });
                } else {
                    id = id || this.multipleSelection.map(row => row.id);
                    // console.log('batchRemove==>', id)
                    const params = {
                        "operation": "query",
                        "queryType": 3,
                        "condition": {
                            id,
                        },
                        ..._.pick(this.docSetting, ['server','dbName','tableName']),
                    }
                    const res = await dbServer(params, this.docSetting.nodeURL);
                    if (res && res.success) {
                        this.$message.success('操作完成');
                        this.queryList();
                    }
                }
            },

            // 打开文件
            async openFile(item) {
                console.log('openFile', item);
                if (this.editItem && item.id === this.editItem.id) {
                    return false;
                }
                this.editItem = null;

                // 重新获取数据
                const params = {
                    "operation": "query",
                    "queryType": 0,
                    "condition": {
                        id: item.id,
                    },
                    one: true,
                    ..._.pick(this.docSetting, ['server','dbName','tableName']),
                }
                const res = await dbServer(params, this.docSetting.nodeURL);
                if (res && res.data) {
                    this.dialogParam = {
                        title: res.data.label,
                        visible: true,
                        fullscreen: true,
                        width: '1200px',
                        showClose: true,
                        cmp: 'fileViewer',
                        data: res.data
                    }
                }
            },
            viewAtlas(data) {
                // this.$message.error('暂无图谱内容！');
                $global.openNewWindow('http://localhost:8765/')
            },
            viewDoc(data) {
                console.log('viewDoc', data);
                this.dialogParam = {
                    title: '检查解析结果',
                    visible: true,
                    fullscreen: true,
                    // width: '950px',
                    showClose: true,
                    cmp: 'viewDoc',
                    data
                }

            },
            handleSelectionChange(val) {
                this.multipleSelection = val;
            },
            handleCurrentChange(page) {
                this.$set(this.query, 'pageNum', page);
                this.queryList();
            },
            submitSearch() {
                this.handleCurrentChange(1);
            },

            handleClick() {

            },
            // dbServer
            async queryList() {
                // 销毁轮询
                this.destroyTask();
                this.onLoading('加载中...');
                this.fileList = [];
                const condition = {
                    "user_id": this.docSetting.userId || this.userId,
                    "delFlag": 0,
                }
                /*switch(this.activeName) {
                    case 'waiting';
                        condition.
                        break;
                    case 'finished';
                        break;
                    case 'error';
                        break;
                }*/

                const params = {
                    "operation": "query",
                    "queryType": 0,
                    "condition": condition,
                    ..._.pick(this.docSetting, ['server','dbName','tableName']),
                    ...this.query,
                    orderBy: {
                        column: 'create_at',
                        sort: 'DESC'
                    }
                }
				// 关键字查找
                if (this.seachForm.keyword) {
                    params.search = {
                        label: _.trim(this.seachForm.keyword)
                    }
                }

                // debugger
                const res = await dbServer(params, this.docSetting.nodeURL);
                console.log('queryList', res);
                if (res && res.data) {
                    this.total = res.total;
                    const arrList = [];
                    for (let item of res.data) {
                        item.createAt = $global.formatDateTime("yyyy-MM-dd hh:mm:ss", new Date(item.createAt));
                        item.updateAt = $global.formatDateTime("yyyy-MM-dd hh:mm:ss", new Date(item.updateAt));
                        // 进度临时
                        arrList.push(item);
                    }

                    if (arrList.length) {
                        this.fileList = arrList;
                        console.log('this.fileList===>', this.fileList);
                        // 取出正在解析的PDF文件轮询获取解析进度
                        this.startPolling();
                    }
                }
                this.onLoading();
            },
            // 执行轮询
            startPolling() {
                this.fileList.forEach((item, index) => {
					if (this.intervalIds[item.id]) {
						clearInterval(this.intervalIds[item.id]);
						this.intervalIds[item.id] = null;
					}
                    if (item.needProcess === 1 && item.progressPercentage !== 100 && ['pdf','docx'].includes(item.fileType)) {
                        var row = _.cloneDeep(item);
                        this.intervalIds[item.id] = setInterval(async () => {
                            row = await this.fetchProgress(row, index);
                            if (!_.isEmpty(row)) {

                                if (row.progressPercentage >= 100) {
                                    row.progressPercentage = 100;
                                    row.status = 'success';
                                    clearInterval(this.intervalIds[item.id]);
                                    delete this.intervalIds[item.id];
                                }
                                this.$set(this.fileList, index, row);
                            }
                        }, 5000);
                    }
                })
            },

            async fetchProgress(item, index) {
                if (!item.progressPercentage) {
                    item.progressPercentage = 0;
                }
                const params = {
                    "operation": "query",
                    "queryType": 0,
                    "condition": {
                        id: item.id
                    },
                    one: true,
                    ..._.pick(this.docSetting, ['server','dbName','tableName']),
                }

                const res = await dbServer(params, this.docSetting.nodeURL);
                if (res && res.data) {
                    // debugger
                    const data = res.data;
                    if (data?.progressPercentage) {
                        item.progressPercentage = data.progressPercentage;
                    }
                    item.pageSize = data.pageSize;
                    item.status = data.status;
                    item.md5 = data.md5;
                    return item;
                }
                return null;
            },
            destroyTask() {
				// console.log('this.intervalIds===>', _.cloneDeep(this.intervalIds))
				for (let id in this.intervalIds) {
					clearInterval(this.intervalIds[id]);
					delete this.intervalIds[id];
				}
				this.intervalIds = {};
            }
        },

        created() {
            if (this.$route.query.self) {
                this.isSelf = true;
            }
            this.queryList();
        },
        mounted() {
            this.observeResize();
        },
        beforeDestroy() {
            this.stopObserveResize();
            this.destroyTask();
        },
    }
</script>

<style lang="scss" scoped>
    @import './style.scss';
</style>
