module.exports = {
    buildTime: '2025-5-15 16:27:59',
    // node 服务端口
    port: 3300,

    mysql: {
        "locahost": {
            host: '192.168.0.20',
            port: '3306',
            user: 'liuzhi',
            password: 'sjtu',
            database: 'miner',
        },
		"locahost2": {
            host: '192.168.0.18',
            port: '3306',
            user: 'root',
            password: 'rainsome123!@#',
            database: 'miner',
        },
        "18": {
            host: '192.168.0.18',
            port: '3306',
            user: 'liuzhi',
            password: 'sjtu',
            database: 'miner',
        },
        "22": {
            host: '192.168.0.20',
            port: '3306',
            user: 'liuzhi',
            password: 'sjtu',
            database: 'miner',
        },
		"122": {
            host: '192.168.0.22',
            port: '3306',
            user: 'liuzhi',
            password: 'sjtu',
            database: 'miner',
        },
    },
    mongo: {
        host: '192.168.0.73',
        port: '27017',
        database: 'app-system',
    },
}
