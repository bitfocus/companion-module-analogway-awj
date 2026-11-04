import test from 'node:test'
import assert from 'node:assert/strict'
import { refreshFeedbackSubscriptions } from '../dist/src/feedback-subscriptions.js'
import Actions from '../dist/src/awjdevice/actions.js'

test('feedback option edits replace subscriptions and clean up the last evaluated options', async () => {
	const calls = []
	const definitions = refreshFeedbackSubscriptions({
		custom: {
			type: 'boolean', name: 'Custom', options: [],
			subscribe: (feedback) => calls.push(['subscribe', feedback.options.path]),
			unsubscribe: (feedback) => calls.push(['unsubscribe', feedback.options.path]),
			callback: () => true,
		},
	})
	const feedback = { id: 'f1', options: { path: 'old' } }
	await definitions.custom.subscribe(feedback, {})
	assert.equal(await definitions.custom.callback(feedback, {}), true)
	feedback.options.path = 'new'
	await definitions.custom.callback(feedback, {})
	await definitions.custom.callback(feedback, {})
	await definitions.custom.unsubscribe(feedback, {})
	assert.deepEqual(calls, [['subscribe', 'old'], ['unsubscribe', 'old'], ['subscribe', 'new'], ['unsubscribe', 'new']])
})

test('AWJ get action writes value and type through the action context', async () => {
	const actions = Object.create(Actions.prototype)
	actions.instance = {
		parseVariablesInString: async (value) => value,
		AWJtoJsonPath: () => ['device', 'value'],
		log: () => { /* No host logger in this test. */ },
	}
	actions.state = { get: () => 42 }
	const values = {}
	await actions.cstawjgetcmd.callback({ options: { path: 'DeviceObject/value', variableValue: 'value', variableType: 'type' } }, {
		setCustomVariableValue: (name, value) => { values[name] = value },
	})
	assert.deepEqual(values, { value: '42', type: 'number' })
})

test('screen visibility uses serializable object data', () => {
	const actions = Object.create(Actions.prototype)
	actions.choices = { getScreenChoices: () => [{ id: 'S1', label: 'Screen 1' }], getScreensArray: () => [{ id: 'S1', index: 1 }], getLayerChoices: () => [] }
	const option = actions.deviceLayerFreeze.options.find((option) => option.id === 'layerS1')
	assert.equal(option.isVisible({ screen: ['S1'] }, JSON.parse(JSON.stringify(option.isVisibleData))), true)
	assert.equal(option.isVisible({ screen: ['S2'] }, option.isVisibleData), false)
})
