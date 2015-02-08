svg-sprite [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url]  [![Coverage Status][coveralls-image]][coveralls-url] [![Dependency Status][depstat-image]][depstat-url]
==========

# Basic usage pattern

The examples below are simplified for the sake of clarity. Prerequisites like `require`s or the [configuration](configuration.md) (`config`) have been omitted.

## Standard API 

```javascript
// Create spriter instance
var spriter       = new SVGSpriter(config);

// Add SVG source files — the manual way ...
spriter.add('assets/svg-1.svg', null, fs.readFileSync('assets/svg-1.svg', {encoding: 'utf-8'}));
spriter.add('assets/svg-2.svg', null, fs.readFileSync('assets/svg-2.svg', {encoding: 'utf-8'}));
	/* ... */

// Compile sprite
spriter.compile(function(error, result) {
	/* ... Write `result` files to disk or do whatever with them ... */
});
```

## Grunt task (using [grunt-svg-sprite](https://github.com/jkphl/grunt-svg-sprite))

```javascript
// svg-sprite Grunt task

grunt.initConfig({
	svg_sprite				: {
		minimal				: {
			src				: ['assets/**/*.svg'],
			dest			: 'out',
			options			: config
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

Legal
-----
Copyright © 2015 Joschi Kuphal <joschi@kuphal.net> / [@jkphl](https://twitter.com/jkphl)

*svg-sprite* is licensed under the terms of the [MIT license](LICENSE.txt).

The contained example SVG icons are part of the [Tango Icon Library](http://tango.freedesktop.org/Tango_Icon_Library) and belong to the Public Domain.


[npm-url]: https://npmjs.org/package/svg-sprite
[npm-image]: https://badge.fury.io/js/svg-sprite.png

[travis-url]: http://travis-ci.org/jkphl/svg-sprite
[travis-image]: https://secure.travis-ci.org/jkphl/svg-sprite.png

[coveralls-url]: https://coveralls.io/r/jkphl/svg-sprite
[coveralls-image]: https://img.shields.io/coveralls/jkphl/svg-sprite.svg

[depstat-url]: https://david-dm.org/jkphl/svg-sprite
[depstat-image]: https://david-dm.org/jkphl/svg-sprite.svg