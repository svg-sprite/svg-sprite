'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const File = require('vinyl');

/**
 * Recursively write files to disc
 *
 * @param {Object} files              Files
 * @return {Number}                   Number of written files
 */
module.exports = function writeFiles(files) {
    let written = 0;
    for (const key in files) {
        const file = files[key];

        if (_.isObject(file)) {
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
