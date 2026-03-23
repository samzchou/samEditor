/**
 * =========================================
 * @description tinymce5+ tinymce.activeEditor.dom API
 * @author sam.shen 2021-08-06
 * =========================================
 */

// JQuery => var $ = tinymce.dom.DomQuery; https://www.tiny.cloud/docs/api/tinymce.dom/tinymce.dom.domquery/

// 全局 activeEditor 实例
export const editorUtil = {
    /**
     * @description                         向编辑器添加自定义命令
     * @param {String} name                 要添加/覆盖的命令名称
     * @param {Function} callback           在命令发生时执行的函数
     * @param {Object} scope                执行函数的可选范围
     * @example                             tinymce.activeEditor.addCommand('mceTableColType', function(_ui, args) { // todo something })
     */
    addCommand(name, callback, scope) {

    },
    /**
     * @description                         向编辑器添加自定义命令
     * @param {Object} cmd                  要执行的命令名称
     * @param {Object} ui                   是否应显示 UI（对话框）的真/假状态
     * @param {Object} value                可选的命令值，可以是任何类型的值
     * @param {Object} args                 可选参数对象
     * @example                             tinymce.activeEditor.execCommand('mceTableColType', false, {a:1}, {...params})
     */
    execCommand(cmd, ui, value, args) {

    },
    /**
     * @description                         为某些命令或功能添加键盘快捷键
     * @param {String} pattern              快捷模式。例如：ctrl+alt+o
     * @param {String} desc                 命令的文本描述
     * @param {Function} cmdFunc            按下键时要执行的命令名称字符串或函数
     * @param {Object} scope                执行函数的可选范围
     * @example                             tinymce.activeEditor.addShortcut('ctrl+a', "description of the shortcut", function() {});
     * @return {Boolean}                    返回：true/false 状态是否添加了快捷方式
     */
    addShortcut(pattern, desc, cmdFunc, scope) {

    },
    /**
     * @description                         每次用户添加 img、a 或任何其他包含 URL 的元素时，都会执行 URL 转换器函数。这将被 DOM 和 HTML 操作函数调用
     * @param {String} url                  要转换的 URL
     * @param {String} name                 属性名称 src、href 等
     * @param {Object} elm                  标签名称或 HTML DOM 元素取决于 HTML 或 DOM 插入
     * @return {String}                     返回：转换后的 URL 字符串
     */
    convertURL(url, name, elm) {

    },
    /**
     * @description                         按名称触发指定的事件，更多事件参考：https://www.tiny.cloud/docs/advanced/events/
     * @param {String} name                 要触发的事件的名
     * @param {Object} args                 事件参数
     * @param {Boolean} bubble              如果要冒泡事件，则为真/假
     * @return {Object}                     返回：传入的事件参数实例
     * @example                             tinymce.activeEditor.fire('event', {...});
     */
    fire(name, args, bubble) {

    },
    /**
     * @description                         聚焦/激活编辑器
     * @param {Boolean} skipFocus           跳过 DOM 焦点。刚刚设置为活动编辑器
     */
    focus(skipFocus) {

    },
    /**
     * @description                         获取编辑区域的根元素
     * @return {Object}                     返回：可编辑区域的根元素
     */
    getBody() {

    },
    /**
     * @description                         获取编辑器的容器元素，容器元素包括添加到编辑器页面的所有元素。比如UI、iframe等
     * @return {Object}                     返回：编辑器容器的 HTML DOM 元素
     */
    getContainer() {

    },
    /**
     * @description                         从编辑器实例中获取内容
     * @param {Object} args                 可选的内容对象，它会在整个获取过程中传递
     * @return {Object}                     返回：清理过的内容字符串，通常是 HTML 内容
     * @example                             tinymce.activeEditor.getContent({format: 'text'});tinymce.activeEditor.getContent();
     */
    getContent(args) {

    },
    /**
     * @description                         获取编辑器的内容区域容器元素。此元素包含 iframe 或可编辑元素
     * @return {Object}                     返回：编辑器区域容器的 HTML DOM 元素
     */
    getContentAreaContainer() {

    },
    /**
     * @description                         获取 iframes 文档对象
     * @return {Object}                     返回：Iframe DOM 文档对
     */
    getDoc() {

    },
    /**
     * @description                         获取被 TinyMCE 编辑器实例替换的目标元素/文本区域
     * @return {Object}                     返回：替换元素的 HTML DOM 元素
     */
    getElement() {

    },
    /**
     * @description                         按名称返回配置参数
     * @param {String} name                 要检索的配置参数
     * @param {String} defaultVal           要返回的可选默认值
     * @param {String} type                 可选的类型参数
     * @example                             tinymce.activeEditor.getParam('myvalue');
     * @return {Object}                     返回：配置参数值或默认值
     */
    getParam(name, defaultVal, type) {

    },
    /**
     * @description                         获取iframes 窗口对象
     * @return {Object}                     返回：Iframe DOM 窗口对象
     */
    getWin() {

    },
    /**
     * @description                         如果对象具有指定名称的事件，则返回真/假
     * @param {String} name                 要检查的事件的名称
     * @return {Boolean}                    返回：true/false 如果事件存在与否
     */
    hasEventListeners(name) {

    },
    /**
     * @description                         如果编辑器具有真正的键盘焦点，则返回 true/false
     * @return {Boolean}                     返回：编辑器的当前焦点状态
     */
    hasFocus() {

    },
    /**
     * @description                         检查插件是否在编辑器配置中，并且可以选择检查插件是否已加载
     * @param {String} name                 插件的名称，为 TinyMCE `plugins` 选项指定
     * @param {Boolean} loaded              插件是否已加载
     * @example                             tinymce.activeEditor.hasPlugin('table', true);
     * @return {Boolean}                    返回：编辑器的当前焦点状态
     */
    hasPlugin(name,loaded) {

    },
    /**
     * @description                         在插入符号位置插入内容
     * @param {String} content              要插入的内容
     * @param {Object} args                 传递给插入调用的可选参数
     */
    insertContent(content, args) {

    },
    /**
     * @description                         从已转换为编辑器实例的文本区域、输入或其他元素加载内容。此方法将使用 setContent 将该文本区域、输入或其他元素中的内容移动到编辑器中
     * @param {Object} args                 可选的内容对象，它会在整个加载过程中传递
     * @return {String}                     返回：设置到编辑器中的 HTML 字符串
     */
    load(args) {

    },
    /**
     * @description                         向所有监听器分发 onNodeChange 事件，当需要更新 UI 状态或元素路径等时，应调用此方法
     * @param {Object} args                 传递给 NodeChange 事件处理程序的可选参数
     */
    nodeChanged(args) {

    },
    /**
     * @description                         按名称将事件侦听器解除绑定到特定事件
     * @param {String} name                 要解除绑定的事件的名称
     * @param {Function} callback           可选的取消绑定的回调
     * @example                             tinymce.activeEditor.off('event', handler);tinymce.activeEditor.off()
     * @return {String}                     返回：当前类实例
     */
    off(name, callback) {

    },
    /**
     * @description                         按名称将事件侦听器绑定到特定事件,更多事件参考：https://www.tiny.cloud/docs/advanced/events/
     * @param {String} name                 要绑定的事件名称或空格分隔的事件列表
     * @param {Function} callback           事件发生时执行的回调
     * @param {Boolean} prepend             如果事件应该被预先添加，则可选标志。请谨慎使用!
     * @example                             tinymce.activeEditor.on('event', function(e) {});
     * @return {String}                     返回：当前类实例
     */
    on(name, callback, prepend) {

    },
    /**
     * @description                         绑定事件回调(仅执行一次)，一旦它触发回调就会被删除,更多事件参考：https://www.tiny.cloud/docs/advanced/events/
     * @param {String} name                 要绑定的事件的名称
     * @param {Function} callback           只绑定一次的回调
     * @example                             tinymce.activeEditor.once('event', function(e) {});
     * @return {String}                     返回：当前类实例
     */
    once(name, callback) {

    },
    /**
     * @description                         从 dom 和 tinymce 集合中删除编辑器
     */
    remove() {

    },
    /**
     * @description                         呈现编辑器/将其添加到页面
     */
    render() {

    },
    /**
     * @description                         重置内容
     * @param {String} initialContent       可选字符串，用作编辑器的初始内容
     */
    resetContent(initialContent) {

    },
    /**
     * @description                         将编辑器中的内容保存到已转换为编辑器实例的 textarea 或 div 元素
     * @param {Object} args                 可选的内容对象，它会在整个保存过程中传递
     * @return {String}                     返回：设置到 textarea/div 中的 HTML 字符串
     */
    save(args) {

    },
    /**
     * @description                         将编辑器中的内容保存到已转换为编辑器实
     * @param {String} content              要设置为编辑器的内容，通常是 HTML 内容，但也可以是其他格式
     * @param {Object} args                 可选的内容对象，它会在整个设置过程中传递
     * @return {String}                     返回：设置到编辑器中的 HTML 字符串
     */
    setContent(content, args) {

    },
    /**
     * @description                         将编辑器中的内容保存到已转换为编辑
     * @param {String} mode                 编辑器的模式名称（design|readonly）
     */
    setMode(mode) {

    },
    /**
     * @description                         将编辑器中的内容保存到已转换为编辑
     * @param {Boolean} state               是否显示或隐藏进度的布尔状态
     * @param {Number} time                 在显示进度之前等待的可选时间
     * @return {Boolean}                    返回：设置到
     */
    setProgressState(state, time) {

    },
    /**
     * @description                         通过用语言包项目替换变量来翻译指定的字符串，它还将检查是否有匹配输入的键
     * @param {String} text                 要由语言包数据翻译的字符串
     * @return {Boolean}                    返回：翻译后的字符串
     */
    translate(text) {

    },
    /**
     * @description                         将编辑器内容中的所有数据 uri/blob uri 图像上传到服务器
     * @param {Function} callback           带有图像和每个图像状态的可选回调
     * @return {Boolean}                    返回：Promise 实例
     */
    uploadImages(callback) {

    }
}

// 编辑器运行环境
export const env = {
    /**
     * @description                         是否为Chrome浏览器
     * @param {Object} editor               编辑器实例
     * @return {Boolean}                    返回：真/假
     */
    isChrome(editor) {
        return editor.browser.isChrome();
    },
    /**
     * @description                         是否为Edge浏览器
     * @param {Object} editor               编辑器实例
     * @return {Boolean}                    返回：真/假
     */
    isEdge(editor) {
        return editor.browser.isEdge();
    },
    /**
     * @description                         是否为IE浏览器
     * @param {Object} editor               编辑器实例
     * @return {Boolean}                    返回：真/假
     */
    isIE(editor) {
        return editor.browser.isIE();
    },
    /**
     * @description                         是否为Firefox浏览器
     * @param {Object} editor               编辑器实例
     * @return {Boolean}                    返回：真/假
     */
    isFirefox(editor) {
        return editor.browser.isFirefox();
    },
    /**
     * @description                         是否为Safari浏览器
     * @param {Object} editor               编辑器实例
     * @return {Boolean}                    返回：真/假
     */
    isSafari(editor) {
        return editor.browser.isSafari();
    },
    /**
     * @description                         是否为桌面化操作
     * @param {Object} editor               编辑器实例
     * @return {Boolean}                    返回：真/假
     */
    isDesktop(editor) {
        return editor.deviceType.isDesktop();
    },
    /**
     * @description                         是否为手机端化操作
     * @param {Object} editor               编辑器实例
     * @return {Boolean}                    返回：真/假
     */
    isPhone(editor) {
        return editor.deviceType.isPhone();
    },
    /**
     * @description                         是否为iPad平板
     * @param {Object} editor               编辑器实例
     * @return {Boolean}                    返回：真/假
     */
    isiPad(editor) {
        return editor.deviceType.isiPad();
    },
    /**
     * @description                         是否为iPhone手机端
     * @param {Object} editor               编辑器实例
     * @return {Boolean}                    返回：真/假
     */
    isiPhone(editor) {
        return editor.deviceType.isiPhone();
    },
    /**
     * @description                         是否支持触摸
     * @param {Object} editor               编辑器实例
     * @return {Boolean}                    返回：真/假
     */
    isTouch(editor) {
        return editor.deviceType.isTouch();
    },
    /**
     * @description                         是否为嵌入式WebView
     * @param {Object} editor               编辑器实例
     * @return {Boolean}                    返回：真/假
     */
    isWebView(editor) {
        return editor.deviceType.isWebView();
    },
    /**
     * @description                         是否为Android系统
     * @param {Object} editor               编辑器实例
     * @return {Boolean}                    返回：真/假
     */
    isAndroid(editor) {
        return editor.os.isAndroid();
    },
    /**
     * @description                         是否为Chrome系统
     * @param {Object} editor               编辑器实例
     * @return {Boolean}                    返回：真/假
     */
    isChromeOS(editor) {
        return editor.os.isChromeOS();
    },
    /**
     * @description                         是否为Linux系统
     * @param {Object} editor               编辑器实例
     * @return {Boolean}                    返回：真/假
     */
    isLinux(editor) {
        return editor.os.isLinux();
    },
    /**
     * @description                         是否为Mac OS X系统
     * @param {Object} editor               编辑器实例
     * @return {Boolean}                    返回：真/假
     */
    isOSX(editor) {
        return editor.os.isOSX();
    },
    /**
     * @description                         是否为 iOS系统
     * @param {Object} editor               编辑器实例
     * @return {Boolean}                    返回：真/假
     */
    isiOS(editor) {
        return editor.os.isiOS();
    },
    /**
     * @description                         是否为 Windows系统
     * @param {Object} editor               编辑器实例
     * @return {Boolean}                    返回：真/假
     */
    isWindows(editor) {
        return editor.os.isWindows();
    }
}

// 编辑器格式化
/*
Examples:
// 注册
tinymce.activeEditor.formatter.register('mycustomformat', {
   inline: 'span',
   styles: {color: '#ff0000'}
});
// 应用
tinymce.activeEditor.formatter.apply('mycustomformat');
*/

export const formatter = {
    /**
     * @description                         按名称注册特定格式
     * @param {String} name                 格式名称
     * @param {Object} format               格式对象
     */
    register(name, format) {

    },
    /**
     * @description                         注销格式
     * @param {String} name                 格式名称
     */
    unregister(name) {

    },
    /**
     * @description                         将指定格式应用于当前选择或指定节点
     * @param {String} name                 要应用的格式名称
     * @param {Object} vars                 在应用格式之前要替换的可选变量列表
     * @param {Object} node                 可选节点，将格式应用于当前选择的默认值
     */
    apply(name, vars, node) {

    },
    /**
     * @description                         如果指定的格式是否可以应用于当前选择，则返回 true/false
     * @param {String} name                 要检查的格式名称
     * @return {Boolean}                    返回 true/false
     */
    canApply(name) {

    },
    /**
     * @description                         从当前选择或指定节点中删除指定格式
     * @param {String} name                 要删除的格式名称
     * @param {Object} vars                 在删除之前要在格式中替换的可选变量列表
     * @param {Object} node                 可选节点或 DOM 范围，用于将格式从默认值移除为当前选择
     */
    remove(name, vars, node) {

    },
    /**
     * @description                         打开/关闭指定的格式
     * @param {String} name                 要应用/删除的格式名称
     * @param {Object} vars                 在应用/删除格式之前要替换的可选变量列表
     * @param {Object} node                 应用格式或从中删除格式的可选节点。默认为当前选择
     */
    toggle(name, vars, node) {

    }
}

// 命令
export const command = {
    mceInsertLink(editor, flag=false, url='https://www.bzton.cloud') {
        editor.execCommand('mceInsertLink', flag, url);
    },
    Unlink(editor) {
        editor.execCommand('Unlink');
    },
    FormatBlock(editor) {
        editor.execCommand('FormatBlock', false, 'bold');
    },
    mceToggleFormat(editor) {
        editor.execCommand('mceToggleFormat', false, 'bold');
    },
    mceInsertContent(editor) {
        editor.execCommand('mceInsertContent', false, 'My new content');
    },
    mceReplaceContent(editor) {
        editor.execCommand('mceReplaceContent', false, 'My replacement content');
    },
    mceSetContent(editor) {
        editor.execCommand('mceSetContent', false, 'My content');
    },
    mceInsertRawHTML(editor) {
        editor.execCommand('mceInsertRawHTML', false, '<p>Hello, World!</p>');
    },
    SelectAll(editor) {
        editor.execCommand('SelectAll');
    },
    Delete(editor) {
        editor.execCommand('Delete');
    },
    mceNewDocument(editor) {
        editor.execCommand('mceNewDocument');
    },
    mceCleanup(editor) {
        editor.execCommand('mceCleanup');
    },
    mceSelectNode(editor) {
        editor.execCommand('mceSelectNode', false, '<DOM_node>');
    },
    mceSelectNodeDepth(editor) {
        editor.execCommand('mceSelectNodeDepth', false, 2);
    },
    mceRemoveNode(editor) {
        editor.execCommand('mceRemoveNode'); // OR 'mceRemoveNode', false, '<DOM_node>'
    },
    mceFullPageProperties(editor) {
        editor.execCommand('mceFullPageProperties');
    },
    mceFullScreen(editor) {
        editor.execCommand('mceFullScreen');
    },
    /**
     * @description                         // 列项
     * @param {Object} editor
     * @example                             // editor.execCommand('ApplyOrderedListStyle', false, { 'list-style-type': 'disc'})
     */
    ApplyUnorderedListStyle(editor) {
        editor.execCommand('ApplyUnorderedListStyle', false, { 'list-style-type': 'decimal' });
    },
    mceFullScreen(editor) {
        editor.execCommand('mceFullScreen');
    },
    // DL
    InsertDefinitionList(editor) {
        editor.execCommand('InsertDefinitionList', false, {
            'list-item-attributes': {class: 'mylistitemclass'},
            'list-attributes': {id: 'mylist'}
        });
    },
    InsertOrderedList(editor) {
        editor.execCommand('InsertOrderedList', false, {
            'list-style-type': 'decimal',
            'list-item-attributes': {class: 'mylistitemclass'},
            'list-attributes': {id: 'mylist'}
        });
    },
    InsertUnorderedList(editor) {
        editor.execCommand('InsertUnorderedList', false, {
            'list-style-type': 'disc',
            'list-item-attributes': {class: 'mylistitemclass'},
            'list-attributes': {id: 'mylist'}
        });
    },
    RemoveList(editor) {
        editor.execCommand('RemoveList');
    },
}

// 全局 activeEditor.selection 实例
export const selection = {
    setRng() {

    },
    getRng() {

    },
    getEnd() {

    },
    getNode() {

    },
    getSel() {

    },
    getStart() {

    },
    select(node) {

    },
    getBookmark() {

    },
    moveToBookmark(bm) {

    },
    getContent() {

    },
}
/**
 * 编辑器核心事件
 * 全局 activeEditor.fire 事件触发
 * 可以使用 activeEditor.on(fireName, function) 监听
 * 例如： editor.fire('NewBlock NodeChange', { newBlock: newBlock }); editor.on('NewBlock', callBack)
 * 或者自行可定义事件
 */
export const fire = {
    load() {

    },
    Init() {

    },
    ScriptsLoaded() {

    },
    // command: command,ui: ui,value: value
    BeforeExecCommand({}) {

    },
    // command: command,ui: ui,value: value
    ExecCommand({}) {

    },
    // dialog: dialog
    OpenWindow({}) {

    },
    // dialog: dialog
    CloseWindow({}) {

    },
    ScrollWindow(event) {

    },
    ScrollIntoView(data) {

    },
    AfterScrollIntoView(data) {

    },
    ResizeWindow(event) {

    },
    // relatedTarget: activeEditor
    activate({}) {

    },
    // relatedTarget: activeEditor
    deactivate({}) {

    },
    PreProcess(args) {

    },
    PostProcess(args) {

    },
    remove() {

    },
    detach() {

    },
    SwitchMode() {

    },
    ObjectResizeStart() {

    },
    ObjectResized() {

    },
    PreInit() {

    },
    PostRender() {

    },
    PlaceholderToggle() {

    },
    //'NewBlock', { newBlock: newBlock}
    NewBlock() {

    },
    SelectionChange() {

    },
    NodeChange() {

    },
    // target: state.element
    dragstart({}) {

    },
    // clientX: e.clientX, clientY: e.clientY 
    drop({}) {

    },
    // target: node, direction: direction, before: before
    ShowCaret({}) {

    },
    // target: elm, targetClone: targetClone
    ObjectSelected({}) {

    },
    SetAttrib(event) {

    },
    focus(Boolean) {

    },
    // range: range
    GetSelectionRange({}) {

    },
    // range: rng,forward: forward
    SetSelectionRange({}) {

    },
    // range: rng,forward: forward
    AfterSetSelectionRange({}) {

    },
    BeforeGetContent(args) {

    },
    BeforeSetContent(args) {

    },
    // content: args.content,format: 'html',selection: true,paste: details.paste
    SetContent({}) {

    },
    change(args) {

    }
}

// 全局 activeEditor.DOM 实例
export const domUtil = {
    /**
     * @description                         将指定的元素添加到另一个或多个元素
     * @param {String|Object} parentElm     要添加到的元素 id 字符串、DOM 节点元素或 id 或元素数组 editor.getBody()
     * @param {Object} name                 要添加的新元素或要添加的现有元素的名称
     * @param {Object} attrs                带有要添加到新元素的参数的可选对象集合
     * @param {Object} html                 元素内部HTML 内容
     * @param {Object} create               是否应该创建或添加元素的可选标志
     * @example                             tinymce.activeEditor.dom.add(tinymce.activeEditor.getBody(), 'p', {title: 'my title'}, 'Some content');
     */
    add(parentElm, name, attrs, html, create) {

    },
    /**
     * @description                         将类添加到指定的一个或多个元素
     * @param {String|Object} elm           元素 ID 字符串或 DOM 元素或带有元素或 ID 的数
     * @param {Str} cls                     添加到每个元素的类名
     * @example                             tinymce.activeEditor.dom.addClass(tinymce.activeEditor.dom.select('p'), 'myclass') | tinymce.DOM.addClass('mydiv', 'myclass');
     */
    addClass(elm, cls) {

    },
    /**
     * @description                         从一个或多个元素中删除所有属性
     * @param {String|Object} elm           元素 ID 字符串或 DOM 元素或带有元素或 ID 的数组
     * @param {String} cls                  要从每个元素中删除的类名
     * @example                             tinymce.activeEditor.dom.removeClass(tinymce.activeEditor.dom.select('p'), 'myclass');tinymce.DOM.removeClass('mydiv', 'myclass');
     * @return {String|Array}               返回：剩余类名的字符串或字符串数组
     */
    removeClass(elm, cls) {

    },
    /**
     * @description                         打开/关闭指定的类
     * @param {Element} elm                 切换类的元素
     * @param {String} cls                  打开/关闭的类
     * @param {Object} state                要设置的可选状态
     */
    toggleClass(elm, cls, state) {

    },
    /**
     * @description                         添加样式
     * @param {String} cssText              CSS 文本样式
     */
    addStyle(cssText) {

    },
    /**
     * @description                         将指定的样式值解析为对象集合；此解析器还将合并和删除浏览器可能已添加的任何冗余项。它还会将非十六进制颜色转换为十六进制值。样式中的 URL 也将根据设置转换为绝对/相对
     * @param {String} cssText              要解析的样式值，例如：
     * @example                             tinymce.DOM.parseStyle('border:1px solid red;');
     * @return {Object}                     返回： {border: '1px solid red'}
     */
    parseStyle(cssText) {

    },
    /**
     * @description                         将指定的样式对象序列化为字符串
     * @param {Object} styles               序列化为字符串的对象
     * @param {Strin} name                  可选元素名称
     * @example                             tinymce.activeEditor.dom.serializeStyle({border: '1px solid red'});
     * @return {String}                     返回：样式对象的字符串表示形式 'border: 1px solid red'
     */
    serializeStyle(styles, name) {

    },
    /**
     * @description                         在 HTML 元素上设置 CSS 样式值
     * @param {Object} elm                  用于设置 CSS 样式值的 HTML 元素/元素数组
     * @param {String} name                 要设置的样式值的名称
     * @param {String} value                要在样式上设置的值
     * @example                             tinymce.activeEditor.dom.setStyle(tinymce.activeEditor.dom.select('p'), 'background-color', 'red');tinymce.DOM.setStyle('mydiv', 'background-color', 'red');
     */
    setStyle(elm, name, value) {

    },
    /**
     * @description                         在指定元素上设置多种样式
     * @param {Object} elm                  要设置样式的 DOM 元素、元素 id 字符串或元素/id 数组
     * @param {Object} styles               要添加到元素的样式项的名称/值集合
     * @example                             tinymce.activeEditor.dom.setStyles(tinymce.activeEditor.dom.select('p'), {'background-color': 'red', 'color': 'green'});
     */
    setStyles(elm, styles) {

    },
    /**
     * @description                         元素父级是否可编辑
     * @param {Object} elm                  要设置样式的 DOM 元素、元素 id 字符串或元素/id 数组
     */
    getContentEditableParent(elm) {

    },
    /**
     * @description                         将事件处理程序添加到指定的对象绑定，
     * @param {Element} target              目标元素，处理程序或元素/ID/文档的数组
     * @param {String} name                 要添加的事件处理程序的名称，例如：click
     * @param {function} func               事件发生时执行的函数
     * @param {Object} scope                执行函数的可选范围
     * @return {function} function          返回：function
     */
    bind(target, name, func, scope) {

    },
    /**
     * @description                         从元素或元素集合中按名称和函数移除指定的事件处理，
     * @param {Element} target              目标元素，处理程序或元素/ID/文档的数组
     * @param {String} name                 事件处理程序名称，例如：click
     * @param {function} func               要删除的函数
     * @return {Bool|Array}                 返回：如果处理程序被移除，则布尔状态为 true，如果传入多个输入元素，则为状态数组
     */
    unbind(target, name, func) {

    },
    /**
     * @description                         创建一个新元素，
     * @param {String} name                 新元素的名称
     * @param {Object} attrs                具有元素属性的可选对象名称/值集合
     * @param {String} html                 元素内部可选 HTML 字符串
     */
    create(name, attrs, html) {

    },
    /**
     * @description                         根据指定的 HTML 字符串创建文档片段
     * @param {String} html                 用于创建片段的 Html 字符串
     * @return {Object}                     返回：DocumentFragme 文档片段节点
     */
    createFragment(html) {

    },
    /**
     * @description                         为元素创建 HTML 字符串。除非传入一个空的内部 HTML 字符串，否则该元素将被关闭
     * @param {String} name                 新元素的名称
     * @param {Object} attrs                具有元素属性的可选对象名称/值集合
     * @param {String} html                 元素内部 HTML 的可选 HTML 字符串
     * @example                             tinymce.activeEditor.selection.setContent(tinymce.activeEditor.dom.createHTML('a', {href: 'test.html'}, 'some line'));
     */
    createHTML(name, attrs, html) {

    },
    /**
     * @description                         创建一个新的 DOM Range 对象(界限)
     * @return {Object}                     DOM 范围对象
     * @example                             var rng = tinymce.DOM.createRng(); alert(rng.startContainer + "," + rng.startOffset);
     */
    createRng() {

    },
    /**
     * @description                         HTML实体解码一个字符串
     * @param {String} s                    用于解码实体的字符串
     * @return {String}                     返回：实体解码字符串
     */
    decode(s) {

    },
    /**
     * @description                         HTML实体对字符串进行编码
     * @param {String} s                    用实体编码的字符串
     * @return {String}                     返回：实体编码字符串
     */
    encode(s) {

    },
    /**
     * @description                         销毁对 DOM 的所有内部引用以解决 IE 泄漏问题
     */
    destroy() {

    },
    /**
     * @description                         找出两个元素的共同祖先，这是一种比使用 DOM Range 逻辑更短的方法
     * @param {Element} a                   元素a
     * @param {Element} b                   元素b
     * @return {Elemen}                     返回：两个输入元素的共同祖先元
     */
    findCommonAncestor(a, b) {

    },
    /**
     * @description                         使用目标上的对象触发指定的事件名称
     * @param {node} target                 触发事件的目标元素或对象
     * @param {String} name                 要触发的事件的名称
     * @param {Object} evt                  要发送的事件对象
     * @return {Event}                      返回：事件对象
     */
    fire(target, name, evt) {

    },
    /**
     * @description                         按 ID 或输入元素返回指定的元素
     * @param {String|Object} n             要查找的元素 id 或要通过的元素
     * @return {Element}                    返回：与指定 id 匹配的元素，如果未找到则为 null
     */
    get(n) {

    },
    /**
     * @description                         按 ID 或输入元素返回指定的元素
     * @param {String|Object} elm           要从中获取属性的元素字符串 id 或 DOM 元素
     * @param {String} name                 要获取的属性名称
     * @param {String} defaultVal           如果属性不存在，则返回可选的默认值
     * @return {String}                     返回：属性值字符串、默认值或 null（如果未找到该属性）
     */
    getAttrib(elm, name, defaultVal) {

    },
    /**
     * @description                         获取带有元素属性的 NodeList
     * @param {String|Element} elm          要从中获取属性的元素节点或字符串 id
     * @return {NodeList}                   返回：带有属性的 NodeList数组
     */
    getAttribs(elm) {

    },
    /**
     * @description                         获取与选择器或函数匹配的下一个节点
     * @param {Object} node                 从中查找兄弟节点的节点
     * @param {Object} selector             选择器(父容器) CSS 表达式或函数
     * @return {NodeList}                   返回：匹配选择器的下一个节点项，如果未找到则为 null
     */
    getNext(node, selector) {

    },
    /**
     * @description                         获取与选择器或函数匹配的上一个节点
     * @param {Object} node                 从中查找兄弟节点的当前节点
     * @param {Object} selector             选择器(父容器) CSS 表达式或函数
     * @return {NodeList}                   返回：匹配选择器的上一个节点项，如果未找到则为 null
     */
    getPrev(node, selector) {

    },
    /**
     * @description                         获取元素的外部 HTML
     * @param {String|Element} ele          要从中获取外部 HTML 的元素 ID 或元素对象
     * @return {NodeList}                   返回：外部 HTML 字符串
     */
    getOuterHTML(ele) {

    },
    /**
     * @description                         通过指定的选择器函数返回父级节点
     * @param {Node} node                   DOM 节点，用于搜索父节点或 ID 字符串
     * @param {function} selector           要在每个节点上执行的选择函数或 CSS 选择器
     * @param {Node} root                   可选的根元素，永远不会超出这一点
     * @return {node}                       返回：DOM 节点，如果未找到则为 null
     */
    getParent(node, selector, root) {

    },
    /**
     * @description                         获取与指定选择器函数或模式匹配的所有父节点的节点列
     * @param {Node} node                   DOM 节点，用于搜索父节点或 ID 字符
     * @param {function} selector           要在每个节点上执行的选择函数或 CSS 选择器
     * @param {Node} root                   可选的根元素，永远不会超出这一点
     * @return {Array}                      返回：节点数组，如果未找到则为 null
     */
    getParents(node, selector, root) {

    },
    /**
     * @description                         获取节点的绝对 x、y 位置
     * @param {Element} elm                 要从中获取 x, y 位置的 HTML 元素或元素 id
     * @param {Element} rootElm             停止计算的可选根元素
     * @return {object}                     返回：具有 x、y 字段的指定元素对象的绝对位置
     */
    getPos(elm, rootElm) {

    },
    /**
     * @description                         获取特定元素的矩形(界限范围)
     * @param {Element} elm                 要从中获取矩形的元素对象或元素 ID
     * @return {object}                     返回：具有 x、y、w、h 字段的指定元素对象的矩形
     */
    getRect(elm) {

    },
    /**
     * @description                         获取文档的根节点，这通常是主体
     * @return {object}                     返回：实用程序类的根元素
     */
    getRoot() {

    },
    /**
     * @description                         获取指定元素的大小尺寸
     * @param {Element} elm                 要从中获取矩形的元素对象或元素 ID
     * @return {object}                     返回： 具有 w、h 字段的指定元素对象的矩形
     */
    getSize(elm) {

    },
    /**
     * @description                         获取指定元素的当前样式
     * @param {String|Object} elm           要从中获取样式的 HTML 元素或元素 ID 字符串
     * @param {String} name                 要返回的样式名称
     * @param {Boolean} computed            计算风格
     * @return {String}                     返回： 元素的当前样式或计算的样式值
     */
    getStyle(elm, name, computed) {

    },
    /**
     * @description                         获取窗口的视口
     * @param {Window} win                  可选窗口
     * @return {String}                     返回： 具有字段 x、y、w 和 h 的视口对象
     */
    getViewPort(win) {

    },
    /**
     * @description                         指定的元素具有指定的类，则返回 true
     * @param {String|Element} elm          用于检查 CSS 类的 HTML 元素或元素 ID 字符串
     * @param {String} cls                  要检查的 CSS 类
     * @return {Boolean}                    返回： 如果指定元素具有指定类，则为真/假
     */
    hasClass(elm, cls) {

    },
    /**
     * @description                         通过设置“显示”样式，按 ID 隐藏指定的元素
     * @param {Element} elm                 元素或元素 ID 字符串
     * @example                             tinymce.DOM.hide('myid');
     */
    hide(elm) {

    },
    /**
     * @description                         通过设置“显示”样式按 ID 显示指定的元素
     * @param {Element} elm                 元素或元素 ID 字符串
     * @example                             tinymce.DOM.show('myid');
     */
    show(elm) {

    },
    /**
     * @description                         在引用元素之后插入一个元素
     * @param {Element} node                当前的元素
     * @param {Element} referenceNode       要插入的引用元素、元素 id 或元素数组后
     * @return {Array}                      返回： 添加的元素或包含元素的数组；
     */
    insertAfter(node, referenceNode) {

    },
    /**
     * @description                         判断指定的元素与指定的 css 模式匹配
     * @param {Object} elm                  要匹配的 DOM 节点或要匹配的节点数组
     * @param {Object} selector             匹配元素的选择器或 CSS 模式
     * @return {Boolean}                    返回： 真/假
     */
    is(elm, selector) {

    },
    /**
     * @description                         判断指定的元素是否为块元素
     * @param {Object} node                 要检查的元素/节点
     * @return {Boolean}                    返回： 如果节点是块元素，则为真/假状态
     */
    isBlock(node) {

    },
    /**
     * @description                         判断指定的节点被认为是空的
     * @param {Object} elements             可选的名称/值对象，其元素被自动视为非空元素
     * @return {Boolean}                    返回： 如果节点为空，则为真/假
     * @example                             tinymce.DOM.isEmpty(node, {img: true});
     */
    isEmpty(elements) {

    },
    /**
     * @description                         判断指定的节点是否为隐藏元素
     * @param {Object} elm                  要检查显示状态的 ID 或元素
     * @return {Boolean}                    返回： 元素是否隐藏，真/假
     */
    isHidden(elm) {

    },
    /**
     * @description                         将指定的 CSS 文件导入/加载到绑定到类的文档中
     * @param {String} url                  要加载的 CSS 文件的 URL
     * @example                             tinymce.DOM.loadCSS('somepath/some.css');
     */
    loadCSS(url) {

    },
    /**
     * @description                         获取指定节点在其父节点中的索引
     * @param {Object} node                 要查找的节点
     * @param {Boolean} normalized          可选的真/假状态，如果索引是标准化后的样子
     * @return {Number}                     返回： 指定节点的索引
     * @example                             tinymce.DOM.nodeIndex(node, true);
     */
    nodeIndex(node, normalized) {

    },

    /**
     * @description                         从 DOM 中移除/删除指定的元素
     * @param {Object} node                 元素或 DOM 元素对象或包含多个元素/id 的数组的 ID
     * @param {Boolean} keepChildren        是否保留孩子的可选状态。如果设置为 true，则所有子项都将放置在已删除元素的位置
     * @return {Element|Array}              返回：被移除的 HTML DOM 元素或数组
     * @example                             tinymce.activeEditor.dom.remove(tinymce.activeEditor.dom.select('p')); tinymce.DOM.remove('mydiv');
     */
    remove(node, keepChildren) {

    },
    /**
     * @description                         从一个或多个元素中删除所有属性
     * @param {Element} ele                 要从中删除属性的 DOM 元素、元素 id 字符串或元素/id 数组
     */
    removeAllAttribs(ele) {

    },

    /**
     * @description                         重命名指定元素并保留其属性和子元素
     * @param {Object} elm                  要重命名的元素
     * @param {String} name                 新元素的名称
     * @return {Element}                    返回：新元素或旧元素（如果需要重命名）
     */
    rename(elm, name) {

    },
    /**
     * @description                         用指定的新元素替换指定的一个或多个元素。如果传入多个输入元素，则将克隆新元素
     * @param {Object} newElm               用来替换旧元素的新元素
     * @param {Object} oldElm               元素 DOM 节点、元素 id 或要替换的元素或 id 数组
     * @param {Boolean} keepChildren        可选的保持子节点状态，如果设置为 true 来自旧对象的子节点将被添加到新对象中
     */
    replace(newElm, oldElm, keepChildren) {

    },
    /**
     * @description                         通过 id 或 dom 元素节点或元素/id 数组对元素执行指定的函数
     * @param {String|Object} elm           ID 或 DOM 元素对象或带有 ID 或元素的数组
     * @param {Function} func               为每个项目执行的函数
     * @param {Object} scope                执行函数的可选范围
     * @return {Object}                     返回：单个对象，如果传入多个输入元素，则为对象数组
     */
    run(elm, func, scope) {

    },
    /**
     * @description                         由给定 CSS 选择器指定的元素列表
     * @param {String|Object} selector      目标 CSS 选择器
     * @param {Object} scope                要搜索的可选根元素/范围元素
     * @return {Array}                      返回：包含所有匹配元素的数组
     * @example                             tinymce.activeEditor.dom.select('p');tinymce.activeEditor.dom.select('span.test')
     */
    select(selector, scope) {

    },

    /**
     * @description                         设置一个或多个元素的指定属性
     * @param {Object} elm                  要设置属性的 DOM 元素、元素 id 字符串或元素/id 数组
     * @param {String} name                 要设置的属性名称
     * @param {String} value                要在属性上设置的值 - 如果此值是假的，如 null、0 或 ''，它将改为删除该属性
     * @example                             tinymce.activeEditor.dom.setAttrib(tinymce.activeEditor.dom.select('p'), 'class', 'myclass');tinymce.dom.setAttrib('mydiv', 'class', 'myclass');
     */
    setAttrib(elm, name, value) {

    },

    /**
     * @description                         设置一个或多个元素的两个或多个指定属性
     * @param {Object} elm                  要设置属性的 DOM 元素、元素 id 字符串或元素/id 数组
     * @param {Object} attrs                要添加到元素的属性项的名称/值集合
     * @example                             tinymce.activeEditor.dom.setAttribs(tinymce.activeEditor.dom.select('p'), {'class': 'myclass', title: 'some title'});tinymce.DOM.setAttribs('mydiv', {'class': 'myclass', title: 'some title'});
     */
    setAttribs(elm, attrs) {

    },
    /**
     * @description                         在一个或多个元素中设置指定的 HTML 内容
     * @param {Object} elm                  要在其中设置 HTML 的 DOM 元素、元素 id 字符串或元素/id 数组
     * @param {String} html                 设置为元素内部 HTML 的 HTML 内容
     * @example                             tinymce.activeEditor.dom.setHTML(tinymce.activeEditor.dom.select('p'), 'some inner html');tinymce.DOM.setHTML('mydiv', 'some inner html');
     */
    setHTML(elm, html) {

    },
    /**
     * @description                         在一个或多个元素上设置指定的外部 HTML
     * @param {Object} elm                  要在其中设置 HTML 的 DOM 元素、元素 id 字符串或元素/id 数组
     * @param {String} html                 设置为元素外部值的 HTML 代码
     * @example                             tinymce.activeEditor.dom.setOuterHTML(tinymce.activeEditor.dom.select('p'), '<div>some html</div>');tinymce.DOM.setOuterHTML('mydiv', '<div>some html</div>');
     */
    setOuterHTML(elm, html) {

    },
    /**
     * @description                         将一个元素拆分为两个新元素，并将指定的拆分元素或多个元素放置在新元素之间
     * @param {Element} parentElm           要拆分的父元素
     * @param {Element} splitElm            要拆分的元素
     * @param {Element} replacementElm      用于替换拆分元素的可选替换元素
     * @return {Element}                    返回：如果指定，则返回拆分元素或替换元素
     */
    split(parentElm, splitElm, replacementElm) {

    },
    /**
     * @description                         解析指定的 RGB 颜色值并返回该颜色的十六进制版本
     * @param {String} rgbVal               RGB 字符串值，如 rgb(1,2,3)
     * @return {Element}                    返回：该 RGB 值的十六进制版本，如 #FF00FF
     */
    toHex(rgbVal) {

    },
    /**
     * @description                         解析指定的 RGB 颜色值并返回该颜色的十六进制版本
     * @param {String} prefix               在所有 id 前面添加的可选前缀 - 默认为“mce_”
     * @return {Element}                    返回：唯一 ID (uuid)
     */
    uniqueId(prefix) {

    }
}
