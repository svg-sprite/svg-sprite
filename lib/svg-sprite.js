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

const path = require('path');
const events = require('events');
const os = require('os');
const { format } = require('util');
const _ = require('lodash');
const File = require('vinyl');
const async = require('async');
const pretty = require('prettysize');
const Config = require('./svg-sprite/config');
const Queue = require('./svg-sprite/queue');
const Layouter = require('./svg-sprite/layouter');
const svgo = require('./svg-sprite/transform/svgo');

// TODO: after Node.js 12.x, os.cpus is never undefined
const CPU_COUNT = os.cpus() && os.cpus().length;

/**
 * SVGSpriter class
 *
 * @param {Object} config                Configuration
 */
function SVGSpriter(config) {
    this.config = new Config(config);
    this._queue = new Queue(this);
    this._shapes = [];
    this._shapeTransformers = { svgo };
    this._compileQueue = [];
    this._shapesDest = [];
    this._limit = CPU_COUNT ? CPU_COUNT * 2 : 2;

    this.info('Using %d threads', this._limit);

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
 * @param {File|String} file              Vinyl file object or absolute file path
 * @param {String} name                   Name part of the file path
 * @param {String} svg                    SVG content
 * @return {SVGSpriter}                   Self reference
 * @throws {Error}                        In case an invalid file should be added
 */
SVGSpriter.prototype.add = function(file, name, svg) {
    // If no vinyl file object has been given
    if (!this._isVinylFile(file)) {
        file = _.trim(file);
        let error = null;

        // If the name part of the file path is absolute
        if (name && path.isAbsolute(name)) {
            error = format('SVGSpriter.add: "%s" is not a valid relative file name', name);
        } else {
            name = _.trimStart(_.trim(name), `${path.sep}.`) || path.basename(file);
            svg = _.trim(svg);

            // Argument validation
            if (arguments.length < 3) {
                error = 'SVGSpriter.add: You must provide 3 arguments';
            } else if (!file.length) {
                error = format('SVGSpriter.add: "%s" is not a valid absolute file name', file);
            } else if (!name.length) {
                error = format('SVGSpriter.add: "%s" is not a valid relative file name', name);
            } else if (!svg.length) {
                error = 'SVGSpriter.add: You must provide SVG contents';
            } else if (!file.endsWith(name)) {
                error = format('SVGSpriter.add: "%s" is not the local part of "%s"', name, file);
            }
        }

        // In case of an error: Throw it!
        if (error) {
            const e = new Error(error);
            e.name = 'ArgumentError';
            e.errno = 1419945903;
            this.error(error, e);
            throw e;
        }

        // Instantiate a vinyl file
        file = new File({
            base: path.dirname(file),
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
 * @return {Boolean}                      Parameter is a vinyl file object
 */
SVGSpriter.prototype._isVinylFile = function(file) {
    return _.isObject(file) && (file instanceof File || (file.constructor.name === 'File' && ['path', 'contents', 'relative'].filter(function(property) {
        return property in this;
    }, file).length === 3));
};

/**
 * Transform a single shape
 *
 * @param {SVGShape} shape                Shape
 * @param {Function} cb                   Callback
 */
SVGSpriter.prototype._transformShape = function(shape, cb) {
    const tasks = [];
    const createTransformTask = transform => {
        // If it's a custom transformer
        if (_.isFunction(transform[1])) {
            return () => {
                transform[1](shape, this, cb);
            };
        }

        // Else if it's a registered transformer
        if (transform[0] in this._shapeTransformers && _.isObject(transform[1])) {
            return () => {
                this._shapeTransformers[transform[0]](shape, transform[1], this, cb);
            };
        }

        // Else: Break
        return null;
    };

    // Run through all configured transforms
    for (let t = 0; t < this.config.shape.transform.length; t++) {
        const task = createTransformTask(this.config.shape.transform[t]);

        if (task) {
            tasks.push(task);
        }
    }

    async.waterfall(tasks, error => {
        cb(error);
    });
};

/**
 * Compile the sprite & additional resources
 *
 * @param {Object} config                 Configuration
 * @param {Function} cb                   Callback
 */
SVGSpriter.prototype.compile = function(config, cb) {
    const _config = _.isPlainObject(config) ?
        // eslint-disable-next-line unicorn/no-array-callback-reference
        this.config.filter(config) :
        _.cloneDeep(this.config.mode);
    let _cb;

    if (_.isFunction(cb)) {
        _cb = cb;
    } else if (_.isFunction(config)) {
        _cb = config;
    } else {
        _cb = error => {
            throw error;
        };
    }

    // Schedule a compilation run
    this._compileQueue.push([_config, _cb]);
    this._compile();
};

/**
 * Run the next compile task
 */
SVGSpriter.prototype._compile = function() {
    // If the shape queue is not currently active
    if (!this._queue.active && this._compileQueue.length) {
        const [config, cb] = this._compileQueue.shift();

        // If this is a modeless run
        if (config === {}) {
            const files = {};

            // Add intermediate SVG files
            if (this.config.shape.dest) {
                files.shapes = this._getShapeFiles(this.config.shape.dest);
                this.verbose('Returning %d intermediate SVG files', files.shapes.length);
            }

            this._logStats(files);
            cb(null, files, {});
        } else {
            const masterShapes = this._shapes.filter(shape => !shape.master).length;
            this.info('Compiling %d shapes...', masterShapes);

            // Initialize the namespace powers
            while (!this._namespacePow.length || (26 ** this._namespacePow.length < masterShapes)) {
                this._namespacePow.unshift(26 ** this._namespacePow.length);
                _.invoke(this._shapes, 'resetNamespace');
            }

            // Sort shapes by ID
            this._shapes = this._shapes.sort(this.config.shape.sort);

            // Set the shape namespaces on all master shapes
            this._shapes.filter(shape => !shape.master)
                .forEach((shape, index) => {
                    shape.setNamespace(this._indexNamespace(index));
                });

            this._layout(config, (error, files, data) => {
                // Add intermediate SVG files
                if (this.config.shape.dest) {
                    files.shapes = this._getShapeFiles(this.config.shape.dest);
                    this.verbose('Returning %d intermediate SVG files', files.shapes.length);
                }

                this.info('Finished %s sprite compilation', Object.keys(data).map(mode => `«${mode}»`).join(' + '));

                this._logStats(files);

                cb(error, files, data);
                this.emit('compiled');
            });
        }
    }
};

/**
 * Return a unique namespace prefix for a shape index
 *
 * @param {Number} index            Shape index
 * @return {String}                 Namespace prefix
 */
SVGSpriter.prototype._indexNamespace = function(index) {
    let ns = '';

    for (let n = 0; n < this._namespacePow.length; n++) {
        const c = Math.floor(index / this._namespacePow[n]);
        ns += String.fromCharCode(97 + c);
        index -= c * this._namespacePow[n];
    }

    return ns;
};

/**
 * Layout the sprites
 *
 * @param {Object} config           Layout configuration
 * @param {Function} cb             Callback
 */
SVGSpriter.prototype._layout = function(config, cb) {
    const tasks = [];
    const files = {};
    const layout = new Layouter(this, config);
    const createLayoutTask = (k, m) => _cb => {
        layout.layout(files, k, m, _cb);
    };

    for (const mode in config) {
        tasks.push(createLayoutTask(mode, config[mode].mode));
    }

    async.parallelLimit(tasks, this._limit, (error, data) => {
        cb(error, files, _.zipObject(Object.keys(data).map(key => data[key].key), data));
    });
};

/**
 * Return all current shapes
 *
 * @param {String} dest            Destination directory
 * @param {Function} cb            Callback
 */
SVGSpriter.prototype.getShapes = function(dest, cb) {
    this._shapesDest.push([dest, cb]);
    this._getShapes();
};

/**
 * Return all current shapes
 */
SVGSpriter.prototype._getShapes = function() {
    // If the shape queue is not currently active
    if (!this._queue.active) {
        while (this._shapesDest.length) {
            const [dest, cb] = this._shapesDest.shift();
            cb(null, this._getShapeFiles(dest));
        }
    }
};

/**
 * Return the shapes as a list of vinyl files
 *
 * @param {String} dest             Destination directory
 * @return {Array}                  Shape file list
 */
SVGSpriter.prototype._getShapeFiles = function(dest) {
    return this._shapes.map(shape => {
        return new File({
            base: this.config.dest,
            path: path.join(dest, `${shape.id}.svg`),
            contents: Buffer.from(shape.getSVG(false))
        });
    });
};

/**
 * Log file statistics
 *
 * @param {Object} files        Files
 */
SVGSpriter.prototype._logStats = function(files) {
    const sizes = {};
    const exts = {};

    for (const mode in files) {
        for (const resource in files[mode]) {
            const file = files[mode][resource].relative;
            const ext = path.extname(files[mode][resource].path).toUpperCase();
            exts[ext] = (exts[ext] || 0) + 1;
            sizes[file] = pretty(files[mode][resource].contents.length);
        }
    }

    this.info('Created %s', Object.entries(exts).map(ext => `${ext[1]} x ${ext[0].substr(1)}`).join(', '));

    Object.keys(sizes).sort().forEach(file => {
        this.verbose('Created %s: %s', file, sizes[file]);
    });
};

/**
 * Pass info messages on to the logger
 */
SVGSpriter.prototype.info = function(...args) {
    this.config.log.info(...args);
};

/**
 * Pass verbose messages on to the logger
 */
SVGSpriter.prototype.verbose = function(...args) {
    this.config.log.verbose(...args);
};

/**
 * Pass debug messages on to the logger
 */
SVGSpriter.prototype.debug = function(...args) {
    this.config.log.debug(...args);
};

/**
 * Pass error messages on to the logger
 */
SVGSpriter.prototype.error = function(...args) {
    this.config.log.error(...args);
};

/**
 * Module export (constructor wrapper)
 *
 * @param {Object} config           Configuration
 * @return {SVGSpriter}             SVGSpriter instance
 */
module.exports = function(config) {
    return new SVGSpriter(config || {});
};
