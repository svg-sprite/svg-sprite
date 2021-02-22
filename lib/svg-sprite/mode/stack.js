'use strict';

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/jkphl/svg-sprite
 *
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2018 Joschi Kuphal
 * @license MIT https://raw.github.com/jkphl/svg-sprite/master/LICENSE
 */

var _								= require('lodash');
var SVGSpriteStandalone				= require('./standalone');
var SVGSprite						= require('../sprite');

/**
 * SVG stack
 *
 * @param {SVGSpriter} spriter		SVG spriter
 * @param {Object} config			Configuration
 * @param {Object} data				Base data
 * @param {String} key				Mode key
 */
function SVGSpriteStack(spriter, config, data, key) {
	SVGSpriteStandalone.apply(this, [spriter, config, data, key]);
}

/**
 * Prototype
 *
 * @type {Object}
 */
SVGSpriteStack.prototype = _.create(SVGSpriteStandalone.prototype, {
	constructor						: SVGSpriteStack,
	mode							: SVGSpriteStandalone.prototype.MODE_STACK
});

/**
 * Initialization (non-CSS modes)
 *
 * @return {void}
 */
SVGSpriteStack.prototype._init = function() {
	SVGSpriteStandalone.prototype._init.apply(this);

	// Determine the maximum shape dimensions
	this.maxDimensions				= {width: 0, height: 0};
	this.data.shapes.forEach(function(shape){
		this.maxDimensions.width	= Math.max(this.maxDimensions.width, shape.width.outer);
        this.maxDimensions.height	= Math.max(this.maxDimensions.height, shape.height.outer);
	}, this);
};

/**
 * Layout the sprite
 *
 * @param {Array} files				Files
 * @param {Function} cb				Callback
 * @return {void}
 */
SVGSpriteStack.prototype.layout = function(files, cb) {
	this._layout(files, cb, function(shape, dataShape /*, index*/){
		var dimensionAttributes		= shape.config.dimension.attributes;

		// Create the SVG getter/setter
		dataShape.__defineGetter__('svg', function() {
			return this._svg || shape.getSVG(true, function(shapeDOM) {
				shapeDOM.setAttribute('id', shape.id);

				if (!dimensionAttributes) {
					shapeDOM.removeAttribute('width');
					shapeDOM.removeAttribute('height');
				}
			});
		});
	});
};

/**
 * Build the CSS sprite
 *
 * @param {String} xmlDeclaration			XML declaration
 * @param {String} doctypeDeclaration		Doctype declaration
 * @return {File}							SVG sprite file
 */
SVGSpriteStack.prototype._buildSVG = function(xmlDeclaration, doctypeDeclaration) {
	var rootAttributes				= _.extend(
		{},
		this.config.svg.rootAttributes,
		{
			viewBox					: '0 0 ' + this.maxDimensions.width + ' ' + this.maxDimensions.height
		}
	),
	svg								= new SVGSprite(this.declaration(this.config.svg.xmlDeclaration, xmlDeclaration), this.declaration(this.config.svg.doctypeDeclaration, doctypeDeclaration), rootAttributes, true, this.config.svg.transform);
	svg.add('<style>:root>svg{display:none}:root>svg:target{display:block}</style>');
	svg.add(_.map(this.data.shapes, 'svg'));

	return svg.toFile(this._spriter.config.dest, this._addCacheBusting(svg));
};

/**
 * Module export
 */
module.exports = SVGSpriteStack;
