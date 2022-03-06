'use strict';

/* eslint-disable no-unused-expressions, max-nested-callbacks */
const path = require('path');
const fs = require('fs');
const mustache = require('mustache');
const should = require('should');
const looksSame = require('looks-same');
const sass = require('sass');
const glob = require('glob');
const less = require('less');
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

describe(`svg-sprite: with centered alignment and ${align.length} SVG files`, () => {
    describe('with «css» mode, vertical layout and CSS render type', () => {
        let spriter = null;
        let data = null;
        let svgPath = null;

        before('creates 2 files', done => {
            spriter = new SVGSpriter({
                dest: tmpPath,
                shape: {
                    align: path.join(fixturesPath, 'yaml/align.centered.yaml'),
                    dimension: {
                        maxWidth: 200,
                        maxHeight: 200
                    }
                }
            });
            addFixtureFiles(spriter, align, cwdAlign);
            spriter.compile({
                css: {
                    sprite: 'svg/css.vertical.centered.svg',
                    layout: 'vertical',
                    dimensions: true,
                    render: {
                        css: {
                            dest: 'sprite.centered.css'
                        }
                    }
                }
            }, (error, result, cssData) => {
                writeFiles(result);
                data = cssData.css;
                svgPath = path.basename(result.css.sprite.path);
                done();
            });
        });

        it('creates visually correct sprite', done => {
            compareSvg2Png(
                path.join(tmpPath, 'css/svg', svgPath),
                path.join(tmpPath, 'css/png/css.vertical.centered.png'),
                path.join(expectationsPath, '/png/css.vertical.centered.png'),
                path.join(tmpPath, 'css/png/css.vertical.centered.diff.png'),
                done,
                'The vertical sprite doesn\'t match the expected one!'
            );
        });

        it('creates a visually correct stylesheet resource', done => {
            data.css = '../sprite.centered.css';

            const out = mustache.render(previewTemplate, data);
            const preview = writeFile(path.join(tmpPath, 'css/html/css.vertical.centered.html'), out);
            const previewImage = path.join(tmpPath, 'css/png/css.vertical.centered.html.png');

            preview.should.be.ok;

            capturePuppeteer(preview, previewImage, error => {
                should(error).not.ok;
                looksSame(previewImage, path.join(expectationsPath, '/png/css.vertical.centered.html.png'), (error, result) => {
                    should(error).not.ok;
                    should.ok(result.equal, 'The generated CSS preview doesn\'t match the expected one!');
                    done();
                });
            });
        });
    });

    describe('with «css» mode, horizontal layout and Sass render type', () => {
        let spriter = null;
        let data = null;
        let svgPath = null;
        before(done => {
            spriter = new SVGSpriter({
                dest: tmpPath,
                shape: {
                    align: path.join(fixturesPath, 'yaml/align.centered.yaml'),
                    dimension: {
                        maxWidth: 200,
                        maxHeight: 200
                    }
                }
            });
            addFixtureFiles(spriter, align, cwdAlign);
            spriter.compile({
                css: {
                    sprite: 'svg/css.horizontal.centered.svg',
                    layout: 'horizontal',
                    dimensions: true,
                    render: {
                        scss: {
                            dest: 'sprite.centered.scss'
                        }
                    }
                }
            }, (error, result, cssData) => {
                data = cssData.css;
                writeFiles(result.css);
                svgPath = path.basename(result.css.sprite.path);
                done();
            });
        });

        it('creates visually correct sprite', done => {
            compareSvg2Png(
                path.join(tmpPath, 'css/svg', svgPath),
                path.join(tmpPath, 'css/png/css.horizontal.centered.png'),
                path.join(expectationsPath, '/png/css.horizontal.centered.png'),
                path.join(tmpPath, 'css/png/css.horizontal.centered.diff.png'),
                done,
                'The horizontal sprite doesn\'t match the expected one!'
            );
        });

        it('creates a visually correct stylesheet resource', done => {
            sass.render({ file: path.join(tmpPath, 'css/sprite.centered.scss') }, (err, scssText) => {
                should(err).not.ok;
                should(writeFile(path.join(tmpPath, 'css/sprite.centered.scss.css'), scssText.css)).be.ok;

                data.css = '../sprite.centered.scss.css';

                const out = mustache.render(previewTemplate, data);
                const preview = writeFile(path.join(tmpPath, 'css/html/scss.horizontal.centered.html'), out);
                const previewImage = path.join(tmpPath, 'css/png/scss.horizontal.centered.html.png');

                preview.should.be.ok;

                capturePuppeteer(preview, previewImage, error => {
                    should(error).not.ok;
                    looksSame(previewImage, path.join(expectationsPath, '/png/css.horizontal.centered.html.png'), (error, result) => {
                        should(error).not.ok;
                        should.ok(result.equal, 'The generated Sass preview doesn\'t match the expected one!');
                        done();
                    });
                });
            });
        });
    });

    describe('with «css» mode, packed layout and LESS render type', () => {
        let spriter = null;
        let data = null;
        let svgPath = null;
        before('creates 2 files', done => {
            spriter = new SVGSpriter({
                dest: tmpPath,
                shape: {
                    align: path.join(fixturesPath, 'yaml/align.centered.yaml'),
                    dimension: {
                        maxWidth: 200,
                        maxHeight: 200
                    }
                }
            });
            addFixtureFiles(spriter, align, cwdAlign);
            spriter.compile({
                css: {
                    sprite: 'svg/css.packed.centered.svg',
                    layout: 'packed',
                    dimensions: true,
                    render: {
                        less: {
                            dest: 'sprite.centered.less'
                        }
                    }
                }
            }, (error, result, cssData) => {
                writeFiles(result);
                data = cssData.css;
                svgPath = path.basename(result.css.sprite.path);
                done();
            });
        });

        it('creates visually correct sprite', done => {
            compareSvg2Png(
                path.join(tmpPath, 'css/svg', svgPath),
                path.join(tmpPath, 'css/png/css.packed.centered.png'),
                path.join(expectationsPath, '/png/css.packed.aligned.png'),
                path.join(tmpPath, 'css/png/css.packed.centered.diff.png'),
                done,
                'The packed sprite doesn\'t match the expected one!'
            );
        });

        it('creates a visually correct stylesheet resource', done => {
            const lessFile = path.join(tmpPath, 'css/sprite.centered.less');

            fs.readFile(lessFile, 'utf-8', (err, lessText) => {
                should(err).not.ok;

                less.render(lessText, {}, (error, output) => {
                    should(error).not.ok;
                    should(writeFile(path.join(tmpPath, 'css/sprite.centered.less.css'), output.css)).be.ok;

                    data.css = '../sprite.centered.less.css';

                    const out = mustache.render(previewTemplate, data);
                    const preview = writeFile(path.join(tmpPath, 'css/html/less.packed.centered.html'), out);
                    const previewImage = path.join(tmpPath, 'css/png/less.packed.centered.html.png');

                    preview.should.be.ok;

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
});
