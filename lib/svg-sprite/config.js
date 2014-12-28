'use strict';

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/jkphl/svg-sprite
 *
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2014 Joschi Kuphal
 * @license MIT https://raw.github.com/jkphl/svg-sprite/master/LICENSE
 */

var _									= require('lodash'),
	path								= require('path'),
	yaml								= require('js-yaml'),
	fs									= require('fs'),
	winston								= require('winston'),
	defaultTransform					= ['svgo'];

/**
 * SVGSpriter configuration
 * 
 * @param {Object} config				Configuration
 */
function SVGSpriterConfig(config) {	
	this.dest							= path.resolve(config.dest || '.');
	
	// Logging
	this.log							= '';
	if ('log' in config) {
		if (config.log instanceof winston.Logger) {
			this.log					= config.log;
		} else {
			this.log					= (_.isString(config.log) && (['info', 'verbose', 'debug'].indexOf(config.log) >= 0)) ? config.log : 'info';
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
					return now.getFullYear() + '-' + now.getMonth() + '-' + now.getDate() + ' ' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
				}
			})]
		});
	}

	this.shape							= ('shape' in config) ? _.assign({}, config.shape || {}) : {};
	this.shape.spacing					= ('spacing' in this.shape) ? (this.shape.spacing || {}) : {};
	
	// Parse meta data (if configured)
	if (('meta' in this.shape) && !_.isPlainObject(this.shape.meta)) {
		var meta						= _.isString(this.shape.meta) ? path.resolve(this.shape.meta) : null,
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
		}
	} else {
		this.shape.meta					= {};
	}
	
	// Intermediate SVG destination
	this.shape.dest						= ('dest' in this.shape) ? ('' + this.shape.dest).trim() : '';
	this.shape.dest						= this.shape.dest.length ? path.resolve(this.dest, this.shape.dest) : null;
	
	// Expand spacing options to arrays
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
	
	this.svg							= ('svg' in config) ? _.assign(this.svg, config.svg || {}) : this.svg;
	
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
	
	this.mode			= _.pick(config.mode || {}, ['css', 'defs', 'symbol', 'stack', 'view']);
}

/**
 * Prototype properties
 * 
 * @type {Object} 
 */
SVGSpriterConfig.prototype = {};

/**
 * SVG options
 * 
 * @type {Object} 
 */
SVGSpriterConfig.prototype.svg = {
	doctypeDeclaration	: true,
	xmlDeclaration		: true
};

/**
 * Module export (constructor wrapper)
 * 
 * @param {Object} config				Configuration
 * @return {SVGSpriterConfig}			SVGSpriter configuration
 */
module.exports = function(config) {
	return new SVGSpriterConfig(config || {});
}