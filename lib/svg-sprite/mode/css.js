'use strict';

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/jkphl/svg-sprite
 *
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2018 Joschi Kuphal
 * @license MIT https://raw.github.com/jkphl/svg-sprite/master/LICENSE
 */

var _								= require('lodash');
var pluck							= require('lodash.pluck');
var util							= require('util');
var SVGSpriteBase					= require('./base');
var SVGSprite						= require('../sprite');

/**
 * CSS sprite
 *
 * @param {SVGSpriter} spriter		SVG spriter
 * @param {Object} config			Configuration
 * @param {Object} data				Base data
 * @param {String} key				Mode key
 */
function SVGSpriteCss(spriter, config, data, key) {
	SVGSpriteBase.apply(this, [spriter, config, data, key]);
}

/**
 * Prototype
 *
 * @type {Object}
 */
SVGSpriteCss.prototype = _.create(SVGSpriteBase.prototype, {
	constructor						: SVGSpriteCss,
	mode							: SVGSpriteBase.prototype.MODE_CSS,
	tmpl							: 'css',

	LAYOUT_VERTICAL					: 'vertical',
	LAYOUT_HORIZONTAL				: 'horizontal',
	LAYOUT_DIAGONAL					: 'diagonal',
	LAYOUT_PACKED					: 'packed'
});

/**
 * Initialization (non-CSS modes)
 *
 * @return {void}
 */
SVGSpriteCss.prototype._init = function() {

	// Prepare the dimension suffix
	if (this.config.dimensions && (this.config.dimensions !== true)) {
		this.config.dimensions		= /%s/g.test((this.config.dimensions || '').split('%%').join('')) ? util.format(this.config.dimensions, this.config.prefix) : (this.config.prefix + this.config.dimensions);
	}

	// Determine the mixin mode and name
	switch(typeof this.config.mixin) {

		// String: Use the given string as mixin name
		case 'string':
			this.config.mixin		= this.config.mixin.trim().length ? this.config.mixin.trim() : null;
			break;

		// Boolean: Use the common CSS class name (if any)
		case 'boolean':
			this.config.mixin		= !!this.config.common ? this.config.common : null;
			break;

		// Default: Don't use mixin
		default:
			this.config.mixin		= null;
			break;
	}

	// Refine the base data
	this.data						= _.assign(this.data, {
		hasCommon					: !!this.config.common,
		common						: this.config.common,
		commonName					: this.config.common || 'svg-common',
		hasMixin					: !!this.config.mixin,
		mixinName					: this.config.mixin,
		includeDimensions			: !!this.config.dimensions,
		spriteWidth					: 0,
		spriteHeight				: 0
	});

	// Determine if this sprite accepts displaced shape copies
	this._displaceable				= ([this.LAYOUT_VERTICAL, this.LAYOUT_HORIZONTAL].indexOf(this.config.layout) >= 0);

	this._precision                 = (+this.config.svg.precision >= 0) ? Math.pow(10, +this.config.svg.precision) : null;
};

/**
 * Layout the sprite
 *
 * @param {Array} files				Files
 * @param {Function} cb				Callback
 * @return {void}
 */
SVGSpriteCss.prototype.layout = function(files, cb) {

	// Layout the sprite
	var config						= this._layout();

	// Build the sprite SVG file
	files.sprite					= this._buildSVG(config.xmlDeclaration || '', config.doctypeDeclaration || '');
	this._spriter.verbose('Created «%s» SVG sprite file («%s» mode)', this.key, this.mode);

	// Build the configured CSS resources
	this._buildCSSResources(files, function(error) {

		// In case of errors: Break
		if (error) {
			cb(error);

		// Else: Build the HTML example
		} else {
			this._buildHTMLExample(files, cb);
		}
	}.bind(this));
};

/**
 * Layout the sprite (internal)
 *
 * @return {Object}					Sprite configuration
 */
SVGSpriteCss.prototype._layout = function() {

	// Build a map of shape IDs that need to get a ':regular' pseudo class in CSS
	var pseudoShapeMap				= {};
	this._spriter._shapes.forEach(function(shape) {
		pseudoShapeMap[shape.base]	= pseudoShapeMap[shape.base] || !!shape.state;
	}, this._spriter);

	// Layout the sprite
	this[(this.config.layout === this.LAYOUT_PACKED) ? '_layoutBinPacked' : '_layoutSimple'](pseudoShapeMap);

	// Refine the shape data
	var xmlDeclaration				= null,
	doctypeDeclaration				= null,
	positionMap						= {};
	this.data.shapes.forEach(function(shape, index) {

		// Skip non-master shapes for all but orthogonal layouts
		if (this._displaceable || !shape.master) {
			xmlDeclaration			= xmlDeclaration || this._spriter._shapes[index].xmlDeclaration;
			doctypeDeclaration		= doctypeDeclaration || this._spriter._shapes[index].doctypeDeclaration;
			var x, y;

			// For vertical layouts: Set the horizontal alignment
			if (this.config.layout === this.LAYOUT_VERTICAL) {
				x					= this._spriter._shapes[index].align * 100;
				shape.position.absolute.x		= this._spriter._shapes[index]._round(- x * (this.data.spriteWidth - shape.width.outer) / 100);

			// Else: Determine the relative horizontal position
			} else {
				x					= shape.position.absolute.x ? (100 * Math.abs(shape.position.absolute.x) / (this.data.spriteWidth - shape.width.outer)) : 0;
			}

			// For horizontal layouts: Set the vertical alignment
			if (this.config.layout === this.LAYOUT_HORIZONTAL) {
				y					= this._spriter._shapes[index].align * 100;
				shape.position.absolute.y		= this._spriter._shapes[index]._round(- y * (this.data.spriteHeight - shape.height.outer) / 100);

			// Else: Determine the relative vertical position
			} else {
				y					= shape.position.absolute.y ? (100 * Math.abs(shape.position.absolute.y) / (this.data.spriteHeight - shape.height.outer)) : 0;
			}

			// Set the relative position
			shape.position.relative	= {
				x					: this._round(x),
				y					: this._round(y),
				xy					: this._addUnit(this._round(x), '%') + ' ' + this._addUnit(this._round(y), '%')
			};


			if (!shape.master) {
				positionMap[this._spriter._shapes[index].id]	= _.pick(shape.position.absolute, ['x', 'y']);
			}

			// Rework zero-valued positions
			var svg					= shape.svg.split('>');

			// Replace zero-valued x-positions
			var svgX				= svg[0].split(' x="0"');
			if (svgX.length > 1) {
				x					= shape.master ? (shape.position.absolute.x - positionMap[shape.master].x) : shape.position.absolute.x;
				svg[0]				= svgX.join(x ? (' x="' + (-x) + '"') : '');
			}

			// Replace zero-valued y-positions
			var svgY				= svg[0].split(' y="0"');
			if (svgY.length > 1) {
				y					= shape.master ? (shape.position.absolute.y - positionMap[shape.master].y) : shape.position.absolute.y;
				svg[0]				= svgY.join(y ? (' y="' + (-y) + '"') : '');
			}

			shape.svg				= svg.join('>');
		}

	}, this);

	// Remove all non-master shapes for non-displaceable sprites
	if (!this._displaceable) {
		this.data.shapes				= _.reject(this.data.shapes, function(shape){ return !!shape.master; });
	}

	return {
		xmlDeclaration				: xmlDeclaration,
		doctypeDeclaration			: doctypeDeclaration
	};
};

/**
 * Layout a simple CSS sprite
 *
 * @param {Object} pseudoShapeMap	Pseudo shape map
 * @return {SVGSpriteCss}			Self reference
 */
SVGSpriteCss.prototype._layoutSimple = function(pseudoShapeMap) {
	this._spriter._shapes.forEach(function(shape, index){
		if (this._displaceable || !shape.master) {
			this._addShapeToSimpleCssSprite(shape, pseudoShapeMap[shape.base], index, !index + (index === this._spriter._shapes.length - 1) * 2);
		}
	}, this);
	return this;
};

/**
 * Add a single shape to the simple CSS sprite
 *
 * @param {SVGShape} shape			Shape
 * @param {Boolean} needsRegular	Needs a :regular pseudo class in CSS
 * @param {Number} index			Index
 * @param {Number} position			Position bits
 */
SVGSpriteCss.prototype._addShapeToSimpleCssSprite = function(shape, needsRegular, index, position) {
	var dimensions					= shape.getDimensions(),
		rootAttributes				= {id: shape.id},
		positionX					= 0,
		positionY					= 0;

	switch (this.config.layout) {

		// Horizontal sprite arrangement
		case this.LAYOUT_HORIZONTAL:
			rootAttributes.y		= 0;
			rootAttributes.x		= this.data.spriteWidth;
			positionX				= -this.data.spriteWidth;

			this.data.spriteWidth	= Math.ceil(this.data.spriteWidth + dimensions.width);
			this.data.spriteHeight	= Math.max(this.data.spriteHeight, dimensions.height);
			break;

		// Diagonal sprite arrangement
		case this.LAYOUT_DIAGONAL:
			rootAttributes.x		= this.data.spriteWidth;
			rootAttributes.y		= this.data.spriteHeight;
			positionX				= -this.data.spriteWidth;
			positionY				= -this.data.spriteHeight;

			this.data.spriteWidth	= Math.ceil(this.data.spriteWidth + dimensions.width);
			this.data.spriteHeight	= Math.ceil(this.data.spriteHeight + dimensions.height);
			break;

		// Vertical sprite arrangement (default)
		default:
			rootAttributes.x		= 0;
			rootAttributes.y		= this.data.spriteHeight;
			positionY				= -this.data.spriteHeight;

			this.data.spriteWidth	= Math.max(this.data.spriteWidth, dimensions.width);
			this.data.spriteHeight	= Math.ceil(this.data.spriteHeight + dimensions.height);
	}

	this._addShapeToCSSSprite(shape, needsRegular, index, position, this._refineRootAttributes(shape, index, rootAttributes), positionX, positionY);
};

/**
 * Layout a binpacked CSS sprite
 *
 * @see http://codeincomplete.com/posts/2011/5/7/bin_packing/
 * @param {Object} pseudoShapeMap	Pseudo shape map
 * @return {SVGSpriteCss}			Self reference
 */
SVGSpriteCss.prototype._layoutBinPacked = function(pseudoShapeMap) {
	var SVGSpriteCssPacker			= require('./css/packer'),
	packer							= new SVGSpriteCssPacker(this._spriter._shapes),
	positions						= packer.fit();

	// Run through all shapes and add them to the sprite
	this._spriter._shapes.forEach(function(shape, index){

		// Skip non-master shapes
		if (!shape.master) {
			var dimensions			= shape.getDimensions(),
			position				= positions[index],
			rootAttributes			= {id: shape.id, x: position.x, y: position.y};

			this.data.spriteWidth	= Math.max(this.data.spriteWidth, Math.ceil(position.x + dimensions.width));
			this.data.spriteHeight	= Math.max(this.data.spriteHeight, Math.ceil(position.y + dimensions.height));

			this._addShapeToCSSSprite(shape, pseudoShapeMap[shape.base], index, !index + (index === this._spriter._shapes.length - 1) * 2, this._refineRootAttributes(shape, index, rootAttributes), -position.x, -position.y);
		}
	}, this);

	return this;
};

/**
 * Refine the root attributes set on each nested shape
 *
 * @param {SVGShape} shape			Shape
 * @param {Number} index			Index
 * @param {Object} rootAttributes	Root element attributes
 * @return {Object}					Refined root element attributes
 */
SVGSpriteCss.prototype._refineRootAttributes = function(shape, index, rootAttributes) {
	return rootAttributes;
};

/**
 * Add a single shape to a CSS sprite
 *
 * @param {SVGShape} shape			Shape
 * @param {Boolean} needsRegular	Needs a :regular pseudo class in CSS
 * @param {Number} index			Index
 * @param {Number} position			Position bits
 * @param {Number} rootAttributes	Root element attributes
 * @param {Number} positionX		Horizontal position within the sprite
 * @param {Number} positionY		Vertical position within the sprite
 */
SVGSpriteCss.prototype._addShapeToCSSSprite = function(shape, needsRegular, index, position, rootAttributes, positionX, positionY) {

	// Prepare the selectors
	var selector					= {
		shape						: (needsRegular || shape.state) ? [{
			expression				: util.format(this.config.prefix, shape.base + (shape.state ? (':' + shape.state) : '')),
			raw						: util.format(this.config.prefix, shape.base + (shape.state ? (':' + shape.state) : '')),
			first					: true,
			last					: false
		}, {
			expression				: util.format(this.config.prefix, shape.base + '\\:' + (shape.state || 'regular')),
			raw						: util.format(this.config.prefix, shape.base + ':' + (shape.state || 'regular')),
			first					: false,
			last					: true
		}] : [{
			expression				: util.format(this.config.prefix, shape.base),
			raw						: util.format(this.config.prefix, shape.base),
			first					: true,
			last					: true
		}]
	};

	// Prepare the dimension properties
	if (this.config.dimensions !== true) {
		selector.dimensions			= shape.state ? [{
			expression				: util.format(this.config.dimensions, shape.base) + ':' + shape.state,
			raw						: util.format(this.config.dimensions, shape.base) + ':' + shape.state,
			first					: true,
			last					: false
		}, {
			expression				: util.format(this.config.dimensions, shape.base + '\\:' + shape.state),
			raw						: util.format(this.config.dimensions, shape.base + ':' + shape.state),
			first					: false,
			last					: true
		}] : [{
			expression				: util.format(this.config.dimensions, shape.base),
			raw						: util.format(this.config.dimensions, shape.base),
			first					: true,
			last					: true
		}];
	}

	// Register the SVG parameters
	_.assign(this.data.shapes[index], {
		first						: !!(position & 1),
		last						: !!(position & 2),
		position					: {
			absolute				: {
				x					: positionX,
				y					: positionY,
				xy					: this._addUnit(positionX, 'px') + ' ' + this._addUnit(positionY, 'px')
			}
		},
		selector					: selector,
		dimensions					: {
			inline					: (this.config.dimensions === true),
			extra					: !!(_.isString(this.config.dimensions) && this.config.dimensions.length)
		}
	});

	// Create the SVG getter/setter
	Object.defineProperty(this.data.shapes[index], '_svg', {
	    enumerable					: false,
	    writable					: true
	});
	this.data.shapes[index].__defineGetter__('svg', function() {
		return this._svg || shape.getSVG(true, function(shapeDOM) {
			for (var r in rootAttributes) {
				shapeDOM.setAttribute(r, rootAttributes[r]);
			}
		});
	});
	this.data.shapes[index].__defineSetter__('svg', function(svg) {
		this._svg					= svg;
	});
};

/**
 * Build the CSS sprite
 *
 * @param {String} xmlDeclaration			XML declaration
 * @param {String} doctypeDeclaration		Doctype declaration
 * @return {File}							SVG sprite file
 */
SVGSpriteCss.prototype._buildSVG = function(xmlDeclaration, doctypeDeclaration) {
	var rootAttributes				= _.extend(
		{},
		this.config.svg.rootAttributes,
		this.config.svg.dimensionAttributes ? {
			width					: this.data.spriteWidth,
			height					: this.data.spriteHeight
		} : {},
		{
			viewBox					: '0 0 ' + this.data.spriteWidth + ' ' + this.data.spriteHeight
		}
	),
	svg								= new SVGSprite(this.declaration(this.config.svg.xmlDeclaration, xmlDeclaration), this.declaration(this.config.svg.doctypeDeclaration, doctypeDeclaration), rootAttributes, true, this.config.svg.transform);
	svg.add(pluck(this.data.shapes, 'svg'));

	return svg.toFile(this._spriter.config.dest, this._addCacheBusting(svg));
};

/**
 * Round a number considering the given decimal place precision for CSS positioning values
 *
 * @param {Number} n            Number
 * @return {Number}             Rounded number
 */
SVGSpriteCss.prototype._round = function(n) {
	return this._precision ? (Math.round(n * this._precision) / this._precision) : n;
};

/**
 * Module export
 */
module.exports = SVGSpriteCss;
