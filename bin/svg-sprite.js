#!/usr/bin/env node

/**
 * Module dependencies.
 */
var _				= require('lodash'),
path				= require('path'),
fs					= require('fs'),
mkdirp				= require('mkdirp'),
File				= require('vinyl'),
yaml				= require('js-yaml')
SVGSpriter			= require('../lib/svg-sprite'),
config				= {},
map					= {},
yargs				= require('yargs')
					.usage('Create one or multiple sprites of the given SVG files, optionally along with some stylesheet resources.\nUsage: $0 [options] files')
					.version(JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), {encoding: 'utf8'})).version, 'version')
					.help('help', 'Display this help information')
					.example('$0 --css --css-render-css --css-example --dest=out assets/*.svg', 'Create a CSS sprite of the given SVG files including example document to the sub directory "out"')
					.example('$0 -cD out --ccss --cx assets/*.svg', 'Same as above')
					.example('$0 -cD out --cscss -p 10 assets/*.svg', 'Same as above, but render Sass instead of CSS and add 10px padding around all shapes')
					.showHelpOnFail(true)
					.demand(1);

/**
 * Add a command line option
 * 
 * @param {String} name				Option name
 * @param {Object} option			Option configuration
 * @return {void}
 */
function addOption(name, option) {
	var alias					= name;
	
	// If the this is an option itself
	if ('description' in option) {
		if ('alias' in option) {
			alias				= option.alias;
			yargs				= yargs.alias(alias, name);
		}
		
		yargs					= yargs.describe(alias, option.description);
		
		if ('default' in option) {
			var template		= (name.substr(-9) == '-template'),
			def					= template ? path.resolve(path.dirname(__dirname), option.default) : option.default;
			yargs				= yargs.default(alias, def);
		} else if (option.required) {
			yargs				= yargs.require(alias);
		}
		
		if ('map' in option) {
			map[option.map]		= name;
		}
	}
	
	var children				= _.omit(option, ['description', 'alias', 'default', 'map']);
	for (var sub in children) {
		addOption(name + '-' + sub, children[sub]);
	}
}

/**
 * Add a value to the global configuration
 * 
 * @param {Object} store			Configuration
 * @param {Array} path				Path
 * @param {Mixed} value				Value				
 */
function addConfigMap(store, path, value) {
	var key					= path.shift();
	if (path.length) {
		if (!(key in store)) {
			store[key]		= {};
		}
		addConfigMap(store[key], path, value);
	} else {
		store[key]		= value;
	}
}

/**
 * Recursively write files to disc
 * 
 * @param {Object} files			Files
 * @return {Number}					Number of written files
 */
function writeFiles(files) {
	var written				= 0;
	for (var key in files) {
		if (_.isObject(files[key])) {
			if (files[key].__proto__.constructor == File) {
				mkdirp.sync(path.dirname(files[key].path));
				fs.writeFileSync(files[key].path, files[key].contents);
				++written;
			} else {
				written		+= writeFiles(files[key]);
			}
		}
	}
	return written;
}

// Get document, or throw exception on error
try {
	var options		= yaml.safeLoad(fs.readFileSync(path.resolve(__dirname, 'config.yaml'), 'utf8'));
	for (var name in options) {
		addOption(name, options[name]);
	}
	
} catch (e) {
	console.log(e);
}

var argv			= yargs.argv;

// Map all arguments to a global configuration object
for (var m in map) {
	if (!(map[m] in argv)) {
		continue;
	}
	addConfigMap(config, m.split('.'), argv[map[m]]);
}

// Refine particular config options
config.shape.spacing.padding		= ('' + config.shape.spacing.padding).trim();
config.shape.spacing.padding		= config.shape.spacing.padding.length ? config.shape.spacing.padding.split(',').map(function(dim) { return parseFloat(dim || 0, 10); }) : [];

config.transform					= ('' + config.transform).trim();
config.transform					= config.transform.length ? config.transform.split(',').map(function(trans){ return ('' + trans).trim(); }) : [];

['css', 'view', 'defs', 'symbol', 'stack'].forEach(function(mode){
	if (!argv[mode]) {
		delete this[mode];
	} else if (['css', 'view'].indexOf(mode) >= 0) {
		['css', 'scss', 'less', 'styl'].forEach(function(render){
			var arg							= 'css-render-' + render;
			if (!argv[arg] && (render in this)) {
				delete this[render];
			}
		}, this[mode].render);
	}
}, config.mode);

for (var mode in config.mode) {
	var example						= mode + '-example';
	if (!argv[example] && ('example' in config.mode[mode])) {
		delete config.mode[mode].example;
	}
}

var spriter							= new SVGSpriter(config);
argv._.forEach(function(file){
	file							= path.resolve(file);
	var stat						= fs.lstatSync(file);
	if (stat.isSymbolicLink()) {
		file						= fs.readlinkSync(file);
	}
	spriter.add(file, path.basename(file), fs.readFileSync(file));
});

spriter.compile(function(error, result, data) {
	if (error) {
		console.error(error);
	} else {
		writeFiles(result);
	}
});