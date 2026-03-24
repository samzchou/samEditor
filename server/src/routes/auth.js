const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { auth } = require("../middleware/auth");
const refreshTokenMiddleware = require("../middleware/refreshToken");

// router.post('/register', authController.register);
// router.post('/login', authController.login);

// 添加刷新 token 的路由
// router.post('/refresh-token', auth, authController.refreshToken);

const dbFun = {
    async generateCaptcha(req, res) {
        authController.generateCaptcha(req, res)
    },
    async register(req, res) {
        authController.register(req, res)
    },
    async authenticateToken(req, res) {
        authController.authenticateToken(req, res)
    },
    async login(req, res) {
        authController.login(req, res)
    },
    async sendVerifyCode(req, res) {
        authController.sendVerifyCode(req, res)
    },
    async verifyCode(req, res) {
        authController.verifyCode(req, res)
    },
    async refreshToken(req, res) {
        auth(req, res)
        authController.refreshToken(req, res)
    },
    // 添加重置密码相关函数
    async forgotPassword(req, res) {
        authController.forgotPassword(req, res)
    },
    async resetPassword(req, res) {
        authController.resetPassword(req, res)
    },
    async logout(req, res) {
        authController.logout(req, res)
    },
    async guestRegister(req, res) {
        authController.guestRegister(req, res)
    },
    async guestLogin(req, res) {
        authController.guestLogin(req, res)
    },
    async checkApiCredentials(req, res) {
        authController.checkApiCredentials(req, res)
    },
    async getApiCredentials(req, res) {
        authController.getApiCredentials(req, res)
    },
    resetApiCredentials(req, res) {
        authController.resetApiCredentials(req, res)
    },
    async getUser(req, res) {
        authController.getUser(req, res)
    },
    async updateUser(req, res) {
        authController.updateUser(req, res)
    },
    async updateUser(req, res) {
        authController.updateUser(req, res)
    },
}

// 为所有路由添加自动刷新 token 中间件
router.use(refreshTokenMiddleware);

router.post("/auth", (req, res) => {
    const type = req.body.operation;
    try {
        //dbFun[type](req, res);
        authController[type](req, res);
    } catch (err) {
        res.json({
            success: false,
            code: 400,
            message: "function " + type + " not defined!",
        });
        throw err;
    }
});

module.exports = router;
