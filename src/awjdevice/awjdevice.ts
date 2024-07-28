import { AWJinstance } from ".."
import { AWJconnection } from "../connection"
import Actions from "./actions.js"
import Feedbacks from "./feedback.js"
import Presets from "./presets.js"
import { StateMachine } from "../state.js"
import Subscriptions from "./subscriptions.js"
import Choices from "./choices.js"
import { Subscription } from "../../types/Subscription.js"
import Constants from "./constants.js"

/**
 * This is the base class for providing action-, feedback- and preset-definitions, subscriptions for an AWJ device.
 * All device dependent methods are defined here.  
 * Several classes derive from this:
 * @class LivePremier
 * @class LivePremier4
 * @class Midra
 */
class AWJdevice extends StateMachine{

    /** reference to the instance itself, which is the root class and handles all Companion interfacing */
    instance: AWJinstance

    /** holds all constants for this particular type of device */
    constants!: typeof Constants

    /** reference to the connection with the device */
    connection!: AWJconnection

    /** generates lists and choices from current state */
    choices!: Choices

    /** holds action definitions */
    private actions!: Actions

    /** holds feedback definitions */
    private feedbacks!: Feedbacks

    /** holds preset definitions */
    private presets!: Presets

    /** holds subscription definitions and checks incoming data against them */
    subscriptions!: Subscriptions

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
        this.constants = Constants // instanciate first because other classes may need the constants
        this.choices = new Choices(this.instance) // instanciate second because actions/feedbacks need choices
        this.actions = new Actions(this.instance)
        this.feedbacks = new Feedbacks(this.instance)
        this.presets = new Presets(this.instance)
        this.subscriptions = new Subscriptions(this.instance)

        this.set('LOCAL/config', this.instance.config)
        this.set('LOCAL/platform', 'genericAWJ')
    }

    /**
     * Returns the action definitions for this device
     * @returns action definitions
     */
    get actionDefinitions() {   
        return this.actions.allActions
    }

    /**
     * Returns the feedback definitions for this device
     * @returns feedback definitions
     */
    get feedbackDefinitions() {
        return this.feedbacks.allFeedbacks
    }

    /**
     * Returns the feedback definitions for this device
     * @returns preset definitions
     */
    get presetDefinitions() {
        return this.presets.allPresets
    }

    /**
	 * Adds one or more subscriptions to the active subscriptions
	 * @param subscriptions Object containing one or more subscriptions 
	 */
	public addSubscriptions(subscriptions: Record<string, Subscription>): void {
        this.subscriptions.addSubscriptions(subscriptions)
	}

	/**
	 * Removes the subscription with the given ID  from the active subscriptions
	 * @param subscriptionId ID of the subscription to remove
	 */
	public removeSubscription(subscriptionId: string): void {
		this.subscriptions.removeSubscription(subscriptionId)
	}

    /**
	 * get MAC address for WOL
	 */
	public getMACfromDevice(): string {
		return this
			.get(this.constants.macAddressPath)
			.map((elem: number) => {
				return elem.toString(16).padStart(2,'0')
			})
			.join(':') ?? ''
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
     * Init all the subscriptions.  
     */
    initSubscriptions() {
        this.subscriptions.initSubscriptions()
    }

}

export { AWJdevice }