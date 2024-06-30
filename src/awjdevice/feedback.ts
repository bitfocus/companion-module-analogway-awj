import { Config } from '../config.js'
import {AWJinstance, regexAWJpath} from '../index.js'
import { StateMachine } from '../state.js'
import { AWJdevice } from './awjdevice.js'
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

export default class Feedbacks {
	private instance: AWJinstance
	private state: StateMachine
	private choices: Choices
	private config: Config

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
		'deviceGpioOut',
		'deviceGpioIn',
		'deviceStreaming',
		'deviceCustom',
	]

	constructor (instance: AWJinstance) {
		this.instance = instance
		this.state = instance.state
		this.choices = this.instance.choices
		this.config = instance.config
	}

	getFeedbacks(instance: AWJinstance): CompanionFeedbackDefinitions {
		const feedbacks = {}
		const config = instance.config
		const state: StateMachine = instance.device
		return {}
	}

	/**
	 * Object with all exported feedback definitions
	 */
	get allFeedbacks() {
		const feedbackDefinitions: CompanionFeedbackDefinitions = Object.fromEntries(
            this.feedbacksToUse.map((key) => [key, this[key]])
        )
        
        return feedbackDefinitions
	}

	// MARK: syncselection
	get syncselection()  {
		
		const syncselection: CompanionBooleanFeedbackDefinition = {
			type: 'boolean',
			name: 'Synchronization of the selection',
			description: 'Shows wether this client synchronizes its selection to the device',
			defaultStyle: {
				color: this.config.color_dark,
				bgcolor: this.config.color_highlight,
			},
			options: [],
			callback: (_feedback) => {
				const clients = this.state.getUnmapped('REMOTE/system/network/websocketServer/clients')
				if (clients === undefined || Array.isArray(clients) === false) return false
				const myid: string = this.state.getUnmapped('LOCAL/socketId')
				const myindex = clients.findIndex((elem) => {
					if (elem.id === myid) {
						return true
					} else {
						return false
					}
				})
				if (this.state.getUnmapped(`REMOTE/system/network/websocketServer/clients/${myindex}/isRemoteSelectionEnabled`)) {
					return true
				} else {
					return false
				}
			},
		}

		return syncselection
	}

	// MARK: preset toggle
	get presetToggle()  {
		
		const presetToggle: CompanionBooleanFeedbackDefinition = {
			type: 'boolean',
			name: 'Preset Toggle',
			description: 'Shows wether preset toggle is on or off',
			defaultStyle: {
				color: this.config.color_dark,
				bgcolor: this.config.color_highlight,
			},
			options: [],
			callback: (_feedback) => {
				let property = 'copyMode'
				let invert = true
				if (this.state.platform === 'midra') {
					property = 'enablePresetToggle'
					invert = false
				}
				return this.state.get('DEVICE/device/screenGroupList/items/S1/control/pp/'+ property) === !invert
			},
		}

		return presetToggle
	}

	// MARK: Master Memory
	get deviceMasterMemory() {
		
		const deviceMasterMemory: CompanionBooleanFeedbackDefinition = {
			type: 'boolean',
			name: 'Master Memory',
			description: 'Indicates the last used master memory',
			defaultStyle: {
				color: this.config.color_dark,
				bgcolor: this.config.color_highlight,
			},
			options: [
				{
					id: 'memory',
					type: 'dropdown',
					label: 'Screen Memory',
					choices: this.choices.getMasterMemoryChoices(),
					default: this.choices.getMasterMemoryChoices()[0]?.id,
				},
				{
					id: 'preset',
					type: 'dropdown',
					label: 'Preset',
					choices: [{ id: 'all', label: 'Any' }, ...this.choices.choicesPreset],
					default: 'all',
				},
			],
			callback: (feedback) => {
				if (
					(feedback.options.preset === 'all' || feedback.options.preset === 'pgm') &&
					this.state.get('DEVICE/device/masterPresetBank/status/lastUsed/presetModeList/items/PROGRAM/pp/memoryId') == feedback.options.memory
				) return true
				if (
					(feedback.options.preset === 'all' || feedback.options.preset === 'pvw') &&
					this.state.get('DEVICE/device/masterPresetBank/status/lastUsed/presetModeList/items/PREVIEW/pp/memoryId') == feedback.options.memory
				) return true
				return false
			},
		}

		return deviceMasterMemory
	}

	// MARK: Screen Memory
	get deviceScreenMemory() {
		
		const deviceScreenMemory = {
			type: 'boolean',
			name: 'Screen Memory',
			description: 'Shows wether a screen Memory is loaded on a screen',
			defaultStyle: {
				color: this.config.color_dark,
				bgcolor: this.config.color_highlight,
			},
			options: [
				{
					id: 'preset',
					type: 'dropdown',
					label: 'Preset',
					choices: [{ id: 'all', label: 'Any' }, ...this.choices.choicesPreset],
					default: 'all',
				},
				{
					id: 'memory',
					type: 'dropdown',
					label: 'Screen Memory',
					choices: this.choices.getScreenMemoryChoices(),
					default: this.choices.getScreenMemoryChoices()[0]?.id,
				},
				{
					id: 'unmodified',
					type: 'dropdown',
					label: 'is Modified',
					choices: [
						{ id: 0, label: 'only if unmodified' },
						{ id: 1, label: 'only if modified' },
						{ id: 2, label: "don't care unmodified or modified" },
					],
					default: 2,
				},
			],
			callback: (feedback: CompanionFeedbackBooleanEvent & { options: { screens: string[], preset: string, memory: string, unmodified: number } }) => {
				if (!this.state.platform.startsWith('livepremier') && this.state.platform !== 'midra') return false // we are not connected
				const screens = this.state.platform === 'midra' ? this.choices.getChosenScreens(feedback.options.screens) : this.choices.getChosenScreenAuxes(feedback.options.screens)
				const presets = feedback.options.preset === 'all' ? ['pgm', 'pvw'] : [feedback.options.preset]
				const map = {
					livepremier: { id: ['presetId','status','pp','id'], modified: ['presetId','status','pp','isNotModified'], modyes: true },
					livepremier4: { id: ['presetId','status','pp','id'], modified: ['presetId','status','pp','isNotModified'], modyes: true },
					midra: {id: ['status','pp','memoryId'], modified: ['status','pp','isModified'], modyes: false}
				}
				for (const screen of screens) {
					for (const preset of presets) {
						if (
							this.state.get([
								'DEVICE',
								'device',
								'screenList',
								'items',
								screen,
								'presetList',
								'items',
								this.choices.getPreset(screen, preset),
								...map[this.state.platform].id,
							]) == feedback.options.memory
						) {
							if (feedback.options.unmodified === 2) return true
							const modified = this.state.get([
								'DEVICE',
								'device',
								'screenList',
								'items',
								screen,
								'presetList',
								'items',
								this.choices.getPreset(screen, preset),
								...map[this.state.platform].modified,
							])
							if ( ((!map[this.state.platform].modyes && modified) || (map[this.state.platform].modyes && !modified)) == feedback.options.unmodified) {
								return true
							}
						}
					}
				}
				return false
			},
		}
		if (this.state.platform.startsWith('livepremier')) deviceScreenMemory.options.unshift(
			{
					id: 'screens',
					type: 'dropdown',
					label: 'Screens / Auxscreens',
					choices: [{ id: 'all', label: 'Any' }, ...this.choices.getScreenAuxChoices()],
					multiple: true,
					default: ['all'],
				} as any, // TODO: fix type of dropdown with multiple: true property
		)
		if (this.state.platform === 'midra') deviceScreenMemory.options.unshift(
			{
					id: 'screens',
					type: 'dropdown',
					label: 'Screens',
					choices: [{ id: 'all', label: 'Any' }, ...this.choices.getScreenChoices()],
					multiple: true,
					tags: true,
					regex: '/^S([1-9]|[1-3][0-9]|4[0-8])$/',
					default: ['all'],
				} as any, // TODO: fix type of dropdown with multiple: true property
		)

		return deviceScreenMemory
	}

	// MARK: Aux Memory - Midra
	get deviceAuxMemory() {
		
		const deviceAuxMemory: AWJfeedback<{ screens: string[], preset: string, memory: string, unmodified: number }> = {
			type: 'boolean',
			name: 'Aux Memory',
			description: 'Shows wether a Aux Memory is loaded on a auxscreen',
			defaultStyle: {
				color: this.config.color_dark,
				bgcolor: this.config.color_highlight,
			},
			options: [
				{
					id: 'screens',
					type: 'dropdown',
					label: 'Aux Screens',
					choices: [{ id: 'all', label: 'Any' }, ...this.choices.getAuxChoices()],
					multiple: true,
					tags: true,
					regex: '/^S([1-9]|[1-3][0-9]|4[0-8])$/',
					default: ['all'],
				} as any, // TODO: fix type of dropdown with multiple: true property
				{
					id: 'preset',
					type: 'dropdown',
					label: 'Preset',
					choices: [{ id: 'all', label: 'Any' }, ...this.choices.choicesPreset],
					default: 'all',
				},
				{
					id: 'memory',
					type: 'dropdown',
					label: 'Aux Memory',
					choices: this.choices.getAuxMemoryChoices(),
					default: this.choices.getAuxMemoryChoices()[0]?.id,
				},
				{
					id: 'unmodified',
					type: 'dropdown',
					label: 'is Modified',
					choices: [
						{ id: 0, label: 'only if unmodified' },
						{ id: 1, label: 'only if modified' },
						{ id: 2, label: "don't care unmodified or modified" },
					],
					default: 2,
				},
			],
			callback: (feedback) => {
				if (this.state.platform !== 'midra') return false // we are not connected or connected to a livepremier
				const screens = this.choices.getChosenAuxes(feedback.options.screens)
				const presets = feedback.options.preset === 'all' ? ['pgm', 'pvw'] : [feedback.options.preset]
				const map = {
					livepremier: { id: ['presetId','status','pp','id'], modified: ['presetId','status','pp','isNotModified'], modyes: true },
					midra: {id: ['status','pp','memoryId'], modified: ['status','pp','isModified'], modyes: false}
				}
				for (const screen of screens) {
					for (const preset of presets) {
						if (
							this.state.get([
								'DEVICE',
								'device',
								'screenList',
								'items',
								screen,
								'presetList',
								'items',
								this.choices.getPreset(screen, preset),
								...map[this.state.platform].id,
							]) == feedback.options.memory
						) {
							if (feedback.options.unmodified === 2) return true
							const modified = this.state.get([
								'DEVICE',
								'device',
								'screenList',
								'items',
								screen,
								'presetList',
								'items',
								this.choices.getPreset(screen, preset),
								...map[this.state.platform].modified,
							])
							if ( ((!map[this.state.platform].modyes && modified) || (map[this.state.platform].modyes && !modified)) == feedback.options.unmodified) {
								return true
							}
						}
					}
				}
				return false
			},
		}

		return deviceAuxMemory
	}

	// MARK: deviceSourceTally
	get deviceSourceTally() {
		
		const deviceSourceTally: AWJfeedback<{ screens: string[], preset: string, source: string }> = {
			type: 'boolean',
			name: 'Source Tally',
			description: 'Shows wether a source is visible on program or preview in a screen',
			defaultStyle: {
				color: this.config.color_dark,
				bgcolor: this.config.color_highlight,
			},
			options: [
				{
					id: 'screens',
					type: 'dropdown',
					label: 'Screens / Auxscreens',
					choices: [{ id: 'all', label: 'Any' }, ...this.choices.getScreenAuxChoices()],
					multiple: true,
					tags: true,
					regex: '/^(S|A)([1-9]|[1-3][0-9]|4[0-8])$/',
					default: ['all'],
				} as any, // TODO: fix type of dropdown with multiple: true property
				{
					id: 'preset',
					type: 'dropdown',
					label: 'Preset',
					choices: this.choices.choicesPreset,
					default: 'pgm',
				},
				{
					id: 'source',
					type: 'dropdown',
					label: 'Source',
					choices: [...this.choices.getSourceChoices(), ...this.choices.choicesBackgroundSources],
					default: 'NONE',
				},
			],
			callback: (feedback) => {  
				if (!this.state.platform.startsWith('livepremier') && this.state.platform !== 'midra') return false // we are not connected
				const checkTally = (): boolean => {
					// go thru the screens
					for (const screen of this.choices.getChosenScreenAuxes(feedback.options.screens)) {
						const preset = this.choices.getPreset(screen, feedback.options.preset)
						for (const layer of this.choices.getLayerChoices(screen)) {
							const screenpath = [
								'DEVICE',
								'device',
								'screenList',
								'items',
								screen
							]
							const presetpath = [...screenpath, 'presetList', 'items', preset]
							const layerpath = [...presetpath, 'layerList', 'items', layer.id]
		
							// check if source is used in background set on a screen
							if (layer.id === 'NATIVE' && this.state.platform === 'midra') {
								const set = this.state.get([...presetpath, 'background', 'source', 'pp', 'set'])
								if (set === 'NONE') continue
								const setinput = this.state.get([...screenpath, 'backgroundSetList', 'items', set, 'control', 'pp', 'singleContent'])
								if (setinput === feedback.options.source) return true
								else continue
							}
		
							// check is source is used in background layer on a aux
							if (layer.id === 'BKG' && this.state.platform === 'midra') {
								const bkginput = this.state.get([...presetpath, 'background', 'source', 'pp', 'content'])
								if (bkginput === feedback.options.source) return true
								else continue
							}
		
							// check if source is used in top layer
							if (layer.id === 'TOP' && this.state.platform === 'midra') {
								const frginput = this.state.get([...presetpath, 'top', 'source', 'pp', 'frame'])
								if (frginput === feedback.options.source) return true
								else continue
							}
							
							if ((feedback.options.source === 'NONE' || feedback.options.source?.toString().startsWith('BACKGROUND') && this.state.get([...presetpath, 'source', 'pp', 'inputNum']) === feedback.options.source)) {
								return true
							}
							if (this.state.get([...layerpath, 'source', 'pp', 'inputNum']) === feedback.options.source) {
								const invisible = (
									this.state.get([...layerpath, 'position', 'pp', 'sizeH']) === 0 ||
									this.state.get([...layerpath, 'position', 'pp', 'sizeV']) === 0 ||
									this.state.get([...layerpath, 'opacity', 'pp', 'opacity']) === 0 ||
									this.state.get([...layerpath, 'cropping', 'classic', 'pp', 'top']) +
										this.state.get([...layerpath,'cropping', 'classic', 'pp', 'bottom']) >
										65528 ||
									this.state.get([...layerpath, 'cropping', 'classic', 'pp', 'left']) +
										this.state.get([...layerpath, 'cropping', 'classic', 'pp', 'right']) >
										65528 ||
									this.state.get([...layerpath, 'cropping', 'mask', 'pp', 'top']) +
										this.state.get([...layerpath, 'cropping', 'mask', 'pp', 'bottom']) >
										65528 ||
									this.state.get([...layerpath, 'cropping', 'mask', 'pp', 'left']) +
										this.state.get([...layerpath, 'cropping', 'mask', 'pp', 'right']) >
										65528 ||
									this.state.get([...layerpath, 'position', 'pp', 'posH']) + this.state.get([...layerpath, 'position', 'pp', 'sizeH']) / 2 <= 0 ||
									this.state.get([...layerpath, 'position', 'pp', 'posV']) + this.state.get([...layerpath, 'position', 'pp', 'sizeV']) / 2 <= 0 ||
									this.state.get([...layerpath, 'position', 'pp', 'posH']) - this.state.get([...layerpath, 'position', 'pp', 'sizeH']) / 2 >=
										this.state.get(['DEVICE', 'device', 'screenList', 'items', screen, 'status', 'size', 'pp', 'sizeH']) ||
									this.state.get([...layerpath, 'position', 'pp', 'posV']) - this.state.get([...layerpath, 'position', 'pp', 'sizeV']) / 2 >=
										this.state.get(['DEVICE', 'device', 'screenList', 'items', screen, 'status', 'size', 'pp', 'sizeV'])
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
			},
			subscribe: (feedback: CompanionFeedbackBooleanEvent & { options: { screens: string[], preset: string, source: string } }) => {
				const sortedScreens = [...feedback.options.screens].sort()
				const varName = `tally_${sortedScreens.join('-')}_${feedback.options.preset}_${feedback.options.source}`
				this.instance.addVariable({
					id: feedback.id,
					variableId: varName,
					name: `Tally for ${feedback.options.source} at screens ${sortedScreens.join(', ')}, preset ${feedback.options.preset}`,
				})
			},
			unsubscribe: (feedback: CompanionFeedbackBooleanEvent & { options: { screens: string[], preset: string, source: string } }) => {
				const sortedScreens = [...feedback.options.screens].sort()
				const varName = `tally_${sortedScreens.join('-')}_${feedback.options.preset}_${feedback.options.source}`
				this.instance.removeVariable(feedback.id, varName)
			}
		}

		return deviceSourceTally
	}

	// MARK: deviceTake
	get deviceTake() {
		
		const deviceTake: AWJfeedback<{screens: string}> = {
			type: 'boolean',
			name: 'Transition active',
			description: 'Shows wether a screen is currently in a take/fade transition',
			defaultStyle: {
				color: this.config.color_dark,
				bgcolor: this.config.color_highlight,
			},
			options: [
				{
					id: 'screens',
					type: 'dropdown',
					label: 'Screens / Auxscreens',
					choices: [{ id: 'all', label: 'Any' }, ...this.choices.getScreenAuxChoices()],
					multiple: true,
					tags: true,
					regex: '/^(S|A)([1-9]|[1-3][0-9]|4[0-8])$/',
					default: 'all',
				} as any, // TODO: fix type of dropdown with multiple: true property
			],
			callback: (feedback) => {
				if (this.state.platform.startsWith('livepremier') && this.choices.getChosenScreenAuxes(feedback.options.screens)
					.find((screen: string) => {
						return this.state.get(`DEVICE/device/screenGroupList/items/${screen}/status/pp/transition`)?.match(/FROM/)
					})) return true
		
				else if (this.state.platform === 'midra' && this.choices.getChosenScreenAuxes(feedback.options.screens)
					.find((screen: string) => {
						return this.state.get(`DEVICE/device/transition/screenList/items/${screen}/status/pp/transition`)?.match(/FROM/)
					})) return true
				
				return false
			},
		}

		return deviceTake
	}

	// MARK: liveScreenSelection
	get liveScreenSelection() {
		
		const liveScreenSelection: AWJfeedback<{screen: string}> = {
			type: 'boolean',
			name: 'Screen Selection',
			description: 'Shows wether a screen is currently selected',
			defaultStyle: {
				color: this.config.color_dark,
				bgcolor: this.config.color_highlight,
			},
			options: [
				{
					id: 'screen',
					type: 'dropdown',
					label: 'Screen / Auxscreen',
					choices: this.choices.getScreenAuxChoices(),
					default: this.choices.getScreenAuxChoices()[0]?.id
				},
			],
			callback: (feedback) => {
				if (!this.state.platform.startsWith('livepremier') && this.state.platform !== 'midra') return false // we are not connected
				return this.choices.getSelectedScreens()?.includes(feedback.options.screen)
			},
		}

		return liveScreenSelection
	}

	// MARK: liveScreenLock
	get liveScreenLock() {
		
		const liveScreenLock: AWJfeedback<{screen: string, preset: string }> = {
			type: 'boolean',
			name: 'Screen Lock',
			description: 'Shows wether a screen currently is locked',
			defaultStyle: {
				png64:
					'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3CAYAAACo29JGAAABSklEQVRoge2a2w7DIAhAZdl3N60/zp5MjBNLBdwknKe19cIZLdVlKTkGrCc4jgOpazln0/lNBh8JUViIqg44I9WiKaky0J0UwHgaxO/uAADXdYnieol6J7lYacNp9xSxHMVMwHV77KXzaQySzlTWmiB5gRB9JM+geuZKkIjIFivt2zHEscx27GWtFmvOd+fp3Xq9MWazp565JgNAiZXr2vPXqMm1cXIDb9uVL0fD26xa/gMhtyshtyshtyshtyshtyuu5YarU40ffKwZbYdcZ+7NbWi89WKBiAkA2Dt815kLuV1hP3NSzvOE6vOSKrwkc7VY79gKczlKZIWgqdydgLWg64IScrPcVUXrqrmioHQFVrwOVr0KcHRsRbzndiXkJLhdofyakJsl1paGuJYz3YmvWolQuM6cazn2banwPzMVnsThOnOu5VzzARnBeIM8tq0ZAAAAAElFTkSuQmCC',
			},
			options: [
				{
					id: 'screen',
					type: 'dropdown',
					label: 'Screen',
					choices: [{ id: 'all', label: 'ALL' }, ...this.choices.getScreenAuxChoices()],
					default: 'all',
					tooltip: '"All" resembels the state of the lock-all button in WebRCS.',
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
			],
			callback: (feedback: CompanionFeedbackBooleanEvent & { options: { screen: string, preset: string } }) => {
				if (!this.state.platform.startsWith('livepremier') && this.state.platform !== 'midra') return false // we are not connected
				return this.choices.isLocked(feedback.options.screen, feedback.options.preset)
			},
		}

		return liveScreenLock
	}

	// MARK: livePresetSelection
	get livePresetSelection() {
		
		const livePresetSelection: AWJfeedback<{preset: string }> = {
			type: 'boolean',
			name: 'Preset Selection',
			description: 'Shows wether program or preview is currently selected',
			defaultStyle: {
				color: this.config.color_dark,
				bgcolor: this.config.color_highlight,
			},
			options: [
				{
					id: 'preset',
					type: 'dropdown',
					label: 'Preset',
					choices: [
						{ id: 'PROGRAM', label: 'Program' },
						{ id: 'PREVIEW', label: 'Preview' },
					],
					default: 'PROGRAM'
				},
			],
			callback: (feedback) => {
				if (!this.state.platform.startsWith('livepremier') && this.state.platform !== 'midra') return false // we are not connected
				let preset: string,
					vartext = 'PGM'
				if (this.state.syncSelection) {
					preset = this.state.get('REMOTE/live/screens/presetModeSelection/presetMode')
				} else {
					preset = this.state.get('LOCAL/presetMode')
				}
				if (preset === 'PREVIEW') {
					vartext = 'PVW'
				}
				this.instance.setVariableValues({ selectedPreset: vartext })
				return preset === feedback.options.preset
			},
		}

		return livePresetSelection
	}

	// MARK: remoteLayerSelection
	get remoteLayerSelection() {
		
		const remoteLayerSelection: AWJfeedback<{screen: string, layer: string, preset: string }> = {
			type: 'boolean',
			name: 'Layer Selection',
			description: 'Shows wether a layer is currently selected',
			defaultStyle: {
				color: this.config.color_dark,
				bgcolor: this.config.color_highlight,
			},
			options: [
				{
					id: 'screen',
					type: 'dropdown',
					label: 'Screen / Auxscreen',
					choices: this.choices.getScreenAuxChoices(),
					default: this.choices.getScreenAuxChoices()[0]?.id,
				},
				{
					id: 'layer',
					type: 'dropdown',
					label: 'Layer',
					choices: [{ id: 'all', label: 'Any' }, ...this.choices.getLayerChoices(48, true)],
					default: 'all',
				},
				{
					id: 'preset',
					type: 'dropdown',
					label: 'Selected Preset',
					choices: [
						{ id: 'all', label: 'Any' },
						{ id: 'PROGRAM', label: 'Program' },
						{ id: 'PREVIEW', label: 'Preview' },
					],
					default: 'all',
				},
			],
			callback: (feedback) => {
				if (!this.state.platform.startsWith('livepremier') && this.state.platform !== 'midra') return false // we are not connected
				let pst = true
				if (feedback.options.preset != 'all') {
					let preset: string
					if (this.state.syncSelection) {
						preset = this.state.get('REMOTE/live/screens/presetModeSelection/presetMode')
					} else {
						preset = this.state.get('LOCAL/presetMode')
					}
					if (preset != feedback.options.preset) {
						pst = false
					}
				}
				if (feedback.options.layer === 'all') {
					return (
						JSON.stringify(this.choices.getSelectedLayers()).includes(
							`{"screenAuxKey":"${feedback.options.screen}","layerKey":"`
						) && pst
					)
				} else {
					return (
						JSON.stringify(this.choices.getSelectedLayers()).includes(
							`{"screenAuxKey":"${feedback.options.screen}","layerKey":"${feedback.options.layer}"}`
						) && pst
					)
				}
			},
		}

		return remoteLayerSelection
	}

	// MARK: remoteWidgetSelection
	get remoteWidgetSelection() {
		
		const remoteWidgetSelection: AWJfeedback<{widget: string }> = {
			type: 'boolean',
			name: 'Widget Selection',
			description: 'Shows wether a multiviewer widget is currently selected',
			defaultStyle: {
				color: this.config.color_dark,
				bgcolor: this.config.color_highlight,
			},
			options: [
				{
					id: 'widget',
					type: 'dropdown',
					label: 'Widget',
					choices: this.choices.getWidgetChoices(),
					default: this.choices.getWidgetChoices()[0]?.id,
				},
			],
			callback: (feedback) => {
				if (!this.state.platform.startsWith('livepremier') && this.state.platform !== 'midra') return false // we are not connected
				const mvw = feedback.options.widget?.toString().split(':')[0] ?? '1'
				const widget = feedback.options.widget?.toString().split(':')[1] ?? '0'
				let widgetSelection: {widgetKey: string, multiviewerKey: string}[] = []
				if (this.state.syncSelection) {
					widgetSelection = [...this.state.get('REMOTE/live/multiviewers/widgetSelection/widgetIds')]
				} else {
					widgetSelection = this.state.get('LOCAL/widgetSelection/widgetIds')
				}
				return JSON.stringify(widgetSelection).includes(`{"widgetKey":"${widget}","multiviewerKey":"${mvw}"}`)
			},
		}

		return remoteWidgetSelection
	}

	// MARK: deviceInputFreeze
	get deviceInputFreeze() {
		
		const deviceInputFreeze: AWJfeedback<{input: string}> = {
			type: 'boolean',
			name: 'Input Freeze',
			description: 'Shows wether an input currently is frozen',
			defaultStyle: {
				color: this.config.color_bright,
				bgcolor: combineRgb(0, 0, 100),
				png64:
					'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3AQMAAACSFUAFAAABS2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxMzggNzkuMTU5ODI0LCAyMDE2LzA5LzE0LTAxOjA5OjAxICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+IEmuOgAAAARnQU1BAACxjwv8YQUAAAABc1JHQgCuzhzpAAAABlBMVEUAAABfXKLsUQDeAAAAAXRSTlMAQObYZgAAAM9JREFUGNONkTEOwjAMRX9UpDC1nIBwEKRyJCMGmNogDsCRyMY1wg26ESTUYLc1sEGWp1h2/vcPABDG84MrWoxXOgxcUycol7tbEFb748Aim4HmKZyXSCZsUFpQwQ1OeIqorsxzQHFnXgCTmT3PtczErD1ZEXCBXJR6RzXXzSNR3wA2NrvkPCpf52gDZnDZw3Oj7Ue/xfObM9gMSL/LgfttbHPH8+bRb+U9tIla0XVx1FP9yY/6U7/qX/fR/XRf3f+Th+Yz5aX5vfPUfP/6jxdhImTMvNrBOgAAAABJRU5ErkJggg==',
			},
			options: [
				{
					id: 'input',
					type: 'dropdown',
					label: 'Input',
					choices: this.choices.getLiveInputChoices(),
					default: this.choices.getLiveInputChoices()[0]?.id,
				},
			],
			callback: (feedback) => {
				if (!this.state.platform.startsWith('livepremier') && this.state.platform !== 'midra') return false // we are not connected
				const input = feedback.options.input?.toString().replace('LIVE', 'IN') || ''
				const freeze = this.state.get('DEVICE/device/inputList/items/' + input + '/control/pp/freeze')
				if (freeze) {
					this.instance.setVariableValues({ ['frozen_' + input]: '*'})
				} else {
					this.instance.setVariableValues({ ['frozen_' + input]: ' '})
				}
				return freeze
			},
		}

		return deviceInputFreeze
	}

	// MARK: deviceLayerFreeze
	// Midra only
	get deviceLayerFreeze() {
		
		const deviceLayerFreeze: AWJfeedback<{screen: string}> = {
			type: 'boolean',
			name: 'Layer Freeze',
			description: 'Shows wether a layer currently is frozen',
			defaultStyle: {
				color: this.config.color_bright,
				bgcolor: combineRgb(0, 0, 100),
				png64:
					'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3AQMAAACSFUAFAAABS2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxMzggNzkuMTU5ODI0LCAyMDE2LzA5LzE0LTAxOjA5OjAxICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+IEmuOgAAAARnQU1BAACxjwv8YQUAAAABc1JHQgCuzhzpAAAABlBMVEUAAABfXKLsUQDeAAAAAXRSTlMAQObYZgAAAM9JREFUGNONkTEOwjAMRX9UpDC1nIBwEKRyJCMGmNogDsCRyMY1wg26ESTUYLc1sEGWp1h2/vcPABDG84MrWoxXOgxcUycol7tbEFb748Aim4HmKZyXSCZsUFpQwQ1OeIqorsxzQHFnXgCTmT3PtczErD1ZEXCBXJR6RzXXzSNR3wA2NrvkPCpf52gDZnDZw3Oj7Ue/xfObM9gMSL/LgfttbHPH8+bRb+U9tIla0XVx1FP9yY/6U7/qX/fR/XRf3f+Th+Yz5aX5vfPUfP/6jxdhImTMvNrBOgAAAABJRU5ErkJggg==',
			},
			options: [
				{
					id: 'screen',
					type: 'dropdown',
					label: 'Screen',
					choices: [{id: 'any', label:'Any'}, ...this.choices.getScreenChoices()],
					default: this.choices.getScreenChoices()[0]?.id,
				},
				...[
					{id: 'any', label:'Any'},
					...this.choices.getScreenChoices()
				].map(
					(screen) => {
						const opt = {
							id: `layer${screen.id}`,
							type: 'dropdown' as const,
							label: 'Layer',
							choices: [
								{id:'any', label: 'Any'},
								{id:'NATIVE', label: 'Background Layer'}
							],
							default: '1',
							isVisibleData: screen.id,
							isVisible: (options: any, screenID: string) => {
								return options.screen === screenID
							}
						}
						if (screen.id === 'any') {
							opt.choices.push(...this.choices.getLayerChoices(8, false))
						} else {
							opt.label += ' ' + screen.id
							opt.choices.push(...this.choices.getLayerChoices(screen.id, false))
						}
						return opt
					}
				),
			],
			callback: (feedback) => {
				if (this.state.platform !== 'midra') return false // we are not connected
				//const screen = feedback.options.screen.substring(1)
				let retval = false
				let screens: Choicemeta[]
				if (feedback.options.screen === 'any') {
					screens = this.choices.getScreensArray()
				} else {
					screens = [{id: feedback.options.screen, label: feedback.options.screen}]
				}
				const layeropt = feedback.options[`layer${feedback.options.screen}`] as string
				for (const screen of screens) {
					let layers: string[]
					if (layeropt === 'any') {
						layers = this.choices.getLayersAsArray(screen.id, false)
					} else {
						layers = [layeropt]
					}
					for (const layer of layers) {
						const screenNum = screen.id.substring(1)
						let path: string[]
						if (layer === 'NATIVE') {
							path = ['DEVICE', 'device', 'screenList', 'items', screenNum, 'background', 'control', 'pp', 'freeze']
						} else {
							path = ['DEVICE', 'device', 'screenList', 'items', screenNum, 'liveLayerList', 'items', layer, 'control', 'pp', 'freeze']
						}
						if (this.state.getUnmapped(path)) retval = true
					}
				}
				return retval
				
			},
		}

		return deviceLayerFreeze
	}

	// MARK: deviceScreenFreeze
	// Midra only
	get deviceScreenFreeze() {
		
		const deviceScreenFreeze: AWJfeedback<{screen: string}> = {
			type: 'boolean',
			name: 'Screen Freeze',
			description: 'Shows wether a screen currently is frozen',
			defaultStyle: {
				color: this.config.color_bright,
				bgcolor: combineRgb(0, 0, 100),
				png64:
					'iVBORw0KGgoAAAANSUhEUgAAADcAAAA3AQMAAACSFUAFAAABS2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxMzggNzkuMTU5ODI0LCAyMDE2LzA5LzE0LTAxOjA5OjAxICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+IEmuOgAAAARnQU1BAACxjwv8YQUAAAABc1JHQgCuzhzpAAAABlBMVEUAAABfXKLsUQDeAAAAAXRSTlMAQObYZgAAAM9JREFUGNONkTEOwjAMRX9UpDC1nIBwEKRyJCMGmNogDsCRyMY1wg26ESTUYLc1sEGWp1h2/vcPABDG84MrWoxXOgxcUycol7tbEFb748Aim4HmKZyXSCZsUFpQwQ1OeIqorsxzQHFnXgCTmT3PtczErD1ZEXCBXJR6RzXXzSNR3wA2NrvkPCpf52gDZnDZw3Oj7Ue/xfObM9gMSL/LgfttbHPH8+bRb+U9tIla0XVx1FP9yY/6U7/qX/fR/XRf3f+Th+Yz5aX5vfPUfP/6jxdhImTMvNrBOgAAAABJRU5ErkJggg==',
			},
			options: [
				{
					id: 'screen',
					type: 'dropdown',
					label: 'Screen',
					choices: [{id: 'any', label:'Any'}, ...this.choices.getScreenAuxChoices()],
					default: this.choices.getScreenAuxChoices()[0]?.id,
				}
			],
			callback: (feedback) => {
				if (this.state.platform !== 'midra') return false // we are not connected
				//const screen = feedback.options.screen.substring(1)
				let retval = false
				let screens: Choicemeta[]
				if (feedback.options.screen === 'any') {
					screens = this.choices.getScreensAuxArray()
				} else {
					screens = [{id: feedback.options.screen, label: feedback.options.screen}]
				}
				for (const screen of screens) {
					const path = ['DEVICE', 'device', 'screenList', 'items', screen.id, 'control', 'pp', 'freeze']
					if (this.state.get(path)) retval = true
				}
				return retval
			},
		}

		return deviceScreenFreeze
	}

	// MARK: timerState
	get timerState() {
		
		const timerState: AWJfeedback<{timer: string, state: string }> = {
			type: 'boolean',
			name: 'Timer State',
			description: 'Shows wether a timer is currently stopped or running',
			defaultStyle: {
				color: this.config.color_dark,
				bgcolor: this.config.color_highlight,
			},
			options: [
				{
					id: 'timer',
					type: 'dropdown',
					label: 'Timer',
					choices: this.choices.getTimerChoices(),
					default: this.choices.getTimerChoices()[0]?.id,
				},
				{
					id: 'state',
					type: 'dropdown',
					label: 'StateMachine',
					choices: [
						{ id: 'RUNNING', label: 'Running' },
						{ id: 'PAUSED', label: 'Paused' },
						{ id: 'IDLE', label: 'Stopped' },
						{ id: 'ELAPSED', label: 'Elapsed' },
					],
					default: 'RUNNING',
				},
			],
			callback: (feedback) => {
				if (!this.state.platform.startsWith('livepremier') && this.state.platform !== 'midra') return false // we are not connected
				return (
					this.state.get('DEVICE/device/timerList/items/' + feedback.options.timer + '/status/pp/state') ===
					feedback.options.state
				)
			},
		}

		return timerState
	}

	// MARK: deviceGpioOut
	// LivePremier only
	get deviceGpioOut() {
		
		const deviceGpioOut: AWJfeedback<{gpo: number, state: number }> = {
			type: 'boolean',
			name: 'GPO State',
			description: 'Shows wether a general purpose output is currently active',
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
				if (!this.state.platform.startsWith('livepremier') && this.state.platform !== 'midra') return false // we are not connected
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

	// MARK: deviceGpioIn
	// LivePremier only
	get deviceGpioIn() {
		
		const deviceGpioIn: AWJfeedback<{gpi: number, state: number }> = {
			type: 'boolean',
			name: 'GPI StateMachine',
			description: 'Shows wether a general purpose input is currently active',
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
				if (!this.state.platform.startsWith('livepremier') && this.state.platform !== 'midra') return false // we are not connected
				const val = feedback.options.state === 1 ? true : false
				return (
					this.state.get([
						'DEVICE',
						'device',
						'gpio',
						'gpiList',
						'items',
						feedback.options.gpi?.toString() || '1',
						'status',
						'pp',
						'state',
					]) === val
				)
			},
		}

		return deviceGpioIn
	}

	// MARK: deviceStreaming
	// Midra only
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
				if (!this.state.platform.startsWith('livepremier') && this.state.platform !== 'midra') return false // we are not connected
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

	// MARK: deviceCustom
	get deviceCustom() {
		type FeedbackDeviceCustomOptions = {
			path: string,
			valuetype: string,
			actionst: string,
			textValue: string,
			actionsn: string,
			numericValue: number,
			numericValue2: number,
			invert: boolean,
			variable: string
		}
		
		const deviceCustom: AWJfeedback<FeedbackDeviceCustomOptions> = {
			type: 'boolean',
			name: 'Custom Feedback',
			description: 'Generates feedback and a variable from a custom AWJ path',
			defaultStyle: {
				color: this.config.color_dark,
				bgcolor: this.config.color_highlight,
			},
			options: [
				{
					type: 'textinput',
					id: 'path',
					label: 'path',
					default: '',
					regex: `/${regexAWJpath}/`,
					tooltip: 'AWJ path of property to watch for, enter a path to exactly one property with no wildcards.\nPGM/PVW can be used for the presets and will be replaced dynamically.'
				},
				{
					type: 'dropdown',
					id: 'valuetype',
					label: 'Evaluate value as type',
					choices: [
						{ id: 't', label: 'Text' },
						{ id: 'n', label: 'Number' },
						{ id: 'b', label: 'Boolean' },
						{ id: 'o', label: 'Object' },
					],
					default: 't',
				},
				{
					type: 'dropdown',
					id: 'actionst',
					label: 'Check',
					choices: [
						{ id: '1', label: 'Text equals' },
						{ id: '2', label: 'Text containes' },
						{ id: '3', label: 'Text length is' },
						{ id: '4', label: 'Text matches regular expression' },
					],
					default: '1',
					isVisible: (thisOptions) => { return thisOptions.valuetype === 't' },
				},
				{
					type: 'textinput',
					id: 'textValue',
					label: 'value',
					default: '',
					isVisible: (thisOptions) => { return thisOptions.valuetype === 't' },
				},
				{
					type: 'dropdown',
					id: 'actionsn',
					label: 'Check',
					choices: [
						{ id: '==', label: 'Number equals' },
						{ id: '>', label: 'Number is greater than' },
						{ id: '...', label: 'Number is in range between value and value2' },
						{ id: '%', label: 'Number modulo value is value2' },
					],
					default: '==',
					isVisible: (thisOptions) => { return thisOptions.valuetype === 'n' },
				},
				{
					type: 'number',
					id: 'numericValue',
					label: 'value1',
					default: 0,
					min: Number.MIN_VALUE,
					max: Number.MAX_VALUE,
					isVisible: (thisOptions) => { return thisOptions.valuetype === 'n' },
				},
				{
					type: 'number',
					id: 'numericValue2',
					label: 'value 2',
					default: 0,
					min: Number.MIN_VALUE,
					max: Number.MAX_VALUE,
					isVisible: (thisOptions) => { return thisOptions.valuetype === 'n' && (thisOptions.actionsn === '...' || thisOptions.actionsn === '%') },
				},
				{
					type: 'checkbox',
					id: 'invert',
					label: 'Invert feedback result',
					default: false,
				},
				{
					type: 'textinput',
					id: 'variable',
					label: 'Custom Name of Variable to use',
					default: '',
					regex: '/^[A-Za-z0-9_-]*$/',
					tooltip: 'Can be left empty, if filled this will be the name of the variable with the value of the feedback.\nOnly letters, numbers, underscore and minus is allowed.'
				}
			],
			learn: (feedback) => {
				const newoptions = {
				}
				const lastMsg = this.state.get('LOCAL/lastMsg')
				const path = lastMsg.path
				const value = lastMsg.value
				if (JSON.stringify(value).length > 132) {
					return undefined
				}
				newoptions['path'] = this.instance.jsonToAWJpath(path)
				switch (typeof value) {
					case 'string':
						newoptions['valuetype'] = 't'
						newoptions['actionst'] = '1'
						newoptions['textValue'] = value
						break
					case 'number':
						newoptions['valuetype'] = 'n'
						newoptions['actionsn'] = '=='
						newoptions['numericValue'] = value
						break
					case 'boolean':
						newoptions['valuetype'] = 'b'
						break
					case 'object':
						newoptions['valuetype'] = 'o'
				}

				return {
					...feedback.options,
					...newoptions,
				}
			},
			callback: (feedback: CompanionFeedbackBooleanEvent & { options: FeedbackDeviceCustomOptions }) => {
				if (!this.state.platform.startsWith('livepremier') && this.state.platform !== 'midra') return false // we are not connected
				let ret = false
				const path = this.instance.AWJtoJsonPath(feedback.options.path)
				if (path.length < 2) {
					return false
				}
				const value = this.state.get(['DEVICE', ...path])
				let varId = feedback.options.variable.replace(/[^A-Za-z0-9_-]/g, '')
				if (varId === '') varId = feedback.options.path.replace(/\//g, '_').replace(/[^A-Za-z0-9_-]/g, '')

				if (value === undefined) {
					this.instance.setVariableValues({ [varId]: undefined })
				} else if (value === null) {
					this.instance.setVariableValues({ [varId]: 'null' })
				} else if (feedback.options.valuetype === 't') {
					const valuet: string = (typeof value === 'string') ? value : JSON.stringify(value)
					this.instance.setVariableValues({ [varId]: valuet })
					switch (feedback.options.actionst) {
						case '1':
							ret = (valuet === feedback.options.textValue)
							break
					
						case '2':
							ret = valuet.includes(feedback.options.textValue)
							break
					
						case '3':
							ret = (valuet.length === parseInt(feedback.options.textValue))
							break
					
						case '4':
							ret = valuet.match(new RegExp(feedback.options.textValue)) !== null
							break
					
						default:
							break
					}
				} else if (feedback.options.valuetype === 'n') {
					const valuen = Number(value)
					this.instance.setVariableValues({ [varId]: valuen })
					switch (feedback.options.actionsn) {
						case '==':
							ret = (valuen === feedback.options.numericValue)
							break
					
						case '>':
							ret = (valuen > feedback.options.numericValue)
							break
					
						case '...':
							if (feedback.options.numericValue2 > feedback.options.numericValue)
								ret = (valuen >= feedback.options.numericValue && valuen <= feedback.options.numericValue2)
							else
								ret = (valuen >= feedback.options.numericValue2 && valuen <= feedback.options.numericValue)
							break

						case '%':
							ret = (valuen % feedback.options.numericValue === feedback.options.numericValue2)
							break
					
						default:
							break
					}
				} else if (feedback.options.valuetype === 'b') {
					if (typeof value === 'boolean') {
						ret = value
					} else if (typeof value === 'number') {
						ret = value >= 0.5 ? true : false
					} else if (typeof value === 'string') {
						ret = value.match(/^y(es)?|true|0*1|go|\+|right|correct|ok(ay)?$/i) !== null
					}
					const bool = feedback.options.invert ? !ret : ret
					this.instance.setVariableValues({ [varId]: bool ? 1 : 0 })
				} else if (feedback.options.valuetype === 'o') { 
					const valueo = JSON.stringify(value)
					this.instance.setVariableValues({ [varId]: valueo })
					ret = valueo.length > 0
				}
				return feedback.options.invert ? !ret : ret
			},
			subscribe: (feedback) => {
				// console.log('subscribe', feedback.id, feedback.options.path);
				let varId = ''
				const sub = {}
				let varname = `Custom Variable for Path ${feedback.options.path}`
				if (feedback.options.path.match(regexAWJpath) !== null) {
					// we got a path to work with
					varname = `Custom Variable for Feedback ${feedback.options.path}`
					if (feedback.options.variable.match(/[A-Za-z0-9_-]+/) !== null) {
						varId = feedback.options.variable.replace(/[^A-Za-z0-9_-]/g, '')
					} else {
						varId = feedback.options.path.replace(/\//g, '_').replace(/[^A-Za-z0-9_-]/g, '')
					}
					const parts = this.instance.AWJtoJsonPath(feedback.options.path)

					if (
						parts[4] === 'presetList' &&
						parts[5] === 'items' &&
						parts[6] &&
						feedback.options.path.split('/')[6]?.match(/^PGM|PVW|program|preview$/i) !== null
					) {
						parts[6] = '(\\w+?)'
						sub[`${feedback.id}-take`] = {
							pat: 'DEVICE/device/(screenGroup|transition/screen)List/items/(\\w+?)/status/pp/transition',
							fbk: `id:${feedback.id}`,
						}
					}

					sub[feedback.id] = {
						pat: parts.join('/'),
						fbk: `id:${feedback.id}`
					}
					// console.log('add sub', sub)
					this.instance.device.addSubscriptions(sub)
					// console.log('subscriptions', Object.keys(this.state.subscriptions).map(key => `${key} : ${this.state.subscriptions[key].pat}`))

				} else {
					// we got no valid path
					varname = `Custom Variable for Feedback ${feedback.id}`
					if (feedback.options.variable !== '') {
						varId = feedback.options.variable
					} else {
						varId = feedback.id
					}
				}
				this.instance.addVariable({
					id: feedback.id,
					variableId: varId,
					name: varname,
				})
			},
			unsubscribe: (feedback) => {
				this.instance.device.removeSubscription(feedback.id)
				this.instance.device.removeSubscription(feedback.id + '-take')
				this.instance.removeVariable(feedback.id)
			}
		}

		return deviceCustom
	}
}