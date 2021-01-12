
import React, { useState } from 'react';

import _ from 'lodash';
import PropControl, { DSsetValue, registerControl } from './PropControl';
import PropControlAutoComplete from './PropControlAutoComplete';
import { Input } from 'reactstrap';
import DataStore from '../plumbing/DataStore';
import ActionMan from '../../plumbing/ActionMan';
import ListLoad, { DefaultListItem } from './ListLoad';
import { getDataItem } from '../plumbing/Crud';
import { getId, getName } from '../data/DataClass';
import Misc from './Misc';
import { assert } from '../utils/assert';
import { getLogo } from '../utils/miscutils';
/**
 * TODO a picker with auto-complete for e.g. Advertiser, Agency
 */

/**
 * 
 * @param {?Boolean} embed If true, set a copy of the data-item. By default, what gets set is the ID
 */
const PropControlDataItem = ({ path, prop, proppath, rawValue, setRawValue, storeValue, type, itemType, status, domain, q, sort, embed }) => {

	let pvDI = rawValue ? getDataItem({ type: itemType, id: rawValue, status, domain, swallow: true }) : {};

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
		return <div style={{border:"1px solid #aaa",margin:0}} onClick={e => {setRawValue(getId(item)); DSsetValue(proppath, getId(item));}}>
			{getLogo(item) && <img src={getLogo(item)} className='logo logo-sm' />} {getName(item)}</div>;
	};

	return (<div className='flex-row' onFocus={e => setLL(true)} onBlur={e => setTimeout(() => setLL(false), 500)}>
		<div>			
			<Input type='text' value={rawValue || ''} onChange={onChange} />
			{ll && <div className='position-relative'><div className='position-absolute' style={{top:0, left:0, zIndex:1000, border:"1px solid #666"}}>
				<ListLoad hideTotal type={itemType} status={status} domain={domain} q={rawValue} unwrapped sort={sort} ListItem={SlimListItem} />
			</div></div>}
		</div>
		<div>{pvDI.value && <SlimListItem type={itemType} item={pvDI.value} />}</div>
	</div>);
};


registerControl({ type: 'DataItem', $Widget: PropControlDataItem });
export default PropControlDataItem;
