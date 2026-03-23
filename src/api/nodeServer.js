import request from '@/utils/request';
// 加密解密
import { encrypt } from '@/utils/jsencrypt.js';
// 消息
import { Message } from 'element-ui';
let protocal = '';
/* if (process.env.NODE_ENV !== 'development') {
    protocal = process.env.VUE_APP_SERVER;
} */

export async function aiChat(data = {}, url = "", callBack) {
    if (url) {
        protocal = url;
    }
    const params = {
        url: protocal + '/aiChat',
        method: 'post',
        responseType: 'stream',
        data
    }

    if (data.params && data.params.stream) {
        const response = await fetch(protocal + '/aiChat', {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        	responseType: 'stream',
        })
        if (response) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let result = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    callBack && callBack(null);
                    break;
                };
                let contentText = decoder.decode(value, { stream: true });
                callBack && callBack(contentText);
            }
        }
    } else {
        return new Promise((resolve, reject) => {
            let response = request(params);
            resolve(response);
        })
    }
}

export function parseImage(data = {}, url = "") {
    if (url) {
        protocal = url;
    }
    return new Promise((resolve, reject) => {
        let response = request({
            url,
            method: 'post',
            data
        })
        resolve(response);
    })
}

export function mgApi(data = {}, url = "") {
    if (url) {
        protocal = url;
    }
    return new Promise((resolve, reject) => {
        let response = request({
            url: protocal + '/mgApi',
            method: 'post',
            data
        })
        resolve(response);
    })
}

// 基础服务
export function documentServer(data, url = '') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/nodedocument',
            method: 'post',
            timeout: 300 * 1000,
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}
// 数据库服务
export function dbServer(data, url = '') {
    if (url) protocal = url;
    var { dbName, tableName, tn } = data;
    tableName = tableName || tn;
    if (dbName && tableName) {
        // 库表加密
        data.pter = encrypt(dbName + "||" + tableName);
        delete data.dbName;
        delete data.tableName;
    }
    /*if (!tableName || !dbName || !data.operation) {
        Message.error('Request parameter setting error!');
        return null;
    }*/

    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/dbs',
            method: 'post',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    });
}

// office服务
export function officeServer(data, url = '') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/office',
            method: 'post',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

// HTML解析结构服务
export function structServer(data, url = '') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/struct',
            method: 'post',
            timeout: 300 * 1000,
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

// 上传文件
export function uploadFile(data, url = '') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/file',
            method: 'post',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

// 解析DOC文件
export function parseDoc(data, url = '') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/parseDoc',
            method: 'post',
            timeout: 300 * 1000,
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

// 获取或保存结构化Html文件
export function setDocHtml(data, url = '') {
    if (url) protocal = url;
    return new Promise((resolve, reject) => {
        request({
            url: protocal + '/struct',
            method: 'post',
            data: data
        }).then(response => {
            resolve(response);
        }).catch(() => {
            resolve(null);
        })
    })
}

