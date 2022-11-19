import AWJinstance from './index'
// import InstanceSkel = require('../../../instance_skel')
import { CompanionVariable } from '../../../instance_skel_types'
import { getLiveInputChoices } from './choices'

export function initVariables(instance: AWJinstance): void {
	const variables: CompanionVariable[] = [
		{
			label: 'Selected Preset',
			name: 'selectedPreset',
		},
	]

	for (let input of getLiveInputChoices(instance.state)) {
		input = input['id'].replace('LIVE_', '')
		variables.push({
			label: 'Freeze state of input ' + input,
			name: 'frozen_IN_' + input,
		})
	}

	instance.setVariableDefinitions(variables)
}
