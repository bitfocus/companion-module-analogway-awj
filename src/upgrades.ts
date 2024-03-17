// const { CreateConvertToBooleanFeedbackUpgradeScript } = require('@companion-module/base')

import { CompanionMigrationAction } from "@companion-module/base"

type LooseObj = {[name: string]: any}
const UpgradeScripts = [
	/*
	 * Place your upgrade scripts here
	 * Remember that once it has been added it cannot be removed!
	 */
	function updatePositionAndSizeActionV2_4(_context, props: LooseObj) {
        const actions = props.actions
		const actionsToUpdate:CompanionMigrationAction[] = []

		actions.filter((action: CompanionMigrationAction) => action.actionId === 'devicePositionSize').forEach((oldAction: CompanionMigrationAction) => {
			const action = {...oldAction}
			action.options.x = oldAction.options.x?.toString() ?? 0
			action.options.y = oldAction.options.y?.toString() ?? 0
			action.options.w = oldAction.options.w?.toString() ?? 1920
			action.options.h = oldAction.options.h?.toString() ?? 1080
			if (action.options.xAnchor === undefined) action.options.xAnchor = '0.5'
			if (action.options.yAnchor === undefined) action.options.yAnchor = '0.5'
			if (action.options.ar === undefined) action.options.ar = ''

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