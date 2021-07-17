# svg-sprite

[![npm version][npm-image]][npm-url] [![npm downloads][npm-downloads]][npm-url] [![Build Status][ci-image]][ci-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Dependency Status][depstat-image]][depstat-url] [![Development Dependency Status][devdepstat-image]][devdepstat-url]

svg-sprite is a low-level [Node.js](https://nodejs.org/) module that **takes a bunch of [SVG](https://www.w3.org/TR/SVG/) files**, optimizes them and bakes them into **SVG sprites** of several types:

* Traditional [CSS sprites](https://en.wikipedia.org/wiki/Sprite_(computer_graphics)#Sprites_by_CSS) for use as background images,
* CSS sprites with **pre-defined `<view>` elements**, useful for foreground images as well,
* inline sprites using the **`<defs>` element**,
* inline sprites using the **`<symbol>` element**
* and [SVG stacks](https://simurai.com/blog/2012/04/02/svg-stacks).

It comes with a set of [Mustache](https://mustache.github.io/) templates for creating stylesheets in good ol' [CSS](https://www.w3.org/Style/CSS/) or one of the major **pre-processor formats** ([Sass](https://sass-lang.com/), [Less](http://lesscss.org/) and [Stylus](https://stylus-lang.com/)). Tweaking the templates or even adding your own **custom output format** is really easy, just as switching on the generation of an **HTML example document** along with your sprite.

For an up-to-date list of browsers supporting [SVG in general](https://caniuse.com/svg) respectively [SVG fragment identifiers](https://caniuse.com/svg-fragment) in particular (required for `<defs>` and `<symbol>` sprites as well as SVG stacks) please refer to [caniuse.com](https://caniuse.com/).

## Grunt, Gulp & Co.

Being a low-level library with support for [Node.js streams](https://github.com/substack/stream-handbook), *svg-sprite* doesn't take on the part of accessing the file system (i.e. reading the source SVGs from and writing the sprites and CSS files to disk). If you don't want to take care of this stuff yourself, you might rather have a look at the available wrappers for **Grunt** ([grunt-svg-sprite](https://github.com/svg-sprite/svg-sprite)) and **Gulp** ([gulp-svg-sprite](https://github.com/svg-sprite/gulp-svg-sprite)). *svg-sprite* is also the foundation of the **[iconizr](https://github.com/jkphl/node-iconizr)** project, which serves high-quality SVG based **CSS icon kits with PNG fallbacks**.


## Table of contents

* [Installation](#installation)
* [Getting started](#getting-started)
    * [Usage pattern](#usage-pattern)
    * [Standard API](docs/api.md)
    * [Grunt & Gulp wrappers](docs/grunt-gulp.md)
* [Configuration basics](#configuration-basics)
    * [General configuration options](#general-configuration-options)
    * [Output modes](#output-modes)
        * [Common mode properties](#common-mode-properties)
        * [Basic examples](#basic-examples)
    * [Output destinations](#output-destinations)
        * [Pre-processor formats and the sprite location](#pre-processor-formats-and-the-sprite-location)
    * [Full configuration documentation](docs/configuration.md)
    * [Online configurator & project kickstarter](https://svg-sprite.github.io/svg-sprite/)
* [Advanced techniques](#advanced-techniques)
    * [Meta data injection](docs/meta-data.md)
    * [Aligning and duplicating shapes](docs/shape-alignment.md)
    * [Tweaking and adding output formats](docs/templating.md)
* [Command line usage](docs/command-line.md)
* [Known problems / To-do](#known-problems--to-do)
* [Changelog](CHANGELOG.md)
* [Legal](#legal)


## Installation

To install *svg-sprite* globally, run

```bash
npm install svg-sprite -g
```

on the command line.


## Getting started

Crafting a sprite with *svg-sprite* typically follows these steps:

1. You [create an instance of the SVGSpriter](docs/api.md#svgspriter-config-), passing a main configuration object to the constructor.
2. You [register a couple of SVG source files](docs/api.md#svgspriteraddfile--name-svg-) for processing.
3. You [trigger the compilation process](docs/api.md#svgspritercompile-config--callback-) and receive the generated files (sprite, CSS, example documents etc.).

The procedure is the very same for all supported sprite types («modes»).


### Usage pattern

```js
// Create spriter instance (see below for `config` examples)
var spriter = new SVGSpriter(config);

// Add SVG source files — the manual way ...
spriter.add('assets/svg-1.svg', null, fs.readFileSync('assets/svg-1.svg', 'utf-8'));
spriter.add('assets/svg-2.svg', null, fs.readFileSync('assets/svg-2.svg', 'utf-8'));
/* ... */

// Compile the sprite
spriter.compile(function(error, result) {
    /* Write `result` files to disk (or do whatever with them ...) */
    for (var mode in result) {
        for (var resource in result[mode]) {
            fs.mkdirSync(path.dirname(result[mode][resource].path), { recursive: true });
            fs.writeFileSync(result[mode][resource].path, result[mode][resource].contents);
        }
    }
});
```

As you can see, big parts of the above are dealing with disk I/O. In this regard, you can make your life easier by [using the Grunt or Gulp wrappers](docs/grunt-gulp.md) instead of the [standard API](docs/api.md).


## Configuration basics

Of course you noticed the `config` variable passed to the constructor in the above example. This is *svg-sprite*'s **main configuration** — an `Object` with the following properties:

```js
{
    dest: <String>, // Main output directory
    log: <String|Logger>, // Logging verbosity or custom logger
    shape: <Object>, // SVG shape configuration
    svg: <Object>, // Common SVG options
    variables: <Object>, // Custom templating variables
    mode: <Object> // Output mode configurations
}
```

If you don't provide a configuration object altogether, *svg-sprite* uses built-in defaults for these properties, so in fact, they are all optional. However, you will need to enable at least one **output mode** (`mode` property) to get reasonable results (i.e. a sprite of some type).


### General configuration options

Many configuration properties (all except `mode`) apply to all sprites created by the same spriter instance. The default values are:

```js
// Common svg-sprite config options and their default values

var config = {
    dest: '.', // Main output directory
    log: null, // Logging verbosity (default: no logging)
    shape: { // SVG shape related options
        id: { // SVG shape ID related options
            separator: '--', // Separator for directory name traversal
            generator: function () { /*...*/ }, // SVG shape ID generator callback
            pseudo: '~' // File name separator for shape states (e.g. ':hover')
        },
        dimension: {// Dimension related options
            maxWidth: 2000, // Max. shape width
            maxHeight: 2000, // Max. shape height
            precision: 2, // Floating point precision
            attributes: false, // Width and height attributes on embedded shapes
        },
        spacing: { // Spacing related options
            padding: 0, // Padding around all shapes
            box: 'content' // Padding strategy (similar to CSS `box-sizing`)
        },
        transform: ['svgo'], // List of transformations / optimizations
        meta: null, // Path to YAML file with meta / accessibility data
        align: null, // Path to YAML file with extended alignment data
        dest: null // Output directory for optimized intermediate SVG shapes
    },
    svg: { // General options for created SVG files
        xmlDeclaration: true, // Add XML declaration to SVG sprite
        doctypeDeclaration: true, // Add DOCTYPE declaration to SVG sprite
        namespaceIDs: true, // Add namespace token to all IDs in SVG shapes
        namespaceIDPrefix: '', // Add a prefix to the automatically generated namespaceIDs
        namespaceClassnames: true, // Add namespace token to all CSS class names in SVG shapes
        dimensionAttributes: true // Width and height attributes on the sprite
    },
    variables: {} // Custom Mustache templating variables and functions
}
```

Please refer to the [configuration documentation](docs/configuration.md) for details.


### Output modes

At the moment, *svg-sprite* supports **five different output modes** (i.e. sprite types), each of them has its own characteristics and use cases. It's up to you to decide which sprite type is the best choice for your project. The `mode` option controls which sprite types are created. You may enable more than one output mode at a time — *svg-sprite* will happily create several sprites in parallel.

To enable the creation of a specific sprite type with default values, simply set the appropriate `mode` property to `true`:

```js
var config = {
    mode: {
        css: true, // Create a «css» sprite
        view: true, // Create a «view» sprite
        defs: true, // Create a «defs» sprite
        symbol: true, // Create a «symbol» sprite
        stack: true // Create a «stack» sprite
    }
}
```

To further configure a sprite, pass in an object with configuration options:

```js
// «symbol» sprite with CSS stylesheet resource

var config = {
    mode: {
        css: {
            // Configuration for the «css» sprite
            // ...
        }
    }
}
```


#### Common mode properties

Many `mode` properties are shared between the different sprite types, but there are also type specific options. Please refer to the [configuration documentation](docs/configuration.md) for a complete list of settings.

```js
// Common mode properties

var config = {
    mode: {
        <mode>: {
            dest: "<mode>", // Mode specific output directory
            prefix: "svg-%s", // Prefix for CSS selectors
            dimensions: "-dims", // Suffix for dimension CSS selectors
            sprite: "svg/sprite.<mode>.svg", // Sprite path and name
            bust: true || false, // Cache busting (mode dependent default value)
            render: { // Stylesheet rendering definitions
                /* -------------------------------------------
                css: false, // CSS stylesheet options
                scss: false, // Sass stylesheet options
                less: false, // LESS stylesheet options
                styl: false, // Stylus stylesheet options
                <custom>: ... // Custom stylesheet options
                -------------------------------------------    */
            },
            example: false // Create an HTML example document
        }
    }
}
```


#### Basic examples


##### A.) Standalone sprite

Foreground image **sprite with `<symbol>` elements** (for being `<use>`d in your HTML source):

```js
// «symbol» sprite with CSS stylesheet resource

var config = {
    mode: {
        inline: true, // Prepare for inline embedding
        symbol: true // Create a «symbol» sprite
    }
}
```


##### B.) CSS sprite with Sass resource

Traditional **CSS sprite** with a **Sass stylesheet**:

```js
// «css» sprite with Sass stylesheet resource

var config = {
    mode: {
        css: { // Create a «css» sprite
            render: {
                scss: true // Render a Sass stylesheet
            }
        }
    }
}
```


##### C.) Multiple sprites

**`<defs>` sprite**, **`<symbol>` sprite** and an **SVG stack** all at once:

```js
// «defs», «symbol» and «stack» sprites in parallel

var config = {
    mode: {
        defs: true,
        symbol: true,
        stack: true
    }
}
```


##### D.) No sprite at all

`mode`-less run, returning the **optimized SVG shapes only**:

```js
// Just optimize source SVG files, create no sprite

var config = {
    shape: {
        dest: 'path/to/out/dir'
    }
}
```


### Output destinations

Depending on your particular configuration, *svg-sprite* creates a lot of files that partly refer to each other. Several configuration options are controlling the exact location of each file, and you are well advised to spend a moment understanding how they interrelate with each other.

Relative destination paths refer to their ancestors as shown in the following scheme, with the current working directory being the ultimate base.

```text
        Destination option                     Default               Comment
---------------------------------------------------------------------------------------------
cwd $   <dest>/                                .                     Main output directory
            <mode.css.dest>/                   css                   «css» base directory
                <mode.css.sprite>              svg/sprite.css.svg    Sprite location
                <mode.css.render.css.dest>     sprite.css            CSS stylesheet location
                <mode.css.render.scss.dest>    sprite.scss           Sass stylesheet location
                ...
            <mode.view>/                       view                  «view» base directory
                ...
```

By default, stylesheet resources are generated directly into the respective **mode's base directory**.

> "Oh wait! Didn't you say that *svg-sprite* doesn't access the file system? So why do you need output directories at all?" — Well, good point. *svg-sprite* uses [vinyl](https://github.com/gulpjs/vinyl) file objects to pass along virtual resources and to specify where they **are intended to be located**. This is especially important for relative file paths (e.g. the path of an SVG sprite as used by a CSS stylesheet).


#### Pre-processor formats and the sprite location

Special care needs to be taken when you create a **CSS sprite** («css» or «view» mode) along with a stylesheet in one of the **pre-processor formats** (Sass, LESS, Stylus, etc.). In this case, calculating the correct relative SVG sprite path as used by the stylesheets can become tricky, as your (future) plain CSS compilation doesn't necessarily lie side by side with the pre-processor file. *svg-sprite* doesn't know anything about your pre-processor workflow, so it might have to estimate the location of the CSS file:

1. If you **truly configured CSS output** in addition to the pre-processor format, *svg-sprite* uses your custom `mode.<mode>.render.css.dest` as the CSS stylesheet location.
2. If you just **enabled CSS output** by setting `mode.<mode>.render.css` to `TRUE`, the default value applies, which is `mode.<mode>.dest / "sprite.css"`.
3. The same holds true when you **don't enable CSS output** at all. *svg-sprite* then simply assumes that the CSS file will be created where the defaults would put it, which is again `mode.<mode>.dest / "sprite.css"`.

So even if you don't enable plain CSS output explicitly, please make sure to set `mode.<mode>.dest` to **where your final CSS file is intended to be**.


### Full configuration documentation

The complete configuration documentation including all options [can be found here](docs/configuration.md).


### Online configurator & project kickstarter

To get you quickly off the ground, I made a simple [online configurator](https://svg-sprite.github.io/svg-sprite/) that lets you create a custom *svg-sprite* configuration in seconds. You may download the results as plain JSON, Node.js project, Gruntfile, or Gulpfile. Please visit the configurator at <https://svg-sprite.github.io/svg-sprite/>.


## Advanced techniques


### Meta data injection

In order to improve accessibility, *svg-sprite* can read meta data from a YAML file and inject `<title>` and `<description>` elements into your SVGs. Please refer to the [meta data injection guide](docs/meta-data.md) for details.


### Aligning and duplicating shapes

For CSS sprites using a `"horizontal"` or `"vertical"` layout it is sometimes desirable to align the shapes within the sprite. With the help of an external YAML file, *svg-sprite* can not only [control the alignment](docs/shape-alignment.md#aligning-and-duplicating-shapes) for each individual shape but also [create displaced copies](docs/shape-alignment.md#creating-displaced-shape-copies) of them without significantly increasing the sprite's file size.


### Tweaking and adding output formats

*svg-sprite* uses [Mustache](https://mustache.github.io/) templates for rendering the various CSS resources. This makes it very easy to tailor the generated CSS / Sass / LESS / Stylus resources to your needs or add completely new output formats. Please refer to the [templating guide](docs/templating.md) to learn about the details.


## Command line usage

*svg-sprite* comes with a pretty feature complete command line version. A typical example could look like this:

```bash
svg-sprite --css --css-render-css --css-example --dest=out assets/*.svg
```

Please refer to the [CLI guide](docs/command-line.md) for further details.


## Known problems / To-do

* SVGO does not minify element IDs when there are `<style>` or `<script>` elements contained in the file


## Changelog

Please refer to the [changelog](CHANGELOG.md) for a complete release history.


## Legal

Copyright © 2018 Joschi Kuphal <joschi@kuphal.net> / [@jkphl](https://twitter.com/jkphl). *svg-sprite* is licensed under the terms of the [MIT license](LICENSE). The contained example SVG icons are part of the [Tango Icon Library](http://tango.freedesktop.org/Tango_Icon_Library) and belong to the Public Domain.


[npm-url]: https://npmjs.org/package/svg-sprite
[npm-image]: https://img.shields.io/npm/v/svg-sprite
[npm-downloads]: https://img.shields.io/npm/dm/svg-sprite.svg

[ci-url]: https://github.com/svg-sprite/svg-sprite/actions?query=workflow%3ATests+branch%3Amaster
[ci-image]: https://img.shields.io/github/workflow/status/svg-sprite/svg-sprite/Tests/master

[coveralls-url]: https://coveralls.io/github/svg-sprite/svg-sprite?branch=master
[coveralls-image]: https://img.shields.io/coveralls/github/svg-sprite/svg-sprite/master

[depstat-url]: https://david-dm.org/svg-sprite/svg-sprite
[depstat-image]: https://img.shields.io/david/svg-sprite/svg-sprite
[devdepstat-url]: https://david-dm.org/svg-sprite/svg-sprite?type=dev
[devdepstat-image]: https://img.shields.io/david/dev/svg-sprite/svg-sprite
