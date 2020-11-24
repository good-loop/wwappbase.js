/**
 * Profiler sketch API
 * See also the profiler java code, Person.java, and Person.js
 * 
 * The Profiler is a bit complex -- partly as the code is WIP, but partly because the task is complex:
 * Model users "properly", handling multiple overlapping profiles e.g. Facebook / Twitter / email(s)
 * And that seemingly simple flags like "yes-to-cookies" need complex data for audit trails and scope.
 * 
 * Core idea:
 * The user does NOT have one profile. They have several linked profiles. Data may be drawn from any of those.
 * 
 * 
 * TODO maybe merge this with Person.js
 * 
 */

import {assert, assMatch} from 'sjtest';
import DataClass, {getType, getId} from './DataClass';
import DataStore from '../plumbing/DataStore';
import Link from '../data/Link';
import Claim from '../data/Claim';
import XId from './XId';
import md5 from 'md5';
import PromiseValue from 'promise-value';
import {mapkv, encURI} from '../utils/miscutils';
import Cookies from 'js-cookie';
import Enum from 'easy-enums';

import ServerIO from '../plumbing/ServerIOBase';
import { sortByDate } from '../utils/SortFn';



/**
 * See Person.java
 * 
 * Person is a rich model for profiles
 */
class Person extends DataClass {
	/** @type {!string} main ID */
	id;
	/** @type {!string[]} Can have multiple IDs! Only if they are genuinely 100% equivalent, e.g. twitter username and numerical ID */
	ids;
	/** @type {string} */
	img;
	/** @type {Link[]} */
	links;
	/** @type {Claim[]} */
	claims;

	constructor(base) {
		super(base);
		Object.assign(this, base);		
	}
}
DataClass.register(Person, "Person");

// for debug
window.Person = Person;

const This = Person;
export default Person;

/**
 * NB a Person specific one, since this class can have multiple IDs
 * -- though this method is identical to the normal getId()!
 * @param {Person} peep
 * @returns {XId}
 */
Person.getId = peep => peep.id;

/**
 * Who is this person linked to?
 * @return {String[]} never null (empty list if unset)
 */
// (30/01/19) use filter instead of map to patch bug where Link.to returned undefined
// filter only adds value to return array if it is not falsy
Person.linkedIds = peep => peep.links? peep.links.reduce(Link.to, []) : [];

Person.img = peep => {
	if ( ! peep) return null;
	if (peep.img) return peep.img;
	const xid = getId(peep);
	if (XId.service(xid) === 'email') {
		const hash = md5(XId.id(xid).trim().toLowercase());
		return 'https://www.gravatar.com/avatar/'+hash;
	}
	return null;	
};

/**
 * 
 * @param {Person} peep 
 * @param {String} service
 * @returns {?Link} The (TODO most likely) email link
 */
Person.getLink = (peep, service) => {
	const links = Person.getLinks(peep, service);
	if ( ! links) return null;
	// FIXME sort them by w
	return links[0];
}


/**
 * 
 * @param {Person} peep 
 * @param {String} service
 * @returns {?Link[]} all matching links, or null if none
 */
Person.getLinks = (peep, service) => {
	Person.assIsa(peep);
	assMatch(service, String);
	// is the XId a match?
	const xid = Person.id(peep);
	if (XId.service(xid) === service) {
		return new Link({key:"link", value:xid, from:[xid], consent:['public'], w:1});
	}
	// links
	if ( ! peep.links) return null;	
	// NB: Test claims too? No - lets enforce clean data for ourselves
	let matchedLinks = peep.links.filter(link => XId.service(link.v) === service);	
	return matchedLinks.length !== 0? matchedLinks : null;
};


/**
 * See Purposes.java
 */
const PURPOSES = new Enum("any email_app email_mailing_list email_marketing cookies cookies_personalization cookies_analytical cookies_marketing cookies_functional personalize_ads");

/**
 * Use with DataStore
 * @return {promise(Person)}
 */
const getProfile = ({xid, fields, status}) => {
	assMatch(xid, String);
	// NB: dont report 404s
	// NB: the "standard" servlet would be /person but it isnt quite ready yet (at which point we should switch to SIO_getDataItem)
	return ServerIO.load(`${ServerIO.PROFILER_ENDPOINT}/profile/${ServerIO.dataspace}/${encURI(xid)}`, {data: {fields, status}, swallow:true});
};

/**
 * Convenience method:
 * Fetch the data for all xids. Return the profiles for those that are loaded.
 * e.g.
 * ```
 * let persons = getProfilesNow(getAllXIds());
 * let value = getClaimValue({persons, key:'name'});
 * ```
 * @param {String[]} xids 
 * @returns {Person[]} peeps
 */
const getProfilesNow = xids => {
	assert(_.isArray(xids), "Person.js getProfilesNow "+xids);
	xids = xids.filter(x => !!x); // no nulls
	const fetcher = xid => DataStore.fetch(['data', 'Person', 'profiles', xid ], () => {
		return getProfile({xid});
	});
	let pvsPeep = xids.map(fetcher);	
	let peeps = pvsPeep.filter(pvp => pvp.value).map(pvp => pvp.value);
	return peeps;
};


/**
 * A debounced save - allows 1 second for batching edits
 * Create UI call for saving claim to back-end
	@param xids {String[]} XId format
	@param claims {Claim[]}
*/ 
const savePersons = _.debounce(({persons}) => {	
	assMatch(persons, "Person[]", "Person.js saveProfileClaims persons")
	// one save per person ?? TODO batch
	let pSaves = persons.map(peep => {
		let claims = peep.claims;
		console.warn("TODO filter for our new claims",claims);
		if( _.isEmpty(claims) ) {
			console.warn('Person.js saveProfileClaims -- no claims provided, aborting save');
			return null;
		}
		let xid = Person.getId(peep);
		return ServerIO.post(
			`${ServerIO.PROFILER_ENDPOINT}/profile/${ServerIO.dataspace}/${encURI(xid)}`, 
			{claims: JSON.stringify(claims)}
		);
	});
	// join them
	let pSaveAll = Promise.allSettled(pSaves);
	return pSaveAll; // wrap in a PV??
}, 1000);

/**
 * This does NOT fetch any fresh data - it extracts data from the input Person object.
 * The underlying consents model is rich (it can carry more options and audit info). 
 * We mostly want to work with something simple.
 * 
 * @param {?Person} person
 * @param {?Person[]} profiles Use this to combine from several linked profiles
 * @param {?string[]} xids Convenience for `profiles` using `getProfilesNow`.
 * @returns {String: Boolean} never null, empty = apply sensible defaults
 */
const getConsents = ({person, profiles, xids}) => {
	if (xids) {
		assert( ! profiles, "xids + profiles?!");
		profiles = getProfilesNow(xids);
	}
	// several profiles?
	if (profiles) {
		// combine them
		let perms = {};
		profiles.forEach(peep => {
			if ( ! peep) {
				return; // paranoia
			}
			// hm - prefer true/false/most-recent??
			let peepPerms = getConsents({person:peep});
			if (peepPerms) {
				Object.assign(perms, peepPerms);
			}
		});
		return perms;
	}
	// one person
	Person.assIsa(person);
	// convert list-of-strings into a true/false map
	let pmap = {};
	let consents = person.c || [];
	consents.forEach(c => {
		if (c[0] === "-") {
			c = c.substr(1);
			pmap[c] = false;
		} else {
			pmap[c] = true;
		}
	});
	// done
	return pmap;
};


/**
 * This does NOT fetch any fresh data - it extracts data from the input Person object.
 * The underlying consents model is rich (it can carry more options and audit info). 
 * We mostly want to work with something simple.
 * 
 * @param {?Person} person
 * @param {?Person[]} profiles Use this to combine from several linked profiles
 * @param {?string[]} xids Convenience for `profiles`.
 * @param {!string} purpose The purpose ID of the consent you want
 * @returns {Boolean} 
 */
const hasConsent = ({person, profiles, xids, purpose}) => {
	assMatch(purpose, String);
	const cs = getConsents({person, profiles, xids});
	return cs[purpose];
};

/** Puts consents in to form used by back-end 
 * @param consents {String: Boolean} 
 * NB: handles the "yes"/"no" case
 * @returns {String[]} consents and -consents
*/
const convertConsents = (consents) => mapkv(consents, (k,v) => (v===true || v === "yes" || v===1) ? k : "-"+k);

/**
 * @param consents {String: Boolean}
 * 
 * Does NOT save
 */
const setConsents = ({person, consents}) => {
	Person.assIsa(person);
	assert( ! _.isArray(consents), "Person.js use a map: "+consents);

	let pstrings = convertConsents(consents);

	// Audit trail of whats changed? TODO manage that server-side.
	person.c = pstrings;
	return person;
};

/**
 * Convenience for "find a linked profile for email, or null"
 * @returns {?string} email
 */
const getEmail = ({xids}) => {
	let exid = xids.find(xid => XId.service(xid)==="email");
	if (exid) {
		return XId.id(exid);
	}
	return null;
};

/**
 * Call AnalyzeDataServlet to fetch and analyse Twitter data.
 * 
 * ??update DataStore here??
 */
const requestAnalyzeData = xid => {
	assMatch(xid, String);
	// NB: analyze is always for the gl dataspace
	return ServerIO.load(ServerIO.PROFILER_ENDPOINT + '/analyzedata/gl/' + escape(xid));
};

/**
 * fetch and stash a profile
 * @param {!string} xid 
 */
const fetcher = xid => DataStore.fetch(['data', 'Person', 'profiles', xid], () => {
	assMatch(xid, String, "MyPage.jsx fetcher: xid is not a string "+xid);
	// Call analyzedata servlet to pull in user data from Twitter
	// Putting this here means that the DigitalMirror will refresh itself with the data
	// once the request has finished processing
	if( XId.service(xid) === 'twitter' ) return requestAnalyzeData(xid);
	return getProfile({xid});
});

/**
 * Warning: This races Login and profile fetch for handling linked ids -- so the results can change!
 * 
 * @returns {String[]} xids - includes unverified linked ones
 */
const getAllXIds = () => {
	let all = new Set(); // String[]
	// ID
	if (Login.isLoggedIn()) {
		all.add(Login.getId());
	}
	// cookie tracker
	let trkid = Cookies.get("trkid");
	if (trkid) all.add(trkid);
	// aliases
	if (Login.aliases) {
		let axids = Login.aliases.map(a => a.xid);
		axids.forEach(a => all.add(a));
	}	
	// linked IDs?
	getAllXIds2(all, Array.from(all));
	return Array.from(all);
};
/**
 * @param {Set<String>} all XIds -- modify this!
 * @param {String[]} agendaXIds XIds to investigate
 */
const getAllXIds2 = (all, agendaXIds) => {
	// ...fetch profiles from the agenda
	let pvsPeep = agendaXIds.map(fetcher);
	// races the fetches -- so the output can change as more data comes in!
	// It can be considered done when DataStore holds a profile for each xid
	pvsPeep.filter(pvp => pvp.value).forEach(pvp => {
		let peep = pvp.value;
		let linkedIds = Person.linkedIds(peep);	
		if ( ! linkedIds) return;
		// loop test (must not already be in all) and recurse
		linkedIds.filter(li => ! all.has(li)).forEach(li => {
			all.add(li);
			getAllXIds2(all, [li]);					
		});
	});
};

/**
 * Process a mailing-list sign-up form
 * @param {!String} email
 * @param {?String} controller Who "owns" this data? Defaults to `ServerIO.dataspace`
 * @param {?String} notify Our email to send a note to
 */
const doRegisterEmail = (data) => {
	let email = data.email;
	if ( ! email) {
		console.error("Person.js - Cannot process - no email");
		return;
	}
	if ( ! data.controller) data.controller = ServerIO.dataspace;
	if ( ! data.ref) data.ref = ""+window.location;	
	// This will become a standard consent "I grant consent purpose=email_mailing_list to the data-controller"
	if ( ! data.purpose) {
		data.purpose = PURPOSES.email_mailing_list;
	}

	return ServerIO.load(`${ServerIO.PROFILER_ENDPOINT}/form/${ServerIO.dataspace}`, {data});	
};

// FIXME TODO - using setConsents to edit one consent is clunky (and risks race conditions)
const addConsent = (...props) => {
	console.error("addConsent",props);
};
const removeConsent = (...props) => {
	console.error("removeConsent",props);
};


const setClaimValue = ({persons, key, value}) => {
	let from = Login.getId();
	let consent = ['dflt']; // the "what is my current default?" setting
	let claim = new Claim({key,value,from,consent});	
	persons.map(peep => {
		addClaim(peep, claim);
	});
};

const addClaim = (peep, claim) => {
	Person.assIsa(peep);
	Claim.assIsa(claim);
	if ( ! peep.claims) peep.claims = [];
	
	// Does it replace a claim? - remove overlaps
	let overlaps = peep.claims.filter(oldClaim => Claim.overlap(claim, oldClaim));
	let newclaims = peep.claims.filter(oldClaim => ! Claim.overlap(claim, oldClaim));
	// add it
	newclaims.push(claim);
	peep.claims = newclaims;
};

/**
 * 
 * @returns the "best" claim value or null
 */
const getClaimValue = ({persons, key}) => {
	if ( ! persons) return null;
	let claims = getClaims({persons, key});
	if ( ! claims.length) return null;
	// HACK pick the best!
	if (claims.length > 1) {
		// prefer the login id
		let myclaims = claims.filter(c => c.f && c.f.length===1 && c.f[0] === Login.getId());
		if (myclaims.length) claims = myclaims;		
		// prefer the most recent
		claims.sort(sortByDate(c => c.t));
	}
	return claims[0].v;
};
/**
 * 
 * @returns {!Claim[]}
 */
const getClaims = ({persons, key}) => {
	let allClaims = [];
	persons.forEach(peep => allClaims.push(...peep.claims));	
	let keyClaims = allClaims.filter(claim => claim.k===key);
	return keyClaims;
};

export {
	doRegisterEmail,	
	convertConsents,
	getAllXIds,
	getProfile,
	getProfilesNow,
	getConsents, hasConsent,
	setConsents,
	// addConsent, removeConsent,
	// setClaim,
	requestAnalyzeData,
	PURPOSES,
	getEmail,

	// Lets offer some easy ways to edit profile-bundles
	getClaims, getClaimValue, setClaimValue, savePersons
};
