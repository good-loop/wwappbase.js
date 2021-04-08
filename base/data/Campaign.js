/** Data model functions for the Advert data-type. */
import _ from 'lodash';
import { assert, assMatch } from '../utils/assert';
import Enum from 'easy-enums';
import DataClass, { getId } from './DataClass';
import Money from './Money';
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
import ServerIO, { normaliseSogiveId } from '../plumbing/ServerIOBase';
import { publishDraftFn } from '../components/SavePublishDeleteEtc';
import { str } from '../utils/printer';

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

const getStatus = () => {
    let {
        status,
        'gl.status': glStatus
    } = DataStore.getValue(['location', 'params']) || {};
    if ( ! status) status = (glStatus || C.KStatus.PUB_OR_ARC);
    return status;
};

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
 * @returns {String[]} hideAdverts
 */
Campaign.hideAdverts = (topCampaign, campaigns) => {

    // Merge all hide advert lists together from all campaigns
    let allHideAds = topCampaign.hideAdverts ? keysetObjToArray(topCampaign.hideAdverts) : [];
    if (campaigns && campaigns.length) campaigns.forEach(campaign => allHideAds.push(... campaign.hideAdverts ? keysetObjToArray(campaign.hideAdverts) : []));
    // Copy array
    const mergedHideAds = allHideAds.slice();
    return mergedHideAds;
}

/**
 * Get all ads associated with the given campaigns
 * @param {Campaign} topCampaign 
 * @param {?Campaign[]} campaigns 
 * @returns PromiseValue(Advert[])
 */
Campaign.fetchAds = (topCampaign, campaigns) => {
    
    const status = getStatus();

    let sq = SearchQuery.setProp(new SearchQuery(), "campaign", topCampaign.id);
    if (campaigns && campaigns.length) {
        let sq2 = SearchQuery.setPropOr(new SearchQuery(), "campaign", campaigns.map(c => c && c.id).filter(x => x));
        sq = SearchQuery.or(sq, sq2);
    }
    const q = sq.query;
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
Campaign.advertsToShow = (topCampaign, campaigns, presetAds, showNonServed, nosample) => {

    const pvAds = Campaign.fetchAds(topCampaign, campaigns);
    let ads = presetAds || (pvAds.value && List.hits(pvAds.value)) || [];
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
 * Get a list of adverts that the impact hub will hide for this campaign
 * @param {Campaign} topCampaign the subject campaign
 * @param {?Campaign[]} campaigns any other campaigns with data to use (for advertisers or agencies)
 * @returns PromiseValue(Advert[]) adverts to hide - returns null if no hide adverts
 */
Campaign.advertsToHide = (topCampaign, campaigns) => {

    const status = getStatus();

    // Fetch all ads marked with hide - can come from other campaigns so make sure to fetch all
    const hideAdverts = Campaign.hideAdverts(topCampaign, campaigns);
    if (yessy(hideAdverts)) {
        let q = SearchQuery.setPropOr(new SearchQuery(), "id", hideAdverts).query;
        let pvAds = ActionMan.list({type: C.TYPES.Advert, status, q});

        // No serving or sampling filter - we want a direct list of ads marked as HIDE
        return pvAds;
    } else return null;
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

/**
 * Get the donation total for a campaign.
 * @param {Campaign} campaign 
 * @param {?Object} dntn4charity optionally specify a donation data set to use instead of fetching a new one
 */
Campaign.donationTotal = (campaign, dntn4charity) => {
    let donationTotal = Money.value(campaign.dntn) && campaign.dntn;
    if (!donationTotal) {
        const donationData = dntn4charity || Campaign.donation4charity(campaign);
        donationTotal = donationData.total;
    }
    return donationTotal;
};

/**
 * Get the donation for charity list of a campaign
 * @param {Campaign} topCampaign
 * @param {?Campaign[]} otherCampaigns extra associated campaigns
 * @param {?Advert[]} extraAds ads that are associated but have no campaign
 */
Campaign.dntn4charity = (topCampaign, otherCampaigns, extraAds) => {
    const pvAds = Campaign.fetchAds(topCampaign);
    const ads = pvAds.value ? List.hits(pvAds.value) : [];
    // initial donation record
    const donation4charity = yessy(topCampaign.dntn4charity)? Object.assign({}, topCampaign.dntn4charity) : {};
    // augment with fetched data
    const fetchedDonationData = fetchDonationData(ads);
    Object.keys(fetchedDonationData).forEach(cid => {if (!Object.keys(donation4charity).includes(cid)) donation4charity[cid] = fetchedDonationData[cid]});

    otherCampaigns && otherCampaigns.forEach(campaign => {
        const pvMoreAds = Campaign.fetchAds(campaign);
        const moreAds = pvMoreAds.value ? List.hits(pvMoreAds.value) : [];
        // get inherent and fetched data from campaign
        const otherDntn4charity = yessy(campaign.dntn4charity)? campaign.dntn4charity : {};
        const otherFetchedDonationData = fetchDonationData(moreAds);
        // augment master list with data, never overwriting
        Object.keys(otherDntn4charity).forEach(cid => {if (!Object.keys(donation4charity).includes(cid)) donation4charity[cid] = otherDntn4charity[cid]});
        Object.keys(otherFetchedDonationData).forEach(cid => {if (!Object.keys(donation4charity).includes(cid)) donation4charity[cid] = otherFetchedDonationData[cid]});
    });

    // Augment in data for extra dangling ads
    const extraFetchedDonationData = fetchDonationData(extraAds);
    Object.keys(extraFetchedDonationData).forEach(cid => {if (!Object.keys(donation4charity).includes(cid)) donation4charity[cid] = extraFetchedDonationData[cid]});

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
 * Get a list of charities for a campaign
 * @param {Campaign} topCampaign 
 * @param {?Campaign[]} campaigns associated campaigns, if any
 * @param {?Advert[]} extraAds additional ads with no assigned campaigns
 */
Campaign.charities = (topCampaign, campaigns, extraAds) => {
    let pvAds = Campaign.fetchAds(topCampaign, campaigns);
    let ads = [];
    if (pvAds.value) ads = [...ads, ...List.hits(pvAds.value)];
    extraAds && extraAds.forEach(ad => {
        if (!ads.includes(ad)) ads.push(ad);
    });
    // individual charity data, attaching ad ID
	let charities = uniqById(_.flatten(ads.map(ad => {
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
			c.adId = ad.id; // for Advert Editor dev button so sales can easily find which ad contains which charity
			return c;
		});
    })));
    return charities;
};

/**
 * Get a list of stray charities added to the campaign but not sourced from any ads
 * @param {Campaign} campaign 
 * @returns {NGO[]}
 */
Campaign.strayCharities = campaign => {
    let strays = [];
    const charities = Campaign.charities(campaign);
    // Use top campaign dntn4charity only - merging other campaign stray charities would be confusing
	if (campaign.dntn4charity) {
		let cids = Object.keys(campaign.dntn4charity);
		let clistIds = charities.map(getId);
		cids.forEach(cid => {
			cid = normaliseSogiveId(cid);
			if ( ! clistIds.includes(cid) && cid !== "total") {
				const c = new NGO({id:cid});
				strays.push(c);
			}
		});
    }
    return strays;
}

/**
 * This may fetch data from the server. It returns instantly, but that can be with some blanks.
 * 
 * ??Hm: This is an ugly long method with a server-side search-aggregation! Should we do these as batch calculations on the server??
 * 
 * @param {!Advert[]} ads
 * @returns {cid:Money} donationForCharity, with a .total property for the total
 */
const fetchDonationData = ads => {
	const donationForCharity = {};
	if (!ads.length) return donationForCharity; // paranoia
	// things
	let adIds = ads.map(ad => ad.id);
    let campaignIds = ads.map(ad => ad.campaign);
    // Filter bad IDs
    campaignIds = campaignIds.filter(x=>x);
	let charityIds = _.flatten(ads.map(Advert.charityList));
	
	// Campaign level per-charity info?	
	let campaignsWithoutDonationData = [];
	for (let i = 0; i < ads.length; i++) {
		const ad = ads[i];
		const cp = ad.campaignPage;
		// FIXME this is old!! Need to work with new campaigns objects
		// no per-charity data? (which is normal)
		if (!cp || !cp.dntn4charity || Object.values(cp.dntn4charity).filter(x => x).length === 0) {
			if (ad.campaign) {
				campaignsWithoutDonationData.push(ad.campaign);
			} else {
				console.warn("Advert with no campaign: " + ad.id);
			}
			continue;
		}

		Object.keys(cp.dntn4charity).forEach(cid => {
			let dntn = cp.dntn4charity[cid];
			if (!dntn) return;
			if (donationForCharity[cid]) {
				dntn = Money.add(donationForCharity[cid], dntn);
			}
			assert(cid !== 'total', cp); // paranoia
			donationForCharity[cid] = dntn;
		});
	};
	// Done?
	if (donationForCharity.total && campaignsWithoutDonationData.length === 0) {
		console.log("Using ad data for donations");
		return donationForCharity;
	}

	// Fetch donations data	
	// ...by campaign or advert? campaign would be nicer 'cos we could combine different ad variants... but its not logged reliably
	// (old data) Loop.Me have not logged vert, only campaign. But elsewhere vert is logged and not campaign.
    let sq1 = adIds.map(id => "vert:" + id).join(" OR ");
	// NB: quoting for campaigns if they have a space (crude not 100% bulletproof ??use SearchQuery.js instead) 
	let sq2 = campaignIds.map(id => "campaign:" + (id.includes(" ") ? '"' + id + '"' : id)).join(" OR ");
	let sqDon = SearchQuery.or(sq1, sq2);

	// load the community total for the ad
	let pvDonationsBreakdown = DataStore.fetch(['widget', 'CampaignPage', 'communityTotal', sqDon.query], () => {
		return ServerIO.getDonationsData({ q: sqDon.query });
	}, {}, true, 5 * 60 * 1000);
	if (pvDonationsBreakdown.error) {
		console.error("pvDonationsBreakdown.error", pvDonationsBreakdown.error);
		return donationForCharity;
	}
	if (!pvDonationsBreakdown.value) {
		return donationForCharity; // loading
	}

	let lgCampaignTotal = pvDonationsBreakdown.value.total;
	// NB don't override a campaign page setting
	if (!donationForCharity.total) {
		donationForCharity.total = new Money(lgCampaignTotal);
	}

	// set the per-charity numbers
	let donByCid = pvDonationsBreakdown.value.by_cid;
	Object.keys(donByCid).forEach(cid => {
		let dntn = donByCid[cid];
		if (!dntn) return;
		if (donationForCharity[cid]) {
			dntn = Money.add(donationForCharity[cid], dntn);
		}
		assert(cid !== 'total', cid); // paranoia
		donationForCharity[cid] = dntn;
    });
    console.log("Using queried data for donations");
	// done	
	return donationForCharity;
}; // ./fetchDonationData()


/**
 * @param {Object} p
 * @param {?Money} p.donationTotal
 * @param {NGO[]} p.charities From adverts (not SoGive)
 * @param {Object} p.donation4charity scaled (so it can be compared against donationTotal)
 * @returns {NGO[]}
 */
Campaign.filterLowDonations = (charities, campaign, donationTotal, donation4charity) => {

	// Low donation filtering data is represented as only 2 controls for portal simplicity
	// lowDntn = the threshold at which to consider a charity a low donation
	// hideCharities = a list of charity IDs to explicitly hide - represented by keySet as an object (explained more below line 103)

    console.log("[FILTER]", "Filtering with dntn4charity", donation4charity);

	// Filter nulls
	charities = charities.filter(x => x);

	if (campaign.hideCharities) {
		let hc = Campaign.hideCharities(campaign);
        const charities2 = charities.filter(c => ! hc.includes(getId(c)));
        console.log("[FILTER]","HIDDEN CHARITIES: ",hc);
		charities = charities2;
	}
	
	let lowDntn = campaign.lowDntn;	
	if ( ! lowDntn || ! Money.value(lowDntn)) {
		if ( ! donationTotal) {
			return charities;
		}
		// default to 0	
		lowDntn = new Money(donationTotal.currencySymbol + "0");
	}
	console.warn("[FILTER]","Low donation threshold for charities set to " + lowDntn);
    
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
        if (!include) console.log("[FILTER]","BELOW LOW DONATION: ",charity, dntn);
		return include;
    });
	return charities;
} // ./filterLowDonations

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
    let { scale } = DataStore.getValue(['location', 'params']) || {};
    if (!scale) return donation4charityUnscaled;
	// Campaign.assIsa(campaign); can be {}
	//assMatch(charities, "NGO[]");	- can contain dummy objects from strays
	if (campaign.dntn4charity) {
		if (campaign.dntn4charity === donation4charityUnscaled) return campaign.dntn4charity; // If explicilty set with no changes, return
	}
	if ( ! Money.value(donationTotal)) {
		console.warn("Donation total is 0 - cannot scale");
		return Object.assign({}, donation4charityUnscaled); // paranoid copy
	}
	Money.assIsa(donationTotal);
    // NB: only count donations for the charities listed
    let monies = charities.map(c => getId(c) !== "unset" ? donation4charityUnscaled[getId(c)] : null);
    monies = monies.filter(x=>x);
	let totalDntnByCharity = Money.total(monies);
	if ( ! Money.value(totalDntnByCharity)) {
		console.warn("Donation total is 0 - cannot scale");
		return Object.assign({}, donation4charityUnscaled); // paranoid copy
	}
	// scale up (or down)
	let ratio = Money.divide(donationTotal, totalDntnByCharity);
	const donation4charityScaled = {};
	mapkv(donation4charityUnscaled, (k,v) => {
        // Skip any special values or any explicitly set donations
        if (k==="total" || k==="unset") return null;
        if (campaign.dntn4charity && campaign.dntn4charity[k]) donation4charityScaled[k] = donation4charityUnscaled[k];
        else donation4charityScaled[k] = Money.mul(donation4charityUnscaled[k], ratio);
    });
    return donation4charityScaled;
};


export default Campaign;
