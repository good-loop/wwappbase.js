import React, { useState } from 'react';
import { Container, Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import {getScreenSize} from '../utils/miscutils';

/**
 * @param {JSX[]} children 1 to 3 elements, for left (optional), main, right
 * @param {?Boolean} showAll If true, then all panes are always shown -- on small devices: left as slide-out nav (TODO), right underneath.
 */
const Editor3ColLayout = ({children, showAll}) => {
	const sz = getScreenSize();
	if (children.length > 3) {
		console.error("Editor3ColLayout - Truncating to 3", children);
	}
	const is3 = children.length > 2;
	const leftNav = is3? children[0] : null;
	const mainPane = is3? children[1] : children[0];
	const rightPane = is3? children[2] : children[1];

	// ?? make left also no-vertical scroll (but I think this is not as easy as for right)
	let showLeft = (sz==='md' || sz==='lg' || sz==='xl') && is3;
	let showRight = (sz==='lg' || sz==='xl') && rightPane;

	return (<div className='flex-row'>
		{showLeft && <div className='mt-1'><div>{leftNav}</div></div>}
		{showAll && ! showLeft && <Tray>{leftNav}</Tray>}
		<Container>{mainPane}</Container>
		{showRight && <div className='mt-1 flex-grow' style={{overflow:"scroll-y"}}>{rightPane}</div>}
		{showAll && ! showRight && rightPane && <Container>{rightPane}</Container>}
	</div>);
};

/**
 * TODO a slide-out tray, typically for in-page nav
 */
const Tray = ({children}) => {
	return <div>{children}</div>;
};

export default Editor3ColLayout;