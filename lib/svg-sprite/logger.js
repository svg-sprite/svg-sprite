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

var util			= require('util');

/**
 * SVGSpriter logger
 * 
 * @param {Number} level				Log level
 */
function SVGSpriterLogger(level) {
	this.level		= level;
}

/**
 * Prototype
 * 
 * @type {Object} 
 */
SVGSpriterLogger.prototype = {
	LEVEL_ERROR		: -1,
	LEVEL_NONE		: 0,
	LEVEL_NOTICE	: 1,
	LEVEL_INFO		: 2,
	LEVEL_DEBUG		: 3
};

/**
 * Output a log message
 * 
 * In fact, the method takes an arbitrary number of arguments. The first one may contain placeholders (%s, %d or %j),
 * in which case the following ones will be taken as values for replacing the placeholders. The last argument (if any)
 * will be interpreted as log level.
 * 
 * @param {String} message				Message
 * @param {Number} level				Log level
 * @return {SVGSpriterLogger}			Self reference
 */
SVGSpriterLogger.prototype.log = function(message, level) {
	var messageLevel	= this._logMessageLevel.apply(this, arguments);
	if (messageLevel.level <= this.level) {
		(typeof messageLevel.message == 'object') ? this._logObject(messageLevel.message, false) : this._logText(messageLevel.message, false);
	}
	return this;
}

/**
 * Output a log error
 * 
 * See SVGSpriterLogger.log()
 * 
 * @param {String} message				Message
 * @param {Number} level				Log level
 * @return {SVGSpriterLogger}			Self reference
 */
SVGSpriterLogger.prototype.error = function(message, level) {
	var messageLevel	= this._logMessageLevel.apply(this, arguments);
	if (messageLevel.level <= this.level) {
		(typeof messageLevel.message == 'object') ? this._logObject(messageLevel.message, true) : this._logText(messageLevel.message, true);
	}
	return this;
}

/**
 * Format a log message
 * 
 * In fact, the method takes an arbitrary number of arguments. The first one may contain placeholders (%s, %d or %j),
 * in which case the following ones will be taken as values for replacing the placeholders. The last argument (if any)
 * will be interpreted as log level.
 * 
 * @param {String} message				Message
 * @param {Number} level				Log level
 * @return {Array						Formatted message and log level
 */
SVGSpriterLogger.prototype._logMessageLevel = function(message, level) {
	var placeholders	= (typeof message == 'object') ? false : (('' + message).match(/%[sdj]/g) || []).length;
	if (placeholders) {
		message			= util.format.apply(null, Array.prototype.slice.call(arguments, 0, placeholders + 1));
		level			= Array.prototype.slice.call(arguments, placeholders + 1);
		level			= Math.max(0, Math.min(3, parseInt(level.length ? (level[0] || 0) : 0, 10)));
	} else {
		level			= Math.max(0, Math.min(3, parseInt(level || 0, 10)));
	}
	return {message: message, level: level};
}

/**
 * Output a text message
 * 
 * @param {Mixed} text					Text message
 * @param {Boolean} error				Error
 */
SVGSpriterLogger.prototype._logText = function(text, error) {
	console[error ? 'error' : 'log'](text);
}

/**
 * Output an object message
 * 
 * @param {Object} obj					Object message
 * @param {Boolean} error				Error
 */
SVGSpriterLogger.prototype._logObject = function(obj, error) {
	console[error ? 'error' : 'log'](util.inspect(obj, {showHidden: true, depth: null}))
}

/**
 * Module export (constructor wrapper)
 * 
 * @param {Number} level				Log level
 * @return {SVGSpriterLogger}			SVGSpriterr logger
 */
module.exports = function(level) {
	return new SVGSpriterLogger(level);
}