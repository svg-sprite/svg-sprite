'use strict';

/* eslint-disable no-unused-expressions */
const should = require('should');
const compareSvg2PngHelper = require('./compare-svg-2-png-helper.js');

/**
 * Rasterize an SVG file and compare it to an expected image
 *
 * @param {string} svg                SVG file path
 * @param {string} png                PNG file path
 * @param {string} expected           Expected PNG file path
 * @param {string} diff               Diff file path
 * @param {Function} done             Callback
 * @param {string} msg                Message
 */
module.exports = async function(svg, png, expected, diff, done, msg) {
    try {
        await compareSvg2PngHelper(svg, png, expected, diff, (error, result) => {
            should(result).ok;
            should(error).not.ok;
            should.ok(result.equal, msg + JSON.stringify(result.diffClusters) + png);
            done();
        });
    } catch (error) {
        console.error(error);
        should(error).not.ok;
        done();
    }
};
