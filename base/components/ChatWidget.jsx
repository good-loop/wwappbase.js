
import React, { useState } from 'react';
import { Form } from 'reactstrap';
import DataStore from '../plumbing/DataStore';
import { stopEvent } from '../utils/miscutils';
import PropControl from "./PropControl";
import Chat from '../data/Chat';

/**
 * Status: sketch
 * @param {Object} p
 * @param {Chat} p.chat
 */
const ChatWidget = ({chat}) => {	
	if ( ! chat) {
		// no open chat - but allow the user to start one
		chat = {};
	}
	if ( ! chat.lines) chat.lines = [];
	let lines = chat.lines;	

	const onSubmit = e => {
		stopEvent(e);
		console.log(e);
		let text = DataStore.getValue('widget','chat','text');
		if ( ! text) return;
		let line = {from:"user", text};
		chat.lines.push(line);
	};

	return <div className="chat-widget">
		{lines.map(line => <Line key={JSON.stringify(line)} line={line} />)}
		<Form onSubmit={onSubmit}>
			<PropControl path={['widget','chat']} prop='text' placeholder="Type here to talk with chatbot" 			
			/>
		</Form>
	</div>
}

const Line = ({line}) => {
	let isUser = line.from === "user";
	return <div className={"chat-line flex-row", isUser? "user" : "other"}>		
		{ ! isUser && <img src="" className="chat-head" />}
		<div>{line.text}</div>
	</div>;
}

export default ChatWidget;
