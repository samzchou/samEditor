const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss-clean');
const hpp = require('hpp');

// 创建限速器
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制每个IP 15分钟内最多100个请求
    message: '请求过于频繁，请稍后再试',
    standardHeaders: true,
    legacyHeaders: false,
});

// 登录限速器
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 改为15分钟
    max: 10, // 增加到10次
    message: '登录失败次数过多，请15分钟后再试',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // 登录成功后不计入次数
    handler: (req, res) => {
        res.json({
            code: 429,
            status: 'error',
            message: '登录失败次数过多，请15分钟后再试',
            remainingTime: Math.ceil(req.rateLimit.resetTime / 1000 / 60) // 返回剩余分钟数
        });
    }
});

// CORS 配置
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://127.0.0.1:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['New-Token'],
    credentials: true,
    maxAge: 86400 // 24小时
};

const securityMiddleware = {
    // limiter,
    loginLimiter,
    corsConfig: cors(corsOptions),
    helmetConfig: helmet(),
    xssConfig: xss(),
    hppConfig: hpp()
};

module.exports = securityMiddleware; 