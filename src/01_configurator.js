'use strict';

var SVGSpriteConfigurator = function(config, form) {
	this.config		= config;
	this.$form		= form;
	this.values		= {};
	this.reserved	= ['label', 'default', 'skip', 'type', 'options', 'emphasize'];
	
	this.build(this.$form, this.config, []);
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
	var stringName			= ids.join('_') + (ids.length ? '_' : '') + id,
	$stringElement			= $('<input type="text" name="' + stringName + '" data-skip="' + config.skip + '"/>');
	$stringElement.attr('value', this.values[stringName]);
	$stringElement.attr('placeholder', config['default']);
	$container.append($('<label/>').text(config.label).append($('<span class="id"/>').text(stringName.split('_').join('.'))).prepend($stringElement));
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
	var integerName			= ids.join('_') + (ids.length ? '_' : '') + id,
	$integerElement			= $('<input type="number" name="' + integerName + '" data-skip="' + config.skip + '" min="0" step="1" pattern="\d*"/>');
	$integerElement.attr('value', this.values[integerName]);
	$integerElement.attr('placeholder', config['default']);
	$container.append($('<label' + (config.emphasize ? ' class="emphasize"' : '') + '/>').text(config.label).append($('<span class="id"/>').text(integerName.split('_').join('.'))).prepend($integerElement));
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
	var booleanName			= ids.join('_') + (ids.length ? '_' : '') + id,
	$booleanElement			= $('<span class="boolean"><input type="checkbox" name="' + booleanName + '" value="1" data-skip="' + config.skip + '"' + (!!config['default'] ? ' checked="checked"' : '')+ '/></span>');
	$container.append($('<label' + (config.emphasize ? ' class="emphasize"' : '') + '/>').text(config.label).append($('<span class="id"/>').text(booleanName.split('_').join('.'))).prepend($booleanElement));
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
	var selectName			= ids.join('_') + (ids.length ? '_' : '') + id,
	$selectElement			= $('<select name="' + selectName + '" data-skip="' + config.skip + '"/>'),
	selectValue				= this.values[selectName] || config['default'];
	for (var value in config.options) {
		$selectElement.append($('<option value="' + value + '"' + ((value == selectValue) ? ' selected="selected"' : '') + '/>').text(config.options[value]));
	}
	$container.append($('<label' + (config.emphasize ? ' class="emphasize"' : '') + '/>').text(config.label).append($('<span class="id"/>').text(selectName.split('_').join('.'))).prepend($selectElement));
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
	var sectionName			= ids.join('_') + (ids.length ? '_' : '') + id,
	sectionExanded			= false,
	sectionSubsections		= {},
	sectionHasSubsections	= 0;
	$.each(this.values, function(property, value) {
		if (property.indexOf(section + '_') === 0) {
			sectionExanded	= true;
		}
	});
	var that				= this;
	$.each(config, function(property, value) {
		if (that.reserved.indexOf(property) < 0) {
			sectionSubsections[property] = value;
			++sectionHasSubsections;
		}
	});
	if (sectionHasSubsections) {
		var sectionSubIds	= ids.slice(0);
		sectionSubIds.push(id);
		var $sectionElement	= $('<label for="' + sectionName + '"' + (config.emphasize ? ' class="emphasize"' : '') + '/>').text(config.label)
							.append($('<span class="id"/>').text(sectionName.split('_').join('.')))
							.prepend('<span class="toggle" data-exand="►" data-collapse="▼"></span>'),
		$sectionLegend		= $('<legend/>').append($sectionElement),
		$sectionFieldset	= $('<fieldset/>')
							.append($('<input type="checkbox" id="' + sectionName + '" class="section"' + (sectionExanded ? ' checked="checked"' : '') + ' data-skip="' + config.skip + '"/>'))
							.append($sectionLegend)
							.append(this.build($('<div class="subsection"/>'), sectionSubsections, sectionSubIds));
		$container			.append($sectionFieldset);
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
	var enableName			= ids.join('_') + (ids.length ? '_' : '') + id,
	enableValue				= parseInt(this.values[enableName] || config['default'], 10),
	enableExanded			= false,
	enableSubsections		= {},
	enableHasSubsections	= 0;
	$.each(this.values, function(property, value) {
		if (property.indexOf(enable + '_') === 0) {
			enableExanded	= true;
		}
	});
	var that				= this;
	$.each(config, function(property, value) {
		if (that.reserved.indexOf(property) < 0) {
			enableSubsections[property] = value;
			++enableHasSubsections;
		}
	});
	if (enableHasSubsections) {
		var enableSubIds	= ids.slice(0);
		enableSubIds.push(id);
		
		var $enableSkip		= $('<input type="radio" id="' + enableName + '.skip" name="' + enableName + '" class="skip" value="0"' + ((enableValue == 0) ? ' checked="checked"' : '') + '>'),
		$enableSkipLabel	= $('<label class="enable" for="' + enableName + '.skip">Skip</label>'),
		$enableEnable		= $('<input type="radio" id="' + enableName + '.enable" name="' + enableName + '" class="enable" value="1"' + ((enableValue == 1) ? ' checked="checked"' : '') + '>'),
		$enableEnableLabel	= $('<label class="enable" for="' + enableName + '.enable">Enable</label>'),
		$enableConfigure	= $('<input type="radio" id="' + enableName + '.configure" name="' + enableName + '" class="configure" value="2"' + ((enableValue == 2) ? ' checked="checked"' : '') + '>'),
		$enableConfigureLabel	= $('<label class="enable" for="' + enableName + '.configure">Configure</label>');
		
		var $enableFieldset	= $('<fieldset/>')
							.append($('<legend class="label"/>').append($('<label for="' + enableName + '.enable"' + (config.emphasize ? ' class="emphasize"' : '') + '/>').text(config.label).append($('<span class="id"/>').text(enableName.split('_').join('.')))))
							.append($enableEnable, $enableEnableLabel, $enableConfigure, $enableConfigureLabel, $enableSkip, $enableSkipLabel)
							.append(this.build($('<div class="subsection"/>'), enableSubsections, enableSubIds));
		$container			.append($enableFieldset);
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
	var manualName			= ids.join('_') + (ids.length ? '_' : '') + id,
	$manualElement			= $('<span class="manual"><input type="checkbox" name="' + manualName + '" value="1" data-skip="' + config.skip + '"' + (!!config['default'] ? ' checked="checked"' : '')+ '/> Enable and edit manually</span>');
	$container.append($('<label' + (config.emphasize ? ' class="emphasize"' : '') + '/>').text(config.label).append($('<span class="id"/>').text(manualName.split('_').join('.'))).prepend($manualElement));
}
}

new SVGSpriteConfigurator(@@include('02_config.json', {}), $('#configurator'));