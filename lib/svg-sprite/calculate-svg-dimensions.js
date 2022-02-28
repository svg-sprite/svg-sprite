'use strict';
const resvg = require('@resvg/resvg-js');
const imageSize = require('image-size');

/**
 * Calculate an SVG rendered dimensions.
 *
 * @param svg {string}
 * @returns {Object<{ height: Number, width: Number }>}
 */
function calculateSvgDimensions(svg) {
    try {
        const pngData = resvg.render(svg, {
            logLevel: 'error',
            font: {
                loadSystemFonts: false // It will be faster to disable loading system fonts.
            }
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
