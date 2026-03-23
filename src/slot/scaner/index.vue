<template>
    <div class="scan-img">
        <div class="box">
            <div class="line"></div>
            <div class="angle"></div>
        </div>
        <div class="desc" v-html="text"></div>
    </div>
</template>

<script>
    export default{
        name: 'scaner',
        props: {
            text: String
        }
    }
</script>

<style lang="scss" scoped>
    .scan-img {
        background-image:
            linear-gradient(0deg,
            transparent 24%,
            rgba(32, 255, 77, 0.1) 25%,
            rgba(32, 255, 77, 0.1) 26%,
            transparent 27%,
            transparent 74%,
            rgba(32, 255, 77, 0.1) 75%,
            rgba(32, 255, 77, 0.1) 76%,
            transparent 77%,
            transparent),
            linear-gradient(90deg,
            transparent 24%,
            rgba(32, 255, 77, 0.1) 25%,
            rgba(32, 255, 77, 0.1) 26%,
            transparent 27%,
            transparent 74%,
            rgba(32, 255, 77, 0.1) 75%,
            rgba(32, 255, 77, 0.1) 76%,
            transparent 77%,
            transparent);
        background-size: 3rem 3rem;
        background-position: -3rem -3rem;
        width: 100%;
        height: 100%;
        position: relative;
        background-color: #546c69;
        .desc{
            position: absolute;
            height: 100%;
            width: 100%;
            top: calc(50% - 15px);
            left:0;
            text-align: center;
            color: rgba(255,255,255,.6);
            font-size: smaller;
        }
        .box {
            width: 100%;
            height: 100%;
            overflow: hidden;
            border: 1px solid rgba(0, 255, 51, 0.2);
            &:before,&:after{
                content: '';
                display: block;
                position: absolute;
                top: 0;
                width: 10px;
                height: 10px;
                border: 2px solid transparent;
                border-top-color: #00ff33;
            }
            &:before{
                left: 0;
                border-left-color: #00ff33;
            }
            &:after{
                right: 0;
                border-right-color: #00ff33;
            }
        }
        .line {
            height: calc(100% - 1px);
            width: 100%;
            background: linear-gradient(180deg, rgba(0, 255, 51, 0) 43%, #00ff33 211%);
            border-bottom: 1px solid #00ff33;
            transform: translateY(-100%);
            animation: radar-beam 2s infinite;
            animation-timing-function: cubic-bezier(0.53, 0, 0.43, 0.99);
            animation-delay: 1.4s;
        }
        .angle{
            &:before,&:after{
                content: '';
                display: block;
                position: absolute;
                width: 10px;
                height: 10px;
                bottom: 0;
                border: 2px solid transparent;
                border-bottom-color: #00ff33;
            }
            &:before{
                left: 0;
                border-left-color: #00ff33;
            }
            &:after{
                right: 0;
                border-right-color: #00ff33;
            }
        }
        @keyframes radar-beam {
            0% {
                transform: translateY(-100%);
            }

            100% {
                transform: translateY(0);
            }
        }
    }


</style>
