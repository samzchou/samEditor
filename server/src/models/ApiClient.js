const mongoose = require('mongoose');
const crypto = require('crypto');

const apiClientSchema = new mongoose.Schema({
    appName: {
        type: String,
        required: true,
        trim: true
    },
    apiId: {
        type: String,
        unique: true,
        required: true
    },
    apiKey: {
        type: String,
        unique: true,
        required: true
    },
    apiSecret: {
        type: String,
        required: true
    },
    authorization: {
        type: String,
        required: true
    },
    userId: {
        type:String,
        ref: 'User',
        required: true
    },
    description: String,
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    ipWhitelist: [{
        type: String
    }],
    rateLimit: {
        requests: { type: Number, default: 1000 },
        per: { type: Number, default: 3600 } // 每小时请求数
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUsedAt: Date
});

// 生成 API 凭证
apiClientSchema.statics.generateCredentials = function() {
    return {
        apiId: 'API' + crypto.randomBytes(8).toString('hex'),
        apiKey: 'KEY' + crypto.randomBytes(16).toString('hex'),
        apiSecret: 'SEC' + crypto.randomBytes(32).toString('hex')
    };
};

// 验证签名
apiClientSchema.methods.verifySignature = function(signature, timestamp, method, path, body) {
    const message = `${timestamp}${method.toUpperCase()}${path}${JSON.stringify(body || {})}`;
    const expectedSignature = crypto
        .createHmac('sha256', this.apiSecret)
        .update(message)
        .digest('hex');
    
    return signature === expectedSignature;
};

module.exports = mongoose.model('ApiClient', apiClientSchema); 