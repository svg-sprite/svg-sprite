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
const SVGSpriteBase = require('./base.js');

/**
 * Base class for non-css sprites
 *
 * @param {SVGSpriter} spriter      SVG spriter
 * @param {object} config           Configuration
 * @param {object} data             Base data
 */
function SVGSpriteStandalone(spriter, config, data) {
    SVGSpriteBase.apply(this, [spriter, config, data]);
}

/**
 * Prototype
 *
 * @type {object}
 */
SVGSpriteStandalone.prototype = Object.assign(Object.create(SVGSpriteBase.prototype), {
    constructor: SVGSpriteStandalone
});

/**
 * Initialization (non-CSS modes)
 *
 * @returns {void}
 */
SVGSpriteStandalone.prototype._init = function() {
    // Prepare the dimension suffix
    this.config.dimensions = isString(this.config.dimensions) ? this.config.dimensions.trim() : '-dims';
    if (this.config.dimensions) {
        this.config.dimensions = /%s/g.test((this.config.dimensions || '').split('%%').join('')) ?
            format(this.config.dimensions, this.config.prefix) :
            this.config.prefix + this.config.dimensions;
    }

    this.data.inline = Boolean(this.config.inline);
};

/**
 * Layout the sprite
 *
 * @param {Array} files             Files
 * @param {Function} cb             Callback
 * @param {Function} extend         Extension callback
 * @returns {void}
 */
SVGSpriteStandalone.prototype._layout = function(files, cb, extend) {
    // Refine the shape data
    let xmlDeclaration = null;
    let doctypeDeclaration = null;
    this._spriter._shapes.forEach((shape, index) => {
        // Skip non-master shapes
        if (!shape.master) {
            xmlDeclaration = xmlDeclaration || shape.xmlDeclaration;
            doctypeDeclaration = doctypeDeclaration || shape.doctypeDeclaration;
            this.data.shapes[index] = {
                ...this.data.shapes[index],
                selector: {
                    dimensions: shape.state ? [{
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
                    }]
                }
            };

            // Create the SVG setter
            Object.defineProperty(this.data.shapes[index], '_svg', {
                enumerable: false,
                writable: true
            });

            // Create the SVG getter/setter
            Object.defineProperty(this.data.shapes[index], 'svg', {
                enumerable: true,
                configurable: true,
                get() {
                    return this._svg;
                },
                set(svg) {
                    this._svg = svg;
                }
            });

            extend(shape, this.data.shapes[index], index);
        }
    });

    // Remove all non-master shapes
    this.data.shapes = this.data.shapes.filter(shape => !shape.master);

    // Build the sprite SVG file
    files.sprite = this._buildSVG(xmlDeclaration || '', doctypeDeclaration || '');
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
 * Module export
 */
module.exports = SVGSpriteStandalone;
