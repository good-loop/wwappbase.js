/** Data model functions for the Advert data-type. */
import { assert, assMatch } from '../utils/assert';
import Enum from 'easy-enums';
import DataClass from './DataClass';
import C from '../CBase';
import ActionMan from '../plumbing/ActionManBase';
import List from './List';
import DataStore, { getDataPath } from '../plumbing/DataStore';
import deepCopy from '../utils/deepCopy';
import { getDataItem, saveEdits } from '../plumbing/Crud';
import KStatus from './KStatus';
import PromiseValue from 'promise-value';
import Advert from './Advert';
import { keysetObjToArray } from '../utils/miscutils';

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
 * @returns {String[]} hideAdverts
 */
Campaign.hideAdverts = (topCampaign, campaigns) => {
    
    // Merge all hide advert lists together from all campaigns
    let allHideAds = topCampaign.hideAdverts ? keysetObjToArray(topCampaign.hideAdverts) : [];
    if (campaigns) campaigns.forEach(campaign => allHideAds.push(... campaign.hideAdverts ? keysetObjToArray(campaign.hideAdverts) : []));
    // Copy array
    const mergedHideAds = allHideAds.slice();
    console.log("HIDE ADVERTS: ", mergedHideAds);
    return mergedHideAds;
}

/**
 * Get all ads associated with the given campaigns
 * @param {Campaign} topCampaign 
 * @param {?Campaign[]} campaigns 
 * @returns {Advert[]}
 */
Campaign.fetchAds = (topCampaign, campaigns) => {
    
    let {
        status,
        'gl.status': glStatus
    } = DataStore.getValue(['location', 'params']) || {};
    if ( ! status) status = (glStatus || C.KStatus.PUB_OR_ARC);

    let ads = [];
    // Get ads for top campaign
    let q = SearchQuery.setProp(new SearchQuery(), "campaign", topCampaign.id).query;
    let pvAds = ActionMan.list({type: C.TYPES.Advert, status, q});
    if (pvAds.value) {
        List.hits(pvAds.value).forEach(ad => {
            ads.push(ad);
        });
    }
    // Get ads for associated campaigns
    campaigns && campaigns.forEach(campaign => {
        let qOtherAds = SearchQuery.setProp(new SearchQuery(), "campaign", campaign.id).query;
        let pvOtherAds = ActionMan.list({type: C.TYPES.Advert, status, qOtherAds});
        if (pvOtherAds.value) {
            List.hits(pvOtherAds).forEach(ad => {
                ads.push(ad);
            });
        }
    });

    return ads;
}

/**
 * Get a list of adverts that the impact hub should show for this campaign
 * @param {Campaign} topCampaign the subject campaign
 * @param {?Campaign[]} campaigns any other campaigns with data to use (for advertisers or agencies)
 * @param {?Advert[]} presetAds use a preset list of ads instead of fetching ourselves
 *  * @param {?Boolean} showNonServed show ads that have never served - overrides GET parameter of same name if true
 * @param {?Boolean} nosample disable automatic sampling - overrides GET parameter of same name if true
 * @returns {Advert[]} adverts to show
 */
Campaign.advertsToShow = (topCampaign, campaigns, presetAds, showNonServed, nosample) => {

    let ads = presetAds || Campaign.fetchAds(topCampaign, campaigns);
    // Filter ads using hide list
    const hideAdverts = Campaign.hideAdverts(topCampaign, campaigns);
    ads = ads.filter(ad => ! hideAdverts.includes(ad.id));
    console.log("Hiding: ",hideAdverts);
    
    // Only show serving ads unless otherwise specified
    ads = Campaign.filterNonServedAds(ads, showNonServed);

    // Auto sampling
    return Campaign.sampleAds(ads, nosample);
};

/**
 * Removes ads that have never served from an ad list
 * @param {Advert[]} ads 
 * @param {?Boolean} showNonServed allow non served ads to show - overrides GET paramater of same name if true
 * @returns {Advert[]} filtered ads
 */
Campaign.filterNonServedAds = (ads, showNonServed) => {
    if (!showNonServed) showNonServed = (DataStore.getValue(['location', 'params']) || {}).showNonServed;
    return ads.filter(ad => ad.hasServed || ad.serving || showNonServed);
}

/**
 * Get a list of adverts that the impact hub will hide for this campaign
 * @param {Campaign} topCampaign the subject campaign
 * @param {?Campaign[]} campaigns any other campaigns with data to use (for advertisers or agencies)
 * @returns {Advert[]} adverts to hide
 */
Campaign.advertsToHide = (topCampaign, campaigns) => {
    
    let ads = Campaign.fetchAds(topCampaign, campaigns);

    // Filter ads using hide list - but reversed
    const hideAdverts = Campaign.hideAdverts(topCampaign, campaigns);
    ads = ads.filter(ad => hideAdverts.includes(ad.id));
    console.log("Hiding: ",hideAdverts);

    // No serving or sampling filter - we want a direct list of ads marked as HIDE
    return ads;
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
