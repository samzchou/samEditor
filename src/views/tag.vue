<template>
    <div class="admin-index-container">
        <div class="tabs">
            <el-tabs v-model="activeName" type="card" @tab-click="handleTabClick">
                <el-tab-pane v-for="(item,idx) in tabList" :key="idx" :label="item.label" :name="item.act" />
            </el-tabs>
        </div>
        <div class="content">
            <div class="forms" v-if="currNode">
                <h3>插入/编辑标签</h3>
                <el-form size="small" :model="ruleForm" :rules="rules" ref="ruleForm" label-position="top">
                    <!-- <el-form-item label="标签所属">
                        <el-select v-model="ruleForm.id" style="width: 100%;" @change="setTagData">
                            <el-option v-for="(item,idx) in tagDatas" :label="item.name" :value="item.id" />
                        </el-select>
                    </el-form-item> -->
                    <el-form-item label="标签名称" prop="name">
                        <el-input v-model="ruleForm.name" clearable></el-input>
                    </el-form-item>
                    <el-form-item label="标签变量" prop="tag">
                        <el-input v-model="ruleForm.tag" clearable></el-input>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="insertTag">确定</el-button>
                    </el-form-item>
                </el-form>
            </div>
            <div v-else>请将光标置于要设置标签的位置！</div>
            <div class="editor">
                <sam-editor ref="samEditor" :data="editorSetting" @change="changeEvent"></sam-editor>
            </div>
        </div>
    </div>
</template>

<script>
    import $samGlobal from "@/utils/global";
    import samEditor from "@/components/samEditor/samEditor.vue";
    import { dbServer } from '@/api/nodeServer';

    export default {
        name: 'admin-editor-index',
        components: {
            samEditor
        },
        data() {
            var uuid = $samGlobal.guid();
            return {
                activeName: 'preface',
                currNode: null,
                currPageId: uuid,
                tabList: [{label:"前言", act:'preface'},{label:"引言", act:'intro'},{label:"范围", act:'range'},{label:"规范性引用文件", act:'normative'},{label:"术语和定义", act:'term'}],
                editorSetting: {
                    admin: true,
                    hideMenu: true,                                 // 隐藏菜单
                    hideNav: true,
                    toolbar1:'queue | formatting | indent2em lineheight',
                    contextmenu: 'undo redo',
                    quickbars: ' ',
                    htmlContent: `<div class="page-container"><div class="info-block" data-id="${uuid}"><p>请输入模板内容</p></div></div>`,
                },
                ruleForm: {
                    name: '',
                    tag: '',
                    id: undefined
                },
                rules: {
                    name: [{required: true, message: '请输入标签名', trigger: 'blur'}],
                    tag: [{required: true, message: '请输入变量名', trigger: 'blur'}]
                },
                templateList: [],
                pageContent: {
                    id: undefined,
                    key: '',
                    htmlContent: `<div class="page-container"><div class="info-block" data-id="${uuid}"><p>请输入模板内容</p></div></div>`,
                    tags: []
                }
            }
        },
        methods: {
            clearForm(currPageId=undefined) {
                this.currNode = null;
                this.ruleForm = {
                    name: '',
                    tag: '',
                    id: undefined
                };
                /* this.currPageId = currPageId || $samGlobal.guid();
                this.pageContent = {
                    id: undefined,
                    key: '',
                    htmlContent: `<div class="page-container"><div class="info-block" data-id="${this.currPageId}"><p>请输入模板内容</p></div></div>`,
                    tags: []
                } */
            },
            handleTabClick() {
                this.clearForm();
                var pageData = _.find(this.templateList, { key:this.activeName });
                if (pageData) {
                    this.currPageId = pageData.id;
                    this.pageContent = _.merge({}, pageData, {
                        htmlContent: `<div class="page-container"><div class="info-block" data-id="${this.currPageId}">${pageData.htmlContent.join("")}</div></div>`
                    });
                } else {
                    this.currPageId = $samGlobal.guid();
                    this.pageContent = {
                        id: this.currPageId,
                        key: this.activeName,
                        htmlContent: `<div class="page-container"><div class="info-block" data-id="${this.currPageId}"><p>请输入模板内容</p></div></div>`,
                        tags: []
                    }
                }
                this.$refs.samEditor.interFaceAction({ act:'resetContent', ...this.pageContent });
            },
            changeEvent(data) {
                this.clearForm(this.currPageId);
                // console.log('about revice change=>', data);
                if(data.act === 'click') {
                    this.currNode = data.node;
                    if (data.node && data.node.nodeName === 'SPAN' && $samGlobal.hasClass(data.node, 'tag')) {
                        for(let key in data.node.dataset) {
                            this.ruleForm[key] = data.node.dataset[key];
                        }
                    }
                } else if (data.act === 'loaded') {
                    this.handleTabClick();
                }
            },

            setTagData() {
                var obj = _.find(this.tagDatas, { id:this.ruleForm.id });
                if (obj) {
                    this.ruleForm = obj;
                }
            },
            async getHtmlContent() {
                var htmlContent = await this.$refs.samEditor.interFaceAction({ act:'getTagContent', id:this.currPageId });
                var section = document.createElement('div');
                section.innerHTML = htmlContent.join("");
                var tags = [];
                section.querySelectorAll('.tag').forEach(node => {
                    let obj = {}, nodeData = node.dataset;
                    for(let k in nodeData) {
                        obj[k] = nodeData[k];
                    }
                    tags.push(obj);
                });
                return {
                    htmlContent,
                    tags
                };
            },
            appendTag() {
                if (this.ruleForm.id) {
                    this.$refs.samEditor.interFaceAction({ act:'updateTag', ...this.ruleForm });
                } else {
                    var uuid = $samGlobal.guid();
                    this.ruleForm.id = uuid;
                    this.$refs.samEditor.interFaceAction({ act:'insertContent', htmlContent:`<span class="tag other" data-tag="${this.ruleForm.tag}" data-name="${this.ruleForm.name}" data-id="${uuid}">{@${this.ruleForm.tag}}</span>` });
                }
            },

            async insertTag() {
                var condition = {
                    type: 'redis',
                    key: 'template',
                    data: []
                }
                this.appendTag();
                var res, htmlData = await this.getHtmlContent();
                var tempIndex = _.findIndex(this.templateList, { key:this.activeName });
                // 更新模板
                if (tempIndex > -1) {
                    // 更新页面内容
                    this.pageContent = _.merge({}, this.pageContent, {...htmlData} );
                    this.$set(this.templateList, tempIndex, { ...this.pageContent });

                } else {
                    this.pageContent = {
                        id: $samGlobal.guid(),
                        key: this.activeName,
                        ...htmlData
                    }
                    this.templateList.push(this.pageContent);
                }

                condition.data = [...this.templateList];
                var editorConfig = $samGlobal.getStroage('tinymceConfig');
                // console.log('insertTag condition=>', condition);
                res = await dbServer(condition, editorConfig.nodeURL||'');
                if (res.error_code === 200) {
                    this.$message.success('标签设置成功！');
                }
            },
            async listTagData() {
                var condition = {
                    type: 'redis',
                    key: 'template'
                }
                var editorConfig = $samGlobal.getStroage('tinymceConfig');
                var res = await dbServer(condition, editorConfig.nodeURL||'');
                // console.log('listTagData=>', res)
                if (res.error_code === 200 && res.data) {
                    this.templateList = res.data;
                }
            }
        },
        created() {
            this.listTagData();
        }
    }
</script>

<style lang="scss" scoped>
    .admin-index-container{
        height: 100%;
        width: 100%;
        padding: 10px;
        .content{
            height: calc(100% - 26px);
            width: 100%;
            display: flex;
            .forms {
                flex: 0 0 400px;
                width: 400px;
                padding:15px;
                >h3{
                    line-height: 30px;
                    border-bottom: 1px solid #DDD;
                }
                ::v-deep .el-form{
                    padding: 15px 20px;
                }
            }
            .editor{
                flex:1;
            }
        }
    }
</style>
