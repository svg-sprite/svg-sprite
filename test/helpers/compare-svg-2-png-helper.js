'use strict';

const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');
const { PNG } = require('pngjs');
const convertSvg2Png = require('./convert-svg-2-png.js');
const isPngsMatched = require('./is-pngs-matched.js');

/**
 * Rasterize an SVG file and compare it to an expected image
 *
 * @param {string} svg                SVG file path
 * @param {string} png                PNG file path
 * @param {string} expected           Expected PNG file path
 * @param {string} diff               Diff file path
 * @param {Function} done             Callback
 */
module.exports = async(svg, png, expected, diff, done) => {
    await fs.mkdir(path.dirname(png), { recursive: true });
    let browser;

    try {
        browser = await puppeteer.launch();
        await convertSvg2Png(svg, png, browser);

        const matchedResult = await isPngsMatched(png, expected);

        if (matchedResult.isEqual) {
            return done(null, matchedResult);
        }

        await fs.mkdir(path.dirname(diff), { recursive: true });
        await fs.writeFile(diff, PNG.sync.write(matchedResult.diff));
        done(null, matchedResult);
    } catch (error) {
        console.error(error);
        done(error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};
