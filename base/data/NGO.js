/** Data model functions for the NGO data-type. */
import {assert} from 'sjtest';

import DataClass from './DataClass';

class NGO extends DataClass {
	constructor(base) {
		super(base);
		Object.assign(this, base);
	}
}
DataClass.register(NGO);
export default NGO;

NGO.description = (ngo) => NGO.isa(ngo) && ngo.description;
