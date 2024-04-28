import {AWJinstance, regexAWJpath} from '../index.js'
import {
	Choicemeta,
	choicesBackgroundSources,
	choicesPreset,
	getAuxChoices,
	getAuxMemoryChoices,
	getLayerChoices,
	getLayersAsArray,
	getLiveInputChoices,
	getMasterMemoryChoices,
	getScreenAuxChoices,
	getScreenChoices,
	getScreenMemoryChoices,
	getScreensArray,
	getScreensAuxArray,
	getSourceChoices,
	getTimerChoices,
	getWidgetChoices,
} from './choices.js'
import { combineRgb, CompanionFeedbackBooleanEvent, CompanionFeedbackDefinitions } from '@companion-module/base'

export function getFeedbacks(instance: AWJinstance): CompanionFeedbackDefinitions {
	const feedbacks = {}
	const config = instance.config
	const state = instance.state

	// MARK: syncselection
	feedbacks['syncselection'] = {
		type: 'boolean',
		name: 'Synchronization of the selection',
		description: 'Shows wether this client synchronizes its selection to the device',
		defaultStyle: {
			color: config.color_dark,
			bgcolor: config.color_highlight,
		},
		options: [],
		callback: (_feedback) => {
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

	// MARK: preset toggle
	feedbacks['presetToggle'] = {
		type: 'boolean',
		name: 'Preset Toggle',
		description: 'Shows wether preset toggle is on or off',
		defaultStyle: {
			color: config.color_dark,
			bgcolor: config.color_highlight,
		},
		options: [],
		callback: (_feedback) => {
			let property = 'copyMode'
			let invert = true
			if (state.platform === 'midra') {
				property = 'enablePresetToggle'
				invert = false
			}
			return state.get('DEVICE/device/screenGroupList/items/S1/control/pp/'+ property) === !invert
		},
	}

	// MARK: Master Memory
	feedbacks['deviceMasterMemory'] = {
		type: 'boolean',
		name: 'Master Memory',
		description: 'Indicates the last used master memory',
		defaultStyle: {
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
		callback: (feedback) => {
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
		name: 'Screen Memory',
		description: 'Shows wether a screen Memory is loaded on a screen',
		defaultStyle: {
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
		callback: (feedback: CompanionFeedbackBooleanEvent & { options: { screens: string[], preset: string, memory: string, unmodified: number } }) => {
			if (!state.platform.startsWith('livepremier') && state.platform !== 'midra') return false // we are not connected
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
	if (state.platform.startsWith('livepremier')) feedbacks['deviceScreenMemory'].options.unshift(
		{
				id: 'screens',
				type: 'dropdown',
				label: 'Screens / Auxscreens',
				choices: [{ id: 'all', label: 'Any' }, ...getScreenAuxChoices(instance.state)],
				multiple: true,
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
		name: 'Aux Memory',
		description: 'Shows wether a Aux Memory is loaded on a auxscreen',
		defaultStyle: {
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
		callback: (feedback: CompanionFeedbackBooleanEvent & { options: { screens: string[], preset: string, memory: string, unmodified: number } }) => {
			if (state.platform !== 'midra') return false // we are not connected or connected to a livepremier
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
		name: 'Source Tally',
		description: 'Shows wether a source is visible on program or preview in a screen',
		defaultStyle: {
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
		callback: (feedback: CompanionFeedbackBooleanEvent & { options: { screens: string[], preset: string, source: string } }) => {  
			if (!state.platform.startsWith('livepremier') && state.platform !== 'midra') return false // we are not connected
			const checkTally = (): boolean => {
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
						
						if ((feedback.options.source === 'NONE' || feedback.options.source?.toString().startsWith('BACKGROUND') && state.get([...presetpath, 'source', 'pp', 'inputNum']) === feedback.options.source)) {
							return true
						}
						if (state.get([...layerpath, 'source', 'pp', 'inputNum']) === feedback.options.source) {
							const invisible = (
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
			}

			const tally = checkTally()
			const sortedScreens = [...feedback.options.screens].sort()
			const varName = `tally_${sortedScreens.join('-')}_${feedback.options.preset}_${feedback.options.source}`
			let varValue = '0'
			if (tally) {
				varValue = '1'
			} else {
				varValue = '0'
			}
			if (varValue != instance.getVariableValue(varName)) {
				instance.setVariableValues({ [varName]: varValue })
			}
			return tally
		},
		subscribe: (feedback: CompanionFeedbackBooleanEvent & { options: { screens: string[], preset: string, source: string } }) => {
			const sortedScreens = [...feedback.options.screens].sort()
			const varName = `tally_${sortedScreens.join('-')}_${feedback.options.preset}_${feedback.options.source}`
			instance.addVariable({
				id: feedback.id,
				variableId: varName,
				name: `Tally for ${feedback.options.source} at screens ${sortedScreens.join(', ')}, preset ${feedback.options.preset}`,
			})
		},
		unsubscribe: (feedback: CompanionFeedbackBooleanEvent & { options: { screens: string[], preset: string, source: string } }) => {
			const sortedScreens = [...feedback.options.screens].sort()
			const varName = `tally_${sortedScreens.join('-')}_${feedback.options.preset}_${feedback.options.source}`
			instance.removeVariable(feedback.id, varName)
		}
	}

	// MARK: deviceTake
	feedbacks['deviceTake'] = {
		type: 'boolean',
		name: 'Transition active',
		description: 'Shows wether a screen is currently in a take/fade transition',
		defaultStyle: {
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
		callback: (feedback: CompanionFeedbackBooleanEvent & {options: {screens: string}}) => {
			if (state.platform.startsWith('livepremier') && state.getChosenScreenAuxes(feedback.options.screens)
				.find((screen: string) => {
					return state.get(`DEVICE/device/screenGroupList/items/${screen}/status/pp/transition`).match(/FROM/)
				})) return true
	
			else if (state.platform === 'midra' && state.getChosenScreenAuxes(feedback.options.screens)
				.find((screen: string) => {
					return state.get(`DEVICE/device/transition/screenList/items/${screen}/status/pp/transition`).match(/FROM/)
				})) return true
			
			return false
		},
	}

	// MARK: liveScreenSelection
	feedbacks['liveScreenSelection'] = {
		type: 'boolean',
		name: 'Screen Selection',
		description: 'Shows wether a screen is currently selected',
		defaultStyle: {
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
		callback: (feedback: CompanionFeedbackBooleanEvent & { options: { screen: string } }) => {
			if (!state.platform.startsWith('livepremier') && state.platform !== 'midra') return false // we are not connected
			return state.getSelectedScreens()?.includes(feedback.options.screen)
		},
	}

	// MARK: liveScreenLock
	feedbacks['liveScreenLock'] = {
		type: 'boolean',
		name: 'Screen Lock',
		description: 'Shows wether a screen currently is locked',
		defaultStyle: {
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
		callback: (feedback: CompanionFeedbackBooleanEvent & { options: { screen: string, preset: string } }) => {
			if (!state.platform.startsWith('livepremier') && state.platform !== 'midra') return false // we are not connected
			return state.isLocked(feedback.options.screen, feedback.options.preset)
		},
	}

	// MARK: livePresetSelection
	feedbacks['livePresetSelection'] = {
		type: 'boolean',
		name: 'Preset Selection',
		description: 'Shows wether program or preview is currently selected',
		defaultStyle: {
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
		callback: (feedback: CompanionFeedbackBooleanEvent & { options: { preset: string } }) => {
			if (!state.platform.startsWith('livepremier') && state.platform !== 'midra') return false // we are not connected
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
			instance.setVariableValues({ selectedPreset: vartext })
			return preset === feedback.options.preset
		},
	}

	// MARK: remoteLayerSelection
	feedbacks['remoteLayerSelection'] = {
		type: 'boolean',
		name: 'Layer Selection',
		description: 'Shows wether a layer is currently selected',
		defaultStyle: {
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
		callback: (feedback: CompanionFeedbackBooleanEvent & { options: { screen: string, layer: string, preset: string } }) => {
			if (!state.platform.startsWith('livepremier') && state.platform !== 'midra') return false // we are not connected
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
		name: 'Widget Selection',
		description: 'Shows wether a multiviewer widget is currently selected',
		defaultStyle: {
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
		callback: (feedback: CompanionFeedbackBooleanEvent & { options: { widget: string } }) => {
			if (!state.platform.startsWith('livepremier') && state.platform !== 'midra') return false // we are not connected
			const mvw = feedback.options.widget?.toString().split(':')[0] ?? '1'
			const widget = feedback.options.widget?.toString().split(':')[1] ?? '0'
			let widgetSelection: {widgetKey: string, multiviewerKey: string}[] = []
			if (state.syncSelection) {
				widgetSelection = [...state.get('REMOTE/live/multiviewers/widgetSelection/widgetIds')]
			} else {
				widgetSelection = state.get('LOCAL/widgetSelection/widgetIds')
			}
			return JSON.stringify(widgetSelection).includes(`{"widgetKey":"${widget}","multiviewerKey":"${mvw}"}`)
		},
	}

	// MARK: deviceInputFreeze
	feedbacks['deviceInputFreeze'] = {
		type: 'boolean',
		name: 'Input Freeze',
		description: 'Shows wether an input currently is frozen',
		defaultStyle: {
			color: config.color_bright,
			bgcolor: combineRgb(0, 0, 100),
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
		callback: (feedback: CompanionFeedbackBooleanEvent & { options: { input: string } }) => {
			if (!state.platform.startsWith('livepremier') && state.platform !== 'midra') return false // we are not connected
			const input = feedback.options.input?.toString().replace('LIVE', 'IN') || ''
			const freeze = state.get('DEVICE/device/inputList/items/' + input + '/control/pp/freeze')
			if (freeze) {
				instance.setVariableValues({ ['frozen_' + input]: '*'})
			} else {
				instance.setVariableValues({ ['frozen_' + input]: ' '})
			}
			return freeze
		},
	}

	// MARK: deviceLayerFreeze
	if (state.platform === 'midra') feedbacks['deviceLayerFreeze'] = {
		type: 'boolean',
		name: 'Layer Freeze',
		description: 'Shows wether a layer currently is frozen',
		defaultStyle: {
			color: config.color_bright,
			bgcolor: combineRgb(0, 0, 100),
			png64:
				'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3AQMAAACSFUAFAAABS2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxMzggNzkuMTU5ODI0LCAyMDE2LzA5LzE0LTAxOjA5OjAxICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+IEmuOgAAAARnQU1BAACxjwv8YQUAAAABc1JHQgCuzhzpAAAABlBMVEUAAABfXKLsUQDeAAAAAXRSTlMAQObYZgAAAM9JREFUGNONkTEOwjAMRX9UpDC1nIBwEKRyJCMGmNogDsCRyMY1wg26ESTUYLc1sEGWp1h2/vcPABDG84MrWoxXOgxcUycol7tbEFb748Aim4HmKZyXSCZsUFpQwQ1OeIqorsxzQHFnXgCTmT3PtczErD1ZEXCBXJR6RzXXzSNR3wA2NrvkPCpf52gDZnDZw3Oj7Ue/xfObM9gMSL/LgfttbHPH8+bRb+U9tIla0XVx1FP9yY/6U7/qX/fR/XRf3f+Th+Yz5aX5vfPUfP/6jxdhImTMvNrBOgAAAABJRU5ErkJggg==',
		},
		options: [
			{
				id: 'screen',
				type: 'dropdown',
				label: 'Screen',
				choices: [{id: 'any', label:'Any'}, ...getScreenChoices(state)],
				default: getScreenChoices(state)[0]?.id,
			},
			...[{id:'any'}, ...getScreensArray(state)].map((screen) => {
				// eslint-disable-next-line @typescript-eslint/ban-types
				let visFn = (_arg0: any): boolean => {
					return true
				}
				// make the code more injection proof
				if (screen.id === 'any' || screen.id.match(/^S\d{1,3}$/)) {
					// eslint-disable-next-line @typescript-eslint/no-implied-eval
					visFn = new Function(
						'thisOptions',
						`return thisOptions.screen === '${screen.id}'`
					) as (arg0: any) => boolean
				}
				const opt = {
					id: `layer${screen.id}`,
					type: 'dropdown',
					label: 'Layer',
					choices: [
						{id:'any', label: 'Any'},
						{id:'NATIVE', label: 'Background Layer'}
					],
					default: '1',
					isVisible: visFn,
				}
				if (screen.id === 'any') {
					opt.choices.push(...getLayerChoices(state, 8, false))
				} else {
					opt.label += ' ' + screen.id
					opt.choices.push(...getLayerChoices(state, screen.id, false))
				}
				return opt
			}),
		],
		callback: (feedback: CompanionFeedbackBooleanEvent & { options: { screen: string } }) => {
			if (state.platform !== 'midra') return false // we are not connected
			//const screen = feedback.options.screen.substring(1)
			let retval = false
			let screens: Choicemeta[]
			if (feedback.options.screen === 'any') {
				screens = getScreensArray(state)
			} else {
				screens = [{id: feedback.options.screen, label: feedback.options.screen}]
			}
			const layeropt = feedback.options[`layer${feedback.options.screen}`] as string
			for (const screen of screens) {
				let layers: string[]
				if (layeropt === 'any') {
					layers = getLayersAsArray(state, screen.id, false)
				} else {
					layers = [layeropt]
				}
				for (const layer of layers) {
					const screenNum = screen.id.substring(1)
					let path: string[]
					if (layer === 'NATIVE') {
						path = ['DEVICE', 'device', 'screenList', 'items', screenNum, 'background', 'control', 'pp', 'freeze']
					} else {
						path = ['DEVICE', 'device', 'screenList', 'items', screenNum, 'liveLayerList', 'items', layer, 'control', 'pp', 'freeze']
					}
					if (state.getUnmapped(path)) retval = true
				}
			}
			return retval
			
		},
	}

	// MARK: deviceScreenFreeze
	if (state.platform === 'midra') feedbacks['deviceScreenFreeze'] = {
		type: 'boolean',
		name: 'Screen Freeze',
		description: 'Shows wether a screen currently is frozen',
		defaultStyle: {
			color: config.color_bright,
			bgcolor: combineRgb(0, 0, 100),
			png64:
				'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3AQMAAACSFUAFAAABS2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxMzggNzkuMTU5ODI0LCAyMDE2LzA5LzE0LTAxOjA5OjAxICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+IEmuOgAAAARnQU1BAACxjwv8YQUAAAABc1JHQgCuzhzpAAAABlBMVEUAAABfXKLsUQDeAAAAAXRSTlMAQObYZgAAAM9JREFUGNONkTEOwjAMRX9UpDC1nIBwEKRyJCMGmNogDsCRyMY1wg26ESTUYLc1sEGWp1h2/vcPABDG84MrWoxXOgxcUycol7tbEFb748Aim4HmKZyXSCZsUFpQwQ1OeIqorsxzQHFnXgCTmT3PtczErD1ZEXCBXJR6RzXXzSNR3wA2NrvkPCpf52gDZnDZw3Oj7Ue/xfObM9gMSL/LgfttbHPH8+bRb+U9tIla0XVx1FP9yY/6U7/qX/fR/XRf3f+Th+Yz5aX5vfPUfP/6jxdhImTMvNrBOgAAAABJRU5ErkJggg==',
		},
		options: [
			{
				id: 'screen',
				type: 'dropdown',
				label: 'Screen',
				choices: [{id: 'any', label:'Any'}, ...getScreenAuxChoices(state)],
				default: getScreenAuxChoices(state)[0]?.id,
			}
		],
		callback: (feedback: CompanionFeedbackBooleanEvent & { options: { screen: string } }) => {
			if (state.platform !== 'midra') return false // we are not connected
			//const screen = feedback.options.screen.substring(1)
			let retval = false
			let screens: Choicemeta[]
			if (feedback.options.screen === 'any') {
				screens = getScreensAuxArray(state)
			} else {
				screens = [{id: feedback.options.screen, label: feedback.options.screen}]
			}
			for (const screen of screens) {
				const path = ['DEVICE', 'device', 'screenList', 'items', screen.id, 'control', 'pp', 'freeze']
				if (state.get(path)) retval = true
			}
			return retval
		},
	}

	// MARK: timerState
	feedbacks['timerState'] = {
		type: 'boolean',
		name: 'Timer State',
		description: 'Shows wether a timer is currently stopped or running',
		defaultStyle: {
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
		callback: (feedback: CompanionFeedbackBooleanEvent & { options: { timer: string, state: string } }) => {
			if (!state.platform.startsWith('livepremier') && state.platform !== 'midra') return false // we are not connected
			return (
				state.get('DEVICE/device/timerList/items/' + feedback.options.timer + '/status/pp/state') ===
				feedback.options.state
			)
		},
	}

	// MARK: deviceGpioOut
	if (state.platform.startsWith('livepremier')) feedbacks['deviceGpioOut'] = {
		type: 'boolean',
		name: 'GPO State',
		description: 'Shows wether a general purpose output is currently active',
		defaultStyle: {
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
		callback: (feedback: CompanionFeedbackBooleanEvent & { options: { gpo: number, state: number } }) => {
			if (!state.platform.startsWith('livepremier') && state.platform !== 'midra') return false // we are not connected
			const val = feedback.options.state === 1 ? true : false
			return (
				state.get([
					'DEVICE',
					'device',
					'gpio',
					'gpoList',
					'items',
					feedback.options.gpo?.toString() || '1',
					'status',
					'pp',
					'state',
				]) === val
			)
		},
	}

	// MARK: deviceGpioIn
	if (state.platform.startsWith('livepremier')) feedbacks['deviceGpioIn'] = {
		type: 'boolean',
		name: 'GPI State',
		description: 'Shows wether a general purpose input is currently active',
		defaultStyle: {
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
		callback: (feedback: CompanionFeedbackBooleanEvent & { options: { gpi: number, state: number } }) => {
			if (!state.platform.startsWith('livepremier') && state.platform !== 'midra') return false // we are not connected
			const val = feedback.options.state === 1 ? true : false
			return (
				state.get([
					'DEVICE',
					'device',
					'gpio',
					'gpiList',
					'items',
					feedback.options.gpo?.toString() || '1',
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
		name: 'Stream Runnning State',
		description: 'Shows status of streaming',
		defaultStyle: {
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
		callback: (feedback: CompanionFeedbackBooleanEvent & { options: { state: string } }) => {
			if (!state.platform.startsWith('livepremier') && state.platform !== 'midra') return false // we are not connected
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
	type FeedbackDeviceCustomOptions = {
			path: string,
			valuetype: string,
			actionst: string,
			textValue: string,
			actionsn: string,
			numericValue: number,
			numericValue2: number,
			invert: boolean,
			variable: string
	}
	feedbacks['deviceCustom'] = {
		type: 'boolean',
		name: 'Custom Feedback',
		description: 'Generates feedback and a variable from a custom AWJ path',
		options: [
			{
				type: 'textinput',
				id: 'path',
				label: 'path',
				default: '',
				regex: `/${regexAWJpath}/`,
				tooltip: 'AWJ path of property to watch for, enter a path to exactly one property with no wildcards.\nPGM/PVW can be used for the presets and will be replaced dynamically.'
			},
			{
				type: 'dropdown',
				id: 'valuetype',
				label: 'Evaluate value as type',
				choices: [
					{ id: 't', label: 'Text' },
					{ id: 'n', label: 'Number' },
					{ id: 'b', label: 'Boolean' },
					{ id: 'o', label: 'Object' },
				],
				default: 't',
			},
			{
				type: 'dropdown',
				id: 'actionst',
				label: 'Check',
				choices: [
					{ id: '1', label: 'Text equals' },
					{ id: '2', label: 'Text containes' },
					{ id: '3', label: 'Text length is' },
					{ id: '4', label: 'Text matches regular expression' },
				],
				default: '1',
				isVisible: (thisOptions: FeedbackDeviceCustomOptions) => { return thisOptions.valuetype === 't' },
			},
			{
				type: 'textinput',
				id: 'textValue',
				label: 'value',
				default: '',
				isVisible: (thisOptions: FeedbackDeviceCustomOptions) => { return thisOptions.valuetype === 't' },
			},
			{
				type: 'dropdown',
				id: 'actionsn',
				label: 'Check',
				choices: [
					{ id: '==', label: 'Number equals' },
					{ id: '>', label: 'Number is greater than' },
					{ id: '...', label: 'Number is in range between value and value2' },
					{ id: '%', label: 'Number modulo value is value2' },
				],
				default: '==',
				isVisible: (thisOptions: FeedbackDeviceCustomOptions) => { return thisOptions.valuetype === 'n' },
			},
			{
				type: 'number',
				id: 'numericValue',
				label: 'value1',
				default: 0,
				isVisible: (thisOptions: FeedbackDeviceCustomOptions) => { return thisOptions.valuetype === 'n' },
			},
			{
				type: 'number',
				id: 'numericValue2',
				label: 'value 2',
				default: 0,
				isVisible: (thisOptions: FeedbackDeviceCustomOptions) => { return thisOptions.valuetype === 'n' && (thisOptions.actionsn === '...' || thisOptions.actionsn === '%') },
			},
			{
				type: 'checkbox',
				id: 'invert',
				label: 'Invert feedback result',
				default: false,
			},
			{
				type: 'textinput',
				id: 'variable',
				label: 'Custom Name of Variable to use',
				default: '',
				regex: '/^[A-Za-z0-9_-]*$/',
				tooltip: 'Can be left empty, if filled this will be the name of the variable with the value of the feedback.\nOnly letters, numbers, underscore and minus is allowed.'
			}
		],
		learn: (feedback: CompanionFeedbackBooleanEvent & { options: FeedbackDeviceCustomOptions }) => {
			const newoptions = {
			}
			const lastMsg = state.get('LOCAL/lastMsg')
			const path = lastMsg.path
			const value = lastMsg.value
			if (JSON.stringify(value).length > 132) {
				return undefined
			}
			newoptions['path'] = instance.jsonToAWJpath(path)
			switch (typeof value) {
				case 'string':
					newoptions['valuetype'] = 't'
					newoptions['actionst'] = '1'
					newoptions['textValue'] = value
					break
				case 'number':
					newoptions['valuetype'] = 'n'
					newoptions['actionsn'] = '=='
					newoptions['numericValue'] = value
					break
				case 'boolean':
					newoptions['valuetype'] = 'b'
					break
				case 'object':
					newoptions['valuetype'] = 'o'
			}

			return {
				...feedback.options,
				...newoptions,
			}
		},
		callback: (feedback: CompanionFeedbackBooleanEvent & { options: FeedbackDeviceCustomOptions }) => {
			if (!state.platform.startsWith('livepremier') && state.platform !== 'midra') return false // we are not connected
			let ret = false
			const path = instance.AWJtoJsonPath(feedback.options.path)
			if (path.length < 2) {
				return false
			}
			const value = instance.state.get(['DEVICE', ...path])
			let varId = feedback.options.variable.replace(/[^A-Za-z0-9_-]/g, '')
			if (varId === '') varId = feedback.options.path.replace(/\//g, '_').replace(/[^A-Za-z0-9_-]/g, '')

			if (value === undefined) {
				instance.setVariableValues({ [varId]: undefined })
			} else if (value === null) {
				instance.setVariableValues({ [varId]: 'null' })
			} else if (feedback.options.valuetype === 't') {
				const valuet: string = (typeof value === 'string') ? value : JSON.stringify(value)
				instance.setVariableValues({ [varId]: valuet })
				switch (feedback.options.actionst) {
					case '1':
						ret = (valuet === feedback.options.textValue)
						break
				
					case '2':
						ret = valuet.includes(feedback.options.textValue)
						break
				
					case '3':
						ret = (valuet.length === parseInt(feedback.options.textValue))
						break
				
					case '4':
						ret = valuet.match(new RegExp(feedback.options.textValue)) !== null
						break
				
					default:
						break
				}
			} else if (feedback.options.valuetype === 'n') {
				const valuen = Number(value)
				instance.setVariableValues({ [varId]: valuen })
				switch (feedback.options.actionsn) {
					case '==':
						ret = (valuen === feedback.options.numericValue)
						break
				
					case '>':
						ret = (valuen > feedback.options.numericValue)
						break
				
					case '...':
						if (feedback.options.numericValue2 > feedback.options.numericValue)
							ret = (valuen >= feedback.options.numericValue && valuen <= feedback.options.numericValue2)
						else
							ret = (valuen >= feedback.options.numericValue2 && valuen <= feedback.options.numericValue)
						break

					case '%':
						ret = (valuen % feedback.options.numericValue === feedback.options.numericValue2)
						break
				
					default:
						break
				}
			} else if (feedback.options.valuetype === 'b') {
				if (typeof value === 'boolean') {
					ret = value
				} else if (typeof value === 'number') {
					ret = value >= 0.5 ? true : false
				} else if (typeof value === 'string') {
					ret = value.match(/^y(es)?|true|1|go|\+|right|correct|ok(ay)?$/i) !== null
				}
				const bool = feedback.options.invert ? !ret : ret
				instance.setVariableValues({ [varId]: bool ? 1 : 0 })
			} else if (feedback.options.valuetype === 'o') { 
				const valueo = JSON.stringify(value)
				instance.setVariableValues({ [varId]: valueo })
				ret = valueo.length > 0
			}
			return feedback.options.invert ? !ret : ret
		},
		subscribe: (feedback: CompanionFeedbackBooleanEvent & { options: FeedbackDeviceCustomOptions }) => {
			// console.log('subscribe', feedback.id, feedback.options.path);
			let varId = ''
			const sub = {}
			let varname = `Custom Variable for Path ${feedback.options.path}`
			if (feedback.options.path.match(regexAWJpath) !== null) {
				// we got a path to work with
				varname = `Custom Variable for Feedback ${feedback.options.path}`
				if (feedback.options.variable.match(/[A-Za-z0-9_-]+/) !== null) {
					varId = feedback.options.variable.replace(/[^A-Za-z0-9_-]/g, '')
				} else {
					varId = feedback.options.path.replace(/\//g, '_').replace(/[^A-Za-z0-9_-]/g, '')
				}
				const parts = instance.AWJtoJsonPath(feedback.options.path)

				if (
					parts[4] === 'presetList' &&
					parts[5] === 'items' &&
					parts[6] &&
					feedback.options.path.split('/')[6]?.match(/^PGM|PVW|program|preview$/i) !== null
				) {
					parts[6] = '(\\w+?)'
					sub[`${feedback.id}-take`] = {
						pat: 'DEVICE/device/(screenGroup|transition/screen)List/items/(\\w+?)/status/pp/transition',
						fbk: `id:${feedback.id}`,
					}
				}

				sub[feedback.id] = {
					pat: parts.join('/'),
					fbk: `id:${feedback.id}`
				}
				// console.log('add sub', sub)
				instance.addSubscriptions(sub)
				// console.log('subscriptions', Object.keys(state.subscriptions).map(key => `${key} : ${state.subscriptions[key].pat}`))

			} else {
				// we got no valid path
				varname = `Custom Variable for Feedback ${feedback.id}`
				if (feedback.options.variable !== '') {
					varId = feedback.options.variable
				} else {
					varId = feedback.id
				}
			}
			instance.addVariable({
				id: feedback.id,
				variableId: varId,
				name: varname,
			})
		},
		unsubscribe: (feedback: CompanionFeedbackBooleanEvent & FeedbackDeviceCustomOptions) => {
			instance.removeSubscription(feedback.id)
			instance.removeSubscription(feedback.id + '-take')
			instance.removeVariable(feedback.id)
		}
	}

	return feedbacks
}
