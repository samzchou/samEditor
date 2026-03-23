<template>
    <div class="quote-comment-container">

        <div class="lists" v-if="commentData.length">
            <ul>
                <li v-for="(item, idx) in commentData" :key="idx">
                    <svg>
                        <path fill="#b56262" :d="vatar"></path>
                    </svg>
                    <div class="desc">
                        <div class="header">
                            <div class="author">{{item.author||'anonymous'}}</div>
                            <div>
                                <div>{{item.date}}</div>
                                <el-divider direction="vertical" />
                                <div class="btns">
                                    <!-- v-if="item.author === author.userName" -->
                                    <el-button size="mini" type="text" v-if="item.author===author.userName" :disabled="item.edit" @click.stop.prevent="editComment(item)">编辑</el-button>
                                    <el-button size="mini" type="text" :disabled="item.edit" @click.stop.prevent="addReply(item)">回复</el-button>
                                    <el-button size="mini" type="text" @click.stop.prevent="removeComment(item)">删除</el-button>
                                </div>
                            </div>
                        </div>
                        <div class="content">
                            <p v-if="!item.edit">{{item.comment}}</p>
                            <template v-else>
                                <el-input size="mini" type="textarea" :row="3" v-model="item.comment" placeholder="请输入批注内容..." />
                                <el-button size="mini" type="primary" style="margin-top:5px" @click.stop.prevent="submitComment(item)">确定</el-button>
                            </template>
                        </div>
                        <!-- 回复 #98b2e7 -->
                        <div class="replys">
                            <ul>
                                <li v-for="(reply, i) in item.replys" :key="i">
                                    <svg>
                                        <path fill="#98b2e7" :d="vatar"></path>
                                    </svg>
                                    <div class="desc">
                                        <div class="header">
                                            <div class="author">{{reply.author||'anonymous'}}</div>
                                            <div>
                                                <div>{{reply.date}}</div>
                                                <el-divider direction="vertical" />
                                                <div class="btns">
                                                    <el-button size="mini" type="text" :disabled="reply.edit" @click.stop.prevent="editReply(item, reply)">编辑</el-button>
                                                    <el-button size="mini" type="text" @click.stop.prevent="removeReply(item, reply)">删除</el-button>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="content">
                                            <p v-if="!reply.edit">{{reply.comment}}</p>
                                            <template v-else>
                                                <el-input size="mini" type="textarea" :row="3" v-model="replyStr" placeholder="请输入回复内容..." />
                                                <el-button size="mini" type="primary" style="margin-top:5px" @click.stop.prevent="submitReply(item, reply)">确定</el-button>
                                            </template>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>

                    </div>
                </li>
            </ul>
        </div>

        <div v-else>
            <p>
                <el-button size="mini" type="primary" icon="el-icon-plus" @click.stop.prevent="addComment">新增批注</el-button>
            </p>
        </div>
    </div>
</template>

<script>
    // 全局方法
    import $samGlobal from '@/utils/global';
    export default {
        name: 'quote-comment',
        props: {
            data: Object,
            author: {
                type: Object,
                default: () => {
                    return {
                        userId: '',
                        userName: 'anonymous',
                        commitId: '',
                    }
                }
            }
        },
        watch: {
            data: {
                handler(data) {
                    if(!_.isEmpty(data.content)) {
                        this.commentData = _.cloneDeep(data.content);
                    }
                },
                deep: true,
                immediate: true
            }
        },
        data() {
            return {
                commentData: [],
                formData: {
                    comment: ''
                },
                replyStr: '',
                formRules: {
                    comment: [{ required:true, message:'请输入批注内容', trigger:'blur' }]
                },
                vatar:'M12 24C5.373 24 0 18.627 0 12S5.373 0 12 0s12 5.373 12 12-5.373 12-12 12zm-8.693-5.259A10.981 10.981 0 0 0 12 23c3.535 0 6.68-1.668 8.693-4.259C19.432 16.251 14.591 15 12 15c-2.59 0-7.432 1.25-8.693 3.741zm8.7-5.741C14.224 13 16 10.99 16 8.5S14.224 4 12.007 4C9.79 4 8 6.01 8 8.5S9.79 13 12.007 13z',
            }
        },
        methods: {
            getValue() {
                return this.commentData.map(item => {
                    delete item.edit;
                    if (item.replys) {
                        item.replys = item.replys.map(reply => {
                            delete reply.edit;
                            return reply;
                        })
                    }
                    return item;
                });
            },

            // 回复批注
            addReply(item={}) {
                if (!item.replys) {
                    item.replys = [];
                }
                item.replys.push({
                    id: $samGlobal.guid(),
                    author: this.author.userName,
                    date: $samGlobal.formatDateTime("yyyy-MM-dd hh:mm:ss", new Date()),
                    comment: '',
                    edit: true
                });
                this.updateCommentItem(item);
            },
            // 更新批注
            updateCommentItem(item={}) {
                var index = _.findIndex(this.commentData, { id:item.id });
                this.$set(this.commentData, index, item);
            },
            editReply(item={}, reply={}) {
                reply.edit = true;
                var index = _.findIndex(item.replys, { id:reply.id });
                this.$set(item.replys, index, reply);
                this.replyStr = reply.comment;
                this.updateCommentItem(item);
            },
            // 删除回复
            removeReply(item={}, reply={}) {
                this.$confirm('确定删除改回复?', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    var index = _.findIndex(item.replys, { id:reply.id });
                    item.replys.splice(index, 1);
                    // 更新批注
                    this.updateCommentItem(item);
                    this.replyStr = "";
                }).catch(() => { });
            },
            // 提交批注
            submitReply(item={}, reply={}) {
                reply.comment = this.replyStr;
                delete reply.edit;
                var index = _.findIndex(item.replys, { id:reply.id });
                this.$set(item.replys, index, reply);
                // 更新批注
                this.updateCommentItem(item);
                this.replyStr = "";
            },

            // 删除批注
            removeComment(item={}) {
                this.$confirm('确定删除改批注?', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    var index = _.findIndex(this.commentData, { id:item.id });
                    this.commentData.splice(index, 1);
                }).catch(() => { });
            },
            // 编辑批注
            editComment(item={}) {
                item.edit = true;
                // 更新批注
                this.updateCommentItem(item);
            },
            submitComment(item={}) {
                delete item.edit;
                // 更新批注
                this.updateCommentItem(item);
            },

            addComment() {
                this.commentData.push({
                    id: $samGlobal.guid(),
                    author: this.author.userName,
                    date: $samGlobal.formatDateTime("yyyy-MM-dd hh:mm:ss", new Date()),
                    comment: '',
                    edit: true
                })
            },

            // 提交数据
            sbumitForm(flag=true) {
                if (flag) {
                    this.$refs['commentForm'].validate( valid => {
                        if (valid) {
                            this.$set(this.formData, 'id', $samGlobal.guid());
                            this.$set(this.formData, 'date', $samGlobal.formatDateTime('yyyy-MM-dd hh:mm:ss', new Date()));
                            this.$set(this.formData, 'author', this.author.userName);
                            this.$emit('change', this.formData);
                        }
                    })
                }
            }
        }
    }
</script>

<style lang="scss" scoped>
    .quote-comment-container{
        height: 100%;
        padding: 15px;
        .lists{
            ul {
                list-style-type: none;
                padding: 0;
                margin: 0;
                >li {
                    font-size: 12px;
                    display: flex;
                    margin-bottom: 15px;
                    >svg{
                        width: 35px;
                        height: 24px;
                    }
                    .desc{
                        flex: 1;
                        .content{
                            padding-bottom: 10px;
                        }
                        .replys {
                            border-left: 1px solid #DDD;
                            padding-left: 10px;
                        }
                    }

                    .header {
                        display: flex;
                        justify-content: space-between;
                        flex: 1;
                        >div{
                            display: flex;
                            align-items: center;
                            &.author{
                                font-weight: bold;
                                font-size: 14px;
                            }
                            .btns{
                                ::v-deep .el-button{
                                    padding: 0;
                                }
                            }
                        }
                    }
                }
            }
        }

    }
</style>
