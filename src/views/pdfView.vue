<template>
    <div class="view-container">
        <header>
            <el-dropdown trigger="click" @command="highLightText">
                <span class="el-dropdown-link">
                    选中高亮<i class="el-icon-arrow-down el-icon--right"></i>
                </span>
                <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item v-for="(item, idx) in selectionList" :key="idx" :command="item">{{item.selectionStr}}</el-dropdown-item>
                </el-dropdown-menu>
            </el-dropdown>
            <!-- <el-button size="small" @click="highLightText">选中高亮</el-button> -->
            <el-button size="small" @click="findText">查找</el-button>
            <el-button size="small" @click="openFile">打开</el-button>
            <span>{{pdfUrl}}</span>
        </header>
        <main>
            <pdfViewer ref="pdfViewer" 
                :url="pdfUrl" 
                :closeSidebar="true"
                :waterMask="{'image':'http://192.168.0.239:9001/files/images/cover_gb.png', 'text':'版权所有','color':'#db9517','size':'60px'}" 
                nodeSocket="ws://127.0.0.1:1300"
                :nodeURL="nodeURL" 
                :limit="limit" 
                :download="true"
                :bgStyle="{'images':'http://127.0.0.1:9001/profile.jpg', 'color':'#CCC'}"
                :showImg="false"
                :base64="true" :data="pdfData"
                @change="changeEvent" />
        </main>
    </div>

</template>

<script>
    // 引入PDF阅读器组件
    import pdfViewer from '@/components/pdfViewer';
    
    export default {
        name: 'pdf-viewer',
        components: {
            pdfViewer
        },
        data() {
            return {
				limit: 0,
                pdfUrl: 'http://192.168.0.6/shjszx/data/files/11/std_20215.pdf?response-content-type=application/pdf',
                // pdfUrl: 'http://192.168.0.17:10001/files/process/801/TSG Z7001-2021.pdf', // https://app.bzton.cn/std_1552323.pdf || http://127.0.0.1:9001/std_1552323.pdf || https://app.bzton.cn/std_1552323.pdf || http://192.168.0.6/shjszx/data/files/804/std_1607401.pdf
                nodeURL: 'http://127.0.0.1:9001',
                selectionList:[],
				pdfData: {
					page: 4,
					content: '镍铬-铜镍(康铜)热电偶丝 技术要求',
					position: "133.0,483.0,249.0,518.0"
				}
            }
        },
        methods: {
            highLightText(cmd) {
                console.log('highLightText=>', cmd)
                var obj = {
                    text:cmd.selectionStr,
                    selected: {
                        matchIdx: 0,
                        pageIdx: parseInt(cmd.pages[0])
                    }
                }
                this.$refs.pdfViewer.postMessage({ highlightText:true, ...obj});
            },
            openFile() {
                this.$refs.pdfViewer.openFile()
            },

            findText() {
                this.$refs.pdfViewer.postMessage({find:true})
            },
            changeEvent(event) {
                console.log('changeEvent', event);
                switch (event.act) {
                    case 'selection':
                        this.selectionList.push(event.data)
                        break;
                }
            }
        }
    }
</script>

<style lang="scss" scoped>
    .view-container{
        height: 100%;
        >header {
            height: 40px;
        }
        >main{
            height: calc(100% - 40px);
        }
    }
</style>
