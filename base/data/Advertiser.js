/** Data model functions for the Advert data-type. */
import { assert, assMatch } from '../utils/assert';
import Enum from 'easy-enums';
import DataClass from './DataClass';
import C from '../CBase';
import ActionMan from '../plumbing/ActionManBase';
import DataStore from '../plumbing/DataStore';
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
//     return true;  
// };

/**
 * Get the master campaign for a vertiser
 */
Advertiser.masterCampaign = (vertiser) => {
    return vertiser.campaign;
}

/**
 * 
 * @param {!String} vertiserId 
 * @param {?KStatus} status 
 * @returns {PromiseValue} List<Advertiser>
 */
Advertiser.getChildren = (vertiserId, status=KStatus.PUBLISHED) => {
    let q = SearchQuery.setProp(null, "parentId", vertiserId).query;
    return getDataList({type:"Advertiser",status,q});
}

/**
 * Get the child brands of multiple advertisers at once
 * @param {*} vertiserIds 
 * @param {*} status 
 */
Advertiser.getManyChildren = (vertiserIds, status=KStatus.PUBLISHED) => {
    let sqSubBrands = SearchQuery.setPropOr(new SearchQuery(), "parentId", vertiserIds).query;
	return getDataList({type: C.TYPES.Advertiser, status, q:sqSubBrands});
}

Advertiser.getImpactDebits = ({vertiser, status=KStatus.PUBLISHED}) => {
    let p = getImpactDebits2({vertiser, status});
	return new PromiseValue(p);
}

const getImpactDebits2 = async ({vertiser, status=KStatus.PUBLISHED}) => {
    let masterCampaign = await Campaign.fetchMasterCampaign(vertiser, status)?.promise;
    return masterCampaign ? await Campaign.getImpactDebits({campaign:masterCampaign, status}).promise : new List();
}
