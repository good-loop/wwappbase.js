
import _ from 'lodash';
import DataClass, {getType} from '../../base/data/DataClass';

/** Impact type. See Impact.java -- NB: copy-pasta from SoGive's Output.js. 
*/
class Impact extends DataClass {
	/** @type {Money}  */
	amount;
    charity;
    /** @type {?string} e.g. "impressions" */
    input;
	/** @type {Number} Number of units output, e.g. the number of malaria nets */
	n;
    /** @type {String} */
	name;
    notes;
    progress;
    rate;
    ref;
	constructor(base) {
		super();
		DataClass._init(this, base);
	}

}
DataClass.register(Impact, "Impact");
const This = Impact;
export default Impact;

/**
 * Is this a dynamic impact, which should be calculated from e.g. impressions*rate?
 * @param {!Impact} impact 
 * @returns {boolean}
 */
Impact.isDynamic = impact => !! impact.rate;

/**
 * HACK says yes to "carbon" "carbon offset(s)" "carbon offset (kg)" etc.
 * @param {?Impact} impact 
 * @returns {boolean}
 */
Impact.isCarbonOffset = impact => impact?.name && impact.name.substring(0, 6)==="carbon";