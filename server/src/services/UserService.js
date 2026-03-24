const BaseService = require('./BaseService');
const User = require('../models/User');

class UserService extends BaseService {
    constructor() {
        super(User);
        this.defaultPopulate = ''; // 设置默认的关联查询
    }

    // 添加用户特定的方法
    async findByEmail(email) {
        return await this.findOne({ email });
    }

    async changePassword(userId, newPassword) {
        const user = await this.findOne({ _id: userId });
        if (!user) {
            throw new Error('用户不存在');
        }
        user.password = newPassword;
        return await user.save();
    }
}

module.exports = new UserService(); 