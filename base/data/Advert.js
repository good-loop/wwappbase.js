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
import SearchQuery from '../searchquery';
import { normaliseSogiveId } from '../../base/plumbing/ServerIOBase';

/**
 * See Branding.java
 */
class Branding {
	logo;
}

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
	 */
	constructor(base) {
		super();
		assMatch(base.vertiser, String, "Advert.js make() - no vertiser ID", base);		
		// copy CTA, variant info, and onX pixels (but nothing else, eg id name etc) from the default
		let dad = Advert.defaultAdvert();
		Object.assign(this, {variantSpec: deepCopy(dad.variantSpec)});
		// ..copy default onX pixels
		if (dad.advanced) {
			if ( ! this.advanced) this.advanced = {};
			Object.keys(dad.advanced).filter(k => k.startsWith("on")).forEach(k => this.advanced[k] = dad.advanced[k]);
		}
		// copy branding from the advertiser
		let pvAdvertiser = getDataItem({type:C.TYPES.Advertiser, id:base.vertiser, status:C.KStatus.PUBLISHED, swallow:true});
		if (pvAdvertiser.value && pvAdvertiser.value.branding) {
			this.branding = deepCopy(pvAdvertiser.value.branding);
		}
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
	const pvAd = getDataItem({type:C.TYPES.Advert, id:C.DEFAULT_AD_ID, status:C.KStatus.PUBLISHED});
	return pvAd.value;
};

// trigger a data fetch
Advert.defaultAdvert();

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
 * This is the DRAFT budget
 * @param {!Advert} ad 
 * @returns {?Budget}
 */
Advert.budget = ad => {
	let tli = Advert.topLineItem(ad);
	return tli? tli.budget : null;
}

Advert.topLineItem = ad => ad.topLineItem;

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

Advert.fetchCharities = ad => {
	let dupeIds = [];
	let sogiveCharities = Advert.charityList(ad).map(charityOriginal => {
		// Shallow copy charity obj
		let charity = Object.assign({}, charityOriginal);
		const sogiveId = normaliseSogiveId(charity.id);
		if ( ! sogiveId) {
			console.warn("Charity without an id?!", charity);
			return charity;
		}
		// Remove duplicates
		if (dupeIds.includes(sogiveId)) {
			return;
		}
        dupeIds.push(sogiveId);
        if (!sogiveId || sogiveId === "unset") return null;
		// NB: the lower-level ServerIOBase.js helps patch mismatches between GL and SoGive ids
		const pvCharity = ActionMan.getDataItem({ type: C.TYPES.NGO, id: sogiveId, status: C.KStatus.PUBLISHED });
		if ( ! pvCharity.value) {
			return charity; // no extra data yet
		}
		// merge, preferring SoGive data
		// Prefer SoGive for now as the page is designed to work with generic info - and GL data is often campaign/player specific
		// TODO: review this
		// NB: This merge is a shallow copy, so the objects can then be shallow edited without affecting other components
		charity = Object.assign(charity, pvCharity.value);
		// HACK: charity objs have conflicting IDs, force NGO to use id instead of @id
		delete charity['@id'];
		charity.originalId = charityOriginal.id; // preserve for donation look-up
		return charity;
	});
	// Remove null entries
	sogiveCharities = sogiveCharities.filter(x => x);
	return sogiveCharities;
};

const KAdFormat = new Enum("video social banner");

export default Advert;
export {
	KAdFormat
}
