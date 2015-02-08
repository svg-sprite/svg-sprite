'use strict';

var SVGSpriteConfigurator = function(config, $form, $compiled, $tabs, debug) {
	this.config		= config;
	this.$form		= $form;
	this.$compiled	= $compiled;
	this.values		= {};
	this.reserved	= ['label', 'default', 'skip', 'type', 'options', 'emphasize'];
	this.register	= {};
	this.debug		= !!debug;
	this.tab		= null;
	this.compiled	= {};
	
	this.prepareTabs($tabs);
	this.build(this.$form, this.config, []);
	this.update();
}

/**
 * Prepare the tabs and JavaScript templates
 * 
 * @param {jQuery) $tabs			Tabs
 */
SVGSpriteConfigurator.prototype.prepareTabs = function($tabs) {
	var that				= this;
	$tabs.each(function(index, tab){
		var template		= $('pre', tab);
		tab.template		= template.length ? template.text() : '$$config$$';
		tab.onclick			= function() {
			that.tab		= this;
			that.update();
		}
	});
	
	this.tab				= $tabs[0];
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

	this.compiled					= compiled;
	this.update();
}

/**
 * Update the display
 */
SVGSpriteConfigurator.prototype.update = function() {
	console.log(this.tab.template);
	var json						= JSON.stringify(this.compiled, null, 4),
	result							= this.tab.template.split('$$config$$').join(json),
	lines							= result.split("\n").length,
	style							= window.getComputedStyle(this.$compiled[0], null),
	lineHeight						= parseFloat(style.getPropertyValue('line-height'), 10),
	paddingBottom					= parseFloat(style.getPropertyValue('padding-bottom'), 10),
	paddingTop						= parseFloat(style.getPropertyValue('padding-top'), 10);
	this.$compiled.text(result).height((lines + .5) * lineHeight);
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

window.location.hash = 'json';
new SVGSpriteConfigurator(@@include('02_config.json', {}), $('#configurator'), $('#compiled textarea'), $('.tabs a'), true);
window.setTimeout(function() { window.scrollTo(0, 0); }, 0);