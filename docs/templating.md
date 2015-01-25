### F. Templating variables

#### F.1 Sprite & shape variables

For each sprite generation process, a data object is constructed that is passed to the [Mustache](http://mustache.github.io/) templating engine for rendering the different resources. You can access these templating values via the `data` argument passed to the [compile() callback](#svgspritercompile-config--callback-). Example:  

```javascript
{  
	// Data object for the `mymode` output key
	mymode						: {
	
		// Name of the current output mode
		mode					: 'css',
		
		// Key used for result files & data
		key						: 'mymode',
		
		// CSS class name for `common` sprite shape properties (or NULL if disabled)
		common					: null,
		
		// Mixin name for `common` properties (identical to `common`, defaulting to 'svg-common' if disabled)
		mixin					: 'svg-common',
		
		// Whether to create shape dimensioning CSS rules 
		includeDimensions		: true,
		
		// Padding added to each shape (pixel)
		padding					: {top: 30, right: 30, bottom: 30, left: 30},
		
		// Overall sprite width (pixel)
		spriteWidth				: 860,
		
		// Overall sprite height (pixel)
		spriteHeight			: 1020,
		
		// Relative path from the stylesheet resource to the SVG sprite
		sprite					: 'svg/sprite.css.svg',
		
		// Relative path from the example resource to the SVG sprite (if configured)
		example					: 'svg/sprite.css.svg'
		
		// List of all shapes in the sprite
		shapes					: [
		
			// Single shape properties
			{  
			
				// Shape name (possibly including state, e.g. "weather-clear-night~hover")
				name			: 'weather-clear-night',
				
				// Shape name excluding the state
				base			: 'weather-clear-night',
				
				// Shape width (pixel)
				width			: {  
					
					// Excluding padding
					inner		: 800,
					
					// Including padding
					outer		: 860
				},
				
				// Shape height (pixel)
				height			: {
				
					// Excluding padding
					inner		: 960,
					
					// Including padding
					outer		: 1020
				},
				
				// First shape in the sprite
				first			: true,
				
				// Last shape in the sprite
				last			: false,
				
				// Shape position within the sprite
				position		: {  
				
					// Absolute position (pixel)
					absolute	: {
					
						// Horizontal position  
						x		: 0,
						
						// Horizontal position
						y		: -120,
						
						// Compound position
						xy		: '0 -120px'
					},
					
					// Relative position (%)
					relative	: { 
						
						// Horizontal position  
						x		: 0,
						
						// Vertical position
						y		: 33.333333,
						
						// Compound position
						xy		: '0 33.333333%'
					}
				},
				
				// CSS selectors
				selector		: {
				
					// Shape positioning CSS rule
					shape		: [  
						{  
							expression		: '.svg-weather-clear-night',
							raw				: '.svg-weather-clear-night',
							first			: true,									// First selector expression
							last			: false
						},
						{  
							expression		: '.svg-weather-clear-night\\:regular',
							raw				: '.svg-weather-clear-night:regular',	// Unescaped version
							first			: false,
							last			: true									// Last selector expression
						}
					],
					
					// Shape dimensioning CSS rule
					dimensions	: [  
						{  
							expression		: '.svg-weather-clear-night-dims',
							raw				: '.svg-weather-clear-night-dims',
							first			: true,									// First selector expression
							last			: true									// Last selector expression
						}
					]
				},
				
				// Dimensioning rule strategy
				dimensions		: {  
				
					// Render dimensions as part of positioning rule
					inline		: false,
					
					// Render dimensions as separate dimensioning rule
					extra		: true
				},
				
				// Shape SVG (inline embeddable version)
				svg				: '<svg> ... </svg>',
			}
		],
		
		// Current date (RFC-1123)
		date					: 'Fri, 26 Dec 2014 12:06:55 GMT',
	}
}
```

#### F.2 Custom variables & functions

The top-level `variables` object lets you define global variables that are passed to all [Mustache](http://mustache.github.io/) templating processes (across all output modes). You may either use scalar values or callbacks (see [here](https://github.com/janl/mustache.js/#functions) for details). Example:

```javascript
{
	variables	: {
		now		: +new Date(),
		png		: function() {
			return function(sprite, render) {
				return render(sprite).split('.svg').join('.png');
			}
		}
	}
}
```

#### F.3 Builtin templating functions

There are a couple of functions directly built into *svg-sprite*. You may use them in any template.

##### F.3.1 `date`

Takes no arguments and returns the current date and time as GMT string (e.g. *Mon, 22 Dec 2014 16:18:53 GMT*).

```html
<p>Generated at {{date}} by svg-sprite</p>
```

##### F.3.2 `invert`

Returns the negative value of a floating point number.

```css
.offset-background {
	background-position: {{#invert}}{{positionX}}{{/invert}}px {{#invert}}{{positionY}}{{/invert}}px;
}
```

##### F.3.3 `classname`

Returns the innermost part of a CSS selector as a class name (with the leading dot stripped off). For instance, if `fullselector` had the value *.svg .icon-cart*,

```html
<i class="{{#classname}}{{fullselector}}{{/classname}}">Cart</i>
```

would become

```html
<i class="icon-cart">Cart</i>
```

##### F.3.4 `escape`

Finds all backslashes in a string and escapes each of them with another backslash. 

```css
{{#escape}}{{selector-with-backslash}}{{/escape}} {
	color: red;
}
```