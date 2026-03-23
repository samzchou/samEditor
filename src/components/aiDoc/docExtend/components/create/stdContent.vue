<template>
    <div class="std-create-content">
        <p style="padding:20px;color: #CCC;">模板库即将开放</p>

        <!--
        <div class="forms">
            <el-input size="mini" v-model="searchKey" prefix-icon="iconfont icon-ziyuan" placeholder="关键字查询">
                <el-button slot="append" icon="el-icon-search"></el-button>
            </el-input>
        </div>
        <div class="std-statistics">
            <template v-for="(item, idx) in statisticsEnu">
                <div class="lists" :key="idx">
                    <div class="label">{{ item.label }}</div>
                    <div class="lis">
                        <template v-for="(child, index) in item.children">
                            <span v-if="index<6" :class="{'active':child.checked}" :key="index" @click.stop.prevent="queryByStatistics(item, child)">{{ child.label }}</span>
                        </template>
                        <el-link slot="reference" type="warning" icon="el-icon-more" @click.stop.prevent="toggleMore(item)">更多</el-link>
                        <div class="more-list" :class="{'show':item.showMore}">
                            <div class="poper-list">
                                <span v-for="(child, index) in item.children" :class="{'active':child.checked}" :key="index" @click.stop.prevent="queryByStatistics(item, child)">{{ child.label }}</span>
                            </div>
                            <el-button class="col-btns" size="mini" icon="el-icon-arrow-up" circle @click.stop.prevent="toggleMore(item)"></el-button>
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <div class="model-lists">
            <ul>
                <li>
                    <div class="cover-img" />
                    <div class="content">
                        <div class="title">
                            <p>JJF 2099-2024</p>
                            <p>光学接触角测量仪校准规范</p>
                        </div>
                    </div>
                </li>
                <li>
                    <div class="cover-img" />
                    <div class="content">
                        <div class="title">
                            <p>JJF 2099-2024</p>
                            <p>光学接触角测量仪校准规范</p>
                            <p>更新：2024-03-17</p>
                            <p>润申标准化信息技术（上海）有限公司</p>
                        </div>
                        <div class="s-btn">
                            <div class="icon">
                                <span class="iconfont icon-bianji">使用</span>
                                <span class="iconfont icon-wenjian">收藏</span>
                                <span class="iconfont icon-interactive">建议</span>
                            </div>
                            <div>
                                <span class="hot">24K+</span>
                            </div>
                        </div>
                    </div>
                </li>
            </ul>
        </div>
        
        <div class="pages">
            <el-pagination small background layout="prev, pager, next" :total="1000" />
        </div>
        -->
    </div>
</template>

<script>
    // import $global from '@/utils/global';
    // 标准内容分类
    // import { statisticsEnu } from '../../config/editorConfig.js';

    export default {
        name: 'std-create-content',
        /*
        data() {
            return {
                statisticsEnu: [...statisticsEnu],
                searchKey: '',
                formData: {
                    content: '',
                    fileId: '',
                },
            }
        },
        methods: {
            toggleMore(enuItem) {
                enuItem.showMore = !enuItem.showMore;
                let index = _.findIndex(this.statisticsEnu, {key:enuItem.key});
                this.$set(this.statisticsEnu, index, enuItem);
            },
            queryByStatistics(enuItem, currNode) {
                for (let item of enuItem.children) {
                    delete item.checked;
                    if (item === currNode) {
                        item.checked = true;
                    }
                }
                let index = _.findIndex(this.statisticsEnu, {key:enuItem.key});
                this.$set(this.statisticsEnu, index, enuItem);
            },
            // 拦截默认上传
            httpRequest() {
                return false;
            },

            async handleBeforeUpload(file) {
                console.log("handleBeforeUpload", file)
                // debugger
                // var fileSize = Math.round(file.size/1024);
                // if (this.data.maxSize && fileSize > this.data.maxSize) {
                //     this.$message.error('文件大小:' + fileSize + 'KB，大于设定值：' + this.data.maxSize+'KB，上传终止！');
                //     return false;
                // }
                // const formData = new FormData();
                // formData.append("file", file);
                // formData.append("filename", file.name);

                // this.submitUpload(formData, true); 
            },
        }
            */
    }
</script>

<style lang="scss" scoped>
    .std-create-content{
        // padding:20px;
        height: 100%;
        .forms{
            padding: 15px 15px 5px 15px;
        }
        .std-statistics{
            padding:0 15px;
            .lists{
                padding: 10px 0;
                border-bottom: 1px solid #EEE;
                display: flex;
                // justify-content: space-between;
                .label{
                    font-weight: bold;
                    margin-right: 10px;
                    white-space: nowrap;
                    font-size: 13px;
                }
                .lis{
                    // display: inline-flex;
                    // align-items: center;
                    position: relative;
                    flex:1;
                    >span{
                        margin-right: 10px;
                        cursor: pointer;
                        &:last-child{
                            margin:0;
                        }
                        &:before{
                            font-family: "iconfont" !important;
                            content: "\e68d";
                            margin-right: 2px;
                            color: #CCC;
                        }
                        &.active{
                            color: #67C23A;
                            &:before{
                                content: "\e61f";
                                color: #67C23A;
                            }
                        }
                    }
                    ::v-deep .el-link{
                        font-size: 12px;
                        float: right;
                    }

                    .more-list{
                        position: absolute;
                        z-index:10;
                        background-color: #FFF;
                        border: 1px solid #EEE;
                        left: 0;
                        top: 0;
                        display: none;
                        ::v-deep .el-button{
                            position: absolute;
                            left: calc(50% - 14px);
                            bottom: 18px;
                            bottom: -14px;
                            padding: 5px;
                            box-shadow: 0 3px 3px 0 rgba(0,0,0,.08);
                        }
                        &.show{
                            display: block;
                        }

                        .poper-list{
                            padding: 15px 10px;
                            box-shadow: 1px 1px 9px 3px rgba(0,0,0,.08);
                            >span{
                                margin-right: 10px;
                                cursor: pointer;
                                &:last-child{
                                    margin:0;
                                }
                                &:before{
                                    font-family: "iconfont" !important;
                                    content: "\e68d";
                                    margin-right: 2px;
                                    color: #CCC;
                                }
                                &.active{
                                    color: #67C23A;
                                    &:before{
                                        content: "\e61f";
                                        color: #67C23A;
                                    }
                                }
                            }
                        }
                    }
                }

            }
        }

        .model-lists{
            // padding: 15px 0;
            height: calc(100% - 170px);
            overflow: hidden;
            >ul{
                // display: grid;
                // grid-template-columns: repeat(2,1fr);
                // grid-gap:15px;
                padding: 15px;
                >li{
                    display: flex;
                    margin: 15px 0;
                    border: 1px solid #EEE;
                    background-color: #FFF;
                    &:hover{
                        box-shadow: 3px 3px 3px 0 rgba(0,0,0,.08);
                    }
                    .cover-img{
                        width: 100px;
                        height: 140px;
                        background-image: url('~@assets/images/cover/GB.png');
                        background-repeat: no-repeat;
                        background-position: center;
                        background-size: contain;
                        border:1px solid #EEE;
                        margin-right: 10px;
                    }
                    .content{
                        display: flex;
                        flex-direction: column;
                        flex: 1;
                        padding: 5px 15px 10px 0;
                        .title{
                            flex:1;
                            line-height: 1.5;
                        }
                        .s-btn{
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            .icon{
                                >span{
                                    font-size: 13px;
                                    cursor: pointer;
                                    color:#55aaff;
                                    margin-right: 8px;
                                }
                            }
                            .hot{
                                background-image: url('~@assets/images/hot.png');
                                padding-left: 18px;
                                background-position: left center;
                                background-size: contain;
                                background-repeat: no-repeat;
                            }
                        }
                    }
                }
            }
        }
        .pages{
            padding: 10px;
            border-top: 1px solid rgba(0,0,0,.08);
            text-align: center;
        }
    }


</style>

