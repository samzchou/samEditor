<template>
    <div class="std-editor-container">
        <template v-if="!openViewDoc">
            <main>
                <!-- 编辑器编辑模式 v-if="docId && loadedOther"  -->
                <sam-editor ref="samEditor" :data="editorSetting" @change="changeEvent">
                    <!-- <template v-slot:right>
                        <div class="right-wrapper" :style="slotStyle">
                            <aiTools :data="aiParams" :active="aiActive" :settings="editorSetting" :editorInstance="editorInstance" @change="changeAiEvent" />
                        </div>
                    </template> -->
                </sam-editor>
            </main>
            <footer>
                <el-select size="mini" v-model="autoMerge" placeholder="合并文档" style="margin-right: 10px;">
                    <el-option label="手动合并文档" :value="false" />
                    <el-option label="自动合并文档" :value="true" />
                </el-select>
                <el-button size="mini" type="primary" plain @click.stop.prevent="viewEditorDoc" :disabled="editorInstance===null">预览</el-button>
                <el-button size="mini" type="warngin" @click="setTag">定义标签</el-button>
                <el-button size="mini" type="success" plain @click="saveAs">另存为</el-button>
            </footer>
        </template>
        <div class="view-doc-page" v-else>
            <viewDoc :docId="docId" :data="editorSetting" :autoMerge="autoMerge" @close="closeView" />
        </div>
        <!-- 编辑器阅读模式,嵌套在弹窗组件中 height:calc(100% - 40px); fullscreen-->
        <el-dialog custom-class="editor-dialog" :title="dialogParams.title" :show-close="false" :visible.sync="dialogParams.visible" fullscreen append-to-body destroy-on-close>
            <template v-if="appendClause && dialogParams.visible">
                <div style="height:calc(100% - 52px)">
                    <quoteClauseCmp @change="changeSlotData" />
                </div>
                <div class="btns" style="padding:10px; text-align:center;border-top:1px solid #EEE;">
                    <el-button size="small" @click="closeDialog">取 消</el-button>
                    <el-button size="small" type="primary" @click="submitDialogValue">确 定</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script>
    // 引入编辑器库组件（如在项目中须再引入CSS）
    import samEditor from "@/components/samEditor/samEditor.vue";
    import { editorOptions } from './editorConfig';
    import viewDoc from './viewDoc';
    import $global from '@/utils/global';
    // AI工具栏
    // import aiTools from '@/components/aiDoc/index.vue';
    // 引用标准
    import quoteClauseCmp from '@/slot/quoteClause';
    // 全局配置
    const _appConfig = window.$appConfig[process.env.NODE_ENV];

    export default {
        name: 'rich-editor',
        components: {
            samEditor,
            viewDoc,
            quoteClauseCmp,
            //aiTools
        },
        // 参数数据传递
        provide: {
            aiOptions: {
                aiSocketURL: _appConfig.VUE_AI_SOCKET_URL,          // ai Socket地址 ws://192.168.0.19:8500/api/push/websocket
                aiInterfaceURL: _appConfig.VUE_AI_INTERFACE_URL,    // ai 接口地址
                nodeURL: _appConfig.VUE_APP_NODE_URL,               // nodeServer地址 http://192.168.0.239:9001
                editorURL: _appConfig.VUE_APP_EDITOR_URL,           // 编辑器JAVA后台接口地址
                userId: 'ced79a2f18998b6c4e5d4473567f0484',         // 登录用户ID
                ..._appConfig.knowledgeSetting // 知识库配置
            }
        },
        computed: {
            slotStyle() {
                let obj = {
                    width: this.slotWidth + 'px'
                }
                return obj;
            },
        },
        data() {
            const editorId = $global.guid();
            console.log('editorId===>', editorId)
            return {
                aiActive: '',
                slotWidth: 0,
                aiParams: null,
                editorInstance: null,
                appendSetting: false,
                docId: undefined,
                loadedOther: true,
                // 编辑器配置
                editorSetting: Object.assign(editorOptions,{
                    editorId,
                    admin: true,
                    draggableOutline: true,                 // 可拖拽大纲
                    tempPath: 'hsTmp',                   	// 使用特定模板
                    style: "commons-hs",                 	// 使用特定样式
					tmplType: 901,							// 航司的文档类型
                    language: 'zh_CN',                      // 语言 默认en, 不设置则为zh_CN
                    // saveByCompare: true,                 // 比较章节内容，仅保存更改后的章节条款（未使用）
                    nodeURL: _appConfig.VUE_APP_NODE_URL,   // nodeServer地址 "http://127.0.0.1:9001",
                    wordBreak: true,                       	// 是否为word自动分页处理
                    wordApplication: 'Word.Application',    // 调用office word com
                    xmlPdf: true,                           // 导出XML时加入pdf文件
                    hideSideBar: false,
                    hideVersion: false,
                    resetImg: true,                         // 重置图片路径
                    /*author:{
                        isAdmin: true,                      // 协同模式管理员身份
                        lockedAll: true,                    // 协同模式
                        forceUnlock: true,                  // 强制解锁
                        // userName: 'test1',                    // 操作人 如为管理员则注释
                        // userId: 'test1',
                        assignOutline: true,
                        memberList: [{ userName: 'test1', userId: 'test1' }, { userName: 'test2', userId: 'test2' }]
                    },*/
                    fixed: [],                 // 固定章节不可操作删除1, 2, 3, 4, 5]
                    mergeStd: true,                        // 页眉是否合并编号，去掉编号中的空格
                    disableCover: false,                    // 禁止封面编辑
                    quoteLabel: ['注日期引用','不注日期引用'],
                    quoteStdName: true,
                    // quoteClauseByContent: true,
                    // quoteClause: true,
                    // reader: true,
                    // parseStruct: true,
                    // outData: true,
                    // 默认目次选项
                    catalogues: {
                        type1: true,
                        type2: true,
                        type3: true,
                        type4: true,
                        type5: true,
                        type6: true,
                        leve11: true,
                        // tableTitle: true,
                        // imgTitle: true,
                        appendix0: true,
                        appendix1: true,
                    },
                    aiTools: true,
                    // contextmenu: 'undo redo | table | image | resetNumber | quickTag removeTag | remove-btn | quickAi',
                    // quickbars: 'bold italic underline strikethrough superscript subscript | aiTool', // 选中文字后的快捷工具条
                    quickbars: 'bold italic underline strikethrough superscript subscript | aiTool', // 选中文字后的快捷工具条
                    contextmenu: 'undo redo | table | image | resetNumber | quickTag removeTag | quickAi | remove-btn | quickComment',
                    useHelp: {
                        manual: '<a href="#" target="_blank">请下载《标准文档使用手册》</a>',// 使用说明
                        concatus: '这是我们的联系方式<br/>电话：3434', // 联系我们
                    },
                    toolbar1: 'undo redo | close-btn save | catalogue setCatalogue indexMarker | insertCharacter collect-chapter collect-unchapter | collect-list collect-level | charmap-btn paragraph-btn image freeDom link | table separateTable mergeTable | math graphy | fontName fontSize forecolor backcolor | resetImg',
                    // 第二行工具栏 audioToText translate
                    toolbar2: 'example-btn zhu-btn zhu-imgtable footer-btn imgtitle tabletitle | quote-btn term | breakPage mergePage page-type pageLayout exportFile | alignment indent2em removeformat clearFormat | code searchreplace fullscreen | aiEditor aiTool',
                    draftTimes: 30000,
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
                    /*
                    extendToolbar: [{
                        text: '引用',
                        tooltip: '引用',
                        event: 'importQuote',
                        children:[
                            {
                                text: '标准题录引用',
                                tooltip: '标准题录引用',
                                event: 'std'
                            },
                            {
                                text: '引用条款',
                                tooltip: '引用条款',
                                event: 'clause'
                            },
                            {
                                text: '引用汇总',
                                tooltip: '引用汇总',
                                event: 'collect'
                            },
                        ]
                    },{
                        text: 'language',
                        tooltip: 'language',
                        event: 'language',
                        enabled: true,
                        children:[
                            {
                                text: 'English',
                                tooltip: 'English',
                                type: 'en',
                                enabled: true,
                            },
                            {
                                text: '简体中文',
                                tooltip: '简体中文',
                                type: 'zh_CN',
                                enabled: true,
                            },
                        ]
                    },{
                        text: '重置图片',
                        tooltip: '重置图片',
                        event: 'resetImg',
                        enabled: true
                    }],
                    */
                }),
                dialogParams: {
                    visible: false,
                    title: '引用条款',
                    width: '60%',
                    height: '600px',
                },
                dialogVisible: false,
                appendClause: false, // 打开引用标准
                currNode: null,
                clauseData: undefined,
                autoMerge: false, // 自动合并文档
                selections: null,
                checkedItems: [],
                openViewDoc: false,
            }
        },
        methods: {
            changeAiEvent(obj) {
                console.log('changeAiEvent===>', obj)
                switch(obj.act) {
                    case 'close':
                        this.slotWidth = 0;
                        break;
                    case 'aiInfo':
                        break;
                }
            },
            viewEditorDoc() {
                this.appendClause = false;
                this.openViewDoc = true;
                // this.$set(this.dialogParams, 'title', '');
                // this.$set(this.dialogParams, 'visible', true);
            },
            closeView() {
                this.openViewDoc = false;
                this.$router.go(0)
            },

            closeDialog() {
                // this.dialogVisible = false;
                if (this.editorInstance) {
                    this.editorInstance.interFaceAction({ act: 'refreshEditor' });
                }
                //
                this.$set(this.dialogParams, 'visible', false);
                this.appendClause = false;
            },

            submitDialogValue() {
                // console.log('this.selections===>', this.selections)
                // console.log('this.clauseData===>', this.clauseData)
                // 刷新下当前的编辑器，重新定义设置
                // this.editorInstance.interFaceAction({ act: 'refreshEditor' });
                this.closeDialog();
                setTimeout(() => {
                    this.appendNodeToClause();
                }, 300);
            },
            changeSlotData(data) {
                this.clauseData = data;
            },

            appendNodeToClause() {
                // const currNode = this.selections.node[0];
                const section = document.createElement("div");
                section.innerHTML = this.clauseData;
                const childs = Array.from(section.childNodes);
                if (this.currNode.childNodes && this.currNode.childNodes.length === 1 && this.currNode.childNodes[0].nodeName === "BR") {
                   this. currNode.removeChild(this.currNode.childNodes[0]);
                }
                for (let ele of childs.reverse()) {
                    console.log("ele=>", ele);
                    if (ele.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') !== '' ) {
                        this.currNode.insertAdjacentElement("afterend", ele);
                    }
                }
                section.remove();
            },

            /**
             * @description 接收编辑器上报事件
             * @param {Object} data
             */
            changeEvent(data) {
                // console.log('changeEvent===>', data)
                switch (data.act) {
                    case 'loaded': // 文档加载完成
                        // console.log('主编辑器 loaded')
                        this.editorInstance = this.$refs.samEditor;
                        break;
                    case 'breakPage':
                        this.$notify({
                            title: `提示消息`,
                            message: `文档执行分页${data.result?'完成':'失败'}`,
                            type: data.result? 'success' : 'error'
                        });
                        break;
                    case 'destroy':
                        console.log('主编辑器实例已销毁')
                        break;
                    case 'mouseup':
                        // console.log('mouseup===>', data)
                        this.currNode = data.evt.target;
                        this.selections = _.omit(data, ['act','evt']);
                        this.selections.id = '0000099'
                        this.selections.label = data.selection;
                        this.selections.remark = '测试一个标签';
                        this.selections.tag = { enName:'test', label:'测试你', id:'3837743' };
                        break;
                    case 'addTag':
                        this.setTag();
                        break;
                    case 'removeTag':
                        console.log('removeTag===>', data)
                        break;
                    /*case 'quoteClause': // 引用条款选中或取消选中
                        let target = data.evt.target;
                        let itemIndex = _.findIndex(this.checkedItems, {
                            outlineId: target.dataset.outlineid
                        });
                        if (target.checked) {
                            if (!~itemIndex) {
                                let nextNode = target.nextSibling;
                                let outlineTitle = nextNode && nextNode.nodeName === '#text' ? nextNode.textContent : '';
                                let pageContainer = $global.getParentBySelector(target, 'page-container');
                                let index = target.dataset.index;
                                if (target.dataset.prev) {
                                    index = target.dataset.prev + '.' + index;
                                }
                                // console.log(outlineItem);
                                this.checkedItems.push({
                                    docId: pageContainer.dataset.id,
                                    stdNo: pageContainer.dataset.no,
                                    outlineId: target.dataset.outlineid,
                                    outlineTitle,
                                    outlineType: target.dataset.outlinetype,
                                    index,
                                    htmlContent: this.getQuoteClauseContent(target.parentNode)
                                })
                            }
                        } else {
                            if (!!~itemIndex) {
                                this.checkedItems.splice(itemIndex, 1);
                            }
                        }
                        // console.log(this.checkedItems);
                        break;*/
                    case 'extendEvent':
                        this.extendEvent(data);
                        break;
                    case 'closeEditor':
                        alert(111)
                        break;
                    case 'aiCmd': // 智能工具
                    case 'aiEditor':
                        this.aiActive = 'docAi';
                        if (data && data.command) {
                            this.aiParams = data;
                        } else {
                            this.aiParams = null;
                        }
                        this.slotWidth = 550;
                }
            },

            getQuoteClauseContent(node) {
                var htmlContent = node.innerHTML;
                var section = document.createElement('div');
                section.innerHTML = htmlContent;
                var checkedNode = section.querySelector('input[type="checkbox"]');
                if (checkedNode) {
                    checkedNode.remove();
                }
                htmlContent = section.innerHTML;
                section.remove();
                return htmlContent;
            },

            async saveAs() {
                const res = await this.$refs.samEditor.interFaceAction({ act: 'saveAs' });
                console.log('saveAs===>', res)
            },

            setTag() {
                var strs = this.selections.selection.split('\n');
                var index = 0;
                for (let node of this.selections.node) {
                    let parentNode = node.parentElement;
                    console.log(node)
                    let str = strs[index];
                    let textNode = document.createElement('tt');
                    textNode.textContent = str;
                    textNode.dataset.tag = this.selections.tag.enName;
                    textNode.dataset.tagid = this.selections.id + '|' + this.selections.tag.id;
                    textNode.dataset.tagtitle = this.selections.remark || this.selections.tag.label;
                    textNode.className = 'tag';

                    if (node.nodeName === '#text') {
                        parentNode.insertBefore(textNode, node);
                        node.remove();
                    } else if ($global.hasClass(node, 'ol-list') || $global.hasClass(node, 'appendix-list')) {
                        $global.addClass(node, 'tag')
                        node.dataset.tag = this.selections.tag.enName;
                        node.dataset.tagid = this.selections.id + '|' + this.selections.tag.id;
                        node.dataset.tagtitle = this.selections.remark || this.selections.tag.label;
                        textNode.remove();
                    } else {
                        let newReg = new RegExp(str, 'i');
                        node.innerHTML = node.innerHTML.replace(newReg, textNode.outerHTML)
                        textNode.remove();
                    }
                    index++;
                }
                // this.$refs.samEditor.interFaceAction({ act: 'appendTag', tags:[this.selections] });
            },

            /**
             * @description 外部扩展按钮|菜单事件触发
             * @param {Object} obj
             */
            extendEvent(obj = {}) {
                this.actEvent = obj;
                this.emitData = { ...obj };
                console.log('extendEvent=>', obj);
                // debugger
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
                } else if (obj.showType === 'customeLink') {
                    this.$refs.samEditor.interFaceAction({ act: 'setContent', value:'<a class="formQuoteSummary" contenteditable="false" style="border: 0; text-decoration: none; cursor: pointer; pointer-events: auto;" data-formlogicid="fdb934c6-511d-11ed-bd38-005056a54046" data-formid="22261">GZ G022001-114 量产(Produce)门槛评审记录（智开）</a>' });
                    this.$message.success("已设置A标签!");
                } else if (obj.showType === 'remove') {
                    // DOM节点的标签数据
                } else if (obj.event === 'clause') {    // 引用条款（弹出窗）
                    // this.dialogVisible = true;
                    this.$set(this.dialogParams, 'title', '引用条款');
                    this.$set(this.dialogParams, 'visible', true);
                    this.$set(this.dialogParams, 'width', '80%');
                    this.$set(this.dialogParams, 'height', '700px');
                    this.appendClause = true;
                } else if (obj.event === 'std') {       // 引用标准
                    this.$refs.samEditor.interFaceAction({act:'changeEvent', event: "importQuote", data: { act: obj.event }});
                } else if (obj.event === 'collect') {   // 引用汇总
                    this.$refs.samEditor.interFaceAction({ act: 'changeEvent',  event: "collect" });
                } else if (['en','zh_CN'].includes(obj.type)) { // 切换语言
                    this.loadedOther = false;
                    this.$set(this.editorSetting, 'language', obj.type);
                    setTimeout(() => {
                        this.loadedOther = true;
                    })
                } else if (obj.event === 'resetImg') {
                    this.$refs.samEditor.interFaceAction({ act: 'reloadOriginImage' });
                } else if (obj.event === 'customTerm') { // 术语
                    this.$refs.samEditor.interFaceAction({ act: 'execCommand', command:'customTerm' });
                }
            },
        },
        created() {
            var docData = this.$storage.session.get('tinymceDocData'), docId;
            if (this.$route.query) {
                if (this.$route.query.id) {
                    docId = this.$route.query.id;
                } else if (docData) {
                    docId = docData.docId;
                }
                if (this.$route.query.normal || (docData && docData.stdKind === 999)) {
                    this.$set(this.editorSetting, 'isStandard', false);
                    this.$set(this.editorSetting, 'normal', true);
                    this.$set(this.editorSetting, 'style', 'commons-normal');
                }

                if (this.$route.query.userName && this.$route.query.userId) {
                    this.editorSetting.author = Object.assign({}, this.editorSetting.author, {
                        userId: this.$route.query.userId,
                        userName: this.$route.query.userName
                    })
                }
            }


            if (docId) {
                this.docId = docId;
                this.editorSetting.page.id = docId;
            }
            // console.log('user===>', encrypt('admin||123456'));
            // console.log('解密===>', decrypt('h7J4yhzaBAvfbR6ey+Tn2pOShipPqQ2UGarApp0QOxl4UbzBvjaFjmQnY2pbcsgIR0JumURdqcR1rRSY5MtV4QFEGtB/0biydLnUhYPDnvubuJDGCdTJ2ekwZiArcmU1WRbvXAzIVb09drKPoDL0TIdghOtPCZSxOQIHxYd6h74='))
        },

        mounted() {
            document.title = "标准通编辑器"
        }
    }
</script>

<style lang="scss" scoped>
    .std-editor-container {
        height: 100%;
        width: 100%;
        position: relative;

        main {
            height: calc(100% - 45px);
        }

        footer {
            height: 45px;
            padding: 10px;
            text-align: center;
            border-top: 1px solid #dbd9d9;
        }
        .view-doc-page{
            position: absolute;
            left:0;
            top:0;
            width:100%;
            height:100%;
        }

    }

    ::v-deep .editor-dialog {
        overflow: hidden;
        .el-dialog__header{
            display: none;
        }
        .el-dialog__body {
            height: 100%;
        }
    }
</style>
