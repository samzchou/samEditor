const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        default: uuidv4(),
    },
    username: {
        type: String,
        default: '',
        // required: true,
        // unique: true,
    },
    email: {
        type: String,
        default: '',
        // required: true,
        // unique: true,
    },
    password: {
        type: String,
        default: '',
        // required: true,
    },
    nickname: {
        type: String,
        default: '',
    },
    avatar: {
        type: String,
        default: '',
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'guest'],
        default: 'user',
    },
    tenantId: {
        type: String,
        default: '',
    },
    amount: {
        type: Number,
        default: 0,
    },
    myApp: {
        type: Array,
        default: [],
    },
    type: {
        type: String,
        default: 'email',
    },
    isVerify: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    loginAt: {
        type: Number,
        default: 0,
    },
    lockUntil: {
        type: Date,
    },
    lastLogin: {
        type: Date,
    },
    passwordChangedAt: {
        type: Date,
    },
    socketId: {
        type: String,
        default: null,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isGuest: {
        type: Boolean,
        default: false,
    },
})

// 密码加密中间件
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// 验证密码的方法
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// 添加账户锁定逻辑
userSchema.methods.incrementLoginAttempts = async function () {
    // 如果锁定时间已过
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return await this.updateOne({
            $set: {
                loginAttempts: 1,
            },
            $unset: {
                lockUntil: 1,
            },
        });
    }

    // 增加登录尝试次数
    const updates = {
        $inc: {
            loginAttempts: 1,
        },
    };

    // 如果登录失败次数达到最大值，则锁定账户
    if (this.loginAttempts + 1 >= 5 && !this.lockUntil) {
        updates.$set = {
            lockUntil: Date.now() + 3600000, // 锁定1小时
        };
    }

    return await this.updateOne(updates);
};

// 重置登录尝试次数
userSchema.methods.resetLoginAttempts = async function () {
    return await this.updateOne({
        $set: {
            loginAttempts: 0,
            lastLogin: new Date(),
        },
        $unset: {
            lockUntil: 1,
        },
    });
};

module.exports = mongoose.model("User", userSchema);
