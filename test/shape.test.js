'use strict';

const assert = require('assert').strict;
const { readFileSync } = require('fs');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');
const SVGSpriter = require('../lib/svg-sprite.js');

const isObject = obj => typeof obj === 'object' && !Array.isArray(obj) && obj !== null;

describe('shape', () => {
    it('should calculate the dimensions if the svg does not contain viewBox or height/width properties', done => {
        const spriter = new SVGSpriter({
            shape: {
                dest: 'svg'
            }
        });

        const svgFilePath = path.join(__dirname, 'fixture/svg/weather-clear-dimension-calculation.svg');

        spriter.add(
            svgFilePath,
            'weather-clear-dimension-calculation.svg',
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

                assert.equal(dom.documentElement.getAttribute('height'), '43');
                assert.equal(dom.documentElement.getAttribute('width'), '43');

                done();
            } catch (error) {
                done(error);
            }
        });
    });
});
