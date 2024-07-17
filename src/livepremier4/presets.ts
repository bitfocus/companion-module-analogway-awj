import {AWJinstance} from '../index.js'
import {
	CompanionButtonPresetDefinition,
	CompanionPresetDefinitions,
} from '@companion-module/base'
import Presets from '../awjdevice/presets.js'

type Dropdown<t> = { id: t, label: string }

export default class PresetsLivepremier4 extends Presets {
	
	readonly presetsToUse: string[] = [
		'masterMemories',
		'screenMemories',
		// 'auxMemories',
		'layerMemories',
		'takeAllScreens',
		'takeSelectedScreens',
		'takeScreen',
		'cutAllScreens',
		'cutSelectedScreens',
		'cutScreen',
		'toggleSync',
		'selectPreset',
		'presetToggle',
		'copyPreviewFromProgram',
		'toggleScreenSelection',
		'toggleLockPgmAllScreens',
		'toggleLockPgmScreen',
		'toggleLockPvwAllScreens',
		'toggleLockPvwScreen',
		'selectLayer',
		'chooseInput',
		'toggleFreezeInput',
		// 'toggleFreezeLayer',
		// 'toggleFreezeScreen',
		'posSize',
		'multiviewerMemories',
		'selectWidget',
		'toggleWidgetSelection',
		'selectWidgetSource',
		'timers',
		// 'stream',
	]

	constructor(instance: AWJinstance) {
		super(instance)
		this.instance = instance
		this.state = this.instance.state
		this.constants = this.instance.constants
		this.choices = this.instance.choices
		this.config= this.instance.config
	}

	// MARK: Choose Input ...
	get chooseInput() {
		const presets: CompanionPresetDefinitions = {}
		const ilabel = this.instance.label
		const self = this

		function makeInputSelectionPreset(input: Dropdown<string>, layertypes: string[], layerdescription: string) {
			let sourceLabelVariable = ''
			// sourceLayer, sourceNative, sourceBack, sourceFront
			if (input.id.match(/^IN|LIVE|STILL|SCREEN/)) {
				sourceLabelVariable = `\\n$(${ilabel}:${input.id.replace('LIVE_', 'INPUT_')}label)`
			}
			const preparedPreset: CompanionButtonPresetDefinition = {
				type: 'button',
				name: 'Choose Input ' + input.label + ' for selected '+ layerdescription +' Layer(s)',
				category: 'Layer Source',
				style: {
					text: input.label.replace(/^(\D+\d+)\s.+$/, '$1') + sourceLabelVariable,
					size: 'auto',
					color: self.config.color_bright,
					bgcolor: self.config.color_dark,
				},
				steps: [
					{
						down: [
							{
								actionId: 'deviceSelectSource',
								options: {
									method: 'sel',
									preset: 'pvw',
									screen: [],
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'deviceSourceTally',
						options: {
							screens: ['all'],
							preset: 'pvw',
							source: input.id,
						},
						style: {
							color: self.inverseColorBW(self.config.color_green),
							bgcolor: self.config.color_green,
						},
					},
					{
						feedbackId: 'deviceSourceTally',
						options: {
							screens: ['all'],
							preset: 'pgm',
							source: input.id,
						},
						style: {
							color: self.inverseColorBW(self.config.color_red),
							bgcolor: self.config.color_red,
						},
					},
				],
			}
			Array.of('sourceLayer', 'sourceNative', 'sourceBack', 'sourceFront').forEach(layer => {
				preparedPreset.steps[0].down[0].options[layer] = 'keep'	
			})
			layertypes.forEach(layertype => {	
				preparedPreset.steps[0].down[0].options[layertype] = input.id
			})
			presets[preparedPreset.name] = preparedPreset
		}
		
		makeInputSelectionPreset({ id: 'NONE', label: 'None' }, ['sourceLayer', 'sourceNative', 'sourceFront', 'sourceBack'], '')

		this.choices.getSourceChoices().filter(choice => choice.id !== 'NONE' && choice.id !== 'COLOR').forEach((choice: Dropdown<string>) => {
			makeInputSelectionPreset(choice, ['sourceLayer', 'sourceBack'], '')
		})
		this.choices.choicesBackgroundSources.forEach((choice: Dropdown<string>) => {
			makeInputSelectionPreset(choice, ['sourceNative'], 'Background')
		})

		return presets
	}

}
