'use strict';

const fs = require('fs').promises;
const path = require('path');

/**
 * Prepare and output a file and create directories as necessary
 *
 * @param {string} file               File
 * @param {string} content            Content
 * @returns {string}                  File
 */
module.exports = async(file, content) => {
    try {
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, content);
        return file;
    } catch {
        return null;
    }
};
