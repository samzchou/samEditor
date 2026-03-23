<template>
    <div class="m-c" :style="setStyle">
        <div class="top" >
            <span :class="{'show':!isEdit}" :id="`top-${id}`">{{magicData.code||'请输入'}}</span>
            <el-input size="small" v-if="isEdit" v-model="magicData.code" @change="changeText" :style="{width: `${this.magicData.codeWidth}px`,padding:'3px 0'}" placeholder="请输入" />
        </div>
        <div class="bottom" :style="bottomStyle">
            <span contenteditable="true" spellcheck="false" @keydown="disableEnter" @blur="changeLabel">{{magicData.label}}</span>
        </div>
    </div>
</template>

<script>
    import { v4 } from 'uuid';
    export default {
        name: 'top-magic',
        props: {
            data: {
                type: Object,
                default:() => {
                    return {}
                }
            },
            isEdit: {
                type: Boolean,
                default: true
            }
        },
        watch: {
            data: {
                handler(data) {
                    if(!_.isEmpty(data)) {
                        this.magicData = _.cloneDeep(data);
                    //    console.log('this.magicData', this.magicData)
                    }
                },
                deep: true,
                immediate: true
            },
        },
        computed: {
            setStyle() {
                return {
                    width: `${this.magicData.width}px`,
                    height: `${this.magicData.height}px`
                }
            },
            bottomStyle() {
                let codeWidth = Math.floor(this.magicData.codeWidth / 2);
                return {
                    left: `${codeWidth}px`
                }
            }
        },
        data() {
            return {
                id: v4(),
                magicData: {
                    code: 'XX',
                    label: '功能组代码',
                    width: 300,
                    height:150,
                    codeWidth:18,
                    labelWidth: 50
                }
            }
        },
        methods: {
            setTopWidth() {
                let width = document.querySelector(`#top-${this.id}`).offsetWidth;
                this.magicData.codeWidth = Math.ceil(width);
                this.changeData();
            },
            selectText(evt) {
                // console.log(evt.target)
                // evt.target.select();
            },
            changeText(key, evt) {
                this.setTopWidth();
            },
            disableEnter(evt) {
                if(evt.keyCode === 13){
                    this.changeLabel(evt);
                    evt.preventDefault();
                }
            },
            changeLabel(evt) {
                // console.log(evt.target);
				this.$set(this.magicData, 'label', evt.target.innerText);
				this.$set(this.magicData, 'labelWidth', evt.target.offsetWidth);
                // this.magicData.label = evt.target.innerText;
                // this.magicData.labelWidth = evt.target.offsetWidth;
                this.changeData();
            },
            changeData() {
				this.$emit('change', { ...this.magicData });
            }
        },
        mounted() {
            this.$nextTick(() => {
                this.$emit('finished');
            })
        }
    }
</script>

<style lang="scss" scoped>
    .m-c{
        position: relative;
        font-size: 14px;
        color: #000;
        .top{
            height: 100%;
            position: absolute;
            left:0;
            top:0;
            display: inline-block;
            &:after{
                position: absolute;
                left:calc(50% - 1px);
                top: 30px;
                content:"";
                width: 1px;
                bottom: -16px;
                background-color: #000;
            }
            >span{
                pointer-events: none;
                cursor: not-allowed;
                display: block;
                white-space: nowrap;
                outline: none;
                position: absolute;
                top: 0;
                left:0;
                visibility: hidden;
				font-family: simSun;
                &:focus{
                    background-color: #EAEAEA;
                }
                &.show{
                    visibility:visible;
                }
            }
            ::v-deep .el-input{
                padding: 3px 0;
                border:0;
                input{
                    outline: none;
                    color: #000;
                    border: 0;
                    text-align: center;
                    font-size: 14px;
					font-family: simSun;
                    background-color: transparent;
                    padding: 0;
                    border-radius: 0;
					font-family: simSun;
                }
            }
            >input{
                outline: none;
                border: 0;
                text-align: center;
                font-size: 14px;
                background-color: transparent;
            }
        }
        .bottom{
            position: absolute;
            left: 0;
            bottom: 0;
            width: 100%;
            min-width: 15px;
            &:after{
                content: "";
                height: 1px;
                background-color: #000;
                width: 100%;
                position: absolute;
                top: 15px;
                left: 0;
            }
            >span{
                white-space: nowrap;
                position: absolute;
                padding: 0 10px;
                top: 8px;
                display: block;
                height: 20px;
                left: 100%;
                outline: none;
				font-family: simSun;
                &:focus{
                    background-color: #EAEAEA;
                }
            }
        }
    }
</style>
