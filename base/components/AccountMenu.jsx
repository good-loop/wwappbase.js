import React from 'react';
import { Nav, NavItem, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, NavLink } from 'reactstrap';
import Login from '../youagain';

import C from '../CBase';
import DataStore from '../plumbing/DataStore';
import {LoginLink, RegisterLink, LogoutLink} from './LoginWidget';
import {isMobile} from '../utils/miscutils.ts';

// import {XId,yessy,uid} from '../js/util/orla-utils.js';

import Misc from './Misc';
import { space } from '../utils/miscutils';
import XId from '../data/XId';

/**
The top-right menu
active {boolean} true if on the account page
account {boolean} true if we want to show the account option (true by default), needed by my-loop because it doesn't have an account page but needs logout
logoutLink {string} what page should be loaded after logout ('#dashboard' by default), to allow it to go to the dashboard in portal, but the same page in my-loop
*/

const HashLinkChecker = (herf) => {
	let noHashHostname = ['my.good-loop.com', 'testmy.good-loop.com', 'localmy.good-loop.com'];
	if (noHashHostname.includes(window.location.hostname)) return herf.replace('#', '');
	else return herf;
}

const AccountMenu = ({canRegister, className, ...props}) => {

	// TODO see navbar dropdown
	if ( ! Login.isLoggedIn()) {
		// why justify-content-end??
		return (
			<Nav navbar style={props.style} className={space("justify-content-end", className)}>
				{ ! canRegister && <NavItem id="register-link"><RegisterLink /></NavItem>}
				<NavItem className="login-link"><LoginLink>Sign in</LoginLink></NavItem>
			</Nav>
		);
	}

	let user = Login.getUser();


	return <DesktopMenu {...props} user={user} />;
};

const DesktopMenu = ({logoutLink, noHashLink, user, style, className, small}) => {
	let accountHerf = HashLinkChecker('/#account');
	const name = small ? ((user.name && user.name.substr(0, 1)) || XId.prettyName(user.xid).substr(0,1)) : (user.name || XId.prettyName(user.xid));

	return (
	<Nav navbar style={style} className={space("account-menu", className)}>
		<UncontrolledDropdown nav inNavbar>
			<DropdownToggle nav caret>{name}</DropdownToggle>
			<DropdownMenu>
				<C.A href={accountHref} className="nav-link"><DropdownItem>Account</DropdownItem></C.A>
				<DropdownItem divider />
				<LogoutLink className="nav-link"><DropdownItem>Logout</DropdownItem></LogoutLink>
			</DropdownMenu>
		</UncontrolledDropdown>
	</Nav>
	)
};

export default AccountMenu;
