'use strict';

/* eslint-disable no-unused-expressions */
const path = require('path');
const should = require('should');
const glob = require('glob');
const SVGSpriter = require('../../../lib/svg-sprite.js');
const { addFixtureFiles, addRelativeFixtureFiles } = require('../../helpers/add-files.js');
const fixturesPath = require('../../helpers/fixtures-path.js');

const cwdWeather = path.join(fixturesPath, 'svg/single');
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
        it('has an empty result', done => {
            spriter.compile((error, result, data) => {
                should(error).not.ok;
                should(result).be.an.Object;
                should(result).be.empty;
                should(data).be.an.Object;
                should(data).be.empty;
                done();
            });
        });
    });

    describe(`with ${weather.length} SVG files`, () => {
        it(`returns ${weather.length} optimized shapes`, done => {
            addFixtureFiles(spriter, weather, cwdWeather);
            spriter.compile((error, result, data) => {
                should(error).not.ok;
                should(result).be.an.Object;
                should(result).have.property('shapes');
                should(result.shapes).be.an.Array;
                should(result.shapes).have.lengthOf(weather.length);
                should(data).be.an.Object;
                should(data).be.empty;
                done();
            });
        });
    });

    describe(`with ${weather.length} SVG files with relative paths`, () => {
        it(`returns ${weather.length} optimized shapes`, done => {
            addRelativeFixtureFiles(spriter, weather, cwdWeather);
            spriter.compile((error, result, data) => {
                should(error).not.ok;
                should(result).be.an.Object;
                should(result).have.property('shapes');
                should(result.shapes).be.an.Array;
                should(result.shapes).have.lengthOf(weather.length);
                should(data).be.an.Object;
                should(data).be.empty;
                done();
            });
        });
    });
});
