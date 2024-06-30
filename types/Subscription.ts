/**
 * This object holds all the paths we need to react on when receiving an update from the devive
 * @property pat - The pattern to subscribe for changes in JSON-Path like notation. It will be regex tested against the actual path.
 * @property fbk - id of the feedback to check if that path is updated, can be a string with one feedback or an array with multiple feedbacks
 * @property fun - Gives a function which is called with the path and eventually the value. Some subscriptions are used only for updating the internal state, some are used to fill variables and/or feedback. Can return true to run update afterwards.
 * @property def - Default value to use if not connected to a real device
 * @property {string[][]} defitems - Default items to use if not connected to a real device. Outer array for the item lists, inner array for the items in the list.
 */
export type Subscription = {
	pat: string;
	fbk?: string | string[];
	ini?: string[] | ((args: any) => string[]);
	fun?: (path?: string | string[], _value?: string | string[] | number | boolean) => boolean;

};
