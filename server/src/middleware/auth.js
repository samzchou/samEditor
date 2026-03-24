const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    // 从请求头获取 token
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.json({ code:401, success: false, message: '无访问权限，请先登录' });
    }

    try {
        // 验证 token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.json({ code:401, success: false, message: 'Token 无效' });
    }
};

// 检查管理员权限的中间件
const checkAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.json({ code:401, success: false, message: '需要管理员权限' });
    }
};

module.exports = { auth, checkAdmin }; 