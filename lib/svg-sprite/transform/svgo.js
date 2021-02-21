'use strict';

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/jkphl/svg-sprite
 *
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2018 Joschi Kuphal
 * @license MIT https://raw.github.com/jkphl/svg-sprite/master/LICENSE
 */

var svgo = require('svgo'),
    _ = require('lodash'),
    pretty = require('prettysize'),
    defaultPluginConfig = [
        {
            name: 'inlineStyles',
            active: false
        },
        {
            name: 'moveGroupAttrsToElems',
            active: true
        }
    ];

/**
 * SVGO transformation
 *
 * @param {SVGShape} shape                SVG shape
 * @param {Object} config                Transform configuration
 * @param {SVGSpriter} spriter            Spriter instance
 * @param {Function} cb                    Callback
 */
module.exports = function (shape, config, spriter, cb) {
    config = _.cloneDeep(config);
    config.plugins = svgo.extendDefaultPlugins('plugins' in config ? defaultPluginConfig.concat(config.plugins) : defaultPluginConfig);
    config.plugins.push({
        name: 'removeXMLProcInst',
        active: !!spriter.config.svg.xmlDeclaration
    }, {
        name: 'removeDoctype',
        active: !!spriter.config.svg.doctypeDeclaration
    });

    var svg = shape.getSVG(false),
        svgLength = svg.length;

    try {
        var result = svgo.optimize(svg, config);
        shape.setSVG(result.data);
        var optSVGLength = null;
        for (var t = 0, tl = spriter.config.log.transports.length; t < tl; ++t) {
            if (spriter.config.log.transports[t].level === 'debug') {
                optSVGLength = optSVGLength || shape.getSVG(false).length;
                spriter.debug('Optimized "%s" with SVGO (saved %s / %s%%)', shape.name, pretty(svgLength - optSVGLength), Math.round(100 * (svgLength - optSVGLength) / svgLength));
            }
        }

        cb(null);
    } catch (error) {
        spriter.error('Optimizing "%s" with SVGO failed with error "%s"', shape.name, error);

        cb(error);
    }
};
