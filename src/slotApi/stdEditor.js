import request from '@/utils/request';

var protocal = "";

if(process.env.NODE_ENV !== 'development'){
    protocal = process.env.VUE_APP_EDITOR_URL;
}
// 搜索题录信息
export function quoteSearchStandard(data={}) {
    return new Promise((resolve, reject) => {
        let response = request({
            url: protocal + '/quoteSearch/standard',
            method: 'post',
            data: data
        })
        resolve(response);
    })
}

// 搜索术语信息
export function lemmaList(data={}) {
    return new Promise((resolve, reject) => {
        let response = request({
            url: protocal + '/lemma/list',
            method: 'post',
            data: data
        })
        resolve(response);
    })
}
// 新增征求意见
export function opinionAdd(data={}) {
    return new Promise((resolve, reject) => {
        let response = request({
            url: protocal + '/editor/opinion',
            method: 'post',
            data: data
        })
        resolve(response);
    })
}

// 更新征求意见
export function opinionUpdate(data={}) {
    return new Promise((resolve, reject) => {
        let response = request({
            url: protocal + '/editor/opinion',
            method: 'put',
            data: data
        })
        resolve(response);
    })
}

// 征求意见列表
export function opinionList(data={}) {
    return new Promise((resolve, reject) => {
        let response = request({
            url: protocal + '/editor/opinion/list',
            method: 'post',
            data: data
        })
        resolve(response);
    })
}
