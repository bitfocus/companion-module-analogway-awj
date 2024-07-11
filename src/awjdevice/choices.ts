import { AWJinstance } from '..'
import { State } from '../../types/State'
import Constants from './constants'

type Dropdown<t> = {id: t, label: string}

export type Choicemeta = { id: string, label: string, index?: string, longname?: string, device?: number }

/**
 * Methods for retrieving device dependent data like properties, lists, choices out of the state or generating it
 */
export default class Choices {
	/** reference to the instance */
	instance: AWJinstance
	/** The state object to take the data from */
	state: State
	/** reference to the constants of the device */
	constants: typeof Constants

	constructor(instance: AWJinstance) {
		this.instance = instance
		this.state = this.instance.state
		this.constants = instance.constants
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
			platformLongId: '',
			/** S or A */
			prefix: '',
			/** number of screen as string */
			numstr: '',
			/** number of screen as number */
			number: NaN,
			/** is it a screen */
			isScreen: false,
			/** is it a auxiliary screen */
			isAux: false,
			/** screen or auxScreen */
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
				platformId: `S${numstr}`,
				platformLongId: `S${numstr}`,
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
				platformId: `A${numstr}`,
				platformLongId: `A${numstr}`,
				prefix: 'A',
				numstr: num.toString(),
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

	public getScreensAuxArray(getAlsoDisabled = false): Choicemeta[] {
		return [...this.getScreensArray(getAlsoDisabled), ...this.getAuxArray(getAlsoDisabled)]
	}

	/** returns array of the currently available and active screens only (no auxes)*/
	public  getScreensArray(_getAlsoDisabled = false): Choicemeta[] {
		return [{ id: 'S1', label: '(emulated)', index: '1' }]
	}

	public getScreenChoices(): Dropdown<string>[] {

		return this.getScreensArray().map((scr: Choicemeta) => {
			return {
				id: scr.id,
				label: `S${scr.index}${scr.label === '' ? '' : ' - ' + scr.label}`
			}
		})
	}

	/** returns array of the currently available and active auxscreens only (no regular screens)*/
	public getAuxArray(_getAlsoDisabled = false ): Choicemeta[] {
		return [{ id: 'A1', label: '(emulated)', index: '1' }]
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
		return []
	}

	public getLiveInputArray(_prefix?: string): Choicemeta[] {
		return []
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
			if (prefix == undefined) prefix = 'IN'
			for (let i = 1; i <= 8; i += 1) {
				ret.push({ id: `${prefix}_${i.toString()}`, label: `Input ${i.toString()} (emulated)` })
			}
		}
		return ret
	}

	choicesForegroundImagesSource: Dropdown<string>[] = []

	public getStillsArray(): Choicemeta[] {
		const bankpath = 'DEVICE/device/stillList/'
		return (
			this.state.getUnmapped(this.state.concat(bankpath, 'itemKeys'))?.filter((itm: string) => {
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
		return ret
	}

	public getAuxSourceChoices(): Dropdown<string>[] {
		// first add None and Color which are always available
		const ret: Dropdown<string>[] = [
			{ id: 'NONE', label: 'None' },
		]

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
			NDI: 'NDI'
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
		const bankpath = 'DEVICE/device/masterPresetBank/bankList'
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

	public getMasterMemoryChoices(): Dropdown<string>[] {

		return this.getMasterMemoryArray().map((mem: Choicemeta) => {
			return {
				id: mem.id,
				label: `MM${mem.id}${mem.label === '' ? '' : ' - ' + mem.label}`
			}
		})
	}

	public getScreenMemoryArray(): Choicemeta[] {
		let bankpath = this.constants.screenMemoryPath

		return (
			this.state.getUnmapped(this.state.concat('DEVICE', bankpath, 'itemKeys'))?.filter((mem: string) => {
				return this.state.getUnmapped(this.state.concat('DEVICE', bankpath, ['items', mem, 'status', 'pp', 'isValid']))
			}).map((mem: string) => {
				return {
					id: mem,
					label: this.state.getUnmapped(this.state.concat('DEVICE', bankpath, ['items',mem,'control','pp','label',]))
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
		return []
	}

	public getAuxMemoryChoices(): Dropdown<string>[] {
		return []
	}

	public getLayerMemoryArray(): Choicemeta[] {
		return (
			(this.state.getUnmapped('DEVICE/device/layerBank/bankList/itemKeys')?.filter((mem: string) => {
				return this.state.getUnmapped(['DEVICE', 'device', 'layerBank', 'bankList', 'items', mem, 'status', 'pp', 'isValid'])
			}) ?? [])
			.map(
				(id: string) => { 
					return {
						id,
						label: this.state.getUnmapped(['DEVICE', 'device', 'layerBank', 'bankList', 'items', id, 'control', 'pp', 'label'])
					}
				}
			)
		)
	}

	public getLayerMemoryChoices(): Dropdown<string>[] {
		return this.getLayerMemoryArray().map((memory) => {return {
			id: memory.id,
			label: `LM${memory.id}${memory.label === '' ? '' : ' - ' + memory.label}`,
		}})
	}

	public getMultiviewerMemoryArray(): Choicemeta[] {
		const bankpath = this.constants.multiviewerMemoryPath
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
		
		return ret
	}

	public getWidgetSourceChoices(): Dropdown<string>[] {
		// first add None which is always available
		const ret: Dropdown<string>[] = [{ id: 'NONE', label: 'None' }]

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
	 * @param top wether to include foreground layer if available, follows bkg if omitted 
	*/
	public getLayersAsArray(param: string | number, bkg?: boolean, _top?: boolean): Choicemeta[] {
		const ret: Choicemeta[] = []
		if (typeof param === 'number') {
			if (bkg === undefined || bkg === true) ret.push({ id: 'NATIVE', label: 'Background', longname: 'BKG' })
			for (let i = 1; i <= param; i += 1) {
				ret.push({ id: `${i.toString()}`, label: `Layer ${i.toString()}` })
			}
			return ret
		}
		return ret
	}

	/**
	 * Returns array with some layer choices
	 * @param param if it is a number that number of layer choices are returned, if it is a string the layers of the screen are returned
	 * @param bkg wether to include only live layers (false) or also background and eventually foreground layer (true or omitted) 
	 * @param top wether to include foreground layer if available, follows bkg if omitted
	 */
	public getLayerChoices(param: string | number, bkg?: boolean, top?: boolean): Dropdown<string>[] {
		const ret: Dropdown<string>[] = this.getLayersAsArray(param, bkg, top)
			.map(layer => {
				return {
					id: layer.id,
					label: layer.label ?? layer.longname ?? layer.id
				}
			})
			?? []
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
	 * @param device optional number of device to return outputs for
	 * @returns array of output describing objects
	 */
	public getAudioOutputsArray(_device?: number): Choicemeta[] {
		const ret: Choicemeta[] = []
		return ret
	}

	public getAudioOutputChoices(_device?: number): Dropdown<string>[] { 
		return []
	}

	public getAudioCustomBlockChoices(): Dropdown<string>[] {
		return []
	}

	public getAudioInputChoices(_device?: number): Dropdown<string>[] { 
		return []
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

	/** Is a screen / preset combination locked */
	public isLocked(screen: string, preset: string): boolean {
		preset = preset.replace(/.+m.*/i, 'PROGRAM').replace(/.+w.*/i, 'PREVIEW')
		let path = ['LOCAL']
		if (this.instance.state.syncSelection) {
			path = ['REMOTE', 'live', 'screens']
		}
		if (screen === 'all') {
			const allscreens = this.getChosenScreenAuxes('all')
				.map( screenId => this.getScreenInfo(screenId).platformLongId )
			return (
				allscreens.find((scr) => {
					return this.state.get([...path, 'presetModeLock', preset, scr]) === false
				}) === undefined
			)
		} else {
			return this.state.get([...path, 'presetModeLock', preset, this.getScreenInfo(screen).platformLongId ])
		}
	}

	/**
	 * Returns the currently selected preset or just the input if a specific preset is given.
	 * @param preset if omitted or if 'sel' then the currently selected preset is returned
	 * @param fullName if set to true the return value is PROGRAM/PREVIEW instead of pgm/pvw
	 * @returns
	 */
	getPresetSelection(preset?: string, fullName = false): 'pgm' | 'pvw' | 'PROGRAM' | 'PREVIEW' {
		let pst = preset
		if (preset === undefined || preset.match(/^sel$/i)) {
			if (this.instance.state.syncSelection) {
				pst = this.state.get('REMOTE/live/screens/presetModeSelection/presetMode')
			} else {
				pst = this.state.get('LOCAL/presetMode')
			}
		}
		if (pst && pst.match(/^pgm|program$/i) && !fullName) {
			return 'pgm'
		} else if (pst && pst.match(/^pvw|preview$/i) && !fullName) {
			return 'pvw'
		} else if (pst && pst.match(/^pgm|program$/i) && fullName) {
			return 'PROGRAM'
		} else if (pst && pst.match(/^pvw|preview$/i) && fullName) {
			return 'PREVIEW'
		} else if (fullName) {
			return 'PREVIEW'
		} else {
			return 'pvw'
		}
	}

	/**
	 * Returns the actual preset (A or B) representing program or preview of the given input or of the selection
	 * @param screen S1-S... or A1-A...
	 * @param preset can be A or B or PGM or PVW or 'sel', A and B are returned unchanged
	 * @returns A or B, whichever is the actual preset for program or preview, during fades the preset is changed only at the end of the fade
	 */
	public getPreset(screen: string, preset: string): string {
		if (screen.match(/^S|A\d+$/) === null) return ''
		if (preset.match(/^A|B|PGM|PVW|SEL$/i) === null) return ''
		if (preset.toLowerCase() === 'sel') {
			preset = this.getPresetSelection()
		}
		let ret: string
		if (preset.match(/^A|B$/i)) {
			ret = preset.toUpperCase()
		} else {
			ret = this.state.getUnmapped(`LOCAL/screens/${screen}/${preset.toLowerCase()}/preset`)
		}
		return ret
	}

	/**
	 * Returns the program or preview representing the given preset A or B of the screen
	 * @param screen S1-S... or A1-A...
	 * @param preset can be A or B
	 * @param fullName if true returnes PROGRAM/PREVIEW else pgm/pvw
	 * @returns program or preview, during fades the preset is changed only at the end of the fade
	 */
	public getPresetRev(screen: string, preset: string, fullName = false): string | null {
		if (screen.match(/^S|A\d+$/) === null) return null
		if (preset.match(/^A|B$/i) === null) return null
		let ret: string
		if (this.state.get(`LOCAL/screens/${screen}/pgm/preset`) === preset.toUpperCase()) {
			ret = fullName ? 'PROGRAM' : 'pgm'
		} else {
			ret = fullName ? 'PREVIEW' : 'pvw'
		}
		return ret
	}

	/**
	 * Returnes the input array of screens but extends it by all active screens or the selected screens if the input array containes 'all' or 'sel'
	 * @param input array of strings to check
	 * @param prefix what to write in front of the screen number, defaults to 'S'
	 * @returns either all active screens or the input
	 */
	public getChosenScreens(input: string | string[], prefix = 'S'): string[] {
		if (typeof input === 'string') {
			input = [input]
		}
		let screens: string[] = []
		// get screens to check
		if (input.includes('all')) {
			this.getScreensArray().forEach((screen: Choicemeta) => screens.push(`${prefix}${screen.index}`))
		} else if (input.includes('sel')) {
			screens = [...input]
			screens.splice(screens.indexOf('sel'), 1)
			for (const selscr of this.getSelectedScreens()) {
				if (screens.includes(selscr) === false) {
					screens.push(selscr)
				}
			}
		} else {
			screens = input
		}
		return screens
	}

	/**
	 * Returnes the input array of auxes but extends it by all active auxes or the selected auxes if the input array containes 'all' or 'sel'
	 * @param input array of strings to check
	 * @returns either all active auxes or the input
	 */
	public getChosenAuxes(input: string | string[]): string[] {
		if (typeof input === 'string') {
			input = [input]
		}
		let screens: string[] = []
		// get screens to check
		if (input.includes('all')) {
			this.getAuxArray().forEach((screen: Choicemeta) => screens.push('A' + screen.index))
		} else if (input.includes('sel')) {
			screens = [...input]
			screens.splice(screens.indexOf('sel'), 1)
			for (const selscr of this.getSelectedScreens()) {
				if (screens.includes(selscr) === false) {
					screens.push(selscr)
				}
			}
		} else {
			screens = input
		}
		return screens
	}

	public getAuxBackgroundChoices(): Dropdown<string>[] {
		return []
	}

	/**
	 * Returnes the input array of screens and maybe auxes if on this platform they support screen memories but extends it by all active screens and auxes or the selected screens/auxes if the input array containes 'all' or 'sel'
	 * @param input array of strings to check
	 * @returns either all active screens or the input in prefix+number(S1 A2) format
	 */
	public getChosenScreensSupportedByScreenMemories = this.getChosenScreenAuxes

	/**
	 * Returnes the input array of screens and auxes but extends it by all active screens and auxes or the selected screens/auxes if the input array containes 'all' or 'sel'
	 * @param input array of strings to check
	 * @returns either all active screens or the input in prefix+number(S1 A2) format
	 */
	public getChosenScreenAuxes(input: string | string[] | undefined): string[] {
		if (input === undefined) return []
		if (typeof input === 'string') {
			input = [input]
		}
		let screens: string[] = []
		// get screens to check
		if (input.includes('all')) {
			screens.push(...this.getChosenScreens('all'))
			screens.push(...this.getChosenAuxes('all'))

		} else if (input.includes('sel')) {
			screens = [...input]
			screens.splice(screens.indexOf('sel'), 1)
			for (const selscr of this.getSelectedScreens()) {
				if (screens.includes(selscr) === false) {
					screens.push(selscr)
				}
			}
		} else {
			screens = input
		}
		return screens
	}

	public getSelectedScreens(): string[] {
		let path = 'LOCAL/screenAuxSelection/keys'
		if (this.instance.state.syncSelection) {
			path = 'REMOTE/live/screens/screenAuxSelection/keys'
		}
		return [...this.state.getUnmapped(path)]
	}

	public getSelectedLayers(): { screenAuxKey: string; layerKey: string} [] {
		let path = 'LOCAL/layerIds'
		if (this.instance.state.syncSelection) {
			path = 'REMOTE/live/screens/layerSelection/layerIds'
		}
		return this.state.getUnmapped(path)
	}
	
    /**
	 * get MAC address for WOL
	 */
	public getMACaddress(): string {
		return this.state
			.get(this.constants.macAddressPath)
			.map((elem: number) => {
				return elem.toString(16).padStart(2,'0')
			})
			.join(':') ?? ''
	}

	/**
	 * get choices of linked devices
	 */
	getLinkedDevicesChoices(): Dropdown<number>[] {
		return [{id: 1, label: '1 (Leader 👑)'}]
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
			return ['layerList', 'items', '48']
		}
		else if (layer.match(/bkg|background|native/i)) {
			return ['layerList', 'items', 'NATIVE']
		}
		else {
			return ['layerList', 'items', layer.replace(/\D/g, '')]
		}
	}

}
