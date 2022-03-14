'use strict';

/* eslint-disable no-unused-expressions */
const path = require('path');
const should = require('should');
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
        it('has an empty result', async() => {
            const { result, data } = await spriter.compileAsync();

            should(result).be.an.Object;
            should(result).be.empty;
            should(data).be.an.Object;
            should(data).be.empty;
        });
    });

    describe(`with ${weather.length} SVG files`, () => {
        it(`returns ${weather.length} optimized shapes`, async() => {
            addFixtureFiles(spriter, weather, cwdWeather);
            const { result, data } = await spriter.compileAsync();

            should(result).be.an.Object;
            should(result).have.property('shapes');
            should(result.shapes).be.an.Array;
            should(result.shapes).have.lengthOf(weather.length);
            should(data).be.an.Object;
            should(data).be.empty;
        });
    });

    describe(`with ${weather.length} SVG files with relative paths`, () => {
        it(`returns ${weather.length} optimized shapes`, async() => {
            addRelativeFixtureFiles(spriter, weather, cwdWeather);
            const { result, data } = await spriter.compileAsync();

            should(result).be.an.Object;
            should(result).have.property('shapes');
            should(result.shapes).be.an.Array;
            should(result.shapes).have.lengthOf(weather.length);
            should(data).be.an.Object;
            should(data).be.empty;
        });
    });
});
