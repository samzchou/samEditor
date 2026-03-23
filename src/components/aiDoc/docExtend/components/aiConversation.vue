<template>
    <div class="ai-conversation-cmp">
        <div class="chat-title">
            <div v-if="filterConversation.length">
                <h3>{{ conversation.title || '知识问答'}}</h3>
                <p :data-plugin="currPlugin">共 {{filterConversation.length}} 条会话</p>
            </div>
            <div v-else>
                <h3>暂无会话，请提问</h3>
            </div>
            <div class="btn">
                <span class="iconfont icon-trash" title="清空会话" @click.stop.prevent="emptyConversation()" />
                <span class="iconfont icon-undo" title="退出" @click.stop.prevent="closeChat" />
            </div>
        </div>
        <div class="conversation" id="chatConversation">
            <el-scrollbar class="scrollbar ver" ref="chatScrollbar">
                <template v-for="(item, idx) in filterConversation">
                    <!-- AI回答 -->
                    <div v-if="item.role==='assistant'" class="assistant" :key="idx+'0'">
                        <!-- 一般会话 -->
                        <div class="icons" v-if="!item.type">
                            <span class="iconfont icon-chatgpt"></span>
                            <span class="iconfont icon-icon-test26" title="复制" @click.stop.prevent="copyContent(item.content)"></span>
                        </div>
                        <div class="loading" v-if="item.type && item.type==='loading'">
                            <p>
                                <i class="el-icon-loading" />
                                <span>{{item.loadingText||'正在处理中，请稍后...'}}</span>
                            </p>
                        </div>

                        <article class="text markdown-body">
                            <div class="loading" v-if="item.type && item.type==='loading'">
                                <div class="dot" />
                                <div class="dot" />
                                <div class="dot" />
                            </div>
                            <div v-else-if="item.type && item.type==='tocList'" class="toc-list">
                                <div class="load-progress" v-if="item.docProcess && item.docProcess<100">
                                    <el-progress :percentage="item.docProcess" />
                                </div>
                                <ul>
                                    <li v-for="(toc, index) in item.content" :key="index">
                                        <div class="tit">
                                            <template v-if="[8,9].includes(toc.outlineType)">
                                                <span>附录{{toc.outlineCatalog}} {{toc.outlineTitle}}</span>
                                            </template>
                                            <template v-else>
                                                <span>{{toc.outlineCatalog||'-'}}</span>
                                                <span>{{toc.outlineTitle}}</span>
                                            </template>
                                        </div>
                                        <div class="load-toc">
                                            <i v-if="!toc.loaded" class="el-icon-loading" />
                                            <i v-else class="el-icon-document-checked loaded" />
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <!-- 一般文档 -->
                            <template v-else>
                                <div v-if="item.type && item.type==='file'">
                                    <el-image v-if="['png','jpg','jpeg','gif'].includes(item.suffix)" :src="item.filePath" :title="item.fileName" :preview-src-list="[item.filePath]" style="width:200px;" />
                                    <el-link v-else>
                                        <span>{{item.fileName}}</span>
                                    </el-link>
                                </div>

                                <!-- 一般会话内容 -->
                                <vue-markdown v-else v-highlight :source="item.content" />
                                <!-- 语义问答内容 答案 -->
                                <div v-if="item.ans" class="ans-list">
                                    <ul v-if="item.ans.length">
                                        <li v-for="(ans, index) in item.ans" :key="index">
                                            <span>{{ans.label}}</span>
                                            <el-tooltip popper-class="ans-poppver" v-for="(em, i) in ans.em" :key="i" effect="light" placement="top">
                                                <div slot="content" v-html="em.content" />
                                                <em :key="i" @click.stop.prevent="mapTarget(item, em.label)">{{em.label+1}}</em>
                                            </el-tooltip>
                                        </li>
                                    </ul>
                                    <p v-else style="margin-left: 2em;color: #888;font-size: 1.15em;">暂无答案</p>
                                </div>
                                <!-- 语义问答内容 来源 -->
                                <div v-if="item.sourceList && item.sourceList.length" class="source-list">
                                    <h3>
                                        <i class="el-icon-paperclip"/>
                                        <span>来源</span>
                                    </h3>
                                    <ul v-if="options.simi_search" class="std-list">
                                        <li v-for="(source, index) in item.sourceList" :key="index" @click.stop.prevent="viewInfo(source, 'source')">
                                            <h5>{{source.std_no}} {{source.std_name}}</h5>
                                            <el-descriptions :column="5" border>
                                                <el-descriptions-item label="英文名称" :span="5">{{source.eng_name}}</el-descriptions-item>
                                                <el-descriptions-item label="ICS">{{source.ics||'-'}}</el-descriptions-item>
                                                <el-descriptions-item label="CCS">{{source.ccs||'-'}}</el-descriptions-item>
                                                <el-descriptions-item label="类型">{{source.std_type}}</el-descriptions-item>
                                                <el-descriptions-item label="实施日期">{{source.perform_date}}</el-descriptions-item>
                                                <el-descriptions-item label="发布日期">{{source.release_date}}</el-descriptions-item>
                                                <el-descriptions-item label="发布单位" :span="2">{{source.gk_unit}}</el-descriptions-item>
                                                <el-descriptions-item label="参编单位" :span="3">{{source.relase_unit}}</el-descriptions-item>
                                                <el-descriptions-item label="文档描述" :span="5">{{source.page_content}}</el-descriptions-item>
                                            </el-descriptions>
                                        </li>
                                    </ul>
                                    <ul v-else class="normal-list">
                                        <li v-for="(source, index) in item.sourceList" :key="index" @click.stop.prevent="viewInfo(source, 'source')">
                                            <h5>{{source.std_no}}</h5>
                                            <h5>{{source.std_name}}</h5>
                                            <p>{{source.page_content}}</p>
                                            <em>{{index+1}}</em>
                                        </li>
                                    </ul>
                                </div>
                                <!-- 语义问答内容 相关 -->
                                <div v-if="item.correlation && item.correlation.length" class="correlation-list">
                                    <h3>
                                        <i class="el-icon-document-copy" />
                                        <span>相关</span>
                                    </h3>
                                    <ul>
                                        <li v-for="(correlation, index) in item.correlation" :key="index" @click.stop.prevent="submitAnswer(correlation)">
                                            <el-link>{{correlation}}</el-link>
                                        </li>
                                    </ul>
                                </div>
                            </template>
                        </article>
                        <!-- 底部按钮 -->
                        <div class="icons bottom" v-if="!item.type">
                            <span class="iconfont icon-chatgpt"></span>
                            <!-- <span class="iconfont icon-jurassic_refresh" title="刷新" @click.stop.prevent="refreshChat(idx, 'assistant')"></span> -->
                            <span class="iconfont icon-icon-test26" title="复制" @click.stop.prevent="copyContent(item.content)"></span>
                            <!-- <span class="iconfont icon-dicengjiagou" title="转存到编辑器" @click.stop.prevent="openEditor(item.content)"></span> -->
                            <!-- <span class="iconfont icon-gongshi" title="公式转换" @click.stop.prevent="openEditor(item.content)"></span> -->
                            <!-- <span class="iconfont icon-trash" title="删除" @click.stop.prevent="removeChat(item)"></span> -->
                            <template v-if="currPlugin==='semantics' && item.uuid">
                                <span class="iconfont icon-31dianzan" title="点赞" @click.stop.prevent="commentChat(item, true)"></span>
                                <span class="iconfont icon-chaping-xianxing" title="差评" @click.stop.prevent="commentChat(item, false)"></span>
                            </template>
                            <strong v-if="item.createTime" class="data-time">{{parseTime(item.createTime)}}</strong>
                        </div>

                    </div>
                    <!-- 用户提问 -->
                    <div v-else class="user-answer" :key="idx+'1'">
                        <div class="icons">
                            <span class="iconfont icon-message"></span>
                            <!-- <span class="iconfont icon-jurassic_refresh" title="刷新" @click.stop.prevent="refreshChat(idx, 'user')"></span> -->
                            <span class="iconfont icon-icon-test26" title="复制" @click.stop.prevent="copyContent(item.content)"></span>
                            <!-- <span class="iconfont icon-trash" title="删除" @click.stop.prevent="removeChat(item)"></span> -->
                        </div>
                        <div v-if="item.type && item.type==='temp'" style="color:#CCC;">正在输入...</div>
                        <div class="text">
                            <template v-if="typeof item.content==='string'">
                                <p>{{item.content}}</p>
                            </template>
                            <template v-if="typeof item.content==='object'">
                                <p v-for="(o, i) in item.content" :key="i">
                                    <span v-if="o.type==='text'">{{o.text}}</span>
                                    <span v-else-if="o.type==='file'">
                                        <el-link icon="el-icon-document" @click.stop.prevent="viewDoc(o)">查阅文件</el-link>
                                    </span>
                                    <el-image v-else-if="o.type==='image_url'" :src="o.image_url.url" :preview-src-list="[o.image_url.url]" style="width:200px;" />
                                </p>
                            </template>
                        </div>
                        <div class="data-time" v-if="item.createTime">
                            {{parseTime(item.createTime)}}
                        </div>
                    </div>
                </template>
            </el-scrollbar>
        </div>
        <div class="forms chat-form">
            <div class="icons">
                <el-tooltip v-if="options?.quickyCommand" content="快捷指令" placement="top">
                    <span class="iconfont icon-kuaisugaoxiao cmd" @click.stop.prevent="quickyCommand" />
                </el-tooltip>
				<!--
                <el-tooltip content="上传文件" placement="top">
                    <span class="iconfont icon-upload" title="上传文件" @click.stop.prevent="uploadFile" />
                </el-tooltip>
				-->
                <el-tooltip content="清除对话" placement="top">
                    <span class="iconfont icon-jishufuwu" title="清除对话" @click.stop.prevent="emptyConversation()" />
                </el-tooltip>
                <el-tooltip content="回到顶部" placement="top">
                    <span class="iconfont icon-icon-test13" title="回到顶部" @click.stop.prevent="scrollTopTop()" />
                </el-tooltip>
                <el-tooltip content="回到底部" placement="top">
                    <span class="iconfont icon-icon-test14" title="回到底部" @click.stop.prevent="scrollTopBottom()" />
                </el-tooltip>
            </div>
            <div class="content">
                <div v-if="currFile && !['aiKnowledge'].includes(currPlugin)" class="img">
                    <img v-if="['webp','svg','jpg','png','gif'].includes(currFile.suffix)" :src="currFile.url" />
                    <i v-else class="iconfont icon-fujian02" :title="currFile.fileName" />
                </div>
                <div class="input-text">
                    <el-input ref="inputText" type="text" v-model="formData.inputText" :disabled="submitLoading" :placeholder="placeholder||'请输入提问内容，直接回车提交问题'" @input="inputTemp(false)" @keyup.native.enter="sendMessage()" />
                    <span class="put-type">
                        <i class="iconfont" :class="iconPutType" />
                    </span>
                </div>
                <div class="btn">
                    <el-button icon="el-icon-s-promotion" :loading="submitLoading" @click.stop.prevent="sendMessage()">发送</el-button>
                </div>
            </div>
            <input :id="uploadId" type="file" accept=".webp,.svg,.jpg,.jpeg,.png,.gif,.doc,.docx,.pdf" v-show="false" @change="handleFileChange" />
        </div>
    </div>
</template>

<script>
    import Vue from "vue";
    // 后台接口
    import { listContentTemplate, aiMessage } from '@/api/editor.js';
    // 通用函数
    import $global from '@/utils/global.js';
    // 事件总线
    import $bus from '@/utils/bus.js';
    // 后台接口
    import { aiChat, uploadFile, mgApi } from '@/api/nodeServer.js';
    // webSocket通信函数库
    import socketUtil from '@/utils/socketUtil.js';
    // 编辑器业务
    import docMixin from '../config/docMixins.vue';

    // markdown组件
    import VueMarkdown from 'vue-markdown';
    // markdown组件样式及高亮格式化样式
    import 'github-markdown-css/github-markdown.css'
    import hljs from "highlight.js";
    import "highlight.js/styles/atom-one-dark.css";
    import javascript from 'highlight.js/lib/languages/javascript'
    import java from 'highlight.js/lib/languages/java';
    import css from 'highlight.js/lib/languages/css';
    import less from 'highlight.js/lib/languages/less';
    import scss from 'highlight.js/lib/languages/scss';
    import go from 'highlight.js/lib/languages/go';
    import php from 'highlight.js/lib/languages/php';
    import python from 'highlight.js/lib/languages/python';
    import ruby from 'highlight.js/lib/languages/ruby';
    import stylus from 'highlight.js/lib/languages/stylus';
    import typescript from 'highlight.js/lib/languages/typescript';
    import xml from 'highlight.js/lib/languages/xml';

    const languages = {
        javascript,
        java,
        css,
        less,
        scss,
        go,
        php,
        python,
        ruby,
        stylus,
        typescript,
        xml
    }
    Object.keys(languages).forEach(key => {
        hljs.registerLanguage(key, languages[key])
    })

    Vue.directive("highlight", (el) => {
        let blocks = el.querySelectorAll("pre code");
        blocks.forEach(block => {
            hljs.highlightBlock(block);
        });
    });

    export default{
        name: 'ai-conversation-cmp',
        components: {
            VueMarkdown
        },
        props: {
            plugin: String,
            placeholder: String,
            data: {
                type: Object,
                default: () => {
                    return {};
                }
            },
			options: {
				type: Object,
                default: () => {
                    return {};
                }
			}
        },
        mixins: [docMixin],
        watch: {
            data: {
                handler(data) {
                    if (!_.isEmpty(data) && !$global.compare(data, this.currItem)) {
                        this.currItem = _.cloneDeep(data);
                        this.currFile = data.file;
                        this.currPlugin = data.plugin || data.type || 'chat';
                        if (!_.isEmpty(data.conversation) && !_.isEmpty(data.conversation.children)) {
                            this.conversation = _.cloneDeep(data.conversation);
                        } else {
                            this._initChat();
                        }
                        if (data.title) {
                            this.$set(this.conversation, 'title', data.title);
                        }
                        // 如果是智能写标准的则加载模板定义封面 创建一份陶瓷抽水马桶的企业标准
                        if (this.currPlugin === 'docEditor') {
                            this.getTemplist();
                        }
                    }
                },
                immediate: true,
                deep: true,
            },

            options: {
                handler(data) {
                    if (!_.isEmpty(data)) {
                        if (data.title) {
                            this.$set(this.conversation,'title', data.title);
                        }
                        if (data.plugin) {
                            setTimeout(() => {
                                this.currPlugin = data.plugin;
                                // 如果是智能写标准的则加载模板定义封面 创建一份陶瓷抽水马桶的企业标准
                                if (this.currPlugin === 'docEditor' && !this.coverData) {
                                    this.getTemplist();
                                }
                            }, 200);
                        }

                        setTimeout(() => {
                            if (!this.conversation.children.length) {
                                this._initChat();
                            }
                        }, 500)
                    }
                },
                immediate: true,
                deep: true,
            },

            process: {
                handler(val) {
                    if (val) {
                        let item = _.find(this.conversation.children, { role:'assistant', type:'loading' });
                        if (item) {
                            let index = _.findIndex(this.conversation.children, { role:'assistant', type:'loading' });
                            item.content = '分析中，已完成 ' + val + '%';
                            this.$set(this.conversation.children, index, item);
                        }
                    }
                },
                immediate: true
            }
        },
        computed: {
            filterConversation() {
                return this.conversation.children.filter(o => ['user','assistant'].includes(o.role));
            },
			nodeURL() {
				return this.options?.nodeURL;
			},
			aiSocketURL() {
				return this.options?.aiSocketURL;
			},
            printInfoObj() {
                return {
                    id:"chatConversation",
                    popTitle: '',//this.conversation.title,
                    preview: false,  // 是否开启预览
                    extraCss: this.nodeURL + '/css/print_chat.css',
                    extraHead: '<meta http-equiv="Content-Language" content="zh-cn"/>',
                    beforeOpenCallback:() => {
                        console.log('开始打印之前的callback')
                    }
                }
            },

            iconPutType() {
                switch(this.formData.inputType) {
                    case 'text':
                        return 'icon-dakaijianpan';
                    case 'voice':
                        return 'icon-huatong-L';
                    // case 'voicing':
                    //     return 'icon-huatong-L'
                }
                return '';
            },
        },
        data() {
            return {
                // modelName: 'gpt-4o-mini-2024-07-18',
                currModel: {
                    label:'GPT-4o-mini',
                    value:'gpt-4o-mini-2024-07-18',
                },
                submitLoading: false,
                isNewSubject: true,
                fullScreen: false,
                formData: {
                    inputType: 'text',
                    inputText: '',
                    tmpText: '',
                },
                conversation: {
                    children: []
                },
                viewFile: null,
                uploadId: $global.guid(),
                currItem: null,
                currFile: null,
                currPlugin: 'semantics',

                socketId: $global.guid(),
                socketInstance: null,
                docProcess: 20,
                tocList: [],
                coverData: null,
                events: [],
                timeInter: null,
                allTimes: 0,
            }
        },
        methods: {
            // 点赞或差评
            commentChat(item, flag, feedbacks='') {
				this.$emit('change', { act:'commentAnswer', data:{item,flag,feedbacks} })
            },
			_initChat() {
				const children = [{
					role: 'assistant',
					type: 'temp',
					content: this.options?.answerTip || this.data?.answerTip || '有什么可以帮您的吗？'
				}];
				this.$set(this.conversation, 'children', children);
			},


            // 清除高亮显示
            clearHighlights() {
                const container = document.getElementById('chatConversation');
                const highlightedElements = container.querySelectorAll('.highlight-key');
                highlightedElements.forEach(element => {
                    const text = element.textContent;
                    element.outerHTML = text;
                });
            },
            // 高亮显示搜索文本并定位第一个元素
            highlightText(keyword) {
                const escapeRegExp = (string) => {
                    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                }
                const container = document.getElementById('chatConversation');
                const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
                const contentHtml = container.innerHTML;
                const highlightedHtml = contentHtml.replace(regex, '<span class="highlight-key">$1</span>');
                container.innerHTML = highlightedHtml;

                const firstMatch = container.querySelector('.highlight-key');
                if (firstMatch) {
                    firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            },
            // 关键字全文搜索
            searchAndHighlight(obj) {
                const keyword = obj.data;
                if (keyword.trim() === '') {
                    this.clearHighlights();
                    return;
                }
                this.clearHighlights();
                this.highlightText(keyword);
            },

            // 点击后关联到来源
            mapTarget(item, index) {
                const sourceItem = item.sourceList[index];
                if (sourceItem) {
                    this.viewInfo(sourceItem, 'source');
                }

            },
            // 查阅相关信息
            viewInfo(item, type) {
                this.$emit('change', { act:'aiInfo', type, data:item });
            },
			putMsg(data, keep=false) {
				if (keep) {
					let lastItem = _.last(this.conversation.children);
					if (lastItem) {
						delete lastItem.type;
						lastItem.content = data.content;
						this.$set(this.conversation.children, this.conversation.children.length-1, lastItem);
					}
				} else {
					this.conversation.children.push(data);
				}
			},
            // 查阅文件
            viewDoc(data) {
                console.log('viewDoc===>', data);
                if (data) {
                    /* this.viewFile = data;
                    this.dialogParams = {
                        visible: true,
                        title: '查阅文件',
                        fullscreen: true
                    } */
                }

            },
            // 切换输入模式
            toggleInputType() {
                if (this.formData.inputType === 'text') {
                    this.$set(this.formData, 'inputType', 'voice');
                } else {
                    this.$set(this.formData, 'inputType', 'text');
                }
            },
            createApp(item) {
                console.log('createApp', item.content);
                if (this.options.outData) {
                    this.$emit('change', item.content);
                } else {
                    $global.setStroage('appContent', item.content);
                    this.$router.push('/createApp');
                }

            },
            // 打开对话框,使用插件
            usePlugin() {
                this.dialogParams = {
                    visible: true,
                    title: '使用插件',
                    width: '500px',
                    cmpName: 'aiPlugin',
                    data: this.currPlugin
                }
            },
            parseTime(time) {
                return $global.formatDateTime("yyyy-MM-dd hh:mm:ss", time);
            },
            // 关闭会话
            closeChat() {
                this.$emit('change', { act:'close' });
            },
            // 清空会话
            emptyConversation() {
                this.$confirm('确定清空内容?', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    this.removeConversation();
                }).catch(() => {});
            },
            async removeConversation() {
                this.$emit('change', { act:'emptyChat', data:this.currItem });
                this.$set(this.conversation, 'children', [{
                    role: 'assistant',
                    type: 'temp',
                    content: this.data.answerTip || '有什么可以帮您的吗？'
                }]);
            },

            // 保存会话
            saveConversation() {
                this.$emit('change', { act:'save', data:this.conversation });
            },

            // 复制内容
            async copyContent(content, inEditor=false) {
                try {
                    if (inEditor) {
                        this.$emit('change', { act:'inEditor', content });
                    } else {
                        await navigator.clipboard.writeText(content);
                        this.$message.success('内容已复制到剪贴板');
                    }
                } catch (err) {
                    this.$message.error('复制到剪贴板失败:', err);
                }
            },
            uploadFile() {
                const fileEle = document.getElementById(this.uploadId);
                if (fileEle) {
                    fileEle.click();
                }
            },

            async handleFileChange(evt) {
                evt.stopPropagation();
                evt.preventDefault();
                const files = document.getElementById(this.uploadId).files;
                const file = files[0];
                const fileName = file.name;
                const suffix = $global.getExt(file.name).toLowerCase();

                if (['webp','svg','jpg','jpeg','png','gif'].includes(suffix)) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        var basePrefix = 'image/jpeg;base64';
                        if (suffix === 'svg') {
                            basePrefix = 'image/svg+xml;base64';
                        }
                        const base64String = `data:${basePrefix},` + reader.result.split(',')[1];
                        this.currFile = {
                            url: base64String,
                            suffix,
                            fileName
                        };
                    };
                    reader.readAsDataURL(file);
                } else {
                    this.submitLoading = true;
                    // 上传文件
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('filename', file.name);
                    formData.append("act", 'flowFile-upload');

                    const res = await uploadFile(formData, this.nodeURL);
                    console.log('upload file====>', res);
                    if (res) {
                        this.currFile = {
                            id: res.data[0]['id'],
                            url: res.data[0]['outFile'],
                            suffix,
                            fileName,
                        }

                        // 提交给后台
                        if (this.currPlugin === 'aiKnowledge') {
                            this.putKnowledgeFile();
                        } else {
                            this.$emit('change', { act:'upload', file:this.currFile });
                        }
                    }
                }
            },

            // 文档提交到后台进行训练 ，请准备知识问答...
            async putKnowledgeFile() {
                this.conversation.children.push({
                    "role": "user",
                    "content": [{
                        "type": "text",
                        "text": `已上传了文件《${this.currFile.fileName} 》到知识库`
                    },{
                        "type": "file",
                        ...this.currFile
                    }],
                    "createTime": new Date().getTime(),
                });
                let ass = {
                    "role": "assistant",
                    "content": `文档《${this.currFile.fileName} 》已提交给大模型进行训练，请准备知识问答...`
                }
                this.conversation.children.push(ass);
                // 保存会话
                this.$set(this.currItem, 'conversation', this.conversation);
                // this.saveKnowledgeChat();
            },
            // 保存知识问答会话
            async saveKnowledgeChat() {
                const uuid = this.currItem?.id || $global.guid();
                var condition = {
                    operation: 'saveData',
                    tn: 'aiChat',
                    data: {
                        id: uuid,
                        title: this.currItem?.title || this.options?.title || '智能问答',
                        children: this.conversation.children,
                        type: 'aiKnowledge',
                        plugin: this.options.collectionName || 'semantics',
                        contents: this.currFile || this.data?.file || ''
                    }
                }
                // debugger
                if (!this.currItem || !this.currItem?.id) {
                    if (this.currItem && this.currItem?.id) {
                        this.$set(this.currItem, 'id', uuid);
                    }
                    condition.isAdd = true;
                }
                const res = await mgApi(condition, this.nodeURL);
                if (res && res.data) {
                    this.$emit('change', { act:'chat', data:this.currItem || {} });
                }
                this.submitLoading = false;
            },
            // 刷新会话
            refreshChat(index, type) {
                let item = this.conversation.children[index];
                if (type === 'assistant') {
                    item = this.conversation.children[index-1];
                }
                // this.scrollTopBottom();
                this.sendMessage(item.content.replace(/\n/g,''));
            },

            // 临时会话
            inputTemp() {
                let chatTempIndex = _.findIndex(this.conversation.children, { type:'temp', role:'user' });
                if (!~chatTempIndex) {
                    this.conversation.children.push({
                        "role": "user",
                        "type": "temp",
                        "content": this.formData.inputText,
                        "createTime": +new Date(),
                    })
                } else {
                    let item = _.find(this.conversation.children, { type:'temp', role:'user' });
                    item.content = _.trim(this.formData.inputText);//.replace(/\s/g,'');
                    this.$set(this.conversation.children, chatTempIndex, item);
                    if (!item.content) {
                        this.conversation.children.splice(chatTempIndex, 1);
                    }
                }
                this.scrollTopBottom();
            },


            // 如使用插件则走此方法处理
            async pluginChat(inputText) {
                if (!this.socketInstance) {
                    await this.connectSocket();
                }

                // AI临时会话
                this.conversation.children.push({
                    "role": "assistant",
                    "type": "loading",
                    "content": "正在输入并分析中...",
                });
                // debugger
                switch(this.currPlugin) {
                    case 'docEditor': // 智能文档编写
                        const params = {
                            "actionType": "run_jimo_logic",
                            "JimoLogic": "check_generate_progress",
                            "params": {
                                "action": "generate",
                                "opr_id": $global.guid(),
                                "std_name": _.trim(inputText)
                            }
                        }
                        this.tocList = [];
                        $global.setStroage('aiInput', _.trim(inputText));
                        this.socketInstance.sendMsg(params, 'generate'); // _.trim(inputText)
                        break;
                    case 'semantics': // 语义智能问答
                        this.generateSemantics();
                        break;
                }
                // 滚动到底部
                this.scrollTopBottom();
            },

            submitAnswer(inputText) {
                this.submitLoading = true;
                this.$set(this.formData, 'inputText', inputText);
                // AI临时会话
                this.conversation.children.push({
                    "role": "user",
                    "type": "temp",
                    "content": inputText,
                    "createTime": +new Date(),
                });
                // AI临时会话
                this.conversation.children.push({
                    "role": "assistant",
                    "type": "loading",
                    "content": "正在输入..."
                });
                // 滚动到底部
                this.scrollTopBottom();
                // 发送请求
                this.generateSemantics();
            },

            // 语义智能问答
            async generateSemantics() {
                // 请求接口获取数据
                // console.log(this.options, this.data)
                const params = {
                    "command": this.formData.inputText,
                    "model": this.options.model || "qianwen",
                    "knowledge_base_uuid": this.options.knowledge_base_uuid,
                    "collection_name": this.options.collection_name || "std_graph_embedding_indicators",
                    "is_local": "true",
                    "JimoLogic": this.options.jimoLogic || "lepton_question_search", // lepton_search
                    "session_uuid": this.options.session_uuid,
                    "user_id": this.options.userId,
                }
				// 语义问答
                if (this.options.simi_search) {
                    params.opr = this.options.opr || this.data.opr;
                }
                const condition = {
                    "actionType": "db_opr",
                    "ssid": "NcAcAccAAccAcBAOAIEACBc2ccMAAAcD",
                    params,
                    "act": "JimoLogicOpr"
                }
                const res = await aiMessage(condition, this.options.aiInterfaceURL || 'http://192.168.0.19:3999/rest/db_opr');
                // console.log(res);
                // debugger
                if (res && res.msg) {
                    const lastItem = _.last(this.conversation.children);
                    const msg = JSON.parse(res.msg);
                    if (_.isEmpty(msg)) {
                        lastItem.content = '### 没有查询到具体的答案';
                    } else {
                        lastItem.sourceList = msg.source_list;
						if (msg.page_content) {
							const contents = msg.page_content.split(/\n\n/);
							console.log('contents------->', contents)
							const ans = [];
							for (let content of contents) {
								// 将字符串后的数组进行转换
								content = content.replace(/\[\[index:(\d+)\]\]/g, '[$1]');
								// 提取数组
								let indexs = content.match(/\[(\d+)\]/g); // ['[0]', '[1]']
								if (indexs && _.isArray(indexs)) {
									indexs = indexs.map(item => parseInt(item.slice(1, -1), 10)); // 转为[0,1]
									// 清除数组字符串
									content = content.replace(/\[\d+\]/g, '');
									ans.push({
										label: content,
										em: indexs.map(o => {
											let stdItem = lastItem.sourceList[o] || {};
											let obj = {
												content: stdItem ? `<h5>${stdItem.std_no} ${stdItem.std_name}</h5><p>${stdItem.page_content}</p>` : '',
												label:o
											}
											return obj
										})
									})
								}
							}
							lastItem.ans = _.sortBy(ans, ['label']);
						}
                        lastItem.content = '### 答案：';
                        lastItem.correlation = msg.related;
                        lastItem.uuid = msg.uuid;
                    }

                    // AI临时会话
                    // debugger
                    let tempIndex = _.findIndex(this.conversation.children, { role:'assistant', type:'temp' });
                    if (!!~tempIndex) {
                        this.conversation.children.splice(tempIndex, 1);
                    }
                    // 更新用户问题
                    tempIndex = _.findIndex(this.conversation.children, { role:'user', type:'temp' });
                    if (!!~tempIndex) {
                        let tempItem = _.find(this.conversation.children, { role:'user', type:'temp' });
                        delete tempItem.type;
                        this.$set(this.conversation.children, tempIndex, tempItem);
                    }

                    delete lastItem.type;
                    lastItem.createTime = +new Date();
                    console.log('lastItem===>', lastItem, this.conversation.children)
                    this.$set(this.conversation.children, this.conversation.children.length-1, lastItem);

                    console.log('generateSemantics this.conversation===>', this.conversation);

                    this.$set(this.formData, 'inputText', '');
                    // 保存会话
                    // this.saveKnowledgeChat();
                    // 滚动到底部
                    this.scrollTopBottom();
                }
                this.submitLoading = false;

            },

            // 标准文档大纲
            async setTocList(data) {
                // debugger
                const tocList = data.table_of_contents;
                const docData = {
                    docId: $global.guid(),
                    outlineId: $global.guid(),
                }
                this.tocList = this.setContentByOutline(tocList, docData);
                const htmlContent = this.setDocHtmlContent(this.tocList);
                let htmlArr = [`<div class="page-container expand" data-id="${docData.docId}" data-stdkind="1400" data-outlineid="${docData.outlineId}" data-new="true">`];
                // 企标模板封面内容
                htmlArr.push(`<div class="info-block cover fixed">${this.coverData.content}</div>`);
                htmlArr = htmlArr.concat(htmlContent);
                htmlArr.push('</div>');
                const lastItem = _.last(this.conversation.children);
                lastItem.type = 'tocList';
                lastItem.createTime = new Date().getTime();
                lastItem.content = this.tocList;
                this.$set(this.conversation.children, this.conversation.children.length-1, lastItem);

                // 滚动到底
                this.scrollTopBottom();
                // 抛出事件，构建文档的大纲
                this.$emit('change', { act:'insertOutline', htmlArr, tocList });

                // 如果有正文内容则直接解析
                if (data.contents && !_.isEmpty(data.contents)) {
                    this.handlerDocLoading(data.contents);
                }
            },

            async createAppMessage(data) {
                // 移除临时会话
                this.conversation.children.splice(this.conversation.children.length-1, 1);
                // 置入内容
                this.conversation.children.push({
                    "role": "assistant",
                    "type": "app",
                    "content": data,
                    "createTime": new Date().getTime()
                });
                this.submitLoading = false;
                // 滚动到底
                this.scrollTopBottom();
                // 保存会话
                this.saveConversation();
            },

            async sendMessage(inputText, file, suffix) {
                // console.log('this.options===>', this.options)
                if (this.submitLoading) {
                    return;
                }

                inputText = inputText || this.formData.inputText;
                this.$set(this.formData, 'tmpText', inputText);
                this.submitLoading = true;

                // 调用了外部插件则额外处理
                if (this.currPlugin && this.currPlugin !== 'aiChat') {
                    this.pluginChat(inputText);
                    return;
                }

                // GPT参数设置
                let condition = {
                    "modelName": this.currModel.label,
                    "model": this.currModel.value,
                    "temperature": 0.5,
                    "presence_penalty": 0,
                    "frequency_penalty": 0,
                    "top_p": 1,
                    // "max_tokens": 4000
                    "stream": true
                };

                // AI临时会话
                this.conversation.children.push({
                    "role": "assistant",
                    "type": "loading",
                    "content": "正在输入..."
                });

                // 滚动到底部
                this.scrollTopBottom();

                let res = null;
                if (this.isNewSubject) { // 如果是新的主题
                    const nowTime = new Date();
                    condition.messages = [{
                        "role": "system",
                        "content": `\nYou are ChatGPT, a large language model trained by OpenAI.\nKnowledge cutoff: 2024-06\nCurrent model: ${this.currModel.value}\nCurrent time: ${nowTime}\n\n`
                    }];
                    if (this.currFile) { // 如果是分析文件的
                        condition.messages.push({
                            "role": "user",
                            "content": [{
                                "type": "text",
                                "text": inputText,
                            },{
                                "type": "image_url",
                                "image_url": {
                                    "url": this.currFile.url
                                }
                            }],
                            "createTime": +new Date()
                        })
                    } else {
                        condition.messages.push({
                            "id": $global.guid(),
                            "role": "user",
                            "content": inputText,
                            "createTime": +new Date()
                        })
                    }
                } else {
                    // 过滤AI会话的临时加载项
                    condition.messages = this.conversation.children.filter(item => { return item.type !== 'loading' });
                    if (this.currFile) { // 如果是分析文件的
                        condition.messages.push({
                            "role": "user",
                            "content": [{
                                "type": "text",
                                "text": inputText,
                            },{
                                "type": "image_url",
                                "image_url": {
                                    "url":this.currFile.url
                                }
                            }],
                            "createTime": +new Date()
                        })
                        condition.messages = condition.messages.filter(item => {
                            return item.type !== 'temp';
                        })
                    }
                }
                const lastConversation = _.last(this.conversation.children);
                // 请求接口
                // console.log(this.options.nodeURL)
                aiChat({ "operation": "conversation", "params":condition }, this.options.nodeURL, res => {
                    if (res) {
                        if (condition.stream) { // 流式通信
                            const lines = res.split(/\n\n/);
                            for (let line of lines) {
                                console.log('line===>', line)
                                // debugger
                                line = line.replace(/^data:/,'');
                                if ($global.isJSON(line)) {
                                    // await $global.sleep(100);
                                    line = JSON.parse(line);
                                    if (line.choices && line.choices.length) {
                                        let content = line.choices[0]['delta']['content'];
                                        if (content) {
                                            if (lastConversation.type) {
                                                lastConversation.content = '';
                                                delete lastConversation.type;
                                            }
                                            lastConversation.content += content;
                                            this.$set(this.conversation.children, this.conversation.children.length - 1, lastConversation);
                                            this.scrollTopBottom(false);
                                        }
                                    }
                                } else {
                                    // 结束流输出
                                    if (line.replace(/\s/g,'') === '[DONE]' || line === 'end_chat') {
                                        lastConversation.createTime = new Date().getTime();
                                        lastConversation.id = $global.guid();
                                        condition.messages.push(lastConversation);
                                        this.$set(this.conversation.children, this.conversation.children.length - 1, lastConversation);

                                        setTimeout(() => {
                                            this.endMessage(condition);
                                        }, 500)
                                    }
                                }
                            }
                        } else {
                            if (res.data) {
                                let assistant = res.data.choices[0]['message'];
                                assistant.createTime = new Date().getTime();
                                assistant.id = $global.guid();
                                condition.messages.push(assistant);
                                this.endMessage(condition);
                            }
                        }
                    }
                });
            },

            async endMessage(condition={}) {
                let isAdd = false;
                if (this.isNewSubject || !this.conversation.id) {
                    // 总结上下文关系
                    condition.messages.push({
                        "role": "user",
                        "type": "title",
                        "content": "使用五到十个字直接返回这句话的简要主题，不要解释、不要标点、不要语气词、不要多余文本，不要加粗，不要最后的设计2个字。如果没有主题，请直接返回“未明确主题”",
                        "createTime": new Date().getTime()
                    });
                    delete condition.stream;

                    const res = await aiChat({ "operation": "conversation", "params":condition });
                    // console.log('获取主题', res);
                    if (res && res.data) {
                        let subjectData = res.data.choices[0]['message'];
                        this.$set(this.conversation, 'title', subjectData.content);
                    }
                    if (!this.conversation.id) {
                        this.$set(this.conversation, 'id', $global.guid());
                        this.$set(this.conversation, 'createTime', new Date().getTime());
                    }
                    this.$emit('change', { act:'save', data:this.conversation, hideMsg:true });
                    isAdd = true;
                }
                // 去除清理临时会话
                let children = [];
                // debugger
                condition.messages.forEach(item => {
                    if (item.type && item.type === 'temp' && item.role === 'user') {
                        delete item.type;
                    }
                    if (!item.type) {
                        children.push(item);
                    }
                });
                this.$set(this.formData, 'inputText', '');
                this.conversation.children = children;
                this.submitLoading = false;
                this.currFile = null;
                this.setStore(isAdd);
            },

            setStore(isAdd) {
                this.$emit('change', { act:'save', data:this.conversation, isAdd:this.isNewSubject||isAdd });
                this.isNewSubject = false;
            },

            scrollTopTop() {
                const scrollbar = this.$refs.chatScrollbar;
                if (scrollbar) {
                    setTimeout(() => {
                        const container = scrollbar.$el.querySelector('.el-scrollbar__wrap');
                        container.style.scrollBehavior = 'smooth';
                        container.scrollTop = 0;
                    }, 300);
                }
            },
            scrollTopBottom(isSmooth=true) {
                const scrollbar = this.$refs.chatScrollbar;
                if (scrollbar) {
                    const container = scrollbar.$el.querySelector('.el-scrollbar__wrap');
                    if (isSmooth) {
                        setTimeout(() => {
                            container.style.scrollBehavior = 'smooth';
                            container.scrollTop = container.scrollHeight;
                        }, 300);
                    } else {
                        container.scrollTop = container.scrollHeight;
                    }
                }
            },

            // 获取标准类型模板数据
            async getTemplist() {
                const res = await listContentTemplate({}, this.options.editorURL);
                if (res && res.rows) {
                    const templateList = res.rows.map(item => {
                        item = _.omit(item, ['createTime','createUser','delFlag','deleteTime','deleteUser','isAsc','orderByColumn','pageNum','pageSize','params','searchValue','searchValueArray','updateTime','updateUser'])
                        return item;
                    });
                    // debugger
                    this.coverData = _.find(templateList, { tmplType:1400, tmplName:'cover'});
                }
            },

            handlerTimes() {
                this.timeInter = setInterval(() => {
                    this.allTimes--;
                    if (this.allTimes <= 0) {
                        this.submitLoading = false;
                    }
                })
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
             * @description 创建SOCKET实例 ws://112.87.208.140:8600/api/push/websocket ws://192.168.99.12:8600/api/push/websocket
             */
            async connectSocket(data = {}) {
                this.socketInstance = new socketUtil(this.aiSocketURL, { userId: this.socketId });
            },

            foucsInput() {
                this.$nextTick(() => {
                    this.$refs.inputText.focus();
                })
            },

            destroy() {
                this.disconnectSocket();
            }
        },

        mounted() {
            // AI GPT会话事件
            $bus.$on('onMsg', obj => {
                let data = obj.data;
                console.log('socket response====>', data, this.socketId);
                if (data && data.contents && data.clientId === 'user_' + this.socketId) {
                    if ($global.isJSON(data.contents)) {
                        const msgData = JSON.parse(data.contents);
                        if (this.currPlugin === 'docEditor') {
                            let docProcess = parseFloat(data.progress||0);
                            const lastItem = _.last(this.conversation.children);
                            lastItem.docProcess = docProcess;

                            if (msgData.table_of_contents && !this.tocList.length) { // 设置标准文档的大纲数据
                                this.setTocList(msgData);
                            } else if (msgData.contents && !_.isEmpty(msgData.contents)) { // 标准文档的正文内容
                                setTimeout(() => {
                                    this.handlerDocLoading(msgData.contents);
                                    if (docProcess >= 100) {
                                        this.submitLoading = false;
                                        const userItem = _.find(this.conversation.children, { type:'temp', role:'user' });
                                        if (userItem) {
                                            delete userItem.type;
                                        }
                                        this.$emit('change', {act:'appendCompelete'});
                                    }
                                }, 1250);
                            }
                        }
                    }
                }
            });
        },
        created() {
            this.connectSocket();
        },
        beforeDestroy() {
            this.destroy();
        }
    }
</script>

<style lang="scss" scoped>
    @import './aiConversation.scss';
</style>

<style>
    .ans-poppver>div{
        max-width: 300px;
    }
    .ans-poppver h5{
        font-size:14px;
    }
    .ans-poppver p{
        margin-top:5px;
        font-size:12px;
    }
</style>
