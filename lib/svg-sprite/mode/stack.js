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
SVGSprite							= require('../sprite'),
File								= require('vinyl');

/**
 * SVG stack
 * 
 * @param {SVGSpriter} spriter		SVG spriter
 * @param {Object} config			Configuration
 * @param {Object} data				Base data
 */
function SVGSpriteStack(spriter, config, data) {
	SVGSpriteStandalone.apply(this, arguments);
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
 * Layout the sprite
 * 
 * @param {Array} files				Files
 * @param {Function} cb				Callback
 * @return {void}
 */
SVGSpriteStack.prototype.layout = function(files, cb) {
	this._layout(files, cb, function(shape){
		return {
			svg						: shape.getSVG(true, function(shapeDOM) {
				shapeDOM.setAttribute('id', shape.id);
			})
		};
	});
}

/**
 * Build the CSS sprite
 * 
 * @param {String} xmlDeclaration			XML declaration
 * @param {String} doctypeDeclaration		Doctype declaration
 * @return {File}							SVG sprite file 
 */
SVGSpriteStack.prototype._buildSVG = function(xmlDeclaration, doctypeDeclaration) {
	var inline						= !!this.config.inline,
	svg								= new SVGSprite(xmlDeclaration, doctypeDeclaration, inline ? {
		width						: 0,
		height						: 0,
		style						: 'position:absolute'
	} : {}, !inline);
	svg.add('<style>:root>svg{display:none}:root>svg:target{display:block}</style>');
	svg.add(_.pluck(this.data.shapes, 'svg'));
	
	return svg.toFile(this._spriter.config.dest, this.config.sprite);
}

/**
 * Module export
 */
module.exports = SVGSpriteStack;