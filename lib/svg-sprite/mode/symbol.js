'use strict';

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/svg-sprite/svg-sprite
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2018 Joschi Kuphal
 * @license MIT https://github.com/svg-sprite/svg-sprite/blob/main/LICENSE
 */

const SVGSprite = require('../sprite.js');
const SVGSpriteStandalone = require('./standalone.js');

const symbolAttributes = new Set([
    'id',
    'xml:base',
    'xml:lang',
    'xml:space',
    'onfocusin',
    'onfocusout',
    'onactivate',
    'onclick',
    'onmousedown',
    'onmouseup',
    'onmouseover',
    'onmousemove',
    'onmouseout',
    'onload',
    'alignment-baseline',
    'baseline-shift',
    'clip',
    'clip-path',
    'clip-rule',
    'color',
    'color-interpolation',
    'color-interpolation-filters',
    'color-profile',
    'color-rendering',
    'cursor',
    'direction',
    'display',
    'dominant-baseline',
    'enable-background',
    'fill',
    'fill-opacity',
    'fill-rule',
    'filter',
    'flood-color',
    'flood-opacity',
    'font-family',
    'font-size',
    'font-size-adjust',
    'font-stretch',
    'font-style',
    'font-variant',
    'font-weight',
    'glyph-orientation-horizontal',
    'glyph-orientation-vertical',
    'image-rendering',
    'kerning',
    'letter-spacing',
    'lighting-color',
    'marker-end',
    'marker-mid',
    'marker-start',
    'mask',
    'opacity',
    'overflow',
    'pointer-events',
    'shape-rendering',
    'stop-color',
    'stop-opacity',
    'stroke',
    'stroke-dasharray',
    'stroke-dashoffset',
    'stroke-linecap',
    'stroke-linejoin',
    'stroke-miterlimit',
    'stroke-opacity',
    'stroke-width',
    'text-anchor',
    'text-decoration',
    'text-rendering',
    'unicode-bidi',
    'visibility',
    'word-spacing',
    'writing-mode',
    'class',
    'style',
    'externalResourcesRequired',
    'preserveAspectRatio',
    'viewBox',
    'aria-labelledby'
]);

/**
 * <symbol> sprite
 *
 * @param {SVGSpriter} spriter      SVG spriter
 * @param {object} config           Configuration
 * @param {object} data             Base data
 * @param {string} key              Mode key
 */
function SVGSpriteSymbol(spriter, config, data, key) {
    SVGSpriteStandalone.apply(this, [spriter, config, data, key]);
}

/**
 * Prototype
 *
 * @type {object}
 */
SVGSpriteSymbol.prototype = Object.assign(Object.create(SVGSpriteStandalone.prototype), {
    constructor: SVGSpriteSymbol,
    mode: SVGSpriteStandalone.prototype.MODE_SYMBOL
});

/**
 * Layout the sprite
 *
 * @param {Array} files             Files
 * @param {Function} cb             Callback
 * @returns {void}
 */
SVGSpriteSymbol.prototype.layout = function(files, cb) {
    this._layout(files, cb, (shape, dataShape) => {
        // Create the SVG getter
        Object.defineProperty(dataShape, 'svg', {
            get() {
                return this._svg || shape.getSVG(true, shapeDOM => {
                    shapeDOM.nodeName = 'symbol';
                    shapeDOM.tagName = 'symbol';
                    shapeDOM.localName = 'symbol';
                    const removeAttributes = [];
                    Array.prototype.forEach.call(shapeDOM.attributes, attribute => {
                        if (!symbolAttributes.has(attribute.name)) {
                            removeAttributes.push(attribute.name);
                        }
                    });
                    removeAttributes.forEach(attribute => {
                        shapeDOM.removeAttribute(attribute);
                    });
                    shapeDOM.setAttribute('id', shape.id);
                });
            }
        });
    });
};

/**
 * Build the CSS sprite
 *
 * @param {string} xmlDeclaration           XML declaration
 * @param {string} doctypeDeclaration       Doctype declaration
 * @returns {File}                           SVG sprite file
 */
SVGSpriteSymbol.prototype._buildSVG = function(xmlDeclaration, doctypeDeclaration) {
    const inline = Boolean(this.config.inline);
    const defaultRootAttributes = { ...this.config.svg.rootAttributes };
    const rootAttributes = inline ? {
        ...defaultRootAttributes,
        ...(this.config.svg.dimensionAttributes ? { width: 0, height: 0 } : {}),
        style: 'position:absolute'
    } :
        defaultRootAttributes;
    const _xmlDeclaration = inline ? '' : this.declaration(this.config.svg.xmlDeclaration, xmlDeclaration);
    const _doctypeDeclaration = inline ? '' : this.declaration(this.config.svg.doctypeDeclaration, doctypeDeclaration);

    const svg = new SVGSprite(_xmlDeclaration, _doctypeDeclaration, rootAttributes, !inline, this.config.svg.transform);

    svg.add(Object.keys(this.data.shapes).map(key => this.data.shapes[key].svg));

    return svg.toFile(this._spriter.config.dest, this._addCacheBusting(svg));
};

/**
 * Module export
 */
module.exports = SVGSpriteSymbol;
