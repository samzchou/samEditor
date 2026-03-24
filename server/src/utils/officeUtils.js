/**
 * ===================================================================================================================
 * @module
 * @desc DocXML解析处理模块
 * @author sam 2021-11-01
 * ===================================================================================================================
 */
'use strict';
const { v4: uuidv4 } = require('uuid');
const _ = require('lodash');
const commonUtil = require('./common');
// 编号枚举○
const bulletMap = {
	'circle': { name: '实心圆圈', 'str': '', symbol: '', format: 'bullet', fontFamily: 'Wingdings', fontSize: 15, type: 'singleLevel', ilvl: 0 },   		// 实心圆圈 ●
	'hollow-circle': { name: '空心圆圈', 'str': '○', symbol: '○', format: 'bullet', type: 'singleLevel', ilvl: 0 },                		// 空心圆圈 ○
	'square': { name: '实心方块', 'str': '', symbol: '', format: 'bullet', fontFamily: 'Wingdings', fontSize: 15, type: 'singleLevel', ilvl: 0 },  	// 实心方块 ■
	'hollow-square': { name: '空心方块', 'str': '□', symbol: '□', format: 'bullet', type: 'singleLevel', ilvl: 0 },                		// 空心方块 □
	'line': { name: '破折号', 'str': '——', symbol: '——', format: 'none', fontSize: 13, type: 'singleLevel', ilvl: 0 },                    				// 破折号 ——
	'num': { name: '数字', 'str': '%1)', format: 'decimal', fontSize: 21, type: 'singleLevel', ilvl: 0 },                               				// 数字1）
	'full-num': { name: '数字', 'str': '(%1)', format: 'decimal', fontSize: 21, type: 'singleLevel', ilvl: 0 },                               				// 数字(1）
	'num-index': { name: '数字', 'str': '[%1]', format: 'decimal', fontSize: 21, type: 'singleLevel', ilvl: 0 },                               			// 数字带框
	'tag-index': { name: '标引数字', 'str': '%1——', format: 'decimal', fontSize: 21, type: 'singleLevel', ilvl: 0 },                               		// 数字带框
	'lower': { name: '英文字母', 'str': '%1)', format: 'lowerLetter', fontSize: 21, type: 'singleLevel', ilvl: 0 },                            			// 英文字母
	'full-lower': { name: '英文字母-全括号', 'str': '(%1)', format: 'lowerLetter', fontSize: 21, type: 'singleLevel', ilvl: 0 },                		// 英文字母-全括号
	'uplower': { name: '大写英文字母', 'str': '%1)', format: 'upperLetter', fontSize: 21, type: 'singleLevel', ilvl: 0 },                          		// 大写英文字母
	'full-uplower': { name: '大写英文字母-全括号', 'str': '(%1)', format: 'upperLetter', fontSize: 21, type: 'singleLevel', ilvl: 0 },                	// 大写英文字母-全括号
	'diamond': { name: '实心菱形', 'str': '', symbol: '', fontFamily: 'Wingdings', format: 'bullet', fontSize: 13, type: 'singleLevel', ilvl: 0 },  	// 实心菱形◆
	'hollow-diamond': { name: '空心菱形', 'str': '◇', symbol: '', format: 'bullet', fontSize: 13, type: 'singleLevel', ilvl: 0 },  					// 空心菱形◇
	'level': { name: '数字层级', 'str': '%1  ', fontFamily: '黑体', fontSize: 21, type: 'multilevel', format: 'decimal' },
	'appendix': { name: '附录层级', 'str': 'A.%1  ', fontFamily: '黑体', fontSize: 21, type: 'multilevel', format: 'decimal' },
	'letter': { name: '英文字母', 'str': '%1', format: 'lowerLetter', fontSize: 18, type: 'singleLevel', ilvl: 0 },
	'zhu': { name: '条文注', 'str': '注', fontFamily: '黑体', fontSize: 18, type: 'singleLevel', format: 'none' },
	'zhux': { name: '条文注X', 'str': '注%1', fontFamily: '黑体', fontSize: 18, type: 'multilevel', format: 'decimal' },
	'example': { name: '示例', 'str': '示例', fontFamily: '黑体', fontSize: 18, type: 'singleLevel', format: 'none' },
	'examplex': { name: '示例X', 'str': '示例%1', fontFamily: '黑体', fontSize: 18, type: 'multilevel', format: 'decimal' },
	'example-x': { name: '首示例X', 'str': '示例%1', fontFamily: '黑体', fontSize: 18, type: 'multilevel', format: 'decimal' },
	'footnote': { name: '条文脚注', 'str': '%1)', format: 'decimal', fontSize: 18, type: 'multilevel', ilvl: 0 },
	'image': { name: '图标题', 'str': '%1', format: 'decimal', fontSize: 21, type: 'singleLevel', ilvl: 0 },
	'table': { name: '表标题', 'str': '%1', format: 'decimal', fontSize: 21, type: 'singleLevel', ilvl: 0 },
	'upperLetter': { name: '大写字母', 'str': '%1', format: 'upperLetter', fontSize: 21, type: 'singleLevel', ilvl: 0 },
}

// 边框类型枚举
const solidType = {
	'dotted': 'sysDot',
	'dashed': 'sysDash'
}

// 字符间距增宽


module.exports = {
	// 解析分辨率
	dpi: 96,
	upperRomanStart: 0,
	decimalStart: 0,
	wordBreak: false, 		// word自动分页
	tempPath: undefined, 	// 模板
	wordBreak: false,
	letterSpacing: 0, 		// 字符间距增宽
	
	/**
	 * @description 解析目录结构
	 * @param {String} tmpXml 
	 * @param {Array} data 
	 * @param {Int} i 
	 * @returns 
	 */
	createToc(tmpXml = "", data = [], i = 0) {
		const pageParm = data.pagePram;
		const pgNumType = pageParm.pgNumType || 'decimal';

		let typeXml = `<w:pgNumType w:fmt="${pgNumType}" w:start="${pageParm.pgNumStart || 1}"/>`;
		if (i > 0) {
			typeXml = `<w:pgNumType w:fmt="${pgNumType}"/>`;
		}
		// 目录页的分页数据 {@footerType}
		let wType = pageParm.referenceType || 'default';
		tmpXml = tmpXml.replace(/{@wType}/g, wType);
		tmpXml = tmpXml.replace(/{@pageHeight}/g, pageParm.pageHeight)
			.replace(/{@pageWidth}/g, pageParm.pageWidth)
			.replace(/{@pageBottom}/g, pageParm.pageBottom)
			.replace(/{@pageRight}/g, pageParm.pageRight)
			.replace(/{@pageTop}/g, pageParm.pageTop)
			.replace(/{@pageLeft}/g, pageParm.pageLeft)
			.replace(/{@pageHeader}/g, pageParm.pageHeader || 850)
			.replace(/{@pageFooter}/g, pageParm.pageFooter || 680)
			.replace(/{@header}/g, 'header' + pageParm.pageIndex)
			.replace(/{@footerType}/g, typeXml)
			.replace(/{@footer}/g, 'footer' + pageParm.pageIndex)
			.replace(/{@wType}/g, wType);
		const list = [];
		data.arr.forEach((item, index) => {
			let numFont = `<w:rFonts w:ascii="${item?.numStyle?.fontFamily || '宋体'}" w:cs="${item?.numStyle?.fontFamily || '宋体'}" w:hAnsi="${item?.numStyle?.fontFamily || '宋体'}" w:hint="eastAsia"/>`;
			let whit = 'default';
			if (item?.numStyle?.fontFamily && ['times new roman', 'webdings', 'wingdings'].includes(item?.numStyle?.fontFamily?.toLowerCase())) {
				whit = ['webdings', 'wingdings'].includes(item.numStyle.fontFamily?.toLowerCase()) ? 'monospace' : 'default';
				numFont = `<w:rFonts w:ascii="${item.numStyle.fontFamily}" w:cs="${item.numStyle.fontFamily}" w:hAnsi="${item.numStyle.fontFamily}" w:hint="${whit}"/>`;
			}
			let titleFont = `<w:rFonts w:ascii="${item?.titleStyle?.fontFamily || '宋体'}" w:cs="${item?.titleStyle?.fontFamily || '宋体'}" w:hAnsi="${item?.titleStyle?.fontFamily || '宋体'}" w:hint="eastAsia"/>`;
			if (item?.titleStyle?.fontFamily && ['times new roman', 'webdings', 'wingdings'].includes(item?.titleStyle?.fontFamily?.toLowerCase())) {
				whit = ['webdings', 'wingdings'].includes(item.titleStyle.fontFamily?.toLowerCase()) ? 'monospace' : 'default';
				titleFont = `<w:rFonts w:ascii="${item.titleStyle.fontFamily}" w:cs="${item.titleStyle.fontFamily}" w:hAnsi="${item.titleStyle.fontFamily}" w:hint="${whit}"/>`;
			}

			let firstStart = '';
			if (index === 0) {
				firstStart = `
					<w:r>
						<w:fldChar w:fldCharType="begin"/>
					</w:r>
					<w:r>
						<w:rPr>
							<w:rStyle w:val="Hyperlink"/>
							${titleFont}
							<w:sz w:val="${item?.titleStyle?.fontSize || 21}"/>
							<w:szCs w:val="${item?.titleStyle?.fontSize || 21}"/>
						</w:rPr>
						<w:instrText>TOC \\o &quot;1-3&quot; \\h \\z \\u \\* MERGEFORMAT</w:instrText>
					</w:r>
					<w:r>
						<w:fldChar w:fldCharType="separate"/>
					</w:r>
				`;
			}
			let level = item.leftChars / 100;
			let levelStyle = 'toc_' + level;
			
			let wrprXml = `
				<w:rPr>
					${numFont}
					<w:sz w:val="${item?.numStyle?.fontSize || 21}"/>
					<w:szCs w:val="${item?.numStyle?.fontSize || 21}"/>
				</w:rPr>
			`
			// 页码前缀
			let prefixXml = '';
			if (item.prefix) {
				prefixXml = `
					<w:r>
						${wrprXml}
						<w:t>${item.prefix}</w:t>
					</w:r>
				`
			}
			// 页码后缀
			let suffixXml = '';
			if (item.suffix) {
				suffixXml = `
					<w:r>
						${wrprXml}
						<w:t>${item.suffix}</w:t>
					</w:r>
				`
			}

			let xml = `
				<w:p>
					<w:pPr>
						<w:pStyle w:val="${levelStyle}"/>
						<w:bidi w:val="0"/>
						<w:widowControl val="0"/>
					</w:pPr>
					${firstStart}
					<w:r>
						<w:fldChar w:fldCharType="begin"/>
					</w:r>
					<w:r>
						<w:rPr>
							<w:rStyle w:val="Hyperlink"/>
							${titleFont}
							<w:sz w:val="${item?.titleStyle?.fontSize || 21}"/>
							<w:szCs w:val="${item?.titleStyle?.fontSize || 21}"/>
						</w:rPr>
						<w:instrText xml:space="preserve">HYPERLINK \\l &quot;${item.id}&quot; </w:instrText>
					</w:r>
					<w:r>
						<w:fldChar w:fldCharType="separate"/>
					</w:r>
					<w:r>
						<w:rPr>
							<w:rStyle w:val="Hyperlink"/>
							${titleFont}
							<w:sz w:val="${item?.titleStyle?.fontSize || 21}"/>
							<w:szCs w:val="${item?.titleStyle?.fontSize || 21}"/>
						</w:rPr>
						<w:t>${item.title}</w:t>
					</w:r>
					<w:r>
						<w:tab/>
					</w:r>
					${prefixXml}
					<w:r>
						${wrprXml}
						<w:fldChar w:fldCharType="begin"/>
					</w:r>
					<w:r>
						${wrprXml}
						<w:instrText xml:space="preserve">PAGEREF ${item.id} \\h </w:instrText>
					</w:r>
					<w:r>
						<w:rPr>
							${numFont}
							<w:sz w:val="${item?.numStyle?.fontSize || 21}"/>
							<w:szCs w:val="${item?.numStyle?.fontSize || 21}"/>
						</w:rPr>
						<w:fldChar w:fldCharType="separate"/>
					</w:r>
					<w:r>
						${wrprXml}
						<w:t>${item.num}</w:t>
					</w:r>
					<w:r>
						<w:rPr>
							${numFont}
							<w:sz w:val="${item?.numStyle?.fontSize || 21}"/>
							<w:szCs w:val="${item?.numStyle?.fontSize || 21}"/>
						</w:rPr>
						<w:fldChar w:fldCharType="end"/>
					</w:r>
					<w:r>
						<w:fldChar w:fldCharType="end"/>
					</w:r>
					${suffixXml}
				</w:p>
			`;
			list.push(xml);
		});

		tmpXml = tmpXml.replace(/{@list}/g, list.join(""));
		if (i === 0 && data.title) {
			tmpXml = this.setTocTitle(data.title) + tmpXml;
		}
		return tmpXml;
	},

	setTocTitle(titleObj) {
		let wpXml = this.parseWprXml(titleObj);
		const content = [];
		if (titleObj.children) {
			titleObj.children.forEach(item => {
				let wrXml = this.parseWrXml(item);
				content.push(wrXml)
			})
		}
		return `
			<w:p>
				${wpXml}
				${content.join("")}
			</w:p>
		`;
	},

	// 解析段落块
	parseXmlLists(xmlList = [], isBox = false, pbdr = "") {
		const xmlArr = [];
		xmlList.forEach(item => {
			let xmlStr = '';
			if (item.trXml || item.isTable) {				// 表格解析
				xmlStr = this.parseTableXml(item);
			} else if (item.isBox) {						// 文本框	
				xmlStr = this.parseTextBox(item);
			} else if (item.imgWidth || item.isImage) {		// 图片解析
				xmlStr = this.parseImageXml(item);
			} else if (item.finishedLine) {					// 终结线
				xmlStr = this.parseFinishedLine(item);
			} else if (item.hrLine) {						// 水平分割线
				xmlStr = this.parseHrdLine(item);
			} else {										// 一般段落及章节条款
				xmlStr = this.parseParagrahXml(item, isBox, pbdr);
			}
			xmlArr.push(xmlStr);
		});
		return xmlArr;
	},

	// 解析水平分割线
	parseHrdLine(item) {
		const itemStyle = item.style || item.attr.style;
		// 单线
		const borderWidth = itemStyle.borderWidth ? itemStyle.borderWidth * 12700 : 12700;
		let bpt = itemStyle.borderWidth || 1;
		let borderColor = itemStyle.borderColor || '000000'; // itemStyle?.borders?.[0]?.color ? itemStyle?.borders?.[0]?.color.replace('#', '') : '000000';
		let aln = `
			<a:ln>
				<a:solidFill>
					<a:schemeClr val="tx2"/>
				</a:solidFill>
			</a:ln>
		`;
		let schemeClr = `<a:srgbClr val="FFFFFF"/>`;

		if (itemStyle?.borders) {
			borderColor = itemStyle.borders?.[0]?.color.replace('#', '');
		}
		// 双线
		
		if (itemStyle?.borders && itemStyle.borders[0]?.type === 'double') {
			aln = `
				<a:ln cap="sq" cmpd="dbl" w="${borderWidth / 2}">
					<a:solidFill>
						<a:srgbClr val="${borderColor}"/>
					</a:solidFill>
				</a:ln>
			`;
			bpt = bpt === 1 ? 2 : Math.ceil(bpt / 3);
		} else if (itemStyle.borderStyle) { 
			aln = `
				<a:ln w="${borderWidth}" cmpd="sng">
					<a:solidFill>
						<a:srgbClr val="${borderColor}"/>
					</a:solidFill>
					<a:prstDash val="${itemStyle.borderStyle}"/>
				</a:ln>
			`; 
		}
		
		// <w:pStyle w:val="finished"/>
		let wpXml = `
			<w:pPr>
				<w:rPr>
					<w:rFonts w:hint="eastAsia"/>
					<w:lang w:eastAsia="zh-CN" w:val="en-US"/>
				</w:rPr>
			</w:pPr>
			<w:r>
				<w:rPr>
					<w:sz w:val="21"/>
				</w:rPr>
				<mc:AlternateContent>
					<mc:Choice Requires="wps">
						<w:drawing>
							<wp:anchor allowOverlap="1" behindDoc="0" distB="${itemStyle.distB}" distL="${itemStyle.distL}" distR="${itemStyle.distR}" distT="${itemStyle.distT}" layoutInCell="1" locked="0" relativeHeight="251659264" simplePos="0">
								<wp:simplePos x="0" y="0"/>
								<wp:positionH relativeFrom="page">
									<wp:posOffset>${itemStyle.left}</wp:posOffset>
								</wp:positionH>
								<wp:positionV relativeFrom="page">
									<wp:posOffset>${itemStyle.top}</wp:posOffset>
								</wp:positionV>
								<wp:extent cx="${itemStyle.width}" cy="0"/>
								<wp:effectExtent b="0" l="0" r="0" t="0"/>
								<wp:wrapNone/>
								<wp:docPr id="${item.id || 1}" name="水平线-连接符-${item.id || 1}"/>
								<wp:cNvGraphicFramePr/>
								<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
									<a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">
										<wps:wsp>
											<wps:cNvCnPr/>
											<wps:spPr>
												<a:xfrm>
													<a:off x="1148715" y="1224915"/>
													<a:ext cx="5262880" cy="0"/>
												</a:xfrm>
												<a:prstGeom prst="line">
													<a:avLst/>
												</a:prstGeom>
												${aln}
											</wps:spPr>
											<wps:style>
												<a:lnRef idx="${item.id || 1}">
													${schemeClr}
												</a:lnRef>
												<a:fillRef idx="0">
													${schemeClr}
												</a:fillRef>
												<a:effectRef idx="0">
													${schemeClr}
												</a:effectRef>
												<a:fontRef idx="minor">
													<a:schemeClr val="tx1"/>
												</a:fontRef>
											</wps:style>
											<wps:bodyPr/>
										</wps:wsp>
									</a:graphicData>
								</a:graphic>
							</wp:anchor>
						</w:drawing>
					</mc:Choice>
					<mc:Fallback>
						<w:pict>
							<v:line id="水平线-连接符-${item.id || 1}" coordsize="21600,21600" filled="f" stroked="t">
								<v:fill focussize="0,0" on="f"/>
								<v:stroke color="#${borderColor.replace('#', '')} [3200]" joinstyle="miter" miterlimit="8" weight="${bpt}pt"/>
								<v:imagedata o:title=""/>
								<o:lock aspectratio="f" v:ext="edit"/>
							</v:line>
						</w:pict>
					</mc:Fallback>
				</mc:AlternateContent>
			</w:r>
		`;
		return `
			<w:p name="水平线">
				${wpXml}
			</w:p>
		`;
	},

	// 解析终止线
	parseFinishedLine(item) {
		// var itemStyle = item.style || item.attr.style;
		var weight = item.weight || '1.0pt';
		var wpXml = `
			<w:pPr>
				<w:pStyle w:val="finished"/>
				<w:snapToGrid w:val="0"/>before
				<w:spacing w:before="300" w:line="360" w:lineRule="auto"/>
				<w:rPr>
					<w:rFonts w:hint="eastAsia"/>
					<w:lang w:eastAsia="zh-CN" w:val="en-US"/>
				</w:rPr>
			</w:pPr>
			<w:r>
				<w:rPr>
					<w:sz w:val="21"/>
				</w:rPr>
				<w:pict>
					<v:line coordsize="21600,21600" filled="f" id="_x0000_s1026" o:spid="_x0000_s1026" o:spt="20" stroked="t" style="height:0pt;width:148.8pt;">
						<v:path arrowok="t"/>
						<v:fill focussize="0,0" on="f"/>
						<v:stroke color="#000000" joinstyle="miter" weight="${weight}"/>
						<v:imagedata o:title=""/>
						<o:lock aspectratio="f" v:ext="edit"/>
						<w10:wrap type="none"/>
						<w10:anchorlock/>
					</v:line>
				</w:pict>
			</w:r>
		`;
		return `
			<w:p name="终止线">
				${wpXml}
			</w:p>
		`;
	},

	// 解析文本框
	parseTextBox(data = null) {
		const itemStyle = data.style || data.attr.style;
		const fontFamily = itemStyle.fontFamily || '宋体';
		const fontSize = itemStyle.fontSize || 21;
		const filled = itemStyle.bgColor ? 't' : 'f';

		let stroked = 'f';
		let strokedXml = '';
		let strokedStyle = ''
		if (itemStyle.borderWidth) {
			stroked = 't';
			if (['dashed', 'dotted'].includes(itemStyle.borderStyle)) {
				strokedStyle = itemStyle.borderStyle === 'dashed' ? `dashstyle="dash"` : `dashstyle="1 1" endcap="square"`;
			}
			strokedXml = `<v:stroke ${strokedStyle} />`
		}

		let childXml = [];
		if (data.children) {
			childXml = this.parseXmlLists(data.children, true).join("");
		}

		const _id = '_x' + uuidv4();
		const shapeId = '_x' + uuidv4();

		let font = `<w:rFonts w:ascii="${fontFamily}" w:cs="${fontFamily}" w:hAnsi="${fontFamily}" w:eastAsia="${fontFamily}" w:hint="eastAsia"/>`;
		if (['times new roman', 'webdings', 'wingdings'].includes(fontFamily?.toLowerCase())) {
			let whit = ['webdings', 'wingdings'].includes(fontFamily?.toLowerCase()) ? 'monospace' : 'default';
			font = `<w:rFonts w:ascii="${fontFamily}" w:cs="${fontFamily}" w:hAnsi="${fontFamily}" w:hint="${whit}"/>`;
		}
		const wpXml = `
			<w:pPr>
				<w:snapToGrid w:val="0"/>
				<w:rPr>
					${font}
					<w:sz w:val="${fontSize}"/>
					<w:szCs w:val="${fontSize}"/>
				</w:rPr>
			</w:pPr>
			<w:r>
				<w:pict>
					<v:shapetype coordsize="21600,21600" id="${_id}" o:spt="202" path="m,l,21600r21600,l21600,xe">
						<v:stroke joinstyle="miter"/>
						<v:path gradientshapeok="t" o:connecttype="rect"/>
					</v:shapetype>
					<v:shape xmlns:v="urn:schemas-microsoft-com:vml" id="${shapeId}" type="#${_id}" stroked="${stroked}" strokecolor="${itemStyle.borderColor || '#ffffff'}" strokeweight="${itemStyle.borderWidth || '0'}pt" fillcolor="${itemStyle.bgColor || ''}" filled="${filled}" style="position:absolute;left:0;text-align:left;margin-left:${itemStyle.ptLeft}pt;margin-top:${itemStyle.ptTop}pt;width:${itemStyle.ptWidth}pt;height:${itemStyle.ptHeight}pt;z-index:251659264;mso-position-horizontal-relative:page;mso-position-vertical-relative:page">
						${strokedXml}
						<v:fill color="${itemStyle.bgColor || '#FFFFFF'}" type="solid"/>
						<o:lock v:ext="edit" rotation="t" xmlns:o="urn:schemas-microsoft-com:office:office"/>
						<v:textbox inset="0,0,0,0">
							<w:txbxContent>
							${childXml}
							</w:txbxContent>
						</v:textbox>
						<w10:wrap anchory="page"/>
					</v:shape>
				</w:pict>
			</w:r>
		`;

		return `
			<w:p name="文本框">
				${wpXml}
			</w:p>
		`;
	},

	// 解析图片
	parseImageXml(data = null) {
		if (!data) {
			return '';
		}
		var wInd = '';
		var style = data.style || data.attr?.style || {};
		if (style && style.left) {
			wInd = `<w:ind w:left="${style.left}" w:leftChars="0"/>`;
		}
		var wpXml = this.parseWprXml(data, '', wInd);
		var wDrawing = this.parseImageDrawing(data);
		var otherXml = '';
		// 公式编号
		if (data.mathNum) {
			let tabXml = `
				<w:r>
					<w:rPr>
						<w:rFonts w:hint="default"/>
						<w:sz w:val="21"/>
						<w:szCs w:val="21"/>
					</w:rPr>
					<w:tab/>
				</w:r>
			`;
			wpXml = `
				<w:pPr>
					<w:pStyle w:val="math"/>
					<w:snapToGrid w:val="0"/>
					<w:rPr>
						<w:sz w:val="21"/>
						<w:szCs w:val="21"/>
					</w:rPr>
				</w:pPr>
				${tabXml}
			`;
			// 公式图片超过宽度
			let emptyWr = data.imgWidth > 2354580 ? '' : tabXml;
			otherXml = `
				${emptyWr}
				${tabXml}
				<w:r>
					<w:rPr>
						<w:rFonts w:hint="default"/>
						<w:sz w:val="21"/>
						<w:szCs w:val="21"/>
					</w:rPr>
					<w:t>（${data.mathNum}）</w:t>
				</w:r>
			`;
		}
		// 图标题等
		if (data.children && data.children.length) {
			var appendXml = [];
			data.children.forEach(item => {
				let itemStyle = item.style || item.attr.style;
				let font = `<w:rFonts w:ascii="${itemStyle.fontFamily}" w:cs="${itemStyle.fontFamily}" w:hAnsi="${itemStyle.fontFamily}" w:eastAsia="${itemStyle.fontFamily}" w:hint="eastAsia"/>`;
				if (['times new roman', 'webdings', 'wingdings'].includes(itemStyle.fontFamily?.toLowerCase())) {
					let whit = ['webdings', 'wingdings'].includes(itemStyle.fontFamily?.toLowerCase()) ? 'monospace' : 'default';
					font = `<w:rFonts w:ascii="${itemStyle.fontFamily}" w:cs="${itemStyle.fontFamily}" w:hAnsi="${itemStyle.fontFamily}" w:hint="${whit}"/>`;
				}
				appendXml.push(`
					<w:r>
						<w:br w:type="textWrapping"/>
					</w:r>
					<w:r>
						<w:rPr>
							${font}
							<w:sz w:val="${itemStyle.fontSize}"/>
							<w:szCs w:val="${itemStyle.fontSize}"/>
							<w:lang w:eastAsia="zh-CN" w:val="en-US"/>
						</w:rPr>
						<w:t xml:space="preserve">${item.text}</w:t>
					</w:r>
				`);
			})
			otherXml = appendXml.join("\n");
		}
		return `
			<w:p>
				${wpXml}
				<w:r>
					${wDrawing}
				</w:r>
				${otherXml}
			</w:p>
		`;
	},

	// 解析图片
	parseImageDrawing(data = null) {
		let rId = 'rId100' + data.imgIndex;
		let solidFill = '';
		let bw = 12700;
		// 图片边框
		if (data.imgBorder) {
			bw = data.imgBorder.width;
			let type = data.imgBorder.type || ''; //solidType
			let typeMap = solidType[type];
			let typeXml = '';
			if (typeMap) {
				typeXml = `<a:prstDash val="${typeMap}"/>`;
			}
			solidFill = `
				<a:ln w="${data.imgBorder.width}">
					<a:solidFill>
						<a:schemeClr val="dk2"/>
					</a:solidFill>
					${typeXml}
				</a:ln>
			`;
		}
		// 页面页脚的图片编号
		if (data.imgNum) {
			rId = 'rId' + data.imgNum;
		}
		return `
			<w:drawing>
				<wp:inline distB="0" distL="114300" distR="114300" distT="0">
					<wp:extent cx="${data.imgWidth}" cy="${data.imgHeight}"/>
                    <wp:docPr descr="${data.imgTitle || ''}" id="${data.imgIndex}" name="${data.imgTitle}"/>
                    <wp:cNvGraphicFramePr>
                        <a:graphicFrameLocks noChangeAspect="1" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"/>
                    </wp:cNvGraphicFramePr>
                    <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                        <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                            <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                                <pic:nvPicPr>
                                    <pic:cNvPr descr="${data.imgTitle || ''}" id="${data.imgIndex}" name="${data.imgTitle || ''}"/>
                                    <pic:cNvPicPr>
										<a:picLocks noChangeAspect="1"/>
									</pic:cNvPicPr>
                                </pic:nvPicPr>
                                <pic:blipFill>
                                    <a:blip cstate="print" r:embed="${rId}"/>
                                    <a:stretch>
                                        <a:fillRect/>
                                    </a:stretch>
                                </pic:blipFill>
                                <pic:spPr>
                                    <a:xfrm>
                                        <a:off x="0" y="0"/>
                                        <a:ext cx="${data.imgWidth}" cy="${data.imgHeight}"/>
                                    </a:xfrm>
                                    <a:prstGeom prst="rect">
                                        <a:avLst/>
                                    </a:prstGeom>
                                    ${solidFill}
                                </pic:spPr>
                            </pic:pic>
                        </a:graphicData>
                    </a:graphic>
				</wp:inline>
			</w:drawing>
		`;
	},

	setPageHeaderFooter(data) {
		let pBdr = '', xmlContent = '', tabs = [];
		/* if (_.isEmpty(data)) {
			return ``;
		} */
		// 是否有边框线
		if (data?.border) {
			pBdr = `<w:pBdr><w:${data.border || 'top'} w:color="auto" w:space="0" w:sz="4" w:val="single"/></w:pBdr>`;
		}

		if (data?.xmlList && data.xmlList.length) { // 单栏布局
			const xmlArr = this.parseXmlLists(data.xmlList, false, pBdr);
			/* if (pBdr) {
				if (data.border === 'top') {
					xmlArr.unshift(`<w:p><w:pPr>${pBdr}</w:pPr></w:p>`);
				} else {
					xmlArr.push(`<w:p><w:pPr>${pBdr}</w:pPr></w:p>`);
				}
			} */
			return xmlArr.join('');
		} else { // 分栏布局
			if (data.items) {
				tabs = ['<w:tabs>'];
				let content = [];
				for (let item of data.items) {
					let textContent = [];
					for (const text of item.text) {
						const xml_wr = this.parseWrXml(text);
						textContent.push(commonUtil.trimStr(xml_wr));
					}
					content.push(textContent.join(''));
					tabs.push(`<w:tab w:pos="${item.pos}" w:val="${item.align || 'right'}"/>`);
				}
				tabs.push('</w:tabs>');
				xmlContent = content.join(`<w:r><w:tab/></w:r>`);
			} else { // 空页眉页脚
				xmlContent = `<w:r><w:t/></w:r>`;
				// return '';
			}
		}

		return `
			<w:p>
				<w:pPr>
					<w:bidi w:val="0"/>
					${pBdr}
					${tabs.join('')}
					<w:rPr>
						<w:rFonts w:hint="default"/>
						<w:lang w:val="en-US"/>
					</w:rPr>
				</w:pPr>
				${xmlContent}
			</w:p>
		`
	},

	// 解析段落块
	parseParagrahXml(data = null, isBox = false, pbdr = "") {
		let xmlStr = '';
		if (data) {
			const style = data.style || data.attr.style;
			let wInd = '', numPr = '', outlineLvl = '', bookmarkStart = '', bookmarkEnd = '';

			// 缩进-----------------------------------------------------------------------------------------------------------
			if (style.indent && !style.fixed) {
				wInd = `<w:ind w:firstLine="${style.indent}" w:firstLineChars="0" w:left="${style.left || 0}" w:leftChars="0"/>`;
				if (style.ollist) {
					wInd = `<w:ind w:firstLine="${style.indent}" w:firstLineChars="0" w:left="" w:leftChars="0"/>`;
				}
			}
			// 悬挂
			if (style.left && !style.fixed) {
				if (data.imgIndex) {
					wInd = `<w:ind w:firstLine="0" w:firstLineChars="0" w:left="0" w:leftChars="${style.left}" />`;
				} else {
					wInd = `<w:ind w:firstLine="${style.indent || 0}" w:firstLineChars="0" w:left="${style.left}" w:leftChars="0"/>`;
				}
			}

			// 书签-----------------------------------------------------------------------------------------------------------
			const bookMark = style.bookmark || data.attr && data.attr['data-bookmark'];
			if (bookMark) {
				bookmarkStart = `<w:bookmarkStart w:id="${bookMark}" w:name="_Toc${bookMark}"/>`;
				bookmarkEnd = `<w:bookmarkEnd w:id="${bookMark}" />`;
				let numlvl = style.numlvl ? parseInt(style.numlvl) : 0;
				if (!style.notOutlineLvl) {
					outlineLvl = `<w:outlineLvl w:val="${numlvl}"/>`;
				}
			}

			// 章节编号样式全部在numbering.xml中设定--------------------------------------------------------------------------------------------------------
			if (style.ollist || style.bulletData) {
				numPr = `
	        		<w:numPr>
	                    <w:ilvl w:val="${style.numlvl || 0}"/>
	                    <w:numId w:val="${style.bulletIndex || style.bulletData?.index}"/>
	                </w:numPr>
	        	`;
			}

			// 文本内容XML-----------------------------------------------------------------------------------------------------
			let wrXml = this.parseWrXml(data);

			let hasLineImg = false;
			if (!data.isTitle && data.children && data.children.length) {
				const childrenXml = [];
				data.children.forEach(item => {
					if (item.style && item.style.isImgTitle) {
						data.isImgTitle = "imgTitle";
					}
					// 如果行内元素包含有图片则定义不锁定
					if (item.imgWidth && (style.ollist || style.isAppendix)) {
						hasLineImg = true;
					}

					let itemXml = this.parseWrXml(item);
					if (item.imgWidth && item.mathNum) {
						itemXml = this.parseImageXml(item);
					}
					childrenXml.push(itemXml);
				});
				wrXml = childrenXml.join("\n");
			}
			// var firstLevel = style.ollist && style.firstLevel;
			const firstLevel = style.ollist && style.firstOutline;

			// 文本框
			if (isBox) {
				wInd = '<w:ind w:left="0"/>';
			}
			// 首行缩进
			if (style.left && !style.fixed) {
				wInd = `<w:ind w:firstLine="${style.indent || 0}" w:firstLineChars="0" w:left="${style.left}" w:leftChars="0"/>`;
			}

			let wpXml = this.parseWprXml(data, numPr, wInd, outlineLvl, hasLineImg, firstLevel, pbdr, style.revision);

			// 页面标题|图标题-----------------------------------------------------------------------------------------------------------
			if (data.isTitle) {
				wpXml = this.parseTitleXml(data, false);
				wrXml = this.parseTitleXml(data, true);
			}

			// 汇总XML---------------------------------------------------------------------------------------------------------
			xmlStr = `
				<w:p name="${style.name || '段落分片'}">
					${wpXml}
					${bookmarkStart}
					${wrXml}
	                ${bookmarkEnd}
				</w:p>
			`;
		}
		return xmlStr;
	},
	// 表格框线
	parseTblPr(data) {
		// let color = data.color || 'auto';
		// color = color.replace('#', '');
		const tbStyle = data.style || data.attr.style;
		const color = tbStyle.borderColor || 'auto';
		const val = tbStyle.borderStyle || 'single';
		return `
			<w:tblBorders>
				<w:top w:color="${color}" w:space="0" w:sz="${tbStyle.borderWidth}" w:val="${val}"/>
				<w:left w:color="${color}" w:space="0" w:sz="${tbStyle.borderWidth}" w:val="${val}"/>
				<w:bottom w:color="${color}" w:space="0" w:sz="${tbStyle.borderWidth}" w:val="${val}"/>
				<w:right w:color="${color}" w:space="0" w:sz="${tbStyle.borderWidth}" w:val="${val}"/>
				<w:insideH w:color="${color}" w:space="0" w:sz="${tbStyle.borderInside}" w:val="${val}"/>
				<w:insideV w:color="${color}" w:space="0" w:sz="${tbStyle.borderInside}" w:val="${val}"/>
			</w:tblBorders>
		`;
	},
	// 解析表格附加属性
	parseTableXml(data = null) {
		let xmlStr = [];
		// var tbStyle = data.style || data.attr.style;
		// 表标题和表附加信息----------------------------------------------------------------------------------------------------
		if (data.tableAttr && data.tableAttr.length) {
			data.tableAttr.forEach((item, index) => {
				let numPr = '';
				// 定义表标题书签
				let bookmarkStart = '';
				let bookmarkEnd = '';
				if (item.isTitle && item.style.bookmark) {
					bookmarkStart = `<w:bookmarkStart w:id="${item.style.bookmark}" w:name="_Toc${item.style.bookmark}"/>`;
					bookmarkEnd = `<w:bookmarkEnd w:id="${item.style.bookmark}" />`;
				}

				if (item.bulletData) {
					numPr = `<w:numPr>
								<w:ilvl w:val="${item.bulletData.numlvl}"/>
								<w:numId w:val="${item.bulletData.bulletIndex}"/>
							</w:numPr>`;
				}

				let wpXml = this.parseWprXml(item, numPr);
				let wrXml = []; // this.parseWrXml(item);

				item.children.forEach(o => {
					wrXml.push(this.parseWrXml(o));
				})

				let xml = `
					<w:p>
						${wpXml}
						${bookmarkStart}
						${wrXml.join('')}
						${bookmarkEnd}
					</w:p>
				`;
				xmlStr.push(xml);
			})
		};

		// 表格GIRD-------------------------------------------------------------------------------------------------------------
		let gridXml = '';
		let tableWidth = 0;
		let colSpan = data.tblGrid ? data.tblGrid.length : 1;
		if (data.tblGrid) {
			const gridArr = [];
			for (let i = 0; i < data.tblGrid.length; i++) {
				tableWidth += parseInt(data.tblGrid[i]);
				gridArr.push(`<w:gridCol w:w="${data.tblGrid[i]}"/>`);
			}
			gridXml = `
				<w:tblGrid>
					${gridArr.join("\n")}
				</w:tblGrid>
			`;
		}
		// const tableStyle = data.style;
		// 如果是word自动分页的,定义表头属性
		let tblHeader = '';
		/* 
		if (this.wordBreak && xmlStr.length) {
			tblHeader = `<w:tr>
				<w:tc>
					<w:tcPr>
						<w:tcW w:type="dxa" w:w="8522"/>
						<w:gridSpan w:val="${colSpan}"/>
						<w:tcBorders>
							<w:top w:val="nil"/>
							<w:bottom w:color="auto" w:space="0" w:sz="12" w:val="single"/>
							<w:left w:val="nil"/>
							<w:right w:val="nil"/>
						</w:tcBorders>
					</w:tcPr>
					${xmlStr.join("\n")}
				</w:tc>
			</w:tr>`
			xmlStr = [];
		} */

		// 表格单元行及单元格-----------------------------------------------------------------------------------------------------
		let trXml = this.parseTrsXml(data);
		// 边框线
		let tblBorderXml = this.parseTblPr(data);
		let tableTop = 0;
		let tableRight = data.right || '100';
		let tableBottom = 0;
		let tableLeft = data.left || '100';
		//<w:tblW w:type="dxa" w:w="${tableWidth}"/> <w:tblLayout w:type="fixed"/>
		// 表格宽度为自适应，以免撑开页面
		let tableType = 'auto';
		tableWidth = '0';
		let tableAligin = data.style.align || 'center';
		if (data.style && data.style.width && data.style.width === '100%') {
			tableType = 'pct';
			tableWidth = '5000';
		}
		return `
			${xmlStr.join("\n")}
			<w:tbl>
				<w:tblPr>
					<w:tblStyle w:val="aa"/>
	                <w:tblW w:type="${tableType}" w:w="${tableWidth}"/>
	                <w:tblInd w:type="dxa" w:w="0"/>
					<w:jc w:val="${tableAligin}"/>
	                ${tblBorderXml}
					<w:tblLayout w:type="autofit"/>
					<w:tblCellMar>
						<w:top w:type="dxa" w:w="${tableTop}"/>
						<w:left w:type="dxa" w:w="${tableLeft}"/>
						<w:bottom w:type="dxa" w:w="${tableBottom}"/>
						<w:right w:type="dxa" w:w="${tableRight}"/>
					</w:tblCellMar>
	            </w:tblPr>
	            ${gridXml}
				${tblHeader}
	            ${trXml}
			</w:tbl>
		`;
	},
	/**
	 * @description 解析单元行
	 * @param {*} data 
	 * @returns 
	 */
	parseTrsXml(data) {
		var trXml = [];
		// 边框线
		var tblBorderXml = ''; //this.parseTblPr(data);
		data.trXml.forEach(item => {
			let tblHeader = '';
			if (item.border && item.border.isHeader) {
				tblHeader = '<w:trPr><w:tblHeader/></w:trPr>';
			}
			// 单元行高度
			let trHeight = `<w:trHeight w:hRule="atLeast" w:val="${item.height}"/>`;
			// 修订的删除
			let revisionXml = '';
			if (item.revision) {
				revisionXml = `<w:del w:author="${item.revision?.author}" w:date="${item.revision.date}" w:id="${item.revision.id}"/>`
			}
			// 单元格内容
			let tcXml = this.parseTdsXml(item.tds, item.border);

			let xml = `
				<w:tr>
					${tblHeader}
					<w:tblPrEx>
						${tblBorderXml}
					</w:tblPrEx>
					<w:trPr>
						${trHeight}
						${revisionXml}
					</w:trPr>
					${tcXml}
				</w:tr>
			`;
			trXml.push(xml);
		})
		return trXml.join("\n");
	},

	/**
	 * @description 解析单元格内容
	 * @param {*} tds 
	 * @param {*} borderBold 
	 * @returns 
	 */
	parseTdsXml(tds = [], border = null) {
		const tcXml = [];
		tds.forEach(td => {
			const gridSpan = td.gridSpan ? `<w:gridSpan w:val="${td.gridSpan}"/>` : '';
			const vMerge = td.vMerge ? `<w:vMerge w:val="${td.vMerge}"/>` : '';
			const bgColor = td.bgColor || 'FFFFFF';
			const wpXml = this.parseWprXmlByContainer(td.wrs, td.style.align || 'left', td.revision);
			const vAlign = td.style.vAlign || 'baseline';
			const tcBorders = [];

			// 单元格边框线
			if (td.style.borders) {
				tcBorders.push('<w:tcBorders>');
				td.style.borders.forEach(border => {
					tcBorders.push(`<w:${border.position} w:val="${border.type || 'single'}" w:sz="${border.width || '0.5'}" w:color="${border.color || 'auto'}" w:space="0" />`)
				})
				tcBorders.push('</w:tcBorders>');
			}

			const xml = `
                <w:tc>
                    <w:tcPr>
                        <w:tcW w:type="dxa" w:w="${td.colWidth}"/>
                        ${gridSpan}
                        ${vMerge}
						${tcBorders.join('')}
                        <w:shd w:val="clear" w:color="auto" w:fill="${bgColor}"/>
						<w:tcMar>
							<w:top w:type="dxa" w:w="${td.style.before || 0}"/>
							<w:left w:type="dxa" w:w="${td.style.left || 0}"/>
							<w:bottom w:type="dxa" w:w="${td.style.after || 0}"/>
							<w:right w:type="dxa" w:w="${td.style.right || 0}"/>
						</w:tcMar>
                        <w:vAlign w:val="${vAlign}"/>
                    </w:tcPr>
                    ${wpXml}
                </w:tc>
            `;
			if (!td.hide) {
				tcXml.push(xml);
			}
		});
		return tcXml.join("\n");
	},

	/**
	 * @description 解析单元格组元素
	 * @param {*} arr 
	 * @param {*} align 
	 * @returns 
	 */
	parseWprXmlByContainer(arr = [], align = "left", revision) {
		const wrXmlList = [];
		const parseWr = (wpList = []) => {
			const xmlArr = [];
			const childrenLens = wpList.length;
			wpList.forEach((wp, index) => {
				let style = wp.style || {};
				let wrXml = '', str = (wp.text || '').replace(/[\u200B-\u200D\uFEFF]/g, '');
				if (!style.fontFamily) {
					style.fontFamily = '宋体';
				}
				if (!style.fontSize) {
					style.fontSize = 18;
				}
				let font = `<w:rFonts w:ascii="${style.fontFamily}" w:cs="${style.fontFamily}" w:hAnsi="${style.fontFamily}" w:eastAsia="${style.fontFamily}" w:hint="eastAsia"/>`;
				if (['times new roman', 'webdings', 'wingdings'].includes(style.fontFamily?.toLowerCase())) {
					let whit = ['webdings', 'wingdings'].includes(style.fontFamily?.toLowerCase()) ? 'monospace' : 'default';
					font = `<w:rFonts w:ascii="${style.fontFamily}" w:cs="${style.fontFamily}" w:hAnsi="${style.fontFamily}" w:hint="${whit}"/>`;
				}
				let delXml = '', insertXmlBefore = '', insertXmlAfter = '';
				if (wp.revision) {
					if (wp.revision.type === 'delete') {
						delXml = `<w:del w:author="${wp.revision.author}" w:date="${wp.revision.date}" w:id="${wp.revision.id}"/>`;
					} else if (wp.revision.type === 'insert') {
						insertXmlBefore = `<w:ins w:author="${wp.revision.author}" w:date="${wp.revision.date}" w:id="${wp.revision.id}">`;
						insertXmlAfter = '</w:ins>';
					}
				}

				if (wp.type === 'superscript') { // 表脚注
					wrXml = `
						<w:r>
							<w:rPr>
								${font}
								<w:sz w:val="18"/>
								<w:szCs w:val="18"/>
								<w:lang w:eastAsia="zh-CN" w:val="en-US"/>
								<w:vertAlign w:val="superscript"/>
							</w:rPr>
							<w:t>${str}</w:t>
						</w:r>
					`;
				} else if (wp.type === 'tag') { // 注或注X
					wrXml = `
						${insertXmlBefore}
						<w:r>
							<w:rPr>
								${font}
								<w:sz w:val="${style.fontSize}"/>
								<w:szCs w:val="${style.fontSize}"/>
								<w:vertAlign w:val="baseline"/>
								${delXml}
							</w:rPr>
							<w:t>${str}</w:t>
						</w:r>
						${insertXmlAfter}
					`;
				} else if (wp.type === 'br' && index < childrenLens - 1) { // 换行符：注意防止占位影响单元行高度
					wrXml = `
						<w:r>
							<w:rPr>
								<w:rFonts w:hint="eastAsia"/>
								<w:lang w:eastAsia="zh-CN" w:val="en-US"/>
							</w:rPr>
							<w:br w:type="textWrapping"/>
						</w:r>
					`;
				} else if (wp.type === 'image') { // 图片
					let imgXml = this.parseImageDrawing(wp.imgData);
					wrXml = `
						<w:r>
							<w:rPr>
								<w:rFonts w:eastAsiaTheme="minorEastAsia" w:hint="default"/>
								<w:vertAlign w:val="baseline"/>
								<w:lang w:eastAsia="zh-CN"/>
								<w:position w:val="-18"/>
							</w:rPr>
							${imgXml}
						</w:r>
					`;
				} else { // 一般文本
					let vertAlign = "baseline", wb = '', wUnderline = '', wLineThrough = '';
					if (style.isSup) { // 上标
						vertAlign = "superscript";
					}
					if (style.isSub) { // 下标
						vertAlign = "subscript";
					}
					if (style.isBig) {
						wb = '<w:b/><w:bCs/>';
					}
					// 文字颜色
					let textColor = '';
					if (style.color) {
						textColor = `<w:color w:val="${style.color.replace('#', '')}"/>`
					}
					// 下划线
					if (style.underline)
						wUnderline = '<w:u w:val="single"/>';					// 下划线
					
					if (style.lineThrough)
						wLineThrough = '<w:strike/><w:dstrike w:val="0"/>';		// 删除线

					let startFldChar = '', endFldChar = '';
					if (style.bindBookmark) {
						startFldChar = `
							<w:r><w:fldChar w:fldCharType="begin"/></w:r>
							<w:r><w:instrText xml:space="preserve">HYPERLINK \\l &quot;${style.bindBookmark}&quot; </w:instrText></w:r>
							<w:r><w:fldChar w:fldCharType="separate"/></w:r>
						`;
						if (wp.chapterNumber) {
							startFldChar = `
								<w:r><w:fldChar w:fldCharType="begin"/></w:r>
								<w:r>
									<w:rPr>
										${font}
										${wb}
										${textColor}
										<w:sz w:val="${style.fontSize}"/>
										<w:szCs w:val="${style.fontSize}"/>
										<w:vertAlign w:val="${vertAlign}"/>
									</w:rPr>
									<w:instrText xml:space="preserve">PAGEREF ${style.bindBookmark} \\h </w:instrText>
								</w:r>
								<w:r>
									<w:fldChar w:fldCharType="separate"/>
								</w:r>
							`;
						}
						endFldChar = `
							<w:r><w:fldChar w:fldCharType="end"/></w:r>
							<w:r><w:fldChar w:fldCharType="end"/></w:r>
						`;
					}

					wrXml = `
						${startFldChar}
						${insertXmlBefore}
						<w:r>
							<w:rPr>
								${font}
								${wb}
								${textColor}
								<w:sz w:val="${style.fontSize}"/>
								<w:szCs w:val="${style.fontSize}"/>
								<w:vertAlign w:val="${vertAlign}"/>
								${wUnderline}
								${wLineThrough}
								${delXml}
							</w:rPr>
							<w:t xml:space="preserve">${str || ' '}</w:t>
						</w:r>
						${insertXmlAfter}
						${endFldChar}
					`;
				}
				xmlArr.push(wrXml);
			});
			return xmlArr.join("\n");
		}

		// console.log('arr==>',arr)
		arr.forEach(wp => {
			let style = wp.style || {};
			let line = style.line || '240';
			let wrXml = wp.children ? parseWr(wp.children) : parseWr([wp]);
			let wInd = style.indent ? `<w:ind w:firstLine="${style.indent}" w:firstLineChars="0" w:left="0" w:leftChars="0"/>` : '';
			let numPr = "";
			// wp.type && wp.type === "superscript"
			if (wp.bulletIndex) {
				numPr = `
					<w:numPr>
						<w:ilvl w:val="0"/>
						<w:numId w:val="${wp.bulletIndex}"/>
					</w:numPr>
				`;
				wInd = "";
			}
			let revisionXml = '';
			if (revision) {
				revisionXml = `<w:del w:author="${revision.author}" w:date="${revision.date}" w:id="${revision.id}"/>`;
			}
			let font = `<w:rFonts w:ascii="${style.fontFamily}" w:cs="${style.fontFamily}" w:hAnsi="${style.fontFamily}" w:eastAsia="${style.fontFamily}" w:hint="eastAsia"/>`;
			!style.fontFamily && console.log('style.fontFamily==>', wp)
			if (['times new roman', 'webdings', 'wingdings'].includes(style.fontFamily?.toLowerCase())) {
				let whit = ['webdings', 'wingdings'].includes(style.fontFamily?.toLowerCase()) ? 'monospace' : 'default';
				font = `<w:rFonts w:ascii="${style.fontFamily}" w:cs="${style.fontFamily}" w:hAnsi="${style.fontFamily}" w:hint="${whit}"/>`;
			}
			let wpPr = `
				<w:pPr>
					<w:wordWrap w:val="0"/>
					<w:autoSpaceDE w:val="0"/>
					<w:autoSpaceDN w:val="0"/>
					<w:snapToGrid w:val="0"/>
					<w:widowControl val="0"/>
					<w:spacing w:line="${line}" w:after="${style.after || 0}" w:before="${style.before || 0}" w:lineRule="atLeast" w:val="${this.letterSpacing || 0}"/>
					<w:jc w:val="${style.align || align}"/>
					${wInd}
					${numPr}
					<w:rPr>
						${font}
						<w:vertAlign w:val="baseline"/>
						<w:lang w:eastAsia="zh-CN" w:val="en-US"/>
						${revisionXml}
					</w:rPr>
				</w:pPr>
			`;

			let xml = `
				<w:p>
					${wpPr}
					${wrXml}
				</w:p>
			`;
			wrXmlList.push(xml)
		});

		if (wrXmlList.length) {
			return wrXmlList.join("\n");
		} else {
			return '<w:p/>';
		}
	},

	/**
	 * @description 解析标题结构XML
	 * @param {*} data 
	 * @param {*} setChildren 
	 * @returns 
	 */
	parseTitleXml(data = null, setChildren = false) {
		var style = data.style || data.attr.style;
		if (setChildren) {
			var wrXml = [];
			data.children.forEach((item, i) => {
				let itemStyle = item.style || item.attr.style;
				let fontSize = itemStyle.fontSize;
				if (data.isTitle && data.isTitle === 'ctitle' && !data.tempPath) {
					fontSize = 32;
				}
				// xml:space="preserve"
				let wrapText = item.text.replace(/\s/g, '');
				let font = `<w:rFonts w:ascii="${itemStyle.fontFamily}" w:cs="${itemStyle.fontFamily}" w:hAnsi="${itemStyle.fontFamily}" w:eastAsia="${itemStyle.fontFamily}" w:hint="eastAsia"/>`;
				if (['times new roman', 'webdings', 'wingdings'].includes(itemStyle.fontFamily?.toLowerCase())) {
					let whit = ['webdings', 'wingdings'].includes(itemStyle.fontFamily?.toLowerCase()) ? 'monospace' : 'default';
					font = `<w:rFonts w:ascii="${itemStyle.fontFamily}" w:cs="${itemStyle.fontFamily}" w:hAnsi="${itemStyle.fontFamily}" w:hint="${whit}"/>`;
				}
				let xml = `
					<w:r>
						<w:rPr>
							${font}
							<w:sz w:val="${fontSize}"/>
							<w:szCs w:val="${fontSize}"/>
							<w:lang w:eastAsia="zh-CN" w:val="en-US"/>
						</w:rPr>
						<w:t xml:space="preserve">${item.text}</w:t>
					</w:r>
				`;
				if ((data.isTitle === 'ctitle' || data.isTitle === 'stitle') && wrapText.length === 2) {
					let textArr = [];
					wrapText.split('').forEach(txt => {
						textArr.push(`
							<w:r>
								<w:rPr>
									${font}
									<w:sz w:val="${fontSize}"/>
									<w:szCs w:val="${fontSize}"/>
									<w:lang w:eastAsia="zh-CN" w:val="en-US"/>
								</w:rPr>
								<w:t>${txt}</w:t>
							</w:r>
						`);
					});
					xml = textArr.join(`<w:r><w:rPr><w:rFonts w:ascii="MS Mincho" w:cs="MS Mincho" w:eastAsia="MS Mincho" w:hAnsi="MS Mincho" w:hint="default"/></w:rPr><w:t> </w:t></w:r><w:r><w:rPr><w:rFonts w:ascii="MS Mincho" w:cs="MS Mincho" w:eastAsia="MS Mincho" w:hAnsi="MS Mincho" w:hint="eastAsia"/></w:rPr><w:t> </w:t></w:r>`);
				}
				wrXml.push(xml);
			});
			return wrXml.join('<w:r><w:br w:type="textWrapping"/></w:r>');
		} else {
			let pStyle = '';
			let wrFonts = `<w:rFonts w:ascii="${style.fontFamily}" w:cs="${style.fontFamily}" w:hAnsi="${style.fontFamily}" w:eastAsia="${style.fontFamily}" w:hint="eastAsia"/>`;
			if (['times new roman', 'webdings', 'wingdings'].includes(style.fontFamily?.toLowerCase())) {
				let whit = ['webdings', 'wingdings'].includes(style.fontFamily?.toLowerCase()) ? 'monospace' : 'default';
				wrFonts = `<w:rFonts w:ascii="${style.fontFamily}" w:cs="${style.fontFamily}" w:hAnsi="${style.fontFamily}" w:hint="${whit}"/>`;
			}
			let wsz = `<w:sz w:val="${style.fontSize}"/>`;
			let wszCs = `<w:szCs w:val="${style.fontSize}"/>`;

			let spacing = '';
			// 页面标题
			if (data.isTitle) {
				let titleStyle = data.isTitle;
				if (!style.bookmark && titleStyle === 'ctitle') {
					titleStyle = 'ptitle';
				}
				pStyle = `<w:pStyle w:val="${titleStyle}"/>`;
				if (data.isTitle === 'atitle') {
					pStyle += `<w:outlineLvl w:val="${style.numlvl || 0}"/>`;
				}
				wrFonts = '';
				wsz = '';
				wszCs = '';
				spacing = '';
			}
			// <w:snapToGrid w:val="0" />
			return `
				<w:pPr name="标题属性">
					${pStyle}
					${spacing}
					<w:widowControl val="0"/>
					<w:rPr>
						${wrFonts}
						${wsz}
						${wszCs}
						<w:lang w:eastAsia="zh-CN" w:val="en-US"/>
					</w:rPr>
				</w:pPr>		
			`;
		}
	},

	// 段落属性
	parseWprXml(data = null, numPr = '', wInd = '', outlineLvl = '', hasLineImg = false, firstLevel = false, pbdr = "", revisionData) {
		const style = data?.style || data.attr?.style || {};
		let align = style.align === 'justify' ? 'left' : style.align;

		let notSnapGrid = '<w:snapToGrid w:val="0"/>'; // <w:snapToGrid />

		/* if (hasLineImg || style.bookmark || style.notSnapGrid) { //  || data.isBullet
			notSnapGrid = '<w:snapToGrid w:val="0"/>';
		} */
		let spacing = `<w:spacing w:line="${style.line}" w:lineRule="auto" w:val="${this.letterSpacing || 0}"/>`;
		if (style.before || style.after) {
			spacing = `<w:spacing w:line="${style.line}" w:after="${style.after || 0}" w:before="${style.before || 0}" w:val="${this.letterSpacing || 0}"/>`;
			// notSnapGrid = '<w:snapToGrid w:val="0"/>';
		}

		/* let isImage = hasLineImg;
		if (data.imgHeight || (data.children && data.children[0] && data.children[0]['imgWidth'])) {
			isImage = true;
			spacing = `<w:spacing w:line="240" w:lineRule="auto" w:val="${this.letterSpacing||0}"/>`;
			wInd = '<w:ind w:firstLine="0" w:firstLineChars="0" w:leftChars="0" w:left="703"/>';
		} */

		/* if (isImage) {
			notSnapGrid = '<w:snapToGrid w:val="0"/>';
		} */
		// 文档样式绑定
		/* let pStyle = '';

		if (data.isPragraph && !isImage) { // 段落非图片元素
			// 段落
			pStyle = (align === 'center' || !style.indent) ? '' : '<w:pStyle w:val="par"/>';
			if (data.isImgTitle) {
				pStyle = `<w:pStyle w:val="imgTitle"/>`;
			} else if (style.isTableTitle) {
				pStyle = `<w:pStyle w:val="ttitle"/>`;
			} else if(style.header) { // H类型标题
				pStyle = `<w:pStyle w:val="${style.header.replace('H','')}"/>`;
			}
			if (!style.after && !style.before) {
				spacing = '';
			}
		} else if (data.isBullet) { // 列项
			notSnapGrid = '<w:snapToGrid w:val="0"/>';
			// 特殊破折号
			if (style.dashLine) {
				wInd = '<w:ind w:firstLine="420" w:firstLineChars="200" w:left="0" w:leftChars="0"/>';
			}
		} else if (data.isTitle) { // 标题
			// 标题
			pStyle = `<w:pStyle w:val="${data.isTitle}"/>`;
			spacing = '';
			align = 'center';
			wInd = '';
		} else if (data.imgfooter) {
			pStyle = `<w:pStyle w:val="imgFooter"/>`;
			spacing = '';
			wInd = '';
		} */
		// 索引项等
		let tabs = '';
		if (style.isDot) {
			tabs = '<w:tabs><w:tab w:leader="dot" w:pos="9241" w:val="right"/></w:tabs>';
		} else if (style.ollist && !style.left && style.indent) {
			tabs = `<w:tabs><w:tab w:pos="${style.indent}" w:val="left"/></w:tabs>`;
		}

		// 修订
		let revisionXml = '';
		if (revisionData && revisionData.type === 'update') {
			revisionXml = `<w:pPrChange w:author="${revisionData.author}" w:date="${revisionData.date}" w:id="${revisionData.id}">` + numPr + '</w:pPrChange>';
		}

		return `
			<w:pPr>
				${pbdr}
				<w:wordWrap w:val="0"/>
				<w:autoSpaceDE w:val="0"/>
				<w:autoSpaceDN w:val="0"/>
				<w:widowControl val="0"/>
				${numPr}
				<w:jc w:val="${align || 'left'}"/>
				${spacing}
				${notSnapGrid}
				${wInd}
				${outlineLvl}
				${tabs}
				${revisionXml}
			</w:pPr>
		`;
	},
	// 文本内容
	parseWrXml(data = null, hasTab = false) {
		const style = data?.style || data.attr?.style || {};
		let wText = data.text;
		let wTab = hasTab ? '<w:tab/>' : '';
		let footnoteReference = '';															// 脚注
		let wi = style.isItalic ? '<w:i/><w:iCs/>' : '';									// 斜体
		let wb = style.isBig ? '<w:b/><w:bCs/>' : '';										// 粗体
		let wSup = style.isSup ? '<w:vertAlign w:val="superscript"/>' : '';					// 上标
		let wSub = style.isSub ? '<w:vertAlign w:val="subscript"/>' : '';					// 下标
		let wUnderline = style.underline ? '<w:u w:val="single"/>' : '<w:u w:val="none"/>';					// 下划线
		let wLineThrough = style.lineThrough ? '<w:strike/><w:dstrike w:val="0"/>' : '';	// 删除线
		let wh = style.bgColor ? `<w:shd w:val="clear" w:fill="${style.bgColor.replace('#', '')}"/>` : '';			// 背景高亮色
		let wc = style.color ? `<w:color w:val="${style.color.replace('#', '')}"/>` : '';					// 文字颜色
		let ww = style.ww ? `<w:w w:val="${style.ww}"/>` : '';								// 文字间距

		// 换行
		if (data.tagName && data.tagName === 'BR') {
			return `
				<w:r>
					<w:rPr>
						<w:rFonts w:hint="eastAsia"/>
						<w:lang w:eastAsia="zh-CN" w:val="en-US"/>
					</w:rPr>
					<w:br w:type="textWrapping"/>
				</w:r>
			`;
		}
		const revisionData = data.revision || style.revision;
		// 修订
		if (revisionData) {
			
			let font = `<w:rFonts w:ascii="${style.fontFamily}" w:cs="${style.fontFamily}" w:hAnsi="${style.fontFamily}" w:eastAsia="${style.fontFamily}" w:hint="eastAsia"/>`;
			if (['times new roman', 'webdings', 'wingdings', 'wingdings'].includes(style.fontFamily?.toLowerCase())) {
				let whit = ['webdings', 'wingdings'].includes(style.fontFamily?.toLowerCase()) ? 'monospace' : 'default';
				font = `<w:rFonts w:ascii="${style.fontFamily}" w:cs="${style.fontFamily}" w:hAnsi="${style.fontFamily}" w:hint="${whit}"/>`;
			}
			if (revisionData.type === 'delete') {
				let textContent = `<w:delText>${data.text}</w:delText>`
				if (data.fileName) {
					textContent = this.parseImageDrawing(data);
				}
				return `
					<w:del w:author="${revisionData.author}" w16du:dateUtc="${revisionData.date}" w:date="${revisionData.date}" w:id="${revisionData.id}">
						<w:r>
							<w:rPr>
								${font}
								<w:lang w:eastAsia="zh-CN" w:val="en-US"/>
								<w:sz w:val="${style.fontSize}"/>
                    			<w:szCs w:val="${style.fontSize}"/>
								${wc}
								${wi}
								${wb}
							</w:rPr>
							${textContent}
						</w:r>
					</w:del>
				`;
			} else if (revisionData.type === 'insert') {
				return `
					<w:ins w:author="${revisionData.author}" w16du:dateUtc="${revisionData.date}" w:date="${revisionData.date}" w:id="${revisionData.id}">
						<w:r>
							<w:rPr>
								${font}
								<w:lang w:eastAsia="zh-CN" w:val="en-US"/>
								<w:sz w:val="${style.fontSize}"/>
                    			<w:szCs w:val="${style.fontSize}"/>
								${wc}
								${wi}
								${wb}
							</w:rPr>
							<w:t>${data.text}</w:t>
						</w:r>
					</w:ins>
				`;
			} else if (revisionData.type === 'update') {
				return `
					<w:r>
						<w:rPr>
							${font}
							<w:lang w:eastAsia="zh-CN" w:val="en-US"/>
							<w:sz w:val="${style.fontSize}"/>
							<w:szCs w:val="${style.fontSize}"/>
							${wc}
							${wi}
							${wb}
							<w:rPrChange w:author="${revisionData.author}" w16du:dateUtc="${revisionData.date}" w:date="${revisionData.date}" w:id="${revisionData.id}">
								<w:rPr>
									<w:rFonts w:hint="eastAsia"/>
									<w:lang w:eastAsia="zh-CN" w:val="en-US"/>
								</w:rPr>
							</w:rPrChange>
						</w:rPr>
						<w:t>${data.text}</w:t>
					</w:r>
				`;
			}
		}

		// 行内图片
		if (data.imgWidth || data.isImage) {
			const drawingXml = this.parseImageDrawing(data);
			return `
				<w:r>
					<w:rPr>
						<w:rFonts w:hint="eastAsia"/>
						<w:lang w:eastAsia="zh-CN" w:val="en-US"/>
					</w:rPr>
					${drawingXml}
				</w:r>
			`;
		}

		// 图标题
		/* if (style.isImgTitle) {
			wText = `图 ${style.num}  ` + wText;
		} */

		// 文本设置了脚注 对应脚注footernote文档中ID
		if (style.noteIndex !== undefined) {
			footnoteReference = `
				<w:r tag="条文脚注">
					<w:rPr>
						<w:rStyle w:val="ac"/>
						<w:rFonts w:cs="宋体" w:ascii="宋体" w:hAnsi="宋体" w:eastAsia="宋体" w:hAnsi="宋体"/>
						${wi}
						${wb}
						${wh}
						${wc}
						<w:lang w:eastAsia="zh-CN" w:val="en-US"/>
					</w:rPr>
					<w:footnoteReference w:id="${style.noteIndex}"/>
				</w:r>
				<w:r>
					<w:rPr>
						<w:rStyle w:val="ac"/>
					</w:rPr>
					<w:t>)</w:t>
				</w:r>
			`;
		}

		// 批注
		let commentRangeStart = [], commentRangeEnd = [], tableXu = '';
		if (data.annotation) {
			for (let i = data.annotation.startIndex; i <= data.annotation.endIndex; i++) {
				commentRangeStart.push(`<w:commentRangeStart w:id="${i}"/>`);
				commentRangeEnd.push(`<w:commentRangeEnd w:id="${i}"/><w:r><w:commentReference w:id="${i}"/></w:r>`);
			}
		}

		// 表续
		if (data.isTitle && data.isTitle === 'tableTitle' && data.text.match(/\（续）/ig) !== null) {
			tableXu = `<w:r>
				<w:rPr>
					<w:rFonts w:ascii="宋体" w:cs="宋体" w:eastAsia="宋体" w:hAnsi="宋体" w:hint="eastAsia"/>
					<w:sz w:val="21"/>
					<w:szCs w:val="21"/>
				</w:rPr>
				<w:t>（续）</w:t>
			</w:r>`;
			wText = wText.replace(/\（续）/g, '');
		}

		// 输出
		if (!style.fontFamily || style.fontFamily.includes('simsun')) {
			style.fontFamily = '宋体';
		}
		if (!style.fontSize) {
			style.fontSize = 18;
		}
		// 索引项的点点点
		if (style.isDot) {
			wTab = '<w:tab/>';
		}

		// 边框线
		let wdbr = '';
		if (style.borders) {
			wdbr = `<w:bdr w:val="${style.borders[0]['type']}" w:space="0" w:sz="${style.borders[0]['width']}" w:color="${style.borders[0]['color'].replace('#', '')}"/>`;
		}

		// 绑定到书签
		let wmarkStart = '', wmarkEnd = '';
		if (style.bindBookmark) {
			wmarkStart = this.setBookMark(style.bindBookmark);
			wmarkEnd = `<w:r><w:fldChar w:fldCharType="end"/></w:r>`;
		}

		// 处理页码
		let wFldCharStart = '', wFldCharEnd = '', wFldCharPrefix = '', wFldCharSufffix = '';
		let font = `<w:rFonts w:ascii="${style.fontFamily}" w:cs="${style.fontFamily}" w:hAnsi="${style.fontFamily}" w:eastAsia="${style.fontFamily}" w:hint="eastAsia"/>`;
		if (['times new roman', 'webdings', 'wingdings'].includes(style.fontFamily?.toLowerCase())) {
			let whit = ['webdings', 'wingdings'].includes(style.fontFamily?.toLowerCase()) ? 'monospace' : 'default';
			font = `<w:rFonts w:ascii="${style.fontFamily}" w:cs="${style.fontFamily}" w:hAnsi="${style.fontFamily}" w:hint="${whit}"/>`;
		}
		if (style.isPageNumber) {
			if (style.numPrevfix) {
				wFldCharPrefix = `
					<w:r>
						<w:rPr>
							${font}
							<w:u w:val="none"/>
							<w:sz w:val="${style.fontSize}"/>
							<w:szCs w:val="${style.fontSize}"/>
							<w:spacing w:val="0"/>
						</w:rPr>
						<w:t xml:space="preserve">${style.numPrevfix}</w:t>
					</w:r>
				`;
			}
			if (style.numSuffix) {
				wFldCharSufffix = `
					<w:r>
						<w:rPr>
							${font}
							<w:u w:val="none"/>
							<w:sz w:val="${style.fontSize}"/>
							<w:szCs w:val="${style.fontSize}"/>
							<w:spacing w:val="0"/>
						</w:rPr>
						<w:t xml:space="preserve">${style.numSuffix}</w:t>
					</w:r>
				`;
			}
			wFldCharStart = `
				<w:r>
					<w:rPr>
						${font}
						<w:u w:val="none"/>
						<w:sz w:val="${style.fontSize}"/>
						<w:szCs w:val="${style.fontSize}"/>
						<w:spacing w:val="0"/>
					</w:rPr>
					<w:fldChar w:fldCharType="begin"/>
				</w:r>
				<w:r>
					<w:rPr>
						${font}
						<w:u w:val="none"/>
						<w:sz w:val="${style.fontSize}"/>
						<w:szCs w:val="${style.fontSize}"/>
						<w:spacing w:val="0"/>
					</w:rPr>
					<w:instrText xml:space="preserve">PAGE  \\* MERGEFORMAT </w:instrText>
				</w:r>
				<w:r>
					<w:rPr>
						${font}
						<w:u w:val="none"/>
						<w:sz w:val="${style.fontSize}"/>
						<w:szCs w:val="${style.fontSize}"/>
						<w:spacing w:val="0"/>
					</w:rPr>
					<w:fldChar w:fldCharType="separate"/>
				</w:r>
				`;
			wFldCharEnd = `
				<w:r>
					<w:rPr>
						${font}
						<w:u w:val="none"/>
						<w:sz w:val="${style.fontSize}"/>
						<w:szCs w:val="${style.fontSize}"/>
						<w:spacing w:val="0"/>
					</w:rPr>
					<w:fldChar w:fldCharType="end"/>
				</w:r>
			`;
		}

		const textXml = `
			${commentRangeStart.join("\n")}
			${wFldCharPrefix}
			${wmarkStart}
			${wFldCharStart}
			<w:r>
                <w:rPr>
                    ${font}
                    ${wi}
					${wb}
					${wh}
					${wc}
					${ww}
					${wSup}
					${wSub}
					${wUnderline}
					${wLineThrough}
					${wdbr}
					<w:sz w:val="${style.fontSize}"/>
                    <w:szCs w:val="${style.fontSize}"/>
					<w:spacing w:val="${this.letterSpacing}"/>
                </w:rPr>
                ${wTab}
                <w:t xml:space="preserve">${wText || ''}</w:t>
            </w:r>
			${wFldCharEnd}
			${wFldCharSufffix}
			${wmarkEnd}
			${tableXu}
			${commentRangeEnd.join("\n")}
			${footnoteReference}
		`;
		return textXml;
	},

	setBookMark(id) {
		return `
			<w:r>
				<w:fldChar w:fldCharType="begin"/>
			</w:r>
			<w:r>
				<w:instrText xml:space="preserve">HYPERLINK \\l &quot;${id}&quot; </w:instrText>
			</w:r>
			<w:r>
				<w:fldChar w:fldCharType="separate"/>
			</w:r>
		`
	},

	/**
	 * @description 页面分节及页眉页脚处理
	 * @param {*} data  页面数据
	 * @param {*} index 
	 * @param {*} isLast 
	 * @param {*} hasHeaderFooter 
	 * @returns 
	 */
	parsePageBreak(data = null, index = 0, isLast = false, hasHeaderFooter = false, pageNumText) {
		const reference = [];
		if (hasHeaderFooter) {
			let wType = data.referenceType || "default";
			if (data.hasHeader) {
				reference.push(`<w:headerReference r:id="header${data.pageIndex}" w:type="${wType}"/>`);
			}
			if (data.hasFooter) {
				reference.push(`<w:footerReference r:id="footer${data.pageIndex}" w:type="${wType}"/>`);
			}
			// 首页不同
			if (wType === 'first') {
				if (data.hasHeader) {
					reference.push(`<w:headerReference r:id="header${data.pageIndex}" w:type="default"/>`);
					reference.push(`<w:headerReference r:id="header${data.pageIndex}" w:type="even"/>`);
				}
				if (data.hasFooter) {
					reference.push(`<w:footerReference r:id="footer${data.pageIndex}" w:type="default"/>`);
					reference.push(`<w:footerReference r:id="footer${data.pageIndex}" w:type="even"/>`);
				}
			}
		}
		let typeXml = '';
		if (data.pgNumType) { // 若是封底则不需要页码
			let pgNumStart = data.pgNumStart ? `w:start="${data.pgNumStart}"` : ''; // w:start="1"
			typeXml = `<w:pgNumType w:fmt="${data.pgNumType}" ${pgNumStart}/>`;
		}

		const wsectPr = `
            <w:sectPr page-title="页面${data.pageIndex}">
                ${reference.join('\n')}
                <w:pgSz w:h="${data.pageHeight}" w:w="${data.pageWidth}"/>
                <w:pgMar w:bottom="${data.pageBottom}" w:footer="${data.pageFooter || 680}" w:gutter="0" w:header="${data.pageHeader || 850}" w:left="${data.pageLeft}" w:right="${data.pageRight}" w:top="${data.pageTop}"/>
				${typeXml}
				<w:cols w:num="1" w:space="720"/>
                <w:docGrid w:charSpace="0" w:linePitch="0"/>
            </w:sectPr>
        `;

		if (!isLast) {
			return `
                <w:p>
                    <w:pPr>
                        <w:rPr>
                            <w:rFonts w:hint="eastAsia"/>
                            <w:lang w:eastAsia="zh-CN" w:val="en-US"/>
                        </w:rPr>
                        ${wsectPr}
                    </w:pPr>
                </w:p>
            `;
		} else {
			return wsectPr;
		}
	},

	// 编号样式处理
	parseNumber(data = {}) {
		let symbolData = {}, wLvl = '';
		let levelXml = [];
		if (data.isLevel) {
			// 层级项
			symbolData = bulletMap['level'];
			if (data.normal) {
				symbolData.fontFamily = 'Times New Roman';
			}
			if (data.name) {
				symbolData.name = data.name;
			}

			for (let i = 0; i < data.numList.length; i++) {
				const item = data.numList[i];
				let lvlText = [];



				if (item.prevfix && !data.appendix) {
					lvlText.push(item.prevfix);
				}
				if (data.type === 'chapter') {
					lvlText.push('%' + (i + 1));
				} else if (item.text) {
					let strList = item.text.split('.');
					for (let j = 0; j < strList.length; j++) {
						lvlText.push('%' + (j + 1));
					}
				}
				if (data.id) { // 附录字母
					symbolData = bulletMap[data.id];
					symbolData.name = data.name;
					// if (item.titlePrevfix)
					// 	lvlText.unshift(item.titlePrevfix);
					lvlText.push('%1');
				}

				lvlText = data.isNumbers ? lvlText.join('.') : lvlText.join('');

				// 如附录章节的
				if (data.appendix && item.type && !data.id) {
					lvlText = item.type + (item.prevfix || '.') + lvlText;
				}
				if (item.titlePrevfix) {
					lvlText = item.titlePrevfix + lvlText;
				}

				if (item.suffix) {
					lvlText += item.suffix;
				}

				const levelData = _.cloneDeep(symbolData);
				if (item.fontFamily) {
					levelData.fontFamily = item.fontFamily;
				}
				if (item.fontSize) {
					levelData.fontSize = item.fontSize;
				}
				// 编号格式
				if (data.format) {
					levelData.format = data.format;
				}

				const numberData = item || {};
				// 默认编号起始值
				if (data.start && i === 0) {
					numberData.start = data.start;
				}

				if (item.restart) {
					numberData.restart = item.restart;
				}

				let xml = this.setNumXml(levelData, lvlText, numberData, i, data.normal);
				levelXml.push(xml);
			}
			wLvl = levelXml.join("\n");
		} else {
			// 列项|表脚注|注|注X|示例|示例X|脚注|图标题|表标题
			symbolData = bulletMap[data.id];
			let lvlText = symbolData.str + (data.suffix || '');
			if (data.prevfix) {
				lvlText = data.prevfix + lvlText;
			}
			wLvl = this.setNumXml(symbolData, lvlText, data);
		}
		let overrides = [];
		if (data.overrides) {
			for (const ov of data.overrides) {
				overrides.push(`<w:lvlOverride w:ilvl="${ov.ilvl}"><w:startOverride w:val="${ov.start}"/></w:lvlOverride>`);
			}
		}

		const wNum = `
            <w:num w:numId="${data.index}" title="${symbolData.name}">
                <w:abstractNumId w:val="${data.index}"/>
				${overrides.join("\n")}
            </w:num>
        `;

		const abstractNumXml = `
            <w:abstractNum name="${symbolData.name}" w:abstractNumId="${data.index}">
                <w:multiLevelType w:val="${symbolData.type}"/>
                ${wLvl}
            </w:abstractNum>
        `;

		return {
			abstractNumXml,
			wNum
		}
	},

	/**
	 * @description 解析编号结构体 
	 * @param {*} symbolData 
	 * @param {*} lvlText 
	 * @param {*} bulletData 
	 * @param {*} index 
	 * @returns 
	 */
	setNumXml(symbolData = {}, lvlText = '', bulletData = null, index = 0, isNormal = false) {
		let fontFamily = bulletData.fontFamily || symbolData.fontFamily || '宋体';
		let fontSize = bulletData.fontSize || symbolData.fontSize || 21;

		let tabXml = '', suffXml = '', superscript = '', wind = '', spacing = '', position = '', wb = '';
		// let left = bulletData ? bulletData.left || 840 : 840;
		let start = bulletData ? bulletData.start || 1 : 1;
		let pStyle = '';

		// 处理编号符号与文本关系
		if (bulletData.left) {
			wind = `<w:ind w:firstLine="${bulletData.left}" w:firstLineChars="0" w:left="0" w:leftChars="0" />`;
		}
		/* if (bulletData.fixed) { // 固定编号符号宽度，正文悬挂
			wind = `<w:ind w:firstLine="0" w:firstLineChars="0" w:left="${bulletData.left + bulletData.right}" w:hanging="${bulletData.right || 0}" w:leftChars="0"/>`;
		} else {
			if (bulletData.right) {
				spacing = `<w:spacing w:val="${bulletData.right}"/>`;
			}
		} */

		/* if (!bulletData.right && !bulletData.left) {
			wind = '';
			spacing = '';
			suffXml = '<w:suff w:val="space"/>';
		}
		
		if (bulletData.suff) {
			suffXml = '<w:suff w:val="space"/>';
		} */

		if (['circle', 'hollow-circle', 'line', 'diamond', 'hollow-diamond', 'square', 'hollow-square'].includes(bulletData.id)) {
			// fontFamily = symbolData.fontFamily || '宋体';
			// fontSize = Math.floor(fontSize * 0.8);
		}

		if (bulletData) {
			let wTab = '';
			if (bulletData.fixed) { // 固定宽度，文本内容左侧对齐
				if (bulletData.width) {
					// wTab = `<w:tabs><w:tab w:val="left" w:pos="${bulletData.indent + bulletData.width}"/></w:tabs>`;
					wind = `<w:ind w:hanging="${bulletData.width}" w:hangingChars="0" w:left="${bulletData.width + bulletData.indent}" w:leftChars="0" />`;
				} else {
					suffXml = '<w:suff w:val="nothing"/>'; // 编号符号与正文为无间距
				}
				// 首行缩进
				/* if (bulletData.indent) {
					wind = `<w:ind w:hangingChars="${Math.floor(bulletData.width / 2)}" w:leftChars="${Math.floor(bulletData.indent / 2)}"  w:hanging="${bulletData.width}" w:left="${bulletData.indent + bulletData.width}"/>`;
				} else {
					wind = `<w:ind w:hangingChars="${Math.floor(bulletData.width / 2)}" w:hanging="${bulletData.width}" w:left="0"/>`;
				} */
			} else { // 非固定宽度，文本换行后左侧溢出
				// 编号符号与正文的间距，使用制表位处理
				if (bulletData.marginRight) {
					wTab = `<w:tabs><w:tab w:val="left" w:pos="${bulletData.marginRight}"/></w:tabs>`;
				} else {
					suffXml = '<w:suff w:val="nothing"/>'; // 编号符号与正文为无间距
				}
				// 首行缩进
				if (bulletData.indent) {
					wind = `<w:ind w:firstLine="${bulletData.indent}" />`;
				}
			}
			// 居中
			if (bulletData?.align === 'center') {
				suffXml = '<w:suff w:val="space"/>';
			}

			// 粗体
			if (bulletData.bold) {
				wb = '<w:b/><w:bCs/>';
			}

			// 脚注固定格式
			if (bulletData.id && bulletData.id === 'footnote') {
				suffXml = "";
				wTab = `<w:tabs><w:tab w:val="left" w:pos="420"/></w:tabs>`;
				wind = `<w:ind w:hangingChars="200" w:hanging="360" w:leftChars="200" w:left="780"/>`;
			}
			// 表脚注固定格式
			if (bulletData.tfooter) {
				suffXml = "";
				wTab = `<w:tabs><w:tab w:val="left" w:pos="420"/></w:tabs>`;
				wind = `<w:ind w:firstLineChars="0" w:hanging="270" w:left="690" w:leftChars="0"/>`;
			}
			// 示例固定格式
			if ((bulletData.example || bulletData.examplex) && bulletData.fixed) {
				suffXml = ' <w:suff w:val=""/>'; // <w:suff w:val="nothing"/>
				wTab = '';
				wind = `<w:ind w:hanging="${bulletData.width}" w:leftChars="${bulletData.indent / 2}"/>`;
			}

			tabXml = `
    			<w:pPr>
					<w:wordWrap w:val="0"/>
					<w:autoSpaceDE w:val="0"/>
					<w:autoSpaceDN w:val="0"/>
					<w:widowControl val="0"/>
					${wTab}
					${wind}
                </w:pPr>
    		`;
		} else {
			suffXml = '<w:suff w:val="space"/>';
		}

		let snapToGrid = isNormal ? 1 : 0;
		let restart = '';
		if (bulletData.restart) {
			restart = `<w:restart w:val="${bulletData.restart}"/>`;
		}

		let font = `<w:rFonts w:ascii="${fontFamily}" w:cs="${fontFamily}" w:hAnsi="${fontFamily}" w:eastAsia="${fontFamily}" w:hint="eastAsia"/>`;
		if (['times new roman', 'webdings', 'wingdings'].includes(fontFamily?.toLowerCase())) {
			let whit = ['webdings', 'wingdings'].includes(fontFamily?.toLowerCase()) ? 'monospace' : 'default';
			font = `<w:rFonts w:ascii="${fontFamily}" w:cs="${fontFamily}" w:hAnsi="${fontFamily}" w:hint="${whit}"/>`;
		}
		const NumXml = `
            <w:lvl w:ilvl="${index}" w:tentative="0">
                <w:start w:val="${start}"/>
                <w:numFmt w:val="${symbolData.format}"/>
                <w:lvlText w:val="${lvlText}"/>
                <w:lvlJc w:val="left"/>
				${restart}
				${pStyle}
                ${suffXml}
                ${tabXml}
                <w:rPr>
                    ${font}
                    <w:sz w:val="${fontSize}"/>
					<w:szCs w:val="${fontSize}"/>
					<w:snapToGrid w:val="${snapToGrid}"/>
					${spacing}
					${wb}
					${position}
					${superscript}
                </w:rPr>
            </w:lvl>
        `;
		return NumXml;
	},
	// 解析批注
	parseAnnotation(itemData = {}) {
		var commentsArr = [], commentsExtended = [], people = [];
		var index = itemData.startIndex;
		itemData.data.forEach(item => {
			let xml = `
				<w:comment w:author="${item.author}" w:date="${item.date}" w:id="${index}" w:initials="s">
					<w:p w14:paraId="${item.id}">
						<w:pPr>
							<w:widowControl val="0"/>
						</w:pPr>
						<w:r>
							<w:rPr>
								<w:rFonts w:hint="default"/>
							</w:rPr>
							<w:t>${item.text}</w:t>
						</w:r>
					</w:p>
				</w:comment>
			`;
			commentsArr.push(xml);
			let done = item.solve ? 1 : 0;
			let extendXml = !item.pid ? `<w15:commentEx w15:done="${done}" w15:paraId="${item.id}"/>` : `<w15:commentEx w15:done="0" w15:paraId="${item.id}" w15:paraIdParent="${item.pid}"/>`;
			commentsExtended.push(extendXml);
			people.push(item.author);
			index++;
		});
		return {
			commentsArr,
			commentsExtended,
			people
		}
	},

	// 解析脚注样式的XML
	parseFooterNote(arr = []) {
		var noteHeader = [], notes = [], pro = [], noteIndex = 0;
		arr.forEach((note) => {
			note.forEach((item) => {
				let noteId = 300 + noteIndex; // 序号以300开始累加
				let type = noteIndex === 0 ? 'separator' : 'continuationSeparator';
				let wp = noteIndex === 0 ? '<w:p><w:r><w:separator/></w:r></w:p>' : '<w:p><w:r><w:continuationSeparator/></w:r></w:p>';
				noteHeader.push(`
					<w:footnote w:id="${noteId}" w:type="${type}">
						${wp}
					</w:footnote>
				`)
				const fontFamily = item.fontFamily || 'simHei';
				const fontSize = item.fontSize || 21;
				
				let font = `<w:rFonts w:ascii="${fontFamily}" w:cs="${fontFamily}" w:hAnsi="${fontFamily}" w:eastAsia="${fontFamily}" w:hint="eastAsia"/>`;
				if (['times new roman', 'webdings', 'wingdings'].includes(fontFamily?.toLowerCase())) {
					let whit = ['webdings', 'wingdings'].includes(fontFamily?.toLowerCase()) ? 'monospace' : 'default';
					font = `<w:rFonts w:ascii="${fontFamily}" w:cs="${fontFamily}" w:hAnsi="${fontFamily}" w:hint="${whit}"/>`;
				}
				let xml = `
					<w:footnote w:id="${item.index}">
						<w:p>
							<w:pPr>
								<w:pStyle w:val="a8"/>
								<w:snapToGrid w:val="0"/>
								<w:widowControl val="0"/>
								<w:rPr>
									<w:rFonts w:ascii="'webdings','wingdings'" w:cs="'webdings','wingdings'" w:hAnsi="'webdings','wingdings'" w:hint="default"/>
									<w:lang w:eastAsia="zh-CN" w:val="en-US"/>
									<w:sz w:val="${fontSize}"/>
									<w:szCs w:val="${fontSize}"/>
								</w:rPr>
							</w:pPr>
							<w:r>
								<w:rPr>
									${font}
									<w:lang w:eastAsia="zh-CN" w:val="en-US"/>
									<w:sz w:val="${fontSize}"/>
									<w:szCs w:val="${fontSize}"/>
								</w:rPr>
								<w:t>${item.text}</w:t>
							</w:r>
						</w:p>
					</w:footnote>
				`;
				notes.push(xml);
				pro.push(`<w:footnote w:id="${noteId}"/>`);
				noteIndex++;
			});
		});
		return {
			noteHeader,
			notes,
			pro
		}
	}
}
