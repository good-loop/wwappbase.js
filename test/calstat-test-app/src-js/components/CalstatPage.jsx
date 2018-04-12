import React from 'react';
import ReactDOM from 'react-dom';

import SJTest, {assert} from 'sjtest';
import Login from 'you-again';
import {printer} from '../wwappbase-test-output.js';
import {C} from '../wwappbase-test-output.js';
import {Roles} from '../wwappbase-test-output.js';
import {Misc} from '../wwappbase-test-output.js';
import {stopEvent} from 'wwutils';
import {DataStore} from '../wwappbase-test-output.js';
import {Settings} from '../wwappbase-test-output.js';
import {AccountMenu} from '../wwappbase-test-output.js';
import {AccountPage} from '../wwappbase-test-output.js';

const CalstatPage = () => {
	let proles =Roles.getRoles();
	let roles = proles.value;
	return (
		<div className=''>
			<h2>Count My Calendar</h2>
			<PickCalendar />
			<FilterForm />
			<CalstatResults />
			<ShareLink />
			<ShareWidget />
		</div>
	);
};

const PickCalendar = ({}) => {
	const path = ['location', 'params'];
	return (<div>
		<Misc.PropControl label='iCal url' path={path} prop="icalfeed" placeholder="Paste your ical url here" />
		<small>Where to find the ical url? See your calendar's help, e.g. 
			<a href='https://support.google.com/calendar/answer/37648?hl=en' target='_new'>Google help</a>
		</small>
		<a href="#" onClick={e => {
			e.preventDefault(); e.stopPropagation();
			DataStore.setValue(path.concat('icalfeed'), 
				"https://www.google.com/calendar/ical/92v2m458khm50ic03rj3uu95f4%40group.calendar.google.com/private-6451230e4826d67dad83cafa959a738b/basic.ics"
				);
		}} >Edinburgh out-of-office</a>
	</div>);
};

const FilterForm = ({}) => {
	const path = ['location', 'params'];
	return (<form role="form">
	<Misc.PropControl label='Start' path={path} prop='start'/>
	<Misc.PropControl label='End' path={path} prop='end'/>
	<Misc.PropControl label='Filter Keyword(s)' help='This supports OR, -, and "quotes"' path={path} prop='q'/>
	<Misc.PropControl type='checkbox' 
		label='Only count office hours/days' path={path} prop='officeHoursOnly'/>
	<button className='btn btn-primary' onClick={e => stopEvent(e) && countCal()}>Submit</button>
	</form>);
};

const getDataPath = () => {
	let settings = DataStore.getValue('location', 'params');
	let sig = JSON.stringify(settings);
	return ['misc', sig];
};

const countCal = () => {
	// get the data
	// get all the url parameters
	let pvData = DataStore.fetch(getDataPath(), () => {
		return ServerIO.load('/calstat.json',
			{
				data: settings
			}
		);
	});
};

const CalstatResults = ({}) => {
	const dpath = getDataPath();
	let ddata = DataStore.getValue(dpath);
	if ( ! ddata) return null;

	// // cache the url used (since its a good one)
	// var storedJson = window.localStorage.getItem('ical-urls');
	// var icalUrls = storedJson? JSON.parse(storedJson) : [];
	// var urlName = [r.cargo.url,r.cargo.name];
	// if (icalUrls.indexOf(urlName)===-1) {
	// 	icalUrls.push(urlName);
	// }
	// window.localStorage.setItem('ical-urls', JSON.stringify(icalUrls));

	let cargo = ddata.cargo;
	var hours = cargo.hours;
	var overlaps = cargo.overlaps;
	var days = cargo.days;
	var alldays = cargo.alldays;
	var items = cargo.items;
	var breakdown = cargo.breakdown;

	return (<div className='results container'>
	<div className="row">
		<div className='col-md-3'><div id='items' className='stat'>
		<h2>Matching Items</h2>
		<h2><span className='result-items'>{items}</span></h2>
		</div></div>

		<div className='col-md-3'><div id='days' className='stat'>
		<h2>All Day Events</h2>
		<h2><span className='result-alldays'>{alldays}</span></h2>
		</div></div>

		<div className='col-md-3'><div id='hours' className='stat'>
		<h2>Time Slots</h2>
		<h2><span className='result-hours'>{hours}</span> hours</h2>
		</div></div>

		<div className='col-md-3'><div id='overlaps' className='stat'>
			<h2>Overlaps</h2>
			<h2><span className='result-overlaps'>{overlaps}</span> hours</h2>
			<small>These are not counted in hours or total</small>
		</div></div>

		<div className='col-md-3'><div id='total' className='stat'>
		<h2>Total</h2>
		<h2><span className='result-days'>{days}</span> days</h2>
		</div></div>
	</div>
	<div className="row">
		<div className='col-md-6'><div id='logevents' className='logevents'>
		<h2>List of Matching Events</h2>
			<ListEvents log={cargo.log} />
		</div></div>

		<div className='col-md-6'><div id='breakdown' className='stat'>
		<h2>Breakdown</h2>
			<Breakdown breakdown={cargo.breakdown} />
		</div></div>
	</div>
</div>);
};

const ListEvents = ({log}) => {
	if ( ! log) return null;
	return <div><ol>{log.map(e => <li>{e}</li>)}</ol></div>;
};


const Breakdown = ({breakdown}) => {
	if ( ! breakdown) return null;
	var total = _.reduce(_.values(breakdown), function(memo, num){ return memo + num; }, 0);
	return <div>{
		Object.keys(breakdown).map(word => <span>{word} ({breakdown[word]})</span>)
	}</div>;
};

export default CalstatPage;
