import packageConfig from "../package.json";

// 依赖的插件包
import '@/plugins/index';
// 全局基本样式表
import '@/assets/scss/base.scss';
// iconfont字体图标库
import '@/assets/iconfont/iconfont.css';
// 编辑器组件
import samEditor from './samEditorInstall.js';
// 编辑器组件
import outline from './outlineInstall.js';
// pdf文档阅读器
import pdfViewer from './pdfviewerInstall.js';
// 阅读器
// import stdReader from './stdReaderInstall.js';
// 文档转换HTML模块
import parseStructHtml from "@/components/tinymceEditor/utils/parseStructFromHtml";
// 文档比对
import standardComparsion from './comparsionInstall.js';
// 结构化文档阅读器
import structViewer from './structViewerInstall.js';
// 结构化文档阅读器
import aiDoc from './aiDocInstall.js';
// PDF文档解析器
import pdfParse from './pdfParseInstall.js';

// 组件集合
const components = [samEditor, outline, pdfViewer, structViewer, aiDoc, pdfParse];

const install = Vue => {
	if (install.installed) {
		return;
	}
	install.installed = true;
	// Vue.prototype.$global = Loading.service;
	components.forEach(Component => {
		Vue.component(Component.name, Component);
	});
};

//  如果浏览器环境且拥有全局Vue，则自动安装组件
if (typeof window !== "undefined" && window.Vue) {
    install(window.Vue);
}

export default {
    version: packageConfig.version,
    install,
    samEditor,
    outline,
    pdfViewer,
    // stdReader,
	structViewer,
    standardComparsion,
    parseStructHtml,
	aiDoc,
	pdfParse,
    //
}
