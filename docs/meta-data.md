# svg-sprite

[![npm version][npm-image]][npm-url] [![npm downloads][npm-downloads]][npm-url] [![Build Status][ci-image]][ci-url] [![Coverage Status][coveralls-image]][coveralls-url]

This file is part of the documentation of *svg-sprite* — a free low-level Node.js module that **takes a bunch of SVG files**, optimizes them and creates **SVG sprites** of several types. The package is [hosted on GitHub](https://github.com/svg-sprite/svg-sprite).


## Meta data injection

By providing a simple [YAML](https://yaml.org/) file via the `shape.meta` configuration property, you can **inject titles and descriptions** into your SVG files before they get compiled as a sprite. Doing so may improve the accessibility of your SVGs. Please see the articles by [The Paciello Group](https://www.tpgi.com/using-aria-enhance-svg-accessibility/) and [Jonathan Neal](https://github.com/jonathantneal/svg4everybody#readability-and-accessibility) on how to use your SVG sprites in a most accessible way.

### File structure

The YAML file needs to look like this:

```yaml
"path/to/rectangle.svg":
    title: "Green rectangle"
    description: "A light green rectangle with rounded corners and a dark green border"

path--to--circle:
    title: "Red circle"
    description: "A red circle with a black border"
```

The keys need to match either

* the **"local" file path part** of the SVG files you [register to the spriter](api.md#svgspriteraddfile--name-svg-) or
* the final **shape IDs / CSS class names** as returned by the `id.generator` function.

### SVG results

For each of your shapes, *svg-sprite* will look for `title` and `description` keys and inject their values like this:

```xml
<svg aria-labelledby="title desc">
    <title id="title">Green rectangle</title>
    <desc id="desc">A light green rectangle with rounded corners and a dark green border</desc>
    <rect width="75" height="50" rx="20" ry="20" fill="#90ee90" stroke="#228b22" stroke-fill="1" />
</svg>
```

Please be aware that existing `<title>` and `<description>` elements in the SVG files will be overridden. Also, even without the `meta` file being specified, *svg-sprite* will try to find these two elements in your files and set the `aria-labelledby` attribute accordingly.


[npm-url]: https://www.npmjs.com/package/svg-sprite
[npm-image]: https://img.shields.io/npm/v/svg-sprite
[npm-downloads]: https://img.shields.io/npm/dm/svg-sprite.svg

[ci-url]: https://github.com/svg-sprite/svg-sprite/actions?query=workflow%3ATests+branch%3Amain
[ci-image]: https://img.shields.io/github/workflow/status/svg-sprite/svg-sprite/Tests/main?label=CI&logo=github

[coveralls-url]: https://coveralls.io/github/svg-sprite/svg-sprite?branch=main
[coveralls-image]: https://img.shields.io/coveralls/github/svg-sprite/svg-sprite/main
