<template>
    <div class="view-doc-container">
        <!-- 工具栏 -->
        <header>
            <h3 class="title">{{docTitle}}</h3>
            <el-button size="mini" @click.stop.prevent="setDialog('structList')">打开结构化文档</el-button>
            <el-button size="mini" @click.stop.prevent="setViewer('pdfView')">打开PDF文档</el-button>
            <el-button size="mini" @click.stop.prevent="actEvent('close')">退出关闭</el-button>
        </header>
        <!-- 编辑器主体 -->
        <main>
            <sam-editor v-if="!viewCmp" ref="samEditor" :data="data" @change="changeEvent" />
            <pdfViewer v-else-if="viewCmp==='pdfView'" :url="pdfUrl" :nodeUrl="data.nodeURL" :limit="limit" :disable="disableBtns" base64 @change="changePdfEvent" />
            <!-- 右侧栏 -->
            <div class="right-wrapper" :style="rightStyle">
                <div class="tabs">
                    <samTab :data="tabArr" :tabIndex="activeTab" @change="changeTab" />
                </div>
                <div class="contents">
                    <!-- <component :is="rightComponent" :data="rightData" @change="changeComp" /> -->
                </div>

                <div class="collapse" @click.stop.prevent="toggleRight=!toggleRight">
                    <i :class="!toggleRight ? 'el-icon-arrow-left' : 'el-icon-arrow-right'" />
                </div>
            </div>
        </main>

        <!-- 弹窗容器 -->
        <el-dialog custom-class="sam-dialog" :title="dialogPrams.title" :visible.sync="dialogPrams.visible" :width="dialogPrams.width" append-to-body :close-on-click-modal="false" @close="closeDialog">
            <!-- <div v-if="dialogPrams.type=='video'" class="video-play">
                <video width="480" height="360" autoplay controls>
                    <source :src="dialogPrams.src" type="video/mp4">
                    您的浏览器不支持Video标签。
                </video>
            </div>
            <div v-else-if="dialogPrams.type=='knowledge'" style="height: 650px;">
                <knowledgeGraph />
            </div> -->
            <component :is="dialogComponent" :editorSetting="data" @change="changeComp" />
        </el-dialog>
    </div>
</template>

<script>
    // 引入编辑器组件
    import samEditor from "@/components/samEditor/samEditor.vue";
    // 引入PDF阅读器组件
    import pdfViewer from '@/components/pdfViewer';
    // 结构化数据API接口
    import { contentTemplateStructList, docStructList, outlineStructList } from '@/api/outline';
    // 引入Tabs组件
    import samTab from '../samTabs';
    // 引入分页组件
    import pagination from '@/components/pagination';
    // 引入全局方法
    import $global from '@/utils/global';
    // 引入其他相关组件
    import * as cpmCollection from './components/index.js'

    export default {
        name: 'view-doc',
        components: {
            samEditor, pdfViewer, samTab, pagination
        },
        props: {
            data: Object,       // 编辑器配置
            limit: {
                type: Number,
                default:() => {
                    return 0;
                }
            }
        },
        computed: {
            rightStyle() {
                return {
                    'width': this.toggleRight ? '450px' : '0px'
                }
            },
            dialogComponent() {
                return cpmCollection[this.dialogPrams.cmp];
            },
            disableBtns() {
                return ['presentationMode','openFile','print','download','viewBookmark','secondaryToolbarToggle']
            }
        },

        data() {
            return {
                loading: null,
                editorInstance: null,
                viewCmp: undefined,
                pdfUrl: 'http://127.0.0.1:9001/std_1552323.pdf',
                docTitle: '',
                listTemplate: [], // 结构化文档模板
                currStructDoc: {}, // 当前结构化文档
                query: {
                    pageNum: 1,
                    pageSize: 20
                },
                total: 0,
                searchKey: '',
                tabArr: [
                    { act: 'base', label: '基础' },
                    { act: 'quota', label: '采用/引用' },
                    { act: 'norm', label: '指标' },
                    { act: 'files', label: '文件/表单' },
                    { act: 'comment', label: '批注' },
                ],
                activeTab: 'base',
                toggleRight: true,
                outlineData: [],
                selectionData: null,
                dialogPrams: {
                    title: '弹窗标题',
                    visible: false,
                    width: '750px',
                    cmp: 'structList',
                }
            }
        },
        methods: {
            changeTab() {

            },
            closeDialog() {
                this.dialogPrams.visible = false;
            },

            changeComp(obj) {
                switch (obj.act) {
                    case 'setContent':
                        // this.editorInstance.interFaceAction({ act:'resetOutlineData', data:obj.outlineData });
                        this.editorInstance.interFaceAction({ act:'resetContent', htmlContent:obj.htmlContent, breakPage:true });
                        this.closeDialog();
                        break;
                }
            },

            setViewer(cmpName) {
                this.viewCmp = cmpName;
            },

            setDialog(cmpName) {
                this.dialogPrams = {
                    title: '结构化文档',
                    visible: true,
                    width: '750px',
                    cmp: 'structList',
                }
            },

            /**
             * @description 上传组件自动请求
             */
            httpRequest() {
                return false;
            },

            changePdfEvent(obj) {
                console.log('changePdfEvent', obj);
            },

            /**
             * @description 初始化编辑器配置
             */
            initData() {
                this.editorSetting = Object.assign(editorOptions, this.data);
            },
			/**
             * @description 显示或关闭目次页 this.showCatalogue: true | false
             */
			changeShowCatalogue() {
				this.editorInstance.interFaceAction({ act:'showcatalogue', show:!this.editorSetting.notCatalogue });
			},

            onLoading(text, isLoading = false) {
                if (this.loading && !isLoading) {
                    this.loading.close();
                }
                this.loading = this.$loading({
                    lock: true,
                    text,
                    spinner: 'el-icon-loading',
                    background: 'rgba(0, 0, 0, 0.7)'
                });

                setTimeout(() => {
                    this.loading.close();
                }, 60000);
            },

            /**
             * @description 编辑器选中文本
             * @param {Array} nodes
             */
            setSelection(event={}) {
                var outlineArr = [];
                event.node.forEach(node => {
                    if (node.nodeName !== 'BODY') {
                        $global.addClass(node, 'on-focus');
                        let arr = this.recurrenceParentNodes(node);
                        outlineArr.push(arr);
                    }
                });
                var pageContainer = this.getParentBySelector(event.node[0], 'page-container');
                this.selectionData = {
                    pageContainer,
                    text: event.selection,
                    nodes: event.node,
                    outlineArr
                }
                console.log('this.selectionData==>', this.selectionData)
                this.clearHighlight();

            },
            /**
             * @description 根据CLass类名递归查找父级对象
             */
            getParentBySelector(node, selectorName=undefined) {
                const getpNode = element => {
                    if(element) {
                        //创建父级节点的类数组
                        let pNode = element.parentElement;
                        if(pNode && ($global.hasClass(pNode, selectorName) || pNode.nodeName === selectorName.toUpperCase())) {
                            return pNode;
                        } else {
                            return getpNode(pNode);
                        }
                    }
                }
                return getpNode(node);
            },

            /**
             * @description 清除已高亮选中的节点 select-text
             * @param {Object}  node
             */
            clearHighlight(node=null) {
                let allHighlightNodes = Array.from(this.selectionData.pageContainer.querySelectorAll('.highlight'));
                allHighlightNodes.forEach(ele => {
                    let pNode = ele.parentNode;
                    let tNode = document.createTextNode(ele.textContent);
                    pNode.insertBefore(tNode, ele);
                    ele.remove();
                });
                return true;
            },
            /**
             * @description 高亮选中文本
             * @param {Object}  event
             */
            setHighlight(event) {
                this.clearHighlight();
                this.selectionData.outlineArr[0].forEach(item => {
                    let olEle = this.selectionData.pageContainer.querySelector(`[data-outlineid="${item.outlineId}"]`);
                    if (olEle) {
                        let html = olEle.innerHTML;
                        let reg = new RegExp(event.text, 'g');
                        html = html.replace(reg,"<span class='highlight'>" + event.text + "</span>");
                        olEle.innerHTML = html;
                        olEle.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                })
            },
            /**
             * @description 根据编辑器的当前节点，递归获取大纲结构数据
             * @param {Element}  startNode 当前节点
             */
            recurrenceParentNodes(startNode = null) {
                var outlineNode = null, outlineArr = [];
                // 往上递归获取父节点
                const getParent = node => {
                    let parentNode = node.parentElement;
                    if (parentNode.dataset && parentNode.dataset.outlineid) {
                        return parentNode;
                    } else {
                        return getParent(parentNode);
                    }
                }
                if (startNode.dataset && startNode.dataset.outlineid) {
                    outlineNode = startNode;
                } else {
                    outlineNode = getParent(startNode);
                }
                // 如果节点为结构化的条目
                if (outlineNode) {
                    outlineArr = $global.getParentNode(this.outlineData, outlineNode.dataset.outlineid, { idKey: "outlineId", parentKey: "parentId", "children": "children" })
                }
                return outlineArr;
            },

            async getDocData() {
                var pageData = await this.editorInstance.interFaceAction({ act:'getPageData' } );
                // console.log('pageData', pageData)
                this.docTitle = pageData.stdName + ' ' + pageData.stdSign + ' '  + pageData.stdNo;

                var outlineData = await this.editorInstance.interFaceAction({ act:'get_outline' } );
                this.outlineData = $global.handleTree(outlineData, 'outlineId', 'parentId', 'children', '0');

            },

            /**
             * @description 编辑器上报事件
             * @param {Object} data
             */
            changeEvent(data) {
                if (!['onScroll','mouseoverEvent'].includes(data.act)) {
                    console.log('changeEvent', data);
                }
                switch (data.act) {
                    case 'loaded':  // 文档加载完成
                        console.log('编辑器 loaded');
                        this.mergedDoc = false;
                        this.editorInstance = this.$refs.samEditor;
                        this.getDocData();
                        break;
                    case 'mouseupEvent': // 鼠标事件
                        this.setSelection(data);
                        break;
                    case 'click': // 鼠标事件
                        console.log(data.event.target)
                        break;
                    case 'destroy': // 编辑器实例销毁
                        console.log('文档预览编辑器实例已销毁')
                        break;
                }
            },

            /**
             * @description 编辑器接口调用示例
             * @param {String} act
             */
            async actEvent(act) {
                switch (act) {
                    /* case 'close': // 关闭
                        this.$emit('close');
                        break;
                    case 'outline': // 获取大纲结构
                        var outlineData = await this.editorInstance.interFaceAction({ act: 'get_outline' });
                        console.log('outlineData', outlineData);
                        break;
                    case 'merge': // 合并页面文档，save为是否保存合并后的文档结构数据， 返回 Boolean
						if (this.mergedDoc) {
                            this.$message.warning('文档已经被合并！');
                        } else {
							this.onLoading('正在合并文档中，请等候处理完成...');
                            this.mergedDoc = await this.editorInstance.interFaceAction({ act: 'megerDoc', save: true });
                            console.log('文档合并结果', this.mergedDoc);
                            this.loading.close();
                        }
                        break;
                    case 'import':
                        document.getElementById('upload-file').click();
                        break; */
                }
            },
            /**
             * 上传文档内容
             * @param {Object} file
             */
            async handleBeforeUpload(evt) {
                evt.stopPropagation();
                evt.preventDefault();

                this.mergedDoc = false;

                var file = document.getElementById('upload-file').files[0];
                var reader = new FileReader();
                if (typeof FileReader === "undefined") {
                    this.$message({
                        type: "warning",
                        message: "您的浏览器不支持文件读取。"
                    });
                    return;
                }
                reader.onload = (e) => {
                    let htmlContent = e.target.result;
                    let section = document.createElement('div');
                    section.innerHTML = htmlContent;
                    let pageContainer = section.querySelector('.page-container');
                    if (!pageContainer || !pageContainer.dataset.outlineid) {
                        this.$message({
                            type: "error",
                            message: "文档格式错误，请检查！"
                        });
                    } else {
                        // 重置文档内容后，执行分页
                        this.editorInstance.interFaceAction({ act: 'resetContent', htmlContent, breakPage:true });
                    }
                    section.remove();
                }
                reader.readAsText(file, "utf-8");
            },




        },
        created() {

        },

        beforeDestroy() {
            if (this.editorInstance) {
                this.editorSetting = null;
                this.editorInstance.interFaceAction({ act:'destroy' });
            }
        }
    }
</script>

<style lang="scss" scoped>
    .view-doc-container{
        height: 100%;
        header{
            padding: 5px;
            display: flex;
            align-items: center;
            background-color: #dee9f3;
            .title{
                margin-right: 15px;
            }
        }
        main{
            height: calc(100% - 38px);
            display: flex;
            ::v-deep .sam-editor-container {
                flex:1;
            }
            .right-wrapper{
                position: relative;
                width: 400px;
                transition: width .3s;
                background-color: #FFF;
                // border-top: 1px solid #DDD;
                .collapse {
                    padding: 3px 0;
                    cursor: pointer;
                    position: absolute;
                    left: -12px;
                    top: calc(50% - 10px);
                    z-index: 100;
                    background-color: #FFF;
                    box-shadow: -2px 2px 0 0 rgba(0,0,0,.15);
                    border-top-left-radius: 3px;
                    border-bottom-left-radius: 3px;
                    width: 12px;
                    text-align: center;
                    height: 18px;
                    display: flex;
                }
                .tabs{
                    padding-top: 5px;
                }
                .contents{
                    overflow: hidden;
                    height: calc(100% - 31px);
                    background-image: linear-gradient(#FFF, #EEE);
                }
            }
        }
    }
</style>
