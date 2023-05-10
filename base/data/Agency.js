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
 * See Agency.java
 */
class Agency extends DataClass {
}
DataClass.register(Agency, "Agency"); 
export default Agency;

/**
 * 
 * @param {!Agency} agencyId
 * @param {?KStatus} status 
 * @returns {PromiseValue} List<Agency>
 */
Agency.getChildren = (agencyId, status=KStatus.PUBLISHED) => {
    let q = SearchQuery.setProp(null, "parentId", agencyId);
    return getDataList({type:"Agency",status,q,save:true});
}

