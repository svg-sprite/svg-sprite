'use strict';

/* eslint-disable max-nested-callbacks */
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

const previewTemplate = fs.readFileSync(path.join(__dirname, '../../../tmpl/css.html'), 'utf8');

describe('testing minimal config', () => {
    let spriter;
    const svg = {};
    let data;

    describe.each`
        name          | testConfigKey
        ${'default'}  | ${'DEFAULT'}
        ${'w/o dims'} | ${'WITHOUT_DIMS'}
    `('$name: with minimum configuration', ({ testConfigKey }) => {
        const testConfig = testConfigs[testConfigKey];

        const tmpPath = path.join(paths.tmp, `css${testConfig.namespace}`);

        beforeAll(async() => {
            await removeTmpPath(tmpPath);
            data = {};
            spriter = new SVGSpriter({ dest: tmpPath });
            addFixtureFiles(spriter, testConfig.files, testConfig.cwd);
            const { result, data: cssData } = await spriter.compileAsync({
                css: {
                    sprite: `svg/css.vertical${testConfig.namespace}.svg`,
                    layout: 'vertical',
                    dimensions: true,
                    render: {
                        css: {
                            dest: `sprite${testConfig.namespace}.css`
                        },
                        scss: {
                            dest: `sprite${testConfig.namespace}.scss`
                        },
                        less: {
                            dest: `sprite${testConfig.namespace}.less`
                        },
                        styl: {
                            dest: `sprite${testConfig.namespace}.styl`
                        }
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
                    }, (error, result) => {
                        if (error) {
                            return reject(error);
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

                const input = path.join(tmpPath, 'css/svg', svg.vertical);
                const expected = path.join(paths.expectations, `png/css.vertical${testConfig.namespace}.png`);

                expect(fs.readFileSync(input).toString()).toMatchSnapshot();
                await expect(input).toBeVisuallyEqualTo(expected);
            });

            // Horizontal layout
            it('horizontal layout', async() => {
                expect.hasAssertions();

                const input = path.join(tmpPath, 'css/svg', svg.horizontal);
                const expected = path.join(paths.expectations, `png/css.horizontal${testConfig.namespace}.png`);

                expect(fs.readFileSync(input).toString()).toMatchSnapshot();
                await expect(input).toBeVisuallyEqualTo(expected);
            });

            // Diagonal layout
            it('diagonal layout', async() => {
                expect.hasAssertions();

                const input = path.join(tmpPath, 'css/svg', svg.diagonal);
                const expected = path.join(paths.expectations, `png/css.diagonal${testConfig.namespace}.png`);

                expect(fs.readFileSync(input).toString()).toMatchSnapshot();
                await expect(input).toBeVisuallyEqualTo(expected);
            });

            // Packed layout
            it('packed layout', async() => {
                expect.hasAssertions();

                const input = path.join(tmpPath, 'css/svg', svg.packed);
                const expected = path.join(paths.expectations, `png/css.packed${testConfig.namespace}.png`);

                expect(fs.readFileSync(input).toString()).toMatchSnapshot();
                await expect(input).toBeVisuallyEqualTo(expected);
            });
        });

        // Test stylesheet resources
        describe('creates a visually correct stylesheet resource in', () => {
            // Plain CSS
            it('CSS format', async() => {
                expect.hasAssertions();

                data.css = `../sprite${testConfig.namespace}.css`;

                const out = mustache.render(previewTemplate, data);
                const preview = await writeFile(path.join(tmpPath, `css/html/css${testConfig.namespace}.html`), out);
                const expected = path.join(paths.expectations, `png/css.html${testConfig.namespace}.png`);

                await expect(preview).toBeVisuallyCorrectAsHTMLTo(expected);
            });

            // Sass
            it('Sass format', async() => {
                expect.hasAssertions();

                const scssText = sass.renderSync({ file: path.join(tmpPath, `css/sprite${testConfig.namespace}.scss`) });
                await writeFile(path.join(tmpPath, `css/sprite${testConfig.namespace}.scss.css`), scssText.css);

                data.css = `../sprite${testConfig.namespace}.scss.css`;

                const out = mustache.render(previewTemplate, data);
                const preview = await writeFile(path.join(tmpPath, `css/html/scss${testConfig.namespace}.html`), out);
                const expected = path.join(paths.expectations, `png/css.html${testConfig.namespace}.png`);

                await expect(preview).toBeVisuallyCorrectAsHTMLTo(expected);
            });

            // LESS
            it('LESS format', async() => {
                expect.hasAssertions();

                const lessFile = path.join(tmpPath, `css/sprite${testConfig.namespace}.less`);
                const lessText = fs.readFileSync(lessFile, 'utf8');
                const output = await asyncRenderers.less(lessText, {});

                await writeFile(path.join(tmpPath, `css/sprite${testConfig.namespace}.less.css`), output.css);

                data.css = `../sprite${testConfig.namespace}.less.css`;

                const out = mustache.render(previewTemplate, data);
                const preview = await writeFile(path.join(tmpPath, `css/html/less${testConfig.namespace}.html`), out);
                const expected = path.join(paths.expectations, `png/css.html${testConfig.namespace}.png`);

                await expect(preview).toBeVisuallyCorrectAsHTMLTo(expected);
            });

            // Stylus
            it('Stylus format', async() => {
                expect.hasAssertions();

                const stylusFile = path.join(tmpPath, `css/sprite${testConfig.namespace}.styl`);
                const stylusText = fs.readFileSync(stylusFile, 'utf8');
                const output = await asyncRenderers.stylus(stylusText, {});

                await writeFile(path.join(tmpPath, `css/sprite${testConfig.namespace}.styl.css`), output);

                data.css = `../sprite${testConfig.namespace}.styl.css`;

                const out = mustache.render(previewTemplate, data);
                const preview = await writeFile(path.join(tmpPath, `css/html/styl${testConfig.namespace}.html`), out);
                const expected = path.join(paths.expectations, `png/css.html${testConfig.namespace}.png`);

                await expect(preview).toBeVisuallyCorrectAsHTMLTo(expected);
            });
        });
    });
});
