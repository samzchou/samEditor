<template>
    <div class="doc-compose-page">
        <!-- v-if="aiOptions.tabs" -->
        <div class="doc-tabs">
            <el-tabs v-model="activeTab" type="card" @tab-click="changeTab">
                <el-tab-pane v-for="(item, idx) in toolTabs" :key="idx" :label="item.text" :name="item.act" />
            </el-tabs>
            <span class="close-btn el-icon-close" @click.stop.prevent="$emit('change',{'act':'close'})">
                关闭
            </span>
        </div>
        <div class="doc-slots">
            <!-- <el-scrollbar class="scrollbar ver"> -->
            <component v-if="aiParams && aiParams.command === 'aiCmd'" ref="aiCmp" :is="slotCmp" :data="aiParams" v-bind="$attrs" v-on="$listeners" @change="changeTool" />
            <component v-else ref="aiCmp" :is="slotCmp" :data="data" v-bind="$attrs" v-on="$listeners" @change="changeSlot" />
            <!-- </el-scrollbar> -->
        </div>
    </div>
</template>

<script>

    // 通用函数
    import $global from '@/utils/global.js';
    // 插槽组件
    import * as slotComp from './docExtend/index.js';

    export default {
        name: 'ai-doc-compose',
        inject: ['aiOptions'],
        props: {
            data: {
                type: Object,
                default: () => {
                    return {};
                }
            },
            aiActive: String,
            editorInstance: Object,
            settings: Object,
        },

        computed: {
            slotStyle() {
                let obj = {
                    width: this.rightWidth + 'px'
                }
                return obj;
            },
            slotCmp() {
                if (this.aiParams && this.aiParams.act) {
                    switch(this.aiParams.act) {
                        case 'aiCmd':
                            return slotComp['aiTools'];
                    }
                }
                return slotComp[this.activeTab];
            }
        },
        watch: {
            aiActive: {
                handler(val) {
                    if (val) {
                        this.activeTab = val;
                    }
                },
                immediate: true,
            },
            data: {
                handler(data) {
                    this.aiParams = null;
                    if (!_.isEmpty(data)) {
                        this.aiParams = _.cloneDeep(data);
                        // debugger
                        if (this.aiParams.act !== 'aiCmd') {
                            this.activeTab = this.aiParams.command;
                        } else {
                            this.activeTab = 'docAi';
                        }
                        console.log('this.aiParams=================================>', this.aiParams);
                    }
                },
                immediate: true,
                deep: true
            },
            settings: {
                handler(data) {
                    if (!_.isEmpty(data)) {
                        if (data.aiAssistant) {
                            this.toolTabs = data.aiAssistant;
                        }
                    }
                },
                immediate: true,
                deep: true
            }
        },

        data() {
            return {
                rightWidth: 0,
                toolTabs: [{
                    text: '模板',
                    act: 'docModel'
                },{
                    text: 'AI辅助编写',
                    act: 'docAi'
                },/*{
                    label: '引用',
                    name: 'quote'
                },{
                    label: '指标',
                    name: 'docNorm'
                },{
                    label: '术语',
                    name: 'docTerm'
                },{
                    label: '批注',
                    name: 'docAnnotation'
                },*/{
                    text: '知识库',
                    act: 'docKnowledge'
                },{
                    text: '比对',
                    act: 'docComparison'
                },{
                    text: '查重',
                    act: 'docDuplicate'
                }],
                activeTab: 'docAi',
                aiParams: null,
            }
        },
        methods: {
            // 切换页签
            changeTab(tab) {
                // console.log('changeTab===>', tab.name, this.activeTab);
                if (this.activeTab !== 'docAi' && this.aiParams) {
                    this.aiParams = null;
                }
            },
            // 右侧栏事件
            async changeTool(obj) {
                console.log('changeTool====>', changeTool);
                if (obj.act) {
                    switch (obj.act) {
                        case 'close':
                            this.$emit('close');
                            break;
                    }
                }

            },

            async changeSlot(data) {
                // console.log('changeSlot====>', data);
                // debugger
                switch (data.act) {
                    case 'model':
                        this.activeTab = data.type;
                        break;
                    case 'insertOutline': // 构建基本大纲
                        const res = await this.editorInstance.interFaceAction({ act: 'resetContent', htmlContent:data.htmlArr.join('') });
                        // console.log('insertOutline=====>', res);
                        if (res) {
                            this.$message.success('已构建完成文档大纲！');
                        }
                        break;
                    case 'appendContent': // 插入内容
                        this.editorInstance.interFaceAction({ act: 'insertContent', htmlContent:data.htmlContent });
                        break;
                    case 'focus':
                        data = _.omit(data, ['act']);
                        this.editorInstance.interFaceAction({ act: 'foucsId', ...data });
                        break;
                    case 'reset':
                        this.editorInstance.interFaceAction({ act: 'resetContent', htmlContent:data.htmlContent });
                        break;
                    case 'appendOutline': // 插入大纲的所有子集内容并定位
                        this.resetOutlineContent(data.groupOutline);
                        break;
                    case 'appendOutlineItem': // 插入大纲的内容并定位
                        setTimeout(() => {
                            this.resetOutlineContent([data.outlineItem]);
                        }, 500);
                        break;
                    case 'appendCompelete':
                        this.editorInstance.interFaceAction({ act: 'appendCompelete' });
                        break;
                }
                this.$emit('change', data)
            },

            async resetOutlineContent(groupOutline=[]) {
                const getAllTextNodes = (list=[], index=0) => {
                    let htmlArr = [];
                    let endIndex = 0;
                    for (let i=index; i<list.length; i++) {
                        let node = list[i];
                        if (node.type === 'section') {
                            endIndex = i;
                            break;
                        } else {
                            htmlArr = htmlArr.concat(node.htmlArr);
                        }
                    }
                    return {
                        endIndex,
                        htmlContent: htmlArr.join("")
                    }
                }

                for (let outlineItem of groupOutline) {
                    const outlineNode = await this.editorInstance.interFaceAction({ act: 'foucsId', ...outlineItem });
                    if (outlineNode) {
                        let parentNode = $global.getParentBySelector(outlineNode, 'info-block');
                        let outlineContent = getAllTextNodes(outlineItem.children, 0);
                        let endIndex = outlineContent.endIndex;
                        if (outlineContent.htmlContent) {
                            let nextNode = outlineNode.nextElementSibling;
                            if (nextNode) {
                                nextNode.remove();
                            }
                            if ($global.hasClass(outlineNode,'header-title')) {
                                parentNode.innerHTML += outlineContent.htmlContent;
                            } else {
                                outlineNode.innerHTML += outlineContent.htmlContent;
                            }
                        }

                        for (let i=endIndex; i<outlineItem.children.length; i++) {
                            let childNode = outlineItem.children[i];
                            if (childNode.type === 'section') {
                                parentNode.innerHTML += childNode.htmlArr[0];
                                let section = parentNode.querySelector(`[data-outlineid="${childNode.outlineId}"]`);
                                if (section) {
                                    outlineContent = getAllTextNodes(outlineItem.children, i+1);
                                    if (outlineContent.htmlContent) {
                                        section.innerHTML += outlineContent.htmlContent;
                                    }
                                }
                            }
                        }
                        parentNode.removeAttribute('contenteditable');
                        $global.removeClass(parentNode, 'disabled');
                    }
                }
                this.editorInstance.interFaceAction({ act: 'reloadOutline' });
            },
        },


    }
</script>

<style lang="scss" scoped>
    .doc-compose-page {
        height: 100%;
        .doc-tabs{
            margin-top: 5px;
            position: relative;
            .el-tabs__item{
                background-color: #e1f0f566;
                color: rgba(0,0,0,.4);
                &.is-active{
                    background-color: #FFF;
                    color: #000;
                }
            }
            .close-btn{
                position: absolute;
                right: 10px;
                top:5px;
                cursor: pointer;
                color: #f59a63;
                font-size: 14px;
            }
        }
        .doc-slots{
            height: calc(100% - 31px);
            overflow: hidden;
        }
    }
</style>
