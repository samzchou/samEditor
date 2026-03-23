const { resolve, getComponentEntries } = require("./utils");
const TerserPlugin = require('terser-webpack-plugin');
// const CompressionPlugin = require('compression-webpack-plugin');
let buildConfig = {
    parallel: false,
    //  输出文件目录
    outputDir: resolve("lib"),
    //  webpack配置
    configureWebpack: {
        //  入口文件
        entry: getComponentEntries("src/components"),
        //  输出配置
        output: {
            //  文件名称
            filename: "[name]/index.js",
            //  构建依赖类型
            libraryTarget: "umd",
            //  输出
            libraryExport: "default",
            //  组件库名称
            library: "SamEditor"
        },
        externals: {
            vue: {
                root: 'Vue',
                commonjs: 'vue',
                commonjs2: 'vue',
                amd: 'vue',
            },
        },
		optimization: {
			minimizer: [
				new TerserPlugin({
					terserOptions: {
						output: {
							comments: false, // 去除所有注释
						},
						compress: {
							drop_debugger: true, // 去除 debugger
							//drop_console: true,  // 去除 console 语句
						}
					},
					extractComments: false, // 不提取注释
				})
			]
		},
		
    },
    productionSourceMap: false,
    chainWebpack: config => {
        config.resolve.alias
            .set("@", resolve("src"))
            .set("@assets", resolve("src/assets"))
            .set("@images", resolve("src/assets/images"))
            .set("@views", resolve("src/views"))
            .set("@utils", resolve("src/utils"))
            .set("@store", resolve("src/store"))
            .set("@mixins", resolve("src/mixins"));
        config.resolve.symlinks(true);
        
        config.optimization.delete("splitChunks");
        config.plugins.delete("copy");
        config.plugins.delete("preload");
        config.plugins.delete("prefetch");
        config.plugins.delete("html");
        config.plugins.delete("hmr");
        config.entryPoints.delete("app");
        
        /*config.optimization.minimize(true);
        config.optimization.splitChunks({
            chunks: 'all',
        });*/
        
        // 加载图片
        config.module
              .rule('images')
              .test(/\.(png|jpe?g|gif)$/i)
              .use('url-loader')
              .loader('url-loader')
              .tap(options => Object.assign(options, { limit: 1024 * 8, esModule: false }))
              .end();
        return config;
    },
    //  样式输出
    css: {
        sourceMap: false,
        extract: {
            filename: "[name]/style.css"
        },
        loaderOptions: {
            scss: {
                prependData: `@import "./src/assets/scss/variables.scss";`
            }
        },
        requireModuleExtension: true
    },
    transpileDependencies: ['element-ui'],
};

module.exports = buildConfig;
