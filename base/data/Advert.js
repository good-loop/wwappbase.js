/** Data model functions for the Advert data-type. */
import {assert, assMatch} from 'sjtest';

import DataClass from './DataClass';
import C from '../CBase';
import ActionMan from '../plumbing/ActionManBase';

/**
 * See Advert.java
 */
class Advert extends DataClass {

	/**
	 * @param {{vertiser: !string}} base 
	 */
	constructor(base) {
		super();
		assMatch(base.vertiser, String, "Advert.js make() - no vertiser ID", base);		
		this['@type'] = 'Advert';
		// copy CTA, variant info, and onX pixels (but nothing else, eg id name etc) from the default
		let dad = Advert.defaultAdvert();
		Object.assign(this, {variantSpec: dad.variantSpec});
		// ..copy default onX pixels
		if (dad.advanced) {
			if ( ! this.advanced) this.advanced = {};
			Object.keys(dad.advanced).filter(k => k.startsWith("on")).forEach(k => this.advanced[k] = dad.advanced[k]);
		}
		// now add in base
		Object.assign(this, base);
	}
}
DataClass.register(Advert, "Advert"); 

C.DEFAULT_AD_ID = 'default-advert';
/**
 * @returns {Advert}
 * Note: race condition on app loading - this will be null for a second.
 */
Advert.defaultAdvert = () => {
	const pvAd = ActionMan.getDataItem({type:C.TYPES.Advert, id:C.DEFAULT_AD_ID, status:C.KStatus.PUBLISHED});
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

export default Advert;
