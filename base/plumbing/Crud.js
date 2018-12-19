/** Add "standard crud functions" to ServerIO and ActionMan */

import _ from 'lodash';
import $ from 'jquery';
import {SJTest, assert, assMatch} from 'sjtest';
import C from '../CBase';
import DataStore, {getPath} from './DataStore';
import {getId, getType} from '../data/DataClass';
import JSend from '../data/JSend';
import Login from 'you-again';
import {XId, encURI, mapkv} from 'wwutils';

import ServerIO from './ServerIOBase';
import ActionMan from './ActionManBase';
import {notifyUser} from './Messaging';
import List from '../data/List';

/**
 * @param item {DataItem} can be null, in which case the item is got from DataStore
 * @returns Promise
 */
ActionMan.crud = (type, id, action, item) => {
	if ( ! type) type = getType(item);
	if ( ! id) id = getId(item);
	assMatch(id, String);
	assert(C.TYPES.has(type), type);
	assert(C.CRUDACTION.has(action), type);
	if ( ! item) { 
		let status = startStatusForAction(action);
		item = DataStore.getData(status, type, id);
	}
	if ( ! item) {
		// No item? fine for action=delete. Make a transient dummy here
		assert(action==='delete', action+" "+type+" "+id);
		item = {id, "@type": type};
	}
	if ( ! getId(item)) {
		assert(id==='new', id);
		item.id = id;
	}
	// new item? then change the action
	if (id===C.newId && action==='save') {
		action = 'new';
	}
	// mark the widget as saving
	DataStore.setLocalEditsStatus(type, id, C.STATUS.saving);
	const status = serverStatusForAction(action);
	// call the server
	return ServerIO.crud(type, item, action)
		.then(res => {
			// update
			let hits = DataStore.updateFromServer(res, status)
			if (action==='publish') { // } && DataStore.getData(C.KStatus.DRAFT, type, id)) {
				// also update the draft version
				const pubpath = DataStore.getPathForItem(status, item);
				const draftpath = DataStore.getPathForItem(C.KStatus.DRAFT, item);
				let pubItem = DataStore.getValue(pubpath);
				// copy it
				let draftItem = _.cloneDeep(pubItem);
				DataStore.setValue(draftpath, draftItem);
			}
			// success :)
			const navtype = (C.navParam4type? C.navParam4type[type] : null) || type;
			if (action==='delete') {
				DataStore.setUrlValue(navtype, null);
			} else if (id===C.newId) {
				// id change!
				// updateFromServer should have stored the new item
				// So just repoint the focus
				let serverId = getId(res.cargo);
				DataStore.setFocus(type, serverId); // deprecated			
				DataStore.setUrlValue(navtype, serverId);
			}
			// clear the saving flag
			DataStore.setLocalEditsStatus(type, id, C.STATUS.clean);
			// and any error
			DataStore.setValue(errorPath({type, id, action}), null);
			return res;
		})
		.catch(err => {
			// bleurgh
			console.warn(err);
			let msg = JSend.message(err) || 'Error';
			// HACK remove the stacktrace which our servers put in for debug
			msg = msg.replace(/<details>[\s\S]*<\/details>/, "").trim();
			notifyUser(new Error(action+" failed: "+msg));
			// mark the object as dirty
			DataStore.setLocalEditsStatus(type, id, C.STATUS.dirty);
			// and log an error relating to it
			DataStore.setValue(errorPath({type, id, action}), msg);
			return err;
		});
}; // ./crud

/**
 * @returns DataStore path for crud errors from this
 */
const errorPath = ({type, id, action}) => {
	return ['transient', type, id, action, 'error'];
};

ActionMan.saveEdits = (type, pubId, item) => {
	return ActionMan.crud(type, pubId, 'save', item);
};

ActionMan.publishEdits = (type, pubId, item) => {	
	assMatch(type, String);
	assMatch(pubId, String, "Crud.js no id to publish to "+type);	
	// if no item - well its the draft we publish
	if ( ! item) item = DataStore.getData(C.KStatus.DRAFT, type, pubId);
	assert(item, "Crud.js no item to publish "+type+" "+pubId);

	// optimistic list mod
	preCrudListMod({type, item, action:'publish'});
	// call the server
	return ActionMan.crud(type, pubId, 'publish', item)
		.catch(err => {
			// invalidate any cached list of this type
			DataStore.invalidateList(type);
			return err;
		}); // ./then	
};

const preCrudListMod = ({type, id, item, action}) => {
	assert(type && (item || id) && action);
	const pathPublished = listPath({type, status:C.KStatus.PUBLISHED});
	const pathAllBarTrash = listPath({type, status:C.KStatus.ALL_BAR_TRASH});
	const listPublished = DataStore.getValue(pathPublished);
	const listAllBarTrash = DataStore.getValue(pathAllBarTrash);
	// TODO draft list??
	// TODO invalidate any (other) cached list of this type (eg filtered lists may now be out of date)	
	// Optimistic: add to the published list (if there is one - but dont make one as that could confuse things)
	if (C.CRUDACTION.ispublish(action)) {		
		if (listPublished) {
			List.add(item, listPublished, 0);
			DataStore.setValue(pathPublished, listPublished);
		}
		if (listAllBarTrash) {
			List.add(item, listAllBarTrash, 0);	
			DataStore.setValue(pathAllBarTrash, listAllBarTrash);	
		}
		return;
	}
	// delete => optimistic remove
	if (C.CRUDACTION.isdelete(action)) {		
		if ( ! item) item = {type, id};
		[C.KStatus.PUBLISHED, C.KStatus.ALL_BAR_TRASH].forEach(status => {
			let listForQ = DataStore.getValue('list', type, status);		
			if ( ! listForQ) return;
			mapkv(listForQ, (k,v) => {
				let fnd = List.remove(item, v);
				if (fnd) DataStore.setValue(['list',type,status,k], v);
			});	
		});
	} // ./action=delete
};

ActionMan.discardEdits = (type, pubId) => {
	return ActionMan.crud(type, pubId, C.CRUDACTION.discardEdits);	
};

/**
 * 
 * @param {*} type 
 * @param {*} pubId 
 */
ActionMan.delete = (type, pubId) => {
	// optimistic list mod
	preCrudListMod({type, id:pubId, action:'delete'});
	// ?? put a safety check in here??
	return ActionMan.crud(type, pubId, 'delete')
		.then(e => {
			console.warn("deleted!", type, pubId, e);
			// remove the local versions			
			DataStore.setValue(getPath(C.KStatus.PUBLISHED, type, pubId), null);
			DataStore.setValue(getPath(C.KStatus.DRAFT, type, pubId), null);
			// invalidate any cached list of this type
			DataStore.invalidateList(type);
			return e;
		});
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
		case C.CRUDACTION.discardEdits: 
		case C.CRUDACTION.delete: // this one shouldn't matter
			return C.KStatus.DRAFT;
	}
	throw new Error("TODO startStatusForAction "+action);
};
/**
 * What status do we send to the server? e.g. publish is published, save is draft.
 */
const serverStatusForAction = (action) => {
	switch(action) {
		case C.CRUDACTION.save: 
		case C.CRUDACTION.discardEdits: 
		case C.CRUDACTION.delete: // this one shouldn't matter
			return C.KStatus.DRAFT;
		case C.CRUDACTION.publish: 
			return C.KStatus.PUBLISHED;
	}
	throw new Error("TODO serverStatusForAction "+action);
};

ServerIO.crud = function(type, item, action) {	
	assert(C.TYPES.has(type), type);
	assert(item && getId(item), item);
	assert(C.CRUDACTION.has(action), type);
	const status = serverStatusForAction(action);
	let params = {
		method: 'POST',
		data: {
			action,
			status,
			type,
			item: JSON.stringify(item)
		}
	};		
	if (action==='new') {
		params.data.name = item.name; // pass on the name so server can pick a nice id if action=new
	}
	let stype = ServerIO.getEndpointForType(type);
	// NB: load() includes handle messages
	return ServerIO.load(stype+'/'+encURI(getId(item))+'.json', params);
};
ServerIO.saveEdits = function(type, item) {
	return ServerIO.crud(type, item, 'save');
};
ServerIO.publishEdits = function(type, item) {
	return ServerIO.crud(type, item, 'publish');
};
ServerIO.discardEdits = function(type, item) {
	return ServerIO.crud(type, item, C.CRUDACTION.discardEdits);
};

/**
 * get an item from the backend -- does not save it into DataStore
 */
ServerIO.getDataItem = function({type, id, status, domain, swallow, ...other}) {
	assert(C.TYPES.has(type), 'Crud.js - ServerIO - bad type: '+type);
	if ( ! status) {
		console.warn("Crud.js - ServerIO.getDataItem: no status - this is unwise! Editor pages should specify DRAFT. type: "+type+" id: "+id);
	}
	assMatch(id, String);
	const params = {data: {status, ...other}, swallow};
	let url = ServerIO.getUrlForItem({type, id, domain, status});
	return ServerIO.load(url, params);
};


/**
 * get an item from DataStore, or call the backend if not there (and save it into DataStore)
 * @param type {!String} From C.TYPES
 * @param status {!String} From C.KStatus. If in doubt: use PUBLISHED for display, and DRAFT for editors.
 * @returns PromiseValue
 */
ActionMan.getDataItem = ({type, id, status, domain, swallow, ...other}) => {
	assert(id!=='unset', "ActionMan.getDataItem() "+type+" id:unset?!");
	assert(C.TYPES.has(type), 'Crud.js - ActionMan - bad type: '+type);
	assMatch(id, String);
	assert(C.KStatus.has(status), 'Crud.js - ActionMan - bad status '+status+" for get "+type);
	// TODO Decide if getPath should take object argument
	let path = DataStore.getPath(status, type, id, domain);
	return DataStore.fetch(path, () => {
		return ServerIO.getDataItem({type, id, status, domain, swallow, ...other});
	}, ! swallow);
};

/**
 * Smooth update: Get an update from the server without null-ing out the local copy.
 */
ActionMan.refreshDataItem = ({type, id, status, domain, ...other}) => {
	console.log("refreshing...", status, type, id);
	assert(C.KStatus.has(status), "Crud.js bad status "+status);
	assert(C.TYPES.has(type), 'Crud.js - ActionMan refreshDataItem - bad type: '+type);
	assMatch(id, String);
	return ServerIO.getDataItem({type, id, status, domain, ...other})
		.then(res => {
			if (res.success) {
				console.log("refreshed", type, id);
				let item = res.cargo;
				DataStore.setData(status, item);				
			} else {
				console.warn("refresh-failed", res, type, id);
			}
		});
};

/**
 * DataStore path for list
 * @param {?String} q Optional query
 */
const listPath = ({type,status,q}) => ['list', type, status, q || 'all'];

/**
 * 
 * @returns PV( {hits: Object[]} )
 */
// Namespace anything fetched from a non-default domain
ActionMan.list = ({type, status, q, domain}) => {
	
	assert(C.TYPES.has(type), type);
	let lpath = [];
	if (domain) {
		lpath = ['list', domain, type, status, q || 'all']
	}
	else{
		lpath = ['list', type, status, q || 'all'];
	}
	return DataStore.fetch(lpath, () => {
		return ServerIO.list({type, status, q, domain});
	});
};

/*
 {
	 vert: {
		 ...adverts
	 }
	 portal.good-loop.com: {verty}
 }
*/

/**
 * 
 * @returns promise(List) 
 * List has form {hits: Object[], total: Number} -- see List.js
 */
ServerIO.list = ({type, status, q, domain = ''}) => {
	assert(C.TYPES.has(type), type);
	let servlet = ServerIO.getEndpointForType(type);
	assert(C.KStatus.has(status), status);
	// NB '/_list' used to be '/list' until July 2018
	let url = domain + servlet 
		+ (ServerIO.dataspace? '/'+ServerIO.dataspace : '')
		+ '/_list.json';
	let params = {
		data: {status, q}
	};	
	return ServerIO.load(url, params)
		.then(res => { 	// sanity check
			if (JSend.success(res)) {
				List.assIsa(JSend.data(res), "Not a List "+url);
			}
			return res;
		});
};


const CRUD = {	
};
export default CRUD;
export {
	errorPath
}
