export const editorOptions = {
    env: process.env.NODE_ENV, // 编辑器运行的环境
    author: { // 用户信息
        userId: '1', // 用户ID
        userName: 'sam', // 用户名
        commitId: '', // 用户所编辑的大纲ID
        isAdmin: true, // 是否为管理员（可编辑大纲）
        enableDraft: true,
        // lockedAll: true, // 协同模式下默认全不锁定
        //assignOutline: true, // 是否可以分配大纲
        memberList: [{ userName: 'sam', userId: '1' }, { userName: 'sam1', userId: '2' }, { userName: 'sam2', userId: '3' }], // 成员列表(分配大纲人员)
        unlockedAutoSave: true, // 解锁后自动保存
        lockedTimes: 10000, 	// 锁定后轮询提交锁定章节间隔
        forceUnlock: true,  // 强制全部解锁操作
        outlineLevel: 2, // 可无限分配章节条目的层级，不设置则为无限级
    },
    zoomIn: true, // 编辑器文档的放大缩小
    admin: true, // 是否管理员权限
    // 如果在开发环境下须配置以下接口路径地址
    editorURL: process.env.VUE_APP_EDITOR_URL, // JAVA接口地址 process.env.VUE_APP_EDITOR_URL
    nodeURL: process.env.VUE_APP_REMOTE_API, // nodeServer服务器地址 process.env.VUE_APP_REMOTE_API 'http://192.168.0.239:9001',
    pluginURL: process.env.VUE_APP_PLUGIN_PATH, // 外挂插件地址 process.env.VUE_APP_PLUGIN_PATH,
    parseDocURL: process.env.VUE_APP_DOC_API, // 文档解析接口地址
    socketURL: process.env.VUE_APP_SOCKET, // socket通信地址
    textImgUrl: process.env.VUE_APP_TEXT_IMG_URL, // 文本文档中的图片路径
    readonly: false,// 只读模式
    reader: false, // 阅读器模式
    isStandard: true, // 是否为标准编写
    mergeDoc: false, // 文档初始化后是否自动合并正文
    chapter: ['6', '8', '9'], // 章节标识;用于目次数据的筛选
    page: {
        expand: true, // 章节页面高度自动延展（协同编写模式下不支持false）
        id: '', // 文档的docId,编辑器初始化后自动按此ID加载、解析并渲染文档
    },
    logo: require(`@/assets/images/logo.png`), // 编辑器菜单栏左侧的LOGO图标，src加载
    navShow: true, // 左侧导航栏显示与否，默认显示
    openSidebar: true, // 默认打开左侧栏
    exportStruct: true, // 是否在保存数据时同时导出结构化数据
    notSlot: false, // 是否不需要加载额外的组件(弹窗DMS的数据)
    autoMathNum: true, // 自动生成公式编号
    // 菜单内容
    menu: {
        file: { title: 'File', items: 'save | searchreplace | exportFile | close-btn' },
        edit: { title: 'Edit', items: 'undo redo | cut copy paste | searchreplace' },
        insert: { title: 'Insert', items: 'charmap | paragraph-btn image inserttable | math graphy | hr' },
        Tools: { title: 'Tools', items: 'validatDms readDoc knowledgeGraph | translate' },
        help: { title: 'Help', items: 'help concatus | bzt-ver' } // upgrade
    },
    // 列项样式
    bullets: [
        { text: '列项—— 【一级】', value: 'line', level: 1 },
        { text: '字母 a) b) c) 【一级】', value: 'lower', level: 1 },
        { text: '数字框 [1] [2] [3]【一级】', value: 'num-index', level: 0 },
        { text: '数字 1) 2) 3)【二级】', value: 'num', level: 2 },
        { text: '符号 ● 【二级】', value: 'circle', level: 2 },
        { text: '重置编号', cmd: 'restBulletNum' },
    ],
    // exportType: ['docx','wps'],							// 导出文档类型。默认导出['docx','wps','pdf']
    // 字体格式
    // font_formats: '宋体=simsun;黑体=SimHei;Times New Roman=times new roman',
    // 菜单栏
    menuBar: 'file edit insert pageElement levelStyle elementStyle Tools help',
    // 第一行工具栏
    toolbar1: 'undo redo | close-btn save | catalogue indexMarker | collect-chapter collect-unchapter | collect-list collect-level | paragraph-btn image freeDom link | table separateTable | math graphy | fontName fontSize forecolor backcolor | test1 quote',
    // 第二行工具栏
    toolbar2: 'example-btn zhu-btn zhu-imgtable footer-btn imgtitle tabletitle | quote-btn term quota references | comment | mergePage page-type pageLayout breakPage exportFile | alignment indent2em removeformat | code translate searchreplace fullscreen',
    // 快捷工具条
    quickbars: 'bold italic underline strikethrough superscript subscript',
    // 公式下拉菜单
    mathItems: ['custom', 'hand', 'number'], // 自定义 手写 编号
    // 上下文菜单
    contextmenu: 'undo redo | table | image | resetNumber | quickComment | translateStdName | quickTag',
    // 草稿箱轮询保存间隔，协同编写模式下则自动关闭草稿箱功能
    draftTimes: 30000,
    htmlContent: '', // 文档HTML内容
    outData: false, // 是否直接输出文档（题录信息、大纲结构和正文内容、及标签数据），不在编辑器中保存
    notTableHeader: false, // 续表需要续表表头与否
    // 工具栏扩展（编辑器只抛出事件，须在业务端操作）注意：如果添加了工具栏扩展须件event的名称添加在工具栏中 toobar1 或 toolbar2
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
    ],
}
