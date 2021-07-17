svg-sprite [![NPM version][npm-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Dependency Status][depstat-image]][depstat-url] [![Development Dependency Status][devdepstat-image]][devdepstat-url]
==========

This file is part of the documentation of *svg-sprite* — a free low-level Node.js module that **takes a bunch of SVG files**, optimizes them and creates **SVG sprites** of several types. The package is [hosted on GitHub](https://github.com/svg-sprite/svg-sprite).


Standard API
------------

*svg-sprite* comes with four public methods:

* [SVGSpriter([ config ])](#svgspriter-config-) — The spriter's constructor (always the entry point)
* [SVGSpriter.add(file [, name, svg ])](#svgspriteraddfile--name-svg-) — Registering source SVG files
* [SVGSpriter.compile([ config ,] callback )](#svgspritercompile-config--callback-) — Triggering the sprite compilation
* [SVGSpriter.getShapes( dest , callback )](#svgspritergetshapes-dest--callback-) — Accessing the intermediate SVG resources

To understand these methods' roles and interaction, please have a look at the following basic example first.

### Usage example 

```javascript
'use strict';

var SVGSpriter = require('svg-sprite'),
    mkdirp = require('mkdirp'),
    path = require('path'),
    fs = require('fs'),

// 1. Create and configure a spriter instance
// ====================================================================
    spriter = new SVGSpriter({
        dest: 'out',        // Main output directory
        mode: {
            css: {                // Create a CSS sprite
                render: {
                    css: true            // Render a CSS stylesheet
                }
            }
        }
    });

// 2. Add some SVG files to process
// ====================================================================
spriter.add(
    path.resolve('assets/example-1.svg'),
    'example-1.svg',
    fs.readFileSync('assets/example-1.svg', { encoding: 'utf-8' })
);

/* ... */

spriter.add(
    path.resolve('assets/example-x.svg'),
    'example-x.svg',
    fs.readFileSync('assets/example-x.svg', { encoding: 'utf-8' })
);

// 3. Trigger the (asynchronous) compilation process
// ====================================================================
spriter.compile(function (error, result, data) {

    // Run through all files that have been created for the `css` mode
    for (var type in result.css) {

        // Recursively create directories as needed
        mkdirp.sync(path.dirname(result.css[type].path));

        // Write the generated resource to disk
        fs.writeFileSync(result.css[type].path, result.css[type].contents);
    }
});
```

#### SVGSpriter([ config ])

**Constructor** — This is the only method publicly exposed by *svg-sprite*, so it's always your entry point. Use it to create an instance of the spriter and access the remaining three methods.

##### Arguments

1. **config** `{Object}` *(default: `{}`)* — [Main configuration](configuration.md) for the spriting process. As all configuration properties are optional, you may provide an empty object here or omit the argument altogether (no output files will be created then, but the [added SVG files](#svgspriteraddfile--name-svg-) will be optimized nevertheless). The `mode` configuration properties may also be specified when calling the `.compile()` method ([see below](#svgspritercompile-config--callback-)). 

#### SVGSpriter.add(file [, name, svg ])

**Registration of an SVG file** — Prior to compiliation, you'll need to register one or more SVG files for processing, obviously. As *svg-sprite* doesn't read the files from disk itself, you'll have to pass both the path and the file contents explicitly. Alternatively, you may pass a [vinyl](https://github.com/wearefractal/vinyl) file object as the first argument to `.add()`, which comes in handy when piping resources from one process to another (as you would do with the [Gulp wrapper](https://github.com/svg-sprite/gulp-svg-sprite) anyway). Please [see below](#example-using-glob-and-vinyl) for an example.

It is important to know that the spriter **optimizes the SVG files as soon as you register them**, not just when you [compile your sprite](#svgspritercompile-config--callback-). This way it is possibly to call the `.compile()` method several time, possibly passing in different render configurations without the need of repeating the optimization steps.

##### Arguments

1. **file** `{String|File}` — Absolute path to the SVG file or a [vinyl](https://github.com/wearefractal/vinyl) file object carrying all the necessary values (the following arguments are ignored then).
2. **name** `{String}` *(ignored with vinyl file)* — The "local" part of the file path, possibly including subdirectories which will get traversed to CSS selectors using the `shape.id.separator` [configuration option](configuration.md#shape-ids). You will want to pay attention to this when recursively adding whole directories of SVG files (e.g. via [glob](#example-using-glob-and-vinyl)). When `name` is empty, *svg-sprite* will use the basename of the `file` argument. As an example, setting `name` to `"deeply/nested/asset.svg"` while giving `"/path/to/my/deeply/nested/asset.svg"` for `file` will translate to the CSS selector `"deeply--nested--asset"`.
3. **svg** `{String}` *(ignored with vinyl file)*: SVG file content.

##### Example using [glob](https://github.com/isaacs/node-glob) and [vinyl](https://github.com/wearefractal/vinyl)

```javascript
'use strict';

var SVGSpriter = require('svg-sprite'),
    mkdirp = require('mkdirp'),
    path = require('path'),
    fs = require('fs'),
    File = require('vinyl'),
    glob = require('glob'),
    spriter = new SVGSpriter({
        dest: 'out',
        mode: {
            css: {
                render: {
                    css: true
                }
            }
        }
    }),
    cwd = path.resolve('assets');

// Find SVG files recursively via `glob`
glob.glob('**/*.svg', { cwd: cwd }, function (err, files) {
    files.forEach(function (file) {

        // Create and add a vinyl file instance for each SVG
        spriter.add(new File({
            path: path.join(cwd, file),                      // Absolute path to the SVG file
            base: cwd,                                       // Base path (see `name` argument)
            contents: fs.readFileSync(path.join(cwd, file))  // SVG file contents
        }));
    })

    spriter.compile(function (error, result, data) {
        for (var type in result.css) {
            mkdirp.sync(path.dirname(result.css[type].path));
            fs.writeFileSync(result.css[type].path, result.css[type].contents);
        }
    });
});
```

#### SVGSpriter.compile([ config ,] callback )

**Sprite compilation** — Triggers an asynchronous sprite compilation process. You may pass in an optional [output mode configuration](configuration.md#output-modes) object as the first argument in order to set the output parameters for that very run. You may call `.compile()` multiple times, allowing for several different sprites being generated by the same spriter instance. For each run, the callback will be triggered independently, giving you access to the resources that were generated.

##### Arguments

1. **config** `{Object}` *(optional)* — Configuration object setting the [output mode parameters](configuration.md#output-modes) for a single compilation run. If omitted, the `mode` property of the [main configuration](configuration.md) used for the [constructor](#svgspriter-config-) will be used.
2. **callback** `{Function}` — Callback triggered when the compilation has finished, getting three arguments:
    * **error** `{Error}` — Error message in case the compilation has failed
    * **result** `{Object}` — Directory of generated resources ([see below](#compilation-example))
    * **data** `{Object}` — Templating variables passed to Mustache for rendering the resources (see [sprite & shape variables](templating.md#sprite--shape-variables) for details)

##### Compilation example

Depending on the particular mode and render configuration, quite a lot of resources might be generated during a single compilation run. To understand the way *svg-sprite* returns these resources, please have a look at the following example: 

```javascript
spriter.compile(
    {
        css: {
            render: {
                scss: true
            },
            example: true
        }
    },
    function (error, result, data) {
        console.log(result);
    }
);
```

The spriter is instructed to create a CSS sprite along with the accompanying stylesheet resource in Sass format and an example HTML document demonstrating the use of the sprite. The output will look something like this (shortened for brevity):

```javascript
{
    css: {
        sprite: <File "css/svg/sprite.css.svg" <Buffer 3c 3f 78 ...>>,
        scss: <File "css/sprite.scss" <Buffer 2e 73 76 ...>>,
        example: <File "css/sprite.css.html" <Buffer 3c 21 44 ...>>
    }
}
```

For each configured output mode (`css` in the example), the `result` object holds an item containing the resources generated for this particular mode. There is always a `sprite` resource (obviously) and possibly an `example` resource for the demo HTML document (if configured). For the [css and view](configuration.md#css--view-mode) output modes, there are additional items named after the configured [rendering configurations](configuration.md#rendering-configurations) (`scss` in the example).

Please note that the resources are always returned as [vinyl](https://github.com/wearefractal/vinyl) files. Have a look above for an [example of how to write these files to disk](#example-using-glob-and-vinyl).  

#### SVGSpriter.getShapes( dest , callback )

**Accessing the intermediate SVG resources** — Sometimes you may want to access the single transformed / optimized SVG files that *svg-sprite* produces in an intermediate step. Depending on the [configured shape transformations](configuration.md#shape-transformations) (e.g. SVG optimization with [SVGO](https://github.com/svg/svgo)), *svg-sprite* will need some time for transforming the files, which is why accessing them must be an asynchronous task.

##### Arguments

1. **dest** `{String}` — Base directory for the SVG files in case the will be written to disk.
2. **callback** `{Function}`: Callback triggered when the shapes are available, getting called with two arguments:
    * **error** `{Error}` — Error message in case the shape access has failed.
    * **result** `{Array}` — Array of [vinyl](https://github.com/wearefractal/vinyl) carrying the intermediate SVGs.  

##### Shape access example

```javascript
var mkdirp = require('mkdirp'),
    path = require('path'),
    fs = require('fs');

spriter.getShapes(path.resolve('tmp/svg'), function (error, result) {
    result.forEach(function (file) {
        mkdirp.sync(path.dirname(file.path));
        fs.writeFileSync(file.path, file.contents);
    });
});
```


[npm-url]: https://npmjs.org/package/svg-sprite
[npm-image]: https://img.shields.io/npm/v/svg-sprite

[ci-url]: https://github.com/svg-sprite/svg-sprite/actions?query=workflow%3ATests+branch%3A1.5.x
[ci-image]: https://github.com/svg-sprite/svg-sprite/workflows/Tests/badge.svg?branch=1.5.x

[coveralls-url]: https://coveralls.io/github/svg-sprite/svg-sprite?branch=1.5.x
[coveralls-image]: https://img.shields.io/coveralls/github/svg-sprite/svg-sprite/1.5.x

[depstat-url]: https://david-dm.org/svg-sprite/svg-sprite
[depstat-image]: https://img.shields.io/david/svg-sprite/svg-sprite
[devdepstat-url]: https://david-dm.org/svg-sprite/svg-sprite?type=dev
[devdepstat-image]: https://img.shields.io/david/dev/svg-sprite/svg-sprite
