var _						= require('underscore'),
libxmljs					= require('libxmljs')
path						= require('path'),
childProcess				= require('child_process'),
phantom_sync				= require('phantom-sync'),
phantom      				= phantom_sync.phantom,
sync         				= phantom_sync.sync;

/**
 * SVG object constructor
 * 
 * @param {String} file		SVG file name
 * @param {String} svg		SVG XML
 * @param {Object} config	Configuration
 * @return {SVGObj}
 */
function SVGObj(file, svg, config) {
	this.file				= file;
	this.id					= path.basename(this.file, '.svg');
	this.svg				= libxmljs.parseXml(svg);
	this._config			= _.extend({
		width				: null,
		height				: null,
		maxwidth			: 1000,
		maxheight			: 1000,
		padding				: 0
	}, config);
	this._config.width		= Math.abs(parseInt(this._config.width || 0, 10));
	this._config.height		= Math.abs(parseInt(this._config.height || 0, 10));
	this._config.maxwidth	= Math.abs(parseInt(this._config.maxwidth || 0, 10));
	this._config.maxheight	= Math.abs(parseInt(this._config.maxheight || 0, 10));
	this._config.width		= this._config.maxwidth ? Math.min(this._config.maxwidth, this._config.width) : this._config.width;
	this._config.height		= this._config.maxheight ? Math.min(this._config.maxheight, this._config.height) : this._config.height;
	this._config.padding	= Math.abs(parseInt(this._config.padding, 10));
	
	var width				= this.svg.root().attr('width'),
	height					= this.svg.root().attr('height');
	this.width				= width ? parseFloat(width.value(), 10) : false;
	this.height				= height ? parseFloat(height.value(), 10) : false;
}

/**
 * Prepare the object dimensions (downscale if necessary etc.)
 * 
 * @param {Function} callback		Callback
 */
SVGObj.prototype.prepareDimensions = function(callback) {
	
	// If either of the dimensions is unknown
	if (!this.width || !this.height) {
		var that			= this;
		this._determineDimensions(function() {
			that._validateDimensions(callback);
		});
		
	// Else: Immediately update the dimensions
	} else {
		this._validateDimensions(callback);
	}
}

/**
 * Validate the object dimensions (downscale if necessary etc.)
 * 
 * @param {Function} callback		Callback
 */
SVGObj.prototype._validateDimensions = function(callback) {
	
	// If the SVG is too big: Scale down
	if ((this.width > this._config.maxwidth) || (this.height > this._config.maxheight)) {
		
		// Add a viewBox if it doesn't exist already
		if (this.svg.root().attr('viewBox') === null) {
			this.svg.root().attr({'viewBox': '0 0 ' + this.width + ' ' + this.height});
		}
		
		var aspect			= this.width / this.height,
		maxAspect			= this._config.maxwidth / this._config.maxheight;
		if (aspect >= maxAspect) {
			this.width		= this._config.maxwidth;
			this.height		= this.width / aspect;
		} else {
			this.height		= this._config.maxheight;
			this.width		= this.height * aspect;
		}
	}
	
	this.svg.root().attr(this.getDimensions());
	callback(null, this);
}

/**
 * Determine the object dimensions by rendering the SVG via PhantomJS
 * 
 * @param {Function} callback		Callback
 */
SVGObj.prototype._determineDimensions = function(callback) {
	var that				= this;
	sync(function() {
		var ph				= phantom.create(),
		page				= ph.createPage();
		page.setContent(that.svg.toString(), 'file://' + that.file);
		dimensions			= page.evaluate(function() {
			return document.getElementsByTagName('svg')[0].getBoundingClientRect();
		});
		that.width			= dimensions.width;
		that.height			= dimensions.height;
		ph.exit();
		callback(null, this);
	})
}

/**
 * Add padding to the SVG
 * 
 * @param {Function} callback		Callback
 */
SVGObj.prototype.setPadding = function(callback) {
	if (this._config.padding > 0) {
		var viewBox			= [0, 0, this.width, this.height],
		currentViewBox		= this.svg.root().attr('viewBox');
		if (currentViewBox !== null) {
			currentViewBox	= (new String(currentViewBox.value())).split(/\s+/g);
			for (var vb = 0, val; vb < currentViewBox.length; ++vb) {
				val			= currentViewBox[vb].trim();
				if (val.length) {
					viewBox[vb] = parseFloat(val, 10);
				}
			}
			this.width		+= 2 * this._config.padding;
			this.height		+= 2 * this._config.padding;
			viewBox[0]		-= this._config.padding;
			viewBox[1]		-= this._config.padding;
			viewBox[2]		+= 2 * this._config.padding;
			viewBox[3]		+= 2 * this._config.padding;
			this.svg.root().attr({'viewBox': viewBox.join(' ')});
		}
	}
	
	this.svg.root().attr(this.getDimensions());
	callback(null, this);
}

/**
 * Add namespaces to all IDs in this SVG
 * 
 * @param {Function} callback		Callback
 * @todo Implement! svg-cleaner also does ID rewriting
 */
SVGObj.prototype.namespaceIDs = function(callback) {
	this.svg.find('//@id').forEach(function(id) {
//		console.log(id.value());
	});
	callback(null, this);
}

/**
 * Return the SVG text
 * 
 * @return {String}			SVG
 */
SVGObj.prototype.toSVG = function() {
	return this.svg.toString(false).split('?>').pop();
}

/**
 * Return the dimensions of this SVG
 * 
 * @return {Object}			Dimensions
 */
SVGObj.prototype.getDimensions = function() {
	return {width: this.width, height: this.height};	
}

/**
 * Create an SVG object instance
 * 
 * @param {String} file		SVG file name
 * @param {String} svg		SVG XML
 * @param {Object} config	Configuration
 * @return {SVGObj}			SVG object
 */
function createObject(file, svg, config) {
	return new SVGObj(file, svg, config);
}
	
module.exports.createObject = createObject;