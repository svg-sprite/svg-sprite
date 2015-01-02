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
SVGSpriteStandalone					= require('./standalone'),
SVGSpriteCss						= require('./css'),
SVGSprite							= require('../sprite');

/**
 * <view> sprite
 * 
 * @param {SVGSpriter} spriter		SVG spriter
 * @param {Object} config			Configuration
 * @param {Object} data				Base data
 */
function SVGSpriteView(spriter, config, data) {
	SVGSpriteCss.apply(this, arguments);
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
	delete rootAttributes.id;
	return rootAttributes;
}

/**
 * Build the CSS sprite
 * 
 * @param {String} xmlDeclaration			XML declaration
 * @param {String} doctypeDeclaration		Doctype declaration
 * @return {File}							SVG sprite file 
 */
SVGSpriteView.prototype._buildSVG = function(xmlDeclaration, doctypeDeclaration) {
	var svg							= new SVGSprite(xmlDeclaration, doctypeDeclaration, {
		width						: this.data.spriteWidth,
		height						: this.data.spriteHeight,
		viewBox						: '0 0 ' + this.data.spriteWidth + ' ' + this.data.spriteHeight
	}, true);
	this.data.shapes.forEach(function(shape) {
		var viewBox					= [-shape.position.absolute.x, -shape.position.absolute.y, shape.width.outer, shape.height.outer];
		svg.add('<view id="' + shape.name + '" viewBox="' + viewBox.join(' ') + '"/>');
		svg.add(shape.svg);
	});
	
	return svg.toFile(this._spriter.config.dest, this.config.sprite);
}

/**
 * Module export
 */
module.exports = SVGSpriteView;