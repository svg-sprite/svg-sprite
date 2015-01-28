'use strict';

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/jkphl/svg-sprite
 *
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2015 Joschi Kuphal
 * @license MIT https://raw.github.com/jkphl/svg-sprite/master/LICENSE
 */

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
	 * Default list of transformations
	 * 
	 * @type {Array}
	 */
	defaultTransform					= ['svgo'],
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
		 * Add width and height attributes to the sprite SVG
		 * 
		 * @type {Boolean}
		 */
		dimensionAttributes				: true
	};

/**
 * SVGSpriter configuration
 * 
 * @param {Object} config				Configuration
 */
function SVGSpriterConfig(config) {

	// Logging
	this.log							= '';
	if ('log' in config) {
		if ((config.log instanceof winston.Logger) || (_.isObject(config.log) && !_.isUndefined(config.log.level) && _.isObject(config.log.transports) && _.isFunction(config.log.log))) {
			this.log					= config.log;
		} else {
			this.log					= (_.isString(config.log) && (['info', 'verbose', 'debug'].indexOf(config.log) >= 0)) ? config.log : 'info';
		}
	}
	if (_.isString(this.log)) {
		var twoDigits					= function(i) {
			return ('0' + i).slice(-2);
		};
		this.log						= new winston.Logger({
			transports					: [new (winston.transports.Console)({
				level					: this.log || 'info',
				silent					: !this.log.length,
				colorize				: true,
				prettyPrint				: true,
				timestamp				: function() {
					var now				= new Date();
					return now.getFullYear() + '-' + twoDigits(now.getMonth()) + '-' + twoDigits(now.getDate()) + ' ' + twoDigits(now.getHours()) + ':' + twoDigits(now.getMinutes()) + ':' + twoDigits(now.getSeconds());
				}
			})]
		});
	}
	
	this.log.debug('Started logging');

	this.dest							= path.resolve(config.dest || '.');
	
	this.log.debug('Prepared general options');
	
	this.shape							= ('shape' in config) ? _.assign({}, config.shape || {}) : {};
	
	// Parse meta data (if configured)
	if (('meta' in this.shape) && !_.isPlainObject(this.shape.meta)) {
		var meta						= _.isString(this.shape.meta) ? path.resolve(this.shape.meta) : null,
		metaFile						= meta,
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
		alignFile						= align,
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
					for (var t in align[a]) {
						var template	= t.length ? ((t.indexOf('%s') >= 0) ? t : ('%s' + t)) : '%s';
						this.shape.align[path.join(path.dirname(a), path.basename(a, '.svg'))][template] = Math.max(0, Math.min(1, parseFloat(align[a][t], 10)));
					}
				}
			}
			this.log.debug('Processed alignment data file "%s"', path.basename(alignFile));
		}
	} else {
		this.shape.align				= {'*': {'%s': 0}};
	}
	
	// Intermediate SVG destination
	this.shape.dest						= ('dest' in this.shape) ? ('' + this.shape.dest).trim() : '';
	this.shape.dest						= this.shape.dest.length ? path.resolve(this.dest, this.shape.dest) : null;
	
	// Expand spacing options to arrays
	this.shape.spacing					= ('spacing' in this.shape) ? (this.shape.spacing || {}) : {};
	['padding'].forEach(function(property){
		if (!_.isArray(this.spacing[property])) {
			var spacing					= Math.max(0, parseInt(this.spacing[property] || 0, 10));
			this.spacing[property]		= {top: spacing, right: spacing, bottom: spacing, left: spacing};
		} else {
			var spacing					= this.spacing[property].map(function(n){ return Math.max(0, n); });
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
	
	this.log.debug('Prepared `shape` options');
	
	this.svg							= _.clone(defaultSVGConfig);
	this.svg							= ('svg' in config) ? _.assign(this.svg, config.svg || {}) : this.svg;
	this.svg.xmlDeclaration				= this.svg.xmlDeclaration || false;
	this.svg.doctypeDeclaration			= this.svg.doctypeDeclaration || false;
	this.svg.dimensionAttributes		= this.svg.dimensionAttributes || false;
	
	this.log.debug('Prepared `svg` options');
	
	this.transform						= [];
	var transforms						= config.transform || defaultTransform;
	if (_.isArray(transforms)) {
		transformers:	for (var t = 0; t < transforms.length; ++t) {
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
						this.transform.push([transformer, (tconfig === true) ? {} : tconfig]);
						continue transformers;
					}
				}
			}
		}
	}
	this.log.debug('Prepared `transform` options');
	
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
	var filtered						= {},
	mode								= null;
	config								= config || {};
	for (var m in config) {
		var modeConfig					= _.isPlainObject(config[m]) ? config[m] : ((config[m] === true) ? {} : null);
		if ((modeConfig !== null) && (spriteTypes.indexOf(modeConfig.mode || m) >= 0)) {
			filtered[m]					= modeConfig;
			filtered[m].mode			= modeConfig.mode || m;
		}
	}
	return filtered;
}

/**
 * Module export (constructor wrapper)
 * 
 * @param {Object} config				Configuration
 * @return {SVGSpriterConfig}			SVGSpriter configuration
 */
module.exports = function(config) {
	return new SVGSpriterConfig(config || {});
}