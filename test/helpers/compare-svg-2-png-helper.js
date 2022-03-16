'use strict';

const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');
const looksSame = require('looks-same');
const convertSvg2Png = require('./convert-svg-2-png.js');

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
        await looksSame(png, expected, (error, result) => {
            if (!error && !result.equal) {
                looksSame.createDiff({
                    reference: expected,
                    current: png,
                    diff,
                    highlightColor: '#ff00ff'
                }, () => {});
            }

            done(error, result);
        });
    } catch (error) {
        console.error(error);
        done(error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};
