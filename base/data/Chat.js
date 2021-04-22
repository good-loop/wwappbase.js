
/** Data model functions for the Advert data-type. */
import { assert, assMatch } from '../utils/assert';
import DataClass from './DataClass';


class ChatLine {
	/** @type {String} XId or "user" */
	from;
	/** @type {String} */
	text;
	
	created;
}

/**
 * NB: in shared base, cos Portal and CalStat use this
 */
class Chat extends DataClass {

	/**
	 * @type {ChatLine[]} 
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

export default Chat;
export {
	ChatLine
};
