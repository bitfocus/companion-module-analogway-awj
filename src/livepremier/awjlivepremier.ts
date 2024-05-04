import { AWJinstance } from "../index.js"
import { AWJdevice } from "../awjdevice/awjdevice.js"
import { commonSubscriptions } from "../awjdevice/subscriptions.js"
import { livepremierSubscriptions } from './livepremierSubscriptions.js'
import { getActions as getCommonActions} from "../awjdevice/actions.js"
import { getActions as getLivepremierActions } from "./livepremierActions.js"

/**
 * This is the class for providing action-, feedback- and preset-definitions, subscriptions for an LivePremier device up to fw version 3.
 * Most methods and fields are inherited from the parent class.  
 */
class AWJLivePremier extends AWJdevice{

    constructor(instance: AWJinstance, initialState?: {[name: string]: any}) {
        super(instance, initialState)
        this.instance = instance

        this.init()
    }

    /**
     * setup some initial data
     */
    override init() {
        this.setUnmapped('LOCAL/config', this.instance.config)
        this.setUnmapped('LOCAL/platform', 'livepremier')
    }

    /**
     * Returns the action definitions for this device
     * @param instance 
     * @returns action definitions
     */
    override getActionDefinitions(instance: AWJinstance) {
        return {
            ...getCommonActions(instance),
            ...getLivepremierActions(instance)
        } 
    }

    /**
     * Sets the subscriptions object to combination of the common subscriptions and the platform specific ones
     */
    override initSubscriptions() {
        this.subscriptions = { ...commonSubscriptions, ...livepremierSubscriptions}
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

export { AWJLivePremier }