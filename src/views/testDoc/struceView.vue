<template>
    <div class="struce-viewer-container">
        <div class="left-wrapper">
            left-wrapper
        </div>
        <div class="main-wrapper">
            <header>
            	<div class="tools">
            		<el-button size="mini" icon="iconfont icon-liebiaolist36" title="显示/隐藏大纲" @click="toggleOutline"></el-button>
            		<el-button size="mini" icon="iconfont icon-yanjing" title="显示/隐藏标签" @click="highLightText"></el-button>
            		<el-button size="mini" icon="iconfont icon-zoom-in" title="提取标签" @click="findText"></el-button>
            		<el-button size="mini" icon="iconfont icon-word" title="导出文档" @click="exportDoc"></el-button>
            	</div>
            </header>
            <main>
                <structViewer ref="structViewer" :data="structData" @change="changeEvent" />
            </main>
        </div>
    </div>
</template>

<script>
    import structViewer from '@/components/structViewer';

    export default {
        name: 'struceViewer',
        components: {
            structViewer,
        },
        data() {
            return {
                structData: {
					appId:"35345435",
					appKey: "wefoewrodse",
                    wordBreak: true,
                    editorURL: 'http://192.168.0.239:9007/editor-api',
                    nodeURL: process.env.VUE_APP_REMOTE_API, // nodeServer服务器地址 process.env.VUE_APP_REMOTE_API 'http://192.168.0.239:9001',
					nodeSocket: 'ws://127.0.0.1:13001',
                    textImgUrl: 'https://www.bzton.com/sdcpic20180601/', // 结构化文档中的图片路径
                    mergeDoc: false,
                    docData: {
                        "docId": '0000C273-3FFA-4750-B5EB-9E6FD3219D8B', // 9BBDB39A-5B03-40A9-A505-6939AE80C595
                        "stdKind": 6,
                        "stdName": '钢丝网架水泥膨胀珍珠岩夹芯板隔墙应用技术规程',
                        "stdNo": 'DBJ41/T 108-2011',
                        "stdId": 181540,
                        "stdSign": "DBJ41/T",
                        "stdPublishDate": "2012-06-27",
                        "stdPerformDate": "2012-10-31",
                    },
                    showHeader: true,
                    collapse: true, // 是否显示展开大纲的小按钮
                    closeOutline: false, // 默认关闭大纲
                    saveStruct: true, // 是否需要保存HTML
                    tooltips: [{'act':'feedback','label':'批注'},{'act':'bookmark','label':'书签'}],
                    // pageZoom: 80
                },
                selectionData: null,
            }
        },
        methods: {
            toggleOutline() {
                this.editorInstance.toggleOutline();
            },
            exportDoc() {
                this.editorInstance.interFaceAction({ act:'export_doc', data:{ type:'docx', docName:'TEST' } });
            },
            findText() {
                this.editorInstance.interFaceAction({ act:'execCommand', command:'search' });
            },
            highLightText(data) {
                // this.editorInstance.interFaceAction({ act:'highlightText' });
                var textArr = [];
                this.selectionData.selection.split(/\n/).forEach(str => {
                    if (str !== '') {
                        textArr.push(str)
                    }
                });
                this.selectionData.selectNodes.forEach((node, i) => {
                    this.editorInstance.interFaceAction({ act:'highlightText', text:textArr[i], container:node, cls:'on-comment' }).then(res => {
                        console.log(res)
                    });
                })
            },
            changeEvent(event) {
                // console.log('struct view changeEvent', event)
                 if (!['onScroll', 'mouseoverEvent'].includes(event.act)) {
                    console.log('changeEvent sturct index==>', event)
                }
                switch (event.act) {
                    case 'initialized':
                        this.editorInstance = this.$refs.structViewer;
                        break;
                    case 'mouseupEvent':
                        this.selectionData = _.pick(event, ['node','selectNodes','selection']);
                        console.log('this.selectionData', this.selectionData)
                        break;
                    case 'click':
                        console.log('changeEvent click==>', event.target)
                        break;
                }
            }
        }
    }
</script>

<style lang="scss" scoped>
    .struce-viewer-container{
        height: 100%;
        display: flex;
        .left-wrapper{
            flex: 0 0 400px;
            border-right: 1px solid #EEE;
            background: linear-gradient(0deg, #e1e9f1, transparent);
        }
        .main-wrapper{
            flex: 1;
            >header{
                height: 40px;
            	display:flex;
            	align-items: center;
            	padding: 0 10px;
                background: linear-gradient(90deg, #eaf3f5, transparent);
            	.tools{
            		display:flex;
            		align-items: center;
            		button{
            			padding: 3px;
            			margin: 0 2px;
            		}
            	}
            }
            >main{
                height: calc(100% - 40px);
            }
        }

    }
</style>
