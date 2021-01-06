const instance_skel = require('../../instance_skel');
const actions = require('./actions');
let debug;
let log;

class instance extends instance_skel {

	constructor(system, id, config) {
		super(system, id, config)
		this.release_time = 200; // ms to send button release
		this.value1;
		this.value2;
		Object.assign(this, {
			...actions,
		});

		this.actions()
	}

	actions(system) {
		this.setActions(this.getActions());
	}

	// Return config fields for instance config
	config_fields() {
		const dynamicVariableChoices = [];
		this.system.emit('variable_get_definitions', (definitions) =>
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
				label: 'Tally On (Basic)',
				value: 'Set tally ON when the variable from an other instance equals the value'
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
				label: 'Tally On Value (also dynamic!)',
				width: 6,
				tooltip: 'When the variable equals this value, the camera tally light will be turned on.  Also supports dynamic variable references.  For example, $(atem:aux1)'
			},
			{
				type: 'text',
				id: 'tallyOnInfo',
				width: 12,
				label: 'Action',
				value: 'When Tally is on press a button on the streamdeck'
			},
			{
				type: 'checkbox',
				id: 'buttonEnabled',
				width: 2,
				label: 'Enable press on button when tally',
				default: false
			},
			{
				type: 'textinput',
				id: 'buttonBank',
				label: 'Page',
				width: 2
			},
			{
				type: 'textinput',
				id: 'buttonButton',
				label: 'Bank',
				width: 2
			},
		]
	};

	tallyOnListener (label, variable, value) {
		const { tallyOnVariable, tallyOnValue, buttonBank, buttonButton, buttonEnabled } = this.config;
		this.status(this.STATUS_OK);

		if (`${label}:${variable}` != tallyOnVariable) {
			return;
		}
		this.setVariable('tallySource', value);
		this.system.emit('variable_parse', tallyOnValue, (parsedValue) => {
			if (value == parsedValue) {
				this.setVariable('tallyOn', 'On')
					if(!!buttonBank && !!buttonButton && buttonEnabled) {
						this.press_button(buttonBank, buttonButton)
					}
			} else {
				setTimeout(() => {
					this.setVariable('tallyOn', 'Off')
				}, this.release_time);
			}
		});

		// internal action
		// this.system.emit('action_run', {
		// 	action: (value === parsedValue ? 'tallyOn' : 'tallyOff'),
		// 	instance: this.id
		// });
	}

	setupEventListeners() {
		if (this.activeTallyOnListener) {
			this.system.removeListener('variable_changed', this.activeTallyOnListener);
			delete this.activeTallyOnListener;
		}
		if (this.config.tallyOnVariable) {
				this.activeTallyOnListener = this.tallyOnListener.bind(this);
				this.system.on('variable_changed', this.activeTallyOnListener);
		}
	}

	init() {
		debug = this.debug;
		log = this.log;

		this.status(this.STATUS_UNKNOWN);
		this.actions(); // export actions
		this.init_variables();
		this.setInitialVariables();
		this.setupEventListeners();
	}

	setInitialVariables() {
		const { tallyOnVariable } = this.config;
		if(!!tallyOnVariable){
			let pos = tallyOnVariable.search(":");
			this.system.emit('variable_get', tallyOnVariable.slice(0, pos), tallyOnVariable.slice(pos+1), (value) => {
				this.setVariable('tallySource', value);
			})
		}
		this.setVariable('tallyOn', "off");
	}

	updateConfig(config) {
		this.config = config;
		this.status(this.STATUS_UNKNOWN);
		this.setInitialVariables();
		this.setupEventListeners();
	};

	// When module gets deleted
	destroy() {
		if (this.activeTallyOnListener) {
			this.system.removeListener('variable_changed', this.activeTallyOnListener);
			delete this.activeTallyOnListener;
		}
	}

	init_variables() {
		var variables = [];
		variables.push({ name: 'tallySource', label: 'Tally source' });
		variables.push({ name: 'tallyOn', label: 'Tally on' });
		this.setVariableDefinitions(variables);
	};

	action(action) {
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

	press_button(bank, button) {
		bank = parseInt(bank);
		button = parseInt(button);

		this.system.emit('bank_pressed', bank, button, true);

		setTimeout(() => {
			this.system.emit('bank_pressed', bank, button, false);
		}, this.release_time);
	}
}
exports = module.exports = instance;
