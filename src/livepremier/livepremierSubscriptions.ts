import { InstanceStatus } from '@companion-module/base';
import { AWJinstance } from '../index.js';
import { Subscription } from '../../types/Subscription.js';
import { maxScreens, maxAuxScreens, maxInputs } from '../awjdevice/subscriptions.js';


export const livepremierSubscriptions: Record<string, Subscription> = {
	liveselection: {
		pat: 'live/screens/screenAuxSelection',
		fbk: 'liveScreenSelection',
	},
	presetToggle: {
		pat: 'DEVICE/device/screenGroupList/items/S1/control/pp/copyMode',
		fbk: 'presetToggle'
	},
	screenPreset: {
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
	},
	screenMemoryChange: {
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
	},
	screenMemoryModifiedChange: {
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
	},
	screenTransitionTime: {
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
	},
	screenMemoryLabel: {
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
	},
	inputLabel: {
		pat: 'DEVICE/device/inputList/items/IN_(\\d+)/control/pp/label',
		ini: Array.from({ length: maxInputs }, (_, i) => (i + 1).toString()),
		fun: (instance, path, _value) => {
			if (!path) return false;
			const input = Array.isArray(path) ? path[4] : path.split('/')[4];
			instance.setVariableValues({ [input.replace(/^\w+_/, 'INPUT_') + 'label']: instance.device.get(path) });
			return true;
		},
	},
	shutdown: {
		pat: 'DEVICE/device/system/shutdown/cmd/pp/xRequest',
		fun: (instance: AWJinstance, _path?: string | string[], value?: string | string[] | number | boolean): boolean => {
			if (value === 'SHUTDOWN') {
				instance.log('info', 'Device has been shut down.');
				instance.updateStatus(InstanceStatus.Ok, 'Shut down');
			}
			return false;
		},
	}
};
