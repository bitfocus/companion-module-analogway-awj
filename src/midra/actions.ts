import {AWJinstance} from '../index.js'

import {
	CompanionActionEvent,
	CompanionInputFieldDropdown,
	SomeCompanionActionInputField,
} from '@companion-module/base'
import { InstanceStatus } from '@companion-module/base'
import Actions from '../awjdevice/actions.js'

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

export default class ActionsMidra extends Actions {


	readonly actionsToUse = [
		'deviceScreenMemory',
		'deviceAuxMemory',
		'deviceMasterMemory',
		// 'deviceLayerMemory',
		'deviceMultiviewerMemory',
		'deviceCutScreen',
		'deviceTbar',
		'deviceTakeTime',
		'deviceSelectSource',
		'deviceInputKeying',
		'deviceInputFreeze',
		'deviceInputPlug',
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
		'deviceAudioRouteBlock',
		'deviceAudioRouteChannels',
		'deviceTimerSetup',
		'deviceTimerAdjust',
		'deviceTimerTransport',
		'deviceTestpatterns',
		'cstawjcmd',
		'cstawjgetcmd',
		'devicePower'
	]
	
	constructor (instance: AWJinstance) {
		super(instance)
		this.instance = instance
		this.init()
	}


	/**
	 *  MARK: Recall Screen Memory Midra
	 */
	get deviceScreenMemory(): AWJaction<{ screens: string[], preset: string, memory: string, selectScreens: boolean}>  {
		
		const deviceScreenMemory  = super.deviceScreenMemory

		deviceScreenMemory.options[0]['choices'] = [{ id: 'sel', label: 'Selected' }, ...this.choices.getScreenChoices()]
		deviceScreenMemory.callback = (action) => {
			const screens = this.choices.getChosenScreens(action.options.screens)
			const preset = this.choices.getPresetSelection(action.options.preset, true)
			for (const screen of screens) {
				const path = [
					'device',
					'preset',
					'bank',
					'control',
					'load',
					'slotList',
					'items',
					action.options.memory,
					'screenList',
					'items',
					screen.replaceAll(/\D/g, ''),
					'presetList',
					'items',
					preset,
					'pp',
					'xRequest',
				]
				if (this.choices.isLocked(screen, preset)) continue
				this.connection.sendWSmessage(path,false, true)
				this.instance.sendXupdate()

				if (action.options.selectScreens) {
					if (this.state.syncSelection) {
						this.connection.sendWSdata('REMOTE', 'replace', '/live/screens/screenAuxSelection', [screens])
					} else {
						this.state.set('LOCAL/screenAuxSelection/keys', screens)
						this.instance.checkFeedbacks('liveScreenSelection')
					}
				}
			}
		}

		return deviceScreenMemory
	}
		
	// MARK: recall Aux memory
	get deviceAuxMemory() {
		const deviceAuxMemory = super.deviceAuxMemory
		
		deviceAuxMemory.callback = (action) => {
			const screens = this.choices.getChosenAuxes(action.options.screens as string[])
			const preset = this.choices.getPresetSelection(action.options.preset as string, true)
			for (const screen of screens) {
				if (this.choices.isLocked(screen, preset)) continue
				const fullpath = [
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
				]
				this.connection.sendWSmessage( fullpath, false, true)
				this.instance.sendXupdate()

				if (action.options.selectScreens) {
					if (this.state.syncSelection) {
						this.connection.sendWSdata('REMOTE', 'replace', '/live/screens/screenAuxSelection', [screens])
					} else {
						this.state.set('LOCAL/screenAuxSelection/keys', screens)
						this.instance.checkFeedbacks('liveScreenSelection')
					}
				}
			}
		}

		return deviceAuxMemory
	}

	/**
	 * MARK: Recall Master Memory
	 */
	//type DeviceMasterMemory = {preset: string, memory: string, selectScreens: boolean}
	get deviceMasterMemory_common() {
		
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
	 * MARK: Recall Master Memory - Midra
	 */
	get deviceMasterMemory() {
		
		const deviceMasterMemory = super.deviceMasterMemory
		
		deviceMasterMemory.callback = (action) => {
			const preset = this.choices.getPresetSelection(action.options.preset, true)
			const bankpath = ['device', 'preset', 'masterBank']
			const list = 'slotList'
			const memorypath = ['items', action.options.memory]
			const loadpath = ['control', 'load', 'slotList']

			const filterpath = this.state.getUnmapped(['DEVICE', ...bankpath, list, ...memorypath, 'status', 'pp', 'isShadow']) ? ['status', 'shadow', 'pp'] : ['status', 'pp']			
			
			const screens = [
				...this.state.getUnmapped([
					'DEVICE',
					...bankpath,
					list,
					...memorypath,
					...filterpath,
					'screenFilter',
				]).map((scr: string) => 'S' + scr),
				...this.state.getUnmapped([
					'DEVICE',
					...bankpath,
					list,
					...memorypath,
					...filterpath,
					'auxFilter',
				]).map((scr: string) => 'A' + scr)
			]

			if (
				screens.some((screen: string) => {
					return this.choices.isLocked(screen, preset)
				})
			) {
				return // TODO: resembles original WebRCS behavior, but could be also individual screen handling
			}
			// if (this.choices.isLocked(layer.screenAuxKey, preset)) continue
			const fullpath = [
				...bankpath,
				...loadpath,
				...memorypath,
				'presetList',
				'items',
				preset,
				'pp',
				'xRequest',
			]
			this.connection.sendWSmessage( fullpath, false, true )
			this.instance.sendXupdate()

			if (action.options.selectScreens) {
				if (this.state.syncSelection) {
					this.connection.sendWSdata('REMOTE', 'replace', '/live/screens/screenAuxSelection', [screens])
				} else {
					this.state.set('LOCAL/screenAuxSelection/keys', screens)
					this.instance.checkFeedbacks('liveScreenSelection')
				}
			}




		}

		return deviceMasterMemory
	}

	/**
	 * MARK: Recall Multiviewer Memory
	 */
	get deviceMultiviewerMemory() {
		const deviceMultiviewerMemory = super.deviceMultiviewerMemory

		deviceMultiviewerMemory.callback = (action) => {
			const fullpath = [
				'device',
				'multiviewer',
				'bankList',
				'control',
				'load',
				'slotList',
				'items',
				action.options.memory,
				'pp',
				'xRequest',
			]

			this.connection.sendWSmessage( fullpath, false, true)
				
		}

		return deviceMultiviewerMemory
	}

	/**
	 * MARK: Cut one or multiple screens
	 */
	get deviceCutScreen() {
		const deviceCutScreen = super.deviceCutScreen

		deviceCutScreen.callback = (action) => {
			for (const screen of this.choices.getChosenScreenAuxes(action.options.screens)) {
				this.connection.sendWSmessage(
					[
						...(screen.startsWith('A') ? this.constants.auxGroupPath : this.constants.screenGroupPath),
						'items', 
						screen.replaceAll(/\D/g, ''), 
						'control', 
						'pp', 
						'xCut'
					], 
					true
				)
			}
		}

		return deviceCutScreen
	}

	/**
	 * MARK: Set T-Bar Position
	 */
	get deviceTbar() {		
		const deviceTbar = super.deviceTbar

		deviceTbar.callback =  async (action) => {
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
					this.connection.sendWSmessage(
						[
							...(screen.startsWith('A') ? this.constants.auxGroupPath : this.constants.screenGroupPath),
							'items', 
							screen.replaceAll(/\D/g, ''), 
							'control', 
							'pp', 
							'tbarPosition'
						], 
						tbarint
					)
				}
			}
		}

		return deviceTbar
	}

	/**
	 * MARK: Change the transition time of a preset per screen - Midra
	 */
	get deviceTakeTime() {
		const deviceTakeTime = super.deviceTakeTime

		deviceTakeTime.callback = (action) => {
			const time = action.options.time * 10
			this.choices.getChosenScreenAuxes(action.options.screens).forEach((screen) =>
				this.connection.sendWSmessage(
					[
						...(screen.startsWith('A') ? this.constants.auxGroupPath : this.constants.screenGroupPath),
						'items', 
						screen.replaceAll(/\D/g, ''), 
						'control', 
						'pp', 
						'takeTime'
					],
					time
				)
			)
		}

		return deviceTakeTime
	}

	// MARK: Select the source in a layer midra
	get deviceSelectSource() {
		const deviceSelectSource = super.deviceSelectSource

		deviceSelectSource.callback = (action) => {
			if (action.options.method === 'spec') {
				for (const screen of action.options.screen) {
					if (this.choices.isLocked(screen, action.options.preset)) continue
					const presetpath = [
						'device', 
						screen.startsWith('A') ? 'auxiliaryScreenList' : 'screenList',
						'items', screen.replaceAll(/\D/g, ''), 
						'presetList', 'items', this.choices.getPreset(screen, action.options.preset)
					]
					if (screen.startsWith('A') && action.options['sourceBack'] !== 'keep')
						// on Midra on aux there is only background, so we don't show a layer dropdown and just set the background
						this.connection.sendWSmessage([...presetpath, 'background', 'source', 'pp', 'content'], action.options['sourceBack'])
					else
						// else decide which dropdown to use for which layer
						for (const layer of action.options[`layer${screen}`]) {
							if (layer === 'NATIVE' && action.options['sourceNative'] !== 'keep') {
								this.connection.sendWSmessage([...presetpath, 'background', 'source', 'pp', 'set'], action.options['sourceNative'].replace(/\D/g, ''))
							} else if (layer === 'TOP' && action.options['sourceFront'] !== 'keep') {
								this.connection.sendWSmessage([...presetpath, 'top', 'source', 'pp', 'frame'], action.options['sourceFront'].replace(/\D/g, ''))
							} else if ( action.options['sourceLayer'] !== 'keep') {
								this.connection.sendWSmessage([...presetpath, 'liveLayerList', 'items', layer, 'source', 'pp', 'input'], action.options['sourceLayer'])
							}
						}
				}
			} else if (action.options.method === 'sel') {
				const preset = this.choices.getPresetSelection('sel')
				this.choices.getSelectedLayers()
					.filter((selection) => this.choices.isLocked(selection.screenAuxKey, preset) === false)
					.forEach((layer) => {
						const presetpath = [
							'device', 
							layer.screenAuxKey.startsWith('A') ? 'auxiliaryScreenList' : 'screenList',
							'items', layer.screenAuxKey, 
							'presetList', 'items', this.choices.getPreset(layer.screenAuxKey,'sel')
						]
						if (layer.layerKey === 'BKG' && layer.screenAuxKey.startsWith('S') && action.options['sourceNative'] !== 'keep') {
								this.connection.sendWSmessage([...presetpath, 'background', 'source', 'pp', 'set'], action.options['sourceNative'].replace(/\D/g, ''))
							} else if (layer.layerKey === 'BKG' && layer.screenAuxKey.startsWith('A') && action.options['sourceBack'] !== 'keep') {
								this.connection.sendWSmessage([...presetpath, 'background', 'source', 'pp', 'content'], action.options['sourceBack'])
							} else if (layer.layerKey === 'TOP' && action.options['sourceFront'] !== 'keep') {
								this.connection.sendWSmessage([...presetpath, 'top', 'source', 'pp', 'frame'], action.options['sourceFront'].replace(/\D/g, ''))
							} else if ( action.options['sourceLayer'] !== 'keep') {
								this.connection.sendWSmessage([...presetpath, 'liveLayerList', 'items', layer.layerKey, 'source', 'pp', 'input'], action.options['sourceLayer'])
							}
					})
			}
			this.instance.sendXupdate()
		}

		// don't build a dropdown for aux on midra
		this.choices.getScreensArray().forEach((screen) => {
			
			deviceSelectSource.options.push({
				id: `layer${screen.id}`,
				type: 'multidropdown',
				label: 'Layer ' + screen.id,
				choices: this.choices.getLayerChoices(screen.id),
				default: ['1'],
				isVisibleData: screen.id,
				isVisible: (options, screenId) => {
					return options.method === 'spec' && options.screen.includes(screenId)	
				},
			})
		})
		deviceSelectSource.options.push(
			{
				id: 'sourceNative',
				type: 'dropdown',
				label: 'Screen Background Source',
				choices: [{ id: 'keep', label: "Don't change source"}, ...this.choices.choicesBackgroundSourcesPlusNone],
				default: 'keep',
				isVisible: (options) => {
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
				choices: [{ id: 'keep', label: "Don't change source"}, ...this.choices.getSourceChoices()],
				default: 'keep',
				isVisible: (options) => {
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
				choices: [{ id: 'keep', label: "Don't change source"}, ...this.choices.choicesForegroundImagesSource],
				default: 'keep',
				isVisible: (options) => {
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
				choices: [{ id: 'keep', label: "Don't change source"}, ...this.choices.getAuxBackgroundChoices()],
				default: 'keep',
				isVisible: (options) => {
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

		return deviceSelectSource
	}


	/**
	 * MARK: Set input keying
	 */
	get deviceInputKeying() {
		const deviceInputKeying = super.deviceInputKeying

		deviceInputKeying.callback = (action) => {
			let input = action.options.input.replace('IN_', 'INPUT_')
			this.connection.sendWSmessage(
				[
					'device',
					'inputList',
					'items',
					input,
					'plugList',
					'items',
					this.state.get('DEVICE/device/inputList/items/' + input + '/status/pp/plug'),
					'settings',
					'keying',
					'control',
					'pp',
					'mode',
				],
				action.options.mode
			)
			this.instance.sendXupdate()
		}

		return deviceInputKeying
	}

	/**
	 * MARK: Change input freeze
	 */
	get deviceInputFreeze() {
		const deviceInputFreeze = super.deviceInputFreeze
			
		deviceInputFreeze.callback = (action) => {
			const input = action.options.input.replace('IN_', 'INPUT_')
			let val = false
			if (action.options.mode === 1) {
				val = true
			} else if (action.options.mode === 2) {
				val = !this.state.getUnmapped('DEVICE/device/inputList/items/' + input + '/control/pp/freeze')
			}
			this.connection.sendWSmessage(['device', 'inputList', 'items', input, 'control', 'pp', 'freeze'], val)
		}

		return deviceInputFreeze
	}

	// MARK: Set input plug
	get deviceInputPlug() {
		type DeviceInputPlug = Record<string,string>

		const deviceInputPlug: AWJaction<DeviceInputPlug> = {
			name: 'Set Input Plug',
			options: [
				{
					id: 'input',
					type: 'dropdown',
					label: 'Input',
					choices: this.choices.getLiveInputArray()
						.filter((input) => this.choices.getPlugChoices(input.id).length > 1)
						.map((input) => {
							return {
								id: input.id,
								label: 'Input '+ input.index + (input.label.length ? ' - ' + input.label : '')
							}
						}
					),
					default: this.choices.getLiveInputArray()
						.filter((input) => this.choices.getPlugChoices(input.id).length > 1)
						.map(input => input.id)[0] ?? ''
				},
				...this.choices.getLiveInputArray()
					.filter((input) => this.choices.getPlugChoices(input.id).length > 1)
					.map((input) => {
						const plugs = this.choices.getPlugChoices(input.id)
						return {
							id: 'plugs' + input.id,
							type: 'dropdown' as const,
							label: 'Plug',
							choices: plugs,
							default: plugs[0].id,
							isVisibleData: input.id,
							isVisible: (options, inputId: string) => {return options.input == inputId}
						}
					}
				),

			],
			callback: (action) => {
				this.connection.sendWSmessage([
					'device', 'inputList', 'items',
					action.options.input ?? '',
					'control', 'pp', 'plug'
				], action.options[`plugs${ action.options.input }`] ?? '1')
			}
		}

		return deviceInputPlug
	}


	/**
	 * MARK: Layer position and size
	 */
	get devicePositionSize() {
		const devicePositionSize = super.devicePositionSize
		
		devicePositionSize.options[0] = {
			id: 'screen',
			type: 'dropdown',
			label: 'Screen',
			choices: [{ id: 'sel', label: 'Selected Screen(s)' }, ...this.choices.getScreenChoices()],
			default: 'sel',
		}
		
		return devicePositionSize
		
	}

	// MARK: Set Preset Toggle - Midra
	get devicePresetToggle() {
		const devicePresetToggle = super.devicePresetToggle

		devicePresetToggle.callback = (act) => {
			const allscreens = this.choices.getScreensAuxArray(true).map((itm) => itm.id)
			// device/transition/screenList/items/1/control/pp/enablePresetToggle
			// device/screenGroupList/items/S1/control/pp/copyMode

			let action = act.options.action
			if (action === 'toggle') {
				if (this.state.getUnmapped('DEVICE/device/transition/screenList/items/1/control/pp/enablePresetToggle') === true) action = 'off'
				else action = 'on'
			}
			if (action === 'on') allscreens.forEach((screen: string) =>
				this.connection.sendWSmessage('device/transition/screenList/items/' + screen.replace(/\D/g, '') + '/control/pp/enablePresetToggle', true))
			if (action === 'off') allscreens.forEach((screen: string) =>
				this.connection.sendWSmessage('device/transition/screenList/items/' + screen.replace(/\D/g, '') + '/control/pp/enablePresetToggle', false))
		}

		return devicePresetToggle
	}

	/**
	 *MARK:  Select Multiviewer Widget - Midra
	*/
	get remoteMultiviewerSelectWidget() {
		const remoteMultiviewerSelectWidget = super.remoteMultiviewerSelectWidget

		remoteMultiviewerSelectWidget.callback = (action) => {
			const mvw = action.options.widget?.split(':')[0] ?? '1'
			const widget = action.options.widget?.split(':')[1] ?? '0'
			let widgetSelection: Record<'mocOutputLogicKey' | 'widgetKey', string>[] = []
			if (this.state.syncSelection) {
				widgetSelection = [...this.state.getUnmapped('REMOTE/live/multiviewer/widgetSelection/widgetKeys').map((key: string) => {return {widgetKey: key, mocOutputLogicKey: '1'}})]
			} else {
				widgetSelection = [...this.state.getUnmapped('LOCAL/widgetSelection/widgetIds')]
			}
			const idx = widgetSelection.findIndex((elem) => {
				return elem.widgetKey == widget && elem.mocOutputLogicKey == mvw
			})

			if ((action.options.sel === 'deselect' || action.options.sel === 'toggle') && idx >= 0) {
				widgetSelection.splice(idx, 1)
			} else if ((action.options.sel === 'select' || action.options.sel === 'toggle') && idx < 0) {
				widgetSelection.push({ widgetKey: widget, mocOutputLogicKey: mvw })
			} else if (action.options.sel === 'selectExclusive') {
				widgetSelection = [{ widgetKey: widget, mocOutputLogicKey: mvw }]
			}

			if (this.state.syncSelection) {
				this.connection.sendWSdata('REMOTE', 'replace', '/live/multiviewer/widgetSelection', [widgetSelection.map((itm: {widgetKey: string}) => itm.widgetKey)])
			} else {
				this.state.set('LOCAL/widgetSelection/widgetIds', widgetSelection)
				this.instance.checkFeedbacks('remoteWidgetSelection')
			}
		}

		return remoteMultiviewerSelectWidget
	}

	/**
	 * MARK: Select the source in a multiviewer widget - Livepremier
	 */
	get deviceMultiviewerSource() {	
		const deviceMultiviewerSource = super.deviceMultiviewerSource

		deviceMultiviewerSource.callback = (action) => {
			let widgetSelection: Record<'mocOutputLogicKey' | 'widgetKey', string>[] = []
			if (action.options.widget === 'sel') {
				if (this.state.syncSelection) {
					widgetSelection = [...this.state.getUnmapped('REMOTE/live/multiviewer/widgetSelection/widgetKeys').map((key: string) => {return {widgetKey: key, mocOutputLogicKey: '1'}})]
				} else {
					widgetSelection = [...this.state.getUnmapped('LOCAL/widgetSelection/widgetIds')]
				}
			} else {
				widgetSelection = [
					{
						widgetKey: action.options.widget.split(':')[1] ?? '0',
						mocOutputLogicKey: action.options.widget.split(':')[0] ?? '1',
					},
				]
			}
			for (const widget of widgetSelection) {
				this.connection.sendWSmessage(
					[
						'device',
						'multiviewer',
						'widgetList', 'items', widget.widgetKey,
						'control',
						'pp',
						'source',
					],
					action.options.source
				)
			}
		}

		return deviceMultiviewerSource
	}

	/**
	 * MARK: Select Layer locally or remote - Midra
	 */
	get selectLayer() {
		const selectLayer = super.selectLayer
		
		selectLayer.callback = (action) => {
			type Key = Record<'screenAuxKey' | 'layerKey', string>
			let ret: Key[] = []
			if (action.options.method?.endsWith('tgl')) {
				if (this.state.syncSelection) {
					ret = this.state.getUnmapped('REMOTE/live/screens/layerSelection/layerIds')
						.map((key: Key) => {
							return {
								screenAuxKey: key.screenAuxKey.replace(/(?<!^)\D/g, ''), 
								layerKey: key.layerKey.replace(/LIVE_/, '').replace(/BKG/, 'NATIVE')
							}
						})
				} else {
					ret = this.state.getUnmapped('LOCAL/layerIds')
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
							return lay['screenAuxKey'] === screen && lay['layerKey'] === layer
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
				// {"channel":"REMOTE","data":{"name":"replace","path":"/live/screens/layerSelection","args":[[{"screenAuxKey":"SCREEN_2","layerKey":"LIVE_1"}]]}}
				this.connection.sendWSdata('REMOTE', 'replace', '/live/screens/layerSelection', [
					ret.map((key: Key) => {
						return {
							screenAuxKey: this.choices.getScreenInfo(key.screenAuxKey).platformLongId, 
							layerKey: key.layerKey == 'NATIVE' ? 'BKG' : key.layerKey.replace(/(\d+)/, 'LIVE_$1')
						}
					})
				])
			} else {
				this.state.set('LOCAL/layerIds', ret)
				this.instance.checkFeedbacks('remoteLayerSelection')
			}
		}

		return selectLayer
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

		const audioOutputChoices =  this.choices.getAudioCustomBlockChoices()
		const audioInputChoices = this.choices.getAudioInputChoices()

		const deviceAudioRouteBlock: AWJaction<DeviceAudioRouteBlock> = {
			name: 'Route Audio (Block)',
			options: [
				{
					type: 'dropdown',
					label: 'Device',
					id: 'device',
					choices: [],
					default: '1',
					isVisible: () => {return false},
				},
				{
					type: 'dropdown',
					label: 'First Output Channel',
					id: 'out1',
					choices: audioOutputChoices,
					default: audioOutputChoices[0]?.id,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'First Input Channel',
					id: 'in1',
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
			callback: (action) => {
				const outstart = audioOutputChoices.findIndex((item) => {
					return item.id === action.options.out1
				})
				const instart = audioInputChoices.findIndex((item) => {
					return item.id === action.options.in1
				})
				if (outstart > -1 && instart > -1) {
					const max = Math.min(
						audioOutputChoices.length - outstart,
						audioInputChoices.length - instart,
						action.options.blocksize
					) // since 'None' is input at index 0 no extra test is needed, it is possible to fill all outputs with none
					const routings: Record<string, string[]> = {}
					for (let s = 0; s < max; s += 1) {
						const sink = audioOutputChoices[outstart + s].id
						const source = audioInputChoices[instart === 0 ? 0 : instart + s].id
						const block = sink.toString().split(':')[0]
						const channel = sink.toString().split(':')[1]
						if (!routings[block]) {
							routings[block] = [...this.state.getUnmapped('DEVICE/device/audio/custom/sourceList/items/' + block + '/control/pp/channelMapping')] as string[]
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
						this.connection.sendWSmessage(path, routings[block])
					})
				} else {
					console.error("%s can't be found in available outputs or %s can't be found in available inputs", action.options.out1, action.options.in1)
				}
			}
		}
		
		return deviceAudioRouteBlock
	}

	/**
	 * MARK: Route audio channels
	 */
	get deviceAudioRouteChannels() {
		type DeviceAudioRouteChannels = {device: number, out1: string, in1: string[], out2?: string, in2?: string[], out3?: string, in3?: string[], out4?: string, in4?: string[]}

		const audioOutputChoices =  this.choices.getAudioCustomBlockChoices()
		const audioInputChoices = this.choices.getAudioInputChoices()
		
		const deviceAudioRouteChannels: AWJaction<DeviceAudioRouteChannels> = {
			name: 'Route Audio (Channels)',
			options: [
				{
					type: 'dropdown',
					label: 'Device',
					id: 'device',
					choices: [],
					default: 1,
					isVisible: () => {return false},
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
			callback: (action) => {
				let inputlist = ['NONE']
				if (action.options.in1?.length > 0) {
					inputlist = action.options.in1
				}
				const outstart = audioOutputChoices.findIndex((item) => {
					return item.id === action.options.out1
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
							routings[block] = [...this.state.getUnmapped('DEVICE/device/audio/custom/sourceList/items/' + block + '/control/pp/channelMapping')] as string[]
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
						this.connection.sendWSmessage(path, routings[block])
					})
				}
			}
		}

		return deviceAudioRouteChannels
	}

	/**
	 * MARK: Setup timer - Midra
	 */
	get deviceTimerSetup() {
		const deviceTimerSetup = super.deviceTimerSetup

		deviceTimerSetup.callback = (action) => {
			this.connection.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'pp', 'type'],
				action.options.type
			)
			if (action.options.type === 'CURRENTTIME') {
				this.connection.sendWSmessage(
					['device', 'timerList', 'items', action.options.timer, 'control', 'pp', 'currentTimeMode'],
					action.options.currentTimeMode
				)
			} else {
				this.connection.sendWSmessage(
					['device', 'timerList', 'items', action.options.timer, 'control', 'pp', 'unitMode'],
					action.options.unitMode
				)
			}

		}

		// Color setup is not available at Midra
		const hidden = () => { return false }
		deviceTimerSetup.options[4].isVisible = hidden
		deviceTimerSetup.options[5].isVisible = hidden

		return deviceTimerSetup
	}

	/**
	 * MARK: Choose Testpatterns - Midra
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
					{ id: 'outputList', label: 'Output' },
				],
				default: 'outputList',
			},
			{
				id: 'screenList',
				type: 'dropdown',
				label: 'Screen',
				choices: this.choices.getScreenChoices(),
				default: this.choices.getScreenChoices()[0]?.id,
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
		]

		return this.deviceTestpatterns_common(deviceTestpatternsOptions)
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
						{ id: 'on', label: 'Wake up from Standby' },
						{ id: 'standby', label: 'Switch to Standby' },
						{ id: 'off', label: 'Switch to Power off' },
						{ id: 'reboot', label: 'Reboot' },
					],
					default: 'on',
				},
			],
			callback: (action) => {
				const path = 'device/system/shutdown/standby/control/pp/xRequest'

				if (action.options.action === 'on' || action.options.action === 'wake') {
					this.connection.restPOST(this.instance.config.deviceaddr + '/api/tpp/v1/system/wakeup', '')
					this.connection.resetReconnectInterval()
				}
				if (action.options.action === 'standby') {
					this.connection.sendWSmessage(path, 'STANDBY')
					this.instance.updateStatus(InstanceStatus.Ok, 'Standby')
				}
				if (action.options.action === 'off') {
					this.connection.sendWSmessage(path, 'SWITCH_OFF')
				}
				if (action.options.action === 'reboot') {
					this.connection.sendWSmessage('device/system/shutdown/pp/xReboot', false, true)
				}
			}
		}

		return devicePower
	}


}
