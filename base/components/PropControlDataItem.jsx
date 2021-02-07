
import React, { useState } from 'react';
import _ from 'lodash';
import { Input, Row, Col } from 'reactstrap';

import ListLoad, {CreateButton} from './ListLoad';

import C from '../CBase';
import { DSsetValue, registerControl } from './PropControl';
import ActionMan from '../plumbing/ActionManBase';
import { getDataItem } from '../plumbing/Crud';
import { getId, getName } from '../data/DataClass';
import { assert } from '../utils/assert';
import { getLogo } from '../utils/miscutils';
import {saveDraftFn} from './SavePublishDeleteEtc';

/**
 * TODO a picker with auto-complete for e.g. Advertiser, Agency
 */

/**
 * 
 * @param {?Boolean} embed If true, set a copy of the data-item. By default, what gets set is the ID
 */
const PropControlDataItem = ({canCreate, base, path, prop, proppath, rawValue, setRawValue, storeValue, type, itemType, status=C.KStatus.DRAFT, domain, q, sort, embed }) => {
	let pvDI = {};
	if (rawValue) {
		pvDI = getDataItem({ type: itemType, id: rawValue, status, domain, swallow: true });
	} 

	assert( ! embed);

	let onChange = e => {
		let id = e.target.value;
		setRawValue(id);
		if (!embed) DSsetValue(proppath, id);
	};

	let pvItemsAll = ActionMan.list({ type: itemType, status, q: rawValue });
	let options = pvItemsAll.value && pvItemsAll.value.hits || [];

	let [ll, setLL] = useState();
	
	// <PropControlAutoComplete getItemValue={getId} options={options} {...{ path, prop, rawValue, setRawValue, storeValue}}
	// renderItem={itm => itm && <DefaultListItem key={itm.id} type={itemType} item={itm} />} />
	
	const SlimListItem = ({type, servlet, navpage, item, sort}) => {
		const onClick = e => {
			setRawValue(getId(item)); 
			DSsetValue(proppath, getId(item));
		};
		return <div style={{border:"1px solid #aaa",margin:0,cursor:"pointer"}} onClick={onClick}>
			{getLogo(item) && <img src={getLogo(item)} className='logo logo-sm' />} {getName(item)}</div>;
	};

	// TODO display the name not the ID getName(pvDI.value). But: handling onChange and setting the id value is fiddly

	const showList = e => {
		console.log("show"); // debug
		setLL(true);
	};
	const hideList = e => {
		console.log("hide..."); // debug
		// a moment's delay to allow moving from the text entry to the list??
		setTimeout(() => {
			console.log("...hide"); // Debug - Why is this so slow to close??
			setLL(false);
		}, 100);
	};
	// (default create behaviour) the input names the object
	if (rawValue && ! base) base = {name:rawValue};
	let baseId = base && base.id;
	if (baseId) delete base.id; // manage CreateButton's defences
	// console.log("render");
	return (
		<Row onFocus={showList} onBlur={hideList}>
			<Col md={8}>
				<Input type='text' value={rawValue || ''} onChange={onChange} />
				{ll && <div className='position-relative'><div className='position-absolute' 
					style={{top:0, left:0, zIndex:1000, background:"rgba(255,255,255,0.8)", border:"1px solid #80bdff", boxShadow: "0 0 0 0.2rem rgb(0 123 255 / 25%)"}}>
					<ListLoad hideTotal type={itemType} status={status} domain={domain} filter={rawValue} unwrapped sort={sort} ListItem={SlimListItem} 
						noResults={canCreate && rawValue && (pvDI.value? <></> : "Make a new "+itemType+" named "+rawValue+"?")}
					/>
				</div></div>}				
			</Col>
			<Col md={4}>
				{pvDI.value && <SlimListItem type={itemType} item={pvDI.value} />}
				{canCreate && rawValue && pvDI.resolved && ! pvDI.value && 
					<CreateButton type={itemType} base={base} id={baseId} saveFn={saveDraftFn} then={({id}) => setRawValue(id)} />}
			</Col>			
		</Row>);
};

registerControl({ type: 'DataItem', $Widget: PropControlDataItem });
export default PropControlDataItem;
