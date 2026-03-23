<template>
    <div class="ai-doc-page">
        <sam-editor ref="samEditor" :data="editorSetting" @change="changeEvent">
            <template v-slot:right>
                <div class="right-wrapper" :style="slotStyle">
                    <!-- 智能编写文档组件 -->
                    <aiDoc v-show="rightWidth>0" :data="aiParams" :active="aiActive" :editorInstance="editorInstance" @change="changeAiEvent" />
                </div>
            </template>
        </sam-editor>
        <!-- <aiDoc :data="editorSetting" /> -->
    </div>
</template>

<script>
    import samEditor from '@/components/samEditor/samEditor.vue';

    import aiDoc from '@/components/aiDoc/index.vue';
    import { editorOptions } from './editorConfig.js';
    import $global from '@/utils/global.js';
    const _appConfig = window.$appConfig[process.env.NODE_ENV];

    export default {
        name: 'ai-doc',
        components: {
            samEditor,
            aiDoc
        },
        provide: {
            aiOptions: {
                aiSocketURL: _appConfig.VUE_AI_SOCKET_URL, // ai Socket地址 ws://192.168.0.19:8500/api/push/websocket
                aiInterfaceURL: _appConfig.VUE_AI_INTERFACE_URL, // ai 接口地址
                nodeURL: _appConfig.VUE_APP_NODE_URL,
                editorURL: _appConfig.VUE_APP_EDITOR_URL,
                userId: 'ced79a2f18998b6c4e5d4473567f0484',     // 登录用户ID
                ..._appConfig.knowledgeSetting // 知识库配置
            }
        },
        computed: {
            slotStyle() {
                let obj = {
                    width: this.rightWidth + 'px'
                }
                return obj;
            },
            nodeUrl() {
                return _appConfig.VUE_APP_NODE_URL;
            },
        },
        data() {
            const outlineId = $global.guid();
            return {
                aiActive: '',
                agentId: undefined,
                aiParams: null,
                assignOutline: false,
                rightWidth: 550,
                activeTab: 'aiDoc',
                pdfData: null,
                editorInstance: null,
                editorSetting: Object.assign(editorOptions,{
                    admin: true,
                    author: {},
                    language: 'zh_CN', // 语言 默认en, 不设置则为zh_CN
                    wordBreak: false, // 是否为word自动分页处理
                    wordApplication: 'Word.Application', // 调用office word com
                    // hideSideBar: false,
                    disabledSave: true,
                    // diabledMode: true,
                    hideVersion: false,
                    resetImg: true, // 重置图片路径
                    stdKind: 1400,
                    // outData: true,
                    // 默认目次选项
                    catalogues: {
                        type1: true,
                        type2: true,
                        type3: true,
                        type4: true,
                        type5: true,
                        type6: true,
                        leve11: true
                    },
                    // 菜单内容
                    menu: {
                        file: { title: 'File', items: 'save | searchreplace | exportFile | close-btn' },
                        edit: { title: 'Edit', items: 'undo redo | cut copy paste | searchreplace' },
                        insert: { title: 'Insert', items: 'charmap | paragraph-btn image inserttable | math graphy | hr' },
                        pageElement: { title: 'pageElement', items: 'cover catalogue prefaceWord introWord addendixWord referenceWord | indexWord indexMarker | page-type' },
                        // levelStyle: { title: 'levelStyle', items: 'chapterTitle | chapter1 chapter2 chapter3 chapter4 chapter5 | notTitle1 notTitle2 notTitle3 notTitle4 notTitle5 | list1 list2 list3 list4 list5 list6 list7' },
                        Tools: { title: 'Tools', items: 'validatDms readDoc knowledgeGraph' },
                        importFile: { title: 'importFile', items: 'importWord importCloud' },
                        help: { title: 'Help', items: 'help concatus | bzt-ver' } // upgrade
                    },
                    bullets: [
                        { text: '列项—— 【一级】', value: 'line', level: 1 },
                        { text: '字母 a) b) c) 【一级】', value: 'lower', level: 1 },
                        { text: '数字框 [1] [2] [3]【一级】', value: 'num-index', level: 0 },
                        { text: '数字 1) 2) 3)【二级】', value: 'num', level: 2 },
                        { text: '符号 ● 【二级】', value: 'circle', level: 2 },
                        { text: '重置编号', cmd: 'restBulletNum' },
                    ],
                    // exportType: ['docx','wps'],                          // 导出文档类型
                    // 字体
                    // font_formats: '宋体=simsun;黑体=SimHei;Times New Roman=times new roman',
                    // 菜单栏
                    menuBar: 'file edit insert pageElement levelStyle elementStyle Tools help',
                    // 第一行工具栏
                    toolbar1: 'undo redo | close-btn save | catalogue indexMarker | collect-chapter collect-unchapter | collect-list collect-level | paragraph-btn image | table separateTable | math graphy freeDom | fontName fontSize forecolor backcolor',
                    // 第二行工具栏 quota references
                    toolbar2: 'example-btn zhu-btn zhu-imgtable footer-btn imgtitle tabletitle | quote-btn Term | comment | page-type pageLayout exportFile | alignment indent2em removeformat clearFormat | code link searchreplace fullscreen  | aiEditor aiTool',
                    // 快捷工具条
                    quickbars: 'bold italic underline strikethrough superscript subscript | aiTool',
                    // 公式下拉菜单
                    mathItems: ['custom', 'hand', 'edit', 'number'], // 自定义 手写 输入 编号
                    // 上下文菜单
                    contextmenu: 'undo redo | table | image | resetNumber | quickComment | quickTag | quickAi',
                    draftTimes: 0,
                    htmlContent: '',
                    // ai小助手工具条
                    aiAssistant: [{
                        text:'标准模板', //doc model
                        act: 'docModel'
                    },{
                        text:'AI辅助编写', // ai editor
                        act: 'docAi'
                    },{
                        text:'知识库', // ai knowledge
                        act: 'docKnowledge'
                    },{
                        text:'比对', // ai comparison
                        act: 'docComparison'
                    },{
                        text:'查重', // ai duplicate
                        act: 'docDuplicate'
                    }],
                }),
            }
        },
        methods: {
            changePdf(obj) {
                if(obj && obj.act === 'close') {
                    this.pdfData = null;
                }
            },
            changeAiEvent(obj) {
                console.log('changeAiEvent===>', obj)
                switch(obj.act) {
                    case 'close':
                        this.rightWidth = 0;
                        break;
                    case 'aiInfo':
                        this.showStdInfo(obj.data);
                        break;
                }
            },
            showStdInfo(data) {
                if(data && data.source_file) {
                    this.pdfData = {
                        url: data.source_file
                    }
                }
            },
            /**
             * @description 接收上报事件
             * @param {Object} data
             */
            changeEvent(data) {
                /* if (!['onScroll','onmouseover'].includes(data.act)) {
                    console.log('about revice change=>', data);
                } */
                this.emitData = { ...data };
                switch (data.act) {
                    case 'loaded':
                        this.editorInstance = this.$refs.samEditor;
                        break;
                    case 'destroy':
                        this.$router.push('/stdEditor');
                        break;
                    case 'closeEditor':
                        this.editorInstance.interFaceAction({ act: 'destroy' });
                        break;
                        // 自定义扩展功能
                    case 'extendEvent':
                        this.extendEvent(data);
                        break;
                    case 'aiCmd': // 智能工具
                    case 'aiEditor':
                        this.aiActive = 'docAi';
                        if (data && data.command) {
                            this.aiParams = data;
                        } else {
                            this.aiParams = null;
                        }
                        this.rightWidth = 550;
                        // console.log('this.aiParams===>', this.aiParams)
                        // if (this.aiParams.command === 'rewrite') {
                        //     this.rightWidth = 550;
                        // }

                }
            },
        },
        created() {
            let docId;
            if (this.$route.query && this.$route.query.id) {
                docId = this.$route.query.id;
            } else if ($global.getStroage('tinymceDocData')) {
                let docData = $global.getStroage('tinymceDocData');
                if (docData) {
                    docId = docData.docId;
                }
            }
            if (docId) {
                this.$set(this.editorSetting, 'htmlContent', '')
                this.$set(this.editorSetting.page, 'id', docId)
            }
        },
        mounted() {
            document.title = "AI智能文档系统";
        }
    }
</script>

<style lang="scss" scoped>
    .ai-doc-page {
        height: 100%;
    }
</style>
