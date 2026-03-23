<template>
    <section class="comparison-editor-container">
        <div v-if="sourceData">
            <h3>
                <span>{{sourceData.compareText||'比对文档'}}：{{sourceData.stdName}}</span>
                <el-dropdown v-if="data.sourceData.length>1" trigger="click" style="float:right; margin:5px 5px 0;" @command="handleSelectDoc($event, 'source')">
                    <span class="el-dropdown-link">
                        其他文档<i class="el-icon-arrow-down el-icon--right"></i>
                    </span>
                    <el-dropdown-menu slot="dropdown">
                        <el-dropdown-item v-for="(item, idx) in data.sourceData.filter(o=> o.docId!==sourceData.docId)" :key="idx" :command="item">{{item.stdName}}</el-dropdown-item>
                    </el-dropdown-menu>
                </el-dropdown>
                <!-- <el-slider v-model="pageZoom" :format-tooltip="formatTooltip" @change="changeZoom"/> -->
            </h3>
            <div class="doc-list-content" v-loading="loadingSource" :element-loading-text="`正在加载${sourceData.stdName}文档...`">
                <sam-editor ref="sourceEditor" v-if="editorSourceSetting!==null" :data="editorSourceSetting" @change="changeEvent($event, 'source')" />
            </div>
        </div>
        <div v-if="targetData">
            <h3>
                <span>{{targetData.compareText||'被比对文档'}}：{{targetData.stdName}}</span>
                <el-dropdown v-if="data.targetData.length>1" trigger="click" style="float:right; margin:5px 5px 0;" @command="handleSelectDoc($event, 'target')">
                    <span class="el-dropdown-link">
                        其他文档<i class="el-icon-arrow-down el-icon--right"></i>
                    </span>
                    <el-dropdown-menu slot="dropdown">
                        <el-dropdown-item v-for="(item, idx) in data.targetData.filter(o=> o.docId!==targetData.docId)" :key="idx" :command="item">{{item.stdName}}</el-dropdown-item>
                    </el-dropdown-menu>
                </el-dropdown>
            </h3>
            <div class="doc-list-content" v-loading="loadingTarget" :element-loading-text="`正在加载${targetData.stdName}文档...`">
                <sam-editor ref="targetEditor" v-if="editorTargetSetting!==null" :data="editorTargetSetting" @change="changeEvent($event, 'target')" />
            </div>
        </div>
        <div class="result-content">
            <header>
                <treeselect
                    size="mini"
                    v-model="outlineIds"
                    :flat="true"
                    :disabled="ctype!=='chapter'"
                    :options="outlineTree"
                    :value-consists-of="valueConsistsOf"
                    :normalizer="normalizer"
                    :defaultExpandLevel="3"
                    multiple
                    searchable
                    clearable
                    placeholder="选择比对的章节"
                    style="margin-right: 10px; width: 280px;">
                    <div slot="value-label" slot-scope="{ node }">{{ node.raw.customLabel }}</div>
                </treeselect>
                <el-button size="mini" type="primary" @click.stop.prevent="executecomparise" :disabled="!outlineIds.length || loadingSource || loadingTarget">比对</el-button>
                <el-button size="mini" @click.stop.prevent="$emit('close')">关闭</el-button>
            </header>
            <main v-loading="loadingComparise" element-loading-text="正在处理比对中,请等候完成...">
                <outline-component v-if="compariseResult.length" :thresholdValue="data.thresholdValue" :hideEmpty="data.hideEmptyCompare" :data="compariseResult" @change="changeComparise" />
                <p v-else style="padding:10px;">请选择需要比对的章节</p>
            </main>
        </div>
    </section>
</template>

<script>
    import samEditor from "@/components/samEditor/samEditor.vue";
    // 编辑器基础配置文件
    import { readerEditorOptions } from '@/components/tinymceEditor/configs/editorOptions';
    // API接口
    import { listOutline, outlineStructList } from '@/api/outline';
    import { listContentTemplate } from '@/api/editor';
    // 文档转换HTML模块
    import parseStructHtml from "@/components/tinymceEditor/utils/parseStructFromHtml";
    // 全局方法
    import $global from '@/utils/global';
    // 树形选择器
    import Treeselect from '@riophae/vue-treeselect';
    import '@riophae/vue-treeselect/dist/vue-treeselect.css';
    // 比对算法模型
    import { outlineComparise } from '@/utils/compariseUtil';
    // 章节比对组件
    import outlineComponent from './outline';

    export default {
        name: 'omparison-editor',
        components: {
            samEditor,
            Treeselect,
            outlineComponent
        },
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
                    if (!this.listTemplate.length) {
                        this.getTempList();
                    } else {
                        this.setEditorData();
                    }
                },
                immediate: true,
                deep: true
            },
        },
        data() {
            return {
                listTemplate: [],
                editorSetting: Object.assign(readerEditorOptions, {
                    editorURL: this.data.editorURL||this.data.editorSetting.editorURL,
                    nodeURL: this.data.nodeURL||this.data.editorSetting.nodeURL,
                    reader: true,
                    struct: true,
                    zoomIn: false,
                    hideToTop: true,
                    hideSideBar: true,
                    htmlContent: '<div class="page-container"><div class="info-block"><p>加载文档中</p></div></div>'
                }),
                loadingSource: true,
                loadingTarget: true,
                outlineTree: [],
                sourceOutlineList: [],
                targetOutlineList: [],
                outlineIds: [], // 勾选的章节
                sourceData: null,
                targetData: null,
                editorSourceSetting: null,
                editorTargetSetting: null,
                result: [],
                sourceInstance: null,
                targetInstance: null,
                ctype: 'chapter',
                valueConsistsOf: 'ALL', // BRANCH_PRIORITY
                typeOptions: [{ value: 'info', label: '题录比对' }, { value: 'doc', label: '全文比对' }, { value: 'chapter', label: '章节比对' }],
                allOutlineList: [], // 原文所有章节集合
                sourceAllOutline: [], // 比对原文所有章节
                targetAllOutline: [], // 比对文档所有章节
                sourceOutlineItems: [], // 选择的比对章节 条目
                targetOutlineItems: [],
                loadingComparise: false,
                compariseResult: [], // 比对结果
                isScrolling: false,
                onEditor: 'source',
                pageZoom: 1,
            }
        },
        methods: {
            formatTooltip(val) {
                return '缩放比率：' + val + '%';
            },
            /**
             * @description 更新缩放比率
             */
            changeZoom() {
                // console.log(this.pageZoom);
                this.sourceInstance.interFaceAction({ act: 'setPageZoom', value:this.pageZoom });
                this.targetInstance.interFaceAction({ act: 'setPageZoom', value:this.pageZoom });
            },

            /**
             * @description 根据文字内容获取位置
             */
            getPosByText(allText = '', text = '') {
                var positions = new Array();
                if (text) {
                    var pos = allText.indexOf(text);
                    while (pos > -1) {
                        positions.push(pos); // 将出现位置赋给数组
                        pos = allText.indexOf(text, pos + 1);
                    }
                }
                return positions;
            },

            /**
             * @description 文字内容高亮显示
             */
            async setHighlight(container = null, txtNode = null, from = '') {
                // 直接调用高亮显示接口
                var highlightResult;
                if (txtNode.nodeName === 'DEL' || from === 'target') {
                    highlightResult = await this.sourceInstance.interFaceAction({ act: 'highlightText', text: txtNode.textContent, id:txtNode.dataset.id, container, cls: 'target' });
                } else {
                    highlightResult = await this.targetInstance.interFaceAction({ act: 'highlightText', text: txtNode.textContent, id:txtNode.dataset.id, container, cls: 'source' });
                }
                return highlightResult;
            },

            /**
             * @description 右侧比对元素点击事件上报
             * @param {Object} obj
             */
            async changeComparise(obj) {
                this.isScrolling = true;
                this.onEditor = 'source';
                var sourceNode, targetNode;
                if (obj.node) { // 比对结果的元素点击
                    if (obj.node.dataset.pos) {
                        var nodeDom;
                        switch (obj.node.nodeName) {
                            case 'DEL': // 缺少的部分
                                nodeDom = obj.comparised.targetNode;
                                await this.setHighlight(obj.comparised.targetNode, obj.node, 'target');
                                break;
                            case 'INS': // 新增的部分
                                this.onEditor = 'source';// 'target';
                                nodeDom = obj.comparised.sourceNode;
                                if (obj.item.sourceItem) {
                                    await this.setHighlight(obj.comparised.sourceNode, obj.node, 'source');
                                }
                                break;
                        }
                        // 定位比对文档的章节
                        await this.targetInstance.interFaceAction({ act: 'foucsId', outlineId: obj.item.targetItem.outlineId, syncScroll:true });
                        // 定位被比对文档的章节
                        if (!_.isEmpty(obj.item.sourceItem)) {
                            await this.sourceInstance.interFaceAction({ act: 'foucsId', outlineId: obj.item.sourceItem.outlineId, syncScroll:true });
                        }
                    }
                    // 定位比对文档的元素
                    if (obj.comparised.targetNode) {
                        targetNode = obj.comparised.targetNode.nodeName !== '#text' ? obj.comparised.targetNode : obj.comparised.targetNode.parentNode;
                    }
                    // 定位原文文档的元素
                    if (obj.comparised.sourceNode) {
                        sourceNode = obj.comparised.sourceNode.nodeName !== '#text' ? obj.comparised.sourceNode : obj.comparised.sourceNode.parentNode;
                    }

                } else { // 章节点击
                    targetNode = await this.targetInstance.interFaceAction({ act: 'foucsId', outlineId: obj.item.targetItem.outlineId, syncScroll:true });
                    if (!_.isEmpty(obj.item.sourceItem)) {
                        targetNode = await this.sourceInstance.interFaceAction({ act: 'foucsId', outlineId: obj.item.sourceItem.outlineId, syncScroll:true });
                    }
                }

                /* if (sourceNode) {
                    await this.sourceInstance.interFaceAction({ act: 'scrollToElement', node: sourceNode });
                }
                if (targetNode) {
                    await this.targetInstance.interFaceAction({ act: 'scrollToElement', node: targetNode });
                } */

                setTimeout(() => {
                    this.isScrolling = false;
                }, 3000)
            },

            /**
             * @description 编辑器事件上报
             */
            async changeEvent(data = {}, from = 'source') {
                if (!['onScroll', 'mouseoverEvent'].includes(data.act)) {
                    console.log(data, from)
                }
                switch (data.act) {
                    case 'loaded': // 文档加载完成
                        // this.autoZoom();
                        // debugger
                        if (from === 'source') {
                            this.sourceInstance = this.$refs.sourceEditor;
                            await this.sourceInstance.interFaceAction({ act: 'resetContent', htmlContent: this.sourceData.htmlContent, pageData: this.sourceData });
                            this.loadingSource = false;
                            // 等待原文档加载完成后在加载比对文档
                            this.setEditorSetting('target');
                        } else {
                            this.targetInstance = this.$refs.targetEditor;
                            await this.targetInstance.interFaceAction({ act: 'resetContent', htmlContent: this.targetData.htmlContent, pageData: this.targetData });
                            this.loadingTarget = false;
                        }

                        if (this.sourceInstance && this.targetInstance && this.targetAllOutline.length && !this.loadingTarget) {
                            this.outlineIds = this.targetAllOutline.map(o => { return o.outlineId });
                            // 默认直接执行比对
                            if (this.data.executeCompare) {
                                this.executecomparise();
                            }
                        }
                        break;
                    case 'mouseoverEvent': // 鼠标hover
                        this.onEditor = from;
                        break;
                    case 'onScroll': // 同步滚动，如果正在定位滚动中则不处理
                        // console.log('this.onEditor', this.onEditor)
                        if (!this.isScrolling) {
                            if (from === 'source' && this.onEditor === 'source') {
                                this.targetInstance.interFaceAction({ act: 'scrollTop', top: data.top });
                            } else if (from === 'target' && this.onEditor === 'target') {
                                this.sourceInstance.interFaceAction({ act: 'scrollTop', top: data.top });
                            }
                            // console.log('onScroll', data, from)
                        }
                        break;
                }
            },

            /**
             * @description 根据已选章节或条目进行比对
             */
            async executecomparise() {
                switch (this.ctype) {
                    case 'info': // 题录比对
                        this.compariseDocument();
                        break;
                    case 'doc': // 全文比对
                        break;
                    case 'chapter':
                        this.compariseChapter();
                        break;
                }
            },
            async compariseDocument() {
                var resultArr = [];
                var sourceData = _.omit(_.cloneDeep(this.sourceData), ['wordPath', 'wpsPath', 'xmlPath', 'stdPhase', 'jsonPath', 'isAsc', 'pdfPath', 'stdId', 'htmlContent', 'createTime', 'docId']);
                for (let key in sourceData) {
                    let sourceValue = this.sourceData[key];
                    let targetValue = this.targetData[key];
                    if (sourceValue !== undefined) {

                    }
                }
                // console.log('compariseDocument', this.sourceData, this.targetData);
            },

            /**
             * @description ID做排序
             * @param {Array} ids 已选中的ID
             * @returns
             */
            orderByIds(ids=[]) {
                var items = [];
                ids.forEach(id => {
                    let item = _.find(this.targetAllOutline, { outlineId: id});
                    items.push({
                        id,
                        outlineType: item.outlineType,
                        orderNum: item.orderNum,
                        levelNum: item.levelNum
                    })
                })
                items = _.orderBy(items, ['outlineType', 'levelNum', 'orderNum']);
                return items.map(item => { return item.id });
            },

            /**
             * @description 比对章节
             * @param {Array|undefined} outlineIds 已选中的ID
             */
            async compariseChapter(outlineIds) {
                if (!this.outlineIds.length) {
                    this.$message.error('请选择需要比对的章节条款！');
                    return;
                }
                await this.sourceInstance.interFaceAction({ act: 'clearCompare' });
                await this.targetInstance.interFaceAction({ act: 'clearCompare' });

                outlineIds = outlineIds || this.outlineIds;
                this.loadingComparise = true;
                // 处理所有节点的排序和重复
                outlineIds = _.uniq(this.orderByIds(outlineIds));

                // s1.列出比对章节
                this.targetOutlineItems = [];

                const setOutlineChapter = async (ids) => {
                    for (var i = 0; i < outlineIds.length; i++) {
                        let id = ids[i];
                        let item = _.find(this.targetAllOutline, { outlineId:id });
                        if (item) {
                            if (item.parentId !== '0') { // 非ROOT节点
                                // 定位到节点获取DOM
                                let outlineNode = await this.targetInstance.interFaceAction({ act: 'foucsId', outlineId: item.outlineId, outNode: true });
                                if (outlineNode) {
                                    item.outlineNode = outlineNode;
                                    // 移除已存在的
                                    let isExistIndex = _.findIndex(this.targetOutlineItems, { outlineId: id });
                                    if (!~isExistIndex) {
                                        delete item.children;
                                        this.targetOutlineItems.push(item);
                                    }
                                }
                            } else { // ROOT节点则提取所有子集outlineId再重新处理
                                let childIds = this.targetAllOutline.filter(o => { return o.parentId !== '0' }).map(o => { return o.outlineId; });
                                setOutlineChapter(childIds);
                                return false;
                            }
                        }
                    }
                }

                await setOutlineChapter(outlineIds);

                if (!this.targetOutlineItems.length) {
                    this.$message.error('无可进行比对的章节！');
                    this.loadingComparise = false;
                    return false;
                }
                // 按规则排序
                this.targetOutlineItems = _.orderBy(this.targetOutlineItems, ['outlineType', 'levelNum', 'orderNum']);

                // S2.列出原文目标章节
                // console.log('this.sourceOutlineList===>', this.sourceOutlineList)
                // debugger
                var sourceAllItems = [];
                $global.recurrence(this.sourceOutlineList[0]['children'], item => {
                    sourceAllItems.push(item);
                });

                // 再按原文比对章节章节取出目标章节
                this.sourceOutlineItems = [];
                for (var i = 0; i < this.targetOutlineItems.length; i++) {
                    let item = this.targetOutlineItems[i];
                    let matchObj = { outlineType: item.outlineType };
                    if (item.outlineCatalog && item.outlineCatalog.match(/\./ig) !== null) {
                        matchObj.outlineCatalog = item.outlineCatalog;
                    }
                    // 取出匹配的章节条目
                    let sourceItem = _.find(sourceAllItems, matchObj);
                    if (sourceItem) {
                        // 定位到节点获取DOM
                        sourceItem.outlineNode = await this.sourceInstance.interFaceAction({ act: 'foucsId', outlineId: sourceItem.outlineId, outNode: true });
                        this.sourceOutlineItems.push(sourceItem);
                    }
                }

                // 执行章节条目比对，输出结果
                this.compariseResult = outlineComparise(this.targetOutlineItems, this.sourceOutlineItems, this.sourceAllOutline);
                // console.log('this.compariseResult===>', this.compariseResult);

                await this.excuteCompare();

                this.loadingComparise = false;
            },

            // 自动执行比对，并将比对的差异化节点打上标签并高亮显示
            async excuteCompare() {
                let sectionEle = document.createElement('div');
                let delEles = null, insEles = null;
                for(let item of this.compariseResult) {
                    for (let comparised of item.comparised) {
                        if (comparised.html && comparised.html.percent) {
                            // console.log(comparised.html);
                            sectionEle.innerHTML = comparised.html.htmlContent;
                            delEles = Array.from(sectionEle.querySelectorAll('del'));
                            insEles = Array.from(sectionEle.querySelectorAll('ins'));
                            for(let ele of delEles) {
                                await this.setHighlight(comparised.targetNode, ele, 'target');
                            }
                            for(let ele of insEles) {
                                await this.setHighlight(comparised.sourceNode, ele, 'source');
                            }
                        }
                    }
                }
                sectionEle.remove();

                // await this.sourceInstance.interFaceAction({ act: 'moveTop' });
                // await this.targetInstance.interFaceAction({ act: 'moveTop' });
            },

            /**
             * @description 大纲树定义结构
             */
            normalizer(node) {
                return {
                    id: node.outlineId,
                    label: node.label,
                    children: node.children,
                }
            },

            // 设置编辑器数据
            async setEditorSetting(from = '') {
                if (from === 'source') {
                    this.editorSourceSetting = Object.assign(this.editorSetting, this.data.editorSetting, {
                        reader: true,
                        struct: true,
                        editorId: $global.guid(),
                    });
                } else {
                    // 如果是依次加载文档
                    // await $global.sleep(1000);
                    this.editorTargetSetting = Object.assign(this.editorSetting, this.data.editorSetting, {
                        reader: true,
                        struct: true,
                        editorId: $global.guid(),
                    })
                }
            },
            /**
             * @description 设置文档再编辑器中的数据
             */
            async setEditorData() {
                if (!_.isEmpty(this.data) && this.data.sourceData && this.data.targetData) {
                    this.sourceData = _.cloneDeep(this.data.sourceData[0]);
                    this.targetData = _.cloneDeep(this.data.targetData[0]);
                    // 解析源文档
                    var sourceHtml = await this.getOutlineList(this.sourceData, 'source');
                    if (sourceHtml && sourceHtml.length) {
                        this.sourceData.htmlContent = sourceHtml.join("");
                    } else {
                        this.sourceData.htmlContent = '<div class="page-container reader"><div class="info-block"><p>无法获取文档内容</p></div></div>';
                    }
                    this.setEditorSetting('source');

                    // 解析目标文档
                    var targetHtml = await this.getOutlineList(this.targetData, 'target');
                    if (targetHtml && targetHtml.length) {
                        this.targetData.htmlContent = targetHtml.join("");
                    } else {
                        this.targetData.htmlContent = '<div class="page-container reader"><div class="info-block"><p>无法获取文档内容</p></div></div>';
                    }
                }
            },
            /**
             * @description 选择其他文档重新加载
             * @param{Object} item 文档数据
             */
            async handleSelectDoc(item = {}, from='target') {
                console.log('handleSelectDoc==>', item);
                if (from === 'source') {
                    this.loadingSource = true;
                    this.sourceData = _.cloneDeep(item);
                } else {
                    this.loadingTarget = true;
                    this.targetData = _.cloneDeep(item);
                }

                var targetHtml = await this.getOutlineList(this.targetData, from);
                if (targetHtml && targetHtml.length) {
                    this.targetData.htmlContent = targetHtml.join("");
                    this.setEditorSetting('target');
                    if (this.targetInstance) {
                        let res = await this.targetInstance.interFaceAction({ act: 'resetContent', htmlContent: this.targetData.htmlContent, pageData: this.sourceData });
                        this.loadingTarget = false;
                    }
                }
            },

            /**
             * @description 获取大纲列表
             */
            async getOutlineList(data = {}, from = 'source') {
                var res = {};
                if (this.data.private) {
                    res = await listOutline({ docId: data.docId }, this.data.editorURL||this.data.editorSetting.editorURL);
                } else {
                    res = await outlineStructList({ docId: data.docId }, this.data.editorURL||this.data.editorSetting.editorURL);
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
                        if (item.outlineCatalog && item.outlineCatalog.split('.').length > 1 && !item.outlineTitle) {
                            data.isVisible = 0;
                        }
                        if ([8, 9].includes(item.outlineType)) {
                            data.appendix = true;
                            data.letter = $global.numberToLetters(parseInt(item.outlineCatalog) - 1);
                            data.docattr = item.outlineType === 8 ? 'specs' : 'means';
                        }
                        // debugger
                        data.label = ([8, 9].includes(data.outlineType) ? '附录' : '') + (data.outlineCatalog||'') + ' ' + data.outlineTitle;
                        var customLabel = ([8, 9].includes(data.outlineType) ? '附录' : '') + ([1, 2, 11, 12].includes(data.outlineType) ? data.outlineTitle : data.outlineCatalog||'');
                        data.customLabel = customLabel;
                        return data;
                    });

                    // 重置大纲排序（按类型、顺序号）
                    var outlineData = $global.handleTree(_.orderBy(outlineList, ['outlineType', 'levelNum', 'orderNum']), 'outlineId', 'parentId', 'children', '0');
                    if (from === 'source') {
                        this.sourceOutlineList = outlineData;
                        this.sourceAllOutline = [];
                        $global.recurrence(outlineData[0]['children'], obj => {
                            this.sourceAllOutline.push(obj);
                        });

                        // this.allOutlineList = []; // outlineData[0]
                        $global.recurrence(outlineData[0]['children'], obj => {
                            this.allOutlineList.push(obj);
                        });
                    } else {
                        this.outlineTree = _.cloneDeep(outlineData);

                        this.targetOutlineList = outlineData;
                        this.targetAllOutline = [];
                        $global.recurrence(outlineData[0]['children'], obj => {
                            this.targetAllOutline.push(obj);
                        });
                    }
                    // 解析文档
                    return this.getDocContent(data, outlineData);
                } else {
                    this.$message.error('文档无大纲数据！');
                    if (from === 'source') {
                        this.loadingSource = false;
                    } else {
                        this.loadingTarget = false;
                    }
                    return null;
                }

            },

            /**
             * @description 解析文档内容
             */
            async getDocContent(data = {}, outlineData = []) {
                var htmlArr = [
                    `<div class="page-container reader" data-id="${data.docId}" data-no="${data.stdNo}">`
                ];
                var coverTemp = _.find(this.listTemplate, {
                    'tmplType': data.stdKind,
                    'tmplName': 'cover'
                });
                // 定义封面HTML内容
                var coverHtmlData = parseStructHtml.parseCoverHtml(data, coverTemp, this.editorSetting);
                // 解析大纲的HTML内容
                if (coverHtmlData) {
                    let pageNo = coverHtmlData.pageNo;
                    htmlArr.push(coverHtmlData.htmlContent);
                    if (outlineData && outlineData.length) {
                        var outlineHtmlArr = parseStructHtml.parseHtmlByOutline(outlineData, pageNo, data.stdKind, this.listTemplate);
                        htmlArr = htmlArr.concat(outlineHtmlArr);
                    }
                } else {
                    htmlArr.push(`<div class="info-block"><p>无法读取封面模板内容！</p></div>`);
                }
                htmlArr.push('</div>');
                return htmlArr;
            },

            /**
             * @description 获取文档模板
             */
            async getTempList() {
                const { code, rows } = await listContentTemplate({}, this.data.editorURL||this.data.editorSetting.editorURL);
                if (code === 200) {
                    this.listTemplate = rows.map(item => {
                        item = _.omit(item, ['createTime', 'createUser', 'delFlag',
                            'deleteTime', 'deleteUser', 'isAsc', 'orderByColumn', 'pageNum',
                            'pageSize', 'params', 'remark', 'searchValue', 'searchValueArray',
                            'updateTime', 'updateUser'
                        ]);
                        return item;
                    });
                    this.setEditorData();
                } else {
                    this.$message.error('缺少文档编辑器模板数据！');
                }
            },
            destory() {
                if (this.sourceInstance) {
                    this.sourceInstance.interFaceAction({ act: 'destroy' });
                }
                if (this.targetInstance) {
                    this.targetInstance.interFaceAction({ act: 'destroy' });
                }
                this.sourceData = null;
                this.targetData = [];
                this.result = [];
            },
            autoZoom(isResize=false) {
                var userAgent = navigator.userAgent.toLowerCase();
                var browser = {
                    version: (userAgent.match(/.+(?:rv|it|ra|ie|chrome)[\/: ]([\d.]+)/) || [0, '0'])[1],
                    safari: /webkit/.test(userAgent),
                    opera: /opera/.test(userAgent),
                    msie: /msie/.test(userAgent) && !/opera/.test(userAgent),
                    mozilla: /mozilla/.test(userAgent) && !/(compatible|webkit)/.test(userAgent),
                    chrome: /chrome/.test(userAgent)
                }
                // console.log('browser', browser)
                // if (!browser.mozilla) {
                    var setZoom = parseFloat(window.devicePixelRatio.toFixed(6));
                    var bodyWidth = document.body.clientWidth;
                    var container = document.querySelector('.result-content');
                    if (container && container.offsetWidth) {
                        let width = (bodyWidth - container.offsetWidth) / 2;
                        this.pageZoom = Math.floor((width / 900) * setZoom * 100);
                        if (isResize) {
                            if (this.sourceInstance) {
                                this.sourceInstance.interFaceAction({ act: 'setPageZoom', value:this.pageZoom });
                            }
                            if (this.targetInstance) {
                                this.targetInstance.interFaceAction({ act: 'setPageZoom', value:this.pageZoom });
                            }
                        } else {
                            this.$set(this.editorSetting, 'pageZoom', this.pageZoom);
                        }
                    }
                // }


            }
        },
        beforeDestroy() {
            this.destory();
        },

        mounted() {
            this.autoZoom();
            window.onresize = _.debounce(() => { this.autoZoom(true) }, 150);
        }
    }
</script>

<style lang="scss" scoped>
    .comparison-editor-container {
        height: 100%;
        display: flex;

        >div {
            flex: 1;

            >h3 {
                line-height: 2.5;
                text-align: center;
                background-color: #cbdce5;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                ::v-deep .el-button {
                    float: right;
                    margin-right: 10px;
                }
                ::v-deep .el-slider{
                    width: 100px;
                    display: inline-block;
                    float: right;
                    margin-right: 10px;
                    .el-slider__runway{
                        height: 3px;
                        .el-slider__bar{
                            height: 3px;
                        }
                        .el-slider__button-wrapper{
                            background-color: transparent;
                            top: -12px;
                            width: 12px;
                            height: 12px;
                        }
                    }

                }
            }

            .doc-list-content {
                height: calc(100% - 41px);
            }

            &.result-content {
                flex: 0 0 450px;
                display: flex;
                flex-direction: column;

                header {
                    padding: 10px;
                    display: flex;
                    align-items: center;

                    ::v-deep .vue-treeselect__multi-value {
                        display: flex;
                        align-items: center;
                        word-break: keep-all;
                        overflow: hidden;
                    }
                }

                main {
                    flex: 1;
                    overflow: auto;
                }
            }
        }
    }
</style>
