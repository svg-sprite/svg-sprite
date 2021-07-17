'use strict';

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/svg-sprite/svg-sprite
 *
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2018 Joschi Kuphal
 * @license MIT https://github.com/svg-sprite/svg-sprite/blob/1.5.x/LICENSE
 */

var SVGO = require('svgo'),
    _ = require('lodash'),
    pretty = require('prettysize'),
    defaultPluginConfig = [

// {cleanupAttrs					: true}, // cleanup attributes from newlines, trailing, and repeating spaces
// {removeDoctype					: true}, // remove doctype declaration
// {removeXMLProcInst				: true}, // remove XML processing instructions
// {removeComments					: true}, // remove comments
// {removeMetadata					: true}, // remove <metadata>
// {removeTitle						: true}, // remove <title>
// {removeDesc						: true}, // remove <desc>
// {removeUselessDefs				: true}, // remove elements of <defs> without id
// {removeXMLNS						: true}, // removes xmlns attribute (for inline svg, disabled by default)
// {removeEditorsNSData				: true}, // remove editors namespaces, elements, and attributes
// {removeEmptyAttrs				: true}, // remove empty attributes
// {removeHiddenElems				: true}, // remove hidden elements
// {removeEmptyText					: true}, // remove empty Text elements
// {removeEmptyContainers			: true}, // remove empty Container elements
// {removeViewBox					: true}, // remove viewBox attribute when possible
// {cleanupEnableBackground			: true}, // remove or cleanup enable-background attribute when possible
// {minifyStyles					: false}, // minify <style> elements content with CSSO
// {convertStyleToAttrs				: false}, // convert styles into attributes
        { inlineStyles: false }, // Move <style> definitions to inline style attributes where possible
// {convertColors					: true}, // convert colors (from rgb() to #rrggbb, from #rrggbb to #rgb)
// {convertPathData					: true}, // convert Path data to relative or absolute (whichever is shorter), convert one segment to another, trim useless delimiters, smart rounding, and much more
// {convertTransform				: true}, // collapse multiple transforms into one, convert matrices to the short aliases, and much more
// {removeUnknownsAndDefaults		: true}, // remove unknown elements content and attributes, remove attrs with default values
// {removeNonInheritableGroupAttrs	: true}, // remove non-inheritable group's "presentation" attributes
// {removeUselessStrokeAndFill		: true}, // remove useless stroke and fill attrs
// {removeUnusedNS					: true}, // remove unused namespaces declaration
// {cleanupIDs						: true}, // remove unused and minify used IDs
// {cleanupNumericValues			: true}, // round numeric values to the fixed precision, remove default px units
// {cleanupListOfValues				: true}, // round numeric values in attributes that take a list of numbers (like viewBox or enable-background)
// {moveElemsAttrsToGroup			: true}, // move elements' attributes to their enclosing group
        { moveGroupAttrsToElems: true }, // move some group attributes to the contained elements
// {collapseGroups					: true}, // collapse useless groups
// {removeRasterImages				: true}, // remove raster images (disabled by default)
// {mergePaths						: true}, // merge multiple Paths into one
// {convertShapeToPath				: true}, // convert some basic shapes to <path>
// {sortAttrs						: true}, // sort element attributes for epic readability (disabled by default)
// {removeDimensions				: true}, // remove width/height attributes if viewBox is present (opposite to removeViewBox, disable it first) (disabled by default)
// {removeAttrs						: true}, // remove attributes by pattern (disabled by default)
// {removeElementsByAttr			: true}, // remove arbitrary elements by ID or className (disabled by default)
// {addClassesToSVGElement			: true}, // add classnames to an outer <svg> element (disabled by default)
// {addAttributesToSVGElement		: true}, // adds attributes to an outer <svg> element (disabled by default)
// {removeStyleElement				: false}, // remove <style> elements (disabled by default)
// {removeScriptElement				: true}, // remove <script> elements (disabled by default)
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
    config.plugins = ('plugins' in config) ? defaultPluginConfig.concat(config.plugins) : defaultPluginConfig;
    config.plugins.push({ removeXMLProcInst: !!spriter.config.svg.xmlDeclaration });
    config.plugins.push({ removeDoctype: !!spriter.config.svg.doctypeDeclaration });

    var svg = shape.getSVG(false),
        svgLength = svg.length,
        svgoInstance = new SVGO(config);

    svgoInstance.optimize(svg).then(function (result) {
        shape.setSVG(result.data);
        var optSVGLength = null;
        for (var t = 0, tl = spriter.config.log.transports.length; t < tl; ++t) {
            if (spriter.config.log.transports[t].level === 'debug') {
                optSVGLength = optSVGLength || shape.getSVG(false).length;
                spriter.debug('Optimized "%s" with SVGO (saved %s / %s%%)', shape.name, pretty(svgLength - optSVGLength), Math.round(100 * (svgLength - optSVGLength) / svgLength));
            }
        }

        cb(null);
    }).catch(function (error) {
        spriter.error('Optimizing "%s" with SVGO failed with error "%s"', shape.name, error);

        cb(error);
    });
};
