'use strict';

/* eslint-env browser */

/**
 * Calculate an SVG rendered dimensions.
 * It truncates everything before the first '<svg ' string
 *
 * @param svg {string}
 * @param browser {puppeteer.Browser}
 * @returns {Promise<{ height:number, width: number }>}
 */
async function calculateSvgDimensions(svg, browser) {
    let page;

    try {
        page = await browser.newPage();
        const html = `<svg xmlns="http://www.w3.org/2000/svg">${svg.substr(svg.toLowerCase().indexOf('<svg'))}</svg>`;
        await page.setContent(html, { waitUntil: 'networkidle0' });

        return await page.evaluate(() => {
            const { height, width } = document.getElementsByTagName('svg')[1].getBoundingClientRect();

            return { height, width };
        });
    } finally {
        if (page) {
            await page.close();
        }
    }
}

module.exports = calculateSvgDimensions;
