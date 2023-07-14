import React, { Component } from 'react';
import Login from '../youagain';

import { getUrlVars, toTitleCase, yessy } from '../utils/miscutils';
import { Alert, Container, Row } from 'reactstrap';
import { isFunction } from 'lodash';
// setup Misc.SavePublishDeleteEtc for older code
import SavePublishDeleteEtc from './SavePublishDeleteEtc';

// Plumbing
import DataStore from '../plumbing/DataStore';
import Roles from '../Roles';
import C from '../CBase';
import Misc from './Misc';
import Share from '../data/Share';
import ServerIO from '../plumbing/ServerIOBase';

// Templates
import MessageBar from './MessageBar';
import NavBar from './NavBar';
import LoginWidget, { LoginPage, setShowLogin } from './LoginWidget';
import { BasicAccountPage } from './AccountPageWidgets';

import E404Page from './E404Page';
import { assert } from '../utils/assert';
import PropControls from './propcontrols/PropControls';

import StyleBlock from './StyleBlock';
import { modifyPage } from '../plumbing/glrouter';

let dummy = PropControls; // keep the PropControls import

// DataStore
C.setupDataStore();
DataStore.update({
	data: {
	},
});


if ( ! C.A) {
	/** HACK define C.A = the normal <a> tag, for optional replacement with import { A } from glrouter
	 * @param {?Object} x
	 * @param {string} x.href url
	 * @param {string|JSX} x.children text/elements to render in the tag
	*/
	// NB: not defined in C.js to avoid making that depend on React
	C.A = (x) => {
		if ( ! x) return null;
		const {children, ...args} = x;
		return <a {...args}>{children}</a>;
	};
}

// Set up login + watcher here, at the highest level
// But after app code finishes loading (so use a timeout)
let initFlag = false;
const init = () => {
	if (initFlag) return;
	initFlag = true;

	// HACK old setup (id is preferred to match App.java)
	if ( ! C.app.id) C.app.id = C.app.service;
	if (C.app.id) {
		C.app.service = C.app.id;
	}

	Login.app = C.app.id || C.app.service;
	Login.dataspace = C.app.dataspace;

	Login.change(() => {
		// ?? should we store and check for "Login was attempted" to guard this??
		if (Login.isLoggedIn()) {
			// close the login dialog on success
			setShowLogin(false);
		}
		// poke React via DataStore (e.g. for Login.error)
		DataStore.update({});
	});
	// Are we logged in?
	Login.verify();
};


/** Apply the specified class to #mainDiv, replacing any class found matching the given regex */
const setMainDivClass = (newClass, regex) => {
	const mainDiv = document.querySelector('#mainDiv');
	if (mainDiv) {
		const prevClass = mainDiv.classList.values().find(cls => {
			return cls.match(regex);
		});
		if (newClass !== prevClass) {
			if (prevClass) mainDiv.classList.remove(prevClass);
			mainDiv.classList.add(newClass);
		}
	}
};

/**
	WARNING: This element will update on changes ...but the calling MainDiv most likely will *not*.
	So the props will remain fixed.

	props:

	homelink: {String} - Relative url for the home-page. Defaults to "/"
	pageForPath: {String:JSX}
	navbarPages: String[]|() => String[]
	navbarLabels: ?String[]|Function|Object 
	navbarChildren: {?JSX|Function -> JSX} Warning: JSX passed in does not get refreshed on update. If you need a refresh - pass in a function `() => <JSX/>`.
	navbarExternalLinks: {?Object}
	navbarDarkTheme: {?boolean}
	navbarBackgroundColour: {?String}
	loginRequired: {?boolean}
	{?String[]} loginServices e.g. ["twitter","facebook"] See LoginWidget({services})
	securityCheck: ({page}) => throw error / return true
	SecurityFailPage: ?JSX
	defaultPage: {String|Function -> String},
	fullWidthPages: String[]
*/
class MainDivBase extends Component {
	// React 16 has deprecated componentWillMount; React 17 will remove the unaliased version.
	// TODO We can probably accomplish all this with a functional component and hooks now.
	componentDidMount() {
		// redraw on change
		const updateReact = (mystate) => this.setState({});
		DataStore.addListener(updateReact);
		// Scroll to top after hashchage (From my-loop MainDiv)
		window.addEventListener("hashchange", () => window.scrollTo(0,0));
	}

	componentDidCatch(error, info) {
		// Display fallback UI
		this.setState({error, info, errorPath: DataStore.getValue('location', 'path')});
		console.error(error, info);
		if (window.onerror) window.onerror("Caught error", null, null, null, error);
	}

	render() {
		init();
		let {
			children,
			homeLink,
			pageForPath,
			securityCheck, SecurityFailPage=DefaultErrorPage,
			loginRequired,
			defaultPage,
			navbar=true, // false for no navbar!
			navbarDarkTheme=true,
			navbarBackgroundColour="dark",
			navbarPages, navbarLabels, navbarChildren,
			navbarLogoClass,
			navbarExternalLinks, // TODO document props
			navbarSpace, // TODO document props
			navbarAccountMenuItems, // Used for MyData - show extra items such as settings etc alongside standard "Account" and "Logout" (only on mobile devices - that's not controlled here)
			navbarAccountLinkText,
			NavGuts, NavExpandSize="md",
			fullWidthPages,
			undecoratedPages, // String[] pages with no navbar or footer
			undecorated, // TODO document props
			canRegister,
			loginService, // OLD code
			loginServices,
			Footer,
			noLoginTitle, // TODO document props
			loginLogo, // TODO document props
			loginSubtitle, // TODO document props
			noSocials, // TODO document props
			loginChildren, // TODO document props
			LoginGuts,
			isBeta // HACK to place a beta label over the logo for SoGive Mar 2022
		} = this.props;
		// navbarPages might be a getter function (needed for a dynamic list) - so the invoking MainDiv can
		// have a dynamic nav page list without being connected to the store itself.
		if (isFunction(navbarPages)) {
			navbarPages = navbarPages();
		}
		if (!navbarPages) navbarPages = Object.keys(pageForPath);

		if (isFunction(homeLink)) {
			homeLink = homeLink();
		}

		// which page?
		let path = DataStore.getValue('location', 'path');
		let page = (path && path[0]);
		if (!page) {
			// defaultPage may be dynamic
			if (isFunction(defaultPage)) defaultPage = defaultPage();
			if (defaultPage) {
				// TODO what is this code solving for? Is it needed??
				// HACK allow my-loop render for now
				window.location.hostname.endsWith('my.good-loop.com') || window.location.hostname.endsWith('mydata.good-loop.com') ? (
					setTimeout(() => modifyPage([defaultPage]), 1)
				) : (
					setTimeout(() => modifyPage([defaultPage]), 1)
				);
				// let the next render get it
			}
			return <Alert color="warning">No page specified - and the app does not set a default</Alert>;
		}
		assert(page);

		let e404 = false;
		let Page = pageForPath[page];
		if (!Page) {
			// basic account?
			if (page === 'account') Page = BasicAccountPage;
			else {
				Page = E404Page;
				e404 = true;
			}
		}

		// error handler
		if (this.state && this.state.error && this.state.errorPath === path) {
			Page = DefaultErrorPage;
		}

		// must login?
		if (loginRequired && !Login.isLoggedIn()) {
			if (Page.noLoginRequired) { // HACK
				// OK
			} else {
				Page = LoginPage;
			}
		} else if (securityCheck) {
			try {
				securityCheck({page});
			} catch(err) {
				Page = () => <SecurityFailPage error={err} />;
			}
		}

		// full screen?
		// Either by page, or for a dynamic setting within a page - HACK set window.fullWidthPage=true/false
		let fluid = (fullWidthPages && fullWidthPages.includes(page)) || window.fullWidthPage || e404;
		if (!undecorated) undecorated = !!DataStore.getUrlValue("undecorated");
		if (!undecorated) undecorated = undecoratedPages && undecoratedPages.includes(page);

		// Hack enabler: Apply some context-specific classes to the outermost container.
		setMainDivClass(`page-${page}`, /page-\w+/);
		setMainDivClass(`logged-${Login.isLoggedIn() ? 'in' : 'out'}`, /logged-\w+/);

		const onNavToggle = (open) => {
			if (open) setMainDivClass('nav-open', /nav-\w+/);
			else setMainDivClass('nav-closed', /nav-\w+/);
		};

		return (<div>
			{/* Make test content visible */ Roles.isTester() && <StyleBlock>{`.TODO {display:block; border:2px dashed yellow;`}</StyleBlock>}
			{navbar && !undecorated && <>
				<NavBar
					page={page}
					pages={navbarPages}
					labels={navbarLabels}
					externalLinks={navbarExternalLinks}
					homelink={homeLink}
					darkTheme={navbarDarkTheme}
					backgroundColour={navbarBackgroundColour}
					NavGuts={NavGuts}
					expandSize={NavExpandSize}
					isBeta={isBeta}
					accountMenuItems={navbarAccountMenuItems}
					accountLinkText={navbarAccountLinkText}
					onToggle={onNavToggle}
					logoClass={navbarLogoClass}
				>
				{_.isFunction(navbarChildren)? navbarChildren() : navbarChildren}
				</NavBar>
				{navbarSpace && <div className="py-4"/> /* why / why-not?? */}
			</>}
			
			<Row>
				<Container fluid={fluid}>
					<MessageBar />
					<div className="page" id={page}>
						<Page />
					</div>
				</Container>
			</Row>
			<Row>
				{Footer && !undecorated && <Footer page={page} />}
			</Row>
			<LoginWidget
				title={noLoginTitle ? null : `Welcome to ${C.app.name}`}
				subtitle={loginSubtitle}
				canRegister={canRegister}
				logo={loginLogo}
				services={canRegister ? [] : (loginServices || loginService)}
				noSocials={noSocials}
				Guts={LoginGuts}
			>
			{_.isFunction(loginChildren)? loginChildren() : loginChildren}
			</LoginWidget>
		</div>);
	} // ./render()
} // ./MainDiv


const DefaultErrorPage = ({error}) => (
	<div>
		<h3 className="mt-2">There was an Error :&#39;</h3>
		<p>Try navigating to a different tab, or reloading the page.
			If this problem persists, please contact support.</p>
		<p>
			{error && error.message}
			<br /><br />
			<small>{error && error.stack}</small>
		</p>
	</div>);

export default MainDivBase;
