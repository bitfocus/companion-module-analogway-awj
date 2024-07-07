// const { CreateConvertToBooleanFeedbackUpgradeScript } = require('@companion-module/base')

import { CompanionMigrationAction } from "@companion-module/base"

type LooseObj = {[name: string]: any}
const UpgradeScripts = [
	/*
	 * Place your upgrade scripts here
	 * Remember that once it has been added it cannot be removed!
	 */

	// Update the option types from numbers to strings to accomodate expressions, add values for anchor
	function updatePositionAndSizeActionV2_4(_context, props: LooseObj) {
        const actions = props.actions
		const actionsToUpdate:CompanionMigrationAction[] = []

		actions.filter((action: CompanionMigrationAction) => action.actionId === 'devicePositionSize').forEach((oldAction: CompanionMigrationAction) => {
			const action = {...oldAction}
			action.options.x = oldAction.options.x?.toString() ?? 0
			action.options.y = oldAction.options.y?.toString() ?? 0
			action.options.w = oldAction.options.w?.toString() ?? 1920
			action.options.h = oldAction.options.h?.toString() ?? 1080
			if (action.options.xAnchor === undefined) action.options.xAnchor = 'lx + 0.5 * lw'
			if (action.options.yAnchor === undefined) action.options.yAnchor = 'ly + 0.5 * lh'
			if (action.options.ar === undefined) action.options.ar = ''

			actionsToUpdate.push(action)
		})
       
        return { 
            updatedConfig: null,
            updatedActions: actionsToUpdate,
            updatedFeedbacks: [],
        }
    },
	// Update the audio routing actions so they include the device option and add index to in/out
	function updateAudioRoutingV2_4(_context, props: LooseObj) {
		const actions = props.actions
		const actionsToUpdate:CompanionMigrationAction[] = []

		actions
			.filter((action: CompanionMigrationAction) => (
				(action.actionId === 'deviceAudioRouteBlock' || action.actionId === 'deviceAudioRouteChannels')
				&& action.options['device'] === undefined
			))
			.forEach((oldAction: CompanionMigrationAction) => {
				const action = {...oldAction}
				if (action.options.device === undefined) action.options.device = 1
				if (typeof action.options.device === 'string') action.options.device = parseInt(action.options.device)
				if (typeof action.options.device === 'number' && isNaN(action.options.device)) action.options.device = 1
				if (typeof action.options.device === 'number' && action.options.device < 1) action.options.device = 1

				if (action.options.out && !action.options.out1) action.options.out1 = action.options.out
				if (action.options.out && !action.options.out2) action.options.out2 = action.options.out
				if (action.options.out && !action.options.out3) action.options.out3 = action.options.out
				if (action.options.out && !action.options.out4) action.options.out4 = action.options.out
				if (action.options.out && action.options.out1) delete action.options.out
				if (action.options.in && !action.options.in1) action.options.in1 = action.options.in
				if (action.options.in && !action.options.in2) action.options.in2 = action.options.in
				if (action.options.in && !action.options.in3) action.options.in3 = action.options.in
				if (action.options.in && !action.options.in4) action.options.in4 = action.options.in
				if (action.options.in && action.options.in1) delete action.options.in

				actionsToUpdate.push(action)
			})
       
        return { 
            updatedConfig: null,
            updatedActions: actionsToUpdate,
            updatedFeedbacks: [],
        }

	},
	// Update the power option "wake" from midra to be "on", so it is inline with livepremier
	function updateMidraWakeV2_4(_context, props: LooseObj) {
		const actions = props.actions
		const actionsToUpdate:CompanionMigrationAction[] = []

		actions
			.filter((action: CompanionMigrationAction) => (action.actionId === 'devicePower' && action.options['action'] === 'wake'))
			.forEach((oldAction: CompanionMigrationAction) => {
				const action = {...oldAction}
				action.options.wake = 'on'

				actionsToUpdate.push(action)
			})
       
        return { 
            updatedConfig: null,
            updatedActions: actionsToUpdate,
            updatedFeedbacks: [],
        }

	},
]

export { UpgradeScripts }