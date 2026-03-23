<template>
    <div class="pdfviewer-container">
        <parse-pdf />
        <!-- <iframe id="my-framer" src="http://127.0.0.1:9001/files/GBT15496-2017.html" frameborder="0" scrolling="no" crossorigin="anonymous" width="100%" height="100%" /> -->
    </div>
</template>

<script>
    import parsePdf from '@/components/parsePdf'
    export default {
        name: 'pdf-parser-page',
        components: {
            parsePdf
        },
        provide() {
            return {
                pdfOptions: {
                    nodeUrl: process.env.VUE_APP_SERVER_URL,
                    // topicUrl: process.env.VUE_APP_TOPICAL_URL,
                    pluginUrl: 'http://192.168.0.239:9003',
                }
            }
        },
        data() {
            return {

            }
        },
        methods: {
            parseHtml(iframe) {
                // console.log(window.frames['acty-frame'].contentWindow.document.body.innerHTML)
                // const body = iframe.contentWindow.document.body;
                // debugger
            },
            listenerIframe() {
                /* const iframe = document.querySelector('#my-framer');
                // 处理兼容行问题
                if (iframe.attachEvent) {
                    iframe.attachEvent('onload', () => {
                        this.parseHtml(iframe)
                    })
                } else {
                    iframe.onload = () => {
                        this.parseHtml(iframe)
                    }
                } */
            }
        },

        mounted() {
            document.title = '解析PDF'
            /* this.$nextTick(() => {
                this.listenerIframe()
            }) */
        }
    }
</script>

<style lang="scss" scoped>
    .pdfviewer-container{
        height: 100%;
    }
</style>
