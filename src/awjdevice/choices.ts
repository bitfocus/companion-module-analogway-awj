import { State } from '../../types/State'
import { AWJdevice } from './awjdevice'

type Dropdown<t> = {id: t, label: string}

export type Choicemeta = { id: string, label: string, index?: string, longname?: string, device?: number }

/**
 * Methods for generating lists (eventually formated as choices) out of the state data
 */
class Choices {
	/** The state object to take the data from */
	state: State
	/** reference to the constants of the device */
	constants: Constants

	constructor(device: AWJdevice) {
		this.state = device.state
		this.constants = device.constants
	}


	choicesPreset: Dropdown<string>[] = [
		{ id: 'pgm', label: 'Program' },
		{ id: 'pvw', label: 'Preview' },
	]

	choicesPresetLong: Dropdown<string>[] = [
		{ id: 'PROGRAM', label: 'Program' },
		{ id: 'PREVIEW', label: 'Preview' },
	]

	choicesBackgroundSources: Dropdown<string>[] = [
		{ id: 'NATIVE_1', label: 'Background Set 1' },
		{ id: 'NATIVE_2', label: 'Background Set 2' },
		{ id: 'NATIVE_3', label: 'Background Set 3' },
		{ id: 'NATIVE_4', label: 'Background Set 4' },
		{ id: 'NATIVE_5', label: 'Background Set 5' },
		{ id: 'NATIVE_6', label: 'Background Set 6' },
		{ id: 'NATIVE_7', label: 'Background Set 7' },
		{ id: 'NATIVE_8', label: 'Background Set 8' },
	]

	choicesBackgroundSourcesPlusNone: Dropdown<string>[] = [
		{ id: 'NONE', label: 'None / Color' },
		...this.choicesBackgroundSources,
	]

	public getScreensAuxArray(getAlsoDisabled = false): Choicemeta[] {
		return [...this.getScreensArray(getAlsoDisabled), ...this.getAuxArray(getAlsoDisabled)]
	}

	public getScreensArray(getAlsoDisabled = false): Choicemeta[] {
		const ret: Choicemeta[] = []
		if (this.state.platform.startsWith('livepremier')) {
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
		} else if (this.state.platform === 'midra') {
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
		}
		return ret
	}

	public getScreenChoices(): Dropdown<string>[] {

		return this.getScreensArray().map((scr: Choicemeta) => {
			return {
				id: scr.id,
				label: `S${scr.index}${scr.label === '' ? '' : ' - ' + scr.label}`
			}
		})
	}

	public getAuxArray(getAlsoDisabled = false ): Choicemeta[] {
		const ret: Choicemeta[] = []
		if (this.state.platform.startsWith('livepremier')) {
			const screens = (this.state.platform === 'livepremier4')
				? this.state.getUnmapped('DEVICE/device/auxiliaryList/itemKeys')
				: this.state.getUnmapped('DEVICE/device/screenList/itemKeys').filter((key: string) => key.startsWith('A'))
			if (screens) {
				screens.forEach((screen: string) => {
					if (getAlsoDisabled || this.state.get('DEVICE/device/screenList/items/' + screen + '/status/pp/mode') != 'DISABLED') {
						ret.push({
							id: screen,
							label: this.state.get('DEVICE/device/screenList/items/' + screen + '/control/pp/label'),
							index: screen.replace(/\D/g, '')
						})
					}
				})
			} else {
				ret.push({ id: 'A1', label: '(emulated)', index: '1' })
				ret.push({ id: 'A2', label: '(emulated)', index: '2' })
			}
		} else if (this.state.platform === 'midra') {
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
		}
		return ret
	}

	public getAuxChoices(): Dropdown<string>[] {

		return this.getAuxArray().map((scr: Choicemeta) => {
			return {
				id: scr.id,
				label: `A${scr.index}${scr.label === '' ? '' : ' - ' + scr.label}`
			}
		})
	}

	public getScreenAuxChoices(): Dropdown<string>[] {
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

	public getPlatformScreenChoices(): Dropdown<string>[] {
		if (this.state.platform.startsWith('livepremier'))
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
		else if (this.state.platform === 'midra')
			return [
				...this.getScreensArray().map((scr: Choicemeta) => {
				return {
					id: scr.id,
					label: `S${scr.index}${scr.label === '' ? '' : ' - ' + scr.label}`
				}
				})
			]
		else return []
	}

	public getLiveInputArray(prefix?: string): Choicemeta[] {
		const ret: Choicemeta[] = []
		if (this.state.platform.startsWith('livepremier')) {
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
		} else if (this.state.platform === 'midra') {
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
			if (prefix == undefined && this.state.platform == 'livepremier') prefix = 'IN'
			if (prefix == undefined && this.state.platform == 'midra') prefix = 'INPUT'
			for (let i = 1; i <= 8; i += 1) {
				ret.push({ id: `${prefix}_${i.toString()}`, label: `Input ${i.toString()} (emulated)` })
			}
		}
		return ret
	}

	public getAuxBackgroundChoices(): Dropdown<string>[] {
		if (this.state.platform.startsWith('livepremier')) return []
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

	public getStillsArray(): Choicemeta[] {
		const bankpath = 'DEVICE/device/stillList/'
		return (
			this.state.get(this.state.concat(bankpath, 'itemKeys'))?.filter((itm: string) => {
				return this.state.get(this.state.concat(bankpath, ['items', itm, 'status', 'pp', 'isAvailable'])) && this.state.get(this.state.concat(bankpath, ['items', itm, 'status', 'pp', 'isValid']))
			}).map((itm: string) => {
				return {
					id: itm,
					label: this.state.get(this.state.concat(bankpath, ['items',itm,'control','pp','label',]))
				}
			}) ?? []
		)
	}

	public getSourceChoices(): Dropdown<string>[] {
		// first add None and Color which are always available
		const ret:Dropdown<string>[] = [
			{ id: 'NONE', label: 'None' },
			{ id: 'COLOR', label: 'Color' },
		]

		// next add live inputs
		const prefix = this.state.platform === 'midra' ? 'INPUT' : 'LIVE'
		ret.push( ...this.getLiveInputChoices(prefix) )

		if (this.state.platform.startsWith('livepremier')) {
			// next add still images
			ret.push(...this.getStillsArray().map((itm: Choicemeta) => {
				return {
					id: `STILL_${itm.id}`,
					label: `Image ${itm.id}${itm.label === '' ? '' : ' - ' + itm.label}`,
				}
			}))

		}
		return ret
	}

	public getAuxSourceChoices(): Dropdown<string>[] {
		// first add None and Color which are always available
		const ret: Dropdown<string>[] = [
			{ id: 'NONE', label: 'None' },
		]

		// next add live inputs
		const prefix = this.state.platform === 'midra' ? 'INPUT' : 'LIVE'
		ret.push( ...this.getLiveInputChoices(prefix) )

		if (this.state.platform.startsWith('livepremier')) {
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

		}
		return ret
	}

	public getPlugChoices(input: string): Dropdown<string>[] {
		const plugtype = {
			HDMI: 'HDMI',
			SDI: 'SDI',
			DISPLAY_PORT: 'DisplayPort',
			ANALOG_HD15: 'Analog HD15',
			OPTICAL_SFP: 'Optical',
			DVI_D: 'DVI-D',
			HDBASET: 'HDbaseT',
			QUAD_SDI: 'Quad SDI',
		}
		return this.state.get(['DEVICE', 'device', 'inputList', 'items', input, 'plugList', 'itemKeys'])?.filter(
			(plug: string) => {
				return this.state.get(['DEVICE', 'device', 'inputList', 'items', input, 'plugList', 'items', plug, 'status', 'pp', 'isAvailable'])
			}
		).map(
			(plug: string) => {
				const type: keyof typeof plugtype = this.state.get(['DEVICE', 'device', 'inputList', 'items', input, 'plugList', 'items', plug, 'status', 'pp', 'type'])
				return {
					id: plug,
					label: 'Plug ' + plug + ' - ' + plugtype[type]
				}
			}
		) ?? []
	}

	public getMasterMemoryArray(): Choicemeta[] {
		let bankpath = 'DEVICE/device/masterPresetBank/bankList'
		if (this.state.platform === 'midra') {
			bankpath = 'DEVICE/device/preset/masterBank/slotList'
		}
		return (
			this.state.get(this.state.concat(bankpath, 'itemKeys'))?.filter((mem: string) => {
				return this.state.get(this.state.concat(bankpath, ['items', mem, 'status', 'pp', 'isValid']))
			}).map((mem: string) => {
				return {
					id: mem,
					label: this.state.get(this.state.concat(bankpath, ['items',mem,'control','pp','label',]))
				}
			}) ?? []
		)
	}

	public getMasterMemoryChoices(): Dropdown<string>[] {

		return this.getMasterMemoryArray().map((mem: Choicemeta) => {
			return {
				id: mem.id,
				label: `MM${mem.id}${mem.label === '' ? '' : ' - ' + mem.label}`
			}
		})
	}

	public getScreenMemoryArray(): Choicemeta[] {
		let bankpath = 'DEVICE/device/presetBank/bankList'
		if (this.state.platform === 'midra') {
			bankpath = 'DEVICE/device/preset/bank/slotList'
		}

		return (
			this.state.get(this.state.concat(bankpath, 'itemKeys'))?.filter((mem: string) => {
				return this.state.get(this.state.concat(bankpath, ['items', mem, 'status', 'pp', 'isValid']))
			}).map((mem: string) => {
				return {
					id: mem,
					label: this.state.get(this.state.concat(bankpath, ['items',mem,'control','pp','label',]))
				}
			}) ?? []
		)
	}

	public getScreenMemoryChoices(): Dropdown<string>[] {

		return this.getScreenMemoryArray().map((mem: Choicemeta) => {
			return {
				id: mem.id,
				label: `SM${mem.id}${mem.label === '' ? '' : ' - ' + mem.label}`
			}
		})
	}

	public getAuxMemoryArray(): Choicemeta[] {
		const bankpath = 'DEVICE/device/preset/auxBank/slotList'
		return (
			this.state.get(this.state.concat(bankpath, 'itemKeys'))?.filter((mem: string) => {
				return this.state.get(this.state.concat(bankpath, ['items', mem, 'status', 'pp', 'isValid']))
			}).map((mem: string) => {
				return {
					id: mem,
					label: this.state.get(this.state.concat(bankpath, ['items',mem,'control','pp','label',]))
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

	public getLayerMemoryArray(): string[] {
		return (
			this.state.get('DEVICE/device/layerBank/bankList/itemKeys')?.filter((mem: string) => {
				return this.state.get(['DEVICE', 'device', 'layerBank', 'bankList', 'items', mem, 'status', 'pp', 'isValid'])
			}) ?? []
		)
	}

	public getLayerMemoryChoices(): Dropdown<string>[] {
		const ret: Dropdown<string>[] = []
		for (const memory of this.getLayerMemoryArray()) {
			const label = this.state.get(['DEVICE', 'device', 'layerBank', 'bankList', 'items', memory, 'control', 'pp', 'label'])
			ret.push({
				id: memory,
				label: `M${memory}${label === '' ? '' : ' - ' + label}`,
			})
		}
		return ret
	}

	public getMultiviewerMemoryArray(): Choicemeta[] {
		const bankpath = 'DEVICE/device/monitoringBank/bankList'
		return (
			this.state.get(bankpath + '/itemKeys')?.filter((mem: string) => {
				return this.state.get(this.state.concat(bankpath,['items', mem, 'status', 'pp', 'isValid']))
			}).map((mem: string) => {
				return {
					id: mem,
					label: this.state.get(this.state.concat(bankpath, ['items',mem,'control','pp','label',]))
				}
			}) ?? []
		)
	}

	public getMultiviewerMemoryChoices(): Dropdown<string>[] {

		return this.getMultiviewerMemoryArray().map((mem: Choicemeta) => {
			return {
				id: mem.id,
				label: `VM${mem.id}${mem.label === '' ? '' : ' - ' + mem.label}`
			}
		})
	}

	public getMultiviewerArray(): string[] {
		return (
			this.state.get('DEVICE/device/monitoringList/itemKeys')?.filter((mvKey: string) => {
				return this.state.get(['DEVICE', 'device', 'monitoringList', 'items', mvKey, 'status', 'pp', 'isEnabled'])
			}) ?? ['1']
		)
	}

	public getMultiviewerChoices(): Dropdown<string>[] {
		const ret: Dropdown<string>[] = []
		for (const multiviewer of this.getMultiviewerArray()) {
			const label = this.state.get(['DEVICE', 'device', 'monitoringList', 'items', multiviewer, 'control', 'pp', 'label'])
			ret.push({
				id: multiviewer,
				label: `Multiviewer ${multiviewer}${label === '' ? '' : ' - ' + label}`,
			})
		}
		return ret
	}

	public getWidgetChoices(): Dropdown<string>[] {
		const ret: Dropdown<string>[] = []
		if (this.state.platform.startsWith('livepremier')) {
			for (const multiviewer of this.getMultiviewerArray()) {
				for (const widget of this.state.getUnmapped([
					'DEVICE',
					'device',
					'monitoringList',
					'items',
					multiviewer,
					'layout',
					'widgetList',
					'itemKeys',
				])) {
					ret.push({
						id: `${multiviewer}:${widget}`,
						label: `Multiviewer ${multiviewer} Widget ${parseInt(widget)+1}`,
					})
				}
			}
		} else if (this.state.platform === 'midra') {
			return this.state.getUnmapped('DEVICE/device/multiviewer/status/pp/widgetValidity').map((widget: string) => {
				return {
					id: '1:' + widget,
					label: `Widget ${parseInt(widget)}`,
				}
			})
			
		}
		return ret
	}

	public getWidgetSourceChoices(): Dropdown<string>[] {
		// first add None which is always available
		const ret: Dropdown<string>[] = [{ id: 'NONE', label: 'None' }]

		// next add Screens
		// different nomenclature on livepremier and midra
		let program = 'PROGRAM_S'
		let preview = 'PREVIEW_S'
		if (this.state.platform === 'midra') { 
			program = 'SCREEN_PRGM_'
			preview = 'SCREEN_PRW_'
		}
		for (const screen of this.getScreensArray()) {
			ret.push({
				id: program + screen.index,
				label: `Screen ${screen.index} PGM${screen.label === '' ? '' : ' - ' + screen.label}`,
			})
			ret.push({
				id: preview + screen.index,
				label: `Screen ${screen.index} PVW${screen.label === '' ? '' : ' - ' + screen.label}`,
			})
		}

		// next add Auxscreens
		// not available on midra
		if (this.state.platform.startsWith('livepremier')) {
			for (const screen of this.getAuxArray()) {
				ret.push({
					id: screen.id,
					label: `Aux ${screen.index} PGM${screen.label === '' ? '' : ' - ' + screen.label}`,
				})
			}
		}

		// next add live inputs
		ret.push(...this.getLiveInputChoices())

		// next add timer
		ret.push(...this.getTimerChoices())

		// next add still images
		// not available on midra
		if (this.state.platform.startsWith('livepremier')) {
			ret.push(...this.getStillsArray().map((itm: Choicemeta) => {
				return {
					id: `STILL_${itm.id}`,
					label: `Image ${itm.id}${itm.label === '' ? '' : ' - ' + itm.label}`,
				}
			}))
		}

		return ret
	}

	public getLayersAsArray(param: string | number, bkg?: boolean): string[] {
		const ret: string[] = []
		let layercount = 0
		if (typeof param === 'number') {
			if (bkg === undefined || bkg === true) ret.push('NATIVE')
			for (let i = 1; i <= param; i += 1) {
				ret.push(i.toString())
			}
			if (this.state.platform === 'midra' && (bkg === undefined || bkg === true)) ret.push('TOP')
			return ret
		} else if (typeof param === 'string') {
			if (this.state.platform.startsWith('livepremier')) {
				if (bkg === undefined || bkg === true) ret.push('NATIVE')
				layercount = this.state.get(`DEVICE/device/screenList/items/${param}/status/pp/layerCount`) ?? 1
				for (let i = 1; i <= layercount; i += 1) {
					ret.push(i.toString())
				}
				return ret
			}
			if (this.state.platform === 'midra') {
				if (param.startsWith('A')) {
					ret.push('BKG')
				}
				if (param.startsWith('S')) {
					layercount = this.state.getUnmapped(`DEVICE/device/preconfig/status/stateList/items/CURRENT/screenList/items/${param.replace(/\D/g, '')}/pp/layerCount`) ?? 1
					if (bkg === undefined || bkg === true) ret.push('NATIVE')
					for (let i = 1; i <= layercount; i += 1) {
						ret.push(i.toString())
					}
					if (bkg === undefined || bkg === true) ret.push('TOP')
				}
			}
		}
		return ret
	}

	/**
	 * Returns array with some layer choices
	 * @param param if it is a number that number of layer choices are returned, if it is a string the layers of the screen are returned
	 * @param bkg wether to include only live layers (false) or also background and eventually foreground layer (true or omitted) 
	 */
	public getLayerChoices(param: string | number, bkg?: boolean): Dropdown<string>[] {
		const ret: Dropdown<string>[] = []
		let layercount = 0
		if (typeof param === 'number') {
			if (bkg === undefined || bkg === true) ret.push({ id: 'NATIVE', label: 'Background' })
			for (let i = 1; i <= param; i += 1) {
				ret.push({ id: `${i.toString()}`, label: `Layer ${i.toString()}` })
			}
			if (this.state.platform === 'midra' && (bkg === undefined || bkg === true)) ret.push({ id: 'TOP', label: 'Foreground' })
			return ret
		} else if (typeof param === 'string') {
			if (this.state.platform.startsWith('livepremier')) {
				if (bkg === undefined || bkg === true) ret.push({ id: 'NATIVE', label: 'Background' })
				layercount = this.state.get(`DEVICE/device/screenList/items/${param}/status/pp/layerCount`) ?? 1
				for (let i = 1; i <= layercount; i += 1) {
					ret.push({ id: `${i.toString()}`, label: `Layer ${i.toString()}` })
				}
				return ret
			}
			if (this.state.platform === 'midra') {
				if (param.startsWith('A')) {
					ret.push({ id: 'BKG', label: 'Background Layer' })
				}
				if (param.startsWith('S')) {
					layercount = this.state.getUnmapped(`DEVICE/device/preconfig/status/stateList/items/CURRENT/screenList/items/${param.replace(/\D/g, '')}/pp/layerCount`) ?? 1
					if (bkg === undefined || bkg === true) ret.push({ id: 'NATIVE', label: 'Background Layer' })
					for (let i = 1; i <= layercount; i += 1) {
						ret.push({ id: `${i.toString()}`, label: `Layer ${i.toString()}` })
					}
					if (bkg === undefined || bkg === true) ret.push({ id: 'TOP', label: 'Foreground Layer' })
				}
			}
		}
		return ret
	}

	public getOutputArray(): Choicemeta[] {
		return this.state.get('DEVICE/device/outputList/itemKeys')?.filter((itm: string) => {
			return this.state.get('DEVICE/device/outputList/items/'+itm+'/status/pp/isAvailable') === true
		}).map((itm: string) => {
			return {
				id: itm,
				label: this.state.get('DEVICE/device/outputList/items/'+itm+'/control/pp/label')
			}
		}) ?? []

	}

	public getOutputChoices(): Dropdown<string>[] {
		return this.getOutputArray().map((itm: Choicemeta) => {
			return {
				id: itm.id,
				label: `Output ${itm.id}${itm.label === '' ? '' : ' - ' + itm.label}`
			}
		})
	}

	/**
	 * getAudioOutputsArray
	 * @param state the state object holding the data
	 * @param device optional number of device to return outputs for
	 * @returns array of output describing objects
	 */
	public getAudioOutputsArray(_device?: number): Choicemeta[] {
		const ret: Choicemeta[] = []
		if (this.state.platform.startsWith('livepremier')) {
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
		} else if (this.state.platform === 'midra') {
			const outputs = this.state.get('DEVICE/device/audio/outputList/itemKeys') ?? []
			for (const out of outputs) {
				if (this.state.get('DEVICE/device/audio/outputList/items/' + out + '/status/pp/isAvailable')){
					ret.push({
						id: out,
						label: ''
					})
				}
			}
		}
		return ret
	}

	public getAudioOutputChoices(): Dropdown<string>[] { 
		if (this.state.platform === 'midra') {
			return this.getAudioOutputChoicesMidra()
		} else {
			return this.getAudioOutputChoicesLivePremier()
		}

	}

	public getAudioOutputChoicesLivePremier(): Dropdown<string>[] {
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

	public getAudioOutputChoicesMidra(): Dropdown<string>[] {
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
		if (this.state.platform === 'midra') {
			return this.getAudioInputChoicesMidra()
		} else {
			return this.getAudioInputChoicesLivePremier()
		}

	}

	public getAudioInputChoicesLivePremier(): Dropdown<string>[] {
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

	public getAudioInputChoicesMidra(): Dropdown<string>[] {
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
				for (const channel of this.state.get('DEVICE/device/audio/inputList/items/' + input + '/channelList/itemKeys')) {
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

	public getAudioSourceChoicesMidra(): Dropdown<string>[] {
		return this.state.get('DEVICE/device/audio/sourceList/itemKeys').filter((itm: string) => {
			return this.state.get('DEVICE/device/audio/sourceList/items/'+itm+'/status/pp/isAvailable')
		}).map((itm: string) => {
			const label = itm
				.replace(/^NONE$/, 'None')
				.replace(/^IN_DANTE_CH(\d+)_(\d+)$/, 'Dante In Ch $1-$2')
				.replace(/^IN_ANALOG_/, 'Line Input ')
				.replace(/^IN_MEDIA_PLAYER$/, 'Media Player')
				.replace(/^CUSTOM_/, 'Custom ')
				.replace(/^IN/, 'Input ')

			return {
				id: itm,
				label
			}
		}) ?? []
	}

	public getTimerArray(): Choicemeta[] {
		const ret: Choicemeta[] = []
		const timers = this.state.get('DEVICE/device/timerList/items') ?? {}
		for (const timer of Object.keys(timers)) {
			ret.push({
				id: timer,
				label: timers[timer].control.pp.label,
				index: timer.replace(/^\w+_/, ''),
			})
		}
		return ret
	}

	public getTimerChoices(): Dropdown<string>[] {

		return this.getTimerArray().map((itm: Choicemeta) => {
			return {
				id: itm.id,
				label: `Timer ${itm.index}${itm.label === '' ? '' : ' - ' + itm.label}`
			}
		})
	}

}
