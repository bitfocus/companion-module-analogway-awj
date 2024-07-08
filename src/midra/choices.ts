import { AWJinstance } from '..'
import Choices from '../awjdevice/choices.js'

type Dropdown<t> = {id: t, label: string}

export type Choicemeta = { id: string, label: string, index?: string, longname?: string, device?: number }

/**
 * Methods for retrieving device dependent data like properties, lists, choices out of the state or generating it
 */
export default class ChoicesMidra extends Choices {

	constructor(instance: AWJinstance) {
		super(instance)
		this.instance = instance
		this.state = this.instance.state
		this.constants = instance.constants
	}

	/**
	 * Takes a string like S1 or A2 and returns an object with a lot of parameters, some are different depending on the platform
	 * @param screen 
	 * @returns 
	 */
	getScreenInfo(screen: string) {
		let ret = {
			/** Id like S1, A2 */
			id: '',
			/** Id like S1 for Livepremier, 1 for Midra */
			platformId: '',
			/** Id like S1 for Livepremier, SCREEN_1 for Midra */
			platformLongId: '',/** S or A */
			prefix: '',
			/** number of screen as string */
			numstr: '',
			/** number of screen as number */
			number: NaN,
			/** is it a screen */
			isScreen: false,
			/** is it a auxiliary screen */
			isAux: false,
			/** screen or auxSCreen */
			prefixlong: '',
			/** screen or auxiliaryScreen */
			prefixverylong: '',
			/** Aux or empty */
			prefixAux: '',
			/** Auxiliary or empty */
			prefixAuxLong: ''
		}
		if (screen.startsWith('S')) {
			const numstr = screen.replace(/\D/g, '')
			const num = parseInt(numstr)
			ret = {
				id: `S${numstr}`,
				platformId: numstr,
				platformLongId: `SCREEN_${numstr}`,
				prefix: 'S',
				numstr,
				number: num,
				isScreen: true,
				isAux: false,
				prefixlong: 'screen',
				prefixverylong: 'screen',
				prefixAux: '',
				prefixAuxLong: ''
			}
		}
        else if (screen.startsWith('A')) {
			const numstr = screen.replace(/\D/g, '')
			const num = parseInt(numstr)
			ret = {
				id: `A${numstr}`,
				platformId: numstr,
				platformLongId: `AUX_${numstr}`,
				prefix: 'A',
				numstr,
				number: num,
				isScreen: false,
				isAux: true,
				prefixlong: 'auxScreen',
				prefixverylong: 'auxiliaryScreen',
				prefixAux: 'Aux',
				prefixAuxLong: 'Auxiliary'
			}
		}

        return ret
	}

	/** returns array of the currently available and active screens only (no auxes)*/
	public getScreensArray(getAlsoDisabled = false): Choicemeta[] {
		const ret: Choicemeta[] = []
		
		const screens = this.state.get('DEVICE/device/screenList/itemKeys')
		if (screens) {
			for (const screen of screens) {
				if (getAlsoDisabled || this.state.get('DEVICE/device/preconfig/status/stateList/items/CURRENT/screenList/items/' + screen + '/pp/enable') === true) {
					ret.push({
						id: 'S' + screen,
						label: this.state.get('DEVICE/device/screenList/items/' + screen + '/control/pp/label'),
						index: screen
					})
				}
			}
		} else {
			ret.push({ id: 'S1', label: '(emulated)', index: '1' })
		}
	
		return ret
	}

	/** returns array of the currently available and active auxscreens only (no regular screens)*/
	public getAuxArray(getAlsoDisabled = false ): Choicemeta[] {
		const ret: Choicemeta[] = []

		const screens = this.state.getUnmapped('DEVICE/device/auxiliaryScreenList/itemKeys')
		if (screens) {
			for (const screen of screens) {
				if (getAlsoDisabled || this.state.getUnmapped('DEVICE/device/preconfig/status/stateList/items/CURRENT/auxiliaryScreenList/items/' + screen + '/pp/mode') != 'DISABLE') {
					ret.push({
						id: 'A' + screen,
						label: this.state.getUnmapped('DEVICE/device/auxiliaryScreenList/items/' + screen + '/control/pp/label'),
						index: screen.replace(/\D/g, '')
					})
				}
			}
		} else {
			ret.push({ id: 'A1', label: '(emulated)', index: '1' })
		}
	
		return ret
	}

	public getPlatformScreenChoices(): Dropdown<string>[] {
		return [
			...this.getScreensArray().map((scr: Choicemeta) => {
			return {
				id: scr.id,
				label: `S${scr.index}${scr.label === '' ? '' : ' - ' + scr.label}`
			}
			})
		]
	}

	public getLiveInputArray(prefix?: string): Choicemeta[] {
		const ret: Choicemeta[] = []
	
		if(prefix == undefined) prefix = 'INPUT'
		const items = this.state.getUnmapped('DEVICE/device/inputList/itemKeys')
		if (items) {
			items.forEach((key: string) => {
				if (this.state.getUnmapped('DEVICE/device/inputList/items/' + key + '/status/pp/isAvailable')) {
					const plug = this.state.getUnmapped('DEVICE/device/inputList/items/' + key + '/control/pp/plug')
					ret.push({
						id: key.replace(/^\w+_/, prefix + '_'),
						label: this.state.getUnmapped('DEVICE/device/inputList/items/' + key + '/plugList/items/' + plug + '/control/pp/label'),
						index: key.replace(/^\w+_/, '')
					})
				}
			})
		}
	
		return ret
	}

	public getLiveInputChoices(prefix?: string): Dropdown<string>[] {
		const ret: Dropdown<string>[] = []
		const inputs = this.getLiveInputArray(prefix)

		if (inputs?.length) {
			for (const input of inputs) {
				ret.push({
					id: input.id,
					label: `Input ${input.index}${
						input.label.length === 0 ? '' : ' - ' + input.label
					}`,
				})
			}
		} else {
			if (prefix == undefined) prefix = 'INPUT'
			for (let i = 1; i <= 8; i += 1) {
				ret.push({ id: `${prefix}_${i.toString()}`, label: `Input ${i.toString()} (emulated)` })
			}
		}
		return ret
	}

	public getAuxBackgroundChoices(): Dropdown<string>[] {
		return [
			{id: 'NONE', label: 'None'},
			...this.getLiveInputChoices('INPUT'),
			...this.getScreensArray().map((screen: Choicemeta): Dropdown<string> => {
				return {
					id: 'PROGRAM_' + screen.index,
					label: screen.id + ' PGM' + (screen.label === '' ? '' : ' - ' + screen.label),
				}
			})
		]
	}

	choicesForegroundImagesSource: Dropdown<string>[] = [
		{ id: 'NONE', label: 'None' },
		{ id: 'TOP_1', label: 'Foreground Image 1' },
		{ id: 'TOP_2', label: 'Foreground Image 2' },
		{ id: 'TOP_3', label: 'Foreground Image 3' },
		{ id: 'TOP_4', label: 'Foreground Image 4' },
	]


	public getSourceChoices(): Dropdown<string>[] {
		// first add None and Color which are always available
		const ret:Dropdown<string>[] = [
			{ id: 'NONE', label: 'None' },
			{ id: 'COLOR', label: 'Color' },
		]

		// next add live inputs
		ret.push( ...this.getLiveInputChoices('INPUT') )

		return ret
	}

	public getAuxSourceChoices(): Dropdown<string>[] {
		// first add None and Color which are always available
		const ret: Dropdown<string>[] = [
			{ id: 'NONE', label: 'None' },
		]

		// next add live inputs
		ret.push( ...this.getLiveInputChoices('INPUT') )

		return ret
	}

	public getMasterMemoryArray(): Choicemeta[] {
		const bankpath = 'DEVICE/device/preset/masterBank/slotList'
		
		return (
			this.state.get(this.state.concat(bankpath, 'itemKeys'))?.filter((mem: string) => {
				return this.state.getUnmapped(this.state.concat(bankpath, ['items', mem, 'status', 'pp', 'isValid']))
			}).map((mem: string) => {
				return {
					id: mem,
					label: this.state.getUnmapped(this.state.concat(bankpath, ['items',mem,'control','pp','label',]))
				}
			}) ?? []
		)
	}

	public getAuxMemoryArray(): Choicemeta[] {
		const bankpath = 'DEVICE/device/preset/auxBank/slotList'
		return (
			this.state.getUnmapped(this.state.concat(bankpath, 'itemKeys'))?.filter((mem: string) => {
				return this.state.getUnmapped(this.state.concat(bankpath, ['items', mem, 'status', 'pp', 'isValid']))
			}).map((mem: string) => {
				return {
					id: mem,
					label: this.state.getUnmapped(this.state.concat(bankpath, ['items',mem,'control','pp','label',]))
				}
			}) ?? []
		)
	}

	public getAuxMemoryChoices(): Dropdown<string>[] {

		return this.getAuxMemoryArray().map((mem: Choicemeta) => {
			return {
				id: mem.id,
				label: `AM${mem.id}${mem.label === '' ? '' : ' - ' + mem.label}`
			}
		})
	}

	public getMultiviewerArray(): string[] {
		return ['1']
	}

	public getWidgetChoices(): Dropdown<string>[] {
		const ret: Dropdown<string>[] = []
		return this.state.getUnmapped('DEVICE/device/multiviewer/status/pp/widgetValidity').map((widget: string) => {
			return {
				id: '1:' + widget,
				label: `Widget ${parseInt(widget)}`,
			}
		})
		
		return ret
	}

	public getWidgetSourceChoices(): Dropdown<string>[] {
		// first add None which is always available
		const ret: Dropdown<string>[] = [{ id: 'NONE', label: 'None' }]

		// next add Screens
		for (const screen of this.getScreensArray()) {
			ret.push({
				id: 'SCREEN_PRGM_' + screen.index,
				label: `Screen ${screen.index} PGM${screen.label === '' ? '' : ' - ' + screen.label}`,
			})
			ret.push({
				id: 'SCREEN_PRW_' + screen.index,
				label: `Screen ${screen.index} PVW${screen.label === '' ? '' : ' - ' + screen.label}`,
			})
		}

		// next add live inputs
		ret.push(...this.getLiveInputChoices())

		// next add timer
		ret.push(...this.getTimerChoices())

		return ret
	}

	/**
	 * Returns array with some layer choices
	 * @param param if it is a number that number of layer choices are returned, if it is a string the layers of the screen are returned
	 * @param bkg wether to include only live layers (false) or also background and eventually foreground layer (true or omitted) 
	 */
	public getLayersAsArray(param: string | number, bkg?: boolean, top?: boolean): Choicemeta[] {
		const ret: Choicemeta[] = []
		if (typeof param === 'number') {
			if (bkg === undefined || bkg === true) ret.push({ id: 'NATIVE', label: 'Background', longname: 'BKG' })
			for (let i = 1; i <= param; i += 1) {
				ret.push({ id: `${i}`, label: `Layer ${i}`, longname:`L${i}` })
			}
			if (top !== false && (bkg === undefined || (bkg === true && top === undefined))) ret.push({ id: 'TOP', label: 'Foreground', longname: 'TOP' })
			return ret
		} else if (typeof param === 'string') {
			if (param.startsWith('A')) {
				ret.push({ id: 'BKG', label: 'Background Layer', longname: 'BKG' })
			}
			if (param.startsWith('S')) {
				const layercount = this.state.getUnmapped(`DEVICE/device/preconfig/status/stateList/items/CURRENT/screenList/items/${param.replace(/\D/g, '')}/pp/layerCount`) ?? 1
				if (bkg === undefined || bkg === true) ret.push({ id: 'NATIVE', label: 'Background Layer', longname: 'BKG' })
				for (let i = 1; i <= layercount; i += 1) {
					ret.push({ id: `${i}`, label: `Layer ${i}`, longname:`L${i}` })
				}
				if (bkg === undefined || bkg === true) ret.push({ id: 'TOP', label: 'Foreground Layer', longname: 'TOP' })
				}
		}
		return ret
	}

	/**
	 * getAudioOutputsArray
	 * @param state the state object holding the data
	 * @param device optional number of device to return outputs for
	 * @returns array of output describing objects
	 */
	public getAudioOutputsArray(_device?: number): Choicemeta[] {
		const ret: Choicemeta[] = []
		
		const outputs = this.state.get('DEVICE/device/audio/outputList/itemKeys') ?? []
		for (const out of outputs) {
			if (this.state.get('DEVICE/device/audio/outputList/items/' + out + '/status/pp/isAvailable')){
				ret.push({
					id: out,
					label: ''
				})
			}
		}
	
		return ret
	}

	public getAudioOutputChoices(): Dropdown<string>[] {
		const ret: Dropdown<string>[] = []
		for (const out of this.getAudioOutputsArray()) {
			const outarr = /\d*$/.exec(out.id)
			let outnum = '0'
			if (outarr !== null) outnum = outarr[0]
			for (let channel = 1; channel <= 8; channel += 1) {
				let label = '',
					outputLabel = ''
				if (out.id.startsWith('VIDEO_OUT')) {
					outputLabel = this.state.get('DEVICE/device/outputList/items/' + outnum + '/control/pp/label')
					label = `Video Output ${outnum} Channel ${channel}${outputLabel === '' ? '' : ' - ' + outputLabel}`
				} else if (out.id.startsWith('DANTE_CH')) {
					outputLabel = this.state.get(
						'DEVICE/device/audio/dante/channelList/items/' + (parseInt(outnum) - 8 + channel) + '/transmitter/status/pp/label'
					)
					label = `Dante Channel ${parseInt(outnum) - 8 + channel}${
						outputLabel === '' ? '' : ' - ' + outputLabel
					}`
				} else if (out.id.startsWith('ANALOG')) {
					label = `Analog Audio Output ${outnum} Channel ${channel}`
				} else if (out.id.startsWith('VIDEO_MULTIVIEWER')) {
					label = `Multiviewer Output Channel ${channel}`
				} else if (out.id.startsWith('VIDEO_MONITORING')) {
					label = `Monitoring Output Channel ${channel}`
				}

				ret.push({
					id: out.id + ':' + channel,
					label,
				})
			}
		}
		return ret
	}

	public getAudioCustomBlockChoices(): Dropdown<string>[] {
		const ret: Dropdown<string>[] = []
		for (let block = 1; block <= 10; block += 1) {
			for (let channel = 1; channel <= 8; channel += 1) {
				ret.push({
					id: 'CUSTOM_' + block.toString() + ':' + channel.toString(),
					label: 'Custom ' +  block.toString() + ' Channel ' + channel.toString(),
				})
			}
		}
		return ret
	}

	public getAudioInputChoices(): Dropdown<string>[] {
		const ret = [{ id: 'NONE', label: 'No Source' }]
		for (const input of this.state.getUnmapped('DEVICE/device/audio/inputList/itemKeys') ?? []) {
			let inputtype = '', inputnum = '', inputplug = '', channelstart = 0
			const inputlabel = ''
			if (input.match(/^IN\d+_ACTIVE_PLUG_EMBEDDED$/)) {
				inputtype = 'Input '
				inputnum = input.replace(/\D/g, '')
				inputplug = ''
			} else if (input.match(/^IN\d+_\w+_EMBEDDED$/)) {
				const res = input.match(/^IN(\d+)_(\w+)_EMBEDDED$/)
				inputtype = 'Input '
				inputnum = res[1]
				inputplug = res[2]
			} else if (input.match(/^IN_DANTE_CH/)) {
				inputtype = 'Dante'
				channelstart = parseInt(input.replace(/^\D+/, '')) - 1
			} else if (input.match(/^IN_ANALOG/)) {
				inputtype = 'Line Input '
				inputnum = input.replace(/[^0-9]/g, '')
			} else if (input.match(/^IN_MEDIA_PLAYER/)) {
				inputtype = 'Media Player'
			}
			if (this.state.getUnmapped('DEVICE/device/audio/inputList/items/' + input + '/status/pp/isAvailable')){
				for (const channel of this.state.getUnmapped('DEVICE/device/audio/inputList/items/' + input + '/channelList/itemKeys')) {
					if (this.state.getUnmapped('DEVICE/device/audio/inputList/items/' + input + '/channelList/items/' + channel + '/status/pp/isAvailable')) {
						if (inputtype === 'Dante') {
							ret.push({
							id: `IN_DANTE_CH${channelstart + parseInt(channel)}`,
							label: `Dante Channel ${channelstart + parseInt(channel)} (${channelstart+1}-${channelstart+8} / ${channel})`,
						})
						} else
						ret.push({
							id: input + '_CH' + channel,
							label: `${inputtype}${inputnum}${inputplug === '' ? '' : ' ' + inputplug} Channel ${channelstart + parseInt(channel)}${inputlabel === '' ? '' : ' - ' + inputlabel}`,
						})
					}
				}
			}
		}
		return ret
	}

	/**
	 * Returns the actual preset (UP or DOWN) representing program or preview of the given input or of the selection
	 * @param screen S1-S... or A1-A...
	 * @param preset can be UP or DOWN or PGM or PVW or 'sel', UP and DOWN are returned unchanged
	 * @returns UP or DOWN, whichever is the actual preset for program or preview, during fades the preset is changed only at the end of the fade
	 */
	public getPreset(screen: string, preset: string): string {
		if (screen.match(/^S|A\d+$/) === null) return ''
		if (preset.match(/^UP|DOWN|PGM|PVW|SEL$/i) === null) return ''
		if (preset.toLowerCase() === 'sel') {
			preset = this.getPresetSelection()
		}
		let ret: string
		if (preset.match(/^UP|DOWN$/i)) {
			ret = preset.toUpperCase()
		} else {
			ret = this.state.get(`LOCAL/screens/${screen}/${preset.toLowerCase()}/preset`)
		}
		return ret
	}

	/**
	 * Returns the program or preview representing the given preset UP or DOWN of the screen
	 * @param screen S1-S... or A1-A...
	 * @param preset can be UP or DOWN
	 * @param fullName if true returnes PROGRAM/PREVIEW else pgm/pvw
	 * @returns program or preview, during fades the preset is changed only at the end of the fade
	 */
	public getPresetRev(screen: string, preset: string, fullName = false): string | null {
		if (screen.match(/^S|A\d+$/) === null) return null
		if (preset.match(/^up|down$/i) === null) return null
		let ret: string
		if (this.state.getUnmapped(`LOCAL/screens/${screen}/pgm/preset`) === preset.toUpperCase()) {
			ret = fullName ? 'PROGRAM' : 'pgm'
		} else {
			ret = fullName ? 'PREVIEW' : 'pvw'
		}
		return ret
	}

	/**
	 * returns the path from preset to layer  
	 * depending on platform this will be layerList/items/layer or liveLayerlist/items/layer, background, top
	 * @param layerId can be a layer number, optionally with a prefix, or bkg/background/native/top
	 * @returns 
	 */
	getLayerPath(layerId: string | number): string[] {
		let layer: string
		if (typeof layerId === 'string') layer = layerId
		else layer = layerId.toString()

		if (layer.match(/top/i)) {
			return ['top']
		}
		else if (layer.match(/bkg|background|native/i)) {
			return ['background']
		}
		else {
			return ['liveLayerList', 'items', layer.replace(/\D/g, '')]
		}
	}

}
