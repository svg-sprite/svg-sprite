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

var _ = require('lodash'),
	SVGSpriteStandalone = require('./standalone'),
	SVGSpriteCss = require('./css'),
	SVGSprite = require('../sprite'),
	DOMParser						= require('xmldom').DOMParser;
	//symbolAttributes = ['id', 'xml:base', 'xml:lang', 'xml:space', 'onfocusin', 'onfocusout', 'onactivate', 'onclick', 'onmousedown', 'onmouseup', 'onmouseover', 'onmousemove', 'onmouseout', 'onload', 'alignment-baseline', 'baseline-shift', 'clip', 'clip-path', 'clip-rule', 'color', 'color-interpolation', 'color-interpolation-filters', 'color-profile', 'color-rendering', 'cursor', 'direction', 'display', 'dominant-baseline', 'enable-background', 'fill', 'fill-opacity', 'fill-rule', 'filter', 'flood-color', 'flood-opacity', 'font-family', 'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'glyph-orientation-horizontal', 'glyph-orientation-vertical', 'image-rendering', 'kerning', 'letter-spacing', 'lighting-color', 'marker-end', 'marker-mid', 'marker-start', 'mask', 'opacity', 'overflow', 'pointer-events', 'shape-rendering', 'stop-color', 'stop-opacity', 'stroke', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'stroke-width', 'text-anchor', 'text-decoration', 'text-rendering', 'unicode-bidi', 'visibility', 'word-spacing', 'writing-mode', 'class', 'style', 'externalResourcesRequired', 'preserveAspectRatio', 'viewBox'];

/**
 * <symboluse> sprite
 *
 * @param {SVGSpriter} spriter      SVG spriter
 * @param {Object} config           Configuration
 * @param {Object} data             Base data!
 * @param {String} key              Mode key
 */
function SVGSpriteSymboluse(spriter, config, data, key) {
	SVGSpriteCss.apply(this, arguments);
}

/**
 * Prototype
 *
 * @type {Object}
 */
SVGSpriteSymboluse.prototype = _.create(SVGSpriteCss.prototype, {
	constructor: SVGSpriteSymboluse,
	mode: SVGSpriteCss.prototype.MODE_SYMBOLUSE,

	_initData: SVGSpriteStandalone.prototype._initData
});


/**
 * Layout the sprite
 *
 * @param {Array} files             Files
 * @param {Function} cb             Callback
 * @return {void}
 */
/*
SVGSpriteSymboluse.prototype.layout = function (files, cb) {
	console.log('layout', files, cb);
	this._layout(files, cb, function (shape, dataShape, index) {

		// Create the SVG getter/setter
		console.log('create');
		dataShape.__defineGetter__('svg', function () {
			return this._svg || shape.getSVG(true, function (shapeDOM) {
					shapeDOM.nodeName =
						shapeDOM.tagName =
							shapeDOM.localName = 'symbol';
					_.forIn(_.pick(shapeDOM.attributes, function (attribute) {
						return symbolAttributes.indexOf(attribute.name) == -1;
					}), function (attribute) {
						this.removeAttribute(attribute.name);
					}, shapeDOM);
					shapeDOM.setAttribute('id', shape.id);
				});
		});
	});
}
*/
/**
 * Refine the root attributes set on each nested shape
 *
 * @param {SVGShape} shape          Shape
 * @param {Number} index            Index
 * @param {Object} rootAttributes   Root element attributes
 * @return {Object}                 Refined root element attributes
 */
SVGSpriteSymboluse.prototype._refineRootAttributes = function (shape, index, rootAttributes) {

	// If it's the master shape multiple displaced copies
	if (this._displaceable) {
		if (shape.master) {
			delete rootAttributes.id;
			rootAttributes['xlink:href'] = '#' + shape.master.id + '-';
		} else {
			rootAttributes.id += '-';
		}

		// Else: Remove the ID attribute
	} else {
		delete rootAttributes.id;
	}

	return rootAttributes;
}

/**
 * Build the CSS sprite
 *
 * @param {String} xmlDeclaration           XML declaration
 * @param {String} doctypeDeclaration       Doctype declaration
 * @return {File}                           SVG sprite file
 */
SVGSpriteSymboluse.prototype._buildSVG = function (xmlDeclaration, doctypeDeclaration) {


	var rootAttributes = _.extend(this.config.svg.dimensionAttributes ? {
			width: this.data.spriteWidth,
			height: this.data.spriteHeight
		} : {}, {
			viewBox: '0 0 ' + this.data.spriteWidth + ' ' + this.data.spriteHeight
		}),
		svg = new SVGSprite(this.declaration(this.config.svg.xmlDeclaration, xmlDeclaration), this.declaration(this.config.svg.doctypeDeclaration, doctypeDeclaration), rootAttributes, true);
	//console.log(this.data);
	this.data.shapes.forEach(function (shape) {
		var viewBox = [-shape.position.absolute.x, -shape.position.absolute.y, shape.width.outer, shape.height.outer], svgArr, xAttr, yAttr;

		svg.add('<view id="' + shape.name + '-view" viewBox="' + viewBox.join(' ') + '"/>');

		xAttr = (Math.abs(shape.position.absolute.x) > 0 ) ? ' x="' + (-shape.position.absolute.x) + '"' : '';
		yAttr = (Math.abs(shape.position.absolute.y) > 0 ) ? ' y="' + (-shape.position.absolute.y) + '"' : '';
		svg.add('<use xlink:href="#' + shape.name + '" width="' + shape.width.outer + '" height="' + shape.height.outer + '"' + xAttr + yAttr + '/>');

		svgArr = shape.svg.split('>');
		svgArr[0] = '<symbol id="' + shape.name + '" viewBox="0 0 ' + viewBox[2] + ' ' + viewBox[3] + '"';//svgArr[0].replace('svg', 'symbol');
		shape.svg = svgArr.join('>');

		svgArr = shape.svg.split('<');
		svgArr[svgArr.length-1] = svgArr[svgArr.length-1].replace('svg', 'symbol');
		shape.svg = svgArr.join('<');

		svg.add(shape.svg);
	});



	return svg.toFile(this._spriter.config.dest, this._addCacheBusting(svg));
}

/**
 * Module export
 */
module.exports = SVGSpriteSymboluse;
