'use strict';

const { Resvg } = require('@resvg/resvg-js');
const DimensionsCalculationError = require('../errors/dimensions-calculation-error.js');

/**
 * @typedef  {object} Dimension
 *
 * @property {number} width     Width
 * @property {number} height    Height
 */

/**
 * Calculate an SVG rendered dimensions.
 *
 * @param   {string}    svg Svg
 *
 * @returns {Dimension}     Dimension
 */
function calculateSvgDimensions(svg) {
  try {
    const { width, height } = new Resvg(svg, {
      logLevel: 'error',
      font: {
        loadSystemFonts: false // It will be faster to disable loading system fonts.
      }
    });

    return { width, height };
  } catch (error) {
    throw new DimensionsCalculationError(error);
  }
}

module.exports = calculateSvgDimensions;
