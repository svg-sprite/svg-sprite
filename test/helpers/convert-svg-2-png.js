'use strict';

const { chromium } = require('playwright-chromium');

/**
 * @param {string} svgPath             svg path
 * @param {string} pngPath             png path
 */
async function convertSvg2Png(svgPath, pngPath) {
    let page;
    let browser;

    try {
        browser = await chromium.launch();
        const context = await browser.newContext();
        page = await context.newPage();
        await page.goto(`file://${svgPath}`);

        await page.locator('svg').first().screenshot({
            omitBackground: true,
            path: pngPath,
            type: 'png'
        });
    } finally {
        if (page) {
            await page.close();
        }

        if (browser) {
            await browser.close();
        }
    }
}

module.exports = convertSvg2Png;
