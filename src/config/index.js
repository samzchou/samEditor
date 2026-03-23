export const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
export const optionSettings = {
    env: process.env.NODE_ENV,
    author: {},
    setTemplate: false,
    admin: true,
    editorURL: process.env.VUE_APP_EDITOR_URL,	        // JAVA接口地址
    nodeURL: process.env.VUE_APP_REMOTE_API,		    // nodeServer服务器地址
    pluginURL: process.env.VUE_APP_PLUGIN_PATH,         // 外挂插件地址 process.env.VUE_APP_PLUGIN_PATH,
    fileURL: process.env.VUE_APP_FILE_URL,              // 静态资源文件路径
    parseDocURL: process.env.VUE_APP_DOC_API,			// 文档解析接口地址
    socketURL: process.env.VUE_APP_SOCKET,              // socket地址
    zoomIn: true, 										// 页面缩放
    fullScreen: true,									// 默认全屏模式
    readonly: false,
    isStandard: true,                                   // 是否为标准编写
    mergeDoc: false,                                    // 文档初始化后是否自动合并正文
    chapter: ['6','8','9'],                             // 章节标识;用于目次数据的筛选
    page: {
        expand: false,									// True:页面不做自动分页，自动向下增高展开，注：仅用于编辑模式下
        layout: 'doubleSided', 							// 单面排版：singleSided | 双面排版：doubleSided
        id: '',                                         // 文档ID
    },
    logo: require(`@/assets/images/logo.png`),
    navShow: true,
    openSidebar: true,                                  // 默认打开侧栏
    exportStruct: true,                                 // 是否在保存数据时同时导出结构化数据
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
    // 字体
    font_formats:'宋体=simsun;黑体=SimHei;Times New Roman=times new roman;',
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
            items: 'charmap | paragraph-btn image inserttable | math graphy | hr',
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
    toolbar1: 'undo redo | close-btn save saveAs | catalogue indexMarker | collect-chapter collect-unchapter | collect-list collect-level | paragraph-btn image | table separateTable | math graphy | fontselect fontSize forecolor backcolor | link | test1 quote',
    // 第二行工具栏
    toolbar2: 'example-btn zhu-btn zhu-imgtable footer-btn imgtitle tabletitle | quote-btn term quota references | comment | page-type pageLayout exportFile | alignment indent2em removeformat | translate searchreplace preview fullscreen | code mergePage breakPage pageSplit | pagebreak print | codesample',
    // 快捷工具条
    quickbars: 'bold italic underline strikethrough superscript subscript',
    // 公式下拉菜单
    mathItems: ['custom', 'hand', 'number'], // 自定义 手写 编号
    // 上下文菜单
    contextmenu: 'undo redo | table | image | resetNumber | quickComment | translateStdName | quickTag',
    // 草稿箱轮询间隔 30000 0为不调用草稿箱
    draftTimes: 0,
    // 自定义列项
    bullets: [
        { text: '列项—— 【一级】', value: 'line', level: 1 },
        { text: '字母 a) b) c) 【一级】', value: 'lower', level: 1 },
        { text: '数字框 [1] [2] [3]【一级】', value: 'num-index', level: 0 },
        { text: '数字 1) 2) 3)【二级】', value: 'num', level: 2 },
        { text: '符号 ● 【二级】', value: 'circle', level: 2 },
        { text: '重置编号', cmd: 'restBulletNum' },
    ],
    htmlContent: '',
}
