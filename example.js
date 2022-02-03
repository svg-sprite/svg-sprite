'use strict';

const path = require('path');
const fs = require('fs');
const glob = require('glob');
const SVGSpriter = require('./lib/svg-sprite.js');

const cwd = path.join(__dirname, 'test/fixture/svg/single');
const dest = path.join(__dirname, 'tmp');
const files = glob.sync('**/weather*.svg', { cwd });

const svgoConfig = {
    multipass: true,
    plugins: [
        {
            name: 'preset-default',
            params: {
                overrides: {
                    removeUnknownsAndDefaults: {
                        keepRoleAttr: true
                    },
                    removeViewBox: false
                }
            }
        },
        'cleanupListOfValues',
        'convertStyleToAttrs',
        'sortAttrs',
        {
            name: 'removeAttrs',
            params: {
                attrs: [
                    'clip-rule',
                    'data-name'
                ]
            }
        }
    ]
};

const spriter = new SVGSpriter({
    dest,
    log: 'debug',
    svg: {
        doctypeDeclaration: false,
        xmlDeclaration: false
    },
    shape: {
        transform: [{
            svgo: svgoConfig
        }]
    }
});

/**
 * Add a bunch of SVG files
 *
 * @param {SVGSpriter} spriter          Spriter instance
 * @param {Array} files                 SVG files
 * @returns {SVGSpriter}                Spriter instance
 */
function addFixtureFiles(spriter, files) {
    for (const file of files) {
        spriter.add(
            path.resolve(path.join(cwd, file)),
            file,
            fs.readFileSync(path.join(cwd, file), 'utf8')
        );
    }

    return spriter;
}

addFixtureFiles(spriter, files).compile({
    css: {
        sprite: 'svg/sprite.vertical.svg',
        layout: 'vertical',
        dimensions: true,
        render: {
            css: true,
            scss: true
        }
    }
}, (error, result) => {
    for (const type of Object.values(result.css)) {
        fs.mkdirSync(path.dirname(type.path), { recursive: true });
        fs.writeFileSync(type.path, type.contents);
    }
});
