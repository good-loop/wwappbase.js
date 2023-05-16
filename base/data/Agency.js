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
import PromiseValue from '../promise-value';

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

Agency.getImpactDebits = ({agency, agencyId, status=KStatus.PUBLISHED}) => {
    /*
    let masterCampaign = await Campaign.fetchMasterCampaign(vertiser, status)?.promise;
    return masterCampaign ? await Campaign.getImpactDebits({campaign:masterCampaign, status}).promise : new List();*/

    return new PromiseValue(getImpactDebits2(agency?.id || agencyId, status));
}

const getImpactDebits2 = async (agencyId, status) => {
    let q;
    // What if it's a master brand, e.g. Nestle > Nespresso?
    // The only way to know is to look for children
    let pvListAgencies = Agency.getChildren(agencyId);
    let listAgencies = await pvListAgencies.promise; // ...wait for the results
    let ids = List.hits(listAgencies).map(adv => adv.id); // may be [], which is fine
    ids = ids.concat(agencyId); // include the top-level brand
    q = SearchQuery.setPropOr(null, "agency", ids);
    let pvListImpDs = getDataList({type:"ImpactDebit",status,q,save:true});
    let v = await pvListImpDs.promise;
    return v;
}