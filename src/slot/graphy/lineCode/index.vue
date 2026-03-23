<template>
    <div class="linecode-container">
        <div id="line-content" :style="lineStyle">
            <p v-if="!dataList.length" style="color: #999">绘图区域...</p>
            <template v-else v-for="(item, idx) in dataList">
                <top-magic class="list" ref="mmt" :style="setPosition(idx)" :key="idx" :isEdit="isEdit" :data="item" @change="changePosition(idx, $event)" @finished="rendered(idx)" />
            </template>
        </div>
        <div style="padding-top: 20px">
            <fieldset>
                <legend>参数配置</legend>
                <el-form size="mini" :model="initParams" label-position="top">
                    <el-form-item label="单元总数(最大10)" prop="total">
                        <el-input-number v-model="initParams.total" :min="1" :max="10" controls-position="right" :disabled="completed" />
                    </el-form-item>
                    <el-form-item label="间隔单元宽度" prop="width">
                        <el-input-number v-model="initParams.width" :min="30" :max="50" controls-position="right" :disabled="completed" />
                    </el-form-item>
                    <el-form-item label="间隔单元高度" prop="height">
                        <el-input-number v-model="initParams.height" :min="30" :max="30" controls-position="right" :disabled="completed" />
                    </el-form-item>
                    <el-form-item label="间隔单元边距" prop="gap">
                        <el-input-number v-model="initParams.gap" :min="10" :max="12" controls-position="right" :disabled="completed" />
                    </el-form-item>
                    <el-form-item style="padding-top: 25px; grid-column: span 2">
                        <el-button-group>
                            <el-button round type="primary" size="mini" title="创建折线" icon="el-icon-document-checked" @click="createLine">创建</el-button>
                            <el-button round type="primary" size="mini" title="清空重置" @click="clearAll" icon="el-icon-refresh" :disabled="!dataList.length">重置</el-button>
                        </el-button-group>
                    </el-form-item>
                </el-form>
            </fieldset>
        </div>
        <!--
        <div class="btns" v-if="!isFrame">
            <el-button size="small" type="cyan" icon="fa fa-save" @click.stop.prevent="saveData" :disabled="!dataList.length" :loading="loading">保存</el-button>
            <el-button size="small" icon="fa fa-close" @click.stop.prevent="$emit('close')" :disabled="loading">退出关闭</el-button>
        </div>
        -->
    </div>
</template>

<script>
    /**
     * 折线图组件
     *
     */
    import topMagic from "./topMagic";
    import html2canvas from "html2canvas";
    export default {
        name: "line-code",
        components: {
            topMagic,
        },
        props: {
            data: Object,
            isFrame: Boolean,
        },
        watch: {
            data: {
                handler(data) {
                    this.clearAll();
                    this.dataList = [];
                    if (!_.isEmpty(data) && data.list) {
                        this.dataList = _.cloneDeep(data.list);
                    }
                },
                deep: true,
                immediate: true,
            },
        },
        computed: {
            lineStyle() {
                return {
                    width: this.dataList.length ? `${this.dataList.length * this.initParams.width}px` : "200px",
                    height: `${this.dataList.length * this.initParams.height + 20}px`,
                };
            },
            getLabelMaxWidth() {
                let max = 0;
                for (let i = 0; i < this.dataList.length; i++) {
                    let item = this.dataList[i];
                    if (item.labelWidth > max) {
                        max = item.labelWidth;
                    }
                }
                return max;
            },
        },
        data() {
            return {
                imgUrl: "",
                loading: false,
                dataList: [],
                initParams: {
                    total: 5,
                    width: 50,
                    height: 30,
                    gap: 10,
                },
                isEdit: true,
                completed: false,
                codeData: {
                    img: "",
                    data: {},
                },
            };
        },
        methods: {
            clearAll() {
                this.completed = false;
                this.dataList = [];
                this.imgUrl = "";
            },
            saveData() {
                /* this.createImage(res => {
                    this.codeData.img = res;
                    this.codeData.data = [...this.dataList];
                    this.$emit('change', { ...this.codeData });
                }) */
            },
            getObjXy(obj, win) {
                if (win) {
                    document = win.document;
                }
                let xy = obj.getBoundingClientRect();
                let top =
                    xy.top -
                    document.documentElement.clientTop +
                    document.documentElement.scrollTop,
                    bottom = xy.bottom,
                    left =
                    xy.left -
                    document.documentElement.clientLeft +
                    document.documentElement.scrollLeft,
                    right = xy.right,
                    width = xy.width || right - left,
                    height = xy.height || bottom - top;
                return {
                    top: top,
                    right: right,
                    bottom: bottom,
                    left: left,
                    width: width,
                    height: height,
                };
            },
            async createImage(callBack) {
                var lineTextSpans = document.querySelectorAll("#line-content .bottom>span");
                var startLeft = this.getObjXy(document.querySelector("#line-content")).left;

                var maxWidth = 0, left = 0;
                lineTextSpans.forEach((spanNode, index) => {
                    // console.log(spanNode);
                    this.dataList[index].label = spanNode.textContent || "";
                    let width = spanNode.offsetWidth;
                    if (width > maxWidth) {
                        maxWidth = width;
                        left = this.getObjXy(spanNode).left;
                    }
                });

                var width = parseInt(left + maxWidth) - startLeft; //this.initParams.width * this.initParams.total + this.getLabelMaxWidth + 10;

                this.loading = true;
                var shareContent = document.querySelector("#line-content");
                var opts = {
                    backgroundColor: null,
                    logging: true,
                    width,
                    height: this.dataList.length * 30 + 40,
                    userCORS: true,
                    dpi: 300,
                };

                return new Promise((resolve, reject) => {
                    html2canvas(shareContent, opts).then((canvas) => {
                        let dataURL = canvas.toDataURL("image/png");
                        this.imgUrl = dataURL;
                        this.loading = false;
                        // console.log("dataList是", JSON.stringify(this.dataList));
                        resolve({ img: dataURL, data: this.dataList });
                    });
                });
            },

            rendered(i) {
                if (i === this.dataList.length - 1) {
                    setTimeout(() => {
                        this.completed = true;
                    }, 500);
                }
            },
            // 创建图形
            createLine() {
                let gH = this.initParams.height * this.initParams.total;
                let gW = this.initParams.width * this.initParams.total;
                this.dataList = [];
                for (let i = 0; i < this.initParams.total; i++) {
                    this.dataList.push({
                        code: "XX",
                        label: "输入名称",
                        codeWidth: 18,
                        labelWidth: 80,
                        left: i * (18 + this.initParams.gap),
                        width: gW - (18 + this.initParams.gap) * i,
                        height: gH - (18 + this.initParams.gap) * i,
                    });
                }
                /* setTimeout(() => {
					this.saveData();
				}, 300) */
            },
            // 单元定位 data.width: 实际固定宽
            setPosition(index) {
                let data = this.dataList[index];
                // console.log('setPosition==>', data);
                return {
                    left: data.left ? `${data.left}px` : "0px",
                    top: "0px",
                    width: `${data.width}px`,
                    height: `${data.height}px`,
                };
            },
            changePosition(index, data) {
                // console.log('getLabelMaxWidth',this.getLabelMaxWidth);
                if (this.completed) {
                    let currData = this.dataList[index];
                    let subWidth = currData.codeWidth - data.codeWidth;
                    currData = _.merge(currData, data);
                    currData.width += subWidth / 2;
                    this.changeNext(index + 1, subWidth, subWidth > 0);
                }
            },
            changeNext(index, distance, isPlus) {
                if (this.dataList[index]) {
                    let currData = this.dataList[index];
                    currData.left -= distance;
                    currData.width += distance;
                    this.changeNext(index + 1, distance);
                }
            },
        },
    };
</script>

<style lang="scss" scoped>
    .linecode-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 20px;
        #line-content {
            min-height: 200px;
            position: relative;
            flex: 1;
            font-family: simSun;
            ::v-deep .list {
                position: absolute;
                top: 0;
            }
        }
        fieldset {
            border: 1px solid #ddd;
            ::v-deep .el-form {
                display: grid;
                gap: 10px;
                grid-template-columns: repeat(6, 16.66666%);
                padding-right: 20px;
                .el-form-item__content {
                    >* {
                        width: 100%;
                    }
                }
            }
        }
        .btns {
            flex: 0 0 45px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }
</style>
