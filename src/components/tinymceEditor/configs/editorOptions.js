export const consoleText = "██████╗ ███████╗████████╗ ██████╗ ███╗   ██╗\n" +
                 "██╔══██╗╚══███╔╝╚══██╔══╝██╔═══██╗████╗  ██║\n" +
                 "██████╔╝  ███╔╝    ██║   ██║   ██║██╔██╗ ██║\n" +
                 "██████╔╝  ███╔╝    ██║   ██║   ██║██╔██╗ ██║\n" +
                 "██╔══██╗ ███╔╝     ██║   ██║   ██║██║╚██╗██║\n" +
                 "██████╔╝███████╗   ██║   ╚██████╔╝██║ ╚████║\n" +
                 "╚═════╝ ╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═══╝"



export const outlineMenus = [
    {
        label:'前言',
        index:'1' ,
    },
    {
        label:'引言',
        index:'2',
    },
    {
        label:'章节',
        index:'3-6',
        children:[
            {label:'范围', index:'3' },
            {label:'规范性引用文件', index:'4' },
            {label:'术语和定义', index:'5' },
            {label:'其他章节', index:'6' },
        ]
    },
    {
        label:'附录章节',
        index:'8-9',
        children:[
            {label:'规范性', index:'8', level:0 },
            {label:'资料性', index:'9', level:1 }, // index:9
        ]
    },
    {
        label:'参考文献',
        index:'11',
    },
    {
        label:'索引',
        index:'12',
    },
];

export const hsMenus = [
	{
        label:'章节',
        index:'6',
    },
    {
        label:'附录',
        index:'8',
    },
]

export const readerEditorOptions = {
    env: process.env.NODE_ENV, 						// 编辑器运行的环境
    tp_i18n_langs: true, 							// 国际化
    author: {},
    // zoomIn: true, 								// 编辑器文档的放大缩小
    admin: true, 									// 是否管理员权限
    // 如果在开发环境下须配置以下接口路径地址
    editorURL: process.env.VUE_APP_EDITOR_URL, 		// JAVA接口地址 process.env.VUE_APP_EDITOR_URL
    nodeURL: process.env.VUE_APP_REMOTE_API, 		// nodeServer服务器地址 process.env.VUE_APP_REMOTE_API 'http://192.168.0.239:9001',
    textImgUrl: process.env.VUE_APP_TEXT_IMG_URL, 	// 文本文档中的图片路径
    readonly: false,								// 只读模式
    reader: true, 									// 阅读器模式
    isStandard: true, 								// 是否为标准编写
    mergeDoc: false, 								// 文档初始化后是否自动合并正文
    page: {
        expand: true, 								// 章节页面高度自动延展（协同编写模式下不支持false）
        id: '', 									// 文档的docId,编辑器初始化后自动按此ID加载、解析并渲染文档
        layout: 'singleSided',                      // 页面按单面方式布局
    },
    logo: require(`@/assets/images/logo.png`), 		// 编辑器菜单栏左侧的LOGO图标，src加载
    navShow: false, // 左侧导航栏显示与否，默认显示
    // openSidebar: true, // 默认打开左侧栏
    // hideSideBar: true,
    notSlot: true, // 是否不需要加载额外的组件(弹窗DMS的数据)
    showOutline: true, 
    // 字体格式
    // 菜单栏
    menuBar: '',
    // 第一行工具栏
    toolbar1: '',
    // 第二行工具栏
    toolbar2: '',
    // 快捷工具条
    quickbars: '',
    // 上下文菜单
    contextmenu: '',
    quickbars_selection_toolbar: false,
    // 草稿箱轮询保存间隔，协同编写模式下则自动关闭草稿箱功能
    draftTimes: 0,
    htmlContent: '', // 文档HTML内容 <div class="page-container reader"><div class="info-block"><p>正在加载文档...</p></div></div>
}

export const editorConfig = {
    admin: true,								// 超级管理
    tp_i18n_langs: true, 						// 国际化
	author: {
        userId: '',
        userName: '',
        commitId: '',
        isAdmin: true,                      	// 是否为管理员（可编辑大纲）
        lockedAll: false,                    	// 协同模式下默认全不锁定
    },
    style: 'commons',                             // 样式
    normal: false,
	private: false,								// 私有
    innerSys: false,                         	// 内网系统
    fullScreen: true,
    setTemplate: false,
    isStandard: true,                           // 是否为标准编写
    mergeDoc: false,                            // 文档初始化后是否自动合并正文
    chapter: ['6','8','9'],                     // 章节标识;用于目次数据的筛选
    fixed: [],                                  // 固定某些章节不能修改和删除(前言、范围、规范性引用文件、术语和定义)[1, 2, 3, 4, 5]
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
	// 页面布局
    page: {
        size: 'A4',
        width: '210mm',
        height: '297mm',
        padding: '20mm 25mm 20mm 20mm',
        layout: 'doubleSided',
        number: 'Q/CY 100—2021'
    },
	// 图标
    logo: require(`@/assets/images/logo.png`),
	// 显示导航栏
    navShow: true,
	// 是否在保存数据时同时导出结构化数据
    exportStruct: true,
    // 菜单内容
    menu: {
        file: { title: 'File', items: 'newStandard openFile | save saveAs | searchreplace preview print | exportFile | close-btn' },
        edit: { title: 'Edit', items: 'undo redo | cut copy paste | searchreplace' },
        insert: { title: 'Insert', items: 'charmap | paragraph-btn image inserttable | math graphy | hr' },
        pageElement: { title:'pageElement', items:'cover catalogue prefaceWord introWord addendixWord referenceWord | indexWord indexMarker | page-type' },
        levelStyle: { title:'levelStyle', items:'chapterTitle | chapter1 chapter2 chapter3 chapter4 chapter5 | notTitle1 notTitle2 notTitle3 notTitle4 notTitle5 | list1 list2 list3 list4 list5 list6 list7' },
        Tools: { title: 'Tools', items: 'validatDms readDoc knowledgeGraph | translate' },
        importFile: { title:'importFile', items: 'importWord importCloud' },
        help: { title: 'Help', items: 'help concatus | bzt-ver upgrade' }
    },
    // 菜单栏
    menuBar: 'file importFile edit insert pageElement levelStyle elementStyle Tools help',
    // 第一行工具栏
    toolbar1: 'undo redo | close-btn save saveAs | catalogue indexMarker | collect-chapter collect-unchapter | collect-list collect-level | paragraph-btn image | table separateTable | math graphy | test1 quote',
    // 第二行工具栏
    toolbar2: 'example-btn zhu-btn zhu-imgtable footer-btn imgtitle tabletitle | quote-btn term quota references | comment | page-type pageLayout exportFile |  alignment indent2em | translate searchreplace preview fullscreen | code mergePage breakPage pageSplit | pagebreak print',
    // 快捷工具条
    quickbars: 'bold italic underline strikethrough superscript subscript',
    // 公式下拉菜单
    mathItems: ['custom','hand','number'], // 自定义 手写 编号
    // 上下文菜单
    contextmenu: 'undo redo | table | image | resetNumber | quickComment | translateStdName | quickTag',
	// 草稿箱轮询间隔
    draftTimes: 30000,
	// 自定义列项
    bullets: [
        {text:'列项——[一级]', value: 'line', level:1},
        {text:'字母a)b)c)[一级]', value: 'lower', level:1},
        {text:'数字1)2)3)[二级]', value: 'num', level:2},
        {text:'符号●[二级]', value: 'circle', level:2},
        {text:'重置编号', cmd: 'restBulletNum'},
    ],
	// 扩展工具条，仅定义按钮，事件抛出后自行处理
    extendToolbar: [
        {
            text:'测试标签',
            tooltip:'测试1',
            event:'test1',
            children:[
                {
                    text:'自定义标签',
                    tooltip:'自定义标签',
                    showType: 'dialog',					// 弹窗模式
                    dialogWidth: '400px',				// 弹窗宽度，不填写默认500px
                    event:'customeTag'
                },
                {
                    text:'移除标签',
                    tooltip:'移除标签',
                    showType: 'remove',
                    event:'customeTag'
                }
            ]
        },
        {
            text:'外部引用',
            tooltip:'外部引用',
            event:'quote',
            children:[
                {
                    text:'术语',
                    tooltip:'术语',
                    showType: 'slot',					// 插槽模式
                    event:'term',
                    tagTreeId: '100'
                }
            ]
        },
    ],
    htmlContent: ``
};

export const styleccs = '';

export const pagePadding = {
    left: '35mm 25mm 20mm 20mm',
    right: '35mm 20mm 20mm 25mm'
}
export const pageLayout = {
    'A4': {
        width: '210mm',
        height: '297mm'
    },
    'A3': {
        width: '297mm',
        height: '420mm'
    }
}
export const fontSize = {
	"一号":'28pt',
	"二号":'21pt',
	"小二号":'18pt',
	"三号":'15.75pt',
	"四号":'14pt',
	"小四号":'12pt',
	"五号":'10.5pt',
	"小五号":'9pt',
	"六号":'7.875pt'
}

export const docVersion = [
    { label:'草案稿', value:1 },
    { label:'征求意见稿', value:2 },
    { label:'送审稿', value:3 },
    { label:'报批稿', value:4 }
]

export const catalogueTypes = [
    {key:'leve11', label:'一级条标题', value:false},
    {key:'leve12', label:'二级条标题', value:false},
    {key:'leve13', label:'三级条标题', value:false},
    {key:'leve14', label:'四级条标题', value:false},
    {key:'leve15', label:'五级条标题', value:false},
    {key:'appendix0', label:'附录章标题', value:false},
    {key:'appendix1', label:'附录一级条标题', value:false},
    {key:'appendix2', label:'附录二级条标题', value:false},
    {key:'appendix3', label:'附录三级条标题', value:false},
    {key:'appendix4', label:'附录四级条标题', value:false},
    {key:'appendix5', label:'附录五级条标题', value:false},
    {key:'imgTitle', label:'图标题', value:false},
    {key:'tableTitle', label:'表标题', value:false}
]

export const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

export const numberChar = {
    roma: ['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ','Ⅺ','Ⅻ','XIII','XIV','XV','XVI','XVII','XVII','XIX','XX'],
    lower: ['a','b','c','d','e','f','g','h','i','j','k','l','m','n']
}

export const feedbackTypes = [
    { label: '采纳', value:1 },
    { label: '部分采纳', value:2 },
    { label: '不采纳', value:3 },
]

export const outlineTypes = [
    { type:1, label:'前言', orderNum:0, infoNum:0, value:'preface' },
    { type:2, label:'引言', orderNum:1, infoNum:1, value:'intro' },
    { type:3, label:'范围', orderNum:2, infoNum:2, value:'range' },
    { type:3, label:'总则', orderNum:2, infoNum:2, value:'range' },
    { type:4, label:'规范性引用文件', orderNum:3, infoNum:3, value:'normative' },
    { type:5, label:'术语和定义', orderNum:4, infoNum:4, value:'term' },
    { type:6, label:'其他章节', orderNum:5, infoNum:5, value:'chapter' },
    { type:7, label:'章节条目', orderNum:6, infoNum:6 },
    { type:8, label:'附录章节-规范性', orderNum:7, infoNum:7 },
    { type:9, label:'附录章节-资料性', orderNum:8, infoNum:8 },
    { type:10, label:'附录条目', orderNum:9, infoNum:9 },
    { type:11, label:'参考文献', orderNum:100, infoNum:100, value:'literature' },
    { type:12, label:'索引', orderNum:200, infoNum:200, value:'index' },
    { type:13, label:'空页面', orderNum:300, infoNum:300 },
    { type:999, label:'章节标题', orderNum:999, infoNum:999 }
];

export const modelTypes = [
	{
		label:"按样式",
		id:1,
		pid:0,
		typeName: 'style',
		children:[
			{ label:"国家标准", stdKing:1100, pid:1, id:1 },
			{ label:"行业标准", stdKing:1200, pid:1, id:2 },
			{ label:"地方标准", stdKing:6, pid:1, id:3 },
			{ label:"团体标准", stdKing:1500, pid:1, id:4 },
			{ label:"企业标准", stdKing:1400, pid:1, id:5 },
		]
	},
	{
		label:"按对象",
		id:2,
		pid:1,
		typeName: 'object',
		children: [
			{ label:"产品标准", pid:2, id:1 },
			{ label:"过程标准", pid:2, id:2 },
			{ label:"服务标准", pid:2, id:3 }
		]
	},
	{
		label:"按功能",
		id:3,
		pid:1,
		typeName: 'domain',
		children: [
			{ label:"术语标准", pid:3, id:1 },
			{ label:"符号标准", pid:3, id:2 },
			{ label:"分类标准", pid:3, id:3 },
			{ label:"试验标准", pid:3, id:4 },
			{ label:"规范标准", pid:3, id:5 },
			{ label:"规程标准", pid:3, id:6 },
			{ label:"指南标准", pid:3, id:7 },
		]
	},
	{
		label:"按目的",
		id:4,
		pid:1,
		typeName: 'aim',
		children: [
			{ label:"基础标准", pid:4, id:1 },
			{ label:"技术标准", pid:4, id:2 },
			{ label:"公益标准", pid:4, id:3 }
		]
	},
];

export const guidingLans = [
	{ outlineType:1, label:'前言', html:'<p style="text-indent: 2em;">本文件按照GB/T 1.1-2020《标准化工作导则 第1部分：标准化文件的结构和起草规则》的规定起草。</p><p style="text-indent: 2em;">本文件由XXX公司提出并归口。</p><p style="text-indent: 2em;">本文件起草单位：XXX公司YYY部门。</p><p style="text-indent: 2em;">本标准主要起草人：</p>' },
	{ outlineType:2, label:'引言', html:'<p style="text-indent: 2em;">请输入引言内容。</p>' },
	{ outlineType:3, label:'范围', html:'<p style="text-indent: 2em;">本标准规定了……。</p><p style="text-indent: 2em;">本标准适用于……。</p>' },
	{ outlineType:4, label:'规范性引用文件', html:'<p style="text-indent: 2em;">下列文件中的内容通过文中的规范性引用而构成本文件必不可少的条款……。</p>' },
	{ outlineType:5, label:'术语和定义', html:'<p style="text-indent: 2em;">下列术语和定义适用于本标准。</p>' },
	{ outlineType:11, label:'参考文献', html:'<p style="text-indent: 2em;">请输入参考文献内容……。</p>' },
	{ outlineType:12, label:'索引', html:'<p style="text-indent: 2em;">请输入索引内容……。</p>' },
];

const outlineTemp = {
	ancestors: '1',
	outlineId: '1',
	outlineTitle: '我的标准文档',
	parentId: '0',
	isVisible: 1,
	orderNum: 0,
	children: [
		{
			ancestors:'1,2',
			content: null,
			isVisible: 1,
			levelNum: 1,
			orderNum: 0,
			outlineId: '2',
			outlineTitle: '前言',
			outlineType: 1,
			parentId: '1'
		},
		/*{
			ancestors:'1,3',
			content: null,
			isVisible: 1,
			levelNum: 1,
			orderNum: 1,
			outlineId: '3',
			outlineTitle: "引言",
			outlineType: 2,
			parentId: '1'
		},*/
		{
			ancestors:'1,4',
			content: null,
			isVisible: 1,
			levelNum: 1,
			orderNum: 2,
			outlineCatalog: 1,
			outlineId: '4',
			outlineTitle: "范围",
			outlineType: 3,
			parentId: '1'
		},
		{
			ancestors:'1,5',
			content: null,
			isVisible: 1,
			levelNum: 1,
			orderNum: 3,
			outlineCatalog: 2,
			outlineId: '5',
			outlineTitle: "规范性引用文件",
			outlineType: 4,
			parentId: '1'
		},
		{
			ancestors:'1,6',
			content: null,
			isVisible: 1,
			levelNum: 1,
			orderNum: 4,
			outlineCatalog: 3,
			outlineId: '6',
			outlineTitle: "术语和定义",
			outlineType: 5,
			parentId: '1'
		},
		{
			ancestors:'1,7',
			content: null,
			isVisible: 1,
			levelNum: 1,
			orderNum: 5,
			outlineCatalog: 4,
			outlineId: '7',
			outlineTitle: "其他章节",
			outlineType: 6,
			parentId: '1'
		},
		{
			ancestors:'1,7',
			content: null,
			isVisible: 1,
			levelNum: 1,
			orderNum: 100,
			outlineId: '7',
			outlineTitle: "参考文献",
			outlineType: 11,
			parentId: '1'
		},

	]

}

export const coverData = {
    ics: '01.1299040',
    ccs: 'A 00123',
    typeTitle: '中华人民共和国国家标准',
    mainUtil: '中华人民共和国国家质量监督总局',
    otherUtil: '中国国家标准化管理委员会',
    docType: 'GB/T',
    docNo: '2021-11-09.002',
    insteadNo: 'GB/T 2010.001',
    stdName: '关于润申标准化编辑器使用指南',
    enName: 'English translation of standard name',
    tagContent: 'Version 0.0.1',
    publishDate: '2012-11-30',
    putDate: '2021-12-30',
    htmlContent: `
        <div class="info-block cover disabled fixed" style="width: 210mm; height: 297mm; padding: 10mm 20mm 20mm 25mm;">
			<div class="ics-ccs">
				<p class="ics" contenteditable="true"><span class="tag other" data-tag="ics">{@ICS}</span></p>
				<p class="ccs" contenteditable="true">{@CCS}</p>
			</div>
			<div class="icon_gb">
				<img style="width: 40mm; height: 20mm;" src="{@cover_gb}/files/images/cover_gb.png" />
			</div>
			<h1 class="title" contenteditable="true">{@typeTitle}</h1>
			<div class="numbers">
				<p class="tt gb" contenteditable="true">{@stdNo}</p>
				<p class="instead" contenteditable="true" style="display:{@dispalyInstead}">{@origStdNo}</p>
			</div>
			<hr class="title-hr" size="1" />
			<div class="content std-name" contenteditable="true">{@stdName}</div>
			<div class="en-content en-name" contenteditable="true">{@stdNameEn}</div>
			<div class="tag-content" contenteditable="true">{@tagContent}</div>
			<div class="footer-publish" contenteditable="true">{@publishDate}</div>
			<div class="footer-put" contenteditable="true">{@putDate}</div>
			<hr class="footer-hr" />
			<div class="footer-table">
				<table class="noborder" style="width: 100%; border-width: 0px!important; height: 72px;">
					<colgroup>
						<col style="width: 76.9766%;"/>
						<col style="width: 22.705%;"/>
					</colgroup>
					<tbody>
						<tr style="height: 36px;">
							<td style="border-width: 0px; text-align: center; vertical-align: middle;  height: 36px;">
								<p  contenteditable="true" class="main-util" style="font-family: simSun; font-size: 18pt; font-weight: bold; line-height: 1.5; text-align: center; white-space: nowrap; padding: 0; ">
									{@department}
								</p>
							</td>
							<td style="border-width: 0px; text-align: center; vertical-align: middle; height: 72px;">
								<p class="util-put" style="font-family: simHei; font-size: 16pt;">发布</p>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
    `,

}
export const stdKinds = [
	{
		type:0,
		label:'空白文档',
		img:'cover/empty.png',
		docType: '',
		typeTitle: '文档标题',
		docData: {
			"docId": "0000-000",
			"stdCategory": 1,
			"stdEdition": "v1.0",
			"stdKind": 0,
			"docType": "",
			"stdNo": "",
			"stdName": "文档名称定义",
			"stdNameEn": "English Name",
			"stdTitle": "",
			"releaseDepartment": "润申标准化信息技术（上海）有限公司"
		},
		outline: {
			ancestors: '1',
            outlineId: '1',
            parentId: '0',
			outlineTitle: '文档主题名称',
			isVisible: 1,
			orderNum: 0,
			outlineType: 13,
			children:[
				{
					ancestors:'1,2',
					content: null,
					isVisible: 1,
					levelNum: 1,
					orderNum: 300,
					outlineId: '2',
					outlineTitle: '页面',
					outlineType: 13,
					parentId: '1'
				}
			]
		},
		htmlContent: `
			<div class="info-block cover fixed" title="封面" style="width: 210mm; height: 297mm; padding: 10mm 20mm 20mm 25mm;">
				<div class="content">
					<p class="std-name" contenteditable="true">{@stdName}</p>
					<p class="en-name" contenteditable="true">{@stdNameEn}</p>
					<p class="tag-content" contenteditable="true">{@stdEdition}</p>
				</div>
				<hr class="footer-hr" />
				<div class="footer-table">
					<div class="uc main-util" contenteditable="true">{@releaseDepartment}</div>
					<div class="ub" contenteditable="false">发布</div>
				</div>
			</div>
		`,
	},
	{
		type:999,
		label:'自由文档',
		img:'cover/empty.png',
		docType: '',
		typeTitle: '文档标题',
		docData: {
			"docId": "0000-000",
			"stdCategory": 1,
			"stdEdition": "v1.0",
			"stdKind": 999,
			"docType": "",
			"stdNo": "",
			"stdName": "文档名称定义",
			"stdNameEn": "English Name",
			"stdTitle": "",
			"releaseDepartment": "润申标准化信息技术（上海）有限公司"
		},
		outline: {
			ancestors: '1',
            outlineId: '1',
            parentId: '0',
			outlineTitle: '文档主题名称',
			isVisible: 1,
			orderNum: 0,
			outlineType: 13,
			children:[
				{
					ancestors:'1,2',
					content: null,
					isVisible: 1,
					levelNum: 1,
					orderNum: 300,
					outlineId: '2',
					outlineTitle: '页面',
					outlineType: 13,
					parentId: '1'
				}
			]
		},
		htmlContent: `<div class="info-block"><p>这里是文档内容</p></div>`,
	},
	{
        type:1100,
        label:'国家标准',
        img:'cover/GB.png',
		docType: 'GB/T',
		typeTitle: '中华人民共和国国家标准',
        docData: {
            "docId": "0000-000",
            "ccsNumber": "xxx.xxx",
            "consistentSign": "与国际标准一致性程度的标识",
            "stdEdition": "测试版本Ver1.0",
            "icsNumber": "xxx.xxx",
            "stdCategory": 1,
            "stdKind": 1100,
            "stdSign": "GB/T",
            "stdName": "标准名称定义",
            "stdNameEn": "English Name",
            "stdNo": "XX—2022",
            "origStdNo": "GB/T XX—XXXX",
            "stdPerformDate": "2021-11-30",
            "stdPublishDate": "2021-12-30",
            "stdTitle": "中华人民共和国国家标准",
            "releaseDepartment": "国家市场监督管理总局,国家标准化管理委员会"
        },
        outline: outlineTemp,
		htmlContent: `
			<div class="info-block cover fixed" title="封面" style="width: 210mm; height: 297mm; padding: 10mm 20mm 20mm 25mm;">
				<div class="ics-ccs">
					<p class="ics" contenteditable="false" title="ICS"><span contenteditable="true" class="tag other" data-tag="ics" data-title="ICS">{@ICS}</span></p>
					<p class="ccs" contenteditable="false" title="CCS"><span contenteditable="true" class="tag other" data-tag="ccs" data-title="CCS">{@CCS}</span></p>
				</div>
				<div class="icon icon_gb" data-icon="gb" contenteditable="false">
					<img style="width: 40mm; height: 20mm;" crossOrigin="anonymous" src="{@cover_gb}/files/images/cover_gb.png" />
				</div>
				<h1 class="title gb">{@stdTitle}</h1>
				<div class="numbers">
					<p class="tt gb" contenteditable="true" data-sign="{@stdSign}">{@stdNo}</p>
					<p class="instead" contenteditable="true" style="display:{@dispalyInstead}">{@origStdNo}</p>
				</div>
				<hr class="title-hr" size="1" />
				<div class="content">
					<p class="std-name" contenteditable="true">{@stdName}</p>
					<p class="en-name" contenteditable="true">{@stdNameEn}</p>
					<p class="sign-name" contenteditable="true">{@consistentSign}</p>
					<p class="tag-content" contenteditable="true">{@stdEdition}</p>
				</div>
				<div class="footer-publish" contenteditable="true">{@stdPublishDate}</div>
				<div class="footer-put" contenteditable="true">{@stdPerformDate}</div>
				<hr class="footer-hr" />
				<div class="footer-table">
					<div class="uc main-util" contenteditable="true">{@releaseDepartment}</div>
					<div class="ub" contenteditable="false">发布</div>
				</div>
			</div>
		`,
    },
    {
        type:7,
        label:'指导性技术文件',
        img:'cover/GB.png',
    	docType: 'GB/Z',
    	typeTitle: '中华人民共和国国家标准化指导性技术文件',
        docData: {
            "docId": "0000-000",
            "ccsNumber": "xxx.xxx",
            "consistentSign": "与国际标准一致性程度的标识",
            "stdEdition": "测试版本Ver1.0",
            "icsNumber": "xxx.xxx",
            "stdCategory": 1,
            "stdKind": 1100,
            "stdSign": "GB/T",
            "stdName": "标准名称定义",
            "stdNameEn": "English Name",
            "stdNo": "XX—2022",
            "origStdNo": "GB/T XX—XXXX",
            "stdPerformDate": "2021-11-30",
            "stdPublishDate": "2021-12-30",
            "stdTitle": "中华人民共和国国家标准",
            "releaseDepartment": "国家市场监督管理总局,国家标准化管理委员会"
        },
        outline: outlineTemp,
    	htmlContent: `
    		<div class="info-block cover fixed" title="封面" style="width: 210mm; height: 297mm; padding: 10mm 20mm 20mm 25mm;">
    			<div class="ics-ccs">
    				<p class="ics" contenteditable="false" title="ICS"><span contenteditable="true" class="tag other" data-tag="ics" data-title="ICS">{@ICS}</span></p>
    				<p class="ccs" contenteditable="false" title="CCS"><span contenteditable="true" class="tag other" data-tag="ccs" data-title="CCS">{@CCS}</span></p>
    			</div>
    			<div class="icon icon_gb" data-icon="gb" contenteditable="false">
    				<img style="width: 40mm; height: 20mm;" crossOrigin="anonymous" src="{@cover_gb}/files/images/cover_gb.png" />
    			</div>
    			<h1 class="title gb">{@stdTitle}</h1>
    			<div class="numbers">
    				<p class="tt gb" contenteditable="true" data-sign="{@stdSign}">{@stdNo}</p>
    				<p class="instead" contenteditable="true" style="display:{@dispalyInstead}">{@origStdNo}</p>
    			</div>
    			<hr class="title-hr" size="1" />
    			<div class="content">
    				<p class="std-name" contenteditable="true">{@stdName}</p>
    				<p class="en-name" contenteditable="true">{@stdNameEn}</p>
    				<p class="sign-name" contenteditable="true">{@consistentSign}</p>
    				<p class="tag-content" contenteditable="true">{@stdEdition}</p>
    			</div>
    			<div class="footer-publish" contenteditable="true">{@stdPublishDate}</div>
    			<div class="footer-put" contenteditable="true">{@stdPerformDate}</div>
    			<hr class="footer-hr" />
    			<div class="footer-table">
    				<div class="uc main-util" contenteditable="true">{@releaseDepartment}</div>
    				<div class="ub" contenteditable="false">发布</div>
    			</div>
    		</div>
    	`,
    },
    {
        type:1200,
        label:'行业标准',
        img:'cover/HB.png',
		docType: 'HB/T',
		typeTitle: '中华人民共和国XX行业标准',
		docData: {
            "docId": "0000-000",
            "ccsNumber": "xxx.xxx",
            "consistentSign": "与国际标准一致性程度的标识",
            "stdEdition": "测试版本Ver1.0",
            "icsNumber": "xxx.xxx",
            "stdCategory": 1,
            "stdKind": 1200,
            "stdSign": "XX",
            "stdName": "标准名称定义",
            "stdNameEn": "English Name",
            "stdNo": "XX—2022",
            "origStdNo": "XX XX—XXXX",
            "stdPerformDate": "2021-11-30",
            "stdPublishDate": "2021-12-30",
            "stdTitle": "XX行业标准",
            "releaseDepartment": "XXXX行业部委"
        },
		outline: outlineTemp,
		htmlContent: `
			<div class="info-block cover fixed" title="封面" style="width: 210mm; height: 297mm; padding: 10mm 20mm 20mm 25mm;">
				<div class="ics-ccs">
					<p class="ics" contenteditable="true" title="ICS">{@ICS}</p>
					<p class="ccs" contenteditable="true" title="CCS">{@CCS}</p>
				</div>
				<div class="icon hb std-sign" data-icon="qb" contenteditable="false">{@stdSign}</div>
				<h1 class="title hb" contenteditable="true">{@stdTitle}</h1>
				<div class="numbers">
					<p class="tt ttb" contenteditable="true" data-sign="{@stdSign}">{@stdNo}</p>
					<p class="instead" contenteditable="true" style="display:{@dispalyInstead}">{@origStdNo}</p>
				</div>
				<hr class="title-hr" size="1" />
				<div class="content">
					<p class="std-name" contenteditable="true">{@stdName}</p>
					<p class="en-name" contenteditable="true">{@stdNameEn}</p>
					<p class="sign-name" contenteditable="true">{@consistentSign}</p>
					<p class="tag-content" contenteditable="true">{@stdEdition}</p>
				</div>
				<div class="footer-publish" contenteditable="true">{@stdPublishDate}</div>
				<div class="footer-put" contenteditable="true">{@stdPerformDate}</div>
				<hr class="footer-hr" />
				<div class="footer-table">
					<div class="uc main-util" contenteditable="true">{@releaseDepartment}</div>
					<div class="ub" contenteditable="false">发布</div>
				</div>
			</div>
		`,
    },
    {
        type:6,
        label:'地方标准',
        img:'cover/DB.png',
		docType: 'DB/T',
		typeTitle: 'XXX地方标准',
		docData: {
            "docId": "0000-000",
            "ccsNumber": "xxx.xxx",
            "consistentSign": "与国际标准一致性程度的标识",
            "stdEdition": "测试版本Ver1.0",
            "icsNumber": "xxx.xxx",
            "stdCategory": 1,
            "stdKind": 6,
            "stdSign": "DBXX/T",
            "stdName": "标准名称定义",
            "stdNameEn": "English Name",
            "stdNo": "XX—2022",
            "origStdNo": "DBXX/T XX—XXXX",
            "stdPerformDate": "2021-11-30",
            "stdPublishDate": "2021-12-30",
            "stdTitle": "XXX地方标准",
            "releaseDepartment": "XXX市场监督管理局"
        },
		outline: outlineTemp,
		htmlContent: `
			<div class="info-block cover fixed" style="width: 210mm; height: 297mm; padding: 10mm 20mm 20mm 25mm;">
				<div class="ics-ccs">
					<p class="ics" contenteditable="true" title="ICS">{@ICS}</p>
					<p class="ccs" contenteditable="true" title="CCS">{@CCS}</p>
				</div>
				<div class="icon db std-sign" data-icon="qb" contenteditable="false">{@stdSign}</div>
				<h1 class="title" contenteditable="true">{@stdTitle}</h1>
				<div class="numbers">
					<p class="tt ttb" contenteditable="true" data-sign="{@stdSign}">{@stdNo}</p>
					<p class="instead" contenteditable="true" style="display:{@dispalyInstead}">{@origStdNo}</p>
				</div>
				<hr class="title-hr" size="1" />
				<div class="content">
					<p class="std-name" contenteditable="true">{@stdName}</p>
					<p class="en-name" contenteditable="true">{@stdNameEn}</p>
					<p class="sign-name" contenteditable="true">{@consistentSign}</p>
					<p class="tag-content" contenteditable="true">{@stdEdition}</p>
				</div>
				<div class="footer-publish" contenteditable="true">{@stdPublishDate}</div>
				<div class="footer-put" contenteditable="true">{@stdPerformDate}</div>
				<hr class="footer-hr" />
				<div class="footer-table">
					<div class="uc main-util" contenteditable="true">{@releaseDepartment}</div>
					<div class="ub" contenteditable="false">发布</div>
				</div>
			</div>
		`,
    },
    {
        type:1500,
        label:'团体标准',
        img:'cover/TB.png',
		docType: 'T/XX',
		typeTitle: 'XXX团体标准',
		docData: {
            "docId": "0000-000",
            "ccsNumber": "xxx.xxx",
            "icsNumber": "xxx.xxx",
            "consistentSign": "与国际标准一致性程度的标识",
            "stdEdition": "测试版本Ver1.0",
            "stdCategory": 1,
            "stdKind": 1500,
            "stdSign": "T/XX",
            "stdName": "标准名称定义",
            "stdNameEn": "English Name",
            "stdNo": "XX—2022",
            "origStdNo": "T/XX XX—XXXX",
            "stdPerformDate": "2021-11-30",
            "stdPublishDate": "2021-12-30",
            "stdTitle": "XXX团体标准",
            "releaseDepartment": "XXXX团体"
        },
		outline: outlineTemp,
		htmlContent: `
			<div class="info-block cover fixed" style="width: 210mm; height: 297mm; padding: 10mm 20mm 20mm 25mm;">
				<div class="ics-ccs">
					<p class="ics" contenteditable="true" title="ICS">{@ICS}</p>
					<p class="ccs" contenteditable="true" title="CCS">{@CCS}</p>
				</div>
				<div class="icon tb std-sign" data-icon="qb" contenteditable="false">{@stdSign}</div>
				<h1 class="title" contenteditable="true">{@stdTitle}</h1>
				<div class="numbers">
					<p class="tt ttb" contenteditable="true" data-sign="{@stdSign}">{@stdNo}</p>
					<p class="instead" contenteditable="true" style="display:{@dispalyInstead}">{@origStdNo}</p>
				</div>
				<hr class="title-hr" size="1" />
				<div class="content">
					<p class="std-name" contenteditable="true">{@stdName}</p>
					<p class="en-name" contenteditable="true">{@stdNameEn}</p>
					<p class="sign-name" contenteditable="true">{@consistentSign}</p>
					<p class="tag-content" contenteditable="true">{@stdEdition}</p>
				</div>
				<div class="footer-publish" contenteditable="true">{@stdPublishDate}</div>
				<div class="footer-put" contenteditable="true">{@stdPerformDate}</div>
				<hr class="footer-hr" />
				<div class="footer-table">
					<div class="uc main-util" contenteditable="true">{@releaseDepartment}</div>
					<div class="ub" contenteditable="false">发布</div>
				</div>
			</div>
		`,
    },
    {
        type:1400,
        label:'企业标准',
        img:'cover/QB.png',
		docType: 'Q/CY',
		typeTitle: 'XX公司企业标准',
		docData: {
            "docId": "0000-000",
            "ccsNumber": "xxx.xxx",
            "icsNumber": "xxx.xxx",
            "consistentSign": "与国际标准一致性程度的标识",
            "stdEdition": "测试版本Ver1.0",
            "stdCategory": 1,
            "stdKind": 1400,
            "stdSign": "Q/XX",
            "stdName": "标准名称定义",
            "stdNameEn": "English Name",
            "stdNo": "XX—2022",
            "origStdNo": "Q/XX XX—XXXX",
            "stdPerformDate": "2021-11-30",
            "stdPublishDate": "2021-12-30",
            "stdTitle": "'XX公司企业标准",
            "releaseDepartment": "润申标准化信息技术（上海）有限公司"
        },
		outline: outlineTemp,
		htmlContent: `
			<div class="info-block cover fixed" title="封面" style="width: 210mm; height: 297mm; padding: 10mm 20mm 20mm 25mm;">
				<div class="ics-ccs">
					<p class="ics" contenteditable="true" title="ICS">{@ICS}</p>
					<p class="ccs" contenteditable="true" title="CCS">{@CCS}</p>
				</div>
				<div class="icon qb std-sign" data-icon="qb" contenteditable="false">{@stdSign}</div>
				<h1 class="title" contenteditable="true">{@stdTitle}</h1>
				<div class="numbers">
					<p class="tt ttb" contenteditable="true" data-sign="{@stdSign}">{@stdNo}</p>
					<p class="instead" contenteditable="true" style="display:{@dispalyInstead}">{@origStdNo}</p>
				</div>
				<hr class="title-hr" size="1" />
				<div class="content">
					<p class="std-name" contenteditable="true">{@stdName}</p>
					<p class="en-name" contenteditable="true">{@stdNameEn}</p>
					<p class="sign-name" contenteditable="true">{@consistentSign}</p>
					<p class="tag-content" contenteditable="true">{@stdEdition}</p>
				</div>
				<div class="footer-publish" contenteditable="true">{@stdPublishDate}</div>
				<div class="footer-put" contenteditable="true">{@stdPerformDate}</div>
				<hr class="footer-hr" />
				<div class="footer-table">
					<div class="uc main-util" contenteditable="true">{@releaseDepartment}</div>
					<div class="ub" contenteditable="false">发布</div>
				</div>
			</div>
		`,
		cover: `
            <div class="ics-ccs">
                <p class="ics" title="ICS编号"><span contenteditable="true" class="tag other" data-tag="icsNumber" data-name="ICS编号"></span></p>
                <p class="ccs" title="CCS编号"><span contenteditable="true" class="tag other" data-tag="ccsNumber" data-name="CCS编号"></span></p>
            </div>
            <div class="icon qb std-sign" data-icon="qb">
                <span contenteditable="true" class="tag other stdSign" data-tag="stdSign" data-name="标准标志">Q/XXXX</span>
            </div>
            <h1 class="title qb tag other stdTitle" contenteditable="true" data-tag="stdTitle" data-name="XXXX企业标准">XXXX企业标准</h1>
            <div class="numbers">
                <p class="tt gb">
                    <span contenteditable="true" class="tag other" data-tag="stdSign" data-name="Q/XXXX">Q/XXX</span>
                    <span contenteditable="true" class="tag other" data-tag="stdVer" data-name="顺序号">顺序号</span>
                    <span contenteditable="true" class="tag other" data-tag="stdNo" data-name="年代号">年代号</span>
                </p>
                <p class="instead" style="margin-top:5px;">
                    <span contenteditable="true" class="tag other origStdNo" data-tag="origStdNo" data-name="修订原标准编号"></span>
                </p>
            </div>
            <hr class="title-hr" size="1" />
            <div class="content">
                <p class="std-name">
                    <span contenteditable="true" class="tag other stdName" data-tag="stdName" data-name="标准名称"></span>
                </p>
                <p class="en-name">
                    <span contenteditable="true" class="tag other stdNameEn" data-tag="stdNameEn" data-name="标准英文译名"></span>
                </p>
                <p class="tag-content std-edition">
                    <span contenteditable="true" class="tag other stdEdition" data-tag="stdEdition" data-name="草案版次"></span>
                </p>
                <p class="tag-updatetime date-time">
                    <span contenteditable="true" class="tag other updateTime" data-tag="updateTime" data-name="草案完成时间"></span>
                </p>
            </div>
            <div class="footer-publish date-time">
                <span contenteditable="true" class="tag other stdPublishDate" data-tag="stdPublishDate" data-name="发布时间"></span>
            </div>
            <div class="footer-put date-time">
                <span contenteditable="true" class="tag other stdPerformDate" data-tag="stdPerformDate" data-name="实施时间"></span>
            </div>
            <hr class="footer-hr" />
            <div class="footer-table">
                <div class="uc main-util">
                    <p>
                        <span contenteditable="true" class="tag other releaseDepartment" data-tag="releaseDepartment" data-name="主发布单位">XXX企业</span>
                    </p>
                </div>
                <div class="ub" contenteditable="false">发布</div>
            </div>
		`,
		preface: `
			<div class="header-title"><p>前&nbsp; &nbsp; 言</p></div>
			<p style="text-indent: 2em;">请输入内容。</p>
        `,
		intro: `
			<div class="header-title"><p>引&nbsp; &nbsp; 言</p></div>
			<p style="text-indent: 2em;">请输入内容。</p>
        `,
		range:`
			<div class="header-title chapter"><p class="tag other stdName" data-tag="stdName" data-name="标准名称">标准名称</p></div>
			<div class="ol-list" data-bookmark="111" data-outlinetype="3" data-index="1" style="line-height: 2.5;">范围<p style="text-indent: 2em;" data-mce-style="text-indent: 2em;">本标准规定了……。</p><p style="text-indent: 2em;" data-mce-style="text-indent: 2em;">本标准适用于……。</p><p style="text-indent: 2em;" data-mce-style="text-indent: 2em;"><br></p></div>
		`,
		normative:`
			<div class="ol-list" data-bookmark="222" data-outlinetype="4" data-index="2" style="line-height: 2.5;">规范性引用文件<p style="text-indent: 2em;" data-mce-style="text-indent: 2em;">下列文件中的内容通过文中的规范性引用而构成本文件必不可少的条款……。</p></div>
		`,
		term:`
			<div class="ol-list" data-bookmark="333" data-outlinetype="5" data-index="3" style="line-height: 2.5;">术语和定义<p style="text-indent: 2em;" data-mce-style="text-indent: 2em;">下列术语和定义适用于本标准。</p></div>
		`,
    },
    {
        type:8,
        disabled: true,
        value: 'qb',
        label:'编制说明',
        id: "template-8",
        img:'',
    	docType: '',
    	typeTitle: '',
    	docData: {
            "docId": "0000-000",
            "ccsNumber": "",
            "consistentSign": "",
            "stdEdition": "",
            "icsNumber": "",
            "stdCategory": 1,
            "stdKind": 8,
            "stdName": "编制说明名称",
            "stdNameEn": "",
            "stdNo": "2021-1130-010",
            "origStdNo": "",
            "stdPerformDate": "",
            "stdPublishDate": "",
            "stdTitle": "'",
            "releaseDepartment": ""
        },
    	outline: outlineTemp,
    	cover: `
            <div class="content">
                <p class="std-name">
                    <span contenteditable="true" class="tag other stdName" data-tag="stdName" data-name="编制说明标题名称"></span>
                </p>
                <p class="en-name">
                    <span contenteditable="true" class="tag other stdNameEn" data-tag="stdNameEn" data-name="编制说明"></span>
                </p>
         	</div>
    	`,
    	preface: `
    		<div class="header-title"><p>前&nbsp; &nbsp; 言</p></div>
    		<p style="text-indent: 2em;">请输入内容。</p>
        `,
    	intro: `
    		<div class="header-title"><p>引&nbsp; &nbsp; 言</p></div>
    		<p style="text-indent: 2em;">请输入内容。</p>
        `,
    	range:`
    		<div class="header-title"><p class="tag other stdName" contenteditable="false" data-bind="stdName" data-tag="stdName" data-name="标准名称">标准名称</p></div>
    		<div class="ol-list" data-bookmark="111" data-outlinetype="3" data-index="1" style="line-height: 2.5;">范围<p style="text-indent: 2em;" data-mce-style="text-indent: 2em;">本标准规定了……。</p><p style="text-indent: 2em;" data-mce-style="text-indent: 2em;">本标准适用于……。</p><p style="text-indent: 2em;" data-mce-style="text-indent: 2em;"><br></p></div>
    	`,
    	normative:`
    		<div class="ol-list" data-bookmark="222" data-outlinetype="4" data-index="2" style="line-height: 2.5;">规范性引用文件<p style="text-indent: 2em;" data-mce-style="text-indent: 2em;">下列文件中的内容通过文中的规范性引用而构成本文件必不可少的条款……。</p></div>
    	`,
    	term:`
    		<div class="ol-list" data-bookmark="333" data-outlinetype="5" data-index="3" style="line-height: 2.5;">术语和定义<p style="text-indent: 2em;" data-mce-style="text-indent: 2em;">下列术语和定义适用于本标准。</p></div>
    	`,
    	chapter:`
    		<div class="ol-list" data-bookmark="444" data-outlinetype="6" data-index="4" style="line-height: 2.5;">技术要求<p style="text-indent: 2em;" data-mce-style="text-indent: 2em;">文本内容...</p></div>
    	`,
    	literature:`
    		<div class="header-title"><p>参考文献</p></div>
    		<p style="text-indent: 2em;" class="tag other" data-tag="literature" data-name="参考文献">可录入或选择内容。</p>
    	`,
    	index:`
    		<div class="header-title"><p>索&nbsp; &nbsp; 引</p></div>
    	`,
    },
];

export const outline = {
    label: '标准名称',
    isRoot: true,
    children: [
        {
            label: '前言',
            htmlContent: ''
        },
        {
            label: '引言',
            htmlContent: ''
        },
        {
            label: '范围',
            isStruct: true,
            infoId: 1,
            htmlContent: ''
        },
        {
            label: '规范性引用文件',
            isStruct: true,
            infoId: 2,
            htmlContent: ''
        },
        {
            label: '术语和定义',
            infoId: 3,
            isStruct: true,
            htmlContent: ''
        },
        {
            label: '附录名称',
            isStruct: true,
            infoId: 4,
            appendix: true,
            letter: 'A',
            htmlContent: ''
        }
    ]
}

export const testHtmls = [
    {
        label: '测试-封面目次结构',
        filepath: 'html/test0.html'
    },
    {
        label: '测试-文档跨页处理',
        filepath: 'html/test1.html'
    },
    {
        label: '测试-表格XML解析',
        filepath: 'html/test2.html'
    },
    {
        label: '测试-编辑器使用说明',
        filepath: 'html/test3.html'
    },
    {
        label: '测试-层级项与列项',
        filepath: 'html/test4.html'
    },
    {
        label: '测试-附录项',
        filepath: 'html/test5.html'
    },
    {
        label: '测试7',
        filepath: 'html/test6.html'
    }
]

/**
 * @description 希腊字大写转换
 * @param {String} latex
 */
export const tranGreeceText = (latex) => {
	if(latex.match(/Alpha/i) !== null){
        latex = latex.replace(new RegExp('Alpha','g'), 'mathrm{A}');
    }
    if(latex.match(/Beta/i) !== null){
        latex = latex.replace(new RegExp('Beta','g'), 'mathrm{B}');
    }
    if(latex.match(/Epsilon/i) !== null){
        latex = latex.replace(new RegExp('Epsilon','g'), 'mathrm{E}');
    }
    if(latex.match(/Zeta/i) !== null){
        latex = latex.replace(new RegExp('Zeta','g'), 'mathrm{Z}');
    }
    if(latex.match(/Eta/i) !== null){
        latex = latex.replace(new RegExp('Eta','g'), 'mathrm{H}');
    }
    if(latex.match(/Iota/i) !== null){
        latex = latex.replace(new RegExp('Iota','g'), 'mathrm{I}');
    }
    if(latex.match(/Kappa/i) !== null){
        latex = latex.replace(new RegExp('Kappa','g'), 'mathrm{K}');
    }
    if(latex.match(/Mu/i) !== null){
        latex = latex.replace(new RegExp('Mu','g'), 'mathrm{M}');
    }
    if(latex.match(/Nu/i) !== null){
        latex = latex.replace(new RegExp('Nu','g'), 'mathrm{N}');
    }
    if(latex.match(/Omicron/i) !== null){
        latex = latex.replace(new RegExp('Omicron','g'), 'mathrm{O}');
    }
    if(latex.match(/Rho/i) !== null){
        latex = latex.replace(new RegExp('Rho','g'), 'mathrm{P}');
    }
    if(latex.match(/Tau/i) !== null){
        latex = latex.replace(new RegExp('Tau','g'), 'mathrm{T}');
    }
    if(latex.match(/Chi/i) !== null){
        latex = latex.replace(new RegExp('Chi','g'), 'mathrm{X}');
    }
    return latex;
}
