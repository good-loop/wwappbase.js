import React from 'react';
import ServerIO from '../plumbing/ServerIOBase';
import C from '../CBase';
import { getId, getType } from '../data/DataClass';
import { encURI, space } from '../utils/miscutils';
import Roles from '../Roles';


/**
 * An internal link
 * @param {Object} p
 * @param {?boolean} devOnly
 */
const PortalLink = ({item,size,className,devOnly}) => {
    if (devOnly && ! Roles.isDev()) return null;
    let url = ServerIO.getEndpointForType(getType(item));
    url = url.replace("good-loop.com/", "good-loop.com/#"); // hack: switch from servlet to editor page    
    return <C.A className={space(size,devOnly&&"dev-link",className)} href={url+"/"+encURI(getId(item))}>{item.name}</C.A>;
};

export default PortalLink;
