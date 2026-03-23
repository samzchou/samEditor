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
    </div>
</template>

<script>
    import samEditor from "@/components/samEditor/samEditor.vue";
    import * as slotComponent from "@/slot/index.js";
    export default {
        name: 'about-editor',
        components: {
            samEditor
        },
        computed: {
            slotCmp() {
                console.log("this.actEvent.event", this.actEvent.event)
                if (this.actEvent.event && slotComponent[this.actEvent.event]) {
                    return slotComponent[this.actEvent.event];
                }
                return null;
            },

            rightStyle() {
                return {
                    width: `${this.rightWidth}px`,
                    display: this.rightWidth === 0 ? 'none' : 'block'
                }
            },
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
                    env: process.env.NODE_ENV,                          // 编辑器运行的环境
                    author: {                                           // 用户信息
                        userId: '1235',                                 // 用户ID
                        userName: 'anonymous',                          // 用户名
                    },
                    outData: true,                                      // 输出数据，外部处理保存
                    outHtml: true,                                      // 仅做富文本使用，输出HTML
                    outTable: true,                                     // 输出表格的结构化数据
                    fullScreen: true,                                   // 默认全屏模式
                    zoomIn: true,                                       // 页面缩放
                    admin: true,                                        // 是否管理员（用于开发调试）
                    editorURL: process.env.VUE_APP_EDITOR_URL,          // JAVA接口地址 process.env.VUE_APP_EDITOR_URL
                    nodeURL: process.env.VUE_APP_REMOTE_API,            // nodeServer服务器地址 process.env.VUE_APP_REMOTE_API 'http://192.168.0.239:9001',
                    pluginURL: process.env.VUE_APP_PLUGIN_PATH,         // 外挂插件地址 process.env.VUE_APP_PLUGIN_PATH,
                    parseDocURL: process.env.VUE_APP_DOC_API,           // 文档解析接口地址
                    readonly: false,                                    // 只读模式
                    page: {                                             // 页面配置数据
                        expand: true,
                        layout: 'singleSided',                          // 单面排版：singleSided | 双面排版：doubleSided
                        id: '',                                         // 文档ID，如有值则初始化后直接加载文档
                    },
                    htmlContent: '',                                    // 文档内容
                    navShow: true,                                      // 显示侧栏导航
                    // 菜单内容
                    menu: {
                        file: {
                            title: 'File',
                            items: 'openFile | save saveAs | print | exportFile | close-btn',
                        },
                        edit: {
                            title: 'Edit',
                            items: 'undo redo | cut copy paste | searchreplace',
                        },
                        insert: {
                            title: 'Insert',
                            items: 'charmap | paragraph-btn image inserttable | math hr',
                        },
                        importFile: {
                            title: 'importFile',
                            items: 'importWord importCloud',
                        },
                        help: {
                            title: 'Help',
                            items: 'help concatus | bzt-ver',
                        }
                    },
                    // 菜单栏, 如果未空则不显示
                    menuBar: 'file importFile edit insert Tools help',
                    // 第一行工具栏
                    toolbar1: 'undo redo | close-btn save | exportFile | pageLayout | formatselect paragraph-btn image imgtitle table insertCheckList link | collect-list collect-level | math | fontName fontSize forecolor backcolor | comment | alignment indent2em lineheight letterspacing removeformat | tableTag | code',
                    // 快捷工具条
                    quickbars: 'bold italic underline strikethrough superscript subscript',
                    // 公式下拉菜单
                    mathItems: ['custom', 'hand', 'number'], // 自定义 手写 编号
                    // 上下文菜单
                    contextmenu: 'undo redo | paste | table | image | resetNumber | quickComment | translateStdName | quickTag',
                    // 草稿箱轮询间隔 30000 0为不调用草稿箱
                    draftTimes: 30000,
                    // 自定义列项
                    bullets: [
                        { text: '列项—— 【一级】', value: 'line', level: 1 },
                        { text: '字母 a) b) c) 【一级】', value: 'lower', level: 1 },
                        { text: '数字框 [1] [2] [3]【一级】', value: 'num-index', level: 0 },
                        { text: '数字 1) 2) 3)【二级】', value: 'num', level: 2 },
                        { text: '符号 ● 【二级】', value: 'circle', level: 2 },
                        { text: '重置编号', cmd: 'restBulletNum' },
                    ],
                    // exportType: ['docx','wps'],                          // 导出文档类型
                    // 工具栏扩展（编辑器只抛出事件，须在业务端操作）
                    extendToolbar: [{
                            text: '表格标签', // 按钮名称
                            tooltip: '定义表格标签', // tooltip显示名
                            event: 'tableTag',
                            children: [{ // 下拉子集
                                    text: '表格标签',
                                    tooltip: '表格标签',
                                    showType: 'slot', // 弹窗显示模式
                                    event: 'tableTag' // 事件名（注意：须在事件上报中处理）
                                },
                                {
                                    text: '单元格标签',
                                    tooltip: '单元格标签',
                                    showType: 'slot',
                                    event: 'tdTag'
                                },
                                {
                                    text: '选框标签',
                                    tooltip: '选框标签',
                                    showType: 'slot',
                                    event: 'checkboxTag'
                                }
                            ]
                        },
                        /* {
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
                        }, */
                    ]
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


                        break;
                    case 'addTableTag':// 表格标签
                        console.log(evt)
                        if (evt.data && evt.tableNode) {
                            evt.tableNode.dataset.key = evt.data.key;
                            evt.tableNode.dataset.api = evt.data.api;
                        }
                        this.rightWidth = 0;
                        break;
                    case 'addTdTag':// 单元格标签
                        console.log(evt)
                        if (evt.data && evt.tdNode) {
                            evt.tdNode.dataset.key = evt.data.key;
                        }
                        this.rightWidth = 0;
                        break;
                }
            },

            /**
             * @description 接收上报事件
             * @param {Object} data
             */
            changeEvent(data) {
                if (!['onScroll', 'mouseoverEvent'].includes(data.act)) {
                    console.log('about revice change=>', data);
                }
                this.emitData = { ...data };
                switch (data.act) {
                    case 'initialized':
                        // 如果有文档内容则重置（或者从接口中取出内容）
                        if (this.$storage.session.get('docHtml')) {
                            this.$refs.samEditor.interFaceAction({ act:'resetContent', htmlContent:this.$storage.session.get('docHtml') });
                        }
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
                        console.log('reviced click=>', data);
                        break;
                    case 'close':
                        break;
                    case 'outData':
                        console.log('reviced outData=>', data);
                        this.$storage.session.set('docHtml', data.htmlContent);
                        break;
                    case 'mouseup':
                        // 复选框
                        if (data.evt.target && data.evt.target.nodeName === 'INPUT' && data.evt.target.type === 'checkbox') {
                            data.evt.target.checked = !data.evt.target.checked;
                            if (data.evt.target.checked) {
                                data.evt.target.dataset.checked = 1;
                            } else {
                                data.evt.target.removeAttribute('data-checked');
                            }
                        }
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
                this.editorSetting.page.id = docId;
            }

            if (this.$route.query && this.$route.query.userId && this.$route.query.userName) {
                this.editorSetting.author.userId = this.$route.query.userId;
                this.editorSetting.author.userName = this.$route.query.userName;
            }
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
