import {AWJinstance} from '../index.js'

import Choices, { Choicemeta } from './choices.js'
import {
	CompanionActionDefinitions,
	CompanionActionEvent,
	CompanionInputFieldDropdown,
	DropdownChoice,
	DropdownChoiceId,
	SomeCompanionActionInputField,
} from '@companion-module/base'
import { Config } from '../config.js'
import { compileExpression } from '@nx-js/compiler-util'
import { AWJconnection } from '../connection.js'
import { splitRgb } from '@companion-module/base'
import { StateMachine } from '../state.js'
import Constants from './constants.js'

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

type SomeAWJactionInputfield<T> = { isVisible?: ((options: AWJoptionValues<T>, [string]?: any) => boolean) }
	& DistributiveOmit<SomeCompanionActionInputField, 'isVisible'>

type ActionEvent<T> = Omit<CompanionActionEvent, 'options'> & {
	options: AWJoptionValues<T>
}

type AWJoptionValues<T> = T

// const XUPDATE = '{"channel":"DEVICE","data":{"path":"device/screenGroupList/control/pp/xUpdate","value":true}}'
// const XUPDATEmidra = '{"channel":"DEVICE","data":{"path":"device/preset/control/pp/xUpdate","value":true}}'

export default class Actions {
	instance: AWJinstance
	state!: StateMachine
	connection!: AWJconnection
	config!: Config
	choices!: Choices
	constants!: typeof Constants
	screens!: Choicemeta[]

	readonly actionsToUse = [
		'deviceScreenMemory',
		'deviceAuxMemory',
		'deviceMasterMemory',
		'deviceMultiviewerMemory',
		'deviceLayerMemory',
		'deviceTakeScreen',
		'deviceCutScreen',
		'deviceTbar',
		'deviceTakeTime',
		'deviceSelectSource',
		'deviceInputKeying',
		'deviceInputFreeze',
		'deviceLayerFreeze',
		'deviceScreenFreeze',
		'devicePositionSize',
		'deviceCopyProgram',
		'devicePresetToggle',
		'remoteMultiviewerSelectWidget',
		'deviceMultiviewerSource',
		'selectScreen',
		'lockScreen',
		'selectPreset',
		'selectLayer',
		'remoteSync',
		'deviceStreamControl',
		'deviceStreamAudioMute',
		'deviceAudioRouteBlock_livepremier',
		'deviceAudioRouteBlock_midra',
		'deviceAudioRouteChannels_livepremier',
		'deviceAudioRouteChannels_midra',
		'deviceTimerSetup_livepremier',
		'deviceTimerSetup_midra',
		'deviceTimerAdjust',
		'deviceTimerTransport',
		'deviceTestpatterns_livepremier',
		'deviceTestpatterns_midra',
		'cstawjcmd',
		'cstawjgetcmd',
		'devicePower_livepremier',
		'devicePower_midra'
	]
	
	constructor (instance: AWJinstance) {
		this.instance = instance
		this.init()
	}

	protected init() {
		this.state = this.instance.state
		this.connection = this.instance.connection
		this.config = this.instance.config
		this.choices = this.instance.choices
		this.constants = this.instance.constants
		this.screens = this.choices.getScreensAuxArray()
	}

	/**
	 * Object with all exported action definitions
	 */
	get allActions() {
		const actionDefinitions: CompanionActionDefinitions = Object.fromEntries(
            this.actionsToUse.map((key) => [key, this[key]])
        )
        
        return actionDefinitions
	}

	/**
	 *  MARK: Recall Screen Memory Common
	 */
	get deviceScreenMemory()  {
		const returnAction: AWJaction<{ screens: string[], preset: string, memory: string, selectScreens: boolean}> = {
			name: 'Recall Screen Memory',
			options: [
				{
					id: 'screens',
					type: 'multidropdown',
					label: 'Screen',
					choices: [{ id: 'sel', label: 'Selected' }],
					default: ['sel'],
				},
				{
					id: 'preset',
					type: 'dropdown',
					label: 'Preset',
					choices: [{ id: 'sel', label: 'Selected' }, ...this.choices.choicesPreset],
					default: 'sel',
				},
				{
					id: 'memory',
					type: 'dropdown',
					label: 'Screen Memory',
					choices: this.choices.getScreenMemoryChoices(),
					default: this.choices.getScreenMemoryChoices()[0]?.id ?? '',
				},
				{
					id: 'selectScreens',
					type: 'checkbox',
					label: 'Select screens after load',
					default: true,
				},
			],
			callback: () => {
			},
		}

		return returnAction
	}

	/**
	 * MARK: Recall Layer Memory
	 */
	get deviceLayerMemory() {
		type DeviceLayerMemory = { method: string, screen: string[], preset: string, layer: string[], memory: string }
		
		const returnAction: AWJaction<DeviceLayerMemory> = {
			name: 'Recall Layer Memory',
			options: [
				{
					id: 'method',
					type: 'dropdown',
					label: 'Method',
					choices: [
						{ id: 'spec', label: 'Use Specified Layers' },
						{ id: 'sel', label: 'Use Selected Layers' },
					],
					default: 'spec',
				},
				{
					id: 'screen',
					type: 'multidropdown',
					label: 'Screen / Aux',
					choices: this.choices.getScreenAuxChoices(),
					default: [this.choices.getScreenAuxChoices()[0]?.id],
					isVisible: (options) => {
						return options.method === 'spec'
					},
				},
				{
					id: 'preset',
					type: 'dropdown',
					label: 'Preset',
					choices: [{ id: 'sel', label: 'Selected' }, ...this.choices.choicesPreset],
					default: 'pvw',
					isVisible: (options) => {
						return options.method === 'spec'
					},
				},
				{
					id: 'layer',
					type: 'multidropdown',
					label: 'Layer',
					choices: this.choices.getLayerChoices(this.constants.maxLayers, true),
					default: ['1'],
					isVisible: (options) => {
						return options.method === 'spec'
					},
				},
				{
					id: 'memory',
					type: 'dropdown',
					label: 'Layer Memory',
					choices: this.choices.getLayerMemoryChoices(),
					default: this.choices.getLayerMemoryChoices()[0]?.id,
				},
			],
			callback: (action) => {
				console.log('LM options', action.options)
				let layers: { screenAuxKey: string; layerKey: string }[] = []
				let preset: string
				if (action.options.method === 'sel') {
					layers = this.choices.getSelectedLayers() ?? []
					preset = this.choices.getPresetSelection('sel', true)
				} else {
					for (const screen of action.options.screen) {
						for (const layer of action.options.layer) {
							layers.push({ screenAuxKey: screen, layerKey: layer })
						}
					}
					preset = this.choices.getPresetSelection(action.options.preset, true)
				}
				for (const layer of layers) {
					if (this.choices.isLocked(layer.screenAuxKey, preset)) continue
					this.connection.sendWSmessage(
						[
							'device',
							'layerBank',
							'control',
							'load',
							'slotList',
							'items',
							action.options.memory,
							layer.screenAuxKey.charAt(0) === 'A' ? this.constants.auxPath[1] : this.constants.screenPath[1],
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
						false, true
					)
				}
				this.instance.sendXupdate()
			},
		}

		return returnAction
	}
		
	// MARK: recall Aux memory
	get deviceAuxMemory() {
		
		const deviceAuxMemory: AWJaction<{ screens: string[], preset: string, memory: string, selectScreens: boolean}> = {
			name: 'Recall Aux Memory',
			options: [
				{
					id: 'screens',
					type: 'multidropdown',
					label: 'Auxscreen',
					choices: [{ id: 'sel', label: 'Selected' }, ...this.choices.getAuxChoices()],
					default: ['sel'],
				},
				{
					id: 'preset',
					type: 'dropdown',
					label: 'Preset',
					choices: [{ id: 'sel', label: 'Selected' }, ...this.choices.choicesPreset],
					default: 'sel',
				},
				{
					id: 'memory',
					type: 'dropdown',
					label: 'Aux Memory',
					choices: this.choices.getAuxMemoryChoices(),
					default: this.choices.getAuxMemoryChoices()[0]?.id ?? '',
				},
				{
					id: 'selectScreens',
					type: 'checkbox',
					label: 'Select screens after load',
					default: true,
				},
			],
			callback: () => {},
		}
	return deviceAuxMemory
	}

	/**
	 * MARK: Recall Master Memory
	 */
	//type DeviceMasterMemory = {preset: string, memory: string, selectScreens: boolean}
	get deviceMasterMemory() {
		
		const deviceMasterMemory: AWJaction<{preset: string, memory: string, selectScreens: boolean}> = {
			name: 'Recall Master Memory',
			options: [
				{
					id: 'preset',
					type: 'dropdown',
					label: 'Preset',
					choices: [{ id: 'sel', label: 'Selected' }, ...this.choices.choicesPreset],
					default: 'sel',
				},
				{
					id: 'memory',
					type: 'dropdown',
					label: 'Master Memory',
					choices: this.choices.getMasterMemoryChoices(),
					default: this.choices.getMasterMemoryChoices()[0]?.id,
				},
				{
					id: 'selectScreens',
					type: 'checkbox',
					label: 'Select screens after load',
					default: true,
				},
			],
			
		}

		return deviceMasterMemory
	}

	/**
	 * MARK: Recall Multiviewer Memory
	 */
	get deviceMultiviewerMemory() {
		
		const deviceMultiviewerMemory: AWJaction<{memory: string, multiviewer: string[]}> = {
			name: 'Recall Multiviewer Memory',
			options: [
				{
					id: 'memory',
					type: 'dropdown',
					label: 'Memory',
					choices: this.choices.getMultiviewerMemoryChoices(),
					default: this.choices.getMultiviewerMemoryChoices()[0]?.id,
				},
			],
			callback: (action) => {
				for (const mv of action.options.multiviewer) {
					const fullpath = [
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
					]
					this.connection.sendWSmessage( fullpath, false, true )

				}
			},
		}
		if (this.choices.getMultiviewerArray().length > 1) {
			deviceMultiviewerMemory.options.push(
				{
					id: 'multiviewer',
					type: 'multidropdown',
					label: 'Multiviewer',
					choices: this.choices.getMultiviewerChoices(),
					default: [this.choices.getMultiviewerArray()?.[0]],
				},
			)
		} else {
			deviceMultiviewerMemory.options.push(
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

		return deviceMultiviewerMemory
	}

	/**
	 * MARK: Take one or multiple screens
	 */
	get deviceTakeScreen() {
		type DeviceTakeScreen = {screens: string[]}
		const deviceTakeScreen: AWJaction<DeviceTakeScreen> = {
			name: 'Take Screen',
			options: [
				{
					id: 'screens',
					type: 'multidropdown',
					label: 'Screens / Auxscreens',
					choices: [
						{ id: 'all', label: 'All' },
						{ id: 'sel', label: 'Selected Screens' },
						...this.choices.getScreenAuxChoices()
					],
					default: ['sel'],
				},
			],
			callback: () => {}, // override
		}
		return deviceTakeScreen
	}

	/**
	 * MARK: Cut one or multiple screens
	 */
	get deviceCutScreen() {
		type DeviceCutScreen = {screens: string[]}
		
		const deviceCutScreen: AWJaction<DeviceCutScreen> = {
			name: 'Cut Screen',
			options: [
				{
					id: 'screens',
					type: 'multidropdown',
					label: 'Screens / Auxscreens',
					choices: [{ id: 'all', label: 'All' }, { id: 'sel', label: 'Selected Screens' }, ...this.choices.getScreenAuxChoices()],
					default: ['sel'],
				},
			],
			callback: (action) => {
				for (const screen of this.choices.getChosenScreenAuxes(action.options.screens)) {
					this.connection.sendWSmessage(
						[
							...(screen.startsWith('A') ? this.constants.auxGroupPath : this.constants.screenGroupPath),
							'items', 
							screen, 
							'control', 
							'pp', 
							'xCut'
						], 
						true
					)
				}
			},
		}

		return deviceCutScreen
	}

	/**
	 * MARK: Set T-Bar Position
	 */
	get deviceTbar() {
		type DeviceTbar = {screens: string[], position: string, maximum: string}
		
		const deviceTbar: AWJaction<DeviceTbar> = {
			name: 'Set T-Bar Position',
			options: [
				{
					id: 'info',
					type: 'static-text',
					label: 'Beware: in WebRCS you always set the T-Bar Position for ALL screens. T-Bar position is never syncronized.',
					value: ''
				},
				{
					id: 'screens',
					type: 'multidropdown',
					label: 'Screens / Auxscreens',
					choices: [{ id: 'all', label: 'All' }, { id: 'sel', label: 'Selected Screens' }, ...this.choices.getScreenAuxChoices()],
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
			callback: async (action) => {
				const position = parseFloat(await this.instance.parseVariablesInString(action.options.position))
				const maximum = parseFloat(await this.instance.parseVariablesInString(action.options.maximum))
				const tbarmax = 65535
				if (typeof position === 'number' && typeof maximum === 'number' && position >= 0 && maximum >= 0) {
					let value = 0.0
					if (position >= maximum) {
						value = 1.0
					} else if (maximum > 0) {
						value = position / maximum
					}
					const tbarint = Math.round(value * tbarmax)
					for (const screen of this.choices.getChosenScreenAuxes(action.options.screens)) {
						this.connection.sendWSmessage([...this.constants.screenGroupPath, 'items', screen, 'control', 'pp', 'tbarPosition'], tbarint)
					}
				}
			},
		}

		return deviceTbar
	}

	/**
	 * MARK: Change the transition time of a preset per screen
	 */
	get deviceTakeTime() {
		type DeviceTakeTime = {screens: string[], preset: string, time: number}
		
		const deviceTakeTime: AWJaction<DeviceTakeTime> = {
			name: 'Set Transition Time',
			options: [
				{
					id: 'screens',
					type: 'multidropdown',
					label: 'Screens / Auxscreens',
					choices: [{ id: 'all', label: 'All' }, { id: 'sel', label: 'Selected Screens' }, ...this.choices.getScreenAuxChoices()],
					default: ['all'],
				},
				{
					id: 'preset',
					type: 'dropdown',
					label: 'Preset',
					choices: [{ id: 'all', label: 'Both' }, ...this.choices.choicesPreset],
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
				this.choices.getChosenScreenAuxes(action.options.screens).forEach((screen) => {
					const presetPgm = this.choices.getPreset(screen, 'PGM')
					if (
						action.options.preset === 'all' ||
						(action.options.preset === 'pgm' && presetPgm === 'A') ||
						(action.options.preset === 'pvw' && presetPgm === 'B')
					) {
						this.connection.sendWSmessage([...this.constants.screenGroupPath, 'items', screen, 'control', 'pp', 'takeDownTime'], time)
					}
					if (
						action.options.preset === 'all' ||
						(action.options.preset === 'pvw' && presetPgm === 'A') ||
						(action.options.preset === 'pgm' && presetPgm === 'B')
					) {
						this.connection.sendWSmessage([...this.constants.screenGroupPath, 'items', screen, 'control', 'pp', 'takeUpTime'], time)
					}
				})
			},
		}

		return deviceTakeTime
	}

	// MARK: Select the source in a layer
	get deviceSelectSource() {
		type DeviceSelectSource = {method: string, screen: string[], preset: string}
		
		const deviceSelectSource: AWJaction<DeviceSelectSource> = {
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
					choices: this.choices.getScreenAuxChoices(),
					default: [this.choices.getScreenAuxChoices()[0]?.id],
					isVisible: (options) => {
						return options.method === 'spec'
					},
				},
				{
					id: 'preset',
					type: 'dropdown',
					label: 'Preset',
					choices: this.choices.choicesPreset,
					default: 'pvw',
					isVisible: (options) => {
						return options.method === 'spec'
					}
				},
			],
			callback: () => {},
		}

		return deviceSelectSource
	}

	/**
	 * MARK: Set input keying
	 */
	get deviceInputKeying() {
		type DeviceInputKeying = {input: string, mode: string}
		
		const deviceInputKeying: AWJaction<DeviceInputKeying> = {
			name: 'Set Input Keying',
			options: [
				{
					id: 'input',
					type: 'dropdown',
					label: 'Input',
					choices: this.choices.getLiveInputChoices(),
					default: this.choices.getLiveInputChoices()[0]?.id,
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
				this.connection.sendWSmessage(
					[
						'device',
						'inputList',
						'items',
						action.options.input,
						'plugList',
						'items',
						this.state.getUnmapped('DEVICE/device/inputList/items/' + action.options.input + '/status/pp/plug'),
						'settings',
						'keying',
						'control',
						'pp',
						'mode',
					],
					action.options.mode
				)
				this.instance.sendXupdate()
			},
		}

		return deviceInputKeying
	}

	/**
	 * MARK: Change input freeze
	 */
	get deviceInputFreeze() {
		type DeviceInputFreeze = {input: string, mode: number}
		
		const deviceInputFreeze: AWJaction<DeviceInputFreeze> = {
			name: 'Set Input Freeze',
			options: [
				{
					id: 'input',
					type: 'dropdown',
					label: 'Input',
					choices: this.choices.getLiveInputChoices(),
					default: this.choices.getLiveInputChoices()[0]?.id,
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
					val = !this.state.getUnmapped('DEVICE/device/inputList/items/' + input + '/control/pp/freeze')
				}
				this.connection.sendWSmessage(['device', 'inputList', 'items', input, 'control', 'pp', 'freeze'], val)
			},
		}

		return deviceInputFreeze
	}

	/**
	 * MARK: Change layer freeze (Midra)
	 */
	get deviceLayerFreeze() {
		type DeviceLayerFreeze = {screen: string[], mode: number}
		
		const deviceLayerFreeze: AWJaction<DeviceLayerFreeze> = {
			name: 'Set Layer Freeze',
			options: [
				{
					id: 'screen',
					type: 'multidropdown',
					label: 'Screen',
					choices: this.choices.getScreenChoices(),
					default: [this.choices.getScreenChoices()[0]?.id],
				},
				...this.choices.getScreensArray().map((screen) => {
					return {
						id: `layerS${screen.index}`,
						type: 'multidropdown' as const,
						label: 'Layer ' + screen.id,
						choices: [{id:'NATIVE', label: 'Background Layer'}, ...this.choices.getLayerChoices(screen.id, false)],
						default: ['1'],
						isVisibleData: screen.id,
						isVisible: (options, screenId) => {
							return options.screen.includes(screenId)
						},
					}
				}),
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
				for (const screen of action.options.screen) {
					const screeninfo = this.choices.getScreenInfo(screen)
					for (const layer of action.options[`layer${screen}`]) {
						let val = false
						let path: string[] = [
							'device', 
							screeninfo.prefixverylong + 'List', 
							'items', screeninfo.numstr, 
						]
						if (layer === 'NATIVE') {
							path.push('background', 'control', 'pp', 'freeze')
						} else {
							path.push('liveLayerList', 'items', layer, 'control', 'pp', 'freeze')
						}
						if (action.options.mode === 1) {
							val = true
						} else if (action.options.mode === 2) {
							val = !this.state.getUnmapped(['DEVICE', ...path])
						}
						this.connection.sendWSmessage(path, val)
					}
				}				
			},
		}

		return deviceLayerFreeze
	}

	/**
	 * MARK: Change screen freeze (Midra)
	 */
	get deviceScreenFreeze() {
		type DeviceScreenFreeze = {screen: string[], mode: number}
		
		const deviceScreenFreeze: AWJaction<DeviceScreenFreeze> = {
			name: 'Set Screen Freeze',
			options: [
				{
					id: 'screen',
					type: 'multidropdown',
					label: 'Screen',
					choices: this.choices.getScreenAuxChoices(),
					default: [this.choices.getScreenAuxChoices()[0]?.id],
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
				for (const screen of action.options.screen) {
					const screeninfo = this.choices.getScreenInfo(screen)
					let val = false
					const path = [
						'device', 
						 screeninfo.prefixverylong + 'List',
						 'items', screeninfo.numstr, 
						 'control', 'pp', 'freeze']
					if (action.options.mode === 1) {
						val = true
					} else if (action.options.mode === 2) {
						val = !this.state.getUnmapped(['DEVICE', ...path])
					}
					this.connection.sendWSmessage(path, val)	
				}				
			},
		} 

		return deviceScreenFreeze

	}

	/**
	 * MARK: Layer position and size
	 */
	get devicePositionSize() {
		type DevicePositionSize = {screen: string, preset: string, layersel: string, parameters: string[], x: string, xAnchor: string, y: string, yAnchor: string, w: string, h: string, ar: string} & Record<string, string>
		type Layer = {screenAuxKey: string, layerKey: string, x: number, y: number, w: number, h: number, isPositionable: boolean, [name: string]: number | string | boolean}
				

		const calculateAr = (widthOrAr: number, height?: number) => {
			let ar: number
			let lowerAr: number
			let upperAr: number
			const knownArs = [
				{value: 16/9,  string:'16/9'},
				{value: 16/10, string:'16/10'},
				{value: 4/3,   string:'4/3'},
				{value: 5/4,   string:'5/4'},
				{value: 21/9,  string:'21/9'},
				{value: 1,     string:'1/1'},
				{value: 2/3,   string:'2/3'},
				{value: 9/16,  string:'9/16'},
				{value: 10/16, string:'10/16'},
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
l1w, l1h, l1x, l1y, l1a: values of the first layer in the selection (leader), you can access all layers' properties with their number
sw: screen width, sh: screen height, sa: screen aspect ratio, layer: layer name, screen: screen name, amount: count of selected layers`
		
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

		const getLayerDimensions = (screenId: string, preset: string, layerId: string) => {
			const screninfo = this.choices.getScreenInfo(screenId)
			const presetKey = this.choices.getPreset(screninfo.id, preset)
			const pathToLayer = [
				...(screninfo.isAux ? this.constants.auxPath : this.constants.screenPath),
				'items', screninfo.platformId,
				'presetList','items',presetKey,
				...this.choices.getLayerPath(layerId)
			]

			if (this.state.getUnmapped(['DEVICE', ...pathToLayer, ...this.constants.propsSizePath]) === undefined) return undefined // this layer does not allow for sizing

			const layer = {
				w: 0,
				h: 0,
				x: 0,
				y: 0,
				wOriginal: 0,
				hOriginal: 0,
				xOriginal: 0,
				yOriginal: 0,
				path: pathToLayer
			}

			layer.w = this.state.getUnmapped(['DEVICE', ...pathToLayer, ...this.constants.propsSizePath, 'sizeH']) ?? 1920
			layer.wOriginal = layer.w
			layer.h = this.state.getUnmapped(['DEVICE', ...pathToLayer, ...this.constants.propsSizePath, 'sizeV']) ?? 1080
			layer.hOriginal = layer.h
			layer.x = (this.state.getUnmapped(['DEVICE', ...pathToLayer, ...this.constants.propsPositionPath, 'posH']) ?? 0) - layer.w / 2
			layer.xOriginal = layer.x
			layer.y = (this.state.getUnmapped(['DEVICE', ...pathToLayer, ...this.constants.propsPositionPath, 'posV']) ?? 0) - layer.h / 2
			layer.yOriginal = layer.y

			return layer
		}

		const getBoundingBox = (layers: Layer[], preset: string) => {
			const boundingBoxes = {}

			for (const layerIndex in layers) {
				const layer: Layer = layers[layerIndex]
				const presetKey = this.choices.getPreset(layer.screenAuxKey, preset)
				const screninfo = this.choices.getScreenInfo(layer.screenAuxKey)

				const laydim = getLayerDimensions(screninfo.id, presetKey, layer.layerKey)
				if (laydim === undefined) {
					layers[layerIndex].isPositionable = false
					continue // this layer does not allow for sizing
				} else {
					layers[layerIndex].isPositionable = true
				}
					
				Object.keys(laydim).forEach((key) => {layer[key] = laydim[key]})

				if (boundingBoxes[layer.screenAuxKey] === undefined ) boundingBoxes[layer.screenAuxKey] = {}
				const box = boundingBoxes[layer.screenAuxKey]
				if (box.x === undefined  || layer.x < box.x) box.x = layer.x
				if (box.y === undefined  || layer.y < box.y) box.y = layer.y
				if (box.right === undefined  || layer.x + layer.w > box.right) box.right = layer.x + layer.w
				if (box.bottom === undefined  || layer.y + layer.h > box.bottom) box.bottom = layer.y + layer.h
			}

			return boundingBoxes
		}

		const getAllLayerValues = (layers: Layer[]) => {
			const count = layers.length
			return layers.reduce((prev, layer, layIdx) => {
					return {
						...prev,
						[`l${layIdx + 1}w`]: layer.w,
						[`l${layIdx + 1}h`]: layer.h,
						[`l${layIdx + 1}x`]: layer.x,
						[`l${layIdx + 1}y`]: layer.y,
						[`l${layIdx + 1}a`]: calculateAr(layer.w, layer.h)?.value ?? 0
					}
				}, {
					sx: 0,
					sy: 0,
					amount: count
				})
		}

		const getLayerContext = (layer: any, layerIndex: string, preset: string, boundingBoxes: ReturnType<typeof getBoundingBox>, allLayerValues: ReturnType<typeof getAllLayerValues>) => {
			const screninfo = this.choices.getScreenInfo(layer.screenAuxKey)
			const presetKey = this.choices.getPreset(layer.screenAuxKey, preset)
			const laydim = getLayerDimensions(screninfo.id, presetKey, layer.layerKey)
			if (laydim === undefined) return // this layer does not allow for sizing
			Object.keys(laydim).forEach((key) => {layer[key] = laydim[key]})

			const screenpath = screninfo.isAux ? this.constants.auxPath : this.constants.screenPath
			const path = [
				...screenpath,
				'items', screninfo.platformId,
				...this.constants.screenSizePath
			]
			const screenWidth = this.state.getUnmapped(['DEVICE', ...path, 'sizeH'])
			const screenHeight = this.state.getUnmapped(['DEVICE', ...path, 'sizeV'])
			
			layer.input = this.state.getUnmapped(['DEVICE', ...layer.path,'source','pp','inputNum']) ?? 'NONE'

			if (layer.input?.match(/^IN/)) {
				layer.inPlug = this.state.getUnmapped(`DEVICE/device/inputList/items/${layer.input}/control/pp/plug`) || '1'
				layer.inWidth = this.state.getUnmapped(`DEVICE/device/inputList/items/${layer.input}/plugList/items/${layer.inPlug}/status/signal/pp/imageWidth`) || 0
				layer.inHeight = this.state.getUnmapped(`DEVICE/device/inputList/items/${layer.input}/plugList/items/${layer.inPlug}/status/signal/pp/imageHeight`) || 0
			} else {
				layer.inWidth = 0
				layer.inHeight = 0
			}
			
			const boxWidth = boundingBoxes[layer.screenAuxKey]?.right - boundingBoxes[layer.screenAuxKey]?.x ?? layer.w
			const boxHeight = boundingBoxes[layer.screenAuxKey]?.bottom - boundingBoxes[layer.screenAuxKey]?.y ?? layer.h

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
				index: layerIndex,
				...allLayerValues
			}
			return context
		}

		const devicePositionSize: AWJaction<DevicePositionSize> = {
			name: 'Set Position and Size',
			options: [
				{
					id: 'screen',
					type: 'dropdown',
					label: 'Screen / Aux',
					choices: [{ id: 'sel', label: 'Selected Screen(s)' }, ...this.choices.getScreenAuxChoices()],
					default: 'sel',
				},
				{
					id: 'preset',
					type: 'dropdown',
					label: 'Preset',
					choices: [{ id: 'sel', label: 'Selected Preset' }, ...this.choices.choicesPreset],
					default: 'sel',
				},
				{
					id: `layersel`,
					type: 'dropdown',
					label: 'Layer',
					tooltip: 'When using "selected layer" and screen or preset are not using "Selected", you can narrow the selection',
					choices: [{ id: 'sel', label: 'Selected Layer(s)' }, ...Array.from({length: this.constants.maxLayers}, (_i, e:number) => {return {id: e+1, label: `Layer ${e+1}`}})],
					default: 'sel',
					isVisible: (options) => {return options.screen === 'sel'},
				},
				...this.screens.map((screen) => {
					return{
						id: `layer${screen.id}`,
						type: 'dropdown' as const,
						label: 'Layer',
						tooltip: 'When using "selected layer" and screen or preset are not using "Selected", you can narrow the selection',
						choices: [{ id: 'sel', label: 'Selected Layer(s)' }, ...this.choices.getLayerChoices(screen.id, false)],
						default: 'sel',
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
					isVisible: (options) => {return options.parameters.includes('x') || options.parameters.includes('w') || options.parameters.includes('h')},
				},
				{
					id: 'yAnchor',
					type: 'textinput',
					label: 'Anchor Y position',
					tooltip,
					default: 'ly + 0.5 * lh',
					useVariables: true,
					isVisible: (options) => {return options.parameters.includes('y') || options.parameters.includes('w') || options.parameters.includes('h')},
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
						layers = this.choices.getSelectedLayers()
					} else {
						layers = [{screenAuxKey: options.screen, layerKey: options.layersel}]
					}
				} else {
					if (options[`layer${options.screen}`] === 'sel') {
						layers = this.choices.getSelectedLayers().filter(layer => layer.screenAuxKey == options.screen)
					} else {
						layers = [{screenAuxKey: options.screen, layerKey: options[`layer${options.screen}`]}]
					}
				}

				if (layers.length === 0) return options

				const [screen, layer] = [layers[0].screenAuxKey, layers[0].layerKey]
				const screeninfo = this.choices.getScreenInfo(screen)
				
				newoptions.screen = screeninfo.id
				newoptions[`layer${screeninfo.id}`] = layer.replace(/^\w+_/, '')
				newoptions.preset = this.choices.getPresetSelection()
				newoptions.xAnchor = 'lx + 0.5 * lw'
				newoptions.yAnchor = 'ly + 0.5 * lh'
				newoptions.parameters = ['x', 'y', 'w', 'h']

				const currentDimensions = getLayerDimensions(screeninfo.id, newoptions.preset, layer)
				if (currentDimensions === undefined) {
					this.instance.log('warn', `Selected layer ${layer} of screen ${screeninfo.id} does not support positioning, position and size couldn't be learned.`)
					return undefined
				}
				
				newoptions.w = currentDimensions.w.toString()
				newoptions.h = currentDimensions.h.toString()
				newoptions.x = (currentDimensions.x + 0.5 * currentDimensions.w).toString()
				newoptions.y = (currentDimensions.y + 0.5 * currentDimensions.h).toString()
				
				newoptions.ar = currentDimensions.h !== 0 ? calculateAr(currentDimensions.w, currentDimensions.h)?.string ?? '' : ''

				return newoptions
			},
			callback: async (action) => {
				type Layer = {screenAuxKey: string, layerKey: string, x: number, y: number, w: number, h: number, isPositionable: boolean, [name: string]: number | string | boolean}
				let layers: Layer[]
				if (action.options.screen === 'sel') {
					if (action.options.layersel === 'sel') {
						layers = this.choices.getSelectedLayers() as Layer[]
					} else {
						layers = [{screenAuxKey: action.options.screen, layerKey: action.options.layersel}] as Layer[]
					}
				} else {
					if (action.options[`layer${action.options.screen}`] === 'sel') {
						layers = this.choices.getSelectedLayers().filter(layer => layer.screenAuxKey == action.options.screen) as Layer[]
					} else {
						layers = [{screenAuxKey: action.options.screen, layerKey: action.options[`layer${action.options.screen}`]}] as Layer[]
					}
				}

				const preset = action.options.preset === 'sel' ? this.choices.getPresetSelection('sel') : action.options.preset
				layers = layers.filter(layer => (!this.choices.isLocked(layer.screenAuxKey, preset) && layer.layerKey.match(/^\d+$/))) // wipe out layers of locked screens and native layer
				if (layers.length === 0) return

				const boundingBoxes = getBoundingBox(layers, preset)

				layers = layers.filter(layer => layer.isPositionable)

				const allLayerValues = getAllLayerValues(layers)
				
				for (const layerIndex in layers) {
					const layer: any = layers[layerIndex]
					const context = getLayerContext(layer, layerIndex, preset, boundingBoxes, allLayerValues )

					if (context === undefined) continue

					const xAnchorPromise = this.instance.parseVariablesInString(action.options.xAnchor)
					const xPromise       = this.instance.parseVariablesInString(action.options.x)
					const yAnchorPromise = this.instance.parseVariablesInString(action.options.yAnchor)
					const yPromise       = this.instance.parseVariablesInString(action.options.y)
					const wPromise       = this.instance.parseVariablesInString(action.options.w)
					const hPromise       = this.instance.parseVariablesInString(action.options.h)
					const arPromise      = this.instance.parseVariablesInString(action.options.ar)

					const [xAnchorParsed, xParsed, yAnchorParsed, yParsed, wParsed, hParsed, arParsed] = await Promise.all([xAnchorPromise, xPromise, yAnchorPromise, yPromise, wPromise, hPromise, arPromise])

					let   xAnchor     = parseExpressionString(xAnchorParsed, context, 0)
					const xPos        = parseExpressionString(xParsed, context, layer.x)
					let   yAnchor     = parseExpressionString(yAnchorParsed, context, 0)
					const yPos        = parseExpressionString(yParsed, context, layer.y)
					const widthInput  = parseExpressionString(wParsed, context, layer.w)
					const heightInput = parseExpressionString(hParsed, context, layer.h)

					let ar: number | undefined
					if (action.options.ar.match(/keep/i)) {
						ar = calculateAr(layer.w, layer.h)?.value ?? 0
					} else {
						ar = parseExpressionString(arParsed, context, calculateAr(layer.w, layer.h)?.value)
					}

					// adjust position according anchor
					let xDif = xPos - xAnchor
					let yDif = yPos - yAnchor

					if (action.options.parameters.includes('x')) {
						layer.x = layer.xOriginal + xDif
						xAnchor = xPos // after movement the destination is new anchor position
					}
					if (action.options.parameters.includes('y')) {
						layer.y = layer.yOriginal + yDif
						yAnchor = yPos // after movement the destination is new anchor position
					}
					
					// do resizing
					// first calculate factors
					let xScale = 1, yScale = 1
					if (action.options.parameters.includes('w') && action.options.parameters.includes('h')) {
						// set new width and height
						layer.w = widthInput
						xScale = layer.w / layer.wOriginal
						layer.h = heightInput
						yScale = layer.h / layer.hOriginal
					} else if (action.options.parameters.includes('w')) {
						// set new width by value, height by ar or leave untouched
						layer.w = widthInput
						xScale = layer.w / layer.wOriginal
						if (ar !== undefined && ar !== 0) {
							layer.h = layer.w / ar
							yScale = layer.h / layer.hOriginal
						}
					} else if (action.options.parameters.includes('h')) {
						// set new height by value, width by ar or leave untouched
						layer.h = heightInput
						yScale = layer.h / layer.hOriginal
						if (ar !== undefined && ar !== 0) {
							layer.w = layer.h * ar
							xScale = layer.w / layer.wOriginal
						}
					}
					// now apply scale to coordinates
					xDif = layer.x - xAnchor
					yDif = layer.y - yAnchor

					layer.x = xAnchor + (xDif * xScale)
					layer.y = yAnchor + (yDif * yScale)

					// console.log('layer', {...layer, widthInput, heightInput, xAnchor, yAnchor, ar, context})

					// send values
					if (Math.round(layer.x + layer.w / 2) !== Math.round(layer.xOriginal + layer.wOriginal / 2)) {
						this.connection.sendWSmessage(
							[...layer.path,'position','pp', 'posH'],
							Math.round(layer.x + layer.w / 2)
						)
					}
					if (Math.round(layer.y + layer.h / 2) !== Math.round(layer.yOriginal + layer.hOriginal / 2)) {
						this.connection.sendWSmessage(
							[...layer.path,'position','pp', 'posV'],
							Math.round(layer.y + layer.h / 2)
						)
					}
					if (layer.w !== layer.wOriginal) {
						this.connection.sendWSmessage(
							[...layer.path,'position','pp', 'sizeH'],
							Math.round(layer.w)
						)
					}
					if (layer.h !== layer.hOriginal) {
						this.connection.sendWSmessage(
							[...layer.path,'position','pp', 'sizeV'],
							Math.round(layer.h)
						)
					}
				}

				this.instance.sendXupdate()
			},
		}

		return devicePositionSize
		
	}

	/**
	 * MARK: Copy preview from program
	 */
	get deviceCopyProgram() {
		type DeviceCopyProgram = {screens: string[]}
		
		const deviceCopyProgram: AWJaction<DeviceCopyProgram> = {
			name: 'Copy Program to Preview',
			options: [
				{
					id: 'screens',
					type: 'multidropdown',
					label: 'Screens / Auxscreens',
					choices: [{ id: 'all', label: 'All' }, { id: 'sel', label: 'Selected Screens' }, ...this.choices.getScreenAuxChoices()],
					default: ['sel'],
				},
			],
			callback: (action) => {
				for (const screen of this.choices.getChosenScreenAuxes(action.options.screens)) {
					if (this.choices.isLocked(screen, 'PREVIEW')) return
					const screeninfo = this.choices.getScreenInfo(screen)
					this.connection.sendWSmessage(
						[
							...(screeninfo.isAux ? this.constants.auxGroupPath : this.constants.screenGroupPath),
							'items', screeninfo.platformId,
							'control', 'pp', 'xCopyProgramToPreview'
						],
						false, 
						true
					)
				}
			},
		}

		return deviceCopyProgram
	}

	// MARK: Set Preset Toggle
	get devicePresetToggle() {
		type DevicePresetToggle = {action: string}
		
		const devicePresetToggle: AWJaction<DevicePresetToggle> = {
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
			callback: () => {}
		}

		return devicePresetToggle
	}

	/**
	 *MARK:  Select Multiviewer Widget
	*/
	get remoteMultiviewerSelectWidget() {
		type RemoteMultiviewerSelectWidget = {widget: string, sel: string}
		
		const remoteMultiviewerSelectWidget: AWJaction<RemoteMultiviewerSelectWidget> = {
			name: 'Multiviewer Widget Selection',
			options: [
				{
					id: 'widget',
					label: 'Widget',
					type: 'dropdown',
					choices: this.choices.getWidgetChoices(),
					default: this.choices.getWidgetChoices()[0]?.id,
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
			callback: () => {},
		}

		return remoteMultiviewerSelectWidget
	}

	/**
	 * MARK: Select the source in a multiviewer widget
	 */
	get deviceMultiviewerSource() {
		type DeviceMultiviewerSource = {widget: string, source: string}
		
		const deviceMultiviewerSource: AWJaction<DeviceMultiviewerSource> = {
			name: 'Select Source in Multiviewer Widget',
			options: [
				{
					id: 'widget',
					label: 'Widget',
					type: 'dropdown',
					choices: [{ id: 'sel', label: 'Selected' }, ...this.choices.getWidgetChoices()],
					default: 'sel',
				},
				{
					id: 'source',
					label: 'Source',
					type: 'dropdown',
					choices: this.choices.getWidgetSourceChoices(),
					default: this.choices.getWidgetSourceChoices()[0]?.id,
				},
			],
			callback: () => {},
		}

		return deviceMultiviewerSource
	}

	/**
	 * MARK: Select / Deselect screens locally or remote
	 */
	get selectScreen() {
		type SelectScreen = {screen: string, sel: number}
		
		const selectScreen: AWJaction<SelectScreen> = {
			name: 'Screen Selection',
			options: [
				{
					id: 'screen',
					label: 'Screen',
					type: 'dropdown',
					choices: this.choices.getScreenAuxChoices(),
					default: this.choices.getScreenAuxChoices()[0]?.id,
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
			callback: (action) => {
				let sel = action.options.sel
				const surface = action.surfaceId ? action.surfaceId : ''
				const id = surface + action.controlId
				if (sel === 6 || (sel === 5 && !id.length )) {
					this.state.setUnmapped('LOCAL/intelligent/screenSelectionRunning', undefined)
					return
				} else if (sel === 4 && id.length) {
					if (this.state.getUnmapped('LOCAL/intelligent/screenSelectionRunning')) {
						sel = 3
					} else {
						this.state.setUnmapped('LOCAL/intelligent/screenSelectionRunning', id)
						sel = 2
					}
				} else if (sel === 5 && id.length) {
					if (this.state.getUnmapped('LOCAL/intelligent/screenSelectionRunning') === id) {
						this.state.setUnmapped('LOCAL/intelligent/screenSelectionRunning', undefined)
					}
					return
				} else if (sel === 4 && !id.length) {
					sel = 2
				}
				const screeninfo = this.choices.getScreenInfo(action.options.screen)
				if (this.state.syncSelection) {
					switch (sel) {
						case 0:
							this.connection.sendWSdata('REMOTE', 'remove', '/live/screens/screenAuxSelection', [screeninfo.platformLongId])
							break
						case 1:
							this.connection.sendWSdata('REMOTE', 'add', '/live/screens/screenAuxSelection', [screeninfo.platformLongId])
							break
						case 2:
							this.connection.sendWSdata('REMOTE', 'replace', '/live/screens/screenAuxSelection', [[screeninfo.platformLongId]])
							break
						case 3:
							this.connection.sendWSdata('REMOTE', 'toggle', '/live/screens/screenAuxSelection', [screeninfo.platformLongId])
							break
					}
				} else {
					const localSelection = this.state.getUnmapped('LOCAL/screenAuxSelection/keys') as string[]
					const idx = localSelection.indexOf(screeninfo.id)
					switch (sel) {
						case 0:
							if (idx >= 0) {
								localSelection.splice(idx, 1)
							}
							break
						case 1:
							if (idx === -1) {
								localSelection.push(screeninfo.id)
							}
							break
						case 2:
								this.state.setUnmapped('LOCAL/screenAuxSelection/keys', [ screeninfo.id ]) 
							break
						case 3:
							if (idx >= 0) {
								localSelection.splice(idx, 1)
							} else {
								localSelection.push(screeninfo.id)
							}
							break
					}
					this.instance.checkFeedbacks('liveScreenSelection')
				}
			},
		}

		return selectScreen
	}

	/**
	 * MARK: lock screens
	 */
	get lockScreen() {
		type LockScreen = {screens: string[], preset: string, lock: string}
		
		const lockScreen: AWJaction<LockScreen> = {
			name: 'Lock Screen',
			options: [
				{
					
					id: 'screens',
					label: 'Screen',
					type: 'multidropdown',
					choices: [{ id: 'all', label: 'ALL' }, { id: 'sel', label: 'Selected' }, ...this.choices.getScreenAuxChoices()],
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
				if (this.state.syncSelection) {
					if (action.options.lock === 'lock' || action.options.lock === 'unlock') {
						const scrs = this.choices.getChosenScreenAuxes(screens)
							.map( screenId => this.choices.getScreenInfo(screenId).platformLongId )
						this.connection.sendWSdata(
							'REMOTE',
							action.options.lock + 'ScreenAuxes' + pst,
							'/live/screens/presetModeLock',
							[scrs]
						)
					} else if (action.options.lock === 'toggle') {
						if (screens.includes('all')) {
							const allscreens = this.choices.getChosenScreenAuxes(screens)
								.map(scr => this.choices.getScreenInfo(scr).platformLongId)
							const allLocked =
								allscreens.find((scr) => {
									return this.state.getUnmapped(['REMOTE', 'live', 'screens', 'presetModeLock', action.options.preset, scr]) === false
								}) === undefined
							let lock = 'lock'
							if (allLocked) {
								lock = 'unlock'
							}
							this.connection.sendWSdata(
								'REMOTE',
								lock + 'ScreenAuxes' + pst,
								'/live/screens/presetModeLock',
								[allscreens]
							)
						} else {
							for (const screen of this.choices.getChosenScreenAuxes(screens)) {
								this.connection.sendWSdata(
									'REMOTE',
									'toggle',
									'/live/screens/presetModeLock/' + action.options.preset,
									[this.choices.getScreenInfo(screen).platformLongId]
								)
							}
						}
					}
				} else {
					const localLocks = this.state.getUnmapped(['LOCAL', 'presetModeLock', action.options.preset])
					if (action.options.lock === 'lock') {
						for (const screen of this.choices.getChosenScreenAuxes(screens)) {
							localLocks[screen] = true
						}
					} else if (action.options.lock === 'unlock') {
						for (const screen of this.choices.getChosenScreenAuxes(screens)) {
							localLocks[screen] = false
						}
					} else if (action.options.lock === 'toggle') {
						if (screens.includes('all')) {
							const allscreens = this.choices.getChosenScreenAuxes('all')
							const allLocked =
								allscreens.find((scr) => {
									return this.state.getUnmapped(['LOCAL', 'presetModeLock', action.options.preset, scr]) === false
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
							for (const screen of this.choices.getChosenScreenAuxes(screens)) {
								localLocks[screen] = localLocks[screen] === true ? false : true
							}
						}
					}
					this.instance.checkFeedbacks('liveScreenLock')
				}
			},
		}

		return lockScreen
	}

	/**
	 * MARK: Select Preset locally or remote
	 */
	get selectPreset() {
		type SelectPreset = {mode: string}
		
		const selectPreset: AWJaction<SelectPreset> = {
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
				if (this.state.syncSelection) {
					switch (action.options.mode) {
						case 'pgm':
							this.connection.sendWSdata('REMOTE', 'set', '/live/screens/presetModeSelection', ['PROGRAM'])
							break
						case 'pvw':
							this.connection.sendWSdata('REMOTE', 'set', '/live/screens/presetModeSelection', ['PREVIEW'])
							break
						case 'tgl':
							this.connection.sendWSdata('REMOTE', 'toggle', '/live/screens/presetModeSelection', [])
							break
					}
				} else {
					switch (action.options.mode) {
						case 'pgm':
							this.state.set('LOCAL/presetMode', 'PROGRAM')
							this.instance.setVariableValues({ selectedPreset: 'PGM' })
							break
						case 'pvw':
							this.state.set('LOCAL/presetMode', 'PREVIEW')
							this.instance.setVariableValues({ selectedPreset: 'PVW' })
							break
						case 'tgl':
							if (this.state.get('LOCAL/presetMode') === 'PREVIEW') {
								this.state.set('LOCAL/presetMode', 'PROGRAM')
								this.instance.setVariableValues({ selectedPreset: 'PGM' })
							} else {
								this.state.set('LOCAL/presetMode', 'PREVIEW')
								this.instance.setVariableValues({ selectedPreset: 'PVW' })
							}
							break
					}
					this.instance.checkFeedbacks('livePresetSelection')
				}
				this.instance.checkFeedbacks('liveScreenSelection', 'remoteLayerSelection')
			},
		}

		return selectPreset
	}

	/**
	 * MARK: Select Layer locally or remote
	 */
	get selectLayer() {
		type SelectLayer = {method: string, screen: string[], layersel: string[]}
		
		const selectLayer: AWJaction<SelectLayer> = {
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
					choices: this.choices.getScreenAuxChoices(),
					default: [this.choices.getScreenAuxChoices()[0]?.id],
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
					choices: this.choices.getLayerChoices(48, true),
					default: ['1'],
					isVisible: (options) => {
						return options.method.startsWith('sel')
					},
				},
			],
			callback: (action) => {
				let ret: Record<'screenAuxKey' | 'layerKey', string>[] = []
				if (action.options.method?.endsWith('tgl')) {
					if (this.state.syncSelection) {
						ret = this.state.get('REMOTE/live/screens/layerSelection/layerIds')
					} else {
						ret = this.state.get('LOCAL/layerIds')
					}
				}
				let scrs: string[] = []
				if (action.options.method?.startsWith('sel')) {
					scrs = this.choices.getSelectedScreens()
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
				if (this.state.syncSelection) {
					this.connection.sendWSdata('REMOTE', 'replace', '/live/screens/layerSelection', [ret])
				} else {
					this.state.set('LOCAL/layerIds', ret)
					this.instance.checkFeedbacks('remoteLayerSelection')
				}
			},
		}
		for (const screen of this.screens) {
			const layerChoices = this.choices.getLayerChoices(screen.id, true)
			let defaultChoice: DropdownChoiceId
			if (layerChoices.find((choice: DropdownChoice) => choice.id === '1')) defaultChoice = '1'
			else defaultChoice = layerChoices[0].id

			selectLayer.options.push({
				id: `layer${screen.id}`,
				type: 'multidropdown',
				label: 'Layer ' + screen.id,
				choices: layerChoices,
				default: [defaultChoice],
				isVisibleData: screen.id,
				isVisible: (options, screenId) => {
					return options.method.startsWith('spec') && options.screen.includes(screenId)
				},
			})
		}

		return selectLayer
	}

	/**
	 * MARK: Switch selection syncronization with device on/off
	 */
	get remoteSync() {
		type RemoteSync = {sync: number}
		
		const remoteSync: AWJaction<RemoteSync> = {
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
				const clients: {id: string}[] = this.state.getUnmapped('REMOTE/system/network/websocketServer/clients') // TODO: handle secure connections
				let syncstate: boolean
				const myid: string = this.state.getUnmapped('LOCAL/socketId')
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
						if (this.state.getUnmapped(`REMOTE/system/network/websocketServer/clients/${myindex}/isRemoteSelectionEnabled`)) {
							syncstate = false
						} else {
							syncstate = true
						}
						break
					default:
						syncstate = false
						break
				}
				this.state.setUnmapped('LOCAL/syncSelection', syncstate)
				this.connection.sendRawWSmessage(
					`{"channel":"REMOTE","data":{"name":"enableRemoteSelection","path":"/system/network/websocketServer/clients/${myindex}","args":[${syncstate}]}}`
				)
				this.instance.checkFeedbacks(
					'livePresetSelection',
					'liveScreenSelection',
					'remoteLayerSelection',
					'liveScreenLock',
					'remoteWidgetSelection'
				)
				
				let preset: string,
					vartext = 'PGM'
				if (syncstate) {
					preset = this.state.getUnmapped('REMOTE/live/screens/presetModeSelection/presetMode')
				} else {
					preset = this.state.getUnmapped('LOCAL/presetMode')
				}
				if (preset === 'PREVIEW') {
					vartext = 'PVW'
				}
				this.instance.setVariableValues({ selectedPreset: vartext })
				
			},
		}

		return remoteSync
	}

	// MARK: Stream Control - Midra
	get deviceStreamControl() {
		type DeviceStreamControl = {stream: string}
		
		const deviceStreamControl: AWJaction<DeviceStreamControl> = {
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
					if (this.state.getUnmapped('DEVICE/device/streaming/status/pp/mode') === 'NONE') action = 'on'
					else if (this.state.getUnmapped('DEVICE/device/streaming/status/pp/mode') === 'LIVE') action = 'off'
					else {
						action = 'doNothing'
						this.instance.log('warn', 'Toggle stream on/off could not be sent because stream is neither running nor stopped (stream state: '+this.state.getUnmapped('DEVICE/device/streaming/status/pp/mode')+')')
					}
				}
				if (action === 'on') {
					this.connection.sendWSmessage('device/streaming/control/pp/start', true)				
				}
				if (action === 'off') {
					this.connection.sendWSmessage('device/streaming/control/pp/start', false)				
				}
			}
		}

		return deviceStreamControl
	}

	// MARK: Stream Audio Mute - Midra
	get deviceStreamAudioMute() {
		type DeviceStreamAudioMute = {stream: string}
		
		const deviceStreamAudioMute: AWJaction<DeviceStreamAudioMute> = {
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
					if (this.state.getUnmapped('DEVICE/device/streaming/control/audio/live/pp/mute')) action = 'on'
					else action = 'off'
				}
				if (action === 'on') this.connection.sendWSmessage('device/streaming/control/audio/live/pp/mute', false)
				if (action === 'off') this.connection.sendWSmessage('device/streaming/control/audio/live/pp/mute', true)
			}
		}

		return deviceStreamAudioMute
	}

	/**
	 * MARK: Route audio block
	 */
	get deviceAudioRouteBlock() {
		type DeviceAudioRouteBlock = {device: number, out1: string, in1: string, out2?: string, in2?: string, out3?: string, in3?: string, out4?: string, in4?: string, blocksize: number}

		const deviceAudioRouteBlock: AWJaction<DeviceAudioRouteBlock> = {
			name: 'Route Audio (Block)',
			options: [
				{
					type: 'dropdown',
					label: 'Device',
					id: 'device',
					choices: this.choices.getLinkedDevicesChoices(),
					default: '1',
					isVisibleData: this.choices.getLinkedDevicesChoices(),
					isVisible: (_opt, choices) => {return choices.length > 1},
					minChoicesForSearch: 3,
				},
				{
					type: 'dropdown',
					label: 'First Output Channel',
					id: 'out1',
					choices: this.choices.getAudioOutputChoices(),
					default: this.choices.getAudioOutputChoices()[0]?.id,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'First Input Channel',
					id: 'in1',
					choices: this.choices.getAudioInputChoices(),
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
					max: this.choices.getAudioInputChoices().length,
					range: true,
				},
			],
		}
		
		return deviceAudioRouteBlock
	}

	/**
	 * MARK: Route audio channels
	 */
	get deviceAudioRouteChannels() {
		type DeviceAudioRouteChannels = {device: number, out1: string, in1: string[], out2?: string, in2?: string[], out3?: string, in3?: string[], out4?: string, in4?: string[]}

		const audioOutputChoices = this.choices.getAudioOutputChoices()
		const audioInputChoices = this.choices.getAudioInputChoices()
		
		const deviceAudioRouteChannels: AWJaction<DeviceAudioRouteChannels> = {
			name: 'Route Audio (Channels)',
			options: [
				{
					type: 'dropdown',
					label: 'Device',
					id: 'device',
					choices: this.choices.getLinkedDevicesChoices(),
					default: 1,
					isVisibleData: this.choices.getLinkedDevicesChoices(),
					isVisible: (_opt, choices) => {return choices.length > 1},
					minChoicesForSearch: 3,
				},
				{
					type: 'dropdown',
					label: '(first) output channel',
					id: 'out1',
					choices: audioOutputChoices,
					default: audioOutputChoices[0]?.id,
					minChoicesForSearch: 0,
				},
				{
					type: 'multidropdown',
					label: 'input channel(s)',
					id: 'in1',
					choices: audioInputChoices,
					default: ['NONE'],
					minChoicesForSearch: 0,
					minSelection: 0,
				},
			],
		}

		return deviceAudioRouteChannels
	}

	/**
	 * MARK: Setup timer
	 */
	get deviceTimerSetup() {
		type DeviceTimerSetup = {timer: string, type: string, currentTimeMode: string, unitMode: string, fg_color: number, bg_color: number}
		
		const deviceTimerSetup: AWJaction<DeviceTimerSetup> = {
			name: 'Timer Setup',
			options: [
				{
					id: 'timer',
					type: 'dropdown',
					label: 'Timer',
					choices: this.choices.getTimerChoices(),
					default: this.choices.getTimerChoices()[0]?.id,
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
					default: `rgba(${splitRgb(this.config.color_bright).r},${splitRgb(this.config.color_bright).g},${splitRgb(this.config.color_bright).b},1)`,
				},
				{
					id: 'bg_color',
					type: 'colorpicker',
					enableAlpha: true,
					returnType: 'string',
					label: 'Background color',
					default: `rgba(${splitRgb(this.config.color_dark).r},${splitRgb(this.config.color_dark).g},${splitRgb(this.config.color_dark).b},0.7)`,
				},
			],
			callback: () => {},
		}

		return deviceTimerSetup
	}

	/**
	 * MARK: Adjust timer
	 */
	get deviceTimerAdjust() {
		type DeviceTimerAdjust = {timer: string, action: string, time: string}
		
		const deviceTimerAdjust: AWJaction<DeviceTimerAdjust> = {
			name: 'Timer Adjust Time',
			options: [
				{
					id: 'timer',
					type: 'dropdown',
					label: 'Timer',
					choices: this.choices.getTimerChoices(),
					default: this.choices.getTimerChoices()[0]?.id,
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
				const type = this.state.getUnmapped(['DEVICE', 'device', 'timerList', 'items', action.options.timer, 'control', 'pp', 'type'])
				if (type === 'CURRENTTIME') {
					timetype = 'timeOffset'
				}
				let time = this.state.getUnmapped(['DEVICE', 'device', 'timerList', 'items', action.options.timer, 'control', 'pp', timetype])
				const inputvalue = await this.instance.parseVariablesInString(action.options.time)
				if (action.options.action === 'add') {
					time += this.instance.timeToSeconds(inputvalue)
				} else if (action.options.action === 'sub') {
					time -= this.instance.timeToSeconds(inputvalue)
				} else if (action.options.action === 'set') {
					time = this.instance.timeToSeconds(inputvalue)
				} else {
					time = 0
				}
				this.connection.sendWSmessage(
					['device', 'timerList', 'items', action.options.timer, 'control', 'pp', timetype],
					time
				)
			},
		}

		return deviceTimerAdjust
	}

	/**
	 * MARK: Play timer
	 */
	get deviceTimerTransport() {
		type DeviceTimerTransport = {timer: string, cmd: string}
		
		const deviceTimerTransport: AWJaction<DeviceTimerTransport> = {
			name: 'Timer Transport',
			options: [
				{
					id: 'timer',
					type: 'dropdown',
					label: 'Timer',
					choices: this.choices.getTimerChoices(),
					default: this.choices.getTimerChoices()[0]?.id,
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
					const timerstate = this.state.get([
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
					const timerstate = this.state.get([
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
				this.connection.sendWSmessage(['device', 'timerList', 'items', action.options.timer, 'control', 'pp', cmd], false, true)
			},
		}

		return deviceTimerTransport
	}

	/**
	 * MARK: Choose Testpatterns
	 */
	deviceTestpatterns_common(deviceTestpatternsOptions: CompanionInputFieldDropdown[]) {
		type DeviceTestpatterns = {group: string, screenList: string, outputList: string, patall: string, screenListPat: string, outputListPat: string, inputList?: string, inputListPat?: string}
		
		const deviceTestpatterns: AWJaction<DeviceTestpatterns> = {
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
							this.connection.sendWSmessage(['device', group.id.toString(), 'items', choice.id.toString(), 'pattern', 'control', 'pp', 'inhibit'], true)
							this.connection.sendWSmessage(['device', group.id.toString(), 'items', choice.id.toString(), 'pattern', 'control', 'pp', 'type'],
								deviceTestpatternsOptions.find((option) => option.id === group.id + 'Pat')?.choices[0]?.id ?? ''
							)
						} )
					})
				} else {
					this.connection.sendWSmessage(
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
					this.connection.sendWSmessage(
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
		}

		return deviceTestpatterns
	}

	/**
	 * MARK: Choose Testpatterns
	 */
	get deviceTestpatterns() {
		
		const deviceTestpatternsOptions: CompanionInputFieldDropdown[] = [
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
				choices: this.choices.getScreenAuxChoices(),
				default: this.choices.getScreenAuxChoices()[0]?.id,
				isVisible: (options) => {
					return options.group === 'screenList'
				},
			},
			{
				id: 'outputList',
				type: 'dropdown',
				label: 'Output',
				choices: this.choices.getOutputChoices(),
				default: this.choices.getOutputChoices()[0]?.id,
				isVisible: (options) => {
					return options.group === 'outputList'
				},
			},
			{
				id: 'inputList',
				type: 'dropdown',
				label: 'Input',
				choices: this.choices.getLiveInputChoices(),
				default: this.choices.getLiveInputChoices()[0]?.id,
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
				],
				default: 'NO_PATTERN',
				isVisible: (options) => {
					return options.group === 'outputList'
				},
			},
		]

		return this.deviceTestpatterns_common(deviceTestpatternsOptions)

	}


	/**
	 * MARK: Send custom AWJ replace command
	 */
	get cstawjcmd() {
		type Cstawjcmd = {path: string, valuetype: string, textValue: string, numericValue: number, booleanValue: boolean, objectValue: string, xUpdate: boolean}
		
		const cstawjcmd: AWJaction<Cstawjcmd> = {
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
					value = await this.instance.parseVariablesInString(action.options.textValue)
				} else if (action.options.valuetype === '2') {
					value = action.options.numericValue
				} else if (action.options.valuetype === '3') {
					if (action.options.booleanValue === true) {
						value = true
					} else {
						value = false
					}
				} else if (action.options.valuetype === '4') {
					value = JSON.parse(await this.instance.parseVariablesInString(action.options.objectValue))
				}
				try {
					//const obj = JSON.parse(action.options.command) // check if the data is a valid json TODO: further validation
					const path = this.instance.AWJtoJsonPath(await this.instance.parseVariablesInString(action.options.path))
					if (path.length > 1) {
						this.connection.sendWSmessage(path, value)
						//this.device.sendRawWSmessage(`{"channel":"DEVICE","data":{"path":${JSON.stringify(path)},"value":${value}}}`)
					}
					if (action.options.xUpdate) {
						this.instance.sendXupdate()
					}
				} catch (error) {
					this.instance.log('warn', 'Custom command transmission failed')
				}
			},
			learn: (action) => {
				const newoptions = {}
				const lastMsg = this.state.getUnmapped('LOCAL/lastMsg')
				const path = lastMsg.path
				const value = lastMsg.value
				if (JSON.stringify(value).length > 132) {
					return undefined
				}
				newoptions['path'] = this.instance.jsonToAWJpath(path)
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
		}

		return cstawjcmd
	}

	/**
	 * MARK: Send custom AWJ get command
	 */
	get cstawjgetcmd() {
		type Cstawjgetcmd = {path: string, variableValue: string | null | undefined, variableType: string | null | undefined}
		
		const cstawjgetcmd: AWJaction<Cstawjgetcmd> = {
			name: 'Send custom AWJ get command',
			tooltip:
				'The "op" parameter is always get. Path is not validated, make sure to use only correct syntax! For your convenience you can use PGM and PVW aditionally to A and B to denote a preset',
			options: [
				{
					type: 'textinput',
					id: 'path',
					label: 'Path to get',
					useVariables: true,
				},
				{
					type: 'custom-variable',
					id: 'variableValue',
					label: 'Variable to store value'
				},
				{
					type: 'custom-variable',
					id: 'variableType',
					label: 'Variable to store type'
				},
			],
			callback: async (action) => {
				let value: string | number | boolean | object= 'undefined'
				let type = 'undefined'
				try {
					//const obj = JSON.parse(action.options.command) // check if the data is a valid json TODO: further validation
					const path = this.instance.AWJtoJsonPath(await this.instance.parseVariablesInString(action.options.path))
					if (path.length > 1) {
						value = this.state.get(['DEVICE', ...path])
						type = typeof value
					}
					
				} catch (error) {
					this.instance.log('warn', 'Custom command get failed')
				}
				if (type === 'null') value = 'null'
				if (type === 'object') value = JSON.stringify(value)
				if (type === 'boolean') value = value ? 1 : 0
				if (typeof value !== 'string') value = value.toString()

				if (typeof action.options.variableValue === 'string') {
					this.instance.setCustomVariableValue(action.options.variableValue, value)
				}
				if (typeof action.options.variableType === 'string') {
					this.instance.setCustomVariableValue(action.options.variableType, type)
				}
			},
			learn: (action) => {
				const newoptions = {}
				const lastMsg = this.state.get('LOCAL/lastMsg')
				const path = lastMsg.path
				const value = lastMsg.value
				if (JSON.stringify(value).length > 132) {
					return undefined
				}
				newoptions['path'] = this.instance.jsonToAWJpath(path)

				return {
					...action.options,
					...newoptions,
				}
			},
		}

		return cstawjgetcmd
	}


	/**
	 * MARK: Device Power
	 */
	get devicePower() {
		type DevicePower = {action : string}
		

		const devicePower: AWJaction<DevicePower> = {
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
					default: 'on',
				},
			],
			callback: (action) => {
				const path = 'device/system/shutdown/cmd/pp/xRequest'

				if (action.options.action === 'on') {
					const mac = this.instance.config.macaddress.split(/[,:-_.\s]/).join('')
					this.connection.wake(mac)
					this.connection.resetReconnectInterval()
				}
				if (action.options.action === 'off') {
					// this.device.sendWSmessage(path + 'pp/wakeOnLan', true)
					// this.device.sendWSmessage(path + 'pp/xRequest', false)
					// this.device.sendWSmessage(path + 'pp/xRequest', true)
					this.connection.sendWSmessage(path, 'SHUTDOWN')
				}
				if (action.options.action === 'reboot') {
					this.connection.sendWSmessage(path, 'REBOOT')
				}
			}
		}

		return devicePower
	}

}
