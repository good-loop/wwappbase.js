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
import CardAccordion from './CardAccordion'; // Hack: this is to poke CardAccordion into Misc for older code
import {XId} from 'wwutils';
import {LoginLink} from './LoginWidget';

const BasicAccountPage = () => {
	if ( ! Login.isLoggedIn()) {
		return <div><h2>My Account: Please login</h2><LoginLink title='Login' /></div>;
	}

	return (
		<div className=''>
			<h2>My Account</h2>
			<LoginCard />
			<RolesCard />
		</div>
	);
};

const LoginCard = () => {
	return (<Misc.Card title='Login'>
		ID: {Login.getId()} <br />
	</Misc.Card>);
}

const RolesCard = () => {
	let proles =Roles.getRoles();
	let roles = proles.value;

	return (<Misc.Card title='Roles'>
		<p>Roles determine what you can do. E.g. only editors can publish changes.</p>
		{proles.resolved? <p>No role</p> : <Misc.Loading />}
		{roles? roles.map((role, i) => <RoleLine key={i+role} role={role} />) : null}				
	</Misc.Card>);
}

const RoleLine = ({role}) => {
	return <div className='well'>{role}</div>;
};

export {
	BasicAccountPage,
	RolesCard,
	LoginCard
};
