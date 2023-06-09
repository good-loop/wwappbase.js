/** Data model functions for the Campaign data-type. */
import { assert, assMatch } from '../utils/assert';
import Enum from 'easy-enums';
import DataClass from './DataClass';
import C from '../CBase';
import ActionMan from '../plumbing/ActionManBase';
import SearchQuery from '../../base/searchquery';
import List from './List';
import DataStore, { getDataPath, getListPath } from '../plumbing/DataStore';
import deepCopy from '../utils/deepCopy';
import { getDataItem, getDataList, saveEdits } from '../plumbing/Crud';
import PromiseValue from '../promise-value';
import KStatus from './KStatus';
import Advert from './Advert';
import Advertiser from './Advertiser';
import Agency from './Agency';
import ServerIO, {normaliseSogiveId} from '../plumbing/ServerIOBase';
import { is, keysetObjToArray, uniq, uniqById, yessy, mapkv, idList, sum, getUrlVars } from '../utils/miscutils';
import { asDate } from '../utils/date-utils';
import { getId } from './DataClass';
import NGO from './NGO';
import Money from './Money';
import Branding from './Branding';
import XId from './XId';

/**
 * NB: in shared base, cos Portal and ImpactHub use this
 * 
 * See Campaign.java
 */
class Campaign extends DataClass {
	/** @type {?string} */
	id

	/** @type {?String} */
	agencyId;

	/** @type {?Branding} */
	branding;

	/** @type {?String} url */
	caseStudy;

	/** @type {?XId} Monday Deal */
	crm;

	/**
	 * @deprecated (kept for old data)
	 *  @type{?boolean} */
	master;

	/** @type {?String} */
	vertiser;

	/** @type {?Money} */
	dntn;

	/** @type {?LineItem} */
	topLineItem;

	/**
	 * @param {Campaign} base 
	 */
	constructor(base) {
		super();
		DataClass._init(this, base);
	}
}
DataClass.register(Campaign, "Campaign"); 

/**
 * Special id for "everything!"
 */
Campaign.TOTAL_IMPACT = "TOTAL_IMPACT";

/**
 * This is the DRAFT budget
 * @returns {Budget|null}
 */
Campaign.budget = item => {
	let tli = item.topLineItem;
	return tli? tli.budget : null;
};
/**
 * @returns {Date|null}
 */
Campaign.start = item => {
	let tli = item.topLineItem;
	return tli? asDate(tli.start) : null;
};
/**
 * @returns {Date|null}
 */
 Campaign.end = item => {
	let tli = item.topLineItem;
	return tli? asDate(tli.end) : null;
}

 /** 
 * @param {Advert} advert
 * @param {KStatus} [status]
 * @returns PromiseValue(Campaign)
 */
Campaign.fetchFor = (advert, status = KStatus.DRAFT) => {
	let cid = Advert.campaign(advert);
	if (!cid) return new PromiseValue(Promise.resolve(null));
	let pvc = getDataItem({type:"Campaign",status,id:cid});
	return pvc;
};

/**
 * Get all campaigns matching an advertiser
 * @param {string} vertiserId
 * @param {KStatus} [status]
 * @returns PromiseValue(Campaign[])
 */
 Campaign.fetchForAdvertiser = (vertiserId, status = KStatus.DRAFT) => {
	return Campaign.fetchForAdvertisers([vertiserId], status);
}

/**
 * Get all campaigns matching a set of advertisers
 * @param {String[]} vertiserIds
 * @param {KStatus} [status]
 * @returns PromiseValue(Campaign)
 */
Campaign.fetchForAdvertisers = (vertiserIds, status = KStatus.DRAFT) => {
	return new PromiseValue(fetchVertisers2(vertiserIds, status));
}

const fetchVertisers2 = async (vertiserIds, status) => {
	const pvSubBrands = Advertiser.getManyChildren(vertiserIds);
	const subBrands = List.hits(await pvSubBrands.promise);
	let allVertiserIds = [...vertiserIds, ...uniq(subBrands.map(brand => brand.id).filter(x=>x))]
	let q = SearchQuery.setPropOr(new SearchQuery(), "vertiser", allVertiserIds).query;
	let pvCampaigns = ActionMan.list({type: C.TYPES.Campaign, status, q});
	return await pvCampaigns.promise;
}

/**
 * Get all campaigns matching an agency.
 * Initially returns [], and fills in array as requests load
 * @param {String} agencyId
 * @param {KStatus} [status]
 * @returns {PromiseValue} PromiseValue(Campaign[])
 */
Campaign.fetchForAgency = (agencyId, status=KStatus.DRAFT) => {
	if (!agencyId) return [];
	// Campaigns with set agencies
	let agencySQ = new SearchQuery();
	agencySQ = SearchQuery.setProp(agencySQ, "agencyId", agencyId);
	//let pvCampaigns = ActionMan.list({type: C.TYPES.Campaign, status, q});
	// Campaigns with advertisers belonging to agency
	let pvVertisers = ActionMan.list({type: C.TYPES.Advertiser, status, q:agencySQ.query});
	let sq = new SearchQuery();
	if (pvVertisers.value && pvVertisers.value.hits && pvVertisers.value.hits.length) sq = SearchQuery.setPropOr(sq, "vertiser", List.hits(pvVertisers.value).map(vertiser => vertiser.id));
	sq = SearchQuery.or(agencySQ, sq);

	let pvCampaigns = ActionMan.list({type: C.TYPES.Campaign, status, q:sq.query});

	return pvCampaigns;
}

/**
 * Create a new campaign for an advert
 * @param {Advert} advert
 * @returns {PromiseValue<Campaign>}
 */
Campaign.makeFor = (advert) => {
	let cid = Advert.campaign(advert);
	assMatch(cid, String, "Campaign.makeFor bad input",advert);
	// NB: we can't fetch against the actual data path, as that could hit a cached previous failed fetchFor() PV
	// Which is OK -- crud's processing will set the actual data path
	return DataStore.fetch(['transient','Campaign',cid], () => {
		// pass in the advertiser ID
		let vertiser = advert.vertiser;
		let vertiserName = advert.vertiserName;
		let baseCampaign = {id:cid, vertiser, vertiserName};
		return saveEdits({type:"Campaign", id:cid, item:baseCampaign});
	});	
};

/**
 * Get the ImpactDebits for this campaign
	* @param {Object} p
 * @param {Campaign} p.campaign
 * @param {String} p.campaignId
 * @param {KStatus} [p.status]
 * @returns {PromiseValue} PV(List<ImpactDebit>)
 */
Campaign.getImpactDebits = ({campaign, campaignId, status = KStatus.PUBLISHED}) => {
	// We have a couple of chained async calls. So we use an async method inside DataStore.fetch().	
	// NB: tried using plain async/await -- this is awkward with React render methods as the fresh Promise objects are always un-resolved at the moment of return.
	// NB: tried using a PromiseValue.pending() without fetch() -- again having fresh objects returned means they're un-resolved at that moment.
	if (!campaignId) campaignId = campaign.id;
	return DataStore.fetch(getListPath({type: C.TYPES.ImpactDebit, status, for: campaignId}), () => getImpactDebits2(campaignId, status));
};

const getImpactDebits2 = async (campaignId, status) => {
	let q = SearchQuery.setProp(null, "campaign", campaignId);
	let pvListImpDs = getDataList({type:"ImpactDebit",status,q,save:true});
	let v = await pvListImpDs.promise;
	return v;
}


/**
 * Get the viewcount for a campaign, summing the ads (or using the override numPeople)
 * FIXME This hides a LOT of asynchronous work behind a PV and relies on the "redraw whole tree when anything at all happens" model to work
 * Refactor this - and dependent code - to expose the PromiseValue
 * @param {Object} p
 * @param {Campaign} p.campaign
 * @param {KStatus} p.status
 * @returns {Number}
 */
Campaign.viewcount = ({campaign, status}) => {
	// manually set?
	if (campaign.numPeople) {
		return campaign.numPeople;
	}
	const pvAds = Advert.fetchForCampaign({campaignId:campaign.id, status});
	if (!pvAds.resolved) return null; // best we can do without big refactor: signify "answer not ready yet"

	const ads = List.hits(pvAds.value) || [];
	if (!ads?.length) return {}; // Empty campaign - stop before Advert.viewcountByCountry spams the console

	const viewcount4campaign = Advert.viewcountByCampaign(ads);
	return sum(Object.values(viewcount4campaign));
};


/**
 * FIXME This hides a LOT of asynchronous work behind a PV and relies on the "redraw whole tree when anything at all happens" model to work
 * Refactor this - and dependent code - to expose the PromiseValue
 * @param {Object} p
 * @param {Campaign} p.campaign
 * @param {KStatus} p.status
 * @returns {object<{String: Number}>}
 */
Campaign.viewcountByCountry = ({campaign, status}) => {
	if (!campaign) {
		console.log('Campaign.viewcountByCountry: no campaign!');
		return {};
	}

	const pvAds = Advert.fetchForCampaign({ campaignId: campaign.id, status });
	if (!pvAds.resolved) return null; // best we can do without big refactor: signify "answer not ready yet"

	const ads = List.hits(pvAds.value);
	if (!ads?.length) return {}; // Empty campaign - stop before Advert.viewcountByCountry spams the console

	return Advert.viewcountByCountry({ ads });
};

export default Campaign;
