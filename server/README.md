<!-- Language Switcher -->
<div align="right">
  <a href="README.md">🇨🇳 中文</a> | <a href="README-en.md">🇺🇸 English</a>
</div>

# sam-editor 后端服务

sam-editor 编辑器的 Node.js 后端服务，提供文档处理、文件管理、WebSocket 实时协作等功能。

## 环境要求

-   Node.js 18+
-   MongoDB (主数据库)
-   MySQL 8 (可选，如需数据持久化)
-   Python 3+ (用于文档转换)
-   FFmpeg (用于音视频处理)

## 技术栈

-   Express 4.17
-   MongoDB + Mongoose
-   MySQL + mysql2
-   WebSocket (ws)
-   JWT 认证
-   Socket.io / ws

## 安装

```bash
cd server
npm install
```

## 项目命令

```bash
# 开发模式 (热重载)
npm run dev

# 生产模式
npm start

# 构建可执行文件 (需安装 pkg)
npm run build

# 代码检查
npm run lint

# 测试
npm test
```

## 目录结构

```
server/
├── src/
│   ├── app.js                 # 应用入口
│   ├── config/
│   │   ├── database.js        # 数据库连接
│   │   ├── mysql.js           # MySQL配置
│   │   ├── security.js        # 安全配置
│   │   └── whitelist.js       # IP白名单
│   ├── controllers/
│   │   ├── authController.js  # 认证控制器
│   │   └── apiClientController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT认证
│   │   ├── apiAuth.js         # API认证
│   │   ├── refreshToken.js    # Token刷新
│   │   ├── security.js        # 安全中间件
│   │   ├── staticAssets.js    # 静态资源
│   │   └── validator.js       # 参数验证
│   ├── models/
│   │   ├── User.js            # 用户模型
│   │   ├── ApiClient.js       # API客户端模型
│   │   └── dbSchema.js        # 数据库Schema
│   ├── routes/
│   │   ├── api.js             # API路由
│   │   ├── auth.js            # 认证路由
│   │   ├── convert.js         # 文档转换路由
│   │   ├── dbs.js             # 数据库路由
│   │   ├── document.js        # 文档路由
│   │   ├── files.js           # 文件路由
│   │   └── query.js           # 查询路由
│   ├── services/
│   │   ├── ApiClientService.js
│   │   ├── BaseService.js
│   │   ├── FileService.js
│   │   ├── mailService.js
│   │   └── UserService.js
│   ├── utils/
│   │   ├── common.js          # 通用工具
│   │   ├── convertApi.js      # 转换API
│   │   ├── jsencrypt.js       # RSA加密
│   │   ├── officeUtils.js     # Office文档工具
│   │   ├── queryBuilder.js   # 查询构建器
│   │   └── sevenZipUtils.js   # 7z解压工具
│   └── websocket/
│       └── wsServer.js        # WebSocket服务
├── public/
│   ├── tinymce/               # TinyMCE静态资源
│   └── scriptMath/           # 数学公式插件
├── config/
│   └── index.js              # 配置入口
└── ecosystem.config.js        # PM2配置
```

## API 路由

### 文件管理 `/file`

| 操作            | 说明                    |
| --------------- | ----------------------- |
| `upload`        | 文件上传                |
| `bigFileUpload` | 大文件分片上传          |
| `download`      | 文件下载                |
| `saveFile`      | 保存文件                |
| `removeFile`    | 删除文件                |
| `copyFile`      | 复制文件                |
| `compress`      | 解压缩 (zip/tar/7z/rar) |
| `getFileList`   | 获取文件列表            |

### 文档处理 `/document`

| 操作           | 说明                    |
| -------------- | ----------------------- |
| `outDoc`       | 导出 Office 文档 (docx) |
| `xmlDataTodoc` | XML 数据转 Word 文档    |
| `mathjaxToImg` | 公式转图片              |

### 文档转换 `/convert`

| 操作           | 说明                  |
| -------------- | --------------------- |
| `refreshDoc`   | 刷新文档目录/页码     |
| `mathjaxToImg` | LaTeX 公式转 PNG 图片 |

### 数据库 `/dbs`

提供 MongoDB 数据库的 CRUD 操作接口。

### 查询 `/query`

提供通用查询接口。

## WebSocket

支持实时协作编辑、心跳检测、消息广播。

```javascript
// 连接
const ws = new WebSocket('ws://localhost:3300');

// 消息格式
{ type: 'xxx', data: {...} }
```

## 环境变量

```env
# 服务端口
PORT=3300

# MongoDB
MONGO_URI=mongodb://localhost:27017/sameditor

# MySQL (可选)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=sameditor

# 会话密钥
SESSION_SECRET=your-secret-key

# JWT
JWT_SECRET=your-jwt-secret

# 文件存储路径
FILE_PATH=./files
```

## PM2 部署

```bash
# 生成模板
pm2 init simple

# 修改 ecosystem.config.js 后启动
pm2 start ecosystem.config.js
```

## 核心功能

### 1. 文件管理

-   普通文件上传
-   大文件分片上传
-   文件下载/复制/删除
-   压缩包解压 (支持 zip, tar, 7z, rar)

### 2. 文档导出

-   XML 数据转换为 Word (.docx) 文档
-   支持页眉页脚、图片、表格、公式
-   支持目录、脚注、批注

### 3. 公式处理

-   LaTeX 公式转 SVG/PNG
-   MathJax 公式渲染

### 4. 实时协作

-   WebSocket 长连接
-   多人协同编辑
-   章节锁定机制

## 依赖项

### 生产依赖

-   `express` - Web 框架
-   `mongoose` - MongoDB ODM
-   `mysql2` - MySQL 驱动
-   `jsonwebtoken` - JWT 认证
-   `ws` - WebSocket
-   `multer` - 文件上传
-   `cheerio` - HTML 解析
-   `jszip` - ZIP 处理
-   `archiver` - 压缩
-   `svg2png` - SVG 转 PNG
-   `mathjax-node` - 公式渲染

### 开发依赖

-   `nodemon` - 热重载
-   `eslint` - 代码检查
-   `pkg` - 可执行文件打包

## License

MIT

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

本项目采用 MIT 开源协议开源，仅表示你可以查看、使用和修改代码，并不代表可以将其用于商业目的。

---

Copyright © 2024 samzchou. All rights reserved.
