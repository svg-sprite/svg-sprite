svg-sprite
==========

is a Node.js module that reads a folder of **SVG images**, optimizes them and creates an **SVG sprite** along with suitable **CSS and / or Sass** resources.

This is my first ever Node.js module, so please be forgiving in case of any errors (and please drop me a line in this case  — I'd really appreciate that). At some point later, I'd like to provide a Node.js / Grunt / Gulp port of my PHP based [iconizr project](https://github.com/jkphl/iconizr), which will use *svg-sprite* then. That said, you will find most of the configuration options to be identical with those of *iconizr*.


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

  -h, --help                           output usage information
  -V, --version                        output the version number
  -o, --out <css-directory>            Output directory for the CSS file and the sprite subdirectory
  --sassout <sass-directory>           Optional: separate output directory for Sass files [defaults to --out]
  --lessout <less-directory>           Optional: separate output directory for LESS files [defaults to --out]
  -c, --css [css-filename]             Render CSS file (optionally provide a CSS file name, defaults to "sprite")
  -s, --sass [sass-filename]           Render Sass file (optionally provide a Sass file name, defaults to "sprite")
  -l, --less [less-filename]           Render LESS file (optionally provide a LESS file name, defaults to "sprite")
  --spritedir <sprite-directory>       Sprite subdirectory name [svg]
  --sprite <sprite-filename>           Sprite file name [sprite]
  -p, --prefix <selector-prefix>       CSS selector prefix [svg]
  --common <common-selector>           Common CSS selector for all images
  --maxwidth <max-width>               Maximum single image width [1000]
  --maxheight <max-height>             Maximum single image height [1000]
  --padding <padding>                  Transparent padding around the single images (in pixel)
  --pseudo <pseudo-separator>          Character sequence for denoting CSS pseudo classes [~]
  -d, --dims                           Render image dimensions as separate CSS and / or Sass rules
  -k, --keep                           Keep intermediate SVG files (inside the sprite subdirectory)
  -v, --verbose                        Output verbose progress information
  --cleanwith <clean-module>           Module to be used for SVG cleaning. Currently "scour" or "svgo" [scour]
  --cleanconfig <clean-configuration>  JSON-serialized configuration options for the cleaning module
  -q, --quiet                          Don't produce any output
```

To learn more about the options and their values please [see below](#available-options).


#### Examples

This command reads SVG files from the current directory and uses the subdirectory `sprite` to create an SVG sprite and CSS file into it:

```bash
$ svg-sprite --css --out sprite
$ svg-sprite -co sprite
```
This one creates an SVG sprite and a CSS file along with a Sass file at `sprite/sass/_sprite.scss`:

```bash
$ svg-sprite --css --out sprite --sass _sprite --sassout sprite/sass
```

This last one uses the subdirectory `./svg`, creates image size CSS rules, optimizes the single SVG files using SVGO and doesn't discard them in the end:

```bash
$ svg-sprite --keep --dims --css --out sprite --cleanwith svgo ./svg
$ svg-sprite -kdco sprite --cleanwith svgo ./svg
```

### Node.js module usage

The *svg-sprite* module exposes only one method, `createSprite()`. Use it like this:

```javascript
var SVGSprite		= require('svg-sprite'),
var options			= {
	css				: true,
	sass			: '_sprite',
	sassout			: 'sass/output/directory'
	/* Further configuration options, see below ... */
},
callback			= function(err, results) { /*
	If no error occurs, `results` will be a JSON object like this one:
	
	{
	   success		: true,		// Overall success
	   length		: 3,		// Total number of files written
	   files		: {			// Files along with their file size in bytes
	      '/path/to/your/cwd/css/output/directory/svg/sprite.svg'	: 436823,
	      '/path/to/your/cwd/css/output/directory/sprite.css'		: 1821,
	      '/path/to/your/cwd/sass/output/directory/_sprite.scss'	: 2197
	   }
	}
	
*/};
SVGSprite.createSprite('path/with/svg/images', 'css/output/directory', options, callback);
```

The `createSprite()` method will refuse to run if you don't pass exactly four arguments:

1.	A path to be used as the **input directory** containing the SVG files for creating the sprite. May be relative to the current working directory.
2.	A general **output directory**, which is used to create the CSS file (if activated; see the `css` option [below](#available-options)) and which serves as the parent directory for the sprite directory given by `spritedir` ([see below](#available-options)). May be relative to the current working directory.
3.	An object with [configuration options](#available-options). None of these options is mandatory, so you may pass an empty object `{}` here.
4.	A callback to be run when the sprite creation has finished (with or without error).


#### Available options

These are the options you may pass as the `createSprite()` method's third argument:

Property      | Type             | Description     
------------- | ---------------- | ----------------
`css`         | Boolean / String | If given and non-empty, a CSS file will be rendered, with the value being the file name (preceding the `.css` extension). If set to `TRUE`, the file name will be *sprite*.
`sass`        | Boolean / String | If given and non-empty, a [Sass](http://sass-lang.com) file (SCSS) will be rendered, with the value being the file name (preceding the `.scss` extension). If set to `TRUE`, the file name will be *sprite*.
`sassout`     | Directory path   | Output directory for the Sass file (also see the `sass` option above, which needs to be set to create a Sass file). Defaults to the general output directory (second argument to `createSprite()`).
`less`        | Boolean / String | If given and non-empty, a [LESS](http://lesscss.org) file will be rendered, with the value being the file name (preceding the `.less` extension). If set to `TRUE`, the file name will be *sprite*.
`lessout`     | Directory path   | Output directory for the LESS file (also see the `less` option above, which needs to be set to create a LESS file). Defaults to the general output directory (second argument to `createSprite()`).
`spritedir`   | Directory path   | Directory relative to the general CSS output directory where the SVG sprite will be created. Defaults to *svg*.
`sprite`      | String           | Filename of the SVG sprite (preceding the `.svg` extension). Defaults to *sprite*. 
`prefix`      | String           | Prefix for all CSS rules (CSS, Sass & LESS file). Defaults to *svg* (results in `.svg-*` CSS selectors)
`common`      | String           | If given and not empty, it will be used for creating a CSS selector that commonly defines the `background-image` and `background-repeat` properties for all the sprite images (thus saving some bytes by not unnecessarily repeating these properties for each image) 
`maxwidth`    | Integer          | Maximum width of single SVG images. Will be downscaled if necessary. Defaults to `1000`.
`maxheight`   | Integer          | Maximum height of single SVG images. Will be downscaled if necessary. Defaults to `1000`.
`padding`     | Integer          | Padding around the single SVG images in the sprite. Defaults to `0`.
`pseudo`      | String           | Char to determine the usage of CSS pseudo classes. See the [iconizr documentation](https://github.com/jkphl/iconizr#css-pseudo-classes) for details. Defaults to *~*.
`dims`        | -                | If present, additional CSS rules will be rendered (CSS, Sass & LESS) that set the dimensions of the single images. You can use these CSS rules for sizing your elements appropriately. In general, the suffix `-dims` will be used in conjunction with the regular CSS selector for the image, but please have a look at the generated CSS file as well as the [iconizr documentation](https://github.com/jkphl/iconizr#css-pseudo-classes) for some special rules regarding CSS pseudo classes.
`keep`        | -                | If present, the single optimized intermediate SVG images used for creating the sprite will not be discarded, but kept in the `spritedir` as well.
`verbose`     | Integer    | Set to a value > `0` to get some output. Defaults to `0`.
`cleanwith`   | String           | Select the module used for optimizing the single SVG images. Currently, the Node.js modules [svg-cleaner](https://npmjs.org/package/svg-cleaner) (loosely based on [Scour](http://www.codedread.com/scour)) and [SVGO](https://github.com/svg/svgo) are supported, so use either *scour* or *svgo* for this option. Set it to `FALSE` or `NULL` to skip the SVG optimization altogether. Defaults to *scour* (but this may change in the future).
`cleanconfig` | String (JSON)    | You may provide a configuration object that is passed to the SVG optimizer (currently, only SVGO supports this). Provide it as a valid JSON string. Empty by default.


Known problems / To-do
----------------------

*	When several SVG images are combined into one file, the contained IDs should be namespaced to avoid conflicts between the images (e.g. when containing inline CSS). The namespacing of IDs is still to be implemented.
*	There should be added some more tests, especially for comparing the created SVG sprite with the expected result. At the moment, however, there are some problems with the libraries that would have to be used ...


Release history
---------------

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


Legal
-----
Copyright © 2014 Joschi Kuphal <joschi@kuphal.net> / [@jkphl](https://twitter.com/jkphl)

*svg-sprite* is licensed under the terms of the [MIT license](LICENSE.txt).

The contained example SVG icons are part of the [Tango Icon Library](http://tango.freedesktop.org/Tango_Icon_Library) and belong to the Public Domain.

