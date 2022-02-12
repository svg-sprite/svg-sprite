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

/**
 * SVGSpriter configuration
 *
 * @param {object} config                 Configuration
 */
module.exports = class SVGSpriterConfig {
    constructor(config = {}) {
    // Logging
        this.log = this._setupLogger(config);

        this.log.debug('Started logging');
        this.dest = path.resolve(config.dest || '.');

        this.log.debug('Prepared general options');
        this.shape = 'shape' in config ? ({ ...config.shape }) : {};

        let transforms = null;

        // Parse meta data (if configured)
        this._parseMetaData();

        // Parse alignment data (if configured)
        this._parseAlignmentData();

        // Register a sorting callback for shape names
        if (!('sort' in this.shape) || !isFunction(this.shape.sort)) {
            this.shape.sort = (shape1, shape2) => shape1.id === shape2.id ? 0 : (shape1.id > shape2.id ? 1 : -1);
        }

        // Intermediate SVG destination
        this.shape.dest = 'dest' in this.shape ? String(this.shape.dest).trim() : '';
        this.shape.dest = this.shape.dest.length ? path.resolve(this.dest, this.shape.dest) : null;

        // Expand spacing options to arrays
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

        // Prepare shape transforms
        if ('transform' in this.shape && Array.isArray(this.shape.transform)) {
            transforms = this.shape.transform;
        }

        // Fallback: Use default transformations
        if (transforms === null) {
            transforms = defaultShapeTransform;
        }

        this.shape.transform = [];

        if (Array.isArray(transforms)) {
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
                            this.shape.transform.push([transformer, tconfig === true ? {} : tconfig]);
                            break;
                        }
                    }
                }
            }
        }

        this.log.debug('Prepared `shape` options');

        this.svg = { ...defaultSVGConfig };
        this.svg = 'svg' in config ? Object.assign(this.svg, config.svg || {}) : this.svg;
        this.svg.xmlDeclaration = this.svg.xmlDeclaration || false;
        this.svg.doctypeDeclaration = this.svg.doctypeDeclaration || false;
        this.svg.dimensionAttributes = this.svg.dimensionAttributes || false;
        this.svg.rootAttributes = this.svg.rootAttributes || {};
        this.svg.precision = Math.max(-1, Number.parseInt(this.svg.precision || -1, 10));

        // Prepare post-processing transforms
        transforms = [];

        if ('transform' in this.svg) {
            if (isFunction(this.svg.transform)) {
                transforms.push(this.svg.transform);
            } else if (Array.isArray(this.svg.transform)) {
                for (let t = 0; t < this.svg.transform.length; t++) {
                    if (isFunction(this.svg.transform[t])) {
                        transforms.push(this.svg.transform[t]);
                    }
                }
            }
        }

        this.svg.transform = transforms;
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
     * @returns {object}
     */
    _setupLogger(config) {
        this.log = '';

        if ('log' in config) {
            if (isWinstonLogger(config.log)) {
                this.log = config.log;
            } else if (isString(config.log) && ['info', 'verbose', 'debug'].includes(config.log)) {
                this.log = config.log;
            } else if (config.log) {
                this.log = 'info';
            }
        }

        if (isString(this.log)) {
            this.log = winston.createLogger({
                transports: [new winston.transports.Console({
                    level: this.log || 'info',
                    silent: !this.log.length,
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

        return this.log;
    }

    /**
     * Parse meta data
     *
     * @returns {object}
     */
    _parseMetaData() {
        if ('meta' in this.shape && !isPlainObject(this.shape.meta)) {
            let meta = isString(this.shape.meta) ? path.resolve(this.shape.meta) : null;
            const metaFile = meta;
            let stat = meta ? fs.lstatSync(meta) : null;
            this.shape.meta = {};

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
                        this.shape.meta[path.join(path.dirname(m), path.basename(m, '.svg'))] = { title, description };
                    }
                }

                this.log.debug('Processed meta data file "%s"', path.basename(metaFile));
            }
        } else {
            this.shape.meta = {};
        }

        return this.shape.meta;
    }

    /**
     * Parse alignment data
     *
     * @returns {object}
     */
    _parseAlignmentData() {
        if ('align' in this.shape && !isPlainObject(this.shape.align)) {
            let align = isString(this.shape.align) ? path.resolve(this.shape.align) : null;
            const alignFile = align;
            let stat = align ? fs.lstatSync(align) : null;
            this.shape.align = { '*': { '%s': 0 } };

            if (stat) {
                if (stat.isSymbolicLink()) {
                    align = fs.readlinkSync(align);
                    stat = fs.statSync(align);
                }

                align = stat.isFile() ? fs.readFileSync(align, 'utf8') : null;
                align = align ? yaml.load(align) : {};

                for (const a in align) {
                    if (isPlainObject(align[a]) && Object.keys(align[a]).length) {
                        this.shape.align[a] = this.shape.align[a] || {};
                        for (const tmpl in align[a]) {
                            const template = tmpl.length ? (tmpl.includes('%s') ? tmpl : `%s${tmpl}`) : '%s';
                            this.shape.align[path.join(path.dirname(a), path.basename(a, '.svg'))][template] = Math.max(0, Math.min(1, Number.parseFloat(align[a][tmpl])));
                        }
                    }
                }

                this.log.debug('Processed alignment data file "%s"', path.basename(alignFile));
            }
        } else {
            this.shape.align = { '*': { '%s': 0 } };
        }

        return this.shape.align;
    }
};
