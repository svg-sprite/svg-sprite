'use strict';

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/svg-sprite/svg-sprite
 *
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2018 Joschi Kuphal
 * @license MIT https://github.com/svg-sprite/svg-sprite/blob/master/LICENSE
 */

// TODO fix/work around these
/* eslint-disable no-unused-expressions, max-nested-callbacks */

const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const svg2png = require('svg2png');
const should = require('should');
const rimraf = require('rimraf');
const glob = require('glob');
const Vinyl = require('vinyl');
const _ = require('lodash');
const looksSame = require('looks-same');
const mustache = require('mustache');
const phantomjs = require('phantomjs-prebuilt').path;
const sass = require('sass');
const less = require('less');
const stylus = require('stylus');
const SVGSpriter = require('../lib/svg-sprite');

const capturePhantomScript = path.resolve(__dirname, 'script/capture.phantom.js');
const cwdWeather = path.join(__dirname, 'fixture/svg/single');
const cwdAlign = path.join(__dirname, 'fixture/svg/css');
const dest = path.join(__dirname, '../tmp');

// This is so that we can fix tests on Node.js > 10 since the Array.sort algorithm changed
const isNodeGreaterThan10 = process.version.split('.')[0].slice(1) > 10;
const readFileP = promisify(fs.readFile);
const writeFileP = promisify(fs.writeFile);

/**
 * Add a bunch of SVG files
 *
 * @param {SVGSpriter} spriter        Spriter instance
 * @param {Array} files               SVG files
 * @param {String} cwd                Working directory
 */
function addFixtureFiles(spriter, files, cwd) {
    files.forEach(file => {
        spriter.add(
            path.resolve(path.join(cwd, file)),
            file,
            fs.readFileSync(path.join(cwd, file), { encoding: 'utf-8' })
        );
    });
}

/**
 * Recursively write files to disc
 *
 * @param {Object} files              Files
 * @return {Number}                   Number of written files
 */
function writeFiles(files) {
    let written = 0;
    for (const key in files) {
        const file = files[key];

        if (_.isObject(file)) {
            if (Vinyl.isVinyl(file)) {
                fs.mkdirSync(path.dirname(file.path), { recursive: true });
                fs.writeFileSync(file.path, file.contents);
                ++written;
            } else {
                written += writeFiles(file);
            }
        }
    }

    return written;
}

/**
 * Prepare and output a file and create directories as necessary
 *
 * @param {String} file               File
 * @param {String} content            Content
 * @return {String}                   File
 */
function writeFile(file, content) {
    try {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, content);
        return file;
    } catch {
        return null;
    }
}

/**
 * Capture a screenshot of a URL using PhantomJS (synchronous)
 *
 * @param {String} src                Source file
 * @param {String} target             Screenshot file
 * @param {Function} cb               Function
 */
function capturePhantom(src, target, cb) {
    execFile(phantomjs, [capturePhantomScript, src, target], (err, stdout, stderr) => {
        if (err) {
            cb(err);
        } else if (stdout.length > 0) {
            cb(stdout.toString().trim() === 'success' ? null : new Error(`PhantomJS couldn't capture "${src}"`));
        } else if (stderr.length > 0) {
            cb(new Error(stderr.toString().trim()));
        } else {
            cb(new Error(`PhantomJS couldn't capture "${src}"`));
        }
    });
}

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
function compareSvg2Png(svg, png, expected, diff, done, msg) {
    fs.mkdirSync(path.dirname(png), { recursive: true });

    const ecb = function(err) {
        console.log(err);
        should(err).not.ok;
        done();
    };

    readFileP(svg)
        .then(svg2png)
        .then(buffer => {
            writeFileP(png, buffer)
                .then(() => {
                    looksSame(png, expected, (err, result) => {
                        should(err).not.ok;
                        should.ok(result.equal, msg + JSON.stringify(result.diffClusters) + png);
                        done();
                    });
                    looksSame.createDiff({
                        reference: expected,
                        current: png,
                        diff,
                        highlightColor: '#ff00ff'
                    }, () => {});
                })
                .catch(ecb);
        })
        .catch(ecb);
}

before(done => {
    rimraf(path.join(__dirname, '../tmp'), () => {
        done();
    });
});

describe('svg-sprite', () => {
    const weather = glob.sync('**/weather*.svg', { cwd: cwdWeather });
    const align = glob.sync('**/*.svg', { cwd: cwdAlign });
    const previewTemplate = fs.readFileSync(path.join(__dirname, 'tmpl/css.html'), 'utf-8');

    describe('with no arguments', () => {
        const spriter = new SVGSpriter({
            shape: {
                dest: 'svg'
            }
        });

        describe('with no SVG files', () => {
            it('has an empty result', done => {
                spriter.compile((error, result, data) => {
                    should(error).not.ok;
                    should(result).be.an.Object;
                    should(result).be.empty;
                    should(data).be.an.Object;
                    should(data).be.empty;
                    done();
                });
            });
        });

        describe(`with ${weather.length} SVG files`, () => {
            it(`returns ${weather.length} optimized shapes`, done => {
                addFixtureFiles(spriter, weather, cwdWeather);
                spriter.compile((error, result, data) => {
                    should(error).not.ok;
                    should(result).be.an.Object;
                    should(result).have.property('shapes');
                    should(result.shapes).be.an.Array;
                    should(result.shapes).have.lengthOf(weather.length);
                    should(data).be.an.Object;
                    should(data).be.empty;
                    done();
                });
            });
        });
    });

    // Test the minimum configuration
    describe(`with minimum configuration and ${weather.length} SVG files`, () => {
        let spriter = null;
        let data = null;
        const svg = {};

        // Test the CSS mode
        describe('in «css» mode and all render types enabled', () => {
            it('creates 5 files for vertical layout', done => {
                spriter = new SVGSpriter({
                    dest
                });
                addFixtureFiles(spriter, weather, cwdWeather);
                spriter.compile({
                    css: {
                        sprite: 'svg/css.vertical.svg',
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
                            sprite: 'svg/css.horizontal.svg',
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
                            sprite: 'svg/css.diagonal.svg',
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
                            sprite: 'svg/css.packed.svg',
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
                        path.join(__dirname, '../tmp/css/svg', svg.vertical),
                        path.join(__dirname, '../tmp/css/png/css.vertical.png'),
                        path.join(__dirname, 'expected/png/css.vertical.png'),
                        path.join(__dirname, '../tmp/css/png/css.vertical.diff.png'),
                        done,
                        'The vertical sprite doesn\'t match the expected one!'
                    );
                });

                // Horizontal layout
                it('horizontal layout', done => {
                    compareSvg2Png(
                        path.join(__dirname, '../tmp/css/svg', svg.horizontal),
                        path.join(__dirname, '../tmp/css/png/css.horizontal.png'),
                        path.join(__dirname, 'expected/png/css.horizontal.png'),
                        path.join(__dirname, '../tmp/css/png/css.horizontal.diff.png'),
                        done,
                        'The horizontal sprite doesn\'t match the expected one!'
                    );
                });

                // Diagonal layout
                it('diagonal layout', done => {
                    compareSvg2Png(
                        path.join(__dirname, '../tmp/css/svg', svg.diagonal),
                        path.join(__dirname, '../tmp/css/png/css.diagonal.png'),
                        path.join(__dirname, 'expected/png/css.diagonal.png'),
                        path.join(__dirname, '../tmp/css/png/css.diagonal.diff.png'),
                        done,
                        'The diagonal sprite doesn\'t match the expected one!'
                    );
                });

                // Packed layout
                it('packed layout', done => {
                    compareSvg2Png(
                        path.join(__dirname, '../tmp/css/svg', svg.packed),
                        path.join(__dirname, '../tmp/css/png/css.packed.png'),
                        path.join(__dirname, 'expected/png', isNodeGreaterThan10 ? 'css.packed.12.png' : 'css.packed.png'),
                        path.join(__dirname, '../tmp/css/png/css.packed.diff.png'),
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
                    const preview = writeFile(path.join(__dirname, '../tmp/css/html/css.html'), out);
                    const previewImage = path.join(__dirname, '../tmp/css/png/css.html.png');
                    preview.should.be.ok;

                    capturePhantom(preview, previewImage, error => {
                        should(error).not.ok;
                        looksSame(previewImage, path.join(__dirname, 'expected/png/css.html.png'), (error, result) => {
                            should(error).not.ok;
                            should.ok(result.equal, 'The generated CSS preview doesn\'t match the expected one!');
                            done();
                        });
                    });
                });

                // Sass
                it('Sass format', done => {
                    sass.render({ file: path.join(__dirname, '../tmp/css/sprite.scss') }, (err, scssText) => {
                        should(err).not.ok;
                        should(writeFile(path.join(__dirname, '../tmp/css/sprite.scss.css'), scssText.css)).be.ok;

                        data.css = '../sprite.scss.css';

                        const out = mustache.render(previewTemplate, data);
                        const preview = writeFile(path.join(__dirname, '../tmp/css/html/scss.html'), out);
                        const previewImage = path.join(__dirname, '../tmp/css/png/scss.html.png');

                        preview.should.be.ok;

                        capturePhantom(preview, previewImage, error => {
                            should(error).not.ok;
                            looksSame(previewImage, path.join(__dirname, 'expected/png/css.html.png'), (error, result) => {
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
                    const lessFile = path.join(__dirname, '../tmp/css/sprite.less');

                    fs.readFile(lessFile, 'utf-8', (err, lessText) => {
                        should(err).not.ok;

                        less.render(lessText, {}, (error, output) => {
                            should(error).not.ok;
                            should(writeFile(path.join(__dirname, '../tmp/css/sprite.less.css'), output.css)).be.ok;

                            data.css = '../sprite.less.css';

                            const out = mustache.render(previewTemplate, data);
                            const preview = writeFile(path.join(__dirname, '../tmp/css/html/less.html'), out);
                            const previewImage = path.join(__dirname, '../tmp/css/png/less.html.png');

                            preview.should.be.ok;

                            capturePhantom(preview, previewImage, error => {
                                should(error).not.ok;
                                looksSame(previewImage, path.join(__dirname, 'expected/png/css.html.png'), (error, result) => {
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
                    const stylusFile = path.join(__dirname, '../tmp/css/sprite.styl');

                    fs.readFile(stylusFile, 'utf-8', (err, stylusText) => {
                        should(err).not.ok;

                        stylus.render(stylusText, {}, (error, output) => {
                            should(error).not.ok;
                            should(writeFile(path.join(__dirname, '../tmp/css/sprite.styl.css'), output)).be.ok;

                            data.css = '../sprite.styl.css';

                            const out = mustache.render(previewTemplate, data);
                            const preview = writeFile(path.join(__dirname, '../tmp/css/html/styl.html'), out);
                            const previewImage = path.join(__dirname, '../tmp/css/png/styl.html.png');

                            preview.should.be.ok;

                            capturePhantom(preview, previewImage, error => {
                                should(error).not.ok;
                                looksSame(previewImage, path.join(__dirname, 'expected/png/css.html.png'), (error, result) => {
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
                        sprite: 'svg/view.packed.svg',
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
                        path.join(__dirname, '../tmp/view/svg', svg.packed),
                        path.join(__dirname, '../tmp/view/png/view.packed.png'),
                        path.join(__dirname, 'expected/png', isNodeGreaterThan10 ? 'css.packed.12.png' : 'css.packed.png'),
                        path.join(__dirname, '../tmp/view/png/view.packed.diff.png'),
                        done,
                        'The packed sprite doesn\'t match the expected one!'
                    );
                });
            });

            // Cannot be tested at the moment as PhantomJS 1.9 doesn't support fragment identifiers with SVG
            //describe('creates a visually correct stylesheet resource in', () => {
            //    it('CSS format', done => {
            //        data.css = '../sprite.css';
            //        const previewTemplate = fs.readFileSync(path.join(__dirname, 'tmpl/view.html'), 'utf-8');
            //        const out = mustache.render(previewTemplate, data);
            //        const preview = writeFile(path.join(__dirname, '../tmp/view/html/view.html'), out);
            //        const previewImage = path.join(__dirname, '../tmp/view/png/view.html.png');
            //        preview.should.be.ok;
            //
            //        capturePhantom(preview, previewImage, error => {
            //            should(error).not.ok;
            //            imageDiff({
            //                actualImage: previewImage,
            //                expectedImage: path.join(__dirname, 'expected/png/view.html.png'),
            //                diffImage: path.join(__dirname, '../tmp/view/png/view.html.diff.png')
            //            }, (error, imagesAreSame) => {
            //                should(error).not.ok;
            //                should.ok(imagesAreSame, 'The generated CSS preview doesn\'t match the expected one!');
            //                done();
            //            });
            //        });
            //    });
            //});
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
                    path.join(__dirname, '../tmp/css/svg', svg.vertical),
                    path.join(__dirname, '../tmp/css/png/css.vertical.centered.png'),
                    path.join(__dirname, 'expected/png/css.vertical.centered.png'),
                    path.join(__dirname, '../tmp/css/png/css.vertical.centered.diff.png'),
                    done,
                    'The vertical sprite doesn\'t match the expected one!'
                );
            });

            it('creates a visually correct stylesheet resource', done => {
                data.css = '../sprite.centered.css';

                const out = mustache.render(previewTemplate, data);
                const preview = writeFile(path.join(__dirname, '../tmp/css/html/css.vertical.centered.html'), out);
                const previewImage = path.join(__dirname, '../tmp/css/png/css.vertical.centered.html.png');

                preview.should.be.ok;

                capturePhantom(preview, previewImage, error => {
                    should(error).not.ok;
                    looksSame(previewImage, path.join(__dirname, 'expected/png/css.vertical.centered.html.png'), (error, result) => {
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
                    path.join(__dirname, '../tmp/css/svg', svg.horizontal),
                    path.join(__dirname, '../tmp/css/png/css.horizontal.centered.png'),
                    path.join(__dirname, 'expected/png/css.horizontal.centered.png'),
                    path.join(__dirname, '../tmp/css/png/css.horizontal.centered.diff.png'),
                    done,
                    'The horizontal sprite doesn\'t match the expected one!'
                );
            });

            it('creates a visually correct stylesheet resource', done => {
                sass.render({ file: path.join(__dirname, '../tmp/css/sprite.centered.scss') }, (err, scssText) => {
                    should(err).not.ok;
                    should(writeFile(path.join(__dirname, '../tmp/css/sprite.centered.scss.css'), scssText.css)).be.ok;

                    data.css = '../sprite.centered.scss.css';

                    const out = mustache.render(previewTemplate, data);
                    const preview = writeFile(path.join(__dirname, '../tmp/css/html/scss.horizontal.centered.html'), out);
                    const previewImage = path.join(__dirname, '../tmp/css/png/scss.horizontal.centered.html.png');

                    preview.should.be.ok;

                    capturePhantom(preview, previewImage, error => {
                        should(error).not.ok;
                        looksSame(previewImage, path.join(__dirname, 'expected/png/css.horizontal.centered.html.png'), (error, result) => {
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
                    path.join(__dirname, '../tmp/css/svg', svg.packed),
                    path.join(__dirname, '../tmp/css/png/css.packed.centered.png'),
                    path.join(__dirname, 'expected/png/css.packed.aligned.png'),
                    path.join(__dirname, '../tmp/css/png/css.packed.centered.diff.png'),
                    done,
                    'The packed sprite doesn\'t match the expected one!'
                );
            });

            it('creates a visually correct stylesheet resource', done => {
                const lessFile = path.join(__dirname, '../tmp/css/sprite.centered.less');

                fs.readFile(lessFile, 'utf-8', (err, lessText) => {
                    should(err).not.ok;

                    less.render(lessText, {}, (error, output) => {
                        should(error).not.ok;
                        should(writeFile(path.join(__dirname, '../tmp/css/sprite.centered.less.css'), output.css)).be.ok;

                        data.css = '../sprite.centered.less.css';

                        const out = mustache.render(previewTemplate, data);
                        const preview = writeFile(path.join(__dirname, '../tmp/css/html/less.packed.centered.html'), out);
                        const previewImage = path.join(__dirname, '../tmp/css/png/less.packed.centered.html.png');

                        preview.should.be.ok;

                        capturePhantom(preview, previewImage, error => {
                            should(error).not.ok;
                            looksSame(previewImage, path.join(__dirname, 'expected/png/css.packed.aligned.html.png'), (error, result) => {
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
                    path.join(__dirname, '../tmp/view/svg', svg.vertical),
                    path.join(__dirname, '../tmp/view/png/css.vertical.mixed.png'),
                    path.join(__dirname, 'expected/png/css.vertical.mixed.png'),
                    path.join(__dirname, '../tmp/view/png/css.vertical.mixed.diff.png'),
                    done,
                    'The vertical sprite doesn\'t match the expected one!'
                );
            });

            it('creates a visually correct stylesheet resource', done => {
                data.css = '../sprite.mixed.css';

                const out = mustache.render(previewTemplate, data);
                const preview = writeFile(path.join(__dirname, '../tmp/view/html/css.vertical.mixed.html'), out);
                const previewImage = path.join(__dirname, '../tmp/view/png/css.vertical.mixed.html.png');

                preview.should.be.ok;

                capturePhantom(preview, previewImage, error => {
                    should(error).not.ok;
                    looksSame(previewImage, path.join(__dirname, 'expected/png/css.vertical.mixed.html.png'), (error, result) => {
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
                    path.join(__dirname, '../tmp/view/svg', svg.horizontal),
                    path.join(__dirname, '../tmp/view/png/css.horizontal.mixed.png'),
                    path.join(__dirname, 'expected/png/css.horizontal.mixed.png'),
                    path.join(__dirname, '../tmp/view/png/css.horizontal.mixed.diff.png'),
                    done,
                    'The horizontal sprite doesn\'t match the expected one!'
                );
            });

            it('creates a visually correct stylesheet resource', done => {
                sass.render({ file: path.join(__dirname, '../tmp/view/sprite.mixed.scss') }, (err, scssText) => {
                    should(err).not.ok;
                    should(writeFile(path.join(__dirname, '../tmp/view/sprite.mixed.scss.css'), scssText.css)).be.ok;

                    data.css = '../sprite.mixed.scss.css';

                    const out = mustache.render(previewTemplate, data);
                    const preview = writeFile(path.join(__dirname, '../tmp/view/html/scss.horizontal.mixed.html'), out);
                    const previewImage = path.join(__dirname, '../tmp/view/png/scss.horizontal.mixed.html.png');

                    preview.should.be.ok;

                    capturePhantom(preview, previewImage, error => {
                        should(error).not.ok;
                        looksSame(previewImage, path.join(__dirname, 'expected/png/css.horizontal.mixed.html.png'), (error, result) => {
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
                    path.join(__dirname, '../tmp/view/svg', svg.packed),
                    path.join(__dirname, '../tmp/view/png/css.packed.mixed.png'),
                    path.join(__dirname, 'expected/png/css.packed.aligned.png'),
                    path.join(__dirname, '../tmp/view/png/css.packed.mixed.diff.png'),
                    done,
                    'The packed sprite doesn\'t match the expected one!'
                );
            });

            it('creates a visually correct stylesheet resource', done => {
                const lessFile = path.join(__dirname, '../tmp/view/sprite.mixed.less');

                fs.readFile(lessFile, 'utf-8', (err, lessText) => {
                    should(err).not.ok;

                    less.render(lessText, {}, (error, output) => {
                        should(error).not.ok;
                        should(writeFile(path.join(__dirname, '../tmp/view/sprite.mixed.less.css'), output.css)).be.ok;

                        data.css = '../sprite.mixed.less.css';

                        const out = mustache.render(previewTemplate, data);
                        const preview = writeFile(path.join(__dirname, '../tmp/view/html/less.packed.mixed.html'), out);
                        const previewImage = path.join(__dirname, '../tmp/view/png/less.packed.mixed.html.png');

                        preview.should.be.ok;

                        capturePhantom(preview, previewImage, error => {
                            should(error).not.ok;
                            looksSame(previewImage, path.join(__dirname, 'expected/png/css.packed.aligned.html.png'), (error, result) => {
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
