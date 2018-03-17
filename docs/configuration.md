svg-sprite [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Dependency Status][depstat-image]][depstat-url] [![Development Dependency Status][devdepstat-image]][devdepstat-url]
==========

This file is part of the documentation of *svg-sprite* — a free low-level Node.js module that **takes a bunch of SVG files**, optimizes them and creates **SVG sprites** of several types. The package is [hosted on GitHub](https://github.com/jkphl/svg-sprite).


Configuration
-------------

The *svg-sprite* **main configuration** is provided to the [constructor](api.md#svgspriter-config-) as an `Object` with the following structure:

```javascript
{
    dest: <String>, // Main output directory
    log: <String|Logger>, // Logging verbosity or custom logger
    shape: <Object>, // SVG shape configuration
    svg: <Object>, // Sprite SVG options
    variables: <Object>, // Custom templating variables
    mode: <Object> // Output mode configurations
}
```

All of these properties are optional, so in fact even an empty object `{}` is a valid configuration for *svg-sprite*. What follows is a complete reference of all available configuration settings. For getting off the ground quickly, you may also use the [online configurator & kickstarter](http://jkphl.github.io/svg-sprite), which lets you create a custom configuration in seconds.


Table of contents
-----------------

* [Main output directory](#main-output-directory)
* [Logging](#logging)
* [SVG shape configuration](#svg-shape-configuration)
    * [Shape IDs](#shape-ids)
    * [Shape dimensions](#shape-dimensions)
    * [Shape spacing](#shape-spacing)
    * [Shape transformations](#shape-transformations)
        * [Pre-defined shape transformations](#pre-defined-shape-transformations-string-values)
        * [Custom shape transformations](#custom-shape-transformations-object-values)
            * [Pre-defined shape transformation with custom configuration](#pre-defined-shape-transformation-with-custom-configuration-object-values)
            * [Custom callback transformation](#custom-callback-transformation-function-values)
    * [Miscellaneous shape options](#miscellaneous-shape-options)
* [Sprite SVG options](#sprite-svg-options)
    * [SVG sprite customization](#svg-sprite-customization)
* [Custom templating variables](#custom-templating-variables)
* [Output modes](#output-modes)
    * [Enabling & configuring](#enabling--configuring)
    * [Common mode properties](#common-mode-properties)
    * [Specific mode properties](#specific-mode-properties)
        * [«css» & «view» mode](#css--view-mode)
        * [«defs» & «symbol» mode](#defs--symbol-mode)
        * [«stack» mode](#stack-mode)
    * [Rendering configurations](#rendering-configurations)


### Main output directory

Property                 | Type            | Default       | Description                                |
------------------------ | --------------- | ------------- | ------------------------------------------ |
`dest`                   | String          | `.`           | Main output directory which is used for resolving relative paths. Although *svg-sprite* doesn't write any files itself, it does need this setting in order to correctly layout the resulting file and directory structures. |


### Logging

Property                 | Type            | Default       | Description                                |
------------------------ | --------------- | ------------- | ------------------------------------------ |
`log`                    | String∣Logger   |               | *svg-sprite* uses [winston](https://github.com/flatiron/winston) for logging, but output is turned off by default. To activate and use the pre-configured console logger, you need to pass the desired log level (`'info'`, `'verbose'` or `'debug'`). Alternatively, you can pass your own custom `winston.Logger` instance (which needs to handle at least these three log levels). Falsy values like `""`, `false` or `null` will disable logging. |


### SVG shape configuration

The `shape` property holds all settings affecting the SVG shapes of the sprite:

```javascript
shape: {
    id: { // SVG shape ID related options
        separator: '--', // Separator for directory name traversal
        generator: function() { /*...*/ }, // SVG shape ID generator callback
        pseudo: '~', // File name separator for shape states (e.g. ':hover')
        whitespace: '_' // Whitespace replacement for shape IDs
    },
    dimension: { // Dimension related options
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
    sort: function() { /*...*/ }, // SVG shape sorting callback
    meta: null, // Path to YAML file with meta / accessibility data
    align: null, // Path to YAML file with extended alignment data
    dest: null // Output directory for optimized intermediate SVG shapes
}
```


#### Shape IDs

Property                 | Type            | Default       | Description                                |
-------------------------| --------------- | ------------- | ------------------------------------------ |
`shape.id.separator`     | String          | `"--"`        | Separator for traversing a directory structure into a shape ID. Im empty, no directory traversal will happen and only the file name part (without the parent directory names) will be considered for the shape ID. |
`shape.id.generator`     | Function∣String | See desc.     | Callback for translating the local part of a shape's file name into a shape ID. The callback's signature is `function(name, file) { /* ... */ return id; }`, where `name` is the relative path of the source file within the base directory and `file` the original [vinyl](https://github.com/wearefractal/vinyl) file object. By default, the file extension `".svg"` is stripped off the `name` value and directory structures are traversed using the `id.separator` as replacement for the directory separator. You may also provide a template string (e.g. `"icon-%s"`), in which case the placeholder `"%s"` gets substituted with the traversed local file name. If the string doesn't contain any placeholder, it is used as a prefix to the local file name. |
`shape.id.pseudo`        | String          | `"~"`         | String separator for pseudo CSS classes in file names. Example: `my-icon.svg` and `my-icon~hover.svg` for an icon with a regular and a `:hover` state. |
`shape.id.whitespace`    | String          | `"_"`         | Replacement string for whitespace characters in file names during shape ID generation. Example: By default, `My Custom Icon.svg` will result in the shape ID `my_custom_icon`. |


#### Shape dimensions

Property                 | Type            | Default       | Description                                |
-------------------------| --------------- | ------------- | ------------------------------------------ |
`shape.dimension.maxWidth`     | Integer         | `2000`        | Maximum shape width in pixels |
`shape.dimension.maxHeight`    | Integer         | `2000`        | Maximum shape height in pixels |
`shape.dimension.precision`    | Integer         | `2`           | Precision (number of decimal places) for dimension calculations |
`shape.dimension.attributes`   | Boolean         | `false`       | Whether to add `width` and `height` attributes to embedded shapes («defs» and «stack» mode only) |


#### Shape spacing

Property                 | Type            | Default       | Description                                |
-------------------------| --------------- | ------------- | ------------------------------------------ |
`shape.spacing.padding`        | Integer/Array   | `0`           | Padding around shape. May be a single pixel value (which is then applied to all four edges) or an Array of Integers with a length between 1 and 4 (same syntax as for CSS padding) |
`shape.spacing.box`            | String          | `"content"`   | Box sizing strategy, similar to CSS. When set to `"content"`, the `shape.spacing.padding` values will get applied to the outside of each shape, effectively increasing the shape's bounding box. When set to `"padding"`, the content plus the given `spacing.padding` values will stay within the dimension contraints `shape.dimension.max*` (they are the bounding box' maxima). When set to `"icon"`, the `shape.dimension.max*` values are used as fixed dimensions for the bounding box around each shape. The shapes get either up- or downscaled proportionally to fit this bounding box (including `shape.spacing.padding`), resulting in all equally sized and distributed shape tiles (best fit for a set of same size icons). |

#### Shape transformations

The `shape.transform` array holds a list of transformations that are applied — in order — to the each of the SVG shapes before they get combined into the sprite. The list defaults to `['svgo']`. The items of the `shape.transform` list might be of type `String` or `Object`.


##### Pre-defined shape transformations (`String` values)

If a `shape.transform` item is of type `String`, it's a shorthand and refers to a **pre-defined transformation** with the transformation's **default configuration**. At the time of this writing, the only supported pre-defined transformation is `svgo`:

```javascript
// SVGO transformation with default configuration
{
    shape: {
        transform: ['svgo']
        /* ... */
    }
}
```

##### Custom shape transformations (`Object` values)

If you don't want to use a pre-defined transformation or it's default configuration, you need to use the `Object` notation. Each of the shorthands can be expanded like this:  

```javascript
// Equivalent transformation to ['svgo']
{
    shape: {
        transform: [
            {svgo: {}}
        ]
        /* ... */
    }
}
```

In this case, the list item's first object key is used as the **transformation name**. Depending on it's value type,

* a **pre-defined shape transformation with custom configuration** or
* a **custom callback**

will be called.


###### Pre-defined shape transformation with custom configuration (`Object` values)

To call a pre-defined transformation with custom configuration options, use it's name as the transformation name and provide an object which will get merged over the default configuration:

```javascript
// SVGO transformation with custom plugin configuration
{
    shape: {
        transform: [
            {svgo: {
                plugins: [
                    {transformsWithOnePath: true},
                    {moveGroupAttrsToElems: false}
                ]
            }}
        ]
        /* ... */
    }
}
```

###### Custom callback transformation (`Function` values)

To use a custom callback for transforming a shape's SVG, pass a function with the following signature:

```javascript
// SVGO transformation with custom plugin configuration
{
    shape: {
        transform: [
            {custom:

                /**
                 * Custom callback transformation
                 *
                 * @param {SVGShape} shape SVG shape object
                 * @param {SVGSpriter} spriter SVG spriter
                 * @param {Function} callback Callback
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
}
```

The transformation name (`"custom"` in this case) is of no significance. Please see `lib/svg-sprite/shape.js` to learn about what you can do with the shape object.


#### Miscellaneous shape options

Property                 | Type            | Default       | Description                                |
-------------------------| --------------- | ------------- | ------------------------------------------ |
`shape.sort`             | Function        |               | Callback for sorting the list of shapes. The callback's signature is `function(shape1, shape2) { /* ... */ return order; }`. It gets passed two shape objects and is expected to return an integer with `0` meaning both shapes are equal in their position, `1` meaning the first shape should follow the second one and `-1` the other way round. The default callback simply compares the shapes' `id` values and returns them in alphabetical order, but you may as well implement your own ordering logic. |
`shape.meta`             | String          |               | Path to a [YAML](http://yaml.org/) file with [meta data to be injected](meta-data.md) into the SVG shapes. |
`shape.align`            | String          |               | Path to a [YAML](http://yaml.org/) file with [extended alignment settings](shape-alignment.md) for sprites with `"vertical"` or `"horizontal"` layout. |
`shape.dest`             | String          |               | Implicit way of calling [`.getShapes()`](api.md#svgspritergetshapes-dest--callback-) during sprite compilation. If given, the `result` of subsequent [`.compile()`](api.md#svgspritercompile-config--callback-) calls will carry an additional `shapes` property, listing the intermediate SVG files as an Array of [vinyl](https://github.com/wearefractal/vinyl) files. The value will be used as destination directory for the files (relative to the main output directory if not absolute anyway). |


### Sprite SVG options

The `svg` object holds common options that apply to each SVG sprite created. The common options might be overriden by mode configurations ([see below](#output-modes)).

Property                 | Type            | Default       | Description                                |
------------------------ | --------------- | ------------- | ------------------------------------------ |
`svg.xmlDeclaration`         | Boolean∣String  | `true`        | Output an XML declaration at the very beginning of each compiled sprite. If you provide a non-empty string here, it will be used one-to-one as declaration (e.g. `<?xml version="1.0" encoding="utf-8"?>`). If you set this to `TRUE`, *svg-sprite* will look at the registered shapes for an XML declaration and use the first one it can find. |
`svg.doctypeDeclaration`     | Boolean∣String  | `true`        | Include a `<DOCTYPE>` declaration in each compiled sprite. If you provide a non-empty string here, it will be used one-to-one as declaration (e.g. `<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1 Basic//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11-basic.dtd">`). If you set this to `TRUE`, *svg-sprite* will look at the registered shapes for a DOCTYPE declaration and use the first one it can find. |
`svg.namespaceIDs`           | Boolean         | `true`        | In order to avoid ID clashes, the default behavior is to namespace all IDs in the source SVGs before compiling them into a sprite. Each ID is prepended with a unique string. In some situations, it might be desirable to disable ID namespacing, e.g. when you want to script the resulting sprite. Just set `svg.namespaceIDs` to `FALSE` then and be aware that you might also want to disable SVGO's ID minification (`shape.transform.svgo.plugins: [{cleanupIDs: false}]`). |
`svg.namespaceClassnames`    | Boolean         | `true`        | In order to avoid CSS class name ambiguities, the default behavior is to namespace CSS class names in the source SVGs before compiling them into a sprite. Each class name is prepended with a unique string. Disable this option to keep the class names untouched. |
`svg.dimensionAttributes`    | Boolean         | `true`        | If truthy, `width` and `height` attributes will be set on the sprite's `<svg>` element (where applicable). |
`svg.rootAttributes`         | Object          |               | Shorthand for applying custom attributes to the outermost `<svg>` element. Please be aware that certain attributes (e.g. `viewBox`) will be calculated dynamically and override custom `rootAttributes` in any case. |
`svg.precision`              | Integer         |               | Floating point precision for CSS positioning values (defaults to `-1` meaning highest possible precision). |
`svg.transform`              | Function∣Array  |               | Callback (or list of callbacks) that will be applied to the resulting SVG sprites as global [post-processing transformation](#svg-sprite-customization). |


#### SVG sprite customization

The `svg.transform` option can be used to post-process and customize the SVG sprites. You may specify a callback (or a list of callbacks) with the following signature:

```javascript
// Custom global post-processing transformation
{
    svg: {
        transform: [
            /**
             * Custom sprite SVG transformation
             *
             * @param {String} svg Sprite SVG
             * @return {String} Processed SVG
             */
            function(svg) {
                /* ... */
                return svg;
            },

            /* ... */
        ]
    }
}
```

The callbacks are processed synchronously and in the given order. Each one gets passed the sprite's SVG source as its first (and only) argument and is expected to return the modified SVG source after transformation. It's completely up to what you do with the SVG source, just don't forget to return it in the end. You may e.g. run some regex or even full-blown DOM operations on the SVG contents (*svg-sprite* depends on [xmldom](https://github.com/jindw/xmldom), so you may require a parser instance `var DOMParser = require('xmldom').DOMParser; /* ... */` within your callback ...).


### Custom templating variables

The top-level `variables` object lets you define global variables that are passed to all [Mustache](http://mustache.github.io/) templating processes across all [output modes](#output-modes). You may either use scalar values or callbacks (see [here](https://github.com/janl/mustache.js/#functions) for details on Mustache callbacks). Example:

```javascript
{
    variables: {
        now: +new Date(),
        png: function() {
            return function(sprite, render) {
                return render(sprite).split('.svg').join('.png');
            }
        }
    }
}
```

Please refer to the [templating guide](templating.md) to learn about the [builtin functions](templating.md#builtin-templating-functions) provided by *svg-sprite* as well as the [sprite and shape variables](templating.md#sprite--shape-variables) available during rendering.


### Output modes

*svg-sprite* currently supports 5 different output modes:

* `css`
* `view`
* `defs`
* `symbol`
* `stack`

Please see the configuration sections below to learn a little about their natures and differences.


#### Enabling & configuring

Each of them produces it's own specific files and has it's individual configuration. You may enable and configure several modes in parallel so that *svg-sprite* renders them in one run, saving the redundant SVG optimization overhead. Enabling a specific mode is as easy as adding a like-named key to the `mode` property, using either the default configuration (by using `true` as the value) or a custom settings object:

```javascript
// Activate the «css» mode with default configuration
{
    mode: {
        css: true
    }
}

// Equivalent: Provide an empty configuration object
{
    mode: {
        css: {}
    }
}
```

It is also possible to configure the same output mode multiple times, each time with a different configuration. In that case, use a custom key for the configuration object and give it the special `mode` property telling *svg-sprite* which output mode to use with this configuration:

```javascript
// Multiple sprites of the same output mode
{
    mode: {
        sprite1: {
            mode: 'css' // Sprite with «css» mode
        },
        sprite2: {
            mode: 'css' // Another sprite with «css» mode
        }
    }
}
```


#### Common mode properties

Many `mode` properties are common between all sprite types (sometimes their default values differ from type to type, however). The placeholder `"<mode>"` is used as a substitute for one of `"css"`, `"view"`, `"defs"`, `"symbol"` or `"stack"`. Please replace it consequently.

Property         | Type            | Default       | Description                                |
---------------- | --------------- | ------------- | ------------------------------------------ |
`mode.<mode>.dest`           | String          | `"<mode>"`       | Base directory for sprite and CSS file output. If not absolute, the path will be resolved using the main output directory (see global `dest` option). |
`mode.<mode>.prefix`         | String          | `".svg-%s"`    | Used for prefixing the [shape ID](#shape-ids) during CSS selector construction. If the value is empty, no prefix will be used. The prefix may contain the placeholder `"%s"` (e.g. `".svg %s-svg"`), which will then get replaced by the shape ID. Please be aware that `"%"` is a special character in this context and that you'll have to escape it by another percent sign (`"%%"`) in case you want to output it to your stylesheets (e.g. for a [Sass placeholder selector](http://sass-lang.com/documentation/file.SASS_REFERENCE.html#placeholder_selectors_)). |
`mode.<mode>.dimensions`     | String/Boolean  | `"-dims"`     | A non-empty string value will trigger the creation of additional CSS rules specifying the dimensions of each shape in the sprite. The string will be used as suffix to `mode.<mode>.prefix` during CSS selector construction and may contain the placeholder `"%s"`, which will get replaced by the value of `mode.<mode>.prefix`. A boolean `TRUE` will cause the dimensions to be included directly into each shape's CSS rule (only available for «css» and «view» sprites). |
`mode.<mode>.sprite`         | String          | `"svg/sprite.<mode>.svg"` | SVG sprite path and file name, relative to the `mode.<mode>.dest` directory (see above). You may omit the file extension, in which case it will be set to `".svg"` automatically. |
`mode.<mode>.bust`           | Boolean         | `true∣false`        | Add a content based hash to the name of the sprite file so that clients reliably reload the sprite when it's content changes («cache busting»). Defaults to `false` except for «css» and «view» sprites. |
`mode.<mode>.render`         | Object of [Rendering configs](#rendering-configurations)          | `{}`     | Collection of [stylesheet rendering configurations](#rendering-configurations). The keys are used as file extensions as well as file return keys. At present, there are default templates for the file extensions `css` ([CSS](http://www.w3.org/Style/CSS/)), `scss` ([Sass](http://sass-lang.com/)), `less` ([Less](http://lesscss.org/)) and `styl` ([Stylus](http://learnboost.github.io/stylus/)), which all reside in the directory `tmpl/css`. Example: `{css: true, scss: {dest: '_sprite.scss'}}` |
`mode.<mode>.example`        | [Rendering config](#rendering-configurations) | `false`       | Enabling this will trigger the creation of an HTML document demoing the usage of the sprite. Please see below for details on [rendering configurations](#rendering-configurations). |
`mode.<mode>.example.template` | String        | `"tmpl/<mode>/sprite.html"`     | HTML document Mustache template |
`mode.<mode>.example.dest`   | String          | `"sprite.<mode>.html"`      | HTML document destination |


#### Specific mode properties


##### «css» & «view» mode

The **«css»** mode creates a single SVG file by combining the original shapes as nested `<svg>` elements with individual horizontal and vertical offsets. CSS resources can be created that provide rules for using the shapes as **background images** of HTML elements (known as [CSS spriting](http://en.wikipedia.org/wiki/Sprite_(computer_graphics)#Sprites_by_CSS)).

The **«view»** mode is an extension to the «css» mode and shares all it's features. The generated SVG sprite differs only in additionally created `<view>` elements for each shape in the sprite. By using the views' IDs as fragment identifiers when linking to the sprite, modern browsers will show the referenced shapes only, thus making the sprite useful for **foreground images** as well. Please see [this article by Chris Coyier](http://css-tricks.com/svg-fragment-identifiers-work/) for further explanation of the technique.

In addition to the [common mode properties](#common-mode-properties), «css» and «view» sprites have these specific options:

Property         | Type            | Default       | Description                                |
---------------- | --------------- | ------------- | ------------------------------------------ |
`mode.<mode>.layout`         | String          | `"packed"`    | The arrangement of the shapes within the sprite. Might be `"vertical"`, `"horizontal"`, `"diagonal"` or `"packed"` (with the latter being the most compact type). It depends on your project which layout is best for you. |
`mode.<mode>.common`         | String          |               | If given and not empty, this will be the selector name of a CSS rule commonly specifying the `background-image` and `background-repeat` properties for all the shapes in the sprite (thus saving some bytes by not unnecessarily repeating them for each shape) |
`mode.<mode>.mixin`          | String          |               | If given and not empty, a mixin with this name will be added to supporting output formats (e.g. Sass, LESS, Stylus), specifying the `background-image` and `background-repeat` properties for all the shapes in the sprite. You may use it for creating custom CSS within **@media rules**. The mixin acts much like the `common` rule. In fact, you can even combine the two — if both are enabled, the `common` rule will use the `mixin` internally. |


##### «defs» & «symbol» mode

The **«defs»** mode creates a single SVG file combining the original shapes as children of a global `<defs>` element. You can then `<use>` the shapes with either **document-internal references** (`<svg viewBox="0 0 100 100"><use xlink:href="#internal-id"/></svg>` while having the SVG sprite embedded inline into the very same document) or as an **external SVG spritemap** (`<svg viewBox="0 0 100 100"><use xlink:href="http://example.com/sprite.svg#fragment-id"/></svg>`). Please see [this article by Chris Coyier](http://css-tricks.com/svg-use-external-source/) for further explanation of the technique.

The **«symbol»** mode behaves pretty much like the «defs» mode except it's using `<symbol>` elements to combine the original shapes into a sprite. Again, you can `<use>` the shapes with either **document-internal references** (`<svg><use xlink:href="#internal-id"/></svg>` while having the SVG sprite embedded inline into the very same document) or as an **external SVG spritemap** (`<svg><use xlink:href="http://example.com/sprite.svg#fragment-id"/></svg>`). Please see [this article by Chris Coyier](http://css-tricks.com/svg-symbol-good-choice-icons/) for further explanation of the `<symbol>` technique. Compared to the `defs` mode, one of the main benefits is that you don't have to provide the `viewBox` attribute on every `<use>` element which makes it a lot easier.

For both «defs» and «symbol» sprites you will have to use something like [SVG for Everybody](https://github.com/jonathantneal/svg4everybody) if you want to get external spritemap references working in Internet Explorer 9-11. In addition to the [common mode properties](#common-mode-properties), «defs» and «symbol» sprites have one extra option:


Property         | Type            | Default       | Description                                |
---------------- | --------------- | ------------- | ------------------------------------------ |
`mode.<mode>.inline`         | Boolean         | `false`       | If you want to embed the sprite into your HTML source, you will want to set this to `true` in order to prevent the creation of SVG namespace declarations and to set some other attributes for effectively hiding the library sprite. |


##### «stack» mode

The «stack» mode creates a single SVG file by combining the original shapes as nested `<svg>` elements. Instead of spreading the shapes using individual horizontal and / or vertical offsets, the stack contains a small CSS portion that hides all the shapes by default. Only the *active* shape as determined by the `:target` pseudo selector will be visible. For this technique to work, the client will have to <a href="http://caniuse.com/#feat=svg-fragment" target="_blank">support SVG fragment identifiers</a> or use a prolyfill like <a href="https://github.com/preciousforever/SVG-Stacker/blob/master/fixsvgstack.jquery.js" target="_blank">fixsvgstack.jquery.js</a>. Please see [this post by simurai](https://web.archive.org/web/20160120092300/http://simurai.com/blog/2012/04/02/svg-stacks/) for a further explanation of SVG stacks.

«stack» sprites don't have any options in addition to the [common mode properties](#common-mode-properties).


#### Rendering configurations

*svg-sprite* uses [Mustache](http://mustache.github.io/) templates for creating certain output formats. Typically, the generation of these files is optional and you have to switch on the rendering process:

* For creating a **CSS resource** alongside your sprite, you will have to enable / configure at least one output format via the `mode.<mode>.render` option.
* For creating an **example HTML document** demoing the use of your sprite, you will have to enable / configure it using `mode.<mode>.example`.

In both cases you'll have to use a **rendering configuration** to tell *svg-sprite* which template it should use and where the result file should be targeted to. Let's take a look at the `mode.<mode>.example` option. To enable the demo HTML document **with default template and destination**, simply set the value to `true`:

```javascript
{
    mode: {
        css: {
            example: true
        }
    }
}
```

This is absolutely equivalent to:

```javascript
{
    mode: {
        css: {
            example: {}
        }
    }
}
```

Use the subkey `template` for configuring the **rendering template** and `dest` for specifying the **output file destination**:

```javascript
{
    mode: {
        css: {
            render: {
                css: {
                    template: 'path/to/template.html', // relative to current working directory
                    dest: 'path/to/demo.html' // relative to current output directory
                }
            }
        }
    }
}
```

To **disable the rendering** without removing the whole structure, simply set the value to something falsy:

```javascript
{
    mode: {
        css: {
            example: false
        }
    }
}
```


[npm-url]: https://npmjs.org/package/svg-sprite
[npm-image]: https://badge.fury.io/js/svg-sprite.png

[travis-url]: http://travis-ci.org/jkphl/svg-sprite
[travis-image]: https://secure.travis-ci.org/jkphl/svg-sprite.png

[coveralls-url]: https://coveralls.io/r/jkphl/svg-sprite
[coveralls-image]: https://img.shields.io/coveralls/jkphl/svg-sprite.svg

[depstat-url]: https://david-dm.org/jkphl/svg-sprite#info=dependencies
[depstat-image]: https://david-dm.org/jkphl/svg-sprite.svg
[devdepstat-url]: https://david-dm.org/jkphl/svg-sprite#info=devDependencies
[devdepstat-image]: https://david-dm.org/jkphl/svg-sprite/dev-status.svg
