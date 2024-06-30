import {AWJinstance} from '../index.js'

import {
	choicesBackgroundSourcesPlusNone,
	choicesPreset,
	getAudioInputChoices,
	getAudioOutputChoices,
	getAuxSourceChoices,
	getLayerChoices,
	getLayerMemoryChoices,
	getLiveInputChoices,
	getMasterMemoryChoices,
	getMultiviewerArray,
	getMultiviewerChoices,
	getMultiviewerMemoryChoices,
	getOutputChoices,
	getScreenAuxChoices,
	getScreenMemoryChoices,
	getScreensAuxArray,
	getSourceChoices,
	getTimerChoices,
	getWidgetChoices,
	getWidgetSourceChoices,
} from './livepremierChoices.js'
import {
	CompanionActionEvent,
	DropdownChoice,
	DropdownChoiceId,
	SomeCompanionActionInputField,
	splitRgb,
} from '@companion-module/base'
import { Config } from '../config.js'
import { compileExpression } from '@nx-js/compiler-util'
import { AWJconnection } from '../connection.js'
import { AWJdevice } from '../awjdevice/awjdevice.js'

/**
 * T = Object like {option1id: type, option2id: type}
 */
type AWJaction<T> = {
	name: string
	description?: string
	tooltip?: string,
	options: SomeAWJactionInputfield<T>[]
	callback?: (action: ActionEvent<T>) => void
	subscribe?: (action: ActionEvent<T>) => void
	unsubscribe?: (action: ActionEvent<T>) => void
	learn?: (
		action: ActionEvent<T>
	) => AWJoptionValues<T> | undefined | Promise<AWJoptionValues<T> | undefined>
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

type SomeAWJactionInputfield<T> = { isVisible?: ((options: AWJoptionValues<T>) => boolean) }
	& DistributiveOmit<SomeCompanionActionInputField, 'isVisible'>

type ActionEvent<T> = Omit<CompanionActionEvent, 'options'> & {
	options: AWJoptionValues<T>
}

type AWJoptionValues<T> = T
type AWJoptionValuesExtended<T> = T

// const XUPDATE = '{"channel":"DEVICE","data":{"path":"device/screenGroupList/control/pp/xUpdate","value":true}}'
// const XUPDATEmidra = '{"channel":"DEVICE","data":{"path":"device/preset/control/pp/xUpdate","value":true}}'


// MARK: getActions
/**
 * Return the object with all companion actions for the instance
 * @param instance reference to the instance itself
 * @returns action object
 */
export function getActions(instance: AWJinstance): any {
	const state: AWJdevice = instance.device
	const connection: AWJconnection = instance.connection
	const device: AWJdevice = instance.device
	const config: Config = instance.config
	const actions: {[id: string]: AWJaction<any> | undefined} = {}
	const screens = getScreensAuxArray(state)

	/**
	 *  MARK: Recall Screen Memory
	 */
	type DeviceScreenAuxMemory = { screens: string[], preset: string, memory: string, selectScreens: boolean}
	actions['deviceScreenMemory'] = {
		name: 'Recall Screen Memory',
		options: [
			{
				id: 'screens',
				type: 'multidropdown',
				label: 'Screen',
				choices: [{ id: 'sel', label: 'Selected' }, ...getScreenAuxChoices(state)],
				default: ['sel'],
			},
			{
				id: 'preset',
				type: 'dropdown',
				label: 'Preset',
				choices: [{ id: 'sel', label: 'Selected' }, ...choicesPreset],
				default: 'sel',
			},
			{
				id: 'memory',
				type: 'dropdown',
				label: 'Screen Memory',
				choices: getScreenMemoryChoices(state),
				default: getScreenMemoryChoices(state)[0]?.id,
			},
			{
				id: 'selectScreens',
				type: 'checkbox',
				label: 'Select screens after load',
				default: true,
			},
		],
		callback: (action) => {
			const screens = choices.getChosenScreenAuxes(action.options.screens)
			const preset = choices.getPresetSelection(action.options.preset, true)
			for (const screen of screens) {
				if (choices.isLocked(screen, preset)) continue
				connection.sendWSmessage(
					[
						'device',
						'presetBank',
						'control',
						'load',
						'slotList',
						'items',
						action.options.memory,
						'screenList',
						'items',
						screen,
						'presetList',
						'items',
						preset,
						'pp',
						'xRequest',
					],
					false
				)
				connection.sendWSmessage(
					[
						'device',
						'presetBank',
						'control',
						'load',
						'slotList',
						'items',
						action.options.memory,
						'screenList',
						'items',
						screen,
						'presetList',
						'items',
						preset,
						'pp',
						'xRequest',
					],
					true
				)

				device.sendXupdate()

				if (action.options.selectScreens) {
					if (state.syncSelection) {
						connection.sendRawWSmessage(
							`{"channel":"REMOTE","data":{"name":"replace","path":"/live/screens/screenAuxSelection","args":[${JSON.stringify(
								screens
							)}]}}`
						)
					} else {
						state.set('LOCAL/screenAuxSelection/keys', screens)
						instance.checkFeedbacks('liveScreenSelection')
					}
				}
			}
		},
	} as AWJaction<DeviceScreenAuxMemory>

	/**
	 * MARK: Recall Master Memory
	 */
	type DeviceMasterMemory = {preset: string, memory: string, selectScreens: boolean}
	actions['deviceMasterMemory'] = {
		name: 'Recall Master Memory',
		options: [
			{
				id: 'preset',
				type: 'dropdown',
				label: 'Preset',
				choices: [{ id: 'sel', label: 'Selected' }, ...choicesPreset],
				default: 'sel',
			},
			{
				id: 'memory',
				type: 'dropdown',
				label: 'Master Memory',
				choices: getMasterMemoryChoices(state),
				default: getMasterMemoryChoices(state)[0]?.id,
			},
			{
				id: 'selectScreens',
				type: 'checkbox',
				label: 'Select screens after load',
				default: true,
			},
		],
		callback: (action) => {
			const preset = choices.getPresetSelection(action.options.preset, true)
			const filterpath = state.getUnmapped(['DEVICE', 'device', 'masterPresetBank', 'bankList', 'items', action.options.memory, 'status', 'pp', 'isShadow'])
				? ['status', 'shadow', 'pp']
				: ['status', 'pp']
			const screens = state.getUnmapped([
				'DEVICE', 'device', 'masterPresetBank',
				'bankList','items', action.options.memory,
				...filterpath, 'screenFilter',
			])
			
			if (
				screens.find((screen: string) => {
					return choices.isLocked(screen, preset)
				})
			) {
				return // TODO: resembles original WebRCS behavior, but could be also individual screen handling
			}

			const fullpath = [
					'device', 'masterPresetBank',
					'control', 'load',
					'slotList', 'items', action.options.memory,
					'presetList', 'items', preset,
					'pp', 'xRequest',
				]
			connection.sendWSmessage(fullpath, false)

			if (action.options.selectScreens) {
				if (state.syncSelection) {
					connection.sendWSdata('REMOTE', 'replace', 'live/screens/screenAuxSelection', [screens])
				} else {
					state.set('LOCAL/screenAuxSelection/keys', screens)
					instance.checkFeedbacks('liveScreenSelection')
				}
			}

			connection.sendWSmessage(fullpath, true)

			device.sendXupdate()

		},
	} as AWJaction<DeviceMasterMemory>

	/**
	 * MARK: Recall Layer Memory
	 */
	type DeviceLayerMemory = { method: string, screen: string[], preset: string, layer: string[], memory: string }
	actions['deviceLayerMemory'] = {
		name: 'Recall Layer Memory',
		options: [
			{
				id: 'method',
				type: 'dropdown',
				label: 'Method',
				choices: [
					{ id: 'spec', label: 'Use Specified Layer' },
					{ id: 'sel', label: 'Use Selected Layer' },
				],
				default: 'spec',
			},
			{
				id: 'screen',
				type: 'multidropdown',
				label: 'Screen / Aux',
				choices: getScreenAuxChoices(state),
				default: [getScreenAuxChoices(state)[0]?.id],
				isVisible: (options) => {
					return options.method === 'spec'
				},
			},
			{
				id: 'preset',
				type: 'dropdown',
				label: 'Preset',
				choices: [{ id: 'sel', label: 'Selected' }, ...choicesPreset],
				default: 'pvw',
				isVisible: (options) => {
					return options.method === 'spec'
				},
			},
			{
				id: 'layer',
				type: 'multidropdown',
				label: 'Layer',
				choices: getLayerChoices(state, 48, true),
				default: ['1'],
				isVisible: (options) => {
					return options.method === 'spec'
				},
			},
			{
				id: 'memory',
				type: 'dropdown',
				label: 'Layer Memory',
				choices: getLayerMemoryChoices(state),
				default: getLayerMemoryChoices(state)[0]?.id,
			},
		],
		callback: (action) => {
			let layers: { screenAuxKey: string; layerKey: string }[] = []
			let preset: string
			if (action.options.method === 'sel') {
				layers = choices.getSelectedLayers() ?? []
				preset = choices.getPresetSelection('sel', true)
			} else {
				for (const screen of action.options.screen) {
					for (const layer of action.options.layer) {
						layers.push({ screenAuxKey: screen, layerKey: layer })
					}
				}
				preset = choices.getPresetSelection(action.options.preset, true)
			}
			for (const layer of layers) {
				if (choices.isLocked(layer.screenAuxKey, preset)) continue
				const fullpath = [
						'device', 'layerBank',
						'control', 'load',
						'slotList', 'items', action.options.memory,
						'screenList', 'items', layer.screenAuxKey,
						'presetList', 'items', preset,
						'layerList', 'items', layer.layerKey,
						'pp', 'xRequest',
					]
				connection.sendWSmessage(fullpath, false)
				connection.sendWSmessage(fullpath, true)
			}
			device.sendXupdate()
		},
	} as AWJaction<DeviceLayerMemory>

	/**
	 * MARK: Recall Multiviewer Memory
	 */
	type DeviceMultiviewerMemory = {memory: string, multiviewer: string[]}
	actions['deviceMultiviewerMemory'] = {
		name: 'Recall Multiviewer Memory',
		options: [
			{
				id: 'memory',
				type: 'dropdown',
				label: 'Memory',
				choices: getMultiviewerMemoryChoices(state),
				default: getMultiviewerMemoryChoices(state)[0]?.id,
			},
			{
				id: 'multiviewer',
				type: 'multidropdown',
				label: 'Multiviewer',
				choices: getMultiviewerChoices(state),
				default: [getMultiviewerArray(state)?.[0]],
				isVisible: (_options, data = getMultiviewerArray(state).length > 1) => { return data} // don't show this option if there is only one multiviewer
			},
		],
		callback: (action) => {
			for (const mv of action.options.multiviewer) {
				const fullpath = [
						'device', 'monitoringBank',
						'control', 'load',
						'slotList', 'items', action.options.memory,
						'outputList', 'items', mv,
						'pp', 'xRequest',
					]
				connection.sendWSmessage(fullpath, false)
				connection.sendWSmessage(fullpath, true)
			}
		},
	} as AWJaction<DeviceMultiviewerMemory>

	/**
	 * MARK: Take one or multiple screens
	 */
	type DeviceTakeScreen = {screens: string[]}
	actions['deviceTakeScreen'] = {
		name: 'Take Screen',
		options: [
			{
				id: 'screens',
				type: 'multidropdown',
				label: 'Screens / Auxscreens',
				choices: [
					{ id: 'all', label: 'All' },
					{ id: 'sel', label: 'Selected Screens' },
					...getScreenAuxChoices(state)
				],
				default: ['sel'],
			},
		],
		callback: (action) => {
			let dir = 'xTake'
			for (const screen of choices.getChosenScreenAuxes(action.options.screens)) {
				if (state.platform.startsWith('livepremier')) {
					dir = 'xTakeUp'
					if (choices.getPreset(screen, 'pgm') === 'B') {
						dir = 'xTakeDown'
					}
				}
				connection.sendWSmessage(['device', 'screenGroupList', 'items', screen, 'control', 'pp', dir], true)
			}
		},
	} as AWJaction<DeviceTakeScreen>

	/**
	 * MARK: Cut one or multiple screens
	 */
	type DeviceCutScreen = {screens: string[]}
	actions['deviceCutScreen'] = {
		name: 'Cut Screen',
		options: [
			{
				id: 'screens',
				type: 'multidropdown',
				label: 'Screens / Auxscreens',
				choices: [
					{ id: 'all', label: 'All' },
					{ id: 'sel', label: 'Selected Screens' },
					...getScreenAuxChoices(state)
				],
				default: ['sel'],
			},
		],
		callback: (action: any) => {
			for (const screen of choices.getChosenScreenAuxes(action.options.screens)) {
				connection.sendWSmessage(['device', 'screenGroupList', 'items', screen, 'control', 'pp', 'xCut'], true)
			}
		},
	} as AWJaction<DeviceCutScreen>

	/**
	 * MARK: Set T-Bar Position
	 */
	type DeviceTbar = {screens: string[], position: string, maximum: string}
	actions['deviceTbar'] = {
		name: 'Set T-Bar Position',
		options: [
			{
				id: 'info',
				type: 'static-text',
				label: 'Beware: in WebRCS you always set the T-Bar Position for ALL screens. T-Bar position is never syncronized.'
			},
			{
				id: 'screens',
				type: 'multidropdown',
				label: 'Screens / Auxscreens',
				choices: [
					{ id: 'all', label: 'All' },
					{ id: 'sel', label: 'Selected Screens' },
					...getScreenAuxChoices(state)
				],
				default: ['all'],
			},
			{
				id: 'position',
				type: 'textinput',
				label: 'Position',
				default: '0',
				regex: '^\\d+(\\.\\d+)?$|^\\$\\(\\w+:\\w+\\)$',
				useVariables: true,
				tooltip: 'Enter position as a numeric string. Can be floating point or integer number. Variables can be used. 100% is in relation to maximum value.'
			},
			{
				id: 'maximum',
				type: 'textinput',
				label: 'Maximum value',
				default: '100',
				regex: '^\\d+(\\.\\d+)?$|^\\$\\(\\w+:\\w+\\)$',
				useVariables: true,
				tooltip: 'Enter maximum as a numeric string. Can be floating point or integer number. Variables can be used.'
			}
		],
		callback: async (action: any) => {
			const position = parseFloat(await instance.parseVariablesInString(action.options.position))
			const maximum = parseFloat(await instance.parseVariablesInString(action.options.maximum))
			const tbarmax = 65535
			if (typeof position === 'number' && typeof maximum === 'number' && position >= 0 && maximum >= 0) {
				let value = 0.0
				if (position >= maximum) {
					value = 1.0
				} else if (maximum > 0) {
					value = position / maximum
				}
				const tbarint = Math.round(value * tbarmax)
				for (const screen of choices.getChosenScreenAuxes(action.options.screens)) {
					connection.sendWSmessage(['device', 'screenGroupList', 'items', screen, 'control', 'pp', 'tbarPosition'], tbarint)
				}
			}
		},
	} as AWJaction<DeviceTbar>


	/**
	 * MARK: Change the transition time of a preset per screen
	 */
	type DeviceTakeTime = {screens: string[], preset: string, time: number}
	 actions['deviceTakeTime'] = {
		name: 'Set Transition Time',
		options: [
			{
				id: 'screens',
				type: 'multidropdown',
				label: 'Screens / Auxscreens',
				choices: [
					{ id: 'all', label: 'All' },
					{ id: 'sel', label: 'Selected Screens' },
					...getScreenAuxChoices(state)
				],
				default: ['all'],
			},
			{
				id: 'preset',
				type: 'dropdown',
				label: 'Preset',
				choices: [
					{ id: 'all', label: 'Both' }, 
					...choicesPreset
				],
				default: 'all',
			},
			{
				id: 'time',
				type: 'number',
				label: 'Time (seconds)',
				min: 0,
				max: 300,
				step: 0.1,
				default: 1,
				range: true,
			},
		],
		callback: (action) => {
			const time = action.options.time as number * 10
			choices.getChosenScreenAuxes(action.options.screens).forEach((screen) => {
				const presetPgm = choices.getPreset(screen, 'PGM')
				if (
					action.options.preset === 'all' ||
					(action.options.preset === 'pgm' && presetPgm === 'A') ||
					(action.options.preset === 'pvw' && presetPgm === 'B')
				) {
					connection.sendWSmessage(['device', 'screenGroupList', 'items', screen, 'control', 'pp', 'takeDownTime'], time)
				}
				if (
					action.options.preset === 'all' ||
					(action.options.preset === 'pvw' && presetPgm === 'A') ||
					(action.options.preset === 'pgm' && presetPgm === 'B')
				) {
					connection.sendWSmessage(['device', 'screenGroupList', 'items', screen, 'control', 'pp', 'takeUpTime'], time)
				}
			})
		},
	} as AWJaction<DeviceTakeTime>

	/**
	 * MARK: Select the source in a layer
	 */
	type DeviceSelectSource = {method: string, screen: string[], preset: string}
	actions['deviceSelectSource'] = {
		name: 'Select Layer Source',
		options: [
			{
				id: 'method',
				type: 'dropdown',
				label: 'Method',
				choices: [
					{ id: 'spec', label: 'Target specified layers' },
					{ id: 'sel', label: 'Target selected layers' },
				],
				default: 'spec',
			},
			{
				id: 'screen',
				type: 'multidropdown',
				label: 'Screen / Aux',
				choices: getScreenAuxChoices(state),
				default: [getScreenAuxChoices(state)[0]?.id],
				isVisible: (options: AWJoptionValuesExtended<DeviceSelectSource>) => {
					return options.method === 'spec'
				},
			},
			{
				id: 'preset',
				type: 'dropdown',
				label: 'Preset',
				choices: choicesPreset,
				default: 'pvw',
				isVisible: (options:  AWJoptionValuesExtended<DeviceSelectSource>) => {
					return options.method === 'spec'
				},
			},
			...screens.map((screen) => {
				const isScreen = screen.id.startsWith('S')
				return{
					id: `layer${screen.id}`,
					type: 'multidropdown',
					label: 'Layer ' + screen.id,
					choices: getLayerChoices(state, screen.id, isScreen),
					default: ['1'],
					isVisible: (options: AWJoptionValuesExtended<DeviceSelectSource>, screenId = screen.id) => {return options.screen.includes(screenId)},
				}
			}),
			{
				id: 'sourceLayer',
				type: 'dropdown',
				label: 'Screen Layer Source',
				choices: [{ id: 'keep', label: "Don't change source"}, ...getSourceChoices(state)],
				default: 'keep',
				isVisible: (options:  AWJoptionValuesExtended<DeviceSelectSource>) => {
					if (options.method === 'sel') return true
					if (options.method === 'spec') {
						for (const screen of options.screen.filter((screen) => screen.startsWith('S'))) {
							if (options[`layer${screen}`].find((elem: string) => elem.match(/^\d+$/))) return true
						}
					}
					return false
				},
			},
			{
				id: 'sourceNative',
				type: 'dropdown',
				label: 'Screen Background Source',
				choices: [{ id: 'keep', label: "Don't change source"}, ...choicesBackgroundSourcesPlusNone],
				default: 'keep',
				isVisible: (options:  AWJoptionValuesExtended<DeviceSelectSource>) => {
					if (options.method === 'sel') return true
					if (options.method === 'spec') {
						for (const screen of options.screen.filter((screen) => screen.startsWith('S'))) {
							if (options[`layer${screen}`].find((elem: string) => elem === 'NATIVE')) return true
						}
					}
					return false
				},
			},
			{
				id: 'sourceBack',
				type: 'dropdown',
				label: 'Aux Layer Source',
				choices: [{ id: 'keep', label: "Don't change source"}, ...getAuxSourceChoices(state)],
				default: 'keep',
				isVisible: (options:  AWJoptionValuesExtended<DeviceSelectSource>) => {
					if (options.method === 'sel') return true
					if (options.method === 'spec') {
						for (const screen of options.screen.filter((screen) => screen.startsWith('A'))) {
							if (options[`layer${screen}`].find((elem: string) => elem.match(/^\d+$/))) return true
						}
					}
					return false
				},
			},
		],
		callback: (action) => {
			if (action.options.method === 'spec') {
				for (const screen of action.options.screen) {
					if (choices.isLocked(screen, action.options.preset)) continue
					for (const layer of action.options[`layer${screen}`]) {
						let sourcetype = 'sourceLayer'
						if (screen.startsWith('A')) {
							sourcetype = 'sourceBack'
						}
						if (layer === 'NATIVE') {
							sourcetype = 'sourceNative'
						}
						connection.sendWSmessage([
							'device', 'screenList', 'items', screen,
							'presetList', 'items', choices.getPreset(screen, action.options.preset),
							'layerList', 'items', layer,
							'source', 'pp', 'inputNum'
						], action.options[sourcetype])
					}
				}
			}
			else if (action.options.method === 'sel') {
				const preset = choices.getPresetSelection('sel')
				choices.getSelectedLayers()
					.filter((selection) => choices.isLocked(selection.screenAuxKey, preset) === false)
					.forEach((layer) => {
						let source = 'keep'
						if (
							layer.screenAuxKey.startsWith('S') &&
							layer.layerKey === 'NATIVE' &&
							action.options['sourceNative'] !== 'keep'
						) source = action.options['sourceNative']
						else if (
							layer.screenAuxKey.startsWith('S') &&
							layer.layerKey.match(/^\d+$/) &&
							action.options['sourceLayer'] !== 'keep'
						) source = action.options['sourceLayer']
						else if (
							layer.screenAuxKey.startsWith('A') &&
							layer.layerKey.match(/^\d+$/) &&
							action.options['sourceBack'] !== 'keep'
						) source = action.options['sourceBack']
						if (source !== 'keep'){
							connection.sendWSmessage([
								'device', 'screenList', 'items', layer.screenAuxKey,
								'presetList', 'items', choices.getPreset(layer.screenAuxKey, preset),
								'layerList', 'items', layer.layerKey,
								'source', 'pp', 'inputNum'
							], source)
						}
				})
			}
			device.sendXupdate()
		},
	} as AWJaction<DeviceSelectSource>

	/**
	 * MARK: Set input keying
	 */
	type DeviceInputKeying = {input: string, mode: string}
	actions['deviceInputKeying'] = {
		name: 'Set Input Keying',
		options: [
			{
				id: 'input',
				type: 'dropdown',
				label: 'Input',
				choices: getLiveInputChoices(state),
				default: getLiveInputChoices(state)[0]?.id,
			},
			{
				id: 'mode',
				type: 'dropdown',
				label: 'Mode',
				choices: [
					{ id: 'DISABLE', label: 'Keying Disabled' },
					{ id: 'CHROMA', label: 'Chroma Key' },
					{ id: 'LUMA', label: 'Luma Key' },
				],
				default: 'DISABLE',
			},
		],
		callback: (action) => {
			connection.sendWSmessage(
				[
					'device', 'inputList', 'items', action.options.input,
					'plugList', 'items', state.get(`DEVICE/device/inputList/items/${action.options.input}/status/pp/plug`),
					'settings', 'keying', 'control',
					'pp', 'mode',
				],
				action.options.mode
			)
			device.sendXupdate()
		},
	} as AWJaction<DeviceInputKeying>

	/**
	 * MARK: Change input freeze
	 */
	type DeviceInputFreeze = {input: string, mode: number}
	actions['deviceInputFreeze'] = {
		name: 'Set Input Freeze',
		options: [
			{
				id: 'input',
				type: 'dropdown',
				label: 'Input',
				choices: getLiveInputChoices(state),
				default: getLiveInputChoices(state)[0]?.id,
			},
			{
				id: 'mode',
				type: 'dropdown',
				label: 'Mode',
				choices: [
					{ id: 1, label: 'Freeze' },
					{ id: 0, label: 'Unfreeze' },
					{ id: 2, label: 'Toggle' },
				],
				default: 2,
			},
		],
		callback: (action) => {
			const path = ['device', 'inputList', 'items', action.options.input, 'control', 'pp', 'freeze']
			let val = false
			if (action.options.mode === 1) {
				val = true
			} else if (action.options.mode === 2) {
				val = !state.get(['DEVICE', ...path])
			}
			connection.sendWSmessage(path, val)
		},
	} as AWJaction<DeviceInputFreeze>


	/**
	 * MARK: Layer position and size
	 */
	const calculateAr = (widthOrAr: number, height?: number) => {
		let ar: number
		let lowerAr: number
		let upperAr: number
		const knownArs = [
			{value: 16/9,  string:'16/9'},
			{value: 8/5, string:'16/10'},
			{value: 4/3,   string:'4/3'},
			{value: 5/4,   string:'5/4'},
			{value: 7/3,  string:'21/9'},
			{value: 1,     string:'1/1'},
			{value: 2/3,   string:'2/3'},
			{value: 9/16,  string:'9/16'},
			{value: 5/8, string:'10/16'},
			{value: 32/9,  string:'32/9'},
		]
		if (typeof height !== 'number') {
			ar = widthOrAr
			lowerAr = 100 * ar - 0.5 / 100
			upperAr = 100 * ar + 0.5 / 100
		} else {
			if (height == 0) return undefined
			ar = widthOrAr / height
			if (height < widthOrAr) {
				lowerAr = widthOrAr / (height+0.5)
				upperAr = widthOrAr / (height-0.5)  
			} else {
				lowerAr = (widthOrAr-0.5) / height
				upperAr = (widthOrAr+0.5) / height
			}
		}
		for (const knownAr of knownArs) {
			if (knownAr.value >= lowerAr && knownAr.value <= upperAr) {
				return knownAr
			}	
		}
		return {value: ar, string: (Math.round(ar*100000000)/100000000).toString(10)}
	
	}

	type DevicePositionSize = {screen: string, preset: string, layersel: string, parameters: string[], x: string, xAnchor: string, y: string, yAnchor: string, w: string, h: string, ar: string} & Record<string, string> 

	//const regexNumber = `[+-]?\\d+(?:\\.\\d+)?`
	//const regexFraction = `${regexNumber}(%|[\\/:]${regexNumber})?`
	//const regexInput = `/([+-]\\s+)?${regexFraction}[psl]?(\\s+[+-]\\s+${regexFraction}[psl]?)*/g`
	const tooltip =
`start with "inc" to increase by amount,
start with "dec" to decrease by amount,
otherwise set value.
You can use expression syntax with operators like +, -, *, /, (), ?:,  ...
You can use the following keywords to be replaced on execution time:
lw: layer width, lh: layer height, lx: layer left edge, ly: layer top edge, la: layer aspect ratio,
bw: box width, bh: box height, bx: box left edge, by: box top edge, ba: box aspect ratio,
iw: layer source width, ih: layer source height, ia: layer source aspect ratio,
sw: screen width, sh: screen height, sa: screen aspect ratio, layer: layer name, screen: screen name`
	actions['devicePositionSize'] = {
		name: 'Set Position and Size',
		options: [
			{
				id: 'screen',
				type: 'dropdown',
				label: 'Screen / Aux',
				choices: [{ id: 'sel', label: 'Selected Screen(s)' }, ...getScreenAuxChoices(state)],
				default: 'sel',
			},
			{
				id: 'preset',
				type: 'dropdown',
				label: 'Preset',
				choices: [{ id: 'sel', label: 'Selected Preset' }, ...choicesPreset],
				default: 'sel',
			},
			{
				id: `layersel`,
				type: 'dropdown',
				label: 'Layer',
				tooltip: 'When using "selected layer" and screen or preset are not using "Selected", you can narrow the selection',
				choices: [{ id: 'sel', label: 'Selected Layer(s)' }, ...Array.from({length: 128}, (_i, e:number) => {return {id: e+1, label: `Layer ${e+1}`}})],
				default: 'sel',
				isVisible: (options) => {return options.screen === 'sel'},
			},
			...screens.map((screen) => {
				return{
					id: `layer${screen.id}`,
					type: 'dropdown',
					label: 'Layer',
					tooltip: 'When using "selected layer" and screen or preset are not using "Selected", you can narrow the selection',
					choices: [{ id: 'sel', label: 'Selected Layer(s)' }, ...getLayerChoices(state, screen.id, false)],
					default: 'sel',
					// isVisible: visFn,
					isVisibleData: screen.id,
					isVisible: (options: any, screenID: string) => {
						return options.screen === screenID
					}
				}
			}),
			{
				id: 'parameters',
				type: 'multidropdown',
				label: 'Act on',
				choices: [
					{ id: 'x', label: 'X Position' },
					{ id: 'y', label: 'Y Position' },
					{ id: 'w', label: 'Width' },
					{ id: 'h', label: 'Height' },
				],
				default: ['x', 'y', 'w', 'h'],
			},
			{
				id: 'x',
				type: 'textinput',
				label: 'X position in screen (pixels)',
				tooltip,
				default: '',
				useVariables: true,
				isVisible: (options) => {return options.parameters.includes('x')},
			},
			{
				id: 'y',
				type: 'textinput',
				label: 'Y position in screen (pixels)',
				tooltip,
				default: '',
				useVariables: true,
				isVisible: (options) => {return options.parameters.includes('y')},
			},
			{
				id: 'w',
				type: 'textinput',
				label: 'Width (pixels)',
				tooltip,
				default: '',
				useVariables: true,
				isVisible: (options) => {return options.parameters.includes('w')},
			},
			{
				id: 'h',
				type: 'textinput',
				label: 'Height (pixels)',
				tooltip,
				default: '',
				useVariables: true,
				isVisible: (options) => {return options.parameters.includes('h')},
			},
			{
				id: 'xAnchor',
				type: 'textinput',
				label: 'Anchor X position',
				tooltip,
				default: 'lx + 0.5 * lw',
				useVariables: true,
				isVisible: (options) => {return options.parameters.includes('x') || options.parameters.includes('w')},
			},
			{
				id: 'yAnchor',
				type: 'textinput',
				label: 'Anchor Y position',
				tooltip,
				default: 'ly + 0.5 * lh',
				useVariables: true,
				isVisible: (options) => {return options.parameters.includes('y') || options.parameters.includes('h')},
			},
			{
				id: 'ar',
				type: 'textinput',
				label: 'Aspect Ratio',
				tooltip: `use "keep" to keep the aspect ratio, use notations like 16/9, 4/3, 1.678 to set to a specific ratio, use nothing or any other word to change aspect ratio`,
				default: '',
				useVariables: true,
				isVisible: (options) => {return options.parameters.includes('h') && !options.parameters.includes('w') || !options.parameters.includes('h') && options.parameters.includes('w')},
			},
		],
		learn: (action) => {
			const options = action.options
			const newoptions:DevicePositionSize = {...options}

			let layers: {screenAuxKey: string, layerKey: string}[]
			if (options.screen === 'sel') {
				if (options.layersel === 'sel') {
					layers = choices.getSelectedLayers()
				} else {
					layers = [{screenAuxKey: options.screen, layerKey: options.layersel}]
				}
			} else {
				if (options[`layer${options.screen}`] === 'sel') {
					layers = choices.getSelectedLayers().filter(layer => layer.screenAuxKey == options.screen)
				} else {
					layers = [{screenAuxKey: options.screen, layerKey: options[`layer${options.screen}`]}]
				}
			}

			if (layers.length === 0) return options

			const [screen, layer] = [layers[0].screenAuxKey, layers[0].layerKey]
			
			newoptions.screen = screen
			newoptions.layersel = layer
			newoptions.preset = choices.getPresetSelection()
			newoptions.xAnchor = 'lx + 0.5 * lw'
			newoptions.yAnchor = 'ly + 0.5 * lh'
			newoptions.parameters = ['x', 'y', 'w', 'h']
			
			const pathToLayer = ['device','screenList','items',screen,'presetList','items',choices.getPreset(screen, newoptions.preset),'layerList','items',layer,'position','pp']
			const w = state.get(['DEVICE', ...pathToLayer, 'sizeH'])
			const h = state.get(['DEVICE', ...pathToLayer, 'sizeV'])
			newoptions.w = w.toString()
			newoptions.h = h.toString()
			newoptions.x = state.get(['DEVICE', ...pathToLayer, 'posH']).toString()
			newoptions.y = state.get(['DEVICE', ...pathToLayer, 'posV']).toString()
			
			newoptions.ar = h !== 0 ? calculateAr(w,h)?.string ?? '' : ''

			return newoptions
		},
		callback: async (action) => {
			let layers: {screenAuxKey: string, layerKey: string}[]
			if (action.options.screen === 'sel') {
				if (action.options.layersel === 'sel') {
					layers = choices.getSelectedLayers()
				} else {
					layers = [{screenAuxKey: action.options.screen, layerKey: action.options.layersel}]
				}
			} else {
				if (action.options[`layer${action.options.screen}`] === 'sel') {
					layers = choices.getSelectedLayers().filter(layer => layer.screenAuxKey == action.options.screen)
				} else {
					layers = [{screenAuxKey: action.options.screen, layerKey: action.options[`layer${action.options.screen}`]}]
				}
			}

			const preset = action.options.preset === 'sel' ? choices.getPresetSelection('sel') : action.options.preset
			console.log('layers before match', layers)
			layers = layers.filter(layer => (!choices.isLocked(layer.screenAuxKey, preset) && layer.layerKey.match(/^\d+$/))) // wipe out layers of locked screens and native layer
			if (layers.length === 0) return

			const parseExpressionString = (expression: string, context: {[name: string]: number | string | boolean}, initialValue = 0) => {
				let relate: (n: number) => number
				if (expression.toLowerCase().startsWith('inc')) {
					relate = (n) => initialValue + n
					expression = expression.substring(3)
				} else if (expression.toLowerCase().startsWith('dec')) {
					relate = (n) => initialValue - n
					expression = expression.substring(3)
				} else {
					relate = (n) => n
				}
				let result:any = undefined
				try {
					const expressionFn = compileExpression(expression)
					result = expressionFn(context)
				} catch (_error) {
					// fail silent
				}
				if (typeof result === 'number') {
					return relate(result)
				}
				return 0
			}

			const boundingBoxes = {}

			for (const layerIndex in layers as {screenAuxKey: string, layerKey: string, x: number, y: number, w: number, h: number, [name: string]: number | string}[]) {
				const layer: any = layers[layerIndex]
				const presetKey = choices.getPreset(layer.screenAuxKey, preset)
				const pathToLayer = ['device','screenList','items',layer.screenAuxKey,'presetList','items',presetKey,'layerList','items',layer.layerKey]
				layer.w = state.get(['DEVICE', ...pathToLayer,'position','pp', 'sizeH']) ?? 1920
				layer.wOriginal = layer.w
				layer.h = state.get(['DEVICE', ...pathToLayer,'position','pp', 'sizeV']) ?? 1080
				layer.hOriginal = layer.h
				layer.x = (state.get(['DEVICE', ...pathToLayer,'position','pp', 'posH']) ?? 0) - layer.w / 2
				layer.xOriginal = layer.x
				layer.y = (state.get(['DEVICE', ...pathToLayer,'position','pp', 'posV']) ?? 0) - layer.h / 2
				layer.yOriginal = layer.y

				if (boundingBoxes[layer.screenAuxKey] === undefined ) boundingBoxes[layer.screenAuxKey] = {}
				const box = boundingBoxes[layer.screenAuxKey]
				if (box.x === undefined  || layer.x < box.x) box.x = layer.x
				if (box.y === undefined  || layer.y < box.y) box.y = layer.y
				if (box.w === undefined  || layer.x + layer.w > box.x + box.w) 
					box.w = layer.x + layer.w - box.x
				if (box.h === undefined  || layer.y + layer.h > box.y + box.h) 
					box.h = layer.y + layer.h - box.y
			}

			for (const layerIndex in layers as {screenAuxKey: string, layerKey: string, x: number, y: number, w: number, h: number, [name: string]: number | string}[]) {
				const layer: any = layers[layerIndex]
				const presetKey = choices.getPreset(layer.screenAuxKey, preset)
				const screenWidth = state.get(`DEVICE/device/screenList/items/${layer.screenAuxKey}/status/size/pp/sizeH`)
				const screenHeight = state.get(`DEVICE/device/screenList/items/${layer.screenAuxKey}/status/size/pp/sizeV`)
				
				const pathToLayer = ['device','screenList','items',layer.screenAuxKey,'presetList','items',presetKey,'layerList','items',layer.layerKey]

				layer.input = state.get(['DEVICE', ...pathToLayer,'source','pp','inputNum']) ?? 'NONE'
				//console.log('layer before match', layer)
				if (layer.input?.match(/^IN/)) {
					layer.inPlug = state.get(`DEVICE/device/inputList/items/${layer.input}/control/pp/plug`) || '1'
					layer.inWidth = state.get(`DEVICE/device/inputList/items/${layer.input}/plugList/items/${layer.inPlug}/status/signal/pp/imageWidth`) || 0
					layer.inHeight = state.get(`DEVICE/device/inputList/items/${layer.input}/plugList/items/${layer.inPlug}/status/signal/pp/imageHeight`) || 0
				} else {
					layer.inWidth = 0
					layer.inHeight = 0
				}
				
				const boxWidth = boundingBoxes[layer.screenAuxKey]?.w ?? layer.w
				const boxHeight = boundingBoxes[layer.screenAuxKey]?.h ?? layer.h

				const context = {
					sw: screenWidth,
					sh: screenHeight,
					sa: calculateAr(screenWidth, screenHeight)?.value ?? 0,
					lw: layer.w,
					lh: layer.h,
					lx: layer.x,
					ly: layer.y,
					la: calculateAr(layer.w, layer.h)?.value ?? 0,
					bx: boundingBoxes[layer.screenAuxKey]?.x ?? layer.x,
					by: boundingBoxes[layer.screenAuxKey]?.y ?? layer.y,
					bw: boxWidth,
					bh: boxHeight,
					ba: calculateAr(boxWidth, boxHeight)?.value ?? 0,
					iw: layer.inWidth,
					ih: layer.inHeight,
					ia: calculateAr(layer.inWidth, layer.inHeight)?.value ?? 0,
					screen: layer.screenAuxKey,
					layer: layer.layerKey,
					index: layerIndex
				}

				const xAnchorPromise = instance.parseVariablesInString(action.options.xAnchor)
				const xPromise = instance.parseVariablesInString(action.options.x)
				const yAnchorPromise = instance.parseVariablesInString(action.options.yAnchor)
				const yPromise = instance.parseVariablesInString(action.options.y)
				const wPromise = instance.parseVariablesInString(action.options.w)
				const hPromise = instance.parseVariablesInString(action.options.h)
				const arPromise = instance.parseVariablesInString(action.options.ar)

				const [xAnchorParsed, xParsed, yAnchorParsed, yParsed, wParsed, hParsed, arP] = await Promise.all([xAnchorPromise, xPromise, yAnchorPromise, yPromise, wPromise, hPromise, arPromise])

				const xAnchor = parseExpressionString(xAnchorParsed, context, 0)
				const xPos = parseExpressionString(xParsed, context, layer.x)
				const yAnchor = parseExpressionString(yAnchorParsed, context, 0)
				const yPos = parseExpressionString(yParsed, context, layer.y)
				const widthInput = parseExpressionString(wParsed, context, layer.w)
				const heightInput = parseExpressionString(hParsed, context, layer.h)

				let ar: number | undefined
				if (action.options.ar.match(/keep/i)) {
					ar = calculateAr(layer.w, layer.h)?.value ?? 0
				} else {
					ar = parseExpressionString(arP, context, calculateAr(layer.w, layer.h)?.value)
				}

				let xChange = false
				let yChange = false

				// do resizing
				if (action.options.parameters.includes('w') && action.options.parameters.includes('h')) {
					// set new width and height
					console.log('set new width and height')
					layer.w = widthInput
					layer.h = heightInput
				} else if (action.options.parameters.includes('w')) {
					// set new width by value, height by ar or leave untouched
					layer.w = widthInput
					if (ar !== undefined && ar !== 0) layer.h = layer.w / ar
				} else if (action.options.parameters.includes('h')) {
					// set new height by value, width by ar or leave untouched
					layer.h = heightInput
					if (ar !== undefined) layer.w = layer.h * ar
				}

				// adjust position according anchor
				if (layer.w !== layer.wOriginal && xAnchor !== (layer.xOriginal + 0.5 * layer.wOriginal)) {
					layer.x = layer.xOriginal - ((xAnchor - layer.xOriginal) * (layer.w / layer.wOriginal)) + (xAnchor - layer.xOriginal)
					xChange = true
				}
				if (layer.h !== layer.hOriginal && yAnchor !== (layer.yOriginal + 0.5 * layer.hOriginal)) {
					layer.y = layer.yOriginal - ((yAnchor - layer.yOriginal) * (layer.h / layer.hOriginal)) + (yAnchor - layer.yOriginal)
					yChange = true
				}

				// do positioning
				if (action.options.parameters.includes('x')) {
					layer.x += xPos - xAnchor
				} 
				if (action.options.parameters.includes('y')) {
					layer.y += yPos - yAnchor
				}


				console.log('layer', {...layer, xAnchor, yAnchor, context})

				// send values
				if (layer.x !== layer.xOriginal || xChange) {
					connection.sendWSmessage(
						[...pathToLayer,'position','pp', 'posH'],
						Math.round(layer.x + layer.w / 2)
					)
				}
				if (layer.y !== layer.yOriginal || yChange) {
					connection.sendWSmessage(
						[...pathToLayer,'position','pp', 'posV'],
						Math.round(layer.y + layer.h / 2)
					)
				}
				if (layer.w !== layer.wOriginal) {
					connection.sendWSmessage(
						[...pathToLayer,'position','pp', 'sizeH'],
						Math.round(layer.w)
					)
				}
				if (layer.h !== layer.hOriginal) {
					connection.sendWSmessage(
						[...pathToLayer,'position','pp', 'sizeV'],
						Math.round(layer.h)
					)
				}
			}

			device.sendXupdate()
		},
	} as AWJaction<DevicePositionSize>


	/**
	 * MARK: Copy preview from program
	 */
	type DeviceCopyProgram = {screens: string[]}
	actions['deviceCopyProgram'] = {
		name: 'Copy Program to Preview',
		options: [
			{
				id: 'screens',
				type: 'multidropdown',
				label: 'Screens / Auxscreens',
				choices: [
					{ id: 'all', label: 'All' },
					{ id: 'sel', label: 'Selected Screens' },
					...getScreenAuxChoices(state)
				],
				default: ['sel'],
			},
		],
		callback: (action) => {
			for (const screen of choices.getChosenScreenAuxes(action.options.screens)) {
				if (choices.isLocked(screen, 'PREVIEW')) return
				const fullpath = ['device', 'screenGroupList', 'items', screen, 'control', 'pp', 'xCopyProgramToPreview']
				connection.sendWSmessage(fullpath, false)
				connection.sendWSmessage(fullpath, true)
			}
		},
	} as AWJaction<DeviceCopyProgram>

	// MARK: Set Preset Toggle
	type DevicePresetToggle = {action: string}
	actions['devicePresetToggle'] = {
		name: 'Set Preset Toggle',
		options: [
			{
				type: 'dropdown',
				label: 'Action',
				id: 'action',
				choices: [
					{ id: 'on', label: 'On'},
					{ id: 'off', label: 'Off'},
					{ id: 'toggle', label: 'Toggle'},
				],
				default: 'on',
			},
		],
		callback: (act) => {
			const allscreens = getScreensAuxArray(state, true).map((itm) => itm.id)
			if (allscreens.length === 0) return
			let action = act.options.action

			// device/transition/screenList/items/1/control/pp/enablePresetToggle
			// device/screenGroupList/items/S1/control/pp/copyMode
	
			if (action === 'toggle') {
				if (state.get('DEVICE/device/screenGroupList/items/'+ allscreens[0] +'/control/pp/copyMode') === false) action = 'off'
				else action = 'on'
			}
			if (action === 'on') allscreens.forEach((screen: string) =>
				connection.sendWSmessage('device/screenGroupList/items/' + screen + '/control/pp/copyMode', false))
			if (action === 'off') allscreens.forEach((screen: string) =>
				connection.sendWSmessage('device/screenGroupList/items/' + screen + '/control/pp/copyMode', true))
		}
	} as AWJaction<DevicePresetToggle>

	/**
	 *MARK:  Select Multiviewer Widget
	 */
	type RemoteMultiviewerSelectWidget = {widget: string, sel: string}
	actions['remoteMultiviewerSelectWidget'] = {
		name: 'Multiviewer Widget Selection',
		options: [
			{
				id: 'widget',
				label: 'Widget',
				type: 'dropdown',
				choices: getWidgetChoices(state),
				default: getWidgetChoices(state)[0]?.id,
			},
			{
				id: 'sel',
				label: 'Action',
				type: 'dropdown',
				choices: [
					{
						id: 'selectExclusive',
						label: 'Select exclusive',
					},
					{
						id: 'deselect',
						label: 'Deselect',
					},
					{
						id: 'select',
						label: 'Select',
					},
					{
						id: 'toggle',
						label: 'Toggle',
					},
				],
				default: 'selectExclusive',
			},
		],
		callback: (action) => {
			const mvw = action.options.widget?.split(':')[0] ?? '1'
			const widget = action.options.widget?.split(':')[1] ?? '0'
			let widgetSelection: Record<'multiviewerKey' | 'widgetKey', string>[] = []
			if (state.syncSelection) {
				widgetSelection = [...state.getUnmapped('REMOTE/live/multiviewers/widgetSelection/widgetIds')]
			} else {
				widgetSelection = [...state.get('LOCAL/widgetSelection/widgetIds')]
			}
			const idx = widgetSelection.findIndex((elem) => {
				return elem.widgetKey == widget && elem.multiviewerKey == mvw
			})

			if ((action.options.sel === 'deselect' || action.options.sel === 'toggle') && idx >= 0) {
				widgetSelection.splice(idx, 1)
			} else if ((action.options.sel === 'select' || action.options.sel === 'toggle') && idx < 0) {
				widgetSelection.push({ widgetKey: widget, multiviewerKey: mvw })
			} else if (action.options.sel === 'selectExclusive') {
				widgetSelection = [{ widgetKey: widget, multiviewerKey: mvw }]
			}

			if (state.syncSelection) {
				connection.sendWSdata('REMOTE', 'replace', 'live/multiviewers/widgetSelection', [widgetSelection])
			} else {
				state.set('LOCAL/widgetSelection/widgetIds', widgetSelection)
				instance.checkFeedbacks('remoteWidgetSelection')
			}
		},
	} as AWJaction<RemoteMultiviewerSelectWidget>

	/**
	 * MARK: Select the source in a multiviewer widget
	 */
	type DeviceMultiviewerSource = {widget: string, source: string}
	actions['deviceMultiviewerSource'] = {
		name: 'Select Source in Multiviewer Widget',
		options: [
			{
				id: 'widget',
				label: 'Widget',
				type: 'dropdown',
				choices: [{ id: 'sel', label: 'Selected' }, ...getWidgetChoices(state)],
				default: 'sel',
			},
			{
				id: 'source',
				label: 'Source',
				type: 'dropdown',
				choices: getWidgetSourceChoices(state),
				default: getWidgetSourceChoices(state)[0]?.id,
			},
		],
		callback: (action) => {
			let widgetSelection: Record<'multiviewerKey' | 'widgetKey', string>[] = []
			if (action.options.widget === 'sel') {
				if (state.syncSelection) {
					widgetSelection = [...state.get('REMOTE/live/multiviewers/widgetSelection/widgetIds')]
				} else {
					widgetSelection = [...state.get('LOCAL/widgetSelection/widgetIds')]
				}
			} else {
				widgetSelection = [
					{
						widgetKey: action.options.widget.split(':')[1] ?? '0',
						multiviewerKey: action.options.widget.split(':')[0] ?? '1',
					},
				]
			}
			for (const widget of widgetSelection) {
				connection.sendWSmessage(
					[
						'device',
						'monitoringList', 'items', widget.multiviewerKey,
						'layout', 'widgetList', 'items', widget.widgetKey,
						'control', 'pp', 'source',
					],
					action.options.source
				)
			}
		},
	} as AWJaction<DeviceMultiviewerSource>

	/**
	 * MARK: Select / Deselect screens locally or remote
	 */
	type SelectScreen = {screen: string, sel: number}
	actions['selectScreen'] = {
		name: 'Screen Selection',
		options: [
			{
				id: 'screen',
				label: 'Screen',
				type: 'dropdown',
				choices: getScreenAuxChoices(state),
				default: getScreenAuxChoices(state)[0]?.id,
			},
			{
				id: 'sel',
				label: 'Action',
				type: 'dropdown',
				choices: [
					{
						id: 0,
						label: 'Deselect',
					},
					{
						id: 1,
						label: 'Select',
					},
					{
						id: 2,
						label: 'Select exclusive',
					},
					{
						id: 3,
						label: 'Toggle',
					},
					{
						id: 4,
						label: 'Intelligent PRESS action',
					},
					{
						id: 5,
						label: 'Intelligent RELEASE action',
					},
					{
						id: 6,
						label: 'Intelligent reset action',
					},
				],
				default: 2,
			},
		],
		callback: (action: ActionEvent<SelectScreen>) => {
			let sel = action.options.sel
			const surface = action.surfaceId ? action.surfaceId : ''
			const id = surface + action.controlId
			if (sel === 6 || (sel === 5 && !id.length )) {
				state.setUnmapped('LOCAL/intelligent/screenSelectionRunning', undefined)
				return
			} else if (sel === 4 && id.length) {
				if (state.getUnmapped('LOCAL/intelligent/screenSelectionRunning')) {
					sel = 3
				} else {
					state.setUnmapped('LOCAL/intelligent/screenSelectionRunning', id)
					sel = 2
				}
			} else if (sel === 5 && id.length) {
				if (state.getUnmapped('LOCAL/intelligent/screenSelectionRunning') === id) {
					state.setUnmapped('LOCAL/intelligent/screenSelectionRunning', undefined)
				}
				return
			} else if (sel === 4 && !id.length) {
				sel = 2
			}
			const screen = action.options.screen as string
			if (state.syncSelection) {
				switch (sel) {
					case 0:
						connection.sendWSdata('REMOTE', 'remove', 'live/screens/screenAuxSelection', [screen])
						break
					case 1:
						connection.sendWSdata('REMOTE', 'add', 'live/screens/screenAuxSelection', [screen])
						break
					case 2:
						connection.sendWSdata('REMOTE', 'replace', 'live/screens/screenAuxSelection', [[screen]])
						break
					case 3:
						connection.sendWSdata('REMOTE', 'toggle', 'live/screens/screenAuxSelection', [screen])
						break
				}
			} else {
				const localSelection = state.getUnmapped('LOCAL/screenAuxSelection/keys') as string[]
				const idx = localSelection.indexOf(screen)
				switch (sel) {
					case 0:
						if (idx >= 0) {
							localSelection.splice(idx, 1)
						}
						break
					case 1:
						if (idx === -1) {
							localSelection.push(screen)
						}
						break
					case 2:
							state.setUnmapped('LOCAL/screenAuxSelection/keys', [ screen ]) 
						break
					case 3:
						if (idx >= 0) {
							localSelection.splice(idx, 1)
						} else {
							localSelection.push(screen)
						}
						break
				}
				instance.checkFeedbacks('liveScreenSelection')
			}
		},
	} as AWJaction<SelectScreen>

	/**
	 * MARK: lock screens
	 */
	type LockScreen = {screens: string[], preset: string, lock: string}
	actions['lockScreen'] = {
		name: 'Lock Screen',
		options: [
			{
				id: 'screens',
				label: 'Screen',
				type: 'multidropdown',
				choices: [
					{ id: 'all', label: 'ALL' },
					{ id: 'sel', label: 'Selected' },
					...getScreenAuxChoices(state)
				],
				default: ['all'],
				tooltip:
					'If you choose "All" and "Toggle", the behavior is exactly like in WebRCS, if you choose multiple screens they will be toggled individually',
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
			{
				id: 'lock',
				label: 'Action',
				type: 'dropdown',
				choices: [
					{
						id: 'unlock',
						label: 'Unlock',
					},
					{
						id: 'lock',
						label: 'Lock',
					},
					{
						id: 'toggle',
						label: 'Toggle',
					},
				],
				default: 'toggle',
			},
		],
		callback: (action) => {
			const screens = action.options.screens
			const pst = action.options.preset === 'PREVIEW' ? 'Prw' : 'Pgm'
			if (state.syncSelection) {
				if (action.options.lock === 'lock' || action.options.lock === 'unlock') {
					const screen = choices.getChosenScreenAuxes(screens)
					connection.sendWSdata(
						'REMOTE',
						action.options.lock + 'ScreenAuxes' + pst,
						'live/screens/presetModeLock',
						[screen]
					)
				} else if (action.options.lock === 'toggle') {
					if (screens.includes('all')) {
						const allscreens = choices.getChosenScreenAuxes(screens)
						const allLocked =
							allscreens.find((scr) => {
								return state.get(['REMOTE', 'live', 'screens', 'presetModeLock', action.options.preset, scr]) === false
							}) === undefined
						let lock = 'lock'
						if (allLocked) {
							lock = 'unlock'
						}
						connection.sendWSdata(
							'REMOTE',
							lock + 'ScreenAuxes' + pst,
							'live/screens/presetModeLock',
							[allscreens]
						)
					} else {
						for (const screen of choices.getChosenScreenAuxes(screens)) {
							connection.sendWSdata(
								'REMOTE',
								'toggle',
								'live/screens/presetModeLock/' + action.options.preset,
								[screen]
							)
						}
					}
				}
			} else {
				const localLocks = state.get(['LOCAL', 'presetModeLock', action.options.preset])
				if (action.options.lock === 'lock') {
					for (const screen of choices.getChosenScreenAuxes(screens)) {
						localLocks[screen] = true
					}
				} else if (action.options.lock === 'unlock') {
					for (const screen of choices.getChosenScreenAuxes(screens)) {
						localLocks[screen] = false
					}
				} else if (action.options.lock === 'toggle') {
					if (screens.includes('all')) {
						const allscreens = choices.getChosenScreenAuxes('all')
						const allLocked =
							allscreens.find((scr) => {
								return state.get(['LOCAL', 'presetModeLock', action.options.preset, scr]) === false
							}) === undefined
						if (allLocked) {
							for (const screen of allscreens) {
								localLocks[screen] = false
							}
						} else {
							for (const screen of allscreens) {
								localLocks[screen] = true
							}
						}
					} else {
						for (const screen of choices.getChosenScreenAuxes(screens)) {
							localLocks[screen] = localLocks[screen] === true ? false : true
						}
					}
				}
				instance.checkFeedbacks('liveScreenLock')
			}
		},
	} as AWJaction<LockScreen>

	/**
	 * MARK: Select Preset locally or remote
	 */
	type SelectPreset = {mode: string}
	actions['selectPreset'] = {
		name: 'Select Preset',
		options: [
			{
				id: 'mode',
				label: 'Preset',
				type: 'dropdown',
				choices: [
					{ id: 'pgm', label: 'Program' },
					{ id: 'pvw', label: 'Preview' },
					{ id: 'tgl', label: 'Toggle' },
				],
				default: 'tgl',
			},
		],
		callback: (action) => {
			if (state.syncSelection) {
				switch (action.options.mode) {
					case 'pgm':
						connection.sendRawWSmessage(
							'{"channel":"REMOTE","data":{"name":"set","path":"/live/screens/presetModeSelection","args":["PROGRAM"]}}'
						)
						break
					case 'pvw':
						connection.sendRawWSmessage(
							'{"channel":"REMOTE","data":{"name":"set","path":"/live/screens/presetModeSelection","args":["PREVIEW"]}}'
						)
						break
					case 'tgl':
						connection.sendRawWSmessage(
							'{"channel":"REMOTE","data":{"name":"toggle","path":"/live/screens/presetModeSelection","args":[]}}'
						)
						break
				}
			} else {
				switch (action.options.mode) {
					case 'pgm':
						state.set('LOCAL/presetMode', 'PROGRAM')
						instance.setVariableValues({ selectedPreset: 'PGM' })
						break
					case 'pvw':
						state.set('LOCAL/presetMode', 'PREVIEW')
						instance.setVariableValues({ selectedPreset: 'PVW' })
						break
					case 'tgl':
						if (state.get('LOCAL/presetMode') === 'PREVIEW') {
							state.set('LOCAL/presetMode', 'PROGRAM')
							instance.setVariableValues({ selectedPreset: 'PGM' })
						} else {
							state.set('LOCAL/presetMode', 'PREVIEW')
							instance.setVariableValues({ selectedPreset: 'PVW' })
						}
						break
				}
				instance.checkFeedbacks('livePresetSelection')
			}
			instance.checkFeedbacks('liveScreenSelection', 'remoteLayerSelection')
		},
	} as AWJaction<SelectPreset>

	/**
	 * MARK: Select Layer locally or remote
	 */
	type SelectLayer = {method: string, screen: string[], layersel: string[]}
	actions['selectLayer'] = {
		name: 'Select Layer',
				options: [
			{
				id: 'method',
				type: 'dropdown',
				label: 'Method',
				choices: [
					{ id: 'spec', label: 'Select layers of specified screens' },
					{ id: 'sel', label: 'Select layers of selected screens and preset' },
					{ id: 'spectgl', label: 'Toggle layers of specified screens' },
					{ id: 'seltgl', label: 'Toggle layers of selected screens and preset' },
				],
				default: 'spec',
			},
			{
				id: 'screen',
				type: 'multidropdown',
				label: 'Screen / Aux',
				choices: getScreenAuxChoices(state),
				default: [getScreenAuxChoices(state)[0]?.id],
				isVisible: (options) => {
					return options.method.startsWith('spec')
				},
			},
			{
				id: `layersel`,
				type: 'multidropdown',
				label: 'Layer',
				tooltip:
					'Choose all the layers you want to be selected, every other layer on any screen will be deselected. This action does not change the preset, if you want a specific preset, add the according action.',
				choices: getLayerChoices(state, 48, true),
				default: ['1'],
				isVisible: (options) => {
					return options.method.startsWith('sel')
				},
			},
			...screens.map((screen) => {
				const layerChoices = getLayerChoices(state, screen.id, true)
				let defaultChoice: DropdownChoiceId
				if (layerChoices.find((choice: DropdownChoice) => choice.id === '1')) defaultChoice = '1'
				else defaultChoice = layerChoices[0].id

				return {
					id: `layer${screen.id}`,
					type: 'multidropdown',
					label: 'Layer ' + screen.id,
					choices: layerChoices,
					default: [defaultChoice],
					isVisible: (options, screenId = screen.id) => { return options.method.startsWith('spec') && options.screen.includes(`${screenId}`)},
				}
			})
		],
		callback: (action) => {
			let ret: Record<'screenAuxKey' | 'layerKey', string>[] = []
			if (action.options.method?.endsWith('tgl')) {
				if (state.syncSelection) {
					ret = state.get('REMOTE/live/screens/layerSelection/layerIds')
				} else {
					ret = state.get('LOCAL/layerIds')
				}
			}
			let scrs: string[] = []
			if (action.options.method?.startsWith('sel')) {
				scrs = choices.getSelectedScreens()
			}
			if (action.options.method?.startsWith('spec')) {
				scrs = action.options.screen
			}
			for (const screen of scrs) {
				let layers: string[] = []
				if (action.options.method?.startsWith('spec')) {
					layers = action.options[`layer${screen}`]
				}
				if (action.options.method?.startsWith('sel')) {
					layers = action.options.layersel
				}
				if (action.options.method?.endsWith('tgl')) {
					for (const layer of layers) {
						const idx = ret.findIndex((lay) => {
							return lay['screenAuxKey'] === screen && lay['layerKey'].replace('NATIVE', 'BKG') === layer.replace('NATIVE', 'BKG')
						})
						if (idx === -1) {
							ret.push({ screenAuxKey: screen, layerKey: layer })
						} else {
							ret.splice(idx, 1)
						}
					}
				} else {
					for (const layer of layers) {
						ret.push({ screenAuxKey: screen, layerKey: layer })
					}
				}
			}
			if (state.syncSelection) {
				connection.sendWSdata('REMOTE', 'replace', 'live/screens/layerSelection', [ret])
			} else {
				state.set('LOCAL/layerIds', ret)
				instance.checkFeedbacks('remoteLayerSelection')
			}
		},
	} as AWJaction<SelectLayer>
	

	/**
	 * MARK: Switch selection syncronization with device on/off
	 */
	type RemoteSync = {sync: number}
	actions['remoteSync'] = {
		name: 'Sync selection',
		options: [
			{
				label: 'Sync',
				type: 'dropdown',
				id: 'sync',
				choices: [
					{ id: 1, label: 'turn sync on' },
					{ id: 0, label: 'turn sync off' },
					{ id: 2, label: 'toggle sync' },
				],
				default: 2,
			},
		],
		callback: (action) => {
			const clients: {id: string}[] = state.get('REMOTE/system/network/websocketServer/clients')
			let syncstate: boolean
			const myid: string = state.get('LOCAL/socketId')
			const myindex = clients.findIndex((elem) => {
				if (elem.id === myid) {
					return true
				} else {
					return false
				}
			})
			switch (action.options.sync) {
				case 0:
					syncstate = false
					break
				case 1:
					syncstate = true
					break
				case 2:
					if (state.get(`REMOTE/system/network/websocketServer/clients/${myindex}/isRemoteSelectionEnabled`)) {
						syncstate = false
					} else {
						syncstate = true
					}
					break
				default:
					syncstate = false
					break
			}
			state.set('LOCAL/syncSelection', syncstate)
			connection.sendRawWSmessage(
				`{"channel":"REMOTE","data":{"name":"enableRemoteSelection","path":"/system/network/websocketServer/clients/${myindex}","args":[${syncstate}]}}`
			)
			instance.checkFeedbacks(
				'livePresetSelection',
				'liveScreenSelection',
				'remoteLayerSelection',
				'liveScreenLock',
				'remoteWidgetSelection'
			)
			
			let preset: string,
				vartext = 'PGM'
			if (syncstate) {
				preset = state.get('REMOTE/live/screens/presetModeSelection/presetMode')
			} else {
				preset = state.get('LOCAL/presetMode')
			}
			if (preset === 'PREVIEW') {
				vartext = 'PVW'
			}
			instance.setVariableValues({ selectedPreset: vartext })
			
		},
	} as AWJaction<RemoteSync>


	/**
	 * MARK: Route audio block
	 */
	type DeviceAudioRouteBlock = {out: string, in: string, blocksize: number}
	const audioOutputChoices = getAudioOutputChoices(state)
	const audioInputChoices = getAudioInputChoices(state)

	actions['deviceAudioRouteBlock'] = {
		name: 'Route Audio (Block)',
		options: [
			{
				type: 'dropdown',
				label: 'First Output Channel',
				id: 'out',
				choices: audioOutputChoices,
				default: audioOutputChoices[0]?.id,
				minChoicesForSearch: 0,
			},
			{
				type: 'dropdown',
				label: 'First Input Channel',
				id: 'in',
				choices: audioInputChoices,
				default: 'NONE',
				minChoicesForSearch: 0,
				tooltip: 'If you choose "No Source" the whole Block will be unrouted',
			},
			{
				type: 'number',
				label: 'Block Size',
				id: 'blocksize',
				default: 8,
				min: 1,
				max: audioInputChoices.length,
				range: true,
			},
		],
		callback: (action: ActionEvent<DeviceAudioRouteBlock>) => {
			const outstart = audioOutputChoices.findIndex((item) => {
				return item.id === action.options.out
			})
			const instart = audioInputChoices.findIndex((item) => {
				return item.id === action.options.in
			})
			if (outstart > -1 && instart > -1) {
				const max = Math.min(
					audioOutputChoices.length - outstart,
					audioInputChoices.length - instart,
					action.options.blocksize
				) // since 'None' is input at index 0 no extra test is needed, it is possible to fill all outputs with none
				for (let s = 0; s < max; s += 1) {
					const path = [
						'device', 'audio', 'control', 
						'txList', 'items', audioOutputChoices[outstart + s].id.toString().split(':')[0],
						'channelList', 'items', audioOutputChoices[outstart + s].id.toString().split(':')[1],
						'control', 'pp', 'source',
					]
					connection.sendWSmessage(path, audioInputChoices[instart === 0 ? 0 : instart + s].id)
				}
			}
		}
	} as AWJaction<DeviceAudioRouteBlock>


	/**
	 * MARK: Route audio channels
	 */
	type DeviceAudioRouteChannels = {out: string, in: string[]}
	actions['deviceAudioRouteChannels'] = {
		name: 'Route Audio (Channels)',
		options: [
			{
				type: 'dropdown',
				label: '(first) output channel',
				id: 'out',
				choices: audioOutputChoices,
				default: audioOutputChoices[0]?.id,
				minChoicesForSearch: 0,
			},
			{
				type: 'multidropdown',
				label: 'input channel(s)',
				id: 'in',
				choices: audioInputChoices,
				default: ['NONE'],
				minChoicesForSearch: 0,
				minSelection: 0,
			},
		],
		callback: (action: ActionEvent<DeviceAudioRouteChannels>) => {
			if (action.options.in.length > 0) {
				const outstart = audioOutputChoices.findIndex((item) => {
					return item.id === action.options.out
				})
				if (outstart > -1) {
					const max = Math.min(audioOutputChoices.length - outstart, action.options.in.length)
					for (let s = 0; s < max; s += 1) {
						const path = [
							'device', 'audio', 'control',
							'txList', 'items', audioOutputChoices[outstart + s].id.toString().split(':')[0],
							'channelList', 'items', audioOutputChoices[outstart + s].id.toString().split(':')[1],
							'control', 'pp', 'source',
						]
						connection.sendWSmessage(path, action.options.in[s])
					}
				}
			} else {
				const path = [
					'device', 'audio', 'control',
					'txList', 'items', action.options.out.split(':')[0],
					'channelList', 'items', action.options.out.split(':')[1],
					'control', 'pp', 'source',
				]
				connection.sendWSmessage(path, audioInputChoices[0]?.id)
			}
		}
	} as AWJaction<DeviceAudioRouteChannels>


	/**
	 * MARK: Setup timer
	 */
	type DeviceTimerSetup = {timer: string, type: string, currentTimeMode: string, unitMode: string, fg_color: number, bg_color: number}
	actions['deviceTimerSetup'] = {
		name: 'Timer Setup',
		options: [
			{
				id: 'timer',
				type: 'dropdown',
				label: 'Timer',
				choices: getTimerChoices(state),
				default: getTimerChoices(state)[0]?.id,
			},
			{
				id: 'type',
				type: 'dropdown',
				label: 'Timer Type',
				choices: [
					{ id: 'CURRENTTIME', label: 'Current time' },
					{ id: 'COUNTDOWN', label: 'Count down' },
					{ id: 'STOPWATCH', label: 'Count up' },
				],
				default: 'COUNTDOWN',
			},
			{
				id: 'currentTimeMode',
				type: 'dropdown',
				label: 'Time Display',
				choices: [
					{ id: '24H', label: '24 hours' },
					{ id: '12H_AM_PM', label: '12 hours' },
				],
				default: '24H',
				isVisible: (options) => {
					return options.type === 'CURRENTTIME'
				},
			},
			{
				id: 'unitMode',
				type: 'dropdown',
				label: 'Time Display',
				choices: [
					{ id: 'IN_SECONDS', label: 'In seconds' },
					{ id: 'IN_MINUTES', label: 'In minutes' },
					{ id: 'IN_HOURS', label: 'In hours' },
				],
				default: 'IN_MINUTES',
				isVisible: (options) => {
					return options.type != 'CURRENTTIME'
				},
			},
			{
				id: 'fg_color',
				type: 'colorpicker',
				enableAlpha: true,
				returnType: 'string',
				label: 'Text color',
				default: `rgba(${splitRgb(config.color_bright).r},${splitRgb(config.color_bright).g},${splitRgb(config.color_bright).b},1)`,
			},
			{
				id: 'bg_color',
				type: 'colorpicker',
				enableAlpha: true,
				returnType: 'string',
				label: 'Background color',
				default: `rgba(${splitRgb(config.color_dark).r},${splitRgb(config.color_dark).g},${splitRgb(config.color_dark).b},0.7)`,
			},
		],
		callback: (action) => {
			connection.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'pp', 'type'],
				action.options.type
			)
			if (action.options.type === 'CURRENTTIME') {
				connection.sendWSmessage(
					['device', 'timerList', 'items', action.options.timer, 'control', 'pp', 'currentTimeMode'],
					action.options.currentTimeMode
				)
			} else {
				connection.sendWSmessage(
					['device', 'timerList', 'items', action.options.timer, 'control', 'pp', 'unitMode'],
					action.options.unitMode
				)
			}
			connection.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'background', 'color', 'pp', 'red'],
				splitRgb(action.options.bg_color).r
			)
			connection.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'background', 'color', 'pp', 'green'],
				splitRgb(action.options.bg_color).g
			)
			connection.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'background', 'color', 'pp', 'blue'],
				splitRgb(action.options.bg_color).b
			)
			connection.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'background', 'color', 'pp', 'alpha'],
				Math.round((splitRgb(action.options.bg_color).a || 1) * 255)
			)
			connection.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'text', 'color', 'pp', 'red'],
				splitRgb(action.options.fg_color).r
			)
			connection.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'text', 'color', 'pp', 'green'],
				splitRgb(action.options.fg_color).g
			)
			connection.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'text', 'color', 'pp', 'blue'],
				splitRgb(action.options.fg_color).b
			)
			connection.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'text', 'color', 'pp', 'alpha'],
				Math.round((splitRgb(action.options.fg_color).a || 1) * 255)
			)
		},
	} as AWJaction<DeviceTimerSetup>

	/**
	 * MARK: Adjust timer
	 */
	type DeviceTimerAdjust = {timer: string, action: string, time: string}
	actions['deviceTimerAdjust'] = {
		name: 'Timer Adjust Time',
		options: [
			{
				id: 'timer',
				type: 'dropdown',
				label: 'Timer',
				choices: getTimerChoices(state),
				default: getTimerChoices(state)[0]?.id,
			},
			{
				id: 'action',
				type: 'dropdown',
				label: 'Action',
				choices: [
					{ id: 'set', label: 'Set Time' },
					{ id: 'add', label: 'Add Time' },
					{ id: 'sub', label: 'Subtract Time' },
				],
				default: 'set',
			},
			{
				id: 'time',
				type: 'textinput',
				label: 'Time',
				default: '',
				useVariables: true,
			},
		],
		callback: async (action) => {
			let timetype = 'countdownDuration'
			const type = state.get(['DEVICE', 'device', 'timerList', 'items', action.options.timer, 'control', 'pp', 'type'])
			if (type === 'CURRENTTIME') {
				timetype = 'timeOffset'
			}
			let time = state.get(['DEVICE', 'device', 'timerList', 'items', action.options.timer, 'control', 'pp', timetype])
			const inputvalue = await instance.parseVariablesInString(action.options.time)
			if (action.options.action === 'add') {
				time += instance.timeToSeconds(inputvalue)
			} else if (action.options.action === 'sub') {
				time -= instance.timeToSeconds(inputvalue)
			} else if (action.options.action === 'set') {
				time = instance.timeToSeconds(inputvalue)
			} else {
				time = 0
			}
			connection.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'pp', timetype],
				time
			)
		},
	} as AWJaction<DeviceTimerAdjust>

	/**
	 * MARK: Play timer
	 */
	type DeviceTimerTransport = {timer: string, cmd: string}
	actions['deviceTimerTransport'] = {
		name: 'Timer Transport',
		options: [
			{
				id: 'timer',
				type: 'dropdown',
				label: 'Timer',
				choices: getTimerChoices(state),
				default: getTimerChoices(state)[0]?.id,
			},
			{
				id: 'cmd',
				type: 'dropdown',
				label: 'Command',
				choices: [
					{ id: 'start', label: 'Start' },
					{ id: 'stop', label: 'Stop' },
					{ id: 'pause', label: 'Pause' },
					{ id: 'tgl_start_pause', label: 'Toggle Start/Pause' },
					{ id: 'tgl_start_stop', label: 'Toggle Start/Stop' },
				],
				default: 'start',
			},
		],
		callback: (action) => {
			let cmd = 'xPause'
			if (action.options.cmd === 'start') {
				cmd = 'xStart'
			} else if (action.options.cmd === 'stop') {
				cmd = 'xStop'
			} else if (action.options.cmd === 'pause') {
				cmd = 'xPause'
			} else if (action.options.cmd === 'tgl_start_pause') {
				const timerstate = state.get([
					'DEVICE', 'device',
					'timerList', 'items', action.options.timer,
					'status', 'pp', 'state',
				])
				if (timerstate === 'RUNNING') {
					cmd = 'xPause'
				} else {
					cmd = 'xStart'
				}
			} else if (action.options.cmd === 'tgl_start_stop') {
				const timerstate = state.get([
					'DEVICE', 'device',
					'timerList', 'items', action.options.timer,
					'status', 'pp', 'state',
				])
				if (timerstate === 'RUNNING' || timerstate === 'ELAPSED') {
					cmd = 'xStop'
				} else {
					cmd = 'xStart'
				}
			}
			const fullpath = ['device', 'timerList', 'items', action.options.timer, 'control', 'pp', cmd]
			connection.sendWSmessage(fullpath, false)
			connection.sendWSmessage(fullpath, true)
		},
	} as AWJaction<DeviceTimerTransport>

	/**
	 * MARK: Choose Testpatterns
	 */
	type DeviceTestpatterns = {group: string, screenList: string, outputList: string, patall: string, screenListPat: string, outputListPat: string, inputList?: string, inputListPat?: string}
	const deviceTestpatternsOptions = [
		{
			id: 'group',
			type: 'dropdown',
			label: 'Group',
			choices: [
				{ id: 'all', label: 'All' },
				{ id: 'screenList', label: 'Screen Canvas' },
				{ id: 'outputList', label: 'Output Group' },
				{ id: 'inputList', label: 'Input Group' },
			],
			default: 'outputList',
		},
		{
			id: 'screenList',
			type: 'dropdown',
			label: 'Screen',
			choices: getScreenAuxChoices(state),
			default: getScreenAuxChoices(state)[0]?.id,
			isVisible: (options) => {
				return options.group === 'screenList'
			},
		},
		{
			id: 'outputList',
			type: 'dropdown',
			label: 'Output',
			choices: getOutputChoices(state),
			default: getOutputChoices(state)[0]?.id,
			isVisible: (options) => {
				return options.group === 'outputList'
			},
		},
		{
			id: 'inputList',
			type: 'dropdown',
			label: 'Input',
			choices: getLiveInputChoices(state),
			default: getLiveInputChoices(state)[0]?.id,
			isVisible: (options) => {
				return options.group === 'inputList'
			},
		},
		{
			id: 'patall',
			type: 'dropdown',
			label: 'Pattern',
			choices: [{ id: '0', label: 'Off' }],
			default: '0',
			isVisible: (options) => {
				return options.group === 'all'
			},
		},
		{
			id: 'screenListPat',
			type: 'dropdown',
			label: 'Pattern',
			choices: [
				{ id: 'NONE', label: 'Off' },
				{ id: 'GEOMETRIC', label: 'Geometric' },
				{ id: 'VERTICAL_GREY_SCALE', label: 'Vertical Greyscale' },
				{ id: 'HORIZONTAL_GREY_SCALE', label: 'Horizontal Greyscale' },
				{ id: 'HORIZONTAL_GREY_SCALE_2', label: 'Horizontal Greysteps' },
				{ id: 'VERTICAL_COLOR_BAR', label: 'Vertical Colorbars' },
				{ id: 'HORIZONTAL_COLOR_BAR', label: 'Horizontal Colorbars' },
				{ id: 'GRID_CUSTOM', label: 'Grid Custom' },
				{ id: 'SMPTE', label: 'SMPTE' },
				{ id: 'VERTICAL_GRADIENT', label: 'Vertical Gradient' },
				{ id: 'HORIZONTAL_GRADIENT', label: 'Horzontal Gradient' },
				{ id: 'CROSSHATCH', label: 'Crosshatch' },
				{ id: 'CHECKERBOARD', label: 'Checkerboard' },
			],
			default: 'NONE',
			isVisible: (options) => {
				return options.group === 'screenList'
			},
		},
		{
			id: 'inputListPat',
			type: 'dropdown',
			label: 'Pattern',
			choices: [
				{ id: 'NO_PATTERN', label: 'Off' },
				{ id: 'COLOR', label: 'Solid Color' },
				{ id: 'VERTICAL_GREY_SCALE', label: 'Vertical Greyscale' },
				{ id: 'HORIZONTAL_GREY_SCALE', label: 'Horizontal Greyscale' },
				{ id: 'VERTICAL_COLOR_BAR', label: 'Vertical Colorbars' },
				{ id: 'HORIZONTAL_COLOR_BAR', label: 'Horizontal Colorbars' },
				{ id: 'GRID_16_16', label: 'Grid 16x16' },
				{ id: 'GRID_32_32', label: 'Grid 32x32' },
				{ id: 'GRID_CUSTOM', label: 'Grid Custom' },
				{ id: 'SMPTE', label: 'SMPTE' },
				{ id: 'BURST_H', label: 'Horizontal Burst' },
				{ id: 'BURST_V', label: 'Vertical Burst' },
				{ id: 'VERTICAL_GRADIENT', label: 'Vertical Gradient' },
				{ id: 'HORIZONTAL_GRADIENT', label: 'Horzontal Gradient' },
				{ id: 'CROSSHATCH', label: 'Crosshatch' },
				{ id: 'CHECKERBOARD', label: 'Checkerboard' },
				{ id: 'MOVING', label: 'Moving Lines' },
				{ id: 'ID', label: 'ID' },
			],
			default: 'NO_PATTERN',
			isVisible: (options) => {
				return options.group === 'inputList'
			},
		},
		{
			id: 'outputListPat',
			type: 'dropdown',
			label: 'Pattern',
			choices: [
				{ id: 'NO_PATTERN', label: 'Off' },
				{ id: 'COLOR', label: 'Solid Color' },
				{ id: 'VERTICAL_GREY_SCALE', label: 'Vertical Greyscale' },
				{ id: 'HORIZONTAL_GREY_SCALE', label: 'Horizontal Greyscale' },
				{ id: 'HORIZONTAL_GREY_SCALE_2', label: 'Horizontal Greysteps' },
				{ id: 'VERTICAL_COLOR_BAR', label: 'Vertical Colorbars' },
				{ id: 'HORIZONTAL_COLOR_BAR', label: 'Horizontal Colorbars' },
				{ id: 'GRID_16_16', label: 'Grid 16x16' },
				{ id: 'GRID_32_32', label: 'Grid 32x32' },
				{ id: 'GRID_CUSTOM', label: 'Grid Custom' },
				{ id: 'SMPTE', label: 'SMPTE' },
				{ id: 'BURST_H', label: 'Horizontal Burst' },
				{ id: 'BURST_V', label: 'Vertical Burst' },
				{ id: 'VERTICAL_GRADIENT', label: 'Vertical Gradient' },
				{ id: 'HORIZONTAL_GRADIENT', label: 'Horzontal Gradient' },
				{ id: 'CROSSHATCH', label: 'Crosshatch' },
				{ id: 'CHECKERBOARD', label: 'Checkerboard' },
				{ id: 'MOVING', label: 'Moving Lines' },
				{ id: 'ID', label: 'ID' },
				{ id: 'SOFTEDGE', label: 'Softedge' },
			],
			default: 'NO_PATTERN',
			isVisible: (options) => {
				return options.group === 'outputList'
			},
		}
	]

	actions['deviceTestpatterns'] = {
		name: 'Set Testpattern',
		options: deviceTestpatternsOptions,
		callback: (action) => {
			if (action.options.group === 'all') {
				const idx = deviceTestpatternsOptions.findIndex((option) => {
					return option?.id === 'group'
				})
				deviceTestpatternsOptions[idx].choices
				.filter((choice) => { return choice.id !== 'all' })
				.forEach((group) => {
					deviceTestpatternsOptions.find((option) => option.id === group.id)?.choices
					.forEach((choice) => {
						connection.sendWSmessage(['device', group.id, 'items', choice.id, 'pattern', 'control', 'pp', 'inhibit'], true)
						connection.sendWSmessage(['device', group.id, 'items', choice.id, 'pattern', 'control', 'pp', 'type'],
							deviceTestpatternsOptions.find((option) => option.id === group.id + 'Pat')?.choices[0]?.id ?? ''
						)
					} )
				})
			} else {
				connection.sendWSmessage(
					[
						'device',
						action.options.group,
						'items',
						action.options[action.options.group],
						'pattern',
						'control',
						'pp',
						'type',
					],
					action.options[`${action.options.group}Pat`]
				)
				const inhibit =
					action.options[`${action.options.group}Pat`] === 'NONE' ||
					action.options[`${action.options.group}Pat`] === 'NO_PATTERN'
						? true
						: false
				connection.sendWSmessage(
					[
						'device',
						action.options.group,
						'items',
						action.options[action.options.group],
						'pattern',
						'control',
						'pp',
						'inhibit',
					],
					inhibit
				)
			}
		},
	} as AWJaction<DeviceTestpatterns>


	/**
	 * MARK: Adjust GPO
	 */
	type DeviceGPO = {gpo: number, action: number}
	actions['deviceGPO'] = {
		name: 'Set GPO',
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
				id: 'action',
				type: 'dropdown',
				label: 'Action',
				choices: [
					{ id: 0, label: 'Turn off' },
					{ id: 1, label: 'Turn on' },
					{ id: 2, label: 'Toggle' },
				],
				default: 2,
			},
		],
		callback: (action) => {
			let newstate = false
			if (action.options.action === 1) {
				newstate = true
			} else if (action.options.action === 2) {
				newstate = !state.get([
					'DEVICE', 'device', 'gpio',
					'gpoList', 'items', action.options.gpo.toString(),
					'control', 'pp', 'activate',
				])
			}
			connection.sendWSmessage(
				['device', 'gpio', 'gpoList', 'items', action.options.gpo.toString(), 'control', 'pp', 'activate'],
				newstate
			)
		},
	} as AWJaction<DeviceGPO>

	/**
	 * MARK: Device Power
	 */
	type DevicePower = {action : string}
	actions['devicePower'] = {
		name: 'Device Power',
		options: [
			{
				id: 'action',
				type: 'dropdown',
				label: 'Power',
				choices: [
					{ id: 'on', label: 'Switch on (Wake on LAN)' },
					{ id: 'off', label: 'Switch to Power off' },
					{ id: 'reboot', label: 'Reboot' },
				],
				default: 'reboot',
			},
		],
		callback: (action) => {
			const path = 'device/system/shutdown/cmd/pp/xRequest'

			if (action.options.action === 'on' || action.options.action === 'wake') {
				const mac = instance.config.macaddress.split(/[,:-_.\s]/).join('')
				connection.wake(mac)
				connection.resetReconnectInterval()
			}
			else if (action.options.action === 'off') {
				connection.sendWSmessage(path, 'SHUTDOWN')
			}
			else if (action.options.action === 'reboot') {
				connection.sendWSmessage(path, 'REBOOT')
			}
		},
	} as AWJaction<DevicePower>

	return actions
}
