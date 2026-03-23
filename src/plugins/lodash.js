import lodash from 'element-ui/lib/utils/lodash.js';
if (process.server) {
    global._ = lodash;
} else {
    window._ = lodash;
}

