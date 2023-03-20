import {AWJinstance} from './index'
import { State } from './state'

import {
	choicesBackgroundSourcesPlusNone,
	choicesForegroundImagesSource,
	choicesPreset,
	getAudioCustomBlockChoices,
	getAudioInputChoices,
	getAudioOutputChoices,
	getAuxBackgroundChoices,
	getAuxChoices,
	getAuxMemoryChoices,
	getAuxSourceChoices,
	getLayerChoices,
	getLayerMemoryChoices,
	getLiveInputArray,
	getLiveInputChoices,
	getMasterMemoryChoices,
	getMultiviewerArray,
	getMultiviewerChoices,
	getMultiviewerMemoryChoices,
	getOutputChoices,
	getPlugChoices,
	getScreenAuxChoices,
	getScreenChoices,
	getScreenMemoryChoices,
	getScreensArray,
	getScreensAuxArray,
	getSourceChoices,
	getTimerChoices,
	getWidgetChoices,
	getWidgetSourceChoices,
} from './choices'
import {
	CompanionActionEvent,
	CompanionInputFieldDropdown,
	DropdownChoice,
	DropdownChoiceId,
	SomeCompanionActionInputField,
} from '@companion-module/base'
import { Config } from './config'
import { AWJdevice } from './connection'
import { InstanceStatus, splitRgb } from '@companion-module/base'

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

type Dropdown<t> = {id: t, label: string}

// const XUPDATE = '{"channel":"DEVICE","data":{"path":"device/screenGroupList/control/pp/xUpdate","value":true}}'
// const XUPDATEmidra = '{"channel":"DEVICE","data":{"path":"device/preset/control/pp/xUpdate","value":true}}'


// MARK: getActions
/**
 * Return the object with all companion actions for the instance
 * @param instance reference to the instance itself
 * @returns action object
 */
export function getActions(instance: AWJinstance): any {
	const state: State = instance.state
	const device: AWJdevice = instance.device
	const config: Config = instance.config
	const actions: {[id: string]: AWJaction<any> | undefined} = {}
	const screens = getScreensAuxArray(state)

	/**
	 *  MARK: Recall Screen Memory
	 */
	type DeviceScreenAuxMemory = { screens: string[], preset: string, memory: string, selectScreens: boolean}
	const deviceScreenMemory_livepremier: AWJaction<DeviceScreenAuxMemory> = {
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
			const screens = state.getChosenScreenAuxes(action.options.screens)
			const preset = state.getPresetSelection(action.options.preset, true)
			for (const screen of screens) {
				if (state.isLocked(screen, preset)) continue
				device.sendWSmessage(
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
				device.sendWSmessage(
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
						device.sendRawWSmessage(
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
	}
	const deviceScreenMemory_midra: AWJaction<DeviceScreenAuxMemory> = {
		name: 'Recall Screen Memory',
		options: [
			{
				id: 'screens',
				type: 'multidropdown',
				label: 'Screen',
				choices: [{ id: 'sel', label: 'Selected' }, ...getScreenChoices(state)],
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
			const screens = state.getChosenScreens(action.options.screens)
			const preset = state.getPresetSelection(action.options.preset, true)
			for (const screen of screens) {
				if (state.isLocked(screen, preset)) continue
				device.sendWSmessage(
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
				device.sendWSmessage(
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
						device.sendWSdata('REMOTE', 'replace', 'live/screens/screenAuxSelection', [screens])
					} else {
						state.set('LOCAL/screenAuxSelection/keys', screens)
						instance.checkFeedbacks('liveScreenSelection')
					}
				}
			}
		},
	}

	if (state.platform === 'livepremier') actions['deviceScreenMemory'] = deviceScreenMemory_livepremier
	else if (state.platform === 'midra') actions['deviceScreenMemory'] = deviceScreenMemory_midra
	
	// MARK: recall Aux memory
	const deviceAuxMemory_midra: AWJaction<DeviceScreenAuxMemory> = {
		name: 'Recall Aux Memory',
		options: [
			{
				id: 'screens',
				type: 'multidropdown',
				label: 'Auxscreen',
				choices: [{ id: 'sel', label: 'Selected' }, ...getAuxChoices(state)],
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
				label: 'Aux Memory',
				choices: getAuxMemoryChoices(state),
				default: getAuxMemoryChoices(state)[0]?.id,
			},
			{
				id: 'selectScreens',
				type: 'checkbox',
				label: 'Select screens after load',
				default: true,
			},
		],
		callback: (action) => {
			const screens = state.getChosenAuxes(action.options.screens as string[])
			const preset = state.getPresetSelection(action.options.preset as string, true)
			for (const screen of screens) {
				if (state.isLocked(screen, preset)) continue
				device.sendWSmessage(
					[
						'device',
						'preset',
						'auxBank',
						'control',
						'load',
						'slotList',
						'items',
						action.options.memory,
						'auxiliaryScreenList',
						'items',
						screen.replace(/\D/g, ''),
						'presetList',
						'items',
						preset,
						'pp',
						'xRequest',
					],
					false
				)
				device.sendWSmessage(
					[
						'device',
						'preset',
						'auxBank',
						'control',
						'load',
						'slotList',
						'items',
						action.options.memory,
						'auxiliaryScreenList',
						'items',
						screen.replace(/\D/g, ''),
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
						device.sendWSdata('REMOTE', 'replace', 'live/screens/screenAuxSelection', [screens])
					} else {
						state.set('LOCAL/screenAuxSelection/keys', screens)
						instance.checkFeedbacks('liveScreenSelection')
					}
				}
			}
		},
	}
  if (state.platform === 'midra') actions['deviceAuxMemory'] = deviceAuxMemory_midra

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
			const preset = state.getPresetSelection(action.options.preset, true)
			let screens: string[] = []

			let bankpath = ['device', 'masterPresetBank']
			let list = 'bankList'
			if (state.platform == 'midra') {
				bankpath = ['device', 'preset', 'masterBank']
				list = 'slotList'
			}
			const memorypath = ['items', action.options.memory]
			const loadpath = ['control', 'load', 'slotList']

			const filterpath = state.getUnmapped(['DEVICE', ...bankpath, list, ...memorypath, 'status', 'pp', 'isShadow']) ? ['status', 'shadow', 'pp'] : ['status', 'pp']			
			
			if (state.platform == 'livepremier') {
				screens = state.getUnmapped([
					'DEVICE',
					...bankpath,
					list,
					...memorypath,
					...filterpath,
					'screenFilter',
				])
			} else if (state.platform == 'midra') {
				screens = [
					...state.getUnmapped([
						'DEVICE',
						...bankpath,
						list,
					...memorypath,
						...filterpath,
						'screenFilter',
					]).map((scr: string) => 'S' + scr),
					...state.getUnmapped([
						'DEVICE',
						...bankpath,
						list,
					...memorypath,
						...filterpath,
						'auxFilter',
					]).map((scr: string) => 'A' + scr)
				]
			}
			if (
				screens.find((screen: string) => {
					return state.isLocked(screen, preset)
				})
			) {
				return // TODO: resembles original WebRCS behavior, but could be also individual screen handling
			}
			// if (state.isLocked(layer.screenAuxKey, preset)) continue
			device.sendWSmessage(
				[
					...bankpath,
					...loadpath,
					...memorypath,
					'presetList',
					'items',
					preset,
					'pp',
					'xRequest',
				],
				false
			)

			if (action.options.selectScreens) {
				if (state.syncSelection) {
					device.sendWSdata('REMOTE', 'replace', 'live/screens/screenAuxSelection', [screens])
				} else {
					state.set('LOCAL/screenAuxSelection/keys', screens)
					instance.checkFeedbacks('liveScreenSelection')
				}
			}

			device.sendWSmessage(
				[
					...bankpath,
					...loadpath,
					...memorypath,
					'presetList',
					'items',
					preset,
					'pp',
					'xRequest',
				],
				true
			)

			device.sendXupdate()

		},
	} as AWJaction<DeviceMasterMemory>

	/**
	 * MARK: Recall Layer Memory
	 */
	type DeviceLayerMemory = { method: string, screen: string[], preset: string, layer: string[], memory: string }
	const deviceLayerMemory_livepremier: AWJaction<DeviceLayerMemory> = {
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
				layers = state.getSelectedLayers() ?? []
				preset = state.getPresetSelection('sel', true)
			} else {
				for (const screen of action.options.screen) {
					for (const layer of action.options.layer) {
						layers.push({ screenAuxKey: screen, layerKey: layer })
					}
				}
				preset = state.getPresetSelection(action.options.preset, true)
			}
			for (const layer of layers) {
				if (state.isLocked(layer.screenAuxKey, preset)) continue
				device.sendWSmessage(
					[
						'device',
						'layerBank',
						'control',
						'load',
						'slotList',
						'items',
						action.options.memory,
						'screenList',
						'items',
						layer.screenAuxKey,
						'presetList',
						'items',
						preset,
						'layerList',
						'items',
						layer.layerKey,
						'pp',
						'xRequest',
					],
					false
				)
				device.sendWSmessage(
					[
						'device',
						'layerBank',
						'control',
						'load',
						'slotList',
						'items',
						action.options.memory,
						'screenList',
						'items',
						layer.screenAuxKey,
						'presetList',
						'items',
						preset,
						'layerList',
						'items',
						layer.layerKey,
						'pp',
						'xRequest',
					],
					true
				)
			}
			device.sendXupdate()
		},
	}
	if (state.platform === 'livepremier') actions['deviceLayerMemory'] = deviceLayerMemory_livepremier

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
		],
		callback: (action) => {
			for (const mv of action.options.multiviewer) {
				device.sendWSmessage(
					[
						'device',
						'monitoringBank',
						'control',
						'load',
						'slotList',
						'items',
						action.options.memory,
						'outputList',
						'items',
						mv,
						'pp',
						'xRequest',
					],
					false
				)
				device.sendWSmessage(
					[
						'device',
						'monitoringBank',
						'control',
						'load',
						'slotList',
						'items',
						action.options.memory,
						'outputList',
						'items',
						mv,
						'pp',
						'xRequest',
					],
					true
				)
			}
		},
	} as AWJaction<DeviceMultiviewerMemory>
	if (getMultiviewerArray(state).length > 1) {
		actions['deviceMultiviewerMemory'].options.push(
			{
				id: 'multiviewer',
				type: 'multidropdown',
				label: 'Multiviewer',
				choices: getMultiviewerChoices(state),
				default: [getMultiviewerArray(state)?.[0]],
			},
		)
	} else {
		actions['deviceMultiviewerMemory'].options.push(
			{
				id: 'multiviewer',
				type: 'multidropdown',
				label: 'Multiviewer',
				choices: [{id: '1', label: 'Multiviewer 1'}],
				default: ['1'],
				isVisible: () => false
			},
		)
	}

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
				choices: [{ id: 'all', label: 'All' }, { id: 'sel', label: 'Selected Screens' }, ...getScreenAuxChoices(state)],
				default: ['sel'],
			},
		],
		callback: (action) => {
			let dir = 'xTake'
			for (const screen of state.getChosenScreenAuxes(action.options.screens)) {
				if (state.platform === 'livepremier') {
					dir = 'xTakeUp'
					if (state.getPreset(screen, 'pgm') === 'B') {
						dir = 'xTakeDown'
					}
				}
				device.sendWSmessage(['device', 'screenGroupList', 'items', screen, 'control', 'pp', dir], true)
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
				choices: [{ id: 'all', label: 'All' }, { id: 'sel', label: 'Selected Screens' }, ...getScreenAuxChoices(state)],
				default: ['sel'],
			},
		],
		callback: (action: any) => {
			for (const screen of state.getChosenScreenAuxes(action.options.screens)) {
				device.sendWSmessage(['device', 'screenGroupList', 'items', screen, 'control', 'pp', 'xCut'], true)
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
				choices: [{ id: 'all', label: 'All' }, { id: 'sel', label: 'Selected Screens' }, ...getScreenAuxChoices(state)],
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
				for (const screen of state.getChosenScreenAuxes(action.options.screens)) {
					device.sendWSmessage(['device', 'screenGroupList', 'items', screen, 'control', 'pp', 'tbarPosition'], tbarint)
				}
			}
		},
	} as AWJaction<DeviceTbar>


	/**
	 * MARK: Change the transition time of a preset per screen
	 */
	type DeviceTakeTime = {screens: string[], preset: string, time: number}
	const deviceTakeTime_livepremier: AWJaction<DeviceTakeTime> = {
		name: 'Set Transition Time',
		options: [
			{
				id: 'screens',
				type: 'multidropdown',
				label: 'Screens / Auxscreens',
				choices: [{ id: 'all', label: 'All' }, { id: 'sel', label: 'Selected Screens' }, ...getScreenAuxChoices(state)],
				default: ['all'],
			},
			{
				id: 'preset',
				type: 'dropdown',
				label: 'Preset',
				choices: [{ id: 'all', label: 'Both' }, ...choicesPreset],
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
			state.getChosenScreenAuxes(action.options.screens).forEach((screen) => {
				const presetPgm = state.getPreset(screen, 'PGM')
				if (
					action.options.preset === 'all' ||
					(action.options.preset === 'pgm' && presetPgm === 'A') ||
					(action.options.preset === 'pvw' && presetPgm === 'B')
				) {
					device.sendWSmessage(['device', 'screenGroupList', 'items', screen, 'control', 'pp', 'takeDownTime'], time)
				}
				if (
					action.options.preset === 'all' ||
					(action.options.preset === 'pvw' && presetPgm === 'A') ||
					(action.options.preset === 'pgm' && presetPgm === 'B')
				) {
					device.sendWSmessage(['device', 'screenGroupList', 'items', screen, 'control', 'pp', 'takeUpTime'], time)
				}
			})
		},
	}
	const deviceTakeTime_midra: AWJaction<DeviceTakeTime> = {
		name: 'Set Transition Time',
		options: [
			{
				id: 'screens',
				type: 'multidropdown',
				label: 'Screens / Auxscreens',
				choices: [{ id: 'all', label: 'All' }, { id: 'sel', label: 'Selected Screens' }, ...getScreenAuxChoices(state)],
				default: ['all'],
			},
			{
				id: 'preset',
				type: 'dropdown',
				label: 'Preset',
				choices: [{ id: 'all', label: 'Both' }],
				default: 'all',
				isVisible: () => false
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
			const time = action.options.time * 10
			state.getChosenScreenAuxes(action.options.screens).forEach((screen) =>
				device.sendWSmessage(['device', 'transition', 'screenList', 'items', screen, 'control', 'pp', 'takeTime'], time)
			)
		},
	}

	if (state.platform === 'livepremier') actions['deviceTakeTime'] = deviceTakeTime_livepremier
	else if (state.platform === 'midra') actions['deviceTakeTime'] = deviceTakeTime_midra

	/**
	 * MARK: Select the source in a layer livepremier
	 */
	type DeviceSelectSource = {method: string, screen: string[], preset: string}
	if (state.platform === 'livepremier') {
		const deviceSelectSource_livepremier: AWJaction<DeviceSelectSource> = {
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
					isVisible: (options:  DeviceSelectSource) => {
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
			],
			callback: (action) => {
				if (action.options.method === 'spec') {
					for (const screen of action.options.screen) {
						if (state.isLocked(screen, action.options.preset)) continue
						for (const layer of action.options[`layer${screen}`]) {
							let sourcetype = 'sourceLayer'
							if (screen.startsWith('A')) {
								sourcetype = 'sourceBack'
							}
							if (layer === 'NATIVE') {
								sourcetype = 'sourceNative'
							}
							device.sendWSmessage([
								'device', 'screenList', 'items', screen,
								'presetList', 'items', state.getPreset(screen, action.options.preset),
								'layerList', 'items', layer,
								'source', 'pp', 'inputNum'
							], action.options[sourcetype])
						}
					}
				}
				else if (action.options.method === 'sel') {
					const preset = state.getPresetSelection('sel')
					state.getSelectedLayers()
						.filter((selection) => state.isLocked(selection.screenAuxKey, preset) === false)
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
								device.sendWSmessage([
									'device', 'screenList', 'items', layer.screenAuxKey,
									'presetList', 'items', state.getPreset(layer.screenAuxKey, preset),
									'layerList', 'items', layer.layerKey,
									'source', 'pp', 'inputNum'
								], source)
							}
					})
				}
				device.sendXupdate()
			},
		}
		screens.forEach((screen) => {
			const isScreen = screen.id.startsWith('S')
			// eslint-disable-next-line @typescript-eslint/ban-types
			let visFn = (_action: DeviceSelectSource): boolean => {
				return true
			}
			// make the code more injection proof
			if (screen.id.match(/^S|A\d{1,3}$/)) {
				// eslint-disable-next-line @typescript-eslint/no-implied-eval
				visFn = new Function(
					'thisOptions',
					`return thisOptions.method === 'spec' && thisOptions.screen.includes('${screen.id}')`
				) as (arg0: DeviceSelectSource) => boolean
			}
			deviceSelectSource_livepremier.options.push({
				id: `layer${screen.id}`,
				type: 'multidropdown',
				label: 'Layer ' + screen.id,
				choices: getLayerChoices(state, screen.id, isScreen),
				default: ['1'],
				isVisible: visFn,
			})
		})
		deviceSelectSource_livepremier.options.push(
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
		)
		actions['deviceSelectSource'] = deviceSelectSource_livepremier
	}
	// MARK: Select the source in a layer midra
	else if (state.platform === 'midra') {
		const deviceSelectSource_midra: AWJaction<DeviceSelectSource> = {
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
					isVisible: (options) => {
						return options.method === 'spec'
					},
				},
				{
					id: 'preset',
					type: 'dropdown',
					label: 'Preset',
					choices: choicesPreset,
					default: 'pvw',
					isVisible: (options) => {
						return options.method === 'spec'
					}
				},
			],
			callback: (action) => {
				if (action.options.method === 'spec') {
					for (const screen of action.options.screen) {
						if (state.isLocked(screen, action.options.preset)) continue
						const presetpath = ['device', 'screenList', 'items', screen, 'presetList', 'items', state.getPreset(screen, action.options.preset)]
						if (screen.startsWith('A') && action.options['sourceBack'] !== 'keep')
							// on Midra on aux there is only background, so we don't show a layer dropdown and just set the background
							device.sendWSmessage([...presetpath, 'background', 'source', 'pp', 'content'], action.options['sourceBack'])
						else
							// else decide which dropdown to use for which layer
							for (const layer of action.options[`layer${screen}`]) {
								if (layer === 'NATIVE' && action.options['sourceNative'] !== 'keep') {
									device.sendWSmessage([...presetpath, 'background', 'source', 'pp', 'set'], action.options['sourceNative'].replace(/\D/g, ''))
								} else if (layer === 'TOP' && action.options['sourceFront'] !== 'keep') {
									device.sendWSmessage([...presetpath, 'top', 'source', 'pp', 'frame'], action.options['sourceFront'].replace(/\D/g, ''))
								} else if ( action.options['sourceLayer'] !== 'keep') {
									device.sendWSmessage([...presetpath, 'liveLayerList', 'items', layer, 'source', 'pp', 'input'], action.options['sourceLayer'])
								}
							}
					}
				} else if (action.options.method === 'sel') {
					const preset = state.getPresetSelection('sel')
					state.getSelectedLayers()
						.filter((selection) => state.isLocked(selection.screenAuxKey, preset) === false)
						.forEach((layer) => {
							const presetpath = ['device', 'screenList', 'items', layer.screenAuxKey, 'presetList', 'items', state.getPreset(layer.screenAuxKey, 'sel')]
							if (layer.layerKey === 'BKG' && layer.screenAuxKey.startsWith('S') && action.options['sourceNative'] !== 'keep') {
									device.sendWSmessage([...presetpath, 'background', 'source', 'pp', 'set'], action.options['sourceNative'].replace(/\D/g, ''))
								} else if (layer.layerKey === 'BKG' && layer.screenAuxKey.startsWith('A') && action.options['sourceBack'] !== 'keep') {
									device.sendWSmessage([...presetpath, 'background', 'source', 'pp', 'content'], action.options['sourceBack'])
								} else if (layer.layerKey === 'TOP' && action.options['sourceFront'] !== 'keep') {
									device.sendWSmessage([...presetpath, 'top', 'source', 'pp', 'frame'], action.options['sourceFront'].replace(/\D/g, ''))
								} else if ( action.options['sourceLayer'] !== 'keep') {
									device.sendWSmessage([...presetpath, 'liveLayerList', 'items', layer.layerKey, 'source', 'pp', 'input'], action.options['sourceLayer'])
								}
						})
				}
				device.sendXupdate()
			},
		}
		const screens = getScreensArray(state) // don't build a dropdown for aux on midra
		screens.forEach((screen) => {
			// eslint-disable-next-line @typescript-eslint/ban-types
			let visFn = (_arg0: any): boolean => {
				return true
			}
			// make the code more injection proof
			if (screen.id.match(/^S|A\d{1,3}$/)) {
				// eslint-disable-next-line @typescript-eslint/no-implied-eval
				visFn = new Function(
					'thisOptions',
					`return thisOptions.method === 'spec' && thisOptions.screen.includes('${screen.id}')`
				) as (arg0: any) => boolean
			}
			
			deviceSelectSource_midra.options.push({
				id: `layer${screen.id}`,
				type: 'multidropdown',
				label: 'Layer ' + screen.id,
				choices: getLayerChoices(state, screen.id),
				default: ['1'],
				isVisible: visFn,
			})
		})
		deviceSelectSource_midra.options.push(
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
				id: 'sourceLayer',
				type: 'dropdown',
				label: 'Screen Layer Source',
				choices: [{ id: 'keep', label: "Don't change source"}, ...getSourceChoices(state)],
				default: 'keep',
				isVisible: (options:  AWJoptionValuesExtended<DeviceSelectSource>) => {
					if (options.method === 'sel') return true
					for (const screen of options.screen) {
						if (
							options[`layer${screen}`]?.find((layer: string) => {
								return layer.match(/^\d+$/)
							})
						) return true
					}
					return false
				},
			},
			{
				id: 'sourceFront',
				type: 'dropdown',
				label: 'Screen Foreground Source',
				choices: [{ id: 'keep', label: "Don't change source"}, ...choicesForegroundImagesSource],
				default: 'keep',
				isVisible: (options:  AWJoptionValuesExtended<DeviceSelectSource>) => {
					if (options.method === 'sel') return true
					if (options.method === 'spec') {
						for (const screen of options.screen.filter((screen) => screen.startsWith('S'))) {
							if (options[`layer${screen}`].find((elem: string) => elem === 'TOP')) return true
						}
					}
					return false
				},
			},
			{
				id: 'sourceBack',
				type: 'dropdown',
				label: 'Aux Background Source',
				choices: [{ id: 'keep', label: "Don't change source"}, ...getAuxBackgroundChoices(state)],
				default: 'keep',
				isVisible: (options:  AWJoptionValuesExtended<DeviceSelectSource>) => {
					if (options.method === 'sel') return true
					if (options.method === 'spec') {
						for (const screen of options.screen.filter((screen) => screen.startsWith('A'))) {
							if (options[`layer${screen}`].find((elem: string) => elem === 'BKG')) return true
						}
					}
					return false
				},
			},
		)
		actions['deviceSelectSource'] = deviceSelectSource_midra
	}

	// MARK: Set input plug
	type DeviceInputPlug = Record<string,string>
	if (state.platform == 'midra') {
		actions['deviceInputPlug'] = {
			name: 'Set Input Plug',
			options: [],
			callback: (action) => {
				device.sendWSmessage([
					'device', 'inputList', 'items',
					action.options.input ?? '',
					'control', 'pp', 'plug'
				], action.options[`plugs${ action.options.input }`] ?? '1')
			}
		} as AWJaction<DeviceInputPlug>
		const inputoptions: CompanionInputFieldDropdown & {choices: Dropdown<string>[]} = {
			id: 'input',
			type: 'dropdown',
			label: 'Input',
			choices: [],
			default: ''
		}
		inputoptions.choices = getLiveInputArray(state).filter(
			(input) => getPlugChoices(state, input.id).length > 1
		).map(
			(input) => {
				return {
					id: input.id,
					label: 'Input '+ input.index + (input.label.length ? ' - ' + input.label : '')
				}
			}
		)
		inputoptions.default = inputoptions.choices[0].id ?? ''
		actions['deviceInputPlug'].options.push(inputoptions)

		inputoptions.choices.forEach(
			(input: Dropdown<string>) => {
				// eslint-disable-next-line @typescript-eslint/ban-types
				let visFn = (_action: DeviceInputPlug): boolean => {
					return true
				}
				// make the code more injection proof
				if (input.id.match(/^IN(PUT)?_\d{1,3}$/)) {
					// eslint-disable-next-line @typescript-eslint/no-implied-eval
					visFn = new Function(
						'thisOptions',
						`return thisOptions.input.includes('${input.id}')`
					) as (arg0: DeviceInputPlug) => boolean
				}
				const plugs = getPlugChoices(state, input.id)
				actions['deviceInputPlug']?.options.push({
					id: 'plugs' + input.id,
					type: 'dropdown',
					label: 'Plug',
					choices: plugs,
					default: plugs[0].id,
					isVisible: visFn
				})
			}
		)
	}

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
			device.sendWSmessage(
				[
					'device',
					'inputList',
					'items',
					action.options.input,
					'plugList',
					'items',
					state.get('DEVICE/device/inputList/items/' + action.options.input + '/status/pp/plug'),
					'settings',
					'keying',
					'control',
					'pp',
					'mode',
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
			const input = action.options.input
			let val = false
			if (action.options.mode === 1) {
				val = true
			} else if (action.options.mode === 2) {
				val = !state.get('DEVICE/device/inputList/items/' + input + '/control/pp/freeze')
			}
			device.sendWSmessage(['device', 'inputList', 'items', input, 'control', 'pp', 'freeze'], val)
		},
	} as AWJaction<DeviceInputFreeze>

	/**
	 * MARK: Layer position and size
	 */
	type DevicePositionSize = {screen: string, preset: string, parameters: string, x: number, y: number, w: number, h: number} & Record<string, string> 
	if (state.platform === 'livepremier') {
		actions['devicePositionSize'] = {
			name: 'Set Position and Size',
			options: [
				{
					id: 'screen',
					type: 'dropdown',
					label: 'Screen / Aux',
					choices: getScreenAuxChoices(state),
					default: getScreenAuxChoices(state)[0]?.id,
				},
				{
					id: 'preset',
					type: 'dropdown',
					label: 'Preset',
					choices: choicesPreset,
					default: 'pvw',
				},
			],
			callback: (action) => {
				if (state.isLocked(action.options.screen, action.options.preset)) return
				const layer = action.options[`layer${action.options.screen}`]
				const preset = state.getPreset(action.options.screen, action.options.preset)
				if (action.options.parameters.includes('x')) {
					device.sendWSmessage(
						[
							'device',
							'screenList',
							'items',
							action.options.screen,
							'presetList',
							'items',
							preset,
							'layerList',
							'items',
							layer,
							'position',
							'pp',
							'posH',
						],
						action.options.x
					)
				}
				if (action.options.parameters.includes('y')) {
					device.sendWSmessage(
						[
							'device',
							'screenList',
							'items',
							action.options.screen,
							'presetList',
							'items',
							preset,
							'layerList',
							'items',
							layer,
							'position',
							'pp',
							'posV',
						],
						action.options.y
					)
				}
				if (action.options.parameters.includes('w')) {
					device.sendWSmessage(
						[
							'device',
							'screenList',
							'items',
							action.options.screen,
							'presetList',
							'items',
							preset,
							'layerList',
							'items',
							layer,
							'position',
							'pp',
							'sizeH',
						],
						action.options.w
					)
				}
				if (action.options.parameters.includes('h')) {
					device.sendWSmessage(
						[
							'device',
							'screenList',
							'items',
							action.options.screen,
							'presetList',
							'items',
							state.getPreset(action.options.screen, action.options.preset),
							'layerList',
							'items',
							layer,
							'position',
							'pp',
							'sizeV',
						],
						action.options.h
					)
				}

				device.sendXupdate()
			},
		} as AWJaction<DevicePositionSize>
		screens.forEach((screen) => {
			// eslint-disable-next-line @typescript-eslint/ban-types
			let visFn = (_action: any): boolean => {
				return true
			}
			// make the code more injection proof
			if (screen.id.match(/^S|A\d{1,3}$/)) {
				// eslint-disable-next-line @typescript-eslint/no-implied-eval
				visFn = new Function('thisOptions', `return thisOptions.screen === '${screen.id}'`) as (arg0: any) => boolean
			}
			actions['devicePositionSize']?.options.push({
				id: `layer${screen.id}`,
				type: 'dropdown',
				label: 'Layer',
				tooltip: 'When using "selected layer", screen and preset options are ignored',
				choices: getLayerChoices(state, screen.id, false),
				default: '1',
				isVisible: visFn,
			})
		})
		actions['devicePositionSize'].options.push(
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
				type: 'number',
				label: 'X Position',
				default: 0,
				min: -16383,
				max: 16383,
				isVisible: (options) => {
					return options.parameters.includes('x')
				},
			},
			{
				id: 'y',
				type: 'number',
				label: 'Y Position',
				default: 0,
				min: -16383,
				max: 16383,
				isVisible: (options) => {
					return options.parameters.includes('y')
				},
			},
			{
				id: 'w',
				type: 'number',
				label: 'Width',
				default: 0,
				min: -16383,
				max: 16383,
				isVisible: (options) => {
					return options.parameters.includes('w')
				},
			},
			{
				id: 'h',
				type: 'number',
				label: 'Height',
				default: 0,
				min: -16383,
				max: 16383,
				isVisible: (options) => {
					return options.parameters.includes('h')
				},
			}
		)
	}

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
				choices: [{ id: 'all', label: 'All' }, { id: 'sel', label: 'Selected Screens' }, ...getScreenAuxChoices(state)],
				default: ['sel'],
			},
		],
		callback: (action) => {
			for (const screen of state.getChosenScreenAuxes(action.options.screens)) {
				if (state.isLocked(screen, 'PREVIEW')) return
				device.sendWSmessage(
					['device', 'screenGroupList', 'items', screen, 'control', 'pp', 'xCopyProgramToPreview'],
					false
				)
				device.sendWSmessage(
					['device', 'screenGroupList', 'items', screen, 'control', 'pp', 'xCopyProgramToPreview'],
					true
				)
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
			// device/transition/screenList/items/1/control/pp/enablePresetToggle
			// device/screenGroupList/items/S1/control/pp/copyMode
			let property = 'copyMode'
			let invert = true
			if (state.platform === 'midra') {
				property = 'enablePresetToggle'
				invert = false
			}
			let action = act.options.action
			if (action === 'toggle') {
				if (state.get('DEVICE/device/screenGroupList/items/S1/control/pp/'+ property) === !invert) action = 'off'
				else action = 'on'
			}
			if (action === 'on') allscreens.forEach((screen: string) =>
				device.sendWSmessage('device/screenGroupList/items/' + screen + '/control/pp/' + property, invert ? false : true))
			if (action === 'off') allscreens.forEach((screen: string) =>
				device.sendWSmessage('device/screenGroupList/items/' + screen + '/control/pp/' + property, invert ? true : false))
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
				if (state.platform === 'livepremier') widgetSelection = [...state.getUnmapped('REMOTE/live/multiviewers/widgetSelection/widgetIds')]
				if (state.platform === 'midra') widgetSelection = [...state.getUnmapped('REMOTE/live/multiviewer/widgetSelection/widgetKeys').map((key: string) => {return {multiviewerKey: '1', widgetKey: key}})]
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
				if (state.platform === 'livepremier') device.sendWSdata('REMOTE', 'replace', 'live/multiviewers/widgetSelection', [widgetSelection])
				if (state.platform === 'midra') device.sendWSdata('REMOTE', 'replace', 'live/multiviewer/widgetSelection', [widgetSelection.map((itm: {widgetKey: string}) => itm.widgetKey)])
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
				device.sendWSmessage(
					[
						'device',
						'monitoringList',
						'items',
						widget.multiviewerKey,
						'layout',
						'widgetList',
						'items',
						widget.widgetKey,
						'control',
						'pp',
						'source',
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
			console.log('action obj', action)
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
						device.sendWSdata('REMOTE', 'remove', 'live/screens/screenAuxSelection', [screen])
						break
					case 1:
						device.sendWSdata('REMOTE', 'add', 'live/screens/screenAuxSelection', [screen])
						break
					case 2:
						device.sendWSdata('REMOTE', 'replace', 'live/screens/screenAuxSelection', [[screen]])
						break
					case 3:
						device.sendWSdata('REMOTE', 'toggle', 'live/screens/screenAuxSelection', [screen])
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
				choices: [{ id: 'all', label: 'ALL' }, { id: 'sel', label: 'Selected' }, ...getScreenAuxChoices(state)],
				default: ['all'],
				tooltip:
					'If you choose "All" and "Toggle", the behaviour is exactly like in WebRCS, if you choose multiple screens they will be toggled individually',
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
					const screen = state.getChosenScreenAuxes(screens)
					device.sendWSdata(
						'REMOTE',
						action.options.lock + 'ScreenAuxes' + pst,
						'live/screens/presetModeLock',
						[screen]
					)
				} else if (action.options.lock === 'toggle') {
					if (screens.includes('all')) {
						const allscreens = state.getChosenScreenAuxes(screens)
						const allLocked =
							allscreens.find((scr) => {
								return state.get(['REMOTE', 'live', 'screens', 'presetModeLock', action.options.preset, scr]) === false
							}) === undefined
						let lock = 'lock'
						if (allLocked) {
							lock = 'unlock'
						}
						device.sendWSdata(
							'REMOTE',
							lock + 'ScreenAuxes' + pst,
							'live/screens/presetModeLock',
							[allscreens]
						)
					} else {
						for (const screen of state.getChosenScreenAuxes(screens)) {
							device.sendWSdata(
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
					for (const screen of state.getChosenScreenAuxes(screens)) {
						localLocks[screen] = true
					}
				} else if (action.options.lock === 'unlock') {
					for (const screen of state.getChosenScreenAuxes(screens)) {
						localLocks[screen] = false
					}
				} else if (action.options.lock === 'toggle') {
					if (screens.includes('all')) {
						const allscreens = state.getChosenScreenAuxes('all')
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
						for (const screen of state.getChosenScreenAuxes(screens)) {
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
						device.sendRawWSmessage(
							'{"channel":"REMOTE","data":{"name":"set","path":"/live/screens/presetModeSelection","args":["PROGRAM"]}}'
						)
						break
					case 'pvw':
						device.sendRawWSmessage(
							'{"channel":"REMOTE","data":{"name":"set","path":"/live/screens/presetModeSelection","args":["PREVIEW"]}}'
						)
						break
					case 'tgl':
						device.sendRawWSmessage(
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
				scrs = state.getSelectedScreens()
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
				device.sendWSdata('REMOTE', 'replace', 'live/screens/layerSelection', [ret])
			} else {
				state.set('LOCAL/layerIds', ret)
				instance.checkFeedbacks('remoteLayerSelection')
			}
		},
	} as AWJaction<SelectLayer>
	for (const screen of screens) {
		// eslint-disable-next-line @typescript-eslint/ban-types
		let visFn = (_arg0: any): boolean => {
			return true
		}
		// make the code more injection proof
		if (screen.id.match(/^(S|A)\d{1,3}$/)) {
			// eslint-disable-next-line @typescript-eslint/no-implied-eval
			visFn = new Function(
				'thisOptions',
				`return thisOptions.method.startsWith('spec') && thisOptions.screen.includes('${screen.id}')`
			) as (options: any) => boolean
		}
		const layerChoices = getLayerChoices(state, screen.id, true)
		let defaultChoice: DropdownChoiceId
		if (layerChoices.find((choice: DropdownChoice) => choice.id === '1')) defaultChoice = '1'
		else defaultChoice = layerChoices[0].id

		actions['selectLayer']?.options.push({
			id: `layer${screen.id}`,
			type: 'multidropdown',
			label: 'Layer ' + screen.id,
			choices: layerChoices,
			default: [defaultChoice],
			isVisible: visFn,
		})
	}

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
			device.sendRawWSmessage(
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

	// MARK: Stream Control
	type DeviceStreamControl = {stream: string}
	if (state.platform === 'midra') actions['deviceStreamControl'] = {
		name: 'Stream Control',
		options: [
			{
				type: 'dropdown',
				label: 'Action',
				id: 'stream',
				choices: [
					{ id: 'on', label: 'Start Stream'},
					{ id: 'off', label: 'Stop Stream'},
					{ id: 'toggle', label: 'Toggle Stream on/off'},
				],
				default: 'on',
			},
		],
		callback: (act) => {
			let action = act.options.stream
			if (action === 'toggle') {
				if (state.getUnmapped('DEVICE/device/streaming/status/pp/mode') === 'NONE') action = 'on'
				else if (state.getUnmapped('DEVICE/device/streaming/status/pp/mode') === 'LIVE') action = 'off'
				else {
					action = 'doNothing'
					instance.log('warn', 'Toggle stream on/off could not be sent because stream is neither running nor stopped (stream state: '+state.getUnmapped('DEVICE/device/streaming/status/pp/mode')+')')
				}
			}
			if (action === 'on') {
				device.sendWSmessage('device/streaming/control/pp/start', true)				
			}
			if (action === 'off') {
				device.sendWSmessage('device/streaming/control/pp/start', false)				
			}
		}
	} as AWJaction<DeviceStreamControl>

	// MARK: Stream Audio Mute
	type DeviceStreamAudioMute = {stream: string}
	if (state.platform === 'midra') actions['deviceStreamAudioMute'] = {
		name: 'Stream Audio Mute',
		options: [
			{
				type: 'dropdown',
				label: 'Action',
				id: 'stream',
				choices: [
					{ id: 'on', label: 'Unmute'},
					{ id: 'off', label: 'Mute'},
					{ id: 'toggle', label: 'Toggle'},
				],
				default: 'on',
			},
		],
		callback: (act) => {
			let action = act.options.stream
			if (action === 'toggle') {
				if (state.getUnmapped('DEVICE/device/streaming/control/audio/live/pp/mute')) action = 'on'
				else action = 'off'
			}
			if (action === 'on') device.sendWSmessage('device/streaming/control/audio/live/pp/mute', false)
			if (action === 'off') device.sendWSmessage('device/streaming/control/audio/live/pp/mute', true)
		}
	} as AWJaction<DeviceStreamAudioMute>

	/**
	 * MARK: Route audio block
	 */
	type DeviceAudioRouteBlock = {out: string, in: string, blocksize: number}
	let audioOutputChoices: DropdownChoice[] = []
	const audioInputChoices = getAudioInputChoices(state)
	if (state.platform === 'livepremier') audioOutputChoices = getAudioOutputChoices(state)
	if (state.platform === 'midra') audioOutputChoices = getAudioCustomBlockChoices()

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
	} as AWJaction<DeviceAudioRouteBlock>
	if (state.platform === 'livepremier') actions['deviceAudioRouteBlock'].callback = (action: ActionEvent<DeviceAudioRouteBlock>) => {
			const outstart = audioOutputChoices.findIndex((item) => {
				return item.id === action.options.out
			})
			const instart = audioInputChoices.findIndex((item) => {
				return item.id === action.options.in
			})
			if (outstart > -1 && instart > -1) {
				const max = Math.min(
					audioOutputChoices.length - outstart,
					audioOutputChoices.length - instart,
					action.options.blocksize
				) // since 'None' is input at index 0 no extra test is needed, it is possible to fill all outputs with none
				for (let s = 0; s < max; s += 1) {
					const path = [
						'device',
						'audio',
						'control',
						'txList',
						'items',
						audioOutputChoices[outstart + s].id.toString().split(':')[0],
						'channelList',
						'items',
						audioOutputChoices[outstart + s].id.toString().split(':')[1],
						'control',
						'pp',
						'source',
					]
					device.sendWSmessage(path, audioInputChoices[instart === 0 ? 0 : instart + s].id)
				}
			}
	}
	if (state.platform === 'midra') actions['deviceAudioRouteBlock'].callback = (action: ActionEvent<DeviceAudioRouteBlock>) => {
			const outstart = audioOutputChoices.findIndex((item) => {
				return item.id === action.options.out
			})
			const instart = audioInputChoices.findIndex((item) => {
				return item.id === action.options.in
			})
			if (outstart > -1 && instart > -1) {
				const max = Math.min(
					audioOutputChoices.length - outstart,
					audioOutputChoices.length - instart,
					action.options.blocksize
				) // since 'None' is input at index 0 no extra test is needed, it is possible to fill all outputs with none
				const routings: Record<string, string[]> = {}
				for (let s = 0; s < max; s += 1) {
					const sink = audioOutputChoices[outstart + s].id
					const source = audioInputChoices[instart === 0 ? 0 : instart + s].id
					const block = sink.toString().split(':')[0]
					const channel = sink.toString().split(':')[1]
					if (!routings[block]) {
						routings[block] = [...state.getUnmapped('DEVICE/device/audio/custom/sourceList/items/' + block + '/control/pp/channelMapping')] as string[]
					}
					routings[block][parseInt(channel) - 1] = source.toString()

				}
				Object.keys(routings).forEach((block) => {
					const path = [
						'device',
						'audio',
						'custom',
						'sourceList',
						'items',
						block,
						'control',
						'pp',
						'channelMapping',
					]
					device.sendWSmessage(path, routings[block])
				})
			}
		}

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
	} as AWJaction<DeviceAudioRouteChannels>
	if (state.platform === 'livepremier') actions['deviceAudioRouteChannels'].callback = (action: ActionEvent<DeviceAudioRouteChannels>) => {
		if (action.options.in.length > 0) {
			const outstart = audioOutputChoices.findIndex((item) => {
				return item.id === action.options.out
			})
			if (outstart > -1) {
				const max = Math.min(audioOutputChoices.length - outstart, action.options.in.length)
				for (let s = 0; s < max; s += 1) {
					const path = [
						'device',
						'audio',
						'control',
						'txList',
						'items',
						audioOutputChoices[outstart + s].id.toString().split(':')[0],
						'channelList',
						'items',
						audioOutputChoices[outstart + s].id.toString().split(':')[1],
						'control',
						'pp',
						'source',
					]
					device.sendWSmessage(path, action.options.in[s])
				}
			}
		} else {
			const path = [
				'device',
				'audio',
				'control',
				'txList',
				'items',
				action.options.out.split(':')[0],
				'channelList',
				'items',
				action.options.out.split(':')[1],
				'control',
				'pp',
				'source',
			]
			device.sendWSmessage(path, audioInputChoices[0]?.id)
		}
	}
	if (state.platform === 'midra') actions['deviceAudioRouteChannels'].callback = (action: ActionEvent<DeviceAudioRouteChannels>) => {
		let inputlist = ['NONE']
		if (action.options.in?.length > 0) {
			inputlist = action.options.in
		}
		const outstart = audioOutputChoices.findIndex((item) => {
			return item.id === action.options.out
		})
		if (outstart > -1) {
			const max = Math.min(audioOutputChoices.length - outstart, inputlist.length)
			const routings: Record<string, string[]> = {}
			for (let s = 0; s < max; s += 1) {
				const sink = audioOutputChoices[outstart + s].id
				const source = inputlist[s]
				const block = sink.toString().split(':')[0]
				const channel = sink.toString().split(':')[1]
				if (!routings[block]) {
					routings[block] = [...state.getUnmapped('DEVICE/device/audio/custom/sourceList/items/' + block + '/control/pp/channelMapping')] as string[]
				}
				routings[block][parseInt(channel) - 1] = source.toString()

			}
			Object.keys(routings).forEach((block: string) => {
				const path = [
					'device',
					'audio',
					'custom',
					'sourceList',
					'items',
					block,
					'control',
					'pp',
					'channelMapping',
				]
				device.sendWSmessage(path, routings[block])
			})
		}
	}

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
				label: 'Text color',
				default: config.color_bright,
			},
			{
				id: 'bg_color',
				type: 'colorpicker',
				label: 'Background color',
				default: config.color_dark,
			},
		],
		callback: (action) => {
			device.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'pp', 'type'],
				action.options.type
			)
			if (action.options.type === 'CURRENTTIME') {
				device.sendWSmessage(
					['device', 'timerList', 'items', action.options.timer, 'control', 'pp', 'currentTimeMode'],
					action.options.currentTimeMode
				)
			} else {
				device.sendWSmessage(
					['device', 'timerList', 'items', action.options.timer, 'control', 'pp', 'unitMode'],
					action.options.unitMode
				)
			}
			if (state.platform === 'midra') return
			device.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'background', 'color', 'pp', 'red'],
				splitRgb(action.options.bg_color).r
			)
			device.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'background', 'color', 'pp', 'green'],
				splitRgb(action.options.bg_color).g
			)
			device.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'background', 'color', 'pp', 'blue'],
				splitRgb(action.options.bg_color).b
			)
			device.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'text', 'color', 'pp', 'red'],
				splitRgb(action.options.fg_color).r
			)
			device.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'text', 'color', 'pp', 'green'],
				splitRgb(action.options.fg_color).g
			)
			device.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'text', 'color', 'pp', 'blue'],
				splitRgb(action.options.fg_color).b
			)
		},
	} as AWJaction<DeviceTimerSetup>
	if (state.platform === 'midra') {
		const hidden = () => { return false }
		actions['deviceTimerSetup'].options[4].isVisible = hidden
		actions['deviceTimerSetup'].options[5].isVisible = hidden
	}

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
			device.sendWSmessage(
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
			instance.log('debug', `RUNNiNg Action ${JSON.stringify(action)}`)
			let cmd = 'xPause'
			if (action.options.cmd === 'start') {
				cmd = 'xStart'
			} else if (action.options.cmd === 'stop') {
				cmd = 'xStop'
			} else if (action.options.cmd === 'pause') {
				cmd = 'xPause'
			} else if (action.options.cmd === 'tgl_start_pause') {
				const timerstate = state.get([
					'DEVICE',
					'device',
					'timerList',
					'items',
					action.options.timer,
					'status',
					'pp',
					'state',
				])
				if (timerstate === 'RUNNING') {
					cmd = 'xPause'
				} else {
					cmd = 'xStart'
				}
			} else if (action.options.cmd === 'tgl_start_stop') {
				const timerstate = state.get([
					'DEVICE',
					'device',
					'timerList',
					'items',
					action.options.timer,
					'status',
					'pp',
					'state',
				])
				if (timerstate === 'RUNNING' || timerstate === 'ELAPSED') {
					cmd = 'xStop'
				} else {
					cmd = 'xStart'
				}
			}
			device.sendWSmessage(['device', 'timerList', 'items', action.options.timer, 'control', 'pp', cmd], false)
			device.sendWSmessage(['device', 'timerList', 'items', action.options.timer, 'control', 'pp', cmd], true)
		},
	} as AWJaction<DeviceTimerTransport>

	/**
	 * MARK: Choose Testpatterns
	 */
	type DeviceTestpatterns = {group: string, screenList: string, outputList: string, patall: string, screenListPat: string, outputListPat: string, inputList?: string, inputListPat?: string}
	const deviceTestpatternsOptions: (Omit<CompanionInputFieldDropdown, 'choices'> & {choices: Dropdown<string>[]})[] = []
	if (state.platform === 'livepremier') deviceTestpatternsOptions.push(
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
			},
	)

	if (state.platform === 'midra') deviceTestpatternsOptions.push(
		{
			id: 'group',
			type: 'dropdown',
			label: 'Group',
			choices: [
				{ id: 'all', label: 'All' },
				{ id: 'screenList', label: 'Screen Canvas' },
				{ id: 'outputList', label: 'Output' },
			],
			default: 'outputList',
		},
		{
			id: 'screenList',
			type: 'dropdown',
			label: 'Screen',
			choices: getScreenChoices(state),
			default: getScreenChoices(state)[0]?.id,
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
				{ id: 'VERTICAL_COLOR_BAR', label: 'Vertical Colorbars' },
				{ id: 'HORIZONTAL_COLOR_BAR', label: 'Horizontal Colorbars' },
				{ id: 'GRID_CUSTOM', label: 'Grid Custom' },
				{ id: 'SMPTE', label: 'SMPTE' },
				{ id: 'VERTICAL_GRADIENT', label: 'Vertical Gradient' },
				{ id: 'HORIZONTAL_GRADIENT', label: 'Horzontal Gradient' },
				{ id: 'CROSSHATCH', label: 'Crosshatch' },
				{ id: 'CHECKERBOARD', label: 'Checkerboard' },
				{ id: 'SOFTEDGE', label: 'Covering' },
			],
			default: 'NONE',
			isVisible: (options) => {
				return options.group === 'screenList'
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
				{ id: 'CHECKERBOARD', label: 'Checkerboard' },
				{ id: 'SOFTEDGE', label: 'Covering' },
			],
			default: 'NO_PATTERN',
			isVisible: (options) => {
				return options.group === 'outputList'
			},
		},
	)
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
						device.sendWSmessage(['device', group.id, 'items', choice.id, 'pattern', 'control', 'pp', 'inhibit'], true)
						device.sendWSmessage(['device', group.id, 'items', choice.id, 'pattern', 'control', 'pp', 'type'],
							deviceTestpatternsOptions.find((option) => option.id === group.id + 'Pat')?.choices[0]?.id ?? ''
						)
					} )
				})
			} else {
				device.sendWSmessage(
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
				device.sendWSmessage(
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
	 * MARK: Send a custom AWJ command
	 */
	type Cstawjcmd = {path: string, valuetype: string, textValue: string, numericValue: number, booleanValue: boolean, objectValue: string, xUpdate: boolean}
	actions['cstawjcmd'] = {
		name: 'Send custom AWJ replace command',
		tooltip:
			'The "op" parameter is always replace. Paths and values are not validated, make sure to use only correct syntax! For your convenience you can use PGM and PVW aditionally to A and B to denote a preset',
		options: [
			{
				type: 'textinput',
				id: 'path',
				label: 'path',
				useVariables: true,
			},
			{
				type: 'dropdown',
				id: 'valuetype',
				label: 'value is of type',
				choices: [
					{ id: '1', label: 'Text' },
					{ id: '2', label: 'Number' },
					{ id: '3', label: 'Boolean' },
					{ id: '4', label: 'Object' },
				],
				default: '1',
			},
			{
				type: 'textinput',
				id: 'textValue',
				label: 'value',
				useVariables: true,
				isVisible: (options) => options.valuetype === '1',
			},
			{
				type: 'number',
				id: 'numericValue',
				label: 'value',
				isVisible: (options) => options.valuetype === '2',
				default: 0,
				min: -32768,
				max: 32768,
			},
			{
				type: 'checkbox',
				id: 'booleanValue',
				label: 'value',
				isVisible: (options) => options.valuetype === '3',
				default: false
			},
			{
				type: 'textinput',
				id: 'objectValue',
				label: 'value',
				useVariables: true,
				isVisible: (options) => options.valuetype === '4',
			},
			{
				type: 'checkbox',
				id: 'xUpdate',
				label: 'append global Update',
				default: false,
			},
		],
		callback: async (action) => {
			let value: string | number | boolean | string[] = ''
			if (action.options.valuetype === '1') {	
				value = await instance.parseVariablesInString(action.options.textValue)
			} else if (action.options.valuetype === '2') {
				value = action.options.numericValue
			} else if (action.options.valuetype === '3') {
				if (action.options.booleanValue === true) {
					value = true
				} else {
					value = false
				}
			} else if (action.options.valuetype === '4') {
				value = JSON.parse(await instance.parseVariablesInString(action.options.objectValue))
			}
			try {
				//const obj = JSON.parse(action.options.command) // check if the data is a valid json TODO: further validation
				const path = instance.AWJtoJsonPath(await instance.parseVariablesInString(action.options.path))
				if (path.length > 1) {
					device.sendWSmessage(path, value)
					//device.sendRawWSmessage(`{"channel":"DEVICE","data":{"path":${JSON.stringify(path)},"value":${value}}}`)
				}
				if (action.options.xUpdate) {
					device.sendXupdate()
				}
			} catch (error) {
				instance.log('warn', 'Custom command transmission failed')
			}
		},
		learn: (action) => {
			const newoptions = {}
			const lastMsg = state.get('LOCAL/lastMsg')
			const path = lastMsg.path
			const value = lastMsg.value
			if (JSON.stringify(value).length > 132) {
				return undefined
			}
			newoptions['path'] = instance.jsonToAWJpath(path)
			switch (typeof value) {
				case 'string':
					newoptions['valuetype'] = '1'
					newoptions['textValue'] = value
					break
				case 'number':
					newoptions['valuetype'] = '2'
					newoptions['numericValue'] = value
					break
				case 'boolean':
					newoptions['valuetype'] = '3'
					newoptions['booleanValue'] = value
					break
				case 'object':
					newoptions['valuetype'] = '4'
					newoptions['objectValue'] = JSON.stringify(value)
			}

			return {
				...action.options,
				...newoptions,
			}
		},
	} as AWJaction<Cstawjcmd>

	/**
	 * MARK: Adjust GPO
	 */
	type DeviceGPO = {gpo: number, action: number}
	if (state.platform === 'livepremier') actions['deviceGPO'] = {
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
					'DEVICE',
					'device',
					'gpio',
					'gpoList',
					'items',
					action.options.gpo.toString(),
					'control',
					'pp',
					'activate',
				])
			}
			device.sendWSmessage(
				['device', 'gpio', 'gpoList', 'items', action.options.gpo.toString(), 'control', 'pp', 'activate'],
				newstate
			)
		},
	} as AWJaction<DeviceGPO>

	/**
	 * MARK: Device Power
	 */
	type DevicePower = {action : string}
	const devicePowerChoices: DropdownChoice[] = []
	if (state.platform === 'livepremier') devicePowerChoices.push(
		{ id: 'on', label: 'Switch on (Wake on LAN)' },
	)
	if (state.platform === 'midra') devicePowerChoices.push(
		{ id: 'wake', label: 'Wake up from Standby' },
		{ id: 'standby', label: 'Switch to Standby' },
	)
	devicePowerChoices.push(
		{ id: 'off', label: 'Switch to Power off' },
		{ id: 'reboot', label: 'Reboot' },
	)
	actions['devicePower'] = {
		name: 'Device Power',
		options: [
			{
				id: 'action',
				type: 'dropdown',
				label: 'Power',
				choices: devicePowerChoices,
				default: devicePowerChoices[0].id,
			},
		],
		callback: (action) => {
			let path = 'device/system/shutdown/cmd/pp/xRequest'
			if (state.platform === 'midra') path = 'device/system/shutdown/standby/control/pp/xRequest'

			if (action.options.action === 'on') {
				const mac = instance.config.macaddress.split(/[,:-_.\s]/).join('')
				device.wake(mac)
				device.resetReconnectInterval()
			}
			if (action.options.action === 'wake' && state.platform === 'midra') {
				device.restPOST(instance.config.deviceaddr + '/api/tpp/v1/system/wakeup', '')
				device.resetReconnectInterval()
			}
			if (action.options.action === 'standby' && state.platform === 'midra') {
				device.sendWSmessage(path, 'STANDBY')
				instance.updateStatus(InstanceStatus.Ok, 'Standby')
			}
			if (action.options.action === 'off' && state.platform === 'livepremier') {
				// device.sendWSmessage(path + 'pp/wakeOnLan', true)
				// device.sendWSmessage(path + 'pp/xRequest', false)
				// device.sendWSmessage(path + 'pp/xRequest', true)
				device.sendWSmessage(path, 'SHUTDOWN')
			}
			if (action.options.action === 'off' && state.platform === 'midra') {
				device.sendWSmessage(path, 'SWITCH_OFF')
			}
			if (action.options.action === 'reboot' && state.platform === 'livepremier') {
				device.sendWSmessage(path, 'REBOOT')
			}
			if (action.options.action === 'reboot' && state.platform === 'midra') {
				device.sendWSmessage('device/system/shutdown/pp/xReboot', false)
				device.sendWSmessage('device/system/shutdown/pp/xReboot', true)
			}
		},
	} as AWJaction<DevicePower>

	return actions
}
