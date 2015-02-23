'use strict';

var gulp     = require('gulp'),
svgSprite    = require('gulp-svg-sprite'),
plumber      = require('gulp-plumber'),
baseDir      = 'svg/base/dir',   // <-- Set to your SVG base directory
svgGlob      = '**/*.svg',       // <-- Glob to match your SVG files
outDir       = 'output/dir',     // <-- Main output directory
config       = $$config$$;

gulp.task('svgsprite', function() {
    return gulp.src(svgGlob, {cwd: baseDir})
        .pipe(plumber())
        .pipe(svgSprite(config)).on('error', function(error){ console.log(error); })
        .pipe(gulp.dest(outDir))
});