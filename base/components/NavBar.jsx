import React, { useState, useEffect } from 'react';
import {
	Navbar,
	NavbarBrand,
	NavbarToggler,
	NavItem, 
	NavLink,
	Collapse,
	Nav,
	Container,
	UncontrolledDropdown,
	DropdownToggle,
	DropdownMenu,
	DropdownItem } from 'reactstrap';

import AccountMenu from './AccountMenu';
import C from '../CBase';
import DataStore from '../plumbing/DataStore';
import { encURI, equals, labeller, space } from '../utils/miscutils';
import { getDataItem } from '../plumbing/Crud';
import KStatus from '../data/KStatus';


class NavProps {
	pageLinks;	
	currentPage; 
	children;
	/**
	 * @type {?Boolean}
	 */
	darkTheme;
	/**
	 * @type {?String} a BS colour
	 */
	backgroundColour;
	homelink; 
	isOpen; 
	toggle; 

	/**
	 * @type {?String} url for 2nd brand home page
	 */
	brandLink; 
	/**
	 * @type {?String} logo for 2nd brand
	 */
	brandLogo; 
	/**
	 * @type {?String} name for 2nd brand
	 */
	brandName;
};

/**
 * 
 * @param {NavProps} props 
 */
export const setNavProps = (props) => {
	// NB: update if not equals, which avoids the infinite loop bug of default update behaviour
	if (equals(getNavProps(), props)) {
		return; // no-op
	}
	DataStore.setValue(['widget','NavBar'], props);
};

const getNavProps = () => DataStore.getValue(['widget','NavBar']) || DataStore.setValue(['widget','NavBar'], {}, false);

/**
 * rendered within BS.Nav
 * @param {NavProps} p
 */
const DefaultNavGuts = ({pageLinks, currentPage, children, homelink, isOpen, toggle, brandLink, brandLogo, brandName}) => {
	return (<>
		<C.A href={homelink || '/'}>
			<NavbarBrand title="Dashboard">
				<img className='logo' alt={C.app.name} src={C.app.homeLogo || C.app.logo} />
			</NavbarBrand>
		</C.A>
		{brandLink && (brandLogo || brandName) && // a 2nd brand?
			<NavbarBrand className="nav-brand" title={brandName} href={brandLink}>
				{brandLogo? <img className='logo' alt={brandName} src={brandLogo} /> : brandName}
			</NavbarBrand>
		}
		<NavbarToggler onClick={toggle}/>
		<Collapse isOpen={isOpen} navbar>
			<Nav navbar className="page-links justify-content-start" style={{flexGrow:1}}>
				{pageLinks}
			</Nav>
			{children}
			<AccountMenu active={currentPage === 'account'} style={{flexGrow:0.5}}/>
		</Collapse>
	</>);
};


/**
 * @param {NavProps} props
 * @param {?String} currentPage e.g. 'account' Read from window.location via DataStore if unset.
 * @param {?String} homelink Relative url for the home-page. Defaults to "/"
 * @param {String[]} pages
 * @param {?Object} externalLinks Map page names to external links.
 * @param {?String[]|Function|Object} labels Map options to nice strings.
 * @param {?boolean} darkTheme Whether to style navbar links for a dark theme (use with a dark backgroundColour)
 * @param {?String} backgroundColour Background colour for the nav bar.
 */
const NavBar = ({NavGuts = DefaultNavGuts, ...props}) => {
	// allow other bits of code (i.e. pages below MainDiv) to poke at the navbar
	const navProps = getNavProps();
	if (navProps) {
		props = Object.assign({}, props, navProps);
	}
	let {currentPage, pages, labels, externalLinks, darkTheme, shadow, backgroundColour} = props; // ??This de-ref, and the pass-down of props to NavGuts feels clumsy/opaque

	// Handle nav toggling
	const [isOpen, setIsOpen] = useState(false);
	const close = () => setIsOpen(false);
	const toggle = () => setIsOpen(!isOpen);

	const [scrolled, setScrolled] = useState(false);
	const checkScroll = () => {
		setScrolled(window.scrollY > 50);
	}
	useEffect (() => {
		checkScroll();
		window.addEventListener('scroll', checkScroll);
		return () => window.removeEventListener('scroll', checkScroll);
	}, []);

	// Fill in current page by inference from location
	if (!currentPage) {
		let path = DataStore.getValue('location', 'path');
		currentPage = path && path[0];
	}

	// If the pages are just a list of strings, we can simplify the render process
	const simplePagesSetup = Array.isArray(pages);
	const labelFn = labeller(pages, labels);

	const getPageLink = (page, label) => {
		let pageLink = (DataStore.usePathname? '/' : '#') + page.replace(" ", "-");
		if (externalLinks && page in externalLinks) pageLink = externalLinks[page];
		return (
			<C.A className="nav-link" href={pageLink} onClick={close} >
				{label || labelFn(page)}
			</C.A>
		)
	};

	// make the page links
	// Accepts a page links format as:
	// {title1: [page1, page2, ...], page3:[], ...}
	// for dropdowns, or, for simpler setups, just an array of strings
	let pageLinks;
	if (simplePagesSetup) {
		pageLinks = pages.map(page => (
			<NavItem key={`navitem_${page}`} active={page === currentPage}>
				{getPageLink(page)}
			</NavItem>
		));
	} else {
		pageLinks = Object.keys(pages).map((title, i) => {
			// Some page links can come in collections - make sure to account for that
			if (pages[title].length > 0) {
				return (
					<UncontrolledDropdown key={`navitem_${title}`} nav inNavbar>
						<DropdownToggle nav caret>{(labels && Object.keys(labels)[i]) || title}</DropdownToggle>
						<DropdownMenu>
							{pages[title].map((page, j) => (
								<DropdownItem key={`navitem_${page}`} active={page === currentPage}>
									{getPageLink(page, labels && labels[Object.keys(labels)[i]][j])}
								</DropdownItem>
							))}
						</DropdownMenu>
					</UncontrolledDropdown>
				);
			} else {
				// Title is a single page, not a category
				return (
					<NavItem key={`navitem_${title}`} active={title === currentPage}>
						{getPageLink(title, (labels && Object.keys(labels)[i]) || title)}
					</NavItem>
				);
			}
		});
	}

	return (
		<Navbar sticky="top" dark={darkTheme} light={!darkTheme} color={backgroundColour} expand="md" className={space('p-1', scrolled && "scrolled")} >
			<NavGuts {...props} pageLinks={pageLinks} isOpen={isOpen} toggle={toggle} />
		</Navbar>
	);
};
// ./NavBar


const CONTEXT = {};

export const setNavContext = (type, id, processLogo) => {
	CONTEXT[type] = id;
	if ( ! processLogo) return;
	// process for 2nd logo
	let pvAdvertiser = id && getDataItem({type, id, status:KStatus.PUB_OR_DRAFT, swallow:true});
	const advertiser = pvAdvertiser && pvAdvertiser.value;	
	if ( ! advertiser) {		
		setNavProps({brandLink:null,brandLogo:null,brandName:null}); // reset blank
		return;
	}

	let nprops = { // advertiser link and logo
		brandLink:'/#'+type.toLowerCase()+'/'+encURI(id), // HACK assumes our #type url layout
		// prefer white silhouette for safe colours vs backdrop
		brandLogo: (advertiser.branding && (advertiser.branding.logo_white || advertiser.branding.logo)) || advertiser.logo, // HACK assumes branding object
		brandName: advertiser.name || id
	};
	setNavProps(nprops);
};

/**
 * 
 * @param {C.TYPES} type 
 * @returns {?String} id E.g. an advertiser id
 */
export const getNavContext = (type) => {
	return CONTEXT[type];
};

export default NavBar;
export {
	NavProps
}
