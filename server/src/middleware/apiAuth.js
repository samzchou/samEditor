const ApiClient = require('../models/ApiClient');
const rateLimit = require('express-rate-limit');
const { createClient } = require('redis');

const redis = createClient({ url: process.env.REDIS_URL });
redis.connect().catch(console.error);

const apiAuthMiddleware = async (req, res, next) => {
    try {
        // 获取请求头中的认证信息
        const apiId = req.header('X-Api-Id');
        const apiKey = req.header('X-Api-Key');
        const timestamp = req.header('X-Timestamp');
        const signature = req.header('X-Signature');

        if (!apiId || !apiKey || !timestamp || !signature) {
            return res.status(401).json({ message: '缺少认证信息' });
        }

        // 验证时间戳（防止重放攻击）
        const now = Date.now();
        const requestTime = parseInt(timestamp);
        if (now - requestTime > 300000) { // 5分钟过期
            return res.status(401).json({ message: '请求已过期' });
        }

        // 查找 API 客户端
        const apiClient = await ApiClient.findOne({ apiId, apiKey });
        if (!apiClient) {
            return res.status(401).json({ message: '无效的 API 凭证' });
        }

        // 检查状态
        if (apiClient.status !== 'active') {
            return res.status(403).json({ message: 'API 客户端已被禁用' });
        }

        // 检查 IP 白名单
        if (apiClient.ipWhitelist && apiClient.ipWhitelist.length > 0) {
            const clientIp = req.ip;
            if (!apiClient.ipWhitelist.includes(clientIp)) {
                return res.status(403).json({ message: 'IP 地址未授权' });
            }
        }

        // 验证签名
        const isValidSignature = apiClient.verifySignature(
            signature,
            timestamp,
            req.method,
            req.path,
            req.body
        );

        if (!isValidSignature) {
            return res.status(401).json({ message: '签名验证失败' });
        }

        // 更新最后使用时间
        await ApiClient.updateOne(
            { _id: apiClient._id },
            { $set: { lastUsedAt: new Date() } }
        );

        // 将 API 客户端信息添加到请求对象
        req.apiClient = apiClient;
        next();
    } catch (error) {
        next(error);
    }
};

// 创建基于 Redis 的速率限制中间件
const createApiRateLimiter = (apiClient) => {
    return rateLimit({
        windowMs: apiClient.rateLimit.per * 1000,
        max: apiClient.rateLimit.requests,
        keyGenerator: (req) => req.apiClient.apiId,
        handler: (req, res) => {
            res.status(429).json({
                message: '已超过 API 调用限制',
                limit: req.apiClient.rateLimit.requests,
                windowMs: req.apiClient.rateLimit.per * 1000
            });
        },
        store: {
            incr: async (key) => {
                const count = await redis.incr(key);
                if (count === 1) {
                    await redis.expire(key, apiClient.rateLimit.per);
                }
                return count;
            },
            decr: (key) => redis.decr(key),
            resetKey: (key) => redis.del(key)
        }
    });
};

module.exports = { apiAuthMiddleware, createApiRateLimiter }; 