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
 * SVG stack
 *
 * @param {SVGSpriter} spriter      SVG spriter
 * @param {object} config           Configuration
 * @param {object} data             Base data
 * @param {string} key              Mode key
 */
function SVGSpriteStack(spriter, config, data, key) {
    SVGSpriteStandalone.apply(this, [spriter, config, data, key]);
}

/**
 * Prototype
 *
 * @type {object}
 */
SVGSpriteStack.prototype = Object.assign(Object.create(SVGSpriteStandalone.prototype), {
    constructor: SVGSpriteStack,
    mode: SVGSpriteStandalone.prototype.MODE_STACK
});

/**
 * Initialization (non-CSS modes)
 *
 * @returns {void}
 */
SVGSpriteStack.prototype._init = function() {
    SVGSpriteStandalone.prototype._init.apply(this);

    // Determine the maximum shape dimensions
    this.maxDimensions = { width: 0, height: 0 };
    this.data.shapes.forEach(shape => {
        this.maxDimensions.width = Math.max(this.maxDimensions.width, shape.width.outer);
        this.maxDimensions.height = Math.max(this.maxDimensions.height, shape.height.outer);
    });
};

/**
 * Layout the sprite
 *
 * @param {Array} files             Files
 * @param {Function} cb             Callback
 * @returns {void}
 */
SVGSpriteStack.prototype.layout = function(files, cb) {
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
 * @returns {File}                           SVG sprite file
 */
SVGSpriteStack.prototype._buildSVG = function(xmlDeclaration, doctypeDeclaration) {
    const rootAttributes = {
        ...this.config.svg.rootAttributes
    };

    if (this.config.rootviewbox !== false) {
        rootAttributes.viewBox = `0 0 ${this.maxDimensions.width} ${this.maxDimensions.height}`;
    }

    const _xmlDeclaration = this.declaration(this.config.svg.xmlDeclaration, xmlDeclaration);
    const _doctypeDeclaration = this.declaration(this.config.svg.doctypeDeclaration, doctypeDeclaration);

    const svg = new SVGSprite(_xmlDeclaration, _doctypeDeclaration, rootAttributes, true, this.config.svg.transform);

    svg.add('<style>:root>svg{display:none}:root>svg:target{display:block}</style>');
    svg.add(Object.keys(this.data.shapes).map(key => this.data.shapes[key].svg));

    return svg.toFile(this._spriter.config.dest, this._addCacheBusting(svg));
};

/**
 * Module export
 */
module.exports = SVGSpriteStack;
