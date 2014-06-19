var _						= require('underscore'),
libxmljs					= require('libxmljs'),
cssom						= require('cssom'),
csssp						= require('css-selector-parser').CssSelectorParser,
csssel						= new csssp(),
path						= require('path'),
phantom_sync				= require('phantom-sync'),
phantom	  					= phantom_sync.phantom,
sync		 				= phantom_sync.sync,
refProperties				= ['style', 'fill', 'stroke', 'filter', 'clip-path', 'mask',  'marker-start', 'marker-end', 'marker-mid'];

// Configure the CSS selector parser
csssel.registerSelectorPseudos('has');
csssel.registerNestingOperators('>', '+', '~');
csssel.registerAttrEqualityMods('^', '$', '*', '~');
csssel.enableSubstitutes();

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
	this.doctype			= null;
	this.xmldecl			= null;
	this.serialized			= null;
	this._config			= _.extend({
		maxwidth			: 1000,
		maxheight			: 1000,
		padding				: 0
	}, config);
	this._config.maxwidth	= Math.abs(parseInt(this._config.maxwidth || 0, 10));
	this._config.maxheight	= Math.abs(parseInt(this._config.maxheight || 0, 10));
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
	this.serialized			= null;
	callback(null, this);
}

/**
 * Determine the object dimensions by rendering the SVG via PhantomJS
 *
 * @param {Function} callback		Callback
 */
SVGObj.prototype._determineDimensions = function(callback) {

	// Try to use a viewBox attribute for image determination
	var viewBox					= this.svg.root().attr('viewBox');
	if (viewBox) {
		viewBox					= viewBox.value().split(/[^\d\.]+/);
		while(viewBox.length < 4) {
			viewBox.push(0);
		}
		viewBox.forEach(function(value, index) {
			viewBox[index]		= parseFloat(value, 10);
		});
		this.width				= viewBox[2];
		this.height				= viewBox[3];
		this.svg.root().attr('viewBox', viewBox.join(' '));
		this.serialized			= null;
	}

	// If the viewBox attribute didn't suffice: Render the SVG image
	if (!this.width || !this.height) {
		var that				= this;
		sync(function() {
			var ph				= phantom.create(),
			page				= ph.createPage();
			page.setContent(that.svg.toString(), 'file://' + that.file);
			var dimensions		= page.evaluate(function() {
				return document.getElementsByTagName('svg')[0].getBoundingClientRect();
			});
			that.width			= dimensions.width;
			that.height			= dimensions.height;
			that.serialized		= null;
			ph.exit();
			callback(null, this);
		})
	} else {
		callback(null, this);
	}
}

/**
 * Add padding to the SVG
 *
 * @param {Function} callback		Callback
 */
SVGObj.prototype.setPadding = function(callback) {
	if (this._config.padding > 0) {
		var viewBox			= [0, 0, this.width, this.height],

		// Consider the viewBox attribute (if present)
		currentViewBox		= this.svg.root().attr('viewBox');
		if (currentViewBox !== null) {
			currentViewBox	= (new String(currentViewBox.value())).split(/\s+/g);
			for (var vb = 0, val; vb < currentViewBox.length; ++vb) {
				val			= currentViewBox[vb].trim();
				if (val.length) {
					viewBox[vb] = parseFloat(val, 10);
				}
			}
		}

		// Add the padding to the viewBox
		this.width			+= 2 * this._config.padding;
		this.height			+= 2 * this._config.padding;
		viewBox[0]			-= this._config.padding;
		viewBox[1]			-= this._config.padding;
		viewBox[2]			+= 2 * this._config.padding;
		viewBox[3]			+= 2 * this._config.padding;
		this.svg.root().attr({'viewBox': viewBox.join(' ')});
	}

	this.svg.root().attr(this.getDimensions());
	this.serialized			= null;
	callback(null, this);
}

/**
 * Add namespaces to all IDs in this SVG
 *
 * @param {String} ns				Namespace prefix
 * @param {Function} callback		Callback
 */
SVGObj.prototype.namespaceIDs = function(ns, callback) {

	// Build an ID substitution table (and alter the document's IDs accordingly)
	var subst				= {};
	this.svg.find('//*[@id]').forEach(function(elem) {
		var id				= elem.attr('id').value(),
		substId				= ns + id;
		subst['#' + id]		= substId;
		elem.attr('id', substId);
	});

	// Substitute ID references in <style> elements
	this.svg.find('//svg:style', {svg: 'http://www.w3.org/2000/svg'}).forEach(function(style) {
		style.text(this._replaceIDReferences(style.text(), subst, true));
	}, this);

	// Substitute ID references in xlink:href attributes
	this.svg.find('//@xlink:href', {xlink: 'http://www.w3.org/1999/xlink'}).forEach(function(xlink){
		var xlinkValue		= xlink.value();
		if ((xlinkValue.indexOf('data:') !== 0) && (xlinkValue in subst)) {
			xlink.value('#' + subst[xlinkValue]);
		}
	});

	// Substitute ID references in referencing attributes
	refProperties.forEach(function(refProperty){
		this.svg.find('//@' + refProperty).forEach(function(ref) {
			ref.value(this._replaceIDReferences(ref.value(), subst, false));
		}, this);
	}, this);

	this.serialized			= null;
	callback(null, this);
}



/**
 * Replace an ID reference
 *
 * @param {String} str					String
 * @param {Object} subst				ID substitutions
 * @param {Boolean} selectors			Substitute CSS selectors
 * @return {String}						String with replaced ID references
 */
SVGObj.prototype._replaceIDReferences = function(str, subst, selectors) {

	// Replace url()-style ID references
	str						= str.replace(/url\s*\(\s*["']?([^\)]+)["']?\s*\)/g, function(match, id){
		return 'url(' + ((id in subst) ? ('#' + subst[id]) : id) + ')';
	});

	if (selectors) {

		// Replace ID references in CSS selectors
		var css					= '',
		rules					= cssom.parse(str).cssRules;
		rules.forEach(function(rule) {
			var selText			= rule.selectorText,
			origSelText			= selText,
			sel					= csssel.parse(selText),
			ids					= [];
			while ((typeof(sel) == 'object') && ('rule' in sel)) {
				if (('id' in sel.rule) && (('#' + sel.rule.id) in subst)) {
					ids.push(sel.rule.id);
				}
				sel				= sel.rule;
			}
			if (ids.length) {
				ids.sort(function(a, b){
					return b.length - a.length;
				});
				ids.forEach(function(id) {
					selText		= selText.split('#' + id).join('#' + subst['#' + id]);
				}, this);
			}
			css					+= selText + str.substring(rule.__starts + origSelText.length, rule.__ends);
		}, this);

		return css;
	} else {
		return str;
	}
}

/**
 * Return the SVG text
 *
 * @param {Boolean}	inline	Prepare for inline usage (strip redundant XML namespaces)
 * @param {Number} tweaks	XML tweaks (bitmask)
 * @return {String}			SVG
 */
SVGObj.prototype.toSVG = function(inline, tweaks) {

	// Serialize and cache the SVG text
	if (this.serialized === null) {
		this.serialized		= this.svg.toString(false);
		var xmldecl			= this.serialized.match(/<\?xml.*?>/gi),
		doctype				= this.serialized.match(/<!DOCTYPE.*?>/gi)
		svgNormalized		= this.serialized.toLowerCase()
		svgStart			= svgNormalized.indexOf('<svg'),
		svgEnd				= svgNormalized.lastIndexOf('</svg');
		this.xmldecl		= xmldecl ? xmldecl[0] : '<?xml version="' + this.svg.version() + '" encoding="' + this.svg.encoding() + '"?>';
		this.doctype		= doctype ? doctype[0] : '';
		this.serialized		= this.serialized.substring(Math.max(0, svgStart), (svgEnd >= 0) ? svgEnd : this.serialized.length) + ((svgEnd >= 0) ? '</svg>' : '');
	}

	var svg					= this.serialized;

	// If the SVG is to be used inline or as part of a sprite: Strip redundand namespace declarations
	if (inline) {
		[' xmlns="http://www.w3.org/2000/svg"', ' xmlns:xlink="http://www.w3.org/1999/xlink"'].forEach(function(strip) {
			svg				= svg.split(strip).join('');
		});

	// Else: Add XML and DOCTYPE declarations if required
	} else {
		tweaks					= tweaks || 0;

		// Add DOCTYPE declaration
		if (!(tweaks & 2)) {
			svg					= this.doctype + svg;
		}

		// Add XML declaration
		if (!(tweaks & 1)) {
			svg					= this.xmldecl + svg;
		}
	}

	return svg;
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