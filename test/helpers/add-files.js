'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Add a bunch of SVG files
 *
 * @param {SVGSpriter} spriter        Spriter instance
 * @param {Array} files               SVG files
 * @param {string} cwd                Working directory
 * @param {boolean} resolvePaths      Whether to resolve the paths of SVG files
 */
function addFixtureFilesBase(spriter, files, cwd, resolvePaths) {
    for (const file of files) {
        spriter.add(
            resolvePaths ? path.resolve(path.join(cwd, file)) : file,
            file,
            fs.readFileSync(path.join(cwd, file), 'utf8')
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
function addFixtureFiles(spriter, files, cwd) {
    addFixtureFilesBase(spriter, files, cwd, true);
}

/**
 * Add a bunch of SVG files with relative paths
 *
 * @param {SVGSpriter} spriter        Spriter instance
 * @param {Array} files               SVG files
 * @param {string} cwd                Working directory
 */
function addRelativeFixtureFiles(spriter, files, cwd) {
    addFixtureFilesBase(spriter, files, cwd, false);
}

module.exports = {
    addFixtureFiles,
    addRelativeFixtureFiles
};
