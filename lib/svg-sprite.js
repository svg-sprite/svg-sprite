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
	mustache		= require('mustache'),
	chalk			= require('chalk'),
	SVGObj			= require('./svg-obj.js'),
	defaultOptions	= {
		spritedir	: 'svg',
		sprite		: 'sprite',
		prefix		: 'svg',
		common		: null,
		maxwidth	: null,
		maxheight	: null,
		padding		: 0,
		layout		: 'vertical',
		pseudo		: '~',
		dims		: false,
		keep		: false,
		recursive	: false,
		verbose		: 0,
		render		: {css: true},
		variables	: {},
		cleanwith	: 'svgo',
		cleanconfig	: {}
	},
	svgoDefaults	= [
//		{cleanupAttrs					: true}, // cleanup attributes from newlines, trailing and repeating spaces
//		{removeDoctype					: true}, // remove doctype declaration
//		{removeXMLProcInst				: true}, // remove XML processing instructions
//		{removeComments					: true}, // remove comments
//		{removeMetadata					: true}, // remove `<metadata>`
//		{removeTitle					: true}, // remove `<title>`
//		{removeEditorsNSData			: true}, // remove editors namespaces, elements and attributes
//		{removeEmptyAttrs				: true}, // remove empty attributes
//		{removeHiddenElems				: true}, // remove hidden elements
//		{removeEmptyText				: true}, // remove empty Text elements
//		{removeEmptyContainers			: true}, // remove empty Container elements
//		{removeViewBox					: true}, // remove `viewBox` attribute when possible
//		{cleanupEnableBackground		: true}, // remove or cleanup `enable-background` attribute when possible
//		{convertStyleToAttrs			: true}, // convert styles into attributes
//		{convertColors					: true}, // convert colors (from `rgb()` to `#rrggbb`, from `#rrggbb` to `#rgb`)
//		{convertPathData				: true}, // convert Path data to relative, convert one segment to another, trim useless delimiters and much more
//		{convertTransform				: true}, // collapse multiple transforms into one, convert matrices to the short aliases and much more
//		{removeUnknownsAndDefaults		: true}, // remove unknown elements content and attributes, remove attrs with default values
//		{removeNonInheritableGroupAttrs	: true}, // remove non-inheritable group's "presentation" attributes
//		{removeUnusedNS					: true}, // remove unused namespaces declaration
//		{cleanupIDs						: true}, // remove unused and minify used IDs
//		{cleanupNumericValues			: true}, // round numeric values to the fixed precision, remove default 'px' units
//		{moveElemsAttrsToGroup			: true}, // move elements attributes to the existing group wrapper
		{moveGroupAttrsToElems			: false} // move some group attributes to the content elements
//		{collapseGroups					: true}, // collapse useless groups
//		{removeRasterImages				: false}, // remove raster images (disabled by default)
//		{mergePaths						: true}, // merge multiple Paths into one
//		{convertShapeToPath				: true}, // convert some basic shapes to path
//		{transformsWithOnePath			: true}, // apply transforms, crop by real width, center vertical alignment and resize SVG with one Path inside
	],
	svgTweaks		= ['removeXMLProcInst', 'removeDoctype'];
	
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
	this._options.inputDir			= inputDir;
	this._options.outputDir			= path.resolve(outputDir);
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
	this._options.recursive			= !!this._options.recursive;
	this._options.verbose			= Math.min(Math.max(0, parseInt(this._options.verbose, 10)), 3);
	this._options.render			= _.extend({css: true}, this._options.render);
	this._options.variables			= _.extend({}, this._options.variables || {});
	this._options.cleanwith			= (new String(this._options.cleanwith || '').trim()) || null;
	this._options.cleanconfig		= _.extend({}, this._options.cleanconfig || {});
	this._svgTweaks					= Math.pow(2, svgTweaks.length) - 1;
	this.files						= this._readSVGFiles(inputDir);
	this.namespacePow				= [];
	
	// Reset all internal stacks
	this._reset();
	
	switch(this._options.cleanwith.toLowerCase()) {
		
		// Clean SVG files with SVGO
		case 'svgo':
			var SVGO							= require('svgo');
			this._options.cleanconfig.plugins	= svgoDefaults.concat(this._options.cleanconfig.plugins || []);
			this._cleaner						= new SVGO(this._options.cleanconfig);
			this._clean							= this._cleanSVGO;
			
			// Synchronize the SVGO plugin configuration with the overal SVG tweak configuration
			for (var p = 0, that = this; p < this._options.cleanconfig.plugins.length; ++p) {
				for (var t = 0; t < svgTweaks.length; ++t) {
					that._svgTweaks				&= ~((this._options.cleanconfig.plugins[p][svgTweaks[t]] === false) ? Math.pow(2, t) : 0);
				}
			}
			break;

		// Clean SVG files with Scour (svg-cleaner module)
		case 'scour':
			console.log(chalk.red('The Scour cleaner is temporarily disabled until a new release is available'));
			/*
			this._cleaner						= require('svg-cleaner');
			this._clean							= this._cleanScour;
			break;
			*/
			
		default:
			this._cleaner						= null;
			this._clean							= function(file){
				return fs.readFileSync(file, 'utf-8');
			};
	}
}

/**
 * Reset the stack collections
 */
SVGSprite.prototype._reset = function() {
	this.sprite						= [];
	this.xmldecl					=
	this.doctype					= null;
	this.data						= _.extend({}, this._options.variables, {
		common						: this._options.common,
		prefix						: this._options.common || this._options.prefix,
		sprite						: path.join(this._options.spritedir, this._options.sprite + '.svg'),
		dims						: this._options.dims,
		padding						: this._options.padding,
		swidth						: 0,
		sheight						: 0,
		svg							: [],
		date						: (new Date()).toGMTString(),
		invert						: function() {
			return function(num, render) {
				return -parseFloat(render(num), 10);
			}
		},
		escape						: function() {
			return function(str, render) {
				return render(str).split('\\').join('\\\\');
			}
		}
	});
	this.result = {
		success						: false,
		length						: 0,
		files						: {},
		options						: this._options
	};
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
		try {
			var abs				= path.join(inputDir, file),
			stats				= fs.lstatSync(abs);
			if (stats.isFile() && (path.extname(file).toLowerCase() == '.svg')) {
				files.push(path.join(inputDir, file));
			} else if (stats.isDirectory() && this._options.recursive) {
				files			= files.concat(this._readSVGFiles(abs));
			}
		} catch(error) {}
	}, this);
	files.sort();
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
			var spriteSVG		= that.toSVG(false),
			spriteSVGPath		= path.join(that._options.outputDir, that._options.spritedir, that._options.sprite + '.svg');
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
	
	// If the sprite contains at least one SVG image
	if (that.data.svg.length) {
		that.result.data			= that.data;
		
		// Run through all configured rendering types
		for (var type in that._options.render) {
			var render				= renderConfig(that._options.outputDir, that._options.render[type], type);

			// If both a template and a destination file are given: Create a task for it
			if (render.dest !== null) {
				tasks[type]			= renderTask(render.template, render.dest, that.result.data, that.result);
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
	var that						= this;
	fs.readFile(file, 'utf8', function(error, svg) {
		if (error) {
			if (that._options.verbose > 2) {
				console.error(' · Optimized SVG image "%s" with SVGO ... ' + chalk.red('ERROR'), path.basename(file));
			}
			
			callback(error, null);
			return;
		}
		
		try {
			that._cleaner.optimize(svg, function(result) {
				var svgObj			= SVGObj.createObject(file, result.data, that._options);
				
				if (that._options.verbose > 2) {
					var size		= svgObj.toSVG(false, that._svgTweaks).length,
					saving			= svg.length - size;
					console.error(' · Optimized SVG image "%s" with SVGO ... ' + chalk.green('OK') + chalk.grey(' (saved %s / %s%%)'), path.basename(file), bytesToSize(saving), Math.round(100 * saving / svg.length));
				}
				
				callback(null, svgObj);
			});
		} catch (error) {
			console.error(' · Optimized SVG image "%s" with SVGO ... ' + chalk.red('ERROR'), path.basename(file));
			callback(error, null);
		}
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
	try {
		var scour					= new this._cleaner.createCleaner().readFileSync(file)
									.removeNSElements()
									.removeNSAttributes()
									.removeComments()
									.repairStyles()
									.removeUnreferencedElements()
									.removeEmptyContainers()
									.removeUnreferencedIDs(),
//									.shortenIDs()
		svgObj						= SVGObj.createObject(file, scour.svgString(), this._options);
		
		if (this._options.verbose > 2) {
			try {
				var filesize		= fs.lstatSync(file).size,
				size				= svgObj.toSVG(false, this._svgTweaks).length,
				saving				= filesize - size;
				console.error(' · Optimized SVG image "%s" with Scour ... ' + chalk.green('OK') + chalk.grey(' (saved %s / %s%%)'), path.basename(file), bytesToSize(saving), Math.round(100 * saving / filesize));
			} catch(error) {
				console.error(' · Optimized SVG image "%s" with Scour ... ' + chalk.green('OK'));
			}
		}
		
		callback(null, svgObj);
	} catch(error) {
		console.error(' · Optimized SVG image "%s" with Scour ... ' + chalk.red('ERROR'), path.basename(file));
		callback(error, null);
	}
}

/**
 * Create an SVG sprite from the registered source files 
 * 
 * @param {Function} callback		Callback
 * @return {void}
 */
SVGSprite.prototype.createSprite = function(callback) {
	this._reset();
	
	// If there are SVG source files
	if (this.files.length) {
		
		if (this._options.verbose) {
			console.log('Creating SVG sprite from %s files (directory "%s") ...', this.files.length, this._options.inputDir);
		}
		
		var that				= this;
		async.waterfall([
		
			// Create the CSS and sprite output directories
			function(_callback){
				mkdirp(path.join(that._options.outputDir, that._options.spritedir), 511, function(error) {
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
		
	// Else: Nothing to render
	} else {
		
		if (this._options.verbose) {
			console.log('Nothing to create (no SVG files in directory "%s")', this._options.inputDir);
		}
		
		callback(null, this.result);
	}
}

/**
 * Process all SVG files
 * 
 * @param {Function} callback		Callback
 */
SVGSprite.prototype._processFiles = function(callback) {
	var that							= this,
	tasks								= {};
	this.files.forEach(function(file, index) {
		var svgID						= path.basename(path.relative(that._options.inputDir, file).split(path.sep).join('-'), '.svg');
		tasks[svgID]					= function(_callback) {
			that._processFile(svgID, that._getFileNamespacePrefix(index), file, _callback);
		}
	});
	async.parallel(tasks, function (error, results) {
		if (error) {
			callback(error);
			return;
		}
		
		var svgPseudos					= {},
		svgIDs							= Object.keys(results).sort(),
		lastSVGIndex					= svgIDs.length - 1;
		svgIDs.forEach(function(svgID){
			var svgPseudo				= svgID.split(this._options.pseudo);
			svgPseudos[svgPseudo[0]]	= svgPseudos[svgPseudo[0]] || (svgPseudo.length > 1);
		}, that);
		
		// Register all SVG files with the sprite
		svgIDs.forEach(function(svgID, index){
			this._addToSprite(svgID, results[svgID], svgPseudos[svgID], index == lastSVGIndex);
		}, that);
		
		callback(null);
	});
}

/**
 * Return a unique SVG file namespace prefix
 * 
 * @param {Number} index			SVG file index
 * @return {String}					SVG file namespace prefix
 */
SVGSprite.prototype._getFileNamespacePrefix = function(index) {
	if (!this.namespacePow.length) {
		do {
			this.namespacePow.unshift(Math.pow(26, this.namespacePow.length));
		} while (Math.pow(26, this.namespacePow.length) < this.files.length);
	}
	for (var ns = '', n = 0, c; n < this.namespacePow.length; ++n) {
		c						= Math.floor(index / this.namespacePow[n]);
		ns						+= String.fromCharCode(97 + c);
		index					-= c * this.namespacePow[n];
	}
	return ns;
}

/**
 * Add a single SVG to the sprite
 * 
 * @param {String} svgID			SVG file ID
 * @param {SVGObj} svgInfo			SVG info object
 * @param {Boolean} svgPseudo		Add ":regular" pseudo class selector
 * @param {Boolean} isLastSVG		Last SVG in sprite image order
 */
SVGSprite.prototype._addToSprite = function(svgID, svgInfo, svgPseudo, isLastSVG) {
	var dimensions				= svgInfo.getDimensions(),
		rootAttr				= {id: svgID}, 
		positionX				= 0, 
		positionY				= 0;
		
	switch (this._options.layout) {
	
		// Horizontal sprite arrangement
		case 'horizontal':
			rootAttr.x			= this.data.swidth;
			positionX			= -this.data.swidth;
			
			this.data.swidth	= Math.ceil(this.data.swidth + dimensions.width);
			this.data.sheight	= Math.max(this.data.sheight, dimensions.height);
			break;
			
		// Diagonal sprite arrangement
		case 'diagonal':
			rootAttr.x			= this.data.swidth;
			rootAttr.y			= this.data.sheight;
			positionX			= -this.data.swidth;
			positionY			= -this.data.sheight;
			
			this.data.swidth	= Math.ceil(this.data.swidth + dimensions.width);
			this.data.sheight	= Math.ceil(this.data.sheight + dimensions.height);	
			break;
			
		// Vertical sprite arrangement (default)
		default:
			rootAttr.y			= this.data.sheight;
			positionY			= -this.data.sheight;
			
			this.data.swidth	= Math.max(this.data.swidth, dimensions.width);
			this.data.sheight	= Math.ceil(this.data.sheight + dimensions.height);			
	}

	// Set root attributes
	svgInfo.svg.root().attr(rootAttr);
	
	// Register the single SVG with the sprite
	var data					= svgInfo.toSVG(true, this._svgTweaks);
	this.sprite.push(data);
	
	// Register the XML and DOCTYPE declarations of the first sprite image
	if (this.sprite.length == 1) {
		this.xmldecl			= svgInfo.xmldecl;
		this.doctype			= svgInfo.doctype;
	}
	
	// Determine the CSS class name and pseudo class
	var cls						= svgID.split(this._options.pseudo);
	
	// Register the SVG parameters
	this.data.svg.push({
		name					: svgID,
		height					: dimensions.height - 2 * this._options.padding,
		width					: dimensions.width - 2 * this._options.padding,
		last					: isLastSVG,
		selector				: (svgPseudo || (cls.length > 1)) ? [{
			expression			: this._options.prefix + '-' + cls.join(':'),
			raw					: this._options.prefix + '-' + cls.join(':'),
			first				: true,
			last				: false
		}, {
			expression			: this._options.prefix + '-' + ((cls.length > 1) ? cls.join('\\:') : (cls[0] + '\\:regular')),
			raw					: this._options.prefix + '-' + ((cls.length > 1) ? cls.join(':') : (cls[0] + ':regular')),
			first				: false,
			last				: true
		}] : [{
			expression			: this._options.prefix + '-' + cls.join(':'),
			raw					: this._options.prefix + '-' + cls.join(':'),
			first				: true,
			last				: true
		}],
		positionX				: positionX,
		positionY				: positionY,
		position				: this._addUnit(positionX) + ' ' + this._addUnit(positionY),
		dimensions				: {
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
		},
		data					: data
	});
}

/**
 * Process a single SVG file
 * 
 * @param {String} id				SVG file ID
 * @param {String} ns				SVG file namespace prefix
 * @param {String} file				SVG file name
 * @param {Function} callback		Callback
 */
SVGSprite.prototype._processFile = function(id, ns, file, callback) {
	if (this._options.verbose > 1) {
		console.log(util.format('·· Processing SVG image "%s"', path.basename(file)));
	}
	
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
				var svgImageSVG							= svgInfo.toSVG(false, that._svgTweaks),
				svgImagePath							= path.join(that._options.outputDir, that._options.spritedir, id + '.svg');
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
			svgInfo.namespaceIDs(ns, _callback);
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
	
	// Optionally add an XML declaration
	if (!(this._svgTweaks & 1)) {
		svg.push(this.xmldecl || '<?xml version="1.0" encoding="UTF-8"?>');
	}
	
	// Optionally add a DOCTYPE declaration
	if (!(this._svgTweaks & 2) && this.doctype) {
		svg.push(this.doctype);
	}
	
	svg.push('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + this.data.swidth + '" height="' + this.data.sheight + '" viewBox="0 0 ' + this.data.swidth + ' ' + this.data.sheight + '">');
	Array.prototype.push.apply(svg, this.sprite);
	svg.push('</svg>');
	return svg.join('');
}

/**
 * Return a coordinate (number) with 'px' appended if non-zero
 * 
 * @param {Number} number 			Coordinate (number)
 * @return {String} 				Coordinate (number) with unit appended
 */
SVGSprite.prototype._addUnit = function(number) {
	return number + ((number != 0) ? 'px' : '');
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
		// Asynchronously create the SVG sprite
		new SVGSprite(inputDir, outputDir, options).createSprite(callback);
	} catch(error) {
		return error;
	}
}

/**
 * Create template rendering tasks (for asynchronous / parallel Mustache template rendering)
 * 
 * @param {String} outputDir		Main output directory
 * @param {Object} conf				Rendering configuration
 * @param {String} extension		Destination file extension
 * @param {String} basedir			Working directory
 * @return {Object}					Rendering template and destination file
 */
function renderConfig(outputDir, conf, extension, basedir) {
	var template			= ((conf.constructor === Object) && ('template' in conf)) ? path.resolve(conf.template) : path.resolve(basedir || __dirname, '../tmpl/sprite.' + extension),
	dest					= null;
	
	// If the specified template exists
	try {
		if (fs.statSync(template).isFile()) {
			dest			= ((conf.constructor === Object) ? (('dest' in conf) ? conf.dest : true) : conf) || null;
			
			// If no destination file or directory is given: Use the default
			if (dest === true) {
				dest		= path.join(outputDir, path.basename(template));
				
			// Else: Resolve the custom destination
			} else if (dest) {
				dest		= '' + dest;
				var isDir	= !dest.length || (dest.lastIndexOf(path.sep) == (dest.length - 1));
				dest		= path.resolve(outputDir, dest);
				if (isDir) {
					dest	= path.join(dest, path.basename(template));
				}
				if (!path.extname(dest).length) {
					dest	+= path.extname(template);
				}
			}
		}
	} catch(e) {}
	
	return {template: template, dest: dest};
}

/**
 * Create and return a template rendering task
 * 
 * @param {String} template			Template file
 * @param {String} dest				Destination file
 * @param {Object} data				Rendering data
 * @param {Object} result			Rendering results
 * @return {Function}				Rendering task
 */
function renderTask(template, dest, data, result) {
	return function(_callback) {
		var dir							= path.dirname(dest);
		
		// Create the output directory
		mkdirp(dir, 511, function(error) {
			if (error && (typeof(error) == 'object') && ('message' in error)) {
				error					= new Error(error.message);
				error.errno				= 1391854708;
				_callback(error);
				return;
			}
			
			result.files[dest]			= 0;
			try { fs.truncateSync(dest); } catch(e) {}
			
			try {
				var out					= mustache.render(fs.readFileSync(template, 'utf-8'), data, {
					inline				: fs.readFileSync(path.resolve(__dirname, '../tmpl/sprite.inline.svg'), 'utf-8')
				});
				if (out.length) {
					fs.writeFileSync(dest, out);
					result.files[dest]	= out.length;
					++result.length;
				}
				_callback();
			} catch(e) {
				_callback(e);
			}
		});						
	}
}

/**
 * Convert number of bytes into human readable format
 *
 * @param {Number} bytes	 	Number of bytes to convert
 * @param {Number} precision 	Number of digits after the decimal separator
 * @return {String}
 */
function bytesToSize(bytes, precision) {  
	var kilobyte			= 1024,
	megabyte				= kilobyte * 1024,
	gigabyte				= megabyte * 1024,
	terabyte				= gigabyte * 1024;
   
	if ((bytes >= 0) && (bytes < kilobyte)) {
		return bytes + ' B';
 
	} else if ((bytes >= kilobyte) && (bytes < megabyte)) {
		return (bytes / kilobyte).toFixed(precision) + ' KB';
 
	} else if ((bytes >= megabyte) && (bytes < gigabyte)) {
		return (bytes / megabyte).toFixed(precision) + ' MB';
 
	} else if ((bytes >= gigabyte) && (bytes < terabyte)) {
		return (bytes / gigabyte).toFixed(precision) + ' GB';
 
	} else if (bytes >= terabyte) {
		return (bytes / terabyte).toFixed(precision) + ' TB';
 
	} else {
		return bytes + ' B';
	}
}
	
module.exports.createSprite				= createSprite;
module.exports.renderConfig				= renderConfig;
module.exports.renderTask				= renderTask;
