import { StateMachine } from './../state'

type Dropdown<t> = {id: t, label: string}

export type Choicemeta = { id: string, label: string, index?: string, longname?: string, device?: number }

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

export function getScreensAuxArray(state: StateMachine, getAlsoDisabled = false): Choicemeta[] {
	return [...getScreensArray(state, getAlsoDisabled), ...getAuxArray(state, getAlsoDisabled)]
}

export function getScreensArray(state: StateMachine, getAlsoDisabled = false): Choicemeta[] {

	const screens = state.get('DEVICE/device/screenList/items')
	if (screens) {
		return Object.keys(screens)
			.filter(key => key.startsWith('S') && (getAlsoDisabled || screens[key].status.pp.mode != 'DISABLED'))
			.map(key => {return {
				id: key,
				label: screens[key].control.pp.label,
				index: key.slice(1)
			}})
	} else {
		return [
			{ id: 'S1', label: '(emulated)', index: '1' },
			{ id: 'S2', label: '(emulated)', index: '2' }
		]
	}
}

export function getScreenChoices(state: StateMachine): Dropdown<string>[] {

	return getScreensArray(state).map((scr: Choicemeta) => {
		return {
			id: scr.id,
			label: `S${scr.index}${scr.label === '' ? '' : ' - ' + scr.label}`
		}
	})
}

export function getAuxArray(state: StateMachine, getAlsoDisabled = false ): Choicemeta[] {

	const screens = state.getUnmapped('DEVICE/device/screenList/itemKeys').filter((key: string) => key.startsWith('A'))
	if (screens) {
		return screens
			.filter((screen: string) => getAlsoDisabled || state.get(`DEVICE/device/screenList/items/${ screen }/status/pp/mode`) != 'DISABLED')
			.map((screen: string) => {return {
				id: screen,
				label: state.get(`DEVICE/device/screenList/items/${ screen }/control/pp/label`),
				index: screen.slice(1)
			}})

	} else {
		return [
			{ id: 'A1', label: '(emulated)', index: '1' },
			{ id: 'A2', label: '(emulated)', index: '2' }
		]
	}
}

export function getAuxChoices(state: StateMachine): Dropdown<string>[] {

	return getAuxArray(state).map((scr: Choicemeta) => {
		return {
			id: scr.id,
			label: `A${scr.index}${scr.label === '' ? '' : ' - ' + scr.label}`
		}
	})
}

export function getScreenAuxChoices(state: StateMachine): Dropdown<string>[] {
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

export function getPlatformScreenChoices(state: StateMachine): Dropdown<string>[] {
	return getScreenAuxChoices(state) 
}

export function getLiveInputArray(state: StateMachine, prefix?: string): Choicemeta[] {

	if(prefix == undefined) prefix = 'IN'
	const items = state.getUnmapped('DEVICE/device/inputList/itemKeys')
	if (items) {
		return items
			.filter((key: string) => state.getUnmapped(`DEVICE/device/inputList/items/${ key }/status/pp/isAvailable`)
				&& (state.getUnmapped('LOCAL/config/showDisabled') || state.getUnmapped(`DEVICE/device/inputList/items/${ key }/status/pp/isEnabled`)))
			.map((key: string) => { 
				return {
					id: key.replace(/^\w+_/, prefix + '_'),
					label: state.getUnmapped(`DEVICE/device/inputList/items/${ key }/control/pp/label`),
					index: key.replace(/^\w+_/, '')
				}
			})
	}

	return []
}

export function getLiveInputChoices(state: StateMachine, prefix?: string): Dropdown<string>[] {
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
		if (prefix == undefined) prefix = 'IN'
		for (let i = 1; i <= 12; i += 1) {
			ret.push({ id: `${prefix}_${i.toString()}`, label: `Input ${i.toString()} (emulated)` })
		}
	}
	return ret
}

export function getAuxBackgroundChoices(_state: StateMachine): Dropdown<string>[] {
	return [] // not available at LivePremier
}

export const choicesForegroundImagesSource: Dropdown<string>[] = [
	{ id: 'NONE', label: 'None' },
	{ id: 'TOP_1', label: 'Foreground Image 1' },
	{ id: 'TOP_2', label: 'Foreground Image 2' },
	{ id: 'TOP_3', label: 'Foreground Image 3' },
	{ id: 'TOP_4', label: 'Foreground Image 4' },
]

export function getStillsArray(state: StateMachine): Choicemeta[] {
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

export function getSourceChoices(state: StateMachine): Dropdown<string>[] {
	// first add None and Color which are always available
	const ret:Dropdown<string>[] = [
		{ id: 'NONE', label: 'None' },
		{ id: 'COLOR', label: 'Color' },
	]

	// next add live inputs
	ret.push( ...getLiveInputChoices(state, 'LIVE') )
	
	// next add still images
	ret.push(...getStillsArray(state).map((itm: Choicemeta) => {
		return {
			id: `STILL_${itm.id}`,
			label: `Image ${itm.id}${itm.label === '' ? '' : ' - ' + itm.label}`,
		}
	}))

	return ret
}

export function getAuxSourceChoices(state: StateMachine): Dropdown<string>[] {
	
	return [
		{ id: 'NONE', label: 'None' }, // first add None and Color which are always available
		...getLiveInputChoices(state, 'LIVE'), // next add live inputs
		...getStillsArray(state).map((itm: Choicemeta) => { // next add still images
			return {
				id: `STILL_${itm.id}`,
				label: `Image ${itm.id}${itm.label === '' ? '' : ' - ' + itm.label}`,
			}
		}),
		...getScreensArray(state)
			.filter((itm: Choicemeta) => { // last add split-layer screen pgms for reinsertion
				return state.get(`DEVICE/device/screenList/items/${itm.id}/status/pp/mixingMode`) === 'SPLIT'
			})
			.map((itm: Choicemeta) => {
				return {
					id: `SCREEN_${itm.index}`,
					label: `Screen ${itm.index} PGM${itm.label === '' ? '' : ' - ' + itm.label}`
				}
			})
	]
}

export function getPlugChoices(state: StateMachine, input: string): Dropdown<string>[] {
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
				label: `Plug ${ plug } - ` + plugtype[type]
			}
		}
	) ?? []
}

export function getMasterMemoryArray(state: StateMachine): Choicemeta[] {
	const bankpath = 'DEVICE/device/masterPresetBank/bankList'
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

export function getMasterMemoryChoices(state: StateMachine): Dropdown<string>[] {

	return getMasterMemoryArray(state).map((mem: Choicemeta) => {
		return {
			id: mem.id,
			label: `MM${mem.id}${mem.label === '' ? '' : ' - ' + mem.label}`
		}
	})
}

export function getScreenMemoryArray(state: StateMachine): Choicemeta[] {
	const bankpath = 'DEVICE/device/presetBank/bankList'
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

export function getScreenMemoryChoices(state: StateMachine): Dropdown<string>[] {

	return getScreenMemoryArray(state).map((mem: Choicemeta) => {
		return {
			id: mem.id,
			label: `SM${mem.id}${mem.label === '' ? '' : ' - ' + mem.label}`
		}
	})
}

export function getAuxMemoryArray(state: StateMachine): Choicemeta[] {
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

export function getAuxMemoryChoices(state: StateMachine): Dropdown<string>[] {

	return getAuxMemoryArray(state).map((mem: Choicemeta) => {
		return {
			id: mem.id,
			label: `AM${mem.id}${mem.label === '' ? '' : ' - ' + mem.label}`
		}
	})
}

export function getLayerMemoryArray(state: StateMachine): string[] {
	return (
		state.get('DEVICE/device/layerBank/bankList/itemKeys')?.filter((mem: string) => {
			return state.get(['DEVICE', 'device', 'layerBank', 'bankList', 'items', mem, 'status', 'pp', 'isValid'])
		}) ?? []
	)
}

export function getLayerMemoryChoices(state: StateMachine): Dropdown<string>[] {
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

export function getMultiviewerMemoryArray(state: StateMachine): Choicemeta[] {
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

export function getMultiviewerMemoryChoices(state: StateMachine): Dropdown<string>[] {

	return getMultiviewerMemoryArray(state).map((mem: Choicemeta) => {
		return {
			id: mem.id,
			label: `VM${mem.id}${mem.label === '' ? '' : ' - ' + mem.label}`
		}
	})
}

export function getMultiviewerArray(state: StateMachine): string[] {
	return (
		state.get('DEVICE/device/monitoringList/itemKeys')?.filter((mvKey: string) => {
			return state.get(['DEVICE', 'device', 'monitoringList', 'items', mvKey, 'status', 'pp', 'isEnabled'])
		}) ?? ['1']
	)
}

export function getMultiviewerChoices(state: StateMachine): Dropdown<string>[] {
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

export function getWidgetChoices(state: StateMachine): Dropdown<string>[] {
	const ret: Dropdown<string>[] = []

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
	
	return ret
}

export function getWidgetSourceChoices(state: StateMachine): Dropdown<string>[] {
	// first add None which is always available
	const ret: Dropdown<string>[] = [{ id: 'NONE', label: 'None' }]

	// next add Screens
	for (const screen of getScreensArray(state)) {
		ret.push({
			id: 'PROGRAM_S' + screen.index,
			label: `Screen ${screen.index} PGM${screen.label === '' ? '' : ' - ' + screen.label}`,
		})
		ret.push({
			id: 'PREVIEW_S' + screen.index,
			label: `Screen ${screen.index} PVW${screen.label === '' ? '' : ' - ' + screen.label}`,
		})
	}

	// next add Auxscreens
	for (const screen of getAuxArray(state)) {
		ret.push({
			id: screen.id,
			label: `Aux ${screen.index} PGM${screen.label === '' ? '' : ' - ' + screen.label}`,
		})
	}

	// next add live inputs
	ret.push(...getLiveInputChoices(state))

	// next add timer
	ret.push(...getTimerChoices(state))

	// next add still images
	ret.push(...getStillsArray(state).map((itm: Choicemeta) => {
		return {
			id: `STILL_${itm.id}`,
			label: `Image ${itm.id}${itm.label === '' ? '' : ' - ' + itm.label}`,
		}
	}))

	return ret
}

export function getLayersAsArray(state: StateMachine, param: string | number, bkg?: boolean): string[] {
	const ret: string[] = []
	let layercount = 0
	if (typeof param === 'number') {
		if (bkg === undefined || bkg === true) ret.push('NATIVE')
		for (let i = 1; i <= param; i += 1) {
			ret.push(i.toString())
		}
		return ret
	} else if (typeof param === 'string') {
		if (bkg === undefined || bkg === true) ret.push('NATIVE')
		layercount = state.get(`DEVICE/device/screenList/items/${param}/status/pp/layerCount`) ?? 1
		for (let i = 1; i <= layercount; i += 1) {
			ret.push(i.toString())
		}
		return ret
	}
	return ret
}

/**
 * Returns array with some layer choices
 * @param param if it is a number that number of layer choices are returned, if it is a string the layers of the screen are returned
 * @param bkg wether to include only live layers (false) or also background and eventually foreground layer (true or omitted) 
 */
export function getLayerChoices(state: StateMachine, param: string | number, bkg?: boolean): Dropdown<string>[] {
	const ret: Dropdown<string>[] = []
	let layercount = 0
	if (typeof param === 'number') {
		if (bkg === undefined || bkg === true) ret.push({ id: 'NATIVE', label: 'Background' })
		for (let i = 1; i <= param; i += 1) {
			ret.push({ id: `${i.toString()}`, label: `Layer ${i.toString()}` })
		}
		return ret
	} else if (typeof param === 'string') {	
		if (bkg === undefined || bkg === true) ret.push({ id: 'NATIVE', label: 'Background' })
		layercount = state.get(`DEVICE/device/screenList/items/${param}/status/pp/layerCount`) ?? 1
		for (let i = 1; i <= layercount; i += 1) {
			ret.push({ id: `${i.toString()}`, label: `Layer ${i.toString()}` })
		}
		return ret
	}
	return ret
}

export function getOutputArray(state: StateMachine): Choicemeta[] {
	return state.get('DEVICE/device/outputList/itemKeys')?.filter((itm: string) => {
		return state.get(`DEVICE/device/outputList/items/${itm}/status/pp/isAvailable`) === true
	}).map((itm: string) => {
		return {
			id: itm,
			label: state.get(`DEVICE/device/outputList/items/${itm}/control/pp/label`)
		}
	}) ?? []

}

export function getOutputChoices(state: StateMachine): Dropdown<string>[] {
	return getOutputArray(state).map((itm: Choicemeta) => {
		return {
			id: itm.id,
			label: `Output ${itm.id}${itm.label === '' ? '' : ' - ' + itm.label}`
		}
	})
}

/**
 * getAudioOutputsArray
 * @param state the state object holding the data
 * @param device optional number of device to return outputs for
 * @returns array of output describing objects
 */
export function getAudioOutputsArray(state: StateMachine, _device?: number): Choicemeta[] {
	const ret: Choicemeta[] = []
	const outputs = state.get('DEVICE/device/audio/control/txList/itemKeys') ?? []
	for (const out of outputs) {
		const outputnum = out.split('_')[1]
		if (out.startsWith('OUTPUT') && state.get(`DEVICE/device/outputList/items/${ outputnum }/status/pp/isAvailable`)) {
			ret.push({
				id: out,
				label: state.get(`DEVICE/device/outputList/items/${ outputnum }/control/pp/label`),
				index: outputnum,
				longname: 'Output'
			})
		}
		if (out.startsWith('DANTE') && state.get(`DEVICE/device/system/dante/channelList/items/${ out }_CHANNEL_8/status/pp/isAvailable`)) {
			ret.push({
				id: out,
				label: '',
				index: outputnum,
				longname: 'Dante'
			})
		}
		if (out.startsWith('MVW') && state.get(`DEVICE/device/monitoringList/items/${ outputnum }/status/pp/isAvailable`)) {
			ret.push({
				id: out,
				label: state.get(`DEVICE/device/monitoringList/items/${ outputnum }/control/pp/label`),
				index: outputnum,
				longname: 'Multiviewer'
			})
		}
	}
	return ret
}

export function getAudioOutputChoices(state: StateMachine): Dropdown<string>[] {
	const ret: Dropdown<string>[] = []
	for (const out of getAudioOutputsArray(state)) {
		const channels = state.get(`DEVICE/device/audio/control/txList/items/${out.id}/channelList/itemKeys`) ?? []
		const [outputtype, outnum] = out.id.split('_')
		for (const channel of channels) {
			let label = '',
				outputLabel = ''
			if (outputtype === 'OUTPUT') {
				outputLabel = state.get(`DEVICE/device/outputList/items/${ outnum }/control/pp/label`)
				label = `Output ${outnum} Channel ${channel}${outputLabel === '' ? '' : ' - ' + outputLabel}`
			} else if (outputtype === 'DANTE') {
				outputLabel = state.get(
					`DEVICE/device/system/dante/channelList/items/${ out.id }_CHANNEL_${ channel }/transmitter/status/pp/label`
				)
				label = `Dante Channel ${(parseInt(outnum) - 1) * 8 + parseInt(channel)}${
					outputLabel === '' ? '' : ' - ' + outputLabel
				}`
			} else if (outputtype === 'MVW') {
				outputLabel = state.get(`DEVICE/device/monitoringList/items/${ outnum }/control/pp/label`)
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

export function getAudioCustomBlockChoices(): Dropdown<string>[] {
	const ret: Dropdown<string>[] = []
	for (let block = 1; block <= 10; block += 1) {
		for (let channel = 1; channel <= 8; channel += 1) {
			ret.push({
				id: `CUSTOM_${ block.toString() }:` + channel.toString(),
				label: `Custom ${  block.toString() } Channel ` + channel.toString(),
			})
		}
	}
	return ret
}

export function getAudioInputChoices(state: StateMachine): Dropdown<string>[] {
	const ret = [{ id: 'NONE', label: 'No Source' }]
	const inputs = state.get('DEVICE/device/audio/control/rxList/itemKeys') ?? []
	for (const input of inputs) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const [inputtype, inputnum, _channel, channelnum] = input.split('_')
		if (inputtype === 'INPUT' && state.get(`DEVICE/device/inputList/items/IN_${ inputnum }/status/pp/isAvailable`)) {
			const inputLabel = state.get(`DEVICE/device/inputList/items/IN_${ inputnum }/control/pp/label`)
			ret.push({
				id: input,
				label: `Input ${inputnum} Channel ${channelnum}${inputLabel === '' ? '' : ' - ' + inputLabel}`,
			})
		} else if (
			inputtype === 'DANTE' &&
			state.get(`DEVICE/device/system/dante/channelList/items/${ input }/status/pp/isAvailable`)
		) {
			const inputLabel = state.get(`DEVICE/device/system/dante/channelList/items/${ input }/source/status/pp/label`)
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

export function getTimerArray(state: StateMachine): Choicemeta[] {
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

export function getTimerChoices(state: StateMachine): Dropdown<string>[] {

	return getTimerArray(state).map((itm: Choicemeta) => {
		return {
			id: itm.id,
			label: `Timer ${itm.index}${itm.label === '' ? '' : ' - ' + itm.label}`
		}
	})
}
