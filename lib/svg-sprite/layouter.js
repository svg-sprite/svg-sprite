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

var _                               = require('lodash'),
defaultConfig                       = {
    css                             : {
        dest                        : 'css',
        layout                      : 'packed',
        common                      : null,
        mixin						: null,
        prefix                      : '.svg-%s',
        dimensions                  : '-dims',
        sprite                      : 'svg/sprite.css.svg',
        bust						: true
    },
    view                            : {
        dest                        : 'view',
        layout                      : 'packed',
        common                      : null,
        mixin						: null,
        prefix                      : '.svg-%s',
        dimensions                  : '-dims',
        sprite                      : 'svg/sprite.view.svg',
        bust						: true
    },
    defs                            : {
        dest                        : 'defs',
        prefix                      : '.svg-%s',
        dimensions                  : '-dims',
        sprite                      : 'svg/sprite.defs.svg',
        inline						: false,
        example						: false,
        bust						: false
    },
    symbol                          : {
        dest                        : 'symbol',
        prefix                      : '.svg-%s',
        dimensions                  : '-dims',
        sprite                      : 'svg/sprite.symbol.svg',
        inline						: false,
        example						: false,
        bust						: false
    },
    stack							: {
        dest                        : 'stack',
        prefix                      : '.svg-%s',
        dimensions                  : '-dims',
        sprite                      : 'svg/sprite.stack.svg',
        example						: false,
        bust						: false
    }
},
defaultVariables                    = {
    date                            : (new Date()).toGMTString(),
    invert                          : function() {
        return function(num, render) {
            return -parseFloat(render(num));
        };
    },
    classname                       : function() {
        return function(str, render) {
        	var classname			= render(str).replace(/\s+/g, ' ').split(' ').pop();
        	return classname.startsWith('.') ? classname.substr(1) : classname;
        };
    },
    escape                          : function() {
        return function(str, render) {
            return render(str).split('\\').join('\\\\');
        };
    },
    encodeHashSign                  : function() {
        return function(str, render) {
            return render(str).split('#').join('%23');
        };
    }
};

/**
 * SVGSprite layouter
 *
 * @param {SVGSpriter} spriter		SVG spriter
 * @param {Object} config			Layout configuration
 */
function SVGSpriteLayouter(spriter, config) {
    this._spriter                   = spriter;
    this.config                     = config;
    this.mode                       = null;
    this.files                      = {};
    this.data                       = {};
    this._commonData                = Object.assign({shapes: []}, defaultVariables, this._spriter.config.variables);

    // Register the common shapes data
    var shapesLength = this._spriter._shapes.length;
    this._spriter._shapes.forEach(function(shape, index) {
        var dimensions              = shape.getDimensions(),
        padding                     = shape.config.spacing.padding;

        this._commonData.shapes.push({
            name                    : shape.id,
            base                    : shape.base,
            master                  : shape.master ? shape.master.id : null,
            width                   : {
                inner               : dimensions.width - padding.right - padding.left,
                outer               : dimensions.width
            },
            height                  : {
                inner               : dimensions.height - padding.top - padding.bottom,
                outer               : dimensions.height
            },
            first                   : index === 0,
            last                    : index === shapesLength - 1
        });
    }, this);

    this._spriter.debug('Created layouter instance');
}

/**
 * Prototype
 *
 * @type {Object}
 */
SVGSpriteLayouter.prototype = {};

/**
 * Layout as a sprite
 *
 * @param {Object} files            Files
 * @param {String} key				Result key
 * @param {String} mode				Mode
 * @param {Function} cb             Callback
 */
SVGSpriteLayouter.prototype.layout = function(files, key, mode, cb) {
	this._spriter.info('Laying out «%s» sprite («%s» mode)', key, mode);
	var SVGSpriteLayout				= require('./mode/' + mode),
    config                          = _.merge(_.merge(_.clone(defaultConfig[mode], true), {svg: this._spriter.config.svg}), this.config[key] || {}),
    data                            = _.merge(_.merge(_.merge({}, this._commonData), this._spriter.config.variables), config.variables),
    sprite                          = new SVGSpriteLayout(this._spriter, config, data, key);
    files[key]						= {};
    sprite.layout(files[key], cb);
};

/**
 * Module export (constructor wrapper)
 *
 * @param {SVGSpriter} spriter		SVG spriter
 * @param {Object} config			Layout configuration
 * @return {SVGSpriteLayouter}		SVGSpriter Layouter
 */
module.exports = SVGSpriteLayouter;
