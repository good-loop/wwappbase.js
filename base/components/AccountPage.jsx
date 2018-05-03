import React from 'react';
import ReactDOM from 'react-dom';

import SJTest, {assert} from 'sjtest';
import Login from 'you-again';
import printer from '../utils/printer.js';
import C from '../CBase';
import DataStore from '../plumbing/DataStore';
import ServerIO from '../plumbing/ServerIOBase';
import Roles from '../Roles';
import Misc from './Misc';
import {XId} from 'wwutils';
import {LoginLink} from './LoginWidget';

const AccountPage = () => {
	if ( ! Login.isLoggedIn()) {
		return <div><h2>My Account: Please login</h2><LoginLink title='Login' /></div>;
	}
	let proles =Roles.getRoles();
	let roles = proles.value;
	const pvCreditToMe = DataStore.fetch(['list', 'Transfer', 'to:'+Login.getId()], () => {	
		return ServerIO.load('/credit/list', {data: {to: Login.getId()} });
	});	
	// TODO link into My-Loop, and vice-versa
	// TODO store gift aid settings
			// 	<Misc.Card title='Gift Aid'>
			// 	<GiftAidForm />
			// </Misc.Card>
	return (
		<div className=''>
			<h2>My Account</h2>
			<Misc.Card title='Login'>
				ID: {Login.getId()} <br />
				My donations: shown on the <a href='#dashboard'>Dashboard</a>
			</Misc.Card>			
			<Misc.Card title='Roles'>
				<p>Roles determine what you can do. E.g. only editors can publish changes.</p>
				{proles.resolved? <p>No role</p> : <Misc.Loading />}
				{roles? roles.map((role, i) => <RoleLine key={i+role} role={role} />) : null}				
			</Misc.Card>
		</div>
	);
};

const RoleLine = ({role}) => {
	return <div className='well'>{role}</div>;
};

export default AccountPage;
