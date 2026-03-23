import request from '@/utils/request';
let protocal = '';
if(process.env.NODE_ENV !== 'development'){
    protocal = process.env.VUE_APP_REMOTE_API;
}

// 基础服务
export function documentServer(data) {
    return new Promise((resolve, reject) => {
        let response = request({
            url: protocal + '/nodedocument',
            method: 'post',
            data: data
        })
        resolve(response);
    })
}
// 数据库服务
export function dbServer(data) {
    return new Promise((resolve, reject) => {
        let response = request({
            url: protocal + '/dbs',
            method: 'post',
            data: data
        })
        resolve(response);
    })
}

// office服务
export function officeServer(data) {
    return new Promise((resolve, reject) => {
        let response = request({
            url: protocal + '/office',
            method: 'post',
            data: data
        })
        resolve(response);
    })
}

// HTML解析结构服务
export function structServer(data) {
    return new Promise((resolve, reject) => {
        let response = request({
            url: protocal + '/struct',
            method: 'post',
            data: data
        })
        resolve(response);
    })
}

// 上传文件
export function uploadFile(data) {
    return new Promise((resolve, reject) => {
        let response = request({
            url: protocal + '/file',
            method: 'post',
            data: data
        })
        resolve(response);
    })
}
