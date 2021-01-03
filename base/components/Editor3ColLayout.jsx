import React, { useState } from 'react';
import { Container, Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import {getScreenSize} from '../utils/miscutils';
import ErrorBoundary from './ErrorBoundary';

/**
 * @param {JSX[]} children 1 to 3 elements, for left (optional), main, right
 * @param {?Boolean} showAll If true, then all panes are always shown -- on small devices: left as slide-out nav (TODO), right underneath.
 */
const Editor3ColLayout = ({children, showAll}) => {
	const sz = getScreenSize();
	if (children.length > 3) {
		console.error("Editor3ColLayout - Too many children", children);
	}
	// const is3 = children.length > 2;
	// const leftNav = is3? children[0] : null;
	// const mainPane = is3? children[1] : children[0];
	// const rightPane = is3? children[2] : children[1];

	// // ?? make left also no-vertical scroll (but I think this is not as easy as for right)
	// let showLeft = (sz==='md' || sz==='lg' || sz==='xl') && is3;
	// let showRight = (sz==='lg' || sz==='xl') && rightPane;

	return (<div className='flex-row position-relative'>
		{children}
	</div>);
};

// margin-left 0 IF there is a LeftSidebar
const MainPane = ({children}) => <Container><ErrorBoundary>{children}</ErrorBoundary></Container>

const LeftSidebar = ({children}) => {
	return <div className='mt-1 mr-0' style={{maxWidth:"30%", position:"sticky", top:0}} >{children}</div>; // TODO use a slide-out tray if space is limited
};
const RightSidebar = ({children}) => {
	return <div className='mt-1 flex-grow' style={{overflow:"scroll-y"}}><ErrorBoundary>{children}</ErrorBoundary></div>;
};

/**
 * TODO a slide-out tray, typically for in-page nav
 */
const Tray = ({children}) => {
	return <div>{children}</div>;
};
export {
	LeftSidebar,
	MainPane,
	RightSidebar
}
export default Editor3ColLayout;