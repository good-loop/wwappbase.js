/**
	Money NB: based on the thing.org type MonetaryAmount
	TODO It'd be nice to make this immutable (can we use Object.freeze to drive that thrgough??)
*/
import {assert, assMatch} from 'sjtest';
import {isa, defineType, getType, nonce} from './DataClass';
import C from '../CBase';

/** impact utils */
const Task = defineType('Task'); // not this 'cos its project specific: C.TYPES.Money
const This = Task;
export default Task;

/**
 */
Task.make = (base = {}) => {
	const item = {
		id: nonce(),
		oxid: Login.getId(),
		// created: new Date(),
		...base, // Base comes after defaults so it overrides
		'@type': 'Task' // @type always last so it overrides any erroneous base.type
	};
	// TODO @you and #tag
	return item;
};
