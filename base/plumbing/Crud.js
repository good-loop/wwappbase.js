/** Add "standard crud functions" to ServerIO and ActionMan */

import _ from 'lodash';
import { assert, assMatch, match } from '../utils/assert';
import C from '../CBase';
import DataStore, { getDataPath, getListPath } from './DataStore';
import DataClass, {getId, getName, getType, nonce} from '../data/DataClass';
import JSend from '../data/JSend';
import Login from '../youagain';
import {encURI, mapkv, parseHash} from '../utils/miscutils';

import ServerIO from './ServerIOBase';
import ActionMan from './ActionManBase';
import {notifyUser} from './Messaging';
import List from '../data/List';
import * as jsonpatch from 'fast-json-patch';
import deepCopy from '../utils/deepCopy';
import KStatus from '../data/KStatus';
import Person from '../data/Person';
import PromiseValue from '../promise-value';
import SearchQuery from '../searchquery';

/**
 * @param {Object} p
 * @param {?Item} p.item Used for preserving local edits during the crud op. Can be null, in which case the item is got from DataStore
 * @param {?Item} p.previous If provided, do a diff based save
 * @param {?KStatus} p.status Usually null
 * @returns PromiseValue(DataItem)
 */
const crud = ({type, id, domain, status, action, item, previous, swallow, localStorage=false}) => {
	if ( ! type) type = getType(item);
	if ( ! id) id = getId(item);
	assMatch(id, String);
	assert(C.TYPES.has(type), type);
	assert(C.CRUDACTION.has(action), "unrecognised action "+action+" for type "+type);
	if ( ! status) status = startStatusForAction(action);
	let localStorageUsed;
	if ( ! item) { 
		item = DataStore.getData({status, type, id});
		// Do we have a fast local answer?
		if ( ! item && localStorage) {
			assert(status===KStatus.PUBLISHED, "Not Supported: localStorage for "+status);		
			const path = DataStore.getDataPath({status, type, id, domain});
			item = localLoad(path);
			localStorageUsed = !! item;
		}
	}
	if ( ! item) {
		// No item? fine for action=delete. Make a transient dummy here
		assert(["delete","get","new","getornew"].includes(action), "no item?! "+action+" "+type+" "+id);
		item = {id, "@type": type};
	}
	if ( ! getId(item)) {
		// item has no ID?! Better fix that
		console.warn("crud() - item without an ID! - setting id to "+id+". Best practice is to set the id property when creating the object.");
		item.id = id;
	}
	if ( ! getType(item)) {
		console.warn("crud() - item without a type! - setting type to "+type+". Best practice is to use `new MyClass()` to set type when creating the object.");
		item['@type'] = type;
	}
	// new item? then change the action
	if (id===C.newId && action==='save') {
		action = 'new';
	}

	// NB: get getornew COULD return fast if the item is in DS. However this is probably handled already in a DataStore.fetch() wrapper

	// mark the widget as saving (defer 'cos this triggers a react redraw, which cant be done inside a render, where we might be)
	_.defer(() => DataStore.setLocalEditsStatus(type, id, C.STATUS.saving));
	
	// const status = serverStatusForAction(action);
	
	// to spot and so preserve edits during the ajax call
	const itemBefore = deepCopy(item);

	// call the server
	const p = SIO_crud(type, item, previous, action, {swallow})
		.then( res => crud2_processResponse({res, item, itemBefore, id, action, type, localStorage, diffSave:!!previous}) )
		.catch(err => {
			// bleurgh
			console.warn(err);
			let msg = JSend.message(err) || 'Error';
			// HACK remove the stacktrace which our servers put in for debug
			msg = msg.replace(/<details>[\s\S]*<\/details>/, "").trim();
			if ( ! swallow) {
				notifyUser(new Error(action+" failed: "+msg));			
				// If it is a 401 - check the login status
				if (err.status && err.status===401) {
					Login.verify().catch(() => {
						notifyUser(new Error("Your login failed - Perhaps your session has expired. Please try logging in again. If that doesn't help, please contact support."));
					});
				}
			}
			// mark the object as error
			DataStore.setLocalEditsStatus(type, id, C.STATUS.saveerror);
			// and log an error relating to it
			DataStore.setValue(errorPath({type, id, action}), msg);
			return err;
		});
	// fast return for get?
	if (localStorageUsed) {
		assert(item);
		return Promise.resolve(item); 
		// NB the server load is still going to run in the background
	}	
	return new PromiseValue(p);
}; // ./crud
ActionMan.crud = crud;


const localSave = (path, person) => {
	if ( ! window.localStorage) return false;
	try {
		let json = JSON.stringify(person);	
		const spath = JSON.stringify(path);
		window.localStorage.setItem(spath, json);
		console.log("localSave of "+path, person? person.id+" "+person.name : "falsy?!");
		return true;
	} catch(err) {
		// eg quota exceeded
		console.error(err);
		return false;
	}
};

/**
 * 
 * @param {!String[]} path
 * @returns {?Item}
 */
const localLoad = path => {
	if ( ! window.localStorage) return null;
	// if (true) return null; // temp nobble for use in testing
	const spath = JSON.stringify(path);
	try {
		let json = window.localStorage.getItem(spath);
		let person = JSON.parse(json);			
		//console.log("localLoad of "+path, person && person.id+" "+person.name, person);
		return person;
	} catch(err) { // paranoia
		// Can this happen??
		console.error(err);
		return null;
	}
};


/**
 * HACK handle Person.claims
 * @param {*} freshItem 
 * @param {*} recentLocalDiffs 
 */
const applyPatch = (freshItem, recentLocalDiffs, item, itemBefore) => {
	// Normal case
	if ( ! Person.isa(freshItem)) {
		jsonpatch.applyPatch(freshItem, recentLocalDiffs);
		return;
	}
	// don't apply diff edits to claims, as this could mangle claims (because: merging by order, not by key)
	recentLocalDiffs = recentLocalDiffs.filter(d => d.path && d.path.substr(0,7) !== "/claims");
	// console.log("applyPatch before",JSON.stringify(freshItem));
	const after = jsonpatch.applyPatch(freshItem, recentLocalDiffs);
	// console.log("applyPatch after",JSON.stringify(freshItem), after);
	// preserve modified local claims
	if ( ! item || ! item.claims) return;
	// Which claims have been edited?
	const oldClaims = (itemBefore && itemBefore.claims) || [];
	let newClaims = item.claims.filter(
		c => ! oldClaims.find(oc => oc.k===c.k && (""+oc.f)===(""+c.f) && oc.v===c.v)
	);
	if ( ! freshItem.claims) freshItem.claims = [];
	// dont dupe server results
	newClaims = newClaims.filter(
		c => ! freshItem.claims.find(oc => oc.k===c.k && (""+oc.f)===(""+c.f) && oc.v===c.v)
	);		
	// OK - keep those edits
	freshItem.claims.push(...newClaims);
	console.log("applyPatch preserve local new claims",JSON.stringify(newClaims), JSON.stringify(freshItem));	
};

/**
 * 
 * @param {Object} p 
 * @returns {?DataClass} Item null on error
 */
const crud2_processResponse = ({res, item, itemBefore, id, action, type, localStorage, diffSave}) => {
	const pubpath = DataStore.getPathForItem(C.KStatus.PUBLISHED, item);
	const draftpath = DataStore.getPathForItem(C.KStatus.DRAFT, item);
	const navtype = (C.navParam4type? C.navParam4type[type] : null) || type;
	
	// Update DS with the returned item, but only if the crud action went OK
	const freshItem = JSend.success(res) && JSend.data(res);

	// ...copy it to allow for edits ??by whom?
	let draftItem = _.cloneDeep(freshItem);

	if (freshItem) {
		// Preserve very recent local edits (which we haven't yet told the server about)
		let recentLocalDiffs = jsonpatch.compare(itemBefore, item);
		if (recentLocalDiffs.length) {
			console.warn("Race condition! Preserving recent local edits", recentLocalDiffs, "before",JSON.stringify(itemBefore), "now",JSON.stringify(item));
			applyPatch(freshItem, recentLocalDiffs, item, itemBefore);
		}

		if (action==='publish') {
			// set local published data
			DataStore.setValue(pubpath, freshItem);
			// update the draft version on a publish or a save - but only if not done by diff!
			// if it's done by diff, the returned published obj will not contain other draft edits and it will get locally overriden
			if (!diffSave) DataStore.setValue(draftpath, draftItem);
		}
		if (action==='save') {	
			// NB: the recent diff handling above should manage the latency issue around setting the draft item
			console.log("post-save update", JSON.stringify(itemBefore), freshItem);
			// HACK to prevent MoneyScript flickering text bug
			if (getType(item)==="PlanDoc" && item) {
				freshItem.sheets = item.sheets;
			}
			DataStore.setValue(draftpath, freshItem);
		}
		// save to local and DS?
		if (localStorage) {
			assert(action==="get", "TODO carefully roll out further");
			localSave(pubpath, freshItem);
			// If we already returned a local save (see crud()), then any surrounding DS.fetch thinks its job is done.
			// So we better set the DS value here too.
			console.log("getProfile - server replacement for "+id);
			DataStore.setValue(pubpath, freshItem);
		}
	}
	// success :)
	if (action==='unpublish') {
		// remove from DataStore
		DataStore.setValue(pubpath, null);
	}
	if (action==='delete') {
		DataStore.setValue(pubpath, null);
		DataStore.setValue(draftpath, null);
		// ??what if we were deleting a different Item than the focal one??
		DataStore.setUrlValue(navtype, null);
	} else if (id===C.newId) {
		// id change!
		// updateFromServer should have stored the new item
		// So just repoint the focus
		const serverId = getId(res.cargo);
		DataStore.setFocus(type, serverId); // deprecated
		DataStore.setUrlValue(navtype, serverId);
	}
	// clear the saving flag
	DataStore.setLocalEditsStatus(type, id, C.STATUS.clean);
	// and any error
	DataStore.setValue(errorPath({type, id, action}), null);
	return freshItem;
};

/**
 * @returns DataStore path for crud errors from this
 */
const errorPath = ({type, id, action}) => {
	return ['transient', type, id, action, 'error'];
};

/**
 * 
 * @param {Object} p
 * @returns PromiseValue(DataItem)
 */
const saveEdits = ({type, id, item, previous, swallow}) => {
	if ( ! type) type = getType(item);
	if ( ! id) id = getId(item);
	assMatch(id, String);
	return crud({type, id, action: 'save', item, previous, swallow});
};
ActionMan.saveEdits = saveEdits;

/**
 * AKA copy!
 * 
 * This will modify the ID to a new nonce()!
 * @param {Object} p
 * @param {?String} p.id DEPRECATED use oldId
 * @param {!String} p.oldId The item which is being copied
 * @param {?Function} p.onChange {Function: newItem => ()} Use this to e.g. change the url
 * @returns PromiseValue(DataItem) 
 */
 const saveAs = ({type, id, oldId, item, onChange}) => {
	oldId = id = (oldId || id); // bridge to old code
	if ( ! item) item = DataStore.getData({status:KStatus.DRAFT, type, id:oldId});
	if ( ! item) item = DataStore.getData({status:KStatus.PUBLISHED, type, id:oldId});
	assert(item, "Crud.js no item "+type+" "+oldId);	
	if ( ! oldId) oldId = getId(item);
	// deep copy
	let newItem = JSON.parse(JSON.stringify(item));
	newItem.status = C.KStatus.DRAFT; // ensure its a draft 
	// parentage
	newItem.parent = oldId;
	// modify
	const newId = nonce();	
	newItem.id = newId;
	if (newItem.name) {
		// make a probably unique name - use randomness TODO nicer
		newItem.name += ' v_'+nonce(3);
	}
	// set created time to now
	if (newItem.created) {
		const now = new Date();
		// take care with types
		if (typeof(newItem.created)==="string") {
			newItem.created = now.toISOString();
		} else if (match(newItem.created, Date)) {
			newItem.created = now;
		} else {
			console.warn("saveAs - Cannot adjust created", newItem.created);
		}
	}

	// save local
	DataStore.setData(C.KStatus.DRAFT, newItem);
	// save server
	let pv = crud({type, id:newId, action:'copy', item:newItem});
	pv.promise.then(x => {
		DataStore.invalidateList(type); // ?? this may be a bit jumpy
	});
	// modify e.g. url
	if (onChange) onChange(newItem);
	return pv;
};
ActionMan.saveAs = saveAs;

/**
 * 
 * @returns PromiseValue(DataItem)
 */
const unpublish = ({type, id}) => {	
	assMatch(type, String);
	assMatch(id, String, "Crud.js no id to unpublish "+type);	
	// TODO optimistic list mod
	// preCrudListMod({type, id, action:'unpublish'});
	// call the server
	return crud({type, id, action:'unpublish'})
		.promise.catch(err => {
			// invalidate any cached list of this type
			DataStore.invalidateList(type);
			return err;
		}); // ./then	
};
ActionMan.unpublish = (type, id) => unpublish({type,id});


/**
 * This will save and publish
 * @param {Object} p
 * @param {!string} p.type 
 * @param {!string} p.id 
 * @param {?DataClass} p.item 
 * @returns PromiseValue(DataClass)
 */
export const publish = ({type,id,item,previous,swallow}) => {
	if ( ! type) type = getType(item);
	if ( ! id) id = getId(item);
	assMatch(type, String);
	assMatch(id, String, "Crud.js no id to publish to "+type);
	// if no item - well its the draft we publish
	if ( ! item) {
		item = DataStore.getData({status:C.KStatus.DRAFT, type, id});
	}
	assert(item, "Crud.js no item to publish "+type+" "+id);

	// optimistic list mod
	preCrudListMod({type, id, item, action: 'publish'});
	// call the server
	return crud({type, id, action: 'publish', item, previous, swallow})
		.promise.catch(err => {
			// invalidate any cached list of this type
			DataStore.invalidateList(type);
			return err;
		}); // ./then
};

/**
 * @deprecated Use publish() which has named inputs
 * This will save and publish
 * @param {!string} type 
 * @param {!string} id 
 * @param {?Item} item 
 */
const publishEdits = (type, id, item, previous) => {
	return publish({type, id, item, previous});
};
ActionMan.publishEdits = publishEdits;

const preCrudListMod = ({type, id, item, action}) => {
	assert(type && (item || id) && action);
	
	// TODO Update draft list??
	// TODO invalidate any (other) cached list of this type (eg filtered lists may now be out of date)
	// Optimistic: add to the published list (if there is one - but dont make one as that could confuse things)
	if (C.CRUDACTION.ispublish(action)) {
		[C.KStatus.PUBLISHED, C.KStatus.ALL_BAR_TRASH].forEach(status => {
			const path = getListPath({type, status});
			const list = DataStore.getValue(path);
			if (!list) return;
			List.remove(item, list); // No duplicates - remove any existing copy of the item
			List.add(item, list, 0);
			DataStore.setValue(path, list);
		});
		return;
	}

	// delete => optimistic remove
	if (C.CRUDACTION.isdelete(action)) {
		if ( ! item) item = {type, id};
		[C.KStatus.PUBLISHED, C.KStatus.DRAFT, C.KStatus.ALL_BAR_TRASH].forEach(status => {
			// NB: see getListPath for format, which is [list, type, status, domain, query, sort]
			let domainQuerySortList = DataStore.getValue('list', type, status); 
			let cnt = recursivePruneFromTreeOfLists(item, domainQuerySortList);
			console.log("Removed", cnt, item);
		});
		DataStore.update();
	} // ./action=delete

	if (action === 'archive') {
		const path = getListPath({type, status: 'ARCHIVED'});
		const list = DataStore.getValue(path);
		if (!list) return;
		List.add(item, list, 0);
		DataStore.setValue(path, list);
	}
};

/**
 * @param {!Object} treeOfLists Must have no cycles!
 * @returns {Number} removals made
 */
const recursivePruneFromTreeOfLists = (item, treeOfLists) => {
	let cnt = 0;
	if ( ! treeOfLists) return;
	mapkv(treeOfLists, (k, kid) => {
		if ( ! kid) return;
		if (List.isa(kid)) {
			const rm = List.remove(item, kid);
			if (rm) cnt++;
		} else {
			cnt += recursivePruneFromTreeOfLists(item, kid);
		}
	});
	return cnt;
};

ActionMan.discardEdits = (type, id) => {
	return crud({type, id, action:C.CRUDACTION.discardEdits});	
};

/**
 * 
 * @param {*} type 
 * @param {*} pubId 
 * @returns {!PromiseValue}
 */
ActionMan.delete = (type, pubId) => {
	// optimistic list mod
	preCrudListMod({type, id:pubId, action:'delete'});
	// ?? put a safety check in here??
	const pv = crud({type, id:pubId, action:'delete'});
	return PromiseValue.then(pv, e => {
		console.warn("deleted!", type, pubId, e);
		// remove the local versions
		DataStore.setValue(getDataPath({status: C.KStatus.PUBLISHED, type, id: pubId}), null);
		DataStore.setValue(getDataPath({status: C.KStatus.DRAFT, type, id: pubId}), null);
		// invalidate any cached list of this type
		DataStore.invalidateList(type);
		return e;
	});
};

/**
 * Archive this item
 * @returns PromiseValue(DataItem)
 */
// ?? should we put a confirm in here, and in delete()? But what if we are doing a batch operation?
// -- let's not -- but be sure to put it in calling functions
ActionMan.archive = ({type, item}) => {	
	// optimistic list mod
	preCrudListMod({type, item, action: 'archive'});
	return crud({ type, item, action: C.CRUDACTION.archive });
};

// ServerIO //

/**
 * What status is the data in at the start of this action.
 * e.g. publish starts with a draft
 */
const startStatusForAction = (action) => {
	switch(action) {
		case C.CRUDACTION.publish:
		case C.CRUDACTION.save:
		case C.CRUDACTION.copy:
		case C.CRUDACTION.discardEdits:
		case C.CRUDACTION.unpublish: // is this OK?? It could be applied to either
		case C.CRUDACTION.delete: // this one shouldn't matter
			return C.KStatus.DRAFT;
		case C.CRUDACTION.export:
		case C.CRUDACTION.getornew:
		case C.CRUDACTION.get: // get="get the published version"
			return C.KStatus.PUBLISHED;
	}
	throw new Error("TODO startStatusForAction "+action);
};
/**
 * What status do we send to the server? e.g. publish is published, save is draft.
 */
const serverStatusForAction = (action) => {
	switch(action) {
		case C.CRUDACTION.copy:
		case C.CRUDACTION.save:
		case C.CRUDACTION.discardEdits:
		case C.CRUDACTION.delete: // this one shouldn't matter
			return C.KStatus.DRAFT;
		case C.CRUDACTION.publish:
		case C.CRUDACTION.export:
		case C.CRUDACTION.get: // get="get the published version"
			return C.KStatus.PUBLISHED;
		case C.CRUDACTION.unpublish:
			return C.KStatus.DRAFT;
		case C.CRUDACTION.archive:
			return C.KStatus.ARCHIVED;
	}
	throw new Error("TODO serverStatusForAction "+action);
};

/**
 * ServerIO (ie this does not use our client side datastore) crud call 
 * @param {Object} p
 * @param {!string} type 
 * @param {Item} item 
 * @param {?Item} previous Optional pre-edit version of item. If supplied, a diff will be sent instead of the full item.
 * @param {!string} action 
 * @param {?Object} p.params
 * @param {?Boolean} p.params.swallow
 * @returns {Promise} from ServerIO.load()
 */
const SIO_crud = function(type, item, previous, action, params={}) {	
	assert(C.TYPES.has(type), type);
	assert(item && getId(item), item);
	assert(C.CRUDACTION.has(action), type);
	const status = serverStatusForAction(action);
	const data = {
		action,
		status,
		type, // hm: is this needed?? the stype endpoint should have it		
	};
	// NB: don't send data for get
	if (action!==C.CRUDACTION.get) {
		// diff?
		if (previous) {
			let diff = jsonDiff(previous, item);
			// no edits and action=save? skip save
			if ( ! diff.length && action==='save') {
				console.log("crud", "skip no-diff save", item, previous);
				const jsend = new JSend();
				return Promise.resolve(jsend); // ?? is this the right thing to return
			}
			data.diff = JSON.stringify(diff);
		} else {
			data.item = JSON.stringify(item);
		}
	}
	params.method = 'POST';
	params.data = data;
	
	if (action==='new') {
		params.data.name = item.name; // pass on the name so server can pick a nice id if action=new
	}
	// HACK dont upset the server's anti-ddos defence
	if (C.CRUDACTION.isget(action)) {
		params.method = 'GET';
		delete params.data.action;	
	}

	// NB: load() includes handle messages
	let id = getId(item);
	let url = ServerIO.getUrlForItem({type, id, status});
	console.log("crud", params);
	return ServerIO.load(url, params);
	// NB: our data processing is then done in crud2_processResponse()
};
// debug hack
window.SIO_crud = SIO_crud;

/**
 * Wrap jsonpatch and clean-up null handling
 * @param {*} previous 
 * @param {*} item 
 * @returns JsonPatchOp[]
 */
export const jsonDiff = (previous, item) => {
	let diff = jsonpatch.compare(previous, item);
	// remove add-null, as the server ignores it
	diff = diff.filter(op => ! (op.op==="add" && op.value===null));
	return diff;
};

ServerIO.saveEdits = function(type, item, previous) {
	return SIO_crud(type, item, previous, 'save');
};
const SIO_publishEdits = function(type, item, previous) {
	return SIO_crud(type, item, previous, 'publish');
};
ServerIO.discardEdits = function(type, item, previous) {
	return SIO_crud(type, item, previous, C.CRUDACTION.discardEdits);
};
ServerIO.archive = function(type, item, previous) {
	return SIO_crud(type, item, previous, 'archive');
};

/**
 * get an item from the backend -- does not save it into DataStore
 * @param {?Boolean} swallow
 */
// NB: Does not use `crud()` (yet!) as this manages status.
const SIO_getDataItem = function({type, id, status, domain, swallow, ...other}) {
	assert(C.TYPES.has(type), 'Crud.js - ServerIO - bad type: '+type);
	if ( ! status) {
		console.warn("Crud.js - SIO_getDataItem: no status - this is unwise! Editor pages should specify DRAFT. type: "+type+" id: "+id);
	}
	assMatch(id, String);
	const params = {data: other, swallow};
	let url = ServerIO.getUrlForItem({type, id, domain, status});
	return ServerIO.load(url, params);
};


/**
 * get an item from DataStore, or call the backend if not there (and save it into DataStore)
 * @param {Object} p
 * @param {!String} p.type From C.TYPES
 * @param {!String} p.id 
 * @param {?KStatus} p.status If in doubt: use PUBLISHED for display, and DRAFT for editors. default: check url, then use PUBLISHED
 * 	Default: look for a status= parameter in thre url, or use published.
 * @param {?string} p.action e.g. `getornew`
 * @param {?boolean} p.swallow If true, hide error messages from the server
 * @returns PromiseValue(type)
 */
// * NB: Does not use `crud()` (yet!) as this manages status.
const getDataItem = ({type, id, status, domain, swallow, action, ...other}) => {
	assert(id!=='unset', "ActionMan.getDataItem() "+type+" id:unset?!");
	assert(C.TYPES.has(type), 'Crud.js - ActionMan - bad type: '+type);
	assMatch(id, String);
	if ( ! status) status = DataStore.getUrlValue('status') || KStatus.PUBLISHED;
	assert(KStatus.has(status), 'Crud.js - ActionMan - bad status '+status+" for get "+type);
	let path = DataStore.getDataPath({status, type, id, domain});
	return DataStore.fetch(path, () => {
		return SIO_getDataItem({type, id, status, domain, swallow, action, ...other});
	});
};
ActionMan.getDataItem = getDataItem;

/**
 * Smooth update: Get an update from the server without null-ing out the local copy.
 */
ActionMan.refreshDataItem = ({type, id, status, domain, ...other}) => {
	console.log("refreshing...", status, type, id);
	assert(C.KStatus.has(status), "Crud.js bad status "+status);
	assert(C.TYPES.has(type), 'Crud.js - ActionMan refreshDataItem - bad type: '+type);
	assMatch(id, String);
	return SIO_getDataItem({type, id, status, domain, ...other})
		.then(res => {
			let item = null;
			if (res.success) {
				console.log("refreshed", type, id);
				item = res.cargo;
				DataStore.setData({status, type, id, item});
			} else {
				console.warn("refresh-failed", res, type, id);
			}
			return item;
		});
};


/* How many IDs can be requested from _list at a time before we break the request down? (/
const MAX_ID_LIST_LENGTH = 100;
/* How many items should we ask for at a time in a multi-request list-by-query? */
const PAGINATION_LENGTH = 1000;
/* Safety backstop - don't batch up requests for more than 5000 items.
TODO ListLoad will need to be smarter about fetching, and CrudServlet will need to be be more precise about total results. */
const MAX_COLLECTED_LIST = 5000;

/**
 * Get a list of CRUD objects from the server
 * 
 * @param {Object} p 
 * @param {?} p.type C.TYPES
 * @param {?} p.status KStatus
 * @param {?String|SearchQuery} p.q search query string
 * @param {?String[]} p.ids Convenience for a common use-case: batch fetching a set of IDs
 * @param {?String} p.sort e.g. "start-desc"
 * @param {?string|Date} p.start Add a time-filter. Usually unset.
 * @param {?string|Date} p.end Add a time-filter. Usually unset.
 * @returns PromiseValue<{hits: Object[]}>
 * 
 * WARNING: This should usually be run through DataStore.resolveDataList() before using
 * Namespace anything fetched from a non-default domain
 * 
 * @see DataStore.invalidateList()
 */
 const getDataList = ({type, status, q, prefix, ids, start, end, size, sort, domain, ...other}) => {
	assert(C.TYPES.has(type), type);
	if (domain) console.warn("Who uses domain?",domain); // HACK is this used and how?? document it when found	
	if (ids && ids.length) {
		// Long list of IDs? Break it down into pages.
		if (ids.length > MAX_ID_LIST_LENGTH) return getDataListPagedIds(...arguments);
		q = SearchQuery.setPropOr(q, "id", ids).query;
	}
	if (SearchQuery.isa(q)) {
		q = q.query;
	}
	if (q) assMatch(q, String); // NB: q should not be a SearchQuery for the functions below
	const lpath = getListPath({type,status,q,prefix,start,end,size,sort,domain, ...other});

	const pv = DataStore.fetch(lpath, () => {
		const listParams = {type, status, q, prefix, start, end, size, sort, domain, ...other};
		const listPromise = ServerIO.list(listParams);
		return listPromise.then(res => {
			// Check that the server has returned all available results - if not, make additional requests.
			// No pagination to resolve? Just return the result.
			if (!res || (res.cargo.hits.length >= res.cargo.total)) return res;
			// OK, load all subsequent pages - up to the safety max.
			let fromIndex = res.cargo.hits.length;
			const pagePromises = [listPromise];
			while (fromIndex < Math.min(res.cargo.total, MAX_COLLECTED_LIST)) {
				pagePromises.push(ServerIO.list({...listParams, from: fromIndex}));
				fromIndex += PAGINATION_LENGTH;
			}
			// Let original promise resolve once all requests are complete.
			return collectListPromises(pagePromises);
		});
	});
	// console.log("ActionMan.list", q, prefix, pv);
	return pv;
};

ActionMan.list = getDataList;


/** Get a long list of CRUDable objects from the server by ID - to dodge URL length limitations. */
const getDataListPagedIds = ({ids, ...params}) => {
	const idsBatched = ids.slice(); // splice below is in-place, so copy before modify
	const promises = [];

	// Pull out blocks of 100 ids at a time to fetch, and hold the promise for each request
	while (idsBatched.length) {
		promises.push(getDataList({...params, ids: ids.splice(0, MAX_ID_LIST_LENGTH)})).promise;
	}

	// When all requests have resolved, collect their responses together & resolve the PV.
	return new PromiseValue(collectPromises(promises));
};


/** Synthesises a larger list response promise from a collection of paged ones. */
const collectListPromises = promises => Promise.all(promises).then(results => {
	return results.reduce((acc, res) => {
		if (acc === null) return res;
		acc.cargo.hits.push(...res.cargo.hits);
		acc.errors.push(...res.errors);
		acc.messages.push(...res.messages);
		acc.success = acc.success && res.success;
		return acc;
	}, null);
});


/**
 * @param {?Object} p.other Optional extra parameters which will be sent as url parameters in data. Usually unset.
 * @returns promise(List) 
 * List has form {hits: Object[], total: Number} -- see List.js
 */
ServerIO.list = ({type, status, q, prefix, start, end, size, sort, domain = '', ...other}) => {
	assert(C.TYPES.has(type), 'Crud.js - ServerIO.list - bad type:' +type);
	assert( ! other.query, "Use q not query");
	let servlet = ServerIO.getEndpointForType(type);
	assert(C.KStatus.has(status), 'Crud.js - ServerIO.list - bad status: '+status);

	let url = domain + servlet 
		+ (ServerIO.dataspace && type!=='NGO'? '/'+ServerIO.dataspace : '')	// HACK: no dataspace for SoGive
		+ '/_list.json';
	// HACK repoint a relative url?
	if (ServerIO.APIBASE && url[0] === '/') {
		url = ServerIO.APIBASE + url;
	}
	let params = {
		data: {status, q, start, end, prefix, sort, size, ...other},
		method: 'POST'
	};
	// HACK: sogive? include unlisted charities (which sogive itself filters by default)
	if (url.includes("sogive.org/charity")) {
		params.data.unlisted=true;
	}
	const p = ServerIO.load(url, params);
	return p;
};

/**
 * The id from a /servlet/id# RESTful url. 
 * Assumes: the last segment is the id.
 * @returns {?string}
 */
const restId = () => {
	let {path, params} = parseHash();
	if (path.length < 2) return null;
	if (path.length > 2) {
		console.warn("restId() - unusually long rest path: "+path);
	}
	return path[1];
};
/**
 * The id and dataspace from a /servlet/dataspace/id# RESTful url. 
 * @returns {id, dataspace}
 */
const restIdDataspace = () => {
	let {path, params} = parseHash();
	if (path.length < 2) return {};
	const dataspace = path[1];
	const id = path[2];
	return {id, dataspace};
};

/**
 * 
 * @param {DataItem|String} item 
 */
const setWindowTitle = item => {
	let title = C.app.name;
	if (item) {
		title = _.isString(item)? item 
			: getType(item)+": "+(getName(item) || getId(item));
	}
	window.document.title = title;
};


const CRUD = {
};
export default CRUD;
export {
	crud,
	saveAs,
	saveEdits,
	publishEdits,
	errorPath,
	getDataItem,
	getDataList,
	restId,
	restIdDataspace,
	setWindowTitle,

	localSave, // can be used externally
	localLoad // for debug only
};
