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
 * @returns {?Budget}
 */
Campaign.budget = item => {
	let tli = item.topLineItem;
	return tli? tli.budget : null;
};
/**
 * @returns {?Date}
 */
Campaign.start = item => {
	let tli = item.topLineItem;
	return tli? asDate(tli.start) : null;
};
/**
 * @returns {?Date}
 */
 Campaign.end = item => {
	let tli = item.topLineItem;
	return tli? asDate(tli.end) : null;
}

 /** 
 * @param {Advert} advert 
 * @param {?KStatus} status 
 * @returns PromiseValue(Campaign)
 */
Campaign.fetchFor = (advert,status=KStatus.DRAFT) => {
	let cid = Advert.campaign(advert);
	if (!cid) return new PromiseValue(Promise.resolve(null));
	let pvc = getDataItem({type:"Campaign",status,id:cid});
	return pvc;
};

/**
 * Get all campaigns matching an advertiser
 * @param {string} vertiserId
 * @param {KStatus} status
 * @returns PromiseValue(Campaign[])
 */
 Campaign.fetchForAdvertiser = (vertiserId, status=KStatus.DRAFT) => {
	return Campaign.fetchForAdvertisers([vertiserId], status);
}

/**
 * Get all campaigns matching a set of advertisers
 * @param {String[]} vertiserIds
 * @param {KStatus} status
 * @returns PromiseValue(Campaign)
 */
Campaign.fetchForAdvertisers = (vertiserIds, status=KStatus.DRAFT) => {
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
 * @param {KStatus} status
 * @returns PromiseValue(Campaign[])
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
 * Create a new campaign
 * @param {Advert} advert 
 * @returns PromiseValue(Campaign)
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
 * @returns {PromiseValue} PV(List<ImpactDebit>)
 */
Campaign.getImpactDebits = ({campaign, campaignId, status=KStatus.PUBLISHED}) => {
	// We have a couple of chained async calls. So we use an async method inside DataStore.fetch().	
	// NB: tried using plain async/await -- this is awkward with React render methods as the fresh Promise objects are always un-resolved at the moment of return.
	// NB: tried using a PromiseValue.pending() without fetch() -- again having fresh objects returned means they're un-resolved at that moment.
	if (!campaignId) campaignId = campaign.id;
	return DataStore.fetch(getListPath({type: C.TYPES.ImpactDebit, status, for:campaignId}), () => getImpactDebits2(campaignId, status));
};

const getImpactDebits2 = async (campaignId, status) => {
	let q = SearchQuery.setProp(null, "campaign", campaignId);			
	let pvListImpDs = getDataList({type:"ImpactDebit",status,q,save:true});
	let v = await pvListImpDs.promise;
	return v;
}

/**
 * Get the viewcount for a campaign, summing the ads (or using the override numPeople)
 * @param {Object} p
 * @param {Campaign} p.campaign 
 * @returns {Number}
 */
Campaign.viewcount = ({campaign, status}) => {
	// manually set?
	if (campaign.numPeople) {
		return campaign.numPeople;
	}
	//	const pvAllAds = Advert.fetchForCampaign({campaignId:campaign.id, status});
	const pvAllAds = Campaign.pvAds({campaign:campaign, status:status});
	let allAds = List.hits(pvAllAds.value) || [];
	const viewcount4campaign = Advert.viewcountByCampaign(allAds);
	let totalViewCount = sum(Object.values(viewcount4campaign));
	return totalViewCount;
};

/**
 * 
 * @param {!Campaign} campaign 
 * @param {?String[]} charityIds 
 * @param {!NGO[]} charities 
 * @returns {NGO[]}
 */
Campaign.viewcountByCountry = ({campaign, status}) => {
	if(!campaign){
		console.log("res: no camp!")
		return []
	}
	const pvAllAds = Advert.fetchForCampaign({campaignId:campaign.id, status});
	let allAds = List.hits(pvAllAds.value) || [];
	const viewcount4campaign = Advert.viewcountByCountry({ads:allAds});
	return viewcount4campaign;
};

/**
 * Code below is a temporary patch (as of 19/05/23)
 * It was all removed during the master campaign culling but the replacement code doesn't seem to work.
 * Vera will be back in a week and we can cover the new code then but right now this works. 
 * Gonna keep poking at the new code for a bit though & hopefully get rid of this patch
 *  - lewis
 */

/**
 * Get (and cache) all ads associated with the given campaign. This will apply hide-list and never-served filters 
* @param {Object} p 
 * @param {Campaign} p.campaign 
 * @param {?KStatus} p.status
 * @param {?String} p.query Filter by whatever you want, eg data
 * @returns PromiseValue(List(Advert)) HACK Adverts get `_hidden` added if they're excluded.
 */
Campaign.pvAds = ({campaign,status=KStatus.DRAFT,query}) => {
	let pv = DataStore.fetch(['misc','pvAds',status,query||'all',campaign.id], () => {
		return pAds2({campaign,status,query});
	});
	return pv;
};

/**
 * HACK: access=public
 * NB: This function does chained promises, so we use async + await for convenience.
 * @returns Promise List(Advert) All ads -- hidden ones are marked with a truthy `_hidden` prop
 */
 const pAds2 = async function({campaign, status, query, isSub}) {
	Campaign.assIsa(campaign);
	if (campaign.master && ! isSub) { // NB: a poorly configured campaign can be a master and a leaf
		// Assume no direct ads
		// recurse
		const pvSubs = Campaign.pvSubCampaigns({campaign});
		let subsl = await pvSubs.promise;
		let subs = List.hits(subsl);
		let AdListPs = subs.map(sub => {
			let pSubAds = pAds2({campaign:sub, status:KStatus.PUBLISHED, query, isSub:true});
			return pSubAds;
		});
		let adLists = await Promise.all(AdListPs);
		let ads = [];
		adLists.forEach(adl => ads.push(...List.hits(adl)));
		// adds can be hidden at leaf or master
		pAds3_labelHidden({campaign, ads});

		const list = new List(ads);
		sortAdsList(list);
		return list;
	}

	// leaf campaign
	// fetch ads
	let sq = SearchQuery.setProp(null, "campaign", campaign.id);
	if (query) sq = SearchQuery.and(sq, new SearchQuery(query));
	// ...HACK allow Impact Hub to fetch an unfiltered but cleansed list
	//    But not for previews, as access=public cannot read DRAFT
	const access = status==KStatus.PUBLISHED? "public" : null; 
	// ...fetch
	const pvAds = ActionMan.list({type: C.TYPES.Advert, status, q:sq.query, access});
	let adl = await pvAds.promise;
	List.assIsa(adl);

	// Label ads using hide list and non-served
	let ads = List.hits(adl);
	pAds3_labelHidden({campaign, ads});

	return adl;
};

/** Newest first. Safe default for pretty much everywhere here. */
const sortAdsList = adsList => adsList.hits.sort((a, b) => {
	if (a.created === b.created) return 0;
	return a.created < b.created ? 1 : -1;
});

const pAds3_labelHidden = ({campaign, ads}) => {
	// manually hidden
	const hideAdverts = Campaign.hideAdverts(campaign);
	for (let hi = 0; hi < hideAdverts.length; hi++) {
		const hadid = hideAdverts[hi];
		const ad = ads.find(ad => ad.id === hadid);
		if (ad) {
			ad._hidden = campaign.id; // truthy + tracks why it's hidden
		}
	}
	// non served
	if (campaign.showNonServed) {
		return;
	}
	ads.forEach(ad => {
		if ( ! ad.hasServed && ! ad.serving) {
			ad._hidden = "non-served";
		}
	});
};

// End of temporary patch code

export default Campaign;
