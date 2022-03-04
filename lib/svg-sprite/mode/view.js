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
const SVGSpriteCss = require('./css.js');

/**
 * <view> sprite
 *
 * @param {SVGSpriter} spriter      SVG spriter
 * @param {object} config           Configuration
 * @param {object} data             Base data
 * @param {string} key              Mode key
 */
function SVGSpriteView(spriter, config, data, key) {
    SVGSpriteCss.apply(this, [spriter, config, data, key]);
}

/**
 * Prototype
 *
 * @type {object}
 */
SVGSpriteView.prototype = Object.assign(Object.create(SVGSpriteCss.prototype), {
    constructor: SVGSpriteView,
    mode: SVGSpriteCss.prototype.MODE_VIEW,

    _initData: SVGSpriteStandalone.prototype._initData
});

/**
 * Refine the root attributes set on each nested shape
 *
 * @param {SVGShape} shape          Shape
 * @param {number} index            Index
 * @param {object} rootAttributes   Root element attributes
 * @returns {object}                Refined root element attributes
 */
SVGSpriteView.prototype._refineRootAttributes = function(shape, index, rootAttributes) {
    // If it's the master shape multiple displaced copies
    if (this._displaceable) {
        if (shape.master) {
            delete rootAttributes.id;
            rootAttributes['xlink:href'] = `#${shape.master.id}-`;
        } else {
            rootAttributes.id += '-';
        }

    // Else: Remove the ID attribute
    } else {
        delete rootAttributes.id;
    }

    return rootAttributes;
};

/**
 * Build the CSS sprite
 *
 * @param {string} xmlDeclaration           XML declaration
 * @param {string} doctypeDeclaration       Doctype declaration
 * @returns {File}                          SVG sprite file
 */
SVGSpriteView.prototype._buildSVG = function(xmlDeclaration, doctypeDeclaration) {
    const rootAttributes = {
        ...this.config.svg.rootAttributes,
        ...(this.config.svg.dimensionAttributes ?
            {
                width: this.data.spriteWidth,
                height: this.data.spriteHeight
            } :
            {}),
        viewBox: `0 0 ${this.data.spriteWidth} ${this.data.spriteHeight}`
    };
    const _xmlDeclaration = this.declaration(this.config.svg.xmlDeclaration, xmlDeclaration);
    const _doctypeDeclaration = this.declaration(this.config.svg.doctypeDeclaration, doctypeDeclaration);

    const svg = new SVGSprite(_xmlDeclaration, _doctypeDeclaration, rootAttributes, true, this.config.svg.transform);

    this.data.shapes.forEach(shape => {
        const viewBox = [
            -shape.position.absolute.x,
            -shape.position.absolute.y,
            shape.width.outer,
            shape.height.outer
        ];

        svg.add(`<view id="${shape.name}" viewBox="${viewBox.join(' ')}"/>`);
        svg.add(shape.svg);
    });

    return svg.toFile(this._spriter.config.dest, this._addCacheBusting(svg));
};

/**
 * Module export
 */
module.exports = SVGSpriteView;
