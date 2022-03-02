'use strict';

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/svg-sprite/svg-sprite
 *
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2018 Joschi Kuphal
 * @license MIT https://github.com/svg-sprite/svg-sprite/blob/main/LICENSE
 */

// TODO fix/work around these
/* eslint-disable no-unused-expressions, max-nested-callbacks */

const fs = require('fs');
const path = require('path');
const should = require('should');
const rimraf = require('rimraf');
const glob = require('glob');
const looksSame = require('looks-same');
const mustache = require('mustache');
const sass = require('sass');
const less = require('less');
const stylus = require('stylus');
const SVGSpriter = require('../lib/svg-sprite.js');

const compareSvg2PngHelper = require('./helpers/compare-svg-2-png.js');
const capturePuppeteer = require('./helpers/capture-puppeteer.js');
const writeFiles = require('./helpers/write-files.js');
const writeFile = require('./helpers/write-file.js');
const { addFixtureFiles } = require('./helpers/add-files.js');
const testConfigs = require('./helpers/test-configs.js');

const cwdAlign = path.join(__dirname, 'fixture/svg/css');
const tmpPath = require('./helpers/tmp-path.js');
const expectationsPath = require('./helpers/expectations-path.js');

const dest = tmpPath;

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

before(done => {
    rimraf(path.join(__dirname, '../tmp'), () => {
        done();
    });
});

describe('svg-sprite', () => {
    const align = glob.sync('**/*.svg', { cwd: cwdAlign });
    const previewTemplate = fs.readFileSync(path.join(__dirname, 'tmpl/css.html'), 'utf-8');

    // Test the minimum configuration
    [testConfigs.DEFAULT, testConfigs.WITHOUT_DIMS].forEach(testConfig => {
        describe(`${testConfig.name}: with minimum configuration and ${testConfig.files.length} SVG files`, () => {
            let spriter = null;
            let data = null;
            const svg = {};

            // Test the CSS mode
            describe('in «css» mode and all render types enabled', () => {
                it('creates 5 files for vertical layout', done => {
                    spriter = new SVGSpriter({
                        dest
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
                    }, (error, result, cssData) => {
                        result.css.should.be.an.Object;
                        writeFiles(result).should.be.exactly(5);
                        data = cssData.css;
                        svg.vertical = path.basename(result.css.sprite.path);
                        done();
                    });
                });

                describe('then rerun with all render types disabled', () => {
                    it('creates 1 additional file for horizontal layout', done => {
                        spriter.compile({
                            css: {
                                sprite: `svg/css.horizontal${testConfig.namespace}.svg`,
                                layout: 'horizontal'
                            }
                        }, (error, result) => {
                            result.css.should.be.an.Object;
                            writeFiles(result).should.be.exactly(1);
                            svg.horizontal = path.basename(result.css.sprite.path);
                            done();
                        });
                    });

                    it('creates 1 additional file for diagonal layout', done => {
                        spriter.compile({
                            css: {
                                sprite: `svg/css.diagonal${testConfig.namespace}.svg`,
                                layout: 'diagonal'
                            }
                        }, (error, result) => {
                            result.css.should.be.an.Object;
                            writeFiles(result).should.be.exactly(1);
                            svg.diagonal = path.basename(result.css.sprite.path);
                            done();
                        });
                    });

                    it('creates 1 additional file for packed layout', done => {
                        spriter.compile({
                            css: {
                                sprite: `svg/css.packed${testConfig.namespace}.svg`,
                                layout: 'packed'
                            }
                        }, (error, result) => {
                            result.css.should.be.an.Object;
                            writeFiles(result).should.be.exactly(1);
                            svg.packed = path.basename(result.css.sprite.path);
                            done();
                        });
                    });
                });

                // Test sprite renderings
                describe('creates visually correct sprite with', () => {
                    // Vertical layout
                    it('vertical layout', done => {
                        compareSvg2Png(
                            path.join(tmpPath, 'css/svg', svg.vertical),
                            path.join(tmpPath, `css/png/css.vertical${testConfig.namespace}.png`),
                            path.join(expectationsPath, `png/css.vertical${testConfig.namespace}.png`),
                            path.join(tmpPath, `css/png/css.vertical${testConfig.namespace}.diff.png`),
                            done,
                            'The vertical sprite doesn\'t match the expected one!'
                        );
                    });

                    // Horizontal layout
                    it('horizontal layout', done => {
                        compareSvg2Png(
                            path.join(tmpPath, 'css/svg', svg.horizontal),
                            path.join(tmpPath, `css/png/css.horizontal${testConfig.namespace}.png`),
                            path.join(expectationsPath, `png/css.horizontal${testConfig.namespace}.png`),
                            path.join(tmpPath, `css/png/css.horizontal${testConfig.namespace}.diff.png`),
                            done,
                            'The horizontal sprite doesn\'t match the expected one!'
                        );
                    });

                    // Diagonal layout
                    it('diagonal layout', done => {
                        compareSvg2Png(
                            path.join(tmpPath, 'css/svg', svg.diagonal),
                            path.join(tmpPath, `css/png/css.diagonal${testConfig.namespace}.png`),
                            path.join(expectationsPath, `png/css.diagonal${testConfig.namespace}.png`),
                            path.join(tmpPath, `css/png/css.diagonal${testConfig.namespace}.diff.png`),
                            done,
                            'The diagonal sprite doesn\'t match the expected one!'
                        );
                    });

                    // Packed layout
                    it('packed layout', done => {
                        compareSvg2Png(
                            path.join(tmpPath, 'css/svg', svg.packed),
                            path.join(tmpPath, `css/png/css.packed${testConfig.namespace}.png`),
                            path.join(expectationsPath, `png/css.packed${testConfig.namespace}.png`),
                            path.join(tmpPath, `css/png/css.packed${testConfig.namespace}.diff.png`),
                            done,
                            'The packed sprite doesn\'t match the expected one!'
                        );
                    });
                });

                // Test stylesheet resources
                describe('creates a visually correct stylesheet resource in', () => {
                    // Plain CSS
                    it('CSS format', done => {
                        data.css = '../sprite.css';
                        const out = mustache.render(previewTemplate, data);
                        const preview = writeFile(path.join(tmpPath, 'css/html/css.html'), out);
                        const previewImage = path.join(tmpPath, `css/png/css.html${testConfig.namespace}.png`);
                        preview.should.be.ok;

                        capturePuppeteer(preview, previewImage, error => {
                            should(error).not.ok;
                            looksSame(previewImage, path.join(expectationsPath, `png/css.html${testConfig.namespace}.png`), (error, result) => {
                                should(error).not.ok;
                                should.ok(result.equal, 'The generated CSS preview doesn\'t match the expected one!');
                                done();
                            });
                        });
                    });

                    // Sass
                    it('Sass format', done => {
                        sass.render({ file: path.join(tmpPath, 'css/sprite.scss') }, (err, scssText) => {
                            should(err).not.ok;
                            should(writeFile(path.join(tmpPath, 'css/sprite.scss.css'), scssText.css)).be.ok;

                            data.css = '../sprite.scss.css';

                            const out = mustache.render(previewTemplate, data);
                            const preview = writeFile(path.join(tmpPath, 'css/html/scss.html'), out);
                            const previewImage = path.join(tmpPath, `css/png/scss.html${testConfig.namespace}.png`);

                            preview.should.be.ok;

                            capturePuppeteer(preview, previewImage, error => {
                                should(error).not.ok;
                                looksSame(previewImage, path.join(expectationsPath, `png/css.html${testConfig.namespace}.png`), (error, result) => {
                                    should(error).not.ok;
                                    should.ok(result.equal, 'The generated Sass preview doesn\'t match the expected one!');
                                    done();
                                });
                            });
                        }
                        );
                    });

                    // LESS
                    it('LESS format', done => {
                        const lessFile = path.join(tmpPath, 'css/sprite.less');

                        fs.readFile(lessFile, 'utf-8', (err, lessText) => {
                            should(err).not.ok;

                            less.render(lessText, {}, (error, output) => {
                                should(error).not.ok;
                                should(writeFile(path.join(tmpPath, 'css/sprite.less.css'), output.css)).be.ok;

                                data.css = '../sprite.less.css';

                                const out = mustache.render(previewTemplate, data);
                                const preview = writeFile(path.join(tmpPath, 'css/html/less.html'), out);
                                const previewImage = path.join(tmpPath, 'css/png/less.html.png');

                                preview.should.be.ok;

                                capturePuppeteer(preview, previewImage, error => {
                                    should(error).not.ok;
                                    looksSame(previewImage, path.join(expectationsPath, `png/css.html${testConfig.namespace}.png`), (error, result) => {
                                        should(error).not.ok;
                                        should.ok(result.equal, 'The generated LESS preview doesn\'t match the expected one!');
                                        done();
                                    });
                                });
                            });
                        });
                    });

                    // Stylus
                    it('Stylus format', done => {
                        const stylusFile = path.join(tmpPath, 'css/sprite.styl');

                        fs.readFile(stylusFile, 'utf-8', (err, stylusText) => {
                            should(err).not.ok;

                            stylus.render(stylusText, {}, (error, output) => {
                                should(error).not.ok;
                                should(writeFile(path.join(tmpPath, 'css/sprite.styl.css'), output)).be.ok;

                                data.css = '../sprite.styl.css';

                                const out = mustache.render(previewTemplate, data);
                                const preview = writeFile(path.join(tmpPath, 'css/html/styl.html'), out);
                                const previewImage = path.join(tmpPath, `css/png/styl${testConfig.namespace}.html.png`);

                                preview.should.be.ok;

                                capturePuppeteer(preview, previewImage, error => {
                                    should(error).not.ok;
                                    looksSame(previewImage, path.join(expectationsPath, `png/css.html${testConfig.namespace}.png`), (error, result) => {
                                        should(error).not.ok;
                                        should.ok(result.equal, 'The generated Stylus preview doesn\'t match the expected one!');
                                        done();
                                    });
                                });
                            });
                        });
                    });
                });
            });

            // Test the view mode
            describe('in «view» mode', () => {
                it('creates 2 files for packed layout', done => {
                    spriter.compile({
                        view: {
                            sprite: `svg/view.packed${testConfig.namespace}.svg`,
                            layout: 'packed',
                            dimensions: '-dims',
                            render: {
                                css: true
                            }
                        }
                    }, (error, result, cssData) => {
                        result.view.should.be.an.Object;
                        writeFiles(result).should.be.exactly(2);
                        data = cssData.view;
                        svg.packed = path.basename(result.view.sprite.path);
                        done();
                    });
                });

                describe('creates visually correct sprite with', () => {
                    // Packed layout
                    it('packed layout', done => {
                        compareSvg2Png(
                            path.join(tmpPath, 'view/svg', svg.packed),
                            path.join(tmpPath, `view/png/view.packed${testConfig.namespace}.png`),
                            path.join(expectationsPath, `png/css.packed${testConfig.namespace}.png`),
                            path.join(tmpPath, `view/png/view.packed${testConfig.namespace}.diff.png`),
                            done,
                            'The packed sprite doesn\'t match the expected one!'
                        );
                    });
                });

                describe('creates a visually correct stylesheet resource in', () => {
                    it('CSS format', done => {
                        data.css = '../sprite.css';
                        const previewTemplate = fs.readFileSync(path.join(__dirname, 'tmpl/view.html'), 'utf-8');
                        const out = mustache.render(previewTemplate, data);
                        const preview = writeFile(path.join(tmpPath, 'view/html/view.html'), out);
                        const previewImage = path.join(tmpPath, `view/png/view.html${testConfig.namespace}.png`);
                        preview.should.be.ok;

                        capturePuppeteer(preview, previewImage, error => {
                            should(error).not.ok;
                            looksSame(
                                previewImage,
                                path.join(expectationsPath, `png/view.html${testConfig.namespace}.png`)
                                , (error, result) => {
                                    should(error).not.ok;
                                    should.ok(result.equal, 'The generated CSS preview doesn\'t match the expected one!');
                                    done();
                                });
                        });
                    });
                });
            });

            // Test the symbol mode
            describe('in «symbol» mode', () => {
                it('creates 2 files for packed layout', done => {
                    spriter = new SVGSpriter({
                        dest
                    });
                    addFixtureFiles(spriter, testConfig.files, testConfig.cwd);
                    spriter.compile({
                        symbol: {
                            sprite: `svg/symbol${testConfig.namespace}.svg`,
                            render: {
                                css: true
                            }
                        }
                    }, (error, result, cssData) => {
                        result.symbol.should.be.an.Object;
                        writeFiles(result).should.be.exactly(2);
                        data = cssData.symbol;
                        svg.symbol = path.basename(result.symbol.sprite.path);
                        done();
                    });
                });

                describe('creates a visually correct stylesheet resource in', () => {
                    it('CSS format', done => {
                        data.svg = fs.readFileSync(path.join(tmpPath, 'symbol/svg', svg.symbol)).toString();
                        data.css = '../sprite.css';
                        const previewTemplate = fs.readFileSync(path.join(__dirname, 'tmpl/symbol.html'), 'utf-8');
                        const out = mustache.render(previewTemplate, data);
                        const preview = writeFile(path.join(tmpPath, 'symbol/html/symbol.html'), out);
                        const previewImage = path.join(tmpPath, `symbol/symbol.html${testConfig.namespace}.png`);
                        preview.should.be.ok;

                        capturePuppeteer(preview, previewImage, error => {
                            should(error).not.ok;
                            if (error) {
                                return done(error);
                            }

                            looksSame(
                                previewImage,
                                path.join(expectationsPath, `png/symbol.html${testConfig.namespace}.png`)
                                , (error, result) => {
                                    should(error).not.ok;
                                    should.ok(result.equal, 'The generated CSS preview doesn\'t match the expected one!');
                                    done();
                                });
                        });
                    });
                });
            });
        });
    });

    describe(`with centered alignment and ${align.length} SVG files`, () => {
        let spriter = null;
        let data = null;
        const svg = {};

        describe('with «css» mode, vertical layout and CSS render type', () => {
            it('creates 2 files', done => {
                spriter = new SVGSpriter({
                    dest,
                    shape: {
                        align: path.join(__dirname, 'fixture/yaml/align.centered.yaml'),
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
                    result.css.should.be.an.Object;
                    writeFiles(result).should.be.exactly(2);
                    data = cssData.css;
                    svg.vertical = path.basename(result.css.sprite.path);
                    done();
                });
            });

            it('creates visually correct sprite', done => {
                compareSvg2Png(
                    path.join(tmpPath, 'css/svg', svg.vertical),
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
            it('creates 2 files', done => {
                spriter = new SVGSpriter({
                    dest,
                    shape: {
                        align: path.join(__dirname, 'fixture/yaml/align.centered.yaml'),
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
                    result.css.should.be.an.Object;
                    writeFiles(result).should.be.exactly(2);
                    data = cssData.css;
                    svg.horizontal = path.basename(result.css.sprite.path);
                    done();
                });
            });

            it('creates visually correct sprite', done => {
                compareSvg2Png(
                    path.join(tmpPath, 'css/svg', svg.horizontal),
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
                }
                );
            });
        });

        describe('with «css» mode, packed layout and LESS render type', () => {
            it('creates 2 files', done => {
                spriter = new SVGSpriter({
                    dest,
                    shape: {
                        align: path.join(__dirname, 'fixture/yaml/align.centered.yaml'),
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
                    result.css.should.be.an.Object;
                    writeFiles(result).should.be.exactly(2);
                    data = cssData.css;
                    svg.packed = path.basename(result.css.sprite.path);
                    done();
                });
            });

            it('creates visually correct sprite', done => {
                compareSvg2Png(
                    path.join(tmpPath, 'css/svg', svg.packed),
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

    describe(`with mixed alignment and ${align.length} SVG files`, () => {
        let spriter = null;
        let data = null;
        const svg = {};

        describe('with «view» mode, vertical layout and CSS render type', () => {
            it('creates 2 files', done => {
                spriter = new SVGSpriter({
                    dest,
                    shape: {
                        align: path.join(__dirname, 'fixture/yaml/align.mixed.yaml'),
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
                    result.view.should.be.an.Object;
                    writeFiles(result).should.be.exactly(2);
                    data = cssData.view;
                    svg.vertical = path.basename(result.view.sprite.path);
                    done();
                });
            });

            it('creates visually correct sprite', done => {
                compareSvg2Png(
                    path.join(tmpPath, 'view/svg', svg.vertical),
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
            it('creates 2 files', done => {
                spriter = new SVGSpriter({
                    dest,
                    shape: {
                        align: path.join(__dirname, 'fixture/yaml/align.mixed.yaml'),
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
                    result.view.should.be.an.Object;
                    writeFiles(result).should.be.exactly(8);
                    data = cssData.view;
                    svg.horizontal = path.basename(result.view.sprite.path);
                    done();
                });
            });

            it('creates visually correct sprite', done => {
                compareSvg2Png(
                    path.join(tmpPath, 'view/svg', svg.horizontal),
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
                }
                );
            });
        });

        describe('with «view» mode, packed layout and LESS render type', () => {
            it('creates 2 files', done => {
                spriter = new SVGSpriter({
                    dest,
                    shape: {
                        align: path.join(__dirname, 'fixture/yaml/align.mixed.yaml'),
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
                    result.view.should.be.an.Object;
                    writeFiles(result).should.be.exactly(2);
                    data = cssData.view;
                    svg.packed = path.basename(result.view.sprite.path);
                    done();
                });
            });

            it('creates visually correct sprite', done => {
                compareSvg2Png(
                    path.join(tmpPath, 'view/svg', svg.packed),
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
});
