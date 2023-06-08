
import KStatus from './KStatus';
import List from './List';
import PromiseValue from '../promise-value';
import { collectListPromises, getDataItem, getDataList, setWindowTitle } from '../plumbing/Crud';
import C from '../../C';
import DataStore from '../plumbing/DataStore';
import SearchQuery from '../searchquery';
import { space, alphabetSort } from '../utils/miscutils';
import ServerIO from '../../plumbing/ServerIO';
import md5 from 'md5';
import Campaign from './Campaign';
import Advertiser from './Advertiser';
import Advert from './Advert';
import Money from './Money';
import { assert } from '../utils/assert';
import ActionMan from '../plumbing/ActionManBase';
import { getId } from './DataClass';
import { uniqBy } from 'lodash';
import GreenTag from './GreenTag';

/* ------- Data Functions --------- */

/**
 * Fetches the contextual data necessary to generate an impact page for the given item
 * @param {Object} p
 * @param {String} p.itemId
 * @param {String} p.itemType
 * @param {KStatus} p.status 
 * @param {?Boolean} p.nocache
 * @returns {PromiseValue<Object>} {campaign, brand, masterBrand, subBrands, subCampaigns, impactDebits, charities, ads}
 */
export const fetchImpactBaseObjects = ({itemId, itemType, status, nocache}) => {
	assert(itemId);
	assert(itemType);
	assert(status);

	return DataStore.fetch(['misc', 'impactBaseObjects', itemType, status, 'all', itemId], () => {
		return fetchImpactBaseObjects2({itemId, itemType, status});
	}, {cachePeriod: nocache ? 1 : null});
}


const fetchImpactBaseObjects2 = async ({itemId, itemType, status}) => {
	let pvCampaign, campaign;
	let pvBrand, brand, brandId;
	let pvMasterBrand, masterBrand;
	let pvSubBrands, subBrands;
	let pvSubCampaigns, subCampaigns;
	let pvImpactDebits, impactDebits;
	let pvCharities, charities;
	let greenTags = [];
	let ads = [];
	let subCampaignsWithDebits, subBrandsWithDebits;

	// Fetch campaign object if specified
	if (itemType === "campaign" || itemType === C.TYPES.Campaign) {
		pvCampaign = getDataItem({type: C.TYPES.Campaign, status, id:itemId});
		campaign = await pvCampaign.promise;
		//if (pvCampaign.error) throw pvCampaign.error;
		// If we have a campaign, use it to find the brand
		brandId = campaign?.vertiser;
	} else if (itemType === "brand" || itemType === C.TYPES.Advertiser) {
		// Otherwise use the URL
		brandId = itemId;
	}

	// Find the specified brand
	pvBrand = getDataItem({type: C.TYPES.Advertiser, status, id:brandId});
	brand = await pvBrand.promise;
	//if (pvBrand.error) throw pvBrand.error;
	if (brand.parentId) {
		// If this brand has a parent, get it
		pvMasterBrand = getDataItem({type: C.TYPES.Advertiser, status, id:brand.parentId});
		masterBrand = await pvMasterBrand.promise;
		//if (pvMasterBrand.error) throw pvMasterBrand.error;
	}
	// Find any subBrands of this brand (technically brands should only have a parent OR children - but might be handy to make longer brand trees in future)
	pvSubBrands = Advertiser.getChildren(brand.id, status);
	subBrands = List.hits(await pvSubBrands.promise);
	//if (pvSubBrands.error) throw pvSubBrands.error;
	// Don't look for subCampaigns if this is a campaign
	if (!campaign) {
		// Find all related campaigns to this brand
		pvSubCampaigns = Campaign.fetchForAdvertiser(brandId, status);
		subCampaigns = List.hits(await pvSubCampaigns.promise);

		subCampaigns = subCampaigns.filter(c => !Campaign.isMaster(c));

		// Look for vertiser wide debits
		pvImpactDebits = Advertiser.getImpactDebits({vertiser:brand, status});
		impactDebits = List.hits(await pvImpactDebits.promise);
		console.log("Got debits from brand!", impactDebits);
	} else {
		// Get only campaign debits
		pvImpactDebits = Campaign.getImpactDebits({campaign, status});
		impactDebits = List.hits(await pvImpactDebits.promise);
		console.log("Got debits from campaign!", impactDebits);
	}

	// Simplifies having to add null checks everywhere
	if (!subBrands) subBrands = [];
	if (!subCampaigns) subCampaigns = [];
	if (!impactDebits) impactDebits = [];

	// If we aren't looking at a campaign, but this brand only has one - just pretend we are
	if (subCampaigns.length === 1) campaign = subCampaigns.pop();

	// Determine which items to fetch ads & green tags for:
	// If we're focused on a master brand, all of em.
	// If we're focused on a brand, just its child brands.
	// If we're focused on a campaign, just that campaign.
	let vertiserIds = campaign ? null : [brand, ...subBrands].map(b => b.id);
	let campaignIds = campaign ? [campaign.id] : subCampaigns.map(c => c.id);

	// Get the ads & green tags
	if (vertiserIds) {
		ads.push(...List.hits(await Advert.fetchForAdvertisers({vertiserIds, status}).promise));
		greenTags.push(...List.hits(await GreenTag.fetchForAdvertisers({ids: vertiserIds, status}).promise));
	}
	if (campaignIds) {
		ads.push(...List.hits(await Advert.fetchForCampaigns({campaignIds, status}).promise));
		greenTags.push(...List.hits(await GreenTag.fetchForCampaigns({ids: campaignIds, status}).promise));
	}

	// Collect, de-duplicate, and sort
	ads = uniqBy(ads, 'id');
	ads.sort(alphabetSort);
	greenTags = uniqBy(greenTags, 'id');
	greenTags.sort(alphabetSort);


	// Mark which campaigns and brands have any donations, and which don't
	impactDebits.forEach(debit => {
		const value = Money.value(debit.impact.amount);
		if (debit.campaign) {
			subCampaigns.forEach(subCampaign => {
				if (subCampaign.id === debit.campaign) subCampaign.hasDonation = value > 0;
			});
		}
		if (debit.vertiser) {
			subBrands.forEach(subBrand => {
				if (subBrand.id === debit.vertiser) subBrand.hasDonation = value > 0;
			});
		}
	});

	// Fetch charity objects from debits
	const charityIds = impactDebits.map(debit => debit.impact.charity).filter(x=>x);
	
	if (charityIds.length) {
		let charitySq = SearchQuery.setPropOr(null, "id", charityIds);
		pvCharities = ActionMan.list({type: C.TYPES.NGO, status, q:charitySq.query});
		charities = List.hits(await pvCharities.promise);
	}

	if (!charities) charities = [];

	// If we've looked for both brand and campaign and found nothing, we have a 404
	if (!campaign && !brand) {
		throw new Error("404: Not found");
	}

	// Filter sub brands and campaigns to only those with debits attached, for convenience
	let cidsWithDebits = [];
	let bidsWithDebits = [];
	impactDebits.forEach(debit => {
		if (debit.campaign && !cidsWithDebits.includes(debit.campaign)) cidsWithDebits.push(debit.campaign);
		if (debit.vertiser && !bidsWithDebits.includes(debit.vertiser)) bidsWithDebits.push(debit.vertiser);
	});
	subCampaignsWithDebits = subCampaigns.filter(c => cidsWithDebits.includes(getId(c)));
	subBrandsWithDebits = subBrands.filter(b => bidsWithDebits.includes(getId(b)));

	// Allow URL flag to override
	const showAll = DataStore.getUrlValue("showAll");
	if (showAll) {
		subBrandsWithDebits = subBrands;
		subCampaignsWithDebits = subCampaigns;
	}

	return {campaign, brand, masterBrand, subBrands, subCampaigns, impactDebits, charities, ads, greenTags, subCampaignsWithDebits, subBrandsWithDebits};
}


export const getImpressionsByCampaignByCountry = ({ baseObjects, start = '', end = 'now', locationField = 'country', ...rest }) => {
	let { campaign, subCampaigns } = baseObjects
	if (!campaign && (!subCampaigns || subCampaigns.length == 0)) return []

	let searchData = campaign ? [campaign] : subCampaigns // if campaign is set, then the user has filtered to a single campaign (no subcampaigns)

	let campaignImpsByCountry = searchData.map(country => Campaign.viewcountByCountry({campaign: country, status: KStatus.PUBLISHED}))


	if (!campaignImpsByCountry || campaignImpsByCountry.length === 0) return []

	// for every campaign we can search through, find the viewcount for it's target country & unset countries
	let campaignViews = campaignImpsByCountry.reduce((regionMap, regions) => {
	// ASSUMPTION: 	afaik, a campaign will have a country it's aimed at that decision is not handled by us.
	// 				as a result, we don't access to that info. Instead, guess by what country has the most views,
	//				this is usually higher by several orders of magnitude so it's *usually* a safe bet.

		if (!regions || regions.length == 0) return regionMap // handle campaign still loading and campaigns with no results 

		let campaignRegions = Object.keys(regions) // all regions this campaign was in
		let currentRegion = campaignRegions.find((val) => val !== "unset") // set country with most impressions
		let targetedRegions = Object.keys(regionMap) // all regions already seen (used if multiple campaigns are being read)

		if (currentRegion) {
			if (targetedRegions.includes(currentRegion)) {
				regionMap[currentRegion].impressions += regions[currentRegion];
				regionMap[currentRegion].campaignsInRegion += 1;
			} else {
				regionMap[currentRegion] = {impressions: regions[currentRegion], campaignsInRegion: 1}
			}
		}

		// also track unset, needed to describe discrepency in campaigns used before we stored impression locations
		if (campaignRegions.includes("unset")){
			regionMap["unset"].impressions += regions["unset"];
			regionMap["unset"].campaignsInRegion += 1;
		}

		return regionMap
	},
		{unset: {impressions: 0, campaignsInRegion: 0}}
	)

	return campaignViews;
};


/**
 * Which products are in use under the given focus?
 * WTD = Watch To Donate, ETD = Engage To Donate, TADG = This Ad Does Good, GAT: Green Ad Tag
 * @param {Object} p
 * @param {Object[]} [p.ads] Adverts under the current impact page's focus
 * @param {Object[]} [p.greenTags] Green Ad Tags under the current impact page's focus
 * @return {Object} of form {wtd: boolean, tadg: boolean, etd: boolean, gat: boolean}
 */
export const getActiveTypes = ({ ads, greenTags }) => {
	const typesFound = { wtd: false, tadg: false, etd: false, gat: false };
	if (greenTags?.length) typesFound.gat = true;

	ads.forEach(ad => {
		// TODO sniff ad type: trees variant for TADG, social for ETD, everything else is WTD
		if (ad.advanced?.playerVariant === 'trees') {
			typesFound.tadg = true;
		} else if (ad.format === 'video') {
			typesFound.wtd = true;
		} else if (ad.format === 'social') {
			typesFound.etd = true;
		}
	});

	return typesFound;
};

/* ------- End of Data Functions --------- */