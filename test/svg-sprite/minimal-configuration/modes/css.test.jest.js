'use strict';

/* eslint-disable max-nested-callbacks */

const path = require('path');
const fs = require('fs');
const mustache = require('mustache');
const sass = require('sass');
const less = require('less');
const stylus = require('stylus/index');
const { constants: testConfigs } = require('../../../helpers/test-configs.js');
const SVGSpriter = require('../../../../lib/svg-sprite.js');
const { addFixtureFiles } = require('../../../helpers/add-files.js');
const writeFiles = require('../../../helpers/write-files.js');

const removeTmpPath = require('../../../helpers/remove-temp-path.js');
const { paths } = require('../../../helpers/constants.js');
const writeFile = require('../../../helpers/write-file.js');

const previewTemplate = fs.readFileSync(path.join(__dirname, '../../../tmpl/css.html'), 'utf-8');

describe('testing minimal config', () => {
    let spriter;
    const svg = {};
    let data = {};

    beforeAll(removeTmpPath);

    beforeEach(() => {
        spriter = new SVGSpriter({
            dest: paths.tmp
        });
    });
    describe.each`
        name          | testConfigKey
        ${'default'}  | ${'DEFAULT'}
        ${'w/o dims'} | ${'WITHOUT_DIMS'}
    `('$name: with minimum configuration', ({ testConfigKey }) => {
        const testConfig = testConfigs[testConfigKey];

        // eslint-disable-next-line jest/no-done-callback
        beforeAll(done => {
            spriter = new SVGSpriter({
                dest: paths.tmp
            });
            addFixtureFiles(spriter, testConfig.files, testConfig.cwd);
            spriter.compile({
                css: {
                    sprite: `svg/css.vertical${testConfig.namespace}.svg`,
                    layout: 'vertical',
                    dimensions: true,
                    render: {
                        css: true,
                        scss: true,
                        less: true,
                        styl: true
                    }
                }
            }, async(error, result, cssData) => {
                writeFiles(result);
                data = cssData.css;
                svg.vertical = path.basename(result.css.sprite.path);

                const otherLayouts = ['horizontal', 'diagonal', 'packed'];

                const promises = otherLayouts.map(layout => {
                    return new Promise((resolve, reject) => {
                        spriter.compile({
                            css: {
                                sprite: `svg/css.${layout}${testConfig.namespace}.svg`,
                                layout
                            }
                        }, (err, result) => {
                            if (err) {
                                return reject(err);
                            }

                            writeFiles(result);
                            svg[layout] = path.basename(result.css.sprite.path);
                            resolve();
                        });
                    });
                });

                try {
                    await Promise.all(promises);
                    done();
                } catch (error_) {
                    done(error_);
                }
            });
        });

        // Test sprite renderings
        describe('creates visually correct sprite with', () => {
            // Vertical layout
            it('vertical layout', async() => {
                await expect(path.join(paths.tmp, 'css/svg', svg.vertical)).toBeVisuallyEqual(path.join(paths.tmp, `css/png/css.vertical${testConfig.namespace}.png`),
                    path.join(paths.expectations, `png/css.vertical${testConfig.namespace}.png`)
                );
            });

            // Horizontal layout
            it('horizontal layout', async() => {
                await expect(path.join(paths.tmp, 'css/svg', svg.horizontal)).toBeVisuallyEqual(path.join(paths.tmp, `css/png/css.horizontal${testConfig.namespace}.png`),
                    path.join(paths.expectations, `png/css.horizontal${testConfig.namespace}.png`)
                );
            });

            // Diagonal layout
            it('diagonal layout', async() => {
                await expect(path.join(paths.tmp, 'css/svg', svg.diagonal)).toBeVisuallyEqual(path.join(paths.tmp, `css/png/css.diagonal${testConfig.namespace}.png`), path.join(paths.expectations, `png/css.diagonal${testConfig.namespace}.png`));
            });

            // Packed layout
            it('packed layout', async() => {
                await expect(path.join(paths.tmp, 'css/svg', svg.packed)).toBeVisuallyEqual(path.join(paths.tmp, `css/png/css.packed${testConfig.namespace}.png`),
                    path.join(paths.expectations, `png/css.packed${testConfig.namespace}.png`)
                );
            });
        });

        // Test stylesheet resources
        describe('creates a visually correct stylesheet resource in', () => {
            // Plain CSS
            it('CSS format', async() => {
                data.css = '../sprite.css';
                const out = mustache.render(previewTemplate, data);
                const preview = writeFile(path.join(paths.tmp, 'css/html/css.html'), out);
                await expect(preview).toBeVisuallyCorrectAsHTML(path.join(paths.expectations, `png/css.html${testConfig.namespace}.png`));
            });

            // Sass
            it('Sass format', async() => {
                const scssText = sass.renderSync({ file: path.join(paths.tmp, 'css/sprite.scss') });
                writeFile(path.join(paths.tmp, 'css/sprite.scss.css'), scssText.css);

                data.css = '../sprite.scss.css';

                const out = mustache.render(previewTemplate, data);
                const preview = writeFile(path.join(paths.tmp, 'css/html/scss.html'), out);

                await expect(preview).toBeVisuallyCorrectAsHTML(path.join(paths.expectations, `png/css.html${testConfig.namespace}.png`));
            });

            // LESS
            it('LESS format', async() => {
                const lessFile = path.join(paths.tmp, 'css/sprite.less');

                const lessText = fs.readFileSync(lessFile, 'utf-8');

                await new Promise((resolve, reject) => {
                    less.render(lessText, {}, async(error, output) => {
                        if (error) {
                            return reject(error);
                        }

                        writeFile(path.join(paths.tmp, 'css/sprite.less.css'), output.css);

                        data.css = '../sprite.less.css';

                        const out = mustache.render(previewTemplate, data);
                        const preview = writeFile(path.join(paths.tmp, 'css/html/less.html'), out);
                        await expect(preview).toBeVisuallyCorrectAsHTML(path.join(paths.expectations, `png/css.html${testConfig.namespace}.png`));
                        resolve();
                    });
                });
            });

            // Stylus
            it('Stylus format', async() => {
                const stylusFile = path.join(paths.tmp, 'css/sprite.styl');

                const stylusText = fs.readFileSync(stylusFile, 'utf-8');

                await new Promise((resolve, reject) => {
                    stylus.render(stylusText, {}, async(error, output) => {
                        if (error) {
                            return reject(error);
                        }

                        writeFile(path.join(paths.tmp, 'css/sprite.styl.css'), output);

                        data.css = '../sprite.styl.css';

                        const out = mustache.render(previewTemplate, data);
                        const preview = writeFile(path.join(paths.tmp, 'css/html/styl.html'), out);
                        await expect(preview).toBeVisuallyCorrectAsHTML(path.join(paths.expectations, `png/css.html${testConfig.namespace}.png`));
                        resolve();
                    });
                });
            });
        });
    });
});
