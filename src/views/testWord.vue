<template>
    <div class="word-container">
        <div>1</div>
        <div>2</div>
    </div>
</template>

<script>
</script>

<style lang="scss" scoped>
    .word-container{
        height: 400px; /* 容器高度 */
        max-width: 600px; /* 最大宽度 */
        column-fill: balance;
        column-count: 2;
        column-gap: 20px;
        >div{
            border: 1px solid #DDD;
            height: 200px
        }
    }
</style>
