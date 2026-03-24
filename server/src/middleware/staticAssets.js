const express = require('express');
const path = require('path');
const mime = require('mime-types');

// 允许访问的文件类型
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'application/pdf',
    'text/plain',
    'text/css',
    'application/javascript',
    'application/json',
    'font/woff',
    'font/woff2',
    'font/ttf'
];

// 静态资源配置
const staticAssetsConfig = {
    // 设置静态文件目录
    setStaticRoutes: (app) => {
        // 使用环境变量中的路径
        const publicDir = process.env.PUBLIC_DIR || 'public';
        const publicPath = path.isAbsolute(publicDir) ? 
            publicDir : 
            path.join(global.appRoot, publicDir);
        
        // 基本静态文件中间件配置
        const staticOptions = {
            dotfiles: 'ignore', // 忽略点文件
            etag: true, // 启用 ETag
            extensions: false, // 不自动添加扩展名
            fallthrough: true, // 未找到文件时继续下一个中间件
            immutable: false, // 不设置 immutable 缓存
            index: false, // 禁用目录索引
            maxAge: '1d', // 缓存时间
            redirect: false, // 禁用重定向
            setHeaders: (res, filePath) => {
                // 设置安全响应头
                res.setHeader('X-Content-Type-Options', 'nosniff');
                
                // 获取文件类型
                const mimeType = mime.lookup(filePath);
                
                // 检查文件类型是否允许
                if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
                    res.status(403).end();
                    return;
                }

                // 设置缓存控制
                if (process.env.NODE_ENV === 'production') {
                    res.setHeader('Cache-Control', 'public, max-age=86400');
                } else {
                    res.setHeader('Cache-Control', 'no-cache');
                }
            }
        };

        // 使用 express.static 中间件
        app.use('/static', express.static(publicPath, staticOptions));

        // 添加安全检查中间件
        app.use('/static', (req, res, next) => {
            // 阻止目录遍历
            if (req.path.includes('..')) {
                return res.status(403).json({ message: '非法访问路径' });
            }

            // 检查文件扩展名
            const ext = path.extname(req.path).toLowerCase();
            if (!ext) {
                return res.status(403).json({ message: '需要文件扩展名' });
            }

            next();
        });
    }
};

module.exports = staticAssetsConfig; 