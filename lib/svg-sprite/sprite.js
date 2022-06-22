'use strict';

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/svg-sprite/svg-sprite
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2018 Joschi Kuphal
 * @license MIT https://github.com/svg-sprite/svg-sprite/blob/main/LICENSE
 */

const { Buffer } = require('buffer');
const escape = require('lodash.escape');
const File = require('vinyl');
const { isFunction } = require('./utils/index.js');

module.exports = class SVGSprite {
    /**
     * SVGSprite
     *
     * @param {string} xmlDeclaration       XML declaration
     * @param {string} doctypeDeclaration   Doctype declaration
     * @param {object} rootAttributes       Root attributes
     * @param {boolean} addSVGNamespaces    Add default SVG namespaces
     * @param {Array} transform             List of post-processing transform callbacks
     */
    constructor(xmlDeclaration, doctypeDeclaration, rootAttributes, addSVGNamespaces, transform) {
        this.DEFAULT_SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
        this.XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink';

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
     * Add a content string
     *
     * @param {any} content Content string
     */
    add(content) {
        if (Array.isArray(content)) {
            this.content.push(...content);
        } else {
            this.content.push(content);
        }

        this._serialized = null;
    }

    /**
     * Serialize the SVG sprite
     *
     * @returns {string} SVG sprite
     */
    toString() {
        if (this._serialized !== null) {
            return this._serialized;
        }

        let svg = this.xmlDeclaration + this.doctypeDeclaration;
        svg += '<svg';
        for (const attr in this.rootAttributes) {
            svg += ` ${attr}="${escape(this.rootAttributes[attr])}"`;
        }

        svg += '>';
        svg += this.content.join('');
        svg += '</svg>';

        // Apply post-processing transformations
        for (let t = 0; t < this.transform.length; t++) {
            if (isFunction(this.transform[t])) {
                svg = this.transform[t](svg) || '';
            }
        }

        this._serialized = svg;

        return this._serialized;
    }

    /**
     * Return as vinyl file
     *
     * @param   {string} base           Base path
     * @param   {string} path           Path
     * @returns {File}                  Vinyl file
     */
    toFile(base, path) {
        return new File({
            base,
            path,
            contents: Buffer.from(this.toString())
        });
    }
};
