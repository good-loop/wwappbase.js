import React from 'react';
import { Nav, NavItem } from 'react-bootstrap';
import Login from 'you-again';

import C from '../CBase';
import DataStore from '../plumbing/DataStore';
import {LoginLink} from './LoginWidget';

// import {XId,yessy,uid} from '../js/util/orla-utils.js';

import Misc from './Misc';

const doLogout = () => {
	Login.logout();
};

/*
The top-right menu
active {boolean} true if on the account page
account {boolean} true if we want to show the account option (true by default), needed by my-loop because it doesn't have an account page but needs logout
logoutLink {string} what page should be loaded after logout ('#dashboard' by default), to allow it to go to the dashboard in portal, but the same page in my-loop
TODO use react for the dropdown state - not bootstrap.js

*/
const AccountMenu = ({pending, active, account=true, logoutLink='#dashboard'}) => {
	if (pending) return <Misc.Loading />;
	if ( ! Login.isLoggedIn()) {
		return (<ul id='top-right-menu' className="nav navbar-nav navbar-right">
			<li>
				<LoginLink />
			</li>
		</ul>);
	}
	let user = Login.getUser();
	return (
		<ul id='top-right-menu' className="nav navbar-nav navbar-right">
			<li className={'dropdown' + (active? ' active' : '')}>
				<a className="dropdown-toggle" 
					data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
					{ user.name || user.xid }&nbsp;
					<span className="caret" />
				</a>
				{ account ? 
					<ul className="dropdown-menu">
						<li><a href="#account">Account</a></li> 
						<li role="separator" className="divider" />
						<li><a href="#dashboard" onClick={() => doLogout()}>Log out</a></li>
					</ul>
				: 
					<ul className="dropdown-menu">
						<li><a href={logoutLink} onClick={() => doLogout()}>Log out</a></li>
					</ul>
				} 
					
			</li>
		</ul>
	);
};

export default AccountMenu;
