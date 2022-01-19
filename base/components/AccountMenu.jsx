import React from 'react';
import { Nav, NavItem, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import Login from '../youagain';

import C from '../CBase';
import DataStore from '../plumbing/DataStore';
import {LoginLink, RegisterLink, LogoutLink} from './LoginWidget';
import {isMobile} from '../utils/miscutils.ts';

// import {XId,yessy,uid} from '../js/util/orla-utils.js';

import Misc from './Misc';

/**
The top-right menu
active {boolean} true if on the account page
account {boolean} true if we want to show the account option (true by default), needed by my-loop because it doesn't have an account page but needs logout
logoutLink {string} what page should be loaded after logout ('#dashboard' by default), to allow it to go to the dashboard in portal, but the same page in my-loop
*/

const AccountMenu = (props) => {
	const {noRegister} = (props || {});

	// TODO see navbar dropdown
	if ( ! Login.isLoggedIn()) {
		return (
			<Nav navbar style={props.style} className="justify-content-end">
				{noRegister ? '' : <NavItem id="register-link"><RegisterLink /></NavItem>}
				<NavItem className="login-link"><LoginLink /></NavItem>
			</Nav>
		);
	}

	let user = Login.getUser();

	return isMobile() ? (
		<MobileMenu {...props} user={user} />
	) : (
		<DesktopMenu {...props} user={user} />
	);
};

const DesktopMenu = ({logoutLink, user, style}) => (
	<Nav navbar style={style} className="justify-content-end">
		<UncontrolledDropdown nav inNavbar>
			<DropdownToggle nav caret>{ user.name || user.xid }</DropdownToggle>
			<DropdownMenu>
				<DropdownItem><C.A href="/account">Account</C.A></DropdownItem>
				<DropdownItem divider />
				<DropdownItem><LogoutLink /></DropdownItem>
			</DropdownMenu>
		</UncontrolledDropdown>
	</Nav>
);

/** Clicking username to expand does not work well on mobile
// Just display all options as part of burger-menu
*/
const MobileMenu = ({logoutLink, user, style}) => (
	<Nav navbar style={style} className="justify-content-end">
		<NavItem>
			<C.A href="/account">{ user.name || user.xid }</C.A>
		</NavItem>
		<NavItem>
			<LogoutLink />
		</NavItem>
	</Nav>
);

export default AccountMenu;
