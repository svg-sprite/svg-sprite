'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Prepare and output a file and create directories as necessary
 *
 * @param {String} file               File
 * @param {String} content            Content
 * @return {String}                   File
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
