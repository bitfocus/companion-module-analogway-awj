import {AWJinstance} from '../index.js'

import {
	CompanionActionEvent,
	CompanionInputFieldDropdown,
	SomeCompanionActionInputField,
} from '@companion-module/base'
import { splitRgb } from '@companion-module/base'
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

export default class ActionsLivepremier4 extends Actions {


	readonly actionsToUse = [
		'deviceScreenMemory',
		// 'deviceAuxMemory',
		'deviceMasterMemory',
		'deviceLayerMemory',
		'deviceMultiviewerMemory',
		'deviceTakeScreen',
		'deviceCutScreen',
		'deviceTbar',
		'deviceTakeTime',
		'deviceSelectSource',
		'deviceInputKeying',
		'deviceInputFreeze',
		// 'deviceLayerFreeze',
		// 'deviceScreenFreeze',
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
		// 'deviceStreamControl',
		// 'deviceStreamAudioMute',
		'deviceAudioRouteBlock',
		'deviceAudioRouteChannels',
		'deviceTimerSetup',
		'deviceTimerAdjust',
		'deviceTimerTransport',
		'deviceTestpatterns',
		'cstawjcmd',
		'cstawjgetcmd',
		'deviceGPO',
		'devicePower'
	]
	
	constructor (instance: AWJinstance) {
		super(instance)
		this.instance = instance
		this.init()
	}


	/**
	 * MARK: Take one or multiple screens
	 */
	get deviceTakeScreen() {
		const deviceTakeScreen = super.deviceTakeScreen
		deviceTakeScreen.callback = (action) => {
			let dir = ''
			for (const screen of this.choices.getChosenScreenAuxes(action.options.screens)) {
				let pgm = this.choices.getPreset(screen, 'pgm')
				if (pgm === 'A') {
					dir = 'xTakeUp'
				} else if (pgm === 'B') {
					dir = 'xTakeDown'
				} else {
					return
				}
				this.connection.sendWSmessage(['device', 'screenAuxGroupList', 'items', screen, 'control', 'pp', dir], true)
			}
		}
		return deviceTakeScreen
	}

	/**
	 *  MARK: Recall Screen Memory LivePremier4
	 */
	get deviceScreenMemory(): AWJaction<{ screens: string[], preset: string, memory: string, selectScreens: boolean}> {
		
		const returnAction  = super.deviceScreenMemory

		returnAction.options[0]['choices'] = [{ id: 'sel', label: 'Selected' }, ...this.choices.getScreenAuxChoices()]
		returnAction.callback = (action) => {
			const screens = this.choices.getChosenScreenAuxes(action.options.screens)
			const preset = this.choices.getPresetSelection(action.options.preset, true)
			for (const screen of screens) {
				const path = [
					'device',
					'presetBank',
					'control',
					'load',
					'slotList',
					'items',
					action.options.memory,
					screen.startsWith('A') ? 'auxiliaryList' : 'screenList',
					'items',
					screen,
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

		return returnAction
	}

	/**
	 * MARK: Recall Master Memory - LivePremier4
	 */
	get deviceMasterMemory() {
		
		const deviceMasterMemory = super.deviceMasterMemory
		
		deviceMasterMemory.callback = (action) => {
			const preset = this.choices.getPresetSelection(action.options.preset, true)
			const bankpath = ['device', 'masterPresetBank']
			const list = 'bankList'	
			const memorypath = ['items', action.options.memory]
			const loadpath = ['control', 'load', 'slotList']

			const filterpath = this.state.get(['DEVICE', ...bankpath, list, ...memorypath, 'status', 'pp', 'isShadow']) ? ['status', 'shadow', 'pp'] : ['status', 'pp']			
			
			const screens = this.state.get([
				'DEVICE',
				...bankpath,
				list,
				...memorypath,
				...filterpath,
				'screenFilter',
			])

			const auxScreens = this.state.get([
				'DEVICE',
				...bankpath,
				list,
				...memorypath,
				...filterpath,
				'auxFilter',
			])

			if (
				[...screens, ...auxScreens].some((screen: string) => {
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
					this.connection.sendWSdata('REMOTE', 'replace', '/live/screens/screenAuxSelection', [[...screens, ...auxScreens]])
				} else {
					this.state.set('LOCAL/screenAuxSelection/keys', [...screens, ...auxScreens])
					this.instance.checkFeedbacks('liveScreenSelection')
				}
			}

		}

		return deviceMasterMemory
	}

	/**
	 * MARK: Select the source in a layer livepremier4
	 */
	get deviceSelectSource() {
		const deviceSelectSource = super.deviceSelectSource

		deviceSelectSource.callback = (action) => {
			if (action.options.method === 'spec') {
				for (const screen of action.options.screen) {
					if (this.choices.isLocked(screen, action.options.preset)) continue
					for (const layer of action.options[`layer${screen}`]) {
						let sourcetype = 'sourceLayer'
						if (screen.startsWith('A')) {
							sourcetype = 'sourceBack'
						}
						if (layer === 'NATIVE') {
							sourcetype = 'sourceNative'
						}
						this.connection.sendWSmessage([
							'device', 
							screen.startsWith('A') ? 'auxiliaryList' : 'screenList', 
							'items', screen,
							'presetList', 'items', this.choices.getPreset(screen, action.options.preset),
							'layerList', 'items', layer,
							'source', 'pp', 'inputNum'
						], action.options[sourcetype])
					}
				}
			}
			else if (action.options.method === 'sel') {
				const preset = this.choices.getPresetSelection('sel')
				this.choices.getSelectedLayers()
					.filter((selection) => this.choices.isLocked(selection.screenAuxKey, preset) === false)
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
							this.connection.sendWSmessage([
								'device',
								layer.screenAuxKey.startsWith('A') ? 'auxiliaryList' : 'screenList', 
								'items', layer.screenAuxKey,
								'presetList', 'items', this.choices.getPreset(layer.screenAuxKey, preset),
								'layerList', 'items', layer.layerKey,
								'source', 'pp', 'inputNum'
							], source)
						}
				})
			}
			this.instance.sendXupdate()
		}

		this.choices.getScreensAuxArray().forEach((screen) => {
			const isScreen = screen.id.startsWith('S')
			
			deviceSelectSource.options.push({
				id: `layer${screen.id}`,
				type: 'multidropdown',
				label: 'Layer ' + screen.id,
				choices: this.choices.getLayerChoices(screen.id, isScreen),
				default: ['1'],
				isVisibleData: screen.id,
				isVisible: (options, screenId) => {
					return options.method === 'spec' && options.screen.includes(screenId)
				},
			})
		})
		deviceSelectSource.options.push(
			{
				id: 'sourceLayer',
				type: 'dropdown',
				label: 'Screen Layer Source',
				choices: [{ id: 'keep', label: "Don't change source"}, ...this.choices.getSourceChoices()],
				default: 'keep',
				isVisible: (options) => {
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
				id: 'sourceBack',
				type: 'dropdown',
				label: 'Aux Layer Source',
				choices: [{ id: 'keep', label: "Don't change source"}, ...this.choices.getAuxSourceChoices()],
				default: 'keep',
				isVisible: (options) => {
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
		
		return deviceSelectSource
	}

	// MARK: Set Preset Toggle - LivePremier4
	get devicePresetToggle() {
		const devicePresetToggle = super.devicePresetToggle

		devicePresetToggle.callback = (act) => {
			const allscreens = this.choices.getScreensAuxArray(true).map(itm => itm.id)
			
			let action = act.options.action
			if (action === 'toggle') {
				if (this.state.get('DEVICE/device/screenAuxGroupList/items/S1/control/pp/copyMode') === false) action = 'off'
				else action = 'on'
			}
			if (action === 'on') allscreens.forEach((screen: string) =>
				this.connection.sendWSmessage(['device','screenAuxGroupList','items', screen ,'control','pp','copyMode'], false))
			if (action === 'off') allscreens.forEach((screen: string) =>
				this.connection.sendWSmessage(['device','screenAuxGroupList','items', screen ,'control','pp','copyMode'], true))
		}

		return devicePresetToggle
	}

	/**
	 * MARK: Select Layer locally or remote
	 */
	get selectLayer() {
		const selectLayer = super.selectLayer

		selectLayer.callback = (action) => {
			let ret: Record<string, string>[] = []
			if (action.options.method?.endsWith('tgl')) {
				if (this.state.syncSelection) {
					ret = this.state.get('REMOTE/live/screens/layerSelection/layerIds')
						.map((layer: Record<string, string>) => {
							if (layer.type === 'SCREEN_LAYER_ID') return {
								screenAuxKey: layer.screenKey,
								layerKey: layer.screenLayerKey
							}
							else if (layer.type === 'AUX_LAYER_ID') return {
								screenAuxKey: layer.auxKey,
								layerKey: layer.auxLayerKey
							}
							else {
								const screenAuxKeyProp = Object.keys(layer).find(key => key.match(/(?<!Layer)Key/))
								const layerKeyProp = Object.keys(layer).find(key => key.match(/LayerKey/))
								if (screenAuxKeyProp && layerKeyProp) {
									return {
										screenAuxKey: layer[screenAuxKeyProp],
										layerKey: layer[layerKeyProp]	
									}
								} else {
									return {}
								}
							}
						})
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
						if (layer !== 'NATIVE' && isNaN(parseInt(layer))) continue // may be leftover from midra config
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
						if (layer !== 'NATIVE' && isNaN(parseInt(layer))) continue // may be leftover from midra config
						ret.push({ screenAuxKey: screen, layerKey: layer })
					}
				}
			}
			if (this.state.syncSelection) {
				this.connection.sendWSdata('REMOTE', 'replace', '/live/screens/layerSelection',
					[
						ret.map((layer) => {
							if (layer.screenAuxKey.charAt(0) === 'A') {
								return {
									type: 'AUX_LAYER_ID',
									auxKey: layer.screenAuxKey,
									auxLayerKey: layer.layerKey
								}
							} else {
								return {
									type: 'SCREEN_LAYER_ID',
									screenKey: layer.screenAuxKey,
									screenLayerKey: layer.layerKey
								}
							}
						})
					]
				)
			} else {
				this.state.set('LOCAL/layerIds', ret)
				this.instance.checkFeedbacks('remoteLayerSelection')
			}
		}

		return selectLayer
	}

	/**
	 *MARK:  Select Multiviewer Widget - LivePremier4
	*/
	get remoteMultiviewerSelectWidget() {
		const remoteMultiviewerSelectWidget = super.remoteMultiviewerSelectWidget

		remoteMultiviewerSelectWidget.callback = (action) => {
			const mvw = action.options.widget?.split(':')[0] ?? '1'
			const widget = action.options.widget?.split(':')[1] ?? '0'
			let widgetSelection: Record<'mocOutputLogicKey' | 'widgetKey', string>[] = []
			if (this.state.syncSelection) {
				widgetSelection = [...this.state.get('REMOTE/live/multiviewers/widgetSelection/widgetIds')]
			} else {
				widgetSelection = [...this.state.get('LOCAL/widgetSelection/widgetIds')]
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
				this.connection.sendWSdata('REMOTE', 'replace', '/live/multiviewers/widgetSelection', [widgetSelection])
			} else {
				this.state.set('LOCAL/widgetSelection/widgetIds', widgetSelection)
				this.instance.checkFeedbacks('remoteWidgetSelection')
			}
		}

		return remoteMultiviewerSelectWidget
	}

	/**
	 * MARK: Select the source in a multiviewer widget - Livepremier4
	 */
	get deviceMultiviewerSource() {	
		const deviceMultiviewerSource = super.deviceMultiviewerSource

		deviceMultiviewerSource.callback = (action) => {
			let widgetSelection: Record<'mocOutputLogicKey' | 'widgetKey', string>[] = []
			if (action.options.widget === 'sel') {
				if (this.state.syncSelection) {
					widgetSelection = [...this.state.get('REMOTE/live/multiviewers/widgetSelection/widgetIds')]
				} else {
					widgetSelection = [...this.state.get('LOCAL/widgetSelection/widgetIds')]
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
						'monitoringList',
						'items',
						widget.mocOutputLogicKey,
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
		}

		return deviceMultiviewerSource
	}

	/**
	 * MARK: Route audio block - Livepremier4
	 */
	get deviceAudioRouteBlock() {
		type DeviceAudioRouteBlock = {device: number, out1: string, in1: string, out2?: string, in2?: string, out3?: string, in3?: string, out4?: string, in4?: string, blocksize: number}
		const devices =  this.choices.getLinkedDevicesChoices().length
		const audioOutputChoices = Array.from({length: devices}, (_v, i) => {
			return this.choices.getAudioOutputChoices(i + 1)
		})
		const audioInputChoices = Array.from({length: devices}, (_v, i) => {
			return this.choices.getAudioInputChoices(i + 1)
		})

		const deviceAudioRouteBlock: AWJaction<DeviceAudioRouteBlock> = {
			name: 'Route Audio (Block)',
			options: [
				{
					type: 'dropdown',
					label: 'Device',
					id: 'device',
					choices: this.choices.getLinkedDevicesChoices(),
					default: 1,
					isVisibleData: devices,
					isVisible: (_opt, devices) => {return devices > 1},
					minChoicesForSearch: 3,
				},
				...audioOutputChoices.map((choices, i) => {
					return {
						type: 'dropdown' as const,
						label: 'First Output Channel',
						id: `out${i+1}`,
						choices: choices,
						default: choices[0]?.id,
						minChoicesForSearch: 0,
						isVisibleData: i + 1,
						isVisible: (opt, device) => {return opt.device == device}
					}
				}),
				...audioInputChoices.map((choices, i) => {
					return {
						type: 'dropdown' as const,
						label: 'First Input Channel',
						id: `in${i+1}`,
						choices: choices,
						default: choices[0]?.id,
						minChoicesForSearch: 0,
						isVisibleData: i + 1,
						isVisible: (opt, device) => {return opt.device == device}
					}
				}),
				{
					type: 'number',
					label: 'Block Size',
					id: 'blocksize',
					default: Math.min( 8, Math.max(...audioInputChoices.map(choice => choice.length)) ),
					min: 1,
					max: Math.max(...audioInputChoices.map(choice => choice.length)),
					range: true,
				},
			],
			callback: (action) => {
				const device = action.options.device
				const outstart = audioOutputChoices[device - 1].findIndex((item) => {
					return item.id === action.options[`out${device}`]
				})
				const instart = audioInputChoices[device - 1].findIndex((item) => {
					return item.id === action.options[`in${device}`]
				})
				if (outstart > -1 && instart > -1) {
					const max = Math.min(
						audioOutputChoices[device - 1].length - outstart,
						audioInputChoices[device - 1].length - instart,
						action.options.blocksize
					) // since 'None' is input at index 0 no extra test is needed, it is possible to fill all outputs with none
					for (let s = 0; s < max; s += 1) {
						const path = [
							'device','audio','control',
							'deviceList', 'items', device.toString(),
							'txList','items',
							audioOutputChoices[device - 1][outstart + s].id.toString().split(':')[0],
							'channelList','items',
							audioOutputChoices[device - 1][outstart + s].id.toString().split(':')[1],
							'control','pp','source',
						]
						this.connection.sendWSmessage(path, audioInputChoices[device - 1][instart === 0 ? 0 : instart + s].id)
					}
				}
			}
		}
		
		return deviceAudioRouteBlock
	}

	/**
	 * MARK: Route audio channels - Livepremier4
	 */
	get deviceAudioRouteChannels() {
		type DeviceAudioRouteChannels = {device: number, out1: string, in1: string[], out2?: string, in2?: string[], out3?: string, in3?: string[], out4?: string, in4?: string[]}

		const devices =  this.choices.getLinkedDevicesChoices().length
		const audioOutputChoices = Array.from({length: devices}, (_v, i) => {
			return this.choices.getAudioOutputChoices(i + 1)
		})
		const audioInputChoices = Array.from({length: devices}, (_v, i) => {
			return this.choices.getAudioInputChoices(i + 1)
		})
		
		const deviceAudioRouteChannels: AWJaction<DeviceAudioRouteChannels> = {
			name: 'Route Audio (Channels)',
			options: [
				{
					type: 'dropdown',
					label: 'Device',
					id: 'device',
					choices: this.choices.getLinkedDevicesChoices(),
					default: 1,
					isVisibleData: devices,
					isVisible: (_opt, devices) => {return devices > 1},
					minChoicesForSearch: 3,
				},
				...audioOutputChoices.map((choices, i) => {
					return {
						type: 'dropdown' as const,
						label: 'First Output Channel',
						id: `out${i+1}`,
						choices: choices,
						default: choices[0]?.id,
						minChoicesForSearch: 0,
						isVisibleData: i + 1,
						isVisible: (opt, device) => {return opt.device == device}
					}
				}),
				...audioInputChoices.map((choices, i) => {
					return {
						type: 'multidropdown' as const,
						label: 'input channel(s)',
						id: `in${i+1}`,
						choices: choices,
						default: ['NONE'],
						minChoicesForSearch: 0,
						minSelection: 0,
						isVisibleData: i + 1,
						isVisible: (opt, device) => {return opt.device == device}
					}
				}),
			],
			callback: (action) => {
				const device = action.options.device
				if (action.options[`in${device}`].length > 0) {
					const outstart = audioOutputChoices[device -1].findIndex((item) => {
						return item.id === action.options[`out${device}`]
					})
					if (outstart > -1) {
						const max = Math.min(audioOutputChoices[device -1].length - outstart, action.options[`in${device}`].length)
						for (let s = 0; s < max; s += 1) {
							const path = [
								'device', 'audio', 'control',
								'deviceList', 'items', device.toString(),
								'txList', 'items', audioOutputChoices[device -1][outstart + s].id.toString().split(':')[0],
								'channelList', 'items', audioOutputChoices[device -1][outstart + s].id.toString().split(':')[1],
								'control',
								'pp',
								'source',
							]
							this.connection.sendWSmessage(path, action.options[`in${device}`][s])
						}
					}
				} else {
					const path = [
						'device', 'audio', 'control',
						'deviceList', 'items', device.toString(),
						'txList', 'items', action.options[`out${device}`].split(':')[0],
						'channelList', 'items', action.options[`out${device}`].split(':')[1],
						'control',
						'pp',
						'source',
					]
					this.connection.sendWSmessage(path, audioInputChoices[device -1][0]?.id)
				}
			}
		}

		return deviceAudioRouteChannels
	}

	/**
	 * MARK: Setup timer - LivePremier4
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
			
			this.connection.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'background', 'color', 'pp', 'red'],
				splitRgb(action.options.bg_color).r
			)
			this.connection.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'background', 'color', 'pp', 'green'],
				splitRgb(action.options.bg_color).g
			)
			this.connection.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'background', 'color', 'pp', 'blue'],
				splitRgb(action.options.bg_color).b
			)
			this.connection.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'background', 'color', 'pp', 'alpha'],
				Math.round((splitRgb(action.options.bg_color).a ?? 1) * 255)
			)
			this.connection.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'text', 'color', 'pp', 'red'],
				splitRgb(action.options.fg_color).r
			)
			this.connection.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'text', 'color', 'pp', 'green'],
				splitRgb(action.options.fg_color).g
			)
			this.connection.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'text', 'color', 'pp', 'blue'],
				splitRgb(action.options.fg_color).b
			)
			this.connection.sendWSmessage(
				['device', 'timerList', 'items', action.options.timer, 'control', 'text', 'color', 'pp', 'alpha'],
				Math.round((splitRgb(action.options.fg_color).a ?? 1) * 255)
			)
		}

		return deviceTimerSetup
	}

	/**
	 * MARK: Set input keying
	 */
	get deviceInputKeying() {		
		const deviceInputKeying = super.deviceInputKeying
		
		deviceInputKeying.options[1] = {
			id: 'mode',
			type: 'dropdown',
			label: 'Mode',
			choices: [
				{ id: 'DISABLE', label: 'Keying Disabled' },
				{ id: 'CHROMA', label: 'Chroma Key' },
				{ id: 'LUMA', label: 'Luma Key' },
				{ id: 'CREMATTE3D', label: 'CremaTTe 3D' },
				{ id: 'CUT_AND_FILL', label: 'Cut and Fill' },
			],
			default: 'DISABLE',
		}

		return deviceInputKeying
	}

	/**
	 * MARK: Choose Testpatterns - LivePremier4
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
					{ id: 'THIRTY_BPP_1', label: '30 Bit per Pixel 1' },
					{ id: 'THIRTY_BPP_2', label: '30 Bit per Pixel 2' },
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
					{ id: 'HORIZONTAL_GREY_SCALE_1', label: 'Horizontal Greyscale' },
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
		]

		return this.deviceTestpatterns_common(deviceTestpatternsOptions)

	}

	/**
	 * MARK: Adjust GPO
	 * Livepremier 4
	 */
	get deviceGPO() {
		type DeviceGPO = {gpo: number, action: number}

		let tooltip: string|undefined = undefined
		if (this.choices.getLinkedDevicesChoices().length) {
			tooltip = 'GPO number 1-8 for device #1'
			for (let device = 1; device < this.choices.getLinkedDevicesChoices().length; device+=1) {
				tooltip += `, ${device*8 +1}-${device*8 +8} for device #${device+1}`
			}
		} 
		
		const deviceGPO: AWJaction<DeviceGPO> = {
			name: 'Set GPO',
			options: [
				{
					id: 'gpo',
					type: 'number',
					label: 'GPO',
					min: 1,
					max: this.choices.getLinkedDevicesChoices().length * 8,
					range: true,
					default: 1,
					step: 1,
					tooltip,
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
				const gpo = Math.floor((action.options.gpo-1) % 8 +1 ).toString()
				const device = Math.ceil(action.options.gpo / 8 ).toString()
				const path = [
						'device',
						'gpios',
						'deviceList', 'items', device,
						'gpoList', 'items', gpo,
					]
				let newstate = false
				if (action.options.action === 1) {
					newstate = true
				} else if (action.options.action === 2) {
					if (this.state.get(['DEVICE', ...path, 'status', 'pp', 'state']) === false) newstate = true
				}
				this.connection.sendWSmessage([...path, 'control', 'pp', 'activate'], newstate)
			},
		}

		return deviceGPO
	}


}
