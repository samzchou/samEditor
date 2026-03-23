<template>
    <div class="quote-comment-container">
        <header>
            <span>批注</span>
            <i class="el-icon-close" @click.stop.prevent="$emit('change', {act:'close'})" />
        </header>
        <main>
            <el-form v-if="commentData===null" ref="commentForm" size="small" :model="formData" :rules="formRules" label-position="top">
                <el-form-item prop="comment" label="请输入批注内容">
                    <el-input type="textarea" :rows="3" v-model="formData.comment" placeholder="请输入批注内容..." />
                </el-form-item>
                <el-form-item>
                    <el-button size="small" type="primary" @click.stop.prevent="sbumitForm(true)">提交</el-button>
                    <el-button size="small" @click.stop.prevent="sbumitForm(false)">取消</el-button>
                </el-form-item>
            </el-form>
            <div v-else class="list-comment">
                <div v-for="(item, idx) in commentData" :key="idx">
                    <div class="head-title">
                        <comment-item :data="item" @change="handleCommand($event, item)" />
                    </div>
                    <div class="reply-form" v-if="item.formReply">
                        <el-form ref="commentForm" size="mini" :model="formData" :rules="formRules" label-position="top">
                            <el-form-item prop="comment">
                                <el-input type="textarea" :rows="3" v-model="formData.comment" clearable placeholder="请输入回复内容..."  />
                            </el-form-item>
                            <el-form-item>
                                <el-button size="mini" type="primary" @click.stop.prevent="submitReply(true)">提交回复</el-button>
                                <el-button size="mini" @click.stop.prevent="submitReply(false)">取消</el-button>
                            </el-form-item>
                        </el-form>
                    </div>
                    <div class="replys" v-if="item.replys && item.replys.length">
                        <div v-for="(reply, i) in item.replys" :key="i">
                            <comment-item :data="reply" isReply @change="handleCommand($event, reply, true)" />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script>
    import commentItem from './commentItem';
    // 全局方法
    import $samGlobal from '@/utils/global';
    export default {
        name: 'timymce-comment',
        components: {
            commentItem
        },
        props: {
            data: [Object,Array],
            author: {
                type: Object,
                default:() => {
                    return {
                        userId:'',
                        userName: 'sam.shen',
                        commit: ''
                    }
                }
            }
        },
        watch: {
            data: {
                handler(data) {
                    this.commentData = _.cloneDeep(data);
                },
                deep: true,
                immediate: true
            },

        },
        data() {
            return {
                commentData: null,
                formData: {
                    comment: ''
                },
                formRules: {
                    comment: [{ required:true, message:'请输入内容', trigger:'blur' }]
                },
                currItme: null,
                replyComment: ''
            }
        },
        methods: {
            /**
             * @description 下拉菜单事件
             * @param {String} cmd 
             * @param {Object} item 
             * @param {Boolean} isReply
             */
            handleCommand(cmd, item, isReply=false) {
                var index = _.findIndex(this.commentData, { id:item.id });
                switch (cmd) {
                    case "delete":
                        this.$confirm('确定删除?', '提示', {
                            confirmButtonText: '确定',
                            cancelButtonText: '取消',
                            type: 'warning'
                        }).then(() => {
                            this.$emit('change', { act:'comment', data: item, removed:true });
                            this.commentData.splice(index, 1);
                        }).catch(() => { });
                        return false;
                    case "edit":
                        item.edit = true;
                        break;
                    case "submitEdit":
                        delete item.edit;
                        break;
                    case "reply":
                        item.formReply = true;
                        break;
                }
                this.$set(this.commentData, index, { ...item });
                this.currItem = { ...item };
                this.resetItem();
                this.$emit('change', { act:'comment', data: this.currItem });
            },
            
            /**
             * @description 清空表单
             */
            clearFormData(flag=true) {
                this.$refs['commentForm'] .resetFields();
                // this.commentData = null;
            },
            /**
             * @description 提交批注
             * @param {Boolean} flag 是否提交
             */
            sbumitForm(flag=true) {
                if (flag) {
                    this.$refs['commentForm'].validate( valid => {
                        if (valid) {
                            var formData = {
                                id: $samGlobal.guid(),
                                author: this.author.userName || 'anonymous',
                                date: $samGlobal.formatDateTime('yyyy-MM-dd hh:mm:ss', new Date()),
                                text: this.formData.comment
                            }
                            this.commentData = [formData];
                            this.clearFormData();
                            this.$emit('change', { act:'comment', data: formData });
                        }
                    })
                } else {
                    this.clearFormData();
                    this.$emit('change', { act: 'close' });
                }
            },
            /**
             * @description 提交回复
             * @param {Boolean} flag 是否提交
             */
            submitReply(flag=true) {
                if (flag) {
                    this.$refs['commentForm'][0].validate( valid => {
                        if (valid) {
                            var replyList = this.currItem.reply || [];
                            replyList.push({
                                id: $samGlobal.guid(),
                                author: this.author || 'anonymous',
                                text: this.formData.comment,
                                date: $samGlobal.formatDateTime('yyyy-MM-dd hh:mm:ss', new Date()) //this.$moment().format('YYYY-MM-DD hh:mm:ss')
                            });
                            this.$set(this.currItem, 'replys', [...replyList]);
                            delete this.currItem.formReply;
                            this.$emit('change', { act:'comment', data: this.currItem });
                            this.resetItem();
                        }
                    })
                } else {
                    this.resetItem();
                }
            },
            /**
             * @description 重置批注数据
             */
            resetItem() {
                var index = _.findIndex(this.commentData, { id:this.currItem.id });
                delete this.currItem.formReply;
                this.$set(this.commentData, index, { ...this.currItem });
                this.formData.comment = "";

            }
        }
    }
</script>

<style lang="scss" scoped>
    .quote-comment-container{
        height: 100%;
        >header{
            display: flex;
            padding: 10px;
            height: 40px;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #DDD;
        }
        >main {
            padding: 15px;
            .list-comment{
                >div{
                    border: 1px solid #DDD;
                    padding: 15px;
                    box-shadow: 2px 2px 2px 0 rgba(0,0,0,.1);
                    .replys{
                        padding-left: 15px;
                        >div {
                            width: 100%;
                        }
                    }
                }

            }
        }
    }
</style>
