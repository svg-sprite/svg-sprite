The following shall shed some light on the rather elaborate (and thus maybe overwhelming) [README of svg-sprite](https://github.com/jkphl/svg-sprite) and demonstrate that it is neither complicated to use, nor that the config necessarily has to be huge. I admit, however, that it would be nice to have some practical tutorials or recipies of how to work with *svg-sprite*. I'll try my best to do something about this as soon as possible (or at least split up the README into more digestible sections). Hopefully the below does help a little bit in the meantime.

Let's start with some fundamentals:

### 1. *svg-sprite* is a low-level library
There were two main reasons for rewriting *svg-sprite* from scratch:

* The first generation featured exactly one type of sprite: CSS sprites for use as background images. But in the meantime, also other sprite flavours became popular and I wanted to support them as well (see 2).
* There has been [this request by Shane Osbourne](https://github.com/jkphl/svg-sprite/issues/21) to cut out all the file system access of the module in order to allow other projects to build on top of it, e.g. a Gulp plugin, and that sounded reasonable. So I did exactly this — with the side effect that reading in the source SVGs and writing the result files to disk (sprite, stylesheet etc.) is now up to the implementor.

### 2. A sprite is not a sprite

There are lots of different ways of how SVG sprites can be structured internally. In general, you may distinguish

* sprites for use as **background images** (CSS sprites as created by the «css» mode),
* sprites for use as **foreground images** («defs», «symbol» or «stack» mode) and
* sprites that work for both **background and foreground images** («view» mode).

Each of them has it's own pros an cons (and browser support), but regarding their creation they have a quite a lot in common, so why not have a single tool being capable of processing all of them? You will see that the configuration for the different types only differs in very little detail.

### 3. Diversity of workflows

Different workflows are different. *svg-sprite* aims to be very flexible (e.g. in regards of file formats) — while shipping with reasonable defaults at the same time. For instance, it supports the most popular stylesheet formats out of the box (CSS, Sass, LESS, Stylus) and you just need to «switch them on», but you can also easily enhance *svg-sprite* to create arbitrary additional formats. It aligns to your workflow, not the other way round.

# Usage

Working with *svg-sprite* will always look something like this:

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

This is the very same for **all types of sprites**. As you see, quite a lot has to do with file system access (reading and writing files from and to disk). In most cases you'll want to abstract that away and rather use *svg-sprite* via Grunt or Gulp for that very reason.

An equivalent **Grunt task** would look like this ([installataion see here](https://github.com/jkphl/grunt-svg-sprite#getting-started)):

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

An equivalent **Gulp task** would look like this ([installation see here](https://github.com/jkphl/gulp-svg-sprite#usage)):

```javascript
// svg-sprite Gulp task

gulp.src('assets/*.svg')
	.pipe(svgSprite(config))
	.pipe(gulp.dest('out'));
```

## Basic configuration

Look at the `config` argument used for instantiating the spriter in all three cases. This is what controls the sprite(s) being created (along with which secondary resources). For example, to create a **CSS sprite with a stylesheet in good ol' CSS** you will need the following minimum configuration:

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

A foreground image sprite using `<symbol>` elements and being `<use>`d in your HTML would be even simpler:

```javascript
// «symbol» sprite with CSS stylesheet resource

var config					= {
	mode					:
		symbol				: true		// Create a «symbol» sprite
	}
}
```

Finally, creating a `<defs>` sprite, `<symbol>` sprite and an SVG stack all at once wouldn't be more complicated as this:

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

As you see, the `mode` config option is the only one that is truly necessary to create a sprite. Omitting it wouldn't you get any (sprite) output. But still, you could use a `mode`-less run to just optimize and get back the source SVG files:

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


### Non-CSS sprite configuration («defs», «symbol» and «stack» mode)

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

### CSS sprite configuration («css» and «view» mode)

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

### Common options

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