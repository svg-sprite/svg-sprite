'use strict';

/**
 * Svg-sprite is a Node.js module for creating SVG sprites
 *
 * @license MIT https://github.com/svg-sprite/svg-sprite/blob/main/LICENSE
 *
 * @author Joschi Kuphal [joschi@kuphal.net](mailto:joschi@kuphal.net)
 *   (https://github.com/jkphl)
 * @copyright © 2018 Joschi Kuphal
 *
 * @see https://github.com/svg-sprite/svg-sprite
 */

const { Buffer } = require('node:buffer');
const escape = require('lodash.escape');
const File = require('vinyl');
const { isFunction } = require('./utils/index.js');

module.exports = class SVGSprite {
  /**
   * SVGSprite
   *
   * @param {string}  xmlDeclaration     XML declaration
   * @param {string}  doctypeDeclaration Doctype declaration
   * @param {object}  rootAttributes     Root attributes
   * @param {boolean} addSVGNamespaces   Add default SVG namespaces
   * @param {Array}   transform          List of post-processing transform
   *   callbacks
   */
  constructor(
    xmlDeclaration,
    doctypeDeclaration,
    rootAttributes,
    addSVGNamespaces,
    transform
  ) {
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
    for (const [attr, value] of Object.entries(this.rootAttributes)) {
      svg += ` ${attr}="${escape(value)}"`;
    }

    svg += '>';
    svg += this.content.join('');
    svg += '</svg>';

    // Apply post-processing transformations
    for (const transform of this.transform) {
      if (isFunction(transform)) {
        svg = transform(svg) || '';
      }
    }

    this._serialized = svg;

    return this._serialized;
  }

  /**
   * Return as vinyl file
   *
   * @param   {string} base Base path
   * @param   {string} path Path
   *
   * @returns {File}        Vinyl file
   */
  toFile(base, path) {
    return new File({
      base,
      path,
      contents: Buffer.from(this.toString())
    });
  }
};
