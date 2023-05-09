/** Data model functions for the Advert data-type. */
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
Campaign.isOngoing = campaign => {
	let end = Campaign.end(campaign);
	if (end) {
		return end.getTime() > new Date().getTime();
	}
	// old data?
	return campaign.ongoing;
};

/**
 * @deprecated only retained so we can detect and filter out old master campaigns
 * @param {!Campaign} campaign 
 * @returns {boolean} NB: false for the TOTAL_IMPACT root 
 */
Campaign.isMaster = campaign => Campaign.assIsa(campaign) && campaign.master;

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
Campaign.getImpactDebits = ({campaign, status=KStatus.PUBLISHED}) => {
	// We have a couple of chained async calls. So we use an async method inside DataStore.fetch().	
	// NB: tried using plain async/await -- this is awkward with React render methods as the fresh Promise objects are always un-resolved at the moment of return.
	// NB: tried using a PromiseValue.pending() without fetch() -- again having fresh objects returned means they're un-resolved at that moment.
	return new PromiseValue(getImpactDebits2(campaign, status));
};

const getImpactDebits2 = async (campaign, status) => {
	let q = SearchQuery.setProp(null, "campaign", campaign.id);			
	let pvListImpDs = getDataList({type:"ImpactDebit",status,q,save:true});
	let v = await pvListImpDs.promise;
	return v;
}

/**
 * 
 * @param {!Campaign} campaign 
 * @returns {?String[]} ids to hide
 */
Campaign.hideCharities = campaign => {
	Campaign.assIsa(campaign);
	let hc = campaign.hideCharities;
	if ( ! hc) return null;

	// hideCharities is from a KeySet prop control, so is an object of schema {charity_id : bool}.
	// We want to convert it instead to a list of charity IDs
	if (Array.isArray(hc)) {
		return hc;
	}
	// Convert object to array
	let hideCharitiesArr = Object.keys(hc);
	// Remove false entries - keySet will not remove charity IDs, but set them to false instead.
	hideCharitiesArr = hideCharitiesArr.filter(cid => hc[cid]);
	return hideCharitiesArr;
};

/**
 * Get the list of ad IDs that this campaign will hide
 * NB: While you can merge the hideAds list with other campaigns, this is not used within the Impact Hub,
 * for simplicity of only having one list to manage instead of multiple across multiple campaigns
 * @param {Campaign} topCampaign 
 * @param {?Campaign[]} campaigns other campaigns to merge with
 * @returns {!String[]} hideAdverts IDs
 */
Campaign.hideAdverts = (topCampaign, campaigns) => {
    Campaign.assIsa(topCampaign);
    // Merge all hide advert lists together from all campaigns
    let allHideAds = topCampaign.hideAdverts ? keysetObjToArray(topCampaign.hideAdverts) : [];
    if (campaigns) {
		campaigns.forEach(campaign => allHideAds.push(... campaign.hideAdverts ? keysetObjToArray(campaign.hideAdverts) : []));
	}
    // Copy array
    const mergedHideAds = allHideAds.slice();
    return mergedHideAds;
}


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

/** Newest first. Safe default for pretty much everywhere here. */
const sortAdsList = adsList => adsList.hits.sort((a, b) => {
	if (a.created === b.created) return 0;
	return a.created < b.created ? 1 : -1;
});

/**
 * HACK: access=public
 * NB: This function does chained promises, so we use async + await for convenience.
 * @returns Promise List(Advert) All ads -- hidden ones are marked with a truthy `_hidden` prop
 */
const pAds2 = async function({campaign, status, query, isSub}) {
	Campaign.assIsa(campaign);
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
	sortAdsList(adl);

	// Label ads using hide list and non-served
	let ads = List.hits(adl);
	pAds3_labelHidden({campaign, ads});

	return adl;
};

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
	const pvAllAds = Campaign.pvAds({campaign, status});
	let allAds = List.hits(pvAllAds.value) || [];
	const viewcount4campaign = Advert.viewcountByCampaign(allAds);
	let totalViewCount = sum(Object.values(viewcount4campaign));
	return totalViewCount;
};


////////////////////////////////////////////////////////////////////
////                     CHARITY LOGIC                           ///
////////////////////////////////////////////////////////////////////

/**
 * FIXME Get a list of charities for a campaign
 * @param {Object} p 
 * @param {Campaign} p.campaign 
 * @param {KStatus} p.status The status of ads and sub-campaigns to fetch
 * @returns {NGO[]} May change over time as things load!
 */
 Campaign.charities = (campaign, status=KStatus.DRAFT, isSub) => {
	Campaign.assIsa(campaign);
	KStatus.assert(status);
	// charities listed here
	let charityIds = [];
	if (campaign.strayCharities) charityIds.push(...campaign.strayCharities);
	if (campaign.dntn4charity) charityIds.push(...Object.keys(campaign.dntn4charity));
	if (campaign.localCharities) charityIds.push(...Object.keys(campaign.localCharities));	

	let pvAds = Campaign.pvAds({campaign, status});
	if ( ! pvAds.value) {
		return charities2(campaign, charityIds, []);
	}
	let ads = List.hits(pvAds.value);
	if ( ! ads.length) console.warn("No Ads?!", campaign, status);
	// individual charity data, attaching ad ID
	let vcharitiesFromAds = charities2_fromAds(ads);
	// apply local edits
	return charities2(campaign, charityIds, vcharitiesFromAds);
}; // ./charities()

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
	const pvAllAds = Campaign.pvAds({campaign, status});
	let allAds = List.hits(pvAllAds.value) || [];
	console.log("res allAds: ", allAds)
	const viewcount4campaign = Advert.viewcountByCountry({ads:allAds});
	return viewcount4campaign;
};

export default Campaign;
