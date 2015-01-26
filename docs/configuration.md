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
	variables		: <Object>				// Custom templating variables
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
`id.separator`           | String          | `"--"`        | Separator for traversing a directory structure into a shape ID |
`id.generator`           | Function∣String  | See desc.     | Callback for translating the local part of a shape's file name into a shape ID. The callback's signature is `function(name) { /* ... */ return id; }`. By default, the file extension `".svg"` is stripped off and directory structures get traversed using the `id.separator` as replacement for the directory separator. You may also provide a template string (e.g. `"icon-%s"`), in which case the placeholder `"%s"` gets substituted with the traversed local file name. If the string doesn't contain any placeholder, it is used as a prefix to the local file name. |
`id.pseudo`              | String          | `"~"`         | String separator for pseudo CSS classes in file names. Example: `my-icon.svg` and `my-icon~hover.svg` for an icon with a regular and a `:hover` state. |
`dimension.maxWidth`     | Integer         | `2000`        | Maximum shape width in pixels |
`dimension.maxHeight`    | Integer         | `2000`        | Maximum shape height in pixels |
`dimension.precision`    | Integer         | `2`           | Precision (number of decimal places) for dimension calculations |
`spacing.padding`        | Integer/Array   | `0`           | Padding around shape. May be a single pixel value (which is then applied to all four edges) or an Array of Integers with a length between 1 and 4 (same syntax as for CSS padding) |
`spacing.box`            | String          | `"content"`   | Box sizing strategy, similar to CSS. When *content* is given, the `spacing.padding` will get applied outside the shape, thus effectively increasing the shapes bounding box. When *padding*, the content plus the given `spacing.padding` will stay within the given dimension contraints. |
`meta`                   | String          |               | Path to a [YAML](http://yaml.org/) file with [meta data to be injected](#a1-meta-data-injection) into the SVG shapes. |
`align`                  | String          |               | Path to a [YAML](http://yaml.org/) file with [extended alignment settings](#a2-extended-shape-alignment) for sprites with `"vertical"` or `"horizontal"` layout. |
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

#### A.2 Extended shape alignment

CSS sprites with `"vertical"` or `"horizontal"` layout use only one axis for positioning the shapes inside the sprite. For the opposite axis, *svg-sprite* uses `0` as default positioning value. That's why the weather icons are left-aligned in the following example:

![Sprite with vertical layout and default x-axis positioning](test/expected/png/css.vertical.default.png)

To use these icons as centered background images, you would need them to be centered within the sprite as well. This is where the **extended alignment options** jump in. To control the placement of the shapes, use the `shape.align` option to specify the path of a [YAML](http://yaml.org/) file with the following format:

```yaml
<shape-ID-or-path>:
  <template-string-with-placeholder>: <positioning>	
```

* `<shape-ID-or-path>` has to be the **"local" file path part** or the final **shape ID / CSS class name** of a particular shape in your sprite. Use the `"*"` for a catch-all rule (needs to be quoted in the YAML file).
* `<template-string-with-placeholder>` is a powerful feature that lets you **derive displaced copies** of your shapes. [See below](#a22-creating-displaced-shape-copies) for an example. The string should contain the placeholder `"%s"` which gets replaced by the ID of the matched shape. If the placeholder cannot be found in the string, it will be used as suffix for the shape ID. 
* `<positioning>` is a floating point value between `0` and `1`, expressing the relative placement of the shape on the secondary axis (0 - 100%).

*svg-sprite*'s default behaviour can be expressed as follows:

```yaml
"*"				:
  "%s"			: 0
```

##### A.2.1 Centering shapes

With only these two lines

```yaml
"*"				:
  "%s"			: .5
```

all the icons in the example sprite above get centered:

![Sprite with vertical layout and centered x-axis positioning](test/expected/png/css.vertical.centered.png)

##### A.2.2 Creating displaced shape copies

You can leverage the `<template-string-with-placeholder>` for creating displaced on-the-fly copies of your shapes:

```yaml
"*"             :
  "%s"          : .5
  
weather-clear   :
  -left         : 0 
  -right        : 1
  
weather-storm   :
  "%s"          : 0
```

Remember that the omitting the placeholder `"%s"`will make the template strings to be used as a suffices, effectively leading to the virtual shape IDs / CSS class names `"weather-clear-left"` and `"weather-clear-right"` (`"-left"` is equivalent to `"%s-left"`).

![Sprite with vertical layout, mixed x-axis positioning and displaced copies](test/expected/png/css.vertical.mixed.png)

As the displaced copies are created with the `<use>` element, your sprite doesn't get significantly bigger in file size by duplicating shapes this way. For each of the duplicates, an **individual CSS rule** is created in the stylesheet resources, using the virtual shape ID as selector class name.

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
`xmlDeclaration`         | Boolean∣String  | `true`        | Output an XML declaration at the very beginning of each compiled sprite. If you provide a non-empty string here, it will be used one-to-one as declaration (e.g. `<?xml version="1.0" encoding="utf-8"?>`). If you set this to `TRUE`, *svg-sprite* will look at the registered shapes for an XML declaration and use the first one it can find. |
`doctypeDeclaration`     | Boolean∣String  | `true`        | Include a `<DOCTYPE>` declaration in each compiled sprite. If you provide a non-empty string here, it will be used one-to-one as declaration (e.g. `<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1 Basic//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11-basic.dtd">`). If you set this to `TRUE`, *svg-sprite* will look at the registered shapes for a DOCTYPE declaration and use the first one it can find. |
`namespaceIDs`           | Boolean         | `true`        | In order to avoid ID clashes, the default behavior is to namespace all IDs in the source SVGs before compiling them into a sprite. Each ID is prepended with a unique string. In some situations, it might be desirable to disable ID namespacing, e.g. when you want to script the resulting sprite. Just set `svg.namespaceIDs` to `FALSE` then and be aware that you might also want to disable SVGO's ID minification (`transform.svgo.plugins: [{cleanupIDs: false}]`). |

### D. Output mode configuration

*svg-sprite* currently supports 5 different output modes:

* `css`
* `view`
* `defs`
* `symbol`
* `stack`

Each of these modes produces it's own specific files and has it's individual configuration. You may enable and configure several modes in parallel so that *svg-sprite* renders them in one run, saving the redundant SVG optimization overhead. Enable a specific mode by adding a like-named key to the `mode` object, either with default configuration or a custom settings object:

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

It is also possible to configure the same output mode multiple times, each time with a different configuration. In that case, use a custom key for the configuration object and give it a `mode` property telling *svg-sprite* which output mode to use:

```javascript
// Multiple sprites of the same output mode
{
	mode			: {
		sprite1		: {
			mode	: 'css'		// Sprite with «css» mode
		},
		sprite2		: {
			mode	: 'css'		// Another sprite with «css» mode
		}
	}
}
```

#### D.1 `css` mode

The `css` mode creates a single SVG file by combining the original shapes as nested `<svg>` elements with individual horizontal and vertical offsets. Furthermore, CSS resources can be created that provide CSS rules for using the shapes as background images of  HTML elements (known as [CSS spriting](http://en.wikipedia.org/wiki/Sprite_(computer_graphics)#Sprites_by_CSS)). 

Property         | Type            | Default       | Description                                |
---------------- | --------------- | ------------- | ------------------------------------------ |
`dest`           | String          | `"css"`       | Base directory for sprite and CSS file output. If not absolute, the path will be resolved using the main output directory (see global `dest` option). |
`layout`         | String          | `"packed"`    | The arrangement of the shapes within the sprite. Might be `"vertical"`, `"horizontal"`, `"diagonal"` or `"packed"` (with the latter being the most compact type). It depends on your project which layout is best for you. |
`common`         | String          |               | If given and not empty, this will be the selector name of a CSS rule commonly defining the `background-image` and `background-repeat` properties for all the shapes in the sprite (thus saving some bytes by not unnecessarily repeating them for each shape) |
`prefix`         | String          | `"svg-%s"`    | If the value is not empty and does not contain any whitespace, it will be used as prefix for CSS class name generation. Class names will be constructed of the prefix (prepended with a dot if necessary) and the respective shape ID. If the value is empty, no prefix will be used. If the value contains whitespace (e.g. `.svg .icon-`), no dot will be prepended, so please take care of this yourself. If the value contains a placeholder (e.g. `.svg %s-svg`), it will get replaced by the shape ID (again without prepending a dot). |
`dimensions`     | String/Boolean  | `"-dims"`     | A non-empty string value will trigger the creation of additional CSS rules specifying the dimensions of each shape in the sprite. The string will be used as a selector suffix and behave much like `prefix`. A boolean `TRUE` will cause the dimensions to be included directly into each shape's CSS rule. |
`sprite`         | String          | `"svg/sprite.css.svg"` | SVG sprite path and file name, relative to the base directory (see above). The file extension is optional as it will get replaced with `.svg` anyway. The basename part will always get used as name for the sprite file. |
`bust`           | Boolean         | `true`        | Add a content based hash to the name of the sprite file so that clients reliably reload the sprite when it's content changes («cache busting») |
`render`         | Object          | `{}`     | Collection of [rendering configurations](#e-rendering-configurations) for the stylesheet resources created along with the sprite. The keys are used as file extensions as well as file return keys. Please see below for further reading on [rendering configurations](#e-rendering-configurations). At present, there are default templates for the file extensions `css` ([CSS](http://www.w3.org/Style/CSS/)), `scss` ([Sass](http://sass-lang.com/)), `less` ([Less](http://lesscss.org/)) and `styl` ([Stylus](http://learnboost.github.io/stylus/)), which all reside in the directory `tmpl/css`. Example: `{css: true, scss: {dest: '_sprite.scss'}}` |
`example`        | [Rendering config](#e-rendering-configurations) | `false`       | Enabling this will trigger the creation of an HTML document demoing the usage of the CSS sprite. Please see below for further reading on [rendering configurations](#e-rendering-configurations). |
`example.template` | String        | `"tmpl/css/sprite.html"`     | HTML document Mustache template |
`example.dest`   | String          | `"sprite.css.html"`      | HTML document destination |

#### D.2 `view` mode

The `view` mode is an extension to the `css` mode and shares all it's features and configuration options (except the default example paths, see below). The generated SVG sprite differs only in additional `<view>` elements created for each shape in the sprite. By using the views' IDs as fragment identifiers when linking to the sprite, modern browsers will show the referenced shapes only, thus making the sprite usable for foreground images as well. Please see [this article by Chris Coyier](http://css-tricks.com/svg-fragment-identifiers-work/) for further explanation of the technique.

Property         | Type            | Default       | Description                                |
---------------- | --------------- | ------------- | ------------------------------------------ |
`example.template` | String        | `"tmpl/view/sprite.html"` | HTML document Mustache template |
`example.dest`   | String          | `"sprite.view.html"`      | HTML document destination |

#### D.3 `defs` mode

The `defs` mode creates a single SVG file combining the original shapes as children of a global `<defs>` element. You can then `<use>` the shapes with either **document-internal references** (`<svg viewBox="0 0 100 100"><use xlink:href="#internal-id"/></svg>` while having the SVG sprite embedded inline into the very same document) or as an **external SVG spritemap** (`<svg viewBox="0 0 100 100"><use xlink:href="http://example.com/sprite.svg#fragment-id"/></svg>`). For the latter to work in Internet Explorer 9-11 you will have to use something like [SVG for Everybody](https://github.com/jonathantneal/svg4everybody). Please see [this article by Chris Coyier](http://css-tricks.com/svg-use-external-source/) for further explanation of the technique.

Property         | Type            | Default       | Description                                |
---------------- | --------------- | ------------- | ------------------------------------------ |
`dest`           | String          | `"defs"`      | Base directory for sprite and CSS file output. If not absolute, the path will be resolved using the main output directory (see global `dest` option). |
`prefix`         | String          | `"svg-%s"`    | If the value is not empty and does not contain any whitespace, it will be used as prefix for CSS class name generation. Class names will be constructed of the prefix (prepended with a dot if necessary) and the respective shape ID. If the value is empty, no prefix will be used. If the value contains whitespace (e.g. `.svg .icon-`), no dot will be prepended, so please take care of this yourself. If the value contains a placeholder (e.g. `.svg %s-svg`), it will get replaced by the shape ID (again without prepending a dot). |
`dimensions`     | String/Boolean  | `"-dims"`     | A non-empty string value will trigger the creation of additional CSS rules specifying the dimensions of each shape in the sprite. The string will be used as a selector suffix and behave much like `prefix`. A boolean `TRUE` will cause the dimensions to be included directly into each shape's CSS rule. |
`sprite`         | String          | `"svg/sprite.defs.svg"`   | SVG sprite path and file name, relative to the base directory (see above). The file extension is optional as it will get replaced with `.svg` anyway. The basename part will always get used as name for the sprite file.  |
`inline`         | Boolean         | `false`       | If you want to embed the `<defs>` sprite into your HTML source, you will want to set this to `true` in order to prevent the creation of SVG namespace declarations and to set some other attributes for effectively hiding the library sprite. |
`example`        | [Rendering config](#e-rendering-configurations) | `false`       | Enabling this will trigger the creation of an HTML document demoing the usage of the `<defs>` sprite with both document-internal and external shape references. Please see below for further reading on [rendering configurations](#e-rendering-configurations). |
`example.template` | String        | `"tmpl/defs/sprite.html"` | HTML document Mustache template |
`example.dest`   | String          | `"sprite.defs.html"`      | HTML document destination |

#### D.4 `symbol` mode

The `symbol` mode behaves pretty much like the [defs mode](#d3-defs-mode) except it's using `<symbol>` elements to combine the original shapes into a sprite. Again, you can `<use>` the shapes then with either **document-internal references** (`<svg><use xlink:href="#internal-id"/></svg>` while having the SVG sprite embedded inline into the very same document) or as an **external SVG spritemap** (`<svg><use xlink:href="http://example.com/sprite.svg#fragment-id"/></svg>`). For the latter to work in Internet Explorer 9-11 you will as well have to use [SVG for Everybody](https://github.com/jonathantneal/svg4everybody). Please see [this article by Chris Coyier](http://css-tricks.com/svg-symbol-good-choice-icons/) for further explanation of the `<symbol>` technique. Compared to the `defs` mode, one of the main benefits is that you don't have to provide the `viewBox` attribute on every `<use>` element which makes it a lot easier.  

Property         | Type            | Default       | Description                                |
---------------- | --------------- | ------------- | ------------------------------------------ |
`dest`           | String          | `"symbol"`    | Base directory for sprite and CSS file output. If not absolute, the path will be resolved using the main output directory (see global `dest` option). |
`prefix`         | String          | `"svg-%s"`    | If the value is not empty and does not contain any whitespace, it will be used as prefix for CSS class name generation. Class names will be constructed of the prefix (prepended with a dot if necessary) and the respective shape ID. If the value is empty, no prefix will be used. If the value contains whitespace (e.g. `.svg .icon-`), no dot will be prepended, so please take care of this yourself. If the value contains a placeholder (e.g. `.svg %s-svg`), it will get replaced by the shape ID (again without prepending a dot). |
`dimensions`     | String/Boolean  | `"-dims"`     | A non-empty string value will trigger the creation of additional CSS rules specifying the dimensions of each shape in the sprite. The string will be used as a selector suffix and behave much like `prefix`. A boolean `TRUE` will cause the dimensions to be included directly into each shape's CSS rule. |
`sprite`         | String          | `"svg/sprite.symbol.svg"` | SVG sprite path and file name, relative to the base directory (see above). The file extension is optional as it will get replaced with `.svg` anyway. The basename part will always get used as name for the sprite file.  |
`inline`         | Boolean         | `false`       | If you want to embed the `<symbol>` sprite into your HTML source, you will want to set this to `true` in order to prevent the creation of SVG namespace declarations and to set some other attributes for effectively hiding the library sprite. |
`example`        | [Rendering config](#e-rendering-configurations) | `false`       | Enabling this will trigger the creation of an HTML document demoing the usage of the `<symbol>` sprite with both document-internal and external shape references. Please see below for further reading on [rendering configurations](#e-rendering-configurations). |
`example.template` | String        | `"tmpl/symbol/sprite.html"` | HTML document Mustache template |
`example.dest`   | String          | `"sprite.symbol.html"`      | HTML document destination |

#### D.5 `stack` mode

The `stack` mode creates a single SVG file by combining the original shapes as nested `<svg>` elements. Instead of spreading the shapes using individual offsets, the stack contains a small CSS portion that hides all the shapes by default. Only the *active* shape as determined by the `:target` pseudo selector will be visible. For this technique to work, the client will have to <a href="http://caniuse.com/#feat=svg-fragment" target="_blank">support SVG fragment identifiers</a> or use a prolyfill like <a href="https://github.com/preciousforever/SVG-Stacker/blob/master/fixsvgstack.jquery.js" target="_blank">fixsvgstack.jquery.js</a>. Please see [this post by simurai](http://simurai.com/blog/2012/04/02/svg-stacks/) for further explanation of SVG stacks.  

Property         | Type            | Default       | Description                                |
---------------- | --------------- | ------------- | ------------------------------------------ |
`dest`           | String          | `"stack"`     | Base directory for sprite and CSS file output. If not absolute, the path will be resolved using the main output directory (see global `dest` option). |
`prefix`         | String          | `"svg-%s"`    | If the value is not empty and does not contain any whitespace, it will be used as prefix for CSS class name generation. Class names will be constructed of the prefix (prepended with a dot if necessary) and the respective shape ID. If the value is empty, no prefix will be used. If the value contains whitespace (e.g. `.svg .icon-`), no dot will be prepended, so please take care of this yourself. If the value contains a placeholder (e.g. `.svg %s-svg`), it will get replaced by the shape ID (again without prepending a dot). |
`dimensions`     | String/Boolean  | `"-dims"`     | A non-empty string value will trigger the creation of additional CSS rules specifying the dimensions of each shape in the sprite. The string will be used as a selector suffix and behave much like `prefix`. A boolean `TRUE` will cause the dimensions to be included directly into each shape's CSS rule. |
`sprite`         | String          | `"svg/sprite.stack.svg"` | SVG sprite path and file name, relative to the base directory (see above). The file extension is optional as it will get replaced with `.svg` anyway. The basename part will always get used as name for the sprite file.  |
`example`        | [Rendering config](#e-rendering-configurations) | `false`       | Enabling this will trigger the creation of an HTML document demoing the usage of the SVG stack. Please see below for further reading on [rendering configurations](#e-rendering-configurations). |
`example.template` | String        | `"tmpl/stack/sprite.html"` | HTML document Mustache template |
`example.dest`   | String          | `"sprite.stack.html"`      | HTML document destination |

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