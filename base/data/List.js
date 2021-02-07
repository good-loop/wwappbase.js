/**
	List of server results -- for use with Crud ActionMan.list and ListLoad

	format:

	{
		hits: [{id, type, status}]
		total: Number
		??index ??start ??first: Number ??cursor
	}

*/
import { assert, assMatch } from '../utils/assert';
import DataClass, {getType, getId, nonce} from './DataClass';
import C from '../CBase';
import { Item } from '../plumbing/DataStore';

/**
 * Reference for a data item. Given this, you can get the data item from DataStore.
 * This can also _be_ a data-item itself.
 */
class Hit {
	id;
	type;
	status;
}

/** Based on ES, a (maybe partial) List of hits with total */
class List extends DataClass {
	/**
	 * @type {Hit[]}
	 */
	hits;

	/** @type {Number} */
	total;

	/**
	 * 
	 * @param {?Object|Hit[]|Item[]} base If an array, then set hits=base. Otherwise use as a base for {hits, total}
	 */
	constructor(base) {
		super();
		if (Array.isArray(base)) {
			this.hits = base;
			base = null;
		}
		DataClass._init(this, base);
	}

	/** more lenient duck typing: does it have a hits array? */
	static isa(listy) {
		if ( ! listy) return false;
		if (super.isa(listy, List)) return true;
		return listy.hits && listy.hits.length !== undefined;
	}
};
DataClass.register(List, "List");

const This = List;
export default List;

/**
 * @param {?List} list 
 * @returns {?Item[]}
 */
List.hits = list => list && List.assIsa(list) && list.hits;
/**
 * 
 * @param {List} list 
 * @returns {Number}
 */
List.total = list => {
	return list.hits.length;
	// list.total; TODO total can double count if type=all-bar-trash
}

/**
 * Add in place, item to list
 * @param {*} item 
 * @param {List} list 
 * @param {?int} index Optional insertion index (defaults to the end of the list)
 */
List.add = (item, list, index) => {
	const items = List.hits(list);
	if (index !== undefined) {
		items.splice(index, 0, item);
	} else {
		items.push(item);
	}
	list.total = items.length;
	return list;
};

/**
 * Remove in place, item to list
 * @param {*} item Can match on id
 * @param {List} list 
 * @returns {Boolean} true if a remove was made
 */
List.remove = (item, list) => {
	assert(item && list, "List.js NPE");
	assert(list.hits, "No hits? Not a 'List'!", list);
	const idi = getId(item) || nonce();
	let h2 = list.hits.filter(h => h !== item && getId(h) !== idi);
	const r = h2.length < list.hits.length;
	list.hits = h2;
	return r;
};

// TODO page cursor logic
