import instance_skel = require('../../../instance_skel')
import {
	CompanionActions,
	CompanionConfigField,
	CompanionSystem,
} from '../../../instance_skel_types'
import { getActions } from './actions'
import { Config, GetConfigFields } from './config'
import { AWJdevice } from './connection'
import { State } from './state'
import { getFeedbacks } from './feedback'
import { getPresets } from './presets'
import {
	initVariables,
} from './variables'


/**
 * Companion instance class for the Analog Way AWJ API products.
 */
class AWJinstance extends instance_skel<Config> {
	//class AWJinstance extends AWJinst<Config> {
	/**
	 * Create an instance of an AWJ module.
	 */
	public state: State
	public device: AWJdevice

	constructor(system: CompanionSystem, id: string, config: Config) {
		super(system, id, config)
		this.system = system
		this.config = config
		this.state = new State(this)
		this.device = new AWJdevice(this, system)
	}

	/**
	 * Main initialization function called once the module
	 * is OK to start doing things.
	 */
	public init(): void {
		this.status(this.STATUS_UNKNOWN)
		if (this.config.deviceaddr === undefined) {
			// config never been set?
			console.log('brand new config')
			this.config.deviceaddr = 'http://192.168.2.140'
			this.config.macaddress = ''
			this.config.sync = true
			this.config.color_bright = 16777215
			this.config.color_dark = 2239025
			this.config.color_highlight = 2196944
			this.config.color_green = 56339
			this.config.color_greendark = 40971
			this.config.color_greengrey = 4609352
			this.config.color_red = 16733974
			this.config.color_reddark = 14155776
			this.config.color_redgrey = 5588550
			this.saveConfig()
		}
			this.device.connect(this.config.deviceaddr)

		// void this.updateInstance()
	}

	/**
	 * Clean up the instance before it is destroyed.
	 */
	public destroy(): void {
		this.device.destroy()

		this.debug('destroy', this.id)
	}

	/**
	 * Creates the configuration fields for instance config.
	 */
	public config_fields(): CompanionConfigField[] {
		return GetConfigFields(this)
	}

	/**
	 * Process an updated configuration array.
	 */
	public updateConfig(config: Config): void {
		const oldconfig = { config: { ...this.config }, label: this.label }
		this.config = config

		if (this.config.deviceaddr !== oldconfig.config.deviceaddr) {
			// new address, reconnect
			this.status(this.STATUS_UNKNOWN)
			this.device.disconnect()
			this.device.connect(this.config.deviceaddr)
		} else if (
			this.label !== oldconfig.label ||
			this.config.color_bright !== oldconfig.config.color_bright || 
			this.config.color_dark !== oldconfig.config.color_dark || 
			this.config.color_green !== oldconfig.config.color_green || 
			this.config.color_greendark !== oldconfig.config.color_greendark || 
			this.config.color_greengrey !== oldconfig.config.color_greengrey|| 
			this.config.color_red !== oldconfig.config.color_red || 
			this.config.color_reddark !== oldconfig.config.color_reddark || 
			this.config.color_redgrey !== oldconfig.config.color_redgrey|| 
			this.config.color_highlight !== oldconfig.config.color_highlight
			) {
				void this.updateInstance()
		} 
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
			this.saveConfig()
		}
	}

	/**
	 * @description sets actions, variables, presets and feedbacks available for this instance
	 */
	public async updateInstance(): Promise<void> {
		this.setActions(getActions(this) as CompanionActions)
		initVariables(this)

		this.setFeedbackDefinitions(getFeedbacks(this, this.state))

		this.setPresetDefinitions(getPresets(this))
	}

	public sendRaw(message: string): void {
		void this.device.sendRawTCPmessage(message)
	}

	connectDevice(): void {
		const address = this.config.deviceaddr
		this.device.connect(address)
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

export = AWJinstance
