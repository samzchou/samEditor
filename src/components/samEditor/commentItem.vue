<template>
    <div class="comment-item-container">
        <header>
            <svg>
                <path d="M12 24C5.373 24 0 18.627 0 12S5.373 0 12 0s12 5.373 12 12-5.373 12-12 12zm-8.693-5.259A10.981 10.981 0 0 0 12 23c3.535 0 6.68-1.668 8.693-4.259C19.432 16.251 14.591 15 12 15c-2.59 0-7.432 1.25-8.693 3.741zm8.7-5.741C14.224 13 16 10.99 16 8.5S14.224 4 12.007 4C9.79 4 8 6.01 8 8.5S9.79 13 12.007 13z" fill="#888"></path>
            </svg>
            <div>
                <p class="author">{{data.author}}</p>
                <p class="date">[{{isReply?'回复':'批注'}}] {{data.date}}</p>
            </div>
            <div class="dropdown-menu">
                <el-dropdown trigger="click" @command="handleCommand">
                    <span>
                        <i class="el-icon-more" />
                    </span>
                    <el-dropdown-menu slot="dropdown">
                        <el-dropdown-item command="edit" v-if="!isReply" :disabled="!checkEdit">编辑</el-dropdown-item>
                        <el-dropdown-item command="reply" v-if="!isReply">回复</el-dropdown-item>
                        <el-dropdown-item command="delete" :disabled="!checkAuthor">删除</el-dropdown-item>
                    </el-dropdown-menu>
                </el-dropdown>
            </div>
        </header>
        <div class="editor" v-if="data.edit">
            <el-input size="mini" type="textarea" :rows="2" v-model="data.text" />
            <div class="btns">
                <el-button size="mini" type="primary" @click.stop.prevent="submitEdit(true)">提交</el-button>
                <el-button size="mini" @click.stop.prevent="submitEdit(false)">取消</el-button>
            </div>
        </div>
        <div class="comment" v-else>{{data.text}}</div>
    </div>
</template>

<script>
    // 全局方法
    import $samGlobal from '@/utils/global';
    export default {
        name: 'commentItem',
        props: {
            data: Object,
            isReply: Boolean
        },
        computed: {
            checkAuthor() {
                var cfg = $samGlobal.getTinymceConfig();
                if (cfg) {
                    return cfg.author === this.data.author;
                }
                return false;
            },
            checkEdit() {
                return this.checkAuthor && (!this.data.replys || !this.data.replys.length);
            }
        },
        methods: {
            handleCommand(cmd) {
                this.$emit('change', cmd);
            },
            submitEdit(flag) {
                console.log(this.data)
                this.$emit('change', 'submitEdit');
            }
        }
    }
</script>

<style lang="scss" scoped>
    .comment-item-container{
        width: 100%;
        >header{
            display: flex;
            align-items: center;
            position: relative;
            >svg{
                width: 35px;
                height: 24px;
            }
            p{
                text-align: left;
                color:#888;
                &.author{
                    font-weight: bold;
                    color:#333;
                }
            }
            .dropdown-menu{
                position: absolute;
                right: 5px;
                top: 5px;

            }
        }
        .editor {
            padding: 10px;
            border: 1px solid #DDD;
            .btns{
                margin-top: 10px;
            }
        }
        .comment{
            padding: 10px;
            border-bottom: 1px solid #f0f0f0;
            margin-bottom: 10px;
        }
    }
</style>
