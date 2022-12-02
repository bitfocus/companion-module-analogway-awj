import AWJinstance from './index'
// import InstanceSkel = require('../../../instance_skel')
import { CompanionVariable } from '../../../instance_skel_types'
//import { getLiveInputChoices } from './choices'

export function initVariables(_instance: AWJinstance): CompanionVariable[] {
	const variables: CompanionVariable[] = [
		{
			label: 'Selected Preset',
			name: 'selectedPreset',
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
