/** Data model functions for the Advert data-type. */
import { assert, assMatch } from '../utils/assert';
import Enum from 'easy-enums';
import DataClass from './DataClass';
import C from '../CBase';
import ActionMan from '../plumbing/ActionManBase';
import DataStore from '../plumbing/DataStore';
import deepCopy from '../utils/deepCopy';
import { getDataItem } from '../plumbing/Crud';
import KStatus from './KStatus';

/**
 * NB: in shared base, cos Portal and ImpactHub use this
 * 
 * See Campaign.java
 */
class Campaign extends DataClass {
	
	/**
	 * @param {Advert} base 
	 */
	constructor(base) {
		super();
		DataClass._init(this, base);
	}
}
DataClass.register(Campaign, "Campaign"); 

/**
 * 
 * @param {Advert|Advertiser} advert 
 * @param {?String} status 
 */
Campaign.fetchFor = (advert,status=KStatus.DRAFT) => {
	let cid = Advert.campaign(advert);
	let pvc = getDataItem({type:"Campaign",status,id:cid});
	return pvc;
};

export default Campaign;
