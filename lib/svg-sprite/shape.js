'use strict';

/**
 * svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/svg-sprite/svg-sprite
 *
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2018 Joschi Kuphal
 * @license MIT https://github.com/svg-sprite/svg-sprite/blob/master/LICENSE
 */

const path = require('path');
const { format } = require('util');
const { execFile } = require('child_process');
const _ = require('lodash');
const { DOMParser, XMLSerializer } = require('xmldom');
const xpath = require('xpath');
const cssom = require('cssom');
const { CssSelectorParser } = require('css-selector-parser');
const phantomjs = require('phantomjs-prebuilt').path;
const async = require('async');
const csso = require('csso');

const dimensionsPhantomScript = path.resolve(__dirname, 'shape/dimensions.phantom.js');

/**
 * Default callback for shape ID generation
 *
 * @param {String} template         Template string
 * @return {String}                 Shape ID
 */
const createIdGenerator = template => {
    /**
     * ID generator
     *
     * @param {String} name         Relative file path
     * @returns {String}            Shape ID
     */
    const generator = function(name) {
        const pathname = this.separator ? name.split(path.sep).join(this.separator) : name;
        return format(template || '%s', path.basename(pathname.replace(/\s+/g, this.whitespace), '.svg'));
    };

    return generator;
};

/**
 * Default shape configuration
 *
 * @type {Object}
 */
const defaultConfig = {
    /**
     * Shape ID related options
     *
     * @type {Object}
     */
    id: {
        /**
         * ID part separator (used for directory-to-ID traversal)
         *
         * @type {String}
         */
        separator: '--',
        /**
         * Pseudo selector separator
         *
         * @type {String}
         */
        pseudo: '~',
        /**
         * Whitespace replacement string
         *
         * @type {String}
         */
        whitespace: '_',
        /**
         * ID traversal callback
         *
         * @param {Function}
         */
        generator: createIdGenerator('%s')
    },
    /**
     * Dimension related options
     *
     * @type {Object}
     */
    dimension: {
        /**
         * Max. shape width
         *
         * @type {Number}
         */
        maxWidth: 2000,
        /**
         * Max. shape height
         *
         * @type {Number}
         */
        maxHeight: 2000,
        /**
         * Coordinate decimal places
         *
         * @type {Number}
         */
        precision: 2,
        /**
         * Add dimension attributes
         *
         * @type {Boolean}
         */
        attributes: false
    },
    /**
     * Spacing related options
     *
     * @type {Number}
     */
    spacing: {
        /**
         * Padding around the shape
         *
         * @type {Number|Array}
         */
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        /**
         * Box sizing strategy
         *
         * Might be 'content' (padding is added outside of the shape), 'padding' (shape plus padding will make for the given maximum size)
         * or 'contain' (like 'padding', but size will be fixed instead of maximum)
         *
         * @type {String}
         */
        box: 'content'
    }
};
const svgReferenceProperties = ['style', 'fill', 'stroke', 'filter', 'clip-path', 'mask', 'marker-start', 'marker-end', 'marker-mid'];

/**
 * SVGShape
 *
 * @param {Vinyl} file                  Vinyl file
 * @param {SVGSpriter} spriter          Spriter instance
 */
function SVGShape(file, spriter) {
    this.source = file;
    this.spriter = spriter;
    this.svg = { current: this.source.contents.toString(), ready: null };
    this.name = path.basename(this.source.path);
    this.config = _.merge(_.cloneDeep(defaultConfig), this.spriter.config.shape || {});

    if (!_.isFunction(this.config.id.generator)) {
        this.config.id.generator = createIdGenerator(_.isString(this.config.id.generator) ? this.config.id.generator + (this.config.id.generator.includes('%s') ? '' : '%s') : '%s');
    }

    this.id = this.config.id.generator(this.name, this.source);
    this.state = this.id.split(this.config.id.pseudo);
    this.base = this.state.shift();
    this.state = this.state.shift() || null;
    this.master = null;
    this.copies = 0;
    this._precision = 10 ** Number(this.config.dimension.precision);
    this._scale = 1;
    this._namespaced = false;

    // Determine meta & alignment data
    const relative = path.basename(this.source.relative, '.svg');
    this.meta = this.id in this.config.meta ? this.config.meta[this.id] : (relative in this.config.meta ? this.config.meta[relative] : {});
    this.align = Object.entries({ ...this.config.align['*'], ...(this.id in this.config.align ? this.config.align[this.id] : (relative in this.config.align ? this.config.align[relative] : {})) });

    // Initially set the SVG of this shape
    this._initSVG();

    // XML declaration and doctype
    const xmldecl = this.svg.current.match(/<\?xml.*?>/g);
    const doctype = this.svg.current.match(/<!DOCTYPE.*?>/g);
    this.xmlDeclaration = xmldecl ? xmldecl[0] : '<?xml version="1.0" encoding="utf-8"?>';
    this.doctypeDeclaration = doctype ? doctype[0] : '';

    this.spriter.verbose('Added shape "%s:%s"', this.base, this.state || 'regular');
}

/**
 * Prototype properties
 *
 * @type {Object}
 */
SVGShape.prototype = {};

/**
 * SVG stages
 *
 * @type {Object}
 */
SVGShape.prototype.svg = null;

/**
 * Default SVG namespace
 *
 * @type {String}
 */
SVGShape.prototype.DEFAULT_SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/**
 * Xlink namespace
 *
 * @type {String}
 */
SVGShape.prototype.XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink';

/**
 * Return a string representation of the shape
 *
 * @return {String}         String representation
 */
SVGShape.prototype.toString = function() {
    return '[object SVGShape]';
};

/**
 * Recursively strip unneeded namespace declarations
 *
 * @param {Element} element     Element
 * @param {Object} nsMap        Namespace map
 * @return {Element}            Element
 */
SVGShape.prototype._stripInlineNamespaceDeclarations = function(element, nsMap) {
    const parentNsMap = _.clone(element._nsMap);
    nsMap = nsMap || { '': this.DEFAULT_SVG_NAMESPACE };

    // Strip the default SVG namespace
    if (nsMap[''] === this.DEFAULT_SVG_NAMESPACE) {
        const defaultNamespace = element.attributes.getNamedItem('xmlns');
        if (defaultNamespace !== undefined && defaultNamespace.value === this.DEFAULT_SVG_NAMESPACE) {
            element.attributes.removeNamedItem('xmlns');
        }
    }

    if (!('xlink' in nsMap) || nsMap.xlink === this.XLINK_NAMESPACE) {
        const xlinkNamespace = element.attributes.getNamedItem('xmlns:xlink');
        if (xlinkNamespace !== undefined && xlinkNamespace.value === this.XLINK_NAMESPACE) {
            element.attributes.removeNamedItem('xmlns:xlink');
        }
    }

    for (let c = 0; c < element.childNodes.length; c++) {
        if (element.childNodes.item(c).nodeType === 1) {
            this._stripInlineNamespaceDeclarations(element.childNodes.item(c), parentNsMap);
        }
    }

    return element;
};

/**
 * Return the SVG of this shape
 *
 * @param {Boolean} inline          Prepare for inline usage (strip redundant XML namespaces)
 * @param {Function} transform      Final transformer before serialization (operating on a clone)
 * @return {String}                 SVG
 */
SVGShape.prototype.getSVG = function(inline, transform) {
    let svg;

    // If this is a distributed copy
    if (this.master) {
        svg = this.dom.createElementNS(this.DEFAULT_SVG_NAMESPACE, 'use');
        svg.setAttribute('xlink:href', `#${this.master.id}`);
    } else {
        svg = this.dom.documentElement.cloneNode(true);
    }

    // Call the final transformer (if available)
    if (_.isFunction(transform)) {
        transform(svg);
    }

    // If the SVG is to be used inline or as part of a sprite or is a distributed copy: Strip redundand namespace declarations
    if (inline || this.master) {
        return new XMLSerializer().serializeToString(this._stripInlineNamespaceDeclarations(svg));
    }

    // Else: Add XML and DOCTYPE declarations if required
    svg = new XMLSerializer().serializeToString(svg);

    // Add DOCTYPE declaration
    if (this.spriter.config.svg.doctypeDeclaration) {
        svg = this.doctypeDeclaration + svg;
    }

    // Add XML declaration
    if (this.spriter.config.svg.xmlDeclaration) {
        svg = this.xmlDeclaration + svg;
    }

    return svg;
};

/**
 * Set the SVG of this shape
 *
 * @param {String} svg      SVG
 * @return {SVGShape}       Self reference
 */
SVGShape.prototype.setSVG = function(svg) {
    this.svg.current = svg;
    this.svg.ready = null;
    return this._initSVG();
};

/**
 * Initialize the SVG of this shape
 *
 * @return {SVGShape}       Self reference
 */
SVGShape.prototype._initSVG = function() {
    // Basic check for basic SVG file structure
    const svgStart = this.svg.current.match(/<svg(?:\s+[a-z\d-:]+=("|').*?\1)*\s*(?:(\/)|(>[^]*<\/svg))>/i);

    if (!svgStart) {
        const e = new Error('Invalid SVG file');
        e.name = 'ArgumentError';
        e.errno = 1429395394;
        throw e;
    }

    // Resolve XML entities
    const entityRegExp = /<!ENTITY\s+(\S+)\s+(["'])(.+)\2>/;
    let entityStart = 0;
    let entities = 0;
    const entityMap = {};
    let entity;

    do {
        entity = entityRegExp.exec(this.svg.current.substr(entityStart));
        if (entity) {
            ++entities;
            entityStart += entity.index + entity[0].length;
            entityMap[entity[1]] = entity[3];
        }
    } while (entity);

    if (entities) {
        let svg = this.svg.current.substr(svgStart.index);
        for (entity in entityMap) {
            svg = svg.replace(`&${entity};`, entityMap[entity]);
        }

        this.svg.current = this.svg.current.substr(0, svgStart.index) + svg;
    }

    // Parse the XML
    this.dom = new DOMParser({
        locator: {},
        errorHandler(level, message) {
            const e = new Error(format('Invalid SVG file (%s)', message.split('\n').join(' ')));
            e.name = 'ArgumentError';
            e.errno = 1429394706;
            throw e;
        }
    }).parseFromString(this.svg.current);

    // Determine the shape width
    const width = this.dom.documentElement.getAttribute('width');
    this.width = width.length ? Number.parseFloat(width) : false;

    // Determine the shape height
    const height = this.dom.documentElement.getAttribute('height');
    this.height = height.length ? Number.parseFloat(height) : false;

    // Determine the viewbox
    let viewBox = this.dom.documentElement.getAttribute('viewBox');
    if (viewBox.length) {
        viewBox = viewBox.split(/[^-\d.]+/);
        while (viewBox.length < 4) {
            viewBox.push(0);
        }

        viewBox.forEach((value, index) => {
            viewBox[index] = Number.parseFloat(value);
        });
        this.viewBox = viewBox;
    } else {
        this.viewBox = false;
    }

    this.title = null;
    this.description = null;

    const children = this.dom.documentElement.childNodes;
    const meta = { title: 'title', description: 'desc' };

    for (let c = 0; c < children.length; c++) {
        for (const m in meta) {
            if (meta[m] === children.item(c).localName) {
                this[m] = children.item(c);
            }
        }
    }

    return this;
};

/**
 * Return the dimensions of this shape
 *
 * @return {Object}             Dimensions
 */
SVGShape.prototype.getDimensions = function() {
    return {
        width: this.width,
        height: this.height
    };
};

/**
 * Set the dimensions of this shape
 *
 * @param {Number} width        Width
 * @param {Number} height       Height
 * @return {SVGShape}           Self reference
 */
SVGShape.prototype.setDimensions = function(width, height) {
    this.width = this._round(Math.max(0, Number.parseFloat(width)));
    this.dom.documentElement.setAttribute('width', this.width);
    this.height = this._round(Math.max(0, Number.parseFloat(height)));
    this.dom.documentElement.setAttribute('height', this.height);
    return this;
};

/**
 * Return the shape's viewBox (and set it if it doesn't exist yet)
 *
 * @param {Number} width        Width
 * @param {Height} height       Height
 * @return {Array}              Viewbox
 */
SVGShape.prototype.getViewbox = function(width, height) {
    if (!this.viewBox) {
        this.setViewbox(0, 0, width || this.width, height || this.height);
    }

    return this.viewBox;
};

/**
 * Set the shape's viewBox
 *
 * @param {Number} x            X coordinate
 * @param {Number} y            Y coordinate
 * @param {Number} width        Width
 * @param {Number} height       Height
 * @return {Array}              Viewbox
 */
SVGShape.prototype.setViewbox = function(x, y, width, height) {
    if (Array.isArray(x)) {
        this.viewBox = x.map(n => Number.parseFloat(n));
        while (this.viewBox.length < 4) {
            this.viewBox.push(0);
        }
    } else {
        this.viewBox = [
            Number.parseFloat(x),
            Number.parseFloat(y),
            Number.parseFloat(width),
            Number.parseFloat(height)
        ];
    }

    this.dom.documentElement.setAttribute('viewBox', this.viewBox.join(' '));
    return this.viewBox;
};

/**
 * Complement the SVG shape by adding dimensions, padding and meta data
 *
 * @param {Function} cb         Callback
 */
SVGShape.prototype.complement = function(cb) {
    async.waterfall([
        // Prepare dimensions
        this._complementDimensions.bind(this),

        // Set padding
        this._addPadding.bind(this),

        // Set meta data
        this._addMetadata.bind(this)
    ], error => {
        // Save the transformed state
        this.svg.ready = new XMLSerializer().serializeToString(this.dom.documentElement);
        cb(error, this);
    });
};

/**
 * Complement the shape's dimensions
 *
 * @param {Function} cb         Callback
 */
SVGShape.prototype._complementDimensions = function(cb) {
    if (this.width && this.height) {
        this._setDimensions(cb);
    } else {
        this._determineDimensions(this._setDimensions.bind(this, cb));
    }
};

/**
 * Determine the shape's dimension by rendering it
 *
 * @param {Function} cb         Callback
 */
SVGShape.prototype._determineDimensions = function(cb) {
    // Try to use a viewBox attribute for image determination
    if (this.viewBox !== false) {
        this.width = this._round(this.viewBox[2]);
        this.height = this._round(this.viewBox[3]);
    }

    // If the viewBox attribute didn't suffice: Render the SVG image
    if (!this.width || !this.height) {
        execFile(phantomjs, [dimensionsPhantomScript, this.getSVG(false), `file://${this.source.path}`], (err, stdout, stderr) => {
            if (err) {
                cb(err);
            } else if (stdout.length > 0) { // PhantomJS always outputs to stdout.
                const dimensions = JSON.parse(stdout.toString().trim());
                this.width = this._round(dimensions.width);
                this.height = this._round(dimensions.height);
                cb(null);
            } else if (stderr.length > 0) {
                cb(new Error(stderr.toString().trim()));
            } else {
                cb(new Error(`PhantomJS didn't return dimensions for "${this.name}"`));
            }
        });
    } else {
        cb(null);
    }
};

/**
 * Round a number considering the given decimal place precision
 *
 * @param {Number} n            Number
 * @return {Number}             Rounded number
 */
SVGShape.prototype._round = function(n) {
    return Math.round(n * this._precision) / this._precision;
};

/**
 * Scale the shape if necessary
 *
 * @param {Function} cb         Callback
 */
SVGShape.prototype._setDimensions = function(cb) {
    // Ensure the original viewBox is set
    this.getViewbox(this.width, this.height);

    const includePadding = ['padding', 'icon'].includes(this.config.spacing.box);
    const forceScale = this.config.spacing.box === 'icon';
    const horizontalPadding = includePadding * Math.max(0, this.config.spacing.padding.right + this.config.spacing.padding.left);
    const width = this.width + horizontalPadding;
    const verticalPadding = includePadding * Math.max(0, this.config.spacing.padding.top + this.config.spacing.padding.bottom);
    const height = this.height + verticalPadding;

    // Does the shape need to be scaled?
    if (width > this.config.dimension.maxWidth || height > this.config.dimension.maxHeight || (forceScale && width < this.config.dimension.maxWidth && height < this.config.dimension.maxHeight)) {
        const maxWidth = this.config.dimension.maxWidth - horizontalPadding;
        const maxHeight = this.config.dimension.maxHeight - verticalPadding;
        this._scale = Math.min(maxWidth / this.width, maxHeight / this.height);
        this.width = Math.min(maxWidth, this._round(this.width * this._scale));
        this.height = Math.min(maxHeight, this._round(this.height * this._scale));
    }

    // In "icon" box sizing mode: Resize bounding box and center shape by adding padding
    if (forceScale) {
        const diffWidth = this.config.dimension.maxWidth - this.width - horizontalPadding;
        const diffHeight = this.config.dimension.maxHeight - this.height - verticalPadding;
        this.config.spacing.padding.left += diffWidth / 2;
        this.config.spacing.padding.right += diffWidth / 2;
        this.config.spacing.padding.top += diffHeight / 2;
        this.config.spacing.padding.bottom += diffHeight / 2;
    }

    const dimensions = this.getDimensions();

    for (const attr in dimensions) {
        this.dom.documentElement.setAttribute(attr, dimensions[attr]);
    }

    cb(null);
};

/**
 * Add padding to this shape
 *
 * @param {Function} cb         Callback
 */
SVGShape.prototype._addPadding = function(cb) {
    const { padding } = this.config.spacing;

    if (padding.top || padding.right || padding.bottom || padding.left) {
        // Update viewBox
        const viewBox = this.getViewbox();
        viewBox[0] -= this.config.spacing.padding.left / this._scale;
        viewBox[1] -= this.config.spacing.padding.top / this._scale;
        viewBox[2] += (this.config.spacing.padding.right + this.config.spacing.padding.left) / this._scale;
        viewBox[3] += (this.config.spacing.padding.top + this.config.spacing.padding.bottom) / this._scale;
        this.setViewbox(viewBox.map(this._round.bind(this)));

        // Update dimensions
        this.setDimensions(this.width + this.config.spacing.padding.right + this.config.spacing.padding.left, this.height + this.config.spacing.padding.top + this.config.spacing.padding.bottom);
    }

    cb(null);
};

/**
 * Add metadata to this shape
 *
 * @param {Function} cb         Callback
 */
SVGShape.prototype._addMetadata = function(cb) {
    const ariaLabelledBy = [];

    // Check if description meta data is available
    if ('description' in this.meta && _.isString(this.meta.description) && this.meta.description.length) {
        if (!this.description) {
            this.description = this.dom.documentElement.insertBefore(this.dom.createElementNS(this.DEFAULT_SVG_NAMESPACE, 'desc'), this.dom.documentElement.firstChild);
        }

        this.description.textContent = this.meta.description;
        this.description.setAttribute('id', `${this.id}-desc`);
        ariaLabelledBy.push(`${this.id}-desc`);
    }

    // Check if title meta data is available
    if ('title' in this.meta && _.isString(this.meta.title) && this.meta.title.length) {
        if (!this.title) {
            this.title = this.dom.documentElement.insertBefore(this.dom.createElementNS(this.DEFAULT_SVG_NAMESPACE, 'title'), this.dom.documentElement.firstChild);
        }

        this.title.textContent = this.meta.title;
        this.title.setAttribute('id', `${this.id}-title`);
        ariaLabelledBy.push(`${this.id}-title`);
    }

    if (ariaLabelledBy.length) {
        this.dom.documentElement.setAttribute('aria-labelledby', ariaLabelledBy.join(' '));
    } else if (this.dom.documentElement.hasAttribute('aria-labelledby')) {
        this.dom.documentElement.removeAttribute('aria-labelledby');
    }

    cb(null);
};

/**
 * Apply a namespace prefix to all IDs within the SVG document
 *
 * @param {String} ns               ID namespace
 */
SVGShape.prototype.setNamespace = function(ns) {
    const namespaceIds = Boolean(this.spriter.config.svg.namespaceIDs);
    const namespaceClassnames = Boolean(this.spriter.config.svg.namespaceClassnames);
    const namespaceIDPrefix = this.spriter.config.svg.namespaceIDPrefix || '';

    if (!this._namespaced && (namespaceIds || namespaceClassnames)) {
        // Ensure the shape has been complemented before
        if (!this.svg.ready) {
            const error = new Error('Shape namespace cannot be set before complementing');
            error.name = 'NotPermittedError';
            error.errno = 1419162245;
            throw error;
        }

        const select = xpath.useNamespaces({ svg: this.DEFAULT_SVG_NAMESPACE, xlink: this.XLINK_NAMESPACE });
        let substIds = null;
        let substClassnames = null;

        // If IDs should be namespaced
        if (namespaceIds) {
            // Build an ID substitution table (and alter the elements' IDs accordingly)
            substIds = {};
            select('//*[@id]', this.dom).forEach(elem => {
                const id = elem.getAttribute('id');
                const substId = namespaceIDPrefix + ns + id;
                substIds[`#${id}`] = substId;
                elem.setAttribute('id', substId);
            });

            // Substitute ID references in xlink:href attributes
            select('//@xlink:href', this.dom).forEach(xlink => {
                const xlinkValue = xlink.nodeValue;
                if (!xlinkValue.startsWith('data:') && xlinkValue in substIds) {
                    xlink.ownerElement.setAttribute('xlink:href', `#${substIds[xlinkValue]}`);
                }
            });

            // Substitute ID references in referencing attributes
            svgReferenceProperties.forEach(refProperty => {
                select(`//@${refProperty}`, this.dom).forEach(ref => {
                    ref.ownerElement.setAttribute(ref.localName, this._replaceIdAndClassnameReferences(ref.nodeValue, substIds, substClassnames, false));
                });
            });

            // Substitute ID references in aria-labelledby attribute
            if (this.dom.documentElement.hasAttribute('aria-labelledby')) {
                this.dom.documentElement.setAttribute('aria-labelledby', this.dom.documentElement.getAttribute('aria-labelledby').split(' ').map(label => {
                    return `#${label}` in substIds ? substIds[`#${label}`] : label;
                }).join(' '));
            }
        }

        // If CSS class names should be namespaced
        if (namespaceClassnames) {
            // Build a class name substitution table (and alter the elements' class names accordingly)
            substClassnames = {};
            select('//*[@class]', this.dom).forEach(elem => {
                const elemClassnames = [];
                elem.getAttribute('class').split(' ')
                    .filter(classname => classname.trim())
                    .forEach(classname => {
                        const substClassname = ns + classname;
                        substClassnames[`.${classname}`] = substClassname;
                        elemClassnames.push(substClassname);
                    });
                elem.setAttribute('class', elemClassnames.join(' '));
            });
        }

        // Substitute ID references in <style> elements
        const style = select('//svg:style', this.dom);
        if (style.length) {
            select('//svg:style', this.dom).forEach(style => {
                style.textContent = csso.minifyBlock(this._replaceIdAndClassnameReferences(style.textContent, substIds, substClassnames, true), { restructure: false }).css;
            });
        }

        this._namespaced = true;
    }
};

/**
 * Reset the shapes namespace
 */
SVGShape.prototype.resetNamespace = function() {
    if (this._namespaced && Boolean(this.spriter.config.svg.namespaceIDs)) {
        this._namespaced = false;
        this.dom = new DOMParser().parseFromString(this.svg.ready);
    }
};

/**
 * Replace ID references
 *
 * @param {String} str                  String
 * @param {Object} substIds             ID substitutions
 * @param {Object} substClassnames      Class name substitutions
 * @param {Boolean} selectors           Substitute CSS selectors
 * @return {String}                     String with replaced ID and class name references
 */
SVGShape.prototype._replaceIdAndClassnameReferences = function(str, substIds, substClassnames, selectors) {
    // If ID replacement is to be applied: Replace url()-style ID references
    if (substIds !== null) {
        str = str.replace(/url\s*\(\s*["']?([^\s"')]+)["']?\s*\)/g, (match, id) => {
            return `url(${id in substIds ? `#${substIds[id]}` : id})`;
        });
    }

    return selectors ? this._replaceIdAndClassnameReferencesInCssSelectors(str, cssom.parse(str).cssRules, substIds, substClassnames) : str;
};

/**
 * Recursively replace ID references in CSS selectors
 *
 * @param {String} str                  Original CSS text
 * @param {Array} rules                 CSS rules
 * @param {Object} substIds             ID substitutions
 * @param {Object} substClassnames      Class name substitutions
 * @return {String}                     Substituted CSS text
 */
SVGShape.prototype._replaceIdAndClassnameReferencesInCssSelectors = function(str, rules, substIds, substClassnames) {
    let css = '';

    rules.forEach(rule => {
        let selText = rule.selectorText;

        // @-rule
        if (selText === undefined) {
            // If there's a key text: Copy the CSS rule
            if (rule.keyText) {
                css += str.substr(rule.__starts, rule.__ends);

            // Else: Recursively process rule content
            } else if (Array.isArray(rule.cssRules)) {
                css += str.substring(rule.__starts, rule.cssRules[0].__starts) + this._replaceIdAndClassnameReferencesInCssSelectors(str, rule.cssRules, substIds, substClassnames) + str.substring(rule.cssRules[rule.cssRules.length - 1].__ends, rule.__ends);
            }

        // Regular selector
        } else {
            const origSelText = selText;
            const csssel = new CssSelectorParser();
            let sel = csssel.parse(selText);
            const ids = [];
            let classnames = [];
            const classnameFilter = classname => {
                if (`.${classname}` in substClassnames) {
                    classnames.push(classname);
                }
            };

            const idOrClassSubstitution = sel => {
                // If ID substitution should be applied: Search for an ID
                if ('id' in sel.rule && substIds !== null && `#${sel.rule.id}` in substIds) {
                    ids.push(sel.rule.id);
                }

                // If class name substitution should be applied: Search for class names
                if ('classNames' in sel.rule && substClassnames !== null && Array.isArray(sel.rule.classNames)) {
                    sel.rule.classNames.forEach(classname => {
                        classnameFilter(classname);
                    });
                }
            };

            // If there are multiple subselectors, substitute all of them
            if ('selectors' in sel) {
                sel.selectors.forEach(selector => {
                    idOrClassSubstitution(selector);
                });
            }

            // While there are nested rules: Substitute and recurse
            while (typeof sel === 'object' && 'rule' in sel) {
                idOrClassSubstitution(sel);
                sel = sel.rule;
            }

            // Substitute IDs within the selector
            if (ids.length) {
                ids.sort((a, b) => b.length - a.length)
                    .forEach(id => {
                        selText = selText.split(`#${id}`).join(`#${substIds[`#${id}`]}`);
                    });
            }

            // Substitute class names within the selector
            if (classnames.length) {
                classnames = [...new Set(classnames)]
                    .sort((a, b) => b.length - a.length)
                    .forEach(classname => {
                        selText = selText.split(`.${classname}`).join(`.${substClassnames[`.${classname}`]}`);
                    });
            }

            // Rebuild the selector
            css += selText + str.substring(rule.__starts + origSelText.length, rule.__ends);
        }
    });

    return css;
};

/**
 * Create distribute to several copies (if configured)
 *
 * @return {Array}              Displaced copies
 */
SVGShape.prototype.distribute = function() {
    const copies = [];
    const alignments = [...this.align];
    const align = alignments.shift();
    const { base } = this;
    this.base = format(align[0], this.base);
    this.id = this.base + (this.state ? this.config.id.pseudo + this.state : '');
    this.align = align[1];
    copies.push(this);

    // Run through all remaining alignments
    alignments.forEach(alignment => {
        const copy = _.merge(new SVGShape(this.source, this.spriter), this);
        copy.base = format(alignment[0], base);
        copy.id = copy.base + (this.state ? this.config.id.pseudo + this.state : '');
        copy.align = alignment[1];
        copy.master = this;
        copies.push(copy);
    });

    this.copies = alignments.length;
    return copies;
};

/**
 * Module export (constructor wrapper)
 *
 * @param {String} svg          SVG content
 * @param {String} name         Name part or the file path
 * @param {String} file         Absolute file path
 * @param {Object} config       SVG shape configuration
 * @return {SVGShape}           SVGShape instance
 */
module.exports = function(svg, name) {
    return new SVGShape(svg, name);
};
