/** Data model functions for the Advert data-type. */
import { assert, assMatch } from '../utils/assert';
import Enum from 'easy-enums';
import DataClass from './DataClass';
import C from '../CBase';
import ActionMan from '../plumbing/ActionManBase';
import DataStore from '../plumbing/DataStore';
import deepCopy from '../utils/deepCopy';
import { getDataItem } from '../plumbing/Crud';
import NGO from './NGO';
import KStatus from './KStatus';
import { getDataLogData, pivotDataLogData } from '../plumbing/DataLog';
import SearchQuery from '../searchquery';
import ServerIO from '../plumbing/ServerIOBase';
import Branding from './Branding';
import PromiseValue from '../promise-value';

/**
 * See Advert.java
 */
class Advert extends DataClass {
	
	/** @type{String} */
	vertiser;

	/** @type{Branding} */
	branding;

	/**
	 * @param {Advert} base 
	 * @param {!String} base.vertiser Advertiser id
	 */
	constructor(base) {
		super();
		assMatch(base.vertiser, String, "Advert.js make() - no vertiser ID", base);		
		// copy CTA??, legacyUnitBranch, variant info, and onX pixels (but nothing else, eg id name etc) from the default
		let dad = Advert.defaultAdvert();
		Object.assign(this, {legacyUnitBranch:dad.legacyUnitBranch, variantSpec: deepCopy(dad.variantSpec)});
		// ..copy default onX pixels
		if (dad.advanced) {
			if ( ! this.advanced) this.advanced = {};
			Object.keys(dad.advanced).filter(k => k.startsWith("on")).forEach(k => this.advanced[k] = dad.advanced[k]);
		}
		// copy branding from the advertiser
		// NB: draft is more likely to be loaded into mem than published
		let pvAdvertiser = getDataItem({type:C.TYPES.Advertiser, id:base.vertiser, status:KStatus.DRAFT, swallow:true});
		if (pvAdvertiser.value && pvAdvertiser.value.branding) {
			this.branding = deepCopy(pvAdvertiser.value.branding);
		}

		// Are we currently running a release branch? Lock the new advert to the current branch.
		if (process.env.RELEASE_BRANCH) this.legacyUnitBranch = process.env.RELEASE_BRANCH;

		// NB: Don't copy campaign-page -- that gets dynamically sorted out by the My.GL ImpactHub
		// Now add in base
		DataClass._init(this, base);
	}
}
DataClass.register(Advert, "Advert"); 

C.DEFAULT_AD_ID = 'default-advert';

/**
 * @returns {Advert}
 * Note: race condition on app loading - this will be null for a second.
 */
Advert.defaultAdvert = () => {
	let swallow = (C.SERVER_TYPE !== 'test' && C.SERVER_TYPE !== 'stage'); // NB: local will often fail; production shouldn't, but should fail quietly if it does
	const pvAd = getDataItem({type:C.TYPES.Advert, id:C.DEFAULT_AD_ID, status: KStatus.PUBLISHED, swallow});
	return pvAd.value;
};

// HACK: trigger a data fetch if on Portal
if (window.location.hostname.includes("portal.good-loop.com")) {
	Advert.defaultAdvert();
}

/**
 * @param {!Advert} ad
 * @returns {!string}
 */
Advert.advertiserId = ad => Advert.assIsa(ad) && ad.vertiser;

/**
 * @param {!Advert} ad 
 * @returns {String} campaignId
 */
Advert.campaign = ad => ad.campaign;

/**
 * @param {!Advert} ad 
 * @returns {?Date}
 */
Advert.start = ad => ad.start && new Date(ad.start);

/**
 * @param {!Advert} ad 
 * @returns {?Date}
 */
Advert.end = ad => ad.start && new Date(ad.end);

Advert.campaign = ad => ad.campaign;

Advert.tags = ad => ad.tags;

Advert.served = ad => ad.hasServed || ad.serving;

Advert.hideFromShowcase = ad => ad.hideFromShowcase;

Advert.isHiddenFromImpact = (ad, impactSettings) => {
	assert(ad);
	assert(impactSettings);
	if (ad.hideFromShowcase) return ad.id;
	if (!impactSettings.showNonServedAds && !Advert.served(ad)) return "non-served";
}

/**
 * @param {Advert} ad
 * @returns {!NGO[]}
 */
Advert.charityList = ad => {
	if ( ! ad.charities) ad.charities ={};
	if ( ! ad.charities.list) ad.charities.list = [];
	// WTF? we're getting objects like {0:'foo', 1:'bar'} here instead of arrays :( 
	if ( ! ad.charities.list.map) {
		console.warn("Advert.js - patching charity list Object to []");
		ad.charities.list = Object.values(ad.charities.list);
	}
	// null in list bug seen June 2020
	const clist = ad.charities.list.filter(c => c); 
	if (clist.length < ad.charities.list.length) {
		console.warn("Advert.js - patching charity list null");
		ad.charities.list = clist;
	}
	return clist; 
};

/**
 * @param {Item[]} ads 
 * @returns {object} viewcount4campaign
 */
Advert.viewcountByCampaign = ads => {
	if (!ads || ads.length === 0) {
		console.log('ads is empty')
		return {}
	}
	// Get ad viewing data
	let sq = new SearchQuery("evt:minview");
	let qads = ads.map(({ id }) => `vert:${id}`).join(' OR ');
	sq = SearchQuery.and(sq, qads);

	let pvViewData = getDataLogData({q:sq.query, breakdowns:['campaign'], start:'2017-01-01', end:'now', name:"view-data",dataspace:'gl'});
	let viewcount4campaign = {};
	if (pvViewData.value) {
		viewcount4campaign = pivotDataLogData(pvViewData.value, ["campaign"]);
	}
	return viewcount4campaign;
};

/**
 * @param {Item[]} ads 
 * @returns {object} viewcount4campaign
 */
Advert.viewcountByCountry = ({ads, start='2017-01-01', end='now'}) => {
	if (!ads || ads.length === 0) {
		console.log('res: ads is empty')
		return {}
	}
	// Get ad viewing data
	let sq = new SearchQuery("evt:minview");
	let qads = ads.map(({ id }) => `vert:${id}`).join(' OR ');
	sq = SearchQuery.and(sq, qads);
	let pvViewData = getDataLogData({q:sq.query, breakdowns:['country'], start:start, end:end, name:"view-data",dataspace:'gl'});
	let viewcount4campaign = {};
	console.log("breakdown inside viewcountByCountry", viewcount4campaign, sq)
	if (pvViewData.value) {
		pvViewData.value
		return viewcount4campaign = pivotDataLogData(pvViewData.value, ["country"]);
	}
	return viewcount4campaign;
};

Advert.fetchForAdvertiser = ({vertiserId, status, q}) => Advert.fetchForAdvertisers({vertiserIds:[vertiserId], status});

Advert.fetchForAdvertisers = ({vertiserIds, status=KStatus.PUBLISHED, q}) => {
	let pv = new PromiseValue(fetchForAdvertisers2(vertiserIds, status, q));
	return pv;
}

const fetchForAdvertisers2 = async (vertiserIds, status, q) => {
	let sq = new SearchQuery(q);
	sq = SearchQuery.setPropOr(sq, "vertiser", vertiserIds);
	let pv = ActionMan.list({type: C.TYPES.Advert, status, q:sq.query});
	return await pv.promise;
}

Advert.fetchForCampaign = ({campaignId, status, q}) => Advert.fetchForCampaigns({campaignIds:[campaignId], status, q});

Advert.fetchForCampaigns = ({campaignIds, status, q}) => {
	let pv = new PromiseValue(fetchForCampaigns2(campaignIds, status, q));
	return pv;
}

const fetchForCampaigns2 = async (campaignIds, status, q) => {
	let sq = new SearchQuery(q);
	sq = SearchQuery.setPropOr(sq, "campaign", campaignIds);
	let pv = ActionMan.list({type: C.TYPES.Advert, status, q:sq.query});
	return await pv.promise;
};

// NB: banner=display
const KAdFormat = new Enum("display video social");

export default Advert;
export {
	KAdFormat
};
