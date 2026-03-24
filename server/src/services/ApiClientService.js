const BaseService = require('./BaseService');
const ApiClient = require('../models/ApiClient');

class ApiClientService extends BaseService {
    constructor() {
        super(ApiClient);
        this.defaultPopulate = 'userId'; // 默认关联用户信息
    }

    async findByApiCredentials(apiId, apiKey) {
        return await this.findOne({ apiId, apiKey });
    }

    async updateLastUsed(apiClientId) {
        return await this.updateOne(
            { _id: apiClientId },
            { lastUsedAt: new Date() }
        );
    }
}

module.exports = new ApiClientService(); 