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
 * 
 * @param {!Advertiser} adv Actually only the id is needed, so if you have that you can use {id} without having to fetch the Advertiser
 * @param {?KStatus} status 
 * @returns {PromiseValue} List<Advertiser>
 */
Advertiser.getChildren = (adv, status=KStatus.PUBLISHED) => {
    let q = SearchQuery.setProp(null, "parentId", adv.id).query;
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