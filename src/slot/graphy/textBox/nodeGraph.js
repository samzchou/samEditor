/**
 * 流程引擎主模块, controller
 * @author sam.shen 2021/02/11
 */
import { Graph, FunctionExt } from "@antv/x6";
import $bus from "@/utils/bus";

export default class flowGraph {
    constructor(cfg) {
        this.graph = null;
        this.cfg = cfg;
        this.initGraph();
    }

    initGraph() {
        this.graph = new Graph(this.cfg);
        this.graph.center();
        // 注册事件
        if(this.cfg.edit) {
            this.initEvent();
        }
    }

    initEvent() {
        const { graph } = this;
		// 双击编辑文字
		graph.on('cell:dblclick', ({ cell, view }) => {
			let flag = !this.cfg.edit;
			if (flag) {
				$bus.$message("当前节点状态不能双击编辑文本！", {type: "error"});
				return false;
			};
			$bus.$emit('editText', cell);
		});

        /**
         * 节点拖拽移动
         */
        graph.on('node:move', ({ node, cell }) => {
            graph.cleanSelection();
            graph.select(node);
        });
        graph.on('node:moved', ({ node, cell }) => {
            graph.select(node);
            $bus.$emit("editCell", cell);
        })

        /**
         * 鼠标移动在节点上，显示链接桩
         */
        graph.on('node:mouseenter', FunctionExt.debounce(({ e, cell, view }) => {
			e.preventDefault();
            if (!this.cfg.edit) return false;
            const ports = this.cfg.container.querySelectorAll('.x6-port');
            this.showPorts(ports, true);
        }), 500)
        /**
         * 鼠标移开节点
         */
        graph.on('node:mouseleave', ({ e, cell, view }) => {
			e.preventDefault();
            const ports = this.cfg.container.querySelectorAll('.x6-port');
            this.showPorts(ports, false);
        });

        /**
         * 鼠标移到链接线上
         */
        graph.on('edge:mouseenter', ({ edge }) => {
            if (!this.cfg.edit) return false;
            // 可拖拽箭头，删除按钮
			let edgeData = edge.getData();
			let tools = [
				{
				    name: 'source-arrowhead',
				    args: {
				        attrs: {fill: '#CCC'},
				    }
				},
				{
				    name: 'target-arrowhead',
				    args: {
				        attrs: {fill: '#CCC'},
				    }
				}
			];
			if(edgeData && edgeData.tool) {
				tools = tools.concat([
				    {
				        name: 'segments',
				        args: {
				            snapRadius: 10,
				            attrs: {fill: '#CCC'},
				        }
				    },
				    {
				        name: 'vertices',
				        args: {
				            attrs: {fill: '#CCC'},
				        }
				    }
				]);
			}
			edge.addTools(tools)
        });

        graph.on('edge:mouseleave', ({ edge }) => {
            edge.removeTools();
        });
        graph.on('edge:mousedown', ({ cell, view }) => {
            cell.removeTools();
        });

        // 获取选中的元素
        const getCells = () => {
            return graph.getSelectedCells();
        }
        /**
         * 键盘事件
         */
        graph.bindKey('backspace', () => {
            if (!this.cfg.edit) return false;
            const cells = getCells();
            if (cells.length) {
                graph.removeCells(cells);
                // 全局上报删除事件
                $bus.$emit("deleteCell");
            }
        });
        graph.bindKey('delete', () => {
            if (!this.cfg.edit) return false;
            const cells = getCells();
            if (cells.length) {
                graph.removeCells(cells);
                // 全局上报删除事件
                $bus.$emit("deleteCell");
            }
        });
        // 复制
        graph.bindKey('ctrl+c', e => {
            if (!this.cfg.edit) return false;
            const cells = getCells();
            graph.copy(cells);
            e.preventDefault();
            return false;
        });
        // 克隆
        graph.bindKey('ctrl+d', e => {
            if (!this.cfg.edit) return false;
            const cells = getCells();
            graph.copy(cells);
            if (!graph.isClipboardEmpty()) {
                const newCells = graph.paste({
                    offset: 32
                });
                graph.cleanSelection();
            }
            e.preventDefault();
            return false;
        });
        // 剪切
        graph.bindKey('ctrl+x', e => {
            if (!this.cfg.edit) return false;
            const cells = getCells();
            graph.cut(cells);
            // 全局上报删除事件
            $bus.$emit("deleteCell");
            e.preventDefault();
            return false;
        });
        // 粘贴
        graph.bindKey('ctrl+v', e => {
            if (!this.cfg.edit) return false;
            const cells = graph.paste({
                offset: 32
            });
            graph.cleanSelection();
            graph.select(cells);
            e.preventDefault();
            return false;
        });
        // 撤销
        graph.bindKey('ctrl+z', e => {
            if (!this.cfg.edit) return false;
            graph.undo();
            e.preventDefault();
            return false;
        });
        // 重做
        graph.bindKey('ctrl+y', e => {
            if (!this.cfg.edit) return false;
            graph.redo();
            e.preventDefault();
            return false;
        });
        // 上移一层
        graph.bindKey('ctrl+shift+f', e => {
            if (!this.cfg.edit) return false;
            const cells = getCells();
            cells.forEach(cell => {
                cell.toFront();
            })
            e.preventDefault();
            return false;
        });
        // 下移一层
        graph.bindKey('ctrl+shift+b', e => {
            if (!this.cfg.edit) return false;
            const cells = getCells();
            cells.forEach(cell => {
                cell.toBack();
            })
            e.preventDefault();
            return false;
        });

        // 键盘方向键控制位置
        graph.bindKey(['up','down','left','right'], e => {
            const cells = getCells();
            let opts = {
                x: 0,
                y: 0
            }
            switch(e.keyCode) {
                case 38: // up
                    opts.y = -1;
                    break;
                case 39: // right
                    opts.x = 1;
                    break;
                case 40: // down
                    opts.y = 1;
                    break;
                case 37: // left
                    opts.x = -1;
                    break;
            }
            cells.forEach(cell => {
                if(cell.isNode()) {
                    let position = cell.position();
                    position = {
                        x: position.x + opts.x,
                        y: position.y + opts.y
                    }
                    cell.position(position.x, position.y);
                }
            })
            e.preventDefault();
            return false;
        });
    }
    /**
     * 显示或隐藏所有链接桩
     */
    showPorts(ports = [], show = false) {
		for (let i = 0; i < ports.length; i++) {
		    ports[i].style.visibility = show ? 'visible' : 'hidden'; //(this.cfg.showPort || show)
		}
    }
}
