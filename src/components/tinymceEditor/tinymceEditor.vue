<template>
    <div class="tinymce-editor-container" :id="`tinymce-editor-container-${editorId}`">
        <!-- 左侧导航栏  && pageData.stdKind-->
        <div class="slot-component" :style="slotStyle" v-if="!readonlyMode">
            <template v-show="loaded">
                <!-- ICON导航菜单 -->
                <ul class="nav" v-if="!editorSetting.reader && !editorSetting.readonly">
                    <li v-for="(item, idx) in navMenu" :key="idx" :title="item.label" :class="{'active': toggleSlot && activeTab===item.act}" v-show="showNavMen(item)" @click.stop.prevent="handleTabClick(item)">
                        <i :class="item.icon" />
                    </li>
                </ul>
                <div class="content">
                    <!-- 页面缩略图 -->
                    <div class="pages-content" v-if="activeTab==='pages'">
                        <ul class="imgs">
                            <li v-for="(item, idx) in imgdataList" :key="idx" :class="{'disabled': item.disabled, 'active':currPageIndex===idx }" @click.stop.prevent="moveTopage(idx)">
                                <img :src="item.src" :class="{'landscape': item.landscape}" />
                            </li>
                        </ul>
                        <span class="refresh-icon" title="刷新页面缩略图" @click.stop.prevent="genratorPageImg(null)">
                            <i :class="genratorIng ? 'el-icon-loading' : 'el-icon-refresh'" />
                        </span>
                        <span class="loading-page" v-if="genratorIng">正在生成缩略图...</span>
                    </div>
                    <!-- 草稿箱 -->
                    <div class="draft-content" v-else-if="activeTab==='draft'">
                        <h3>
                            <span><i class="iconfont icon-checkbox-unchecked" :class="{'icon-Check': checkedDraftAll }" @click.stop.prevent="checkedAllDraft" /> 草稿箱</span>
                            <span>
                                <el-button size="small" type="text" icon="el-icon-delete" title="删除草稿" @click.stop.prevent="removeDraftData">删除</el-button>
                            </span>
                        </h3>
                        <ul class="draft-list">
                            <li v-for="(item, idx) in draftList" :key="idx" :title="getBytes(item.bytes)">
                                <div>
                                    <i class="iconfont icon-checkbox-unchecked" :class="{'icon-Check': draftChkeckeds.includes(item.dateTime) }" @click.stop.prevent="checkedDraftItem(item)" />
                                    <span class="index">{{formatTime(item.dateTime)}}</span>
                                </div>
                                <div>
                                    <el-button size="small" type="text" icon="el-icon-refresh-left" title="恢复草稿" @click.stop.prevent="getDraftData(item.id, item.dateTime)" />
                                </div>
                                <!-- <span class="bytes">{{getBytes(item.bytes)}}</span> -->
                            </li>
                        </ul>
                    </div>
                    <!-- 导出的文档列表 -->
                    <div class="file-content" v-else-if="activeTab==='files'">
                        <h3>最近导出的文档</h3>
                        <ul class="file-list">
                            <li v-for="(item, idx) in docFileList" :key="idx">
                                <div class="title">
                                    <i :class="item.ext==='pdf' ? 'iconfont icon-pdf1' : 'iconfont icon-Word'" />
                                    <span>{{item.label}}</span>
                                </div>
                                <div class="desc">
                                    <span>{{formatTime(item.createTime)}}</span>
                                    <div class="btns">
                                        <el-button type="text" size="mini" icon="iconfont icon-download" @click.stop.prevent="downloadDocFile(item)" />
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <!-- 大纲 -->
                    <template v-else-if="activeTab==='outline'">
                        <outline v-if="!editorSetting.normal"
                            :ref="`outline-${editorId}`"
                            :allLevel="setAllLevel"
                            :isPrivate="editorSetting.private||false"
                            :menus="editorSetting.outlineMenus"
                            :author="editorSetting.author"
                            :lockedOutline="lockedOutline"
                            :merged="merged"
                            :draggable="editorSetting.draggableOutline||false"
                            :fixed="editorSetting.fixed||[]"
                            :data="outlineData"
                            :isStandard="editorSetting.isStandard"
                            :stdKind="pageData?.stdKind"
                            :update="setOutlineUpdate"
                            @change="changeOutline" />
                        <outlineNormal v-else
                            :ref="`outline-${editorId}`"
                            :allLevel="setAllLevel"
                            :menus="editorSetting.outlineMenus"
                            :draggable="editorSetting.draggableOutline||false"
                            :fixed="editorSetting.fixed||[]"
                            :data="outlineData"
                            :update="setOutlineUpdate"
                            @change="changeOutline" />
                    </template>
                </div>
                <div v-if="!readonlyMode" class="collapse" @click.stop.prevent="collapseOutline"><i :class="toggleSlot ? 'el-icon-arrow-left' : 'el-icon-arrow-right'" /></div>
            </template>
        </div>
        <!-- LOGO图标 -->
        <template v-if="editorSetting.menuBar">
            <div class="tinymce-logo" :style="logoStyle"></div>
			<div v-if="!editorSetting.hideVersion" class="tinymce-version">
				<slot name="version">
					版本：{{editorVersion}}
				</slot>
			</div>
        </template>
        <!-- 编辑器主体 v-bind="$attrs" -->
        <editor v-if="loadedCfg" :id="`tinymce-editor-${editorId}`" :name="`tinymce-editor-${editorId}`" :ref="`tinymce-editor-${editorId}`" v-on="$listeners" :init="initTimymce" :disabled="$attrs.disabled" api-Key="31e0a3b4-e777-41a6-adbb-7c65cff70631" />
        <!-- 弹窗组件 v-el-drag-dialog   -->
        <el-dialog
            append-to-body
            custom-class="sam-editor-dialog"
            top="5vh"
            :title="dialogData.title"
            :data-cmp="cmpName"
            :visible.sync="dialogData.visible"
            :width="dialogData.width"
            :fullscreen="dialogData.fullscreen"
            :close-on-click-modal="false"
            :class="{'fullscreen':dialogData.fullscreen}">
            <div class="cmp-content" :style="{'height':dialogData.height||'auto'}">
                <component
                    v-if="slotCmp"
                    ref="slotCmp"
                    :is="slotCmp"
                    v-bind="$attrs"
                    v-on="$listeners"
                    :data="dialogData"
                    :author="editorSetting.author"
                    :setting="editorSetting"
                    :keyword="searchText"
                    @change="changeCmpData"
                    :visible="dialogData.visible" />
            </div>
            <div slot="footer">
                <el-button size="small" @click="closeDialog">取 消</el-button>
                <el-button size="small" type="primary" @click="submitDialogValue">确 定</el-button>
            </div>
        </el-dialog>
        <!-- 缩放组件 -->
        <div class="zoom-side" v-if="editorSetting.zoomIn">
            <span>{{zoomValue}}%</span>
            <el-slider v-model="zoomValue" :min="20" :max="200" :step="5" :format-tooltip="formatTooltip" @input="changeZoom" />
        </div>
        <!-- tooltip工具条 :style="toolStyle" -->
        <div class="tool-bar" :id="`tool-bar-${editorId}`" :style="toolStyle" v-if="!editorSetting.private" v-html="tooltipBarHtml">
            <!-- <span>修改</span> -->
        </div>
        <div v-show="topDistance>500 && !editorSetting.hideToTop" class="to-top" title="回到顶部" @click.stop.prevent="moveTop">
            <i class="iconfont icon-Upward" />
        </div>

		<div class="editor-loading" :id="`loading-${editorId}`">
			<p>
				<i class="el-icon-loading" />
				<span class="text"></span>
			</p>
		</div>
    </div>
</template>

<script>
    const editorBaseUrl = process.env.VUE_APP_EDITOR_PATH + '/tinymce';
    window.tinyMCE.pluginURL = process.env.VUE_APP_PLUGIN_PATH;
    window.tinyMCE.baseURL = editorBaseUrl;
    // eslint-disable-next-line
    import $bus from '@/utils/bus';
    // 全局方法
    import $global from '@/utils/global';
    // 核心主程序
    import tinymce from "tinymce/tinymce.min";
    // 全屏组件
    import screenfull from 'screenfull';
    // 编辑器皮肤样式
    import "@/libs/tinymce/themes/silver/theme.min.js";
    // 插件集合
    import '@/libs/tinymce/tinymcePlugins';
    // 基础配置参数等
    import { initConfig, normalConfig, fontFamily } from './configs/editorCfg';
    // 附录编号
    // import { catalogueTypes, consoleText } from './configs/editorOptions';
    // 编辑器事件模块
    import tinymceEvent from './modules/tinymceEvent';
    // 编辑器扩展模块
    import extendMixin from "./extendMixin";
    // 大纲处理模块
    import outlineUtil from "./utils/outlineUtil";
    // 页面处理模块
    import pageUtil from "./utils/pageUtil";
    // 元素处理模块
    import domUtil from "./utils/domUtil";
    // 表格模块
    import tableUtil from './utils/tableUtil';
    // 层级项函数
    import levelUtil from './utils/levelUtil';
    // 编辑器指令模块
    import editorCommand from "./modules/editorCommand";
    // 文档比较模块
    import { getHighLightDiff } from "./utils/diff";
    // 复制粘贴模块
    import pasteUtil from "./utils/pasteUtil";
    // 弹窗拖拽
    import elDragDialog from '@/directive/el-drag-dialog';
    // 附属组件
    import * as slotComponent from "@/slot/index.js";
    // 扩展工具条
    import extendTool from "./utils/extendTool.js";
    // markdown转换
    import MarkdownIt from 'markdown-it';

    // 编辑器菜单
    const editorMenu = {
        file: { title: 'File', items: 'newStandard openFile save-btn saveAs restoredraft | preview | print | close-btn' },
        edit: { title: 'Edit', items: 'undo redo | cut copy paste | searchreplace' },
        view: { title: 'View', items: ' | preview fullscreen' },
        insert: { title: 'Insert', items: 'image inserttable | charmap hr | math linecode-btn textnode-btn' },
        help: { title: 'Help', items: 'help | bzt-ver' },
    };
    // 内容比较
    // const editorMenuBar = 'file edit insert format view table help';
    // 编辑器版本号
    import packageConfig from "../../../package.json";
    const editorVersion = packageConfig.publishMode + " " + packageConfig.version;

    export default {
        name: 'tinymce-editor',
        directives: { elDragDialog },
        mixins: [extendMixin],
        components: {
            Editor: () => import('@tinymce/tinymce-vue'),
            outline: () => import('@/components/outline/outline.vue'),
            outlineNormal: () => import('@/components/outline/outline_normal.vue'),
        },
        props: {
            data: Object
        },
        computed: {
            // activeTab==='draft'
            checkUseDraft() {
                if (!this.editorSetting.draftTimes || (this.editorSetting.author.lockedAll && (!this.editorSetting.author.isAdmin || !this.editorSetting.author.enableDraft))) {
                    return false;
                }
                return true;
            },
            // 显示大纲所有层级
            setAllLevel() {
                return this.editorSetting.author && this.editorSetting.author.assignOutline;
            },
            // 编辑器版的本
            editorVersion() {
                return editorVersion;
            },
            // 实时更新大纲结构
            setOutlineUpdate() {
                // 如果是解析器模式
                if (this.editorSetting.disabledOutline) {
                    return false;
                }
                return true;
            },
            // 定义插槽组件
            slotCmp() {
                // console.log('this.cmpName====>', this.cmpName)
                if (this.cmpName) {
                    return slotComponent[this.cmpName];
                }
                return null;
            },
            // 提示工具条坐标
            toolStyle() {
                return {
                    'left': this.toolPosition.x + 'px',
                    'top': this.toolPosition.y + 'px'
                }
            },
            // LOGO标志样式
            logoStyle() {
                return {
                    'display': this.editorSetting.menuBar && this.loaded ? 'block' : 'none',
                    'background-image': `url(${this.editorSetting.logo||initConfig.logo})`,
                    'width': (this.editorSetting.logoWidth || 100) + 'px'
                }
            },
            // 文档页面配置
            pageConfig() {
                var cfg = $global.getTinymceConfig();
                return cfg;
            },
            // 只读模式
            readonlyMode() {
                if (this.editorSetting.showOutline) {
                    return false;
                }
                return this.editorSetting.readonly || this.editorSetting.reader || this.editorSetting.hideSideBar;
            },
            // 右侧栏插槽展开宽度
            slotStyle() {
                return {
                    'width': this.toggleSlot ? '350px' : (this.editorSetting.showOutline ? '0' : '40px')
                }
            },
            // 悬浮工具条按钮内容
            tooltipBarHtml() {
                var arr = [`<span>修改</span>`];
                if (this.editorSetting.tooltips && this.editorSetting.tooltips.length) {
                    arr = [];
                    this.editorSetting.tooltips.forEach(item => {
                        arr.push(`<span data-act="${item.act}">${item.label}</span>`);
                    })
                }
                return arr.join("");
            },
            initTimymce() {
                var baseURL = this.editorSetting.nodeURL || process.env.VUE_APP_REMOTE_API;
                // debugger
                // 基础配置文件
                var cfg = this.editorSetting.isStandard ? _.cloneDeep(initConfig) : _.cloneDeep(normalConfig);  // _.cloneDeep(initConfig);//
                var styleCls = this.editorSetting.style || "commons";
                cfg.skin_url = baseURL + '/tinymce/skins/ui/oxide';
                // 语言
                if (this.editorSetting.language) {
                    cfg.language = this.editorSetting.language;
                }
                if (this.editorSetting.normal) {
                    cfg.normal = true;
                }
                return {
                    ...cfg,
                    version: editorVersion,
                    // 绑定DOM选择器
                    selector: `tinymce-editor-${this.editorId}`,
                    auto_focus: true, // `tinymce-editor-${this.editorId}`
                    // 编辑器基础文件路径地址
                    document_base_url: baseURL,
                    // 相对或绝对路径样式表
                    content_css: [baseURL + '/tinymce/skins/content/default/content.css', baseURL + `/tinymce/skins/${styleCls}.css`, baseURL + `/tinymce/skins/highlight.min.css`],
                    menu: this.editorSetting.menu || editorMenu,
                    menubar: this.editorSetting.menuBar,
                    font_formats: this.editorSetting.font_formats || fontFamily,
                    toolbar1: !this.editorSetting.readonly ? this.editorSetting.toolbar1 : '',
                    toolbar2: !this.editorSetting.readonly ? this.editorSetting.toolbar2 : '',
                    bullets: this.editorSetting.bullets,
                    contextmenu: this.editorSetting.contextmenu || 'undo redo | quoteButton term-btn | table | image | levelNum queue quickComment quickquota quickTerm | blockPage',
                    statusbar: false,
                    quickbars_selection_toolbar: this.editorSetting.quickbars || 'bold italic underline strikethrough superscript subscript',
                    // paste_as_text: true,                     // 复制内容转为纯文本
                    paste_merge_formats: false, // 合并格式
                    paste_remove_styles_if_webkit: false, // 移除样式
                    aiAssistant: this.editorSetting.aiAssistant, // 智能工具条
                    /* audio_template_callback: function(data) {
                       return '<audio controls>' + '\n<source src="' + data.source + '"' + (data.sourcemime ? ' type="' + data.sourcemime + '"' : '') + ' />\n' + (data.altsource ? '<source src="' + data.altsource + '"' + (data.altsourcemime ? ' type="' + data.altsourcemime + '"' : '') + ' />\n' : '') + '</audio>';
                    }, */
                    // 编辑器初始化完成后回调
                    init_instance_callback: editor => {
                        window.tinyMCE.setActive(editor);
                        // 须加载完模板数据
                        if (!this.listTemplate.length) {
                            this.getListTemplateData();
                        }
                        // 获取浏览器类型
                        let browser = window.tinyMCE.Env.browser;
                        // console.log(browser, editor.browser)
                        /*
                        if (browser.isIE() || browser.isOpera()) {
                            this.$notify({
                                title: '警告',
                                dangerouslyUseHTMLString: true,
                                message: '非WebKit内核浏览器，可能会引起编写错误！<br/>建议使用谷歌（chrome）浏览器',
                                type: 'warning'
                            });
                        }
                        */
                       // 检测浏览器及版本
                       let isBrowserPrompt = $global.getStroage('browserPrompt', true);
                       let browserUrl = this.editorSetting.browser ? this.editorSetting.browser?.url || 'https://www.baidu.com/s?wd=chrome' : 'https://www.baidu.com/s?wd=chrome';
                       let browserVersion = this.editorSetting.browser ? this.editorSetting.browser?.version || 100 : 100;
                        if (browser.version.major < browserVersion && !isBrowserPrompt) {
                            let promptMsg = this.editorSetting.browser ? this.editorSetting.browser.prompt : '非WebKit内核浏览器，可能会引起编写错误！<br/>建议使用谷歌（chrome）浏览器！<br/>版本在 ' + browserVersion + ' 以上，点击<a href="'+browserUrl+'" target="_blank" style="text-decoration: underline;">下载安装</a>';
                            if (!this.editorSetting.browser || !this.editorSetting.browser?.nextPrompt) {
                                $global.setStroage('browserPrompt', 1, true);
                            }
                            this.$confirm(promptMsg, this.editorSetting.browser ? this.editorSetting.browser.title : '浏览器兼容性提示', {
                                dangerouslyUseHTMLString: true,
                                confirmButtonText: this.editorSetting.browser ? this.editorSetting.browser.confirmButtonText : '立即下载安装',
                                cancelButtonText: this.editorSetting.browser ? this.editorSetting.browser.cancelButtonText : '暂不安装',
                                type: 'warning'
                            }).then(() => {
                                $global.openNewWindow(browserUrl);
                            }).catch(() => {});
                        }
                        // 多人协同模式下，须设置为无限扩展页面
                        if (this.editorSetting.author && this.editorSetting.author.lockedAll && !this.editorSetting.page.expand) {
                            this.$confirm('多人协同编纂模式下，须设置为无限扩展页面:<br/>page.expand=true', '配置错误警告', {
                                dangerouslyUseHTMLString: true
                            });
                        }
                        pasteUtil.editor = this.editor;
                        pasteUtil.vm = this;
                        extendTool.editor = this.editor;
                        extendTool.vm = this;

                        if (this.editorSetting.pageZoom) {
                            this.setPageZoom(this.editorSetting.pageZoom)
                        }

                        setTimeout(() => {
                            this.loaded = this.initialized(editor);
                            // 输出编辑器信息
                            if (!this.editorSetting.parseTable && !this.editorSetting.parseStruct) {
                                console.group('%c 编辑器加载完毕! ', 'background: #3770e5; color: #FFFFFF');
                                // console.info('%c' + consoleText + '@sam.shen 2021-09-18', 'color:#3770e5')
                                console.info('%cversion:' + editorVersion + ' by ©bzton.com', 'color:#3770e5');
                                console.info('%cauthor: sam.shen', 'color:#3770e5');
                                console.info('%clast update: 2024-08-04', 'color:#3770e5');
                                console.groupEnd();
                            }
                            // 上报事件,编辑器初始化完成
                            this.$emit('change', { act: 'initialized', data:editor });
                        }, 777);
                    },
                    // 文件选择后处理 meta.filetype 文件类型
                    file_picker_callback: (callback, value, meta) => {
                        var vm = this;
                        var input = document.querySelector(`input[data-id="${this.editorId}"]`) || document.createElement('input');
                        input.dataset.id = this.editorId;
                        input.setAttribute('type', 'file');
                        // input.setAttribute('accept', 'image/*');
                        input.onchange = function() {
                            var file = this.files[0];
                            var fileExt = $global.getExt(file.name);
                            var reader = new FileReader();
                            reader.onload = function() {
                                // source:媒体文件
                                if (['htmlUrl','wordUrl'].includes(meta.fieldname)) {
                                    callback(reader.result);
                                } else {
                                    var id = 'blobid' + (new Date()).getTime();
                                    var blobCache = tinymce.activeEditor.editorUpload.blobCache;
                                    var base64 = reader.result.split(',')[1];
                                    var blobInfo = blobCache.create(id, file, base64);
                                    blobCache.add(blobInfo);
                                    callback(blobInfo.blobUri(), { title: file.name, invalid: false });
                                }
                            }

                            if (['htmlUrl','wordUrl'].includes(meta.fieldname)) {
                                vm.uploadFile = file;
                                callback(file.name);
                            } else if (meta.filetype === 'image' && !['png', 'jpg', 'jpeg'].includes(fileExt.toLowerCase())) {
                                vm.$message.error("请选择png、jpg、jpeg图片文件！");
                                callback(file.name, { invalid: true });
                            } else if (meta.filetype === 'media') {
                                if (fileExt.toLowerCase() !== 'mp4') {
                                    vm.$message.error("请选择mp4文件！");
                                    callback(file.name, { invalid: true });
                                } else {
                                    // 上传视频文件
                                    let formData = new FormData();
                                    formData.append('file', file);
                                    formData.append('size', file.size);
                                    formData.append('filename', file.name);
                                    vm.putImgData(formData, res => {
                                        if (res) {
                                            callback(res.img);
                                        } else {
                                            callback(file.name, { invalid: true });
                                        }
                                    });
                                }
                            } else {
                                reader.readAsDataURL(file, "uft-8");
                            }
                        }
                        input.click();
                    },
                    // 图片上传
                    images_upload_handler: (blobInfo, success, failure) => {
                        const formData = new FormData();
                        const file = blobInfo.blob();
                        formData.append('file', blobInfo.blob());
                        formData.append('size', file.size);
                        formData.append('filename', blobInfo.filename());
                        this.putImgData(formData, res => {
                            if (res) {
                                success(res.img);
                            }
                        });
                    },
                    // 内容粘贴后处理
                    paste_preprocess: async (pluginApi, data) => {
                        // 从外部粘贴的 data.wordContent:true
                        var editor = this.getActiveEditor();
                        var node = editor.selection.getNode();
                        // const clipboardText = await navigator.clipboard.readText();
                        // 如果粘贴的为markdown内容 clipboardText &&  || $global.isMarkdown(clipboardText)
                        if ($global.isMarkdown(data.content)) {
                            this.putMarkdown();
                            data.content = '';
                            return;
                        }

                        if (!data.internal) {
                            if ((!data.wordContent && !/^\<img/.test(data.content)) || $global.hasClass(node, 'stdName') || $global.hasClass(node, 'stdNameEn') || $global.hasClass(node, 'stdTitle')) {
                                // 不包含表格
                                if(!data.content.includes('<table')) {
                                    data.content = pasteUtil.clearHtmlTag(data.content); // data.content.replace(/\n|\s/g,"")
                                }
                            }
                            data.content = pasteUtil.parseContent(data.content.replace(/[\u200B-\u200D\uFEFF]/g, ''), data.wordContent);
                        } else  {
                            data.content = pasteUtil.parseHtml(data.content.replace(/[\u200B-\u200D\uFEFF]/g, ''));
                            // data.content = data.content.replace(/<[^>]+>/g, "").replace(/\n/g,'<br/>'); // 清除所有HTML标签
                        }
                    },
                    // 内容粘贴完成后
                    paste_postprocess: (pluginApi, data) => {
                        // console.log('paste_postprocess=>', data);
                    },
                    // 额外设置
                    setup: editor => {
                        // 额外的扩展工具条
                        if (this.editorSetting.extendToolbar && this.editorSetting.extendToolbar.length) {
                            extendTool.initTool(this, editor, this.editorSetting.extendToolbar)
                        }
                        // 编辑器事件模块
                        tinymceEvent.init(editor, this);
                    },
                }
            }
        },

        data() {
            return {
                editorId: $global.guid(),
                editorSetting: {
                    icon: require(`@/assets/images/logo.png`)
                },
                dialogData: {}, // 附属组件弹窗和数据
            }
        },
        // PROPS数据，编辑器全部参数设置
        watch: {
            data: {
                handler(data) {
                    this.editorSetting = _.cloneDeep(data);
                    if (this.editorSetting.navMenu) {
                        this.navMenu = this.editorSetting.navMenu;
                    }
                    if (!this.checkUseDraft) {
                        var draftIndex = _.findIndex(this.navMenu, { act:'draft' });
                        if (!!~draftIndex) {
                            this.navMenu.splice(draftIndex, 1);
                        }
                    }
                    if (data.editorId) {
                        this.editorId = data.editorId;
                    }
                    // console.log('this.editorId===>', this.editorId)
                },
                immediate: true,
                deep: true
            },
        },

        methods: {
            // 置入markdown 文本内容
            async putMarkdown(code='', docName=undefined) {
                const editor = this.getActiveEditor();
                if (navigator.clipboard) {
                    const clipboardText = await  navigator.clipboard.readText();
                    if (clipboardText && !code) {
                        code = clipboardText;
                    }
                }
                // debugger
                const md = new MarkdownIt();
                let content = md.render(code);
                if (docName) { // 直接读取md文件后置入
                    const pageContainer = editor.getBody().querySelector('.page-container');
                    pageContainer.dataset.title = docName;
                    const block = pageContainer.firstChild;
                    block.innerHTML = content;
                } else {
                    this.insertContent({ htmlContent:content });
                }
            },
            // 切换编辑器语言
            changeLanguage(language) {
                this.$emit('change', { act:'setlanguage', language});
                // const editor = this.getActiveEditor();
                // console.log('setLanguage===>', language);
                // const htmlContent = editor.getContent();
                // editor.settings.language = language;
                // this.$set(this.editorSetting, 'language', language);
                // tinymce.remove();
                /* editor.settings.language = language;
                editor.setContent(editor.getContent()); */
            },

            moveTop() {
                this.moveTopage(0);
            },
            /**
             * @description 页面缩放
             */
            changeZoom() {
                var val = this.zoomValue / 100;
                pageUtil.updateVm(this);
                return pageUtil.zoomTransform(val);
            },
            setPageZoom(val = 100) {
                this.zoomValue = val;
                return this.changeZoom();
            },

            formatTooltip(val) {
                return val + '%';
            },
            getEditorConfig() {
                return this.editorSetting;
            },

            /**
             * @description 显示隐藏左侧导航栏
             * @param {Object} item
             */
            showNavMen(item) {
                var bool = true;
                if (item.act === 'draft' && !this.editorSetting.draftTimes) {
                    bool = false;
                } else if (item.act === 'outline' && (!this.pageData || !this.pageData.stdKind)) {
                    bool = false;
                }
                return bool;
            },

            /**
             * @description 打开弹窗加载附属组件
             * @param {Object} obj
             */
            openDialogComp(obj) {
                this.editor = this.getActiveEditor();
                this.cmpName = obj.cmpName;
                this.dialogData = obj;
            },
            /**
             * @description 附属组件值改变
             * @param {Object} obj
             */
            changeCmpData(data) {
                // console.log('changeCmpData=>', data)
                if (data.act && data.act === 'fullscreen') {
                    this.$set(this.dialogData, 'fullscreen', data.value);
                    return false;
                }
                this.dialogData.value = data;
                if (['quoteStandard', 'quoteTerm'].includes(this.dialogData.cmpName)) {
                    this.submitDialogValue();
                }
            },

            updateCurrVm() {
                // console.log('updateCurrVm==>', this)
                if (tableUtil && typeof tableUtil.updateVm === 'function') {
                    tableUtil.updateVm(this);
                }
                if (levelUtil && typeof levelUtil.updateVm === 'function') {
                    levelUtil.updateVm(this);
                }

                if (editorCommand && typeof editorCommand.updateVm === 'function') {
                    editorCommand.updateVm(this);
                }
                if (tinymceEvent && typeof tinymceEvent.updateVm === 'function') {
                    tinymceEvent.updateVm(this);
                }
                if (extendTool && typeof extendTool.updateVm === 'function') {
                    extendTool.updateVm(this);
                }
                if (pageUtil && typeof pageUtil.updateVm === 'function') {
                    pageUtil.updateVm(this);
                }
                if (domUtil && typeof domUtil.updateVm === 'function') {
                    domUtil.updateVm(this);
                }
                return true;
            },

            /**
             * @description 关闭弹窗前销毁组件
             */
            closeDialog() {
                if (this.cmpName === 'quoteClause') {
                    this.$refs.slotCmp.clearData();
                    delete this.editorSetting.reader;
                    // this.updateCurrVm();
                }
                this.dialogData = {
                    visible: false,
                    title: ''
                };
                this.cmpName = undefined;
                this.$forceUpdate();
                setTimeout(() => {
                    this.refreshEditor();
                }, 250)
            },

            /**
             * @description 附属组件值提交
             */
            submitDialogValue() {
                // console.log("submitDialogValue", this.dialogData);
                // 如果是图形处理的组件
                if (['lineCode','textBox'].includes(this.dialogData.cmpName)) {
                    this.$refs.slotCmp.createImage().then(imageData => {
                        console.log('imageData', imageData)
                        imageData.type = this.dialogData.type;
                        this.setGraphyImg(imageData);
                        this.$set(this.dialogData, 'visible', false);
                    })
                    return;
                }
                // debugger
                var node = this.dialogData.node;
                // 批注
                if (this.dialogData.cmpName === 'quoteComment') {
                    var commentData = this.$refs.slotCmp.getValue();
                    this.toggleCommnet(commentData);
                } else if (this.dialogData.cmpName === 'icsNumber') {
                    this.toggleIcsCcs(this.dialogData.value);
                    // 标准编号
                } else if (this.dialogData.cmpName === 'stdNumber') {
                    var reg =
                        /[\u4E00-\u9FA5\uF900-\uFA2D]|[\u3002|\uff1f|\uff01|\uff0c|\u3001|\uff1b|\uff1a|\u201c|\u201d|\u2018|\u2019|\uff08|\uff09|\u300a|\u300b|\u3008|\u3009|\u3010|\u3011|\u300e|\u300f|\u300c|\u300d|\ufe43|\ufe44|\u3014|\u3015|\u2026|\u2014|\uff5e|\ufe4f|\uffe5]/;
                    if (reg.test(this.dialogData.value.stdNo.replace(/\—/g, '')) || !this.dialogData.value.stdSign) {
                        this.$message.error('标准编号格式错误，请检查！');
                        return false;
                    }
                    if (this.dialogData.value.origStdNo) {
                        var origList = this.dialogData.value.origStdNo.split("、");
                        for (let i = 0; i < origList.length; i++) {
                            let origStr = origList[i];
                            if (reg.test(origStr.replace(/\—/g, ''))) {
                                this.$message.error('标准代替编号格式错误，请检查！');
                                // break;
                                return false;
                            }
                        }
                    }
                    this.toggleStdNo(this.dialogData.value);
                } else if (this.dialogData.cmpName === 'stdDms') {
                    // 行业图标
                    if (this.pageData.stdKind === 1200) {
                        var imgUrl = process.env.VUE_APP_FILE_URL + 'images/industry/' + this.dialogData.value.key + '.png';
                        node.innerHTML = `<img height="${this.dialogData.value.height || 55}" src="${imgUrl}" />`;
                        node.dataset.code = this.dialogData.value.key;
                        this.pageData.stdTitle = this.dialogData.value.label;
                    } else if (this.pageData.stdKind === 1500) {
                        this.pageData.stdTitle = this.dialogData.value.desc + '团体'; 
                        node.textContent = this.dialogData.value.key;
                    } else {
                        node.textContent = this.dialogData.value.key;
                    }

                    var stdSignStr = 'T/' + this.dialogData.value.key;
                    this.pageData.stdSign = stdSignStr;
                    // this.pageData.stdTitle = this.dialogData.value.desc + '团体标准';
                    // this.pageData.stdTitle = this.dialogData.value.label + stdSignText;  // 行业标准
                    this.pageData.releaseDepartment = this.dialogData.value.desc.replace(/(\,|\，)/g, '\n');
                    domUtil.dealstdSign(null, this.pageData);
                    // 文档版次
                } else if (this.dialogData.cmpName === 'docEdition') {
                    node.textContent = "（" + this.dialogData.value + "）";
                    // 引用标准
                } else if (this.dialogData.cmpName === 'quoteStandard') {
                    this.setContent(this.dialogData.value, false);
                    // 引用条款
                } else if (this.dialogData.cmpName === 'quoteClause') {
                    this.$forceUpdate();
                    this.refreshEditor();
                    if (this.editorSetting.quoteClauseByContent) {
                        this.appendQuoteClause(node, this.dialogData.value);
                    } else {
                        this.setContent(this.dialogData.value, false);
                    }
                    // 引用术语
                } else if (this.dialogData.cmpName === 'quoteTerm') {
                    this.insertContent({ htmlContent: this.dialogData.value, term: true });
                    // TCS\起草单位\专家
                } else if (['draftUtil', 'draftPersons', 'selectTcs'].includes(this.dialogData.cmpName)) {
                    // this.insertContent({ htmlContent:this.dialogData.value });
                    this.dialogData.node.innerHTML = this.dialogData.value || "";
                } else if (['scanDoc', 'knowledgeGraph'].includes(this.dialogData.cmpName)) {
                    // this.dialogData.visible = false;
                    this.closeDialog();
                    return false;
                } else {
                    node.textContent = this.dialogData.value;
                    // 与国际标准一致性程度的标识
                    if (this.dialogData.cmpName === 'consistentSign') {
                        let err = '';
                        let textSplit = node.textContent.split(",");
                        if (textSplit[0].replace(/\s/g) === '') {
                            err = '请输入内容！';
                        } else if (node.textContent.match(/\,MOD|\,IDT|\,NEQ/ig) === null) {
                            err = '请选择等效性类别！';
                        }
                        if (err) {
                            this.$message.error(err);
                            return false;
                        }
                        domUtil.dealConsistentSign(null, this.dialogData.node);
                    }
                }
                this.closeDialog();
                // this.dialogData.visible = false;
            },
            // 插入引用的条款
            appendQuoteClause(currNode, content) {
                const section = document.createElement('div');
                section.innerHTML = content;
                const childs = Array.from(section.childNodes);
                for (let ele of childs) {
                    currNode.appendChild(ele);
                }
                section.remove();
            },
            // 汇总引用
            appendQuoteCollect(data) {
                pageUtil.updateQuoteCollect(data);
            },

            /**
             * @description 执行命令
             * @param{Object} 数据参数
             * @example { command:'importQuote',  act:'quoteClause' }
             */
            execCommand(data = {}) {
                var editor = this.getActiveEditor();
                if (data.command) {
                    editor.execCommand(data.command, data);
                    return true;
                }
                return false;
            },

            clearAllFormat() {
                var editor = this.getActiveEditor();
                editor.windowManager.confirm('将清除文档中所有定义的标签或其他样式，确定继续？', flag => {
                    if (flag) {
                        domUtil.clearAllFormat();
                    }
                });
            },

            /**
             * @description 高亮选中文本
             * @param {Object} data
             */
             highlightTextOnEdit(data = {}) {
                const editor = this.getActiveEditor();
                const body = editor.getBody();
                if (body) {
                    body.setAttribute('contenteditable', 'true');
                    data.id = data.id || $global.guid();
                    // this.foucsId()
                    var res = editor.execCommand('highlightText', data);
                    var container = data.container || body;
                    var markNode;
                    if (res && data.cls) {
                        let activeNodes = Array.from(container.querySelectorAll(`span.mce-match-marker[data-id="${data.id}"]`));
                        activeNodes.forEach(node => {
                            editor.dom.addClass(node, data.cls);
							editor.dom.removeClass(node, 'mce-match-marker');
							node.removeAttribute('data-mce-bogus');
							node.removeAttribute('data-mce-index');
							node.title = data.text;
                            markNode = node;
                        })
                    }
                    return markNode;
                }
                return null;
            },
            // 清除比对的元素
            clearCompare() {
                const editor = this.getActiveEditor();
                const body = editor.getBody();
                if (body) {
                    const container = body.querySelector('.page-container');
                    if (container) {
                        const compareEles = Array.from(container.querySelectorAll('span.source,span.target'));
                        compareEles.forEach(ele => {
                            const textNode = document.createTextNode(ele.textContent);
                            editor.dom.insertAfter(textNode, ele);
                            ele.remove();
                        })
                    }
                }
            },

            /**
             * @description 高亮选中文本,仅在阅读模式下
             * @param {Object} data
             */
            highlightText(data = {}) {
                var editor = this.getActiveEditor();
                var body = editor.getBody();
                if (body && (this.editorSetting.readonly || this.editorSetting.reader)) {
                    body.setAttribute('contenteditable', 'true');
                    let container = data.container || body;
                    data.id = data.id || $global.guid();

                    if (container.nodeName === '#text') {
                        container = editor.dom.getParent(container, 'p') || editor.dom.getParent(container, 'div');
                        data.container = container;
                    }

                    // 如果是文档进行比对的处理已经打上了标签则不重复处理；data须出入id
                    if(['source','target'].includes(data.cls) && (container.querySelector(`span[data-id="${data.id}"]`) || container.nodeName === 'TABLE')) {
                        return null;
                    }
                    var res = editor.execCommand('highlightText', data);

                    var markNode;
                    if (res && data.cls) {

                        let activeNodes = Array.from(container.querySelectorAll(`span.mce-match-marker[data-id="${data.id}"]`));
                        activeNodes.forEach(node => {
                            editor.dom.addClass(node, data.cls);
							editor.dom.removeClass(node, 'mce-match-marker');
							node.removeAttribute('data-mce-bogus');
							node.removeAttribute('data-mce-index');
							node.title = data.text;
                            markNode = node;
                        })
                    }
                    // body.setAttribute('contenteditable', 'false');
                    return markNode;
                } else {
                    this.$message.warning('编辑模式下无法操作！');
                }
                return null;
            },

            // 切换左侧栏展开或关闭
            collapseOutline() {
                this.toggleSlot = !this.toggleSlot;
            },

            // 全屏显示模式
            setFullScreen() {
                if (screenfull && screenfull.isEnabled) {
                    screenfull.toggle();
                    this.toggleSlot = false;
                }
            },
            /**
             * @description 重新加载文档
             * @param {Object} docId
             */
            reloadEditor(docId) {
                pageUtil.init(this.editor, this);
            },

            // 外部调用，重新加载大纲及数据（AI自动编写） add by sam.shen 2024-8-4
            reloadOutline() {
                tinymceEvent.resetChangeNode();
            },
            // 外部调用，内容全部插入完成 add by sam.shen 2024-8-4
            appendCompelete() {
                this.$set(this.editorSetting, 'disabledSave', false);
                this.setEditorMode();
				this.handleTabClick({act:'outline'});
				this.scrollTop({top:0});
            },

            /**
             * @description  插入索引页
             */
            addIndexPage() {
                var $outline = this.$refs[`outline-${this.editorId}`];
                if ($outline) {
                    $outline.handleSelectAdd('12', ["0", "12"], null);
                }
            },
            /**
             * @description  新增索引项
             * @param {Object} data
             */
            addIndexTagData(data = {}) {
                var pageContainer = this.editor.getBody().querySelector('.page-container');
                var indexTagPage = pageContainer.querySelectorAll('.info-block.index');
                if (!indexTagPage.length) {
                    return false;
                }
                // 处理索引项
                return pageUtil.autoSetIndexTag();
            },
            /**
             * @description  重置标准代码
             * @param {Object} data
             */
            resetStdSign(data) {
                var pageContainer = this.editor.getBody().querySelector('.page-container');
                var stdSignEle;
                var fileUrl = this.editorSetting.nodeURL + '/files/';
                switch (data.stdKind) {
                    // 地标
                    case 6:
                        // 标准代码
                        stdSignEle = pageContainer.querySelector('.cover>.icon');
                        if (stdSignEle) {
                            var imgurl = fileUrl + 'images/cover_db.png';
                            stdSignEle.innerHTML = `<img height="45" src="${imgurl}" />&nbsp;${data.reset.stdCode}`;
                        }
                        break;
                        // 行标
                    case 1200:
                        // 标准代码
                        stdSignEle = pageContainer.querySelector('.cover>.icon');
                        if (stdSignEle) {
                            var imgurl = fileUrl + 'images/industry/' + data.reset.stdCode + '.png';
                            stdSignEle.innerHTML = `<img height="55" src="${imgurl}" />`;
                        }
                        break;
                        // 团标
                    case 1500:
                        // 标准代码
                        stdSignEle = pageContainer.querySelector('.cover>.icon>.stdSign');
                        if (stdSignEle) {
                            stdSignEle.textContent = data.reset.stdCode;
                        }
                        break;
                }
                // 标准编号
                var stdNoEle = pageContainer.querySelector('.cover>.numbers .stdSign');
                if (stdNoEle) {
                    stdNoEle.textContent = data.reset.stdSign;
                }

                // 标准抬头
                var stdTitleEle = pageContainer.querySelector('.cover>h1.title');
                if (stdTitleEle) {
                    stdTitleEle.textContent = data.reset.stdTitle;
                    // 重置抬头名称字符间距
                    domUtil.changeCoverTitle(this.editor, stdTitleEle);
                }
                // 发布单位
                var utilEle = pageContainer.querySelector('.cover .main-util');
                if (utilEle) {
                    utilEle.innerHTML = `<p><span class="tag other releaseDepartment" data-tag="releaseDepartment" data-type="3">${data.reset.releaseDepartment}</span></p>`;
                }
                // 重置页眉
                this.editor.nodeChanged();
            },

            /**
             * @description  删除索引项
             * @param {Object} data
             */
            removeIndexTagData(data) {

            },

            /**
             * @description 左侧导航切换
             * @param {Object} item
             */
            handleTabClick(item) {
                var error;
                if (item.act === 'draft') {
                    if (this.editorSetting.author && this.editorSetting.author.lockedAll && !this.editorSetting.author.enableDraft) {
                        error = '未配置草稿箱的使用！';
                    } else if (this.lockedOutline.length>0) {
                        error = '当前有章节在锁定编辑状态，不可使用草稿箱！';
                    } else if (this.lockedDoc === 0 && this.editorSetting.author.lockedAll) {
                        error = '非大纲编辑模式，不可使用草稿箱！';
                    }
                }

                if (error) {
                    this.$alert(error, '错误提示', { type:'error'});
                    return;
                }

                this.activeTab = item.act;
                switch (item.act) {
                    case 'outline':
                        this.get_outline();
                        setTimeout(() => {
                            this.$refs[`outline-${this.editorId}`] && this.$refs[`outline-${this.editorId}`].backEdit(this.lockedDoc);
                        }, 750)
                        break;
                    case 'pages':
                        this.genratorPageImg();
                        break;
                    case 'draft':
                        break;
                }
                this.toggleSlot = true;
            },
            /**
             * @description 大纲数据更新事件
             * @param {Object} data
             */
            async changeOutline(data) {
                // console.log('changeOutline==>', data.act)
                switch (data.act) {
                    case 'coordination':
                        this.$set(this.editorSetting.author, 'lockedAll', data.flag);
                        this.lockDoc(data.flag ? 0 : 1, true);
                        break;
                    case 'editDoc': // 锁定或解锁章节
                        this.lockOutline(data.data, data.unlock);
                        break;
                    case 'lockDoc':
                        delete this.editorSetting.author.lockDoc;
                        this.lockDoc(data.isLock, data.forceUnlock);
                        break;
                    case 'add':
                        this.afterAddOutline(data);
                        break;
                    case 'remove':
                        this.afterRemoveOutline(data);
                        break;
                    case 'updateOutlineTitle':
                        this.updateOutlineTitle(data);
                        break;
                    case 'docattr':
                        pageUtil.updateAppendixPage(data.data);
                        this.foucsId(data.data);
                        break;
                    case 'selectItem':
                    case 'selectNode':
                        this.foucsId(data.data);
                        break;
                    case 'updateOutline':
                        this.updateChapterByoutline(data.data);
                        break;
                    case 'updateOutlineOwner': // 分配章节条目的协同作业
                        // 更新页面或章节属性
                        let updateOutlineOwner = pageUtil.updateOutlineOwner(data);
                        if (updateOutlineOwner) {
                            if (this.editorSetting.author && this.editorSetting.author.assignOutline && data.assignOutline) {
                                let outlineData = _.cloneDeep(data.items[0]);
                                // 保存大纲数据
                                let savedOutline = await this.saveOutlineData({
                                    outlineId: outlineData.outlineId,
                                    owner: JSON.stringify(outlineData.owner)
                                }, true);
                                if (savedOutline) {
                                    this.$message.success('已保存章节条目的协作分配！');
                                }
                            } else {
                                this.$message.success('已定义章节条目的协作分配，请切换编辑大纲后保存数据！');
                            }
                            // 重新定义大纲数据
                            await this.get_outline();
                        }
                        break;
                }
            },
            // 拖拽大纲后更新条款位置
            updateChapterByoutline({ tree, droppedData, targetData, type }) {
                console.log('updateChapterByoutline', tree, this.outlineData);
                const editor = this.getActiveEditor();
                const pageContainer = editor.getBody().querySelector('.page-container');

                this.$confirm('确认更改大纲?更改后请及时保存！', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    const cloneTree = _.cloneDeep(tree);
                    this.outlineData = cloneTree;
                    pageContainer.innerHTML = '';
                    this.createNewStandard(this.pageData.stdKind, this.pageData, cloneTree[0]['outlineId']).then((loaded) => {
                        // console.log('loaded', loaded);
                        if (this.editorSetting.author && this.editorSetting.author.lockedAll) {
                            pageUtil.unlockAllPages();
                        }
                        editor.focus();
                        this.foucsId(droppedData);
                    });
                }).catch(() => {
                    this.$refs[`outline-${this.editorId}`].setData(this.outlineData);
                });
            },

            /**
             * @description 更新大纲节点名称
             * @param {Object} data
             */
            updateOutlineTitle(data) {
                return pageUtil.updateOutlineTitle(data);
            },

            /**
             * @description 删除大纲节点
             * @param {Object} data
             */
            async afterRemoveOutline(data = {}) {
                return new Promise((resolve, reject) => {
                    pageUtil.removePage(data, () => {
                        domUtil.afterRemoveNodes(this.editor);
                        this.get_outline().then(outlineData => {
                            resolve(outlineData);
                        });
                    });
                })
            },

            /**
             * @description 新增大纲节点
             * @param {Object} data
             */
            async afterAddOutline(data = {}) {
                return new Promise((resolve, reject) => {
                    pageUtil.insertPage(data.prevNode, data.currNode);
                    const outlineData = this.get_outline().then(outlineData => {
                        setTimeout(() => {
                            this.foucsId(data.currNode);
                            resolve(outlineData);
                        }, 300)
                    });
                })
            },

            /**
             * @description 日期转换
             * @param {Object} date
             */
            formatTime(date) {
                return $global.formatDateTime('yyyy-MM-dd hh:mm:ss', date);
            },

            /**
             * @description 字符的字节数
             * @param {String} bytes
             */
            getBytes(bytes) {
                return $global.formatFileSize(bytes);
            },

            /**
             * @description 清除已经标记为比较文本后不同的标签
             * @param {Element} node
             */

            clearDiffNode(node = null) {
                const clearTag = ele => {
                    let textNode = this.editor.dom.create('text', {}, ele.textContent); // document.createTextNode(el.textContent);
                    this.editor.dom.insertAfter(textNode, ele);
                    ele.remove();
                }
                $global.removeClass(node, 'wav-line');
                node.removeAttribute('data-mce-style');
                var tagNodes = node.querySelectorAll('strong.wav-line');
                if (tagNodes.length) {
                    tagNodes.forEach(ele => {
                        clearTag(ele);
                    });
                }
            },

            /**
             * @description 页面内容比较
             * @param {Object} obj
             */
            comparePage(obj = {}) {
                const appendDiffNode = (value, textNode) => {
                    var pos = $global.findStrPosition(textNode.textContent, value);
                    textNode.splitText(pos.end);
                    let matchNode = textNode.splitText(pos.start);
                    let replaceElement = this.editor.dom.create('strong', { class: 'wav-line' }, value); // `<strong class="wav-line">${part.value}</strong>`;
                    // debugger
                    matchNode.parentElement.insertBefore(replaceElement, matchNode);
                    matchNode.remove();
                };

                const compareAttr = (curAttr = {}, attrs = []) => {
                    for (let i = 0; i < attrs.length; i++) {
                        let attrObj = attrs[i];
                        if (curAttr.name === attrObj.name && curAttr.value === attrObj.value) {
                            return true;
                            break;
                        } else {
                            continue;
                        }
                    }
                    return false;
                }

                // 2个页面开始做比较
                if (obj.page) {
                    var pageBlock = this.scrollToElement({ outlineId: obj.page.dataset.outlineid });
                    var sourceChildNodes = obj.page.childNodes;
                    var currChildNoes = pageBlock.childNodes;
                    if (pageBlock) {
                        try {
                            var diffRes = false;
                            sourceChildNodes.forEach((node, index) => {
                                var currNode = currChildNoes[index];
                                // step1. 先清除已标记的
                                this.editor.formatter.remove('removeDiff', { value: 'h' }, node);
                                this.editor.formatter.remove('removeDiff', { value: 'd' }, node);
                                this.editor.formatter.remove('removeDiff', { value: 'h' }, currNode);
                                this.editor.formatter.remove('removeDiff', { value: 'd' }, currNode);

                                if (currNode) {
                                    // 再比较内容
                                    if (!diffRes) {
                                        diffRes = node.innerHTML !== currNode.innerHTML;
                                    }
                                    let res = getHighLightDiff(node.innerHTML, currNode.innerHTML);
                                    node.innerHTML = res;
                                } else {
                                    diffRes = true;
                                }
                            });
                            this.$message.info(diffRes ? '当前页面正文内容有不同，请核实！' : '当前页面正文内容一致！');
                        } catch (error) {
                            console.warn('comparePage error=>', error);
                        }
                    }
                }
            },

            /**
             * @description 滚动到页面指定位置
             * @param {int} top
             */
            scrollTop(obj) {
                var editor = this.getActiveEditor();
                editor.contentWindow.scrollTo({
                    top: obj?.top||0,
                    behavior: "smooth"
                });
                if (!obj?.top){
                    const pageContainer = editor.getBody().querySelector('.page-container');
                    const firstBlock = pageContainer.firstChild;
                    if ($global.hasClass(firstBlock, 'info-block')) {
                        $global.removeClass(firstBlock, 'pageHide');
                    }
                }
            },
            /**
             * @description 滚动到文档的元素位置
             * @param {int} top
             */
            scrollToElement(obj) {
                var editor = this.getActiveEditor();
                if (obj.node) {
                    let pos = editor.dom.getPos(obj.node);
                    this.scrollTop({ top: pos.y });
                    return true;
                }

                if (!obj.outlineId) {
                    return false;
                }
                var pageBlock = editor.getBody().querySelector(`.page-container [data-outlineid="${obj.outlineId}"]`);
                if (pageBlock) {
                    editor.selection.scrollIntoView(pageBlock);
                    /* pageBlock.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                        inline: "nearest"
                    }); */
                    return true;
                }
                return false;
            },

            /**
             * @description 快速定位到页面
             * @param {Object} idx
             */
            moveTopage(idx=0) {
                var editor = this.getActiveEditor();
                this.currPageIndex = idx;
                const body = editor.getBody();
                if (!body) {
                    return false;
                }
                const pageContainer = body.querySelector('.page-container');
                if (!pageContainer) {
                    return false;
                }

                var blocks = Array.from(pageContainer.querySelectorAll('.info-block'));
                var pageBlock = blocks[idx];
                if (pageBlock) {
                    editor.selection.scrollIntoView(pageBlock);
                    /* pageBlock.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                        inline: "nearest"
                    }); */
                }
                return true;
            },
            /**
             * @description 下载文件
             * @param {Object} item
             */
            downloadDocFile(item, flag = false) {
                $global.downloadFile(item.url, item.label + "." + item.ext);
                this.$emit('change', { act: 'download', data: item });
            },

            /**
             * @description 编辑器当前光标位置处中插入内容(外部调用)
             * @param {Object} data
             */
            insertContent(data = {}) {
                var editor = this.getActiveEditor();
                var htmlContent = this.checkHtmlContent(data.htmlContent);
                if (!htmlContent) {
                    return false;
                }
                // 插入的术语
                if (data.term) {
                    editor.undoManager.transact(() => {
                        domUtil.insertTerm(editor, htmlContent, data.notBookmark);
                    })
                } else {
                    editor.undoManager.transact(() => {
                        this.setContent(htmlContent, false);
                    });
                }

                this.$forceUpdate();
                this.refreshEditor(data.collapse);
                // 更新下相关模块
                pageUtil.updateVm(this);
                tinymceEvent.updateVm(this);
                extendTool.updateVm(this);
                return true;
            },

            /**
             * @description 获取编辑器的文档内容
             * @param {Boolean} isText 仅文本内容
             */
            getContent(isText = false) {
                var editor = this.getActiveEditor();
                return isText ? editor.getContent({ format: 'text' }) : editor.getContent();
            },

            /**
             * @description 获取编辑器的文档所有内容
             * @param {Boolean} isText 仅文本内容
             */
            getAllContent() {
                var editor = this.getActiveEditor();
                var pageContainer = editor.getBody().querySelector('.page-container');
                var htmlContent = pageContainer.innerHTML;
                var images = [];
                var imgNodes = Array.from(pageContainer.querySelectorAll('img'));
                imgNodes.forEach(node => {
                    images.push(node.src);
                });
                return {
                    htmlContent,
                    images,
                };
            },

            /**
             * @description 重置编辑器的文档内容
             * @param {Object} data
             */
            async resetContent(data = {}) {
                var editor = this.editor || this.getActiveEditor();
                editor.focus();
                return new Promise((resolve, reject) => {
                    if (data.pageData) {
                        this.pageData = data.pageData;
                    }
                    var htmlContent = this.checkHtmlContent(data.htmlContent);
                    if (htmlContent) {
                        editor.resetContent(htmlContent);
                        if (this.editorSetting.setTemplate) { // 仅设置模板的
                            resolve(true);
                        } else {
                            this.activeTab = 'outline';
                            this.arrangeHtml();
                            this.scrollTop(0);
                            setTimeout(() => {
                                pageUtil.loaded = true;
                                // 文档分页
                                if (data.breakPage) {
                                    this.exePageBreak(true);
                                }
                                // 重置文档缩放
                                if (data.pageZoom) {
                                    this.setPageZoom(data.pageZoom);
                                }
                                // 重新设置大纲
                                this.get_outline();
                                // 重置目次 add by sam.shen 2024-7-24
                                pageUtil.autoSetCatalogue();
                                // console.log('resetContent==>', outlineList);
                                // 合并文档
                                if (data.megerDoc) {
                                    this.megerDoc().then((rep) => {
                                        this.$emit('change', { act:'complete' });
                                        resolve(rep);
                                    });
                                } else {
                                    this.$emit('change', { act:'complete' });
                                    resolve(true);
                                }
                            }, 500);
                        }
                    }
                });
            },


            /**
             * @description 校验编辑器的文档内容
             * @param {String} htmlContent
             */
            checkHtmlContent(htmlContent = '') {
                var editor = this.getActiveEditor();
                if (!editor || !editor.getBody()) {
                    this.$message.error('编辑器实例出错！')
                    return false;
                }
                var pageContainer = editor.getBody().querySelector('.page-container');
                if (!pageContainer) {
                    htmlContent = `<div class="page-container">${htmlContent}</div>`;
                }
                return htmlContent;
            },

            /**
             * @description 编辑器中插入内容
             * @param {String} htmlContent
             * @param {Boolean}  isFull 是否重置内容
             */
            setContent(htmlContent = '', isFull = false) {
                var editor = this.getActiveEditor();
                if (isFull) {
                    editor.execCommand('mceSetContent', false, htmlContent);
                } else {
                    editor.execCommand('mceInsertContent', false, htmlContent);
                }
            },

            /**
             * @description 将章标题或条目设置为可引用的条款
             */
            setCharpterToQuote() {
                var editor = this.getActiveEditor();
                var pageContainer = this.editor.getBody().querySelector('.page-container');
            },

            /**
             * @description 获取页面标签HTML内容 (外部接口)
             * @param {Object}   data
             */
            getTagContent(data = null) {
                // var editor = this.getActiveEditor();
                if (data && data.id) {
                    var pageContainer = this.editor.getBody().querySelector('.page-container');
                    var blocks = pageContainer.querySelectorAll(`.info-block[data-id="${data.id}"]`);
                    if (blocks.length) {
                        var arr = [];
                        blocks.forEach(block => {
                            Array.from(block.childNodes).forEach(node => {
                                arr.push(node.outerHTML);
                            })
                        })
                        return arr;
                    } else {
                        this.$message.error('无法定位到具体节点！');
                        return undefined;
                    }
                }
                return [];
            },

            /**
             * @description 获取页面块HTML内容 (外部接口)
             * @param {Object}   data
             */
            getBlockContent(data = null) {
                var editor = this.getActiveEditor();
                if (data && data.id) {
                    var pageContainer = editor.getBody().querySelector('.page-container');
                    if (pageContainer) {
                        var block = pageContainer.querySelector(`.info-block[data-id="${data.id}"], .info-block[data-outlineid="${data.id}"]`);
                        return block ? block.outerHTML : '';
                    }
                }
                return '';
            },
            /**
             * @description 获取页面总数
             */
            async getAllPages() {
                var editor = this.getActiveEditor();
                var pageContainer = editor.getBody().querySelector('.page-container');
                var blocks = Array.from(pageContainer.querySelectorAll('.info-block'));
                blocks.forEach(block => {
                    let pos = editor.dom.getPos(block);
                    pos.height = block.offsetHeight;
                    block.dataset.pos = JSON.stringify(pos);
                })
                return blocks;
            },

            /**
             * @description 页面数据
             */
            getPageData() {
                return pageUtil.getPageData();
            },

            /**
             * @description 设置数据
             * @param {Object} data
             */
            setData(data = {}) {
                var result = null;
                if (typeof this[data.act] === 'function') {
                    result = this[data.act](data);
                }
                return true;
            },

            /**
             * @description 显示或关闭目次
             * @param {Object}   data
             */
            showcatalogue(obj) {
                this.$set(this.editorSetting, 'notCatalogue', !obj.show);
                pageUtil.updateVm(this);
                pageUtil.resetCatalogue(obj.show);
            },

            /**
             * @description 按规则重置目次（外部调用）
             * @param {Object} obj
             */
            reset_catalogue(obj) {
                // 清除配置值
                var cataData = {};
                if (obj.data) {
                    obj.data.forEach(key => {
                        cataData[key] = true;
                    });
                }
                var docConfig = this.editor.settings.doc_config;
                docConfig.catalogues = cataData;
                this.editor.settings.doc_config = docConfig;
                pageUtil.autoSetCatalogue(cataData);
            },

            /**
             * @description 选中大纲的节点后快速定位到元素位置
             * @param {Object} data
             */
            foucsId(data = {}) {
                const editor = this.getActiveEditor();
                var uuid = data.id || data.outlineId;
                var pageContainer = editor.getBody().querySelector('.page-container');
                var nodeEle = pageContainer.querySelector(`[data-outlineid="${uuid}"]:not(.info-block)`) || pageContainer.querySelector(`[data-id="${uuid}"]:not(.info-block)`) || pageContainer.querySelector(`[data-bookmark="${uuid}"]`);
                if (nodeEle) {
                    // debugger
                    var pageSection = editor.dom.getParent(nodeEle, '.info-block');
                    $global.removeClass(pageSection, 'pageHide');
                    // pageSection.scrollIntoView({ block: "start", inline: "nearest" });
                    editor.selection.scrollIntoView(pageSection);

                    // 直接输出节点
                    if (data.outNode && nodeEle) {
                        let blockNode = editor.dom.getParent(nodeEle, '.info-block');
                        if (blockNode && blockNode.dataset.outlinetype && ['1', '2', '11', '12'].includes(blockNode.dataset.outlinetype)) {
                            return blockNode;
                        }
                        return nodeEle;
                    }

                    // 如果有class类则定义
                    if (data.cls) {
                        let allNodeByCls = Array.from(pageContainer.querySelectorAll(`.${data.cls}`));
                        allNodeByCls.forEach(ele => {
                            $global.removeClass(ele, data.cls);
                        })
                        $global.addClass(nodeEle, data.cls);
                    }
                    // 如果是同步滚动则直接定位到元素，无下拉滚动动画,考虑性能问题,这里直接定位
                    // nodeEle.scrollIntoView({ block: "start", inline: "nearest" });
                    /* if (this.editorSetting.syncScroll || data.syncScroll) {
                        editor.selection.scrollIntoView(nodeEle);
                    } else {
                        nodeEle.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
                    } */
                    editor.selection.scrollIntoView(nodeEle);

                    return nodeEle;
                }
                return null;
            },

            /**
             * @description 添加标签（外部接口）
             * @param {Object} obj
             */
            addTag(obj) {
                this.toggleTag(obj.data);
            },

            /**
             * @description 打上标签
             * @param {Object} obj  || { value: 'quota', id:$global.guid(), title:'指标', content:JSON.stringify(data) }
             */
            toggleTag(obj) {
                // var editor = this.getActiveEditor();
                if (obj) {
                    this.editor.formatter.toggle('setTags', obj);
                } else {
                    this.$message.error("标签无数据！")
                }
            },

            /**
             * @description 更新DOM节点标签数据
             * @param {Object} data
             */
            updateTag(data = {}) {
                try {
                    var pageContainer = this.editor.getBody().querySelector('.page-container');
                    if (data.id) {
                        let tagEle = pageContainer.querySelector(`[data-id="${data.id}"]`);
                        if (tagEle) {
                            for (let key in data) {
                                tagEle.dataset[key] = data[key];
                            }
                            tagEle.dataset.setTag = "1"; // 标注已经打上标签
                            tagEle.innerText = data.tagString || `{${data.name}}`;
                            return true;
                        }
                    }

                } catch (error) {
                    this.$alert('updateTag errror:' + error, '错误提示', { type:'error'});
                    return false;
                }
            },
            /**
             * @description 根据当前节点获取Ancestors
             * @param {Object} obj
             */
            async getAncestorsBycurrNode(obj = null) {
                // var editor = this.getActiveEditor();
                var pageContainer = this.editor.dom.getParent(obj.node, '.page-container');
                var outlineNode = this.editor.dom.getParent(obj.node, '[data-outlineid]');
                // console.log('getAncestorsBycurrNode=>', outlineNode);
                if (outlineNode) {
                    return new Promise((resolve, reject) => {
                        var ancestors = outlineUtil.getAncestors(outlineNode, pageContainer);
                        resolve(ancestors.join(","));
                    })
                }
            },

            /**
             * @description 自定义标签
             * @param {Object} obj
             */
            toggleCustomeTag(obj = {}) {
                // var editor = this.getActiveEditor();
                obj.tagId = obj.tagId || $global.guid();
                var ele = this.editor.getBody().querySelector(`[data-tag][data-id="${obj.tagId}"]`);
                if (obj.remove && ele) {
                    this.editor.formatter.remove('setTags', { class: ele.className, title: ele.getAttribute('title'), value: ele.dataset.tag, id: ele.dataset.id, tid: ele.dataset.tid, content: ele.dataset.content }, ele);
                    return;
                }
                this.editor.formatter.toggle('setTags', obj);
                this.editor.nodeChanged();
            },

            /**
             * @description 插入或更新批注
             * @param {Object} obj
             */
            toggleCommnet(obj = null, isRemoved = false) {
                obj.id = obj.id || $global.guid();
                var ele = this.editor.getBody().querySelector(`.comment[data-id="${obj.id}"]`);
                if (isRemoved && ele) {
                    this.editor.formatter.remove('setTags', { title: ele.getAttribute('title'), value: 'comment', id: obj.id, tid: '0', content: ele.dataset.content }, ele);
                    return;
                }
                var commentList = JSON.stringify(obj);
                if (ele) {
                    ele.dataset.content = commentList;
                } else {
                    this.editor.formatter.toggle('setTags', { value: 'comment', id: obj.id, tid: '0', title: '批注', content: commentList });
                }
            },
            /**
             * @description 重置编辑器，并将配置文件重写
             * @param {Object} data
             */
            resetEditor(data = {}) {
                this.editorSetting = data;
                // this.editor = this.getActiveEditor();
                this.setEditorMode(data);
            },

            /**
             * @description 切换模式
             * @param {Object} data
             */
            setEditorMode(data = {}) {
                var editor = this.getActiveEditor();
                if (!editor) {
                    return false;
                }

                if (data.readonly !== undefined) {
                    this.$set(this.editorSetting, 'readonly', data.readonly);
                }
                if (data.reader !== undefined) {
                    this.$set(this.editorSetting, 'readonly', data.reader);
                }

                if (data.readonly || data.reader) {
                    editor.mode.set("readonly");
                } else {
                    editor.mode.set("design");
                }
                return true;
            },

            /**
             * @description 设置ICS-CCS编号
             * @param {Object} obj
             */
            toggleIcsCcs(obj) {
                // var editor = this.getActiveEditor();
                if (!this.editor || !this.editor.getBody()) {
                    return false;
                }
                var coverPage = this.editor.getBody().querySelector('.info-block.cover');
                if (!coverPage) {
                    return false;
                }
                var icsEle = coverPage.querySelector('.icsNumber');
                var ccsEle = coverPage.querySelector('.ccsNumber');
                if (!_.isEmpty(obj)) {
                    if (icsEle) {
                        icsEle.textContent = obj.ics;
                    }
                    if (ccsEle) {
                        ccsEle.textContent = obj.ccs;
                    }
                } else {
                    return {
                        ics: icsEle ? icsEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '') : "",
                        ccs: ccsEle ? ccsEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s/g, '') : ""
                    }
                }
            },

            // 标准编号联动处理
            toggleStdNo(obj = {}) {
                // var editor = this.getActiveEditor();
                if (!this.editor || !this.editor.getBody()) {
                    return false;
                }
                var pageContainer = this.editor.getBody().querySelector('.page-container');
                var coverPage = pageContainer.querySelector('.info-block.cover');
                if (!coverPage) {
                    return false;
                }
                var numbersEle = coverPage.querySelector('.numbers');
                var stdSignEle = numbersEle.querySelector('.stdSign');
                // var stdVerEle = numbersEle.querySelector('.stdVer');
                var stdNoEle = numbersEle.querySelector('.stdNo');
                var origStdNoEle = numbersEle.querySelector('.origStdNo');

                if (!_.isEmpty(obj)) {
                    this.pageData.stdSign = obj.stdSign || "";
                    this.pageData.stdNo = obj.stdNo || "";
                    this.pageData.origStdNo = obj.origStdNo || "";

                    if (stdSignEle) {
                        stdSignEle.textContent = this.pageData.stdSign;
                    }

                    if (stdNoEle) {
                        stdNoEle.textContent = obj.order + "—" + obj.year;
                    }

                    if (origStdNoEle) {
                        origStdNoEle.textContent = this.pageData.origStdNo;
                    }
                    // 如果编号为分部分的，标准名称须自动加上第几部分
                    var stdNameEle = coverPage.querySelector('.stdName');
                    var stdNameText = stdNameEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
                    var stdNameEnEle = coverPage.querySelector('.stdNameEn');
                    var stdNameEnText = stdNameEnEle ? stdNameEnEle.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') : "";

                    var stdNameTextArr = $global.getStdNameSerialName(stdNameText);
                    var stdNameEnTextArr = $global.getStdNameSerialName(stdNameEnText, true);

                    var numberStr = "";
                    // 开始处理标准名称（包括英文名称）
                    var forceStdNameEle;
                    if (obj.stdNo.match(/\./i) !== null && obj.stdNo.match(/\—/i) !== null) {
                        // 取出标准编号的实际顺序号,并修正标准名称
                        numberStr = $global.getStdNoSerialNumber(obj.stdNo);
                        let htmlContent = "",
                            htmlEnContent = "";
                        if (!stdNameTextArr.length) {
                            htmlContent = `${stdNameText}<br/>第${numberStr}部分：`;
                        } else {
                            stdNameText = stdNameTextArr[0];
                            htmlContent = `${stdNameTextArr[0]}<br/>第${numberStr}部分：${stdNameTextArr[2]}`;
                        }
                        stdNameEle.innerHTML = htmlContent;
                        // 处理英文名称
                        if (stdNameEnEle && stdNameEnText) {
                            if (!stdNameEnTextArr.length) {
                                htmlEnContent = `${stdNameEnText}<br/>Part ${numberStr}:`;
                            } else {
                                htmlEnContent = `${stdNameEnTextArr[0]}<br/>Part ${numberStr}:${stdNameEnTextArr[2]}`;
                            }
                            stdNameEnEle.innerHTML = htmlEnContent;
                        }

                    } else {
                        if (stdNameTextArr.length) {
                            stdNameEle.textContent = stdNameTextArr[0];
                        }
                        if (stdNameEnTextArr.length && stdNameEnText) {
                            stdNameEnEle.textContent = stdNameEnTextArr[0];
                        }
                    }
                    // 处理前言中的第几部分节点
                    /* if (this.editorSetting.dealPreface) {
                        domUtil.dealPrefacePagePart(pageContainer, this.pageData, { stdNameText, numberStr });
                        setTimeout(() => {
                            domUtil.dealPrefacePageorigStdNo(pageContainer, this.pageData, { stdNameText, numberStr });
                        }, 300)
                    } */

                    /*domUtil.dealPrefacePagePart(pageContainer, this.pageData, { stdNameText, numberStr });
                    // 处理前言中的代替节点
                    setTimeout(() => {
                        domUtil.dealPrefacePageorigStdNo(pageContainer, this.pageData, { stdNameText, numberStr });
                    }, 300)*/
                }
            },

            /**
             * @description 获取节点或选中的文本
             * @param {Boolean}  selection
             */
            getNode(selection = false) {
                return selection ? this.editor.selection.getContent({ format: 'text' }) : this.editor.selection.getNode();
            },

            /**
             * @description 外部父组件调用接口, 获取相关数据
             * @param {Object} obj
             */
            getData(obj = {}) {
                var result = null;
                if (typeof this[obj.act] === 'function') {
                    result = this[obj.act](obj);
                }
                return result;
            },

            /**
             * @description 获取配置数据
             */
            get_setting() {
                if (window.tinyMCE) {
                    return {
                        baseURL: window.tinyMCE.baseURL,
                        pluginURL: window.tinyMCE.pluginURL
                    }
                }
                return {};
            },

            /**
             * @description 获取草稿箱列表
             */
            get_draft() {
                return this.$storage.get('tinymceDraft') || [];
            },

            /**
             * @description 导出文档
             * @param {Object} obj
             */
            async export_doc(obj) {
                return await this.exportHTML2word(obj.data);
            },

            resetOutlineData(obj) {
                this.outlineData = obj.data;
            },

            /**
             * @description 获取页面的大纲结构数据 , activeBlock = false
             * @param {Boolean} isSave
             */
            async get_outline(isSave = false) {
                var editor = this.getActiveEditor();
                if (!editor || !editor.getBody()) {
                    return [];
                }
                const pageContainer = editor.getBody().querySelector('.page-container');
                if (pageContainer && !this.editorSetting.normal) {
                    this.outlineData = [];
                    if (isSave && typeof isSave === 'boolean') {
                        return await outlineUtil.getOutlineBypage(pageContainer, true);
                    }
                    var outlineData = await outlineUtil.getOutlineBypage(pageContainer, false);
                    if (outlineData.length) {
                        if (outlineData.length > 1) {
                            this.outlineData = $global.handleTree(outlineData, 'outlineId', 'parentId', 'children', '0');
                        } else {
                            this.outlineData = outlineData;
                        }
                    }
                }
                return this.outlineData;
            },
            /**
             * @description 更新页面属性配置
             */
            set_pagetype(obj) {
                pageUtil.updatePageComposition(obj.data);
            },
            /**
             * @description 添加或移除封底页面
             */
            set_backCover(obj) {
                var editor = this.getActiveEditor();
                const pageContainer = editor.getBody().querySelector('.page-container');
                if (obj.data.backCover) {
                    var backCoverTemp = _.find(this.listTemplate, { 'tmplType': this.pageData.stdKind, 'tmplName': 'backCover' });
                    if (backCoverTemp) {
                        var section = editor.dom.create('div', { 'class': 'info-block backcover left', 'contenteditable': 'false' }, backCoverTemp.content);
                        section.dataset.no = this.pageData.stdSign + ' ' + this.pageData.stdNo;
                        // section.dataset.outlineid = $global.guid();
                        var stdNameEle = section.querySelector('[data-stdname]');
                        if (stdNameEle) {
                        	stdNameEle.textContent = this.pageData.stdName;
                        }
                        var stdNoEle = section.querySelector('[data-stdno]');
                        if (stdNoEle) {
                        	stdNoEle.textContent = this.pageData.stdSign + ' ' + this.pageData.stdNo;
                        }
                        pageContainer.appendChild(section);
					} else {
                        this.$message.warning('系统模板未配置文档的封底页面！');
                    }
                } else {
                    var backCoverPage = pageContainer.querySelector('.info-block.backcover');
                    if (backCoverPage) {
                        backCoverPage.remove();
                    }
                }
            },
            /**
             * @description 获取页面的所有标签
             */
            get_tags() {
                // var editor = this.getActiveEditor();
                return pageUtil.geTagsBypage(this.editor);
            },

            /**
             * @description 获取页面的所有数据（大纲、标签、正文、结构化数据等）
             */
            get_doc() {
                // const editor = this.getActiveEditor();
                const cfg = $global.getTinymceConfig();
                const pageContainer = this.editor.getBody().querySelector('.page-container');
                const docId = pageContainer.dataset.id;
                var infoBlocks = pageContainer.querySelectorAll('.info-block:not(.disabled)');
                infoBlocks = Array.from(infoBlocks);

                var outlineList = [];
                for (let i = 0; i < infoBlocks.length; i++) {
                    var block = infoBlocks[i];
                    // 标题
                    var titleData = this.parseTitleStruct(block.querySelector('.header-title'), docId);
                    if (titleData) {
                        outlineList.push(titleData);
                    }
                    // 章节条款
                    var chapters = block.querySelectorAll('[data-index]:not(.hide-list)');
                    Array.from(chapters).forEach(li => {
                        let outlineId = li.dataset.outlineid || li.dataset.id;
                        let outlineTitle = li.firstChild && li.firstChild.nodeName === '#text' ? li.firstChild.textContent : '';
                        let outlineData = {
                            docId,
                            outlineId,
                            parentId: li.dataset.parentid,
                            outlineType: li.dataset.outlinetype ? parseInt(li.dataset.outlinetype) : 1000,
                            outlineTitle,
                            isVisible: outlineTitle ? 1 : 0,
                            levelNum: li.dataset.index ? parseFloat(li.dataset.index) : 0,
                            content: {
                                contentId: li.dataset.contentid || $global.guid(),
                                docId,
                                outlineId,
                                contentType: 'html',
                                content: li.outerHTML
                            }
                        }
                        outlineList.push(outlineData);
                    });
                }
                return outlineList;
            },

            /**
             * @description 解析标题结构数据
             * @param {Element} node
             * @param {String} docId
             */
            parseTitleStruct(node = null, docId = '') {
                if (node) {
                    var block = node.parentNode;
                    // var contentTitle = node.querySelector('.appendix-title');
                    var outlineId = block.dataset.outlineid || block.dataset.id || $global.guid();
                    var titleData = {
                        outlineId,
                        parentId: block.dataset.parentid || '',
                        outlineType: block.dataset.outlinetype ? parseInt(block.dataset.outlinetype) : 0,
                        outlineTitle: node.textContent.replace(/\s/g, ''),
                        isVisible: 1,
                        levelNum: 1,
                        content: {
                            contentId: node.dataset.contentid || $global.guid(),
                            docId,
                            outlineId,
                            contentType: 'html',
                            content: node.outerHTML
                        }
                    };
                    if (node.querySelector('.appendix-title')) {
                        titleData.outlineTitle = node.querySelector('.appendix-title').textContent;
                    }
                    return titleData;
                }
                return null;
            },

            /**
             * @description 标签对象转换成数据
             * @param {Array}  tagNodes
             * @param {String}  docId 文档ID
             * @return {Array} 标签列表 list
             */
            convertTagData(tagNodes = [], docId = '') {
                var list = [];
                tagNodes.forEach(node => {
                    if (!node.dataset.id) {
                        node.dataset.id = $global.guid();
                    }
                    var cls = node.getAttribute('class');
                    var data = { tagId: node.dataset.id, tagType: cls, docId };
                    var tagName = [];
                    switch (cls) {
                        // 术语：处理中英文名称
                        case 'term':
                            let content = {};
                            let childs = $global.getValidateChilds(node.childNodes);
                            childs.forEach((ele, i) => {
                                let key = i === 0 ? 'name' : 'en-name';
                                let str = ele.innerText.replace(/ /g, '');
                                content[key] = str;
                                tagName.push(str);
                            });
                            // 处理术语解析
                            let explainNode = node.nextElementSibling;
                            if (explainNode) {
                                content.explain = explainNode.innerText.replace(/ /g, '');
                                // 处理术语来源
                                let sourceNode = explainNode.nextElementSibling;
                                if (sourceNode) {
                                    content.source = {
                                        text: sourceNode.innerText.replace(/ /g, ''),
                                        stdId: '',
                                        stdNo: ''
                                    }
                                    let aNode = sourceNode.querySelector('a.quote');
                                    if (aNode) {
                                        content.source.stdId = aNode.dataset.stdid;
                                        content.source.stdNo = aNode.dataset.stdno;
                                    }
                                }
                            }
                            data.tagContent = JSON.stringify(content);
                            break;
                            // 批注内容
                        case 'comment':
                            tagName.push(node.innerText.replace(/ /g, ''));
                            data.tagContent = node.dataset.content;
                            break;
                            // 指标等其他标签
                        case 'quota':
                        case 'other':
                            let quotaData = JSON.parse(node.dataset.content);
                            tagName.push(quotaData.key);
                            data.tagContent = node.dataset.content;
                            break;
                    }

                    data.tagName = tagName.join(',');
                    list.push(data);
                });
                return list;
            },
            getListTemplateData() {
                // var attrData = this.$attrs.data;
                // this.$store.dispatch('editor/loadTemplate', this.editorSetting.editorURL);
            },

            toggleHideSideBar(data) {
                this.$set(this.editorSetting, 'hideSideBar', data.hideSideBar);
                /* const outlineList = data.outlineList;
                if (outlineList) {
                    this.lockedOutline = outlineList;
                } */
            },

            /**
             * @description 注册事件总线
             */
            regBusEvent() {
                // 修改校验后的元素
                $bus.$off('valiadteUpdate');
                $bus.$on('valiadteUpdate', data => {
                    this.foucsId(data);
                });
                // 监听章节锁定
                $bus.$off('locked');
                $bus.$on('locked', data => {
                    if (!this.editorSetting.author.lockedAll) {
                        return false;
                    }

                    // 重新获取大纲数据
                    this.get_outline();
                    // 如果数据不存在了就重新设定
                    if (_.isEmpty(this.pageData) || _.isEmpty(this.lockedOutline)) {
                        var pageData = pageUtil.getPageData(this.editor);
                        var storePageData = $global.getStroage('tinymceDocData');
                        this.pageData = _.merge({}, pageData, this.pageData, storePageData);
                        // 从后台接口重新获取已被锁定的章节条目
                        this.listLockedOutline(this.pageData.docId);
                    }

					console.log('this.outlineData==>', this.outlineData)

                    if (data.docId !== this.pageData.docId) {
                        return;
                    }
                    // 强制全部解锁
                    if (data.forceUnlock) {
                        clearInterval(this.timelockHandler);
                        this.timelockHandler = null;
                    }
                    let title = '', msg = [];
                    // 从大纲中获取被锁定的章节数据
                    let userId = data.clientId ? data.clientId.replace(/\user_/g, '') : data.userId;
                    let userName = data.clientName || data.userName;
                    let lockedItem = $global.getChildData('outlineId', data.locked, this.outlineData);
                    // 锁定
                    let index = _.findIndex(this.lockedOutline, { docId: this.pageData.docId, userId, lockedOutlineId: data.locked });
                    if (!~index && !_.isEmpty(lockedItem)) {
                        this.lockedOutline.push({
                            userId,
                            userName,
                            docId: data.docId,
                            lockedOutlineId: data.locked
                        });
                        if (lockedItem) {
                            title = (lockedItem.outlineCatalog || "") + " " + lockedItem.outlineTitle;
                            msg.push('章节条“' + title + '”已被' + userName + '锁定编辑！');
                        }
                    }
                    // 解锁
                    if (data.unlocked) {
                        let unlockedItem = $global.getChildData('outlineId', data.unlocked, this.outlineData);
                        index = _.findIndex(this.lockedOutline, { docId: this.pageData.docId, lockedOutlineId: data.unlocked });
                        if (!!~index) {
                            this.lockedOutline.splice(index, 1);
                            if (unlockedItem) {
                                title = (unlockedItem.outlineCatalog || "") + " " + unlockedItem.outlineTitle;
                                msg.push('章节条“' + title + '”已被' + userName + '解锁');
                            }
                        }
                    }
                    // 章节正文更新
                    if (data.saved) {
                        let outlineItem = _.find(this.allOutlines, { outlineId: data.locked });
                        if (outlineItem && userId !== this.editorSetting.author.userId) {
                            title = (outlineItem.outlineCatalog || "") + " " + outlineItem.outlineTitle;
                            msg.push(`章节条“${title}”已被${userName}更新`);
                            if (!this.updateLockedOutline.includes(data.locked) && data.clientName !== this.editorSetting.author.userName) {
                                this.updateLockedOutline.push(data.locked);
                            }
                        }
                    }
                    // 整个文档锁定或解锁
                    if (data.lockDoc) {
                        msg.push(`文档已被${data?.userName||''}${data.isLocked?'锁定':'解锁'}!`);
                        if (userId !== this.editorSetting.author.userId || !data.isLocked || data.forceUnlock) {
                            if (!data.isLocked || data.forceUnlock) {
                                this.loadDocData(this.pageData.docId, true);
                            } else {
                                pageUtil.unlockAllPages(true);
                            }
                        }
                    }
                    // 去重
                    this.lockedOutline = _.uniqBy(this.lockedOutline, 'lockedOutlineId');
                    if (msg.length) {
                        // 消息通知
                        this.$notify.info({
                            title: '消息',
                            dangerouslyUseHTMLString: true,
                            message: msg.join("<br/>")
                        });
                    }
                });
            }
        },

    }
</script>

<style>


</style>

<style lang="scss" scoped>
    @import "./tinymce-editor.scss";

    .editor-loading{
        position: fixed;
        left: 0;
        top:0;
        width: 100%;
        height: 100%;
        z-index: 9999;
        display: none;
        align-items: center;
        justify-content: center;
        background-color: rgba(0,0,0,.6);
        font-size: 1.25em;
        color: #7eb2ff;
        user-select: none;
        pointer-events: none;
        >p{
            display: flex;
            align-items: center;
            >i{
               margin-right: 5px;
                font-size: 1.5em;
            }
        }
    }

    .my-editor-dialog{
        position: fixed;
        z-index: 2002;
    }

    ::v-deep .sam-editor-dialog {
        display: flex;
        flex-direction: column;

        &.is-fullscreen {
            top: 0 !important;
            left: 0 !important;
        }

        .el-dialog__header {
            >div {
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 100%;

                .title {
                    font-size: 14px;
                    font-weight: bold;
                }

                .btns {
                    >span {
                        cursor: pointer;
                        font-size: 16px;
                    }
                }
            }
        }

        .el-dialog__body {
            flex: 1;
            overflow: hidden;

            .cmp-content {
                overflow: hidden;
                height: 100%;
            }

            .forms {
                .el-form {
                    display: grid;
                    grid-template-columns: repeat(2, 50%);
                    gap: 10px;
                    padding-right: 10px;

                    .el-form-item {
                        .el-form-item__label {
                            font-size: 14px;
                        }

                        ul {
                            overflow: hidden;

                            >li {
                                font-size: 13px;
                                border-bottom: 1px solid #EEE;
                                padding: 5px 0;
                            }
                        }
                    }
                }
            }

            .groups {
                min-height: 420px;

                .el-checkbox-group {
                    flex-direction: column;
                    align-items: self-start;

                    &.grids {
                        display: grid;
                        grid-template-columns: repeat(4, 25%);
                    }

                    .el-checkbox {
                        padding: 3px 0;
                        border-bottom: 1px solid #EEE;
                        width: 100%;
                    }
                }

                .el-pagination {
                    .el-pager {
                        .number {
                            min-width: 20px;
                            font-size: 12px;
                        }
                    }
                }
            }

            .slot-container {
                min-height: 50px;
            }
        }
    }
</style>
