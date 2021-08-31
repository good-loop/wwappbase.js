
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
import { encURI, getLogo } from '../utils/miscutils';
import {saveDraftFn} from './SavePublishDeleteEtc';
import { doShareThing } from '../Shares';

/**
 * TODO a picker with auto-complete for e.g. Advertiser, Agency
 */

/**
 * @param {Object} p
 * @param {?String} p.createProp If a new item is created -- what property should the typed value set? Defaults to "id"
 * @param {?Boolean} embed If true, set a copy of the data-item. By default, what gets set is the ID
 */
const PropControlDataItem = ({canCreate, createProp="id", base, path, prop, proppath, rawValue, setRawValue, storeValue, modelValueFromInput, 
	type, itemType, status=C.KStatus.DRAFT, domain, q, sort, embed, pageSize=20, navpage, notALink
}) => {
	let pvDI = {};
	if (rawValue) {
		pvDI = getDataItem({ type: itemType, id: rawValue, status, domain, swallow: true });
	} 

	// let pvItemsAll = ActionMan.list({ type: itemType, status, q: rawValue });
	// console.log(rawValue, pvItemsAll);
	// let options = pvItemsAll.value && pvItemsAll.value.hits || [];

	let onChange = e => {
		let id = e.target.value;		
		setRawValue(id);
		if (embed) {
			// if embed, only set on-click
			return;
		}
		let mv = modelValueFromInput? modelValueFromInput(id, type, e, storeValue) : id;
		DSsetValue(proppath, mv);
	};

	// show/hide ListLoad
	let [ll, setLL] = useState();
	
	// track the mouse-over 'cos bugs (Feb 2021)
	let [meid, setMeid] = useState();
	const pickme = id => {
		if (id===meid) return;
		setMeid(id);
		// console.log("pickme", meid, id);
	};
	const pickmenot = id => {		
		if (meid===id) setMeid(null);
		// console.log("pickmenot", meid, id);
	};

	const doSet = id => {
		setRawValue(id);
		let mv = embed? Object.assign({}, item) : id;
		if (modelValueFromInput) mv = modelValueFromInput(mv, type, {}, storeValue);
		DSsetValue(proppath, mv);
	};

	const SlimListItem = ({type, servlet, navpage, item, sort, noClick}) => {
		const id = getId(item);
		// Frustratingly, this does not reliably get triggered (bug seen Feb 2021)
		const onClick = noClick? null : e => {
			console.log("PCDI onClick"); // debug				
			doSet(id);
		};
		return (<div style={{border:"1px solid #aaa",margin:0,cursor:"pointer"}} onClick={onClick} 
			onMouseOver={e => pickme(id)} onMouseOut={e => pickmenot(id)}
			title={"ID: "+id}
			>
			{getLogo(item) && <img src={getLogo(item)} className='logo logo-sm' />} {getName(item)} 			
			</div>);
	};

	// TODO display the name not the ID getName(pvDI.value). But: handling onChange and setting the id value is fiddly

	const showList = e => {
		console.log("PCDI show"); // debug
		setLL(true);
	};
	const hideList = e => {
		console.log("PCDI hide...",meid); // Debug
		if (meid) { // HACK fix the no-onClick firing, not-setting bug Feb 2021
			doSet(meid);
		}
		// a moment's delay - otherwise there's a bug where SlimListItem doesn't catch the onClick (it still seems ropey anyway)
		setLL("...");
		setTimeout(() => {
			console.log("PCDI ...hide..."); // Debug - Why is this so slow to close on studio.gl.com?? It makes no sense! Is something interfering with setTimeout?!
			setLL(false);
		}, 300);
		return e;
	};
	// (default create behaviour) the input names the object
	if (rawValue && ! base) {
		base = {};
		base[createProp] = rawValue
	}
	let baseId = base && base.id;
	if (baseId) delete base.id; // manage CreateButton's defences
	// console.log("render");
	
	// allow tab to blur without setting
	const kd = e => {
		if (e.key==="Tab") pickmenot(meid);
	};

	const createThen = (args) => {
		console.warn("createThen", args);
		setRawValue(args.id);
	};

	return (
		<Row onFocus={showList} onBlur={hideList}
			onKeyDown={kd} onMouseOut={e => pickmenot(meid)}
		>
			<Col md={8}>
				<Input type='text' value={rawValue || ''} onChange={onChange} />
				{ll && <div className='position-relative'><div className='position-absolute' // NB: the two divs are needed to "float" the element (float itself doesnt seem to work here)
					style={{float:"left", opacity:ll==="..."?0.25:"inherit", top:0, left:0, zIndex:1000, background:"rgba(255,255,255,0.9)", border:"1px solid #80bdff", boxShadow: "0 0 0 0.2rem rgb(0 123 255 / 25%)"}}>
					{rawValue && <ListLoad hideTotal type={itemType} status={status} domain={domain} filter={rawValue} unwrapped sort={sort} ListItem={SlimListItem} 
						// TODO allow ListLoad to show if there are only a few options
						noResults={canCreate && rawValue && " "} // this was confusing with the create button too (pvDI.value? <></> : "A new "+itemType+" named "+rawValue+" will be made.")}
						pageSize={pageSize}
					/>}
				</div></div>}
			</Col>
			<Col md={4}>
				{pvDI.value && 
					(notALink? 
						<SlimListItem type={itemType} item={pvDI.value} noClick={false} />
						: <a href={"/#"+(navpage||itemType.toLowerCase())+"/"+encURI(getId(pvDI.value))} title={"Switch to editing this "+itemType}><SlimListItem type={itemType} item={pvDI.value} noClick={false} /></a>
					)
				}
				{canCreate && rawValue && pvDI.resolved && ! pvDI.value && 
					<CreateButton type={itemType} base={base} id={baseId} saveFn={saveDraftFn} then={createThen} />}
			</Col>			
		</Row>);
};

registerControl({ type: 'DataItem', $Widget: PropControlDataItem });
export default PropControlDataItem;
