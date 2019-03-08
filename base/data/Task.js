/**
	Money NB: based on the thing.org type MonetaryAmount
	TODO It'd be nice to make this immutable (can we use Object.freeze to drive that thrgough??)
*/
import {assert, assMatch} from 'sjtest';
import DataClass, {getType, nonce} from './DataClass';
import C from '../CBase';

/** impact utils */
class Task extends DataClass {

	id;
	oxid;
	url;

	constructor(base) {
		const item = {
			id: nonce(),
			oxid: Login.getId(),
			url: ""+window.location, // The whole url! Which could pick up misc cookies accidentally (cookie crumbs)
			// created: new Date(),
			...base // Base comes after defaults so it overrides
		};
		// parent-child? TODO would parent-holds child be better??
		if (item.parent) {
			Task.assIsa(item.parent, "Task.js make()");
		}
		// TODO @you and #tag
		super(item);
		Object.assign(this, item);
	}

};
DataClass.register(Task, 'Task');
const This = Task;
export default Task;
