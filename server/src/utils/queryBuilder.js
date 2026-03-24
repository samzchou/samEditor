const mongoose = require('mongoose');
const { sanitize } = require('express-mongo-sanitize');

class QueryBuilder {
    constructor(model) {
        this.model = model;
        this.query = {};
        this.options = {
            lean: true,
            sort: { createdAt: -1 }
        };
    }

    // 安全地添加查询条件
    where(field, operator, value) {
        // 清理和验证字段名
        field = this.sanitizeField(field);
        
        // 清理和验证值
        value = this.sanitizeValue(value);

        if (!this.query[field]) {
            this.query[field] = {};
        }

        this.query[field][`$${operator}`] = value;
        return this;
    }

    // 添加精确匹配条件
    equals(field, value) {
        field = this.sanitizeField(field);
        value = this.sanitizeValue(value);
        this.query[field] = value;
        return this;
    }

    // 添加排序
    sort(field, direction = 'desc') {
        field = this.sanitizeField(field);
        this.options.sort = { [field]: direction === 'desc' ? -1 : 1 };
        return this;
    }

    // 添加分页
    paginate(page = 1, limit = 10) {
        this.options.skip = (page - 1) * limit;
        this.options.limit = Math.min(limit, 100); // 限制最大返回数量
        return this;
    }

    // 添加字段选择
    select(fields) {
        if (Array.isArray(fields)) {
            fields = fields.map(this.sanitizeField);
            this.options.select = fields.join(' ');
        } else {
            this.options.select = this.sanitizeField(fields);
        }
        return this;
    }

    // 添加关联查询
    populate(field, select = '') {
        field = this.sanitizeField(field);
        select = select.split(' ').map(this.sanitizeField).join(' ');
        
        if (!this.options.populate) {
            this.options.populate = [];
        }
        
        this.options.populate.push({
            path: field,
            select: select
        });
        
        return this;
    }

    // 执行查询
    async execute() {
        try {
            let query = this.model.find(this.query);

            // 应用选项
            if (this.options.select) {
                query = query.select(this.options.select);
            }

            if (this.options.populate) {
                this.options.populate.forEach(pop => {
                    query = query.populate(pop);
                });
            }

            if (this.options.sort) {
                query = query.sort(this.options.sort);
            }

            if (this.options.skip) {
                query = query.skip(this.options.skip);
            }

            if (this.options.limit) {
                query = query.limit(this.options.limit);
            }

            if (this.options.lean) {
                query = query.lean();
            }

            return await query.exec();
        } catch (error) {
            throw new Error(`查询执行失败: ${error.message}`);
        }
    }

    // 清理和验证字段名
    sanitizeField(field) {
        // 移除所有非字母数字和下划线字符
        field = field.replace(/[^a-zA-Z0-9_]/g, '');
        return sanitize(field);
    }

    // 清理和验证值
    sanitizeValue(value) {
        if (typeof value === 'string') {
            // 对字符串进行 XSS 清理
            value = require('xss')(value);
            // MongoDB 注入清理
            value = sanitize(value);
        }
        return value;
    }
}

module.exports = QueryBuilder; 