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
import BS from './BS';

/**
 * Provide a list of items of a given type.
 * Clicking on an item sets it as the nav value.
 * Get the item id via:
 * 
 * 	const path = DataStore.getValue(['location','path']);
 * 	const itemId = path[1];
 * 
 * 
 * @param q {?String} Optional query e.g. advertiser-id=pepsi
 * Note: that filter can add to this
 * @param sort {?String} Optional sort order, e.g. "start-desc"
 * @param status {?String} e.g. "Draft"
 * @param servlet {?String} e.g. "publisher" If unset, a default is taken from the url. 
 * Best practice is to set servlet to avoid relying on url behaviour.
 * @param ListItem {?React component} if set, replaces DefaultListItem.
 * 	ListItem only has to describe/present the item
 * 	NB: On-click handling, checkboxes and delete are provided by ListItemWrapper.
 * @param notALink {?boolean} If true, use div+onClick instead of a, so that the item can hold a tags (which dont nest).
 */
const ListLoad = ({type, status, servlet, navpage, 
	q,
	sort,
	hasFilter, // if true, offer a text filter This will be added to q
	ListItem, 
	checkboxes, canDelete, canCreate, className,
	notALink}) => 
{
	assert(C.TYPES.has(type), "ListLoad - odd type " + type);
	if ( ! status) {
		console.error("ListLoad no status :( defaulting to ALL_BAR_TRASH", type);
		status = C.KStatus.ALL_BAR_TRASH;
	}
	assert(C.KStatus.has(status), "ListLoad - odd status " + status);
	// widget settings TODO migrate to useState so we can have multiple overlapping ListLoads
	// const [foo, setFoo] = useState({});
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
	// NB: case-insentive filtering
	const _filter = hasFilter? DataStore.getValue(widgetPath.concat('filter')) : null;
	const filter = _filter? _filter.toLowerCase() : null;
	let q2 = join(q, filter); // pass filter to back-end
	
	// Load via ActionMan -- both filtered and un-filtered
	let pvItems = ActionMan.list({type, status, q:q2, sort});
	let pvItemsAll = ActionMan.list({type, status, q, sort});

	if ( ! ListItem) {
		ListItem = DefaultListItem;
	}	
	// filter out duplicate-id (paranoia: this should already have been done server side)
	// NB: this prefers the 1st occurrence and preserves the list order.
	let items = [];
	let itemForId = {};
	let hits = pvItems.resolved? pvItems.value && pvItems.value.hits : pvItemsAll.value && pvItemsAll.value.hits;
	if (hits) {
		const fastFilter =  ! pvItems.resolved;
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
	} else {
		console.warn("ListLoad.jsx - item list load failed for "+type+" "+status, pvItems);
	}

	return (<div className={join('ListLoad', className, ListItem === DefaultListItem? 'DefaultListLoad' : null)} >
		{items.length === 0 ? 'No results found' : null}
		{canCreate? <CreateButton type={type} /> : null}
		{hasFilter? <div className='filter form-inline'>&nbsp;<label>Filter</label>&nbsp;<PropControl size='sm' type='search' path={widgetPath} prop='filter'/></div> : null}		
		{items.map( (item, i) => (
			<ListItemWrapper key={getId(item) || i} 
				item={item} 
				type={type} 
				checkboxes={checkboxes} 
				canDelete={canDelete} 
				servlet={servlet}
				navpage={navpage}
				notALink={notALink}
			>
				<ListItem 
					type={type} 
					servlet={servlet} 
					navpage={navpage} 
					item={item} 
				/>
			</ListItemWrapper>
		))}
		{pvItems.resolved? null : <Misc.Loading text={type.toLowerCase() + 's'} />}
	</div>);
}; // ./ListLoad
//

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
const ListItemWrapper = ({item, type, checkboxes, canDelete, servlet, navpage, children, notALink}) => {
	const id = getId(item);
	// for the campaign page we want to manipulate the url to modify the vert/vertiser params 
	// that means both modifying href and onClick definitions
	let itemUrl = servlet==="campaign" ? modifyHash([servlet,null], {'gl.vertiser':null, 'gl.vert':id}, true) : modifyHash([servlet, id], null, true);
	let customParams = servlet==="campaign" ? {'gl.vertiser':null, 'gl.vert':id} : null;

	let checkedPath = ['widget', 'ListLoad', type, 'checked'];

	const checkbox = checkboxes ? (
		<div className='pull-left'>
			<Misc.PropControl title='TODO mass actions' path={checkedPath} type='checkbox' prop={id} />
		</div>
	) : null;

	// use a or div?
	// ??Is there a nicer way to do this?
	const A = ({children, ...stuff}) => notALink? <div {...stuff} >{children}</div> : <a {...stuff} >{children}</a>;

	return (
		<div className='ListItemWrapper clearfix'>
			{checkbox}
			{canDelete? <DefaultDelete type={type} id={id} /> : null }
			<A href={itemUrl}
				onClick={event => onPick({ event, navpage, id, customParams })}
				className={'ListItem btn btn-default status-' + item.status}
			>
				<div>{children}</div>
			</A>
		</div>
	);
};

/**
 * These can be clicked or control-clicked
 * 
 * @param servlet
 * @param navpage -- How/why/when does this differ from servlet??
 * @param nameFn {Function} Is there a non-standard way to extract the item's display name?
 * 	TODO If it's of a data type which has getName(), default to that
 * @param extraDetail {Element} e.g. used on AdvertPage to add a marker to active ads
 */
const DefaultListItem = ({type, servlet, navpage, item, checkboxes, canDelete, nameFn, extraDetail}) => {
	if ( ! navpage) navpage = servlet;
	const id = getId(item);
	// let checkedPath = ['widget', 'ListLoad', type, 'checked'];
	let name = nameFn ? nameFn(item, id) : item.name || item.text || id || '';
	if (name.length > 280) name = name.slice(0,280); 
	const status = C.KStatus.isPUBLISHED(item.status)? null : item.status;
	return (
		<div>
			<Misc.Thumbnail item={item} />
			<div className="info">
				<div className="name">{name}</div>
				<div className="detail small">
					id: <span className="id">{id}</span> <span className="status">{status}</span> {extraDetail}
				</div>
			</div>
		</div>
	);
};


const DefaultDelete = ({type,id}) => (
	<button className='btn btn-xs btn-default pull-right' 
		onClick={e => confirm("Delete this "+type+"?")? ActionMan.delete(type, id) : null} 
		title='Delete'>
		<BS.Icon name='trash' />
	</button>
);


/**
 * Make a local blank, and set the nav url
 * Does not save (Crud will probably do that once you make an edit)
 * @param {{
 * 	base: {?Object} use to make the blank.
 * 	make: {?Function} use to make the blank. base -> base
 * }}
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
	if ( ! navpage) {
		navpage = DataStore.getValue('location', 'path')[0]; //type.toLowerCase();
	}
	onPick({navpage, id});
	// invalidate lists
	DataStore.invalidateList(type);
};

/**
 * A create-new button
 * @param {{
 * 	type: !String
 * 	navpage: ?String - defaults to the curent page from url
 * }}
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
			<BS.Icon name='plus' /> Create
		</button>		
	</div>);
};

/**
 * 
 * @param servlet {?String} e.g. "publisher" If unset, a default is taken from the url. 
 * Best practice is to set servlet to avoid relying on url behaviour.
 */
const ListItems = ({type, navpage, servlet, status=C.KStatus.ALL_BAR_TRASH, q}) => {
	assMatch(type, String);
	return (
		<div>
			<h3 className="text-capitalize">List {type}</h3>
			<CreateButton type={type} navpage={navpage} />
			<ListLoad type={type} hasFilter servlet={servlet} status={status} q={q} />
		</div>
	);
};

export { CreateButton, DefaultListItem, ListItems, createBlank };
export default ListLoad;
