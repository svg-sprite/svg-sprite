'use strict';

const puppeteer = require('puppeteer');

/**
 * Capture a screenshot of a URL using puppeteer
 *
 * @param {string} src                Source file
 * @param {string} target             Screenshot file
 * @param {Function} cb               Function
 */
module.exports = async(src, target, cb) => {
    let browser;

    try {
        browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setViewport({
            height: 1024,
            width: 1280
        });
        await page.goto(`file://${src}`, { waitUntil: 'networkidle0' });
        await page.screenshot({
            omitBackground: true,
            path: target,
            type: 'png'
        });
        cb();
    } catch (error) {
        cb(error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};
