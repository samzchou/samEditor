const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const xss = require('xss');

// 通用的验证规则
const commonRules = {
    // MongoDB ObjectId 验证
    objectId: (field) => param(field)
        .isMongoId()
        .withMessage('无效的ID格式'),

    // 字符串清理和验证
    string: (field, options = {}) => body(field)
        .trim()
        .escape()
        .customSanitizer(value => xss(value))
        .isLength({ min: options.min || 1, max: options.max || 255 })
        .withMessage(`字段长度必须在 ${options.min || 1} 到 ${options.max || 255} 之间`),

    // 邮箱验证
    email: () => body('email')
        .trim()
        .toLowerCase()
        .isEmail()
        .normalizeEmail()
        .withMessage('无效的邮箱格式'),

    // 密码验证
    password: () => body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('密码必须包含大小写字母、数字和特殊字符'),

    // 数字范围验证
    number: (field, { min, max } = {}) => body(field)
        .isInt({ min, max })
        .withMessage(`数值必须在 ${min || 0} 到 ${max || 'max'} 之间`),

    // 日期验证
    date: (field) => body(field)
        .isISO8601()
        .toDate()
        .withMessage('无效的日期格式'),

    // URL验证
    url: (field) => body(field)
        .isURL()
        .withMessage('无效的URL格式')
};

// 验证结果处理中间件
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    }
    next();
};

// 特定路由的验证规则
const validationRules = {
    // 用户注册验证
    register: [
        commonRules.string('username', { min: 3, max: 30 }),
        commonRules.email(),
        commonRules.password(),
        validate
    ],

    // 用户登录验证
    login: [
        commonRules.email(),
        body('password').exists().withMessage('密码不能为空'),
        validate
    ],

    // API客户端创建验证
    createApiClient: [
        commonRules.string('name', { min: 3, max: 50 }),
        body('ipWhitelist.*').optional().isIP().withMessage('无效的IP地址'),
        body('rateLimit.requests').optional().isInt({ min: 1 }).withMessage('请求限制必须大于0'),
        body('rateLimit.per').optional().isInt({ min: 1 }).withMessage('时间周期必须大于0'),
        validate
    ]
};

module.exports = {
    commonRules,
    validate,
    validationRules
}; 