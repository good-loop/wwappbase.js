import React, { useState } from 'react';

import { assert, assMatch } from '../utils/assert';

import {modifyHash, space, yessy} from '../utils/miscutils';
import C from '../CBase';
import Misc from './Misc';
import PropControl from './PropControl';
import DataStore, { Item, Ref } from '../plumbing/DataStore';
import ServerIO from '../plumbing/ServerIOBase';
import ActionMan from '../plumbing/ActionManBase';
import DataClass, {getType, getId, nonce, getClass} from '../data/DataClass';
import { Button, Card, CardBody, Form, Alert } from 'reactstrap';
import ErrAlert from './ErrAlert';
import Icon from './Icon';
import KStatus from '../data/KStatus';
import AThing from '../data/AThing';

/**
 * Provide a list of items of a given type.
 * Clicking on an item sets it as the nav value.
 * Get the item id via:
 *
 * 	const path = DataStore.getValue(['location','path']);
 * 	const itemId = path[1];
 *
 * @param {Object} p
 * @param {!String} p.type from C.TYPES
 * @param {?String} p.q - Optional query e.g. advertiser-id=pepsi. See `filter` for prefix search
 * Note: that filter can add to this
 * @param {?String} p.sort -  Optional sort order, e.g. "start-desc". Defaults to `created-desc`. NB: AThing has created since May 2020.
 * If the item does not have a created field -- pass in a different sort order, or "" for unsorted.
 * TODO test "" works
 * @param {?String} p.filter - Set a filter. Do NOT use this and canFilter. This will query the backend via `prefix`
 * @param {?Boolean} p.canFilter - If true, offer a text filter. This will be added to q as a prefix filter.
 * @param {?Boolean} p.canCreate - If set, show a Create
 * @param {?Boolean} p.canDelete - If set, show delete buttons
 * @param {?boolean} p.filterLocally - If true, do not call the server for filtering
 * @param {?String} p.status - e.g. "Draft"
 * @param {?String} p.servlet - Deprecated - use navpage instead
 * @param {?String} p.navpage - e.g. "publisher" If unset, a default is taken from the url.
 * Best practice is to set navpage to avoid relying on url behaviour.
 * @param {?Function} p.ListItem JSX if set, replaces DefaultListItem.
 * 	ListItem only has to describe/present the item.   
 * 	NB: On-click handling, checkboxes and delete are provided by ListItemWrapper.   
 * 	Input props: {type, servlet, navpage, item, sort}

 * @param {?boolean} p.notALink - Normally list items are a-tag links. If true, use div+onClick instead of a, so that the item can hold a tags (which dont nest).* 
 * @param {?String} p.itemClassName - If set, overrides the standard ListItem btn css classes
 * @param {?boolean} p.hideTotal - If true, don't show the "Total about 17" line
 * @param {?Object} p.createBase - Use with `canCreate`. Optional base object for any new item. NB: This is passed into createBlank.
 * @param {?KStatus} p.preferStatus See DataStpre.resolveRef E.g. if you want to display the in-edit drafts
 * @param {?Boolean} p.hasFilter - deprecated - use canFilter
 * @param {?Boolean} p.unwrapped If set don't apply a ListItemWrapper (which has the standard on-click behaviour and checkbox etc controls)
 * @param {JSX|String} p.noResults  Message to show if there are no results
 */
const ListLoad = ({type, status, servlet, navpage,
	q, 
	start, end,
	sort = 'created-desc',
	filter, hasFilter, filterLocally,
	ListItem,
	checkboxes, 
	canDelete, canCreate, canFilter,
	createBase,
	className,
	noResults,
	notALink, itemClassName,
	preferStatus,
	hideTotal,
	pageSize,
	unwrapped
}) =>
{
	assert(C.TYPES.has(type), "ListLoad - odd type " + type);
	if ( ! status) {
		console.error("ListLoad no status :( defaulting to ALL_BAR_TRASH", type);
		status = KStatus.ALL_BAR_TRASH;
	}
	assert(KStatus.has(status), "ListLoad - odd status " + status);
	// widget settings TODO migrate to useState so we can have multiple overlapping ListLoads
	// const [foo, setFoo] = useState({});
	// ??preserves state across q and filter edits -- is that best??
	const widgetPath = ['widget','ListLoad',type,status];	
	if (servlet && ! navpage) {
		console.warn("ListLoad.jsx - deprecated use of servlet - please switch to navpage");
	}
	if ( ! canFilter) canFilter = hasFilter; // for old code
	if ( ! navpage) navpage = servlet || DataStore.getValue('location', 'path')[0]; //type.toLowerCase();
	if ( ! servlet) servlet = navpage;
	if ( ! servlet) {
		console.warn("ListLoad - no servlet? type="+type);
		return null;
	}
	assMatch(servlet, String);
	assMatch(navpage, String);
	assert(navpage && navpage[0] !== '#', "ListLoad.jsx - navpage should be a 'word' ["+navpage+"]");
	// store the lists in a separate bit of appstate
	// from data.
	// Downside: new events dont get auto-added to lists
	// Upside: clearer
	// NB: case-insentive filtering
	if (canFilter) {
		assert( ! filter, "ListLoad.jsx - Do NOT use filter and canFilter props");
		filter = DataStore.getValue(widgetPath.concat('filter'));
	}
	if (filter) filter = filter.toLowerCase(); // normalise
	
	// Load via ActionMan -- both filtered and un-filtered
	// (why? for speedy updates: As you type in a filter keyword, the front-end can show a filtering of the data it has, 
	// while fetching from the backedn using the filter)
	let pvItemsFiltered = filter && ! filterLocally? ActionMan.list({type, status, q, start, end, prefix:filter, sort}) : {resolved:true};
	let pvItemsAll = ActionMan.list({type, status, q, start, end, sort});
	let pvItems = pvItemsFiltered.value? pvItemsFiltered : pvItemsAll;
	if ( ! ListItem) {
		ListItem = DefaultListItem;
	}
	// filter out duplicate-id (paranoia: this should already have been done server side)
	// NB: this prefers the 1st occurrence and preserves the list order.
	let hits = pvItems.value && pvItems.value.hits;
	const fastFilter = ! pvItemsFiltered.value;
	// ...filter / resolve
	let items = resolveItems({hits, type, status, preferStatus, filter, fastFilter});	
	// paginate
	let [pageNum, setPageNum2] = pageSize? useState(0) : [];
	const setPageNum = n => {		
		setPageNum2(n);
		window.scrollTo(0, 0);
	};
	items = pageSize? paginate({items, pageNum, pageSize}) : items;
	let total = pvItems.value && pvItems.value.total;	

	return (<div className={space('ListLoad', className, ListItem === DefaultListItem? 'DefaultListLoad' : null)} >
		{canCreate && <CreateButton type={type} base={createBase} navpage={navpage} />}
		
		{canFilter && <PropControl inline label="Filter" size="sm" type="search" path={widgetPath} prop="filter"/>}

		{ ! items.length && (noResults || <>No results found for <code>{space(q, filter) || type}</code></>)}
		{total && ! hideTotal? <div>About {total} results in total</div> : null}
		{checkboxes && <MassActionToolbar type={type} canDelete={canDelete} items={items} />}

		{items.map( (item, i) => (
			<ListItemWrapper key={getId(item) || i}
				unwrapped={unwrapped}
				item={item}
				type={type}
				checkboxes={checkboxes}
				canDelete={canDelete}
				servlet={servlet}
				navpage={navpage}
				notALink={notALink}
				itemClassName={itemClassName}
			>
				<ListItem key={'li'+(getId(item) || i)}
					type={type}
					servlet={servlet}
					navpage={navpage}
					item={item}
					sort={DataStore.getValue(['misc', 'sort'])}
				/>
			</ListItemWrapper>
		))}

		{pageSize && total > pageSize && <div>
			<Button className='mr-2' color='secondary' disabled={ ! pageNum} onClick={e => setPageNum(pageNum-1)} ><b>&lt;</b></Button>
			page {(pageNum+1)} of {Math.ceil(total / pageSize)}
			<Button color='secondary' onClick={e => setPageNum(pageNum+1)} ><b>&gt;</b></Button>
		</div>}
		{pvItemsFiltered.resolved && pvItemsAll.resolved? null : <Misc.Loading text={type.toLowerCase() + 's'} />}
		<ErrAlert error={pvItems.error}/>
	</div>);
}; // ./ListLoad
//


const paginate = ({items, pageNum, pageSize}) => {
	assert(pageSize, "paginate");
	return items.slice(pageNum*pageSize, (pageNum+1)*pageSize);
};

/**
 * TODO
 * @param {boolean} canDelete 
 */
const MassActionToolbar = ({type, canDelete, items}) => {
	// checked count
	let checkedPath = ['widget', 'ListLoad', type, 'checked'];
	let checked4id = DataStore.getValue(checkedPath);
	let checkCnt = 0 // TODO
	if ( ! checkCnt) return null; // TODO
	return (<div class="btn-toolbar" role="toolbar" aria-label="Toolbar for checked items">
		{checkCnt} checked of {items.length}
	</div>);
};

/**
 * 
 * @param {?Ref[]} hits 
 * @returns {Item[]}
 */
const resolveItems = ({hits, type, status, preferStatus, filter, fastFilter}) => {
	if ( ! hits) {
		// an ajax call probably just hasn't loaded yet
		return [];
	}
	// resolve Refs to full Items
	hits = DataStore.getDataList(hits, preferStatus);
	// HACK: Use-case: you load published items. But the list allows for edits. Those edits need draft items. So copy pubs into draft
	if (preferStatus===KStatus.DRAFT) {
		hits.forEach(item => {			
			let dpath = DataStore.getDataPath({status:KStatus.DRAFT, type, id:getId(item)});
			let draft = DataStore.getValue(dpath);
			if ( ! yessy(draft)) {
				DataStore.setValue(dpath, item, false);
			}
		});
	}

	const items = [];
	const itemForId = {};
	
	// client-side filter and de-dupe
	if ( ! filter) fastFilter = false; // avoid pointless work in the loop
	hits.forEach(item => {			
		// fast filter via stringify
		let sitem = null;
		if (fastFilter) {
			sitem = JSON.stringify(item).toLowerCase();
			if (filter && sitem.indexOf(filter) === -1) {
				return; // filtered out
			}
		}
		// dupe?
		let id = getId(item) || sitem || JSON.stringify(item).toLowerCase();
		if (itemForId[id]) {
			return; // skip dupe
		}
		// ok
		items.push(item);
		itemForId[id] = item;
	});

	return items;	
};

/**
 * 
 * @param {?Object} customParams - Not used! allows passing extra params through the click
 */
const onPick = ({event, navpage, id, customParams}) => {
	if (event) {
		event.stopPropagation();
		event.preventDefault();
	}
	customParams ? modifyHash([navpage,null],customParams) : modifyHash([navpage,id]);
};

/**
 * checkbox, delete, on-click a wrapper
 */
const ListItemWrapper = ({item, type, checkboxes, canDelete, servlet, navpage, children, notALink, itemClassName, unwrapped}) => {
	if (unwrapped) {
		return children;
	}
	const id = getId(item);
	if ( ! id) {
		console.error("ListLoad.jsx - "+type+" with no id", item);
		return null;
	}
	let itemUrl = modifyHash([servlet, id], null, true);	

	// // TODO refactor this Portal specific code out of here.
	// // for the Impact Hub campaign page we want to manipulate the url to modify the vert/vertiser params
	// // that means both modifying href and onClick definitions
	// let customParams;
	// if (servlet==="campaign") {
	// 	itemUrl = modifyHash([servlet,null], {'gl.vertiser':null, 'gl.vert':id}, true);
	// 	customParams = {'gl.vertiser':null, 'gl.vert':id};
	// }

	let checkedPath = ['widget', 'ListLoad', type, 'checked'];

	const checkbox = checkboxes ? (
		<div className="pull-left">
			<Misc.PropControl title="Select for mass actions" path={checkedPath} type="checkbox" prop={id} />
		</div>
	) : null;

	// use a or div?
	// ??Is there a nicer way to do this?

	return (
		<div className="ListItemWrapper clearfix">
			{checkbox}
			{canDelete? <DefaultDelete type={type} id={id} /> : null }
			<A href={itemUrl} key={'A'+id} notALink={notALink}
				onClick={event => onPick({ event, navpage, id })}
				className={itemClassName || `ListItem btn-default btn btn-outline-secondary status-${item.status}`}
			>
				{children}
			</A>
		</div>
	);
};


const A = ({notALink, children, ...stuff}) => notALink? <div {...stuff} >{children}</div> : <a {...stuff} >{children}</a>;

/**
 * These can be clicked or control-clicked
 *
 * @param servlet
 * @param navpage -- How/why/when does this differ from servlet??
 * @param nameFn {Function} Is there a non-standard way to extract the item's display name?
 * 	TODO If it's of a data type which has getName(), default to that
 * @param extraDetail {Element} e.g. used on AdvertPage to add a marker to active ads
 */
const DefaultListItem = ({type, servlet, navpage, item, checkboxes, canDelete, nameFn, extraDetail, button}) => {
	if ( ! navpage) navpage = servlet;
	const id = getId(item);
	// let checkedPath = ['widget', 'ListLoad', type, 'checked'];
	let name = nameFn ? nameFn(item, id) : item.name || item.text || id || '';
	if (name.length > 280) name = name.slice(0,280);
	const status = item.status || "";
	return <>
		<Misc.Thumbnail item={item} />
		<div className="info">
			<div className="name">{name}</div>
			<div className="detail small">
				id: <span className="id">{id}</span> <span className="status">{status.toLowerCase()}</span> {extraDetail} Created: <Misc.RoughDate date={item.created} /> {AThing.lastModified(item) && <>Modified: <Misc.RoughDate date={AThing.lastModified(item)} /></>}
			</div>
			{ button || '' }
		</div>
	</>;
};


const DefaultDelete = ({type,id}) => (
	<Button color="secondary" size="xs" className="pull-right p-1 pt-2"
		onClick={e => confirm(`Delete this ${type}?`) ? ActionMan.delete(type, id) : null}
		title="Delete">
		<Icon name="trashcan" color="white"/>		
	</Button>
);


/**
 * Make a local blank, and set the nav url
 * Does not save (Crud will probably do that once you make an edit) unless a `saveFn` is passed in
 * @param {Object} p
 * @param {!String} p.type C.TYPES
 * @param {?Object} p.base - use to make the blank. This will be copied.
 * @param {?Function} p.make use to make the blank. base -> item. If unset, look for a DataClass for type, and use `new` constructor. Or just {}.
 * @param {?Function} p.saveFn {type, id, item} eg saveDraftFn
 * @param {?Function} p.then {type, id, item} Defaults to `onPick` which navigates to the item.
 */
const createBlank = ({type, navpage, base, id, make, saveFn, then}) => {
	assert( ! getId(base), "ListLoad - createBlank - ID not allowed (could be an object reuse bug) "+type+". Safety hack: Pass in an id param instead");
	// Call the make?
	let newItem;
	if (make) {
		newItem = make(base);
	} else {
		const klass = getClass(type);
		if (klass) {
			const cons = klass.bind({}); // NB: need the bind otherwise `this` is undefined
			newItem = cons(base); // equivalent to `new Thing(base)` -- probably the normal way to do things
			if (klass._name) newItem['@type'] = klass._name;	// NB: dont forget the DataClass type, which is lost by the bind
		}
	}
	if ( ! newItem) newItem = Object.assign({}, base);
	// specify the id?
	if (id) newItem.id = id;
	// make an id? (make() might have done it)
	if ( ! getId(newItem)) {
		newItem.id = nonce(8);
	}
	id = getId(newItem);
	if ( ! getType(newItem)) newItem['@type'] = type;
	// poke a new blank into DataStore
	newItem.status = KStatus.DRAFT;
	const path = DataStore.getDataPath({status:KStatus.DRAFT, type, id});
	DataStore.setValue(path, newItem);
	if (saveFn) {
		saveFn({type, id, item:newItem});
	}
	if (then) {
		then({type, id, item:newItem});
	} else {
		// set the id
		if ( ! navpage) {
			navpage = DataStore.getValue('location', 'path')[0]; //type.toLowerCase();
		}
		onPick({navpage, id});
	}
	// invalidate lists
	DataStore.invalidateList(type);
};

/**
 * A create-new button
 * @param {Object} p
 * @param {!String} p.type
 * @param {?String]} p.navpage - defaults to the curent page from url
 * @param {?String} p.id - Optional id for the new item (otherwise nonce or a prop might be used)
 * @param {?string[]} p.props - keys of extra props -- this is turned into a form for the user to enter
 * @param {?Function} p.saveFn {type, id, item} eg saveDraftFn
 * @param {?Function} p.then {type, id, item} Defaults to `onPick` which navigates to the item.
 */
const CreateButton = ({type, props, navpage, base, id, make, saveFn, then}) => {
	assert(type);
	assert( ! base || ! base.id, "ListLoad - dont pass in base.id (defence against object reuse bugs) "+type+". You can use top-level `id` instead.");
	if ( ! navpage) navpage = DataStore.getValue('location', 'path')[0];
	// merge any form props into the base
	const cpath = ['widget','CreateButton'];
	base = Object.assign({}, base, DataStore.getValue(cpath));
	// was an ID passed in by editor props? (to avoid copy accidents id is not used from base, so to use it here we must fish it out)
	if ( ! id) id = base.id; // usually null
	delete base.id; // NB: this is a copy - the original base is not affected.
	const $createButton = <Button className='btn-create' onClick={() => createBlank({type,navpage,base,id,make,saveFn,then})}><span style={{fontSize:'125%', lineHeight:'1em'}}>+</span> Create</Button>;
	if ( ! props) {
		// simple button
		return $createButton;
	}
	// mini form
	return (<Card><CardBody><Form inline>
		{props.map(prop => <PropControl key={prop} label={prop} prop={prop} path={cpath} inline className="mr-2" />)}
		{$createButton}
		</Form></CardBody></Card>);
};

export { CreateButton, DefaultListItem, createBlank };
export default ListLoad;
