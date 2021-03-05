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

/**
 * CSS sprite packer
 *
 * @param {Array} shapes		Shapes
 */
function SVGSpriteCssPacker(shapes) {
	this.shapes					= shapes;
	this.blocks					= [];
	this.positions				= [];
	this.shapes.forEach(function(shape, index){
		if (!shape.master) {
			var dimensions		= shape.getDimensions();
			this.blocks.push({index: index, width: dimensions.width, height: dimensions.height});
		}
		this.positions.push({x: 0, y: 0});
	}, this);
	this.blocks.sort(function(a, b){
		return Math.max(b.width, b.height) - Math.max(a.width, a.height);
	});
	this.root					= {x: 0, y: 0, width: 0, height: 0};
}

/**
 * Prototype
 *
 * @type {Object}
 */
SVGSpriteCssPacker.prototype = {};

/**
 * Fit and return the shapes
 *
 * @return {Array} shapes		Packed shapes
 */
SVGSpriteCssPacker.prototype.fit = function() {
	var length					= this.blocks.length,
	width						= length ? this.blocks[0].width : 0,
	height						= length ? this.blocks[0].height : 0;
	this.root.width				= width;
	this.root.height			= height;
    for (var b = 0, node; b < length; ++b) {
    	node					= this._findNode(this.root, this.blocks[b].width, this.blocks[b].height);
    	var fit					= node ? this._splitNode(node, this.blocks[b].width, this.blocks[b].height) : this._growNode(this.blocks[b].width, this.blocks[b].height);
    	this.positions[this.blocks[b].index]		= {x: fit.x, y: fit.y};
    }
    return this.positions;
};

/**
 * Find a node
 *
 * @param {Object} root			Root
 * @param {Number} width		Width
 * @param {Number} height		Height
 */
SVGSpriteCssPacker.prototype._findNode = function(root, width, height) {
	if (root.used) {
		return this._findNode(root.right, width, height) || this._findNode(root.down, width, height);
	} else if ((width <= root.width) && (height <= root.height)) {
		return root;
	} else {
		return null;
	}
};

/**
 * Split a node
 *
 * @param {Object} node			Node
 * @param {Number} width		Width
 * @param {Number} height		Height
 */
SVGSpriteCssPacker.prototype._splitNode = function(node, width, height) {
	node.used					= true;
    node.down					= {x: node.x, y: node.y + height, width: node.width, height: node.height - height};
    node.right					= {x: node.x + width, y: node.y, width: node.width - width, height: height};
    return node;
};

/**
 * Grow the sprite
 *
 * @param {Number} width		Width
 * @param {Number} height		Height
 */
SVGSpriteCssPacker.prototype._growNode = function(width, height) {
    var canGrowBottom			= (width <= this.root.width),
    canGrowRight				= (height <= this.root.height),
    shouldGrowRight				= canGrowRight && (this.root.height >= (this.root.width + width)),
    shouldGrowBottom			= canGrowBottom && (this.root.width >= (this.root.height + height));
    return shouldGrowRight		? this._growRight(width, height)
								: (shouldGrowBottom		? this._growBottom(width, height)
														: (canGrowRight			? this._growRight(width, height)
																				: (canGrowBottom		? this._growBottom(width, height)
																										: null)));
};

/**
 * Grow the sprite to the right
 *
 * @param {Number} width		Width
 * @param {Number} height		Height
 */
SVGSpriteCssPacker.prototype._growRight = function(width, height) {
	this.root					= {
		used					: true,
		x						: 0,
		y						: 0,
		width					: this.root.width + width,
		height					: this.root.height,
		down					: this.root,
		right					: {x: this.root.width, y: 0, width: width, height: this.root.height}
    };
    var node					= this._findNode(this.root, width, height);
    return node ? this._splitNode(node, width, height) : false;
};

/**
 * Grow the sprite to the bottom
 *
 * @param {Number} width		Width
 * @param {Number} height		Height
 */
SVGSpriteCssPacker.prototype._growBottom = function(width, height) {
	this.root					= {
		used					: true,
		x						: 0,
		y						: 0,
		width					: this.root.width,
		height					: this.root.height + height,
		down					: {x: 0, y: this.root.height, width: this.root.width, height: height},
		right					: this.root
    };
    var node					= this._findNode(this.root, width, height);
    return node ? this._splitNode(node, width, height) : null;
};

/**
 * Module export
 */
module.exports = SVGSpriteCssPacker;
