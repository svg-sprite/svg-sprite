'use strict';

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/svg-sprite/svg-sprite
 *
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2018 Joschi Kuphal
 * @license MIT https://github.com/svg-sprite/svg-sprite/blob/1.5.x/LICENSE
 */

var CONFIG = require('./svg-sprite/config');
var QUEUE = require('./svg-sprite/queue');
var SVGO = require('./svg-sprite/transform/svgo');
var LAYOUTER = require('./svg-sprite/layouter');
var _ = require('lodash');
var path = require('path');
var File = require('vinyl');
var events = require('events');
var async = require('async');
var os = require('os');
var pretty = require('prettysize');
var util = require('util');

/**
 * SVGSpriter class
 *
 * @param {Object} config                Configuration
 */
function SVGSpriter(config) {
    this.config = new CONFIG(config);
    this._queue = new QUEUE(this);
    this._shapes = [];
    this._shapeTransformers = { svgo: SVGO };
    this._compileQueue = [];
    this._shapesDest = [];

    // Detect the number of CPUs
    if (typeof os.cpus() === 'undefined') {
        this._limit = 2;
        this.info('Can\'t detect number of CPUs, falling back to 2');
    } else {
        this._limit = os.cpus().length * 2;
    }

    events.EventEmitter.call(this);

    this._queue.on('empty', this._compile.bind(this));
    this._queue.on('empty', this._getShapes.bind(this));
    this.on('compiled', this._compile.bind(this));

    this.info('Created spriter instance');
}

/**
 * Prototype
 *
 * @type {Object}
 */
SVGSpriter.prototype = Object.create(events.EventEmitter.prototype);

/**
 * SVG shapes making up the sprites
 *
 * @type {Array}
 */
SVGSpriter.prototype._shapes = [];

/**
 * Namespace powers
 *
 * @type {Array}
 */
SVGSpriter.prototype._namespacePow = [];

/**
 * Add an SVG shape to the sprites
 *
 * @param {File|String} file            Vinyl file object or absolute file path
 * @param {String} name                    Name part of the file path
 * @param {String} svg                    SVG content
 * @return {SVGSpriter}                    Self reference
 * @throws {Error}                        In case an invalid file should be added
 */
SVGSpriter.prototype.add = function (file, name, svg) {

    // If no vinyl file object has been given
    if (!this._isVinylFile(file)) {
        file = _.trim(file);
        var error = null;

        // If the name part of the file path is absolute
        if (name && path.isAbsolute(name)) {
            error = util.format('SVGSpriter.add: "%s" is not a valid relative file name', name);

            // Else
        } else {
            name = _.trimStart(_.trim(name), path.sep + '.') || path.basename(file);
            svg = _.trim(svg);

            // Argument validation
            if (arguments.length < 3) {
                error = 'SVGSpriter.add: You must provide 3 arguments';
            }
            if (!file.length) {
                error = util.format('SVGSpriter.add: "%s" is not a valid absolute file name', file);
            }
            if (!name.length) {
                error = util.format('SVGSpriter.add: "%s" is not a valid relative file name', name);
            }
            if (!svg.length) {
                error = 'SVGSpriter.add: You must provide SVG contents';
            }
            if (file.substr(-name.length) !== name) {
                error = util.format('SVGSpriter.add: "%s" is not the local part of "%s"', name, file);
            }
        }

        // In case of an error: Throw it!
        if (error) {
            var e = new Error(error);
            e.name = 'ArgumentError';
            e.errno = 1419945903;
            this.error(error, e);
            throw e;
        }

        // Instanciate a vinyl file
        file = new File({
            base: file.substring(0, file.length - name.length),
            path: file,
            contents: Buffer.from(svg)
        });
    }

    file.base = path.resolve(file.base);

    // Add the shape to the internal processing queue
    this._queue.add(file);

    return this;
};

/**
 * Duck-typing check for vinyl file objects
 *
 * This check is necessary as singletons don't work cross-module and `instanceof` fails in these situations.
 *
 * @param {Mixed} file                    Arbitrary parameter
 * @return {Boolean}                    Parameter is a vinyl file object
 */
SVGSpriter.prototype._isVinylFile = function (file) {
    return _.isObject(file) && ((file instanceof File) || ((file.constructor.name === 'File') && (['path', 'contents', 'relative'].filter(function (property) {
        return property in this;
    }, file).length === 3)));
};

/**
 * Transform a single shape
 *
 * @param {SVGShape} shape                Shape
 * @param {Function} cb                    Callback
 */
SVGSpriter.prototype._transformShape = function (shape, cb) {
    var tasks = [],
        that = this,
        createTransformTask = function (transform) {

            // If it's a custom transformer
            if (_.isFunction(transform[1])) {
                return function () {
                    transform[1](shape, that, arguments[arguments.length - 1]);
                };

                // Else if it's a registered transformer
            } else if ((transform[0] in that._shapeTransformers) && _.isObject(transform[1])) {
                return function () {
                    that._shapeTransformers[transform[0]](shape, transform[1], that, arguments[arguments.length - 1]);
                };

                // Else: Break
            } else {
                return null;
            }

        };

    // Run through all configured transforms
    for (var t = 0, task; t < this.config.shape.transform.length; ++t) {
        task = createTransformTask(this.config.shape.transform[t]);

        if (task) {
            tasks.push(task);
        }
    }

    async.waterfall(tasks, function (error) {
        cb(error);
    });
};

/**
 * Compile the sprite & additional resources
 *
 * @param {Object} config                Configuration
 * @param {Function} cb                    Callback
 */
SVGSpriter.prototype.compile = function () {
    var args = _.toArray(arguments),
        config = _.isPlainObject(args[0]) ? this.config.filter(args.shift()) : _.clone(this.config.mode, true),
        cb = _.isFunction(args[0]) ? args.shift() : function (error) {
            throw error;
        };

    // Schedule a compilation run
    this._compileQueue.push([config, cb]);
    this._compile();
};

/**
 * Run the next compile task
 */
SVGSpriter.prototype._compile = function () {

    // If the shape queue is not currently active
    if (!this._queue.active && this._compileQueue.length) {
        var that = this;
        var args = this._compileQueue.shift();

        // If this is a modeless run
        if (args[0] === {}) {
            var files = {};

            // Add intermediate SVG files
            if (that.config.shape.dest) {
                files.shapes = that._getShapeFiles(that.config.shape.dest);
                that.verbose('Returning %d intermediate SVG files', files.shapes.length);
            }

            that._logStats(files);
            args[1](null, files, {});

            // Else
        } else {
            var masterShapes = _.reject(this._shapes, function (shape) {
                return !!shape.master;
            }).length;
            this.info('Compiling %d shapes ...', masterShapes);

            // Initialize the namespace powers
            while (!this._namespacePow.length || (Math.pow(26, this._namespacePow.length) < masterShapes)) {
                this._namespacePow.unshift(Math.pow(26, this._namespacePow.length));
                _.invoke(this._shapes, 'resetNamespace');
            }

            // Sort shapes by ID
            this._shapes = this._shapes.sort(this.config.shape.sort);

            // Set the shape namespaces on all master shapes
            _.reject(this._shapes, function (shape) {
                return !!shape.master;
            }).map(function (shape, index) {
                shape.setNamespace(this._indexNamespace(index));
            }, this);

            this._layout(args[0], function (error, files, data) {

                // Add intermediate SVG files
                if (that.config.shape.dest) {
                    files.shapes = that._getShapeFiles(that.config.shape.dest);
                    that.verbose('Returning %d intermediate SVG files', files.shapes.length);
                }
                that.info('Finished %s sprite compilation', _.keys(data).map(function (mode) {
                    return '«' + mode + '»';
                }).join(' + '));

                that._logStats(files);

                args[1](error, files, data);
                that.emit('compiled');
            });
        }
    }
};

/**
 * Return a unique namespace prefix for a shape index
 *
 * @param {Number} index        Shape index
 * @return {String}                Namespace prefix
 */
SVGSpriter.prototype._indexNamespace = function (index) {
    for (var ns = '', n = 0, c; n < this._namespacePow.length; ++n) {
        c = Math.floor(index / this._namespacePow[n]);
        ns += String.fromCharCode(97 + c);
        index -= c * this._namespacePow[n];
    }
    return ns;
};

/**
 * Layout the sprites
 *
 * @param {Object} config        Layout configuration
 * @param {Function} cb            Callback
 */
SVGSpriter.prototype._layout = function (config, cb) {
    var tasks = [],
        files = {},
        layout = new LAYOUTER(this, config),
        createLayoutTask = function (k, m) {
            return function (_cb) {
                layout.layout(files, k, m, _cb);
            };
        };

    for (var mode in config) {
        tasks.push(createLayoutTask(mode, config[mode].mode));
    }

    async.parallelLimit(tasks, this._limit, function (error, data) {
        cb(error, files, _.zipObject(_.map(data, 'key'), data));
    });
};

/**
 * Return all current shapes
 *
 * @param {String} dest            Destination directory
 * @param {Function} cb            Callback
 */
SVGSpriter.prototype.getShapes = function (dest, cb) {
    this._shapesDest.push([dest, cb]);
    this._getShapes();
};

/**
 * Return all current shapes
 */
SVGSpriter.prototype._getShapes = function () {

    // If the shape queue is not currently active
    if (!this._queue.active) {
        while (this._shapesDest.length) {
            var args = this._shapesDest.shift();
            args[1](null, this._getShapeFiles(args[0]));
        }
    }
};

/**
 * Return the shapes as a list of vinyl files
 *
 * @param {String} dest            Destination directory
 * @return {Array}                Shape file list
 */
SVGSpriter.prototype._getShapeFiles = function (dest) {
    return this._shapes.map(function (shape) {
        return new File({
            base: this.config.dest,
            path: path.join(dest, shape.id + '.svg'),
            contents: Buffer.from(shape.getSVG(false))
        });
    }, this);
};

/**
 * Log file statistics
 *
 * @param {Object} files        Files
 */
SVGSpriter.prototype._logStats = function (files) {
    var sizes = {},
        exts = {};
    for (var mode in files) {
        for (var resource in files[mode]) {
            var file = files[mode][resource].relative,
                ext = path.extname(files[mode][resource].path).toUpperCase();
            exts[ext] = (exts[ext] || 0) + 1;
            sizes[file] = pretty(files[mode][resource].contents.length);
        }
    }
    this.info('Created ' + _.toPairs(exts).map(function (ext) {
        return ext[1] + ' x ' + ext[0].substr(1);
    }).join(', '));

    Object.keys(sizes).sort().forEach(function (file) {
        this.verbose('Created %s: %s', file, sizes[file]);
    }, this);
};

/**
 * Pass info messages on to the logger
 */
SVGSpriter.prototype.info = function () {
    this.config.log.info.apply(this.config.log, arguments);
};

/**
 * Pass verbose messages on to the logger
 */
SVGSpriter.prototype.verbose = function () {
    this.config.log.verbose.apply(this.config.log, arguments);
};

/**
 * Pass debug messages on to the logger
 */
SVGSpriter.prototype.debug = function () {
    this.config.log.debug.apply(this.config.log, arguments);
};

/**
 * Pass error messages on to the logger
 */
SVGSpriter.prototype.error = function () {
    this.config.log.error.apply(this.config.log, arguments);
};

/**
 * Module export (constructor wrapper)
 *
 * @param {Object} config        Configuration
 * @return {SVGSpriter}            SVGSpriter instance
 */
module.exports = function (config) {
    return new SVGSpriter(config || {});
};
