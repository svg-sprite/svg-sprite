'use strict';

/* eslint-disable jest/no-done-callback */

const path = require('path');
const fs = require('fs');
const mustache = require('mustache');
const sass = require('sass');
const glob = require('glob');
const less = require('less');
const SVGSpriter = require('../../../lib/svg-sprite.js');
const { addFixtureFiles } = require('../../helpers/add-files.js');
const writeFiles = require('../../helpers/write-files.js');
const writeFile = require('../../helpers/write-file.js');
const removeTmpPath = require('../../helpers/remove-temp-path.js');

const { paths } = require('../../helpers/constants.js');

const cwdAlign = path.join(paths.fixtures, 'svg/css');
const align = glob.sync('**/*.svg', { cwd: cwdAlign });
const previewTemplate = fs.readFileSync(path.join(__dirname, '../../tmpl/css.html'), 'utf-8');

const tmpPath = path.join(paths.tmp, 'center');

describe(`svg-sprite: with centered alignment and ${align.length} SVG files`, () => {
    beforeAll(removeTmpPath.bind(null, tmpPath));

    describe('with «css» mode, vertical layout and CSS render type', () => {
        let spriter = null;
        let data = null;
        let svgPath = null;

        beforeAll(done => {
            spriter = new SVGSpriter({
                dest: tmpPath,
                shape: {
                    align: path.join(paths.fixtures, 'yaml/align.centered.yaml'),
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

        it('creates visually correct sprite', async() => {
            expect.hasAssertions();
            await expect(path.join(tmpPath, 'css/svg', svgPath)).toBeVisuallyEqual(
                path.join(tmpPath, 'css/png/css.vertical.centered.png'),
                path.join(paths.expectations, '/png/css.vertical.centered.png')
            );
        });

        it('creates a visually correct stylesheet resource', async() => {
            expect.hasAssertions();

            data.css = '../sprite.centered.css';

            const out = mustache.render(previewTemplate, data);
            const preview = writeFile(path.join(tmpPath, 'css/html/css.vertical.centered.html'), out);

            await expect(preview).toBeVisuallyCorrectAsHTML(path.join(paths.expectations, 'png/css.vertical.centered.html.png'));
        });
    });

    describe('with «css» mode, horizontal layout and Sass render type', () => {
        let spriter = null;
        let data = null;
        let svgPath = null;

        beforeAll(done => {
            spriter = new SVGSpriter({
                dest: tmpPath,
                shape: {
                    align: path.join(paths.fixtures, 'yaml/align.centered.yaml'),
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

        it('creates visually correct sprite', async() => {
            expect.hasAssertions();
            await expect(path.join(tmpPath, 'css/svg', svgPath)).toBeVisuallyEqual(
                path.join(tmpPath, 'css/png/css.horizontal.centered.png'),
                path.join(paths.expectations, '/png/css.horizontal.centered.png')
            );
        });

        it('creates a visually correct stylesheet resource', done => {
            expect.hasAssertions();

            sass.render({ file: path.join(tmpPath, 'css/sprite.centered.scss') }, async(err, scssText) => {
                expect(err).toBeNull();

                writeFile(path.join(tmpPath, 'css/sprite.centered.scss.css'), scssText.css);

                data.css = '../sprite.centered.scss.css';

                const out = mustache.render(previewTemplate, data);
                const preview = writeFile(path.join(tmpPath, 'css/html/scss.horizontal.centered.html'), out);

                await expect(preview).toBeVisuallyCorrectAsHTML(path.join(paths.expectations, '/png/css.horizontal.centered.html.png'));

                done();
            });
        });
    });

    describe('with «css» mode, packed layout and LESS render type', () => {
        let spriter = null;
        let data = null;
        let svgPath = null;

        beforeAll(done => {
            spriter = new SVGSpriter({
                dest: tmpPath,
                shape: {
                    align: path.join(paths.fixtures, 'yaml/align.centered.yaml'),
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

        it('creates visually correct sprite', async() => {
            expect.hasAssertions();
            await expect(
                path.join(tmpPath, 'css/svg', svgPath)).toBeVisuallyEqual(
                path.join(tmpPath, 'css/png/css.packed.centered.png'),
                path.join(paths.expectations, '/png/css.packed.aligned.png')
            );
        });

        it('creates a visually correct stylesheet resource', done => {
            expect.hasAssertions();

            const lessFile = path.join(tmpPath, 'css/sprite.centered.less');

            const lessText = fs.readFileSync(lessFile, 'utf-8');

            less.render(lessText, {}, async(error, output) => {
                expect(error).toBeNull();

                writeFile(path.join(tmpPath, 'css/sprite.centered.less.css'), output.css);

                data.css = '../sprite.centered.less.css';

                const out = mustache.render(previewTemplate, data);
                const preview = writeFile(path.join(tmpPath, 'css/html/less.packed.centered.html'), out);

                await expect(preview).toBeVisuallyCorrectAsHTML(path.join(paths.expectations, '/png/css.packed.aligned.html.png'));

                done();
            });
        });
    });
});
