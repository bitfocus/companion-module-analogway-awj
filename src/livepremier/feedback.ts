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

export default class FeedbacksLivepremier extends Feedbacks  {

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

		return deviceScreenMemory
	}

	// MARK: deviceTake - Livepremier
	get deviceTake() {
		const deviceTake = super.deviceTake

		deviceTake.callback = (feedback) => {
			if (this.choices.getChosenScreenAuxes(feedback.options.screens)
				.find((screen: string) => {
					return this.state.get(`DEVICE/device/screenGroupList/items/${screen}/status/pp/transition`)?.match(/FROM/)
				})) return true			
			return false
		}

		return deviceTake
	}

	// MARK: deviceGpioOut - Livepremier
	get deviceGpioOut() {
		
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
			callback: (feedback) => {
				const val = feedback.options.state === 1 ? true : false
				return (
					this.state.get([
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

		return deviceGpioOut
	}

	// MARK: deviceGpioIn - Livepremier
	get deviceGpioIn() {
		
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
			callback: (feedback) => {
				const val = feedback.options.state === 1 ? true : false
				return (
					this.state.get([
						'DEVICE',
						'device',
						'gpio',
						'gpiList',
						'items',
						Math.floor(feedback.options.gpi).toString() ?? '1',
						'status',
						'pp',
						'state',
					]) === val
				)
			},
		}

		return deviceGpioIn
	}

	// MARK: remoteWidgetSelection
	get remoteWidgetSelection() {
		const remoteWidgetSelection = super.remoteWidgetSelection

		remoteWidgetSelection.callback = (feedback) => {
			const mvw = feedback.options.widget?.toString().split(':')[0] ?? '1'
				const widget = feedback.options.widget?.toString().split(':')[1] ?? '0'
				type WidgetSelection = {widgetKey: string, mocOutputLogicKey?: string, multiviewerKey?: string}
				let widgetSelection: WidgetSelection[] = []
				if (this.state.syncSelection) {
					widgetSelection = [...this.state.get('REMOTE/live/multiviewers/widgetSelection/widgetIds')]
						.map((key: WidgetSelection) => {return {widgetKey: key.widgetKey, mocOutputLogicKey: key.multiviewerKey}})
				} else {
					widgetSelection = this.state.get('LOCAL/widgetSelection/widgetIds')
				}
				return JSON.stringify(widgetSelection).includes(`{"widgetKey":"${widget}","mocOutputLogicKey":"${mvw}"}`)
		}

		return remoteWidgetSelection
	}
	
}