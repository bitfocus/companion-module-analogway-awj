import {
	// DropdownChoice,
	// ConfigValue,
	// CompanionInputFieldNumber,
	// CompanionInputFieldDropdown,
} from '../../../instance_skel_types'
import { State } from './state'

type Dropdown<t> = {id: t, label: string}

export type Choicemeta = { id: string, label: string, index?: string, longname?: string }

export const choicesPreset: Dropdown<string>[] = [
	{ id: 'pgm', label: 'Program' },
	{ id: 'pvw', label: 'Preview' },
]

export const choicesPresetLong: Dropdown<string>[] = [
	{ id: 'PROGRAM', label: 'Program' },
	{ id: 'PREVIEW', label: 'Preview' },
]

export const choicesBackgroundSources: Dropdown<string>[] = [
	{ id: 'NATIVE_1', label: 'Background Set 1' },
	{ id: 'NATIVE_2', label: 'Background Set 2' },
	{ id: 'NATIVE_3', label: 'Background Set 3' },
	{ id: 'NATIVE_4', label: 'Background Set 4' },
	{ id: 'NATIVE_5', label: 'Background Set 5' },
	{ id: 'NATIVE_6', label: 'Background Set 6' },
	{ id: 'NATIVE_7', label: 'Background Set 7' },
	{ id: 'NATIVE_8', label: 'Background Set 8' },
]

export const choicesBackgroundSourcesPlusNone: Dropdown<string>[] = [
	{ id: 'NONE', label: 'None / Color' },
	...choicesBackgroundSources,
]

export function getScreensAuxArray(state: State, getAlsoDisabled = false): Choicemeta[] {
	return [...getScreensArray(state, getAlsoDisabled), ...getAuxArray(state, getAlsoDisabled)]
}

export function getScreensArray(state: State, getAlsoDisabled = false): Choicemeta[] {
	const ret: Choicemeta[] = []
	if (state.platform === 'livepremier') {
		const screens = state.get('DEVICE/device/screenList/items')
		if (screens) {
			Object.keys(screens).forEach((key) => {
				if (key.startsWith('S') && (getAlsoDisabled || screens[key].status.pp.mode != 'DISABLED')) {
					ret.push({
						id: key,
						label: screens[key].control.pp.label,
						index: key.slice(1)
					})
				}
			})
		} else {
			ret.push({ id: 'S1', label: '(emulated)', index: '1' })
			ret.push({ id: 'S2', label: '(emulated)', index: '2' })
		}
	} else if (state.platform === 'midra') {
		const screens = state.get('DEVICE/device/screenList/itemKeys')
		if (screens) {
			for (const screen of screens) {
				if (getAlsoDisabled || state.get('DEVICE/device/preconfig/status/stateList/items/CURRENT/screenList/items/' + screen + '/pp/enable') === true) {
					ret.push({
						id: 'S' + screen,
						label: state.get('DEVICE/device/screenList/items/' + screen + '/control/pp/label'),
						index: screen
					})
				}
			}
		} else {
			ret.push({ id: 'S1', label: '(emulated)', index: '1' })
		}
	}
	return ret
}

export function getScreenChoices(state: State): Dropdown<string>[] {

	return getScreensArray(state).map((scr: Choicemeta) => {
		return {
			id: scr.id,
			label: `S${scr.index}${scr.label === '' ? '' : ' - ' + scr.label}`
		}
	})
}

export function getAuxArray(state: State, getAlsoDisabled = false ): Choicemeta[] {
	const ret: Choicemeta[] = []
	if (state.platform === 'livepremier') {
		const screens = state.getUnmapped('DEVICE/device/screenList/itemKeys')
		if (screens) {
			screens.forEach((screen: string) => {
				if (screen.startsWith('A') && (getAlsoDisabled || state.get('DEVICE/device/screenList/items/' + screen + '/status/pp/mode') != 'DISABLED')) {
					ret.push({
						id: screen,
						label: state.get('DEVICE/device/screenList/items/' + screen + '/control/pp/label'),
						index: screen.replace(/\D/g, '')
					})
				}
			})
		} else {
			ret.push({ id: 'A1', label: '(emulated)', index: '1' })
			ret.push({ id: 'A2', label: '(emulated)', index: '2' })
		}
	} else if (state.platform === 'midra') {
		const screens = state.getUnmapped('DEVICE/device/auxiliaryScreenList/itemKeys')
		if (screens) {
			for (const screen of screens) {
				if (getAlsoDisabled || state.getUnmapped('DEVICE/device/preconfig/status/stateList/items/CURRENT/auxiliaryScreenList/items/' + screen + '/pp/mode') != 'DISABLE') {
					ret.push({
						id: 'A' + screen,
						label: state.getUnmapped('DEVICE/device/auxiliaryScreenList/items/' + screen + '/control/pp/label'),
						index: screen.replace(/\D/g, '')
					})
				}
			}
		} else {
			ret.push({ id: 'A1', label: '(emulated)', index: '1' })
		}
	}
	return ret
}

export function getAuxChoices(state: State): Dropdown<string>[] {

	return getAuxArray(state).map((scr: Choicemeta) => {
		return {
			id: scr.id,
			label: `A${scr.index}${scr.label === '' ? '' : ' - ' + scr.label}`
		}
	})
}

export function getScreenAuxChoices(state: State): Dropdown<string>[] {
	return [
		...getScreensArray(state).map((scr: Choicemeta) => {
		return {
			id: scr.id,
			label: `S${scr.index}${scr.label === '' ? '' : ' - ' + scr.label}`
		}
		}),
		...getAuxArray(state).map((scr: Choicemeta) => {
		return {
			id: scr.id,
			label: `A${scr.index}${scr.label === '' ? '' : ' - ' + scr.label}`
		}
		})
	]
}

export function getPlatformScreenChoices(state: State): Dropdown<string>[] {
	if (state.platform === 'livepremier')
		return [
			...getScreensArray(state).map((scr: Choicemeta) => {
			return {
				id: scr.id,
				label: `S${scr.index}${scr.label === '' ? '' : ' - ' + scr.label}`
			}
			}),
			...getAuxArray(state).map((scr: Choicemeta) => {
			return {
				id: scr.id,
				label: `A${scr.index}${scr.label === '' ? '' : ' - ' + scr.label}`
			}
			})
		]
	else if (state.platform === 'midra')
		return [
			...getScreensArray(state).map((scr: Choicemeta) => {
			return {
				id: scr.id,
				label: `S${scr.index}${scr.label === '' ? '' : ' - ' + scr.label}`
			}
			})
		]
	else return []
}

export function getLiveInputArray(state: State, prefix?: string): Choicemeta[] {
	const ret: Choicemeta[] = []
	if (state.platform === 'livepremier') {
		if(prefix == undefined) prefix = 'IN'
		const items = state.getUnmapped('DEVICE/device/inputList/itemKeys')
		if (items) {
			items.forEach((key: string) => {
				if (state.getUnmapped('DEVICE/device/inputList/items/' + key + '/status/pp/isAvailable') && state.getUnmapped('DEVICE/device/inputList/items/' + key + '/status/pp/isEnabled')) {
					ret.push({
						id: key.replace(/^\w+_/, prefix + '_'),
						label: state.getUnmapped('DEVICE/device/inputList/items/' + key + '/control/pp/label'),
						index: key.replace(/^\w+_/, '')
					})
				}
			})
		}
	} else if (state.platform === 'midra') {
		if(prefix == undefined) prefix = 'INPUT'
		const items = state.getUnmapped('DEVICE/device/inputList/itemKeys')
		if (items) {
			items.forEach((key: string) => {
				if (state.getUnmapped('DEVICE/device/inputList/items/' + key + '/status/pp/isAvailable')) {
					const plug = state.getUnmapped('DEVICE/device/inputList/items/' + key + '/control/pp/plug')
					ret.push({
						id: key.replace(/^\w+_/, prefix + '_'),
						label: state.getUnmapped('DEVICE/device/inputList/items/' + key + '/plugList/items/' + plug + '/control/pp/label'),
						index: key.replace(/^\w+_/, '')
					})
				}
			})
		}
	}
	return ret
}

export function getLiveInputChoices(state: State, prefix?: string): Dropdown<string>[] {
	const ret: Dropdown<string>[] = []
	const inputs = getLiveInputArray(state, prefix)

	if (inputs?.length) {
		for (const input of inputs) {
			ret.push({
				id: input.id,
				label: `Input ${input.index}${
					input.label.length === 0 ? '' : ' - ' + input.label
				}`,
			})
		}
	} else {
		if (prefix == undefined && state.platform == 'livepremier') prefix = 'IN'
		if (prefix == undefined && state.platform == 'midra') prefix = 'INPUT'
		for (let i = 1; i <= 8; i += 1) {
			ret.push({ id: `${prefix}_${i.toString()}`, label: `Input ${i.toString()} (emulated)` })
		}
	}
	return ret
}

export function getAuxBackgroundChoices(state: State): Dropdown<string>[] {
	if (state.platform === 'livepremier') return []
	return [
		{id: 'NONE', label: 'None'},
		...getLiveInputChoices(state, 'INPUT'),
		...getScreensArray(state).map((screen: Choicemeta): Dropdown<string> => {
			return {
				id: 'PROGRAM_' + screen.index,
				label: screen.id + ' PGM' + (screen.label === '' ? '' : ' - ' + screen.label),
			}
		})
	]
}

export const choicesForegroundImagesSource: Dropdown<string>[] = [
	{ id: 'NONE', label: 'None' },
	{ id: 'TOP_1', label: 'Foreground Image 1' },
	{ id: 'TOP_2', label: 'Foreground Image 2' },
	{ id: 'TOP_3', label: 'Foreground Image 3' },
	{ id: 'TOP_4', label: 'Foreground Image 4' },
]

export function getStillsArray(state: State): Choicemeta[] {
	const bankpath = 'DEVICE/device/stillList/'
	return (
		state.get(state.concat(bankpath, 'itemKeys'))?.filter((itm: string) => {
			return state.get(state.concat(bankpath, ['items', itm, 'status', 'pp', 'isAvailable'])) && state.get(state.concat(bankpath, ['items', itm, 'status', 'pp', 'isValid']))
		}).map((itm: string) => {
			return {
				id: itm,
				label: state.get(state.concat(bankpath, ['items',itm,'control','pp','label',]))
			}
		}) ?? []
	)
}

export function getSourceChoices(state: State): Dropdown<string>[] {
	// first add None and Color which are always available
	const ret:Dropdown<string>[] = [
		{ id: 'NONE', label: 'None' },
		{ id: 'COLOR', label: 'Color' },
	]

	// next add live inputs
	const prefix = state.platform === 'midra' ? 'INPUT' : 'LIVE'
	ret.push( ...getLiveInputChoices(state, prefix) )

	if (state.platform === 'livepremier') {
		// next add still images
		ret.push(...getStillsArray(state).map((itm: Choicemeta) => {
			return {
				id: `STILL_${itm.id}`,
				label: `Image ${itm.id}${itm.label === '' ? '' : ' - ' + itm.label}`,
			}
		}))

	}
	return ret
}

export function getAuxSourceChoices(state: State): Dropdown<string>[] {
	// first add None and Color which are always available
	const ret: Dropdown<string>[] = [
		{ id: 'NONE', label: 'None' },
	]

	// next add live inputs
	const prefix = state.platform === 'midra' ? 'INPUT' : 'LIVE'
	ret.push( ...getLiveInputChoices(state, prefix) )

	if (state.platform === 'livepremier') {
		// next add still images
		ret.push(...getStillsArray(state).map((itm: Choicemeta) => {
			return {
				id: `STILL_${itm.id}`,
				label: `Image ${itm.id}${itm.label === '' ? '' : ' - ' + itm.label}`,
			}
		}))
		// last add split-layer screen pgms for reinsertion
		ret.push(...getScreensArray(state).filter((itm: Choicemeta) => {
			return state.get('DEVICE/device/screenList/items/'+itm.id+'/status/pp/mixingMode') === 'SPLIT'
		}).map((itm: Choicemeta) => {
			return {
				id: `SCREEN_${itm.index}`,
				label: `Screen ${itm.index} PGM${itm.label === '' ? '' : ' - ' + itm.label}`
			}
		}) )

	}
	return ret
}

export function getPlugChoices(state: State, input: string): Dropdown<string>[] {
	const plugtype = {
		HDMI: 'HDMI',
		SDI: 'SDI',
		DISPLAY_PORT: 'DisplayPort',
		ANALOG_HD15: 'Analog HD15',
		OPTICAL_SFP: 'Optical',
		DVI_D: 'DVI-D',
		HDBASET: 'HDbaseT',
		QUAD_SDI: 'Quad SDI',
	}
	return state.get(['DEVICE', 'device', 'inputList', 'items', input, 'plugList', 'itemKeys'])?.filter(
		(plug: string) => {
			return state.get(['DEVICE', 'device', 'inputList', 'items', input, 'plugList', 'items', plug, 'status', 'pp', 'isAvailable'])
		}
	).map(
		(plug: string) => {
			const type: keyof typeof plugtype = state.get(['DEVICE', 'device', 'inputList', 'items', input, 'plugList', 'items', plug, 'status', 'pp', 'type'])
			return {
				id: plug,
				label: 'Plug ' + plug + ' - ' + plugtype[type]
			}
		}
	) ?? []
}

export function getMasterMemoryArray(state: State): Choicemeta[] {
	let bankpath = 'DEVICE/device/masterPresetBank/bankList'
	if (state.platform === 'midra') {
		bankpath = 'DEVICE/device/preset/masterBank/slotList'
	}
	return (
		state.get(state.concat(bankpath, 'itemKeys'))?.filter((mem: string) => {
			return state.get(state.concat(bankpath, ['items', mem, 'status', 'pp', 'isValid']))
		}).map((mem: string) => {
			return {
				id: mem,
				label: state.get(state.concat(bankpath, ['items',mem,'control','pp','label',]))
			}
		}) ?? []
	)
}

export function getMasterMemoryChoices(state: State): Dropdown<string>[] {

	return getMasterMemoryArray(state).map((mem: Choicemeta) => {
		return {
			id: mem.id,
			label: `MM${mem.id}${mem.label === '' ? '' : ' - ' + mem.label}`
		}
	})
}

export function getScreenMemoryArray(state: State): Choicemeta[] {
	let bankpath = 'DEVICE/device/presetBank/bankList'
	if (state.platform === 'midra') {
		bankpath = 'DEVICE/device/preset/bank/slotList'
	}

	return (
		state.get(state.concat(bankpath, 'itemKeys'))?.filter((mem: string) => {
			return state.get(state.concat(bankpath, ['items', mem, 'status', 'pp', 'isValid']))
		}).map((mem: string) => {
			return {
				id: mem,
				label: state.get(state.concat(bankpath, ['items',mem,'control','pp','label',]))
			}
		}) ?? []
	)
}

export function getScreenMemoryChoices(state: State): Dropdown<string>[] {

	return getScreenMemoryArray(state).map((mem: Choicemeta) => {
		return {
			id: mem.id,
			label: `SM${mem.id}${mem.label === '' ? '' : ' - ' + mem.label}`
		}
	})
}

export function getAuxMemoryArray(state: State): Choicemeta[] {
	const bankpath = 'DEVICE/device/preset/auxBank/slotList'
	return (
		state.get(state.concat(bankpath, 'itemKeys'))?.filter((mem: string) => {
			return state.get(state.concat(bankpath, ['items', mem, 'status', 'pp', 'isValid']))
		}).map((mem: string) => {
			return {
				id: mem,
				label: state.get(state.concat(bankpath, ['items',mem,'control','pp','label',]))
			}
		}) ?? []
	)
}

export function getAuxMemoryChoices(state: State): Dropdown<string>[] {

	return getAuxMemoryArray(state).map((mem: Choicemeta) => {
		return {
			id: mem.id,
			label: `AM${mem.id}${mem.label === '' ? '' : ' - ' + mem.label}`
		}
	})
}

export function getLayerMemoryArray(state: State): string[] {
	return (
		state.get('DEVICE/device/layerBank/bankList/itemKeys')?.filter((mem: string) => {
			return state.get(['DEVICE', 'device', 'layerBank', 'bankList', 'items', mem, 'status', 'pp', 'isValid'])
		}) ?? []
	)
}

export function getLayerMemoryChoices(state: State): Dropdown<string>[] {
	const ret: Dropdown<string>[] = []
	for (const memory of getLayerMemoryArray(state)) {
		const label = state.get(['DEVICE', 'device', 'layerBank', 'bankList', 'items', memory, 'control', 'pp', 'label'])
		ret.push({
			id: memory,
			label: `M${memory}${label === '' ? '' : ' - ' + label}`,
		})
	}
	return ret
}

export function getMultiviewerMemoryArray(state: State): Choicemeta[] {
	const bankpath = 'DEVICE/device/monitoringBank/bankList'
	return (
		state.get(bankpath + '/itemKeys')?.filter((mem: string) => {
			return state.get(state.concat(bankpath,['items', mem, 'status', 'pp', 'isValid']))
		}).map((mem: string) => {
			return {
				id: mem,
				label: state.get(state.concat(bankpath, ['items',mem,'control','pp','label',]))
			}
		}) ?? []
	)
}

export function getMultiviewerMemoryChoices(state: State): Dropdown<string>[] {

	return getMultiviewerMemoryArray(state).map((mem: Choicemeta) => {
		return {
			id: mem.id,
			label: `VM${mem.id}${mem.label === '' ? '' : ' - ' + mem.label}`
		}
	})
}

export function getMultiviewerArray(state: State): string[] {
	return (
		state.get('DEVICE/device/monitoringList/itemKeys')?.filter((mvKey: string) => {
			return state.get(['DEVICE', 'device', 'monitoringList', 'items', mvKey, 'status', 'pp', 'isEnabled'])
		}) ?? ['1']
	)
}

export function getMultiviewerChoices(state: State): Dropdown<string>[] {
	const ret: Dropdown<string>[] = []
	for (const multiviewer of getMultiviewerArray(state)) {
		const label = state.get(['DEVICE', 'device', 'monitoringList', 'items', multiviewer, 'control', 'pp', 'label'])
		ret.push({
			id: multiviewer,
			label: `Multiviewer ${multiviewer}${label === '' ? '' : ' - ' + label}`,
		})
	}
	return ret
}

export function getWidgetChoices(state: State): Dropdown<string>[] {
	const ret: Dropdown<string>[] = []
	if (state.platform === 'livepremier') {
		for (const multiviewer of getMultiviewerArray(state)) {
			for (const widget of state.getUnmapped([
				'DEVICE',
				'device',
				'monitoringList',
				'items',
				multiviewer,
				'layout',
				'widgetList',
				'itemKeys',
			])) {
				ret.push({
					id: `${multiviewer}:${widget}`,
					label: `Multiviewer ${multiviewer} Widget ${parseInt(widget)+1}`,
				})
			}
		}
	} else if (state.platform === 'midra') {
		return state.getUnmapped('DEVICE/device/multiviewer/status/pp/widgetValidity').map((widget: string) => {
			return {
				id: '1:' + widget,
				label: `Widget ${parseInt(widget)}`,
			}
		})
		
	}
	return ret
}

export function getWidgetSourceChoices(state: State): Dropdown<string>[] {
	// first add None which is always available
	const ret: Dropdown<string>[] = [{ id: 'NONE', label: 'None' }]

	// next add Screens
	// different nomenclature on livepremier and midra
	let program = 'PROGRAM_S'
	let preview = 'PREVIEW_S'
	if (state.platform === 'midra') { 
		program = 'SCREEN_PRGM_'
		preview = 'SCREEN_PRW_'
	}
	for (const screen of getScreensArray(state)) {
		ret.push({
			id: program + screen.index,
			label: `Screen ${screen.index} PGM${screen.label === '' ? '' : ' - ' + screen.label}`,
		})
		ret.push({
			id: preview + screen.index,
			label: `Screen ${screen.index} PVW${screen.label === '' ? '' : ' - ' + screen.label}`,
		})
	}

	// next add Auxscreens
	// not available on midra
	if (state.platform === 'livepremier') {
		for (const screen of getAuxArray(state)) {
			ret.push({
				id: screen.id,
				label: `Aux ${screen.index} PGM${screen.label === '' ? '' : ' - ' + screen.label}`,
			})
		}
	}

	// next add live inputs
	ret.push(...getLiveInputChoices(state))

	// next add timer
	ret.push(...getTimerChoices(state))

	// next add still images
	// not available on midra
	if (state.platform === 'livepremier') {
		ret.push(...getStillsArray(state).map((itm: Choicemeta) => {
			return {
				id: `STILL_${itm.id}`,
				label: `Image ${itm.id}${itm.label === '' ? '' : ' - ' + itm.label}`,
			}
		}))
	}

	return ret
}

export function getLayersAsArray(state: State, param: string | number, bkg?: boolean): string[] {
	const ret: string[] = []
	if (bkg === undefined || bkg === true) {
		ret.push('NATIVE')
	}
	let layercount = 0
	if (typeof param === 'number') {
		layercount = param
	} else if (typeof param === 'string') {
		let bankpath = `DEVICE/device/screenList/items/${param}/status/pp/layerCount`
		if (state.platform === 'midra') {
			bankpath = `DEVICE/device/preconfig/status/stateList/items/CURRENT/screenList/items/${param}/pp/layerCount`
		}
		layercount = state.get(bankpath) ?? 0
	}
	for (let i = 1; i <= layercount; i += 1) {
		ret.push(i.toString())
	}
	return ret
}

/**
 * Returns array with some layer choices
 * @param param if it is a number that number of layer choices are returned, if it is a string the layers of the screen are returned
 * @param bkg wether to include only live layers (false) or also background and eventually foreground layer (true or omitted) 
 */
export function getLayerChoices(state: State, param: string | number, bkg?: boolean): Dropdown<string>[] {
	const ret: Dropdown<string>[] = []
	let layercount = 0
	if (typeof param === 'number') {
		if (bkg === undefined || bkg === true) ret.push({ id: 'NATIVE', label: 'Background' })
		for (let i = 1; i <= param; i += 1) {
			ret.push({ id: `${i.toString()}`, label: `Layer ${i.toString()}` })
		}
		if (state.platform === 'midra' && (bkg === undefined || bkg === true)) ret.push({ id: 'TOP', label: 'Foreground' })
		return ret
	} else if (typeof param === 'string') {
		if (state.platform === 'livepremier') {
			if (bkg === undefined || bkg === true) ret.push({ id: 'NATIVE', label: 'Background' })
			layercount = state.get(`DEVICE/device/screenList/items/${param}/status/pp/layerCount`) ?? 1
			for (let i = 1; i <= layercount; i += 1) {
				ret.push({ id: `${i.toString()}`, label: `Layer ${i.toString()}` })
			}
			return ret
		}
		if (state.platform === 'midra') {
			if (param.startsWith('A')) {
				ret.push({ id: 'BKG', label: 'Background Layer' })
			}
			if (param.startsWith('S')) {
				layercount = state.getUnmapped(`DEVICE/device/preconfig/status/stateList/items/CURRENT/screenList/items/${param.replace(/\D/g, '')}/pp/layerCount`) ?? 1
				if (bkg === undefined || bkg === true) ret.push({ id: 'NATIVE', label: 'Background Layer' })
				for (let i = 1; i <= layercount; i += 1) {
					ret.push({ id: `${i.toString()}`, label: `Layer ${i.toString()}` })
				}
				if (bkg === undefined || bkg === true) ret.push({ id: 'TOP', label: 'Foreground Layer' })
			}
		}
	}
	return ret
}

export function getOutputArray(state: State): Choicemeta[] {
	return state.get('DEVICE/device/outputList/itemKeys')?.filter((itm: string) => {
		return state.get('DEVICE/device/outputList/items/'+itm+'/status/pp/isAvailable') === true
	}).map((itm: string) => {
		return {
			id: itm,
			label: state.get('DEVICE/device/outputList/items/'+itm+'/control/pp/label')
		}
	}) ?? []

}

export function getOutputChoices(state: State): Dropdown<string>[] {
	return getOutputArray(state).map((itm: Choicemeta) => {
		return {
			id: itm.id,
			label: `Output ${itm.id}${itm.label === '' ? '' : ' - ' + itm.label}`
		}
	})
}

export function getAudioOutputsArray(state: State): Choicemeta[] {
	const ret: Choicemeta[] = []
	if (state.platform === 'livepremier') {
		const outputs = state.get('DEVICE/device/audio/control/txList/itemKeys') ?? []
		for (const out of outputs) {
			const outputnum = out.split('_')[1]
			if (out.startsWith('OUTPUT') && state.get('DEVICE/device/outputList/items/' + outputnum + '/status/pp/isAvailable')) {
				ret.push({
					id: out,
					label: state.get('DEVICE/device/outputList/items/' + outputnum + '/control/pp/label'),
					index: outputnum,
					longname: 'Output'
				})
			}
			if (out.startsWith('DANTE') && state.get('DEVICE/device/system/dante/channelList/items/' + out + '_CHANNEL_8/status/pp/isAvailable')) {
				ret.push({
					id: out,
					label: '',
					index: outputnum,
					longname: 'Dante'
				})
			}
			if (out.startsWith('MVW') && state.get('DEVICE/device/monitoringList/items/' + outputnum + '/status/pp/isAvailable')) {
				ret.push({
					id: out,
					label: state.get('DEVICE/device/monitoringList/items/' + outputnum + '/control/pp/label'),
					index: outputnum,
					longname: 'Multiviewer'
				})
			}
		}
	} else if (state.platform === 'midra') {
		const outputs = state.get('DEVICE/device/audio/outputList/itemKeys') ?? []
		for (const out of outputs) {
			if (state.get('DEVICE/device/audio/outputList/items/' + out + '/status/pp/isAvailable')){
				ret.push({
					id: out,
					label: ''
				})
			}
		}
	}
	return ret
}

export function getAudioOutputChoices(state: State): Dropdown<string>[] { 
	if (state.platform === 'midra') {
		return getAudioOutputChoicesMidra(state)
	} else {
		return getAudioOutputChoicesLifePremier(state)
	}

}

export function getAudioOutputChoicesLifePremier(state: State): Dropdown<string>[] {
	const ret: Dropdown<string>[] = []
	for (const out of getAudioOutputsArray(state)) {
		const channels = state.get(`DEVICE/device/audio/control/txList/items/${out.id}/channelList/itemKeys`) ?? []
		const [outputtype, outnum] = out.id.split('_')
		for (const channel of channels) {
			let label = '',
				outputLabel = ''
			if (outputtype === 'OUTPUT') {
				outputLabel = state.get('DEVICE/device/outputList/items/' + outnum + '/control/pp/label')
				label = `Output ${outnum} Channel ${channel}${outputLabel === '' ? '' : ' - ' + outputLabel}`
			} else if (outputtype === 'DANTE') {
				outputLabel = state.get(
					'DEVICE/device/system/dante/channelList/items/' + out + '_CHANNEL_' + channel + '/transmitter/status/pp/label'
				)
				label = `Dante Channel ${(parseInt(outnum) - 1) * 8 + parseInt(channel)}${
					outputLabel === '' ? '' : ' - ' + outputLabel
				}`
			} else if (outputtype === 'MVW') {
				outputLabel = state.get('DEVICE/device/monitoringList/items/' + outnum + '/control/pp/label')
				label = `Multiviewer ${outnum} Channel ${channel}${outputLabel === '' ? '' : ' - ' + outputLabel}`
			}

			ret.push({
				id: out.id + ':' + channel,
				label,
			})
		}
	}
	return ret
}

export function getAudioOutputChoicesMidra(state: State): Dropdown<string>[] {
	const ret: Dropdown<string>[] = []
	for (const out of getAudioOutputsArray(state)) {
		const outarr = /\d*$/.exec(out.id)
		let outnum = '0'
		if (outarr !== null) outnum = outarr[0]
		for (let channel = 1; channel <= 8; channel += 1) {
			let label = '',
				outputLabel = ''
			if (out.id.startsWith('VIDEO_OUT')) {
				outputLabel = state.get('DEVICE/device/outputList/items/' + outnum + '/control/pp/label')
				label = `Video Output ${outnum} Channel ${channel}${outputLabel === '' ? '' : ' - ' + outputLabel}`
			} else if (out.id.startsWith('DANTE_CH')) {
				outputLabel = state.get(
					'DEVICE/device/audio/dante/channelList/items/' + (parseInt(outnum) - 8 + channel) + '/transmitter/status/pp/label'
				)
				label = `Dante Channel ${parseInt(outnum) - 8 + channel}${
					outputLabel === '' ? '' : ' - ' + outputLabel
				}`
			} else if (out.id.startsWith('ANALOG')) {
				label = `Analog Audio Output ${outnum} Channel ${channel}`
			} else if (out.id.startsWith('VIDEO_MULTIVIEWER')) {
				label = `Multiviewer Output Channel ${channel}`
			} else if (out.id.startsWith('VIDEO_MONITORING')) {
				label = `Monitoring Output Channel ${channel}`
			}

			ret.push({
				id: out.id + ':' + channel,
				label,
			})
		}
	}
	return ret
}

export function getAudioCustomBlockChoices(): Dropdown<string>[] {
	const ret: Dropdown<string>[] = []
	for (let block = 1; block <= 10; block += 1) {
		for (let channel = 1; channel <= 8; channel += 1) {
			ret.push({
				id: 'CUSTOM_' + block.toString() + ':' + channel.toString(),
				label: 'Custom ' +  block.toString() + ' Channel ' + channel.toString(),
			})
		}
	}
	return ret
}

export function getAudioInputChoices(state: State): Dropdown<string>[] { 
	if (state.platform === 'midra') {
		return getAudioInputChoicesMidra(state)
	} else {
		return getAudioInputChoicesLifePremier(state)
	}

}

export function getAudioInputChoicesLifePremier(state: State): Dropdown<string>[] {
	const ret = [{ id: 'NONE', label: 'No Source' }]
	const inputs = state.get('DEVICE/device/audio/control/rxList/itemKeys') ?? []
	for (const input of inputs) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const [inputtype, inputnum, _channel, channelnum] = input.split('_')
		if (inputtype === 'INPUT' && state.get('DEVICE/device/inputList/items/IN_' + inputnum + '/status/pp/isAvailable')) {
			const inputLabel = state.get('DEVICE/device/inputList/items/IN_' + inputnum + '/control/pp/label')
			ret.push({
				id: input,
				label: `Input ${inputnum} Channel ${channelnum}${inputLabel === '' ? '' : ' - ' + inputLabel}`,
			})
		} else if (
			inputtype === 'DANTE' &&
			state.get('DEVICE/device/system/dante/channelList/items/' + input + '/status/pp/isAvailable')
		) {
			const inputLabel = state.get('DEVICE/device/system/dante/channelList/items/' + input + '/source/status/pp/label')
			ret.push({
				id: input,
				label: `Dante Channel ${(parseInt(inputnum) - 1) * 8 + parseInt(channelnum)}${
					inputLabel === '' ? '' : ' - ' + inputLabel
				}`,
			})
		}
	}
	return ret
}

export function getAudioInputChoicesMidra(state: State): Dropdown<string>[] {
	const ret = [{ id: 'NONE', label: 'No Source' }]
	for (const input of state.getUnmapped('DEVICE/device/audio/inputList/itemKeys') ?? []) {
		let inputtype = '', inputnum = '', inputplug = '', channelstart = 0
		const inputlabel = ''
		if (input.match(/^IN\d+_ACTIVE_PLUG_EMBEDDED$/)) {
			inputtype = 'Input '
			inputnum = input.replace(/\D/g, '')
			inputplug = ''
		} else if (input.match(/^IN\d+_\w+_EMBEDDED$/)) {
			const res = input.match(/^IN(\d+)_(\w+)_EMBEDDED$/)
			inputtype = 'Input '
			inputnum = res[1]
			inputplug = res[2]
		} else if (input.match(/^IN_DANTE_CH/)) {
			inputtype = 'Dante'
			channelstart = parseInt(input.replace(/^\D+/, '')) - 1
		} else if (input.match(/^IN_ANALOG/)) {
			inputtype = 'Line Input '
			inputnum = input.replace(/[^0-9]/g, '')
		} else if (input.match(/^IN_MEDIA_PLAYER/)) {
			inputtype = 'Media Player'
		}
		if (state.getUnmapped('DEVICE/device/audio/inputList/items/' + input + '/status/pp/isAvailable')){
			for (const channel of state.get('DEVICE/device/audio/inputList/items/' + input + '/channelList/itemKeys')) {
				if (state.getUnmapped('DEVICE/device/audio/inputList/items/' + input + '/channelList/items/' + channel + '/status/pp/isAvailable')) {
					ret.push({
						id: input + '_CH' + channel,
						label: `${inputtype}${inputnum}${inputplug === '' ? '' : ' ' + inputplug} Channel ${channelstart + parseInt(channel)}${inputlabel === '' ? '' : ' - ' + inputlabel}`,
					})
				}
			}
		}
	}
	return ret
}

export function getAudioSourceChoicesMidra(state: State): Dropdown<string>[] {
	return state.get('DEVICE/device/audio/sourceList/itemKeys').filter((itm: string) => {
		return state.get('DEVICE/device/audio/sourceList/items/'+itm+'/status/pp/isAvailable')
	}).map((itm: string) => {
		const label = itm
			.replace(/^NONE$/, 'None')
			.replace(/^IN_DANTE_CH(\d+)_(\d+)$/, 'Dante In Ch $1-$2')
			.replace(/^IN_ANALOG_/, 'Line Input ')
			.replace(/^IN_MEDIA_PLAYER$/, 'Media Player')
			.replace(/^CUSTOM_/, 'Custom ')
			.replace(/^IN/, 'Input ')

		return {
			id: itm,
			label
		}
	}) ?? []
}

export function getTimerArray(state: State): Choicemeta[] {
	const ret: Choicemeta[] = []
	const timers = state.get('DEVICE/device/timerList/items') ?? {}
	for (const timer of Object.keys(timers)) {
		ret.push({
			id: timer,
			label: timers[timer].control.pp.label,
			index: timer.replace(/^\w+_/, ''),
		})
	}
	return ret
}

export function getTimerChoices(state: State): Dropdown<string>[] {

	return getTimerArray(state).map((itm: Choicemeta) => {
		return {
			id: itm.id,
			label: `Timer ${itm.index}${itm.label === '' ? '' : ' - ' + itm.label}`
		}
	})
}
