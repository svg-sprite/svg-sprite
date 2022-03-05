'use strict';

/* eslint-disable no-unused-expressions, max-nested-callbacks */
const path = require('path');
const fs = require('fs');
const mustache = require('mustache');
const should = require('should');
const looksSame = require('looks-same');
const sass = require('sass');
const glob = require('glob');
const SVGSpriter = require('../../../lib/svg-sprite.js');
const fixturesPath = require('../../helpers/fixtures-path.js');
const { addFixtureFiles } = require('../../helpers/add-files.js');
const writeFiles = require('../../helpers/write-files.js');
const tmpPath = require('../../helpers/tmp-path.js');
const expectationsPath = require('../../helpers/expectations-path.js');
const writeFile = require('../../helpers/write-file.js');
const capturePuppeteer = require('../../helpers/capture-puppeteer.js');

const cwdAlign = path.join(fixturesPath, 'svg/css');
const align = glob.sync('**/*.svg', { cwd: cwdAlign });
const previewTemplate = fs.readFileSync(path.join(__dirname, '../../tmpl/css.html'), 'utf-8');

const compareSvg2Png = require('../../helpers/compare-svg-2-png.js');

describe(`svg-sprite: with mixed alignment and ${align.length} SVG files`, () => {
    describe('with «view» mode, vertical layout and CSS render type', () => {
        let spriter = null;
        let data = null;
        let svgPath = null;

        before(done => {
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
                    sprite: 'svg/view.vertical.mixed.svg',
                    layout: 'vertical',
                    dimensions: true,
                    render: {
                        css: {
                            dest: 'sprite.mixed.css'
                        }
                    }
                }
            }, (error, result, cssData) => {
                writeFiles(result);
                data = cssData.view;
                svgPath = path.basename(result.view.sprite.path);
                done();
            });
        });

        it('creates visually correct sprite', done => {
            compareSvg2Png(
                path.join(tmpPath, 'view/svg', svgPath),
                path.join(tmpPath, 'view/png/css.vertical.mixed.png'),
                path.join(expectationsPath, '/png/css.vertical.mixed.png'),
                path.join(tmpPath, 'view/png/css.vertical.mixed.diff.png'),
                done,
                'The vertical sprite doesn\'t match the expected one!'
            );
        });

        it('creates a visually correct stylesheet resource', done => {
            data.css = '../sprite.mixed.css';

            const out = mustache.render(previewTemplate, data);
            const preview = writeFile(path.join(tmpPath, 'view/html/css.vertical.mixed.html'), out);
            const previewImage = path.join(tmpPath, 'view/png/css.vertical.mixed.html.png');

            preview.should.be.ok;

            capturePuppeteer(preview, previewImage, error => {
                should(error).not.ok;
                looksSame(previewImage, path.join(expectationsPath, '/png/css.vertical.mixed.html.png'), (error, result) => {
                    should(error).not.ok;
                    should.ok(result.equal, 'The generated CSS preview doesn\'t match the expected one!');
                    done();
                });
            });
        });
    });

    describe('with «view» mode, horizontal layout and Sass render type', () => {
        let spriter = null;
        let data = null;
        let svgPath = null;
        before('creates 2 files', done => {
            spriter = new SVGSpriter({
                dest: tmpPath,
                shape: {
                    align: path.join(fixturesPath, 'yaml/align.mixed.yaml'),
                    dimension: {
                        maxWidth: 200,
                        maxHeight: 200
                    },
                    dest: 'shapes'
                },
                svg: {
                    namespaceIDs: true
                }
            });
            addFixtureFiles(spriter, align, cwdAlign);
            spriter.compile({
                view: {
                    sprite: 'svg/view.horizontal.mixed.svg',
                    layout: 'horizontal',
                    dimensions: true,
                    render: {
                        scss: {
                            dest: 'sprite.mixed.scss'
                        }
                    }
                }
            }, (error, result, cssData) => {
                writeFiles(result);
                data = cssData.view;
                svgPath = path.basename(result.view.sprite.path);
                done();
            });
        });

        it('creates visually correct sprite', done => {
            compareSvg2Png(
                path.join(tmpPath, 'view/svg', svgPath),
                path.join(tmpPath, 'view/png/css.horizontal.mixed.png'),
                path.join(expectationsPath, '/png/css.horizontal.mixed.png'),
                path.join(tmpPath, 'view/png/css.horizontal.mixed.diff.png'),
                done,
                'The horizontal sprite doesn\'t match the expected one!'
            );
        });

        it('creates a visually correct stylesheet resource', done => {
            sass.render({ file: path.join(tmpPath, 'view/sprite.mixed.scss') }, (err, scssText) => {
                should(err).not.ok;
                should(writeFile(path.join(tmpPath, 'view/sprite.mixed.scss.css'), scssText.css)).be.ok;

                data.css = '../sprite.mixed.scss.css';

                const out = mustache.render(previewTemplate, data);
                const preview = writeFile(path.join(tmpPath, 'view/html/scss.horizontal.mixed.html'), out);
                const previewImage = path.join(tmpPath, 'view/png/scss.horizontal.mixed.html.png');

                preview.should.be.ok;

                capturePuppeteer(preview, previewImage, error => {
                    should(error).not.ok;
                    looksSame(previewImage, path.join(expectationsPath, '/png/css.horizontal.mixed.html.png'), (error, result) => {
                        should(error).not.ok;
                        should.ok(result.equal, 'The generated Sass preview doesn\'t match the expected one!');
                        done();
                    });
                });
            });
        });
    });
});
