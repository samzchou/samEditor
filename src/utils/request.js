/**
 * ----------------------------------
 * @module
 * @desc axios数据API请求封装处理
 * @author sam.shen by 2021-06-02
 * ----------------------------------
 */

import axios from 'axios';
import { Message } from 'element-ui';
// import { getToken, removeToken } from '@/utils/auth';
// import errorCode from '@/utils/errorCode.js';
import $global from '@/utils/global.js';

const IS_PROD = ["production", "prod"].includes(process.env.NODE_ENV);
/**
 * @constant
 * @desc 创建axios实例
 */
axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8';
const service = axios.create({
    // baseURL: process.env.VUE_APP_BASE_API,
    timeout: 180 * 1000, // 超时3分钟
})


/**
 * axios接口请求入参
 */
service.interceptors.request.use(
    config => {
        var docConfig = $global.getTinymceConfig();
        /* const isToken = (config.headers || {}).isToken === false;
        if (getToken()) { // && !isToken
            config.headers['Authorization'] = 'Bearer ' + getToken();                                           // 让每个请求携带自定义token 请根据实际情况自行修改
        } */

        if(config.url === '/file' || config.url === '/file/upload') {
            config.headers['Content-Type'] = 'multipart/form-data';
        }
        // config.baseURL = process.env.VUE_APP_BASE_API;

        // URl 逻辑处理,转换 baseUrl
        if(config.url.match(/\/nodedocument|\/file|\/office|\/struct|\/dbs|\/parseDoc/g)) {                                // 请求 nodeServer 服务
            config.baseURL = process.env.VUE_APP_SERVER;
        // 编辑器接口
        } else if(config.url.match(/\/quoteSearch|\/outline|\/document|\/tag|\/lemma|\/editor/g)) {
            config.baseURL = process.env.VUE_APP_EDITOR_API;
        // DMS数据接口1
        } else if(config.url.match(/\/base_data/g)) {
            config.baseURL = process.env.VUE_APP_DMS;
        // DMS数据接口2
        } else if(config.url.match(/\/dms-support/g)) {
            config.baseURL = process.env.VUE_APP_DMS_SUPPORT;
        }

        // DOC文档解析
        if (config.url === '/file/upload' || config.url === '/file/getUploadMsgJson') {
            config.baseURL = process.env.VUE_APP_DOC;
        }

        // 在生产环境下
        if (docConfig.env !== 'development' || config.url.includes('http')) {
            config.baseURL = "";
        }

        return config;
    },
    error => {
        return Promise.reject(error);
    }
)

/**
 * axios接口请求后返回结果
 */
service.interceptors.response.use(
    res => {
        // 未设置状态码则默认成功状态
        const code = String(res.data.error_code || res.data.code || res.status) || '200';
        if(code !== '200') {
            const msg = res.data.msg || res.data.message || res.data.error_msg || res.data.errorMsg;
            Message({
                message: msg,
                type: 'error'
            })
            return Promise.reject(new Error(msg));
        } else {
            return res.data;
        }
    },
    error => {
        let { message } = error;
        let streamError = false;
        if (message) {
            let flag = true;
            if (message == "Network Error") {
                message = "后端接口连接异常!";
            } else if (message.includes("timeout")) {
                message = "系统接口请求超时!";
            } else if (message.includes("Converting circular structure to JSON")) {
                flag = false;
                streamError = true;
            }

            if (flag) {
                Message({
                    message: message,
                    type: 'error',
                    duration: 5 * 1000
                })
            }
        }
        return !streamError ? Promise.reject(error) : '';
    }
)

export default service;
