import {
	combineRgb,
	CompanionActionDefinitions,
	CompanionVariableDefinition,
	InstanceBase,
	InstanceStatus,
	runEntrypoint,
	SomeCompanionConfigField,
} from '@companion-module/base'
import { getActions } from './actions'
import { Config, GetConfigFields } from './config'
import { AWJdevice } from './connection'
import { State } from './state'
import { getFeedbacks } from './feedback'
import { getPresets } from './presets'
import { initVariables } from './variables'
import { Subscription } from './subscriptions'
import { UpgradeScripts } from './upgrades'

export const regexAWJpath = '^DeviceObject(?:\\/(@items|@props|\\$?[A-Za-z0-9_-]+))+$'

/**
 * Companion instance class for the Analog Way AWJ API products.
 */
export class AWJinstance extends InstanceBase<Config> {
	/**
	 * Create an instance of an AWJ module.
	 */
	public state!: State
	public device!: AWJdevice
	private variables!: (CompanionVariableDefinition & { id?: string })[]
	public config!: Config
	private oldlabel = ''
	public isRecording = false

	constructor(system: unknown) {
		super(system)
		this.instanceOptions.disableVariableValidation = true
	}

	/**
	 * Main initialization function called once the module
	 * is OK to start doing things.
	 */
	public async init(config: Config): Promise<void> {
		this.updateStatus(InstanceStatus.Disconnected) //(this.STATUS_UNKNOWN)

		this.config = config
		this.variables = []
		this.state = new State(this)
		this.device = new AWJdevice(this)
		this.oldlabel = this.label

		if (this.config.deviceaddr === undefined) {
			// config never been set?
			console.log('brand new config')
			this.config.deviceaddr = 'http://192.168.2.140'
			this.config.macaddress = ''
			this.config.sync = true
			this.config.showDisabled = false
			this.config.color_bright = 16777215
			this.config.color_dark = 2239025
			this.config.color_highlight = combineRgb(24,111,173)
			this.config.color_green = combineRgb(0,203,56)
			this.config.color_greendark = combineRgb(0,115,27)
			this.config.color_greengrey = combineRgb(45,79,49)
			this.config.color_red = combineRgb(213,0,0)
			this.config.color_reddark = combineRgb(82,0,0)
			this.config.color_redgrey = combineRgb(79,31,31)		
			this.saveConfig(this.config)
		}
		this.state.setUnmapped('LOCAL/config', this.config)

		this.setFeedbackDefinitions(getFeedbacks(this, this.state)) 
		this.variables = initVariables(this)
		this.updateVariableDefinitions(this.variables)
		this.setVariableValues({connectionLabel: this.label})
		this.subscribeFeedbacks()
		this.device.connect(this.config.deviceaddr)

		// void this.updateInstance()
	}

	/**
	 * Clean up the instance before it is destroyed.
	 */
	public async destroy(): Promise<void> {
		this.state.clearTimers()
		this.device.destroy()

		this.log('debug' ,'destroy '+this.id)
	}

	/**
	 * Creates the configuration fields for instance config.
	 */
	public getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	/**
	 * Process an updated configuration array.
	 */
	public async configUpdated(config: Config): Promise<void> {
		console.log('Config Update called', this.oldlabel, this.label)
		const oldconfig = {  ...this.config }
		this.config = config
		this.state.setUnmapped('LOCAL/config', this.config)

		if (this.config.deviceaddr !== oldconfig.deviceaddr) {
			// new address, reconnect
			this.updateStatus(InstanceStatus.Connecting)
			this.device.disconnect()
			this.device.connect(this.config.deviceaddr)
		}
		if (
			this.label !== this.oldlabel ||
			this.config.showDisabled !== oldconfig.showDisabled ||
			this.config.color_bright !== oldconfig.color_bright || 
			this.config.color_dark !== oldconfig.color_dark || 
			this.config.color_green !== oldconfig.color_green || 
			this.config.color_greendark !== oldconfig.color_greendark || 
			this.config.color_greengrey !== oldconfig.color_greengrey|| 
			this.config.color_red !== oldconfig.color_red || 
			this.config.color_reddark !== oldconfig.color_reddark || 
			this.config.color_redgrey !== oldconfig.color_redgrey|| 
			this.config.color_highlight !== oldconfig.color_highlight
			) {
				await this.updateInstance()
		}
		this.oldlabel = this.label

	}

	/**
	 * get MAC address and store it in config for WOL
	 */
	public getMACfromDevice(): void {
		const deviceMacaddr = `${this.state
			.get('DEVICE/device/system/network/adapter/pp/macAddress')
			.map((elem: number) => {
				return elem.toString(16).padStart(2,'0')
			})
			.join(':')}`
		const configMacaddr = this.config.macaddress.split(/[,:-_.\s]/).join(':')
		if (configMacaddr !== deviceMacaddr) {
			this.config.macaddress = deviceMacaddr
			this.saveConfig(this.config)
		}
	}

	/**
	 * @description sets actions, variables, presets and feedbacks available for this instance
	 */
	public async updateInstance(): Promise<void> {

		this.setFeedbackDefinitions(getFeedbacks(this, this.state))
		this.setActionDefinitions(getActions(this) as CompanionActionDefinitions)
		this.setPresetDefinitions(getPresets(this))
		this.setVariableValues({ connectionLabel: this.label })
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
		this.setVariableValues({ selectedPreset: vartext })
	}

	public sendRaw(_message: string): void {
		//void this.device.sendRawTCPmessage(message)
	}

	connectDevice(): void {
		const address = this.config.deviceaddr
		this.device.connect(address)
	}

	handleStartStopRecordActions(isRecording: boolean): void {
		this.isRecording = isRecording
	}

	/**
	 * updates the variable definitions of this instance with the values of this.variables or the optional parameter
	 * @param variables 
	 */
	public updateVariableDefinitions(variables = this.variables) {
		// make set with unique variableIds
		const varIds = new Set(variables.map(variable => variable.variableId))
		const vars: CompanionVariableDefinition[] = []
		varIds.forEach(varId => {
			vars.push(
				variables.map(vari => { return { name: vari.name, variableId: vari.variableId } }).find(vari => vari.variableId === varId) || { name: '', variableId: '' }
			)
		})
		this.setVariableDefinitions(vars)
	}

	/**
	 * Adds a custom variable to the internal list of variables from this instance  
	 * the same variableId can be added by multiple Id, it will be exposed only once and only removed when the last Id removes it
	 * @param {Object} newVariable - Object with the new variable
	 * @param {string} newVariable.id - ID of the variable, e.g. the ID of the feedback generating it, not exposed to user.
	 * @param {string} newVariable.variableId - unique to the instance ID of the variable with which the user can reference it.
	 * @param {string} newVariable.name - human readable description of the variable's content.
	 * @returns 
	 */
	public addVariable(newVariable: (CompanionVariableDefinition & { id?: string })): void {
		this.variables.push(newVariable)
		if (this.variables.some(variable => (variable.variableId === newVariable.variableId && variable.id !== newVariable.id))) { // the variable already exists from another id
			return
		} else {
			this.updateVariableDefinitions()
		}
	}

	/**
	 * Removes a custom variable from the internal list of variables from this instance
	 * @param id internal ID of the variable to remove
	 * @param remVariable variableId of the variable to remove, if undefined remove all variables from that ID
	 */
	public removeVariable(id: string, remVariable?: string): void {
		if (remVariable === undefined && this.variables.findIndex(vari => vari.id === id) != -1) {
			const newvars = this.variables.filter(vari => vari.id !== id)
			this.variables = newvars
			this.updateVariableDefinitions()
		} else if (this.variables.findIndex(vari => (vari.id === id && vari.variableId === remVariable)) != -1) {
			const newvars = this.variables.filter(vari => !(vari.id === id && vari.variableId === remVariable))
			this.variables = newvars
			this.updateVariableDefinitions()
		}
	}

	/**
	 * Adds one or more subscriptions to the active subscriptions
	 * @param {Object} subscriptions Object containing one or more subscriptions 
	 */
	public addSubscriptions(subscriptions: Record<string, Subscription>): void {
		Object.keys(subscriptions).forEach(subscription => {
			this.state.subscriptions[subscription] = subscriptions[subscription]
		})
	}

	public removeSubscription(subscriptionId: string): void {
		delete this.state.subscriptions[subscriptionId]
	}

	public timeToSeconds(timestring: string): number {
		let hours = 0
		let minutes = 0
		let seconds = 0
		let direction = 1
		let result = timestring.match(/(?:^|\D)(-?)(\d|1\d|2[0-3])\D(\d|[0-5]\d)\D(\d|[0-5]\d)(?:\D|$)/)
		if (result) {
			direction = result[1] === '-' ? -1 : 1
			hours = parseInt(result[2])
			minutes = parseInt(result[3])
			seconds = parseInt(result[4])
			return (hours * 3600 + minutes * 60 + seconds) * direction
		}
		result = timestring.match(/(?:^|\D)(-?)(\d{0,3})\D(\d|[1-5]\d)(?:\D|$)/)
		if (result) {
			direction = result[1] === '-' ? -1 : 1
			minutes = parseInt(result[2])
			seconds = parseInt(result[3])
			return (hours * 3600 + minutes * 60 + seconds) * direction
		}
		result = timestring.match(/(?:^|\D)(-?)(\d{0,5})(?:\D|$)/)
		if (result) {
			direction = result[1] === '-' ? -1 : 1
			seconds = parseInt(result[2])
			return (hours * 3600 + minutes * 60 + seconds) * direction
		}
		return 0
	}

	public deciSceondsToString(time: number): string {
		return (
			Math.floor(time / 600)
				.toString()
				.padStart(2, '0') +
			':' +
			((time % 600) / 10).toFixed(2).padStart(5, '0')
		)
	}

	/**
	 * Switches sync on or off
	 * @param action 0: switch off, 1: switch on, 2: toggle, 3: resend local sync state
	 */
	public switchSync(action: number): void {
		const clients = this.state.getUnmapped('REMOTE/system/network/websocketServer/clients')
		let syncstate: boolean
		const myid: string = this.state.getUnmapped('LOCAL/socketId')
		const myindex = clients.findIndex((elem: Record<string, unknown>) => {
			if (elem.id === myid) {
				return true
			} else {
				return false
			}
		})
		switch (action) {
			case 0:
				syncstate = false
				break
			case 1:
				syncstate = true
				break
			case 2:
				if (this.state.getUnmapped(`REMOTE/system/network/websocketServer/clients/${myindex}/isRemoteSelectionEnabled`)) {
					syncstate = false
				} else {
					syncstate = true
				}
				break
			case 3:
				if (this.state.syncSelection) {
					syncstate = true
				} else {
					syncstate = false
				}
				break
			default:
				syncstate = false
				break
		}
		this.state.setUnmapped('LOCAL/syncSelection', syncstate)
		this.device.sendRawWSmessage(
			`{"channel":"REMOTE","data":{"name":"enableRemoteSelection","path":"/system/network/websocketServer/clients/${myindex}","args":[${syncstate}]}}`
		)
	}

	/**
	 * AWJ paths have some differences to JSON paths and the internal object, this function converts AWJ to JSON path.
	 * Additionally it converts PGM and PVW to the actual preset which is on program or preview (A or B)
	 * @param awjPath the AWJ path as a string
	 * @returns an array containing the path components of a JSON path
	 */
	AWJtoJsonPath(awjPath: string): string[] {
		if (awjPath.match(new RegExp(regexAWJpath)) === null) {
			return []
		}
		const parts = awjPath.split('/')
		for (let i = 0; i < parts.length; i += 1) {
			parts[i] = parts[i].replace(/^\$(\w+)/, '$1List')
			parts[i] = parts[i].replace(/^@props$/, 'pp')
			parts[i] = parts[i].replace(/^@items$/, 'items')
			parts[i] = parts[i].replace(/^DeviceObject$/, 'device')
		}
		if (
			parts[1] === 'screenList' &&
			parts[2] === 'items' &&
			parts[4] === 'presetList' &&
			parts[5] === 'items' &&
			parts[6].toLowerCase() === 'pgm'
		) {
			if (this.state.get(`LOCAL/screens/S${parts[3].replace(/\D/g, '')}/pgm/preset`)) {
				parts[6] = this.state.get(`LOCAL/screens/S${parts[3].replace(/\D/g, '')}/pgm/preset`)
				if (this.state.platform === 'midra') parts[6] = parts[6].replace('A', 'DOWN').replace('B', 'UP')
			}
		} else if (
			parts[1] === 'screenList' &&
			parts[2] === 'items' &&
			parts[4] === 'presetList' &&
			parts[5] === 'items' &&
			parts[6].toLowerCase() === 'pvw'
		) {
			if (this.state.get(`LOCAL/screens/S${parts[3].replace(/\D/g, '')}/pvw/preset`)) {
				parts[6] = this.state.get(`LOCAL/screens/S${parts[3].replace(/\D/g, '')}/pvw/preset`)
				if (this.state.platform === 'midra') parts[6] = parts[6].replace('A', 'DOWN').replace('B', 'UP')
			}
		} else if (
			parts[1] === 'auxiliaryScreenList' &&
			parts[2] === 'items' &&
			parts[4] === 'presetList' &&
			parts[5] === 'items' &&
			parts[6].toLowerCase() === 'pgm'
		) {
			if (this.state.get(`LOCAL/screens/A${parts[3].replace(/\D/g, '')}/pgm/preset`)) {
				parts[6] = this.state.get(`LOCAL/screens/A${parts[3].replace(/\D/g, '')}/pgm/preset`)
				if (this.state.platform === 'midra') parts[6] = parts[6].replace('A', 'DOWN').replace('B', 'UP')
			}
		} else if (
			parts[1] === 'auxiliaryScreenList' &&
			parts[2] === 'items' &&
			parts[4] === 'presetList' &&
			parts[5] === 'items' &&
			parts[6].toLowerCase() === 'pvw'
		) {
			if (this.state.get(`LOCAL/screens/A${parts[3].replace(/\D/g, '')}/pvw/preset`)) {
				parts[6] = this.state.get(`LOCAL/screens/A${parts[3].replace(/\D/g, '')}/pvw/preset`)
				if (this.state.platform === 'midra') parts[6] = parts[6].replace('A', 'DOWN').replace('B', 'UP')
			}
		}
		return parts
	}

	/**
	 * AWJ paths have some differences to JSON paths and the internal object, this function converts JSON to AWJ path.
	 * Additionally it converts A and B presets to pgm or pvw (program or preview)
	 * @param jsonPath the json path
	 * @returns a string with the AWJ path
	 */
	jsonToAWJpath(jsonPath: string | string[]): string {
		let tpath: string
		if (Array.isArray(jsonPath)) {
			tpath = jsonPath.join('/')
		} else {
			tpath = jsonPath
		}
		tpath = tpath.replace(/\/(\w+)List\/items\//g, '/$$$1/@items/')
		tpath = tpath.replace(/\/pp\//g, '/@props/')
		tpath = tpath.replace(/^device\//, 'DeviceObject/')
		const apath = tpath.split('/')
		if (apath[1] === '$screen' && apath[2] === '@items' && apath[4] === '$preset' && apath[5] === '@items') {
			if (this.state.get(`LOCAL/screens/${apath[3]}/pgm/preset`) === apath[6]) {
				apath[6] = 'pgm'
			} else {
				apath[6] = 'pvw'
			}
		}
		return apath.join('/')
	}
}

runEntrypoint(AWJinstance, UpgradeScripts)
