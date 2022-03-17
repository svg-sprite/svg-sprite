'use strict';

const { chromium } = require('playwright');
const constants = require('./constants.js');

/**
 * Capture a screenshot of a URL using browser
 *
 * @param {string} src                Source file
 * @param {string} target             Screenshot file
 */
module.exports = async(src, target) => {
    let browser;

    try {
        browser = await chromium.launch();
        const context = await browser.newContext();
        const page = await context.newPage();
        const { width, height } = constants.browser;

        await page.setViewportSize({
            width,
            height
        });

        await page.goto(`file://${src}`);
        await page.screenshot({
            omitBackground: true,
            path: target,
            type: 'png',
            clip: { x: 0, y: 0, width, height }
        });
        await page.close();
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};
