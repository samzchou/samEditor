const express = require("express");
const router = express.Router();
const path = require('path');
const fs = require("fs-extra");
const mathjax = require('mathjax-node');
const svg2png = require('svg2png');
const _ = require('lodash');
// const zipper = require('zip-local');
// const archiver = require('archiver');
const commonUtil = require('../utils/common');
const officeUtils = require('../utils/officeUtils');
// const docDiff = require('../utils/docDiff');
// const wordOption = require('../utils/wordOption');

const dbFun = {
    // 转换数据输出office文档
    async outDoc(req, res) {
        const { xmlData, exportPdf } = req.body;
        const rep = await this.xmlDataTodoc(xmlData, { ..._.pick(req.body, ['tempPath', 'filexp', 'exportPdf', 'wordBreak', 'appType']) });
        if (rep) {
            if (req.body.xmlPath) {
                // do something
            } else {
                const outFile = exportPdf ? rep?.pdfFile : rep?.docFile;
                res.json({
                    success: true,
                    error_code: 200,
                    data: outFile,
                })
            }
        } else {
            res.json({
                success: false,
                error_code: 500,
                error_msg: 'Document output failed, please check if the document structure is complete!',
            })
        }
    },

    async xmlDataTodoc(xmlData = {}, params = {}) {
        // 先创建文件夹存放相关文件
        const rootPath = commonUtil.FILE_PATH();
        const timestamp = new Date().getTime();
        const dateStr = commonUtil.getDateStr();
        const dirPath = path.join(rootPath, dateStr + '/' + timestamp);
        commonUtil.mkdirSync(dirPath);

        // 开始拷贝模板到新创建的文件夹下
        const srcPath = path.join(rootPath, params.tempPath || 'docTmp');
        commonUtil.copyFolder(srcPath, dirPath);

        officeUtils.upperRomanStart = 0;
        officeUtils.decimalStart = 0;
        officeUtils.wordBreak = xmlData.wordBreak;
        officeUtils.letterSpacing = xmlData.letterSpacing;
        officeUtils.tempPath = params.tempPath;

        await commonUtil.sleep(500);
        try {
            const setRels = await this.resetRelsXml(dirPath, xmlData);
            if (setRels) {
                let documentXml = fs.readFileSync(dirPath + '/word/document.xml', 'utf8');
                const hasHeaderFooter = xmlData.headerFooter && xmlData.headerFooter.length;
                
                // 处理正文内容
                const bodyXml = [];
                if (xmlData.body) {
                    const xmlBody = xmlData.body;
                    for (let i = 0; i < xmlBody.length; i++) {
                        let data = xmlBody[i];
                        let xmlStr = '';
                        if (data.isToc) { // 目录须额外处理
                            const tocTempXml = fs.readFileSync(dirPath + '/word/toc.xml', 'utf8');
                            xmlStr = officeUtils.createToc(tocTempXml, data);
                        } else {
                            xmlStr = this.createBodyXml(data, i, i == xmlBody.length - 1, hasHeaderFooter);
                        }
                        bodyXml.push(xmlStr);
                    }
                    documentXml = documentXml.replace(/{@body}/g, bodyXml.join('\n'));
                    fs.writeFileSync(dirPath + '/word/document.xml', documentXml);

                    // 处理编号
                    let bulletXml = '';
                    if (xmlData.bulletList && xmlData.bulletList.length) {
                        bulletXml = this.createNumberXml(xmlData.bulletList);
                    }

                    let numberingXml = fs.readFileSync(dirPath + '/word/numbering.xml', 'utf8');
                    numberingXml = numberingXml.replace(/{@numbering}/g, bulletXml);
                    fs.writeFileSync(dirPath + '/word/numbering.xml', numberingXml);

                    // 设置首页不同，奇偶数页不同
                    let evenAndOddHeaders = '';
                    if (xmlData.diffrentPage) { 
                        evenAndOddHeaders = `<w:evenAndOddHeaders w:val="1"/>`
                    }
                    let settingsXml = fs.readFileSync(dirPath + '/word/settings.xml', 'utf8');

                    // 修订标记（新增内容下划线）
                    let rsidsXml = '';
                    if (xmlData.rsids) {
                        rsidsXml = `<w:rsids><w:rsidRoot w:val="00000000"/><w:rsid w:val="652E1D17"/></w:rsids>`;
                    }

                    settingsXml = settingsXml.replace(/{@evenAndOddHeaders}/g, evenAndOddHeaders);
                    settingsXml = settingsXml.replace(/{@rsids}/g, rsidsXml);
                    fs.writeFileSync(dirPath + '/word/settings.xml', settingsXml);

                    // 创建页眉页脚
                    if (xmlData.headerFooter) {
                        this.createHeaderFooter(xmlData.headerFooter, dirPath, xmlData.wordBreak);
                    }
                    // 处理批注内容,如果是win32的且word自动分页的须移除批注
                    const hasComment = this.createAnnotation(xmlData.annotationList, dirPath);
                    if (hasComment) {

                    }
            
                    // 创建脚注
                    this.createFooterNote(xmlData.footerNotes, dirPath);

                    // 删除相关模板文件
                    fs.unlinkSync(dirPath + `/word/toc.xml`);
                    fs.unlinkSync(dirPath + `/word/cover.xml`);


                    // 生成文档，须做延迟处理，避免有些XML文件未导入而造成结构错误 filexp,exportPdf
                    let filexp = 'docx';

                    await commonUtil.sleep(500);

                    const zipPath = path.join(commonUtil.FILE_PATH(), dateStr, `${timestamp}`);
                    const error = await commonUtil.zipFolder(zipPath);

                    if (error) {
                        console.error('文档压缩error:', error);
                        return null;
                    } else {
                        // 转换为docx文件
                        const zipFile = path.join(rootPath, dateStr, `/${timestamp}.zip`);
                        const docFile = path.join(rootPath, dateStr + `/${timestamp}.${filexp}`);
                        fs.renameSync(zipFile, docFile);

                        params.docFile = dateStr + `/${timestamp}.${filexp}`;
                        // 删除目录
                        // commonUtil.removeFolder(dirPath);
                        return {
                            docFile: params.docFile,
                            pdfFile: params.pdfFile
                        };
                    }
                   
                }
                return null;
            }
        } catch (error) {
            console.error('xmlDataTodoc error:', error);
            return null;
        }
    },

    /**
	 * @description 解析编号样式
	 * @param {*} arr 
	 * @returns 
	 */
	createNumberXml(arr = []) {
		var wNum = [], abstractNumXml = [];
		arr.forEach(item => {
			let xmlData = officeUtils.parseNumber(item);
			wNum.push(xmlData.wNum);
			abstractNumXml.push(xmlData.abstractNumXml);
		})
		return abstractNumXml.join("\n") + wNum.join("\n");
    },
    
    // 创建修订人
    createPeoples(arr = [], dirPath = '') { 

    },

    // 创建批注内容
    createAnnotation(arr = [], dirPath = '') {
        if (arr.length) {
            let commentXml = [], commentsExtendedXml = [], people = [];
            for (let i = 0; i < arr.length; i++) {
                const itemData = arr[i];
                const annotationXmlData = officeUtils.parseAnnotation(itemData);
                commentXml = commentXml.concat(annotationXmlData.commentsArr);
                commentsExtendedXml = commentsExtendedXml.concat(annotationXmlData.commentsExtended);
                people = people.concat(people);
            }
            // 替换comments.xml内容
            let commentTemp = fs.readFileSync(path.join(dirPath, `word/comments.xml`), 'utf8');
            commentTemp = commentTemp.replace(/{@list}/g, commentXml.join("\n"));
            fs.writeFileSync(path.join(dirPath, `word/comments.xml`), commentTemp);

            // 替换commentsExtended.xml内容
            let commentsExtendedTemp = fs.readFileSync(path.join(dirPath, `word/commentsExtended.xml`), 'utf8');
            commentsExtendedTemp = commentsExtendedTemp.replace(/{@list}/g, commentsExtendedXml.join("\n"));
            fs.writeFileSync(path.join(dirPath, `word/commentsExtended.xml`), commentsExtendedTemp);

            // 替换people.xml内容
            people = commonUtil.uniqArray(people);
            const peopleXml = [];
            for (let i = 0; i < people.length; i++) {
                let xml = `
                    <w15:person w15:author="${people[i]}">
                        <w15:presenceInfo w15:providerId="None" w15:userId="${people[i]}"/>
                    </w15:person>
                `;
                peopleXml.push(xml);
            }
            let peopleTemp = fs.readFileSync(path.join(dirPath, `word/people.xml`), 'utf8');
            peopleTemp = peopleTemp.replace(/{@list}/g, peopleXml.join("\n"));
            fs.writeFileSync(path.join(dirPath, `word/people.xml`), peopleTemp);

            return true;
        } else {
            fs.unlinkSync(path.join(dirPath, `word/comments.xml`));
            fs.unlinkSync(path.join(dirPath, `word/commentsExtended.xml`));
            fs.unlinkSync(path.join(dirPath, `word/people.xml`));
        }
		return false;
	},

    // 创建脚注 officeUtils
    createFooterNote(arr = [], dirPath = '') {
        const notePath = path.join(dirPath, `word/footnotes.xml`);
		let noteXml = '', settingXml = '';
        let noteTemp = fs.readFileSync(notePath, 'utf8');
        let setttingTemp = fs.readFileSync(path.join(dirPath, `word/settings.xml`), 'utf8');
		if (arr.length) {
			// 脚注XML数据集
			const noteXmlData = officeUtils.parseFooterNote(arr);
			noteXml = noteXmlData.noteHeader.join("\n");
			noteXml += noteXmlData.notes.join("\n");
			// 须加入脚注标签
			if (noteXmlData.pro) {
				settingXml = `
					<w:footnotePr>
						${noteXmlData.pro.join("\n")}
					</w:footnotePr>
				`;
			}
		}
		noteTemp = noteTemp.replace(/{@footnote}/g, noteXml);
		fs.writeFileSync(path.join(dirPath, `word/footnotes.xml`), noteTemp);
		setttingTemp = setttingTemp.replace(/{@footnotePr}/g, settingXml);
		fs.writeFileSync(path.join(dirPath, `word/settings.xml`), setttingTemp);
	},
    async createHeaderFooter(arr = [], dirPath = '', wordBreak=false) {
		// 页眉
		const headerTemp = fs.readFileSync(path.join(dirPath, `word/headerTemp.xml`), 'utf8');
		// 程序分页
        let footerTemp = fs.readFileSync(path.join(dirPath, `word/footerTemp.xml`), 'utf8');
        // 页眉页脚图片模板文件
        const hfImgTemp = fs.readFileSync(path.join(dirPath, `word/hfImgTemp.xml`), 'utf8');
		// word自动分页的页脚
		/* if (wordBreak) {
			footerTemp = fs.readFileSync(path.join(dirPath, `word/footerNumber.xml`), 'utf8');
		} */
        const customSectPr = [];
		for (let i = 0; i < arr.length; i++) {
			let itemData = arr[i];
            // 创建页眉
            if (itemData.header) {
                let headerXml = this.replaceHeaderFooter(headerTemp, itemData.header);
                if (!headerXml) continue;
                fs.writeFileSync(path.join(dirPath, `word/header${itemData.index}.xml`), headerXml);
                // 页眉的图片处理
                if (itemData.header?.imgs && itemData.header.imgs.length) {
                    const headerImgRelation = [];
                    for (let j = 0; j < itemData.header.imgs.length; j++) {
                        const img = itemData.header.imgs[j];
                        if (img.path.indexOf('?') > 1) { 
                            img.path = img.path.replace(/(\?|#)[^'"]*/, '');
                        }
                        const rId = 'rId' + img.index;
                        const imgPath = img.path;
                        const resImg = await commonUtil.downloadByUrl(imgPath, path.join(dirPath, 'word/media/'));
                        headerImgRelation.push(`<Relationship Id="${rId}" Target="media/${resImg?img.fileName:'empty.png'}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"/>`);
                    }
                    // 写入页眉关联文件
                    const headerImgXml = hfImgTemp.replace(/{@content}/g, headerImgRelation.join("\n"));
                    fs.writeFileSync(path.join(dirPath, `word/_rels/header${itemData.index}.xml.rels`), headerImgXml);
                }
            }

            // 创建页脚
            if (itemData.footer) {
                let footerXml = this.replaceHeaderFooter(footerTemp, itemData.footer);
                if (!footerXml) continue;
                fs.writeFileSync(path.join(dirPath, `word/footer${itemData.index}.xml`), footerXml);
                // 页脚的图片处理
                if (itemData.footer?.imgs && itemData.footer.imgs.length) {
                    const footerImgRelation = [];
                    for (let j = 0; j < itemData.footer.imgs.length; j++) {
                        const img = itemData.footer.imgs[j];
                        if (img.path.indexOf('?') > 1) { 
                            img.path = img.path.replace(/(\?|#)[^'"]*/, '');
                        }
                        const rId = 'rId' + img.index;
                        const imgPath = img.path;
                        const resImg = await commonUtil.downloadByUrl(imgPath, path.join(dirPath, 'word/media/'));
                        footerImgRelation.push(`<Relationship Id="${rId}" Target="media/${resImg?img.fileName:'empty.png'}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"/>`);
                    }
                    // 写入页眉关联文件
                    const footerImgXml = hfImgTemp.replace(/{@content}/g, footerImgRelation.join("\n"));
                    fs.writeFileSync(path.join(dirPath, `word/_rels/footer${itemData.index}.xml.rels`), footerImgXml);
                }
            }

			customSectPr.push(`<customSectPr/>`);
		}
		let customSectPrXml = fs.readFileSync(path.join(dirPath, `customXml/item1.xml`), 'utf8');
		customSectPrXml = customSectPrXml.replace(/{@customSectPr}/g, customSectPr.join("\n"));
		fs.writeFileSync(path.join(dirPath, `customXml/item1.xml`), customSectPrXml);

		// 完成后删除模板文件
		fs.unlinkSync(path.join(dirPath, `word/headerTemp.xml`));
		fs.unlinkSync(path.join(dirPath, `word/footerTemp.xml`));
		fs.unlinkSync(path.join(dirPath, `word/footerNumber.xml`));
		fs.unlinkSync(path.join(dirPath, `word/finished_portrait.xml`));
        fs.unlinkSync(path.join(dirPath, `word/finished_landscape.xml`));
        fs.unlinkSync(path.join(dirPath, `word/hfImgTemp.xml`));
    },
    // 页眉页脚内容
    replaceHeaderFooter(tempXmlStr = '', data = {}) {
        let xmlContent = officeUtils.setPageHeaderFooter(data);
        if (xmlContent) {
            tempXmlStr = tempXmlStr.replace(/{@contents}/g, xmlContent);
            return tempXmlStr;
        }
        return '';
    },
    
    // 页面正文XML内容
    createBodyXml(data = null, index = 0, isLast = false, hasHeaderFooter = false) {
        const xmlList = officeUtils.parseXmlLists(data.xmlList);
        // 处理分页
        const pageBreakXml = officeUtils.parsePageBreak(
            data.pagePram || data.pagePramams,
            index,
            isLast,
            hasHeaderFooter,
            data.pagePram.pageNumText
        )
        return xmlList.join('\n') + pageBreakXml;
    },

    async resetRelsXml(dirPath, xmlData = {}) {
        const relsName = path.join(dirPath, 'word/_rels/document.xml.rels');    // 映射文件
        const contentTypeFile = path.join(dirPath, '[Content_Types].xml');      // 页面页脚内容文件
        await commonUtil.sleep(300);
        
        let rels = fs.readFileSync(relsName, 'utf8');
        // let data = null;
        // 处理页眉页脚
        let types = fs.readFileSync(contentTypeFile, 'utf8');
        let xmlStrs = [], contentTypes = [];
        if (xmlData.headerFooter && xmlData.headerFooter.length) {
            for (let i = 0; i < xmlData.headerFooter.length; i++) { 
                let num = i + 1;
				let headerName = `header${num}`;
				let footerName = `footer${num}`;

				let headerShip = `<Relationship Id="${headerName}" Target="${headerName}.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header"/>`;
				let headerOverride = `<Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml" PartName="/word/${headerName}.xml"/>`;
				xmlStrs.push(headerShip);
				contentTypes.push(headerOverride);

				let footerShip = `<Relationship Id="${footerName}" Target="${footerName}.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer"/>`;
				let footerOverride = `<Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml" PartName="/word/${footerName}.xml"/>`;
				xmlStrs.push(footerShip);
				contentTypes.push(footerOverride);
            }
        }
        rels = rels.replace(/{@rels}/g, xmlStrs.join('\n'));
        // 同步修改内容
        types = types.replace(/{@pages}/g, contentTypes.join('\n'));
        fs.writeFileSync(contentTypeFile, types);

        // 处理图片或其他媒体文件
        xmlStrs = [];
        // 图片位置是否在页眉页脚中

        if (xmlData.mediaList && xmlData.mediaList.length) {
            for (let i = 0; i < xmlData.mediaList.length; i++) {
                let data = xmlData.mediaList[i];
                if (data.path.indexOf('?') > 1) {
                    data.path = data.path.replace(/(\?|#)[^'"]*/, ''); //data.path.slice(0, expIndex);
                }
                let rId = 'rId100' + data.index;
                let imgPath = data.path;
                let resImg = await commonUtil.downloadByUrl(imgPath, dirPath + '/word/media/')
                if (resImg) {
                    xmlStrs.push(`<Relationship Id="${rId}" Target="media/${data.fileName}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"/>`);
                } else {
                    xmlStrs.push(`<Relationship Id="${rId}" Target="media/empty.png" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"/>`);
                }
            }
        }
        // 处理空批注
        if (!xmlData.annotationList || !xmlData.annotationList.length) {
            rels = rels.replace(`<Relationship Id="rId6" Target="commentsExtended.xml" Type="http://schemas.microsoft.com/office/2011/relationships/commentsExtended"/>`, '')
                .replace(`<Relationship Id="rId7" Target="comments.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments"/>`, '')
                .replace(`<Relationship Id="rId5" Target="people.xml" Type="http://schemas.microsoft.com/office/2011/relationships/people"/>`, '');
        }

        rels = rels.replace(/{@media}/g, xmlStrs.join('\n'));
        fs.writeFileSync(relsName, rels);
        return true;
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
                    svg: svg || false,
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
}

// 执行处理
function executeUtils(req, res) {
	const type = req.body.operation || req.body.type;
	try {
		dbFun[type](req, res);
	} catch (e) {
		res.json({
			success: false,
			error_code: 500,
			message: "function " + type + " not defined!"
		});
	}
}

router.all('/document', (req, res, next) => {
    executeUtils(req, res)
})

module.exports = router