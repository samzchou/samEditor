<template>
    <div class="about">
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
    // import { baseData, getTcList, getAllIndustryList, getOrganizationList } from "@/api/dms";
    import { listTagTree, addTag, tagList, removeTag } from "@/api/tags";
    // 全局方法
    import $samGlobal from '@/utils/global';
    export default {
        name: 'about-editor',
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
                    author: { // 用户信息
                        userId: '1', // 用户ID
                        userName: 'sam', // 用户名
                        commitId: '', // 用户所编辑的大纲ID
                        isAdmin: true, // 是否为管理员（可编辑大纲）
                        enableDraft: false,
                        lockedAll: false, // 协同模式下默认全不锁定
                        assignOutline: false, // 是否可以分配大纲
                        assignOutlineId: [], // 'd5cde6c9-f998-4d00-8b59-604c5c8a0b51','e399e559-d9b1-41d6-a282-47c25ea10085'
                        memberList: [{ userName: 'sam1', userId: '1' }, { userName: 'sam2', userId: '2' }, { userName: 'sam3', userId: '3' }], // 成员列表(分配大纲人员)
                        unlockedAutoSave: false, // 解锁后自动保存
                        lockedTimes: 10000, // 锁定后轮询提交锁定章节间隔
                        forceUnlock: true, // 强制全部解锁操作
                        outlineLevel: 2, // 可无限分配章节条目的层级，不设置则为无限级
                    },
					emptyTemplate: true,
                    outData: false, // 输出数据，外部处理保存
                    private: false, // 私有
                    innerSys: true, // 内网系统
                    fullScreen: true, // 默认全屏模式
                    zoomIn: true, // 页面缩放
                    setTemplate: false, // 编辑文档模板模式
                    // unlock: true,                                    // 解锁所有页面
                    // disabledSave: true,                              // 禁用保存
                    admin: true, // 是否管理员（用于开发调试）
                    editorURL: process.env.VUE_APP_EDITOR_URL, // JAVA接口地址 process.env.VUE_APP_EDITOR_URL
                    nodeURL: process.env.VUE_APP_REMOTE_API, // nodeServer服务器地址 process.env.VUE_APP_REMOTE_API 'http://192.168.0.239:9001',
                    pluginURL: process.env.VUE_APP_PLUGIN_PATH, // 外挂插件地址 process.env.VUE_APP_PLUGIN_PATH,
                    parseDocURL: process.env.VUE_APP_DOC_API, // 文档解析接口地址
                    socketURL: process.env.VUE_APP_SOCKET, // socket通信地址
                    textImgUrl: process.env.VUE_APP_TEXT_IMG_URL, // 文本文档中的图片路径
                    readonly: false, // 只读模式
                    isStandard: true, // 是否为标准文档
                    lockCover: false, // 锁定封面不可编辑
                    mergeDoc: false, // 文档初始化后是否自动合并正文
                    chapter: ['6', '8', '9'], // 章节标识;用于目次数据的筛选
                    // fixed: [1, 2, 3, 4, 5],      // 固定某些章节不能修改和删除(前言、引言、范围、规范性引用文件、术语和定义)[1, 2, 3, 4, 5]
                    page: {
                        expand: true, // True:页面不做自动分页，自动向下增高展开，注：仅用于编辑模式下
                        empty: true, // 导出office是否需要空白页面的插入（双面排版下作用）
                        layout: 'singleSided', // 单面排版：singleSided | 双面排版：doubleSided
                        id: '', // 文档ID，如有值则初始化后直接加载文档
                        stdEnNameNormal: true,  // 英文名称不加粗
                        // stdEnNameFont: '黑体',                         // 英文标准名称字体（黑体）默认为 times new roman并加粗

                    },
                    // syncScroll: true,									// 同步滚动到指定元素
                    // logo: require(`@/assets/images/logo.png`),       // 编辑器LOGO图片路径
                    // logoWidth: 100,                                  // 编辑器LOGO图片宽度,不填则自适应宽度
                    navShow: true, // 显示或关闭左侧栏
                    openSidebar: true, // 默认打开左侧栏
                    exportStruct: true, // 是否在保存数据时同时导出结构化数据
                    flatDepartment: true, // 封面发布单位扁平字体
                    autoMathNum: true, // 自动生成公式编号
                    notCatalogue: false, // 是否不须要目次页
                    // 字体
                    // font_formats:'宋体=simsun;黑体=SimHei;Times New Roman=times new roman;',
                    // 菜单内容
                    menu: {
                        file: {
                            title: 'File',
                            items: 'newStandard openFile | save saveAs | searchreplace preview print | exportFile | close-btn',
                        },
                        edit: {
                            title: 'Edit',
                            items: 'undo redo | cut copy paste | searchreplace',
                        },
                        insert: {
                            title: 'Insert',
                            items: 'charmap-btn | paragraph-btn image inserttable | math graphy | hr',
                        },
                        pageElement: {
                            title: 'pageElement',
                            items: 'cover catalogue prefaceWord introWord addendixWord referenceWord | indexWord indexMarker | page-type',
                        },
                        levelStyle: {
                            title: 'levelStyle',
                            items: 'chapterTitle | chapter1 chapter2 chapter3 chapter4 chapter5 | notTitle1 notTitle2 notTitle3 notTitle4 notTitle5 | list1 list2 list3 list4 list5 list6 list7',
                        },
                        Tools: {
                            title: 'Tools',
                            items: 'validatDms readDoc knowledgeGraph | translate | test1 test2',
                        },
                        importFile: {
                            title: 'importFile',
                            items: 'importWord importCloud',
                        },
                        help: {
                            title: 'Help',
                            items: 'help concatus | bzt-ver upgrade',
                        }
                    },
                    // 菜单栏
                    menuBar: 'file importFile edit insert pageElement levelStyle elementStyle Tools help',
                    // 第一行工具栏
                    toolbar1: 'undo redo | close-btn save saveAs | catalogue setCatalogue indexMarker | collect-chapter collect-unchapter | collect-list collect-level | charmap-btn paragraph-btn image freeDom media link | table separateTable | math graphy | fontName fontSize forecolor backcolor | test1 quote searchText',
                    // 第二行工具栏
                    toolbar2: 'example-btn zhu-btn zhu-imgtable footer-btn imgtitle tabletitle | quote-btn term quota comment references | alignment indent2em lineheight letterspacing removeformat | translate searchreplace fullscreen | code mergePage breakPage pageSplit | page-type pageLayout exportFile | fullscreen',
                    // 快捷工具条
                    quickbars: 'bold italic underline strikethrough superscript subscript | quickOutComment',
                    // 公式下拉菜单
                    mathItems: ['custom', 'hand', 'number'], // 自定义 手写 编号
                    // 上下文菜单
                    contextmenu: 'undo redo | table | image | resetNumber | quickComment | translateStdName | quickTag',
                    // 草稿箱轮询间隔 30000 0为不调用草稿箱
                    draftTimes: 30000,
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
                    // 自定义大纲类型；用于新增
                    outlineMenus: [{
                            label: '前言',
                            index: '1',
                        },
                        {
                            label: '引言',
                            index: '2',
                        },
                        {
                            label: '章节',
                            index: '3-6',
                            children: [
                                { label: '范围', index: '3' },
                                { label: '规范性引用文件', index: '4' },
                                { label: '术语和定义', index: '5' },
                                { label: '其他章节', index: '6' },
                            ]
                        },
                        {
                            label: '附录章节',
                            index: '8-9',
                            children: [
                                { label: '规范性', index: '8', level:0 },
                                { label: '资料性', index: '9', level:1 },
                            ]
                        },
                        {
                            label: '参考文献',
                            index: '11',
                        },
                        {
                            label: '索引',
                            index: '12',
                        },
                    ],
                    notTitle: false, // 是否不需要章节的大标题
                    // catalogueTitle: '目录',                                // 目次标题名称
                    // exportType: ['docx','wps'],                          // 导出文档类型
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
                                },
                                {
                                    text: '提交外部链接',
                                    tooltip: '提交外部链接',
                                    showType: 'customeLink',
                                    event: 'customeLink'
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
                        {
                            text: '查找', // 按钮名称
                            tooltip: '查找', // tooltip显示名
                            event: 'searchText',
                            command: 'search'
                        }
                    ],
                    htmlContent: `<div class="page-container"><div class="info-block"><p>请输入内容</p></div></div>`,
                    autoSaveTimes: 600000, // 间隔10分钟自动保存
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
                switch (evt.act) {
                    // 关闭弹窗
                    case 'close':
                        this.dialogData.visible = false;
                        break;
                    case 'customeLink':
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
                        this.$refs.samEditor.interFaceAction({ act: 'insertContent', htmlContent, term: true, notBookmark:true });
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
                /*if (!['onScroll', 'mouseoverEvent'].includes(data.act)) {
                    console.log('about revice change=>', data);
                }*/
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
                console.log('extendEvent=>', obj);
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
                } else if (obj.showType === 'customeLink') {
                    this.$refs.samEditor.interFaceAction({ act: 'setContent', value:'<a class="formQuoteSummary" contenteditable="false" style="border: 0; text-decoration: none; cursor: pointer; pointer-events: auto;" data-formlogicid="fdb934c6-511d-11ed-bd38-005056a54046" data-formid="22261">GZ G022001-114 量产(Produce)门槛评审记录（智开）</a>' });
                    this.$message.success("已设置A标签!");

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
                    this.getTaDataList(docId);
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
                    // console.log('this.sourceTagList=>', this.sourceTagList)
                }
            }
        },
        created() {
            var docData = this.$storage.session.get('tinymceDocData'),
                docId;
            if (this.$route.query && this.$route.query.id) {
                docId = this.$route.query.id;
            } else if (docData) {
                docId = docData.docId;
            }

            if (docId) {
                this.$set(this.editorSetting.page, 'id', docId);
            }

            if (this.$route.query && this.$route.query.userId && this.$route.query.userName) {
                this.$set(this.editorSetting.author, 'userId', this.$route.query.userId);
                this.$set(this.editorSetting.author, 'userName', this.$route.query.userName);
                if (this.$route.query.userName === 'sam2') {
                    this.$set(this.editorSetting.author, 'isAdmin', false);
                    this.$set(this.editorSetting.author, 'assignOutlineId', []);
                } else if (this.$route.query.userName === 'sam3') {
                    this.$set(this.editorSetting.author, 'isAdmin', false);
                    this.$set(this.editorSetting.author, 'memberList', []);
                    this.$set(this.editorSetting.author, 'assignOutlineId', []);
                }
            } else {
                this.$set(this.editorSetting.author, 'isAdmin', false);
                this.$set(this.editorSetting.author, 'assignOutline', false);

                this.$set(this.editorSetting.author, 'userName', 'test');
                this.$set(this.editorSetting.author, 'userId', '99');
            }

            // this.getTagTreeList(docId);
        },

    };
</script>

<style lang="scss" scoped>
    .about {
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
