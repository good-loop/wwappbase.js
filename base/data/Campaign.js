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
import ServerIO, {normaliseSogiveId} from '../plumbing/ServerIOBase';
import { is, keysetObjToArray, uniq, uniqById, yessy, mapkv, idList, sum, getUrlVars, asDate } from '../utils/miscutils';
import { getId } from './DataClass';
import NGO from './NGO';
import Money from './Money';

/**
 * NB: in shared base, cos Portal and ImpactHub use this
 * 
 * See Campaign.java
 */
class Campaign extends DataClass {
	
	/** @type{?String} */
	agencyId;

	/** @type{?String} */
	vertiser;

	/** @type{?Money} */
	dntn;

	/** @type{?LineItem} */
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
 * This is the DRAFT budget
 * @returns {?Budget}
 */
Campaign.budget = item => {
	let tli = item.topLineItem;
	return tli? tli.budget : null;
}
/**
 * @returns {?Date}
 */
Campaign.start = item => {
	let tli = item.topLineItem;
	return tli? asDate(tli.start) : null;
}
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

/**
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
		return list;
	}

	// leaf campaign
	// fetch ads
	let sq = SearchQuery.setProp(null, "campaign", campaign.id);
	if (query) sq = SearchQuery.and(sq, new SearchQuery(query));
	const pvAds = ActionMan.list({type: C.TYPES.Advert, status, q:sq.query});
	let adl = await pvAds.promise;
	List.assIsa(adl);
	let ads = List.hits(adl);
	// Label ads using hide list and non-served
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


const tomsCampaigns = /(josh|sara|ella)/; // For matching TOMS campaign names needing special treatment


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
 * @returns PV(List<Campaign>) Includes campaign! Beware when recursing
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
	// exclude this? No: some (poorly configured) master campaigns are also leaves
	// sq = SearchQuery.and(sq, "-id:"+campaign.id); 
	const pvCampaigns = ActionMan.list({type: C.TYPES.Campaign, status:KStatus.PUBLISHED, q:sq.query}); 
	// NB: why change sub-status? We return the state after this campaign is published (which would not publish sub-campaigns)
	return pvCampaigns;
};


/** This is the total unlocked across all adverts in this campaign. See also maxDntn.
 * Warning: This will change as data loads!!
 * @returns {?Money}
 */
 Campaign.dntn = (campaign, isSub) => {
	if ( ! campaign) return null;
	Campaign.assIsa(campaign);
	if (campaign.dntn) {
		// HACK realtime=true forces a realtime fetch
		if ( ! getUrlVars().realtime) {
			return campaign.dntn;
		}
	}
	if ( ! campaign.master || isSub) {
		// Ask the backend
		let sq = SearchQuery.setProp(null, "campaign", campaign.id);
		let pvDntnData = DataStore.fetch(['misc','donations',campaign], 
			() => ServerIO.getDonationsData({t:'dntnblock', q:sq.query, name:"campaign-donations"}), 
			{cachePeriod:300*1000});
		let total = pvDntnData.value && pvDntnData.value.total;
		return total;
	}
	// recurse
	// NB: Wouldn't it be faster to do a one-batch data request? Yeah, but that would lose the Campaign.dntn hard-coded info.
	// TODO: make it so datalog reconciles with that, so we can do batched requests
	let pvSubs = Campaign.pvSubCampaigns({campaign});
	if ( ! pvSubs.value) {
		return null;
	}
	let subs = List.hits(pvSubs.value);
	let dntns = subs.map(sub => Campaign.dntn(sub, true));
	let total = Money.total(dntns);
	return total;
};


/**
 * Recursive and fetches dynamic data.
 
 * @param {!Campaign} campaign 
 * @returns {!Object} {cid: Money} Values may change as data loads
 * @see Campaign.dntn
 */
Campaign.dntn4charity = (campaign, isSub) => {
	assert( ! isSub || isSub===true, isSub);
	Campaign.assIsa(campaign);
	if ( ! campaign.master || isSub) {
		// leaf
		// hard set values?
		let d4c = Object.assign({}, campaign.dntn4charity); // defensive copy, never null
		// HACK realtime=true forces a realtime fetch
		if (getUrlVars().realtime) {
			d4c = {};
		}
		// are any missing?
		let charities = Campaign.charities(campaign);
		let missingNGOs = charities.filter(ngo => ! d4c[ngo.id]);
		if ( ! missingNGOs.length) {
			return d4c;
		}
		// HACK realtime off??
		if (getUrlVars().realtime === false) {
			return d4c
		}
		// Ask the backend
		let sq = SearchQuery.setProp(null, "campaign", campaign.id);
		let pvDntnData = DataStore.fetch(['misc','donations',campaign], 
			() => ServerIO.getDonationsData({q:sq.query, name:"campaign-donations"}), 
			{cachePeriod:300*1000});
		if ( ! pvDntnData.value) {
			return d4c;
		}		
		let by_cid = pvDntnData.value.by_cid;
		// merge with top-level
		let alld4c = Object.assign({}, by_cid, d4c);
		return alld4c;
	} // ./leaf
	// Master - recurse - sum leaf campaigns
	if ( ! isDntn4CharityEmpty(campaign.dntn4charity)) {
		console.warn("Ignoring master.dntn4charity - it should not be set for masters 'cos it can confuse sums for e.g. reporting by-charity in T4G", campaign);
	}
	let pvSubs = Campaign.pvSubCampaigns({campaign});
	if ( ! pvSubs.value) {
		return {};
	}
	let subs = List.hits(pvSubs.value);
	let dntn4charitys = subs.map(sub => Campaign.dntn4charity(sub, true));
	// merge + sum subs
	let subtotal4c = {};
	for(let i=0; i<dntn4charitys.length; i++) {
		const subd4c = dntn4charitys[i];
		mapkv(subd4c, (k,v) => {
			let old = subtotal4c[k];
			subtotal4c[k] = old? Money.add(old, v) : v;
		});
	}
	return subtotal4c;
};




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

	// Leaf campaign?
	if ( ! campaign.master || isSub) {
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
	}

	// Master campaign
	let pvSubCampaigns = Campaign.pvSubCampaigns({campaign, status}); // ??if we request draft and there is only published, what happens??
	let subCharities = [];
	if (pvSubCampaigns.value) {
		const scs = List.hits(pvSubCampaigns.value);
		subCharities = _.flatten(scs.map(subCampaign => Campaign.charities(subCampaign, status, true)));
		subCharities = uniqById(subCharities);
	}
	return charities2(campaign, charityIds, subCharities);
}; // ./charities()

/**
 * 
 * @param {!Campaign} campaign 
 * @param {?String[]} charityIds 
 * @param {!NGO[]} charities 
 * @returns {NGO[]}
 */
const charities2 = (campaign, charityIds, charities) => {
	Campaign.assIsa(campaign);	
	// fetch NGOs
	if (yessy(charityIds)) {
		assMatch(charityIds, "String[]");
		// TODO SoGive stores id as @id, which messes this up :(
		// @id is the thing.org "standard", but sod that, its daft - We should switch SoGive to `id`
		charityIds.forEach(cid => {
			let pvSoGiveCharity = getDataItem({type: C.TYPES.NGO, status:KStatus.PUBLISHED, id:cid});
			// Add them as they load (assume this function gets called repeatedly)
			if (pvSoGiveCharity.value) {
				charities.push(pvSoGiveCharity.value);
			}	
		});
	}
	// merge and de-dupe
	let charityForId = {};
	if (campaign.localCharities) {
		Object.entries(campaign.localCharities).map(([k,v]) => {
			if ( ! v.id) v.id = k; // No Id?! Seen Sep 2021
			charityForId[k] = v;
		});
	}
	charities.map(c => {
		NGO.assIsa(c);
		charityForId[getId(c)] = Object.assign({}, c, charityForId[getId(c)]); // NB: defensive copies, localCharities settings take priority
	});
	// any missing? Put in a blank
	charityIds.forEach(cid => {
		if (charityForId[cid]) return;
		charityForId[cid] = new NGO({id:cid}); 
	});
	let cs = Object.values(charityForId);
	// tag with campaign info (helpful when tracing, overlaps may mean this isnt the full list)
	cs.map(cMerged => {
		let allCampaigns = (cMerged._campaigns || []).concat(cMerged._campaigns).concat(campaign.id);
		cMerged._campaigns = uniq(allCampaigns);
	});	
	return cs;
};


const charities2_fromAds = (ads) => {
	// individual charity data, attaching ad ID
	let charities = _.flatten(ads.map(ad => {
		if (!ad.charities) return [];
		const clist = (ad.charities && ad.charities.list).slice() || [];
		return clist.map(c => {
			if ( ! c) return null; // bad data paranoia
			const cid = getId(c);
			if ( ! cid || cid==="unset" || cid==="undefined" || cid==="null" || cid==="total") { // bad data paranoia						
				// console.error("Campaign.js charities - Bad charity ID", c.id, c);
				return null;
			}
			const id2 = normaliseSogiveId(cid);
			if (id2 !== cid) {
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
 * @param {Object} p.donation4charity 
 * @returns {NGO[]}
 */
Campaign.filterLowDonations = ({charities, campaign, donationTotal, donation4charity}) => {

	// Low donation filtering data is represented as only 2 controls for portal simplicity
	// lowDntn = the threshold at which to consider a charity a low donation
	// hideCharities = a list of charity IDs to explicitly hide - represented by keySet as an object (explained more below line 103)

	// Filter nulls and null-ID bad data
	charities = charities.filter(x => x && x.id);

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


/**
 * 
 * @param {Object} d4c {charity-id: Money}
 * @returns 
 */
const isDntn4CharityEmpty = (d4c) => {
	if ( ! d4c) return true;
	let nonEmpty = Object.values(d4c).find(v => v && Money.value(v));
	return ! nonEmpty;
}

export default Campaign;
