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

/**
 * <defs> sprite
 *
 * @param {SVGSpriter} spriter      SVG spriter
 * @param {object} config           Configuration
 * @param {object} data             Base data
 * @param {string} key              Mode key
 */
function SVGSpriteDefs(spriter, config, data, key) {
    SVGSpriteStandalone.apply(this, [spriter, config, data, key]);
}

/**
 * Prototype
 *
 * @type {object}
 */
SVGSpriteDefs.prototype = Object.assign(Object.create(SVGSpriteStandalone.prototype), {
    constructor: SVGSpriteDefs,
    mode: SVGSpriteStandalone.prototype.MODE_DEFS
});

/**
 * Layout the sprite
 *
 * @param {Array} files             Files
 * @param {Function} cb             Callback
 * @returns {void}
 */
SVGSpriteDefs.prototype.layout = function(files, cb) {
    this._layout(files, cb, (shape, dataShape) => {
        const dimensionAttributes = shape.config.dimension.attributes;

        // Create the SVG getter
        Object.defineProperty(dataShape, 'svg', {
            get() {
                return this._svg || shape.getSVG(true, shapeDOM => {
                    shapeDOM.setAttribute('id', shape.id);

                    if (!dimensionAttributes) {
                        shapeDOM.removeAttribute('width');
                        shapeDOM.removeAttribute('height');
                    }
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
 * @returns {File}                          SVG sprite file
 */
SVGSpriteDefs.prototype._buildSVG = function(xmlDeclaration, doctypeDeclaration) {
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

    svg.add('<defs>');
    svg.add(Object.keys(this.data.shapes).map(key => this.data.shapes[key].svg));
    svg.add('</defs>');

    return svg.toFile(this._spriter.config.dest, this._addCacheBusting(svg));
};

/**
 * Module export
 */
module.exports = SVGSpriteDefs;
