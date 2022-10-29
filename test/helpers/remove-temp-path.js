'use strict';

const { rm } = require('fs').promises;
const { paths } = require('./constants.js');

/**
 * Removing tempPath for tests
 *
 * @param {string} pathName path
 * @returns {Promise<void>}
 */
module.exports = async(pathName = paths.tmp) => {
    await rm(pathName, { force: true, recursive: true });
};
