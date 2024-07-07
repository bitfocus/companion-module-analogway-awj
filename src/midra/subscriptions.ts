import {AWJinstance} from '../index.js'
import { Subscription } from '../../types/Subscription.js'
import { InstanceStatus } from '@companion-module/base'
import Constants from './constants.js'
import Subscriptions from '../awjdevice/subscriptions.js'

/**
 * Class for managing and checking of the subscriptions.
 * A subscription is data of the device associated with a json path in the device model which we are interested in and need to react on changes.
 */
export default class SubscriptionsMidra extends Subscriptions {

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
		// 'gpioOut',
		// 'gpioIn',
		'screenTransitionTime',
		'auxScreenTransitionTime',
		'screenMemoryLabel',
		'masterMemory',
		'masterMemoryLabel',
		'multiviewerMemoryLabel',
		// 'layerMemoryLabel',
		'stillLabel',
		'stillValid',
		'screenLabel',
		'auxscreenLabel',
		'screenEnabled',
		// 'liveInputsChange',
		'masterMemoriesChange',
		'screenMemoriesChange',
		// 'layerMemoriesChange',
		'multiviewerMemoriesChange',
		'layerCountChange',
		'memoryColorChange',
		// LivePremier
		// 'presetToggle',
		// 'screenPreset',
		'screenMemoryModifiedChange',
		'inputLabel',
		'shutdown',
		// Midra
		'presetToggle',
		'backgroundSet',
		'screenMemoryChange',
		// 'screenMemoryLabel',
		// 'screenMemoryModifiedChange',
		// 'auxMemoryLabel',
		'plugChange',
		// 'inputLabel',
		'auxMemoriesChange',
		'liveLayerFreeze',
		'backgroundLayerFreeze',
		'screenFreeze',
		'streamStatus',
		'standby',
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

	get screenTransitionTime():Subscription {
		return {
			pat: 'DEVICE/device/transition/screenList/items/\\d{1,3}/control/pp/takeTime',
			ini: ():string[] => {
				return Array.from({ length: this.constants.maxScreens }, (_, i) => `DEVICE/device/transition/screenList/items/${ i+1 }/control/pp/takeTime`)
			},
			fun: (path, _value) => {
				if (!path) return false
				const screenNumber = Array.isArray(path) ? path[5] : path.split('/')[5]

				this.instance.setVariableValues({
					['screenS' + screenNumber + 'timePVW']: this.instance.deciSceondsToString(this.instance.state.get(path))
				})
				this.instance.setVariableValues({
					['screenS' + screenNumber + 'timePGM']: this.instance.deciSceondsToString(this.instance.state.get(path))
				})
			
				return false
			},
		}
	}

	get auxScreenTransitionTime():Subscription {
		return {
			pat: 'DEVICE/device/transition/auxiliaryScreenList/items/\\d{1,3}/control/pp/takeTime',
			ini: ():string[] => {
				return Array.from({ length: this.constants.maxAuxScreens }, (_, i) => `DEVICE/device/transition/auxiliaryScreenList/items/${ i+1 }/control/pp/takeTime`)
			},
			fun: (path, _value) => {
				if (!path) return false
				const screenNumber = Array.isArray(path) ? path[5] : path.split('/')[5]

				this.instance.setVariableValues({
					['screenA' + screenNumber + 'timePVW']: this.instance.deciSceondsToString(this.instance.state.get(path))
				})
				this.instance.setVariableValues({
					['screenA' + screenNumber + 'timePGM']: this.instance.deciSceondsToString(this.instance.state.get(path))
				})
			
				return false
			},
		}
	}

	get screenMemoryLabel():Subscription {
		return {
			pat: 'DEVICE/device/preset/bank/slotList/items/(\\d{1,4})/control/pp/label',
			ini: Array.from({ length: this.constants.maxScreenMemories }, (_, i) => (i + 1).toString()),
			fun: (path, _value) => {
				if (!path) return false
				const memory = Array.isArray(path) ? path[6] : path.split('/')[6] || '0'
				const label = memory.toString() !== '0' ? this.instance.state.get(path) : ''
				this.instance.setVariableValues({['screenMemory' + memory + 'label']:  label})
				
				const screens = this.instance.choices.getChosenScreens('all')

				for (const screen of screens) {
					const pgmmem = this.instance.state.getUnmapped([
						'DEVICE',
						'device',
						'screenList', 'items', screen.replace(/\D/g, ''),
						'presetList', 'items', this.instance.state.getUnmapped('LOCAL/screens/' + screen + '/pgm/preset'),
						'status','pp','memoryId'
					])
					if (memory == pgmmem) {
						this.instance.setVariableValues({['screen' + screen + 'memoryLabelPGM']:  label})
					}
					const pvwmem = this.instance.state.getUnmapped([
						'DEVICE',
						'device',
						'screenList', 'items', screen.replace(/\D/g, ''),
						'presetList', 'items', this.instance.state.getUnmapped('LOCAL/screens/' + screen + '/pvw/preset'),
						'status','pp','memoryId'
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
			pat: 'DEVICE/device/preset/masterBank/status/lastUsed/presetModeList/items/(PROGRAM|PREVIEW)/pp/memoryId',
			ini: ['PROGRAM', 'PREVIEW'],
			fbk: 'deviceMasterMemory',
		}
	}

	get masterMemoryLabel():Subscription {
		return {
			pat: 'DEVICE/device/preset/masterBank/slotList/items/(\\d+)/control/pp/label',
			ini: Array.from({ length: 49 }, (_, i) => (i + 1).toString()),
			fun: (path, _value) => {
				if (!path) return false
				const memory = Array.isArray(path) ? path[6] : path.split('/')[6]
				this.instance.setVariableValues({['masterMemory' + memory + 'label']:  this.instance.state.get(path)})
				return true
			},
		}
	}

	get multiviewerMemoryLabel():Subscription {
		return {
			pat: 'DEVICE/device/multiviewer/bankList/item/(\\d+)/control/pp/label',
			ini: Array.from({ length: 49 }, (_, i) => (i + 1).toString()),
			fun: (path, _value) => {
				if (!path) return false
				const memory = Array.isArray(path) ? path[5] : path.split('/')[5]
				this.instance.setVariableValues({['multiviewerMemory' + memory + 'label']:  this.instance.state.get(path)})
				return true
			},
		}
	}

	get stillLabel():Subscription {
		return {
			pat: 'DEVICE/device/stillLibrary/bankList/items/(\\d+)/control/pp/label',
			ini: Array.from({ length: this.constants.maxStills }, (_, i) => (i + 1).toString()),
			fun: (path, _value) => {
				if (!path) return false
				const input = Array.isArray(path) ? path[5] : path.split('/')[5]
				this.instance.setVariableValues({['STILL_' + input + 'label']:  this.instance.state.getUnmapped(path)})
				return true
			},
		}
	}

	get stillValid():Subscription {
		return {
			pat: 'DEVICE/device/stillLibrary/bankList/items/(\\d+)/status/pp/isValid',
			fun: (_path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
				return true
			},
		}
	}

	get screenLabel():Subscription {
		return {
			pat: 'DEVICE/device/screenList/items/(\\d{1,2})/control/pp/label',
			ini: Array.from({ length: this.constants.maxScreens }, (_, i) => (i + 1).toString()),
			fun: (path, _value) => {
				if (!path) return false
				const input = Array.isArray(path) ? path[4] : path.split('/')[4]
				this.instance.setVariableValues({['SCREEN_' + input + 'label']:  this.instance.state.getUnmapped(path)})
				this.instance.setVariableValues({['screenS' + input + 'label']:  this.instance.state.getUnmapped(path)})
				return true
			},
		}
	}

	get auxscreenLabel():Subscription {
		return {
			pat: 'DEVICE/device/auxiliaryScreenList/items/(\\d{1,2})/control/pp/label',
			ini: Array.from({ length: this.constants.maxAuxScreens }, (_, i) => (i + 1).toString()),
			fun: (path, _value) => {
				if (!path) return false
				const input = Array.isArray(path) ? path[4] : path.split('/')[4]
				this.instance.setVariableValues({['AUXSCREEN_' + input + 'label']:  this.instance.state.getUnmapped(path)})
				this.instance.setVariableValues({['screenA' + input + 'label']:  this.instance.state.getUnmapped(path)})
				return true
			},
		}
	}

	get masterMemoriesChange():Subscription {
		return {
			pat: 'DEVICE/device/preset/masterBank/slotList/items/(\\d{1,3})/status/pp/isValid',
			fun: (_path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
				return true
			},
		}
	}

	get screenMemoriesChange():Subscription {
		return {
			pat: 'DEVICE/device/preset/bank/slot/List/items/(\\d{1,3})/status/pp/isValid',
			fun: (_path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
				return true
			},
		}
	}

	get multiviewerMemoriesChange():Subscription {
		return {
			pat: 'DEVICE/device/multiviewer/bankList/items/(\\d{1,2})/status/pp/isValid',
			fun: (_path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
				return true
			},
		}
	}

	get layerCountChange():Subscription {
		return {
			pat: 'DEVICE/device/preconfig/status/stateList/items/CURRENT/screenList/items/\\d/liveLayerList/items/\\d/pp/mode',
			fun: (_path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
				return true
			},
		}
	}

	get presetToggle():Subscription {
		return {
			pat: 'DEVICE/device/transition/screenList/items/1/control/pp/enablePresetToggle',
			fbk: 'presetToggle'
		}
	}

	get screenPreset():Subscription {
		return {
			pat: 'DEVICE/device/transition/(auxiliaryS|s)creenList/items/\\d+/status/pp/transition',
			fbk: 'deviceTake',
			ini: () => [
				...Array.from({ length: this.constants.maxScreens }, (_, i) => `DEVICE/device/transition/screenList/items/${i+1}/status/pp/transition`),
				...Array.from({ length: this.constants.maxAuxScreens }, (_, i) => `DEVICE/device/transition/auxiliaryScreenList/items/${i+1}/status/pp/transition`),
			],
			fun: (path, _value) => {
				const setMemoryVariables = (preset: string, variableSuffix: string): void => {
					const mem = this.instance.state.getUnmapped([
						'DEVICE',
						'device',
						...screenpath,
						'presetList', 'items', preset,
						'status', 'pp', 'memoryId',
					])
					const modified = this.instance.state.getUnmapped([
						'DEVICE',
						'device',
						...screenpath,
						'presetList', 'items', preset,
						'status', 'pp', 'isModified',
					])
					this.instance.setVariableValues({ ['screen' + prefix + screenNum + 'memory' + variableSuffix]: mem ? 'M' + mem : '' });
					this.instance.setVariableValues({ ['screen' + prefix + screenNum + 'memoryModified' + variableSuffix]: mem && modified ? '*' : '' });
					this.instance.setVariableValues({
						['screen' + prefix + screenNum + 'memoryLabel' + variableSuffix]: mem
							? this.instance.state.getUnmapped(['DEVICE', 'device', 'presetBank', 'bankList', 'items', mem, 'control', 'pp', 'label'])
							: ''
					});
				}

				let patharr: string[];
				if (typeof path === 'string') {
					patharr = path.split('/');
				} else if (Array.isArray(path)) {
					patharr = path;
				} else {
					return false;
				}
				const val = this.instance.state.getUnmapped(patharr);
				const screenpath = patharr.slice(3,6) // (auxiliaryS|s)creenList/items/\\d+
				const screenNum = patharr[5];
				const prefix = patharr[3].charAt(0).toUpperCase()
				let program = '', preview = ''
				const takeTime = this.instance.deciSceondsToString(
						this.instance.state.getUnmapped(['DEVICE', 'device', 'transition', ...screenpath, 'control', 'pp', 'takeTime'])
					)

				if (val === 'AT_UP') {
					program = 'UP' // B
					preview = 'DOWN' // A
					this.instance.state.setUnmapped(`LOCAL/screens/${prefix}${screenNum}/pgm/preset`, program);
					this.instance.state.setUnmapped(`LOCAL/screens/${prefix}${screenNum}/pvw/preset`, preview);
					
					this.instance.setVariableValues({ ['screen' + prefix + screenNum + 'timePGM']: takeTime } )
					this.instance.setVariableValues({ ['screen' + prefix + screenNum + 'timePVW']: takeTime } )
					
					setMemoryVariables(program, 'PGM');
					setMemoryVariables(preview, 'PVW');
				}
				if (val === 'AT_DOWN') {
					program = 'DOWN' // A
					preview = 'UP' // B
					this.instance.state.setUnmapped(`LOCAL/screens/${prefix}${screenNum}/pgm/preset`, program);
					this.instance.state.setUnmapped(`LOCAL/screens/${prefix}${screenNum}/pvw/preset`, preview);

					this.instance.setVariableValues({ ['screen' + prefix + screenNum + 'timePGM']: takeTime } )
					this.instance.setVariableValues({ ['screen' + prefix + screenNum + 'timePVW']: takeTime } )
					
					setMemoryVariables(program, 'PGM');
					setMemoryVariables(preview, 'PVW');
				}
				this.instance.checkFeedbacks('deviceSourceTally', 'deviceScreenMemory', 'deviceTake');
				return false;
			},
		}
	}

	get backgroundSet():Subscription {
		return {
			pat: 'DEVICE/device/(?:auxiliaryS|s)creenList/items/\\d{1,2}/presetList/items/(?:UP|DOWN)/background/source/pp',
			fbk: 'deviceSourceTally',
		}
	}

	get screenMemoryChange():Subscription {
		return {
			pat: 'DEVICE/device/screenList/items/\\d{1,3}/presetList/items/(UP|DOWN)/status/pp/memoryId',
			fbk: 'deviceScreenMemory',
			fun: (path, value) => {
				if (!path) return false;
				const screen = Array.isArray(path) ? path[4] : path.split('/')[4];
				const pres = Array.isArray(path) ? path[7] : path.split('/')[7];
				const presname = pres === this.instance.state.getUnmapped(`LOCAL/screens/${screen}/pgm/preset`) ? 'PGM' : 'PVW';
				const memorystr = value ? value.toString() : '';
				this.instance.setVariableValues({ ['screen' + screen + 'memory' + presname]: memorystr });
				this.instance.setVariableValues({
					['screenS' + screen + 'memoryLabel' + presname]: memorystr !== ''
						? this.instance.state.getUnmapped([
							'DEVICE',
							'device',
							'preset',
							'bank',
							'slotList',
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
			pat: 'DEVICE/device/screenList/items/\\d{1,3}/presetList/items/(UP|DOWN)/status/pp/isModified',
			fbk: 'deviceScreenMemory',
			fun: (path, _value) => {
				if (!path) return false;
				const screen = Array.isArray(path) ? path[4] : path.split('/')[4];
				const pres = Array.isArray(path) ? path[7] : path.split('/')[7];
				const presname = pres === this.instance.state.getUnmapped(`LOCAL/screens/${screen}/pgm/preset`) ? 'PGM' : 'PVW';
				this.instance.setVariableValues({
					['screenS' + screen + 'memoryModified' + presname]: this.instance.state.getUnmapped(
						'DEVICE/device/screenList/items/' + screen + '/presetList/items/' + pres + '/status/pp/memoryId'
					) && this.instance.state.get(path)
						? '*'
						: ''
				});
				return false;
			},
		}
	}

	get plugChange(): Subscription {
		return {
			pat: 'DEVICE/device/inputList/items/(\\w+)/status/pp/plug',
			ini: Array.from({ length: this.constants.maxInputs }, (_, i) => 'INPUT_' + (i + 1)),
			fun: (path, _value) => {
				if (!path) return false;
				const input = Array.isArray(path) ? path[4] : path.split('/')[4];
				this.instance.setVariableValues({
					[input.replace(/^\w+_/, 'INPUT_') + 'label']: this.instance.state.getUnmapped([
						'DEVICE', 'device', 'inputList', 'items', input,
						'plugList', 'items', this.instance.state.getUnmapped(path),
						'control', 'pp', 'label'
					])
				});
				return true;
			}
		}
	}

	get inputLabel(): Subscription {
		return {
			pat: 'DEVICE/device/inputList/items/INPUT_\\d+/plugList/items/\\d+/control/pp/label',
			fun: (path, _value) => {
				if (!path) return false;
				const input = Array.isArray(path) ? path[4] : path.split('/')[4];
				const plug = Array.isArray(path) ? path[7] : path.split('/')[7];
				if (this.instance.state.getUnmapped([
					'DEVICE', 'device', 'inputList', 'items', input, 'status', 'pp', 'plug'
				]) == plug) {
					this.instance.setVariableValues({
						[input.replace(/^\w+_/, 'INPUT_') + 'label']: this.instance.state.getUnmapped(path)
					});
					return true;
				} else {
					return false;
				}
			}
		}
	}

	get auxMemoriesChange(): Subscription {
		return {
			pat: 'DEVICE/device/preset/auxBank/slotList/items/(\\d{1,4})/status/pp/isValid',
			fun: (): boolean => {
				return true;
			},
		}
	}

	get liveLayerFreeze(): Subscription {
		return {
			pat: 'device/screenList/items/\\d{1,2}/liveLayerList/items/(\\d{1,2})/control/pp/freeze',
			fbk: 'deviceLayerFreeze',
			ini: (): string[] => {
				const paths: string[] = [];
				for (let screen = 1; screen <= this.constants.maxScreens; screen += 1) {
					for (let layer = 1; layer <= this.constants.maxLayers; layer += 1) {
						paths.push(`DEVICE/device/screenList/items/${screen}/liveLayerList/items/${layer}/control/pp/freeze`);
					}
				}
				return paths;
			},
			fun: (path, value) => {
				if (!path) return false;
				const screen = Array.isArray(path) ? path[4] : path.split('/')[4];
				const layer = Array.isArray(path) ? path[7] : path.split('/')[7];
				if (value === true) {
					this.instance.setVariableValues({ [`frozen_S${screen}_L${layer}`]: '*' });
				} else if (value === false) {
					this.instance.setVariableValues({ [`frozen_S${screen}_L${layer}`]: ' ' });
				} else if (value === undefined) {
					value = this.instance.state.getUnmapped(path);
					this.instance.setVariableValues({ [`frozen_S${screen}_L${layer}`]: value === true ? '*' : ' ' });
				} else {
					this.instance.setVariableValues({ [`frozen_S${screen}_L${layer}`]: '-' });
				}
				return false;
			}
		}
	}

	get backgroundLayerFreeze(): Subscription {
		return {
			pat: 'DEVICE/device/screenList/items/(\\d{1,2})/background/control/pp/freeze',
			fbk: 'deviceLayerFreeze',
			ini: Array.from({ length: this.constants.maxScreens }, (_, i) => (i + 1).toString()),
			fun: (path, value) => {
				if (!path) return false;
				const screen = Array.isArray(path) ? path[4] : path.split('/')[4];
				if (value === true) {
					this.instance.setVariableValues({ [`frozen_S${screen}_NATIVE`]: '*' });
				} else if (value === false) {
					this.instance.setVariableValues({ [`frozen_S${screen}_NATIVE`]: ' ' });
				} else if (value === undefined) {
					value = this.instance.state.getUnmapped(path);
					this.instance.setVariableValues({ [`frozen_S${screen}_NATIVE`]: value === true ? '*' : ' ' });
				} else {
					this.instance.setVariableValues({ [`frozen_S${screen}_NATIVE`]: '-' });
				}
				return false;
			}
		}
	}

	get screenFreeze(): Subscription {
		return {
			pat: 'DEVICE/device/(auxiliaryS|s)creenList/items/\\d{1,2}/control/pp/freeze',
			fbk: 'deviceScreenFreeze',
			ini: () => [
				...Array.from({ length: this.constants.maxScreens },
					(_, i) => `DEVICE/device/screenList/items/${i+1}/control/pp/freeze`),
				...Array.from({ length: this.constants.maxAuxScreens }, 
					(_, i) => `DEVICE/device/auxiliaryScreenList/items/${i+1}/control/pp/freeze`),
			],
			fun: (path, value) => {
				if (!path) return false;
				const prefix = (Array.isArray(path) ? path[2] : path.split('/')[2]).charAt(0).toUpperCase()
				const screenNum = Array.isArray(path) ? path[4] : path.split('/')[4];
				if (value === true) {
					this.instance.setVariableValues({ [`frozen_${prefix}${screenNum}`]: '*' });
				} else if (value === false) {
					this.instance.setVariableValues({ [`frozen_${prefix}${screenNum}`]: ' ' });
				} else if (value === undefined) {
					value = this.instance.state.get(path);
					this.instance.setVariableValues({ [`frozen_${prefix}${screenNum}`]: value === true ? '*' : ' ' });
				} else {
					this.instance.setVariableValues({ [`frozen_${prefix}${screenNum}`]: '-' });
				}
				return false;
			}
		}
	}

	get streamStatus(): Subscription {
		return {
			pat: 'DEVICE/device/streaming/status/pp/mode',
			fbk: 'deviceStreaming'
		}
	}

	get standby(): Subscription {
		return {
			pat: 'DEVICE/device/system/shutdown/standby/control/pp/xRequest',
			fun: (_path, value) => {
				if (value === 'STANDBY') {
					this.instance.log('info', 'Device going to standby.');
					this.instance.updateStatus(InstanceStatus.Ok, 'Standby');
				}
				return false;
			},
		}
	}

	get shutdown(): Subscription {
		return {
			pat: 'DEVICE/device/system/shutdown/standby/control/pp/xRequest',
			fun: (_path, value) => {
				if (value === 'SWITCH_OFF') {
					this.instance.log('info', 'Device has been shut down.');
					this.instance.updateStatus(InstanceStatus.Ok, 'Shut down');
				}
				return false;
			},
		}
	}

}

