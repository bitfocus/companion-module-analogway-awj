import AWJinstance from './index'
import { SomeCompanionConfigField } from '../../../instance_skel_types'

export const fadeFpsDefault = 10

export interface Config {
	deviceaddr: string
	macaddress: string
	sync: boolean
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

export function GetConfigFields(self: AWJinstance): SomeCompanionConfigField[] {
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
			regex: '/^([0-9a-fA-F]{2}[,:-_.\\s]){5}[0-9a-fA-F]{2}$/',
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
			id: 'coltext',
			type: 'text',
			label: 'Colors',
			value: 'The colors are used as default colors for presets, actions and feedbacks',
			width: 12,
		},
		{
			id: 'color_bright',
			type: 'colorpicker',
			label: 'Bright',
			default: self.rgb(255, 255, 255),
			width: 4,
		},
		{
			id: 'color_dark',
			type: 'colorpicker',
			label: 'Dark',
			default: self.rgb(34, 42, 49),
			width: 4,
		},
		{
			id: 'color_highlight',
			type: 'colorpicker',
			label: 'Highlight',
			default: self.rgb(33, 133, 208),
			width: 4,
		},
		{
			id: 'color_green',
			type: 'colorpicker',
			label: 'Green',
			default: self.rgb(0, 220, 19),
			width: 4,
		},
		{
			id: 'color_greendark',
			type: 'colorpicker',
			label: 'Green-dark',
			default: self.rgb(0, 160, 11),
			width: 4,
		},
		{
			id: 'color_greengrey',
			type: 'colorpicker',
			label: 'Green-grey',
			default: self.rgb(70, 85, 72),
			width: 4,
		},
		{
			id: 'color_red',
			type: 'colorpicker',
			label: 'Red',
			default: self.rgb(255, 87, 22),
			width: 4,
		},
		{
			id: 'color_reddark',
			type: 'colorpicker',
			label: 'Red-dark',
			default: self.rgb(216, 0, 0),
			width: 4,
		},
		{
			id: 'color_redgrey',
			type: 'colorpicker',
			label: 'Red-grey',
			default: self.rgb(85, 70, 70),
			width: 4,
		},
	]
}
