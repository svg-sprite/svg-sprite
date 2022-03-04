'use strict';

/* eslint-disable no-unused-expressions, max-nested-callbacks */
const path = require('path');
const fs = require('fs');
const should = require('should');
const mustache = require('mustache');
const looksSame = require('looks-same');
const glob = require('glob');
const less = require('less');
const SVGSpriter = require('../../../../lib/svg-sprite.js');
const { addFixtureFiles } = require('../../../helpers/add-files.js');
const writeFiles = require('../../../helpers/write-files.js');
const tmpPath = require('../../../helpers/tmp-path.js');
const expectationsPath = require('../../../helpers/expectations-path.js');
const writeFile = require('../../../helpers/write-file.js');
const capturePuppeteer = require('../../../helpers/capture-puppeteer.js');
const fixturesPath = require('../../../helpers/fixtures-path.js');
const compareSvg2PngHelper = require('../../../helpers/compare-svg-2-png.js');

/**
 * Rasterize an SVG file and compare it to an expected image
 *
 * @param {String} svg                SVG file path
 * @param {String} png                PNG file path
 * @param {String} expected           Expected PNG file path
 * @param {String} diff               Diff file path
 * @param {Function} done             Callback
 * @param {String} msg                Message
 */
async function compareSvg2Png(svg, png, expected, diff, done, msg) {
    try {
        await compareSvg2PngHelper(svg, png, expected, diff, (error, result) => {
            should(result).ok;
            should(error).not.ok;
            should.ok(result.equal, msg + JSON.stringify(result.diffClusters) + png);
            done();
        });
    } catch (error) {
        console.error(error);
        should(error).not.ok;
        done();
    }
}

describe('with «view» mode, packed layout and LESS render type', () => {
    let spriter;
    const cwdAlign = path.join(fixturesPath, 'svg/css');
    const align = glob.sync('**/*.svg', { cwd: cwdAlign });
    const previewTemplate = fs.readFileSync(path.join(__dirname, '../../../tmpl/css.html'), 'utf-8');
    let packedSvg;
    let data = {};

    before('creates 2 files', done => {
        spriter = new SVGSpriter({
            dest: tmpPath,
            shape: {
                align: path.join(fixturesPath, 'yaml/align.mixed.yaml'),
                dimension: {
                    maxWidth: 200,
                    maxHeight: 200
                }
            }
        });
        addFixtureFiles(spriter, align, cwdAlign);
        spriter.compile({
            view: {
                sprite: 'svg/view.packed.mixed.svg',
                layout: 'packed',
                dimensions: true,
                render: {
                    less: {
                        dest: 'sprite.mixed.less'
                    }
                }
            }
        }, (error, result, cssData) => {
            writeFiles(result);
            data = cssData.view;
            packedSvg = path.basename(result.view.sprite.path);
            done();
        });
    });

    it('creates visually correct sprite', done => {
        compareSvg2Png(
            path.join(tmpPath, 'view/svg', packedSvg),
            path.join(tmpPath, 'view/png/css.packed.mixed.png'),
            path.join(expectationsPath, '/png/css.packed.aligned.png'),
            path.join(tmpPath, 'view/png/css.packed.mixed.diff.png'),
            done,
            'The packed sprite doesn\'t match the expected one!'
        );
    });

    it('creates a visually correct stylesheet resource', done => {
        const lessFile = path.join(tmpPath, 'view/sprite.mixed.less');

        fs.readFile(lessFile, 'utf-8', (err, lessText) => {
            should(err).not.ok;

            less.render(lessText, {}, (error, output) => {
                should(error).not.ok;
                should(writeFile(path.join(tmpPath, 'view/sprite.mixed.less.css'), output.css)).be.ok;

                data.css = '../sprite.mixed.less.css';

                const out = mustache.render(previewTemplate, data);
                const preview = writeFile(path.join(tmpPath, 'view/html/less.packed.mixed.html'), out);
                const previewImage = path.join(tmpPath, 'view/png/less.packed.mixed.html.png');

                should(preview).be.ok;

                capturePuppeteer(preview, previewImage, error => {
                    should(error).not.ok;
                    looksSame(previewImage, path.join(expectationsPath, '/png/css.packed.aligned.html.png'), (error, result) => {
                        should(error).not.ok;
                        should.ok(result.equal, 'The generated LESS preview doesn\'t match the expected one!');
                        done();
                    });
                });
            });
        });
    });
});
