const instance_skel = require('../../instance_skel');
let debug;
let log;

function instance(system, id, config) {
	var self = this;
	// super-constructor
	instance_skel.apply(this, arguments);

	return self;
}

instance.prototype.tallyOnListener = function (label, variable, value) {
	const self = this;
	const { tallyOnEnabled, tallyOnVariable, tallyOnValue, tallyOnEnabled2, tallyOnVariable2 } = self.config;

	// Check for tally variable, if not enabled or other tally skip
	if (!tallyOnEnabled || `${label}:${variable}` !== tallyOnVariable) {
		return;
	}

	// if(tallyOnEnabled2) {
	// 	//check for extra tally
	// 	if(tallyOnVariable != tallyOnVariable2) {
	// 		return;
	// 	}
	// }

	// send tally info

	self.system.emit('variable_parse', tallyOnValue, (parsedValue) => {
		debug('variable changed... updating tally', { label, variable, value, parsedValue });
		self.system.emit('action_run', {
			action: (value === parsedValue ? 'tallyOn' : 'tallyOff'),
			instance: self.id
		});
	});
}

instance.prototype.setupEventListeners = function () {
	const self = this;

	if (self.config.tallyOnEnabled && self.config.tallyOnVariable) {
		if (!self.activeTallyOnListener) {
			self.activeTallyOnListener = self.tallyOnListener.bind(self);
			self.system.on('variable_changed', self.activeTallyOnListener);
		}
	} else if (self.activeTallyOnListener) {
		self.system.removeListener('variable_changed', self.activeTallyOnListener);
		delete self.activeTallyOnListener;
	}
}

instance.prototype.init = function () {
	var self = this;

	debug = self.debug;
	log = self.log;

	self.status(self.STATUS_WARNING, 'connecting');
	self.actions(); // export actions
	self.init_variables();
	self.setInitialVariables();
	self.setupEventListeners();
}

instance.prototype.setInitialVariables = function() {
	var self = this;
	self.setVariable('tallySource', "none");
	self.setVariable('tallyOn', "off");
}

instance.prototype.updateConfig = function (config) {
	var self = this;
	self.config = config;
	self.status(self.STATUS_UNKNOWN);
	self.setupEventListeners();
};

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;

	const dynamicVariableChoices = [];
	self.system.emit('variable_get_definitions', (definitions) =>
		Object.entries(definitions).forEach(([instanceLabel, variables]) =>
			variables.forEach((variable) =>
				dynamicVariableChoices.push({
					id: `${instanceLabel}:${variable.name}`,
					label: `${instanceLabel}:${variable.name}`
				})
			)
		)
	);

	return [
		{
			type: 'text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'This module controls checks variable for tally'
		},
		{
			type: 'text',
			id: 'tallyOnInfo',
			width: 12,
			label: 'Tally On',
			value: 'Set tally ON when the variable from an other instance equals the value'
		},
		{
			type: 'checkbox',
			id: 'tallyOnEnabled',
			width: 1,
			label: 'Enable',
			default: true
		},
		{
			type: 'dropdown',
			id: 'tallyOnVariable',
			label: 'Tally On Variable',
			width: 6,
			tooltip: 'The instance label and variable name',
			choices: dynamicVariableChoices,
			minChoicesForSearch: 5
		},
		{
			type: 'textinput',
			id: 'tallyOnValue',
			label: 'Tally On Value',
			width: 5,
			tooltip: 'When the variable equals this value, the camera tally light will be turned on.  Also supports dynamic variable references.  For example, $(atem:short_1)'
		},
		{
			type: 'checkbox',
			id: 'tallyOnEnabled2',
			width: 1,
			label: 'Enable comparison',
			default: false
		},
		{
			type: 'dropdown',
			id: 'tallyOnVariable2',
			label: 'Tally Variable to compare',
			width: 6,
			tooltip: 'The instance label and variable name',
			choices: dynamicVariableChoices,
			minChoicesForSearch: 5
		}
	]
};

// When module gets deleted
instance.prototype.destroy = function () {
	var self = this;
	if (self.activeTallyOnListener) {
		self.system.removeListener('variable_changed', self.activeTallyOnListener);
		delete self.activeTallyOnListener;
	}
}

instance.prototype.init_variables = function () {
	var self = this;
	var variables = [];
	variables.push({ name: 'tallySource', label: 'Tally source' });
	variables.push({ name: 'tallyOn', label: 'Tally on' });
	self.setVariableDefinitions(variables);
};

instance.prototype.actions = function (system) {
	var self = this;

	self.system.emit('instance_actions', self.id, {
		'tallyOn': { label: 'Some action' },
		'tallyOff': { label: 'Some action1' }
	});
};

instance.prototype.action = function (action) {
	var self = this;
	var opt = action.options;
	var cmd = '';

	switch (action.action) {

		case 'tallyOn':
			console.log("Tally ON");
			break;

		case 'tallyOff':
			console.log("Tally OFF");
			break;
	}
};

instance_skel.extendedBy(instance);
exports = module.exports = instance;
