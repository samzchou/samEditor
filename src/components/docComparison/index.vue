<template>
    <section class="doc-comparison-container">
        <component v-if="cmp" ref="mycmp" :is="cmp" :data="data" v-on="$listeners" />
    </section>
</template>

<script>
    import * as comps from './cmp';
    import $global from '@/utils/global.js';

    export default {
        name: 'doc-comparison',
        props: {
            data: {
                type: Object,
                default: () => {
                    return {}
                }
            }
        },
        computed: {
            cmp() {
                switch(this.data.type) {
                    case 'doc':         // 全文
                    case 'info':        // 题录比对
                        return comps['infoComparise'];
                    case 'chapter':     // 章节比对
                        return comps['chapterComparise'];
                    case 'outline':     // 章节条款比对
                        return comps['outlineComparise'];
                }
                return null;
            }
        },
        watch: {
            data: {
                handler(data) {
                    // console.log(data)
                    if (!_.isEmpty(data) && !$global.compare(data, this.itemData)) {
                        this.itemData = _.cloneDeep(data);
                    }
                },
                immediate: true,
                deep: true
            }
        },
        data() {
            return {
                itemData: null,
            }
        }
    }
</script>

<style lang="scss" scoped>
    .doc-comparison-container{
        height: 100%;
    }
</style>
