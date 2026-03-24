'use strict'
const express = require('express')
const router = express.Router()

const fs = require('fs-extra')
const path = require('path')
const commonUtil = require('../utils/common')
const _ = require('lodash')
const jsencrypt = require('../utils/jsencrypt')
const dbController = require('../config/database')
const wsServer = require('../websocket/wsServer')

// const { socket } = require("../../config");
// 存储各Socket连接的轮询定时器 { [socketId]: { interval, taskId }[] }
// const socketTimers = {};

const dbFun = {
    parseDbName(data) {
        if (data?.pter) {
            const pter = jsencrypt.decrypt(data.pter).split('||')
            if (pter && pter.length) {
                if (pter[1].split(',').length > 1) {
                    return pter[1].split(',').map((tableName) => {
                        return `${pter[0]}.${tableName}`
                    })
                }
                return pter.join('.')
            }
        } else {
            let names = []
            if (data.dbName) {
                names.push(data.dbName)
            }
            if (data.tableName) {
                names.push(data.tableName)
            }
            return names.join('.')
        }
        return undefined
    },
    async createOrUpdate(req, res) {
        const params = req.body
        const tableName = this.parseDbName(params)
        if (!tableName) {
            return res.json({
                success: false,
                code: 500,
                message: 'not found tableName',
            })
        }
        const fields = params.fields.join(',')
        let sql = `INSERT INTO ${tableName} (${fields}) VALUES ?`
        if (params.isUpdate) {
            const updateFields = params.fields.map((field) => {
                return `${field}=VALUES(${field})`
            })
            sql += ` ON DUPLICATE KEY UPDATE ${updateFields.join(',')}`
        }

        if (sql) {
            console.log(sql)
            try {
                const response = await dbController.batchQuery(sql, [
                    params.data,
                ])
                res.json({
                    success: response !== null,
                    code: response !== null ? 200 : 500,
                    data: response,
                })
            } catch (error) {
                res.json({
                    success: false,
                    code: 500,
                    message: error.message,
                })
            }
        } else {
            res.json({
                success: false,
                code: 500,
                message: '参数错误',
            })
        }
    },

    async jsonToXml(req, res) {
        const params = req.body
        try {
            let sql = this.parseSql(params)
            if (params.server) {
                await dbController.connectMysql(params.server)
            }
            if (sql) {
                // 特殊字符须转换以支持SQL执行
                sql = sql
                    .replace(/'end'/g, "''end''")
                    .replace(/'stop'/g, "''stop''")
                let response = await dbController.mysqlQuery(sql)
                if (response && Array.isArray(response)) {
                    response = response.map((item) => {
                        const obj = {}
                        for (let k in item) {
                            let val = item[k]
                            let key = commonUtil.toHump(k)
                            if (val !== null) {
                                obj[key] = val
                            }
                        }
                        return _.omit(obj, [
                            'createTime',
                            'updateAt',
                            'updateBy',
                            'parserVer',
                            'remarks',
                            'status',
                        ])
                    })
                    const metaData = _.find(response, {
                        contentType: 'metadata',
                    })
                    response = _.orderBy(response, [
                        'page',
                        'positionY',
                    ]).filter((item) => {
                        return item?.reviseContentType !== 'ignore'
                    })
                    response = response.filter(
                        (item) => !['abstract'].includes(item.contentType)
                    )
                    let xml = ''
                    if (params.exportType === 'xml') {
                        xml = await commonUtil.json2xml(
                            _.groupBy(response, 'page'),
                            metaData,
                            params.isStandard
                        )

                        if (xml) {
                            const filePath = path.join(
                                commonUtil.FILE_PATH(),
                                'xml',
                                'test.xml'
                            )
                            await commonUtil.putFile(xml, filePath)
                        }
                    }

                    return res.json({
                        success: true,
                        code: 200,
                        data:
                            params.exportType === 'xml'
                                ? xml
                                : JSON.stringify(_.groupBy(response, 'page')),
                    })
                }

                res.json({
                    success: false,
                    code: 500,
                    message: 'convert failed',
                })
            } else {
                res.json({
                    success: false,
                    code: 500,
                    message: '参数错误',
                })
            }
            /* const xml = xmlConvert.json2xml(data, { compact: true })
            res.json({
                success: true,
                code: 200,
                data: xml,
                message: "转换成功",
            }) */
        } catch (error) {
            res.json({
                success: false,
                code: 500,
                message: error.message,
            })
        }
    },

    async socket(req, res) {
        const params = req.body
        if (params.server) {
            await dbController.connectMysql(params.server)
        }
        // socketTimers[params.socketId] = []
        const clientId = wsServer.getCurrentClientId()
        // console.log('clientId', clientId)
        let sql = this.parseSql(params)
        const interval = setInterval(async () => {
            const response = await dbController.mysqlQuery(sql)
            if (Array.isArray(response) && response.length) {
                let isFinished = true
                const list = response.map((item) => {
                    const obj = {}
                    for (let k in item) {
                        let val = item[k]
                        let key = commonUtil.toHump(k)
                        if (key === 'progressPercentage' && val < 100) {
                            isFinished = false
                        }
                        if (
                            val !== null &&
                            ['id', 'progressPercentage', 'totalPage'].includes(
                                key
                            )
                        ) {
                            obj[key] = val
                        }
                    }
                    return obj
                })
                // console.log('params.socketId', params.socketId)
                wsServer.sendTo(clientId, {
                    type: params.act,
                    socketId: params.socketId,
                    data: list,
                })
                if (isFinished) {
                    clearInterval(interval)
                }
            } else {
                clearInterval(interval)
            }
        }, params.times || 3000)

        res.json({
            success: true,
            code: 200,
        })
    },

    async update(req, res) {
        const params = req.body
        const tableName = this.parseDbName(params)
        if (!tableName) {
            return res.json({
                success: false,
                code: 500,
                message: 'not found tableName',
            })
        }
        const fields = params.fields.join(',')
        const sql = `INSERT INTO ${tableName} (${fields}) VALUES ?`
    },
    async unionQuery(req, res) {
        const params = req.body
        const tableName = this.parseDbName(params)
        if (params.server) {
            await dbController.connectMysql(params.server)
        }

        const where = []
        if (params.condition) {
            if (typeof params.condition === 'string') {
                where.push(`a.${params.condition}`)
            } else {
                const cs = commonUtil.parseCondition(
                    params.condition,
                    'a',
                    params.search
                )
                if (cs && cs.length) {
                    where.push(cs.join(' AND '))
                }
            }
            where.push('b.del_flag=0')
        }
        if (params.keyword) {
            const kw = commonUtil.parseCondition(
                params.keyword,
                params.mapKey || 'b',
                true
            )
            if (kw && kw.length) {
                where.push(kw.join(' AND '))
            }
        }
        const on = []
        if (params.on) {
            const splintOn = params.on.split(',')
            on.push(`a.${splintOn[0]}`)
            on.push(`b.${splintOn[1]}`)
        }

        let sql = `SELECT count(*) as total FROM ${tableName[0]} a LEFT JOIN ${
            tableName[1]
        } b ON ${on.join('=')}`
        if (where.length) {
            sql += ` WHERE ${where.join(' AND ')}`
        }

        const countRes = await dbController.mysqlQuery(sql)

        sql = `SELECT ${params.fields || '*'} FROM ${
            tableName[0]
        } a LEFT JOIN ${tableName[1]} b ON ${on.join('=')}`
        if (where.length) {
            sql += ` WHERE ${where.join(' AND ')}`
        }

        if (params.orderBy) {
            sql += ` ORDER BY ${params.orderBy}`
        }
        if (params.pageNum && params.pageSize) {
            sql += ` LIMIT ${(params.pageNum - 1) * params.pageSize}, ${
                params.pageSize
            }`
        }

        let response = await dbController.mysqlQuery(sql)
        if (response && Array.isArray(response)) {
            response = response.map((item) => {
                const obj = {}
                for (let k in item) {
                    let val = item[k]
                    let key = commonUtil.toHump(k)
                    if (val !== null) {
                        obj[key] = val
                    }
                }
                return obj
            })
        }
        res.json({
            success: true,
            code: 200,
            total: countRes[0]['total'],
            data: response,
        })
    },

    // 获取数据
    async query(req, res) {
        const params = req.body
        let sql = params.sql

        if (!sql) {
            sql = this.parseSql(params)
        }
        // console.log('sql==>', sql)
        if (params.server) {
            await dbController.connectMysql(params.server)
        }

        if (sql) {
            // 特殊字符须转换以支持SQL执行
            sql = sql
                .replace(/'end'/g, "''end''")
                .replace(/'stop'/g, "''stop''")
            let response = await dbController.mysqlQuery(sql)
            let flag = response !== null
            if (response && Array.isArray(response)) {
                response = response.map((item) => {
                    const obj = {}
                    for (let k in item) {
                        let val = item[k]
                        let key = commonUtil.toHump(k)
                        if (val !== null) {
                            obj[key] = val
                        }
                    }
                    return obj
                })
            }
            if (response && Array.isArray(response) && req.body.one) {
                response = response[0]
            }

            const result = {
                success: flag,
                code: flag ? 200 : 500,
                data: response,
            }

            // 如列表则获取总数
            if (params.queryType === 0) {
                params._counts = true
                sql = this.parseSql(params)
                sql = sql
                    .replace(/'end'/g, "''end''")
                    .replace(/'stop'/g, "''stop''")
                const totalRes = await dbController.mysqlQuery(sql)
                if (totalRes) {
                    result.total = totalRes[0]['total']
                }
            }
            res.json(result)
        } else {
            res.json({
                success: false,
                code: 500,
                message: '参数错误',
            })
        }
    },
    parseSql(data = {}) {
        var sql = [],
            columnsData = {},
            cs = null,
            condition = ''
        if (data?.pter) {
            const pter = jsencrypt.decrypt(data.pter).split('||')
            // console.log(pter)
            if (!pter) {
                return res.json({
                    success: false,
                    code: 500,
                    message: 'decrypt failed',
                })
            }
            data.dbName = pter[0]
            data.tableName = pter[1]
        }

        switch (data.queryType) {
            case 0: // 查询数据
                sql.push('SELECT')
                if (
                    data.columns &&
                    Array.isArray(data.columns) &&
                    data.columns.length
                ) {
                    sql.push(data.columns.join(','))
                } else if (data._counts) {
                    sql.push('count(*) as total')
                } else {
                    sql.push('*')
                }
                let fromStr = 'FROM ' + data.tableName
                if (data.dbName) {
                    fromStr = 'FROM `' + data.dbName + '`.' + data.tableName
                }
                sql.push(fromStr)
                // 查询条件
                if (data.condition) {
                    if (typeof data.condition === 'string') {
                        sql.push(`WHERE ${data.condition}`)
                    } else {
                        const cs = commonUtil.parseCondition(
                            data.condition,
                            data.tableName
                        )
                        if (cs && cs.length) {
                            sql.push(`WHERE ${cs.join(' AND ')}`)
                        }
                    }
                }
                // 排除条件
                if (data.exclude) {
                    const exclude = commonUtil.excludeCondition(
                        data.exclude,
                        data.tableName
                    )
                    if (exclude && exclude.length) {
                        if (data.condition) {
                            sql.push(`AND ${exclude.join(' AND ')}`)
                        } else {
                            sql.push(`WHERE ${exclude.join(' AND ')}`)
                        }
                    }
                }
                // 同时包含
                if (data.include) {
                    const includes = commonUtil.parseCondition(
                        data.include,
                        data.tableName
                    )
                    if (includes && includes.length) {
                        sql.push(`OR (${includes.join(' AND ')})`)
                    }
                }
                // 模糊查询
                if (data.search) {
                    if (typeof data.search === 'string') {
                        if (data.condition) {
                            sql.push(`AND ${data.search}`)
                        } else {
                            sql.push(`WHERE ${data.search}`)
                        }
                    } else {
                        const cs = commonUtil.parseCondition(
                            data.search,
                            data.tableName,
                            true
                        )
                        if (cs && cs.length) {
                            if (data.condition) {
                                sql.push(`AND ${cs.join(' AND ')}`)
                            } else {
                                sql.push(`WHERE ${cs.join(' AND ')}`)
                            }
                        }
                    }
                }
                // 排序
                if (data.orderBy) {
                    if (typeof data.orderBy === 'object') {
                        sql.push(
                            'ORDER BY ' +
                                data.orderBy.column +
                                ' ' +
                                (data.orderBy?.sort || 'ASC')
                        )
                    } else if (typeof data.orderBy === 'string') {
                        sql.push(data.orderBy)
                    }
                }
                // 分页查询
                if (
                    data.pageNum !== undefined &&
                    data.pageSize !== undefined &&
                    !data._counts
                ) {
                    sql.push(
                        'LIMIT ' +
                            (data.pageNum - 1) * data.pageSize +
                            ',' +
                            data.pageSize
                    )
                }
                break
            case 1: // 插入数据
                sql.push('INSERT INTO `' + data.dbName + '`.' + data.tableName)
                var columns = [],
                    values = []
                if (
                    !Array.isArray(data.columns) &&
                    typeof data.columns === 'object'
                ) {
                    columnsData = commonUtil.parseColumns(data.columns)
                    columns = columnsData.columns
                    values = columnsData.values
                } else {
                    columns = data.columns
                    values = data.values
                }
                sql.push(`(${columns.join(',')}) VALUES (${values.join(',')})`)
                break
            case 2: // 更新数据
                sql.push(
                    'UPDATE `' + data.dbName + '`.' + data.tableName + ' SET'
                )
                var columns = []
                if (
                    !Array.isArray(data.columns) &&
                    typeof data.columns === 'object'
                ) {
                    columnsData = commonUtil.parseColumns(data.columns)
                    data.columns = columnsData.columns
                    data.values = columnsData.values
                }
                data.columns.forEach((col, i) => {
                    let val = data.values[i]
                    if (val === "'add counts'") {
                        columns.push(`${col}=${col}+1`)
                    } else {
                        columns.push(`${col}=${val}`)
                    }
                })
                sql.push(columns.join(','))

                if (typeof data.condition === 'object') {
                    cs = commonUtil.parseCondition(
                        data.condition,
                        data.tableName
                    )
                    if (cs && cs.length) {
                        sql.push(`WHERE ${cs.join(' AND ')}`)
                    } else {
                        return undefined
                    }
                } else {
                    sql.push(`WHERE ${data.condition}`)
                }
                break
            case 3: // 删除数据
                sql.push('DELETE FROM `' + data.dbName + '`.' + data.tableName)
                if (typeof data.condition === 'object') {
                    cs = commonUtil.parseCondition(
                        data.condition,
                        data.tableName
                    )
                    if (cs && cs.length) {
                        sql.push(`WHERE ${cs.join(' AND ')}`)
                    } else {
                        return undefined
                    }
                } else {
                    sql.push(`WHERE ${data.condition}`)
                }
                break
        }
        return sql.join(' ')
    },
}

// 统一的数据处理入口
router.post('/query', (req, res) => {
    let type = req.body.operation
    try {
        if (typeof dbFun[type] !== 'function') {
            return res.json({
                code: 400,
                success: false,
                message: `操作类型 ${type} 未定义`,
            })
        }
        dbFun[type](req, res)
    } catch (err) {
        res.json({
            code: 500,
            success: false,
            message: err.message,
        })
    }
})

module.exports = router
