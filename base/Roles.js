import Login from 'you-again';
import DataStore from './plumbing/DataStore';
import {assMatch, assert} from 'sjtest';
import PromiseValue from 'promise-value';

/**
 * @returns {PromiseValue<String[]>}
 */
const getRoles = () => {
	// HACK: This is set elsewhere - but there can be an init ordering issue
	if ( ! Login.app) Login.app = C.app.service;

	if ( ! Login.isLoggedIn()) {
		return new PromiseValue([]);
	}
	const uxid = Login.getId();
	if ( ! uxid) {	// debug paranoia
		console.error("Roles.js huh? "+Login.isLoggedIn()+" but "+Login.getId());
		return new PromiseValue([]);
	}
	// NB: store under user xid so a change in user is fine
	let shared = DataStore.fetch(['misc', 'roles', uxid],
		() => {
			let req = Login.getSharedWith({prefix:"role:*"});
			return req.then(function(res) {
				if ( ! res.success) {
					console.error(res);
					return []; // this will get stored, otherwise an error causes the system to thrash by trying repeatedly
				}
				let shares = res.cargo;				
				let roles = shares.filter(s => s.item && s.item.substr(0,5)==='role:').map(s => s.item.substr(5));
				roles = Array.from(new Set(roles)); // de dupe
				return roles;
			});
		},
		60000 // cache for a minute
	);
	return shared;
};

/**
 * 
 * @param {!XId} uxid 
 * @param {!String} role 
 * @returns {Promise}
 */
const addRole = (uxid, role) => {
	assert(uxid.indexOf('@') !== -1, "Roles.js - addRole no user-xid");
	assert(cans4role[role], "Roles.js - addRole() unknown role: "+role);
	return Login.shareThing("role:"+role, uxid);
};

/**
 * Can the current user do this?
 * Will fetch by ajax if unset.
 * 
 * Example:
 * ```
 * 	let {promise,value} = Roles.iCan('eat:sweets');
 * 	if (value) { eat sweets }
 * 	else if (value === false) { no sweets }
 * 	else { waiting on ajax }	
 * ```
 * 
 * @param {!String} capability
 * @returns {PromiseValue<Boolean>} Promise-Value
 */
const iCan = (capability) => {
	assMatch(capability, String);
	let proles = getRoles();
	if (proles.value) {
		for(let i=0; i<proles.value.length; i++) {
			let cans = cans4role[proles.value[i]];
			if ( ! cans) {
				console.error("Roles.js - unknown role: "+proles.value[i]);
				continue;
			}
			if (cans.indexOf(capability) !== -1) return new PromiseValue(true);
		}
		return new PromiseValue(false);
	}
	// ajax...
	// ?? is this a PV?? isnt this a promise??
	return proles.promise.then(
		res => iCan(capability)
	);
};

const cans4role = {};

/**
 * @param {!String} role - e.g. "editor"
 * @param {!String[]} cans
 */
const defineRole = (role, cans) => {
	assMatch(role, String);
	assMatch(cans, "String[]");
	cans4role[role] = cans;
};

/**
 * Convenience for "is this a developer/admin?"
 * @returns Boolean
 */
const isDev = () => {
	let cana = iCan('admin');
	let cand = iCan('dev');
	return !! (cana.value || cand.value);
};

const Roles = {
	iCan,
	defineRole,
	getRoles,
	isDev
};
window.Roles = Roles; // debug hack

export default Roles;
export {
	defineRole,
	iCan,
	getRoles,
	isDev,
	addRole
}
