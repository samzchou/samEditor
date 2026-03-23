const { resolve } = require("./utils");
const IS_PROD = ["production", "prod"].includes(process.env.NODE_ENV);
let devConfig = {
    publicPath: '/',
    lintOnSave: !IS_PROD,
    runtimeCompiler: true,
    productionSourceMap: !IS_PROD,
    parallel: require("os").cpus().length > 1,
    pwa: {},
    devServer: {
        host: process.env.HOST,
        port: process.env.PORT,
        disableHostCheck: true,
        overlay: {
            warnings: false,
            errors: false
        },
        headers: {
            'Access-Control-Allow-Origin':'*'
        },
		/*
        proxy: {
            // 引用等接口
            [process.env.VUE_APP_BASE_API]: {
                target: process.env.VUE_APP_API,
                changeOrigin: true,
                ws: false,
                pathRewrite: {
                    ['^' + process.env.VUE_APP_BASE_API]: ''
                }
            },
            // 编辑器等接口
            [process.env.VUE_APP_EDITOR_API]: {
                target: process.env.VUE_APP_EDITOR_URL,
                changeOrigin: true,
                ws: false,
                pathRewrite: {
                    ['^' + process.env.VUE_APP_EDITOR_API]: ''
                }
            },
            // node接口
            [process.env.VUE_APP_SERVER]: {
                target: process.env.VUE_APP_REMOTE_API,
                changeOrigin: true,
                ws: false,
                pathRewrite: {
                    ['^' + process.env.VUE_APP_SERVER]: ''
                }
            },
            // DOC文档转换接口
            [process.env.VUE_APP_DOC]: {
                target: process.env.VUE_APP_DOC_API,
                changeOrigin: true,
                ws: false,
                pathRewrite: {
                    ['^' + process.env.VUE_APP_DOC]: ''
                }
            },
            // DMS接口1
            [process.env.VUE_APP_DMS]: {
                target: process.env.VUE_APP_DMS_API,
                changeOrigin: true,
                ws: false,
                pathRewrite: {
                    ['^' + process.env.VUE_APP_DMS]: ''
                }
            },
            // DMS接口2
            [process.env.VUE_APP_DMS_SUPPORT]: {
                target: process.env.VUE_APP_DMS_SUPPORT_API,
                changeOrigin: true,
                ws: false,
                pathRewrite: {
                    ['^' + process.env.VUE_APP_DMS_SUPPORT]: ''
                }
            },
        }
		*/
    },
    chainWebpack: config => {
        // console.log("config.optimization", config.optimization)
        config.entry('main').add('babel-polyfill');
        config.resolve.alias
            .set("@", resolve("src"))
            .set("@assets", resolve("src/assets"))
            .set("@components", resolve("src/components"))
            .set("@images", resolve("src/assets/images"))
            .set("@views", resolve("src/views"))
            .set("@utils", resolve("src/utils"))
            .set("@store", resolve("src/store"))
            .set("@api", resolve("src/api"))
            .set("@mixins", resolve("src/mixins"));
		
        config.resolve.symlinks(true);
        return config;
    },
    //  样式输出
    css: {
        sourceMap: false,
        extract: false,
        loaderOptions: {
            scss: {
                prependData: `@import "./src/assets/scss/variables.scss";`
            }
        },
        requireModuleExtension: true
    },
    transpileDependencies: ['element-ui'],
};

module.exports = devConfig;
