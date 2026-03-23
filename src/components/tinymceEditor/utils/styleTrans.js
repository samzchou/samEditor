/**
 * 样式转换
 */

const bulletMap = {
    'circle': {name:'实心圆圈','str':'●', symbol:''},                       // 实心圆圈
    'hollow-circle': {name:'空心圆圈','str':'○', symbol:'○'},                // 空心圆圈
    'square': {name:'实心方块','str':'■', symbol:''},                       // 实心方块
    'hollow-square': {name:'空心方块','str':'□', symbol:'□'},                // 空心方块
    'num': {name:'数字'},                                                     // 数字
    'lower': {name:'英文字母'},                                             // 英文字母
    'line': {name:'破折号','str':'——', symbol:'——'},                              // 破折号
}

export default {
    getFontFamily(val) {
        val = val.toLowerCase();
        const maps = {
            'simhei' : '黑体',
            'simsun' : '宋体'
        }
        if(val.includes('times')) {
            return 'Times New Roman';
        }
        return maps[val] || val || '宋体';
    },
    /* getBulletStyle(key='circle') {
        return bulletMap[key];
    }, */
    getBUlletNameByClass(clsName="circle") {
        return bulletMap[clsName];
    },
    /**
     * 处理层级
     * 1/1.1/1.1.1
     */
    setLevelNum(arr=[], numId=0) {
        let wNum = `
            <w:num w:numId="${numId}" title="层级项">
                <w:abstractNumId w:val="${numId}"/>
            </w:num>
        `;
        let wAbstractNum = [`<w:abstractNum name="层级项" w:abstractNumId="${numId}">`];
        wAbstractNum.push('<w:multiLevelType w:val="multilevel"/>');
        // debugger
        arr.forEach((item, i) => {
            let strList = item.text.split('.');
            let lvlText = [];
            for(let j=0; j<strList.length; j++) {
                lvlText.push('%' + (j+1));
            }
            let xml = `
                <w:lvl w:ilvl="${i}" w:tentative="0">
                    <w:start w:val="1"/>
                    <w:numFmt w:val="decimal"/>
                    <w:suff w:val="nothing"/>
                    <w:lvlText w:val="${lvlText.join('.')}  "/>
                    <w:lvlJc w:val="left"/>
                    <w:rPr>
                        <w:rFonts w:ascii="黑体" w:cs="黑体" w:eastAsia="黑体" w:hAnsi="黑体" w:hint="default"/>
                    </w:rPr>
                </w:lvl>
            `;
            wAbstractNum.push(xml);
        });
        wAbstractNum.push('</w:abstractNum>');
        return {
            abstractNum: wNum,
            lvls: wAbstractNum.join("\n")
        };
    },

    setBulletNum(data={}) {
        // debugger
        let xml = '';
        let symbolData = this.getBUlletNameByClass(data.id);
        symbolData.cls = data.cls;
        switch(data.cls) {
            case 'circle':
            case 'hollow-circle':
            case 'square':
            case 'hollow-square':
            case 'line':
                return this.setSymbolNum(symbolData, data.index);
            case 'lower':
                return this.setEnNum(symbolData, data.index);
            case 'num':
                return this.setNumericNum(symbolData, data.index);
        }
    },
    // 数字编号
    setNumericNum(symbolData={}, numId=0) {
        let wNum = `
            <w:num w:numId="${numId}" title="${symbolData.name}">
                <w:abstractNumId w:val="${numId}"/>
            </w:num>
        `;
        let xml = `
            <w:abstractNum name="${symbolData.name}" w:abstractNumId="${numId}">
                <w:multiLevelType w:val="singleLevel"/>
                <w:lvl w:ilvl="0" w:tentative="0">
                    <w:start w:val="1"/>
                    <w:numFmt w:val="decimal"/>
                    <w:lvlText w:val="%1)"/>
                    <w:lvlJc w:val="left"/>
                    <w:pPr>
                        <w:tabs>
                            <w:tab w:pos="420" w:val="left"/>
                        </w:tabs>
                        <w:ind w:hanging="420" w:left="840"/>
                    </w:pPr>
                    <w:rPr>
                        <w:rFonts w:ascii="宋体" w:cs="宋体" w:eastAsia="宋体" w:hAnsi="宋体" w:hint="default"/>
                        <w:sz w:val="20"/>
                    </w:rPr>
                </w:lvl>
            </w:abstractNum>
        `;

        return {
            abstractNum: wNum,
            lvls: xml
        };
    },
    // 英文编号
    setEnNum(symbolData={}, numId=0) {
        let wNum = `
            <w:num w:numId="${numId}" title="${symbolData.name}">
                <w:abstractNumId w:val="${numId}"/>
            </w:num>
        `;

        let xml = `
            <w:abstractNum name="${symbolData.name}" w:abstractNumId="${numId}">
                <w:multiLevelType w:val="singleLevel"/>
                <w:lvl w:ilvl="0" w:tentative="0">
                    <w:start w:val="1"/>
                    <w:numFmt w:val="lowerLetter"/>
                    <w:lvlText w:val="%1)"/>
                    <w:lvlJc w:val="left"/>
                    <w:pPr>
                        <w:tabs>
                            <w:tab w:pos="420" w:val="left"/>
                        </w:tabs>
                        <w:ind w:hanging="420" w:left="840"/>
                    </w:pPr>
                    <w:rPr>
                        <w:rFonts w:ascii="宋体" w:cs="宋体" w:hAnsi="宋体" w:hint="default"/>
                        <w:sz w:val="20"/>
                    </w:rPr>
                </w:lvl>
            </w:abstractNum>
        `;
        return {
            abstractNum: wNum,
            lvls: xml
        };
    },
    // 符号编号
    setSymbolNum(symbolData={}, numId=0) {
        let wNum = `
            <w:num w:numId="${numId}" title="${symbolData.name}">
                <w:abstractNumId w:val="${numId}"/>
            </w:num>
        `;
        let numFmt = `bullet`, numStr = `${symbolData.str}`;
        // 破折号
        if(symbolData.cls === 'line') {
            numFmt = 'none';
            // numStr = symbolData.symbol;
        }
        let xml = `
            <w:abstractNum name="${symbolData.name}" w:abstractNumId="${numId}">
                <w:multiLevelType w:val="singleLevel"/>
                <w:lvl w:ilvl="0" w:tentative="0">
                    <w:start w:val="1"/>
                    <w:numFmt w:val="${numFmt}"/>
                    <w:numFmt w:val="bullet"/>
                    <w:lvlText w:val="${numStr}"/>
                    <w:lvlJc w:val="left"/>
                    <w:pPr>
                        <w:tabs>
                            <w:tab w:pos="420" w:val="left"/>
                        </w:tabs>
                        <w:ind w:hanging="420" w:left="840"/>
                    </w:pPr>
                    <w:rPr>
                        <w:rFonts w:ascii="宋体" w:cs="宋体" w:hAnsi="宋体" w:hint="default"/>
                        <w:sz w:val="13"/>
                    </w:rPr>
                </w:lvl>
            </w:abstractNum>
        `;
        return {
            abstractNum: wNum,
            lvls: xml
        };
    }
}
