tinymce.PluginManager.add('catalogue', function(editor, url) {
    var pluginName = 'toc';

    var fromPageData = function() {
		var catalogues = editor.settings.doc_config.catalogues;
		return catalogues;
    };

    var doAction = function() {
        editor.windowManager.open({
            title: 'toc items',
            body: {
                type: 'panel',
				items: [
					{
						type: 'label',
						label: '默认的目次内容',
						items: [
							{
								type: "grid",
                                columns: 6,
								group: true,
								items: [
									{
										type: 'checkbox',
										name: 'type1',
										disabled: true,
										label: '前言'
									},
									{
										type: 'checkbox',
										name: 'type2',
										disabled: true,
										label: '引言'
									},
									{
										type: 'checkbox',
										name: 'type3',
										disabled: true,
										label: '章标题'
									},
									{
										type: 'checkbox',
										name: 'type4',
										disabled: true,
										label: '附录'
									},
									{
										type: 'checkbox',
										name: 'type5',
										disabled: true,
										label: '参考文献'
									},
									{
										type: 'checkbox',
										name: 'type6',
										disabled: true,
										label: '索引'
									}
								]
							}
						]
					},
					{
						type: 'label',
						label: '可选的目次内容',
						items: [
							{
								type: "grid",
                                columns: 3,
								items: [
									{
										type: 'checkbox',
										name: 'leve11',
										label: '一级条标题'
									},
									{
										type: 'checkbox',
										name: 'leve12',
										label: '二级条标题'
									},
									{
										type: 'checkbox',
										name: 'leve13',
										label: '三级条标题'
									},
								]
							},
							{
								type: "grid",
                                columns: 3,
								items: [
									{
										type: 'checkbox',
										name: 'leve14',
										label: '四级条标题'
									},
									{
										type: 'checkbox',
										name: 'leve15',
										label: '五级条标题'
									},
									
								]
							},
							{
								type: "grid",
                                columns: 3,
								items: [
									{
										type: 'checkbox',
										name: 'appendix0',
										label: '附录章标题'
									},
									{
										type: 'checkbox',
										name: 'appendix1',
										label: '附录一级条标题'
									},
									{
										type: 'checkbox',
										name: 'appendix2',
										label: '附录二级条标题'
									},
								]
							},
							{
								type: "grid",
                                columns: 3,
								items: [
									{
										type: 'checkbox',
										name: 'appendix3',
										label: '附录三级条标题'
									},
									{
										type: 'checkbox',
										name: 'appendix4',
										label: '附录四级条标题'
									},
									{
										type: 'checkbox',
										name: 'appendix5',
										label: '附录五级条标题'
									}
								]
							},
							{
								type: "grid",
                                columns: 3,
								items: [
									{
										type: 'checkbox',
										name: 'imgTitle',
										label: '图标题'
									},
									{
										type: 'checkbox',
										name: 'tableTitle',
										label: '表标题'
									}
								]
							},
						]
					},
                ]
            },
            buttons: [
                {
                    type: 'cancel',
                    name: 'closeButton',
                    text: 'Cancel'
                },
                {
                    type: 'submit',
                    name: 'submitButton',
                    text: 'Ok',
                    primary: true
                }
            ],
            initialData: fromPageData(),
            onSubmit: function (api, details) {
                var data = api.getData();
				console.log('onSubmit',data);
				editor.execCommand('toggleCatalogue', data);
				api.close();
            },
        })
    };

    const checkUseCatalogue = editor => {
    	var docConfig = editor.settings.doc_config || {};
    	if (docConfig?.notCatalogue) {
    		return true;
    	}
    	return false;
    }


    editor.ui.registry.addButton('catalogue', {
        text: pluginName,
        tooltip: pluginName,
        onAction: () => {
			doAction();
		},
		onSetup: (api) => {
			var nodeChangeHandler = (e) => {
                let disabled = checkUseCatalogue(editor);
                api.setDisabled(disabled);
            };
            editor.on('NodeChange', nodeChangeHandler);
            return () => {
                return editor.off('NodeChange', nodeChangeHandler);
            };
        }
    });

    editor.ui.registry.addMenuItem('catalogue', {
        text: pluginName,
        tooltip: pluginName,
        onAction: function () {
            doAction();
        },
        onSetup: (api) => {
			var nodeChangeHandler = (e) => {
                let disabled = checkUseCatalogue(editor);
                api.setDisabled(disabled);
            };
            editor.on('NodeChange', nodeChangeHandler);
            return () => {
                return editor.off('NodeChange', nodeChangeHandler);
            };
        }
    });


    return {
        getMetadata: function() {
            return {
                name: pluginName,
                url: "http://www.bzton.cn",
            };
        }
    };
})
