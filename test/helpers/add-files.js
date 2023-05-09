'use strict';

const { readFile } = require('node:fs/promises');
const path = require('node:path');

/**
 * Add a bunch of SVG files
 *
 * @param {SVGSpriter} spriter        Spriter instance
 * @param {Array} files               SVG files
 * @param {string} cwd                Working directory
 * @param {boolean} resolvePaths      Whether to resolve the paths of SVG files
 */
async function addFixtureFilesBase(spriter, files, cwd, resolvePaths) {
  for (const file of files) {
    const filePath = path.join(cwd, file);
    spriter.add(
      resolvePaths ? path.resolve(filePath) : file,
      file,
      await readFile(filePath, 'utf8')
    );
  }
}

/**
 * Add a bunch of SVG files
 *
 * @param {SVGSpriter} spriter        Spriter instance
 * @param {Array} files               SVG files
 * @param {string} cwd                Working directory
 */
async function addFixtureFiles(spriter, files, cwd) {
  await addFixtureFilesBase(spriter, files, cwd, true);
}

/**
 * Add a bunch of SVG files with relative paths
 *
 * @param {SVGSpriter} spriter        Spriter instance
 * @param {Array} files               SVG files
 * @param {string} cwd                Working directory
 */
async function addRelativeFixtureFiles(spriter, files, cwd) {
  await addFixtureFilesBase(spriter, files, cwd, false);
}

module.exports = {
  addFixtureFiles,
  addRelativeFixtureFiles
};
