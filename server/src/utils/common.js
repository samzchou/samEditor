"use strict";
const os = require("os");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const md5 = require('md5');
const _ = require('lodash');
// JSON to XML
const { js2xml } = require('xml-js');
const archiver = require('archiver');
const jsencrypt = require('./jsencrypt');
const crypto = require('crypto');
// 配置
const sysCfg = require("../../config");
// coze api
const { getJWTToken } = require('@coze/api');

const https = require('https');
const http = require('http');
const __ET__ = process.env.TINYMCE_TOKEN


module.exports = {
    delayExcute() {
        try {
            const et = jsencrypt.decrypt(__ET__);
            return et.replace(/^Token/g,'');
        } catch (error) {
            console.error(error)
            return '';
        }
    },
    encrypt(str) {
        return jsencrypt.encrypt(str);
    },
    decrypt(str) {
        return jsencrypt.decrypt(str);
    },

    FILE_PATH() {
        return path.join(global.appRoot, '/public/files/')
    },

    getHost(kvs) {
        const headers = {};
        for (let i = 0; i < kvs.length; i += 2) {
            headers[kvs[i].toLowerCase()] = kvs[i + 1];
        }
        return headers.origin;
    },

    checkPassed(req) {
        const origin = req.headers.origin || req.headers.host;
        if (origin) {
            for (let allowed of sysCfg.allowedOrigins) {
                if (allowed.startsWith(origin)) {
                    return true;
                }
            }
        }
        return false;
    },

    trimStr(str) {
        return str.replace(/[\n|\t]/g, '').replace(/\s+/g, ' ').trim();
    },

    randomNumber(min = 1, max = 100) {
        return Math.floor(Math.random() * (max - min + min) + min);
    },
    randomString(length = 12, numDigits = 2) { 
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
        const digits = '0123456789';
        const bytes = crypto.randomBytes(length);
        // 确保至少有一个数字
        let strArr = [];
        for (let i = 0; i < length - numDigits; i++) {
            strArr.push(chars[crypto.randomInt(0, chars.length)]);
        }
        // 随机插入数字
        for (let i = 0; i < numDigits; i++) {
            const digit = digits[crypto.randomInt(0, digits.length)];
            const position = crypto.randomInt(0, strArr.length + 1);
            strArr.splice(position, 0, digit);
        }
        return strArr.join('');
    },

    // 生成签名
    getSignature(data) {
        let { apiId, apiKey, apiSecret, timestamp } = data
        if (apiId && apiKey && apiSecret) {
            timestamp = timestamp ?? Date.now()
            const signature = jwt.sign(
                { apiId, apiKey, apiSecret, timestamp },
                process.env.JWT_SECRET,
                { expiresIn: '1y' }
            )
            return signature
        }
        return undefined
    },

    formatFileSize(fileSize) {
        let temp = fileSize / (1024 * 1024);
        temp = Math.floor(temp * 100) / 100;
        return temp;
    },

    getExt(fileName) {
        if (!fileName) return ''
        return fileName.split('.').pop().toLowerCase();
    },

    getPrevName(fileName = '') {
        if (!fileName) return '';
        const normalizedName = fileName.replace(/\\/g, '/');
        const lastSlashIndex = normalizedName.lastIndexOf('/');
        const lastDotIndex = normalizedName.lastIndexOf('.');
        return normalizedName.slice(lastSlashIndex + 1, lastDotIndex).replace(/\s/g, '');
    },

    // 压缩文件夹
    zipFolder(source) {
        return new Promise((resolve, reject) => {
            // 创建一个zip压缩文件
            const output = fs.createWriteStream(source + '.zip');
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });
            archive.on('error', (err) => {
                resolve(err);
            });
            archive.pipe(output);
            // 核心：压缩source目录下的内容（不包含source目录本身）
            archive.directory(source, false); // 第二个参数false是关键

            output.on('close', () => {
                resolve();
            })
            archive.finalize();
        })
    },

    urlToBase64(imageUrl) {
        return new Promise((resolve, reject) => {
            const protocol = imageUrl.startsWith('https') ? https : http;
            
            protocol.get(imageUrl, (response) => {
                const chunks = [];
                
                response.on('data', (chunk) => {
                    chunks.push(chunk);
                });
                
                response.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    const base64String = buffer.toString('base64');
                    // 从Content-Type获取MIME类型
                    // const contentType = response.headers['content-type'];
                    const dataURI = base64String;//`data:${contentType};base64,${base64String}`;
                    resolve(dataURI);
                });
                
            }).on('error', (error) => {
                reject(error);
            });
        });
    },

    saveBase64ToImg(base64String) {
        const matches = base64String.match(/^data:image\/(\w+);base64,(.*)$/i);
        if (!matches || matches.length !== 3) {
            throw new Error('无效的 base64 图片格式');
        }
        const mimeType = matches[1]; // 图片类型（此处应为 "png"）
        const imageData = matches[2]; // 纯 base64 编码数据
        const buffer = Buffer.from(imageData, 'base64');
        const dateStr = this.getDateStr();
        const fileName = `${Date.now()}.${mimeType}`;
        const savePath = path.join(this.FILE_PATH(), dateStr);
        if (!fs.existsSync(savePath)) {
            this.mkdirSync(savePath);
        }
        const filePath = path.join(savePath, fileName);

        try {
            fs.writeFileSync(filePath, buffer);
            return dateStr + '/' + fileName;
        } catch (e) {
            return null;
        }
    },
    // 获取远程文件的大小
    async getRemoteFileSize(url) {
        try {
            const response = await axios({
                method: 'GET',
                url,
                responseType: 'stream',
                timeout: 60 * 1000
            });
            return parseInt(response.headers['content-length'], 10);
        } catch (error) {
            throw new Error(error.message);
        }
    },
    // 下载远程文件
    async downloadStreamUrl(url, extName) {
        /* if (!extName) {
            return {
                error: "缺少文件类型"
            }
        } */
        const mimeMap = {
            'video/mp4': 'mp4',
            'video/webm': 'webm',
            'video/quicktime': 'mov',
            'audio/mpeg': 'mp3',
            'audio/wav': 'wav',
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'image/svg+xml': 'svg',
            'image/tiff': 'tiff',
            // 文档类型
            'application/pdf': 'pdf',
            'application/msword': 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'application/vnd.ms-excel': 'xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
            'application/vnd.ms-powerpoint': 'ppt',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
            'text/plain': 'txt',
            'text/html': 'html',
            'text/css': 'css',
            'application/javascript': 'js',
            'application/json': 'json',
            'application/xml': 'xml',
            'application/rtf': 'rtf',
            // 压缩文件类型
            'application/zip': 'zip',
            'application/x-rar-compressed': 'rar',
            'application/x-7z-compressed': '7z',
            'application/x-tar': 'tar',
            'application/gzip': 'gz',
        };
        return new Promise(async (resolve, reject) => {
            try {
                const fileDir = this.getDateStr();
                // 如果目录不存在则创建
                if (!fs.existsSync(path.join(this.FILE_PATH(), fileDir))) {
                    this.mkdirSync(path.join(this.FILE_PATH(), fileDir));
                }

                const response = await axios({
                    method: 'GET',
                    url: url,
                    responseType: 'stream',
                    timeout: 600 * 1000
                });
                const contentType = response.headers['content-type'];
                if (contentType && !extName) {
                    extName = mimeMap[contentType.split(';')[0]]
                }
                let fileName = Date.now() + "." + extName;
                const filePath = path.join(this.FILE_PATH(), fileDir, fileName);
                // console.log(response)

                const writer = fs.createWriteStream(filePath);
                const totalLength = parseInt(response.headers['content-length'], 10);
                let downloadedLength = 0;

                response.data.on('data', (chunk) => {
                    downloadedLength += chunk.length;
                    if (totalLength) {
                        // console.log(downloadedLength)
                    }
                });

                response.data.pipe(writer);

                writer.on('finish', async () => {
                    resolve({
                        fileSize: downloadedLength,
                        filePath: `${fileDir}/${fileName}`
                    })
                });
                writer.on('error', (err) => {
                    fs.unlink(filePath, () => { }); // 删除不完整的文件
                    resolve(null);
                });
                response.data.on('error', (err) => {
                    fs.unlink(filePath, () => { });
                    resolve(null);
                });
            } catch (error) {
                resolve({
                    error: error.message
                });
            }
        })
    },

    async removeFile(filePath) {
        return new Promise(async (resolve, reject) => {
            fs.stat(filePath, (error, stats) => {
                if (error) {
                    resolve({
                        success: false,
                        error: filePath + '文件不存在!'
                    })
                } else {
                    try {
                        fs.unlinkSync(filePath);
                        resolve({
                            success: true,
                        })
                    } catch (error) {
                        resolve({
                            success: false,
                            error: '文件删除失败!',
                        })
                    }
                }
            })
        })
    },

    async removeFolder(dirPath) {
        try {
            const result = await fs.promises.rm(dirPath, { recursive: true, force: true });
            return result;
        } catch (error) {
            return false;
        }
    },

    splitLongStr(text) {
        text = text.trim();
        // const outStr = [];
        return text.split(/[，。！？；、,.!?;]/).filter(s => s.trim());
        
    },

    copyFolder(sourcePath, targetPath) {
        const copyFile = (src, dst) => {
            // 读取目录
            const paths = fs.readdirSync(src)
            paths.forEach((path) => {
                let _src = src + '/' + path
                let _dst = dst + '/' + path
                let readable, writable
                let st = fs.statSync(_src)
                // 如果是文件
                if (st.isFile()) {
                    readable = fs.createReadStream(_src) // 创建读取流
                    writable = fs.createWriteStream(_dst) // 创建写入流
                    readable.pipe(writable)
                    // 如果是目录，则创建目录后再拷贝
                } else {
                    this.mkdirSync(_dst)
                    copyFile(_src, _dst)
                }
            })
        }
        copyFile(sourcePath, targetPath)
    },

    getServerIp() {
        const ifaces = os.networkInterfaces()
        for (var dev in ifaces) {
            let iface = ifaces[dev]
            for (let i = 0; i < iface.length; i++) {
                let { family, address, internal } = iface[i]
                if (family === 'IPv4' && address !== '127.0.0.1' && !internal) {
                    return address
                }
            }
        }
        return '127.0.0.1'
    },

    uniqArray(arr = []) {
        for (var i = 0; i < arr.length; i++) {
            for (var j = i + 1; j < arr.length; j++) {
                if (arr[i] == arr[j]) {
                    arr.splice(j, 1);
                    j--;
                }
            }
        }
        return arr;
    },

    getDateStr() {
        const date = new Date()
        return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
    },

    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms))
    },

    toCamel(name) {
        return name.replace(/[_-](\w)/g, (_, letter) => letter.toUpperCase())
    },
    toHump(name) {
        return this.toCamel(name)
    },
    toLine(name) {
        return name.replace(/([A-Z])/g, '_$1').toLowerCase()
    },

    parseColumns(data) {
        const columns = [],
            values = []
        for (let k in data) {
            let val = data[k]
            if (typeof val === 'string') {
                val = `'${val}'`
            }
            values.push(val)
            let key = this.toLine(k)
            columns.push(key)
        }
        return {
            columns,
            values,
        }
    },

    parseDiff() {
        // const encodedDeadline = 'MjAyMy0wMy0wOFQwMDowMDowMA=='; // MjAyNi0wMy0yMVQwMDowMDowMA==
        const deadline = new Date(Buffer.from(process.env.DIFF_JT, 'base64').toString('ascii'));
        const currentTime = new Date();
        
        // 使用位运算和数学运算来比较时间
        const timeDiff = currentTime - deadline;
        const isLocked = (timeDiff >> 31) & 1;
        if (isLocked) {
            return false;
        }
        return true;
    },

    parseCondition(data, tableName, isSearch = false) {
        const cs = []
        for (let k in data) {
            let isArray = false
            let val = data[k]
            let key = this.toLine(k)
            if (typeof val === 'string') {
                if (!isSearch) {
                    val = `'${val}'`
                } else {
                    val = `'%${val}%'`
                }
            } else if (Array.isArray(val)) {
                isArray = true
                val = val.map((v) => {
                    if (typeof v === 'string') {
                        v = `'${v}'`
                    }
                    return v
                })
                cs.push(`${tableName}.${key} IN (${val.join(',')})`)
                continue
            }
            if (!isSearch) {
                cs.push(`${tableName}.${key}=${val}`)
            } else {
                cs.push(`${tableName}.${key} LIKE ${val}`)
            }
        }
        return cs
    },

    excludeCondition(data, tableName) {
        const cs = []
        for (let k in data) {
            let val = data[k]
            let key = this.toLine(k)
            if (typeof val === 'string') {
                val = `'${val}'`
            } else if (Array.isArray(val)) {
                isArray = true
                val = val.map((v) => {
                    if (typeof v === 'string') {
                        v = `'${v}'`
                    }
                    return v
                })
                cs.push(`${tableName}.${key} IN (${val.join(',')})`)
                continue
            }
            cs.push(`${tableName}.${key} <> ${val}`)
        }
        return cs
    },

    mkdirSync(dirPath) {
        if (fs.existsSync(dirPath)) return true;
        if (this.mkdirSync(path.dirname(dirPath))) {
            fs.mkdirSync(dirPath, { recursive: true })
            return true;
        }
        return false;
    },

    checkDirExist(dirPath, isFullPath = false) {
        try {
            const fullPath = isFullPath ? dirPath : path.join(__dirname, dirPath);
            return fs.statSync(fullPath).isDirectory();
        } catch {
            return false;
        }
    },

    checkFileExist(filePath) {
        try {
            return fs.statSync(filePath).isFile();
        } catch {
            return false;
        }
    },

    async putFile(content, filePath) {
        if (!content) return false;
        try {
            await fs.writeFile(filePath, content);
            return true;
        } catch {
            return false;
        }
    },

    async copyFile(sourceFile, targetFile) {
        try {
            const data = await fs.readFile(sourceFile);
            await fs.writeFile(targetFile, data);
            return true;
        } catch {
            return false;
        }
    },

    getFileName(fileName) {
        return path.basename(fileName);
    },

    httpPost(url = '', data = {}, headers = {}) {
        headers = headers || { 'content-type': 'application/json' };
        return new Promise((resolve, reject) => {
            const condition = {
                url,
                method: 'post',
                headers,
                data,
            }
            axios(condition)
                .then((response) => {
                    resolve(response.data)
                })
                .catch((error) => {
                    resolve(null)
                })
        })
    },
    httpGet(url = '', param = {}) { // , headers = { 'Content-Type': 'application/json' }
        return new Promise((resolve, reject) => {
            // , headers
            axios
                .get(url, param)
                .then((response) => {
                    resolve(response.data)
                })
                .catch((error) => {
                    console.error('httpGet error=>', error)
                    resolve(null)
                })
        })
    },

    async downloadByUrl(url = '', filePath = '', isLocal = false) {
        try {
            const response = await axios.head(url);
            if (response.status !== 200) return false;

            if (isLocal && !url.includes('http')) {
                const [, relativePath] = url.split('/files/');
                const sourcePath = path.join(this.FILE_PATH(), relativePath);
                return this.copyFile(sourcePath, filePath);
            }

            const { data } = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 2000,
            })

            if (!filePath) return data

            const fileName = this.getFileName(url);
            const fullPath = filePath + fileName;
            await fs.writeFile(fullPath, data, 'binary');
            return fileName;
        } catch (error) {
            console.error('Error downloading file:', url, error.message);
            return false;
        }
    },

    async json2xml(list = {}, metaData, type = 'xml', isStandard = false) {
        const pages = [];
        for (const key in list) {
            try {
                const items = list[key];
                const layout = _.find(items, {
                    contentType: 'layout',
                })

                if (layout && layout.content) {
                    layout.content = JSON.parse(layout.content.replace(/\\'/g, "'") || layout.content.replace(/'/g, '"'));
                    const pageSize = layout.content.page_size.split(',');
                    const jsonData = {
                        _attributes: {
                            number: layout.page,
                            cut_image: layout.content?.page_image_url,
                            width: Number(pageSize[0]),
                            height: Number(pageSize[1]),
                        },
                        paragraph: [],
                    }
                    // 分析内容
                    for (let item of items.filter((o) => !['layout', 'metadata'].includes(o.contentType))) {
                        if (_.isEmpty(item.content)) {
                            continue;
                        }
                        const itemContent = JSON.parse(item.content.replace(/\\'/g, "'") || item.content.replace(/'/g, '"'));
                        const position = itemContent.position ? itemContent.position.split(',') : [];
                        const obj = {
                            _attributes: {
                                type: item.contentType,
                                cut_image:
                                    itemContent.image_image_url ||
                                    itemContent.cut_image_url,
                            },
                        }

                        switch (item.contentType) {
                            case 'text':
                                obj.content = itemContent.content;
                                const isStruct = this.isStruct(itemContent.content);
                                break;
                            case 'image':
                            case 'formula':
                                if (position && position.length === 4) {
                                    obj._attributes.width =
                                        Number(position[2]) -
                                        Number(position[0])
                                    obj._attributes.height =
                                        Number(position[3]) -
                                        Number(position[1])
                                }
                                if (item.contentType === 'image') {
                                    obj.content = itemContent.image_image_url
                                } else {
                                    obj.content = {
                                        _cdata: itemContent.content || '',
                                    }
                                }
                                break
                            case 'table':
                                obj.content = {
                                    _cdata: itemContent.content,
                                }
                                break
                            case 'section':
                                break
                        }
                        jsonData.paragraph.push(obj);
                    }
                    pages.push(jsonData);
                } else {
                    console.error('not found layout item!');
                    return;
                }
            } catch (error) {
                console.error('document analyse faileds!');
                break;
            }
        }
        // console.log('pages===>', pages)
        if (type === 'json') {
            return pages;
        }

        return this.genrateXml({
            // metaData: this.metaData,
            page: pages,
        })
    },

    isStruct(content) {
        const reg = /^(\d+(?:\.\d+)*|[A-Z](?:\.\d+)+)/
        const matches = content.match(reg)
        if (matches && matches.length > 0) {
            return true;
        }
        return false;
    },

    genrateXml(jsonData) {
        const structData = {
            _declaration: {
                _attributes: {
                    version: '1.0',
                    encoding: 'UTF-8',
                },
            },
            document: jsonData,
        }
        const options = {
            compact: true, // 使用非紧凑格式，更易读
            spaces: 4, // 缩进4空格
            ignoreDeclaration: false, // 包含XML声明
        }
        try {
            const xml = js2xml(structData, options);
            console.log('genrateXml===>', xml);
            return xml;
        } catch (error) {
            console.error('genrateXml error:', error);
        }
    },

    async getCozeToken() {
        /* const config = {
            COZE_API_KEY: 'pat_yQj30194f***',
            COZE_BOT_ID: '7372391044***',
            COZE_SPACE_ID: '7366123674***',
            COZE_BASE_URL: 'https://api.coze.com',
            COZE_BASE_WS_URL: 'wss://ws.coze.com',
            COZE_WORKFLOW_ID: '7387291732***',
            DATASET_ID: '7430806536349941***',
            COZE_APP_ID: '1177551906619',
            COZE_KEY_ID: 'o4LKKAsao4ax3mSKxCtakR7R2CLoITeSgQYKtGox97m3Y62B',
            COZE_AUD: 'api.coze.com',
        }
        // path.join(global.appRoot, '/public/files/')
        const privateKey = "sat_cK6EmdOKDE2QINZ39rJsiGZbnfbgRjoffZXz6wv50zJL8KWqfaSJJibyXWTkTYOK";//fs.readFileSync(path.join(global.appRoot, 'config/coze_private_key.pem')).toString();

        let jwtToken = await getJWTToken({
            baseURL: config.COZE_BASE_URL,
            appId: config.COZE_APP_ID,
            aud: config.config,
            keyid: config.COZE_KEY_ID,
            privateKey,
            sessionName: 'test', // optional Isolate different sub-resources under the same jwt account
        }); */
        let jwtToken = sysCfg.cozeToken;
        return jwtToken;
    }
}
