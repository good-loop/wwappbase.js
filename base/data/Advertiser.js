/** Data model functions for the Advert data-type. */
import { assert, assMatch } from '../utils/assert';
import Enum from 'easy-enums';
import DataClass from './DataClass';
import C from '../CBase';
import ActionMan from '../plumbing/ActionManBase';
import DataStore, { getDataPath, getListPath } from '../plumbing/DataStore';
import deepCopy from '../utils/deepCopy';
import { getDataItem, getDataList } from '../plumbing/Crud';
import NGO from './NGO';
import KStatus from './KStatus';
import { getDataLogData, pivotDataLogData } from '../plumbing/DataLog';
import SearchQuery from '../searchquery';
import ServerIO from '../plumbing/ServerIOBase';
import Branding from './Branding';
import Campaign from './Campaign';
import List from './List';
import PromiseValue from '../promise-value';

/**
 * See Advertiser.java
 */
class Advertiser extends DataClass {
}
DataClass.register(Advertiser, "Advertiser");
export default Advertiser;

// /**
//  * Not stored on the parent - find out by looking for children
//  */
// Advertiser.isMaster = (adv) => {
// 	return true;
// };

/**
 * Get the master campaign for a vertiser
 */
Advertiser.masterCampaign = (vertiser) => {
	return vertiser.campaign;
};

/**
 * 
 * @param {!String} vertiserId 
 * @param {?KStatus} status 
 * @returns {PromiseValue} List<Advertiser>
 */
Advertiser.getChildren = (vertiserId, status=KStatus.PUBLISHED) => {
	let q = SearchQuery.setProp(null, "parentId", vertiserId).query;
	return getDataList({type:"Advertiser",status,q, save:true});
};

/**
 * Get the child brands of multiple advertisers at once
 * @param {*} vertiserIds 
 * @param {*} status 
 */
Advertiser.getManyChildren = (vertiserIds, status=KStatus.PUBLISHED) => {
	let sqSubBrands = SearchQuery.setPropOr(new SearchQuery(), "parentId", vertiserIds).query;
	return getDataList({type: C.TYPES.Advertiser, status, q:sqSubBrands, save:true});
};

Advertiser.getImpactDebits = ({vertiser, vertiserId, status=KStatus.PUBLISHED}) => {
	if (!vertiserId) vertiserId = vertiser.id;
	return DataStore.fetch(getListPath({type: C.TYPES.ImpactDebit, status, for:vertiserId}), () => getImpactDebits2(vertiser?.id || vertiserId, status));
};

const getImpactDebits2 = async (vertiserId, status) => {
	let q;
	console.log("VERTISER ID", vertiserId);
	// What if it's a master brand, e.g. Nestle > Nespresso?
	// The only way to know is to look for children
	let pvListAdvertisers = Advertiser.getChildren(vertiserId);
	let listAdvertisers = await pvListAdvertisers.promise; // ...wait for the results
	let ids = List.hits(listAdvertisers).map(adv => adv.id); // may be [], which is fine
	ids = ids.concat(vertiserId); // include the top-level brand
	q = SearchQuery.setPropOr(null, "vertiser", ids);
	let pvListImpDs = getDataList({type:"ImpactDebit",status,q,save:true});
	let v = await pvListImpDs.promise;
	return v;
};
