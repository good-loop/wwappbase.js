import React, { useState } from 'react';
import { Nav, NavItem, Dropdown, DropdownToggle, DropdownMenu, DropdownItem, NavLink } from 'reactstrap';
import Login from '../youagain';

import C from '../CBase';
import DataStore from '../plumbing/DataStore';
import {LoginLink, RegisterLink, LogoutLink} from './LoginWidget';
import {isMobile} from '../utils/miscutils.ts';

// import {XId,yessy,uid} from '../js/util/orla-utils.js';

import Misc from './Misc';
import { space } from '../utils/miscutils';
import XId from '../data/XId';
import { modifyPage } from '../plumbing/glrouter';


// HACK accommodate # v / routing
const hashLinkChecker = (href) => {
	let noHashHostname = ['my.good-loop.com', 'testmy.good-loop.com', 'localmy.good-loop.com'];
	if (noHashHostname.includes(window.location.hostname)) return href.replace('#', '');
	else return href;
}

/**
The top-right menu
active {boolean} true if on the account page
account {boolean} true if we want to show the account option (true by default), needed by my-loop because it doesn't have an account page but needs logout
logoutLink {string} what page should be loaded after logout ('#dashboard' by default), to allow it to go to the dashboard in portal, but the same page in my-loop
accountMenuItems {?DropdownItem} add optional items to the account menu - used in MyGL/MyData where we show settings etc on the account page body (those don't fit into the layout mobile)
linkType {string} HACK: Set to "C.A" for <C.A /> hrefs, "a" for normal hrefs. Fixes bug in T4G in which it wasn't loading the links correctly (since it's in an iFrame presumably)
*/
const AccountMenu = ({active, accountMenuItems, accountLinkText="Account", canRegister, customLogin, className, logoutLink, onLinkClick, style, small, accountLink, linkType="C.A", ...props}) => {
	const [open, setOpen] = useState(false);
	const onClickFn = () => {
		setOpen(!open);
		onLinkClick && onLinkClick();
	}
	let ChosenLoginLink = customLogin ? customLogin : <LoginLink>Sign in</LoginLink> ;

	// TODO see navbar dropdown
	if ( ! Login.isLoggedIn()) {
		// why justify-content-end??
		return (
			<Nav navbar style={props.style} className={space("justify-content-end", className)}>
				{ ! canRegister && <NavItem id="register-link"><RegisterLink /></NavItem>}
				<NavItem className="login-link">{ChosenLoginLink}</NavItem>
			</Nav>
		);
	}

	let user = Login.getUser();
	const accountHref = accountLink || {};
	const name = small ? ((user.name && user.name.substr(0, 1)) || XId.prettyName(user.xid).substr(0,1)) : (user.name || XId.prettyName(user.xid));

	return (
	<Nav navbar style={style} className={space("account-menu", className)}>
		<Dropdown isOpen={open} toggle={() => setOpen(!open)} nav inNavbar>
			<DropdownToggle nav caret>{name}</DropdownToggle>
			<DropdownMenu>
				<DropdownItem>
					{linkType == "C.A"
						? <C.A href={modifyPage(["account"], accountHref, true, true)} className="nav-link" onClick={onClickFn}>{accountLinkText}</C.A> 
						: <a href={modifyPage(["account"], accountHref, true, true)}  className="nav-link" onClick={onClickFn}>{accountLinkText}</a> 
					}	
				</DropdownItem>
				<DropdownItem divider />
				{accountMenuItems && accountMenuItems.map((item, i) => {
					return <div key={i}>
						<DropdownItem >
						{linkType == "C.A"
							? <C.A href={modifyPage(["account"],{tab: item.page}, true, true)} className="nav-link" onClick={onClickFn}>{item.label}</C.A> 
							: <a href={modifyPage(["account"],{tab: item.page}, true, true)} className="nav-link" onClick={onClickFn}>{item.label}</a> 
						}
						</DropdownItem>
					</div>
				})}
				{accountMenuItems && <DropdownItem divider />}
				<DropdownItem>
					<LogoutLink className="nav-link">Logout</LogoutLink>
				</DropdownItem>
			</DropdownMenu>
		</Dropdown>
	</Nav>
	)
};

export default AccountMenu;
