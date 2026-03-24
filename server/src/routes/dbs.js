"use strict";
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { ObjectId } = require("mongoose").Types;

// 引入 dbSchema 模型
const DbSchema = require("../models/dbSchema");
// 新增 fs 模块
const fs = require("fs-extra");
const path = require("path");
const commonUtil = require("../utils/common");
const _ = require("lodash");
const { console } = require("inspector");

// 数据处理函数集合
const dbFun = {
    getTables(req, res) {
        const tables = Object.keys(DbSchema);
        const dataList = [];
        for (let collection of tables) {
            const Model = mongoose.model(collection);
            const Schema = Model.schema;
            const schemaPaths = Schema.paths;
            console.log(schemaPaths);
            // const obj = {};
            const fields = [{ field: "id", type: "String" }];
            for (let key in schemaPaths) {
                const instance = schemaPaths[key].instance;
                if (!["__v", "_id"].includes(key)) {
                    fields.push({
                        field: key,
                        type: instance,
                    });
                }
            }
            // console.log(fields);
            dataList.push({
                tableName: collection,
                fields,
            });
        }
        res.json({
            code: 200,
            success: true,
            data: dataList,
        });
    },

    // 获取数据列表
    async list(req, res) {
        // const IP = req.clientIp;
        // console.log(IP)
        try {
            let {
                collection,
                query = {},
                pageNum = 1,
                pageSize = 20,
                sort = { _id: -1 },
            } = req.body;
            // 获取指定集合的Model
            const Model = mongoose.model(collection);
            if (!Model) {
                return res.json({
                    code: 400,
                    success: false,
                    message: `集合 ${collection} 不存在`,
                });
            }
            const excludeKey = ["id", "parentId", "isDisabled"];
            if (!_.isEmpty(query)) {
                const obj = {}
                if (query.$or) {
                    obj.$or = query.$or;
                    delete query.$or;
                }
                for (let key in query) {
                    let value = query[key]
                    if (
                        !isNaN(value) ||
                        typeof value === 'boolean' ||
                        excludeKey.includes(key)
                    ) {
                        obj[key] = value
                    } else if (key === '_id' && _.isArray(value)) {
                        obj[key] = {
                            $in: value,
                        }
                    } else if (_.isArray(value)) {
                        obj[key] = {
                            $in: value,
                        }
                    } else {
                        obj[key] = new RegExp(value, 'i')
                    }
                }
                query = obj
                
            }

            const skip = (pageNum - 1) * pageSize;
            const rawData = await Model.find(query)
                .skip(skip)
                .limit(pageSize)
                .sort(sort)
                .lean(); // 使用 lean() 获取普通 JavaScript 对象

            // 转换 _id 为 id，并去掉 __v
            const data = rawData.map((item) => {
                const { _id, __v, ...rest } = item;
                return { id: _id.toString(), ...rest };
            });

            if (!res) {
                return data;
            }

            const total = await Model.countDocuments(query);

            res.json({
                code: 200,
                success: true,
                total,
                data,
            });
        } catch (err) {
            res.json({
                code: 500,
                success: false,
                message: err.message,
            });
        }
    },

    // 获取单个数据
    async detail(req, res) {
        try {
            const { collection, id, query } = req.body;
            const Model = mongoose.model(collection);
            if (!Model) {
                return res.json({
                    code: 400,
                    success: false,
                    message: `集合 ${collection} 不存在`,
                });
            }

            let rawData;
            if (query) {
                rawData = await Model.findOne(query).lean();
            } else {
                rawData = await Model.findById(id).lean();
            }

            if (!rawData) {
                return res.json({
                    code: 404,
                    success: false,
                    message: "数据不存在",
                });
            }

            // 转换 _id 为 id，并去掉 __v
            const { _id, __v, ...rest } = rawData;
            const data = _.omit({ id: _id.toString(), ...rest }, ["password"]);

            res.json({
                code: 200,
                success: true,
                data,
            });
        } catch (err) {
            res.json({
                code: 500,
                success: false,
                message: err.message,
            });
        }
    },

    // 创建数据
    async create(req, res) {
        try {
            const { collection, data } = req.body;
            const Model = mongoose.model(collection);
            if (!Model) {
                return res.json({
                    code: 400,
                    success: false,
                    message: `集合 ${collection} 不存在`,
                });
            }
            // 如果传入了 id，将其转换为 _id
            if (data.id) {
                data._id = new ObjectId();
                delete data.id;
            }

            const newDoc = new Model(data);
            const savedDoc = await newDoc.save();

            // 转换返回数据格式
            const { _id, __v, ...rest } = savedDoc.toObject();

            res.json({
                code: 200,
                success: true,
                data: { id: _id.toString(), ...rest },
            });
        } catch (err) {
            console.log(err);
            res.json({
                code: 500,
                success: false,
                message: err.message,
            });
        }
    },

    // 更新数据
    async update(req, res) {
        try {
            const { collection, id, data } = req.body;
            if (!id) {
                this.create(req, res);
                return;
            }
            const Model = mongoose.model(collection);
            if (!Model) {
                return res.json({
                    code: 400,
                    success: false,
                    message: `集合 ${collection} 不存在`,
                });
            }

            const updatedDoc = await Model.findByIdAndUpdate(
                id,
                { $set: data },
                { new: true, lean: true } // 使用 lean 选项
            );

            if (!updatedDoc) {
                return res.json({
                    code: 404,
                    success: false,
                    message: "数据不存在",
                });
            }

            // 转换返回数据格式
            const { _id, __v, ...rest } = updatedDoc;

            res.json({
                code: 200,
                success: true,
                data: { id: _id.toString(), ...rest },
            });
        } catch (err) {
            res.json({
                code: 500,
                success: false,
                message: err.message,
            });
        }
    },

    // 批量更新
    async batchUpdate(req, res) {
        try {
            const { collection, condition, data } = req.body;
            const Model = mongoose.model(collection);
            if (!Model) {
                return res.json({
                    code: 400,
                    success: false,
                    message: `集合 ${collection} 不存在`,
                });
            }
            let result;
            // 使用 condition 条件进行批量更新
            if (condition) {
                result = await Model.updateMany(
                    condition,
                    { $set: data },
                    { new: true, lean: true }
                )
            } else {
                // 更新特定数据
                const bulkOps = data.map((item) => ({
                    updateOne: {
                        filter: { _id: item.id }, // 根据你的 ID 字段名称调整 ObjectId(item.id)
                        update: { $set: _.omit(item, ['id']) }, // 根据你的字段名称调整
                    },
                }))
                result = await Model.bulkWrite(bulkOps, { ordered: false });
                
            }
            if (result.matchedCount === 0) {
                return res.json({
                    code: 404,
                    success: false,
                    message: '未找到匹配的数据',
                })
            }

            res.json({
                code: 200,
                success: true,
                data: {
                    matchedCount: result.matchedCount, // 匹配的文档数
                    modifiedCount: result.modifiedCount, // 实际更新的文档数
                },
                message: '批量更新成功',
            })
            
        } catch (err) {
            res.json({
                code: 500,
                success: false,
                message: err.message,
            });
        }
    },

    // 删除数据
    async delete(req, res) {
        try {
            const { collection, condition } = req.body;
            const Model = mongoose.model(collection);
            if (!Model) {
                return res.json({
                    code: 400,
                    success: false,
                    message: `集合 ${collection} 不存在`,
                });
            }
            const deletedDoc = await Model.deleteMany(condition);

            if (!deletedDoc) {
                return res.json({
                    code: 404,
                    success: false,
                    message: "数据不存在",
                });
            }

            res.json({
                code: 200,
                success: true,
                message: "删除成功",
            });
        } catch (err) {
            res.json({
                code: 500,
                success: false,
                message: err.message,
            });
        }
    },

    // 批量删除
    async batchDelete(req, res) {
        try {
            const { collection, condition } = req.body;
            const Model = mongoose.model(collection);
            if (!Model) {
                return res.json({
                    code: 400,
                    success: false,
                    message: `集合 ${collection} 不存在`,
                });
            }

            // 先查询要删除的数据数量
            const count = await Model.countDocuments(condition);
            if (count === 0) {
                return res.json({
                    code: 404,
                    success: false,
                    message: "未找到匹配的数据",
                });
            }

            // 执行批量删除
            const result = await Model.deleteMany(condition);

            res.json({
                code: 200,
                success: true,
                data: {
                    deletedCount: result.deletedCount,
                },
                message: "批量删除成功",
            });
        } catch (err) {
            res.json({
                code: 500,
                success: false,
                message: err.message,
            });
        }
    },

    // 批量导入JSON数据
    async importJson(req, res) {
        try {
            let { collection, filePath } = req.body;
            filePath = path.join(commonUtil.FILE_PATH(), filePath);
            const Model = mongoose.model(collection);
            if (!Model) {
                return res.json({
                    code: 400,
                    success: false,
                    message: `集合 ${collection} 不存在`,
                });
            }

            // 读取JSON文件
            const jsonData = await fs.readFile(filePath, "utf8");
            let items = JSON.parse(jsonData);

            // 确保items是数组
            if (!Array.isArray(items)) {
                items = [items];
            }

            // 处理每条数据，转换id为_id
            const processedItems = items.map((item) => {
                item.accept = item.accept ? JSON.parse(item.accept) : "";
                if (item.id) {
                    item._id = item.id;
                    delete item.id;
                }
                return item;
            });

            // 批量插入数据
            const result = await Model.insertMany(processedItems, {
                lean: true,
            });

            // 转换返回数据格式
            const formattedResults = result.map((doc) => {
                const { _id, __v, ...rest } = doc;
                return { id: _id.toString(), ...rest };
            });

            res.json({
                code: 200,
                success: true,
                data: {
                    insertedCount: result.length,
                    items: formattedResults,
                },
                message: "数据导入成功",
            });
        } catch (err) {
            res.json({
                code: 500,
                success: false,
                message: err.message,
            });
        }
    },

    // 从JSON字符串批量创建数据
    async batchCreate(req, res) {
        try {
            const { collection, items } = req.body;
            const Model = mongoose.model(collection);
            if (!Model) {
                return res.json({
                    code: 400,
                    success: false,
                    message: `集合 ${collection} 不存在`,
                });
            }

            // 确保items是数组
            if (!Array.isArray(items)) {
                return res.json({
                    code: 400,
                    success: false,
                    message: "items必须是数组",
                });
            }

            // 处理每条数据，转换id为_id
            const processedItems = items.map((item) => {
                if (item.id) {
                    item._id = item.id;
                    delete item.id;
                }
                return item;
            });

            // 批量插入数据
            const result = await Model.insertMany(processedItems, {
                lean: true,
            });

            // 转换返回数据格式
            const formattedResults = result.map((doc) => {
                const { _id, __v, ...rest } = doc;
                return { id: _id.toString(), ...rest };
            });

            res.json({
                code: 200,
                success: true,
                data: {
                    insertedCount: result.length,
                    items: formattedResults,
                },
                message: "批量创建成功",
            });
        } catch (err) {
            res.json({
                code: 500,
                success: false,
                message: err.message,
            });
        }
    },

    async deleteFiles(req, res) {
        const getAllFiles = (dir, baseDir, fileList = []) => {
            // 读取目录内容
            const files = fs.readdirSync(dir, { withFileTypes: true });
            // 遍历所有文件和目录
            files.forEach((file) => {
                // const filePath = path.join(dir, file);
                const filePath = path.join(dir, file.name);
                const stat = fs.statSync(filePath);

                if (stat.isDirectory()) {
                    // 如果是目录，则递归遍历

                    getAllFiles(filePath, baseDir, fileList);
                } else {
                    // 如果是文件，则添加到文件列表
                    const relativePath = path.relative(baseDir, filePath);
                    // 将路径分隔符标准化为'/'
                    const formattedPath = relativePath.replace(/\\/g, "/");
                    fileList.push(formattedPath);
                }
            });

            return fileList;
        };

        const { dirPath } = req.body;

        const targetDir = path.join(commonUtil.FILE_PATH(), dirPath || "2025");
        const allFiles = getAllFiles(targetDir, commonUtil.FILE_PATH());
        console.log(allFiles);

        const list = await this.list(req);
        const inFiles = [];

        for (const item of list) {
            if (
                allFiles.includes(item.fileUrl) ||
                allFiles.includes(item.viewUrl)
            ) {
                inFiles.push(item.fileUrl || item.viewUrl);
            }
        }
        const delFiles = [];
        for (const file of allFiles) {
            if (!inFiles.includes(file)) {
                delFiles.push(file);
                const toFilePath = path.join(commonUtil.FILE_PATH(), file);
                const stat = fs.statSync(toFilePath);
                if (stat.isFile()) {
                    fs.unlinkSync(toFilePath);
                }
            }
        }

        res.json({
            code: 200,
            success: true,
            data: {
                inFiles,
                delFiles,
            },
        });
    },

    
};

// 统一的数据处理入口
router.post("/dbs", (req, res) => {
    let type = req.body.operation;
    if (type === "getData") {
        type = "detail";
    }
    try {
        if (typeof dbFun[type] !== "function") {
            return res.json({
                code: 400,
                success: false,
                message: `操作类型 ${type} 未定义`,
            });
        }
        dbFun[type](req, res);
    } catch (err) {
        res.json({
            code: 500,
            success: false,
            message: err.message,
        });
    }
});

module.exports = router;
