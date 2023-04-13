'use strict';

/**
 * Svg-sprite is a Node.js module for creating SVG sprites
 *
 * @license MIT https://github.com/svg-sprite/svg-sprite/blob/main/LICENSE
 *
 * @author Joschi Kuphal [joschi@kuphal.net](mailto:joschi@kuphal.net)
 *   (https://github.com/jkphl)
 * @copyright © 2018 Joschi Kuphal
 *
 * @see https://github.com/svg-sprite/svg-sprite
 */

const { Buffer } = require('node:buffer');
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const process = require('node:process');
const async = require('async');
const merge = require('lodash.merge');
const mustache = require('mustache');
const File = require('vinyl');
const { isObject } = require('../utils/index.js');

/**
 * Sprite base class
 *
 * @param {SVGSpriter} spriter SVG spriter
 * @param {object}     config  Configuration
 * @param {object}     data    Base data
 * @param {string}     key     Mode key
 */
function SVGSpriteBase(spriter, config, data, key) {
  this._spriter = spriter;
  this.config = config;
  this.key = key || this.mode;
  this.data = data;
  this.data.mode = this.mode;
  this.data.key = this.key;

  // Resolve file paths
  this.config.dest = path.resolve(this._spriter.config.dest, this.config.dest);

  if ('sprite' in this.config) {
    const spritePath = path.dirname(this.config.sprite);
    let spriteName = path.basename(this.config.sprite) || 'sprite';

    if (!spriteName.includes('.')) {
      spriteName += '.svg';
    }

    this.config.sprite = path.resolve(
      this.config.dest,
      path.join(spritePath, spriteName)
    );
  }

  // Prepare the rendering configurations
  if ('render' in this.config && isObject(this.config.render)) {
    for (const [extension, value] of Object.entries(this.config.render)) {
      const folder = path.dirname(path.dirname(path.dirname(__dirname)));
      const file = path.join('tmpl', this.tmpl, `sprite.${extension}`);
      const renderConfig = {
        template: path.resolve(folder, file),
        dest: path.join(this.config.dest, `sprite.${extension}`)
      };

      if (isObject(value)) {
        if ('template' in value) {
          renderConfig.template = path.resolve(process.cwd(), value.template);
        }

        if ('dest' in value) {
          renderConfig.dest = path.resolve(this.config.dest, value.dest);
          if (!new RegExp(`\\.${extension}$`, 'i').test(renderConfig.dest)) {
            renderConfig.dest += `.${extension}`;
          }
        }
      } else if (value !== true) {
        delete this.config.render[extension];
        continue;
      }

      this.config.render[extension] = renderConfig;
    }

    this._cssDest =
      'css' in this.config.render
        ? path.dirname(this.config.render.css.dest)
        : this.config.dest;
  } else {
    this._cssDest = this.config.dest;
  }

  // Cache busting
  this.config.bust = Boolean(this.config.bust);

  // Prepare the CSS prefix
  this.config.prefix = this.config.prefix.trim();
  if (!/%s/g.test(this.config.prefix.split('%%').join(''))) {
    this.config.prefix += '%s';
  }

  // Refine the base data
  this.data = merge(
    this.data,
    this._initData({
      padding: this._spriter.config.shape.spacing.padding,
      sprite: path
        .relative(this._cssDest, this.config.sprite)
        .split(path.sep)
        .join('/')
    })
  );

  this._init();
}

/**
 * Prototype
 *
 * @type {object}
 */
SVGSpriteBase.prototype = {
  MODE_CSS: 'css',
  MODE_DEFS: 'defs',
  MODE_SYMBOL: 'symbol',
  MODE_STACK: 'stack',
  MODE_VIEW: 'view',

  tmpl: 'common'
};

/**
 * Extended data initialization
 *
 * @param   {object} data Data
 *
 * @returns {object}      Extended data
 */
SVGSpriteBase.prototype._initData = function (data) {
  // If the HTML example should be rendered
  if (this.config.example) {
    const folder = path.dirname(path.dirname(path.dirname(__dirname)));
    const file = path.join('tmpl', this.mode, 'sprite.html');
    let renderConfig = {
      template: path.resolve(folder, file),
      dest: path.join(this.config.dest, `sprite.${this.key}.html`)
    };

    if (isObject(this.config.example)) {
      if ('template' in this.config.example) {
        renderConfig.template = path.resolve(
          process.cwd(),
          this.config.example.template
        );
      }

      if ('dest' in this.config.example) {
        renderConfig.dest = path.resolve(
          this.config.dest,
          this.config.example.dest
        );
      }
    } else if (this.config.example !== true) {
      renderConfig = false; // todo: fix bug with this branch on line 142 (boolean has no "dest" property)
    }

    this.config.example = renderConfig;
    data.example = path
      .relative(path.dirname(renderConfig.dest), this.config.sprite)
      .split(path.sep)
      .join('/');
  }

  this._spriter.debug(
    'Created «%s» sprite instance («%s» mode)',
    this.key,
    this.mode
  );

  return data;
};

/**
 * Layout the sprite
 *
 * @param   {Array}    files Files
 * @param   {Function} cb    Callback
 *
 * @returns {void}
 */
SVGSpriteBase.prototype.layout = function (files, cb) {
  cb(null);
};

/**
 * Build the configured CSS resources
 *
 * @param   {Array}    files Files
 * @param   {Function} cb    Callback
 *
 * @returns {void}
 */
SVGSpriteBase.prototype._buildCSSResources = function (files, cb) {
  const createResourceTask = (renderConfig, data, spriter, ext) => {
    return _cb => {
      const out = mustache.render(
        fs.readFileSync(renderConfig.template, 'utf8'),
        data
      );
      if (out.length) {
        files[ext] = new File({
          base: spriter.config.dest,
          path: renderConfig.dest,
          contents: Buffer.from(out)
        });
        spriter.verbose('Created «%s» stylesheet resource', ext);
      }

      _cb(null);
    };
  };

  const tasks = [];

  if (this.config.render) {
    for (const [extension, value] of Object.entries(this.config.render)) {
      tasks.push(
        createResourceTask(value, this.data, this._spriter, extension)
      );
    }
  }

  async.parallelLimit(tasks, this._spriter._limit, cb);
};

/**
 * Build the HTML example (non-CSS modes)
 *
 * @param   {Array}    files Files
 * @param   {Function} cb    Callback
 *
 * @returns {void}
 */
SVGSpriteBase.prototype._buildHTMLExample = function (files, cb) {
  if (this.config.example) {
    const out = mustache.render(
      fs.readFileSync(this.config.example.template, 'utf8'),
      this.data
    );
    if (out.length) {
      files.example = new File({
        base: this._spriter.config.dest,
        path: this.config.example.dest,
        contents: Buffer.from(out)
      });
      this._spriter.verbose('Created «%s» HTML example file', this.key);
    }
  }

  cb(null, this.data);
};

/**
 * Return a coordinate (number) with 'px' appended if non-zero
 *
 * @param   {number} number Coordinate (number)
 * @param   {string} unit   Unit
 *
 * @returns {string}        Coordinate (number) with unit appended
 */
SVGSpriteBase.prototype._addUnit = function (number, unit) {
  return number + (number === 0 ? '' : unit);
};

/**
 * Evaluate and return a declaration value
 *
 * @param   {any}    global Global declaration setting
 * @param   {string} local  Local declaration value
 *
 * @returns {string}        Evaluated declaration value
 */
SVGSpriteBase.prototype.declaration = function (global, local) {
  if (global === true) {
    return local || '';
  }

  return String(global || '').trim();
};

/**
 * Add cache busting
 *
 * @param   {SVGSprite} svg SVG sprite
 *
 * @returns {string}        Sprite path
 */
SVGSpriteBase.prototype._addCacheBusting = function (svg) {
  if (!this.config.bust) {
    return this.config.sprite;
  }

  const hash = crypto
    .createHash('md5')
    .update(svg.toString(), 'utf8')
    .digest('hex')
    .substr(0, 8);
  const extension = path.extname(this.config.sprite);
  const filename = `${path.basename(
    this.config.sprite,
    extension
  )}-${hash}${extension}`;
  const spriteFullPath = path.join(path.dirname(this.config.sprite), filename);

  this.data.sprite = path
    .relative(this._cssDest, spriteFullPath)
    .split(path.sep)
    .join('/');

  if (this.config.example) {
    this.data.example = path
      .relative(path.dirname(this.config.example.dest), spriteFullPath)
      .split(path.sep)
      .join('/');
  }

  return spriteFullPath;
};

/** Module export */
module.exports = SVGSpriteBase;
