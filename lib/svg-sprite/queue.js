'use strict';

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/svg-sprite/svg-sprite
 *
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2018 Joschi Kuphal
 * @license MIT https://github.com/svg-sprite/svg-sprite/blob/main/LICENSE
 */

const path = require('path');
const events = require('events');
const async = require('async');
const Shape = require('./shape.js');

/**
 * SVGSpriter queue
 *
 * @param {SVGSpriter} spriter          SVGSpriter instance
 */
function SVGSpriterQueue(spriter) {
    this._spriter = spriter;
    this._files = [];
    this.active = 0;

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
 * @param {File} file                   Shape file
 */
SVGSpriterQueue.prototype.add = function(file) {
    this._spriter.debug('Added "%s" to processing queue', path.basename(file.path));
    this._files.push(file);
    this.emit('add');
};

/**
 * Try to process an item in the queue
 */
SVGSpriterQueue.prototype.process = function() {
    if (this._files.length && this.active < this._spriter._limit) {
        ++this.active;
        const file = this._files.shift();
        let shape;
        let spriter;

        // Instantiate the shape
        try {
            shape = new Shape(file, this._spriter);
            spriter = this._spriter;

        // In case of errors: Skip the file
        } catch (error) {
            this._spriter.error('Skipping "%s" (%s)', path.basename(file.path), error.message);
            this.emit(--this.active ? 'remove' : 'empty');
            return;
        }

        // Subsequently run through all optimization and compilation tasks
        async.waterfall([
            // Transform the shape
            _cb => {
                spriter._transformShape(shape, _cb);
            },

            // Complement the shape
            _cb => {
                shape.complement(_cb);
            }
        ], this.remove.bind(this));
    }
};

/**
 * Remove a shape from the queue
 *
 * @param {Error} error                 Error
 * @param {SVGShape} shape              Processed shape
 */
SVGSpriterQueue.prototype.remove = function(error, shape) {
    this._spriter._shapes.push(...shape.distribute());
    this.emit(--this.active ? 'remove' : 'empty');
};

/**
 * Module export (constructor wrapper)
 *
 * @param {SVGSpriter} spriter          SVGSpriter instance
 * @return {SVGSpriterQueue}            SVGSpriterQueue instance
 */
module.exports = SVGSpriterQueue;
