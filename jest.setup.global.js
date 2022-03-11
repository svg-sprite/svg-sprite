'use strict';

const removeTmpPath = require('./test/helpers/remove-temp-path.js');

module.exports = async() => {
    await removeTmpPath();
};
