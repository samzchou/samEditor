const ApiClientService = require('../services/ApiClientService');

const apiClientController = {
    // 创建 API 客户端
    async create(req, res) {
        try {
            const { name, ipWhitelist, rateLimit } = req.body;
            
            // 生成 API 凭证
            const credentials = ApiClientService.model.generateCredentials();
            
            const apiClient = await ApiClientService.create({
                name,
                ...credentials,
                userId: req.user.id,
                ipWhitelist,
                rateLimit
            });

            res.status(201).json({
                message: '创建成功',
                apiClient: {
                    name: apiClient.name,
                    apiId: apiClient.apiId,
                    apiKey: apiClient.apiKey,
                    apiSecret: apiClient.apiSecret,
                    status: apiClient.status
                }
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 获取 API 客户端列表（带分页）
    async list(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const result = await ApiClientService.paginate(
                { userId: req.user.id },
                {
                    page,
                    limit,
                    select: '-apiSecret',
                    sort: { createdAt: -1 }
                }
            );
            res.json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 更新 API 客户端
    async update(req, res) {
        try {
            const { name, status, ipWhitelist, rateLimit } = req.body;
            const apiClient = await ApiClientService.updateOne(
                { _id: req.params.id, userId: req.user.id },
                { name, status, ipWhitelist, rateLimit },
                { new: true, select: '-apiSecret' }
            );

            if (!apiClient) {
                return res.status(404).json({ message: 'API 客户端不存在' });
            }

            res.json(apiClient);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 删除 API 客户端
    async delete(req, res) {
        try {
            const apiClient = await ApiClientService.deleteOne({
                _id: req.params.id,
                userId: req.user.id
            });

            if (!apiClient) {
                return res.status(404).json({ message: 'API 客户端不存在' });
            }

            res.json({ message: '删除成功' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = apiClientController; 