'use strict';

const { readFile } = require('fs').promises;
const path = require('path');
const calculateSvgDimensions = require('../lib/svg-sprite/utils/calculate-svg-dimensions.js');
const DimensionsCalculationError = require('../lib/svg-sprite/errors/dimensions-calculation-error.js');

describe('calculateSvgDimensions', () => {
    it('should return the expected dimensions from 46x46 fixture', async() => {
        expect.hasAssertions();

        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims/46x46.svg');
        const svg = await readFile(svgFilePath, 'utf8');
        const dimensions = calculateSvgDimensions(svg);
        const expected = { width: 46, height: 46 };

        expect(dimensions).toStrictEqual(expected);
    });

    it('should return the expected dimensions from 2048x2048 fixture', async() => {
        expect.hasAssertions();

        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims/2048x2048.svg');
        const svg = await readFile(svgFilePath, 'utf8');
        const dimensions = calculateSvgDimensions(svg);
        const expected = { width: 2048, height: 2048 };

        expect(dimensions).toStrictEqual(expected);
    });

    it('should return the expected dimensions from 32x32 fixture', async() => {
        expect.hasAssertions();

        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims/32x32.svg');
        const svg = await readFile(svgFilePath, 'utf8');
        const dimensions = calculateSvgDimensions(svg);
        const expected = { width: 32, height: 32 };

        expect(dimensions).toStrictEqual(expected);
    });

    it('should return the expected dimensions from 100x100 fixture', async() => {
        expect.hasAssertions();

        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims/100x100.svg');
        const svg = await readFile(svgFilePath, 'utf8');
        const dimensions = calculateSvgDimensions(svg);
        const expected = { width: 100, height: 100 };

        expect(dimensions).toStrictEqual(expected);
    });

    it('should return the expected dimensions from 231x69 fixture', async() => {
        expect.hasAssertions();

        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims/231x69.svg');
        const svg = await readFile(svgFilePath, 'utf8');
        const dimensions = calculateSvgDimensions(svg);
        const expected = { width: 231, height: 69 };

        expect(dimensions).toStrictEqual(expected);
    });

    it('should return same results no each run', async() => {
        expect.hasAssertions();

        const svgFilePath = path.join(__dirname, 'fixture/svg/special/without-dims/46x46.svg');
        const svg = await readFile(svgFilePath, 'utf8');

        const firstRunDimensions = calculateSvgDimensions(svg);
        const secondRunDimensions = calculateSvgDimensions(svg);
        const thirdRunDimensions = calculateSvgDimensions(svg);

        expect(firstRunDimensions).toStrictEqual(secondRunDimensions);
        expect(thirdRunDimensions).toStrictEqual(secondRunDimensions);
    });

    it('should throw error if error occurred', () => {
        expect.hasAssertions();

        jest.doMock('@resvg/resvg-js', () => {
            return {
                render: jest.fn().mockImplementationOnce(() => {
                    throw new Error('test');
                })
            };
        });

        expect(() => {
            calculateSvgDimensions('');
        }).toThrow(DimensionsCalculationError);
    });
});
