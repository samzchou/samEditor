<template>
    <div class="doc-knowledge-cmp">
        <p style="padding:20px;color: #CCC;">知识库即将开放</p>
        <!-- <aiConversation :options="options" v-on="$listeners"/> -->
    </div>
</template>

<script>
    //import aiConversation from './aiConversation.vue';

    export default {
        name: "doc-knowledge",
        inject: ['aiOptions'],
        /*
        components: {
            aiConversation
        },
        computed: {
            options() {
                return {
                    title: "标准知识库AI问答",
                    ...this.aiOptions
                }
            }
        }
            */
    }
</script>

<style lang="scss" scoped>
    .doc-knowledge-cmp{
        height: 100%;
    }
</style>
