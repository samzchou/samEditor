const mongoose = require("mongoose");
// mysql 连接池
const mysql = require("mysql2");
// mysql 配置文件
const mysqlCfg = require("../../config");

// var connectCfg;

const dbController = {
    mysqlPool: null,
    // connectCfg: null,
    async connectMg() {
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 5000,
            })
            console.log('MongoDB connected...' )
        } catch (error) {
            console.error('MongoDB connect failed:', error.message)
            process.exit(1)
        }
    },
    async connectMysql(server) {
        try {
            const connectCfg = mysqlCfg['mysql'][server] || {
                host: process.env.MYSQL_HOST,
                port: process.env.MYSQL_PORT,
                user: process.env.MYSQL_USER,
                password: process.env.MYSQL_PASSWORD,
                database: process.env.MYSQL_DATABASE,
            }
            this.mysqlPool = mysql.createPool({
				...connectCfg,
				connectionLimit: 50,
				waitForConnections: true, 
				idleTimeout: 30000,
				queueLimit: 0,
                maxIdle: 10,         // 最小保持10个空闲连接
                enableKeepAlive: true,
			})
            console.log('Mysql connected...', mysqlCfg['mysql'][server] || "Env")
        } catch (error) {
            console.error('Mysql connect failed:', error.message)
            process.exit(1)
        }
    },
    batchQuery(sql, data) {
        if (!sql) {
            return null
        }
        return new Promise((resolve, reject) => {
            this.mysqlPool.getConnection((error, connection) => {
                if (error) {
                    console.error('pool.getConnection[batchQuery]:', error)
                    connection.release()
                    if (callback) {
                        callback(null)
                    } else {
                        resolve(null)
                    }
                    return
                } else {
                    try {
                        this.mysqlPool.query(sql, data, (err, results) => {
                            if (err) {
                                console.error('mysql query error:', err.message)
                                resolve(null)
                                return
                            }
                            resolve(results)
                        })
                    } catch (err) {
                        console.error('catch error:', err.message)
                        resolve(null)
                    }  finally {
						connection.release()
					}
                }
                connection.release()
            })
        })
    },

    mysqlQuery(sql, callback) {
        if (!sql) {
            callback(null)
            return
        }
        return new Promise((resolve, reject) => {
            this.mysqlPool.getConnection((error, connection) => {
                if (error) {
                    console.error('pool.getConnection[mysqlQuery]:', error.message)
                    connection.release()
                    if (callback) {
                        callback(null)
                    } else {
                        resolve(null)
                    }
                    return
                } else {
                    try {
                        this.mysqlPool.query(sql, (err, rows, fields) => {
                            if (err) {
                                console.error('mysql query error:', err.message)
                                if (callback) {
                                    callback(null)
                                } else {
                                    resolve(null)
                                }
                                return
                            }
                            if (callback) {
                                callback(rows)
                            } else {
                                resolve(rows)
                            }
                        })
                    } catch (err) {
                        console.error('catch error:', err.message)
                        if (callback) {
                            callback(null)
                        } else {
                            resolve(null)
                        }
                    }  finally {
						connection.release()
					}
                }
                
            })
        })
    },
}

module.exports = dbController;
