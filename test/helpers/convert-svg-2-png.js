'use strict';

const constants = require('./constants.js');

/**
 * @param {string} svgPath             svg path
 * @param {string} pngPath             png path
 * @param {playwright.Browser} browser chromium browser
 */
async function convertSvg2Png(svgPath, pngPath, browser) {
    let page;

    try {
        const context = await browser.newContext();
        page = await context.newPage();
        await page.goto(`file://${svgPath}`);

        const { height } = constants.browser;
        const { width } = constants.browser;

        await page.setViewportSize({
            width,
            height
        });
        await page.screenshot({
            omitBackground: true,
            path: pngPath,
            type: 'png',

            clip: {
                x: 0,
                y: 0,
                width,
                height
            }
        });
    } finally {
        if (page) {
            await page.close();
        }
    }
}

module.exports = convertSvg2Png;
