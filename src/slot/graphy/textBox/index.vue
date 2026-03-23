<template>
    <div class="graph-draw-container">
        <div class="tools">
            <toolbar :flowGraph="graph" @change="handlerChange" />
        </div>
        <div class="content" :id="`graph-editor-${gId}`" @drop.prevent="handleDrop" @dragover.prevent></div>
        <!-- 编辑文本标签区域 -->
        <div class="edit-text" :class="{'show':showEditText}" :style="textStyle">
            <textarea :row="1" id="input-text" autocomplete="off" @blur="blurText" />
        </div>
    </div>
</template>

<script>
    import { v4 } from 'uuid';
    import { graphConfig, edgesCfg, nodePosts, quickyTools } from './cfg';
    import { toolbar } from './component';
    import nodeGraph from './nodeGraph';
    import registerNode from './registerNode';
    import $bus from '@/utils/bus';
    export default {
        name: 'graph-draw',
        components: {
            toolbar
        },
        props: {
            isEdit: {
                type:Boolean,
                default: true
            },
            data: Object,
			isFrame: Boolean
        },
        watch: {
            data: {
                handler(data) {
                   if (this.graph) {
                       const { graph } = this.graph;
                       graph.clearCells();
                       this.renderData(data);
                   }
                },
                deep: true,
                immediate: true
            }
        },
        computed: {
            textStyle() {
                return {
                    left: `${this.textPosition.x}px`,
                    top: `${this.textPosition.y}px`,
                    width: `${this.textPosition.width}px`,
                    height: `${this.textPosition.height}px`
                }
            },
            checkCells() {
                let flag = true;
                if (this.graph) {
                    const { graph } = this.graph;
                    let data = graph.toJSON();
                    if(data.cells.length) {
                        flag = false;
                    }
                }
                return flag;
            }
        },
        data() {
            return {
                gId: v4(),
                nodeData: null,
                graph: null,
                currCell: null,
                showEditText: false,
                textPosition: {
                    x: 100,
                    y: 100,
                    width:100,
                    height: 30
                },
                textContent: "",
                outputData: {
                    img: '',
                    data: ''
                },
                loading: false
            }
        },
        methods: {
            handleDrop(evt) {
                const itemData = evt.dataTransfer.getData('node');
                let nodeData = JSON.parse(itemData);
                this.appendNode(nodeData, evt);
            },
            blurText(evt) {
                this.showEditText = false;
                if(this.currCell.shape === 'text-block'){
                    this.currCell.attr('label/text', evt.target.value);
                    this.currCell.attr('label/style/display', '');
                } else {
                    this.currCell.attr('text/textWrap/text', evt.target.value);
                    this.currCell.attr('text/style/display', '');
                }
            },
            /**
             * 工具栏动作事件
             * @param {Object} data
             */
            handlerChange(data) {
                switch(data.act) {
                    case 'save':
                        this.saveData(data);
                        break;
                }
            },
            async saveData() {
				var outputData = await this.createImage();
				// console.log("outputData", outputData)
				if (outputData) {
					// this.$emit('change', outputData);
				}
            },
			async createImage() {
				if(!this.graph) return null;
				const { graph } = this.graph;
				return new Promise((resolve, reject) => {
					var outputData = { data:graph.toJSON() };
					graph.toPNG(dataUri => {
					    outputData.img = dataUri;
					    resolve(outputData);
					}, {
					    backgroundColor: 'transparent',
					    quality: 1,
					    padding: {
					        top: 0,
					        right: 0,
					        bottom: 0,
					        left: 0
					    }
					});
				})
			},

            appendNode(nodeData, evt) {
                const { graph } = this.graph;
                let data = {
                    ...nodeData.data,
                    x: evt.layerX - (nodeData.data.width / 2),
                    y: evt.layerY - (nodeData.data.height / 2),
                    ports: { ...nodePosts }
                };
                graph.cleanSelection();
                const node = graph.addNode(data);
                graph.select(node);
            },
            renderData(nodeData) {
                if (this.graph) {
                    const { graph } = this.graph;
                    graph.clearCells();
                    if(nodeData && nodeData.list) {
                        graph.fromJSON(nodeData.list);
                        graph.center();
                    }

                } else {
                    this.$message.error("画布未初始化！", {type:"error"});
                }
            },
            initGraph() {
                const container = document.getElementById(`graph-editor-${this.gId}`);
                const configs = _.merge({edit: this.isEdit}, graphConfig(container, this.isEdit, false), edgesCfg(this.isEdit));
                this.graph = new nodeGraph(configs);

                this.initGraphEvent();
                // 渲染节点
                if(!_.isEmpty(this.data)) {
                    this.renderData(this.data);
                }
            },
            initGraphEvent() {
                const { graph } = this.graph;
                graph.center();
                graph.on('blank:click', ({ e, x, y }) => {
                    graph.cleanSelection();
                });

				graph.on('cell:change:*', ({ cell }) => {
					if(this.isFrame) {
						this.saveData();
					}
				});
            },
            regEvents() {
                $bus.$off('editText');
                $bus.$on('editText', (cell) => {
                    const editContainer = document.querySelector('#input-text');
                    if(!cell.isNode() || !editContainer){
                        return false;
                    }
                    const { graph } = this.graph;
                    this.currCell = cell;

                    const cellNode = document.querySelector(`#graph-editor-${this.gId} g.x6-cell[data-cell-id="${cell.id}"]`).firstElementChild;
                    const rect = cellNode.getClientRects()[0];
                    let position = {
                        x: rect.x,
                        y: rect.y
                    }
                    this.textPosition = {
                        ...position,
                        ...cell.size()
                    }

                    let fontSize = 12, color = '#666';

                    if(cell.shape === 'text-block'){ // 文本节点
                        cell.attr('label/style/display', 'none');
                        fontSize = cell.attr('label/style/fontSize');
                        color = cell.attr('label/style/fill');
                    } else {
                        cell.attr('text/style/display', 'none');
                        fontSize = cell.attr('text/style/fontSize') || cell.attr('text/fontSize');
                        color = cell.attr('label/style/fill') || cell.attr('text/fill');
                    }

                    editContainer.style['font-size'] = fontSize + 'px';
                    editContainer.style['color'] = color;
                    this.showEditText = true;

                    editContainer.value = cell.shape === 'text-block' ? cell.attr('label/text') : cell.attr('text/textWrap/text');
                    setTimeout(() => {
                        editContainer.focus();
                        // 处理光标位置在最后
                        var range = document.createRange();
                        range.selectNodeContents(editContainer);
                        range.collapse(false);
                        var sel = window.getSelection();
                        //判断光标位置，如不需要可删除
                        if(sel.anchorOffset !== 0) {
                            return;
                        };
                        sel.removeAllRanges();
                        sel.addRange(range);
                        editContainer.select();
                    }, 200)
                });


            },
            clearEvents() {
                $bus.$off(['editText','showQuickTool']);
            }
        },
        created() {
            registerNode();
        },
        mounted() {
            this.initGraph();
            this.clearEvents();
            this.regEvents();
        },
        beforeDestroy() {
            if (this.graph) {
                const { graph } = this.graph;
                graph.clearCells();
                this.clearEvents();
                graph.dispose();
            }
        }
    }
</script>

<style lang="scss" scoped>
    @import "./graph-draw";
</style>
