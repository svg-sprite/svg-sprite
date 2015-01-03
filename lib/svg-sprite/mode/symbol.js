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
symbolAttributes					= ['id', 'xml:base', 'xml:lang', 'xml:space', 'onfocusin', 'onfocusout', 'onactivate', 'onclick', 'onmousedown', 'onmouseup', 'onmouseover', 'onmousemove', 'onmouseout', 'onload', 'alignment-baseline', 'baseline-shift', 'clip', 'clip-path', 'clip-rule', 'color', 'color-interpolation', 'color-interpolation-filters', 'color-profile', 'color-rendering', 'cursor', 'direction', 'display', 'dominant-baseline', 'enable-background', 'fill', 'fill-opacity', 'fill-rule', 'filter', 'flood-color', 'flood-opacity', 'font-family', 'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'glyph-orientation-horizontal', 'glyph-orientation-vertical', 'image-rendering', 'kerning', 'letter-spacing', 'lighting-color', 'marker-end', 'marker-mid', 'marker-start', 'mask', 'opacity', 'overflow', 'pointer-events', 'shape-rendering', 'stop-color', 'stop-opacity', 'stroke', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'stroke-width', 'text-anchor', 'text-decoration', 'text-rendering', 'unicode-bidi', 'visibility', 'word-spacing', 'writing-mode', 'class', 'style', 'externalResourcesRequired', 'preserveAspectRatio', 'viewBox'];

/**
 * <symbol> sprite
 * 
 * @param {SVGSpriter} spriter		SVG spriter
 * @param {Object} config			Configuration
 * @param {Object} data				Base data
 */
function SVGSpriteSymbol(spriter, config, data) {
	SVGSpriteStandalone.apply(this, arguments);
}

/**
 * Prototype
 * 
 * @type {Object} 
 */
SVGSpriteSymbol.prototype = _.create(SVGSpriteStandalone.prototype, {
	constructor						: SVGSpriteSymbol,
	mode							: SVGSpriteStandalone.prototype.MODE_SYMBOL
});

/**
 * Layout the sprite
 * 
 * @param {Array} files				Files
 * @param {Function} cb				Callback
 * @return {void}
 */
SVGSpriteSymbol.prototype.layout = function(files, cb) {
	this._layout(files, cb, function(shape){
		return {
			svg						: shape.getSVG(true, function(shapeDOM) {
				shapeDOM.nodeName	=
				shapeDOM.tagName	=
				shapeDOM.localName	= 'symbol';
				_.forIn(_.pick(shapeDOM.attributes, function(attribute) {
					return symbolAttributes.indexOf(attribute.name) == -1;
				}), function(attribute){
					this.removeAttribute(attribute.name);				
				}, shapeDOM);
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
SVGSpriteSymbol.prototype._buildSVG = function(xmlDeclaration, doctypeDeclaration) {
	var inline						= !!this.config.inline,
	svg								= new SVGSprite(!inline && xmlDeclaration, !inline && doctypeDeclaration, inline ? {
		width						: 0,
		height						: 0,
		style						: 'position:absolute'
	} : {}, !inline);
	svg.add(_.pluck(this.data.shapes, 'svg'));

	return svg.toFile(this._spriter.config.dest, this.config.sprite);
}

/**
 * Module export
 */
module.exports = SVGSpriteSymbol;