/**
 *
 =================================================
 @desc 编辑器扩展组件, 继承主组件
 @author sam 2021-07-30
 =================================================
 */
import { documentServer, dbServer, officeServer, uploadFile, parseDoc, structServer } from '@/api/nodeServer';
import { saveDocument, getDocument, updateDocument, listOutline, batchUpdateOutline, updateOutline, clearLocked, getLockedList, setLockOutline, setLockDocument, getLockedData } from '@/api/outline';
import { saveTagData } from '@/api/tags';
import { listContentTemplate, updateContent, addContent, getContent } from '@/api/editor';
// import { encrypt } from '@/utils/jsencrypt';
import html2canvas from 'html2canvas';
// 配置文件（MOCK DATA）

import { stdKinds, tranGreeceText } from "./configs/editorOptions";
// 事件总线模块
import editorBus from "./modules/editorBus";
// 编辑器指令模块
import editorCommand from "./modules/editorCommand";
// 解析XML
import parseXml from './utils/parseXml';
// 解析HTML数据结构
// import parseStruct from './utils/parseStructFromHtml';
// 页面处理模块
import pageUtil from "./utils/pageUtil";
// 大纲处理模块
import outlineUtil from "./utils/outlineUtil";
// 文档元素模块
import domUtil from "./utils/domUtil";
// 文档解析/转换HTML模块
import parseStructHtml from "./utils/parseStructFromHtml";
// SOCKET通信模块
import socketUtil from "./utils/socketUtil";
// 表格模块
import tableUtil from './utils/tableUtil';
// 扩展工具条模板
// import extendTool from "./utils/extendTool.js";
// 全局方法
import $global from '@/utils/global';
import $bus from '@/utils/bus';
// 层级项函数
import levelUtil from './utils/levelUtil';

// html转markdown
import TurndownService from 'turndown';
// 引入JSON转XML库包
// import x2js from 'x2js';

// markdown高亮显示
import hljs from "highlight.js";

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

export default {
    name: 'tinymce-extend',
    data() {
        // var editorId = $global.guid();
        return {
            topDistance:0,
            loadedCfg: false,
            loaded: false,
            // editorId,
            editor: null, // 编辑器实例
            docError: false,
            pageData: {},
            currPageIndex: 0,
            activeTab: 'outline',
            genratorIng: false,
            navMenu: [
                { label: '大纲', act: 'outline', icon: 'iconfont icon-liebiaolist36' },
                { label: '页面', act: 'pages', icon: 'iconfont icon-fuwenbenkuang' },
                { label: '草稿箱', act: 'draft', icon: 'iconfont icon-shujukulingcunwei' },
                { label: '输出文档', act: 'files', icon: 'iconfont icon-Word' },
            ],
            intervalEditor: null,
            intervalDraft: null,
            toggleSlot: false, //cfg.navShow || false,
            imgdataList: [],
            outlineData: [],
            allOutlines: [],
            latexCode: undefined,
            graphData: null,
            graphNode: null,
            loading: null,
            loadingTimes: 5000,
            imgId: undefined,
            /*editorSetting: {
                icon: require(`@/assets/images/logo.png`)
            },*/
            draftList: [],
            docFileList: [],
            timelockHandler: null, // 单个编辑的大纲数据
            disThreshold: null, // 屏蔽审查元素定时器
            // uploadFile: null, // 待上传的文件
            tmplType: 1100, // 标准模板类型 国标：1100   行标：1200 地标：6 团标：1400 企标：1500
            // pageStyle: 'width: 210mm; height: 297mm; padding: 25mm 25mm 20mm 20mm;',
            listTemplate: [], // 系统模板数据
            searchText: '', // 附属组件关键字查找
            cmpName: '', // 附属组件名
            // dialogData: {}, // 附属组件弹窗和数据
            toolPosition: { // 提示工具条位置
                x: 0,
                y: 0
            },
            showTools: false,
            activeNode: null,
            merged: false,
            draftChkeckeds: [],
            checkedDraftAll: false,
            clientId: '',
            lockedDoc: 0,
            isLocking: false,
            lockedTimes: 10000, // 锁定章节轮询发送到后台，超时则自动解锁
            lockedOutline: [], // 锁定的章节集合
            zoomValue: 100, // 缩放倍率
            isSaving: false, // 正在保存文档
            socketClass: null, // socket类
            pageErrors: [], // 页面文档错误消息
            parsedDoc: false, // 是否已经解析了文档
            updateLockedOutline: [], // 文档解锁后更新列表（outlineId）
            timeSaveHandler: null, // 定时自动保存
            breakingPage: false, // 是否正在分页
            currentPageIndex: 0,
            currentPage: null,
            disabledChange: false, // 禁用nodeChange
            parentObserver: null,
            childObserver: null,
        }
    },
    methods: {
        /**
         * @description 文档锁定或解锁（管理员操作）
         * @param {int}  isLock 0：解锁 1:加锁
         * @param {Boolean}  forceUnlock 强制解锁
         */
        async lockDoc(isLock = 0, forceUnlock = false) {
            if (this.isLocking) {
                this.$message.warning('请等候文档锁定处理完成');
                return;
            }
            this.lockedDoc = isLock;
            // 销毁轮询
            if (this.timelockHandler) {
                clearInterval(this.timelockHandler);
                this.timelockHandler = null;
            }
            // 再调用接口完全清除被锁定的章节
            var res = await clearLocked(this.pageData.docId, this.editorSetting.editorURL || process.env.VUE_APP_EDITOR_URL);
            if (res.code === 200) {
                // 解锁文档时自动保存
                if (isLock === 0 && this.editorSetting.author.unlockedAutoSave && !forceUnlock) {
                    this.saveDoc(async (res) => {
                        if (res) {
                            await this.setDocLockStatus(isLock);
                        }
                    });
                } else {
                    await this.setDocLockStatus(isLock, forceUnlock);
                }
                // 重置按钮状态
                pageUtil.enabledButtons();
            } else {
                this.$message.error('文档解锁失败！');
            }
        },

        /**
         * @description 设置文档锁定状态（管理员操作）
         * @param {Int}  isLock 0：解锁 1:加锁
         * @param {Boolean}  forceUnlock 强制解锁
         */
        async setDocLockStatus(isLock = 0, forceUnlock = false) {
            var apiUrl = this.editorSetting.editorURL || "";
            var condition = {
                "docId": this.pageData.docId,
                "isLocked": isLock,
                "userId": this.editorSetting.author.userId,
                "userName": this.editorSetting.author.userName
            }
            var res = await setLockDocument(condition, apiUrl);
            if (res.code === 200) {
                this.socketClass.lockDoc(condition, forceUnlock);
                pageUtil.unlockAllPages();
                this.$message.success(isLock ? '文档已锁定！' : '文档已解锁！');
                // 解锁后获取草稿箱
                if (isLock && this.editorSetting.author && this.editorSetting.author.isAdmin && this.editorSetting.draftTimes) {
                    this.getDraftData(this.pageData.docId);
                }
            }
            this.isLocking = false;
        },
        /**
         * @description 获取文档锁定状态
         * @param {String}  docId
         */
        async getDocLocked(docId = "") {
            docId = docId || this.pageData.docId;
            var res = await getLockedData(docId, this.editorSetting.editorURL || process.env.VUE_APP_EDITOR_URL);
            var msg;
            if (res.code === 200 && res.data) {
                msg = "文档已被" + (res.data?.userName||'') + "全部锁定，请稍后再试！";
            }
            return msg;
        },

        /**
         * @description 根据docId列出已被锁定的章节
         * @param {String}  docId
         */
        async listLockedOutline(docId = "") {
            var list = [];
            if (this.editorSetting.author.lockedAll) {
                var res = await getLockedList(docId, this.editorSetting.editorURL || process.env.VUE_APP_EDITOR_URL);
                if (res.code === 200 && res.data) {
                    list = res.data.map(item => {
                        return {
                            docId: item.docId,
                            userId: item.userId,
                            userName: item.userName,
                            lockedOutlineId: item.outlineId
                        }
                    });
                    this.lockedOutline = list;
                }
            }
            return list;
        },

        /**
         * @description 大纲事件，编辑章节正文，并发送通知锁定章节
         * @param {Object}  outlineData
         * @param {Boolean}  isUnlock 是否解锁
         */
        async lockOutline(outlineData = {}, isUnlock = false) {
            if (this.isLocking) {
                this.$alert("正在处理章节数据中，请稍候重试！", '提示', { type:'warning'});
                return false;
            }
            // 销毁轮询
            if (this.timelockHandler) {
                clearInterval(this.timelockHandler);
                this.timelockHandler = null;
                console.log('已销毁锁定章节的轮询');
            }
            // 请求接口获取锁定数据，判断是否有异常错误
            var docLockedMsg = await this.getDocLocked();
            if (docLockedMsg) {
                this.$alert(docLockedMsg,'错误提示', { type:'error'});
                return false;
            }
            this.isLocking = true;
            // 清除定时轮询
            if (this.timelockHandler) {
                clearInterval(this.timelockHandler);
                this.timelockHandler = null;
            }

            // 重新获取所有被锁定的大纲列表
            var lockedOutlineList = await this.listLockedOutline(this.pageData.docId);
            // 判断是否已经被锁定了
            var lockedItem = null;
            for (let i = 0; i < lockedOutlineList.length; i++) {
                let item = lockedOutlineList[i];
                // 判断是否已经被他人锁定
                if (item.userId !== this.editorSetting.author.userId && outlineData.outlineId === item.lockedOutlineId) {
                    lockedItem = item;
                    break;
                }
            }
            // console.log('lockedItem', lockedItem);
            if (lockedItem) {
                this.isLocking = false;
                this.$alert('章节' + outlineData.outlineTitle + "已被" + lockedItem.clientName + "锁定了：",'提示', { type:'warning'});
            } else {
                this.lockedOutline = lockedOutlineList;
                // 解锁之前的章节，如果有2个以上的锁定章节，说明锁定逻辑出错了
                var selfLockedOutlines = _.filter(this.lockedOutline, { docId: this.pageData.docId, userId: this.editorSetting.author.userId });
                if (selfLockedOutlines.length > 1) {
                    this.isLocking = false;
                    this.$alert(`锁定章节数据有异常！当前用户:${this.editorSetting.author.userName}共有${selfLockedOutlines.length}个锁定的章节`,'错误提示', { type:'error'});
                    return false;
                }
                // 向后台发送锁定或解锁章节
                var condition = {
                    docId: this.pageData.docId,
                    lockedOutlineId: outlineData.outlineId,
                    userId: this.editorSetting.author.userId,
                    userName: this.editorSetting.author.userName
                }
                // 如果是解锁的
                var unlockOutline = selfLockedOutlines[0] || null;
                if (unlockOutline) {
                    condition.unlockOutlineId = unlockOutline.lockedOutlineId;
                    // 如果仅解锁不进行编辑的
                    if (condition.unlockOutlineId === condition.lockedOutlineId && !isUnlock) {
                        this.foucsId({ outlineId: unlockOutline.lockedOutlineId });
                        this.isLocking = false;
                        return false;
                    }
                }
                // 如果是解锁当前章节的
                if (isUnlock) {
                    delete condition.lockedOutlineId;
                }
                // 是否有需要解锁的章节
                if (unlockOutline) {
                    if (this.editorSetting.author.unlockedAutoSave) { // 解锁后自动保存，待保存成功后再提交解锁请求
                        this.saveDoc(async (res) => {
                            if (res) {
                                this.readyLockOutline(condition, outlineData, unlockOutline);
                            } else {
                                this.$message.error('文档保存失败！');
                            }
                        });
                    } else {
                        // 释放解锁提示
                        this.$confirm('请确认章节内容已经保存再解锁当前章节！确认解锁？', '提示', {
                            confirmButtonText: '确定',
                            cancelButtonText: '取消',
                            type: 'warning'
                        }).then(() => {
                            this.readyLockOutline(condition, outlineData, unlockOutline);
                        }).catch(() => {});
                    }
                } else {
                    this.readyLockOutline(condition, outlineData);
                }
            }
        },

        /**
         * @description 执行锁定章节
         * @param{Object} condition 锁定的用户SOCKET信息及章节ID和文档ID
         * @param{Object} outlineData 锁定的章节数据
         * @param{Object} unlockOutline 同时需解锁的章节数据
         */
        async readyLockOutline(condition = {}, outlineData = {}, unlockOutline = null) {
            // 向后台提交锁定或解锁章节条目
            var locked = await this.submitLockOutline(condition);
            if (locked) {
                // 如解锁了当前章节且被更新了则须重新加载文档
                if (unlockOutline || this.updateLockedOutline.includes(outlineData.outlineId)) {
                    // this.loading && this.loading.close();
                    // this.loading = null;
                    this.closeLoading();
                    // console.log('解锁章节==>', unlockOutline);
                    // console.log('重新加载文档==>', this.pageData.docId);
                    let loadedDoc = await this.loadDocData(this.pageData.docId, true);
                    if (loadedDoc) {
                        this.completeLocked(condition, outlineData, unlockOutline);
                    }
                    // 删除被解锁更新的暂存章节
                    if (this.updateLockedOutline.includes(outlineData.outlineId)) {
                        this.updateLockedOutline = _.remove(this.updateLockedOutline, id => {
                            return id !== outlineData.outlineId;
                        });
                    }
                } else {
                    this.completeLocked(condition, outlineData, unlockOutline);
                }
            } else {
                this.$message.error('章节锁定失败！');
            }
            this.isLocking = false;
            return locked;
        },

        /**
         * @description 完成锁定章节
         * @param{Object} condition 锁定的用户SOCKET信息及章节ID和文档ID
         * @param{Object} outlineData 当前章节数据
         * @param{Object} unlockOutline 须解锁的章节数据
         */
        async completeLocked(condition = {}, outlineData = {}, unlockOutline = null) {
            outlineData.docId = this.pageData.docId;
            // 锁定页面或章节条目
            pageUtil.lockedPage({
                lockedOutlineId: condition.lockedOutlineId,
                assignOutlineId: this.editorSetting.author.assignOutlineId
            });
            delete condition.unlockOutlineId;
            // 清除定时器
            if (this.timelockHandler) {
                clearInterval(this.timelockHandler);
                this.timelockHandler = null;
            }
            // 发送socket通知
            this.socketClass.sendMsg(outlineData, unlockOutline);
            // 锁定了其他章节，并重新轮询处理锁定
            if (condition.lockedOutlineId) {
                setTimeout(() => {
                    this.foucsId(outlineData);
                    this.setIntervalLockOutline(condition);
                    this.isLocking = false;
                }, 300)
            }
        },

        /**
         * @description 提交保存锁定章节
         * @param{Object} condition 锁定的用户SOCKET信息及章节ID和文档ID
         */
        async submitLockOutline(condition = {}, callback) {
            var res = await setLockOutline(condition, this.editorSetting.editorURL || process.env.VUE_APP_EDITOR_URL);
            callback && callback(res.code === 200);
            return res.code === 200;
        },

        /**
         * @description '轮询'锁定章节，以确保数据的唯一性
         * @param{Object} condition 锁定的用户SOCKET信息及章节ID和文档ID
         */
        setIntervalLockOutline(condition = {}) {
            if (this.editorSetting.autoSaveTimes) {
                clearInterval(this.timeSaveHandler);
                this.timeSaveHandler = null;
                this.intervalSaveDoc();
            }
            // 销毁轮询
            if (this.timelockHandler) {
                clearInterval(this.timelockHandler);
                this.timelockHandler = null;
                // console.log('已销毁锁定章节的轮询');
            }
            $global.clearStroage('timelockHandler');
            this.timelockHandler = setInterval(() => {
                // console.log('轮询参数', JSON.stringify(condition));
                // 提交后台持续锁定章节
                this.submitLockOutline(condition, async (res) => {
                    if (res) {
                        console.log('setIntervalLockOutline', res, new Date().toLocaleString());
                    } else {
                        this.$message.error('提交锁定章节数据错误！');
                        console.error('轮询返回错误', res, new Date().toLocaleString());
                        // session stroage记录错误
                        $global.setStroage('timelockHandler', condition);
                    }
                });
            }, this.editorSetting.author.lockedTimes || this.lockedTimes);
        },
        /**
         * @description 间隔10分钟自动保存
         * @param{Object} condition 锁定的用户SOCKET信息及章节ID和文档ID
         */
        async intervalSaveDoc() {
            this.timeSaveHandler = setInterval(() => {
                this.saveDoc()
            }, this.editorSetting.autoSaveTimes)
        },


        /**
         * @description 根据模板类型获取模板数据列表
         */
        getTmplateDatas() {
            return this.listTemplate.filter(item => { return item.tmplType == this.tmplType });
        },

        /**
         * @description 获取当前的编辑器实例
         */
        getActiveEditor() {
            var editors = window.tinyMCE.editors && window.tinyMCE.editors.length ? window.tinyMCE.editors : [];
            for (let i = 0; i < editors.length; i++) {
                let editor = editors[i];
                if (editor.id === `tinymce-editor-${this.editorId||''}`) {
                    return editor;
                }
            }
            return this.editor || window.tinyMCE.activeEditor;
        },

        /**
         * @description 设置配置数据
         * @param {Object} data
         */
        setDocConfig(data = {}) {
            if (this.editor) {
                this.editor.settings.doc_config = data;
                pageUtil.init(this.editor, this);
            }
        },

        async resetFooterNoteAndTagIndex() {
            setTimeout(() => {
                domUtil.resetFooterNoteIndex();
                domUtil.resetTagByNumber();
            }, 1000);
        },

        /**
         * @description 获取封面模板数据
         * @param {String} type
         */
        async getCoverData(type = '1100', overlap = false) {
            this.tmplType = parseInt(type);
            var pageContainer = this.editor.getBody().querySelector('.page-container');
            var templs = this.getTmplateDatas();
            var coverData = _.find(templs, { tmplName: 'cover' });
            if (coverData) {
                var coverNode = pageContainer.querySelector('.info-block.cover');
                if (coverNode && overlap) {
                    coverNode.innerHTML = coverData.content;
                } else {
                    coverNode = this.editor.dom.create('div', { class: 'info-block cover fixed', 'data-id': $global.guid(), style: this.pageStyle }, coverData.content);
                    $global.prependChild(coverNode, pageContainer);
                }
                return true;
            } else {
                alert('无法匹配到封面模板数据，请联系管理员...');
            }
            return false;
        },

        /**
         * @description 在文档中插入附录页
         */
        addAppendixPage(obj = null) {
            if (obj) {
                var keypath = ['0', '8-9'];
                keypath.push(obj.type);
                this.$refs[`outline-${this.editorId}`].handleSelectAdd('8', keypath, null, obj.title);
            } else {
                this.editor.windowManager.open({
                    title: '新增附录页',
                    width: 300,
                    height: 200,
                    body: {
                        type: 'panel',
                        items: [{
                                type: 'listbox',
                                name: 'type',
                                label: '附录类型',
                                items: [{
                                        text: '规范性附录',
                                        value: '8'
                                    },
                                    {
                                        text: '资料性附录',
                                        value: '9'
                                    }
                                ]
                            },
                            {
                                type: 'input',
                                name: 'title',
                                label: '附录标题'
                            }
                        ]
                    },
                    // initialData: { type },
                    buttons: [{
                            type: 'cancel',
                            name: 'closeButton',
                            text: 'Cancel'
                        },
                        {
                            type: 'submit',
                            name: 'submitButton',
                            text: 'Ok',
                            primary: true
                        }
                    ],
                    onSubmit: (api, details) => {
                        var data = api.getData();
                        if (!data.title) {
                            this.editor.windowManager.alert('请输入附录标题！');
                        } else {
                            this.addAppendixPage(data);
                            api.close();
                        }
                    },
                })
            }
        },

        /**
         * @description 在文档中插入章节页， 如果已经存在页面则做覆盖（调用模板数据）
         * @param {Object} data {type, title}
         */
        addChapterPage(data = {}) {
            var pageContainer = this.editor.getBody().querySelector('.page-container');
            var keypath = ['0', '3-6'];
            keypath.push(data.type)
            if (data.type !== '6') {
                var otherPage = pageContainer.querySelector(`.info-block[data-outlinetype="${data.type}"]`);
                if (otherPage) {
                    this.editor.windowManager.alert(`同类型页面已经存在!`);
                    return false;
                }
            }
            this.$refs[`outline-${this.editorId}`].handleSelectAdd(data.type, keypath, null, data.title);
            return;
        },

        /**
         * @description 在文档中插入前言\引言\参考文献\索引页
         */
        addOtherPage(type = 'prefaceWord') {
            var pageContainer = this.editor.getBody().querySelector('.page-container');
            var key = '1',
                keypath = ['0', '1'],
                selector = '[data-outlinetype="1"]';
            var pageName = '前言';
            switch (type) {
                // 引言
                case 'introWord':
                    key = '2';
                    keypath = ['0', '2'];
                    selector = '[data-outlinetype="2"]';
                    pageName = '引言';
                    break;
                case 'referenceWord':
                    key = '11';
                    keypath = ['0', '11'];
                    selector = '[data-outlinetype="11"]';
                    pageName = '参考文献';
                    break;
                case 'indexWord':
                    key = '12';
                    keypath = ['0', '12'];
                    selector = '[data-outlinetype="12"]';
                    pageName = '索引';
                    break;
            }

            // 判断是否已经存在前言页
            var otherPage = pageContainer.querySelector(`.info-block${selector}`);
            if (otherPage) {
                this.editor.windowManager.alert(`${pageName}已经存在!`);
                return false;
            }
            this.$refs[`outline-${this.editorId}`].handleSelectAdd(key, keypath, null);
            return true;

        },

        /**
         * @description WORD文件解析成HTML
         * @param {Object} file
         */
        async parseDocToHtml(file = null, data = {}) { // stdKind = '0'
            this.loadingTimes = 60000;
            if (file) {
                if (data.type === 0) {
                    this.onLoading('正在上传文档并初步解析……',true); //正在解析文档中，请耐心等候完成
                    var url = this.editorSetting.nodeURL || process.env.VUE_APP_REMOTE_API;
                    var formData = new FormData();
                    formData.append("file", file);
                    formData.append("filename", file.name);

                    var res = await uploadFile(formData, url);
                    if (res.error_code === 200) {
                        var docFilePath = res.data[0]['outFile'];
                        this.appendDoc(docFilePath, res.data[0]['originalFilename'], data.stdKind);
                    } else {
                        // this.loading && this.loading.close();
                        // this.loading = null;
                        this.closeLoading();
                        this.$message.error('文件打开失败了！');
                    }
                } else if (data.type === 2) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        const text = evt.target.result;
                        this.putMarkdown(text, file.name.replace(/\.md/g,''));
                    }
                    reader.readAsText(file)
                }
            }
        },

        async appendDoc(filepath = "", fileName = "", stdKind = "0") {
            var condition = {
                type: 'docToHtml',
                path: filepath
            }
            var res = await parseDoc(condition);
            if (res.error_code === 200 && res.data) {
                this.parseDocToXml(res.data, fileName, parseInt(stdKind));
            } else {
                // this.loading && this.loading.close();
                // this.loading = null;
                this.closeLoading();
                this.$alert('文档解析失败，可能因文档格式错误引起:<br/>' + res.error_msg, '错误提示', {
                    type: 'error',
                    dangerouslyUseHTMLString: true
                });
                return null;
            }
        },
        /**
         * @description 解析DOC文档
         * @param {String} 文档在NodeServer服务器中的相对路径
         */
        async parseDocToXml(filepath = "", fileName = "", stdKind = 0) {
            this.onLoading('文档正在进行深度解析中……',true);
            stdKind = stdKind || (this.editorSetting.parseDoc ? this.editorSetting.parseDoc.stdKind : 6);
            var coverTemp = _.find(this.listTemplate, { tmplType: stdKind }); // 封面模板
            var condition = {
                type: 'parseHtmlContentByReq', // parseDoc | docToHtml
                stdKind,
                mode: this.editorSetting.parseDoc ? this.editorSetting.parseDoc.mode : 'outline',
                coverContent: coverTemp ? coverTemp.content : '',
                path: filepath
            }
            var res = await parseDoc(condition, this.editorSetting.nodeURL || process.env.VUE_APP_REMOTE_API);
            if (res.error_code === 200) {
                let docData = res.data;
                // 至少有封面数据
                if (docData.coverData) {
                    let pageTitle = fileName.replace(/\.doc|\.docx/g, '');
                    let htmlContent =
                        `<div class="page-container expand" data-stdkind="${stdKind}" data-type="${this.editorSetting.page.layout}" data-id="${$global.guid()}" data-outlineid="${docData.coverData.docId}" data-title="${docData.coverData.stdName||pageTitle}">${docData.htmlContent}</div>`;
                    // 插入编辑器中
                    this.resetContent({ htmlContent });
                    // 延迟等待编辑器加载完成
                    setTimeout(() => {
                        // this.saveParseDoc(docData.coverData);
                        this.parsedDoc = true;
                        // this.loading && this.loading.close();
                        // this.loading = null;
                        this.closeLoading();
                    }, 500);
                } else {
                    // this.loading && this.loading.close();
                    // this.loading = null;
                    this.closeLoading();
                    this.$alert('无法解析到封面数据！','错误提示', { type:'error'});
                }
            } else {
                // this.loading && this.loading.close();
                // this.loading = null;
                this.closeLoading();
                this.$alert(res.error_msg,'错误提示', { type:'error'});
            }

        },
        /**
         * @description 监听DOC文件上传后解析集成
         */
        async saveParseDoc() {
            this.onLoading('正在处理文档的数据保存……',true);

            var editor = this.getActiveEditor();
            var pageData = pageUtil.getPageData(editor);

            pageData.stdCategory = pageData.origStdNo ? 2 : 1;
            pageData.stdKind = pageData.stdKind || this.pageData.stdKind;
            pageData.createUser = 'sam';
            delete pageData.updateTime;
            // 判断实施日期或发布日期格式
            if (pageData.stdPerformDate.match(/[\x|\X]/ig) !== null) {
                delete pageData.stdPerformDate;
            }
            if (pageData.stdPublishDate.match(/[\x|\X]/ig) !== null) {
                delete pageData.stdPublishDate;
            }

            var outlineList = await this.get_outline(true);
            /* console.log('pageData', pageData)
            console.log('outlineList', outlineList) */
            let checkErrorOutline = outlineUtil.checkOutlineData(outlineList);
            if (checkErrorOutline) {
                this.$alert(checkErrorOutline, '数据结构错误', {
                    confirmButtonText: '确定',
                    dangerouslyUseHTMLString: true
                });
                return false;
            }
            /* this.loading.close();
            return false; */

            // step1.先保存到文档数据中
            var res = await saveDocument(pageData);
            if (res.code !== 200) {
                this.$message.error("文档数据保存失败！");
                // this.loading && this.loading.close();
                // this.loading = null;
                this.closeLoading();
                return;
            }
            // step2.保存大纲数据
            batchUpdateOutline({ outlineList }).then(res => {
                if (res.code === 200) {
                    this.$message.success("文档已保存！");
                    this.pageData = pageData;
                    $global.setStroage('tinymceDocData', pageData);
                    this.parsedDoc = false;
                } else {
                    this.$message.error("大纲数据保存失败！");
                }
                // this.loading && this.loading.close();
                // this.loading = null;
                this.closeLoading();
            }).catch(error => {
                this.$message.error("大纲数据保存失败！");
                // this.loading && this.loading.close();
                // this.loading = null;
                this.closeLoading();
            })
        },


        /**
         * @description 保存引入的文档
         * @param{Object} docData
         */
        async saveImportDoc(docData = {}) {
            this.onLoading('文档正初始化中……',true);
            docData.createUser = this.editorSetting.author ? this.editorSetting.author.userName : '';
            docData.stdCategory = 1;
            if (docData.stdPerformDate && !$global.isDate(docData.stdPerformDate)) {
                delete docData.stdPerformDate;
            }
            if (docData.stdPublishDate && !$global.isDate(docData.stdPublishDate)) {
                delete docData.stdPublishDate;
            }
            var docRes = await saveDocument(docData, this.editorSetting.editorURL || process.env.VUE_APP_EDITOR_URL);
            if (docRes.code === 200) {
                var outlineList = await this.get_outline(true);
                var outlineRes = await this.saveOutlineData({ outlineList });

                if (outlineRes) {
                    this.$message.success('已完成文档的解析并已初始化文档，内容可能会有偏差，请核对！！');
                    $global.setStroage('tinymceDocData', docData);
                } else {
                    this.$message.success('大纲数据初始化失败！');
                }
                // this.loading && this.loading.close();
                // this.loading = null;
                this.closeLoading();
                this.loadingTimes = 5000;
            }
        },

        /**
         * @description 获取文档数据
         * @param {String} docId
         */
        async loadDocData(docId, isReload = false) {
            // debugger
            if (!this.editor) {
                this.$alert('编辑器尚未加载完实例，请稍后再试！','错误提示', { type:'error'});
                return false;
            }
            if (this.loading || !docId) {
                return false;
            }
            this.parsedDoc = false;
            this.docError = false;
            this.loadingTimes = 30000;
            this.onLoading('正在加载文档数据，请稍后...',true);
            var url = this.editorSetting.editorURL || process.env.VUE_APP_EDITOR_URL;
            var res = _.isString(docId) ? await getDocument(docId, url) : {};

            if (res.code === 200 && res.data) {
                // 取出已被锁定的章节列表
                if (!this.editorSetting.readonly && !this.editorSetting.reader && this.editorSetting.author && this.editorSetting.author.lockedAll) {
                    var lockedOutline = await this.listLockedOutline(docId);
                    // console.log('取出已被锁定的章节', lockedOutline);
                    if (!lockedOutline.length && this.timelockHandler) {
                        clearInterval(this.timelockHandler);
                        this.timelockHandler = null;
                        clearInterval(this.timeSaveHandler);
                        this.timeSaveHandler = null;
                    }
                }

                // 文档数据
                var pageData = _.omit(res.data, ['delFlag', 'deleteTime', 'deleteUser', 'initOutline', 'updateTime', 'formatId', 'isAsc', 'orderByColumn', 'pageNum', 'pageSize', 'params',
                    'recordNumber', 'remark', 'searchValue', 'searchValueArray', 'stdPhase', 'stdUuid', 'pdfPath', 'thumbnailList', 'wordPath', 'wpsPath'
                ]);
                this.pageData = _.cloneDeep(pageData);
                // 缓存文档基础数据
                $global.setStroage('tinymceDocData', pageData);
                // 定义编辑器的配置
                this.editor.settings.doc_config = _.merge({}, this.editor.settings.doc_config, this.editorSetting);
                this.editorSetting.doc_config = this.editor.settings.doc_config;

                // 如果是一般的文档
                if ([0, 999].includes(this.pageData.stdKind)) {
                    this.$set(this.editorSetting, 'isStandard', false);
                    this.$set(this.editorSetting, 'normal', true);
                    this.toggleSlot = false;
                    let loaded = await this.loadDocContent(this.pageData);
                    this.closeLoading();
                    return loaded;
                }

                // 如果是编制说明的则定义导出word须调用的封面模板
                if (this.pageData.stdKind === 8) {
                    this.editorSetting.customCover = 'intro';
                }

                /**加载结构化文档---------------------------------------------**/
                // 定义大纲数据结构
                var condition = {
                    docId: docId,
                    orderByColumn: 'level_num',
                    isAsc: 'asc'
                }
                res = await listOutline(condition, url);
                if (res && res.code === 200 && res.rows) {
                    if (res.rows.length) {
                        let appendixNum = 0;
                        let outlineDatas = res.rows.map(item => {
                            let data = _.omit(item, ['commitId', 'createTime', 'createUser', 'delFlag', 'deleteTime', 'deleteUser', 'pageNum', 'params', 'remark', 'searchValue', 'searchValueArray', 'updateTime',
                                'updateUser', 'pageSize', 'orderByColumn', 'isAsc'
                            ]);
                            data.content = this.filterOutlineContent(item.content);
                            // 附录项及附录条款
                            if ([8, 9].includes(item.outlineType)) {
                                data.appendix = true;
                                data.letter = $global.numberToLetters(parseInt(item.outlineCatalog) - 1);
                                data.docattr = item.outlineType === 8 ? 'specs' : 'means';
                            }
                            // 取出协同分配人员
                            if (!_.isEmpty(item.owner)) {
                                data.owner = JSON.parse(item.owner);
                            }
                            data.enabled = true;
                            // 额外处理outlineId
                            let ancestors = data.ancestors.split(',');
                            data.outlineId = ancestors[ancestors.length-1];
                            if (data.outlineTitle === '附录' && this.pageData.stdKind === this.editorSetting.tmplType) {
                                data.appendixNo = $global.setLowerToString(appendixNum);
                                appendixNum++;
                            }

                            return data;
                        });

                        // 重置大纲排序（按类型、顺序号）
						outlineDatas = _.orderBy(outlineDatas, ['outlineType', 'orderNum', 'outlineCatalog']);
                        this.allOutlines = outlineDatas;
                        this.outlineData = $global.handleTree(outlineDatas, 'outlineId', 'parentId', 'children', '0');
						console.log('this.outlineData=>', this.outlineData)

                    } else {
                        let data = _.find(stdKinds, { type: pageData.stdKind });
                        data.docId = pageData.docId;
                        data.outlineId = $global.guid();
                        let outlineData = outlineUtil.initOutline(data, this);
                        this.outlineData = [outlineData.outline];
                    }
                } else {
                    this.closeLoading();
                    this.$message.error('文档加载失败，请检查API接口！');
                    return false;
                }

                // 加载草稿箱列表
                if (this.editorSetting.draftTimes && !this.editorSetting.readonly && !this.editorSetting.reader) {
                    this.getDraftData(pageData.docId);
                }
                // 开始创建文档
                return this.createNewStandard(pageData.stdKind, pageData);
            } else {
                this.closeLoading();
                this.docError = true;
                this.resetContent({ htmlContent: '<div class="info-block"><p>文档不存在！</p></div>' })
                this.$message.error('文档不存在！');
                return false;
            }
        },
        /**
         * @description 从接口获取大纲列表
         * @param {String} docId
         */
        async getOutlineListByApi(docId = '') {
            docId = docId || this.pageData.docId;
            var url = this.editorSetting.editorURL || process.env.VUE_APP_EDITOR_URL;
            var condition = {
                docId: docId,
                orderByColumn: 'level_num',
                isAsc: 'asc'
            }
            var res = await listOutline(condition, url);
            if (res.code === 200 && res.rows) {
                if (res.rows.length) {
                    let outlineDatas = res.rows.map(item => {
                        let data = _.omit(item, ['commitId', 'createTime', 'createUser', 'delFlag', 'deleteTime', 'deleteUser', 'pageNum', 'params', 'remark', 'searchValue', 'searchValueArray', 'updateTime',
                            'updateUser', 'pageSize', 'orderByColumn', 'isAsc'
                        ]);
                        data.content = this.filterOutlineContent(item.content);
                        // 附录项及附录条款
                        if ([8, 9].includes(item.outlineType)) {
                            data.appendix = true;
                            data.letter = $global.numberToLetters(parseInt(item.outlineCatalog) - 1);
                            data.docattr = item.outlineType === 8 ? 'specs' : 'means';
                        }
                        data.enabled = true;
                        return data;
                    });
                    // 重置大纲排序（按类型、顺序号）
                    outlineDatas = _.orderBy(outlineDatas, ['outlineType', 'orderNum', 'outlineCatalog']);
                    this.allOutlines = outlineDatas;
                    this.outlineData = $global.handleTree(outlineDatas, 'outlineId', 'parentId', 'children', '0');
                }
            }
        },

        /**
         * @description 直接加载一般文档
         * @param {Object} pageData
         */
        async loadDocContent(pageData = {}) {
            var res = await getContent({ docId: pageData.docId }, this.editorSetting.editorURL || process.env.VUE_APP_EDITOR_URL);
            if (res.code === 200 && res.rows) {
                // 重置正文内容
                if (res.rows.length) {
                    res.rows = _.sortBy(res.rows, 'createTime');
                    let item = _.last(res.rows);//res.rows[res.rows.length - 1];
                    this.$set(this.pageData, 'contentId', item.contentId);
                    this.editor.resetContent(item['content']);
                } else {
                    this.editor.resetContent(`<div class="page-container expand" data-id="${pageData.docId}" data-outlineid="${$global.guid()}" data-contentid="${$global.guid()}" data-type="singleSided" data-stdkind="999"><div class="info-block"><p>请输入内容...</p></div></div>`);
                }
                pageUtil.loadedPage();
                await $global.sleep(500);
                this.scrollTop({top:0});
                this.$emit('change', { act: 'loaded' });
                return true;
            } else {
                this.$message.error('文档加载失败，请检查API接口！');
                return false;
            }
        },

        /**
         * @description 清理文档的正文内容
         * @param {Object} contentData
         */
        filterOutlineContent(contentData) {
            if (contentData.contentId) {
                return {
                    contentId: contentData.contentId,
                    contentType: contentData.contentType,
                    content: contentData.content,
                    contentText: contentData.contentText
                };
            }
            return null;
        },

        // 滚动条事件以获取当前页面的位置
        scrollEvent(event) {
            const editor = this.getActiveEditor();
            const win = editor.getWin();
            const body = editor.getBody();

            const pages = Array.from(body.querySelectorAll('div.info-block'));
            var windowHeight = win.innerHeight;
            // 找到当前可见的页面
            pages.forEach((section, index) => {
                $global.addClass(section, 'pageHide');
                var rect = section.getBoundingClientRect();
                if (rect.top < windowHeight / 2 && rect.bottom > windowHeight / 2) {
                    $global.removeClass(section, 'pageHide');
                    this.currentPageIndex = index + 1;
                    this.currentPage = section;
                }
            });
            // 隐藏除当前页及前后页之外的所有页面
            pages.forEach((section, index) => {
                if (index === this.currentPageIndex - 1) { // || index === this.currentPageIndex + 1 || index === this.currentPageIndex
                    $global.removeClass(section, 'pageHide');
                    $global.addClass(section, 'active');
					// 滚动到目次页则更新目次结构
					if ($global.hasClass(section, 'catalogue')) {
                        pageUtil.autoSetCatalogue();
                    }
                } else {
                    // 封面先不加pageHide，getPageData会获取不到innerText
                    !$global.hasClass(section, "cover") && $global.addClass(section, "pageHide");
                }
            });
        },

        observer(pageContainer) {
            // const editor = this.getActiveEditor();
            // 如已存在则先全部注销
            if (this.parentObserver) {
                this.parentObserver.disconnect();
            }
            if (this.childObserver) {
                this.childObserver.disconnect();
            }

            // 创建父元素观察器
            this.parentObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // 当父元素进入视口时
                        $global.removeClass(entry.target, 'pageHide');
                        // 观察子元素
                        const children = entry.target.childNodes;
                        children.forEach(child => {
                            if (!['#text','BR'].includes(child.nodeName)) {
                                this.childObserver.observe(child); // 开始观察子元素
                            }
                        });
                        // 上报
                        // this.$emit('change', { act: 'onScroll', pageIndex:editor.dom.nodeIndex(entry.target) });
                    } else {
                        if ($global.hasClass(entry.target, 'catalogue') || $global.hasClass(entry.target, 'cover')) {
                            return;
                        }
                        // 当父元素离开视口时
                        $global.addClass(entry.target, 'pageHide');
                        // 停止观察子元素
                        const children = entry.target.childNodes;
                        children.forEach(child => {
                            if (!['#text','BR'].includes(child.nodeName)) {
                                this.childObserver.unobserve(child);
                            }
                        });
                    }
                });
            },{
               threshold: 0
            });

            // 创建子元素观察器
            this.childObserver = new IntersectionObserver((entries) => {
                let prevEle = null;
                let nextEle = null;
                entries.forEach(entry => {
                    requestIdleCallback((idle) => {
                        while (idle.timeRemaining() > 0) {
                            if (entry.isIntersecting) {
                                // 当子元素进入视口时，显示子元素
                                $global.removeClass(entry.target, 'hide-ele');
                                prevEle = entry.target.previousElementSibling;
                                nextEle = entry.target.nextElementSibling;
                                if (nextEle) {
                                    $global.removeClass(nextEle, 'hide-ele');
                                }

                            } else {
                                // 当子元素离开视口时，隐藏子元素
                                if (entry.target !== nextEle || entry.target !== prevEle) {
                                    $global.addClass(entry.target, 'hide-ele');
                                }
                                // console.log('childObserver==>', entry.target)
                            }
                        }
                    });

                    /*if (entry.isIntersecting) {
                        // 当子元素进入视口时，显示子元素
                        $global.removeClass(entry.target, 'hide-ele');
                    } else {
                        // 当子元素离开视口时，隐藏子元素
                        $global.addClass(entry.target, 'hide-ele');
                        // console.log('childObserver==>', entry.target)
                    }*/
                });
            });

            // 开始观察所有父元素
            const blocks = pageContainer.querySelectorAll('div.info-block');
            blocks.forEach(container => {
                this.parentObserver.observe(container);
            });
        },


        /**
         * @description 注册页面事件
         * @param {Element} pageContainer
         */
        regPageEvent(editor, isReadonly = false) {
            var win = editor.getWin();
            var body = editor.getBody();
            var pageContainer = body.querySelector('.page-container');
            if (body) {
                body.onscroll = event => {
                    requestAnimationFrame(() => {
                        this.scrollEvent(editor, event);
                        this.showToolBtn(event, false);
                        this.topDistance = win.scrollY;
                        this.$emit('change', { act: 'onScroll', pageIndex:this.currentPageIndex, currentPage:this.currentPage, top: win.scrollY, editorSetting: this.editorSetting });
                    })
                }

                // 如果是在只读模式下，注册鼠标事件
                if (isReadonly && !this.editorSetting.inParse) {
                    var startX = 0, endX = 0, startY = 0;
                    body.onmousedown = event => {
                        startX = event.clientX;
                        startY = event.clientY;
                        domUtil.clearFocus(editor);
                    };
                    body.onmouseover = event => {
                        this.throwEvent(event, editor, startX, startY, 'mouseoverEvent', true);
                    };
                    body.onmouseup = event => {
                        this.throwEvent(event, editor, startX, startY, 'mouseupEvent', true);
                    };
                }
            }
        },
        /**
         * @description 抛出鼠标事件
         * @param {Object} event 事件对象
         * @param {Object} editor 编辑器实例
         * @param {Int} startX 起始X坐标位置
         * @param {String} eventName 事件名称
         * @param {Boolean} isBody 是否为编辑器本身事件
         */
        throwEvent(event = null, editor = null, startX = 0, startY = 0, eventName = 'mouseupEvent', isBody = false) {
            let currNode = editor.selection.getNode();
            let endX = event.clientX;
            let selectionHtml = editor.selection.getContent({ format: 'html' });
            let selectionStr = editor.selection.getContent({ format: 'text' });
            let nodes = this.selectionNodes(selectionHtml);
            if (!nodes.length) {
                nodes.push(currNode);
            }
            var selectNodes = editor.selection.getSelectedBlocks();
            // console.log('selectNodes=>', selectNodes)
            let width = endX - startX;
            this.$emit('change', { act: eventName, isBody, event, node: nodes, selection: selectionStr, selectionHtml, selectNodes, left: width >= 0 ? startX : endX, top: event.clientY, width: Math.abs(endX - startX) });

            // 如果是在阅读模式下
            if (this.editorSetting.reader && this.editorSetting.tooltips && eventName === 'mouseupEvent' && isBody) {
                event.left = startX;
                event.top = startY; //event.clientY;
                event.width = Math.abs(endX - startX);
                event.height = Math.abs(event.clientY - startY);
                this.showToolBtn(event, true);
            }

            event.stopPropagation();
            event.preventDefault();
        },

        /**
         * @description 注册元素的事件
         * @param {Object} 编辑器实例
         */
        registerDomEvent(editor = null) {
            editor = this.getActiveEditor();
            if (!editor || !editor.getBody()) {
                return false;
            }
            var pageContainer = editor.getBody().querySelector('.page-container');
            if (!pageContainer) {
                return false;
            }

            Array.from(pageContainer.querySelectorAll('.tag.other:not(.stdTitle):not(.stdName):not(.stdNameEn):not(.releaseDepartment)')).forEach(ele => {
                ele.onmouseover = (evt) => {
                    if (evt.target.isContentEditable) {
                        this.showToolBtn(evt, true)
                    }
                    evt.stopPropagation();
                    evt.preventDefault();
                }

                ele.onmouseleave = (evt) => {
                    if (evt.target.isContentEditable) {
                        this.showToolBtn(evt, false)
                    }
                    evt.stopPropagation();
                    evt.preventDefault();
                }
            })
        },

        selectionNodes(htmlContent = '') {
            var section = document.createElement('div');
            section.innerHTML = htmlContent;
            var structList = section.querySelectorAll('.ol-list, .appendix-list');
            return Array.from(structList);
        },

        /**
         * @description 编辑器初始化后加载文档
         * @param {Object} editor
         */
        initialized(editor = null) {
            this.editor = editor || this.getActiveEditor();
            this.editor.focus();
            // 编辑器实例加入配置项
            if (window.tinyMCE || window.tinymce) {
                this.editor.settings.doc_config = _.merge({}, this.editor.settings.doc_config, this.editorSetting);
            }
            // 编辑器模式设定
            if (this.editorSetting.readonly || this.editorSetting.reader || this.editorSetting.diabledMode) {
                editor.mode.set("readonly");
            } else {
                editor.mode.set("design");
            }

            domUtil.editor = this.editor;
            domUtil.updateVm(this);
            pageUtil.editor = this.editor;
            pageUtil.updateVm(this);
            outlineUtil.editor = this.editor;
            outlineUtil.vm = this;
            tableUtil.editor = this.editor;
            tableUtil.vm = this;

            // 定义外部插件地址
            if (this.editorSetting.pluginURL) {
                window.tinyMCE.pluginURL = this.editorSetting.pluginURL;
            }
            // socket ID
            if (this.editorSetting.author && this.editorSetting.author.userId) {
                this.clientId = 'user_' + this.editorSetting.author.userId;
            }
            // 清空锁定
            this.lockedOutline = [];
            /**
             * ==============================================
             * 处理左侧插槽及LOGO元素置入到编辑器容器中
             * ==============================================
             */
            var editorContainer = document.querySelector(`#tinymce-editor-container-${this.editorId}`);
            var toxWrap = editorContainer.querySelector('.tox-sidebar-wrap');
            if (toxWrap) {
                var slotComponent = editorContainer.querySelector('.slot-component');
                if (slotComponent) {
                    if (!this.editorSetting.hideSideBar) {
                        $global.prependChild(slotComponent, toxWrap);
                    } else {
                        slotComponent.remove();
                    }
                }
                var tinymceLogo = editorContainer.querySelector('.tinymce-logo');
                var menuBar = editorContainer.querySelector('.tox-menubar');
                if (tinymceLogo) {
                    if (menuBar) {
                        $global.prependChild(tinymceLogo, menuBar);
                    } else {
                        tinymceLogo.remove();
                    }
                }
                // 提示工具条加入到编辑器容器中
                var toolbarBtn = editorContainer.querySelector('.tool-bar');
                if (toolbarBtn && !this.editorSetting.notSlot) {
                    toxWrap.appendChild(toolbarBtn);
                    toolbarBtn.onmouseenter = (evt) => {
                        this.showTools = true;
                        $global.addClass(toolbarBtn, 'show');
                        evt.stopPropagation();
                        evt.preventDefault();
                    }
                    toolbarBtn.onmouseleave = (evt) => {
                        this.showTools = false;
                        setTimeout(() => {
                            $global.removeClass(toolbarBtn, 'show');
                        }, 200);
                        evt.stopPropagation();
                        evt.preventDefault();
                    }
                    toolbarBtn.onclick = (evt) => {
                        let obj = { act: 'click', node: this.activeNode, readonly: this.editorSetting.readonly, pageData: this.pageData };
                        this.openPluginWindow(obj);
                        evt.stopPropagation();
                        evt.preventDefault();
                    }
                }
            }

            // 展开左侧导航
            if (this.editorSetting.openSidebar) {
                this.toggleSlot = true;
            }

            // 初始化文档
            if (this.editorSetting.htmlContent) {
                if (this.editorSetting.pageData) {
                    this.pageData = this.editorSetting.pageData;
                }
                this.editor.resetContent(this.editorSetting.htmlContent);
                this.arrangeHtml();
                this.scrollTop({top:0});
                pageUtil.loadedPage();
                this.$emit('change', { act: 'loaded' });
                this.closeLoading();
            } else {
                // 如果已定义了文档ID
                if (this.editorSetting.page && this.editorSetting.page.id) {
                    // 删除草稿箱内容
                    this.clearDraftData(this.editorSetting.page.id);
                    // 加载文档
                    this.loadDocData(this.editorSetting.page.id);
                    // 如果是标准文档的编写
                } else if (this.editorSetting.isStandard) {
                    this.createNewStandard(this.editorSetting.stdKind||1100);
                    // 一般文档编写
                } else {
                    var stdTitle = "";
                    this.pageData = {
                        docId: $global.guid(),
                        outlineid: $global.guid(),
                    }
                    editor.resetContent(`<div class="page-container empty" data-id="${this.pageData.docId}" data-outlineid="${this.pageData.outlineid}"><div class="info-block"><p>请输入内容......</p></div></div>`);
                }
            }

            // 注册页面窗口事件
            this.regPageEvent(editor, this.editorSetting.readonly || this.editorSetting.reader);
            // 编辑器指令模块
            editorCommand.init(editor, this);
            // 编辑器事件注册
            editorBus.init(editor, this);

            // 接收公式提交后的指令
            editor.addCommand('transLatex', evt => {
                if (evt === 'loading') {
                    this.onLoading('正在解析公式中...',true);
                } else {
                    this.onLoading('正在解析公式中...',true);
                    this.tranLatex2Img(evt);
                }
            });

            // 接收云文档选中提交后的指令
            editor.addCommand('getCloudDoc', data => {
                this.$emit('change', { act: 'loadCloudFile', data });
                this.loadDocData(data.docId);
            });

            // 关闭弹窗时清除图形数据(若有)
            editor.addCommand('clearGraphyImgData', () => {
                this.clearGraphyImgData();
            });
            // 监听表格选中
            editor.addCommand('tableSelection', (nodes) => {
                nodes = nodes.map(node => { return node.dom });
                this.$emit('change', { act: 'tdSelection', nodes });
            });


            // 非只读或阅读模式下
            if (!this.editorSetting.readonly && !this.editorSetting.reader) {
                // 鼠标弹起
                editor.on('mouseup', evt => {
                    let currNode = editor.selection.getNode();
                    let nodeIndex = [editor.dom.nodeIndex(currNode)];
                    let isOutline = editor.dom.hasClass(currNode, 'ol-list') || editor.dom.hasClass(currNode, 'appendix-list');
                    let rng = editor.selection.getRng();

                    let nodes = editor.selection.getSelectedBlocks();
                    if (nodes.length > 1) {
                        for (let node of nodes) {
                            nodeIndex.push(editor.dom.nodeIndex(node));
                        }
                    }

                    let pageIndex = -1;
                    let currPage = editor.dom.getParent(currNode,'.info-block');
                    let outlineData = null;
                    let outlineItem = editor.dom.getParent(currNode,'[data-outlineid]');
                    if (outlineItem) {
                        let firstOutlineEle = outlineItem.firstChild;
                        if (firstOutlineEle && firstOutlineEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g,'') === '') {
                            firstOutlineEle = firstOutlineEle.nextElementSibling;
                        }
                        let outlineTitle = firstOutlineEle ? firstOutlineEle.textContent : '';
                        let outlineIndex = outlineItem.dataset.index;
                        if (outlineItem.dataset.prev) {
                            outlineIndex = outlineItem.dataset.prev + '.' + outlineIndex;
                        }
                        outlineData = { outlineId:outlineItem.dataset.outlineid, parentId:outlineItem.dataset.parentid, outlineType:outlineItem.dataset.outlinetype, outlineIndex, outlineTitle };
                    }

                    let allPages = Array.from(editor.getBody().querySelectorAll('.info-block'));
                    allPages.forEach((page, index) => {
                        $global.removeClass(page, 'active');
                        if (currPage && currPage === page) {
                            pageIndex = index;
                            $global.addClass(page, 'active')
                        }
                    });
                    let selection = editor.selection.getContent({ format: 'text' });
                    if (/[\n]+[\n]/.test(selection)) {
                        let newStr = [];
                        selection.split('\n\n').forEach(str => {
                            newStr.push(str.replace(/^[\n]/i,''));
                        });
                        selection = newStr.join('\n');
                    }
                    if (!selection) {
                        // nodes = [];
                        // nodeIndex = [];
                        let newStr = [];
                        let childNodes = Array.from(currNode.childNodes);
                        childNodes.forEach(node => {
                            newStr.push(node.textContent);
                            // nodes.push(node);
                            // nodeIndex.push(editor.dom.nodeIndex(node));
                        })
                        selection = newStr.join('\n');
                    }
                    this.$emit('change', { act: 'mouseup', evt, selection, node:nodes, nodeIndex, isOutline, pageIndex, outlineData, position:[rng.startOffset,rng.endOffset] });
                });

                // 鼠标hover
                editor.on('mouseover', evt => {
                    var targetNode = evt.target;
                    if (editor.dom.hasClass(targetNode, 'tag') && targetNode.dataset && targetNode.dataset.tag && targetNode.dataset.tagtitle) {
                        // console.log('onmouseover', targetNode);
                        this.showTagTips(targetNode, evt);
                    }
                    this.$emit('change', { act: 'onmouseover', evt, selection: editor.selection.getContent({ format: 'text' }) });
                });

                // 在阅读模式下注册容器的鼠标事件
                var pageContainer = editor.getBody().querySelector('.page-container');
                if (pageContainer && !this.editorSetting.isMobile) {
                    pageContainer.onmouseover = (evt) => {
                        this.$emit('change', { act: 'onmouseover', evt, selection: editor.selection.getContent({ format: 'text' }) });
                        evt.preventDefault();
                    };
                    pageContainer.onmouseup = (evt) => {
                        this.$emit('change', { act: 'mouseup', evt, selection: editor.selection.getContent({ format: 'text' }) });
                        evt.preventDefault();
                    };

                    pageContainer.onclick = (evt) => {
                        const tableNode = editor.dom.getParent(evt.target, 'table');
                        if (evt.target.parentNode && $global.hasClass(evt.target.parentNode, 'fld-char')) {
                            this.foucsId({ outlineId: evt.target.parentNode.dataset.mk });
                            return false;
                        } else if (evt.target.nodeName === 'TD' && tableNode && $global.hasClass(tableNode, 'toc')) {
                            this.foucsId({ outlineId: evt.target.parentNode.dataset.mk });
                            return false;
                        }
                        let block = editor.dom.getParent(evt.target, '.info-block');
                        if (!$global.hasClass(block, 'active')) {
                            $global.addClass(block, 'active')
                        }
                        // 高亮显示文本框
                        let textBox = editor.dom.getParent(evt.target, '.text-box');
                        if (textBox) {
                            if (!textBox.dataset.left) {
                                textBox.dataset.left = parseFloat(textBox.style.left);
                                textBox.dataset.top = parseFloat(textBox.style.top);
                            }
                            const boxEles = Array.from(pageContainer.querySelectorAll('div.text-box'));
                            boxEles.forEach(ele => {
                                $global.removeClass(ele,'active');
                            })
                            $global.addClass(textBox,'active');
                        }
                        // 上报点击事件
                        this.$emit('change', { act: 'click', evt });
                    }
                }

                // 非手机端模式下注册事件
                if (!this.editorSetting.isMobile) {
                    // 注册编辑器元素的单击事件
                    editor.on("click", evt => {
                        evt.stopPropagation();
                        evt.preventDefault();

                        const tableNode = editor.dom.getParent(evt.target, 'table');
                        // 目次点击定位
                        if (evt.target.parentNode && $global.hasClass(evt.target.parentNode, 'fld-char')) {
                            this.foucsId({ outlineId: evt.target.parentNode.dataset.mk });
                            return false;
                        } else if (evt.target.nodeName === 'TD' && tableNode && $global.hasClass(tableNode, 'toc')) {
                            this.foucsId({ outlineId: evt.target.parentNode.dataset.mk });
                            return false;
                        }
                        // debugger
                        var rng = editor.selection.getRng();
                        var currNode = evt.target;
                        if (currNode && !this.editorSetting.readonly && !this.editorSetting.setTemplate && !this.editorSetting.parseStruct) {
                            if (rng.collapsed) {
                                if (currNode.nodeName === 'A') {
                                    if (this.editorSetting.normal && currNode.href && currNode.href !== '#') {
                                        $global.openNewWindow(currNode.href);
                                        return false;
                                    }
                                    currNode = currNode.parentNode;
                                } else if (currNode.nodeName === 'BUTTON' && $global.hasClass(currNode, 'copy-btn')) {
                                    const codeContainer = currNode.previousElementSibling;
                                    const turndownService = new TurndownService();
                                    var mdContent = turndownService.turndown(codeContainer.innerHTML);

                                    if (navigator.clipboard && window.isSecureContext) {
                                        this.$message.success('复制成功');
                                        return navigator.clipboard.writeText(mdContent);
                                    }
                                    return false;
                                }
                                // 将所有定义class focus 移除
                                domUtil.clearFocus(editor);
                                // 聚焦当前标签节点
                                if (currNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === "" && $global.hasClass(currNode, 'tag other') && !['icsNumber', 'ccsNumber'].includes(currNode.dataset.tag)) {
                                    currNode.innerHTML = "&#8203";  // currNode.datset.name ||
                                }

                                let obj = { act: 'click', evt, node: currNode, readonly: this.editorSetting.readonly, pageData: this.pageData };

                                if (!this.editorSetting.notSlot) {
                                    this.openPluginWindow(obj);
                                } else {
                                    this.$emit('change', obj);
                                }
                            } else {
                                // 直接在表脚注元素上点击
                                if ($global.hasClass(currNode, 'tfooter') && currNode.parentNode && currNode.parentNode.nodeName === 'TD') {
                                    domUtil.addTableFooter(editor, currNode, { content: currNode.textContent, id: currNode.dataset.id })
                                } else if ($global.hasClass(currNode, 'a-note') || $global.hasClass(currNode.parentNode, 'footnote')) {
                                    // 条文脚注修改
                                    domUtil.addFooter(editor, currNode, { id: currNode.dataset.id, text: currNode.title || currNode.textContent });
                                }
                            }
                        }
                    });
                    // 注册编辑器元素的双击事件
                    editor.on("dblclick", evt => {
                        // 编辑公式
                        if (evt.target.hasAttribute('data-latex')) {
                            // 是否已做公式编号
                            let parentNode = evt.target.parentNode;
                            if (parentNode && parentNode.nodeName === 'FIGURE') {
                                editor.windowManager.alert('公式已编号，请取消编号后再进行编辑！');
                            } else {
                                let latex = evt.target.dataset.latex;
                                this.latexCode = latex;
                                this.graphNode = evt.target.cloneNode(true);
                                editor.execCommand('openMath', latex);
                            }
                        } else if ($global.hasClass(evt.target, 'sam-graph') && evt.target.nodeName === 'IMG') {
                            this.editGraph(evt.target);
                        }
                        evt.stopPropagation();
                        return false;
                    });
                }


                // 草稿箱（定时轮询缓存）
                if ((this.editorSetting.draftTimes || (this.editorSetting.author && this.editorSetting.author.enableDraft && this.editorSetting.author.isAdmin)) && !this.editorSetting.readonly && !this.editorSetting.reader) {
                    this.intervalDraft = setInterval(() => {
                        // debugger
                        this.autoSaveContent();
                    }, this.editorSetting.draftTimes || 30000);
                }

                if (!this.editorSetting.setTemplate && !this.editorSetting.parseStruct) {
                    setTimeout(() => {
                        // 整理文档HTML
                        this.arrangeHtml();
                        // 注册事件
                        this.setEditorListener();

                    }, 300);
                }

                // socket通信,用于多人协作
                setTimeout(() => {
                    this.connectSocket();
                }, 500);

            }
            return true;
        },

        /**
         * @description 显示标签tips
         */
        showTagTips(node=null, event=null) {
            const editor = this.getActiveEditor();
            const body = editor.getBody();
            var tipEle = body.querySelector('div.tag-tip');
            if (!tipEle) {
                tipEle = editor.dom.create('div', { class: 'tag-tip' }, '');
                body.appendChild(tipEle);
            }
            const pos = editor.dom.getPos(node);

            const { tagtitle } = node.dataset;
            tipEle.style.display = 'block';
            tipEle.textContent = tagtitle;
            tipEle.style.left = pos.x + 'px';
            tipEle.style.top = (pos.y - tipEle.offsetHeight - 5) + 'px';

            const nodeOut = evt => {
                tipEle.style.display = 'none';
                evt.preventDefault();
                evt.stopPropagation();
            }
            node.removeEventListener('mouseleave', nodeOut);
            node.addEventListener('mouseleave', nodeOut);
        },

        /**
         * @description 断开Socket连接
         */
        disconnectSocket() {
            if (this.socketClass) {
                this.socketClass.closeSocket(true);
                this.socketClass = null;
            }
        },

        /**
         * @description 创建SOCKET实例
         */
        connectSocket(data = {}) {
            if (this.editorSetting.author && this.editorSetting.author.lockedAll && !this.editorSetting.readonly && !this.editorSetting.reader) {
                if (this.socketClass) {
                    this.socketClass.closeSocket();
                }
                this.socketClass = new socketUtil(this.editorSetting.socketURL || process.env.VUE_APP_SOCKET, { ...this.editorSetting.author });
                if (data.reset) {
                    this.regBusEvent();
                }
            }
        },

        showToolBtn(evt = null, flag = true) {
            var editor = this.getActiveEditor();
            if (!editor || !editor.getBody()) {
                return;
            }
            var ele = evt.target;
            var pageContainer = editor.getBody().querySelector('.page-container');
            if (pageContainer) {
                var editorContainer = editor.getContainer();
                var toolBar = editorContainer.querySelector(`#tool-bar-${this.editorId}`);

                if (toolBar) {
                    var subWidth = toolBar.offsetWidth / 2; //17 * this.editorSetting.tooltips.length;
                    if (!flag || $global.hasClass(ele, 'page-container') || $global.hasClass(ele, 'info-block')) {
                        editor.selection.collapse()
                        setTimeout(() => {
                            if (!this.showTools) {
                                $global.removeClass(toolBar, 'show');
                            }
                        }, 500);
                    } else {
                        var page = editor.dom.getParent(ele, '.info-block');
                        if (!page || !page.dataset.outlineid) {
                            return;
                        }
                        $global.addClass(toolBar, 'show');
                        var rect = ele.getBoundingClientRect();
                        this.activeNode = ele;
                        this.toolPosition = { x: rect.x + subWidth, y: rect.y };
                        if (evt.width && this.editorSetting.tooltips) {

                            this.toolPosition = { x: (evt.left || rect.x) + evt.width / 2 - subWidth, y:evt.top || rect.y }; //
                        }

                        var editorHeader = editorContainer.querySelector('.tox-editor-header');
                        var slotComponet = editorContainer.querySelector('.slot-component');
                        if (editorHeader) {
                            this.toolPosition.y += editorHeader.offsetHeight;
                        }
                        if (slotComponet) {
                            this.toolPosition.x += slotComponet.offsetWidth;
                        }
                        var subHeight = evt.width ? 10 : 0;
                        this.toolPosition.y -= toolBar.offsetHeight + subHeight; // 工具条高度
                        // 选中
                        if (!evt.width && ele) {
                            editor.selection.select(ele)
                        }

                    }

                    // 绑定事件
                    if (!toolBar.dataset.event && this.editorSetting.tooltips) {
                        toolBar.dataset.event = "true";
                        toolBar.onclick = event => {
                            this.$emit('change', { act: 'click', event });
                            event.stopPropagation();
                            event.preventDefault();
                        }
                    }
                }
            }
        },

        /**
         * @description 打开弹窗组件
         * @param {Object} data
         */
        openPluginWindow(data = {}) {
            // 构建数据
            var obj = { pageData: data.pageData }, element = data.evt ? data.evt.target : data.node;
            if (element.nodeName === 'A' && !this.editorSetting.readonly) {
                element = element.parentNode;
            }
            // ICS CCS
            if (element.parentNode && ($global.hasClass(element.parentNode, 'ics') || $global.hasClass(element.parentNode, 'ccs'))) {
                obj.cmpName = 'icsNumber';
                obj.value = this.toggleIcsCcs(); //element.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g,'');
                obj.isIcs = $global.hasClass(element.parentNode, 'ics');
                obj.title = "ICS/CCS编号";
                obj.width = "800px";
                obj.height = "500px";
                obj.visible = true;
                // 标准代码
            } else if ($global.hasClass(element.parentNode, 'std-sign') && [6, 1200, 1500].includes(data.pageData.stdKind)) {
                obj.cmpName = 'stdDms';
                obj.stdKind = data.pageData.stdKind;
                obj.title = "标准代码";
                obj.value = {
                    key: element.dataset.code || element.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '')
                };
                obj.width = "300px";
                obj.height = "200px";
                obj.visible = true;
                // 标准编号
            } else if (element.parentNode && element.parentNode.parentNode && $global.hasClass(element.parentNode.parentNode, 'numbers') && data.pageData) {
                obj.cmpName = 'stdNumber';
                obj.title = "标准代码/编号";
                obj.width = "450px";
                obj.visible = true;
                // 日期
            } else if (element.parentNode && ($global.hasClass(element.parentNode, 'date-time') || $global.hasClass(element, 'date-time'))) {
                obj.cmpName = 'insertDate';
                obj.value = element.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '');
                obj.title = "选择日期";
                obj.width = "250px";
                obj.visible = true;
                // 文档稿次
            } else if (element.parentNode && $global.hasClass(element.parentNode, 'std-edition')) {
                obj.cmpName = 'docEdition';
                obj.value = element.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '').replace(/\s/g, '').replace(/^\(|\)/g, '').replace(/^\（|\）/g, '');
                obj.title = "文档版次";
                obj.width = "250px";
                obj.visible = true;
                // 一致性程度标识
            } else if ($global.hasClass(element, 'consistentSign')) {
                obj.value = element.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '');
                obj.cmpName = 'consistentSign';
                obj.title = "与国际标准一致性程度的标识";
                obj.width = "600px";
                obj.visible = true;
                // TCS技术委员会
            } else if ($global.hasClass(element, 'tcs')) {
                obj.cmpName = 'selectTcs';
                obj.title = "TC技术委员会";
                obj.width = "800px";
                obj.value = this.setElementValue(element);
                obj.visible = true;
                // 起草单位
            } else if ($global.hasClass(element, 'draftUtils')) {
                obj.cmpName = 'draftUtil';
                obj.title = "主要起草单位";
                obj.width = "800px";
                obj.value = this.setElementValue(element);
                obj.visible = true;
            } else if ($global.hasClass(element, 'draftPersons')) {
                obj.cmpName = 'draftPersons';
                obj.title = "主要起草人/专家";
                obj.width = "800px";
                obj.value = this.setElementValue(element);
                obj.visible = true;
            }

            if (obj.visible) {
                obj.node = data.node;
                this.openDialogComp(obj);
            }
        },

        setElementValue(node = null) {
            var values = [];
            Array.from(node.childNodes).forEach(el => {
                if (el.nodeName === 'A') {
                    values.push({
                        value: el.dataset.code,
                        label: el.title
                    })
                }
            });
            return values;
        },

        /**
         * @description 显示ICS/CCS编号
         * @param {Object} evt
         */
        showIcsPoper(evt) {
            // var editorContainer = document.querySelector(`#tinymce-editor-container-${this.editorId}`);
            // var icsPoper = editorContainer.querySelector('.ics-ccs-poper');
        },

        /**
         * @description 清除文档信息并开始创建新的文档
         * @param {Int} type 标准类别 国标1100 行标：1200 地标：6 团标：1500 企标：1400
         */
        async clearDocToAddNew(type = 1100) {
            this.onLoading('正在创建新文档，请稍后...', true);
            const editor = this.getActiveEditor();
            // 取出大纲模板
            var outlineData = _.find(this.listTemplate, { tmplName: 'outline' });
            if (outlineData) {
                var docId = $global.guid();
                var yearMonth = $global.formatDateTime('yyyy', new Date());
                var pageNo = 'XX XX—' + yearMonth;
                var stdName = '国标文档';
                switch (type) {
                    case 1100:
                        pageNo = 'GB/T XX—' + yearMonth;
                        break;
                    case 1200:
                        stdName = '行标文档';
                        break;
                    case 6:
                        stdName = '地标文档';
                        break;
                    case 7:
                        stdName = '指导性技术文档';
                        break;
                    case 1500:
                        stdName = '团标文档';
                        break;
                    case 1400:
                        stdName = '企标文档';
                        break;
                    case 8:
                        stdName = '编制说明';
                        break;
                }
                this.pageData = {
                    docId,
                    stdKind: type,
                    stdName,
                    stdNo: 'XX',
                    stdCategory: 1,
                    releaseDepartment: '发布单位'
                }
                // 页面边距设置
                var pageStyle = '';
                var pageTmp = _.find(this.listTemplate, { tmplName: 'page' });
                var pageLayout = 'singleSided';
                if (pageTmp) {
                    let pageContent = JSON.parse(pageTmp.content);
                    pageLayout = pageContent.layout;
                    let padding = [];
                    Object.values(pageContent.padding).forEach(v => {
                        padding.push(v + 'mm');
                    });
                    pageStyle = `padding:${padding.join(' ')}`;
                }

                var content = JSON.parse(outlineData.content);
                // 过滤掉封面和目次
                content = content.filter(o => { return o.type !== 0 && o.checked; });
                var error = [];

                var parentId = $global.guid();
                var outlineList = [], outlineCatalog = 1;
                content.forEach(item => {
                    let outlineId = $global.guid();
                    let ancestors = parentId + ',' + outlineId;
                    let obj = {
                        docId,
                        parentId,
                        outlineId,
                        ancestors,
                        outlineTitle: item.label,
                        outlineType: item.type,
                        isVisible: 1,
                        orderNum: item.orderNum,
                    };
                    if ([3, 4, 5, 6, 8, 9].includes(item.type)) {
                        obj.outlineCatalog = outlineCatalog;
                        outlineCatalog++;
                    }
                    outlineList.push(obj);

                    let blockPage = _.find(this.listTemplate, { tmplName: item.name, tmplType: type });
                    if (blockPage) {
                        let block = editor.dom.create('div', { class: `info-block ${item.name}`, style: pageStyle }, blockPage.content);
                        let contentid = $global.guid();
                        block.dataset.title = item.label;
                        block.dataset.outlineid = outlineId;
                        block.dataset.parentid = parentId;
                        block.dataset.outlinetype = item.type;
                        block.dataset.no = pageNo;
                        block.dataset.contentid = contentid;
                        block.dataset.pagenum = 1;
                        // 章节的标题
                        let titleNode = block.querySelector('.header-title:not(.chapter)');
                        if (titleNode) {
                            titleNode.dataset.bookmark = outlineId;
                        }

                        // 章节的索引关闭
                        var olEle = block.querySelector('.ol-list');
                        if (olEle) {
                            olEle.dataset.bookmark = outlineId;
                            olEle.dataset.outlineid = outlineId;
                            olEle.dataset.parentid = parentId;
                            olEle.dataset.contentid = contentid;
                            olEle.dataset.outlinetype = item.type;
                        }
                        // htmlArr.push(block.outerHTML);
                        block.remove();
                    } else {
                        error.push(`缺少${item.label}页面模板数据`);
                    }
                });
                if (error.length) {
                    this.$message.error(error.join('；'));
                    // this.loading && this.loading.close();
                    // this.loading = null;
                    this.closeLoading();
                    return false;
                }
                outlineList.unshift({
                    docId,
                    ancestors: parentId,
                    isVisible: 1,
                    orderNum: 0,
                    outlineId: parentId,
                    parentId: "0",
                    outlineTitle: stdName
                });
                // 开始初始化文档（须保存入库）
                var created = await this.addNewDocData(this.pageData, outlineList);
                if (created) {
                    if (this.editorSetting.page) {
                        this.editorSetting.page.id = docId;
                        $global.setStroage('tinymceDocData', this.pageData);
                    }
                    // 重置正文内容
                    this.loadDocData(docId);
                }
            } else {
                if (!this.editorSetting.emptyTemplate) {
                    this.$message.error('无对应的模板，请联系管理员检查！');
                }
                // this.loading && this.loading.close();
                // this.loading = null;
                this.closeLoading();
                return false;
            }
            return true;
        },

        /**
         * @description 新建标准文档或根据数据组织文档
         * @param {Int} type 标准类别 国标1100 行标：1200 地标：6 团标：1500 企标：1400
         */
        async createNewStandard(type = 1100, pageData = null, outlineId) {
            if (this.editorSetting.setTemplate && !this.editorSetting.parseStruct && !this.editorSetting.emptyTemplate) {
                this.closeLoading();
                return false;
            }

            var docData = {};
            // 文档基础数据和封面
            var data = _.cloneDeep(_.find(stdKinds, { type })) || {};
            data.docId = pageData ? pageData.docId : $global.guid();
            data.outlineId = outlineId || $global.guid();
            data.stdName = pageData ? pageData.stdName : '我的标准文档';
            // 文档元素数据
            var yearMonth = $global.formatDateTime('yyyy', new Date());
            var pageNo = data.type + ' ' + (data.docData?.stdNo||'');
            docData.icsNumber = data.docData?.icsNumber || '';
            docData.ccsNumber = data.docData?.ccsNumber || '';
            docData.stdSign = data.docData?.stdSign || '';
            docData.stdNo = 'XX—' + yearMonth;
            docData.origStdNo = docData.stdSign + 'XX—' + $global.formatDateTime('yyyy', new Date(new Date() - 365 * 24 * 60 * 60 * 1000)); // data.docData.origStdNo || '';
            docData.stdTitle = data.typeTitle || '';
            docData.stdName = data.docData?.stdName || '';
            docData.stdNameEn = data.docData?.stdNameEn || '';
            docData.consistentSign = data.docData?.consistentSign || '';
            docData.stdEdition = data.docData?.stdEdition || '';
            docData.stdPerformDate = new Date();
            docData.stdPublishDate = new Date();
            docData.releaseDepartment = data.docData?.releaseDepartment || '';
            // 如果是有数据的则更新封面内容
            if (pageData) {
                pageNo = pageData.stdNo;
                docData.icsNumber = pageData.icsNumber || '';
                docData.ccsNumber = pageData.ccsNumber || '';
                docData.stdSign = pageData.stdSign || docData.stdSign;
                docData.stdNo = pageData.stdNo || docData.stdNo;
                docData.origStdNo = pageData.origStdNo || docData.origStdNo;
                if (pageData.stdTitle) {
                    docData.stdTitle = pageData.stdTitle;
                }
                if (pageData.stdName) {
                    var stdName = pageData.stdName.split("\n");
                    if (stdName.length > 1) {
                        let stdNameArr = [];
                        stdName.forEach(str => {
                            stdNameArr.push(`<span>${str}</span>`);
                        });
                        docData.stdName = stdNameArr.join("<br/>");
                    } else {
                        docData.stdName = Array.isArray(stdName) ? stdName.join("") : '';
                    }
                } else {
                    docData.stdName = '';
                }
                if (pageData.stdNameEn) {
                    var enName = pageData.stdNameEn.split("\n");
                    if (enName.length > 1) {
                        let enNameArr = [];
                        enName.forEach(str => {
                            enNameArr.push(`<span>${str}</span>`);
                        });
                        docData.stdNameEn = enNameArr.join("<br/>");
                    } else {
                        docData.stdNameEn = enName || '';
                    }
                } else {
                    docData.stdNameEn = '';
                }

                docData.consistentSign = pageData.consistentSign || '';
                docData.stdEdition = pageData.stdEdition || '';
                // 发布、实施日期做下处理
                let stdPublishDate = _.isDate(new Date(pageData.stdPublishDate)) ? new Date(pageData.stdPublishDate) : new Date();
                docData.stdPublishDate = stdPublishDate;

                let stdPerformDate = _.isDate(new Date(pageData.stdPerformDate)) ? new Date(pageData.stdPerformDate) : new Date();
                docData.stdPerformDate = stdPerformDate;

                if (pageData.releaseDepartment) {
                    var partmentName = pageData.releaseDepartment.split("\n");
                    if (partmentName.length > 1) {
                        let partmentNameArr = [];
                        partmentName.forEach(str => {
                            partmentNameArr.push(`<span>${str}</span>`);
                        });
                        docData.releaseDepartment = partmentNameArr.join("<br/>");
                    } else {
                        docData.releaseDepartment = partmentName || '';
                    }
                } else {
                    docData.releaseDepartment = '';
                }

                if (this.outlineData && this.outlineData.length) {
                    data.outlineId = this.outlineData[0]['outlineId'];
                }
            }
            var display = 'block';
            // 新制订 1 修订2
            if (pageData && pageData.stdCategory === 1) {
                display = 'none';
            }
            // 封面模板替换（从配置数据中获取）
            var coverTemp = _.find(this.listTemplate, { 'tmplType': type, 'tmplName': 'cover' });
            console.log('模板', this.listTemplate);
            console.log('封面模板 coverTemp', coverTemp);
            if (coverTemp) {
                pageData = pageData || {};
                var coverHtmlData = parseStructHtml.parseCoverHtml(pageData, coverTemp, this.editorSetting);
                if (coverHtmlData) {
                    data.htmlContent = coverHtmlData.htmlContent;
                    if (coverHtmlData.pageNo) {
                        pageNo = coverHtmlData.pageNo;
                    }
                }
            } else { // 使用系统定义的模板
                if (data.htmlContent) {
                    data.htmlContent = data.htmlContent.replace(/{@ICS}/g, docData.icsNumber||'')
                    .replace(/{@cover_gb}/g, this.editorSetting.nodeURL || process.env.VUE_APP_REMOTE_API)
                    .replace(/{@CCS}/g, docData.ccsNumber||'')
                    .replace(/{@stdSign}/g, docData.stdSign||'')
                    .replace(/{@stdTitle}/g, docData.stdTitle||'')
                    .replace(/{@stdNo}/g, docData.stdNo||'')
                    .replace(/{@origStdNo}/g, docData.origStdNo||'')
                    .replace(/{@dispalyInstead}/g, display)
                    .replace(/{@stdName}/g, docData.stdName||'')
                    .replace(/{@stdNameEn}/g, docData.stdNameEn||'')
                    .replace(/{@consistentSign}/g, docData.consistentSign||'')
                    .replace(/{@stdEdition}/g, docData.stdEdition||'')
                    .replace(/{@stdPerformDate}/g, docData.stdPerformDate ? $global.formatDateTime('yyyy-MM-dd', docData.stdPerformDate) : 'XXXX-XX-XX')
                    .replace(/{@stdPublishDate}/g, docData.stdPublishDate ? $global.formatDateTime('yyyy-MM-dd', docData.stdPublishDate) : 'XXXX-XX-XX')
                    .replace(/{@releaseDepartment}/g, docData.releaseDepartment||'');
                }
            }

            if (this.editorSetting.mergeStd && pageNo) {
                pageNo = pageNo.replace(/\s/g,'');
            }

            var readCls = this.editorSetting.readonly ? ' readonly' : '';
            if (this.editorSetting.page && this.editorSetting.page.expand) {
                readCls += ' expand';
            }
            var pageTitle = $global.delHtmlTag(docData.stdName);
            var htmlArr = [
                `<div class="page-container${readCls}" data-type="${this.editorSetting.page.layout||'doubleSided'}" data-id="${data.docId}" data-stdkind="${type}" data-outlineid="${data.outlineId}" data-title="${pageTitle}" data-no="${pageNo}">`
            ];

            // 封面
            htmlArr.push(data.htmlContent);

            // 潍柴动力的模板(封面后表格页面)
            if (pageData.stdKind === 9) {
                let recordContent = '';
                let jsonContent = pageData?.jsonContent ? JSON.parse(pageData.jsonContent) : null;
                if (jsonContent && jsonContent.approveContent) {
                    recordContent = jsonContent.approveContent;
                } else {
                    let recordItem = _.find(this.listTemplate, { tmplType:pageData.stdKind, tmplName:'record' });
                    if (recordItem && recordItem.content) {
                        recordContent = recordItem.content;
                    }
                }
                htmlArr.push(`<div class="info-block approve" data-outlineid="${$global.guid()}" data-parentid="${this.outlineData[0]['outlineId']}" darta-outlinetype="99" data-no="${pageNo}" data-pagenum="">${recordContent}</div>`);
            }

            // 如果没有初始化过模板数据的则从系统定义的模板中组织内容
            if (!pageData) {
                this.clearDraftData(this.editorSetting.page.id);
                this.clearDocToAddNew(type);
                pageUtil.isLoading = false;
                return;
                // 从初始化的数据中解析内容
            } else {
                if (this.outlineData && this.outlineData.length) {
                    var outlineHtmlArr = parseStructHtml.parseHtmlByOutline(this.outlineData, pageNo, type, this.listTemplate, pageData);
                    htmlArr = htmlArr.concat(outlineHtmlArr);
                }
            }
            htmlArr.push('</div>');

            // 重置正文内容
            this.editor.resetContent(htmlArr.join(""));
            // 整理HTML
            this.arrangeHtml(pageNo, pageData);
            // 处理封面抬头字符
            domUtil.changeCoverTitle(this.editor);
            // 注册元素事件
            this.registerDomEvent(this.editor);
            // 清除聚焦元素的class
            domUtil.clearFocus(this.editor);
            // 保留页面的缩放
            this.changeZoom();

            // 声明页面不存在错误
            var breakPageNoError = true;
            if (this.editorSetting.readonly && !this.editorSetting.page.expand) {
                breakPageNoError = await this.checkDocErrors(this.editor);
            }
            // this.loading && this.loading.close();
            // this.loading = null;
            this.closeLoading();

            // 异步处理文档加载后的其他事务
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    // 页面缩放
                    if (this.editorSetting.pageZoom) {
                        this.setPageZoom(this.editorSetting.pageZoom);
                    }
                    // 如果文档有错误
                    if (this.pageErrors.length) {
                        pageUtil.expandPage();
                    }

                    // 处理脚注
                    pageUtil.resetBlockFootNote();
                    // 页面非自动无限扩展的则分页
                    if (!this.editorSetting.page || !this.editorSetting.page.expand) {
                        // 处理分页
                        this.loadingTimes = 60000;
                        this.onLoading('正在处理文档的分页',true);
                        pageUtil.autoPageBreak(true).then(res => {
                            if (!res) {
                                this.$alert('文档分页错误！','错误提示', { type:'error'});
                            }
                            this.$emit('change', { act: 'breakPage', result:res });
                            resolve(this.afterLoaded());
                        });
                    } else {
                        resolve(this.afterLoaded());
                    }
                    this.clearUndo();
                }, 500);
            })
        },

        /**
         * @description 清除UNDO管理器数据
         */
        clearUndo() {
            var editor = this.getActiveEditor();
            editor.undoManager.clear();
        },

        /**
         * @description 文档加载完成后处理
         */
        async afterLoaded() {
            var result = false;
            let pageLayout = 'singleSided';
            // 重置页面排版方式
            if (this.pageData && this.pageData.jsonContent) {
                let jsonContent = this.pageData.jsonContent ? JSON.parse(this.pageData.jsonContent) : {};
                pageLayout = jsonContent.pageType || (this.editorSetting.page && this.editorSetting.page.layout ? this.editorSetting.page.layout : 'singleSided');
            }
            var docConfig = this.editor.settings.doc_config;
            if (docConfig) {
                pageLayout = docConfig.page.layout || 'singleSided';
            }
            // 重置页面的布局方式
            pageUtil.updatePageComposition({ act: pageLayout });
            // 处理索引项
            pageUtil.autoSetIndexTag();
            // 如果是协同作业则定位到编辑的页面
            if (this.editorSetting.author && this.editorSetting.author.lockedAll) {
                let lockedItem = _.find(this.lockedOutline, o => {
                    return o.userId === this.editorSetting.author.userId && o.docId === this.pageData.docId;
                });
                if (lockedItem) {
                    if (this.timelockHandler) {
                        clearInterval(this.timelockHandler);
                        this.timelockHandler = null;
                    }
                    this.setIntervalLockOutline(lockedItem);
                    setTimeout(() => {
                        this.foucsId({ outlineId: lockedItem.lockedOutlineId });
                    }, 300)
                }
                // 锁定、解锁文档
                if (!this.lockedDoc && lockedItem) {
                    if (!_.isEmpty(this.editorSetting.author) && !_.isEmpty(this.editorSetting.author.assignOutlineId)) {
                        lockedItem.assignOutlineId = this.editorSetting.author.assignOutlineId;
                    }
                    pageUtil.lockedPage(lockedItem);
                } else {
                    pageUtil.unlockAllPages(true);
                }
                result = true;
            } else {
                // 合并章节正文
                if (this.editorSetting.mergeDoc) {
                    result = await pageUtil.mergeAllPages();
                }
                pageUtil.unlockAllPages();
            }
            // 文档加载完成后抛出事件
            console.log(`%c文档加载完成`, 'color: #43bb88;font-size: 14px;font-weight: bold;text-decoration: underline;');
            this.$emit('change', { act: 'loaded', pageData:this.pageData, outlineData:this.outlineData });

            // 重置页码及排版方式
            pageUtil.resetPageNumber();
            // 页面目次处理
            pageUtil.loadedPage();
            // 定义目次
            let cataData = $global.getStroage('myCatalogue', true) || this.editorSetting.catalogues;
            pageUtil.autoSetCatalogue(cataData);

            // this.loading && this.loading.close();
            // this.loading = null;
            this.closeLoading();

            return result;
        },

        /**
         * 封面抬头字体排列
         */
        sapcingStdTitle() {
            domUtil.changeCoverTitle(this.editor);
        },

        /**
         * @description 执行分页
         */
        async exePageBreak(flag = false) {
            const res = await pageUtil.autoPageBreak(flag);
            this.$emit('change', { act: 'breakPage', result:res });
            return res;
        },

        //sleep延迟方法
        sleepTimes(ms = 0) {
            var now = new Date();
            var exitTime = now.getTime() + ms;
            while (true) {
                now = new Date();
                if (now.getTime() > exitTime) return true;
            }
        },

        /**
         * @description 合并文档
         */
        async megerDoc(data = {}) {
            var sleepCheck = this.sleepTimes(500);
            var res = false;
            if (sleepCheck) {
                res = await pageUtil.mergeAllPages();
                // console.log('megerDoc=>', res);
                if (res) {
                    // 如果在合并后需要保存结构便于后续的输出则处理
                    if (data.save) {
                        var xmlData = await this.exportHTML2word({ save: true });
                        if (xmlData) {
                            res = this.saveExportPageData(xmlData);
                        }
                    }
                }
                // this.loading && this.loading.close();
                // this.loading = null;
                this.closeLoading();
                this.$emit('change', { act: 'megered', result: res });
            }
            return res;
        },

        /**
         * @description 新建文档数据
         */
        async addNewDocData(docData = {}, outlineList = []) {
            this.onLoading('正在初始化文档数据，请稍后....',true);
            docData.createUser = this.editorSetting.author ? this.editorSetting.author.userName : '';
            var docRes = await saveDocument(docData, this.editorSetting.editorURL || process.env.VUE_APP_EDITOR_URL);

            if (docRes.code === 200) {
                var outlineRes = await this.saveOutlineData({ outlineList });
                if (outlineRes) {
                    this.$message.success('文档初始化完成！');
                } else {
                    this.$message.success('大纲数据初始化失败！');
                    // this.loading && this.loading.close();
                    // this.loading = null;
                    this.closeLoading();
                    return false;
                }
                // this.loading.close();
                this.closeLoading();
                return true;
            } else {
                this.$message.error('文档初始化失败！');
                // this.loading && this.loading.close();
                // this.loading = null;
                this.closeLoading();
                return false;
            }
        },

        /**
         * @description 合并所有页面
         */
        mergeDocBlock() {
            return pageUtil.mergeAllPages();
        },

        /**
         * @description 重置封面内图片元素指向
         */
        resetCoverImg() {
            const editor = this.getActiveEditor();
            if (!editor || this.editorSetting.inParse) {
                return;
            }
            const pageContainer = editor.getBody().querySelector('.page-container');
            // 封面图片
            const nodeUrl = this.editorSetting.nodeURL || process.env.VUE_APP_REMOTE_API;
            const fileURL = nodeUrl + '/files/';
            if (fileURL && pageContainer) {
                const coverPage = pageContainer.querySelector('.info-block.cover');
                if (coverPage) {
                    const coverImgs = coverPage.querySelectorAll('img');
                    coverImgs.forEach(img => {
                        let imgUrl = img.src;
                        let imgName = imgUrl.substring(imgUrl.lastIndexOf('/') + 1);
                        let newImg = new Image();
                        img.onerror = () => {
                            img.src = fileURL + "images/" + imgName;
                            // console.log('封面图片路径获取不到: ',img?.src);
                        }
                        newImg.onload = () => {};
                        newImg.src = imgUrl;
                    });
                    // 同时处理标签
                    if (this.editorSetting.private) {
                        var coverOtherTags = coverPage.querySelectorAll('.tag.other');
                        coverOtherTags.forEach(tag => {
                            $global.removeClass(tag, 'tag');
                            $global.removeClass(tag, 'other');
                        })
                    }
                }
            }
        },

        /**
         * @description 整理数据的结构
         * @param {String}  pageNo 页眉
         * @param {Object}  pageData 文档数据
         */
        arrangeHtml(pageNo = '', pageData = {}) {
            // console.log('arrangeHtml===>')
            const body = this.editor.getBody();
            const pageContainer = body.querySelector(':scope>.page-container');

            // 启用或禁用编辑器工具栏按钮
            if (this.editorSetting.menuBar && this.editorSetting.toolbar1) {
                pageUtil.enabledButtons();
            }

            pageUtil.resetPageNumber();
            // 编辑器直接引入了HTML内容 this.editorSetting.htmlContent &&
            if (pageContainer && this.editorSetting.quoteClause && this.editorSetting.reader) {
                // 如果编辑器是在引用条款模式下, 在条题前加上选框控件
                // if (this.editorSetting.quoteClause) {
                    // let browser = window.tinyMCE.Env.browser;
                    var olListNodes = Array.from(pageContainer.querySelectorAll('.ol-list:not(.hide-list),.appendix-list:not(.hide-list)'));
                    olListNodes.forEach(ol => {
                        ol.style.lineHeight = null;
                        // 查找在当前页面中是否包含相同的CLONE层级项
                        let firstChild = ol.firstChild;
                        if (!['#text', 'SPAN'].includes(firstChild.nodeName)) {
                            firstChild = document.createTextNode("");
                            $global.prependChild(firstChild, ol);
                        }

                        if (['#text', 'SPAN'].includes(firstChild.nodeName)) {
                            let checkBox = this.editor.dom.create('input', { type: 'checkbox' });
                            checkBox.dataset.outlineid = ol.dataset.outlineid;
                            checkBox.dataset.outlinetype = ol.dataset.outlinetype;
                            checkBox.dataset.prev = ol.dataset.prev || '';
                            checkBox.dataset.index = ol.dataset.index;

                            // 注册事件
                            checkBox.onclick = (evt) => {
                                evt = window.event || arguments.callee.caller.arguments[0] || evt;
                                this.$emit('change', { act: 'quoteClause', evt });
                            }
                            checkBox.onchange = (evt) => {
                                evt = window.event || arguments.callee.caller.arguments[0] || evt;
                                if (evt.target.checked) {
                                    $global.addClass(evt.target.parentNode, 'blue-clause');
                                } else {
                                    $global.removeClass(evt.target.parentNode, 'blue-clause');
                                }
                            }
                            //  注释解决范围等前三章因contenteditable为false不能选中的问题
                            // if (firstChild.nodeName === '#text') {
                                ol.insertBefore(checkBox, firstChild);
                            // } else {
                            //     $global.prependChild(checkBox, firstChild);
                            // }
                        }
                    })
                // }
                // 多选框操作
                var checkBoxNodes = Array.from(pageContainer.querySelectorAll('input[type="checkbox"]'));
                checkBoxNodes.forEach(node => {
                    if (node.dataset.checked) {
                        node.checked = true;
                    }
                })
                return false;
            }

            if (pageContainer) {
                const infoBlockNodes = Array.from(pageContainer.querySelectorAll('.info-block'));
                const isEmpty = !Object.keys(pageData)?.length;
                const maximumPage = this.editorSetting?.page?.maxinumPage || 100;
                // console.log(maximumPage, infoBlockNodes.length);
                // 页数过多提示
                !isEmpty &&
                    infoBlockNodes &&
                    infoBlockNodes.length > maximumPage &&
                    this.$notify({
                        title: "提示",
                        message: `当前文档已有${infoBlockNodes.length}页，超过${maximumPage}页可能会造成卡断的现象`,
                        type: "warning",
                    });

                // 替换封面的ICON图片
                this.resetCoverImg();
                // 多选框操作
                var checkBoxNodes = Array.from(pageContainer.querySelectorAll('input[type="checkbox"]'));
                checkBoxNodes.forEach(node => {
                    if (node.dataset.checked) {
                        node.checked = true;
                    }
                });

                // 替换老数据的层级项来源
                var outlineNodes = Array.from(pageContainer.querySelectorAll('[data-index]'));
                outlineNodes.forEach(node => {
                    node.style.lineHeight = null;
                    node.removeAttribute('data-mce-style');
                    // 第一级章标题添加类名
                    let oindex = node.dataset.index;
                    if (oindex && oindex.split(".").length === 1 && !$global.hasClass(node, 'appendix-list')) {
                        if (this.pageData?.stdKind !== this.editorSetting.tmplType) { //  && $global.isUpperCase(oindex)
                            $global.addClass(node, 'level0');
                        }

                    }
                    if (!node.dataset.source && node.dataset.asource) {
                        node.dataset.source = node.dataset.asource;
                        node.removeAttribute('data-asource');
                    }
                    /* let firstChild = node.firstChild;
                    if (firstChild && firstChild.nodeName === '#text' && firstChild.data.replace(/[\u200B-\u200D\uFEFF]/g, '') === '' ) { // && oindex.slice(0,1) !== '3'
                        firstChild.remove();
                    } */
                });

                // 如果是团标的清理T/
                let stdSignNode = pageContainer.querySelector('.icon .stdSign');
                if (stdSignNode) {
                    if (pageData.stdKind === 1500) { //团体标准
                        let stdSign = stdSignNode.textContent.replace(/T\//g, '');
                        stdSignNode.textContent = stdSign;
                    } else if (pageData.stdKind === 6) { //地方标准
                        // do something
                    }
                }

                // 重置标准名称（绑定的元素）
                var stdNameNode = Array.from(pageContainer.querySelectorAll('[data-bind="stdName"],[data-tag="std-name"]'));
                if (stdNameNode.length && this.pageData && this.pageData.stdName) {
                    stdNameNode.forEach(ele => {
                        if (ele.nodeName === 'P') {
                            ele.textContent = this.pageData.stdName.split('\n').join('<br/>');
                        } else {
                            ele.textContent = this.pageData.stdName;
                        }
                    });
                }

                // 判断是不是第几部分, 如是则重置前言中的标签绑定的标准编号
                /*var stdNameSplit = this.pageData.stdName ? this.pageData.stdName.split('\n') : [];
                if (!this.pageData.updateTime) {
                    let stdNoObj = {};
                    if (this.pageData.stdNo && this.pageData.stdNo.includes('.')) {
                        let stdNoSplit = this.pageData.stdNo.split("—")[0].split(".");
                        stdNoObj = {
                            stdNameText: stdNameSplit[0],
                            numberStr: stdNoSplit[stdNoSplit.length - 1]
                        }
                    }
                    domUtil.dealPrefacePagePart(pageContainer, this.pageData, stdNoObj);
                }
                */

                // 代替标准号 同步前言的相关内容
                var origNoNode = pageContainer.querySelector('.cover [data-tag="origStdNo"]');
                if (origNoNode) {
                    origNoNode.textContent = this.pageData.origStdNo || "";
                }

                /* if (!this.pageData.updateTime && this.pageData.origStdNo) {
                    let origObj = {
                        stdNameText: stdNameSplit[0],
                        origStdNo: this.pageData.origStdNo
                    }
                } */

                // 绑定的国际标准程度一致性标识
                if (this.pageData.consistentSign) {
                    var signNode = pageContainer.querySelector('[data-tag="signContent"]');
                    if (signNode) {
                        var signStr = [];
                        var consistentSign = this.pageData.consistentSign.split(',');
                        // 导则部分
                        var signDirective = consistentSign[0];
                        if (signDirective.match(/(ISO|IEC)/i)) {
                            signDirective = signDirective.split(' ');
                            signStr.push('ISO/IEC导则');
                        }
                        // 第几部分
                        var signPart = consistentSign[1];
                        if (signPart && signPart.toLowerCase().includes('part')) {
                            signPart = signPart.split(' ');
                            signStr.push('第' + signPart[signPart.length - 1] + '部分');
                        }
                        // 年份
                        var signYear = consistentSign[2];
                        if (!isNaN(signYear) && !isNaN(Date.parse(signYear))) {
                            signStr.push(signYear);
                        }
                        signStr.push(`《ISO和IEC文件的结构和起草的原则与规则》`);
                        signNode.innerText = `“${signStr.join('，')}”`;
                        // 等效性
                        var signEqNode = pageContainer.querySelector('[data-tag="signEqu"]');
                        var eqName = consistentSign[consistentSign.length - 1];
                        var eqValue = '非等效';
                        if (eqName && eqName.match(/(IDT|MOD|NEQ)/i)) {
                            switch (eqName) {
                                case 'IDT':
                                    eqValue = '等同';
                                    break;
                                case 'MOD':
                                    eqValue = '等效';
                                    break;
                            }
                            signEqNode.innerText = eqValue;
                        }
                    }
                } else {
                    var SignBindNodes = pageContainer.querySelectorAll('[data-bind="consistentSign"]');
                    SignBindNodes.forEach(ele => {
                        if (ele) {
                            ele.remove();
                        }
                    })
                }
                // 涉及专利等
                /* var recordNumberBindNodes = pageContainer.querySelectorAll('[data-bind="recordNumber"]');
                if (!this.pageData.recordNumber) {
                    recordNumberBindNodes.forEach(ele => {
                        if(ele) {
                            ele.remove();
                        }
                    })
                } */
                var coverBlock = pageContainer.querySelector('.info-block.cover');
                if (coverBlock) {
                    // 锁定封面
                    if ((this.editorSetting.author && this.editorSetting.author.lockedAll)) {
                        coverBlock.setAttribute('contenteditable', false);
                        var editableChilds = Array.from(coverBlock.querySelectorAll('[contenteditable]'));
                        editableChilds.forEach(ele => {
                            ele.removeAttribute('contenteditable');
                        })
                    }
                    // 去除发布单位中无用的DOM
                    var mainUtilEle = coverBlock.querySelector('.main-util');
                    if (mainUtilEle) {
                        mainUtilEle.childNodes.forEach(tagNode => {
                            if (tagNode.nodeName === 'BR') {
                                tagNode.remove();
                            }
                        })
                    }

                    // 处理扁平发布单位的字体
                    if (this.editorSetting.flatDepartment) {
                        var deparentMentEles = Array.from(coverBlock.querySelectorAll('.main-util>p'));
                        deparentMentEles.forEach(node => {
                            $global.addClass(node, 'flat');
                        })
                    }
                    // 禁止封面编辑
                    if (this.editorSetting.disableCover) {
                        coverBlock.setAttribute('contenteditable', 'false');
                        const contenteditableNodes = Array.from(coverBlock.querySelectorAll('[contenteditable]'));
                        contenteditableNodes.forEach(ele => {
                            ele.removeAttribute('contenteditable');
                        })
                    }
                    // 是否有替代编号,仅针对潍柴
                    if (pageData.stdKind == 9 && !pageData.origStdNo) {
                        // debugger
                        const insteadNode = coverBlock.querySelector('.instead');
                        if (insteadNode) {
                            insteadNode.style.display = 'none';
                        }
                        const hrLineNode = coverBlock.querySelector('.title-hr');
                        if (hrLineNode) {
                            hrLineNode.style.top = '68mm';
                        }
                    }
                }

                // 重置页眉编号并按页面的排版方式
                if (pageNo) {
                    let pageNumbers = Array.from(pageContainer.querySelectorAll('.info-block[data-no]'));
                    pageNumbers.forEach(node => {
                        node.dataset.no = pageNo;
                    });
                }

                // 处理前言的提出与归口单位
                var tcNode = pageContainer.querySelector('.info-block.preface .tcs');
                if (tcNode && [6, 1400, 1500].includes(pageData.stdKind) && pageData.releaseDepartment) {
                    tcNode.textContent = pageData.releaseDepartment.replace(/\n/g, '、');
                }

                // 处理范围页面的标签
                if (this.outlineData && this.outlineData.length) {
                    var outlineList = this.outlineData && this.outlineData[0]['children'] ? this.outlineData[0]['children'] : [];
                    var coverPage = pageContainer.querySelector('.info-block.cover');
                    var rangePage = pageContainer.querySelector('[data-outlinetype="3"]');
                    if (rangePage && coverPage) {
                        // 组织标准名称及英文译名
                        var provideStr = ['本文件规定了'], applyStr = ['本文件适用于'];
                        let stdNameArr = [];
                        let stdNameEles = coverPage.querySelectorAll('.std-name');
                        if (stdNameEles.length) {
                            stdNameEles.forEach(ele => {
                                let text = ele.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '');
                                if (text) {
                                    stdNameArr.push(text);
                                }
                            });
                            let stdNameStr = stdNameArr.join(' ').replace(/(\规程|\规范|\指南)/gi, '');
                            provideStr.push(stdNameStr);
                            applyStr.push(stdNameStr);
                        }
                        provideStr.push('涉及的');

                        // 组织大纲数据
                        var outlineStrArr = [];
                        outlineList.forEach(item => {
                            if (item.outlineType === 6) {
                                outlineStrArr.push(item.outlineTitle);
                            }
                        });
                        provideStr.push(outlineStrArr.join("、"));
                        provideStr.push('。');
                        applyStr.push('的' + outlineStrArr.join("、"));
                        applyStr.push('。');

                        // 此处废掉，不做处理
                        /* let provideEle = rangePage.querySelector('.provide');
                        let provideEle = rangePage.querySelector('.provide');
                        if (provideEle) {
                            provideEle.innerHTML = provideStr.join("");
                        }
                        let applyEle = rangePage.querySelector('.apply');
                        if (applyEle) {
                            applyEle.innerHTML = applyStr.join("");
                        } */
                    }
                }

                // 重置封面抬头的文字格式
                domUtil.changeCoverTitle(this.editor);

                // 重置列项
                // domUtil.resetBulletId(this.editor);
                // 标签、图、表等编号转换
                var numNodes = Array.from(pageContainer.querySelectorAll('[data-num]'));
                numNodes.forEach(node => {
                    if (!node.dataset.number && node.dataset.num) {
                        node.dataset.number = node.dataset.num;
                        node.removeAttribute('data-num');
                    }
                });

                // 删除多余的表标题等
                if (this.editorSetting.inParse) {
                    var tableTitles = Array.from(pageContainer.querySelectorAll('p.table-title'));
                    tableTitles.forEach(tn => {
                        let nextNode = tn.nextElementSibling;
                        if (nextNode.nodeName === 'TABLE') {
                            tn.remove();
                        }
                    })
                }

                // 第一个章节须置入标题
                var firstChapter = pageContainer.querySelector('.info-block[data-outlinetype="3"]');
                if (firstChapter && !this.editorSetting.notTitle) {
                    let chapterTitleName = this.pageData.stdName || '标题名称';
                    chapterTitleName = chapterTitleName.replace(/\n/g, '<br/>');
                    let headerTitleEle = firstChapter.querySelector('.header-title>p');
                    if (!headerTitleEle) {
                        let uuid = $global.guid();
                        let contentid = $global.guid();
                        let chapterEle = this.editor.dom.create('div', { 'class': 'header-title chapter', 'data-id': uuid, 'data-parentid': firstChapter.dataset.parentid, 'data-contentid': contentid }, `<p data-bind="stdName">${chapterTitleName}</p>`);
                        if (this.editorSetting.private) {
                            chapterEle.setAttribute('contenteditable', 'false');
                        }
                        $global.prependChild(chapterEle, firstChapter);
                    } else {
                        headerTitleEle.innerHTML = chapterTitleName;
                    }
                }

                // 协同作业的数据，锁定页面用
                if (this.editorSetting.author && this.editorSetting.author.commitId && !this.editorSetting.reader) {
                    var blocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.cover):not(.catalogue)'));
                    Array.from(blocks).forEach(block => {
                        $global.removeClass(block, 'disabled');
                        $global.removeClass(block, 'fixed');
                        block.removeAttribute('contenteditable');
                        let lockedEle = block.querySelector('div.locked');
                        if (lockedEle) {
                            lockedEle.remove();
                        }
                        var item;
                        if (block.dataset && block.dataset.outlineid) {
                            item = _.find(this.allOutlines, { outlineId: block.dataset.outlineid });
                        }
                        if (item && item.locked && !this.editorSetting.unlock && !this.editorSetting.readonly) {
                            $global.addClass(block, 'disabled');
                            $global.addClass(block, 'fixed');
                            block.setAttribute('contenteditable', 'false');
                            lockedEle = this.editor.dom.create('div', { class: 'locked' }, '已锁定，不可编辑');
                            block.appendChild(lockedEle);
                        }

                    })
                }

                // 标签定义ID
                var tagNodes = Array.from(pageContainer.querySelectorAll('.info-block:not(.cover):not(.catalogue) [data-tag]'));
                Array.from(tagNodes).forEach(tagNode => {
                    tagNode.dataset.id = tagNode.dataset.id || $global.guid();
                });

                // 重置表格的单元格索引
                var tableNodes = Array.from(pageContainer.querySelectorAll('table'));
                if (tableNodes.length > 100) {
					this.$notify({
						title: '文档表格过多提示',
						message: `当前文档中的表格过多，共${tableNodes.length}，将会影响文档的编辑操作，请合理调整！`,
						type: 'warning',
						duration: 10000,
                        position: 'bottom-right'
					});
				}

				var tableNums = 1;
                for (let table of tableNodes) {
                    table.removeAttribute('class');
                    table.removeAttribute('data-mce-style');
                    table.removeAttribute('width');
                    table.removeAttribute('height');

                    if (table.style.float) {
                        table.style.removeProperty("float");
                    }
                    if (!table.dataset || !table.dataset.id) {
                        table.dataset.id = $global.guid();
                    }
                    table = domUtil.setTableColGroup(table);
                    tableUtil.resetTdHeight(table);

                    let thead = table.querySelector('thead');
                    let tbody = table.querySelector('tbody');

                    if (!tbody) {
                        if (thead) {
                            tbody = this.editor.dom.create('tbody');
                            tbody.innerHTML = thead.innerHTML;
                            Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
                                Array.from(tr.childNodes).forEach(td => {
                                    if (td.nodeName === 'TH') {
                                        let newTd = this.editor.dom.create('td');
                                        newTd.innerHTML = td.innerHTML;
                                        let { colSpan, rowSpan } = td;
                                        if (colSpan) {
                                            newTd.colSpan = colSpan;
                                        }
                                        if (rowSpan) {
                                            newTd.rowSpan = rowSpan;
                                        }
                                        this.editor.dom.insertAfter(newTd, td);
                                        td.remove();
                                    }
                                })
                            })
                            this.editor.dom.insertAfter(tbody, thead);
                            thead.remove();
                        } else {
                            table.remove();
                            continue;
                        }
                    }

                    if (thead && this.editor.dom.nodeIndex(thead) > this.editor.dom.nodeIndex(tbody)) {
                        // debugger
                        this.editor.dom.insertAfter(tbody, thead);
                        const headRow = Array.from(thead.childNodes);
                        if (headRow.length > 5) {
                            this.$notify({
                                title: '表格格式错误',
                                message: `第${tableNums}表的表头内容格式错误：单元行过长（${headRow.length}）`
                            });
                        }
                    }

                    // 清理多级层套
                    if (tbody) {
                        const tfoot = table.querySelector('tfoot');
                        if (tfoot) {
                            const tfootRows = Array.from(tfoot.querySelectorAll('tr'));
                            tfootRows.forEach(tr => {
                                tbody.appendChild(tr);
                            })
                            tfoot.remove();
                        }

                        let trs = tbody.querySelectorAll('tr');
                        trs.forEach(tr => {
                            tr.removeAttribute('style');
                            tr.removeAttribute('data-mce-style');
                        })
                        let tds = Array.from(tbody.querySelectorAll('td'));
                        tds.forEach(tdNode => {
                            tdNode.childNodes.forEach(node => {
                                let firstNode = node.firstChild;
                                if (['SPAN', 'STRONG'].includes(node.nodeName) && firstNode && firstNode.nodeName === node.nodeName && firstNode.style === node.style) {
                                    node.innerHTML = firstNode.textContent;
                                }
                                // 规范单元格内元素，将零散元素聚合
                                if (node.nodeName === "P") {
                                    tableUtil.mergeElement(node);
                                }
                            })
                        })
                    }
                    tableUtil.setTdIndex(table);
                    tableNums++;
                }

                // 只读或阅读模式下清理页面的锁定
                if (this.editorSetting.readonly || this.editorSetting.reader) {
                    var allLockedBlocks = Array.from(pageContainer.querySelectorAll('.info-block.disabled'));
                    allLockedBlocks.forEach(block => {
                        $global.removeClass(block, 'disabled')
                        var lockedEle = block.querySelector(':scope>div.locked');
                        if (lockedEle) {
                            lockedEle.remove();
                        }
                    })
                }

                // 清理解析器进来的非法元素 或者重新整理不规范元素
                var infoBLocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.fixed):not(.disabled)'));
                // var imgError = false;
                // var olError = [];
                for (let block of infoBLocks) {
                    if (this.editorSetting.page) {
                        if (!this.editorSetting.page.expand && this.pageData?.stdKind !== this.editorSetting.tmplType) {
                            block.style.paddingBottom = "20mm";
                        } else {
                            block.style.height = 'auto';
                        }
                    }
                    if ($global.hasClass(block, 'cover')) {
                        continue;
                    }
                    // 定义航司的表头内容
                    if (pageData.stdKind === this.editorSetting.tmplType) {
                        let pageHeader = block.querySelector('div.page-header');
                        if (pageHeader) {
                            let stdTitleEle = pageHeader.querySelector('td.std-title');
                            if (stdTitleEle) {
                                stdTitleEle.textContent = pageData.stdName;
                            }
                            let stdNoEle = pageHeader.querySelector('td.std-no');
                            if (stdNoEle) {
                                stdNoEle.textContent = pageData.stdNo;
                            }
                            let stdVersionEle = pageHeader.querySelector('td.std-version');
                            if (stdVersionEle) {
                                stdVersionEle.textContent = pageData.docVersionName;
                            }
                            let revisionsNumberEle = pageHeader.querySelector('td.revisions-number');
                            if (revisionsNumberEle) {
                                revisionsNumberEle.textContent = pageData.revisionsNumber || '';
                            }
                            let revisionsDateEle = pageHeader.querySelector('td.revisions-date');
                            if (revisionsDateEle) {
                                revisionsDateEle.textContent = pageData.updateEnd ? $global.formatDateTime('yyyy-MM-dd', new Date(pageData.updateEnd)) : '';
                            }
                        }
                    }

                    // 清理标题
                    var titleNode = block.querySelector('.header-title');
                    if (titleNode && !$global.hasClass(titleNode, 'appendix') && !$global.hasClass(titleNode, 'chapter')) {
                        titleNode.dataset.bookmark = block.dataset.outlineid;
                    }
                    if (titleNode && titleNode.querySelector('table')) {
                        var titleTables =  Array.from(titleNode.querySelectorAll('table'));
                        titleTables.reverse().forEach(tableNode => {
                            this.editor.dom.insertAfter(tableNode, titleNode);
                        })
                    }

                    // 清理空的DIV内容
                    var divNodes = Array.from(block.querySelectorAll(':scope>div'));
                    divNodes.forEach(node => {
                        if (!node.className) {
                            let divChildNodes = Array.from(node.childNodes);
                            divChildNodes.reverse().forEach(ele => {
                                if (ele.nodeName === 'P' && ele.textContent.replace(/\s/g,'') === '') {
                                    ele.remove();
                                } else {
                                    this.editor.dom.insertAfter(ele, node);
                                }
                            });
                            node.remove();
                        }
                    })

                    // 清理A标签等空元素
                    let aNodes = Array.from(block.querySelectorAll('a,em,i,span,del,ins'));
                    aNodes.forEach(aNode => {
                        if (aNode.href && aNode.href.match(/^[\http:]/) !== null) {
                            aNode.href = "";
                        }
                        aNode.removeAttribute('data-mce-href');
                        if (aNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '') === '' && !aNode.className) {
                            aNode.remove();
                        }
                    });
                    // 重置层级项的段前段后
                    levelUtil.resetPadding(block);
                    // 解决章节条款相互嵌套的问题
                    let structListNodes = Array.from(block.querySelectorAll('.ol-list,.appendix-list'));
                    structListNodes.forEach(ol => {
                        if ($global.hasClass(ol,'appendix-list') && ol.dataset?.prev==='null') {
                            let prev = block.dataset.letter;
                            if (prev === 'null') {
                                prev = ol.previousElementSibling.dataset.number || '';
                                block.dataset.letter = prev;
                            }
                            ol.dataset.prev = prev;
                        }
                        let childLi = Array.from(ol.querySelectorAll('.ol-list,.appendix-list'));
                        childLi.reverse().forEach(li => {
                            $global.insertAfter(li, ol);
                        });
                    })

                    // 清理层级项的非法元素
                    structListNodes = Array.from(block.querySelectorAll('.ol-list:not(.hide-list),.appendix-list:not(.hide-list)'));
                    structListNodes.forEach(ol => {
                        ol.removeAttribute('data-text');
                        if (!ol.dataset.contentid || ol.dataset.contentid === 'undefined') {
                            ol.dataset.contentid = $global.guid();
                        }

                        // 处理其中的BR转换为P段落
                        let brNodes = Array.from(ol.querySelectorAll('br'));
                        brNodes.forEach(br => {
                            if (br.nextSibling && br.nextSibling.nodeName === '#text' && br.parentElement === ol) {
                                let newEl = this.editor.dom.create('p', { style: 'text-indent: 2em;' }, br.nextSibling.textContent);
                                this.editor.dom.insertAfter(newEl, br.nextSibling);
                                br.nextSibling.remove();
                            }
                        })

                        // 处理不符合规范的元素
                        let liChildNodes = Array.from(ol.childNodes);
                        liChildNodes.forEach((cn, idx) => {
                            if (cn.nodeName === '#text' && cn.textContent.replace(/\s/g,'') === '' && idx > 0) {
                                cn.remove();
                            } else if (cn.nodeName === 'SPAN' && !cn.className) { //  && !cn.getAttribute('style')
                                for (let ele of Array.from(cn.childNodes)) {
                                    $global.insertAfter(ele, cn);
                                }
                                cn.remove();
                            }
                        })
                        domUtil.mergeTextNodes(ol.firstChild);

                        if (ol.parentNode) {
                            // 修改下解析进来的层级编号问题
                            if (ol.dataset.index && /^[A-Z]/.test(ol.dataset.index) && $global.hasClass(ol, 'ol-list') && this.pageData.stdKind !== this.editorSetting.tmplType) {
                                let olIndex = ol.dataset.index;
                                $global.removeClass(ol, 'ol-list');
                                $global.addClass(ol, 'appendix-list');
                                ol.dataset.index = olIndex.replace(/[A-Z]+(.)/g, '');
                                ol.dataset.prev = olIndex.replace(/[^A-Z]/g, '');
                            }
                            if ($global.hasClass(ol, 'appendix-list') && !ol.dataset.prev) {
                                ol.dataset.prev = block.dataset.letter || 'A';
                            }
                            let sameList = Array.from(ol.parentNode.querySelectorAll(`[data-outlineid="${ol.dataset.outlineid}"][data-parentid="${ol.dataset.parentid}"]`));
                            sameList.forEach(li => {
                                if (li !== ol) {
                                    Array.from(li.childNodes).forEach(node => {
                                        ol.appendChild(node);
                                    });
                                    li.remove();
                                }
                            })
                        }
                    });

                    // add By sam.shen 2024-11-30
                    if (structListNodes.length > 100 && !this.editorSetting.readonly && !this.editorSetting.reader && !this.editorSetting.parseStruct) {
                        const msfTitle = structListNodes[0].firstChild ? structListNodes[0].firstChild.textContent: ''
                        this.$notify({
                            title: '文档大纲过长提示',
                            message: `当前文档的章节[${msfTitle}]条款过多，共${structListNodes.length}，将会影响文档的实时操作，请合理调整！`,
                            type: 'warning',
                            duration: 10000,
                        });
                    }
                    // 设置条款总数，便于后续的事件比较
                    block.dataset.levelLens = structListNodes.length;

                    // 校验图片路径是否正确及重置图片最大高度
                    let imgNodes = Array.from(block.querySelectorAll('img'));
                    let imgHeightError = [];
                    let maxImgHeight = 800;
                    if (block.dataset.pagesize === 'A3' || block.offsetWidth > 1000) { // block.offsetWidth > block.offsetHeight
                        maxImgHeight = 580;
                    }

                    for (let i=0; i<imgNodes.length; i++) {
                        let imgNode = imgNodes[i];
                        // 处理图片的容器，以免直接放置在章节条款中 add By sam.shen 2024-11-27
                        let imgContainer = imgNode.parentNode;
                        if (imgContainer.dataset.outlineid && imgNode.offsetWidth > 300) {
                            let indexStr = (imgContainer.dataset.prev ? `${imgContainer.dataset.prev}.` : '') + imgContainer.dataset.index;
                            // let newContainer = document.createElement('p');
                            // newContainer.className = 'img';
                            // this.editor.dom.insertAfter(newContainer, imgNode);
                            // newContainer.appendChild(imgNode);
                            imgHeightError.push(`文档第 ${this.editor.dom.nodeIndex(block)} 页中${indexStr}图片不能置入在章节条款中，将会影响到输出WORD！`);
                        }

                        // 如图片高度超限则重置高度
                        let imgHeight = imgNode.offsetHeight;
                        let imgwidth = imgNode.offsetWidth;
                        let lv = imgHeight / imgwidth;
                        if (imgHeight > maxImgHeight) {
                            imgNode.height = maxImgHeight;
                            imgNode.width = imgwidth * lv;
                            imgHeightError.push(`文档第 ${this.editor.dom.nodeIndex(block)} 页中图片高度超出限制，已自动调整！`);
                        }
                        imgNode.removeAttribute('data-mce-src');

                        let extName = $global.getExt(imgNode.src);
                        if (['gif','bmp'].includes(extName.toLowerCase())) {
                            if (!imgNode.dataset.issue) {
                                let extName = $global.getExt(imgNode.src);
                                let errorTitle = `文档第 ${this.editor.dom.nodeIndex(block)} 页中包含有${extName}图片，这会影响文档的正确输出！`;
                                let pageNode = $global.getParentBySelector(imgNode, 'info-block');
                                let outlineItem = _.find(this.allOutlines, {outlineId:pageNode.dataset.outlineid});
                                if (outlineItem) {
                                    errorTitle = `文档章节【${outlineItem.outlineTitle}】 中包含有${extName}图片，这会影响文档的正确输出！`;
                                }
                                errorTitle += "已用红框标识，请删除后重新上传png或jpg图片";
                                imgNode.dataset.issue = 1;
                                imgNode.title = `图片为${extName},影响文档的正确输出`;

                                this.$confirm(errorTitle, '图片格式错误', {
                                    type: 'error',
                                    confirmButtonText: '立即查看',
                                    cancelButtonText: '暂不处理',
                                }).then(() => {
                                    imgNode.scrollIntoView({
                                        behavior: "smooth",
                                        block: "start",
                                        inline: "nearest"
                                    })
                                }).catch(action => {});
                            }
                        }

                        /* let newImage = new Image();
                        newImage.onerror = () => {
                            imgNode.setAttribute('error','true');
                            imgNode.src = (this.editorSetting.nodeURL || process.env.VUE_APP_REMOTE_API) + '/images/empty.png';
                            newImage.remove();
                            imgError = true;
                        }
                        newImage.onload = () => {
                            imgNode.removeAttribute('error');
                            newImage.remove();
                        }
                        newImage.src = imgNode.src; */

                        /* if (imgNode.src.includes('.gif')) {
                            let errorTitle = `文档第 ${this.editor.dom.nodeIndex(block)} 页中第 ${this.editor.dom.nodeIndex(imgNode.parentElement)} 个元素中包含有gif图片，<br/>这回会导致导出word文件后打开会出错！`;
                            this.$notify({
                                title: '图片有错误',
                                type: 'error',
                                message: errorTitle,
                                dangerouslyUseHTMLString: true,
                            })
                        } */
                    }

                    if (imgHeightError.length) {
                        this.$notify({
                            title: '图片尺寸自动调整提示',
                            dangerouslyUseHTMLString: true,
                            message: imgHeightError.join('<br/>'),
                            type: 'warning'
                        });
                    }
                    // console.log('imgHeightError==>', imgHeightError)

                    // 清理列项中的不规范元素
                    let bulletNodes = Array.from(block.querySelectorAll('.bullet'));
                    if (bulletNodes.length) {
                        bulletNodes.forEach(bn => {
                            domUtil.mergeTextNodes(bn.firstChild);
                            domUtil.resetBulletChildNodes(bn);
                        })
                    }

                    let mathNodes = Array.from(block.querySelectorAll('figure.math'));
                    mathNodes.forEach(ele => {
                        ele.removeAttribute('contenteditable');
                    });
                    /* let mathDescs = Array.from(block.querySelectorAll('div.math-desc'));
                    mathDescs.forEach(ele => {
                        ele.title = '此处为公式变量集合，另起一个段落请按快捷键盘Ctrl+Enter或使用工具栏段落插入';
                    }); */
                };



                /* if (olError.length) {
                    this.$notify({
                        title: '文档格式提示，将影响文档输出',
                        message: olError.join('\n'),
                        type: 'error'
                    });
                } */

                // 重置脚注|表脚注序号
                this.resetFooterNoteAndTagIndex();

                // 文档在阅读器模式下
                if (this.editorSetting.radonly || this.editorSetting.reader) {
                    body.setAttribute('contenteditable', 'false');
                    var allConentEditNodes = Array.from(pageContainer.querySelectorAll('[contenteditable]'));
                    allConentEditNodes.forEach(node => {
                        node.removeAttribute('contenteditable');
                    });
                    // 清理解析器的临时标签
                    this.clearNodeContentByTag(pageContainer);
                } else {
                    // 锁定页面标题或章节标题不能修改
                    let chapterBlocks = Array.from(pageContainer.querySelectorAll(`.info-block[data-outlinetype]:not(.appendix)`));
                    chapterBlocks.forEach(block => {
                        let outlineType = parseInt(block.dataset.outlinetype, 10);
                        let firstEle = block.firstChild;
                        if (!this.editorSetting.readonly && this.editorSetting.fixed && this.editorSetting.fixed.length && outlineType && this.editorSetting.fixed.includes(outlineType)) {
                            if ($global.hasClass(firstEle, 'header-title')) {
                                firstEle.setAttribute('contenteditable', 'false');
                                let nextEle = firstEle.nextElementSibling;
                                if ($global.hasClass(nextEle, 'ol-list') && nextEle.dataset.index && nextEle.dataset.index.split('.').length === 1) {
                                    this.fixedChapterTitle(nextEle, true);
                                }
                            } else if ($global.hasClass(firstEle, 'ol-list') && firstEle.dataset.index && firstEle.dataset.index.split('.').length === 1) {
                                this.fixedChapterTitle(firstEle, true);
                            }
                        } else {
                            if ($global.hasClass(firstEle, 'header-title')) {
                                firstEle.removeAttribute('contenteditable');
                                let nextEle = firstEle.nextElementSibling;
                                if ($global.hasClass(nextEle, 'ol-list') && nextEle.dataset.index && nextEle.dataset.index.split('.').length === 1) {
                                    this.fixedChapterTitle(nextEle, false);
                                }
                            } else if ($global.hasClass(firstEle, 'ol-list') && firstEle.dataset.index && firstEle.dataset.index.split('.').length === 1) {
                                this.fixedChapterTitle(firstEle, false);
                            }
                        }
                    });

                    // 重置代码区域
                    domUtil.resetPreCodes(this.editor);
                    // 清理解析器的临时标签及其他不需要的元素
                    this.clearNodeContentByTag(pageContainer);
                }

                // 重置层级项之间的间隔
                // levelUtil.resetPadding();

                // 目次渲染
                // pageUtil.autoSetCatalogue();

                // 监控滚动时隐藏元素，提高渲染
                // this.observer(pageContainer);

                this.scrollEvent();
                return true;
            }
        },
        /**
         * @description 清理错误或要替换内容的节点
         */
        async clearNodeContentByTag(pageContainer = null) {
            // 清理解析器的临时标签
            var textNumerNodes = Array.from(pageContainer.querySelectorAll('[data-text]'));
            textNumerNodes.forEach(node => {
                if (node.dataset.text.match(/\%/ig) !== null) {
                    node.removeAttribute('data-text');
                }
            });

            // 清理选中的标签属性
            var selectedTagNodes = Array.from(pageContainer.querySelectorAll('[data-mce-selected]'));
            selectedTagNodes.forEach(node => {
                node.removeAttribute('data-mce-selected');
            });

            // 替换文档中的图片地址
            var imgNodes = Array.from(pageContainer.querySelectorAll('.info-block:not(.cover) img'));
            var imgError = false;
            imgNodes.forEach(imgNode => {
                // 公牛图片地址须转换
                let src = imgNode.src;
                if (/^\/prod-api/.test(src)) {
                    let reg = new RegExp(this.editorSetting.sourceImg, 'g');
                    imgNode.src = src.replace(reg, this.editorSetting.replaceImg || process.env.VUE_REPLACEL_IMG || '');
                }
                imgNode.onerror = (evt) => {
                    if (!imgError) {
                        imgError = true;
                        this.$notify({
                            title: '错误提示',
                            message: '文档中存在部分图片路径加载错误，将会影响文档的输出，请检查！'
                        });
                    }
					// console.log('图片加载错误！', evt.target.src);
                    evt.target.src = this.editorSetting.nodeURL + "/images/empty.png";
                    evt.target.removeAttribute('data-mce-src');
                }
            });

            // 清理终结线
            var finishedLines = Array.from(pageContainer.querySelectorAll('div.finished'));
            finishedLines.forEach(lineNode => {
                lineNode.remove();
            })
        },

        /**
         * @description 固定章节标题不能修改
         * @param{Element} node
         * @param{Boolean} lock
         */
        fixedChapterTitle(node = null, lock = false) {
            var firstEle = node.firstChild;
            if (firstEle.nodeName === '#text') {
                if (lock) {
                    var spanEle = this.editor.dom.create('span', { 'contenteditable': lock ? 'false' : 'true' }, firstEle.nodeValue);
                    $global.prependChild(spanEle, node);
                    firstEle.remove();
                }
            } else if (firstEle.nodeName === 'SPAN') {
                if (lock) {
                    firstEle.setAttribute('contenteditable', 'false');
                } else {
                    let text = firstEle.textContent;
                    firstEle.remove();
                    node.innerHTML = text + node.innerHTML;
                }
            }
        },

        successMsg(text = undefined) {
            var msg = text || '操作完成！';
            this.$message.success(msg);
            return false;
        },

        alertMsg(name = '', text = undefined) {
            var msg = text || '不能操作！';
            if (name === 'commitId') {
                msg = '协同作业模式下不能操作！';
            }
            this.$message.warning(msg);
            return false;
        },

        /**
         * @description 打开加载条
         * @param {String} str
         * @param {Boolean} isLoading 是否正在处理中
         */
        onLoading(text, isLoading = false, times) {
			times = times || this.loadingTimes;
            const loadingContainer = document.getElementById(`loading-${this.editorId}`);
            if (loadingContainer) {
                const loadingEle = loadingContainer.querySelector('span.text');
                // debugger
                if (text) {
                    loadingContainer.style.display = "flex";
                    loadingEle.textContent = text;
                    this.loading = true;
                } else {
                    this.closeLoading();
                }

                setTimeout(() => {
                    this.closeLoading();
                }, times);
            }

        },
        closeLoading() {
            const loadingContainer = document.getElementById(`loading-${this.editorId}`);
            if (loadingContainer) {
                loadingContainer.style.display = "none";
            }
            this.loading = false;
            /*this.loading && this.loading.close();
            this.loading = null;*/
        },

        /**
         * @description 通过接口上传文件
         * @param {Object} formData
         * @param {Object} callBack
         */
        putImgData(formData, callBack) {
            /*if (this.editorSetting.parseStruct) {
                return false;
            }*/
            var url = this.editorSetting.nodeURL || process.env.VUE_APP_REMOTE_API;
            uploadFile(formData, url).then(res => {
                let imgData = null;
                if (res.error_code === 200 || res.code === 200) {
                    imgData = {
                        img: url + '/files/' + res.data[0]['outFile'],
                        id: res.data[0]['id']
                    }
                    this.imgId = imgData.id;
                    if (res.data[0]['size'] > 2 * 1024 * 1024) {
                        uploadFile({ operation:'sharpImg', filePath:res.data[0]['outFile'], size:500 }, url).then(result => {
                            console.log(result);
                            if (result.success) {
                                imgData.img =  url + '/files/' + result.data,
                                callBack && callBack(imgData);
                                return;
                            }
                        })
                    }
                } else {
                    this.$message.error('文件上传失败！');
                }
                callBack && callBack(imgData);
            })
        },
        /**
         * @description 当前图片更新
         * @param {Object} imgData
         */
        updateImageData(imgData = {}) {
            var currNode = this.editor.selection.getNode();
            if (currNode.nodeName === 'IMG' && currNode.src === imgData.src) {
                if (!currNode.hasAttribute('data-id') && this.imgId) {
                    currNode.dataset.id = this.imgId;
                    this.imgId = undefined;
                }
                // 设定图片的最大宽度
                var block = this.editor.dom.getParent(currNode, '.info-block');
                // var blockWidth = pageUtil.calcBLockSpaceWidth(block);
                var blockOffset = pageUtil.calcBLockSpaceWidth(block);
                var imgWidth = parseInt(imgData.width || currNode.offsetWidth);
                var imgHeight = parseInt(imgData.heigth || currNode.offsetHeight);

                var lv = imgHeight / imgWidth;
                var changeSize = false;
                if (imgWidth > blockOffset.width) {
                    imgWidth = parseInt(blockOffset.width * 0.95);
                    imgHeight = parseInt(imgWidth * lv * 0.95);
                    changeSize = true;
                }

                // 检查图片的高度是否超限
                if (imgHeight > blockOffset.height) {
                    imgHeight = parseInt(blockOffset.height * 0.95);
                    imgWidth = parseInt(imgHeight / lv * 0.95);
                    changeSize = true;
                }

                if (changeSize) {
                    currNode.setAttribute('width', imgWidth);
                    currNode.setAttribute('height', imgHeight);
                }

                var parentNode = currNode.parentNode;
                if (parentNode.nodeName === 'P') {
                    $global.addClass(parentNode, 'image');
                }
            }
        },

        /**
         * @description 对页面中没有定义的图片尺寸重新定义
         */
        setImgSize() {
            var pageContainer = this.editor.getBody().querySelector('.page-container');
            var imgNodes = Array.from(pageContainer.querySelectorAll('img'));

            imgNodes.forEach((imgNode, index) => {
                var imgEle = new Image();
                imgEle.src = imgNode.getAttribute('src');
                if (!imgNode.getAttribute('width')) {
                    imgEle.onload = () => {
                        imgNode.setAttribute('width', imgEle.width);
                        imgNode.setAttribute('height', imgEle.height);
                    }
                }
                imgEle.onerror = () => {
                    imgNode.setAttribute('error', 'true');
                }
                if (index === imgNodes.length) {
                    console.log('Image laoded complete!');
                }
            })
        },

        /**
         * @description 编辑器的上报事件
         * @param {Object} obj
         */
        changeEvent(obj) {
            var cmpName, title, node;
            switch (obj.act||obj.event) {
                // 保存文档
                case 'save':
                    if (!this.editorSetting.readonly && !this.editorSetting.setTemplate) {
                        if (!obj.data && !this.isSaving) {
                            this.saveDoc();
                        } else {
                            // alert('extendMixin saveAs')
                        }
                    }
                    break;
                case 'closeEditor':
                    if (!this.editorSetting.parseStruct && !this.editorSetting.parseTable) {
                        this.$confirm('确定要关闭编辑器?请及时保存文档!', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(() => {
                            $bus.$emit('closeEditor');
                        }).catch(() => {});
                    } else {
                        $bus.$emit('closeEditor');
                    }
                    break;
                case 'export':
                    if (obj.data.type === 'table') {  // 导出表格数据
                        this.exportTableForm(obj.data);
                    } else if (obj.data.type === 'md') {  // 导出markdown
                        this.exportMarkdown(obj.data);
                    } else {
                        this.exportHTML2word(obj.data);
                    }
                    break;
                case 'siderbar':
                    this.toggleSlot = !this.toggleSlot;
                    break;
                case 'fullScreen':
                    this.setFullScreen();
                    break;
                case 'translateZh':
                    this.translateText(obj.data);
                    break;
                case 'translateStdName':
                    this.translateText({ text: obj.text, stdName: true });
                    break;
                    // 文件校验
                case 'validatDms':
                    cmpName = 'scanDoc';
                    title = '文档大数据扫描';
                    this.openDialogComp({
                        title,
                        cmpName,
                        width: "750px",
                        height: "650px",
                        hidemodal: true,
                        visible: true
                    });
                    break;
                case 'readDoc':
                    break;
                case 'knowledgeGraph':
                    cmpName = 'knowledgeGraph';
                    title = '知识图谱';
                    this.openDialogComp({
                        title,
                        cmpName,
                        width: "800px",
                        height: "550px",
                        visible: true
                    });
                    break;
                    // 引用标准|条款
                case 'importQuote':
                    obj.data.act = obj.data.act || obj.data.event;
                    if (obj.data.act === 'std') {
                        this.openDialogComp({
                            title: '引用标准',
                            cmpName: 'quoteStandard',
                            width: "700px",
                            height: "590px",
                            node: obj.data.node,
                            visible: true
                        });
                    } else {
                        $bus.$emit('openClause', obj.data);
                        // this.$emit('change', { act:'openClause' });
                    }
                    /*cmpName = obj.data.act === 'std' ? 'quoteStandard' : 'quoteClause';
                    title = obj.data.act === 'std' ? '引用标准' : '引用条款';
                    node = obj.data.node;
                    this.openDialogComp({
                        title,
                        cmpName,
                        width: "700px",
                        height: "580px",
                        node: obj.data.node,
                        visible: true
                    });*/
                    /*node = obj.data.node;
                    if (obj.data.act === 'std') {
                        this.openDialogComp({
                            title: '引用标准',
                            cmpName: 'std',
                            width: "650px",
                            height: "100%",
                            node: obj.data.node,
                            visible: true
                        });
                    }*/
                    break;
                case 'collect':
                    pageUtil.updateQuoteCollect(obj);
                    break;
                    // 引用术语
                case 'showTerm':
                    cmpName = 'quoteTerm';
                    title = '引用术语';
                    this.openDialogComp({
                        title,
                        cmpName,
                        width: "750px",
                        height: "500px",
                        visible: true
                    });
                    break;
                    // 指标比对
                case 'showQuota':
                    cmpName = 'quoteComparison';
                    title = '指标比对';
                    this.openDialogComp({
                        title,
                        cmpName,
                        width: "600px",
                        height: "500px",
                        visible: true
                    });
                    break;
                    // 批注
                case 'showComment':
                    cmpName = "quoteComment";
                    title = '批注';
                    this.openDialogComp({
                        title,
                        cmpName,
                        width: "600px",
                        node: obj.node,
                        author: this.editorSetting.author,
                        content: obj.content,
                        id: obj.node.dataset ? obj.node.dataset.id : '',
                        visible: true
                    });
                    break;
                    // DMS数据
                case 'showReferences':
                    node = obj.node;
                    if (obj.item.act === 'committee') {
                        cmpName = 'draftUtil';
                        title = '起草单位';
                    } else if (obj.item.act === 'expert') {
                        cmpName = 'draftPersons';
                        title = '主要起草人/专家';
                    } else if (obj.item.act === 'tcs') {
                        cmpName = 'selectTcs';
                        title = 'TC技术委员会';
                    }
                    this.openDialogComp({
                        title,
                        cmpName,
                        width: '800px',
                        node,
                        visible: true
                    });
                    break;
                case 'insertGraphy': // 插入图形
                    cmpName = obj.data.type === 0 ? "lineCode" : "textBox";
                    title = obj.data.type === 0 ? "90度折线图" : "文本图框";
                    let dialogData = Object.assign({
                        title,
                        cmpName,
                        width: '900px',
                        height: '600px',
                        visible: true
                    }, obj.data);
                    this.openDialogComp(dialogData);
                    break;
                default:
                    this.$emit('change', obj);
            }
        },

        /**
         * @description 注册文本框事件 modify by sam 2024-12-26
         * @param {Element} ele
         */
        regEventByTextBox(ele = null) {
            if (ele.ondblclick && ele.onmousedown) {
                return false;
            }
            // 去除EM
            const emNode = ele.querySelector('em.resize');
            if (emNode) {
                emNode.remove();
            }

            const editor = this.getActiveEditor();
            const block = editor.dom.getParent(ele, '.info-block');
            const boundary = 5;
            let isResizing = false;
            let rect = {};
            let resizeDirection = '';
            let initialWidth;
            let initialHeight;
            let initialX;
            let initialY;

            ele.ondblclick = (e) => {
                let index = ele.style.zIndex || 0;
                ele.style.zIndex = parseInt(index) + 1;
            }
            ele.onmousedown = (e) => {
                if (typeof ele.setCapture !== 'undefined') {
                    ele.setCapture();
                }
                if (e.ctrlKey) {
                    ele.style.cursor = 'move';
                    let startX = ele.offsetLeft,
                        startY = ele.offsetTop;
                    let clientX = e.clientX,
                        clientY = e.clientY,
                        disX = 0,
                        disY = 0;

                    block.onmousemove = (evt) => {
                        evt.preventDefault();
                        evt.stopPropagation();
                        disX = startX + evt.clientX - clientX;
                        disY = startY + evt.clientY - clientY;
                        ele.style.left = disX + 'px';
                        ele.style.top = disY + 'px';

                    };
                    block.onmouseup = (evt) => {
                        block.onmousemove = null;
                        block.onmouseup = null;
                        ele.style.cursor = null;
                        ele.dataset.left = disX;
                        ele.dataset.top = disY;
                        this.sortElementsByTopPosition(block);
                    };
                } else {
                    if (resizeDirection) {
                        isResizing = true;
                        initialWidth = ele.offsetWidth;
                        initialHeight = ele.offsetHeight;
                        initialX = e.clientX;
                        initialY = e.clientY;

                        block.onmousemove = (evt) => {
                            const dx = evt.clientX - initialX;
                            const dy = evt.clientY - initialY;
                            // console.log('resizeDirection===>', resizeDirection)
                            switch (resizeDirection) {
                                case 'e':
                                    ele.style.width = `${initialWidth + dx}px`;
                                    break;
                                /*case 'w':
                                    ele.style.width = `${initialWidth - dx}px`;
                                    ele.style.left = `${rect.left + dx}px`;
                                    break;*/
                                case 's':
                                    ele.style.height = `${initialHeight + dy}px`;
                                    break;
                                case 'n':
                                    ele.style.height = `${initialHeight - dy}px`;
                                    ele.style.top = `${rect.top + dy}px`;
                                    break;
                                case 'se':
                                    ele.style.width = `${initialWidth + dx}px`;
                                    ele.style.height = `${initialHeight + dy}px`;
                                    break;
                                /*case 'sw':
                                    ele.style.width = `${initialWidth - dx}px`;
                                    ele.style.height = `${initialHeight + dy}px`;
                                    ele.style.left = `${rect.left + dx}px`;
                                    break;*/
                                case 'ne':
                                    ele.style.width = `${initialWidth + dx}px`;
                                    ele.style.height = `${initialHeight - dy}px`;
                                    ele.style.top = `${rect.top + dy}px`;
                                    break;
                                /*case 'nw':
                                    ele.style.width = `${initialWidth - dx}px`;
                                    ele.style.height = `${initialHeight - dy}px`;
                                    ele.style.left = `${rect.left + dx}px`;
                                    ele.style.top = `${rect.top + dy}px`;
                                    break;*/
                            }
                            ele.style.maxWidth = null;

                            initialX = evt.clientX;
                            initialY = evt.clientY;
                            initialWidth = ele.offsetWidth;
                            initialHeight = ele.offsetHeight;
                        }
                        block.onmouseup = (evt) => {
                            ele.removeAttribute('data-mce-style');
                            block.onmousemove = null;
                            block.onmouseup = null;
                            ele.style.cursor = null;
                            isResizing = false;
                            resizeDirection = '';
                        }
                    }
                }
            }
            ele.onmousemove = (e) => {
                rect = ele.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                if (x < boundary) {
                    /*if (y < boundary) {
                        resizeDirection = 'nw';
                        ele.style.cursor = 'nw-resize';
                    } else if (y > rect.height - boundary) {
                        resizeDirection = 'sw';
                        ele.style.cursor = 'sw-resize';
                    } else {
                        resizeDirection = 'w';
                        ele.style.cursor = 'w-resize';
                    }*/
                } else if (x > rect.width - boundary) {
                    if (y < boundary) {
                        // resizeDirection = 'ne';
                        // resizable.style.cursor = 'ne-resize';
                    } else if (y > rect.height - boundary) {
                        // resizeDirection = 'se';
                        // ele.style.cursor = 'se-resize';
                    } else {
                        resizeDirection = 'e';
                        ele.style.cursor = 'e-resize';
                    }
                } else if (y < boundary) {
                    // resizeDirection = 'n';
                    // resizable.style.cursor = 'n-resize';
                } else if (y > rect.height - boundary) {
                    // resizeDirection = 's';
                    // ele.style.cursor = 's-resize';
                } else {
                    resizeDirection = '';
                    ele.style.cursor = 'default';
                }
            }
        },


        /**
         * @description 在线翻译
         * @param {Object} data
         */
        async translateText(data = {}) {
            // 内部网络系统的则直接忽略
            if (this.editorSetting.innerSys) {
                return "";
            }
            if (!data.export) {
                this.onLoading('正在翻译中....',true);
            }
            // var editorConfig = $global.getStroage('tinymceConfig');
            var url = this.editorSetting.nodeURL || process.env.VUE_APP_REMOTE_API;
            var res = await documentServer({
                type: 'translate',
                text: data.text
            }, url);

            if (res.error_code === 200) {
                // this.loading && this.loading.close();
                // this.loading = null;
                this.closeLoading();
                if (data.export) {
                    return res.data[0]['dst'];
                }
                if (res.error_msg) {
                    this.$message.error('在线翻译错误：' + res.error_msg);
                    return false;
                }

                this.$prompt(`原文：${res.data[0]['src']}<br/>翻译：`, '在线翻译', {
                    inputValue: res.data[0]['dst'],
                    confirmButtonText: '插入翻译内容',
                    cancelButtonText: '取消关闭',
                    dangerouslyUseHTMLString: true
                }).then(({ value }) => {
                    var editor = this.getActiveEditor();
                    var currNode = editor.selection.getNode();
                    if ($global.hasClass(currNode, 'stdNameEn') && value.match(/(\Part|\part)/i) !== null) {
                        var splitValue = value.split('part');
                        if (splitValue.length > 1) {
                            value = splitValue[0] + '<br/>' + 'Part' + splitValue[1].replace(/\：/i, ':');
                        }
                    }
                    editor.execCommand('mceInsertContent', false, value);
                }).catch(() => {});
            }
        },

        /**
         * @description 保存大纲及大纲正文
         */
        async onlySaveOutline() {
            var outlineList = await this.get_outline(true);
            return await this.batchSaveContentByBlock(outlineList);
        },

        /**
         * @description 如果是锁定章节的前提下，则按outlineList重新定义标签数据
         * @param {Array} tagList
         * @param {Array} outlineList
         * @param {Array} isCommit
         */
        resetTagsByCommit(tagList = []) {
            var tagData = {
                docId: this.pageData.docId,
                tagList: []
            }
            tagList.forEach((data, idx) => {
                tagData.tagList = tagData.tagList.concat(data.tagList);
            })
            return [tagData];
        },

        /**
         * @description 如果是锁定章节的前提下，则按commit方式重新定义章节数据
         * @param {Array} outlineList
         */
        resetOutlineByCommit(outlineList = []) {
            var arrList = [];
            var findExsit = item => {
                for (let i = 0; i < arrList.length; i++) {
                    let arr = arrList[i];
                    if (arr && _.isArray(arr)) {
                        for (let j = 0; j < arr.length; j++) {
                            let obj = arr[j];
                            if (obj && obj.outlineId == item.parentId) {
                                return arr;
                                break;
                            }
                        }
                    }
                }
                return null;
            }
            outlineList.forEach((data, idx) => {
                if (idx > 0) {
                    let liArr = findExsit(data);
                    if (!liArr) {
                        liArr = [data];
                        arrList.push(liArr);
                    } else {
                        liArr.push(data);
                    }
                }
            });
            return arrList;
        },

        resetPageData() {
            let pageData = pageUtil.getPageData();
            this.pageData = _.merge(this.pageData, pageData);
        },

        /**
         * @description 保存合并后的文档数据
         * @param {Object} data
         */
        async saveExportPageData(data = {}) {
            var path = $global.getDateStr();
            var fileName = new Date().getTime();
            // console.log('xmlPath===》', this.pageData.xmlPath);
            // debugger
            var filepath = this.pageData.xmlPath || `json/${path}/${fileName}.json`;
            var condition = {
                type: 'writeFile',
                content: JSON.stringify(data),
                filepath
            }
            var url = this.editorSetting.nodeURL || process.env.VUE_APP_REMOTE_API;
            var res = await documentServer(condition, url);
            if (res.success) {
                this.$set(this.pageData, 'xmlPath', filepath);
                return filepath;
            } else {
                return false;
            }
        },

        /**
         * @description 一般非标文档保存
         */
        async saveNormal(editor = null, updateDoc = false) {
            editor = editor || this.getActiveEditor();
            var pageContainer = editor.getBody().querySelector('.page-container');
            var docData = pageUtil.getPageData() || {};
            // console.log('saveNormal', docData, this.pageData)

            if (!docData.stdTitle || !pageContainer.dataset.title) {  //
                editor.windowManager.open({
                    title: '请输入文档名称',
                    body: {
                        type: 'panel',
                        items: [{
                            type: 'input',
                            name: 'docName',
                            label: '',
                            placeholder: '文档名称'
                        }]
                    },
                    initialData: { docName: docData.stdTitle },
                    buttons: [{
                            type: 'cancel',
                            name: 'closeButton',
                            text: 'Cancel'
                        },
                        {
                            type: 'submit',
                            name: 'submitButton',
                            text: 'Ok',
                            primary: true
                        }
                    ],
                    onSubmit: (api, details) => {
                        var data = api.getData();
                        if (!data.docName) {
                            editor.windowManager.alert("请输入文档名称！");
                            return;
                        }
                        api.close();
                        pageContainer.dataset.title = data.docName;
                        this.saveNormal(editor, true);
                    },
                })
                return false;
            }
            this.loadingTimes = 300000;
            this.onLoading('正在保存文档数据中，请稍后...', true);

            docData.stdCategory = 1;
            docData.stdName = docData.stdTitle || '';
            docData.stdKind = 999;
            docData.createUser = this.editorSetting.author ? this.editorSetting.author.userName : 'anonymous';

            // debugger
            // 外部保存数据
            var tableData = [];
            if (this.editorSetting.outData) {
                let tableNodes = Array.from(pageContainer.querySelectorAll('table'));
                if (tableNodes.length) {
                    tableNodes.forEach(table => {
                        let titleNode = table.querySelector('.table-title');
                        tableData.push({
                            id: table.dataset.id,
                            title: titleNode ? titleNode.textContent : '',
                            rows: tableUtil.matrixTable(table, false, true)
                        })
                    })
                }
                this.closeLoading();
                // this.loading && this.loading.close();
                // this.loading = null;
                // this.$message.success("文档数据已经输出！");
                this.$emit('change', { act: 'outData', pageData: docData, tableData, htmlContent: editor.getContent() });
                return false;
            }

            // step1.先保存到文档数据中
            var url = this.editorSetting.editorURL || process.env.VUE_APP_EDITOR_URL;
            var res, isAdd = false;
            if (!this.pageData.createTime) {
                isAdd = true;
                res = await saveDocument(docData, url);
                if (res.code !== 200) {
                    this.$message.error("文档数据保存失败！");
                    this.closeLoading();
                    // this.loading && this.loading.close();
                    // this.loading = null;
                    return false;
                }
            }
            // 更新文档
            if (updateDoc) {
                res = await updateDocument(docData, url);
                if (!res || res.code !== 200) {
                    this.$message.error('文档数据保存失败！');
                    /*this.loading && this.loading.close();
                    this.loading = null;*/
                    this.closeLoading();
                    return false;
                }
            }

            // step2.保存文档正文数据
            const contentId = pageContainer.dataset.contentid || this.pageData.contentId || $global.guid();
            if (!pageContainer.dataset.contentid) {
                pageContainer.dataset.contentid = contentId;
            }
            var htmlContent = editor.getContent();
            var contentData = {
                contentId,
                docId: docData.docId,
                stdTitle: docData.stdTitle,
                createUser: docData.createUser,
                outlineId: docData.outlineId || $global.guid(),
                content: htmlContent
            }

            // 后台接口缺陷，所以要做下判断
            res = await getContent({docId:docData.docId }, url);
            if (!res || !res.total) {
                isAdd = true;
            }
            // debugger
            // 新增或更新
            if (isAdd) {
                res = await addContent(contentData, url);
            } else {
                res = await updateContent(contentData, url);
            }

            if (res.code === 200) {
                this.$message.success("文档正文已保存！");
                docData.createTime = this.pageData.createTime || docData.createTime || new Date().getTime();
                $global.setStroage('tinymceDocData', docData);
            } else {
                this.$message.error("文档正文保存失败！");
            }
            // this.loading && this.loading.close();
            // this.loading = null;
            this.closeLoading();

            return true;
        },

        /**
         * @description 校验文档是否正确
         */
        async checkDocErrors(editor = null) {
            // 校验表格的列高度是否超限
            var docError = pageUtil.checkTableContent(editor);
            var levelError = levelUtil.sortLevel(editor, false, true);
            this.pageErrors = docError;
            if (docError.length) {
                return new Promise((resolve, reject) => {
                    this.$confirm(docError.join("<br/>"), '文档错误提示', {
                        dangerouslyUseHTMLString: true,
                        confirmButtonText: '立即修改',
                        cancelButtonText: '暂不修改',
                        type: 'warning',
                        showClose: false
                    }).then(() => {
                        this.$emit('change', { act: 'docError', error: docError });
                        resolve(false);
                    }).catch(() => {
                        resolve(true);
                    });
                })
            } else if(levelError && _.isArray(levelError)) {
                /* return new Promise((resolve, reject) => {
                    this.$confirm(levelError.join("<br/>"), '文档题条格式提示', {
                        dangerouslyUseHTMLString: true,
                        confirmButtonText: '立即修改',
                        cancelButtonText: '暂不修改',
                        type: 'warning',
                        showClose: false
                    }).then(() => {
                        this.$emit('change', { act: 'docError', error: levelError });
                        resolve(false);
                    }).catch(() => {
                        resolve(true);
                    });
                }) */
                return true;
            } else {
                return true;
            }
        },
        // 外部触发保存
        outSaveDoc() {
            return new Promise((resolve, reject) => {
                this.saveDoc(res => {
                    resolve(res);
                }, true).catch(error => {
                    resolve(false)
                })
            })
        },
        // 文档另存为， addBy sam.shen 2024-7-14
        async saveAs() {
            this.onLoading('正在另存新文档，请稍后！',true);
            const editor = this.getActiveEditor();
            const newDocId = $global.guid();
            const rootId = $global.guid();
            const newOutlines = [];

            const resContent = async (outlineItem) => {
                if (outlineItem.content) {
                    let content = outlineItem.content;
                    const section = document.createElement('div');
                    section.innerHTML = content.content;
                    const ele = section.firstChild;
                    if (ele.dataset.bookmark) {
                        ele.dataset.bookmark = outlineItem.outlineId;
                    }
                    if (ele.dataset.parentid) {
                        ele.dataset.parentid = outlineItem.parentId;
                    }
                    if (ele.dataset.outlineid) {
                        ele.dataset.outlineid = outlineItem.outlineId;
                    }
                    content.conentId = $global.guid();
                    content.docId = newDocId;
                    content.outlineId = outlineItem.outlineId;

                    content.content = section.innerHTML;
                    outlineItem.content = content;
                    section.remove();
                }
                return outlineItem;

            }

            const reduceList = async (list=[], parentId='0', aces='') => {
                for(let item of list) {
                    const oldId = item.outlineId;
                    item.docId = newDocId;
                    item.oldId = oldId;
                    item.outlineId = parentId === '0' ? rootId : $global.guid();
                    item.ancestors = (aces ? aces +',' : '') + item.outlineId;
                    item.parentId = parentId;
                    // 重置章节条款结构数据
                    item = await resContent(item);

                    newOutlines.push(_.omit(item, 'children','enLocked','owner'));
                    if (item.children && item.children.length) {
                        item.children = await reduceList(item.children, item.outlineId, item.ancestors);
                    }
                }
                return list;
            }

            // 更新文档题录数据
            let pageData = pageUtil.getPageData(editor);
            pageData.docId = newDocId;
            pageData.outlineid = rootId;

            let outlineList = await this.get_outline(true);
            outlineList = $global.handleTree(outlineList, 'outlineId', 'parentId', 'children', '0');
            outlineList = await reduceList(outlineList, '0', '');

            let tagList = this.get_tags();
            tagList = tagList.map(item => {
                item.docId = newDocId;
                let outlineItem = _.find(newOutlines, { oldId: item.outlineId });
                if (outlineItem) {
                    item.outlineId = outlineItem.outlineId;
                    if(item.tagList && item.tagList.length) {
                        item.tagList.forEach(tag => {
                            if (tag.ancestors) {
                                tag.ancestors = outlineItem.ancestors;
                                tag.docId = newDocId;
                                tag.outlineId = outlineItem.outlineId;
                            }
                        })
                    }
                }
                return item;
            })
            newOutlines.forEach(item => {
                delete item.oldId;
            });

            // 保存数据
            let error = '';
            const url = this.editorSetting.editorURL || process.env.VUE_APP_EDITOR_URL;
            let res = await saveDocument(pageData, url);
            if(res && res.code === 200) {
                res = await batchUpdateOutline({ outlineList:newOutlines }, url);
                if (res && res.code === 200) {
                    res = await saveTagData(tagList, url);
                    if (res && res.code === 200) {
                        this.$message.success('已保存！');
                    } else {
                        error = '保存标签数据失败！';
                    }
                } else {
                    error = '保存大纲数据失败！';
                }
            } else {
                error = '保存文档数据失败！';
            }
            // this.loading && this.loading.close();
            this.closeLoading();
            if(error) {
                this.$message.error(error);
            } else {
                // 更新地址栏ID参数
                if (window.location.search) {
                    let urlParams = new URLSearchParams(window.location.search);
                    urlParams.set('id', newDocId); // 替换现有参数的值，如果不存在则添加
                    let newUrl = `${window.location.pathname}?${urlParams.toString()}${window.location.hash}`;
                    // 使用 history.pushState 修改地址栏 URL，但不刷新页面
                    window.history.pushState({}, '', newUrl);
                }
                // 重新加载文档
                this.loadDocData(newDocId, true);
                return {
                    pageData,
                    outlineList:newOutlines,
                    tagList
                }
            }
        },

        enabledSave(data) {
            this.$set(this.editorSetting,'disabledSave', data.disabledSave);
            this.$set(this.editorSetting,'reader', false);
            // this.$set(this.editorSetting,'reader', false);

            this.reloadOutline();
        },

        /**
         * @description 保存文档
         */
        async saveDoc(callBack = null) {
            var editor = this.getActiveEditor();
            if (!editor || !editor.getBody()) {
                this.$message.error('编辑器实例不存在！');
                callBack && callBack(false);
                return false;
            }
            if (this.editorSetting.disabledSave || this.docError) {
                this.$message.warning('当前文档禁止保存！');
                callBack && callBack(false);
                return false;
            }
            if (!await this.checkDocErrors(editor)) {
                return false;
            }
            // debugger
            var pageContainer = editor.getBody().querySelector('.page-container');
            if (pageContainer.dataset.merge && this.editorSetting.isStandard) {
                this.$message.warning('标准文档已合并处理，不可以提交保存！');
                callBack && callBack(false);
                return false;
            }
            if (this.parsedDoc) {
                this.saveParseDoc();
                callBack && callBack(false);
                return false;
            }

            // 更新页面模块文档的基础数据
            pageUtil.updateVm(this);

            var pageData = pageUtil.getPageData(editor);
            this.pageData = _.merge({}, this.pageData, pageData);

            // 如果是一般文档的保存
            if (!this.editorSetting.isStandard || !this.pageData.stdKind || this.editorSetting.normal) {
                let saveNormal = this.saveNormal(editor);
                callBack && callBack(saveNormal);
                return saveNormal;
            }
            this.isSaving = true;
            this.loadingTimes = 200000;
            this.onLoading('正在保存文档数据及提取结构化数据中，请稍后...', true);

            // 提取文档标签
            var tagList = this.get_tags(this.editorSetting.author.commitId !== "");
            // 获取大纲数据
            var outlineList = await this.get_outline(true);

            // 非协同作业模式下
            if (!this.editorSetting.author.lockedAll && this.editorSetting.author.commitId) {
                tagList = this.resetTagsByCommit(tagList);
            }
            // 如果未配置了直接输出数据则校验结构完整性
            if (!this.editorSetting.outData) {
                if (!this.pageData.stdName && this.editorSetting.isStandard) {
                    this.$message.error("缺少标准文档名称！");
                    this.closeLoading();
                    // this.loading && this.loading.close();
                    // this.loading = null;
                    this.isSaving = false;

                    this.moveTop();
                    callBack && callBack(false);
                    return;
                }
            }

            // 协同作业模式下，如果锁定了章节则过滤出须要保存的相关锁定的章节
            var ids = [];
            if (!this.editorSetting.readonly && !this.editorSetting.reader && this.editorSetting.author && this.editorSetting.author.lockedAll && !_.isEmpty(this.lockedOutline)) {
                // 过滤未被锁定的章节及ROOT根节点
                outlineList = outlineList.filter(item => {
                    return !item.locked && item.parentId !== '0';
                });
                var lockedItem = _.filter(this.lockedOutline, { userId: this.editorSetting.author.userId });
                if (lockedItem && lockedItem.length) {
                    for (let i = 0; i < lockedItem.length; i++) {
                        ids.push(lockedItem[i]['lockedOutlineId']);
                    }
                }
                // outlineList.splice(0, 1); // 去掉ROOT根节点
                // 如果是在可分配章节下须再过滤
                if (this.editorSetting.author.assignOutline) {
                    outlineList = outlineList.filter((item, i) => {
                        return item.enLocked;
                    })
                }
            }

            if (!outlineList.length && !this.editorSetting.outData) {
                this.$message.warning("大纲没有可更新内容！");
                this.isSaving = false;
                /*this.loading && this.loading.close();
                this.loading = null;*/
                this.closeLoading();
                callBack && callBack(false);
                return false;
            }

            // 校验大纲结构是否有相同
            let checkErrorOutline = outlineUtil.checkOutlineData(outlineList);
            if (checkErrorOutline) {
                this.$alert(checkErrorOutline, '数据结构错误', {
                    confirmButtonText: '确定',
                    dangerouslyUseHTMLString: true
                });
                this.isSaving = false;
                // this.loading && this.loading.close();
                // this.loading = null;
                this.closeLoading();
                callBack && callBack(false);
                return false;
            }

            // 在多人协同模式下判断章节是否正确
            if (this.editorSetting.author && this.editorSetting.author.lockedAll) {
                this.lockedOutline = await this.listLockedOutline(this.pageData.docId); // 重新获取当前用户锁定的章节
                // 获取自己的锁定章节
                let selfLockOutline = _.filter(this.lockedOutline, { userId: this.editorSetting.author.userId });
                console.log("当前文档中被锁定的章节和自己锁定编写的章节===>", this.lockedOutline, selfLockOutline);
                if (outlineList.length && selfLockOutline.length > 1) {
                    this.$message.error("大纲数据结构错误！可能锁定章节超时，请刷新页面后重新锁定后保存！");
                    this.isSaving = false;
                    /*this.loading && this.loading.close();
                    this.loading = null;*/
                    this.closeLoading();
                    callBack && callBack(false);
                    return false;
                } else {
                    // 根据锁定的章节再次过滤下大纲，以免重复保存
                    if (selfLockOutline.length > 0) {
                        outlineList = outlineList.filter(item => {
                            return item.ancestors.split(",").includes(selfLockOutline[0]['lockedOutlineId']);
                        });
                        // console.log("当前保存的条款(再次清洗)===>", outlineList);
                    }
                }
                // console.log("当前保存的锁定章节和条款===>", outlineList, this.lockedOutline, this.lockedDoc);
            }

            // 记录数据保存章节数据
            if (this.editorSetting.autoSaveTimes) {
                $global.setStroage('autoSaved', outlineList);
            }

            // 如果大纲数据为空则直接中断提交
            if (!outlineList.length && !this.editorSetting.parseStruct) {
                // this.loading && this.loading.close();
                // this.loading = null;
                this.closeLoading();
                callBack && callBack(false);
                this.$alert('章节数据为空，请检查！','错误提示', { type:'error'});
                return false;
            }

            // console.log('saveDoc tagList=>', tagList);
            console.log('保存章节数据 outlineList=>', outlineList);
            console.log('保存文档数据 pageData=>', this.pageData);

            /*this.loading.close();
            return;*/

            // 外部保存数据
            if (this.editorSetting.outData) {
                this.$emit('change', { act: 'outData', pageData: this.pageData, outlineList, tagList });
                this.isSaving = false;
                // this.loading && this.loading.close();
                // this.loading = null;
                this.closeLoading();
                callBack && callBack(false);
                return false;
            }

            // 多人协同锁定状态下
            if ((this.editorSetting.author && this.editorSetting.author.commitId) || !_.isEmpty(this.lockedOutline)) {
                this.batchSaveContentByBlock(outlineList, flag => {
                    if (flag) {
                        // debugger
                        // 输出结构化数据
                        this.submitSaveStructData().then(jsonPath => {
                            console.log('输出结构化数据=>', jsonPath);
                            this.updateDocmentData({ jsonPath })
                        }).catch(error => {
                            console.error('后台通信异常=>', error);
                        });
                        // 保存标签
                        this.updateDocTag(tagList).then(tagRes => {
                            if (tagRes) {
                                if (this.editorSetting.author.lockedAll) {
                                    this.socketClass.putSaved(outlineList[0]);
                                }
                                this.$message.success("大纲内容保存成功！");
                                // 协同模式下须重新加载文档刷新页面
                                if (ids && ids.length) {
                                    this.loadDocData(this.pageData.docId, true).then(reloaded => {
                                        if (reloaded) {
                                            this.foucsId({
                                                outlineId: ids[ids.length - 1]
                                            });
                                        }
                                    });
                                } else {
                                    // this.loading && this.loading.close();
                                    // this.loading = null;
                                    this.closeLoading();
                                    this.isSaving = false;
                                }
                                callBack && callBack(true);
                            } else {
                                this.$message.error("文档标签保存失败！");
                                // this.loading && this.loading.close();
                                // this.loading = null;
                                this.closeLoading();
                                this.isSaving = false;
                                callBack && callBack(false);
                            }
                        }).catch(error => {
                            // this.loading && this.loading.close();
                            // this.loading = null;
                            this.closeLoading();
                            this.isSaving = false;
                            console.error('后台通信异常=>', error);
                        });

                        // 延迟处理已保存
                        setTimeout(() => {
                            // this.loading && this.loading.close();
                            // this.loading = null;
                            this.closeLoading();
                            this.isSaving = false;
                            this.$emit('change', { act:'saved', pageData:this.pageData, outlineList });
                        }, 1000);
                    } else {
                        this.$message.error("大纲内容保存失败！");
                        /*this.loading && this.loading.close();
                        this.loading = null;*/
                        this.closeLoading();
                        this.isSaving = false;
                        callBack && callBack(false);
                    }
                })
            } else {
                this.batchSaveContentByBlock(outlineList, flag => {
                    if (flag) {
                        this.submitSaveStructData().then(jsonPath => {
                            if (jsonPath) {
                                // 更新下文件的结构化数据路径
                                this.updateDocmentData({ jsonPath }).then(docRs => {
                                    if (docRs) {
                                        // 保存标签
                                        this.updateDocTag(tagList).then(tagRes => {
                                            if (tagRes) {
                                                this.$message.success("文档内容保存成功！");
                                                if (this.editorSetting.author.lockedAll) {
                                                    this.socketClass.putSaved({ docId: this.pageData.docId });
                                                }
                                                callBack && callBack(true);
                                            } else {
                                                this.$message.error("文档标签保存失败！");
                                                callBack && callBack(false);
                                            }
                                        }).catch(error => {
                                            // this.loading && this.loading.close();
                                            // this.loading = null;
                                            this.closeLoading();
                                            this.isSaving = false;
                                            console.error('后台通信异常=>', error);
                                        })
                                    } else {
                                        this.$message.error("文档内容保存失败！");
                                        callBack && callBack(false);
                                    }
                                    // this.loading && this.loading.close();
                                    // this.loading = null;
                                    this.closeLoading();
                                    // 延迟处理已保存
                                    setTimeout(() => {
                                        this.isSaving = false;
                                        this.$emit('change', { act:'saved', pageData:this.pageData, outlineList });
                                    }, 1000);
                                }).catch(error => {
                                    // this.loading && this.loading.close();
                                    // this.loading = null;
                                    this.closeLoading();
                                    this.isSaving = false;
                                    console.error('后台通信异常=>', error);
                                });
                            } else {
                                // this.loading && this.loading.close();
                                // this.loading = null;
                                this.closeLoading();
                                this.isSaving = false;
                                callBack && callBack(false);
                            }
                        }).catch(error => {
                            // this.loading && this.loading.close();
                            // this.loading = null;
                            this.closeLoading();
                            this.isSaving = false;
                            console.error('后台通信异常=>', error);
                        });
                    } else {
                        this.$message.error("大纲内容保存失败！");
                        /*this.loading && this.loading.close();
                        this.loading = null;*/
                        this.closeLoading();
                        this.isSaving = false;
                        callBack && callBack(false);
                    }
                });
            }
        },
        /**
         * @description 更新文档标签数据
         * @param {Array} tageList
         */
        async updateDocTag(tageList = []) {
            var res = await saveTagData(tageList, this.editorSetting.editorURL || process.env.VUE_APP_EDITOR_URL);
            return res.code === 200;
        },

        /**
         * @description 更新文档数据
         * @param {Object} data
         */
        async updateDocmentData(data = {}) {
            var res;
            data = _.merge({}, this.pageData, data);
            // 页面缩略图
            let thumbnailList = [];
            let url = this.editorSetting.nodeURL || process.env.VUE_APP_REMOTE_API;

            if (this.imgdataList && this.imgdataList.length) {
                var formData = new FormData();
                for (let i = 0; i < this.imgdataList.length; i++) {
                    let img64 = this.imgdataList[i]['src'];
                    const bolbInfo = $global.dataURLtoFile(img64);
                    formData.append("file", bolbInfo);
                    formData.append("filename", bolbInfo.lastModified + '.png');
                }
                res = await uploadFile(formData, url);
                if (res.error_code === 200) {
                    res.data.forEach(d => {
                        if (d && d.outFile) {
                            thumbnailList.push(d.outFile);
                        }
                    })
                }
            }
            data.thumbnailList = thumbnailList.join(',');

            // xml数据的处理 modify by sam.shen 2024-8-28
            if (this.editorSetting.saveXml) {
                var xmlData = await this.exportHTML2word({ save: true });
                // console.log('xmlData', xmlData);
                // 保存结构化数据
                data.xmlPath = await this.saveExportPageData(xmlData);
            }

            const pageContainer = this.editor.getBody().querySelector('.page-container');
            let docId = pageContainer.dataset.id;
            let isNew = pageContainer.dataset.new;
            // 保存文档数据
            var condition = {
                docId,
                createUser: this.editorSetting.author ? this.editorSetting.author.userName : 'anonymous',
                ...data
            }
            // 保存文档时，后台接口同时提取下术语、引用等数据
            if (this.editorSetting.parseLinkAndLemma) {
                condition.parseLinkAndLemma = true;
            }
            url = this.editorSetting.editorURL || process.env.VUE_APP_EDITOR_URL;

            // 创建新文档
            if (isNew) {
                res = await saveDocument(condition, url);
            } else {
                res = await updateDocument(condition, url);
            }

            let isSaved = res && res.code === 200;
            if (isSaved) {
                pageContainer.removeAttribute('data-new');
                // 更新缓存
                $global.setStroage('tinymceDocData', data);
            }
            // 返回提交结果
            return isSaved;
        },

        /**
         * @description 保存结构化数据到NodeServer
         * @param {Object} data
         */
        async submitSaveStructData(data = null) {
            // this.onLoading('正在分析文档结构化数据，请稍后...', true);
            this.editor = this.getActiveEditor();
            var pageContainer = this.editor.getBody().querySelector('.page-container');
            if (pageContainer) {
                // 结构化数据
                var structData = this.exportHTML2StructData(pageContainer);
                // 创建保存路径
                var path = $global.getDateStr();
                var fileName = new Date().getTime();
                var filepath = this.pageData.jsonPath || `json/${path}/${fileName}.json`;
                var condition = {
                    type: 'writeFile',
                    content: JSON.stringify(structData),
                    filepath
                }
                var res = await documentServer(condition, this.editorSetting.nodeURL || process.env.VUE_APP_REMOTE_API);
                if (res.success) {
                    this.pageData.jsonPath = filepath;
                    $global.setStroage('tinymceDocData', this.pageDate);
                    // this.loading && this.loading.close();
                    // this.loading = null;
                    this.closeLoading();
                    return filepath;
                } else {
                    this.$message.error("结构化数据保存失败！");
                    /*this.loading && this.loading.close();
                    this.loading = null;*/
                    this.closeLoading();
                    return false;
                }
            }
            return false;
        },

        /**
         * @description 考虑数据量会很大，需要依次队列保存数据
         * @param {Array}   outlineList
         * @param {Function}  callBack
         */
        async batchSaveContentByBlock(outlineList = [], callBack = null) {
            try {
                // 锁定章节的大纲保存方式
                if (this.editorSetting.author && this.editorSetting.author.commitId) {
                    const submitData = async index => {
                        let data = outlineList[index];
                        if (!data || _.isEmpty(data)) {
                            callBack && callBack(true);
                        } else {
                            let res = await this.saveOutlineData({
                                outlineList: data,
                                commitId: this.editorSetting.author.commitId,
                            });
                            if (res) {
                                submitData(index + 1);
                            } else {
                                callBack && callBack(false);
                            }
                        }
                    }
                    submitData(0);
                } else {
                    let res = await this.saveOutlineData({ outlineList });
                    if (res) {
                        callBack && callBack(true);
                    }
                }
            } catch (error) {
                console.error('后台通信异常:',error)
                callBack && callBack(false);
            }
        },

        /**
         * @description 按每个单元数据保存
         * @param {Object}  outlineList
         */
        async saveOutlineData(outlineList, single=false) {
            let res;
            if (!single) {
                res = await batchUpdateOutline(outlineList, this.editorSetting.editorURL || process.env.VUE_APP_EDITOR_URL);
            } else {
                res = await updateOutline(outlineList, this.editorSetting.editorURL || process.env.VUE_APP_EDITOR_URL);
            }

            return res.code === 200;
        },
        // base64文件上传
        async uploadImgByBase64(imgBase64='') {
            const url = this.editorSetting.nodeURL || process.env.VUE_APP_REMOTE_API;
            const condition = {
                type: 'saveFileByBase64',
                fileData: imgBase64,
                fileType: '.png',
            }
            const res = await uploadFile(condition, url);
            if (res && res.data) {
                return res.data;
            }
        },

        // 导出markdown文件
        async exportMarkdown(data={}) {
            try {
                const editor= this.getActiveEditor();
                const htmlContent = editor.getContent();
                const turndownService = new TurndownService();
                const mdContent = turndownService.turndown(htmlContent);
                $global.downloadData(mdContent, { type:'text/markdown;charset=utf-8' }, data.docName?data.docName+'.md':'test.md');
            } catch (error) {
                console.error('exportMarkdown error', error);
            }
        },

        // 导出表单 data: { docName:'文件名称', }
        async exportTableForm(data) {
            this.onLoading('正在生成文档，请稍后...',true);
            try {
                const editor= this.getActiveEditor();
                const currNode = editor.selection.getNode();
                const parentNode = editor.dom.getParent(currNode, 'table');
                if (parentNode) {
                    const xmlStr = parseXml.setXmlByTable(parentNode);
                    const pageBlock = editor.dom.getParent(parentNode, '.info-block');
                    const pageWidth = pageBlock.dataset.pagesize && pageBlock.dataset.pagesize === 'A3' ? 16838 : 11906;
                    const pageHeight = pageBlock.dataset.pagesize && pageBlock.dataset.pagesize === 'A3' ? 11906 : 16838;
                    const pageLeft = $global.hasClass(pageBlock, 'left') ? 1134 : 1417;
                    const pageRight = $global.hasClass(pageBlock, 'left') ? 1417 : 1134;
                    const pagePram = {
                        pageWidth,
                        pageHeight,
                        pageTop: 1417,
                        pageBottom: 1134,
                        pageLeft,
                        pageRight,
                        pageType: pageBlock.dataset.outlinetype,
                        appendixLetter: pageBlock.dataset.letter,
                    }
                    const bodyXml = [{
                        xmlList: [xmlStr],
                        pagePram
                    }]
                    const dataXml = {
                        body: bodyXml,
                        mediaList: parseXml.mediaList,
                        bulletList: parseXml.bulletList
                    }
                    // console.log('dataXmlt=>', dataXml)
                    const condition = {
                        type: 'outDoc',
                        filexp: 'docx',
                        tempPath: this.editorSetting.tempPath || 'docTmp',
                        content: dataXml,
                        wordBreak: this.editorSetting.wordBreak
                    }
                    if (data.isLocal) {
                        condition.wordBreak = true;
                    }

                    const url = this.editorSetting.nodeURL || process.env.VUE_APP_REMOTE_API;
                    const res = await officeServer(condition, url);
                    // console.log('exportTableForm dataXml===>', dataXml)
                    if (res && res.error_code === 200) {
                        // 直接输出数据
                        if (this.editorSetting.outTable) {
                            this.$emit('change', { act: 'exportTable', data: { xml:dataXml, docUrl:res.data, html:parentNode.outerHTML  } });
                        } else {
                            const fileName = url + res.data;
                            $global.downloadFile(fileName, data.docName + ".docx");
                        }
                    }
                } else {
                    this.$message.error('请选择需导出的表单对象！')
                }
            } catch (error) {
                console.log('error=>', error);
            }
            this.closeLoading();
            // this.loading && this.loading.close();
            // this.loading = null;
        },

        /**
         * @description 导出word文档 fileExt='docx', exportPdf=false
         * @param {Object} data
         */
        async exportHTML2word(data = {}) {
			// debugger
            this.loadingTimes = 120000;
            this.onLoading('正在分析文档数据，请稍后',true);

			const editor = this.getActiveEditor();

            var pageContainer = editor.getBody().querySelector('.page-container');
            // 导出时英文名称字体
            if (this.editorSetting.page && this.editorSetting.page.stdEnNameFont) {
                this.pageData.stdEnNameFont = this.editorSetting.page.stdEnNameFont;
            }
            // 标准文档须加上终结线
            if (this.editorSetting.isStandard && !pageContainer.querySelectorAll('div.finished')) {
                pageUtil.appendFinishedLine();
            }

            // 编辑器内部导出的
            if (data.isLocal) {
                this.$set(this.editorSetting, 'wordBreak', true);
            }

            var xmlData = await parseXml.outputXml(editor.getBody(), pageContainer.dataset.type === 'doubleSided', this.pageData, this.editorSetting);

            // 标签
            var tagList = this.get_tags(this.editorSetting.author.commitId !== "");
            // 大纲及内容数据
            var outlineList = await this.get_outline(true);

            if (xmlData.coverData && this.editorSetting.flatDepartment) {
                xmlData.coverData.flatDepartment = true;
            }
            if (data.save) {
                this.onLoading();
                return xmlData;
            }

            // 导出JSON
            if (data.type === 'json') {
                xmlData.tag = tagList;
                xmlData.outlineList = outlineList;
                console.log('export json', xmlData);
                $global.downloadData(JSON.stringify(xmlData), 'application/json', data.docName + '.json');
                this.onLoading();
                return;
            }

            // 导出XML
            if (data.type === 'xml') {
                this.loadingTimes = 60000;
                this.onLoading('正在处理文档的结构化数据，请稍后',true);
                var errorMsg;
                var url = this.editorSetting.nodeURL || process.env.VUE_APP_REMOTE_API;
                // step1:保存JSON文件
                xmlData.tag = tagList;
                xmlData.outlineList = outlineList;
                var jsonFile, docFile, pdfFile;
                var params = {
                    "type": "saveFile",
                    "data": xmlData,
                    "fileExt": "json"
                }
                var res = await uploadFile(params, url);
                console.log('export json==>', res)
                if (res && res.data) {
                    jsonFile = res.data;
                    // step2:输出word
                    params = {
                        type: 'outDoc',
                        filexp: 'docx',
                        tempPath: this.editorSetting.tempPath || 'docTmp',
                        content: xmlData,
                    }
                    res = await officeServer(params, url);
                    console.log('export docx==>', res)
                    if (res && res.data) {
                        docFile = res.data.replace('/files/','');
                        params = {
                            "type": "structToXml",
                            "fileData": {
                                jsonFile,
                                docFile,
                                pdfFile
                            }
                        }
                        res = await structServer(params, url);
                        console.log('export xml zip==>', res)
                        if (res && res.data) {
                            // 直接输出下载
                            if (this.editorSetting.outData || data.outData) {
                                var zipUrl = url + '/files' + res.data;
                                $global.downloadFile(zipUrl, data.docName + '.zip');
                            }
                        } else {
                            errorMsg = '输出结构化数据包错误！'
                        }
                    } else {
                        errorMsg = '输出WORD数据错误！'
                    }
                } else {
                    errorMsg = '输出JSON基础数据错误！'
                }

                // this.loading && this.loading.close();
                this.closeLoading();
                // 处理完成
                if (errorMsg) {
                    this.$message.error(errorMsg);
                    return false;
                } else {
                    this.$message.success('结构化文档已打包输出');
                }
                return true;
            }

            xmlData.stdKind = this.pageData.stdKind;
            // 空白页
            xmlData.emptyPage = this.editorSetting.page.empty;

            console.log('export office', xmlData);
            // this.loading && this.loading.close();
            // this.loading = null;
            // return false;

            if (xmlData.stdKind && xmlData.coverData && !xmlData.coverData.customCover) {
                if (xmlData.stdKind === 8) { // 编制说明模板
                    xmlData.coverData.customCover = 'intro';
                } else if (xmlData.stdKind === 9) { // 潍柴模板
                    xmlData.coverData.customCover = 'wc';
                }
            }

            this.onLoading('正在生成文档，请稍后...',true);

            // 导出文档的同时更新结构化数据文件
            let xmlPath;
            if (this.editorSetting.saveXml) {
                const fileName = new Date().getTime();
                const path = $global.getDateStr();
                xmlPath = this.pageData.xmlPath || `json/${path}/${fileName}.json`;
            }

            var condition = {
                operation: 'outDoc',
                appType: this.editorSetting.wordApplication,
                filexp: data.type,
                tempPath: this.editorSetting.tempPath || 'docTmp',
                content: xmlData,
                xmlPath,
                // exportPdf: data.type === 'pdf',
                wordBreak: this.editorSetting.wordBreak
            }

            if (data.isLocal) {
                condition.wordBreak = true;
            }

            /* console.log('condition', condition);
            this.loading.close();
            return; */
            try {
                var url = this.editorSetting.nodeURL || process.env.VUE_APP_REMOTE_API;
                var res = await officeServer(condition, url);
                if (res && (res?.code === 200 || res?.error_code === 200)) {
                    if (!data.onlyPath) {
                        setTimeout(() => {
                            let fileName = url + res.data;
                            let ext = $global.getExt(fileName).toLowerCase();
                            this.docFileList.push({ label: data.docName, url: fileName, ext, createTime: new Date().getTime() });
                            $global.setStroage('docFileList', [...this.docFileList]);
                            let dn = $global.downloadFile(fileName, data.docName + "." + data.type);
                            let message = '文档已导出，因在线文档与实际输出的word文档在样式上存在一定的差异，请核对修正！';
                            if (ext === 'pdf') {
                                message = '导出的PDF文档仅供参考，可能会与原文的样式或格式存在差异，请使用专业性的DOC文档转PDF生成器为准！';
                            }
                            if (dn) {
                                this.$notify({
                                    title: '文档导出提示',
                                    message
                                });
                            }
                        }, 300);
                    }
                    // this.loading && this.loading.close();
                    // this.loading = null;
                    this.closeLoading();
                    return res.data;
                } else {
                    this.$message.error('生成文档错误！');
                    // this.loading && this.loading.close();
                    // this.loading = null;
                    this.closeLoading();
                }
            } catch (error) {
                console.log('error=>', error);
                // this.loading && this.loading.close();
                // this.loading = null;
                this.closeLoading();
            }
        },

        /**
         * @description 内容更新处理后重置数据
         */
        async changeContent(updateOutline=false) {
            if (!this.editor || !this.editor.getBody()) {
                return false;
            }
            var pageContainer = this.editor.getBody().querySelector('.page-container');
            if (!pageContainer) {
                return false;
            }

            // 重置页面数据,似乎影响不大.暂取消
            // this.resetPageData();
            // 注册文本框事件
            var blocks = Array.from(pageContainer.querySelectorAll('.info-block:not(.fixed):not(.disabled):not(.pageHide)'));
            blocks.forEach(block => {
                // 文本框
                var textBoxEle = Array.from(block.querySelectorAll('.text-box'));
                textBoxEle.forEach(ele => {
                    this.regEventByTextBox(ele);
                });
                // markdown高亮
                const pres = Array.from(block.querySelectorAll('pre'));
                pres.forEach(pre => {
                    if (!$global.hasClass(pre, 'rended')) {
                        $global.addClass(pre, 'rended');
                        if (!this.editorSetting.readonly) {
                            // this.addCopyBtn(pre);
                            let copyEle = pre.querySelector('.copy-btn');
                            if (!copyEle) {
                                copyEle = document.createElement('button');
                                copyEle.className = 'copy-btn';
                                // copyEle.innerText = 'copy';
                                copyEle.title = 'copy code';
                                pre.appendChild(copyEle);
                            }
                        }
                        const codeEles = pre.querySelectorAll('code');
                        codeEles.forEach(ele => {
                            hljs.highlightBlock(ele);
                        })
                    }
                })
                // 参考文献或其他标题的
                /* var blockTitle = block.querySelector('.header-title.smaller>p');
                if (blockTitle && blockTitle.innerHTML.match(/\&nbsp;/) === null) {
                    let innerText = blockTitle.textContent;
                    blockTitle.innerHTML = innerText.split("").join("&nbsp;");
                } */
            });

            // 文本框事件
            /* var textBoxEle = Array.from(pageContainer.querySelectorAll('.text-box'));
            textBoxEle.forEach(ele => {
                this.regEventByTextBox(ele);
            }); */

            // 同步构建大纲,这里文档的章节超多会引起严重卡顿及延迟
            // this.get_outline(false, updateOutline);
            requestIdleCallback(() => {
                this.get_outline(false, updateOutline);
            });

            // 上报事件
            this.$emit('change', { act: 'changeContent', content: this.getContent() });

            return true;
        },

        clearDraftData(docId = "") {
            this.draftList = [];
        },

        checkedAllDraft() {
            this.draftChkeckeds = [];
            this.checkedDraftAll = !this.checkedDraftAll;
            if (this.checkedDraftAll) {
                this.draftList.forEach(item => {
                    this.draftChkeckeds.push(item.dateTime);
                })
            }
        },

        checkedDraftItem(item = {}) {
            // console.log('checkedDraftItem=>', item);
            let index = _.indexOf(this.draftChkeckeds, item.dateTime);
            if (!!~index) {
                this.draftChkeckeds = _.remove(this.draftChkeckeds, (n, i) => {
                    return n !== item.dateTime;
                })
            } else {
                this.draftChkeckeds.push(item.dateTime);
            }
            // console.log('this.draftChkeckeds==>', this.draftChkeckeds);
        },
        /**
         * @description 移除草稿箱列表
         */
        removeDraftData() {
            if (!this.draftChkeckeds.length) {
                this.$message.error('请选中需要删除的草稿箱！');
                return false;
            }
            var condition = {
                type: 'removeDraftByChecked',
                id: this.pageData.docId,
                checkeds: this.draftChkeckeds
            }

            this.$confirm('确定删除选中的草稿?一旦删除则无法恢复！', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                dbServer(condition, this.editorSetting.nodeURL || process.env.VUE_APP_REMOTE_API).then(res => {
                    if (res.error_code === 200) {
                        this.draftChkeckeds = [];
                        this.checkedDraftAll = false;
                        this.$message.success('已删除选中的草稿箱！');
                        this.getDraftData(this.pageData.docId);
                    }
                })
            }).catch(() => {});
        },

        /**
         * @description 获取草稿箱列表
         */
        async getDraftData(docId = "", dateTime = undefined) {
            // 如果是多人协同下且为非编辑状态下
            if (!this.lockedDoc && this.editorSetting.author && this.editorSetting.author.lockedAll && !this.editorSetting.author.enableDraft) {
                return [];
            }
            var condition = {
                type: 'getDraft',
                id: docId
            }
            if (dateTime) {
                condition.dateTime = dateTime;
            }
            var res = await dbServer(condition, this.editorSetting.nodeURL || process.env.VUE_APP_REMOTE_API);
            if (res && res.data) {
                if (condition.dateTime && res.data.htmlContent) {
                    this.setContent(res.data.htmlContent, true);
                } else {
                    this.draftList = res.data;
                    return this.draftList;
                }
            } else { // 如果读取不到则删除（可能暂存文件太多太大了）
                condition.type = 'removeDraft';
                await dbServer(condition, this.editorSetting.nodeURL || process.env.VUE_APP_REMOTE_API);
            }
            return [];
        },

        /**
         * @description 内容保存到缓存 (直接保存文件在nodeServer服务器上)
         */
        autoSaveContent() {
            var editor = this.getActiveEditor();
            if (!editor || !editor.getBody() || !this.editorSetting.draftTimes || (!this.lockedDoc && this.editorSetting.author && this.editorSetting.author.lockedAll && !this.editorSetting.author.enableDraft)) {
                return false;
            }
            var pageContainer = editor.getBody().querySelector('.page-container');
            if (pageContainer) {
                // 去除某些锁定的元素
                var section = document.createElement('div');
                section.innerHTML = pageContainer.outerHTML;
                var allBlock = Array.from(section.querySelectorAll('.info-block:not(.cover):not(.catalogue)'));
                allBlock.forEach(block => {
                    let diabledEle = block.querySelector(':scope>div.locked');
                    if (diabledEle) {
                        diabledEle.remove();
                    }
                    block.removeAttribute('contenteditable');
                    $global.removeClass(block, 'disabled');
                    let allOutlineEles = Array.from(block.querySelectorAll('div[outlineid]'));
                    allOutlineEles.forEach(node => {
                        $global.removeClass(node, 'disabled');
                    })
                })

                var htmlContent = section.innerHTML; //pageContainer.outerHTML;
                section.remove();

                var bytes = $global.getBytesFromStr(htmlContent);
                var flag = true;
                if (this.draftList.length) {
                    let lastData = this.draftList[0];
                    if (lastData.bytes === bytes) {
                        flag = false;
                    }
                }

                if (flag) {
                    var data = {
                        id: pageContainer.dataset.id,
                        dateTime: new Date().getTime(),
                        bytes,
                    }
                    var condition = {
                        type: 'saveDraft',
                        htmlContent,
                        ...data
                    }
                    dbServer(condition, this.editorSetting.nodeURL || process.env.VUE_APP_REMOTE_API).then(res => {
                        if (res.error_code === 200) {
                            this.draftList.unshift(data);
                        }
                    })
                }
            }
        },

        /**
         * @description 生成页面图片
         * @param {Function} callBack
         */
        async genratorPageImg(callBack) {
            var editor = this.getActiveEditor();
            if (!editor || !editor.getBody()) {
                return false;
            }
            var container = editor.getBody().querySelector('.page-container');
            if (container && !this.editorSetting.readonly) {
                this.genratorIng = true;
                this.onLoading('正在生成页面缩略图，请等候完成……',true)
                var infoBlocks = Array.from(container.querySelectorAll('.info-block'));
                this.imgdataList = await this.transPageToImage(container);

                // 输入页面缩略图后再转换回来
                setTimeout(() => {
                    this.genratorIng = false;
                    /*this.loading && this.loading.close();
                    this.loading = null;*/
                    this.closeLoading();
                    if (callBack && typeof callBack === 'function') {
                        callBack(this.imgdataList)
                    } else {
                        this.$emit('change', { act: 'pageToImg', imgList:this.imgdataList });
                    }
                }, 2500)
            }
        },
        async transPageToImage(container, onlyCover=false) {
            var editor = this.getActiveEditor();
            container = container ||  editor.getBody().querySelector('.page-container');
            var infoBlocks = Array.from(container.querySelectorAll('.info-block'));
            var imgList = [];
            for (let i = 0; i < infoBlocks.length; i++) {
                let pageEle = infoBlocks[i];
                let opts = {
                    logging: true,
                    width: pageEle.offsetWidth - 10,
                    height: pageEle.offsetHeight,
                    userCORS: true,
                    allowTaint: false,
                    scale: 0.9,
                    dpi: 300
                };
                let canvas = await html2canvas(pageEle, opts);
                let imgBase64 = canvas.toDataURL("image/png");
                // 仅获取封面图片
                if (i === 0 && onlyCover) {
                    return imgBase64;
                }
                imgList.push({
                    disabled: $global.hasClass(pageEle, 'disabled'),
                    itemId: pageEle.dataset.outlineid,
                    outlineId: pageEle.dataset.outline,
                    pageIndex: i,
                    landscape: opts.width > opts.height,
                    width: opts.width,
                    height: opts.height,
                    src: imgBase64
                })
            }
            return imgList;
        },


        /**
         * @description 公式代码转换为图片
         * @param {String} latex
         */
        tranLatex2Img(latex) {
            // debugger
            latex = tranGreeceText(latex);
            const condition = {
                type: 'mathjaxToImg',
                format: 'TeX',
                mathStr: latex,
                svg: true,
                html: true
            }
            // 发送到node服务器进行解析
            documentServer(condition, this.editorSetting.nodeURL || process.env.VUE_APP_REMOTE_API).then(res => {
                var editor = this.getActiveEditor();
                if (res.error_code === 200 && res.data) {
                    // debugger
                    var id = this.graphNode && this.graphNode.dataset.id ? this.graphNode.dataset.id : $global.guid();
                    var pageContainer = editor.getBody().querySelector('.page-container');
                    // let mathml = $global.htmlEncodeByRegExp(res.data.mml);
                    var width = Math.floor(parseFloat(res.data.width) * 8.01);
                    var height = Math.floor(parseFloat(res.data.height) * 8.01);
                    if (width > 400) {
                        width = 400;
                    }
                    var imgStr = `<img class="math-img" data-id="${id}" src="${res.data.png}" width="${width}" height="${height}" data-latex="${latex}" />`;
                    // 如果是段落的则定义元素样式
                    var currNode = editor.selection.getNode();
                    var td = editor.dom.getParent(currNode, 'td');
                    var isMathImg = currNode.nodeName === 'IMG' && !$global.hasClass(currNode.parentNode, 'imgs') && currNode.parentNode.nodeName !== 'FIGURE';
                    // 插入内容或替换
                    this.setContent(imgStr);
                    // 如果是在内容中插入的则直接中断
                    if (currNode.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') !== '' || isMathImg) {
                        this.graphNode = null;
                        // this.loading && this.loading.close();
                        // this.loading = null;
                        this.closeLoading();
                        return true;
                    }
                    // 重新定义属性
                    if (currNode.nodeName === "P") {
                        currNode.removeAttribute('style');
                        currNode.removeAttribute('data-mce-style');
                        currNode.className = 'imgs';
                    }

                    // 分析公式中的变量；
                    if (this.pageData.stdKind && res.data.mml && !td) {
                        let mathSection = document.createElement('div');
                        mathSection.innerHTML = res.data.mml;

                        let miELes = Array.from(mathSection.querySelectorAll('mi'));
                        let htmlStr = [];
                        htmlStr.push(`<div class="math-desc" data-id="${id}" style="text-indent: 2em;" title="此处为公式变量集合，另起一个段落请按快捷键盘Ctrl+Enter或只用工具栏插入段落">`);
                        htmlStr.push(`<p>式中：</p>`);

                        let miArr = [];
                        miELes.forEach(el => {
                            let txt = el.textContent.replace(/\s/g, '');
                            if (txt !== '' && !['cos', 'sin', 'π', 'log', 'lim', 'max', 'min', 'tan', 'csc', 'sec', 'cot', '∞', 'Δ'].includes(txt)) {
                                miArr.push(el.textContent);
                            }
                        });
                        miArr = _.uniq(miArr);
                        miArr.forEach(str => {
                            htmlStr.push(`<p>${str} —— </p>`);
                        })
                        htmlStr.push(`</div>`);
                        mathSection.remove();
                        // 检查是否已经存在公式变量的描述对象，有则删除
                        let mathDesc = pageContainer.querySelector(`div.math-desc[data-id="${id}"]`);
                        if (mathDesc) {
                            mathDesc.remove();
                        }

                        setTimeout(() => {
                            this.setContent(htmlStr.join(""));
                            this.graphNode = null;
                            this.latexCode = '';
                            // this.loading && this.loading.close();
                            // this.loading = null;
                            this.closeLoading();

                            // 公式自动编号
                            let newImage = new Image();
                            newImage.src = res.data.png;
                            newImage.onload = evt => {
                                let blockNode = editor.dom.getParent(editor.selection.getNode(), '.info-block');
                                let targetNode = blockNode.querySelector(`img[data-id="${id}"]`);
                                if (targetNode && targetNode.parentNode.nodeName !== 'FIGURE' && this.editorSetting.autoMathNum) {
                                    domUtil.toggleMathNum(editor, targetNode);
                                }
                                newImage.remove();
                            }
                        }, 350)
                    }
                    // this.loading && this.loading.close();
                    // this.loading = null;
                    this.closeLoading();
                } else {
                    // this.loading && this.loading.close();
                    // this.loading = null;
                    this.closeLoading();
                    this.$message.error('公式解析出错！');
                }
            }).catch(error => {
                console.error('tranLatex2Img catch errror', error)
                // this.loading && this.loading.close();
                // this.loading = null;
                this.closeLoading();
                this.$message.error('公式解析出错！');
            })
        },

        /**
         * @description 编辑图形
         * @param {Object} node
         */
        async editGraph(node = null) {
            var filepath = node.dataset.json;
            var condition = {
                type: 'readFile',
                filepath
            }
            // 从远程nodeServer获取数据
            var res = await documentServer(condition, this.editorSetting.nodeURL || process.env.VUE_APP_REMOTE_API);
            if (res && res.error_code === 200 && res.data) {
                let data = {
                    type: Number(node.dataset.type)
                };
                data.list = JSON.parse(res.data);
                this.changeEvent({ act:'insertGraphy', data })
                /* this.graphNode = node;
                this.graphData = {
                    id: node.dataset.id,
                    filepath,
                    content: JSON.parse(res.data)
                }
                this.editor.execCommand('openGraph', parseInt(node.dataset.type)); */
            } else {
                this.$message.error('无法获取折线数据，请联系研发人员检查接口！');
            }
        },
        /**
         * @description 关闭时清图形数据
         */
        clearGraphyImgData(){
            this.graphData = null;
            this.graphNode = null;
        },

        /**
         * @description 图形转为图片
         * @param {Object} imgData
         */
        setGraphyImg(imgData = {}) {
            this.onLoading('正在解析图片...',true);
            const bolbInfo = $global.dataURLtoFile(imgData.img);
            var graphType = imgData.type;
            console.log('imgData', imgData)
            let formData = new FormData();
            formData.append("file", bolbInfo);
            formData.append("size", bolbInfo.size);
            formData.append("filename", bolbInfo.lastModified + '.png');
            this.putImgData(formData, data => {
                if (data) {
                    var currNode = this.editor.selection.getNode();
                    var block = this.editor.dom.getParent(currNode, '.info-block');
                    // var blockWidth = pageUtil.calcBLockSpaceWidth(block);
                    var blockOffset = pageUtil.calcBLockSpaceWidth(block);
                    var imgEle = new Image();
                    imgEle.src = data.img;
                    imgEle.onload = () => {
                        let imgWidth = imgEle.width;
                        let imgHeight = imgEle.height;
                        let lv = imgHeight / imgWidth;
                        // 检查图片的宽度是否超限
                        if (imgWidth > blockOffset.width) {
                            imgWidth = parseInt(blockOffset.width * 0.95);
                            imgHeight = parseInt(imgWidth * lv * 0.95);
                        }
                        // 检查图片的高度是否超限
                        let imgMaxHeight = 800; // blockOffset.height
                        if (imgHeight > imgMaxHeight) {
                            imgHeight = parseInt(imgMaxHeight * 0.95);
                            imgWidth = parseInt(imgHeight / lv * 0.95);
                        }

                        let putData = {
                            content: imgData.data,
                            src: data.img,
                            id: data.id,
                            filepath: this.graphData ? this.graphData.filepath : undefined
                        }
                        this.submitImgData(putData).then(jsonPth => {
                            if (jsonPth) {
                                if (this.graphNode && this.graphData) {
                                    data.id = this.graphData.id;
                                    this.editor.dom.setAttribs(this.graphNode, { 'src': `${data.img}?t=${new Date().getTime()}`, 'width': imgWidth, 'height': imgHeight, 'data-json': jsonPth });
                                } else {
                                    this.editor.execCommand('mceInsertContent', false, `<p class="imgs"><img class="sam-graph" width="${imgWidth}" height="${imgHeight}" src="${data.img}" data-type="${graphType}" data-orign="${data.img}" data-id="${data.id}" data-json="${jsonPth}" /></p>`);
                                }
                            }
                            this.graphData = null;
                            this.graphNode = null;
                        });
                    }
                }
            });
        },

        /**
         * @description 提交图形数据
         * @param {Object} data
         */
        async submitImgData(data) {
            var filepath = data.filepath || 'json/' + data.id + '_graphy.json';
            var condition = {
                type: 'writeFile',
                filepath,
                content: JSON.stringify(data.content)
            }
            var res = await documentServer(condition, this.editorSetting.nodeURL || process.env.VUE_APP_REMOTE_API);
            // this.loading && this.loading.close();
            // this.loading = null;
            this.closeLoading();
            if (res.error_code !== 200) {
                this.$message.error('图形数据保存失败！');
            } else {
                return filepath;
            }
        },

        /**
         * @description 导出结构化数据
         * @param {Element}  pageContainer
         */
        exportHTML2StructData(pageContainer = null) {
            const editor = this.getActiveEditor();
            if (!editor.getBody()) {
                return null;
            }
            pageContainer = pageContainer || editor.getBody().querySelector('.page-container');
            const editorPages = pageContainer.querySelectorAll('.info-block:not(.cover):not(.catalogue)');
            var htmlContent = [];
            var itemId;
            for (let i = 0; i < editorPages.length; i++) {
                let page = editorPages[i];
                if (!itemId) {
                    itemId = page.dataset.outlineid || page.dataset.id;
                }
                htmlContent.push(page);
            }
            // 输出JSON结构数据
            return parseStructHtml.outStructData(htmlContent);
        },

        /**
         * @description IFRAME窗口消息
         * @param {Object} evt
         */
        registeMessage(evt) {
            var editor = this.getActiveEditor();
            // console.log('registeMessage=>', evt.data, editor.id);
            var data = evt.data || {};
            var flag = data.id === editor.id;
            // 接收公式数据
            if (data.source && flag) {
                this.tranLatex2Img(data.source);
                this.latexCode = undefined;
                editor.windowManager.close();
            } else if (data.ready) { // 公式编辑
                if (this.latexCode) {
                    editor.execCommand('setMath', this.latexCode);
                }
            } else if (data.graphy && flag) { // 接收图形数据
                this.setGraphyImg(data.graphy);
            } else if (data.graphyReady && this.graphData) {
                editor.execCommand('setGraph', this.graphData.content);
                // 获取云文档数据
            } else if (data.getDoc) {
                this.loadDocData(data.getDoc.docId);
            } else if (data.selectDoc) {
                editor.execCommand('selectedFile', data.selectDoc);
            }
        },

        /**
         * @description 禁用上下文菜单及审查元素
         */
        disabledContextMenu() {
            document.oncontextmenu = event => {
                event.preventDefault();
                return false;
            }
            // 打开控制台的宽或高阈值，禁用审查元素
            var threshold = 160;
            this.disThreshold = setInterval(() => {
                if (window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold) {
                    this.$message.warning('文档编辑中请勿打开调试器！');
                    this.editor.mode.set("readonly");
                } else {
                    this.editor.mode.set("design");
                }
            }, 1000);

            // 防止爬虫
            if (window.navigator.webdriver) {
                document.documentElement.outerHTML = '<html><body>Please browse the page normally!</body></html>';
                alert('禁止爬虫!')
            }

        },
        /**
         * @description 刷新编辑器
         * @params: collapse 是否将光标放置最后
         */
        refreshEditor(collapse=false, editorSetting) {
            if (editorSetting) {
                this.editorSetting = _.merge(this.editorSetting, editorSetting);
            }
            this.editor = this.getActiveEditor();
            if (collapse) {
                this.editor.selection.select(this.editor.getBody(), true)
                this.editor.selection.collapse(false);
            }

            this.updateCurrVm();
            return true;
        },

        /**
         * @description 自动设置焦点
         */
        autoSetFocus() {
            var editor = this.getActiveEditor();
            var currNode = editor.selection.getNode();
            if (currNode.nodeName === 'BODY' || $global.hasClass('currNode', 'page-container')) {
                return false;
            } else {
                editor.selection.select(currNode, true);
                editor.selection.collapse(false);
            }
        },

        /**
         * @description 销毁编辑器及事件
         */
        destroy() {
            // var editor = window.tinyMCE.activeEditor;
            // var editor = _.find(window.tinyMCE.editors, { id: this.editorId });
            if (this.editor) {
                // 注销嵌套的IFRAME通信
                window.removeEventListener('message', this.registeMessage);
                this.editor.destroy();
                this.editor = null;
                // 注销BUS
                // editorBus.destroy();
                // 清除草稿箱定时器
                if (this.intervalDraft) {
                    clearInterval(this.intervalDraft);
                    this.intervalDraft = null;
                }
                // socket销毁
                if (this.timelockHandler) {
                    clearInterval(this.timelockHandler);
                    this.timelockHandler = null;
                    this.socketClass.closeSocket(true);
                }
                if (this.timeSaveHandler) {
                    clearInterval(this.timeSaveHandler);
                    this.timeSaveHandler = null;
                }

                if (this.intervalEditor) {
                    clearInterval(this.intervalEditor);
                    this.intervalEditor = null;
                }
                this.$emit('change', { act: 'destroy' });
                console.log("destroy", this.editor);
            }
        },

        setEditorListener() {
            window.addEventListener('message', this.registeMessage, false);
            if (!this.editorSetting.readonly && !this.editorSetting.admin) {
                this.disabledContextMenu();
            }
        },
        /**
         * @description 获取模板数据
         */
        async getContentTemplateList() {
            var res = await listContentTemplate({}, this.editorSetting.editorURL || process.env.VUE_APP_EDITOR_URL);
            if (res.code === 200) {
                this.listTemplate = res.rows.map(item => {
                    item = _.omit(item, ['createTime', 'createUser', 'delFlag', 'deleteTime', 'deleteUser', 'isAsc', 'orderByColumn', 'pageNum', 'pageSize', 'params', 'searchValue', 'searchValueArray', 'updateTime', 'updateUser']);
                    return item;
                });
            }
            this.loadedCfg = true;
        },
    },
    mounted() {
        if (!this.editorSetting.readonly && !this.editorSetting.setTemplate && !this.editorSetting.parseStruct && !this.editorSetting.emptyTemplate) {
            var docFileList = $global.getStroage('docFileList');
            if (docFileList) {
                this.docFileList = docFileList;
            }
            this.regBusEvent();
        }
    },
    created() {
        // 获取模板数据
        if (!this.editorSetting.parseTable && !this.editorSetting.parseStruct && !this.editorSetting.emptyTemplate) {
            this.getContentTemplateList();
        } else {
            this.loadedCfg = true;
        }
    },
    beforeDestroy() {
        this.destroy();
    }
}
