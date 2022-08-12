
import React, { useState } from 'react';
import _ from 'lodash';
import { Input, Row, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Button, ButtonGroup } from 'reactstrap';
import DataClass, { getId, getName, getType } from '../data/DataClass';
import { getDataItem } from '../plumbing/Crud';
import { encURI, getLogo } from '../utils/miscutils';
import KStatus from '../data/KStatus';


/**
 * 
 * @param {Object} p
 * @param {?DataClass} p.item Specify item or id + type
 * @param {?string} p.id
 * @param {?string} p.type 
 * @param {?KStatus} p.status Only used if `item` isn't set.
 */
const DataItemBadge = ({item, id, type, status=KStatus.PUBLISHED, onClick, href, className, ...rest}) => {
    if ( ! item) {
        let pvItem = getDataItem({type, id, status});
        item = pvItem.value || {id, type};
    }
    const Tag = href? 'a' : 'div';
    // if (href===true) { TODO if `true` then put together a url
    //     href = getDataItemLink(item);
    // }
    return <Tag className="DataItemBadge" onClick={onClick} href={href} title={`ID: ${getId(item)}`}>
        {getLogo(item) ? <img src={getLogo(item)} className="logo logo-sm" /> : <span className="d-inline-block logo logo-sm" />}{' '}
        {getName(item) || getId(item)}
    </Tag>;
};

// export const getDataItemLink = (item) => {
//     if ( ! item) return null;
//     const id = getId(item);
//     const type = getType(item);
//     if ( ! type || ! id) return null;
//     let glService = "portal";
//     return "https://"+glService+"good-loop.com/"+type.toLowerCase()+"/"+encURI(id);
// };

export default DataItemBadge;

