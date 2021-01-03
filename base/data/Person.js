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

import { assert, assMatch } from '../utils/assert';
import DataClass, {getType, getId} from './DataClass';
import DataStore, { getDataPath } from '../plumbing/DataStore';
import Link from '../data/Link';
import Claim from '../data/Claim';
import XId from './XId';
import md5 from 'md5';
import PromiseValue from 'promise-value';
import {mapkv, encURI, debouncePV} from '../utils/miscutils';
import Cookies from 'js-cookie';
import Enum from 'easy-enums';

import ServerIO from '../plumbing/ServerIOBase';
import { sortByDate } from '../utils/SortFn';
import C from '../CBase';
import JSend from './JSend';



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
 * Get local or fetch
 * TODO fields 
 * @return {PromiseValue(Person)}
 */
const getProfile = ({xid, fields, status=C.KStatus.PUBLISHED}) => {
	assMatch(xid, String);
	const dsi = {type:'Person', status, id:xid};
	const dpath = getDataPath(dsi);
	// Use DS.fetch to avoid spamming the server
	return DataStore.fetch(dpath, () => {			
		// Call the server
		// NB: dont report 404s
		// NB: the "standard" servlet would be /person but it isnt quite ready yet (at which point we should switch to SIO_getDataItem)
		const pPeep = ServerIO.load(`${ServerIO.PROFILER_ENDPOINT}/profile/${ServerIO.dataspace}/${encURI(xid)}`, {data: {fields, status}, swallow:true});
		// save to local and DS
		pPeep.then(jsend => {
			assert(JSend.success(jsend), "getProfile fail"); // I think failure is handled in ServerIO
			const peep = JSend.data(jsend);
			Person.assIsa(peep);
			localSave(peep);
			// If we return a local save (see below), then DS.fetch thinks its job is done.
			// So we better set the DS value here too.
			// ?? use update instead to merge with any quick local edits??
			console.log("getProfile - server replacement for "+xid);
			DataStore.setValue(dpath, peep);
		});
		// Do we have a fast local answer?
		let localPeep = localLoad(xid);
		if (localPeep) {
			console.log("getProfile - localLoad for "+xid);
			return localPeep; 
			// NB the server load is still going to run in the background
		}
		// return server-loading
		console.log("getProfile - server load for "+xid);
		return pPeep;
	}); // ./DS.fetch
};

/**
 * Convenience method:
 * Fetch the data for all xids. Return the profiles for those that are loaded.
 * e.g.
 * ```
 * let persons = getProfilesNow(getAllXIds());
 * let value = getClaimValue({persons, key:'name'});
 * ```
 * @param {?String[]} xids Defaults to `getAllXIds()`
 * @returns {Person[]} peeps
 */
const getProfilesNow = xids => {
	if ( ! xids) xids = getAllXIds();
	assert(_.isArray(xids), "Person.js getProfilesNow "+xids);
	xids = xids.filter(x => !!x); // no nulls
	let pvsPeep = xids.map(xid => getProfile({xid}));
	let peeps = pvsPeep.filter(pvp => pvp.value).map(pvp => pvp.value);
	return peeps;
};


/**
 * A debounced save - allows 1 second for batching edits
 * Create UI call for saving claims to back-end
	@param {Person[]} persons
	@returns {PromiseValue}
*/ 
const savePersons = debouncePV(({persons, then}) => {
	// one save per person ?? TODO batch
	let pSaves = persons.map(peep => {
		Person.assIsa(peep);
		// local save
		localSave(peep);
		let claims = peep.claims;
		// TODO filter for our new claims, maybe just by date, and send a diff
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
	return pSaveAll;
}, 1000);


const localSave = person => {
	if ( ! window.localStorage) return false;
	Person.assIsa(person);
	try {
		let json = JSON.stringify(person);	
		let xid = Person.getId(person);
		window.localStorage.setItem(xid, json);
		return true;
	} catch(err) {
		// eg quota exceeded
		console.error(err);
		return false;
	}
};

/**
 * 
 * @param {!string} xid 
 * @returns {?Person}
 */
const localLoad = xid => {
	if ( ! window.localStorage) return null;
	assMatch(xid, String);
	try {
		let json = window.localStorage.getItem(xid);
		let peep = JSON.parse(json);			
		return peep;
	} catch(err) { // paranoia
		// Can this happen??
		console.error(err);
		return null;
	}
};


/**
 * A debounced save - allows 1 second for batching edits
 * Create UI call for saving consents to back-end
	@param {Person[]} persons
*/ 
const saveConsents = _.debounce(({persons}) => {
	// one save per person ?? TODO batch
	let pSaves = persons.map(peep => {
		Person.assIsa(peep);
		// string[] -- send as a comma-separated list
		let consents = peep.c;
		if ( ! consents || ! consents.length) {
			return null;
		}
		// ??send a diff??
		let xid = Person.getId(peep);
		return ServerIO.post(
			`${ServerIO.PROFILER_ENDPOINT}/profile/${ServerIO.dataspace}/${encURI(xid)}`, 
			{consents:consents.join(",")}
		);
	});
	// filter any nulls
	pSaves = pSaves.filter(p => p);
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
const getConsents = ({person, persons, xids}) => {
	if (xids) {
		assert( ! persons, "xids + profiles?!");
		persons = getProfilesNow(xids);
	}
	// several profiles?
	if (persons) {
		let debugWho4c = {};
		// combine them
		let perms = {};
		persons.forEach(peep => {
			if ( ! peep) {
				return; // paranoia
			}
			// hm - prefer true/false/most-recent??
			let peepPerms = getConsents({person:peep});
			if (peepPerms) {
				Object.assign(perms, peepPerms);
				Object.keys(peepPerms).forEach(c => debugWho4c[c] = peep.id);
			}
		});
		console.log("getConsents who4c",debugWho4c,"perms",perms);
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
 * @param {?Person[]} persons Use this to combine from several linked profiles
 * @param {?string[]} xids Convenience for `profiles`.
 * @param {!string} purpose The purpose ID of the consent you want
 * @returns {Boolean} 
 */
const hasConsent = ({person, persons, xids, purpose}) => {
	assMatch(purpose, String);
	const cs = getConsents({person, persons, xids});
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
 * Warning: This races Login and profile fetch for handling linked ids -- so the results can change!
 * 
 * @returns {String[]} xids - includes unverified linked ones
 */
const getAllXIds = () => {
	// use Set to dedupe
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
	// turn into an array
	let aall = Array.from(all);
	// HACK: prune down to the main ones
	let all2 = aall.filter(xid => XId.service(xid)!=='trk');
	if (all2.length) aall = all2;
	// done
	return aall;
};
/**
 * @param {Set<String>} all XIds -- modify this!
 * @param {String[]} agendaXIds XIds to investigate
 */
const getAllXIds2 = (all, agendaXIds) => {
	// ...fetch profiles from the agenda
	let pvsPeep = agendaXIds.map(xid => getProfile({xid}));
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

/**
 * Does NOT call `savePersons()`
 * @param {!string} consent
 */
const addConsent = ({persons, consent}) => {
	persons.forEach(person => {
		let consents = person.c;
		if ( ! consents) consents = person.c = [];
		if (consents.includes(consent)) return;
		consents.push(consent);
	});
	console.error("addConsent",persons,consent);
};
/**
 * 
 * @param {!string} consent
 */
const removeConsent = ({persons, consent}) => {
	persons.forEach(person => {
		let consents = person.c;
		if ( ! consents) return;
		person.c = person.c.filter(pc => pc !== consent);
	});
	console.error("removeConsent",persons,consent);
};

/**
 * Locally set a claim value (does NOT save -- use `savePersons()` to save)
 */
const setClaimValue = ({persons, key, value}) => {
	if ( ! persons.length) console.warn("setClaimValue - no persons :( -- Check profile load is working");
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
 * @param {Person[]} persons
 * @returns {!Claim[]}
 */
const getClaims = ({persons, key}) => {
	assMatch(key, String);
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
	addConsent, removeConsent,
	saveConsents,
	requestAnalyzeData,
	PURPOSES,
	getEmail,

	// debug only
	localLoad, localSave,

	// Lets offer some easy ways to edit profile-bundles
	getClaims, getClaimValue, setClaimValue, savePersons
};
