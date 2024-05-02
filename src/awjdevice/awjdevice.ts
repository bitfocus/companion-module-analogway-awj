import { AWJinstance } from ".."
import { AWJconnection } from "../connection"
import { getActions } from "./actions.js"
import { getFeedbacks } from "./feedback.js"
import { getPresets } from "./presets.js"
import { StateMachine } from "../state.js"

/**
 * This is the base class for providing action-, feedback- and preset-definitions, subscriptions for an AWJ device.
 * All device dependent methods are defined here.  
 * Several classes derive from this:
 * @class LivePremier
 * @class LivePremier4
 * @class Midra
 */
class AWJdevice extends StateMachine{
    instance: AWJinstance
    connection: AWJconnection

    constructor(instance: AWJinstance, initialState?: {[name: string]: any}) {
        super(instance, initialState)
        this.instance = instance
        this.connection = this.instance.connection

        this.init()
    }

    /**
     * setup some initial data
     */
    init() {
        this.setUnmapped('LOCAL/config', this.instance.config)
        this.setUnmapped('LOCAL/platform', 'genericAWJ')
    }

    /**
     * Returns the action definitions for this device
     * @param instance 
     * @returns 
     */
    getActionDefinitions(instance: AWJinstance) {
        return getActions(instance)
    }

    /**
     * Returns the feedback definitions for this device
     * @param instance 
     * @returns 
     */
    getFeedbackDefinitions(instance: AWJinstance) {
        return getFeedbacks(instance)
    }

    /**
     * Returns the feedback definitions for this device
     * @param instance 
     * @returns 
     */
    getPresetDefinitions(instance: AWJinstance) {
        return getPresets(instance)
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
	 * get MAC address for WOL
	 */
	public getMACfromDevice(): string {
		return this
			.get('DEVICE/device/system/network/adapter/pp/macAddress')
			.map((elem: number) => {
				return elem.toString(16).padStart(2,'0')
			})
			.join(':') ?? ''
	}

    /**
	 * Sends a global update command
	 * @param platform 
	 */
	sendXupdate(platform?: string): void {
		if (!platform) platform = this.platform
		const updates: Record<string, string> = {
			livepremier: '{"channel":"DEVICE","data":{"path":["device","screenGroupList","control","pp","xUpdate"],"value":',
            livepremier4: '{"channel":"DEVICE","data":{"path":["device","screenGroupList","control","pp","xUpdate"],"value":',
			midra: '{"channel":"DEVICE","data":{"path":["device","preset","control","pp","xUpdate"],"value":'
		}
		const xUpdate = updates[platform]
		if (xUpdate) {
			this.connection.sendRawWSmessage(xUpdate + 'false}}')
			this.connection.sendRawWSmessage(xUpdate + 'true}}')
		}

	}

    public get maxScreens() : number {
        return 24
    }
    public get maxAuxScreens() : number {
        return 96
    }
    public get maxInputs() : number {
        return 256
    }

}

export { AWJdevice }