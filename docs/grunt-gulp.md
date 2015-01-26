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

## Grunt task ([grunt-svg-sprite](https://github.com/jkphl/grunt-svg-sprite))

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

## Gulp task ([gulp-svg-sprite](https://github.com/jkphl/gulp-svg-sprite))

```javascript
// svg-sprite Gulp task

gulp.src('assets/*.svg')
	.pipe(svgSprite(config))
	.pipe(gulp.dest('out'));
```