/**
 * Profiler sketch API
 * 
 * Note: use these wrapped by DataStore.fetch
 */

import ServerIO from './plumbing/ServerIOBase';
import {assert, assMatch, assertMatch} from 'sjtest';
// add funky methods to the "standard" Person data-class
import Person from './data/Person';
import PV from 'promise-value';
import {mapkv, encURI} from 'wwutils';
assert(Person);

// for debug
window.Person = Person;


/**
 * Use with DataStore
 * @return {promise(Person)}
 */
const getProfile = ({xid, fields, status}) => {
	assMatch(xid, String);
	// NB: dont report 404s
	// NB: the "standard" servlet would be /person but it isnt quite ready yet (at which point we should switch to ServerIO.getDataItem)
	return ServerIO.load(`${ServerIO.PROFILER_ENDPOINT}/profile/${ServerIO.dataspace}/${encURI(xid)}`, {data: {fields, status}, swallow:true});
};

/**
 * Convenience method:
 * Fetch the data for all xids. Return the profiles for those that are loaded.
 * @param {String[]} xids 
 * @returns {Person[]} peeps
 */
const getProfilesNow = xids => {
	assert(_.isArray(xids), "Profiler.js getProfilesNow "+xids);
	xids = xids.filter(x => !!x); // no nulls
	const fetcher = xid => DataStore.fetch(['data', 'Person', xid], () => {
		return getProfile({xid});
	});
	let pvsPeep = xids.map(fetcher);	
	let peeps = pvsPeep.filter(pvp => pvp.value).map(pvp => pvp.value);
	return peeps;
};

/** Puts data into the "Claim" format that it can understand */
const createClaim = ({key, value, from, p}) => {
	if(_.isString(from)) from = [from];	
	
	assMatch(key, String); 
	assMatch(value, String);
	assMatch(from, 'String[]');

	// Converting from internally held true/false to something
	// That the back-end can understand
	if( typeof p === 'boolean' ) p = p ? ['public'] : ['private']

	return {
		// Hard-set to public for now
		p: p,
		'@class': 'com.winterwell.profiler.data.Claim',
		t: new Date().toISOString(),
		v: value,
		f: from,
		k: key,
		// kv: key + "=" + value TODO make at the backend
	};
};

/** 
 * @param xid the xid that the claim will be registered to
 * Change to return object of all unique key:value pairs for the given xid?
 * @returns {gender: {value: 'male', permission: 'private'}, locaton: {value: 'who_knows', permission: 'public'}}
 * Example of Claims object as of 18/10/18
 * {"p": ["controller"], "@class": "com.winterwell.profiler.data.Claim", "t": "2018-10-18T11:14:04Z", "v": "This is Peter Pan, a test account for SoGrow...",
	"f": ["mark@winterwell.com@email"], "k": "description", "kv": "description=This is Peter Pan, a test account for SoGrow...","o": "description-mark@winterwell.com@email"
	}
 */
const getClaimsForXId = (xid) => {
	const claims = DataStore.getValue(['data', 'Person', xid, 'claims']);

	if( ! claims ) return;

	const formattedClaims = claims.reduce( (obj, claim) => {
		let {k, f, v, p} = claim;

		// If contains "public", set to true
		// set to false ("private") otherwise
		// Reasoning is that default state is "private"/false anyway
		// Change this to "private" if you want all options checked by default
		if(_.isArray(p)) p = p.includes("public");

		// If the claim is from the given user id
		// add its value to the outgoing obj and continue 
		if( f.includes(xid) ) {
			obj[k] = {value: v, permission: p};
			return obj;
		}

		return obj;
	}, {});
	return _.isEmpty(formattedClaims) ? null : formattedClaims;
};

/** Create UI call for saving claim to back-end
	@param xids {String[]} XId format
	@param claims {Claim[]}
	@param jwt auth token string used by the back-end to determine where data came from (see Claims.f parameter)
	@returns Array of promises
	(22/10/18)
	For the moment, am assuming that all claims provided should come from the same source
	That is why only one jwt is provided.

	This is fine for now as we are only working with a single social media service (Twitter),
	but this may need to be generalised if, for example, we wished to save Claims from a variety
	of different sources via a single call to saveFn. Currently, this is not possible.
*/ 
const saveProfileClaims = (xids, claims, jwt) => {
	if(_.isString(xids)) xids = [xids];

	assMatch(xids, "String[]", "Profiler.js saveProfileClaims xids")
	assMatch(claims, "Object[]", "Profiler.js saveProfileClaims() claims");
	
	if( _.isEmpty(claims) ) {
		console.warn('Profiler.js saveProfileClaims -- no claims provided, aborting save');
		return;
	}

	return xids.map( xid => {
		assMatch(xid, String);
		return PV(ServerIO.post(`${ServerIO.PROFILER_ENDPOINT}/profile/${ServerIO.dataspace}/${encURI(xid)}`, {action: 'PUT', claims: JSON.stringify(claims)}, jwt));
	});
};

/**
 * 
 * @return PV[]
 */
const saveProfile = (doc) => {
	assert(doc, "Profiler.js - saveProfile "+doc);
	let ids = doc.id || doc.xid;
	// paranoia: ensure array
	if (_.isString(ids)) ids = [ids];
	const pvs = [];
	ids.forEach(xid => {
		assMatch(xid, String, "Profiler.js - saveProfile", doc);		
		let prm = ServerIO.post(`${ServerIO.PROFILER_ENDPOINT}/profile/${ServerIO.dataspace}/${encURI(xid)}`, {action: 'put', doc: JSON.stringify(doc)});			
		pvs.push(PV(prm));
	});
	return pvs;
};

/**
 * The underlying permissions model is rich (it can carry more options and audit info). 
 * We mostly want to work with something simple.
 * 
 * TODO dataspace and fields
 * @returns {String: Boolean} never null, empty = apply sensible defaults
 */
const getPermissions = ({person, dataspace, fields}) => {
	Person.assIsa(person);
	// convert list-of-strings into a true/false map
	let pmap = {};
	let perms = person.p || [];
	perms.forEach(p => {
		// TODO custom?
		// not?
		if (p[0] === "-") {
			p = p.substr(1);
			pmap[p] = false;
		} else {
			pmap[p] = true;
		}
	});
	// done
	return pmap;
};


/**
 * @param permissions {String: Boolean}
 * 
 * Does NOT save
 */
const setPermissions = ({person, dataspace, permissions, fields}) => {
	Person.assIsa(person);
	assert( ! _.isArray(permissions), "Profiler.js use a map: "+permissions);
	// inverse of getPermissions
	let pstrings = mapkv(permissions, (k,v) => {
		return v? k : "-"+k;
	});
	// Audit trail of whats changed? TODO manage that server-side.
	person.p = pstrings;
	return person;
};

Person.createClaim = createClaim;
Person.saveProfileClaims = saveProfileClaims;
Person.getProfile = getProfile;
Person.getProfilesNow = getProfilesNow;
Person.saveProfile = saveProfile;
Person.getPermissions = getPermissions;
Person.setPermissions = setPermissions;

export {
	createClaim,
	saveProfileClaims,
	getClaimsForXId,
	getProfile,
	getProfilesNow,
	saveProfile,
	getPermissions,
	setPermissions
};
export default Person;
