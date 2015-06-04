'use strict';

/* jshint -W117 */

if (phantom.args.length !== 2) {
    console.error('Usage: dimensions.phantom.js svg path');
} else {
	var page			= require('webpage').create();
	page.setContent(phantom.args[0], phantom.args[1]);
	console.log(JSON.stringify(page.evaluate(function() {
		return document.getElementsByTagName('svg')[0].getBoundingClientRect();
	})));
}

phantom.exit();