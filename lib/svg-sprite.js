'use strict';

// Last resort for uncaught exceptions
process.on('uncaughtException', function (error) {
	console.log(error);
    console.error('An uncaughtException was found, svg-sprite will end.');
    process.exit(1);
});

var _				= require('underscore'),
	fs				= require('fs'),
	util			= require('util'),
    path			= require('path'),
	async			= require('async'),
	mkdirp			= require('mkdirp'),
	async			= require('async'),
	SVGObj			= require('./svg-obj.js'),
	defaultOptions	= {
		sassout		: null,
		css			: true,
		sass		: false,
		spritedir	: 'svg',
		sprite		: 'sprite',
		prefix		: 'svg',
		common		: null,
		maxwidth	: null,
		maxheight	: null,
		padding		: 0,
		pseudo		: '~',
		dims		: false,
		keep		: false,
		verbose		: 0,
		cleanwith	: 'scour',
		cleanconfig	: {}
	};

/**
 * SVG Sprite generator
 * 
 * @param {String} inputDir			Directory path
 * @param {String} outputDir		Output directory
 * @param {Object} options			Options
 * @return {SVGSprite}				SVG sprite generator instance
 * @throws {Error}
 */
function SVGSprite(inputDir, outputDir, options) {
	
	// Check if the the input directory was provided
	if ((typeof(inputDir) != 'string') || !inputDir.length) {
		var error					= new Error('Please provide a valid input directory');
		error.errno					= 1391852763;
		throw error;
	}
	
	// Check if the the input directory is a valid directory
	try {
		inputDir					= path.resolve(inputDir);
		var isDirectory				= fs.lstatSync(inputDir).isDirectory();
	} catch(error) {
		if ((typeof(error) == 'object') && ('errno' in error) && (error.errno == 34) && ('syscall' in error) && (error.syscall == 'lstat')) {
			error					= new Error('Please provide a valid input directory');
			error.errno				= 1391853079;
		}
		throw error;
	}
	
	// Validate & prepare the options
	this._options					= _.extend(defaultOptions, options);
	var sassout						= (new String(this._options.sassout || '')).trim();
	this._options.cssout			= path.resolve(outputDir);
	this._options.sassout			= sassout.length ? path.resolve(sassout) : this._options.cssout;
	this._options.css				= (this._options.css === true) ? 'sprite' : ((new String(this._options.css || '')).trim() || false);
	this._options.sass				= (this._options.sass === true) ? 'sprite' : ((new String(this._options.sass || '')).trim() || false);
	this._options.spritedir			= (new String(this._options.spritedir || '').trim()) || 'svg';
	this._options.sprite			= (new String(this._options.sprite || '').trim()) || 'sprite';
	this._options.prefix			= (new String(this._options.prefix || '').trim()) || 'svg';
	this._options.common			= (new String(this._options.common || '').trim()) || null;
	this._options.maxwidth			= Math.abs(parseInt(this._options.maxwidth || 1000, 10));
	this._options.maxheight			= Math.abs(parseInt(this._options.maxheight || 1000, 10));
	this._options.padding			= Math.abs(parseInt(this._options.padding, 10));
	this._options.pseudo			= (new String(this._options.pseudo).trim()) || '~';
	this._options.dims				= !!this._options.dims;
	this._options.keep				= !!this._options.keep;
	this._options.verbose			= Math.min(Math.max(0, parseInt(this._options.verbose, 10)), 2);
	this._options.cleanwith			= (new String(this._options.cleanwith || '').trim()) || null;
	this._options.cleanconfig		= _.extend({}, this._options.cleanconfig);
	this.files						= this._readSVGFiles(inputDir);
	this._reset();
	
	switch(this._options.cleanwith.toLowerCase()) {
		
		// Clean SVG files with Scour (svg-cleaner module)
		case 'scour':
			this._cleaner			= require('svg-cleaner');
			this._clean				= this._cleanScour;
			break;
			
		// Clean SVG files with SVGO
		case 'svgo':
			var SVGO				= require('svgo');
			this._cleaner			= new SVGO();
			this._clean				= this._cleanSVGO;
			break;
			
		default:
			this._cleaner			= null;
			this._clean				= function(file){
				return fs.readFileSync(file, 'utf-8');
			};
	}
}

/**
 * Reset the stack collections
 */
SVGSprite.prototype._reset = function() {
	this.width						= 0;
	this.height						= 0;
	this.sprite						= [];
	this.css						= [];
	this.sass						= [];
	this.result						= {success: false, length: 0, files: {}};
}

/**
 * Set the SVG files to create a sprite of
 * 
 * @param {Array} svgFiles			SVG files
 * @return {SVGSprite}				Self reference
 */
SVGSprite.prototype.useSVGFiles = function(svgFiles) {
	this.files		= util.isArray(svgFiles) ? svgFiles : [];
	this.files.sort();
	return this;
}

/**
 * Find all SVG files in a given directory
 * 
 * @param {String} inputDir			Directory path
 * @return {Array}					SVG files
 */
SVGSprite.prototype._readSVGFiles = function(inputDir) {
	var files		= [];
	fs.readdirSync(inputDir).forEach(function(file) {
		if (path.extname(file) !== '.svg') {
			return;
		}
		files.push(path.join(inputDir, file));
	});
	return files;
}

/**
 * Synchronously write all files to the file system
 * 
 * @param {Function} callback		Callback
 */
SVGSprite.prototype._writeFilesSync = function(callback) {
	
	// Write the SVG sprite to disk
	var spriteSVG								= this.toSVG(),
	spriteSVGPath								= path.join(this._options.cssout, this._options.spritedir, this._options.sprite + '.svg');
	try {
		fs.writeFileSync(spriteSVGPath, spriteSVG, 'utf-8');
		this.result.files[spriteSVGPath]		= spriteSVG.length;
		++this.result.length;
	} catch(error) {
		callback(error);
		return;
	}

	// If there's CSS to be written
	if (this.css.length) {
		var spriteCSS							= this.css.join('\n'),
		spriteCSSPath							= path.join(this._options.cssout, this._options.css + '.css');
		try {
			fs.writeFileSync(spriteCSSPath, spriteCSS, 'utf-8')
			this.result.files[spriteCSSPath]	= spriteCSS.length;
			++this.result.length;
		} catch(error) {
			callback(error);
			return;
		}
	}
	
	// If there's Sass to be written
	if (this.sass.length) {
		var spriteSass							= this.sass.join('\n'),
		spriteSassPath							= path.join(this._options.sassout, this._options.sass + '.scss');
		try {
			fs.writeFileSync(spriteSassPath, spriteSass, 'utf-8')
			this.result.files[spriteSassPath]	= spriteSass.length;
			++this.result.length;
		} catch(error) {
			callback(error);
			return;
		}
	}
	
	callback(null);
}

/**
 * Clean an SVG file using SVGO
 * 
 * @param {String} file				SVG file name
 * @param {Object} config			Cleaning configuration
 * @param {Function} callback		Callback
 */
SVGSprite.prototype._cleanSVGO = function(file, config, callback) {
	if (this._options.verbose) {
		console.log(util.format('Optimizing SVG image "%s" using SVGO', path.basename(file)));
	}
	var that				= this;
	fs.readFile(file, "utf8", function(error, svg) {
		that._cleaner.optimize(svg, function(result) {
			var info		= {
				svg			: result.data,
				width		: parseFloat(result.info.width),
				height		: parseFloat(result.info.height)
			}
			callback(null, info);
		});
	});
}

/**
 * Clean an SVG file using svg-cleaner (Scour)
 * 
 * @param {String} file				SVG file name
 * @param {Object} config			Cleaning configuration
 * @param {Function} callback		Callback
 */
SVGSprite.prototype._cleanScour = function(file, config, callback) {
	if (this._options.verbose) {
		console.log(util.format('Optimizing SVG image "%s" using Scour', path.basename(file)));
	}
	callback(null, SVGObj.createObject(file, new this._cleaner.createCleaner().readFileSync(file).clean().svgString(), this._options));
}

/**
 * Create an SVG sprite from the registered source files 
 * 
 * @param {Function} callback		Callback
 * @return {void}
 */
SVGSprite.prototype.createSprite = function(callback) {
	var that				= this;
	async.waterfall([
	
		// Create the CSS and sprite output directories
	    function(_callback){
	    	mkdirp(path.join(that._options.cssout, that._options.spritedir), 511, function(error) {
	    		if (error && (typeof(error) == 'object') && ('message' in error)) {
	    			error				= new Error(error.message);
	    			error.errno			= 1391854708;
	    		}
	    		_callback(error);
	    	});
	    },
	    
	    // Optionally create the Sass output directory
	    function(_callback){
	    	if (that._options.sassout) {
		    	mkdirp(that._options.sassout, 511, function(error) {
		    		if (error && (typeof(error) == 'object') && ('message' in error)) {
		    			error			= new Error(error.message);
		    			error.errno		= 1391854708;
		    		}
		    		_callback(error);
		    	});
	    	} else {
	    		_callback();
	    	}
	    },
	    
	    // Process all SVG files
	    function(_callback){
	    	that._processFiles(_callback);
	    },
	    
	    // Write all output to disk
	    function(_callback){
	    	that._writeFilesSync(_callback);
	    }
	    
	], function(error) {
		if (!error) {
			that.result.success	= true;
		}
		callback(error, that.result);
	});
}

/**
 * Process all SVG files
 * 
 * @param {Function} callback		Callback
 */
SVGSprite.prototype._processFiles = function(callback) {
	var that				= this,
	tasks					= {};
	this.files.forEach(function(file) {
		var svgID			= path.basename(file, '.svg');
		tasks[svgID]		= function(_callback) {
			that._processFile(svgID, file, _callback);
		}
	});
	async.parallel(tasks, function (error, results) {
		if (error) {
			callback(error);
			return;
		}
		
		that._reset();
		
		// Register all SVG files with the sprite
		for (var svgID in results) {
			that._addToSprite(svgID, results[svgID]);
		}
		
		callback(null);
	});
}

/**
 * Add a single SVG to the sprite
 * 
 * @param {String} svgID			SVG file ID
 * @param {SVGObj} svgInfo			SVG info object
 */
SVGSprite.prototype._addToSprite = function(svgID, svgInfo) {
	var dimensions				= svgInfo.getDimensions();
	
	// Set ID and vertical position
	svgInfo.svg.root().attr({id: svgID, y: this.height});
	
	// Register the single SVG with the sprite
	this.sprite.push(svgInfo.toSVG());
	
	// Determine the CSS class name and pseudo class
	var cls						= svgID.split(this._options.pseudo),
	spriteUrl					= path.join(this._options.spritedir, this._options.sprite + '.svg'),
	sassExtend					= '';
	
	// If a common class is to be used
	if (this._options.common) {
		if (this._options.css.length && !this.css.length) {
			this.css.push('.' + this._options.common + '{background-image:url(' + spriteUrl + ');background-repeat:no-repeat}');
		}
		if (this._options.sass.length && !this.sass.length) {
			this.sass.push('.' + this._options.common + ' {\n	background-image:url(' + spriteUrl + ');\n	background-repeat:no-repeat\n}');
		}
		
	// Else: Register the Sass extension class
	} else if (this._options.sass.length) {
		sassExtend				= '%' + this._options.prefix;
		this.sass.push(sassExtend + ' {\n	background-image:url(' + spriteUrl + ');\n	background-repeat:no-repeat\n}');
		sassExtend				= '\n	@extend ' + sassExtend + ';';
	}
	
	// Create the CSS rules
	if (this._options.css.length) {
		var selectors			= ['.' + this._options.prefix + '-' + cls.join(':')];
		selectors.push('.' + this._options.prefix + '-' + ((cls.length > 1) ? cls.join('\\:') : (cls[0] + '\\:regular')));
		this.css.push(selectors.join(',') + '{background-position:0 ' + (-this.height) + (this.height ? 'px' : '') + (this._options.common ? '' : ';background-image:url(' + spriteUrl + ');background-repeat:no-repeat') + '}');
		
		// Optionally record the image dimensions as well
		if (this._options.dims) {
			var dimSelectors	= (cls.length == 1) ? ['.' + this._options.prefix + '-' + cls[0] + '-dims'] : ['.' + this._options.prefix + '-' + cls[0] + '-dims:' + cls[1], '.' + this._options.prefix + '-' + cls[0] + '\\:' + cls[1] + '-dims'];
			this.css.push(dimSelectors.join(',') + '{width:' + dimensions.width + 'px;height:' + dimensions.height + 'px}');
		}
	}
	
	// Create the Sass rules
	if (this._options.sass.length) {
		var selectors			= ['.' + this._options.prefix + '-' + cls.join(':')];
		selectors.push('.' + this._options.prefix + '-' + ((cls.length > 1) ? cls.join('\\:') : (cls[0] + '\\:regular')));
		this.sass.push(selectors.join(',\n') + ' {' + sassExtend + '\n	background-position: 0 ' + (-this.height) + (this.height ? 'px' : '') + ';\n}');
		
		// Optionally record the image dimensions as well
		if (this._options.dims) {
			var dimSelectors	= (cls.length == 1) ? ['.' + this._options.prefix + '-' + cls[0] + '-dims'] : ['.' + this._options.prefix + '-' + cls[0] + '-dims:' + cls[1], '.' + this._options.prefix + '-' + cls[0] + '\\:' + cls[1] + '-dims'];
			this.sass.push(dimSelectors.join(',') + ' {\n	width: ' + dimensions.width + 'px;\n	height: ' + dimensions.height + 'px;\n}');
		}
	}
	
	// Increment sprite dimensions
	this.width				= Math.max(this.width, dimensions.width);
	this.height				= Math.ceil(this.height + dimensions.height);
}

/**
 * Process a single SVG file
 * 
 * @param {String} id				SVG file ID
 * @param {String} file				SVG file name
 * @param {Function} callback		Callback
 */
SVGSprite.prototype._processFile = function(id, file, callback) {
	var that				= this;
	async.waterfall([
	    function(_callback){
			
	    	// Optimize the SVG
	    	that._clean(file, that._options.cleanconfig, _callback);
	    },
	    function(svgInfo, _callback) {
	    	
	    	// Sanitize dimension settings and optionally scale the SVG
	    	svgInfo.prepareDimensions(_callback);
	    },
	    function(svgInfo, _callback) {
	    	
	    	// Add optional padding
	    	svgInfo.setPadding(_callback);
	    },
	    function(svgInfo, _callback) {
	    	
	    	// If the single SVG files should be kept: Write the optimized file to the file system
	    	if (that._options.keep) {
	    		var svgImageSVG							= svgInfo.toSVG(),
	    		svgImagePath							= path.join(that._options.cssout, that._options.spritedir, path.basename(file));
	    		try {
	    			fs.writeFileSync(svgImagePath, svgImageSVG, 'utf-8');
	    			that.result.files[svgImagePath]		= svgImageSVG.length;
	    			++that.result.length;
	    		} catch(error) {
	    			_callback(error);
	    			return;
	    		}
	    	}
	    	
	    	// Namespace the IDs inside the SVG
	    	svgInfo.namespaceIDs(_callback);
	    },
	    function(svgInfo, _callback) {
	    	_callback(null, svgInfo);
	    }
	], callback);
}

/**
 * Return the sprite SVG
 * 
 * @return {SVGSprite}				Self reference
 */
SVGSprite.prototype.toSVG = function() {
	var svg					= [];
	svg.push('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + this.width + '" height="' + this.height + '" viewBox="0 0 ' + this.width + ' ' + this.height + '">');
	Array.prototype.push.apply(svg, this.sprite);
	svg.push('</svg>');
	return svg.join('');
}

/**
 * Main (exported) function
 * 
 * @param {String} inputDir			Input directory
 * @param {String} outputDir		Output directory
 * @param {Object} options			Options
 * @param {Function} callback		Callback
 * @return {}
 */
function createSprite(inputDir, outputDir, options, callback) {
	
	// Check arguments
	if (arguments.length != 4) {
		var error			= new Error('Please call svg-sprite.createSprite() with exactly 4 arguments');
		error.errno			= 1391852448;
		return error;
	}
	
	try {
		var _SVGSprite		= new SVGSprite(inputDir, outputDir, options);
	} catch(error) {
		return error;
	}
	
	// Asynchronously create the SVG sprite
	_SVGSprite.createSprite(callback);
}
	
module.exports.createSprite = createSprite;