'use strict';

const fs = require('fs').promises;
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const constants = require('./constants.js');

const MAX_MISMATCH = 5;

/**
 *
 * @param {string} input                                                          input png
 * @param {string} expected                                                       expected png
 * @returns {Promise<{isEqual: boolean, matched: (number|*), diff: exports.PNG}>} matching results
 */
module.exports = async(input, expected) => {
    const inputPng = PNG.sync.read(await fs.readFile(input));
    const expectedPng = PNG.sync.read(await fs.readFile(expected));

    const { width, height } = constants.browser;

    const diff = new PNG({ width, height });
    const matched = pixelmatch(
        inputPng.data,
        expectedPng.data,
        diff.data,
        width,
        height,
        { threshold: 0.1 }
    );

    if (matched <= MAX_MISMATCH) {
        return {
            isEqual: true,
            matched,
            diff
        };
    }

    return {
        isEqual: false,
        matched,
        diff
    };
};
