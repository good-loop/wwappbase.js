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
 * Get all ads associated with the given campaign. This will apply hide-list and never-served filters 
 * @param Campaign campaign 
 * @param {?KStatus} status
 * @param {?String} query Filter by whatever you want, eg data
 * @returns PromiseValue(List(Advert))
 */
Campaign.pvAds = ({campaign, status=KStatus.DRAFT, query}) => {
	Campaign.assIsa(campaign);
	let sq = SearchQuery.setProp(null, "campaign", campaign.id);
    if (query) sq = SearchQuery.and(sq, new SearchQuery(query));
    const pvAds = ActionMan.list({type: C.TYPES.Advert, status, q:sq.query});
	// filter
	let pvAds2 = PromiseValue.then(pvAds, adl => {
		let ads = List.hits(adl);
		// Filter ads using hide list
		const hideAdverts = Campaign.hideAdverts(campaign);
		ads = ads.filter(ad => ! hideAdverts.includes(ad.id));
		// Only show serving ads unless otherwise specified
		ads = Campaign.filterNonServedAds(ads, campaign.showNonServed);
		return new List(ads);
	});
    return pvAds2;
};

/**
 * Get the Impact Hub status of all ads
 * Status types:
 * SHOWING
 * HIDDEN
 * AUTO FILTERED
 * NON SERVING
 * NO CAMPAIGN
 * UNKNOWN
 * @param {Object} p
 * @param {Campaign} p.topCampaign the subject campaign
 * @param {?Campaign[]} p.campaigns any other campaigns with data to use (for advertisers or agencies)
 * @param {?Advert[]} p.extraAds additional associated adverts with no relevant campaign
 * @param {?String} p.query attach a custom query to the ad search
 * @returns Advert[] with attached status as advert.ihStatus
 */
Campaign.advertStatusList = ({topCampaign, campaigns, extraAds, status=KStatus.DRAFT, query}) => {

	const {showNonServed, nosample} = topCampaign;

	// Get raw list of ads
	let allButExplicitlyHidAds = Campaign.advertsToShow({topCampaign, campaigns, status, showNonServed:true, nosample:true});
	// Get all ads not filtered with non serving
	let adsWithNonServingApplied = Campaign.advertsToShow({topCampaign, campaigns, status, presetAds:allButExplicitlyHidAds, nosample:true});
	// Invert list of non serving ads
	let adsFilteredByNonServing = allButExplicitlyHidAds.filter(ad => !idList(adsWithNonServingApplied).includes(ad.id));
	// Apply sampling
	let whatAdsWillShow = Campaign.advertsToShow({topCampaign, campaigns, status, presetAds:adsWithNonServingApplied});
	// Invert list of sampled ads by comparing to list just before sampling step
	let adsFilteredByAutoSampler = adsWithNonServingApplied.filter(ad => !idList(whatAdsWillShow).includes(ad.id));
	// Get explicitly hidden ads
	const pvHideAds = Campaign.advertsToHide(topCampaign, null, status);
	let whatAdsWillHide = pvHideAds && pvHideAds.value ? List.hits(pvHideAds.value) : [];

	const getAdStatus = (ad) => {
		if (idList(whatAdsWillShow).includes(ad.id)) return "SHOWING";
		if (idList(whatAdsWillHide).includes(ad.id)) return "HIDDEN";
		if (idList(extraAds).includes(ad.id)) return "NO CAMPAIGN";
		if (idList(adsFilteredByNonServing).includes(ad.id)) return "NON SERVING";
		if (idList(adsFilteredByAutoSampler).includes(ad.id)) return "AUTO FILTERED";
		return "UNKNOWN";
	};

	const pvAds = Campaign.fetchAds(topCampaign, campaigns, status, query);
	let ads = (pvAds.value && List.hits(pvAds.value)) || [];
	let adIds = ads && ads.map(ad => ad.id);
	extraAds = extraAds && adIds ? extraAds.filter(ad => !adIds.includes(ad.id)) : extraAds;
	let allAds = uniqById([...ads, ...extraAds]);
	allAds.forEach(ad => {
		ad.ihStatus = getAdStatus(ad);
	});

	return allAds;
}

/**
 * DEPRECATED switch to pvAds + sampleAds
 * Get a list of adverts that the impact hub should show for this campaign
 * @param {Object} p
 * @param {Campaign} p.topCampaign the subject campaign
 * @param {?Campaign[]} p.campaigns any other campaigns with data to use (for advertisers or agencies)
 * @param {?Advert[]} p.presetAds use a preset list of ads instead of fetching ourselves
 * @param {?Boolean} p.showNonServed override campaign setting
 * @param {?Boolean} p.nosample override campaign setting
 * @param {?String} p.query attach a custom query to the ad search
 * @returns {Advert[]} adverts to show
 */
Campaign.advertsToShow = ({topCampaign, campaigns, status=KStatus.DRAFT, showNonServed, nosample, presetAds, query}) => {
	if (!is(showNonServed)) showNonServed = topCampaign.showNonServed;
	if (!is(nosample)) nosample = topCampaign.nosample;

    const pvAds = ! presetAds && Campaign.pvAds({campaigns, status, query});
    let ads = presetAds || (pvAds.value && List.hits(pvAds.value)) || [];
    // Filter ads using hide list
    const hideAdverts = Campaign.hideAdverts(topCampaign);
    ads = ads.filter(ad => ! hideAdverts.includes(ad.id));
    
    // Only show serving ads unless otherwise specified
    ads = Campaign.filterNonServedAds(ads, showNonServed);

    // Auto sampling
    return Campaign.sampleAds(ads, nosample);
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

/**
 * Get an automatic sample of ads from campaigns
 * @param {Advert[]} ads 
 * @param {?Boolean} nosample override GET paramater of same name if true
 * @param {?Boolean} returnFiltered if true, will return what ads were discarded instead of what were kept
 * @returns {Advert[]} sampleAds
 */
Campaign.sampleAds = (ads, nosample) => {
    /////////////////////////////////////////////////////////
    // TODO - REMOVE ad by campaign sorting
    // Maintaining for now until existing pages are adjusted
    // Use "nosample=true" parameter to disable sampling
    ///////////////////////////////////////////////////////////
    let sampleAds = ads;

    if (!nosample) {
    let sampleAd4Campaign = {};
        ads.forEach(ad => {
            let cname = campaignNameForAd(ad);
            if (sampleAd4Campaign[cname]) {
				// FIXME ad.campaignPage is deprecated code that gets nulled out - and so this is likely buggy
                let showcase = ad.campaignPage && ad.campaignPage.showcase;
                // Prioritise ads with a start and end time attached
                let startProvided = !sampleAd4Campaign[cname].start && ad.start;
                let endProvided = !sampleAd4Campaign[cname].end && ad.end;
                // If the ad cannot provide a new value for start or end, skip it
                if (!startProvided && !endProvided && !showcase) {
                    return;
                }
            }
            //if (!ad.videos || !ad.videos[0].url) return;
            sampleAd4Campaign[cname] = ad;
        });
        sampleAds = Object.values(sampleAd4Campaign);
    }
    
    return sampleAds.length ? sampleAds : ads;
}

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
 * @param {Campaign} p.topCampaign the master campaign
 * @param {?Campaign[]} campaigns other associated campaigns
 * @param {?Advert[]} extraAds any other associated ads
 * @returns {Number}
 */
Campaign.viewcount = ({topCampaign, campaigns, extraAds, status}) => {
	// manually set?
	if (topCampaign.numPeople) {
		return topCampaign.numPeople;
	}
	const pvAllAds = Campaign.fetchAds(topCampaign, campaigns, status);
	let allAds = pvAllAds.value ? List.hits(pvAllAds.value) : [];
	// add extras?
	if (extraAds) {
		allAds = uniqById(allAds.concat(extraAds));
	}	
	const viewcount4campaign = Advert.viewcountByCampaign(allAds);
	let totalViewCount = sum(Object.values(viewcount4campaign));
	return totalViewCount;
};


////////////////////////////////////////////////////////////////////
////                     CHARITY LOGIC                           ///
////////////////////////////////////////////////////////////////////




/**
 * Get the donation total for a campaign.
 * @param {Campaign} topCampaign
 * @param {?Campaign[]} campaigns
 * @param {Object} dntn4charity
 */
 Campaign.donationTotal = (topCampaign, campaigns, dntn4charity, forceScaleTotal) => {
	if (topCampaign.dntn) return topCampaign.dntn;
	const allCampaignDntns = (campaigns ? campaigns.map(c => c.dntn).filter(x=>x) : []);
	const summed = Money.total(allCampaignDntns);
	let donationTotal = Money.value(summed)? summed : dntn4charity.total;
	if (forceScaleTotal) {
		const moneys = Object.values(dntn4charity).filter(x=>x);
		donationTotal = moneys.length ? Money.total(moneys) : 0;
	}
	return donationTotal;
};

/**
 * Get the donation for charity list of a campaign
 * @param {Campaign} topCampaign
 * @param {?Campaign[]} otherCampaigns extra associated campaigns
 * @param {?Advert[]} extraAds ads that are associated but have no campaign
 * @param {KStatus} status
 */
Campaign.dntn4charity = (topCampaign, otherCampaigns, extraAds, status=KStatus.DRAFT) => {
    const pvAds = Campaign.fetchAds(topCampaign, null, status);
    const ads = pvAds.value ? List.hits(pvAds.value) : [];
    // initial donation record
    const donation4charity = yessy(topCampaign.dntn4charity)? Object.assign({}, topCampaign.dntn4charity) : {};
    // augment with fetched data
    const fetchedDonationData = NGO.fetchDonationData({ads});
    Object.keys(fetchedDonationData).forEach(cid => {if (!Object.keys(donation4charity).includes(cid)) donation4charity[cid] = fetchedDonationData[cid]});

    otherCampaigns && otherCampaigns.forEach(campaign => {
        const pvMoreAds = Campaign.fetchAds(campaign, null, status);
        const moreAds = pvMoreAds.value ? List.hits(pvMoreAds.value) : [];
        // get inherent and fetched data from campaign
        const otherDntn4charity = yessy(campaign.dntn4charity)? campaign.dntn4charity : {};
        const otherFetchedDonationData = NGO.fetchDonationData({ads:moreAds});
        // augment master list with data, never overwriting
        Object.keys(otherDntn4charity).forEach(cid => {if (!donation4charity[cid]) donation4charity[cid] = otherDntn4charity[cid]});
        Object.keys(otherFetchedDonationData).forEach(cid => {if (!donation4charity[cid] || !Money.value(donation4charity[cid])) donation4charity[cid] = otherFetchedDonationData[cid]});
    });

    // Augment in data for extra dangling ads
    const extraFetchedDonationData = extraAds ? NGO.fetchDonationData({ads:extraAds}) : {};
    Object.keys(extraFetchedDonationData).forEach(cid => {if (!donation4charity[cid] || !Money.value(donation4charity[cid])) donation4charity[cid] = extraFetchedDonationData[cid]});

    // Normalise all charity ids
    const allCharities = Object.keys(donation4charity);
    allCharities.forEach(cid => {
        const sogiveCid = normaliseSogiveId(cid);
        if (!donation4charity[sogiveCid]) {
            donation4charity[sogiveCid] = donation4charity[cid];
            delete donation4charity[cid];
        }
    });

    return donation4charity;
};


/**
 * 
 * @param {!Campaign} campaign 
 * @returns {?Object} {type, id} the master agency/advertiser or null
 */
Campaign.masterFor = campaign => {
	Campaign.assIsa(campaign);
	if (campaign.vertiser) return {type:C.TYPES.Advertiser, id:campaign.vertiser};
	if (campaign.agencyId) return {type:C.TYPES.Agency, id:campaign.agencyId};
	return null;
};

/**
 * 
 * @param {!Campaign} campaign 
 * @param {?KStatus} status 
 * @returns PV(List<Campaign>)
 */
Campaign.pvSubCampaigns = (campaign, status=KStatus.DRAFT) => {
	if ( ! campaign.master) {
		return new PromiseValue(new List([]));
	}
	// fetch leaf campaigns	
	let {id, type} = Campaign.masterFor(campaign);
	// campaigns for this advertiser / agency
	let sq = SearchQuery.setProp(null, C.TYPES.isAdvertiser(type)? "vertiser" : "agencyId", id);
	const pvCampaigns = ActionMan.list({type: C.TYPES.Campaign, status:subStatus, q});
	return pvCampaigns;
};

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
	let pvSubCampaigns = Campaign.pvSubCampaigns(campaign, status); // ??if we request draft and there is only published, what happens??
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
		let pvCharities = ActionMan.list({type: C.TYPES.NGO, q});
		if (pvCharities.value) {
			charities.push(List.hits(pvCharities.value));
		}
	}
	// merge
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
				console.error("Campaign.js charities - Bad charity ID", c.id, c);
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
