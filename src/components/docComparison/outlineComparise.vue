<template>
    <section class="comparison-editor-container">
        <div v-if="sourceData">
            <h3>
                <span>比对文档：{{sourceData.stdName}}</span>
            </h3>
            <div class="doc-list-content" v-loading="loadingSource" element-loading-text="正在加载原文档...">
                <sam-editor ref="sourceEditor" name="sourceEditor" v-if="editorSourceSetting!==null" :data="editorSourceSetting" @change="changeEvent($event, 'source')" />
            </div>
        </div>
        <div v-if="targetData">
            <h3>
                <span>被比对文档：{{targetData.stdName}}</span>
            </h3>
            <div class="doc-list-content" v-loading="loadingTarget" element-loading-text="正在加载比对文档...">
                <sam-editor ref="targetEditor" name="targetEditor" v-if="editorTargetSetting!==null" :data="editorTargetSetting" @change="changeEvent($event, 'target')" />
            </div>
        </div>
        <div class="result-content">
            <header>
                <treeselect
                    size="mini"
                    v-model="outlineIds"
                    :disabled="ctype!=='chapter'"
                    :options="sourceOutlineList"
                    :value-consists-of="valueConsistsOf"
                    :normalizer="normalizer"
                    :defaultExpandLevel="3"
                    multiple
                    searchable
                    clearable
                    placeholder="选择章节"
                    style="margin-right: 10px; width: 280px;">
                    <div slot="value-label" slot-scope="{ data, node }">{{ data.customLabel || data.outlineTitle }}-{{node.label}}</div>
                </treeselect>
                <el-button size="mini" type="primary" @click.stop.prevent="executecomparise" :disabled="!outlineIds.length || loadingSource || loadingTarget">比对</el-button>
                <el-button size="mini" @click.stop.prevent="$emit('close')">关闭</el-button>
            </header>
            <main v-loading="loadingComparise" element-loading-text="正在处理比对中,请等候完成...">
                <outline-component v-if="compariseResult.length" :thresholdValue="data.thresholdValue" :data="compariseResult" @change="changeComparise" />
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
    import { listOutline, outlineStructList, getDocument } from '@/api/outline.js';
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
        name: 'comparison-outline',
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
                    if (!_.isEmpty(data)) {
                        this.setEditorSetting();
                    }
                    /* if (!this.listTemplate.length) {
                        this.getTempList();
                    } else {
                        this.setEditorData();
                    } */
                },
                immediate: true,
                deep: true
            },
        },

        data() {
            return {
                listTemplate: [],
                /* editorSetting: Object.assign(readerEditorOptions, {
                    editorURL: this.data.editorURL,
                    nodeURL: this.data.nodeURL,
                    reader: true,
                    struct: true,
                    zoomIn: false,
                }), */
                loadingSource: true,
                loadingTarget: true,
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
                allOutlineList: [], // 所有章节集合
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
                if (txtNode.nodeName === 'DEL' || from === 'source') {
                    highlightResult = await this.sourceInstance.interFaceAction({ act: 'highlightText', text: txtNode.textContent, container, cls: 'source' });
                } else {
                    highlightResult = await this.targetInstance.interFaceAction({ act: 'highlightText', text: txtNode.textContent, container, cls: 'target' });
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
                /* console.log('changecomparise', obj)
                debugger */
                var sourceNode, targetNode;
                if (obj.node) { // 比对结果的元素点击
                    if (obj.node.dataset.pos) {
                        var nodeDom;
                        switch (obj.node.nodeName) {
                            case 'DEL': // 缺少的部分
                                nodeDom = obj.comparised.sourceNode;
                                await this.setHighlight(obj.comparised.sourceNode, obj.node, 'source');
                                break;
                            case 'INS': // 新增的部分
                                this.onEditor = 'target';
                                nodeDom = obj.comparised.targetNode;
                                if (obj.item.targetItem) {
                                    await this.setHighlight(obj.comparised.targetNode, obj.node, 'target');
                                }
                                break;
                        }
                        // 定位比对文档的章节
                        await this.sourceInstance.interFaceAction({ act: 'foucsId', outlineId: obj.item.sourceItem.outlineId, syncScroll:true });
                        // 定位被比对文档的章节
                        if (!_.isEmpty(obj.item.targetItem)) {
                            await this.targetInstance.interFaceAction({ act: 'foucsId', outlineId: obj.item.targetItem.outlineId, syncScroll:true });
                        }
                    }
                    // 定位比对文档的元素
                    if (obj.comparised.sourceNode) {
                        sourceNode = obj.comparised.sourceNode.nodeName !== '#text' ? obj.comparised.sourceNode : obj.comparised.sourceNode.parentNode;
                    }
                    // 定位被比对文档的元素
                    if (obj.comparised.targetNode) {
                        targetNode = obj.comparised.targetNode.nodeName !== '#text' ? obj.comparised.targetNode : obj.comparised.targetNode.parentNode;
                    }

                } else { // 章节点击
                    sourceNode = await this.sourceInstance.interFaceAction({ act: 'foucsId', outlineId: obj.item.sourceItem.outlineId, syncScroll:true });
                    if (!_.isEmpty(obj.item.targetItem)) {
                        targetNode = await this.targetInstance.interFaceAction({ act: 'foucsId', outlineId: obj.item.targetItem.outlineId, syncScroll:true });
                    }
                }

                if (sourceNode) {
                    await this.sourceInstance.interFaceAction({ act: 'scrollToElement', node: sourceNode });
                }
                if (targetNode) {
                    await this.targetInstance.interFaceAction({ act: 'scrollToElement', node: targetNode });
                }

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
                        if (from === 'source') {
                            this.sourceInstance = this.$refs.sourceEditor;
                            let outlineData = await this.sourceInstance.interFaceAction({ act:'get_outline' });
                            console.log('outlineData===>', outlineData)
                            // debugger
                            if (outlineData && outlineData.length) {
                                outlineData = this.setOutlineItem(outlineData);
                                this.allOutlineList = _.cloneDeep(outlineData);

                                this.sourceOutlineList = $global.handleTree(_.orderBy(outlineData, ['outlineType', 'levelNum', 'orderNum']), 'outlineId', 'parentId', 'children', '0');
                                console.log('this.sourceOutlineList===>', this.sourceOutlineList)
                            }
                            this.loadingSource = false;
                        } else {
                            this.targetInstance = this.$refs.targetEditor;
                            let outlineData = await this.targetInstance.interFaceAction({ act:'get_outline' });
                            if (outlineData && outlineData.length) {
                                outlineData = this.setOutlineItem(outlineData);
                                this.targetOutlineList = $global.handleTree(_.orderBy(outlineData, ['outlineType', 'levelNum', 'orderNum']), 'outlineId', 'parentId', 'children', '0');
                                console.log('this.targetOutlineList===>', this.targetOutlineList)
                            }
                            // this.targetInstance.interFaceAction({ act:'reset_catalogue' });
                            this.loadingTarget = false;
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
                        }
                        break;
                }
            },

            /**
             * @description 根据已选章节或条目进行比对
             */
            async executecomparise() {
                this.compariseChapter();
            },

            /**
             * @description ID做排序
             * @param {Array} ids 已选中的ID
             * @returns
             */
            orderByIds(ids=[]) {
                var items = [];
                ids.forEach(id => {
                    let item = _.find(this.allOutlineList, { outlineId: id});
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

                outlineIds = outlineIds || this.outlineIds;
                this.loadingComparise = true;

                // 处理所有节点的排序和重复
                outlineIds = _.uniq(this.orderByIds(outlineIds));

                // s1.列出源比对章节
                this.sourceOutlineItems = [];
                console.log('this.allOutlineList', this.allOutlineList)
                // debugger
                for (var i = 0; i < outlineIds.length; i++) {
                    let id = outlineIds[i];
                    let item = _.find(this.allOutlineList, { outlineId:id });
                    if (item) {
                        if (item.parentId !== '0') { // 非ROOT节点
                            // 定位到节点获取DOM
                            console.log('this.sourceInstance=>', this.sourceInstance)
                            let outlineNode = await this.sourceInstance.interFaceAction({ act: 'foucsId', outlineId: item.outlineId, outNode: true });
                            // debugger
                            if (outlineNode) {
                                item.outlineNode = outlineNode;
                                // 移除已存在的
                                let isExistIndex = _.findIndex(this.sourceOutlineItems, { outlineId: id });
                                if (!~isExistIndex) {
                                    delete item.children;
                                    this.sourceOutlineItems.push(item);
                                }
                            }
                        } else { // ROOT节点则提取所有子集outlineId再重新处理
                            outlineIds = this.allOutlineList.filter(o => { return o.parentId !== '0' }).map(o => { return o.outlineId; });
                            this.compariseChapter(outlineIds);
                            return false;
                        }
                    }
                }

                if (!this.sourceOutlineItems.length) {
                    this.$message.error('无可进行比对的章节！');
                    this.loadingComparise = false;
                    return false;
                }
                // 按规则排序
                this.sourceOutlineItems = _.orderBy(this.sourceOutlineItems, ['outlineType', 'levelNum', 'orderNum']);

                // S2.列出目标章节
                var targetAllItems = [];
                $global.recurrence(this.targetOutlineList[0]['children'], item => {
                    targetAllItems.push(item);
                });
                // 再按源比对章节章节取出目标章节
                this.targetOutlineItems = [];
                for (var i = 0; i < this.sourceOutlineItems.length; i++) {
                    let item = this.sourceOutlineItems[i];
                    let matchObj = { outlineType: item.outlineType };
                    if (item.outlineCatalog.match(/\./ig) !== null) {
                        matchObj.outlineCatalog = item.outlineCatalog;
                    }
                    // 取出匹配的章节条目
                    let targetItem = _.find(targetAllItems, matchObj);
                    if (targetItem) {
                        // 定位到节点获取DOM
                        targetItem.outlineNode = await this.targetInstance.interFaceAction({ act: 'foucsId', outlineId: targetItem.outlineId, outNode: true });
                        this.targetOutlineItems.push(targetItem);
                    }
                }
                // 执行章节条目比对，输出结果
                this.compariseResult = outlineComparise(this.sourceOutlineItems, this.targetOutlineItems);
                this.loadingComparise = false;
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

            async setEditorSetting(from = '') {
                let res;
                //
                if (this.data.sourceId) {
                    // 获取文档信息
                    res = await getDocument(this.data.sourceId, this.data.editorURL);
                    if (res && res.data) {
                        this.sourceData = _.pick(res.data, ['stdNo','stdName','stdKind','stdTitle']);
                        // this.getOutlineList({docId:this.data.sourceId}, 'source');
                    }
                    this.editorSourceSetting = _.merge(readerEditorOptions, {
                        editorURL: this.data.editorURL,
                        nodeURL: this.data.nodeURL,
                        reader: true,
                        struct: true,
                        page: {
                            expand: true,
                            id: this.data.sourceId
                        }
                    })
                }

                if (this.data.targetId) {
                    $global.sleep(2000);
                    res = await getDocument(this.data.targetId, this.data.editorURL);
                    if (res && res.data) {
                        this.targetData = _.pick(res.data, ['stdNo','stdName','stdKind','stdTitle']);
                        // this.getOutlineList({docId:this.data.targetId}, 'target');
                    }
                    this.editorTargetSetting = _.merge(readerEditorOptions, {
                        editorURL: this.data.editorURL,
                        nodeURL: this.data.nodeURL,
                        reader: true,
                        struct: true,
                        page: {
                            expand: true,
                            id: this.data.targetId
                        }
                    });
                }
            },
            /**
             * @description 设置文档在编辑器中的数据
             */
            /* async setEditorData() {
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
                    this.setEditorSetting('target');
                }
            }, */
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
                        if (res && this.outlineIds.length) {
                            this.compariseChapter();
                        }
                        this.loadingTarget = false;
                    }
                }
            },

            setOutlineItem(outlineList=[]) {
                return outlineList.map(item => {
                    let data = _.omit(item, ['docId', 'ancestors', 'isAsc', 'pageNum',
                        'pageSize', 'remark', 'delFlag', 'orderByColumn', 'infoNum', 'locked',
                        'extendContent', 'updateUser', 'updateTime', 'commitId', 'params',
                        'tagList', 'createTime', 'deleteTime', 'deleteUser', 'searchValueArray',
                        'createUser', 'searchValue'
                    ]);
                    if (data.parentId != '0') {
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
                        data.label = ([8, 9].includes(data.outlineType) ? '附录' : '') + data.outlineCatalog + ' ' + data.outlineTitle;
                        var customLabel = ([8, 9].includes(data.outlineType) ? '附录' : '') + ([1, 2, 11, 12].includes(data.outlineType) ? data.outlineTitle : data.outlineCatalog);
                        // debugger
                        data.customLabel = customLabel;
                    }

                    return data;
                });
            },

            /**
             * @description 获取大纲列表
             */
            async getOutlineList(data = {}, from = 'source') {
                /* var res = {};
                if (this.data.private) {
                    res = await listOutline({ docId: data.docId }, this.data.editorURL);
                } else {
                    res = await outlineStructList({ docId: data.docId }, this.data.editorURL);
                } */
                var res = await listOutline({ docId: data.docId }, this.data.editorURL);

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
                        data.label = ([8, 9].includes(data.outlineType) ? '附录' : '') + data.outlineCatalog + ' ' + data.outlineTitle;
                        var customLabel = ([8, 9].includes(data.outlineType) ? '附录' : '') + ([1, 2, 11, 12].includes(data.outlineType) ? data.outlineTitle : data.outlineCatalog);
                        data.customLabel = customLabel;
                        return data;
                    });

                    // 重置大纲排序（按类型、顺序号）
                    var outlineData = $global.handleTree(_.orderBy(outlineList, ['outlineType', 'levelNum', 'orderNum']), 'outlineId', 'parentId', 'children', '0');
                    if (from === 'source') {
                        this.sourceOutlineList = outlineData;
                        this.allOutlineList = [outlineData[0]];
                        $global.recurrence(outlineData[0]['children'], obj => {
                            this.allOutlineList.push(obj);
                        });
                    } else {
                        this.targetOutlineList = outlineData;
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
            /* async getTempList() {
                const { code, rows } = await listContentTemplate({}, this.data.editorURL);
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
            }, */

            destory() {
                if (this.sourceInstance) {
                    this.sourceInstance.interFaceAction({ act: 'destroy' });
                }
                if (this.targetInstance) {
                    this.targetInstance.interFaceAction({ act: 'destroy' });
                }
                this.sourceData = null;
                this.targetData = null;
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
            // this.autoZoom();
            // window.onresize = _.debounce(() => { this.autoZoom(true) }, 150);
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
