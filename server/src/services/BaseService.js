const mongoose = require('mongoose');
const QueryBuilder = require('../utils/queryBuilder');

class BaseService {
    constructor(model) {
        this.model = model;
        this.defaultPopulate = '';
    }

    // 创建查询构建器
    query() {
        return new QueryBuilder(this.model);
    }

    /**
     * 创建文档
     * @param {Object} data - 文档数据
     * @returns {Promise<Document>}
     */
    async create(data) {
        try {
            // 清理输入数据
            data = this.sanitizeData(data);
            const doc = new this.model(data);
            return await doc.save();
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 批量创建文档
     * @param {Array} dataArray - 文档数据数组
     * @returns {Promise<Array<Document>>}
     */
    async createMany(dataArray) {
        try {
            return await this.model.insertMany(dataArray);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 查找单个文档
     * @param {Object} conditions - 查询条件
     * @param {String} populate - 关联字段
     * @param {Object} select - 字段选择
     * @returns {Promise<Document>}
     */
    async findOne(conditions, populate = this.defaultPopulate, select = '') {
        try {
            let query = this.model.findOne(conditions);
            
            if (select) {
                query = query.select(select);
            }
            
            if (populate) {
                query = query.populate(populate);
            }
            
            return await query.exec();
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 查找多个文档
     * @param {Object} conditions - 查询条件
     * @param {Object} options - 查询选项（排序、分页等）
     * @returns {Promise<Array<Document>>}
     */
    async find(conditions = {}, options = {}) {
        try {
            const query = this.query();

            // 添加查询条件
            Object.entries(conditions).forEach(([key, value]) => {
                query.equals(key, value);
            });

            // 添加选项
            if (options.select) {
                query.select(options.select);
            }

            if (options.populate) {
                query.populate(options.populate);
            }

            if (options.sort) {
                const [field, direction] = options.sort.split(':');
                query.sort(field, direction);
            }

            if (options.page && options.limit) {
                query.paginate(options.page, options.limit);
            }

            return await query.execute();
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 分页查询
     * @param {Object} conditions - 查询条件
     * @param {Object} options - 查询选项
     * @returns {Promise<Object>} - 包含数据和分页信息
     */
    async paginate(conditions = {}, options = {}) {
        try {
            const {
                select = '',
                populate = this.defaultPopulate,
                sort = { createdAt: -1 },
                page = 1,
                limit = 10
            } = options;

            const skip = (page - 1) * limit;
            const countPromise = this.model.countDocuments(conditions);
            const docsPromise = this.find(conditions, {
                select,
                populate,
                sort,
                skip,
                limit
            });

            const [total, docs] = await Promise.all([countPromise, docsPromise]);

            return {
                docs,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            };
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 更新单个文档
     * @param {Object} conditions - 查询条件
     * @param {Object} update - 更新数据
     * @param {Object} options - 更新选项
     * @returns {Promise<Document>}
     */
    async updateOne(conditions, update, options = { new: true }) {
        try {
            return await this.model.findOneAndUpdate(
                conditions,
                update,
                options
            );
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 更新多个文档
     * @param {Object} conditions - 查询条件
     * @param {Object} update - 更新数据
     * @returns {Promise<Object>}
     */
    async updateMany(conditions, update) {
        try {
            return await this.model.updateMany(conditions, update);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 删除单个文档
     * @param {Object} conditions - 查询条件
     * @returns {Promise<Document>}
     */
    async deleteOne(conditions) {
        try {
            return await this.model.findOneAndDelete(conditions);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 删除多个文档
     * @param {Object} conditions - 查询条件
     * @returns {Promise<Object>}
     */
    async deleteMany(conditions) {
        try {
            return await this.model.deleteMany(conditions);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 统计文档数量
     * @param {Object} conditions - 查询条件
     * @returns {Promise<number>}
     */
    async count(conditions = {}) {
        try {
            return await this.model.countDocuments(conditions);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 判断文档是否存在
     * @param {Object} conditions - 查询条件
     * @returns {Promise<boolean>}
     */
    async exists(conditions) {
        try {
            return await this.model.exists(conditions);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 错误处理
     * @param {Error} error - 错误对象
     */
    handleError(error) {
        if (error instanceof mongoose.Error.ValidationError) {
            throw new Error('数据验证错误: ' + Object.values(error.errors).map(e => e.message).join(', '));
        }
        if (error.code === 11000) {
            throw new Error('数据重复错误: ' + JSON.stringify(error.keyValue));
        }
        throw error;
    }

    // 数据清理方法
    sanitizeData(data) {
        const sanitized = {};
        Object.entries(data).forEach(([key, value]) => {
            // 清理键名
            const cleanKey = this.query().sanitizeField(key);
            // 清理值
            sanitized[cleanKey] = this.query().sanitizeValue(value);
        });
        return sanitized;
    }
}

module.exports = BaseService; 