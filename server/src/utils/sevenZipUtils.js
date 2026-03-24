const Seven = require('node-7z');
// const path = require('path');
const fs = require('fs-extra');

class SevenZipUtils {
    static async extractRar(filePath, destPath) {
        const res = await Seven.extractFull(filePath, destPath);
        return res;
    }
    /**
     * 解压7z文件
     * @param {string} filePath - 7z文件路径
     * @param {string} destPath - 解压目标路径
     * @param {Object} options - 解压选项
     * @returns {Promise<Object>} - 解压结果
     */
    static extract(filePath, destPath, options = {}) {
        return new Promise((resolve, reject) => {
            // 确保目标目录存在
            if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true });
            }

            const stream = Seven.extract(filePath, destPath, {
                $progress: true,
                password: options.password
            });

            const result = {
                files: [],
                totalSize: 0,
                error: null
            };

            // 监听文件提取事件
            stream.on('data', (data) => {
                result.files.push({
                    file: data.file,
                    status: data.status,
                    size: data.size
                });
                result.totalSize += data.size || 0;
            });

            // 监听进度事件
            stream.on('progress', (progress) => {
                if (options.onProgress) {
                    options.onProgress(progress);
                }
            });

            // 监听错误
            stream.on('error', (error) => {
                result.error = error;
                reject(error);
            });

            // 完成事件
            stream.on('end', () => {
                resolve(result);
            });
        });
    }

    /**
     * 获取7z文件信息
     * @param {string} filePath - 7z文件路径
     * @returns {Promise<Object>} - 文件信息
     */
    static list(filePath) {
        return new Promise((resolve, reject) => {
            const stream = Seven.list(filePath);
            const files = [];

            stream.on('data', (entry) => {
                files.push({
                    name: entry.name,
                    size: entry.size,
                    packed: entry.packed,
                    encrypted: entry.encrypted,
                    method: entry.method,
                    attr: entry.attr,
                    crc: entry.crc,
                    mtime: entry.mtime,
                    path: entry.path
                });
            });

            stream.on('error', reject);

            stream.on('end', () => {
                resolve({
                    files,
                    totalFiles: files.length,
                    totalSize: files.reduce((sum, file) => sum + (file.size || 0), 0)
                });
            });
        });
    }

    /**
     * 测试7z文件完整性
     * @param {string} filePath - 7z文件路径
     * @returns {Promise<boolean>} - 测试结果
     */
    static test(filePath) {
        return new Promise((resolve, reject) => {
            const stream = Seven.test(filePath);
            let isValid = true;

            stream.on('data', (data) => {
                if (data.status === 'error') {
                    isValid = false;
                }
            });

            stream.on('error', reject);

            stream.on('end', () => {
                resolve(isValid);
            });
        });
    }
}

module.exports = SevenZipUtils; 