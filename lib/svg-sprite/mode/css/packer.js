'use strict';

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/svg-sprite/svg-sprite
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2018 Joschi Kuphal
 * @license MIT https://github.com/svg-sprite/svg-sprite/blob/main/LICENSE
 */

module.exports = class SVGSpriteCssPacker {
    /**
     * CSS sprite packer
     *
     * @param {Array<SVGShape>} shapes        Shapes
     */
    constructor(shapes) {
        this.shapes = shapes;
        this.blocks = [];
        this.positions = [];

        this.shapes.forEach((shape, index) => {
            if (!shape.master) {
                const { width, height } = shape.getDimensions();
                this.blocks.push({ index, width, height });
            }

            this.positions.push({ x: 0, y: 0 });
        });

        this.blocks.sort((a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height));
        this.root = { x: 0, y: 0, width: 0, height: 0 };
    }

    /**
     * Fit and return the shapes
     *
     * @returns {Array} shapes       Packed shapes
     */
    fit() {
        if (this.blocks.length === 0) {
            return this.positions;
        }

        this.root.width = this.blocks[0].width;
        this.root.height = this.blocks[0].height;

        for (const { index, width, height } of this.blocks) {
            const node = this._findNode(this.root, width, height);
            const { x, y } = node ? this._splitNode(node, width, height) : this._growNode(width, height);
            this.positions[index] = { x, y };
        }

        return this.positions;
    }

    /**
     * Find a node
     *
     * @param {object} root         Root
     * @param {number} width        Width
     * @param {number} height       Height
     * @returns {object | null}     Node
     */
    _findNode(root, width, height) {
        if (root.used) {
            return this._findNode(root.right, width, height) || this._findNode(root.down, width, height);
        }

        if (width <= root.width && height <= root.height) {
            return root;
        }

        return null;
    }

    /**
     * Split a node
     *
     * @param {object} node         Node
     * @param {number} width        Width
     * @param {number} height       Height
     * @returns {object} node       Node
     */
    _splitNode(node, width, height) {
        node.used = true;
        node.down = {
            x: node.x,
            y: node.y + height,
            width: node.width,
            height: node.height - height
        };
        node.right = {
            x: node.x + width,
            y: node.y,
            width: node.width - width,
            height
        };

        return node;
    }

    /**
     * Grow the sprite
     *
     * @param {number} width        Width
     * @param {number} height       Height
     * @returns {object|null}       Node
     */
    _growNode(width, height) {
        const canGrowBottom = width <= this.root.width;
        const canGrowRight = height <= this.root.height;
        const shouldGrowRight = canGrowRight && (this.root.height >= (this.root.width + width));
        const shouldGrowBottom = canGrowBottom && (this.root.width >= (this.root.height + height));

        if (shouldGrowRight) {
            return this._growRight(width, height);
        }

        if (shouldGrowBottom) {
            return this._growBottom(width, height);
        }

        if (canGrowRight) {
            return this._growRight(width, height);
        }

        if (canGrowBottom) {
            return this._growBottom(width, height);
        }

        return null;
    }

    /**
     * Grow the sprite to the right
     *
     * @param {number} width        Width
     * @param {number} height       Height
     * @returns {object|false}      Node
     */
    _growRight(width, height) {
        this.root = {
            used: true,
            x: 0,
            y: 0,
            width: this.root.width + width,
            height: this.root.height,
            down: this.root,
            right: { x: this.root.width, y: 0, width, height: this.root.height }
        };
        const node = this._findNode(this.root, width, height);

        return node ? this._splitNode(node, width, height) : false;
    }

    /**
     * Grow the sprite to the bottom
     *
     * @param {number} width        Width
     * @param {number} height       Height
     * @returns {object|null}       Node
     */
    _growBottom(width, height) {
        this.root = {
            used: true,
            x: 0,
            y: 0,
            width: this.root.width,
            height: this.root.height + height,
            down: { x: 0, y: this.root.height, width: this.root.width, height },
            right: this.root
        };
        const node = this._findNode(this.root, width, height);

        return node ? this._splitNode(node, width, height) : null;
    }
};
