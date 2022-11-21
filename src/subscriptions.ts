import AWJinstance from './index'
import { State } from './state'
// import { DeviceMap, DeviceMappingFunction } from '../types/DeviceMap';

/**
 * This object holds all the paths we need to react on when receiving an update from the devive
 * @property pat - The path to subscribe for changes in JSON-Path like notation. It will be regex tested against the actual path.
 * Path nodes prefixed with $ are lists and the $ is replaced in the object by a trailing 'List'. Each list has a subarray 'itemKeys' which holds all item names and a suboject 'items' which hold named objects according to those names.
 * In the path those names are referenced with '@'. E.g. $screen/@items/S1 --> { screenList: {items: {S1: { ... }}}
 * @property fbk - id of the feedback to check if that path is updated, can be a string with one feedback or an array with multiple feedbacks
 * @property fun - Gives a function which is called with the path and eventually the value. Some subscriptions are used only for updating the internal state, some are used to fill variables and/or feedback. Can return true to run update afterwards.
 * @property def - Default value to use if not connected to a real device
 * @property {string[][]} defitems - Default items to use if not connected to a real device. Outer array for the item lists, inner array for the items in the list.
 */
const commonSubscriptions = {
	syncselection: {
		pat: 'system/network/websocketServer/clients',
		fbk: 'syncselection',
	},
	liveselection: {
		pat: 'live/screens/screenAuxSelection',
		fbk: 'liveScreenSelection',
	},
	layerselection: {
		pat: 'live/screens/layerSelection/layerIds',
		fbk: 'remoteLayerSelection',
	},
	widgetSelection: {
		pat: 'live/multiviewers?/widgetSelection',
		fbk: 'remoteWidgetSelection',
	},
	screenLock: {
		pat: 'live/screens/presetModeLock/PR',
		fbk: 'liveScreenLock',
	},
	sourceVisibility: {
		pat: 'device/(auxiliaryS|s)creenList/items/(S|A)?(\\d{1,3})/presetList/items/(\\w+)/l(iveL)?ayerList/items/(\\d{1,3}|NATIVE)/(source|position|opacity|cropping)',
		fbk: 'deviceSourceTally',
	},
	selectedPreset: {
		pat: '/live/screens/presetModeSelection/presetMode',
		fbk: ['livePresetSelection', 'remoteLayerSelection'],
	},
	inputFreeze: {
		pat: 'device/inputList/items/(\\w+?)/control/pp/freeze',
		fbk: 'deviceInputFreeze',
	},
	timerState: {
		pat: 'DEVICE/device/timerList/items/TIMER_(\\d)/status/pp/state',
		fbk: 'timerState',
		ini: ['1', '2', '3', '4'],
		fun: (instance: AWJinstance, path: string | string[], _value?: string | string[] | number | boolean): boolean => {
			if (!path) return
			const timer = path?.toString().match(/TIMER_(\d)\//)[1] ?? 0
			instance.setVariable('timer' + timer + '_status', instance.state.getUnmapped(path))
			return false
		},
	},
	gpioOut: {
		pat: 'device/gpio/gpoList/items/(\\d)/status/pp/state',
		fbk: 'deviceGpioOut',
	},
	gpioIn: {
		pat: 'device/gpio/gpiList/items/(\\d)/status/pp/state',
		fbk: 'deviceGpioIn',
	},
	screenTransitionTime: {
		pat: 'DEVICE/device/screenGroupList/items/((?:S|A)\\d{1,3})/control/pp/take(?:Up|Down)?Time',
		ini: (instance: AWJinstance):string[] => {
			let presets: string[] = []
			if (instance.state.platform === 'livepremier') presets = ['takeUpTime', 'takeDownTime']
			if (instance.state.platform === 'midra') presets = ['takeTime']
			const screens: string[] = [
				...Array.from({ length: 24 }, (_, i) => 'S' + (i + 1).toString()),
				...Array.from({ length: 24 }, (_, i) => 'A' + (i + 1).toString()),
				]
			const paths =  screens.reduce((cb: string[], screen) => cb.concat(presets.map((preset) => {
				return 'DEVICE/device/screenGroupList/items/'+ screen +'/control/pp/'+ preset
			})), [])
			return paths
		},
		fun: (instance: AWJinstance, path: string | string[], _value?: string | string[] | number | boolean): boolean => {
			if (!path) return false
			const screen = Array.isArray(path) ? path[4] : path.split('/')[4]
			const pres = Array.isArray(path) ? path[7] : path.split('/')[7]
			if (pres === 'takeUpTime') {
				const presname = 'B' === instance.state.getUnmapped(`LOCAL/screens/${screen}/pgm/preset`) ? 'PVW' : 'PGM'
				instance.setVariable(
					'screen' + screen + 'time' + presname,
					instance.deciSceondsToString(instance.state.get(path))
				)
			}
			if (pres === 'takeDownTime') {
				const presname = 'A' === instance.state.getUnmapped(`LOCAL/screens/${screen}/pgm/preset`) ? 'PVW' : 'PGM'
				instance.setVariable(
					'screen' + screen + 'time' + presname,
					instance.deciSceondsToString(instance.state.get(path))
				)
			}
			if (pres === 'takeTime') {
				instance.setVariable(
					'screen' + screen + 'timePVW',
					instance.deciSceondsToString(instance.state.get(path))
				)
				instance.setVariable(
					'screen' + screen + 'timePGM',
					instance.deciSceondsToString(instance.state.get(path))
				)
			}
			
			
			return false
		},
	},
	screenMemoryLabel: {
		pat: 'DEVICE/device/presetBank/bankList/items/(\\d+)/control/pp/label',
		ini: Array.from({ length: 999 }, (_, i) => (i + 1).toString()),
		fun: (instance: AWJinstance, path: string | string[], _value?: string | string[] | number | boolean): boolean => {
			if (!path) return false
			const memory = Array.isArray(path) ? path[5] : path.split('/')[5]
			const label = memory.toString() !== '0' ? instance.state.get(path) : ''
			instance.setVariable('screenMemory' + memory + 'label', label)
			const map: Record<string, unknown> = {
				livepremier: { id: ['presetId','status','pp','id']},
				midra: {id: ['status','pp','memoryId']}
			}
			let screens: string[] = []
			if (instance.state.platform === 'livepremier') screens = instance.state.getChosenScreenAuxes('all')
			if (instance.state.platform === 'midra') screens = instance.state.getChosenScreens('all')

			for (const screen of screens) {
				const pgmmem = instance.state.get([
					'DEVICE',
					'device',
					'screenList',
					'items',
					screen,
					'presetList',
					'items',
					instance.state.getUnmapped('LOCAL/screens/' + screen + '/pgm/preset'),
					...map[instance.state.platform].id
				])
				if (memory == pgmmem) {
					instance.setVariable('screen' + screen + 'memoryLabelPGM', label)
				}
				const pvwmem = instance.state.get([
					'DEVICE',
					'device',
					'screenList',
					'items',
					screen,
					'presetList',
					'items',
					instance.state.getUnmapped('LOCAL/screens/' + screen + '/pvw/preset'),
					...map[instance.state.platform].id
				])
				if (memory == pvwmem) {
					instance.setVariable('screen' + screen + 'memoryLabelPVW', label)
				}
			}
			return true
		},
	},
	masterMemory: {
		pat: 'DEVICE/device/masterPresetBank/status/lastUsed/presetModeList/items/(PROGRAM|PREVIEW)/pp/memoryId',
		fbk: 'deviceMasterMemory',
	},
	masterMemoryLabel: {
		pat: 'DEVICE/device/masterPresetBank/bankList/items/(\\d+)/control/pp/label',
		ini: Array.from({ length: 499 }, (_, i) => (i + 1).toString()),
		fun: (instance: AWJinstance, path: string | string[], _value?: string | string[] | number | boolean): boolean => {
			if (!path) return false
			const memory = Array.isArray(path) ? path[5] : path.split('/')[5]
			instance.setVariable('masterMemory' + memory + 'label', instance.state.get(path))
			return true
		},
	},
	multiviewerMemoryLabel: {
		pat: 'DEVICE/device/monitoringBank/bankList/items/(\\d+)/control/pp/label',
		ini: Array.from({ length: 49 }, (_, i) => (i + 1).toString()),
		fun: (instance: AWJinstance, path: string | string[], _value?: string | string[] | number | boolean): boolean => {
			if (!path) return
			const memory = Array.isArray(path) ? path[5] : path.split('/')[5]
			instance.setVariable('multiviewerMemory' + memory + 'label', instance.state.get(path))
			return true
		},
	},
	layerMemoryLabel: {
		pat: 'DEVICE/device/layerBank/bankList/items/(\\d+)/control/pp/label',
		ini: Array.from({ length: 49 }, (_, i) => (i + 1).toString()),
		fun: (instance: AWJinstance, path: string | string[], _value?: string | string[] | number | boolean): boolean => {
			if (!path) return
			const memory = Array.isArray(path) ? path[5] : path.split('/')[5]
			instance.setVariable('layerMemory' + memory + 'label', instance.state.get(path))
			return true
		},
	},
	stillLabel: {
		pat: 'DEVICE/device/stillList/items/(\\d+)/control/pp/label',
		ini: Array.from({ length: 47 }, (_, i) => (i + 1).toString()),
		fun: (instance: AWJinstance, path: string | string[], _value?: string | string[] | number | boolean): boolean => {
			if (!path) return
			const input = Array.isArray(path) ? path[4] : path.split('/')[4]
			instance.setVariable('STILL_' + input + 'label', instance.state.get(path))
			return true
		},
	},
	stillValid: {
		pat: 'DEVICE/device/stillList/items/(\\d+)/status/pp/isValid',
		fun: (_instance: AWJinstance, _path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
			return true
		},
	},
	screenLabel: {
		pat: 'DEVICE/device/screenList/items/S(\\d{1,2})/control/pp/label',
		ini: Array.from({ length: 23 }, (_, i) => (i + 1).toString()),
		fun: (instance: AWJinstance, path: string | string[], _value?: string | string[] | number | boolean): boolean => {
			if (!path) return
			const input = Array.isArray(path) ? path[4] : path.split('/')[4]
			instance.setVariable(input.replace('S', 'SCREEN_') + 'label', instance.state.get(path))
			instance.setVariable('screen' + input + 'label', instance.state.get(path))
			return true
		},
	},
	auxscreenLabel: {
		pat: 'DEVICE/device/screenList/items/A(\\d{1,2})/control/pp/label',
		ini: Array.from({ length: 23 }, (_, i) => (i + 1).toString()),
		fun: (instance: AWJinstance, path: string | string[], _value?: string | string[] | number | boolean): boolean => {
			if (!path) return
			const input = Array.isArray(path) ? path[4] : path.split('/')[4]
			instance.setVariable(input.replace('A', 'AUXSCREEN_') + 'label', instance.state.getUnmapped(path))
			instance.setVariable('screen' + input + 'label', instance.state.getUnmapped(path))
			return true
		},
	},
	screenEnabled: {
		pat: 'device/screenList/items/((?:S|A)\\d{1,3})/status/pp/mode',
		fun: (_instance: AWJinstance, _path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
			return true
		},
	},
	liveInputsChange: {
		pat: 'DEVICE/device/inputList/items/IN_(\\d{1,2})/status/pp/isEnabled',
		fun: (_instance: AWJinstance, _path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
			return true
		},
	},
	masterMemoriesChange: {
		pat: 'DEVICE/device/masterPresetBank/bankList/items/(\\d{1,3})/status/pp/isValid',
		fun: (_instance: AWJinstance, _path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
			return true
		},
	},
	screenMemoriesChange: {
		pat: 'DEVICE/device/presetBank/bankList/items/(\\d{1,4})/status/pp/isValid',
		fun: (_instance: AWJinstance, _path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
			return true
		},
	},
	layerMemoriesChange: {
		pat: 'DEVICE/device/layerBank/bankList/items/(\\d{1,3})/status/pp/isValid',
		fun: (_instance: AWJinstance, _path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
			return true
		},
	},
	multiviewerMemoriesChange: {
		pat: 'DEVICE/device/monitoringBank/bankList/items/(\\d{1,3})/status/pp/isValid',
		fun: (_instance: AWJinstance, _path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
			return true
		},
	},
	layerCountChange: {
		pat: 'DEVICE/device/screenList/items/((?:S|A)\\d{1,2})/status/pp/layerCount',
		fun: (_instance: AWJinstance, _path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
			return true
		},
	},
	memoryColorChange: {
		pat: 'banks/(\\w+)/items/(\\d+)/color',
		fun: (_instance: AWJinstance, _path?: string | string[], _value?: string | string[] | number | boolean): boolean => {
			return true
		},
	},
}

const livepremierSubscriptions = {
	liveselection: {
		pat: 'live/screens/screenAuxSelection',
		fbk: 'liveScreenSelection',
	},
	screenPreset: {
		pat: 'DEVICE/device/screenGroupList/items/(\\w+?)/status/pp/transition',
		fbk: 'deviceTake',
		ini: [
			...Array.from({ length: 24 }, (_, i) => 'S' + (i + 1).toString()),
			...Array.from({ length: 24 }, (_, i) => 'A' + (i + 1).toString()),
		],
		fun: (instance: AWJinstance, path: string | string[], _value?: string | string[] | number | boolean): boolean => {
			const setMemoryVariables = (screen: string, preset: string, variableSuffix: string): void => {
				let mem = instance.state.getUnmapped([
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
				])
				let unmodified = instance.state.getUnmapped([
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
				])
				instance.setVariable('screen' + screen + 'memory' + variableSuffix, mem ? 'M' + mem : '')
				instance.setVariable('screen' + screen + 'memoryModified' + variableSuffix, mem && !unmodified ? '*' : '')
				instance.setVariable(
					'screen' + screen + 'memoryLabel' + variableSuffix,
					mem
						? instance.state.getUnmapped(['DEVICE', 'device', 'presetBank', 'bankList', 'items', mem, 'control', 'pp', 'label'])
						: ''
				)
			}
			let patharr: string[]
			if (typeof path === 'string') {
				patharr = path.split('/')
			} else if (Array.isArray(path)) {
				patharr = path
			} else {
				return
			}
			const val = instance.state.getUnmapped(patharr)
			const screen = patharr[4]
			let program = '', preview = ''
			if (val === 'AT_UP') {
				program = 'B'
				preview = 'A'
				instance.state.setUnmapped(`LOCAL/screens/${screen}/pgm/preset`, program)
				instance.state.setUnmapped(`LOCAL/screens/${screen}/pvw/preset`, preview)
				instance.setVariable(
					'screen' + screen + 'timePGM',
					instance.deciSceondsToString(
						instance.state.getUnmapped(['DEVICE', 'device', 'screenGroupList', 'items', screen, 'control', 'pp', 'takeUpTime'])
					)
				)
				instance.setVariable(
					'screen' + screen + 'timePVW',
					instance.deciSceondsToString(
						instance.state.getUnmapped([
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
				)
				setMemoryVariables(screen, program, 'PGM')
				setMemoryVariables(screen, preview, 'PVW')
			}
			if (val === 'AT_DOWN') {
				program = 'A'
				preview = 'B'
				instance.state.setUnmapped(`LOCAL/screens/${screen}/pgm/preset`, program)
				instance.state.setUnmapped(`LOCAL/screens/${screen}/pvw/preset`, preview)
				instance.setVariable(
					'screen' + screen + 'timePGM',
					instance.deciSceondsToString(
						instance.state.getUnmapped([
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
				)
				instance.setVariable(
					'screen' + screen + 'timePVW',
					instance.deciSceondsToString(
						instance.state.getUnmapped(['DEVICE', 'device', 'screenGroupList', 'items', screen, 'control', 'pp', 'takeUpTime'])
					)
				)
				setMemoryVariables(screen, program, 'PGM')
				setMemoryVariables(screen, preview, 'PVW')
			}
			instance.checkFeedbacks('deviceSourceTally', 'deviceScreenMemory', 'deviceTake')
			return false
		},
	},
	screenMemoryChange: {
		pat: 'DEVICE/device/screenList/items/(S|A)\\d{1,3}/presetList/items/(A|B)/presetId/status/pp/id',
		fbk: 'deviceScreenMemory',
		fun: (instance: AWJinstance, path: string | string[], _value?: string | string[] | number | boolean): boolean => {
			if (!path) return
			const screen = Array.isArray(path) ? path[4] : path.split('/')[4]
			const pres = Array.isArray(path) ? path[7] : path.split('/')[7]
			const presname = pres === instance.state.getUnmapped(`LOCAL/screens/${screen}/pgm/preset`) ? 'PGM' : 'PVW'
			const memorystr = instance.state.getUnmapped(path).toString() !== '0' ? 'M' + instance.state.getUnmapped(path) : ''
			instance.setVariable('screen' + screen + 'memory' + presname, memorystr)
			instance.setVariable(
				'screen' + screen + 'memoryLabel' + presname,
				instance.state.getUnmapped(path).toString() !== '0'
					? instance.state.getUnmapped([
							'DEVICE',
							'device',
							'presetBank',
							'bankList',
							'items',
							instance.state.getUnmapped(path).toString(),
							'control',
							'pp',
							'label',
					  ])
					: ''
			)
			return false
		},
	},
	screenMemoryModifiedChange: {
		pat: 'DEVICE/device/screenList/items/((?:S|A)\\d{1,3})/presetList/items/(A|B)/presetId/status/pp/isNotModified',
		fbk: 'deviceScreenMemory',
		fun: (instance: AWJinstance, path: string | string[], _value?: string | string[] | number | boolean): boolean => {
			if (!path) return
			const screen = Array.isArray(path) ? path[4] : path.split('/')[4]
			const pres = Array.isArray(path) ? path[7] : path.split('/')[7]
			const presname = pres === instance.state.getUnmapped(`LOCAL/screens/${screen}/pgm/preset`) ? 'PGM' : 'PVW'
			instance.setVariable(
				'screen' + screen + 'memoryModified' + presname,
				instance.state.getUnmapped(
					'DEVICE/device/screenList/items/' + screen + '/presetList/items/' + pres + '/presetId/status/pp/id'
				) && !instance.state.getUnmapped(path)
					? '*'
					: ''
			)
			return false
		},
	},
	inputLabel: {
		pat: 'DEVICE/device/inputList/items/IN_(\\d+)/control/pp/label',
		ini: Array.from({ length: 32 }, (_, i) => (i + 1).toString()),
		fun: (instance: AWJinstance, path: string | string[], _value?: string | string[] | number | boolean): boolean => {
			if (!path) return
			const input = Array.isArray(path) ? path[4] : path.split('/')[4]
			instance.setVariable(input.replace(/^\w+_/, 'INPUT_') + 'label', instance.state.get(path))
			return true
		},
	},
	shutdown: {
		pat: 'DEVICE/device/system/shutdown/cmd/pp/xRequest',
		fun: (instance: AWJinstance, _path?: string | string[], value?: string | string[] | number | boolean): boolean => {
			if (value === 'SHUTDOWN') {
				instance.log('info', 'Device has been shut down.')
				instance.status(instance.STATUS_OK, 'Shut down')
			}
			return false
		},
	}
}

const altaSubscriptions = {

}

const midraSubscriptions = {
	screenPreset: {
		pat: 'DEVICE/device/transition/screenList/items/(\\w+?)/status/pp/transition',
		fbk: 'deviceTake',
		ini: [
			...Array.from({ length: 8 }, (_, i) => 'S' + (i + 1).toString()),
			...Array.from({ length: 8 }, (_, i) => 'A' + (i + 1).toString()),
		],
		fun: (instance: AWJinstance, path: string | string[], _value?: string | string[] | number | boolean): boolean => {
			const setMemoryVariables = (screen: string, preset: string, variableSuffix: string): void => {
				const mem = instance.state.get([
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
				])
				const modified = instance.state.get([
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
				])
				instance.setVariable('screen' + screen + 'memory' + variableSuffix , mem ? 'M' + mem : '')
				instance.setVariable('screen' + screen + 'memoryModified' + variableSuffix, mem && modified ? '*' : '')
				instance.setVariable(
					'screen' + screen + 'memoryLabel' + variableSuffix,
					mem
						? instance.state.get([
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
				)
			}
			let patharr: string[]
			if (typeof path === 'string') {
				patharr = path.split('/')
			} else if (Array.isArray(path)) {
				patharr = path
			} else {
				return
			}
			const val = instance.state.get(patharr)
			const screen = patharr[5]
			let program = '', preview = '' 
			if (val === 'AT_UP') {
				program = 'B'
				preview = 'A'
				instance.state.setUnmapped(`LOCAL/screens/${screen}/pgm/preset`, program)
				instance.state.setUnmapped(`LOCAL/screens/${screen}/pvw/preset`, preview)

				setMemoryVariables(screen, program, 'PGM')
				setMemoryVariables(screen, preview, 'PVW')
			}
			if (val === 'AT_DOWN') {
				program = 'A'
				preview = 'B'
				instance.state.setUnmapped(`LOCAL/screens/${screen}/pgm/preset`, program)
				instance.state.setUnmapped(`LOCAL/screens/${screen}/pvw/preset`, preview)

				setMemoryVariables(screen, program, 'PGM')
				setMemoryVariables(screen, preview, 'PVW')
			}
			instance.checkFeedbacks('deviceSourceTally', 'deviceScreenMemory', 'deviceAuxMemory', 'deviceTake')
			return false
		},
	},
	backgroundSet: {
		pat: 'DEVICE/device/screenList/items/((?:S|A)\\d{1,3})/presetList/items/(A|B)/background/source/pp',
		fbk: 'deviceSourceTally',
	},
	screenMemoryChange: {
		pat: 'DEVICE/device/screenList/items/((?:S|A)\\d{1,3})/presetList/items/(A|B)/status/pp/memoryId',
		fbk: ['deviceScreenMemory', 'deviceAuxMemory'],
		fun: (instance: AWJinstance, path: string | string[], _value?: string | string[] | number | boolean): boolean => {
			if (!path) return
			const screen = Array.isArray(path) ? path[4] : path.split('/')[4]
			const pres = Array.isArray(path) ? path[7] : path.split('/')[7]
			const presname = pres === instance.state.getUnmapped(`LOCAL/screens/${screen}/pgm/preset`) ? 'PGM' : 'PVW'
			const memorystr = instance.state.get(path).toString() !== '0' ? 'M' + instance.state.get(path) : ''
			instance.setVariable('screen' + screen + 'memory' + presname, memorystr)
			instance.setVariable(
				'screen' + screen + 'memoryLabel' + presname,
				instance.state.get(path).toString() !== '0'
					? instance.state.getUnmapped([
							'DEVICE',
							'device',
							'preset',
							'bank',
							'slotList',
							'items',
							instance.state.get(path).toString(),
							'control',
							'pp',
							'label',
					  ])
					: ''
			)
			return false
		},
	},
	screenMemoryModifiedChange: {
		pat: 'DEVICE/device/screenList/items/((?:S|A)\\d{1,3})/presetList/items/(A|B)/status/pp/isModified',
		fbk: ['deviceScreenMemory', 'deviceAuxMemory'],
		fun: (instance: AWJinstance, path: string | string[], _value?: string | string[] | number | boolean): boolean => {
			if (!path) return
			const screen = Array.isArray(path) ? path[4] : path.split('/')[4]
			const pres = Array.isArray(path) ? path[7] : path.split('/')[7]
			const presname = pres === instance.state.getUnmapped(`LOCAL/screens/${screen}/pgm/preset`) ? 'PGM' : 'PVW'
			instance.setVariable(
				'screen' + screen + 'memoryModified' + presname,
				instance.state.get(
					'DEVICE/device/screenList/items/' + screen + '/presetList/items/' + pres + '/status/pp/memoryId'
				) && instance.state.get(path)
					? '*'
					: ''
			)
			return false
		},
	},
	auxMemoryLabel: {
		pat: 'DEVICE/device/preset/auxBank/slotList/items/(\\d+)/control/pp/label',
		ini: Array.from({ length: 200 }, (_, i) => (i + 1).toString()),
		fun: (instance: AWJinstance, path: string | string[], _value?: string | string[] | number | boolean): boolean => {
			if (!path) return
			const memory = Array.isArray(path) ? path[6] : path.split('/')[6]
			const label = memory.toString() !== '0' ? instance.state.get(path) : ''
			instance.setVariable('auxMemory' + memory + 'label', label)
			for (const screen of instance.state.getChosenAuxes('all')) {
				const pgmmem = instance.state.get([
					'DEVICE',
					'device',
					'screenList',
					'items',
					screen,
					'presetList',
					'items',
					instance.state.getUnmapped('LOCAL/screens/' + screen + '/pgm/preset'),
					'status',
					'pp',
					'memoryId',
				])
				if (memory == pgmmem) {
					instance.setVariable('screen' + screen + 'memoryLabelPGM', label)
				}
				const pvwmem = instance.state.get([
					'DEVICE',
					'device',
					'screenList',
					'items',
					screen,
					'presetList',
					'items',
					instance.state.getUnmapped('LOCAL/screens/' + screen + '/pvw/preset'),
					'status',
					'pp',
					'memoryId',
				])
				if (memory == pvwmem) {
					instance.setVariable('screen' + screen + 'memoryLabelPVW', label)
				}
			}
			return true
		},
	},
	plugChange: {
		pat: 'DEVICE/device/inputList/items/(\\w+)/status/pp/plug',
		ini: Array.from({ length: 16 }, (_, i) => 'INPUT_'+(i + 1)),
		fun: (instance: AWJinstance, path: string | string[], _value?: string | string[] | number | boolean): boolean => {
			if (!path) return
			const input = Array.isArray(path) ? path[4] : path.split('/')[4]
			instance.setVariable(input.replace(/^\w+_/, 'INPUT_') + 'label',
				instance.state.get([
					'DEVICE', 'device', 'inputList', 'items', input,
					'plugList', 'items', instance.state.get(path),
					'control', 'pp', 'label'
				]))
			return true
		} 
	},
	inputLabel: {
		pat: 'DEVICE/device/inputList/items/(\\w+)/plugList/items/\\d+/control/pp/label',
		fun: (instance: AWJinstance, path: string | string[], _value?: string | string[] | number | boolean): boolean => {
			if (!path) return
			const input = Array.isArray(path) ? path[4] : path.split('/')[4]
			const plug = Array.isArray(path) ? path[7] : path.split('/')[7]
			if (instance.state.get([
				'DEVICE', 'device', 'inputList', 'items', input, 'status', 'pp', 'plug'
			]) == plug) {
				instance.setVariable(input.replace(/^\w+_/, 'INPUT_') + 'label',
					instance.state.get(path))
				return true
			} else {
				return false
			}
		} 
	},
	auxMemoriesChange: {
		pat: 'DEVICE/device/preset/auxBank/slotList/items/(\\d{1,4})/status/pp/isValid',
		fun: (): boolean => {
			return true
		},
	},
	streamStatus: {
		pat: 'DEVICE/device/streaming/status/pp/mode',
		fbk: 'deviceStreaming'
	},
	standby: {
		pat: 'DEVICE/device/system/shutdown/standby/control/pp/xRequest',
		fun: (instance: AWJinstance, path: string | string[], value?: string | string[] | number | boolean): boolean => {
			if (value === 'STANDBY') {
				instance.log('info', 'Device going to standby.')
				instance.status(instance.STATUS_OK, 'Standby')
			}
			return false
		},
	},
	shutdown: {
		pat: 'DEVICE/device/system/shutdown/standby/control/pp/xRequest',
		fun: (instance: AWJinstance, _path?: string | string[], value?: string | string[] | number | boolean): boolean => {
			if (value === 'SWITCH_OFF') {
				instance.log('info', 'Device has been shut down.')
				instance.status(instance.STATUS_OK, 'Shut down')
			}
			return false
		},
	}
}

let subscriptions = commonSubscriptions

/**
 * Combines the common subscriptions with the platform specific ones
 * @param platform 
 */
export function updateSubscriptions(platform: string): void {
	if (platform === 'livepremier') {
		subscriptions = { ...livepremierSubscriptions, ...commonSubscriptions }
	} else if (platform === 'alta') {
		subscriptions = { ...midraSubscriptions, ...commonSubscriptions }
	} else if (platform === 'midra') {
		subscriptions = { ...midraSubscriptions, ...commonSubscriptions }
	}
}

/**
 * Returns a string with the feedback ID if a feedback exists and runs an action if there is a 'fun' property
 * @param pat The path in the state object to check if a feedback or action exists for
 */
function checkForAction(instance: AWJinstance, pat?: string | string[], value?: any): string | string[] | undefined {
	console.log('Checking for action', pat, value);
	let path: string
	if (pat === undefined) {
		Object.keys(subscriptions).forEach((key) => {
			if (subscriptions?.[key]?.fun && typeof subscriptions[key].fun === 'function') {
				const update = subscriptions[key].fun(instance)
				if (update) void instance.updateInstance()
			}
			if (subscriptions?.[key]?.fbk) {
				return subscriptions[key].fbk
			}
		})
		return undefined
	} else if (typeof pat === 'string') {
		path = pat
	} else if (Array.isArray(pat)) {
		path = pat.join('/')
	} else {
		return undefined
	}

	const subscription = Object.keys(subscriptions).find((key) => {
		const regexp = new RegExp(subscriptions[key].pat)
		if (path.match(regexp)) {
			return true
		}
		return false
	})
	if (subscription) {
		console.log('found subscription', subscription)
		if (subscriptions?.[subscription]?.fun && typeof subscriptions[subscription].fun === 'function') {
			console.log('found subscription fun')
			if (value) {
				const update = subscriptions[subscription].fun(instance, path, value)
				if (update) void instance.updateInstance()
			} else {
				const update = subscriptions[subscription].fun(instance, path)
				if (update) void instance.updateInstance()
			}
		}
		if (subscriptions?.[subscription]?.fbk) {
			console.log('found feedback', subscriptions[subscription].fbk)
			return subscriptions[subscription].fbk
		}
	}
	return undefined
}

/**
 * Checks if the subscriptions have a 'fun' and then run it on the path. If there is an 'init' array the path will be run with all items of the array
 * if any of the subscriptions wants to run updateInstance it will be done at the end
 * @param subscription specific subscription or all subscriptions if omitted
 */
export function checkSubscriptions(instance: AWJinstance, subscription?: string): void {
	let subKeys: string[]
	let _update = false
	if (typeof subscription === 'string') {
		subKeys = [subscription]
	} else {
		subKeys = Object.keys(subscriptions)
	}
	for (const sub of subKeys) {
		let pattern = subscriptions?.[sub]?.pat
		if (subscriptions?.[sub]?.fun && typeof subscriptions[sub].fun === 'function') {
			if (pattern.indexOf('(') === -1) {
				subscriptions[sub].fun(instance, pattern)
			} else {
				if (subscriptions[sub].ini && Array.isArray(subscriptions[sub].ini)) {
					// if ini is array just replace the the one and only caspturing group with all the values of the array and run the fun with all resulting paths
					while (pattern.match(/\([^()]+\)/)) {
						pattern = pattern.replace(/\([^()]+\)/g, '*')
					}
					for (const item of subscriptions[sub].ini) {
						const upd = subscriptions[sub].fun(instance, pattern.replace('*', item))
						if (upd) _update = true
					}
				} else if (subscriptions[sub].ini && typeof subscriptions[sub].ini === 'function') {
					// if ini is a function run fun with all the paths generated by ini
					subscriptions[sub].ini(instance).forEach((path: string) => {
						subscriptions[sub].fun(instance, path)
					})
				}

			}
		}
	}
	void (async () => {
		try {
			await instance.updateInstance()
			instance.checkFeedbacks()
		} catch (error) {}
	})()
}

export { subscriptions, checkForAction }
