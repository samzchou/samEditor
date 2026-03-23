/**
 * http://192.168.0.140:9088/swagger-ui.html#/%E7%BC%96%E8%BE%91%E5%99%A8%E6%96%87%E6%A1%A3%E6%A0%87%E7%AD%BE%E6%8E%A5%E5%8F%A3_-_EdtDocTagController
 */

import request from '@/utils/request';

var protocal = "";

/* if(process.env.NODE_ENV !== 'development'){
    protocal = process.env.VUE_APP_EDITOR_URL;
} */

/**
 * @description 查询编辑器结构化文档列表
 * @param {data}  = {"pageNum": 1,  "pageSize": 10}
 */
export function docStructList(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/document/structList',
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
 * @description 查询编辑器文档结构化大纲列表
 * @param {data}  = {"docId": ""}
 */
export function outlineStructList(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/outline/structList',
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
 * @description 查询编辑器结构化文档模板列表
 * @param {data}  = {"docId": ""}
 */
export function contentTemplateStructList(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/contentTemplate/structList',
            method: 'post',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}


// 获取文档列表
export function listDocument(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/document/list',
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

// 保存文档
export function saveDocument(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/document',
            method: 'post',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}
// 修改文档
export function updateDocument(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/document',
            method: 'put',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

// 删除文档
export function deleteDocument(docIds='', url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/document/' + docIds,
            method: 'delete'
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

// 获取文档信息
export function getDocument(docId, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/document/' + docId,
            method: 'get'
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

// 检索大纲列表
export function listOutline(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/outline/list',
            method: 'post',
            data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}


// 批量新增或修改大纲数据
export function batchUpdateOutline(data=[], url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/outline/saveOutlineData',
            method: 'post',
            data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

// 修改大纲数据
export function updateOutline(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/outline',
            method: 'put',
            data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

// 批量删除大纲数据
export function batchDeleteOutline(ids="", url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/outline/' + ids,
            method: 'delete'
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}
// 获取单条大纲数据
export function getOutlineData(id="", url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/outline/' + id,
            method: 'get'
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

// 获取大纲锁定列表
export function getLockedList(docId='', url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/outline/getLockedList/' + docId,
            method: 'get'
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

// 清空大纲锁定列表
export function clearLocked(docId='', url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/outline/clearLocked/' + docId,
            method: 'get'
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

// 设置大纲锁定
/*
{
  "docId": "string",
  "lockedOutlineId": "string",
  "unlockOutlineId": "string",
  "userId": "string",
  "userName": "string"
}
*/
export function setLockOutline(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/outline/setLockOutline',
            method: 'post',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    });
}

// 设置文档锁定或解锁
/* {
  "docId": "string",
  "isLocked": 0,
  "userId": "string",
  "userName": "string"
} */
export function setLockDocument(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/document/setLockDocument',
            method: 'post',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    });
}

export function getLockedData(docId="", url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/document/getLockedData/' + docId,
            method: 'get'
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    });
}

// 标签列表
export function tagList(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/tag/list',
            method: 'post',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}
