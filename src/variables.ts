import { CompanionVariableDefinition } from '@companion-module/base'
import {AWJinstance} from './index'

export function initVariables(_instance: AWJinstance): CompanionVariableDefinition[] {
	const variables: CompanionVariableDefinition[] = [
		{
			variableId: 'connectionLabel',
			name: 'The label of this connection',
		},
		{
			variableId: 'selectedPreset',
			name: 'Selected Preset',
		},
	]

	// for (const input of getLiveInputChoices(instance.state)) {
	// 	variables.push({
	// 		label: 'Freeze state of input ' + input.label,
	// 		name: 'frozen_IN_' + input.id.replace('LIVE_', ''),
	// 	})
	// }

	return variables
}
