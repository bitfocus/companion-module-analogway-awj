import {AWJinstance} from './index.js'
import { checkForAction, Subscription } from './awjdevice/subscriptions.js'
import { mapIn, mapOut, MapItem } from './mappings.js'
//import { InputValue } from './../../../instance_skel_types'
import { Choicemeta, getAuxArray, getScreensArray } from './awjdevice/choices.js'
import { Config } from './config.js'

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
					...Object.fromEntries(Array.from({ length: 24 }, (_, b) => { return [`S${b + 1}`, false] })),
					...Object.fromEntries(Array.from({ length: 96 }, (_, b) => { return [`A${b + 1}`, false] })),
				},
				PREVIEW: {
					...Object.fromEntries(Array.from({ length: 24 }, (_, b) => { return [`S${b + 1}`, false] })),
					...Object.fromEntries(Array.from({ length: 96 }, (_, b) => { return [`A${b + 1}`, false] })),
				},
			},
			layerIds: [],
			intelligentParams: {},
			subscriptions: {} as Record<string, Subscription>,
			mappings: [] as MapItem[],
			config: {} as Config
		},
	};
	private lastMsgTimer: NodeJS.Timeout | undefined = undefined;

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
			const npath = path.replace(/^\//, '');[first, ...patharray] = npath.split('/')
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

	/**
	 * concatenates parts of paths
	 * preserves a leading or trailing `/` only if all arguments are strings
	 * @param args can be strings or arrays of strings or any combination
	 * @returns a string if all arguments are strings or otherwise an array with the parts
	 */
	concat(...args: (string | any[])[]): string | string[] {
		if (args.length === 0) return []
		const onlyStrings = args.every(arg => typeof arg === 'string')
		args = args.flat(Infinity)
		if (args.length === 1) return args[0] as string[]
		let lead: string[] = [], trail: string[] = []

		if (onlyStrings) {
			const first = args[0] as string // needed to avoid error without conditional type predicate
			if (first.charAt(0) === '/') lead = ['']
			if (args[args.length - 1].slice(-1) === '/') trail = ['']
		}

		args = args.map(part => part.toString().replaceAll(/^\/|\/$/g, '').split('/'))
		if (onlyStrings) {
			return [...lead, ...args.flat(Infinity), ...trail].join('/')
		} else {
			return args.flat(Infinity)
		}
	}

	/**
	 * Stores the last message to the state with a locking mechanism. Message is only stored if there not had been an attempt to call this function in the last 800ms
	 * @param msg The message object
	 */
	private storeLastMsg(msg: { path: unknown; value: unknown} ): void {
		if (this.lastMsgTimer && this.lastMsgTimer.hasRef()) { // there is a running timer
			this.lastMsgTimer.refresh()
		} else if (this.lastMsgTimer && this.lastMsgTimer.hasRef() === false) { // there is an elapsed timer
			this.setUnmapped('LOCAL/lastMsg', msg)
			this.lastMsgTimer.ref()
			this.lastMsgTimer.refresh()
		} else { // there is no timer
			this.setUnmapped('LOCAL/lastMsg', msg)
			clearTimeout(this.lastMsgTimer)
			this.lastMsgTimer = setTimeout(() => { this.lastMsgTimer?.unref() }, 800)
		}
	}

	public clearTimers() {
		clearTimeout(this.lastMsgTimer)
	}

	/**
	 * Handles a received object describing a state change, applies it to the local state storage, runs any needed subscriptions, checks feedbacks and eventually handles action recording
	 * @param obj the AWJ object to apply
	 * @returns
	 */
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
			if (channel === 'DEVICE' && !data.path.toString().endsWith(',pp,xUpdate')) {
				this.storeLastMsg({ path: data.path, value: data.value })
				if (this.instance.isRecording && JSON.stringify(data.value).length <= 132) {
					const newoptions = { xUpdate: false }
					newoptions['path'] = this.instance.jsonToAWJpath(data.path)
					switch (typeof data.value) {
						case 'string':
							newoptions['valuetype'] = '1'
							newoptions['textValue'] = data.value
							break
						case 'number':
							newoptions['valuetype'] = '2'
							newoptions['numericValue'] = data.value
							break
						case 'boolean':
							newoptions['valuetype'] = '3'
							newoptions['booleanValue'] = data.value
							break
						case 'object':
							newoptions['valuetype'] = '4'
							newoptions['objectValue'] = JSON.stringify(data.value)
					}
					this.instance.recordAction({
						actionId: 'cstawjcmd',
						options: newoptions
					})
				}
			}
			if (this.instance.isRecording && channel === 'DEVICE' && data.path.toString().endsWith(',pp,xUpdate') && data.value === true) {
				this.instance.recordAction({
					actionId: 'cstawjcmd',
					options: {
						path: '',
						valuetype: '1',
						textValue: 'global update only',
						numericValue: 0,
						booleanValue: false,
						objectValue: '',
						xUpdate: true
					}
				})
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
			if (feedbacks.startsWith('id:')) {
				this.instance.checkFeedbacksById(feedbacks.substring(3))
			} else {
				this.instance.checkFeedbacks(feedbacks)
			}
		} else if (feedbacks && Array.isArray(feedbacks)) {
			// console.log('checking feedbacks from external msg', feedbacks)
			feedbacks.forEach((fb) => {
				if (fb.startsWith('id:')) {
					this.instance.checkFeedbacksById(fb.substring(3))
				} else {
					this.instance.checkFeedbacks(fb)
				}
			})
		}
	}

	public setUnmapped(path: string | string[], value: any, root: any = this.stateobj): void {
		const obj: any = root
		let first: string
		let patharray: string[]
		if (typeof path === 'string') {
			const npath = path.replace(/^\//, '');[first, ...patharray] = npath.split('/')
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
			const npath = path.replace(/^\//, '');[first, ...patharray] = npath.split('/')
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
			// console.log('\nstate update', JSON.stringify(this.stateobj).substring(0, 500))
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
			preset = this.instance.device.getPresetSelection()
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
			getScreensArray(this).forEach((screen: Choicemeta) => screens.push('S' + screen.index))
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
			getAuxArray(this).forEach((screen: Choicemeta) => screens.push('A' + screen.index))
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

	public getSelectedLayers(): { screenAuxKey: string; layerKey: string} [] {
		let path = 'LOCAL/layerIds'
		if (this.syncSelection) {
			path = 'REMOTE/live/screens/layerSelection/layerIds'
		}
		return this.get(path)
	}
}

export { State }
