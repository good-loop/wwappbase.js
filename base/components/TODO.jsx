
import React, { useEffect, useRef } from 'react';
import Roles from '../Roles';

const STYLE_TODO = { background: 'rgba(255,128,128,0.5)' };

/**
 Marker for work in progress. If it should slip into production, it is hidden from non-devs
 */
const TODO = ({children}) => {
	if (C.isProduction() && !Roles.isDev()) return null;

	let ref = useRef();
	useEffect(() => {
		if (!ref.current) return;
		console.error("TODO", ref.current.innerText);
	}, [ref.current]);

	return <div ref={ref} style={STYLE_TODO}>{children}</div>;
};

export default TODO;
