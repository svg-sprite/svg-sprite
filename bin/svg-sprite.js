#!/usr/bin/env node

'use strict';

/**
 * Module dependencies.
 */
var _				= require('lodash'),
path				= require('path'),
fs					= require('fs'),
mkdirp				= require('mkdirp'),
File				= require('vinyl'),
yaml				= require('js-yaml'),
glob				= require('glob'),
SVGSpriter			= require('../lib/svg-sprite'),
config				= {},
map					= {},
yargs				= require('yargs')
					.usage('Create one or multiple sprites of the given SVG files, optionally along with some stylesheet resources.\nUsage: $0 [options] files')
					.version(JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), {encoding: 'utf8'})).version, 'version')
					.help('help', 'Display this help information')
					.wrap(null)
					.example('$0 --css --css-render-css --css-example --dest=out assets/*.svg', 'Create a CSS sprite of the given SVG files including example document to the subdirectory "out"')
					.example('$0 -cD out --ccss --cx assets/*.svg', 'Same as above')
					.example('$0 -cD out --cscss -p 10 assets/*.svg', 'Render Sass instead of CSS and add 10px padding around all shapes (no example document this time)')
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
			var template		= (name.substr(-9) === '-template'),
			def					= template ? path.resolve(path.dirname(__dirname), option.default) : option.default;
			yargs				= yargs.default(alias, def);
			
			if ((option.default === true) || (option.default === false)) {
				yargs			= yargs.boolean(name);
			}
 			
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
			if (files[key].constructor === File) {
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

// Expand transformation options
var transform						= ('' + config.shape.transform).trim();
config.shape.transform					= [];
(transform.length ? transform.split(',').map(function(trans){ return ('' + trans).trim(); }) : []).forEach(function(transform){
	if (transform.length) {
		if (('transform-' + transform) in argv) {
			try {
				var transformConfigFile		= argv['transform-' + transform],
				transformConfigJSON			= fs.readFileSync(path.resolve(transformConfigFile), {encoding: 'utf8'}),
				transformConfig				= transformConfigJSON.trim() ? JSON.parse(transformConfigJSON) : {};
				this.push(_.object([transform], [transformConfig]));
			} catch(e) {}
		} else {
			this.push(transform);
		}
	}
}, config.shape.transform);

// Run through all sprite modes
['css', 'view', 'defs', 'symbol', 'stack'].forEach(function(mode){
	if (!argv[mode]) {
		delete this[mode];
		return;
	} else if (['css', 'view'].indexOf(mode) >= 0) {
		
		// Remove excessive render types
		['css', 'scss', 'less', 'styl'].forEach(function(render){
			var arg							= mode + '-render-' + render;
			if (!argv[arg] && (render in this)) {
				delete this[render];
			}
		}, this[mode].render);
	}
	
	if (!this[mode].dimensions.length) {
		this[mode].dimensions		= true;
	}
}, config.mode);

// Remove excessive example options
for (var mode in config.mode) {
	var example						= mode + '-example';
	if (!argv[example] && ('example' in config.mode[mode])) {
		delete config.mode[mode].example;
	}
}

// Read & parse Mustache variable JSON file
if ('variables' in config) {
	var variables					= ('' + config.variables).trim();
	delete config.variables;
	variables						= variables.length ? path.resolve(variables) : null;
	if (variables && fs.existsSync(variables)) {
		try {
			config.variables		= JSON.parse(fs.readFileSync(variables));
		} catch(e) {
			console.error('[ERROR] Skipping --variables file due to errors ("%s")', e.message.trim());
		}
	}
}

var spriter							= new SVGSpriter(config);
_.reduce(argv._, function(f, g){ return f.concat(glob.sync(g)); }, []).forEach(function(file){
	file							= path.resolve(file);
	var stat						= fs.lstatSync(file);
	if (stat.isSymbolicLink()) {
		file						= fs.readlinkSync(file);
	}
	spriter.add(file, path.basename(file), fs.readFileSync(file));
});

spriter.compile(function(error, result /*, data*/) {
	if (error) {
		console.error(error);
	} else {
		writeFiles(result);
	}
});