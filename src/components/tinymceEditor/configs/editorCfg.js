/**
 *
 =================================================
 @desc 编辑器主题配置信息
 @author sam 2021-07-30
 =================================================
 */

// 插件
export const plugins =
    'bzton newDoc save openFile indexMarker chapter listItem translate quota separateTable codesample lists fontSize fontName link term image imagetools media letterspacing charmap fullscreen nonbreaking paste code help fullscreen noneditable preview print hr table queue levels advlist pagebreak search searchreplace quickbars noneditable indent2em math graphy importword pageLayout exportFile comment catalogue formatpainter freeDom';
// 工具条1 fontsizeselect ewsave importword | numlist bullist |
export const toolbar1 =
    'undo redo | close-btn save saveAs | queue levels | hr finished-btn paragraph-btn title-block formatting | alignment indent2em lineheight letterspacing | image charmap table | pageLayout page-type | searchreplace preview fullscreen print | code';
// 工具条2
export const toolbar2 = 'zhu-btn | example-btn | articleTitle imgtitle-btn | footer-btn | math graphy | introduceGroup quote-btn term quota | comment | exportFile mergePage'

/**
 * 格式化配置
 * TinyMCE允许重写的内置格式，参考 http://tinymce.ax-z.cn/configure/content-formatting.php
 * 对于编辑器特殊需要，该好好研究下
 * 针对按钮的事件对文本进行格式化处理
 */
export const formats = {
    alignjustify: { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,ul,ol,li,img', classes: 'full' },
    bold: [{ inline: 'strong', styles: { fontWeight: 'bold' } }],
    textIndent: [{ selector: 'p,li', styles: { 'text-indent': '2em' } }],
    paddingIndent: [{ selector: 'div', styles: { 'padding-left': '2em' } }],
    h1: { block: 'p', classes: 'class1' }, // block 块操作;更改块元素的默认行为，也就是当前焦点外围标签整体变化的行为
    table_align: { selector: 'table', align: '%value' }, // 自定义table格式化 , styles: { float: '%value' }
    bull_list: { selector: 'ul', class: '%value' },
    setTags: [{ inline: 'span', classes: 'tag %value', attributes: { 'title': '%title', 'data-id': '%id', 'data-tid': '%tid', 'data-content': '%content', 'data-tag': '%value' } }], // 标签样式
    removeDiff: [{ inline: 'span', classes: 'diff %value' }],
}
export const fontFamily = '宋体=simsun;汉仪中宋=hanyiSun;黑体=SimHei;微软雅黑=Microsoft YaHei;苹果苹方=PingFang SC;Times New Roman=times new roman,times;sans-serif=sans-serif';

// 工具组
export const toolbar_groups = {
    formatting: {
        icon: 'format-btn',
        text: '格式',
        tooltip: '文字格式',
        items: 'bold italic underline | superscript subscript', // | letterspacing fontSize fontselect
    },
    alignment: {
        icon: 'align-left',
        tooltip: '水平对齐',
        items: 'alignleft aligncenter alignright',
    },
    hrline: {
        icon: 'horizontal-rule',
        tooltip: '横隔线',
        items: 'hr finished-btn',
    }
}

/**
 * @description 编辑器基础配置 参考：https://www.tiny.cloud/docs/configure/integration-and-setup/
 */
export const initConfig = {
    body_class: 'editorBody',
    cache_suffix: '?tmp=' + new Date().getTime(),
    doctype: '<!DOCTYPE html>',
    plugins,                                                                                        // 插件配置（后续可以从接口中获取自定义配置信息）
    /* toolbar1,                                                                                    // 工具栏（后续可以从接口中获取自定义配置信息）
    toolbar2, */
    // convert_urls: false,                                                                         // 自动转换相对或绝对路径 默认 true
    normal: false,
    relative_urls: false,                                                                           // 把当前域名中的所有URL转换为相对URL。相对位置基于document_base_url的配置
    toolbar_groups,                                                                                 // 工具组（将多个工具群组化）
    formats,
    draggable_modal: true,                                                                          // 为tinymceUI的模态窗口添加拖动模式。默认是关闭的
    resize: 'both',
    auto_focus: true,                                                                               // 自动获取焦点
    placeholder: '',                                                                                // 内容预文本l
    font_formats: fontFamily,
    lineheight_formats: '1 1.5 2 2.5 3 3.5 4 4.5 5 5.5 6',
    language: 'zh_CN',                                                                              // 语言 默认en
    // skin_url: `http://10.16.5.80/std-editor-formula/tinymce/skins/ui/oxide`,                     // skin路径
    // icons_url
    external_plugins: {                                                                             // 扩展插件{'testing': 'http://www.testing.com/plugin.min.js'}
        // powerpaste: `/tinymce/plugins/powerpaste/plugin.min.js`
    },
    // suffix: '.min',                                                                              // 加载插件时为plugin.min.js
    height: '100%',                                                                                 // 编辑器高度
    width: '100%',                                                                                  // 编辑器宽度
    browser_spellcheck: false,                                                                      // 拼写检查 （true:英文容易出现红色波浪线）
    statusbar: true,                                                                                // 隐藏编辑器底部的状态栏
    branding: false,                                                                                // 是否禁用“Powered by TinyMCE”水印
    elementpath: false,                                                                             // 隐藏底栏的元素路径
    // menubar: 'file edit view insert format tools tc',
    smart_paste: true,
    // paste_as_text: true,                                                                         // 粘贴的内容转换为文本
    paste_webkit_styles: 'color font-size',
    paste_data_images: true,
    paste_auto_cleanup_on_paste: true,                                                              // 自动清除粘贴进来的格式
    paste_remove_styles: true,                                                                      // 清除样式
    paste_remove_styles_if_webkit: true,
    paste_strip_class_attributes: false,                                                            // 清除属性
    paste_retain_style_properties: false,
    paste_block_drop: false,                                                                        // true 则禁用将内容拖放到编辑器中
    automatic_uploads: true,                                                                        // 自动上传
    // visualblocks_default_state: true,
    end_container_on_empty_block: false,                                                            // 空元素回车将其拆分
    quickbars_insert_toolbar: '',                                                                   // 插入快捷工具栏 quickimage quicktable
    //quickbars_selection_toolbar: 'bold italic underline strikethrough superscript subscript',     // 选中文字的快捷工具栏（plugin中须加入 quickbars） | letterspacing fontSize forecolor backcolor
    // contextmenu: 'undo redo | inserttable | cell row column deletetable | help',                 // 右键上下文菜单, 默认：link image imagetools table spellchecker
    // contextToolbar: {},                                                                          // 选中文字后的上下文菜单
    toolbar_sticky: true,                                                                           // 粘性工具栏（或停靠工具栏），在向下滚动网页直到不再可见编辑器时，将工具栏和菜单停靠在屏幕顶部。
    nonbreaking_force_tab: true,                                                                    // 保持tab 键在编辑器中
    image_advtab: true,
    image_caption: true,
    images_file_types: 'jpg,jpeg,png,gif,bmp',
    file_picker_types: 'file image media',
    // 视频媒体
    // mediaembed_max_width: 450,
    media_live_embeds: true,
    // media_alt_source: false,
    // media_filter_html: false,
    importcss_append: true,
    entity_encoding: 'raw',
    entities: '160,nbsp,38,amp,60,lt,62,gt',
    // keep_styles: false,                                                                          // 保持样式（当回车后会复制样式或属性）
    valid_elements: "*[*]",                                                                         // 扩展有效元素
    // invalid_elements: 'em,span',                                                                 // 非有效元素 p[data-mce-caret],ol
    // extended_valid_elements: 'span[class]',
    visual_anchor_class: 'tag',                                                                     // 为编辑区锚点指定class ol-list,appendix-list
    inline_boundaries_selector: 'a,code,b,i,strong,em',                                             // 可通过它来指定可应用于哪些内联元素。默认：a[href],code。
    allow_html_in_named_anchor: true,                                                               // 允许name锚点
    a11y_advanced_options: true,
    noneditable_noneditable_class: 'disabled',                                                      // 禁止编辑的class类
    // fix_list_elements : true,                                                                    // 修复列表元素(li的不规则)
    custom_ui_selector: '.submit-button',                                                           // 选项可指定某些元素成为编辑器的一部分，当焦点移动到匹配的元素上时，不会触发编辑器的blur事件
    // forced_root_block: '',
    // valid_classes: '',                                                                           // 合法的class class1 class2 class3
    table_default_styles: { width: '100%' },                                                        // 表格默认宽度
    table_use_colgroups: true,                                                                      // 表格使用colgroup控制单元列宽度
    table_style_by_css: true,
    // force_p_newlines : false,
    force_br_newlines: false,
    convert_newlines_to_brs: false,                                                                 // 新行的换行符转为 br标签
    convert_fonts_to_spans: false,                                                                  // 转换字体元素为SPAN标签，默认为true
    remove_script_host: false,
    chapter: ['6', '8', '9'],                                                                       // 章节标识;用于目次数据的筛选
    logo: require(`@/assets/images/logo.png`),                                                      // 编辑器LOGO图片
    catalogues: {                                                                                   // 默认目次选项
        type1: true,
        type2: true,
        type3: true,
        type4: true,
        type5: true,
        type6: true,
        leve11: true
    },
    zoomIn: true, // 页面缩放
    page: { // 页面设置
        layout: 'singleSided'
    }
}

export const normalConfig = {
    body_class: 'editorBody',
    cache_suffix: '?tmp=' + new Date().getTime(),
    doctype: '<!DOCTYPE html>',
    plugins,                                                                                        // 插件配置（后续可以从接口中获取自定义配置信息）
    toolbar_groups,                                                                                 // 工具组（将多个工具群组化）
    // formats,
    draggable_modal: true,                                                                          // 为tinymceUI的模态窗口添加拖动模式。默认是关闭的
    resize: 'both',
    auto_focus: true,                                                                               // 自动获取焦点
    placeholder: '',                                                                                // 内容预文本l
    font_formats: fontFamily,
    lineheight_formats: '1 1.5 2 2.5 3 3.5 4 4.5 5 5.5 6',
    language: 'zh_CN',                                                                              // 语言 默认en
    height: '100%',                                                                                 // 编辑器高度
    width: '100%',                                                                                  // 编辑器宽度
    browser_spellcheck: false,                                                                      // 拼写检查 （true:英文容易出现红色波浪线）
    statusbar: true,                                                                                // 隐藏编辑器底部的状态栏
    branding: false,                                                                                // 是否禁用“Powered by TinyMCE”水印
    elementpath: false,                                                                             // 隐藏底栏的元素路径
    smart_paste: true,
    paste_webkit_styles: 'color font-size',
    paste_block_drop: false,                                                                        // true 则禁用将内容拖放到编辑器中
    nonbreaking_force_tab: true,                                                                    // 保持tab 键在编辑器中
    image_advtab: true,
    image_caption: true,
    images_file_types: 'jpg,jpeg,png,gif,bmp',
    file_picker_types: 'file image media',
    // 视频媒体
    mediaembed_max_width: 450,
    media_live_embeds: true,
    entity_encoding: 'raw',
    entities: '160,nbsp,38,amp,60,lt,62,gt',
    inline_boundaries_selector: 'a,code,b,i,strong,em',                                             // 可通过它来指定可应用于哪些内联元素。默认：a[href],code。
    allow_html_in_named_anchor: true,                                                               // 允许name锚点
    a11y_advanced_options: true,
    table_default_styles: { width: '100%' },                                                        // 表格默认宽度
    table_use_colgroups: true,                                                                      // 表格使用colgroup控制单元列宽度
    table_style_by_css: true,
    logo: require(`@/assets/images/logo.png`),                                                      // 编辑器LOGO图片
	catalogues: {                                                                                   // 默认目次选项
        type1: true,
        type2: true,
        type3: true,
        type4: true,
        type5: true,
        type6: true,
        leve11: true
    },
    zoomIn: true, // 页面缩放
    page: { // 页面设置
        layout: 'singleSided'
    }
}

export const defaultCatalogues = [
    { label: '前言', value: 'type1', type: 'default', checked: true },
    { label: '引言', value: 'type2', type: 'default', checked: true },
    { label: '章标题', value: 'type3', type: 'default', checked: true },
    { label: '附录', value: 'type4', type: 'default', checked: true },
    { label: '参考文献', value: 'type5', type: 'default', checked: true },
    { label: '索引', value: 'type6', type: 'default', checked: true },
    { label: '一级条标题', value: 'leve11', other: true, checked: true },
    { label: '二级条标题', value: 'leve12', other: true },
    { label: '三级条标题', value: 'leve13', other: true },
    { label: '四级条标题', value: 'leve14', other: true },
    { label: '五级条标题', value: 'leve15', other: true },
    { label: '附录章标题', value: 'appendix0', other: true, checked: true },
    { label: '附录一级条标题', value: 'appendix1', other: true },
    { label: '附录二级条标题', value: 'appendix2', other: true },
    { label: '附录三级条标题', value: 'appendix3', other: true },
    { label: '附录四级条标题', value: 'appendix4', other: true },
    { label: '附录五级条标题', value: 'appendix5', other: true },
    { label: '图标题', value: 'imgTitle', other: true },
    { label: '表标题', value: 'tableTitle', other: true },
];
