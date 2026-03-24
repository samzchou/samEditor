"use strict";
const express = require("express");
const router = express.Router();
const fs = require("fs-extra");
const path = require("path");
// ffmpeg 安装 https://ffmpeg.org/download.html
const { spawn, execSync, execFile } = require("child_process");
// const crypto = require('crypto');
const commonUtil = require("../utils/common");

const wsServer = require('../websocket/wsServer');

const mathjax = require('mathjax-node');
const svg2png = require('svg2png');
const OpenAI = require("openai");

const dbFun = {
    socketLink(params = {}) {
        const clientId = wsServer.getCurrentClientId();
        wsServer.sendTo(clientId, {
            type: params.act,
            socketId: params.socketId,
            data: params.data,
        })
    },
    
    // 文档处理或转换
    async refreshDoc(req, res) {
        const { filePath, toType } = req.body;
        const extName = path.extname(filePath);
        const reg = new RegExp(extName, "i");

        const sourceFilePath = path.join(commonUtil.FILE_PATH(), filePath);
        let cmd = path.join(process.cwd() + "/scripts", "refreshDoc.exe");
        const args = [`${sourceFilePath}`];
        if (toType) {
            args.push(`${toType}`);
        } else {
            args.push('all');
        }
        args.push(37); // 更新目录域的页码
        let convertResult;
        const childProcess = spawn(cmd, [...args]);
        childProcess.stdout.on("data", (data) => {
            convertResult = data.toString();
            console.log(`Standard output`, convertResult);
        });

        childProcess.stderr.on("data", (data) => {
            console.log("extrct child stderr: ", data.toString());
        });
        childProcess.on("error", (err) => {
            console.error(`Failed to start Python process: ${err.message}`);
        });

        childProcess.on("close", (code) => {
            console.log("extrct childProcess close", code);
            if (code === 0) {
                res.json({
                    success: convertResult.includes('True') ? true : false,
                    code: convertResult.includes('True') ? 200 : 500,
                    data: toType === 'pdf' ? filePath.replace(reg,'.pdf') : filePath
                })
            } else {
                res.json({
                    code: 500,
                    success: false,
                    message: "convert failed!",
                })
            }
        });
    },


    // 公式转图片
    mathjaxToImg(req, res) {
        mathjax.config({
            MathJax: {
                tex2jax: {
                    inlineMath: [
                        ['$', '$'],
                        ['\\(', '\\)'],
                    ],
                    displayMath: [
                        ['$$', '$$'],
                        ['\\[', '\\]'],
                    ],
                },
                TeX: {
                    extensions: ['AMSmath.js', 'AMSsymbols.js'],
                },
            },
        })
        /* MathJax: {
            tex2jax: { inlineMath: [['$', '$'], ['\\(', '\\)']] }
        } */
        mathjax.start();
        const { mathStr, format, svg, mml, html, htmlNode } = req.body;
        // console.log('mathStr=>', mathStr);
        try {
            mathjax.typeset(
                {
                    math: mathStr,
                    format: format || 'MathML', // TeX | inline-TeX | block-TeX | MathML | AsciiMath
                    svg: svg || true,
                    mml: mml || true,
                    html: html || false,
                    htmlNode: htmlNode || false,
                },
                (data) => {
                    if (!data.errors) {
                        const png = commonUtil.saveBase64ToImg(this.convertPng(data));
                        res.json({
                            success: true,
                            error_code: 200,
                            data: {
                                png: png,
                                ...data,
                            },
                        })
                    } else {
                        console.log('公式解析出错！', data.errors, mathStr);
                        res.json({
                            success: false,
                            error_code: 500,
                            error_msg: '公式解析出错！',
                        })
                    }
                }
            )
        } catch (error) {
            console.log('公式解析异常错误！', error, mathStr);
            res.json({
                success: false,
                error_code: 500,
                error_msg: '公式解析异常错误，请检查公式合法性！',
            })
        }
    },
    // SVG转PNG
    convertPng(data) {
        const sourceBuffer = Buffer.from(data.svg, 'utf-8');
        const scale = 2.5;
        const EXTOPX = 8;
        const pngWidth = data.width.substring(0, data.width.length - 2) * EXTOPX * scale;
        const returnBuffer = svg2png.sync(sourceBuffer, {
            width: pngWidth,
        })
        return 'data:image/png;base64,' + returnBuffer.toString('base64');
    },

    
};

// 统一的数据处理入口
router.post("/convert", (req, res) => {
    const type = req.body.operation;
    try {
        if (typeof dbFun[type] !== "function") {
            return res.json({
                code: 401,
                success: false,
                message: `操作类型 ${type} 未定义`,
            });
        }
        dbFun[type](req, res);
    } catch (err) {
        res.json({
            code: err.status || 401,
            success: false,
            message: err.message,
        });
    }
});


module.exports = router;
