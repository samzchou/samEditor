/**
 * ------------------------
 * 流程画布配置
 * @author sam.shen 2021/02/12
 * ------------------------
 */
import { Shape } from "@antv/x6";

export const predefineColor = [
    'rgba(255, 255, 255, 0)',
    '#ff4500',
    '#ffffff',
    '#ff8c00',
    '#ffd700',
    '#90ee90',
    '#00ced1',
    '#1e90ff',
    '#c71585',
    'rgba(255, 69, 0, 0.68)',
    'rgb(255, 120, 0)',
    'rgb(51, 100, 98)',
    'rgba(120, 40, 94, 0.5)',
    'rgb(181, 100, 37)',
    'rgba(209, 100, 56, 0.7)',
    '#c7158577'
]

export const shapeList = [
    {
        "shape": "flow-rect",
        "label": "矩形",
        "icon": "iconfont icon-fuwenbenkuang",
        "data": {
            "shape": "flow-rect",
            "key": "system-1613266898938",
            "width": 50,
            "height": 30,
            "attrs": {
                "body": {
                    "fill": "rgba(255,255,255,1)",
                    "stroke": "#000",
                    "strokeWidth": 1,
                    "filter": {
                        "name": 'dropShadow',
                        "args": {
                            dx:5,
                            dy:5,
                            blur:0,
                            color:'rgba(0,0,0,0.6)',
                            opacity: 0
                        }
                    }
                },
                "text": {
                    "fill": "#000",
                    "fontSize": 13,
					"fontFamily": 'simSun',
                    "textWrap": {
                        "text": "文本",
                        "ellipsis": true
                    }
                }
            }
        }
    },

    {
        "shape": "flow-ellipse",
        "label": "圆形",
        "icon": "iconfont icon-xingzhuang-tuoyuanxing",
        "data": {
            "shape": "flow-ellipse",
            "key": "system-1613267188511",
            "width": 40,
            "height": 40,
            "x": 1,
            "y": 1,
            "attrs": {
                "body": {
                    "fill": "rgba(255,255,255,0.1)",
                    "stroke": "#000",
                    "strokeWidth": 1
                },
                "text": {
                    "fill": "#000",
                    "fontSize": 13,
					"fontFamily": 'simSun',
                    "textWrap": {
                        "text": "文本",
                        "ellipsis": true
                    }
                }
            }
        }
    },

    {
        "shape": "flow-polygon",
        "label": "菱形",
        "icon": "iconfont icon-lingxing",
        "data": {
            "shape": "flow-polygon",
            "key": "system-1613267188513",
            "width": 50,
            "height": 30,
            "x": 1,
            "y": 1,
            // 多边形的顶点数组
            "points": [
                [0, 10],
                [10, 0],
                [20, 10],
                [10, 20]
            ],
            "attrs": {
                "body": {
                    "fill": "rgba(255,255,255,0.1)",
                    "stroke": "#000",
                    "strokeWidth": 1
                },
                "text": {
                    "fill": "#000",
                    "fontSize": 13,
					"fontFamily": 'simSun',
                    "textWrap": {
                        "text": "文本",
                        "ellipsis": true
                    }
                }
            }
        }
    },
	{
		"shape": "flow-path",
		"label": "四边形",
		"path": "M 1.44 22.08 L 7.2 7.68 L 30.24 7.68 L 24.48 22.08 Z",
		"data": {
			"shape": "flow-path",
			"key": "system-1613267128711",
			"width": 60,
			"height": 40,
			"x": 1,
			"y": 1,
			"attrs": {
				"body": {
					"fill": "rgba(255,255,255,0.1)",
					"stroke": "#000",
					"strokeWidth": 1,
					"refD": "M 1.44 22.08 L 7.2 7.68 L 30.24 7.68 L 24.48 22.08 Z"
				},
				"text": {
					"fill": "#000",
					"fontSize": 13,
					"fontFamily": 'simSun',
					"textWrap": {
						"text": "文本"
					}
				}
			}
		}
	},
	{
		"shape": "flow-path",
		"label": "六边形",
		"path": "M 8.64 5.28 L 23.04 5.28 L 30.24 14.88 L 23.04 24.48 L 8.64 24.48 L 1.44 14.88 Z",
		"data": {
			"shape": "flow-path",
			"key": "system-1613267131711",
			"width": 60,
			"height": 40,
			"x": 1,
			"y": 1,
			"attrs": {
				"body": {
					"fill": "rgba(255,255,255,0.1)",
					"stroke": "#000",
					"strokeWidth": 1,
					"refD": "M 8.64 5.28 L 23.04 5.28 L 30.24 14.88 L 23.04 24.48 L 8.64 24.48 L 1.44 14.88 Z"
				},
				"text": {
					"fill": "#000",
					"fontSize": 13,
					"fontFamily": 'simSun',
					"textWrap": {
						"text": "文本"
					}
				}
			}
		}
	},
	{
		"shape": "flow-polygon",
		"label": "书签形",
		"path": "M 1.44 5.28 L 30.24 5.28 L 30.24 21.6 Q 23.04 16.42 15.84 21.6 Q 8.64 26.78 1.44 21.6 L 1.44 8.16 Z",
		"data": {
			"shape": "flow-path",
			"key": "system-1613267129711",
			"width": 60,
			"height": 40,
			"x": 1,
			"y": 1,
			"attrs": {
				"body": {
					"fill": "rgba(255,255,255,0.1)",
					"stroke": "#000",
					"strokeWidth": 1,
					"refD": "M 1.44 5.28 L 30.24 5.28 L 30.24 21.6 Q 23.04 16.42 15.84 21.6 Q 8.64 26.78 1.44 21.6 L 1.44 8.16 Z"
				},
				"text": {
					"fill": "#000",
					"refY": 0.35,
					"fontSize": 13,
					"fontFamily": 'simSun',
					"textWrap": {
						"text": "文本"
					}
				}
			}
		}
	},
	{
		"shape": "flow-path",
		"label": "云形",
		"path": "M 8.64 10.08 C 2.88 10.08 1.44 14.88 6.05 15.84 C 1.44 17.95 6.62 22.56 10.37 20.64 C 12.96 24.48 21.6 24.48 24.48 20.64 C 30.24 20.64 30.24 16.8 26.64 14.88 C 30.24 11.04 24.48 7.2 19.44 9.12 C 15.84 6.24 10.08 6.24 8.64 10.08 Z",
		"data": {
			"shape": "flow-path",
			"key": "system-1613267132711",
			"width": 60,
			"height": 40,
			"x": 1,
			"y": 1,
			"attrs": {
				"body": {
					"fill": "rgba(255,255,255,0.1)",
					"stroke": "#000",
					"strokeWidth": 1,
					"refD": "M 8.64 10.08 C 2.88 10.08 1.44 14.88 6.05 15.84 C 1.44 17.95 6.62 22.56 10.37 20.64 C 12.96 24.48 21.6 24.48 24.48 20.64 C 30.24 20.64 30.24 16.8 26.64 14.88 C 30.24 11.04 24.48 7.2 19.44 9.12 C 15.84 6.24 10.08 6.24 8.64 10.08 Z"
				},
				"text": {
					"fill": "#000",
					"fontSize": 13,
					"fontFamily": 'simSun',
					"textWrap": {
						"text": "文本"
					}
				}
			}
		}
	},
	{
		"shape": "flow-path",
		"label": "盾牌形",
		"path": "M 1.44 5.28 L 25.44 5.28 L 30.24 14.88 L 25.44 24.48 L 1.44 24.48 L 6.24 14.88 Z",
		"data": {
			"shape": "flow-path",
			"key": "system-1613267133711",
			"width": 60,
			"height": 40,
			"x": 1,
			"y": 1,
			"attrs": {
				"body": {
					"fill": "rgba(255,255,255,0.1)",
					"stroke": "#000",
					"strokeWidth": 1,
					"refD": "M 1.44 5.28 L 25.44 5.28 L 30.24 14.88 L 25.44 24.48 L 1.44 24.48 L 6.24 14.88 Z"
				},
				"text": {
					"fill": "#000",
					"fontSize": 13,
					"fontFamily": 'simSun',
					"textWrap": {
						"text": "文本"
					}
				}
			}
		}
	},
	{
		"shape": "flow-path",
		"label": "箭头形",
		"path": "M 2.25 1.35 L 29.25 1.35 L 29.25 14.85 L 15.75 28.35 L 2.25 14.85 Z",
		"data": {
			"shape": "flow-path",
			"key": "system-1613267136711",
			"width": 60,
			"height": 40,
			"x": 1,
			"y": 1,
			"attrs": {
				"body": {
					"fill": "rgba(255,255,255,0.1)",
					"stroke": "#000",
					"strokeWidth": 1,
					"refD": "M 2.25 1.35 L 29.25 1.35 L 29.25 14.85 L 15.75 28.35 L 2.25 14.85 Z"
				},
				"text": {
					"fill": "#000",
					"refY": 0.4,
					"fontSize": 13,
					"fontFamily": 'simSun',
					"textWrap": {
						"text": "文本"
					}
				}
			}
		}
	},
    {
        "shape": "flow-rect",
        "label": "标签文字",
        "icon": "iconfont icon-fuwenben",
        "data": {
            "shape": "flow-rect",
            "key": "system-1613266898948",
            "width": 50,
            "height": 30,
            "attrs": {
                "body": {
                    "strokeWidth": 0,
                    "fill": "rgba(255,255,255,0)"
                },
                "text": {
                    "fill": "#000",
					"fontSize": 13,
					"fontFamily": 'simSun',
					"textWrap": {
						"text": "文本",
						"ellipsis": true
					}
                }
            }
        }
    }

]

export const nodePosts = {
    "groups": {
        "top": {
            "position": "top",
            "label": {
                "position": 'top', // 标签位置
            }
        },
        "right": {
            "position": "right",
            "label": {
                "position": 'right', // 标签位置
            }
        },
        "bottom": {
            "position": "bottom",
            "label": {
                "position": 'bottom', // 标签位置
            }
        },
        "left": {
            "position": "left",
            "label": {
                "position": 'left', // 标签位置
            }
        }
    },
    "items": [{
            "group": "top",
            "attrs": {
                "circle": {
                    "r": 5,
                    "magnet": true,
                    "stroke": "#5F95FF",
                    "strokeWidth": 1,
                    "fill": "#fff"
                },
                "text": {
                    "text": ""
                }
            }
        },
        {
            "group": "right",
            "attrs": {
                "circle": {
                    "r": 5,
                    "magnet": true,
                    "stroke": "#5F95FF",
                    "strokeWidth": 1,
                    "fill": "#fff"
                },
                "text": {
                    "text": ""
                }
            }
        },
        {
            "group": "bottom",
            "attrs": {
                "circle": {
                    "r": 5,
                    "magnet": true,
                    "stroke": "#5F95FF",
                    "strokeWidth": 1,
                    "fill": "#fff"
                },
                "text": {
                    "text": ""
                }
            }
        },
        {
            "group": "left",
            "attrs": {
                "circle": {
                    "r": 5,
                    "magnet": true,
                    "stroke": "#5F95FF",
                    "strokeWidth": 1,
                    "fill": "#fff"
                },
                "text": {
                    "text": ""
                }
            }
        }
    ]
}
/**
 * 快捷工具条
 */
export const quickyTools = [
    { icon: 'iconfont icon-user', title:'配置', act:'opts', enabled:true},
]

/**
 * 帮助说明
 */
export const guidSteps = [
    {
        element: '.model-wrapper',
        popover: {
            title: '基础模型和组件栏',
            description: '可以直接拖拽到画布，也可以在画布定义好模型后拖拽到我的模型库中。点击右侧中间按钮可收起或展开组件栏',
            position: 'right'
        }
    },
    {
        element: '.tool-bar',
        popover: {
            title: '工具栏',
            description: '在画布中选定元素，可以通过工具栏按钮进行快捷操作',
            position: 'bottom'
        }
    },
    {
        element: '.drawer-container',
        popover: {
            title: '画布容器',
            description: '可以在画布中设计流程图例',
            position: 'left'
        }
    },
    {
        element: '.detail-wrapper',
        popover: {
            title: '元素属性编辑栏',
            description: '在画布中选定元素，配置元素的特定属性。。点击左侧中间按钮可收起或展开组件栏',
            position: 'left'
        }
    }
]

/**
 * 流程图画布配置
 */
export const graphConfig = (container, isEdit=true, isScroller=false) => {
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    return {
        container,
        width,
        height,
        autoResize: !isScroller, 						// 是否监听容器大小改变，并自动更新画布大小,如果设置为true 并且设置了scroller 将会产生冲突 !isScroller
        // 画布网格
        grid: {
            size: 10,
            visible: isEdit,
            type: 'doubleMesh',
            args: [{
                    color: '#EEE',
                    thickness: 1
                },
                {
                    color: '#DDD',
                    thickness: 1,
                    factor: 5
                }
            ]
        },
        background: {
            color: '#FFF',
            image: '',
            position: 'center',
            size: 'auto',
            repeat: 'no-repeat',
            opacity: 0.2
        },
        // 配置节点的可移动区域，默认值为 false
        translating: {
            restrict: true 								// true，节点移动时无法超过画布区域 number 将节点限制在画布区域扩展（正数）或收缩（负数）后的范围 Rectangle.RectangleLike
        },
        // 自动捕捉辅助线
        snapline: {
            enabled: true,
            tolerance: 10,
            className: 'wf-snapline',
        },
		lockScroller: false,
        // 画布滚动视窗; 如启用则须将autoResize设置为false
        scroller: {
            enabled: isScroller, 						// 启用滚动、平移、居中、缩放等能力，默认禁用 isScroller
			className: 'flow-scroller',					// 滚动条样式
            pannable: true, 							// 启动画布平移
            //modifiers: 'ctrl&alt', 					// 修饰键 &:同时 |:或 alt|ctrl
            pageVisible: false,							// 是否分页
            pageWidth: 650,
            pageHeight: 842,
            pageBreak: true, 							// 是否显示分页符，默认为 false
            autoResize: true 							// 是否自动扩充/缩小画布，默认为 true
        },
        // 小地图导航,如果开启小地图，必须要设置scroller, autoSize为false
        minimap: {
            enabled: false, 							// 小地图是否被启用，默认为 false
            container: '#minimap', 						// 挂载小地图的容器
            width: 200, 								// 小地图的宽度，默认为 300
            height: 100, 								// 小地图的高度，默认为 200
            scalable: true, 							// 是否可缩放，默认为 true
            padding: 10
        },
        // 撤销/重做 历史操作记录 默认禁用
        history: true,
        // 剪切板，默认禁用
        clipboard: true,
        // 键盘快捷键，默认禁用
        keyboard: true,
        // 鼠标滚轮的默认行为是滚动页面，启用 Scroller 后用于滚动画布
        mousewheel: {
            enabled: true,
            modifiers: ['ctrl', 'meta']
        },
        // 全局的连线规则
        connecting: {
            snap: true, 								// 捕捉链接桩
            connector: 'rounded',
            connectionPoint: 'anchor', 					// 连接目标链接桩
            allowBlank: false, 							// 是否允许连接到画布空白位置的点，默认为 true
            highlight: true, 							// 拖动边时，是否高亮显示所有可用的连接桩或节点，默认值为 false
            allowLoop: false,
            anchor: 'center', 							// 当连接到节点时，通过 anchor 来指定被连接的节点的锚点，默认值为 center
            router: {
                name: 'er',
                args: {
                    direction: 'V',
                }
            },
            validateConnection({ 						// 校验链接
                sourceView,
                targetView,
                sourceMagnet,
                targetMagnet,
            }) {
                if (sourceView === targetView) {
                    return false;
                }
                if (!sourceMagnet) {
                    return false;
                }
                if (!targetMagnet) {
                    return false;
                }
                return true;
            }
        },
        // 指定触发某种交互时的高亮样式
        highlighting: {
            // 嵌套节点交互
            embedding: {
                name: 'stroke',
                args: {
                    padding: -1,
                    attrs: {
                        stroke: '#73d13d'
                    }
                }
            },
            // 连线过程中，链接桩交互
            magnetAvailable: {
                name: 'stroke',
                args: {
                    padding: 4,
                    attrs: {
                        'stroke-width': 6,
                        stroke: 'rgba(73,148,253, 0.6)'
                    }
                }
            }
        },
        // 可以将一个节点拖动到另一个节点中，使其成为另一节点的子节点，默认禁用
        embedding: {
            enabled: true,
            findParent({
                node
            }) {
                const bbox = node.getBBox();
                return this.getNodes().filter((node) => {
                    // 只有 data.parent 为 true 的节点才是父节点
                    const data = node.getData();
                    if (data && data.parent) {
                        const targetBBox = node.getBBox();
                        return bbox.isIntersectWithRect(targetBBox);
                    }
                    return false;
                })
            }
        },
        // 点选/框选，默认禁用
        selecting: {
            enabled: true,
            multiple: true, 						// 是否启用点击多选，默认为 true
            rubberband: true, 						// 启用框选
            modifiers: 'ctrl', 						// 修饰键 &:同时 |:或 alt|ctrl
            movable: true, 							// 选中的节点是否可以被移动, 设置为 true 时，拖动选框触发节点移动，默认为 true
            showNodeSelectionBox: false, 			// 是否显示节点的选择框，默认为 false
            showEdgeSelectionBox: true 				// 是否显示边的选择框，默认为 false
        },
        // 平移、缩放和旋转节点的基础选项
        resizing: {
            enabled: true, 							// 缩放节点，默认禁用
            minWidth: 20, 							// 缩放后的最小宽度
            minHeight: 20, 							// 缩放后的最小高度
            maxWidth: Number.MAX_SAFE_INTEGER, 		// 缩放后的最大宽度
            maxHeight: Number.MAX_SAFE_INTEGER, 	// 缩放后的最大高度
            orthogonal: true, 						// 是否显示中间缩放点，默认为 true
            restricted: false, 						// 是否限制缩放大小为画布边缘，默认为 false
            autoScroll: true, 						// 是否自动滚动画布，仅当开启 Srcoller 并且 restricted 为 false 时有效，默认为 true
            //preserveAspectRatio: true 			// 缩放过程中是否保持节点的宽高比例，默认为 false
        },
        // 旋转节点，默认禁用
        rotating: {
            enabled: false,
            //grid: 5 								// 每次旋转的角度，默认值为 15
        },
        // 交互模式
        interacting: {
            nodeMovable: true, 						// 节点是否可以被移动
            // magnetConnectable: true, 			// 当在具有 'magnet' 属性的元素上按下鼠标开始拖动时，是否触发连线交互
            edgeMovable: true, 						// 边是否可以被移动
            edgeLabelMovable: true, 				// 边的标签是否可以被移动
            arrowheadMovable: true, 				// 边的起始/终止箭头是否可以被移动
            vertexMovable: true, 					// 边的路径点是否可以被移动
            vertexAddable: true, 					// 是否可以添加边的路径点
            vertexDeletable: true 					// 边的路径点是否可以被删除
        },
        async: true, 								// 是否是异步渲染的画布。异步渲染不会阻塞 UI，对需要添加大量节点和边时的性能提升非常明显
        //frozen: true, 							// 异步渲染的画布是否处于冻结状态
        sorting: 'approx', 							// 节点和边视图的排序方式;'none' 'exact' 'approx'
        //preventDefaultContextMenu: false, 		// 是否禁用画布的默认右键，默认为 true
    }
}
/**
 * 节点间链接线配置
 */
export const edgesCfg = (isEdit) => {
    return {
        connecting: {
            snap: isEdit,
            connectionPoint: 'anchor',
            allowBlank: false, 						// 是否允许连接到画布空白位置的点，默认为 true
            highlight: isEdit, 						// 画线时，是否高亮显示所有可用的连接桩或节点，默认值为 false
            anchor: 'center', 						// 当连接到节点时，通过 anchor 来指定被连接的节点的锚点，默认值为 center
            validateConnection({ 					// 校验链接合法性
                // 校验链接
                sourceView,
                targetView,
                sourceMagnet,
                targetMagnet
            }) {
                if (sourceView === targetView) {
                    return false;
                }
                if (!sourceMagnet) {
                    return false;
                }
                if (!targetMagnet) {
                    return false;
                }
                return true;
            },
            createEdge() {							// 新建链接线属性
                return new Shape.Edge({
                    attrs: {
                        line: {
                            stroke: '#000',
                            strokeWidth: 1,
                            /* sourceMarker: {
                                name: 'circle',
                                size: 0.5
                            }, */
                            targetMarker: {
                                name: 'classic',
                                size: 12
                            }
                        }
                    },
                    router: {
                        name: 'normal'//'manhattan'
                    },
                    connector: 'normal',
                    zIndex: 0
                });
            }
        }
    }
}
