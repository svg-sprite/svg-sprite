'use strict';

var gulp     = require('gulp'),
svgSprite    = require('gulp-svg-sprite'),
plumber      = require('gulp-plumber'),
baseDir      = 'svg/base/dir',   // <-- Set to your SVG base directory
svgGlob      = '**/*.svg',       // <-- Glob to match your SVG files
outDir       = 'output/dir',     // <-- Main output directory
config       = $$config$$;

module.exports = function(grunt) {

    // Project configuration
    grunt.initConfig({

        // svg-sprite configuration
        svg_sprite        : {
            dist          : {
                expand    : true,
                cwd       : baseDir,
                src       : [svgGlob],
                dest      : outDir,
                options   : config
            }
        }
    });

    // These plugins provide necessary tasks
    grunt.loadNpmTasks('grunt-svg-sprite');

    // By default, compile the sprite(s)
    grunt.registerTask('default', ['svg_sprite']);
};