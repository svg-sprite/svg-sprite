'use strict';

/**
 * @param {string} svgPath            svg path
 * @param {string} pngPath            png path
 * @param {puppeteer.Browser} browser puppeteer browser
 */
async function convertSvg2Png(svgPath, pngPath, browser) {
    let page;

    try {
        page = await browser.newPage();
        await page.goto(`file://${svgPath}`);
        const svg = await page.$('svg');
        await svg.screenshot({
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
