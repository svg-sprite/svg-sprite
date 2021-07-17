'use strict';

/* jshint -W117 */

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/svg-sprite/svg-sprite
 *
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2018 Joschi Kuphal
 * @license MIT https://github.com/svg-sprite/svg-sprite/blob/1.5.x/LICENSE
 */

var system = require('system');

if (system.args.length !== 3) {
    console.error('Usage: dimensions.phantom.js svg path');
	phantom.exit();
} else {
	var page			= require('webpage').create();
	var svg				= system.args[1];
	page.setContent('<svg xmlns="http://www.w3.org/2000/svg"><svg ' + svg.substr(svg.toLowerCase().indexOf('<svg') + 4) + '</svg>', system.args[2]);
	console.log(JSON.stringify(page.evaluate(function() {
		return document.getElementsByTagName('svg')[1].getBoundingClientRect();
	})));
}

phantom.exit();
