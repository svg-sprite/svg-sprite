'use strict';

const assert = require('assert').strict;
const { readFileSync } = require('fs');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');
const SVGSpriter = require('../lib/svg-sprite.js');
const fixturesPath = require('./helpers/fixtures-path.js');

const isObject = obj => typeof obj === 'object' && !Array.isArray(obj) && obj !== null;

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

describe('shape', () => {
    expectations.forEach(expectation => {
        it(`should calculate the dimensions if the ${expectation.svg} does not contain viewBox or height/width properties (${expectation.result.width}x${expectation.result.height})`, done => {
            const spriter = new SVGSpriter({
                shape: {
                    dest: 'svg',
                    dimension: {
                        maxWidth: 4000,
                        maxHeight: 4000
                    }
                }
            });

            const svgFilePath = path.join(fixturesPath, `svg/special/without-dims/${expectation.svg}`);

            spriter.add(
                svgFilePath,
                expectation.svg,
                readFileSync(svgFilePath, 'utf-8')
            );

            spriter.compile((error, result) => {
                try {
                    assert.ifError(error);
                    assert.equal(isObject(result), true);
                    assert.notEqual(typeof result.shapes, 'undefined');
                    assert.equal(Array.isArray(result.shapes), true);

                    const svg = result.shapes[0]._contents.toString();
                    const dom = new DOMParser().parseFromString(svg, 'text/xml');

                    assert.equal(dom.documentElement.getAttribute('height'), expectation.result.height.toString());
                    assert.equal(dom.documentElement.getAttribute('width'), expectation.result.width.toString());

                    done();
                } catch (compilationError) {
                    done(compilationError);
                }
            });
        });
    });
});
