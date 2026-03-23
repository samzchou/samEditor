/**
 * =================================================
 * @vuedoc
 * @exports tinymce/plugins/bzton/plugins
 * @module
 * @desc 标准同编辑器插件合集
 * @author sam 2021-08-16
 * =================================================
 */

(function() {
    'use strict';
    var global = tinymce.util.Tools.resolve('tinymce.PluginManager');
    var collectionPlugins = [{
        name: 'close-btn',
        icon: 'close-btn',
        tooltip: 'Close',
        text: 'Close',
        cmd: 'close'
    },/*{
        name: 'save-btn',
        icon: 'save-btn',
        tooltip: '保存文档',
        text: '保存',
        cmd: 'save'
    },*/
	/* {
        name: 'save-btn',
        icon: 'save-btn',
        tooltip: '保存文档',
        text: '保存',
        act: 'save',
		children: [
            {
                text: '保存',
                tooltip: '直接保存',
                act: 'save'
            },
            {
                text: '另存为',
                tooltip: '另存为',
                act: 'saveas'
            }
        ]
    }, */
    {
        name: 'cover',
        text: 'cover',
        cmd: 'addCover'
    },
    {
        name: 'prefaceWord',
        text: 'prefaceWord', // 前言
        cmd: 'prefaceWord'
    },
    {
        name: 'introWord',
        text: 'introWord', // 引言
        cmd: 'introWord'
    },
    {
        name: 'chapterWord',
        text: 'chapterWord', // 章节
        cmd: 'chapterWord'
    },
    {
        name: 'addendixWord',
        text: 'addendixWord',
        cmd: 'addendixWord'
    },
    {
        name: 'referenceWord',
        text: 'referenceWord',  // 参考文献
        cmd: 'referenceWord'
    },
    {
        name: 'indexWord',
        text: 'indexWord', // 索引
        cmd: 'indexWord'
    },

    {
        name: 'insertTag',
        text: 'insertTag', // 掺入标签
        tooltip:'insertTag',
        act: 'insertTag'
    },
    {
        name: 'unlock',
        text: 'unlock',
        tooltip:'unlock',
        cmd: 'unlock'
    },

    {
        name: 'setCatalogue',
        text: 'show/hide toc',
        tooltip:'show/hide toc',
        act: 'setCatalogue',
        children: [
            {
                text: 'show toc',
                tooltip: 'show toc',
                act: 'show'
            },
            {
                text: 'hide toc',
                tooltip: 'hide toc',
                act: 'hide'
            }
        ]
    },

    {
        name: 'language',
        text: 'Language',
        act: 'setLanguage',
        children: [
            {
                text: 'Chinese',
                act: 'zh_CN'
            },
            {
                text: 'English',
                act: 'en'
            }
        ]
    },

    {
        name: 'breakPage',
        text: 'Break Page',
        tooltip:'Break Page',
        act: 'breakPage',
        children: [
            {
                text: 'Current Page',
                tooltip: 'Current Page',
                act: 'currPage'
            },
            {
                text: 'All Pages',
                tooltip: 'All Pages',
                act: 'all'
            }
        ]
    },

    {
        name: 'insertCheckList',
        icon: 'spell-check',
        text: '选框',
        tooltip: '插入选框',
        cmd: 'insertCheckList'
    },

    {
        name: 'compare',
        icon: 'flip-horizontally',
        tooltip: '比较正文内容',
        cmd: 'compare'
    },
    {
        name: 'compare-content',
        icon: 'flip-horizontally',
        text: '比较内容',
        tooltip: '比较正文内容',
        cmd: 'compare'
    },

    {
        name: 'copyEntry',
        icon: 'duplicate',
        tooltip: '复制当前条目',
        cmd: 'copyEntry'
    },

    {
        name: 'copyNode',
        icon: 'duplicate',
        text: '复制条目',
        tooltip: '复制当前条目',
        cmd: 'copyEntry'
    },

    {
        name: 'clearFormat',
        text: 'clear all format',
        tooltip: 'clear all format',
        cmd: 'clearFormat'
    },

    {
        name: 'insertNode',
        text: '插入条目',
        tooltip: '插入新条目',
        icon: 'browse',
        act: 'insertNode',
        children: [
            {
                text: '当前条目后',
                act: 'after'
            },
            {
                text: '当前条目前',
                act: 'before'
            }
        ]
    },

    {
        name: 'setQueue',
        text: 'setQueue', // 列项
        act: 'setQueue',
        children: [
            {
                text: '一级列项（破折号）',
                act: 'queue1'
            },
            {
                text: '二级无标题',
                act: 'queue2'
            },
            {
                text: '三级无标题',
                act: 'queue3'
            },
            {
                text: '四级无标题',
                act: 'queue4'
            },
            {
                text: '五级无标题',
                act: 'queue5'
            }
        ]
    },

	{
        name: 'mergePage',
        text: 'merge page', // 文档合并
        act: 'mergePage',
		children: [
            {
                text: 'merge next page',
                tooltip: 'merge next page',
                act: 'next'
            },
            {
                text: 'merge all page',
                tooltip: 'merge all page',
                act: 'all'
            }
        ]
    },{
        name: 'remove-btn',
        icon: 'cut',
        tooltip: '删除元素',
        text: '删除',
        cmd: 'cut'
    },{
        name: 'bold-btn',
        icon: 'bold-btn',
        text: '黑体',
        tooltip: '设置为黑体',
        act: 'bold'
    },{
        name: 'paragraph-btn',
        icon: 'paragraph-btn',
        text: 'Insert Paragraph',
        tooltip: 'Insert Paragraph',
        act: 'paragraph'
    },{
        name: 'charmap-btn',
        icon: 'insert-character',
        text: 'Special Characters',
        tooltip: 'Special Characters',
        cmd: 'showCharmap'
    },{
        name: 'title-block',
        icon: 'line',
        text: '标题',
        tooltip: '插入一个页面标题',
        cmd: 'titleBlock'
    },{
        name: 'zhu-btn',
        text: 'Label Tag',
        tooltip: 'Label Tag',
        act: 'toggleZhu',
        children: [
            {
                text: 'General Label Tag',
                act: 'zhu'
            },
            {
                text: 'Label Number',
                act: 'zhux'
            },
            {
                text: 'Label First Number',
                act: 'zhu-x'
            },
            {
                text: 'set Number',
                cmd: 'resetx'
            }
        ]
    },
    {
        name: 'insert-page',
        text: 'insert page',
        tooltip: 'insert page',
        act: 'insertPage',
        children: [
            {
                text: 'cover page',
                act: 'insertCover'
            },
            {
                text: 'toc page',
                act: 'insertToc'
            },
            {
                text: 'empty page',
                act: 'insertEmpty'
            },
            /*{
                text: 'insert after',
                act: 'insertAfter'
            },*/
        ]
    },
    {
        name: 'example-btn',
        text: 'Example Tag',
        tooltip: 'Example Tag',
        act: 'toggleZhu',
        children: [
            {
                text: 'General Example',
                act: 'example'
            },
            {
                text: 'Example Number',
                act: 'examplex'
            },
            {
                text: 'Example First Number',
                act: 'example-x'
            },
            {
                text: 'set Number',
                cmd: 'resetx'
            }
        ]
    },
    {
        name: 'zhu-imgtable',
        text: 'table note',
        act: 'toggleZhuImgTable',
        children: [
            {
                text: 'normal table note',
                type: 'img-table',
                act: 'zhu'
            },
            {
                text: 'table note X',
                type: 'img-table',
                act: 'zhux'
            },
            {
                text: 'first table note X',
                type: 'img-table',
                act: 'zhu-x'
            }
        ]
    },

    {
        name: 'footer-btn',
        text: 'footer note',
        act: 'toggleFooter',
        children: [
            {
                text: 'footnotes to articles', // 条文脚注
                act: 'footer'
            },
            {
                text: 'table footnotes', // 表脚注
                act: 'tfooter'
            },
            {
                text: 'footnotes to the first table', // 首表脚注
                act: 'tfooter-x'
            },
            {
                text: 'footnotes to the image', // 图脚注
                act: 'imgfooter'
            },
            /*{
                text: '首图脚注',
                act: 'imgfooter-x'
            }*/
        ]
    },
    {
        name: 'quickOutComment',
        text: 'annotations', // 批注
        tooltip: 'annotations',
        cmd: 'quickOutComment'
    },
    {
        name: 'quickOutReview',
        text: '审阅',
        tooltip: '审阅',
        cmd: 'quickOutReview'
    },
    {
        name: 'quickOutFeedback',
        text: '反馈',
        tooltip: '反馈',
        cmd: 'quickOutFeedback'
    },
    {
        name: 'imgtitle',
        text: 'image title', // 图标题
        tooltip: 'image title',
        cmd: 'toggleImageTitle'
    },
    {
        name: 'tabletitle', // 表标题
        text: 'table title',
        tooltip: 'table title',
        cmd: 'toggleTableTitle'
    },
    /*{
        name: 'imgtitle-btn',
        text: '图标题',
        tooltip: '图标题',
        act: 'toggleImageTitle',
        children:[
            {
                text: '一般标题',
                tooltip: '一般标题',
                act: 'normal'
            },
            {
                text: '图X标题',
                tooltip: '带序号标题',
                act: 'number'
            }
        ]
    },*/
    {
        name: 'finished-btn',
        text: 'end line', // 终结线
        tooltip: 'end line',
        act: 'finished'
    },
    {
        name: 'references',
        text: 'DMS数据',
        tooltip: 'DMS数据',
        act: 'references',
        children:[
            {
                text: 'TC技术委员会',
                tooltip: 'TC技术委员会',
                act: 'tcs'
            },
            {
                text: '标准化专家',
                tooltip: '标准化专家',
                act: 'expert'
            },
            {
                text: '起草/归口单位',
                tooltip: '起草/归口单位',
                act: 'committee'
            },
        ]
    },
    {
        name: 'commentBtn',
        text: 'annotations',
        tooltip: 'annotations',
        cmd: 'comment'
    },{
        name: 'page-type',
        text: 'page type', // 排版
        tooltip: 'page type',
        act: 'togglePageType',
        children:[
            {
                text: 'single sided',//单面排版
                tooltip: 'single sided',
                act: 'singleSided'
            },
            {
                text: 'double sided',//双面排版
                tooltip: 'double sided',
                act: 'doubleSided'
            }
        ]
    },{
        name: 'quote-btn',
        text: '引用',
        tooltip: '引用',
        act: 'importQuote',
        children:[
            {
                text: '标准题录引用',
                tooltip: '标准题录引用',
                act: 'std'
            },
            {
                text: '标准条款引用',
                tooltip: '标准条款引用',
                act: 'clause'
            },
            {
                text: '引用汇总',
                tooltip: '引用汇总',
                act: 'collect'
            }
        ]
    },
    {
        name: 'validatDms',
        text: '文档扫描',
        cmd: 'validatDms'
    },
    {
        name: 'readDoc',
        text: '阅读文档',
        cmd: 'readDoc'
    },
    {
        name: 'knowledgeGraph',
        text: '知识图谱',
        cmd: 'knowledgeGraph'
    },
    /*{
        name: 'validateFormat',
        text: '元素格式及关联性校验',
        cmd: 'validateFormat'
    },*/
    {
        name: 'translation-En',
        text: '在线英文翻译',
        cmd: 'translation-En'
    },
    {
        name: 'audioToText',
        text: '语音录入',
        cmd: 'audioToText'
    },
    ];

    // 贯标移到当前node的最后位置
    var moveSelectionToElement = (editor, element, extraBr) => {
        editor.selection.select(element, true);
        editor.selection.collapse(false);
    };

    // 切换按钮状态
    var toggleButtonState = (editor, item) => {
        return (api) => {
            var nodeChangeHandler = (e) => {
                let disabled = getState(editor) && item.name !== 'close-btn';
                api.setDisabled(disabled); // window.isInputing
            };
            editor.on('NodeChange', nodeChangeHandler);
            return () => {
                return editor.off('NodeChange', nodeChangeHandler);
            };
        }
    }

    var doAction = (editor, item) => {
        editor = window.tinyMCE.activeEditor;
        var currNode = editor.selection.getNode();
        if (currNode.nodeName === 'BODY' && item.cmd !== 'close') {
            return;
        }
        var parentNode = currNode.parentNode;
        var newEle;

        if (item.cmd) {
            return editor.execCommand('bztonCmd', false, item.cmd);
        } else if(item.act) {
            switch(item.act) {
                // 粗体
                case 'bold':
                    editor.execCommand('bold');
                    break;
                // 插入一个段落
                case 'paragraph':
                    if(editor.dom.hasClass(parentNode, 'header-title')) {
                        newEle = editor.dom.create('p', {}, '<p>段落文字</p>');
                        editor.dom.insertAfter(newEle, parentNode);
                        editor.undoManager.add();
                    } else {
                        editor.execCommand('bztonCmd', false, 'insertParagraph'); //&#8203
                    }
                    break;
                // 终结线
                case 'finished':
                    editor.execCommand('mceInsertContent', false, `<div class="${item.act}"><hr width="33%" />&#8203</div>`);
                    break;
                // 术语引用
                case 'importQuote':
                    editor.execCommand('importQuote',  { act:'addTerm' }, currNode);
                    break;
                    // 插入一个标签
                case 'insertTag':
                    editor.execCommand('mceInsertContent', false, `<span class="tag other" data-tag="tagName" data-name="设置标签">设置标签</span>`);
                    break;
            }
        }
    }

    // 一般按钮
    var addButton = (editor, item) => {
        var data = {
            tooltip: item.tooltip,
            text: item.text,
            onAction: () => {
                doAction(editor, item);
            }
        }
        if(item.icon) {
            data.icon = item.icon;
        }
        editor.ui.registry.addButton(item.name, {
            ...data,
            onSetup: toggleButtonState(editor, item)
        });
        editor.ui.registry.addMenuItem(item.name, {
            ...data,
            onSetup: toggleState(editor, item)
        });
    }

	var removeDomTag = (editor, tagNode) => {
        let tagId = tagNode.dataset.tagid;
        const body = editor.getBody();

        const tagNodes = Array.from(body.querySelectorAll(`[data-tagid="${tagId}"]`));

        for (let node of tagNodes) {
            // debugger
            if (!editor.dom.hasClass(node, 'ol-list') && !editor.dom.hasClass(node, 'appendix-list')) {
                let parentNode = node.parentNode;
                let prevNode = node.previousSibling;
                let nextNode = node.nextSibling;
                if (prevNode && prevNode.nodeName === '#text') {
                    prevNode.textContent = prevNode.textContent + node.textContent;
                } else if (nextNode && nextNode.nodeName === '#text') {
                    nextNode.textContent = node.textContent + nextNode.textContent;
                } else {
                    let textNode = document.createTextNode(node.textContent);
                    editor.dom.insertAfter(textNode, node);
                }
                node.remove();

                Array.from(parentNode.childNodes).forEach(n => {
                    let pNode = n.previousSibling;
                    if (n.nodeName === '#text' && pNode && pNode.nodeName === '#text') {
                        pNode.textContent = pNode.textContent + n.textContent;
                        n.remove();
                    }
                })
            } else {
                editor.dom.removeClass(node, 'tag');
                editor.dom.removeClass(node, node.getAttribute('data-tag'));
                node.removeAttribute('data-tag');
                node.removeAttribute('data-tagtitle');
                node.removeAttribute('data-tagid');
            }
        }
        // editor.execCommand('removeTag', tagId);
        editor.execCommand('bztonCmd', tagId, 'removeTag');
	}

    var getState = (editor, item) => {
        var currNode = editor.selection.getNode();
        if (currNode) {
            if (currNode.nodeName === 'BODY' || currNode.parentNode.nodeName === 'BODY') {
                return true;
            }
            var parentBlock = editor.dom.getParent(currNode, '.info-block');

            var disabled = !parentBlock ? true : (editor.dom.hasClass(parentBlock, 'fixed') || parentBlock.dataset.enlock !== undefined || !parentBlock.isContentEditable);
            // 本身是条目的，且为被锁定正在编辑的
            var olEle = editor.dom.getParent(currNode, '.ol-list') || editor.dom.getParent(currNode, '.appendix-list');
            if (olEle) {
                disabled = editor.dom.hasClass(olEle, 'disabled'); // || currNode.dataset.index.length === item.indexLens;
            }
            return disabled;
        }
        return true;
    };

    var toggleState = (editor, item) => {
        return (api) => {
            var flag = getState(editor, item) && item.name !== 'close-btn';
            return api.setDisabled(flag);
        }
    };

    // 下拉菜单按钮
    var addMenuButton = (editor, item) => {
        let items = [];
        for(let i=0; i<item.children.length; i++) {
            let db = item.children[i];
            items.push({
                type: 'menuitem',
                text: db.text,
                tooltip: db.tooltip,
                onAction: () => {
                    var currNode = editor.selection.getNode();
                    if (currNode.nodeName === 'BODY') {
                        return false;
                    }
                    editor.execCommand(item.act, db, currNode);
                }
            })
        }

        let data = {
			icon: item.icon,
            text: item.text,
            tooltip: item.tooltip,
            fetch: callback => {
                callback(items);
            },
            onSetup: toggleButtonState(editor, item)
        }
        if(item.icon) {
            data.icon = item.icon;
        }

		// 菜单栏主按钮
        editor.ui.registry.addMenuButton(item.name, data);

		// 菜单栏下拉式二级菜单
		editor.ui.registry.addNestedMenuItem(item.name, {
			icon: item.icon,
			text: item.text,
			getSubmenuItems: function () {
				return items;
			}
		});

        // 关闭快捷键
        editor.shortcuts.add('meta+q', "close editor", function() {
            editor.execCommand('bztonCmd', false, 'close');
        });

		// 移除标签上下文菜单
		editor.ui.registry.addMenuItem('removeTag', {
			icon: 'comment',
			text: '移除标签',
			onAction: () => {
				var currNode = editor.selection.getNode();
                if (currNode.nodeName === 'BODY') {
                    return;
                }
				if (editor.dom.hasClass(currNode, 'tag') || currNode.dataset.tag) {
					editor.windowManager.confirm('确定要移除标签？', flag => {
						if(flag) {
							if (currNode.nodeName === 'SPAN') {
								editor.formatter.remove('setTags', { class:currNode.className, title:currNode.getAttribute('title'), value:currNode.dataset.tag, id:currNode.dataset.id, tid:currNode.dataset.tid, content:currNode.dataset.content }, currNode);
							}
							removeDomTag(editor, currNode);
						}
					})
				}
			},
            // onSetup: toggleButtonState(editor)
		});
        editor.ui.registry.addContextMenu('removeTag', {
            update: (element) => {
                var checkReset = editor.dom.hasClass(element, 'tag');
                return checkReset ? 'removeTag' : '';
            }
        });

		// 标签上下文菜单
        editor.ui.registry.addMenuItem('quickTag', {
            icon: 'comment-add',
            text: '标签',
            onAction: () => {
                editor.execCommand('bztonCmd', false, 'addTag');
            }
        });
        editor.ui.registry.addContextMenu('quickTag', {
            update: (element) => {
                var parentNode = editor.dom.getParent(element,'.info-block');
                var checkReset = parentNode && !editor.dom.hasClass(parentNode, 'fixed') && !editor.dom.hasClass(element, 'tag');
                return checkReset ? 'quickTag' : '';
            }
        });

        const aiMenus = [
            {
                type: 'menuitem',
                text: 'rewrite', // 重写
                onAction: () => {
                    editor.execCommand('aiCmd', 'rewrite');
                }
            },
            {
                type: 'menuitem',
                text: 'expand', // 展开内容
                onAction: () => {
                    editor.execCommand('aiCmd', 'expand');
                },
                /*onSetup: (api) => {
                	api.setDisabled(true);
                }*/
            },
            {
                type: 'menuitem',
                text: 'doc quote', // 引用
                onAction: () => {
                    editor.execCommand('aiCmd', 'quote');
                },
                onSetup: (api) => {
                	api.setDisabled(true);
                }
            },
            {
                type: 'menuitem',
                text: 'indicators',  // 插入指标
                onAction: () => {
                    editor.execCommand('aiCmd', 'indicators');
                },
                onSetup: (api) => {
                	api.setDisabled(true);
                }
            },
            {
                type: 'menuitem',
                text: 'ai Formula', // 生成公式
                onAction: () => {
                    editor.execCommand('aiCmd', 'formula');
                },
                onSetup: (api) => {
                	api.setDisabled(true);
                }
            },
            /* {
                type: 'menuitem',
                text: 'ai Image', // 生成图片
                onAction: () => {
                    editor.execCommand('aiCmd', false, { act:'insertImage' });
                }
            },

            {
                type: 'menuitem',
                text: 'build Data', // 构建主数据
                onAction: () => {
                    editor.execCommand('aiCmd', 'buildData');
                }
            },
            */
        ]

        // AI
        /*editor.ui.registry.addMenuItem('quickAi', {
            icon: 'ai',
            text: 'AI小助手',
            onAction: () => {
                editor.execCommand('bztonCmd', false, 'aioutline');
            }
        });*/

        editor.ui.registry.addNestedMenuItem('quickAi', {
            icon: 'ai',
            text: 'ai Tool',
            getSubmenuItems: function () {
                return aiMenus;
            }
        });

        editor.ui.registry.addMenuButton('aiTool', {
            icon: 'ai',
            text: 'ai Tool',
            fetch: function (callback) {
                callback(aiMenus)
            },
        });
        // console.log(tinyMCE.settings.aiAssistant)
        // debugger
        var aiBt = [
            {
                type: 'menuitem',
                text: 'doc model',
                act: 'docModel',
                onAction: () => {
                    editor.execCommand('aiEditor', 'docModel');
                }
            },
            {
                type: 'menuitem',
                text: 'ai editor',
                act: 'docAi',
                onAction: () => {
                    editor.execCommand('aiEditor', 'docAi');
                }
            },
            {
                type: 'menuitem',
                text: 'ai knowledge',
                act: 'docKnowledge',
                onAction: () => {
                    editor.execCommand('aiEditor', 'docKnowledge');
                }
            },
            {
                type: 'menuitem',
                text: 'ai comparison',
                act: 'docComparison',
                onAction: () => {
                    editor.execCommand('aiEditor', 'docComparison');
                }
            },
            {
                type: 'menuitem',
                text: 'ai duplicate',
                act: 'docDuplicate',
                onAction: () => {
                    editor.execCommand('aiEditor', 'docDuplicate');
                }
            },
        ];
        if (tinyMCE.settings.aiAssistant) {
            let ls = [];
            tinyMCE.settings.aiAssistant.forEach(o => {
                let it = aiBt.find(t => t.act === o.act)
                if(it) {
                    it.text = o.text;
                    ls.push(it);
                }
            })
            aiBt = ls;
        }

        editor.ui.registry.addMenuButton('aiEditor', {
            icon: 'ai-bzton',
            text: 'ai bzton',
            fetch: function (callback) {
                callback(aiBt)
            },
            /*onAction: function () {
                editor.execCommand('aiEditor', false);
            }*/
        });

        // 批注 quick bar
        /* editor.ui.registry.addContextToolbar('quickComment', {
            predicate: function(node) {
                return node.nodeName === 'P';
            },
            items: 'quickComment',
            position: 'node'
        }); */
    }

    function Plugin() {
        global.add('bzton', function(editor) {
            for(let i=0; i<collectionPlugins.length; i++) {
                var item = collectionPlugins[i];
                if(item.children) {
                    addMenuButton(editor, item);
                } else {
                    addButton(editor, item);
                }
            }
        });
    }

    Plugin();

}());
