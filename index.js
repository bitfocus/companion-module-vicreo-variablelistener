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
		// this.setActions(this.getActions());
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
				value: 'This module checks variables and presses a button'
			},
			{
				type: 'text',
				id: 'tallyOnInfo',
				width: 12,
				label: 'Criteria',
				value: 'When the variable from an instance equals the value'
			},
			{
				type: 'dropdown',
				id: 'tallyOnVariable',
				label: 'Variable',
				width: 6,
				tooltip: 'The instance label and variable name',
				choices: dynamicVariableChoices,
				minChoicesForSearch: 5
			},
			{
				type: 'textinput',
				id: 'tallyOnValue',
				label: 'Value (also dynamic!)',
				width: 6,
				default: 'atem:aux1_input',
				tooltip: 'Also supports dynamic variable references.  For example; atem:aux1_input'
			},
			{
				type: 'text',
				id: 'tallyOnInfo',
				width: 12,
				label: 'Action',
				value: 'When equal press a button on the streamdeck'
			},
			{
				type: 'checkbox',
				id: 'buttonEnabled',
				width: 2,
				label: 'Enable press on button when equal',
				default: false
			},
			{
				type: 'text',
				id: 'tallyOnInfo_on',
				width: 12,
				label: 'Action',
				value: 'When equal, which button to press'
			},
			{
				type: 'textinput',
				id: 'buttonPage_on',
				label: 'Page',
				width: 2
			},
			{
				type: 'textinput',
				id: 'buttonBank_on',
				label: 'Bank',
				width: 2
			},
			{
				type: 'text',
				id: 'tallyOnInfo_off',
				width: 12,
				label: 'Action',
				value: 'When not equal, which button to press'
			},
			{
				type: 'textinput',
				id: 'buttonPage_off',
				label: 'Page',
				width: 2
			},
			{
				type: 'textinput',
				id: 'buttonBank_off',
				label: 'Bank',
				width: 2
			},
		]
	};

	tallyOnListener (label, variable, value) {
		const { tallyOnVariable, tallyOnValue, buttonBank_on, buttonPage_on, buttonBank_off, buttonPage_off, buttonEnabled } = this.config;
		this.status(this.STATUS_OK);
		if (`${label}:${variable}` == tallyOnVariable) {
			this.setVariable('tallyVariable', value);
			this.system.emit('variable_parse', tallyOnValue, (parsedValue) => {
				this.setVariable('tallyValue', parsedValue);
				if (value == parsedValue) {
					this.setVariable('tallyOn', 'On')
					if(!!buttonPage_on && !!buttonBank_on && buttonEnabled) {
						this.press_button(buttonPage_on, buttonBank_on)
					}
				} else {
					setTimeout(() => {
						this.setVariable('tallyOn', 'Off')
						if(!!buttonBank_off && !!buttonPage_off && buttonEnabled) {
							this.press_button(buttonPage_off, buttonBank_off)
						}
					}, this.release_time);
				}
			});
		} else if (`$(${label}:${variable})` == tallyOnValue) {
			this.setVariable('tallyValue', value);
			this.system.emit('variable_parse', "$("+tallyOnVariable +")", (parsedValue) => {
				this.setVariable('tallyVariable', parsedValue);
				if (value == parsedValue) {
					this.setVariable('tallyOn', 'On')
					if(!!buttonPage_on && !!buttonBank_on && buttonEnabled) {
						this.press_button(buttonPage_on, buttonBank_on)
					}
				} else {
					setTimeout(() => {
						this.setVariable('tallyOn', 'Off')
						if(!!buttonBank_off && !!buttonPage_off && buttonEnabled) {
							this.press_button(buttonPage_off, buttonBank_off)
						}
					}, this.release_time);
				}
			});
		}
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
		const { tallyOnVariable, tallyOnValue } = this.config;
		if(!!tallyOnVariable){
			let pos = tallyOnVariable.search(":");
			this.system.emit('variable_get', tallyOnVariable.slice(0, pos), tallyOnVariable.slice(pos+1), (value) => {
				this.setVariable('tallyVariable', value);
			})
		}
		if(!!tallyOnValue){
			this.system.emit('variable_parse', tallyOnValue, (parsedValue) => {
				this.setVariable('tallyValue', parsedValue);
			});
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
		variables.push({ name: 'tallyVariable', label: 'Variable' });
		variables.push({ name: 'tallyValue', label: 'Value' });
		variables.push({ name: 'tallyOn', label: 'Equal' });
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
