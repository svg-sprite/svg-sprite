'use strict';

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/svg-sprite/svg-sprite
 *
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2018 Joschi Kuphal
 * @license MIT https://github.com/svg-sprite/svg-sprite/blob/1.5.x/LICENSE
 */

var _								= require('lodash'),
SVGSpriteStandalone					= require('./standalone'),
SVGSpriteCss						= require('./css'),
SVGSprite							= require('../sprite');

/**
 * <view> sprite
 *
 * @param {SVGSpriter} spriter		SVG spriter
 * @param {Object} config			Configuration
 * @param {Object} data				Base data
 * @param {String} key				Mode key
 */
function SVGSpriteView(spriter, config, data, key) {
	SVGSpriteCss.apply(this, [spriter, config, data, key]);
}

/**
 * Prototype
 *
 * @type {Object}
 */
SVGSpriteView.prototype = _.create(SVGSpriteCss.prototype, {
	constructor						: SVGSpriteView,
	mode							: SVGSpriteCss.prototype.MODE_VIEW,

	_initData						: SVGSpriteStandalone.prototype._initData
});

/**
 * Refine the root attributes set on each nested shape
 *
 * @param {SVGShape} shape			Shape
 * @param {Number} index			Index
 * @param {Object} rootAttributes	Root element attributes
 * @return {Object}					Refined root element attributes
 */
SVGSpriteView.prototype._refineRootAttributes = function(shape, index, rootAttributes) {

	// If it's the master shape multiple displaced copies
	if (this._displaceable) {
		if (shape.master) {
			delete rootAttributes.id;
			rootAttributes['xlink:href']	= '#' + shape.master.id + '-';
		} else {
			rootAttributes.id				+= '-';
		}

	// Else: Remove the ID attribute
	} else {
		delete rootAttributes.id;
	}

	return rootAttributes;
};

/**
 * Build the CSS sprite
 *
 * @param {String} xmlDeclaration			XML declaration
 * @param {String} doctypeDeclaration		Doctype declaration
 * @return {File}							SVG sprite file
 */
SVGSpriteView.prototype._buildSVG = function(xmlDeclaration, doctypeDeclaration) {
	var rootAttributes				= _.extend(
		{},
		this.config.svg.rootAttributes,
		this.config.svg.dimensionAttributes ? {
			width					: this.data.spriteWidth,
			height					: this.data.spriteHeight
		} : {},
		{
			viewBox					: '0 0 ' + this.data.spriteWidth + ' ' + this.data.spriteHeight
		}
	),
	svg								= new SVGSprite(this.declaration(this.config.svg.xmlDeclaration, xmlDeclaration), this.declaration(this.config.svg.doctypeDeclaration, doctypeDeclaration), rootAttributes, true, this.config.svg.transform);
	this.data.shapes.forEach(function(shape) {
		var viewBox					= [-shape.position.absolute.x, -shape.position.absolute.y, shape.width.outer, shape.height.outer];
		svg.add('<view id="' + shape.name + '" viewBox="' + viewBox.join(' ') + '"/>');
		svg.add(shape.svg);
	});

	return svg.toFile(this._spriter.config.dest, this._addCacheBusting(svg));
};

/**
 * Module export
 */
module.exports = SVGSpriteView;
