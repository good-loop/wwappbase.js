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
 * Get the list of ads that this campaign will hide
 * Optional: also merge with lists from other campaigns
 * @param {Campaign} topCampaign 
 * @param {?Campaign[]} campaigns 
 * @returns {String[]} hideAdverts
 */
Campaign.hideAdverts = (topCampaign, campaigns) => {
    // Merge all hide advert lists together from all campaigns
    let hideAdverts = topCampaign.hideAdverts;
    campaigns && campaigns.forEach(c => {
        if (c.hideAdverts) {
            Object.keys(c.hideAdverts).forEach(hideAd => {
                if (c.hideAdverts[hideAd]) hideAdverts[hideAd] = true;
            });
        }
    });
    console.log("HIDE ADVERTS: ", hideAdverts);
    // Convert hideAdverts to array
    hideAdverts = Object.keys(hideAdverts).map(ad => hideAdverts[ad] && ad).filter(x=>x);
    console.log("HIDE ADVERTS ARRAY: ", hideAdverts);
    return hideAdverts;
}

/**
 * Get a list of adverts that the impact hub should show for this campaign
 * @param {Campaign} topCampaign the subject campaign
 * @param {String} status
 * @param {?Campaign[]} campaigns any other campaigns with data to use (for advertisers or agencies)
 * @param {?Advert[]} presetAds use a preset list of ads instead of fetching ourselves
 * @returns {Advert[]} adverts to show
 */
Campaign.advertsToShow = (topCampaign, campaigns, presetAds) => {
    let ads = [];

    let {
        status,
        'gl.status': glStatus,
        showNonServed,
	} = DataStore.getValue(['location', 'params']) || {};
    if ( ! status) status = (glStatus || C.KStatus.PUB_OR_ARC);

    if (presetAds) {
        ads = presetAds;
    } else {
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
    }

    // Merge all hide advert lists together from all campaigns
    if (!topCampaign.hideAdverts) topCampaign.hideAdverts = {};
    campaigns && campaigns.forEach(c => {
        if (c.hideAdverts) {
            Object.keys(c.hideAdverts).forEach(hideAd => {
                if (c.hideAdverts[hideAd]) topCampaign.hideAdverts[hideAd] = true;
            });
        }
    });

    // Filter ads using hide list
    ads = ads.filter(ad => ! topCampaign.hideAdverts[ad.id]);
	console.log("Hiding: ",topCampaign && topCampaign.hideAdverts);

    /////////////////////////////////////////////////////////
    // TODO - REMOVE ad by campaign sorting
    // Maintaining for now until existing pages are adjusted 
    ///////////////////////////////////////////////////////////
    let sampleAd4Campaign = {};
	ads.forEach(ad => {
        // Skip never-served ads
        if (!ad.hasServed && !ad.serving && !showNonServed) return;
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
    const sampleAds = Object.values(sampleAd4Campaign);
    
    return sampleAds.length ? sampleAds : ads;
};

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
