import React from 'react';

import AccountMenu from './AccountMenu';
import C from '../CBase';
import Roles from '../Roles';
import DataStore from '../plumbing/DataStore';

const DefaultNavBar = ({pageLinks, currentPage, children, homelink}) => (
			<div className="container">
				<div className="navbar-header" title="Dashboard">
					<button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
						<span className="sr-only">Toggle navigation</span>
						<span className="icon-bar" /><span className="icon-bar" /><span className="icon-bar" />
					</button>
					<a className="navbar-brand" href={homelink || '/'}>
						<img alt={C.app.name} src={C.app.homeLogo || C.app.logo} />
					</a>
				</div>
				<div id="navbar" className="navbar-collapse collapse">
					<ul className="nav navbar-nav">
						{pageLinks}
					</ul>
					{children}
					<div>
						<AccountMenu active={currentPage === 'account'} />
					</div>
				</div>
			</div>
);

/**
 * 
 * @param {?String} currentPage e.g. 'account' Read from window.location via DataStore if unset.
 * @param {?String} homelink Relative url for the home-page. Defaults to "/"
 * @param {String[]} pages
 */
const NavBar = ({currentPage, pages, children, homelink, render=DefaultNavBar}) => {
	if ( ! currentPage) {
		let path = DataStore.getValue('location', 'path');
		let currentPage = path && path[0];
	}
	// make the page links
	let pageLinks = pages.map( p => <NavLink currentPage={currentPage} targetPage={p} key={'li_'+p} /> );
	return (
		<nav className="navbar navbar-fixed-top navbar-inverse">
			{ render({pageLinks, currentPage, children, homelink}) }
		</nav>
	);
};
// ./NavBar


// NB: the react-bootstrap version of this with Navbar, NavItem seems to have bugs in NavItem's handling of clicks :'(
// ...yep, react-bootstrap's navbar has been broken for a year https://github.com/react-bootstrap/react-bootstrap/issues/2365
// So we solve ourselves, with a custom on-click
const navClick = (e) => {
	// close the menu in mobile mode
	let openMobileMenu = $('#navbar.collapse.in');
	if (openMobileMenu.length) {
		console.warn("better close it!")
		$('button.navbar-toggle').click();
	}
};

const NavLink = ({currentPage, targetPage, name}) => {
	return (<li className={currentPage === targetPage? 'active' : ''}>
				<a className="nav-item nav-link" href={'#'+targetPage} onClick={navClick} >
					{name || targetPage}
				</a>
			</li>);
};

export default NavBar;
