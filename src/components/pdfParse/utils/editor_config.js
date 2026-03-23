const appConfig = $appConfig[process.env.NODE_ENV]

export const editorConfig = {
    admin: true,
    author: {
        userId:'',
        userName: '',
        isAdmin: true,
        lockedAll: false
    },
    language: 'zh_CN',                      // 语言 默认en, 不设置则为zh_CN
    editorURL: appConfig.VUE_APP_EDITOR_URL,		// JAVA接口地址
    nodeURL: appConfig.VUE_APP_NODE_URL,		// nodeServer服务器地址
    pluginURL: appConfig.VUE_APP_PLUGIN_URL, // 外挂插件地址
    readonly: false,
    isStandard: true, // 是否为标准编写
    mergeDoc: false, // 文档初始化后是否自动合并正文
	saveXml: true,								// 导出文档的同时更新结构化文件数据
    chapter: ['6','8','9'], // 章节标识;用于目次数据的筛选
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
    browser: {
        // 版本号
        version: 96,
        // 下载连接地址 （内网系统可直接提供安装文件下载）
        url: 'https://www.baidu.com/s?wd=chrome',
        // 提示标题
        title: '浏览器兼容性提示',
        // 提示内容
        prompt: '非WebKit内核浏览器或版本过低，可能会引起编写错误！<br/>建议使用谷歌（chrome）浏览器！<br/>版本在 96 以上，点击<a href="https://www.baidu.com/s?wd=chrome" target="_blank" style="text-decoration: underline;">下载安装</a>',
        // 确定按钮文字内容
        confirmButtonText: '立即下载安装',
        // 取消按钮文字内容
        cancelButtonText: '暂不安装',
        // 下次进来是否再提示
        nextPrompt: true,
    },
    logo: require('@/assets/images/logo.png'),
    navShow: true,
    exportStruct: true, // 是否在保存数据时同时导出结构化数据
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
    // 菜单栏
    menuBar: 'file edit insert pageElement levelStyle elementStyle Tools help',
    // 第一行工具栏
    toolbar1: 'undo redo | close-btn save | catalogue setCatalogue indexMarker | insertCharacter collect-chapter collect-unchapter | collect-list collect-level | charmap-btn paragraph-btn image | table separateTable | math graphy | fontName fontSize forecolor backcolor | quoteClause',
    // 第二行工具栏
    toolbar2: 'example-btn zhu-btn zhu-imgtable footer-btn imgtitle tabletitle | quote-btn term | page-type pageLayout exportFile | alignment indent2em removeformat | code searchreplace fullscreen',
    // 快捷工具条
    quickbars: 'bold italic underline strikethrough superscript subscript',
    // 公式下拉菜单
    mathItems: ['custom', 'hand', 'number'], // 自定义 手写 编号
    // 上下文菜单
    contextmenu: 'undo redo | table | image | resetNumber | quickComment | translateStdName | quickTag',
    titleSpace: true,
    page: {
        expand: true,                               // 注意预览模式下及非自动word分页把此功能设为 false
        empty: false,                               // 是否需要封面后的空白页
        layout: 'singleSided',                      // 页面按单面方式布局
    },
    draftTimes: 0,
}

export const fontSize = ['42pt','36pt','28pt','21pt','18pt','15.75pt','14pt','12pt','10.5pt','9pt','7.875pt']

export const extendToolbar = [{
    text: '文档', // 按钮名称
    tooltip: '修正保存', // tooltip显示名
    event: 'docFile', // 事件名
    children: [{
        text: '修正保存', // 按钮名称
        tooltip: '修正保存', // tooltip显示名
        event: 'saveStruct', // 事件名
    },{
        text: '重新解析', // 按钮名称
        tooltip: '重新解析', // tooltip显示名
        event: 'refreshParse', // 事件名
    }]
},{
    text: '元素对齐',
    tooltip: '设置元素水平对齐',
    event: 'doxAlign',
    children: [{
        text: '水平居左',
        tooltip: '水平居左',
        event: 'alignLeft',
    },{
        text: '水平居中',
        tooltip: '水平居中',
        event: 'alignCenter',
    },{
        text: '水平居右',
        tooltip: '水平居右',
        event: 'alignRight',
    }]
},{
    text: '字体',
    tooltip: '设置字体',
    event: 'setFont',
    children: [{
        text: '宋体',
        tooltip: '宋体',
        event: 'simSun',
    },{
        text: '黑体',
        tooltip: '黑体',
        event: 'simHei',
    },{
        text: 'Times New Roman',
        tooltip: 'Times New Roman',
        event: 'Times',
    }]
},{
    text: '字号',
    tooltip: '设置字体大小',
    event: 'setSize',
    children: [{
        text: '初号',
        tooltip: '初号',
        event: 'size0',
    },{
        text: '小初号',
        tooltip: '小初号',
        event: 'size1',
    },{
        text: '一号',
        tooltip: '一号',
        event: 'size2',
    },{
        text: '二号',
        tooltip: '二号',
        event: 'size3',
    },{
        text: '小二号',
        tooltip: '小二号',
        event: 'size4',
    },{
        text: '三号',
        tooltip: '三号',
        event: 'size5',
    },{
        text: '四号',
        tooltip: '四号',
        event: 'size6',
    },{
        text: '小四号',
        tooltip: '小四号',
        event: 'size7',
    },{
        text: '五号',
        tooltip: '五号',
        event: 'size8',
    },{
        text: '小五号',
        tooltip: '小五号',
        event: 'size9',
    },{
        text: '六号',
        tooltip: '六号',
        event: 'size10',
    }]
}/* ,{
    text: '封面',
    tooltip: '设置标准封面信息',
    event: 'dataCover',
    children: [{
       text: '切换ICS',
       tooltip: '切换ICS样式',
       event: 'icsNumber',
    },{
       text: '切换CCS',
       tooltip: '切换CCS样式',
       event: 'ccsNumber',
    },{
       text: '切换标准抬头',
       tooltip: '切换标准抬头',
       event: 'stdTitle',
    },{
       text: '切换标准编号',
       tooltip: '切换标准编号',
       event: 'stdNo',
    },{
       text: '切换标准代替编号',
       tooltip: '切换标准代替编号',
       event: 'originStdNo',
    },{
       text: '切换标准名称',
       tooltip: '切换标准名称',
       event: 'stdName',
    },{
       text: '切换标准英文名称',
       tooltip: '切换标准英文名称',
       event: 'stdEnName',
    },{
       text: '切换发布日期',
       tooltip: '切换发布日期',
       event: 'publishDate',
    }]
} */,{
    text: '标签',
    tooltip: '切换标签',
    event: 'dataTag',
    children: [{
        text: '章条条款',
        tooltip: '切换章节条款样式',
        event: 'toggleLevel',
    },{
        text: '列项', // 按钮名称
        tooltip: '切换列项样式', // tooltip显示名
        event: 'toggleBullet', // 事件名
    },{
        text: '图标题', // 按钮名称
        tooltip: '切换图标题样式', // tooltip显示名
        event: 'toggleImgTitle', // 事件名
    },{
        text: '表标题', // 按钮名称
        tooltip: '切换表标题样式', // tooltip显示名
        event: 'toggleTableTitle', // 事件名
    }]
},{
    text: '合并行', // 按钮名称
    tooltip: '合并行', // tooltip显示名
    event: 'mergeElement', // 事件名
    children: [{
        text: '合并下一个元素',
        tooltip: '合并下一个元素',
        event: 'mergeElementNext'
    },{
        text: '全部自动合并行',
        tooltip: '全部自动合并行',
        event: 'mergeElementAll'
    }]
},{
    text: '输出', // 按钮名称
    tooltip: '输出及转换数据', // tooltip显示名
    event: 'exportData', // 事件名
    children: [{
        text: '输出到编辑器',
        tooltip: '输出到编辑器',
        event: 'exportStruct'
    },{
        text: '导出JSON',
        tooltip: '导出JSON',
        event: 'exportJson',
        disabled: true,
    },{
        text: '导出XML',
        tooltip: 'XML',
        event: 'exportXml',
        disabled: true,
    }]
}]
