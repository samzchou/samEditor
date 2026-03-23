<template>
    <div class="doc-ai-cmp">
        <aiConversation :options="options" v-on="$listeners" @change="changeEvent"/>
    </div>
</template>

<script>
    // import $global from '@/utils/global.js';
    import docMixin from '../config/docMixins.vue';
    // 会话组件
    import aiConversation from './aiConversation.vue';

    export default {
        name: "doc-ai",
        mixins: [docMixin],
        inject: ['aiOptions'],
        components: {
            aiConversation
        },
        data() {
            return {
                options: {
                    ...this.aiOptions,
                    title: "标准文档AI智能编写",
                    plugin: 'docEditor',

                }
            }
        },
        methods: {
            changeEvent(obj) {
                console.log('changeEvent 标准文档智能编写==>', obj);
            }
        },
        created() {

        },
        mounted() {

        },

        beforeDestroy() {

        }
    }
</script>

<style lang="scss" scoped>
    @import './docAi.scss';
</style>

<style>
    .ai-assistant{
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-gap: 20px;
        padding:10px;
    }
    .ai-assistant>div{
        padding: 5px 10px;
        border: 1px solid rgba(0, 0, 0, .08);
        text-align: center;
    }
    .ai-assistant>div>h3.title{
        font-size: 14px;
    }
</style>
