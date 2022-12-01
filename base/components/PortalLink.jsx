import React from 'react';
import ServerIO from '../plumbing/ServerIOBase';
import C from '../CBase';
import { getId, getType } from '../data/DataClass';
import { encURI, space } from '../utils/miscutils';


const PortalLink = ({item,size,className,devOnly}) => {
    if (devOnly && ! Roles.isDev()) return null;
    const url = ServerIO.getEndpointForType(getType(item));
    return <C.A className={space(size,devOnly&&"dev-link",className)} href={url+"/"+encURI(getId(item))}>{item.name}</C.A>;
};

export default PortalLink;
