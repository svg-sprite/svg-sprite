'use strict';

var SVGSpriteConfigurator = function(config, $form, $compiled, debug) {
	this.config		= config;
	this.$form		= $form;
	this.$compiled	= $compiled;
	this.values		= {};
	this.reserved	= ['label', 'default', 'skip', 'type', 'options', 'emphasize'];
	this.register	= {};
	this.debug		= !!debug;
	
	this.build(this.$form, this.config, []);
	this.compile();
}

/**
 * Build a configuration section
 * 
 * @param {jQuery} $container		Container element
 * @param {Object} config			Configuration object
 * @param {Array} ids				IDs
 */
SVGSpriteConfigurator.prototype.build = function($container, config, ids) {
	for (var id in config) {
		switch (config[id].type) {
			
			// String inputs
			case 'string':
				this.buildString($container, id, config[id], ids);
				break;
				
			// Integer inputs
			case 'integer':
				this.buildInteger($container, id, config[id], ids);
				break;
				
			// Boolean inputs
			case 'boolean':
				this.buildBoolean($container, id, config[id], ids);
				break;
				
			// Dropdowns
			case 'select':
				this.buildSelect($container, id, config[id], ids);
				break;
				
			// Collapsible sections
			case 'section':
				this.buildSection($container, id, config[id], ids);
				break;
				
			// Configurable sections
			case 'enableconfig':
				this.buildEnableConfig($container, id, config[id], ids);
				break;
				
			// Manual edit
			case 'manual':
				this.buildManual($container, id, config[id], ids);
				break;
				
			case 'list': break;
		}
	}
	return $container;
}

/**
 * Build a string input
 *
 * @param {jQuery} $container		Container element
 * @param {String} id				ID
 * @param {Object} config			Config parameters
 * @param {Array} ids				IDs
 */
SVGSpriteConfigurator.prototype.buildString = function($container, id, config, ids) {
	var stringName					= ids.join('_') + (ids.length ? '_' : '') + id,
	$stringElement					= $('<input type="text" name="' + stringName + '" data-skip="' + config.skip + '"/>');
	$stringElement.attr('value', this.values[stringName]);
	$stringElement.attr('placeholder', config['default']);
	$container.append($('<label/>').text(config.label).append($('<span class="id"/>').text(stringName.split('_').join('.'))).prepend($stringElement));
	this.register[stringName]		= $.extend({_: $stringElement[0]}, config);
	$stringElement.change($.proxy(this.compile, this));
}

/**
 * Build an integer input
 *
 * @param {jQuery} $container		Container element
 * @param {String} id				ID
 * @param {Object} config			Config parameters
 * @param {Array} ids				IDs
 */
SVGSpriteConfigurator.prototype.buildInteger = function($container, id, config, ids) {
	var integerName					= ids.join('_') + (ids.length ? '_' : '') + id,
	$integerElement					= $('<input type="number" name="' + integerName + '" data-skip="' + config.skip + '" min="0" step="1" pattern="\d*"/>');
	$integerElement.attr('value', this.values[integerName]);
	$integerElement.attr('placeholder', config['default']);
	$container.append($('<label' + (config.emphasize ? ' class="emphasize"' : '') + '/>').text(config.label).append($('<span class="id"/>').text(integerName.split('_').join('.'))).prepend($integerElement));
	this.register[integerName]		= $.extend({_: $integerElement[0]}, config);
	$integerElement.change($.proxy(this.compile, this));
}

/**
 * Build an Boolean value
 *
 * @param {jQuery} $container		Container element
 * @param {String} id				ID
 * @param {Object} config			Config parameters
 * @param {Array} ids				IDs
 */
SVGSpriteConfigurator.prototype.buildBoolean = function($container, id, config, ids) {
	var booleanName					= ids.join('_') + (ids.length ? '_' : '') + id,
	$booleanElement					= $('<input type="checkbox" name="' + booleanName + '" value="1" data-skip="' + config.skip + '"' + (!!config['default'] ? ' checked="checked"' : '')+ '/>'),
	$booleanElementWrapper			= $('<span class="boolean"><input type="hidden" name="' + booleanName + '" value="0"/></span>').append($booleanElement);
	$container.append($('<label' + (config.emphasize ? ' class="emphasize"' : '') + '/>').text(config.label).append($('<span class="id"/>').text(booleanName.split('_').join('.'))).prepend($booleanElementWrapper));
	this.register[booleanName]		= $.extend({_: $booleanElement[0]}, config);
	$booleanElement.click($.proxy(this.compile, this));
}

/**
 * Build a dropdown
 *
 * @param {jQuery} $container		Container element
 * @param {String} id				ID
 * @param {Object} config			Config parameters
 * @param {Array} ids				IDs
 */
SVGSpriteConfigurator.prototype.buildSelect = function($container, id, config, ids) {
	var selectName					= ids.join('_') + (ids.length ? '_' : '') + id,
	$selectElement					= $('<select name="' + selectName + '" data-skip="' + config.skip + '"/>'),
	selectValue						= this.values[selectName] || config['default'];
	for (var value in config.options) {
		$selectElement.append($('<option value="' + value + '"' + ((value == selectValue) ? ' selected="selected"' : '') + '/>').text(config.options[value]));
	}
	$container.append($('<label' + (config.emphasize ? ' class="emphasize"' : '') + '/>').text(config.label).append($('<span class="id"/>').text(selectName.split('_').join('.'))).prepend($selectElement));
	this.register[selectName]		= $.extend({_: $selectElement[0]}, config);
	$selectElement.change($.proxy(this.compile, this));
}

/**
 * Build a collapsible section
 *
 * @param {jQuery} $container		Container element
 * @param {String} id				ID
 * @param {Object} config			Config parameters
 * @param {Array} ids				IDs
 */
SVGSpriteConfigurator.prototype.buildSection = function($container, id, config, ids) {
	var sectionName					= ids.join('_') + (ids.length ? '_' : '') + id,
	sectionExanded					= false,
	sectionSubsections				= {},
	sectionHasSubsections			= 0,
	that							= this;
	$.each(this.values, function(property, value) {
		if (property.indexOf(section + '_') === 0) {
			sectionExanded			= true;
		}
	});
	$.each(config, function(property, value) {
		if (that.reserved.indexOf(property) < 0) {
			sectionSubsections[property] = value;
			++sectionHasSubsections;
		}
	});
	if (sectionHasSubsections) {
		var sectionSubIds			= ids.slice(0);
		sectionSubIds.push(id);
		var $sectionElement			= $('<label for="' + sectionName + '"' + (config.emphasize ? ' class="emphasize"' : '') + '/>').text(config.label)
									.append($('<span class="id"/>').text(sectionName.split('_').join('.')))
									.prepend('<span class="toggle" data-exand="►" data-collapse="▼"></span>'),
		$sectionLegend				= $('<legend/>').append($sectionElement),
		$sectionFieldset			= $('<fieldset/>')
									.append($('<input type="checkbox" id="' + sectionName + '" class="section"' + (sectionExanded ? ' checked="checked"' : '') + ' data-skip="' + config.skip + '"/>'))
									.append($sectionLegend)
									.append(this.build($('<div class="subsection"/>'), sectionSubsections, sectionSubIds));
		$container					.append($sectionFieldset);
		this.register[sectionName]	= config;
	}
}

/**
 * Build a configurable section
 *
 * @param {jQuery} $container		Container element
 * @param {String} id				ID
 * @param {Object} config			Config parameters
 * @param {Array} ids				IDs
 */
SVGSpriteConfigurator.prototype.buildEnableConfig = function($container, id, config, ids) {
	var enableName					= ids.join('_') + (ids.length ? '_' : '') + id,
	enableValue						= parseInt(this.values[enableName] || config['default'], 10),
	enableExanded					= false,
	enableSubsections				= {},
	enableHasSubsections			= 0;
	$.each(this.values, function(property, value) {
		if (property.indexOf(enable + '_') === 0) {
			enableExanded			= true;
		}
	});
	var that						= this;
	$.each(config, function(property, value) {
		if (that.reserved.indexOf(property) < 0) {
			enableSubsections[property] = value;
			++enableHasSubsections;
		}
	});
	if (enableHasSubsections) {
		var enableSubIds			= ids.slice(0);
		enableSubIds.push(id);
		
		var $enableSkip				= $('<input type="radio" id="' + enableName + '.skip" name="' + enableName + '" class="skip" value="0"' + ((enableValue == 0) ? ' checked="checked"' : '') + '>'),
		$enableSkipLabel			 = $('<label class="enable" for="' + enableName + '.skip">Skip</label>'),
		$enableEnable				= $('<input type="radio" id="' + enableName + '.enable" name="' + enableName + '" class="enable" value="1"' + ((enableValue == 1) ? ' checked="checked"' : '') + '>'),
		$enableEnableLabel			= $('<label class="enable" for="' + enableName + '.enable">Enable</label>'),
		$enableConfigure			= $('<input type="radio" id="' + enableName + '.configure" name="' + enableName + '" class="configure" value="2"' + ((enableValue == 2) ? ' checked="checked"' : '') + '>'),
		$enableConfigureLabel		= $('<label class="enable" for="' + enableName + '.configure">Configure</label>');
		
		var $enableFieldset			= $('<fieldset/>')
									.append($('<legend class="label"/>').append($('<label for="' + enableName + '.enable"' + (config.emphasize ? ' class="emphasize"' : '') + '/>').text(config.label).append($('<span class="id"/>').text(enableName.split('_').join('.')))))
									.append($enableEnable, $enableEnableLabel, $enableConfigure, $enableConfigureLabel, $enableSkip, $enableSkipLabel)
									.append(this.build($('<div class="subsection"/>'), enableSubsections, enableSubIds));
		$container					.append($enableFieldset);
		this.register[enableName]	= $.extend({_0: $enableSkip[0], _1: $enableEnable[0], _2: $enableConfigure[0]}, config);
		$enableSkip.click($.proxy(this.compile, this));
		$enableEnable.click($.proxy(this.compile, this));
		$enableConfigure.click($.proxy(this.compile, this));
	}
}

/**
 * Build a manual edit field
 *
 * @param {jQuery} $container		Container element
 * @param {String} id				ID
 * @param {Object} config			Config parameters
 * @param {Array} ids				IDs
 */
SVGSpriteConfigurator.prototype.buildManual = function($container, id, config, ids) {
	var manualName					= ids.join('_') + (ids.length ? '_' : '') + id,
	$manualElement					= $('<span class="manual"><input type="checkbox" name="' + manualName + '" value="1" data-skip="' + config.skip + '"' + (!!config['default'] ? ' checked="checked"' : '')+ '/> Enable and edit manually</span>');
	$container.append($('<label' + (config.emphasize ? ' class="emphasize"' : '') + '/>').text(config.label).append($('<span class="id"/>').text(manualName.split('_').join('.'))).prepend($manualElement));
	this.register[manualName]		= $.extend({_: $manualElement[0]}, config);
	$manualElement.click($.proxy(this.compile, this));
}

/**
 * Compile the configuration
 */
SVGSpriteConfigurator.prototype.compile = function() {
	var compiled					= {},
	values							= this.$form.serializeArray();
	
	// Run through all options
	for (var index = 0; index < values.length; ++index) {
		this.traverse(values[index].name.split('_'), values[index].value, compiled, this.config);
	}
	
	
	// Refine the compiled configuration
	for (var property in compiled) {
		this.refine(property, compiled, this.config);
	}

	var json						= JSON.stringify(compiled, null, 4),
	lines							= json.split("\n").length,
	style							= window.getComputedStyle(this.$compiled[0], null),
	lineHeight						= parseFloat(style.getPropertyValue('line-height'), 10),
	paddingBottom					= parseFloat(style.getPropertyValue('padding-bottom'), 10),
	paddingTop						= parseFloat(style.getPropertyValue('padding-top'), 10);
	this.$compiled.text(json).height((lines + .5) * lineHeight);
}

/**
 * Traverse a single configuration aspect
 * 
 * @param {String} name				Name
 * @param {Mixed} value				Value
 * @param {Object} compiled			Compiled configuration
 * @param {Object} config			Option configuration
 * @param {String} path				Variable path
 */
SVGSpriteConfigurator.prototype.traverse = function(name, value, compiled, config, path) {
	var property					= name.shift();
	if (property in config) {
		
		// If this is not the last part of the name
		if (name.length) {
			if (!(property in compiled)) {
				compiled[property]	= {};
			}
			this.traverse(name, value, compiled[property], config[property], (path || '') + property + '_');
			
		// Else: Set the value
		} else {
			
			switch (config[property].type) {
			
				// String inputs
				case 'string':
					value = $.trim(value);
					break;
					
				// Integer inputs
				case 'integer':
					value = Math.max(0, parseInt(value || 0, 10));
					break;
					
				// Boolean inputs
				case 'boolean':
					value = !!parseInt(value || 0, 10);
					break;
					
				// Dropdowns
				case 'select':
					break;
					
				// Configurable sections
				case 'enableconfig':
					value = Math.max(0, Math.min(2, parseInt(value || 0, 10)));
					break;
					
				// Manual edit
				case 'manual':
					value = !!parseInt(value || 0, 10) ? {} : null;
					break;
			}
			
			if (!(property in compiled)) {
				compiled[property]		= {_: value};
			} else {
				compiled[property]._	= value;
			}
		}
	} else {
		throw new 'Invalid property: '.property;
	}
}

/**
 * Refine a single configuration aspect
 * 
 * @param {String} property			Property
 * @param {Object} compiled			Compiled configuration
 * @param {Object} config			Option configuration
 * @param {Number}					Valid properties
 */
SVGSpriteConfigurator.prototype.refine = function(property, compiled, config) {
	var conf		= config[property],
	def				= conf['default'],
	skip			= parseInt(conf.skip || 0, 10),
	value			= compiled[property]._,
	properties		= 0;
	switch (conf.process || conf.type) {
			
		// String, select and integer inputs
		case 'integer':
			if (!value && (skip & 1)) {
				delete compiled[property];
				break;
			}
			
		case 'string':
		case 'select':
			if ((!('' + value).length && (skip & 1)) || ((value === def) && (skip & 2))) {
				delete compiled[property];
			} else {
				compiled[property] = value;
				++properties;
			}
			break;
		
		// Sections
		case 'section':
			var sub	= 0;
			for (var section in compiled[property]) {
				sub	+= this.refine(section, compiled[property], conf);
			}
			if (sub) {
				properties		+= sub;
			} else {
				delete compiled[property];
			}
			break;
			
		// Boolean inputs
		case 'boolean':
			if ((value === def) && (skip & 2)) {
				delete compiled[property];
			} else {
				compiled[property] = value;
				++properties;
			}
			break;
			
		// Configurable sections
		case 'enableconfig':
			if ((def === value) && (skip & 2)) {
				delete compiled[property];
			} else if (value < 2) {
				compiled[property] = !!value;
				++properties;
			} else {
				var sub			= 0;
				for (var section in compiled[property]) {
					if (section != '_') {
						sub		+= this.refine(section, compiled[property], conf);
					}
				}
				if (sub) {
					delete compiled[property]._;
					properties	+= sub;
				} else {
					compiled[property] = true;
					++properties;
				}
			}
			break;
			
		// Manual edit
		case 'manual':
			if (!value) {
				delete compiled[property];
			} else {
				compiled[property] = value;
				++properties;
			}
			break;
			
		// Transformation config
		case 'transform':
			var sub	= 0;
			for (var section in compiled[property]) {
				sub	+= this.refine(section, compiled[property], conf);
			}
			if (sub) {
				properties		+= sub;
				value			= [];
				for (var t in compiled[property]) {
					var transform					= compiled[property][t];
					if (transform === true) {
						value						= null;
					} else if (typeof transform == 'object') {
						var plugins					= [];
						for (var plugin in transform) {
							var pluginConfig		= {};
							pluginConfig[plugin]	= transform[plugin];
							plugins.push(pluginConfig);
						}
						if (plugins.length) {
							var transformConfig		= {};
							transformConfig[t]		= {plugins: plugins};
							value.push(transformConfig);
						}
					}
				}
				if (value === null) {
					delete compiled[property];
				} else {
					compiled[property] = value;
				}
			} else {
				delete compiled[property];
			}
			break;
	}
	
	return properties;
}

new SVGSpriteConfigurator({
  "dest": {
    "type": "string",
    "label": "Main output directory",
    "default": ".",
    "skip": 3
  },
  "log": {
    "type": "select",
    "label": "Log verbosity",
    "default": null,
    "skip": 3,
    "options": {
      "": "No logging",
      "info": "Informal",
      "verbose": "Verbose",
      "debug": "Debug information"
    }
  },
  "shape": {
    "type": "section",
    "label": "SVG shape properties",
    "skip": 3,
    "id": {
      "type": "section",
      "label": "Shape ID properties",
      "skip": 3,
      "separator": {
        "type": "string",
        "label": "Directory separator replacement",
        "default": "--",
        "skip": 3
      },
      "generator": {
        "type": "string",
        "label": "Generator template or callback",
        "default": null,
        "skip": 3
      },
      "pseudo": {
        "type": "string",
        "label": "Pseudo-class delimiter",
        "default": "~",
        "skip": 3
      }
    },
    "dimension": {
      "type": "section",
      "label": "Dimensions",
      "skip": 3,
      "maxWidth": {
        "type": "integer",
        "label": "Max. shape width",
        "default": 2000,
        "skip": 3
      },
      "maxHeight": {
        "type": "integer",
        "label": "Max. shape height",
        "default": 2000,
        "skip": 3
      },
      "precision": {
        "type": "integer",
        "label": "Decimal precision",
        "default": 2,
        "skip": 3
      },
      "attributes": {
        "type": "boolean",
        "label": "Add dimension attributes",
        "default": false,
        "skip": 3
      }
    },
    "spacing": {
      "type": "section",
      "label": "Spacing",
      "skip": 3,
      "padding": {
        "type": "integer",
        "label": "Padding on all edges",
        "default": 0,
        "skip": 3
      },
      "box": {
        "type": "select",
        "label": "Box sizing strategy",
        "default": "content",
        "skip": 3,
        "options": {
          "content": "Content box",
          "padding": "Padding box"
        }
      }
    },
    "meta": {
      "type": "string",
      "label": "Meta data YAML file",
      "skip": 3,
      "default": null
    },
    "align": {
      "type": "string",
      "label": "Alignment data YAML file",
      "skip": 3,
      "default": null
    },
    "dest": {
      "type": "string",
      "label": "SVG shape output directory",
      "skip": 3,
      "default": null
    }
  },
  "transform": {
    "type": "section",
    "label": "SVG shape transformations",
    "skip": 3,
    "process": "transform",
    "svgo": {
      "type": "enableconfig",
      "label": "SVGO",
      "skip": 3,
      "default": 1,
      "cleanupAttrs": {
        "type": "boolean",
        "label": "Cleanup attributes from whitespace",
        "default": true,
        "skip": 3
      },
      "removeDoctype": {
        "type": "boolean",
        "label": "Remove DOCTYPE declaration",
        "default": true,
        "skip": 3
      },
      "removeXMLProcInst": {
        "type": "boolean",
        "label": "Remove XML declaration",
        "default": true,
        "skip": 3
      },
      "removeComments": {
        "type": "boolean",
        "label": "Remove comments",
        "default": true,
        "skip": 3
      },
      "removeMetadata": {
        "type": "boolean",
        "label": "Remove <metadata>",
        "default": true,
        "skip": 3
      },
      "removeTitle": {
        "type": "boolean",
        "label": "Remove <title>",
        "default": true,
        "skip": 3
      },
      "removeEditorsNSData": {
        "type": "boolean",
        "label": "Remove editor markup",
        "default": true,
        "skip": 3
      },
      "removeEmptyAttrs": {
        "type": "boolean",
        "label": "Remove empty attributes",
        "default": true,
        "skip": 3
      },
      "removeHiddenElems": {
        "type": "boolean",
        "label": "Remove hidden elements",
        "default": true,
        "skip": 3
      },
      "removeEmptyText": {
        "type": "boolean",
        "label": "Remove empty texts",
        "default": true,
        "skip": 3
      },
      "removeEmptyContainers": {
        "type": "boolean",
        "label": "Remove empty containers",
        "default": true,
        "skip": 3
      },
      "removeViewBox": {
        "type": "boolean",
        "label": "Remove viewBox",
        "default": false,
        "skip": 3
      },
      "cleanupEnableBackground": {
        "type": "boolean",
        "label": "Cleanup \"enable-background\" attribute",
        "default": true,
        "skip": 3
      },
      "convertStyleToAttrs": {
        "type": "boolean",
        "label": "Convert styles to attributes",
        "default": true,
        "skip": 3
      },
      "convertColors": {
        "type": "boolean",
        "label": "Convert colors to attributes",
        "default": true,
        "skip": 3
      },
      "convertPathData": {
        "type": "boolean",
        "label": "Convert path data",
        "default": true,
        "skip": 3
      },
      "convertTransform": {
        "type": "boolean",
        "label": "Collapse multiple transforms",
        "default": true,
        "skip": 3
      },
      "removeUnknownsAndDefaults": {
        "type": "boolean",
        "label": "Remove unknown elements and attributes",
        "default": true,
        "skip": 3
      },
      "removeNonInheritableGroupAttrs": {
        "type": "boolean",
        "label": "Remove non-inheritable presentation attributes",
        "default": true,
        "skip": 3
      },
      "removeUnusedNS": {
        "type": "boolean",
        "label": "Remove unused namespace declarations",
        "default": true,
        "skip": 3
      },
      "cleanupIDs": {
        "type": "boolean",
        "label": "Remove unused and minify used IDs",
        "default": true,
        "skip": 3
      },
      "cleanupNumericValues": {
        "type": "boolean",
        "label": "Round numeric values to fixed precision",
        "default": true,
        "skip": 3
      },
      "moveElemsAttrsToGroup": {
        "type": "boolean",
        "label": "Move element attributes to group wrappers",
        "default": true,
        "skip": 3
      },
      "moveGroupAttrsToElems": {
        "type": "boolean",
        "label": "Move some group attributes to content elements",
        "default": false,
        "skip": 3
      },
      "collapseGroups": {
        "type": "boolean",
        "label": "Collapse useless groups",
        "default": true,
        "skip": 3
      },
      "removeRasterImages": {
        "type": "boolean",
        "label": "Remove raster images",
        "default": false,
        "skip": 3
      },
      "mergePaths": {
        "type": "boolean",
        "label": "Merge multiple paths into one",
        "default": true,
        "skip": 3
      },
      "convertShapeToPath": {
        "type": "boolean",
        "label": "Convert some basic shapes to paths",
        "default": true,
        "skip": 3
      },
      "transformsWithOnePath": {
        "type": "boolean",
        "label": "Apply transforms, crop by real width",
        "default": true,
        "skip": 3
      }
    }
  },
  "svg": {
    "type": "section",
    "label": "SVG sprite properties",
    "skip": 3,
    "xmlDeclaration": {
      "type": "boolean",
      "label": "Add XML declaration",
      "default": true,
      "skip": 3
    },
    "doctypeDeclaration": {
      "type": "boolean",
      "label": "Add DOCTYPE declaration",
      "default": true,
      "skip": 3
    },
    "namespaceIDs": {
      "type": "boolean",
      "label": "Apply ID namespacing",
      "default": true,
      "skip": 3
    },
    "dimensionAttributes": {
      "type": "boolean",
      "label": "Add dimension attributes",
      "default": true,
      "skip": 3
    }
  },
  "mode": {
    "type": "section",
    "label": "Output modes",
    "emphasize": true,
    "skip": 3,
    "css": {
      "type": "enableconfig",
      "label": "«css» sprite",
      "default": 0,
      "skip": 3,
      "dest": {
        "type": "string",
        "label": "Output directory",
        "default": "css",
        "skip": 3
      },
      "layout": {
        "type": "select",
        "label": "Sprite layout",
        "default": "packed",
        "skip": 3,
        "options": {
          "vertical": "Vertical",
          "horizontal": "Horizontal",
          "diagonal": "Diagonal",
          "packed": "Packed"
        }
      },
      "common": {
        "type": "string",
        "label": "Common CSS class name",
        "default": null,
        "skip": 3
      },
      "prefix": {
        "type": "string",
        "label": "CSS selector prefix",
        "default": "svg-%s",
        "skip": 3
      },
      "dimensions": {
        "type": "string",
        "label": "Dimension CSS selector suffix",
        "default": "-dims",
        "skip": 3
      },
      "sprite": {
        "type": "string",
        "label": "Sprite path & file name",
        "default": "svg/sprite.css.svg",
        "skip": 3
      },
      "bust": {
        "type": "boolean",
        "label": "Enable cache busting",
        "default": true,
        "skip": 3
      },
      "render": {
        "type": "section",
        "label": "Rendering configurations",
        "emphasize": true,
        "skip": 3,
        "css": {
          "type": "enableconfig",
          "label": "Render CSS stylesheet",
          "default": 0,
          "skip": 3,
          "template": {
            "type": "string",
            "label": "CSS stylesheet template",
            "default": "tmpl/css/sprite.css",
            "skip": 3
          },
          "dest": {
            "type": "string",
            "label": "CSS stylesheet destination",
            "default": "sprite.css",
            "skip": 3
          }
        },
        "scss": {
          "type": "enableconfig",
          "label": "Render Sass stylesheet",
          "default": 0,
          "skip": 3,
          "template": {
            "type": "string",
            "label": "Sass stylesheet template",
            "default": "tmpl/css/sprite.scss",
            "skip": 3
          },
          "dest": {
            "type": "string",
            "label": "Sass stylesheet destination",
            "default": "sprite.scss",
            "skip": 3
          }
        },
        "less": {
          "type": "enableconfig",
          "label": "Render LESS stylesheet",
          "default": 0,
          "skip": 3,
          "template": {
            "type": "string",
            "label": "LESS stylesheet template",
            "default": "tmpl/css/sprite.scss",
            "skip": 3
          },
          "dest": {
            "type": "string",
            "label": "SCSS stylesheet destination",
            "default": "sprite.scss",
            "skip": 3
          }
        },
        "styl": {
          "type": "enableconfig",
          "label": "Render Stylus stylesheet",
          "default": 0,
          "skip": 3,
          "template": {
            "type": "string",
            "label": "Stylus stylesheet template",
            "default": "tmpl/css/sprite.styl",
            "skip": 3
          },
          "dest": {
            "type": "string",
            "label": "Stylus stylesheet destination",
            "default": "sprite.styl",
            "skip": 3
          }
        }
      },
      "example": {
        "type": "enableconfig",
        "label": "Render HTML example",
        "default": 0,
        "skip": 3,
        "template": {
          "type": "string",
          "label": "HTML document template",
          "default": "tmpl/css/sprite.html",
          "skip": 3
        },
        "dest": {
          "type": "string",
          "label": "HTML document destination",
          "default": "sprite.css.html",
          "skip": 3
        }
      }
    },
    "view": {
      "type": "enableconfig",
      "label": "«view» sprite",
      "default": 0,
      "skip": 3,
      "dest": {
        "type": "string",
        "label": "Output directory",
        "default": "view",
        "skip": 3
      },
      "layout": {
        "type": "select",
        "label": "Sprite layout",
        "default": "packed",
        "skip": 3,
        "options": {
          "vertical": "Vertical",
          "horizontal": "Horizontal",
          "diagonal": "Diagonal",
          "packed": "Packed"
        }
      },
      "common": {
        "type": "string",
        "label": "Common CSS class name",
        "default": null,
        "skip": 3
      },
      "prefix": {
        "type": "string",
        "label": "CSS selector prefix",
        "default": "svg-%s",
        "skip": 3
      },
      "dimensions": {
        "type": "string",
        "label": "Dimension CSS selector suffix",
        "default": "-dims",
        "skip": 3
      },
      "sprite": {
        "type": "string",
        "label": "Sprite path & file name",
        "default": "svg/sprite.view.svg",
        "skip": 3
      },
      "bust": {
        "type": "boolean",
        "label": "Enable cache busting",
        "default": true,
        "skip": 3
      },
      "render": {
        "type": "section",
        "label": "Rendering configurations",
        "emphasize": true,
        "skip": 3,
        "css": {
          "type": "enableconfig",
          "label": "Render CSS stylesheet",
          "default": 0,
          "skip": 3,
          "template": {
            "type": "string",
            "label": "CSS stylesheet template",
            "default": "tmpl/view/sprite.css",
            "skip": 3
          },
          "dest": {
            "type": "string",
            "label": "CSS stylesheet destination",
            "default": "sprite.css",
            "skip": 3
          }
        },
        "scss": {
          "type": "enableconfig",
          "label": "Render Sass stylesheet",
          "default": 0,
          "skip": 3,
          "template": {
            "type": "string",
            "label": "Sass stylesheet template",
            "default": "tmpl/view/sprite.scss",
            "skip": 3
          },
          "dest": {
            "type": "string",
            "label": "Sass stylesheet destination",
            "default": "sprite.scss",
            "skip": 3
          }
        },
        "less": {
          "type": "enableconfig",
          "label": "Render LESS stylesheet",
          "default": 0,
          "skip": 3,
          "template": {
            "type": "string",
            "label": "LESS stylesheet template",
            "default": "tmpl/view/sprite.scss",
            "skip": 3
          },
          "dest": {
            "type": "string",
            "label": "SCSS stylesheet destination",
            "default": "sprite.scss",
            "skip": 3
          }
        },
        "styl": {
          "type": "enableconfig",
          "label": "Render Stylus stylesheet",
          "default": 0,
          "skip": 3,
          "template": {
            "type": "string",
            "label": "Stylus stylesheet template",
            "default": "tmpl/view/sprite.styl",
            "skip": 3
          },
          "dest": {
            "type": "string",
            "label": "Stylus stylesheet destination",
            "default": "sprite.styl",
            "skip": 3
          }
        }
      },
      "example": {
        "type": "enableconfig",
        "label": "Render HTML example",
        "default": 0,
        "skip": 3,
        "template": {
          "type": "string",
          "label": "HTML document template",
          "default": "tmpl/view/sprite.html",
          "skip": 3
        },
        "dest": {
          "type": "string",
          "label": "HTML document destination",
          "default": "sprite.view.html",
          "skip": 3
        }
      }
    },
    "defs": {
      "type": "enableconfig",
      "label": "«defs» sprite",
      "default": 0,
      "skip": 3,
      "dest": {
        "type": "string",
        "label": "Output directory",
        "default": "defs",
        "skip": 3
      },
      "prefix": {
        "type": "string",
        "label": "CSS selector prefix",
        "default": "svg-%s",
        "skip": 3
      },
      "dimensions": {
        "type": "string",
        "label": "Dimension CSS selector suffix",
        "default": "-dims",
        "skip": 3
      },
      "sprite": {
        "type": "string",
        "label": "Sprite path & file name",
        "default": "svg/sprite.defs.svg",
        "skip": 3
      },
      "bust": {
        "type": "boolean",
        "label": "Enable cache busting",
        "default": false,
        "skip": 3
      },
      "inline": {
        "type": "boolean",
        "label": "Prepare for inline embedding",
        "default": false,
        "skip": 3
      },
      "example": {
        "type": "enableconfig",
        "label": "Render HTML example",
        "default": 0,
        "skip": 3,
        "template": {
          "type": "string",
          "label": "HTML document template",
          "default": "tmpl/defs/sprite.html",
          "skip": 3
        },
        "dest": {
          "type": "string",
          "label": "HTML document destination",
          "default": "sprite.defs.html",
          "skip": 3
        }
      }
    },
    "symbol": {
      "type": "enableconfig",
      "label": "«symbol» sprite",
      "default": 0,
      "skip": 3,
      "dest": {
        "type": "string",
        "label": "Output directory",
        "default": "symbol",
        "skip": 3
      },
      "prefix": {
        "type": "string",
        "label": "CSS selector prefix",
        "default": "svg-%s",
        "skip": 3
      },
      "dimensions": {
        "type": "string",
        "label": "Dimension CSS selector suffix",
        "default": "-dims",
        "skip": 3
      },
      "sprite": {
        "type": "string",
        "label": "Sprite path & file name",
        "default": "svg/sprite.symbol.svg",
        "skip": 3
      },
      "bust": {
        "type": "boolean",
        "label": "Enable cache busting",
        "default": false,
        "skip": 3
      },
      "inline": {
        "type": "boolean",
        "label": "Prepare for inline embedding",
        "default": false,
        "skip": 3
      },
      "example": {
        "type": "enableconfig",
        "label": "Render HTML example",
        "default": 0,
        "skip": 3,
        "template": {
          "type": "string",
          "label": "HTML document template",
          "default": "tmpl/symbol/sprite.html",
          "skip": 3
        },
        "dest": {
          "type": "string",
          "label": "HTML document destination",
          "default": "sprite.symbol.html",
          "skip": 3
        }
      }
    },
    "stack": {
      "type": "enableconfig",
      "label": "«stack» sprite",
      "default": 0,
      "skip": 3,
      "dest": {
        "type": "string",
        "label": "Output directory",
        "default": "stack",
        "skip": 3
      },
      "prefix": {
        "type": "string",
        "label": "CSS selector prefix",
        "default": "svg-%s",
        "skip": 3
      },
      "dimensions": {
        "type": "string",
        "label": "Dimension CSS selector suffix",
        "default": "-dims",
        "skip": 3
      },
      "sprite": {
        "type": "string",
        "label": "Sprite path & file name",
        "default": "svg/sprite.stack.svg",
        "skip": 3
      },
      "bust": {
        "type": "boolean",
        "label": "Enable cache busting",
        "default": false,
        "skip": 3
      },
      "example": {
        "type": "enableconfig",
        "label": "Render HTML example",
        "default": 0,
        "skip": 3,
        "template": {
          "type": "string",
          "label": "HTML document template",
          "default": "tmpl/stack/sprite.html",
          "skip": 3
        },
        "dest": {
          "type": "string",
          "label": "HTML document destination",
          "default": "sprite.stack.html",
          "skip": 3
        }
      }
    }
  },
  "variables": {
    "type": "manual",
    "label": "Custom Mustache templating variables",
    "skip": 3
  }
}, $('#configurator'), $('#compiled textarea'), true);