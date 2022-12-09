import AWJinstance from './index'
import { checkForAction, Subscription } from './subscriptions'
import { mapIn, mapOut, MapItem } from './mappings'
//import { InputValue } from './../../../instance_skel_types'
import { Choicemeta, getAuxArray, getScreensArray } from './choices'

type Channel = 'REMOTE' | 'DEVICE' | 'LOCAL'

class State {
	instance: AWJinstance
	stateobj = {
		REMOTE: {},
		DEVICE: {},
		LOCAL: {
			socketId: '',
			platform: '',
			syncSelection: false,
			screenAuxSelection: { keys: [] },
			widgetSelection: { widgetIds: [] },
			lastMsg: { path: '', value: '' },
			presetMode: 'PREVIEW',
			presetModeLock: {
				PROGRAM: {
					S1: false,
					S2: false,
					S3: false,
					S4: false,
					S5: false,
					S6: false,
					S7: false,
					S8: false,
					S9: false,
					S10: false,
					S11: false,
					S12: false,
					S13: false,
					S14: false,
					S15: false,
					S16: false,
					S17: false,
					S18: false,
					S19: false,
					S20: false,
					S21: false,
					S22: false,
					S23: false,
					S24: false,
					A1: false,
					A2: false,
					A3: false,
					A4: false,
					A5: false,
					A6: false,
					A7: false,
					A8: false,
					A9: false,
					A10: false,
					A11: false,
					A12: false,
					A13: false,
					A14: false,
					A15: false,
					A16: false,
					A17: false,
					A18: false,
					A19: false,
					A20: false,
					A21: false,
					A22: false,
					A23: false,
					A24: false,
				},
				PREVIEW: {
					S1: false,
					S2: false,
					S3: false,
					S4: false,
					S5: false,
					S6: false,
					S7: false,
					S8: false,
					S9: false,
					S10: false,
					S11: false,
					S12: false,
					S13: false,
					S14: false,
					S15: false,
					S16: false,
					S17: false,
					S18: false,
					S19: false,
					S20: false,
					S21: false,
					S22: false,
					S23: false,
					S24: false,
					A1: false,
					A2: false,
					A3: false,
					A4: false,
					A5: false,
					A6: false,
					A7: false,
					A8: false,
					A9: false,
					A10: false,
					A11: false,
					A12: false,
					A13: false,
					A14: false,
					A15: false,
					A16: false,
					A17: false,
					A18: false,
					A19: false,
					A20: false,
					A21: false,
					A22: false,
					A23: false,
					A24: false,
				},
			},
			layerIds: [],
			intelligentParams: {},
			subscriptions: {} as Record<string, Subscription>,
			mappings: [] as MapItem[]
		},
	}

	constructor(instance: AWJinstance) {
		this.instance = instance
	}

	public getUnmapped(path?: string | string[] | undefined, root?: any): any { 
		if (path === undefined) {
			return this.stateobj
		}
		if (root === undefined) {
			root = this.stateobj
		}
		const obj: any = root
		let first: string
		let patharray: string[]
		if (typeof path === 'string') {
			const npath = path.replace(/^\//, '')
			;[first, ...patharray] = npath.split('/')
		} else {
			[first, ...patharray] = path
		}
		// if we are at the leaf -> return element
		if (patharray.length === 0) {
			return obj[first]
		} else {
			// if we are at an non existing branch -> return undefined
			if (obj[first] == undefined) {
				return undefined
			}
			// else if we are at an branch -> go ahead
			return this.getUnmapped(patharray, obj[first])
		}
	}

	public get(path?: string | string[] | undefined, root?: any): any {
		const mapped = mapOut(this.stateobj.LOCAL.mappings, path, null)
		const val = this.getUnmapped(mapped.path, root) // TODO: root mapping
		return mapIn(this.stateobj.LOCAL.mappings, mapped.path, val).value
	}

	concat(first: string | string[], second: string | string[]): string | string[] {
		const trimend = (str: string) => {
			return str.replace(/\/$/, '')
		}
		const trimstart = (str: string) => {
			return str.replace(/^\//, '')
		}
		if (typeof first === 'string' && typeof second === 'string') {
			return trimend(first) + '/' + trimstart(second)
		} else if (typeof first === 'string' && Array.isArray(second)) {
			return [ ...trimend(first).split('/'), ...second]
		} else if (typeof second === 'string' && Array.isArray(first)) {
			return [...first, ...trimstart(second).split('/')]
		} else {
			return [...first, ...second]
		}
	}

	public apply(obj: any): void {
		if (obj.channel === undefined || obj.data === undefined) return
		const channel: Channel = obj.channel
		const data = obj.data
		let feedbacks: any
		// eslint-disable-next-line no-prototype-builtins
		if (data.hasOwnProperty('path') && data.hasOwnProperty('value')) {
			this.setUnmapped(data.path, data.value, this.stateobj[channel])
			const mapped = mapIn(this.stateobj.LOCAL.mappings, this.concat(channel, data.path), data.value)
			feedbacks = checkForAction(this.instance, mapped.path, mapped.value)
			if (channel === 'DEVICE' && !data.path.toString().endsWith(',control,pp,xUpdate')) {
				this.setUnmapped('LOCAL/lastMsg', { path: data.path, value: data.value }) // TODO: what about mappings
			}
		} else if (data?.channel === 'PATCH' && data.patch) {
			const mapped = mapIn(this.stateobj.LOCAL.mappings, this.concat(channel, data.patch.path), data.patch.value)
			if (data.patch.op === 'replace') {
				try {
					this.setUnmapped(data.patch.path, data.patch.value, this.stateobj[channel])
					feedbacks = checkForAction(this.instance, mapped.path, mapped.value)
				} catch (error) {
					console.log('could not replace JSON', error)
				}
			}
			if (data.patch.op === 'add') {
				try {
					this.setUnmapped(data.patch.path, data.patch.value, this.stateobj[channel])
					feedbacks = checkForAction(this.instance, mapped.path, mapped.value)
				} catch (error) {
					console.log('could not add JSON', error)
				}
			}
			if (data.patch.op === 'remove') {
				try {
					this.delete(data.patch.path, this.stateobj[channel])
					feedbacks = checkForAction(this.instance, mapped.path)
				} catch (error) {
					console.log('could not remove element from JSON', error)
				}
			}
		} else if (data?.channel === 'INIT') {
			try {
				this.stateobj.LOCAL.socketId = data.socketId
				this.stateobj[channel] = { ...data.snapshot }
				feedbacks = checkForAction(this.instance)
			} catch (error) {
				this.instance.log('debug', 'could not set JSON while init ' + error)
			}
		}
		if (feedbacks && typeof feedbacks === 'string') {
			// console.log('checking feedback from external msg', feedbacks)
			this.instance.checkFeedbacks(feedbacks)
		} else if (feedbacks && Array.isArray(feedbacks)) {
			// console.log('checking feedbacks from external msg', feedbacks)
			feedbacks.forEach((fb) => this.instance.checkFeedbacks(fb))
		}
	}

	public setUnmapped(path: string | string[], value: any, root: any = this.stateobj): void { 
		const obj: any = root
		let first: string
		let patharray: string[]
		if (typeof path === 'string') {
			const npath = path.replace(/^\//, '')
			;[first, ...patharray] = npath.split('/')
		} else {
			[first, ...patharray] = path
		}
		// if we are at the leaf -> update
		if (patharray.length === 0) {
			obj[first] = value
			//console.log('state update')
			//console.log('\nstate update', JSON.stringify(this.stateobj))
		} else {
			// if we are at an non existing branch -> create
			if (obj[first] == undefined) {
				obj[first] = {}
			}
			// else if we are at an branch -> go ahead
			this.setUnmapped(patharray, value, obj[first])
		}
	}


	/**
	 * Sets values in a JSON by using a path
	 * @param path can be either a '/'-delimited string or a string array pointing to a node in JSON, similar to JSON-Path
	 * @param value is the value to set the node to
	 * @param root is the root object from where the path applies, if not given defaults to the state object
	 */
	public set(path: string | string[], value: unknown, root: any = this.stateobj): void {
		const mapped = mapIn(this.stateobj.LOCAL.mappings, path, value)
		this.setUnmapped(mapped.path, mapped.value, root) // TODO: root mapping
	}

	/**
	 * Wrapper function for set with the same signature as sendWSmessage
	 * @param channel
	 * @param path
	 * @param value
	 */
	public setWithChannel(channel: string, path: string | string[], value: string | string[] | number | boolean): void {
		this.set(channel + '/' + path, value)
	}

	/**
	 * Deletes a property or element in a JSON by using a path
	 * If the path points to an array the element gets deleted and the array gets shortened, else the property is deleted
	 * @param path can be either a '/'-delimited string or a string array pointing to a node in JSON, similar to JSON-Path
	 * @param root is the root object from where the path applies, if not given defaults to the state object
	 */
	public delete(path: string | string[], root: any = this.stateobj): void {
		const obj: any = root
		let first: string
		let patharray: string[]
		if (typeof path === 'string') {
			const npath = path.replace(/^\//, '')
			;[first, ...patharray] = npath.split('/')
		} else {
			[first, ...patharray] = path
		}
		// if we are at the leaf -> update
		if (patharray.length === 0) {
			if (Array.isArray(obj) && parseInt(first) >= 0) {
				obj.splice(parseInt(first), 1)
			} else {
				delete obj[first]
			}
			console.log('\nstate update', JSON.stringify(this.stateobj).substring(0, 500))
		} else {
			// if we are at an non existing branch -> nothing to delete
			if (obj[first] == undefined) {
				return
			}
			// else if we are at an branch -> go ahead
			this.delete(patharray, obj[first])
		}
	}

	/**
	 * Returns the currently selected preset or just the input if a specific preset is given.
	 * @param preset if omitted or if 'sel' then the currently selected preset is returned
	 * @param fullName if set to true the return value is PROGRAM/PREVIEW instead of pgm/pvw
	 * @returns
	 */
	public getPresetSelection(preset?: string, fullName = false): 'pgm' | 'pvw' | 'PROGRAM' | 'PREVIEW' {
		let pst = preset
		if (preset === undefined || preset.match(/^sel$/i)) {
			if (this.syncSelection) {
				pst = this.get('REMOTE/live/screens/presetModeSelection/presetMode')
			} else {
				pst = this.get('LOCAL/presetMode')
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
	 * Returnes the platform we are currently connected to
	 */
	public get platform(): string {
		return this.stateobj.LOCAL.platform
	}

	public get syncSelection(): boolean {
		return this.stateobj.LOCAL.syncSelection
	}

	public get mappings(): MapItem[] {
		return this.stateobj.LOCAL.mappings
	}

	public get subscriptions(): Record<string, Subscription> {
		return this.stateobj.LOCAL.subscriptions
	}

	public isLocked(screen: string, preset: string): boolean {
		preset = preset.replace(/pgm/i, 'PROGRAM').replace(/pvw/i, 'PREVIEW')
		let path = ['LOCAL']
		if (this.syncSelection) {
			path = ['REMOTE', 'live', 'screens']
		}
		if (screen === 'all') {
			const allscreens = this.getChosenScreenAuxes('all')
			return (
				allscreens.find((scr) => {
					return this.get([...path, 'presetModeLock', preset, scr]) === false
				}) === undefined
			)
		} else {
			return this.get([...path, 'presetModeLock', preset, screen])
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
			ret = this.get(`LOCAL/screens/${screen}/${preset.toLowerCase()}/preset`)
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
	public getPresetRev(screen: string, preset: 'A' | 'B' | 'a' | 'b', fullName = false): string | null {
		if (screen.match(/^S|A\d+$/) === null) return null
		if (preset.match(/^A|B$/i) === null) return null
		let ret: string
		if (this.get(`LOCAL/screens/${screen}/pgm/preset`) === preset.toUpperCase()) {
			ret = fullName ? 'PROGRAM' : 'pgm'
		} else {
			ret = fullName ? 'PREVIEW' : 'pvw'
		}
		return ret
	}

	/**
	 * Returnes the input array of screens but extends it by all active screens or the selected screens if the input array containes 'all' or 'sel'
	 * @param input array of strings to check
	 * @returns either all active screens or the input
	 */
	public getChosenScreens(input: string | string[]): string[] {
		if (typeof input === 'string') {
			input = [input]
		}
		let screens: string[] = []
		// get screens to check
		if (input.includes('all')) {
			getScreensArray(this).forEach((screen: Choicemeta) => screens.push('S'+ screen.index))
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
			getAuxArray(this).forEach((screen: Choicemeta) => screens.push('A'+ screen.index))
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
	 * Returnes the input array of screens and auxes but extends it by all active screens and auxes or the selected screens/auxes if the input array containes 'all' or 'sel'
	 * @param input array of strings to check
	 * @returns either all active screens or the input
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
		if (this.syncSelection) {
			path = 'REMOTE/live/screens/screenAuxSelection/keys'
		}
		return [...this.get(path)]
	}

	public getSelectedLayers(): { screenAuxKey: string; layerKey: string }[] {
		let path = 'LOCAL/layerIds'
		if (this.syncSelection) {
			path = 'REMOTE/live/screens/layerSelection/layerIds'
		}
		return this.get(path)
	}
}

export { State }
