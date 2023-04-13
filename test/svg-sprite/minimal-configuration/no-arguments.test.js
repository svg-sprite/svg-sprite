'use strict';

const path = require('node:path');
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

    it('with no SVG files has an empty result', async () => {
        expect.assertions(6);

        const { result, data } = await spriter.compileAsync();

        expect(result).toBeInstanceOf(Object);
        expect(result).toHaveProperty('shapes');
        expect(result.shapes).toBeInstanceOf(Array);
        expect(result.shapes).toHaveLength(0);
        expect(data).toBeInstanceOf(Object);
        expect(data).toStrictEqual({});
    });

    it(`with ${weather.length} SVG files returns ${weather.length} optimized shapes`, async () => {
        expect.assertions(6);

        addFixtureFiles(spriter, weather, cwdWeather);
        const { result, data } = await spriter.compileAsync();

        expect(result).toBeInstanceOf(Object);
        expect(result).toHaveProperty('shapes');
        expect(result.shapes).toBeInstanceOf(Array);
        expect(result.shapes).toHaveLength(weather.length);
        expect(data).toBeInstanceOf(Object);
        expect(data).toStrictEqual({});
    });

    it(`with ${weather.length} SVG files with relative paths returns ${weather.length} optimized shapes`, async () => {
        expect.assertions(6);

        addRelativeFixtureFiles(spriter, weather, cwdWeather);

        const { result, data } = await spriter.compileAsync();

        expect(result).toBeInstanceOf(Object);
        expect(result).toHaveProperty('shapes');
        expect(result.shapes).toBeInstanceOf(Array);
        expect(result.shapes).toHaveLength(weather.length);
        expect(data).toBeInstanceOf(Object);
        expect(data).toStrictEqual({});
    });
});
