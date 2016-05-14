'use strict';

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/jkphl/svg-sprite
 *
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2016 Joschi Kuphal
 * @license MIT https://raw.github.com/jkphl/svg-sprite/master/LICENSE
 */

var path							= require('path'),
_									= require('lodash'),
fs									= require('fs'),
async								= require('async'),
mustache							= require('mustache'),
os 									= require('os'),
File								= require('vinyl'),
crypto								= require('crypto');

/**
 * Sprite base class
 *
 * @param {SVGSpriter} spriter		SVG spriter
 * @param {Object} config			Configuration
 * @param {Object} data				Base data
 * @param {String} key				Mode key
 */
function SVGSpriteBase(spriter, config, data, key) {
	this._spriter					= spriter;
	this.config						= config;
	this.key						= key || this.mode;
	this.data						= data;
	this.data.mode					= this.mode;
	this.data.key					= this.key;

	// Resolve file paths
	this.config.dest				= path.resolve(this._spriter.config.dest, this.config.dest);
	if ('sprite' in this.config) {
		var spriteName				= path.basename(this.config.sprite) || 'sprite',
		spritePath					= path.dirname(this.config.sprite);
		if (spriteName.indexOf('.') < 0) {
			spriteName				+= '.svg';
		}
		this.config.sprite			= path.resolve(this.config.dest, path.join(spritePath, spriteName));
	}

	// Prepare the rendering configurations
	if (('render' in this.config) && _.isObject(this.config.render)) {
		for (var extension in this.config.render) {
			var renderConfig		= {
				template			: path.resolve(path.dirname(path.dirname(path.dirname(__dirname))), path.join('tmpl', this.tmpl, 'sprite.' + extension)),
				dest				: path.join(this.config.dest, 'sprite.' + extension)
			};
			if (_.isObject(this.config.render[extension])) {
				if ('template' in this.config.render[extension]) {
					renderConfig.template		= path.resolve(process.cwd(), this.config.render[extension].template);
				}
				if ('dest' in this.config.render[extension]) {
					renderConfig.dest			= path.resolve(this.config.dest, this.config.render[extension].dest);
					if (!renderConfig.dest.match(new RegExp('\\.' + extension + '$', 'i'))) {
						renderConfig.dest		+= '.' + extension;
					}
				}
			} else if (this.config.render[extension] !== true) {
				delete this.config.render[extension];
				continue;
			}
			this.config.render[extension]		= renderConfig;
		}
		this._cssDest				= ('css' in this.config.render) ? path.dirname(this.config.render.css.dest) : this.config.dest;
	} else {
		this._cssDest				= this.config.dest;
	}

	// Cache busting
	this.config.bust				= !!this.config.bust;

	// Prepare the CSS prefix
	this.config.prefix				= this.config.prefix.trim();
	if (!/%s/g.test(this.config.prefix.split('%%').join(''))) {
		this.config.prefix			+= '%s';
	}

	// Refine the base data
	this.data						= _.merge(this.data, this._initData({
		padding						: this._spriter.config.shape.spacing.padding,
		sprite						: path.relative(this._cssDest, this.config.sprite).split(path.sep).join('/')
	}));

	this._init();
}

/**
 * Prototype
 *
 * @type {Object}
 */
SVGSpriteBase.prototype = {
	MODE_CSS						: 'css',
	MODE_DEFS						: 'defs',
	MODE_SYMBOL						: 'symbol',
	MODE_STACK						: 'stack',
	MODE_VIEW						: 'view',

	tmpl							: 'common'
};

/**
 * Extended data initialization
 *
 * @param {Object} data				Data
 * @return {Object}					Extended data
 */
SVGSpriteBase.prototype._initData = function(data) {

	// If the HTML example should be rendered
	if (this.config.example) {
		var renderConfig			= {
			template				: path.resolve(path.dirname(path.dirname(path.dirname(__dirname))), path.join('tmpl', this.mode, 'sprite.html')),
			dest					: path.join(this.config.dest, 'sprite.' + this.key + '.html')
		};
		if (_.isObject(this.config.example)) {
			if ('template' in this.config.example) {
				renderConfig.template		= path.resolve(process.cwd(), this.config.example.template);
			}
			if ('dest' in this.config.example) {
				renderConfig.dest			= path.resolve(this.config.dest, this.config.example.dest);
			}
		} else if (this.config.example !== true) {
			renderConfig			= false;
		}
		this.config.example			= renderConfig;
		data.example				= path.relative(path.dirname(renderConfig.dest), this.config.sprite).split(path.sep).join('/');
	}

	this._spriter.debug('Created «%s» sprite instance («%s» mode)', this.key, this.mode);

	return data;
};

/**
 * Layout the sprite
 *
 * @param {Array} files				Files
 * @param {Function} cb				Callback
 * @return {void}
 */
SVGSpriteBase.prototype.layout = function(files, cb) {
	cb(null);
};

/**
 * Build the configured CSS resources
 *
 * @param {Array} files				Files
 * @param {Function} cb				Callback
 * @return {void}
 */
SVGSpriteBase.prototype._buildCSSResources = function(files, cb) {
	var tasks						= [],
	createResourceTask				= function(renderConfig, data, spriter, ext){
		return function(_cb) {
			var out					= mustache.render(fs.readFileSync(renderConfig.template, 'utf-8'), data);
			if (out.length) {
				files[ext]			= new File({
					base			: spriter.config.dest,
					path			: renderConfig.dest,
					contents		: new Buffer(out)
				});
				spriter.verbose('Created «%s» stylesheet resource', ext);
			}
			_cb(null);
		};
	};

	for (var extension in this.config.render) {
		tasks.push(createResourceTask(this.config.render[extension], this.data, this._spriter, extension));
	}

	async.parallelLimit(tasks, os.cpus().length * 2, cb);
};

/**
 * Build the HTML example (non-CSS modes)
 *
 * @param {Array} files				Files
 * @param {Function} cb				Callback
 * @return {void}
 */
SVGSpriteBase.prototype._buildHTMLExample = function(files, cb) {
	if (this.config.example) {
		var out						= mustache.render(fs.readFileSync(this.config.example.template, 'utf-8'), this.data);
		if (out.length) {
			files.example			= new File({
				base				: this._spriter.config.dest,
				path				: this.config.example.dest,
				contents			: new Buffer(out)
			});
			this._spriter.verbose('Created «%s» HTML example file', this.key);
		}
	}

	cb(null, this.data);
};

/**
 * Return a coordinate (number) with 'px' appended if non-zero
 *
 * @param {Number} number 			Coordinate (number)
 * @param {String} unit				Unit
 * @return {String} 				Coordinate (number) with unit appended
 */
SVGSpriteBase.prototype._addUnit = function(number, unit) {
	return number + ((number !== 0) ? (unit || 'px') : '');
};

/**
 * Evaluate and return a declaration value
 *
 * @param {Mixed} global			Global declaration setting
 * @param {String} local			Local declaration value
 * @return {String}					Evaluated declaration value
 */
SVGSpriteBase.prototype.declaration = function(global, local) {
	if (global === true) {
		return local || '';
	}
	return String(global || '').trim();
};

/**
 * Add cache busting
 *
 * @param {SVGSprite} svg			SVG sprite
 * @return {String}					Sprite path
 */
SVGSpriteBase.prototype._addCacheBusting = function(svg) {
	var sprite						= this.config.sprite;
	if (this.config.bust) {
		var hash					= '-' + crypto.createHash('md5')
									.update(svg.toString(), 'utf8')
									.digest('hex')
									.substr(0, 8),
		extension					= path.extname(sprite);
		sprite						= path.join(path.dirname(sprite), path.basename(sprite, extension) + hash + extension);
		this.data.sprite			= path.relative(this._cssDest, sprite).split(path.sep).join('/');
		if (this.config.example) {
			this.data.example		= path.relative(path.dirname(this.config.example.dest), sprite).split(path.sep).join('/');
		}
	}

	return sprite;
};

/**
 * Module export
 */
module.exports = SVGSpriteBase;
