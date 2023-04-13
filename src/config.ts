import { combineRgb, SomeCompanionConfigField } from '@companion-module/base'

export interface Config {
	deviceaddr: string
	macaddress: string
	sync: boolean
	showDisabled: boolean
	color_bright: number
	color_dark: number
	color_highlight: number
	color_green: number
	color_greendark: number
	color_greengrey: number
	color_red: number
	color_reddark: number
	color_redgrey: number
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			id: 'deviceaddr',
			type: 'textinput',
			label: 'Device Network Address',
			tooltip:
				'Enter the address of the device either as hostname or an IPv4 or IPv6 address with optional port number and optional credentials.',
			width: 12,
			default: 'http://192.168.2.140',
		},
		{
			id: 'macaddress',
			type: 'textinput',
			label: 'Device MAC Address',
			tooltip: 'Will be automaticalle filled with the MAC of the last connected Device',
			regex: '/^$|^([0-9a-fA-F]{2}[,:-_.\\s]){5}[0-9a-fA-F]{2}$/',
			default: '',
			width: 12,
		},
		{
			id: 'sync',
			type: 'checkbox',
			label: 'Turn sync selection on after connection established',
			default: true,
			width: 12,
		},
		{
			id: 'showDisabled',
			type: 'checkbox',
			label: 'Show also disabled inputs in dropdowns',
			default: false,
			width: 12,
		},
		{
			id: 'coltext',
			type: 'static-text',
			label: 'Colors',
			value: 'The colors are used as default colors for presets, actions and feedbacks',
			width: 12,
		},
		{
			id: 'color_bright',
			type: 'colorpicker',
			label: 'Bright',
			default: combineRgb(255, 255, 255),
			width: 4,
		},
		{
			id: 'color_dark',
			type: 'colorpicker',
			label: 'Dark',
			default: combineRgb(34, 42, 49),
			width: 4,
		},
		{
			id: 'color_highlight',
			type: 'colorpicker',
			label: 'Highlight',
			default: combineRgb(33, 133, 208),
			width: 4,
		},
		{
			id: 'color_green',
			type: 'colorpicker',
			label: 'Green',
			default: combineRgb(0, 220, 19),
			width: 4,
		},
		{
			id: 'color_greendark',
			type: 'colorpicker',
			label: 'Green-dark',
			default: combineRgb(0, 160, 11),
			width: 4,
		},
		{
			id: 'color_greengrey',
			type: 'colorpicker',
			label: 'Green-grey',
			default: combineRgb(70, 85, 72),
			width: 4,
		},
		{
			id: 'color_red',
			type: 'colorpicker',
			label: 'Red',
			default: combineRgb(255, 87, 22),
			width: 4,
		},
		{
			id: 'color_reddark',
			type: 'colorpicker',
			label: 'Red-dark',
			default: combineRgb(216, 0, 0),
			width: 4,
		},
		{
			id: 'color_redgrey',
			type: 'colorpicker',
			label: 'Red-grey',
			default: combineRgb(85, 70, 70),
			width: 4,
		},
	]
}
