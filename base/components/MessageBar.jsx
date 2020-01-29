import React from 'react';

import SJTest from 'sjtest';

import C from '../CBase.js';

// Plumbing
import DataStore from '../plumbing/DataStore';
import Messaging from '../plumbing/Messaging';


/**
 * To add a message: see Messaging.js
 * 
 * This displays messages
 */
const MessageBar = () => {
	// Retrieve messages & filter those intended for a particular page
	let messages = Object.values(DataStore.getValue('misc', 'messages-for-user') || {})
		.filter(m => m.path ? SJTest.match(m.path, DataStore.getValue('location', 'path')) : true);
	
	if (messages && messages.length) {
		// We're likely to get lots of messages on local and test.
		// Put them off to the side so we don't need to clear them away every pageload
		// (We want messages to be difficult to avoid/ignore on production)
		const classes = C.isProduction() ? 'MessageBar container' : 'MessageBar container side';
		return (
			<div className={classes}>
				{messages.map((msg, index) => <MessageBarItem key={'mi'+index} message={msg} />)}
			</div>
		);
	}

	return <div />;
}; // ./Messagebar


const MessageBarItem = ({message}) => {
	if (message.closed) {
		return null;
	}
	let text = message.text;
	// HACK remove the stacktrace which our servers put in for debug
	text = text.replace(/<details>[\s\S]*<\/details>/, "").trim();
	const alertType = message.type === "error" ? "alert alert-danger" : "alert alert-warning";
	return (
		<div className={alertType}>
			{text}
			{Messaging.jsxFromId[message.id]}
			<div className='hidden'>Details {message.details}</div>
			<button onClick={ e => { message.closed=true; DataStore.update(); } } type="button" className="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>
		</div>
	);
};

export default MessageBar;
