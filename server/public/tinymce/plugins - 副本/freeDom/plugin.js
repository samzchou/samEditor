tinymce.PluginManager.add('freeDom', function(editor, url) {

	var body;
	var toggleFree = false;
    const doAct = () => {
		toggleFree = !toggleFree;
		// alert('freeDom')
		body = editor.getBody();
		if (toggleFree) {
			body.style.cursor = 'crosshair';
		} else {
			body.style.cursor = null;
		}
		actEventDrag(toggleFree);
    };

	const actEventDrag = (isDrag=false) => {
		var blocks = editor.getBody().querySelectorAll('.info-block:not(.fixed,.disabled)');
		blocks.forEach(block => {
			if (isDrag) {
				block.onmousedown = (e) => {
					if(typeof block.setCapture !== 'undefined'){
						block.setCapture();
					}
					e.preventDefault();
					e.stopPropagation();

					// 记录初始x,y位置
					let clientX = e.clientX, clientY = e.clientY;
					// 鼠标按下，计算当前元素距离可视区的距离
					let disX = clientX - block.offsetLeft;
					let disY = e.pageY - editor.dom.getPos(block).y;//clientY - block.offsetTop;

					// console.log('onmousedown', disX, disY)
					let width = 0, height = 0;
					let proxyEle = editor.dom.create('div', { class:'text-box', style:`position:absolute;left:${disX}px;top:${disY}px; width:0px;height:0px;`});
					proxyEle.innerHTML = ''; // <em class="resize"></em> <p>&#8203</p>
					block.appendChild(proxyEle);
					// debugger
					block.onmousemove = (evt) => {
						evt.preventDefault();
						evt.stopPropagation();
						width = evt.clientX - clientX;
						height = evt.clientY - clientY;

						if (width < 0) {
							proxyEle.style.left = (evt.clientX - block.offsetLeft) + 'px';
						}
						if (height < 0) {
							proxyEle.style.top = (e.pageY - editor.dom.getPos(block).y) + 'px';//evt.clientY - block.offsetTop) + 'px';
						}
						
						// console.log('onmousemove', width, height)
						width = Math.abs(width);
						height =  Math.abs(height);
						proxyEle.style.width = width + 'px';
						proxyEle.style.height = height + 'px';
					};
					// 拉伸结束
					block.onmouseup = (evt) => {
						evt.preventDefault();
						evt.stopPropagation();

						block.onmousemove = null;
						block.onmouseup = null;
						block.onmousedown = null;
						toggleFree = false;
						body.style.cursor = null;
						if (width > 0 && height > 0) {
							proxyEle.dataset.type = 'text';
							proxyEle.dataset.left = evt.clientX - block.offsetLeft;
							proxyEle.dataset.top = e.pageY - editor.dom.getPos(block).y;
							editor.execCommand('textBox', proxyEle); // regEventByTextBox
						} else {
							proxyEle.remove();
						}
					};
				}
			}
		})
	}
	const dragSizeEvent = (ele, block) => {
		ele.ondblclick = (e) => {
			let index = ele.style.zIndex || 0;
			ele.style.zIndex = parseInt(index) + 1;
		}
		ele.onmousedown = (e) => {
			if(typeof ele.setCapture !== 'undefined'){
				ele.setCapture();
			}
			// e.preventDefault();
			// e.stopPropagation();
			
			ele.style.cursor = 'move';
			let startX = ele.offsetLeft, startY = ele.offsetTop;
			let clientX = e.clientX, clientY = e.clientY, disX =0, disY = 0;

			// console.log('onmousedown', clientX, clientY)
			block.onmousemove = (evt) => {
				evt.preventDefault();
				evt.stopPropagation();
				disX = startX + evt.clientX - clientX;
				disY = startY + evt.clientY - clientY;
				// console.log('onmousemove', disX, disY)
				ele.style.left = disX + 'px';
				ele.style.top = disY + 'px';
			};
			block.onmouseup = (evt) => {
				block.onmousemove = null;
				block.onmouseup = null;
				ele.style.cursor = null;

				if (sizeEle) {
					sizeEle.onmousemove = null;
					sizeEle.onmouseup = null;
				}
			};
		}
		var sizeEle = ele.querySelector('em');
		if (sizeEle) {
			sizeEle.onmousedown = (e) => {
				if(typeof sizeEle.setCapture !== 'undefined'){
					sizeEle.setCapture();
				}

				e.preventDefault();
				e.stopPropagation();

				let clientX = e.clientX, clientY = e.clientY, width = sizeEle.parentNode.offsetWidth, height = sizeEle.parentNode.offsetHeight;
				console.log('sizeEle.onmousedown', width, height)
				block.onmousemove = (evt) => {
					evt.preventDefault();
					evt.stopPropagation();
					let eleEidth = width + evt.clientX - clientX;
					let eleHeight = height + evt.clientY - clientY;
					// console.log('onmousemove', width, height)
					eleEidth = Math.abs(eleEidth);
					eleHeight = Math.abs(eleHeight);
					ele.style.width = eleEidth + 'px';
					ele.style.height = eleHeight + 'px';
				};
				block.onmouseup = (evt) => {
					evt.preventDefault();
					evt.stopPropagation();
					block.onmousemove = null;
					block.onmouseup = null;
				};
			}
		}
	}

	// 设置按钮状态
    var toggleState = editor => {
        let disabled = false;
        let currNode = editor.selection.getNode();
        let parentBlock = editor.dom.getParent(currNode, '.info-block');
        disabled = !parentBlock ? true : (editor.dom.hasClass(parentBlock, 'fixed') || parentBlock.dataset.enlock !== undefined || !parentBlock.isContentEditable);
		if (!disabled) {
			let olList = parentBlock.querySelectorAll('.ol-list,.appendix-list');
			disabled = olList.length > 0;
		}

        return disabled;
    }

	editor.ui.registry.addButton('freeDom', {
		active: true,
        icon: 'gamma',
		text: 'Text Box',
        tooltip: 'Text Box',
        onAction: function () {
          doAct();
        },
		onSetup: (api) => {
            var nodeChangeHandler = (e) => {
                let disabled = toggleState(editor);
                api.setDisabled(disabled);
            };
            editor.on('NodeChange', nodeChangeHandler);
            return () => {
                return editor.off('NodeChange', nodeChangeHandler);
            };
        }
	});
	editor.ui.registry.addMenuItem('freeDom', {
        icon: 'gamma',
        text: 'Text Box',
        onAction: function () {
			doAct();
        },
		onSetup: (api) => {
            let disabled = toggleState(editor);
            api.setDisabled(disabled);
        }
	});

	// 上下文菜单
	editor.ui.registry.addContextMenu('freeDom', {
		update: function (element) {
			return editor.dom.hasClass(element, 'tag')|| element.dataset.tag ? 'removeTag' : ''; //editor.dom.dataset.tag ? 'removeTag' : '';
		}
	});


    return {
        getMetadata: function() {
            return {
                name: 'freeDom',
                url: "http://www.bzton.cn",
            };
        }
    };
})
