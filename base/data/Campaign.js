/** Data model functions for the Advert data-type. */
import { assert, assMatch } from '../utils/assert';
import Enum from 'easy-enums';
import DataClass from './DataClass';
import C from '../CBase';
import ActionMan from '../plumbing/ActionManBase';
import SearchQuery from '../../base/searchquery';
import List from './List';
import DataStore, { getDataPath } from '../plumbing/DataStore';
import deepCopy from '../utils/deepCopy';
import { getDataItem, saveEdits } from '../plumbing/Crud';
import PromiseValue from 'promise-value';
import KStatus from './KStatus';
import Advert from './Advert';
import {normaliseSogiveId} from '../plumbing/ServerIOBase';
import { is, keysetObjToArray, uniq, uniqById, yessy, mapkv, idList, sum } from '../utils/miscutils';
import { getId } from './DataClass';
import NGO from './NGO';
import Money from './Money';

/**
 * NB: in shared base, cos Portal and ImpactHub use this
 * 
 * See Campaign.java
 */
class Campaign extends DataClass {
	
	/** @type{String} */
	agencyId;

	/** @type{String} */
	vertiser;

	/**
	 * @param {Campaign} base 
	 */
	constructor(base) {
		super();
		DataClass._init(this, base);
	}
}
DataClass.register(Campaign, "Campaign"); 

/** This is the total unlocked across all adverts in this campaign. See also maxDntn.
 * @returns {?Money}
 */
Campaign.dntn = campaign => campaign && campaign.dntn;

/**
 * 
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
 * Get the master campaign of a multi campaign object
 * @param {Advertiser|Agency} multiCampaign 
 * @returns PromiseValue(Campaign)
 */
Campaign.fetchMasterCampaign = (multiCampaign, status=KStatus.DRAFT) => {
    if (!multiCampaign.campaign) return null;
    let pvCampaign = getDataItem({type:C.TYPES.Campaign,status,id:multiCampaign.campaign});
    return pvCampaign;
}

/**
 * Get all campaigns matchin an advertiser
 * @param {Advertiser} vertiser
 * @param {KStatus} status
 * @returns PromiseValue(Campaign)
 */
 Campaign.fetchForAdvertiser = (vertiserId, status=KStatus.DRAFT) => {
    let q = SearchQuery.setProp(new SearchQuery(), "vertiser", vertiserId).query;
    let pvCampaigns = ActionMan.list({type: C.TYPES.Campaign, status, q});
    return pvCampaigns;
}

/**
 * Get all campaigns matching a set of advertisers
 * @param {String[]} vertiserIds
 * @param {KStatus} status
 * @returns PromiseValue(Campaign)
 */
Campaign.fetchForAdvertisers = (vertiserIds, status=KStatus.DRAFT) => {
    let q = SearchQuery.setPropOr(new SearchQuery(), "vertiser", vertiserIds).query;
    let pvCampaigns = ActionMan.list({type: C.TYPES.Campaign, status, q});
    return pvCampaigns;
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
 * @returns {String[]} hideAdverts IDs
 */
Campaign.hideAdverts = (topCampaign, campaigns) => {
    Campaign.assIsa(topCampaign);
    // Merge all hide advert lists together from all campaigns
    let allHideAds = topCampaign.hideAdverts ? keysetObjToArray(topCampaign.hideAdverts) : [];
    if (campaigns) campaigns.forEach(campaign => allHideAds.push(... campaign.hideAdverts ? keysetObjToArray(campaign.hideAdverts) : []));
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
 * @param {Object} adshiddenById TODO
 * @returns PromiseValue(List(Advert))
 */
Campaign.pvAds = ({campaign,status=KStatus.DRAFT,query,adshiddenById}) => {
	return DataStore.fetch(['misc','pvAds',status,query||'all',campaign.id], () => {
		return pAds2({campaign,status,query,adshiddenById});
	});
};

/**
 * NB: This function does chained promises, so we use async + await for convenience.
 * @returns Promise List(Advert)
 */
const pAds2 = async function({campaign, status, query, adshiddenById}) {
	Campaign.assIsa(campaign);
	if (campaign.master) {
		// Assume no direct ads
		// recurse
		const pvSubs = Campaign.pvSubCampaigns({campaign});
		let subsl = await pvSubs.promise;
		let subs = List.hits(subsl);
		let AdListPs = subs.map(sub => {
			let pSubAds = pAds2({campaign:sub, status:KStatus.PUBLISHED, query, adshiddenById});
			return pSubAds;
		});
		let adLists = await Promise.all(AdListPs);
		let ads = [];
		adLists.forEach(adl => ads.push(...List.hits(adl)));
		return new List(ads);
	}

	// leaf campaign
	let sq = SearchQuery.setProp(null, "campaign", campaign.id);
	if (query) sq = SearchQuery.and(sq, new SearchQuery(query));
	const pvAds = ActionMan.list({type: C.TYPES.Advert, status, q:sq.query});
	// filter
	let adl = await pvAds.promise;
	let ads = List.hits(adl);
	// Filter ads using hide list
	const hideAdverts = Campaign.hideAdverts(campaign);
	ads = ads.filter(ad => ! hideAdverts.includes(ad.id));
	// Only show serving ads unless otherwise specified
	ads = Campaign.filterNonServedAds(ads, campaign.showNonServed);
	return new List(ads);
};


/**
 * Removes ads that have never served from an ad list
 * @param {Advert[]} ads 
 * @returns {Advert[]} filtered ads
 */
Campaign.filterNonServedAds = (ads, showNonServed) => {
	if (showNonServed) return ads;
    return ads.filter(ad => ad.hasServed || ad.serving);
}

/**
 * @DEPRECATED
 * Get a list of adverts that the impact hub will hide for this campaign.
 * Use case: for Portal, so the controls for hidden ad objects can show ad info
 * 
 * @param {Campaign} topCampaign the subject campaign
 * @param {?Campaign[]} campaigns any other campaigns with data to use (for advertisers or agencies)
 * @param {?KStatus} status
 * @returns PromiseValue(Advert[]) adverts to hide - returns null if no hide adverts
 */
Campaign.advertsToHide = (topCampaign, campaigns, status=KStatus.DRAFT) => {
    
    // Filter ads using hide list - but reversed: _load_ the hide list
    const hideAdverts = Campaign.hideAdverts(topCampaign, campaigns);
    if ( ! yessy(hideAdverts)) {
		return null;
	}
	let q = SearchQuery.setPropOr(new SearchQuery(), "id", hideAdverts).query;
	let pvAds = ActionMan.list({type: C.TYPES.Advert, status, q});
	// No serving or sampling filter - we want a direct list of ads marked as HIDE
	return pvAds;
};

const tomsCampaigns = /(josh|sara|ella)/; // For matching TOMS campaign names needing special treatment

/**
 * @param {!Advert} ad 
 * @returns {!string} Can be "unknown" to fill in for no-campaign odd data items
 */
const campaignNameForAd = ad => {
	if (!ad.campaign) return "unknown";
	// HACK FOR TOMS 2019 The normal code returns 5 campaigns where there are 3 synthetic campaign groups
	// Dedupe on "only the first josh/sara/ella campaign" instead
	if (ad.vertiser === 'bPe6TXq8' && ad.campaign && ad.campaign.match(tomsCampaigns)) {
		let cname = ad.campaign.match(tomsCampaigns)[0];
		return cname;
	}
	return ad.campaign;
};

/**
 * Get the viewcount for a set of campaigns
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
 * 
 * @param {!Campaign} campaign 
 * @returns {?Object} {type, id} the master agency/advertiser or {}. 
 * NB: advertiser takes precedence, so you can usefully call this on a leaf campaign.
 */
Campaign.masterFor = campaign => {
	Campaign.assIsa(campaign);
	if (campaign.vertiser) return {type:C.TYPES.Advertiser, id:campaign.vertiser};
	if (campaign.agencyId) return {type:C.TYPES.Agency, id:campaign.agencyId};
	return {}; // NB: this is to support `let {type, id} = Campaign.masterFor()` without an NPE
};

/**
 * 
 * @param {!Campaign} campaign 
 * @param {?KStatus} status 
 * @returns PV(List<Campaign>)
 */
Campaign.pvSubCampaigns = ({campaign, status=KStatus.DRAFT, query}) => {
	Campaign.assIsa(campaign);
	if ( ! campaign.master) {
		return new PromiseValue(new List([]));
	}
	// fetch leaf campaigns	
	let {id, type} = Campaign.masterFor(campaign);
	// campaigns for this advertiser / agency
	let sq = SearchQuery.setProp(query, C.TYPES.isAdvertiser(type)? "vertiser" : "agencyId", id);
	sq = SearchQuery.and(sq, "-id:"+campaign.id); // exclude this
	const pvCampaigns = ActionMan.list({type: C.TYPES.Campaign, status:KStatus.PUBLISHED, q:sq.query}); 
	// NB: why change sub-status? We return the state after this campaign is published (which would not publish sub-campaigns)
	return pvCampaigns;
};

Campaign.dntn4charity = () => {

	??
}

/**
 * FIXME Get a list of charities for a campaign
 * @param {Object} p 
 * @param {Campaign} p.campaign 
 * @param {KStatus} p.status
 * @returns {NGO[]} May change over time as things load!
 */
 Campaign.charities = (campaign, status=KStatus.DRAFT) => {
	Campaign.assIsa(campaign);
	KStatus.assert(status);
	// charities listed here
	let charityIds = [];
	if (campaign.strayCharities) charityIds.push(campaign.strayCharities);
	if (campaign.dntn4charity) charityIds.push(Object.keys(campaign.dntn4charity));
	if (campaign.localCharities) charityIds.push(Object.keys(campaign.localCharities));	

	// Leaf campaign?
	if ( ! campaign.master) {
		let pvAds = Campaign.pvAds({campaign, status});
		if ( ! pvAds.value) {
			return charities2(campaign, charityIds, []);
		}
		let ads = List.hits(pvAds.value);
		// individual charity data, attaching ad ID
		let vcharitiesFromAds = charitiesFromAds(ads);
		// apply local edits
		return charities2(campaign, charityIds, vcharitiesFromAds);
	}

	// Master campaign
	let pvSubCampaigns = Campaign.pvSubCampaigns({campaign, status}); // ??if we request draft and there is only published, what happens??
	let subCharities = [];
	if (pvSubCampaigns.value) {
		const scs = List.hits(pvSubCampaigns.value);
		subCharities = _.flatten(scs.map(subCampaign => Campaign.charities(subCampaign, status)));
		subCharities = uniqById(subCharities);
	}
	return charities2(campaign, charityIds, subCharities);
}; // ./charities()

const charities2 = (campaign, charityIds, charities) => {
	// fetch NGOs
	if (yessy(charityIds)) {
		let q = SearchQuery.setPropOr(null, "id", charityIds).query;
		let pvCharities = ActionMan.list({type: C.TYPES.NGO, status:KStatus.PUBLISHED, q});
		if (pvCharities.value) {
			charities.push(List.hits(pvCharities.value));
		}
	}
	// merge and de-dupe
	let charityForId = {};
	if (campaign.localCharities) {
		Object.entries(campaign.localCharities).map(([k,v]) => {
			charityForId[k] = v;
		});
	}
	charities.map(c => {
		charityForId[c.id] = Object.assign({}, c, charityForId[C.id]); // NB: defensive copies, localCharities settings take priority
	});
	let cs = Object.values(charityForId);
	return cs;
};


const charitiesFromAds = (ads) => {
	// individual charity data, attaching ad ID
	let charities = _.flatten(ads.map(ad => {
		if (!ad.charities) return [];
		const clist = (ad.charities && ad.charities.list).slice() || [];
		return clist.map(c => {
			if ( ! c) return null; // bad data paranoia
			if ( ! c.id || c.id==="unset" || c.id==="undefined" || c.id==="null" || c.id==="total") { // bad data paranoia						
				// console.error("Campaign.js charities - Bad charity ID", c.id, c);
				return null;
			}
			const id2 = normaliseSogiveId(c.id);
			if (id2 !== c.id) {
				c.id = id2;
			}
			c._adId = ad.id; // for Advert Editor dev button so sales can easily find which ad contains which charity
			return c;
		}); // ./clist.map
	}));
	charities = uniqById(charities);
	return charities;
};

/**
 * @param {Object} p
 * @param {?Money} p.donationTotal
 * @param {NGO[]} p.charities From adverts (not SoGive)
 * @param {Object} p.donation4charity scaled (so it can be compared against donationTotal)
 * @returns {NGO[]}
 */
Campaign.filterLowDonations = ({charities, campaign, donationTotal, donation4charity}) => {

	// Low donation filtering data is represented as only 2 controls for portal simplicity
	// lowDntn = the threshold at which to consider a charity a low donation
	// hideCharities = a list of charity IDs to explicitly hide - represented by keySet as an object (explained more below line 103)

	// Filter nulls
	charities = charities.filter(x => x);

	if (campaign.hideCharities) {
		let hc = Campaign.hideCharities(campaign);
        const charities2 = charities.filter(c => ! hc.includes(normaliseSogiveId(getId(c))));
		charities = charities2;
	}
	
	let lowDntn = campaign.lowDntn;	
	if ( ! lowDntn || ! Money.value(lowDntn)) {
		if ( ! donationTotal) {
			return charities;
		}
		// default to 0	
		lowDntn = new Money({currency:donationTotal.currency, value:0});
	}
    
	/**
	 * @param {!NGO} c 
	 * @returns {?Money}
	 */
	const getDonation = c => {
		let d = donation4charity[c.id] || donation4charity[c.originalId]; // TODO sum if the ids are different
		return d;
	};

	charities = charities.filter(charity => {
        const dntn = getDonation(charity);
        let include = dntn && Money.lessThan(lowDntn, dntn);
		return include;
    });
	return charities;
} // ./filterLowDonations

/** donation4charityUnscaled has some entries which shouldn't be transferred into donation4charityScaled */
// TODO huge sweeping refactor which will fix the spaghetti nightmare where unreadyCampaignIds
// is added in NGO.fetchDonationData - but then "normalised" to "unreadycampaignids" by use of normaliseSogiveId
// so my prospective fix needed this second lower-case hedging value jammed in to work properly -- RM Jun 2021
const ignoreD4CKeys = [ 'total', 'unset', 'unreadyCampaignIds', 'unreadycampaignids'];

/**
 * Scale a list of charities to match the money total.
 * This will scale so that sum(donations to `charities`) = donationTotal
 * Warning: If a charity isn't on the list, it is assumed that donations to it are noise, to be reallocated.
 * 
 * @param {Campaign} campaign 
 * @param {Money} donationTotal 
 * @param {Object} donation4charityUnscaled
 * @returns {Object} donation4charityScaled
 */
Campaign.scaleCharityDonations = (campaign, donationTotal, donation4charityUnscaled, charities) => {
    // Campaign.assIsa(campaign); can be {}
	//assMatch(charities, "NGO[]");	- can contain dummy objects from strays
    let forceScaleDonations = campaign.forceScaleDonations;
	if ( ! Campaign.isDntn4CharityEmpty(campaign) && !forceScaleDonations) {
		// NB: donation4charityUnscaled will contain all data for campaigns, including data not in campaign.dntn4charity
        //assert(campaign.dntn4charity === donation4charityUnscaled);
		return donation4charityUnscaled; // explicitly set, so don't change it
	}

	if ( ! Money.value(donationTotal)) {
		console.log("[DONATION4CHARITY]","Scale donations - dont scale to 0");
		return Object.assign({}, donation4charityUnscaled); // paranoid copy
	}
	Money.assIsa(donationTotal);
    // NB: only count donations for the charities listed
    let monies = charities.map(c => getId(c) !== "unset" ? donation4charityUnscaled[getId(c)] : null);
    monies = monies.filter(x=>x);
	let totalDntnByCharity = Money.total(monies);
	if ( ! Money.value(totalDntnByCharity)) {
		console.log("[DONATION4CHARITY]","Scale donations - cant scale up 0");
		return {...donation4charityUnscaled}; // paranoid copy
	}
	// scale up (or down)	
	let ratio = Money.divide(donationTotal, totalDntnByCharity);
	const donation4charityScaled = {};
	Object.entries(donation4charityUnscaled).forEach(([key, value]) => {
		if (ignoreD4CKeys.includes(key)) return;
		donation4charityScaled[key] = Money.mul(value, ratio);
	});
	console.log("[DONATION4CHARITY]","Scale donations from", donation4charityUnscaled, "to", donation4charityScaled);
	return donation4charityScaled;
};

Campaign.isDntn4CharityEmpty = (campaign) => {
	let empty = true;
	if (!campaign.dntn4charity) return true;
	Object.keys(campaign.dntn4charity).forEach(charity => {
		if (campaign.dntn4charity[charity] && Money.value(campaign.dntn4charity[charity])) empty = false;
	});
	return empty;
}


export default Campaign;
