import React from 'react';
import ReactDOM from 'react-dom';

import SJTest, { assert, assMatch } from 'sjtest';
import Login from 'you-again';
import printer from '../utils/printer.js';
import {modifyHash, join} from 'wwutils';
import C from '../CBase';
import Roles from '../Roles';
import Misc from './Misc';
import PropControl from './PropControl';
import DataStore, { getPath } from '../plumbing/DataStore';
import ServerIO from '../plumbing/ServerIOBase';
import ActionMan from '../plumbing/ActionManBase';
import {getType, getId, nonce} from '../data/DataClass';
import List from '../data/List';

/**
 * Provide a list of items of a given type.
 * Clicking on an item sets it as the nav value.
 * Get the item id via:
 * 
 * 	const path = DataStore.getValue(['location','path']);
 * 	const itemId = path[1];
 * 
 * 
 * @param status {?String} e.g. "Draft"
 * @param servlet {?String} e.g. "publisher" Normally unset, and taken from the url.
 * @param ListItem {?React component} if set, replaces DefaultListItem
 */
const ListLoad = ({type, status, servlet, navpage, 
	q, // Optional query e.g. advertiser-id
	hasFilter, // if true, offer a text filter This will be added to q
	ListItem, 
	checkboxes, canDelete, canCreate, className}) => 
{
	assert(C.TYPES.has(type), "ListLoad - odd type " + type);
	if ( ! status) {
		console.error("ListLoad no status :( defaulting to ALL_BAR_TRASH", type);
		status = C.KStatus.ALL_BAR_TRASH;
	}
	assert(C.KStatus.has(status), "ListLoad - odd status " + status);
	// widget settings
	const widgetPath = ['widget','ListLoad',type,status];
	
	// selected item id from url
	// let path = DataStore.getValue(['location', 'path']);
	// let id = path[1];
	// if (id) return null;

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
	const filter = hasFilter? DataStore.getValue(widgetPath.concat('filter')) : null;
	let q2 = q; //join(q, filter); ??pass filter to back-end??
	let pvItems = ActionMan.list({type, status, q:q2});
	if ( ! pvItems.resolved) {
		return (
			<Misc.Loading text={type.toLowerCase() + 's'} />
		);
	}	
	if ( ! ListItem) {
		ListItem = DefaultListItem;
	}	
	// filter out duplicate-id (paranoia: this should already have been done server side)
	// NB: this prefers the 1st occurrence and preserves the list order.
	let items = [];
	let itemForId = {};
	let hits = pvItems.value && pvItems.value.hits;
	if (hits) {
		hits.forEach(item => {
			// HACK fast filter
			let sitem = JSON.stringify(item);
			if (filter && sitem.indexOf(filter) === -1) {
				return; // filtered out
			}
			// dupe?
			let id = getId(item) || sitem;
			if (itemForId[id]) {
				return; // skip dupe
			}
			// ok
			items.push(item);
			itemForId[id] = item;
		});
	} else {
		console.warn("ListLoad.jsx - item list load failed for "+type+" "+status, pvItems);
	}
	return (<div className={join('ListLoad', className, ListItem === DefaultListItem? 'DefaultListLoad' : null)} >
		{items.length === 0 ? 'No results found' : null}
		{canCreate? <CreateButton type={type} /> : null}
		{hasFilter? <div className='form-inline'>&nbsp;<label>Filter</label>&nbsp;<PropControl size='sm' type='search' path={widgetPath} prop='filter'/></div> : null}
		{items.map( (item, i) => (
			<ListItemWrapper key={getId(item) || i} item={item} type={type} checkboxes={checkboxes} canDelete={canDelete} >
				<ListItem 
					type={type} 
					servlet={servlet} 
					navpage={navpage} 
					item={item} 
					onPick={onPick} />
			</ListItemWrapper>
		))}
	</div>);
}; // ./ListLoad


const onPick = ({event, navpage, id}) => {
	if (event) {
		event.stopPropagation();
		event.preventDefault();
	}
	modifyHash([navpage, id]);
};

const ListItemWrapper = ({item, type, checkboxes, canDelete, children}) => {
	const id = getId(item);
	let checkedPath = ['widget', 'ListLoad', type, 'checked'];
	return (
		<div className='ListItemWrapper clearfix'>
			{checkboxes? <div className='pull-left'><Misc.PropControl title='TODO mass actions' path={checkedPath} type='checkbox' prop={id} /></div> : null}
			{canDelete? <DefaultDelete type={type} id={id} /> : null }
			{children}
		</div>
	);
};

/**
 * These can be clicked or control-clicked :(
 * 
 * @param servlet
 * @param navpage -- How/why/when does this differ from servlet??
 */
const DefaultListItem = ({type, servlet, navpage, item, checkboxes, canDelete}) => {
	if ( ! navpage) navpage = servlet;
	const id = getId(item);
	const itemUrl = modifyHash([servlet, id], null, true);
	let checkedPath = ['widget', 'ListLoad', type, 'checked'];
	return (
		<a href={itemUrl}
			onClick={event => onPick({ event, navpage, id })}
			className={'ListItem btn btn-default status-'+item.status}
		>
			<Misc.Thumbnail item={item} />
			{item.name || item.text || id}<br/>
			<small>id: {id} {C.KStatus.isPUBLISHED(item.status)? null : item.status}</small>				
		</a>
	);
};

const DefaultDelete = ({type,id}) => (
	<button className='btn btn-xs btn-default pull-right' 
		onClick={e => confirm("Delete this "+type+"?")? ActionMan.delete(type, id) : null} 
		title='Delete'>
		<Misc.Icon glyph='trash' />
	</button>);

/**
 * Make a local blank, and set the nav url
 * Does not save (Crud will probably do that once you make an edit)
 * @param {
 * 	base: {?Object} use to make the blank.
 * 	make: {?Function} use to make the blank. base -> base
 * }
 */
const createBlank = ({type, navpage, base, id, make}) => {
	assert( ! getId(base), "ListLoad - createBlank - ID not allowed (could be an object reuse bug) "+type+". Safety hack: Pass in an id param instead");
	// Call the make?
	if (make) {
		base = make(base);
	}
	if ( ! base) base = {};
	// specify the id?
	if (id) base.id = id;
	// make an id? (make() might have done it)
	if ( ! getId(base)) {
		base.id = nonce(8);
	}
	id = getId(base);
	if ( ! getType(base)) base['@type'] = type;
	// poke a new blank into DataStore
	const path = getPath(C.KStatus.DRAFT, type, id);
	DataStore.setValue(path, base);
	// set the id
	onPick({navpage, id});
	// invalidate lists
	DataStore.invalidateList(type);
};

/**
 * A create-new button
 * @param props {?String[]} extra props
 */
const CreateButton = ({type, props, navpage, base, make}) => {
	assert(type);
	assert( ! base || ! base.id, "ListLoad - dont pass in ids (defence against object reuse bugs) "+type);
	if ( ! navpage) navpage = DataStore.getValue('location', 'path')[0];	
	// merge any form props into the base
	const cpath = ['widget','CreateButton'];	
	base = Object.assign({}, base, DataStore.getValue(cpath));
	// was an ID passed in by editor props?
	let id = base.id;
	delete base.id;
	return (<div className={props? 'well' : ''}>
		{props? props.map(prop => <Misc.PropControl key={prop} label={prop} prop={prop} path={cpath} inline />) : null}
		<button className='btn btn-default' onClick={() => createBlank({type,navpage,base,id,make})}>
			<Misc.Icon glyph='plus' /> Create
		</button>		
	</div>);
};

export {CreateButton};
export default ListLoad;
