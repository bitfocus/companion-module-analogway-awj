import {AWJinstance} from '../index.js'
import { Subscription } from '../../types/Subscription.js'
export const maxScreens = 24
export const maxAuxScreens = 96
export const maxInputs = 256

/**
 * Class for managing and checking of the subscriptions.
 * A subscription is data of the device associated with a json path in the device model which we are interested in and need to react on changes.
 */
export class Subscriptions {
	private instance: AWJinstance
	private subscriptions: Record<string, Subscription>

	/**
	 * This member denotes the names of the subscriptions which are to be checked.
	 * May be overridden in child classes.
	 */
	private subscriptionsToUse: string[] = [
		// Common
		'syncselection',
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
		'liveselection',
		'presetToggle',
		'screenPreset',
		'screenMemoryChange',
		'screenMemoryModifiedChange',
		'screenTransitionTime',
		'screenMemoryLabel',
		'inputLabel',
		'shutdown',
		// Midra
		'presetToggle',
		'screenPreset',
		'backgroundSet',
		'screenMemoryChange',
		'screenMemoryLabel',
		'screenMemoryModifiedChange',
		'auxMemoryLabel',
		'plugChange',
		'inputLabel',
		'auxMemoriesChange',
		'liveLayerFreeze',
		'backgroundLayerFreeze',
		'screenFreeze',
		'streamStatus',
		'standby',
		'shutdown',
	]

	constructor(instance: AWJinstance) {
		this.instance = instance

		this.subscriptions = Object.fromEntries(
            this.subscriptionsToUse.map((key) => [key, this[key]])
        )
	}
// }
// export const commonSubscriptions: Record<string, Subscription> = {
	get syncselection():Subscription {
		return {
			pat: 'system/network/websocketServer/clients',
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
			fun: (instance, path, _value) => {
				if (instance.device.syncSelection) {
					instance.setVariableValues({
						selectedPreset: instance.device.getUnmapped(path) === 'PREVIEW' ? 'PVW' : 'PGM'
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
			fun: (instance, path, _value) => {
				if (!path) return false
				const timer = path.toString().match(/(?<=TIMER_)(\d)\//) || ['0']
				instance.setVariableValues({['timer' + timer[0] + '_status']:  instance.device.getUnmapped(path)})
				return false
			},
		}
	}

	get gpioOut():Subscription {
		return {
			pat: 'device/gpio/gpoList/items/(\\d)/status/pp/state',
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
			ini: (instance: AWJinstance):string[] => {
				let presets: string[] = []
				if (instance.device.platform.startsWith('livepremier')) presets = ['takeUpTime', 'takeDownTime']
				if (instance.device.platform === 'midra') presets = ['takeTime']
				const screens: string[] = [
					...Array.from({ length: maxScreens }, (_, i) => 'S' + (i + 1).toString()),
					...Array.from({ length: maxAuxScreens }, (_, i) => 'A' + (i + 1).toString()),
					]
				const paths =  screens.reduce((cb: string[], screen) => cb.concat(presets.map((preset) => {
					return 'DEVICE/device/screenGroupList/items/'+ screen +'/control/pp/'+ preset
				})), [])
				return paths
			},
			fun: (instance, path, _value) => {
				if (!path) return false
				const screen = Array.isArray(path) ? path[4] : path.split('/')[4]
				const pres = Array.isArray(path) ? path[7] : path.split('/')[7]
				if (pres === 'takeUpTime') {
					const presname = 'B' === instance.device.getUnmapped(`LOCAL/screens/${screen}/pgm/preset`) ? 'PVW' : 'PGM'
					instance.setVariableValues({
						['screen' + screen + 'time' + presname]: instance.deciSceondsToString(instance.device.get(path))
					})
				}
				if (pres === 'takeDownTime') {
					const presname = 'A' === instance.device.getUnmapped(`LOCAL/screens/${screen}/pgm/preset`) ? 'PVW' : 'PGM'
					instance.setVariableValues({
						['screen' + screen + 'time' + presname]: instance.deciSceondsToString(instance.device.get(path))
					})
				}
				if (pres === 'takeTime') {
					instance.setVariableValues({
						['screen' + screen + 'timePVW']: instance.deciSceondsToString(instance.device.get(path))
					})
					instance.setVariableValues({
						['screen' + screen + 'timePGM']: instance.deciSceondsToString(instance.device.get(path))
					})
				}
				
				
				return false
			},
		}
	}

	get screenMemoryLabel():Subscription {
		return {
			pat: 'DEVICE/device/presetBank/bankList/items/(\\d+)/control/pp/label',
			ini: Array.from({ length: 999 }, (_, i) => (i + 1).toString()),
			fun: (instance, path, _value) => {
				if (!path) return false
				const memory = Array.isArray(path) ? path[5] : path.split('/')[5]
				const label = memory.toString() !== '0' ? instance.device.get(path) : ''
				instance.setVariableValues({['screenMemory' + memory + 'label']:  label})
				const pathTo = {
					get id() {
						if (instance.device.platform === 'midra') {
							return ['status','pp','memoryId']
						} else {
							return ['presetId','status','pp','id']
						}
					},
					livepremier: { id: ['presetId','status','pp','id']},
					midra: {id: ['status','pp','memoryId']}
				}
				let screens: string[] = []
				if (instance.device.platform.startsWith('livepremier')) screens = instance.device.getChosenScreenAuxes('all')
				if (instance.device.platform === 'midra') screens = instance.device.getChosenScreens('all')

				for (const screen of screens) {
					const pgmmem = instance.device.get([
						'DEVICE',
						'device',
						'screenList',
						'items',
						screen,
						'presetList',
						'items',
						instance.device.getUnmapped('LOCAL/screens/' + screen + '/pgm/preset'),
						...pathTo.id
					])
					if (memory == pgmmem) {
						instance.setVariableValues({['screen' + screen + 'memoryLabelPGM']:  label})
					}
					const pvwmem = instance.device.get([
						'DEVICE',
						'device',
						'screenList',
						'items',
						screen,
						'presetList',
						'items',
						instance.device.getUnmapped('LOCAL/screens/' + screen + '/pvw/preset'),
						...pathTo.id
					])
					if (memory == pvwmem) {
						instance.setVariableValues({['screen' + screen + 'memoryLabelPVW']:  label})
					}
				}
				return true
			},
		}
	}

	get masterMemory():Subscription {
		return {
			pat: 'DEVICE/device/masterPresetBank/status/lastUsed/presetModeList/items/(PROGRAM|PREVIEW)/pp/memoryId',
			fbk: 'deviceMasterMemory',
		}
	}

	get masterMemoryLabel():Subscription {
		return {
			pat: 'DEVICE/device/masterPresetBank/bankList/items/(\\d+)/control/pp/label',
			ini: Array.from({ length: 499 }, (_, i) => (i + 1).toString()),
			fun: (instance, path, _value) => {
				if (!path) return false
				const memory = Array.isArray(path) ? path[5] : path.split('/')[5]
				instance.setVariableValues({['masterMemory' + memory + 'label']:  instance.device.get(path)})
				return true
			},
		}
	}

	get multiviewerMemoryLabel():Subscription {
		return {
			pat: 'DEVICE/device/monitoringBank/bankList/items/(\\d+)/control/pp/label',
			ini: Array.from({ length: 49 }, (_, i) => (i + 1).toString()),
			fun: (instance, path, _value) => {
				if (!path) return false
				const memory = Array.isArray(path) ? path[5] : path.split('/')[5]
				instance.setVariableValues({['multiviewerMemory' + memory + 'label']:  instance.device.get(path)})
				return true
			},
		}
	}

	get layerMemoryLabel():Subscription {
		return {
			pat: 'DEVICE/device/layerBank/bankList/items/(\\d+)/control/pp/label',
			ini: Array.from({ length: 49 }, (_, i) => (i + 1).toString()),
			fun: (instance, path, _value) => {
				if (!path) return false
				const memory = Array.isArray(path) ? path[5] : path.split('/')[5]
				instance.setVariableValues({['layerMemory' + memory + 'label']:  instance.device.get(path)})
				return true
			},
		}
	}

	get stillLabel():Subscription {
		return {
			pat: 'DEVICE/device/stillList/items/(\\d+)/control/pp/label',
			ini: Array.from({ length: 47 }, (_, i) => (i + 1).toString()),
			fun: (instance, path, _value) => {
				if (!path) return false
				const input = Array.isArray(path) ? path[4] : path.split('/')[4]
				instance.setVariableValues({['STILL_' + input + 'label']:  instance.device.get(path)})
				return true
			},
		}
	}

	get stillValid():Subscription {
		return {
			pat: 'DEVICE/device/stillList/items/(\\d+)/status/pp/isValid',
			fun: (_instance: AWJinstance, _path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
				return true
			},
		}
	}

	get screenLabel():Subscription {
		return {
			pat: 'DEVICE/device/screenList/items/S(\\d{1,2})/control/pp/label',
			ini: Array.from({ length: maxScreens }, (_, i) => (i + 1).toString()),
			fun: (instance, path, _value) => {
				if (!path) return false
				const input = Array.isArray(path) ? path[4] : path.split('/')[4]
				instance.setVariableValues({[input.replace('S', 'SCREEN_') + 'label']:  instance.device.get(path)})
				instance.setVariableValues({['screen' + input + 'label']:  instance.device.get(path)})
				return true
			},
		}
	}

	get auxscreenLabel():Subscription {
		return {
			pat: 'DEVICE/device/screenList/items/A(\\d{1,2})/control/pp/label',
			ini: Array.from({ length: maxAuxScreens }, (_, i) => (i + 1).toString()),
			fun: (instance, path, _value) => {
				if (!path) return false
				const input = Array.isArray(path) ? path[4] : path.split('/')[4]
				instance.setVariableValues({[input.replace('A', 'AUXSCREEN_') + 'label']:  instance.device.get(path)})
				instance.setVariableValues({['screen' + input + 'label']:  instance.device.get(path)})
				return true
			},
		}
	}

	get screenEnabled():Subscription {
		return {
			pat: 'device/screenList/items/((?:S|A)\\d{1,3})/status/pp/mode',
			fun: (_instance: AWJinstance, _path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
				return true
			},
		}
	}

	get liveInputsChange():Subscription {
		return {
			pat: 'DEVICE/device/inputList/items/IN_(\\d{1,2})/status/pp/isEnabled',
			fun: (_instance: AWJinstance, _path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
				return true
			},
		}
	}

	get masterMemoriesChange():Subscription {
		return {
			pat: 'DEVICE/device/masterPresetBank/bankList/items/(\\d{1,3})/status/pp/isValid',
			fun: (_instance: AWJinstance, _path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
				return true
			},
		}
	}

	get screenMemoriesChange():Subscription {
		return {
			pat: 'DEVICE/device/presetBank/bankList/items/(\\d{1,4})/status/pp/isValid',
			fun: (_instance: AWJinstance, _path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
				return true
			},
		}
	}

	get layerMemoriesChange():Subscription {
		return {
			pat: 'DEVICE/device/layerBank/bankList/items/(\\d{1,3})/status/pp/isValid',
			fun: (_instance: AWJinstance, _path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
				return true
			},
		}
	}

	get multiviewerMemoriesChange():Subscription {
		return {
			pat: 'DEVICE/device/monitoringBank/bankList/items/(\\d{1,3})/status/pp/isValid',
			fun: (_instance: AWJinstance, _path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
				return true
			},
		}
	}

	get layerCountChange():Subscription {
		return {
			pat: 'DEVICE/device/screenList/items/((?:S|A)\\d{1,2})/status/pp/layerCount',
			fun: (_instance: AWJinstance, _path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
				return true
			},
		}
	}

	get memoryColorChange():Subscription {
		return {
			pat: 'banks/(\\w+)/items/(\\d+)/color',
			fun: (_instance: AWJinstance, _path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
				return true
			},
		}
	}

	//}
	//export const livepremierSubscriptions: Record<string, Subscription> = {
	get liveselection():Subscription {
		return {
			pat: 'live/screens/screenAuxSelection',
			fbk: 'liveScreenSelection',
		}
	}

	get presetToggle():Subscription {
		return {
			pat: 'DEVICE/device/screenGroupList/items/S1/control/pp/copyMode',
			fbk: 'presetToggle'
		}
	}

	get screenPreset():Subscription {
		return {
			pat: 'DEVICE/device/screenGroupList/items/(\\w+?)/status/pp/transition',
			fbk: 'deviceTake',
			ini: [
				...Array.from({ length: maxScreens }, (_, i) => 'S' + (i + 1).toString()),
				...Array.from({ length: maxAuxScreens }, (_, i) => 'A' + (i + 1).toString()),
			],
			fun: (instance, path, _value) => {
				const setMemoryVariables = (screen: string, preset: string, variableSuffix: string): void => {
					const mem = instance.device.get([
						'DEVICE',
						'device',
						'screenList',
						'items',
						screen,
						'presetList',
						'items',
						preset,
						'presetId',
						'status',
						'pp',
						'id',
					]);
					const unmodified = instance.device.get([
						'DEVICE',
						'device',
						'screenList',
						'items',
						screen,
						'presetList',
						'items',
						preset,
						'presetId',
						'status',
						'pp',
						'isNotModified',
					]);
					instance.setVariableValues({ ['screen' + screen + 'memory' + variableSuffix]: mem ? 'M' + mem : '' });
					instance.setVariableValues({ ['screen' + screen + 'memoryModified' + variableSuffix]: mem && !unmodified ? '*' : '' });
					instance.setVariableValues({
						['screen' + screen + 'memoryLabel' + variableSuffix]: mem
							? instance.device.getUnmapped(['DEVICE', 'device', 'presetBank', 'bankList', 'items', mem, 'control', 'pp', 'label'])
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
				const val = instance.device.get(patharr);
				const screen = patharr[4];
				let program = '', preview = '';
				if (val === 'AT_UP') {
					program = 'B';
					preview = 'A';
					instance.device.set(`LOCAL/screens/${screen}/pgm/preset`, program);
					instance.device.set(`LOCAL/screens/${screen}/pvw/preset`, preview);
					instance.setVariableValues({
						['screen' + screen + 'timePGM']: instance.deciSceondsToString(
							instance.device.get(['DEVICE', 'device', 'screenGroupList', 'items', screen, 'control', 'pp', 'takeUpTime'])
						)
					});
					instance.setVariableValues({
						['screen' + screen + 'timePVW']: instance.deciSceondsToString(
							instance.device.get([
								'DEVICE',
								'device',
								'screenGroupList',
								'items',
								screen,
								'control',
								'pp',
								'takeDownTime',
							])
						)
					});
					setMemoryVariables(screen, program, 'PGM');
					setMemoryVariables(screen, preview, 'PVW');
				}
				if (val === 'AT_DOWN') {
					program = 'A';
					preview = 'B';
					instance.device.set(`LOCAL/screens/${screen}/pgm/preset`, program);
					instance.device.set(`LOCAL/screens/${screen}/pvw/preset`, preview);
					instance.setVariableValues({
						['screen' + screen + 'timePGM']: instance.deciSceondsToString(
							instance.device.get([
								'DEVICE',
								'device',
								'screenGroupList',
								'items',
								screen,
								'control',
								'pp',
								'takeDownTime',
							])
						)
					});
					instance.setVariableValues({
						['screen' + screen + 'timePVW']: instance.deciSceondsToString(
							instance.device.get(['DEVICE', 'device', 'screenGroupList', 'items', screen, 'control', 'pp', 'takeUpTime'])
						)
					});
					setMemoryVariables(screen, program, 'PGM');
					setMemoryVariables(screen, preview, 'PVW');
				}
				instance.checkFeedbacks('deviceSourceTally', 'deviceScreenMemory', 'deviceTake');
				return false;
			},
		}
	}

	get screenMemoryChange():Subscription {
		return {
			pat: 'DEVICE/device/screenList/items/(S|A)\\d{1,3}/presetList/items/(A|B)/presetId/status/pp/id',
			fbk: 'deviceScreenMemory',
			fun: (instance, path, _value) => {
				if (!path) return false;
				const screen = Array.isArray(path) ? path[4] : path.split('/')[4];
				const pres = Array.isArray(path) ? path[7] : path.split('/')[7];
				const presname = pres === instance.device.getUnmapped(`LOCAL/screens/${screen}/pgm/preset`) ? 'PGM' : 'PVW';
				const memorystr = instance.device.get(path).toString() !== '0' ? instance.device.get(path) : '';
				instance.setVariableValues({ ['screen' + screen + 'memory' + presname]: memorystr });
				instance.setVariableValues({
					['screen' + screen + 'memoryLabel' + presname]: instance.device.get(path).toString() !== '0'
						? instance.device.getUnmapped([
							'DEVICE',
							'device',
							'presetBank',
							'bankList',
							'items',
							instance.device.get(path).toString(),
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
			pat: 'DEVICE/device/screenList/items/((?:S|A)\\d{1,3})/presetList/items/(A|B)/presetId/status/pp/isNotModified',
			fbk: 'deviceScreenMemory',
			fun: (instance, path, _value) => {
				if (!path) return false;
				const screen = Array.isArray(path) ? path[4] : path.split('/')[4];
				const pres = Array.isArray(path) ? path[7] : path.split('/')[7];
				const presname = pres === instance.device.getUnmapped(`LOCAL/screens/${screen}/pgm/preset`) ? 'PGM' : 'PVW';
				instance.setVariableValues({
					['screen' + screen + 'memoryModified' + presname]: instance.device.get(
						'DEVICE/device/screenList/items/' + screen + '/presetList/items/' + pres + '/presetId/status/pp/id'
					) && !instance.device.get(path)
						? '*'
						: ''
				});
				return false;
			},
		}
	}

	get screenTransitionTime():Subscription {
		return {
			pat: 'DEVICE/device/screenGroupList/items/((?:S|A)\\d{1,3})/control/pp/take(?:Up|Down)?Time',
			ini: (_instance: AWJinstance):string[] => {
				const presets = ['takeUpTime', 'takeDownTime']
				const screens: string[] = [
					...Array.from({ length: maxScreens }, (_, i) => 'S' + (i + 1).toString()),
					...Array.from({ length: maxAuxScreens }, (_, i) => 'A' + (i + 1).toString()),
					]
				const paths =  screens.reduce((cb: string[], screen) => cb.concat(presets.map((preset) => {
					return 'DEVICE/device/screenGroupList/items/'+ screen +'/control/pp/'+ preset
				})), [])
				return paths
			},
			fun: (instance, path, _value) => {
				if (!path) return false
				const screen = Array.isArray(path) ? path[4] : path.split('/')[4]
				const pres = Array.isArray(path) ? path[7] : path.split('/')[7]
				if (pres === 'takeUpTime') {
					const presname = 'B' === instance.device.getUnmapped(`LOCAL/screens/${screen}/pgm/preset`) ? 'PVW' : 'PGM'
					instance.setVariableValues({
						['screen' + screen + 'time' + presname]: instance.deciSceondsToString(instance.device.get(path))
					})
				} else
				if (pres === 'takeDownTime') {
					const presname = 'A' === instance.device.getUnmapped(`LOCAL/screens/${screen}/pgm/preset`) ? 'PVW' : 'PGM'
					instance.setVariableValues({
						['screen' + screen + 'time' + presname]: instance.deciSceondsToString(instance.device.get(path))
					})
				}
				
				return false
			},
		}
	}

	get screenMemoryLabel():Subscription {
		return {
			pat: 'DEVICE/device/presetBank/bankList/items/(\\d+)/control/pp/label',
			ini: Array.from({ length: 999 }, (_, i) => (i + 1).toString()),
			fun: (instance, path, _value) => {
				if (!path) return false
				const memory = Array.isArray(path) ? path[5] : path.split('/')[5]
				const label = memory.toString() !== '0' ? instance.device.get(path) : ''
				const screens = instance.device.getChosenScreenAuxes('all')
				
				instance.setVariableValues({['screenMemory' + memory + 'label']:  label})

				for (const screen of screens) {
					const pgmmem = instance.device.get([
						'DEVICE',
						'device',
						'screenList',
						'items',
						screen,
						'presetList',
						'items',
						instance.device.getUnmapped('LOCAL/screens/' + screen + '/pgm/preset'),
						'presetId','status','pp','id'
					])
					if (memory == pgmmem) {
						instance.setVariableValues({['screen' + screen + 'memoryLabelPGM']:  label})
					}
					const pvwmem = instance.device.get([
						'DEVICE',
						'device',
						'screenList',
						'items',
						screen,
						'presetList',
						'items',
						instance.device.getUnmapped('LOCAL/screens/' + screen + '/pvw/preset'),
						'presetId','status','pp','id'
					])
					if (memory == pvwmem) {
						instance.setVariableValues({['screen' + screen + 'memoryLabelPVW']:  label})
					}
				}
				return true
			},
		}
	}

	get inputLabel():Subscription {
		return {
			pat: 'DEVICE/device/inputList/items/IN_(\\d+)/control/pp/label',
			ini: Array.from({ length: maxInputs }, (_, i) => (i + 1).toString()),
			fun: (instance, path, _value) => {
				if (!path) return false;
				const input = Array.isArray(path) ? path[4] : path.split('/')[4];
				instance.setVariableValues({ [input.replace(/^\w+_/, 'INPUT_') + 'label']: instance.device.get(path) });
				return true;
			},
		}
	}

	get shutdown():Subscription {
		return {
			pat: 'DEVICE/device/system/shutdown/cmd/pp/xRequest',
			fun: (instance: AWJinstance, _path?: string | string[], value?: string | string[] | number | boolean): boolean => {
				if (value === 'SHUTDOWN') {
					instance.log('info', 'Device has been shut down.');
					instance.updateStatus(InstanceStatus.Ok, 'Shut down');
				}
				return false;
			},
		}
	}

	//};
	//export const midraSubscriptions: Record<string, Subscription> = {
	get presetToggle():Subscription {
		return {
			pat: 'DEVICE/device/screenGroupList/items/S1/control/pp/enablePresetToggle',
			fbk: 'presetToggle'
		}
	}

	get screenPreset():Subscription {
		return {
			pat: 'DEVICE/device/transition/screenList/items/(\\w+?)/status/pp/transition',
			fbk: 'deviceTake',
			ini: [
				...Array.from({ length: 8 }, (_, i) => 'S' + (i + 1).toString()),
				...Array.from({ length: 8 }, (_, i) => 'A' + (i + 1).toString()),
			],
			fun: (instance, path, _value) => {
				const setMemoryVariables = (screen: string, preset: string, variableSuffix: string): void => {
					const mem = instance.device.get([
						'DEVICE',
						'device',
						'screenList',
						'items',
						screen,
						'presetList',
						'items',
						preset,
						'status',
						'pp',
						'memoryId',
					]);
					const modified = instance.device.get([
						'DEVICE',
						'device',
						'screenList',
						'items',
						screen,
						'presetList',
						'items',
						preset,
						'status',
						'pp',
						'isModified',
					]);
					instance.setVariableValues({ ['screen' + screen + 'memory' + variableSuffix]: mem ? 'M' + mem : '' });
					instance.setVariableValues({ ['screen' + screen + 'memoryModified' + variableSuffix]: mem && modified ? '*' : '' });
					instance.setVariableValues({
						['screen' + screen + 'memoryLabel' + variableSuffix]: mem
							? instance.device.get([
								'DEVICE',
								'device',
								'preset',
								'bank',
								'slotList',
								'items',
								mem.toString(),
								'control',
								'pp',
								'label',
							])
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
				const val = instance.device.get(patharr);
				const screen = patharr[5];
				let program = '', preview = '';
				if (val === 'AT_UP') {
					program = 'B';
					preview = 'A';
					instance.device.setUnmapped(`LOCAL/screens/${screen}/pgm/preset`, program);
					instance.device.setUnmapped(`LOCAL/screens/${screen}/pvw/preset`, preview);

					setMemoryVariables(screen, program, 'PGM');
					setMemoryVariables(screen, preview, 'PVW');
				}
				if (val === 'AT_DOWN') {
					program = 'A';
					preview = 'B';
					instance.device.setUnmapped(`LOCAL/screens/${screen}/pgm/preset`, program);
					instance.device.setUnmapped(`LOCAL/screens/${screen}/pvw/preset`, preview);

					setMemoryVariables(screen, program, 'PGM');
					setMemoryVariables(screen, preview, 'PVW');
				}
				instance.checkFeedbacks('deviceSourceTally', 'deviceScreenMemory', 'deviceAuxMemory', 'deviceTake');
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

	get screenMemoryChange():Subscription {
		return {
			pat: 'DEVICE/device/screenList/items/((?:S|A)\\d{1,3})/presetList/items/(A|B)/status/pp/memoryId',
			fbk: ['deviceScreenMemory', 'deviceAuxMemory'],
			fun: (instance, path, _value) => {
				if (!path) return false;
				const screen = Array.isArray(path) ? path[4] : path.split('/')[4];
				const pres = Array.isArray(path) ? path[7] : path.split('/')[7];
				const presname = pres === instance.device.getUnmapped(`LOCAL/screens/${screen}/pgm/preset`) ? 'PGM' : 'PVW';
				const memorystr = instance.device.get(path).toString() !== '0' ? instance.device.get(path) : '';
				instance.setVariableValues({ ['screen' + screen + 'memory' + presname]: memorystr });
				instance.setVariableValues({
					['screen' + screen + 'memoryLabel' + presname]: instance.device.get(path).toString() !== '0'
						? instance.device.getUnmapped([
							'DEVICE',
							'device',
							'preset',
							'bank',
							'slotList',
							'items',
							instance.device.get(path).toString(),
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

	get screenMemoryLabel():Subscription {
		return {
			pat: 'DEVICE/device/presetBank/bankList/items/(\\d+)/control/pp/label',
			ini: Array.from({ length: 999 }, (_, i) => (i + 1).toString()),
			fun: (instance, path, _value) => {
				if (!path) return false
				const memory = Array.isArray(path) ? path[5] : path.split('/')[5]
				const label = memory.toString() !== '0' ? instance.device.get(path) : ''
				const screens = instance.device.getChosenScreens('all')
				
				instance.setVariableValues({['screenMemory' + memory + 'label']:  label})

				for (const screen of screens) {
					const pgmmem = instance.device.get([
						'DEVICE',
						'device',
						'screenList',
						'items',
						screen,
						'presetList',
						'items',
						instance.device.getUnmapped('LOCAL/screens/' + screen + '/pgm/preset'),
						'status','pp','memoryId'
					])
					if (memory == pgmmem) {
						instance.setVariableValues({['screen' + screen + 'memoryLabelPGM']:  label})
					}
					const pvwmem = instance.device.get([
						'DEVICE',
						'device',
						'screenList',
						'items',
						screen,
						'presetList',
						'items',
						instance.device.getUnmapped('LOCAL/screens/' + screen + '/pvw/preset'),
						'status','pp','memoryId'
					])
					if (memory == pvwmem) {
						instance.setVariableValues({['screen' + screen + 'memoryLabelPVW']:  label})
					}
				}
				return true
			},
		}
	}

	get screenMemoryModifiedChange():Subscription {
		return {
			pat: 'DEVICE/device/screenList/items/((?:S|A)\\d{1,3})/presetList/items/(A|B)/status/pp/isModified',
			fbk: ['deviceScreenMemory', 'deviceAuxMemory'],
			fun: (instance, path, _value) => {
				if (!path) return false;
				const screen = Array.isArray(path) ? path[4] : path.split('/')[4];
				const pres = Array.isArray(path) ? path[7] : path.split('/')[7];
				const presname = pres === instance.device.getUnmapped(`LOCAL/screens/${screen}/pgm/preset`) ? 'PGM' : 'PVW';
				instance.setVariableValues({
					['screen' + screen + 'memoryModified' + presname]: instance.device.get(
						'DEVICE/device/screenList/items/' + screen + '/presetList/items/' + pres + '/status/pp/memoryId'
					) && instance.device.get(path)
						? '*'
						: ''
				});
				return false;
			},
		}
	}

	get auxMemoryLabel():Subscription {
		return {
			pat: 'DEVICE/device/preset/auxBank/slotList/items/(\\d+)/control/pp/label',
			ini: Array.from({ length: 200 }, (_, i) => (i + 1).toString()),
			fun: (instance, path, _value) => {
				if (!path) return false;
				const memory = Array.isArray(path) ? path[6] : path.split('/')[6];
				const label = memory.toString() !== '0' ? instance.device.get(path) : '';
				instance.setVariableValues({ ['auxMemory' + memory + 'label']: label });
				for (const screen of instance.device.getChosenAuxes('all')) {
					const pgmmem = instance.device.get([
						'DEVICE',
						'device',
						'screenList',
						'items',
						screen,
						'presetList',
						'items',
						instance.device.getUnmapped('LOCAL/screens/' + screen + '/pgm/preset'),
						'status',
						'pp',
						'memoryId',
					]);
					if (memory == pgmmem) {
						instance.setVariableValues({ ['screen' + screen + 'memoryLabelPGM']: label });
					}
					const pvwmem = instance.device.get([
						'DEVICE',
						'device',
						'screenList',
						'items',
						screen,
						'presetList',
						'items',
						instance.device.getUnmapped('LOCAL/screens/' + screen + '/pvw/preset'),
						'status',
						'pp',
						'memoryId',
					]);
					if (memory == pvwmem) {
						instance.setVariableValues({ ['screen' + screen + 'memoryLabelPVW']: label });
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
			fun: (instance, path, _value) => {
				if (!path) return false;
				const input = Array.isArray(path) ? path[4] : path.split('/')[4];
				instance.setVariableValues({
					[input.replace(/^\w+_/, 'INPUT_') + 'label']: instance.device.get([
						'DEVICE', 'device', 'inputList', 'items', input,
						'plugList', 'items', instance.device.get(path),
						'control', 'pp', 'label'
					])
				});
				return true;
			}
		}
	}

	get inputLabel():Subscription {
		return {
			pat: 'DEVICE/device/inputList/items/(\\w+)/plugList/items/\\d+/control/pp/label',
			fun: (instance, path, _value) => {
				if (!path) return false;
				const input = Array.isArray(path) ? path[4] : path.split('/')[4];
				const plug = Array.isArray(path) ? path[7] : path.split('/')[7];
				if (instance.device.get([
					'DEVICE', 'device', 'inputList', 'items', input, 'status', 'pp', 'plug'
				]) == plug) {
					instance.setVariableValues({
						[input.replace(/^\w+_/, 'INPUT_') + 'label']: instance.device.get(path)
					});
					return true;
				} else {
					return false;
				}
			}
		}
	}

	get auxMemoriesChange():Subscription {
		return {
			pat: 'DEVICE/device/preset/auxBank/slotList/items/(\\d{1,4})/status/pp/isValid',
			fun: (): boolean => {
				return true;
			},
		}
	}

	get liveLayerFreeze():Subscription {
		return {
			pat: 'device/screenList/items/S?\\d{1,2}/liveLayerList/items/(\\d{1,2})/control/pp/freeze',
			fbk: 'deviceLayerFreeze',
			ini: (_instance: AWJinstance): string[] => {
				const paths: string[] = [];
				for (let screen = 1; screen <= 4; screen += 1) {
					for (let layer = 1; layer <= 8; layer += 1) {
						paths.push(`DEVICE/device/screenList/items/S${screen}/liveLayerList/items/${layer}/control/pp/freeze`);
					}
				}
				return paths;
			},
			fun: (instance, path, value) => {
				if (!path) return false;
				const screen = Array.isArray(path) ? path[4] : path.split('/')[4];
				const layer = Array.isArray(path) ? path[7] : path.split('/')[7];
				if (value === true) {
					instance.setVariableValues({ [`frozen_${screen}_L${layer}`]: '*' });
				} else if (value === false) {
					instance.setVariableValues({ [`frozen_${screen}_L${layer}`]: ' ' });
				} else if (value === undefined) {
					value = instance.device.get(path);
					instance.setVariableValues({ [`frozen_${screen}_L${layer}`]: value === true ? '*' : ' ' });
				} else {
					instance.setVariableValues({ [`frozen_${screen}_L${layer}`]: '-' });
				}
				return false;
			}
		}
	}

	get backgroundLayerFreeze():Subscription {
		return {
			pat: 'DEVICE/device/screenList/items/(S?\\d{1,2})/background/control/pp/freeze',
			fbk: 'deviceLayerFreeze',
			ini: Array.from({ length: 8 }, (_, i) => 'S' + (i + 1).toString()),
			fun: (instance, path, value) => {
				if (!path) return false;
				const screen = Array.isArray(path) ? path[4] : path.split('/')[4];
				if (value === true) {
					instance.setVariableValues({ [`frozen_${screen}_NATIVE`]: '*' });
				} else if (value === false) {
					instance.setVariableValues({ [`frozen_${screen}_NATIVE`]: ' ' });
				} else if (value === undefined) {
					value = instance.device.get(path);
					instance.setVariableValues({ [`frozen_${screen}_NATIVE`]: value === true ? '*' : ' ' });
				} else {
					instance.setVariableValues({ [`frozen_${screen}_NATIVE`]: '-' });
				}
				return false;
			}
		}
	}

	get screenFreeze():Subscription {
		return {
			pat: 'DEVICE/device/screenList/items/([SA]\\d{1,2})/control/pp/freeze',
			fbk: 'deviceScreenFreeze',
			ini: [
				...Array.from({ length: 8 }, (_, i) => 'S' + (i + 1).toString()),
				...Array.from({ length: 8 }, (_, i) => 'A' + (i + 1).toString()),
			],
			fun: (instance, path, value) => {
				if (!path) return false;
				const screen = Array.isArray(path) ? path[4] : path.split('/')[4];
				if (value === true) {
					instance.setVariableValues({ [`frozen_${screen}`]: '*' });
				} else if (value === false) {
					instance.setVariableValues({ [`frozen_${screen}`]: ' ' });
				} else if (value === undefined) {
					value = instance.device.get(path);
					instance.setVariableValues({ [`frozen_${screen}`]: value === true ? '*' : ' ' });
				} else {
					instance.setVariableValues({ [`frozen_${screen}`]: '-' });
				}
				return false;
			}
		}
	}

	get streamStatus():Subscription {
		return {
			pat: 'DEVICE/device/streaming/status/pp/mode',
			fbk: 'deviceStreaming'
		}
	}

	get standby():Subscription {
		return {
			pat: 'DEVICE/device/system/shutdown/standby/control/pp/xRequest',
			fun: (instance, _path, value) => {
				if (value === 'STANDBY') {
					instance.log('info', 'Device going to standby.');
					instance.updateStatus(InstanceStatus.Ok, 'Standby');
				}
				return false;
			},
		}
	}

	get shutdown():Subscription {
		return {
			pat: 'DEVICE/device/system/shutdown/standby/control/pp/xRequest',
			fun: (instance: AWJinstance, _path?: string | string[], value?: string | string[] | number | boolean): boolean => {
				if (value === 'SWITCH_OFF') {
					instance.log('info', 'Device has been shut down.');
					instance.updateStatus(InstanceStatus.Ok, 'Shut down');
				}
				return false;
			},
		}
	}

	/**
	 * Returns a string with the feedback ID if a feedback exists and runs an action if there is a 'fun' property
	 * @param pat The path in the state object to check if a feedback or action exists for, if undefined checks all possible subscriptions
	 */
	checkForAction(instance: AWJinstance, pat?: string | string[], value?: any): string | string[] | undefined {
		// console.log('Checking for action', pat, value);
		const subscriptions = this.subscriptions
		let path: string
		if (pat === undefined) {
			let update = false
			for (const key of Object.keys(subscriptions)) {
				const subscriptionobj = subscriptions[key]
				if (subscriptionobj.fun && typeof subscriptionobj.fun === 'function') {
					update = subscriptionobj.fun(instance)
				}
			}
			if (update) void instance.updateInstance()
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
			// console.log('found subscription', subscription)
			const subscriptionobj = subscriptions[subscription]
			if (subscriptionobj.fun && typeof subscriptionobj.fun === 'function') {
				// console.log('found subscription fun')
				if (value) {
					const update = subscriptionobj.fun(instance, path, value)
					if (update) void instance.updateInstance()
				} else {
					const update = subscriptionobj.fun(instance, path)
					if (update) void instance.updateInstance()
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
	 * Checks if the subscriptions have a 'fun' and then run it on the path. If there is an 'init' array the path will be run with all items of the array
	 * if any of the subscriptions wants to run updateInstance it will be done at the end
	 * @param subscription specific subscription or all subscriptions if omitted
	 */
	checkSubscriptions(instance: AWJinstance, subscription?: string): void {
		const subscriptions = this.subscriptions
		let update = false

		const checkSub = (sub: string): boolean => {
			let update = false
			const subscriptionobj = subscriptions[sub]
			let pattern = subscriptionobj.pat
			if (subscriptionobj.fun && typeof subscriptionobj.fun === 'function') {
				if (pattern.indexOf('(') === -1) {
					subscriptionobj.fun(instance, pattern)
				} else {
					if (subscriptionobj.ini && Array.isArray(subscriptionobj.ini)) {
						// if ini is array just replace the the one and only capturing group with all the values of the array and run the fun with all resulting paths
						while (pattern.match(/\([^()]+\)/)) {
							pattern = pattern.replace(/\([^()]+\)/g, '*')
						}
						for (const item of subscriptionobj.ini) {
							const upd = subscriptionobj.fun(instance, pattern.replace('*', item))
							if (upd) update = true
						}
					} else if (subscriptionobj.ini && typeof subscriptionobj.ini === 'function') {
						// if ini is a function run fun with all the paths generated by ini
						subscriptionobj.ini(instance).forEach((path: string) => {
							if (subscriptionobj.fun && typeof subscriptionobj.fun === 'function') {
								subscriptionobj.fun(instance, path)
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
			Object.keys(subscriptions).forEach((sub) => checkSub(sub))
			update = true
		}
		
		if (update) {
			void (async () => {
				try {
					void instance.updateInstance()
					instance.checkFeedbacks()
					instance.subscribeFeedbacks()
				} catch (error) {
					instance.log('error', 'Cannot update the instance. '+ error)
				}
			})()
		}
	}

}

