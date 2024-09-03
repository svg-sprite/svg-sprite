'use strict';

const path = require('node:path');
const { fdir } = require('fdir');
const { paths } = require('./constants.js');

const cwdWeather = path.join(paths.fixtures, 'svg/single');
const cwdWithoutDims = path.join(paths.fixtures, 'svg/special/without-dims');
const weather = new fdir().glob('**/weather*.svg').crawl(cwdWeather).sync();
const withoutDims = new fdir().glob('**/*.svg').crawl(cwdWithoutDims).sync();

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
