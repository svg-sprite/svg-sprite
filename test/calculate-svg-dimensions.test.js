'use strict';

const assert = require('assert').strict;
const { readFile } = require('fs').promises;
const path = require('path');
const calculateSvgDimensions = require('../lib/svg-sprite/calculate-svg-dimensions.js');

describe('calculateSvgDimensions', () => {
    it('should return the expected dimensions from 46x46 fixture', async() => {
        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims/46x46.svg');
        const svg = await readFile(svgFilePath, 'utf-8');
        const dimensions = await calculateSvgDimensions(svg);
        const expected = { width: 46, height: 46 };

        assert.deepEqual(dimensions, expected);
    });

    it('should return the expected dimensions from 2048x2048 fixture', async() => {
        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims/2048x2048.svg');
        const svg = await readFile(svgFilePath, 'utf-8');
        const dimensions = await calculateSvgDimensions(svg);
        const expected = { width: 2048, height: 2048 };

        assert.deepEqual(dimensions, expected);
    });

    it('should return the expected dimensions from 32x32 fixture', async() => {
        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims/32x32.svg');
        const svg = await readFile(svgFilePath, 'utf-8');
        const dimensions = await calculateSvgDimensions(svg);
        const expected = { width: 32, height: 32 };

        assert.deepEqual(dimensions, expected);
    });

    it('should return the expected dimensions from 100x100 fixture', async() => {
        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims/100x100.svg');
        const svg = await readFile(svgFilePath, 'utf-8');
        const dimensions = await calculateSvgDimensions(svg);
        const expected = { width: 100, height: 100 };

        assert.deepEqual(dimensions, expected);
    });

    it('should return the expected dimensions from 231x69 fixture', async() => {
        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims/231x69.svg');
        const svg = await readFile(svgFilePath, 'utf-8');
        const dimensions = await calculateSvgDimensions(svg);
        const expected = { width: 231, height: 69 };

        assert.deepEqual(dimensions, expected);
    });

    it('should return same results no each run', async() => {
        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims/46x46.svg');
        const svg = await readFile(svgFilePath, 'utf-8');

        const firstRunDimensions = await calculateSvgDimensions(svg);
        const secondRunDimensions = await calculateSvgDimensions(svg);
        const thirdRunDimensions = await calculateSvgDimensions(svg);

        assert.deepEqual(firstRunDimensions, secondRunDimensions);
        assert.deepEqual(thirdRunDimensions, secondRunDimensions);
    });
});
