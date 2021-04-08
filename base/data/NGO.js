/** Data model functions for the NGO data-type. */

import DataClass from './DataClass';

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
 * Augment charities with sogive data
 * @param {NGO[]} charities 
 * @returns {NGO[]}
 */
 NGO.fetchSogiveData = charities => {
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
		return charity;
	});
	// Remove null entries
    sogiveCharities = sogiveCharities.filter(x => x);
	return sogiveCharities;
};