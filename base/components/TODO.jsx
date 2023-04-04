
import React, { useRef } from 'react';
import Roles from '../Roles';
import { space } from '../utils/miscutils';

/**
 Marker for work in progress. If it should slip into production, it is hidden from non-devs
 */
const TODO = ({children}) => {
    let ref = useRef();    
    console.error("TODO", ref.current?.innerText);    
    let style = {background:"rgba(255,128,128,0.5)"};
    if (C.isProduction() && ! Roles.isDev()) {
        style = {display:"none"};
    } 
	return <div ref={ref} style={style}>{children}</div>;
};

export default TODO;
