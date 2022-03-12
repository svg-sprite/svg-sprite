'use strict';

const path = require('path');
const fs = require('fs');
const mustache = require('mustache');
const sass = require('sass');
const { constants: testConfigs } = require('../../../helpers/test-configs.js');
const SVGSpriter = require('../../../../lib/svg-sprite.js');
const { addFixtureFiles } = require('../../../helpers/add-files.js');
const writeFiles = require('../../../helpers/write-files.js');

const removeTmpPath = require('../../../helpers/remove-temp-path.js');
const { paths } = require('../../../helpers/constants.js');
const writeFile = require('../../../helpers/write-file.js');

const asyncRenderers = require('../../../helpers/async-renderers.js');

const previewTemplate = fs.readFileSync(path.join(__dirname, '../../../tmpl/css.html'), 'utf-8');

const tmpPath = path.join(paths.tmp, 'css');

describe('testing minimal config', () => {
    let spriter;
    const svg = {};
    let data;

    beforeAll(removeTmpPath.bind(null, tmpPath));

    describe.each`
        name          | testConfigKey
        ${'default'}  | ${'DEFAULT'}
        ${'w/o dims'} | ${'WITHOUT_DIMS'}
    `('$name: with minimum configuration', ({ testConfigKey }) => {
        const testConfig = testConfigs[testConfigKey];

        beforeAll(async() => {
            data = {};
            spriter = new SVGSpriter({
                dest: tmpPath
            });
            addFixtureFiles(spriter, testConfig.files, testConfig.cwd);
            const { result, data: cssData } = await spriter.compileAsync({
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
            });

            writeFiles(result);
            data = cssData.css;
            svg.vertical = path.basename(result.css.sprite.path);

            const promises = ['horizontal', 'diagonal', 'packed'].map(layout => {
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

            await Promise.all(promises);
        });

        // Test sprite renderings
        describe('creates visually correct sprite with', () => {
            // Vertical layout
            it('vertical layout', async() => {
                expect.hasAssertions();
                await expect(path.join(tmpPath, 'css/svg', svg.vertical)).toBeVisuallyEqual(
                    path.join(paths.expectations, `png/css.vertical${testConfig.namespace}.png`)
                );
            });

            // Horizontal layout
            it('horizontal layout', async() => {
                expect.hasAssertions();
                await expect(path.join(tmpPath, 'css/svg', svg.horizontal)).toBeVisuallyEqual(
                    path.join(paths.expectations, `png/css.horizontal${testConfig.namespace}.png`)
                );
            });

            // Diagonal layout
            it('diagonal layout', async() => {
                expect.hasAssertions();
                await expect(path.join(tmpPath, 'css/svg', svg.diagonal)).toBeVisuallyEqual(
                    path.join(paths.expectations, `png/css.diagonal${testConfig.namespace}.png`)
                );
            });

            // Packed layout
            it('packed layout', async() => {
                expect.hasAssertions();
                await expect(path.join(tmpPath, 'css/svg', svg.packed)).toBeVisuallyEqual(
                    path.join(paths.expectations, `png/css.packed${testConfig.namespace}.png`)
                );
            });
        });

        // Test stylesheet resources
        describe('creates a visually correct stylesheet resource in', () => {
            // Plain CSS
            it('CSS format', async() => {
                expect.hasAssertions();

                data.css = '../sprite.css';
                const out = mustache.render(previewTemplate, data);
                const preview = writeFile(path.join(tmpPath, 'css/html/css.html'), out);

                await expect(preview).toBeVisuallyCorrectAsHTML(path.join(paths.expectations, `png/css.html${testConfig.namespace}.png`));
            });

            // Sass
            it('sass format', async() => {
                expect.hasAssertions();

                const scssText = sass.renderSync({ file: path.join(tmpPath, 'css/sprite.scss') });
                writeFile(path.join(tmpPath, 'css/sprite.scss.css'), scssText.css);

                data.css = '../sprite.scss.css';

                const out = mustache.render(previewTemplate, data);
                const preview = writeFile(path.join(tmpPath, 'css/html/scss.html'), out);

                await expect(preview).toBeVisuallyCorrectAsHTML(path.join(paths.expectations, `png/css.html${testConfig.namespace}.png`));
            });

            // LESS
            it('lESS format', async() => {
                expect.hasAssertions();

                const lessFile = path.join(tmpPath, 'css/sprite.less');
                const lessText = fs.readFileSync(lessFile, 'utf-8');

                const output = await asyncRenderers.less(lessText, {});
                writeFile(path.join(tmpPath, 'css/sprite.less.css'), output.css);

                data.css = '../sprite.less.css';

                const out = mustache.render(previewTemplate, data);
                const preview = writeFile(path.join(tmpPath, 'css/html/less.html'), out);

                await expect(preview).toBeVisuallyCorrectAsHTML(path.join(paths.expectations, `png/css.html${testConfig.namespace}.png`));
            });

            // Stylus
            it('stylus format', async() => {
                expect.hasAssertions();

                const stylusFile = path.join(tmpPath, 'css/sprite.styl');
                const stylusText = fs.readFileSync(stylusFile, 'utf-8');

                const output = await asyncRenderers.stylus(stylusText, {});

                writeFile(path.join(tmpPath, 'css/sprite.styl.css'), output);

                data.css = '../sprite.styl.css';

                const out = mustache.render(previewTemplate, data);
                const preview = writeFile(path.join(tmpPath, 'css/html/styl.html'), out);

                await expect(preview).toBeVisuallyCorrectAsHTML(path.join(paths.expectations, `png/css.html${testConfig.namespace}.png`));
            });
        });
    });
});
