<template>
    <div class="doc-ai-cmp">
        <div class="content">
            <el-scrollbar class="scrollbar ver">
                <div class="loading-outline" v-if="loadingContent!==null">
                    <el-progress type="circle" :width="100" :percentage="loadPercentage" :format="formatProcess" />
                </div>
                <template v-else>
                    <p v-if="!aiList.length" class="sample-text">试试发送一些问题给我，比如 "编写一个保温杯的标准"</p>
                    <div v-else class="ai-list">
                        <ul>
                            <template v-for="(item, idx) in aiList">
                                <li :key="idx">
                                    <div class="question">
                                        <div>
                                            <i class="el-icon-question" /> {{item.formText}}
                                        </div>
                                    </div>
                                    <div class="answer">
                                        <div>
                                            <!-- el-icon-chat-line-square -->
                                            <i :class="item.icon" />
                                        </div>
                                        <div>
                                            <div class="ai-result" v-html="item.result"></div>
                                            <div class="btns" v-if="idx===aiList.length-1">
                                                <span title="重试刷新大纲数据" @click.stop.prevent="refreshSubmit">
                                                    <i class="iconfont icon-icon-test32" /> 刷新
                                                </span>
                                                <span title="生成基础文档" @click.stop.prevent="insertHtml">
                                                    <i class="iconfont icon-editor" /> 构建大纲
                                                </span>
                                                <!-- <span title="提取摘要">
                                                    <i class="iconfont icon-dingdan" />
                                                </span> -->
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            </template>
                        </ul>
                    </div>
                </template>
            </el-scrollbar>
        </div>
        <div class="input">
            <div class="tool-btns">
                <div class="left-btns">
                    <el-popover
                        placement="top-start"
                        title="AI小助手"
                        width="400"
                        trigger="hover">
                        <div class="ai-assistant">
                            <div>
                                <el-link icon="iconfont icon-shijianxian" @click.stop.prevent="appendOutlineContent">填入内容</el-link>
                            </div>
                            <div>
                                <el-link icon="iconfont icon-pingtai">提炼文档</el-link>
                            </div>
                            <div>
                                <el-link icon="iconfont icon-liuzhuan">其他功能</el-link>
                            </div>
                        </div>
                        <el-button type="text" slot="reference" icon="el-icon-magic-stick" />
                    </el-popover>
                    <el-tooltip content="创建条款" placement="top">
                        <el-button type="text" icon="iconfont icon-liebiaolist36"></el-button>
                    </el-tooltip>
                    <el-tooltip content="创建指标" placement="top">
                        <el-button type="text" icon="iconfont icon-jingquezhunque"></el-button>
                    </el-tooltip>
                </div>
                <div class="right-btns">
                    <el-tooltip content="重新创建新的文档" placement="top">
                        <el-button type="text" icon="iconfont icon-iconfonticon5"></el-button>
                    </el-tooltip>
                </div>
            </div>
            <div class="submits">
                <el-input type="textarea" size="small" v-model="inputText" :rows="3" clearable autosize resize="none" :disabled="submitLoading" placeholder="请输入内容, Ctrl+Enter 提交提问..." @keydown.native="handleKeydown" />
                <span class="submit-btn" :class="{'disabled':submitLoading||!inputText}" title="提交发送" @click.stop.prevent="submitInput(inputText)">
                    <i class="el-icon-s-promotion" />
                </span>
            </div>
            <!-- @keyup.enter.native="submitInput" -->
            <!-- <div>
                <el-button size="mini" type="text" icon="iconfont icon-upload" />
            </div> -->
        </div>
    </div>
</template>

<script>
    import $global from '@/utils/global.js';
    import docMixin from '../../config/docMixins.vue';
    // 文档解析/转换HTML模块
    import parseStructHtml from "@/components/tinymceEditor/utils/parseStructFromHtml.js";
    // 模板列表接口
    import { listContentTemplate } from '@/api/editor.js';
    // webSocket
    import socketUtil from '@/utils/socketUtil.js';

    export default {
        name: "doc-ai",
        mixins: [docMixin],
        computed: {
            formatProcess() {
                return function(percentage) {
                    return '生成大纲中\n已完成' + percentage + '%';
                };
            },
        },
        data() {
            return {
                socketInstance: null,
                loadingContent: null, // 初次加载一个模型
                loadPercentage: 0,
                submitLoading: false,
                resetSubmit: false,
                inputText: '',
                aId: '',
                aiList: [],
                docData: null,
                listTemplate: [],
                coverData: {},
                currOutline: null,
            }
        },
        methods: {
            // 父组件调用
            setCurrOutline(outlineId) {
                this.currOutline = null;
                if (this.docData && this.docData.outlineList) {
                    let currOutline = $global.findNodeByNodeId(outlineId, this.docData.outlineList, { key:'outlineId', children:'children' });
                    if (currOutline.parentId !== '0') {
                        this.currOutline = currOutline;
                    }
                }
            },

            appendOutlineContent() {
                const getSelectChildNodes = (index, nodes) => {
                    const childNodes = [];
                    for (let i= index; i<nodes.length; i++) {
                        let node = nodes[i];
                        if ($global.hasClass(node, 'struct')) {
                            break;
                        }
                        childNodes.push(node)
                    }
                    return childNodes;
                }
                debugger
                if (this.currOutline) {
                    var contents =  this.docData.docData.contents;//this.docData.docData.table_of_contents;
                    // 从目录数据中获取下一个章节的数据，以确定下标位置
                    // const currToc = _.find(contents, { name:this.currOutline.outlineTitle });
                    // const currIndex = [].indexOf.call(contents, currToc);
                    // const nextToc = contents[currIndex + 1];
                    console.log('this.docData=>>',this.docData);
                    const listArr = [];
                    const parentId = this.currOutline.outlineId;
                    const outlineType = this.currOutline.outlineType;
                    const outlineCatalog = this.currOutline.outlineCatalog;

                    let olIndex = 0;
                    let appendixIndex = 0;
                    for (let i=this.currOutline.position + 1; i<contents.length; i++) {
                        let node = contents[i];
                        if (node.type === 'section') {
                            if (node.level === 1) {
                                break;
                            } else {
                                if ([1,2,11,12].includes(outlineType)) {
                                    let strs = node.value.split('\n\n');
                                    strs.forEach(str => {
                                        listArr.push(`<p style="text-indent: 2em;">${str.replaceAll('\n\t*','<br/>')}</p>`);
                                    })
                                } else {
                                    let dataPrev = [8,9].includes(this.currOutline.outlineType) ? outlineCatalog : '';
                                    if (dataPrev) {
                                        dataPrev = `data-prev="${dataPrev}"`;
                                        appendixIndex++;
                                    } else {
                                        olIndex++;
                                    }
                                    let cls = [8,9].includes(this.currOutline.outlineType) ? 'appendix-list' : 'ol-list';
                                    let index = [8,9].includes(this.currOutline.outlineType) ? appendixIndex : olIndex;
                                    let oid = $global.guid();
                                    let contentId = $global.guid();
                                    listArr.push(`<div class="${cls} struct" data-bookmark="${oid}" ${dataPrev} data-outlineid="${oid}" data-parentid="${parentId}" data-outlinetype="${outlineType}" data-index="${index}" data-contentid="${contentId}">${node.value}</div>`);
                                }
                            }
                        } else { //  if (node.type === 'text')
                            let strs = node.value.split('\n\n');
                            strs.forEach(str => {
                                listArr.push(`<p style="text-indent: 2em;">${str.replaceAll('\n\t*','<br/>')}</p>`);
                            })
                        }
                    }

                    // console.log('appendOutlineContent listArr=>', listArr);
                    if (listArr.length) {
                        let htmlContent = '';
                        const section = document.createElement('div');
                        section.innerHTML = listArr.join("");
                        const childNodes = Array.from(section.childNodes);

                        for(let i=0; i<childNodes.length; i++) {
                            let node = childNodes[i];
                            if ($global.hasClass(node, 'struct')) {
                                let selfChilds = getSelectChildNodes(i + 1, childNodes);
                                if (selfChilds.length) {
                                    selfChilds.forEach(n => {
                                        node.appendChild(n);
                                    })
                                }
                            }
                        }
                        htmlContent = section.innerHTML;
                        // debugger
                        section.remove();
                        this.$emit('change', { act:'appendContent', htmlContent })
                    }
                }
            },

            refreshSubmit() {
                let lastItem = _.last(this.aiList);
                // this.inputText = lastItem.formText;
                this.resetSubmit = true;
                // debugger
                this.submitInput(lastItem.formText);
            },
            submitInput(formText) {
                if (this.submitLoading) {
                    return;
                }
                formText = formText || this.inputText;
                if (!formText) {
                    this.$notify({
                        title: '错误提示',
                        type: 'error',
                        message: '请输入您的提问',
                        position: 'bottom-right'
                    });
                    return;
                }
                this.submitLoading = true;
                let obj = {
                    id: this.aId,
                    icon: 'el-icon-loading',
                    formText: _.trim(formText),
                    result: 'AI正在处理中您的提问，请等候完成...'
                }
                // console.log(obj)
                if (!this.resetSubmit) {
                    this.aId = $global.guid();
                    obj.id = this.aId;
                    this.aiList.push(obj);
                } else {
                    let index = _.findIndex(this.aiList, { id:this.aId });
                    if (!!~index) {
                        this.$set(this.aiList, index, obj);
                    }
                }
                this.interTimes();
                this.interfaceAi();
            },
            interTimes() {
                let times = 0;
                this.loadingContent = setInterval(() => {
                    times++;
                    this.loadPercentage = times * 5;
                    if (times >= 20) {
                        clearInterval(this.loadingContent);
                        this.loadingContent = null;
                    }
                }, 1000)
            },

            async interfaceAi() {
                this.docData = this.parseDocOutline();
                setTimeout(() => {
                    let index = _.findIndex(this.aiList, { id:this.aId });
                    if (!!~index) {
                        let item = this.aiList[index];
                        item.icon = 'el-icon-chat-line-square';
                        item.result = `<p class="str-title">已为您列出文档大纲：</p><p>${this.docData.outlineStr}</p>`; //'这里是处理完成的结果' + (this.resetSubmit?'--刷新的':'');
                        this.$set(this.aiList,  index, item);
                        this.inputText = '';
                        this.resetSubmit = false;
                    }
                    this.submitLoading = false;
                }, 500);
            },
            async insertHtml() {
                // console.log('docData===>', this.docData);
                const pageNo = this.docData?.pageNo || 'XXX-001'
                // const outlineList = this.docData.outlineList[0]['children'];
                // 根据大纲生成基本文档结构
                let htmlArr = [`<div class="page-container expand" data-id="${this.docData.docId}" data-stdkind="1400" data-outlineid="${this.docData.outlineId}" data-new="true">`];
                // 企标模板封面内容
                htmlArr.push(`<div class="info-block cover fixed">${this.coverData.content}</div>`);

                if (this.docData && this.docData.outlineList) {
                    let outlineHtmlArr = parseStructHtml.parseHtmlByOutline(this.docData.outlineList, pageNo, 1400, this.templateList, {});
                    htmlArr = htmlArr.concat(outlineHtmlArr);
                }
                htmlArr.push('</div>');
                this.$emit('change', { act:'insertOutline', htmlArr});
            },

            handleKeydown(event) {
                if (event.key === 'Enter' && event.ctrlKey) {
                    this.submitInput(this.inputText);
                }
            },

            async getTemplist() {
                const res = await listContentTemplate({});
                if (res && res.rows) {
                    this.templateList = res.rows.map(item => {
                        item = _.omit(item, ['createTime','createUser','delFlag','deleteTime','deleteUser','isAsc','orderByColumn','pageNum','pageSize','params','searchValue','searchValueArray','updateTime','updateUser'])
                        return item;
                    });

                    this.coverData = _.find(this.templateList, { tmplType:1400, tmplName:'cover'});
                    console.log('this.coverData====>', this.coverData)
                }
            },

            /**
             * @description 断开Socket连接
             */
            disconnectSocket() {
                if (this.socketInstance) {
                    this.socketInstance.closeSocket(true);
                    this.socketInstance = null;
                }
            },

            /**
             * @description 创建SOCKET实例
             */
            connectSocket(data = {}) {
                /* if (this.editorSetting.author.lockedAll && !this.editorSetting.readonly && !this.editorSetting.reader) {
                    if (this.socketInstance) {
                        this.socketInstance.closeSocket();
                    }
                    this.socketInstance = new socketUtil(this.editorSetting.socketURL || process.env.VUE_APP_SOCKET, { ...this.editorSetting.author });

                } */
                console.log('connectSocket====>', this.$attrs)
            },

            destroy() {
                this.disconnectSocket();
            }
        },
        created() {
            this.getTemplist();
            this.connectSocket();
        },

        beforeDestroy() {
            this.destroy();
        }
    }
</script>

<style lang="scss" scoped>
    @import './docAi.scss';
</style>

<style>
    .ai-assistant{
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-gap: 20px;
        padding:10px;
    }
    .ai-assistant>div{
        padding: 5px 10px;
        border: 1px solid rgba(0, 0, 0, .08);
        text-align: center;
    }
    .ai-assistant>div>h3.title{
        font-size: 14px;
    }
</style>
