import { InstanceStatus } from '@companion-module/base';
import { AWJinstance } from '../index.js';
import { Subscription } from '../../types/Subscription.js';


export const midraSubscriptions: Record<string, Subscription> = {
	presetToggle: {
		pat: 'DEVICE/device/screenGroupList/items/S1/control/pp/enablePresetToggle',
		fbk: 'presetToggle'
	},
	screenPreset: {
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
	},
	backgroundSet: {
		pat: 'DEVICE/device/screenList/items/((?:S|A)\\d{1,3})/presetList/items/(A|B)/background/source/pp',
		fbk: 'deviceSourceTally',
	},
	screenMemoryChange: {
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
	},
	screenMemoryLabel: {
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
	},
	screenMemoryModifiedChange: {
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
	},
	auxMemoryLabel: {
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
	},
	plugChange: {
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
	},
	inputLabel: {
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
	},
	auxMemoriesChange: {
		pat: 'DEVICE/device/preset/auxBank/slotList/items/(\\d{1,4})/status/pp/isValid',
		fun: (): boolean => {
			return true;
		},
	},
	liveLayerFreeze: {
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
	},
	backgroundLayerFreeze: {
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
	},
	screenFreeze: {
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
	},
	streamStatus: {
		pat: 'DEVICE/device/streaming/status/pp/mode',
		fbk: 'deviceStreaming'
	},
	standby: {
		pat: 'DEVICE/device/system/shutdown/standby/control/pp/xRequest',
		fun: (instance, _path, value) => {
			if (value === 'STANDBY') {
				instance.log('info', 'Device going to standby.');
				instance.updateStatus(InstanceStatus.Ok, 'Standby');
			}
			return false;
		},
	},
	shutdown: {
		pat: 'DEVICE/device/system/shutdown/standby/control/pp/xRequest',
		fun: (instance: AWJinstance, _path?: string | string[], value?: string | string[] | number | boolean): boolean => {
			if (value === 'SWITCH_OFF') {
				instance.log('info', 'Device has been shut down.');
				instance.updateStatus(InstanceStatus.Ok, 'Shut down');
			}
			return false;
		},
	}
};
