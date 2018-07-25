/**
 * Profiler sketch API
 * 
 * Note: use these wrapped by DataStore.fetch
 */

import ServerIO from './plumbing/ServerIOBase';
import {assert, assMatch} from 'sjtest';
// add funky methods to the "standard" Person data-class
import Person from './data/Person';
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

const saveProfile = ({xid, ...doc}) => {
	assMatch(xid, String);
	assert(doc);
	return ServerIO.post(`${ServerIO.PROFILER_ENDPOINT}/person/${xid}`, {action: 'put', doc: JSON.stringify(doc)});
};

/**
 * TODO dataspace and fields
 * @returns String[] never null, empty = apply sensible defaults
 */
const getPermissions = ({person, dataspace, fields}) => {
	Person.assIsa(person);
	let perms = person.p || [];
	return perms;
};


/**
 * @param permissions {String[]}
 * 
 * TODO
 * fields {?String[]}
 * Does NOT save
 */
const setPermissions = ({person, dataspace, permissions, fields}) => {
	Person.assIsa(person);
	assMatch(permissions, 'String[]', "Profiler.js",permissions);
	persion.p = permissions;
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
