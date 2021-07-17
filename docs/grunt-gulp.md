svg-sprite [![NPM version][npm-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Dependency Status][depstat-image]][depstat-url] [![Development Dependency Status][devdepstat-image]][devdepstat-url]
==========

This file is part of the documentation of *svg-sprite* — a free low-level Node.js module that **takes a bunch of SVG files**, optimizes them and creates **SVG sprites** of several types. The package is [hosted on GitHub](https://github.com/jkphl/svg-sprite).


# Grunt & Gulp wrappers

This document aims to compare the use of *svg-sprite* via it's [standard API](api.md) with the use of wrappers like the ones for Grunt and Gulp. The following examples are equivalent and have been simplified for the sake of clarity. Prerequisites like the necessary `require` calls or the construction of a [main configuration](configuration.md) object (`config`) have been omitted.

## Standard API 

```javascript
// Create spriter instance
var spriter = new SVGSpriter(config);

// Add SVG source files — the manual way ...
spriter.add('assets/svg-1.svg', null, fs.readFileSync('assets/svg-1.svg', { encoding: 'utf-8' }));
spriter.add('assets/svg-2.svg', null, fs.readFileSync('assets/svg-2.svg', { encoding: 'utf-8' }));
/* ... */

// Compile sprite
spriter.compile(function (error, result) {
    /* ... Write `result` files to disk or do whatever with them ... */
});
```

## Grunt task (using [grunt-svg-sprite](https://github.com/jkphl/grunt-svg-sprite))

```javascript
// svg-sprite Grunt task

grunt.initConfig({
    svg_sprite: {
        minimal: {
            src: ['assets/**/*.svg'],
            dest: 'out',
            options: config
        },
    },
});
```

## Gulp task (using [gulp-svg-sprite](https://github.com/jkphl/gulp-svg-sprite))

```javascript
// svg-sprite Gulp task

gulp.src('assets/*.svg')
    .pipe(svgSprite(config))
    .pipe(gulp.dest('out'));
```


[npm-url]: https://npmjs.org/package/svg-sprite
[npm-image]: https://img.shields.io/npm/v/svg-sprite

[ci-url]: https://github.com/jkphl/svg-sprite/actions?query=workflow%3ATests+branch%3A1.5.x
[ci-image]: https://github.com/jkphl/svg-sprite/workflows/Tests/badge.svg?branch=1.5.x

[coveralls-url]: https://coveralls.io/github/jkphl/svg-sprite?branch=1.5.x
[coveralls-image]: https://img.shields.io/coveralls/github/jkphl/svg-sprite/1.5.x

[depstat-url]: https://david-dm.org/jkphl/svg-sprite
[depstat-image]: https://img.shields.io/david/jkphl/svg-sprite
[devdepstat-url]: https://david-dm.org/jkphl/svg-sprite?type=dev
[devdepstat-image]: https://img.shields.io/david/dev/jkphl/svg-sprite
