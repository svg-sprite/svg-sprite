'use strict';

const { launchBrowser } = require('./capture-browser.js');

/**
 * @param {string} svgPath Svg path
 * @param {string} pngPath Png path
 */
async function convertSvg2Png(svgPath, pngPath) {
    let page;

    try {
        const browser = await launchBrowser();
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
    }
}

module.exports = convertSvg2Png;
