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

var svgo							= require('svgo'),
_									= require('lodash'),
pretty								= require('prettysize'),
defaultPluginConfig					= [
//	{cleanupAttrs					: true}, // cleanup attributes from newlines, trailing and repeating spaces
//	{removeDoctype					: true}, // remove doctype declaration
//	{removeXMLProcInst				: true}, // remove XML processing instructions
//	{removeComments					: true}, // remove comments
//	{removeMetadata					: true}, // remove `<metadata>`
//	{removeTitle					: true}, // remove `<title>`
//	{removeEditorsNSData			: true}, // remove editors namespaces, elements and attributes
//	{removeEmptyAttrs				: true}, // remove empty attributes
//	{removeHiddenElems				: true}, // remove hidden elements
//	{removeEmptyText				: true}, // remove empty Text elements
//	{removeEmptyContainers			: true}, // remove empty Container elements
	{removeViewBox					: false}, // remove `viewBox` attribute when possible
//	{cleanupEnableBackground		: true}, // remove or cleanup `enable-background` attribute when possible
//	{convertStyleToAttrs			: true}, // convert styles into attributes
//	{convertColors					: true}, // convert colors (from `rgb()` to `#rrggbb`, from `#rrggbb` to `#rgb`)
//	{convertPathData				: true}, // convert Path data to relative, convert one segment to another, trim useless delimiters and much more
//	{convertTransform				: true}, // collapse multiple transforms into one, convert matrices to the short aliases and much more
//	{removeUnknownsAndDefaults		: true}, // remove unknown elements content and attributes, remove attrs with default values
//	{removeNonInheritableGroupAttrs	: true}, // remove non-inheritable group's "presentation" attributes
//	{removeUnusedNS					: true}, // remove unused namespaces declaration
//	{cleanupIDs						: true}, // remove unused and minify used IDs
//	{cleanupNumericValues			: true}, // round numeric values to the fixed precision, remove default 'px' units
//	{moveElemsAttrsToGroup			: true}, // move elements attributes to the existing group wrapper
	{moveGroupAttrsToElems			: false} // move some group attributes to the content elements
//	{collapseGroups					: true}, // collapse useless groups
//	{removeRasterImages				: false}, // remove raster images (disabled by default)
//	{mergePaths						: true}, // merge multiple Paths into one
//	{convertShapeToPath				: true}, // convert some basic shapes to path
//	{transformsWithOnePath			: true}, // apply transforms, crop by real width, center vertical alignment and resize SVG with one Path inside
],
svgTweaks							= ['removeXMLProcInst', 'removeDoctype'];

/**
 * SVGO transformation
 * 
 * @param {SVGShape} shape				SVG shape
 * @param {Object} config				Transform configuration
 * @param {SVGSpriter} spriter			Spriter instance
 * @param {Function} cb					Callback
 */
module.exports = function(shape, config, spriter, cb) {
	config							= _.cloneDeep(config);
	config.plugins					= ('plugins' in config) ? defaultPluginConfig.concat(config.plugins) : defaultPluginConfig;
	config.plugins.push({removeXMLProcInst: !!spriter.config.svg.xmlDeclaration});
	config.plugins.push({removeDoctype: !!spriter.config.svg.doctypeDeclaration});
	
	var svg							= shape.getSVG(false),
	svgLength						= svg.length,
	svgoInstance					= new svgo(config);
	
	try {
		svgoInstance.optimize(svg, function(result) {
			shape.setSVG(result.data);
			
			if (spriter.config.log.transports.console.level == 'debug') {
				var optSVGLength	= shape.getSVG(false).length;
				spriter.debug('Optimized "%s" with SVGO (saved %s / %s%%)', shape.name, pretty(svgLength - optSVGLength), Math.round(100 * (svgLength - optSVGLength) / svgLength));
			}
			
			cb(null);
		});
	} catch (error) {
		spriter.error('Optimizing "%s" with SVGO failed with error "%s"', shape.name, error);
		cb(error);
	}
}