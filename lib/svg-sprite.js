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
	mu				= require('mu2'),
	SVGObj			= require('./svg-obj.js'),
	defaultOptions	= {
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
		render		: {css: true},
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
	
	options							= _.extend({}, options);
	
	/***************************************************************************************
	 * Legacy code for deprecated arguments: Will be removed in future version
	 */
	var deprecated					= {
		'css'						: 'css: { ... }',
		'sass'						: 'scss: { ... }',
		'sassout'					: 'scss: { ... }',
		'less'						: 'less: { ... }',
		'lessout'					: 'less: { ... }'
	}, dn							= 0,
	d;
	for (var d in deprecated) {
		if (d in options) {
			console.error('The "%s" option is deprecated. Please use the new "render" option with "%s" instead (see https://github.com/jkphl/svg-sprite#rendering-configuration for details).', d, deprecated[d]);
			++dn;
		}
	}
	if (dn) {
		process.exit(1);
	}
	/**************************************************************************************/
	
	// Validate & prepare the options
	this._options					= _.extend(defaultOptions, options);
	this._options.outdir			= path.resolve(outputDir);
	this._options.spritedir			= (new String(this._options.spritedir || '.').trim()) || '.';
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
	this._options.render			= _.extend({css: true}, this._options.render);
	this._options.cleanwith			= (new String(this._options.cleanwith || '').trim()) || null;
	this._options.cleanconfig		= _.extend({}, this._options.cleanconfig);
	this.files						= this._readSVGFiles(inputDir);
	
	// Reset all internal stacks
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
	this.data						= {common: false, prefix: null, sprite: null, svg: []};
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
 * Write all files to the file system
 * 
 * @param {Function} callback		Callback
 */
SVGSprite.prototype._writeFiles = function(callback) {
	var that					= this,
	tasks						= {
		
		// Write the SVG sprite to disk
		sprite					: function(_callback) {
			var spriteSVG		= that.toSVG(),
			spriteSVGPath		= path.join(that._options.outdir, that._options.spritedir, that._options.sprite + '.svg');
			try {
				fs.writeFileSync(spriteSVGPath, spriteSVG, 'utf-8');
				that.result.files[spriteSVGPath]		= spriteSVG.length;
				++that.result.length;
				_callback(null);
			} catch(error) {
				_callback(error);
			}
		}
	};
	
	// If the sprite at least one SVG image
	if (that.data.svg.length) {
		that.result.data			= that.data;
		
		// Run through all configured rendering types
		for (var type in this._options.render) {
			var typeConf			= this._options.render[type],
			template				= ((typeConf.constructor === Object) && ('template' in typeConf)) ? path.resolve(typeConf.template) : path.resolve(__dirname, '../tmpl/sprite.' + type),
			dest					= null;
			
			// If the specified template exists
			try {
				if (fs.statSync(template).isFile()) {
					dest			= ((typeConf.constructor === Object) ? (('dest' in typeConf) ? typeConf.dest : true) : typeConf) || null;
					
					// If no destination file or directory is given: Use the default
					if (dest === true) {
						dest		= path.join(this._options.outdir, path.basename(template));
						
					// Else: Resolve the custom destination
					} else if (dest) {
						dest		= '' + dest;
						var isDir	= !dest.length || (dest.lastIndexOf(path.sep) == (dest.length - 1));
						dest		= path.resolve(this._options.outdir, dest);
						if (isDir) {
							dest	= path.join(dest, path.basename(template));
						}
						if (!path.extname(dest).length) {
							dest	+= path.extname(template);
						}
					}
				}
			} catch(e) {}

			// If both a template and a destination file are given: Create a task for it
			if (dest !== null) {
				tasks[type]			= (function(t, d) {
					return function(_callback) {
						var dir							= path.dirname(d);
						
						// Create the output directory
						mkdirp(dir, 511, function(error) {
				    		if (error && (typeof(error) == 'object') && ('message' in error)) {
				    			error					= new Error(error.message);
				    			error.errno				= 1391854708;
				    			_callback(error);
				    			return;
				    		}
				    		
				    		that.result.files[d]		= 0;
							try {
								fs.truncateSync(d);
							} catch(e) {}
							mu.root						= path.dirname(t);
							mu.compileAndRender(path.basename(t), that.data)
								.on('data', function (data) {
									try {
										var out							= data.toString();
										fs.appendFileSync(d, out);
										that.result.files[d]			+= out.length;
									} catch(e) {}
								})
								.on('error', _callback)
								.on('end', function(error) {
									if (that.result.files[d]) {
										++that.result.length;
									}
									_callback(error);
								});
				    	});						
					}
				})(template, dest);
			}
		}
	}
	
	async.parallel(tasks, callback);
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
			callback(null, SVGObj.createObject(file, result.data, that._options));
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
	    	mkdirp(path.join(that._options.outdir, that._options.spritedir), 511, function(error) {
	    		if (error && (typeof(error) == 'object') && ('message' in error)) {
	    			error				= new Error(error.message);
	    			error.errno			= 1391854708;
	    		}
	    		_callback(error);
	    	});
	    },
	    
	    // Process all SVG files
	    function(_callback){
	    	that._processFiles(_callback);
	    },
	    
	    // Write all output to disk
	    function(_callback){
	    	that._writeFiles(_callback);
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
	var cls						= svgID.split(this._options.pseudo);
	
	this.data.common			= this._options.common;
	this.data.prefix			= this._options.common || this._options.prefix;
	this.data.sprite			= path.join(this._options.spritedir, this._options.sprite + '.svg');
	
	// Register the SVG parameters
	this.data.svg.push({
		name					: svgID,
		selector				: [{
			expression			: this._options.prefix + '-' + cls.join(':'),
			raw					: this._options.prefix + '-' + cls.join(':'),
			first				: true,
			last				: false
		}, {
			expression			: this._options.prefix + '-' + ((cls.length > 1) ? cls.join('\\:') : (cls[0] + '\\:regular')),
			raw					: this._options.prefix + '-' + ((cls.length > 1) ? cls.join(':') : (cls[0] + ':regular')),
			first				: false,
			last				: true
		}],
		position				: '0 ' + (-this.height) + (this.height ? 'px' : ''),
		dims					: this._options.dims ? {
			selector			: (cls.length == 1) ? [{
				expression		: this._options.prefix + '-' + cls[0] + '-dims',
				raw				: this._options.prefix + '-' + cls[0] + '-dims',
				first			: true,
				last			: true
			}] : [{
				expression		: this._options.prefix + '-' + cls[0] + '-dims:' + cls[1],
				raw				: this._options.prefix + '-' + cls[0] + '-dims:' + cls[1],
				first			: true,
				last			: false
			}, {
				expression		: this._options.prefix + '-' + cls[0] + '\\:' + cls[1] + '-dims',
				raw				: this._options.prefix + '-' + cls[0] + ':' + cls[1] + '-dims',
				first			: false,
				last			: true
			}],
			width				: dimensions.width,
			height				: dimensions.height
		} : false
	});
	
	// Increment sprite dimensions
	this.width					= Math.max(this.width, dimensions.width);
	this.height					= Math.ceil(this.height + dimensions.height);
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
	    		svgImagePath							= path.join(that._options.outdir, that._options.spritedir, path.basename(file));
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