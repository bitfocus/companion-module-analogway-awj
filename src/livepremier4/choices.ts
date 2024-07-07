import { AWJinstance } from '..'
import { State } from '../../types/State'
import Choices from '../awjdevice/choices.js'
import Constants from './constants.js'

type Dropdown<t> = {id: t, label: string}

export type Choicemeta = { id: string, label: string, index?: string, longname?: string, device?: number }

/**
 * Methods for retrieving device dependent data like properties, lists, choices out of the state or generating it
 */
export default class ChoicesLivepremier4 extends Choices {

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
				if (getAlsoDisabled || screens[key].status.pp.mode != 'DISABLED') {
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
			const screens = this.state.getUnmapped('DEVICE/device/auxiliaryList/itemKeys')
			if (screens) {
				screens.forEach((screen: string) => {
					if (getAlsoDisabled || this.state.getUnmapped('DEVICE/device/auxiliaryList/items/' + screen + '/status/pp/mode') != 'DISABLED') {
						ret.push({
							id: screen,
							label: this.state.getUnmapped('DEVICE/device/auxiliaryList/items/' + screen + '/control/pp/label'),
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
		const items = this.state.getUnmapped('DEVICE/device/inputList/itemKeys')
		if (items) {
			items.forEach((key: string) => {
				if (this.state.getUnmapped('DEVICE/device/inputList/items/' + key + '/status/pp/isAvailable')
					&& (this.state.getUnmapped('LOCAL/config/showDisabled') || this.state.getUnmapped('DEVICE/device/inputList/items/' + key + '/status/pp/isEnabled'))
				) {
					ret.push({
						id: key.replace(/^\w+_/, prefix + '_'),
						label: this.state.getUnmapped('DEVICE/device/inputList/items/' + key + '/control/pp/label'),
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
			const screeninfo = this.getScreenInfo(param)
			const screenlist = screeninfo.isAux ? 'auxiliaryList' : 'screenList'
			let layercount = this.state.get(`DEVICE/device/${screenlist}/items/${screeninfo.id}/status/pp/layerCount`) ?? 1
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
	public getAudioOutputsArray(device?: number): Choicemeta[] {
		if (typeof device !== 'number') device = 1
		const ret: Choicemeta[] = []
		const outputs = this.state.getUnmapped(`DEVICE/device/audio/control/deviceList/items/${device}/txList/itemKeys`) ?? []
		for (const out of outputs) {
			const outputnum = out.split('_')[1]
			if (out.startsWith('OUTPUT') && this.state.getUnmapped(`DEVICE/device/outputList/items/${ (device-1) * 24 + Number(outputnum) }/status/pp/isAvailable`)) {
				ret.push({
					id: out,
					label: this.state.getUnmapped(`DEVICE/device/outputList/items/${ (device-1) * 24 + Number(outputnum) }/control/pp/label`),
					index: outputnum,
					longname: 'Output'
				})
			}
			if (out.startsWith('DANTE') && this.state.getUnmapped(`DEVICE/device/system/deviceList/items/${device}/dante/channelList/items/${out}_CHANNEL_8/status/pp/isAvailable`)) {
				ret.push({
					id: out,
					label: this.state.getUnmapped(
						`DEVICE/device/system/deviceList/items/${device}/dante/channelList/items/${out}_CHANNEL_1/transmitter/status/pp/label`
					),
					index: outputnum,
					longname: 'Dante'
				})
			}
			if (out.startsWith('MVW') && this.state.getUnmapped(`DEVICE/device/monitoringList/items/${ (device-1) * 2 + Number(outputnum) }/status/pp/isAvailable`)) {
				ret.push({
					id: out,
					label: this.state.get(`DEVICE/device/monitoringList/items/${ (device-1) * 2 + Number(outputnum) }/control/pp/label`),
					index: outputnum,
					longname: 'Multiviewer'
				})
			}
		}
		return ret
	}

	public getAudioOutputChoices(device?: number): Dropdown<string>[] {
		if (typeof device !== 'number') device = 1
		const ret: Dropdown<string>[] = []
		for (const out of this.getAudioOutputsArray()) {
			const channels = this.state.getUnmapped(`DEVICE/device/audio/control/deviceList/items/${device}/txList/items/${out.id}/channelList/itemKeys`) ?? []
			const [outputtype, outnum] = out.id.split('_')
			for (const channel of channels) {
				let label = ''
				if (outputtype === 'OUTPUT') {
					label = `Output ${outnum} Channel ${channel}${out.label === '' ? '' : ' - ' + out.label}`
				} else if (outputtype === 'DANTE') {
					const channelLabel = this.state.getUnmapped(
						`DEVICE/device/system/deviceList/items/${device}/dante/channelList/items/${out.id}_CHANNEL_${channel}/transmitter/status/pp/label`
					)
					label = `Dante Channel ${(parseInt(outnum) - 1) * 8 + parseInt(channel)}${
						channelLabel === '' ? '' : ' - ' + channelLabel
					}`
				} else if (outputtype === 'MVW') {
					label = `Multiviewer ${outnum} Channel ${channel}${out.label === '' ? '' : ' - ' + out.label}`
				}

				ret.push({
					id: out.id + ':' + channel,
					label,
				})
			}
		}
		return ret
	}

	public getAudioInputChoices(device?: number): Dropdown<string>[] {
		if (typeof device !== 'number') device = 1
		const ret = [{ id: 'NONE', label: 'No Source' }]
		const inputs = this.state.getUnmapped(`DEVICE/device/audio/control/deviceList/items/${device}/rxList/itemKeys`) ?? []
		for (const input of inputs) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const [inputtype, inputnum, _channel, channelnum] = input.split('_')
			if (inputtype === 'INPUT' && this.state.getUnmapped('DEVICE/device/inputList/items/IN_' + inputnum + '/status/pp/isAvailable')) {
				const inputLabel = this.state.getUnmapped(`DEVICE/device/inputList/items/IN_${ (device-1) * 64 + Number(inputnum)}/control/pp/label`)
				ret.push({
					id: input,
					label: `Input ${inputnum} Channel ${channelnum}${inputLabel === '' ? '' : ' - ' + inputLabel}`,
				})
			} else if (
				inputtype === 'DANTE' &&
				this.state.getUnmapped(`DEVICE/device/system/deviceList/items/${device}/dante/channelList/items/${input}/status/pp/isAvailable`)
			) {
				const inputLabel = this.state.get(`DEVICE/device/system/deviceList/items/${device}/dante/channelList/items/${input}/source/status/pp/label`)
				ret.push({
					id: input,
					label: `Dante Channel ${(Number(inputnum) - 1) * 8 + Number(channelnum)}${
						inputLabel === '' ? '' : ' - ' + inputLabel
					}`,
				})
			}
		}
		return ret
	}

	public getSelectedLayers(): { screenAuxKey: string; layerKey: string} [] {
		let ret: { screenAuxKey: string; layerKey: string}[] = [] 

		if (this.instance.state.syncSelection) {
			ret = this.state.getUnmapped('REMOTE/live/screens/layerSelection/layerIds')
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
			ret = this.state.getUnmapped('LOCAL/layerIds')
		}
		return ret
	}

	/**
	 * get choices of linked devices
	 */
	getLinkedDevicesChoices(): Dropdown<number>[] {
		const ret = [{id: 1, label: '1 (Leader 👑)'}]
		ret.push(
			...this.instance.state.getUnmapped('LINK/followers') ?? []
			.map((_follower, i) => [{id: (i + 2),  label: (i + 2).toString()}])
		)
		return ret
	}

}
