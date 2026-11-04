import type { CompanionFeedbackDefinitions, CompanionFeedbackInfo } from '@companion-module/base'

// API 1.13 evaluates edited feedbacks without repeating subscribe/unsubscribe.
export function refreshFeedbackSubscriptions(definitions: CompanionFeedbackDefinitions): CompanionFeedbackDefinitions {
	for (const definition of Object.values(definitions)) {
		if (definition?.type !== 'boolean' || !definition.subscribe) continue
		const { subscribe, unsubscribe, callback } = definition
		const active = new Map<string, CompanionFeedbackInfo>()
		definition.subscribe = async (feedback, context) => {
			await subscribe(feedback, context)
			active.set(feedback.id, structuredClone(feedback))
		}
		definition.unsubscribe = async (feedback, context) => {
			const previous = active.get(feedback.id) ?? feedback
			active.delete(feedback.id)
			await unsubscribe?.(previous, context)
		}
		definition.callback = async (feedback, context) => {
			const previous = active.get(feedback.id)
			if (!previous || JSON.stringify(previous.options) !== JSON.stringify(feedback.options)) {
				if (previous) await unsubscribe?.(previous, context)
				await subscribe(feedback, context)
				active.set(feedback.id, structuredClone(feedback))
			}
			return callback(feedback, context)
		}
	}
	return definitions
}
