/**
 * Profiler sketch API
 * 
 * Note: use these wrapped by DataStore.fetch
 */

import ServerIO from './plumbing/ServerIOBase';
import {assert, assMatch} from 'sjtest';
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

Person.getProfile = getProfile;
Person.getProfilesNow = getProfilesNow;
Person.saveProfile = saveProfile;
Person.getPermissions = getPermissions;
Person.setPermissions = setPermissions;

export {
	getProfile,
	getProfilesNow,
	saveProfile,
	getPermissions,
	setPermissions
};
export default Person;
