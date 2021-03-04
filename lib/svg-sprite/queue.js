'use strict';

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/svg-sprite/svg-sprite
 *
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2018 Joschi Kuphal
 * @license MIT https://github.com/svg-sprite/svg-sprite/blob/master/LICENSE.txt
 */

var path				= require('path'),
async					= require('async'),
events					= require('events'),
SHAPE					= require('./shape');

/**
 * SVGSpriter queue
 *
 * @param {SVGSpriter} spriter			SVGSpriter instance
 */
function SVGSpriterQueue(spriter) {
	this._spriter		= spriter;
	this._files			= [];
	this.active			= 0;

	events.EventEmitter.call(this);
	this.on('add', this.process.bind(this));
	this.on('remove', this.process.bind(this));

	this._spriter.debug('Created processing queue instance');
}

/**
 * Prototype
 *
 * @type {Object}
 */
SVGSpriterQueue.prototype = Object.create(events.EventEmitter.prototype);

/**
 * Add a shape to the processing queue
 *
 * @param {File} file					Shape file
 */
SVGSpriterQueue.prototype.add = function(file) {
	this._spriter.debug('Added "%s" to processing queue', file.path.substr(file.base.length + path.sep.length));
	this._files.push(file);
	this.emit('add');
};

/**
 * Try to process an item in the queue
 */
SVGSpriterQueue.prototype.process = function() {
	if (this._files.length && (this.active < this._spriter._limit)) {
		++this.active;
		var file		= this._files.shift();

		// Instantiate the shape
		try {
			var shape	= new SHAPE(file, this._spriter),
			spriter		= this._spriter;

		// In case of errors: Skip the file
		} catch(e) {
			this._spriter.error('Skipping "%s" (%s)', file.path.substr(file.base.length + path.sep.length), e.message);
			this.emit(--this.active ? 'remove' : 'empty');
			return;
		}

		// Subsequently run through all optimization and compilation tasks
		async.waterfall([

			// Transform the shape
			function(_cb){
				spriter._transformShape(shape, _cb);
			},

			// Complement the shape
			function(_cb){
				shape.complement(_cb);
			}

		], this.remove.bind(this));
	}
};

/**
 * Remove a shape from the queue
 *
 * @param {Error} error					Error
 * @param {SVGShape} shape				Processed shape
 */
SVGSpriterQueue.prototype.remove = function(error, shape) {
	Array.prototype.push.apply(this._spriter._shapes, shape.distribute());
	this.emit(--this.active ? 'remove' : 'empty');
};

/**
 * Module export (constructor wrapper)
 *
 * @param {SVGSpriter} spriter			SVGSpriter instance
 * @return {SVGSpriterQueue}			SVGSpriterQueue instance
 */
module.exports = SVGSpriterQueue;
