import React from 'react';
import ReactDOM from 'react-dom';

import SJTest, {match, assert} from 'sjtest';

import printer from '../utils/printer.js';
// Plumbing
import DataStore from '../plumbing/DataStore';
import C from '../CBase.js';
import Messaging from '../plumbing/Messaging';

/**
 * To add a message: see Messaging.js
 * 
 * This displays messages
 */
const MessageBar = () => {
	let messages = Object.values(DataStore.getValue('misc', 'messages-for-user') || {});	
	// filter by page path?
	messages = messages.filter(m => m.path? match(m.path, DataStore.getValue('location','path')) : true);

	if ( ! messages || messages.length===0) return <div></div>;
	const messageUI = messages.map( (m, mi) => <MessageBarItem key={'mi'+mi} message={m} /> );
	return (<div className='MessageBar container'>{messageUI}</div>);
}; // ./Messagebar


const MessageBarItem = ({message}) => {
	if (message.closed) {
		return (<div></div>);
	}
	const alertType = message.type==="error"? "alert alert-danger" : "alert alert-warning";
	return (
		<div className={alertType}>
			{message.text}
			{Messaging.jsxFromId[message.id]}
			<div className='hidden'>Details {message.details}</div>
			<button onClick={ e => { message.closed=true; DataStore.update(); } } type="button" className="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>
		</div>
	);
};

export default MessageBar;
