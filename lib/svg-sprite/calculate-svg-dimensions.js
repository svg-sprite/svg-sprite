'use strict';
const resvg = require('@resvg/resvg-js');
const imageSize = require('image-size');

/**
 * Calculate an SVG rendered dimensions.
 *
 * @param svg {string}
 * @returns {Promise<{ height: Number, width: Number }>}
 */
async function calculateSvgDimensions(svg) {
    try {
        const pngData = await resvg.renderAsync(svg, {
            fitTo: { mode: 'original' },
            logLevel: 'error'
        });

        const dimensions = imageSize.imageSize(pngData);

        return {
            height: dimensions.height,
            width: dimensions.width
        };
    } catch (error) {
        const e = new Error(error);
        e.name = 'DimensionsCalculationError';
        e.errno = 1_400_356_219;
        throw e;
    }
}

module.exports = calculateSvgDimensions;
