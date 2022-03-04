'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Prepare and output a file and create directories as necessary
 *
 * @param {string} file               File
 * @param {string} content            Content
 * @returns {string}                  File
 */
module.exports = (file, content) => {
    try {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, content);
        return file;
    } catch {
        return null;
    }
};
