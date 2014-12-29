svg-sprite [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url]  [![Coverage Status][coveralls-image]][coveralls-url] [![Dependency Status][depstat-image]][depstat-url]
==========

is a [Node.js](http://nodejs.org/) module that **reads in a bunch of [SVG](http://www.w3.org/TR/SVG/) files**, optimizes them and creates **SVG sprites** in various flavours:

1. Traditional **CSS sprites** for use with background images ([configuration](#d1-css-mode))
2. CSS sprites with **pre-defined SVG views**, suitable for foreground images as well ([configuration](#d2-view-mode))
3. Inline sprites using the **`<defs>` element** ([configuration](#d3-defs-mode))
4. Inline sprites using the **`<symbol>` element** ([configuration](#d4-symbol-mode))
5. **SVG stacks** ([configuration](#d5-stack-mode))

For the generation of [CSS sprite](http://en.wikipedia.org/wiki/Sprite_(computer_graphics)#Sprites_by_CSS) stylesheet resources (flavours 1 & 2), *svg-sprite* comes with pre-defined [Mustache](http://mustache.github.io/) templates in four different formats:

* [CSS](http://www.w3.org/Style/CSS/)
* [Sass](http://sass-lang.com/)
* [Less](http://lesscss.org/)
* [Stylus](http://learnboost.github.io/stylus/)

Mustache templates are also used for rendering optional **HTML example documents** for each of the sprite variants. Tailoring them to your needs — and even adding **custom output formats** — is a breeze.

About
-----

The [original svg-sprite](https://github.com/jkphl/svg-sprite/tree/bbd051e940e7b6373ed56277251a8affb03b1c10) was my first-ever Node.js module and featured CSS sprites only. The `1.0` release is rewritten from scratch and introduces a bunch of new features like **less dependencies** (for improved Mac OS and Windows compatibility), support for **inline sprite formats** and the **removal of file-system access** so that other libraries can build on top of it more easily. Derived libraries include:

* [grunt-svg-sprite](https://github.com/jkphl/grunt-svg-sprite)
* [svg-sprite](https://github.com/jkphl/svg-sprite)
* [svg-sprite-data](https://github.com/shakyShane/svg-sprite-data) by [Shane Osbourne](https://github.com/shakyShane) (based on the original svg-sprite)

Furthermore, I built **_iconizr_** around *svg-sprite*, which exists in a couple of flavours ([Node.js module](https://github.com/jkphl/node-iconizr), [Grunt plugin](https://github.com/jkphl/grunt-iconizr), [PHP version](https://github.com/jkphl/iconizr) and [online service](http://iconizr.com)). At the time of this writing, I'm working on an all-over remake of *iconizr* as well, so stay tuned.


Installation & usage
--------------------

To install *svg-sprite*, run

```bash
npm install svg-sprite -g
```

on the command line.


### Command line usage

You may use *svg-sprite* as a command line tool. Type `svg-sprite --help` to get all the available options:

```bash
Usage: svg-sprite [options] files

Examples:
  svg-sprite --css --css-render-css --css-example --dest=out assets/*.svg    Create a CSS sprite of the given SVG files including example document to the sub directory "out"
  svg-sprite -cD out --ccss --cx assets/*.svg                                Same as above
  svg-sprite -cD out --cscss -p 10 assets/*.svg                              Same as above, but render Sass instead of CSS and add 10px padding around all shapes


Options:
  --version                    Show version number
  --help                       Display this help information
  -D, --dest                   Main output directory (base path)                                     [default: "."]
  -l, --log                    Logging verbosity ("info", "verbose" or "debug")
  --shape-id-separator         Separator for traversing a directory structure into a shape ID        [default: "--"]
  --shape-id-generator         ID generation callback [not available via command line]               [default: null]
  --shape-id-pseudo            Separator for CSS pseudo classes                                      [default: "~"]
  -w, --shape-dim-width        Maximum shape width in pixels                                         [default: 2000]
  -h, --shape-dim-height       Maximum shape height in pixels                                        [default: 2000]
  --shape-dim-precision        Precision (decimal places) for dimension calculations                 [default: 2]
  -p, --shape-spacing-padding  Padding around shape (up to 4 x comma-separated)                      [default: "0,0,0,0"]
  -b, --shape-spacing-box      Box sizing strategy ("content" or "padding")                          [default: "content"]
  -m, --shape-meta             Path to YAML file with meta information
  -i, --shape-dest             Path to output directory for intermediate SVG files
  --transform                  Comma-separated list of predefined transformers (see docs)            [default: "svgo"]
  --transform-*                External JSON config files for named transformers
  --svg-xmldecl                Whether to include an XML declaration in SVG files                    [default: true]
  --svg-doctype                Whether to include a doctype declaration in SVG files                 [default: true]
  -c, --css                    Activates the «css» mode                                              [default: false]
  --css-dest                   Mode specific output directory                                        [default: "css"]
  --cl, --css-layout           Sprite layout ("vertical"/"horizontal"/"diagonal"/"packed")           [default: "packed"]
  --css-common                 Common CSS rule selector for all shapes                               [default: null]
  --css-prefix                 CSS selector prefix for all shapes (including placeholders)           [default: "svg-%s"]
  --css-dimensions             CSS selector suffix for shape dimension rules (TRUE for inline)       [default: "-dims"]
  --cs, --css-sprite           Sprite path and filename (relative to --mode-css-dest)                [default: "svg/sprite.css.svg"]
  --css-bust                   Enable cache busting                                                  [default: true]
  --ccss, --css-render-css     Whether to render a CSS stylesheet                                    [default: false]
  --css-render-css-template    CSS stylesheet Mustache template (relative to svg-sprite basedir)     [default: "tmpl/css/sprite.css"]
  --css-render-css-dest        CSS stylesheet destination (relative to the --mode-css-dest)          [default: "sprite.css"]
  --cscss, --css-render-scss   Whether to render a Sass stylesheet (SCSS)                            [default: false]
  --css-render-scss-template   Sass stylesheet Mustache template (relative to svg-sprite basedir)    [default: "tmpl/css/sprite.scss"]
  --css-render-scss-dest       Sass stylesheet destination (relative to the --mode-css-dest)         [default: "sprite.scss"]
  --cless, --css-render-less   Whether to render a LESS stylesheet                                   [default: false]
  --css-render-less-template   LESS stylesheet Mustache template (relative to svg-sprite basedir)    [default: "tmpl/css/sprite.less"]
  --css-render-less-dest       LESS stylesheet destination (relative to the --mode-css-dest)         [default: "sprite.less"]
  --cstyl, --css-render-styl   Whether to render a Stylus stylesheet                                 [default: false]
  --css-render-styl-template   Stylus stylesheet Mustache template (relative to svg-sprite basedir)  [default: "tmpl/css/sprite.styl"]
  --css-render-styl-dest       styl stylesheet destination (relative to the --mode-css-dest)         [default: "sprite.styl"]
  --css-render-*               Custom output renderings
  --css-render-*-template      Custom output Mustache template (relative to svg-sprite basedir)
  --css-render-*-dest          Custom output destination (relative to the --mode-css-dest)
  --cx, --css-example          Whether to render an example HTML document                            [default: false]
  --css-example-template       HTML document Mustache template (relative to svg-sprite basedir)      [default: "tmpl/css/sprite.html"]
  --css-example-dest           HTML document destination (relative to the --mode-css-dest)           [default: "sprite.css.html"]
  -v, --view                   Activates the «view» mode                                             [default: false]
  --view-dest                  Mode specific output directory                                        [default: "view"]
  --vl, --view-layout          Sprite layout ("vertical"/"horizontal"/"diagonal"/"packed")           [default: "packed"]
  --view-common                Common CSS rule selector for all shapes                               [default: null]
  --view-prefix                CSS selector prefix for all shapes (including placeholders)           [default: "svg-%s"]
  --view-dimensions            CSS selector suffix for shape dimension rules (TRUE for inline)       [default: "-dims"]
  --vs, --view-sprite          Sprite path and filename (relative to --mode-css-dest)                [default: "svg/sprite.css.svg"]
  --view-bust                  Enable cache busting                                                  [default: true]
  --vcss, --view-render-css    Whether to render a CSS stylesheet                                    [default: false]
  --view-render-css-template   CSS stylesheet Mustache template (relative to svg-sprite basedir)     [default: "tmpl/css/sprite.css"]
  --view-render-css-dest       CSS stylesheet destination (relative to the --mode-css-dest)          [default: "sprite.css"]
  --vscss, --view-render-scss  Whether to render a Sass stylesheet (SCSS)                            [default: false]
  --view-render-scss-template  Sass stylesheet Mustache template (relative to svg-sprite basedir)    [default: "tmpl/css/sprite.scss"]
  --view-render-scss-dest      Sass stylesheet destination (relative to the --mode-css-dest)         [default: "sprite.scss"]
  --vless, --view-render-less  Whether to render a LESS stylesheet                                   [default: false]
  --view-render-less-template  LESS stylesheet Mustache template (relative to svg-sprite basedir)    [default: "tmpl/css/sprite.less"]
  --view-render-less-dest      LESS stylesheet destination (relative to the --mode-css-dest)         [default: "sprite.less"]
  --vstyl, --view-render-styl  Whether to render a Stylus stylesheet                                 [default: false]
  --view-render-styl-template  Stylus stylesheet Mustache template (relative to svg-sprite basedir)  [default: "tmpl/css/sprite.styl"]
  --view-render-styl-dest      styl stylesheet destination (relative to the --mode-css-dest)         [default: "sprite.styl"]
  --view-render-*              Custom output renderings
  --view-render-*-template     Custom output Mustache template (relative to svg-sprite basedir)
  --view-render-*-dest         Custom output destination (relative to the --mode-css-dest)
  --vx, --view-example         Whether to render an example HTML document                            [default: false]
  --view-example-template      HTML document Mustache template (relative to svg-sprite basedir)      [default: "tmpl/view/sprite.html"]
  --view-example-dest          HTML document destination (relative to the --mode-css-dest)           [default: "sprite.view.html"]
  -d, --defs                   Activates the «defs» mode                                             [default: false]
  --defs-dest                  Mode specific output directory                                        [default: "defs"]
  --defs-prefix                CSS selector prefix for all shapes (including placeholders)           [default: "svg-%s"]
  --defs-dimensions            CSS selector suffix for shape dimension rules (TRUE for inline)       [default: "-dims"]
  --ds, --defs-sprite          Sprite path and filename (relative to --mode-css-dest)                [default: "svg/sprite.css.svg"]
  --di, --defs-inline          Create sprite variant suitable for inline embedding                   [default: false]
  --dx, --defs-example         Whether to render an example HTML document                            [default: false]
  --defs-example-template      HTML document Mustache template (relative to svg-sprite basedir)      [default: "tmpl/defs/sprite.html"]
  --defs-example-dest          HTML document destination (relative to the --mode-css-dest)           [default: "sprite.defs.html"]
  -s, --symbol                 Activates the «symbol» mode                                           [default: false]
  --symbol-dest                Mode specific output directory                                        [default: "symbol"]
  --symbol-prefix              CSS selector prefix for all shapes (including placeholders)           [default: "svg-%s"]
  --symbol-dimensions          CSS selector suffix for shape dimension rules (TRUE for inline)       [default: "-dims"]
  --ss, --symbol-sprite        Sprite path and filename (relative to --mode-css-dest)                [default: "svg/sprite.css.svg"]
  --si, --symbol-inline        Create sprite variant suitable for inline embedding                   [default: false]
  --sx, --symbol-example       Whether to render an example HTML document                            [default: false]
  --symbol-example-template    HTML document Mustache template (relative to svg-sprite basedir)      [default: "tmpl/symbol/sprite.html"]
  --symbol-example-dest        HTML document destination (relative to the --mode-css-dest)           [default: "sprite.symbol.html"]
  -S, --stack                  Activates the «stack» mode                                            [default: false]
  --stack-dest                 Mode specific output directory                                        [default: "stack"]
  --stack-prefix               CSS selector prefix for all shapes (including placeholders)           [default: "svg-%s"]
  --stack-dimensions           CSS selector suffix for shape dimension rules (TRUE for inline)       [default: "-dims"]
  --Ss, --stack-sprite         Sprite path and filename (relative to --mode-css-dest)                [default: "svg/sprite.css.svg"]
  --Sx, --stack-example        Whether to render an example HTML document                            [default: false]
  --stack-example-template     HTML document Mustache template (relative to svg-sprite basedir)      [default: "tmpl/stack/sprite.html"]
  --stack-example-dest         HTML document destination (relative to the --mode-css-dest)           [default: "sprite.stack.html"]
  --variables                  Path to external JSON file with Mustache variable definitions
```

#### Examples

Both the following commands are doing the same (with the second one using the shorter argument syntax) in creating a CSS sprite of the given SVG files. The sprite along with an accompanying CSS stylesheet are written to the subdirectory `out`. 

```bash
$ svg-sprite --css --css-render-css --css-example --dest=out assets/*.svg
$ svg-sprite -cD out --ccss --cx assets/*.svg
```

The next one renders as Sass stylesheet instead of CSS and adds a 10px padding around all shapes in the sprite:

```bash
$ svg-sprite -cD out --cscss -p 10 assets/*.svg
```

### API

Creating a sprite with *svg-sprite* typically follows these steps:

1. You [create an instance of the SVGSpriter](#svgspriter-config-) class, passing it a main configuration object.
2. You [register a couple of SVG files](#svgspriteraddfile--name-svg-) for processing.
3. You [trigger the compilation process](#svgspritercompile-config--callback-) and receive the generated files (sprite, CSS, example documents etc.) .

This may look something like this:

```javascript
'use strict';

var SVGSpriter				= require('svg-sprite'),
mkdirp						= require('mkdirp'),
path						= require('path'),
fs							= require('fs'),

// 1. Create and configure a spriter instance
// ====================================================================
spriter						= new SVGSpriter({
	dest					: 'out',		// Destination directory
	mode					:
		css					: {				// Create a CSS sprite
			render			: {
				css			: true			// Render a CSS stylesheet
			}
		}
	}
});

// 2. Add some SVG files to process
// ====================================================================
spriter.add(
	path.resolve('assets/example-1.svg'),
	'example-1.svg',
	fs.readFileSync('assets/example-1.svg', {encoding: 'utf-8'})
);

	/* ... */

spriter.add(
	path.resolve('assets/example-x.svg'),
	'example-x.svg',
	fs.readFileSync('assets/example-x.svg', {encoding: 'utf-8'})
);

// 3. Trigger the (asynchronous) compilation process
// ====================================================================
spriter.compile(function(error, result, data){

	// Run through all files that have been created for the `css` mode
	for (var type in result.css) {
	
		// Recursively create directories as needed
		mkdirp.sync(path.dirname(result.css[type].path));
		
		// Write the generated resource to disk
		fs.writeFileSync(result.css[type].path, result.css[type].contents);
	}
});
```

**NOTICE**: *svg-sprite* doesn't write any files to disk. It's up to you to do so (or pass the files on to some other process).

#### SVGSpriter([ config ])

**Constructor** — This is the only method exported by the *svg-sprite*, so it's always your entry point. Use it to create an instance of the spriter.

##### Arguments

1. **config** `{Object}` *(default: `{}`)* — [Main configuration](#configuration) for the spriting process. As all configuration properties are optional, you may provide an empty object here or omit the argument altogether (no output files will be created then, but the added SVG files will be optimized). The `mode` configuration properties may also be specified when calling the `.compile()` method (see below). 

#### SVGSpriter.add(file [, name, svg ])

**Registration of an SVG file** — Prior to compiliation, you'll need to register one or more SVG files for processing, obviously. As *svg-sprite* doesn't read the files from disk itself, you'll have to pass both the path and the file contents explicitly. Alternatively, you may pass a [vinyl](https://github.com/wearefractal/vinyl) file object as the first argument to `.add()`, which comes in handy when piping resources from one process to another. Please [see below](#example-using-glob-and-vinyl) for an example.

It is important to know that the spriter **optimizes the SVG files as soon as you register them**, not just when you [compile your sprite](#svgspritercompile-config--callback-). This way, it is possibly to call the `.compile()` method more than once (e.g. giving different render configurations) without unnecessarily repeating the optimization step.

##### Arguments

1. **file** `{String|File}` — Absolute path to the SVG file or a [vinyl](https://github.com/wearefractal/vinyl) file object carrying all the necessary values (the following arguments are ignored then).
2. **name** `{String}` *(ignored with vinyl file)* — The "local" file path part, possibly including subdirectories which will get traversed to CSS selectors using the `shape.id.separator` configuration option ([see below](#a-svg-shape-configuration)). You will want to pay attention to this when recursively adding whole directories of SVG files (e.g. via [glob](#example-using-glob-and-vinyl)). When `name` is empty, *svg-sprite* will use the basename of the `file` argument. As an example, setting this to `deeply/nested/asset.svg` while giving `/path/to/my/deeply/nested/asset.svg` for `file` will translate to the CSS selector `deeply--nested--asset`.
3. **svg** `{String}` *(ignored with vinyl file)*: SVG file content.

##### Example using [glob](https://github.com/isaacs/node-glob) and [vinyl](https://github.com/wearefractal/vinyl)

```javascript
'use strict';

var SVGSpriter				= require('svg-sprite'),
mkdirp						= require('mkdirp'),
path						= require('path'),
fs							= require('fs'),
File						= require('vinyl'),
glob						= require('glob'),
spriter						= new SVGSpriter({
	dest					: 'out',
	mode					:
		css					: {
			render			: {
				css			: true
			}
		}
	}
}),
cwd							: path.resolve('assets');

// Find SVG files recursively via `glob`
glob.glob('**/*.svg', {cwd: cwd}, function(err, files) {
	files.forEach(function(file){
	
		// Create and add a vinyl file instance for each SVG
		spriter.add(new File({
			path: path.join(cwd, file),							// Absolute path to the SVG file
			base: cwd,											// Base path (see `name` argument)
			contents: fs.readFileSync(path.join(cwd, file))		// SVG file contents
		}););
	})
	
	spriter.compile(function(error, result, data){
		for (var type in result.css) {
			mkdirp.sync(path.dirname(result.css[type].path));
			fs.writeFileSync(result.css[type].path, result.css[type].contents);
		}
	});
});
```

#### SVGSpriter.compile([ config ,] callback )

**Sprite compilation** — Trigger an asynchronous sprite compilation process with this method. You may pass in an optional [output mode configuration](#d-output-mode-configuration) object as the first argument in order to set the output parameters for that very run. If you omit the config object, the spriter will use the `mode` component of the [main configuration](#configuration) which you previously passed to the [constructor](#svgspriter-config-). You may call `.compile()` multiple times, allowing for several different sprites being generated in one go. For each run, a callback will be triggered, giving you access to the resources that were generated.

##### Arguments

1. **config** `{Object}` *(optional)* — Configuration object setting the [output mode parameters](#d-output-mode-configuration) for the single compilation run. If omitted, the `mode` component of the [main configuration](#configuration) will be used.
2. **callback** `{Function}` — Callback triggered when the compilation has finished, getting passed in three arguments:
	* **error** `{Error}` — Error message in case the compilation has failed.
	* **result** `{Object}` — Directory of generated resources ([see below](#compilation-example))
	* **data** `{Object}` — Data passed to Mustache for rendering the resources (see [sprite & shape variables](#f1-sprite--shape-variables) for details)

##### Compilation example

Depending on the particular mode and render configuration, quite a lot of resources might be generated during a single compilation run. To understand the way *svg-sprite* returns these resources, please have a look at the following example: 

```javascript
spriter.compile({
		css					: {
			render			: {
				scss		: true
			},
			example			: true
		}
	},
	function(error, result, data){
	    console.log(result);
	}
);
```

The spriter is instructed to create a CSS sprite along with the accompanying stylesheet resource in Sass format and an example HTML document demonstrating the use of the sprite. The output will look something like this (shortened for brevity):

```javascript
{
	css						: {
		sprite				: <File "css/svg/sprite.css.svg" <Buffer 3c 3f 78 ...>>,
     	scss				: <File "css/sprite.scss" <Buffer 2e 73 76 ...>>,
     	example				: <File "css/sprite.css.html" <Buffer 3c 21 44 ...>>
	}
}
```

For each configured output mode (`css` in the example), the `result` object holds an item containing the resources generated for this particular mode. There is always a `sprite` resource (obviously) and possibly an `example` resource for the demo HTML document (if configured). For the [css](#d1-css-mode) and [view](#d2-view-mode) output modes, there are additional items named after the configured [rendering configurations](#e-rendering-configurations) (`scss` in the example).

Please note that the resources are always returned as [vinyl](https://github.com/wearefractal/vinyl) files. Have a look above for an [example of how to write these files to disk](#example-using-glob-and-vinyl).  

#### SVGSpriter.getShapes( dest , callback )

**Accessing the intermediate SVG resources** — Sometimes you may want to access the single transformed / optimized SVG files that *svg-sprite* produces as an intermediate step. Depending on the [configured transformations](#b-transform-configuration) (e.g. SVG optimization with [SVGO](https://github.com/svg/svgo)), *svg-sprite* will need some time to transform the files you register to the spriter. Therefore, access to the shapes is given in an asynchronous way to ensure that all transformations have been finished.

##### Arguments

1. **dest** `{String}` — Base directory for the SVG files in case the will be written to disk.
2. **callback** `{Function}`: Callback triggered when the shapes are available, getting passed in two arguments:
	* **error** `{Error}` — Error message in case the shape access has failed.
	* **result** `{Array}` — List of [vinyl](https://github.com/wearefractal/vinyl) files for the intermediate SVGs.  

##### Shape access example

```javascript
var mkdirp					= require('mkdirp'),
path						= require('path'),
fs							= require('fs');

spriter.getShapes(path.resolve('tmp/svg'), function(error, result) {
	result.forEach(function(file){
		mkdirp.sync(path.dirname(file.path));
		fs.writeFileSync(file.path, file.contents);
	});
});
```

Configuration
-------------

The *svg-sprite* **main configuration** is provided to the [constructor](#svgspriter-config-) as an `Object` with the following structure:

```javascript
{
	dest			: <String>,				// Main output directory
	log  			: <String∣Logger>,		// Logging verbosity or custom logger
	shape			: <Object>,				// SVG shape configuration
	transform		: <Array>,				// SVG transformations
	svg				: <Object>,				// Common SVG options
	mode			: <Object>,				// Output mode configuration
	variables		: <Object>				// Common templating variables
}
```

All of the items are optional, so in fact an empty object `{}` is a valid configuration for *svg-sprite*. There are two scalar values on the top-level:

Property                 | Type            | Default       | Description                                |
------------------------ | --------------- | ------------- | ------------------------------------------ |
`dest`                   | String          | `.`           | Main output directory which is used for resolving relative paths. Although *svg-sprite* doesn't write any files itself, it does need this setting in order to correctly layout the resulting file and directory structures. |
`log`                    | String∣Logger   |               | *svg-sprite* uses [winston](https://github.com/flatiron/winston) for logging, but output is turned off by default. To activate and use the pre-configured console logger, you need to pass the desired log level (`'info'`, `'verbose'` or `'debug'`). Alternatively, you can pass your own custom `winston.Logger` instance (which needs to handle at least these three log levels). |

### A. SVG shape configuration

The `shape` component holds all settings regarding the SVG shapes of the sprite.

```javascript
shape				: {
	id				: <Object>,		// Shape ID related settings
	dimension		: <Object>,		// Dimension settings
	spacing			: <Object>,		// Spacing options
}
```

Property                 | Type            | Default       | Description                                |
-------------------------| --------------- | ------------- | ------------------------------------------ |
`id.separator`           | String          | `--`          | Separator for traversing a directory structure into a shape ID |
`id.generator`           | Function        | See desc.     | Callback for translating the local part of the file name into a shape ID. The callback's signature is `function(name) { /* ... */ return id; }`. By default, directory structures are traversed using the `id.separator` as replacement for the directory separator. |
`id.pseudo`              | String          | `~`           | String separator for pseudo CSS classes in file names. Example: `my-icon.svg` and `my-icon~hover.svg` for an icon with a regular and a `:hover` state. |
`dimension.maxWidth`     | Integer         | `2000`        | Maximum shape width in pixels |
`dimension.maxHeight`    | Integer         | `2000`        | Maximum shape height in pixels |
`dimension.precision`    | Integer         | `2`           | Precision (number of decimal places) for dimension calculations |
`spacing.padding`        | Integer/Array   | `0`           | Padding around shape. May be a single pixel value (which is then applied to all four edges) or an Array of Integers with a length between 1 and 4 (same syntax as for CSS padding) |
`spacing.box`            | String          | `content`     | Box sizing strategy, similar to CSS. When *content* is given, the `spacing.padding` will get applied outside the shape, thus effectively increasing the shapes bounding box. When *padding*, the content plus the given `spacing.padding` will stay within the given dimension contraints. |
`meta`                   | String          |               | Path to a [YAML](http://yaml.org/) file with meta data to be injected into the SVG files. [See below](#a1-meta-data-injection) for an example. |
`dest`                   | String          |               | Implicit way of calling [`.getShapes()`](#svgspritergetshapes-dest--callback-) during sprite compilation. If given, the `result` of subsequent [`.compile()`](#svgspritercompile-config--callback-) calls will carry an additional `shapes` property, listing the intermediate SVG files as an Array of [vinyl](https://github.com/wearefractal/vinyl) files. The value will be used as destination directory for the files (relative to the main output directory if not absolute anyway). |

#### A.1 Meta data injection

By providing a simple [YAML](http://yaml.org/) file via the `shape.meta` property, you can use *svg-sprite* to inject meta data into your SVG files before they get compiled as a sprite, trying to improve accessibility. The meta data file needs to look like this:

```yaml
"path/to/rectangle.svg"	:
	title				: Green rectangle
	description			: A light green rectangle with rounded corners and a dark green border
	
path--to--circle		:
	title				: Red circle
	description			: A red circle with a black border
``` 

The keys need to match either the **"local" file path part** of the SVG files you [register to the spriter](#svgspriteraddfile--name-svg-) or the final **shape IDs / CSS class names** as returned by the `id.generator` function. For each of your shapes, *svg-sprite* will look for `title` and `description` meta data and inject it like this:

```xml
<svg aria-labelledby="title desc">
	<title id="title">Green rectangle</title>
	<desc id="desc">A light green rectangle with rounded corners and a dark green border</desc>
	<rect width="75" height="50" rx="20" ry="20" fill="#90ee90" stroke="#228b22" stroke-fill="1" />
</svg>
```

Please be aware that existing `<title>` and `<description>` elements in the SVG files will be overridden. Also, even without the `meta` file being specified, *svg-sprite* will try to find these two elements in your files and set the `aria-labelledby` attribute accordingly.

### B. Transform configuration

The `transform` array holds a list of transformations that are applied — in order — to the each of the SVG shapes before they get combined into the sprite. The list defaults to `['svgo']`. The items of the `transform` list might be of type `String` or `Object`.

#### B.1 Pre-defined transformations (`String` values)

If a `transform` item is of type `String`, it's a shorthand and refers to a **pre-defined transformation** with the transformation's **default configuration**. At the time of this writing, the only supported pre-defined transformation is `svgo`:

```javascript
// SVGO transformation with default configuration
{
	transform		: ['svgo']
	/* ... */
}
```

#### B.2 Custom transformations (`Object` values)

If you don't want to use a pre-defined transformation or it's default configuration, you need to use the `Object` notation. First, each shorthand can be expanded like this:  

```javascript
// Equivalent transformation to ['svgo']
{
	transform		: [
		{svgo		: {}}
	]
	/* ... */
}
```

In this case, the list item's first object key is used as the **transformation name**. Depending on it's value type,

* a **pre-defined transformation with custom configuration** or
* a **custom callback**

will be called.

##### B.2.1 Pre-defined transformation with custom configuration (`Object` values)

To call a pre-defined transformation with custom configuration options, use it's name as the transformation name and provide an object which will get merged over the default configuration:

```javascript
// SVGO transformation with custom plugin configuration
{
	transform		: [
		{svgo		: {
			plugins	: [
				{transformsWithOnePath: true},
				{moveGroupAttrsToElems: false}
			]
		}}
	]
	/* ... */
}
```

##### B.2.2 Custom callback transformation (`Function` values)

To use a custom callback form transforming a shape's SVG, give a callback with the following signature:

```javascript
// SVGO transformation with custom plugin configuration
{
	transform		: [
		{custom		:
		
			/**
			 * Custom callback transformation
			 * 
			 * @param {SVGShape} shape				SVG shape object
			 * @param {SVGSpriter} spriter			SVG spriter
			 * @param {Function} callback			Callback
			 * @return {void}
			 */ 
			function(shape, sprite, callback) {
				/* ... */
				callback(null);
			}
		}
	]
	/* ... */
}
```

The transformation name (`custom`) is of no significance in this case. Please see `lib/svg-sprite/shape.js` to learn about what you can do with the shape object. 

### C. Common SVG options

The `svg` object holds common options that apply to each SVG file created. The common options might be overriden by mode configurations (see below).

Property                 | Type            | Default       | Description                                |
------------------------ | --------------- | ------------- | ------------------------------------------ |
`xmlDeclaration`         | Boolean         | `true`        | Output an XML declaration at the very beginning of SVG. The declaration defaults to `<?xml version="1.0" encoding="utf-8"?>` but might differ depending on the original shape SVG files. |
`doctypeDeclaration`     | Boolean         | `true`        | Include a `<DOCTYPE>` declaration in the sprite. The doctype will be drawn from the first SVG shape in the sprite. If there is no doctype declaration available, none will be written to the sprite as well. |

### D. Output mode configuration

*svg-sprite* currently supports 5 different output modes:

* `css`
* `view`
* `defs`
* `symbol`
* `stack`

Each of these modes produces it's own specific files and has it's individual configuration. You can configure several modes in parallel so that *svg-sprite* runs them simultaneously. Activate a mode by adding a like-named key to the `mode` object, either with default configuration or a custom settings object:

```javascript
// Activate the 'sprite' mode with default configuration
{
	mode			: {
		css			: true
	}
}

// Equivalent: Provide an empty configuration object
{
	mode			: {
		css			: {}
	}
}
```

#### D.1 `css` mode

The `css` mode creates a single SVG file by combining the original shapes as nested `<svg>` elements with individual horizontal and vertical offsets. Furthermore, CSS resources can be created that provide CSS rules for using the shapes as background images of  HTML elements (known as [CSS spriting](http://en.wikipedia.org/wiki/Sprite_(computer_graphics)#Sprites_by_CSS)). 

Property         | Type            | Default       | Description                                |
---------------- | --------------- | ------------- | ------------------------------------------ |
`dest`           | String          | `css`         | Base directory for sprite and CSS file output. If not absolute, the path will be resolved using the main output directory (see global `dest` option). |
`layout`         | String          | `packed`      | The arrangement of the shapes within the sprite. Might be `vertical`, `horizontal`, `diagonal` or `packed` (with the latter being the most compact type). It depends on your project which layout is best for you. |
`common`         | String          |               | If given and not empty, this will be the selector name of a CSS rule commonly defining the `background-image` and `background-repeat` properties for all the shapes in the sprite (thus saving some bytes by not unnecessarily repeating them for each shape) |
`prefix`         | String          | `svg-%s`      | If the value is not empty and does not contain any whitespace, it will be used as prefix for CSS class name generation. Class names will be constructed of the prefix (prepended with a dot if necessary) and the respective shape ID. If the value is empty, no prefix will be used. If the value contains whitespace (e.g. `.svg .icon-`), no dot will be prepended, so please take care of this yourself. If the value contains a placeholder (e.g. `.svg %s-svg`), it will get replaced by the shape ID (again without prepending a dot). |
`dimensions`     | String/Boolean  | `-dims`       | A non-empty string value will trigger the creation of additional CSS rules specifying the dimensions of each shape in the sprite. The string will be used as a selector suffix and behave much like `prefix`. A boolean `TRUE` will cause the dimensions to be included directly into each shape's CSS rule. |
`sprite`         | String          | `svg/sprite.css.svg`     | SVG sprite path and file name, relative to the base directory (see above). The file extension is optional as it will get replaced with `.svg` anyway. The basename part will always get used as name for the sprite file. |
`bust`           | Boolean         | `true`        | Add a content based hash to the name of the sprite file so that clients reliably reload the sprite when it's content changes («cache busting») |
`render`         | Object          | `{}`     | Collection of [rendering configurations](#e-rendering-configurations) for the stylesheet resources created along with the sprite. The keys are used as file extensions as well as file return keys. Please see below for further reading on [rendering configurations](#e-rendering-configurations). At present, there are default templates for the file extensions `css` ([CSS](http://www.w3.org/Style/CSS/)), `scss` ([Sass](http://sass-lang.com/)), `less` ([Less](http://lesscss.org/)) and `styl` ([Stylus](http://learnboost.github.io/stylus/)), which all reside in the directory `tmpl/css`. Example: `{css: true, scss: {dest: '_sprite.scss'}}` |
`example`        | [Rendering config](#e-rendering-configurations) | `false`       | Enabling this will trigger the creation of an HTML document demoing the usage of the CSS sprite. Please see below for further reading on [rendering configurations](#e-rendering-configurations). |
`example.template` | String        | `tmpl/css/sprite.html`       | HTML document Mustache template |
`example.dest`   | String          | `sprite.css.html`        | HTML document destination |

#### D.2 `view` mode

The `view` mode is an extension to the `css` mode and shares all it's features and configuration options (except the default example paths, see below). The generated SVG sprite differs only in additional `<view>` elements created for each shape in the sprite. By using the views' IDs as fragment identifiers when linking to the sprite, modern browsers will show the referenced shapes only, thus making the sprite usable for foreground images as well. Please see [this article by Chris Coyier](http://css-tricks.com/svg-fragment-identifiers-work/) for further explanation of the technique.

Property         | Type            | Default       | Description                                |
---------------- | --------------- | ------------- | ------------------------------------------ |
`example.template` | String        | `tmpl/view/sprite.html`       | HTML document Mustache template |
`example.dest`   | String          | `sprite.view.html`        | HTML document destination |

#### D.3 `defs` mode

The `defs` mode creates a single SVG file combining the original shapes as children of a global `<defs>` element. You can then `<use>` the shapes with either **document-internal references** (`<svg viewBox="0 0 100 100"><use xlink:href="#internal-id"/></svg>` while having the SVG sprite embedded inline into the very same document) or as an **external SVG spritemap** (`<svg viewBox="0 0 100 100"><use xlink:href="http://example.com/sprite.svg#fragment-id"/></svg>`). For the latter to work in Internet Explorer 9-11 you will have to use something like [SVG for Everybody](https://github.com/jonathantneal/svg4everybody). Please see [this article by Chris Coyier](http://css-tricks.com/svg-use-external-source/) for further explanation of the technique.

Property         | Type            | Default       | Description                                |
---------------- | --------------- | ------------- | ------------------------------------------ |
`dest`           | String          | `defs`        | Base directory for sprite and CSS file output. If not absolute, the path will be resolved using the main output directory (see global `dest` option). |
`prefix`         | String          | `svg-%s`      | If the value is not empty and does not contain any whitespace, it will be used as prefix for CSS class name generation. Class names will be constructed of the prefix (prepended with a dot if necessary) and the respective shape ID. If the value is empty, no prefix will be used. If the value contains whitespace (e.g. `.svg .icon-`), no dot will be prepended, so please take care of this yourself. If the value contains a placeholder (e.g. `.svg %s-svg`), it will get replaced by the shape ID (again without prepending a dot). |
`dimensions`     | String/Boolean  | `-dims`       | A non-empty string value will trigger the creation of additional CSS rules specifying the dimensions of each shape in the sprite. The string will be used as a selector suffix and behave much like `prefix`. A boolean `TRUE` will cause the dimensions to be included directly into each shape's CSS rule. |
`sprite`         | String          | `svg/sprite.defs.svg `     | SVG sprite path and file name, relative to the base directory (see above). The file extension is optional as it will get replaced with `.svg` anyway. The basename part will always get used as name for the sprite file.  |
`inline`         | Boolean         | `false`       | If you want to embed the `<defs>` sprite into your HTML source, you will want to set this to `true` in order to prevent the creation of SVG namespace declarations and to set some other attributes for effectively hiding the library sprite. |
`example`        | [Rendering config](#e-rendering-configurations) | `false`       | Enabling this will trigger the creation of an HTML document demoing the usage of the `<defs>` sprite with both document-internal and external shape references. Please see below for further reading on [rendering configurations](#e-rendering-configurations). |
`example.template` | String        | `tmpl/defs/sprite.html`       | HTML document Mustache template |
`example.dest`   | String          | `sprite.defs.html`        | HTML document destination |

#### D.4 `symbol` mode

The `symbol` mode behaves pretty much like the [defs mode](#d3-defs-mode) except it's using `<symbol>` elements to combine the original shapes into a sprite. Again, you can `<use>` the shapes then with either **document-internal references** (`<svg><use xlink:href="#internal-id"/></svg>` while having the SVG sprite embedded inline into the very same document) or as an **external SVG spritemap** (`<svg><use xlink:href="http://example.com/sprite.svg#fragment-id"/></svg>`). For the latter to work in Internet Explorer 9-11 you will as well have to use [SVG for Everybody](https://github.com/jonathantneal/svg4everybody). Please see [this article by Chris Coyier](http://css-tricks.com/svg-symbol-good-choice-icons/) for further explanation of the `<symbol>` technique. Compared to the `defs` mode, one of the main benefits is that you don't have to provide the `viewBox` attribute on every `<use>` element which makes it a lot easier.  

Property         | Type            | Default       | Description                                |
---------------- | --------------- | ------------- | ------------------------------------------ |
`dest`           | String          | `symbol`        | Base directory for sprite and CSS file output. If not absolute, the path will be resolved using the main output directory (see global `dest` option). |
`prefix`         | String          | `svg-%s`      | If the value is not empty and does not contain any whitespace, it will be used as prefix for CSS class name generation. Class names will be constructed of the prefix (prepended with a dot if necessary) and the respective shape ID. If the value is empty, no prefix will be used. If the value contains whitespace (e.g. `.svg .icon-`), no dot will be prepended, so please take care of this yourself. If the value contains a placeholder (e.g. `.svg %s-svg`), it will get replaced by the shape ID (again without prepending a dot). |
`dimensions`     | String/Boolean  | `-dims`       | A non-empty string value will trigger the creation of additional CSS rules specifying the dimensions of each shape in the sprite. The string will be used as a selector suffix and behave much like `prefix`. A boolean `TRUE` will cause the dimensions to be included directly into each shape's CSS rule. |
`sprite`         | String          | `svg/sprite.symbol.svg `     | SVG sprite path and file name, relative to the base directory (see above). The file extension is optional as it will get replaced with `.svg` anyway. The basename part will always get used as name for the sprite file.  |
`inline`         | Boolean         | `false`       | If you want to embed the `<symbol>` sprite into your HTML source, you will want to set this to `true` in order to prevent the creation of SVG namespace declarations and to set some other attributes for effectively hiding the library sprite. |
`example`        | [Rendering config](#e-rendering-configurations) | `false`       | Enabling this will trigger the creation of an HTML document demoing the usage of the `<symbol>` sprite with both document-internal and external shape references. Please see below for further reading on [rendering configurations](#e-rendering-configurations). |
`example.template` | String        | `tmpl/symbol/sprite.html`       | HTML document Mustache template |
`example.dest`   | String          | `sprite.symbol.html`        | HTML document destination |

#### D.5 `stack` mode

The `stack` mode creates a single SVG file by combining the original shapes as nested `<svg>` elements. Instead of spreading the shapes using individual offsets, the stack contains a small CSS portion that hides all the shapes by default. Only the *active* shape as determined by the `:target` pseudo selector will be visible. For this technique to work, the client will have to <a href="http://caniuse.com/#feat=svg-fragment" target="_blank">support SVG fragment identifiers</a> or use a prolyfill like <a href="https://github.com/preciousforever/SVG-Stacker/blob/master/fixsvgstack.jquery.js" target="_blank">fixsvgstack.jquery.js</a>. Please see [this post by simurai](http://simurai.com/blog/2012/04/02/svg-stacks/) for further explanation of SVG stacks.  

Property         | Type            | Default       | Description                                |
---------------- | --------------- | ------------- | ------------------------------------------ |
`dest`           | String          | `stack`       | Base directory for sprite and CSS file output. If not absolute, the path will be resolved using the main output directory (see global `dest` option). |
`prefix`         | String          | `svg-%s`      | If the value is not empty and does not contain any whitespace, it will be used as prefix for CSS class name generation. Class names will be constructed of the prefix (prepended with a dot if necessary) and the respective shape ID. If the value is empty, no prefix will be used. If the value contains whitespace (e.g. `.svg .icon-`), no dot will be prepended, so please take care of this yourself. If the value contains a placeholder (e.g. `.svg %s-svg`), it will get replaced by the shape ID (again without prepending a dot). |
`dimensions`     | String/Boolean  | `-dims`       | A non-empty string value will trigger the creation of additional CSS rules specifying the dimensions of each shape in the sprite. The string will be used as a selector suffix and behave much like `prefix`. A boolean `TRUE` will cause the dimensions to be included directly into each shape's CSS rule. |
`sprite`         | String          | `svg/sprite.stack.svg `     | SVG sprite path and file name, relative to the base directory (see above). The file extension is optional as it will get replaced with `.svg` anyway. The basename part will always get used as name for the sprite file.  |
`example`        | [Rendering config](#e-rendering-configurations) | `false`       | Enabling this will trigger the creation of an HTML document demoing the usage of the SVG stack. Please see below for further reading on [rendering configurations](#e-rendering-configurations). |
`example.template` | String        | `tmpl/stack/sprite.html`       | HTML document Mustache template |
`example.dest`   | String          | `sprite.stack.html`        | HTML document destination |

### E. Rendering configurations

*svg-sprite* uses [Mustache](http://mustache.github.io/) templates for creating certain output formats. Typically, the generation of these files is optional and you have to switch on the rendering process. Take a look at the `example` option of the [defs mode](#d3-defs-mode). To enable the demo HTML document **with default template and destination**, simply set the `example` value to `true`:

```javascript
{
	example			: true
}
```

or an empty object:

```javascript
{
	example			: {}
}
```

Use the subkey `template` to configure the **template used for rendering** and the subkey `dest` for specifying the **output file destination**:

```javascript
{
	example			: {
		template	: 'path/to/template.html',	// relative to current working directory
		dest		: 'path/to/demo.html'		// relative to current output directory
	}
}
```

To **disable the file rendering** altogether, set the value to something falsy:

```javascript
{
	example			: false
}
```

### F. Templating variables

#### F.1 Sprite & shape variables

For each sprite generation process, a data object is constructed that is passed to the [Mustache](http://mustache.github.io/) templating engine for rendering the different resources. You can retrieve the values used via the `data` argument passed to the [compile() callback](#svgspritercompile-config--callback-). Example:  

```javascript
{  
	// Data object for the `css` output mode
	css							: {
	
		// Name of the current output mode
		mode					: 'css',
		
		// CSS class name for `common` sprite shape properties (or NULL if disabled)
		common					: null,
		
		// Mixin name for `common` properties (identical to `common`, defaulting to 'svg-common' if disabled)
		mixin					: 'svg-common',
		
		// Whether to create shape dimensioning CSS rules 
		includeDimensions		: true,
		
		// Padding added to each shape (pixel)
		padding					: {top: 30, right: 30, bottom: 30, left: 30},
		
		// Overall sprite width (pixel)
		spriteWidth				: 860,
		
		// Overall sprite height (pixel)
		spriteHeight			: 1020,
		
		// Relative path from the stylesheet resource to the SVG sprite
		sprite					: 'svg/sprite.css.svg',
		
		// Relative path from the example resource to the SVG sprite (if configured)
		example					: 'svg/sprite.css.svg'
		
		// List of all shapes in the sprite
		shapes					: [
		
			// Single shape properties
			{  
			
				// Shape name (possibly including state, e.g. "weather-clear-night~hover")
				name			: 'weather-clear-night',
				
				// Shape name excluding the state
				base			: 'weather-clear-night',
				
				// Shape width (pixel)
				width			: {  
					
					// Excluding padding
					inner		: 800,
					
					// Including padding
					outer		: 860
				},
				
				// Shape height (pixel)
				height			: {
				
					// Excluding padding
					inner		: 960,
					
					// Including padding
					outer		: 1020
				},
				
				// First shape in the sprite
				first			: true,
				
				// Last shape in the sprite
				last			: false,
				
				// Shape position within the sprite
				position		: {  
				
					// Absolute position (pixel)
					absolute	: {
					
						// Horizontal position  
						x		: 0,
						
						// Horizontal position
						y		: -120,
						
						// Compound position
						xy		: '0 -120px'
					},
					
					// Relative position (%)
					relative	: { 
						
						// Horizontal position  
						x		: 0,
						
						// Vertical position
						y		: 33.333333,
						
						// Compound position
						xy		: '0 33.333333%'
					}
				},
				
				// CSS selectors
				selector		: {
				
					// Shape positioning CSS rule
					shape		: [  
						{  
							expression		: '.svg-weather-clear-night',
							raw				: '.svg-weather-clear-night',
							first			: true,									// First selector expression
							last			: false
						},
						{  
							expression		: '.svg-weather-clear-night\\:regular',
							raw				: '.svg-weather-clear-night:regular',	// Unescaped version
							first			: false,
							last			: true									// Last selector expression
						}
					],
					
					// Shape dimensioning CSS rule
					dimensions	: [  
						{  
							expression		: '.svg-weather-clear-night-dims',
							raw				: '.svg-weather-clear-night-dims',
							first			: true,									// First selector expression
							last			: true									// Last selector expression
						}
					]
				},
				
				// Dimensioning rule strategy
				dimensions		: {  
				
					// Render dimensions as part of positioning rule
					inline		: false,
					
					// Render dimensions as separate dimensioning rule
					extra		: true
				},
				
				// Shape SVG (inline embeddable version)
				svg				: '<svg> ... </svg>',
			}
		],
		
		// Current date (RFC-1123)
		date					: 'Fri, 26 Dec 2014 12:06:55 GMT',
	}
}
```

#### F.2 Custom variables & functions

The top-level `variables` object lets you define global variables that are passed to all [Mustache](http://mustache.github.io/) templating processes (across all output modes). You may either use scalar values or callbacks (see [here](https://github.com/janl/mustache.js/#functions) for details). Example:

```javascript
{
	variables	: {
		now		: +new Date(),
		png		: function() {
			return function(sprite, render) {
				return render(sprite).split('.svg').join('.png');
			}
		}
	}
}
```

#### F.3 Builtin templating functions

There are a couple of functions directly built into *svg-sprite*. You may use them in any template.

##### F.3.1 `date`

Takes no arguments and returns the current date and time as GMT string (e.g. *Mon, 22 Dec 2014 16:18:53 GMT*).

```html
<p>Generated at {{date}} by svg-sprite</p>
```

##### F.3.2 `invert`

Returns the negative value of a floating point number.

```css
.offset-background {
	background-position: {{#invert}}{{positionX}}{{/invert}}px {{#invert}}{{positionY}}{{/invert}}px;
}
```

##### F.3.3 `classname`

Returns the innermost part of a CSS selector as a class name (with the leading dot stripped off). For instance, if `fullselector` had the value *.svg .icon-cart*,

```html
<i class="{{#classname}}{{fullselector}}{{/classname}}">Cart</i>
```

would become

```html
<i class="icon-cart">Cart</i>
```

##### F.3.4 `escape`

Finds all backslashes in a string and escapes each of them with another backslash. 

```css
{{#escape}}{{selector-with-backslash}}{{/escape}} {
	color: red;
}
```

Known problems / To-do
----------------------

* SVGO does not minify element IDs when there are `<style>` or `<script>` elements contained in the file


Release history
---------------

#### v1.0.0 Next generation release
* Rewritten from scratch ([#23](https://github.com/jkphl/svg-sprite/issues/23), [#30](https://github.com/jkphl/svg-sprite/issues/30))
* Dropped [libxmljs](https://github.com/polotek/libxmljs) dependency for improving Windows support (e.g. [grunt-svg-sprite #14](https://github.com/jkphl/grunt-svg-sprite/issues/14))
* Added support for `view`, `symbol` and `stack` modes ([#27](https://github.com/jkphl/svg-sprite/issues/27), [#35](https://github.com/jkphl/svg-sprite/issues/35), [grunt-svg-sprite #24](https://github.com/jkphl/grunt-svg-sprite/issues/24))
* Strip off all file access methods, making the module a good basis for 3rd party tools (like Grunt & Gulp plugins) ([#21](https://github.com/jkphl/svg-sprite/issues/21), [#25](https://github.com/jkphl/svg-sprite/issues/25))
* Improved command line version ([#34](https://github.com/jkphl/svg-sprite/issues/34))
* Switched to relative positioning in CSS sprites ([grunt-svg-sprite #23](https://github.com/jkphl/grunt-svg-sprite/issues/23))
* Made the configuration of Mustache templates and destinations more intuitive
* Enabled customization of shape IDs
* Enabled custom SVG transformations
* Enhanced `padding` options ([#24](https://github.com/jkphl/svg-sprite/issues/24))
* Added cache busting for `css` and `view` mode (enabled by default; [#29](https://github.com/jkphl/svg-sprite/pull/29))
* Added support for [meta data injection](#a1-meta-data-injection)

For older release notes please [see here](https://github.com/jkphl/svg-sprite/tree/bbd051e940e7b6373ed56277251a8affb03b1c10#release-history).

Legal
-----
Copyright © 2014 Joschi Kuphal <joschi@kuphal.net> / [@jkphl](https://twitter.com/jkphl)

*svg-sprite* is licensed under the terms of the [MIT license](LICENSE.txt).

The contained example SVG icons are part of the [Tango Icon Library](http://tango.freedesktop.org/Tango_Icon_Library) and belong to the Public Domain.


[npm-url]: https://npmjs.org/package/svg-sprite
[npm-image]: https://badge.fury.io/js/svg-sprite.png

[travis-url]: http://travis-ci.org/jkphl/svg-sprite
[travis-image]: https://secure.travis-ci.org/jkphl/svg-sprite.png

[coveralls-url]: https://coveralls.io/r/jkphl/svg-sprite
[coveralls-image]: https://coveralls.io/repos/jkphl/svg-sprite/badge.png

[depstat-url]: https://david-dm.org/jkphl/svg-sprite
[depstat-image]: https://david-dm.org/jkphl/svg-sprite.svg