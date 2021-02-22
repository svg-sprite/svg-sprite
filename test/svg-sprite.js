'use strict';

/* jshint -W117 */
/* jshint -W030 */

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/jkphl/svg-sprite
 *
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2018 Joschi Kuphal
 * @license MIT https://raw.github.com/jkphl/svg-sprite/master/LICENSE.txt
 */

var fs = require('pn/fs'); // https://www.npmjs.com/package/pn
var svg2png = require('svg2png');
var should = require('should'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    rimraf = require('rimraf'),
    glob = require('glob'),
    File = require('vinyl'),
    _ = require('lodash'),
    imageDiff = require('image-diff'),
    mustache = require('mustache'),
    execFile = require('child_process').execFile,
    phantomjs = require('phantomjs-prebuilt').path,
    capturePhantomScript = path.resolve(__dirname, 'script/capture.phantom.js'),
    sass = require('node-sass'),
    less = require('less'),
    stylus = require('stylus'),
    SVGSpriter = require('../lib/svg-sprite');

var cwdWeather = path.join(__dirname, 'fixture', 'svg', 'single'),
    cwdAlign = path.join(__dirname, 'fixture', 'svg', 'css'),
    dest = path.normalize(path.join(__dirname, '..', 'tmp'));

// This is so that we can fix tests on Node.js > 10 since the Array.sort algorithm changed
var isNodeGreaterThan10 = process.version.split('.')[0].slice(1) > 10;

/**
 * Add a bunch of SVG files
 *
 * @param {SVGSpriter} spriter        Spriter instance
 * @param {Array} files                SVG files
 * @param {String} cwd                Working directory
 */
function addFixtureFiles(spriter, files, cwd) {
    files.forEach(function (file) {
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
 * @param {Object} files            Files
 * @return {Number}                    Number of written files
 */
function writeFiles(files) {
    var written = 0;
    for (var key in files) {
        if (_.isObject(files[key])) {
            if (files[key].constructor === File) {
                mkdirp.sync(path.dirname(files[key].path));
                fs.writeFileSync(files[key].path, files[key].contents);
                ++written;
            } else {
                written += writeFiles(files[key]);
            }
        }
    }
    return written;
}

/**
 * Prepare and output a file and create directories as necessary
 *
 * @param {String} file                File
 * @param {String} content            Content
 * @return {String}                    File
 */
function writeFile(file, content) {
    try {
        mkdirp.sync(path.dirname(file));
        fs.writeFileSync(file, content);
        return file;
    } catch (e) {
        return null;
    }
}

/**
 * Capture a screenshot of a URL using PhantomJS (synchronous)
 *
 * @param {String} src                Source file
 * @param {String} target            Screenshot file
 * @param {Function} cb                Function
 */
function capturePhantom(src, target, cb) {
    execFile(phantomjs, [capturePhantomScript, src, target], function (err, stdout, stderr) {
        if (err) {
            cb(err);
        } else if (stdout.length > 0) {
            cb((stdout.toString().trim() === 'success') ? null : new Error('PhantomJS couldn\'t capture "' + src + '"'));
        } else if (stderr.length > 0) {
            cb(new Error(stderr.toString().trim()));
        } else {
            cb(new Error('PhantomJS couldn\'t capture "' + src + '"'));
        }
    });
}

/**
 * Rasterize an SVG file and compare it to an expected image
 *
 * @param {String} svg                SVG file path
 * @param {String} png                PNG file path
 * @param {String} expected            Expected PNG file path
 * @param {String} diff                Diff file path
 * @param {Function} done            Callback
 * @param {String} msg              Message
 */
function compareSvg2Png(svg, png, expected, diff, done, msg) {
    mkdirp.sync(path.dirname(png));
    var ecb = function (err) {
        console.log(err);
        should(err).not.ok;
        done();
    };
    fs.readFile(svg)
        .then(svg2png)
        .then(function (buffer) {
            fs.writeFile(png, buffer)
                .then(function () {
                    imageDiff({
                        actualImage: png,
                        expectedImage: expected,
                        diffImage: diff
                    }, function (err, imagesAreSame) {
                        should(err).not.ok;
                        should.ok(imagesAreSame, msg);
                        done();
                    });
                })
                .catch(ecb);
        })
        .catch(ecb);
}

before(function (done) {
    rimraf(path.normalize(path.join(__dirname, '..', 'tmp')), function (/* error */) {
        done();
    });
});

describe('svg-sprite', function () {
    var weather = glob.glob.sync('**/weather*.svg', { cwd: cwdWeather }),
        align = glob.glob.sync('**/*.svg', { cwd: cwdAlign }),
        previewTemplate = fs.readFileSync(path.join(__dirname, 'tmpl', 'css.html'), 'utf-8');

    describe('with no arguments', function () {
        var spriter = new SVGSpriter({
            shape: {
                dest: 'svg'
            }
        });

        describe('with no SVG files', function () {

            it('has an empty result', function (done) {
                spriter.compile(function (error, result, data) {
                    should(error).not.ok;
                    should(result).be.an.Object;
                    should(result).be.empty;
                    should(data).be.an.Object;
                    should(data).be.empty;
                    done();
                });
            });
        });

        describe('with ' + weather.length + ' SVG files', function () {

            it('returns ' + weather.length + ' optimized shapes', function (done) {
                this.timeout(20000);

                addFixtureFiles(spriter, weather, cwdWeather);
                spriter.compile(function (error, result, data) {
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
    describe('with minimum configuration and ' + weather.length + ' SVG files', function () {
        var spriter = null,
            data = null,
            svg = {};

        // Test the CSS mode
        describe('in «css» mode and all render types enabled', function () {

            it('creates 5 files for vertical layout', function (done) {
                this.timeout(20000);

                spriter = new SVGSpriter({
                    dest: dest
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
                }, function (error, result, cssData) {
                    result.css.should.be.an.Object;
                    writeFiles(result).should.be.exactly(5);
                    data = cssData.css;
                    svg.vertical = path.basename(result.css.sprite.path);
                    done();
                });
            });

            describe('then rerun with all render types disabled', function () {

                it('creates 1 additional file for horizontal layout', function (done) {
                    this.timeout(20000);

                    spriter.compile({
                        css: {
                            sprite: 'svg/css.horizontal.svg',
                            layout: 'horizontal'
                        }
                    }, function (error, result) {
                        result.css.should.be.an.Object;
                        writeFiles(result).should.be.exactly(1);
                        svg.horizontal = path.basename(result.css.sprite.path);
                        done();
                    });
                });

                it('creates 1 additional file for diagonal layout', function (done) {
                    this.timeout(20000);

                    spriter.compile({
                        css: {
                            sprite: 'svg/css.diagonal.svg',
                            layout: 'diagonal'
                        }
                    }, function (error, result) {
                        result.css.should.be.an.Object;
                        writeFiles(result).should.be.exactly(1);
                        svg.diagonal = path.basename(result.css.sprite.path);
                        done();
                    });
                });

                it('creates 1 additional file for packed layout', function (done) {
                    this.timeout(20000);

                    spriter.compile({
                        css: {
                            sprite: 'svg/css.packed.svg',
                            layout: 'packed'
                        }
                    }, function (error, result) {
                        result.css.should.be.an.Object;
                        writeFiles(result).should.be.exactly(1);
                        svg.packed = path.basename(result.css.sprite.path);
                        done();
                    });
                });
            });

            // Test sprite renderings
            describe('creates visually correct sprite with', function () {

                // Vertical layout
                it('vertical layout', function (done) {
                    this.timeout(20000);
                    compareSvg2Png(
                        path.join(__dirname, '..', 'tmp', 'css', 'svg', svg.vertical),
                        path.join(__dirname, '..', 'tmp', 'css', 'png', 'css.vertical.png'),
                        path.join(__dirname, 'expected', 'png', 'css.vertical.png'),
                        path.join(__dirname, '..', 'tmp', 'css', 'png', 'css.vertical.diff.png'),
                        done,
                        'The vertical sprite doesn\'t match the expected one!'
                    );
                });

                // Horizontal layout
                it('horizontal layout', function (done) {
                    this.timeout(20000);
                    compareSvg2Png(
                        path.join(__dirname, '..', 'tmp', 'css', 'svg', svg.horizontal),
                        path.join(__dirname, '..', 'tmp', 'css', 'png', 'css.horizontal.png'),
                        path.join(__dirname, 'expected', 'png', 'css.horizontal.png'),
                        path.join(__dirname, '..', 'tmp', 'css', 'png', 'css.horizontal.diff.png'),
                        done,
                        'The horizontal sprite doesn\'t match the expected one!'
                    );
                });

                // Diagonal layout
                it('diagonal layout', function (done) {
                    this.timeout(20000);
                    compareSvg2Png(
                        path.join(__dirname, '..', 'tmp', 'css', 'svg', svg.diagonal),
                        path.join(__dirname, '..', 'tmp', 'css', 'png', 'css.diagonal.png'),
                        path.join(__dirname, 'expected', 'png', 'css.diagonal.png'),
                        path.join(__dirname, '..', 'tmp', 'css', 'png', 'css.diagonal.diff.png'),
                        done,
                        'The diagonal sprite doesn\'t match the expected one!'
                    );
                });

                // Packed layout
                it('packed layout', function (done) {
                    this.timeout(20000);
                    compareSvg2Png(
                        path.join(__dirname, '..', 'tmp', 'css', 'svg', svg.packed),
                        path.join(__dirname, '..', 'tmp', 'css', 'png', 'css.packed.png'),
                        path.join(__dirname, 'expected', 'png', isNodeGreaterThan10 ? 'css.packed.12.png' : 'css.packed.png'),
                        path.join(__dirname, '..', 'tmp', 'css', 'png', 'css.packed.diff.png'),
                        done,
                        'The packed sprite doesn\'t match the expected one!'
                    );
                });
            });

            // Test stylesheet resources
            describe('creates a visually correct stylesheet resource in', function () {

                // Plain CSS
                it('CSS format', function (done) {
                    this.timeout(20000);

                    data.css = '../sprite.css';
                    var out = mustache.render(previewTemplate, data),
                        preview = writeFile(path.join(__dirname, '..', 'tmp', 'css', 'html', 'css.html'), out),
                        previewImage = path.join(__dirname, '..', 'tmp', 'css', 'png', 'css.html.png');
                    preview.should.be.ok;

                    capturePhantom(preview, previewImage, function (error) {
                        should(error).not.ok;
                        imageDiff({
                            actualImage: previewImage,
                            expectedImage: path.join(__dirname, 'expected', 'png', 'css.html.png'),
                            diffImage: path.join(__dirname, '..', 'tmp', 'css', 'png', 'css.html.diff.png')
                        }, function (error, imagesAreSame) {
                            should(error).not.ok;
                            should.ok(imagesAreSame, 'The generated CSS preview doesn\'t match the expected one!');
                            done();
                        });
                    });
                });

                // Sass
                it('Sass format', function (done) {
                    this.timeout(30000);

                    sass.render({
                            file: path.join(__dirname, '..', 'tmp', 'css', 'sprite.scss')
                        },
                        function (err, scssText) {
                            should(err).not.ok;
                            should(writeFile(path.join(__dirname, '..', 'tmp', 'css', 'sprite.scss.css'), scssText.css)).be.ok;

                            data.css = '../sprite.scss.css';
                            var out = mustache.render(previewTemplate, data),
                                preview = writeFile(path.join(__dirname, '..', 'tmp', 'css', 'html', 'scss.html'), out),
                                previewImage = path.join(__dirname, '..', 'tmp', 'css', 'png', 'scss.html.png');
                            preview.should.be.ok;

                            capturePhantom(preview, previewImage, function (error) {
                                should(error).not.ok;
                                imageDiff({
                                    actualImage: previewImage,
                                    expectedImage: path.join(__dirname, 'expected', 'png', 'css.html.png'),
                                    diffImage: path.join(__dirname, '..', 'tmp', 'css', 'png', 'scss.html.diff.png')
                                }, function (error, imagesAreSame) {
                                    should(error).not.ok;
                                    should.ok(imagesAreSame, 'The generated Sass preview doesn\'t match the expected one!');
                                    done();
                                });
                            });
                        }
                    );
                });

                // LESS
                it('LESS format', function (done) {
                    this.timeout(20000);

                    var lessFile = path.join(__dirname, '..', 'tmp', 'css', 'sprite.less');
                    fs.readFile(lessFile, function (err, lessText) {
                        should(err).not.ok;

                        less.render(lessText.toString(), {}, function (error, output) {
                            should(error).not.ok;
                            should(writeFile(path.join(__dirname, '..', 'tmp', 'css', 'sprite.less.css'), output.css)).be.ok;

                            data.css = '../sprite.less.css';
                            var out = mustache.render(previewTemplate, data),
                                preview = writeFile(path.join(__dirname, '..', 'tmp', 'css', 'html', 'less.html'), out),
                                previewImage = path.join(__dirname, '..', 'tmp', 'css', 'png', 'less.html.png');
                            preview.should.be.ok;

                            capturePhantom(preview, previewImage, function (error) {
                                should(error).not.ok;
                                imageDiff({
                                    actualImage: previewImage,
                                    expectedImage: path.join(__dirname, 'expected', 'png', 'css.html.png'),
                                    diffImage: path.join(__dirname, '..', 'tmp', 'css', 'png', 'less.html.diff.png')
                                }, function (error, imagesAreSame) {
                                    should(error).not.ok;
                                    should.ok(imagesAreSame, 'The generated LESS preview doesn\'t match the expected one!');
                                    done();
                                });
                            });
                        });
                    });
                });

                // Stylus
                it('Stylus format', function (done) {
                    this.timeout(20000);

                    var stylusFile = path.join(__dirname, '..', 'tmp', 'css', 'sprite.styl');
                    fs.readFile(stylusFile, function (err, stylusText) {
                        should(err).not.ok;

                        stylus.render(stylusText.toString(), {}, function (error, output) {
                            should(error).not.ok;
                            should(writeFile(path.join(__dirname, '..', 'tmp', 'css', 'sprite.styl.css'), output)).be.ok;

                            data.css = '../sprite.styl.css';
                            var out = mustache.render(previewTemplate, data),
                                preview = writeFile(path.join(__dirname, '..', 'tmp', 'css', 'html', 'styl.html'), out),
                                previewImage = path.join(__dirname, '..', 'tmp', 'css', 'png', 'styl.html.png');
                            preview.should.be.ok;

                            capturePhantom(preview, previewImage, function (error) {
                                should(error).not.ok;
                                imageDiff({
                                    actualImage: previewImage,
                                    expectedImage: path.join(__dirname, 'expected', 'png', 'css.html.png'),
                                    diffImage: path.join(__dirname, '..', 'tmp', 'css', 'png', 'styl.html.diff.png')
                                }, function (error, imagesAreSame) {
                                    should(error).not.ok;
                                    should.ok(imagesAreSame, 'The generated Stylus preview doesn\'t match the expected one!');
                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });

        // Test the view mode
        describe('in «view» mode', function () {

            it('creates 2 files for packed layout', function (done) {
                this.timeout(20000);

                spriter.compile({
                    view: {
                        sprite: 'svg/view.packed.svg',
                        layout: 'packed',
                        dimensions: '-dims',
                        render: {
                            css: true
                        }
                    }
                }, function (error, result, cssData) {
                    result.view.should.be.an.Object;
                    writeFiles(result).should.be.exactly(2);
                    data = cssData.view;
                    svg.packed = path.basename(result.view.sprite.path);
                    done();
                });
            });

            describe('creates visually correct sprite with', function () {

                // Packed layout
                it('packed layout', function (done) {
                    this.timeout(20000);
                    compareSvg2Png(
                        path.join(__dirname, '..', 'tmp', 'view', 'svg', svg.packed),
                        path.join(__dirname, '..', 'tmp', 'view', 'png', 'view.packed.png'),
                        path.join(__dirname, 'expected', 'png', isNodeGreaterThan10 ? 'css.packed.12.png' : 'css.packed.png'),
                        path.join(__dirname, '..', 'tmp', 'view', 'png', 'view.packed.diff.png'),
                        done,
                        'The packed sprite doesn\'t match the expected one!'
                    );
                });
            });

            //// Cannot be tested at the moment as PhantomJS 1.9 doesn't support fragment identifiers with SVG
            //describe('creates a visually correct stylesheet resource in', function() {
            //
            //	it('CSS format', function(done) {
            //   	this.timeout(20000);
            //
            //    	data.css				= '../sprite.css';
            //    	var previewTemplate		= fs.readFileSync(path.join(__dirname, 'tmpl', 'view.html'), 'utf-8'),
            //    	out						= mustache.render(previewTemplate, data),
            //    	preview					= writeFile(path.join(__dirname, '..', 'tmp', 'view', 'html', 'view.html'), out),
            //    	previewImage			= path.join(__dirname, '..', 'tmp', 'view', 'png', 'view.html.png');
            //    	preview.should.be.ok;
            //
            //    	captureSlimer(preview, previewImage, function(error) {
            //    		should(error).not.ok;
            //    		imageDiff({
            //			actualImage		: previewImage,
            //			expectedImage	: path.join(__dirname, 'expected', 'png', 'view.html.png'),
            //			diffImage		: path.join(__dirname, '..', 'tmp', 'view', 'png', 'view.html.diff.png')
            //		}, function (error, imagesAreSame) {
            //	    	should(error).not.ok;
            //	    	should.ok(imagesAreSame, 'The generated CSS preview doesn\'t match the expected one!');
            //	    	done();
            //	    });ddr
            //    	});
            //	});
            //});
        });
    });

    describe('with centered alignment and ' + align.length + ' SVG files', function () {
        var spriter = null,
            data = null,
            svg = {};

        describe('with «css» mode, vertical layout and CSS render type', function () {

            it('creates 2 files', function (done) {
                this.timeout(20000);

                spriter = new SVGSpriter({
                    dest: dest,
                    shape: {
                        align: path.join(__dirname, 'fixture', 'yaml', 'align.centered.yaml'),
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
                }, function (error, result, cssData) {
                    result.css.should.be.an.Object;
                    writeFiles(result).should.be.exactly(2);
                    data = cssData.css;
                    svg.vertical = path.basename(result.css.sprite.path);
                    done();
                });
            });

            it('creates visually correct sprite', function (done) {
                this.timeout(20000);
                compareSvg2Png(
                    path.join(__dirname, '..', 'tmp', 'css', 'svg', svg.vertical),
                    path.join(__dirname, '..', 'tmp', 'css', 'png', 'css.vertical.centered.png'),
                    path.join(__dirname, 'expected', 'png', 'css.vertical.centered.png'),
                    path.join(__dirname, '..', 'tmp', 'css', 'png', 'css.vertical.centered.diff.png'),
                    done,
                    'The vertical sprite doesn\'t match the expected one!'
                );
            });

            it('creates a visually correct stylesheet resource', function (done) {
                this.timeout(20000);

                data.css = '../sprite.centered.css';
                var out = mustache.render(previewTemplate, data),
                    preview = writeFile(path.join(__dirname, '..', 'tmp', 'css', 'html', 'css.vertical.centered.html'), out),
                    previewImage = path.join(__dirname, '..', 'tmp', 'css', 'png', 'css.vertical.centered.html.png');
                preview.should.be.ok;

                capturePhantom(preview, previewImage, function (error) {
                    should(error).not.ok;
                    imageDiff({
                        actualImage: previewImage,
                        expectedImage: path.join(__dirname, 'expected', 'png', 'css.vertical.centered.html.png'),
                        diffImage: path.join(__dirname, '..', 'tmp', 'css', 'png', 'css.centered.html.diff.png')
                    }, function (error, imagesAreSame) {
                        should(error).not.ok;
                        should.ok(imagesAreSame, 'The generated CSS preview doesn\'t match the expected one!');
                        done();
                    });
                });
            });
        });

        describe('with «css» mode, horizontal layout and Sass render type', function () {

            it('creates 2 files', function (done) {
                this.timeout(20000);

                spriter = new SVGSpriter({
                    dest: dest,
                    shape: {
                        align: path.join(__dirname, 'fixture', 'yaml', 'align.centered.yaml'),
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
                }, function (error, result, cssData) {
                    result.css.should.be.an.Object;
                    writeFiles(result).should.be.exactly(2);
                    data = cssData.css;
                    svg.horizontal = path.basename(result.css.sprite.path);
                    done();
                });
            });

            it('creates visually correct sprite', function (done) {
                this.timeout(20000);
                compareSvg2Png(
                    path.join(__dirname, '..', 'tmp', 'css', 'svg', svg.horizontal),
                    path.join(__dirname, '..', 'tmp', 'css', 'png', 'css.horizontal.centered.png'),
                    path.join(__dirname, 'expected', 'png', 'css.horizontal.centered.png'),
                    path.join(__dirname, '..', 'tmp', 'css', 'png', 'css.horizontal.centered.diff.png'),
                    done,
                    'The horizontal sprite doesn\'t match the expected one!'
                );
            });

            it('creates a visually correct stylesheet resource', function (done) {
                this.timeout(20000);

                sass.render({
                        file: path.join(__dirname, '..', 'tmp', 'css', 'sprite.centered.scss')
                    },
                    function (err, scssText) {
                        should(err).not.ok;
                        should(writeFile(path.join(__dirname, '..', 'tmp', 'css', 'sprite.centered.scss.css'), scssText.css)).be.ok;

                        data.css = '../sprite.centered.scss.css';
                        var out = mustache.render(previewTemplate, data),
                            preview = writeFile(path.join(__dirname, '..', 'tmp', 'css', 'html', 'scss.horizontal.centered.html'), out),
                            previewImage = path.join(__dirname, '..', 'tmp', 'css', 'png', 'scss.horizontal.centered.html.png');
                        preview.should.be.ok;

                        capturePhantom(preview, previewImage, function (error) {
                            should(error).not.ok;
                            imageDiff({
                                actualImage: previewImage,
                                expectedImage: path.join(__dirname, 'expected', 'png', 'css.horizontal.centered.html.png'),
                                diffImage: path.join(__dirname, '..', 'tmp', 'css', 'png', 'scss.horizontal.centered.html.diff.png')
                            }, function (error, imagesAreSame) {
                                should(error).not.ok;
                                should.ok(imagesAreSame, 'The generated Sass preview doesn\'t match the expected one!');
                                done();
                            });
                        });
                    }
                );
            });
        });

        describe('with «css» mode, packed layout and LESS render type', function () {

            it('creates 2 files', function (done) {
                this.timeout(20000);

                spriter = new SVGSpriter({
                    dest: dest,
                    shape: {
                        align: path.join(__dirname, 'fixture', 'yaml', 'align.centered.yaml'),
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
                }, function (error, result, cssData) {
                    result.css.should.be.an.Object;
                    writeFiles(result).should.be.exactly(2);
                    data = cssData.css;
                    svg.packed = path.basename(result.css.sprite.path);
                    done();
                });
            });

            it('creates visually correct sprite', function (done) {
                this.timeout(20000);
                compareSvg2Png(
                    path.join(__dirname, '..', 'tmp', 'css', 'svg', svg.packed),
                    path.join(__dirname, '..', 'tmp', 'css', 'png', 'css.packed.centered.png'),
                    path.join(__dirname, 'expected', 'png', 'css.packed.aligned.png'),
                    path.join(__dirname, '..', 'tmp', 'css', 'png', 'css.packed.centered.diff.png'),
                    done,
                    'The packed sprite doesn\'t match the expected one!'
                );
            });

            it('creates a visually correct stylesheet resource', function (done) {
                this.timeout(20000);

                var lessFile = path.join(__dirname, '..', 'tmp', 'css', 'sprite.centered.less');
                fs.readFile(lessFile, function (err, lessText) {
                    should(err).not.ok;

                    less.render(lessText.toString(), {}, function (error, output) {
                        should(error).not.ok;
                        should(writeFile(path.join(__dirname, '..', 'tmp', 'css', 'sprite.centered.less.css'), output.css)).be.ok;

                        data.css = '../sprite.centered.less.css';
                        var out = mustache.render(previewTemplate, data),
                            preview = writeFile(path.join(__dirname, '..', 'tmp', 'css', 'html', 'less.packed.centered.html'), out),
                            previewImage = path.join(__dirname, '..', 'tmp', 'css', 'png', 'less.packed.centered.html.png');
                        preview.should.be.ok;

                        capturePhantom(preview, previewImage, function (error) {
                            should(error).not.ok;
                            imageDiff({
                                actualImage: previewImage,
                                expectedImage: path.join(__dirname, 'expected', 'png', 'css.packed.aligned.html.png'),
                                diffImage: path.join(__dirname, '..', 'tmp', 'css', 'png', 'less.packed.centered.html.diff.png')
                            }, function (error, imagesAreSame) {
                                should(error).not.ok;
                                should.ok(imagesAreSame, 'The generated LESS preview doesn\'t match the expected one!');
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    describe('with mixed alignment and ' + align.length + ' SVG files', function () {
        var spriter = null,
            data = null,
            svg = {};

        describe('with «view» mode, vertical layout and CSS render type', function () {

            it('creates 2 files', function (done) {
                this.timeout(20000);

                spriter = new SVGSpriter({
                    dest: dest,
                    shape: {
                        align: path.join(__dirname, 'fixture', 'yaml', 'align.mixed.yaml'),
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
                }, function (error, result, cssData) {
                    result.view.should.be.an.Object;
                    writeFiles(result).should.be.exactly(2);
                    data = cssData.view;
                    svg.vertical = path.basename(result.view.sprite.path);
                    done();
                });
            });

            it('creates visually correct sprite', function (done) {
                this.timeout(20000);
                compareSvg2Png(
                    path.join(__dirname, '..', 'tmp', 'view', 'svg', svg.vertical),
                    path.join(__dirname, '..', 'tmp', 'view', 'png', 'css.vertical.mixed.png'),
                    path.join(__dirname, 'expected', 'png', 'css.vertical.mixed.png'),
                    path.join(__dirname, '..', 'tmp', 'view', 'png', 'css.vertical.mixed.diff.png'),
                    done,
                    'The vertical sprite doesn\'t match the expected one!'
                );
            });

            it('creates a visually correct stylesheet resource', function (done) {
                this.timeout(20000);

                data.css = '../sprite.mixed.css';
                var out = mustache.render(previewTemplate, data),
                    preview = writeFile(path.join(__dirname, '..', 'tmp', 'view', 'html', 'css.vertical.mixed.html'), out),
                    previewImage = path.join(__dirname, '..', 'tmp', 'view', 'png', 'css.vertical.mixed.html.png');
                preview.should.be.ok;

                capturePhantom(preview, previewImage, function (error) {
                    should(error).not.ok;
                    imageDiff({
                        actualImage: previewImage,
                        expectedImage: path.join(__dirname, 'expected', 'png', 'css.vertical.mixed.html.png'),
                        diffImage: path.join(__dirname, '..', 'tmp', 'view', 'png', 'css.mixed.html.diff.png')
                    }, function (error, imagesAreSame) {
                        should(error).not.ok;
                        should.ok(imagesAreSame, 'The generated CSS preview doesn\'t match the expected one!');
                        done();
                    });
                });
            });
        });

        describe('with «view» mode, horizontal layout and Sass render type', function () {

            it('creates 2 files', function (done) {
                this.timeout(20000);

                spriter = new SVGSpriter({
                    dest: dest,
                    shape: {
                        align: path.join(__dirname, 'fixture', 'yaml', 'align.mixed.yaml'),
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
                }, function (error, result, cssData) {
                    result.view.should.be.an.Object;
                    writeFiles(result).should.be.exactly(8);
                    data = cssData.view;
                    svg.horizontal = path.basename(result.view.sprite.path);
                    done();
                });
            });

            it('creates visually correct sprite', function (done) {
                this.timeout(20000);
                compareSvg2Png(
                    path.join(__dirname, '..', 'tmp', 'view', 'svg', svg.horizontal),
                    path.join(__dirname, '..', 'tmp', 'view', 'png', 'css.horizontal.mixed.png'),
                    path.join(__dirname, 'expected', 'png', 'css.horizontal.mixed.png'),
                    path.join(__dirname, '..', 'tmp', 'view', 'png', 'css.horizontal.mixed.diff.png'),
                    done,
                    'The horizontal sprite doesn\'t match the expected one!'
                );
            });

            it('creates a visually correct stylesheet resource', function (done) {
                this.timeout(20000);

                sass.render({
                        file: path.join(__dirname, '..', 'tmp', 'view', 'sprite.mixed.scss')
                    },
                    function (err, scssText) {
                        should(err).not.ok;
                        should(writeFile(path.join(__dirname, '..', 'tmp', 'view', 'sprite.mixed.scss.css'), scssText.css)).be.ok;

                        data.css = '../sprite.mixed.scss.css';
                        var out = mustache.render(previewTemplate, data),
                            preview = writeFile(path.join(__dirname, '..', 'tmp', 'view', 'html', 'scss.horizontal.mixed.html'), out),
                            previewImage = path.join(__dirname, '..', 'tmp', 'view', 'png', 'scss.horizontal.mixed.html.png');
                        preview.should.be.ok;

                        capturePhantom(preview, previewImage, function (error) {
                            should(error).not.ok;
                            imageDiff({
                                actualImage: previewImage,
                                expectedImage: path.join(__dirname, 'expected', 'png', 'css.horizontal.mixed.html.png'),
                                diffImage: path.join(__dirname, '..', 'tmp', 'view', 'png', 'scss.horizontal.mixed.html.diff.png')
                            }, function (error, imagesAreSame) {
                                should(error).not.ok;
                                should.ok(imagesAreSame, 'The generated Sass preview doesn\'t match the expected one!');
                                done();
                            });
                        });
                    }
                );
            });
        });

        describe('with «view» mode, packed layout and LESS render type', function () {

            it('creates 2 files', function (done) {
                this.timeout(20000);

                spriter = new SVGSpriter({
                    dest: dest,
                    shape: {
                        align: path.join(__dirname, 'fixture', 'yaml', 'align.mixed.yaml'),
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
                }, function (error, result, cssData) {
                    result.view.should.be.an.Object;
                    writeFiles(result).should.be.exactly(2);
                    data = cssData.view;
                    svg.packed = path.basename(result.view.sprite.path);
                    done();
                });
            });

            it('creates visually correct sprite', function (done) {
                this.timeout(20000);
                compareSvg2Png(
                    path.join(__dirname, '..', 'tmp', 'view', 'svg', svg.packed),
                    path.join(__dirname, '..', 'tmp', 'view', 'png', 'css.packed.mixed.png'),
                    path.join(__dirname, 'expected', 'png', 'css.packed.aligned.png'),
                    path.join(__dirname, '..', 'tmp', 'view', 'png', 'css.packed.mixed.diff.png'),
                    done,
                    'The packed sprite doesn\'t match the expected one!'
                );
            });

            it('creates a visually correct stylesheet resource', function (done) {
                this.timeout(20000);

                var lessFile = path.join(__dirname, '..', 'tmp', 'view', 'sprite.mixed.less');
                fs.readFile(lessFile, function (err, lessText) {
                    should(err).not.ok;

                    less.render(lessText.toString(), {}, function (error, output) {
                        should(error).not.ok;
                        should(writeFile(path.join(__dirname, '..', 'tmp', 'view', 'sprite.mixed.less.css'), output.css)).be.ok;

                        data.css = '../sprite.mixed.less.css';
                        var out = mustache.render(previewTemplate, data),
                            preview = writeFile(path.join(__dirname, '..', 'tmp', 'view', 'html', 'less.packed.mixed.html'), out),
                            previewImage = path.join(__dirname, '..', 'tmp', 'view', 'png', 'less.packed.mixed.html.png');
                        preview.should.be.ok;

                        capturePhantom(preview, previewImage, function (error) {
                            should(error).not.ok;
                            imageDiff({
                                actualImage: previewImage,
                                expectedImage: path.join(__dirname, 'expected', 'png', 'css.packed.aligned.html.png'),
                                diffImage: path.join(__dirname, '..', 'tmp', 'view', 'png', 'less.packed.mixed.html.diff.png')
                            }, function (error, imagesAreSame) {
                                should(error).not.ok;
                                should.ok(imagesAreSame, 'The generated LESS preview doesn\'t match the expected one!');
                                done();
                            });
                        });
                    });
                });
            });
        });
    });
});
