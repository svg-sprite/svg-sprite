'use strict';

const path = require('path');
const { Buffer } = require('buffer');
const { DOMParser } = require('@xmldom/xmldom');
const SVGSpriter = require('../lib/svg-sprite.js');
const calculateSvgDimensions = require('../lib/svg-sprite/utils/calculate-svg-dimensions.js');
const { DEFAULT_XML_DECLARATION } = require('../lib/svg-sprite/constants.js');

jest.mock('../lib/svg-sprite/utils/calculate-svg-dimensions.js');

const expectations = [{
    svg: '46x46.svg',
    result: {
        width: 46,
        height: 46
    }
}, {
    svg: '2048x2048.svg',
    result: {
        width: 2048,
        height: 2048
    }
}];

const TEST_SVG = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';

describe('testing shapes', () => {
    it.each`
            svg                    | dimension
            ${expectations[0].svg} | ${expectations[0].result}
            ${expectations[1].svg} | ${expectations[1].result}
        `('should call calculateSvgDimensions if the $svg does not contain viewBox or height/width properties ($dimension)', ({
        svg, dimension
    // eslint-disable-next-line jest/no-done-callback
    }, done) => {
        expect.hasAssertions();

        const spriter = new SVGSpriter({
            shape: {
                dest: 'svg',
                dimension: {
                    maxWidth: 4000,
                    maxHeight: 4000
                }
            }
        });

        calculateSvgDimensions.mockReturnValueOnce(dimension);

        const svgFilePath = path.join(__dirname, `fixture/svg/special/without-dims/${svg}`);

        spriter.add(
            svgFilePath,
            svg,
            Buffer.from(TEST_SVG)
        );

        expect(calculateSvgDimensions).toHaveBeenCalledWith(new DOMParser().parseFromString(`${DEFAULT_XML_DECLARATION}${TEST_SVG}`).toString());

        spriter.compile((error, result) => {
            expect(error).toBeNull();
            expect(result).toBeInstanceOf(Object);
            expect(result.shapes).toBeInstanceOf(Array);

            const svg = result.shapes[0]._contents.toString();
            const dom = new DOMParser().parseFromString(svg, 'text/xml');

            expect(dom.documentElement.getAttribute('height')).toStrictEqual(dimension.height.toString());
            expect(dom.documentElement.getAttribute('width')).toStrictEqual(dimension.width.toString());

            done();
        });
    });
});
