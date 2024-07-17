import { AWJinstance } from './index.js'
import { Subscription } from '../types/Subscription.js'
import { Config } from './config.js'

type Channel = 'REMOTE' | 'DEVICE' | 'LOCAL' | 'LINK'

class StateMachine {
	instance: AWJinstance
	state = {
		REMOTE: {},
		DEVICE: {},
		LINK: {},
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
			mappings: [] as unknown[],
			config: {} as Config
		},
	};
	private lastMsgTimer: NodeJS.Timeout | undefined = undefined;

	constructor(instance: AWJinstance, initialState?: {[name: string]: any}) {
		this.instance = instance
		if (initialState) {
			this.set('DEVICE', initialState)
		}
	}

	public get(path?: string | string[] | undefined, root?: any): any {
		if (path === undefined) {
			return this.state
		}
		if (root === undefined) {
			root = this.state
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
			return this.get(patharray, obj[first])
		}
	}

	// public get(path?: string | string[] | undefined, root?: any): any {
	// 	return this.get(path, root)
	// 	// const mapped = mapOut(this.state.LOCAL.mappings, path, null)
	// 	// const val = this.get(mapped.path, root) // TODO: root mapping
	// 	// return mapIn(this.state.LOCAL.mappings, mapped.path, val).value
	// }

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
			this.set('LOCAL/lastMsg', msg)
			this.lastMsgTimer.ref()
			this.lastMsgTimer.refresh()
		} else { // there is no timer
			this.set('LOCAL/lastMsg', msg)
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
			this.set(data.path, data.value, this.state[channel])
			feedbacks = this.instance.subscriptions.checkForAction(data.path, data.value)
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
			if (data.patch.op === 'replace') {
				try {
					this.set(data.patch.path, data.patch.value, this.state[channel])
					feedbacks = this.instance.subscriptions.checkForAction(data.patch.path, data.patch.value)
				} catch (error) {
					console.log('could not replace JSON\n', error)
				}
			}
			if (data.patch.op === 'add') {
				try {
					this.set(data.patch.path, data.patch.value, this.state[channel])
					feedbacks = this.instance.subscriptions.checkForAction(data.patch.path, data.patch.value)
				} catch (error) {
					console.log('could not add JSON\n', error)
				}
			}
			if (data.patch.op === 'remove') {
				try {
					this.delete(data.patch.path, this.state[channel])
					feedbacks = this.instance.subscriptions.checkForAction(data.patch.path)
				} catch (error) {
					console.log('could not remove element from JSON\n', error)
				}
			}
		} else if (data?.channel === 'INIT') {
			try {
				this.state.LOCAL.socketId = data.socketId
				this.state[channel] = { ...data.snapshot }
				feedbacks = this.instance.subscriptions.checkForAction()
			} catch (error) {
				this.instance.log('debug', 'could not set JSON while init\n' + error)
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

	public set(path: string | string[], value: any, root: any = this.state): void {
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
			this.set(patharray, value, obj[first])
		}
	}


	/**
	 * Sets values in a JSON by using a path
	 * @param path can be either a '/'-delimited string or a string array pointing to a node in JSON, similar to JSON-Path
	 * @param value is the value to set the node to
	 * @param root is the root object from where the path applies, if not given defaults to the state object
	 */
	public setUnmapped(path: string | string[], value: unknown, root: any = this.state): void {
		this.set(path, value, root)
		// const mapped = mapIn(this.state.LOCAL.mappings, path, value)
		// this.set(mapped.path, mapped.value, root) // TODO: root mapping
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
	public delete(path: string | string[], root: any = this.state): void {
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
	 * the platform we are currently connected to
	 */
	public get platform(): string {
		return this.state.LOCAL.platform
	}
	public set platform(platform: string) {
		this.state.LOCAL.platform = platform
	}

	public get syncSelection(): boolean {
		return this.state.LOCAL.syncSelection
	}

	public get mappings(): unknown[] {
		return this.state.LOCAL.mappings
	}
}

export { StateMachine }
