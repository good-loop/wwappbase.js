/** Data model functions for the NGO data-type. */

import DataClass from './DataClass';
import { normaliseSogiveId } from '../plumbing/ServerIOBase';
import ActionMan from '../plumbing/ActionManBase';
import DataStore from '../plumbing/DataStore';
import SearchQuery from '../searchquery';
import C from '../CBase';
import { yessy } from '../utils/miscutils';

class NGO extends DataClass {
	constructor(base) {
		super(base);
		Object.assign(this, base);
	}
}
DataClass.register(NGO, "NGO");
export default NGO;

NGO.description = (ngo) => ngo.description;

/**
 * displayName or name or ID
 * @param {NGO} ngo 
 */
NGO.displayName = ngo => ngo.displayName || ngo.name || ngo.id;

/**
 * @returns {?Number} [0-17] -- see NGO.UNSDGS
 */
NGO.unsdg = ngo => ngo && ngo.unsdg;

/**
 * UN goals -- 1 indexed! 
 * (0 is a dummy - use this for things that don't fit)
 * See 
 */
NGO.UNSDGs = [
	"no clear fit", // no goal 0
	"No Poverty",
	"Zero Hunger",
	"Good Health and Well-being",
	"Quality Education",
	"Gender Equality",
	"Clean Water and Sanitation",
	"Affordable and Clean Energy",
	"Decent Work and Economic Growth",
	"Industry, Innovation, and Infrastructure",
	"Reducing Inequality",
	"Sustainable Cities and Communities",
	"Responsible Consumption and Production",
	"Climate Action",
	"Life Below Water",
	"Life On Land",
	"Peace, Justice, and Strong Institutions",
	"Partnerships for the Goals"];


/**
 * Top-level category names are "canonical" strings (lowercase, no punctuation or stop words), which we can use as database keys.
 * 
 * {String: String[]} Category: Causes
 * Loosely based on https://www.charitynavigator.org/index.cfm?bay=content.view&cpid=34
 */
NGO.CATEGORY = {
	"animals":[	// not environment - see below
		"Animal Rights, Welfare, and Services", 
		"Wildlife Conservation", 
		"Zoos and Aquariums"
	],
	"arts culture humanities":[
		"Libraries, Historical Societies and Landmark Preservation",
		"Museums",
		"Performing Arts",
		"Public Broadcasting and Media"
	], 
	"community development":[
		// United Ways
		// Jewish Federations
		"Community Foundations",
		"Housing and Neighborhood Development"], 
	"education":[
		"Early Childhood",
		"Youth Education",
		"Adult Education",
		"Special Education",
		"Education Policy and Reform",
		"Scholarship and Financial Support"],
	"environment":[
		"Environmental Protection and Conservation",
		"Climate Action", // Not a CN cause
		"Botanical Gardens, Parks, and Nature Centers"
	],
	"health":[
		// "Diseases, Disorders, and Disciplines" overlaps too much with research & treatment
		"Patient and Family Support",
		"Treatment and Prevention",
		"Health and Wellbeing", // Not a CN cause
		"Sex Education and STD Prevention", // Not a CN cause
		"Mental Health", // Not a CN cause
		"Medical Research"],
	"civil rights": [
		"Human Rights", // Not a CN cause
		"Gender Equality", // Not a CN cause
		"LGBTQ Rights", // Not a CN cause
		"Anti-Racism" // Not a CN cause
	],
	"human services":[
		"Children's and Family Services",
		"Youth Development", // split the CN cause of Youth Dev + Shelter into two
		"Shelter and Crisis Services",
		"Food Banks and Food Distribution",
		// "Multipurpose Human Service Organizations",
		"Tackling Homelessness",
		"Social Services"
	],
	"international":[
		"International Development",
		"International Peace",
		"Humanitarian Relief Supplies"
	],
	"research":[
		"Science & Technology Research (non-medical)",
		"Social and Public Policy Research"
	],
	"religion":[
		"Local Faith Groups", // Not a CN cause
		"Religious Activities",
		"Religious Media and Broadcasting"
	]
};
		

/**
 * This may fetch data from the server. It returns instantly, but that can be with some blanks.
 * 
 * ??Hm: This is an ugly long method with a server-side search-aggregation! Should we do these as batch calculations on the server??
 * 
 * @param {!Advert[]} ads
 * @returns {cid:Money} donationForCharity, with a .total property for the total
 */
NGO.fetchDonationData = ads => {
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
	}, {cachePeriod: 5 * 60 * 1000});
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
 * Augment charities with sogive data
 * @param {NGO[]} charities 
 * @param {Campaign?} campaign - get local charity data
 * @returns {NGO[]}
 */
 NGO.fetchSogiveData = (charities, campaign) => {
	let dupeIds = [];
	let sogiveCharities = charities.map(charityOriginal => {
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
        const pvCharity = ActionMan.getDataItem({ type: C.TYPES.NGO, id: sogiveId, status: C.KStatus.PUBLISHED, swallow:true});
        if (pvCharity.resolved && pvCharity.error) {
            charity.noSogiveMatch = true;
        }
		if ( ! pvCharity.value) {
			return charity; // no extra data yet
        }
		// merge, preferring SoGive data
		// Prefer SoGive for now as the page is designed to work with generic info - and GL data is often campaign/player specific
		// TODO: review this
		// NB: This merge is a shallow copy, so the objects can then be shallow edited without affecting other components
		charity = Object.assign(charity, pvCharity.value);
		// HACK: charity objs have conflicting IDs, force NGO to use id instead of @id
		charity['@id'] = undefined;
		charity.originalId = charityOriginal.id; // preserve for donation look-up

		// Add local overrides from campaign
		// Not using Object.assign - that will override data with empty local edits, e.g. "" will override "the actual description"
		if (campaign && campaign.localCharities) {
			if (campaign.localCharities[charity.id]) {
				Object.keys(campaign.localCharities[charity.id]).forEach(key => {
					// Exempt keys we should never overwrite
					if (key === "id" || key === "@id" || key === "@class" || key === "created") return;
					if (yessy(campaign.localCharities[charity.id][key])) {
						charity[key] = campaign.localCharities[charity.id][key];
					}
				});
			}
		}
		return charity;
	});
	// Remove null entries
    sogiveCharities = sogiveCharities.filter(x => x);
	return sogiveCharities;
};

