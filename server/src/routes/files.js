const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs-extra')
const { v4: uuidv4 } = require('uuid')
const _ = require('lodash')
const { auth } = require('../middleware/auth')
const refreshTokenMiddleware = require('../middleware/refreshToken')
const commonUtil = require('../utils/common')
const { decrypt } = require('../utils/jsencrypt')
const SevenZipUtils = require('../utils/sevenZipUtils') // 须按照c:\Users\sam\Downloads\7z2409-x64.msi
const rateLimit = require('express-rate-limit')
const multiparty = require('multiparty')
const compressing = require('compressing')

// 视频处理
const ffmpeg = require('fluent-ffmpeg');

// 阿里云模型
const aliyun = {
    apiKey: "sk-b4f2c5b9bc0d404d923ff6d79818f119",
    audioUrl: "https://dashscope.aliyuncs.com/api/v1/services/audio/asr/transcription"
}
// 队列
// const Bull = require('bull');
// 创建一个文件处理队列
// const fileProcessingQueue = new Bull('file-processing');

// 创建限流中间件
const uploadLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60,
    // 添加跳过限流的条件
    skip: function (req) {
        // 如果是分片上传请求，则跳过限流检查
        return req.query.operation === 'bigFileUpload'
    },
    message: {
        success: false,
        code: 429,
        message: '请求过于频繁，请稍后再试。。。。',
    },
})

const dbFun = {
    async json2Xml(req, res) {
        const { data } = req.body;
        const xml = commonUtil.genrateXml(data);
        res.json({
            success: true,
            code: 200,
            data: xml,
        })
    },
    // 视频提取音频
    async extractAudio(req, res) {
        const { filePath } = req.body;
        const videoPath = path.join(commonUtil.FILE_PATH(), filePath);
        const dateStr = commonUtil.getDateStr();
        const dirPath = path.join(commonUtil.FILE_PATH(), dateStr);
        // 如果目录不存在则创建
        if (!fs.existsSync(dirPath)) {
            commonUtil.mkdirSync(dirPath);
        }
        const audioFile = dateStr + '/' + Date.now() + '.wav';
        const audioOutputPath = path.join(commonUtil.FILE_PATH(), audioFile);
        ffmpeg(videoPath)
            .audioFrequency(16000) // 设置采样率
            .audioChannels(1)       // 设置声道数为单声道
            .audioBitrate(128)      // 设置比特率
            .format('wav')          // 输出格式为wav
            .on('start', (commandLine) => {
                console.log('FFmpeg命令:', commandLine);
            })
            .on('progress', (progress) => {
                console.log(`进度: ${Math.round(progress.percent)}%`);
            })
            .on('end', () => {
                res.json({
                    success: true,
                    code: 200,
                    data: audioFile,
                })
            })
            .on('error', (err) => {
                console.error('音频提取失败:', err.message);
                reject(err);
            })
            .save(audioOutputPath);
    },

    // 获取阿里云的任务内容
    async getTask(task_id) {
        const aiUrl = `https://dashscope.aliyuncs.com/api/v1/tasks/${task_id}`
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${aliyun.apiKey}`
        };
        const result = await commonUtil.httpPost(aiUrl, { task_id }, headers);
        console.log("result:", result);
        if (result && result.data) {
            return result.data?.output;
        }
        return null;
    },
    // 执行获取阿里云的任务内容
    async handlerTask(req, res) {
        const { taskId } = req.body;
        const result = await this.getTask(taskId);
        res.json({
            code: result ? 200 : 500,
            success: result ? true : false,
            message: result ? "" : "无数据",
            data: result,
        });
    },

    // 调用阿里云的api语音转文字
    async speechToText(req, res) {
        const { params } = req.body;
        try { 
            delete params.modelName;
            const result = await commonUtil.httpPost(aiUrl, params, headers);
            console.log("result:", result);
            res.json({
                code: result ? 200 : 500,
                success: result ? true : false,
                message: result ? "" : "无数据",
                data: result,
            });
            
            /* google API
            const { SpeechClient } = require('@google-cloud/speech');
            const client = new SpeechClient();
            // 读取音频文件
            const audioPath = path.join(commonUtil.FILE_PATH(), filePath);
            const audioBytes = fs.readFileSync(audioPath);
            const audioContent = audioBytes.toString('base64');
            const audio = {
                content: audioContent,
            };
            const config = {
                encoding: 'LINEAR16',
                sampleRateHertz: 16000,
                languageCode: languageCode,
            };
            const request = {
                audio: audio,
                config: config,
            };
            const [response] = await client.recognize(request);
            const transcription = response.results.map(result => result.alternatives[0].transcript).join('\n');
            res.json({
                success: true,
                code: 200,
                data: transcription,
            }) */
        } catch (error) {
            console.error('Google Cloud Speech API错误:', error.message);
            throw error;
        }
    },

    // 文件上传，支持多文件处理
    async upload(req, res) {
        const form = new multiparty.Form({
            uploadDir: path.join(
                commonUtil.FILE_PATH(),
                commonUtil.getDateStr()
            ),
            maxFilesSize: 500 * 1024 * 1024, // 500MB
        })
        // 确保上传目录存在
        await fs.ensureDir(form.uploadDir);

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return res.json({
                    success: false,
                    code: 400,
                    message: `文件上传失败: ${err.message}`,
                })
            }
            const filePath = fields.filePath ? fields.filePath[0] : '';
            try {
                const uploadedFiles = files.file || [];
                const fileInfos = await Promise.all(
                    uploadedFiles.map(async (file) => {
                        let extName = path.extname(file.originalFilename);
                        if (!extName && file.originalFilename === 'blob') {
                            extName = file.headers['content-type'] === 'image/png' ? '.png' : '.jpg';
                        }
                        const fileName = Date.now() + extName;
                        let newPath = path.join(form.uploadDir, fileName);
                        if (filePath) {
                            newPath = path.join(commonUtil.FILE_PATH(), filePath);
                        }

                        // 移动文件到最终位置
                        await fs.move(file.path, newPath, { overwrite: true });
                        /* if (filePath) {
                            await fs.remove(filePath);
                        } */
                        return {
                            filePath: filePath ? filePath : `${commonUtil.getDateStr()}/${fileName}`,
                            originalname: file.originalFilename,
                            size: file.size,
                            mimetype: file.headers['content-type'],
                        }
                    })
                )

                res.json({
                    success: true,
                    code: 200,
                    data: fileInfos.length === 1 ? fileInfos[0] : fileInfos,
                    message: '文件上传成功',
                })
            } catch (error) {
                res.json({
                    success: false,
                    code: 400,
                    message: `文件处理失败: ${error.message}`,
                })
            }
        })
    },

    // 检查已经上传的分片
    async checkUploadedChunks(req, res) {
        const { uuid } = req.body;
        const dateStr = commonUtil.getDateStr();
        const dirPath = path.join(commonUtil.FILE_PATH(), dateStr);
        const fileDir = path.join(dirPath, uuid);
        if (await fs.pathExists(fileDir)) {
            const chunks = await fs.readdir(fileDir);
            const uploadedChunks = chunks.map((chunk) => parseInt(chunk, 10));
            res.json({ uploadedChunks });
        } else {
            res.json({ uploadedChunks: [] });
        }
    },

    // 大文件分片上传
    async bigFileUpload(req, res) {
        const dateStr = commonUtil.getDateStr();
        const dirPath = path.join(commonUtil.FILE_PATH(), dateStr);
        // 如果目录不存在则创建
        if (!fs.existsSync(dirPath)) {
            commonUtil.mkdirSync(dirPath);
        }
        let form = new multiparty.Form({
            encoding: 'utf-8', // 编码
            uploadDir: dirPath, // 文件保存路径
            keepExtensions: true, // 保留文件后缀
            autoFiles: true,
            maxFieldsSize: 1024 * 1024 * 5000,
        })
        const mergeChunks = async (uuid, fileName, totalChunks) => {
            try {
                let ext = commonUtil.getExt(fileName);
                let filePrepend = new Date().getTime();
                const newFile = filePrepend + '.' + ext;

                const filePath = path.join(dirPath, newFile);
                const writeStream = fs.createWriteStream(filePath);

                for (let i = 0; i < totalChunks; i++) {
                    const chunkPath = path.join(dirPath, uuid, i.toString());
                    const readStream = fs.createReadStream(chunkPath);
                    readStream.pipe(writeStream, { end: false });
                    await new Promise((resolve) =>
                        readStream.on('end', resolve)
                    )
                    await fs.unlink(chunkPath);
                }

                writeStream.end();
                fs.rmdirSync(path.join(dirPath, uuid));

                return dateStr + '/' + newFile;
            } catch (error) {
                console.log('mergeChunks===>', error);
                return '';
            }
        }

        let fileUrl;
        form.parse(req, async (err, fields, files) => {
            if (err) {
                return res.status(500).send(err);
            }

            const [file] = files.file;
            const [fileName] = fields.fileName;
            const [uuid] = fields.uuid;
            const index = parseInt(fields.index[0], 10);
            const totalChunks = parseInt(fields.totalChunks[0], 10);

            // 移动分片文件到临时目录
            const chunkPath = path.join(dirPath, uuid, String(index));
            await fs.ensureDir(path.dirname(chunkPath));
            await fs.move(file.path, chunkPath, { overwrite: true });

            // 检查是否所有切片都已上传
            const uploadedChunks = await fs.readdir(path.join(dirPath, uuid));
            if (uploadedChunks && uploadedChunks.length === totalChunks) {
                // 合并切片
                fileUrl = await mergeChunks(uuid, fileName, totalChunks);
            }
            res.json({
                code: 200,
                success: true,
                message: 'Chunk uploaded',
                filePath: fileUrl,
            })
        })
    },

    // 合并文件分片
    async mergeChunks(chunkDir, finalPath, totalChunks) {
        const writeStream = fs.createWriteStream(finalPath);

        try {
            for (let i = 1; i <= totalChunks; i++) {
                const chunkPath = path.join(chunkDir, `chunk-${i}`);
                const chunkBuffer = await fs.readFile(chunkPath);
                await new Promise((resolve, reject) => {
                    writeStream.write(chunkBuffer, (error) => {
                        if (error) reject(error);
                        else resolve();
                    })
                })
            }
            await new Promise((resolve) => writeStream.end(resolve));
        } catch (error) {
            writeStream.end();
            throw error;
        }
    },

    // 遍历目录列出所有文件，以树结构输出
    async getFileList(req, res) {
        try {
            const dirPath = path.join(global.appRoot, 'files');
            const tree = await this.buildFileTree(dirPath);

            res.json({
                success: true,
                code: 200,
                data: tree,
                message: '获取文件列表成功',
            })
        } catch (error) {
            res.status(400).json({
                success: false,
                code: 400,
                message: `获取文件列表失败: ${error.message}`,
            })
        }
    },

    // 构建文件树结构
    async buildFileTree(dirPath, basePath = '') {
        const items = await fs.readdir(dirPath, { withFileTypes: true });
        const result = [];

        for (const item of items) {
            const fullPath = path.join(dirPath, item.name);
            const relativePath = path.join(basePath, item.name);

            if (item.isDirectory()) {
                const children = await this.buildFileTree(fullPath, relativePath);
                result.push({
                    name: item.name,
                    type: 'directory',
                    path: relativePath,
                    children,
                });
            } else {
                const stats = await fs.stat(fullPath);
                result.push({
                    name: item.name,
                    type: 'file',
                    path: relativePath,
                    size: stats.size,
                    modifiedTime: stats.mtime,
                });
            }
        }
        return result;
    },

    // 复制文件
    async copyFile(req, res) {
        let { filePath, otherPath } = req.body;
        const sourceFile = path.join(commonUtil.FILE_PATH(), filePath);
        const dateStr = commonUtil.getDateStr();
        const extName = commonUtil.getExt(filePath);
        const fileName = `${dateStr}/${Date.now()}.${extName}`;

        const targetPath = path.join(commonUtil.FILE_PATH(), dateStr);
        // 如果目录不存在则创建
        if (!fs.existsSync(targetPath)) {
            commonUtil.mkdirSync(targetPath);
        }

        const targetFile = path.join(commonUtil.FILE_PATH(), fileName);

        let otherFile, otherName, targetOtherPath;
        if (otherPath) {
            otherFile = path.join(commonUtil.FILE_PATH(), otherPath);
            const oExt = commonUtil.getExt(otherPath);
            otherName = `${dateStr}/${Date.now()}.${oExt}`;
            targetOtherPath = path.join(commonUtil.FILE_PATH(), otherName);
        }
        try {
            await commonUtil.copyFile(sourceFile, targetFile);
            if (otherFile) {
                await commonUtil.copyFile(otherFile, targetOtherPath);
            }
            res.json({
                success: true,
                code: 200,
                data: { fileName, otherName },
            })
        } catch (error) {
            res.json({
                success: false,
                code: 500,
                message: error.message,
            })
        }
    },
    // 删除文件
    async removeFile(req, res) {
        const { filePath } = req.body;
        const toFilePath = path.join(commonUtil.FILE_PATH(), filePath);
        fs.stat(toFilePath, (error, stats) => {
            if (error) {
                res.json({
                    success: false,
                    code: 401,
                    message: req.body.filepath + '文件不存在!',
                })
            } else {
                try {
                    fs.unlinkSync(toFilePath);
                    res.json({
                        success: true,
                        code: 200,
                    })
                } catch (error) {
                    res.json({
                        success: false,
                        code: 500,
                        message: '文件删除失败!',
                    })
                }
            }
        })
    },
    // 移除文件夹
    async deleteDir(req, res) {
        const { dirPath } = req.body;
        const chunkDir = path.join(commonUtil.FILE_PATH(), dirPath);
        try {
            if (commonUtil.checkDirExist(chunkDir, true)) {
                await fs.remove(chunkDir);
                res.json({ code: 200, success: true });
            } else {
                res.json({
                    success: false,
                    code: 401,
                    message: `${dirPath} not exist!`,
                })
            }
        } catch (error) {
            res.json({ code: 500, success: false, message: error.message });
        }
    },

    async download(req, res) {
        let { filePath, notBuffer } = req.body;
        filePath = path.join(commonUtil.FILE_PATH(), filePath);
        fs.access(filePath, (err) => {
            if (err) {
                res.json({
                    success: false,
                    code: 500,
                    message: err.message,
                })
            } else {
                let data = fs.readFileSync(filePath, 'utf-8');
                let bufferData = !notBuffer ? Buffer.from(data).toString('base64') : data.toString();
                res.json({
                    success: true,
                    code: 200,
                    data: bufferData,
                })
            }
        })
    },

    async getUrl(req, res) {
        let { url, fileName, number, save } = req.body;
        // console.log('getUrl==>', url);
        if (!url) {
            res.json({
                success: false,
                code: 400,
                message: 'The URL cannot be empty!',
            })
            return
        }
        try {
            if (number) {
                if (typeof url === 'object') {
                    let str = []
                    url.forEach((txt) => {
                        txt = decrypt(txt);
                        if (txt.includes('http')) {
                            txt += '/';
                        }
                        str.push(txt);
                    })
                    url = str.join('/');
                } else {
                    url = decrypt(url);
                }
                // console.log('real url', url);
            }

            let base64Data = undefined;
            let bufferData = await commonUtil.downloadByUrl(url);

            if (bufferData) {
                if (req.body.number) {
                    let insertStr = 'aSmUu00Yt';
                    base64Data = Buffer.from(bufferData).toString('base64');
                    base64Data = base64Data.slice(0, req.body.number) + insertStr + base64Data.slice(req.body.number);
                } else {
                    base64Data = Buffer.from(bufferData).toString('base64');
                }
                if (save) {
                    fileName = fileName || path.basename(url);
                    const fileDir = commonUtil.getDateStr();
                    // 如果目录不存在则创建
                    if (!fs.existsSync(path.join(commonUtil.FILE_PATH(), fileDir))) {
                        commonUtil.mkdirSync(path.join(commonUtil.FILE_PATH(), fileDir));
                    }
                    const filePath = path.join(commonUtil.FILE_PATH(), fileDir, fileName);
                    fs.writeFileSync(filePath, base64Data, 'base64');
                    return res.json({
                        success: true,
                        code: 200,
                        data: `${fileDir}/${fileName}`,
                    })
                }
                res.json({
                    success: true,
                    code: 200,
                    data: base64Data ? base64Data.split('').reverse().join('') : '',
                })
            } else {
                res.json({
                    success: false,
                    code: 400,
                    message: 'Invalid URL address！',
                })
            }
        } catch (error) {
            res.json({
                success: false,
                code: 500,
                message: error.message,
            })
        }
    },

    async fileSize(req, res) {
        var { filePath } = req.body
        try {
            filePath = path.join(commonUtil.FILE_PATH(), filePath)
            const stats = await fs.stat(filePath)
            const fileSizeInBytes = stats.size
            console.log(`File size: ${fileSizeInBytes} bytes`)
            res.json({
                success: true,
                code: 200,
                data: fileSizeInBytes,
            })
        } catch (err) {
            console.error(`Error: ${err}`)
            res.json({
                success: false,
                code: 500,
                message: err.message,
            })
        }
    },

    async getFile(req, res) {
        const { filePath, buffer, base64 } = req.body
        try {
            const savePath = path.join(commonUtil.FILE_PATH(), filePath)
            let data = fs.readFileSync(savePath, 'utf-8')
            if (data) {
                if (base64) {
                    data = Buffer.from(data).toString('base64')
                }
                res.json({
                    success: true,
                    code: 200,
                    data: !buffer ? data.toString() : data,
                })
            } else {
                res.json({
                    success: false,
                    code: 500,
                    message: `File:${filePath} does not exist`,
                })
            }
        } catch (error) {
            res.json({
                success: false,
                code: 500,
                message: error.message,
            })
        }
    },

    async saveFile(req, res) {
        let { data, fileExt, filePath } = req.body;
        try {
            data = _.isObject(data) ? JSON.stringify(data) : data;
            const dateStr = commonUtil.getDateStr();
            let fileName
            if (fileExt) {
                fileName = Date.now() + '.' + fileExt;
            } else {
                fileExt = commonUtil.getExt(fileName);
                fileName = Date.now() + '.' + fileExt;
            }

            // 定义文件路径
            let savePath = filePath;
            if (!savePath) {
                savePath = path.join(commonUtil.FILE_PATH(), dateStr);
                // 如果目录不存在则创建
                if (!fs.existsSync(savePath)) {
                    commonUtil.mkdirSync(savePath);
                }
                savePath = path.join(savePath, fileName);
            } else {
                savePath = path.join(commonUtil.FILE_PATH(), savePath);
            }

            if (/^data:[^;]+;base64,/.test(data)) {
                data = data.replace(/^data:[^;]+;base64,/, '');
                data = new Buffer.from(data, 'base64');
            }

            const result = await commonUtil.putFile(data, savePath);
            if (result) {
                const fileSize = fs.statSync(savePath).size;
                res.json({
                    success: true,
                    code: 200,
                    message: 'File has been saved!',
                    fileSize,
                    data: !filePath ? dateStr + '/' + fileName : filePath,
                })
            } else {
                res.json({
                    success: false,
                    code: 500,
                    message: 'File save failed!',
                })
            }
        } catch (error) {
            console.log('saveFile error =>', error)
            res.json({
                success: false,
                code: 500,
                message: error.message,
            })
        }
    },
    async compress(req, res) {
        let { filePath, password } = req.body
        try {
            const filePrefix = commonUtil.getPrevName(filePath)
            const srcPath = path.join(commonUtil.FILE_PATH(), filePath)
            // const timeStamp = Date.now().toString();
            const destPath = path.join(
                commonUtil.FILE_PATH(),
                'tmp',
                filePrefix
            )
            // 如果目录不存在则创建
            if (!fs.existsSync(destPath)) {
                commonUtil.mkdirSync(destPath)
            } else {
                const fileList = await this.getFileList(destPath)
                return res.json({
                    success: true,
                    code: 200,
                    message: 'File has been decompressed!',
                    data: {
                        dirPath: 'tmp/' + filePrefix,
                        data: fileList,
                    },
                })
            }
            const extName = commonUtil.getExt(filePath)
            switch (extName) {
                case 'zip':
                    await compressing.zip.uncompress(srcPath, destPath)
                    break
                case 'tar':
                    await compressing.tar.uncompress(srcPath, destPath)
                    break
                case 'tgz':
                    await compressing.tgz.uncompress(srcPath, destPath)
                    break
                case 'gzip':
                    await compressing.gzip.uncompress(srcPath, destPath)
                    break
                case '7z':
                    // 先获取文件信息
                    const info = await SevenZipUtils.list(srcPath)
                    // 测试文件完整性
                    const isValid = await SevenZipUtils.test(srcPath)
                    if (!isValid) {
                        return res.json({
                            code: 400,
                            success: false,
                            message: 'Invalid or corrupted 7z file',
                        })
                    }
                    // 解压文件
                    await SevenZipUtils.extract(srcPath, destPath, {
                        password: password || '', // 如果文件有密码
                        onProgress: (progress) => {
                            // 这里可以通过WebSocket发送进度信息
                            console.log(`Extraction progress: ${progress}%`)
                        },
                    })
                    break
                case 'rar':
                    const extracted = await SevenZipUtils.extractRar(
                        srcPath,
                        destPath
                    )
                    console.log('Files extracted:', extracted)
                    /* const extractor = await createExtractorFromFile({
                        filepath: srcPath,
                        targetPath: destPath
                    });
                    const extracted = await extractor.extract();
                    console.log('Files extracted:', extracted.files); */
                    break
                default:
                    throw new Error(`Unsupported compression type: ${extName}`)
            }
            const data = await this.getFileList(destPath)
            res.json({
                success: true,
                code: 200,
                message: 'File has been decompressed!',
                data: {
                    dirPath: 'tmp/' + filePrefix,
                    data,
                },
            })
        } catch (error) {
            console.error(error);
            res.json({
                success: false,
                code: 500,
                message: error.message,
            })
        }
    },

    async getFileList(dir, baseDir = dir, parentId = '') {
        const rootId = uuidv4()
        const result = {
            id: rootId,
            parentId,
            name: path.basename(dir),
            path: path.relative(baseDir, dir),
            type: 'directory',
            children: [],
        }
        try {
            const items = fs.readdirSync(dir)
            for (const item of items) {
                const fullPath = path.join(dir, item)
                const stat = fs.statSync(fullPath)
                const relativePath = path.relative(baseDir, fullPath)

                if (stat.isDirectory()) {
                    const subTree = await this.getFileList(
                        fullPath,
                        baseDir,
                        rootId
                    )
                    result.children.push(subTree)
                } else {
                    result.children.push({
                        id: uuidv4(),
                        parentId: rootId,
                        name: item,
                        path: relativePath,
                        type: 'file',
                        size: stat.size,
                        extension: path.extname(item).toLowerCase(),
                        modifiedTime: stat.mtime,
                    })
                }
            }

            // 按类型和名称排序：目录在前，文件在后
            result.children.sort((a, b) => {
                if (a.type === b.type) {
                    return a.name.localeCompare(b.name)
                }
                return a.type === 'directory' ? -1 : 1
            })

            return result
        } catch (error) {
            throw new Error(`Failed to get file list: ${error.message}`)
        }
    },

    getFilesByPath(req, res) {
        let { dirPath } = req.body
        try {
            const targetPath = path.join(commonUtil.FILE_PATH(), dirPath)
            const files = fs.readdirSync(targetPath)
            const lists = files.map((file) => {
                const filePath = path.join(targetPath, file)
                const stat = fs.statSync(filePath)
                if (stat.isFile()) {
                    return {
                        name: dirPath + '/' + file,
                        size: stat.size,
                        modifiedTime: stat.mtime,
                        extension: path.extname(file).toLowerCase(),
                    }
                }
            })
            res.json({
                success: true,
                code: 200,
                data: lists,
            })
        } catch (error) {
            res.json({
                success: false,
                code: 500,
                message: error.message,
            })
        }
    },
}

// 为所有路由添加自动刷新 token 中间件
// router.use(refreshTokenMiddleware);

// 文件上传路由
/* router.post('/upload', (req, res) => {
    dbFun.upload(req, res);
}); */

// 其他操作路由
router.post('/file', (req, res) => {
    let type = req.query.operation || req.body.operation || req.body.type || 'upload'
    if (type === 'upload' && req.query.trunk) {
        type = 'bigFileUpload'
    }
    try {
        dbFun[type](req, res)
    } catch (err) {
        res.json({
            success: false,
            code: 400,
            message: 'function ' + type + ' not defined!',
        })
    }
})

module.exports = router
