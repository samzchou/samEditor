const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { apiAuthMiddleware } = require('../middleware/apiAuth');
const apiClientController = require('../controllers/apiClientController');

// API 客户端管理路由（需要用户认证）
router.post('/clients', auth, apiClientController.create);
router.get('/clients', auth, apiClientController.list);
router.put('/clients/:id', auth, apiClientController.update);
router.delete('/clients/:id', auth, apiClientController.delete);

// API 接口路由（需要 API 认证）
router.use('/v1', apiAuthMiddleware, require('./apiV1'));

module.exports = router; 