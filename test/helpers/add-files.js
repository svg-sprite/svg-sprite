'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Add a bunch of SVG files
 *
 * @param {SVGSpriter} spriter        Spriter instance
 * @param {Array} files               SVG files
 * @param {String} cwd                Working directory
 * @param {Boolean} resolvePaths      Whether to resolve the paths of SVG files
 */
function addFixtureFilesBase(spriter, files, cwd, resolvePaths) {
    files.forEach(file => {
        spriter.add(
            resolvePaths ? path.resolve(path.join(cwd, file)) : file,
            file,
            fs.readFileSync(path.join(cwd, file), 'utf-8')
        );
    });
}

/**
 * Add a bunch of SVG files
 *
 * @param {SVGSpriter} spriter        Spriter instance
 * @param {Array} files               SVG files
 * @param {String} cwd                Working directory
 */
function addFixtureFiles(spriter, files, cwd) {
    return addFixtureFilesBase(spriter, files, cwd, true);
}

/**
 * Add a bunch of SVG files with relative paths
 *
 * @param {SVGSpriter} spriter        Spriter instance
 * @param {Array} files               SVG files
 * @param {String} cwd                Working directory
 */
function addRelativeFixtureFiles(spriter, files, cwd) {
    return addFixtureFilesBase(spriter, files, cwd, false);
}

module.exports = {
    addFixtureFiles,
    addRelativeFixtureFiles
};
