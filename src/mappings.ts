import {AWJinstance} from './index'
import { State } from './state'


export type MapItem = {
	patin: string,
	pathinrep?: (_arg0: string) => string,
	valinrep?: (_arg0: any) => unknown,
	patout: string,
	pathoutrep?: (_arg0: string) => string
	valoutrep?: (_arg0: any) => unknown,
	initfrom?: string,
	initto?: string,
}

/**
 * Object that holds transformation definitions for messages
 * 
 * The value will be transformed before getting stored in the state or before getting sent out. 
 * Multiple patterns can match and will be applied after another, for incoming from top to bottom, for outgoing from bottom to top
 * @patin pattern to check for incoming paths
 * @pathinrep function to be applied at the incoming path itself
 * @valinrep function to be applied at the incoming value
 * @patout pattern to check for outgoing paths
 * @pathoutrep function to be applied at the outgoing path itself
 * @valoutrep function to be applied at the outgoing value
 */
const midraMap: MapItem[] = [
	// MARK: screen selection
	{
		patin: 'live/screens/screenAuxSelection',
		valinrep: (itm) => JSON.parse(JSON.stringify(itm).replace(/SCREEN_/g, 'S').replace(/AUX_/g, 'A')),
		patout: 'live/screens/screenAuxSelection',
		valoutrep: (itm) => JSON.parse(JSON.stringify(itm).replace(/"S(\d{1,2})/g, '"SCREEN_$1').replace(/"A(\d{1,2})/g, '"AUX_$1')),
	},
	// MARK: screen lock
	{
		patin: 'live/screens/presetModeLock',
		pathinrep: (itm) => itm.replace(/SCREEN_/g, 'S').replace(/AUX_/g, 'A'),
		valinrep: (itm) => JSON.parse(JSON.stringify(itm).replace(/SCREEN_/g, 'S').replace(/AUX_/g, 'A')),
		patout: 'live/screens/presetModeLock',
		pathoutrep: (itm) => itm.replace(/S(\d{1,2})/g, 'SCREEN_$1').replace(/A(\d{1,2})/g, 'AUX_$1'),
		valoutrep: (itm) => JSON.parse(JSON.stringify(itm).replace(/"S(\d{1,2})/g, '"SCREEN_$1').replace(/"A(\d{1,2})/g, '"AUX_$1')),
	},
	// MARK: screens
	{
		patin: 'device/screenList/items/\\d+',
		pathinrep: (itm) => itm.replace(/device\/screenList\/items\/(\d+)/, 'device/screenList/items/S$1'),
		patout: 'device/screenList/items/S\\d+',
		pathoutrep: (itm) => itm.replace(/device\/screenList\/items\/S(\d+)/, 'device/screenList/items/$1'),
	},
	// MARK: auxscreens
	{
		patin: 'device/auxiliaryScreenList/items/\\d+',
		pathinrep:  (itm) => itm.replace(/device\/auxiliaryScreenList\/items\/(\d+)/, 'device/screenList/items/A$1'),
		patout: 'device/screenList/items/A\\d+',
		pathoutrep: (itm) => itm.replace(/device\/screenList\/items\/A(\d+)/, 'device/auxiliaryScreenList/items/$1'),
		initfrom: 'device/auxiliaryScreenList/items',
	},
	// MARK: livelayer
	{
		patin: 'presetList/items/\\w+/liveLayerList',
		pathinrep:  (itm) => itm.replace('/liveLayerList/', '/layerList/'),
		patout: 'presetList/items/\\w+/layerList',
		pathoutrep: (itm) => itm.replace('/layerList/', '/liveLayerList/'),
	},
	// MARK: top layer
	{
		patin: 'presetList/items/\\w+/top',
		pathinrep:  (itm) => itm.replace('/top', '/layerList/TOP'),
		patout: 'presetList/items/\\w+/layerList/TOP',
		pathoutrep: (itm) => itm.replace('/layerList/TOP', '/top'),
	},
	// MARK: background layer screen
	{
		patin: '/S\\d+/presetList/items/\\w+/background',
		pathinrep:  (itm) => itm.replace('/background', '/layerList/NATIVE'),
		patout: 'presetList/items/\\w+/layerList/NATIVE',
		pathoutrep: (itm) => itm.replace('/layerList/NATIVE', '/background'),
	},
	// MARK: background layer aux
	{
		patin: '/A\\d+/presetList/items/\\w+/background',
		pathinrep:  (itm) => itm.replace('/background', '/layerList/BKG'),
		patout: 'presetList/items/\\w+/layerList/BKG',
		pathoutrep: (itm) => itm.replace('/layerList/BKG', '/background'),
	},
	// MARK: preset UP
	{
		patin: 'presetList/items/UP',
		pathinrep: (itm) => itm.replace('presetList/items/UP', 'presetList/items/B'),
		patout: 'presetList/items/B',
		pathoutrep: (itm) => itm.replace('presetList/items/B', 'presetList/items/UP'),
	},
	// MARK: preset DOWN
	{
		patin: 'presetList/items/DOWN',
		pathinrep: (itm) => itm.replace('presetList/items/DOWN', 'presetList/items/A'),
		patout: 'presetList/items/A',
		pathoutrep: (itm) => itm.replace('presetList/items/A', 'presetList/items/DOWN'),
	},
	// MARK: screens group transition
	{
		patin: 'device/transition/screenList/items/\\d+/control',
		pathinrep: (itm) => itm.replace(/device\/transition\/screenList\/items\/(\d+)/, 'device/screenGroupList/items/S$1'),
		patout: 'device/screenGroupList/items/S(\\d+)/control',
		pathoutrep: (itm) => itm.replace(/device\/screenGroupList\/items\/S(\d+)/, 'device/transition/screenList/items/$1'),
	},
	// MARK: aux group transition
	{
		patin: 'device/transition/auxiliaryScreenList/items/\\d+/control',
		pathinrep: (itm) => itm.replace(/device\/transition\/auxiliaryScreenList\/items\/(\d+)/, 'device/screenGroupList/items/A$1'),
		patout: 'device/screenGroupList/items/A(\\d+)/control',
		pathoutrep: (itm) => itm.replace(/device\/screenGroupList\/items\/A(\d+)/, 'device/transition/auxiliaryScreenList/items/$1'),
	},
	// MARK: screens transition
	{
		patin: 'device/transition/screenList/items/(\\d+)',
		pathinrep: (itm) => itm.replace(/device\/transition\/screenList\/items\/(\d+)/, 'device/transition/screenList/items/S$1'),
		patout: 'device/transition/screenList/items/S(\\d+)',
		pathoutrep: (itm) => itm.replace(/device\/transition\/screenList\/items\/S(\d+)/, 'device/transition/screenList/items/$1'),
	},
	// MARK: aux transition
	{
		patin: 'device/transition/auxiliaryScreenList/items/(\\d+)',
		pathinrep: (itm) => itm.replace(/device\/transition\/auxiliaryScreenList\/items\/(\d+)/, 'device/transition/screenList/items/A$1'),
		patout: 'device/transition/screenList/items/A(\\d+)',
		pathoutrep: (itm) => itm.replace(/device\/transition\/screenList\/items\/A(\d+)/, 'device/transition/auxiliaryScreenList/items/$1'),
	},
	// MARK: master memory
	{
		patin: 'device/preset/masterBank/slotList',
		pathinrep: (itm) => itm.replace('device/preset/masterBank/slotList', 'device/masterPresetBank/bankList'),
		patout: 'device/masterPresetBank/bankList',
		pathoutrep: (itm) => itm.replace('device/masterPresetBank/bankList', 'device/preset/masterBank/slotList'),
	},
	// MARK: last used master memory
	{
		patin: 'device/preset/masterBank/status/lastUsed',
		pathinrep: (itm) => itm.replace('device/preset/masterBank/', 'device/masterPresetBank/'),
		patout: 'device/masterPresetBank/status/lastUsed',
		pathoutrep: (itm) => itm.replace('device/masterPresetBank/', 'device/preset/masterBank/'),
	},
	// MARK: screen memory
	{
		patin: 'device/preset/bank/slotList',
		pathinrep: (itm) => itm.replace('device/preset/bank/slotList', 'device/presetBank/bankList'),
		patout: 'device/presetBank/bankList',
		pathoutrep: (itm) => itm.replace('device/presetBank/bankList', 'device/preset/bank/slotList'),
	},
	// MARK: screen memory control
	{
		patin: 'device/preset/bank/control',
		pathinrep: (itm) => itm.replace('device/preset/bank/control', 'device/presetBank/control').replace(/screenList\/items\/(\d+)\//, 'screenList/items/S$1/'),
		patout: 'device/presetBank/control',
		pathoutrep: (itm) => itm.replace('device/presetBank/control', 'device/preset/bank/control').replace(/screenList\/items\/S(\d+)\//, 'screenList/items/$1/'),
	},
	// MARK: multiviewer memory
	{
		patin: 'device/multiviewer/bankList/item',
		pathinrep: (itm) => itm.replace('device/multiviewer/bankList/item', 'device/monitoringBank/bankList/item'),
		patout: 'device/monitoringBank/bankList/item',
		pathoutrep: (itm) => itm.replace('device/monitoringBank/bankList/item', 'device/multiviewer/bankList/item'),
	},
	// MARK: multiviewer memory control
	{
		patin: 'device/multiviewer/bankList/control',
		pathinrep: (itm) => itm.replace('device/multiviewer/bankList/control', 'device/monitoringBank/control'),
		patout: 'device/monitoringBank/control',
		pathoutrep: (itm) => itm.replace('device/monitoringBank/control', 'device/multiviewer/bankList/control').replace(/outputList\/items\/\w+\//, ''),
	},
	// MARK: multiviewer widget selection
	{
		patin: 'live/multiviewer/widgetSelection/widgetKeys',
		pathinrep: (itm) => itm.replace('live/multiviewer/widgetSelection/widgetKeys', 'live/multiviewers/widgetSelection/widgetIds'),
		valinrep: (itm: string[]) => itm.map((widget: string) => {return {widgetKey: widget, multiviewerKey: '1'}}),
		patout: 'live/multiviewers/widgetSelection/widgetIds',
		pathoutrep: (itm) => itm.replace('live/multiviewers/widgetSelection/widgetIds', 'live/multiviewer/widgetSelection/widgetKeys'),
		valoutrep: (itm) => itm.map((widget: {widgetKey: string}) => widget.widgetKey),
	},
	// MARK: multiviewer widget manipulation
	{
		patin: 'device/multiviewer/widgetList',
		pathinrep: (itm) => itm.replace('device/multiviewer/widgetList', 'device/monitoringList/items/1/layout/widgetList'),
		patout: 'device/monitoringList/items/1/layout/widgetList',
		pathoutrep: (itm) => itm.replace('device/monitoringList/items/1/layout/widgetList', 'device/multiviewer/widgetList'),
	},
	// MARK: layer selection
	{
		patin: 'live/screens/layerSelection',
		valinrep: (itm) => JSON.parse(JSON.stringify(itm)
			.replace(/SCREEN_/g, 'S')
			.replace(/AUX_/g, 'A')
			.replace(/LIVE_/g, '')
		),
		patout: 'live/screens/layerSelection',
		valoutrep: (itm) => JSON.parse(JSON.stringify(itm)
			.replace(/"S/g, '"SCREEN_')
			.replace(/"A/g, '"AUX_')
			.replace(/NATIVE/g, 'BKG')
			.replace(/layerKey":"(\d+)"/g, 'layerKey":"LIVE_$1"')
		),
	},
	// MARK: Timer
	{
		patin: 'device/timerList/items/TIMER_\\d+/control/pp/type',
		valinrep: (itm) => itm.replace('CURRENT_TIME', 'CURRENTTIME'),
		patout: 'device/timerList/items/TIMER_\\d+/control/pp/type',
		valoutrep: (itm) => itm.replace('CURRENTTIME', 'CURRENT_TIME'),
	},
	// MARK: layer inputnum
	{
		patin: '/ayerList/items/\\w+/source/pp',
		pathinrep:  (itm) => itm.replace('/input', '/inputNum'),
		patout: '/layerList/items/\\w+/source/pp',
		pathoutrep: (itm) => itm.replace('/inputNum', '/input'),
	},
	// MARK: layer crop
	{
		patin: 'ayerList/items/\\w+/crop/pp',
		pathinrep:  (itm) => itm.replace('/crop/pp', '/cropping/classic/pp'),
		patout: 'layerList/items/\\w+/cropping/classic/pp',
		pathoutrep: (itm) => itm.replace('/cropping/classic/pp', '/crop/pp'),
	},
	// MARK: layer size
	{
		patin: 'ayerList/items/\\w+/size/pp',
		pathinrep:  (itm) => itm.replace('/size/pp/size', '/position/pp/size'),
		patout: 'layerList/items/\\w+/position/pp/size',
		pathoutrep: (itm) => itm.replace('/position/pp/size', '/size/pp/size'),
	},
	// MARK: layer mask
	{
		patin: 'ayerList/items/\\w+/mask/pp',
		pathinrep:  (itm) => itm.replace('/mask/pp', '/cropping/mask/pp'),
		patout: 'layerList/items/\\w+/cropping/mask/pp',
		pathoutrep: (itm) => itm.replace('/cropping/mask/pp', '/mask/pp'),
	},
	// MARK: screen size
	{
		patin: 'device/screenList/items/\\w+/canvas/status',
		pathinrep:  (itm) => itm.replace('/canvas/status', '/status'),
		patout: 'device/screenList/items/\\w+/status',
		pathoutrep: (itm) => itm.replace('/status', '/canvas/status'),
	},
]

/**
 * Updates which mappings to use on platform
 * @param connection 
 */
export function updateMappings(instance: AWJinstance): void {
	if (instance.state.platform === 'livepremier') {
		instance.state.set('LOCAL/mappings', [] )
	} else if (instance.state.platform === 'alta') {
		instance.state.set('LOCAL/mappings', midraMap )
	} else if (instance.state.platform === 'midra') {
		instance.state.set('LOCAL/mappings', midraMap )
	}
}

/**
 * Transforms an incoming path and/or value 
 * one value can get multiple mutations from top to bottom of the map definition
 * @param pat The path associated with the value
 * @param value the value to transform
 * @returnes {path, value} the transormed path and value
 */
export function mapIn(deviceMap: MapItem[], pat: string | string[], value: unknown): { path: string, value: unknown } {
	let path: string
	if (Array.isArray(pat)) {
		path = pat.join('/')
	} else {
		path = pat
	}

	const mapping = deviceMap.filter((itm) => {
		const regexp = new RegExp(itm.patin)
		return path.match(regexp)
	})
	const ret = {
		path,
		value
	}
	if (mapping.length > 0) {
		mapping.forEach((map) => {
			if (map.pathinrep) ret.path = map.pathinrep(ret.path)
			if (value !== undefined && value !== null && map.valinrep) ret.value = map.valinrep(ret.value)
			//console.log('incoming mapped to', { pathfrom: path, pathto: ret.path, valuefrom: value, valueto: ret.value })
		})
	} // else console.log('incoming not mapped');
	return ret
}

/**
 * Transforms an outgoing path and/or value
 * one value can get multiple mutations from bottom to top of the map definition
 * @param pat The path associated with the value
 * @param value the value to transform
 * @returnes the transformed value
 */
export function mapOut(deviceMap: MapItem[], pat: string | string[] | undefined, value: unknown): { path: string, value: unknown } {
	if (pat === undefined) return {path: '', value: value}
	let path: string
	if (Array.isArray(pat)) {
		path = pat.join('/')
	} else {
		path = pat
	}

	const mapping = deviceMap.filter((itm) => {
		const regexp = new RegExp(itm.patout)
		return path.match(regexp)
	}).reverse()
	const ret = {
		path,
		value
	}
	if (mapping.length > 0) {
		mapping.forEach((map) => {
			if (map.pathoutrep) ret.path = map.pathoutrep(ret.path)
			if (value !== undefined && value !== null && map.valoutrep) ret.value = map.valoutrep(ret.value)
			//console.log('outgoing mapped to', { pathfrom: path, pathto: ret.path, valuefrom: value, valueto: ret.value })
		})
	} //else console.log('outgoing not mapped')
	return ret
}

// this function is unused
export function mapInit(deviceMap: MapItem[], state: State, path?: string): void {
	if (path === undefined) {
		const mapping = deviceMap.filter((itm) => {
			return typeof itm.initfrom === 'string'
		})
		if (mapping.length > 0) {
			mapping.forEach((map) => {
				if (map.initfrom === undefined) return
				mapPath(deviceMap, state, map.initfrom)
			})
		}
	}
}

// this function is unused
export function mapPath(deviceMap: MapItem[], state: State, path: string): void {
	const object = state.get('DEVICE/'+path)
	//console.log('mapping', path, object)
	const mapped = mapIn(deviceMap, path, object)
	if (typeof object === 'undefined') {
		console.log('not mapping undefined');
		return
	} else if (typeof object === 'string' || typeof object === 'number' || typeof object === 'boolean') {
		state.delete('DEVICE/'+path)
		state.set('DEVICE', mapped.path, mapped.value)
	} else if (Array.isArray(object)) {
		state.set('DEVICE', mapped.path, [])
		object.forEach((itm) => mapPath(deviceMap, state, path+'/'+itm))
		//state.delete('DEVICE/'+path)
	} else if (typeof object === 'object') {
		state.set('DEVICE', mapped.path, {})
		Object.keys(object).forEach((key) => mapPath(deviceMap, state, path+'/'+key))
		//state.delete('DEVICE/'+path)
	} else {
		const temp = JSON.stringify(object)
		state.delete('DEVICE/'+path)
		state.set('DEVICE', mapped.path, JSON.parse(temp))
	}
}