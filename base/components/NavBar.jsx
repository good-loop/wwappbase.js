import React, { useState } from 'react';
import { Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink, Collapse, Nav, Container } from 'reactstrap';

import AccountMenu from './AccountMenu';
import C from '../CBase';
import DataStore from '../plumbing/DataStore';
import { labeller } from '../utils/miscutils';


/**
 * 
 * @param {Object} props 
 * @param {?String} props.brandLink
 * @param {?String} props.brandLogo
 */
export const setNavProps = (props) => {
	DataStore.setValue(['widget','NavBar'], props, false);
};

/**
 * rendered within BS.Nav
 */
const DefaultNavGuts = ({pageLinks, currentPage, children, homelink, isOpen, toggle, brandLink, brandLogo, brandName}) => {
	return (
	<Container>
		<NavbarBrand title="Dashboard" href={homelink || '/'}>
			<img className='logo-sm' alt={C.app.name} src={C.app.homeLogo || C.app.logo} />
		</NavbarBrand>
		{brandLink && (brandLogo || brandName) && <NavbarBrand className="nav-brand" title={brandName} href={brandLink}>
			{brandLogo? <img className='logo-sm' alt={brandName} src={brandLogo} /> : brandName}
		</NavbarBrand>}
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
	};


/**
 *
 * @param {?String} currentPage e.g. 'account' Read from window.location via DataStore if unset.
 * @param {?String} homelink Relative url for the home-page. Defaults to "/"
 * @param {String[]} pages
 * @param {?Object} externalLinks Map page names to external links.
 * @param {?String[]|Function|Object} labels Map options to nice strings.
 * @param {?boolean} darkTheme Whether to style navbar links for a dark theme (use with a dark backgroundColour)
 * @param {?String} backgroundColour Background colour for the nav bar.
 */
const NavBar = ({NavGuts = DefaultNavGuts, ...props}) => {
	// see setNavProps()
	const dsProps = DataStore.getValue(["widget","NavBar"]);
	if (dsProps) {
		props = Object.assign({}, props, dsProps);
	}
	let {currentPage, pages, labels, externalLinks, darkTheme, backgroundColour} = props; // ??This de-ref, and the pass-down of props to NavGuts feels clumsy/opaque
	const labelFn = labeller(pages, labels);

	// Handle nav toggling
	const [isOpen, setIsOpen] = useState(false);
	const close = () => setIsOpen(false);
	const toggle = () => setIsOpen(!isOpen);

	// Fill in current page by inference from location
	if (!currentPage) {
		let path = DataStore.getValue('location', 'path');
		currentPage = path && path[0];
	}
	
	// make the page links
	const pageLinks = pages.map(page => {
		let pageLink = `#${page}`;
		if (externalLinks && page in externalLinks) pageLink = externalLinks[page];
		return( <NavItem key={`navitem_${page}`} active={page === currentPage}>
			<NavLink href={pageLink} onClick={close} >
				{labelFn(page)}
			</NavLink>
		</NavItem>)
	});

	return (
		<Navbar sticky="top" dark={darkTheme} color={backgroundColour} expand="md" className='p-1'>
			<NavGuts {...props} pageLinks={pageLinks} isOpen={isOpen} toggle={toggle} />
		</Navbar>
	);
};
// ./NavBar


export default NavBar;
