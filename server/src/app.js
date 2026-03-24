const path = require('path');
require('dotenv').config({ path: process.pkg ? path.join(process.cwd(), '.env') : path.join(__dirname, '../.env') });
const express = require('express');
const http = require('http');
const wsServer = require('./websocket/wsServer');
const bodyParser = require('body-parser');
// const requestIp = require('request-ip');
const session = require('express-session');
// const crypto = require('crypto');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// const ipRangeCheck = require('ip-range-check');
const cors = require('cors');
const timeout = require('connect-timeout');

const dbController = require('./config/database');
const authRoutes = require('./routes/auth');
const dbsRoutes = require('./routes/dbs');
const queryRoutes = require('./routes/query');
const fileRoutes = require('./routes/files');
const convertRoutes = require('./routes/convert');
const documentRoutes = require('./routes/document');
// const security = require('./middleware/security');
const config = require('./config/whitelist');

// 构建服务
const app = express();
const server = http.createServer(app);

// 设置应用根目录
global.appRoot = process.pkg ? path.dirname(process.execPath) : path.join(__dirname, '..');

// 连接MongoDB 数据库
dbController.connectMg();
// 连接Mysql 数据库
dbController.connectMysql();

// 设置 trust proxy
// app.set('trust proxy', 'loopback');
// app.use(requestIp.mw());

app.use(timeout('1500s'));

// 配置 session 中间件 - 移到这里，在其他中间件之前
app.use(session({
    secret: process.env.SESSION_SECRET || 'sam-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, //process.env.NODE_ENV === "production",
        sameSite: 'lax', // process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        maxAge: 1000 * 60 * 15, // 15分钟过期
    },
}));

// 配置安全中间件
/*
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'ws:', 'wss:'],
            frameAncestors: [
                "'self'",
                'http://localhost:*',
                'http://127.0.0.1:*',
                'http://192.168.99.45:*',
                'http://153.34.31.21:*',
                'https://www.deepdocs.me',
            ],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false, // 如果需要加载跨域资源，设置为 false
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    // 启用 XSS 过滤
    xssFilter: true,
    // 防止点击劫持
    frameguard: false, // 因为我们要使用 iframe，所以禁用默认的 frameguard
    // 禁止嗅探 MIME 类型
    noSniff: true,
    // 隐藏 X-Powered-By 头
    hidePoweredBy: true,
    // 设置 DNS 预获取控制
    dnsPrefetchControl: { allow: false },
}));
*/

// 配置CORS中间件
const allowedOrigins = [
    'http://localhost:8383',
    'http://127.0.0.1:8383',
    'http://192.168.99.45:80',
    'http://153.34.31.21:4580',
    'https://www.deepdocs.me',
]
app.use(cors());
/* app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin)
        } else {
            callback(new Error('Illegal request for resources!'))
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
})); */
// 处理预检请求
// app.options('*', cors());

// 添加安全头中间件
/* app.use((req, res, next) => {
    // 移除 X-Frame-Options
    res.removeHeader('X-Frame-Options');
    // 使用 CSP 来控制 iframe 加载
    res.setHeader(
        'Content-Security-Policy',
        "frame-ancestors 'self' http://localhost:* http://127.0.0.1:* http://192.168.99.45:* http://153.34.31.21:* https://www.deepdocs.me"
    );
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
        'Permissions-Policy',
        'geolocation=(), microphone=(), camera=()'
    );
    // 设置 cookie 安全选项
    res.cookie('sessionId', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    next();
}) */

// 创建限制器工厂
/*
const createLimiter = (options) => {
    return rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        ...options,
        skip: (req) => {
            // 获取当前环境的白名单IP
            const whitelistedIPs =
                config.whitelistedIPs[process.env.NODE_ENV] || []
            // 检查IP是否在白名单中
            const isWhitelisted = whitelistedIPs.some((ip) => {
                if (ip.includes('/')) {
                    return ipRangeCheck(req.ip, ip)
                }
                return req.ip === ip
            })
            if (isWhitelisted) return true

            // 特定的 API key
            if (config.trustedAPIKeys.includes(req.headers['x-api-key'])) {
                return true
            }

            // 文件上传请求
            if (req.headers['x-upload-type'] === 'chunk') return true
            if (req.path.includes('/file')) return true

            return false
        },
        keyGenerator: (req) => {
            // 可以使用不同的键来分别限制
            // 例如：基于用户ID而不是IP
            return req.headers['x-api-key'] || req.ip
        },
        handler: (req, res) => {
            res.json({
                code: 429,
                error: 'Too many requests',
                retryAfter: res.getHeader('Retry-After'),
            })
        },
    })
}

// 创建不同的限制器
const apiLimiter = createLimiter({ max: 100 });
const uploadLimiter = createLimiter({
    max: 1000,
    windowMs: 30 * 60 * 1000, // 30分钟窗口
});

// 应用限制器
app.use('/file', (req, res, next) => {
    // 动态决定是否应用限制
    if (req.headers['content-length'] > 10 * 1024 * 1024) {
        // 10MB
        return next(); // 大文件跳过限制
    }
    return uploadLimiter(req, res, next);
});

app.use('/auth', (req, res, next) => {
    // 可以根据请求类型动态决定是否限制
    if (req.method === 'OPTIONS') return next();
    return apiLimiter(req, res, next);
});
*/

// 限制请求体大小
app.use(express.json({ limit: '1200mb' }))
app.use(bodyParser.urlencoded({ limit: '1200mb', extended: true }))

// API公共平台验证
/* app.use((req, res, next) => {
    const appId = req.get('x-app-id');
    const appKey = req.get('x-app-key');
    const appSecret = req.get('x-app-secret');
    const timestamp = req.get('x-timestamp');

  
    if (validateRequest(appId, appKey, appSecret, timestamp)) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}); */

// 设置静态资源目录为 public
app.use(express.static(path.join(global.appRoot, 'public')));

const packageData = require('../package.json');
app.get('/getVersion', (req, res, next) => {
    res.setHeader('Content-Type', 'text/html;charset=utf8');
    res.end(
        '[' +
        packageData.name +
        '] ➟ version:' +
        packageData.version +
        ', buildTime:'
    )
});

// API 路由
app.use(authRoutes);
app.use(fileRoutes);
app.use(dbsRoutes);
app.use(queryRoutes);
app.use(convertRoutes);
app.use(documentRoutes);

// 初始化 WebSocket 服务器
wsServer.initialize(server);

// 监听 WebSocket 事件示例
wsServer.on('clientConnected', ({ clientId, ws, req }) => {
    //console.log(`New client connected: ${clientId}`);
})

wsServer.on('message', ({ clientId, data }) => {
    //console.log(`Received message from ${clientId}:`, data);
})

wsServer.on('clientDisconnected', (clientId) => {
    //console.log(`Client disconnected: ${clientId}`);
})

// 错误处理
app.use((err, req, res, next) => {
    //console.error(err.stack);
    res.status(500).json({ message: 'Server Error' });
})

// 修改服务器启动代码
const PORT = process.env.PORT || 3300;
server.setTimeout(150 * 1000);
const appServer = server.listen(PORT, () => {
    setTimeout(() => {
        console.log(`HTTP/WebSocket Server running at: ${PORT}`);
    }, 300)
})

process.on('SIGINT', () => {
    console.log('closing server...');
    appServer.close(() => {
        console.log('Server closed');
        process.exit(0);
    })
})

module.exports = app
