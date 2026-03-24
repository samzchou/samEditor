module.exports = {
    // IP 白名单配置
    whitelistedIPs: {
        // 开发环境
        development: [
            '127.0.0.1',
            '::1',
            '192.168.1.0/24'
        ],
        // 测试环境
        test: [
            '127.0.0.1',
            '::1',
            '10.0.0.0/16'
        ],
        // 生产环境
        production: [
            '203.0.113.0/24',
            '2001:db8::/32'
        ]
    },
    
    // API key 白名单
    trustedAPIKeys: [
        process.env.TRUSTED_API_KEY,
        process.env.ADMIN_API_KEY
    ]
}; 