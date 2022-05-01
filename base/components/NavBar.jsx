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
	Dropdown,
	DropdownToggle,
	DropdownMenu,
	DropdownItem } from 'reactstrap';
import { assMatch } from '../utils/assert';
import AccountMenu from './AccountMenu';
import C from '../CBase';
import DataStore from '../plumbing/DataStore';
import { encURI, equals, labeller, space } from '../utils/miscutils';
import { getDataItem } from '../plumbing/Crud';
import KStatus from '../data/KStatus';
import DataClass, { getId, getType } from '../data/DataClass';
import CloseButton from './CloseButton';


class NavProps {
	/** can contain nulls */
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

	brandId;
	brandType;
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
	/**
	 * @type {?Any} other renderables to display on the right side
	 */
	extraContent;
};

/**
 * 
 * @param {NavProps|DataClass} props e.g. brandLink brandName brandLogo, or an Advertiser or NGO
 */
export const setNavProps = (props) => {
	// extract props from a DataItem
	if (DataClass.isa(props)) {
		const item = props;
		props = { // advertiser link and logo			
			brandId: getId(item),
			brandType: getType(item),
			brandLink: ""+window.location,
			brandLogo: item.branding? (item.branding.logo_white || item.branding.logo) : item.logo,
			brandName: item.name || getId(item)
		};	
	}

	// NB: update if not equals, which avoids the infinite loop bug of default update behaviour
	if (equals(getNavProps(), props)) {
		return; // no-op
	}
	DataStore.setValue(['widget','NavBar'], props);
};

/**
 * 
 * @returns {?NavProps}
 */
export const getNavProps = () => DataStore.getValue(['widget','NavBar']) || DataStore.setValue(['widget','NavBar'], {}, false);

/**
 * rendered within BS.Nav
 * @param {NavProps} p
 * isBeta HACK to place a beta label over the logo for SoGive Mar 2022
 */
const DefaultNavGuts = ({pageLinks, currentPage, children, homelink, isOpen, toggle, brandLink, brandLogo, brandName, onLinkClick, isBeta, accountMenuItems}) => {
	// Hack: remove logo classname for myGL to advoid Safari CSS bug
	let logoClass = 'logo';
	if (window.location.host.includes('my.good-loop.com')) logoClass = '';

	return (<>
		<C.A href={homelink || '/'} className="navbar-brand" title={space(C.app.name, "- Home")} onClick={onLinkClick}>
			<img className={logoClass} alt={C.app.name} src={C.app.homeLogo || C.app.logo} />
			{isBeta && <span style={{position:'sticky',top:'100%',color:'grey'}}>beta</span>}
		</C.A>
		{brandLink && (brandLogo || brandName) && // a 2nd brand?
			<div className='position-relative'>
				<C.A href={brandLink} className="navbar-brand" onClick={onLinkClick}>				
					{brandLogo? <img className={logoClass} alt={brandName} src={brandLogo} /> : brandName}
				</C.A>
				{brandLink !== ""+window.location 
					&& <CloseButton style={{position:"absolute", bottom:0, right:"0.8em"}} onClick={e => setNavProps(null)} size="sm" tooltip={`include content beyond ${brandName}'s micro-site`} />}
			</div>
		}
		<NavbarToggler onClick={toggle}/>
		<Collapse isOpen={isOpen} navbar>
			<Nav navbar className="page-links justify-content-start" style={{flexGrow:1}}>
				{pageLinks}
			</Nav>
			{children}
			<AccountMenu active={currentPage === 'account'} accountMenuItems={accountMenuItems} className="mx-2 mt-2 mt-md-0"/>
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
const NavBar = ({NavGuts = DefaultNavGuts, accountMenuItems, children, expandSize="md", ...props}) => {
	// allow other bits of code (i.e. pages below MainDiv) to poke at the navbar
	const navProps = getNavProps();
	if (navProps) {
		props = Object.assign({}, props, navProps);
	}
	let {currentPage, pages, labels, externalLinks, darkTheme, shadow, backgroundColour} = props; // ??This de-ref, and the pass-down of props to NavGuts feels clumsy/opaque

	// Handle nav toggling
	const [isOpen, setIsOpen] = useState(false); // what is open?? the whole menu (mobile) or a dropdown??
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

	const onLinkClick = () => {
		close();
	};

	/**
	 * @param {Object} p
	 * @param {!String} p.page
	 * @param {!String|JSX} p.children
	 */
	const PageNavLink = ({page, className, children}) => {
		let pageLink = DataStore.localUrl + page.replace(" ", "-");
		if (externalLinks && page in externalLinks) pageLink = externalLinks[page];
		return (
			<C.A className={space("nav-link", className)} href={pageLink} onClick={onLinkClick} >
				{children}
			</C.A>
		)
	}

	// make the page links
	// Accepts a page links format as:
	// {title1: [page1, page2, ...], page3:[], ...}
	// for dropdowns, or, for simpler setups, just an array of strings

	const NLink = ({page, isTop}) => {
		assMatch(page, String);
		// Don't put NavItems inside dropdowns! React screams at us about incorrectly nesting <li> elements.
		const Item = isTop ? NavItem : DropdownItem;
		return (
			<Item key={page} className={isTop && 'top-level'} active={page === currentPage}>
				<PageNavLink page={page} >
					{labelFn(page)}
				</PageNavLink>
			</Item>
		);
	};

	const NDropDown = ({title, i}) => {
		const [open, setOpen] = useState(false);
		return <Dropdown isOpen={open} toggle={() => setOpen(!open)} key={title} nav inNavbar className='top-level'>
			<DropdownToggle nav caret>{labelFn(title)}</DropdownToggle>
			<DropdownMenu>
				{pages[title].filter(page => page).map((page, j) => (
					<NLink key={page} page={page} />
				))}
			</DropdownMenu>
		</Dropdown>;
	};

	let pageLinks;
	if (simplePagesSetup) {
		pageLinks = pages.map((page,i) => <NLink key={page} page={page} isTop />);
	} else {
		pageLinks = Object.keys(pages).map((title, i) => {
			// Some page links can come in collections - make sure to account for that
			let subPages = pages[title];
			if ( ! title || subPages===false) {
				return null; // switched off e.g. not logged in or type of user
			}
			if (subPages && subPages.length) {
				return <NDropDown title={title} i={i} key={title}/>
			}
			// Title is a single page, not a category
			return <NLink key={title} page={title} isTop />;
		});
	} // ./pageLinks

	return (
		<Navbar sticky="top" dark={darkTheme} light={!darkTheme} color={backgroundColour} expand={expandSize} className={space('p-1', scrolled && "scrolled")} >
			<NavGuts {...props} pageLinks={pageLinks} isOpen={isOpen} toggle={toggle} onLinkClick={onLinkClick} accountMenuItems={accountMenuItems}>
				{children}
			</NavGuts>
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
