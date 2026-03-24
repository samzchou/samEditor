const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const mime = require('mime-types');

class FileService {
    constructor() {
        // 使用环境变量中的路径，如果未设置则使用默认值
        const publicDir = process.env.PUBLIC_DIR || 'public';
        this.publicPath = path.isAbsolute(publicDir) ? 
            publicDir : 
            path.join(global.appRoot, publicDir);
        
        // 从环境变量获取最大上传大小
        this.maxFileSize = parseInt(process.env.UPLOAD_MAX_SIZE) || 50 * 1024 * 1024; // 默认 50MB
        
        // 允许的文件类型及其存储目录映射
        this.allowedTypes = {
            // 图片
            'image/jpeg': 'images',
            'image/png': 'images',
            'image/gif': 'images',
            'image/svg+xml': 'images',
            'image/webp': 'images',
            'image/bmp': 'images',
            
            // 文档
            'application/pdf': 'docs',
            'application/msword': 'docs',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docs',
            'application/vnd.ms-excel': 'docs',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'docs',
            'application/vnd.ms-powerpoint': 'docs',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'docs',
            'text/plain': 'docs',
            'text/csv': 'docs',
            
            // 媒体文件
            'audio/mpeg': 'media',
            'audio/wav': 'media',
            'audio/ogg': 'media',
            'video/mp4': 'media',
            'video/webm': 'media',
            
            // 前端资源
            'text/css': 'css',
            'text/javascript': 'js',
            'application/json': 'json',
            
            // 字体
            'font/woff': 'fonts',
            'font/woff2': 'fonts',
            'font/ttf': 'fonts',
            'font/otf': 'fonts',
            
            // 压缩文件
            'application/zip': 'archives',
            'application/x-rar-compressed': 'archives',
            'application/x-7z-compressed': 'archives'
        };

        // 明确禁止的文件扩展名（不区分大小写）
        this.forbiddenExtensions = new Set([
            // 可执行文件
            '.exe', '.dll', '.so', '.dylib', '.bin',
            // 脚本文件
            '.php', '.phar', '.phtml', '.php3', '.php4', '.php5', '.php7',
            '.sh', '.bash', '.csh', '.zsh', '.ksh',
            '.pl', '.py', '.pyc', '.pyo', '.rb',
            '.asp', '.aspx', '.cgi', '.jsp',
            // 系统文件
            '.sys', '.ini', '.config', '.conf', '.htaccess',
            // 其他危险文件
            '.bat', '.cmd', '.com', '.msi', '.vbs', '.jar'
        ]);
    }

    async saveFile(file, type) {
        try {
            // 验证文件类型
            if (!this.allowedTypes[type]) {
                throw new Error('不支持的文件类型');
            }

            // 获取文件扩展名并验证
            const ext = mime.extension(type);
            if (!ext) {
                throw new Error('无法确定文件扩展名');
            }

            // 检查是否是禁止的扩展名
            if (this.isForbiddenExtension('.' + ext)) {
                throw new Error('该类型文件不允许上传');
            }

            // 验证文件大小
            if (file.size > this.maxFileSize) {
                throw new Error('文件大小超过限制');
            }

            // 验证文件内容类型（魔数检查）
            if (!await this.isValidFileContent(file)) {
                throw new Error('文件内容验证失败');
            }

            // 生成唯一文件名
            const fileName = `${crypto.randomBytes(16).toString('hex')}.${ext}`;
            
            // 确定存储目录
            const directory = this.allowedTypes[type];
            const filePath = path.join(this.publicPath, directory, fileName);
            
            // 保存文件
            await fs.writeFile(filePath, file.buffer);
            
            // 返回访问URL
            return `/static/${directory}/${fileName}`;
        } catch (error) {
            throw new Error(`文件保存失败: ${error.message}`);
        }
    }

    isForbiddenExtension(ext) {
        return this.forbiddenExtensions.has(ext.toLowerCase());
    }

    async isValidFileContent(file) {
        // 文件魔数检查
        const magicNumbers = {
            'image/jpeg': [0xFF, 0xD8, 0xFF],
            'image/png': [0x89, 0x50, 0x4E, 0x47],
            'image/gif': [0x47, 0x49, 0x46, 0x38],
            'application/pdf': [0x25, 0x50, 0x44, 0x46],
            // 可以添加更多文件类型的魔数
        };

        if (magicNumbers[file.mimetype]) {
            const header = file.buffer.slice(0, 4);
            const magic = magicNumbers[file.mimetype];
            
            for (let i = 0; i < magic.length; i++) {
                if (header[i] !== magic[i]) {
                    return false;
                }
            }
        }

        return true;
    }

    async deleteFile(filePath) {
        try {
            // 从URL中提取文件路径
            const relativePath = filePath.replace('/static/', '');
            const fullPath = path.join(this.publicPath, relativePath);
            
            // 验证文件路径是否在允许的目录中
            if (!this.isPathAllowed(fullPath)) {
                throw new Error('非法的文件路径');
            }
            
            // 检查文件扩展名
            const ext = path.extname(fullPath);
            if (this.isForbiddenExtension(ext)) {
                throw new Error('不允许操作该类型文件');
            }
            
            // 删除文件
            await fs.unlink(fullPath);
            return true;
        } catch (error) {
            throw new Error(`文件删除失败: ${error.message}`);
        }
    }

    isPathAllowed(fullPath) {
        // 确保文件路径在 public 目录下
        const normalizedPath = path.normalize(fullPath);
        return normalizedPath.startsWith(this.publicPath) && 
               !normalizedPath.includes('..');
    }
}

module.exports = new FileService(); 