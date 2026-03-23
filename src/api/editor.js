import request from '@/utils/request';
var protocal = process.env.VUE_APP_EDITOR_URL;

/* if(process.env.NODE_ENV !== 'development'){
    protocal = process.env.VUE_APP_EDITOR_URL;
}
 */

// AI智能问答
export function aiMessage(data, url="", method="post", isStream=false) {
    var params = {
        url,
        method,
        timeout: 600000,
        data,
    }
    if (isStream) {
        params.responseType = 'stream';
    }

    return new Promise((resolve, reject) => {
        request(params).then(response => {
            resolve(response);
        }).catch(error => {
            resolve(null);
        })
    });
}

// AI智能接口
export function getAiContent(url, data) {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url,
            method: 'post',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

/**
 * @description 获取编辑器配置文件
 * @param {Object}  data { tmplId:"", tmplType:0, content:""}
 */
export function getConfigs(url) {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/config/configKey/editor.setting.urls',
            method: 'get'
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

/**
 * @description 新增文档正文
 * @param {Object}  data { tmplId:"", tmplType:0, content:""}
 */
export function addContent(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/content',
            method: 'post',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}
/**
 * @description 编辑文档正文
 * @param {Object}  data { tmplId:"", tmplType:0, content:""}
 */
export function updateContent(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/content',
            method: 'put',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

/**
 * @description 编辑文档正文
 * @param {Object}  data { tmplId:"", tmplType:0, content:""}
 */
export function getContent(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/content/list',
            method: 'post',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

/**
 * @description 新增内容模板配置
 * @param {Object}  data { tmplId:"", tmplType:0, content:""}
 */
export function addContentTemplate(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/contentTemplate',
            method: 'post',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

/**
 * @description 修改内容模板配置
 * @param {Object}  data { tmplId:"", tmplType:0, content:""}
 */
export function editContentTemplate(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/contentTemplate',
            method: 'put',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

/**
 * @description 获取内容模板配置列表
 * @param {Object}  data { }
 */
export function listContentTemplate(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/contentTemplate/list',
            method: 'post',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

/**
 * @description 获取文档标签设置列表
 * @param {Object}  data { }
 */
export function listTempTags(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/contentTemplateTag/list',
            method: 'post',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

/**
 * @description 新增文档标签设置列表
 * @param {Object}  data { }
 */
export function addTempTags(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/contentTemplateTag',
            method: 'post',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

/**
 * @description 修改文档标签设置列表
 * @param {Object}  data { }
 */
export function editTempTags(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/contentTemplateTag',
            method: 'put',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}


// 搜索题录信息
export function quoteSearchStandard(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/quoteSearch/standard',
            method: 'post',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

// 搜索术语信息
export function lemmaList(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/lemma/list',
            method: 'post',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

// 新增征求意见
export function opinionAdd(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/editor/opinion',
            method: 'post',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

// 更新征求意见
export function opinionUpdate(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/editor/opinion',
            method: 'put',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

// 征求意见列表
export function opinionList(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/editor/opinion/list',
            method: 'post',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}
