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

const _ = require('lodash');
const SVGSprite = require('../sprite');
const SVGSpriteStandalone = require('./standalone');
const SVGSpriteCss = require('./css');

/**
 * <universal> sprite
 *
 * @param {SVGSpriter} spriter      SVG spriter
 * @param {Object} config           Configuration
 * @param {Object} data             Base data!
 * @param {String} key              Mode key
 */
function SVGSpriteUniversal(spriter, config, data, key) {
    SVGSpriteCss.apply(this, arguments);
}

/**
 * Prototype
 *
 * @type {Object}
 */
SVGSpriteUniversal.prototype = _.create(SVGSpriteCss.prototype, {
    constructor: SVGSpriteUniversal,
    mode: SVGSpriteCss.prototype.MODE_UNIVERSAL,

    _initData: SVGSpriteStandalone.prototype._initData
});

/**
 * Refine the root attributes set on each nested shape
 *
 * @param {SVGShape} shape          Shape
 * @param {Number} index            Index
 * @param {Object} rootAttributes   Root element attributes
 * @return {Object}                 Refined root element attributes
 */
SVGSpriteUniversal.prototype._refineRootAttributes = function(shape, index, rootAttributes) {
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
 * @param {String} xmlDeclaration           XML declaration
 * @param {String} doctypeDeclaration       Doctype declaration
 * @return {File}                           SVG sprite file
 */
SVGSpriteUniversal.prototype._buildSVG = function(xmlDeclaration, doctypeDeclaration) {
    const rootAttributes = _.extend(this.config.svg.dimensionAttributes ? {
        width: this.data.spriteWidth,
        height: this.data.spriteHeight
    } : {}, {
        viewBox: `0 0 ${this.data.spriteWidth} ${this.data.spriteHeight}`
    });
    const svg = new SVGSprite(this.declaration(this.config.svg.xmlDeclaration, xmlDeclaration), this.declaration(this.config.svg.doctypeDeclaration, doctypeDeclaration), rootAttributes, true);
    this.data.shapes.forEach(shape => {
        const viewBox = [-shape.position.absolute.x, -shape.position.absolute.y, shape.width.outer, shape.height.outer]; let svgArr; let xAttr; let yAttr;

        svg.add(`<view id="${shape.name}-view" viewBox="${viewBox.join(' ')}"/>`);

        xAttr = (Math.abs(shape.position.absolute.x) > 0) ? ` x="${-shape.position.absolute.x}"` : '';
        yAttr = (Math.abs(shape.position.absolute.y) > 0) ? ` y="${-shape.position.absolute.y}"` : '';

        svgArr = shape.svg.split('>');
        svgArr[0] = `<symbol id="${shape.name}" class="${shape.name}" viewBox="0 0 ${viewBox[2]} ${viewBox[3]}"`;//svgArr[0].replace('svg', 'symbol');
        shape.svg = svgArr.join('>');

        svgArr = shape.svg.split('<');
        svgArr[svgArr.length - 1] = svgArr[svgArr.length - 1].replace('svg', 'symbol');
        shape.svg = svgArr.join('<');

        svg.add(shape.svg);
        svg.add(`<use xlink:href="#${shape.name}" width="${shape.width.outer}" height="${shape.height.outer}"${xAttr}${yAttr}/>`);
    });

    return svg.toFile(this._spriter.config.dest, this._addCacheBusting(svg));
};

/**
 * Module export
 */
module.exports = SVGSpriteUniversal;
