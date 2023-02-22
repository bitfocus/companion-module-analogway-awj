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
		this.setFeedbackDefinitions(getFeedbacks(this, this.state)) 
		this.variables = initVariables(this)
		this.setVariableDefinitions(this.variables)
		this.setVariableValues({connectionLabel: this.label})
		this.subscribeFeedbacks()
		this.device.connect(this.config.deviceaddr)

		// void this.updateInstance()
	}

	/**
	 * Clean up the instance before it is destroyed.
	 */
	public async destroy(): Promise<void> {
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

		if (this.config.deviceaddr !== oldconfig.deviceaddr) {
			// new address, reconnect
			this.updateStatus(InstanceStatus.Connecting)
			this.device.disconnect()
			this.device.connect(this.config.deviceaddr)
		}
		if (
			this.label !== this.oldlabel ||
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
		this.setVariableValues({connectionLabel: this.label})
	}

	public sendRaw(_message: string): void {
		//void this.device.sendRawTCPmessage(message)
	}

	connectDevice(): void {
		const address = this.config.deviceaddr
		this.device.connect(address)
	}

	public addVariable(newVariable: (CompanionVariableDefinition & { id?: string })): void {
		this.variables.push(newVariable)
		if (this.variables.some(variable => (variable.variableId === newVariable.variableId && variable.id !== newVariable.id))) { // the variable already exists from another id
			return
		} else {
			const varnames = new Set(this.variables.map(variable => variable.variableId))
			const vars: CompanionVariableDefinition[] = []
			varnames.forEach(varname => {
				vars.push(
					this.variables.map(vari => { return { name: vari.name, variableId: vari.variableId } }).find(vari => vari.variableId === varname) || { name: '', variableId: '' }
				)
			})
			this.setVariableDefinitions(this.variables)
		}
	}

	public removeVariable(id: string, remVariable: string): void {
		if (this.variables.filter(vari => vari.variableId === remVariable).length > 1 && this.variables.findIndex(vari => vari.variableId === remVariable && vari.id === id) != -1) {
			this.variables.splice(this.variables.findIndex(vari => vari.variableId === remVariable && vari.id === id), 1)
		} else if (this.variables.filter(vari => vari.variableId === remVariable).length === 1 && this.variables.findIndex(vari => vari.variableId === remVariable && vari.id === id) != -1) {
			this.variables.splice(this.variables.findIndex(vari => vari.variableId === remVariable && vari.id === id), 1)
			const varnames = new Set(this.variables.map(variable => variable.variableId))
			const vars: CompanionVariableDefinition[] = []
			varnames.forEach(varname => {
				vars.push(
					this.variables.map(vari => { return { name: vari.name, variableId: vari.variableId } }).find(vari => vari.variableId === varname) || { name: '', variableId: '' }
				)
			})
			this.setVariableDefinitions(this.variables)
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
}

runEntrypoint(AWJinstance, [])
