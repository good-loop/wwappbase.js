import React from 'react';

import Login from '../youagain';
import C from '../CBase';
import DataStore from '../plumbing/DataStore';
import ServerIO from '../plumbing/ServerIOBase';
import Roles from '../Roles';
import Misc from './Misc';
// HACKS
import CardAccordion from './CardAccordion'; // Hack: this is here to poke CardAccordion into Misc for older code
import PropControl from './PropControl'; // Hack: this is here to poke Input into Misc for older code
import XId from '../data/XId';
import {LoginLink} from './LoginWidget';
import {setTaskTags} from './TaskList';
import AboutPage from './AboutPage';
import { Card } from 'reactstrap';
import ShareWidget, { ShareLink } from './ShareWidget';

const BasicAccountPage = () => {
	if (!Login.isLoggedIn()) {
		return <div><h1>My Account: Please login</h1><LoginLink title="Login" /></div>;
	}
	
	setTaskTags();
	return (
		<div className=''>
			<h1>My Account</h1>
			<LoginCard />
			<RolesCard />
			
			{/* minor todo <Card>
				<AboutPage />
			</Card> */}
		</div>
	);
};

const LoginCard = () => {
	return (<Misc.Card title="Login">
		ID: {Login.getId()} <br />
	</Misc.Card>);
}

const RolesCard = () => {
	let proles =Roles.getRoles();
	let roles = proles.value;

	return (<Misc.Card title="Roles">
		<p>Roles determine what you can do. E.g. only editors can publish changes.</p>
		{roles? roles.map((role, i) => <RoleLine key={i+role} role={role} />) : <Misc.Loading />}
	</Misc.Card>);
}


const RoleLine = ({role}) => {
	return <div className="badge badge-pill badge-info">{role}
		{(Roles.isDev() || Roles.iCan("admin")) && <><ShareLink shareId={"role:"+role}/><ShareWidget key={role} shareId={"role:"+role} /></>}
	</div>;
}

export {
	BasicAccountPage,
	RolesCard,
	LoginCard
};
