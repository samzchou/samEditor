<!-- Language Switcher -->
<div align="right">
  <a href="README.md">🇨🇳 中文</a> | <a href="README-en.md">🇺🇸 English</a>
</div>

# sam-editor Backend Service

Node.js backend service for sam-editor, providing document processing, file management, and WebSocket real-time collaboration.

## Requirements

-   Node.js 18+
-   MongoDB (Main database)
-   MySQL 8 (Optional, for data persistence)
-   Python 3+ (For document conversion)
-   FFmpeg (For audio/video processing)

## Tech Stack

-   Express 4.17
-   MongoDB + Mongoose
-   MySQL + mysql2
-   WebSocket (ws)
-   JWT Auth
-   Socket.io / ws

## Installation

```bash
cd server
npm install
```

## Scripts

```bash
# Development (hot reload)
npm run dev

# Production
npm start

# Build executable (requires pkg)
npm run build

# Lint
npm run lint

# Test
npm test
```

## Project Structure

```
server/
├── src/
│   ├── app.js                 # Application entry
│   ├── config/
│   │   ├── database.js        # Database connection
│   │   ├── mysql.js           # MySQL config
│   │   ├── security.js        # Security config
│   │   └── whitelist.js       # IP whitelist
│   ├── controllers/
│   │   ├── authController.js  # Auth controller
│   │   └── apiClientController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT auth
│   │   ├── apiAuth.js         # API auth
│   │   ├── refreshToken.js    # Token refresh
│   │   ├── security.js        # Security middleware
│   │   ├── staticAssets.js    # Static assets
│   │   └── validator.js       # Parameter validation
│   ├── models/
│   │   ├── User.js            # User model
│   │   ├── ApiClient.js       # API client model
│   │   └── dbSchema.js        # Database schema
│   ├── routes/
│   │   ├── api.js             # API routes
│   │   ├── auth.js            # Auth routes
│   │   ├── convert.js         # Conversion routes
│   │   ├── dbs.js             # Database routes
│   │   ├── document.js        # Document routes
│   │   ├── files.js           # File routes
│   │   └── query.js           # Query routes
│   ├── services/
│   │   ├── ApiClientService.js
│   │   ├── BaseService.js
│   │   ├── FileService.js
│   │   ├── mailService.js
│   │   └── UserService.js
│   ├── utils/
│   │   ├── common.js          # Common utilities
│   │   ├── convertApi.js      # Conversion API
│   │   ├── jsencrypt.js       # RSA encryption
│   │   ├── officeUtils.js     # Office utilities
│   │   ├── queryBuilder.js   # Query builder
│   │   └── sevenZipUtils.js   # 7z extraction
│   └── websocket/
│       └── wsServer.js        # WebSocket server
├── public/
│   ├── tinymce/               # TinyMCE static files
│   └── scriptMath/           # Math formula plugin
├── config/
│   └── index.js              # Config entry
└── ecosystem.config.js        # PM2 config
```

## API Routes

### File Management `/file`

| Operation       | Description                 |
| --------------- | --------------------------- |
| `upload`        | File upload                 |
| `bigFileUpload` | Chunked file upload         |
| `download`      | File download               |
| `saveFile`      | Save file                   |
| `removeFile`    | Delete file                 |
| `copyFile`      | Copy file                   |
| `compress`      | Decompress (zip/tar/7z/rar) |
| `getFileList`   | Get file list               |

### Document Processing `/document`

| Operation      | Description            |
| -------------- | ---------------------- |
| `outDoc`       | Export Office document |
| `xmlDataTodoc` | XML to Word document   |
| `mathjaxToImg` | Formula to image       |

### Document Conversion `/convert`

| Operation      | Description              |
| -------------- | ------------------------ |
| `refreshDoc`   | Refresh TOC/page numbers |
| `mathjaxToImg` | LaTeX to PNG image       |

### Database `/dbs`

Provides MongoDB CRUD operations.

### Query `/query`

Provides general query interface.

## WebSocket

Real-time collaboration, heartbeat detection, message broadcasting.

```javascript
// Connect
const ws = new WebSocket('ws://localhost:3300');

// Message format
{ type: 'xxx', data: {...} }
```

## Environment Variables

```env
# Server port
PORT=3300

# MongoDB
MONGO_URI=mongodb://localhost:27017/sameditor

# MySQL (optional)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=sameditor

# Session secret
SESSION_SECRET=your-secret-key

# JWT
JWT_SECRET=your-jwt-secret

# File storage path
FILE_PATH=./files
```

## PM2 Deployment

```bash
# Generate template
pm2 init simple

# Modify ecosystem.config.js then start
pm2 start ecosystem.config.js
```

## Core Features

### 1. File Management

-   Regular file upload
-   Chunked large file upload
-   File download/copy/delete
-   Archive decompression (zip, tar, 7z, rar)

### 2. Document Export

-   XML to Word (.docx) conversion
-   Support for headers/footers, images, tables, formulas
-   Support for TOC, footnotes, annotations

### 3. Formula Processing

-   LaTeX to SVG/PNG
-   MathJax formula rendering

### 4. Real-time Collaboration

-   WebSocket long-lived connections
-   Multi-user collaborative editing
-   Chapter locking mechanism

## Dependencies

### Production

-   `express` - Web framework
-   `mongoose` - MongoDB ODM
-   `mysql2` - MySQL driver
-   `jsonwebtoken` - JWT auth
-   `ws` - WebSocket
-   `multer` - File upload
-   `cheerio` - HTML parsing
-   `jszip` - ZIP handling
-   `archiver` - Compression
-   `svg2png` - SVG to PNG
-   `mathjax-node` - Formula rendering

### Development

-   `nodemon` - Hot reload
-   `eslint` - Linting
-   `pkg` - Executable packaging

## License

MIT

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

This project is open-sourced under the MIT license, which only means you can view, use, and modify the code. It does NOT permit commercial use.

---

Copyright © 2024 samzchou. All rights reserved.
