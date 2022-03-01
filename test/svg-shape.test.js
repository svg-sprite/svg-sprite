'use strict';

const assert = require('assert').strict;
const { Buffer } = require('buffer');
const path = require('path');
const fs = require('fs');
const File = require('vinyl');
const glob = require('glob');
const getShape = require('../lib/svg-sprite/shape.js');
const SVGSpriter = require('../lib/svg-sprite.js');

describe('testing SVGShape initialization', () => {
    let spriter;

    beforeEach(() => {
        spriter = new SVGSpriter({
            shape: {
                dest: 'svg'
            }
        });
    });

    it('should not throw an error on valid svg file with multiline attribute values 1', () => {
        assert.doesNotThrow(() => {
            getShape(new File({
                path: __dirname,
                contents: Buffer.from(`<svg viewBox="0 0 0 16
                                     16"></svg>`)
            }), spriter);
        }, Error);
    });

    it('should not throw an error on valid svg file with multiline attribute values 2', () => {
        assert.doesNotThrow(() => {
            getShape(new File({
                path: __dirname,
                contents: Buffer.from(`<svg fill="r
                                                            e
                                                            d"
                                                            viewBox="0 0 0 16
                                                                                                 16"></svg>`)
            }), spriter);
        }, Error);
    });

    it('should not throw an error on valid svg file with mutliple multilined attritbutes values', () => {
        assert.doesNotThrow(() => {
            getShape(new File({
                path: __dirname,
                contents: Buffer.from(`<svg fill="r
                                                            e
                                                            d"
                                                            viewBox="0
                                                            0
                                                            0
                                                            16
                                                            16"></svg>`)
            }), spriter);
        }, Error);
    });

    it('should throw an error on invalid file', () => {
        assert.throws(() => {
            getShape(new File({
                path: __dirname,
                contents: Buffer.from('<svg viewBox=></svg>')
            }), spriter);
        }, Error);
    });

    it('should throw an error on non-svg files', () => {
        assert.throws(() => {
            getShape(new File({
                path: __dirname,
                contents: Buffer.from('<div class="test">123</div>')
            }), spriter);
        }, Error);
    });

    it('should not throw an error on valid svg file with normal values', () => {
        assert.doesNotThrow(() => {
            getShape(new File({
                path: __dirname,
                contents: Buffer.from('<svg viewBox="0 0 0 16 16"></svg>')
            }), spriter);
        }, Error);
    });

    it('should not throw an error on actual valid svg files', () => {
        const cwdWeather = path.join(__dirname, 'fixture/svg/single');
        const weather = glob.sync('**/weather*.svg', { cwd: cwdWeather });

        weather.forEach(weatherFile => {
            const svgFileBuffer = fs.readFileSync(path.join(cwdWeather, weatherFile));
            assert.doesNotThrow(() => {
                getShape(new File({
                    path: __dirname,
                    contents: svgFileBuffer
                }), spriter);
            }, Error);
        });
    });
});
