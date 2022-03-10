'use strict';

const assert = require('assert').strict;
const { readFileSync } = require('fs');
const path = require('path');
const calculateSvgDimensions = require('../lib/svg-sprite/utils/calculate-svg-dimensions.js');

const { paths } = require('./helpers/constants.js');

describe('calculateSvgDimensions', () => {
    it('should return the expected dimensions from 46x46 fixture', () => {
        const svgFilePath = path.join(paths.fixtures, 'svg/special/without-dims/46x46.svg');
        const svg = readFileSync(svgFilePath, 'utf-8');
        const dimensions = calculateSvgDimensions(svg);
        const expected = { width: 46, height: 46 };

        assert.deepEqual(dimensions, expected);
    });

    it('should return the expected dimensions from 2048x2048 fixture', () => {
        const svgFilePath = path.join(paths.fixtures, 'svg/special/without-dims/2048x2048.svg');
        const svg = readFileSync(svgFilePath, 'utf-8');
        const dimensions = calculateSvgDimensions(svg);
        const expected = { width: 2048, height: 2048 };

        assert.deepEqual(dimensions, expected);
    });

    it('should return the expected dimensions from 32x32 fixture', () => {
        const svgFilePath = path.join(paths.fixtures, 'svg/special/without-dims/32x32.svg');
        const svg = readFileSync(svgFilePath, 'utf-8');
        const dimensions = calculateSvgDimensions(svg);
        const expected = { width: 32, height: 32 };

        assert.deepEqual(dimensions, expected);
    });

    it('should return the expected dimensions from 100x100 fixture', () => {
        const svgFilePath = path.join(paths.fixtures, 'svg/special/without-dims/100x100.svg');
        const svg = readFileSync(svgFilePath, 'utf-8');
        const dimensions = calculateSvgDimensions(svg);
        const expected = { width: 100, height: 100 };

        assert.deepEqual(dimensions, expected);
    });

    it('should return the expected dimensions from 231x69 fixture', () => {
        const svgFilePath = path.join(paths.fixtures, 'svg/special/without-dims/231x69.svg');
        const svg = readFileSync(svgFilePath, 'utf-8');
        const dimensions = calculateSvgDimensions(svg);
        const expected = { width: 231, height: 69 };

        assert.deepEqual(dimensions, expected);
    });

    it('should return same results no each run', () => {
        const svgFilePath = path.join(paths.fixtures, 'svg/special/without-dims/46x46.svg');
        const svg = readFileSync(svgFilePath, 'utf-8');

        const firstRunDimensions = calculateSvgDimensions(svg);
        const secondRunDimensions = calculateSvgDimensions(svg);
        const thirdRunDimensions = calculateSvgDimensions(svg);
        assert.deepEqual(firstRunDimensions, secondRunDimensions);
        assert.deepEqual(thirdRunDimensions, secondRunDimensions);
    });
});
