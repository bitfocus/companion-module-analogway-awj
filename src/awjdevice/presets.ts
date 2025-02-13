import { Config } from '../config.js'
import {AWJinstance} from '../index.js'
import Choices from './choices.js'
import {
	combineRgb,
	CompanionButtonStyleProps,
	CompanionPresetDefinitions,
	CompanionTextSize,
	splitRgb
} from '@companion-module/base'
import Constants from './constants.js'
import { StateMachine } from '../state.js'


export default class Presets {
	/** reference to the instance */
	instance: AWJinstance
	/** The state object to take the data from */
	state: StateMachine
	/** reference to the constants of the device */
	constants: typeof Constants
	/** lists with choices */
	protected choices: Choices
	/** configuration for the instance */
	config: Config

	readonly presetsToUse: string[] = [
		'masterMemories',
		'screenMemories',
		'auxMemories',
		'layerMemories',
		'takeAllScreens',
		'takeSelectedScreens',
		'takeScreen',
		'cutAllScreens',
		'cutSelectedScreens',
		'cutScreen',
		'toggleSync',
		'selectPreset',
		'presetToggle',
		'copyPreviewFromProgram',
		'toggleScreenSelection',
		'toggleLockPgmAllScreens',
		'toggleLockPgmScreen',
		'toggleLockPvwAllScreens',
		'toggleLockPvwScreen',
		'selectLayer',
		'chooseInput',
		'toggleFreezeInput',
		'toggleFreezeLayer',
		'toggleFreezeScreen',
		'posSize',
		'multiviewerMemories',
		'selectWidget',
		'toggleWidgetSelection',
		'selectWidgetSource',
		'timers',
		'stream',
	]

	constructor(instance: AWJinstance) {
		this.instance = instance
		this.state = this.instance.state
		this.constants = this.instance.constants
		this.choices = this.instance.choices
		this.config= this.instance.config
	}

	inverseColorBW(color: number): number {
		return (0.2126 * splitRgb(color).r + 0.7152 * splitRgb(color).g + 0.0722* splitRgb(color).b) > 127
		? 0x000000
		: 0xffffff
	}

	/**
	 * Object with all exported preset definitions
	 */
	get allPresets() {
		const presetDefinitions: CompanionPresetDefinitions = this.presetsToUse.reduce(
			(prev, curr) => { return {...prev, ...this[curr] }},
			{}
		)
        
        return presetDefinitions
	}

		// MARK: Master Memories
	get masterMemories() {
		const presets: CompanionPresetDefinitions = {}
		const ilabel = this.instance.label

		for (const memory of this.choices.getMasterMemoryArray()) {
			// const label = state.get(['DEVICE', 'device', 'presetBank', 'bankList', 'items', memory, 'control', 'pp', 'label'])
			const bgcolor = parseInt(this.state.get(['REMOTE', 'banks', 'master', 'items', memory.id, 'color'])?.slice(1), 16)
			presets[`Load Master Memory ${memory.id}`] = {
			type: 'button',
				name: `Load Master Memory ${memory.id}`,
				category: 'Master Memories',
				style: {
					text: `MM${memory.id}\\n$(${ilabel}:masterMemory${memory.id}label)`,
					size: 'auto',
					color: this.inverseColorBW(bgcolor),
					bgcolor,
				},
				steps: [
					{
					down: [
						{
							actionId: 'deviceMasterMemory',
							options: {
								preset: 'sel',
								memory: memory.id,
								selectScreens: true,
							},
						},
					],
					up: [],
					},
					],
				feedbacks: [
					{
						feedbackId: 'deviceMasterMemory',
						options: {
							memory: memory.id,
							preset: 'pvw',
						},
						style: {
							color: this.inverseColorBW(this.config.color_green),
							bgcolor: this.config.color_green,
						},
					},
					{
						feedbackId: 'deviceMasterMemory',
						options: {
							memory: memory.id,
							preset: 'pgm',
						},
						style: {
							color: this.inverseColorBW(this.config.color_red),
							bgcolor: this.config.color_red,
						},
					},
				],
			}
		}

		return presets
	}

		// MARK: Screen Memories
	get screenMemories() {
		const presets: CompanionPresetDefinitions = {}
		const ilabel = this.instance.label

		for (const screen of [{ id: 'sel', label: 'Selected', index: '0' }, ...this.choices.getScreensArray(), ...this.choices.getAuxArray()]) {
			for (const memory of this.choices.getScreenMemoryArray()) {
				// const label = this.state.get(['DEVICE', 'device', 'presetBank', 'bankList', 'items', memory, 'control', 'pp', 'label'])
				const bgcolor = parseInt(this.state.get(['REMOTE', 'banks', 'screen', 'items', memory.id, 'color'])?.slice(1), 16)

				presets[`LoadScreenMemory_${memory.id}_to_${screen.id}`] = {
					type: 'button',
					name: `Load Screen Memory ${memory.id} into screen ${screen.id}${screen.label ? ' ('+screen.label+')' : ''}`,
					category: `Screen Memories into ${screen.id != 'sel' ? screen.id : 'Selection'}`,
					style: {
						text: `SM${memory.id}${screen.id != 'sel' ? ' '+screen.id : ''}\\n$(${ilabel}:screenMemory${memory.id}label)`,
						size: 'auto',
						color: this.inverseColorBW(bgcolor),
						bgcolor,
					},
					steps: [
						{
							down: [
								{
									actionId: 'deviceScreenMemory',
									options: {
										screens: [screen.id],
										preset: screen.id === 'sel' ? 'sel' : 'pvw',
										memory: memory.id,
										selectScreens: false,
									},
								},
							],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: 'deviceScreenMemory',
							options: {
								screens: screen.id != 'sel' ? [screen.id] : ['all'],
								preset: 'pvw',
								memory: memory.id,
								unmodified: 0,
							},
							style: {
								color: this.inverseColorBW(this.config.color_green),
								bgcolor: this.config.color_green,
							},
						},
						{
							feedbackId: 'deviceScreenMemory',
							options: {
								screens: screen.id != 'sel' ? [screen.id] : ['all'],
								preset: 'pgm',
								memory: memory.id,
								unmodified: 0,
							},
							style: {
								color: this.inverseColorBW(this.config.color_red),
								bgcolor: this.config.color_red,
							},
						},
						{
							feedbackId: 'deviceScreenMemory',
							options: {
								screens: screen.id != 'sel' ? [screen.id] : ['all'],
								preset: 'pvw',
								memory: memory.id,
								unmodified: 1,
							},
							style: {
								color: this.inverseColorBW(this.config.color_greendark),
								bgcolor: this.config.color_greendark,
							},
						},
						{
							feedbackId: 'deviceScreenMemory',
							options: {
								screens: screen.id != 'sel' ? [screen.id] : ['all'],
								preset: 'pgm',
								memory: memory.id,
								unmodified: 1,
							},
							style: {
								color: this.inverseColorBW(this.config.color_reddark),
								bgcolor: this.config.color_reddark,
							},
						},
					],
				}
			}
		}

		return presets
	}

		// MARK: Aux Memories
	get auxMemories(): CompanionPresetDefinitions {
		return {} as CompanionPresetDefinitions
	}

	// MARK: Layer Memories
	get layerMemories() {
		const presets: CompanionPresetDefinitions = {}
		const ilabel = this.instance.label

		for (const memory of this.choices.getLayerMemoryArray()) {
			const bgcolor = parseInt(this.state.get(['REMOTE', 'banks', 'layer', 'items', memory.id, 'color'])?.slice(1), 16)

			presets[`Load Layer Memory${memory.id}`] = {
			type: 'button',
				name: `Load Layer Memory ${memory.id} ${memory.label}`,
				category: 'Layer Memories',
				style: {
					text: `LM${memory.id}\\n$(${ilabel}:layerMemory${memory.id}label)`,
					size: 'auto',
					color: this.inverseColorBW(bgcolor),
					bgcolor,
				},
				steps: [
	{
	down: [
					{
						actionId: 'deviceLayerMemory',
						options: {
							method: 'sel',
							screen: 'S1',
							preset: 'pvw',
							layer: '1',
							memory: memory.id,
						},
					},
				],
				up: [],
	},
	],
				feedbacks: [],
			}
		}

		return presets
	}

		// MARK: Take All Screens
	get takeAllScreens() {
		const presets: CompanionPresetDefinitions = {}

		presets['Take All Screens'] = {
			type: 'button',
			name: 'Take All Screens',
			category: 'Transition',
			style: {
				text: 'Take\\nAll',
				size: 'auto',
				color: this.config.color_bright,
				bgcolor: this.config.color_reddark,
			},
			steps: [
	{
	down: [
				{
					actionId: 'deviceTakeScreen',
					options: {
						screens: ['all'],
					},
				},
			],
			up: [],
	},
	],
			feedbacks: [
				{
					feedbackId: 'deviceTake',
					options: {
						screens: ['all'],
					},
					style: {
						color: this.inverseColorBW(this.config.color_red),
						bgcolor: this.config.color_red,
					},
				},
			],
		}

		return presets
	}

	// MARK: Take Selected Screens
	get takeSelectedScreens() {
		const presets: CompanionPresetDefinitions = {}

		presets['Take Selected Screens'] = {
			type: 'button',
			name: 'Take Selected Screens',
			category: 'Transition',
			style: {
				text: 'Take\\nSel',
				size: 'auto',
				color: this.config.color_bright,
				bgcolor: this.config.color_reddark,
			},
			steps: [
	{
	down: [
				{
					actionId: 'deviceTakeScreen',
					options: {
						screens: ['sel'],
					},
				},
			],
			up: [],
	},
	],
			feedbacks: [
				{
					feedbackId: 'deviceTake',
					options: {
						screens: ['all'],
					},
					style: {
						color: this.inverseColorBW(this.config.color_red),
						bgcolor: this.config.color_red,
					},
				},
			],
		}
		return presets
	}

	// MARK: Take Screen ...
	get takeScreen() {
		const presets: CompanionPresetDefinitions = {}

		for (const screen of this.choices.getChosenScreenAuxes('all')) {
			presets['Take Screen ' + screen] = {
			type: 'button',
				name: 'Take Screen ' + screen,
				category: 'Transition',
				style: {
					text: 'Take\\n' + screen,
					size: 'auto',
					color: this.config.color_bright,
					bgcolor: this.config.color_reddark,
				},
				steps: [
	{
	down: [
					{
						actionId: 'deviceTakeScreen',
						options: {
							screens: [screen],
						},
					},
				],
				up: [],
	},
	],
				feedbacks: [
					{
						feedbackId: 'deviceTake',
						options: {
							screens: [screen],
						},
						style: {
							color: this.inverseColorBW(this.config.color_red),
							bgcolor: this.config.color_red,
						},
					},
				],
			}
		}
		return presets
	}

	// MARK: Cut All Screens
	get cutAllScreens() {
		const presets: CompanionPresetDefinitions = {}

		presets['Cut All Screens'] = {
			type: 'button',
			name: 'Cut All Screens',
			category: 'Transition',
			style: {
				text: 'Cut\\nAll',
				size: 'auto',
				color: this.config.color_bright,
				bgcolor: this.config.color_reddark,
			},
			steps: [
	{
	down: [
				{
					actionId: 'deviceCutScreen',
					options: {
						screens: ['all'],
					},
				},
			],
			up: [],
	},
	],
			feedbacks: [],
		}
		return presets
	}

	// MARK: Cut Selected Screens
	get cutSelectedScreens() {
		const presets: CompanionPresetDefinitions = {}

		presets['Cut Selected Screens'] = {
			type: 'button',
			name: 'Cut Selected Screens',
			category: 'Transition',
			style: {
				text: 'Cut\\nSel',
				size: 'auto',
				color: this.config.color_bright,
				bgcolor: this.config.color_reddark,
			},
			steps: [
	{
	down: [
				{
					actionId: 'deviceCutScreen',
					options: {
						screens: ['sel'],
					},
				},
			],
			up: [],
	},
	],
			feedbacks: [],
		}

		return presets
	}

	// MARK: Cut Screen ...
	get cutScreen() {
		const presets: CompanionPresetDefinitions = {}

		for (const screen of this.choices.getChosenScreenAuxes('all')) {
			presets['Cut Screen ' + screen] = {
			type: 'button',
				name: 'Cut Screen ' + screen,
				category: 'Transition',
				style: {
					text: 'Cut\\n' + screen,
					size: 'auto',
					color: this.config.color_bright,
					bgcolor: this.config.color_reddark,
				},
				steps: [
	{
	down: [
					{
						actionId: 'deviceCutScreen',
						options: {
							screens: [screen],
						},
					},
				],
				up: [],
	},
	],
				feedbacks: [],
			}
		}

		return presets
	}

	// MARK: Toggle Sync
	get toggleSync() {
		const presets: CompanionPresetDefinitions = {}
		const ilabel = this.instance.label

		presets['Toggle Sync'] = {
			type: 'button',
			name: 'Toggle Sync',
			category: 'Live',
			style: {
				text: `$(${ilabel}:connectionLabel)\\n🔗\\nLocal`,
				size: '18',
				color: this.config.color_bright,
				bgcolor: this.config.color_dark,
				show_topbar: false,
			} as CompanionButtonStyleProps, // TODO: add show_topbar to type definition
			steps: [
	{
	down: [
				{
					actionId: 'remoteSync',
					options: {
						sync: 2,
					},
				},
			],
			up: [],
	},
	],
			feedbacks: [
				{
					feedbackId: 'syncselection',
					options: {},
					style: {
						text: `$(${ilabel}:connectionLabel)\\n🔗\\nSynced`,
						color: this.inverseColorBW(this.config.color_highlight),
						bgcolor: this.config.color_highlight,
					},
				},
			],
		}

		return presets
	}

	// MARK: Select Preset
	get selectPreset() {
		const presets: CompanionPresetDefinitions = {}

		presets['Toggle Preset'] = {
			type: 'button',
			name: 'Toggle Preset',
			category: 'Live',
			style: {
				text: 'Toggle preset\\nPGM/PVW',
				size: '14',
				color: this.config.color_bright,
				bgcolor: this.config.color_dark,
			},
			steps: [
				{
					down: [
						{
							actionId: 'selectPreset',
							options: {
								mode: 'tgl',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'livePresetSelection',
					options: {
						preset: 'PREVIEW',
					},
					style: {
						text: 'PVW',
						size: '24',
						color: this.inverseColorBW(this.config.color_green),
						bgcolor: this.config.color_green,
						png64: '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'
					},
				},
				{
					feedbackId: 'livePresetSelection',
					options: {
						preset: 'PROGRAM',
					},
					style: {
						text: 'PGM',
						size: '24',
						color: this.inverseColorBW(this.config.color_red),
						bgcolor: this.config.color_red,
						png64: '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'
					},
				},
			],
		}

		return presets
	}

	// MARK: Preset Toggle
	get presetToggle() {
		const presets: CompanionPresetDefinitions = {}

		presets['Preset Toggle'] = {
			type: 'button',
			name: 'Preset Toggle',
			category: 'Live',
			style: {
				text: 'Preset\\nToggle\\noff',
				size: '14',
				color: this.config.color_bright,
				bgcolor: this.config.color_dark,
			},
			steps: [
				{
					down: [
						{
							actionId: 'devicePresetToggle',
							options: {
								action: 'toggle',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'presetToggle',
					options: {},
					style: {
						text: 'Preset\\nToggle\\non',
						color: this.inverseColorBW(this.config.color_highlight),
						bgcolor: this.config.color_highlight,
					},
				},
			],
		}

		return presets
	}

	// MARK: Copy preview from program
	get copyPreviewFromProgram() {
		const presets: CompanionPresetDefinitions = {}

		presets['Copy program of selected screens to preview'] = {
			type: 'button',
			name: 'Copy program of selected screens to preview',
			category: 'Live',
			style: {
				text: 'Copy\\nPgm➔Pvw\\nSelected',
				size: '14',
				color: this.config.color_bright,
				bgcolor: this.config.color_dark,
			},
			steps: [
				{
					down: [
						{
							actionId: 'deviceCopyProgram',
							options: {
								screens: ['sel'],
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}

		return presets
	}

	// MARK: Toggle Screen X Selection
	get toggleScreenSelection() {
		const presets: CompanionPresetDefinitions = {}
		const ilabel = this.instance.label

		for (const screen of this.choices.getChosenScreenAuxes('all')) {
			presets['Do intelligent selection for screen ' + screen] = {
				type: 'button',
				name: 'Do intelligent selection for screen ' + screen,
				category: 'Screens',
				style: {
					text: 'Select ' + screen,
					size: 'auto',
					color: this.config.color_bright,
					bgcolor: this.config.color_dark,
				},
				steps: [
					{
						down: [
							{
								actionId: 'selectScreen',
								options: {
									screen: screen,
									sel: 4,
								},
							},
						],
						up: [
							{
								actionId: 'selectScreen',
								options: {
									screen: screen,
									sel: 5,
								},
							},
						],
					}
				],
				feedbacks: [
					{
						feedbackId: 'liveScreenSelection',
						options: {
							screen: screen,
						},
						style: {
							color: this.inverseColorBW(this.config.color_highlight),
							bgcolor: this.config.color_highlight,
						},
					},
				],
			}
			presets['Toggle Screen ' + screen + ' Selection and show some useful data of PGM'] = {
				type: 'button',
				name: 'Toggle Screen ' + screen + ' Selection and show some useful data of PGM',
				category: 'Screens',
				style: {
					text: `${screen} PGM\\n$(${ilabel}:screen${screen}label)\\n$(${ilabel}:screen${screen}timePGM)\\n$(${ilabel}:screen${screen}memoryPGM)$(${ilabel}:screen${screen}memoryModifiedPGM)\\n$(${ilabel}:screen${screen}memoryLabelPGM)`,
					size: 'auto',
					color: this.config.color_bright,
					bgcolor: this.config.color_reddark,
				},
				steps: [
					{
						down: [
							{
								actionId: 'selectScreen',
								options: {
									screen: screen,
									sel: 2,
								},
							},
						],
						up: [],
					}
				],
				feedbacks: [
					{
						feedbackId: 'liveScreenSelection',
						options: {
							screen: screen,
						},
						style: {
							color: this.inverseColorBW(this.config.color_highlight),
							bgcolor: this.config.color_highlight,
						},
					},
				],
			}
			presets['Copy PGM of ' + screen + ' to PVW and show some useful data of PVW'] = {
			type: 'button',
				name: 'Copy PGM of ' + screen + ' to PVW and show some useful data of PVW',
				category: 'Screens',
				style: {
					text: `${screen} PVW\\n$(${ilabel}:screen${screen}label)\\n$(${ilabel}:screen${screen}timePVW)\\n$(${ilabel}:screen${screen}memoryPVW)$(${ilabel}:screen${screen}memoryModifiedPVW)\\n$(${ilabel}:screen${screen}memoryLabelPVW)`,
					size: 'auto',
					color: this.config.color_bright,
					bgcolor: this.config.color_greendark,
				},
				steps: [
	{
	down: [
					{
						actionId: 'deviceCopyProgram',
						options: {
							screens: [screen],
						},
					},
				],
				up: [],
	},
	],
				feedbacks: [
					{
						feedbackId: 'remoteLayerSelection',
						options: {
							screen: screen,
							layer: 'all',
							preset: 'all',
						},
						style: {
							color: this.inverseColorBW(this.config.color_highlight),
							bgcolor: this.config.color_highlight,
						},
					},
				],
			}
		}

		return presets
	}

	// MARK: Toggle Lock PGM All Screens
	get toggleLockPgmAllScreens() {
		const presets: CompanionPresetDefinitions = {}

		presets['Toggle Lock PGM All Screens'] = {
			type: 'button',
			name: 'Toggle Lock PGM All Screens',
			category: 'Lock Screens',
			style: {
				text: 'PGM',
				size: '24',
				color: this.config.color_dark,
				bgcolor: this.config.color_reddark,
				png64:
					'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3CAYAAACo29JGAAABt0lEQVRoge1ay5LEIAiErf1uR/lx9jJOGddXFEZj2UeNSNtExARgY6D2BMYYzvURker8KsZLhHLQICpqsIdUDEmSIoZqpGoOp8ZLkPwZNdCgVtVJIkKNsBwmVwDCjchgZj8GAGRC/HdkcMEBBAAgIjDGsDGmxZwfg96uMYZHFNVQDokIAIDvrP7r9fo8KxWi3cplHEevVtiYczZhgyEK5RH1xJULHa5tFNpJXJKcD0cAaHc8fs4vzhKpYGWIkQtVWwVHuadiKIlrABEvOe99cunCUsohymaGJZRzzn1YWWsvfSOEpysXh11Izlr7j+wdTCeXgnMOnHPDdqaTk37PQkwnN7Ib1jCdXEo5Zr6Q7l2A23cbq6F0wJ6unCaa81yh4PT9Q4602PGFa2tEDSdxqWpAo6rYOiy3Jve1s2X0nuA3ilt15Zg5ecv1bledW51cWJu1tEtClVzDlt16G92FrTeUQ24AtXrmMTfOOeQIqH+PVyUX5LKYCCaeEYe6cv5zVtTMQZ8apm0oW5xQZkKdXC6R3/ic3I2j3FNxzpZPxdbktCtx9SNWCUe5Xsz+CeBcpz8VW5PbGn/AbcB8DcHhggAAAABJRU5ErkJggg==',
			},
			steps: [
	{
	down: [
				{
					actionId: 'lockScreen',
					options: {
						screens: ['all'],
						preset: 'PROGRAM',
						lock: 'toggle',
					},
				},
			],
			up: [],
	},
	],
			feedbacks: [
				{
					feedbackId: 'liveScreenLock',
					options: {
						screen: 'all',
						preset: 'PROGRAM',
					},
					style: {
						color: this.inverseColorBW(this.config.color_redgrey),
						bgcolor: this.config.color_redgrey,
						png64:
							'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3CAYAAACo29JGAAABSklEQVRoge2a2w7DIAhAZdl3N60/zp5MjBNLBdwknKe19cIZLdVlKTkGrCc4jgOpazln0/lNBh8JUViIqg44I9WiKaky0J0UwHgaxO/uAADXdYnieol6J7lYacNp9xSxHMVMwHV77KXzaQySzlTWmiB5gRB9JM+geuZKkIjIFivt2zHEscx27GWtFmvOd+fp3Xq9MWazp565JgNAiZXr2vPXqMm1cXIDb9uVL0fD26xa/gMhtyshtyshtyshtyshtyuu5YarU40ffKwZbYdcZ+7NbWi89WKBiAkA2Dt815kLuV1hP3NSzvOE6vOSKrwkc7VY79gKczlKZIWgqdydgLWg64IScrPcVUXrqrmioHQFVrwOVr0KcHRsRbzndiXkJLhdofyakJsl1paGuJYz3YmvWolQuM6cazn2banwPzMVnsThOnOu5VzzARnBeIM8tq0ZAAAAAElFTkSuQmCC',
					},
				},
			],
		}

		return presets
	}

	// MARK: Toggle Lock PGM Screen ...
	get toggleLockPgmScreen() {
		const presets: CompanionPresetDefinitions = {}

		for (const screen of this.choices.getChosenScreenAuxes('all')) {
			presets['Toggle Lock PGM Screen ' + screen] = {
			type: 'button',
				name: 'Toggle Lock PGM Screen ' + screen,
				category: 'Lock Screens',
				style: {
					text: screen + '\\nPGM',
					size: '18',
					color: this.config.color_dark,
					bgcolor: this.config.color_reddark,
					png64:
						'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3CAYAAACo29JGAAABt0lEQVRoge1ay5LEIAiErf1uR/lx9jJOGddXFEZj2UeNSNtExARgY6D2BMYYzvURker8KsZLhHLQICpqsIdUDEmSIoZqpGoOp8ZLkPwZNdCgVtVJIkKNsBwmVwDCjchgZj8GAGRC/HdkcMEBBAAgIjDGsDGmxZwfg96uMYZHFNVQDokIAIDvrP7r9fo8KxWi3cplHEevVtiYczZhgyEK5RH1xJULHa5tFNpJXJKcD0cAaHc8fs4vzhKpYGWIkQtVWwVHuadiKIlrABEvOe99cunCUsohymaGJZRzzn1YWWsvfSOEpysXh11Izlr7j+wdTCeXgnMOnHPDdqaTk37PQkwnN7Ib1jCdXEo5Zr6Q7l2A23cbq6F0wJ6unCaa81yh4PT9Q4602PGFa2tEDSdxqWpAo6rYOiy3Jve1s2X0nuA3ilt15Zg5ecv1bledW51cWJu1tEtClVzDlt16G92FrTeUQ24AtXrmMTfOOeQIqH+PVyUX5LKYCCaeEYe6cv5zVtTMQZ8apm0oW5xQZkKdXC6R3/ic3I2j3FNxzpZPxdbktCtx9SNWCUe5Xsz+CeBcpz8VW5PbGn/AbcB8DcHhggAAAABJRU5ErkJggg==',
				},
				steps: [
	{
	down: [
					{
						actionId: 'lockScreen',
						options: {
							screens: [screen],
							preset: 'PROGRAM',
							lock: 'toggle',
						},
					},
				],
				up: [],
	},
	],
				feedbacks: [
					{
						feedbackId: 'liveScreenLock',
						options: {
							screen: screen,
							preset: 'PROGRAM',
						},
						style: {
							color: this.inverseColorBW(this.config.color_redgrey),
							bgcolor: this.config.color_redgrey,
							png64:
								'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3CAYAAACo29JGAAABSklEQVRoge2a2w7DIAhAZdl3N60/zp5MjBNLBdwknKe19cIZLdVlKTkGrCc4jgOpazln0/lNBh8JUViIqg44I9WiKaky0J0UwHgaxO/uAADXdYnieol6J7lYacNp9xSxHMVMwHV77KXzaQySzlTWmiB5gRB9JM+geuZKkIjIFivt2zHEscx27GWtFmvOd+fp3Xq9MWazp565JgNAiZXr2vPXqMm1cXIDb9uVL0fD26xa/gMhtyshtyshtyshtyshtyuu5YarU40ffKwZbYdcZ+7NbWi89WKBiAkA2Dt815kLuV1hP3NSzvOE6vOSKrwkc7VY79gKczlKZIWgqdydgLWg64IScrPcVUXrqrmioHQFVrwOVr0KcHRsRbzndiXkJLhdofyakJsl1paGuJYz3YmvWolQuM6cazn2banwPzMVnsThOnOu5VzzARnBeIM8tq0ZAAAAAElFTkSuQmCC',
						},
					},
				],
			}
		}

		return presets
	}

	// MARK: Toggle Lock PVW All Screens
	get toggleLockPvwAllScreens() {
		const presets: CompanionPresetDefinitions = {}

		presets['Toggle Lock PVW All Screens'] = {
			type: 'button',
			name: 'Toggle Lock PVW All Screens',
			category: 'Lock Screens',
			style: {
				text: 'PVW',
				size: '24',
				color: this.config.color_dark,
				bgcolor: this.config.color_greendark,
				png64:
					'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3CAYAAACo29JGAAABt0lEQVRoge1ay5LEIAiErf1uR/lx9jJOGddXFEZj2UeNSNtExARgY6D2BMYYzvURker8KsZLhHLQICpqsIdUDEmSIoZqpGoOp8ZLkPwZNdCgVtVJIkKNsBwmVwDCjchgZj8GAGRC/HdkcMEBBAAgIjDGsDGmxZwfg96uMYZHFNVQDokIAIDvrP7r9fo8KxWi3cplHEevVtiYczZhgyEK5RH1xJULHa5tFNpJXJKcD0cAaHc8fs4vzhKpYGWIkQtVWwVHuadiKIlrABEvOe99cunCUsohymaGJZRzzn1YWWsvfSOEpysXh11Izlr7j+wdTCeXgnMOnHPDdqaTk37PQkwnN7Ib1jCdXEo5Zr6Q7l2A23cbq6F0wJ6unCaa81yh4PT9Q4602PGFa2tEDSdxqWpAo6rYOiy3Jve1s2X0nuA3ilt15Zg5ecv1bledW51cWJu1tEtClVzDlt16G92FrTeUQ24AtXrmMTfOOeQIqH+PVyUX5LKYCCaeEYe6cv5zVtTMQZ8apm0oW5xQZkKdXC6R3/ic3I2j3FNxzpZPxdbktCtx9SNWCUe5Xsz+CeBcpz8VW5PbGn/AbcB8DcHhggAAAABJRU5ErkJggg==',
			},
			steps: [
	{
	down: [
				{
					actionId: 'lockScreen',
					options: {
						screens: ['all'],
						preset: 'PREVIEW',
						lock: 'toggle',
					},
				},
			],
			up: [],
	},
	],
			feedbacks: [
				{
					feedbackId: 'liveScreenLock',
					options: {
						screen: 'all',
						preset: 'PREVIEW',
					},
					style: {
						color: this.inverseColorBW(this.config.color_greengrey),
						bgcolor: this.config.color_greengrey,
						png64:
							'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3CAYAAACo29JGAAABSklEQVRoge2a2w7DIAhAZdl3N60/zp5MjBNLBdwknKe19cIZLdVlKTkGrCc4jgOpazln0/lNBh8JUViIqg44I9WiKaky0J0UwHgaxO/uAADXdYnieol6J7lYacNp9xSxHMVMwHV77KXzaQySzlTWmiB5gRB9JM+geuZKkIjIFivt2zHEscx27GWtFmvOd+fp3Xq9MWazp565JgNAiZXr2vPXqMm1cXIDb9uVL0fD26xa/gMhtyshtyshtyshtyshtyuu5YarU40ffKwZbYdcZ+7NbWi89WKBiAkA2Dt815kLuV1hP3NSzvOE6vOSKrwkc7VY79gKczlKZIWgqdydgLWg64IScrPcVUXrqrmioHQFVrwOVr0KcHRsRbzndiXkJLhdofyakJsl1paGuJYz3YmvWolQuM6cazn2banwPzMVnsThOnOu5VzzARnBeIM8tq0ZAAAAAElFTkSuQmCC',
					},
				},
			],
		}

		return presets
	}

	// MARK: Toggle Lock PVW Screen ...
	get toggleLockPvwScreen() {
		const presets: CompanionPresetDefinitions = {}

		for (const screen of this.choices.getChosenScreenAuxes('all')) {
			presets['Toggle Lock PVW Screen ' + screen] = {
			type: 'button',
				name: 'Toggle Lock PVW Screen ' + screen,
				category: 'Lock Screens',
				style: {
					text: screen + '\\nPVW',
					size: '18',
					color: this.config.color_dark,
					bgcolor: this.config.color_greendark,
					png64:
						'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3CAYAAACo29JGAAABt0lEQVRoge1ay5LEIAiErf1uR/lx9jJOGddXFEZj2UeNSNtExARgY6D2BMYYzvURker8KsZLhHLQICpqsIdUDEmSIoZqpGoOp8ZLkPwZNdCgVtVJIkKNsBwmVwDCjchgZj8GAGRC/HdkcMEBBAAgIjDGsDGmxZwfg96uMYZHFNVQDokIAIDvrP7r9fo8KxWi3cplHEevVtiYczZhgyEK5RH1xJULHa5tFNpJXJKcD0cAaHc8fs4vzhKpYGWIkQtVWwVHuadiKIlrABEvOe99cunCUsohymaGJZRzzn1YWWsvfSOEpysXh11Izlr7j+wdTCeXgnMOnHPDdqaTk37PQkwnN7Ib1jCdXEo5Zr6Q7l2A23cbq6F0wJ6unCaa81yh4PT9Q4602PGFa2tEDSdxqWpAo6rYOiy3Jve1s2X0nuA3ilt15Zg5ecv1bledW51cWJu1tEtClVzDlt16G92FrTeUQ24AtXrmMTfOOeQIqH+PVyUX5LKYCCaeEYe6cv5zVtTMQZ8apm0oW5xQZkKdXC6R3/ic3I2j3FNxzpZPxdbktCtx9SNWCUe5Xsz+CeBcpz8VW5PbGn/AbcB8DcHhggAAAABJRU5ErkJggg==',
				},
				steps: [
	{
	down: [
					{
						actionId: 'lockScreen',
						options: {
							screens: [screen],
							preset: 'PREVIEW',
							lock: 'toggle',
						},
					},
				],
				up: [],
	},
	],
				feedbacks: [
					{
						feedbackId: 'liveScreenLock',
						options: {
							screen: screen,
							preset: 'PREVIEW',
						},
						style: {
							color: this.inverseColorBW(this.config.color_greengrey),
							bgcolor: this.config.color_greengrey,
							png64:
								'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3CAYAAACo29JGAAABSklEQVRoge2a2w7DIAhAZdl3N60/zp5MjBNLBdwknKe19cIZLdVlKTkGrCc4jgOpazln0/lNBh8JUViIqg44I9WiKaky0J0UwHgaxO/uAADXdYnieol6J7lYacNp9xSxHMVMwHV77KXzaQySzlTWmiB5gRB9JM+geuZKkIjIFivt2zHEscx27GWtFmvOd+fp3Xq9MWazp565JgNAiZXr2vPXqMm1cXIDb9uVL0fD26xa/gMhtyshtyshtyshtyshtyuu5YarU40ffKwZbYdcZ+7NbWi89WKBiAkA2Dt815kLuV1hP3NSzvOE6vOSKrwkc7VY79gKczlKZIWgqdydgLWg64IScrPcVUXrqrmioHQFVrwOVr0KcHRsRbzndiXkJLhdofyakJsl1paGuJYz3YmvWolQuM6cazn2banwPzMVnsThOnOu5VzzARnBeIM8tq0ZAAAAAElFTkSuQmCC',
						},
					},
				],
			}
		}

		return presets
	}

	// MARK: Select Layer
	get selectLayer() {
		const presets: CompanionPresetDefinitions = {}

		for (const screen of this.choices.getScreensAuxArray()) {
			for (const layer of this.choices.getLayerChoices(screen.id)) {
				presets['Select Layer' + layer.label + ' of ' + screen.id] = {
			type: 'button',
					name: 'Select Layer' + layer.label + ' of ' + screen.id,
					category: 'Select Layers',
					style: {
						text: 'Select ' + screen.id + ' ' + layer.label.replace('Layer ', 'L'),
						size: '14',
						color: this.config.color_bright,
						bgcolor: this.config.color_dark,
					},
					steps: [
	{
	down: [
						{
							actionId: 'selectLayer',
							options: {
								method: 'spec',
								screen: [screen.id],
								layersel: ['1'],
								[`layer${screen.id}`]: [layer.id],
							},
						},
					],
					up: [],
	},
	],
					feedbacks: [
						{
							feedbackId: 'remoteLayerSelection',
							options: {
								screen: screen.id,
								layer: layer.id,
								preset: 'all',
							},
							style: {
								color: this.inverseColorBW(this.config.color_highlight),
								bgcolor: this.config.color_highlight,
							},
						},
					],
				}
				presets['Toggle Layer' + layer.label + ' of ' + screen.id] = {
					type: 'button',
					name: 'Toggle Layer' + layer.label + ' of ' + screen.id,
					category: 'Select Layers',
					style: {
						text: 'Toggle ' + screen.id + ' ' + layer.label.replace('Layer ', 'L'),
						size: '14',
						color: this.config.color_bright,
						bgcolor: this.config.color_dark,
					},
					steps: [
	{
	down: [
						{
							actionId: 'selectLayer',
							options: {
								method: 'spectgl',
								screen: [screen.id],
								layersel: ['1'],
								[`layer${screen.id}`]: [layer.id],
							},
						},
					],
					up: [],
	},
	],
					feedbacks: [
						{
							feedbackId: 'remoteLayerSelection',
							options: {
								screen: screen.id,
								layer: layer.id,
								preset: 'all',
							},
							style: {
								color: this.inverseColorBW(this.config.color_highlight),
								bgcolor: this.config.color_highlight,
							},
						},
					],
				}
			}
		}

		return presets
	}

	// MARK: Choose Input ...
	get chooseInput() {
		const presets: CompanionPresetDefinitions = {}

		return presets
	}

	// MARK: Toggle Freeze Input ...
	get toggleFreezeInput() {
		const presets: CompanionPresetDefinitions = {}

		for (const input of this.choices.getLiveInputArray()) {
			presets['Toggle Freeze ' + input.id] = {
			type: 'button',
				name: 'Toggle Freeze ' + input.label,
				category: 'Input Freeze',
				style: {
					text: 'Freeze\\nIn ' + input.index,
					size: 'auto',
					color: this.config.color_bright,
					bgcolor: this.config.color_dark,
				},
				steps: [
					{
					down: [
									{
										actionId: 'deviceInputFreeze',
										options: {
											input: input.id,
											mode: 2,
										},
									},
								],
								up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'deviceInputFreeze',
						options: {
							input: input.id,
						},
						style: {
							color: 0xffffff,
							bgcolor: combineRgb(0, 0, 100),
							png64:
								'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3AQMAAACSFUAFAAABS2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxMzggNzkuMTU5ODI0LCAyMDE2LzA5LzE0LTAxOjA5OjAxICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+IEmuOgAAAARnQU1BAACxjwv8YQUAAAABc1JHQgCuzhzpAAAABlBMVEUAAABfXKLsUQDeAAAAAXRSTlMAQObYZgAAAM9JREFUGNONkTEOwjAMRX9UpDC1nIBwEKRyJCMGmNogDsCRyMY1wg26ESTUYLc1sEGWp1h2/vcPABDG84MrWoxXOgxcUycol7tbEFb748Aim4HmKZyXSCZsUFpQwQ1OeIqorsxzQHFnXgCTmT3PtczErD1ZEXCBXJR6RzXXzSNR3wA2NrvkPCpf52gDZnDZw3Oj7Ue/xfObM9gMSL/LgfttbHPH8+bRb+U9tIla0XVx1FP9yY/6U7/qX/fR/XRf3f+Th+Yz5aX5vfPUfP/6jxdhImTMvNrBOgAAAABJRU5ErkJggg==',
						},
					},
				],
			}
		}

		return presets
	}

	// MARK: Toggle Freeze Layer ...
	get toggleFreezeLayer() {
		const presets: CompanionPresetDefinitions = {}

		const screens = this.choices.getScreensArray()
		for (const screen of screens) {
			for (const layer of this.choices.getLayersAsArray(screen.id, true).filter(lay => lay.id !== 'TOP')) {
				presets[`toggleFreeze${screen.id}${layer.longname}`] = {
				type: 'button',
					name: `Toggle Freeze ${screen.id} ${layer.longname}`,
					category: 'Layer Freeze',
					style: {
						text: `Freeze\\n${screen.id} ${layer.longname}`,
						size: 'auto',
						color: this.config.color_bright,
						bgcolor: this.config.color_dark,
					},
					steps: [
						{
						down: [
										{
											actionId: 'deviceLayerFreeze',
											options: {
												screen: [screen.id],
												...Object.fromEntries( 
													screens.map(scr => [`layer${scr.id}`, scr.id === screen.id ? [layer.id] : ['1']])
												),
												mode: 2,
											},
										},
									],
									up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: 'deviceLayerFreeze',
							options: {
								screen: screen.id,
								...Object.fromEntries( 
									screens.map(scr => [`layer${scr.id}`, scr.id === screen.id ? layer.id : '1'])
								),
							},
							style: {
								color: 0xffffff,
								bgcolor: combineRgb(0, 0, 100),
								png64:
									'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3AQMAAACSFUAFAAABS2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxMzggNzkuMTU5ODI0LCAyMDE2LzA5LzE0LTAxOjA5OjAxICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+IEmuOgAAAARnQU1BAACxjwv8YQUAAAABc1JHQgCuzhzpAAAABlBMVEUAAABfXKLsUQDeAAAAAXRSTlMAQObYZgAAAM9JREFUGNONkTEOwjAMRX9UpDC1nIBwEKRyJCMGmNogDsCRyMY1wg26ESTUYLc1sEGWp1h2/vcPABDG84MrWoxXOgxcUycol7tbEFb748Aim4HmKZyXSCZsUFpQwQ1OeIqorsxzQHFnXgCTmT3PtczErD1ZEXCBXJR6RzXXzSNR3wA2NrvkPCpf52gDZnDZw3Oj7Ue/xfObM9gMSL/LgfttbHPH8+bRb+U9tIla0XVx1FP9yY/6U7/qX/fR/XRf3f+Th+Yz5aX5vfPUfP/6jxdhImTMvNrBOgAAAABJRU5ErkJggg==',
							},
						},
					],
				}
			}
		}

		return presets
	}

	// MARK: Toggle Freeze Screen ...
	get toggleFreezeScreen() {
		const presets: CompanionPresetDefinitions = {}

		const screens = this.choices.getScreensAuxArray()
		for (const screen of screens) {
			presets[`toggleFreeze${screen.id}`] = {
			type: 'button',
				name: `Toggle Freeze ${screen.id}`,
				category: 'Screen Freeze',
				style: {
					text: `Freeze\\n${screen.id}`,
					size: 'auto',
					color: this.config.color_bright,
					bgcolor: this.config.color_dark,
				},
				steps: [
					{
					down: [
									{
										actionId: 'deviceScreenFreeze',
										options: {
											screen: [screen.id],
											mode: 2,
										},
									},
								],
								up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'deviceScreenFreeze',
						options: {
							screen: screen.id,
						},
						style: {
							color: 0xffffff,
							bgcolor: combineRgb(0, 0, 100),
							png64:
								'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3AQMAAACSFUAFAAABS2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxMzggNzkuMTU5ODI0LCAyMDE2LzA5LzE0LTAxOjA5OjAxICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+IEmuOgAAAARnQU1BAACxjwv8YQUAAAABc1JHQgCuzhzpAAAABlBMVEUAAABfXKLsUQDeAAAAAXRSTlMAQObYZgAAAM9JREFUGNONkTEOwjAMRX9UpDC1nIBwEKRyJCMGmNogDsCRyMY1wg26ESTUYLc1sEGWp1h2/vcPABDG84MrWoxXOgxcUycol7tbEFb748Aim4HmKZyXSCZsUFpQwQ1OeIqorsxzQHFnXgCTmT3PtczErD1ZEXCBXJR6RzXXzSNR3wA2NrvkPCpf52gDZnDZw3Oj7Ue/xfObM9gMSL/LgfttbHPH8+bRb+U9tIla0XVx1FP9yY/6U7/qX/fR/XRf3f+Th+Yz5aX5vfPUfP/6jxdhImTMvNrBOgAAAABJRU5ErkJggg==',
						},
					},
				],
			}
		}

		return presets
	}

	// MARK: Position/Size
	get posSize() {
		//type DevicePositionSize = {screen: string, preset: string, layersel: string, parameters: string[], x: string, xAnchor: string, y: string, yAnchor: string, w: string, h: string, ar: string} & Record<string, string>

		// these values change for each preset, comon values are 'sel' for screen, preset and layers
		const defaultTextSize = '18'
		const values = [
			{
				name: 'Fullscreen',
				text: '',
				size: defaultTextSize,
				png64: 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAANhJREFUeJzt27ENhSAUQNHHjxPiDk7gGE7gDrIiVr8Tro3R6D2lWpCbR2wg1VpDbb+7F/B0BgIGAgYCBgJD60Up5VO/t5xzOnreDBQRkcfxmtU8TNm25ju3GOhO0N861fnqhdxhWtNC3zhBwEDAQMBAwEDAQMBAwEDAQMBAwEDAQMBAwEDAQMBAwEDAQMBAwEDAQMBAwEDAQMBAwEDAQMBAwEDAQMBAwEDAQMBAwEDAQMBAwEDAQODUOekz54nfygkC3Qnq3WH4iuSd1T63GDAQMBAwEDAQ2AFSYhUMjKzzcQAAAABJRU5ErkJggg==',
				parameters: ['x','y','w','h'],
				x: '0', 
				xAnchor: '0',
				y: '0',
				yAnchor: '0',
				w: 'sw',
				h: 'sh',
				ar: '',
			},{
				name: 'Screen center hor/ver',
				text: '',
				size: defaultTextSize,
				png64: 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAepJREFUeJztm8FN40AUhv9niAJHd8AGTntMBZGgAitKBykBcWAbgJSQDiJIB9CBrxyhCB9QEM7j4DXisKN/xuAsEv8nRbLksefl07MzM29i7g4RJvvfAXx3JIggQQQJIkgQYT90Yr1e7/bnzR3FdNr0fXMDmO20+6Io/tmhMogQzKCWkNkvx8wAbAGgmE4z7GiAxp4UZRBBgggSRJAgggQRJIggQQQJIkgQQYIIdKrRlbIsByntD1cr+z2bAQAeVqvBc1lGTzWqqvLJZPKaGGIUvQgqy3KQ5/lL0kXj8fvhwXi8OUiYzed5XqOn79JbBrX41jZxDQEAw/drIgVZ5sOOoUXRqyDf2uZu8esypq351o6BBQDcL47+uGVRj9jZxeP1Z2Jk6CVNkCCCBBEkiCBBBAsu/Zr9rKK9u6oaXQjXxW5vAXSrarQj6dRx0Hy5twCA5bw+TxwH+Wg06jSma6saReC8MoggQQQJIkgQQYIIvc7mLfNh9GzbHVg2h6cXT1cJuzsyAHWX+GJv/uVUVeVogq7RrPTEflpSrqkB9LKaCPSUQX+XP9Pu/WF3x+jkZLCr3R0MvYMIEkSQIIIEESSIIEEECSJIEEGCCBJEkCBCsKqh/2o0KIMI4bqYAKAMokgQQYIIEkSQIMIbSG+duN36wUwAAAAASUVORK5CYII=',
				parameters: ['x','y'],
				x: '0.5 * sw', 
				xAnchor: 'lx + 0.5 * lw',
				y: '0.5 * sh',
				yAnchor: 'ly + 0.5 * lh',
				w: 'lw',
				h: 'lh',
				ar: 'keep'
			},{
				name: 'Screen center hor',
				text: '',
				size: defaultTextSize,
				png64: 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAa1JREFUeJzt20FOwkAAheE3FQQXXIHoyMplOQKeoGm4iWGhWxfCEbxBQ7iBhgt061IOwUKJ2nHRQFzYvBl00MX7Vk1o0+ZnWmAyGOccpFny1xfw3ykQoUCEAhEKRLSaXlgsFof9eHMOWZ7X557PAWMOevosy749oUYQ0TiCtprK/jpjDIAKALI8T3CgL2jsTtEIIhSIUCBCgQgFIhSIUCBCgQgFIhSIUCBCgQgFIhSIUCBCgQgFIuiM4r6Wy2Wr1+t5z0aeFIW5GI8BAE9F0X4py6AZxeFw+BZ4iV6iBer3+68AjrwPSNPdZjdNN93ASfuyLI9jRIoWaMtVZuO3IwCgszvGM5BJXGfPS/MSO1D1MDu79tnRuMqcAzMAeJyd3jiTeN1io6vVbcxIekgTCkQoEKFAhAIRCkQoEKFAhAIRCkQoEKFAhAIRsX/NJ5eT56nXns4B9/XmaLK6C1jEGfVNjhno/QfHhswmfgDAer2OsqYxWiBrbTfogC+LOO1g0A5dxGmtDTqdLz2DCAUiFIhQIMI0PQv1X42aRhDROIKkphFEKBChQIQCEQpEfAKBt18fAq3lJwAAAABJRU5ErkJggg==',
				parameters: ['x'],
				x: '0.5 * sw', 
				xAnchor: 'lx + 0.5 * lw',
				y: '0.5 * sh',
				yAnchor: 'ly + 0.5 * lh',
				w: 'lw',
				h: 'lh',
				ar: 'keep'
			},{
				name: 'Screen center ver',
				text: '',
				size: defaultTextSize,
				png64: 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAQ9JREFUeJzt28EJwkAQQNFdsZKtxQpSi2ANgq0kFVjLtrKecpGMH6Jmxfx3NAfDZ8Ssg7m1lhQ79L6BX2cgYCBgIGAgcIwuTNO0q6+3YRjy0utOEAgnaBaV/Rf0SXGCgIGAgYCBgIGAgYCBgIGAgYCBgIEAnsWW1Fo3P+mXUrqcCZ0gsGqCZvdrOX/qRiKnS719+z1ecYKAgYCBgIGAgUAOd/M572qrkVpzq7FGvBcbx5TS8lZjfpLe8jnoW0/S81ZjCK47QcBAwEDAQMBA4K3TfO+T9hacILBqgnr9uteDEwQMBAwEDAQMBAwEDAQMBAwEDAQMBPAstrf/bDxzgkC8F1NKyQlCBgIGAgYCBgIPNlYwaAstuMYAAAAASUVORK5CYII=',
				parameters: ['y'],
				x: '0.5 * sw', 
				xAnchor: 'lx + 0.5 * lw',
				y: '0.5 * sh',
				yAnchor: 'ly + 0.5 * lh',
				w: 'lw',
				h: 'lh',
				ar: 'keep'
			},{
				name: 'Screen left',
				text: '',
				size: defaultTextSize,
				png64: 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAQhJREFUeJzt21EKgkAUQNE30UZyK7WCwa1Ea4jaiu6gnYgtZfrqJ5puBJrUPZ8KIpcnzgimUkqobvXtG1g6AwEDAQMBA4F17UTf93/1ess5p2fHnSBQnaC7WtlfQU+KEwQMBAwEDAQMBAwEDAQMBOoLxVIit21ERBmHISLNs15smmZRC1MnCOBWIyLictzsS1pNunndHcbzlNf/lBMEDAQMBAwEDAQMBAwEDAQMBAwEDAQMBAwE3trNbw/X01zfg5bGCQL1CUop+q6LnHNqZryhpXGCgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIEAfjD7t382HjlBIPnP6mtOEDAQMBAwEDAQuAGlOCPF79y6EAAAAABJRU5ErkJggg==',
				parameters: ['x'],
				x: '0', 
				xAnchor: 'lx',
				y: '0.5 * sh',
				yAnchor: 'ly + 0.5 * lh',
				w: 'lw',
				h: 'lh',
				ar: 'keep'
			},{
				name: 'Screen right',
				text: '',
				size: defaultTextSize,
				png64: 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAP1JREFUeJzt28EJwjAYQOFEnCRdxQkyhBMIziA4gTOUuoCzZJV46kWM71Cswb7vaAOWx1+0oY211qC23a9PoHcGAgYCBgIGAvvWgWmaNvXzlnOO7z53gkBzgmatsv+CrhQnCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgI4HbH2kopq23UpWEIOYRwH8fmGicIdDdBs8clnb79HccQrrTGCQIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgLd3s0fzgXvtBe78RInCHQ3QSml9R7YqtUHqJYyEDAQMBAwEDAQMBAwEMA/ilt7Z+OVEwSi76x+5gQBAwEDAQMBA4EnfJMi2Ja2aO0AAAAASUVORK5CYII=',
				parameters: ['x'],
				x: 'sw', 
				xAnchor: 'lx + lw',
				y: '0.5 * sh',
				yAnchor: 'ly + 0.5 * lh',
				w: 'lw',
				h: 'lh',
				ar: 'keep'
			},{
				name: 'Screen top',
				text: '',
				size: defaultTextSize,
				png64: 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAP5JREFUeJzt29EJglAYQOHfaJI7SxPoKkEzBK2iE7SKrmJPgkS3Y9yyyPM9Jlzl8KuYWI3jGMrbffsAfp2BgIGAgYCBwD63oeu6Td3e6rquHv2eDbR44aYpXeJlXduuti8MlCs7s/qkLTimxehMKZ6goe8jIuJ6TsfStcjhNFwiItKndzTjRRoYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgUP81Ppiftf+MEgeIJSim97c+rX+QEAQMBAwEDAQMBAwEDAQMBAwEDAQMBAwEDAQMBAwEDAQMBAwEDAQMBAwEDAQMBAwF8cbi1bzbuOUGg8pvV55wgYCBgIGAgYCBwA96yH8BghKhTAAAAAElFTkSuQmCC',
				parameters: ['y'],
				x: '0.5 * sw', 
				xAnchor: 'lx + 0.5 * lw',
				y: '0',
				yAnchor: 'ly',
				w: 'lw',
				h: 'lh',
				ar: 'keep'
			},{
				name: 'Screen bottom',
				text: '',
				size: defaultTextSize,
				png64: 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAQRJREFUeJzt28EJwjAYQOFUnCRdxQkyhBMIziA4gTuYCZwlq9SLvZk+pDGKvu9SUGjL47dSQoZpmoLqNp++gW9nIGAgYCBgILCtfZFz/qu/t5TS8OxzJwhUJ2hWK/sr6JfiBAEDAQMBAwEDAQMBAwEDAQMBAwEDAQMBAwEDAQMBAwEDAQMBAwEDAQMBAwEDAQMBXDhsqZTSfTk7xrhq4dMJAl0naHY7xcO7r7E7lnOL8zhBwEDAQMBAwEDAQMBAwEDAQMBAwEDAQMBAoOvbfBzHEEII+xCavGkvujyOKzcMYqCWezZSqxO9YO39d52gfL32vFwTg3tWl/mQBgYCBgIGAgYCd8ZEItkX5ZW/AAAAAElFTkSuQmCC',
				parameters: ['y'],
				x: '0.5 * sw', 
				xAnchor: 'lx + 0.5 * lw',
				y: 'sh',
				yAnchor: 'ly + lh',
				w: 'lw',
				h: 'lh',
				ar: 'keep'
			},{
				name: 'set A/R to 16/9, keep height',
				text: '16/9',
				size: defaultTextSize,
				png64: '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',
				parameters: ['h'],
				x: '0.5 * sw', 
				xAnchor: 'lx + 0.5 * lw',
				y: '0.5 * sh',
				yAnchor: 'ly + 0.5 * lh',
				w: 'lw',
				h: 'lh',
				ar: '16/9'
			},{
				name: 'set A/R to 16/9, keep width',
				text: '16/9',
				size: defaultTextSize,
				png64: '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',
				parameters: ['w'],
				x: '0.5 * sw', 
				xAnchor: 'lx + 0.5 * lw',
				y: '0.5 * sh',
				yAnchor: 'ly + 0.5 * lh',
				w: 'lw',
				h: 'lh',
				ar: '16/9'
			},{
				name: 'set A/R to 4/3, keep height',
				text: '4/3',
				size: defaultTextSize,
				png64: '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',
				parameters: ['h'],
				x: '0.5 * sw', 
				xAnchor: 'lx + 0.5 * lw',
				y: '0.5 * sh',
				yAnchor: 'ly + 0.5 * lh',
				w: 'lw',
				h: 'lh',
				ar: '4/3'
			},{
				name: 'set A/R to 4/3, keep width',
				text: '4/3',
				size: defaultTextSize,
				png64: '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',
				parameters: ['w'],
				x: '0.5 * sw', 
				xAnchor: 'lx + 0.5 * lw',
				y: '0.5 * sh',
				yAnchor: 'ly + 0.5 * lh',
				w: 'lw',
				h: 'lh',
				ar: '4/3'
			},{
				name: 'set A/R to source, keep height',
				text: 'SRC',
				size: defaultTextSize,
				png64: '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',
				parameters: ['h'],
				x: '0.5 * sw', 
				xAnchor: 'lx + 0.5 * lw',
				y: '0.5 * sh',
				yAnchor: 'ly + 0.5 * lh',
				w: 'lw',
				h: 'lh',
				ar: 'ia'
			},{
				name: 'set A/R to source, keep width',
				text: 'SRC',
				size: defaultTextSize,
				png64: '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',
				parameters: ['w'],
				x: '0.5 * sw', 
				xAnchor: 'lx + 0.5 * lw',
				y: '0.5 * sh',
				yAnchor: 'ly + 0.5 * lh',
				w: 'lw',
				h: 'lh',
				ar: 'ia'
			},{
				name: 'set size to source',
				text: 'SRC',
				size: defaultTextSize,
				png64: 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAATBJREFUeJzt28FNw0AQQNGZQAG500JudOIeQgdUARWQHiylDyjBR4rgAMshIopQzGctIbLa/462VrK/ZuXLOkspoXmr/36AS2cgYCBgIGAgcD13YxzHrj5vwzDkuetdTdB6mmI9TVVrZifoy1zZJmUedkUpx3eindLVBC2BE3SUmRHx8XePcpmcIPD7CTqx277fl1w195W7e8rH2jVOEFg0Qa163e8jIuKmYk1Xgd42m+o1bjFgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIMCnOzJvI+L59NJ2d/UQcThOsuTEREucIMATVMpLRJw9ClxzEKlVThAwEMAt1ts/G985QSD9Z/VnThAwEDAQMBAwEPgECvkr3gNZTAQAAAAASUVORK5CYII=+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAWZJREFUeJzt20FKw0AYhuH/r4LgBYqYjblCcwT3hdzBI4hnED2B3iHQA3iDdtdlyU48gYgLGRfiRhxfbWcSk34PdNNCJrydTMuEeAjBJG7S9wn8dwoEFAgoEFAgcBj7oGmavfp5q+vav3tfMwhEZ9CnWNmxoCtFMwgoENgukPvM3EPkNUt8jr3CNeivHheL5Wvbpj5sVFmWWdfI7QKFsDIzf1qtjk+q6tnMrN1szHx863myGfRwfXYZfNLZf6fzq/a2i3G0SAMFAgoEFAgoEFAgoEBAgYACAQUCCgQUCAw60NF6bbn3nwYd6HQ+NzNb5hxj0IG6kGw/6OL+4CbVsX7lrpthdppBb9Pp6G8u7jSDiqJ4sRD622d1z/4FaQ0Cye9qdKzKPcCwA33cXclKlxhQIKBAQIGAAgEFAgoEFAgoEFAgoEBAgYACAQUCuN2xb89sfKUZBFzPrP5MMwgoEFAgoEBAgcA77iI8lXJnSIMAAAAASUVORK5CYII=',
				parameters: ['w','h'],
				x: '0.5 * sw', 
				xAnchor: 'lx + 0.5 * lw',
				y: '0.5 * sh',
				yAnchor: 'ly + 0.5 * lh',
				w: 'iw',
				h: 'ih',
				ar: ''
			},{
				name: 'increase size',
				text: '+',
				size: '30',
				png64: 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAATBJREFUeJzt28FNw0AQQNGZQAG500JudOIeQgdUARWQHiylDyjBR4rgAMshIopQzGctIbLa/462VrK/ZuXLOkspoXmr/36AS2cgYCBgIGAgcD13YxzHrj5vwzDkuetdTdB6mmI9TVVrZifoy1zZJmUedkUpx3eindLVBC2BE3SUmRHx8XePcpmcIPD7CTqx277fl1w195W7e8rH2jVOEFg0Qa163e8jIuKmYk1Xgd42m+o1bjFgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIMCnOzJvI+L59NJ2d/UQcThOsuTEREucIMATVMpLRJw9ClxzEKlVThAwEMAt1ts/G985QSD9Z/VnThAwEDAQMBAwEPgECvkr3gNZTAQAAAAASUVORK5CYII=+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAWZJREFUeJzt20FKw0AYhuH/r4LgBYqYjblCcwT3hdzBI4hnED2B3iHQA3iDdtdlyU48gYgLGRfiRhxfbWcSk34PdNNCJrydTMuEeAjBJG7S9wn8dwoEFAgoEFAgcBj7oGmavfp5q+vav3tfMwhEZ9CnWNmxoCtFMwgoENgukPvM3EPkNUt8jr3CNeivHheL5Wvbpj5sVFmWWdfI7QKFsDIzf1qtjk+q6tnMrN1szHx863myGfRwfXYZfNLZf6fzq/a2i3G0SAMFAgoEFAgoEFAgoEBAgYACAQUCCgQUCAw60NF6bbn3nwYd6HQ+NzNb5hxj0IG6kGw/6OL+4CbVsX7lrpthdppBb9Pp6G8u7jSDiqJ4sRD622d1z/4FaQ0Cye9qdKzKPcCwA33cXclKlxhQIKBAQIGAAgEFAgoEFAgoEFAgoEBAgYACAQUCuN2xb89sfKUZBFzPrP5MMwgoEFAgoEBAgcA77iI8lXJnSIMAAAAASUVORK5CYII=',
				parameters: ['w'],
				x: '0.5 * sw', 
				xAnchor: 'bx + 0.5 * bw',
				y: '0.5 * sh',
				yAnchor: 'by + 0.5 * bh',
				w: 'lw * 1.01',
				h: 'lh * 1.01',
				ar: 'keep'
			},{
				name: 'decrease size',
				text: '-',
				size: '30',
				png64: 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAATBJREFUeJzt28FNw0AQQNGZQAG500JudOIeQgdUARWQHiylDyjBR4rgAMshIopQzGctIbLa/462VrK/ZuXLOkspoXmr/36AS2cgYCBgIGAgcD13YxzHrj5vwzDkuetdTdB6mmI9TVVrZifoy1zZJmUedkUpx3eindLVBC2BE3SUmRHx8XePcpmcIPD7CTqx277fl1w195W7e8rH2jVOEFg0Qa163e8jIuKmYk1Xgd42m+o1bjFgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIMCnOzJvI+L59NJ2d/UQcThOsuTEREucIMATVMpLRJw9ClxzEKlVThAwEMAt1ts/G985QSD9Z/VnThAwEDAQMBAwEPgECvkr3gNZTAQAAAAASUVORK5CYII=+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAWZJREFUeJzt20FKw0AYhuH/r4LgBYqYjblCcwT3hdzBI4hnED2B3iHQA3iDdtdlyU48gYgLGRfiRhxfbWcSk34PdNNCJrydTMuEeAjBJG7S9wn8dwoEFAgoEFAgcBj7oGmavfp5q+vav3tfMwhEZ9CnWNmxoCtFMwgoENgukPvM3EPkNUt8jr3CNeivHheL5Wvbpj5sVFmWWdfI7QKFsDIzf1qtjk+q6tnMrN1szHx863myGfRwfXYZfNLZf6fzq/a2i3G0SAMFAgoEFAgoEFAgoEBAgYACAQUCCgQUCAw60NF6bbn3nwYd6HQ+NzNb5hxj0IG6kGw/6OL+4CbVsX7lrpthdppBb9Pp6G8u7jSDiqJ4sRD622d1z/4FaQ0Cye9qdKzKPcCwA33cXclKlxhQIKBAQIGAAgEFAgoEFAgoEFAgoEBAgYACAQUCuN2xb89sfKUZBFzPrP5MMwgoEFAgoEBAgcA77iI8lXJnSIMAAAAASUVORK5CYII=',
				parameters: ['w'],
				x: '0.5 * sw', 
				xAnchor: 'bx + 0.5 * bw',
				y: '0.5 * sh',
				yAnchor: 'by + 0.5 * bh',
				w: 'lw / 1.01',
				h: 'lh / 1.01',
				ar: 'keep'
			},{
				name: 'increase width',
				text: '+',
				size: '30',
				png64: 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAARxJREFUeJzt270JwkAcQPE7cQB7u9SO4QQZwgkEZxCcwCEC9q4SO4ewOgs/QDE+TxCN936lchBf/hebS0wpBXUbfPsCfp2BgIGAgYCBwLDri6Zpivp7q+s6Pvq8qAkatW0YtW3Wms4Juugq20sxnnZFStffRDulqAl6B07QjcsdKIgTBLImaHd+wG2X1fwjV/Nhs3Vc5a5xgkDeM6jn9ptNCCGEccaaogIdJpPsNW4xYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCDw1umO6WKXfRCpr5wgkDVBVVX9z5HgFzlBwEAAt1hp72zcc4JA9J3V55wgYCBgIGAgYCBwBIbOJVyxYIi9AAAAAElFTkSuQmCC+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAATBJREFUeJzt28FNw0AQQNGZQAG500JudOIeQgdUARWQHiylDyjBR4rgAMshIopQzGctIbLa/462VrK/ZuXLOkspoXmr/36AS2cgYCBgIGAgcD13YxzHrj5vwzDkuetdTdB6mmI9TVVrZifoy1zZJmUedkUpx3eindLVBC2BE3SUmRHx8XePcpmcIPD7CTqx277fl1w195W7e8rH2jVOEFg0Qa163e8jIuKmYk1Xgd42m+o1bjFgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIMCnOzJvI+L59NJ2d/UQcThOsuTEREucIMATVMpLRJw9ClxzEKlVThAwEMAt1ts/G985QSD9Z/VnThAwEDAQMBAwEPgECvkr3gNZTAQAAAAASUVORK5CYII=+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAWZJREFUeJzt20FKw0AYhuH/r4LgBYqYjblCcwT3hdzBI4hnED2B3iHQA3iDdtdlyU48gYgLGRfiRhxfbWcSk34PdNNCJrydTMuEeAjBJG7S9wn8dwoEFAgoEFAgcBj7oGmavfp5q+vav3tfMwhEZ9CnWNmxoCtFMwgoENgukPvM3EPkNUt8jr3CNeivHheL5Wvbpj5sVFmWWdfI7QKFsDIzf1qtjk+q6tnMrN1szHx863myGfRwfXYZfNLZf6fzq/a2i3G0SAMFAgoEFAgoEFAgoEBAgYACAQUCCgQUCAw60NF6bbn3nwYd6HQ+NzNb5hxj0IG6kGw/6OL+4CbVsX7lrpthdppBb9Pp6G8u7jSDiqJ4sRD622d1z/4FaQ0Cye9qdKzKPcCwA33cXclKlxhQIKBAQIGAAgEFAgoEFAgoEFAgoEBAgYACAQUCuN2xb89sfKUZBFzPrP5MMwgoEFAgoEBAgcA77iI8lXJnSIMAAAAASUVORK5CYII=',
				parameters: ['w'],
				x: '0.5 * sw', 
				xAnchor: 'bx + 0.5 * bw',
				y: '0.5 * sh',
				yAnchor: 'by + 0.5 * bh',
				w: 'lw * 1.01',
				h: 'lh * 1.01',
				ar: ''
			},{
				name: 'decrease width',
				text: '-',
				size: '30',
				png64: 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAARxJREFUeJzt270JwkAcQPE7cQB7u9SO4QQZwgkEZxCcwCEC9q4SO4ewOgs/QDE+TxCN936lchBf/hebS0wpBXUbfPsCfp2BgIGAgYCBwLDri6Zpivp7q+s6Pvq8qAkatW0YtW3Wms4Juugq20sxnnZFStffRDulqAl6B07QjcsdKIgTBLImaHd+wG2X1fwjV/Nhs3Vc5a5xgkDeM6jn9ptNCCGEccaaogIdJpPsNW4xYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCDw1umO6WKXfRCpr5wgkDVBVVX9z5HgFzlBwEAAt1hp72zcc4JA9J3V55wgYCBgIGAgYCBwBIbOJVyxYIi9AAAAAElFTkSuQmCC+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAATBJREFUeJzt28FNw0AQQNGZQAG500JudOIeQgdUARWQHiylDyjBR4rgAMshIopQzGctIbLa/462VrK/ZuXLOkspoXmr/36AS2cgYCBgIGAgcD13YxzHrj5vwzDkuetdTdB6mmI9TVVrZifoy1zZJmUedkUpx3eindLVBC2BE3SUmRHx8XePcpmcIPD7CTqx277fl1w195W7e8rH2jVOEFg0Qa163e8jIuKmYk1Xgd42m+o1bjFgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIMCnOzJvI+L59NJ2d/UQcThOsuTEREucIMATVMpLRJw9ClxzEKlVThAwEMAt1ts/G985QSD9Z/VnThAwEDAQMBAwEPgECvkr3gNZTAQAAAAASUVORK5CYII=+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAWZJREFUeJzt20FKw0AYhuH/r4LgBYqYjblCcwT3hdzBI4hnED2B3iHQA3iDdtdlyU48gYgLGRfiRhxfbWcSk34PdNNCJrydTMuEeAjBJG7S9wn8dwoEFAgoEFAgcBj7oGmavfp5q+vav3tfMwhEZ9CnWNmxoCtFMwgoENgukPvM3EPkNUt8jr3CNeivHheL5Wvbpj5sVFmWWdfI7QKFsDIzf1qtjk+q6tnMrN1szHx863myGfRwfXYZfNLZf6fzq/a2i3G0SAMFAgoEFAgoEFAgoEBAgYACAQUCCgQUCAw60NF6bbn3nwYd6HQ+NzNb5hxj0IG6kGw/6OL+4CbVsX7lrpthdppBb9Pp6G8u7jSDiqJ4sRD622d1z/4FaQ0Cye9qdKzKPcCwA33cXclKlxhQIKBAQIGAAgEFAgoEFAgoEFAgoEBAgYACAQUCuN2xb89sfKUZBFzPrP5MMwgoEFAgoEBAgcA77iI8lXJnSIMAAAAASUVORK5CYII=',
				parameters: ['w'],
				x: '0.5 * sw', 
				xAnchor: 'bx + 0.5 * bw',
				y: '0.5 * sh',
				yAnchor: 'by + 0.5 * bh',
				w: 'lw / 1.01',
				h: 'lh / 1.01',
				ar: ''
			},{
				name: 'increase height',
				text: '+',
				size: '30',
				png64: 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAR5JREFUeJzt27FNw1AYReH7B7agwnU6VmAC78AIiBkQ2YAdLGUANoANonQMQcOjCopQnBMkEA45X+ko0tPRtdzY1VqLxs3++gBTZyBgIGAgYCBwPvbDMAwn9Xjr+752XXdBYHRBG2Nl/wu6U1wQwAV9qqok70myXq2SOt5hdV138OFdEDh8QVue7i9vW82O7il3fbdefPc/LggYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCPALVFVXSZ63L908nj0kyetymbf5/HdONhEuCPCCWntJsvOlx4ufPs0EuSBgIIC32Kl9s/GVCwLlN6v7uSBgIGAgYCBgIPABo2QklBYEXBkAAAAASUVORK5CYII=+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAATBJREFUeJzt28FNw0AQQNGZQAG500JudOIeQgdUARWQHiylDyjBR4rgAMshIopQzGctIbLa/462VrK/ZuXLOkspoXmr/36AS2cgYCBgIGAgcD13YxzHrj5vwzDkuetdTdB6mmI9TVVrZifoy1zZJmUedkUpx3eindLVBC2BE3SUmRHx8XePcpmcIPD7CTqx277fl1w195W7e8rH2jVOEFg0Qa163e8jIuKmYk1Xgd42m+o1bjFgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIMCnOzJvI+L59NJ2d/UQcThOsuTEREucIMATVMpLRJw9ClxzEKlVThAwEMAt1ts/G985QSD9Z/VnThAwEDAQMBAwEPgECvkr3gNZTAQAAAAASUVORK5CYII=+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAWZJREFUeJzt20FKw0AYhuH/r4LgBYqYjblCcwT3hdzBI4hnED2B3iHQA3iDdtdlyU48gYgLGRfiRhxfbWcSk34PdNNCJrydTMuEeAjBJG7S9wn8dwoEFAgoEFAgcBj7oGmavfp5q+vav3tfMwhEZ9CnWNmxoCtFMwgoENgukPvM3EPkNUt8jr3CNeivHheL5Wvbpj5sVFmWWdfI7QKFsDIzf1qtjk+q6tnMrN1szHx863myGfRwfXYZfNLZf6fzq/a2i3G0SAMFAgoEFAgoEFAgoEBAgYACAQUCCgQUCAw60NF6bbn3nwYd6HQ+NzNb5hxj0IG6kGw/6OL+4CbVsX7lrpthdppBb9Pp6G8u7jSDiqJ4sRD622d1z/4FaQ0Cye9qdKzKPcCwA33cXclKlxhQIKBAQIGAAgEFAgoEFAgoEFAgoEBAgYACAQUCuN2xb89sfKUZBFzPrP5MMwgoEFAgoEBAgcA77iI8lXJnSIMAAAAASUVORK5CYII=',
				parameters: ['h'],
				x: '0.5 * sw', 
				xAnchor: 'bx + 0.5 * bw',
				y: '0.5 * sh',
				yAnchor: 'by + 0.5 * bh',
				w: 'lw * 1.01',
				h: 'lh * 1.01',
				ar: ''
			},{
				name: 'decrease height',
				text: '-',
				size: '30',
				png64: 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAR5JREFUeJzt27FNw1AYReH7B7agwnU6VmAC78AIiBkQ2YAdLGUANoANonQMQcOjCopQnBMkEA45X+ko0tPRtdzY1VqLxs3++gBTZyBgIGAgYCBwPvbDMAwn9Xjr+752XXdBYHRBG2Nl/wu6U1wQwAV9qqok70myXq2SOt5hdV138OFdEDh8QVue7i9vW82O7il3fbdefPc/LggYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCPALVFVXSZ63L908nj0kyetymbf5/HdONhEuCPCCWntJsvOlx4ufPs0EuSBgIIC32Kl9s/GVCwLlN6v7uSBgIGAgYCBgIPABo2QklBYEXBkAAAAASUVORK5CYII=+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAATBJREFUeJzt28FNw0AQQNGZQAG500JudOIeQgdUARWQHiylDyjBR4rgAMshIopQzGctIbLa/462VrK/ZuXLOkspoXmr/36AS2cgYCBgIGAgcD13YxzHrj5vwzDkuetdTdB6mmI9TVVrZifoy1zZJmUedkUpx3eindLVBC2BE3SUmRHx8XePcpmcIPD7CTqx277fl1w195W7e8rH2jVOEFg0Qa163e8jIuKmYk1Xgd42m+o1bjFgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIMCnOzJvI+L59NJ2d/UQcThOsuTEREucIMATVMpLRJw9ClxzEKlVThAwEMAt1ts/G985QSD9Z/VnThAwEDAQMBAwEPgECvkr3gNZTAQAAAAASUVORK5CYII=+NAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAWZJREFUeJzt20FKw0AYhuH/r4LgBYqYjblCcwT3hdzBI4hnED2B3iHQA3iDdtdlyU48gYgLGRfiRhxfbWcSk34PdNNCJrydTMuEeAjBJG7S9wn8dwoEFAgoEFAgcBj7oGmavfp5q+vav3tfMwhEZ9CnWNmxoCtFMwgoENgukPvM3EPkNUt8jr3CNeivHheL5Wvbpj5sVFmWWdfI7QKFsDIzf1qtjk+q6tnMrN1szHx863myGfRwfXYZfNLZf6fzq/a2i3G0SAMFAgoEFAgoEFAgoEBAgYACAQUCCgQUCAw60NF6bbn3nwYd6HQ+NzNb5hxj0IG6kGw/6OL+4CbVsX7lrpthdppBb9Pp6G8u7jSDiqJ4sRD622d1z/4FaQ0Cye9qdKzKPcCwA33cXclKlxhQIKBAQIGAAgEFAgoEFAgoEFAgoEBAgYACAQUCuN2xb89sfKUZBFzPrP5MMwgoEFAgoEBAgcA77iI8lXJnSIMAAAAASUVORK5CYII=',
				parameters: ['h'],
				x: '0.5 * sw', 
				xAnchor: 'bx + 0.5 * bw',
				y: '0.5 * sh',
				yAnchor: 'by + 0.5 * bh',
				w: 'lw / 1.01',
				h: 'lh / 1.01',
				ar: ''
			},{
				name: 'move left',
				text: 'left',
				size: defaultTextSize,
				png64: undefined,
				parameters: ['x'],
				x: 'lx - 10', 
				xAnchor: 'lx',
				y: 'ly',
				yAnchor: 'ly',
				w: 'lw',
				h: 'lh',
				ar: 'keep'
			},{
				name: 'move right',
				text: 'right',
				size: defaultTextSize,
				png64: undefined,
				parameters: ['x'],
				x: 'lx + 10', 
				xAnchor: 'lx',
				y: '0.5 * sh',
				yAnchor: 'ly + 0.5 * lh',
				w: 'lw',
				h: 'lh',
				ar: 'keep'
			},{
				name: 'move up',
				text: 'up',
				size: defaultTextSize,
				png64: undefined,
				parameters: ['y'],
				x: 'lx', 
				xAnchor: 'lx',
				y: 'ly - 10',
				yAnchor: 'ly',
				w: 'lw',
				h: 'lh',
				ar: 'keep'
			},{
				name: 'move down',
				text: 'down',
				size: defaultTextSize,
				png64: undefined,
				parameters: ['y'],
				x: 'lx', 
				xAnchor: 'lx',
				y: 'ly + 10',
				yAnchor: 'ly',
				w: 'lw',
				h: 'lh',
				ar: 'keep'
			},


		]

		const presets: CompanionPresetDefinitions = {}
		const screensSelections = this.choices.getScreensAuxArray()
			.reduce((prev, scr) => {return {...prev, [`layer${scr.id}`]: 'sel'}}, {})

		for (const val of values) {
			presets[`posSize${val.name.replace(/\W/g, '')}`] = {
				type: 'button',
				name: `${val.name}`,
				category: 'Position / Size',
				style: {
					text: val.text,
					size: val.size as CompanionTextSize,
					color: this.config.color_bright,
					bgcolor: this.config.color_dark,
					png64: val.png64,
				},
				steps: [
					{
						down: [
							{
								actionId: 'devicePositionSize',
								options: {
									screen: 'sel',
									preset: 'sel',
									layersel: 'sel',
									...screensSelections,
									parameters: val.parameters,
									x: val.x, 
									xAnchor: val.xAnchor,
									y: val.y,
									yAnchor: val.yAnchor,
									w: val.w,
									h: val.h,
									ar: val.ar
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			}
		}

		presets[`posSizeSizeHVrot`] = {
			type: 'button',
			name: `size with rotary`,
			category: 'Position / Size',
			options: {
				rotaryActions: true
			},
			style: {
				text: '',
				size: 14 as CompanionTextSize,
				color: this.config.color_bright,
				bgcolor: this.config.color_dark,
				png64: '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',
			},
			steps: [
				{
					rotate_right: [
						{
							actionId: 'devicePositionSize',
							options: {
								screen: 'sel',
								preset: 'sel',
								layersel: 'sel',
								...screensSelections,
								parameters: ['w'],
								x: '0.5 * sw', 
								xAnchor: 'bx + 0.5 * bw',
								y: '0.5 * sh',
								yAnchor: 'by + 0.5 * bh',
								w: 'lw * 1.02',
								h: 'lh * 1.02',
								ar: 'keep'
							},
						},
					],
					rotate_left: [
						{
							actionId: 'devicePositionSize',
							options: {
								screen: 'sel',
								preset: 'sel',
								layersel: 'sel',
								...screensSelections,
								parameters: ['w'],
								x: '0.5 * sw', 
								xAnchor: 'bx + 0.5 * bw',
								y: '0.5 * sh',
								yAnchor: 'by + 0.5 * bh',
								w: 'lw / 1.02',
								h: 'lh / 1.02',
								ar: 'keep'
							},
						},
					],
					up: [],
					down: [],
				},
			],
			feedbacks: [],
		}


		return presets
	}

	// MARK: Multiviewer Memories
	get multiviewerMemories() {
		const presets: CompanionPresetDefinitions = {}
		const ilabel = this.instance.label

		const multiviewers = this.choices.getMultiviewerArray()
		const multimulti: boolean = multiviewers.length > 1
		for (const multiviewer of this.choices.getMultiviewerArray()) {
			for (const memory of this.choices.getMultiviewerMemoryArray()) {
				const bgcolor = parseInt(this.state.get(['REMOTE', 'banks', 'monitoring', 'items', memory.id, 'color'])?.slice(1), 16)

				presets['Load VM' + memory.id + multimulti ? ' on Multiviewer ' + multiviewer : ''] = {
			type: 'button',
					name: 'Load VM' + memory.id + multimulti ? ' on Multiviewer ' + multiviewer : '',
					category: 'Multiviewer Memories',
					style: {
						text: (multimulti ? `MV${multiviewer} `: '') +  `VM${memory.id}\\n$(${ilabel}:multiviewerMemory${memory.id}label)`,
						size: 'auto',
						color: this.inverseColorBW(bgcolor),
						bgcolor,
					},
					steps: [
	{
	down: [
						{
							actionId: 'deviceMultiviewerMemory',
							options: {
								memory: memory.id,
								multiviewer,
							},
						},
					],
					up: [],
	},
	],
					feedbacks: [],
				}
			}
		}

		return presets
	}

	// MARK: Select Widget
	get selectWidget() {
		const presets: CompanionPresetDefinitions = {}

		for (const widget of this.choices.getWidgetChoices()) {
			presets['Select ' + widget.label] = {
			type: 'button',
				name: 'Select ' + widget.label,
				category: 'Select Widgets',
				style: {
					text: 'Select ' + widget.label.replace(/Multiviewer /, 'MV').replace(/Widget /, 'W'),
					size: '14',
					color: this.config.color_bright,
					bgcolor: this.config.color_dark,
				},
				steps: [
					{
					down: [
									{
										actionId: 'remoteMultiviewerSelectWidget',
										options: {
											widget: widget.id,
											sel: 'selectExclusive',
										},
									},
								],
								up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'remoteWidgetSelection',
						options: {
							widget: widget.id,
						},
						style: {
							color: this.inverseColorBW(this.config.color_highlight),
							bgcolor: this.config.color_highlight,
						},
					},
				],
			}
		}

		return presets
	}

	// MARK: Toggle Widget Selection
	get toggleWidgetSelection() {
		const presets: CompanionPresetDefinitions = {}

		for (const widget of this.choices.getWidgetChoices()) {
			presets['Toggle Selection of ' + widget.label] = {
			type: 'button',
				name: 'Toggle Selection of ' + widget.label,
				category: 'Select Widgets',
				style: {
					text: 'Toggle ' + widget.label.replace(/Multiviewer /, 'MV').replace(/Widget /, 'W'),
					size: '14',
					color: this.config.color_bright,
					bgcolor: this.config.color_dark,
				},
				steps: [
					{
						down: [
							{
								actionId: 'remoteMultiviewerSelectWidget',
								options: {
									widget: widget.id,
									sel: 'toggle',
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'remoteWidgetSelection',
						options: {
							widget: widget.id,
						},
						style: {
							bgcolor: this.config.color_highlight,
						},
					},
				],
			}
		}

		return presets
	}

	// MARK: Select Widget Source
	get selectWidgetSource() {
		const presets: CompanionPresetDefinitions = {}

		for (const source of this.choices.getWidgetSourceChoices()) {
			presets['Select Widget Source' + source.label] = {
			type: 'button',
				name: 'Select Widget Source' + source.label,
				category: 'Multiviewer Source',
				style: {
					text: 'MV ' + source.label.replace(/ - /, '\\n'),
					size: 'auto',
					color: this.config.color_bright,
					bgcolor: this.config.color_dark,
				},
				steps: [
					{
						down: [
							{
								actionId: 'deviceMultiviewerSource',
								options: {
									widget: 'sel',
									source: source.id,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			}
		}

		return presets
	}

	// MARK: Timers
	get timers() {
		const presets: CompanionPresetDefinitions = {}

		for (const timer of this.choices.getTimerChoices()) {
			presets['Play/Pause ' + timer.label] = {
			type: 'button',
				name: 'Play/Pause ' + timer.label,
				category: 'Timer',
				style: {
					text: timer.label.replace(/\D/g, '') + '⏯',
					size: '30',
					color: this.config.color_bright,
					bgcolor: this.config.color_dark,
				},
				steps: [
					{
						down: [
							{
								actionId: 'deviceTimerTransport',
								options: {
									timer: timer.id,
									cmd: 'tgl_start_pause',
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'timerState',
						options: {
							timer: timer.id,
							state: 'RUNNING'
						},
						style: {
							color: this.inverseColorBW(this.config.color_green),
							bgcolor: this.config.color_green,
							text: timer.label.replace(/\D/g, '') + ' ⏸',
						},
					},
					{
						feedbackId: 'timerState',
						options: {
							timer: timer.id,
							state: 'PAUSED'
						},
						style: {
							color: this.inverseColorBW(this.config.color_greendark),
							bgcolor: this.config.color_greendark,
							text: timer.label.replace(/\D/g, '') + ' ⏵',
						},
					},
					{
						feedbackId: 'timerState',
						options: {
							timer: timer.id,
							state: 'IDLE'
						},
						style: {
							color: this.inverseColorBW(this.config.color_greendark),
							bgcolor: this.config.color_greendark,
							text: timer.label.replace(/\D/g, '') + ' ⏵',
						},
					},
					{
						feedbackId: 'timerState',
						options: {
							timer: timer.id,
							state: 'ELAPSED'
						},
						style: {
							bgcolor: this.config.color_red,
							color: this.config.color_redgrey,
							text: timer.label.replace(/\D/g, '') + ' ⏵',
						},
					},
				],
			}

			presets['Stop ' + timer.label] = {
				type: 'button',
				name: 'Stop ' + timer.label,
				category: 'Timer',
				style: {
					text: timer.label.replace(/\D/g, '') + ' ⏹',
					size: '30',
					color: this.config.color_bright,
					bgcolor: this.config.color_dark,
				},
				steps: [
					{
						down: [
							{
								actionId: 'deviceTimerTransport',
								options: {
									timer: timer.id,
									cmd: 'stop',
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'timerState',
						options: {
							timer: timer.id,
							state: 'RUNNING'
						},
						style: {
							color: this.config.color_bright,
							bgcolor: this.config.color_green,
						},
					},
					{
						feedbackId: 'timerState',
						options: {
							timer: timer.id,
							state: 'PAUSED'
						},
						style: {
							color: this.inverseColorBW(this.config.color_greendark),
							bgcolor: this.config.color_greendark,
						},
					},
					{
						feedbackId: 'timerState',
						options: {
							timer: timer.id,
							state: 'IDLE'
						},
						style: {
							color: this.config.color_greengrey,
							bgcolor: this.config.color_greendark,
						},
					},
					{
						feedbackId: 'timerState',
						options: {
							timer: timer.id,
							state: 'ELAPSED'
						},
						style: {
							color: this.config.color_bright,
							bgcolor: this.config.color_red,
						},
					},
				],
			}
		}

		return presets
	}

	// MARK: Stream
	get stream() {
		const presets: CompanionPresetDefinitions = {}

		if (this.state.platform === 'midra') presets['Start/Stop Streaming '] = {
			type: 'button',
			name: 'Start/Stop Streaming ',
				category: 'Streaming',
				style: {
					text: 'Start Stream',
					size: 'auto',
					color: this.config.color_bright,
					bgcolor: this.config.color_dark,
				},
				steps: [
					{
						down: [
							{
								actionId: 'deviceStreamControl',
								options: {
									stream: 'toggle',
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'deviceStreaming',
						options: {
							state: 'LIVE'
						},
						style: {
							bgcolor: this.config.color_green,
							text: 'Stop Stream',
						},
					},
				],
			}

		return presets
	}

}

