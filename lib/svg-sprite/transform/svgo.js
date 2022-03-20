'use strict';

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/svg-sprite/svg-sprite
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2018 Joschi Kuphal
 * @license MIT https://github.com/svg-sprite/svg-sprite/blob/main/LICENSE
 */

const merge = require('lodash.merge');
const svgo = require('svgo');
const pretty = require('prettysize');

/**
 * SVGO transformation
 *
 * @param {SVGShape} shape                SVG shape
 * @param {object} config                 Transform configuration
 * @param {SVGSpriter} spriter            Spriter instance
 * @param {Function} cb                   Callback
 */
module.exports = function(shape, config, spriter, cb) {
    const defaultPluginsConfig = ['preset-default'];

    config = merge({}, config);
    config.plugins = 'plugins' in config ? config.plugins : defaultPluginsConfig;

    config.plugins.push({
        // remove xml declaration if config.svg.xmlDeclaration is falsy
        name: 'removeXMLProcInst',
        active: !spriter.config.svg.xmlDeclaration
    }, {
        // remove docType if config.svg.doctypeDeclaration is falsy
        name: 'removeDoctype',
        active: !spriter.config.svg.doctypeDeclaration
    });

    const svg = shape.getSVG(false);
    const svgLength = svg.length;

    try {
        const result = svgo.optimize(svg, config);
        shape.setSVG(result.data);
        let optSVGLength = null;

        for (const transport of spriter.config.log.transports) {
            if (transport.level === 'debug') {
                optSVGLength = optSVGLength || shape.getSVG(false).length;
                const size = svgLength - optSVGLength;
                const percentage = Math.round(100 * (size) / svgLength);
                spriter.debug('Optimized "%s" with SVGO (saved %s / %s%%)', shape.name, pretty(size), percentage);
            }
        }

        cb(null);
    } catch (error) {
        spriter.error('Optimizing "%s" with SVGO failed with error "%s"', shape.name, error);
        cb(error);
    }
};
