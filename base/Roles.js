import Login from '../base/youagain';
import DataStore from './plumbing/DataStore';
import PromiseValue from 'promise-value';
import { assert, assMatch } from './utils/assert';

/**
 * @returns PromiseValue<String[]>
 */
const getRoles = () => {
	// HACK: This is set elsewhere - but there can be an init ordering issue
	if ( ! Login.app) Login.app = C.app.id || C.app.service;
	if ( ! Login.dataspace) Login.dataspace = C.app.dataspace;

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
			let req = Login.getSharedWith({prefix:"role:"});
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
	// optimistice set??
	let roles = getRoles();
	if (roles.value && ! roles.value.includes(role)) {
		roles.value.push(role);
	}
	// share role
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
	// wait...
	const pvCan = PromiseValue.then(proles, _whatever => resolve(iCan(capability)));
	return pvCan;
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
	if (cana.value) return true;
	let cand = iCan('dev');
	if (cand.value) return true;
	// debug? (hack to switch on when not logged in or for debugging with other users)
	if ((""+window.location).includes("debug=dev")) {
		return true;
	}
	return false;
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
