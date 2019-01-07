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
// HACKS
import CardAccordion from './CardAccordion'; // Hack: this is here to poke CardAccordion into Misc for older code
import PropControl from './PropControl'; // Hack: this is here to poke Input into Misc for older code
import {XId} from 'wwutils';
import {LoginLink} from './LoginWidget';
import {setTaskTags} from './TaskList';

const BasicAccountPage = () => {
	if ( ! Login.isLoggedIn()) {
		return <div><h1>My Account: Please login</h1><LoginLink title='Login' /></div>;
	}
	setTaskTags();
	return (
		<div className=''>
			<h1>My Account</h1>
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

// TODO use BS.Well instead for BS3/3 compatibility
const RoleLine = ({role}) => <div className='well'>{role}</div>;

export {
	BasicAccountPage,
	RolesCard,
	LoginCard
};
