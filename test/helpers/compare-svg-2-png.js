'use strict';

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const looksSame = require('looks-same');
const convertSvg2Png = require('./convert-svg-2-png.js');

/**
 * Rasterize an SVG file and compare it to an expected image
 *
 * @param {String} svg                SVG file path
 * @param {String} png                PNG file path
 * @param {String} expected           Expected PNG file path
 * @param {String} diff               Diff file path
 * @param {Function} done             Callback
 */
module.exports = async(svg, png, expected, diff, done) => {
    fs.mkdirSync(path.dirname(png), { recursive: true });
    let browser;

    try {
        browser = await puppeteer.launch();
        await convertSvg2Png(svg, png, browser);
        looksSame.createDiff({
            reference: expected,
            current: png,
            diff,
            highlightColor: '#ff00ff'
        }, () => {});
        await looksSame(png, expected, (err, result) => {
            done(err, result);
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
