import React, { useState } from 'react';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';


const Tab = ({tabId, title, children}) => {
	return <TabPane tabId={tabId} title={title}>
		{children}
	</TabPane>
};

/**
 * Shim for switching from react-bootstrap, which has integrated state management for e.g. these tabs, to reactstrap, which doesn't
 */
const Tabs = ({defaultTabId, children, ...props}) => {
	const [activeTab, setActiveTab] = useState(defaultTabId);

	// Pull tab key and title out of child Tab items & construct clickable headers
	// 
	const navItems = React.Children.map(children, ({ props: { tabId, title } }) => {
		const active = (activeTab === tabId);
		return (
			<NavItem className={active ? 'active' : ''}>
				<NavLink onClick={() => (!active && setActiveTab(tabId))}>
					{title}
				</NavLink>
			</NavItem>
		);
	})

	return <div {...props}>
		<Nav tabs>
			{navItems}
		</Nav>
		<TabContent activeTab={activeTab}>
			{children}
		</TabContent>
	</div>
};

export { Tabs, Tab };