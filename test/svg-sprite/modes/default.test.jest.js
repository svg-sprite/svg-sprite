'use strict';

/* eslint-disable jest/no-done-callback */

const path = require('path');
const glob = require('glob');
const SVGSpriter = require('../../../lib/svg-sprite.js');
const { addFixtureFiles, addRelativeFixtureFiles } = require('../../helpers/add-files.js');

const cwdWeather = path.join(__dirname, '../../fixture/svg/single');

describe('with no arguments', () => {
    const weather = glob.sync('**/weather*.svg', { cwd: cwdWeather });
    let spriter;

    beforeEach(() => {
        spriter = new SVGSpriter({
            shape: {
                dest: 'svg'
            }
        });
    });

    describe('with no SVG files', () => {
        it('has an empty result', done => {
            spriter.compile((error, result, data) => {
                expect(error).toBeNull();
                expect(result).toStrictEqual(expect.any(Object));
                expect(data).toStrictEqual({});
                done();
            });
        });
    });

    describe(`with ${weather.length} SVG files`, () => {
        it(`returns ${weather.length} optimized shapes`, done => {
            addFixtureFiles(spriter, weather, cwdWeather);
            spriter.compile((error, result, data) => {
                expect(error).toBeNull();
                expect(result).toBeDefined();
                expect(result).toHaveProperty('shapes');
                expect(result.shapes).toBeInstanceOf(Array);
                expect(result.shapes).toHaveLength(weather.length);
                expect(data).toStrictEqual({});
                done();
            });
        });
    });

    describe(`with ${weather.length} SVG files with relative paths`, () => {
        it(`returns ${weather.length} optimized shapes`, done => {
            addRelativeFixtureFiles(spriter, weather, cwdWeather);
            spriter.compile((error, result, data) => {
                expect(error).toBeNull();
                expect(result).toBeDefined();
                expect(result).toHaveProperty('shapes');
                expect(result.shapes).toBeInstanceOf(Array);
                expect(result.shapes).toHaveLength(weather.length);
                expect(data).toStrictEqual({});
                done();
            });
        });
    });
});
