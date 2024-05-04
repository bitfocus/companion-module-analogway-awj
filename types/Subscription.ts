import { AWJinstance } from '../src/index.js';

// import { DeviceMap, DeviceMappingFunction } from '../types/DeviceMap';
export type Subscription = {
	pat: string;
	fbk?: string | string[];
	ini?: string[] | ((args: any) => string[]);
	fun?: (instance: AWJinstance, path?: string | string[], _value?: string | string[] | number | boolean) => boolean;

};
