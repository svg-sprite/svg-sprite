'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * Add a bunch of SVG files
 *
 * @param {SVGSpriter} spriter      Spriter instance
 * @param {Array}      files        SVG files
 * @param {string}     cwd          Working directory
 * @param {boolean}    resolvePaths Whether to resolve the paths of SVG files
 */
function addFixtureFilesBase(spriter, files, cwd, resolvePaths) {
  for (const file of files) {
    const filePath = path.join(cwd, file);
    spriter.add(
      resolvePaths ? path.resolve(filePath) : file,
      file,
      fs.readFileSync(filePath, 'utf8')
    );
  }
}

/**
 * Add a bunch of SVG files
 *
 * @param {SVGSpriter} spriter Spriter instance
 * @param {Array}      files   SVG files
 * @param {string}     cwd     Working directory
 */
function addFixtureFiles(spriter, files, cwd) {
  addFixtureFilesBase(spriter, files, cwd, true);
}

/**
 * Add a bunch of SVG files with relative paths
 *
 * @param {SVGSpriter} spriter Spriter instance
 * @param {Array}      files   SVG files
 * @param {string}     cwd     Working directory
 */
function addRelativeFixtureFiles(spriter, files, cwd) {
  addFixtureFilesBase(spriter, files, cwd, false);
}

module.exports = {
  addFixtureFiles,
  addRelativeFixtureFiles
};
