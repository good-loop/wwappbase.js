
import React, { useEffect, useState } from 'react';
import { Input, Button, ButtonGroup, Form } from 'reactstrap';

import ListLoad, {CreateButton} from '../ListLoad';

import PropControl, {  PropControlParams, registerControl } from '../PropControl';
import { getDataItem } from '../../plumbing/Crud';
import { getId } from '../../data/DataClass';
import { encURI } from '../../utils/miscutils';
import {saveDraftFnFactory} from '../SavePublishDeleteEtc';
import { A } from '../../plumbing/glrouter';
import DataItemBadge from '../DataItemBadge';
import KStatus from '../../data/KStatus';


/**
 * DataItemBadge
 */
function SlimListItem({item, onClick, ...props}) {
	return <DataItemBadge style={{cursor:"pointer"}} item={item} onClick={onClick} href={false} {...props} />;
}

/**
 * A picker with auto-complete for e.g. Advertiser, Agency
 * @param {Object} p
 * @param {!String} p.itemType
 * @param {?Object} p.base Used with canCreate, a base object for if a new item is created.
 * @param {?boolean} p.canCreate Offer a create button
 * @param {?String} p.createProp If a new item is created -- what property should the typed value set? Defaults to "id"
 * @param {?String} p.status Defaulst to PUB_OR_DRAFT
 * @param {?String} p.q Optional search query (user input will add to this). Usually unset.
 * @param {?String} p.list Optional list to use (instead of querying the server). Usually unset.
 * @param {?Boolean} p.embed If true, set a copy of the data-item. By default, what gets set is the ID
 */
function PropControlDataItem2({canCreate, createProp="id", base, path, prop, proppath, rawValue, 
set, 
setRawValue, storeValue, modelValueFromInput, 
	type, itemType, status=KStatus.PUB_OR_DRAFT, domain, list, q, sort, embed, pageSize=20, navpage, notALink, readOnly, showId=true,
}) {
	const [showLL, setShowLL] = useState(); // Show/hide ListLoad
	const [, setCloseTimeout] = useState(); // Debounce hiding the ListLoad
	const [inputClean, setInputClean] = useState(true); // Has the user input anything since last pick?

	// If storevalue is nulled out from elsewhere, don't retain rawValue
	useEffect(() => {
		if (!storeValue) setRawValue('');
	}, [storeValue]);

	// In React pre-v17, onFocus/onBlur events bubble - BUT:
	// When focus shifts WITHIN the listener, a blur/focus event pair is fired.
	// (In React 17+, onFocus/onBlur uses native onFocusIn/onFocusOut,
	// which bubbles and does NOT fire on internal-focus-shift.)
	// So when a blur event fires, wait a moment before closing the dropdown list
	// in case another focus event arrives.
	const onFocus = () => {
		setCloseTimeout(prevTimeout => {
			window.clearTimeout(prevTimeout);
			return null;
		});
		setShowLL(true);
	};

	const onBlur = () => {
		setCloseTimeout(prevTimeout => {
			 // Never have two delayed-close timeouts active at the same time
			window.clearTimeout(prevTimeout);
			return window.setTimeout(() => setShowLL(false), 200);
		});
	};

	let pvDataItem = {};
	if (rawValue || (storeValue && !embed)) {
		pvDataItem = getDataItem({ type: itemType, id: rawValue || storeValue, status, domain, swallow: true });
	}

	let onChange = e => {
		let id = e.target.value;
		setRawValue(id);
		// signal "user is typing, don't replace search box with item badge, even if this is a valid ID"
		// NB: This fixes an issue where if "a" was a valid ID then you couldn't enter "apple"
		setInputClean(false);
		// Require the user to click to set
		// // if embed (store whole item, not just ID), only set modelvalue on-click
		// if (embed) return;
		// id = id.replace(/ $/g, "");
		// let mv = modelValueFromInput? modelValueFromInput(id, type, e, storeValue) : id;
		// set(mv);
		// DSsetValue(proppath, mv);
	};

	const doSet = item => {
		const id = getId(item); // NB: this will be trimmed as it came from an item
		setRawValue(id);
		let mv = embed? Object.assign({}, item) : id;
		if (modelValueFromInput) mv = modelValueFromInput(mv, type, {}, storeValue);
		// DSsetValue(proppath, mv, true);
		set(mv);
		setShowLL(false); // hide ListLoad
		setInputClean(true); // signal OK to replace search box with item badge
	};

	const doClear = () => {
		setRawValue('');
		set(null);
		// DSsetValue(proppath, '');
	};

	// (default create behaviour) the input names the object
	if (rawValue && createProp) {
		if (!base) base = {};
		base[createProp] = rawValue;
	}
	let baseId = base && base.id;
	if (baseId) delete base.id; // manage CreateButton's defences

	// If the user has entered something in the search box, and it happens to be a valid ID -
	// don't replace the search box with the item badge until they select it in the dropdown!
	const showItem = pvDataItem.value && inputClean;
	// Offer to create an item with name = current input value
	const showCreate = !pvDataItem.value && canCreate && rawValue;

	return (
		<Form inline className="data-item-control" onFocus={onFocus} onBlur={onBlur}>
			{showItem ? <>
				<ButtonGroup>
					<Button color="secondary" className="preview" tag={notALink ? 'span' : A}
						href={!notALink ? `/#${(navpage||itemType.toLowerCase())}/${encURI(getId(pvDataItem.value))}` : undefined}
						title={!notALink ? `Switch to editing this ${itemType}` : undefined}
					>
						<SlimListItem type={itemType} item={pvDataItem.value} noClick />
					</Button>
					{!readOnly && <Button color="secondary" className="clear" onClick={doClear}>🗙</Button>}
				</ButtonGroup>
				{showId && <div><small>ID: <code>{rawValue || storeValue}</code></small></div>}
			</> : <>
				<div className="dropdown-sizer">
					<Input type="text" value={rawValue || storeValue || ''} onChange={onChange} />
					{rawValue && showLL && <div className="items-dropdown card card-body">
						<ListLoad hideTotal type={itemType} status={status}
							domain={domain} 
							filter={rawValue} 
							filterFn={item => ! item.redirect /* avoid deprecated redirect objects */}
							unwrapped sort={sort}
							ListItem={SlimListItem}
							// TODO allow ListLoad to show if there are only a few options
							noResults={`No ${itemType} found for "${rawValue}"`}
							pageSize={pageSize} 
							otherParams={{filterByShares:true}} // deprecated: filterByShares Dec 2022
							onClickItem={item => doSet(item)}
							q={q}
							list={list}
						/>
					</div>}
				</div>
				{showCreate && <CreateButton
					type={itemType} base={base} id={baseId} className="ml-1"
					saveFn={saveDraftFnFactory({type, key: prop})} then={({item}) => doSet(item)}
				/>}
			</>}
		</Form>
	);
}

registerControl({ type: 'DataItem', $Widget: PropControlDataItem2 });

/**
 * A picker with auto-complete for e.g. Advertiser, Agency
 * @param {PropControlParams} p 
 * @param {!String} p.itemType
 * @param {?Object} p.base Used with canCreate, a base object for if a new item is created.
 * @param {?boolean} p.canCreate Offer a create button
 * @param {?String} p.createProp If a new item is created -- what property should the typed value set? Defaults to "id"
 * @param {?String} p.status Defaults to PUB_OR_DRAFT
 * @param {?String} p.q Optional search query (user input will add to this). Usually unset.
 * @param {?String} p.list Optional list to use (instead of querying the server). Usually unset.
 * @param {?Boolean} embed If true, set a copy of the data-item. By default, what gets set is the ID
 */
function PropControlDataItem(p) {
	return <PropControl type="DataItem" {...p} />;
}

export default PropControlDataItem;
