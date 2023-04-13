'use strict';

const { rm } = require('node:fs').promises;
const { paths } = require('./constants.js');

/**
 * Removing tempPath for tests
 *
 * @param   {string}        pathName Path
 *
 * @returns {Promise<void>}
 */
module.exports = async (pathName = paths.tmp) => {
    await rm(pathName, { force: true, recursive: true });
};
