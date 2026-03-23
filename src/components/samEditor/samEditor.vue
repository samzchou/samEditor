<template>
    <div class="sam-editor-container" :id="`sam-editor-container-${editorId}`">
        <!-- <slot name="left"  v-bind="$attrs" /> -->
        <tinymce-editor v-if="showEditor" :ref="`tinymceEditor-${editorId}`" :data="editorSetting" v-on="$listeners" @change="changeEvent">
			<template v-slot:version>
				<slot name="version"></slot>
			</template>
		</tinymce-editor>
        <!-- 右侧扩展插槽 -->
        <slot name="right"></slot>
        <!-- 批注 -->
        <tinymce-comment class="tinymce-comment" v-bind="$attrs" :author="author" :class="{'show':showComment}" :data="commendData" @change="changeComment"/>
        <!-- 只读模式下弹出快捷工具条 -->
        <div v-if="toolIcon" class="quick-tool" :style="toolStyle">
            <span v-for="(item,idx) in toolIcon" :key="idx" :class="item.icon" :title="item.label" @click.stop.prevent="quickToolAct(item)" />
        </div>
         <!-- 弹窗组件 v-el-drag-dialog   -->
        <el-dialog v-if="dialogParams.visible"
            append-to-body
            custom-class="clause-dialog"
            :title="dialogParams.title"
            :visible.sync="dialogParams.visible"
            :width="dialogParams.width"
            :fullscreen="dialogParams.fullscreen"
            :close-on-click-modal="false"
            :destroy-on-close="true"
            :modal-append-to-body="false"
            :class="{'fullscreen':dialogParams.fullscreen}"
            @close="closeDialog">
            <quoteClause :setting="editorSetting" @change="changeClause" />
            <div slot="footer">
                <el-button size="small" @click="closeDialog">取 消</el-button>
                <el-button size="small" type="primary" :disabled="!clauseHtml" @click="submitDialogValue">确 定</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
    // 全局方法
    import $global from '@/utils/global.js';
    import $bus from '@/utils/bus.js';
	// 加密
	import { encryptLong } from '@/utils/jsencrypt.js';
	// api接口校验授权
	import { dbServer } from '@/api/nodeServer.js';
	// import socketUtil from '@/utils/socketUtil';
    import quoteClause from '@/slot/quoteClause';

    export default {
        name: 'sam-editor',
        components: {
            tinymceEditor: () => import('../tinymceEditor/tinymceEditor.vue'),
            tinymceComment: () => import('./comment'),
            quoteClause,
        },
        watch: {
            $attrs: {
                handler(data) {
                    if (!_.isEmpty(data)) {
                        this.editorId = data?.data.editorId || $global.guid();
                        this.initData(data.data);
                    }
                },
                immediate: true,
                deep: true
            }
        },
        computed: {
            author() {
                var cfg = $global.getTinymceConfig();
                return cfg ? cfg.author : 'anonymous';
            },
            toolStyle() {
                return {
                    left: `${this.toolData.left}px`,
                    top: `${this.toolData.top}px`,
                    opacity: this.toolData.opacity
                }
            },
            /*editorId() {
                return $global.guid();
            }*/
        },

        data() {
            // var editorId = $global.guid();
            return {
                isMobile: false,
                editorSetting: null,
                editorId: undefined,
                showEditor: true,
                itemData:{},
                showComment: false,
                commendData: null,
                topDistance: 0,
                toolData: {
                    left:0,
                    top:0,
                    opacity: 0,
                    node: null,
                    selection: ''
                },
                toolIcon: [
                    { icon:'iconfont icon-interactive', label:'意见', act:'question' },
                    { icon:'iconfont icon-renyuanliebiao', label:'人员', act:'question' },
                ],
				zoomIn: 0,
				clientId: $global.guid(),
				connector: null,
                dialogParams: {
                    visible: false,
                    title: '',
                    width: '800px'
                },
                clauseHtml: '',
            }
        },
        methods: {
			zoomTooltip(val) {
				val += 100;
				return Math.round(val/100*100) + '%';
			},
            closeDialog() {
                this.$set(this.dialogParams, 'visible', false);
                this.$forceUpdate();
                setTimeout(() => {
                    this.$refs[`tinymceEditor-${this.editorId}`].refreshEditor(false, this.editorSetting);
                }, 500);
            },
            submitDialogValue() {
                this.$refs[`tinymceEditor-${this.editorId}`].setContent(this.clauseHtml);
                this.closeDialog();
            },

            changeClause(data) {
                // console.log('changeClause', data);
                if (!data.act) {
                    this.clauseHtml = data;
                }
            },

            /**
             * @description 初始编辑器数据
             * @param {Object} data
             */
            initData(data={}) {
                this.isMobile = data?.isMobile;
                this.toolIcon = _.cloneDeep(data.quickTools);
                if (!data.editorId) {
                    data.editorId = this.editorId;
                } else {
                    this.editorId = data.editorId;
                }
                this.editorSetting = data;
                $global.setTinymceConfig(data);
            },

			async verifyAuthor({ appId, appKey }) {
				if(this.showEditor) return;
				appId = encryptLong(appId);
				appKey = encryptLong(appKey);

				let error;
				const { data } = await dbServer({ operation:'checkAuthor', appId, appKey }, this.$attrs.data.nodeURL);
				if (data < 0) {
					error = '编辑器授权校验失败，请检查appId及appKey！';
				} else if(data === 0){
					error = '编辑器授权期限已过时，请联系相关人员重新激活授权！';
				} else if (data < 187200000) { // 提前三天通知
					this.$message({
						type: 'warning',
						message: '编辑器授权期限即将到期，请及时重新激活授权！'
					});
				}
				if (error) {
					this.$alert({
						type: 'error',
						message: '编辑器授权校验失败，请检查appId及appKey'
					});
					return false;
				}
				$global.setTinymceConfig(this.$attrs.data);
				this.showEditor = true;
				return true;
			},

			async closeClient(isAdd=false) {
				// const { data } = await dbServer({ operation:'closeClient' }, this.$attrs.data.nodeURL);
				this.showEditor = false;
			},

            /**
             * @description 滚动条置顶
             */
            moveTop() {
                this.$refs[`tinymceEditor-${this.editorId}`].moveTopage(0);
            },

            /**
             * @description 编辑器事件统一接口（外部调用）
             * @param {Object} data: {act:String, ...}
             */
            async interFaceAction(data={}) {
                var actName = data.act;
                if (actName && typeof this.$refs[`tinymceEditor-${this.editorId}`][actName] === 'function') {
                    // 重新定位editor实例
                    this.$refs[`tinymceEditor-${this.editorId}`]['reloadEditor']();
                    // 重新加载文档
                    if (actName === 'loadDocData' && data.docId) {
                        return this.$refs[`tinymceEditor-${this.editorId}`][actName](data.docId, true);
                    }
                    if (actName === 'moveTopage') {
                        return this.$refs[`tinymceEditor-${this.editorId}`][actName](data.value);
                    }
                    if (actName === 'setContent') {
                        return this.$refs[`tinymceEditor-${this.editorId}`][actName](data.value);
                    }
                    if (actName === 'getContent') {
                        return this.$refs[`tinymceEditor-${this.editorId}`][actName](data.isText);
                    }
                    if (actName === 'setPageZoom') {
                        return this.$refs[`tinymceEditor-${this.editorId}`][actName](data.value);
                    }
                    if (actName === 'transPageToImage') {
                        return this.$refs[`tinymceEditor-${this.editorId}`][actName]();
                    }
                    if (actName === 'getNode') {
                        return this.$refs[`tinymceEditor-${this.editorId}`][actName](data.selection);
                    }

                    if (actName === 'highlightText') {
                        return this.$refs[`tinymceEditor-${this.editorId}`][actName](data);
                    }
                    if (actName === 'refreshEditor') {
                        return this.$refs[`tinymceEditor-${this.editorId}`][actName](data.collapse);
                    }
                    delete data.act;
                    if (_.isEmpty(data)) {
                        data = null;
                    }
                    var result = await this.$refs[`tinymceEditor-${this.editorId}`][actName](data);
                    return result;
                } else {
                    this.$alert('接口' + actName + '未定义！');
                    return null;
                }
            },

            /**
             * @description 快捷工具条点击后上报事件
             * @param {Object} item
             */
            quickToolAct(item) {
                this.toolData.opacity = 0;
                this.$emit('change', { act:item.act, selection:this.toolData.selection, node:this.toolData.node });
            },

            /**
             * @description 显示快捷工具条
             * @param {Object} data
             */
            showToolBar(data) {
                var event = data.event;
                var top = data.top, opacity = 0;
                if (data.selection) {
                    opacity = 1;
                } else {
                    top = -2000;
                }
                var toolBarNode = document.querySelector(`#sam-editor-container-${this.editorId}>.quick-tool`);
                this.toolData = {
                    opacity,
                    node: data.node,
                    selection: data.selection,
                    left: data.left + (data.width - toolBarNode.offsetWidth) / 2,
                    top: top - 40 //event.target.getBoundingClientRect().top - 20
                }
            },

            /**
             * @description 编辑器事件回调
             * @param {Object} data
             */
            changeEvent(data) {
                // console.log("changeEvent|||=>", data);
                this.showComment = false;
                switch (data.act) {
                    case 'onScroll':
                        this.topDistance = data.top;
                        this.toolData.opacity = 0;
                        break;
                    case 'destroy':
						this.closeClient();
                        break;
                }
            },

            /**
             * @description 批注提交
             * @param {Object} evt
             */
            changeComment(evt=null) {
                if(evt.act === 'close') {
                    this.showComment = false;
                    return;
                }
                if (evt) {
                    this.$refs[`tinymceEditor-${this.editorId}`].toggleCommnet(evt.data, evt.removed);
                }
                if (evt && evt.removed) {
                    this.showComment = false;
                }
            },

            /**
             * @description 外部调用方法
             * @param {Object} obj for example: { act: 'setContent', params:{} }
             * @return {Object|String}
             */
            getData(obj={}) {
                return this.$refs[`tinymceEditor-${this.editorId}`].getData(obj);
            },

            /**
             * @description 编辑器设置数据
             */
            setData(obj={}) {
                // return this.$refs.tinymceEditor.setData(obj);
            },

            /**
             * @description 打上标签
             * @param {Object} obj  || { value: 'quota', id:$global.guid(), title:'指标', content:JSON.stringify(data) }
             */
            toggleTag(obj) {
                return this.$refs[`tinymceEditor-${this.editorId}`].toggleTag(obj);
            },

            /**
             * @description 编辑器插入内容
             * @param {String} htmlContent
             */
            setContent(htmlContent) {
                return this.$refs[`tinymceEditor-${this.editorId}`].setContent(htmlContent, true);
            },

        },

		mounted() {
			window.addEventListener('beforeunload', () => { this.closeClient });
            $bus.$on('closeEditor', () => {
                $global.clearStroage('tinymceConfig');
                $global.clearStroage('tinymceDocData');
                this.$emit('change', { act:'closeEditor' });

            })
            $bus.$on('openClause', (data) => {
                this.clauseHtml = '';
                this.dialogParams = {
                    visible: true,
                    title: '引用标准条款',
                    fullscreen: true,
                }
            })
		}
    }
</script>

<style lang="scss" scoped>
    @import "./index.scss";
</style>
