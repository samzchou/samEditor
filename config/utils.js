const fs = require('fs');
const path = require('path');
const join = path.join;

const resolve = (dir) => path.join(__dirname, '../', dir);

/**
 * @desc 大写转横杠
 * @param {*} str
 */
function upperCasetoLine(str) {
    let temp = str.replace(/[A-Z]/g, function (match) {
        return "-" + match.toLowerCase();
    });
    if (temp.slice(0, 1) === '-') {
        temp = temp.slice(1);
    }
    return temp;
}

module.exports = {
    resolve,
    upperCasetoLine,
    /**
     * @desc 获取组件入口
     * @param {*} path
     */
    getComponentEntries(path) {
        let files = fs.readdirSync(resolve(path));

        const componentEntries = files.reduce((fileObj, item) => {
            var itemPath = join(path, item);
            var isDir = fs.statSync(itemPath).isDirectory();
            var [name, suffix] = item.split('.');

            //  文件中的入口文件
            if (isDir) {
                fileObj[`s-${upperCasetoLine(item)}`] = resolve(join(itemPath, 'index.js'));
            } else if (suffix === "js") {
                fileObj[name] = resolve(`${itemPath}`);
            }
            return fileObj;
        }, {});

        return componentEntries;
    }
}
