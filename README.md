svg-sprite [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url]  [![Coverage Status][coveralls-image]][coveralls-url] [![Dependency Status][depstat-image]][depstat-url]
==========

is a low-level [Node.js](http://nodejs.org/) module that **reads in a bunch of [SVG](http://www.w3.org/TR/SVG/) files**, optimizes them and creates **SVG sprites** in several variants:

1. Traditional **[CSS sprites](http://en.wikipedia.org/wiki/Sprite_(computer_graphics)#Sprites_by_CSS) ** for use as background images,
2. CSS sprites with **pre-defined SVG `<view>` elements**, useful for foreground images as well,
3. inline sprites using the **`<defs>` element**,
4. inline sprites using the **`<symbol>` element**
5. and finally **SVG stacks**.

*svg-sprite* comes with a set of [Mustache](http://mustache.github.io/) templates for creating stylesheets in good ol' [CSS](http://www.w3.org/Style/CSS/) or one of the supported pre-processor formats ([Sass](http://sass-lang.com/), [Less](http://lesscss.org/) and [Stylus](http://learnboost.github.io/stylus/)). Tweaking them or even adding your **custom format** is as simple as switching on the creation of an **HTML example document** along with your sprite.

There are **[Grunt](https:// github.com/jkphl/grunt-svg-sprite)** and **[Gulp](https://github.com/jkphl/gulp-svg-sprite)** wrappers available for *svg-sprite*, so if you aren't exactly out for a low-level library, you should rather have a look at them. *svg-sprite* is also the foundation of my **[iconizr](https://github.com/jkphl/node-iconizr)** project, which serves high-quality, SVG based **CSS icon kits with PNG fallbacks**.

Table of contents
-----------------
* [Installation](#installation)
* [Getting started](#getting-started)
	* [General usage](#general-usage)
	* [Configuration basics](#configuration-basics)
* [Advanced techniques](#advanced-techniques)
* [Command line usage](#command-line-usage)
* [Known problems / To-do](#known-problems--to-do)
* [Changelog](changelog.md)
* [Legal](#legal)

Installation
------------

To install *svg-sprite* globally, run

```bash
npm install svg-sprite -g
```

on the command line.

Getting started
---------------

Creating a sprite with *svg-sprite* typically follows these steps:

1. You [create an instance of the SVGSpriter](docs/api.md#svgspriter-config-) class, passing it a main configuration object.
2. You [register a couple of SVG source files](docs/api.md#svgspriteraddfile--name-svg-) for processing.
3. You [trigger the compilation process](docs/api.md#svgspritercompile-config--callback-) and receive the generated files (sprite, CSS, example documents etc.) .

The procedure is the very same for all supported sprite variants. Being a low-level library (and in favour of [Node.js streams](https://github.com/substack/stream-handbook) support), *svg-sprite* doesn't  take on the part of accessing the file system (i.e. reading the source files from and writing the results to disk).

### General usage

```javascript
// Create spriter instance (see below for `config` examples)
var spriter       = new SVGSpriter(config);

// Add SVG source files — the manual way ...
spriter.add('assets/svg-1.svg', null, fs.readFileSync('assets/svg-1.svg', {encoding: 'utf-8'}));
spriter.add('assets/svg-2.svg', null, fs.readFileSync('assets/svg-2.svg', {encoding: 'utf-8'}));
	/* ... */

// Compile sprite
spriter.compile(function(error, result) {
	/* ... Write `result` files to disk or do whatever with them ... */
});
```

In most cases, however, you wouldn't want to bother about that file system stuff and use one of the available *svg-sprite* wrappers instead. The same example would look like this as a **[Grunt task]([installation](https://github.com/jkphl/grunt-svg-sprite#getting-started)**:

```javascript
// svg-sprite Grunt task

grunt.initConfig({
	svg_sprite				: {
		minimal				: {
			src				: ['assets/**/*.svg'],
			dest			: 'out',
			options			: config
		},
	},
});
```

... and like this as a **[Gulp task]((https://github.com/jkphl/gulp-svg-sprite#usage)**:

```javascript
// svg-sprite Gulp task

gulp.src('assets/*.svg')
	.pipe(svgSprite(config))
	.pipe(gulp.dest('out'));
```

### Configuration basics

In the examples above, the `config` variable is in control of *svg-sprite*'s outcome. To create a single **foreground image sprite with `<symbol>` elements** (for being `<use>`d in your HTML), this little piece of configuration would suffice:

```javascript
// «symbol» sprite with CSS stylesheet resource

var config					= {
	mode					:
		symbol				: true		// Create a «symbol» sprite
	}
}
```

To create a traditional **CSS sprite** along with a **plain CSS stylesheet**:

```javascript
// «css» sprite with CSS stylesheet resource

var config					= {
	mode					:
		css					: {			// Create a «css» sprite
			render			: {
				css			: true		// Render a CSS stylesheet
			}
		}
	}
}
```

Even creating a **`<defs>` sprite, `<symbol>` sprite and an SVG stack all at once** wouldn't be much more complicated:

```javascript
// «defs», «symbol» and «stack» sprites in parallel

var config					= {
	mode					:
		defs				: true,
		symbol				: true,
		stack				: true
	}
}
```

As you see, the `mode` config option is the only one that is truly necessary to create a sprite. Omitting it wouldn't get you any (sprite) output. But still, you could use a `mode`-less run to just optimize and get back the source SVG files:

```javascript
// Just optimize source SVG files, create no sprite

var config					= {
	shape					:
		dest				: 'path/to/out/dir'
	}
}
```
> **NOTE ABOUT THE `dest` OPTION(S)**
> 
> "Didn't you say that *svg-sprite* doesn't access the file system? So why do you need an output directory?" — Well, good point. *svg-sprite* uses [vinyl](https://github.com/wearefractal/vinyl) file objects to pass along virtual resources and to specify where they **are intended to be located**. This is especially important for relative file contexts (e.g. the path to the SVG sprite from the perspective of a referencing CSS stylesheet).


#### Non-CSS sprite configuration («defs», «symbol» and «stack» mode)

The configuration for the three non-CSS sprite types is (almost) identical. Here's a full blown example with all options specified, showing the default values (for a «defs» sprite). **They're all optional!**.

```javascript
// Full blown non-CSS sprite example

var config					= {
	mode					: {
		defs				: {							// Create «defs» sprite; Set to TRUE to use all default values
			dest			: 'defs',					// Output directory (relative to main `defs`) 
			sprite			: 'svg/sprite.defs.svg',	// Sprite path and file name (relative to `dest`)
			inline			: false,					// Prepare sprite for HTML embedding (only «defs» and «symbol»)
			example			: false						// Render HTML example document
		}
	}
}
```

In fact, there are two more options which are not directly sprite generation related (`mode.defs.prefix` and `mode.defs.dimensions`; please see [README](https://github.com/jkphl/svg-sprite#d3-defs-mode)) and `mode.defs.example` may have two suboptions (it's a [rendering template](https://github.com/jkphl/svg-sprite#e-rendering-configurations)), but I'll skip them here for brevity.

#### CSS sprite configuration («css» and «view» mode)

The configuration for CSS sprites is a little more verbose as you may specify some stylesheet related options here. Switching between «css» and «view» mode is as easy as changing the property name.

```javascript
// Full blown CSS sprite example

var config					= {
	mode					: {
		css					: {							// Create «css» sprite; Set to 'view' to switch
			dest			: 'defs',					// Output directory (relative to main `defs`) 
			layout			: 'packed',					// Sprite layout (horizontal, vertical, diagonal, packed)
			common			: null,						// Common CSS class name for all shapes, e.g. 'icon'
			prefix			: 'svg-%s',					// Prefix/template for CSS shape class names
			dimensions		: '-dims',					// Suffix/template for CSS shape dimension class names
			sprite			: 'svg/sprite.css.svg',		// Sprite path and file name (relative to `dest`)
			bust			: true,						// Add cache busting hash to sprite file name
			render			: {
				css			: false,					// Render CSS stylesheet
				scss		: false,					// Render Sass (scss) stylesheet
				less		: false,					// Render LESS stylesheet
				styl		: false						// Render Stylus
			}
			example			: false						// Render HTML example document
		}
	}
}
```

Again, `mode.css.example` and the stylesheet format options (`mode.css.render.css` & co) are [rendering templates](https://github.com/jkphl/svg-sprite#e-rendering-configurations) and may have up to two suboptions each. Setting them to `TRUE` just uses the defaults.

#### Common options

Finally, there are some options that are common to all output modes. Here's a full blown example showing their defaults. Again, **they're all optional!**

```javascript
// Full blown common options example

var config					= {
	dest					: '.',						// Main output directory
	log						: null,						// Logging verbosity (default: no logging)
	shape					: {							// All shape related options
		id					: {							// All shape ID related options
			separator		: '--',						// Separator for directory name traversal
			generator		: function() { /*...*/ },	// Shape ID generator callback
			pseudo			: '~'						// File name separator for shape states (e.g. ':hover')
		},
		dimension			: {							// Dimension related options
			maxWidth		: 2000,						// Max. shape width
			maxHeight		: 2000,						// Max. shape height
			precision		: 2							// Floating point precision
		},
		spacing				: {							// Spacing related options
			padding			: 0,						// Padding around all shapes
			box				: 'content'					// Padding strategy (similar to CSS `box-sizing`)
		},
		meta				: null,						// Path to YAML file with meta / accessibility data
		align				: null,						// Path to YAML file with extended alignment data
		dest				: null						// Output directory for optimized intermediate SVG shapes
	},
	transform				: ['svgo'],					// List of transformations / optimizations
	svg						: {							// General options for all SVG output
		xmlDeclaration		: true,						// Add XML declaration to SVG sprite
		doctypeDeclaration	: true,						// Add DOCTYPE declaration to SVG sprite
		namespaceIDs		: true,						// Add namespace token to all IDs in SVG shapes
	}
}
```
## Advanced techniques


Known problems / To-do
----------------------

* SVGO does not minify element IDs when there are `<style>` or `<script>` elements contained in the file

Legal
-----
Copyright © 2015 Joschi Kuphal <joschi@kuphal.net> / [@jkphl](https://twitter.com/jkphl)

*svg-sprite* is licensed under the terms of the [MIT license](LICENSE.txt).

The contained example SVG icons are part of the [Tango Icon Library](http://tango.freedesktop.org/Tango_Icon_Library) and belong to the Public Domain.


[npm-url]: https://npmjs.org/package/svg-sprite
[npm-image]: https://badge.fury.io/js/svg-sprite.png

[travis-url]: http://travis-ci.org/jkphl/svg-sprite
[travis-image]: https://secure.travis-ci.org/jkphl/svg-sprite.png

[coveralls-url]: https://coveralls.io/r/jkphl/svg-sprite
[coveralls-image]: https://img.shields.io/coveralls/jkphl/svg-sprite.svg

[depstat-url]: https://david-dm.org/jkphl/svg-sprite
[depstat-image]: https://david-dm.org/jkphl/svg-sprite.svg