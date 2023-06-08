
import _ from 'lodash';
import DataClass, {getType} from './DataClass';
import Enum from 'easy-enums';
import Impact from './Impact';
import { is } from '../utils/miscutils';

/** See ImpactDebit.java
*/
class ImpactDebit extends DataClass {
	/** @type {Impact}  */
	impact;

	/** @type{?String} */
	agencyId;

	/** @type{?XId} Monday Donation */
	crm;

	/** @type{?XId} Monday Deal */
	crmDeal;

	/** @type{?string} */
	start;

	/** @type{?string} */
	end;

	/** @type{?String} */
	vertiser;

	constructor(base) {
		super();
		DataClass._init(this, base);
	}
}

DataClass.register(ImpactDebit, "ImpactDebit");
const This = ImpactDebit;
export default ImpactDebit;
