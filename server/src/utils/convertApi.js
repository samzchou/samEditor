"use strict";
const path = require("path");
const fs = require("fs-extra");
const commonUtil = require("./common");

// https://www.convertapi.com/# npm i convertapi-js@~1.1
// https://github.com/ConvertAPI/convertapi-library-node/blob/master/examples/create_pdf_thumbnail.js
// secret_sZ3zqSTiQVAZrhAA 7686103@qq.com SamzChou137233 | samz_chou@sina.com | juzhoushen@gmail.com
const MyConvertApi = require('convertapi')('secret_E9F1UAuaEbxTUBmP')

class convertApi {
    constructor(inputPath, convertType) {
        this.inputPath = inputPath;
        this.convertType = convertType;
    }

    getFileContent() {
        try {
            const filePath = path.join(commonUtil.FILE_PATH(), this.inputPath);
            const data = fs.readFileSync(filePath, "utf-8");
            if (data) {
                return data.toString("base64");
            }
        } catch (error) {
            console.log("getFileContent error", error);
        }
    }

    async postFile() {
        let filePath = this.inputPath;
        if (!this.inputPath.startsWith("http")) {
            // 公网文件
            filePath = path.join(commonUtil.FILE_PATH(), this.inputPath);
        }
        const extName = commonUtil.getExt(filePath);
        const dateStr = commonUtil.getDateStr();
        const sourceFileName = path.basename(filePath);
        const reg = new RegExp(extName);
        const outFileName = dateStr + "/" + sourceFileName.replace(reg, this.convertType);

        const outDir = path.join(commonUtil.FILE_PATH(), dateStr);
        // const outPath =
        if (!fs.existsSync(outDir)) {
            commonUtil.mkdirSync(outDir);
        }

        const conversionTimeout = 180;
        return new Promise((resolve, reject) => {
            try {
                MyConvertApi.convert(
                    this.convertType,
                    {
                        File: filePath,
                    },
                    extName,
                    conversionTimeout
                )
                    .then((result) => {
                        result.saveFiles(outDir).then((outFile) => {
                            console.log("File saved: ", outFile);
                            resolve(outFileName);
                        });
                    })
                    .then((files) => {
                        console.log("Files saved to:", files);
                    })
                    .catch((error) => {
                        console.error("failed: ", error);
                        resolve();
                    });
            } catch (error) {
                console.error("failed: ", error);
                resolve();
            }
        });
    }
}

module.exports = convertApi;
