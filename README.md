<!-- Language Switcher -->
<div align="right">
  <a href="README.md">🇨🇳 中文</a> | <a href="README-en.md">🇺🇸 English</a>
</div>

# sam-editor

一个集成富文本的在线 WORD 文档编辑器，支持多人协同、文档结构化、AI 智能文档等功能。

[在线演示 Demo](https://zenpai.cn/docEditor)

## 功能特性

-   **富文本编辑**：基于 TinyMCE 5/6，提供完整的 Word 文档编辑体验
-   **多人协同**：支持实时协作、章节锁定、大纲分配
-   **文档结构化**：支持标准文档、智能文档、结构化文档
-   **大纲目录**：自动生成目录，支持层级导航
-   **PDF 阅读器**：内置 PDF 文档预览功能
-   **PDF 解析**：支持 PDF 转 HTML 结构化内容
-   **文档比对**：支持文档差异对比
-   **AI 智能文档**：集成 AI 辅助功能

## 组件列表

| 组件             | 说明             |
| ---------------- | ---------------- |
| `sam-editor`     | 主编辑器组件     |
| `outline`        | 大纲/目录组件    |
| `pdf-viewer`     | PDF 阅读器       |
| `struct-viewer`  | 结构化文档阅读器 |
| `ai-doc`         | AI 智能文档组件  |
| `pdf-parse`      | PDF 解析器       |
| `doc-comparison` | 文档比对组件     |

## 安装

```bash
# npm 安装
npm install sam-editor

# yarn 安装
yarn add sam-editor
```

## 快速开始

### 引入组件

```javascript
import { samEditor } from "sam-editor";
import "sam-editor/index/style.css";
```

### 全局引入

```javascript
import { samEditor } from "sam-editor";
import "sam-editor/index/style.css";

const app = createApp(App);
app.use(samEditor);
app.mount("#app");
```

### 模板中使用

```html
<sam-editor
    ref="samEditor"
    :data="editorSetting"
    @change="changeEvent"
></sam-editor>
```

## 配置说明

### editorSetting 属性

```javascript
const editorSetting = {
    appId: "", // 授权使用的ID
    appKey: "", // 授权使用的认证码

    // 多人协同配置
    author: {
        userId: 1,
        userName: "张三",
        commitId: "",
        isAdmin: true, // 是否为管理员
        lockedAll: false, // 默认全不锁定
        assignOutline: true, // 是否可以分配大纲
        memberList: [{ userName: "sam", userId: "1" }],
        unlockedAutoSave: true, // 解锁后自动保存
        lockedTimes: 10000, // 锁定轮询间隔
        outlineLevel: 2, // 大纲分配层级
    },

    // 编辑器服务器地址
    editorURL: "http://xxx:9088", // JAVA接口地址
    nodeURL: "http://xxx:9001", // Node服务地址
    socketURL: "ws://xxx:13100/ws-api", // WebSocket地址

    // 显示配置
    readonly: false, // 只读模式
    zoomIn: true, // 页面缩放
    openSidebar: true, // 默认打开左侧栏
    navShow: true, // 左侧导航栏显示

    // 菜单配置
    menu: {
        file: {
            title: "File",
            items: "save | searchreplace | exportFile | close-btn",
        },
        edit: {
            title: "Edit",
            items: "undo redo | cut copy paste | searchreplace",
        },
        // ...
    },

    // 工具栏配置
    toolbar1: "undo redo | close-btn save | catalogue ...",
    toolbar2: "example-btn zhu-btn ...",
    quickbars: "bold italic underline strikethrough",

    // 其他配置
    draftTimes: 30000, // 草稿箱自动保存间隔
    autoMathNum: true, // 自动生成公式编号
    htmlContent: "", // 初始文档内容
};
```

### 事件回调

| 事件名      | 说明             |
| ----------- | ---------------- |
| `@change`   | 编辑内容变化事件 |
| `@realTime` | 实时预览事件     |
| `@imgLoad`  | 图片加载回调     |

### 外部接口

通过 `ref` 调用编辑器方法：

```javascript
this.$refs.samEditor.getContent(); // 获取HTML内容
this.$refs.samEditor.getJson(); // 获取JSON结构
this.$refs.samEditor.setContent(html); // 设置内容
this.$refs.samEditor.save(); // 保存文档
this.$refs.samEditor.exportFile(); // 导出文件
```

## 项目命令

```bash
# 安装依赖
yarn install

# 开发模式
yarn dev

# 生产构建
yarn build:prod

# 构建库文件
yarn build:lib

# 代码检查
yarn lint
```

## 技术栈

-   Vue 2.6+
-   TinyMCE 5.8
-   Element UI 2.15
-   Socket.io
-   Axios

## 目录结构

```
sam-editor/
├── src/
│   ├── components/
│   │   ├── samEditor/         # 主编辑器
│   │   ├── tinymceEditor/     # TinyMCE核心
│   │   ├── outline/           # 大纲目录
│   │   ├── pdfViewer/         # PDF阅读器
│   │   ├── pdfParse/          # PDF解析
│   │   ├── aiDoc/             # AI智能文档
│   │   ├── docComparison/     # 文档比对
│   │   └── reader/            # 文档阅读器
│   ├── api/                   # API接口
│   ├── views/                 # 视图页面
│   ├── slotApi/               # 插槽API
│   └── libs/                  # 第三方库
├── packages/                  # 组件导出配置
├── dist/                      # 构建输出
├── lib/                       # 库文件输出
└── server/                    # 后端服务 (Node.js + Express)
```

## 后端服务

项目包含完整的后端服务，详见 [server/README.md](./server/README.md)

### 后端技术栈

-   Node.js 18+
-   Express 4.17
-   MongoDB + Mongoose
-   MySQL (可选)
-   WebSocket (ws)
-   JWT 认证

### 快速启动

```bash
cd server
npm install
npm run dev     # 开发模式
npm start       # 生产模式
```

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
