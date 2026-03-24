<!-- Language Switcher -->
<div align="right">
  <a href="README.md">🇨🇳 中文</a> | <a href="README-en.md">🇺🇸 English</a>
</div>

# sam-editor

一个集成富文本的在线 WORD 文档编辑器，支持多人协同、文档结构化、AI 智能文档等功能。

[查看演示 Demo](https://zenpai.cn/docEditor)

---

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

组件内引入

```javascript
import { samEditor } from "sam-editor";
import "sam-editor/index/style.css";
```

全局引入

```javascript
import { samEditor } from "sam-editor";
import "sam-editor/index/style.css";

const app = createApp(App);
app.use(samEditor);
app.mount("#app");
```

### 3. 代码中使用

```html
<sam-editor
    ref="samEditor"
    :data="editorSetting"
    @change="changeEvent"
></sam-editor>
```

---

## 二、组件列表

本项目提供以下 Vue 组件：

| 组件             | 说明             |
| ---------------- | ---------------- |
| `sam-editor`     | 主编辑器组件     |
| `outline`        | 大纲/目录组件    |
| `pdf-viewer`     | PDF 阅读器       |
| `struct-viewer`  | 结构化文档阅读器 |
| `ai-doc`         | AI 智能文档组件  |
| `pdf-parse`      | PDF 解析器       |
| `doc-comparison` | 文档比对组件     |

### 导出方式

```javascript
// 导入所有组件
import samEditor from "sam-editor";

// 按需导入单个组件
import { samEditor, outline, pdfViewer } from "sam-editor";
```

---

## 三、配置说明

### 1. props 属性配置

```javascript
const editorSetting = {
    // 授权配置
    appId: "", // 授权使用的ID
    appKey: "", // 授权使用的认证码

    // 多人协同配置
    author: {
        userId: 1,
        userName: "张三",
        isAdmin: true, // 是否为管理员
        lockedAll: false, // 默认全不锁定
        assignOutline: true, // 是否可以分配大纲
        memberList: [{ userName: "sam", userId: "1" }],
        unlockedAutoSave: true, // 解锁后自动保存
        lockedTimes: 10000, // 锁定轮询间隔
        outlineLevel: 2, // 大纲分配层级
    },

    // 服务地址配置
    editorURL: "http://xxx:9088", // JAVA接口地址
    nodeURL: "http://xxx:9001", // Node服务地址
    socketURL: "ws://xxx:13100/ws-api", // WebSocket地址

    // 显示配置
    readonly: false, // 只读模式
    hideMenu: true, // 隐藏菜单
    hideNav: true, // 隐藏左侧导航栏
    zoomIn: true, // 页面缩放
    openSidebar: true, // 默认打开左侧栏
    navShow: true, // 左侧导航栏显示

    // 菜单栏配置
    menu: {
        file: {
            title: "File",
            items: "newStandard openFile save-btn restoredraft | preview | close-btn",
        },
        edit: {
            title: "Edit",
            items: "undo redo | cut copy paste | searchreplace",
        },
        view: { title: "View", items: " | preview fullscreen" },
        insert: {
            title: "Insert",
            items: "image inserttable | charmap hr | math linecode-btn textnode-btn",
        },
        format: {
            title: "Format",
            items: "bold italic underline strikethrough superscript subscript | fontformats fontsizes align lineheight | forecolor backcolor | removeformat",
        },
        tools: {
            title: "Tools",
            items: "spellchecker spellcheckerlanguage | code",
        },
        table: {
            title: "Table",
            items: "inserttable | cell row column | tableprops deletetable",
        },
        help: { title: "Help", items: "help | bzt-ver" },
    },

    // 工具栏配置
    toolbar1:
        "undo redo | close-btn save-btn | queue levels | hr finished-btn paragraph-btn title-block formatting | alignment indent2em lineheight | image charmap table | pageLayout page-type | searchreplace preview fullscreen | code",
    toolbar2:
        "zhu-btn | example-btn | articleTitle imgtitle-btn | footer-btn | math graphy | introduceGroup quote-btn term quota | comment | catalogue | exportFile mergePage",
    quickbars: "bold italic underline strikethrough superscript subscript",

    // 其他配置
    draftTimes: 30000, // 草稿箱自动保存间隔
    autoMathNum: true, // 自动生成公式编号
    htmlContent: "", // 初始文档内容
};
```

### 2. 事件回调

| 事件名      | 说明             |
| ----------- | ---------------- |
| `@change`   | 编辑内容变化事件 |
| `@realTime` | 实时预览事件     |
| `@imgLoad`  | 图片加载回调     |

### 3. 外部接口调用

通过 `ref` 调用编辑器方法：

```javascript
this.$refs.samEditor.getContent(); // 获取HTML内容
this.$refs.samEditor.getJson(); // 获取JSON结构
this.$refs.samEditor.setContent(html); // 设置内容
this.$refs.samEditor.save(); // 保存文档
this.$refs.samEditor.exportFile(); // 导出文件
```

---

## 四、打包输出

本目录 (`packages/`) 负责将组件打包成可发布的库文件。

### 构建命令

```bash
# 构建库文件
npm run build:lib

# 构建阿里云版本
npm run build:aliyun
```

### 输出文件

构建后的文件输出到 `lib/dist/` 目录：

-   `sam-editor.umd.js` - UMD 格式
-   `sam-editor.umd.min.js` - UMD 压缩版
-   `sam-editor.common.js` - CommonJS 格式
-   `sam-editor.css` - 样式文件

---

## 五、技术栈

-   Vue 2.6+
-   TinyMCE 5.8
-   Element UI 2.15
-   Socket.io
-   Axios

---

## License

ISC

---

## 版权声明 & 免责声明

本项目源代码仅供内部学习交流使用，未经作者本人书面授权，**严禁** 用于任何商业产品、企业级应用或其他盈利性目的。

### 禁止事项

-   不得将本项目代码直接或修改后作为商业产品发布、销售或分发
-   不得将本项目用于企业级商业项目无论是否收费
-   不得将本项目代码整合到任何商业产品或服务中
-   不得以本项目名义进行任何商业推广或盈利活动

### 授权申请

如需将本项目用于商业用途或其他合法目的，请通过以下方式联系作者进行书面授权洽谈：

-   邮箱：7686103@qq.com

### 免责声明

-   本项目按"原样"提供，不提供任何明示或暗示的保证
-   作者不对使用本项目代码导致的任何损失承担责任
-   使用本项目代码的风险由用户自行承担

### 开源协议

本项目采用 ISC 开源协议开源，仅表示你可以查看、使用和修改代码，并不代表可以将其用于商业目的。

---

Copyright © 2024 samzchou. All rights reserved.
