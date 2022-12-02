import AWJinstance from './index'
import { CompanionPreset } from '../../../instance_skel_types'
import {
	choicesBackgroundSources,
	choicesBackgroundSourcesPlusNone,
	choicesForegroundImagesSource,
	getAuxMemoryArray,
	getLayerChoices,
	getLayerMemoryArray,
	getLiveInputArray,
	getMasterMemoryArray,
	getMultiviewerArray,
	getMultiviewerMemoryArray,
	getScreenMemoryArray,
	getScreensAuxArray,
	getSourceChoices,
	getTimerChoices,
	getWidgetChoices,
	getWidgetSourceChoices,
} from './choices'

type Dropdown<t> = {id: t, label: string}

export function getPresets(instance: AWJinstance): CompanionPreset[] {
	const state = instance.state
	const ilabel = instance.label
	const config = instance.config
	const allscreens = state.getChosenScreenAuxes('all')
	const presets: ({ bank: { show_topbar?: boolean } } & CompanionPreset)[] = []

	// MARK: Master Memories
	for (const memory of getMasterMemoryArray(state)) {
		// const label = state.get(['DEVICE', 'device', 'presetBank', 'bankList', 'items', memory, 'control', 'pp', 'label'])
		const bgcolor = parseInt(state.get(['REMOTE', 'banks', 'master', 'items', memory.id, 'color'])?.slice(1), 16)
		const color =
			(instance.rgbRev(bgcolor).r + instance.rgbRev(bgcolor).g + instance.rgbRev(bgcolor).b) / 3 > 127
				? config.color_dark
				: config.color_bright

		presets.push({
			label: `Load Master Memory ${memory.id}`,
			category: 'Master Memories',
			bank: {
				text: `MM${memory.id}\\n$(${ilabel}:masterMemory${memory.id}label)`,
				style: 'text',
				size: 'auto',
				color,
				bgcolor,
			},
			actions: [
				{
					action: 'deviceMasterMemory',
					options: {
						memory: memory.id,
						selectScreens: true,
					},
				},
			],
			release_actions: [],
			feedbacks: [
				{
					type: 'deviceMasterMemory',
					options: {
						memory: memory.id,
						preset: 'pvw',
					},
					style: {
						bgcolor: config.color_green,
					},
				},
				{
					type: 'deviceMasterMemory',
					options: {
						memory: memory.id,
						preset: 'pgm',
					},
					style: {
						bgcolor: config.color_red,
					},
				},
			],
		})
	}
	// MARK: Screen Memories
	for (const memory of getScreenMemoryArray(state)) {
		// const label = state.get(['DEVICE', 'device', 'presetBank', 'bankList', 'items', memory, 'control', 'pp', 'label'])
		const bgcolor = parseInt(state.get(['REMOTE', 'banks', 'screen', 'items', memory.id, 'color'])?.slice(1), 16)
		const color =
			(instance.rgbRev(bgcolor).r + instance.rgbRev(bgcolor).g + instance.rgbRev(bgcolor).b) / 3 > 127
				? config.color_dark
				: config.color_bright

		presets.push({
			label: `Load Screen Memory ${memory.id}`,
			category: 'Screen Memories',
			bank: {
				text: `SM${memory.id}\\n$(${ilabel}:screenMemory${memory.id}label)`,
				style: 'text',
				size: 'auto',
				color,
				bgcolor,
			},
			actions: [
				{
					action: 'deviceScreenMemory',
					options: {
						screen: ['sel'],
						preset: 'sel',
						memory: memory.id,
						selectScreens: false,
					},
				},
			],
			release_actions: [],
			feedbacks: [
				{
					type: 'deviceScreenMemory',
					options: {
						screens: ['all'],
						preset: 'pvw',
						memory: memory.id,
						unmodified: 0,
					},
					style: {
						bgcolor: config.color_greendark,
					},
				},
				{
					type: 'deviceScreenMemory',
					options: {
						screens: ['all'],
						preset: 'pgm',
						memory: memory.id,
						unmodified: 0,
					},
					style: {
						bgcolor: config.color_reddark,
					},
				},
				{
					type: 'deviceScreenMemory',
					options: {
						screens: ['all'],
						preset: 'pvw',
						memory: memory.id,
						unmodified: 1,
					},
					style: {
						bgcolor: config.color_green,
					},
				},
				{
					type: 'deviceScreenMemory',
					options: {
						screens: ['all'],
						preset: 'pgm',
						memory: memory.id,
						unmodified: 1,
					},
					style: {
						bgcolor: config.color_red,
					},
				},
			],
		})
	}

	// MARK: Aux Memories
	if (state.platform === 'midra') for (const memory of getAuxMemoryArray(state)) {
		// const label = state.get(['DEVICE', 'device', 'presetBank', 'bankList', 'items', memory, 'control', 'pp', 'label'])
		const bgcolor = parseInt(state.get(['REMOTE', 'banks', 'screen', 'items', memory.id, 'color'])?.slice(1), 16)
		const color =
			(instance.rgbRev(bgcolor).r + instance.rgbRev(bgcolor).g + instance.rgbRev(bgcolor).b) / 3 > 127
				? config.color_dark
				: config.color_bright

		presets.push({
			label: `Load Aux Memory ${memory.id}`,
			category: 'Aux Memories',
			bank: {
				text: `AM${memory.id}\\n$(${ilabel}:auxMemory${memory.id}label)`,
				style: 'text',
				size: 'auto',
				color,
				bgcolor,
			},
			actions: [
				{
					action: 'deviceAuxMemory',
					options: {
						screens: ['sel'],
						preset: 'sel',
						memory: memory.id,
						selectScreens: false,
					},
				},
			],
			release_actions: [],
			feedbacks: [
				{
					type: 'deviceAuxMemory',
					options: {
						screens: ['all'],
						preset: 'pvw',
						memory: memory.id,
						unmodified: 0,
					},
					style: {
						bgcolor: config.color_greendark,
					},
				},
				{
					type: 'deviceAuxMemory',
					options: {
						screens: ['all'],
						preset: 'pgm',
						memory: memory.id,
						unmodified: 0,
					},
					style: {
						bgcolor: config.color_reddark,
					},
				},
				{
					type: 'deviceAuxMemory',
					options: {
						screens: ['all'],
						preset: 'pvw',
						memory: memory.id,
						unmodified: 1,
					},
					style: {
						bgcolor: config.color_green,
					},
				},
				{
					type: 'deviceAuxMemory',
					options: {
						screens: ['all'],
						preset: 'pgm',
						memory: memory.id,
						unmodified: 1,
					},
					style: {
						bgcolor: config.color_red,
					},
				},
			],
		})
	}

	// MARK: Layer Memories
	for (const memory of getLayerMemoryArray(state)) {
		// const label = state.get(['DEVICE', 'device', 'layerBank', 'bankList', 'items', memory, 'control', 'pp', 'label'])
		const bgcolor = parseInt(state.get(['REMOTE', 'banks', 'layer', 'items', memory, 'color'])?.slice(1), 16)
		const color =
			(instance.rgbRev(bgcolor).r + instance.rgbRev(bgcolor).g + instance.rgbRev(bgcolor).b) / 3 > 127
				? config.color_dark
				: config.color_bright

		presets.push({
			label: `Load Layer Memory${memory}`,
			category: 'Layer Memories',
			bank: {
				text: `LM${memory}\\n$(${ilabel}:layerMemory${memory}label)`,
				style: 'text',
				size: 'auto',
				color,
				bgcolor,
			},
			actions: [
				{
					action: 'deviceLayerMemory',
					options: {
						method: 'sel',
						screen: 'S1',
						preset: 'pvw',
						layer: '1',
						memory,
					},
				},
			],
			release_actions: [],
			feedbacks: [],
		})
	}

	// MARK: Take All Screens
	presets.push({
		label: 'Take All Screens',
		category: 'Transition',
		bank: {
			text: 'Take\\nAll',
			style: 'text',
			size: 'auto',
			color: config.color_bright,
			bgcolor: config.color_reddark,
		},
		actions: [
			{
				action: 'deviceTakeScreen',
				options: {
					screens: ['all'],
				},
			},
		],
		release_actions: [],
		feedbacks: [
			{
				type: 'deviceTake',
				options: {
					screens: ['all'],
				},
				style: {
					bgcolor: config.color_red,
				},
			},
		],
	})

	// MARK: Take Selected Screens
	presets.push({
		label: 'Take Selected Screens',
		category: 'Transition',
		bank: {
			text: 'Take\\nSel',
			style: 'text',
			size: 'auto',
			color: config.color_bright,
			bgcolor: config.color_reddark,
		},
		actions: [
			{
				action: 'deviceTakeScreen',
				options: {
					screens: ['sel'],
				},
			},
		],
		release_actions: [],
		feedbacks: [
			{
				type: 'deviceTake',
				options: {
					screens: ['all'],
				},
				style: {
					bgcolor: config.color_red,
				},
			},
		],
	})

	// MARK: Take Screen ...
	for (const screen of allscreens) {
		presets.push({
			label: 'Take Screen ' + screen,
			category: 'Transition',
			bank: {
				text: 'Take\\n' + screen,
				style: 'text',
				size: 'auto',
				color: config.color_bright,
				bgcolor: config.color_reddark,
			},
			actions: [
				{
					action: 'deviceTakeScreen',
					options: {
						screens: [screen],
					},
				},
			],
			release_actions: [],
			feedbacks: [
				{
					type: 'deviceTake',
					options: {
						screens: [screen],
					},
					style: {
						bgcolor: config.color_red,
					},
				},
			],
		})
	}

	// MARK: Cut All Screens
	presets.push({
		label: 'Cut All Screens',
		category: 'Transition',
		bank: {
			text: 'Cut\\nAll',
			style: 'text',
			size: 'auto',
			color: config.color_bright,
			bgcolor: config.color_reddark,
		},
		actions: [
			{
				action: 'deviceCutScreen',
				options: {
					screens: ['all'],
				},
			},
		],
		release_actions: [],
		feedbacks: [],
	})

	// MARK: Cut Selected Screens
	presets.push({
		label: 'Cut Selected Screens',
		category: 'Transition',
		bank: {
			text: 'Cut\\nSel',
			style: 'text',
			size: 'auto',
			color: config.color_bright,
			bgcolor: config.color_reddark,
		},
		actions: [
			{
				action: 'deviceCutScreen',
				options: {
					screens: ['sel'],
				},
			},
		],
		release_actions: [],
		feedbacks: [],
	})

	// MARK: Cut Screen ...
	for (const screen of allscreens) {
		presets.push({
			label: 'Cut Screen ' + screen,
			category: 'Transition',
			bank: {
				text: 'Cut\\n' + screen,
				style: 'text',
				size: 'auto',
				color: config.color_bright,
				bgcolor: config.color_reddark,
			},
			actions: [
				{
					action: 'deviceCutScreen',
					options: {
						screens: [screen],
					},
				},
			],
			release_actions: [],
			feedbacks: [],
		})
	}

	// MARK: Toggle Sync
	presets.push({
		label: 'Toggle Sync',
		category: 'Live',
		bank: {
			text: ilabel + '\\n🔗\\nLocal',
			style: 'text',
			size: '18',
			color: config.color_bright,
			bgcolor: config.color_dark,
			show_topbar: false,
		},
		actions: [
			{
				action: 'remoteSync',
				options: {
					sync: 2,
				},
			},
		],
		release_actions: [],
		feedbacks: [
			{
				type: 'syncselection',
				options: {},
				style: {
					text: ilabel + '\\n🔗\\nSynced',
					bgcolor: config.color_highlight,
				},
			},
		],
	})

	// MARK: Toggle Preset
	presets.push({
		label: 'Toggle Preset',
		category: 'Live',
		bank: {
			text: '⬇︎\\nPVW',
			style: 'text',
			size: '24',
			color: config.color_dark,
			bgcolor: config.color_green,
		},
		actions: [
			{
				action: 'selectPreset',
				options: {
					mode: 'tgl',
				},
			},
		],
		release_actions: [],
		feedbacks: [
			{
				type: 'livePresetSelection',
				options: {
					preset: 'PROGRAM',
				},
				style: {
					text: 'PGM\\n⬆︎',
					bgcolor: config.color_red,
				},
			},
		],
	})

	// MARK: Copy preview from program
	presets.push({
		label: 'Copy program of selected screens to preview',
		category: 'Live',
		bank: {
			text: 'Copy\\nPgm➔Pvw\\nSelected',
			style: 'text',
			size: '14',
			color: config.color_bright,
			bgcolor: config.color_dark,
		},
		actions: [
			{
				action: 'deviceCopyProgram',
				options: {
					screens: ['sel'],
				},
			},
		],
		release_actions: [],
		feedbacks: [],
	})

	// MARK: Toggle Screen X Selection
	for (const screen of allscreens) {
		presets.push({
			label: 'Do intelligent selection for screen ' + screen,
			category: 'Screens',
			bank: {
				text: 'Select ' + screen,
				style: 'text',
				size: 'auto',
				color: config.color_bright,
				bgcolor: config.color_dark,
			},
			actions: [
				{
					action: 'selectScreen',
					options: {
						screen: screen,
						sel: 4,
					},
				},
			],
			release_actions: [
				{
					action: 'selectScreen',
					options: {
						screen: screen,
						sel: 5,
					},
				},
			],
			feedbacks: [
				{
					type: 'liveScreenSelection',
					options: {
						screen: screen,
					},
					style: {
						bgcolor: config.color_highlight,
					},
				},
			],
		})
		presets.push({
			label: 'Toggle Screen ' + screen + ' Selection and show some useful data of PGM',
			category: 'Screens',
			bank: {
				text: `${screen} PGM\\n$(${ilabel}:screen${screen}label)\\n$(${ilabel}:screen${screen}timePGM)\\n$(${ilabel}:screen${screen}memoryPGM)$(${ilabel}:screen${screen}memoryModifiedPGM)\\n$(${ilabel}:screen${screen}memoryLabelPGM)`,
				style: 'text',
				size: 'auto',
				color: config.color_bright,
				bgcolor: config.color_reddark,
			},
			actions: [
				{
					action: 'selectScreen',
					options: {
						screen: screen,
						sel: 2,
					},
				},
			],
			release_actions: [],
			feedbacks: [
				{
					type: 'liveScreenSelection',
					options: {
						screen: screen,
					},
					style: {
						bgcolor: config.color_highlight,
					},
				},
			],
		})
		presets.push({
			label: 'Copy PGM of ' + screen + ' to PVW and show some useful data of PVW',
			category: 'Screens',
			bank: {
				text: `${screen} PVW\\n$(${ilabel}:screen${screen}label)\\n$(${ilabel}:screen${screen}timePVW)\\n$(${ilabel}:screen${screen}memoryPVW)$(${ilabel}:screen${screen}memoryModifiedPVW)\\n$(${ilabel}:screen${screen}memoryLabelPVW)`,
				style: 'text',
				size: 'auto',
				color: config.color_bright,
				bgcolor: config.color_greendark,
			},
			actions: [
				{
					action: 'deviceCopyProgram',
					options: {
						screens: [screen],
					},
				},
			],
			release_actions: [],
			feedbacks: [
				{
					type: 'remoteLayerSelection',
					options: {
						screen: screen,
						layer: 'all',
						preset: 'all',
					},
					style: {
						bgcolor: config.color_highlight,
					},
				},
			],
		})
	}

	// MARK: Toggle Lock PGM All Screens
	presets.push({
		label: 'Toggle Lock PGM All Screens',
		category: 'Lock Screens',
		bank: {
			text: 'PGM',
			style: 'text',
			size: '24',
			color: config.color_dark,
			bgcolor: config.color_reddark,
			png64:
				'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3CAYAAACo29JGAAABt0lEQVRoge1ay5LEIAiErf1uR/lx9jJOGddXFEZj2UeNSNtExARgY6D2BMYYzvURker8KsZLhHLQICpqsIdUDEmSIoZqpGoOp8ZLkPwZNdCgVtVJIkKNsBwmVwDCjchgZj8GAGRC/HdkcMEBBAAgIjDGsDGmxZwfg96uMYZHFNVQDokIAIDvrP7r9fo8KxWi3cplHEevVtiYczZhgyEK5RH1xJULHa5tFNpJXJKcD0cAaHc8fs4vzhKpYGWIkQtVWwVHuadiKIlrABEvOe99cunCUsohymaGJZRzzn1YWWsvfSOEpysXh11Izlr7j+wdTCeXgnMOnHPDdqaTk37PQkwnN7Ib1jCdXEo5Zr6Q7l2A23cbq6F0wJ6unCaa81yh4PT9Q4602PGFa2tEDSdxqWpAo6rYOiy3Jve1s2X0nuA3ilt15Zg5ecv1bledW51cWJu1tEtClVzDlt16G92FrTeUQ24AtXrmMTfOOeQIqH+PVyUX5LKYCCaeEYe6cv5zVtTMQZ8apm0oW5xQZkKdXC6R3/ic3I2j3FNxzpZPxdbktCtx9SNWCUe5Xsz+CeBcpz8VW5PbGn/AbcB8DcHhggAAAABJRU5ErkJggg==',
		},
		actions: [
			{
				action: 'lockScreen',
				options: {
					screens: ['all'],
					preset: 'PROGRAM',
					lock: 'toggle',
				},
			},
		],
		release_actions: [],
		feedbacks: [
			{
				type: 'liveScreenLock',
				options: {
					screen: 'all',
					preset: 'PROGRAM',
				},
				style: {
					bgcolor: config.color_redgrey,
					png64:
						'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3CAYAAACo29JGAAABSklEQVRoge2a2w7DIAhAZdl3N60/zp5MjBNLBdwknKe19cIZLdVlKTkGrCc4jgOpazln0/lNBh8JUViIqg44I9WiKaky0J0UwHgaxO/uAADXdYnieol6J7lYacNp9xSxHMVMwHV77KXzaQySzlTWmiB5gRB9JM+geuZKkIjIFivt2zHEscx27GWtFmvOd+fp3Xq9MWazp565JgNAiZXr2vPXqMm1cXIDb9uVL0fD26xa/gMhtyshtyshtyshtyshtyuu5YarU40ffKwZbYdcZ+7NbWi89WKBiAkA2Dt815kLuV1hP3NSzvOE6vOSKrwkc7VY79gKczlKZIWgqdydgLWg64IScrPcVUXrqrmioHQFVrwOVr0KcHRsRbzndiXkJLhdofyakJsl1paGuJYz3YmvWolQuM6cazn2banwPzMVnsThOnOu5VzzARnBeIM8tq0ZAAAAAElFTkSuQmCC',
				},
			},
		],
	})

	// MARK: Toggle Lock PGM Screen ...
	for (const screen of allscreens) {
		presets.push({
			label: 'Toggle Lock PGM Screen ' + screen,
			category: 'Lock Screens',
			bank: {
				text: screen + '\\nPGM',
				style: 'text',
				size: '18',
				color: config.color_dark,
				bgcolor: config.color_reddark,
				png64:
					'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3CAYAAACo29JGAAABt0lEQVRoge1ay5LEIAiErf1uR/lx9jJOGddXFEZj2UeNSNtExARgY6D2BMYYzvURker8KsZLhHLQICpqsIdUDEmSIoZqpGoOp8ZLkPwZNdCgVtVJIkKNsBwmVwDCjchgZj8GAGRC/HdkcMEBBAAgIjDGsDGmxZwfg96uMYZHFNVQDokIAIDvrP7r9fo8KxWi3cplHEevVtiYczZhgyEK5RH1xJULHa5tFNpJXJKcD0cAaHc8fs4vzhKpYGWIkQtVWwVHuadiKIlrABEvOe99cunCUsohymaGJZRzzn1YWWsvfSOEpysXh11Izlr7j+wdTCeXgnMOnHPDdqaTk37PQkwnN7Ib1jCdXEo5Zr6Q7l2A23cbq6F0wJ6unCaa81yh4PT9Q4602PGFa2tEDSdxqWpAo6rYOiy3Jve1s2X0nuA3ilt15Zg5ecv1bledW51cWJu1tEtClVzDlt16G92FrTeUQ24AtXrmMTfOOeQIqH+PVyUX5LKYCCaeEYe6cv5zVtTMQZ8apm0oW5xQZkKdXC6R3/ic3I2j3FNxzpZPxdbktCtx9SNWCUe5Xsz+CeBcpz8VW5PbGn/AbcB8DcHhggAAAABJRU5ErkJggg==',
			},
			actions: [
				{
					action: 'lockScreen',
					options: {
						screens: [screen],
						preset: 'PROGRAM',
						lock: 'toggle',
					},
				},
			],
			release_actions: [],
			feedbacks: [
				{
					type: 'liveScreenLock',
					options: {
						screen: screen,
						preset: 'PROGRAM',
					},
					style: {
						bgcolor: config.color_redgrey,
						png64:
							'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3CAYAAACo29JGAAABSklEQVRoge2a2w7DIAhAZdl3N60/zp5MjBNLBdwknKe19cIZLdVlKTkGrCc4jgOpazln0/lNBh8JUViIqg44I9WiKaky0J0UwHgaxO/uAADXdYnieol6J7lYacNp9xSxHMVMwHV77KXzaQySzlTWmiB5gRB9JM+geuZKkIjIFivt2zHEscx27GWtFmvOd+fp3Xq9MWazp565JgNAiZXr2vPXqMm1cXIDb9uVL0fD26xa/gMhtyshtyshtyshtyshtyuu5YarU40ffKwZbYdcZ+7NbWi89WKBiAkA2Dt815kLuV1hP3NSzvOE6vOSKrwkc7VY79gKczlKZIWgqdydgLWg64IScrPcVUXrqrmioHQFVrwOVr0KcHRsRbzndiXkJLhdofyakJsl1paGuJYz3YmvWolQuM6cazn2banwPzMVnsThOnOu5VzzARnBeIM8tq0ZAAAAAElFTkSuQmCC',
					},
				},
			],
		})
	}

	// MARK: Toggle Lock PVW All Screens
	presets.push({
		label: 'Toggle Lock PVW All Screens',
		category: 'Lock Screens',
		bank: {
			text: 'PVW',
			style: 'text',
			size: '24',
			color: config.color_dark,
			bgcolor: config.color_greendark,
			png64:
				'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3CAYAAACo29JGAAABt0lEQVRoge1ay5LEIAiErf1uR/lx9jJOGddXFEZj2UeNSNtExARgY6D2BMYYzvURker8KsZLhHLQICpqsIdUDEmSIoZqpGoOp8ZLkPwZNdCgVtVJIkKNsBwmVwDCjchgZj8GAGRC/HdkcMEBBAAgIjDGsDGmxZwfg96uMYZHFNVQDokIAIDvrP7r9fo8KxWi3cplHEevVtiYczZhgyEK5RH1xJULHa5tFNpJXJKcD0cAaHc8fs4vzhKpYGWIkQtVWwVHuadiKIlrABEvOe99cunCUsohymaGJZRzzn1YWWsvfSOEpysXh11Izlr7j+wdTCeXgnMOnHPDdqaTk37PQkwnN7Ib1jCdXEo5Zr6Q7l2A23cbq6F0wJ6unCaa81yh4PT9Q4602PGFa2tEDSdxqWpAo6rYOiy3Jve1s2X0nuA3ilt15Zg5ecv1bledW51cWJu1tEtClVzDlt16G92FrTeUQ24AtXrmMTfOOeQIqH+PVyUX5LKYCCaeEYe6cv5zVtTMQZ8apm0oW5xQZkKdXC6R3/ic3I2j3FNxzpZPxdbktCtx9SNWCUe5Xsz+CeBcpz8VW5PbGn/AbcB8DcHhggAAAABJRU5ErkJggg==',
		},
		actions: [
			{
				action: 'lockScreen',
				options: {
					screens: ['all'],
					preset: 'PREVIEW',
					lock: 'toggle',
				},
			},
		],
		release_actions: [],
		feedbacks: [
			{
				type: 'liveScreenLock',
				options: {
					screen: 'all',
					preset: 'PREVIEW',
				},
				style: {
					bgcolor: config.color_greengrey,
					png64:
						'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3CAYAAACo29JGAAABSklEQVRoge2a2w7DIAhAZdl3N60/zp5MjBNLBdwknKe19cIZLdVlKTkGrCc4jgOpazln0/lNBh8JUViIqg44I9WiKaky0J0UwHgaxO/uAADXdYnieol6J7lYacNp9xSxHMVMwHV77KXzaQySzlTWmiB5gRB9JM+geuZKkIjIFivt2zHEscx27GWtFmvOd+fp3Xq9MWazp565JgNAiZXr2vPXqMm1cXIDb9uVL0fD26xa/gMhtyshtyshtyshtyshtyuu5YarU40ffKwZbYdcZ+7NbWi89WKBiAkA2Dt815kLuV1hP3NSzvOE6vOSKrwkc7VY79gKczlKZIWgqdydgLWg64IScrPcVUXrqrmioHQFVrwOVr0KcHRsRbzndiXkJLhdofyakJsl1paGuJYz3YmvWolQuM6cazn2banwPzMVnsThOnOu5VzzARnBeIM8tq0ZAAAAAElFTkSuQmCC',
				},
			},
		],
	})

	// MARK: Toggle Lock PVW Screen ...
	for (const screen of allscreens) {
		presets.push({
			label: 'Toggle Lock PVW Screen ' + screen,
			category: 'Lock Screens',
			bank: {
				text: screen + '\\nPVW',
				style: 'text',
				size: '18',
				color: config.color_dark,
				bgcolor: config.color_greendark,
				png64:
					'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3CAYAAACo29JGAAABt0lEQVRoge1ay5LEIAiErf1uR/lx9jJOGddXFEZj2UeNSNtExARgY6D2BMYYzvURker8KsZLhHLQICpqsIdUDEmSIoZqpGoOp8ZLkPwZNdCgVtVJIkKNsBwmVwDCjchgZj8GAGRC/HdkcMEBBAAgIjDGsDGmxZwfg96uMYZHFNVQDokIAIDvrP7r9fo8KxWi3cplHEevVtiYczZhgyEK5RH1xJULHa5tFNpJXJKcD0cAaHc8fs4vzhKpYGWIkQtVWwVHuadiKIlrABEvOe99cunCUsohymaGJZRzzn1YWWsvfSOEpysXh11Izlr7j+wdTCeXgnMOnHPDdqaTk37PQkwnN7Ib1jCdXEo5Zr6Q7l2A23cbq6F0wJ6unCaa81yh4PT9Q4602PGFa2tEDSdxqWpAo6rYOiy3Jve1s2X0nuA3ilt15Zg5ecv1bledW51cWJu1tEtClVzDlt16G92FrTeUQ24AtXrmMTfOOeQIqH+PVyUX5LKYCCaeEYe6cv5zVtTMQZ8apm0oW5xQZkKdXC6R3/ic3I2j3FNxzpZPxdbktCtx9SNWCUe5Xsz+CeBcpz8VW5PbGn/AbcB8DcHhggAAAABJRU5ErkJggg==',
			},
			actions: [
				{
					action: 'lockScreen',
					options: {
						screens: [screen],
						preset: 'PREVIEW',
						lock: 'toggle',
					},
				},
			],
			release_actions: [],
			feedbacks: [
				{
					type: 'liveScreenLock',
					options: {
						screen: screen,
						preset: 'PREVIEW',
					},
					style: {
						bgcolor: config.color_greengrey,
						png64:
							'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3CAYAAACo29JGAAABSklEQVRoge2a2w7DIAhAZdl3N60/zp5MjBNLBdwknKe19cIZLdVlKTkGrCc4jgOpazln0/lNBh8JUViIqg44I9WiKaky0J0UwHgaxO/uAADXdYnieol6J7lYacNp9xSxHMVMwHV77KXzaQySzlTWmiB5gRB9JM+geuZKkIjIFivt2zHEscx27GWtFmvOd+fp3Xq9MWazp565JgNAiZXr2vPXqMm1cXIDb9uVL0fD26xa/gMhtyshtyshtyshtyshtyuu5YarU40ffKwZbYdcZ+7NbWi89WKBiAkA2Dt815kLuV1hP3NSzvOE6vOSKrwkc7VY79gKczlKZIWgqdydgLWg64IScrPcVUXrqrmioHQFVrwOVr0KcHRsRbzndiXkJLhdofyakJsl1paGuJYz3YmvWolQuM6cazn2banwPzMVnsThOnOu5VzzARnBeIM8tq0ZAAAAAElFTkSuQmCC',
					},
				},
			],
		})
	}

	// MARK: Select Layer
	for (const screen of getScreensAuxArray(state)) {
		for (const layer of getLayerChoices(state, screen.id)) {
			presets.push({
				label: 'Select Layer' + layer.label + ' of ' + screen.id,
				category: 'Select Layers',
				bank: {
					text: 'Select ' + screen.id + ' ' + layer.label.replace('Layer ', 'L'),
					style: 'text',
					size: '14',
					color: config.color_bright,
					bgcolor: config.color_dark,
				},
				actions: [
					{
						action: 'selectLayer',
						options: {
							method: 'spec',
							screen: [screen.id],
							layersel: ['1'],
							[`layer${screen.id}`]: [layer.id],
						},
					},
				],
				release_actions: [],
				feedbacks: [
					{
						type: 'remoteLayerSelection',
						options: {
							screen: screen.id,
							layer: layer.id,
							preset: 'all',
						},
						style: {
							bgcolor: config.color_highlight,
						},
					},
				],
			})
			presets.push({
				label: 'Toggle Layer' + layer.label + ' of ' + screen.id,
				category: 'Select Layers',
				bank: {
					text: 'Toggle ' + screen.id + ' ' + layer.label.replace('Layer ', 'L'),
					style: 'text',
					size: '14',
					color: config.color_bright,
					bgcolor: config.color_dark,
				},
				actions: [
					{
						action: 'selectLayer',
						options: {
							method: 'spectgl',
							screen: [screen.id],
							layersel: ['1'],
							[`layer${screen.id}`]: [layer.id],
						},
					},
				],
				release_actions: [],
				feedbacks: [
					{
						type: 'remoteLayerSelection',
						options: {
							screen: screen.id,
							layer: layer.id,
							preset: 'all',
						},
						style: {
							bgcolor: config.color_highlight,
						},
					},
				],
			})
		}
	}

	// MARK: Choose Input ...
	function makeInputSelectionPreset(input: Dropdown<string>, layertypes: string[], layerdescription: string) {
		let sourceLabelVariable = ''
		// sourceLayer, sourceNative, sourceBack, sourceFront
		if (input.id.match(/^IN|LIVE|STILL|SCREEN/)) {
			sourceLabelVariable = `\\n$(${ilabel}:${input.id.replace('LIVE_', 'INPUT_')}label)`
		}
		const preparedPreset: CompanionPreset = {
			label: 'Choose Input ' + input.label + ' for selected '+ layerdescription +' Layer(s)',
			category: 'Layer Source',
			bank: {
				text: input.label.replace(/^(\D+\d+)\s.+$/, '$1') + sourceLabelVariable,
				style: 'text',
				size: 'auto',
				color: config.color_bright,
				bgcolor: config.color_dark,
			},
			actions: [
				{
					action: 'deviceSelectSource',
					options: {
						method: 'sel',
					},
				},
			],
			release_actions: [],
			feedbacks: [
				{
					type: 'deviceSourceTally',
					options: {
						screens: ['all'],
						preset: 'pvw',
						source: input.id,
					},
					style: {
						bgcolor: config.color_green,
					},
				},
				{
					type: 'deviceSourceTally',
					options: {
						screens: ['all'],
						preset: 'pgm',
						source: input.id,
					},
					style: {
						bgcolor: config.color_red,
					},
				},
			],
		}
		layertypes.forEach(layertype => preparedPreset.actions[0].options[layertype] = input.id)
		//if (state.platform === 'midra' && layertype === 'sourceLayer' && input.id !== 'COLOR') preparedPreset.actions[0].options['sourceBack'] = input.id
		presets.push(preparedPreset)
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
	if (state.platform === 'livepremier') {
		getSourceChoices(state).filter(choice => choice.id !== 'NONE' && choice.id !== 'COLOR').forEach((choice: Dropdown<string>) => {
			makeInputSelectionPreset(choice, ['sourceLayer', 'sourceBack'], '')
		})
		choicesBackgroundSources.forEach((choice: Dropdown<string>) => {
			makeInputSelectionPreset(choice, ['sourceNative'], 'Background')
		})
	}



	// MARK: Toggle Freeze Input ...
	if (state.platform === 'livepremier') for (const input of getLiveInputArray(state)) {
		presets.push({
			label: 'Toggle Freeze ' + input.label,
			category: 'Input Freeze',
			bank: {
				text: 'Freeze\\nIn ' + input.index,
				style: 'text',
				size: 'auto',
				color: config.color_bright,
				bgcolor: config.color_dark,
			},
			actions: [
				{
					action: 'deviceInputFreeze',
					options: {
						input: input.id,
						mode: 2,
					},
				},
			],
			release_actions: [],
			feedbacks: [
				{
					type: 'deviceInputFreeze',
					options: {
						input: input.id,
					},
					style: {
						bgcolor: instance.rgb(0, 0, 100),
						png64:
							'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3AQMAAACSFUAFAAABS2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxMzggNzkuMTU5ODI0LCAyMDE2LzA5LzE0LTAxOjA5OjAxICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+IEmuOgAAAARnQU1BAACxjwv8YQUAAAABc1JHQgCuzhzpAAAABlBMVEUAAABfXKLsUQDeAAAAAXRSTlMAQObYZgAAAM9JREFUGNONkTEOwjAMRX9UpDC1nIBwEKRyJCMGmNogDsCRyMY1wg26ESTUYLc1sEGWp1h2/vcPABDG84MrWoxXOgxcUycol7tbEFb748Aim4HmKZyXSCZsUFpQwQ1OeIqorsxzQHFnXgCTmT3PtczErD1ZEXCBXJR6RzXXzSNR3wA2NrvkPCpf52gDZnDZw3Oj7Ue/xfObM9gMSL/LgfttbHPH8+bRb+U9tIla0XVx1FP9yY/6U7/qX/fR/XRf3f+Th+Yz5aX5vfPUfP/6jxdhImTMvNrBOgAAAABJRU5ErkJggg==',
					},
				},
			],
		})
	}

	// MARK: Multiviewer Memories
	const multiviewers = getMultiviewerArray(state)
	const multimulti: boolean = multiviewers.length > 1
	for (const multiviewer of getMultiviewerArray(state)) {
		for (const memory of getMultiviewerMemoryArray(state)) {
			const bgcolor = parseInt(state.get(['REMOTE', 'banks', 'monitoring', 'items', memory.id, 'color'])?.slice(1), 16)
			const color =
				(instance.rgbRev(bgcolor).r + instance.rgbRev(bgcolor).g + instance.rgbRev(bgcolor).b) / 3 > 127
					? config.color_dark
					: config.color_bright

			presets.push({
				label: 'Load VM' + memory.id + multimulti ? ' on Multiviewer ' + multiviewer : '',
				category: 'Multiviewer Memories',
				bank: {
					text: (multimulti ? `MV${multiviewer} `: '') +  `VM${memory.id}\\n$(${ilabel}:multiviewerMemory${memory.id}label)`,
					style: 'text',
					size: 'auto',
					color,
					bgcolor,
				},
				actions: [
					{
						action: 'deviceMultiviewerMemory',
						options: {
							memory: memory.id,
							multiviewer,
						},
					},
				],
				release_actions: [],
				feedbacks: [],
			})
		}
	}

	// MARK: Select Widget
	for (const widget of getWidgetChoices(state)) {
		presets.push({
			label: 'Select ' + widget.label,
			category: 'Select Widgets',
			bank: {
				text: 'Select ' + widget.label.replace(/Multiviewer /, 'MV').replace(/Widget /, 'W'),
				style: 'text',
				size: '14',
				color: config.color_bright,
				bgcolor: config.color_dark,
			},
			actions: [
				{
					action: 'remoteMultiviewerSelectWidget',
					options: {
						widget: widget.id,
						sel: 'selectExclusive',
					},
				},
			],
			release_actions: [],
			feedbacks: [
				{
					type: 'remoteWidgetSelection',
					options: {
						widget: widget.id,
					},
					style: {
						bgcolor: config.color_highlight,
					},
				},
			],
		})
	}

	// MARK: Toggle Widget Selection
	for (const widget of getWidgetChoices(state)) {
		presets.push({
			label: 'Toggle Selection of ' + widget.label,
			category: 'Select Widgets',
			bank: {
				text: 'Toggle ' + widget.label.replace(/Multiviewer /, 'MV').replace(/Widget /, 'W'),
				style: 'text',
				size: '14',
				color: config.color_bright,
				bgcolor: config.color_dark,
			},
			actions: [
				{
					action: 'remoteMultiviewerSelectWidget',
					options: {
						widget: widget.id,
						sel: 'toggle',
					},
				},
			],
			release_actions: [],
			feedbacks: [
				{
					type: 'remoteWidgetSelection',
					options: {
						widget: widget.id,
					},
					style: {
						bgcolor: config.color_highlight,
					},
				},
			],
		})
	}

	// MARK: Select Widget Source
	for (const source of getWidgetSourceChoices(state)) {
		presets.push({
			label: 'Select Widget Source' + source.label,
			category: 'Wultiviewer Source',
			bank: {
				text: 'MV ' + source.label.replace(/ - /, '\\n'),
				style: 'text',
				size: 'auto',
				color: config.color_bright,
				bgcolor: config.color_dark,
			},
			actions: [
				{
					action: 'deviceMultiviewerSource',
					options: {
						widget: 'sel',
						source: source.id,
					},
				},
			],
			release_actions: [],
			feedbacks: [],
		})
	}

	// MARK: Timers
	for (const timer of getTimerChoices(state)) {
		presets.push({
			label: 'Play/Pause ' + timer.label,
			category: 'Timer',
			bank: {
				text: timer.label.replace(/\D/g, '') + '⏯',
				style: 'text',
				size: '44',
				color: config.color_bright,
				bgcolor: config.color_dark,
			},
			actions: [
				{
					action: 'deviceTimerTransport',
					options: {
						timer: timer.id,
						cmd: 'tgl_start_pause',
					},
				},
			],
			release_actions: [],
			feedbacks: [
				{
					type: 'timerState',
					options: {
						timer: timer.id,
						state: 'RUNNING'
					},
					style: {
						bgcolor: config.color_green,
						text: timer.label.replace(/\D/g, '') + ' ⏸',
					},
				},
				{
					type: 'timerState',
					options: {
						timer: timer.id,
						state: 'PAUSED'
					},
					style: {
						bgcolor: config.color_greendark,
						text: timer.label.replace(/\D/g, '') + ' ⏵',
					},
				},
				{
					type: 'timerState',
					options: {
						timer: timer.id,
						state: 'IDLE'
					},
					style: {
						bgcolor: config.color_greendark,
						text: timer.label.replace(/\D/g, '') + ' ⏵',
					},
				},
				{
					type: 'timerState',
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
			bank: {
				text: timer.label.replace(/\D/g, '') + ' ⏹',
				style: 'text',
				size: '44',
				color: config.color_bright,
				bgcolor: config.color_dark,
			},
			actions: [
				{
					action: 'deviceTimerTransport',
					options: {
						timer: timer.id,
						cmd: 'stop',
					},
				},
			],
			release_actions: [],
			feedbacks: [
				{
					type: 'timerState',
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
					type: 'timerState',
					options: {
						timer: timer.id,
						state: 'PAUSED'
					},
					style: {
						bgcolor: config.color_greendark,
					},
				},
				{
					type: 'timerState',
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
					type: 'timerState',
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
		})
	}

	// MARK: Stream
	if (state.platform === 'midra') presets.push({
		label: 'Start/Stop Streaming ',
			category: 'Streaming',
			bank: {
				text: 'Start Stream',
				style: 'text',
				size: 'auto',
				color: config.color_bright,
				bgcolor: config.color_dark,
			},
			actions: [
				{
					action: 'deviceStreamControl',
					options: {
						stream: 'toggle',
					},
				},
			],
			release_actions: [],
			feedbacks: [
				{
					type: 'deviceStreaming',
					options: {
						state: 'LIVE'
					},
					style: {
						bgcolor: config.color_green,
						text: 'Stop Stream',
					},
				},
			],
		})

	return presets
}
