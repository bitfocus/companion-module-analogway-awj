import { AWJinstance } from "../index.js"
import { AWJdevice } from "../awjdevice/awjdevice.js"
import { livepremierSubscriptions } from './livepremierSubscriptions.js'
import actions from "../awjdevice/actions.js"
import { getActions as getLivepremierActions } from "./livepremierActions.js"
import { getFeedbacks as getLivepremierFeedbacks } from "./livepremierFeedback.js"

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
    getActionDefinitions(instance: AWJinstance) {
        return {} 
    }

    /**
     * Returns the feedback definitions for this device
     * @param instance 
     * @returns 
     */
    getFeedbackDefinitions(instance: AWJinstance) {
        return getLivepremierFeedbacks(instance)
    }

}

export { AWJLivePremier }