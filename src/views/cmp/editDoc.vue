<template>
    <div class="editor-doc-container" :id="`samEditor-${editorId}`">
        <sam-editor v-if="editorSetting" :ref="`samEditor-${editorId}`" :data="editorSetting" @change="changeEvent">
            <template v-slot:right>
                <div class="right-wrapper" :style="rightStyle" v-show="rightWidth>0">
                    <header>
                        <span>{{slotTitle}}</span>
                        <i class="el-icon-close" @click.stop.prevent="rightWidth=0" />
                    </header>
                    <div class="content">
                        <component :is="slotCmp" :data="emitData" @change="changeData" :keyword="searchText" />
                    </div>
                </div>
            </template>
        </sam-editor>
		<div class="test-top">{{scrollDistance}}</div>
    </div>
</template>

<script>
    import samEditor from "@/components/samEditor/samEditor.vue";
    import * as slotComponent from "@/slot/index.js";
    import { editorConfig } from "@/components/tinymceEditor/configs/editorOptions.js";
    import $bus from "@/utils/bus";
    // 全局方法
    import $samGlobal from '@/utils/global';
    export default {
        name: 'editor-doc',
        components: {
            samEditor
        },
        props: {
            docId: String,
            commitId: String,
            syncScroll: Boolean,            // 同步滚动
        },
        computed: {
            slotCmp() {
                return slotComponent[this.cmpName];
            },
            rightStyle() {
                return {
                    width: `${this.rightWidth}px`,
                    display: this.rightWidth===0 ? 'none' : 'block'
                }
            },
            editorId() {
                return $samGlobal.guid();
            }
        },
        watch: {
            docId: {
                handler(newId, oldId) {
                    if (newId) {
                        this.setData();
                        // this.editorSetting.page.id = newId;
                    }
                },
                immediate: true
            },
        },
        data() {
            return {
                uuid: $samGlobal.guid(),
                loaded: false,
                emitData: null,
                searchText: '',
                cmpName: undefined,
                slotTitle: '右侧插槽标题',
                rightWidth: 0,
                outlineData: [],
                editorSetting: null,
				scrollDistance: 0
            }
        },
        methods: {
            setData() {
                this.editorSetting = {
                    ...editorConfig,
                    author: {
                        userId:'',
                        userName:'',
                        commitId: this.commitId || ''
                    },
                    page: {
                        id: this.docId
                    },
					syncScroll: this.syncScroll,					// 同步滚动
                    disabledSave:!this.commitId ? false : true,     // 禁用保存
                    unlock: true,                                   // 解锁所有页面
                    editorURL: process.env.VUE_APP_EDITOR_URL,		// JAVA接口地址
                    nodeURL: process.env.VUE_APP_REMOTE_API,		// nodeServer服务器地址
                    pluginURL: process.env.VUE_APP_PLUGIN_URL,	    // 外挂插件地址
                    menuBar: false,                                 // 菜单栏显示与否 | file edit insert pageElement levelStyle elementStyle Tools help
                    openSidebar: false,                             // 左侧导航栏默认展开或关闭
                    // hideSideBar: true,                           // 左侧导航栏隐藏
                    toolbar1: `undo redo | ${this.commitId ?'':'save |'} chapterTitle collect-chapter collect-unchapter | collect-list | paragraph-btn example-btn zhu-btn zhu-imgtable footer-btn | alignment indent2em fullscreen`,
                    toolbar2: '',
                    quickbars: 'copy copyEntry compare',                                // 选中文字后的快捷工具
                    contextmenu: 'copyNode | paste insertNode | compare-content',       // 右键菜单
                }
            },

            /**
             * @description 刷新编辑器
             */
            refreshEditor() {
                if (this.loaded) {
                    var $ref = this.$refs[`samEditor-${this.editorId}`];
                    $ref.interFaceAction({ act:'refreshEditor' });
                }
            },

            /**
             * @description 同步滚动页面
             * @param {Int} top 位置
             */
            scrollTop(top=0) {
                var $ref = this.$refs[`samEditor-${this.editorId}`];
                $ref.interFaceAction({ act:'scrollTop', top });
            },

            /**
             * @description 比较页面内容
             * @param {Element} page 当前页面
             */
            comparePage(page=null) {
                var $ref = this.$refs[`samEditor-${this.editorId}`];
                $ref.interFaceAction({ act:'comparePage', page });
            },

            /**
             * @description 接收编辑器的上报事件
             * @param {Object} data
             */
            changeEvent(data) {
                // console.log('changeEvent=>', data);
                switch(data.act) {
                    case 'loaded':
                        setTimeout(() => {
                            this.$emit('loaded');
                        }, 1000)
                        break;
                    case 'compare':
                        $bus.$emit('comparePage', { id:this.docId, uuid:this.uuid, page:data.page });
                        break;
                    case 'onScroll':
                        if(this.syncScroll) {
                            $bus.$emit('scrollTop', { id:this.docId, top:data.top, uuid:this.uuid });
                        }
                        break;
                    case 'click':
                        this.rightWidth = 0;
                        if ($samGlobal.hasClass(data.evt.target.parentNode, 'ics') || $samGlobal.hasClass(data.evt.target.parentNode, 'ccs')) {
                            this.emitData = {
                                isIcs: $samGlobal.hasClass(data.evt.target.parentNode, 'ics')
                            }
                            this.slotTitle = 'ICS-CCS编号';
                            this.cmpName = 'icsNumber';
                            this.rightWidth = 500;
                        } else if ($samGlobal.hasClass(data.evt.target.parentNode, 'date-time')) {
                            this.dialogData = {
                                title: '选择日期',
                                type: 'date',
                                visible: true,
                                width: '300px',
                                node: data.evt.target,
                                value: $samGlobal.isDate(data.evt.target.textContent) ? data.evt.target.textContent : ''
                            }
                        } else if ($samGlobal.hasClass(data.evt.target.parentNode, 'std-edition')) {
                            this.dialogData = {
                                title: '选择文档稿次',
                                type: 'edition',
                                visible: true,
                                width: '300px',
                                node: data.evt.target,
                                value: data.evt.target.textContent
                            }
                        } else if (data.evt.target.dataset && data.evt.target.dataset.tag && data.evt.target.dataset.type == '3') {

                        }
                        break;
                    // 引用条款 clause
                    case "importQuote":
                        this.slotTitle = data.data.text;
                        this.cmpName = data.data.act === 'std' ? 'quoteStandard' : 'quoteClause';
                        this.rightWidth = 500;
                        break;
                    // 引用术语
                    case "showTerm":
                        this.rightWidth = 500;
                        this.slotTitle = '引用术语';
                        this.cmpName = 'quoteTerm';
                        break;
                    // 指标比对
                    case "showQuota":
                        this.rightWidth = 500;
                        this.slotTitle = '指标比对';
                        this.cmpName = 'quoteComparison';
                        break;
                    case 'close':
                        this.rightWidth = 0;
                        break;
                }
            },
            /**
             * @description 调用编辑器的接口处理业务
             * @param {Object} event
             */
            changeData(event) {
                var htmlContent;
                var $ref = this.$refs[`samEditor-${this.editorId}`];
                switch(event.act) {
                    // 引用标准
                    case 'standard':
                        var str = `${event.stdNo}`;
                        if(event.type) {
                            str += `-${event.date}`;
                        }
                        str += ` &nbsp;${event.label}`;
                        htmlContent = `<a class="quote" href="#" javascript="void(0)" title="引用标准" data-stdid="${event.stdId}" data-stdno="${event.stdNo}">${str}</a>`;
                        $ref.interFaceAction({ act:'insertContent', htmlContent })
                        break;
                    // 引用术语
                    case 'term':
                        htmlContent = `
                            <br/>
                            <p class="term" data-tag="tag" data-id="${event.lemUuid}" style="text-indent:2em;" title="术语"><span style="font-family: simHei;">${event.lemEntry}</span><span style="font-family: times new roman;font-weight:bold">&nbsp;&nbsp;${event.lemEntryen}</span></p>
                            <p style="text-indent:2em;">${event.lemDescription}</p>
                            <p style="text-indent:2em;">[来源：<a class="term-quote" href="#" javascript="void(0)" title="术语" data-stdid="${event.stdId}" data-stdno="${event.stdNo||''}">${event.stdNo||''}</a>]</p>
                        `;
                        $ref.interFaceAction({ act:'insertContent', htmlContent, term:true });
                        break;
                    // 指标比对 { value: 'quota', id:$global.guid(), title:'指标', content:JSON.stringify(data) }
                    case 'comparsion':
                        var obj = {
                            value: 'comparsion',
                            id: $samGlobal.guid(),
                            title: '对标',
                            content: '对标数据内容'
                        };
                        $ref.interFaceAction({ act:'addTag', data: obj });
                        break;
                    // ICS-CCS编号
                    case 'ics-ccs':
                        $ref.interFaceAction({ act:'toggleIcsCcs', data:event });
                        break;
                }
            },
        },
        mounted() {
            $bus.$on('scrollTop', data => {
                if (data.uuid !== this.uuid) {
					this.scrollDistance = data.top;
                    this.scrollTop(data.top);
                }
            });
            $bus.$on('comparePage', data => {
                if (data.uuid !== this.uuid) {
                    this.comparePage(data.page);
                }
            })
        }
    }
</script>
<style lang="scss" scoped>
    .editor-doc-container{
        height: 100%;
		position: relative;
        .right-wrapper{
            width: 0px;
            transition: all .25s;
            >header{
                display:flex;
                align-items:center;
                justify-content: space-between;
                padding: 10px;
                border-bottom: 1px solid #DDD;
            }
            .content{
                height: calc(100% - 37px);
            }
        }
		.test-top{
			position: absolute;
			left: 20px;
			bottom: 20px;
		}
    }
	::v-deep .sam-dialog{
        .forms{
            .el-form {
                display: grid;
                grid-template-columns: repeat(2,50%);
                gap: 10px;
                padding-right: 10px;
                .el-form-item{
                    .el-form-item__label{
                        font-size: 14px;
                    }
                    ul{
                        overflow: hidden;
                        >li{
                            font-size:13px;
                            border-bottom: 1px solid #EEE;
                            padding: 5px 0;
                        }
                    }
                }
            }
        }
    }
</style>
