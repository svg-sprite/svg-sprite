'use strict';

const { mkdir } = require('node:fs').promises;
const path = require('node:path');
const convertSvg2Png = require('./convert-svg-2-png.js');
const comparePng2Png = require('./compare-png-2-png.js');

/**
 * Rasterize an SVG file and compare it to an expected image
 *
 * @param {string} svg                SVG file path
 * @param {string} png                PNG file path
 * @param {string} expected           Expected PNG file path
 */
module.exports = async(svg, png, expected) => {
    await mkdir(path.dirname(png), { recursive: true });
    await convertSvg2Png(svg, png);

    return comparePng2Png(png, expected);
};
