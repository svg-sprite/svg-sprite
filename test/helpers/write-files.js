'use strict';

const fs = require('fs');
const path = require('path');
const File = require('vinyl');
const { isObject } = require('../../lib/svg-sprite/utils/index.js');

/**
 * Recursively write files to disc
 *
 * @param {object | Array} files      Files
 * @returns {number}                  Number of written files
 */
module.exports = function writeFiles(files) {
    let written = 0;
    for (const file of Object.values(files)) {
        if (isObject(file) || Array.isArray(file)) {
            if (file.constructor === File) {
                fs.mkdirSync(path.dirname(file.path), { recursive: true });
                fs.writeFileSync(file.path, file.contents);
                ++written;
            } else {
                written += writeFiles(file);
            }
        }
    }

    return written;
};
