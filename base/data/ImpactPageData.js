
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
import { isEmpty, maxBy, uniqBy } from 'lodash';
import GreenTag from './GreenTag';

/* ------- Data Functions --------- */

/**
 * Fetches the contextual data necessary to generate an impact page for the given item
 * @param {Object} p
 * @param {String} p.itemId
 * @param {String} p.itemType
 * @param {KStatus} p.status 
 * @returns {PromiseValue<Object>} {campaign, brand, masterBrand, subBrands, subCampaigns, impactDebits, charities, ads}
 */
export const fetchImpactBaseObjects = ({itemId, itemType, status, start, end}) => {
	assert(itemId);
	assert(itemType);
	assert(status);

	return DataStore.fetch(['misc', 'impactBaseObjects', itemType, status, space(start, end) || "whenever", itemId], () => {
		return fetchImpactBaseObjects2({itemId, itemType, status, start, end});
	});
}


const fetchImpactBaseObjects2 = async ({itemId, itemType, status, start, end}) => {
	let pvCampaign, campaign;
	let pvBrand, brand, brandId;
	let pvMasterBrand, masterBrand;
	let pvSubBrands, subBrands;
	let pvSubCampaigns, subCampaigns;
	let pvImpactDebits, impactDebits;
	let pvCharities, charities;
	let greenTags = [];
	let ads = [], wtdAds = [], etdAds = [], tadgAds = [];
	let subCampaignsDisplayable, subBrandsDisplayable;

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
		pvImpactDebits = Advertiser.getImpactDebits({vertiser:brand, status, start, end});
		impactDebits = List.hits(await pvImpactDebits.promise);
		console.log("Got debits from brand!", impactDebits);
	} else {
		// Get only campaign debits
		pvImpactDebits = Campaign.getImpactDebits({campaign, status, start, end});
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

	// Divide ads into WTD, ETD and TADG
	ads.forEach(ad => {
		if (ad.advanced?.playerVariant === 'trees') {
			tadgAds.push(ad);
		} else if (ad.format === 'video') {
			wtdAds.push(ad);
		} else if (ad.format === 'social') {
			etdAds.push(ad);
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

	const augCharityComparator = (a, b) => {
		if (a.dntnTotal && b.dntnTotal) return Money.sub(b.dntnTotal, a.dntnTotal).value;
		if (a.dntnTotal) return 1;
		if (b.dntnTotal) return -1;
		return 0;
	};

	// Attach donation total (sum of monetary ImpactDebits) to each charity & sort highest-first
	charities = charities.map(charity => {
		const cid = NGO.id(charity);
		const dntnTotal = impactDebits
			.filter(idObj => idObj?.impact?.charity === cid)
			.reduce((acc, idObj) => {
				const thisAmt = idObj?.impact?.amount;
				if (!acc) return thisAmt;
				if (!Money.isa(thisAmt)) return acc;
				return Money.add(acc, thisAmt);
			}, null);
		return {...charity, dntnTotal};
	}).sort(augCharityComparator);

	// Only campaigns/brands with debits and ads are displayable
	// Filter for debits
	let cidsWithDebits = [];
	let bidsWithDebits = [];
	impactDebits.forEach(debit => {
		if (debit.campaign && !cidsWithDebits.includes(debit.campaign)) cidsWithDebits.push(debit.campaign);
		if (debit.vertiser && !bidsWithDebits.includes(debit.vertiser)) bidsWithDebits.push(debit.vertiser);
	});
	subCampaignsDisplayable = subCampaigns.filter(c => cidsWithDebits.includes(getId(c)));
	subBrandsDisplayable = subBrands.filter(b => bidsWithDebits.includes(getId(b)));

	// Filter for ads
	let cidsWithAds = [];
	let bidsWithAds = [];
	ads.forEach(ad => {
		if (ad.campaign && !cidsWithAds.includes(ad.campaign)) cidsWithAds.push(ad.campaign);
		if (ad.vertiser && !bidsWithAds.includes(ad.vertiser)) bidsWithAds.push(ad.vertiser);
	});
	subCampaignsDisplayable = subCampaignsDisplayable.filter(c => cidsWithAds.includes(getId(c)));
	subBrandsDisplayable = subBrandsDisplayable.filter(b => bidsWithAds.includes(getId(b)));

	// Allow URL flag to override
	const showAll = DataStore.getUrlValue("showAll");
	if (showAll) {
		let cidsDisplay = subCampaignsDisplayable.map(c => getId(c));
		let bidsDisplay = subBrandsDisplayable.map(b => getId(b));
		// Go through and mark each item if it should be hidden normally
		subCampaigns.forEach(c => {
			if (!cidsDisplay.includes(getId(c))) {
				c._shouldHide = true;
				subCampaignsDisplayable.push(c);
			}
		});
		subBrands.forEach(b => {
			if (!bidsDisplay.includes(getId(b))) {
				b._shouldHide = true;
				subBrandsDisplayable.push(b);
			}
		});
	}

	return {
		campaign, subCampaigns, subCampaignsDisplayable,
		brand, masterBrand, subBrands, subBrandsDisplayable,
		impactDebits,
		charities,
		ads, wtdAds, etdAds, tadgAds,
		greenTags
	};
}


/** Passed to _.maxBy in getImpressionsByCampaignByCountry to find the non-unset country with the highest impression count*/
const highestNotUnsetPredicate = ([country, viewCount]) => (country === 'unset') ? 0 : viewCount;


/**
 * Aggregate impressions-per-country for a campaign or group of subcampaigns
 * TODO Start and end params are unused
 * @param {object} p
 * @param {object} p.baseObjects ??
 * @param {Campaign} [p.baseObjects.campaign]
 * @param {Campaign[]} [p.baseObjects.subCampaigns]
 * 
 * @returns {object<{String: Number}>} Of form { [countryCode]: impressionCount }
 */
export const getImpressionsByCampaignByCountry = ({ baseObjects, start = '', end = 'now', locationField = 'country', ...rest }) => {
	assert(baseObjects);
	let { campaign: focusCampaign, subCampaigns } = baseObjects;
	if (!focusCampaign && (!subCampaigns || subCampaigns.length == 0)) return {}; // No campaigns, no data

	// if focusCampaign is set, then the user has filtered to a single campaign (no subcampaigns)
	const campaigns = focusCampaign ? [focusCampaign] : subCampaigns;
	assert(campaigns);

	// Lots of processing as well as the fetch, so save results
	const dsPath = ['misc', 'getImpressionsByCampaignByCountry', campaigns.toString()];
	const already = DataStore.getValue(dsPath);
	if (already) return already;

	// This has a PV behind it and won't immediately return values
	const viewsByCountryPerCampaign = campaigns.map(campaign => Campaign.viewcountByCountry({campaign, status: KStatus.PUBLISHED}));
	if (!viewsByCountryPerCampaign?.length) return {}; // Nothing returned yet
	// Incomplete data? (viewcountByCountry returns null when ads-for-campaign not yet fetched, or DataLog results still pending)
	if (viewsByCountryPerCampaign.includes(null)) return {};

	// Find set of regions that were probably targeted by a campaign
	// "Probably" = we assume each campaign is intended for only one country, and that
	// will be the country (besides "unset") with the highest total impression count.
	const country2views_all = { unset: { impressions: 0, campaignsInRegion: 0 } };
	viewsByCountryPerCampaign.forEach(country2views => {
		if (isEmpty(country2views)) return;

		// Find the region besides "unset" with the highest viewcount for this campaign
		const [region, impressions] = maxBy(Object.entries(country2views), highestNotUnsetPredicate);

		// Any data for this country already in the table?
		// If so, increment its data: if not, initialise it now.
		let regionTotals = country2views_all[region];
		if (regionTotals) {
			regionTotals.impressions += impressions;
			regionTotals.campaignsInRegion += 1;
		} else {
			country2views_all[region] = { impressions, campaignsInRegion: 1 };
		}
		// Record impressions with unset country as well
		if (country2views.unset) {
			country2views_all.unset.impressions += country2views.unset;
			country2views_all.unset.campaignsInRegion += 1;
		}
	});

	// Cache the result when complete
	DataStore.setValue(dsPath, country2views_all);
	return country2views_all;
};


/* ------- End of Data Functions --------- */
