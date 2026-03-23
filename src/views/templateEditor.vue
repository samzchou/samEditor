<template>
    <div class="template-editor-container">
        <sam-editor ref="samEditor" :data="editorSetting" @change="changeEvent">
            <template v-if="actEvent.showType==='slot' && rightWidth" v-slot:right>
                <div class="right-wrapper" :style="rightStyle">
                    <header>
                        <span>{{actEvent.text}}</span>
                        <i class="el-icon-close" @click.stop.prevent="rightWidth=0" />
                    </header>
                    <div class="content">
                        <component :is="slotCmp" :data="emitData" :tagTree="tagTreeList" @change="changeSlotData" />
                    </div>
                </div>
            </template>
        </sam-editor>
        <el-dialog v-if="actEvent.showType==='dialog'" v-el-drag-dialog append-to-body custom-class="form-dialog" :title="dialogData.title" :visible.sync="dialogData.visible" :width="dialogData.width" :close-on-click-modal="false">
            <component :is="dialogCmp" :data="emitData" :tagTree="tagTreeList" @change="changeSlotData" />
        </el-dialog>
    </div>
</template>

<script>
    import samEditor from "@/components/samEditor/samEditor.vue";
    import * as slotComponent from "@/slot/index.js";
    import elDragDialog from '@/directive/el-drag-dialog';
    import { listTagTree, addTag, tagList, removeTag } from "@/api/tags";
    // 全局方法
    import $samGlobal from '@/utils/global';
    export default {
        name: 'template-editor',
        components: {
            samEditor
        },
        directives: { elDragDialog },
        computed: {
            slotCmp() {
                if (this.actEvent.event && slotComponent[this.actEvent.event]) {
                    return slotComponent[this.actEvent.event];
                }
                return null;
            },
            dialogCmp() {
                if (this.dialogData.cmpName && slotComponent[this.dialogData.cmpName]) {
                    return slotComponent[this.dialogData.cmpName];
                }
                return null;
            },
            rightStyle() {
                return {
                    width: `${this.rightWidth}px`,
                    display: this.rightWidth === 0 ? 'none' : 'block'
                }
            },
            checkedList() {
                var checked = [];
                this.utilList.forEach(item => {
                    if (this.allCheckeds.includes(item.label)) {
                        checked.push(item.label);
                    }
                });
                return checked;
            }
        },
        data() {
            return {
                activeTab: 'pages',
                pageImgs: [],
                draftList: [],
                searchText: '',
                cmpName: undefined,
                slotTitle: '插槽标题',
                leftWidth: 300,
                rightWidth: 0,
                outlineData: [],
                editorSetting: {
                    env: process.env.NODE_ENV, // 编辑器运行的环境
                    author: {},
                    outData: true, // 输出数据，外部处理保存
                    zoomIn: true, // 页面缩放
                    admin: true, // 是否管理员（用于开发调试）
                    editorURL: process.env.VUE_APP_EDITOR_URL, // JAVA接口地址 process.env.VUE_APP_EDITOR_URL
                    nodeURL: process.env.VUE_APP_REMOTE_API, // nodeServer服务器地址 process.env.VUE_APP_REMOTE_API 'http://192.168.0.239:9001',
                    readonly: false, // 只读模式
                    isStandard: true, // 是否为标准文档
                    dragger: true,
                    page: {
                        expand: false, // True:页面不做自动分页，自动向下增高展开，注：仅用于编辑模式下
                        empty: false, // 导出office是否需要空白页面的插入（双面排版下作用）
                        layout: 'singleSided', // 单面排版：singleSided | 双面排版：doubleSided
                        docId: ''
                    },
                    navShow: false, // 显示或关闭左侧栏
                    exportStruct: true, // 是否在保存数据时同时导出结构化数据
                    // font_formats:'宋体=simsun;黑体=SimHei;Times New Roman=times new roman;',
                    // 菜单栏
                    menuBar: false,
                    // 第一行工具栏
                    toolbar1: 'undo redo | close-btn save saveAs | catalogue indexMarker | collect-chapter collect-unchapter | collect-list collect-level | paragraph-btn image | table math graphy | fontName fontSize forecolor backcolor | link | test1 quote',
                    // 第二行工具栏
                    toolbar2: 'example-btn zhu-btn zhu-imgtable footer-btn imgtitle tabletitle | pageLayout exportFile | alignment indent2em lineheight letterspacing removeformat |  code fullscreen formatpainter freeDom',
                    // 快捷工具条
                    quickbars: 'bold italic underline strikethrough superscript subscript',
                    // 公式下拉菜单
                    mathItems: ['custom', 'hand', 'number'], // 自定义 手写 编号
                    // 上下文菜单
                    contextmenu: 'undo redo | paste | table | image | resetNumber | quickComment | translateStdName | quickTag | remove-btn',
                    // 草稿箱轮询间隔 30000 0为不调用草稿箱
                    draftTimes: 0,
                    // 自定义列项
                    bullets: [
                        { text: '列项—— 【一级】', value: 'line', level: 1 },
                        { text: '字母 a) b) c) 【一级】', value: 'lower', level: 1 },
                        { text: '数字框 [1] [2] [3]【一级】', value: 'num-index', level: 0 },
                        { text: '数字 1) 2) 3)【二级】', value: 'num', level: 2 },
                        // { text: '标引序号——1)【一级】', value: 'tag-index', level: 1 },
                        { text: '符号 ● 【二级】', value: 'circle', level: 2 },
                        { text: '重置编号', cmd: 'restBulletNum' },
                    ],
                    exportType: ['docx'],                          // 导出文档类型
                    // 工具栏扩展（编辑器只抛出事件，须在业务端操作）
                    extendToolbar: [{
                            text: '测试标签', // 按钮名称
                            tooltip: '测试1', // tooltip显示名
                            event: 'test1', // 事件名
                            children: [{ // 下拉子集
                                    text: '自定义标签',
                                    tooltip: '自定义标签',
                                    showType: 'dialog', // 弹窗显示模式
                                    dialogWidth: '400px', // 弹窗宽度，不填写默认500px
                                    event: 'customeTag' // 事件名（注意：须在事件上报中处理）
                                },
                                {
                                    text: '移除标签',
                                    tooltip: '移除标签',
                                    showType: 'remove',
                                    event: 'customeTag'
                                }
                            ]
                        },
                        {
                            text: '外部引用',
                            tooltip: '外部引用',
                            event: 'quote',
                            children: [{
                                text: '术语',
                                tooltip: '术语',
                                showType: 'slot', // 插槽模式
                                event: 'term',
                                tagTreeId: '100'
                            }, {
                                text: '引用条款',
                                tooltip: '引用标准条款',
                                command: 'importQuote', // 命令模式
                                event: 'quoteClause'
                            }]
                        },
                    ],
                    htmlContent: '<div class="page-container empty" data-id="92a61010-5428-401d-b54d-e0e993136c3f"><div class="info-block"><p>请输入内容...</p></div></div>'
                },
                dialogData: {
                    cmpName: undefined,
                    visible: false,
                    title: '提示',
                    width: '300px',
                    type: 'date',
                    value: ''
                },
                emitData: null, // 组件数据
                sourceTagList: [],
                tagTreeList: [],
                actEvent: {},
            }
        },
        methods: {

            /**
             * @description 获取页面数据
             */
            getPageData() {
                if (this.$refs.samEditor) {
                    return this.$refs.samEditor.getPageData();
                }
                return null;
            },

            /**
             * @description 组件数据提交上报
             * @param {Object}  evt
             */
            async changeSlotData(evt = null) {
                // console.log('changeData', this.actEvent, evt);
                var htmlContent = evt.htmlContent || ""; //.replace(/[\t\n]/g,'');
                // return;
                switch (evt.act) {
                    // 关闭弹窗
                    case 'close':
                        this.dialogData.visible = false;
                        break;
                    case 'extendEvent':
                        // console.log('this.emitData=>', this.emitData);
                        var textContent = evt.currNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
                        // console.log(evt.currNode)
                        // 注：章标题或条题不能定义标签，这里的TEXT节点为纯文本
                        if (evt.event === 'customeTag' && (this.hasClass(evt.currNode, 'ol-list') || this.hasClass(evt.currNode, 'appendix-list'))) {
                            this.$message.warning("章标题或条题不能定义标签!");
                        } else {
                            // 如果是框选了文字，则从起始位置计算到终止位置的字符
                            if (evt.range && evt.range.endOffset > evt.range.startOffset) {
                                textContent = textContent.slice(evt.range.startOffset, evt.range.endOffset);
                            }
                            let uuid = $samGlobal.guid();

                            let tagData = {
                                id: uuid,
                                tid: evt.tagTreeId,
                                value: evt.tagType,
                                title: evt.tagName,
                                content: evt.tagContent
                            }
                            this.$refs.samEditor.interFaceAction({ act: 'toggleCustomeTag', ...tagData });
                            this.$message.success("已设置标签!");

                            /* let condition = {
                                tagId: uuid,
                                tagTreeId: evt.tagTreeId,
                                docId: this.editorSetting.page.id,
                                tagType: evt.tagType,
                                tagName: evt.tagName,
                                tagContent: evt.tagContent,
                                textContent
                            }
                            // 获取章节ancestors
                            condition.ancestors = await this.$refs.samEditor.interFaceAction({ act:'getAncestorsBycurrNode', node:evt.currNode });
                            // console.log('condition', condition)
                            addTag(condition).then(res => {
                                if (res.code === 200) {
                                    let tagData = {
                                        id: uuid,
                                        tid: evt.tagTreeId,
                                        value: evt.tagType,
                                        title: evt.tagName,
                                        content:evt.tagContent
                                    }
                                    this.$refs.samEditor.interFaceAction({ act:'toggleCustomeTag', ...tagData });
                                    this.$message.success("已设置标签!");
                                    // 刷新标签列表
                                    this.getTaDataList();
                                } else {
                                    this.$message.error("设置标签失败!");
                                }
                                this.dialogData.visible = false;
                            }) */
                        }
                        this.dialogData = {
                            visible: false
                        };
                        break;
                        // 新建标签
                    case 'addTag':
                        this.dialogData = {
                            cmpName: 'tag',
                            visible: true,
                            title: '编辑标签',
                            width: '450px',
                        }
                        break;
                        // 更新标签数据
                    case 'updateTag':
                        this.getTagTreeList();
                        break;
                        // 引用术语 term:true 系统识别插入了术语，并按规范格式新建条题
                    case 'addTerm':
                        this.rightWidth = 0;
                        this.$refs.samEditor.interFaceAction({ act: 'insertContent', htmlContent, term: true });
                        break;

                        // 引用标准
                        /* case 'standard':
                            var str = `${event.stdNo}`;
                            if(event.type) {
                                str += `-${event.date}`;
                            }
                            str += ` &nbsp;${event.label}`;
                            htmlContent = `<a class="quote" data-tag="tag" id="${$samGlobal.guid()}" href="#" javascript="void(0)" title="引用标准" data-stdid="${event.stdId}" data-stdno="${event.stdNo}">${str}</a>`;
                            this.$refs.samEditor.interFaceAction({ act:'insertContent', htmlContent });
                            break;

                        // 指标比对 { value: 'quota', id:$global.guid(), title:'指标', content:JSON.stringify(data) }
                        case 'comparsion':
                            var obj = {
                                value: 'comparsion',
                                id: $samGlobal.guid(),
                                title: '对标',
                                content: '对标数据内容'
                            };
                            this.$refs.samEditor.interFaceAction({ act:'addTag', data: obj });
                            break;
                        // 批注
                        case 'comment':
                            this.$refs.samEditor.interFaceAction({ act:'toggleCommnet', data:event });
                            this.rightWidth = 0;
                            break;
                        // ICS-CCS编号
                        case 'ics-ccs':
                            this.$refs.samEditor.interFaceAction({ act:'toggleIcsCcs', data:event });
                            break;
                        // 标准编号、标准代码等
                        case 'stdNo':
                            console.log('changeData stdNo=>', event)
                            break; */
                }
            },

            /**
             * @description 接收上报事件
             * @param {Object} data
             */
            changeEvent(data) {
                 if (!['onScroll', 'mouseoverEvent'].includes(data.act)) {
                    // console.log('about revice change=>', data);
                }
                this.emitData = { ...data };
                switch (data.act) {
                    case 'loaded':
                        // this.$refs.samEditor.interFaceAction({ act:'resetContent', htmlContent:'<div>sdsd</div>' });
                        break;
                    case 'closeEditor':
                        var userAgent = navigator.userAgent;
                        if (userAgent.indexOf("Firefox") != -1 || userAgent.indexOf("Presto") != -1) {
                            window.location.replace("about:blank");
                        } else {
                            window.opener = null;
                            window.open("", "_self");
                            window.close();
                        }
                        break;
                    case 'click':
                        console.log('about revice click=>', data);
                        break;
                    case 'close':
                        break;
                        // 自定义扩展事件
                    case 'extendEvent':
                        this.extendEvent(data);
                        break;
                }
            },

            /**
             * @description 外部扩展按钮|菜单事件触发
             * @param {Object} obj
             */
            extendEvent(obj = {}) {
                this.actEvent = obj;
                this.emitData = { ...obj };
                // console.log('extendEvent=>', obj);
                // 如果为插槽方式
                if (obj.showType === 'slot') {
                    this.rightWidth = 400;
                } else if (obj.command) {
                    delete obj.act;
                    this.$refs.samEditor.interFaceAction({ act: 'execCommand', ...obj });
                    // 弹窗方式
                } else if (obj.showType === 'dialog') {
                    /* this.dialogData = {
                        cmpName : obj.event,
                        visible: true,
                        title: obj.text,
                        width: obj.dialogWidth || '500px'
                    } */
                    this.$refs.samEditor.interFaceAction({
                        act: 'insertContent',
                        htmlContent: '<span data-tag="bullAddUser" data-tid="E70B3E82-3763-452F-8C44-1DC9EBADA1FD" data-id="15d101bb-c883-4071-8617-81220dfe2232" data-content="122_沈浩良_223862">沈浩良</span>'
                    });
                    // 移除标签
                } else if (obj.showType === 'remove') {
                    // DOM节点的标签数据
                    /* if (obj.currNode && obj.currNode.dataset.tag) {
                        let tagId = obj.currNode.dataset.id;
                        this.$refs.samEditor.interFaceAction({ act:'toggleCustomeTag', remove:true, tagId });
                        this.$message.success("已移除标签!");
                    } */
                }
            },
            /**
             * @description DOM节点包含CLASS类名
             * @param {Element} ele
             * @param {String} cls
             */
            hasClass(ele = null, cls = "") {
                cls = cls || '';
                if (cls.replace(/\s/g, '').length == 0 || !ele.className) return false; //当cls没有参数时，返回false
                return new RegExp(' ' + cls + ' ').test(' ' + ele.className + ' ');
            },
            /**
             * @description 获取标签树
             * @param {String} docId
             */
            async getTagTreeList(docId = "") {
                var condition = {
                    "pageNum": 1,
                    "pageSize": 1000
                }
                var res = await listTagTree(condition, process.env.VUE_APP_EDITOR_URL);
                if (res.code === 200) {
                    var tagTreeList = res.rows.map(item => {
                        item = _.omit(item, ['createTime', 'createUser', 'delFlag', 'deleteTime', 'deleteUser', 'isAsc', 'orderByColumn', 'pageNum', 'pageSize', 'params', 'remark', 'searchValue',
                            'searchValueArray', 'updateTime', 'updateUser'
                        ]);
                        return item;
                    });
                    // 转换为树结构
                    this.tagTreeList = $samGlobal.toTree(tagTreeList, { idKey: 'tagTreeId', parentKey: 'parentId' });
                    // console.log('this.tagTreeList', this.tagTreeList);
                    // 获取所有文档的标签
                    if (docId) {
                        this.getTaDataList(docId);
                    }
                }
            },
            /**
             * @description 获取所有文档的标签
             * @param {String} docId
             */
            async getTaDataList(docId = "") {
                docId = docId || this.editorSetting.page.id;
                this.sourceTagList = [];
                var res = await tagList({ docId, delFlag: 0 });
                if (res.code === 200) {
                    this.sourceTagList = res.rows.map(item => {
                        item = _.omit(item, ['createTime', 'createUser', 'delFlag', 'deleteTime', 'deleteUser', 'isAsc', 'orderByColumn', 'pageNum', 'pageSize', 'params', 'remark', 'searchValue',
                            'searchValueArray', 'updateTime', 'updateUser'
                        ]);
                        return item;
                    });
                }
            }
        },
        created() {
            this.getTagTreeList();
        },

    };
</script>

<style lang="scss" scoped>
    .template-editor-container {
        height: 100%;

        .right-wrapper {
            width: 0px;
            transition: all .25s;

            // display: none;
            >header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px;
                border-bottom: 1px solid #DDD;
            }

            .content {
                height: calc(100% - 37px);
            }
        }
    }

    ::v-deep .form-dialog {
        .el-dialog__body {
            max-height: 700px;
        }
    }
</style>
