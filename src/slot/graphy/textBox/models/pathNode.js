export default x6 => {
    x6.Graph.unregisterNode("flow-path");
    const FlowChartPath = x6.Graph.registerNode("flow-path", {
        "inherit": "path",
        "label": "path",
        "attrs": {
        	"image": {
                "xlinkHref": "",
                "width": 16,
                "height": 16,
                "x": 5,
                "y": 10,
                "hidden":true
            }
        },
        "markup": [{
        		"tagName": "path",
        		"selector": "body"
        	},
        	{
        		"tagName": "image",
        		"selector": "image"
        	},
        	{
        		"tagName": "text",
        		"selector": "text"
        	}
        ]
    })
}
