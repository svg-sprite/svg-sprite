'use strict';

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/svg-sprite/svg-sprite
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2018 Joschi Kuphal
 * @license MIT https://github.com/svg-sprite/svg-sprite/blob/main/LICENSE
 */

const { format } = require('util');
const { isString } = require('../utils/index.js');
const SVGSprite = require('../sprite.js');
const SVGSpriteBase = require('./base.js');
const SVGSpriteCssPacker = require('./css/packer.js');

/**
 * CSS sprite
 *
 * @param {SVGSpriter} spriter      SVG spriter
 * @param {object} config           Configuration
 * @param {object} data             Base data
 * @param {string} key              Mode key
 */
function SVGSpriteCss(spriter, config, data, key) {
    SVGSpriteBase.apply(this, [spriter, config, data, key]);
}

/**
 * Prototype
 *
 * @type {object}
 */
SVGSpriteCss.prototype = Object.assign(Object.create(SVGSpriteBase.prototype), {
    constructor: SVGSpriteCss,
    mode: SVGSpriteBase.prototype.MODE_CSS,
    tmpl: 'css',

    LAYOUT_VERTICAL: 'vertical',
    LAYOUT_HORIZONTAL: 'horizontal',
    LAYOUT_DIAGONAL: 'diagonal',
    LAYOUT_PACKED: 'packed'
});

/**
 * Initialization (non-CSS modes)
 *
 * @returns {void}
 */
SVGSpriteCss.prototype._init = function() {
    // Prepare the dimension suffix
    if (this.config.dimensions && this.config.dimensions !== true) {
        this.config.dimensions = /%s/g.test((this.config.dimensions || '').split('%%').join('')) ?
            format(this.config.dimensions, this.config.prefix) :
            this.config.prefix + this.config.dimensions;
    }

    // Determine the mixin mode and name
    switch (typeof this.config.mixin) {
        // String: Use the given string as mixin name
        case 'string':
            this.config.mixin = this.config.mixin.trim().length ? this.config.mixin.trim() : null;
            break;

        // Boolean: Use the common CSS class name (if any)
        case 'boolean':
            this.config.mixin = this.config.common ? this.config.common : null;
            break;

        // Default: Don't use mixin
        default:
            this.config.mixin = null;
            break;
    }

    // Refine the base data
    this.data = {
        ...this.data,
        hasCommon: Boolean(this.config.common),
        common: this.config.common,
        commonName: this.config.common || 'svg-common',
        hasMixin: Boolean(this.config.mixin),
        mixinName: this.config.mixin,
        includeDimensions: Boolean(this.config.dimensions),
        spriteWidth: 0,
        spriteHeight: 0
    };

    // Determine if this sprite accepts displaced shape copies
    this._displaceable = [this.LAYOUT_VERTICAL, this.LAYOUT_HORIZONTAL].includes(this.config.layout);

    this._precision = Number(this.config.svg.precision) >= 0 ? 10 ** Number(this.config.svg.precision) : null;
};

/**
 * Layout the sprite
 *
 * @param {Array} files             Files
 * @param {Function} cb             Callback
 * @returns {void}
 */
SVGSpriteCss.prototype.layout = function(files, cb) {
    // Layout the sprite
    const config = this._layout();

    // Build the sprite SVG file
    files.sprite = this._buildSVG(config.xmlDeclaration || '', config.doctypeDeclaration || '');
    this._spriter.verbose('Created «%s» SVG sprite file («%s» mode)', this.key, this.mode);

    // Build the configured CSS resources
    this._buildCSSResources(files, error => {
        if (error) {
            cb(error);
        } else {
            this._buildHTMLExample(files, cb);
        }
    });
};

/**
 * Layout the sprite (internal)
 *
 * @returns {object}                 Sprite configuration
 */
SVGSpriteCss.prototype._layout = function() {
    // Build a map of shape IDs that need to get a ':regular' pseudo class in CSS
    const pseudoShapeMap = {};
    this._spriter._shapes.forEach(shape => {
        pseudoShapeMap[shape.base] = pseudoShapeMap[shape.base] || Boolean(shape.state);
    });

    // Layout the sprite
    this[this.config.layout === this.LAYOUT_PACKED ? '_layoutBinPacked' : '_layoutSimple'](pseudoShapeMap);

    // Refine the shape data
    let xmlDeclaration = null;
    let doctypeDeclaration = null;
    const positionMap = {};
    this.data.shapes.forEach((shape, index) => {
        // Skip non-master shapes for all but orthogonal layouts
        if (this._displaceable || !shape.master) {
            xmlDeclaration = xmlDeclaration || this._spriter._shapes[index].xmlDeclaration;
            doctypeDeclaration = doctypeDeclaration || this._spriter._shapes[index].doctypeDeclaration;
            let x;
            let y;

            // For vertical layouts: Set the horizontal alignment
            if (this.config.layout === this.LAYOUT_VERTICAL) {
                x = this._spriter._shapes[index].align * 100;
                shape.position.absolute.x = this._spriter._shapes[index]._round(-x * (this.data.spriteWidth - shape.width.outer) / 100);

            // Else: Determine the relative horizontal position
            } else {
                x = shape.position.absolute.x ? 100 * Math.abs(shape.position.absolute.x) / (this.data.spriteWidth - shape.width.outer) : 0;
            }

            // For horizontal layouts: Set the vertical alignment
            if (this.config.layout === this.LAYOUT_HORIZONTAL) {
                y = this._spriter._shapes[index].align * 100;
                shape.position.absolute.y = this._spriter._shapes[index]._round(-y * (this.data.spriteHeight - shape.height.outer) / 100);

            // Else: Determine the relative vertical position
            } else {
                y = shape.position.absolute.y ? 100 * Math.abs(shape.position.absolute.y) / (this.data.spriteHeight - shape.height.outer) : 0;
            }

            // Set the relative position
            shape.position.relative = {
                x: this._round(x),
                y: this._round(y),
                xy: `${this._addUnit(this._round(x), '%')} ${this._addUnit(this._round(y), '%')}`
            };

            if (!shape.master) {
                const { x, y } = shape.position.absolute;
                positionMap[this._spriter._shapes[index].id] = { x, y };
            }

            // Rework zero-valued positions
            const svg = shape.svg.split('>');

            // Replace zero-valued x-positions
            const svgX = svg[0].split(' x="0"');
            if (svgX.length > 1) {
                x = shape.master ? shape.position.absolute.x - positionMap[shape.master].x : shape.position.absolute.x;
                svg[0] = svgX.join(x ? ` x="${-x}"` : '');
            }

            // Replace zero-valued y-positions
            const svgY = svg[0].split(' y="0"');
            if (svgY.length > 1) {
                y = shape.master ? shape.position.absolute.y - positionMap[shape.master].y : shape.position.absolute.y;
                svg[0] = svgY.join(y ? ` y="${-y}"` : '');
            }

            shape.svg = svg.join('>');
        }
    });

    // Remove all non-master shapes for non-displaceable sprites
    if (!this._displaceable) {
        this.data.shapes = this.data.shapes.filter(shape => !shape.master);
    }

    return {
        xmlDeclaration,
        doctypeDeclaration
    };
};

/**
 * Layout a simple CSS sprite
 *
 * @param {object} pseudoShapeMap    Pseudo shape map
 * @returns {SVGSpriteCss}           Self reference
 */
SVGSpriteCss.prototype._layoutSimple = function(pseudoShapeMap) {
    const lastShapeIndex = this._spriter._shapes.length - 1;

    this._spriter._shapes.forEach((shape, index) => {
        if (this._displaceable || !shape.master) {
            this._addShapeToSimpleCssSprite(
                shape,
                pseudoShapeMap[shape.base],
                index,
                (index === 0 ? 1 : 0) | (index === lastShapeIndex ? 2 : 0)
            );
        }
    });
    return this;
};

/**
 * Add a single shape to the simple CSS sprite
 *
 * @param {SVGShape} shape          Shape
 * @param {boolean} needsRegular    Needs a :regular pseudo class in CSS
 * @param {number} index            Index
 * @param {number} position         Position bits
 */
SVGSpriteCss.prototype._addShapeToSimpleCssSprite = function(shape, needsRegular, index, position) {
    const { width, height } = shape.getDimensions();
    const rootAttributes = { id: shape.id };
    let positionX = 0;
    let positionY = 0;

    switch (this.config.layout) {
        // Horizontal sprite arrangement
        case this.LAYOUT_HORIZONTAL:
            rootAttributes.y = 0;
            rootAttributes.x = this.data.spriteWidth;
            positionX = -this.data.spriteWidth;

            this.data.spriteWidth = Math.ceil(this.data.spriteWidth + width);
            this.data.spriteHeight = Math.max(this.data.spriteHeight, height);
            break;

        // Diagonal sprite arrangement
        case this.LAYOUT_DIAGONAL:
            rootAttributes.x = this.data.spriteWidth;
            rootAttributes.y = this.data.spriteHeight;
            positionX = -this.data.spriteWidth;
            positionY = -this.data.spriteHeight;

            this.data.spriteWidth = Math.ceil(this.data.spriteWidth + width);
            this.data.spriteHeight = Math.ceil(this.data.spriteHeight + height);
            break;

        // Vertical sprite arrangement (default)
        default:
            rootAttributes.x = 0;
            rootAttributes.y = this.data.spriteHeight;
            positionY = -this.data.spriteHeight;

            this.data.spriteWidth = Math.max(this.data.spriteWidth, width);
            this.data.spriteHeight = Math.ceil(this.data.spriteHeight + height);
    }

    this._addShapeToCSSSprite(shape, needsRegular, index, position, this._refineRootAttributes(shape, index, rootAttributes), positionX, positionY);
};

/**
 * Layout a binpacked CSS sprite
 *
 * @see https://codeincomplete.com/articles/bin-packing/
 * @param {object} pseudoShapeMap    Pseudo shape map
 * @returns {SVGSpriteCss}           Self reference
 */
SVGSpriteCss.prototype._layoutBinPacked = function(pseudoShapeMap) {
    const packer = new SVGSpriteCssPacker(this._spriter._shapes);
    const positions = packer.fit();

    // Run through all shapes and add them to the sprite
    const lastShapeIndex = this._spriter._shapes.length - 1;

    this._spriter._shapes.forEach((shape, index) => {
        // Skip non-master shapes
        if (!shape.master) {
            const dimensions = shape.getDimensions();
            const position = positions[index];
            const rootAttributes = { id: shape.id, x: position.x, y: position.y };

            this.data.spriteWidth = Math.max(this.data.spriteWidth, Math.ceil(position.x + dimensions.width));
            this.data.spriteHeight = Math.max(this.data.spriteHeight, Math.ceil(position.y + dimensions.height));

            this._addShapeToCSSSprite(
                shape,
                pseudoShapeMap[shape.base],
                index,
                (index === 0 ? 1 : 0) | (index === lastShapeIndex ? 2 : 0),
                this._refineRootAttributes(shape, index, rootAttributes),
                -position.x,
                -position.y
            );
        }
    });

    return this;
};

/**
 * Refine the root attributes set on each nested shape
 *
 * @param {SVGShape} shape          Shape
 * @param {number} index            Index
 * @param {object} rootAttributes   Root element attributes
 * @returns {object}                Refined root element attributes
 */
SVGSpriteCss.prototype._refineRootAttributes = function(shape, index, rootAttributes) {
    return rootAttributes;
};

/**
 * Add a single shape to a CSS sprite
 *
 * @param {SVGShape} shape          Shape
 * @param {boolean} needsRegular    Needs a :regular pseudo class in CSS
 * @param {number} index            Index
 * @param {number} position         Position bits
 * @param {number} rootAttributes   Root element attributes
 * @param {number} positionX        Horizontal position within the sprite
 * @param {number} positionY        Vertical position within the sprite
 */
SVGSpriteCss.prototype._addShapeToCSSSprite = function(shape, needsRegular, index, position, rootAttributes, positionX, positionY) {
    // Prepare the selectors
    const selector = {
        shape: needsRegular || shape.state ? [{
            expression: format(this.config.prefix, shape.base + (shape.state ? `:${shape.state}` : '')),
            raw: format(this.config.prefix, shape.base + (shape.state ? `:${shape.state}` : '')),
            first: true,
            last: false
        }, {
            expression: format(this.config.prefix, `${shape.base}\\:${shape.state || 'regular'}`),
            raw: format(this.config.prefix, `${shape.base}:${shape.state || 'regular'}`),
            first: false,
            last: true
        }] : [{
            expression: format(this.config.prefix, shape.base),
            raw: format(this.config.prefix, shape.base),
            first: true,
            last: true
        }]
    };

    // Prepare the dimension properties
    if (this.config.dimensions !== true) {
        selector.dimensions = shape.state ? [{
            expression: `${format(this.config.dimensions, shape.base)}:${shape.state}`,
            raw: `${format(this.config.dimensions, shape.base)}:${shape.state}`,
            first: true,
            last: false
        }, {
            expression: format(this.config.dimensions, `${shape.base}\\:${shape.state}`),
            raw: format(this.config.dimensions, `${shape.base}:${shape.state}`),
            first: false,
            last: true
        }] : [{
            expression: format(this.config.dimensions, shape.base),
            raw: format(this.config.dimensions, shape.base),
            first: true,
            last: true
        }];
    }

    // Register the SVG parameters
    this.data.shapes[index] = {
        ...this.data.shapes[index],
        // TODO: no bitwise
        first: Boolean(position & 1),
        last: Boolean(position & 2),
        position: {
            absolute: {
                x: positionX,
                y: positionY,
                xy: `${this._addUnit(positionX, 'px')} ${this._addUnit(positionY, 'px')}`
            }
        },
        selector,
        dimensions: {
            inline: this.config.dimensions === true,
            extra: Boolean(isString(this.config.dimensions) && this.config.dimensions.length)
        }
    };

    // Create the SVG getter/setter
    Object.defineProperty(this.data.shapes[index], '_svg', {
        enumerable: false,
        writable: true
    });

    // Create the SVG getter/setter
    Object.defineProperty(this.data.shapes[index], 'svg', {
        get() {
            return this._svg || shape.getSVG(true, shapeDOM => {
                for (const r in rootAttributes) {
                    shapeDOM.setAttribute(r, rootAttributes[r]);
                }
            });
        },
        set(svg) {
            this._svg = svg;
        }
    });
};

/**
 * Build the CSS sprite
 *
 * @param {string} xmlDeclaration           XML declaration
 * @param {string} doctypeDeclaration       Doctype declaration
 * @returns {File}                          SVG sprite file
 */
SVGSpriteCss.prototype._buildSVG = function(xmlDeclaration, doctypeDeclaration) {
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

    svg.add(Object.keys(this.data.shapes).map(key => this.data.shapes[key].svg));

    return svg.toFile(this._spriter.config.dest, this._addCacheBusting(svg));
};

/**
 * Round a number considering the given decimal place precision for CSS positioning values
 *
 * @param {number} n            Number
 * @returns {number}            Rounded number
 */
SVGSpriteCss.prototype._round = function(n) {
    return this._precision ? Math.round(n * this._precision) / this._precision : n;
};

/**
 * Module export
 */
module.exports = SVGSpriteCss;
