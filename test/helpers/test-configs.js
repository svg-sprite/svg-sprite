'use strict';

const path = require('node:path');
const { globSync } = require('glob');
const { paths } = require('./constants.js');

const cwdWeather = path.join(paths.fixtures, 'svg/single');
const cwdWithoutDims = path.join(paths.fixtures, 'svg/special/without-dims');
const weather = globSync('**/weather*.svg', { cwd: cwdWeather });
const withoutDims = globSync('**/*.svg', { cwd: cwdWithoutDims });

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
