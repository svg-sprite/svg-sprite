'use strict';

const puppeteer = require('puppeteer');
const constants = require('./constants.js');

/**
 * Capture a screenshot of a URL using puppeteer
 *
 * @param {string} src                Source file
 * @param {string} target             Screenshot file
 * @param {Function} cb               Function
 */
module.exports = async(src, target, cb) => {
    let error;
    let browser;

    try {
        browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setViewport({
            height: constants.puppeteer.height,
            width: constants.puppeteer.width
        });
        await page.goto(`file://${src}`, { waitUntil: 'networkidle0' });
        await page.screenshot({
            omitBackground: true,
            path: target,
            type: 'png'
        });
    } catch (error_) {
        error = error_;
    } finally {
        if (browser) {
            await browser.close();
        }

        cb(error);
    }
};
