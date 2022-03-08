'use strict';

const path = require('path');
const glob = require('glob');
const fixturesPath = require('./fixtures-path.js');

const cwdWeather = path.join(fixturesPath, 'svg/single');
const cwdWithoutDims = path.join(fixturesPath, 'svg/special/without-dims');
const weather = glob.sync('**/weather*.svg', { cwd: cwdWeather });
const withoutDims = glob.sync('**/*.svg', { cwd: cwdWithoutDims });

const constants = {
    DEFAULT: {
        name: 'weather',
        namespace: '',
        files: weather,
        cwd: cwdWeather
    },
    WITHOUT_DIMS: {
        name: 'without-dims',
        namespace: '-without-dims',
        files: withoutDims,
        cwd: cwdWithoutDims
    }

};

module.exports = [constants.DEFAULT, constants.WITHOUT_DIMS];
module.exports.constants = constants;
