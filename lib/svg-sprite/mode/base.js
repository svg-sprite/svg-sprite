'use strict';

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/jkphl/svg-sprite
 *
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2014 Joschi Kuphal
 * @license MIT https://raw.github.com/jkphl/svg-sprite/master/LICENSE
 */

var path							= require('path'),
_									= require('lodash'),
fs									= require('fs'),
mustache							= require('mustache'),
File								= require('vinyl');

/**
 * Sprite base class
 * 
 * @param {SVGSpriter} spriter		SVG spriter
 * @param {Object} config			Configuration
 * @param {Object} data				Base data
 */
function SVGSpriteBase(spriter, config, data) {
	this._spriter					= spriter;
	this.config						= config;
	this.data						= data;
	this.data.mode					= this.mode;
	this._render					= [];
	
	// Resolve file paths
	this.config.dest				= path.resolve(this._spriter.config.dest, this.config.dest);
	if ('sprite' in this.config) {
		var spriteName				= path.basename(this.config.sprite) || 'sprite',
		spritePath					= path.dirname(this.config.sprite);
		spriteName					= spriteName.substring(0, spriteName.length - path.extname(spriteName).length) + '.svg';
		this.config.sprite			= path.resolve(this.config.dest, path.join(spritePath, spriteName));
	}
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
	MODE_VIEW						: 'view'
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
		var basedir					= path.dirname(path.dirname(path.dirname(__dirname))),
		renderConfig				= {
			template				: path.resolve(basedir, path.join('tmpl', this.mode, 'sprite.html')),
			dest					: path.join(this.config.dest, 'sprite.' + this.mode + '.html')
		};
		if (_.isObject(this.config.example)) {
			if ('template' in this.config.example) {
				renderConfig.template		= path.resolve(basedir, this.config.example.template);
			}
			if ('dest' in this.config.example) {
				renderConfig.dest			= path.resolve(this.config.dest, this.config.example.dest);
			}
		} else if (this.config.example !== true) {
			renderConfig			= false;
		}
		this.config.example			= renderConfig;
		data.example				= path.relative(path.dirname(renderConfig.dest), this.config.sprite);
	}
	
	this._spriter.debug("Created «%s» sprite instance", this.mode);
	
	return data;
}

/**
 * Layout the sprite
 * 
 * @param {Array} files				Files
 * @param {Function} cb				Callback
 * @return {void}
 */
SVGSpriteBase.prototype.layout = function(files, cb) {
	cb(null);
}

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
			this._spriter.verbose("Created «%s» HTML example file", this.mode);
		}
	}
	
	cb(null, this.data);
}

/**
 * Return a coordinate (number) with 'px' appended if non-zero
 * 
 * @param {Number} number 			Coordinate (number)
 * @param {String} unit				Unit
 * @return {String} 				Coordinate (number) with unit appended
 */
SVGSpriteBase.prototype._addUnit = function(number, unit) {
	return number + ((number != 0) ? (unit || 'px') : '');
}

/**
 * Module export
 */
module.exports = SVGSpriteBase;