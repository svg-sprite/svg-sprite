svg-sprite
==========
is a Node.js module that reads a folder of **SVG images**, optimizes them and creates an **SVG sprite** along with suitable **stylesheet resources** (e.g. CSS, Sass, LESS or Stylus). Additional formats may easily be added by providing appropriate [Mustache](http://mustache.github.io) templates.

On a personal note: This is my first ever Node.js module, so please be forgiving in case of errors (and drop me a line instead of dropping the module altogether  — I'd really appreciate that). *svg-sprite* is closely related to another project of mine — **iconizr** — which exists in several versions ([Node.js module](https://github.com/jkphl/node-iconizr), [Grunt plugin](https://github.com/jkphl/grunt-iconizr), [PHP version](https://github.com/jkphl/iconizr) and [online service](http://iconizr.com)). That said, you will find most of the configuration options being relevant for *iconizr* as well.


Installation & usage
--------------------

To install *svg-sprite*, run

```bash
npm install svg-sprite -g
```

on the command line.


### Command line usage

You may use *svg-sprite* as a command line tool. Type `svg-sprite -h` to get all the available options:

```bash
  Usage: svg-sprite [options] [command]

Commands:

  *
  Convert the SVG files in the given directory. If omitted, the current working directory is used.

Options:

  -h, --help                           Output usage information
  -V, --version                        Output the version number
  -o, --out <output-directory>         Default output directory for stylesheets and the sprite subdirectory
  -r, --render <render-config>         Rendering configuration [{css: true}]
  --spritedir <sprite-directory>       Sprite subdirectory name [svg]
  --sprite <sprite-filename>           Sprite file name [sprite]
  -p, --prefix <selector-prefix>       CSS selector prefix [svg]
  --common <common-selector>           Common CSS selector for all images []
  --maxwidth <max-width>               Maximum single image width [1000]
  --maxheight <max-height>             Maximum single image height [1000]
  --padding <padding>                  Transparent padding around the single images (in pixel) [0]
  --layout <layout>                    Sprite images arrangement ("vertical", "horizontal" or "diagonal") [vertical]
  --pseudo <pseudo-separator>          Character sequence for denoting CSS pseudo classes [~]
  -d, --dims                           Render image dimensions as separate CSS rules [false] 
  -k, --keep                           Keep intermediate SVG files (inside the sprite subdirectory) [false]
  --recursive                          Recursively scan for SVG files in subdirectories
  -v, --verbose                        Output verbose progress information (0-3) [0]
  --cleanwith <clean-module>           Module to be used for SVG cleaning. Currently "scour" or "svgo" [svgo]
  --cleanconfig <clean-configuration>  JSON-serialized configuration options for the cleaning module [{}]
  -q, --quiet                          Don't print any status messages
```

Please [see below](#available-options) to learn more about the options and their values. Due to complexity issues, the `variables` option is not available for the CLI version.


#### Examples

This command reads all SVG files from the current directory and uses the subdirectory `sprite` to create an SVG sprite and CSS file into it:

```bash
$ svg-sprite --out sprite
$ svg-sprite -co sprite
```
This one creates an SVG sprite and it's CSS along with a Sass file at `sprite/sass/_sprite.scss`:

```bash
$ svg-sprite --out sprite --render '{"scss":{"dest":"sprite/sass/_sprite"}}'
```

This last one uses the subdirectory `./svg` as input directory, adds additional image size CSS rules, optimizes the SVG images using [SVGO](https://github.com/svg/svgo) and doesn't discard them in the end:

```bash
$ svg-sprite --keep --dims --out sprite --cleanwith svgo ./svg
$ svg-sprite -kdo sprite --cleanwith svgo ./svg
```

### Node.js module usage

The *svg-sprite* module exposes only one method, `createSprite()`. Use it like this:

```javascript
var SVGSprite			= require('svg-sprite'),
var options				= {
	render				: {
		css				: false,
		scss			: 'sass/output/directory/',
		less			: {
			template	: 'path/to/less/mustache/template.less',
			dest		: '/absolute/path/to/dest/file'
		}
	}
	/* Further configuration options, see below ... */
},
callback				= function(err, results) { /*
	If no error occurs, `results` will be a JSON object like this one:
	
	{
	   success			: true,		// Overall success
	   length			: 3,		// Total number of files written
	   files			: {			// Files along with their file size in bytes
	      '/path/to/your/cwd/css/output/directory/svg/sprite.svg'	: 436823,
	      '/path/to/your/cwd/css/output/directory/sprite.css'		: 1821,
	      '/path/to/your/cwd/sass/output/directory/_sprite.scss'	: 2197
	   }
	}
	
*/};
SVGSprite.createSprite('path/with/svg/images', 'css/output/directory', options, callback);
```

The `createSprite()` method will refuse to run if you don't pass exactly four arguments:

1.	A path to be used as the **input directory** containing the SVG images sprite creation. A relative path refers to the current working directory.
2.	A main / default **output directory**, used for creating the stylesheet resources (CSS / Sass / LESS / Stylus etc. if activated and not specified otherwise; see the [rendering options](#rendering-configuration) below) and serving as a base for the sprite subdirectory given by `spritedir` ([see below](#available-options)). A relative path refers to the current working directory.
3.	An object with [configuration options](#available-options). None of these options are mandatory, so you may pass an empty object `{}` here.
4.	A callback to be run when the sprite creation has finished (with or without error).


#### Available options

These are the options you may pass as the `createSprite()` method's third argument:

Property      | Type             | Description     
------------- | ---------------- | ----------------
`render`      | String (JSON)    | You may provide a configuration object that controls which output files and formats are generated and which [Mustache](http://mustache.github.io) rendering templates are used for the generation. It defaults to `{css: true}`, which means that a **CSS file with the default name will be generated to the default location**. This option is available since v0.1.0; prior to that, the now deprecated options `css`, `sass`, `sassout`, `less` and `lessout` were used for controlling the rendering behaviour. See below for an explanation of all [rendering options](#rendering-configuration).
`variables`   | Object           | You may use this option to pass additional custom variables to the Mustache rendering process. Be aware that there are a couple of reserved keys that are not available for custom variables (`common`, `prefix`, `sprite`, `dims`, `padding`, `swidth`, `sheight`, `svg`, `date`, `invert`, `escape`). You may also pass callback functions as variables (see [here](https://github.com/janl/mustache.js/#functions) for further details).  
`spritedir`   | Directory path   | Directory relative to the main output directory where the SVG sprite will be created. Defaults to `'svg'`. Starting with version v0.1.0 you may also provide an empty string or `.` to avoid the creation of a subdirectory altogether.
`sprite`      | String           | Filename of the SVG sprite (preceding the `.svg` extension). Defaults to `'sprite'`. 
`prefix`      | String           | Prefix for all CSS rules (all output formats). Defaults to `'svg'` (results in `.svg-*` CSS selectors)
`common`      | String           | If given and not empty, it will be used for creating a CSS rule that commonly defines the `background-image` and `background-repeat` properties for all the sprite images (thus saving some bytes by not unnecessarily repeating these properties for each sprite image) 
`maxwidth`    | Integer          | Maximum width of single SVG images. Will be downscaled if necessary. Defaults to `1000`.
`maxheight`   | Integer          | Maximum height of single SVG images. Will be downscaled if necessary. Defaults to `1000`.
`padding`     | Integer          | Padding around the single SVG images in the sprite. Defaults to `0`.
`layout`      | String           | Method of arranging the single SVG images in the sprite. Can be "vertical", "horizontal" or "diagonal", defaults to `vertical`.
`pseudo`      | String           | Char to separate CSS pseudo classes in file names. See the [iconizr documentation](https://github.com/jkphl/iconizr#css-pseudo-classes) for details. Defaults to `~`.
`dims`        | Boolean          | If present and equal to `true`, additional CSS rules will be rendered (all output formats) that set the dimensions of the single sprite images. You can use these CSS rules for sizing your elements appropriately. In general, the suffix `-dims` will be used in conjunction with the regular CSS selector for the image, but please have a look at the generated CSS file as well as the [iconizr documentation](https://github.com/jkphl/iconizr#css-pseudo-classes) for some special rules regarding CSS pseudo classes.
`keep`        | Boolean          | If present and equal to `true`, the single optimized intermediate SVG images used for creating the sprite will not be discarded, but kept in the `spritedir` as well.
`recursive`   | Boolean          | If present and equal to `true`, the input directory will be recursively scanned for SVG files in subdirectories. The directory names will be used for constructing the sprite image CSS class names, concatenated by hyphens.
`verbose`     | Integer    | Set this to a value > `0` to get some output. Defaults to `0`.
`cleanwith`   | String           | Select the module used for optimizing the single SVG images. Currently, the Node.js modules [svg-cleaner](https://npmjs.org/package/svg-cleaner) (loosely based on [Scour](http://www.codedread.com/scour)) and [SVGO](https://github.com/svg/svgo) are supported, so use either *scour* or *svgo* for this option. Set it to `FALSE` or `NULL` to skip the SVG optimization altogether. Defaults to *svgo* (starting with version v0.1.1). **ATTENTION: Currently Scour is not supported** (until an updated release gets available)
`cleanconfig` | String (JSON)    | You may provide a configuration object that is passed to the SVG optimizer (currently, only [SVGO](https://github.com/svg/svgo) supports this). It defaults to `{plugins: [{moveGroupAttrsToElems: false}]}`. When used on the [command line](#command-line-usage), provide a valid JSON encoded string here.


#### Rendering configuration

Starting with version v0.1.0, the output rendering of *svg-sprite* is based on [Mustache](http://mustache.github.io) templates. Compared to the earlier approach, template based rendering gives you way more flexiblity: Not only you can produce almost any (text based) output format, but also wrap the results with custom code or completely rearrange it's structure.

At the moment, *svg-sprite* comes with predefined templates for **CSS**, **Sass** (SCSS), **LESS** and **Stylus**, but you can easily overwrite them or add custom templates for different formats. The `render` option controls,

* which **output formats** are generated,
* where the **output files** are put and
* which **output templates** are used for creating the them.

You have to provide a **JavaScript object** as the value for `render`. Each property of this object controls one output format. The property names mainly serve as keys but also define the default file extensions in case they are not specified by the destination file names (see below). A very simple `render` object could look like this (in fact, this is the default rendering configuration; for an explanation see below):

```javascript
{
	css: true
}
```

Besides serving as a unique key, the property name `css` also indicates the default file extension for output files generated by this format. The value `true` indicates that the default values should apply for both the rendering template as well as the output filename. That said, the above `render` object is equivalent to any of these:

```javascript
{
	css				: {}
}

// is equivalent to

{
	css				: '<output-directory>/sprite.css' // default output file for CSS
}

// is equivalent to

{
	css: {
		dest		: '<output-directory>/sprite.css' // default output file for CSS
	}
}

// is equivalent to

{
	css: {
		template	: '/path/to/svg-sprite/tmpl/sprite.css', // default template for CSS
		dest		: '<output-directory>/sprite.css' // default output file for CSS
	}
}
```

You can find the provided standard templates `sprite.css`, `sprite.scss`, `sprite.less` and `sprite.styl` in the subdirectory `tmpl` of your *svg-sprite* installation. By default, output files will be named just like their corresponding template files.

If a `template` path is given, it must point to an existing template file — otherwise the conversion process will exit. The `dest` property can be provided as an absolute or relative path, as directory or file name, with or without file extension. The missing parts will be automatically expanded using default values. See the following equivalents to understand the mechanism:

```javascript
// A relative path

{
    css             : 'path/to/template.css'
}

// expands to an absolute

{
    css             : '/path/to/svg-sprite/<output-directory>/path/to/template.css'
}
```

```javascript
// A missing file extension 

{
    scss            : '/path/to/svg-sprite/path/to/template'
}

// expands to the template's file extension, whereas the template is determined
// by the overall format key (if not explicitly specified via `template`)

{
    scss            : '/path/to/svg-sprite/path/to/template.scss' // default template: sprite.scss
}
```

```javascript
// A missing file name 

{
    less            : {
    	template	: '/path/to/custom.less',
    	dest		: '/path/to/svg-sprite/path/to/directory/'
    }
}

// is also derived from the template

{
    less            : {
    	template	: '/path/to/custom.less',
    	dest		: '/path/to/svg-sprite/path/to/directory/custom.less' // default template: sprite.less
    }
}
```

```javascript
// An empty destination

{
    css             : ''
}

// expands to an absolute one with all default values

{
    css             : '/path/to/svg-sprite/<output-directory>/sprite.css'
}
```

To disable a certain output format, set it's value to `false` or `null`:

```javascript
{
	// Disable CSS rendering
    css				: false,
    
    // Activate Sass rendering
	scss			: 'sass/output/directory/',
	
	// Activate LESS rendering with custom template
	less			: {
		template	: 'path/to/less/mustache/template.less',
		dest		: '/absolute/path/to/dest/file'
	}
}
```

#### Custom output formats

Introducing a custom output format — or overwriting one of the predefined ones — is really easy: Just put a valid [Mustache](http://mustache.github.io) template to a location of your liking and configure it like this (the expansion mechanisms described above apply here as well):

```javascript
{
    myformat		: {
		template	: 'path/to/custom/mustache/template.abc',
		dest		: 'path/to/output/file.xyz'
	}
}
```

The **JavaScript hash** piped into the template rendering process typically looks something like this:

```javascript
{
    // CSS class name for `common` sprite image properties (or FALSE if disabled)
    "common": "icon",
    
    // `Prefix` for all CSS rules
    "prefix": "svg",
    
    // Path to the generated SVG sprite, relative to the main output directory
    "sprite": "svg/sprite.svg",
    
    // Whether to render image dimension CSS rules
    "dims": false,
    
    // Padding around each sprite image (pixel)
    "padding": 9,
    
    // Overall sprite width (pixel)
    "swidth": 50,
    
    // Overall sprite height (pixel)
    "sheight": 160,
    
    // List of all sprite images
    "svg": [
    
    	// Single sprite image configuration
        {
        
        	// Sprite image name
        	"name": "weather-clear-night",
        	
		    // Sprite image height (pixel; excluding padding)
		    "height": 32,
		    
		    // Sprite image width (pixel; excluding padding)
		    "width": 32,
		    
		    // Last image of sprite
		    "last": false,
        
        	// List of CSS selector expressions for this sprite image
            "selector": [
                {
                    "expression": "svg-weather-clear-night",
                    "raw": "svg-weather-clear-night",
                    "first": true, // Indicating the first expression
                    "last": false
                },
                {
                    "expression": "svg-weather-clear-night\\:regular",
                    "raw": "svg-weather-clear-night:regular", // Unescaped expression version
                    "first": false,
                    "last": true // Indicating the last expression
                }
            ],
		    
		    // Horizontal offset of the image within the sprite (pixel; including padding; always 0 for vertical sprites)
            "positionX": 0,
            
            // Vertical offset of the image within the sprite (pixel; including padding; always 0 for horizontal sprites) 
            "positionY": 0,
            
            // CSS background position values (including "px" unit if necessary)
            "position": "0 0",
            
            // Sprite image dimension configuration (if activated, otherwise FALSE)
            "dimensions": {
            
            	// List of CSS selector expressions for this sprite image dimensions
                "selector": [
                    {
                        "expression": "svg-weather-clear-night-dims",
                        "raw": "svg-weather-clear-night-dims",
                        "first": true, // Indicating the first expression
                        "last": true // Indicating the last expression
                    }
                ],
                
                // Sprite image width (pixel; including padding)
                "width": 50,
                
                // Sprite image width (pixel; including padding)
                "height": 50
            },
            
            // Inline SVG image for being referenced by <use> elements
            "data": "<svg width=\"48\" height=\"48\" id=\"weather-clear-night\" y=\"0\">...</svg>"
        }
        
        /* Further sprite images */
    ],
    
    // Current date (RFC-1123)
    "date": "Fri, 30 May 2014 20:04:18 GMT"
}
```

Please read the [Mustache manual](http://mustache.github.io/mustache.5.html) to get familiar with the rendering mechanism.

#### Inline embedding

In case you want to embed the SVG sprite into your HTML source and reference it via SVG fragment identifiers (`<use xlink:href="...">`), you will need to use a slightly different version of the SVG sprite (with the sprite images wrapped into a `<defs>` element). Starting with version 0.3.0, *svg-sprite* comes with an [Inline sprite output template](https://github.com/jkphl/svg-sprite/blob/master/tmpl/sprite.inline.svg) (`tmpl/sprite.inline.svg`) suitable for generating this embeddable sprite variant. You may trigger it's creation by using the `inline.svg` [rendering configuration](#rendering-configuration) key:

```javascript
// Create "<default-output-directory>/sprite.inline.svg"

{
    'inline.svg'    : true
}

// ... or create "<default-output-directory>/inline/sprite.svg" 

{
    'inline.svg'    : {
    	template	: 'tmpl/sprite.inline.svg', 
		dest		: 'inline/sprite'
    }
}
```

Also, to give you an idea of how to use the inline sprite, there's a new output template for rendering an **HTML preview document** that demonstrates some possible use cases. The `html` [rendering configuration](#rendering-configuration) key triggers it's creation:

```javascript
// Create "<default-output-directory>/sprite.html"

{
    html            : true
}

// ... or create "<default-output-directory>/custom/preview.html" 

{
    html            : {
    	template	: 'tmpl/sprite.html', 
		dest		: 'custom/preview'
    }
}
```

The preview document features both the use of **document-internal SVG references** (`<use xlink:href="#internal-id"/>`) as well as **external SVG spritemaps** (`<use xlink:href="http://example.com/sprite.svg#fragment-id"/>`) as [described by Chris Coyier](http://css-tricks.com/svg-use-external-source/) and others (including the polyfill [SVG for Everybody](https://github.com/jonathantneal/svg4everybody) for Internet Explorer 9-11).


Known problems / To-do
----------------------

*	SVGO does not minify element IDs when there are `<style>` or `<script>` elements contained in the file


Release history
---------------

#### v0.3.2
*	Added a Stylus output template
*	Improved XML and DOCTYPE declaration handling ([#22](https://github.com/jkphl/svg-sprite/issues/22))
*	Added the `variables` config option ([*grunt-iconizr* #13](https://github.com/jkphl/grunt-iconizr/issues/13))

#### v0.3.1
*	Skip creation of empty SVG sprite ([#18](https://github.com/jkphl/svg-sprite/issues/18))
*	Fixed bug with missing XML namespaces ([#19](https://github.com/jkphl/svg-sprite/issues/19))
*	Fixed bug in result parameter calculation

#### v0.3.0
*	Fixed bug with SVGO plugin configuration
*	Added support for recursive input directory scanning ([#12](https://github.com/jkphl/svg-sprite/pull/12))
*	Fixed a bug with ID substitution ([#15](https://github.com/jkphl/svg-sprite/issues/15))
*	Switched to mustache.js for extended function support
*	Added new HTML output format for rendering an inline SVG HTML implementation ([#16](https://github.com/jkphl/svg-sprite/issues/16))
*	Added new SVG output format for rendering an inline SVG sprite ([#16](https://github.com/jkphl/svg-sprite/issues/16))
*	Basic XML namespace consolidation in SVG sprite ([#17](https://github.com/jkphl/svg-sprite/issues/17))
*	Documentation corrections

#### v0.2.2
*	Fixed typo in binary script ([#13](https://github.com/jkphl/svg-sprite/issues/13), thanks to @jeff-mccoy)

#### v0.2.1
*	Added support for horizontal & diagonal sprites ([#11](https://github.com/jkphl/svg-sprite/pull/11), thanks to @arminrosu)

#### v0.2.0
*	Improved log messages
*	Disabled Scour until next release
*	Compatibility release for the [Node.js based iconizr](https://github.com/jkphl/node-iconizr)

#### v0.1.5
*	Removed forgotten `console.log()`

#### v0.1.4
*	Fixed padding bug with missing `viewBox` attribute ([#10](https://github.com/jkphl/svg-sprite/pull/10), thanks to @arminrosu)
*	Added additional Mustache variables ([#10](https://github.com/jkphl/svg-sprite/pull/10), thanks to @arminrosu)

#### v0.1.3
*	Fixed wrong version statement in the CLI app ([#8](https://github.com/jkphl/svg-sprite/pull/8), thanks to @stefanjudis)
*	Prefer `viewBox` attribute for image dimension calculation ([#9](https://github.com/jkphl/svg-sprite/issues/9))
*	Compatibility features for the upcoming [Node.js based iconizr](https://github.com/jkphl/node-iconizr) (modified the JavaScript hash for [custom output formats](#custom-output-formats))

#### v0.1.2
*	Fixed a regression bug with the `:regular` pseudo-pseudo class

#### v0.1.1
*	Implemented element ID namespacing (during sprite composition)
*	Switched to SVGO as default SVG optimizer
*	Compatibility features for the upcoming [Node.js based iconizr](https://github.com/jkphl/node-iconizr) (e.g. exposed two additional methods)
*	Improved log messages  
*	Improved the usage of the `:regular` pseudo-pseudo class ([#7](https://github.com/jkphl/svg-sprite/issues/7))

#### v0.1.0
*	Added support for omitting the sprite subdirectory ([#5](https://github.com/jkphl/svg-sprite/issues/5))
*	Added support for Mustache template based rendering ([#6](https://github.com/jkphl/svg-sprite/issues/6))
*	**Breaking change**: Dropped `css`, `sass`, `sassout`, `less` and `lessout` configuration options, added `render` instead
*	SVG DOCTYPE declaration gets automatically stripped now   

#### v0.0.8
*	Added support for LESS output ([#4](https://github.com/jkphl/svg-sprite/issues/4))

#### v0.0.7
*	Fixed incomplete Sass output ([#3](https://github.com/jkphl/grunt-svg-sprite/issues/3))

#### v0.0.6
*	Fixed broken SVGO support ([#2](https://github.com/jkphl/grunt-svg-sprite/issues/2))
*	Removed deprecated `width` and `height` config options from `lib/svg-obj.js`

#### v0.0.5
*	Fixed binary path in package.json ([#1](https://github.com/jkphl/grunt-svg-sprite/issues/1))

#### v0.0.4
*	Changed devDependencies & added more tests

#### v0.0.3
*	Fixed a bug with the Sass output

#### v0.0.2
*	Fixed a bug that let the sprite creation fail when keeping the intermediate SVG files
*	Added the `common` option
*	Added some tests

#### v0.0.1
*	Initial release


Contributors
------------
*	[Stefan Judis](https://github.com/stefanjudis)
*	[Armin Roșu](https://github.com/arminrosu)
*	[Thomas Khyn](https://github.com/tkhyn)


Legal
-----
Copyright © 2014 Joschi Kuphal <joschi@kuphal.net> / [@jkphl](https://twitter.com/jkphl)

*svg-sprite* is licensed under the terms of the [MIT license](LICENSE.txt).

The contained example SVG icons are part of the [Tango Icon Library](http://tango.freedesktop.org/Tango_Icon_Library) and belong to the Public Domain.

