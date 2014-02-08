#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program			= require('commander'),
path				= require('path'),
svgsprite			= require('../lib/svg-sprite');

function createSprite(cmd) {
	if (!this.quiet) {
		console.log('Converting the SVG files in directory "%s" to an SVG sprite ...', cmd);
	}
	var options = {};
	if (typeof this.sassout != 'undefined') {
		options.sassout		= this.sassout;
	}
	if (typeof this.css != 'undefined') {
		options.css			= this.css.length ? this.css : true;
	}
	if (typeof this.sass != 'undefined') {
		options.sass		= this.sass.length ? this.sass : true;
	}
	if (typeof this.spritedir != 'undefined') {
		options.spritedir	= this.spritedir;
	}
	if (typeof this.sprite != 'undefined') {
		options.sprite		= this.sprite;
	}
	if (typeof this.prefix != 'undefined') {
		options.prefix		= this.prefix;
	}
	if (typeof this.maxwidth != 'undefined') {
		options.maxwidth	= parseInt(this.maxwidth, 10);
	}
	if (typeof this.maxheight != 'undefined') {
		options.maxheight	= parseInt(this.maxheight, 10);
	}
	if (typeof this.padding != 'undefined') {
		options.padding		= this.padding;
	}
	if (typeof this.pseudo != 'undefined') {
		options.pseudo		= this.pseudo;
	}
	if (typeof this.dims != 'undefined') {
		options.dims		= !!this.dims;
	}
	if (typeof this.keep != 'undefined') {
		options.keep		= !!this.keep;
	}
	if (typeof this.verbose != 'undefined') {
		options.verbose		= Math.min(2, Math.max(0, parseInt(this.verbose, 10)));
	}
	if (typeof this.cleanwidth != 'undefined') {
		options.cleanwidth	= this.cleanwidth.length ? this.cleanwidth : false;
	}
	if (typeof this.cleanconfig != 'undefined') {
		options.cleanconfig	= this.cleanconfig.length ? JSON.parse(this.cleanconfig) : {};
	}
	svgsprite.createSprite(cmd, this.out, options, function(error, results){
		if (!program.quiet) {
			if (error) {
				console.error(error);
			} else {
				console.log('SUCCESS - %s files have been writen to disk:', results.length);
				for (var file in results.files) {
					console.log('+++ %s (%s bytes)', file, results.files[file]);
				}
			}
		}
	});
}

program
	.version('0.0.1')
	.option('-o, --out <css-directory>', 'Output directory for the CSS file and the sprite subdirectory')
	.option('--sassout <sass-directory>', 'Optional: separate output directory for Sass files [defaults to --out]')
	.option('-c, --css [css-filename]', 'Render CSS file (optionally provide a CSS file name, defaults to "sprite")')
	.option('-s, --sass [sass-filename]', 'Render Sass file (optionally provide a Sass file name, defaults to "sprite")')
	.option('--spritedir <sprite-directory>', 'Sprite subdirectory name [svg]')
	.option('--sprite <sprite-filename>', 'Sprite file name [sprite]')
	.option('-p, --prefix <selector-prefix>', 'CSS selector prefix [svg]')
	.option('--maxwidth <max-width>', 'Maximum single image width [1000]')
	.option('--maxheight <max-height>', 'Maximum single image height [1000]')
	.option('--padding <padding>', 'Transparent padding around the single images (in pixel)')
	.option('--pseudo <pseudo-separator>', 'Character sequence for denoting CSS pseudo classes [~]')
	.option('-d, --dims', 'Render image dimensions as separate CSS and / or Sass rules')
	.option('-k, --keep', 'Keep intermediate SVG files (inside the sprite subdirectory)')
	.option('-v, --verbose', 'Output verbose progress information')
	.option('--cleanwith <clean-module>', 'Module to be used for SVG cleaning. Currently "scour" or "svgo" [scour]')
	.option('--cleanconfig <clean-configuration>', 'JSON-serialized configuration options for the cleaning module')
	.option('-q, --quiet', 'Don\'t produce any output');
	
program
	.command('*')
	.description('Convert the SVG files in the given directory. If omitted, the current working directory is used.')
	.action(createSprite);
	
program.on('--help', function(){
  console.log('  Examples:');
  console.log('');
  console.log('    $ svg-sprite --css --out sprite');
  console.log('    $ svg-sprite -co sprite');
  console.log('       Reads SVG files from the current directory and uses the subdirectory "sprite" to create an SVG sprite and CSS file');
  console.log('');
  console.log('    $ svg-sprite --css --out sprite --sass _sprite --sassout sprite/sass');
  console.log('       Creates an SVG sprite and a CSS file along with a Sass file at "sprite/sass/_sprite.scss"');
  console.log('');
  console.log('    $ svg-sprite --keep --dims --css --out sprite --cleanwith svgo ./svg');
  console.log('    $ svg-sprite -kdco sprite --cleanwith svgo ./svg');
  console.log('       Uses the subdirectory "./svg", creates image size CSS rules, optimizes the single SVG files using SVGO and doesn\'t discard them');
  console.log('');
});

if (!program.parse(process.argv).args.length) {
	createSprite.apply(program, [path.resolve('./')]);
}