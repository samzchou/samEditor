<template>
    <div class="doc-editor-cmp">
        <div class="pdf-container">
            pdf-container
        </div>
        <div class="editor-container">
            {{data}}
        </div>
    </div>

</template>

<script>

    export default{
        name: 'doc-editor-cmp',
        props: {
            data: {
                type: Object,
                default: () => {
                    return {};
                }
            }
        }
    }

</script>

<style lang="scss" scoped>
    .doc-editor-cmp{
        height: 100%;
        display: flex;
        >div {
            flex:1;
        }
    }
</style>
