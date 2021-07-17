#!/usr/bin/env node

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/svg-sprite/svg-sprite
 *
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2018 Joschi Kuphal
 * @license MIT https://github.com/svg-sprite/svg-sprite/blob/1.5.x/LICENSE
 */

'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
	path = require('path'),
	fs = require('fs'),
	mkdirp = require('mkdirp'),
	File = require('vinyl'),
	yaml = require('js-yaml'),
	glob = require('glob'),
	SVGSpriter = require('../lib/svg-sprite'),
	config = {},
	JSONConfig = { mode: {} },
	map = {},
	yargs = require('yargs')
		.usage('Create one or multiple sprites of the given SVG files, optionally along with some stylesheet resources.\nUsage: $0 [options] files')
		.version('version', 'Show version number', JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), { encoding: 'utf8' })).version)
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
 * @param {String} name Option name
 * @param {Object} option Option configuration
 * @return {void}
 */
function addOption(name, option) {
	var alias = name;

	// If the this is an option itself
	if ('description' in option) {
		if ('alias' in option) {
			alias = option.alias;
			yargs = yargs.alias(alias, name);
		}

		yargs = yargs.describe(alias, option.description);

		if ('default' in option) {
			var template = (name.substr(-9) === '-template'),
				def = template ? path.resolve(path.dirname(__dirname), option.default) : option.default;
			yargs = yargs.default(alias, def);

			if ((option.default === true) || (option.default === false)) {
				yargs = yargs.boolean(name);
			}

		} else if (option.required) {
			yargs = yargs.require(alias);
		}

		if ('map' in option) {
			map[option.map] = name;
		}
	}

	var children = _.omit(option, ['description', 'alias', 'default', 'map']);
	for (var sub in children) {
		addOption(name + '-' + sub, children[sub]);
	}
}

/**
 * Add a value to the global configuration
 *
 * @param {Object} store Configuration
 * @param {Array} path Path
 * @param {Mixed} value Value
 */
function addConfigMap(store, path, value) {
	var key = path.shift();
	if (path.length) {
		if (!(key in store) || !_.isObject(store[key])) {
			store[key] = {};
		}
		addConfigMap(store[key], path, value);
	} else {
		store[key] = value;
	}
}

/**
 * Recursively write files to disc
 *
 * @param {Object} files Files
 * @return {Number} Number of written files
 */
function writeFiles(files) {
	var written = 0;
	for (var key in files) {
		if (_.isObject(files[key])) {
			if (files[key].constructor === File) {
				mkdirp.sync(path.dirname(files[key].path));
				fs.writeFileSync(files[key].path, files[key].contents);
				++written;
			} else {
				written += writeFiles(files[key]);
			}
		}
	}
	return written;
}

// Get document, or throw exception on error
try {
	var options = yaml.safeLoad(fs.readFileSync(path.resolve(__dirname, 'config.yaml'), 'utf8'));
	for (var name in options) {
		addOption(name, options[name]);
	}

} catch (e) {
	console.log(e);
}

var argv = yargs.argv;

// Map all arguments to a global configuration object
for (var m in map) {
	if (!(map[m] in argv)) {
		continue;
	}
	addConfigMap(config, m.split('.'), argv[map[m]]);
}

// Load external JSON config file
if (argv['config']) {
	try {
		var file = argv['config'];
		delete argv['config'];
		delete argv['C'];
		var JSONConfigContent = fs.readFileSync(path.resolve(file));
		var externalConfig = JSON.parse(JSONConfigContent);

		// Make a clone of initial config for options removal checks
		JSONConfig = JSON.parse(JSONConfigContent);
		if (!('mode' in JSONConfig)) {
			JSONConfig['mode'] = {};
		}

		// Expand shorthand mode definitions
		if (('mode' in externalConfig) && _.isObject(externalConfig.mode)) {
			for (var emode in externalConfig.mode) {
				if (externalConfig.mode[emode] === true) {
					externalConfig.mode[emode] = JSONConfig.mode[emode] = {
						render: {
							css: true
						}
					};
				}
			}
		}

		_.merge(config, externalConfig);
	} catch (e) {
		console.error('[ERROR] Skipping --config file due to errors ("%s")', e.message.trim());
	}
}

// Refine particular config options
config.shape.spacing.padding = ('' + config.shape.spacing.padding).trim();
config.shape.spacing.padding = config.shape.spacing.padding.length ? config.shape.spacing.padding.split(',').map(function (dim) {
	return parseFloat(dim || 0, 10);
}) : [];

if (config.svg.rootAttributes && typeof config.svg.rootAttributes === 'string') {
	try {
		var JSONAttributesContent = fs.readFileSync(path.resolve(config.svg.rootAttributes));
		config.svg.rootAttributes = JSON.parse(JSONAttributesContent);
	} catch (e) {
		console.error('[ERROR] Skipping --svg-rootattrs file due to errors ("%s")', e.message.trim());
		config.svg.rootAttributes = {};
	}
}

// Expand transformation options
if (typeof config.shape.transform === 'string') {
	var transform = ('' + config.shape.transform).trim();
	config.shape.transform = [];
	(transform.length ? transform.split(',').map(function (trans) {
		return ('' + trans).trim();
	}) : []).forEach(function (transform) {
		if (transform.length) {
			if (('shape-transform-' + transform) in argv) {
				try {
					var transformConfigFile = argv['shape-transform-' + transform],
						transformConfigJSON = fs.readFileSync(path.resolve(transformConfigFile), { encoding: 'utf8' }),
						transformConfig = transformConfigJSON.trim() ? JSON.parse(transformConfigJSON) : {};
					this.push(_.zipObject([transform], [transformConfig]));
				} catch (e) {
				}
			} else {
				this.push(transform);
			}
		}
	}, config.shape.transform);
}

// Run through all sprite modes
['css', 'view', 'defs', 'symbol', 'stack'].forEach(function (mode) {
	if (!argv[mode] && !(mode in JSONConfig.mode)) {
		delete this[mode];
		return;
	}

	// Remove excessive render types
	['css', 'scss', 'less', 'styl'].forEach(function (render) {
		var arg = mode + '-render-' + render;
		if ((render in this) && !argv[arg] && (!(mode in JSONConfig.mode) || !('render' in JSONConfig.mode[mode]) || !(render in JSONConfig.mode[mode].render))) {
			delete this[render];
		}
	}, this[mode].render);

	if (!this[mode].dimensions.length) {
		this[mode].dimensions = true;
	}
}, config.mode);

// Remove excessive example options
for (var mode in config.mode) {
	var example = mode + '-example';
	if (!argv[example] && (!(mode in JSONConfig.mode) || !('example' in JSONConfig.mode[mode])) && ('example' in config.mode[mode])) {
		delete config.mode[mode].example;
	}
}

// Read & parse Mustache variable JSON file
if ('variables' in config) {
	var variables = ('' + config.variables).trim();
	delete config.variables;
	variables = variables.length ? path.resolve(variables) : null;
	if (variables && fs.existsSync(variables)) {
		try {
			config.variables = JSON.parse(fs.readFileSync(variables));
		} catch (e) {
			console.error('[ERROR] Skipping --variables file due to errors ("%s")', e.message.trim());
		}
	}
}

var spriter = new SVGSpriter(config);
_.reduce(argv._, function (f, g) {
	return f.concat(glob.sync(g));
}, []).forEach(function (file) {
	var basename = file;
	file = path.resolve(file);
	var stat = fs.lstatSync(file);
	if (stat.isSymbolicLink()) {
		file = fs.readlinkSync(file);
		basename = path.basename(file);
	} else {
		var basepos = basename.lastIndexOf('./');
		basename = (basepos >= 0) ? basename.substr(basepos + 2) : path.basename(file);
	}
	spriter.add(file, basename, fs.readFileSync(file));
});

spriter.compile(function (error, result /*, data*/) {
	if (error) {
		console.error(error);
	} else {
		writeFiles(result);
	}
});
