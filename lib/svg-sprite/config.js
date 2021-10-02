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

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const yaml = require('js-yaml');
const winston = require('winston');

/**
 * Sprite types
 *
 * @type {Array}
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
 * @type {Object}
 */
const defaultSVGConfig = {
    /**
     * Add a DOCTYPE declaration to SVG documents
     *
     * @type {Boolean}
     */
    doctypeDeclaration: true,
    /**
     * Add an XML declaration to SVG documents
     *
     * @type {Boolean}
     */
    xmlDeclaration: true,
    /**
     * Namespace IDs in SVG documents to avoid ID clashes
     *
     * @type {Boolean}
     */
    namespaceIDs: true,
    /**
     * Prefix the usual alphabetical Namespace IDs with a custom string
     *
     * @type {Boolean}
     */
    namespaceIDPrefix: '',
    /**
     * Namespace CSS class names in SVG documents to avoid CSS clashes
     *
     * @type {Boolean}
     */
    namespaceClassnames: true,
    /**
     * Add width and height attributes to the sprite SVG
     *
     * @type {Boolean}
     */
    dimensionAttributes: true,
    /**
     * Additional root attributes for the outermost <svg> element
     *
     * @type {Object}
     */
    rootAttributes: {},
    /**
     * Floating point precision for CSS positioning values
     *
     * @type {Number}
     */
    precision: -1
};

/**
 * SVGSpriter configuration
 *
 * @param {Object} config                 Configuration
 */
function SVGSpriterConfig(config) {
    // Logging
    this.log = '';

    if ('log' in config) {
        if (config.log instanceof winston.Logger || (_.isObject(config.log) && config.log.level !== undefined && _.isObject(config.log.transports) && _.isFunction(config.log.log))) {
            this.log = config.log;
        } else {
            this.log = _.isString(config.log) && ['info', 'verbose', 'debug'].includes(config.log) ? config.log : (config.log ? 'info' : '');
        }
    }

    if (_.isString(this.log)) {
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

    this.log.debug('Started logging');
    this.dest = path.resolve(config.dest || '.');

    this.log.debug('Prepared general options');
    this.shape = 'shape' in config ? ({ ...config.shape }) : {};

    let transforms = null;

    // Parse meta data (if configured)
    if ('meta' in this.shape && !_.isPlainObject(this.shape.meta)) {
        let meta = _.isString(this.shape.meta) ? path.resolve(this.shape.meta) : null;
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
                if (_.isPlainObject(meta[m])) {
                    this.shape.meta[path.join(path.dirname(m), path.basename(m, '.svg'))] = _.pick(meta[m], ['title', 'description']);
                }
            }

            this.log.debug('Processed meta data file "%s"', path.basename(metaFile));
        }
    } else {
        this.shape.meta = {};
    }

    // Parse alignment data (if configured)
    if ('align' in this.shape && !_.isPlainObject(this.shape.align)) {
        let align = _.isString(this.shape.align) ? path.resolve(this.shape.align) : null;
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
                if (_.isPlainObject(align[a]) && Object.keys(align[a]).length) {
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

    // Register a sorting callback for shape names
    if (!('sort' in this.shape) || !_.isFunction(this.shape.sort)) {
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
            if (_.isString(transforms[t])) {
                transforms[t] = JSON.parse(`{"${transforms[t]}":true}`);
            } else if (_.isFunction(transforms[t])) {
                const custom = {};
                custom.custom = transforms[t];
                transforms[t] = custom;
            }

            if (_.isObject(transforms[t])) {
                for (const transformer in transforms[t]) {
                    const tconfig = transforms[t][transformer];
                    if (tconfig === true || _.isObject(tconfig) || _.isFunction(tconfig)) {
                        this.shape.transform.push([transformer, tconfig === true ? {} : tconfig]);
                        break;
                    }
                }
            }
        }
    }

    this.log.debug('Prepared `shape` options');

    this.svg = _.clone(defaultSVGConfig);
    this.svg = 'svg' in config ? Object.assign(this.svg, config.svg || {}) : this.svg;
    this.svg.xmlDeclaration = this.svg.xmlDeclaration || false;
    this.svg.doctypeDeclaration = this.svg.doctypeDeclaration || false;
    this.svg.dimensionAttributes = this.svg.dimensionAttributes || false;
    this.svg.rootAttributes = this.svg.rootAttributes || {};
    this.svg.precision = Math.max(-1, Number.parseInt(this.svg.precision || -1, 10));

    // Prepare post-processing transforms
    transforms = [];

    if ('transform' in this.svg) {
        if (_.isFunction(this.svg.transform)) {
            transforms.push(this.svg.transform);
        } else if (Array.isArray(this.svg.transform)) {
            for (let t = 0; t < this.svg.transform.length; t++) {
                if (_.isFunction(this.svg.transform[t])) {
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
 * @param {Object} config                 Configuration object
 * @return {Object}                       Mode relevant options
 */
SVGSpriterConfig.prototype.filter = function(config) {
    const filtered = {};
    config = config || {};

    for (const m in config) {
        const modeConfig = _.isPlainObject(config[m]) ? config[m] : (config[m] === true ? {} : null);

        if (modeConfig !== null && spriteTypes.has(modeConfig.mode || m)) {
            filtered[m] = modeConfig;
            filtered[m].mode = modeConfig.mode || m;
        }
    }

    return filtered;
};

/**
 * Module export (constructor wrapper)
 *
 * @param {Object} config                 Configuration
 * @return {SVGSpriterConfig}             SVGSpriter configuration
 */
module.exports = function(config) {
    return new SVGSpriterConfig(config || {});
};
