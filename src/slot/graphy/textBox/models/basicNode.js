export default x6 => {
    x6.Graph.unregisterNode('flow-rect');
	const FlowChartRect = x6.Graph.registerNode('flow-rect', {
		"inherit": 'rect',
		"attrs": {
            "image": {
                "xlinkHref": "",
                "width": 30,
                "height": 30,
                "x": -15,
                "y": -15,
                "hidden":true
            }
		},
		"markup": [{
				"tagName": 'rect',
				"selector": 'body'
			},
            {
            	"tagName": 'text',
            	"selector": 'text'
            },
			{
				"tagName": 'image',
				"selector": 'image'
			}
		]
	});
	/**
	 * 注册柱形节点
	 */
    x6.Graph.unregisterNode('flow-cylinder');
	const FlowChartCylinder = x6.Graph.registerNode('flow-cylinder', {
		"inherit": 'cylinder',
		"attrs": {
			"image": {
			    "xlinkHref": "",
			    "width": 16,
			    "height": 16,
			    "x": 5,
			    "y": 12
			}
		},
		"markup": [
            {
            	"tagName": 'path',
            	"selector": 'body'
            },
            {
            	"tagName": 'ellipse',
            	"selector": 'top'
            },
            {
            	"tagName": 'text',
            	"selector": 'text'
            },
			{
				"tagName": 'image',
				"selector": 'image'
			}
		]
	});

	/**
	 * 注册柱形节点
	 */
    x6.Graph.unregisterNode('flow-ellipse');
	const FlowChartEllipse = x6.Graph.registerNode('flow-ellipse', {
		"inherit": 'ellipse',
		"attrs": {
			"image": {
                "xlinkHref": "",
                "width": 16,
                "height": 16,
                "x": 5,
                "y": 12
            }
		},
        "markup": [
            {
                "tagName": 'ellipse',
                "selector": 'body'
            },
            {
                "tagName": 'text',
                "selector": 'text'
            },
            {
                "tagName": 'image',
                "selector": 'image'
            }
        ]
	});
	/**
	 * 注册多边行节点
	 */
    x6.Graph.unregisterNode('flow-polygon');
	const FlowChartPolygon = x6.Graph.registerNode('flow-polygon', {
		"inherit": 'polygon',
		"attrs": {
			"image": {
			    "xlinkHref": "",
			    "width": 16,
			    "height": 16,
			    "x": 5,
			    "y": 12
			}
		},
        "markup": [
            {
                "tagName": 'polygon',
                "selector": 'body'
            },
            {
                "tagName": 'text',
                "selector": 'text'
            },
            {
                "tagName": 'image',
                "selector": 'image'
            }
        ]
	});
}
