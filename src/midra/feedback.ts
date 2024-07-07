import Feedbacks from '../awjdevice/feedback.js'
import { Config } from '../config.js'
import {AWJinstance, regexAWJpath} from '../index.js'
import { StateMachine } from '../state.js'
import Choices, {Choicemeta} from './choices.js'
import {
	combineRgb, 
	CompanionBooleanFeedbackDefinition, 
	CompanionFeedbackBooleanEvent, 
	CompanionFeedbackDefinition, 
	CompanionFeedbackDefinitions, 
	CompanionOptionValues
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

export default class FeedbacksMidra extends Feedbacks  {

	readonly feedbacksToUse = [		
		'syncselection',
		'presetToggle',
		'deviceMasterMemory',
		'deviceScreenMemory',
		'deviceAuxMemory',
		'deviceSourceTally',
		'deviceTake',
		'liveScreenSelection',
		'liveScreenLock',
		'livePresetSelection',
		'remoteLayerSelection',
		'remoteWidgetSelection',
		'deviceInputFreeze',
		'deviceLayerFreeze',
		'deviceScreenFreeze',
		'timerState',
		// 'deviceGpioOut',
		// 'deviceGpioIn',
		'deviceStreaming',
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
				label: 'Screens',
				choices: [{ id: 'all', label: 'Any' }, ...this.choices.getScreenChoices()],
				multiple: true,
				tags: true,
				regex: '/^S([1-9]|[1-3][0-9]|4[0-8])$/',
				default: ['all'],
			} as any // TODO: fix type of dropdown with multiple: true property

		return deviceScreenMemory
	}

	// MARK: deviceSourceTally
	get deviceSourceTally() {
		const deviceSourceTally = super.deviceSourceTally

		deviceSourceTally.callback = (feedback) => {  
			const checkTally = (): boolean => {
				// go thru the screens
				for (const screen of this.choices.getChosenScreenAuxes(feedback.options.screens)) {
					const screeninfo = this.choices.getScreenInfo(screen)
					const preset = this.choices.getPreset(screen, feedback.options.preset)
					for (const layer of this.choices.getLayerChoices(screen)) {
						const screenpath = [
							'DEVICE',
							...(screeninfo.isAux ? this.constants.auxPath : this.constants.screenPath),
							'items',
							screeninfo.numstr
						]
						const presetpath = [...screenpath, 'presetList', 'items', preset]
						const layerpath = [...presetpath, 'liveLayerList', 'items', layer.id]
	
						// check if source is used in background set on a screen
						if (layer.id === 'NATIVE') {
							const set = this.state.getUnmapped([...presetpath, 'background', 'source', 'pp', 'set'])
							if (set === 'NONE') continue
							const setinput = this.state.getUnmapped([...screenpath, 'backgroundSetList', 'items', set, 'control', 'pp', 'singleContent']) // TODO: check input format
							if (setinput === feedback.options.source) return true
							else continue
						}
	
						// check if source is used in background layer on a aux
						if (layer.id === 'BKG') {
							const bkginput = this.state.getUnmapped([...presetpath, 'background', 'source', 'pp', 'content'])
							if (bkginput === feedback.options.source) return true
							else continue
						}
	
						// check if source is used in top layer
						if (layer.id === 'TOP') {
							const frginput = this.state.getUnmapped([...presetpath, 'top', 'source', 'pp', 'frame'])
							if (frginput === feedback.options.source) return true
							else continue
						}
						
						if ((feedback.options.source === 'NONE' || feedback.options.source?.toString().startsWith('BACKGROUND') && this.state.get([...presetpath, 'source', 'pp', 'inputNum']) === feedback.options.source)) {
							return true
						}
						if (this.state.getUnmapped([...layerpath, 'source', 'pp', 'inputNum']) === feedback.options.source) {
							const invisible = (
								this.state.getUnmapped([...layerpath, 'position', 'pp', 'sizeH']) === 0 ||
								this.state.getUnmapped([...layerpath, 'position', 'pp', 'sizeV']) === 0 ||
								this.state.getUnmapped([...layerpath, 'opacity', 'pp', 'opacity']) === 0 ||
								this.state.getUnmapped([...layerpath, 'crop', 'pp', 'top']) +
									this.state.getUnmapped([...layerpath,'crop', 'pp', 'bottom']) >
									65528 ||
								this.state.getUnmapped([...layerpath, 'crop', 'pp', 'left']) +
									this.state.getUnmapped([...layerpath, 'crop', 'pp', 'right']) >
									65528 ||
								this.state.getUnmapped([...layerpath, 'mask', 'pp', 'top']) +
									this.state.getUnmapped([...layerpath, 'mask', 'pp', 'bottom']) >
									65528 ||
								this.state.getUnmapped([...layerpath, 'mask', 'pp', 'left']) +
									this.state.getUnmapped([...layerpath, 'mask', 'pp', 'right']) >
									65528 ||
								this.state.getUnmapped([...layerpath, 'position', 'pp', 'posH']) + this.state.getUnmapped([...layerpath, 'position', 'pp', 'sizeH']) / 2 <= 0 ||
								this.state.getUnmapped([...layerpath, 'position', 'pp', 'posV']) + this.state.getUnmapped([...layerpath, 'position', 'pp', 'sizeV']) / 2 <= 0 ||
								this.state.getUnmapped([...layerpath, 'position', 'pp', 'posH']) - this.state.getUnmapped([...layerpath, 'position', 'pp', 'sizeH']) / 2 >=
									this.state.getUnmapped([...screenpath, 'canvas', 'status', 'size', 'pp', 'sizeH']) ||
								this.state.getUnmapped([...layerpath, 'position', 'pp', 'posV']) - this.state.getUnmapped([...layerpath, 'position', 'pp', 'sizeV']) / 2 >=
									this.state.getUnmapped([...screenpath, 'canvas', 'status', 'size', 'pp', 'sizeV'])
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
			if (varValue != this.instance.getVariableValue(varName)) {
				this.instance.setVariableValues({ [varName]: varValue })
			}
			return tally
		}

		return deviceSourceTally
	}

	// MARK: deviceTake - Midra
	get deviceTake() {
		const deviceTake = super.deviceTake

		deviceTake.callback = (feedback) => {
			if (this.choices.getChosenScreenAuxes(feedback.options.screens)
				.find((screen: string) => {
					const screeninfo = this.choices.getScreenInfo(screen)
					return this.state.get([
						'DEVICE', 
						...(screeninfo.isAux ? this.constants.auxGroupPath : this.constants.screenGroupPath),
						'items', screeninfo.numstr,
						'status', 'pp', 'transition'
					])?.match(/FROM/)
				})) return true			
			return false
		}

		return deviceTake
	}

	// MARK: remoteLayerSelection
	get remoteLayerSelection() {
		const remoteLayerSelection = super.remoteLayerSelection
		remoteLayerSelection.callback = ({options}) => {
			if (options.screen.charAt(0) === 'A' && options.layer.match(/^\d/)) return false // impossible to have regular layer at midra auxscreen
			let layer = options.layer.replace(/^(\d+)$/, 'LIVE_$1').replace('NATIVE', 'BKG')
			let pst = true
			if (options.preset != 'all') {
				let preset: string
				if (this.state.syncSelection) {
					preset = this.state.get('REMOTE/live/screens/presetModeSelection/presetMode')
				} else {
					preset = this.state.get('LOCAL/presetMode')
				}
				if (preset != options.preset) {
					pst = false
				}
			}
			if (layer === 'all') {
				return (
					JSON.stringify(this.choices.getSelectedLayers()).includes(
						`{"screenAuxKey":"${this.choices.getScreenInfo(options.screen).platformLongId}","layerKey":"`
					) && pst
				)
			} else {
				return (
					JSON.stringify(this.choices.getSelectedLayers()).includes(
						`{"screenAuxKey":"${this.choices.getScreenInfo(options.screen).platformLongId}","layerKey":"${layer}"}`
					) && pst
				)
			}

		}

		return remoteLayerSelection
	}

	// MARK: remoteWidgetSelection
	get remoteWidgetSelection() {
		const remoteWidgetSelection = super.remoteWidgetSelection

		remoteWidgetSelection.callback = (feedback) => {
			const widget = feedback.options.widget?.toString().split(':')[1] ?? '0'
			let widgetSelection: {widgetKey: string, multiviewerKey: string}[] = []
			if (this.state.syncSelection) {
				widgetSelection = [
					...this.state.getUnmapped('REMOTE/live/multiviewer/widgetSelection/widgetKeys')
					.map((key: string) => {return {widgetKey: key, multiviewerKey: '1'}})
				]
			} else {
				widgetSelection = this.state.getUnmapped('LOCAL/widgetSelection/widgetIds')
			}
			return JSON.stringify(widgetSelection).includes(`{"widgetKey":"${widget}","multiviewerKey":"1"}`)
		}

		return remoteWidgetSelection
	}

	// MARK: deviceInputFreeze
	get deviceInputFreeze() {
		const deviceInputFreeze = super.deviceInputFreeze

		deviceInputFreeze.callback = (feedback) => {
			const input = feedback.options.input?.toString().replace('LIVE', 'INPUT') || ''
			const freeze = this.state.getUnmapped('DEVICE/device/inputList/items/' + input + '/control/pp/freeze')
			if (freeze) {
				this.instance.setVariableValues({ ['frozen_' + input]: '*'})
			} else {
				this.instance.setVariableValues({ ['frozen_' + input]: ' '})
			}
			return freeze
		}

		return deviceInputFreeze
	}

	// MARK: deviceStreaming - Midra
	get deviceStreaming() {
		
		const deviceStreaming: AWJfeedback<{state: string}> = {
			type: 'boolean',
			name: 'Stream Runnning State',
			description: 'Shows status of streaming',
			defaultStyle: {
				color: this.config.color_dark,
				bgcolor: this.config.color_highlight,
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
			callback: (feedback) => {
				return (
					this.state.getUnmapped([
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

		return deviceStreaming
	}
	
}