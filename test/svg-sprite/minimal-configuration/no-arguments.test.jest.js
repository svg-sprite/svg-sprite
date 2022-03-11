'use strict';

const path = require('path');
const glob = require('glob');
const SVGSpriter = require('../../../lib/svg-sprite.js');
const { addFixtureFiles, addRelativeFixtureFiles } = require('../../helpers/add-files.js');

const { paths } = require('../../helpers/constants.js');

const cwdWeather = path.join(paths.fixtures, 'svg/single');
const weather = glob.sync('**/weather*.svg', { cwd: cwdWeather });

describe('svg-sprite: with no arguments', () => {
    let spriter;

    beforeEach(() => {
        spriter = new SVGSpriter({
            shape: {
                dest: 'svg'
            }
        });
    });

    describe('with no SVG files', () => {
        // eslint-disable-next-line jest/no-done-callback
        it('has an empty result', done => {
            expect.assertions(7);
            spriter.compile((error, result, data) => {
                expect(error).toBeNull();
                expect(result).toBeInstanceOf(Object);
                expect(result).toHaveProperty('shapes');
                expect(result.shapes).toBeInstanceOf(Array);
                expect(result.shapes).toHaveLength(0);
                expect(data).toBeInstanceOf(Object);
                expect(data).toStrictEqual({});
                done();
            });
        });
    });

    describe(`with ${weather.length} SVG files`, () => {
        // eslint-disable-next-line jest/no-done-callback
        it(`returns ${weather.length} optimized shapes`, done => {
            expect.assertions(7);
            addFixtureFiles(spriter, weather, cwdWeather);
            spriter.compile((error, result, data) => {
                expect(error).toBeNull();
                expect(result).toBeInstanceOf(Object);
                expect(result).toHaveProperty('shapes');
                expect(result.shapes).toBeInstanceOf(Array);
                expect(result.shapes).toHaveLength(weather.length);
                expect(data).toBeInstanceOf(Object);
                expect(data).toStrictEqual({});
                done();
            });
        });
    });

    describe(`with ${weather.length} SVG files with relative paths`, () => {
        // eslint-disable-next-line jest/no-done-callback
        it(`returns ${weather.length} optimized shapes`, done => {
            addRelativeFixtureFiles(spriter, weather, cwdWeather);
            expect.assertions(7);
            spriter.compile((error, result, data) => {
                expect(error).toBeNull();
                expect(result).toBeInstanceOf(Object);
                expect(result).toHaveProperty('shapes');
                expect(result.shapes).toBeInstanceOf(Array);
                expect(result.shapes).toHaveLength(weather.length);
                expect(data).toBeInstanceOf(Object);
                expect(data).toStrictEqual({});
                done();
            });
        });
    });
});
