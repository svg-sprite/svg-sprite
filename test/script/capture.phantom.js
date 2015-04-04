'use strict';

var system = require('system');

if (system.args.length !== 3) {
    console.error('Usage: capture.phantom.js source target');
    phantom.exit();
} else {
	var page			= require('webpage').create();
	page.viewportSize	= {
		width			: 1280,
		height			: 1024
	}
	page.open('file://' + system.args[1], function(status) {
		page.render(system.args[2], {format: 'png', quality: 100});
		console.log(status);
		phantom.exit();
	})
}