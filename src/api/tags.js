/**
 * http://192.168.0.140:9088/swagger-ui.html#/%E7%BC%96%E8%BE%91%E5%99%A8%E6%96%87%E6%A1%A3%E6%A0%87%E7%AD%BE%E6%8E%A5%E5%8F%A3_-_EdtDocTagController
 */

import request from '@/utils/request';

var protocal = "";

/* if(process.env.NODE_ENV !== 'development'){
    protocal = process.env.VUE_APP_EDITOR_URL;
} */

// 获取标签列表
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

// 批量新增、更新标签
export function saveTagData(data=[], url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/tag/saveTagData',
            method: 'post',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

// 新增标签
export function addTag(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/tag',
            method: 'post',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}
// 删除标签
export function removeTag(ids="", url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/tag/' + ids,
            method: 'delete'
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

// 更新标签
export function updateTag(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/tag',
            method: 'put',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

// 获取标签树列表
export function listTagTree(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/tagTree/list',
            method: 'post',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

// 新增标签树
export function addTagTree(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/tagTree',
            method: 'post',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}
// 修改标签树
export function updateTagTree(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/tagTree',
            method: 'put',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}


// 批量更新标签树信息
export function branchSetTagTree(data={}, url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/tagTree/branchSetTagTree',
            method: 'post',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

// 删除标签树
export function deleteTagTree(tagNumIds='', url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/tagTree/' + tagNumIds,
            method: 'delete'
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

// 获取标签树信息
export function getTagTree(tagNumId='', url='') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/tagTree/' + tagNumId,
            method: 'get'
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}
