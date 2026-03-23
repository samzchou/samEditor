<template>
    <div class="quote-container">
        <template v-if="currDoc===null">
            <div class="lists">
                <div class="search">
                    <el-input size="mini" placeholder="关键字检索" v-model="searchKey" clearable @keyup.native.enter="searchList">
                        <el-button slot="append" icon="el-icon-search" @click.stop.prevent="searchList" />
                    </el-input>
                </div>
                <div class="datas" v-loading="loading" element-loading-text="正在加载标准列表,请稍候...">
                    <!-- @row-click="rowClick" -->
                    <el-table size="mini" :data="quoteList" stripe style="width: 100%;">
                        <el-table-column prop="stdNo" label="标准编号" width="150" show-overflow-tooltip />
                        <el-table-column prop="stdName" label="标准名称" show-overflow-tooltip />
                        <el-table-column label="查看详细" width="80">
                            <template slot-scope="scope">
                                <el-button size="small" type="text" icon="el-icon-document" @click.stop.prevent="rowClick(scope.row)">查看</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </div>
            <div class="pages">
                <pagination :pageSize="query.pageSize" :currentPage="query.pageNum" :total="total" @change="pageChange" />
            </div>
        </template>
        <template v-else>
            <section class="doc-info" v-loading="loading" element-loading-text="正在处理文档,请稍候...">
                <div class="tool-bar">
                    <el-button type="text" @click.stop.prevent="actDocEvnt('back')">返回列表</el-button>
                    <el-dropdown style="margin: 0 15px;" @command="handleCommand">
                        <span class="el-dropdown-link">
                            已选条款<i class="el-icon-arrow-down el-icon--right"></i>
                        </span>
                        <el-dropdown-menu slot="dropdown">
                            <el-dropdown-item v-for="(item, idx) in checkedItems" :key="idx" :command="item">
                                {{item.index}} {{item.outlineTitle}}
                            </el-dropdown-item>
                        </el-dropdown-menu>
                    </el-dropdown>
                </div>
                <div class="main">
                    <div class="outline-list">
                        <outline :ref="`outline-${eId}`" :data="outlineData" @change="changeOutline" />
                    </div>
                    <div class="content">
                        <!-- 编辑器组件 -->
                        <tinymceEditor v-if="editorSetting && currDoc" :ref="`tinymceEditor-${eId}`" :name="`tinymceEditor-${eId}`" :data="editorSetting" @change="changeEvent" />
                    </div>
                </div>
            </section>
        </template>
    </div>
</template>

<script>
    import { letters, editorConfig } from "@/components/tinymceEditor/configs/editorOptions";
    // API接口
    import { getDocument, docStructList, outlineStructList, contentTemplateStructList } from '@/api/outline';
    // 文档转换HTML模块
    import parseStructHtml from "@/components/tinymceEditor/utils/parseStructFromHtml";
    // 全局方法
    import $global from '@/utils/global';

    export default {
        name: 'quote-standard',
        components: {
            pagination: () => import('@/components/pagination'),
            outline: () => import('@/components/outline/outline.vue'),
            tinymceEditor: () => import('@/components/tinymceEditor/tinymceEditor.vue'),
        },
        props: {
            keyword: String,
            setting: {
                type: Object,
                default: () => {
                    return {
                        editorURL: process.env.VUE_APP_EDITOR_URL, // JAVA接口地址 process.env.VUE_APP_EDITOR_URL
                        nodeURL: process.env.VUE_APP_REMOTE_API, // nodeServer服务器地址
                        fileURL: process.env.VUE_APP_FILE_URL, // 静态资源文件路径
                        textImgUrl: process.env.VUE_APP_TEXT_IMG_URL
                    };
                }
            }
        },

        computed: {
            eId() {
                return $global.guid();
            }
        },

        watch: {
            keyword(val) {
                this.searchKey = val;
            },
            setting: {
                handler(data) {
                    if (!_.isEmpty(data)) {
                        this.editorSetting = _.merge(editorConfig, data, {
                            editorId: this.eId,
                            zoomIn: true,
                            quoteClause: true,
                            mergeDoc: false,
                            reader: true,
                            menuBar: false,
                            toolbar1: '',
                            toolbar2: '',
                            quickbars: '',
                            hideSideBar: true,
                            page: {
                                expand: true,
                            },
                            draftTimes: 0,
                            htmlContent: '<div class="page-container reader"><div class="info-block"><p>正在加载文档...</p></div></div>'
                        });

                        this.currDoc = null;
                        this.getQuoteList();
                        this.getTempList();
                    }
                },
                immediate: true,
                deep: true
            } 
        },
        data() {
            return {
                topDistance: 0,
                editorInstance: null,
                // eId: $global.guid(),
                tabIndex: '0',
                loading: false,
                searchKey: '',
                quoteList: [],
                total: 0,
                query: {
                    pageNum: 1,
                    pageSize: 20
                },
                listTemplate: [],
                currDoc: null,
                sourceOutLine: [],
                outlineData: [],
                checkedItems: [],
                htmlContent: '',
                editorSetting: null,
                /*editorSetting: {
                    ...editorConfig,
                    zoomIn: true,
                    quoteClause: true,
                    mergeDoc: false,
                    reader: true,
                    menuBar: false,
                    toolbar1: '',
                    toolbar2: '',
                    quickbars: '',
                    hideSideBar: true,
                    page: {
                        expand: true,
                    },
                    draftTimes: 0,
                    htmlContent: '<div class="page-container reader"><div class="info-block"><p>正在加载文档...</p></div></div>'
                }*/
            }
        },
        methods: {
            /**
             * @description 获取已选中的条款
             */
            getValue() {
                var result = [], strArr = [], stdNo;
                this.checkedItems.forEach(item => {
                    if (!stdNo) {
                        stdNo = item.stdNo;
                    }
                    let obj = _.find(result, { stdNo:item.stdNo });
                    if (!obj) {
                        obj = {
                            docId: item.docId,
                            stdNo: item.stdNo,
                            list: [{
                                outlineId: item.outlineId,
                                index: item.index,
                                title: item.outlineTitle,
                                htmlContent: item.htmlContent
                            }]
                        }
                        result.push(obj);
                    } else {
                        obj.list.push({
                            outlineId: item.outlineId,
                            index: item.index,
                            title: item.outlineTitle,
                            htmlContent: item.htmlContent
                        })
                    }
                });
                result.forEach(item => {
                    let listArr = [];
                    item.list.forEach(data => {
                        listArr.push(data.index);
                    });
                    let content = item.stdNo + ' ' + listArr.join("、");
                    strArr.push(content);
                });

                return {
                    values: strArr.join("；"),
                    stdNo,
                    content: JSON.stringify(result)
                };
            },

            /**
             * @description 文档列表行点击
             * @param {Object}  row
             * @param {Object}  column
             * @param {Object}  event
             */
            rowClick(row, column, event) {
                // 当前的文档对象
                this.currDoc = row;
                this.htmlContent = '';
                // 获取文档内容
                this.getOutlineList();
                // 上报父组件事件，窗体全屏
                this.$emit('change', {
                    act: 'fullscreen',
                    value: true
                });
            },

            /**
             * @description 查询文档
             */
            searchList() {
                this.query = {
                    pageNum: 1,
                    pageSize: 20
                }
                this.getQuoteList();
            },

            /**
             * @description 页码组件事件
             * @param {Object}  data
             */
            pageChange(data = {}) {
                this.query.pageNum = data.curPage;
                this.getQuoteList();
            },

            /**
             * @description 工具条按钮事件
             * @param {String}  act
             */
            async actDocEvnt(act) {
                switch (act) {
                    case 'back':
                        this.currDoc = null;
                        if (this.editorInstance) {
                            this.editorInstance.destroy();
                            this.editorInstance = null;
                        }
                        this.$emit('change', {
                            act: 'fullscreen',
                            value: false
                        });
                        break;
                }
            },

            async completeDoc() {
                this.editorInstance.resetContent({ htmlContent:this.htmlContent });
                this.loading = false;
                return true;
            },

            /**
             * @description 编辑器上报事件
             * @param {Object}  data
             */
            async changeEvent(data = {}) {
                /*if (data.act !== 'onScroll') {
                    console.log('changeEvent=>', data)
                }*/
                switch (data.act) {
                    /* case 'onScroll': // 编辑器容器滚动
                        this.topDistance = data.top;
                        break; */
                    case 'loaded': // 编辑器加载完成
                        if (!this.editorInstance) {
                            this.editorInstance = this.$refs[`tinymceEditor-${this.eId}`];
                        }
                        break;
                    case 'initialized':
                        this.completeDoc();
                        break;
                    case 'quoteClause': // 引用条款选中或取消选中
                        // console.log('quoteClause data', data)
                        var result = '';

                        let target = data.evt.target;
                        let itemIndex = _.findIndex(this.checkedItems, {
                            outlineId: target.dataset.outlineid
                        });

                        if (target.checked) {
                            if (!~itemIndex) {
                                let outlineItem = _.find(this.sourceOutLine, {
                                    outlineId: target.dataset.outlineid
                                });
                                let index = target.dataset.index;
                                if (target.dataset.prev) {
                                    index = target.dataset.prev + '.' + index;
                                }
                                if (outlineItem) {
                                    this.checkedItems.push({
                                        docId: this.currDoc.docId,
                                        stdNo: this.currDoc.stdNo,
                                        outlineId: target.dataset.outlineid,
                                        outlineTitle: outlineItem.outlineTitle,
                                        outlineType: outlineItem.outlineType,
                                        orderNum: outlineItem.orderNum,
                                        index,
                                        // htmlContent: this.getQuoteClauseContent(target.parentNode) // 去除内容，过多内容会直接影响性能
                                    })
                                } else {
                                    this.$message.error('无法匹配到大纲数据！')
                                }
                            }
                        } else {
                            if (!!~itemIndex) {
                                this.checkedItems.splice(itemIndex, 1);
                            }
                        }
                        if (!_.isEmpty(this.checkedItems)) {
                            // 重做排序
                            this.checkedItems = _.orderBy(this.checkedItems, ['outlineType', 'orderNum']);
                            

                            // 组织插入标签的内容
                            var itemResult = this.getValue();
                            if (this.setting && this.setting.quoteClauseByContent) {
                                result = this.parseQuoteSelectedHtml(itemResult);
                            } else {
                                var tagNode = document.createElement('p');
                                tagNode.dataset.tag = 'clause';
                                tagNode.dataset.content = String(itemResult.content);
                                // tagNode.style.textIndent="2em";
                                tagNode.innerHTML = `<span contenteditable="false">（见 ${itemResult.values})</span>`;
                                result = tagNode.outerHTML + '&#8203';
                                tagNode.remove();
                            }
                        }
                        
                        this.$emit('change', result);
                        break;
                }
            },
            parseQuoteSelectedHtml(itemResult) {
                let listConten = JSON.parse(itemResult.content);
                let htmlContent = [];
                for (let item of listConten) {
                    for (let ls of item.list) {
                        // data-content="${JSON.stringify(_.omit(ls, ['htmlConten']))}"
                        htmlContent.push(`<p><span contenteditable="false" data-tag="clause">（见 ${itemResult.stdNo} ${ls.index})</span><em>[${ls.title}]</em></p>` + ls.htmlContent);
                    }
                }
                return htmlContent.join("");
            },

            // 获取选中的章节条款内容
            getQuoteClauseContent(node) {
                var htmlContent = node.innerHTML;
                var section = document.createElement('div');
                section.innerHTML = htmlContent;
                var checkedNode = section.querySelector('input[type="checkbox"]');
                if (checkedNode) {
                    let textNode = checkedNode.nextSibling;
                    if (textNode && textNode.nodeName === '#text') {
                        textNode.remove();
                    }
                    checkedNode.remove();
                }

                htmlContent = section.innerHTML;
                section.remove();
                return htmlContent;
            },

            /**
             * @description 滚动条置顶
             */
            moveTop() {
                this.editorInstance.moveTopage(0);
            },

            /**
             * @description 下拉菜单指令事件
             * @param {Object} data
             */
            handleCommand(data) {
                // console.log('handleCommand=>', data)
                this.editorInstance.foucsId({
                    outlineId: data.outlineId
                });
            },

            /**
             * @description 大纲组件上报事件
             * @param {Object}  data
             */
            changeOutline(data = {}) {
                // console.log('changeOutline', data)
                switch (data.act) {
                    case 'selectItem':
                    case 'selectNode':
                        this.editorInstance.foucsId({ outlineId: data.data.outlineId });
                        break;
                }
            },

            /**
             * @description 获取大纲列表
             */
            async getOutlineList() {
                if (!this.currDoc) {
                    return false;
                }
                this.loading = true;
                $global.setStroage('structDocData',this.currDoc)
                var editorConfig = $global.getTinymceConfig();
                // console.log('clause==>', editorConfig, editorConfig.editorURL||process.env.VUE_APP_EDITOR_URL);
                const { code, rows } = await outlineStructList({ docId: this.currDoc.docId }, editorConfig.editorURL||process.env.VUE_APP_EDITOR_URL);
                // console.log('getOutlineList===>', rows);
                if (code === 200) {
                    var outlineDatas = rows.map(item => {
                        let data = $global.clearDataByField(item, ['docId', 'ancestors', 'isAsc', 'pageNum',
                            'pageSize', 'remark', 'delFlag', 'orderByColumn', 'infoNum', 'locked',
                            'extendContent', 'updateUser', 'updateTime', 'commitId', 'params',
                            'tagList', 'createTime', 'deleteTime', 'deleteUser', 'searchValueArray',
                            'createUser', 'searchValue'
                        ]);
                        data.content = $global.clearDataByField(item.content, ['updateUser', 'pageSize',
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
                            data.letter = letters[parseInt(item.outlineCatalog) - 1];
                            data.docattr = item.outlineType === 8 ? 'specs' : 'means';
                        }
                        return data;
                    });
                    // 重置大纲排序（按类型、顺序号）
                    this.sourceOutLine = _.orderBy(outlineDatas, ['outlineType', 'orderNum'], ['asc', 'asc']);
                    this.outlineData = $global.handleTree(_.cloneDeep(this.sourceOutLine), 'outlineId', 'parentId', 'children', '0');
                    // console.log('source outlineData=>', this.outlineData);
                    // 解析文档
                    this.getDocContent();
                } else {
                    this.$message.error('无大纲数据！');
                    this.loading = false;
                }
            },

            /**
             * @description 解析文档内容
             */
            async getDocContent() {
                var htmlArr = [
                    `<div class="page-container reader" data-id="${this.currDoc.docId}" data-no="${this.currDoc.stdNo}">`
                ];
                var coverTemp = _.find(this.listTemplate, {
                    'tmplType': this.currDoc.stdKind,
                    'tmplName': 'cover'
                });
                var coverHtmlData = parseStructHtml.parseCoverHtml(this.currDoc, coverTemp, this.editorSetting);

                if (coverHtmlData) {
                    let pageNo = coverHtmlData.pageNo;
                    htmlArr.push(coverHtmlData.htmlContent);
                    if (this.outlineData && this.outlineData.length) {
                        var outlineHtmlArr = parseStructHtml.parseHtmlByOutline(_.cloneDeep(this.outlineData), pageNo, this.currDoc.stdKind, this.listTemplate);
                        htmlArr = htmlArr.concat(outlineHtmlArr);
                    }
                } else {
                    htmlArr.push(`<div class="info-block"><p>无法读取文档内容！</p></div>`);
                }
                htmlArr.push('</div>');
                this.htmlContent = htmlArr.join("");
                // 重置文档的HTML内容

                if (this.editorInstance) {
                    this.editorInstance.resetContent({ htmlContent:this.htmlContent });
                    this.loading = false;
                }
            },

            /**
             * @description 获取文档模板
             */
            async getTempList() {
                var editorConfig = $global.getTinymceConfig();
                const { code, rows } = await contentTemplateStructList({}, editorConfig.editorURL||process.env.VUE_APP_EDITOR_URL);
                if (code === 200) {
                    this.listTemplate = rows.map(item => {
                        item = _.omit(item, ['createTime', 'createUser', 'delFlag',
                            'deleteTime', 'deleteUser', 'isAsc', 'orderByColumn', 'pageNum',
                            'pageSize', 'params', 'remark', 'searchValue', 'searchValueArray',
                            'updateTime', 'updateUser'
                        ]);
                        return item;
                    });
                }
            },

            /**
             * @description 获取文档列表
             */
            getQuoteList() {
                this.quoteList = [];
                this.loading = true;
                const condition = _.merge({
                    "orderBy": "create_time",
                    "orderType": "desc",
                    "searchValue": this.searchKey,
                }, this.query);

                // var editorConfig = $global.getTinymceConfig(); editorSetting
                // docStructList(condition, editorConfig.editorURL||process.env.VUE_APP_EDITOR_URL).then(res => {
                docStructList(condition, this.editorSetting.editorURL||process.env.VUE_APP_EDITOR_URL).then(res => {
                    if (res.code === 200) {
                        this.total = res.total;
                        this.quoteList = res.rows.map(item => {
                            item = _.omit(item, ['pageSize', 'remark', 'delFlag',
                                'orderByColumn', 'thumbnailList', 'updateUser', 'updateTime',
                                'params', 'initOutline', 'pageNum', 'formatId',
                                'docVersionName', 'deleteTime', 'stdUuid', 'deleteUser',
                                'searchValueArray', 'createUser', 'searchValue', 'stdEdition'
                            ]);
                            return item;
                        });
                        // console.log('this.quoteList==>', this.quoteList)
                    } else {
                        this.$message.error('API接口错误！')
                    }
                    this.loading = false;
                })
            },
            /**
             * @description 清空已设定的数据
             */
            clearData() {
                this.currDoc = null;
                this.editorSetting = null;
                // 销毁编辑器
                if (this.editorInstance) {
                    this.editorInstance.destroy();
                }
                this.checkedItems = [];
                this.outlineData = [];
                this.sourceOutLine = [];
                this.query = {
                    pageNum: 1,
                    pageSize: 20
                }
            }
        },
        created() {
            
        },
        beforeDestroy() {
            this.clearData();
        }
    }
</script>

<style lang="scss" scoped>
    @import './clause.scss';
</style>
