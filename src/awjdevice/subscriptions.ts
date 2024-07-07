import {AWJinstance} from '../index.js'
import { Subscription } from '../../types/Subscription.js'
import { InstanceStatus } from '@companion-module/base'
import Constants from './constants.js'

/**
 * Class for managing and checking of the subscriptions.
 * A subscription is data of the device associated with a json path in the device model which we are interested in and need to react on changes.
 */
export default class Subscriptions {
	instance: AWJinstance
	subscriptions: Record<string, Subscription>
	constants: typeof Constants

	/**
	 * This member denotes the names of the subscriptions which are to be checked.
	 * May be overridden in child classes.
	 */
	readonly subscriptionsToUse: string[] = [
		// ******** Common ********
		'syncselection',
		// 'liveselection',
		// 'layerselection',
		// 'widgetSelection',
		// 'screenLock',
		// 'sourceVisibility',
		// 'selectedPreset',
		// 'inputFreeze',
		// 'timerState',
		// 'gpioOut',
		// 'gpioIn',
		// 'screenTransitionTime',
		// 'screenMemoryLabel',
		// 'masterMemory',
		// 'masterMemoryLabel',
		// 'multiviewerMemoryLabel',
		// 'layerMemoryLabel',
		// 'stillLabel',
		// 'stillValid',
		// 'screenLabel',
		// 'auxscreenLabel',
		// 'screenEnabled',
		// 'liveInputsChange',
		// 'masterMemoriesChange',
		// 'screenMemoriesChange',
		// 'layerMemoriesChange',
		// 'multiviewerMemoriesChange',
		// 'layerCountChange',
		// 'memoryColorChange',
		// ******** LivePremier ********
		// 'presetToggle',
		// 'screenPreset',
		// 'screenMemoryChange',
		// 'screenMemoryModifiedChange',
		// 'screenTransitionTime',
		// 'screenMemoryLabel',
		// 'inputLabel',
		// 'shutdown',
		// ******** Midra ********
		// 'presetToggle',
		// 'screenPreset',
		// 'backgroundSet',
		// 'screenMemoryChange',
		// 'screenMemoryLabel',
		// 'screenMemoryModifiedChange',
		// 'auxMemoryLabel',
		// 'plugChange',
		// 'inputLabel',
		// 'auxMemoriesChange',
		// 'liveLayerFreeze',
		// 'backgroundLayerFreeze',
		// 'screenFreeze',
		// 'streamStatus',
		// 'standby',
		// 'shutdown',
	]

	constructor(instance: AWJinstance) {
		this.instance = instance
		this.constants = this.instance.constants

		this.subscriptions = Object.fromEntries(
            this.subscriptionsToUse.map((key) => [key, this[key]])
        )
	}

	/**
	 * The names of the currently active subscriptions
	 */
	get subscriptionList() {
		return Object.keys(this.subscriptions)
	}

	/**
	 * Adds one or more subscriptions to the active subscriptions
	 * @param subscriptions Object containing one or more subscriptions 
	 */
	public addSubscriptions(subscriptions: Record<string, Subscription>): void {
		Object.keys(subscriptions).forEach(subscription => {
			this.subscriptions[subscription] = subscriptions[subscription]
		})
	}

	/**
	 * Removes the subscription with the given ID  from the active subscriptions
	 * @param subscriptionId ID of the subscription to remove
	 */
	public removeSubscription(subscriptionId: string): void {
		if (this.subscriptions[subscriptionId]) delete this.subscriptions[subscriptionId]
	}

	/**
	 * Get a specific subscription definition
	 * @param subscription 
	 * @returns 
	 */
	subscription(subscription: string) {
		return this.subscriptions[subscription]
	}

	// export const commonSubscriptions: Record<string, Subscription> = {
	get syncselection():Subscription {
		return {
			pat: this.constants.subSyncselectionPat,
			fbk: 'syncselection',
		}
	}

	get liveselection():Subscription {
		return {
			pat: 'live/screens/screenAuxSelection',
			fbk: 'liveScreenSelection',
		}
	}

	get layerselection():Subscription {
		return {
			pat: 'live/screens/layerSelection/layerIds',
			fbk: 'remoteLayerSelection',
		}
	}

	get widgetSelection():Subscription {
		return {
			pat: 'live/multiviewers?/widgetSelection',
			fbk: 'remoteWidgetSelection',
		}
	}

	get screenLock():Subscription {
		return {
			pat: 'live/screens/presetModeLock/PR',
			fbk: 'liveScreenLock',
		}
	}

	get sourceVisibility():Subscription {
		return {
			pat: 'device/(auxiliaryScreen|screen|auxiliary)List/items/(S|A)?(\\d{1,3})/presetList/items/(\\w+)/l(iveL)?ayerList/items/(\\d{1,3}|NATIVE)/(source|position|opacity|cropping)',
			fbk: 'deviceSourceTally',
		}
	}

	get selectedPreset():Subscription {
		return {
			pat: '/live/screens/presetModeSelection/presetMode',
			fbk: ['livePresetSelection', 'remoteLayerSelection'],
			fun: (path, _value) => {
				if (this.instance.state.syncSelection) {
					this.instance.setVariableValues({
						selectedPreset: this.instance.state.getUnmapped(path) === 'PREVIEW' ? 'PVW' : 'PGM'
					})
				}
				return false
			},
		}
	}

	get inputFreeze():Subscription {
		return {
			pat: 'device/inputList/items/(\\w+?)/control/pp/freeze',
			fbk: 'deviceInputFreeze',
		}
	}

	get timerState():Subscription {
		return {
			pat: 'DEVICE/device/timerList/items/TIMER_(\\d)/status/pp/state',
			fbk: 'timerState',
			ini: ['1', '2', '3', '4'],
			fun: (path, _value) => {
				if (!path) return false
				const timer = path.toString().match(/(?<=TIMER_)(\d)\//) || ['0']
				this.instance.setVariableValues({['timer' + timer[0] + '_status']:  this.instance.state.getUnmapped(path)})
				return false
			},
		}
	}

	get screenMemoryLabel():Subscription {
		return {
			pat: 'DEVICE/device/presetBank/bankList/items/(\\d{1,4})/control/pp/label',
			ini: Array.from({ length: this.constants.maxScreenMemories }, (_, i) => (i + 1).toString()),
			fun: (path, _value) => {
				if (!path) return false
				const memory = Array.isArray(path) ? path[5] : path.split('/')[5]
				const label = memory.toString() !== '0' ? this.instance.state.get(path) : ''
				const screens = this.instance.choices.getChosenScreenAuxes('all')

				this.instance.setVariableValues({['screenMemory' + memory + 'label']:  label})
				
				for (const screen of screens) {
					const pgmmem = this.instance.state.getUnmapped([
						'DEVICE',
						'device',
						'screenList', 'items', screen,
						'presetList', 'items', this.instance.state.getUnmapped('LOCAL/screens/' + screen + '/pgm/preset'),
						'presetId','status','pp','id'
					])
					if (memory == pgmmem) {
						this.instance.setVariableValues({['screen' + screen + 'memoryLabelPGM']:  label})
					}
					const pvwmem = this.instance.state.getUnmapped([
						'DEVICE',
						'device',
						'screenList', 'items', screen,
						'presetList', 'items', this.instance.state.getUnmapped('LOCAL/screens/' + screen + '/pvw/preset'),
						'presetId','status','pp','id'
					])
					if (memory == pvwmem) {
						this.instance.setVariableValues({['screen' + screen + 'memoryLabelPVW']:  label})
					}
				}
				return true
			},
		}
	}

	get masterMemory():Subscription {
		return {
			pat: 'DEVICE/device/masterPresetBank/status/lastUsed/presetModeList/items/(PROGRAM|PREVIEW)/pp/memoryId',
			ini: ['PROGRAM', 'PREVIEW'],
			fbk: 'deviceMasterMemory',
		}
	}

	get masterMemoryLabel():Subscription {
		return {
			pat: 'DEVICE/device/masterPresetBank/bankList/items/(\\d+)/control/pp/label',
			ini: Array.from({ length: 499 }, (_, i) => (i + 1).toString()),
			fun: (path, _value) => {
				if (!path) return false
				const memory = Array.isArray(path) ? path[5] : path.split('/')[5]
				this.instance.setVariableValues({['masterMemory' + memory + 'label']:  this.instance.state.getUnmapped(path)})
				return true
			},
		}
	}

	get multiviewerMemoryLabel():Subscription {
		return {
			pat: 'DEVICE/device/monitoringBank/bankList/items/(\\d+)/control/pp/label',
			ini: Array.from({ length: 49 }, (_, i) => (i + 1).toString()),
			fun: (path, _value) => {
				if (!path) return false
				const memory = Array.isArray(path) ? path[5] : path.split('/')[5]
				this.instance.setVariableValues({['multiviewerMemory' + memory + 'label']:  this.instance.state.getUnmapped(path)})
				return true
			},
		}
	}

	get layerMemoryLabel():Subscription {
		return {
			pat: 'DEVICE/device/layerBank/bankList/items/(\\d+)/control/pp/label',
			ini: Array.from({ length: 49 }, (_, i) => (i + 1).toString()),
			fun: (path, _value) => {
				if (!path) return false
				const memory = Array.isArray(path) ? path[5] : path.split('/')[5]
				this.instance.setVariableValues({['layerMemory' + memory + 'label']:  this.instance.state.getUnmapped(path)})
				return true
			},
		}
	}

	get stillLabel():Subscription {
		return {
			pat: 'DEVICE/device/stillList/items/(\\d+)/control/pp/label',
			ini: Array.from({ length: this.constants.maxStills }, (_, i) => (i + 1).toString()),
			fun: (path, _value) => {
				if (!path) return false
				const input = Array.isArray(path) ? path[4] : path.split('/')[4]
				this.instance.setVariableValues({['STILL_' + input + 'label']:  this.instance.state.getUnmapped(path)})
				return true
			},
		}
	}

	get stillValid():Subscription {
		return {
			pat: 'DEVICE/device/stillList/items/(\\d+)/status/pp/isValid',
			fun: (_path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
				return true
			},
		}
	}

	get screenLabel():Subscription {
		return {
			pat: 'DEVICE/device/screenList/items/S(\\d{1,2})/control/pp/label',
			ini: Array.from({ length: this.constants.maxScreens }, (_, i) => (i + 1).toString()),
			fun: (path, _value) => {
				if (!path) return false
				const input = Array.isArray(path) ? path[4] : path.split('/')[4]
				this.instance.setVariableValues({[input.replace('S', 'SCREEN_') + 'label']:  this.instance.state.get(path)})
				this.instance.setVariableValues({['screen' + input + 'label']:  this.instance.state.get(path)})
				return true
			},
		}
	}

	get auxscreenLabel():Subscription {
		return {
			pat: 'DEVICE/device/screenList/items/A(\\d{1,2})/control/pp/label',
			ini: Array.from({ length: this.constants.maxAuxScreens }, (_, i) => (i + 1).toString()),
			fun: (path, _value) => {
				if (!path) return false
				const input = Array.isArray(path) ? path[4] : path.split('/')[4]
				this.instance.setVariableValues({[input.replace('A', 'AUXSCREEN_') + 'label']:  this.instance.state.get(path)})
				this.instance.setVariableValues({['screen' + input + 'label']:  this.instance.state.get(path)})
				return true
			},
		}
	}

	get screenEnabled():Subscription {
		return {
			pat: 'device/(?:auxiliaryS|s)creenList/items/([AS]?\\d{1,3})/status/pp/mode',
			fun: (_path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
				return true
			},
		}
	}

	get liveInputsChange():Subscription {
		return {
			pat: 'DEVICE/device/inputList/items/IN_(\\d{1,2})/status/pp/isEnabled',
			fun: (_path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
				return true
			},
		}
	}

	get masterMemoriesChange():Subscription {
		return {
			pat: 'DEVICE/device/masterPresetBank/bankList/items/(\\d{1,3})/status/pp/isValid',
			fun: (_path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
				return true
			},
		}
	}

	get screenMemoriesChange():Subscription {
		return {
			pat: 'DEVICE/device/presetBank/bankList/items/(\\d{1,4})/status/pp/isValid',
			fun: (_path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
				return true
			},
		}
	}

	get layerMemoriesChange():Subscription {
		return {
			pat: 'DEVICE/device/layerBank/bankList/items/(\\d{1,3})/status/pp/isValid',
			fun: (_path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
				return true
			},
		}
	}

	get multiviewerMemoriesChange():Subscription {
		return {
			pat: 'DEVICE/device/monitoringBank/bankList/items/(\\d{1,3})/status/pp/isValid',
			fun: (_path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
				return true
			},
		}
	}

	get layerCountChange():Subscription {
		return {
			pat: 'DEVICE/device/screenList/items/((?:S|A)\\d{1,2})/status/pp/layerCount',
			fun: (_path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
				return true
			},
		}
	}

	get memoryColorChange():Subscription {
		return {
			pat: 'banks/(\\w+)/items/(\\d+)/color',
			fun: (_path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
				return true
			},
		}
	}

	//}
	//export const livepremierSubscriptions: Record<string, Subscription> = {

	// get liveselection():Subscription {
	// 	return {
	// 		pat: 'live/screens/screenAuxSelection',
	// 		fbk: 'liveScreenSelection',
	// 	}
	// }


	get inputLabel():Subscription {
		return {
			pat: 'DEVICE/device/inputList/items/IN_(\\d+)/control/pp/label',
			ini: Array.from({ length: this.constants.maxInputs }, (_, i) => (i + 1).toString()),
			fun: (path, _value) => {
				if (!path) return false;
				const input = Array.isArray(path) ? path[4] : path.split('/')[4];
				this.instance.setVariableValues({ [input.replace(/^\w+_/, 'INPUT_') + 'label']: this.instance.state.get(path) });
				return true;
			},
		}
	}

	get shutdown():Subscription {
		return {
			pat: 'DEVICE/device/system/shutdown/cmd/pp/xRequest',
			fun: (_path?: string | string[], value?: string | string[] | number | boolean): boolean => {
				if (value === 'SHUTDOWN') {
					this.instance.log('info', 'Device has been shut down.');
					this.instance.updateStatus(InstanceStatus.Ok, 'Shut down');
				}
				return false;
			},
		}
	}

	get backgroundSet():Subscription {
		return {
			pat: 'DEVICE/device/screenList/items/((?:S|A)\\d{1,3})/presetList/items/(A|B)/background/source/pp',
			fbk: 'deviceSourceTally',
		}
	}

	get auxMemoryLabel():Subscription {
		return {
			pat: 'DEVICE/device/preset/auxBank/slotList/items/(\\d+)/control/pp/label',
			ini: Array.from({ length: 200 }, (_, i) => (i + 1).toString()),
			fun: (path, _value) => {
				if (!path) return false;
				const memory = Array.isArray(path) ? path[6] : path.split('/')[6];
				const label = memory.toString() !== '0' ? this.instance.state.get(path) : '';
				this.instance.setVariableValues({ ['auxMemory' + memory + 'label']: label });
				for (const screen of this.instance.choices.getChosenAuxes('all')) {
					const pgmmem = this.instance.state.get([
						'DEVICE',
						'device',
						'screenList',
						'items',
						screen,
						'presetList',
						'items',
						this.instance.state.getUnmapped('LOCAL/screens/' + screen + '/pgm/preset'),
						'status',
						'pp',
						'memoryId',
					]);
					if (memory == pgmmem) {
						this.instance.setVariableValues({ ['screen' + screen + 'memoryLabelPGM']: label });
					}
					const pvwmem = this.instance.state.get([
						'DEVICE',
						'device',
						'screenList',
						'items',
						screen,
						'presetList',
						'items',
						this.instance.state.getUnmapped('LOCAL/screens/' + screen + '/pvw/preset'),
						'status',
						'pp',
						'memoryId',
					]);
					if (memory == pvwmem) {
						this.instance.setVariableValues({ ['screen' + screen + 'memoryLabelPVW']: label });
					}
				}
				return true;
			},
		}
	}

	get plugChange():Subscription {
		return {
			pat: 'DEVICE/device/inputList/items/(\\w+)/status/pp/plug',
			ini: Array.from({ length: 16 }, (_, i) => 'INPUT_' + (i + 1)),
			fun: (path, _value) => {
				if (!path) return false;
				const input = Array.isArray(path) ? path[4] : path.split('/')[4];
				this.instance.setVariableValues({
					[input.replace(/^\w+_/, 'INPUT_') + 'label']: this.instance.state.get([
						'DEVICE', 'device', 'inputList', 'items', input,
						'plugList', 'items', this.instance.state.get(path),
						'control', 'pp', 'label'
					])
				});
				return true;
			}
		}
	}

	/**
	 * Returns a string with the feedback ID if a feedback exists and runs an action if there is a 'fun' property
	 * @param pat The path in the state object to check if a feedback or action exists for, if undefined checks all possible subscriptions
	 */
	checkForAction(pat?: string | string[], value?: any): string | string[] | undefined {
		// console.log('Checking for action', pat, value);
		const subscriptions = this.subscriptions
		let path: string
		if (pat === undefined) {
			let update = false
			for (const key of Object.keys(subscriptions)) {
				const subscriptionobj = subscriptions[key]
				if (subscriptionobj.fun && typeof subscriptionobj.fun === 'function') {
					update = subscriptionobj.fun()
				}
			}
			if (update) void this.instance.updateInstance()
			return undefined
		} else if (typeof pat === 'string') {
			path = pat
		} else if (Array.isArray(pat)) {
			path = pat.join('/')
		} else {
			return undefined
		}

		const subscriptionlist = Object.keys(subscriptions).filter((key) => {
			const regexp = new RegExp(subscriptions[key].pat)
			if (path.match(regexp)) {
				return true
			}
			return false
		})
		let ret: string[] = []
		subscriptionlist.forEach((subscription) => {
			console.log('found subscription', subscription)
			const subscriptionobj = subscriptions[subscription]
			if (subscriptionobj.fun && typeof subscriptionobj.fun === 'function') {
				// console.log('found subscription fun')
				if (value) {
					const update = subscriptionobj.fun(path, value)
					if (update) void this.instance.updateInstance()
				} else {
					const update = subscriptionobj.fun(path)
					if (update) void this.instance.updateInstance()
				}
			}
			const fbk = subscriptions?.[subscription]?.fbk
			if (fbk) {
				// console.log('found feedback', fbk)
				if (typeof fbk === 'string') {
					ret.push(fbk)
				} else if (Array.isArray(fbk))
				ret = [...ret, ...fbk]
			}
		})

		if (ret.length === 1) {
			return ret[0]
		} else if (ret.length > 1) {
			return ret
		} else {
			return undefined
		}
	}

	/**
	 * Checks if the subscriptions has some iterable output of the 'ini' property and uses this as the path variable for the function of the 'fun' property.  
	 * This has the same effect as if we would receive an update for all parameters observed by a subscription.  
	 * If any of the subscriptions wants to run updateInstance it will be done at the end
	 * @param subscription specific subscription or all subscriptions if omitted
	 */
	initSubscriptions(subscription?: string): void {
		const subscriptions = this.subscriptions
		let update = false

		const checkSub = (sub: string): boolean => {
			let update = false
			const subscriptionobj = subscriptions[sub]
			let pattern = subscriptionobj.pat
			if (subscriptionobj.fun && typeof subscriptionobj.fun === 'function') {
				if (pattern.indexOf('(') === -1) {
					subscriptionobj.fun(pattern)
				} else {
					if (subscriptionobj.ini && Array.isArray(subscriptionobj.ini)) {
						// if ini is array just replace the the one and only capturing group with all the values of the array and run the fun with all resulting paths
						while (pattern.match(/\([^()]+\)/)) {
							pattern = pattern.replace(/\([^()]+\)/g, '*')
						}
						for (const item of subscriptionobj.ini) {
							const upd = subscriptionobj.fun(pattern.replace('*', item))
							if (upd) update = true
						}
					} else if (subscriptionobj.ini && typeof subscriptionobj.ini === 'function') {
						// if ini is a function run fun with all the paths generated by ini
						subscriptionobj.ini(this.instance).forEach((path: string) => {
							if (subscriptionobj.fun && typeof subscriptionobj.fun === 'function') {
								subscriptionobj.fun(path)
							}
						})
					}

				}
			}
			return update
		}

		if (typeof subscription === 'string') {
			update = checkSub(subscription)

		} else {
			// check all subscriptions
			this.subscriptionList.forEach((sub) => {
				const upd = checkSub(sub)
				if (upd) update = true
			})
		}
		
		if (update) {
			void (async () => {
				try {
					void this.instance.updateInstance()
					this.instance.checkFeedbacks()
					this.instance.subscribeFeedbacks()
				} catch (error) {
					this.instance.log('error', 'Cannot update the this.instance. '+ error)
				}
			})()
		}
	}

}

