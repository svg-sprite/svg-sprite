/*
 * grunt-svg-sprite
 * https://github.com/jkphl/grunt-svg-sprite
 *
 * Copyright (c) 2015 Joschi Kuphal <joschi@kuphal.net>
 * Licensed under the MIT license.
 */

'use strict';

/**
 * Encode all HTML entities in a string
 * 
 * @param {String} str			String
 * @return {String}				Encoded string
 */
function htmlentities(str) {
	return str.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
	   return '&#'+i.charCodeAt(0)+';';
	});
}

module.exports = function(grunt) {
	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

	// Project configuration.
	grunt.initConfig({
		
		sass					: {
			options				: {
				sourceMap		: true
			},
			dist				: {
				files			: [{
					expand		: true,
					cwd			: 'src',
		 			src			: ['*.scss'],
					dest		: 'stylesheets',
					ext			: '.css'
				}],
				options: {
					sourcemap	: true,
					style		: 'nested'
				}
			}
		},
		
		autoprefixer			: {
			options				: {
				browsers		: ['last 3 versions', 'ie 8'],
				map				: true
			},
			dist				: {
				src				: ['stylesheets/03_configurator.css']
			},
		},
		
		cssmin					: {
			dist				: {
				src				: ['stylesheets/stylesheet.css', 'stylesheets/03_configurator.css'],
				dest			: 'stylesheets/main.min.css'
			}
		},
		
		yaml : {
			dist : {
				files : {
					'src/02_config.json' : ['src/02_config.yaml']
				}
			}
		},
		
		includereplace : {
			html : {
				options : {
					processIncludeContents: htmlentities
				},
				src : 'src/00_index.html',
				dest : 'index.html'
			},
			javascript : {
				options : {
//					prefix: '$$'
				},
				src : 'src/01_configurator.js',
				dest : 'javascripts/main.js'
			}
		},
		
		uglify : {
			dist : {
				files : {
					'javascripts/main.min.js': ['javascripts/main.js']
				}
			}
		},
		
		watch : {
			yaml : {
				files : ['src/*.yaml'],
				tasks : ['compile'],
				options : {
					spawn : true
				}
			},

			html : {
				files : ['src/*.html'],
				tasks : ['includereplace'],
				options : {
					spawn : true
				}
			},

			javascript : {
				files : ['src/*.js', 'src/*.json'],
				tasks : ['includereplace', 'uglify'],
				options : {
					spawn : true
				}
			},

			scss : {
				files : ['src/*.scss'],
				tasks : ['sass'],
				options : {
					spawn : true
				}
			},

			css : {
				files : ['stylesheets/*.css', '!stylesheets/*.min.css'],
				tasks : ['autoprefixer', 'cssmin'],
				options : {
					spawn : true
				}
			},
			
			grunt: {
				files: ['Gruntfile.js'],
			    options: {
			      reload: true
			    }
			}
		}
	});
	grunt.registerTask('compile', ['yaml', 'includereplace', 'uglify']);
	grunt.registerTask('css', ['sass', 'autoprefixer', 'cssmin']);
	grunt.registerTask('default', ['compile', 'css']);
};
