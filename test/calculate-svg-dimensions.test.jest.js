'use strict';

const { readFileSync } = require('fs');
const path = require('path');
const calculateSvgDimensions = require('../lib/svg-sprite/utils/calculate-svg-dimensions.js');

describe('calculateSvgDimensions', () => {
    it('should return the expected dimensions from 46x46 fixture', () => {
        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims/46x46.svg');
        const svg = readFileSync(svgFilePath, 'utf-8');

        expect(calculateSvgDimensions(svg)).toStrictEqual({ width: 46, height: 46 });
    });

    it('should return the expected dimensions from 2048x2048 fixture', () => {
        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims/2048x2048.svg');
        const svg = readFileSync(svgFilePath, 'utf-8');

        expect(calculateSvgDimensions(svg)).toStrictEqual({ width: 2048, height: 2048 });
    });

    it('should return the expected dimensions from 32x32 fixture', () => {
        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims/32x32.svg');
        const svg = readFileSync(svgFilePath, 'utf-8');

        expect(calculateSvgDimensions(svg)).toStrictEqual({ width: 32, height: 32 });
    });

    it('should return the expected dimensions from 100x100 fixture', () => {
        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims/100x100.svg');
        const svg = readFileSync(svgFilePath, 'utf-8');

        expect(calculateSvgDimensions(svg)).toStrictEqual({ width: 100, height: 100 });
    });

    it('should return the expected dimensions from 231x69 fixture', () => {
        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims/231x69.svg');
        const svg = readFileSync(svgFilePath, 'utf-8');

        expect(calculateSvgDimensions(svg)).toStrictEqual({ width: 231, height: 69 });
    });

    it('should return same results no each run', () => {
        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims/46x46.svg');
        const svg = readFileSync(svgFilePath, 'utf-8');

        const firstRunDimensions = calculateSvgDimensions(svg);
        const secondRunDimensions = calculateSvgDimensions(svg);
        const thirdRunDimensions = calculateSvgDimensions(svg);

        expect(firstRunDimensions).toStrictEqual(secondRunDimensions);
        expect(thirdRunDimensions).toStrictEqual(secondRunDimensions);
    });
});
