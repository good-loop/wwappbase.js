/** Data model functions for the NGO data-type. */
import Enum from 'easy-enums';
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

NGO.summaryDescription = (ngo) => {
	if (ngo.summaryDescription) return ngo.summaryDescription;
	let desc = NGO.anyDescription(ngo);
	if ( ! desc) return null;
	let paragraphs = desc.split("\n[ \t\r]*\n");
	let p1 = paragraphs[0];
	return p1;
}

NGO.extendedDescription = (ngo) => ngo.extendedDescription;

NGO.anyDescription = (ngo) => NGO.description(ngo) || ngo.summaryDescription || NGO.extendedDescription(ngo);

NGO.logo = ngo => ngo.logo; // placeholder by cause area?

NGO.altlogo = ngo => ngo.altlogo;

NGO.useAltLogo = ngo => ngo.useAltLogo;

NGO.imageList = (ngo) => ngo.imageList;

/**
 * The NGO data type has got messy -- this will return all images
 * @param {?NGO} ngo 
 * @returns {Object[]}
 */
NGO.images = ngo => {
	if ( ! ngo) return [];
	let stockPhotos = ngo.category ? (NGO.STOCK_IMAGES[ngo.category]) : []
	let allImages = [ngo.photo, ngo.images, ngo.highResPhoto, ...stockPhotos].concat(ngo.imageList);
	return allImages.filter(x => x);
};


NGO.KRegOrg = new Enum("OSCR Companies_House Blah Other");

// /**
//  * FIXME switch to vera's code
//  * TODO use this
//  * 
//  * Registered charity number, company number, etc.
//  * @param {*} ngo 
//  * @returns TODO{Reg[]} 
//  */
// NGO.regs = ngo => {
// 	if ( ! ngo) return [];
// 	let regs = [];
// 	// HACK
// 	// TODO store as Regs
// 	if (ngo.englandWalesCharityRegNum) {
// 		regs.push({organisation:"England and Wales Charity Commission", id:ngo.englandWalesCharityRegNum, country:"GB"});
// 	}
// 	if (ngo.scotlandCharityRegNum) {
// 		regs.push({organisation:"Scottish OSCR", id:ngo.scotlandCharityRegNum, country:"GB"});
// 	}
// 	if (ngo.niCharityRegNum) {
// 		regs.push({organisation:"Northern Ireland", id:ngo.niCharityRegNum, country:"GB"});
// 	}
// 	if (ngo.ukCompanyRegNum) {
// 		regs.push({organisation:"UK Companies House", id:ngo.ukCompanyRegNum, country:"GB"});
// 	}
// 	if (ngo.usCharityRegNum) {
// 		regs.push({organisation:"US", id:ngo.usCharityRegNum, country:"US"});
// 	}
// 	return regs;
// };

NGO.t4gTheme = (ngo) => ngo.t4gTheme;

/**
 * displayName or name or ID
 * @param {NGO} ngo 
 * @returns {?string}
 */
NGO.displayName = ngo => ngo ? ngo.displayName || ngo.name || NGO.id(ngo) : null;

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
	"animals":[ // not environment - see below
		"Animal Rights, Welfare, and Services", 
		"Wildlife Conservation", 
		"Zoos and Aquariums"
	],
	"culture":[
		"Libraries, Historical Societies and Landmark Preservation",
		"Museums",
		"Performing Arts",
		"Public Broadcasting and Media"
	], 
	"community":[
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

// TODO add more stock images, all of these are just elk right now
NGO.STOCK_IMAGES = {
	"animals": [
		"https://www.kimballstock.com/images/animal-stock-photos/new-stock-photos.jpg",
		"https://www.kimballstock.com/images/animal-stock-photos/new-stock-photos.jpg"
	],

	"culture": [
		"https://www.kimballstock.com/images/animal-stock-photos/new-stock-photos.jpg",
		"https://www.kimballstock.com/images/animal-stock-photos/new-stock-photos.jpg"
	],

	"community": [
		"https://www.kimballstock.com/images/animal-stock-photos/new-stock-photos.jpg",
		"https://www.kimballstock.com/images/animal-stock-photos/new-stock-photos.jpg"
	],

	"education": [
		"https://www.kimballstock.com/images/animal-stock-photos/new-stock-photos.jpg",
		"https://www.kimballstock.com/images/animal-stock-photos/new-stock-photos.jpg"
	],

	"environment": [
		"https://www.kimballstock.com/images/animal-stock-photos/new-stock-photos.jpg",
		"https://www.kimballstock.com/images/animal-stock-photos/new-stock-photos.jpg"
	],

	"health": [
		"https://www.kimballstock.com/images/animal-stock-photos/new-stock-photos.jpg",
		"https://www.kimballstock.com/images/animal-stock-photos/new-stock-photos.jpg"
	],

	"civil rights": [
		"https://www.kimballstock.com/images/animal-stock-photos/new-stock-photos.jpg",
		"https://www.kimballstock.com/images/animal-stock-photos/new-stock-photos.jpg"
	],

	"human services": [
		"https://www.kimballstock.com/images/animal-stock-photos/new-stock-photos.jpg",
		"https://www.kimballstock.com/images/animal-stock-photos/new-stock-photos.jpg"
	],

	"international": [
		"https://www.kimballstock.com/images/animal-stock-photos/new-stock-photos.jpg",
		"https://www.kimballstock.com/images/animal-stock-photos/new-stock-photos.jpg"
	],

	"research": [
		"https://www.kimballstock.com/images/animal-stock-photos/new-stock-photos.jpg",
		"https://www.kimballstock.com/images/animal-stock-photos/new-stock-photos.jpg"
	],

	"religion": [
		"https://www.kimballstock.com/images/animal-stock-photos/new-stock-photos.jpg",
		"https://www.kimballstock.com/images/animal-stock-photos/new-stock-photos.jpg"
	],

	"default": [
		"https://www.kimballstock.com/images/animal-stock-photos/new-stock-photos.jpg",
		"https://www.kimballstock.com/images/animal-stock-photos/new-stock-photos.jpg"
	]
}
