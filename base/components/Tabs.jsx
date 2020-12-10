import React, { useState } from 'react';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import { space } from '../utils/miscutils';

/**
 * @param {!string} tabId NB: this is what BS calls it
 * @param {string} title This will be the tab label
 */
const Tab = ({tabId, title, children}) => {
	return <TabPane tabId={tabId} title={title}>
		{children}
	</TabPane>
};

/**
 * Shim for switching from react-bootstrap, which has integrated state management for e.g. these tabs, to reactstrap, which doesn't
 * 
 * @param {Tab[]} children
 * @param {?string} activeTabId Only needed if the app is controlling which tab.
 * @param {?Function} setActiveTabId Only needed if the app is controlling which tab.
 */
const Tabs = ({activeTabId, setActiveTabId, defaultTabId, children, ...props}) => {
	// We can manage tab-ID locally with useState() or have it passed in.
	const [localActiveTab, setLocalActiveTab] = useState(defaultTabId);
	let _activeTabId = activeTabId || localActiveTab; // set from outside wins
	let _setActiveTabId = setActiveTabId || setLocalActiveTab;

	// Pull tab key and title out of child Tab items & construct clickable headers
	const navItems = React.Children.map(children, ({ props: { tabId, title } }) => {
		if ( ! tabId) console.error("Tabs.jsx - Tab without an ID",title);
		if ( ! _activeTabId) _activeTabId = tabId; // default to the first if unset
		const active = (_activeTabId === tabId);
		return (
			<NavItem className={space(active&&'active')}>
				<NavLink onClick={() => ( ! active && _setActiveTabId(tabId))}
					className={space(active&&'active')} 
				>
					{title}
				</NavLink>
			</NavItem>
		);
	})

	return <div {...props}>
		<Nav tabs>
			{navItems}
		</Nav>
		<TabContent activeTab={_activeTabId}>
			{children}
		</TabContent>
	</div>
};

export { Tabs, Tab };