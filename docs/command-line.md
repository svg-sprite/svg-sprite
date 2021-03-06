# svg-sprite

[![npm version][npm-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Dependency Status][depstat-image]][depstat-url] [![Development Dependency Status][devdepstat-image]][devdepstat-url]

This file is part of the documentation of *svg-sprite* — a free low-level Node.js module that **takes a bunch of SVG files**, optimizes them and creates **SVG sprites** of several types. The package is [hosted on GitHub](https://github.com/svg-sprite/svg-sprite).


## Command line usage

You may use *svg-sprite* as a command line tool. Type `svg-sprite --help` to get all the available options:

```bash
Usage: svg-sprite [options] files

Options:
  --version                      Show version number  [boolean]
  --help                         Display this help information  [boolean]
  -D, --dest                     Main output directory (base path)  [default: "."]
  -C, --config                   Path to external JSON config file
  -l, --log                      Logging verbosity ("info", "verbose" or "debug")
  --shape-id-separator           Separator for traversing a directory structure into a shape ID  [default: "--"]
  --shape-id-generator           ID generation callback [via CLI only template strings]  [default: "%s"]
  --shape-id-pseudo              Separator for CSS pseudo classes  [default: "~"]
  --shape-id-whitespace          Whitespace replacement string for shape IDs  [default: "_"]
  -w, --shape-dim-width          Maximum shape width in pixels  [default: 2000]
  -h, --shape-dim-height         Maximum shape height in pixels  [default: 2000]
  --shape-dim-precision          Precision (decimal places) for dimension calculations  [default: 2]
  --shape-dim-attributes         Whether to add width and height attributes to the shapes  [boolean] [default: false]
  -p, --shape-spacing-padding    Padding around shape (up to 4 x comma-separated)  [default: "0,0,0,0"]
  -b, --shape-spacing-box        Box sizing strategy ("content", "padding" or "icon")  [default: "content"]
  -m, --shape-meta               Path to YAML file with meta information
  -a, --shape-align              Path to YAML file with alignment information
  --ims, --shape-dest            Path to output directory for intermediate SVG files
  --shape-transform              Comma-separated list of predefined transformers (see docs)  [default: "svgo"]
  --shape-transform-*            External JSON config files for named transformers
  --svg-xmldecl                  Whether to include an XML declaration in SVG files  [boolean] [default: true]
  --svg-doctype                  Whether to include a doctype declaration in SVG files  [boolean] [default: true]
  --svg-namespace-ids            Whether to apply ID namespacing to the sprite  [boolean] [default: true]
  --svg-namespace-classnames     Whether to apply CSS class namespacing to the sprite  [boolean] [default: true]
  --svg-dimattrs                 Whether to add width and height attributes to the sprite  [boolean] [default: true]
  --svg-rootattrs                Custom root attributes for the outermost <svg> element (external JSON file)
  --svg-precision                Floating point precision for CSS positioning values  [default: -1]

  -c, --css                      Activates the «css» mode  [boolean] [default: false]
  --css-dest                     Mode specific output directory  [default: "css"]
  --cl, --css-layout             Sprite layout ("vertical"/"horizontal"/"diagonal"/"packed")  [default: "packed"]
  --css-common                   Common CSS rule selector for all shapes  [default: null]
  --css-mixin                    Preprocessor mixin name with properties for all shapes  [default: null]
  --css-prefix                   CSS selector prefix for all shapes (including placeholders)  [default: ".svg-%s"]
  --css-dimensions               CSS selector suffix for shape dimension rules ("" for inline)  [default: "-dims"]
  --cs, --css-sprite             Sprite path and filename (relative to --css-dest)  [default: "svg/sprite.css.svg"]
  --css-bust                     Enable cache busting  [boolean] [default: true]
  --ccss, --css-render-css       Whether to render a CSS stylesheet  [boolean] [default: false]
  --css-render-css-template      CSS stylesheet Mustache template (relative to svg-sprite basedir)  [default: "tmpl/css/sprite.css"]
  --css-render-css-dest          CSS stylesheet destination (relative to the --css-dest)  [default: "sprite.css"]
  --cscss, --css-render-scss     Whether to render a Sass stylesheet (SCSS)  [boolean] [default: false]
  --css-render-scss-template     Sass stylesheet Mustache template (relative to svg-sprite basedir)  [default: "tmpl/css/sprite.scss"]
  --css-render-scss-dest         Sass stylesheet destination (relative to the --css-dest)  [default: "sprite.scss"]
  --cless, --css-render-less     Whether to render a LESS stylesheet  [boolean] [default: false]
  --css-render-less-template     LESS stylesheet Mustache template (relative to svg-sprite basedir)  [default: "tmpl/css/sprite.less"]
  --css-render-less-dest         LESS stylesheet destination (relative to the --css-dest)  [default: "sprite.less"]
  --cstyl, --css-render-styl     Whether to render a Stylus stylesheet  [boolean] [default: false]
  --css-render-styl-template     Stylus stylesheet Mustache template (relative to svg-sprite basedir)  [default: "tmpl/css/sprite.styl"]
  --css-render-styl-dest         styl stylesheet destination (relative to the --css-dest)  [default: "sprite.styl"]
  --css-render-*                 Custom output renderings
  --css-render-*-template        Custom output Mustache template (relative to svg-sprite basedir)
  --css-render-*-dest            Custom output destination (relative to the --css-dest)
  --cx, --css-example            Whether to render an example HTML document  [boolean] [default: false]
  --css-example-template         HTML document Mustache template (relative to svg-sprite basedir)  [default: "tmpl/css/sprite.html"]
  --css-example-dest             HTML document destination (relative to the --css-dest)  [default: "sprite.css.html"]

  -v, --view                     Activates the «view» mode  [boolean] [default: false]
  --view-dest                    Mode specific output directory  [default: "view"]
  --vl, --view-layout            Sprite layout ("vertical"/"horizontal"/"diagonal"/"packed")  [default: "packed"]
  --view-common                  Common CSS rule selector for all shapes  [default: null]
  --view-mixin                   Preprocessor mixin name with properties for all shapes  [default: null]
  --view-prefix                  CSS selector prefix for all shapes (including placeholders)  [default: ".svg-%s"]
  --view-dimensions              CSS selector suffix for shape dimension rules ("" for inline)  [default: "-dims"]
  --vs, --view-sprite            Sprite path and filename (relative to --view-dest)  [default: "svg/sprite.css.svg"]
  --view-bust                    Enable cache busting  [boolean] [default: true]
  --vcss, --view-render-css      Whether to render a CSS stylesheet  [boolean] [default: false]
  --view-render-css-template     CSS stylesheet Mustache template (relative to svg-sprite basedir)  [default: "tmpl/css/sprite.css"]
  --view-render-css-dest         CSS stylesheet destination (relative to the --view-dest)  [default: "sprite.css"]
  --vscss, --view-render-scss    Whether to render a Sass stylesheet (SCSS)  [boolean] [default: false]
  --view-render-scss-template    Sass stylesheet Mustache template (relative to svg-sprite basedir)  [default: "tmpl/css/sprite.scss"]
  --view-render-scss-dest        Sass stylesheet destination (relative to the --view-dest)  [default: "sprite.scss"]
  --vless, --view-render-less    Whether to render a LESS stylesheet  [boolean] [default: false]
  --view-render-less-template    LESS stylesheet Mustache template (relative to svg-sprite basedir)  [default: "tmpl/css/sprite.less"]
  --view-render-less-dest        LESS stylesheet destination (relative to the --view-dest)  [default: "sprite.less"]
  --vstyl, --view-render-styl    Whether to render a Stylus stylesheet  [boolean] [default: false]
  --view-render-styl-template    Stylus stylesheet Mustache template (relative to svg-sprite basedir)  [default: "tmpl/css/sprite.styl"]
  --view-render-styl-dest        styl stylesheet destination (relative to the --view-dest)  [default: "sprite.styl"]
  --view-render-*                Custom output renderings
  --view-render-*-template       Custom output Mustache template (relative to svg-sprite basedir)
  --view-render-*-dest           Custom output destination (relative to the --view-dest)
  --vx, --view-example           Whether to render an example HTML document  [boolean] [default: false]
  --view-example-template        HTML document Mustache template (relative to svg-sprite basedir)  [default: "tmpl/view/sprite.html"]
  --view-example-dest            HTML document destination (relative to the --view-dest)  [default: "sprite.view.html"]

  -d, --defs                     Activates the «defs» mode  [boolean] [default: false]
  --defs-dest                    Mode specific output directory  [default: "defs"]
  --defs-prefix                  CSS selector prefix for all shapes (including placeholders)  [default: ".svg-%s"]
  --defs-dimensions              CSS selector suffix for shape dimension rules ("" for inline)  [default: "-dims"]
  --ds, --defs-sprite            Sprite path and filename (relative to --defs-dest)  [default: "svg/sprite.css.svg"]
  --defs-bust                    Enable cache busting  [boolean] [default: false]
  --dcss, --defs-render-css      Whether to render a CSS stylesheet  [boolean] [default: false]
  --defs-render-css-template     CSS stylesheet Mustache template (relative to svg-sprite basedir)  [default: "tmpl/css/sprite.css"]
  --defs-render-css-dest         CSS stylesheet destination (relative to the --defs-dest)  [default: "sprite.css"]
  --dscss, --defs-render-scss    Whether to render a Sass stylesheet (SCSS)  [boolean] [default: false]
  --defs-render-scss-template    Sass stylesheet Mustache template (relative to svg-sprite basedir)  [default: "tmpl/css/sprite.scss"]
  --defs-render-scss-dest        Sass stylesheet destination (relative to the --defs-dest)  [default: "sprite.scss"]
  --dless, --defs-render-less    Whether to render a LESS stylesheet  [boolean] [default: false]
  --defs-render-less-template    LESS stylesheet Mustache template (relative to svg-sprite basedir)  [default: "tmpl/css/sprite.less"]
  --defs-render-less-dest        LESS stylesheet destination (relative to the --defs-dest)  [default: "sprite.less"]
  --dstyl, --defs-render-styl    Whether to render a Stylus stylesheet  [boolean] [default: false]
  --defs-render-styl-template    Stylus stylesheet Mustache template (relative to svg-sprite basedir)  [default: "tmpl/css/sprite.styl"]
  --defs-render-styl-dest        styl stylesheet destination (relative to the --defs-dest)  [default: "sprite.styl"]
  --defs-render-*                Custom output renderings
  --defs-render-*-template       Custom output Mustache template (relative to svg-sprite basedir)
  --defs-render-*-dest           Custom output destination (relative to the --defs-dest)
  --di, --defs-inline            Create sprite variant suitable for inline embedding  [boolean] [default: false]
  --dx, --defs-example           Whether to render an example HTML document  [boolean] [default: false]
  --defs-example-template        HTML document Mustache template (relative to svg-sprite basedir)  [default: "tmpl/defs/sprite.html"]
  --defs-example-dest            HTML document destination (relative to the --defs-dest)  [default: "sprite.defs.html"]

  -s, --symbol                   Activates the «symbol» mode  [boolean] [default: false]
  --symbol-dest                  Mode specific output directory  [default: "symbol"]
  --symbol-prefix                CSS selector prefix for all shapes (including placeholders)  [default: ".svg-%s"]
  --symbol-dimensions            CSS selector suffix for shape dimension rules ("" for inline)  [default: "-dims"]
  --ss, --symbol-sprite          Sprite path and filename (relative to --css-dest)  [default: "svg/sprite.css.svg"]
  --symbol-bust                  Enable cache busting  [boolean] [default: false]
  --scss, --symbol-render-css    Whether to render a CSS stylesheet  [boolean] [default: false]
  --symbol-render-css-template   CSS stylesheet Mustache template (relative to svg-sprite basedir)  [default: "tmpl/css/sprite.css"]
  --symbol-render-css-dest       CSS stylesheet destination (relative to the --symbol-dest)  [default: "sprite.css"]
  --sscss, --symbol-render-scss  Whether to render a Sass stylesheet (SCSS)  [boolean] [default: false]
  --symbol-render-scss-template  Sass stylesheet Mustache template (relative to svg-sprite basedir)  [default: "tmpl/css/sprite.scss"]
  --symbol-render-scss-dest      Sass stylesheet destination (relative to the --symbol-dest)  [default: "sprite.scss"]
  --sless, --symbol-render-less  Whether to render a LESS stylesheet  [boolean] [default: false]
  --symbol-render-less-template  LESS stylesheet Mustache template (relative to svg-sprite basedir)  [default: "tmpl/css/sprite.less"]
  --symbol-render-less-dest      LESS stylesheet destination (relative to the --symbol-dest)  [default: "sprite.less"]
  --sstyl, --symbol-render-styl  Whether to render a Stylus stylesheet  [boolean] [default: false]
  --symbol-render-styl-template  Stylus stylesheet Mustache template (relative to svg-sprite basedir)  [default: "tmpl/css/sprite.styl"]
  --symbol-render-styl-dest      styl stylesheet destination (relative to the --symbol-dest)  [default: "sprite.styl"]
  --symbol-render-*              Custom output renderings
  --symbol-render-*-template     Custom output Mustache template (relative to svg-sprite basedir)
  --symbol-render-*-dest         Custom output destination (relative to the --symbol-dest)
  --si, --symbol-inline          Create sprite variant suitable for inline embedding  [boolean] [default: false]
  --sx, --symbol-example         Whether to render an example HTML document  [boolean] [default: false]
  --symbol-example-template      HTML document Mustache template (relative to svg-sprite basedir)  [default: "tmpl/symbol/sprite.html"]
  --symbol-example-dest          HTML document destination (relative to the --css-dest)  [default: "sprite.symbol.html"]

  -S, --stack                    Activates the «stack» mode  [boolean] [default: false]
  --stack-dest                   Mode specific output directory  [default: "stack"]
  --stack-prefix                 CSS selector prefix for all shapes (including placeholders)  [default: ".svg-%s"]
  --stack-dimensions             CSS selector suffix for shape dimension rules ("" for inline)  [default: "-dims"]
  --Ss, --stack-sprite           Sprite path and filename (relative to --css-dest)  [default: "svg/sprite.css.svg"]
  --stack-bust                   Enable cache busting  [boolean] [default: false]
  --Scss, --stack-render-css     Whether to render a CSS stylesheet  [boolean] [default: false]
  --stack-render-css-template    CSS stylesheet Mustache template (relative to svg-sprite basedir)  [default: "tmpl/css/sprite.css"]
  --stack-render-css-dest        CSS stylesheet destination (relative to the --stack-dest)  [default: "sprite.css"]
  --Sscss, --stack-render-scss   Whether to render a Sass stylesheet (SCSS)  [boolean] [default: false]
  --stack-render-scss-template   Sass stylesheet Mustache template (relative to svg-sprite basedir)  [default: "tmpl/css/sprite.scss"]
  --stack-render-scss-dest       Sass stylesheet destination (relative to the --stack-dest)  [default: "sprite.scss"]
  --Sless, --stack-render-less   Whether to render a LESS stylesheet  [boolean] [default: false]
  --stack-render-less-template   LESS stylesheet Mustache template (relative to svg-sprite basedir)  [default: "tmpl/css/sprite.less"]
  --stack-render-less-dest       LESS stylesheet destination (relative to the --stack-dest)  [default: "sprite.less"]
  --Sstyl, --stack-render-styl   Whether to render a Stylus stylesheet  [boolean] [default: false]
  --stack-render-styl-template   Stylus stylesheet Mustache template (relative to svg-sprite basedir)  [default: "tmpl/css/sprite.styl"]
  --stack-render-styl-dest       styl stylesheet destination (relative to the --stack-dest)  [default: "sprite.styl"]
  --stack-render-*               Custom output renderings
  --stack-render-*-template      Custom output Mustache template (relative to svg-sprite basedir)
  --stack-render-*-dest          Custom output destination (relative to the --stack-dest)
  --Sx, --stack-example          Whether to render an example HTML document  [boolean] [default: false]
  --stack-example-template       HTML document Mustache template (relative to svg-sprite basedir)  [default: "tmpl/stack/sprite.html"]
  --stack-example-dest           HTML document destination (relative to the --css-dest)  [default: "sprite.stack.html"]

  --variables                    Path to external JSON file with Mustache variable definitions
```

### Examples

Both the following commands are doing the same (with the second one using the shorter argument syntax): They use the SVG files found in the directory `"assets"`, create a CSS sprite of them and write them to the subdirectory `"out"` along with accompanying CSS stylesheets.

```bash
svg-sprite --css --css-render-css --css-example --dest=out assets/*.svg
# or
svg-sprite -cD out --ccss --cx assets/*.svg
```

The next one renders a Sass stylesheet (instead of plain CSS) and adds a 10px padding around all shapes in the sprite:

```bash
svg-sprite -cD out --cscss -p 10 assets/*.svg
```

Using config file (config.json in project base path) instead of command-line options. A config file can be generated [with the online configurator](https://svg-sprite.github.io/svg-sprite/#json).

```bash
svg-sprite --config config.json assets/*.svg
```

### Advanced globbing

Some shells don't support the double-star character `**` for matching files in an arbitrary directory depth, so you should wrap your glob expression in single quotes when using it in your pattern. This will prevent your shell from trying to resolve it and rather delegate globbing to Node instead (which does support the `**` character).

```bash
svg-sprite --config config.json 'assets/**/*.svg'
```

The CLI typically uses only the basename of files for constructing the shape IDs in your sprite. That is, if an SVG source file is found at the path `assets/path/to/source.svg`, the shape inside the sprite will have the ID `source`. If you want to set a "base directory" from where ID traversal should start, simply add a symbolic link to that very same directory (`"./"`) in your pattern:

```bash
svg-sprite --config config.json 'assets/./**/*.svg'
```

The spriter will then use `path/to/source` for ID creation, resulting in the shape ID `path--to--source` (assuming you don't override the default shape ID generator function). Please be aware that the described feature won't work if the matched SVG files are symbolic links themselves.

### Inlined shape dimensions

To get the shape dimensions inlined into the main shape CSS rules, you need to pass an empty dimension selector suffix. There are two ways of doing so:

```bash
svg-sprite -cD out --css-dimensions "" --ccss assets/*.svg
# or
svg-sprite -cD out --css-dimensions= --ccss assets/*.svg
```


[npm-url]: https://npmjs.org/package/svg-sprite
[npm-image]: https://img.shields.io/npm/v/svg-sprite

[ci-url]: https://github.com/svg-sprite/svg-sprite/actions?query=workflow%3ATests+branch%3Amaster
[ci-image]: https://img.shields.io/github/workflow/status/svg-sprite/svg-sprite/Tests/master

[coveralls-url]: https://coveralls.io/github/svg-sprite/svg-sprite?branch=master
[coveralls-image]: https://img.shields.io/coveralls/github/svg-sprite/svg-sprite/master

[depstat-url]: https://david-dm.org/svg-sprite/svg-sprite
[depstat-image]: https://img.shields.io/david/svg-sprite/svg-sprite
[devdepstat-url]: https://david-dm.org/svg-sprite/svg-sprite?type=dev
[devdepstat-image]: https://img.shields.io/david/dev/svg-sprite/svg-sprite
