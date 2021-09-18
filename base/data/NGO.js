/** Data model functions for the NGO data-type. */

import DataClass from './DataClass';
import { normaliseSogiveId } from '../plumbing/ServerIOBase';
import ActionMan from '../plumbing/ActionManBase';
import DataStore from '../plumbing/DataStore';
import SearchQuery from '../searchquery';
import C from '../CBase';
import { uniq, yessy } from '../utils/miscutils';
import { getDataItem, getDataList } from '../plumbing/Crud';
import Campaign from './Campaign';
import KStatus from './KStatus';

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
 * TODO move this GL campaign specific code into Campaign.js?
 * This may fetch data from the server. It returns instantly, but that can be with some blanks.
 * 
 * ??Hm: This is an ugly long method with a server-side search-aggregation! Should we do these as batch calculations on the server??
 * 
 * @param {!Advert[]} ads ??refactor to be by camapigns instead??
 * @returns {cid:Money} donationForCharity, with a .total property for the total, and unreadyCampaignIds for debug
 */
NGO.fetchDonationData = ({ads, status=KStatus.PUBLISHED, totalOnly}) => {
	// Debug: allow the user to switch manual settings off with realtime=true
	const realtime = DataStore.getUrlValue("realtime");
	const donationForCharity = {};
	let READY = 0; // debug info
	let total = new Money(0);
	const unreadyCampaignIds = [];
	donationForCharity.unreadyCampaignIds = unreadyCampaignIds;
	if ( ! ads.length) {
		return donationForCharity; // paranoia
	}
	// things
	let adIds = ads.map(ad => ad.id);
	// campaign IDs (filter any bad IDs)
    let campaignIds = uniq(ads.map(ad => ad.campaign).filter(x=>x));
	// get the campaigns 
	let pvCampaigns = getDataList({type:"Campaign", ids:campaignIds, status});
	if ( ! pvCampaigns.resolved) {
		return {READY, total, unreadyCampaignIds:campaignIds};
	}
	// The total for each campaign
	const total4campaignId = {};
	const campaigns = List.hits(pvCampaigns.value);
	{	// total data
		let campaignsWithoutDonationData = [];	
		for(let ci=0; ci<campaigns.length; ci++) {
			const campaign = campaigns[ci];		
			let cdntn = Campaign.dntn(campaign);		
			if ( ! cdntn || realtime) {			
				campaignsWithoutDonationData.push(campaign);
				continue;
			}
			READY++;
			total = Money.add(total, cdntn);
			total4campaignId[campaign.id] = cdntn;
		}
		// fill in the realtime data
		if (campaignsWithoutDonationData.length) {
			for(let ci =0; ci<campaignsWithoutDonationData.length; ci++) {
				let campaign = campaignsWithoutDonationData[ci];
				// Fetch donations data	
				let pvDonationsBreakdown = fetchDonationData2({ads, campaign});
				if ( ! pvDonationsBreakdown.value)	{
					unreadyCampaignIds.push(campaign.id);
					continue; // NB: request the others in parallel
				}
				let cdntn = pvDonationsBreakdown.value.total;
				total4campaignId[campaign.id] = cdntn;
				total = Money.add(total, cdntn);
				READY++;			
			};
		}	
	} // ./ total data
	// We have a total
	donationForCharity.total = total;
	// Done?
	if (totalOnly) {		
		return donationForCharity;
	}

	// The breakdown for each campaign

	// ...Scaled manually set £s
	let campaignsWithoutBreakdownData = [];	
	const scaledBreakdown4campaignId = {};	
	for(let ci=0; ci<campaigns.length; ci++) {
		const campaign = campaigns[ci];
		if (unreadyCampaignIds.includes(campaign.id)) {
			continue;
		}
		let cdntn4charity = campaign.dntn4charity;
		if ( ! cdntn4charity || realtime) {			
			campaignsWithoutBreakdownData.push(campaign);
			continue;
		}
		scaledBreakdown4campaignId[campaign.id] = cdntn4charity;
	}
	// ...Unscaled realtime voting
	for(let ci =0; ci<campaignsWithoutBreakdownData.length; ci++) {
		let campaign = campaignsWithoutBreakdownData[ci];
		// Fetch donations data	(NB: _some_ of which will be in cache now)
		let pvDonationsBreakdown = fetchDonationData2({ads, campaign});
		if ( ! pvDonationsBreakdown.value) {
			unreadyCampaignIds.push(campaign.id);
			continue; // NB: request the others in parallel
		}
		let cTotal = total4campaignId[campaign.id];
		let totalUnscaled = pvDonationsBreakdown.value.total;
		let unscaledDntn4Charity = pvDonationsBreakdown.value.by_cid;
		// scale it
		let cdntn4charity = {};
		for (const [charityId, unscaledCharityDntn] of Object.entries(unscaledDntn4Charity)) {
			let fraction = Money.divide(unscaledCharityDntn, totalUnscaled);
			let scaledAmnt = Money.mul(cTotal, fraction);
			cdntn4charity[charityId] = scaledAmnt;
		}
		scaledBreakdown4campaignId[campaign.id] = cdntn4charity;
	};
	// add it all in
	for (const [cid, dntn4charity] of Object.entries(scaledBreakdown4campaignId)) {
		for (const [charityId, scaledCharityDntn] of Object.entries(dntn4charity)) {
			let amnt = donationForCharity[charityId] || new Money(0);
			let amnt2 = Money.add(amnt, scaledCharityDntn);
			donationForCharity[charityId] = amnt2;
		}	
	}

	return donationForCharity;
}; // ./fetchDonationData()

/**
 * 
 * @returns PV({charity:Money}) from ServerIO.getDonationsData()
 */
const fetchDonationData2 = ({ads, campaign}) => {
	// ...by campaign or advert? campaign would be nicer 'cos we could combine different ad variants... but its not logged reliably
	// (old data) Loop.Me have not logged vert, only campaign. But elsewhere vert is logged and not campaign.
	let cadIds = ads.filter(ad => ad.campaign===campaign.id).map(ad => ad.id);
	let sq1 = SearchQuery.setProp(null, "campaign", campaign.id);
	let sq2 = SearchQuery.setPropOr(null, "vert", cadIds);			
	let sqDon = SearchQuery.or(sq1, sq2);
	// load the community total for the ad
	let pvDonationsBreakdown = DataStore.fetch(['widget', 'CampaignPage', 'communityTotal', campaign.id], () => {
		return ServerIO.getDonationsData({ q: sqDon.query });
	}, {cachePeriod: 5 * 60 * 1000}); // 5 minute cache so realtime updates
	return pvDonationsBreakdown;
};

