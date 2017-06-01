## 1.3.7 Bugfix release (2017-06-01)

**This is going to be the final release in the 1.x line (except someone encounters some severe issues).** 

* Updated dependencies
* Fixed invalid markup in `<defs>` example html ([#229](https://github.com/jkphl/svg-sprite/issues/229))
* Fallback for failing CPU detection ([#217](https://github.com/jkphl/svg-sprite/pull/217))
* Fixed broken SVGO configuration in CLI ([#216](https://github.com/jkphl/svg-sprite/pull/216), [#199](https://github.com/jkphl/svg-sprite/issues/199))
* Added glob base directory option to CLI ([#220](https://github.com/jkphl/svg-sprite/issues/220))
* Fixed broken `rootAttributes` option in CLI ([#228](https://github.com/jkphl/svg-sprite/issues/228))

## 1.3.6 Bugfix release (2016-08-29)
* Updated dependencies
* Fixed LESS template mixin call ([#187](https://github.com/jkphl/svg-sprite/pull/187))
* Fixed broken keyframe animation support ([gulp-svg-sprite #63](https://github.com/jkphl/gulp-svg-sprite/issues/63))

## 1.3.5 Bugfix release (2016-08-15)
* Fixed file name regression bug ([#186](https://github.com/jkphl/svg-sprite/issues/186))

## 1.3.4 Bugfix release (2016-08-12)
* Updated dependencies
* Extended the ID generator callback signature ([#176](https://github.com/jkphl/svg-sprite/issues/176))
* Improved usage pattern example ([#177](https://github.com/jkphl/svg-sprite/issues/177))
* Added support for mode shorthand definitions in CLI mode ([#183](https://github.com/jkphl/svg-sprite/issues/183))

## 1.3.3 Bugfix release (2016-04-28)
* Fixed CLI regression bug ([#173](https://github.com/jkphl/svg-sprite/issues/173))
* Fixed CLI root attributes file handling ([#144](https://github.com/jkphl/svg-sprite/issues/144))

## 1.3.2 Feature release (2016-04-27)
* Updated dependencies
* Restored documentation image ([#168](https://github.com/jkphl/svg-sprite/issues/168))
* Added CLI rendering options for defs/symbol/stack sprites ([#160](https://github.com/jkphl/svg-sprite/issues/160))
* Added CLI option for external JSON config file ([#160](https://github.com/jkphl/svg-sprite/issues/160), [#165](https://github.com/jkphl/svg-sprite/issues/165))

## 1.3.1 Bugfix release (2016-04-17)
* Fixed modeless run ([#158](https://github.com/jkphl/svg-sprite/issues/158), [gulp-svg-sprite #42](https://github.com/jkphl/gulp-svg-sprite/issues/42))
* Fixed broken shape dimension attribute removal in symbol mode ([gulp-svg-sprite #51](https://github.com/jkphl/gulp-svg-sprite/issues/51))

## 1.3.0 Major maintenance release (2016-04-14)
* Updated dependencies
* ~~Tweaked .gitignore to ignore symlinked test files (closes #140)~~ Reverted & made the files real copies
* Updated documentation ([grunt-svg-sprite #69](https://github.com/jkphl/grunt-svg-sprite/issues/69))
* Removed redundant require ([#156](https://github.com/jkphl/svg-sprite/issues/156))
* Dropped support for Node.js < 4.0 and io.js
* Added explicit sprite size in example document ([#138](https://github.com/jkphl/svg-sprite/issues/138))
* Added XML entity resolution ([#118](https://github.com/jkphl/svg-sprite/issues/118))
* Allow multiple selectors for ID / class namespacing ([#109](https://github.com/jkphl/svg-sprite/issues/109))
* Switched to [patched svg2png](https://github.com/domenic/svg2png/pull/45) until media queries are properly supported (devDependencies)

## 1.2.19 Maintenance release (2016-01-11)
* Updated dependencies
* Temporarily fixed xmldom dependency problem ([#135](https://github.com/jkphl/svg-sprite/issues/135))

## 1.2.18 Maintenance release (2016-01-05)
* Updated dependencies
* Fixed inline embedding link in example templates ([#130](https://github.com/jkphl/svg-sprite/issues/130))
* Fixed broken Less mixin support ([#133](https://github.com/jkphl/svg-sprite/issues/133))
* Introduced support for custom shape orders ([#131](https://github.com/jkphl/svg-sprite/issues/131))

## 1.2.17 Maintenance release (2015-12-17)
* Updated dependencies

## 1.2.16 Maintenance release (2015-12-01)
* Updated dependencies
* Improved log level config handling ([#124](https://github.com/jkphl/svg-sprite/issues/124))
* Wrapped CSS url()s in quotes ([#125](https://github.com/jkphl/svg-sprite/issues/125))

## 1.2.15 Maintenance release (2015-11-24)
* Updated dependencies

## 1.2.14 Bugfix release (2015-11-17)
* Updated dependencies & test fixture
* Added Node.js versions 4 & 5 to Travis tests
* Fixed broken svg4everybody links ([#122](https://github.com/jkphl/svg-sprite/issues/122), [gulp-svg-sprite #39](https://github.com/jkphl/gulp-svg-sprite/issues/39))

## 1.2.13 Maintenance release (2015-11-06)
* Updated dependencies
* Support for source files outside the cwd ([grunt-svg-sprite #62](https://github.com/jkphl/grunt-svg-sprite/issues/62))

## 1.2.12 Maintenance release (2015-10-24)
* Updated dependencies
* Dropped example file extension restriction ([#119](https://github.com/jkphl/svg-sprite/issues/119))

## 1.2.11 Maintenance release (2015-10-07)
* Updated dependencies

## 1.2.10 Maintenance release (2015-08-19)
* Updated dependencies
* Added browser compatibility hint ([#106](https://github.com/jkphl/svg-sprite/issues/106))
* Added accessibility features to symbol sprites ([#107](https://github.com/jkphl/svg-sprite/issues/107))

## 1.2.9 Bugfix release (2015-08-19)
* Updated dependencies
* Fixed broken `classname` rendering function ([#71](https://github.com/jkphl/svg-sprite/pull/71))

## 1.2.8 Feature release (2015-08-12)
* Updated dependencies
* Introduced CSS positioning values floating point precision ([#102](https://github.com/jkphl/svg-sprite/issues/102))

## 1.2.7 Maintenance release (2015-07-29)
* Updated dependencies
* Fixed error in symbol example template ([#99](https://github.com/jkphl/svg-sprite/pull/99))

## 1.2.6 Feature release (2015-07-17)
* Updated dependencies
* Added CSS class namespacing ([#42](https://github.com/jkphl/svg-sprite/issues/42))

## 1.2.5 Maintenance release (2015-06-24)
* Updated dependencies
* Changed sprite file name handling ([#97](https://github.com/jkphl/svg-sprite/issues/97))

## 1.2.4 Bugfix release (2015-06-17)
* Updated dependencies
* Fixed invalid SVG validation regex ([#94](https://github.com/jkphl/svg-sprite/issues/94))

## 1.2.3 Bugfix release (2015-06-08)
* Fixed string conversion regression ([#89](https://github.com/jkphl/svg-sprite/issues/89))
* Updated dependencies

## 1.2.2 Feature release (2015-06-05)
* Introduced "icon" box sizing strategy ([#57](https://github.com/jkphl/svg-sprite/pull/57), [grunt-svg-sprite #35](https://github.com/jkphl/grunt-svg-sprite/issues/35#issuecomment-74232726))

## 1.2.1 Bugfix release (2015-06-04)
* Fixed broken NPM publish settings

## 1.2.0 Feature release (2015-06-04)
* Updated dependencies & development dependencies ([#67](https://github.com/jkphl/svg-sprite/pull/67), [#82](https://github.com/jkphl/svg-sprite/issues/82))
* Relocated the shape transformations list config option
* Added custom root attributes support ([#87](https://github.com/jkphl/svg-sprite/issues/87))
* Introduced a global post-processing transformation option ([#64](https://github.com/jkphl/svg-sprite/issues/64), [#87](https://github.com/jkphl/svg-sprite/issues/87))

## 1.1.2 Bugfix release (2015-04-22)
* Fixed symbol example template regression bug ([#70](https://github.com/jkphl/svg-sprite/issues/70#issuecomment-95307588))
* Added mixin option to CLI arguments
* Fixed boolean CLI argument notation ([#76](https://github.com/jkphl/svg-sprite/issues/76))
* Added whitespace replacement for shape IDs ([#77](https://github.com/jkphl/svg-sprite/issues/77))

## 1.1.1 Bugfix release (2015-04-19)
* Updated dependencies & development dependencies
* Added viewBox attribute to SVG stacks ([#73](https://github.com/jkphl/svg-sprite/issues/73))
* Fixed example document path resolution bug ([#70](https://github.com/jkphl/svg-sprite/issues/70))
* Allow negative viewBox values ([#72](https://github.com/jkphl/svg-sprite/pull/72))
* Fixed symbol example document ([#71](https://github.com/jkphl/svg-sprite/pull/71))
* Improved error log for invalid SVG files ([#69](https://github.com/jkphl/svg-sprite/issues/69))

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
