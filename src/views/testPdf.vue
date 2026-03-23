<template>
    <div class="test-pdf-container">
        <pdfViewer :url="pdfUrl" :nodeURL="nodeURL" :disable="btnDisabled" :export="true" @change="changeEvent" />
        <!-- <pdfViewer :url="pdfUrl" :nodeURL="nodeURL" :disable="btnDisabled" :export="true" base64 @change="changeEvent" /> -->
    </div>
</template>

<script>
    import pdfViewer from '@/components/pdfViewer';
    export default {
        name: 'test-pdf',
        components: {
            pdfViewer
        },
        data() {
            return {
                nodeURL: process.env.VUE_APP_REMOTE_API || 'http://127.0.0.1:9001', // PDF阅读器所在的nodeServer路径
                pdfUrl: 'http://127.0.0.1:9001/files/2023/2/1/1675215627495-0.pdf', // 测试文档，实际须根据传入的参数去获取  GB4943.1-2011.pdf
                // 禁用PDF阅读器上某些按钮 'presentationMode演示全屏','openFile 打开本地文件','print 打印','download下载','viewBookmark查看书签','secondaryToolbarToggle其他工具'
                btnDisabled: ['print', 'download', 'viewBookmark'],
            }
            // data:application/octet-stream;base64,
        },
        methods: {
            changeEvent(data) {
                console.log('pdf change event', data)
            }
        }
    }
</script>

<style lang="scss" scoped>
    .test-pdf-container {
        height: 100%;
    }
</style>
