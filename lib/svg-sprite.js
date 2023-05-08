'use strict';

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/svg-sprite/svg-sprite
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2018 Joschi Kuphal
 * @license MIT https://github.com/svg-sprite/svg-sprite/blob/main/LICENSE
 */

const { Buffer } = require('node:buffer');
const path = require('node:path');
const events = require('node:events');
const os = require('node:os');
const { format } = require('node:util');
const importLazy = require('import-lazy');
const { isFunction, isObject, isPlainObject, zipObject } = require('./svg-sprite/utils/index.js');

const trimStart = importLazy(() => require('lodash.trimstart'))();
const merge = importLazy(() => require('lodash.merge'))();
const File = importLazy(() => require('vinyl'))();
const async = importLazy(() => require('async'))();
const pretty = importLazy(() => require('prettysize'))();
const Config = importLazy(() => require('./svg-sprite/config.js'))();
const Queue = importLazy(() => require('./svg-sprite/queue.js'))();
const Layouter = importLazy(() => require('./svg-sprite/layouter.js'))();
const svgo = importLazy(() => require('./svg-sprite/transform/svgo.js'))();
const ArgumentError = importLazy(() => require('./svg-sprite/errors/argument-error.js'))();

/**
 * SVGSpriter class
 *
 * @param {object} config                Configuration
 */
function SVGSpriter(config) {
    this.config = new Config(config);
    this._queue = new Queue(this);
    this._shapes = [];
    this._shapeTransformers = { svgo };
    this._compileQueue = [];
    this._shapesDest = [];
    this._limit = Math.max(os.cpus().length * 2, 1);

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
 * @type {object}
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
 * @param {File | string} [file]             Vinyl file object or absolute file path
 * @param {string} [name]                    Name part of the file path
 * @param {Buffer | string} [svg]            SVG content
 * @returns {SVGSpriter}                     Self reference
 * @throws {Error}                           In case an invalid file is added
 */
SVGSpriter.prototype.add = function(file = '', name = '', svg = '') {
    // If no vinyl file object has been given
    if (!this._isVinylFile(file)) {
        file = file.trim();
        let errorMessage = null;

        // If the name part of the file path is absolute
        if (name && path.isAbsolute(name)) {
            errorMessage = format('SVGSpriter.add: "%s" is not a valid relative file name', name);
        } else {
            name = trimStart(name.trim(), `${path.sep}.`) || path.basename(file);
            // TODO: Avoid Buffer -> String -> Buffer conversion of svg.
            if (Buffer.isBuffer(svg)) {
                svg = svg.toString();
            }

            svg = svg.trim();

            // Argument validation
            if (arguments.length < 3) {
                errorMessage = 'SVGSpriter.add: You must provide 3 arguments';
            } else if (!file.length) {
                errorMessage = format('SVGSpriter.add: "%s" is not a valid absolute file name', file);
            } else if (!name.length) {
                errorMessage = format('SVGSpriter.add: "%s" is not a valid relative file name', name);
            } else if (!svg.length) {
                errorMessage = 'SVGSpriter.add: You must provide SVG contents';
            } else if (!file.endsWith(name)) {
                errorMessage = format('SVGSpriter.add: "%s" is not the local part of "%s"', name, file);
            }
        }

        // In case of an error: Throw it!
        if (errorMessage) {
            const error = new ArgumentError(errorMessage);
            this.error(errorMessage, error);
            throw error;
        }

        // Resolve path before splitting it into base and path
        // so that Shape will properly extract a shape name later on.
        file = path.resolve(file);

        // Instantiate a vinyl file
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
 * @param {any} file                       Arbitrary parameter
 * @returns {boolean}                      Parameter is a vinyl file object
 */
SVGSpriter.prototype._isVinylFile = function(file) {
    return isObject(file) && (file instanceof File || (file.constructor.name === 'File' && ['path', 'contents', 'relative'].filter(function(property) {
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
    const createTransformTask = transform => {
        // If it's a custom transformer
        if (isFunction(transform[1])) {
            return callback => {
                transform[1](shape, this, callback);
            };
        }

        // Else if it's a registered transformer
        if (transform[0] in this._shapeTransformers && isObject(transform[1])) {
            return callback => {
                this._shapeTransformers[transform[0]](shape, transform[1], this, callback);
            };
        }

        // Else: Break
        return null;
    };

    const tasks = [];

    // Run through all configured transforms
    for (const transform of this.config.shape.transform) {
        const task = createTransformTask(transform);

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
 * @param {object} config                 Configuration
 * @param {Function} cb                   Callback
 */
SVGSpriter.prototype.compile = function(config, cb) {
    const _config = isPlainObject(config) ?
        // eslint-disable-next-line unicorn/no-array-callback-reference
        this.config.filter(config) :
        merge({}, this.config.mode);
    let _cb;

    if (isFunction(cb)) {
        _cb = cb;
    } else if (isFunction(config)) {
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
 *
 * @param {object} config                                   Configuration
 * @returns {Promise<{result:{object}, data:{object}}>}     Results
 */
SVGSpriter.prototype.compileAsync = function(config) {
    return new Promise((resolve, reject) => {
        this.compile(config, (error, result, data) => {
            if (error) {
                return reject(error);
            }

            resolve({ result, data });
        });
    });
};

/**
 * Run the next compile task
 */
SVGSpriter.prototype._compile = function() {
    // If the shape queue is currently active return early
    if (this._queue.active || this._compileQueue.length === 0) {
        return;
    }

    const [config, cb] = this._compileQueue.shift();

    // If this is a modeless run
    if (Object.keys(config).length === 0) {
        const files = {};

        // Add intermediate SVG files
        if (this.config.shape.dest) {
            files.shapes = this._getShapeFiles(this.config.shape.dest);
            this.verbose('Returning %d intermediate SVG files', files.shapes.length);
        }

        this._logStats(files);
        cb(null, files, {});
    } else {
        const masterShapes = this._shapes.filter(shape => !shape.master);
        this.info('Compiling %d shapes...', masterShapes.length);

        // Initialize the namespace powers
        while (!this._namespacePow.length || (26 ** this._namespacePow.length < masterShapes.length)) {
            this._namespacePow.unshift(26 ** this._namespacePow.length);

            for (const shape of this._shapes) {
                shape.resetNamespace();
            }
        }

        // Sort shapes by ID
        this._shapes = this._shapes.sort(this.config.shape.sort);

        // Set the shape namespaces on all master shapes
        for (const [index, shape] of masterShapes.entries()) {
            shape.setNamespace(this._indexNamespace(index));
        }

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
};

/**
 * Return a unique namespace prefix for a shape index
 *
 * @param {number} index             Shape index
 * @returns {string}                 Namespace prefix
 */
SVGSpriter.prototype._indexNamespace = function(index) {
    let namespace = '';

    for (const namespacePow of this._namespacePow) {
        const charCode = Math.floor(index / namespacePow);
        namespace += String.fromCharCode(97 + charCode);
        index -= charCode * namespacePow;
    }

    return namespace;
};

/**
 * Layout the sprites
 *
 * @param {object} config           Layout configuration
 * @param {Function} cb             Callback
 */
SVGSpriter.prototype._layout = function(config, cb) {
    const files = {};
    const layout = new Layouter(this, config);
    const createLayoutTask = (k, m) => _cb => {
        layout.layout(files, k, m, _cb);
    };

    const tasks = [];

    for (const [mode, value] of Object.entries(config)) {
        tasks.push(createLayoutTask(mode, value.mode));
    }

    async.parallelLimit(tasks, this._limit, (error, data) => {
        cb(error, files, zipObject(Object.keys(data).map(key => data[key].key), data));
    });
};

/**
 * Return all current shapes
 *
 * @param {string} dest            Destination directory
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
 * @param {string} dest             Destination directory
 * @returns {Array}                 Shape file list
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
 * @param {object} files        Files
 */
SVGSpriter.prototype._logStats = function(files) {
    const sizes = {};
    const extensions = {};

    for (const mode of Object.values(files)) {
        for (const resource of Object.values(mode)) {
            const file = resource.relative;
            const ext = path.extname(resource.path).toUpperCase();
            extensions[ext] = (extensions[ext] || 0) + 1;
            sizes[file] = pretty(resource.contents.length);
        }
    }

    this.info('Created %s', Object.entries(extensions).map(ext => `${ext[1]} x ${ext[0].substr(1)}`).join(', '));

    const sortedSizes = Object.entries(sizes).sort(([a], [b]) => String(a) > String(b) ? 1 : -1);

    for (const [file, size] of sortedSizes) {
        this.verbose('Created %s: %s', file, size);
    }
};

/**
 * Pass info messages on to the logger
 *
 * @param {...any} args arguments
 */
SVGSpriter.prototype.info = function(...args) {
    this.config.log.info(...args);
};

/**
 * Pass verbose messages on to the logger
 *
 * @param {...any} args arguments
 */
SVGSpriter.prototype.verbose = function(...args) {
    this.config.log.verbose(...args);
};

/**
 * Pass debug messages on to the logger
 *
 * @param {...any} args arguments
 */
SVGSpriter.prototype.debug = function(...args) {
    this.config.log.debug(...args);
};

/**
 * Pass error messages on to the logger
 *
 * @param {...any} args arguments
 */
SVGSpriter.prototype.error = function(...args) {
    this.config.log.error(...args);
};

/**
 * Module export (constructor wrapper)
 *
 * @param {object} config           Configuration
 * @returns {SVGSpriter}            SVGSpriter instance
 */
module.exports = function(config = {}) {
    return new SVGSpriter(config);
};
