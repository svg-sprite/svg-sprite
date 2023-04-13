'use strict';

const { launchBrowser } = require('./capture-browser.js');
const comparePng2Png = require('./compare-png-2-png.js');
const constants = require('./constants.js');

/**
 * Capture a screenshot of a URL using browser
 *
 * @param {string} HTMLPath          Input HTML file path
 * @param {string} expectedImagePath Expected screenshot file
 */
module.exports = async (HTMLPath, expectedImagePath) => {
    let page;

    try {
        const browser = await launchBrowser();
        const context = await browser.newContext();
        page = await context.newPage();
        const { width, height } = constants.browser;
        const previewImagePath = `${HTMLPath}.png`;

        await page.setViewportSize({ width, height });

        await page.goto(`file://${HTMLPath}`);
        await page.screenshot({
            omitBackground: true,
            path: previewImagePath,
            type: 'png',
            clip: { x: 0, y: 0, width, height }
        });

        return comparePng2Png(previewImagePath, expectedImagePath);
    } finally {
        if (page) {
            await page.close();
        }
    }
};
