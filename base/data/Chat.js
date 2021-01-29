
/** Data model functions for the Advert data-type. */
import { assert, assMatch } from '../utils/assert';
import DataClass from './DataClass';


class Line {
	/** @type {String} "user" */
	from;
	/** @type {String} */
	text;
}

/**
 * NB: in shared base, cos Portal and CalStat use this
 */
class Chat extends DataClass {

	/**
	 * @type {Line[]} 
	*/
	lines = [];

	/**
	 * @param {Chat} base 
	 */
	constructor(base) {
		super();
		DataClass._init(this, base);
	}
}
DataClass.register(Chat, "Chat"); 
