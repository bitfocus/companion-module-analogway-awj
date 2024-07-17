import {AWJinstance} from '../index.js'
import {
	CompanionButtonPresetDefinition,
	CompanionPresetDefinitions,
} from '@companion-module/base'
import Presets from '../awjdevice/presets.js'

type Dropdown<t> = { id: t, label: string }

export default class PresetsMidra extends Presets {
	
	readonly presetsToUse: string[] = [
		'masterMemories',
		'screenMemories',
		'auxMemories',
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
		'toggleFreezeLayer',
		'toggleFreezeScreen',
		'posSize',
		'multiviewerMemories',
		'selectWidget',
		'toggleWidgetSelection',
		'selectWidgetSource',
		'timers',
		'stream',
	]

	constructor(instance: AWJinstance) {
		super(instance)
		this.instance = instance
		this.state = this.instance.state
		this.constants = this.instance.constants
		this.choices = this.instance.choices
		this.config= this.instance.config
	}


		// MARK: Screen Memories
	get screenMemories() {
		const presets: CompanionPresetDefinitions = {}
		const ilabel = this.instance.label

		for (const screen of [{ id: 'sel', label: 'Selected', index: '0' }, ...this.choices.getScreensArray()]
		) {
			for (const memory of this.choices.getScreenMemoryArray()) {
				// const label = this.state.get(['DEVICE', 'device', 'presetBank', 'bankList', 'items', memory, 'control', 'pp', 'label'])
				const bgcolor = parseInt(this.state.get(['REMOTE', 'banks', 'screen', 'items', memory.id, 'color'])?.slice(1), 16)

				presets[`LoadScreenMemory_${memory.id}_to_${screen.id}`] = {
					type: 'button',
					name: `Load Screen Memory ${memory.id} into screen ${screen.id}${screen.label ? ' ('+screen.label+')' : ''}`,
					category: `Screen Memories into ${screen.id != 'sel' ? screen.id : 'Selection'}`,
					style: {
						text: `SM${memory.id}${screen.id != 'sel' ? ' '+screen.id : ''}\\n$(${ilabel}:screenMemory${memory.id}label)`,
						size: 'auto',
						color: this.inverseColorBW(bgcolor),
						bgcolor,
					},
					steps: [
						{
							down: [
								{
									actionId: 'deviceScreenMemory',
									options: {
										screens: [screen.id],
										preset: screen.id === 'sel' ? 'sel' : 'pvw',
										memory: memory.id,
										selectScreens: false,
									},
								},
							],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: 'deviceScreenMemory',
							options: {
								screens: screen.id != 'sel' ? [screen.id] : ['all'],
								preset: 'pvw',
								memory: memory.id,
								unmodified: 0,
							},
							style: {
								color: this.inverseColorBW(this.config.color_green),
								bgcolor: this.config.color_green,
							},
						},
						{
							feedbackId: 'deviceScreenMemory',
							options: {
								screens: screen.id != 'sel' ? [screen.id] : ['all'],
								preset: 'pgm',
								memory: memory.id,
								unmodified: 0,
							},
							style: {
								color: this.inverseColorBW(this.config.color_red),
								bgcolor: this.config.color_red,
							},
						},
						{
							feedbackId: 'deviceScreenMemory',
							options: {
								screens: screen.id != 'sel' ? [screen.id] : ['all'],
								preset: 'pvw',
								memory: memory.id,
								unmodified: 1,
							},
							style: {
								color: this.inverseColorBW(this.config.color_greendark),
								bgcolor: this.config.color_greendark,
							},
						},
						{
							feedbackId: 'deviceScreenMemory',
							options: {
								screens: screen.id != 'sel' ? [screen.id] : ['all'],
								preset: 'pgm',
								memory: memory.id,
								unmodified: 1,
							},
							style: {
								color: this.inverseColorBW(this.config.color_reddark),
								bgcolor: this.config.color_reddark,
							},
						},
					],
				}
			}
		}

		return presets
	}

		// MARK: Aux Memories
	get auxMemories() {
		const presets: CompanionPresetDefinitions = {}
		const ilabel = this.instance.label

		for (const screen of [{ id: 'sel', label: 'Selected', index: '0' }, ...this.choices.getAuxArray()]) {
			for (const memory of this.choices.getAuxMemoryArray()) {
				// const label = this.state.get(['DEVICE', 'device', 'presetBank', 'bankList', 'items', memory, 'control', 'pp', 'label'])
				const bgcolor = parseInt(this.state.get(['REMOTE', 'banks', 'screen', 'items', memory.id, 'color'])?.slice(1), 16)

				presets[`LoadAuxMemory_${memory.id}_${screen.id}`] = {
					type: 'button',
					name: `Load Aux Memory ${memory.id} into auxscreen ${screen.id}${screen.label ? ' ('+screen.label+')' : ''}`,
					category: `Aux Memories into ${screen.id != 'sel' ? screen.id : 'Selection'}`,
					style: {
						text: `AM${memory.id}${screen.id != 'sel' ? ' '+screen.id : ''}\\n$(${ilabel}:auxMemory${memory.id}label)`,
						size: 'auto',
						color: this.inverseColorBW(bgcolor),
						bgcolor,
					},
					steps: [
						{
							down: [
								{
									actionId: 'deviceAuxMemory',
									options: {
										screens: ['sel'],
										preset: screen.id === 'sel' ? 'sel' : 'pvw',
										memory: memory.id,
										selectScreens: false,
									},
								},
							],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: 'deviceAuxMemory',
							options: {
								screens: screen.id != 'sel' ? [screen.id] : ['all'],
								preset: 'pvw',
								memory: memory.id,
								unmodified: 0,
							},
							style: {
								color: this.inverseColorBW(this.config.color_green),
								bgcolor: this.config.color_green,
							},
						},
						{
							feedbackId: 'deviceAuxMemory',
							options: {
								screens: screen.id != 'sel' ? [screen.id] : ['all'],
								preset: 'pgm',
								memory: memory.id,
								unmodified: 0,
							},
							style: {
								color: this.inverseColorBW(this.config.color_red),
								bgcolor: this.config.color_red,
							},
						},
						{
							feedbackId: 'deviceAuxMemory',
							options: {
								screens: screen.id != 'sel' ? [screen.id] : ['all'],
								preset: 'pvw',
								memory: memory.id,
								unmodified: 1,
							},
							style: {
								color: this.inverseColorBW(this.config.color_greendark),
								bgcolor: this.config.color_greendark,
							},
						},
						{
							feedbackId: 'deviceAuxMemory',
							options: {
								screens: screen.id != 'sel' ? [screen.id] : ['all'],
								preset: 'pgm',
								memory: memory.id,
								unmodified: 1,
							},
							style: {
								color: this.inverseColorBW(this.config.color_reddark),
								bgcolor: this.config.color_reddark,
							},
						},
					],
				}
			}
		}

		return presets
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
			//if (this.state.platform === 'midra' && layertype === 'sourceLayer' && input.id !== 'COLOR') preparedPreset.actions[0].options['sourceBack'] = input.id
			presets[preparedPreset.name] = preparedPreset
		}
		
		makeInputSelectionPreset({ id: 'NONE', label: 'None' }, ['sourceLayer', 'sourceNative', 'sourceFront', 'sourceBack'], '')

		makeInputSelectionPreset({ id: 'COLOR', label: 'Color' }, ['sourceLayer'], 'Live')
		this.choices.getSourceChoices().filter(choice => choice.id !== 'NONE' && choice.id !== 'COLOR').forEach((choice: Dropdown<string>) => {
			makeInputSelectionPreset(choice, ['sourceLayer', 'sourceBack'], 'Live/Background')
		})
		this.choices.choicesBackgroundSourcesPlusNone.filter(choice => choice.id !== 'NONE').forEach((choice: Dropdown<string>) => {
			makeInputSelectionPreset(choice, ['sourceNative'], 'Background')
		})
		this.choices.choicesForegroundImagesSource.filter(choice => choice.id !== 'NONE').forEach((choice: Dropdown<string>) => {
			makeInputSelectionPreset(choice, ['sourceFront'], 'Foreground')
		})

		return presets
	}

}
