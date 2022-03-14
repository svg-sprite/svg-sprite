'use strict';

const { readFileSync } = require('fs');
const path = require('path');
const calculateSvgDimensions = require('../lib/svg-sprite/utils/calculate-svg-dimensions.js');

describe('calculateSvgDimensions', () => {
    it('should return the expected dimensions from 46x46 fixture', () => {
        expect.hasAssertions();

        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims/46x46.svg');
        const svg = readFileSync(svgFilePath, 'utf-8');
        const dimensions = calculateSvgDimensions(svg);
        const expected = { width: 46, height: 46 };

        expect(dimensions).toStrictEqual(expected);
    });

    it('should return the expected dimensions from 2048x2048 fixture', () => {
        expect.hasAssertions();

        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims/2048x2048.svg');
        const svg = readFileSync(svgFilePath, 'utf-8');
        const dimensions = calculateSvgDimensions(svg);
        const expected = { width: 2048, height: 2048 };

        expect(dimensions).toStrictEqual(expected);
    });

    it('should return the expected dimensions from 32x32 fixture', () => {
        expect.hasAssertions();

        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims/32x32.svg');
        const svg = readFileSync(svgFilePath, 'utf-8');
        const dimensions = calculateSvgDimensions(svg);
        const expected = { width: 32, height: 32 };

        expect(dimensions).toStrictEqual(expected);
    });

    it('should return the expected dimensions from 100x100 fixture', () => {
        expect.hasAssertions();

        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims/100x100.svg');
        const svg = readFileSync(svgFilePath, 'utf-8');
        const dimensions = calculateSvgDimensions(svg);
        const expected = { width: 100, height: 100 };

        expect(dimensions).toStrictEqual(expected);
    });

    it('should return the expected dimensions from 231x69 fixture', () => {
        expect.hasAssertions();

        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims/231x69.svg');
        const svg = readFileSync(svgFilePath, 'utf-8');
        const dimensions = calculateSvgDimensions(svg);
        const expected = { width: 231, height: 69 };

        expect(dimensions).toStrictEqual(expected);
    });

    it('should return same results no each run', () => {
        expect.hasAssertions();

        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims/46x46.svg');
        const svg = readFileSync(svgFilePath, 'utf-8');

        const firstRunDimensions = calculateSvgDimensions(svg);
        const secondRunDimensions = calculateSvgDimensions(svg);
        const thirdRunDimensions = calculateSvgDimensions(svg);

        expect(firstRunDimensions).toStrictEqual(secondRunDimensions);
        expect(thirdRunDimensions).toStrictEqual(secondRunDimensions);
    });
});
