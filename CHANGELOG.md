## 1.1.0 Maintenance release (2015-04-04)
* Updated dependencies & development dependencies
* Added mixin option ([#66](https://github.com/jkphl/svg-sprite/issues/66); ATTENTION: May break custom templates!)
* Node.js 0.12 compatibility

## 1.0.20 Bugfix release (2015-03-28)
* Updated dependencies
* Fixed several CLI bugs ([#65](https://github.com/jkphl/svg-sprite/issues/65))

## 1.0.19 Maintenance release (2015-03-08)
* Changed alias for shape.dest CLI option
* Updated dependencies
* Fixed ID bug with view sprites
* Fixed sprite CSS path calculation

## 1.0.18 Bugfix release (2015-02-20)
* Removed excessive console output

## 1.0.17 Maintenance release (2015-02-20)
* Optimized stylesheet templates
* Introduced boolean hasCommon template variable
* Updated dependencies
* Fixed incomplete dimension CSS selector suffix ([grunt-svg-sprite #31](https://github.com/jkphl/grunt-svg-sprite/issues/31))

## 1.0.16 Bugfix release (2015-02-11)
* Fixed broken previous release

## 1.0.15 Bugfix release (2015-02-11)
* Fixed missing file extensions with CSS resources ([#54](https://github.com/jkphl/svg-sprite/issues/54))
* Fixed broken sprite URL in css/view example HTML documents ([#53](https://github.com/jkphl/svg-sprite/issues/53))
* Fixed wrong base path for intermediate SVG shapes
* Removed the automatic dot prefix for CSS selectors ([#55](https://github.com/jkphl/svg-sprite/issues/55))

## 1.0.14 Maintenance release (2015-02-08)
* Restructured documentation
* Updated dependencies
* Fixed error with falsy rendering configurations ([#52](https://github.com/jkphl/svg-sprite/issues/52))

## 1.0.13 Maintenance release (2015-01-28)
* Fixed windows path separator bug ([gulp-svg-sprite #6](https://github.com/jkphl/gulp-svg-sprite/issues/6))
* Made dimension attributes (width & height) optional ([#45](https://github.com/jkphl/svg-sprite/issues/45))
* Added cache busting option for non-CSS sprites ([#48](https://github.com/jkphl/svg-sprite/issues/48))

## 1.0.12 Feature release (2015-01-27)
* Added dimension CSS output for non-CSS sprites ([#45](https://github.com/jkphl/svg-sprite/issues/45))
* Bumped lodash dependency version (#44)

## 1.0.11 Bugfix release
* Fixed coordinate distortion in CSS sprites ([#41](https://github.com/jkphl/svg-sprite/issues/41))

## 1.0.10 Maintenance release
* Added support for custom mode keys
* Fixed external CLI transform configuration support
* Fixed typos in README example ([PR #39](https://github.com/jkphl/svg-sprite/pull/39))
* Added support for Windows file name globbing ([#40](https://github.com/jkphl/svg-sprite/issues/40))

## 1.0.9 Maintenance release
* Updated dependencies
* Introduced `svg` getter in templating shape variables
* Fixed broken dimension argument in CLI version ([#38](https://github.com/jkphl/svg-sprite/issues/38))
* Fixed logging error in SVGO optimization
* Fixed missing XML namespaces in SVG stack 
* Fixed cache busting errors with example HTML document 

## 1.0.8 Bugfix release
* Fixed broken rendering template path resolution ([grunt-svg-sprite #29](https://github.com/jkphl/grunt-svg-sprite/issues/29))

## 1.0.7 Feature release
* Improved error handling
* Improved XML & DOCTYPE declaration handling and fixed ([grunt-svg-sprite #28](https://github.com/jkphl/grunt-svg-sprite/issues/28))

## 1.0.6 Feature release
* Made shape ID namespacing configurable ([grunt-svg-sprite #27](https://github.com/jkphl/grunt-svg-sprite/issues/27))
* Added extended alignment options ([#33](https://github.com/jkphl/svg-sprite/issues/33))

## 1.0.5 Bufix release
* Fixed regression bug with SVG stacks
* Added support for ID generator templates in CLI version ([#37](https://github.com/jkphl/svg-sprite/issues/37))

## 1.0.4 Bufix release
* Fixed XML & doctype declaration bug with inline sprites ([gulp-svg-sprite #2](https://github.com/jkphl/gulp-svg-sprite/issues/2))
* Added support for ID generator templates ([#37](https://github.com/jkphl/svg-sprite/issues/37))

## 1.0.3 Bufix release
* Fixed dependency error ([#36](https://github.com/jkphl/svg-sprite/issues/36))

## 1.0.2 Maintenance release
* Improved error handling

## 1.0.1 Maintenance release
* Updated module depencencies

## 1.0.0 Next generation release
* Rewritten from scratch ([#23](https://github.com/jkphl/svg-sprite/issues/23), [#30](https://github.com/jkphl/svg-sprite/issues/30))
* Dropped [libxmljs](https://github.com/polotek/libxmljs) dependency for improving Windows support (e.g. [grunt-svg-sprite #14](https://github.com/jkphl/grunt-svg-sprite/issues/14))
* Added support for `view`, `symbol` and `stack` modes ([#27](https://github.com/jkphl/svg-sprite/issues/27), [#35](https://github.com/jkphl/svg-sprite/issues/35), [grunt-svg-sprite #24](https://github.com/jkphl/grunt-svg-sprite/issues/24))
* Strip off all file access methods, making the module a good basis for 3rd party tools (like Grunt & Gulp plugins) ([#21](https://github.com/jkphl/svg-sprite/issues/21), [#25](https://github.com/jkphl/svg-sprite/issues/25))
* Improved command line version ([#34](https://github.com/jkphl/svg-sprite/issues/34))
* Switched to relative positioning in CSS sprites ([grunt-svg-sprite #23](https://github.com/jkphl/grunt-svg-sprite/issues/23))
* Made the configuration of Mustache templates and destinations more intuitive
* Enabled customization of shape IDs
* Enabled custom SVG transformations
* Enhanced `padding` options ([#24](https://github.com/jkphl/svg-sprite/issues/24))
* Added cache busting for `css` and `view` mode (enabled by default; [#29](https://github.com/jkphl/svg-sprite/pull/29))
* Added support for [meta data injection](#a1-meta-data-injection)

For older release notes please [see here](https://github.com/jkphl/svg-sprite/tree/bbd051e940e7b6373ed56277251a8affb03b1c10#release-history).

About
=====

The [original svg-sprite](https://github.com/jkphl/svg-sprite/tree/bbd051e940e7b6373ed56277251a8affb03b1c10) was my first-ever Node.js module and featured CSS sprites only. The `1.0` release is **rewritten from scratch** and introduces a bunch of new features like **less dependencies** (for improved Mac OS and Windows compatibility), support for **inline sprite formats** and the **removal of file-system access** so that other libraries can build on top of it more easily. Derived libraries include:

* [grunt-svg-sprite](https://github.com/jkphl/grunt-svg-sprite) (a [Grunt](http://gruntjs.com) wrapper around *svg-sprite*)
* [gulp-svg-sprite](https://github.com/jkphl/gulp-svg-sprite) (a [Gulp](http://gulpjs.com) wrapper around *svg-sprite*)
* [svg-sprite-data](https://github.com/shakyShane/svg-sprite-data) by [Shane Osbourne](https://github.com/shakyShane) (based on the original svg-sprite)

**_iconizr_**, another project of mine, is based on *svg-sprite* and adds PNG fallbacks for the sprites so you can use them as universal icon systems for websites ([Node.js module](https://github.com/jkphl/node-iconizr), [Grunt plugin](https://github.com/jkphl/grunt-iconizr), [PHP version](https://github.com/jkphl/iconizr) and [online service](http://iconizr.com)).