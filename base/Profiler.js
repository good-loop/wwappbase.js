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
import {mapkv} from 'wwutils';
assert(Person);

// for debug
window.Person = Person;

/**
 * 
 * @return {PV(Person)}
 */
const getProfile = ({xid, fields, status}) => {
	assMatch(xid, String);
	// NB: dont report 404s
	return ServerIO.load(`${ServerIO.PROFILER_ENDPOINT}/person/${xid}`, {data: {fields, status}, swallow:true});
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
		let prm = ServerIO.post(`${ServerIO.PROFILER_ENDPOINT}/person/${xid}`, {action: 'put', doc: JSON.stringify(doc)});			
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
	return perms;
};


/**
 * @param permissions {String: Boolean}
 * 
 * Does NOT save
 */
const setPermissions = ({person, dataspace, permissions, fields}) => {
	Person.assIsa(person);
	// inverse of getPermissions
	let pstrings = mapkv(permissions, (k,v) => {
		return v? k : "-"+k;
	});
	// Audit trail of whats changed? TODO manage that server-side.
	person.p = pstrings;
	return person;
};

Person.getProfile = getProfile;
Person.saveProfile = saveProfile;
Person.getPermissions = getPermissions;
Person.setPermissions = setPermissions;

export {
	getProfile,
	saveProfile,
	getPermissions,
	setPermissions
};
export default Person;
