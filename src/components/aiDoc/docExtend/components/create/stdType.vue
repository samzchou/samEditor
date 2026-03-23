<template>
    <div class="std-create-type">
        <p style="padding:20px;color: #CCC;">模板库即将开放</p>

        <!-- <ul>
            <li v-for="(item, idx) in stdKinds.filter(o=>{ return !o.disabled; })" :key="idx" :class="{'active':currItem.type===item.type}" @click.stop.prevent="selectItem(item)">
                <img :src="getTmpImg(item.img)" :title="item.img" />
                <p>{{item.label}}</p>
                <span>创建</span>
            </li>
        </ul> -->
    </div>
</template>

<script>
    // import { stdKinds } from '../../config/editorConfig.js';
    // import { listContentTemplate } from '@/api/editor.js';

    export default {
        name: 'std-create-type',
        /*
        computed: {
            // 按标准类型
            modelLabel() {
                let modelType = _.find(this.types, { value:this.currType });
                return modelType ? modelType.label : '';
            }
        },
        data() {
            return {
                stdKinds,
                currItem: {
                    type: ''
                },
                currType: 'stdType',
            }
        },
        methods: {
            getTmpImg(imgSrc) {
                if (!isNaN(imgSrc)) {
                    let skind = _.find(this.stdKinds, { type: imgSrc });
                    imgSrc = skind.img;
                }
                return require(`@/assets/images/${imgSrc}`);
            },

            selectItem(item = {}) {
                var templateData = _.filter(this.templateList, { tmplType: item.type });
                if (templateData && templateData.length) {
                    templateData.forEach(d => {
                        if (item[d.tmplName]) {
                            item[d.tmplName] = d.content;
                        }
                    })
                }
                this.currItem = { ...item };
                console.log('this.currItem===>', this.currItem);
                if (!item.type) {
                    // 空白文档
                    // this.initDocument(item.docData);
                } else {
                    // 标准文档
                    // this.docVisible = true;
                }
            },
        }
            */
    }
</script>

<style lang="scss" scoped>
    .std-create-type{
        >ul{
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            padding: 8px;
            // grid-gap: 10px;
            >li{
                margin: 15px;
                background-color: #f5f5f5;
                border: 1px solid rgba(0, 0, 0, .15);
                position: relative;
                cursor: pointer;
                box-shadow: 6px 5px 0px 0 rgba(0, 0, 0, .2);
                transition: all .2s;
                opacity: 0.8;
                >*{
                    pointer-events: none;
                }
                >img{
                    // display: none;
                    width: 100%;
                    height: 160px;
                    // border: 1px solid rgba(0,0,0,.06);
                }
                >p{
                    clear: both;
                    font-size: 14px;
                    text-align: center;
                    line-height: 40px;
                    &.lf{
                        text-align: left;
                        line-height: 25px;
                    }
                }
                >span{
                    display: none;
                    position: absolute;
                    top: calc(50% - 40px);
                    left: calc(50% - 20px);
                    background-color: rgba(47, 119, 17, .7);
                    border-radius: 50%;
                    height: 40px;
                    width: 40px;
                    line-height: 40px;
                    text-align: center;
                    color: #FFF;
                    box-shadow: 0px 0px 5px 0 rgba(29, 99, 34, .6);
                }
                &:hover,&.active{
                    transform: scale(1.05);
                    opacity: 1;
                    >p{
                        color:green;
                        &::before{
                            content:"\e630";
                            font-family: "iconfont" !important;
                        }
                    }
                    >span,>div{
                        display: block;
                    }
                }
            }
        }
    }
</style>
