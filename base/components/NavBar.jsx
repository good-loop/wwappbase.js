import React, { useState } from 'react';
import { Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink, Collapse, Nav, Container } from 'reactstrap';

import AccountMenu from './AccountMenu';
import C from '../CBase';
import DataStore from '../plumbing/DataStore';


/**
 * rendered within BS.Nav
 */
const DefaultNavGuts = ({pageLinks, currentPage, children, homelink, isOpen, toggle}) => (
	<Container>
		<NavbarBrand title="Dashboard" href={homelink || '/'}>
			<img alt={C.app.name} src={C.app.homeLogo || C.app.logo} />
		</NavbarBrand>
		<NavbarToggler onClick={toggle}/>
		<Collapse isOpen={isOpen} navbar>
			<Nav navbar>
				{pageLinks}
			</Nav>
			{children}
			<AccountMenu active={currentPage === 'account'} />
		</Collapse>
	</Container>
);


/**
 *
 * @param {?String} currentPage e.g. 'account' Read from window.location via DataStore if unset.
 * @param {?String} homelink Relative url for the home-page. Defaults to "/"
 * @param {String[]} pages
 */
const NavBar = ({NavGuts = DefaultNavGuts, ...props}) => {
	let {currentPage, pages} = props;

	// Handle nav toggling
	// TODO Is this necessary with reactstrap?
	const [isOpen, setIsOpen] = useState(false);
	const close = () => setIsOpen(false);
	const toggle = () => setIsOpen(!isOpen);

	// Fill in current page by inference from location
	if (!currentPage) {
		let path = DataStore.getValue('location', 'path');
		currentPage = path && path[0];
	}

	// make the page links
	props.pageLinks = pages.map(page => (
		<NavItem key={`navitem_${page}`} active={page === currentPage}>
			<NavLink href={`#${page}`} onClick={close} >
				{name || page}
			</NavLink>
		</NavItem>
	));

	return (
		<Navbar sticky="top" dark color="dark" expand="md">
			<NavGuts {...props} isOpen={isOpen} toggle={toggle} />
		</Navbar>
	);
};
// ./NavBar


export default NavBar;
