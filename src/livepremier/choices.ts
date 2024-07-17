import { AWJinstance } from '..'
import Choices from '../awjdevice/choices.js'

type Dropdown<t> = {id: t, label: string}

export type Choicemeta = { id: string, label: string, index?: string, longname?: string, device?: number }

/**
 * Methods for retrieving device dependent data like properties, lists, choices out of the state or generating it
 */
export default class ChoicesLivepremier extends Choices {

	constructor(instance: AWJinstance) {
		super(instance)
		this.instance = instance
		this.state = this.instance.state
		this.constants = instance.constants
	}

	/** returns array of the currently available and active screens only (no auxes)*/
	public getScreensArray(getAlsoDisabled = false): Choicemeta[] {
		const ret: Choicemeta[] = []

		const screens = this.state.get('DEVICE/device/screenList/items')
		if (screens) {
			Object.keys(screens).forEach((key) => {
				if (key.startsWith('S') && (getAlsoDisabled || screens[key].status.pp.mode != 'DISABLED')) {
					ret.push({
						id: key,
						label: screens[key].control.pp.label,
						index: key.slice(1)
					})
				}
			})
		} else {
			ret.push({ id: 'S1', label: '(emulated)', index: '1' })
			ret.push({ id: 'S2', label: '(emulated)', index: '2' })
		}

		return ret
	}

	/** returns array of the currently available and active auxscreens only (no regular screens)*/
	public getAuxArray(getAlsoDisabled = false ): Choicemeta[] {
		const ret: Choicemeta[] = []
			const screens = this.state.get('DEVICE/device/screenList/itemKeys').filter((key: string) => key.charAt(0)==='A')
			if (screens) {
				screens.forEach((screen: string) => {
					if (getAlsoDisabled || this.state.get('DEVICE/device/screenList/items/' + screen + '/status/pp/mode') != 'DISABLED') {
						ret.push({
							id: screen,
							label: this.state.get('DEVICE/device/screenList/items/' + screen + '/control/pp/label'),
							index: screen.slice(1)
						})
					}
				})
			} else {
				ret.push({ id: 'A1', label: '(emulated)', index: '1' },{ id: 'A2', label: '(emulated)', index: '2' })
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
			}),
			...this.getAuxArray().map((scr: Choicemeta) => {
			return {
				id: scr.id,
				label: `A${scr.index}${scr.label === '' ? '' : ' - ' + scr.label}`
			}
			})
		]
	}

	public getLiveInputArray(prefix?: string): Choicemeta[] {
		const ret: Choicemeta[] = []
		if(prefix == undefined) prefix = 'IN'
		const items = this.state.get('DEVICE/device/inputList/itemKeys')
		if (items) {
			items.forEach((key: string) => {
				if (this.state.get('DEVICE/device/inputList/items/' + key + '/status/pp/isAvailable')
					&& (this.state.get('LOCAL/config/showDisabled') || this.state.get('DEVICE/device/inputList/items/' + key + '/status/pp/isEnabled'))
				) {
					ret.push({
						id: key.replace(/^\w+_/, prefix + '_'),
						label: this.state.get('DEVICE/device/inputList/items/' + key + '/control/pp/label'),
						index: key.replace(/^\w+_/, '')
					})
				}
			})
		}
		return ret
	}

	public getAuxBackgroundChoices(): Dropdown<string>[] {
		return []
	}

	public getSourceChoices(): Dropdown<string>[] {
		// first add None and Color which are always available
		const ret:Dropdown<string>[] = [
			{ id: 'NONE', label: 'None' },
			{ id: 'COLOR', label: 'Color' },
		]

		// next add live inputs
		ret.push( ...this.getLiveInputChoices('LIVE') )

		// next add still images
		ret.push(...this.getStillsArray().map((itm: Choicemeta) => {
			return {
				id: `STILL_${itm.id}`,
				label: `Image ${itm.id}${itm.label === '' ? '' : ' - ' + itm.label}`,
			}
		}))

		return ret
	}

	public getAuxSourceChoices(): Dropdown<string>[] {
		// first add None and Color which are always available
		const ret: Dropdown<string>[] = [
			{ id: 'NONE', label: 'None' },
		]

		// next add live inputs
		ret.push( ...this.getLiveInputChoices('LIVE') )

		// next add still images
		ret.push(...this.getStillsArray().map((itm: Choicemeta) => {
			return {
				id: `STILL_${itm.id}`,
				label: `Image ${itm.id}${itm.label === '' ? '' : ' - ' + itm.label}`,
			}
		}))
		// last add split-layer screen pgms for reinsertion
		ret.push(...this.getScreensArray().filter((itm: Choicemeta) => {
			return this.state.get('DEVICE/device/screenList/items/'+itm.id+'/status/pp/mixingMode') === 'SPLIT'
		}).map((itm: Choicemeta) => {
			return {
				id: `SCREEN_${itm.index}`,
				label: `Screen ${itm.index} PGM${itm.label === '' ? '' : ' - ' + itm.label}`
			}
		}) )

		return ret
	}

	public getWidgetSourceChoices(): Dropdown<string>[] {
		// first add None which is always available
		const ret: Dropdown<string>[] = [{ id: 'NONE', label: 'None' }]

		// next add Screens
		for (const screen of this.getScreensArray()) {
			ret.push({
				id: 'PROGRAM_S' + screen.index,
				label: `Screen ${screen.index} PGM${screen.label === '' ? '' : ' - ' + screen.label}`,
			})
			ret.push({
				id: 'PREVIEW_S' + screen.index,
				label: `Screen ${screen.index} PVW${screen.label === '' ? '' : ' - ' + screen.label}`,
			})
		}

		// next add Auxscreens
		for (const screen of this.getAuxArray()) {
			ret.push({
				id: screen.id,
				label: `Aux ${screen.index} PGM${screen.label === '' ? '' : ' - ' + screen.label}`,
			})
		}

		// next add live inputs
		ret.push(...this.getLiveInputChoices())

		// next add timer
		ret.push(...this.getTimerChoices())

		// next add still images
		ret.push(...this.getStillsArray().map((itm: Choicemeta) => {
			return {
				id: `STILL_${itm.id}`,
				label: `Image ${itm.id}${itm.label === '' ? '' : ' - ' + itm.label}`,
			}
		}))

		return ret
	}

	/**
	 * Returns array with some layer choices
	 * @param param if it is a number that number of layer choices are returned, if it is a string the layers of the screen are returned
	 * @param bkg wether to include only live layers (false) or also background and eventually foreground layer (true or omitted) 
	 */
	public getLayersAsArray(param: string | number, bkg?: boolean): Choicemeta[] {
		const ret: Choicemeta[] = []
		if (typeof param === 'number') {
			if (bkg === undefined || bkg === true) ret.push({ id: 'NATIVE', label: 'Background', longname: 'BKG' })
			for (let i = 1; i <= param; i += 1) {
				ret.push({ id: `${i}`, label: `Layer ${i}`, longname:`L${i}` })
			}
			return ret
		} else if (typeof param === 'string') {
			if (bkg === undefined || bkg === true) ret.push({ id: 'NATIVE', label: 'Background', longname: 'BKG' })
			let layercount = this.state.get(`DEVICE/device/screenList/items/${param}/status/pp/layerCount`) ?? 1
			for (let i = 1; i <= layercount; i += 1) {
				ret.push({ id: `${i}`, label: `Layer ${i}`, longname:`L${i}` })
			}
			return ret
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
		const outputs = this.state.get('DEVICE/device/audio/control/txList/itemKeys') ?? []
		for (const out of outputs) {
			const outputnum = out.split('_')[1]
			if (out.startsWith('OUTPUT') && this.state.get('DEVICE/device/outputList/items/' + outputnum + '/status/pp/isAvailable')) {
				ret.push({
					id: out,
					label: this.state.get('DEVICE/device/outputList/items/' + outputnum + '/control/pp/label'),
					index: outputnum,
					longname: 'Output'
				})
			}
			if (out.startsWith('DANTE') && this.state.get('DEVICE/device/system/dante/channelList/items/' + out + '_CHANNEL_8/status/pp/isAvailable')) {
				ret.push({
					id: out,
					label: '',
					index: outputnum,
					longname: 'Dante'
				})
			}
			if (out.startsWith('MVW') && this.state.get('DEVICE/device/monitoringList/items/' + outputnum + '/status/pp/isAvailable')) {
				ret.push({
					id: out,
					label: this.state.get('DEVICE/device/monitoringList/items/' + outputnum + '/control/pp/label'),
					index: outputnum,
					longname: 'Multiviewer'
				})
			}
		}
		return ret
	}

	public getAudioOutputChoices(): Dropdown<string>[] {
		const ret: Dropdown<string>[] = []
		for (const out of this.getAudioOutputsArray()) {
			const channels = this.state.get(`DEVICE/device/audio/control/txList/items/${out.id}/channelList/itemKeys`) ?? []
			const [outputtype, outnum] = out.id.split('_')
			for (const channel of channels) {
				let label = '',
					outputLabel = ''
				if (outputtype === 'OUTPUT') {
					outputLabel = this.state.get('DEVICE/device/outputList/items/' + outnum + '/control/pp/label')
					label = `Output ${outnum} Channel ${channel}${outputLabel === '' ? '' : ' - ' + outputLabel}`
				} else if (outputtype === 'DANTE') {
					outputLabel = this.state.get(
						'DEVICE/device/system/dante/channelList/items/' + out + '_CHANNEL_' + channel + '/transmitter/status/pp/label'
					)
					label = `Dante Channel ${(parseInt(outnum) - 1) * 8 + parseInt(channel)}${
						outputLabel === '' ? '' : ' - ' + outputLabel
					}`
				} else if (outputtype === 'MVW') {
					outputLabel = this.state.get('DEVICE/device/monitoringList/items/' + outnum + '/control/pp/label')
					label = `Multiviewer ${outnum} Channel ${channel}${outputLabel === '' ? '' : ' - ' + outputLabel}`
				}

				ret.push({
					id: out.id + ':' + channel,
					label,
				})
			}
		}
		return ret
	}

	public getAudioInputChoices(): Dropdown<string>[] {
		const ret = [{ id: 'NONE', label: 'No Source' }]
		const inputs = this.state.get('DEVICE/device/audio/control/rxList/itemKeys') ?? []
		for (const input of inputs) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const [inputtype, inputnum, _channel, channelnum] = input.split('_')
			if (inputtype === 'INPUT' && this.state.get('DEVICE/device/inputList/items/IN_' + inputnum + '/status/pp/isAvailable')) {
				const inputLabel = this.state.get('DEVICE/device/inputList/items/IN_' + inputnum + '/control/pp/label')
				ret.push({
					id: input,
					label: `Input ${inputnum} Channel ${channelnum}${inputLabel === '' ? '' : ' - ' + inputLabel}`,
				})
			} else if (
				inputtype === 'DANTE' &&
				this.state.get('DEVICE/device/system/dante/channelList/items/' + input + '/status/pp/isAvailable')
			) {
				const inputLabel = this.state.get('DEVICE/device/system/dante/channelList/items/' + input + '/source/status/pp/label')
				ret.push({
					id: input,
					label: `Dante Channel ${(parseInt(inputnum) - 1) * 8 + parseInt(channelnum)}${
						inputLabel === '' ? '' : ' - ' + inputLabel
					}`,
				})
			}
		}
		return ret
	}

}
