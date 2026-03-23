# sam-editor
一个集成富文本的在线WORD文档编辑器

[ [查看演示 Demo](http://editor.bzton.com/) ]
[ [更新日志](https://github.com/xyxiao001/vue-cropper/blob/master/CHANGELOG.md) ]



## 一、安装使用


### 1. 安装

```bash
# npm 安装
npm install sam-editor
```
```bash
# yarn 安装
yarn add sam-editor
```

### 2. 引入 sam-editor
`Vue 3` 组件内引入
```bash
import { samEditor } from 'sam-editor';
import 'sam-editor/index/style.css';
```

`Vue3` 全局引入
```js
import { samEditor } from 'sam-editor';
import 'sam-editor/index/style.css';

const app = createApp(App)
app.use(VueCropper)
app.mount('#app')
```

`nuxt` 引入方式
```js
if(process.browser) {
  samEditor = require('sam-editor')
  Vue.use(samEditor)
}
```

### 3. 代码中使用

```html
<sam-editor ref="samEditor" :data="editorSetting" @change="changeEvent"></sam-editor>
```


## 二、文档

### 1. props 属性配置
```js
editorSetting: {
    readonly: false,                                // 只读模式
    hideMenu: true,                                 // 隐藏菜单
    hideNav: true,                                  // 隐藏左侧导航栏
    menu: {                                         // 菜单栏
        file: { title: 'File', items: 'newStandard openFile save-btn restoredraft | preview | close-btn' },
        edit: { title: 'Edit', items: 'undo redo | cut copy paste | searchreplace' },
        view: { title: 'View', items: ' | preview fullscreen' },
        insert: { title: 'Insert', items: 'image inserttable | charmap hr | math linecode-btn textnode-btn' },
        format: { title: 'Format', items: 'bold italic underline strikethrough superscript subscript | fontformats fontsizes align lineheight | forecolor backcolor | removeformat' },
        tools: { title: 'Tools', items: 'spellchecker spellcheckerlanguage | code' },
        table: { title: 'Table', items: 'inserttable | cell row column | tableprops deletetable' },
        help: { title: 'Help', items: 'help | bzt-ver' },
    },
    toolbar1: 'undo redo | close-btn save-btn | queue levels | hr finished-btn paragraph-btn title-block formatting | alignment indent2em lineheight | image charmap table | pageLayout page-type | searchreplace preview fullscreen | code',
    toolbar2: 'zhu-btn | example-btn | articleTitle imgtitle-btn | footer-btn | math graphy | introduceGroup quote-btn term quota | comment | catalogue | exportFile mergePage',
    quickbars: 'bold italic underline strikethrough superscript subscript',
    draftTimes: 30000,
    htmlContent: ''
}
```

### 2. 可用回调方法 changeEvent

- `@realTime` 实时预览事件
- `@imgMoving`  图片移动回调函数
- `@cropMoving` 截图框移动回调函数
- `@imgLoad`  图片加载的回调, 返回结果 `success`,  `error`


### 3. 外部接口调用
