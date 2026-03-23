/**
 * @author sam.shen
 * @date 2021/01/25
 * @description workflow通用方法
 */

/**
 * ID转化为KEY
 */
export function tansIdToKey(data, param={s:'id', k:'nodeKey'}, isSave=false) {
	const tk = item => {
		if(item[param.s]){
			item[param.k] = item[param.s];
		}
		delete item[param.s];
		return item;
	}
	data = tk(data);
	if(data.nodes){
		data.nodes = data.nodes.map(item=>{
			if(isSave){
				item.content = JSON.stringify(item);
			}
			item = tk(item);
			return item;
		})
	}
	if(data.edges){
		data.edges = data.edges.map(item=>{
			if(isSave){
				item.content = JSON.stringify(item);
				item.sourceKey = item.source;
				item.targetKey = item.target;
				delete item.id, delete item.source, delete item.target;
			}
			return item;
		})
	}
	return data;
}

// 保存数据入库，数据须做入库前转换
export function transToSave(data) {
	data = tansIdToKey(data, {s:'id', k:'nodeKey'}, true);
	return data;
}
/**
 * @description JSON数据结构转化
 */
export function transStruct(data, isActive=false){
	if(data.nodes){
		data.nodes = data.nodes.map(item=>{
			let content = JSON.parse(item.content);
			content.nodeId = item.id;
			content.state = item.state;
			if(isActive){
				content.active = true;
			}
			return content;
		})
	}
	if(data.edges){
		data.edges = data.edges.map(item=>{
			let content = JSON.parse(item.content);
			content.edgeId = item.id;
			if(isActive){
				content.active = true;
			}
			return content;
		})
	}
	return data;
}

export function isJSON(str) {
	if (typeof str == 'string') {
		try {
			JSON.parse(str);
			return true;
		} catch(e) {
			console.log(e);
			return false;
		}
	}
	return false;
}

/**
 * @description 导出JSON文件
 * @param {Object} data
 * @param {String} filename
 */
export function exportJSON(data, fileName='flow.json') {
    downloadFile(JSON.stringify(data), 'application/json;charset=utf-8;', fileName);
    return data;
}

/**
 * @description 导出图片文件
 * @param {Element} canvasPanel
 * @param {String} filename
 * @param {Boolean} createFile
 */
export function exportImg(canvasPanel, filename, createFile = true) {
    filename = filename || 'flow'
    let canvas = canvasPanel.querySelector('canvas')
    let context = canvas.getContext('2d')

    let imgData = context.getImageData(0, 0, canvas.width, canvas.height).data
    let left = canvas.width;
    let right = 0;
    let top = canvas.height;
    let bottom = 0
    for (let i = 0; i < canvas.width; i++) {
        for (let j = 0; j < canvas.height; j++) {
            let pos = (i + canvas.width * j) * 4
            if (imgData[pos] > 0 || imgData[pos + 1] > 0 || imgData[pos + 2] || imgData[pos + 3] > 0) {
                bottom = Math.max(j, bottom);       // 找到有色彩的最下端
                right = Math.max(i, right);         // 找到有色彩的最右端
                top = Math.min(j, top);             // 找到有色彩的最上端
                left = Math.min(i, left);           // 找到有色彩的最左端
            }
        }
    }
    let c = document.createElement('canvas');
    // 四周空白余量
    let blankWidth = 40;
    c.width = right - left + blankWidth * 2;
    c.height = bottom - top + blankWidth * 2;
    let ctx = c.getContext('2d');
    // 设置白底
	if(!createFile) {
		ctx.fillStyle = '#fff';
	}
    // CTX 画图
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(canvas, left - blankWidth, top - blankWidth, c.width, c.height, 0, 0, c.width, c.height);
	let imgType = "image/png";
	if(!createFile) {
		imgType = "image/jpeg";
	}

    let data = c.toDataURL(imgType);

    if (createFile) {
        let parts = data.split(';base64,');
        let contentType = parts[0].split(':')[1];
        let raw = window.atob(parts[1]);
        let uInt8Array = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }
        downloadFile(uInt8Array, contentType, `${filename}.png`);
    }
    return data;
}
/**
 * @description 下载流程配置文件
 * @param {Object} data
 */
function downloadFile(data, type, filename) {
    const blob = new Blob([data], { type });
    let link = document.createElement('a');
    if (link.download !== undefined) {
        let url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
/**
 * @description 导入流程JSON文件
 * @param {Object} file
 */
export function loadFile(file) {
	return new Promise((resolve, reject) => {
	    const reader = new FileReader();
	    reader.readAsText(file);
	    reader.onerror = e => {
	    	resolve(false);
	    };
	    reader.onload = e => {
	    	resolve(e.target.result);
	    };
	})
}

/**
 * @description 流程节点输出数据
 * @params {Array} nodes 所有节点
 * @params {Array} edges 所有链接线
 */
export function sortCellDatas(nodes=[], edges=[]) {
    nodes = nodes.map(node => {
        let data = node.getData();
        node.label = data.label;
        return node;
    })
	// step1.找出开始节点
	var startNode = _.find(nodes, node => {
		let nodeData = node.data;
		return nodeData.type === 'start';
	})
	if (!startNode) {
		alert('警告：未定义流程的开始节点！');
		return null;
	}
	var startEdge = _.find(edges, e=> { return e.source.cell === startNode.id; });
	if (!startEdge) {
		alert('错误：开始节点未定义链接线！');
		return null;
	}

	var errors = [];
    // step2. 合法节点赋予stageId
    const setStageId = (cell) => {
        cell.edges = cell.edges || [];
        if (!cell.edges.length) {
	        edges.forEach(edge => {
	        	let edgeData = edge.getData() || {};
	    		if (edge.source.cell === cell.id && edgeData.logicValue && ["auto","true","state==1","state==4","subFlowResult=='end'"].includes(edgeData.logicValue)) {
	    			let node = _.find(nodes, { id: edge.target.cell});
	    			let nodeData = node.getData();
	    			if (!nodeData.stageId) {
	    				cell.edges.push({
		    				sourceId: cell.id,
		    				targetId: edge.target.cell,
		    				label: cell.label + '=>' + nodeData.label
		    			})
	    			}
	    		}
	    	})
	    }
        // console.log(cell.edges)
        if (cell.edges && cell.edges.length) {
            var nextNodes = [];
            // 循环按队列处理
        	for (let i=0; i<cell.edges.length; i++) {
        		let edge = cell.edges[i];
	            let targetNode = _.find(nodes, node => {
	                let nodeData = node.getData();
	                return nodeData.id === edge.targetId;
	            });
	            if (targetNode) {
	            	let targetNodeData = targetNode.getData();
	            	if (!targetNodeData.stageId && !["end","stop"].includes(targetNodeData.type)) {
	            		targetNodeData.stageId = cell.stageId||'';
	            		targetNode.setData(targetNodeData);
                        nextNodes.push(targetNodeData);
	            		// return setStageId(targetNodeData);
	            	}
	            }
        	}
            // 继续处理
            for (let i=0; i<nextNodes.length; i++) {
                setStageId(nextNodes[i]);
            }
        }
    }
    // 列出阶段节点并设置子集节点的stageId
    var stageNodes = [];
    nodes.forEach(node => {
        let nodeData = node.getData();
		nodeData.id = node.id;
        if (nodeData.catalog === 'stage' && nodeData.type === 'auto') {
            nodeData.stageId = nodeData.id;
            stageNodes.push(nodeData);
        } else {
            delete nodeData.stageId;
        }
        node.setData(nodeData);
    });
	var errors = [];
	// 处理节点的stageId
    console.log('stageNodes===>', stageNodes)
    for(let i=0; i<stageNodes.length; i++) {
        setStageId(stageNodes[i]);
    }
	// console.log('errors', errors)
	if (errors.length) {
		return {
			error: true,
			errors
		}
	}
	// step3 遍历节点，按流程步骤梳理顺序
	var nodeArr = resetNodeList(nodes, edges, startNode.id);
    console.log('nodeArr', nodeArr);

	// 取出阶段数据进行归类
	var newNodeArr = [];
	stageNodes = nodeArr.filter(o => o.catalog === 'stage');

	if (stageNodes.length) {
		for(let i=0; i<stageNodes.length; i++) {
			let stageNode = stageNodes[i];
			newNodeArr.push(stageNode);
			let childrenNodes =  nodeArr.filter(o => o.stageId === stageNode.stageId && o.type === 'middle');
			newNodeArr = newNodeArr.concat(childrenNodes);
		}
	} else {
		newNodeArr = nodeArr;
	}

    // 第一个节点未起始节点
    newNodeArr.unshift({
        "label": '开始',
    	"id": startNode.id,
		"catalog": "step",
		"type": "start",
		"edges": [
			{
				"edgeId": startEdge ? startEdge.id : '',
				"label": "开始",
				"sourceId": startEdge ? startEdge.source.cell : '',
				"targetId": startEdge ? startEdge.target.cell : '',
				"expression": true
			}
		]
    });

    // 最后加上终止和结束节点
    let stopNode =  _.find(nodes, node => {
    	let nodeData = node.getData();
    	return nodeData.type === 'stop';
    });
    if (stopNode) {
    	let stopNodeData = stopNode.getData();
        delete stopNodeData.event,delete stopNodeData.auth,delete stopNodeData.args,delete stopNodeData.logics;
    	newNodeArr.push(stopNodeData);
    } else {
    	errors.push({
    		error: `流程缺少结束节点！`,
    	})
    }
    let endNode =  _.find(nodes, node => {
    	let nodeData = node.getData();
    	return nodeData.type === 'end';
    });
    if (endNode) {
    	let endNodeData = endNode.getData();
        delete endNodeData.event,delete endNodeData.auth,delete endNodeData.args,delete endNodeData.logics;
    	newNodeArr.push(endNodeData);
    }
    // console.log('newNodeArr=>', newNodeArr);
	return newNodeArr;
}
/**
 * @description 根据链接线顺序同步重置节点的顺序
 * @param{Array} nodes 节点组
 * @param{Array} edges 链接线组
 * @param{String} startId 起始节点ID
 */
export function resetNodeList(nodes=[], edges=[], startId="", isRun=false) {
	var nodeArr = [];
	// 遍历节点依次组织数据
	const getNodeBySourceId = async (sourceId) => {
        let currNode = _.find(nodes, o=> o.id === sourceId);

		// 根据链接线找出下些节点
		let edgeList = _.filter(edges, e=> {
			return e.source.cell === sourceId; // e.source.cell === sourceId
		});

		// document.querySelector('g.x6-cell[data-cell-id=""]');
		let ids = [];
		for(let i=0; i<edgeList.length; i++) {
			let edge = edgeList[i];
			let targetNode = _.find(nodes, node => {
				return node.id === edge.target.cell || node.sourceId === edge.target.cell;
			});

			if (targetNode) {
				let targetNodeData = targetNode.data || targetNode.getData();
				// 是否已经存在了数组中，避免死循环
				let existsNode = _.find(nodeArr, { id:targetNodeData.id });
				if(!existsNode && !['stop','end'].includes(targetNodeData.type)) {
					ids.push(targetNodeData.id);
                    targetNodeData.id = targetNodeData.id || targetNode.id;
                    if(!isRun) {
                        let targetNodeAttrs = targetNode.getAttrs();
						let targetNodeLabel = targetNodeAttrs.text.textWrap.text || targetNodeAttrs.text.text || targetNodeData.label;
                        targetNodeData.label = targetNodeLabel.replace(/\n/g,'');

                        // 定义该节点的后续链接线数据
                        let targetNodeEdges = _.filter(edges, o => { return o.source.cell === targetNodeData.id });
                        if (targetNodeEdges) {
                        	targetNodeData.edges = targetNodeEdges.map(e => {
                        		let toNode = _.find(nodes, en => { return en.id === e.target.cell });
                        		let targetId = e.target.cell;
                        		let toNodeAttrs = toNode.getAttrs();
								let nodeLabel = toNodeAttrs.text.textWrap.text || toNodeAttrs.text.text || toNode.label;
								
                        		let eLabel = targetNodeData.label + '->' +  nodeLabel.replace(/\n/g,'');
								
                        		let obj = {
                        			edgeId: e.id,
                        			label: eLabel,
                        			sourceId: e.source.cell,
                        			targetId
                        		};
                        		let logicData = e.data;
                        		if (logicData && logicData.logicValue) {
                        			obj.expression = logicData.logicValue === 'auto' ? 'true' : logicData.logicValue || 'true';
                        		}
                        		return obj;
                        	})
                        }
                    }

					delete targetNodeData.args, delete targetNodeData.logics, delete targetNodeData.event;
					nodeArr.push(targetNodeData);
				}
			}
		}
		// 继续查找下层节点
		for(let j=0; j<ids.length; j++) {
			getNodeBySourceId(ids[j]);
		}
	}
	getNodeBySourceId(startId);

	return nodeArr;
}
