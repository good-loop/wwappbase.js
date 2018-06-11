import React from 'react';
import ReactDOM from 'react-dom';

import SJTest, { assert, assMatch } from 'sjtest';
import Login from 'you-again';
import printer from '../utils/printer.js';
import {modifyHash} from 'wwutils';
import C from '../CBase';
import Roles from '../Roles';
import Misc from './Misc';
import DataStore, { getPath } from '../plumbing/DataStore';
import ServerIO from '../plumbing/ServerIOBase';
import ActionMan from '../plumbing/ActionManBase';
import {getType, getId, nonce} from '../data/DataClass';

/**
 * Provide a list of items of a given type.
 * Clicking on an item sets it as the nav value.
 * Get the item id via:
 * 
 * 	const path = DataStore.getValue(['location','path']);
 * 	const itemId = path[1];
 *  let pvItem = itemId? ActionMan.getDataItem(itemId) : null;
 * 
 * 
 * @param status {?String} e.g. "Draft"
 * @param servlet {?String} e.g. "publisher" Normally unset, and taken from the url.
 * @param ListItem {?React component} if set, replaces DefaultListItem
 */
const ListLoad = ({type, status, servlet, navpage, q, ListItem, checkboxes}) => {
	assert(C.TYPES.has(type), "ListLoad - odd type " + type);
	if ( ! status) {
		console.error("ListLoad no status :( defaulting to ALL_BAR_TRASH", type);
		status = C.KStatus.ALL_BAR_TRASH;
	}
	assert(C.KStatus.has(status), "ListLoad - odd status " + status);
	let path = DataStore.getValue(['location', 'path']);
	let id = path[1];
	if (id) return null;
	if ( ! servlet) servlet = DataStore.getValue('location', 'path')[0]; //type.toLowerCase();
	if ( ! navpage) navpage = servlet;
	if ( ! servlet) {
		console.warn("ListLoad - no servlet? type="+type);
		return null;
	}
	assMatch(servlet, String);
	assMatch(navpage, String);
	// store the lists in a separate bit of appstate
	// from data. 
	// Downside: new events dont get auto-added to lists
	// Upside: clearer
	let pvItems = ActionMan.list({type, status, q});
	if ( ! pvItems.resolved) {
		return (
			<Misc.Loading text={type.toLowerCase() + 's'} />
		);
	}
	if ( ! ListItem) {
		ListItem = DefaultListItem;
	}
	// make the list items	
	const listItems = pvItems.value.map( (item, i) => (
		<ListItem key={i}
			type={type} 
			servlet={servlet} 
			navpage={navpage} 
			item={item} 
			onPick={onPick} 
			checkboxes={checkboxes} />)
	);
	return (<div>
		{pvItems.value.length === 0 ? 'No results found' : null}
		{listItems}
	</div>);
};

const onPick = ({event, navpage, id}) => {
	if (event) {
		event.stopPropagation();
		event.preventDefault();
	}
	modifyHash([navpage, id]);
};

/**
 * These can be clicked or control-clicked :(
 */
const DefaultListItem = ({type, servlet, navpage, item, checkboxes}) => {
	if ( ! navpage) navpage = servlet;
	const id = getId(item);
	const itemUrl = modifyHash([servlet, id], null, true);
	let checkedPath = ['widget', 'ListLoad', type, 'checked'];
	return (
		<div className='ListItemWrapper'>
			{checkboxes? <div className='pull-left'><Misc.PropControl title='TODO mass actions' path={checkedPath} type='checkbox' prop={id} /></div> : null}
			<a href={itemUrl}
				onClick={event => onPick({ event, navpage, id })}
				className={'ListItem btn btn-default status-'+item.status}
			>
				<Misc.Thumbnail item={item} />
				{item.name || id}<br/>
				<small>id: {id} {C.KStatus.isPUBLISHED(item.status)? null : item.status}</small>				
			</a>
		</div>
	);
};

/**
 * Make a local blank, and set the nav url
 * Does not save (Crud will probably do that once you make an edit)
 * @param {
 * 	base: {?Object} use to make the blank.
 * 	make: {?Function} use to make the blank. base -> base
 * }
 */
const createBlank = ({type, navpage, base, make}) => {
	assert( ! getId(base), "ListLoad - createBlank - no ID (could be an object reuse bug) "+type);
	// Call the make?
	if (make) {
		base = make(base);
	}
	if ( ! base) base = {};
	// make an id?
	if ( ! getId(base)) {
		let id = nonce(8);
		base.id = id;
	}
	const id = getId(base);
	if ( ! getType(base)) base['@type'] = type;
	// poke a new blank into DataStore
	const path = getPath(C.KStatus.DRAFT, type, id);
	DataStore.setValue(path, base);
	// set the id
	onPick({navpage, id});
	// invalidate lists
	DataStore.invalidateList(type);
};

const CreateButton = ({type, navpage, base, make}) => {
	if ( ! navpage) navpage = DataStore.getValue('location', 'path')[0];
	return (
		<button className='btn btn-default' onClick={() => createBlank({type,navpage,base,make})}>
			<Misc.Icon glyph='plus' /> Create
		</button>
	);
};

export {CreateButton};
export default ListLoad;
