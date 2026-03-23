
const buildConfig = require('./config/config.build');
const devConfig = require('./config/config.dev');
module.exports = process.env.NODE_ENV === 'development' ? devConfig : buildConfig;

