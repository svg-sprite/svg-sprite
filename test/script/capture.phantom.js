'use strict';

if (phantom.args.length !== 2) {
    console.error('Usage: capture.phantom.js source target');
    phantom.exit();
} else {
	var page			= require('webpage').create();
	page.viewportSize	= {
		width			: 1280,
		height			: 1024
	}
	page.open('file://' + phantom.args[0], function(status) {
		page.render(phantom.args[1], {format: 'png', quality: 100});
		console.log(status);
		phantom.exit();
	})
}