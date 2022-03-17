'use strict';

const constants = require('./constants.js');

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
        await page.setViewport({
            width: constants.puppeteer.width,
            height: constants.puppeteer.height
        });
        await page.screenshot({
            omitBackground: true,
            path: pngPath,
            type: 'png',

            clip: {
                x: 0,
                y: 0,
                width: constants.puppeteer.width,
                height: constants.puppeteer.height
            }
        });
    } finally {
        if (page) {
            await page.close();
        }
    }
}

module.exports = convertSvg2Png;
