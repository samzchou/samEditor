const jwt = require('jsonwebtoken');

const refreshTokenMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 计算 token 的剩余有效期（以秒为单位）
        const tokenExp = decoded.exp;
        const currentTime = Math.floor(Date.now() / 1000);
        const timeRemaining = tokenExp - currentTime;
        
        // 如果 token 剩余有效期小于 30 分钟（1800 秒），则刷新 token
        if (timeRemaining < 1800) {
            const newToken = jwt.sign(
                { id: decoded.id, role: decoded.role },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );
            res.setHeader('New-Token', newToken);
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        // token 已过期或无效，继续执行下一个中间件
        next();
    }
};

module.exports = refreshTokenMiddleware; 