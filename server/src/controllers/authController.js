const User = require('../models/User')
const ApiClient = require('../models/ApiClient')
const jwt = require('jsonwebtoken')
const wsServer = require('../websocket/wsServer')
const captchapng = require('captchapng')
const { ObjectId } = require('mongoose').Types
// const nodemailer = require('nodemailer');
const crypto = require('crypto')
// const argon2 = require('argon2');
const { decrypt } = require('../utils/jsencrypt')
const mailService = require('../services/mailService')
const commonUtil = require('../utils/common')
const _ = require('lodash')
const axios = require('axios')

const { OAuth2Client } = require('google-auth-library')
const googleClient = new OAuth2Client()

const githubConfig = {
    redirect_uri: `${process.env.FRONTEND_URL}/login`,
    client_id: 'Ov23li1q8DeLcUcn9R5s',
    client_secret: '45b1b6ec0a5b94a8ecd2c87826cd29ab364d8887',
}

// 生成6位数字验证码
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

const authController = {
    async sendVerifyCodeByEmail(req, email) {
        const verifyCode = generateVerificationCode()
        req.session.verifyCode = verifyCode
        req.session.cookie.maxAge = 1000 * 60 * 10 // 10分钟内有效
        return await mailService.sendMail({
            mailTo: email,
            subject: `Verify your email`,
            content: `
                <p style="font-size:1.5em;">Verify your email</p>
                <p>We need to verify your email address ${email} before you can access your account. Enter the code below in your open browser window.</p>
                <p style="font-size:2em;">${verifyCode}</p>
                <hr/>
                <p>This code expires in 10 minutes.</p>
                <p>If you didn't sign up for ${process.env.APP_NAME}, you can safely ignore this email. Someone else might have typed your email address by mistake.</p>
            `,
        })
    },
    async sendVerifyCode(req, res) {
        const { email, captcha } = req.body
        if (
            !email ||
            !captcha ||
            !req.session.captcha ||
            req.session.captcha != captcha
        ) {
            return res.json({
                success: false,
                code: 400,
                message: 'email required!',
            })
        }
        const user = await User.findOne({ email: email })
        if (!user) {
            return res.json({
                success: false,
                code: 400,
                message: `Not found account from ${email}!`,
            })
        } else {
            const sendMail = this.sendVerifyCodeByEmail(req, email)
            if (sendMail) {
                req.session.captcha = null
                res.json({
                    success: true,
                    code: 200,
                    data: sendMail,
                })
            }
        }
    },
    // 邮箱验证码校验
    async verifyCode(req, res) {
        const { email, verifyCode } = req.body
        if (email) {
            if (
                !req.session.verifyCode ||
                verifyCode !== req.session.verifyCode
            ) {
                return res.json({
                    success: false,
                    code: 400,
                    message: 'verify code error or expired!',
                })
            }

            // const dbDao = new mysqlDao(process.env.DB_NAME + '.' + 'users');
            const user = await User.findOne({ email: email })
            if (!user) {
                return res.json({
                    success: false,
                    code: 400,
                    message: `Not found account from ${email}!`,
                })
            } else {
                if (user.isVerify === 1) {
                    return res.json({
                        success: false,
                        code: 500,
                        message: 'The account has been verified!',
                    })
                }

                // 更新已验证邮箱
                // user.isVerify = 1;
                // user.lastLogin = Date.now;
                await user.updateOne(
                    { _id: user._id },
                    { isVerify: 1, lastLogin: Date.now() }
                )

                // 生成 JWT
                const token = jwt.sign(
                    {
                        id: user.id,
                        role: user.role,
                        version: user.passwordChangedAt
                            ? user.passwordChangedAt.getTime()
                            : 0,
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '1d' }
                )
                req.session.verifyCode = null

                res.json({
                    success: true,
                    code: 200,
                    message: 'Send verification code success!',
                    data: {
                        token,
                        ...user,
                    },
                })
            }
        } else {
            res.json({
                success: false,
                code: 500,
                message: 'Email is required!',
            })
        }
    },
    // 注册
    async register(req, res) {
        try {
            let { username, email, password, tenantId, fromType } = req.body
            if (fromType) {
                return this.registerByThirdParty(req, res)
            }

            // 检查用户是否已存在
            const condition = []
            if (username) {
                condition.push({ username })
            }
            if (email) {
                condition.push({ email })
            }
            let user = await User.findOne({ $or: condition })
            if (user) {
                return res.json({
                    code: 400,
                    success: false,
                    message: 'User already exists',
                })
            }

            // 密码转换
            password = decrypt(password)
            // password = await argon2.hash(password);
            if (!username && email) {
                username = email.split('@')[0]
            }
            // 创建新用户
            user = new User({
                username,
                email,
                password,
                tenantId,
            })

            const saved = await user.save()
            if (saved) {
                const sendMail = await this.sendVerifyCodeByEmail(req, email)
                // 生成 JWT
                const token = jwt.sign(
                    { id: user.id, role: user.role },
                    process.env.JWT_SECRET,
                    { expiresIn: '1d' }
                )

                res.json({
                    code: 200,
                    success: true,
                    data: {
                        token,
                        sendMail,
                        user: {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            role: user.role,
                        },
                    },
                })
            } else {
                res.json({
                    code: 500,
                    success: false,
                    message: 'Server error',
                })
            }
        } catch (error) {
            console.log('register errror=>', error)
            res.json({ code: 500, success: false, message: 'Server error' })
        }
    },

    async updateUser(req, res) {
        let {
            username,
            email,
            password,
            nickname,
            token,
            amount,
            phone,
            description,
            avatar,
        } = req.body.data
        try {
            jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
                if (err) {
                    return res.json({
                        success: false,
                        code: 500,
                        message: 'Invalid token!',
                    })
                } else {
                    const user = await User.findOne({ _id: decoded.id })
                    console.log('updateUser=>', user)
                    let existUser = null
                    if (username !== undefined) {
                        user.username = username
                        existUser = await User.findOne({
                            username,
                            _id: { $ne: decoded.id },
                        })
                        if (existUser) {
                            return res.json({
                                code: 500,
                                success: false,
                                message: 'UserName is exist',
                            })
                        }
                    }
                    if (email !== undefined) {
                        user.email = email
                        existUser = await User.findOne({
                            email,
                            _id: { $ne: decoded.id },
                        })
                        if (existUser) {
                            return res.json({
                                code: 500,
                                success: false,
                                message: 'Email is exist',
                            })
                        }
                    }

                    if (password !== undefined) {
                        user.password = decrypt(password)
                    }
                    if (nickname !== undefined) {
                        user.nickname = nickname
                    }
                    if (avatar !== undefined) {
                        user.avatar = avatar
                    }
                    if (phone !== undefined) {
                        user.phone = phone
                    }
                    if (description !== undefined) {
                        user.description = description
                    }

                    if (amount !== undefined) {
                        user.amount -= amount
                    }
                    user.save().then((result) => {
                        const { _id, __v, ...rest } = result._doc
                        const data = { id: _id.toString(), ...rest }
                        res.json({
                            code: 200,
                            success: true,
                            data,
                        })
                    })
                }
            })
        } catch (error) {
            console.log('updateUser errror=>', error)
            return res.json({
                success: false,
                code: 500,
                message: error.message,
            })
        }
    },

    // 生成验证码
    async generateCaptcha(req, res) {
        try {
            // 生成随机验证码
            const captchaCode = parseInt(Math.random() * 9000 + 1000)

            // 创建验证码图片
            const p = new captchapng(80, 30, captchaCode)
            p.color(0, 0, 0, 0) // 背景颜色
            p.color(80, 80, 80, 255) // 字体颜色

            const img = p.getBase64()
            // 将验证码存入session
            req.session.captcha = captchaCode

            req.session.save((err) => {
                if (err) {
                    res.json({
                        code: 500,
                        success: false,
                        message: 'Failed to generate captcha',
                    })
                } else {
                    res.json({
                        success: true,
                        code: 200,
                        data: {
                            code: captchaCode.toString(),
                            img: 'data:image/png;base64,' + img,
                        },
                    })
                }
            })

            // res.json({
            //     success: true,
            //     code: 200,
            //     data: {
            //         code: captchaCode.toString(),
            //         img: 'data:image/png;base64,' + img,
            //     },
            // })
        } catch (error) {
            console.log(error)
            res.json({
                code: 500,
                success: false,
                message: 'Failed to generate captcha',
            })
        }
    },

    // 用户注销退出
    async logout(req, res) {
        const token = req.headers.authorization.replace('Bearer ', '')
        const decodedToken = jwt.decode(token)
        if (decodedToken) {
            res.json({
                success: true,
                code: 200,
                message: 'Logged out successfully',
                data: decodedToken,
            })
        }
    },
    async getUser(req, res) {
        const { userId, picker } = req.body
        try {
            // console.log("getUser =>", new ObjectId(userId));
            // const _ID =
            //     userId.length === 24 ? ObjectId(userId) : new ObjectId();
            let user = await User.findOne({
                $or: [{ _id: userId }, { username: userId }],
            }).lean()
            if (!user) {
                return res.json({
                    code: 400,
                    success: false,
                    message: 'User does not exist',
                })
            } else {
                const { _id, __v, ...rest } = user
                if (!_.isEmpty(picker)) {
                    user = _.pick({ id: _id.toString(), ...rest }, picker)
                } else {
                    user = { id: _id.toString(), ...rest }
                }
            }

            res.json({
                code: user ? 200 : 500,
                success: user ? true : false,
                data: user,
            })
        } catch (error) {
            console.log('getUser error =>', error)
            res.json({
                code: 500,
                success: false,
                message: error.message,
            })
        }
    },

    async getAccessToken(code) {
        if (!code || code.length !== 20) {
            throw new Error('code参数不正确！') //http://127.0.0.1:9090/pages/login/login
        }
        let response = await axios({
            method: 'POST',
            url: 'https://github.com/login/oauth/access_token',
            headers: {
                Accept: 'application/json',
            },
            params: {
                redirect_uri: githubConfig.redirect_uri,
                client_id: githubConfig.client_id,
                client_secret: githubConfig.client_secret,
                code,
            },
        })
        if (!response.data?.access_token) {
            throw new Error('获取access_token失败！', response.data)
        }
        response = await axios({
            method: 'GET',
            url: 'https://api.github.com/user',
            headers: {
                Authorization: `Bearer ${response.data.access_token}`,
            },
        })
        if (!response.data?.id) throw new Error('获取用户信息失败！')
        console.log('response.data=>', response.data)

        return response.data
    },

    async getGoogleUserInfo(token) {
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            })
            const payload = ticket.getPayload()
            return payload
        } catch (error) {
            console.log('error=>', error)
            return null
        }
    },

    async registerByThirdParty(req, res, thirdPartyData) {
        try {
            let { code, fromType } = req.body
            let user, userInfo
            if (fromType === 'github') {
                // const githubInfo = await this.getAccessToken(req.body.code)
                if (thirdPartyData) {
                    userInfo = {
                        userId: thirdPartyData.node_id,
                        username: thirdPartyData.login,
                        avatar: thirdPartyData.avatar_url,
                        type: 'github',
                        isVerify: 1,
                    }
                    // 检查用户是否已存在
                    user = await User.findOne({ userId: userInfo.userId })
                    if (user) {
                        return res.json({
                            code: 400,
                            success: false,
                            message: 'User already exists',
                        })
                    }
                    // 创建新用户
                    user = new User(userInfo)
                } else {
                    res.json({
                        code: 400,
                        success: false,
                        message: 'Invalid register: ' + code,
                    })
                }
            } else if (fromType === 'google') {
                // const payload = await this.getGoogleUserInfo(code)
                if (thirdPartyData) {
                    const userId = thirdPartyData['sub']
                    user = await User.findOne({
                        $or: [{ email: thirdPartyData.email }, { userId }],
                    })
                    if (user) {
                        return res.json({
                            code: 400,
                            success: false,
                            message: 'User already exists',
                        })
                    }
                    userInfo = {
                        userId,
                        username: thirdPartyData.name,
                        nickname: thirdPartyData.given_name,
                        avatar: thirdPartyData.picture,
                        email: thirdPartyData.email,
                        type: 'google',
                        isVerify: 1,
                    }
                    // 创建新用户
                    user = new User(userInfo)
                }
            }
            const saved = await user.save()
            if (saved) {
                // 生成 JWT
                const token = jwt.sign(
                    { id: user.id, role: user.role },
                    process.env.JWT_SECRET,
                    { expiresIn: '1d' }
                )
                return res.json({
                    code: 200,
                    success: true,
                    message: 'User created successfully',
                    data: {
                        user,
                        token,
                    },
                })
            } else {
                res.json({
                    code: 500,
                    success: false,
                    message: 'Server error',
                })
            }
        } catch (error) {
            res.json({
                code: 500,
                success: false,
                message: error.message,
            })
        }
    },

    async loginByThirdParty(req, res) {
        let { code, fromType } = req.body
        let user, githubInfo, payload
        if (fromType === 'github') {
            githubInfo = await this.getAccessToken(code)
            if (!githubInfo) {
                return res.json({
                    code: 400,
                    success: false,
                    message: 'Invalid login: ' + code,
                })
            }
            user = await User.findOne({ userId: githubInfo.node_id })
        } else if (fromType === 'google') {
            payload = await this.getGoogleUserInfo(code)
            if (payload) {
                const userid = payload['sub']
                user = await User.findOne({
                    userId: userid,
                    email: payload['email'],
                })
            }
        }

        if (!user) {
            if (fromType) {
                this.registerByThirdParty(req, res, githubInfo || payload)
                return
            }

            return res.json({
                code: 400,
                success: false,
                message: 'Invalid login!',
            })
        }
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        )
        const { _id, __v, ...rest } = user._doc
        const data = { id: _id.toString(), ...rest }
        res.json({
            code: 200,
            success: true,
            data: {
                token,
                user: data,
            },
        })
    },

    // 登录
    async login(req, res) {
        try {
            let { loginName, password, socketId, captcha, fromType } = req.body
            if (fromType) {
                // github或google登录
                return this.loginByThirdParty(req, res)
            }
            password = decrypt(password)
            // 验证码校验
            /* if (
                !captcha ||
                !req.session.captcha ||
                parseInt(captcha) !== req.session.captcha
            ) {
                return res.json({
                    code: 400,
                    success: false,
                    message: "Invalid captcha code",
                });
            }

            // 清除已使用的验证码
            delete req.session.captcha; */

            // 查找用户 - 支持邮箱或用户名登录
            const user = await User.findOne({
                $or: [{ email: loginName }, { username: loginName }],
            })

            if (!user) {
                return res.json({
                    code: 400,
                    success: false,
                    message: 'User does not exist',
                })
            }

            // 检查账户是否被锁定
            if (user.lockUntil && user.lockUntil > Date.now()) {
                return res.json({
                    code: 403,
                    message: 'Account is locked, please try again later',
                    lockUntil: user.lockUntil,
                })
            }

            // 验证密码
            const isMatch = await user.comparePassword(password)
            if (!isMatch) {
                await user.incrementLoginAttempts()
                return res.json({
                    code: 400,
                    success: false,
                    message: 'Incorrect password',
                })
            }

            // 重置登录尝试次数
            await user.resetLoginAttempts()

            // 检查用户是否已在其他地方登录
            if (user.socketId && user.socketId !== socketId) {
                // 使用 wsServer 发送强制登出消息
                wsServer.sendTo(user.socketId, {
                    act: 'forceLogout',
                    message:
                        'Your account has been logged in on another device',
                    userId: user.id,
                })
            }

            // 更新用户的 socketId
            user.socketId = socketId
            await user.save()

            // 生成 JWT
            const token = jwt.sign(
                {
                    id: user._id,
                    role: user.role,
                    version: user.passwordChangedAt
                        ? user.passwordChangedAt.getTime()
                        : 0,
                },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            )

            const { _id, __v, ...rest } = user._doc
            const data = { id: _id.toString(), ...rest }

            res.json({
                code: 200,
                success: true,
                data: {
                    token,
                    user: data,
                },
            })
        } catch (error) {
            res.json({ code: 500, success: false, message: error.message })
        }
    },

    // 刷新 token
    async refreshToken(req, res) {
        try {
            const user = await User.findById(req.user.id)
            if (!user) {
                return res.json({
                    code: 400,
                    success: false,
                    message: 'User does not exist',
                })
            }

            // 生成新的 token
            const token = jwt.sign(
                { id: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            )

            res.json({
                code: 200,
                success: true,
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                },
            })
        } catch (error) {
            res.json({ code: 500, success: false, message: 'Server error' })
        }
    },

    async authenticateToken(req, res) {
        const token = req.headers.authorization.replace('Bearer ', '')
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.json({
                    success: false,
                    code: 500,
                    message: 'Invalid token!',
                })
            } else {
                const user = await User.findOne({ _id: decoded.id })
                if (!user) {
                    return res.json({
                        success: false,
                        code: 500,
                        message:
                            'Same user has already logged in, Please login again.',
                    })
                }
                const { _id, __v, ...rest } = user._doc
                const data = { id: _id.toString(), ...rest }

                res.json({
                    success: true,
                    code: 200,
                    data: data,
                })
            }
        })
    },

    // 发送重置密码邮件
    async forgotPassword(req, res) {
        try {
            const { email, domain } = req.body
            const user = await User.findOne({ email })

            if (!user) {
                return res.json({
                    code: 404,
                    success: false,
                    message: 'Email is not registered',
                })
            }

            // 生成重置令牌
            const resetToken = crypto.randomBytes(32).toString('hex')
            user.resetPasswordToken = resetToken
            user.resetPasswordExpires = Date.now() + 3600000 // 1小时后过期
            await user.save()

            // 发送重置密码邮件
            const resetUrl = `${
                domain || process.env.FRONTEND_URL
            }/reset-password?id=${resetToken}`
            const sendMail = await mailService.sendMail({
                mailTo: user.email,
                subject: 'Password Reset Request',
                content: `
                    <h1>Password Reset Request</h1>
                    <p>Click the link below to reset your password:</p>
                    <a href="${resetUrl}">${resetUrl}</a>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you did not request a password reset, please ignore this email.</p>
                `,
            })
            res.json({
                code: 200,
                success: true,
                message: 'Password reset email has been sent',
                data: sendMail,
            })
        } catch (error) {
            console.error('Failed to send password reset email:', error)
            res.json({
                code: 500,
                success: false,
                message: 'Failed to send password reset email',
            })
        }
    },

    // 重置密码
    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body
            // let password = decrypt(newPassword)

            const user = await User.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() },
            })

            if (!user) {
                return res.json({
                    code: 400,
                    success: false,
                    message: 'Password reset link is invalid or has expired',
                })
            }

            // 更新密码
            user.password = decrypt(newPassword)
            user.resetPasswordToken = undefined
            user.resetPasswordExpires = undefined
            await user.save()

            res.json({
                code: 200,
                success: true,
                message: 'Password reset successful',
            })
        } catch (error) {
            console.error('Failed to reset password:', error)
            res.json({
                code: 500,
                success: false,
                message: 'Failed to reset password',
            })
        }
    },

    // 访客注册
    async guestRegister(req, res) {
        const { socketId, captcha } = req.body
        let user = null
        try {
            // 验证码校验
            /* if (
                !captcha ||
                !req.session.captcha ||
                parseInt(captcha) !== req.session.captcha
            ) {
                return res.json({
                    code: 400,
                    success: false,
                    message: "Invalid captcha code",
                });
            } */
            user = await User.findOne({ userId: socketId })
            if (user) {
                // 生成 JWT
                const token = jwt.sign(
                    {
                        id: user.id,
                        role: user.role,
                        isGuest: user,
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '7d' } // 访客token有效期7天
                )
                return res.json({
                    code: 200,
                    success: true,
                    data: {
                        token,
                        user: user._doc,
                    },
                })
            }

            // 生成随机访客用户名
            const guestUsername =
                'guest_' + Math.random().toString(36).substring(2, 8)
            const guestEmail = `${guestUsername}@guest.temp`

            // 创建访客用户
            user = new User({
                userId: socketId,
                username: guestUsername,
                email: guestEmail,
                password: Math.random().toString(36), // 随机密码
                role: 'guest',
                isGuest: true,
                isVerify: 1, // 访客账号默认验证通过
            })

            const saved = await user.save()
            if (saved) {
                // 生成 JWT
                const token = jwt.sign(
                    {
                        id: user.id,
                        role: user.role,
                        isGuest: true,
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '7d' } // 访客token有效期7天
                )

                res.json({
                    code: 200,
                    success: true,
                    data: {
                        token,
                        user: {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            role: user.role,
                            isGuest: true,
                        },
                    },
                })
            } else {
                res.json({
                    code: 500,
                    success: false,
                    message: 'Failed to create guest account',
                })
            }
        } catch (error) {
            console.log('guest register error =>', error)
            res.json({ code: 500, success: false, message: 'Server error' })
        }
    },

    // 访客登录
    async guestLogin(req, res) {
        try {
            const { guestId } = req.body

            // 查找访客用户
            const user = await User.findOne({
                _id: guestId,
                isGuest: true,
            })

            if (!user) {
                // 如果找不到访客账号，创建新的访客账号
                return this.guestRegister(req, res)
            }

            // 生成新的 JWT
            const token = jwt.sign(
                {
                    id: user.id,
                    role: user.role,
                    isGuest: true,
                },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            )

            // 更新最后登录时间
            await user.updateOne({ lastLogin: Date.now() })

            res.json({
                code: 200,
                success: true,
                data: {
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        isGuest: true,
                    },
                },
            })
        } catch (error) {
            console.log('guest login error =>', error)
            res.json({ code: 500, success: false, message: 'Server error' })
        }
    },
    // 校验外部使用接口的凭证
    async checkApiCredentials(req, res) {
        try {
            const { apiKey, apiSecret } = req.body
            const user = await ApiClient.findOne({
                apiKey,
                apiSecret,
                status: 'active',
            })
            if (user) {
                res.json({
                    success: true,
                    code: 200,
                    data: _.pick(user, [
                        'userId',
                        'apiId',
                        'apiKey',
                        'apiSecret',
                        'status',
                    ]),
                })
            } else {
                res.json({
                    success: false,
                    code: 400,
                    message: 'Invalid api_key credentials',
                })
            }
        } catch (error) {
            res.json({
                success: false,
                code: 500,
                message: 'Internal server error',
            })
        }
    },
    async getApiCredentials(req, res) {
        try {
            const { userId, data } = req.body
            const token = req.headers.authorization.replace('Bearer ', '')
            const decoded = await jwt.verify(token, process.env.JWT_SECRET)
            let result = null
            if (!token || !decoded || decoded.id !== userId) {
                res.json({
                    success: false,
                    code: 500,
                    message: 'Invalid token!',
                })
                return
            }
            if (!data) {
                result = await ApiClient.findOne({ userId })
                return res.json({
                    success: true,
                    code: 200,
                    message: result ? '' : 'No found credentials',
                    data: result,
                })
            }

            // 生成API_ID (8位数字)
            const apiId = Math.floor(
                10000000 + Math.random() * 90000000
            ).toString()
            // 生成API_KEY (32位随机字符串)
            const apiKey = crypto.randomBytes(16).toString('hex')
            // 生成API_SECRET (64位随机字符串)
            const apiSecret = crypto.randomBytes(32).toString('hex')
            // 生成授权信息
            const authorization = commonUtil.getSignature({
                apiId,
                apiKey,
                apiSecret,
            })
            if (!authorization) {
                return res.json({
                    success: false,
                    code: 400,
                    message: 'set api credentials failed',
                })
            }

            const newClient = new ApiClient({
                userId,
                apiId,
                apiKey,
                apiSecret,
                authorization,
                ...data,
            })

            result = await newClient.save()

            res.json({
                success: result ? true : false,
                code: result ? 200 : 500,
                message: result ? '' : 'create api credentials error',
                data: result,
            })
        } catch (error) {
            console.log('guest login error =>', error)
            res.json({ code: 500, success: false, message: error.message })
        }
    },

    async resetApiCredentials(req, res) {
        try {
            const { userId, authorization } = req.body
            // 获取用户的APIClient
            const client = await ApiClient.findOne({ userId })
            const decoded = jwt.verify(authorization, process.env.JWT_SECRET)

            if (
                !decoded ||
                !client ||
                userId !== client.userId ||
                client.authorization !== authorization
            ) {
                return res.json({
                    success: false,
                    code: 500,
                    message: 'Invalid authorization!',
                })
            }
            // 生成新的API_ID (8位数字)
            const newAuthorization = commonUtil.getSignature({
                apiId: client.apiId,
                apiKey: client.apiKey,
                apiSecret: client.apiSecret,
            })
            client.authorization = newAuthorization
            await client.save()
            res.json({
                code: 200,
                success: true,
                message: 'Reset apiCredentials successful',
                data: client,
            })
        } catch (error) {
            console.log('guest login error =>', error)
            res.json({ code: 500, success: false, message: error.message })
        }
    },
}

module.exports = authController
