/**
 * http://192.168.0.140:9088/swagger-ui.html#/%E7%BC%96%E8%BE%91%E5%99%A8%E6%96%87%E6%A1%A3%E6%A0%87%E7%AD%BE%E6%8E%A5%E5%8F%A3_-_EdtDocTagController
 */

import request from '@/utils/request';

var protocal = "";

if(process.env.NODE_ENV !== 'development'){
    protocal = process.env.VUE_APP_EDITOR_URL;
}

// 获取文档列表
export function listDocument(data={}, url="") {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        let response = request({
            url: protocal + '/document/list',
            method: 'post',
            data: data
        })
        resolve(response);
    })
}

// 保存文档
export function saveDocument(data={}, url="") {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        let response = request({
            url: protocal + '/document',
            method: 'post',
            data: data
        })
        resolve(response);
    })
}
// 修改文档
export function updateDocument(data={}, url="") {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        let response = request({
            url: protocal + '/document',
            method: 'put',
            data: data
        })
        resolve(response);
    })
}

// 删除文档
export function deleteDocument(docIds='', url="") {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        let response = request({
            url: protocal + '/document/' + docIds,
            method: 'delete'
        })
        resolve(response);
    })
}

// 获取文档信息
export function getDocument(docId, url="") {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        let response = request({
            url: protocal + '/document/' + docId,
            method: 'get'
        })
        resolve(response);
    })
}

// 检索大纲列表
export function listOutline(data={}, url="") {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        let response = request({
            url: protocal + '/outline/list',
            method: 'post',
            data: data
        })
        resolve(response);
    })
}


// 批量新增或修改大纲数据
export function batchUpdateOutline(data=[], url="") {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        let response = request({
            url: protocal + '/outline/saveOutlineData',
            method: 'post',
            data: data
        })
        resolve(response);
    })
}

// 批量删除大纲数据
export function batchDeleteOutline(ids="", url="") {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        let response = request({
            url: protocal + '/outline/' + ids,
            method: 'delete'
        })
        resolve(response);
    })
}
// 获取单条大纲数据
export function getOutlineData(id="", url="") {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        let response = request({
            url: protocal + '/outline/' + id,
            method: 'get'
        })
        resolve(response);
    })
}


// 标签列表
export function tagList(data={}, url="") {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        let response = request({
            url: protocal + '/tag/list',
            method: 'post',
            data: data
        })
        resolve(response);
    })
}
