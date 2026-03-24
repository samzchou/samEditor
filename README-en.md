<!-- Language Switcher -->
<div align="right">
  <a href="README.md">🇨🇳 中文</a> | <a href="README-en.md">🇺🇸 English</a>
</div>

# sam-editor

A web-based WYSIWYG Word document editor with multi-user collaboration, document structuring, and AI-powered features.

[Online Demo](https://zenpai.cn/docEditor)

## Features

-   **Rich Text Editing**: Based on TinyMCE 5/6, providing complete Word document editing experience
-   **Multi-user Collaboration**: Real-time collaboration, chapter locking, outline assignment
-   **Document Structuring**: Support for standard, intelligent, and structured documents
-   **Outline/TOC**: Auto-generated table of contents with hierarchical navigation
-   **PDF Viewer**: Built-in PDF document preview
-   **PDF Parser**: PDF to HTML structured content conversion
-   **Document Comparison**: Document diff comparison
-   **AI Documents**: Integrated AI assistance features

## Components

| Component        | Description           |
| ---------------- | --------------------- |
| `sam-editor`     | Main editor component |
| `outline`        | Outline/TOC component |
| `pdf-viewer`     | PDF reader            |
| `struct-viewer`  | Structured doc viewer |
| `ai-doc`         | AI document component |
| `pdf-parse`      | PDF parser            |
| `doc-comparison` | Document comparison   |

## Installation

```bash
# npm
npm install sam-editor

# yarn
yarn add sam-editor
```

## Quick Start

### Import Component

```javascript
import { samEditor } from "sam-editor";
import "sam-editor/index/style.css";
```

### Global Registration

```javascript
import { samEditor } from "sam-editor";
import "sam-editor/index/style.css";

const app = createApp(App);
app.use(samEditor);
app.mount("#app");
```

### Usage in Template

```html
<sam-editor
    ref="samEditor"
    :data="editorSetting"
    @change="changeEvent"
></sam-editor>
```

## Configuration

### editorSetting Props

```javascript
const editorSetting = {
    appId: "", // Authorization ID
    appKey: "", // Authorization key

    // Collaboration settings
    author: {
        userId: 1,
        userName: "John",
        commitId: "",
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
    zoomIn: true, // Page zoom
    openSidebar: true, // Default open sidebar
    navShow: true, // Show left navigation

    // Menu config
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

    // Toolbar config
    toolbar1: "undo redo | close-btn save | catalogue ...",
    toolbar2: "example-btn zhu-btn ...",
    quickbars: "bold italic underline strikethrough",

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

## Scripts

```bash
# Install dependencies
yarn install

# Development
yarn dev

# Production build
yarn build:prod

# Build library
yarn build:lib

# Lint
yarn lint
```

## Tech Stack

-   Vue 2.6+
-   TinyMCE 5.8
-   Element UI 2.15
-   Socket.io
-   Axios

## Project Structure

```
sam-editor/
├── src/
│   ├── components/
│   │   ├── samEditor/         # Main editor
│   │   ├── tinymceEditor/     # TinyMCE core
│   │   ├── outline/           # Outline/TOC
│   │   ├── pdfViewer/         # PDF viewer
│   │   ├── pdfParse/          # PDF parsing
│   │   ├── aiDoc/             # AI documents
│   │   ├── docComparison/     # Doc comparison
│   │   └── reader/            # Document reader
│   ├── api/                   # API interfaces
│   ├── views/                 # View pages
│   ├── slotApi/               # Slot APIs
│   └── libs/                  # Third-party libs
├── packages/                  # Package exports
├── dist/                      # Build output
├── lib/                       # Library output
└── server/                    # Backend (Node.js + Express)
```

## Backend Service

Full backend service included. See [server/README.md](./server/README.md)

### Backend Tech Stack

-   Node.js 18+
-   Express 4.17
-   MongoDB + Mongoose
-   MySQL (optional)
-   WebSocket (ws)
-   JWT Auth

### Quick Start

```bash
cd server
npm install
npm run dev     # Development
npm start       # Production
```

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
