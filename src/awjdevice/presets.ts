import {AWJinstance} from '../index.js'
import {
	choicesBackgroundSources,
	choicesBackgroundSourcesPlusNone,
	choicesForegroundImagesSource,
	getAuxArray,
	getAuxMemoryArray,
	getLayerChoices,
	getLayerMemoryArray,
	getLayersAsArray,
	getLiveInputArray,
	getMasterMemoryArray,
	getMultiviewerArray,
	getMultiviewerMemoryArray,
	getScreenMemoryArray,
	getScreensArray,
	getScreensAuxArray,
	getSourceChoices,
	getTimerChoices,
	getWidgetChoices,
	getWidgetSourceChoices,
} from './choices.js'
import {
	combineRgb,
	CompanionButtonPresetDefinition,
	CompanionButtonStyleProps,
	CompanionPresetDefinitions,
	splitRgb
} from '@companion-module/base'

type Dropdown<t> = { id: t, label: string }

function inverseColorBW(color: number): number {
	return (0.2126 * splitRgb(color).r + 0.7152 * splitRgb(color).g + 0.0722* splitRgb(color).b) > 127
	? 0x000000
	: 0xffffff
}


export function getPresets(instance: AWJinstance): CompanionPresetDefinitions {
	const state = instance.device
	const ilabel = instance.label
	const config = instance.config
	const allscreens = state.getChosenScreenAuxes('all')
	//const presets: ({ style: { show_topbar?: boolean } } & CompanionPreset)[] = []
	const presets: CompanionPresetDefinitions = {}

	// MARK: Master Memories
	for (const memory of getMasterMemoryArray(state)) {
		// const label = state.get(['DEVICE', 'device', 'presetBank', 'bankList', 'items', memory, 'control', 'pp', 'label'])
		const bgcolor = parseInt(state.get(['REMOTE', 'banks', 'master', 'items', memory.id, 'color'])?.slice(1), 16)

		presets[`Load Master Memory ${memory.id}`] = {
		type: 'button',
			name: `Load Master Memory ${memory.id}`,
			category: 'Master Memories',
			style: {
				text: `MM${memory.id}\\n$(${ilabel}:masterMemory${memory.id}label)`,
				size: 'auto',
				color: inverseColorBW(bgcolor),
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
						color: inverseColorBW(config.color_green),
						bgcolor: config.color_green,
					},
				},
				{
					feedbackId: 'deviceMasterMemory',
					options: {
						memory: memory.id,
						preset: 'pgm',
					},
					style: {
						color: inverseColorBW(config.color_red),
						bgcolor: config.color_red,
					},
				},
			],
		}
	}
	// MARK: Screen Memories
	for (const screen of
		state.platform.startsWith('livepremier')
			? [{ id: 'sel', label: 'Selected', index: '0' }, ...getScreensArray(state), ...getAuxArray(state)]
			: [{ id: 'sel', label: 'Selected', index: '0' }, ...getScreensArray(state)]
	) {
		for (const memory of getScreenMemoryArray(state)) {
			// const label = state.get(['DEVICE', 'device', 'presetBank', 'bankList', 'items', memory, 'control', 'pp', 'label'])
			const bgcolor = parseInt(state.get(['REMOTE', 'banks', 'screen', 'items', memory.id, 'color'])?.slice(1), 16)

			presets[`LoadScreenMemory_${memory.id}_to_${screen.id}`] = {
				type: 'button',
				name: `Load Screen Memory ${memory.id} into screen ${screen.id}${screen.label ? ' ('+screen.label+')' : ''}`,
				category: `Screen Memories into ${screen.id != 'sel' ? screen.id : 'Selection'}`,
				style: {
					text: `SM${memory.id}${screen.id != 'sel' ? ' '+screen.id : ''}\\n$(${ilabel}:screenMemory${memory.id}label)`,
					size: 'auto',
					color: inverseColorBW(bgcolor),
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
							color: inverseColorBW(config.color_green),
							bgcolor: config.color_green,
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
							color: inverseColorBW(config.color_red),
							bgcolor: config.color_red,
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
							color: inverseColorBW(config.color_greendark),
							bgcolor: config.color_greendark,
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
							color: inverseColorBW(config.color_reddark),
							bgcolor: config.color_reddark,
						},
					},
				],
			}
		}
	}

	// MARK: Aux Memories
	if (state.platform === 'midra') {
		for (const screen of [{ id: 'sel', label: 'Selected', index: '0' }, ...getAuxArray(state)]) {
			for (const memory of getAuxMemoryArray(state)) {
				// const label = state.get(['DEVICE', 'device', 'presetBank', 'bankList', 'items', memory, 'control', 'pp', 'label'])
				const bgcolor = parseInt(state.get(['REMOTE', 'banks', 'screen', 'items', memory.id, 'color'])?.slice(1), 16)

				presets[`LoadAuxMemory_${memory.id}_${screen.id}`] = {
					type: 'button',
					name: `Load Aux Memory ${memory.id} into auxscreen ${screen.id}${screen.label ? ' ('+screen.label+')' : ''}`,
					category: `Aux Memories into ${screen.id != 'sel' ? screen.id : 'Selection'}`,
					style: {
						text: `AM${memory.id}${screen.id != 'sel' ? ' '+screen.id : ''}\\n$(${ilabel}:auxMemory${memory.id}label)`,
						size: 'auto',
						color: inverseColorBW(bgcolor),
						bgcolor,
					},
					steps: [
						{
							down: [
								{
									actionId: 'deviceAuxMemory',
									options: {
										screens: ['sel'],
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
							feedbackId: 'deviceAuxMemory',
							options: {
								screens: screen.id != 'sel' ? [screen.id] : ['all'],
								preset: 'pvw',
								memory: memory.id,
								unmodified: 0,
							},
							style: {
								color: inverseColorBW(config.color_green),
								bgcolor: config.color_green,
							},
						},
						{
							feedbackId: 'deviceAuxMemory',
							options: {
								screens: screen.id != 'sel' ? [screen.id] : ['all'],
								preset: 'pgm',
								memory: memory.id,
								unmodified: 0,
							},
							style: {
								color: inverseColorBW(config.color_red),
								bgcolor: config.color_red,
							},
						},
						{
							feedbackId: 'deviceAuxMemory',
							options: {
								screens: screen.id != 'sel' ? [screen.id] : ['all'],
								preset: 'pvw',
								memory: memory.id,
								unmodified: 1,
							},
							style: {
								color: inverseColorBW(config.color_greendark),
								bgcolor: config.color_greendark,
							},
						},
						{
							feedbackId: 'deviceAuxMemory',
							options: {
								screens: screen.id != 'sel' ? [screen.id] : ['all'],
								preset: 'pgm',
								memory: memory.id,
								unmodified: 1,
							},
							style: {
								color: inverseColorBW(config.color_reddark),
								bgcolor: config.color_reddark,
							},
						},
					],
				}
			}
		}
	}

	// MARK: Layer Memories
	for (const memory of getLayerMemoryArray(state)) {
		// const label = state.get(['DEVICE', 'device', 'layerBank', 'bankList', 'items', memory, 'control', 'pp', 'label'])
		const bgcolor = parseInt(state.get(['REMOTE', 'banks', 'layer', 'items', memory, 'color'])?.slice(1), 16)

		presets[`Load Layer Memory${memory}`] = {
		type: 'button',
			name: `Load Layer Memory${memory}`,
			category: 'Layer Memories',
			style: {
				text: `LM${memory}\\n$(${ilabel}:layerMemory${memory}label)`,
				size: 'auto',
				color: inverseColorBW(bgcolor),
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
						memory,
					},
				},
			],
			up: [],
},
],
			feedbacks: [],
		}
	}

	// MARK: Take All Screens
	presets['Take All Screens'] = {
		type: 'button',
		name: 'Take All Screens',
		category: 'Transition',
		style: {
			text: 'Take\\nAll',
			size: 'auto',
			color: config.color_bright,
			bgcolor: config.color_reddark,
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
					color: inverseColorBW(config.color_red),
					bgcolor: config.color_red,
				},
			},
		],
	}

	// MARK: Take Selected Screens
	presets['Take Selected Screens'] = {
		type: 'button',
		name: 'Take Selected Screens',
		category: 'Transition',
		style: {
			text: 'Take\\nSel',
			size: 'auto',
			color: config.color_bright,
			bgcolor: config.color_reddark,
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
					color: inverseColorBW(config.color_red),
					bgcolor: config.color_red,
				},
			},
		],
	}

	// MARK: Take Screen ...
	for (const screen of allscreens) {
		presets['Take Screen ' + screen] = {
		type: 'button',
			name: 'Take Screen ' + screen,
			category: 'Transition',
			style: {
				text: 'Take\\n' + screen,
				size: 'auto',
				color: config.color_bright,
				bgcolor: config.color_reddark,
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
						color: inverseColorBW(config.color_red),
						bgcolor: config.color_red,
					},
				},
			],
		}
	}

	// MARK: Cut All Screens
	presets['Cut All Screens'] = {
		type: 'button',
		name: 'Cut All Screens',
		category: 'Transition',
		style: {
			text: 'Cut\\nAll',
			size: 'auto',
			color: config.color_bright,
			bgcolor: config.color_reddark,
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

	// MARK: Cut Selected Screens
	presets['Cut Selected Screens'] = {
		type: 'button',
		name: 'Cut Selected Screens',
		category: 'Transition',
		style: {
			text: 'Cut\\nSel',
			size: 'auto',
			color: config.color_bright,
			bgcolor: config.color_reddark,
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

	// MARK: Cut Screen ...
	for (const screen of allscreens) {
		presets['Cut Screen ' + screen] = {
		type: 'button',
			name: 'Cut Screen ' + screen,
			category: 'Transition',
			style: {
				text: 'Cut\\n' + screen,
				size: 'auto',
				color: config.color_bright,
				bgcolor: config.color_reddark,
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

	// MARK: Toggle Sync
	presets['Toggle Sync'] = {
		type: 'button',
		name: 'Toggle Sync',
		category: 'Live',
		style: {
			text: `$(${ilabel}:connectionLabel)\\n🔗\\nLocal`,
			size: '18',
			color: config.color_bright,
			bgcolor: config.color_dark,
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
					color: inverseColorBW(config.color_highlight),
					bgcolor: config.color_highlight,
				},
			},
		],
	}

	// MARK: Select Preset
	presets['Toggle Preset'] = {
		type: 'button',
		name: 'Toggle Preset',
		category: 'Live',
		style: {
			text: '⬇︎\\nPVW',
			size: '24',
			color: config.color_dark,
			bgcolor: config.color_green,
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
					preset: 'PROGRAM',
				},
				style: {
					text: 'PGM\\n⬆︎',
					color: inverseColorBW(config.color_red),
					bgcolor: config.color_red,
				},
			},
		],
	}

	// MARK: Preset Toggle
	presets['Preset Toggle'] = {
		type: 'button',
		name: 'Preset Toggle',
		category: 'Live',
		style: {
			text: 'Preset\\nToggle\\noff',
			size: '14',
			color: config.color_bright,
			bgcolor: config.color_dark,
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
					color: inverseColorBW(config.color_highlight),
					bgcolor: config.color_highlight,
				},
			},
		],
	}

	// MARK: Copy preview from program
	presets['Copy program of selected screens to preview'] = {
		type: 'button',
		name: 'Copy program of selected screens to preview',
		category: 'Live',
		style: {
			text: 'Copy\\nPgm➔Pvw\\nSelected',
			size: '14',
			color: config.color_bright,
			bgcolor: config.color_dark,
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

	// MARK: Toggle Screen X Selection
	for (const screen of allscreens) {
		presets['Do intelligent selection for screen ' + screen] = {
			type: 'button',
			name: 'Do intelligent selection for screen ' + screen,
			category: 'Screens',
			style: {
				text: 'Select ' + screen,
				size: 'auto',
				color: config.color_bright,
				bgcolor: config.color_dark,
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
						color: inverseColorBW(config.color_highlight),
						bgcolor: config.color_highlight,
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
				color: config.color_bright,
				bgcolor: config.color_reddark,
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
						color: inverseColorBW(config.color_highlight),
						bgcolor: config.color_highlight,
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
				color: config.color_bright,
				bgcolor: config.color_greendark,
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
						color: inverseColorBW(config.color_highlight),
						bgcolor: config.color_highlight,
					},
				},
			],
		}
	}

	// MARK: Toggle Lock PGM All Screens
	presets['Toggle Lock PGM All Screens'] = {
		type: 'button',
		name: 'Toggle Lock PGM All Screens',
		category: 'Lock Screens',
		style: {
			text: 'PGM',
			size: '24',
			color: config.color_dark,
			bgcolor: config.color_reddark,
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
					color: inverseColorBW(config.color_redgrey),
					bgcolor: config.color_redgrey,
					png64:
						'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3CAYAAACo29JGAAABSklEQVRoge2a2w7DIAhAZdl3N60/zp5MjBNLBdwknKe19cIZLdVlKTkGrCc4jgOpazln0/lNBh8JUViIqg44I9WiKaky0J0UwHgaxO/uAADXdYnieol6J7lYacNp9xSxHMVMwHV77KXzaQySzlTWmiB5gRB9JM+geuZKkIjIFivt2zHEscx27GWtFmvOd+fp3Xq9MWazp565JgNAiZXr2vPXqMm1cXIDb9uVL0fD26xa/gMhtyshtyshtyshtyshtyuu5YarU40ffKwZbYdcZ+7NbWi89WKBiAkA2Dt815kLuV1hP3NSzvOE6vOSKrwkc7VY79gKczlKZIWgqdydgLWg64IScrPcVUXrqrmioHQFVrwOVr0KcHRsRbzndiXkJLhdofyakJsl1paGuJYz3YmvWolQuM6cazn2banwPzMVnsThOnOu5VzzARnBeIM8tq0ZAAAAAElFTkSuQmCC',
				},
			},
		],
	}

	// MARK: Toggle Lock PGM Screen ...
	for (const screen of allscreens) {
		presets['Toggle Lock PGM Screen ' + screen] = {
		type: 'button',
			name: 'Toggle Lock PGM Screen ' + screen,
			category: 'Lock Screens',
			style: {
				text: screen + '\\nPGM',
				size: '18',
				color: config.color_dark,
				bgcolor: config.color_reddark,
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
						color: inverseColorBW(config.color_redgrey),
						bgcolor: config.color_redgrey,
						png64:
							'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3CAYAAACo29JGAAABSklEQVRoge2a2w7DIAhAZdl3N60/zp5MjBNLBdwknKe19cIZLdVlKTkGrCc4jgOpazln0/lNBh8JUViIqg44I9WiKaky0J0UwHgaxO/uAADXdYnieol6J7lYacNp9xSxHMVMwHV77KXzaQySzlTWmiB5gRB9JM+geuZKkIjIFivt2zHEscx27GWtFmvOd+fp3Xq9MWazp565JgNAiZXr2vPXqMm1cXIDb9uVL0fD26xa/gMhtyshtyshtyshtyshtyuu5YarU40ffKwZbYdcZ+7NbWi89WKBiAkA2Dt815kLuV1hP3NSzvOE6vOSKrwkc7VY79gKczlKZIWgqdydgLWg64IScrPcVUXrqrmioHQFVrwOVr0KcHRsRbzndiXkJLhdofyakJsl1paGuJYz3YmvWolQuM6cazn2banwPzMVnsThOnOu5VzzARnBeIM8tq0ZAAAAAElFTkSuQmCC',
					},
				},
			],
		}
	}

	// MARK: Toggle Lock PVW All Screens
	presets['Toggle Lock PVW All Screens'] = {
		type: 'button',
		name: 'Toggle Lock PVW All Screens',
		category: 'Lock Screens',
		style: {
			text: 'PVW',
			size: '24',
			color: config.color_dark,
			bgcolor: config.color_greendark,
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
					color: inverseColorBW(config.color_greengrey),
					bgcolor: config.color_greengrey,
					png64:
						'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3CAYAAACo29JGAAABSklEQVRoge2a2w7DIAhAZdl3N60/zp5MjBNLBdwknKe19cIZLdVlKTkGrCc4jgOpazln0/lNBh8JUViIqg44I9WiKaky0J0UwHgaxO/uAADXdYnieol6J7lYacNp9xSxHMVMwHV77KXzaQySzlTWmiB5gRB9JM+geuZKkIjIFivt2zHEscx27GWtFmvOd+fp3Xq9MWazp565JgNAiZXr2vPXqMm1cXIDb9uVL0fD26xa/gMhtyshtyshtyshtyshtyuu5YarU40ffKwZbYdcZ+7NbWi89WKBiAkA2Dt815kLuV1hP3NSzvOE6vOSKrwkc7VY79gKczlKZIWgqdydgLWg64IScrPcVUXrqrmioHQFVrwOVr0KcHRsRbzndiXkJLhdofyakJsl1paGuJYz3YmvWolQuM6cazn2banwPzMVnsThOnOu5VzzARnBeIM8tq0ZAAAAAElFTkSuQmCC',
				},
			},
		],
	}

	// MARK: Toggle Lock PVW Screen ...
	for (const screen of allscreens) {
		presets['Toggle Lock PVW Screen ' + screen] = {
		type: 'button',
			name: 'Toggle Lock PVW Screen ' + screen,
			category: 'Lock Screens',
			style: {
				text: screen + '\\nPVW',
				size: '18',
				color: config.color_dark,
				bgcolor: config.color_greendark,
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
						color: inverseColorBW(config.color_greengrey),
						bgcolor: config.color_greengrey,
						png64:
							'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3CAYAAACo29JGAAABSklEQVRoge2a2w7DIAhAZdl3N60/zp5MjBNLBdwknKe19cIZLdVlKTkGrCc4jgOpazln0/lNBh8JUViIqg44I9WiKaky0J0UwHgaxO/uAADXdYnieol6J7lYacNp9xSxHMVMwHV77KXzaQySzlTWmiB5gRB9JM+geuZKkIjIFivt2zHEscx27GWtFmvOd+fp3Xq9MWazp565JgNAiZXr2vPXqMm1cXIDb9uVL0fD26xa/gMhtyshtyshtyshtyshtyuu5YarU40ffKwZbYdcZ+7NbWi89WKBiAkA2Dt815kLuV1hP3NSzvOE6vOSKrwkc7VY79gKczlKZIWgqdydgLWg64IScrPcVUXrqrmioHQFVrwOVr0KcHRsRbzndiXkJLhdofyakJsl1paGuJYz3YmvWolQuM6cazn2banwPzMVnsThOnOu5VzzARnBeIM8tq0ZAAAAAElFTkSuQmCC',
					},
				},
			],
		}
	}

	// MARK: Select Layer
	for (const screen of getScreensAuxArray(state)) {
		for (const layer of getLayerChoices(state, screen.id)) {
			presets['Select Layer' + layer.label + ' of ' + screen.id] = {
		type: 'button',
				name: 'Select Layer' + layer.label + ' of ' + screen.id,
				category: 'Select Layers',
				style: {
					text: 'Select ' + screen.id + ' ' + layer.label.replace('Layer ', 'L'),
					size: '14',
					color: config.color_bright,
					bgcolor: config.color_dark,
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
							color: inverseColorBW(config.color_highlight),
							bgcolor: config.color_highlight,
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
					color: config.color_bright,
					bgcolor: config.color_dark,
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
							color: inverseColorBW(config.color_highlight),
							bgcolor: config.color_highlight,
						},
					},
				],
			}
		}
	}

	// MARK: Choose Input ...
	function makeInputSelectionPreset(input: Dropdown<string>, layertypes: string[], layerdescription: string) {
		let sourceLabelVariable = ''
		// sourceLayer, sourceNative, sourceBack, sourceFront
		if (input.id.match(/^IN|LIVE|STILL|SCREEN/)) {
			sourceLabelVariable = `\\n$(${ilabel}:${input.id.replace('LIVE_', 'INPUT_')}label)`
		}
		const preparedPreset: CompanionButtonPresetDefinition = {
			type: 'button',
			name: 'Choose Input ' + input.label + ' for selected '+ layerdescription +' Layer(s)',
			category: 'Layer Source',
			style: {
				text: input.label.replace(/^(\D+\d+)\s.+$/, '$1') + sourceLabelVariable,
				size: 'auto',
				color: config.color_bright,
				bgcolor: config.color_dark,
			},
			steps: [
				{
					down: [
						{
							actionId: 'deviceSelectSource',
							options: {
								method: 'sel',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'deviceSourceTally',
					options: {
						screens: ['all'],
						preset: 'pvw',
						source: input.id,
					},
					style: {
						color: inverseColorBW(config.color_green),
						bgcolor: config.color_green,
					},
				},
				{
					feedbackId: 'deviceSourceTally',
					options: {
						screens: ['all'],
						preset: 'pgm',
						source: input.id,
					},
					style: {
						color: inverseColorBW(config.color_red),
						bgcolor: config.color_red,
					},
				},
			],
		}
		Array.of('sourceLayer', 'sourceNative', 'sourceBack', 'sourceFront').forEach(layer => {
			preparedPreset.steps[0].down[0].options[layer] = 'keep'	
		})
		layertypes.forEach(layertype => {	
			preparedPreset.steps[0].down[0].options[layertype] = input.id
		})
		//if (state.platform === 'midra' && layertype === 'sourceLayer' && input.id !== 'COLOR') preparedPreset.actions[0].options['sourceBack'] = input.id
		presets[preparedPreset.name] = preparedPreset
	}
	
	makeInputSelectionPreset({ id: 'NONE', label: 'None' }, ['sourceLayer', 'sourceNative', 'sourceFront', 'sourceBack'], '')

	if (state.platform === 'midra') {
		makeInputSelectionPreset({ id: 'COLOR', label: 'Color' }, ['sourceLayer'], 'Live')
		getSourceChoices(state).filter(choice => choice.id !== 'NONE' && choice.id !== 'COLOR').forEach((choice: Dropdown<string>) => {
			makeInputSelectionPreset(choice, ['sourceLayer', 'sourceBack'], 'Live/Background')
		})
		choicesBackgroundSourcesPlusNone.filter(choice => choice.id !== 'NONE').forEach((choice: Dropdown<string>) => {
			makeInputSelectionPreset(choice, ['sourceNative'], 'Background')
		})
		choicesForegroundImagesSource.filter(choice => choice.id !== 'NONE').forEach((choice: Dropdown<string>) => {
			makeInputSelectionPreset(choice, ['sourceFront'], 'Foreground')
		})
	}
	if (state.platform.startsWith('livepremier')) {
		getSourceChoices(state).filter(choice => choice.id !== 'NONE' && choice.id !== 'COLOR').forEach((choice: Dropdown<string>) => {
			makeInputSelectionPreset(choice, ['sourceLayer', 'sourceBack'], '')
		})
		choicesBackgroundSources.forEach((choice: Dropdown<string>) => {
			makeInputSelectionPreset(choice, ['sourceNative'], 'Background')
		})
	}

	// MARK: Toggle Freeze Input ...
	for (const input of getLiveInputArray(state)) {
		presets['Toggle Freeze ' + input.id] = {
		type: 'button',
			name: 'Toggle Freeze ' + input.label,
			category: 'Input Freeze',
			style: {
				text: 'Freeze\\nIn ' + input.index,
				size: 'auto',
				color: config.color_bright,
				bgcolor: config.color_dark,
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

	// MARK: Toggle Freeze Layer ...
	if (state.platform === 'midra') {
		const screens = getScreensArray(state)
		for (const screen of screens) {
			for (const layer of ['NATIVE', ...getLayersAsArray(state, screen.id, false)]) {
				const shortname = layer === 'NATIVE' ? 'BKG' : `L${layer}`
				presets[`toggleFreeze${screen.id}${shortname}`] = {
				type: 'button',
					name: `Toggle Freeze ${screen.id} ${shortname}`,
					category: 'Layer Freeze',
					style: {
						text: `Freeze\\n${screen.id} ${shortname}`,
						size: 'auto',
						color: config.color_bright,
						bgcolor: config.color_dark,
					},
					steps: [
						{
						down: [
										{
											actionId: 'deviceLayerFreeze',
											options: {
												screen: [screen.id],
												...Object.fromEntries( 
													screens.map(scr => [`layer${scr.id}`, scr.id === screen.id ? [layer] : ['1']])
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
									screens.map(scr => [`layer${scr.id}`, scr.id === screen.id ? layer : '1'])
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
	}

	// MARK: Toggle Freeze Screen ...
	if (state.platform === 'midra') {
		const screens = getScreensAuxArray(state)
		for (const screen of screens) {
			presets[`toggleFreeze${screen.id}`] = {
			type: 'button',
				name: `Toggle Freeze ${screen.id}`,
				category: 'Screen Freeze',
				style: {
					text: `Freeze\\n${screen.id}`,
					size: 'auto',
					color: config.color_bright,
					bgcolor: config.color_dark,
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
	}

	// MARK: Multiviewer Memories
	const multiviewers = getMultiviewerArray(state)
	const multimulti: boolean = multiviewers.length > 1
	for (const multiviewer of getMultiviewerArray(state)) {
		for (const memory of getMultiviewerMemoryArray(state)) {
			const bgcolor = parseInt(state.get(['REMOTE', 'banks', 'monitoring', 'items', memory.id, 'color'])?.slice(1), 16)

			presets['Load VM' + memory.id + multimulti ? ' on Multiviewer ' + multiviewer : ''] = {
		type: 'button',
				name: 'Load VM' + memory.id + multimulti ? ' on Multiviewer ' + multiviewer : '',
				category: 'Multiviewer Memories',
				style: {
					text: (multimulti ? `MV${multiviewer} `: '') +  `VM${memory.id}\\n$(${ilabel}:multiviewerMemory${memory.id}label)`,
					size: 'auto',
					color: inverseColorBW(bgcolor),
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

	// MARK: Select Widget
	for (const widget of getWidgetChoices(state)) {
		presets['Select ' + widget.label] = {
		type: 'button',
			name: 'Select ' + widget.label,
			category: 'Select Widgets',
			style: {
				text: 'Select ' + widget.label.replace(/Multiviewer /, 'MV').replace(/Widget /, 'W'),
				size: '14',
				color: config.color_bright,
				bgcolor: config.color_dark,
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
						color: inverseColorBW(config.color_highlight),
						bgcolor: config.color_highlight,
					},
				},
			],
		}
	}

	// MARK: Toggle Widget Selection
	for (const widget of getWidgetChoices(state)) {
		presets['Toggle Selection of ' + widget.label] = {
		type: 'button',
			name: 'Toggle Selection of ' + widget.label,
			category: 'Select Widgets',
			style: {
				text: 'Toggle ' + widget.label.replace(/Multiviewer /, 'MV').replace(/Widget /, 'W'),
				size: '14',
				color: config.color_bright,
				bgcolor: config.color_dark,
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
						bgcolor: config.color_highlight,
					},
				},
			],
		}
	}

	// MARK: Select Widget Source
	for (const source of getWidgetSourceChoices(state)) {
		presets['Select Widget Source' + source.label] = {
		type: 'button',
			name: 'Select Widget Source' + source.label,
			category: 'Multiviewer Source',
			style: {
				text: 'MV ' + source.label.replace(/ - /, '\\n'),
				size: 'auto',
				color: config.color_bright,
				bgcolor: config.color_dark,
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

	// MARK: Timers
	for (const timer of getTimerChoices(state)) {
		presets['Play/Pause ' + timer.label] = {
		type: 'button',
			name: 'Play/Pause ' + timer.label,
			category: 'Timer',
			style: {
				text: timer.label.replace(/\D/g, '') + '⏯',
				size: '44',
				color: config.color_bright,
				bgcolor: config.color_dark,
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
						color: inverseColorBW(config.color_green),
						bgcolor: config.color_green,
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
						color: inverseColorBW(config.color_greendark),
						bgcolor: config.color_greendark,
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
						color: inverseColorBW(config.color_greendark),
						bgcolor: config.color_greendark,
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
						bgcolor: config.color_red,
						color: config.color_redgrey,
						text: timer.label.replace(/\D/g, '') + ' ⏵',
					},
				},
			],
		},
		{
			label: 'Stop ' + timer.label,
			category: 'Timer',
			style: {
				text: timer.label.replace(/\D/g, '') + ' ⏹',
				size: '44',
				color: config.color_bright,
				bgcolor: config.color_dark,
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
						color: config.color_bright,
						bgcolor: config.color_green,
					},
				},
				{
					feedbackId: 'timerState',
					options: {
						timer: timer.id,
						state: 'PAUSED'
					},
					style: {
						color: inverseColorBW(config.color_greendark),
						bgcolor: config.color_greendark,
					},
				},
				{
					feedbackId: 'timerState',
					options: {
						timer: timer.id,
						state: 'IDLE'
					},
					style: {
						color: config.color_greengrey,
						bgcolor: config.color_greendark,
					},
				},
				{
					feedbackId: 'timerState',
					options: {
						timer: timer.id,
						state: 'ELAPSED'
					},
					style: {
						color: config.color_bright,
						bgcolor: config.color_red,
					},
				},
			],
		}
	}

	// MARK: Stream
	if (state.platform === 'midra') presets['Start/Stop Streaming '] = {
		type: 'button',
		name: 'Start/Stop Streaming ',
			category: 'Streaming',
			style: {
				text: 'Start Stream',
				size: 'auto',
				color: config.color_bright,
				bgcolor: config.color_dark,
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
						bgcolor: config.color_green,
						text: 'Stop Stream',
					},
				},
			],
		}

	return presets
}
