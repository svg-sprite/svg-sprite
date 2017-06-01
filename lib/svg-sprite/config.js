'use strict';

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/jkphl/svg-sprite
 *
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2016 Joschi Kuphal
 * @license MIT https://raw.github.com/jkphl/svg-sprite/master/LICENSE
 */

var dateFormat = require('dateformat');

var _									= require('lodash'),
	path								= require('path'),
	yaml								= require('js-yaml'),
	fs									= require('fs'),
	winston								= require('winston'),
	/**
	 * Sprite types
	 *
	 * @type {Array}
	 */
	spriteTypes							= ['css', 'view', 'defs', 'symbol', 'stack'],
	/**
	 * List of default shape transformations
	 *
	 * @type {Array}
	 */
	defaultShapeTransform				= ['svgo'],
	/**
	 * Default SVG configuration
	 *
	 * @type {Object}
	 */
	defaultSVGConfig					= {
		/**
		 * Add a DOCTYPE declaration to SVG documents
		 *
		 * @type {Boolean
		 */
		doctypeDeclaration				: true,
		/**
		 * Add an XML declaration to SVG documents
		 *
		 * @type {Boolean}
		 */
		xmlDeclaration					: true,
		/**
		 * Namespace IDs in SVG documents to avoid ID clashes
		 *
		 * @type {Boolean}
		 */
		namespaceIDs					: true,
		/**
		 * Namespace CSS class names in SVG documents to avoid CSS clashes
		 *
		 * @type {Boolean}
		 */
		namespaceClassnames	      		: true,
		/**
		 * Add width and height attributes to the sprite SVG
		 *
		 * @type {Boolean}
		 */
		dimensionAttributes				: true,
		/**
		 * Additional root attributes for the outermost <svg> element
		 *
		 * @type {Boolean}
		 */
		rootAttributes				    : {},
		/**
		 * Floating point precision for CSS positioning values
		 *
		 * @type {Number}
		 */
		precision                       : -1
	};

/**
 * SVGSpriter configuration
 *
 * @param {Object} config				Configuration
 */
function SVGSpriterConfig(config) {

	// Logging
	this.log							= '';
	if ('log' in config){
		if ((config.log instanceof winston.Logger) || (_.isObject(config.log) && !_.isUndefined(config.log.level) && _.isObject(config.log.transports) && _.isFunction(config.log.log))) {
			this.log					= config.log;
		} else {
			this.log					= (_.isString(config.log) && (['info', 'verbose', 'debug'].indexOf(config.log) >= 0)) ? config.log : (config.log ? 'info' : '');
		}
	}
	if (_.isString(this.log)) {
		this.log						= new winston.Logger({
			transports					: [new (winston.transports.Console)({
				level					: this.log || 'info',
				silent					: !this.log.length,
				colorize				: true,
				prettyPrint				: true,
				timestamp				: function() {
					var now				= new Date();
					return dateFormat(now, 'yyyy-mm-dd HH:MM:ss');
				}
			})]
		});
	}

	this.log.debug('Started logging');

	this.dest							= path.resolve(config.dest || '.');

	this.log.debug('Prepared general options');

	this.shape							= ('shape' in config) ? _.assign({}, config.shape || {}) : {};

	var stat, t, transforms = null;

	// Parse meta data (if configured)
	if (('meta' in this.shape) && !_.isPlainObject(this.shape.meta)) {
		var meta						= _.isString(this.shape.meta) ? path.resolve(this.shape.meta) : null,
		metaFile						= meta;
		stat							= meta ? fs.lstatSync(meta) : null;
		this.shape.meta					= {};
		if (stat) {
			if (stat.isSymbolicLink()) {
				meta					= fs.readlinkSync(meta);
				stat					= fs.statSync(meta);
			}
			meta						= stat.isFile() ? fs.readFileSync(meta, 'utf8') : null;
			meta						= meta ? yaml.safeLoad(meta) : {};
			for (var m in meta) {
				if (_.isPlainObject(meta[m])) {
					this.shape.meta[path.join(path.dirname(m), path.basename(m, '.svg'))] = _.pick(meta[m], ['title', 'description']);
				}
			}
			this.log.debug('Processed meta data file "%s"', path.basename(metaFile));
		}
	} else {
		this.shape.meta					= {};
	}

	// Parse alignment data (if configured)
	if (('align' in this.shape) && !_.isPlainObject(this.shape.align)) {
		var align						= _.isString(this.shape.align) ? path.resolve(this.shape.align) : null,
		alignFile						= align;
		stat							= align ? fs.lstatSync(align) : null;
		this.shape.align				= {'*': {'%s': 0}};
		if (stat) {
			if (stat.isSymbolicLink()) {
				align					= fs.readlinkSync(align);
				stat					= fs.statSync(align);
			}
			align						= stat.isFile() ? fs.readFileSync(align, 'utf8') : null;
			align						= align ? yaml.safeLoad(align) : {};
			for (var a in align) {
				if (_.isPlainObject(align[a]) && Object.keys(align[a]).length) {
					this.shape.align[a]	= this.shape.align[a] || {};
					for (var tmpl in align[a]) {
						var template	= tmpl.length ? ((tmpl.indexOf('%s') >= 0) ? tmpl : ('%s' + tmpl)) : '%s';
						this.shape.align[path.join(path.dirname(a), path.basename(a, '.svg'))][template] = Math.max(0, Math.min(1, parseFloat(align[a][tmpl], 10)));
					}
				}
			}
			this.log.debug('Processed alignment data file "%s"', path.basename(alignFile));
		}
	} else {
		this.shape.align				= {'*': {'%s': 0}};
	}

	// Register a sorting callback for shape names
	if (!('sort' in this.shape) || !_.isFunction(this.shape.sort)) {
		this.shape.sort					= function(shape1, shape2){
			return (shape1.id === shape2.id) ? 0 : ((shape1.id > shape2.id) ? 1 : -1);
		};
	}

	// Intermediate SVG destination
	this.shape.dest						= ('dest' in this.shape) ? ('' + this.shape.dest).trim() : '';
	this.shape.dest						= this.shape.dest.length ? path.resolve(this.dest, this.shape.dest) : null;

	// Expand spacing options to arrays
	this.shape.spacing					= ('spacing' in this.shape) ? (this.shape.spacing || {}) : {};
	['padding'].forEach(function(property){
		var spacing;

		if (!_.isArray(this.spacing[property])) {
			spacing						= Math.max(0, parseInt(this.spacing[property] || 0, 10));
			this.spacing[property]		= {top: spacing, right: spacing, bottom: spacing, left: spacing};
		} else {
			spacing						= this.spacing[property].map(function(n){ return Math.max(0, n); });
			switch(spacing.length) {
				case 1:
					spacing				= {top: spacing[0], right: spacing[0], bottom: spacing[0], left: spacing[0]};
					break;
				case 2:
					spacing				= {top: spacing[0], right: spacing[1], bottom: spacing[0], left: spacing[1]};
					break;
				case 3:
					spacing				= {top: spacing[0], right: spacing[1], bottom: spacing[2], left: spacing[1]};
					break;
				default:
					spacing				= {top: spacing[0], right: spacing[1], bottom: spacing[2], left: spacing[3]};
					break;
			}
			this.spacing[property]		= spacing;
		}
	}, this.shape);

	// Prepare shape transforms
	if (('transform' in this.shape) && _.isArray(this.shape.transform)) {
		transforms						= this.shape.transform;
	}

	// Alternatively use deprecated top-level transforms
	// TODO: Remove in future version
	if ('transform' in config) {
		this.log.warn('The top-level `transform` option is deprecated and will be removed in a future version. Please use `shape.transform` instead.');

		if ((transforms === null) && _.isArray(config.transform)) {
			transforms					= config.transform;
		}
	}

	// Fallback: Use default transformations
	if (transforms === null) {
		transforms						= defaultShapeTransform;
	}

	this.shape.transform				= [];
	if (_.isArray(transforms)) {
		transformers: for (t = 0; t < transforms.length; ++t) {
			if (_.isString(transforms[t])) {
				transforms[t]			= JSON.parse('{"' + transforms[t] + '":true}');
			} else if (_.isFunction(transforms[t])) {
				var custom				= {};
				custom.custom			= transforms[t];
				transforms[t]			= custom;
			}
			if (_.isObject(transforms[t])) {
				for (var transformer in transforms[t]) {
					var tconfig			= transforms[t][transformer];
					if ((tconfig === true) || _.isObject(tconfig) || _.isFunction(tconfig)) {
						this.shape.transform.push([transformer, (tconfig === true) ? {} : tconfig]);
						continue transformers;
					}
				}
			}
		}
	}

	this.log.debug('Prepared `shape` options');

	this.svg							= _.clone(defaultSVGConfig);
	this.svg							= ('svg' in config) ? _.assign(this.svg, config.svg || {}) : this.svg;
	this.svg.xmlDeclaration				= this.svg.xmlDeclaration || false;
	this.svg.doctypeDeclaration			= this.svg.doctypeDeclaration || false;
	this.svg.dimensionAttributes		= this.svg.dimensionAttributes || false;
	this.svg.rootAttributes		        = this.svg.rootAttributes || {};
	this.svg.precision                  = Math.max(-1, parseInt(this.svg.precision || -1));

	// Prepare post-processing transforms
	transforms							= [];
	if ('transform' in this.svg) {
		if (_.isFunction(this.svg.transform)) {
			transforms.push(this.svg.transform);
		} else if (_.isArray(this.svg.transform)) {
			for (t = 0; t < this.svg.transform.length; ++t) {
				if (_.isFunction(this.svg.transform[t])) {
					transforms.push(this.svg.transform[t]);
				}
			}
		}
	}
	this.svg.transform					= transforms;

	this.log.debug('Prepared `svg` options');

	this.mode							= this.filter(config.mode);

	this.log.debug('Prepared `mode` options');

	this.variables						= _.extend({}, config.variables);

	this.log.debug('Prepared `variables` options');

	this.log.verbose('Initialized spriter configuration');
}

/**
 * Pick out the relevant mode options out of a configuration object
 *
 * @param {Object} config				Configuration object
 * @return {Object}						Mode relevant options
 */
SVGSpriterConfig.prototype.filter = function(config) {
	var filtered						= {};
	config								= config || {};
	for (var m in config) {
		var modeConfig					= _.isPlainObject(config[m]) ? config[m] : ((config[m] === true) ? {} : null);
		if ((modeConfig !== null) && (spriteTypes.indexOf(modeConfig.mode || m) >= 0)) {
			filtered[m]					= modeConfig;
			filtered[m].mode			= modeConfig.mode || m;
		}
	}
	return filtered;
};

/**
 * Module export (constructor wrapper)
 *
 * @param {Object} config				Configuration
 * @return {SVGSpriterConfig}			SVGSpriter configuration
 */
module.exports = function(config) {
	return new SVGSpriterConfig(config || {});
};
