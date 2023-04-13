'use strict';

const removeTmpPath = require('../helpers/remove-temp-path.js');

module.exports = async () => {
    await removeTmpPath();
};
