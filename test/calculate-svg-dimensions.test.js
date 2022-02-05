'use strict';

const assert = require('assert').strict;
const { readFile } = require('fs').promises;
const path = require('path');
const BrowserManager = require('../lib/browser-mananger.js');
const calculateSvgDimensions = require('../lib/svg-sprite/calculate-svg-dimensions.js');

describe('calculateSvgDimensions', () => {
    let browserManager;

    before(async() => {
        browserManager = new BrowserManager();
    });

    after(() => browserManager.closeBrowser());

    it('should return the expected dimensions from without-dims fixture (43x43)', async() => {
        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims.svg');
        const svg = await readFile(svgFilePath, 'utf-8');
        const dimensions = await calculateSvgDimensions(svg, await browserManager.getBrowser());
        const expected = { width: 43, height: 43 };

        assert.deepEqual(dimensions, expected);
    });

    it('should return the expected dimensions from without-dims-2048x2048 fixture (2048x2048)', async() => {
        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims-2048x2048.svg');
        const svg = await readFile(svgFilePath, 'utf-8');
        const dimensions = await calculateSvgDimensions(svg, await browserManager.getBrowser());
        const expected = { width: 2048, height: 2048 };

        assert.deepEqual(dimensions, expected);
    });

    it('should return same results no each run', async() => {
        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims.svg');
        const svg = await readFile(svgFilePath, 'utf-8');

        const firstRunDimensions = await calculateSvgDimensions(svg, await browserManager.getBrowser());
        const secondRunDimensions = await calculateSvgDimensions(svg, await browserManager.getBrowser());
        const thirdRunDimensions = await calculateSvgDimensions(svg, await browserManager.getBrowser());

        assert.deepEqual(firstRunDimensions, secondRunDimensions);
        assert.deepEqual(thirdRunDimensions, secondRunDimensions);
    });
});
