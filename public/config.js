/**
 * 系统运行参数配置
 * -------------------------------------------------
 * ##### environment: 环境变量 ##########
 * -------------------------------------------------
 */
window.BASE_URL = '';
window.TIME_OUT = 1000 * 60;

const _configs = {
    // 开发环境
    development: {
		'VUE_APP_SYS_URL': 'http://localhost',
        'VUE_APP_EDITOR_URL': 'http://192.168.0.140:9088',
        'VUE_APP_PLUGIN_URL': 'http://192.168.0.239:9003',
        'VUE_APP_SOCKET': 'ws://192.168.0.17:13100/ws-api',
        'VUE_APP_DMS_API': 'http://192.168.0.17:20080',
        'VUE_APP_FLOW_URL': 'http://192.168.0.18:13003/teach', // 引擎接口地址 http://bzton.cn:9008
        'VUE_APP_NODE_URL': 'http://192.168.0.73:9001', // 编辑器服务地址 192.168.0.73
        'VUE_APP_NODE_PATH': 'http://192.168.0.73:9001', // 编辑器服务地址 192.168.0.73
        'VUE_TEXT_IMGURL': 'https://www.bzton.com/sdcpic20180601/351/700391/',
        'VUE_PDF_URL': 'http://192.168.0.6',
        'VUE_APP_DMS_SUPPORT_API': '/dms_support_api',
        'VUE_SOURCE_IMG': '/prod-api/file/profile/upload',
        'VUE_REPLACEL_IMG': 'http://192.168.0.239:9006/bullProfile',
		'VUE_APP_SEARCH_URL': "http://www.bzton.com/searchUrl",
        'VUE_APP_BUY_URL': 'http://bzton.cn:8087',
        // AI智能编写
        'VUE_AI_SOCKET_URL': 'ws://192.168.0.19:8500/api/push/websocket',       // AI GPT SOCKET接口
        'VUE_AI_INTERFACE_URL': 'http://192.168.0.19:12999/rest/db_opr',        // AI GPT 流式接口
        // AI智能问答及语义搜索模型
        'knowledgeSetting': {
            'model': 'qianwen',
            'plugin': 'semantics',
            'collection_name': "std_graph_embedding_indicators",
            'jimoLogic':"lepton_search",
            'knowledge_base_uuid': '3a3cefee-9275-11ef-a7a2-20040ffb3680',
            'session_uuid': "43c90cef-fe1a-4329-8254-0ee81c6955ff",
            'opr': "simi_search",
        }
    },
    // 生产环境
    production: {
        'VUE_APP_SYS_URL': 'http://localhost',
        'VUE_APP_EDITOR_URL': 'http://www.bzton.com/prod-api/pt-9188',
        'VUE_APP_FLOW_URL': 'http://192.168.0.18:13003/teach',
        'VUE_APP_NODE_URL': 'http://www.bzton.com/pt-9001',
        'VUE_APP_SOCKET': 'wss://ws-11100.bzton.com/ws-api',
        'VUE_TEXT_IMGURL': 'https://www.bzton.com/sdcpic20180601/351/700391/',
        'VUE_PDF_URL': 'http://192.168.0.6',
        'VUE_APP_DMS_API': '/dmsapi',
        'VUE_APP_DMS_SUPPORT_API': '/dms_support_api',
        'VUE_SOURCE_IMG': '/prod-api/file/profile/upload',
        'VUE_REPLACEL_IMG': 'http://192.168.0.239:9006/bullProfile',
		'VUE_APP_SEARCH_URL': "http://www.bzton.com/searchUrl",
        'VUE_APP_BUY_URL': 'http://bzton.cn:8087',
    },

};
// 将配置定义为window对象
window.$appConfig = _configs;
