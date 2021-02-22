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
 * <defs> sprite
 *
 * @param {SVGSpriter} spriter		SVG spriter
 * @param {Object} config			Configuration
 * @param {Object} data				Base data
 * @param {String} key				Mode key
 */
function SVGSpriteDefs(spriter, config, data, key) {
	SVGSpriteStandalone.apply(this, [spriter, config, data, key]);
}

/**
 * Prototype
 *
 * @type {Object}
 */
SVGSpriteDefs.prototype = _.create(SVGSpriteStandalone.prototype, {
	constructor						: SVGSpriteDefs,
	mode							: SVGSpriteStandalone.prototype.MODE_DEFS
});

/**
 * Layout the sprite
 *
 * @param {Array} files				Files
 * @param {Function} cb				Callback
 * @return {void}
 */
SVGSpriteDefs.prototype.layout = function(files, cb) {
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
SVGSpriteDefs.prototype._buildSVG = function(xmlDeclaration, doctypeDeclaration) {
	var inline						= !!this.config.inline,
	rootAttributes					= _.extend(
		{},
		this.config.svg.rootAttributes
	),
	svg								= new SVGSprite(inline ? '' : this.declaration(this.config.svg.xmlDeclaration, xmlDeclaration), inline ? '' : this.declaration(this.config.svg.doctypeDeclaration, doctypeDeclaration), inline ? _.extend(
			rootAttributes,
			this.config.svg.dimensionAttributes ? {
				width						: 0,
				height						: 0
			} : {},
			{
				style						: 'position:absolute'
			}
		) : rootAttributes, !inline, this.config.svg.transform);
	svg.add('<defs>');
	svg.add(_.map(this.data.shapes, 'svg'));
	svg.add('</defs>');

	return svg.toFile(this._spriter.config.dest, this._addCacheBusting(svg));
};

/**
 * Module export
 */
module.exports = SVGSpriteDefs;
