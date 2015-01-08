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

var _								= require('lodash'),
path								= require('path'),
util								= require('util'),
SVGSpriteBase						= require('./base');

/**
 * Base class for non-css sprites
 * 
 * @param {SVGSpriter} spriter		SVG spriter
 * @param {Object} config			Configuration
 * @param {Object} data				Base data
 */
function SVGSpriteStandalone(spriter, config, data) {
	SVGSpriteBase.apply(this, arguments);
	this._init();
}

/**
 * Prototype
 * 
 * @type {Object} 
 */
SVGSpriteStandalone.prototype = _.create(SVGSpriteBase.prototype, {
	constructor						: SVGSpriteStandalone
});

/**
 * Initialization (non-CSS modes)
 * 
 * @return {void}
 */
SVGSpriteStandalone.prototype._init = function() {
	
	// Prepare the CSS prefix and dimension suffix
	this.config.prefix				= this.config.prefix.trim();
	if (!(this.config.prefix.match(/\s+/g) || []).length && (this.config.prefix.indexOf('.' !== 0))) {
		this.config.prefix			= '.' + this.config.prefix;
	}
	if (!/%s/g.test(this.config.prefix.split('%%').join(''))) {
		this.config.prefix			+= '%s';
	}
	this.config.dimensions			= _.isString(this.config.dimensions) ? this.config.dimensions.trim() : '-dims';
	if (this.config.dimensions && !/%s/g.test((this.config.dimensions || '').split('%%').join(''))) {
		this.config.dimensions		= this.config.prefix + this.config.dimensions;
	}
	
	// Refine the base data
	this.data						= _.merge(this.data, this._initData({
		padding						: this._spriter.config.shape.spacing.padding,
		sprite						: path.relative(this.config.dest, this.config.sprite)
	}));
}

/**
 * Layout the sprite
 * 
 * @param {Array} files				Files
 * @param {Function} cb				Callback
 * @param {Function} extend			Extension callback
 * @return {void}
 */
SVGSpriteStandalone.prototype._layout = function(files, cb, extend) {
	
	// Refine the shape data
	var xmlDeclaration				= null,
	doctypeDeclaration				= null;
	this._spriter._shapes.forEach(function(shape, index) {
		
		// Skip non-master shapes
		if (!shape.master) {
			xmlDeclaration			= xmlDeclaration || shape.xmlDeclaration;
			doctypeDeclaration		= doctypeDeclaration || shape.doctypeDeclaration;
			_.assign(this.data.shapes[index], {
				selector			: {
					dimensions		: shape.state ? [{	
						expression	: util.format(this.config.dimensions, shape.base) + ':' + shape.state,
						raw			: util.format(this.config.dimensions, shape.base) + ':' + shape.state,
						first		: true,
						last		: false
					}, {
						expression	: util.format(this.config.dimensions, shape.base + '\\:' + shape.state),
						raw			: util.format(this.config.dimensions, shape.base + ':' + shape.state),
						first		: false,
						last		: true
					}] : [{
						expression	: util.format(this.config.dimensions, shape.base),
						raw			: util.format(this.config.dimensions, shape.base),
						first		: true,
						last		: true
					}]
				}
			});
			Object.defineProperty(this.data.shapes[index], '_svg', {
			    enumerable			: false,
			    writable			: true
			});
			this.data.shapes[index].__defineSetter__('svg', function(svg) {
				this._svg			= svg;
			});
			extend(shape, this.data.shapes[index], index);
		}
	}, this);
	
	// Remove all non-master shapes
	this.data.shapes				= _.reject(this.data.shapes, function(shape){ return !!shape.master; });
	
	// Build the sprite SVG file
	files.sprite					= this._buildSVG(xmlDeclaration || '', doctypeDeclaration || '');
	this._spriter.verbose("Created «%s» SVG sprite file", this.mode);
	
	// Build the HTML example
	this._buildHTMLExample(files, cb);
}

/**
 * Module export
 */
module.exports = SVGSpriteStandalone;