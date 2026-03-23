<template>
    <div class="toolbars-list">
        <ul style="margin-left: .5em;">
            <li v-for="(item, idx) in shapeList" :key="idx" :title="item.label" draggable @dragstart="handleDragStart(item, $event)">
                <i v-if="item.icon" :class="item.icon" />
				<svg v-else viewBox="0 0 34 24" width="14" height="14">
					<path :d="item.path" />
				</svg>
            </li>
        </ul>
        <div>
            <template v-for="(item, idx) in btnList">
                <el-color-picker
                    class="button"
                    v-if="['stroke','bodyfill', 'textColor','borderColor'].includes(item.act)"
                    :key="`s-${idx}`"
                    :class="{ 'disabled': disabledEvent[item.disable] || false }"
                    :predefine="predefineColor"
                    v-model="currColor"
                    size="mini"
                    show-alpha
                    :style="{'background-position':`0 ${item.position}px`}" @change="(value) => { setColor(value, item.act); }" />
                <el-dropdown :key="`d-${idx}`" v-else-if="item.children" trigger="click" @command="handlerCommand">
                    <el-button size="mini" type="text" class="button" :class="{ 'disabled': disabledEvent[item.disable] || false }" :style="{'background-position':`0 ${item.position}px`}" />
                    <el-dropdown-menu slot="dropdown">
                        <el-dropdown-item v-for="(child, n) in item.children" :key="`${idx}-${n}`" :command="child" style="display: flex; align-items: center;">
                            {{child.label}}
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </el-dropdown>
                <el-link v-else
                    class="button"
                    :key="`l-${idx}`"
                    :underline="false"
                    :title="item.label"
                    :class="{ 'disabled': disabledEvent[item.disable] || false }"
                    :style="{'background-position':`0 ${item.position}px`}" @click.stop.prevent="handlerCommand(item, $event)">
                </el-link>
                <el-divider :key="`d-${idx}`" v-if="item.divider" direction="vertical" />
            </template>
        </div>
        <input type="file" name="data-file" id="data-file" v-show="false" accept=".json" @change="handleBeforeUpload" />
    </div>
</template>

<script>
    import { Graph, DataUri } from "@antv/x6";
    import $bus from "@/utils/bus";
    import { predefineColor, shapeList } from "../cfg.js";
    import { exportJSON, loadFile } from '@/utils/flowFun';
    export default {
        name: 'graph-toobar',
        props: {
            flowGraph: Object,
            default: () => {
                return Graph;
            }
        },
        data() {
            return {
                handlerIntevel: null,
                shapeList,
                disabledEvent: {
                    disUndo: true,
                    disRedo: true,
                    disPaste: true,
                    emptyNode: true,
                    emptyLine: true,
                    emptyData: true
                },
                btnList: [
                    {label:'撤销(Ctrl+Z)', act:'undo', position:-60, disable:'disUndo'},
                    {label:'重做(Ctrl+Y)', act:'redo', position:-40, disable:'disRedo', divider:true},
                    {label:'上移一层', act:'toFront', position:-100, disable:'emptyData'},
                    {label:'下移一层', act:'toBack', position:-120, disable:'emptyData', divider:true},
                    {label:'节点阴影切换', act:'shadow', position:-380, disable:'emptyNode'},
                    {label:'节点填色', act:'bodyfill', position:-440, disable:'emptyNode'},
                    {label:'节点边框色', act:'borderColor', position:-640, disable:'emptyNode'},
                    {label:'节点边框虚线切换', act:'dasharray', position:-540, disable:'emptyNode'},
                    {label:'节点文字字号', position:-580, disable:'emptyNode', children: [{label:'增大',act:'enlargeText'}, {label:'减小',act:'reduceText'}]},
                    {label:'文字色', act:'textColor', position:-600, disable:'emptyNode', divider:true},
                    {label:'线条色', act:'stroke', position:-460, disable:'emptyLine'},
                    {label:'线条样式', act:'strokeRouter', position:-620, disable:'emptyLine'},
                    {label:'线条箭头切换', act:'arrow', position:-560, disable:'emptyLine', divider:true},
                    {label:'清除画布', act:'clear', position:-200 },
                    {label:'导入数据', act:'import', position:-220},
                    {label:'导出图片', act:'exportImg', position:-260},
                    {label:'导出数据', act:'exportData', position:-240 },
                    // {label:'保存', position:-280, act:'save'},
                ],
                predefineColor,
                currColor: '',
            }
        },
        methods: {
            handleDragStart(item, evt) {
                evt.dataTransfer.setData("node", JSON.stringify(item));
            },
            /**
             * 改变颜色
             */
            setColor(value, act) {
                const { graph } = this.flowGraph;
                const selectCells = graph.getSelectedCells();
                if(act === 'bodyfill') {
                    selectCells.forEach(cell => {
                        cell.attr('body/fill', value);
                    })
                } else if (act === 'stroke') {
                    selectCells.forEach(cell => {
                        if(cell.isNode()) {
                            cell.attr('body/stroke', value);
                        } else {
                            cell.attr('line/stroke', value);
                        }
                    })
                } else if (act === 'textColor') {
                    selectCells.forEach(cell => {
                        cell.attr('text/fill', value);
                    })
                } else if (act === 'borderColor') {
                    selectCells.forEach(cell => {
                        cell.attr('body/stroke', value);
                    })
                }
            },
            handlerCommand(obj, evt) {
                const { graph } = this.flowGraph;
                const cells = graph.getSelectedCells();
                switch (obj.act) {
                    case 'undo':
                        graph.undo();
                        break;
                    case 'redo':
                        graph.redo();
                        break;
                    case 'toFront':
                    case 'toBack':
                        if (cells.length) {
                            if (obj.act === 'remove') {
                                graph.removeCells(cells);
                            } else if (obj.act === 'cut') {
                                graph.cut(cells);
                            } else if (obj.act === 'copy') {
                                graph.copy(cells);
                            } else if (obj.act === 'toFront') {
                                cells.forEach(cell => {
                                    cell.toFront();
                                })
                            } else if (obj.act === 'toBack') {
                                cells.forEach(cell => {
                                    cell.toBack();
                                })
                            }
                        }
                        break;
                    case 'remove':
                    case 'cut':
                        if(graph.isSelected(cells[0])) {
                            $bus.$emit("deleteCell");
                        }
                        break;
                    case 'shadow':
                        let args = {
                            dx:5,
                            dy:5,
                            blur:0,
                            color:'rgba(0,0,0,0.6)',
                            opacity: 0.3
                        }
                        cells.forEach(cell => {
                            let attr = cell.getAttrs();
                            if(attr.body.filter) {
                                if(attr.body.filter.args.opacity > 0) {
                                    args.opacity = 0;
                                }
                                cell.attr('body/filter/args', args);
                            }
                        })
                        break;
                    case 'clear':
                        this.clear();
                        break;
                    case 'import':
                        document.getElementById('data-file').click();
                        break;
                    case 'exportData':
                        const timestamp = new Date().getTime();
                        exportJSON(graph.toJSON(), `${timestamp}-flow.json`);
                        break;
                    case 'exportImg':
                        graph.toPNG(dataUri => {
                            const timestamp = new Date().getTime();
                            DataUri.downloadDataUri(dataUri, `${timestamp}-flow.png`);
                        }, {
                            backgroundColor: 'transparent',
                            padding: {
                                top: 20,
                                right: 20,
                                bottom: 20,
                                left: 20
                            }
                        });
                        break;
                    case 'save':
                        graph.toPNG(dataUri => {
                            this.$emit('change', {act:'save',saveAs: obj.act==='saveas', img: dataUri});
                        }, {
                            backgroundColor: 'transparent',
                            padding: {
                                top: 10,
                                right: 10,
                                bottom: 10,
                                left: 10
                            }
                        });
                        break;
                    case 'strokeRouter':
                        cells.forEach(cell => {
                            let router = cell.getRouter();
                            let name = router.name === 'manhattan' ? 'normal' : 'manhattan';
                            cell.setRouter(name)
                        })
                        break;
                    case 'arrow':
                        cells.forEach(cell => {
                            let attr = cell.getAttrs();
                            let name = attr.line.targetMarker.name === 'path' ? 'classic' : 'path';
                            cell.attr('line/targetMarker', {name:name});
                        })
                        break;
                    case 'dasharray':
                        cells.forEach(cell => {
                            let attr = cell.getAttrs();
                            let value = attr.body.strokeDasharray ? 0 : 5;
                            cell.attr('body/strokeDasharray', value);
                        })
                        break;
                    case 'enlargeText':
                        cells.forEach(cell => {
                            let attr = cell.getAttrs();
                            let size = Number(attr.text.fontSize) + 2;
                            cell.attr('text/fontSize', size);
                        })
                        break;
                    case 'reduceText':
                        cells.forEach(cell => {
                            let attr = cell.getAttrs();
                            let size = Number(attr.text.fontSize) - 2;
                            cell.attr('text/fontSize', size);
                        })
                        break;
                }
            },
            clear() {
                this.$confirm('确定清空画布?', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    const { graph } = this.flowGraph;
                    graph.clearCells();
                    graph.off('*');
                    this.$storage.session.remove('graphData');
                }).catch(() => {});
            },
            handleBeforeUpload(evt) {
                const file = evt.target.files[0];
                loadFile(file).then(response => {
                    if (!this.$global.isJSON(response)) {
                        this.$message.error("文件不匹配数据格式！");
                        return;
                    }
                    const { graph } = this.flowGraph;
                    const data = JSON.parse(response);
                    // 判断画布是否有元素
                    const cells = graph.getCells();
                    if (cells.length) {
                        this.$confirm('导入数据将清空画布内容，确定继续?', '提示', {
                            confirmButtonText: '确定',
                            cancelButtonText: '取消',
                            type: 'warning'
                        }).then(() => {
                            const cellDatas = this.parseHtmlData(data);
                            // console.log("cellDatas=>", cellDatas)
                            graph.fromJSON(cellDatas);
                            this.$storage.session.set('graphData', {
                                cells: cellDatas
                            });
                            document.getElementById('data-file').value = null;
                        }).catch(() => {});
                    } else {
                        const cellDatas = this.parseHtmlData(data);
                        if(cellDatas) {
                            graph.fromJSON(cellDatas);
                            this.$storage.session.set('graphData', {
                                cells: cellDatas
                            });
                            document.getElementById('data-file').value = null;
                        } else {
                            this.$message.error("数据错误！");
                        }
                    }
                });
            },
            parseHtmlData(data) {
                let { cells } = data;
                return data.cells;
            },
            listenerGraph() {
                const { graph } = this.flowGraph;
                graph.on('cell:change:*', ({ cell, view, key, current, previous, options  }) => {
                    this.disabledEvent.disUndo = !graph.canUndo();
                    this.disabledEvent.disRedo = !graph.canRedo();
                    this.disabledEvent.disPaste = graph.isClipboardEmpty();
                });
                graph.on('cell:selected', ({ cell, view, options }) => {
                    const selectCells = graph.getSelectedCells();
                    if(selectCells.length === 0) {
                        this.disabledEvent.emptyNode = true;
                        this.disabledEvent.emptyLine = true;
                    } else {
                        this.disabledEvent.emptyLine = false;
                        if(selectCells.length === 1) {
                            this.disabledEvent.emptyNode = !graph.isNode(selectCells[0]);
                            this.disabledEvent.emptyLine = !graph.isEdge(selectCells[0]);
                        } else {
                            this.currColor = "";
                        }
                    }
                    const dataJSON = graph.toJSON();
                    this.disabledEvent.emptyData = dataJSON.cells.length === 0;
                });
                graph.on('blank:click', ({ e, x, y }) => {
                    this.disabledEvent.emptyNode = true;
                    this.disabledEvent.emptyLine = true;
                    this.disabledEvent.emptyData = true;
                })
            }
        },
        mounted() {
            this.$nextTick(() => {
                this.listenerGraph();
            })
        },
        beforeDestroy() {
            this.handlerIntevel = null;
        }
    }
</script>

<style lang="scss" scoped>
    .toolbars-list{
        display: flex;
        align-items: center;
        height: 100%;
        justify-content: space-between;
        width: 100%;
        >ul,>div{
            display: flex;
            align-items: center;
            >li{
                cursor: move;
                user-select: none;
                margin: 0 2px;
                border:1px solid #CCC;
                padding: 2px 3px;
                .node{
                    font-size: 2em;
                }
                &:hover{
                    background-color: #67C23A;
                    color:#FFF;
                }
				path{
					fill: #FFF;
					stroke: #5e5e5e;
				}
            }
            .button {
                display: block;
                width: 22px;
                height: 22px;
                background-image: url('~@assets/images/icon-btn2.png?v=3');
                background-repeat: no-repeat;
                border: 0;
                background-color: transparent;
                outline: none;
                cursor: pointer;
                opacity: 0.6;
                padding: 2px;
                border-radius: 2px;
                ::v-deep .el-color-picker__trigger{
                    opacity: 0;
                }
                &:hover {
                    background-color: rgba(0, 0, 0, .1);
                    opacity: 1;
                    filter: none;
                    >span{
                        display: block;
                    }
                }
                &.disabled {
                    opacity: .2;
                    pointer-events: none;
                    filter: grayscale(100%);
                }
            }
        }
    }
</style>
