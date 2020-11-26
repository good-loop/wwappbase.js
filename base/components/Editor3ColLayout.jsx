import React, { useState } from 'react';
import { Container, Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import {getScreenSize} from '../utils/miscutils';

/**
 * @param {JSX[]} children 1 to 3 elements, for left (optional), main, right
 */
const Editor3ColLayout = ({children}) => {
	const sz = getScreenSize();
	if (children.length > 3) {
		console.error("Editor3ColLayout - Truncating to 3", children);
	}
	const is3 = children.length > 2;
	const leftNav = is3? children[0] : null;
	const mainPane = is3? children[1] : children[0];
	const rightPane = is3? children[2] : children[1];

	// ?? make left also no-vertical scroll (but I think this is not as easy as for right)
	
	return (<div className='flex-row'>
		{(sz==='md' || sz==='lg' || sz==='xl') && is3 && <div className='mt-1'><div>{leftNav}</div></div>}
		<Container>{mainPane}</Container>
		{(sz==='lg' || sz==='xl') && rightPane && <div className='mt-1 flex-grow'><div className='position-fixed'>{rightPane}</div></div>}
	</div>);
};

export default Editor3ColLayout;