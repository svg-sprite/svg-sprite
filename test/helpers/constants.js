const path = require('path');

module.exports = {
    paths: {
        tmp: path.resolve(path.join(__dirname, '../../tmp')),
        fixtures: path.resolve(path.join(__dirname, '../fixture')),
        expectations: path.resolve(path.join(__dirname, '../expected'))
    },
    browser: {
        width: 1280,
        height: 1024
    }
};
