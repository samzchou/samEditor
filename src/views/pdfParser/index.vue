<template>
    <div class="pdf-parse-page">
        <div class="left-wrapper">
            <h3>
                <i class="iconfont icon-zhinengbianji"></i>
                <span>AI 数据资产处理工具（文档数据结构化）</span>
            </h3>
            <p>未来，PDF或WORD文档解析成结构化数据将通过人工智能技术的进步，实现自动化、高精度的全文解析及语义理解，并通过深层的数据分析形成完整的知识体系，将广泛应用于数据提取、信息检索、智能分析及决策支持等领域。</p>
        	<p style="text-align:right;">--标准通</p>
        </div>
        <div class="main-wrapper">
            <pdfParse :isSelf="isSelf" @change="changeEvent" />
        </div>
    </div>
</template>

<script>
    import pdfParse from '@/components/pdfParse/index.vue';
    // 全局配置
    const _appConfig = window.$appConfig[process.env.NODE_ENV];

    export default {
        components: {
            pdfParse
        },
        // 配置信息
        provide() {
            return {
                docSetting: {
					//"title": "标准文档结构化数据解析",				  // 列表头标题
                    "editorURL": _appConfig.VUE_APP_EDITOR_URL,         // 编辑器地址
					"pluginURL": _appConfig.VUE_APP_PLUGIN_URL,		  // 插件地址
                    "nodeURL": 'http://101.132.25.221:9001',//_appConfig.VUE_APP_NODE_URL,             // node服务器地址 http://192.168.99.96:9001
                    "nodePath": 'http://101.132.25.221:9001',//_appConfig.VUE_APP_NODE_PATH,           // node绝对路径
                    "userId": this.userId,							   // 用户ID（必填）
                    "server": '18', // 222 | 18					        // MySQL服务器映射地址
                    "dbName": "miner", // miner | minio_info		// 数据库名
                    "tableName": "parse_file_process",				  // 文件数据表
                    "accept": ".pdf,.docx",							  // 允许上传的文件类型
					"limit": 5,										  // 同时上传文件的最大数量
					"isUrgent": 1,									    // 是否加急（VIP会员）
                    "parseApi": "http://192.168.99.18:33388/imageParse", // 图片解析地址
                    // "waterMask": {"text":"程序测试文档，仅供参考","color":"#db9517","size":"50px" },
                    "outData": true,                                    // 结构化数据外部处理保存
                    "textSize": 14,                                     // 文字尺寸
                    "dev": process.env.NODE_ENV,
                }
            }
        },
        data() {
            return {
                userId: 'test000001',
                isSelf: false
            }
        },
        methods: {
            changeEvent() {

            }
        },
        mounted() {
            document.title = "PDF解析";
        },
        created() {
            if (this.$route.query.self) {
                this.isSelf = true;
            }
        }

    }
</script>

<style lang="scss" scoped>
    .pdf-parse-page{
        height:100%;
        display: flex;
        .left-wrapper{
            width: 400px;
            border-right:1px solid #EEE;
            padding: 20px;
            background: linear-gradient(0deg, #eff8ff, transparent);
            >h3{
                line-height:35px;
                border-bottom:1px solid #EEE;
                margin-bottom:15px;
                font-size:16px;
                >i{
                    margin-right:10px;
                }
            }
            >p{
                line-height:1.5;
                text-indent: 2em;
                font-size:14px;
            }
        }
        .main-wrapper{
            width: calc(100% - 400px);
        }
    }
</style>
