import AWJinstance from './index'
import {
	CompanionFeedbacks,
	CompanionFeedbackEvent,
} from '../../../instance_skel_types'
// import { CompanionFeedback } from '../../../instance_skel_types'
import { State } from './state'
import {
	choicesBackgroundSources,
	choicesPreset,
	getAuxChoices,
	getAuxMemoryChoices,
	getLayerChoices,
	getLiveInputChoices,
	getMasterMemoryChoices,
	getScreenAuxChoices,
	getScreenChoices,
	getScreenMemoryChoices,
	getSourceChoices,
	getTimerChoices,
	getWidgetChoices,
} from './choices'

export function getFeedbacks(instance: AWJinstance, state: State): CompanionFeedbacks {
	const feedbacks = {}
	const config = instance.config

	// MARK: syncselection
	feedbacks['syncselection'] = {
		type: 'boolean',
		label: 'Synchronization of the selection',
		description: 'Shows wether this client synchronizes its selection to the device',
		style: {
			color: config.color_dark,
			bgcolor: config.color_highlight,
		},
		callback: (_feedback: CompanionFeedbackEvent) => {
			const clients = state.getUnmapped('REMOTE/system/network/websocketServer/clients')
			if (clients === undefined || Array.isArray(clients) === false) return false
			const myid: string = state.getUnmapped('LOCAL/socketId')
			const myindex = clients.findIndex((elem) => {
				if (elem.id === myid) {
					return true
				} else {
					return false
				}
			})
			if (state.getUnmapped(`REMOTE/system/network/websocketServer/clients/${myindex}/isRemoteSelectionEnabled`)) {
				return true
			} else {
				return false
			}
		},
	}

	// MARK: Master Memory
	feedbacks['deviceMasterMemory'] = {
		type: 'boolean',
		label: 'Master Memory',
		description: 'Indicates the last used master memory',
		style: {
			color: config.color_dark,
			bgcolor: config.color_highlight,
		},
		options: [
			{
				id: 'memory',
				type: 'dropdown',
				label: 'Screen Memory',
				choices: getMasterMemoryChoices(state),
				default: getMasterMemoryChoices(state)[0]?.id,
			},
			{
				id: 'preset',
				type: 'dropdown',
				label: 'Preset',
				choices: [{ id: 'all', label: 'Any' }, ...choicesPreset],
				default: 'all',
			},
		],
		callback: (feedback: CompanionFeedbackEvent) => {
			if (
				(feedback.options.preset === 'all' || feedback.options.preset === 'pgm') &&
				state.get('DEVICE/device/masterPresetBank/status/lastUsed/presetModeList/items/PROGRAM/pp/memoryId') == feedback.options.memory
			) return true
			if (
				(feedback.options.preset === 'all' || feedback.options.preset === 'pvw') &&
				state.get('DEVICE/device/masterPresetBank/status/lastUsed/presetModeList/items/PREVIEW/pp/memoryId') == feedback.options.memory
			) return true
			return false
		},
	}

	// MARK: Screen Memory
	feedbacks['deviceScreenMemory'] = {
		type: 'boolean',
		label: 'Screen Memory',
		description: 'Shows wether a screen Memory is loaded on a screen',
		style: {
			color: config.color_dark,
			bgcolor: config.color_highlight,
		},
		options: [
			{
				id: 'preset',
				type: 'dropdown',
				label: 'Preset',
				choices: [{ id: 'all', label: 'Any' }, ...choicesPreset],
				default: 'all',
			},
			{
				id: 'memory',
				type: 'dropdown',
				label: 'Screen Memory',
				choices: getScreenMemoryChoices(state),
				default: getScreenMemoryChoices(state)[0]?.id,
			},
			{
				id: 'unmodified',
				type: 'dropdown',
				label: 'is Modified',
				choices: [
					{ id: 0, label: 'only if unmodified' },
					{ id: 1, label: 'only if modified' },
					{ id: 2, label: "don't care unmodified or modified" },
				],
				default: 2,
			},
		],
		callback: (feedback: CompanionFeedbackEvent) => {
			const screens = state.platform === 'midra' ? state.getChosenScreens(feedback.options.screens) : state.getChosenScreenAuxes(feedback.options.screens)
			const presets = feedback.options.preset === 'all' ? ['pgm', 'pvw'] : [feedback.options.preset]
			const map = {
				livepremier: { id: ['presetId','status','pp','id'], modified: ['presetId','status','pp','isNotModified'], modyes: true },
				midra: {id: ['status','pp','memoryId'], modified: ['status','pp','isModified'], modyes: false}
			}
			for (const screen of screens) {
				for (const preset of presets) {
					if (
						state.get([
							'DEVICE',
							'device',
							'screenList',
							'items',
							screen,
							'presetList',
							'items',
							state.getPreset(screen, preset),
							...map[state.platform].id,
						]) == feedback.options.memory
					) {
						if (feedback.options.unmodified === 2) return true
						const modified = state.get([
							'DEVICE',
							'device',
							'screenList',
							'items',
							screen,
							'presetList',
							'items',
							state.getPreset(screen, preset),
							...map[state.platform].modified,
						])
						if ( ((!map[state.platform].modyes && modified) || (map[state.platform].modyes && !modified)) == feedback.options.unmodified) {
							return true
						}
					}
				}
			}
			return false
		},
	}
	if (state.platform === 'livepremier') feedbacks['deviceScreenMemory'].options.unshift(
		{
				id: 'screens',
				type: 'dropdown',
				label: 'Screens / Auxscreens',
				choices: [{ id: 'all', label: 'Any' }, ...getScreenAuxChoices(instance.state)],
				multiple: true,
				tags: true,
				regex: '/^(S|A)([1-9]|[1-3][0-9]|4[0-8])$/',
				default: ['all'],
			},
	)
	if (state.platform === 'midra') feedbacks['deviceScreenMemory'].options.unshift(
		{
				id: 'screens',
				type: 'dropdown',
				label: 'Screens',
				choices: [{ id: 'all', label: 'Any' }, ...getScreenChoices(instance.state)],
				multiple: true,
				tags: true,
				regex: '/^S([1-9]|[1-3][0-9]|4[0-8])$/',
				default: ['all'],
			},
	)

// MARK: Aux Memory
	if (state.platform === 'midra') feedbacks['deviceAuxMemory'] = {
		type: 'boolean',
		label: 'Aux Memory',
		description: 'Shows wether a Aux Memory is loaded on a auxscreen',
		style: {
			color: config.color_dark,
			bgcolor: config.color_highlight,
		},
		options: [
			{
				id: 'screens',
				type: 'dropdown',
				label: 'Aux Screens',
				choices: [{ id: 'all', label: 'Any' }, ...getAuxChoices(instance.state)],
				multiple: true,
				tags: true,
				regex: '/^S([1-9]|[1-3][0-9]|4[0-8])$/',
				default: ['all'],
			},
			{
				id: 'preset',
				type: 'dropdown',
				label: 'Preset',
				choices: [{ id: 'all', label: 'Any' }, ...choicesPreset],
				default: 'all',
			},
			{
				id: 'memory',
				type: 'dropdown',
				label: 'Aux Memory',
				choices: getAuxMemoryChoices(state),
				default: getAuxMemoryChoices(state)[0]?.id,
			},
			{
				id: 'unmodified',
				type: 'dropdown',
				label: 'is Modified',
				choices: [
					{ id: 0, label: 'only if unmodified' },
					{ id: 1, label: 'only if modified' },
					{ id: 2, label: "don't care unmodified or modified" },
				],
				default: 2,
			},
		],
		callback: (feedback: CompanionFeedbackEvent) => {
			const screens = state.getChosenAuxes(feedback.options.screens)
			const presets = feedback.options.preset === 'all' ? ['pgm', 'pvw'] : [feedback.options.preset]
			const map = {
				livepremier: { id: ['presetId','status','pp','id'], modified: ['presetId','status','pp','isNotModified'], modyes: true },
				midra: {id: ['status','pp','memoryId'], modified: ['status','pp','isModified'], modyes: false}
			}
			for (const screen of screens) {
				for (const preset of presets) {
					if (
						state.get([
							'DEVICE',
							'device',
							'screenList',
							'items',
							screen,
							'presetList',
							'items',
							state.getPreset(screen, preset),
							...map[state.platform].id,
						]) == feedback.options.memory
					) {
						if (feedback.options.unmodified === 2) return true
						const modified = state.get([
							'DEVICE',
							'device',
							'screenList',
							'items',
							screen,
							'presetList',
							'items',
							state.getPreset(screen, preset),
							...map[state.platform].modified,
						])
						if ( ((!map[state.platform].modyes && modified) || (map[state.platform].modyes && !modified)) == feedback.options.unmodified) {
							return true
						}
					}
				}
			}
			return false
		},
	}

	// MARK: deviceSourceTally
	feedbacks['deviceSourceTally'] = {
		type: 'boolean',
		label: 'Source Tally',
		description: 'Shows wether a source is visible on program or preview in a screen',
		style: {
			color: config.color_dark,
			bgcolor: config.color_highlight,
		},
		options: [
			{
				id: 'screens',
				type: 'dropdown',
				label: 'Screens / Auxscreens',
				choices: [{ id: 'all', label: 'Any' }, ...getScreenAuxChoices(instance.state)],
				multiple: true,
				tags: true,
				regex: '/^(S|A)([1-9]|[1-3][0-9]|4[0-8])$/',
				default: ['all'],
			},
			{
				id: 'preset',
				type: 'dropdown',
				label: 'Preset',
				choices: choicesPreset,
				default: 'pgm',
			},
			{
				id: 'source',
				type: 'dropdown',
				label: 'Source',
				choices: [...getSourceChoices(state), ...choicesBackgroundSources],
				default: 'NONE',
			},
		],
		callback: (feedback: CompanionFeedbackEvent) => {
			// go thru the screens
			for (const screen of state.getChosenScreenAuxes(feedback.options.screens)) {
				const preset = state.getPreset(screen, feedback.options.preset)
				for (const layer of getLayerChoices(state, screen)) {
					const screenpath = [
						'DEVICE',
						'device',
						'screenList',
						'items',
						screen
					]
					const presetpath = [...screenpath, 'presetList', 'items', preset]
					const layerpath = [...presetpath, 'layerList', 'items', layer.id]

					// check if source is used in background set on a screen
					if (layer.id === 'NATIVE' && state.platform === 'midra') {
						const set = state.get([...presetpath, 'background', 'source', 'pp', 'set'])
						if (set === 'NONE') continue
						const setinput = state.get([...screenpath, 'backgroundSetList', 'items', set, 'control', 'pp', 'singleContent'])
						if (setinput === feedback.options.source) return true
						else continue
					}

					// check is source is used in background layer on a aux
					if (layer.id === 'BKG' && state.platform === 'midra') {
						const bkginput = state.get([...presetpath, 'background', 'source', 'pp', 'content'])
						if (bkginput === feedback.options.source) return true
						else continue
					}

					// check if source is used in top layer
					if (layer.id === 'TOP' && state.platform === 'midra') {
						const frginput = state.get([...presetpath, 'top', 'source', 'pp', 'frame'])
						if (frginput === feedback.options.source) return true
						else continue
					}
					
					if ((feedback.options.source === 'NONE' || feedback.options.source.toString().startsWith('BACKGROUND') && state.get(['source', 'pp', 'inputNum'], root) === feedback.options.source)) {
						return true
					}
					if (state.get([...layerpath, 'source', 'pp', 'inputNum']) === feedback.options.source) {
						let invisible = (
							state.get([...layerpath, 'position', 'pp', 'sizeH']) === 0 ||
							state.get([...layerpath, 'position', 'pp', 'sizeV']) === 0 ||
							state.get([...layerpath, 'opacity', 'pp', 'opacity']) === 0 ||
							state.get([...layerpath, 'cropping', 'classic', 'pp', 'top']) +
								state.get([...layerpath,'cropping', 'classic', 'pp', 'bottom']) >
								65528 ||
							state.get([...layerpath, 'cropping', 'classic', 'pp', 'left']) +
								state.get([...layerpath, 'cropping', 'classic', 'pp', 'right']) >
								65528 ||
							state.get([...layerpath, 'cropping', 'mask', 'pp', 'top']) +
								state.get([...layerpath, 'cropping', 'mask', 'pp', 'bottom']) >
								65528 ||
							state.get([...layerpath, 'cropping', 'mask', 'pp', 'left']) +
								state.get([...layerpath, 'cropping', 'mask', 'pp', 'right']) >
								65528 ||
							state.get([...layerpath, 'position', 'pp', 'posH']) + state.get([...layerpath, 'position', 'pp', 'sizeH']) / 2 <= 0 ||
							state.get([...layerpath, 'position', 'pp', 'posV']) + state.get([...layerpath, 'position', 'pp', 'sizeV']) / 2 <= 0 ||
							state.get([...layerpath, 'position', 'pp', 'posH']) - state.get([...layerpath, 'position', 'pp', 'sizeH']) / 2 >=
								state.get(['DEVICE', 'device', 'screenList', 'items', screen, 'status', 'size', 'pp', 'sizeH']) ||
							state.get([...layerpath, 'position', 'pp', 'posV']) - state.get([...layerpath, 'position', 'pp', 'sizeV']) / 2 >=
								state.get(['DEVICE', 'device', 'screenList', 'items', screen, 'status', 'size', 'pp', 'sizeV'])
						)
						if (!invisible) {
							return true
						}
					}
				}
			}
			return false
		},
	}

	// MARK: deviceTake
	feedbacks['deviceTake'] = {
		type: 'boolean',
		label: 'Transition active',
		description: 'Shows wether a screen is currently in a take/fade transition',
		style: {
			color: config.color_dark,
			bgcolor: config.color_highlight,
		},
		options: [
			{
				id: 'screens',
				type: 'dropdown',
				label: 'Screens / Auxscreens',
				choices: [{ id: 'all', label: 'Any' }, ...getScreenAuxChoices(instance.state)],
				multiple: true,
				tags: true,
				regex: '/^(S|A)([1-9]|[1-3][0-9]|4[0-8])$/',
				default: 'all',
			},
		],
		callback: (feedback: CompanionFeedbackEvent) => {
			if (state.platform === 'livepremier' && state.getChosenScreenAuxes(feedback.options.screens)
				.find((screen: string) => {
					return state.get(`DEVICE/device/screenGroupList/items/${screen}/status/pp/transition`).match(/FROM/)
				})) return true
	
			if (state.platform === 'midra' && state.getChosenScreenAuxes(feedback.options.screens)
				.find((screen: string) => {
					return state.get(`DEVICE/device/transition/screenList/items/${screen}/status/pp/transition`).match(/FROM/)
				})) return true
			
			return false
		},
	}

	// MARK: liveScreenSelection
	feedbacks['liveScreenSelection'] = {
		type: 'boolean',
		label: 'Screen Selection',
		description: 'Shows wether a screen is currently selected',
		style: {
			color: config.color_dark,
			bgcolor: config.color_highlight,
		},
		options: [
			{
				id: 'screen',
				type: 'dropdown',
				label: 'Screen / Auxscreen',
				choices: getScreenAuxChoices(instance.state),
			},
		],
		callback: (feedback: CompanionFeedbackEvent) => {
			return state.getSelectedScreens()?.includes(feedback.options.screen)
		},
	}

	// MARK: liveScreenLock
	feedbacks['liveScreenLock'] = {
		type: 'boolean',
		label: 'Screen Lock',
		description: 'Shows wether a screen currently is locked',
		style: {
			png64:
				'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3CAYAAACo29JGAAABSklEQVRoge2a2w7DIAhAZdl3N60/zp5MjBNLBdwknKe19cIZLdVlKTkGrCc4jgOpazln0/lNBh8JUViIqg44I9WiKaky0J0UwHgaxO/uAADXdYnieol6J7lYacNp9xSxHMVMwHV77KXzaQySzlTWmiB5gRB9JM+geuZKkIjIFivt2zHEscx27GWtFmvOd+fp3Xq9MWazp565JgNAiZXr2vPXqMm1cXIDb9uVL0fD26xa/gMhtyshtyshtyshtyshtyuu5YarU40ffKwZbYdcZ+7NbWi89WKBiAkA2Dt815kLuV1hP3NSzvOE6vOSKrwkc7VY79gKczlKZIWgqdydgLWg64IScrPcVUXrqrmioHQFVrwOVr0KcHRsRbzndiXkJLhdofyakJsl1paGuJYz3YmvWolQuM6cazn2banwPzMVnsThOnOu5VzzARnBeIM8tq0ZAAAAAElFTkSuQmCC',
		},
		options: [
			{
				id: 'screen',
				type: 'dropdown',
				label: 'Screen',
				choices: [{ id: 'all', label: 'ALL' }, ...getScreenAuxChoices(state)],
				default: 'all',
				tooltip: '"All" resembels the state of the lock-all button in WebRCS.',
			},
			{
				id: 'preset',
				label: 'Preset',
				type: 'dropdown',
				choices: [
					{ id: 'PROGRAM', label: 'Program' },
					{ id: 'PREVIEW', label: 'Preview' },
				],
				default: 'PROGRAM',
			},
		],
		callback: (feedback: CompanionFeedbackEvent) => {
			return state.isLocked(feedback.options.screen, feedback.options.preset)
		},
	}

	// MARK: livePresetSelection
	feedbacks['livePresetSelection'] = {
		type: 'boolean',
		label: 'Preset Selection',
		description: 'Shows wether program or preview is currently selected',
		style: {
			color: config.color_dark,
			bgcolor: config.color_highlight,
		},
		options: [
			{
				id: 'preset',
				type: 'dropdown',
				label: 'Preset',
				choices: [
					{ id: 'PROGRAM', label: 'Program' },
					{ id: 'PREVIEW', label: 'Preview' },
				],
			},
		],
		callback: (feedback: CompanionFeedbackEvent) => {
			let preset: string,
				vartext = 'PGM'
			if (state.syncSelection) {
				preset = state.get('REMOTE/live/screens/presetModeSelection/presetMode')
			} else {
				preset = state.get('LOCAL/presetMode')
			}
			if (preset === 'PREVIEW') {
				vartext = 'PVW'
			}
			instance.setVariable('selectedPreset', vartext)
			return preset === feedback.options.preset
		},
	}

	// MARK: remoteLayerSelection
	feedbacks['remoteLayerSelection'] = {
		type: 'boolean',
		label: 'Layer Selection',
		description: 'Shows wether a layer is currently selected',
		style: {
			color: config.color_dark,
			bgcolor: config.color_highlight,
		},
		options: [
			{
				id: 'screen',
				type: 'dropdown',
				label: 'Screen / Auxscreen',
				choices: getScreenAuxChoices(instance.state),
				default: getScreenAuxChoices(instance.state)[0]?.id,
			},
			{
				id: 'layer',
				type: 'dropdown',
				label: 'Layer',
				choices: [{ id: 'all', label: 'Any' }, ...getLayerChoices(instance.state, 48, true)],
				default: 'all',
			},
			{
				id: 'preset',
				type: 'dropdown',
				label: 'Selected Preset',
				choices: [
					{ id: 'all', label: 'Any' },
					{ id: 'PROGRAM', label: 'Program' },
					{ id: 'PREVIEW', label: 'Preview' },
				],
				default: 'all',
			},
		],
		callback: (feedback: CompanionFeedbackEvent) => {
			let pst = true
			if (feedback.options.preset != 'all') {
				let preset: string
				if (state.syncSelection) {
					preset = state.get('REMOTE/live/screens/presetModeSelection/presetMode')
				} else {
					preset = state.get('LOCAL/presetMode')
				}
				if (preset != feedback.options.preset) {
					pst = false
				}
			}
			if (feedback.options.layer === 'all') {
				return (
					JSON.stringify(state.getSelectedLayers()).includes(
						`{"screenAuxKey":"${feedback.options.screen}","layerKey":"`
					) && pst
				)
			} else {
				return (
					JSON.stringify(state.getSelectedLayers()).includes(
						`{"screenAuxKey":"${feedback.options.screen}","layerKey":"${feedback.options.layer}"}`
					) && pst
				)
			}
		},
	}

	// MARK: remoteWidgetSelection
	feedbacks['remoteWidgetSelection'] = {
		type: 'boolean',
		label: 'Widget Selection',
		description: 'Shows wether a multiviewer widget is currently selected',
		style: {
			color: config.color_dark,
			bgcolor: config.color_highlight,
		},
		options: [
			{
				id: 'widget',
				type: 'dropdown',
				label: 'Widget',
				choices: getWidgetChoices(state),
				default: getWidgetChoices(state)[0]?.id,
			},
		],
		callback: (feedback: CompanionFeedbackEvent) => {
			const mvw = feedback.options.widget.toString().split(':')[0] ?? '1'
			const widget = feedback.options.widget.toString().split(':')[1] ?? '0'
			let widgetSelection = []
			if (state.syncSelection) {
				widgetSelection = [...state.get('REMOTE/live/multiviewers/widgetSelection/widgetIds')]
			} else {
				widgetSelection = state.get('LOCAL/widgetSelection/widgetIds')
			}
			return JSON.stringify(widgetSelection).includes(`{"widgetKey":"${widget}","multiviewerKey":"${mvw}"}`)
		},
	}

	// MARK: deviceInputFreeze
	if (state.platform === 'livepremier') feedbacks['deviceInputFreeze'] = {
		type: 'boolean',
		label: 'Input Freeze',
		description: 'Shows wether an input currently is frozen',
		style: {
			color: config.color_bright,
			bgcolor: instance.rgb(0, 0, 100),
			png64:
				'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3AQMAAACSFUAFAAABS2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxMzggNzkuMTU5ODI0LCAyMDE2LzA5LzE0LTAxOjA5OjAxICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+IEmuOgAAAARnQU1BAACxjwv8YQUAAAABc1JHQgCuzhzpAAAABlBMVEUAAABfXKLsUQDeAAAAAXRSTlMAQObYZgAAAM9JREFUGNONkTEOwjAMRX9UpDC1nIBwEKRyJCMGmNogDsCRyMY1wg26ESTUYLc1sEGWp1h2/vcPABDG84MrWoxXOgxcUycol7tbEFb748Aim4HmKZyXSCZsUFpQwQ1OeIqorsxzQHFnXgCTmT3PtczErD1ZEXCBXJR6RzXXzSNR3wA2NrvkPCpf52gDZnDZw3Oj7Ue/xfObM9gMSL/LgfttbHPH8+bRb+U9tIla0XVx1FP9yY/6U7/qX/fR/XRf3f+Th+Yz5aX5vfPUfP/6jxdhImTMvNrBOgAAAABJRU5ErkJggg==',
		},
		options: [
			{
				id: 'input',
				type: 'dropdown',
				label: 'Input',
				choices: getLiveInputChoices(state),
				default: getLiveInputChoices(state)[0]?.id,
			},
		],
		callback: (feedback: CompanionFeedbackEvent) => {
			const input = feedback.options.input.toString().replace('LIVE', 'IN')
			const freeze = state.get('DEVICE/device/inputList/items/' + input + '/control/pp/freeze')
			if (freeze) {
				instance.setVariable('frozen_' + input, '*')
			} else {
				instance.setVariable('frozen_' + input, ' ')
			}
			return freeze
		},
	}

	// MARK: timerState
	feedbacks['timerState'] = {
		type: 'boolean',
		label: 'Timer State',
		description: 'Shows wether a timer is currently stopped or running',
		style: {
			color: config.color_dark,
			bgcolor: config.color_highlight,
		},
		options: [
			{
				id: 'timer',
				type: 'dropdown',
				label: 'Timer',
				choices: getTimerChoices(state),
				default: getTimerChoices(state)[0]?.id,
			},
			{
				id: 'state',
				type: 'dropdown',
				label: 'State',
				choices: [
					{ id: 'RUNNING', label: 'Running' },
					{ id: 'PAUSED', label: 'Paused' },
					{ id: 'IDLE', label: 'Stopped' },
					{ id: 'ELAPSED', label: 'Elapsed' },
				],
				default: 'RUNNING',
			},
		],
		callback: (feedback: CompanionFeedbackEvent) => {
			return (
				state.get('DEVICE/device/timerList/items/' + feedback.options.timer + '/status/pp/state') ===
				feedback.options.state
			)
		},
	}

	// MARK: deviceGpioOut
	if (state.platform === 'livepremier') feedbacks['deviceGpioOut'] = {
		type: 'boolean',
		label: 'GPO State',
		description: 'Shows wether a general purpose output is currently active',
		style: {
			color: config.color_dark,
			bgcolor: config.color_highlight,
		},
		options: [
			{
				id: 'gpo',
				type: 'number',
				label: 'GPO',
				min: 1,
				max: 8,
				range: true,
				default: 1,
			},
			{
				id: 'state',
				type: 'dropdown',
				label: 'State',
				choices: [
					{ id: 0, label: 'GPO is off' },
					{ id: 1, label: 'GPO is on' },
				],
				default: 1,
			},
		],
		callback: (feedback: CompanionFeedbackEvent) => {
			const val = feedback.options.state === 1 ? true : false
			return (
				state.get([
					'DEVICE',
					'device',
					'gpio',
					'gpoList',
					'items',
					feedback.options.gpo.toString(),
					'status',
					'pp',
					'state',
				]) === val
			)
		},
	}

	// MARK: deviceGpioIn
	if (state.platform === 'livepremier') feedbacks['deviceGpioIn'] = {
		type: 'boolean',
		label: 'GPI State',
		description: 'Shows wether a general purpose input is currently active',
		style: {
			color: config.color_dark,
			bgcolor: config.color_highlight,
		},
		options: [
			{
				id: 'gpi',
				type: 'number',
				label: 'GPI',
				min: 1,
				max: 2,
				range: true,
				default: 1,
			},
			{
				id: 'state',
				type: 'dropdown',
				label: 'State',
				choices: [
					{ id: 0, label: 'GPI is off' },
					{ id: 1, label: 'GPI is on' },
				],
				default: 1,
			},
		],
		callback: (feedback: CompanionFeedbackEvent) => {
			const val = feedback.options.state === 1 ? true : false
			return (
				state.get([
					'DEVICE',
					'device',
					'gpio',
					'gpiList',
					'items',
					feedback.options.gpo.toString(),
					'status',
					'pp',
					'state',
				]) === val
			)
		},
	}

	// MARK: deviceStreaming
	if (state.platform === 'midra') feedbacks['deviceStreaming'] = {
		type: 'boolean',
		label: 'Stream Runnning State',
		description: 'Shows status of streaming',
		style: {
			color: config.color_dark,
			bgcolor: config.color_highlight,
		},
		options: [
			{
				id: 'state',
				type: 'dropdown',
				label: 'State',
				choices: [
					{ id: 'NONE', label: 'Stream is off' },
					{ id: 'LIVE', label: 'Stream is on' },
				],
				default: 'LIVE',
			},
		],
		callback: (feedback: CompanionFeedbackEvent) => {
			return (
				state.getUnmapped([
					'DEVICE',
					'device',
					'streaming',
					'status',
					'pp',
					'mode',
				]) === feedback.options.state
			)
		},
	}

	// MARK: deviceCustom
	// feedbacks['deviceCustom'] = {
	// 	type: 'boolean',
	// 	label: 'custom feedback',
	// 	choices: [
	// 		{
	// 			type: 'textinput',
	// 			id: 'path',
	// 			label: 'path',
	// 		},
	// 		{
	// 			type: 'dropdown',
	// 			id: 'valuetype',
	// 			label: 'Evaluate value as type',
	// 			choices: [
	// 				{ id: '1', label: 'Text' },
	// 				{ id: '2', label: 'Number' },
	// 				{ id: '3', label: 'Boolean' },
	// 				{ id: '4', label: 'Object' },
	// 			],
	// 			default: '1',
	// 		},
	// 		{
	// 			type: 'dropdown',
	// 			id: 'actions1',
	// 			label: 'Check',
	// 			choices: [
	// 				{ id: '1', label: 'Text equals' },
	// 				{ id: '2', label: 'Text containes' },
	// 				{ id: '3', label: 'Text length' },
	// 				{ id: '4', label: 'Text matches regular expression' },
	// 			],
	// 			default: '1',
	// 			isVisible: (thisAction: any) => thisAction.options.valuetype === '1',
	// 		},
	// 		{
	// 			type: 'textinput',
	// 			id: 'textValue',
	// 			label: 'value',
	// 			default: '',
	// 			isVisible: (thisAction: any) => thisAction.options.valuetype === '1',
	// 		},
	// 		{
	// 			type: 'dropdown',
	// 			id: 'actions2',
	// 			label: 'Check',
	// 			choices: [
	// 				{ id: '1', label: 'Number equals' },
	// 				{ id: '2', label: 'Number is greater than' },
	// 				{ id: '3', label: 'Number is in range between value and value2' },
	// 				{ id: '4', label: 'Number modulo value is value2' },
	// 			],
	// 			default: '1',
	// 			isVisible: (thisAction: any) => thisAction.options.valuetype === '2',
	// 		},
	// 		{
	// 			type: 'number',
	// 			id: 'numericValue',
	// 			label: 'value1',
	// 			default: 0,
	// 			isVisible: (thisAction: any) => thisAction.options.valuetype === '2',
	// 		},
	// 		{
	// 			type: 'number',
	// 			id: 'numericValue2',
	// 			label: 'value 2',
	// 			default: 0,
	// 			isVisible: (thisAction: any) => thisAction.options.valuetype === '2' && thisAction.options.actions2 === '3',
	// 		},
	// 		{
	// 			type: 'checkbox',
	// 			id: 'invert',
	// 			label: 'Invert result',
	// 			default: false,
	// 		},
	// 	],
	// 	callback: (feedback: CompanionFeedbackEvent) => {
	// 		const ret = false
	// 		// TODO: implement
	// 		return feedback.options.invert ? !ret : ret
	// 	},
	// }

	return feedbacks
}
