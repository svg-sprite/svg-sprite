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

const _ = require('lodash');

const defaultConfig = {
    css: {
        dest: 'css',
        layout: 'packed',
        common: null,
        mixin: null,
        prefix: '.svg-%s',
        dimensions: '-dims',
        sprite: 'svg/sprite.css.svg',
        bust: true
    },
    view: {
        dest: 'view',
        layout: 'packed',
        common: null,
        mixin: null,
        prefix: '.svg-%s',
        dimensions: '-dims',
        sprite: 'svg/sprite.view.svg',
        bust: true
    },
    defs: {
        dest: 'defs',
        prefix: '.svg-%s',
        dimensions: '-dims',
        sprite: 'svg/sprite.defs.svg',
        inline: false,
        example: false,
        bust: false
    },
    symbol: {
        dest: 'symbol',
        prefix: '.svg-%s',
        dimensions: '-dims',
        sprite: 'svg/sprite.symbol.svg',
        inline: false,
        example: false,
        bust: false
    },
    stack: {
        dest: 'stack',
        prefix: '.svg-%s',
        dimensions: '-dims',
        sprite: 'svg/sprite.stack.svg',
        example: false,
        bust: false
    },
    universal: {
        dest: 'universal',
        prefix: '.svg-%s',
        dimensions: '-dims',
        sprite: 'svg/sprite.universal.svg',
        example: false,
        bust: false
    }
};
const defaultVariables = {
    date: new Date().toGMTString(),
    invert() {
        return (num, render) => -Number.parseFloat(render(num));
    },
    classname() {
        return (str, render) => {
            const classname = render(str).replace(/\s+/g, ' ').split(' ').pop();
            return classname.startsWith('.') ? classname.substr(1) : classname;
        };
    },
    escape() {
        return (str, render) => render(str).split('\\').join('\\\\');
    },
    encodeHashSign() {
        return (str, render) => render(str).split('#').join('%23');
    }
};

/**
 * SVGSprite layouter
 *
 * @param {SVGSpriter} spriter      SVG spriter
 * @param {Object} config           Layout configuration
 */
function SVGSpriteLayouter(spriter, config) {
    this._spriter = spriter;
    this.config = config;
    this.mode = null;
    this.files = {};
    this.data = {};
    this._commonData = {
        shapes: [],
        ...defaultVariables,
        ...this._spriter.config.variables
    };

    // Register the common shapes data
    const lastShapeIndex = this._spriter._shapes.length - 1;

    this._spriter._shapes.forEach((shape, index) => {
        const { width, height } = shape.getDimensions();
        const { top, right, bottom, left } = shape.config.spacing.padding;

        this._commonData.shapes.push({
            name: shape.id,
            base: shape.base,
            master: shape.master ? shape.master.id : null,
            width: {
                inner: width - right - left,
                outer: width
            },
            height: {
                inner: height - top - bottom,
                outer: height
            },
            first: index === 0,
            last: index === lastShapeIndex
        });
    });

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
 * @param {String} key              Result key
 * @param {String} mode             Mode
 * @param {Function} cb             Callback
 */
SVGSpriteLayouter.prototype.layout = function(files, key, mode, cb) {
    this._spriter.info('Laying out «%s» sprite («%s» mode)', key, mode);
    const SVGSpriteLayout = require(`./mode/${mode}`);
    const config = _.merge(_.merge(_.cloneDeep(defaultConfig[mode]), { svg: this._spriter.config.svg }), this.config[key] || {});
    const data = _.merge(_.merge(_.merge({}, this._commonData), this._spriter.config.variables), config.variables);
    const sprite = new SVGSpriteLayout(this._spriter, config, data, key);
    files[key] = {};
    sprite.layout(files[key], cb);
};

/**
 * Module export (constructor wrapper)
 *
 * @param {SVGSpriter} spriter      SVG spriter
 * @param {Object} config           Layout configuration
 * @return {SVGSpriteLayouter}      SVGSpriter Layouter
 */
module.exports = SVGSpriteLayouter;
