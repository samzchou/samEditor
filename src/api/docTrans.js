/**
 * @description 文档转换
 * @author sam.shen 2022.3.25
 */
import request from '@/utils/request';
let protocal = '';
// 上次DOC文件
export function uploadDocFile(data, url="") {
	if (url) protocal = url;
    return new Promise((resolve, reject) => {
        let response = request({
            url: protocal + '/file/upload',
            method: 'post',
            data: data
        })
        resolve(response);
    })
}

// 获取DOC文件上次进程中的消息队列
export function uploadProcessMsg(data, url="") {
	if (url) protocal = url;
    return new Promise((resolve, reject) => {
        let response = request({
            url: protocal + '/file/getUploadMsgJson',
            method: 'post',
            data: data
        })
        resolve(response);
    })
}
