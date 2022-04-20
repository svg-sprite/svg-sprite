'use strict';

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/svg-sprite/svg-sprite
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2018 Joschi Kuphal
 * @license MIT https://github.com/svg-sprite/svg-sprite/blob/main/LICENSE
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const winston = require('winston');
const { isFunction, isObject, isPlainObject, isString } = require('./utils/index.js');

/**
 * Sprite types
 *
 * @type {Set<string>}
 */
const spriteTypes = new Set(['css', 'view', 'defs', 'symbol', 'stack']);

/**
 * List of default shape transformations
 *
 * @type {Array}
 */
const defaultShapeTransform = ['svgo'];

/**
 * Default SVG configuration
 *
 * @type {object}
 */
const defaultSVGConfig = {
    /**
     * Add a DOCTYPE declaration to SVG documents
     *
     * @type {boolean}
     */
    doctypeDeclaration: true,
    /**
     * Add an XML declaration to SVG documents
     *
     * @type {boolean}
     */
    xmlDeclaration: true,
    /**
     * Namespace IDs in SVG documents to avoid ID clashes
     *
     * @type {boolean}
     */
    namespaceIDs: true,
    /**
     * Prefix the usual alphabetical Namespace IDs with a custom string
     *
     * @type {string}
     */
    namespaceIDPrefix: '',
    /**
     * Namespace CSS class names in SVG documents to avoid CSS clashes
     *
     * @type {boolean}
     */
    namespaceClassnames: true,
    /**
     * Add width and height attributes to the sprite SVG
     *
     * @type {boolean}
     */
    dimensionAttributes: true,
    /**
     * Additional root attributes for the outermost <svg> element
     *
     * @type {object}
     */
    rootAttributes: {},
    /**
     * Floating point precision for CSS positioning values
     *
     * @type {number}
     */
    precision: -1
};

/**
 * @param {any} logger  probable logger
 * @returns {boolean}   result
 */
const isWinstonLogger = logger => {
    return (
        isObject(logger) &&
        logger.level !== undefined &&
        Array.isArray(logger.transports) &&
        isFunction(logger.log)
    );
};

module.exports = class SVGSpriterConfig {
    /**
     * SVGSpriter configuration
     *
     * @param {object} config                 Configuration
     */
    constructor(config = {}) {
        // Logging
        this.log = this._setupLogger(config);

        this.log.debug('Started logging');
        this.dest = path.resolve(config.dest || '.');

        this.log.debug('Prepared general options');
        this.shape = 'shape' in config ? ({ ...config.shape }) : {};

        // Parse meta data (if configured)
        this.shape.meta = this._getMetaData();

        // Parse alignment data (if configured)
        this.shape.align = this._getAlignmentData();

        // Register a sorting callback for shape names
        if (!('sort' in this.shape) || !isFunction(this.shape.sort)) {
            this.shape.sort = (shape1, shape2) => shape1.id === shape2.id ? 0 : (shape1.id > shape2.id ? 1 : -1);
        }

        this._prepareShape();
        this.log.debug('Prepared `shape` options');

        this.svg = this._prepareSVG(config);
        this.log.debug('Prepared `svg` options');

        this.mode = this.filter(config.mode);
        this.log.debug('Prepared `mode` options');

        this.variables = { ...config.variables };
        this.log.debug('Prepared `variables` options');
        this.log.verbose('Initialized spriter configuration');
    }

    /**
     * Pick out the relevant mode options out of a configuration object
     *
     * @param {object} config                 Configuration object
     * @returns {object}                      Mode relevant options
     */
    filter(config = {}) {
        const filtered = {};

        for (const m in config) {
            let modeConfig = null;

            if (isPlainObject(config[m])) {
                modeConfig = config[m];
            } else if (config[m] === true) {
                modeConfig = {};
            }

            if (modeConfig !== null && spriteTypes.has(modeConfig.mode || m)) {
                filtered[m] = modeConfig;
                filtered[m].mode = modeConfig.mode || m;
            }
        }

        return filtered;
    }

    /**
     * Set up logger
     *
     * @param {object} config                 Configuration object
     * @returns {object} Winston logger
     */
    _setupLogger(config) {
        let log = '';

        if ('log' in config) {
            if (isWinstonLogger(config.log)) {
                log = config.log;
            } else if (isString(config.log) && ['info', 'verbose', 'debug'].includes(config.log)) {
                log = config.log;
            } else if (config.log) {
                log = 'info';
            }
        }

        if (isWinstonLogger(log)) {
            return log;
        }

        return winston.createLogger({
            transports: [new winston.transports.Console({
                level: log || 'info',
                silent: !log.length,
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.timestamp({
                        format: 'YYYY-MM-DD HH:MM:ss.SSS'
                    }),
                    winston.format.splat(),
                    winston.format.printf(info => `${info.timestamp} - ${info.level}: ${info.message}`)
                )
            })]
        });
    }

    /**
     * Creating meta data
     *
     * @returns {object} updated meta data
     * @private
     */
    _getMetaData() {
        if (!('meta' in this.shape && !isPlainObject(this.shape.meta))) {
            return {};
        }

        const metaFile = isString(this.shape.meta) ? path.resolve(this.shape.meta) : null;
        let meta = metaFile;
        let stat = meta ? fs.lstatSync(meta) : null;
        const result = {};

        if (stat) {
            if (stat.isSymbolicLink()) {
                meta = fs.readlinkSync(meta);
                stat = fs.statSync(meta);
            }

            meta = stat.isFile() ? fs.readFileSync(meta, 'utf8') : null;
            meta = meta ? yaml.load(meta) : {};
            for (const m in meta) {
                if (isPlainObject(meta[m])) {
                    const { title, description } = meta[m];
                    result[path.join(path.dirname(m), path.basename(m, '.svg'))] = { title, description };
                }
            }

            this.log.debug('Processed meta data file "%s"', path.basename(metaFile));
        }

        return result;
    }

    /**
     * Create alignment data
     *
     * @returns {object} updated align data
     * @private
     */
    _getAlignmentData() {
        const alignmentData = { '*': { '%s': 0 } };

        if (!('align' in this.shape && !isPlainObject(this.shape.align))) {
            return alignmentData;
        }

        const alignFile = isString(this.shape.align) ? path.resolve(this.shape.align) : null;
        let align = alignFile;
        let stat = align ? fs.lstatSync(align) : null;

        if (stat) {
            if (stat.isSymbolicLink()) {
                align = fs.readlinkSync(align);
                stat = fs.statSync(align);
            }

            align = stat.isFile() ? fs.readFileSync(align, 'utf8') : null;
            align = align ? yaml.load(align) : {};

            for (const a in align) {
                if (isPlainObject(align[a]) && Object.keys(align[a]).length) {
                    alignmentData[a] = alignmentData[a] || {};
                    for (const tmpl in align[a]) {
                        const template = tmpl.length ? (tmpl.includes('%s') ? tmpl : `%s${tmpl}`) : '%s';
                        alignmentData[path.join(path.dirname(a), path.basename(a, '.svg'))][template] = Math.max(0, Math.min(1, Number.parseFloat(align[a][tmpl])));
                    }
                }
            }

            this.log.debug('Processed alignment data file "%s"', path.basename(alignFile));
        }

        return alignmentData;
    }

    /**
     * Preparing shape
     *
     * @private
     */
    _prepareShape() {
        // Intermediate SVG destination
        this.shape.dest = 'dest' in this.shape ? String(this.shape.dest).trim() : '';
        this.shape.dest = this.shape.dest.length ? path.resolve(this.dest, this.shape.dest) : null;

        // Expand spacing options to arrays
        this.shape.spacing = this._setupSpacing();

        this.shape.transform = this._prepareShapeTransform();
    }

    /**
     * Set up spacing
     *
     * @returns {object} updated spacing
     * @private
     */
    _setupSpacing() {
        this.shape.spacing = 'spacing' in this.shape ? (this.shape.spacing || {}) : {};

        ['padding'].forEach(function(property) {
            let spacing;

            if (!Array.isArray(this.spacing[property])) {
                spacing = Math.max(0, Number.parseInt(this.spacing[property] || 0, 10));
                this.spacing[property] = { top: spacing, right: spacing, bottom: spacing, left: spacing };
            } else {
                spacing = this.spacing[property].map(n => Math.max(0, n));
                switch (spacing.length) {
                    case 1:
                        spacing = { top: spacing[0], right: spacing[0], bottom: spacing[0], left: spacing[0] };
                        break;
                    case 2:
                        spacing = { top: spacing[0], right: spacing[1], bottom: spacing[0], left: spacing[1] };
                        break;
                    case 3:
                        spacing = { top: spacing[0], right: spacing[1], bottom: spacing[2], left: spacing[1] };
                        break;
                    default:
                        spacing = { top: spacing[0], right: spacing[1], bottom: spacing[2], left: spacing[3] };
                        break;
                }

                this.spacing[property] = spacing;
            }
        }, this.shape);

        return this.shape.spacing;
    }

    /**
     * Preparing shape transforms
     *
     * @returns {Array<Array>} array of transform configurations
     * @private
     */
    _prepareShapeTransform() {
        let transforms = null;
        // Prepare shape transforms
        if ('transform' in this.shape && Array.isArray(this.shape.transform)) {
            transforms = this.shape.transform;
        }

        // Fallback: Use default transformations
        if (transforms === null) {
            transforms = defaultShapeTransform;
        }

        const result = [];

        if (!Array.isArray(transforms)) {
            return result;
        }

        for (let t = 0; t < transforms.length; t++) {
            if (isString(transforms[t])) {
                transforms[t] = JSON.parse(`{"${transforms[t]}":true}`);
            } else if (isFunction(transforms[t])) {
                const custom = {};
                custom.custom = transforms[t];
                transforms[t] = custom;
            }

            if (isObject(transforms[t])) {
                for (const transformer in transforms[t]) {
                    const tconfig = transforms[t][transformer];
                    if (tconfig === true || isObject(tconfig) || isFunction(tconfig)) {
                        result.push([transformer, tconfig === true ? {} : tconfig]);
                        break;
                    }
                }
            }
        }

        return result;
    }

    /**
     * Preparing svg
     *
     * @param {object} config  initial configuration
     * @returns {object}       SVG Object
     * @private
     */
    _prepareSVG(config) {
        let svg = { ...defaultSVGConfig };
        svg = 'svg' in config ? Object.assign(svg, config.svg || {}) : svg;
        svg.xmlDeclaration = svg.xmlDeclaration || false;
        svg.doctypeDeclaration = svg.doctypeDeclaration || false;
        svg.dimensionAttributes = svg.dimensionAttributes || false;
        svg.rootAttributes = svg.rootAttributes || {};
        svg.precision = Math.max(-1, Number.parseInt(svg.precision || -1, 10));

        // Prepare post-processing transforms
        svg.transform = this._prepareAndProcessTransforms(svg);
        return svg;
    }

    /**
     * Preparing svg transforms
     *
     * @param {object} svg         SVG object
     * @returns {Array<Function>}  Array of svg transform functions
     * @private
     */
    _prepareAndProcessTransforms(svg) {
        const transforms = [];

        if ('transform' in svg) {
            if (isFunction(svg.transform)) {
                transforms.push(svg.transform);
            } else if (Array.isArray(svg.transform)) {
                for (let t = 0; t < svg.transform.length; t++) {
                    if (isFunction(svg.transform[t])) {
                        transforms.push(svg.transform[t]);
                    }
                }
            }
        }

        return transforms;
    }
};
