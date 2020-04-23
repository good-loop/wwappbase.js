import React, { Component } from 'react';
import Login from 'you-again';
import { assert, assMatch } from 'sjtest';
import { getUrlVars, toTitleCase, modifyHash, yessy } from 'wwutils';
import { Container } from 'reactstrap';
import { isFunction } from 'lodash';

// Plumbing
import DataStore from '../plumbing/DataStore';
import Roles from '../Roles';
import C from '../../C';
import Misc from './Misc';
import Share from '../data/Share';
import ServerIO from '../plumbing/ServerIOBase';

// Templates
import MessageBar from './MessageBar';
import NavBar from './NavBar';
import LoginWidget, { setShowLogin } from './LoginWidget';



// DataStore
C.setupDataStore();
DataStore.update({
	data: {
	},
});

// Set up login + watcher here, at the highest level
// But after app code finishes loading (so use a timeout)
let initFlag = false;
const init = () => {
	if (initFlag) return;
	initFlag = true;

	Login.app = C.app.service;

	Login.change(() => {
		// ?? should we store and check for "Login was attempted" to guard this??
		if (Login.isLoggedIn()) {
			// close the login dialog on success		
			setShowLogin(false);
		} else {
			// poke React via DataStore (e.g. for Login.error)
			DataStore.update({});
		}
	});
	// Are we logged in?
	Login.verify();
};

/**
		Top-level: tabs
	props:
	pageForPath: {String:JSX}
	navbarPages: String[]
	securityCheck: ({page}) => throw error / return true
	SecurityFailPage: ?JSX
	defaultPage: String
*/
class MainDivBase extends Component {
	// React 16 has deprecated componentWillMount; React 17 will remove the unaliased version.
	// TODO We can probably accomplish all this with a functional component and hooks now.
	componentDidMount() {
		// redraw on change
		const updateReact = (mystate) => this.setState({});
		DataStore.addListener(updateReact);
	}

	componentDidCatch(error, info) {
		// Display fallback UI
		this.setState({error, info, errorPath: DataStore.getValue('location', 'path')});
		console.error(error, info);
		if (window.onerror) window.onerror("Caught error", null, null, null, error);
	}

	render() {
		init();
		let {pageForPath, navbarPages, securityCheck, SecurityFailPage, defaultPage} = this.props;
		// navbarPages might be a getter function now - so the invoking MainDiv can
		// have a dynamic nav page list without being connected to the store itself.
		if (isFunction(navbarPages)) navbarPages = navbarPages();
		if (!navbarPages) navbarPages = Object.keys(pageForPath);

		// which page?
		let path = DataStore.getValue('location', 'path');
		let page = (path && path[0]);
		if (!page) {
			// defaultPage may be dynamic
			if (isFunction(defaultPage)) defaultPage = defaultPage();
			if (defaultPage) {
				setTimeout(() => modifyHash(defaultPage), 1); // let the next render get it
			}
			return <Misc.Loading />;
		}
		assert(page);

		let Page = pageForPath[page];
		if ( ! Page) {
			Page = E404Page;
		}
		// error handler
		if (this.state && this.state.error && this.state.errorPath === path) {
			Page = DefaultErrorPage;
		}
		// must login and be an admin for most pages
		if (securityCheck) {
			try {
				securityCheck({page});
			} catch(err) {
				Page = () => <SecurityFailPage error={err} /> || <DefaultErrorPage error={err} />;
			}
		}
		// nav		
		if (ServerIO.mixPanelTrack ) ServerIO.mixPanelTrack({mixPanelTag: 'Page rendered: ' + page, data: {user: Login.getId()}});

		return (
			<div>
				<NavBar page={page} pages={navbarPages}>
				</NavBar>
				<Container>
					<MessageBar />
					<div className='page' id={page}>
						<Page />
					</div>
				</Container>
				<LoginWidget title={`Welcome to ${C.app.name}`} />
			</div>
		);
	} // ./render()
} // ./MainDiv


const DefaultErrorPage = ({error}) => (
	<div>
		<h3>There was an Error :&#39;(</h3>
		<p>Try navigating to a different tab, or reloading the page. If this problem persists, please contact support.</p>
		<p>{error && error.message}<br /><small>{error && error.stack}</small></p>
	</div>);

export default MainDivBase;
