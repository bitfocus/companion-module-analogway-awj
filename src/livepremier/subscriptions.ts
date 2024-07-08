import {AWJinstance} from '../index.js'
import { Subscription } from '../../types/Subscription.js'
import Subscriptions from '../awjdevice/subscriptions.js'

/**
 * Class for managing and checking of the subscriptions.
 * A subscription is data of the device associated with a json path in the device model which we are interested in and need to react on changes.
 */
export default class SubscriptionsLivepremier extends Subscriptions {

	/**
	 * This member denotes the names of the subscriptions which are to be checked.
	 * May be overridden in child classes.
	 */
	readonly subscriptionsToUse: string[] = [
		// Common
		'syncselection',
		'screenPreset',
		'liveselection',
		'layerselection',
		'widgetSelection',
		'screenLock',
		'sourceVisibility',
		'selectedPreset',
		'inputFreeze',
		'timerState',
		'gpioOut',
		'gpioIn',
		'screenTransitionTime',
		'screenMemoryLabel',
		'masterMemory',
		'masterMemoryLabel',
		'multiviewerMemoryLabel',
		'layerMemoryLabel',
		'stillLabel',
		'stillValid',
		'screenLabel',
		'auxscreenLabel',
		'screenEnabled',
		'liveInputsChange',
		'masterMemoriesChange',
		'screenMemoriesChange',
		'layerMemoriesChange',
		'multiviewerMemoriesChange',
		'layerCountChange',
		'memoryColorChange',
		// LivePremier
		'presetToggle',
		'screenMemoryChange',
		'screenMemoryModifiedChange',
		'screenTransitionTime',
		'screenMemoryLabel',
		'inputLabel',
		'shutdown',
		// Midra
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
		super(instance)
		this.instance = instance
		this.constants = this.instance.constants

		this.subscriptions = Object.fromEntries(
            this.subscriptionsToUse.map((key) => [key, this[key]])
        )
	}

	get gpioOut():Subscription {
		return {
			pat: 'device/gpio/gpoList/items/\\d/status/pp/state',
			fbk: 'deviceGpioOut',
		}
	}

	get gpioIn():Subscription {
		return {
			pat: 'device/gpio/gpiList/items/(\\d)/status/pp/state',
			fbk: 'deviceGpioIn',
		}
	}

	get screenTransitionTime():Subscription {
		return {
			pat: 'DEVICE/device/screenGroupList/items/((?:S|A)\\d{1,3})/control/pp/take(?:Up|Down)?Time',
			ini: ():string[] => {
				const presets = ['takeUpTime', 'takeDownTime']
				const screens: string[] = [
					...Array.from({ length: this.constants.maxScreens }, (_, i) => 'S' + (i + 1).toString()),
					...Array.from({ length: this.constants.maxAuxScreens }, (_, i) => 'A' + (i + 1).toString()),
					]
				const paths =  screens.reduce((cb: string[], screen) => cb.concat(presets.map((preset) => {
					return 'DEVICE/device/screenGroupList/items/'+ screen +'/control/pp/'+ preset
				})), [])
				return paths
			},
			fun: (path, _value) => {
				if (!path) return false
				const screen = Array.isArray(path) ? path[4] : path.split('/')[4]
				const pres = Array.isArray(path) ? path[7] : path.split('/')[7]
				if (pres === 'takeUpTime') {
					const presname = 'B' === this.instance.state.getUnmapped(`LOCAL/screens/${screen}/pgm/preset`) ? 'PVW' : 'PGM'
					this.instance.setVariableValues({
						['screen' + screen + 'time' + presname]: this.instance.deciSceondsToString(this.instance.state.getUnmapped(path))
					})
				}
				if (pres === 'takeDownTime') {
					const presname = 'A' === this.instance.state.getUnmapped(`LOCAL/screens/${screen}/pgm/preset`) ? 'PVW' : 'PGM'
					this.instance.setVariableValues({
						['screen' + screen + 'time' + presname]: this.instance.deciSceondsToString(this.instance.state.getUnmapped(path))
					})
				}
				
				return false
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
				this.instance.setVariableValues({['screen' + input + 'label']:  this.instance.state.getUnmapped(path)})
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
				this.instance.setVariableValues({['screen' + input + 'label']:  this.instance.state.getUnmapped(path)})
				return true
			},
		}
	}

	get screenPreset():Subscription {
		return {
			pat: 'DEVICE/device/screenGroupList/items/(\\w+?)/status/pp/transition',
			fbk: 'deviceTake',
			ini: [
				...Array.from({ length: this.constants.maxScreens }, (_, i) => 'S' + (i + 1).toString()),
				...Array.from({ length: this.constants.maxAuxScreens }, (_, i) => 'A' + (i + 1).toString()),
			],
			fun: (path, _value) => {
				const setMemoryVariables = (screen: string, preset: string, variableSuffix: string): void => {
					const mem = this.instance.state.getUnmapped([
						'DEVICE',
						'device',
						'screenList', 'items', screen,
						'presetList', 'items', preset,
						'presetId',
						'status',
						'pp',
						'id',
					]);
					const unmodified = this.instance.state.getUnmapped([
						'DEVICE',
						'device',
						'screenList', 'items', screen,
						'presetList', 'items', preset,
						'presetId',
						'status',
						'pp',
						'isNotModified',
					]);
					this.instance.setVariableValues({ ['screen' + screen + 'memory' + variableSuffix]: mem ? 'M' + mem : '' });
					this.instance.setVariableValues({ ['screen' + screen + 'memoryModified' + variableSuffix]: mem && !unmodified ? '*' : '' });
					this.instance.setVariableValues({
						['screen' + screen + 'memoryLabel' + variableSuffix]: mem
							? this.instance.state.getUnmapped(['DEVICE', 'device', 'presetBank', 'bankList', 'items', mem, 'control', 'pp', 'label'])
							: ''
					});
				};
				let patharr: string[];
				if (typeof path === 'string') {
					patharr = path.split('/');
				} else if (Array.isArray(path)) {
					patharr = path;
				} else {
					return false;
				}
				const val = this.instance.state.get(patharr);
				const screen = patharr[4];
				let program = '', preview = '';
				if (val === 'AT_UP') {
					program = 'B';
					preview = 'A';
					this.instance.state.setUnmapped(`LOCAL/screens/${screen}/pgm/preset`, program);
					this.instance.state.setUnmapped(`LOCAL/screens/${screen}/pvw/preset`, preview);
					this.instance.setVariableValues({
						['screen' + screen + 'timePGM']: this.instance.deciSceondsToString(
							this.instance.state.getUnmapped(['DEVICE', 'device', 'screenGroupList', 'items', screen, 'control', 'pp', 'takeUpTime'])
						)
					});
					this.instance.setVariableValues({
						['screen' + screen + 'timePVW']: this.instance.deciSceondsToString(
							this.instance.state.getUnmapped(['DEVICE', 'device', 'screenGroupList', 'items', screen, 'control', 'pp', 'takeDownTime'])
						)
					});
					setMemoryVariables(screen, program, 'PGM');
					setMemoryVariables(screen, preview, 'PVW');
				}
				if (val === 'AT_DOWN') {
					program = 'A';
					preview = 'B';
					this.instance.state.setUnmapped(`LOCAL/screens/${screen}/pgm/preset`, program);
					this.instance.state.setUnmapped(`LOCAL/screens/${screen}/pvw/preset`, preview);
					this.instance.setVariableValues({
						['screen' + screen + 'timePGM']: this.instance.deciSceondsToString(
							this.instance.state.get([
								'DEVICE',
								'device',
								'screenGroupList', 'items', screen,
								'control',
								'pp',
								'takeDownTime',
							])
						)
					});
					this.instance.setVariableValues({
						['screen' + screen + 'timePVW']: this.instance.deciSceondsToString(
							this.instance.state.get(['DEVICE', 'device', 'screenGroupList', 'items', screen, 'control', 'pp', 'takeUpTime'])
						)
					});
					setMemoryVariables(screen, program, 'PGM');
					setMemoryVariables(screen, preview, 'PVW');
				}
				this.instance.checkFeedbacks('deviceSourceTally', 'deviceScreenMemory', 'deviceTake');
				return false;
			},
		}
	}

	get screenMemoryChange():Subscription {
		return {
			pat: 'DEVICE/device/screenList/items/(S|A)\\d{1,3}/presetList/items/(A|B)/presetId/status/pp/id',
			fbk: 'deviceScreenMemory',
			fun: (path, value) => {
				if (!path) return false;
				const screen = Array.isArray(path) ? path[4] : path.split('/')[4];
				const pres = Array.isArray(path) ? path[7] : path.split('/')[7];
				const presname = pres === this.instance.state.getUnmapped(`LOCAL/screens/${screen}/pgm/preset`) ? 'PGM' : 'PVW';
				const memorystr = value ? value.toString() : '';
				this.instance.setVariableValues({ ['screen' + screen + 'memory' + presname]: memorystr });
				this.instance.setVariableValues({
					['screen' + screen + 'memoryLabel' + presname]: memorystr !== ''
						? this.instance.state.getUnmapped([
							'DEVICE',
							'device',
							'presetBank',
							'bankList',
							'items',
							memorystr,
							'control',
							'pp',
							'label',
						])
						: ''
				});
				return false;
			},
		}
	}

	get screenMemoryModifiedChange():Subscription {
		return {
			pat: 'DEVICE/device/screenList/items/(?:S|A)\\d{1,3}/presetList/items/(?:A|B)/presetId/status/pp/isNotModified',
			fbk: 'deviceScreenMemory',
			fun: (path, _value) => {
				if (!path) return false;
				const screen = Array.isArray(path) ? path[4] : path.split('/')[4];
				const pres = Array.isArray(path) ? path[7] : path.split('/')[7];
				const presname = pres === this.instance.state.getUnmapped(`LOCAL/screens/${screen}/pgm/preset`) ? 'PGM' : 'PVW';
				this.instance.setVariableValues({
					['screen' + screen + 'memoryModified' + presname]: this.instance.state.getUnmapped(
						'DEVICE/device/screenList/items/' + screen + '/presetList/items/' + pres + '/presetId/status/pp/id'
					) && !this.instance.state.getUnmapped(path)
						? '*'
						: ''
				});
				return false;
			},
		}
	}

	get presetToggle():Subscription {
		return {
			pat: 'DEVICE/device/screenGroupList/items/S1/control/pp/copyMode',
			fbk: 'presetToggle'
		}
	}

}

