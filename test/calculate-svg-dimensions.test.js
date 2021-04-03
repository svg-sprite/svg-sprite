'use strict';

const { readFile } = require('fs').promises;
const path = require('path');
const should = require('should');
const BrowserManager = require('../lib/browser-mananger.js');
const calculateSvgDimensions = require('../lib/svg-sprite/calculate-svg-dimensions.js');

describe('calculateSvgDimensions', () => {
    let browserManager;

    before(async() => {
        browserManager = new BrowserManager();
    });

    after(() => browserManager.closeBrowser());

    it('should return the svg dimensions', async() => {
        const svgFilePath = path.join(__dirname, 'fixture/svg/weather-clear-dimension-calculation.svg');
        const svg = await readFile(svgFilePath, 'utf-8');
        const dimension = await calculateSvgDimensions(svg, await browserManager.getBrowser());

        should.deepEqual(dimension, { width: 43, height: 43 });
    });
});
