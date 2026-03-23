<template>
    <div class="info-comparise-container">
        <template v-if="currDoc===null && sourceData !== null">
            <h3>题录《{{sourceData.stdName}}》比对结果</h3>
            <div class="datas" v-loading="loading" element-loading-text="正在计算相关比对结果,需较长时间,请等候完成...">
                <el-table size="mini" :data="compariseData" border :max-height="500" style="width: 100%">
                    <el-table-column type="index" label="序号" align="center" width="50" />
                    <el-table-column prop="stdNo" label="被比对标准编号" width="160" />
                    <el-table-column prop="stdName" label="被比对标准名称" />
                    <!-- <el-table-column prop="stdStruct" label="结构化文件" width="100"> -->
                    <el-table-column prop="labelSimilar" label="名称相似度" width="100" />
                    <el-table-column prop="rangeSimilar" label="适用范围相似度" width="120" />
                    <el-table-column prop="titleSimilar" label="章节相似度" width="100" />
                    <el-table-column prop="textSimilar" label="文本相似度" width="100" />
                    <el-table-column prop="allSimilar" label="综合相似度" width="100" />
                    <el-table-column label="操作" align="center" width="150">
                        <template slot-scope="scope">
                            <el-button size="mini" type="text" icon="el-icon-document-copy" @click.stop.prevent="docComparise(scope.row)">文本相似度</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </template>
        <template v-else>
            <div class="datas" ref="tableData" v-loading="loading" element-loading-text="正在计算相关比对结果,需较长时间,请等候完成...">
                <div v-if="comparisedOutlines.length">
                    <h3>
                        <span>比对文档：{{sourceData.stdName}}</span>
                        <el-dropdown v-if="data.sourceData.length>1" trigger="click" style="float:right; margin:5px 5px 0;" @command="docComparise($event, 'source')">
                            <span class="el-dropdown-link">
                                其他文档<i class="el-icon-arrow-down el-icon--right"></i>
                            </span>
                            <el-dropdown-menu slot="dropdown">
                                <el-dropdown-item v-for="(item, idx) in data.sourceData.filter(o=> o.docId!==sourceData.docId)" :key="idx" :command="item">{{item.stdName}}</el-dropdown-item>
                            </el-dropdown-menu>
                        </el-dropdown>
                    </h3>
                    <el-table
                        ref="sourceTable"
                        size="mini"
                        data-name="source"
                        :data="comparisedOutlines"
                        row-key="id"
                        border
                        default-expand-all
                        :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
                        :max-height="tableHeight"
                        @cell-click="cellClick">
                        <el-table-column label="序号" align="center" width="70">
                            <template slot-scope="scope">
                                <span>{{ scope.$index + 1 }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="标题" prop="label" width="220">
                            <template slot-scope="scope">
                                <span>{{ scope.row.sourceItem.label }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="内容">
                            <template slot-scope="scope">
                                <el-tooltip class="item" effect="dark" :content="parseComparised(scope.row.comparised)" placement="top">
                                    <div :class="{'empty':!parseHtml(scope.row.sourceItem, scope.row.comparised, 'source')}" v-html="parseHtml(scope.row.sourceItem, scope.row.comparised, 'source')"></div>
                                </el-tooltip>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>

                <div v-if="comparisedOutlines.length">
                    <h3>
                        <span>被比对文档：{{currDoc.stdName}}</span>
                        <el-dropdown v-if="data.targetData.length>1" trigger="click" style="float:right; margin:5px 5px 0;" @command="docComparise($event, 'target')">
                            <span class="el-dropdown-link">
                                其他文档<i class="el-icon-arrow-down el-icon--right"></i>
                            </span>
                            <el-dropdown-menu slot="dropdown">
                                <el-dropdown-item v-for="(item, idx) in data.targetData.filter(o=> o.docId!==currDoc.docId)" :key="idx" :command="item">{{item.stdName}}</el-dropdown-item>
                            </el-dropdown-menu>
                        </el-dropdown>
                    </h3>
                    <el-table
                        ref="targetTable"
                        size="mini"
                        data-name="target"
                        :data="comparisedOutlines"
                        border
                        row-key="id"
                        default-expand-all
                        :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
                        :max-height="tableHeight"
                        @cell-click="cellClick">
                        <el-table-column label="序号" align="center" width="70">
                            <template slot-scope="scope">
                                <span>{{ scope.$index + 1 }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="标题" width="220" show-overflow-tooltip>
                            <template slot-scope="scope">
                                <span>{{ scope.row.targetItem.label }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="内容">
                            <template slot-scope="scope">
                                <div :class="{'empty':!parseHtml(scope.row.targetItem, scope.row.comparised, 'target')}" v-html="parseHtml(scope.row.targetItem, scope.row.comparised, 'target')"></div>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </div>
        </template>

        <div class="btns">
            <el-button v-if="data.type === 'info' && currDoc !== null " size="small" type="primary" @click.stop.prevent="backHandler(false)">返回题录比对列表</el-button>
            <el-button size="small" type="warning" @click.stop.prevent="backHandler(true)">退出关闭</el-button>
        </div>
    </div>
</template>

<script>
    // API接口
    import { listOutline, outlineStructList } from '@/api/outline';
    // 比对算法模型
    import { compariseOutlineList, diffTextContent } from '@/utils/compariseUtil';
    // 全局方法
    import $global from '@/utils/global';

    export default {
        name: 'info-comparise',
        props: {
            data: {
                type: Object,
                default: () => {
                    return {}
                }
            }
        },
        watch: {
            data: {
                handler(data) {
                    if (!_.isEmpty(data)) {
                        this.sourceData = _.cloneDeep(this.data.sourceData[0]);
                        if (data.type === 'doc') { // 直接比对全文
                            this.docComparise(data.targetData[0]);
                        } else { // 比对文档题录
                            this.compariseDocInfo();
                        }
                    }
                },
                immediate: true,
                deep: true
            },
        },
        computed: {
            maxHeight() {
                return this.getTableMaxHeight();
            }
        },

        data() {
            return {
                loading: true,
                sourceData: null,
                compariseData: [],
                targetData: [],
                currDoc: null,
                comparisedOutlines: [], // 主章节文本相似度比对
                tableHeight: 500,
            }
        },
        methods: {
            /**
             * @description 底部按钮点击事件处理
             * @param{Boolean} flag 是否退出
             */
            backHandler(flag=true) {
                if (!flag) {
                    this.currDoc = null;
                    this.comparisedOutlines = [];
                } else {
                    this.$emit('close');
                }
            },
            /**
             * @description 获取表格容器的最大高度
             */
            getTableMaxHeight() {
                if (this.$refs.tableData) {
                    this.tableHeight = this.$refs.tableData.offsetHeight - 50;
                }
            },
            /**
             * @description 比对列表单元格点击，滚动条定位
             * @param{Object} row 列数据
             * @param{Object} column 行属性数据
             * @param{Object} cell 列DOM
             */
            cellClick(row={}, column={}, cell={}) {
                // console.log('rowClick===>', row, column, cell, event)
                var tableContainer = $global.getParentBySelector(cell, 'el-table');
                var tableNode = $global.getParentBySelector(cell, 'table');
                var from = tableContainer.dataset.name;
                var currTr = cell.parentElement;
                // 定义当前单元行下标值
                var index = 0;
                var trNodes = Array.from(tableNode.querySelectorAll('tbody>tr'));
                for (let i=0; i<trNodes.length; i++) {
                    if (trNodes[i] === currTr) {
                        index = i;
                        $global.addClass(currTr, 'active');
                    } else {
                        $global.removeClass(trNodes[i], 'active');
                    }
                }
                // 滚动到当前单元行位置
                var targetTop = currTr.getBoundingClientRect().top;
                var containerTop = tableContainer.querySelector('.el-table__body').getBoundingClientRect().top;
                tableNode.parentElement.scrollTo({
                    top: targetTop - containerTop,
                    behavior: "smooth"
                });

                var vmEl;
                if (from === 'source') {
                    vmEl = this.$refs.targetTable;
                } else {
                    vmEl = this.$refs.sourceTable;
                }

                if (!vmEl) {
                    return false;
                }

                const scrollParent = vmEl.$el.querySelector('.el-table__body-wrapper');
                trNodes = scrollParent.querySelectorAll('tr');
                for (let i=0; i<trNodes.length; i++) {
                    if (i === index) {
                        currTr = trNodes[index];
                        $global.addClass(trNodes[i], 'active');
                    } else {
                        $global.removeClass(trNodes[i], 'active');
                    }
                }
                // 滚动到当前单元行位置
                tableContainer = $global.getParentBySelector(currTr, 'el-table');
                tableNode = $global.getParentBySelector(currTr, 'table');
                targetTop = currTr.getBoundingClientRect().top;
                containerTop = tableContainer.querySelector('.el-table__body').getBoundingClientRect().top;
                tableNode.parentElement.scrollTo({
                    top: targetTop - containerTop,
                    behavior: "smooth"
                });
            },

            /**
             * @description 解析比对相似度
             * @param{Object} data 比对数据
             */
            parseComparised(data={}) {
                let thresholdValueStr = '';
                if(this.data.thresholdValue) {
                    thresholdValueStr = (data.percent < this.data.thresholdValue ? '；低于' : '；高于') + `比对阙值${this.data.thresholdValue}%`
                }
                return (data.similar || '') + thresholdValueStr;
            },

            /**
             * @description 解析内容
             * @param{Object} item 数据
             * @param{Object} comparised 比对结果集
             * @param{String} from 来源
             */
            parseHtml(item={}, comparised={}, from='') {
                let contentText = item && item.content ? item.content.contentText : '';
                if (!contentText) {
                    contentText = item.outlineTitle || '';
                }
                // debugger
                if (contentText) {
                    comparised.diff.forEach(cp => {
                        if (cp.removed && from === 'source') {
                            contentText = contentText.replace(cp.value, '<del>'+cp.value+'</del>')
                        } else if (cp.added && from === 'target') {
                            contentText = contentText.replace(cp.value, '<ins>'+cp.value+'</ins>')
                        }
                    })
                    return contentText;
                } else {
                    return "";
                }
            },

            /**
             * @description 比对两个文档
             * @param{Object} row 文档数据
             */
            async docComparise(row={}, from='') {
                this.loading = true;
                if (from === 'source') {
                    this.sourceData = _.find(this.data.sourceData, { docId:row.docId });
                } else {
                    this.currDoc = _.find(this.data.targetData, { docId:row.docId });
                }
                // 开始进行比对
                var sourceOutlineList = await this.getOutlineList(this.sourceData);
                var targetOutlineList = await this.getOutlineList(this.currDoc);
                // 执行比对
                // debugger
                this.comparisedOutlines = compariseOutlineList(sourceOutlineList[0]['children'], targetOutlineList[0]['children']);
                console.log('docComparise=>', this.comparisedOutlines);
                this.getTableMaxHeight();
                this.loading = false;
            },

            /**
             * @description 比对选中的文档
             */
            async compariseDocInfo() {
                this.loading = true;
                var sourceOutlineList = await this.getOutlineList(this.sourceData);
                for (let i = 0; i < this.data.targetData.length; i++) {
                    let targetData = this.data.targetData[i];
                    let targetOutlineList = await this.getOutlineList(targetData);
                    let comparisedOutline = this.getSimilarResult(targetData, await this.compariseOutlineList(sourceOutlineList, targetOutlineList));
                }
                this.loading = false;
            },
            /**
             * @description 计算获取比对结果集
             * @param{Object} targetData 被比对文档数据
             * @param{Object} comparisedData 比对数据
             */
            getSimilarResult(targetData={}, comparisedData={}) {
                const totalSimilar = arrList => {
                    var totalCount = 0, similarCount = 0; //arrList.length;
                    arrList.forEach(comparised => {
                        comparised.forEach(obj => {
                            totalCount += obj.count;
                            if (!obj.added && !obj.removed) {
                                similarCount += obj.count;
                            }
                        })
                        // console.log(totalCount, similarCount)
                    });
                    return similarCount ? similarCount / totalCount : 0;
                }
                // debugger
                // 名称相似度
                var labelSimilar = totalSimilar(comparisedData.labelcomparised);
                // 适用范围相似度
                var rangeSimilar = totalSimilar(comparisedData.rangecomparised);
                // 章节相似度
                var titleSimilar = totalSimilar(comparisedData.titlecomparised);
                // 文本相似度
                var textSimilar = totalSimilar(comparisedData.textcomparise);
                // 合计总相似度
                var allSimilar = (labelSimilar + rangeSimilar + titleSimilar + textSimilar) / 4;
                // 构建数据
                var result = {
                    docId: targetData.docId,
                    stdNo: targetData.stdNo,
                    stdName: targetData.stdName,
                    labelSimilar: (Math.floor(labelSimilar*10000)/100) + '%',
                    rangeSimilar: (Math.floor(rangeSimilar*10000)/100) + '%',
                    titleSimilar: (Math.floor(titleSimilar*10000)/100) + '%',
                    textSimilar: (Math.floor(textSimilar*10000)/100) + '%',
                    allSimilar: (Math.floor(allSimilar*10000)/100) + '%',
                }
                this.compariseData.push(result)
            },

            /**
             * @description 比对两个文档的范围章节
             * @param{Array} sourceItems 比对文档章节数据
             * @param{Array} targetItems 被比对文档章节数据
             */
            compariseDocRange(sourceItems=[], targetItems=[]) {
                let sourceNode = _.find(sourceItems, { outlineType:3 });
                let targetNode = _.find(targetItems, { outlineType:3 });

                let sourceText = sourceNode && sourceNode.content ? sourceNode.content.contentText : '';
                let targetText = targetNode && targetNode.content ? targetNode.content.contentText : '';

                return diffTextContent(sourceText, targetText);
            },

            /**
             * @description 比对两个文档的所有章节
             * @param{Array} sourceOutlineTree 比对文档章节数据
             * @param{Array} targetOutlineTree 被比对文档章节数据
             */
            compariseOutlineList(sourceOutlineTree = [], targetOutlineTree = []) {
                var textcomparise = [], labelcomparised = [], rangecomparised = [], titlecomparised = [];
                // 递归章节子集
                const _recurrenceOutline = (sourceItems=[], targetItems=[]) => {
                    var allItemLens = targetItems.length ? Math.abs(sourceItems.length - targetItems.length) + sourceItems.length : sourceItems.length;
                    for (let i=0; i<allItemLens; i++) {
                        let sourceNode = sourceItems[i], targetNode = targetItems[i];
                        // 章节结构比对
                        labelcomparised.push(diffTextContent(sourceNode ? sourceNode.label : '', targetNode ? targetNode.label : ''));
                        // 章节名称比对
                        titlecomparised.push(diffTextContent(sourceNode ? sourceNode.outlineTitle : '', targetNode ? targetNode.outlineTitle : ''));
                        // 比对范围章节内容
                        if ((sourceNode && sourceNode.outlineType && sourceNode.outlineType === 3 && sourceNode.outlineTitle.match(/\范围/gi) !== null) || (targetNode && targetNode.outlineType && targetNode.outlineType === 3 && targetNode.outlineTitle.match(/\范围/gi) !== null)) {
                            rangecomparised.push(this.compariseDocRange(sourceItems, targetItems));
                        } else { // 文本内容比对
                            let sourceText = sourceNode && sourceNode.content ? sourceNode.content.contentText : '';
                            let targetText = targetNode && targetNode.content ? targetNode.content.contentText : '';
                            textcomparise.push(diffTextContent(sourceText, targetText))
                        }
                        // 如果有子集则继续递归处理
                        if ((sourceNode && sourceNode.children) || (targetNode && targetNode.children)) {
                            _recurrenceOutline(sourceNode && sourceNode.children ? sourceNode.children : [], targetNode && targetNode.children ? targetNode.children : []);
                        }
                    }
                }
                // 递归
                _recurrenceOutline(sourceOutlineTree[0]['children'], targetOutlineTree[0]['children']);

                return {
                    textcomparise,
                    labelcomparised,
                    rangecomparised,
                    titlecomparised
                }
            },

            /**
             * @description 获取大纲列表
             * @param{Object} 文档数据
             */
            async getOutlineList(data = {}) {
                var res = {};
                if (this.data.private) {
                    res = await listOutline({ docId: data.docId }, this.data.editorURL);
                } else {
                    res = await outlineStructList({ docId: data.docId }, this.data.editorURL);
                }

                if (res.code === 200 && res.rows.length) {
                    var outlineList = res.rows.map(item => {
                        let data = _.omit(item, ['docId', 'ancestors', 'isAsc', 'pageNum',
                            'pageSize', 'remark', 'delFlag', 'orderByColumn', 'infoNum', 'locked',
                            'extendContent', 'updateUser', 'updateTime', 'commitId', 'params',
                            'tagList', 'createTime', 'deleteTime', 'deleteUser', 'searchValueArray',
                            'createUser', 'searchValue'
                        ]);
                        data.content = _.omit(item.content, ['updateUser', 'pageSize',
                            'updateTime', 'remark', 'delFlag', 'orderByColumn', 'params', 'pageNum',
                            'outlineId', 'createTime', 'deleteTime', 'deleteUser',
                            'searchValueArray', 'createUser', 'isAsc', 'searchValue'
                        ]);
                        // 附录项及附录条款
                        if (item.outlineCatalog && item.outlineCatalog.split('.').length > 1 && /^[3.]/.test(item.outlineCatalog)) {
                            data.isVisible = 0;
                        }
                        if ([8, 9].includes(item.outlineType)) {
                            data.appendix = true;
                            data.letter = $global.numberToLetters(parseInt(item.outlineCatalog) - 1);
                            data.docattr = item.outlineType === 8 ? 'specs' : 'means';
                        }
                        data.label = ([8, 9].includes(data.outlineType) ? '附录' : '') + (data.outlineCatalog||'') + ' ' + data.outlineTitle;
                        var customLabel = ([8, 9].includes(data.outlineType) ? '附录' : '') + ([1, 2, 11, 12].includes(data.outlineType) ? data.outlineTitle : data.outlineCatalog||'');
                        data.customLabel = customLabel;
                        return data;
                    });
                    // 重置大纲排序（按类型、顺序号）
                    var outlineTree = $global.handleTree(_.orderBy(outlineList, ['outlineType', 'orderNum']), 'outlineId', 'parentId', 'children', '0');
                    return outlineTree;
                } else {
                    this.$message.error('文档错误，无大纲数据！');
                    this.loading = false;
                    return null;
                }
            },
        },
        mounted() {
            this.getTableMaxHeight();
            window.onresize = _.debounce(this.getTableMaxHeight, 150);
        }
    }
</script>

<style lang="scss" scoped>
    .info-comparise-container {
        height: 100%;
        display: flex;
        flex-direction: column;
        >h3 {
            line-height: 2;
            text-align: center;
        }
        .datas{
            flex:1;
            display: flex;
            >div{
                width: 50%;
                /* display: flex;
                flex-direction: column; */
                >h3{
                    padding: 3px 5px;
                    height: 30px;
                }

            }
            ::v-deep .el-table {
                // flex:1;
                height: calc(100% - 30px);
                .active{
                    background-color: #fdf9f3;
                }
                .cell{
                    white-space: normal;
                    .el-table__placeholder{
                        display: none;
                    }
                    .empty{
                        color: #e3e3e3;
                        &::after{
                            content: "无比对内容";
                        }
                    }
                    ins{
                        background-color: #fadad7;
                        color: #b30000;
                        text-decoration: none;
                        cursor:pointer;
                    }
                    del{
                        background-color: #eaf2c2;
                        color: #406619;
                        text-decoration: none;
                        cursor:pointer;
                    }
                }
            }
        }
        .btns{
            padding: 10px;
            height: 52px;
            text-align: center;
            box-sizing: border-box;
        }
    }
</style>
