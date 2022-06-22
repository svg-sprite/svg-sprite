'use strict';

const path = require('path');
const fs = require('fs');
const mustache = require('mustache');
const sass = require('sass');
const glob = require('glob');
const SVGSpriter = require('../../../lib/svg-sprite.js');
const { addFixtureFiles } = require('../../helpers/add-files.js');
const writeFiles = require('../../helpers/write-files.js');
const writeFile = require('../../helpers/write-file.js');
const removeTmpPath = require('../../helpers/remove-temp-path.js');
const asyncRenderers = require('../../helpers/async-renderers.js');
const { paths } = require('../../helpers/constants.js');

const cwdAlign = path.join(paths.fixtures, 'svg/css');
const align = glob.sync('**/*.svg', { cwd: cwdAlign });
const previewTemplate = fs.readFileSync(path.join(__dirname, '../../tmpl/css.html'), 'utf8');

const tmpPath = path.join(paths.tmp, 'center');

describe(`svg-sprite: with centered alignment and ${align.length} SVG files`, () => {
    beforeAll(removeTmpPath.bind(null, tmpPath));

    describe('with «css» mode, vertical layout and CSS render type', () => {
        let spriter = null;
        let data = null;
        let svgPath = null;

        beforeAll(async() => {
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
            const { result, data: cssData } = await spriter.compileAsync({
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
            });
            writeFiles(result);
            data = cssData.css;
            svgPath = path.basename(result.css.sprite.path);
        });

        it('creates visually correct sprite', async() => {
            expect.hasAssertions();

            const input = path.join(tmpPath, 'css/svg', svgPath);
            const expected = path.join(paths.expectations, 'png/css.vertical.centered.png');

            expect(fs.readFileSync(input).toString()).toMatchSnapshot();
            await expect(input).toBeVisuallyEqualTo(expected);
        });

        it('creates a visually correct stylesheet resource', async() => {
            expect.hasAssertions();

            data.css = '../sprite.centered.css';

            const out = mustache.render(previewTemplate, data);
            const preview = await writeFile(path.join(tmpPath, 'css/html/css.vertical.centered.html'), out);

            const expected = path.join(paths.expectations, 'png/css.vertical.centered.html.png');

            await expect(preview).toBeVisuallyCorrectAsHTMLTo(expected);
        });
    });

    describe('with «css» mode, horizontal layout and Sass render type', () => {
        let spriter = null;
        let data = null;
        let svgPath = null;

        beforeAll(async() => {
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
            const { result, data: cssData } = await spriter.compileAsync({
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
            });
            data = cssData.css;
            writeFiles(result.css);
            svgPath = path.basename(result.css.sprite.path);
        });

        it('creates visually correct sprite', async() => {
            expect.hasAssertions();

            const input = path.join(tmpPath, 'css/svg', svgPath);
            const expected = path.join(paths.expectations, 'png/css.horizontal.centered.png');

            expect(fs.readFileSync(input).toString()).toMatchSnapshot();
            await expect(input).toBeVisuallyEqualTo(expected);
        });

        it('creates a visually correct stylesheet resource', async() => {
            expect.hasAssertions();

            const scssText = sass.renderSync({ file: path.join(tmpPath, 'css/sprite.centered.scss') });

            await writeFile(path.join(tmpPath, 'css/sprite.centered.scss.css'), scssText.css);

            data.css = '../sprite.centered.scss.css';

            const out = mustache.render(previewTemplate, data);
            const preview = await writeFile(path.join(tmpPath, 'css/html/scss.horizontal.centered.html'), out);
            const expected = path.join(paths.expectations, 'png/css.horizontal.centered.html.png');

            await expect(preview).toBeVisuallyCorrectAsHTMLTo(expected);
        });
    });

    describe('with «css» mode, packed layout and LESS render type', () => {
        let spriter = null;
        let data = null;
        let svgPath = null;

        beforeAll(async() => {
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
            const { result, data: cssData } = await spriter.compileAsync({
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
            });
            writeFiles(result);
            data = cssData.css;
            svgPath = path.basename(result.css.sprite.path);
        });

        it('creates visually correct sprite', async() => {
            expect.hasAssertions();

            const input = path.join(tmpPath, 'css/svg', svgPath);
            const expected = path.join(paths.expectations, 'png/css.packed.centered.png');

            expect(fs.readFileSync(input).toString()).toMatchSnapshot();
            await expect(input).toBeVisuallyEqualTo(expected);
        });

        it('creates a visually correct stylesheet resource', async() => {
            expect.hasAssertions();

            const lessFile = path.join(tmpPath, 'css/sprite.centered.less');
            const lessText = fs.readFileSync(lessFile, 'utf8');
            const output = await asyncRenderers.less(lessText, {});

            await writeFile(path.join(tmpPath, 'css/sprite.centered.less.css'), output.css);

            data.css = '../sprite.centered.less.css';

            const out = mustache.render(previewTemplate, data);
            const preview = await writeFile(path.join(tmpPath, 'css/html/less.packed.centered.html'), out);
            const expected = path.join(paths.expectations, 'png/css.packed.aligned.html.png');

            await expect(preview).toBeVisuallyCorrectAsHTMLTo(expected);
        });
    });
});
