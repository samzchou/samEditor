<!-- Language Switcher -->
<div align="right">
  <a href="README.md">🇨🇳 中文</a> | <a href="README-en.md">🇺🇸 English</a>
</div>

# sam-editor

A web-based WYSIWYG Word document editor with multi-user collaboration, document structuring, and AI-powered features.

[Online Demo](https://zenpai.cn/docEditor)

---

## 1. Installation

### Install

```bash
# npm
npm install sam-editor
```

```bash
# yarn
yarn add sam-editor
```

### Import sam-editor

Component import:

```javascript
import { samEditor } from "sam-editor";
import "sam-editor/index/style.css";
```

Global registration:

```javascript
import { samEditor } from "sam-editor";
import "sam-editor/index/style.css";

const app = createApp(App);
app.use(samEditor);
app.mount("#app");
```

### Usage

```html
<sam-editor
    ref="samEditor"
    :data="editorSetting"
    @change="changeEvent"
></sam-editor>
```

---

## 2. Components

Available Vue components:

| Component        | Description           |
| ---------------- | --------------------- |
| `sam-editor`     | Main editor component |
| `outline`        | Outline/TOC component |
| `pdf-viewer`     | PDF reader            |
| `struct-viewer`  | Structured doc viewer |
| `ai-doc`         | AI document component |
| `pdf-parse`      | PDF parser            |
| `doc-comparison` | Document comparison   |

### Export Methods

```javascript
// Import all components
import samEditor from "sam-editor";

// Import specific components
import { samEditor, outline, pdfViewer } from "sam-editor";
```

---

## 3. Configuration

### Props

```javascript
const editorSetting = {
    // Authorization
    appId: "", // Authorization ID
    appKey: "", // Authorization key

    // Collaboration settings
    author: {
        userId: 1,
        userName: "John",
        isAdmin: true, // Admin can edit outline
        lockedAll: false, // Default: no locks
        assignOutline: true, // Can assign outline
        memberList: [{ userName: "sam", userId: "1" }],
        unlockedAutoSave: true, // Auto-save after unlock
        lockedTimes: 10000, // Lock polling interval
        outlineLevel: 2, // Outline assignment level
    },

    // Server URLs
    editorURL: "http://xxx:9088", // Java API
    nodeURL: "http://xxx:9001", // Node server
    socketURL: "ws://xxx:13100/ws-api", // WebSocket

    // Display settings
    readonly: false, // Read-only mode
    hideMenu: true, // Hide menu
    hideNav: true, // Hide left navigation
    zoomIn: true, // Page zoom
    openSidebar: true, // Default open sidebar
    navShow: true, // Show left navigation

    // Menu config
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

    // Toolbar config
    toolbar1:
        "undo redo | close-btn save-btn | queue levels | hr finished-btn paragraph-btn title-block formatting | alignment indent2em lineheight | image charmap table | pageLayout page-type | searchreplace preview fullscreen | code",
    toolbar2:
        "zhu-btn | example-btn | articleTitle imgtitle-btn footer-btn | math graphy | introduceGroup quote-btn term quota | comment | catalogue | exportFile mergePage",
    quickbars: "bold italic underline strikethrough superscript subscript",

    // Other options
    draftTimes: 30000, // Auto-save interval
    autoMathNum: true, // Auto numbering for formulas
    htmlContent: "", // Initial content
};
```

### Events

| Event       | Description             |
| ----------- | ----------------------- |
| `@change`   | Content change event    |
| `@realTime` | Real-time preview event |
| `@imgLoad`  | Image load callback     |

### External Methods

```javascript
this.$refs.samEditor.getContent(); // Get HTML content
this.$refs.samEditor.getJson(); // Get JSON structure
this.$refs.samEditor.setContent(html); // Set content
this.$refs.samEditor.save(); // Save document
this.$refs.samEditor.exportFile(); // Export file
```

---

## 4. Build Output

This directory (`packages/`) packages components for release.

### Build Commands

```bash
# Build library
npm run build:lib

# Build Aliyun version
npm run build:aliyun
```

### Output Files

Output to `lib/dist/`:

-   `sam-editor.umd.js` - UMD format
-   `sam-editor.umd.min.js` - UMD minified
-   `sam-editor.common.js` - CommonJS format
-   `sam-editor.css` - Styles

---

## 5. Tech Stack

-   Vue 2.6+
-   TinyMCE 5.8
-   Element UI 2.15
-   Socket.io
-   Axios

---

## License

ISC

---

## Copyright & Disclaimer

This project source code is for internal learning and research only. **Without written permission from the author, it is strictly prohibited** for any commercial products, enterprise applications, or profit-making purposes.

### Prohibited Actions

-   Releasing, selling, or distributing this code (modified or not) as a commercial product
-   Using this project for any commercial enterprise projects (paid or free)
-   Integrating this code into any commercial products or services
-   Using this project name for commercial promotion or profit-making activities

### Authorization Request

To use this project for commercial purposes or other legitimate uses, please contact the author for written authorization:

-   Email: 7686103@qq.com

### Disclaimer

-   This project is provided "AS IS" without any express or implied warranties
-   The author is not responsible for any damages arising from the use of this project
-   Use at your own risk

### Open Source License

This project is open-sourced under the ISC license, which only means you can view, use, and modify the code. It does NOT permit commercial use.

---

Copyright © 2024 samzchou. All rights reserved.
