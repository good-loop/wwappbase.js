
import React, { useState } from 'react';
import _ from 'lodash';
import { Input, Row, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Button, ButtonGroup } from 'reactstrap';

import ListLoad, {CreateButton} from './ListLoad';

import C from '../CBase';
import { DSsetValue, registerControl } from './PropControl';
import ActionMan from '../plumbing/ActionManBase';
import { getDataItem } from '../plumbing/Crud';
import { getId, getName } from '../data/DataClass';
import { assert } from '../utils/assert';
import { encURI, getLogo, space } from '../utils/miscutils';
import {saveDraftFnFactory} from './SavePublishDeleteEtc';
import { doShareThing } from '../Shares';
import { A } from '../plumbing/glrouter';
import DataItemBadge from './DataItemBadge';

/**
 * TODO replace with DataItemBadge
 */
const SlimListItem = ({item, onClick, noClick}) => {
	return <DataItemBadge item={item} onClick={onClick} href={ ! noClick} />;
};

/**
 * A picker with auto-complete for e.g. Advertiser, Agency
 * @param {Object} p
 * @param {!String} p.itemType
 * @param {?Object} p.base Used with canCreate, a base object for if a new item is created.
 * @param {?boolean} p.canCreate Offer a create button
 * @param {?String} p.createProp If a new item is created -- what property should the typed value set? Defaults to "id"
 * @param {?Boolean} embed If true, set a copy of the data-item. By default, what gets set is the ID
 */
const PropControlDataItem = ({canCreate, createProp="id", base, path, prop, proppath, rawValue, setRawValue, storeValue, modelValueFromInput, 
	type, itemType, status=C.KStatus.DRAFT, domain, q, sort, embed, pageSize=20, navpage, notALink, readOnly
}) => {
	let [showLL, setShowLL] = useState(); // Show/hide ListLoad
	const [, setCloseTimeout] = useState(); // Debounce hiding the ListLoad

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
		//id = id.replace(/ $/g, "");
		setRawValue(id);
		if (embed) {
			return; // if embed, only set on-click
		}
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

	return (
		<Row className="data-item-control" onFocus={onFocus} onBlur={onBlur}>
			{pvDataItem.value && <>
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
					<div><small>ID: <code>{rawValue || storeValue}</code></small></div>
				</Col>
			</>}
			<>
				<Col xs={canCreate ? 8 : 12}>
				<div className="dropdown-sizer">
					{ ! pvDataItem.value && <Input type="text" value={rawValue || storeValue || ''} onChange={onChange} />}
					{rawValue && showLL && <ListLoad className="items-dropdown card card-body" hideTotal type={itemType} status={status} 
						domain={domain} filter={rawValue} unwrapped sort={sort} 
						ListItem={SlimListItem}
						// TODO allow ListLoad to show if there are only a few options
						noResults={`No ${itemType} found for "${rawValue}"`}
						pageSize={pageSize} otherParams={{filterByShares:true}}
						onClickItem={item => doSet(item)}
					/>}
				</div>
			</Col>
			<Col xs={4}>
				{canCreate && rawValue && ! pvDataItem.value && (
					<CreateButton type={itemType} base={base} id={baseId} saveFn={saveDraftFnFactory({type,key:prop})} then={({item}) => doSet(item)} />
				)}
			</Col>
		</>
		</Row>);
};

registerControl({ type: 'DataItem', $Widget: PropControlDataItem });
export default PropControlDataItem;
