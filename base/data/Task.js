/**
	Money NB: based on the thing.org type MonetaryAmount
	TODO It'd be nice to make this immutable (can we use Object.freeze to drive that thrgough??)
*/
import {assert, assMatch} from 'sjtest';
import DataClass, {getType, nonce} from './DataClass';
import C from '../CBase';

const TASKS_SERVER = "calstat.good-loop.com";

/** impact utils */
class Task extends DataClass {

	id;
	oxid;
	url;
	created;

	/**
	 * @type {Task[]}
	 */
	children;

	constructor(base) {
		const item = {
			id: nonce(),
			oxid: Login.getId(),
			url: ""+window.location, // The whole url! Which could pick up misc cookies accidentally (cookie crumbs)
			created: new Date().getTime(),
			...base // Base comes after defaults so it overrides
		};
		// HACK no url on the tasks server itself
		if (item.url.includes(TASKS_SERVER)) delete item.url;
		// TODO @you and #tag
		super(item);		
		Object.assign(this, item);
		// parent-child
		if (item.parent) {
			Task.setParent(this, item.parent);
		}
	}

};
DataClass.register(Task, 'Task');
const This = Task;
export default Task;

const STAGE_CLOSED = 'closed';

/**
 * Set links in both objects.
 */
Task.setParent = (child, parent) => {
	Task.assIsa(child, "Task.js child not a Task");
	Task.assIsa(parent, "Task.js parent not a Task");
	let kids = parent.children || [];
	// guard against dupes
	if ( ! kids.find(k => k.id===child.id)) {
		parent.children = kids.concat(child);
	}
	// avoid circular ref, which breaks json
	delete child.parent;
	child.parentId = parent.id;
};

/**
 * It's done! close the task
 */
Task.close = task => {
	task.closed = true;
	task.stage = STAGE_CLOSED;
	return task;
};

Task.open = task => {
	task.closed = false;
	task.stage = "open";
	return task;
};