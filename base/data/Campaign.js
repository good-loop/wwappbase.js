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
import { is, keysetObjToArray, uniq, uniqById, yessy } from '../utils/miscutils';

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
    if (pvVertisers.value) sq = SearchQuery.setPropOr(sq, "vertiser", List.hits(pvVertisers.value).map(vertiser => vertiser.id));
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
 * Optional: also merge with lists from other campaigns
 * @param {Campaign} topCampaign 
 * @param {?Campaign[]} campaigns 
 * @returns {String[]} hideAdverts IDs
 */
Campaign.hideAdverts = (topCampaign, campaigns) => {
    
    // Merge all hide advert lists together from all campaigns
    let allHideAds = topCampaign.hideAdverts ? keysetObjToArray(topCampaign.hideAdverts) : [];
    if (campaigns) campaigns.forEach(campaign => allHideAds.push(... campaign.hideAdverts ? keysetObjToArray(campaign.hideAdverts) : []));
    // Copy array
    const mergedHideAds = allHideAds.slice();
    return mergedHideAds;
}

/**
 * Get all ads associated with the given campaigns
 * @param {Campaign} topCampaign 
 * @param {?Campaign[]} campaigns 
 * @param {?KStatus} status
 * @returns PromiseValue(Advert[])
 */
Campaign.fetchAds = (topCampaign, campaigns, status=KStatus.DRAFT, query) => {

    let sq = SearchQuery.setProp(new SearchQuery(), "campaign", topCampaign.id);
    if (campaigns) {
        let sq2 = SearchQuery.setPropOr(new SearchQuery(), "campaign", campaigns.map(c => c && c.id).filter(x => x));
        sq = SearchQuery.or(sq, sq2);
    }
    if (query) sq = SearchQuery.and(sq, new SearchQuery(query));
    const q = sq.query;
    console.log("QUERY", q);
    const pvAds = ActionMan.list({type: C.TYPES.Advert, status, q});

    return pvAds;
}

/**
 * Get a list of adverts that the impact hub should show for this campaign
 * @param {Campaign} topCampaign the subject campaign
 * @param {?Campaign[]} campaigns any other campaigns with data to use (for advertisers or agencies)
 * @param {?Advert[]} presetAds use a preset list of ads instead of fetching ourselves
 * @param {?Boolean} showNonServed show ads that have never served - overrides GET parameter of same name if true
 * @param {?Boolean} nosample disable automatic sampling - overrides GET parameter of same name if true
 * @returns {Advert[]} adverts to show
 */
Campaign.advertsToShow = (topCampaign, campaigns, status=KStatus.DRAFT, presetAds, showNonServed, nosample, query) => {

    const pvAds = Campaign.fetchAds(topCampaign, campaigns, status, query);
    let ads = presetAds || (pvAds.value && List.hits(pvAds.value)) || [];
    console.log("SHOWING FROM ADS:",ads);
    // Filter ads using hide list
    const hideAdverts = Campaign.hideAdverts(topCampaign, campaigns);
    ads = ads.filter(ad => ! hideAdverts.includes(ad.id));
    
    // Only show serving ads unless otherwise specified
    ads = Campaign.filterNonServedAds(ads, showNonServed);

    // Auto sampling
    return Campaign.sampleAds(ads, nosample);
};

/**
 * Removes ads that have never served from an ad list
 * @param {Advert[]} ads 
 * @param {?Boolean} showNonServed allow non served ads to show - Defaults to GET url paramater of same name
 * @returns {Advert[]} filtered ads
 */
Campaign.filterNonServedAds = (ads, showNonServed) => {
    if ( ! is(showNonServed)) showNonServed = DataStore.getUrlValue('showNonServed');
	if (showNonServed) return ads;
    return ads.filter(ad => ad.hasServed || ad.serving);
}

/**
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
    if (!nosample) nosample = (DataStore.getValue(['location', 'params']) || {}).nosample;

    if (!nosample) {
    let sampleAd4Campaign = {};
        ads.forEach(ad => {
            let cname = campaignNameForAd(ad);
            if (sampleAd4Campaign[cname]) {
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

export default Campaign;
