
import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { Input, Row, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Button, ButtonGroup } from 'reactstrap';

import ListLoad, {CreateButton} from './ListLoad';

import C from '../CBase';
import { DSsetValue, PropControlParams, registerControl } from './PropControl';
import ActionMan from '../plumbing/ActionManBase';
import { getDataItem } from '../plumbing/Crud';
import { getId, getName } from '../data/DataClass';
import { assert } from '../utils/assert';
import { encURI, getLogo, space } from '../utils/miscutils';
import {saveDraftFnFactory} from './SavePublishDeleteEtc';
import { doShareThing } from '../Shares';
import { A } from '../plumbing/glrouter';
import DataItemBadge from './DataItemBadge';
import KStatus from '../data/KStatus';

/**
 * TODO replace with DataItemBadge
 */
const SlimListItem = ({item, onClick, noClick, ...props}) => {
	return <DataItemBadge item={item} onClick={onClick} href={!noClick} {...props} />;
};

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
 * @param {?Boolean} embed If true, set a copy of the data-item. By default, what gets set is the ID
 */
const PropControlDataItem2 = ({canCreate, createProp="id", base, path, prop, proppath, rawValue, setRawValue, storeValue, modelValueFromInput, 
	type, itemType, status=KStatus.PUB_OR_DRAFT, domain, list, q, sort, embed, pageSize=20, navpage, notALink, readOnly, showId=true,
}) => {
	let [showLL, setShowLL] = useState(); // Show/hide ListLoad
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
		setInputClean(false);
		// if embed (store whole item, not just ID), only set modelvalue on-click
		if (embed) return;
		id = id.replace(/ $/g, "");
		let mv = modelValueFromInput? modelValueFromInput(id, type, e, storeValue) : id;
		DSsetValue(proppath, mv);
	};

	const doSet = item => {
		const id = getId(item);
		setRawValue(id);
		let mv = embed? Object.assign({}, item) : id;
		if (modelValueFromInput) mv = modelValueFromInput(mv, type, {}, storeValue);
		DSsetValue(proppath, mv, true);
		setShowLL(false); // hide ListLoad
		setInputClean(true); // signal OK to replace search box with item badge
	};

	const doClear = () => {
		setRawValue('');
		DSsetValue(proppath, '');
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

	return (
		<Row className="data-item-control" onFocus={onFocus} onBlur={onBlur}>
			{showItem ? (<>
				<Col xs={12}>
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
				</Col>
			</>) : (<>
				<Col xs={canCreate ? 8 : 12}>
				<div className="dropdown-sizer">
					<Input type="text" value={rawValue || storeValue || ''} onChange={onChange} />
					{rawValue && showLL && <div className="items-dropdown card card-body">
						<ListLoad hideTotal type={itemType} status={status}
							domain={domain} filter={rawValue} unwrapped sort={sort}
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
			</Col>
			<Col xs={4}>
				{canCreate && rawValue && ! pvDataItem.value && (
					<CreateButton type={itemType} base={base} id={baseId} saveFn={saveDraftFnFactory({type,key:prop})} then={({item}) => doSet(item)} />
				)}
			</Col>
		</>)}
		</Row>);
};

registerControl({ type: 'DataItem', $Widget: PropControlDataItem2 });

/**
 * A picker with auto-complete for e.g. Advertiser, Agency
 * @param {PropControlParams} p 
 * @param {!String} p.itemType
 * @param {?Object} p.base Used with canCreate, a base object for if a new item is created.
 * @param {?boolean} p.canCreate Offer a create button
 * @param {?String} p.createProp If a new item is created -- what property should the typed value set? Defaults to "id"
 * @param {?String} p.status Defaulst to PUB_OR_DRAFT
 * @param {?String} p.q Optional search query (user input will add to this). Usually unset.
 * @param {?String} p.list Optional list to use (instead of querying the server). Usually unset.
 * @param {?Boolean} embed If true, set a copy of the data-item. By default, what gets set is the ID
 */
const PropControlDataItem = (p) => <PropControl type="DataItem" {...p} />

export default PropControlDataItem;
