

import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { Input, Row, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Button, ButtonGroup } from 'reactstrap';

import ListLoad, {CreateButton} from './ListLoad';

import C from '../CBase';
import PropControl, { DSsetValue, PropControlParams, registerControl } from './PropControl';
import ActionMan from '../plumbing/ActionManBase';
import { getDataItem, getDataList } from '../plumbing/Crud';
import { getId, getName } from '../data/DataClass';
import { assert } from '../utils/assert';
import { encURI, getLogo, space } from '../utils/miscutils';
import {saveDraftFnFactory} from './SavePublishDeleteEtc';
import { doShareThing } from '../Shares';
import { A } from '../plumbing/glrouter';
import DataItemBadge from './DataItemBadge';
import KStatus from '../data/KStatus';
import SearchQuery from '../searchquery';
import PropControlList from './PropControlList';
import PropControlDataItem from './PropControlDataItem';


const PropControlDataItemList2 = ({linkProp, linkValue, Viewer, canCreate, createProp="id", base, path, prop, proppath, rawValue, setRawValue, storeValue, modelValueFromInput, 
	type, itemType, status=KStatus.PUB_OR_DRAFT, domain, list, sort, embed, pageSize=20, navpage, notALink, readOnly, showId=true,
}) => {
	if ( ! Viewer) {
        Viewer = ({item}) => <DataItemBadge item={item} href />;
    }
	let q = SearchQuery.setProp(null, linkProp, linkValue).query;
	let pvDebits = getDataList({type:itemType, status, q});
    let debits = List.hits(pvDebits.value) || []; 
    // const setLinkedDebit = debitId => {        
    //     console.warn("set debitId", debitId);
    //     if ( ! debitId) {
    //         if (debit) {
    //             let previous = deepCopy(debit);
    //             debit.creditId = null;
    //             if (debit.status===KStatus.PUBLISHED || debit.status===KStatus.MODIFIED) {
    //                 publishEdits({item:debit, previous}); // Not ideal ...but avoids a bug where this wont go away
    //             } else {
    //                 saveEdits({item:debit, previous});  
    //             }
    //             DataStore.invalidateList("ImpactDebit");
    //         }
    //         return;
    //     }
    //     console.warn("debitId", debitId);
    //     let pvDebit = getDataItem({type:C.TYPES.ImpactDebit, id:debitId, status:KStatus.DRAFT});
    //     pvDebit.promise.then(debit => {
    //         console.warn("TODO set debit", debit);
    //         debit.creditId = item.id;
    //         saveEdits({item:debit});            
    //     });
    // };

	const setList=(a,b) => console.warn("TODOsetList",a,b);

	const setItem=(a,b) => console.warn("TODOsetItem",a,b);

	return <>
    <PropControlList itemType={itemType} value={debits} prop="TODO" set={setList} Viewer={Viewer} Editor={false} canCreate={canCreate} />
    <PropControlDataItem itemType={itemType} q={linkProp+":unset"} set={setItem} />
    </>;
};


registerControl({ type: 'DataItemList', $Widget: PropControlDataItemList2 });

/**
 * A picker with auto-complete for e.g. Advertiser, Agency
 * @param {PropControlParams} p 
 * @param {!String} p.itemType
 * @param {?Object} p.base Used with canCreate, a base object for if a new item is created.
 * @param {?boolean} p.canCreate Offer a create button
 * @param {?String} p.createProp If a new item is created -- what property should the typed value set? Defaults to "id"
 * @param {String} p.linkProp e.g. jobNumber
 * @param {String} p.linkValue
 * @param {?String} p.status Defaults to PUB_OR_DRAFT
 * @param {?String} p.q Optional search query (user input will add to this). Usually unset.
 * @param {?String} p.list Optional list to use (instead of querying the server). Usually unset.
 * @param {JSX|boolean} p.Viewer {path, item, i} Set false to use the Editor.
 */
const PropControlDataItemList = (p) => <PropControl type="DataItemList" set={(a,b,c) => console.warn("TODO",a,b,c)} {...p} />;

export default PropControlDataItemList;
