/**
 * Profiler sketch API
 * 
 * Note: use these wrapped by DataStore.fetch
 */

import ServerIO from './plumbing/ServerIOBase';
import {assert, assMatch} from 'sjtest';

const getProfile = ({xid, fields, status}) => {
	assMatch(xid, String);
	return ServerIO.load(`${ServerIO.PROFILER_ENDPOINT}/person/${xid}`, {data: {fields, status}});
};

const putProfile = ({xid, ...doc}) => {
	assMatch(xid, String);
	assert(doc);
	return ServerIO.post(`${ServerIO.PROFILER_ENDPOINT}/person/${xid}`, {action: 'put', doc: JSON.stringify(doc)});
};

/**
 * TODO
 * @returns Permission[] never null
 */
const getPermissions = (person, dataspace, fields) => [];


/**
 * TODO
 * fields {?String[]}
 */
const setPermissions = (person, dataspace, permissions, fields) => null;

export {
	getProfile,
	putProfile
};
