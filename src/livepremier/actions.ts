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

export default class ActionsLivepremier extends Actions {


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
			let dir = 'xTakeUp'
			for (const screen of this.choices.getChosenScreenAuxes(action.options.screens)) {
				if (this.choices.getPreset(screen, 'pgm') === 'B') {
					dir = 'xTakeDown'
				}
				this.connection.sendWSmessage(['device', 'screenGroupList', 'items', screen, 'control', 'pp', dir], true)
			}
		}
		return deviceTakeScreen
	}

	/**
	 *  MARK: Recall Screen Memory LivePremier
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
					'screenList',
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
	 * MARK: Recall Master Memory - LivePremier
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

			if (
				screens.find((screen: string) => {
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

		return deviceMasterMemory
	}

	/**
	 * MARK: Select the source in a layer livepremier
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
							'device', 'screenList', 'items', screen,
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
								'device', 'screenList', 'items', layer.screenAuxKey,
								'presetList', 'items', this.choices.getPreset(layer.screenAuxKey, preset),
								'layerList', 'items', layer.layerKey,
								'source', 'pp', 'inputNum'
							], source)
						}
				})
			}
			this.instance.sendXupdate()
		}

		this.screens.forEach((screen) => {
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

	// MARK: Set Preset Toggle - LivePremier
	get devicePresetToggle() {
		const devicePresetToggle = super.devicePresetToggle

		devicePresetToggle.callback = (act) => {
			const allscreens = this.choices.getScreensAuxArray(true).map((itm) => itm.id)
			// device/transition/screenList/items/1/control/pp/enablePresetToggle
			// device/screenGroupList/items/S1/control/pp/copyMode
			
			let action = act.options.action
			if (action === 'toggle') {
				if (this.state.get('DEVICE/device/screenGroupList/items/S1/control/pp/copyMode') === false) action = 'off'
				else action = 'on'
			}
			if (action === 'on') allscreens.forEach((screen: string) =>
				this.connection.sendWSmessage(['device','screenGroupList','items',screen,'control','pp','copyMode'], false))
			if (action === 'off') allscreens.forEach((screen: string) =>
				this.connection.sendWSmessage(['device','screenGroupList','items',screen,'control','pp','copyMode'], true))
		}

		return devicePresetToggle
	}

	/**
	 *MARK:  Select Multiviewer Widget - LivePremier
	*/
	get remoteMultiviewerSelectWidget() {
		const remoteMultiviewerSelectWidget = super.remoteMultiviewerSelectWidget

		remoteMultiviewerSelectWidget.callback = (action) => {
			const mvw = action.options.widget?.split(':')[0] ?? '1'
			const widget = action.options.widget?.split(':')[1] ?? '0'
			let widgetSelection: Record<'mocOutputLogicKey' | 'widgetKey', string>[] = []
			if (this.state.syncSelection) {
				widgetSelection = [...this.state.get('REMOTE/live/multiviewers/widgetSelection/widgetIds')]
					.map((key) => {return {widgetKey: key.widgetKey, mocOutputLogicKey: key.multiviewerKey}})
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
				this.connection.sendWSdata('REMOTE', 'replace', '/live/multiviewers/widgetSelection',
					[
						widgetSelection
						.map((key) => {return {widgetKey: key.widgetKey, multiviewerKey: key.mocOutputLogicKey}})
					]
				)
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
					widgetSelection = [...this.state.get('REMOTE/live/multiviewers/widgetSelection/widgetIds')]
						.map((key) => {return {widgetKey: key.widgetKey, mocOutputLogicKey: key.multiviewerKey}})
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
	 * MARK: Route audio block - Livepremier
	 */
	get deviceAudioRouteBlock() {
		type DeviceAudioRouteBlock = {device: number, out1: string, in1: string, out2?: string, in2?: string, out3?: string, in3?: string, out4?: string, in4?: string, blocksize: number}
		const audioOutputChoices = this.choices.getAudioOutputChoices()
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
					default: Math.min( 8, audioInputChoices.length),
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
						this.connection.sendWSmessage(path, audioInputChoices[instart === 0 ? 0 : instart + s].id)
					}
				}
			}
		}
		
		return deviceAudioRouteBlock
	}

	/**
	 * MARK: Route audio channels - Livepremier
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
				if (action.options.in1.length > 0) {
					const outstart = audioOutputChoices.findIndex((item) => {
						return item.id === action.options.out1
					})
					if (outstart > -1) {
						const max = Math.min(audioOutputChoices.length - outstart, action.options.in1.length)
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
							this.connection.sendWSmessage(path, action.options.in1[s])
						}
					}
				} else {
					const path = [
						'device',
						'audio',
						'control',
						'txList',
						'items',
						action.options.out1.split(':')[0],
						'channelList',
						'items',
						action.options.out1.split(':')[1],
						'control',
						'pp',
						'source',
					]
					this.connection.sendWSmessage(path, audioInputChoices[0]?.id)
				}
			}
		}

		return deviceAudioRouteChannels
	}

	/**
	 * MARK: Setup timer - LivePremier
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
				Math.round((splitRgb(action.options.bg_color).a || 1) * 255)
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
				Math.round((splitRgb(action.options.fg_color).a || 1) * 255)
			)
		}

		return deviceTimerSetup
	}

	/**
	 * MARK: Choose Testpatterns - LivePremier
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
		]

		return this.deviceTestpatterns_common(deviceTestpatternsOptions)

	}	

}
