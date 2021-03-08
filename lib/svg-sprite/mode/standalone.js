'use strict';

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/svg-sprite/svg-sprite
 *
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2018 Joschi Kuphal
 * @license MIT https://github.com/svg-sprite/svg-sprite/blob/master/LICENSE.txt
 */

var _								= require('lodash'),
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
	SVGSpriteBase.apply(this, [spriter, config, data]);
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

	// Prepare the dimension suffix
	this.config.dimensions			= _.isString(this.config.dimensions) ? this.config.dimensions.trim() : '-dims';
	if (this.config.dimensions) {
		this.config.dimensions		= /%s/g.test((this.config.dimensions || '').split('%%').join('')) ? util.format(this.config.dimensions, this.config.prefix) : (this.config.prefix + this.config.dimensions);
	}

	this.data.inline				= !!this.config.inline;
};

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
			Object.assign(this.data.shapes[index], {
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
	this.data.shapes = this.data.shapes.filter(function (shape) { return !shape.master; });

	// Build the sprite SVG file
	files.sprite					= this._buildSVG(xmlDeclaration || '', doctypeDeclaration || '');
	this._spriter.verbose('Created «%s» SVG sprite file («%s» mode)', this.key, this.mode);

	// Build the configured CSS resources
	this._buildCSSResources(files, function(error) {

		// In case of errors: Break
		if (error) {
			cb(error);

		// Else: Build the HTML example
		} else {
			this._buildHTMLExample(files, cb);
		}
	}.bind(this));
};

/**
 * Module export
 */
module.exports = SVGSpriteStandalone;
