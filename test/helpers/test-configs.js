'use strict';

const path = require('node:path');
const glob = require('glob');
const { paths } = require('./constants.js');

const cwdWeather = path.join(paths.fixtures, 'svg/single');
const cwdWithoutDims = path.join(paths.fixtures, 'svg/special/without-dims');
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
