'use strict';

const { readFileSync } = require('fs');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');
const should = require('should');
const SVGSpriter = require('../lib/svg-sprite.js');

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
                /* eslint-disable no-unused-expressions */
                should(error).not.ok;
                should(result).be.an.Object;
                should(result).have.property('shapes');
                should(result.shapes).be.an.Array;
                /* eslint-enable no-unused-expressions */

                const svg = result.shapes[0]._contents.toString();
                const dom = new DOMParser().parseFromString(svg, 'text/xml');

                should(dom.documentElement.getAttribute('height')).equal('43');
                should(dom.documentElement.getAttribute('width')).equal('43');

                done();
            } catch (error) {
                done(error);
            }
        });
    });
});
