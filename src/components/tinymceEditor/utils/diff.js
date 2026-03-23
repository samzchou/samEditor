/**
 * ===================================================================================================================
 * @module
 * @desc 文档比较模块
 * @author sam 2022-03-06
 * ===================================================================================================================
 */
//引入diff库
const Diff = require("diff");

function StringBuffer() {
    this.__strings__ = [];
};
StringBuffer.prototype.append = function(str) {
    this.__strings__.push(str);
    return this;
};
StringBuffer.prototype.appendFormat = function(str) {
    for (var i = 1; i < arguments.length; i++) {
        var parent = "\\{" + (i - 1) + "\\}";
        var reg = new RegExp(parent, "g")
        str = str.replace(reg, arguments[i]);
    }
    this.__strings__.push(str);
    return this;
}
StringBuffer.prototype.toString = function() {
    return this.__strings__.join('');
};
StringBuffer.prototype.clear = function() {
    this.__strings__ = [];
}
StringBuffer.prototype.size = function() {
    return this.__strings__.length;
}

export const getHighLightDiff = (oldStr, str) => {
    const diff = Diff.diffChars(oldStr, str);
    //console.log(diff)
    var result = new StringBuffer();
    diff.forEach((part) => {
        // 文字新增，红色
        if (part.added) {
            result.append("<span class='diff h'>");
            result.append(part.value);
            result.append("</span>");
            //文字删减，灰色删除线
        } else if (part.removed) {
            result.append("<span class='diff d'>");
            result.append(part.value);
            result.append("</span>");
            // 无变化
        } else {
            result.append(part.value);
        }
    });
    return result;
}

// 比较原始大纲数据与提交的大纲数据
export const compareOutline = (originalData, submittedData) => {
    // 比较数据
    var ids = [];
    const unchangedData = [];
    for (let i = 0; i < submittedData.length; i++) {
        const submittedItem = submittedData[i];
        const originalItem = originalData.find(item => item.outlineId === submittedItem.outlineId);
        if (originalItem) {
            // 检查每个字段值是否相同
            for (const key in submittedItem) {
                if (!['ancestors', 'content', 'outlineId', 'parentId', 'outlineTitle','isVisible','outlineCatalog','outlineType','orderNum'].includes(key)) {
                    continue;
                }
                if (submittedItem.hasOwnProperty(key)) {
                    if (key === 'content') {
                        if (!_.isEqual(submittedItem[key]['content'], originalItem[key]['content'])) {
                            // unchangedData.push(submittedItem)
                            ids = ids.concat(submittedItem.ancestors.split(','))
                            continue;
                        }
                    } else {
                        if (!_.isEqual(submittedItem[key], originalItem[key])) {
                            // unchangedData.push(submittedItem)
                            ids = ids.concat(submittedItem.ancestors.split(','))
                            continue;
                        }
                    }
                }
            }
        }
    }
    if (ids.length) {
        ids = _.uniq(ids);
        for (let id of ids) {
            let outlineItem = _.find(submittedData, { outlineId: id });
            if (outlineItem) {
                unchangedData.push(outlineItem);
            }
        }
    }

    return unchangedData;
}
