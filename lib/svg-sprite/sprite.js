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
File								= require('vinyl');

/**
 * SVGSprite
 *
 * @param {String} xmlDeclaration		XML declaration
 * @param {String} doctypeDeclaration	Doctype declaration
 * @param {Object} rootAttributes		Root attributes
 * @param {Boolean} addSVGNamespaces	Add default SVG namespaces
 * @param {Array} transform				List of post-processing transform callbacks
 */
function SVGSprite(xmlDeclaration, doctypeDeclaration, rootAttributes, addSVGNamespaces, transform) {
	this.xmlDeclaration				= xmlDeclaration || '';
	this.doctypeDeclaration			= doctypeDeclaration || '';
	this.rootAttributes				= _.extend({}, rootAttributes);
	this.transform					= transform;
	this.content					= [];
	this._serialized				= null;

	if (!!addSVGNamespaces) {
		this.rootAttributes['xmlns']		= this.DEFAULT_SVG_NAMESPACE;
		this.rootAttributes['xmlns:xlink']	= this.XLINK_NAMESPACE;
	}
}

/**
 * Prototype properties
 *
 * @type {Object}
 */
SVGSprite.prototype = {};

/**
 * Default SVG namespace
 *
 * @type {String}
 */
SVGSprite.prototype.DEFAULT_SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/**
 * Xlink namespace
 *
 * @type {String}
 */
SVGSprite.prototype.XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink';

/**
 * Add a content string
 *
 * @param {String} content			Content string
 * @return {SVGSprite}				Self reference
 */
SVGSprite.prototype.add = function(content) {
	if (_.isArray(content)) {
		this.content.push.apply(this.content, content);
	} else {
		this.content.push(content);
	}

	this._serialized				= null;
};

/**
 * Serialize the SVG sprite
 *
 * @return {String}					SVG sprite
 */
SVGSprite.prototype.toString = function() {
	if (this._serialized === null) {
		var svg						= this.xmlDeclaration + this.doctypeDeclaration;
		svg							+= '<svg';
		for (var attr in this.rootAttributes) {
			svg						+= ' ' + attr + '="' + _.escape(this.rootAttributes[attr]) + '"';
		}
		svg							+= '>';
		svg							+= this.content.join('');
		svg							+= '</svg>';

		// Apply post-processing transformations
		for (var t = 0; t < this.transform.length; ++t) {
			if (_.isFunction(this.transform[t])) {
				svg					= this.transform[t](svg) || '';
			}
		}

		this._serialized			= svg;
	}

	return this._serialized;
};

/**
 * Return as vinyl file
 *
 * @param {String} base				Base path
 * @param {String} path				Path
 * @return {File}					Vinyl file
 */
SVGSprite.prototype.toFile = function(base, path) {
	return new File({
		base						: base,
		path						: path,
		contents					: Buffer.from(this.toString())
	});
};

/**
 * Module export
 */
module.exports = SVGSprite;
