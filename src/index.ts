import {
	combineRgb,
	CompanionVariableDefinition,
	InstanceBase,
	InstanceStatus,
	runEntrypoint,
	SomeCompanionConfigField,
} from '@companion-module/base'
import { AWJconnection } from './connection.js'
import { AWJdevice } from './awjdevice/awjdevice.js'
import { Config, GetConfigFields } from './config.js'
import { initVariables } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { StateMachine } from './state.js'
import Constants from './awjdevice/constants.js'
import Choices from './awjdevice/choices.js'
import Actions from './awjdevice/actions.js'
import Feedbacks from './awjdevice/feedback.js'
import Presets from './awjdevice/presets.js'
import Subscriptions from './awjdevice/subscriptions.js'

export const regexAWJpath = '^DeviceObject(?:\\/(@items|@props|\\$?[A-Za-z0-9_-]+))+$'

/**
 * This the general setup of this module:
 * 1. When module is instanciated, init is called
 * 2. in init an AWJconnection is created and AWJconnection.connect is called
 * 3. AWJconnection tries to connect to webserver and if it succeeds it calls AWJinstance.createDevice  
 *    the created device will hold the internal state and has all the methods to manipulate the state, get the right data out of state and to provide actions, feedbacks and so on
 * 4. AWJconnection opens the websocket connection to the webserver and hooks all incoming messges to be applied to the internal state
 * 5. AWJconnection downloads the state object from the API and calls AWJinstance.handleApiStateResponse with it
 * 6. handleApiStateResponse will call initSubscriptions, which sets up a lot of feedbacks, choices, variables, presets...
 * Done
 * 
 * This module uses several classes:
 * @class AWJinstance - the Companion class for the module instance derived from InstanceBase
 * @class AWJconnection - methods for connecting to an AWJ device with REST and websocket
 * @class AWJState - methods of holding and manipulating state
 * @class AWJdevice - actually doing all the stuff needed for Companion, derived from State
 * @class AWJLivePremier - derived from AWJdevice, overriding some stuff for LivePremier devices up to v3
 * @class AWJLivePremier4 - derived from AWJdevice, overriding some stuff for LivePremier devices with v4
 * @class AWJMidra - derived from AWJdevice, overriding some stuff for Midra and Alta devices
 */

/**
 * Companion instance class for the Analog Way AWJ API products.
 */
export class AWJinstance extends InstanceBase<Config> {
	/**
	 * Create an instance of an AWJ module.
	 */
	public state: StateMachine

	/** holds all constants for this particular type of device */
    constants: typeof Constants

    /** reference to the connection with the device */
    public connection: AWJconnection

    /** generates lists and choices from current state */
    public choices: Choices

    /** holds action definitions */
    private actions: Actions

    /** holds feedback definitions */
    private feedbacks: Feedbacks

    /** holds preset definitions */
    private presets: Presets

    /** holds subscription definitions and checks incoming data against them */
    public subscriptions: Subscriptions

	/** @deprecated device class */
	public device: AWJdevice
	
	/** variables storage */
	private variables!: (CompanionVariableDefinition & { id?: string })[]
	
	/** the instance configuration */
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
		this.updateStatus(InstanceStatus.Disconnected)

		this.config = config
		this.oldlabel = this.label
		this.variables = []
		this.state = new StateMachine(this)
		this.connection = new AWJconnection(this)

		this.setDevice('awjdevice') // initialize all Companion Bits with the generic AWJ device, while it is still unclear which device we'll connect to

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

		this.variables = initVariables(this)
		this.updateVariableDefinitions(this.variables)
		this.setVariableValues({connectionLabel: this.label})

		this.connection.connect(this.config.deviceaddr)
		//this.device = new AWJdevice(this.state, this.connection)



		// void this.updateInstance()
	}

	/**
	 * Sets all the device dependent members to match the real device.  
	 * @param platform name of the platform or generic awjdevice if no match
	 */
	setDevice(platform: string): void {
		if (platform !== this.state.platform) {
			this.state.platform = platform
			switch (platform) {
				case 'livepremier':
					this.constants = Constants // instanciate first because other classes may need the constants
					this.choices = new Choices(this) // instanciate second because actions/feedbacks need choices
					this.actions = new Actions(this)
					this.feedbacks = new Feedbacks(this)
					this.presets = new Presets(this)
					this.subscriptions = new Subscriptions(this)
					break

				case 'livepremier4':

					break

				case 'midra':

					break
			
				default:
					this.constants = Constants // instanciate first because other classes may need the constants
					this.choices = new Choices(this) // instanciate second because actions/feedbacks need choices
					this.actions = new Actions(this)
					this.feedbacks = new Feedbacks(this)
					this.presets = new Presets(this)
					this.subscriptions = new Subscriptions(this)
					break
			}
		}
	}

	/**
	 * Clean up the instance before it is destroyed.
	 */
	public async destroy(): Promise<void> {
		this.state.clearTimers()
		this.connection.destroy()

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

		if (this.config.deviceaddr !== oldconfig.deviceaddr) {
			// new address, reconnect
			this.updateStatus(InstanceStatus.Connecting)
			this.connection.disconnect()
			this.connection.connect(this.config.deviceaddr)
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
	 * @description sets actions, variables, presets and feedbacks available for this instance
	 */
	public async updateInstance(): Promise<void> {

		this.setFeedbackDefinitions(this.feedbacks.allFeedbacks)
		this.setActionDefinitions(this.actions.allActions)
		this.setPresetDefinitions(this.presets.allPresets)
		this.setVariableValues({ connectionLabel: this.label })
		this.subscribeFeedbacks()
		
		let preset: string,
				vartext = 'PGM'
		if (this.state.syncSelection) {
			preset = this.state.getUnmapped('REMOTE/live/screens/presetModeSelection/presetMode')
		} else {
			preset = this.state.getUnmapped('LOCAL/presetMode')
		}
		if (preset === 'PREVIEW') {
			vartext = 'PVW'
		}
		this.setVariableValues({ selectedPreset: vartext })
	}

	connectDevice(): void {
		const address = this.config.deviceaddr
		this.connection.connect(address)
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
		// this.log('debug', 'REMOTE ' + JSON.stringify(this.device.getUnmapped('REMOTE')))
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
		this.connection.sendRawWSmessage(
			`{"channel":"REMOTE","data":{"name":"enableRemoteSelection","path":"/system/network/websocketServer/clients/${myindex}","args":[${syncstate}]}}`
		)
	}

	/**
	 * Sends a global update command
	 * @param platform 
	 */
	sendXupdate(): void {
        this.connection.sendRawWSmessage(`{"channel":"DEVICE","data":{"path":[${this.constants.xUpdatePath}],"value":false}}`)
        this.connection.sendRawWSmessage(`{"channel":"DEVICE","data":{"path":[${this.constants.xUpdatePath}],"value":true}}`)
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
