'use strict';

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/svg-sprite/svg-sprite
 *
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2018 Joschi Kuphal
 * @license MIT https://github.com/svg-sprite/svg-sprite/blob/master/LICENSE
 */

const _ = require('lodash');
const Vinyl = require('vinyl');

/**
 * SVGSprite
 *
 * @param {String} xmlDeclaration       XML declaration
 * @param {String} doctypeDeclaration   Doctype declaration
 * @param {Object} rootAttributes       Root attributes
 * @param {Boolean} addSVGNamespaces    Add default SVG namespaces
 * @param {Array} transform             List of post-processing transform callbacks
 */
function SVGSprite(xmlDeclaration, doctypeDeclaration, rootAttributes, addSVGNamespaces, transform) {
    this.xmlDeclaration = xmlDeclaration || '';
    this.doctypeDeclaration = doctypeDeclaration || '';
    this.rootAttributes = { ...rootAttributes };
    this.transform = transform;
    this.content = [];
    this._serialized = null;

    if (addSVGNamespaces) {
        this.rootAttributes.xmlns = this.DEFAULT_SVG_NAMESPACE;
        this.rootAttributes['xmlns:xlink'] = this.XLINK_NAMESPACE;
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
 * @param {String} content          Content string
 * @return {SVGSprite}              Self reference
 */
SVGSprite.prototype.add = function(content) {
    if (Array.isArray(content)) {
        this.content.push(...content);
    } else {
        this.content.push(content);
    }

    this._serialized = null;
};

/**
 * Serialize the SVG sprite
 *
 * @return {String}                 SVG sprite
 */
SVGSprite.prototype.toString = function() {
    if (this._serialized === null) {
        let svg = this.xmlDeclaration + this.doctypeDeclaration;
        svg += '<svg';
        for (const attr in this.rootAttributes) {
            svg += ` ${attr}="${_.escape(this.rootAttributes[attr])}"`;
        }

        svg += '>';
        svg += this.content.join('');
        svg += '</svg>';

        // Apply post-processing transformations
        for (let t = 0; t < this.transform.length; t++) {
            if (_.isFunction(this.transform[t])) {
                svg = this.transform[t](svg) || '';
            }
        }

        this._serialized = svg;
    }

    return this._serialized;
};

/**
 * Return as vinyl file
 *
 * @param {String} base             Base path
 * @param {String} path             Path
 * @return {Vinyl}                  Vinyl file
 */
SVGSprite.prototype.toFile = function(base, path) {
    return new Vinyl({
        base,
        path,
        contents: Buffer.from(this.toString())
    });
};

/**
 * Module export
 */
module.exports = SVGSprite;
