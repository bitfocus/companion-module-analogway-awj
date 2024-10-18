import Feedbacks from '../awjdevice/feedback.js'
import {AWJinstance} from '../index.js'
import {
	CompanionFeedbackDefinition, 
} from '@companion-module/base'


/** Helper type for replacing the very generic options with the real structure of options */
type ReplaceOptionsInFunctions<T, NewOptionsType> = T extends (...args: any[]) => any
  ? T extends (first: infer First, ...rest: infer Rest) => infer Return
    ? First extends { options: any } | { options?: any }
      ? (first: Omit<First, 'options'> & { options: NewOptionsType }, ...rest: Rest) => Return
      : T
    : T
  : T extends Array<infer U>
    ? Array<ReplaceOptionsInFunctions<U, NewOptionsType>>
    : T extends ReadonlyArray<infer U>
      ? ReadonlyArray<ReplaceOptionsInFunctions<U, NewOptionsType>>
      : T extends object
        ? { [K in keyof T]: ReplaceOptionsInFunctions<T[K], NewOptionsType> }
        : T;

/** Type which gives CompanionFeedbackDefinition but replaces the generic options with the structure givien in the parameter */
type AWJfeedback<K> = ReplaceOptionsInFunctions<CompanionFeedbackDefinition, K>

export default class FeedbacksLivepremier4 extends Feedbacks  {

	readonly feedbacksToUse = [		
		'syncselection',
		'presetToggle',
		'deviceMasterMemory',
		'deviceScreenMemory',
		// 'deviceAuxMemory',
		'deviceSourceTally',
		'deviceTake',
		'liveScreenSelection',
		'liveScreenLock',
		'livePresetSelection',
		'remoteLayerSelection',
		'remoteWidgetSelection',
		'deviceInputFreeze',
		// 'deviceLayerFreeze',
		// 'deviceScreenFreeze',
		'timerState',
		'deviceGpioOut',
		'deviceGpioIn',
		// 'deviceStreaming',
		'deviceCustom',
	]

	constructor (instance: AWJinstance) {
		super(instance)
		this.state = this.instance.state
		this.choices = this.instance.choices
		this.config = this.instance.config
		this.constants = this.instance.constants
	}

	// MARK: Screen Memory
	get deviceScreenMemory() {
		
		const deviceScreenMemory = super.deviceScreenMemory
			
		deviceScreenMemory.options[0] =
			{
				id: 'screens',
				type: 'dropdown',
				label: 'Screens / Auxscreens',
				choices: [{ id: 'all', label: 'Any' }, ...this.choices.getScreenAuxChoices()],
				multiple: true,
				default: ['all'],
			} as any // TODO: fix type of dropdown with multiple: true property

		deviceScreenMemory.callback =  (feedback) => {
			const screens = this.choices.getChosenScreensSupportedByScreenMemories(feedback.options.screens)
			const presets = feedback.options.preset === 'all' ? ['pgm', 'pvw'] : [feedback.options.preset]
			
			for (const screen of screens) {
				const screeninfo = this.choices.getScreenInfo(screen)
				for (const preset of presets) {
					const propPath = [
							'DEVICE', 'device', 'presetBank', 'status', 'presetId',
							screeninfo.isAux ? 'auxiliaryList' : 'screenList',
							'items',
							screeninfo.platformId,
							'presetList',
							'items',
							this.choices.getPreset(screeninfo.id, preset),
							'pp'
						]
					if (
						this.state.get([...propPath, 'id']) == feedback.options.memory
					) {
						if (feedback.options.unmodified === 2) return true
						const notModified = this.state.get([...propPath, 'isNotModified'])
						if (notModified == feedback.options.unmodified) {
							return true
						}
					}
				}
			}
			return false
		}

		return deviceScreenMemory
	}

	// MARK: deviceTake - Livepremier4
	get deviceTake() {
		const deviceTake = super.deviceTake

		deviceTake.callback = (feedback) => {
			if (this.choices.getChosenScreenAuxes(feedback.options.screens)
				.find((screen: string) => {
					return this.state.get(`DEVICE/device/screenAuxGroupList/items/${screen}/status/pp/transition`)?.match(/FROM/)
				})) return true			
			return false
		}

		return deviceTake
	}

	// MARK: deviceGpioOut - Livepremier4
	get deviceGpioOut() {

		let tooltip: string|undefined = undefined
		if (this.choices.getLinkedDevicesChoices().length) {
			tooltip = 'GPO number 1-8 for device #1'
			for (let device = 1; device < this.choices.getLinkedDevicesChoices().length; device+=1) {
				tooltip += `, ${device*8 +1}-${device*8 +8} for device #${device+1}`
			}
		} 

		const deviceGpioOut: AWJfeedback<{gpo: number, state: number }> = {
			type: 'boolean',
			name: 'GPO State',
			description: 'Shows whether a general purpose output is currently active',
			defaultStyle: {
				color: this.config.color_dark,
				bgcolor: this.config.color_highlight,
			},
			options: [
				{
					id: 'gpo',
					type: 'number',
					label: 'GPO',
					min: 1,
					max: this.choices.getLinkedDevicesChoices().length * 8,
					range: true,
					default: 1,
					tooltip,
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
			callback: (feedback) => {
				const gpo = Math.floor(feedback.options.gpo-1) % 8 +1
				const device = Math.ceil(feedback.options.gpo / 8)
				const val = feedback.options.state === 1 ? true : false
				return (
					this.state.get([
						'DEVICE',
						'device',
						'gpios',
						'deviceList', 'items', device.toString(),
						'gpoList', 'items', gpo.toString(),
						'status', 'pp', 'state',
					]) === val
				)
			},
		}

		return deviceGpioOut
	}

	// MARK: deviceGpioIn - Livepremier4
	get deviceGpioIn() {
		
		let tooltip: string|undefined = undefined
		if (this.choices.getLinkedDevicesChoices().length) {
			tooltip = 'GPI number 1-2 for device #1'
			for (let device = 1; device < this.choices.getLinkedDevicesChoices().length; device+=1) {
				tooltip += `, ${device*2 +1}-${device*2 +2} for device #${device+1}`
			}
		} 
		const deviceGpioIn: AWJfeedback<{gpi: number, state: number }> = {
			type: 'boolean',
			name: 'GPI State',
			description: 'Shows whether a general purpose input is currently active',
			defaultStyle: {
				color: this.config.color_dark,
				bgcolor: this.config.color_highlight,
			},
			options: [
				{
					id: 'gpi',
					type: 'number',
					label: 'GPI',
					min: 1,
					max: this.choices.getLinkedDevicesChoices().length * 2,
					range: true,
					default: 1,
					step: 1,
					tooltip
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
			callback: (feedback) => {
				const gpi = Math.floor((feedback.options.gpi-1) % 2 +1)
				const device = Math.ceil(feedback.options.gpi / 2)
				const val = feedback.options.state === 1 ? true : false
				return (
					this.state.get([
						'DEVICE',
						'device',
						'gpios',
						'deviceList', 'items', device.toString(),
						'gpiList', 'items', gpi.toString(),
						'status',
						'pp',
						'state',
					]) === val
				)
			},
		}

		return deviceGpioIn
	}
	
}