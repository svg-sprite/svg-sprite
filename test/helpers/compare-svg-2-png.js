'use strict';

const fs = require('fs').promises;
const path = require('path');
const { chromium } = require('playwright-chromium');
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
    await fs.mkdir(path.dirname(png), { recursive: true });
    let browser;

    try {
        browser = await chromium.launch();
        await convertSvg2Png(svg, png, browser);

        return comparePng2Png(png, expected);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};
