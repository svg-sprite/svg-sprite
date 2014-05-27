#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program			= require('commander'),
path				= require('path'),
fs					= require('fs'),
svgsprite			= require('../lib/svg-sprite');

/**
 * Create the SVG sprite
 * 
 * @param {String} cmd			Input directory
 */
function createSprite(cmd) {
	if ((typeof this.out == 'undefined') || !this.out) {
		console.error();
		console.error('You must provide an output directory (--out)');
		console.error();
		process.exit(1);
	}
	
	if (!this.quiet) {
		console.log();
		console.log('Converting the SVG files in directory "%s" to an SVG sprite ...', cmd);
		console.log();
	}
	
	var options = {};
	if (typeof this.render != 'undefined') {
		options.render		= this.render.length ? JSON.parse(this.render) : {};
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
	if (typeof this.common != 'undefined') {
		options.common		= this.common;
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
	if ((typeof this.layout != 'undefined') && (['vertical', 'horizontal', 'diagonal'].indexOf(this.layout) >= 0)) {
		options.layout		= this.layout;
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
	if (typeof this.recursive != 'undefined') {
		options.recursive	= !!this.recursive;
	}
	if (typeof this.verbose != 'undefined') {
		options.verbose		= Math.min(2, Math.max(0, parseInt(this.verbose, 10)));
	}
	if (typeof this.cleanwith != 'undefined') {
		options.cleanwith	= this.cleanwith.length ? this.cleanwith : false;
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

/**
 * Return the version number
 * 
 * @return {String}			Version number
 */
function getVersion() {
	try {
		return JSON.parse(fs.readFileSync(path.dirname(__dirname) + '/package.json', {encoding: 'utf8'})).version;
	} catch(e) {
		return 'N/A';
	}
}

program
	.version(getVersion())
	.option('-o, --out <output-directory>', 'Default output directory for stylesheets and the sprite subdirectory')
	.option('-r, --render <render-config>', 'Rendering configuration [{"css":true}]')
	.option('--spritedir <sprite-directory>', 'Sprite subdirectory name [svg]')
	.option('--sprite <sprite-filename>', 'Sprite file name [sprite]')
	.option('-p, --prefix <selector-prefix>', 'CSS selector prefix [svg]')
	.option('--common <common-selector>', 'Common CSS selector for all images')
	.option('--maxwidth <max-width>', 'Maximum single image width [1000]')
	.option('--maxheight <max-height>', 'Maximum single image height [1000]')
	.option('--padding <padding>', 'Transparent padding around the single images (in pixel)')
	.option('--layout <layout>', 'Sprite images arrangement ("vertical", "horizontal" or "diagonal") [vertical]')
	.option('--pseudo <pseudo-separator>', 'Character sequence for denoting CSS pseudo classes [~]')
	.option('-d, --dims', 'Render image dimensions as separate CSS and / or Sass rules')
	.option('-k, --keep', 'Keep intermediate SVG files (inside the sprite subdirectory)')
	.option('--recursive', 'Recursively scan for SVG files in subdirectories)')
	.option('-v, --verbose', 'Output verbose progress information')
	.option('--cleanwith <clean-module>', 'Module to be used for SVG cleaning. Currently "scour" or "svgo" [scour]')
	.option('--cleanconfig <clean-configuration>', 'JSON-serialized configuration options for the cleaning module')
	.option('-q, --quiet', 'Don\'t print any status messages');
	
program
	.command('*')
	.description('Convert the SVG files in the given directory. If omitted, the current working directory is used.')
	.action(createSprite);
	
program.on('--help', function(){
  console.log('  Examples:');
  console.log('');
  console.log('    $ svg-sprite --out sprite');
  console.log('    $ svg-sprite -co sprite');
  console.log('       Reads SVG files from the current directory and uses the subdirectory "sprite" to create an SVG sprite and CSS file');
  console.log('');
  console.log('    $ svg-sprite --out sprite --render \'{"scss":{"dest":"sprite/sass/_sprite"}}\'');
  console.log('       Creates an SVG sprite and a CSS file along with a Sass file at "sprite/sass/_sprite.scss"');
  console.log('');
  console.log('    $ svg-sprite --keep --dims --out sprite --cleanwith svgo ./svg');
  console.log('    $ svg-sprite -kdo sprite --cleanwith svgo ./svg');
  console.log('       Uses the subdirectory "./svg", creates image size CSS rules, optimizes the single SVG files using SVGO and doesn\'t discard them');
  console.log('');
});

if (!program.parse(process.argv).args.length) {
	createSprite.apply(program, [path.resolve('./')]);
}
