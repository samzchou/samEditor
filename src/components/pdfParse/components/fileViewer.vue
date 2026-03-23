<template>
    <div class="file-view-cmp">
        <pdfViewer :url="pdfUrl" :nodeURL="nodeUrl" base64 @change="changeEvent" />
        <!-- <div class="header" v-if="!hideHead">
            <span>{{currFile.label}}</span>
            <span>
                <el-button size="mini" type="cyan" icon="el-icon-edit-outline" @click.stop.prevent="editDocument">编辑</el-button>
                <el-button size="mini" icon="el-icon-close" @click.stop.prevent="closeView">退出</el-button>
            </span>
        </div>
        <div class="view-container" v-if="cmp">
            <component ref="viewCmp" :is="cmp" :data="currFile" :url="currFile.fileUrl" :nodeURL="nodeUrl" v-bind="$attrs" v-on="$listeners" />
        </div> -->
    </div>
</template>

<script>
    // PDF组件
    import pdfViewer from '@/components/pdfViewer/pdfViewer.vue';

    export default {
        name: 'file-view',
        inject: ['docSetting'],
        components: {
            pdfViewer
        },
        props: {
            hideHead: Boolean,
            data: Object
        },
        computed: {
            nodeUrl() {
                return this.docSetting.nodeURL;
            },
            pdfUrl() {
                if (this.data && this.data.fileUrl) {
                    if (this.data.fileUrl.startsWith('http')) {
                        return this.data.fileUrl;
                    } else {
                        return this.docSetting.nodePath + '/files/' + this.data.fileUrl;
                    }
                }
                return '';
            },

        },
        /* watch: {
            data: {
                handler(data) {
                    this.setData(data)
                },
                immediate: true,
                deep: true,
            }
        }, */
        data() {
            return {
                currFile: {}
            }
        },
        methods: {
            changeEvent(obj) {
                console.log('changeEvent==>', obj)
                if (obj.act) {
                    switch(obj.act) {
                        case 'close':
                            this.$emit('change', {act:'close'});
                            break;
                    }
                }
            },

        }
    }
</script>

<style lang="scss" scoped>
    .file-view-cmp{
        height: 100%;
        display: flex;
        flex-direction: column;
        .header{
            padding: 5px 10px;
            border-bottom: 1px solid #EEE;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background-color: #dde2eb;
        }
        .view-container{
            flex: 1;
            overflow: hidden;
        }
    }
</style>
